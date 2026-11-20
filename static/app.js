/* Sonex — app móvil: huella / Face ID (WebAuthn), QR, tienda, carrito e instalación. */

/* ---------------------------------------------------------------- avisos en pantalla */
function toast(texto, tipo) {
  const caja = document.getElementById("toasts");
  if (!caja) return;
  const t = document.createElement("div");
  t.className = "toast" + (tipo ? " toast-" + tipo : "");
  t.textContent = texto;
  caja.appendChild(t);
  requestAnimationFrame(() => t.classList.add("visible"));
  setTimeout(() => { t.classList.remove("visible"); setTimeout(() => t.remove(), 300); }, 3200);
}
function vibrar(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 15); } catch (e) {} }
function irALogin() {
  toast("Inicia sesión para continuar.");
  setTimeout(() => { window.location.href = "/login?next=" + encodeURIComponent(location.pathname); }, 900);
}
function ocupado(btn, si) {
  if (!btn) return;
  btn.disabled = si;
  btn.classList.toggle("cargando", si);
}
function actualizarBadge(n) {
  document.querySelectorAll("[data-carrito-n]").forEach((b) => {
    b.textContent = n; b.hidden = !n;
    b.classList.remove("rebote"); void b.offsetWidth; b.classList.add("rebote");
  });
  document.querySelectorAll("[data-carrito-n-plano]").forEach((b) => { b.textContent = n; });
}
document.addEventListener("DOMContentLoaded", () => {
  const datos = document.getElementById("flash-data");
  if (datos) { try { JSON.parse(datos.textContent).forEach((m) => toast(m, "ok")); } catch (e) {} }
});

