"""API protegida para el diario de Viaje a Japón.

- Mantiene GET /api/posts compatible con el frontend actual.
- Requiere autenticación para crear, editar y borrar entradas.
- No depende de flask-cors; gestiona CORS con una lista explícita de orígenes.
- Usa tokens aleatorios guardados en SQLite solo como hashes y con caducidad.
"""

import hashlib
import os
import secrets
import sqlite3
import threading
import time
from collections import defaultdict, deque
from functools import wraps
from urllib.parse import urlparse

from flask import Flask, current_app, jsonify, request

def _load_env_file():
    """Load simple KEY=VALUE settings from the .env beside this file (stdlib only)."""
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if not os.path.isfile(env_path):
        return
    try:
        with open(env_path, "r", encoding="utf-8-sig") as env_file:
            for raw_line in env_file:
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
                    value = value[1:-1]
                if key and key not in os.environ:
                    os.environ[key] = value
    except OSError:
        # Config can still be supplied by real environment variables.
        pass


_load_env_file()

TOKEN_TTL_SECONDS = 8 * 60 * 60
LOGIN_WINDOW_SECONDS = 15 * 60
LOGIN_MAX_FAILURES = 5
MAX_TITLE_LENGTH = 120
MAX_CONTENT_LENGTH = 20_000
MAX_IMAGE_URL_LENGTH = 2_048
MAX_CATEGORY_LENGTH = 40

# Limitador sencillo en memoria. En una configuración con Cloudflare Tunnel,
# request.remote_addr puede ser igual para muchos clientes; por eso el límite
# se comparte por dirección observada y no se confía en X-Forwarded-For.
_login_failures = defaultdict(deque)
_login_lock = threading.Lock()


def _parse_origins(value):
    return {item.strip().rstrip("/") for item in (value or "").split(",") if item.strip()}


def _absolute_database_path(path):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if not os.path.isabs(path):
        path = os.path.join(base_dir, path)
    return os.path.abspath(path)


