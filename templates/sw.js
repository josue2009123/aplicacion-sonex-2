/* Sonex — service worker de la app móvil.
   - Archivos estáticos: se sirven desde caché y se actualizan en segundo plano.
   - Páginas públicas (inicio, tienda, productos): primero la red; sin internet, la última copia.
   - Cuenta, carrito, pedidos, huella y QR: siempre en vivo, nunca se guardan en caché. */
const CACHE = "{{ version }}";
const PRECACHE = [
  "/offline",
  "/static/style.css?v=2",
  "/static/app.js?v=2",
  "/static/icons/icon-192.png",
  "/static/icons/icon-512.png",
  "/static/img/audifonos-buds.jpg",
  "/static/img/diadema.svg",
  "/static/img/avatar-rosa.jpg",
  "/static/img/avatar-turquesa.jpg",
];
const PUBLICAS = [/^\/$/, /^\/tienda$/, /^\/producto\/[\w-]+$/];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (url.pathname.startsWith("/static/")) {
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const guardado = await c.match(req);
        const red = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => guardado);
        return guardado || red;
      })
    );
    return;
  }

  if (req.mode === "navigate") {
    const publica = PUBLICAS.some((re) => re.test(url.pathname));
    e.respondWith(
      fetch(req)
        .then((r) => {
          if (publica && r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(url.pathname, copia)); }
          return r;
        })
        .catch(async () => (publica && (await caches.match(url.pathname))) || caches.match("/offline"))
    );
  }
});
