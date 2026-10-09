// APLICAR TEMA INMEDIATAMENTE (Evita destellos blancos al cambiar de página)
if (localStorage.getItem('theme') === 'tokyo') {
  document.body.classList.add('tokyo-night');
}

document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURACIÓN DEL BOTÓN DE MODO OSCURO ---
  const themeBtn = document.getElementById('theme-toggle');

  if (themeBtn && document.body.classList.contains('tokyo-night')) {
    themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('tokyo-night');
      const isDark = document.body.classList.contains('tokyo-night');

      if (isDark) {
        themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        localStorage.setItem('theme', 'tokyo');
      } else {
        themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        localStorage.setItem('theme', 'light');
      }
    });
  }

  // --- MENÚ HAMBURGUESA ---
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const isOpened = navLinks.classList.contains('active');
      menuToggle.innerHTML = isOpened ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
  }

  // --- CUENTA ATRÁS ---
  const targetDate = new Date("April 1, 2027 11:30:00").getTime();

  const countdownInterval = setInterval(function() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (document.getElementById("cd-days")) {
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      document.getElementById("cd-days").innerText = days < 10 ? "0" + days : days;
      document.getElementById("cd-hours").innerText = hours < 10 ? "0" + hours : hours;
      document.getElementById("cd-mins").innerText = minutes < 10 ? "0" + minutes : minutes;
      document.getElementById("cd-secs").innerText = seconds < 10 ? "0" + seconds : seconds;

      if (distance < 0) {
        clearInterval(countdownInterval);
        const cdContainer = document.querySelector(".countdown-container");
        if (cdContainer) cdContainer.innerHTML = "<h3>¡El avión ya ha despegado!</h3>";
      }
    }
  }, 1000);
  // --- EFECTO SAKURA ---
  const sakuraContainer = document.getElementById('sakura-container');
  if (sakuraContainer) {
    function createPetal() {
      const petal = document.createElement('div');
      petal.classList.add('sakura-petal');

      const size = Math.random() * 8 + 6;
      petal.style.width = `${size}px`;
      petal.style.height = `${size}px`;
      petal.style.left = `${Math.random() * 100}vw`;
      petal.style.animationDuration = `${Math.random() * 4 + 5}s`;

      sakuraContainer.appendChild(petal);

      setTimeout(() => {
        petal.remove();
      }, 9000);
    }
    setInterval(createPetal, 400);
  }
});

// --- LÓGICA DE TIENDA Y FORMULARIOS ---
function calcTotal() {
  const v1 = parseInt(document.getElementById('item-sudadera')?.value) || 0;
  const v2 = parseInt(document.getElementById('item-taza')?.value) || 0;
  const v3 = parseInt(document.getElementById('item-sorteo')?.value) || 0;
  const totalBox = document.getElementById('checkout-total');
  if (totalBox) totalBox.innerText = (v1 + v2 + v3);
}

function sendOrder() {
  const totalBox = document.getElementById('checkout-total');
  const total = totalBox ? totalBox.innerText : "0";
  if (total === "0") {
    alert("Por favor, selecciona al menos un producto antes de continuar.");
  } else {
    alert(`¡Perfecto! Tu compra suma ${total}€.\n\nSerás redirigido al formulario de Microsoft Forms para indicar tu nombre, curso y método de pago.`);
    window.open("https://forms.office.com/", "_blank");
  }
}