def _connect(database_path=None):
    path = database_path or current_app.config["DATABASE"]
    conn = sqlite3.connect(path, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 10000")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(database_path):
    """Create the current schema without deleting existing diary entries."""
    parent = os.path.dirname(os.path.abspath(database_path))
    os.makedirs(parent, exist_ok=True)
    conn = sqlite3.connect(database_path, timeout=10)
    try:
        conn.execute("PRAGMA journal_mode = WAL")
        conn.execute(
            """CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                contenido TEXT NOT NULL,
                imagen TEXT,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                categoria TEXT NOT NULL DEFAULT 'Diario'
            )"""
        )
        # Migración compatible: añadir categoría a diarios creados con la versión anterior.
        columns = {row[1] for row in conn.execute("PRAGMA table_info(posts)").fetchall()}
        if "categoria" not in columns:
            conn.execute("ALTER TABLE posts ADD COLUMN categoria TEXT NOT NULL DEFAULT 'Diario'")
        conn.execute(
            """CREATE TABLE IF NOT EXISTS admin_sessions (
                token_hash TEXT PRIMARY KEY,
                expires_at INTEGER NOT NULL,
                created_at INTEGER NOT NULL
            )"""
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at)")
        conn.commit()
    finally:
        conn.close()


def _json_error(message, status):
    return jsonify({"error": message}), status


def _get_json_object():
    if not request.is_json:
        return None, _json_error("El cuerpo debe ser JSON (Content-Type: application/json).", 415)
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None, _json_error("El JSON debe ser un objeto.", 400)
    return data, None


def _validate_post(data, partial=False):
    """Validate post fields. Returns (clean_data, error_response)."""
    clean = {}
    for field, max_length in (("titulo", MAX_TITLE_LENGTH), ("contenido", MAX_CONTENT_LENGTH)):
        if partial and field not in data:
            continue
        value = data.get(field)
        if not isinstance(value, str):
            return None, _json_error("Los campos 'titulo' y 'contenido' deben ser texto.", 400)
        value = value.strip()
        if not value:
            return None, _json_error("El campo '{}' no puede estar vacío.".format(field), 400)
        if len(value) > max_length:
            return None, _json_error(
                "El campo '{}' supera el máximo de {} caracteres.".format(field, max_length), 400
            )
        clean[field] = value

    if "imagen" in data or not partial:
        image_url = data.get("imagen", "")
        if image_url is None:
            image_url = ""
        if not isinstance(image_url, str):
            return None, _json_error("El campo 'imagen' debe ser una URL HTTPS o texto vacío.", 400)
        image_url = image_url.strip()
        if len(image_url) > MAX_IMAGE_URL_LENGTH:
            return None, _json_error("La URL de la imagen es demasiado larga.", 400)
        if image_url:
            parsed = urlparse(image_url)
            if parsed.scheme.lower() != "https" or not parsed.netloc or parsed.username or parsed.password:
                return None, _json_error("La imagen debe usar una URL HTTPS válida.", 400)
        clean["imagen"] = image_url

    if "categoria" in data or not partial:
        category = data.get("categoria", "Diario")
        if not isinstance(category, str):
            return None, _json_error("El campo 'categoria' debe ser texto.", 400)
        category = category.strip() or "Diario"
        if len(category) > MAX_CATEGORY_LENGTH:
            return None, _json_error("La categoría no puede superar {} caracteres.".format(MAX_CATEGORY_LENGTH), 400)
        clean["categoria"] = category

    if partial and not clean:
        return None, _json_error("No hay campos válidos para actualizar.", 400)
    return clean, None


def _token_hash(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _valid_admin_token(token):
    if not token or len(token) > 256:
        return False
    now = int(time.time())
    conn = _connect()
    try:
        row = conn.execute(
            "SELECT 1 FROM admin_sessions WHERE token_hash = ? AND expires_at > ?",
            (_token_hash(token), now),
        ).fetchone()
        return row is not None
    finally:
        conn.close()


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        scheme, separator, token = auth_header.partition(" ")
        if scheme.lower() != "bearer" or not separator or not token.strip():
            return _json_error("Necesitas iniciar sesión para realizar esta acción.", 401)
        if not _valid_admin_token(token.strip()):
            return _json_error("La sesión no es válida o ha caducado. Inicia sesión otra vez.", 401)
        return view(*args, **kwargs)

    return wrapped


def _login_is_limited(client_key, now):
    with _login_lock:
        failures = _login_failures[client_key]
        while failures and now - failures[0] > LOGIN_WINDOW_SECONDS:
            failures.popleft()
        return len(failures) >= LOGIN_MAX_FAILURES


def _record_login_failure(client_key, now):
    with _login_lock:
        failures = _login_failures[client_key]
        while failures and now - failures[0] > LOGIN_WINDOW_SECONDS:
            failures.popleft()
        failures.append(now)


def _clear_login_failures(client_key):
    with _login_lock:
        _login_failures.pop(client_key, None)


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.update(
        MAX_CONTENT_LENGTH=1_000_000,
        DATABASE=_absolute_database_path(os.environ.get("DATABASE_PATH", "diario_viajes.db")),
        ADMIN_PASSWORD=os.environ.get("ADMIN_PASSWORD", ""),
        FRONTEND_ORIGINS=_parse_origins(
            os.environ.get(
                "FRONTEND_ORIGINS",
                "http://localhost:5500,http://127.0.0.1:5500",
            )
        ),
        TESTING=False,
    )
    if test_config:
        app.config.update(test_config)
        app.config["FRONTEND_ORIGINS"] = set(app.config.get("FRONTEND_ORIGINS", set()))
    app.config["DATABASE"] = _absolute_database_path(app.config["DATABASE"])
    init_db(app.config["DATABASE"])

    if app.config["ADMIN_PASSWORD"] and len(app.config["ADMIN_PASSWORD"]) < 14:
        raise RuntimeError("ADMIN_PASSWORD debe tener al menos 14 caracteres.")

    @app.after_request
    def add_security_headers(response):
        origin = request.headers.get("Origin")
        if origin and origin.rstrip("/") in current_app.config["FRONTEND_ORIGINS"]:
            response.headers["Access-Control-Allow-Origin"] = origin.rstrip("/")
            response.headers.add("Vary", "Origin")
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Max-Age"] = "600"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.errorhandler(413)
    def request_too_large(_error):
        return _json_error("La petición es demasiado grande (máximo 1 MB).", 413)

    @app.errorhandler(404)
    def not_found(_error):
        return _json_error("Recurso no encontrado.", 404)

    @app.errorhandler(500)
    def internal_error(_error):
        return _json_error("Error interno del servidor.", 500)

    @app.route("/api/health", methods=["GET"])
    def health():
        # No revelar rutas locales, credenciales ni detalles de infraestructura.
        return jsonify({"status": "ok"}), 200

    @app.route("/api/auth/login", methods=["POST"])
    def login():
        configured_password = current_app.config.get("ADMIN_PASSWORD", "")
        if not configured_password:
            return _json_error("El acceso de administración no está configurado en el servidor.", 503)

        client_key = request.remote_addr or "unknown"
        now = int(time.time())
        if _login_is_limited(client_key, now):
            return _json_error("Demasiados intentos. Espera 15 minutos antes de volver a probar.", 429)

        data, error = _get_json_object()
        if error:
            return error
        supplied_password = data.get("password")
        if not isinstance(supplied_password, str) or not secrets.compare_digest(supplied_password, configured_password):
            _record_login_failure(client_key, now)
            return _json_error("Contraseña incorrecta.", 401)

        _clear_login_failures(client_key)
        token = secrets.token_urlsafe(32)
        expires_at = now + TOKEN_TTL_SECONDS
        conn = _connect()
        try:
            conn.execute("DELETE FROM admin_sessions WHERE expires_at <= ?", (now,))
            conn.execute(
                "INSERT INTO admin_sessions (token_hash, expires_at, created_at) VALUES (?, ?, ?)",
                (_token_hash(token), expires_at, now),
            )
            conn.commit()
        except sqlite3.Error:
            current_app.logger.exception("No se pudo crear la sesión de administración")
            return _json_error("No se pudo iniciar sesión por un error interno.", 500)
        finally:
            conn.close()
        return jsonify({"token": token, "token_type": "Bearer", "expires_in": TOKEN_TTL_SECONDS}), 200

    @app.route("/api/auth/logout", methods=["POST"])
    @admin_required
    def logout():
        auth_header = request.headers.get("Authorization", "")
        _scheme, _separator, token = auth_header.partition(" ")
        conn = _connect()
        try:
            conn.execute("DELETE FROM admin_sessions WHERE token_hash = ?", (_token_hash(token.strip()),))
            conn.commit()
        finally:
            conn.close()
        return jsonify({"status": "success", "message": "Sesión cerrada."}), 200

    @app.route("/api/auth/me", methods=["GET"])
    @admin_required
    def auth_me():
        return jsonify({"authenticated": True}), 200

    @app.route("/api/posts", methods=["GET"])
    def list_posts():
        conn = _connect()
        try:
            rows = conn.execute(
                "SELECT id, titulo, contenido, imagen, fecha, categoria FROM posts ORDER BY fecha DESC, id DESC"
            ).fetchall()
            return jsonify([dict(row) for row in rows]), 200
        except sqlite3.Error:
            current_app.logger.exception("No se pudieron consultar las entradas")
            return _json_error("No se pudieron cargar las entradas.", 500)
        finally:
            conn.close()

    @app.route("/api/posts", methods=["POST"])
    @admin_required
    def create_post():
        data, error = _get_json_object()
        if error:
            return error
        clean, error = _validate_post(data)
        if error:
            return error
        conn = _connect()
        try:
            cursor = conn.execute(
                "INSERT INTO posts (titulo, contenido, imagen, categoria) VALUES (?, ?, ?, ?)",
                (clean["titulo"], clean["contenido"], clean["imagen"], clean["categoria"]),
            )
            conn.commit()
            post_id = cursor.lastrowid
            row = conn.execute(
                "SELECT id, titulo, contenido, imagen, fecha, categoria FROM posts WHERE id = ?", (post_id,)
            ).fetchone()
            return jsonify({"status": "success", "id": post_id}), 201
        except sqlite3.Error:
            current_app.logger.exception("No se pudo crear la entrada")
            return _json_error("No se pudo crear la entrada.", 500)
        finally:
            conn.close()

    @app.route("/api/posts/<int:post_id>", methods=["GET"])
    def get_post(post_id):
        conn = _connect()
        try:
            row = conn.execute(
                "SELECT id, titulo, contenido, imagen, fecha, categoria FROM posts WHERE id = ?", (post_id,)
            ).fetchone()
            if row is None:
                return _json_error("Entrada no encontrada.", 404)
            return jsonify(dict(row)), 200
        except sqlite3.Error:
            current_app.logger.exception("No se pudo consultar la entrada")
            return _json_error("No se pudo cargar la entrada.", 500)
        finally:
            conn.close()

    @app.route("/api/posts/<int:post_id>", methods=["PUT"])
    @admin_required
    def update_post(post_id):
        data, error = _get_json_object()
        if error:
            return error
        clean, error = _validate_post(data, partial=True)
        if error:
            return error

        allowed = {"titulo", "contenido", "imagen", "categoria"}
        fields = [field for field in ("titulo", "contenido", "imagen", "categoria") if field in clean and field in allowed]
        assignments = ", ".join("{} = ?".format(field) for field in fields)
        values = [clean[field] for field in fields]
        values.append(post_id)
        conn = _connect()
        try:
            cursor = conn.execute("UPDATE posts SET {} WHERE id = ?".format(assignments), values)
            conn.commit()
            if cursor.rowcount == 0:
                return _json_error("Entrada no encontrada.", 404)
            row = conn.execute(
                "SELECT id, titulo, contenido, imagen, fecha, categoria FROM posts WHERE id = ?", (post_id,)
            ).fetchone()
            return jsonify(dict(row)), 200
        except sqlite3.Error:
            current_app.logger.exception("No se pudo actualizar la entrada")
            return _json_error("No se pudo actualizar la entrada.", 500)
        finally:
            conn.close()

    @app.route("/api/posts/<int:post_id>", methods=["DELETE"])
    @admin_required
    def delete_post(post_id):
        conn = _connect()
        try:
            cursor = conn.execute("DELETE FROM posts WHERE id = ?", (post_id,))
            conn.commit()
            if cursor.rowcount == 0:
                return _json_error("Entrada no encontrada.", 404)
            return jsonify({"status": "success", "deleted_id": post_id}), 200
        except sqlite3.Error:
            current_app.logger.exception("No se pudo borrar la entrada")
            return _json_error("No se pudo borrar la entrada.", 500)
        finally:
            conn.close()

    return app


app = create_app()

if __name__ == "__main__":
    # Cloudflare Tunnel debe apuntar a http://127.0.0.1:5000.
    # No usar debug=True ni exponer el servidor Flask directamente a Internet.
    port = int(os.environ.get("APP_PORT", "5000"))
    app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False)
