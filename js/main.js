// Aplicar Tema Inmediatamente
if (localStorage.getItem('theme') === 'tokyo') {
  document.body.classList.add('tokyo-night');
}

document.addEventListener("DOMContentLoaded", () => {
  // --- MODO OSCURO ---
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn && document.body.classList.contains('tokyo-night')) {
    themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('tokyo-night');
      const isDark = document.body.classList.contains('tokyo-night');
      themeBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
      localStorage.setItem('theme', isDark ? 'tokyo' : 'light');
    });
  }

  // --- MENÚ HAMBURGUESA ---
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      menuToggle.innerHTML = navLinks.classList.contains('active') ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
  }

  // --- EFECTO SAKURA FALLING (Sin librerías externas) ---
  const sakuraContainer = document.getElementById('sakura-container');
  if (sakuraContainer) {
    const totalPetals = 35; // Cantidad de pétalos simultáneos
    for (let i = 0; i < totalPetals; i++) {
      let petal = document.createElement('div');
      petal.classList.add('sakura-petal');
      
      // Tamaño, posición y velocidad aleatoria
      let size = Math.random() * 8 + 8; 
      petal.style.width = size + 'px';
      petal.style.height = (size * 1.5) + 'px';
      petal.style.left = Math.random() * 100 + 'vw';
      
      // Tiempos aleatorios para que sea orgánico
      petal.style.animationDuration = (Math.random() * 4 + 4) + 's, ' + (Math.random() * 3 + 2) + 's';
      petal.style.animationDelay = (Math.random() * 5) + 's, ' + (Math.random() * 2) + 's';
      
      sakuraContainer.appendChild(petal);
    }
  }

  // --- REVELADO LÍQUIDO AL HACER SCROLL (IntersectionObserver nativo) ---
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target); // Solo animar la primera vez
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

  revealElements.forEach(el => revealObserver.observe(el));

  // --- CUENTA ATRÁS CYBERPUNK ---
  const targetDate = new Date("April 1, 2027 11:30:00").getTime();
  const countdownInterval = setInterval(() => {
    const distance = targetDate - new Date().getTime();
    if (document.getElementById("cd-days") && distance > 0) {
      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      
      document.getElementById("cd-days").innerText = d < 10 ? "0" + d : d;
      document.getElementById("cd-hours").innerText = h < 10 ? "0" + h : h;
      document.getElementById("cd-mins").innerText = m < 10 ? "0" + m : m;
      document.getElementById("cd-secs").innerText = s < 10 ? "0" + s : s;
    }
  }, 1000);
});

// --- LÓGICA DE TIENDA ---
function calcTotal() {
  const v1 = parseInt(document.getElementById('item-sudadera')?.value) || 0;
  const v2 = parseInt(document.getElementById('item-taza')?.value) || 0;
  const v3 = parseInt(document.getElementById('item-sorteo')?.value) || 0;
  const totalBox = document.getElementById('checkout-total');
  if (totalBox) totalBox.innerText = (v1 + v2 + v3);
}

function sendOrder() {
  const totalBox = document.getElementById('checkout-total');
  if (totalBox && totalBox.innerText === "0") {
    alert("Por favor, selecciona al menos un producto antes de continuar.");
  } else {
    alert(`¡Perfecto! Tu compra suma ${totalBox.innerText}€.\n\nSerás redirigido a Microsoft Forms.`);
    window.open("https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=A3H7VxRR-k6SYabLwN9dcWkouIjjKOZNpHMugtHhLWdUM1hIVVFIWVg1OTdJRlQyTktIRDBaVk5HUC4u", "_blank");
  }
}
