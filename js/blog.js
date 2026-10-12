// Configuración de la URL de la API de la tablet
// NOTA: Cuando configuremos el túnel, cambiaremos esta URL local por la URL segura de Cloudflare/Tailscale
const API_URL = "https://midlands-msgid-auditor-dozens.trycloudflare.com/api/posts";

document.addEventListener("DOMContentLoaded", () => {
    const formBlog = document.getElementById("form-blog");
    const contenedorPosts = document.getElementById("contenedor-posts");

    // 1. Función para cargar los posts desde la tablet
    async function cargarPosts() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Error en la respuesta del servidor");
            
            const posts = await response.json();
            contenedorPosts.innerHTML = ""; // Limpiar el mensaje de carga

            if (posts.length === 0) {
                contenedorPosts.innerHTML = "<p>El diario está vacío. ¡Sé el primero en escribir!</p>";
                return;
            }

            // Pintar cada post en el HTML
            posts.forEach(post => {
                const article = document.createElement("article");
                article.className = "card"; // Aprovecha los estilos de tus tarjetas CSS
                article.style.padding = "1.5rem";
                article.style.borderRadius = "8px";
                
                // Formatear la fecha
                const fechaFormat = new Date(post.fecha).toLocaleDateString("es-ES", {
                    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                });

                article.innerHTML = `
                    <h3 style="color: var(--primary); margin-bottom: 0.5rem;">${post.titulo}</h3>
                    <small style="display: block; margin-bottom: 1rem; opacity: 0.7;">
                        <i class="fa-solid fa-calendar-days"></i> Publicado el ${fechaFormat}
                    </small>
                    <p style="line-height: 1.6;">${post.contenido}</p>
                `;
                contenedorPosts.appendChild(article);
            });

        } catch (error) {
            console.error("Error:", error);
            contenedorPosts.innerHTML = `
                <p style="color: #D90429; font-weight: bold;">
                    <i class="fa-solid fa-circle-exclamation"></i> No se pudo conectar con el servidor local. 
                    Asegúrate de que la ElitePad está encendida y el túnel activo.
                </p>`;
        }
    }

    // 2. Evento para guardar un nuevo post
    if (formBlog) {
        formBlog.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const titulo = document.getElementById("titulo").value;
            const contenido = document.getElementById("contenido").value;

            try {
                const response = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ titulo, contenido })
                });

                if (response.ok) {
                    formBlog.reset(); // Limpiar el formulario
                    cargarPosts();    // Recargar la lista para ver el nuevo post
                } else {
                    alert("Error al guardar el artículo en el servidor.");
                }
            } catch (error) {
                console.error("Error al enviar:", error);
                alert("No hay conexión con el servidor de la tablet.");
            }
        });
    }

    // Ejecutar la carga inicial al entrar a la página
    cargarPosts();
});
