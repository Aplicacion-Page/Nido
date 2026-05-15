/* ═══════════════════════════════════════════
   Nido · Construyendo Juntos — Service Worker
   ═══════════════════════════════════════════ */
const C = "nido-v16";
const CDN_HOSTS = [
  "cdnjs.cloudflare.com","cdn.jsdelivr.net","unpkg.com",
  "fonts.googleapis.com","fonts.gstatic.com",
  "assets3.lottiefiles.com","assets1.lottiefiles.com"
];
const API_HOSTS = [
  "firestore.googleapis.com","firebase.googleapis.com",
  "identitytoolkit.googleapis.com",
  "nido-push.trabajos-excel-co.workers.dev","onesignal.com",
  "cdn.jsdelivr.net/npm/@fawazahmed0"
];

self.addEventListener("install", e => { self.skipWaiting(); });

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);

  // APIs de datos — siempre network, nunca cachear
  if (API_HOSTS.some(h => url.hostname.includes(h))) return;

  // CDN estáticos — cache first, network fallback
  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(r => {
          if (r && r.ok) { const cl = r.clone(); caches.open(C).then(ca => ca.put(e.request, cl)); }
          return r;
        }).catch(() => cached || new Response("", { status: 503 }));
      })
    );
    return;
  }

  // App shell — network first, cache fallback
  e.respondWith(
    fetch(e.request).then(r => {
      if (r && r.ok) { const cl = r.clone(); caches.open(C).then(ca => ca.put(e.request, cl)); }
      return r;
    }).catch(() =>
      caches.match(e.request).then(c =>
        c || new Response("Sin conexión", { status: 503, headers: { "Content-Type": "text/plain" } })
      )
    )
  );
});
