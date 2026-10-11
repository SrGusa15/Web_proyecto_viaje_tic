#  Viaje a Japón 2027 · Memoria Técnica del Proyecto Web

Sitio web del proyecto escolar **"Viaje Fin de Curso: Japón 2027"**, desarrollado para la asignatura de **Tecnologías de la Información y la Comunicación (TIC)**.

🌐 **Web en producción:** https://srgusa15.github.io/Web_proyecto_viaje_tic/index.html

---

## Índice

1. [Descripción general](#1-descripción-general)
2. [Tecnologías empleadas](#2-tecnologías-empleadas)
3. [Estructura del repositorio](#3-estructura-del-repositorio)
4. [Estructura del sitio (sitemap)](#4-estructura-del-sitio-sitemap)
5. [Funcionalidades JavaScript](#5-funcionalidades-javascript)
6. [Sistema de financiación (tienda + Microsoft Forms)](#6-sistema-de-financiación-tienda--microsoft-forms)
7. [Diseño, UX y accesibilidad](#7-diseño-ux-y-accesibilidad)
8. [Cumplimiento de la rúbrica TIC](#8-cumplimiento-de-la-rúbrica-tic)
9. [Despliegue y alojamiento](#9-despliegue-y-alojamiento)
10. [Cómo ejecutarlo en local](#10-cómo-ejecutarlo-en-local)
11. [Limitaciones conocidas y mejoras futuras](#11-limitaciones-conocidas-y-mejoras-futuras)

---

## 1. Descripción general

La web centraliza toda la información del viaje escolar de **7 días** a Japón (Tokio, Hakone, Kioto y Nara):

- Cuenta atrás hasta el despegue.
- Logística: vuelos y alojamientos.
- Itinerario con **mapa interactivo** y línea de tiempo día a día.
- **Tienda escolar** para financiar el viaje.
- **Blog** del viaje, pensado para alojarse en un servidor local.
- **Panel TIC** con la justificación técnica y de la rúbrica.

Es un proyecto **100 % front-end**: sin frameworks ni backend propio, lo que garantiza un código limpio, ligero y fácil de mantener.

---

## 2. Tecnologías empleadas

| Tecnología | Uso en el proyecto |
|---|---|
| **HTML5 semántico** | Estructura con `<nav>`, `<header>`, `<section>` y `<footer>`, para mejorar accesibilidad y SEO. |
| **CSS3** | Variables CSS (*custom properties*) para la paleta de colores y los temas; Flexbox y CSS Grid para el layout; animaciones `@keyframes`; *media queries* para el diseño responsive. |
| **JavaScript (ES6)** | Manipulación del DOM, cuenta atrás, tema oscuro persistente, menú móvil, efecto sakura, cálculo de la tienda. |
| **Leaflet.js 1.9.4** | Mapa interactivo del itinerario. |
| **CARTO (capa raster *Voyager*)** | Teselas del mapa base. |
| **Font Awesome 6.4** | Iconografía de toda la web (vía CDN). |
| **Microsoft Forms** | Recogida de pedidos de la tienda (servicio externo). |
| **Git + GitHub Pages** | Control de versiones y despliegue. |

---

## 3. Estructura del repositorio

```
Web_proyecto_viaje_tic/
├── index.html          # Inicio + cuenta atrás + efecto sakura
├── logistica.html      # Vuelos y alojamientos
├── itinerario.html     # Mapa interactivo + timeline
├── tienda.html         # Tienda / financiación
├── blog.html           # Blog del viaje (servidor local)
├── proyecto-tic.html   # Panel TIC: rúbrica y ficha técnica
├── css/
│   └── style.css       # Estilos globales, temas, responsive
├── js/
│   ├── main.js         # Lógica común: tema, menú, cuenta atrás, sakura, tienda
│   └── map.js          # Inicialización del mapa Leaflet (solo itinerario)
└── README.md
```

La separación en carpetas `css/` y `js/` y la **carga condicional** de scripts (`map.js` solo se incluye en `itinerario.html`) facilitan el mantenimiento. Además, `main.js` comprueba que existan los elementos del DOM antes de usarlos, de modo que el mismo archivo funciona en todas las páginas sin errores.

---

## 4. Estructura del sitio (sitemap)

Todas las páginas comparten una **barra de navegación sticky** (con menú hamburguesa en móvil y botón de tema) y un mismo pie de página.

| Página | Archivo | Contenido |
|---|---|---|
| **Inicio** | `index.html` | Presentación del destino, **cuenta atrás dinámica** hasta el despegue y **efecto de pétalos de sakura** cayendo. |
| **Logística** | `logistica.html` | Tarjetas con los vuelos (Iberia, MAD ⇄ NRT: IB281 / IB282) y el alojamiento en Tokio (Sakura Hostel Asakusa) y Kioto (Piece Hostel Sanjo). |
| **Itinerario** | `itinerario.html` | Mapa interactivo con marcadores y *popups* + **timeline vertical** con la planificación por días. |
| **Tienda** | `tienda.html` | Tienda escolar con cálculo de carrito en tiempo real y redirección a Microsoft Forms. |
| **Blog** | `blog.html` | Punto de acceso al diario del viaje, preparado para alojarse en un servidor local (en preparación). |
| **Panel TIC** | `proyecto-tic.html` | Meta-documentación: cumplimiento de rúbrica, ficha técnica y enlace al código fuente en GitHub. |

### Ruta del viaje

| Días | Destino | Actividades principales |
|---|---|---|
| 1–2 | **Tokio** (Shibuya, Asakusa, Akihabara) | Llegada a Narita, cruce de Shibuya, templo Senso-ji, electrónica en Akihabara. |
| 3 | **Hakone y Monte Fuji** | Excursión por paisajes volcánicos y vistas al Fuji. |
| 4–5 | **Kioto** (Fushimi Inari) | Shinkansen a Kioto y recorrido por los toriis rojos de Fushimi Inari-Taisha. |
| 6 | **Nara** | Parque de los Ciervos y templo Todai-ji. |
| 7 | **Aereopuerto** | Reflexión final y vuelta a casa. |

---

## 5. Funcionalidades JavaScript

### 5.1 Cuenta atrás (`main.js`)
Calcula cada segundo la diferencia entre la hora actual y la fecha objetivo (**1 de abril de 2027, 11:30**, hora de salida del vuelo) y actualiza días, horas, minutos y segundos en el DOM. Al llegar a cero detiene el intervalo y muestra el mensaje *"¡El avión ya ha despegado!"*. Solo se ejecuta si existen los elementos del contador (página de inicio).

### 5.2 Modo oscuro "Tokyo Night" con persistencia
- El botón de la barra de navegación alterna la clase `tokyo-night` en el `<body>`, que redefine las variables CSS (`--light-bg`, `--card-bg`, `--text`, `--secondary`, `--primary`).
- La preferencia se guarda en **`localStorage`** (`theme: tokyo | light`).
- Un bloque al inicio de `main.js` aplica el tema guardado **antes** de que se pinte la página, evitando el parpadeo en blanco (*flash-of-white*) al navegar entre secciones.
- El icono cambia entre luna 🌙 y sol ☀️ según el estado.

### 5.3 Menú hamburguesa responsive
En pantallas de hasta 768 px los enlaces se ocultan y se despliegan con el botón de menú, que alterna entre los iconos de barras y de cierre.

### 5.4 Efecto Sakura
Genera cada 400 ms un pétalo (`div.sakura-petal`) con tamaño, posición y duración de caída aleatorios, animado con `@keyframes fall`. Cada pétalo se elimina del DOM a los 9 s para no acumular elementos. El contenedor tiene `pointer-events: none`, por lo que no interfiere con los clics. Solo se activa en la página de inicio.

### 5.5 Mapa interactivo (`map.js`)
Inicializa un mapa Leaflet centrado en Japón con teselas *Voyager* de CARTO y cuatro marcadores (Tokio, Hakone, Kioto y Nara), cada uno con un *popup* que indica los días correspondientes.

---

## 6. Sistema de financiación (tienda + Microsoft Forms)

Al no disponer de backend (bases de datos o servidor de procesamiento), la tienda usa una **arquitectura serverless híbrida**:

| Producto | Opciones |
|---|---|
| Sudadera Sakura | 1 ud. (25 €) · 2 uds. (50 €) |
| Taza Conmemorativa | 1 ud. (10 €) · 2 uds. (20 €) |
| Papeleta de sorteo (cesta tecnológica) | 1 (3 €) · 5 (15 €) · 10 (30 €) |

1. **Cálculo en tiempo real:** `calcTotal()` suma los valores de los `<select>` y actualiza el total sin recargar la página.
2. **Validación:** `sendOrder()` bloquea el proceso y avisa con una alerta si el total es 0 €.
3. **Pasarela externa:** con un total válido, el usuario es redirigido a **Microsoft Forms**, donde indica nombre, curso y método de pago. Las respuestas se recogen en un Excel en la nube, evitando gestionar datos personales en la propia web.

---

## 7. Diseño, UX y accesibilidad

- **Paleta corporativa** (rojo `#D90429`, azul oscuro `#2B2D42`) gestionada con variables CSS.
- **Diseño responsive** con CSS Grid (`auto-fit` / `minmax`) y Flexbox.
- **Navegación sticky** siempre visible y con indicador de la página activa (`.active`).
- **Tarjetas con efecto *hover*** y cabeceras con imagen de fondo y degradado para asegurar la legibilidad del texto.
- **Idioma declarado** (`lang="es"`), `alt` en las imágenes y `title` en los botones de icono.
- La propia **ruta del viaje está pensada para personas con movilidad reducida**.

---

## 8. Cumplimiento de la rúbrica TIC

| Criterio | Cómo se cumple |
|---|---|
| **Sostenibilidad** | Uso de la red ferroviaria eléctrica (JR Pass) para los desplazamientos internos, reduciendo la huella de carbono. |
| **Accesibilidad** | Ruta adaptada para personas con movilidad reducida; HTML semántico y diseño responsive. |
| **Gestión del proyecto** | Planificación temporal con **Microsoft Project** y control de costes en **Excel**. |
| **Desarrollo web** | Arquitectura modular (`css/`, `js/`), API de mapas, manipulación del DOM y tema persistente con `localStorage`. |
| **Servidor para el Blog** | Preparación de la infraestructura para alojar el diario de viaje en un servidor local. |

---

## 9. Despliegue y alojamiento

El código está versionado con **Git** y publicado con **GitHub Pages** desde la rama `main`, lo que ofrece:

- Servidor web estático de alta disponibilidad.
- **Despliegue continuo:** cada `push` a `main` actualiza la web automáticamente.
- **HTTPS** (SSL/TLS) nativo, también para la redirección a Microsoft Forms.

> El **blog** está planteado para alojarse en un **servidor local independiente** (no en GitHub Pages). La página `blog.html` actúa como punto de acceso y está en fase de preparación.

---

## 10. Cómo ejecutarlo en local

No requiere instalación ni dependencias (las librerías se cargan por CDN).

```bash
# 1. Clonar el repositorio
git clone https://github.com/SrGusa15/Web_proyecto_viaje_tic.git
cd Web_proyecto_viaje_tic

# 2. Abrir index.html en el navegador, o servirlo en local:
python -m http.server 8000
# → http://localhost:8000
```

Se necesita conexión a internet para cargar Font Awesome, Leaflet, las teselas del mapa y las imágenes de Unsplash.

---

## 11. Limitaciones conocidas y mejoras futuras

- **Clave de CARTO visible:** al ser una web estática, la clave del mapa (`map.js`) es pública. Al no tener hosting propio y depender de github pages esto no se puede corregir
- **Blog:** pendiente de conectar con el servidor local y publicar contenido (fotos, anécdotas y estado del servidor).

---

<p align="center">Proyecto Escolar de Tecnologías de la Información y la Comunicación (TIC) · Viaje a Japón 2027</p>
