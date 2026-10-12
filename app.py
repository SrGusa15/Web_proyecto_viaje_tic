import sqlite3
from flask import Flask, request, jsonify

app = Flask(__name__)

DATABASE = "diario_viajes.db"

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            contenido TEXT NOT NULL,
            imagen TEXT,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

@app.route('/api/posts', methods=['GET', 'POST', 'OPTIONS'])
def handle_posts():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    if request.method == 'GET':
        try:
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            cursor.execute("SELECT id, titulo, contenido, imagen, fecha FROM posts ORDER BY fecha DESC")
            rows = cursor.fetchall()
            posts = [{"id": row[0], "titulo": row[1], "contenido": row[2], "imagen": row[3], "fecha": row[4]} for row in rows]
            conn.close()
            return jsonify(posts), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    if request.method == 'POST':
        data = request.get_json()
        if not data or 'titulo' not in data or 'contenido' not in data:
            return jsonify({"error": "Faltan datos"}), 400
        
        imagen_url = data.get('imagen', '')
        
        try:
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            cursor.execute("INSERT INTO posts (titulo, contenido, imagen) VALUES (?, ?, ?)", 
                           (data['titulo'], data['contenido'], imagen_url))
            conn.commit()
            conn.close()
            return jsonify({"status": "success"}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=False)
