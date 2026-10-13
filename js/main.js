// Funciones comunes del sitio Viaje a Japón 2027.
// La lógica del diario se mantiene en js/blog.js.

// Evita un destello al aplicar el tema guardado.
try {
  if (localStorage.getItem("theme") === "tokyo") {
    document.body.classList.add("tokyo-night");
  }
} catch (_error) {
  // Si el navegador bloquea el almacenamiento, la web sigue siendo utilizable.
}

document.addEventListener("DOMContentLoaded", () => {
  const themeBtn = document.getElementById("theme-toggle");
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks = document.getElementById("nav-links");

  const updateThemeButton = () => {
    if (!themeBtn) return;
    const dark = document.body.classList.contains("tokyo-night");
    themeBtn.innerHTML = dark ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>' : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
    themeBtn.title = dark ? "Cambiar a tema claro" : "Cambiar a Tokyo Night";
    themeBtn.setAttribute("aria-label", themeBtn.title);
  };
  updateThemeButton();

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      document.body.classList.toggle("tokyo-night");
      const dark = document.body.classList.contains("tokyo-night");
      try { localStorage.setItem("theme", dark ? "tokyo" : "light"); } catch (_error) { /* Preferencia solo de esta sesión. */ }
      updateThemeButton();
    });
  }

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const opened = navLinks.classList.toggle("active");
      menuToggle.innerHTML = opened ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
      menuToggle.setAttribute("aria-expanded", String(opened));
      menuToggle.setAttribute("aria-label", opened ? "Cerrar menú" : "Abrir menú");
    });
    navLinks.addEventListener("click", (event) => {
      if (event.target.closest("a") && window.matchMedia("(max-width: 760px)").matches) {
        navLinks.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menú");
        menuToggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
      }
    });
  }

  // Cuenta atrás: fecha de salida configurada para el 1 de abril de 2027 a las 11:30.
  const countdownElements = ["cd-days", "cd-hours", "cd-mins", "cd-secs"].map(id => document.getElementById(id));
  if (countdownElements.every(Boolean)) {
    const targetDate = new Date("2027-04-01T11:30:00").getTime();
    const countdownContainer = document.querySelector(".countdown-container");
    const updateCountdown = () => {
      const distance = targetDate - Date.now();
      if (distance <= 0) {
        countdownContainer.innerHTML = '<p class="countdown-finished">¡La fecha de salida ha llegado! Que empiece la aventura.</p>';
        return false;
      }
      const days = Math.floor(distance / 86400000);
      const hours = Math.floor((distance % 86400000) / 3600000);
      const minutes = Math.floor((distance % 3600000) / 60000);
      const seconds = Math.floor((distance % 60000) / 1000);
      countdownElements[0].textContent = String(days).padStart(3, "0");
      countdownElements[1].textContent = String(hours).padStart(2, "0");
      countdownElements[2].textContent = String(minutes).padStart(2, "0");
      countdownElements[3].textContent = String(seconds).padStart(2, "0");
      return true;
    };
    updateCountdown();
    const interval = window.setInterval(() => { if (!updateCountdown()) window.clearInterval(interval); }, 1000);
  }

  // Efecto sakura discreto, desactivado cuando el usuario reduce el movimiento.
  const sakuraContainer = document.getElementById("sakura-container");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (sakuraContainer && !reduceMotion) {
    const createPetal = () => {
      const petal = document.createElement("div");
      petal.className = "sakura-petal";
      const size = Math.random() * 12 + 9;
      petal.style.width = `${size}px`;
      petal.style.height = `${size}px`;
      petal.style.left = `${Math.random() * 100}vw`;
      petal.style.animationDuration = `${Math.random() * 4 + 6}s`;
      sakuraContainer.appendChild(petal);
      window.setTimeout(() => petal.remove(), 11000);
    };
    window.setInterval(createPetal, 650);
  }

  // Inicializa el resumen de cesta en tienda.html, si estamos en esa página.
  calcTotal();
  const orderDialog = document.getElementById("order-dialog");
  const copyButton = document.getElementById("copy-order-summary");
  const continueButton = document.getElementById("continue-to-form");
  const closeButton = document.getElementById("close-order-dialog");
  if (copyButton) copyButton.addEventListener("click", copyOrderSummary);
  if (continueButton) continueButton.addEventListener("click", continueToForm);
  if (closeButton && orderDialog) closeButton.addEventListener("click", () => orderDialog.close());
});

