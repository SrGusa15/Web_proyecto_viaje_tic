document.addEventListener('DOMContentLoaded', () => {

  // 1. GESTIÓN DEL MENÚ RESPONSIVE (Móviles)
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // 2. EFECTO DE PÉTALOS DE SAKURA (Protegido)
  // ¡Importante! Solo se ejecuta si existe el id="sakura-container" en el HTML
  const sakuraContainer = document.getElementById('sakura-container');
  
  if (sakuraContainer) {
    function createPetal() {
      const petal = document.createElement('div');
      petal.classList.add('sakura-petal');
      
      // Tamaño aleatorio entre 8px y 15px
      const size = Math.random() * 7 + 8;
      petal.style.width = `${size}px`;
      petal.style.height = `${size}px`;
      
      // Posición horizontal aleatoria
      petal.style.left = `${Math.random() * 100}vw`;
      
      // Duración de la caída aleatoria (entre 5 y 10 segundos)
      petal.style.animationDuration = `${Math.random() * 5 + 5}s`;
      
      sakuraContainer.appendChild(petal);
      
      // Eliminar el pétalo cuando termine la animación para no saturar la RAM
      setTimeout(() => {
        petal.remove();
      }, 10000);
    }
    
    // Crear un pétalo nuevo cada 300 milisegundos
    setInterval(createPetal, 300);
  }

  // 3. CAMBIO DE TEMA CLARO/OSCURO (Opcional por si lo necesitas en el futuro)
  const themeToggle = document.getElementById('theme-toggle');
  
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      // Como el tema base es oscuro (Tokyo Night), al hacer clic 
      // podríamos añadir una clase 'light-mode' al body si la profesora lo pide.
      // Por ahora, solo lanzamos una pequeña animación en el icono.
      const icon = themeToggle.querySelector('i');
      icon.classList.add('fa-spin');
      setTimeout(() => icon.classList.remove('fa-spin'), 500);
    });
  }

});