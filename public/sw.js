/* sw.js — offline support for the study labs. Registered only when a learner chooses "Save lab for offline use".
   Handles the lab pages, their scripts and assets, and the web fonts; everything else on the site is left alone. */
const CACHE = "lwn-labs-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("message", (e) => {
  if (!e.data || e.data.type !== "precache") return;
  e.waitUntil(caches.open(CACHE).then(async (c) => {
    let n = 0;
    for (const u of e.data.urls || []) { try { const r = await fetch(u, { cache: "no-cache" }); if (r.ok) { await c.put(u, r); n++; } } catch (err) { /* skip */ } }
    if (e.ports[0]) e.ports[0].postMessage({ ok: n > 0, n });
  }));
});
const isLab = (u) => u.origin === self.location.origin && (u.pathname.startsWith("/labs/") || /^\/(waec-|physics_lab|chemistry-sim)/.test(u.pathname));
const isFont = (u) => /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET") return;
  const u = new URL(req.url); if (!isLab(u) && !isFont(u)) return;
  const asset = isFont(u) || /\/assets\/|\/vendor\//.test(u.pathname);
  e.respondWith(caches.open(CACHE).then(async (c) => {
    if (asset) { const hit = await c.match(req); if (hit) return hit; }               // textures, skies, models, fonts: cache first
    try { const r = await fetch(req); if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }   // pages and scripts: fresh when online
    catch (err) { const hit = await c.match(req, { ignoreSearch: true }); if (hit) return hit; throw err; }
  }));
});
