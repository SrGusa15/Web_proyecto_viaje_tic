Memoria Técnica del Proyecto Web: Viaje a Japón 2027

Este documento detalla el desarrollo, la arquitectura y las soluciones técnicas implementadas en la página web del proyecto escolar "Viaje a Japón 2027" para la asignatura de Tecnologías de la Información y la Comunicación (TIC).
1. Arquitectura y Tecnologías Empleadas

El proyecto se ha desarrollado íntegramente utilizando tecnologías web estándar (Front-End) sin dependencia de frameworks pesados, garantizando un rendimiento óptimo y un código limpio.

    HTML5 Semántico: Estructuración del contenido utilizando etiquetas modernas (<nav>, <header>, <section>, <footer>) para mejorar la accesibilidad y el SEO.

    CSS3 Avanzado:

        Uso de CSS Variables (Custom Properties) para gestionar la paleta de colores corporativa y facilitar la implementación de temas visuales.

        Diseño Responsive mediante Flexbox, CSS Grid y Media Queries (@media (max-width: 768px)), asegurando la correcta visualización en dispositivos móviles (incluyendo un menú hamburguesa interactivo).

    JavaScript (ES6): Manipulación del DOM en tiempo real para la interactividad del usuario, cálculos matemáticos del sistema de tienda y gestión del estado del navegador.

    APIs de Terceros: Integración de Leaflet.js junto con mapas de CARTO para la geolocalización interactiva del itinerario.

2. Estructura del Sitio Web (Sitemap)

El sitio web adopta una estructura modular dividida en cinco secciones principales, todas ellas conectadas por una barra de navegación global persistente:

    Inicio (index.html): Landing page del proyecto. Destaca la implementación de un script en JavaScript que genera una cuenta atrás dinámica hasta la fecha exacta del despegue.

    Logística (logistica.html): Panel informativo estructurado en tarjetas (Cards) que resume los vuelos internacionales y la distribución de los alojamientos en Tokio y Kioto.

    Itinerario (itinerario.html): Módulo dual que presenta un mapa interactivo (zoom y desplazamiento espacial) y un "Timeline" vertical con la planificación cronológica día a día mediante estilos CSS personalizados.

    Tienda / Crowdfunding (tienda.html): E-commerce escolar simulado para la financiación del viaje, con cálculo de carrito en tiempo real.

    Panel TIC (proyecto-tic.html): Sección de meta-documentación donde se justifica el cumplimiento de los criterios de evaluación de la rúbrica escolar (sostenibilidad, accesibilidad y gestión).

3. Sistema de Financiación e Integración con Microsoft Forms

Uno de los pilares técnicos del proyecto es el sistema de recogida de fondos (crowdfunding) implementado en la sección de la tienda. Al carecer de un Backend propio (bases de datos o servidores de procesamiento), se ha diseñado una arquitectura híbrida:

    Cálculo en Tiempo Real: Mediante JavaScript (calcTotal()), la página lee los valores de los menús desplegables (<select>) de los productos (sudaderas, tazas, papeletas) y actualiza instantáneamente el importe total en el DOM sin recargar la página.

    Validación de Pedidos: El sistema incluye control de errores (sendOrder()). Si el usuario intenta procesar una compra con un valor de 0€, el script bloquea la acción y emite una alerta.

    Pasarela Serverless: Una vez confirmado el importe, JavaScript captura el total y redirige automáticamente al usuario a un formulario externo en Microsoft Forms. Esta solución permite registrar de forma segura los datos personales del comprador, su curso y el método de pago directamente en un documento de Excel en la nube, garantizando el cumplimiento normativo escolar en materia de protección de datos.

4. Experiencia de Usuario (UX): Persistencia de Estado

Se ha programado una funcionalidad de "Modo Oscuro" (Tokyo Night). A diferencia de un simple cambio de clases en el DOM, el script utiliza el objeto localStorage del navegador.

Cuando el usuario activa el modo oscuro, el valor se guarda en la memoria del dispositivo. Al navegar entre las distintas páginas del sitio (por ejemplo, de Inicio a Itinerario), un script de lectura anticipada verifica el localStorage y aplica el tema instantáneamente antes de renderizar el HTML, evitando destellos visuales (efecto flash-of-white) y ofreciendo una navegación fluida.

5. Despliegue y Alojamiento

El código fuente está centralizado y versionado mediante Git. El alojamiento de producción se ha realizado utilizando GitHub Pages. Esta infraestructura proporciona:

    Un entorno de servidor web estático de alta disponibilidad.

    Despliegue continuo (Continuous Deployment): los cambios en el código se reflejan automáticamente en vivo.

    Certificación de seguridad SSL/TLS (HTTPS) nativa, asegurando que la navegación y la redirección a Microsoft Forms se realicen bajo protocolos seguros.
