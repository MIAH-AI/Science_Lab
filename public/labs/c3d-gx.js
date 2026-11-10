/* c3d-gx.js — shared helpers for the chemistry 3D gap-filling scenes (c3d-gaps*.js):
   HUD text panels, a VSEPR-lite molecule builder, powders/crystals, balance, thermometer, tripod, dishes, round-bottomed flask. */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, CM = C3.CM, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const G = (C3.gx = { clamp, lerp, CM, TAU });
  G.mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  G.css = (rgb, a) => "rgba(" + (rgb[0] | 0) + "," + (rgb[1] | 0) + "," + (rgb[2] | 0) + "," + (a == null ? 1 : a) + ")";
  G.col = (rgb) => new T.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255).convertSRGBToLinear();
  G.smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

  /* ---------- HUD text ---------- */
  G.wrapLines = (ctx, text, mw) => { const out = []; String(text).split("\n").forEach((para) => { const w = para.split(" "); let l = ""; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { out.push(l); l = t; } else l = k; }); out.push(l); }); return out; };
  /* panel with a title and wrapped body lines; body: string | [string | [string,color]]; returns bottom y */
  G.panel = function (ctx, x, y, w, title, body, o) {
    o = o || {}; const fs = o.fs || 8.6, lh = o.lh || fs + 2.6; ctx.save(); ctx.font = fs + "px 'IBM Plex Mono',monospace";
    const items = (Array.isArray(body) ? body : [body]).map((b) => (Array.isArray(b) ? b : [b, o.color || "#e8f0ff"]));
    const lines = []; items.forEach(([t, c]) => G.wrapLines(ctx, t, w - 16).forEach((l) => lines.push([l, c])));
    const h = (title ? 22 : 10) + lines.length * lh + 4; H.panel(ctx, x, y, w, h);
    let yy = y + 15; if (title) { ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = o.tc || "#8fb4ff"; ctx.textAlign = "left"; ctx.fillText(title, x + 8, yy); yy += 13; }
    ctx.font = fs + "px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; lines.forEach(([l, c]) => { ctx.fillStyle = c; ctx.fillText(l, x + 8, yy); yy += lh; });
    ctx.restore(); return y + h;
  };
  G.titles = (ctx, a, b, c) => { if (a) H.pill(ctx, 10, 22, a, "#ffe9b8", 10.5); if (b) H.pill(ctx, 10, 44, b, "#bcd0ea", 9.5); if (c) H.pill(ctx, 10, 66, c[0], c[1] || "#9fe3ff", 9.5); };
  G.tag = (ctx, S, p, text, color, size) => { const q = S.proj(p.isVector3 ? p : V3(p[0], p[1], p[2])); if (q.z > 1) return; H.pill(ctx, q.x, q.y, text, color || "#cfe0f5", size || 8.5, "center"); };
  G.foot = (ctx, text, color) => H.pill(ctx, 10, 390, text, color || "#cfe8ff", 9.5);
  G.status = (ctx, text, kind) => { if (!text) return; H.pill(ctx, 10, 66, text, kind === "ok" ? "#8dffb8" : kind === "bad" ? "#ff9aa8" : "#9fe3ff", 9.5); };
  /* curly arrow (2D, on the HUD) from a to b in screen space; fish = single-headed half arrow */
  G.curly = function (ctx, a, b, color, fish, bend) {
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, k = bend == null ? 0.45 : bend;
    const cx = mx - dy / L * L * k, cy = my + dx / L * L * k; ctx.save(); ctx.strokeStyle = ctx.fillStyle = color; ctx.lineWidth = 2.2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(cx, cy, b.x, b.y); ctx.stroke();
    const ang = Math.atan2(b.y - cy, b.x - cx), hl = 9; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - hl * Math.cos(ang - 0.42), b.y - hl * Math.sin(ang - 0.42));
    if (!fish) ctx.lineTo(b.x - hl * Math.cos(ang + 0.42), b.y - hl * Math.sin(ang + 0.42)); else ctx.lineTo(b.x - hl * 0.7 * Math.cos(ang), b.y - hl * 0.7 * Math.sin(ang));
    ctx.closePath(); ctx.fill(); ctx.restore();
  };

  /* ---------- extra element colours (CPK/Jmol) ---------- */
  G.ELC = { H: 0xf4f4f4, C: 0x3b3f46, N: 0x3454e8, O: 0xe8281c, F: 0x8ee04a, Cl: 0x22d03a, Br: 0xa62929, I: 0x940094, S: 0xf2e030, P: 0xff8a00, Si: 0xf0c8a0, Na: 0xab5cf2, K: 0x8f40d4, Li: 0xcc80ff, Mg: 0x8aff00, Ca: 0x3dff00, Al: 0xbfa6a6, Fe: 0xe06633, Cu: 0xc88033, Zn: 0x7d80b0, Pb: 0x575961, Ag: 0xc0c0c0, Au: 0xffd123, Be: 0xc2ff00, Ba: 0x00c900, Mn: 0x9c7ac7 };
  const VAL = { H: 1, C: 4, N: 3, O: 2, S: 2, F: 1, Cl: 1, Br: 1, I: 1, Si: 4, B: 3, P: 3 };
  const BL = (a, b, o) => { const k = [a, b].sort().join(""); const t = { CC: [1.54, 1.34, 1.2], CH: [1.09], CO: [1.43, 1.22], HO: [0.96], CN: [1.47, 1.28, 1.16], HN: [1.01], CCl: [1.77], BrC: [1.94], CI: [2.14], CS: [1.82], HS: [1.34], OS: [1.5, 1.45], NO: [1.36, 1.22], OSi: [1.61], ClCl: [1.99], BrBr: [2.28], OO: [1.48, 1.21], HH: [0.74], CF: [1.35], ON: [1.36, 1.22] }[k]; return t ? t[Math.min(t.length - 1, (o || 1) - 1)] : 1.5; };
  /* VSEPR-lite builder. spec: [{el, p (parent index), o (bond order to parent), h:'sp3'|'sp2'|'sp', ch (formal charge), nh (force H count)}]
     → {atoms:[{el,p:[x,y,z]}], bonds:[[i,j,ord]]} for K.molecule (Å). Planar zig-zag chains, hydrogens fill the remaining VSEPR slots. */
  G.build = function (spec, o) {
    o = o || {}; const atoms = [], bonds = [], N = spec.length, kids = spec.map(() => []);
    spec.forEach((a, i) => { if (a.p != null) kids[a.p].push(i); });
    const deg = spec.map((a, i) => (a.p != null ? a.o || 1 : 0) + kids[i].reduce((s, k) => s + (spec[k].o || 1), 0));
    const hyb = (a, i) => a.h || (deg[i] && (spec[i].o === 2 || kids[i].some((k) => spec[k].o === 2)) ? "sp2" : kids[i].some((k) => spec[k].o === 3) || spec[i].o === 3 ? "sp" : "sp3");
    const slots = (d, u, h) => { const w = V3().crossVectors(d, u).normalize(), th = h === "sp2" ? 2 * Math.PI / 3 : h === "sp" ? Math.PI : Math.acos(-1 / 3), ph = h === "sp2" ? [0, Math.PI] : h === "sp" ? [0] : [0, TAU / 3, 2 * TAU / 3];
      return ph.map((f) => d.clone().multiplyScalar(Math.cos(th)).add(u.clone().multiplyScalar(Math.cos(f) * Math.sin(th))).add(w.clone().multiplyScalar(Math.sin(f) * Math.sin(th))).normalize()); };
    const pos = new Array(N), D = new Array(N);
    function place(i, p, d, u, rootExtra) {
      pos[i] = p; D[i] = d; atoms[i] = { el: spec[i].el, p: [p.x, p.y, p.z] };
      const a = spec[i], h = hyb(a, i), sl = slots(d, u, h); if (rootExtra) sl.push(d.clone());
      const order = (a.slotOrder || null); const free = order ? order.map((k) => sl[k]) : sl.slice();
      kids[i].forEach((k) => { const e = free.shift(); const c = p.clone().addScaledVector(e, BL(a.el, spec[k].el, spec[k].o)); const dk = e.clone().negate();
        let uk = d.clone().negate(); uk.addScaledVector(dk, -uk.dot(dk)); if (uk.lengthSq() < 1e-6) uk = V3(0, 0, 1).addScaledVector(dk, -dk.z); uk.normalize(); bonds.push([i, k, spec[k].o || 1]); place(k, c, dk, uk, false); });
      const v = (a.nh != null ? a.nh : Math.max(0, (VAL[a.el] || 0) + (a.ch || 0) * (a.el === "C" ? -1 : 1) - deg[i]));
      for (let n = 0; n < v && free.length; n++) { const e = free.shift(), id = atoms.length; const hp = p.clone().addScaledVector(e, BL(a.el, "H", 1)); atoms.push({ el: "H", p: [hp.x, hp.y, hp.z] }); bonds.push([i, id, 1]); }
    }
    const d0 = V3(-0.82, -0.57, 0).normalize(), u0 = V3(0.57, -0.82, 0).normalize();
    place(0, V3(), d0, u0, true);
    if (o.center !== false) { const c = atoms.reduce((s, a) => s.add(V3(...a.p)), V3()).multiplyScalar(1 / atoms.length); atoms.forEach((a) => { a.p = [a.p[0] - c.x, a.p[1] - c.y, a.p[2] - c.z]; }); }
    return { atoms, bonds };
  };
  /* straight-chain helper: n carbons, optional double bond after carbon db (1-based), substituent on a carbon */
  G.chain = function (n, o) { o = o || {}; const s = []; for (let i = 0; i < n; i++) s.push({ el: "C", p: i ? i - 1 : undefined, o: o.db === i ? 2 : o.tb === i ? 3 : 1 }); return s; };
  G.molecule = function (K, def, o) {
    o = o || {}; const MO = K.molecule(def); MO.atoms.forEach((a) => { if (G.ELC[a.el] != null && !({ H: 1, C: 1, N: 1, O: 1, Cl: 1, S: 1 })[a.el]) a.mesh.material.color.setHex(G.ELC[a.el]); });
    if (o.scale) MO.group.scale.setScalar(o.scale); if (o.pos) MO.group.position.set(...o.pos); return MO;
  };
  G.disposeGroup = (g) => { if (!g) return; g.parent && g.parent.remove(g); g.traverse((m) => { if (m.geometry) m.geometry.dispose(); if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => { if (x.map) x.map.dispose(); x.dispose(); }); }); };

  /* ---------- materials & solids ---------- */
  G.noiseTex = function (base, spread, n) { const c = U.cv(256, 256), g = c.getContext("2d"); g.fillStyle = G.css(base); g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < (n || 2600); i++) { const k = (Math.random() - 0.5) * spread; g.fillStyle = G.css([base[0] + k, base[1] + k, base[2] + k * 0.9], 0.85); const r = Math.random() * 2.2 + 0.4; g.fillRect(Math.random() * 256, Math.random() * 256, r, r); }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; return t; };
  G.powderMat = (rgb, rough) => new T.MeshStandardMaterial({ color: 0xffffff, map: G.noiseTex(rgb, 46), roughness: rough == null ? 0.96 : rough, metalness: 0 });
  /* conical heap of powder (mound) with a lumpy surface; rCm base radius, hCm height */
  G.heap = function (rCm, hCm, rgb, o) {
    o = o || {}; const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(new T.Vector2(rCm * CM * Math.pow(1 - t, 0.75) + 0.0002, hCm * CM * (1 - Math.pow(1 - t, 0.6)) * (t < 1 ? 1 : 1))); }
    pts.push(new T.Vector2(0.0001, hCm * CM)); const g = new T.LatheGeometry(pts, 40), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), r = Math.hypot(p.getX(i), p.getZ(i)); if (r < 1e-4) continue; const k = 1 + (Math.random() - 0.5) * (o.lumpy == null ? 0.16 : o.lumpy) * (y / (hCm * CM) + 0.3); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
    g.computeVertexNormals(); const m = new T.Mesh(g, o.mat || G.powderMat(rgb, o.rough)); m.castShadow = m.receiveShadow = true; return m;
  };
  G.crystalMat = (rgb, op) => new T.MeshPhysicalMaterial({ color: G.col(rgb), roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, transparent: op != null && op < 1, opacity: op == null ? 1 : op, envMapIntensity: 1.8 });
  /* scattered crystals (instanced): shape 'oct' | 'box' | 'needle' | 'lump'; returns InstancedMesh with .layout(fn) */
  G.crystals = function (n, shape, rgb, sizeCm, o) {
    o = o || {}; const geo = shape === "oct" ? new T.OctahedronGeometry(1, 0) : shape === "needle" ? new T.BoxGeometry(0.18, 0.18, 1.6) : shape === "lump" ? new T.IcosahedronGeometry(1, 0) : new T.BoxGeometry(1, 1, 1);
    const im = new T.InstancedMesh(geo, o.mat || G.crystalMat(rgb, o.op), n), m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), s3 = V3(); im.castShadow = true; im.receiveShadow = true;
    im.layout = (fn) => { for (let i = 0; i < n; i++) { const r = fn(i); e.set(r.rx || 0, r.ry || 0, r.rz || 0); q.setFromEuler(e); const k = (r.s == null ? 1 : r.s) * sizeCm * CM; s3.set(k * (r.sx || 1), k * (r.sy || 1), k * (r.sz || 1)); m4.compose(V3(r.x, r.y, r.z), q, s3); im.setMatrixAt(i, m4); } im.instanceMatrix.needsUpdate = true; };
    return im;
  };

  /* ---------- apparatus ---------- */
  G.lcd = function (w, h) { const c = U.cv(w || 256, h || 72), t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; let last = null;
    return { tex: t, set(text, col) { if (text === last) return; last = text; const g = c.getContext("2d"); g.fillStyle = "#1b2a1e"; g.fillRect(0, 0, c.width, c.height); g.fillStyle = col || "#9dff9a"; g.font = "bold " + Math.round(c.height * 0.62) + "px 'IBM Plex Mono',monospace"; g.textAlign = "right"; g.textBaseline = "middle"; g.fillText(text, c.width - 10, c.height / 2 + 2); t.needsUpdate = true; } }; };
  /* electronic top-pan balance; pan surface at y = panY (units) */
  G.balance = function (S, x, z, o) {
    o = o || {}; const g = new T.Group(), sc = S.scene; const body = S.mk.rbox(19 * CM, 6 * CM, 22 * CM, 0.04, M.plastic(0xe9ebee, 0.35)); sc.remove(body); body.position.y = 3 * CM; g.add(body);
    const front = S.mk.rbox(19 * CM, 2.4 * CM, 5 * CM, 0.012, M.plastic(0x2b3038, 0.4)); sc.remove(front); front.position.set(0, 4.2 * CM, 9.8 * CM); front.rotation.x = -0.35; g.add(front);
    const lcd = G.lcd(256, 72), scr = new T.Mesh(new T.PlaneGeometry(9 * CM, 1.9 * CM), new T.MeshBasicMaterial({ map: lcd.tex, toneMapped: false })); scr.position.set(-2.5 * CM, 0, 3.25 * CM); front.add(scr);
    [-5.5, 5.5].forEach((bx, i) => { const b = new T.Mesh(new T.CylinderGeometry(0.6 * CM, 0.6 * CM, 0.4 * CM, 20), M.plastic(i ? 0x2f86ff : 0xe23d3d, 0.4)); b.position.set(bx * 0.9 * CM + 1.6 * CM * (i ? 1 : 0), 4.95 * CM, 10.6 * CM); b.rotation.x = Math.PI / 2 - 0.35; if (i) g.add(b); });
    const stem = new T.Mesh(new T.CylinderGeometry(1 * CM, 1 * CM, 1 * CM, 20), M.steel()); stem.position.y = 6.5 * CM; g.add(stem);
    const pan = new T.Mesh(new T.CylinderGeometry(7.5 * CM, 7.3 * CM, 0.5 * CM, 64), M.steel()); pan.material.roughness = 0.22; pan.position.y = 7.2 * CM; pan.castShadow = pan.receiveShadow = true; g.add(pan);
    g.position.set(x, 0, z); g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); sc.add(g);
    const B = { group: g, panY: 7.45 * CM, lcd, set: (grams, dp) => lcd.set((grams).toFixed(dp == null ? 2 : dp) + " g") }; B.set(0); return B;
  };
  /* mercury-free (red spirit) thermometer, bulb at (x,y,z), lenCm long; set(T °C) */
  G.thermo = function (S, o) {
    const g = new T.Group(), L = (o.len || 30) * CM, min = o.min == null ? -10 : o.min, max = o.max == null ? 110 : o.max, K = C3.kit(S);
    const stem = new T.Mesh(new T.CylinderGeometry(0.36 * CM, 0.36 * CM, L, 20), K.glassMat({ opacity: 0.16, env: 3 })); stem.position.y = L / 2; stem.renderOrder = 4; g.add(stem);
    const bulb = new T.Mesh(new T.CapsuleGeometry(0.3 * CM, 1.2 * CM, 6, 16), new T.MeshPhysicalMaterial({ color: 0xd8202a, roughness: 0.2, clearcoat: 1 })); bulb.position.y = 0.7 * CM; g.add(bulb);
    const col = new T.Mesh(new T.CylinderGeometry(0.11 * CM, 0.11 * CM, 1, 10), new T.MeshPhysicalMaterial({ color: 0xd8202a, roughness: 0.3 })); g.add(col);
    const c = U.cv(48, 512), cg = c.getContext("2d"); cg.fillStyle = "rgba(255,255,255,0.0)"; cg.fillRect(0, 0, 48, 512); cg.strokeStyle = cg.fillStyle = "#101418"; cg.font = "bold 15px sans-serif";
    const y0 = 1.8 * CM, y1 = L - 1.2 * CM, ty = (Tc) => y0 + (y1 - y0) * (Tc - min) / (max - min);
    for (let v = Math.ceil(min / 2) * 2; v <= max; v += 2) { const py = 512 - (ty(v) / L) * 512; cg.lineWidth = v % 10 ? 1.2 : 2.2; cg.beginPath(); cg.moveTo(0, py); cg.lineTo(v % 10 ? 10 : 18, py); cg.stroke(); if (v % 20 === 0) cg.fillText(String(v), 20, py + 5); }
    const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; const sc2 = new T.Mesh(new T.PlaneGeometry(0.75 * CM, L), new T.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false })); sc2.position.set(0.38 * CM, L / 2, 0.05 * CM); sc2.renderOrder = 6; g.add(sc2);
    g.position.set(o.x || 0, o.y || 0, o.z || 0); if (o.rz) g.rotation.z = o.rz; S.scene.add(g);
    const Th = { group: g, T: 20, set(Tc) { Th.T = Tc; const top = ty(clamp(Tc, min - 1, max + 1)), b = 1.4 * CM; col.scale.y = Math.max(0.001, top - b); col.position.y = b + (top - b) / 2; }, topY: () => g.position.y + L };
    Th.set(o.T == null ? 20 : o.T); return Th;
  };
  /* tripod stand + wire gauze (top at yCm); returns top y in units */
  G.tripod = function (S, x, z, hCm, o) {
    o = o || {}; const g = new T.Group(), h = (hCm || 20) * CM, steel = M.iron(); const ring = new T.Mesh(new T.TorusGeometry(6 * CM, 0.4 * CM, 10, 40), steel); ring.rotation.x = Math.PI / 2; ring.position.y = h - 0.4 * CM; g.add(ring);
    for (let i = 0; i < 3; i++) { const a = i * TAU / 3, leg = new T.Mesh(new T.CylinderGeometry(0.35 * CM, 0.35 * CM, 1, 10), steel); S.setRod(leg, V3(Math.cos(a) * 6 * CM, h - 0.4 * CM, Math.sin(a) * 6 * CM), V3(Math.cos(a) * 7.6 * CM, 0, Math.sin(a) * 7.6 * CM)); g.add(leg); }
    if (!o.noGauze) { const c = U.cv(256, 256), cg = c.getContext("2d"); cg.clearRect(0, 0, 256, 256); cg.strokeStyle = "rgba(70,72,78,1)"; cg.lineWidth = 1.4; for (let i = 0; i < 256; i += 7) { cg.beginPath(); cg.moveTo(i, 0); cg.lineTo(i, 256); cg.moveTo(0, i); cg.lineTo(256, i); cg.stroke(); }
      cg.fillStyle = "rgba(225,222,214,0.95)"; cg.beginPath(); cg.arc(128, 128, 62, 0, TAU); cg.fill(); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
      const gz = new T.Mesh(new T.BoxGeometry(14 * CM, 0.12 * CM, 14 * CM), [M.iron(), M.iron(), new T.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.3, roughness: 0.8, metalness: 0.4 }), M.iron(), M.iron(), M.iron()]); gz.position.y = h + 0.06 * CM; g.add(gz); g.gauze = gz; }
    g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); g.position.set(x, 0, z); S.scene.add(g); g.topY = h + 0.12 * CM; return g;
  };
  /* custom vessels (cm profiles) */
  G.DEFS = {
    rbflask: (() => { const R = 5, o = [], n = []; for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + (i / 16) * (Math.PI - 0.32); o.push([R * Math.cos(a), R + R * Math.sin(a)]); n.push([(R - 0.25) * Math.cos(a), R + (R - 0.25) * Math.sin(a) + (i === 0 ? 0.25 : 0)]); } o[0][0] = 0; n[0][0] = 0; const ny = o[o.length - 1][1]; o.push([1.5, ny + 0.3], [1.5, 17], [1.75, 17.2]); n.push([1.2, ny + 0.3], [1.2, 17], [1.4, 17.2]); return { outer: o, inner: n }; })(),
    dish: { outer: [[0, 0], [2.2, 0.05], [4.2, 0.6], [5.6, 1.7], [6.4, 3.0]], inner: [[0, 0.3], [2.1, 0.35], [4.0, 0.85], [5.3, 1.9], [6.1, 3.0]] },
    crucible: { outer: [[0, 0], [1.5, 0], [1.9, 0.3], [2.6, 3.8], [2.75, 4.0]], inner: [[0, 0.25], [1.35, 0.25], [1.7, 0.5], [2.4, 3.8], [2.55, 4.0]] },
    boilingtube: { outer: [[0, 0], [0.45, 0.04], [0.8, 0.2], [1.05, 0.55], [1.15, 1.0], [1.15, 15]], inner: [[0, 0.12], [0.4, 0.16], [0.7, 0.35], [0.92, 0.65], [1.0, 1.1], [1.0, 15]] },
    cup: { outer: [[0, 0], [3.0, 0], [3.3, 0.3], [4.2, 9.4], [4.45, 9.6]], inner: [[0, 0.5], [2.75, 0.5], [3.05, 0.8], [3.95, 9.4], [4.15, 9.6]] },
    trough: { outer: [[0, 0], [9.6, 0], [10, 0.4], [10, 9]], inner: [[0, 0.4], [9.6, 0.4], [9.6, 9]] },
    can: { outer: [[0, 0], [3.8, 0], [4.0, 0.2], [4.0, 9.8], [4.15, 10]], inner: [[0, 0.12], [3.8, 0.12], [3.88, 0.3], [3.88, 9.8], [4.0, 10]] },
  };
  /* opaque vessels: replace the fresnel glass with ceramic / foam / metal */
  G.opaque = (ves, mat) => { ves.glass.material.dispose(); ves.glass.material = mat; ves.glass.material.side = T.DoubleSide; ves.glass.renderOrder = 0; ves.glass.castShadow = true; ves.glass.receiveShadow = true; return ves; };
  G.foam = () => { const m = new T.MeshStandardMaterial({ color: 0xffffff, map: G.noiseTex([246, 246, 242], 14, 6000), roughness: 0.92 }); return m; };
  /* simple glass tube along points (units) */
  G.glassTube = (S, K, pts, rCm, op) => { const m = S.mk.tube(pts, (rCm || 0.35) * CM, K.glassMat({ opacity: op == null ? 0.12 : op, env: 3 }), 64); m.castShadow = false; m.renderOrder = 4; return m; };
  G.liquidTube = (S, K, pts, rCm, rgb, op) => { const m = S.mk.tube(pts, (rCm || 0.25) * CM, K.liquidMat(G.col(rgb), op == null ? 0.5 : op), 64); m.castShadow = false; m.renderOrder = 3; return m; };
  /* tongs (crucible tongs) from handle to tip */
  G.tongs = function (S, tip, dir, lenCm) {
    const g = new T.Group(), L = (lenCm || 22) * CM, d = V3(...dir).normalize(), m = M.steel(), side = V3().crossVectors(d, V3(0, 1, 0)).normalize().multiplyScalar(0.6 * CM);
    [1, -1].forEach((k) => { const r = new T.Mesh(new T.CylinderGeometry(0.22 * CM, 0.22 * CM, 1, 10), m); S.setRod(r, V3(...tip).addScaledVector(side, k * 0.3), V3(...tip).addScaledVector(d, -L).addScaledVector(side, k * 2.2)); r.castShadow = true; g.add(r); });
    S.scene.add(g); return g;
  };
  /* white card label floating on a vessel (front) */
  G.labelCard = function (text, wCm, hCm, o) { o = o || {}; const c = U.cv(256, Math.round(256 * hCm / wCm)), g = c.getContext("2d"); g.fillStyle = o.bg || "#f6f3ea"; g.fillRect(0, 0, c.width, c.height); g.fillStyle = o.fg || "#1a1d22"; g.font = "bold " + Math.round(c.height * 0.42) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, c.width / 2, c.height / 2 + 2);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; const m = new T.Mesh(new T.PlaneGeometry(wCm * CM, hCm * CM), new T.MeshStandardMaterial({ map: t, roughness: 0.7 })); return m; };
  /* glowing hot zone (red-hot glass / metal) */
  G.hotMat = () => new T.MeshStandardMaterial({ color: 0x222222, emissive: new T.Color(1, 0.35, 0.06), emissiveIntensity: 0, roughness: 0.5 });
  G.glowCol = (Tc) => { const k = clamp((Tc - 500) / 900, 0, 1); return new T.Color(1, 0.18 + 0.6 * k, 0.03 + 0.5 * k * k); };
  /* steam / fume wisps from a point */
  G.wisp = (S, x, y, z, color, o) => S.puff(x, y, z, Object.assign({ n: 1, color, speed: 0.08, up: 0.5, life: 2.2, size: 0.32, op: 0.35, grow: 2.4 }, o || {}));
  /* gas-jar style simple stopper (rubber bung) */
  G.bung = (S, rCm, hCm) => { const m = new T.Mesh(new T.CylinderGeometry(rCm * CM, rCm * 0.82 * CM, hCm * CM, 28), M.rubber()); m.material.color.setHex(0x8a3b22); m.material.roughness = 0.7; m.castShadow = true; S.scene.add(m); return m; };
  /* tabulated quick table */
  G.table = (head, rows) => '<table class="c3-table"><tr>' + head.map((h) => '<th style="text-align:left">' + h + "</th>").join("") + "</tr>" + rows.map((r) => "<tr" + (r.ok ? ' class="ok"' : "") + ">" + (r.cells || r).map((c) => '<td style="text-align:left">' + c + "</td>").join("") + "</tr>").join("") + "</table>";
})();
