document.addEventListener('DOMContentLoaded', () => {

  // 1. MENÚ DESPLEGABLE EN MÓVILES
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // 2. ANIMACIÓN DE SAKURA (SOLO SI EXISTE EL CONTENEDOR EN INDEX)
  const sakuraContainer = document.getElementById('sakura-container');
  if (sakuraContainer) {
    function createPetal() {
      const petal = document.createElement('div');
      petal.classList.add('sakura-petal');
      
      const size = Math.random() * 6 + 8;
      petal.style.width = `${size}px`;
      petal.style.height = `${size}px`;
      petal.style.left = `${Math.random() * 100}vw`;
      petal.style.animationDuration = `${Math.random() * 4 + 6}s`;
      
      sakuraContainer.appendChild(petal);
      
      setTimeout(() => {
        petal.remove();
      }, 10000);
    }
    setInterval(createPetal, 400);
  }

});

// 3. CALCULADORA INTERACTIVA DE PRECIOS PARA LA TIENDA
const prices = {
  sudadera: 25.0,
  taza: 10.0,
  papeleta: 2.0
};

const quantities = {
  sudadera: 0,
  taza: 0,
  papeleta: 0
};

function updateQty(item, change) {
  if (quantities[item] + change >= 0) {
    quantities[item] += change;
    const inputElement = document.getElementById(`qty-${item}`);
    if (inputElement) {
      inputElement.value = quantities[item];
    }
    calculateTotal();
  }
}

function calculateTotal() {
  const total = (quantities.sudadera * prices.sudadera) +
                (quantities.taza * prices.taza) +
                (quantities.papeleta * prices.papeleta);
  
  const totalElement = document.getElementById('total-price');
  if (totalElement) {
    totalElement.textContent = total.toFixed(2).replace('.', ',') + ' €';
  }
}