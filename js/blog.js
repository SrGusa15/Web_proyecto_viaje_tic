/* Diario 2.0: búsqueda, categorías, lectura completa, galería y CRUD autenticado. */
(() => {
  "use strict";

  const API_BASE = String(window.BLOG_API_BASE_URL || "").replace(/\/+$/, "");
  const TOKEN_KEY = "viajeJaponAdminToken";
  const state = { posts: [], token: sessionStorage.getItem(TOKEN_KEY) || "", category: "all", loading: false };
  const $ = (id) => document.getElementById(id);

  const els = {
    form: $("form-blog"), title: $("titulo"), content: $("contenido"), image: $("imagen"), category: $("categoria"),
    categoryCustom: $("categoria-custom"), postId: $("post-id"), savePost: $("save-post"), cancelEdit: $("cancel-edit"),
    formMessage: $("form-message"), contentCount: $("content-count"), posts: $("contenedor-posts"), status: $("blog-status"),
    search: $("blog-search"), categoryFilter: $("category-filter"), sortFilter: $("sort-filter"), chips: $("category-chips"),
    loginToggle: $("login-toggle"), loginPanel: $("login-panel"), loginForm: $("login-form"), password: $("admin-password"),
    loginButton: $("login-button"), loginMessage: $("login-message"), adminSection: $("admin-section"), logout: $("logout-button"),
    empty: $("empty-filter-state"), refresh: $("refresh-posts"), lastUpdated: $("last-updated"), statPosts: $("stat-posts"),
    statPhotos: $("stat-photos"), statCategories: $("stat-categories"), clearFilters: $("clear-filters"),
    postDialog: $("post-dialog"), dialogImage: $("dialog-image"), dialogCategory: $("dialog-category"), dialogTitle: $("dialog-title"),
    dialogDate: $("dialog-date"), dialogContent: $("dialog-content"), galleryDialog: $("gallery-dialog"), galleryGrid: $("gallery-grid"),
    galleryCount: $("gallery-count"), galleryEmpty: $("gallery-empty"), openGallery: $("open-gallery")
  };

  function setMessage(element, message, type = "") {
    element.textContent = message;
    element.classList.remove("error", "success");
    if (type) element.classList.add(type);
  }

  function setStatus(message, type = "") {
    els.status.replaceChildren();
    if (type === "loading") {
      const icon = document.createElement("i"); icon.className = "fa-solid fa-spinner fa-spin"; els.status.append(icon);
    } else if (type === "error") {
      const icon = document.createElement("i"); icon.className = "fa-solid fa-circle-exclamation"; els.status.append(icon);
    }
    const span = document.createElement("span"); span.textContent = message; els.status.append(span);
    els.status.classList.toggle("error", type === "error");
    els.status.hidden = !message;
  }

  async function api(path, options = {}) {
    if (!API_BASE) throw new Error("Falta configurar BLOG_API_BASE_URL en js/blog-config.js.");
    const headers = new Headers(options.headers || {});
    if (options.body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    if (options.auth && state.token) headers.set("Authorization", `Bearer ${state.token}`);
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    let payload = null;
    const text = await response.text();
    if (text) { try { payload = JSON.parse(text); } catch { payload = { error: text }; } }
    if (!response.ok) {
      if (response.status === 401 && options.auth) clearSession(false);
      throw new Error(payload?.error || `Error del servidor (${response.status}).`);
    }
    return payload;
  }

  function clearSession(showMessage = true) {
    state.token = "";
    sessionStorage.removeItem(TOKEN_KEY);
    updateAdminUi();
    if (showMessage) setMessage(els.loginMessage, "La sesión ha caducado. Vuelve a iniciar sesión.", "error");
  }

  function updateAdminUi() {
    const loggedIn = Boolean(state.token);
    els.adminSection.hidden = !loggedIn;
    els.loginToggle.hidden = loggedIn;
    els.loginPanel.hidden = true;
    renderPosts();
  }

  function formatDate(value) {
    if (!value) return "Fecha desconocida";
    // SQLite CURRENT_TIMESTAMP está en UTC pero no incluye la Z: añadirla para evitar desfases locales.
    const raw = String(value);
    const normalized = /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(raw) ? `${raw.replace(" ", "T")}Z` : raw;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return "Fecha desconocida";
    return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
  }

  function plainExcerpt(text, limit = 190) {
    const value = String(text || "").trim();
    return value.length > limit ? `${value.slice(0, limit).trimEnd()}…` : value;
  }

  function safeImageUrl(value) {
    try { const url = new URL(String(value || "")); return url.protocol === "https:" ? url.href : ""; }
    catch { return ""; }
  }

  function addImageFailureFallback(img) {
    img.addEventListener("error", () => { img.remove(); }, { once: true });
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function makeButton(text, className, onClick, iconName) {
    const button = document.createElement("button"); button.type = "button"; button.className = className;
    if (iconName) { const icon = document.createElement("i"); icon.className = iconName; button.append(icon); }
    if (text) { if (iconName) button.append(document.createTextNode(` ${text}`)); else button.textContent = text; }
    button.addEventListener("click", onClick);
    return button;
  }

  function filteredPosts() {
    const query = els.search.value.trim().toLocaleLowerCase("es");
    const category = els.categoryFilter.value;
    const sort = els.sortFilter.value;
    const result = state.posts.filter(post => {
      const matchesQuery = !query || `${post.titulo || ""} ${post.contenido || ""} ${post.categoria || "Diario"}`.toLocaleLowerCase("es").includes(query);
      const matchesCategory = category === "all" || (post.categoria || "Diario") === category;
      const matchesChip = state.category === "all" || (post.categoria || "Diario") === state.category;
      return matchesQuery && matchesCategory && matchesChip;
    });
    result.sort((a, b) => {
      if (sort === "title") return String(a.titulo).localeCompare(String(b.titulo), "es");
      const dateDiff = new Date(b.fecha || 0) - new Date(a.fecha || 0);
      return sort === "oldest" ? -dateDiff : dateDiff;
    });
    return result;
  }

  function renderCategories() {
    const categories = [...new Set(state.posts.map(post => String(post.categoria || "Diario").trim() || "Diario"))].sort((a, b) => a.localeCompare(b, "es"));
    const selected = els.categoryFilter.value || "all";
    els.categoryFilter.replaceChildren(new Option("Todas las categorías", "all"));
    categories.forEach(category => els.categoryFilter.add(new Option(category, category)));
    els.categoryFilter.value = categories.includes(selected) ? selected : "all";
    els.chips.replaceChildren();
    els.chips.append(makeButton("Todas", `category-chip${state.category === "all" ? " active" : ""}`, () => { state.category = "all"; els.categoryFilter.value = "all"; renderCategories(); renderPosts(); }));
    categories.forEach(category => els.chips.append(makeButton(category, `category-chip${state.category === category ? " active" : ""}`, () => { state.category = category; els.categoryFilter.value = category; renderCategories(); renderPosts(); })));
  }

  function updateStats() {
    els.statPosts.textContent = String(state.posts.length);
    els.statPhotos.textContent = String(state.posts.filter(post => safeImageUrl(post.imagen)).length);
    els.statCategories.textContent = String(new Set(state.posts.map(post => String(post.categoria || "Diario"))).size);
  }

  function renderPosts() {
    if (!els.posts) return;
    const posts = filteredPosts();
    els.posts.replaceChildren();
    els.empty.hidden = posts.length !== 0 || state.posts.length === 0;
    if (!state.posts.length) {
      // Vacío real, distinto del estado de error de conexión.
      if (!els.status.classList.contains("error")) setStatus("Todavía no hay entradas. ¡La primera historia está por escribir!", "");
      return;
    }
    setStatus("", "");
    posts.forEach(post => {
      const card = element("article", "post-card");
      const imageUrl = safeImageUrl(post.imagen);
      if (imageUrl) {
        const img = element("img", "post-cover"); img.src = imageUrl; img.alt = `Fotografía de ${post.titulo || "la entrada"}`; img.loading = "lazy"; img.decoding = "async";
        addImageFailureFallback(img); card.append(img);
      } else {
        const noImage = element("div", "post-cover post-no-image"); noImage.setAttribute("aria-hidden", "true"); const icon = element("i", "fa-solid fa-torii-gate"); noImage.append(icon); card.append(noImage);
      }
      const body = element("div", "post-card-body");
      const top = element("div", "post-card-top"); top.append(element("span", "post-tag", post.categoria || "Diario"), element("time", "post-date", formatDate(post.fecha))); body.append(top);
      body.append(element("h3", "post-title", post.titulo || "Entrada sin título"));
      body.append(element("p", "post-excerpt", plainExcerpt(post.contenido)));
      const footer = element("div", "post-card-footer");
      footer.append(makeButton("Leer historia", "read-post", () => openPost(post), "fa-solid fa-arrow-right"));
      if (state.token) {
        const actions = element("div", "post-admin-actions");
        const edit = makeButton("", "edit-post", () => beginEdit(post), "fa-solid fa-pen"); edit.title = "Editar entrada"; edit.setAttribute("aria-label", `Editar ${post.titulo}`);
        const del = makeButton("", "delete-post", () => deletePost(post), "fa-solid fa-trash"); del.title = "Eliminar entrada"; del.setAttribute("aria-label", `Eliminar ${post.titulo}`);
        actions.append(edit, del); footer.append(actions);
      }
      body.append(footer); card.append(body); els.posts.append(card);
    });
    els.empty.hidden = posts.length !== 0;
  }

  function openPost(post) {
    const imageUrl = safeImageUrl(post.imagen);
    els.dialogImage.hidden = !imageUrl;
    if (imageUrl) { els.dialogImage.src = imageUrl; els.dialogImage.alt = `Fotografía de ${post.titulo || "la entrada"}`; }
    else { els.dialogImage.removeAttribute("src"); els.dialogImage.alt = ""; }
    els.dialogCategory.textContent = post.categoria || "Diario";
    els.dialogTitle.textContent = post.titulo || "Entrada sin título";
    els.dialogDate.textContent = `Publicado el ${formatDate(post.fecha)}`;
    els.dialogContent.textContent = post.contenido || "";
    els.postDialog.showModal();
  }

  function renderGallery() {
    const photos = state.posts.filter(post => safeImageUrl(post.imagen));
    els.galleryGrid.replaceChildren();
    els.galleryCount.textContent = `${photos.length} ${photos.length === 1 ? "fotografía" : "fotografías"} guardadas en el diario`;
    els.galleryEmpty.hidden = photos.length > 0;
    photos.forEach(post => {
      const button = element("button", "gallery-item"); button.type = "button"; button.setAttribute("aria-label", `Abrir entrada ${post.titulo}`);
      const img = element("img"); img.src = safeImageUrl(post.imagen); img.alt = post.titulo || "Fotografía del viaje"; img.loading = "lazy";
      const caption = element("span", "gallery-caption", post.titulo || "Recuerdo"); button.append(img, caption); button.addEventListener("click", () => { els.galleryDialog.close(); openPost(post); }); els.galleryGrid.append(button);
    });
  }

  async function loadPosts() {
    if (state.loading) return;
    state.loading = true; els.refresh.disabled = true; setStatus("Conectando con el diario…", "loading");
    try {
      const posts = await api("/api/posts");
      if (!Array.isArray(posts)) throw new Error("El servidor ha devuelto un formato de diario no válido.");
      state.posts = posts;
      renderCategories(); updateStats(); renderPosts(); renderGallery();
      els.lastUpdated.textContent = `Actualizado a las ${new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date())}`;
    } catch (error) {
      console.error("No se pudo cargar el diario:", error);
      setStatus(`${error.message} Comprueba que la tablet esté encendida, el servidor iniciado y el túnel activo.`, "error");
      els.posts.replaceChildren(); els.empty.hidden = true;
    } finally { state.loading = false; els.refresh.disabled = false; }
  }

  function resetForm() {
    els.form.reset(); els.postId.value = ""; els.contentCount.textContent = "0"; els.savePost.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Publicar entrada';
    els.cancelEdit.hidden = true; setMessage(els.formMessage, "");
  }

  function beginEdit(post) {
    els.adminSection.hidden = false;
    els.postId.value = String(post.id); els.title.value = post.titulo || ""; els.content.value = post.contenido || ""; els.image.value = post.imagen || "";
    const category = post.categoria || "Diario";
    const known = [...els.category.options].some(option => option.value === category);
    if (known) { els.category.value = category; els.categoryCustom.value = ""; }
    else { els.category.value = "Diario"; els.categoryCustom.value = category; }
    els.contentCount.textContent = String(els.content.value.length); els.savePost.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios'; els.cancelEdit.hidden = false;
    els.form.scrollIntoView({ behavior: "smooth", block: "start" }); els.title.focus();
  }

  async function deletePost(post) {
    if (!window.confirm(`¿Seguro que quieres eliminar «${post.titulo}»? Esta acción no se puede deshacer.`)) return;
    try { await api(`/api/posts/${encodeURIComponent(post.id)}`, { method: "DELETE", auth: true }); await loadPosts(); setMessage(els.formMessage, "Entrada eliminada.", "success"); }
    catch (error) { window.alert(error.message); }
  }

  els.search.addEventListener("input", renderPosts);
  els.categoryFilter.addEventListener("change", () => { state.category = "all"; renderCategories(); renderPosts(); });
  els.sortFilter.addEventListener("change", renderPosts);
  els.clearFilters.addEventListener("click", () => { els.search.value = ""; els.categoryFilter.value = "all"; els.sortFilter.value = "newest"; state.category = "all"; renderCategories(); renderPosts(); });
  els.refresh.addEventListener("click", loadPosts);
  els.openGallery.addEventListener("click", () => { renderGallery(); els.galleryDialog.showModal(); });
  document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => $(button.dataset.close).close()));
  [els.postDialog, els.galleryDialog].forEach(dialog => dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); }));
  els.loginToggle.addEventListener("click", () => { els.loginPanel.hidden = !els.loginPanel.hidden; if (!els.loginPanel.hidden) els.password.focus(); });
  els.content.addEventListener("input", () => { els.contentCount.textContent = String(els.content.value.length); });
  els.cancelEdit.addEventListener("click", resetForm);

  els.loginForm.addEventListener("submit", async event => {
    event.preventDefault(); els.loginButton.disabled = true; setMessage(els.loginMessage, "Comprobando contraseña…");
    try {
      const result = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ password: els.password.value }) });
      if (!result?.token) throw new Error("El servidor no devolvió un token de sesión.");
      state.token = result.token; sessionStorage.setItem(TOKEN_KEY, state.token); els.password.value = ""; els.loginPanel.hidden = true;
      setMessage(els.loginMessage, "Sesión iniciada.", "success"); updateAdminUi();
    } catch (error) { setMessage(els.loginMessage, error.message, "error"); }
    finally { els.loginButton.disabled = false; }
  });

  els.logout.addEventListener("click", async () => {
    try { await api("/api/auth/logout", { method: "POST", auth: true }); } catch (error) { console.warn("La sesión ya no estaba activa:", error.message); }
    clearSession(false); resetForm(); setMessage(els.loginMessage, "Has cerrado sesión.", "success"); await loadPosts();
  });

  els.form.addEventListener("submit", async event => {
    event.preventDefault(); if (!state.token) { setMessage(els.formMessage, "Inicia sesión para publicar.", "error"); return; }
    const category = els.categoryCustom.value.trim() || els.category.value || "Diario";
    const payload = { titulo: els.title.value.trim(), contenido: els.content.value.trim(), imagen: els.image.value.trim(), categoria: category };
    if (!payload.titulo || !payload.contenido) { setMessage(els.formMessage, "Escribe un título y una historia.", "error"); return; }
    const editing = Boolean(els.postId.value); els.savePost.disabled = true; setMessage(els.formMessage, editing ? "Guardando cambios…" : "Publicando entrada…");
    try {
      const result = editing
        ? await api(`/api/posts/${encodeURIComponent(els.postId.value)}`, { method: "PUT", body: JSON.stringify(payload), auth: true })
        : await api("/api/posts", { method: "POST", body: JSON.stringify(payload), auth: true });
      resetForm(); setMessage(els.formMessage, editing ? "Cambios guardados." : "Entrada publicada.", "success");
      await loadPosts(); els.adminSection.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) { setMessage(els.formMessage, error.message, "error"); }
    finally { els.savePost.disabled = false; }
  });

  async function restoreSession() {
    if (!state.token) { updateAdminUi(); return; }
    try { await api("/api/auth/me", { auth: true }); updateAdminUi(); }
    catch { clearSession(false); }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await loadPosts();
    await restoreSession();
  });
})();
