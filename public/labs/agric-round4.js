/* agric-round4.js — fourth redesign round for the Agricultural Science lab (loads after agric-round3.js).
   Processing and livestock machines rebuilt to real-machine anatomy, at real size in metres, each one able to run:
     1. Maize sheller   — angle-iron stand, red drum casing, spiked shelling drum over a concave sieve, angled feed
                          hopper, electric motor with V-belt and guard, cleaning fan, grain chute and cob outlet.
     2. Crop dryer      — mobile recirculating tower dryer on a trailer: perforated drying column round a hot-air
                          plenum, conical base, bucket elevator and spout, burner and centrifugal fan, control panel.
     3. Incubator       — cabinet setter and hatcher: insulated walls, double doors with portholes, tilting egg trays,
                          fan and heater, water pan, hatcher baskets, LED controller, plus an egg candler.
     4. Milking machine — bucket milker trolley: electric motor and vacuum pump, vacuum tank, gauge and regulator,
                          stainless bucket with pulsator lid, clear milk tube, claw and four teat cups, and a teat
                          cup in section showing the milking and rest phases.
   Machines are generic teaching models: proportions are typical values for small farm machines, no maker's design,
   colour scheme, name or logo is copied. Everything is generated in code. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, AK = window.AK, GK = window.GK;
  if (!MK || !BK || !AK || !GK || !AK.r3) return;
  const T = () => window.THREE, R = AK.r3, { M, box, cyl, bar, tube, grp, rb, paint, satin, polished, zinc, glassM, lampM, polymer, mergeGeos, once, clamp, V } = R;
  const PI = Math.PI, TAU = 2 * PI;
  const part = (g, obj, name, ex) => R.part(g, obj, name, ex);
  const dbl = (m) => { const k = "dbl" + m.uuid; return once(k, () => { const c = m.clone(); c.side = T().DoubleSide; return c; }); };
  const cv = (w, h) => BK.cv(w, h);

  /* ---------------- textures ---------------- */
  const canvasTex = (c, rep) => { const t = new (T().CanvasTexture)(c); t.wrapS = t.wrapT = T().RepeatWrapping; if (rep) t.repeat.set(rep[0], rep[1]); if (T().SRGBColorSpace) t.colorSpace = T().SRGBColorSpace; return t; };
  const kernelCanvas = () => once("kcv", () => { const c = cv(256, 256), x = c.getContext("2d"); x.fillStyle = "#9a6a14"; x.fillRect(0, 0, 256, 256); for (let r = 0; r < 16; r++) for (let k = 0; k < 22; k++) { const px = k * 12 + (r % 2) * 6, py = r * 16 + 1, gr = x.createLinearGradient(px, py, px + 10, py + 14); gr.addColorStop(0, "#ffe07a"); gr.addColorStop(0.5, "#f2b52a"); gr.addColorStop(1, "#cf8a14"); x.fillStyle = gr; x.beginPath(); x.ellipse(px + 5, py + 7, 5, 7, 0, 0, TAU); x.fill(); x.fillStyle = "rgba(255,255,230,.5)"; x.beginPath(); x.ellipse(px + 3.5, py + 4.5, 1.6, 2.4, 0, 0, TAU); x.fill(); } return c; });
  const kernelTex = (rep = [1, 1], key = "") => once("ktx" + rep + key, () => canvasTex(kernelCanvas(), rep));
  const cobTex = () => once("cob", () => { const c = cv(128, 128), x = c.getContext("2d"); x.fillStyle = "#b8665a"; x.fillRect(0, 0, 128, 128); for (let r = 0; r < 12; r++) for (let k = 0; k < 12; k++) { x.fillStyle = (r + k) % 3 ? "#e2b2a0" : "#d49484"; x.beginPath(); x.ellipse(k * 11 + (r % 2) * 5 + 5, r * 11 + 5, 3.4, 4.2, 0, 0, TAU); x.fill(); } return canvasTex(c, [1, 1]); });
  const perfTex = (rep) => once("perf" + rep, () => { const c = cv(128, 128), x = c.getContext("2d"); x.fillStyle = "#c3c8cd"; x.fillRect(0, 0, 128, 128); x.fillStyle = "#2c3034"; for (let r = 0; r < 16; r++) for (let k = 0; k < 16; k++) { x.beginPath(); x.arc(k * 8 + (r % 2) * 4 + 2, r * 8 + 4, 1.7, 0, TAU); x.fill(); } return canvasTex(c, rep); });
  const perfMat = (rep = [10, 6]) => once("perfM" + rep, () => new (T().MeshStandardMaterial)({ map: perfTex(rep), metalness: 0.75, roughness: 0.42, side: T().DoubleSide }));
  const meshMat = () => once("wiremesh", () => { const c = cv(64, 64), x = c.getContext("2d"); x.clearRect(0, 0, 64, 64); x.strokeStyle = "#d8dcdf"; x.lineWidth = 2; for (let i = 0; i <= 64; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 64); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(64, i); x.stroke(); } const t = canvasTex(c, [6, 10]); return new (T().MeshStandardMaterial)({ map: t, transparent: true, alphaTest: 0.4, metalness: 0.6, roughness: 0.4, side: T().DoubleSide }); });
  const grilleMat = () => once("grille", () => { const c = cv(256, 256), x = c.getContext("2d"); x.clearRect(0, 0, 256, 256); x.strokeStyle = "#e9ecef"; x.lineWidth = 5; for (let r = 30; r <= 124; r += 16) { x.beginPath(); x.arc(128, 128, r, 0, TAU); x.stroke(); } for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; x.beginPath(); x.moveTo(128 + Math.cos(a) * 24, 128 + Math.sin(a) * 24); x.lineTo(128 + Math.cos(a) * 126, 128 + Math.sin(a) * 126); x.stroke(); } x.fillStyle = "#e9ecef"; x.beginPath(); x.arc(128, 128, 24, 0, TAU); x.fill(); return new (T().MeshStandardMaterial)({ map: canvasTex(c), transparent: true, alphaTest: 0.4, metalness: 0.7, roughness: 0.35, side: T().DoubleSide }); });
  /* a live text panel (LED controller, dryer display) */
  const panel = (w, h, pxW, pxH, draw) => { const c = cv(pxW, pxH), x = c.getContext("2d"), t = canvasTex(c), m = new (T().MeshBasicMaterial)({ map: t, toneMapped: false }), mesh = M(new (T().PlaneGeometry)(w, h), m); mesh.castShadow = false; let last = ""; mesh.set = (...a) => { const k = JSON.stringify(a); if (k === last) return; last = k; draw(x, pxW, pxH, ...a); t.needsUpdate = true; }; return mesh; };
  const seg = (x, s, px, py, size, col) => { x.font = "bold " + size + "px 'Courier New', monospace"; x.fillStyle = "rgba(255,60,40,.12)"; x.fillText(String(s).replace(/[0-9]/g, "8"), px, py); x.fillStyle = col; x.shadowColor = col; x.shadowBlur = 10; x.fillText(s, px, py); x.shadowBlur = 0; };

  /* ---------------- small parts ---------------- */
  /* open U-trough along +x from 0 to L, floor at y=0 */
  const trough = (L, W, Hs, mat, end) => { const g = new (T().Group)(), m = dbl(mat), th = 0.006; g.add(box(L, th, W, m, L / 2, 0, 0)); g.add(box(L, Hs, th, m, L / 2, Hs / 2, W / 2)); g.add(box(L, Hs, th, m, L / 2, Hs / 2, -W / 2)); if (end) g.add(box(th, Hs, W, m, end > 0 ? L : 0, Hs / 2, 0)); return g; };
  /* orient a group whose length runs along +x so it points from a to b in a vertical plane, keeping it upright */
  const aim = (obj, a, b) => { const d = V(b[0] - a[0], b[1] - a[1], b[2] - a[2]), h = Math.hypot(d.x, d.z); obj.position.set(...a); obj.rotation.order = "YZX"; obj.rotation.y = Math.atan2(-d.z, d.x); obj.rotation.z = Math.atan2(d.y, h); return obj; };
  const bolts = (g, n, r, mat, at) => { for (let i = 0; i < n; i++) { const a = (i / n) * TAU, b = cyl(0.008, 0.008, 0.012, mat, 0, 0, 0, 6); at(b, a, r); g.add(b); } };
  /* 2D convex hull of two circles (for belts and guards) */
  const hull2 = (cs) => { const pts = []; cs.forEach(([u, v, r]) => { for (let i = 0; i < 32; i++) { const a = (i / 32) * TAU; pts.push([u + Math.cos(a) * r, v + Math.sin(a) * r]); } }); pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = []; for (const p of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
  const finned = (r, L, mat, n = 9) => { const g = new (T().Group)(); g.add(rot(cyl(r, r, L, mat, 0, 0, 0, 22), 0, 0, PI / 2)); for (let i = 0; i < n; i++) g.add(box(L * 0.82, 0.006, r * 0.3, mat, 0, 0, 0)); g.children.slice(1).forEach((f, i) => { const a = (i / n) * TAU; f.position.set(0, Math.sin(a) * r, Math.cos(a) * r); f.rotation.set(-a, 0, 0); }); g.add(rot(cyl(r * 1.02, r * 0.8, 0.05, mat, -L / 2 - 0.02, 0, 0, 22), 0, 0, PI / 2)); g.add(rot(cyl(r * 0.8, r * 1.02, 0.05, mat, L / 2 + 0.02, 0, 0, 22), 0, 0, PI / 2)); return g; };
  const rot = R.rot;
  /* a pool of falling particles in the owner's local space */
  const pool = (n, col, size, opacity = 1) => {
    const T3 = T(), P = new Float32Array(n * 3).fill(-99), geo = new T3.BufferGeometry(); geo.setAttribute("position", new T3.BufferAttribute(P, 3));
    const pts = new T3.Points(geo, new T3.PointsMaterial({ color: col, size, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 })); pts.frustumCulled = false;
    const Vv = new Float32Array(n * 3), life = new Float32Array(n); let k = 0;
    pts.emit = (x, y, z, vx, vy, vz, l = 3) => { const i = k++ % n; P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z; Vv[i * 3] = vx; Vv[i * 3 + 1] = vy; Vv[i * 3 + 2] = vz; life[i] = l; };
    pts.step = (dt, gy = -9.8, floor = 0, drag = 0) => { for (let i = 0; i < n; i++) { if (life[i] <= 0) continue; life[i] -= dt; const j = i * 3; Vv[j + 1] += gy * dt; if (drag) { Vv[j] *= 1 - drag * dt; Vv[j + 2] *= 1 - drag * dt; } P[j] += Vv[j] * dt; P[j + 1] += Vv[j + 1] * dt; P[j + 2] += Vv[j + 2] * dt; if (P[j + 1] < floor) { P[j + 1] = floor; Vv[j] = Vv[j + 1] = Vv[j + 2] = 0; life[i] = Math.min(life[i], 0.35); } if (life[i] <= 0) P[j + 1] = -99; } geo.attributes.position.needsUpdate = true; };
    pts.clear = () => { life.fill(0); P.fill(-99); geo.attributes.position.needsUpdate = true; };
    return pts;
  };

  /* =============================== 1. MAIZE SHELLER =============================== */
  function sheller() {
    const T3 = T(), g = new T3.Group(), red = paint(0xc42c1c), teal = paint(0x1d7a77), zn = zinc(), dk = satin(), steel = polished();
    const AX = 0.84, X0 = -0.46, X1 = 0.38, RR = 0.2, XC = (X0 + X1) / 2, LEN = X1 - X0;
    /* stand */
    const fr = new T3.Group(), t = 0.036;
    [[-0.4, 0.24, 0.13], [-0.4, -0.24, 0.13], [0.34, 0.24, 0], [0.34, -0.24, 0]].forEach(([x, z, y0]) => fr.add(box(t, 0.64 - y0, t, teal, x, (0.64 + y0) / 2, z)));
    [0.24, -0.24].forEach((z) => { fr.add(box(0.78, t, t, teal, -0.03, 0.63, z)); fr.add(box(0.78, t, t, teal, -0.03, 0.22, z)); fr.add(bar([-0.4, 0.22, z], [0.34, 0.6, z], 0.022, teal)); });
    [-0.4, 0.34].forEach((x) => { fr.add(box(t, t, 0.5, teal, x, 0.63, 0)); fr.add(box(t, t, 0.5, teal, x, 0.22, 0)); });
    fr.add(box(0.4, 0.016, 0.3, teal, 0.13, 0.245, -0.07));
    [0.31, -0.31].forEach((z) => { fr.add(bar([0.34, 0.6, z * 0.8], [0.66, 0.66, z], 0.015, teal, true)); fr.add(rot(cyl(0.02, 0.02, 0.12, dk, 0.63, 0.655, z, 10), 0, 0, PI / 2 + 0.18)); });
    part(g, fr, "Frame (steel stand)", [0, -0.3, 0]);
    const wh = new T3.Group(); [0.31, -0.31].forEach((z) => { const w = AK.wheel(0.11, 0.055, 0xf0c020); w.position.set(-0.46, 0.11, z); wh.add(w); }); wh.add(rot(cyl(0.012, 0.012, 0.64, dk, -0.46, 0.11, 0, 8), PI / 2, 0, 0)); [0.24, -0.24].forEach((z) => wh.add(bar([-0.4, 0.2, z], [-0.46, 0.11, z], 0.016, teal)));
    part(g, wh, "Transport wheels", [-0.25, -0.1, 0]);
    /* drum casing: lower half, top cover, end plates */
    const shell = (a0, len, x0, x1) => { const gg = new T3.CylinderGeometry(RR, RR, x1 - x0, 32, 1, true, a0, len); gg.rotateZ(PI / 2); return M(gg, dbl(red), (x0 + x1) / 2, AX, 0); };
    const cas = new T3.Group(); cas.add(shell(PI, PI, X0, X1));
    [X0, X1].forEach((x, i) => { const p = M(new T3.CircleGeometry(RR + 0.012, 32), dbl(red), x, AX, 0); p.rotation.y = PI / 2; cas.add(p); const fl = rot(M(new T3.TorusGeometry(RR + 0.006, 0.01, 6, 32), red, x, AX, 0), 0, PI / 2, 0); cas.add(fl); bolts(cas, 10, RR - 0.005, zn, (b, a, r) => { b.position.set(x + (i ? 0.008 : -0.008), AX + Math.sin(a) * r, Math.cos(a) * r); b.rotation.z = PI / 2; }); });
    [0.22, -0.22].forEach((z) => cas.add(box(LEN + 0.04, 0.03, 0.02, red, XC, AX, z)));
    part(g, cas, "Drum casing", [0, 0, 0.45]);
    const top = new T3.Group(); top.add(shell(0, PI, X0, 0.1)); [0.21, -0.21].forEach((z) => top.add(box(0.56, 0.02, 0.025, red, X0 + 0.28, AX + 0.01, z)));
    bolts(top, 6, 0, zn, (b, a) => b.position.set(X0 + 0.05 + (a / TAU) * 0.5, AX + 0.02, 0.215));
    part(g, top, "Top cover (removable)", [0, 0.45, 0]);
    /* feed housing and hopper */
    const fh = new T3.Group(); fh.add(rb(0.28, 0.24, 0.42, 0.04, red, 0.24, AX + 0.12, 0)); fh.add(box(0.2, 0.02, 0.3, dk, 0.24, AX + 0.245, 0));
   
    const hop = trough(0.62, 0.34, 0.16, zn, -1); hop.add(box(0.012, 0.012, 0.34, zn, 0.62, 0.16, 0)); aim(hop, [0.18, AX + 0.25, 0], [0.75, AX + 0.6, 0]);
    const hopG = new T3.Group(); hopG.add(fh, hop); part(g, hopG, "Feed hopper and inlet (cobs in)", [0.3, 0.35, 0]);
    /* shelling drum (rotor) */
    const rotor = new T3.Group(); rotor.position.set(XC, AX, 0);
    rotor.add(rot(cyl(0.1, 0.1, LEN - 0.05, dk, 0, 0, 0, 20), 0, 0, PI / 2)); rotor.add(rot(cyl(0.02, 0.02, LEN + 0.3, steel, 0.08, 0, 0, 10), 0, 0, PI / 2));
    const pegs = []; for (let i = 0; i < 64; i++) { const a = i * 0.785 + Math.floor(i / 8) * 0.39, x = -LEN / 2 + 0.05 + (i / 64) * (LEN - 0.12), p = new T3.CylinderGeometry(0.011, 0.014, 0.07, 6); p.translate(0, 0.13, 0); p.rotateX(a); p.translate(x, 0, 0); pegs.push(p); }
    for (let i = 0; i < 4; i++) { const b = new T3.BoxGeometry(0.1, 0.08, 0.012); b.translate(0, 0.13, 0); b.rotateX((i * PI) / 2); b.translate(-LEN / 2 + 0.07, 0, 0); pegs.push(b); }
    rotor.add(M(mergeGeos(pegs), steel));
    part(g, rotor, "Spiked shelling drum", [0, 0.5, 0.55]);
    const cc = new T3.CylinderGeometry(RR - 0.025, RR - 0.025, LEN - 0.04, 28, 1, true, PI + 0.15, PI - 0.3); cc.rotateZ(PI / 2);
    part(g, M(cc, perfMat([10, 3]), XC, AX, 0), "Concave sieve (grain falls through)", [0, -0.25, 0.55]);
    /* bearings, pulleys, belt, motor */
    const brg = new T3.Group(); [X0 - 0.05, X1 + 0.05].forEach((x) => { brg.add(box(0.06, 0.07, 0.12, dk, x, AX - 0.02, 0)); brg.add(rot(cyl(0.035, 0.035, 0.065, dk, x, AX, 0, 14), 0, 0, PI / 2)); brg.add(bar([x, 0.63, 0], [x, AX - 0.05, 0], 0.03, teal)); });
    fr.add(brg);
    const PX = 0.53, MB = [0.31, -0.12], A = [AX, 0], rA = 0.15, rB = 0.045;
    const pul = new T3.Group(); pul.add(rot(cyl(rA, rA, 0.04, dk, PX, AX, 0, 30), 0, 0, PI / 2)); pul.add(rot(cyl(rA * 0.35, rA * 0.35, 0.05, steel, PX, AX, 0, 14), 0, 0, PI / 2)); for (let i = 0; i < 4; i++) pul.add(rot(box(0.006, rA * 1.6, 0.03, steel, PX + 0.022, AX, 0), (i * PI) / 4, 0, 0));
    pul.add(rot(cyl(rB, rB, 0.045, dk, PX, MB[0], MB[1], 16), 0, 0, PI / 2));
    const hull = hull2([[A[1], A[0], rA + 0.004], [MB[1], MB[0], rB + 0.004]]), beltPts = hull.filter((_, i) => i % 2 === 0).map(([u, v]) => V(PX, v, u));
    pul.add(M(new T3.TubeGeometry(new T3.CatmullRomCurve3(beltPts, true, "catmullrom", 0.2), 90, 0.009, 6, true), AK.std(0x111111, { roughness: 0.85 })));
    part(g, pul, "V-belt and pulleys", [0.35, 0, 0]);
    const guardS = new T3.Shape(), gh = hull2([[A[1], A[0], rA + 0.035], [MB[1], MB[0], rB + 0.035]]); gh.forEach(([u, v], i) => (i ? guardS.lineTo(-u, v) : guardS.moveTo(-u, v)));
    const gg = new T3.ExtrudeGeometry(guardS, { depth: 0.07, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 }); gg.rotateY(PI / 2);
    part(g, M(gg, red, PX - 0.035, 0, 0), "Belt guard", [0.5, 0.1, 0]);
    const mot = new T3.Group(), mc = paint(0x2a2f36); const body = finned(0.085, 0.24, mc); body.position.set(0.17, MB[0], MB[1]); mot.add(body); mot.add(box(0.07, 0.05, 0.08, mc, 0.17, MB[0] + 0.1, MB[1])); mot.add(rot(cyl(0.012, 0.012, 0.22, steel, 0.4, MB[0], MB[1], 8), 0, 0, PI / 2)); mot.add(box(0.2, 0.02, 0.17, mc, 0.17, MB[0] - 0.085, MB[1]));
    part(g, mot, "Electric motor (or petrol engine)", [0.1, -0.1, -0.4]);
    const sw = new T3.Group(); sw.add(rb(0.09, 0.12, 0.05, 0.01, AK.std(0xd9dcdf, { roughness: 0.5 }), 0.36, 0.48, 0.27)); sw.add(rot(cyl(0.014, 0.014, 0.02, lampM(0x2bd14a, 0.6), 0.36, 0.5, 0.3, 12), PI / 2, 0, 0)); sw.add(rot(cyl(0.014, 0.014, 0.02, AK.std(0xd02020), 0.36, 0.46, 0.3, 12), PI / 2, 0, 0));
    sw.add(tube([[0.17, MB[0] + 0.12, MB[1]], [0.3, 0.42, 0.05], [0.36, 0.43, 0.25]], 0.007, AK.std(0x111111)));
    mot.add(sw);
    /* cleaning fan, outlets */
    const fan = new T3.Group(); fan.add(rot(cyl(0.11, 0.11, 0.1, red, -0.22, 0.43, -0.2, 24), PI / 2, 0, 0)); const fg = M(new T3.CircleGeometry(0.095, 24), grilleMat(), -0.22, 0.43, -0.252); fg.rotation.y = PI; fan.add(fg); fan.add(box(0.12, 0.09, 0.14, red, -0.22, 0.52, -0.12));
    part(g, fan, "Cleaning fan (blows chaff away)", [0, -0.1, -0.4]);
    const gc = trough(0.42, 0.26, 0.07, zn, -1); aim(gc, [-0.02, 0.62, 0.1], [-0.02, 0.3, 0.48]); gc.rotation.order = "YZX";
    part(g, gc, "Grain outlet chute", [0, -0.1, 0.35]);
    const co = new T3.Group(), cd = trough(0.3, 0.22, 0.13, zn); cd.add(box(0.3, 0.006, 0.22, dbl(zn), 0.15, 0.13, 0)); aim(cd, [X0, AX - 0.06, 0], [X0 - 0.3, AX - 0.2, 0]); co.add(cd);
    part(g, co, "Cob outlet", [-0.4, 0, 0]);
    /* ---- working: cobs in, kernels out of the chute, bare cobs out of the end ---- */
    const cobG = new T3.CylinderGeometry(0.024, 0.02, 0.17, 12), bareG = new T3.CylinderGeometry(0.014, 0.012, 0.16, 8); cobG.rotateZ(PI / 2); bareG.rotateZ(PI / 2);
    const cobM = AK.std(0xffffff, { map: kernelTex([1, 1], "cob"), roughness: 0.55 }), bareM = AK.std(0xffffff, { map: cobTex(), roughness: 0.7 });
    const feed = []; for (let i = 0; i < 6; i++) { const c = M(cobG, cobM); c.visible = false; g.add(c); feed.push(c); }
    const fly = []; for (let i = 0; i < 5; i++) { const c = M(bareG, bareM); c.visible = false; c.userData.v = V(); g.add(c); fly.push(c); }
    const pile = new T3.InstancedMesh(bareG, bareM, 90); pile.count = 0; pile.castShadow = true; pile.frustumCulled = false; g.add(pile);
    const grains = pool(500, 0xf2b52a, 0.014); g.add(grains);
    const chaff = pool(120, 0xd8c8a0, 0.02, 0.55); g.add(chaff);
    const heap = M(new T3.ConeGeometry(0.24, 0.12, 28, 1), AK.std(0xffffff, { map: kernelTex([3, 1], "heap"), roughness: 0.8 }), -0.02, 0.06, 0.62); heap.scale.setScalar(0.05); g.add(heap);
    const hopA = V(0.7, AX + 0.62, 0), hopB = V(0.24, AX + 0.3, 0), chuteEnd = V(-0.02, 0.3, 0.48), coutA = V(X0 - 0.28, AX - 0.2, 0), m4 = new T3.Matrix4(), q = new T3.Quaternion();
    const st = { kg: 0, cobs: 0, t: 0, phase: 0 };
    g.st = st;
    g.tick = (dt, o) => {
      const run = !!o.run, rpm = o.rpm || 600, cut = !!o.cut; top.visible = !cut;
      g.getObjectByName("Belt guard").visible = !cut;
      if (!run) { grains.step(dt); chaff.step(dt, 0.2, -1); return; }
      st.t += dt; const w = (rpm / 60) * TAU; rotor.rotation.x += w * dt;
      const rate = rpm / 600;  /* cobs per second fed */
      st.phase += dt * 0.55 * rate;
      feed.forEach((c, i) => { const f = (st.phase + i / feed.length) % 1; c.visible = f < 0.9; c.position.lerpVectors(hopA, hopB, Math.min(1, f / 0.8)); if (f > 0.8) c.position.y -= (f - 0.8) * 1.2; c.rotation.set(0, 0, 0.55); c.position.z = ((i % 3) - 1) * 0.07; });
      const prev = st.cobs; st.cobs += dt * 0.55 * rate * 1.2; if (Math.floor(st.cobs) > Math.floor(prev)) { const c = fly.find((f) => !f.visible) || fly[0]; c.visible = true; c.position.copy(coutA); c.userData.v.set(-0.9 - Math.random() * 0.3, 0.3, (Math.random() - 0.5) * 0.4); c.rotation.set(Math.random(), Math.random() * 3, 0); }
      fly.forEach((c) => { if (!c.visible) return; c.userData.v.y -= 9.8 * dt; c.position.addScaledVector(c.userData.v, dt); c.rotation.x += dt * 6; if (c.position.y < 0.02 + Math.min(0.12, pile.count * 0.0015)) { c.visible = false; if (pile.count < 90) { const n = pile.count, a = n * 2.4, r = 0.04 + Math.sqrt(n) * 0.022; q.setFromEuler(new T3.Euler(0, Math.random() * PI, (n % 2) * 0.3)); m4.compose(V(c.position.x + Math.cos(a) * r * 0.4, 0.015 + Math.max(0, 0.1 - r * 0.5), c.position.z + Math.sin(a) * r), q, V(1, 1, 1)); pile.setMatrixAt(n, m4); pile.count = n + 1; pile.instanceMatrix.needsUpdate = true; } } });
      const n = Math.round(90 * rate * dt * 4); for (let i = 0; i < n; i++) grains.emit(chuteEnd.x + (Math.random() - 0.5) * 0.18, chuteEnd.y, chuteEnd.z + Math.random() * 0.03, (Math.random() - 0.5) * 0.15, -0.2, 0.55 + Math.random() * 0.3, 2);
      if (Math.random() < 0.6) chaff.emit(-0.22, 0.43, -0.26, (Math.random() - 0.5) * 0.3, 0.1, -0.7 - Math.random() * 0.4, 2.5);
      grains.step(dt, -9.8, 0.02 + heap.scale.y * 0.08); chaff.step(dt, -0.4, 0.01, 0.6);
      st.kg += (1.6 * rpm / 3600) * dt * 30;   /* sped up 30x */
      heap.scale.setScalar(clamp(0.05 + st.kg / 260, 0.05, 1.4));
    };
    g.reset = () => { st.kg = st.cobs = st.t = 0; pile.count = 0; heap.scale.setScalar(0.05); grains.clear(); chaff.clear(); fly.forEach((c) => (c.visible = false)); };
    g.info = (o) => { const rpm = o.rpm || 600, Q = 1.6 * rpm, v = (PI * 0.26 * rpm) / 60, left = rpm < 450 ? (450 - rpm) * 0.03 : 0, broken = rpm > 700 ? (rpm - 700) * 0.025 : 0;
      return { ro: [["Drum speed", rpm + " rev/min"], ["Peg tip speed v = πdN/60", v.toFixed(1) + " m/s"], ["Output", Math.round(Q) + " kg/h"], ["Grain left on cobs", left.toFixed(1) + " %"], ["Broken grain", broken.toFixed(1) + " %"], ["Shelled so far", Math.round(st.kg) + " kg"]],
        how: "Dry cobs slide down the hopper into the casing. Pegs on the spinning drum rub and knock the grains off; grains fall through the concave sieve to the chute, the fan blows chaff away and bare cobs leave at the far end.",
        warn: rpm < 450 ? "Too slow: grains stay on the cobs. Raise the speed." : rpm > 700 ? "Too fast: grains crack, which spoils seed and invites storage pests." : "Good speed: clean shelling with little cracked grain." }; };
    BK.shadow(g); return g;
  }

  /* =============================== 2. CROP DRYER (mobile tower) =============================== */
  function dryer() {
    const T3 = T(), g = new T3.Group(), red = paint(0xb3261c), orange = paint(0xe0561c), zn = zinc(), dk = satin(), steel = polished();
    const H0 = 1.31, HC = 2.5, RO = 0.86, RI = 0.34;
    /* trailer */
    const ch = new T3.Group();
    [0.5, -0.5].forEach((z) => ch.add(box(2.7, 0.14, 0.1, red, 0, 0.5, z)));
    [-1.25, -0.4, 0.4, 1.25].forEach((x) => ch.add(box(0.1, 0.12, 1.0, red, x, 0.5, 0)));
    ch.add(rot(cyl(0.04, 0.04, 2.0, dk, -0.25, 0.38, 0, 10), PI / 2, 0, 0));
    [0.98, -0.98].forEach((z) => { const w = AK.wheel(0.38, 0.24); w.position.set(-0.25, 0.38, z); ch.add(w); const mg = new T3.TorusGeometry(0.46, 0.012, 4, 20, PI); const mm = M(mg, red, -0.25, 0.38, z); mm.scale.z = 9; ch.add(mm); });
    ch.add(bar([1.35, 0.5, 0.45], [2.35, 0.46, 0], 0.07, red)); ch.add(bar([1.35, 0.5, -0.45], [2.35, 0.46, 0], 0.07, red)); ch.add(rot(M(new T3.TorusGeometry(0.06, 0.018, 6, 16), dk, 2.42, 0.46, 0), PI / 2, 0, 0));
    ch.add(cyl(0.035, 0.035, 0.45, dk, 2.0, 0.27, 0, 10)); ch.add(box(0.14, 0.02, 0.14, dk, 2.0, 0.04, 0));
    [[1.25, 0.5], [1.25, -0.5], [-1.25, 0.5], [-1.25, -0.5]].forEach(([x, z]) => { ch.add(cyl(0.03, 0.03, 0.42, dk, x, 0.24, z * 1.18, 8)); ch.add(box(0.12, 0.02, 0.12, dk, x, 0.03, z * 1.18)); });
    part(g, ch, "Trailer chassis and axle", [0, -0.4, 0]);
    /* conical base */
    const coneHalf = (a0) => M(new T3.CylinderGeometry(RO, 0.14, H0 - 0.7, 36, 1, true, a0, PI), dbl(zn), 0, (H0 + 0.7) / 2, 0);
    const base = new T3.Group(); base.add(coneHalf(PI / 2)); const coneF = coneHalf(-PI / 2); base.add(coneF);
    base.add(rot(M(new T3.TorusGeometry(RO, 0.03, 6, 40), red, 0, H0, 0), PI / 2, 0, 0));
    for (let i = 0; i < 4; i++) { const a = PI / 4 + (i * PI) / 2; base.add(bar([Math.cos(a) * 0.62, 0.57, Math.sin(a) * 0.45], [Math.cos(a) * RO, H0, Math.sin(a) * RO], 0.035, red)); }
    part(g, base, "Conical base hopper", [0, -0.2, 0.9]);
    /* drying column: perforated outer screen in two halves, ribs and bands */
    const half = (r, a0, mat) => M(new T3.CylinderGeometry(r, r, HC, 44, 1, true, a0, PI), mat, 0, H0 + HC / 2, 0);
    const back = new T3.Group(), front = new T3.Group();
    back.add(half(RO, PI / 2, perfMat([12, 7]))); front.add(half(RO, -PI / 2, perfMat([12, 7])));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + 0.13, r = box(0.045, HC, 0.03, red, Math.sin(a) * (RO + 0.012), H0 + HC / 2, Math.cos(a) * (RO + 0.012)); r.rotation.y = a; (Math.cos(a) > 0 ? front : back).add(r); }
    [0, 0.83, 1.66, 2.5].forEach((y) => { const tg = new T3.TorusGeometry(RO + 0.018, 0.022, 6, 28, PI); tg.rotateX(PI / 2); front.add(M(tg, red, 0, H0 + y, 0)); const tb = tg.clone(); tb.rotateY(PI); back.add(M(tb, red, 0, H0 + y, 0)); });
    part(g, back, "Drying column (perforated screens)", [0, 0, -0.6]);
    part(g, front, "Front screen panels", [0, 0, 1.2]);
    /* inner plenum and grain (seen in the cutaway) */
    const inner = new T3.Group(); inner.add(half(RI, PI / 2, perfMat([5, 7]))); const glow = M(new T3.CylinderGeometry(RI - 0.02, RI - 0.02, HC, 24, 1, true, PI / 2, PI), new T3.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0.32, side: T3.DoubleSide, depthWrite: false }), 0, H0 + HC / 2, 0); inner.add(glow);
    part(g, inner, "Hot-air plenum (inner screen)", [0, 0.25, 0]);
    const gtex = kernelTex([2, 6], "dry"), gmat = AK.std(0xffffff, { map: gtex, roughness: 0.85, side: T3.DoubleSide });
    const grain = new T3.Group(); grain.visible = false; g.add(grain);
    const faces = [-1, 1].map((s) => { const p = M(new T3.PlaneGeometry(RO - RI - 0.01, 1), gmat, s * (RI + RO) / 2, 0, 0.001); grain.add(p); return p; });
    const topRing = M(new T3.RingGeometry(RI, RO - 0.01, 36, 1, 0, PI), gmat); topRing.rotation.x = -PI / 2; grain.add(topRing);
    const csh = new T3.Shape(); csh.moveTo(-RO + 0.02, H0); csh.lineTo(RO - 0.02, H0); csh.lineTo(0.13, 0.71); csh.lineTo(-0.13, 0.71); csh.closePath(); grain.add(M(new T3.ShapeGeometry(csh), AK.std(0xffffff, { map: kernelTex([2, 1], "cone"), roughness: 0.85, side: T3.DoubleSide }), 0, 0, 0.001));
    /* roof */
    const roof = new T3.Group(); roof.add(M(new T3.ConeGeometry(1.0, 0.36, 36, 1), red, 0, H0 + HC + 0.3, 0)); for (let i = 0; i < 4; i++) { const a = PI / 4 + (i * PI) / 2; roof.add(cyl(0.015, 0.015, 0.16, dk, Math.cos(a) * 0.82, H0 + HC + 0.07, Math.sin(a) * 0.82, 6)); } roof.add(cyl(0.1, 0.1, 0.12, red, 0, H0 + HC + 0.52, 0, 16));
    part(g, roof, "Rain cap", [0, 0.6, 0]);
    /* bucket elevator */
    const EX = -1.14, EY0 = 0.42, EY1 = 4.48, EH = EY1 - EY0, ew = 0.24;
    const elev = new T3.Group(); elev.add(box(ew, EH, 0.012, orange, EX, EY0 + EH / 2, -ew / 2)); elev.add(box(0.012, EH, ew, orange, EX - ew / 2, EY0 + EH / 2, 0)); elev.add(box(0.012, EH, ew, orange, EX + ew / 2, EY0 + EH / 2, 0));
    elev.add(rb(0.4, 0.34, 0.34, 0.06, orange, EX, EY1 + 0.12, 0)); elev.add(rb(0.38, 0.36, 0.36, 0.04, orange, EX, EY0 + 0.1, 0));
    elev.add(tube([[EX + 0.12, EY1 + 0.16, 0], [-0.55, EY1 + 0.02, 0], [-0.12, H0 + HC + 0.46, 0]], 0.075, orange));
    for (let y = EY0 + 0.6; y < EY1 - 0.2; y += 0.8) elev.add(box(ew + 0.03, 0.03, ew + 0.03, orange, EX, y, 0));
    elev.add(bar([EX + 0.12, 3.2, 0], [-RO - 0.01, 3.2, 0], 0.04, dk)); elev.add(bar([EX + 0.12, 1.9, 0], [-RO - 0.01, 1.9, 0], 0.04, dk));
    part(g, elev, "Bucket elevator (lifts grain)", [-0.6, 0, 0]);
    const ef = box(ew, EH - 0.5, 0.012, orange, EX, EY0 + EH / 2 + 0.05, ew / 2); part(g, ef, "Elevator cover", [-0.4, 0, 0.7]);
    const buckets = new T3.InstancedMesh(new T3.BoxGeometry(0.1, 0.05, 0.12), zn, 40); g.add(buckets); buckets.visible = false; buckets.frustumCulled = false;
    const ih = new T3.Group(); const ihc = M(new T3.CylinderGeometry(0.34, 0.1, 0.32, 4, 1, true), dbl(zn), EX + 0.05, 0.86, 0.42); ihc.rotation.y = PI / 4; ih.add(ihc); ih.add(bar([EX + 0.05, 0.7, 0.42], [EX, 0.5, 0.15], 0.06, zn));
    ih.add(bar([0, 0.72, 0], [EX + 0.15, 0.48, 0], 0.07, zn, true));
    part(g, ih, "Intake hopper and return auger", [0.1, -0.2, 0.6]);
    /* fan and burner */
    const FX = 1.08, FY = 1.0;
    const fan = new T3.Group(); fan.add(rot(M(new T3.CylinderGeometry(0.44, 0.44, 0.34, 32, 1, true), dbl(orange), FX, FY, 0), PI / 2, 0, 0)); fan.add(M(new T3.CircleGeometry(0.44, 32), dbl(orange), FX, FY, -0.17)); const gr = M(new T3.CircleGeometry(0.4, 32), grilleMat(), FX, FY, 0.175); fan.add(gr); fan.add(rot(M(new T3.TorusGeometry(0.405, 0.02, 6, 32), orange, FX, FY, 0.175), 0, 0, 0));
    fan.add(rot(cyl(0.16, 0.16, 0.26, dk, FX, FY, -0.3, 18), PI / 2, 0, 0)); fan.add(box(0.5, 0.32, 0.3, orange, 0.62, FY + 0.2, 0));
    part(g, fan, "Centrifugal fan", [0.6, 0, 0.3]);
    const blades = new T3.Group(); blades.position.set(FX, FY, 0.05); for (let i = 0; i < 8; i++) { const b = box(0.36, 0.05, 0.012, dk, 0, 0, 0); b.geometry.translate(0.18, 0, 0); b.rotation.z = (i / 8) * TAU; b.rotation.x = 0.4; blades.add(b); } g.add(blades);
    const bur = new T3.Group(); bur.add(rot(cyl(0.2, 0.2, 0.42, AK.std(0x3a3d42, { metalness: 0.5, roughness: 0.4 }), FX + 0.48, 0.95, 0, 22), 0, 0, PI / 2)); const flame = rot(M(new T3.CircleGeometry(0.06, 16), new T3.MeshBasicMaterial({ color: 0xff8a20 }), FX + 0.48, 0.95, 0.205), 0, 0, 0); bur.add(flame); bur.add(rb(0.3, 0.2, 0.28, 0.03, AK.std(0xc8ccd0, { metalness: 0.4, roughness: 0.4 }), 1.0, 0.68, 0.42));
    part(g, bur, "Burner (diesel or gas) and fuel tank", [0.6, -0.2, 0]);
    const cp = new T3.Group(); cp.add(cyl(0.03, 0.03, 1.0, dk, 0.92, 1.07, 0.6, 8)); cp.add(rb(0.34, 0.4, 0.12, 0.02, AK.std(0xdfe2e5, { roughness: 0.45 }), 0.92, 1.7, 0.6));
    const disp = panel(0.26, 0.17, 256, 168, (x, w, h, m, t, on) => { x.fillStyle = "#0b1a14"; x.fillRect(0, 0, w, h); x.fillStyle = "#7fe0b0"; x.font = "bold 22px sans-serif"; x.fillText("MOISTURE", 12, 30); x.fillText("AIR TEMP", 12, 102); seg(x, m + "%", 12, 78, 46, "#ff4a2e"); seg(x, t + "°C", 12, 150, 40, "#ffb02e"); x.fillStyle = on ? "#3be070" : "#555"; x.beginPath(); x.arc(230, 24, 10, 0, TAU); x.fill(); });
    disp.position.set(0.92, 1.72, 0.665); cp.add(disp);
    part(g, cp, "Control panel (moisture and temperature)", [0.4, 0, 0.5]);
    const lad = new T3.Group(); [0.17, -0.17].forEach((z) => lad.add(box(0.03, HC + 0.3, 0.03, dk, RO + 0.13, H0 + HC / 2 + 0.1, z))); for (let y = H0 + 0.15; y < H0 + HC + 0.2; y += 0.28) lad.add(rot(cyl(0.012, 0.012, 0.34, dk, RO + 0.13, y, 0, 6), PI / 2, 0, 0));
    part(g, lad, "Ladder", [0.4, 0, 0]);
    /* working effects */
    const vap = pool(260, 0xffffff, 0.16, 0.28); g.add(vap);
    const arrows = new T3.Group(); arrows.visible = false; g.add(arrows); const aM = new T3.MeshBasicMaterial({ color: 0xff6a1a });
    const arrow = () => { const a = new T3.Group(); a.add(rot(cyl(0.012, 0.012, 0.14, aM, 0, 0, 0, 6), 0, 0, PI / 2)); a.add(rot(M(new T3.ConeGeometry(0.035, 0.07, 8), aM, 0.1, 0, 0), 0, 0, -PI / 2)); return a; };
    const AR = []; for (let s of [-1, 1]) for (let k = 0; k < 6; k++) { const a = arrow(); a.userData = { s, y: H0 + 0.2 + k * 0.4, f: k * 0.17 }; if (s < 0) a.rotation.y = PI; arrows.add(a); AR.push(a); }
    const st = { M: null, t: 0, run: 0, kg0: 3000, done: false };
    g.st = st;
    const m4 = new T3.Matrix4();
    g.tick = (dt, o) => {
      const cut = !!o.cut, Mi = o.mi || 24, Tair = o.tmp || 55; if (st.M == null || st.mi !== Mi) { st.M = Mi; st.mi = Mi; st.t = 0; st.done = false; }
      front.visible = !cut; coneF.visible = !cut; ef.visible = !cut; grain.visible = cut; buckets.visible = cut; arrows.visible = cut && !!o.run && !st.done;
      const fill = 0.92, gh = HC * fill; faces.forEach((p) => { p.scale.y = gh; p.position.y = H0 + gh / 2; }); topRing.position.y = H0 + gh + 0.002;
      const run = !!o.run && !st.done;
      flame.material.color.setHex(run ? 0xff8a20 : 0x333333); flame.scale.setScalar(run ? 0.9 + Math.random() * 0.3 : 1);
      if (run) {
        st.t += dt * (4 / 60);  /* 1 real second = 4 minutes */
        const Me = 8, k = 0.012 * Math.max(0, Tair - 25); st.M = Me + (st.M - Me) * Math.exp(-k * dt * (4 / 60)); if (st.M <= 13) { st.M = 13; st.done = true; }
        blades.rotation.z -= dt * 18; gtex.offset.y += dt * 0.25;
        const nv = Math.round(dt * 60 * clamp((st.M - 12) / 8, 0.1, 1.5) * (Tair / 55)); for (let i = 0; i < nv; i++) { const a = Math.random() * TAU, y = H0 + Math.random() * gh; vap.emit(Math.sin(a) * RO, y, Math.cos(a) * RO, Math.sin(a) * 0.25, 0.25, Math.cos(a) * 0.25, 2.2); }
        AR.forEach((a) => { a.userData.f = (a.userData.f + dt * 0.7) % 1; a.position.set(a.userData.s * (RI + 0.04 + a.userData.f * (RO - RI - 0.1)), a.userData.y, 0.05); });
      }
      vap.step(dt, 0.35, -10, 0.4);
      if (cut) { let i = 0; const ph = run ? (st.t * 60 * 0.6) % 1 : 0; for (let k = 0; k < 20; k++) { const f = (k / 20 + ph) % 1; m4.makeTranslation(EX - 0.05, EY0 + 0.2 + f * (EH - 0.3), 0); buckets.setMatrixAt(i++, m4); m4.makeTranslation(EX + 0.06, EY1 - 0.1 - f * (EH - 0.3), 0); buckets.setMatrixAt(i++, m4); } buckets.instanceMatrix.needsUpdate = true; }
      disp.set(st.M.toFixed(1), Math.round(Tair), run);
    };
    g.reset = () => { st.M = null; vap.clear(); };
    g.info = (o) => { const Mi = o.mi || 24, Tair = o.tmp || 55, use = o.use || "food", lim = { seed: 43, food: 60, feed: 80 }[use], Mnow = st.M == null ? Mi : st.M, W = st.kg0, water = (W * (Mi - Mnow)) / (100 - Mnow), h = Math.floor(st.t), mi = Math.round((st.t - h) * 60);
      return { ro: [["Batch", W.toLocaleString() + " kg"], ["Moisture now", Mnow.toFixed(1) + " %"], ["Safe to store", "13 %"], ["Air temperature", Math.round(Tair) + " °C"], ["Drying time", h + " h " + mi + " min"], ["Water removed  W(Mᵢ−M)/(100−M)", Math.round(water) + " kg"]],
        how: "Wet grain is tipped into the intake and lifted by the bucket elevator to the top of the column. It trickles down between two perforated screens while the burner and fan blow hot air out from the centre, carrying moisture away. Grain keeps circulating until the panel reads safe moisture.",
        warn: Tair > lim ? "Too hot for " + use + " grain: above " + lim + " °C " + (use === "seed" ? "kills the embryo, so seeds will not germinate." : "cracks kernels and spoils quality.") : st.done ? "Dry: grain is at 13 % — safe to cool and store." : "Air temperature is safe for " + use + " grain (limit " + lim + " °C)." }; };
    BK.shadow(g); vap.castShadow = false; return g;
  }

  /* =============================== 3. INCUBATOR (cabinet setter and hatcher) =============================== */
  function incubator() {
    const T3 = T(), g = new T3.Group(), wht = paint(0xf0f1ee), trim = paint(0x3a86bf), inn = AK.std(0xf6f6f3, { roughness: 0.7, side: T3.DoubleSide }), dk = satin(), alu = zinc();
    const W = 1.1, Hc = 1.25, D = 0.72, y0 = 0.1, DX = 0.17;
    const cab = new T3.Group();
    cab.add(box(W, Hc, 0.04, wht, 0, y0 + Hc / 2, -D / 2 + 0.02)); [1, -1].forEach((s) => cab.add(box(0.04, Hc, D, wht, s * (W / 2 - 0.02), y0 + Hc / 2, 0))); cab.add(box(W, 0.05, D, wht, 0, y0 + Hc - 0.025, 0)); cab.add(box(W, 0.04, D, wht, 0, y0 + 0.02, 0));
    cab.add(box(W - 0.08, 0.004, D - 0.06, inn, 0, y0 + 0.042, 0)); cab.add(box(0.03, Hc - 0.09, D - 0.06, inn, DX, y0 + Hc / 2, 0));
    cab.add(box(W - 0.06, 0.1, D - 0.08, AK.std(0x55595e, { roughness: 0.6 }), 0, 0.05, 0)); [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => cab.add(cyl(0.025, 0.03, 0.03, dk, a * (W / 2 - 0.08), 0.015, b * (D / 2 - 0.08), 10)));
    for (let i = 0; i < 3; i++) cab.add(rot(cyl(0.025, 0.025, 0.006, dk, -0.3 + i * 0.3, y0 + Hc + 0.1, -0.15, 14), 0, 0, 0));
    part(g, cab, "Insulated cabinet", [0, 0, -0.5]);
    const top = new T3.Group(); top.add(box(W + 0.02, 0.09, D + 0.02, trim, 0, y0 + Hc + 0.045, 0)); top.add(box(0.5, 0.07, 0.012, AK.std(0x1a1d22, { roughness: 0.4 }), -0.18, y0 + Hc + 0.045, D / 2 + 0.012));
    const led = panel(0.3, 0.055, 300, 56, (x, w, h, tt, rh, turn) => { x.fillStyle = "#06080a"; x.fillRect(0, 0, w, h); seg(x, tt, 6, 46, 44, "#ff3a26"); seg(x, rh, 150, 46, 44, "#ff3a26"); x.fillStyle = "#9aa"; x.font = "12px sans-serif"; x.fillText("°C", 120, 20); x.fillText("%RH", 214, 20); x.fillStyle = turn ? "#3be070" : "#444"; x.beginPath(); x.arc(280, 28, 8, 0, TAU); x.fill(); });
    led.position.set(-0.22, y0 + Hc + 0.045, D / 2 + 0.02); top.add(led);
    [[0.12, 0xd02020], [0.17, 0xd02020], [0.22, 0x2bd14a], [0.27, 0xf2c21a]].forEach(([x, c]) => top.add(rot(cyl(0.012, 0.012, 0.012, AK.std(c, { roughness: 0.3 }), x, y0 + Hc + 0.045, D / 2 + 0.018, 12), PI / 2, 0, 0)));
    part(g, top, "Controller (thermostat and humidistat)", [0, 0.45, 0.2]);
    /* doors */
    const door = (w, hinge) => { const p = new T3.Group(); p.position.set(hinge * W / 2, 0, D / 2); const d = new T3.Group(); d.position.x = -hinge * w / 2; d.add(box(w, Hc - 0.02, 0.045, wht, 0, y0 + Hc / 2, 0.025)); const ring = M(new T3.TorusGeometry(0.085, 0.012, 8, 28), alu, 0, y0 + Hc * 0.6, 0.05); d.add(ring); d.add(M(new T3.CircleGeometry(0.085, 28), glassM(), 0, y0 + Hc * 0.6, 0.049)); d.add(box(0.025, 0.2, 0.03, alu, -hinge * (w / 2 - 0.06), y0 + Hc * 0.48, 0.065)); p.add(d); return p; };
    const dl = door(W / 2 + DX - 0.005, -1), dr = door(W / 2 - DX - 0.005, 1);
    part(g, dl, "Left door with viewing window", [0, 0, 0.5]); part(g, dr, "Right door", [0, 0, 0.5]);
    /* setter racks with tilting trays */
    const SX = (-W / 2 + DX) / 2 + 0.005, egg = new T3.SphereGeometry(0.021, 12, 9); egg.scale(1, 1.3, 1); egg.translate(0, 0.024, 0);
    const eggM = AK.phys(0xffffff, { roughness: 0.55 }), trays = [], tCols = [0xead6b8, 0xd9a874, 0xf2ece0, 0xc98e5a];
    const rack = new T3.Group();
    [SX - 0.33, SX + 0.33].forEach((x) => rack.add(box(0.02, Hc - 0.15, 0.04, alu, x, y0 + Hc / 2, 0)));
    for (let k = 0; k < 6; k++) { const y = y0 + 0.2 + k * 0.155, tp = new T3.Group(); tp.position.set(SX, y, 0); const fr = new T3.Group(); fr.add(box(0.6, 0.012, 0.52, AK.std(0xe9ecee, { roughness: 0.5 }), 0, 0, 0)); for (let i = -3; i <= 3; i++) fr.add(box(0.6, 0.03, 0.006, AK.std(0xe9ecee, { roughness: 0.5 }), 0, 0.015, i * 0.075)); tp.add(fr);
      const im = new T3.InstancedMesh(egg, eggM, 42), m4 = new T3.Matrix4(), cc = new T3.Color(); let n = 0; for (let i = 0; i < 7; i++) for (let j = 0; j < 6; j++) { m4.makeTranslation(-0.255 + i * 0.085, 0.006, -0.19 + j * 0.075); im.setMatrixAt(n, m4); im.setColorAt(n, cc.setHex(tCols[(i * 7 + j * 3 + k) % 4])); n++; } tp.add(im); tp.userData.eggs = im; tp.add(rot(cyl(0.008, 0.008, 0.68, alu, 0, 0, 0, 6), 0, 0, PI / 2)); rack.add(tp); trays.push(tp); }
    const link = box(0.015, 0.8, 0.015, alu, SX + 0.31, y0 + 0.6, 0.2); rack.add(link); rack.add(rb(0.08, 0.1, 0.08, 0.01, dk, SX + 0.31, y0 + Hc - 0.2, 0.2));
    part(g, rack, "Egg trays (turned automatically)", [0, 0, 0.75]);
    /* fan, heater, sensor */
    const fan = new T3.Group(); fan.position.set(SX, y0 + 0.66, -D / 2 + 0.09); const blades = new T3.Group(); for (let i = 0; i < 4; i++) { const b = box(0.13, 0.04, 0.006, polished(), 0, 0, 0); b.geometry.translate(0.07, 0, 0); b.rotation.set(0.3, 0, (i * PI) / 2); blades.add(b); } fan.add(blades); fan.add(M(new T3.TorusGeometry(0.16, 0.006, 6, 32), alu)); fan.add(cyl(0.04, 0.04, 0.06, dk, 0, 0, -0.04, 14).rotateX(PI / 2));
    const heatM = new T3.MeshStandardMaterial({ color: 0x5a2a1a, emissive: 0xff3a10, emissiveIntensity: 0.0, roughness: 0.5 }); const coil = M(new T3.TorusGeometry(0.2, 0.007, 6, 40), heatM); fan.add(coil);
    part(g, fan, "Fan and heating element", [0, 0, 0.9]);
    const sen = new T3.Group(); sen.add(cyl(0.006, 0.006, 0.12, alu, SX + 0.2, y0 + Hc - 0.12, -D / 2 + 0.06, 6)); sen.add(sph(0.012, AK.std(0x222222), SX + 0.2, y0 + Hc - 0.18, -D / 2 + 0.06));
    part(g, sen, "Temperature and humidity sensor", [0.2, 0.2, 0.6]);
    /* hatcher side */
    const HX = (W / 2 + DX) / 2, bask = [], hEggs = [];
    const hat = new T3.Group(); for (let k = 0; k < 4; k++) { const y = y0 + 0.36 + k * 0.2, b = new T3.Group(); b.add(box(0.31, 0.05, 0.54, AK.std(0xeceeef, { roughness: 0.5 }), 0, 0, 0)); b.children[0].scale.set(1, 1, 1); const meshB = M(new T3.PlaneGeometry(0.29, 0.52), meshMat(), 0, 0.027, 0); meshB.rotation.x = -PI / 2; b.add(meshB); b.position.set(HX, y, 0); b.children[0].visible = false; [[0, 0.025, 0.27, 0.31, 0.05, 0.006], [0, 0.025, -0.27, 0.31, 0.05, 0.006], [0.155, 0.025, 0, 0.006, 0.05, 0.54], [-0.155, 0.025, 0, 0.006, 0.05, 0.54]].forEach(([x, yy, z, w, h, d]) => b.add(box(w, h, d, alu, x, yy, z))); hat.add(b); bask.push(b);
      const im = new T3.InstancedMesh(egg, eggM, 24), m4 = new T3.Matrix4(), cc = new T3.Color(); let n = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 8; j++) { m4.compose(V(-0.09 + i * 0.09, 0.03, -0.22 + j * 0.063), new T3.Quaternion().setFromEuler(new T3.Euler(PI / 2, 0, 0)), V(1, 1, 1)); im.setMatrixAt(n, m4); im.setColorAt(n, cc.setHex(tCols[(i + j + k) % 4])); n++; } im.count = 0; im.frustumCulled = false; b.add(im); hEggs.push(im); }
    part(g, hat, "Hatcher baskets (last 3 days)", [0.6, 0, 0.5]);
    const pan = new T3.Group(); pan.add(cyl(0.13, 0.12, 0.05, AK.std(0x3d7a5a, { roughness: 0.4 }), HX, y0 + 0.07, 0.04, 24)); pan.add(cyl(0.115, 0.115, 0.004, AK.phys(0x8ac8e8, { roughness: 0.05, transparent: true, opacity: 0.7 }), HX, y0 + 0.09, 0.04, 24)); pan.add(cyl(0.04, 0.04, 0.03, dk, HX, y0 + 0.1, 0.04, 14));
    part(g, pan, "Water pan (humidity)", [0.5, -0.1, 0.5]);
    /* chicks */
    const chicks = new T3.Group(), chM = AK.std(0xf6d24a, { roughness: 0.9 }), bk = AK.std(0xe8901a); for (let i = 0; i < 16; i++) { const c = new T3.Group(); c.add(sph(0.026, chM, 0, 0.024, 0)); c.add(sph(0.017, chM, 0.022, 0.05, 0)); c.add(rot(M(new T3.ConeGeometry(0.005, 0.012, 6), bk, 0.04, 0.05, 0), 0, 0, -PI / 2)); c.add(sph(0.003, AK.std(0x111111), 0.033, 0.056, 0.008)); c.rotation.y = i * 1.7; c.position.set(-0.09 + (i % 3) * 0.09, 0.025, -0.2 + Math.floor(i / 3) * 0.1); c.visible = false; chicks.add(c); } bask[0].add(chicks);
    /* candler with a big egg */
    const cand = new T3.Group(); cand.position.set(W / 2 + 0.42, 0, 0.15); cand.add(box(0.36, 0.7, 0.36, AK.wood ? AK.wood() : dk, 0, 0.35, 0)); cand.add(rb(0.16, 0.12, 0.16, 0.02, AK.std(0x22252a), 0, 0.76, 0)); cand.add(cyl(0.035, 0.035, 0.01, lampM(0xfff0b0, 2), 0, 0.825, 0, 16));
    const bigEgg = M(new T3.SphereGeometry(0.075, 32, 24), new T3.MeshStandardMaterial({ color: 0xffc070, emissive: 0xff9a40, emissiveIntensity: 0.65, transparent: true, opacity: 0.55, roughness: 0.4, depthWrite: false }), 0, 0.92, 0); bigEgg.scale.y = 1.3; cand.add(bigEgg);
    const airM = new T3.MeshBasicMaterial({ color: 0xfff4d0, transparent: true, opacity: 0.6, depthWrite: false }), air = M(new T3.SphereGeometry(0.07, 24, 8, 0, TAU, 0, 0.7), airM, 0, 0.92, 0); air.scale.y = 1.3; cand.add(air);
    const emb = M(new T3.SphereGeometry(0.03, 16, 12), AK.std(0x5a1a10, { roughness: 0.6 }), 0, 0.9, 0.02); cand.add(emb);
    const veins = new T3.Group(); for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; veins.add(tube([[0, 0.9, 0.02], [Math.cos(a) * 0.035, 0.9 + Math.sin(a) * 0.03, 0.05], [Math.cos(a) * 0.065, 0.9 + Math.sin(a) * 0.075, 0.035]], 0.0025, AK.std(0xb01818, { roughness: 0.5 }))); } cand.add(veins);
    cand.visible = false; part(g, cand, "Egg candler (check the embryo)", [0.3, 0, 0]);
    const st = { day: 0, t: 0, temp: 37.8, heat: 0 };
    g.st = st;
    g.tick = (dt, o) => {
      const open = clamp(o.door == null ? 0.35 : o.door, 0, 1); dl.rotation.y = -open * 1.9; dr.rotation.y = open * 1.9;
      const set = o.ts || 37.8, run = !!o.run; st.day = o.day == null ? 0 : o.day; const turnOK = o.turn !== 0 && o.turn !== false;
      st.t += dt;
      if (run) { blades.rotation.z -= dt * 22; if (st.temp < set - 0.1) st.heat = 1; else if (st.temp > set + 0.1) st.heat = 0; st.temp += dt * (st.heat ? 0.25 : -0.12) - open * dt * 0.4; st.temp = clamp(st.temp, set - 1.5, set + 0.4); } else { st.heat = 0; st.temp += (30 - st.temp) * dt * 0.02; }
      heatM.emissiveIntensity = st.heat ? 1.6 : 0.0;
      const lock = st.day >= 18, ang = run && turnOK && !lock ? Math.sin(st.t * 0.9) * 0.75 : 0; trays.forEach((tp) => { tp.rotation.x += (ang - tp.rotation.x) * Math.min(1, dt * 3); tp.userData.eggs.visible = !lock; }); link.position.z = 0.2 + Math.sin(trays[0].rotation.x) * 0.18; link.position.y = y0 + 0.6;
      const hatchPct = g.info(o).hatch, hatched = st.day >= 20.5 ? Math.round(16 * hatchPct / 100) : 0;
      hEggs.forEach((im, k) => { im.count = lock ? (k === 0 ? 24 - Math.min(24, hatched + 2) : 24) : 0; });
      chicks.children.forEach((c, i) => { c.visible = i < hatched; if (c.visible && run) c.position.y = 0.025 + Math.abs(Math.sin(st.t * 6 + i)) * 0.006; });
      cand.visible = !!o.candle; const d = st.day; emb.scale.setScalar(d < 2 ? 0.25 : clamp(0.3 + d * 0.05, 0.3, 1.5)); emb.material.color.setHex(d < 2 ? 0xe8b040 : 0x5a1a10); veins.visible = d >= 3 && d < 17; veins.scale.setScalar(clamp(0.6 + d * 0.06, 0.6, 1.3)); air.scale.set(1, 1.3 * (0.25 + d * 0.02), 1); air.position.y = 0.92 + 0.07 * 1.3 * (1 - 0.25 - d * 0.02) * 0.9;
      led.set((run ? st.temp : 30 + (st.temp - 30)).toFixed(1), String(Math.round(o.rh || 55)), run && turnOK && !lock);
    };
    g.reset = () => { st.temp = 37.8; };
    g.info = (o) => { const set = o.ts || 37.8, rh = o.rh || 55, d = o.day == null ? 0 : o.day, turnOK = o.turn !== 0 && o.turn !== false, want = d >= 18 ? 67 : 55;
      let h = 88 - Math.abs(set - 37.7) * 30 - Math.max(0, Math.abs(rh - want) - 7) * 2 - (turnOK ? 0 : 35); h = Math.round(clamp(h, 0, 92));
      const stage = d < 1 ? "Eggs set; embryo has not started" : d < 4 ? "Blastoderm grows; heart starts beating (day 2)" : d < 8 ? "Blood vessels spread; eye is a dark spot" : d < 14 ? "Embryo grows feathers and beak; moves in the egg" : d < 18 ? "Chick fills the egg; air cell enlarges" : d < 20.5 ? "Lockdown: no turning, humidity raised; chick turns to pip" : "Hatching: chicks break the shell and dry off";
      return { hatch: h, ro: [["Day", d.toFixed(0) + " of 21"], ["Temperature", st.temp.toFixed(1) + " °C (set " + set.toFixed(1) + ")"], ["Humidity", Math.round(rh) + " % (aim " + (d >= 18 ? "65–70" : "50–60") + ")"], ["Turning", d >= 18 ? "Stopped (lockdown)" : turnOK ? "On, every 1–2 h" : "Off"], ["Expected hatch", h + " %"], ["Stage", stage]],
        how: "The heater and fan keep the air at about 37.7 °C everywhere in the cabinet; the water pan keeps it humid. Trays tilt from side to side so the embryo does not stick to the shell. On day 18 eggs go to the hatcher baskets, turning stops and humidity is raised for hatching on day 21.",
        warn: Math.abs(set - 37.7) > 0.6 ? (set > 37.7 ? "Too hot: embryos die or chicks hatch early and weak." : "Too cool: development slows and hatch is late and poor.") : !turnOK && d < 18 ? "Eggs are not turned: embryos stick to the shell membrane and die." : Math.abs(rh - want) > 10 ? (rh < want ? "Too dry: chicks stick to the shell and fail to hatch." : "Too humid: chicks are soft and sticky (mushy chick).") : "Conditions are right for a good hatch." }; };
    BK.shadow(g); return g;
  }
  const sph = (r, mat, x = 0, y = 0, z = 0) => { const m = M(new (T().SphereGeometry)(r, 14, 10), mat, x, y, z); return m; };

  /* =============================== 4. MILKING MACHINE (bucket milker) =============================== */
  function milker(o = {}) {
    const T3 = T(), g = new T3.Group(), blue = paint(0x2557b8), dk = satin(), steel = AK.std(0xd4d8dc, { metalness: 0.85, roughness: 0.28 }), rub = AK.std(0x141416, { roughness: 0.85 }), clear = AK.phys(0xeaf4ff, { roughness: 0.08, transparent: true, opacity: 0.35, depthWrite: false });
    /* trolley */
    const tr = new T3.Group(); tr.add(box(0.52, 0.025, 0.38, blue, 0.02, 0.1, 0));
    [0.15, -0.15].forEach((z) => { tr.add(cyl(0.014, 0.014, 0.72, blue, -0.2, 0.46, z, 10)); tr.add(bar([-0.2, 0.8, z], [0.3, 0.74, z], 0.014, blue, true)); tr.add(rot(cyl(0.019, 0.019, 0.12, rub, 0.24, 0.745, z, 12), 0, 0, PI / 2 + 0.12)); tr.add(rot(cyl(0.021, 0.021, 0.02, AK.std(0xf2f2f2), 0.305, 0.738, z, 12), 0, 0, PI / 2)); });
    tr.add(rot(cyl(0.012, 0.012, 0.3, blue, -0.2, 0.8, 0, 8), PI / 2, 0, 0)); tr.add(bar([0.26, 0.1, 0], [0.27, 0.0, 0], 0.02, blue)); tr.add(box(0.06, 0.012, 0.3, rub, 0.27, 0.006, 0));
    part(g, tr, "Trolley frame and handles", [0, -0.2, 0]);
    const wh = new T3.Group(); [0.23, -0.23].forEach((z) => { const w = AK.wheel(0.12, 0.05, 0xe5862a); w.position.set(-0.2, 0.12, z); wh.add(w); }); wh.add(rot(cyl(0.01, 0.01, 0.5, dk, -0.2, 0.12, 0, 8), PI / 2, 0, 0));
    part(g, wh, "Wheels", [-0.2, 0, 0]);
    const mot = new T3.Group(), mb = finned(0.07, 0.2, blue, 10); mb.rotation.y = PI / 2; mb.position.set(-0.08, 0.2, 0.05); mot.add(mb); mot.add(box(0.06, 0.05, 0.07, blue, -0.08, 0.29, 0.05));
    part(g, mot, "Electric motor", [0, 0, 0.4]);
    const pmp = new T3.Group(); pmp.add(rot(cyl(0.075, 0.075, 0.1, AK.std(0x2c4f8a, { roughness: 0.4, metalness: 0.4 }), -0.08, 0.2, -0.14, 18), PI / 2, 0, 0)); pmp.add(cyl(0.025, 0.025, 0.08, clear, -0.08, 0.32, -0.14, 12)); pmp.add(cyl(0.022, 0.022, 0.05, AK.std(0xd8a030, { transparent: true, opacity: 0.8 }), -0.08, 0.3, -0.14, 12));
    part(g, pmp, "Vacuum pump (oil-lubricated)", [0, 0, -0.4]);
    const tk = new T3.Group(); tk.add(rot(cyl(0.07, 0.07, 0.28, steel, -0.2, 0.88, 0, 24), PI / 2, 0, 0)); [0.14, -0.14].forEach((z) => { const c = sph(0.07, steel, -0.2, 0.88, z); c.scale.z = 0.35; tk.add(c); });
    part(g, tk, "Vacuum tank", [0, 0.3, 0]);
    const ga = new T3.Group(); ga.add(cyl(0.01, 0.01, 0.07, steel, -0.2, 0.98, 0.05, 8)); ga.add(rot(cyl(0.048, 0.048, 0.03, steel, -0.2, 1.05, 0.05, 24), PI / 2, 0, 0));
    const dial = panel(0.084, 0.084, 160, 160, (x, w, h) => { x.fillStyle = "#f8f8f4"; x.beginPath(); x.arc(80, 80, 78, 0, TAU); x.fill(); x.lineWidth = 12; x.strokeStyle = "#3cb85a"; x.beginPath(); x.arc(80, 80, 60, PI * 0.75 + 1.5 * PI * 0.4, PI * 0.75 + 1.5 * PI * 0.52); x.stroke(); x.strokeStyle = "#d83a2a"; x.beginPath(); x.arc(80, 80, 60, PI * 0.75 + 1.5 * PI * 0.6, PI * 0.75 + 1.5 * PI); x.stroke(); x.fillStyle = "#222"; x.font = "bold 16px sans-serif"; x.textAlign = "center"; for (let v = 0; v <= 100; v += 20) { const a = PI * 0.75 + 1.5 * PI * (v / 100); x.fillText(v, 80 + Math.cos(a) * 44, 86 + Math.sin(a) * 44); } x.font = "11px sans-serif"; x.fillText("kPa vacuum", 80, 128); });
    dial.set(); dial.position.set(-0.2, 1.05, 0.067); ga.add(dial);
    const needle = box(0.003, 0.034, 0.002, AK.std(0xc81e1e), 0, 0.017, 0); const nd = grp(-0.2, 1.05, 0.069, needle); ga.add(nd); ga.add(M(new T3.CircleGeometry(0.046, 24), glassM(), -0.2, 1.05, 0.071));
    part(g, ga, "Vacuum gauge", [0, 0.25, 0.3]);
    const reg = new T3.Group(); reg.add(cyl(0.012, 0.012, 0.06, steel, -0.2, 0.97, -0.08, 8)); reg.add(cyl(0.025, 0.025, 0.035, blue, -0.2, 1.01, -0.08, 14)); reg.add(cyl(0.018, 0.018, 0.04, steel, -0.2, 1.045, -0.08, 12));
    part(g, reg, "Vacuum regulator", [0, 0.25, -0.3]);
    /* bucket with pulsator lid */
    const BX = 0.08, BY = 0.115, prof = [[0.001, 0], [0.15, 0], [0.158, 0.012], [0.155, 0.28], [0.125, 0.41], [0.118, 0.43]].map(([a, b]) => new T3.Vector2(a, b));
    const bk = new T3.Group(); const bkF = M(new T3.LatheGeometry(prof, 36, -PI / 2, PI), dbl(steel), BX, BY, 0), bkB = M(new T3.LatheGeometry(prof, 36, PI / 2, PI), dbl(steel), BX, BY, 0); bk.add(bkF, bkB);
    const hd = new T3.TorusGeometry(0.135, 0.006, 6, 20, PI); bk.add(rot(M(hd, steel, BX, BY + 0.35, 0), 0, PI / 2, 0));
    part(g, bk, "Milk bucket (stainless steel)", [0.35, 0, 0.3]);
    const milk = M(new T3.CylinderGeometry(0.15, 0.15, 1, 32), AK.std(0xfbfbf6, { roughness: 0.35 }), BX, BY, 0); milk.visible = false; g.add(milk);
    const lid = new T3.Group(); lid.add(rot(M(new T3.TorusGeometry(0.118, 0.012, 8, 32), rub, BX, BY + 0.432, 0), PI / 2, 0, 0)); lid.add(cyl(0.12, 0.115, 0.02, steel, BX, BY + 0.445, 0, 32)); lid.add(cyl(0.012, 0.012, 0.05, steel, BX + 0.06, BY + 0.47, 0.04, 10)); lid.add(cyl(0.01, 0.01, 0.05, steel, BX - 0.06, BY + 0.47, -0.02, 10));
    part(g, lid, "Bucket lid", [0.35, 0.3, 0.3]);
    const pul = new T3.Group(); pul.add(rb(0.07, 0.06, 0.06, 0.012, AK.std(0x1b1e24, { roughness: 0.4 }), BX, BY + 0.49, -0.05)); pul.add(cyl(0.006, 0.006, 0.03, steel, BX + 0.02, BY + 0.53, -0.05, 6)); pul.add(cyl(0.006, 0.006, 0.03, steel, BX - 0.02, BY + 0.53, -0.05, 6)); const pLed = sph(0.006, lampM(0x2bd14a, 0.0), BX + 0.036, BY + 0.5, -0.05); pul.add(pLed);
    part(g, pul, "Pulsator", [0.35, 0.45, 0]);
    /* cluster: claw and four teat cups at the cow's teats (or hung on the handle) */
    const TC = o.teat || [0.42, 0.66, 0.24], onCow = !!o.teat, sp = [0.079, 0.052];
    const cl = new T3.Group(); const cups = [], cupY = onCow ? TC[1] + 0.06 : TC[1], clawP = [TC[0], cupY - 0.24, TC[2]];
    const shellM = steel, cupGeo = new T3.CylinderGeometry(0.023, 0.021, 0.15, 18, 1, true);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => { const x = TC[0] + a * sp[0], z = TC[2] + b * sp[1], c = new T3.Group(); c.position.set(x, cupY, z); c.add(M(cupGeo, dbl(shellM), 0, -0.075, 0)); c.add(cyl(0.027, 0.025, 0.035, rub, 0, 0.012, 0, 18)); c.add(cyl(0.012, 0.009, 0.04, rub, 0, -0.17, 0, 10)); c.add(cyl(0.004, 0.004, 0.03, steel, 0.022, -0.05, 0, 6).rotateZ(-0.6)); cl.add(c); cups.push(c);
      cl.add(tube([[x, cupY - 0.19, z], [x * 0.6 + clawP[0] * 0.4, cupY - 0.23, z * 0.6 + clawP[2] * 0.4], [clawP[0] + a * 0.02, clawP[1] + 0.03, clawP[2] + b * 0.02]], 0.007, clear, 10));
      cl.add(tube([[x + 0.022, cupY - 0.07, z], [x + 0.03, cupY - 0.16, z], [clawP[0] + a * 0.03, clawP[1] + 0.035, clawP[2] + b * 0.03]], 0.004, rub, 10)); });
    cl.add(cyl(0.05, 0.045, 0.05, clear, ...clawP, 18)); cl.add(cyl(0.052, 0.052, 0.015, steel, clawP[0], clawP[1] + 0.03, clawP[2], 18)); cl.add(cyl(0.045, 0.03, 0.025, rub, clawP[0], clawP[1] - 0.035, clawP[2], 18));
    const clawMilk = cyl(0.044, 0.044, 1, AK.std(0xfbfbf6, { roughness: 0.35 }), clawP[0], clawP[1] - 0.02, clawP[2], 14); clawMilk.scale.y = 0.001; cl.add(clawMilk);
    part(g, cl, "Cluster: claw and four teat cups", [0, -0.15, 0.25]);
    /* long hoses */
    const lidIn = [BX + 0.06, BY + 0.5, 0.04], pulOut = [BX, BY + 0.55, -0.05], sag = Math.min(clawP[1], lidIn[1]) - 0.25;
    const milkCurve = new T3.CatmullRomCurve3([V(clawP[0], clawP[1] - 0.05, clawP[2]), V(clawP[0] + (lidIn[0] - clawP[0]) * 0.3, Math.max(0.05, sag), clawP[2] + (lidIn[2] - clawP[2]) * 0.3), V(lidIn[0] + (clawP[0] - lidIn[0]) * 0.25, Math.max(0.08, sag + 0.1), lidIn[2] + (clawP[2] - lidIn[2]) * 0.25), V(lidIn[0], lidIn[1] + 0.08, lidIn[2]), V(...lidIn)]);
    const hoses = new T3.Group(); hoses.add(M(new T3.TubeGeometry(milkCurve, 60, 0.009, 8, false), clear));
    hoses.add(tube([[clawP[0] + 0.03, clawP[1] + 0.04, clawP[2]], [clawP[0] + (pulOut[0] - clawP[0]) * 0.35, Math.max(0.06, sag + 0.04), clawP[2] + (pulOut[2] - clawP[2]) * 0.35], [pulOut[0] - 0.05, pulOut[1] + 0.12, pulOut[2]], pulOut], 0.006, rub, 50));
    hoses.add(tube([[-0.2, 0.88, -0.14], [-0.1, 0.8, -0.16], [BX - 0.06, BY + 0.6, -0.08], [BX - 0.06, BY + 0.495, -0.02]], 0.008, AK.phys(0xcfe6ff, { roughness: 0.2, transparent: true, opacity: 0.6 }), 30));
    hoses.add(tube([[-0.08, 0.32, -0.14], [-0.15, 0.6, -0.1], [-0.2, 0.84, -0.08]], 0.008, rub, 20));
    part(g, hoses, "Milk tube, pulse tube and vacuum hose", [0, 0.1, 0.4]);
    /* teat cup in section (x4), seen in the cutaway */
    const sec = new T3.Group(); sec.position.set(-0.3, 0.62, 0.6); sec.rotation.y = 0.69; sec.scale.setScalar(2.6); sec.visible = false;
    const bright = AK.std(0xcfd4d9, { metalness: 0.55, roughness: 0.32, side: T3.DoubleSide }), linerM = AK.std(0x4a4a50, { roughness: 0.7 });
    sec.add(M(new T3.CylinderGeometry(0.023, 0.021, 0.15, 24, 1, true, PI / 2, PI), bright, 0, -0.075, 0)); [0.0225, -0.0225].forEach((x) => sec.add(box(0.003, 0.15, 0.002, AK.std(0x8a9096, { metalness: 0.5, roughness: 0.4 }), x, -0.075, 0)));
    const teatS = M(new T3.CylinderGeometry(0.011, 0.0095, 0.085, 16), AK.std(0xe9a898, { roughness: 0.6 }), 0, -0.02, 0); sec.add(teatS); sec.add(M(new T3.CylinderGeometry(0.0025, 0.002, 0.086, 6), AK.std(0xfffaf2, { roughness: 0.4 }), 0, -0.02, 0.0095));
    const linL = M(new T3.BoxGeometry(0.0025, 0.11, 0.012), linerM, -0.015, -0.035, 0), linR = M(new T3.BoxGeometry(0.0025, 0.11, 0.012), linerM, 0.015, -0.035, 0); [linL, linR].forEach((l) => { l.geometry.translate(0, -0.055, 0); sec.add(l); });
    sec.add(cyl(0.027, 0.025, 0.03, linerM, 0, 0.012, 0, 18)); sec.add(cyl(0.007, 0.007, 0.05, clear, 0, -0.17, 0, 10)); const secDrops = pool(60, 0xffffff, 0.006); sec.add(secDrops);
    const pcM = new T3.MeshBasicMaterial({ color: 0x4a90ff, transparent: true, opacity: 0.35, depthWrite: false, side: T3.DoubleSide }), pc = M(new T3.PlaneGeometry(0.005, 0.11), pcM, 0.019, -0.09, 0.004); sec.add(pc); const pc2 = M(new T3.PlaneGeometry(0.005, 0.11), pcM, -0.019, -0.09, 0.004); sec.add(pc2);
    sec.add(cyl(0.004, 0.004, 0.06, bright, 0.024, -0.05, 0, 6).rotateZ(-PI / 2)); sec.add(cyl(0.005, 0.005, 0.07, satin(), 0.03, -0.2, 0, 8)); sec.add(bar([0.03, -0.165, 0], [0.024, -0.13, 0], 0.004, satin(), true)); sec.add(cyl(0.035, 0.04, 0.005, satin(), 0.03, -0.236, 0, 20));
    part(g, sec, "Teat cup in section: liner, pulsation chamber, teat", [-0.3, 0.2, 0.2]);
    const drops = pool(140, 0xffffff, 0.012); g.add(drops);
    const st = { L: 0, t: 0, ph: 0, flow: 0 };
    g.st = st;
    g.tick = (dt, o2) => {
      const run = !!o2.run, cut = !!o2.cut, vac = o2.vac || 48, rate = o2.pr || 60;
      bkF.visible = !cut; milk.visible = cut && st.L > 0.05; sec.visible = cut; cups.forEach((c) => (c.children[0].material = cut ? clear : dbl(shellM)));
      const needleT = run ? vac : 0; nd.userData.v = (nd.userData.v || 0) + (needleT - (nd.userData.v || 0)) * Math.min(1, dt * 3);
      let open = 1;
      if (run) { st.t += dt; st.ph = (st.ph + dt * rate / 60) % 1; open = st.ph < 0.6 ? 1 : 0; const wob = run ? Math.sin(st.ph * TAU) * 1.2 : 0; nd.rotation.z = -(PI * 0.75 + 1.5 * PI * ((nd.userData.v + wob) / 100)) + PI / 2; }
      else nd.rotation.z = -(PI * 0.75 + 1.5 * PI * (nd.userData.v / 100)) + PI / 2;
      pLed.material.emissiveIntensity = run && open ? 1.4 : 0;
      const k = open ? 0 : 1; [linL, linR].forEach((l, i) => { const tgt = (i ? -1 : 1) * k * 0.13; l.rotation.z += (tgt - l.rotation.z) * Math.min(1, dt * 20); }); teatS.scale.x = teatS.scale.z = 1 - k * 0.12;
      pcM.opacity = open ? 0.6 : 0.08;
      const fv = clamp((vac - 30) / 18, 0, 1.15), fr = clamp(1 - Math.abs(rate - 60) / 90, 0.3, 1), left = Math.max(0, 1 - st.L / 11);
      st.flow = run ? 2.6 * fv * fr * Math.min(1, left * 3) : 0;
      if (run && open && st.flow > 0.05) { const n = Math.ceil(dt * 50 * st.flow); for (let i = 0; i < n; i++) drops.emit(0, 0, 0, 0, 0, 0, 1); if (cut && Math.random() < 0.7) secDrops.emit((Math.random() - 0.5) * 0.004, -0.065, 0.006, 0, -0.25, 0, 0.4); }
      st.L += (st.flow / 60) * dt * 8;   /* sped up 8x */
      /* move milk drops along the milk tube */
      const P = drops.geometry.attributes.position.array; drops.userData.u = drops.userData.u || new Float32Array(140); const U = drops.userData.u;
      for (let i = 0; i < 140; i++) { if (P[i * 3 + 1] === 0 && U[i] === 0 && P[i * 3] === 0) U[i] = 0.0001; if (U[i] > 0) { U[i] += dt * 0.5; if (U[i] >= 1) { U[i] = 0; P[i * 3 + 1] = -99; continue; } const p = milkCurve.getPointAt(U[i]); P[i * 3] = p.x; P[i * 3 + 1] = p.y; P[i * 3 + 2] = p.z; } }
      drops.geometry.attributes.position.needsUpdate = true; secDrops.step(dt, 0, -1);
      clawMilk.scale.y = run && st.flow > 0.05 ? 0.012 + (open ? 0.01 : 0) : 0.001;
      const lvl = clamp(st.L / 28, 0, 1) * 0.4; milk.scale.y = Math.max(0.001, lvl); milk.position.y = BY + 0.012 + lvl / 2;
    };
    g.reset = () => { st.L = 0; st.t = 0; };
    g.info = (o2) => { const vac = o2.vac || 48, rate = o2.pr || 60;
      return { ro: [["Vacuum", Math.round(vac) + " kPa"], ["Pulsation rate", Math.round(rate) + " per min"], ["Pulsation ratio", "60 : 40 (milk : rest)"], ["Milk flow", st.flow.toFixed(1) + " L/min"], ["Milk in bucket", st.L.toFixed(1) + " L"], ["Cycle time", (60 / rate).toFixed(2) + " s"]],
        how: "The pump keeps a steady vacuum in the tank, bucket and teat cups. Inside each cup a rubber liner opens (milking phase, milk is drawn out) and closes (rest phase, the teat is massaged) as the pulsator switches the space around it between vacuum and air, about once a second. Milk runs through the claw and clear tube into the bucket.",
        warn: vac > 52 ? "Vacuum too high: it bruises the teat ends and can cause mastitis." : vac < 40 ? "Vacuum too low: cups fall off and milking is slow." : rate < 45 || rate > 75 ? "Pulsation rate out of range: keep 50–65 per minute so teats get their rest phase." : st.L >= 10.9 ? "Cow milked out: switch off and remove the cups to avoid over-milking." : "Good settings: steady vacuum and regular pulsation." }; };
    BK.shadow(g); [drops, secDrops].forEach((d) => (d.castShadow = false)); return g;
  }

  /* ---------------- registry ---------------- */
  const BUILD = { sheller, dryer, incubator, milker };
  /* scale used where an older scene expects the previous, smaller box model */
  const LEGACY = { sheller: 1.0, dryer: 0.38, incubator: 0.55, milker: 0.62 };
  AK.machineReal = (type, opts) => { try { return BUILD[type](opts); } catch (e) { console.error("agric-round4 " + type + ": " + e.message); return null; } };
  const machine3 = AK.machine;
  AK.machine = (type, opts) => {
    if (!BUILD[type]) return machine3(type, opts);
    const real = AK.machineReal(type, opts); if (!real) return machine3(type, opts);
    const outer = new (T().Group)(); real.scale.setScalar(LEGACY[type]); outer.add(real); outer.parts = real.parts; outer.real = real; return outer;
  };
  AK.r4 = { BUILD, LEGACY, pool, kernelTex };
})();
