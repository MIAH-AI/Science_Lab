/* p3dx-kit.js — shared helpers for the photoreal three.js versions of the p2d-* simulations.
   Each p3dx-* scene keeps the 2D variant's physics (no sc.step / sc.readouts, so the engine runs variant.step and
   variant.readouts) and its 2D teaching panels: X.hud() redraws the variant's 2D picture off-screen while the PK
   drawing helpers record where panels, graphs and notes were drawn, then copies only those rectangles over the 3D
   view. The apparatus itself is rebuilt in 3D. Without WebGL the lab never calls these scenes and the 2D drawing runs. */
(function () {
  "use strict";
  const K = window.PK, P = window.P3D;
  if (!K) return;
  const X = (window.PX3 = { regs: [], rec: false });
  /* record panel / graph / note rectangles while X.rec is on */
  const wrapK = (name, rectOf) => { const f = K[name]; K[name] = function (...a) { if (X.rec) { const r = rectOf(...a); if (r) X.regs.push(r); } return f.apply(K, a); }; };
  wrapK("panel", (ctx, x, y, w, h) => [x - 1, y - 1, w + 2, h + 2]);
  wrapK("axes", (ctx, x, y, w, h, o) => [x - 40, y - (o && o.title ? 20 : 4), w + 46, h + (o && o.xl ? 32 : 18)]);
  { const f = K.notes; K.notes = function (ctx, x, y, w, items, size = 11.5) { const yy = f.apply(K, arguments); if (X.rec) X.regs.push([x - 5, y - size - 3, w + 10, yy - y + 6]); return yy; }; }
  let oc = null, octx = null, od = 0;
  const inside = (a, b) => a[0] >= b[0] - 1 && a[1] >= b[1] - 1 && a[0] + a[2] <= b[0] + b[2] + 1 && a[1] + a[3] <= b[1] + b[3] + 1;
  /* copy the 2D variant's panels onto the overlay. o.keep(r,i) filters regions; o.extra adds rectangles */
  X.hud = function (ctx, S, s, c, o = {}) {
    const v = S && S.variant; if (!v || !v.draw) return [];
    const d = ctx.getTransform ? ctx.getTransform().a || 1 : 1;
    if (!oc || od !== d) { oc = document.createElement("canvas"); oc.width = 640 * d; oc.height = 400 * d; octx = oc.getContext("2d"); od = d; }
    octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, oc.width, oc.height); octx.setTransform(d, 0, 0, d, 0, 0);
    X.regs = []; X.rec = true;
    try { v.draw(octx, s, c, 640, 400); } catch (e) { /* the 2D picture is only a source of panels */ }
    X.rec = false;
    let regs = X.regs.concat(o.extra || []).filter((r, i) => !o.keep || o.keep(r, i));
    regs = regs.filter((r, i) => !regs.some((q, j) => j !== i && inside(r, q) && !(inside(q, r) && j > i)));
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    regs.forEach((r, i) => {
      const x = Math.max(0, r[0]), y = Math.max(0, r[1]), w = Math.min(640 - x, r[2] - (x - r[0])), h = Math.min(400 - y, r[3] - (y - r[1]));
      if (w <= 1 || h <= 1) return; const D = (o.place && o.place(r, i)) || [x, y, w, h];
      if (r.bg || o.bgAll || (o.bg && o.place && o.place(r, i))) { ctx.fillStyle = "rgba(6,12,24,.62)"; ctx.strokeStyle = "rgba(127,227,218,.25)"; ctx.lineWidth = d; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(D[0] * d, D[1] * d, D[2] * d, D[3] * d, 6 * d) : ctx.rect(D[0] * d, D[1] * d, D[2] * d, D[3] * d); ctx.fill(); ctx.stroke(); }
      ctx.drawImage(oc, x * d, y * d, w * d, h * d, D[0] * d, D[1] * d, D[2] * d, D[3] * d);
    });
    ctx.restore(); return regs;
  };
  /* the most common overlay: 2D panels + an equation pill + optional projected labels */
  X.overlay = function (extra) {
    return function (ctx, s, c, w, h, S) {
      const o = (this.hudOpt && this.hudOpt(s, c)) || this.hudOpt0 || {};
      X.hud(ctx, S, s, c, o);
      if (extra) extra.call(this, ctx, s, c, S, P.hud);
    };
  };
  X.bgr = (x, y, w, h) => Object.assign([x, y, w, h], { bg: 1 });
  /* scale a region into a destination box (keeps aspect): used to tuck 2D graphs into a corner of the 3D view */
  X.fit = (r, bx, by, bw, bh) => { const k = Math.min(bw / r[2], bh / r[3]); return [bx, by, r[2] * k, r[3] * k]; };
  X.lbl = (ctx, S, p, text, col, dx = 10, dy = -10, size = 11) => { const q = S.proj(p); if (q.z < 1) P.hud.pill(ctx, q.x + dx, q.y + dy, text, col, size); };
  /* small helpers for scene files */
  X.V = (x, y, z) => new THREE.Vector3(x, y, z);
  X.col = (hex) => new THREE.Color(hex);
  X.textTex = function (lines, o = {}) {           // canvas texture with printed text (scales, labels, dials)
    const w = o.w || 256, h = o.h || 128, cv = document.createElement("canvas"); cv.width = w; cv.height = h; const g = cv.getContext("2d");
    g.fillStyle = o.bg || "#efe9d8"; g.fillRect(0, 0, w, h); g.fillStyle = o.fg || "#1b1b1b"; g.textAlign = "center"; g.textBaseline = "middle";
    const L = [].concat(lines), fs = o.size || Math.floor(h / (L.length + 0.6)); g.font = `${o.bold ? "700 " : "600 "}${fs}px 'IBM Plex Mono',monospace`;
    L.forEach((t, i) => g.fillText(t, w / 2, h / 2 + (i - (L.length - 1) / 2) * fs * 1.1));
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
  };
  X.scaleTex = function (n, o = {}) {              // printed tick scale (rulers, thermometers, cylinders)
    const w = o.w || 64, h = o.h || 512, cv = document.createElement("canvas"); cv.width = w; cv.height = h; const g = cv.getContext("2d");
    g.fillStyle = o.bg || "rgba(0,0,0,0)"; g.fillRect(0, 0, w, h); g.strokeStyle = g.fillStyle = o.fg || "#111"; g.font = `${o.fs || 16}px 'IBM Plex Mono',monospace`;
    for (let i = 0; i <= n; i++) { const y = h - 6 - (i / n) * (h - 12), big = i % (o.major || 5) === 0; g.lineWidth = big ? 2 : 1; g.beginPath(); g.moveTo(0, y); g.lineTo(big ? w * 0.45 : w * 0.25, y); g.stroke(); if (big && o.label) g.fillText(o.label(i), w * 0.5, y + 5); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
  };
  X.mat = (o) => new THREE.MeshPhysicalMaterial(o);
  X.group = (S, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); S.scene.add(g); return g; };
  X.shadow = (m) => { m.traverse((q) => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); return m; };
  X.mesh = (geo, mat, parent, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
  X.ready = !!(P && P.ready);
  /* register a scene: o.shift = px (or [x,y]) the view is slid so the apparatus clears the 2D panels (default: right panel) */
  X.def = function (name, o) {
    if (!X.ready) return; const b = o.build;
    P.scenes[name] = Object.assign({ env: "lab", fov: 36, overlay: X.overlay(o.hud) }, o, {
      build(S, s, c) { const sh = o.shift == null ? 112 : o.shift, sx = Array.isArray(sh) ? sh[0] : sh, sy = Array.isArray(sh) ? sh[1] : 0;
        if (sx || sy) S.camera.setViewOffset(640, 400, sx, sy, 640, 400); S.key = null; b.call(this, S, s, c, S.mk, S.objs); },
    });
  };
  /* printed display / label whose canvas is redrawn only when its text changes */
  X.screen = function (parent, w, h, o = {}) {
    const cv = document.createElement("canvas"); cv.width = o.pw || 256; cv.height = Math.round(cv.width * h / w); const g = cv.getContext("2d");
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: o.glow == null ? 0.9 : o.glow, roughness: 0.35, toneMapped: o.glow !== 0 ? false : true }));
    parent.add(m); let last = null;
    m.set = (lines, fg) => { const key = [].concat(lines).join("|") + fg; if (key === last) return; last = key;
      g.fillStyle = o.bg || "#0d1a10"; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = fg || o.fg || "#7dff9a"; g.textAlign = o.align || "center"; g.textBaseline = "middle";
      const L = [].concat(lines), fs = Math.floor(cv.height / (L.length + 0.5)) * (o.fs || 0.8); g.font = `${o.bold === false ? "" : "700 "}${fs}px 'IBM Plex Mono',monospace`;
      L.forEach((s, i) => g.fillText(s, o.align === "left" ? 10 : cv.width / 2, cv.height / 2 + (i - (L.length - 1) / 2) * fs * 1.15)); t.needsUpdate = true; };
    return m;
  };
  /* dynamic polyline (trails, rays drawn as thin lines) */
  X.line = function (S, n, color, op = 1) {
    const g = new THREE.BufferGeometry(), a = new Float32Array(n * 3); g.setAttribute("position", new THREE.BufferAttribute(a, 3)); g.setDrawRange(0, 0);
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: op < 1, opacity: op })); l.frustumCulled = false; S.scene.add(l);
    l.setPts = (pts) => { const k = Math.min(n, pts.length); for (let i = 0; i < k; i++) { const p = pts[i]; a[i * 3] = p[0]; a[i * 3 + 1] = p[1]; a[i * 3 + 2] = p[2]; } g.attributes.position.needsUpdate = true; g.setDrawRange(0, k); };
    return l;
  };
  /* rebuild-on-change helper: returns true when the structural key differs from the last call */
  X.changed = (S, key) => { if (S.key === key) return false; S.key = key; return true; };
  X.clear = (S, list) => { (list || []).forEach((m) => { if (!m) return; m.parent && m.parent.remove(m); m.traverse((q) => { q.geometry && q.geometry.dispose(); }); }); return []; };
})();