// ----------------------------
// Cesta de tienda (sin pagos).
// Cada select contiene el precio total de la opción seleccionada.
// ----------------------------
const ORDER_FORM_URL = "https://forms.cloud.microsoft/e/9iJgHA9fBP";
const SHOP_PRODUCTS = [
  { id: "item-sudadera", name: "Sudadera Sakura" },
  { id: "item-taza", name: "Taza conmemorativa" },
  { id: "item-sorteo", name: "Papeletas de sorteo" }
];

function getCartItems() {
  return SHOP_PRODUCTS.map((product) => {
    const select = document.getElementById(product.id);
    if (!select) return null;
    const price = Number.parseInt(select.value, 10) || 0;
    if (price <= 0) return null;
    return { name: product.name, choice: select.options[select.selectedIndex]?.text || "Seleccionado", price };
  }).filter(Boolean);
}

function calcTotal() {
  const items = getCartItems();
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const totalBox = document.getElementById("checkout-total");
  if (totalBox) totalBox.textContent = String(total);
  const feedback = document.getElementById("store-feedback");
  if (feedback) {
    feedback.textContent = items.length
      ? `${items.length} ${items.length === 1 ? "tipo de artículo seleccionado" : "tipos de artículo seleccionados"}. Revisa el resumen antes de continuar.`
      : "Tu cesta está vacía. Añade un artículo para empezar.";
  }
  return total;
}

function buildOrderSummary() {
  const items = getCartItems();
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const lines = ["VIAJE A JAPÓN 2027 — RESUMEN DE PEDIDO", ""];
  items.forEach(item => lines.push(`${item.name}: ${item.choice}`));
  lines.push("", `TOTAL ESTIMADO: ${total} €`, "", "Pedido por completar mediante Microsoft Forms. No se ha realizado ningún pago desde la web.");
  return { items, total, text: lines.join("\n") };
}

function sendOrder() {
  const summary = buildOrderSummary();
  if (summary.total <= 0 || summary.items.length === 0) {
    const feedback = document.getElementById("store-feedback");
    if (feedback) feedback.textContent = "Selecciona al menos un artículo para poder revisar el pedido.";
    else window.alert("Selecciona al menos un artículo antes de continuar.");
    return;
  }

  const list = document.getElementById("order-summary-list");
  const totalBox = document.getElementById("order-dialog-total");
  const message = document.getElementById("order-message");
  const dialog = document.getElementById("order-dialog");
  if (list && totalBox && dialog) {
    list.replaceChildren();
    summary.items.forEach(item => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      const price = document.createElement("strong");
      name.textContent = `${item.name} — ${item.choice}`;
      price.textContent = `${item.price} €`;
      li.append(name, price);
      list.appendChild(li);
    });
    totalBox.textContent = String(summary.total);
    if (message) message.textContent = "";
    if (typeof dialog.showModal === "function") dialog.showModal();
    else if (window.confirm(`${summary.text}\n\n¿Quieres continuar a Microsoft Forms?`)) continueToForm();
    return;
  }
  if (window.confirm(`${summary.text}\n\n¿Quieres continuar a Microsoft Forms?`)) continueToForm();
}

async function copyOrderSummary() {
  const summary = buildOrderSummary();
  const message = document.getElementById("order-message");
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(summary.text);
    } else {
      const helper = document.createElement("textarea");
      helper.value = summary.text;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      const copied = document.execCommand("copy");
      helper.remove();
      if (!copied) throw new Error("No se ha podido copiar automáticamente.");
    }
    if (message) message.textContent = "Resumen copiado. Puedes pegarlo donde te resulte útil.";
  } catch (_error) {
    if (message) message.textContent = "No se pudo copiar automáticamente. Puedes revisar el resumen en pantalla.";
  }
}

function continueToForm() {
  window.open(ORDER_FORM_URL, "_blank", "noopener,noreferrer");
}