async function postJson(url, cuerpo) {
  const r = await fetch(url, {
    method: "POST",
    headers: cuerpo ? { "Content-Type": "application/json" } : {},
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  let data = {};
  try { data = await r.json(); } catch (e) { data = { ok: false }; }
  if (r.status === 401) data.login = true;
  return data;
}

/* ---------------------------------------------------------------- tienda */
async function agregarCarrito(pid, btn, irAlCarrito) {
  ocupado(btn, true);
  try {
    const res = await postJson("/api/carrito/agregar/" + pid);
    if (res.login) return irALogin();
    if (!res.ok) return toast("No se pudo agregar. Inténtalo de nuevo.", "error");
    vibrar();
    actualizarBadge(res.n);
    if (btn) { btn.classList.add("hecho"); setTimeout(() => btn.classList.remove("hecho"), 1200); }
    toast("Agregado al carrito ✓", "ok");
    if (irAlCarrito && btn) {
      btn.textContent = "Ver carrito";
      btn.onclick = () => { window.location.href = "/carrito"; };
    }
  } catch (e) {
    toast("Sin conexión. Revisa tu internet.", "error");
  } finally { ocupado(btn, false); }
}
async function toggleFavorito(pid, btn) {
  try {
    const res = await postJson("/api/favorito/" + pid);
    if (res.login) return irALogin();
    if (!res.ok) return;
    vibrar(10);
    btn.classList.toggle("activo", res.favorito);
    btn.setAttribute("aria-pressed", res.favorito ? "true" : "false");
    toast(res.favorito ? "Guardado en favoritos ♥" : "Quitado de favoritos");
  } catch (e) { toast("Sin conexión. Revisa tu internet.", "error"); }
}
// Filtros de la tienda
document.addEventListener("click", (e) => {
  const f = e.target.closest(".filtro");
  if (!f) return;
  document.querySelectorAll(".filtro").forEach((x) => {
    x.classList.toggle("activo", x === f); x.setAttribute("aria-selected", x === f ? "true" : "false");
  });
  const cat = f.dataset.filtro;
  document.querySelectorAll(".producto[data-categoria]").forEach((p) => {
    p.hidden = cat !== "todos" && p.dataset.categoria !== cat;
  });
});

/* ---------------------------------------------------------------- carrito */
document.addEventListener("click", async (e) => {
  const paso = e.target.closest("[data-paso]");
  const quitar = e.target.closest("[data-quitar]");
  if (!paso && !quitar) return;
  const item = e.target.closest(".item-carrito");
  const pid = item.dataset.pid;
  const salida = item.querySelector("[data-cantidad]");
  const actual = parseInt(salida.textContent, 10) || 1;
  const nueva = quitar ? 0 : Math.max(0, Math.min(10, actual + parseInt(paso.dataset.paso, 10)));
  if (nueva === actual) return;
  item.classList.add("cargando");
  try {
    const res = await postJson("/api/carrito/cantidad/" + pid, { cantidad: nueva });
    if (res.login) return irALogin();
    if (!res.ok) return toast(res.error || "No se pudo actualizar.", "error");
    vibrar(10);
    actualizarBadge(res.n);
    document.querySelectorAll("[data-total]").forEach((t) => { t.textContent = res.total; });
    if (res.cantidad === 0) {
      item.classList.add("saliendo");
      setTimeout(() => {
        item.remove();
        if (!document.querySelector(".item-carrito")) {
          document.getElementById("carrito-lleno").hidden = true;
          document.getElementById("carrito-vacio").hidden = false;
        }
      }, 250);
      toast("Producto quitado");
    } else {
      salida.textContent = res.cantidad;
      item.querySelector("[data-subtotal]").textContent = res.subtotal;
    }
  } catch (err) {
    toast("Sin conexión. Revisa tu internet.", "error");
  } finally { item.classList.remove("cargando"); }
});
async function confirmarPedido(btn) {
  ocupado(btn, true);
  try {
    const res = await postJson("/api/pedido");
    if (res.login) return irALogin();
    if (res.ok) { vibrar([20, 60, 20]); window.location.href = "/cuenta#pedidos"; return; }
    toast(res.error || "No se pudo confirmar el pedido.", "error");
  } catch (e) {
    toast("Sin conexión. Tu pedido no se envió.", "error");
  } finally { ocupado(btn, false); }
}

/* ---------------------------------------------------------------- formularios */
function verPassword(btn) {
  const input = btn.parentElement.querySelector("input");
  const ver = input.type === "password";
  input.type = ver ? "text" : "password";
  btn.textContent = ver ? "Ocultar" : "Ver";
  btn.setAttribute("aria-label", ver ? "Ocultar contraseña" : "Mostrar contraseña");
}
document.addEventListener("submit", (e) => {
  const b = e.target.querySelector("button[type=submit]");
  if (b && !e.defaultPrevented) setTimeout(() => ocupado(b, true), 0);
});
window.addEventListener("pageshow", () => {
  document.querySelectorAll("button.cargando").forEach((b) => ocupado(b, false));
});

/* ---------------------------------------------------------------- huella / Face ID (WebAuthn) */
function b64urlToBuffer(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}
function bufferToB64url(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function publicKeyToJson(cred) {
  const out = { id: cred.id, rawId: bufferToB64url(cred.rawId), type: cred.type, response: {} };
  const r = cred.response;
  if (r.clientDataJSON) out.response.clientDataJSON = bufferToB64url(r.clientDataJSON);
  if (r.attestationObject) out.response.attestationObject = bufferToB64url(r.attestationObject);
  if (r.authenticatorData) out.response.authenticatorData = bufferToB64url(r.authenticatorData);
  if (r.signature) out.response.signature = bufferToB64url(r.signature);
  if (r.userHandle) out.response.userHandle = bufferToB64url(r.userHandle);
  return out;
}
function optionsFromServer(o) {
  if (o.challenge) o.challenge = b64urlToBuffer(o.challenge);
  if (o.user && o.user.id) o.user.id = b64urlToBuffer(o.user.id);
  if (o.allowCredentials) o.allowCredentials.forEach((c) => { c.id = b64urlToBuffer(c.id); });
  if (o.excludeCredentials) o.excludeCredentials.forEach((c) => { c.id = b64urlToBuffer(c.id); });
  return o;
}
function mensajeBiometria(e) {
  if (e && e.name === "NotAllowedError") return "Se canceló o se agotó el tiempo. Inténtalo de nuevo.";
  if (e && e.name === "InvalidStateError") return "Este dispositivo ya está activado.";
  return "No se pudo usar la huella / Face ID en este dispositivo.";
}
async function avisoBiometria() {
  const el = document.getElementById("aviso-biometria");
  if (!el) return;
  const btn = document.getElementById("btn-passkey");
  const mostrar = (t) => { el.textContent = t; el.hidden = false; if (btn) btn.classList.add("apagado"); };
  const local = ["localhost", "127.0.0.1"].includes(location.hostname);
  if (location.protocol !== "https:" && !local) return mostrar("La huella / Face ID solo funciona en la dirección https:// de Sonex.");
  if (!window.PublicKeyCredential) return mostrar("Este navegador no soporta huella / Face ID. Entra con tu correo.");
  try {
    const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!ok) mostrar("Este dispositivo no tiene huella ni Face ID configurados. Entra con tu correo.");
  } catch (e) { /* si no se puede detectar, no bloqueamos nada */ }
}
document.addEventListener("DOMContentLoaded", avisoBiometria);

async function registrarPasskey(btn) {
  ocupado(btn, true);
  try {
    const inicio = await fetch("/passkey/registro/inicio", { method: "POST" });
    if (!inicio.ok) throw new Error("servidor");
    const options = optionsFromServer(await inicio.json());
    const cred = await navigator.credentials.create({ publicKey: options });
    const res = await postJson("/passkey/registro/fin", publicKeyToJson(cred));
    if (res.ok) { vibrar([20, 60, 20]); toast("Huella / rostro activados ✓", "ok"); setTimeout(() => location.reload(), 900); }
    else toast(res.error || "No se pudo activar.", "error");
  } catch (e) {
    toast(mensajeBiometria(e), "error");
  } finally { ocupado(btn, false); }
}
async function entrarPasskey(btn) {
  ocupado(btn, true);
  try {
    const inicio = await fetch("/passkey/login/inicio", { method: "POST" });
    const data = await inicio.json();
    if (data.error) { toast(data.error, "error"); return; }
    const cred = await navigator.credentials.get({ publicKey: optionsFromServer(data) });
    const res = await postJson("/passkey/login/fin", publicKeyToJson(cred));
    if (res.ok) {
      vibrar();
      const sig = new URLSearchParams(location.search).get("next");
      window.location.href = sig && sig.startsWith("/") && !sig.startsWith("//") ? sig : "/cuenta";
    } else toast(res.error || "No se pudo entrar con huella / rostro.", "error");
  } catch (e) {
    toast(mensajeBiometria(e), "error");
  } finally { ocupado(btn, false); }
}

/* ---------------------------------------------------------------- QR: el otro celular espera la aprobación */
(function () {
  const box = document.getElementById("qr-espera");
  if (!box) return;
  const token = box.dataset.token;
  const timer = setInterval(async () => {
    try {
      const r = await fetch("/qr/estado/" + token, { cache: "no-store" });
      const d = await r.json();
      if (d.estado === "aprobado" && d.session_token) {
        clearInterval(timer);
        const res = await postJson("/qr/canjear", { token: token, session_token: d.session_token });
        if (res.ok) { vibrar(); window.location.href = "/cuenta"; }
      } else if (["expirado", "rechazado", "no_valido"].includes(d.estado)) {
        clearInterval(timer);
        document.getElementById("qr-mensaje").textContent = "Este código expiró o fue rechazado. Pide uno nuevo en tu otro celular.";
        document.querySelector(".pulso")?.classList.add("detenido");
      }
    } catch (e) { /* sin red: seguimos intentando */ }
  }, 2000);
})();

/* ---------------------------------------------------------------- app instalable (PWA) */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => {}); });
}
(function () {
  const banner = document.getElementById("banner-instalar");
  const btn = document.getElementById("btn-instalar");
  const cerrar = document.getElementById("cerrar-instalar");
  const ajuste = document.getElementById("ajuste-instalar");
  const texto = document.getElementById("banner-instalar-texto");
  const instalada = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (instalada) { document.documentElement.classList.add("modo-app"); return; }
  let descartado = false;
  try { descartado = localStorage.getItem("sonex-instalar-cerrado") === "1"; } catch (e) {}
  let promptGuardado = null;
  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  function mostrar() {
    if (ajuste) ajuste.hidden = false;
    if (banner && !descartado) banner.hidden = false;
  }
  async function instalar() {
    if (promptGuardado) {
      promptGuardado.prompt();
      const r = await promptGuardado.userChoice;
      promptGuardado = null;
      if (banner) banner.hidden = true;
      if (r.outcome === "accepted") toast("¡Listo! Sonex ya está en tu pantalla de inicio.", "ok");
    } else if (esIOS) {
      toast("En Safari toca Compartir ⬆️ y luego “Agregar a inicio”.");
    }
  }
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); promptGuardado = e; mostrar(); });
  if (esIOS) {
    if (texto) texto.textContent = "Toca Compartir ⬆️ y luego “Agregar a inicio”.";
    if (btn) btn.hidden = true;
    mostrar();
  }
  if (btn) btn.addEventListener("click", instalar);
  if (ajuste) ajuste.addEventListener("click", instalar);
  if (cerrar) cerrar.addEventListener("click", () => {
    banner.hidden = true;
    try { localStorage.setItem("sonex-instalar-cerrado", "1"); } catch (e) {}
  });
})();
