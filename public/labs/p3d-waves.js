/* p3d-waves.js — wave motion: water waves, slinky, standing waves, diffraction (three.js, correct wave physics). */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready) return;
  const T = window.THREE, { TAU, V3 } = P.util, M = P.mat, H = P.hud, S_ = P.scenes;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sm = (x) => x * x * (3 - 2 * x);
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* thick 3-D polyline drawn with instanced cylinders; pts is an array of n+1 Vector3 */
  function curve(S, n, r, mat) {
    const im = new T.InstancedMesh(new T.CylinderGeometry(r, r, 1, 8), mat, n), m = new T.Matrix4(), q = new T.Quaternion(), p = V3(), sc = V3(), up = V3(0, 1, 0), d = V3();
    im.frustumCulled = false; im.castShadow = true; S.scene.add(im);
    im.setPts = (pts) => { for (let i = 0; i < n; i++) { const a = pts[i], b = pts[i + 1]; d.subVectors(b, a); const L = d.length() || 1e-6; q.setFromUnitVectors(up, d.multiplyScalar(1 / L)); p.addVectors(a, b).multiplyScalar(0.5); sc.set(1, L * 1.06, 1); m.compose(p, q, sc); im.setMatrixAt(i, m); } im.instanceMatrix.needsUpdate = true; };
    return im;
  }
  /* HUD dimension line between two projected points */
  function dim(ctx, S, a, b, label, color) {
    const p = S.proj(a), q = S.proj(b); ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
    const ang = Math.atan2(q.y - p.y, q.x - p.x), nx = -Math.sin(ang) * 5, ny = Math.cos(ang) * 5; ctx.beginPath(); ctx.moveTo(p.x - nx, p.y - ny); ctx.lineTo(p.x + nx, p.y + ny); ctx.moveTo(q.x - nx, q.y - ny); ctx.lineTo(q.x + nx, q.y + ny); ctx.stroke(); ctx.restore();
    if (label) H.pill(ctx, (p.x + q.x) / 2, (p.y + q.y) / 2 - 8, label, color, 10, "center");
  }
  P.util.wave = { curve, dim };

  /* ================= WAVE PROPERTIES (water tank) ================= */
  const WU = 2, WLV = 2.7, WNX = 140;     // 1 m = 2 scene units, still-water level
  S_["Wave Properties"] = {
    env: "lab", envOpts: { w: 18, d: 9 }, cam: [[0, 3.6, 12], [0, 2.8, 0]], fov: 36, sub: 1,
    build(S, s, c) {
      const mk = S.mk, o = S.objs, W = 14, D = 3;
      mk.box(W + 0.6, 0.2, D + 0.6, M.matte(0x2a2e36, 0.45), 0, 0.1, 0);
      const mkSheet = (z) => { const g = new T.PlaneGeometry(W, 1, WNX, 1); const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) pos.setZ(i, 0); g.translate(0, 0, z); const m = new T.Mesh(g, new T.MeshPhysicalMaterial({ color: 0x2a8fd0, transparent: true, opacity: 0.62, roughness: 0.06, side: T.DoubleSide, depthWrite: false })); m.renderOrder = 2; S.scene.add(m); return m; };
      o.fr = mkSheet(D / 2 - 0.03); o.bk = mkSheet(-D / 2 + 0.03);
      const sg = new T.PlaneGeometry(W - 0.1, D - 0.1, WNX, 16); sg.rotateX(-Math.PI / 2); o.surf = new T.Mesh(sg, new T.MeshPhysicalMaterial({ color: 0x1f86cc, transparent: true, opacity: 0.8, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, depthWrite: false })); o.surf.renderOrder = 2; S.scene.add(o.surf);
      const gl = P.util.glassBox(S, W, 5.4, D, 0, 0.2, 0, 0.1); o.gl = gl; mk.box(W - 0.06, 0.04, D - 0.06, M.matte(0xd9cf93, 0.6), 0, 0.22, 0);
      o.cork = [-3.6, 1.2].map((x) => { const g = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, 0.34, 24), M.matte(0xd88a3a, 0.8)); g.castShadow = true; g.userData.x = x; S.scene.add(g); return g; });
      o.pad = mk.box(0.3, 1.2, D - 0.2, M.paint(0x2d6cdf), -W / 2 + 0.15, WLV, 0);
      s.t = 0;
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t = (s.t || 0) + dt; },
    update(S, s, c) {
      const o = S.objs; if (s.t === undefined) return; const lam = c.wavelength * WU, k = TAU / lam, w = TAU * c.freq, A = c.amp * WU * 0.8, t = s.t, W = 14;
      const yAt = (x) => WLV + A * Math.sin(k * x - w * t), grow = (x) => 1;
      for (const sh of [o.fr, o.bk]) { const p = sh.geometry.attributes.position; for (let i = 0; i <= WNX; i++) { const x = p.getX(i); p.setY(i, yAt(x)); p.setY(i + WNX + 1, 0.24); } p.needsUpdate = true; }
      const sp = o.surf.geometry.attributes.position, nx = WNX + 1; for (let i = 0; i < sp.count; i++) sp.setY(i, yAt(sp.getX(i))); sp.needsUpdate = true; o.surf.geometry.computeVertexNormals();
      o.cork.forEach((g) => { const x = g.userData.x; g.position.set(x, yAt(x) + 0.02, 0); g.rotation.z = -Math.atan(A * k * Math.cos(k * x - w * t)) * 0.9; });
      o.pad.position.y = yAt(-W / 2 + 0.3) - 0.3; S.aim([0, 3.0, 0], 13.2, 0.0, 0.16);
    },
    overlay(ctx, s, c, w, h, S) {
      if (s.t === undefined) return; const lam = c.wavelength * WU, k = TAU / lam, om = TAU * c.freq, A = c.amp * WU * 0.8, t = s.t, v = c.freq * c.wavelength, T_ = 1 / c.freq;
      H.pill(ctx, 14, 26, "wave speed  v = f λ", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `v = ${f1(c.freq, 1)} Hz × ${f1(c.wavelength, 1)} m = ${f1(v, 2)} m/s`, "#8df0be", 10.5); H.pill(ctx, 14, 70, `T = 1/f = ${f1(T_, 2)} s      A = ${f1(c.amp, 2)} m`, "#cfe0ff", 10.5); H.pill(ctx, 14, 92, "the wave moves on; the cork only bobs up & down", "#9fb8d8", 9.5);
      let xc = (Math.PI / 2 + om * t) / k; xc = ((xc + 7) % lam) - 7; while (xc < -5.2) xc += lam; const x2 = xc + lam;
      if (x2 < 6.4) { dim(ctx, S, V3(xc, WLV + A + 0.7, 1.7), V3(x2, WLV + A + 0.7, 1.7), `λ = ${f1(c.wavelength, 1)} m`, "#ffd27a"); }
      dim(ctx, S, V3(xc, WLV, 1.7), V3(xc, WLV + A, 1.7), `A`, "#ff9a7a"); const qq = S.proj(V3(xc, WLV, 1.7)); H.pill(ctx, qq.x - 6, qq.y + 12, "rest level", "#9fb8d8", 8.5, "right");
      const pts = []; for (let i = 0; i <= 80; i++) { const tau = (i / 80) * 3 * T_; pts.push([tau, c.amp * Math.sin(k * -3.6 - om * (t - 3 * T_ + tau))]); }
      H.graph(ctx, w - 200, 12, 188, 124, { xmin: 0, xmax: 3 * T_, ymin: -1, ymax: 1, xl: "t (s)  — cork", yl: "y (m)", ticksX: 3, ticksY: 4, series: [{ pts, color: "#7fe3da", width: 2.2 }], dot: [3 * T_, pts[80][1], "#ffd27a"] });
    },
  };

  /* ================= TRANSVERSE vs LONGITUDINAL (slinky) ================= */
  const NR = 112, DR = 0.118, SX0 = -6.6, VSL = 3.2, MPU = 0.25;
  S_["Transverse vs Longitudinal"] = {
    env: "lab", envOpts: { w: 18, d: 8 }, cam: [[0, 3.4, 12.5], [0, 2.6, 0]], fov: 36, sub: 1,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; mk.box(15, 0.3, 3.0, M.matte(0x2a2e36, 0.45), 0, 0.15, 0); mk.box(0.4, 3.2, 1.6, M.matte(0x2a2e36, 0.45), 7.0, 1.8, 0); mk.box(0.4, 0.4, 1.6, M.steel(), 6.7, 2.6, 0);
      const g = new T.TorusGeometry(0.9, 0.034, 8, 44); g.rotateY(Math.PI / 2); o.rings = new T.InstancedMesh(g, new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.95, roughness: 0.22 }), NR); o.rings.castShadow = true; o.rings.frustumCulled = false; S.scene.add(o.rings);
      for (let i = 0; i < NR; i++) o.rings.setColorAt(i, new T.Color(i % 14 === 0 ? 0xff3b3b : 0xd9dde3));
      o.hand = new T.Mesh(new T.BoxGeometry(0.22, 1.9, 1.9), M.paint(0xff8a1f)); o.hand.castShadow = true; S.scene.add(o.hand); o.arm = mk.box(1.4, 0.35, 0.35, M.paint(0xff8a1f), -8.2, 2.6, 0); o.arrow = mk.arrow(0xffc857, 0.04, 0.14); o.arrow2 = mk.arrow(0x6ee7a8, 0.04, 0.14); o.m4 = new T.Matrix4(); o.sc = V3(1, 1, 1); o.q = new T.Quaternion(); o.rows = [];
      s.t = 0;
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t = (s.t || 0) + dt; },
    update(S, s, c) {
      const o = S.objs; if (s.t === undefined) return; const t = s.t, f = c.freq, lam = VSL / f, k = TAU / lam, om = TAU * f, long = c.type === 1, Y0 = 2.6, front = VSL * t;
      const env = (x) => sm(clamp((front - (x - SX0)) / 1.2, 0, 1)) * sm(clamp((6.6 - x) / 1.6, 0, 1)), A = long ? 0.3 : 0.7, p = V3(), cr = new T.Color(), pk = [];
      for (let i = 0; i < NR; i++) { const x0 = SX0 + i * DR, e = env(x0), ph = k * x0 - om * t, dsp = A * Math.sin(ph) * e; const x = long ? x0 + dsp : x0, y = long ? Y0 : Y0 + dsp; const tr = i % 14 === 0; o.sc.set(1, tr ? 1.04 : 1, tr ? 1.04 : 1); o.m4.compose(p.set(x, y, 0), o.q, o.sc); o.rings.setMatrixAt(i, o.m4);
        if (long) { const strain = A * k * Math.cos(ph) * e; cr.set(tr ? 0xff3b3b : 0xd9dde3).lerp(new T.Color(strain < 0 ? 0xff8a4a : 0x5aa8ff), clamp(Math.abs(strain) * 0.9, 0, 0.8) * (tr ? 0.2 : 1)); o.rings.setColorAt(i, cr); } else if (i < NR) { o.rings.setColorAt(i, cr.set(tr ? 0xff3b3b : 0xd9dde3)); } }
      o.rings.instanceMatrix.needsUpdate = true; o.rings.instanceColor.needsUpdate = true; const hx = SX0 - 0.15; o.hand.position.set(long ? hx + A * Math.sin(-om * t) : hx, long ? Y0 : Y0 + A * Math.sin(-om * t), 0); o.arm.position.set(hx - 0.8, o.hand.position.y, 0);
      S.setArrow(o.arrow, V3(-6.0, 0.55, 1.3), V3(1, 0, 0), 2.4); S.setArrow(o.arrow2, V3(-5.4, 4.3, 0), long ? V3(0.9, 0, 0) : V3(0, -0.9, 0), 1); o.arrow2.position.copy(long ? V3(-5.9, 4.35, 0) : V3(-5.4, 4.7, 0)); if (!long) o.arrow2.position.y = 5.05;
      S.aim([-0.3, 2.7, 0], 16.5, 0.0, 0.1); o.lam = lam; o.k = k; o.om = om; o.Y0 = Y0; o.A = A;
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs; if (s.t === undefined || !o.lam) return; const long = c.type === 1, lam = o.lam, t = s.t;
      H.pill(ctx, 14, 26, long ? "LONGITUDINAL: oscillation ∥ direction of travel" : "TRANSVERSE: oscillation ⊥ direction of travel", "#ffd27a", 10.5); H.pill(ctx, 14, 48, long ? "coils bunch up (compression) & spread (rarefaction)" : "each coil moves up & down; the pulse moves along →", "#cfe0ff", 10);
      H.pill(ctx, 14, 70, `v = ${f1(VSL * MPU, 2)} m/s   f = ${f1(c.freq, 1)} Hz   λ = v/f = ${f1(lam * MPU, 2)} m`, "#8df0be", 10); H.pill(ctx, 14, 92, long ? "e.g. sound in air, P-waves" : "e.g. light, water ripples, string", "#9fb8d8", 9.5);
      const xs = [], Y0 = o.Y0, om = o.om, k = o.k; const phase0 = long ? Math.PI : Math.PI / 2; let x = (phase0 + om * t) / k; x = ((x - SX0) % lam) + SX0; while (x < SX0 + 0.5) x += lam; for (let xx = x; xx < 5.6 && xs.length < 6; xx += lam) xs.push(xx);
      const front = VSL * t; xs.forEach((xx, i) => { if (xx - SX0 > front - 0.8) return; if (long) { const q = S.proj(V3(xx, Y0 + 1.25, 0)); H.pill(ctx, q.x, q.y, "C", "#ffb070", 11, "center"); const q2 = S.proj(V3(xx - lam / 2, Y0 + 1.25, 0)); if (xx - lam / 2 > SX0 + 0.8) H.pill(ctx, q2.x, q2.y, "R", "#8ec4ff", 11, "center"); } });
      if (xs.length > 1 && xs[1] - SX0 < front - 0.8) dim(ctx, S, V3(xs[0], long ? Y0 - 1.25 : Y0 + o.A + 0.6, 0), V3(xs[1], long ? Y0 - 1.25 : Y0 + o.A + 0.6, 0), `λ`, "#ffd27a");
    },
    readouts(s, c) { return [["Type", c.type === 0 ? "Transverse" : "Longitudinal"], ["Frequency", `${c.freq} Hz`], ["Wavelength λ = v/f", `${f1((VSL * MPU) / c.freq, 2)} m`], ["Example", c.type === 0 ? "Light, water ripples, string" : "Sound in air"]]; },
  };

  /* ================= STANDING WAVES ================= */
  const SU = 4, SN = 220, SL = 6.0;       // 1 m = 4 units; strings drawn from -6..6
  S_["Standing Waves — Superposition"] = {
    env: "lab", envOpts: { w: 20, d: 8 }, cam: [[0, 4.2, 14], [0, 3.4, 0]], fov: 36, sub: 1,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.rows = [5.5, 3.55, 1.45]; o.str = [curve(S, SN, 0.045, M.matte(0x4aa8ff, 0.3)), curve(S, SN, 0.045, M.matte(0xff9a4a, 0.3)), curve(S, SN, 0.07, M.matte(0xffffff, 0.25))];
      o.str[0].material.emissive = new T.Color(0x1a4a88); o.str[1].material.emissive = new T.Color(0x883a10); o.str[2].material.emissive = new T.Color(0x555555);
      o.env1 = curve(S, SN, 0.014, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 })); o.env2 = curve(S, SN, 0.014, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 }));
      o.base = o.rows.map((y) => mk.box(12.4, 0.025, 0.06, M.matte(0x555a66, 0.5), 0, y, 0));
      o.nodes = new T.InstancedMesh(new T.SphereGeometry(0.17, 16, 12), new T.MeshStandardMaterial({ color: 0xff4444, emissive: 0x991111, emissiveIntensity: 0.8 }), 30); o.anti = new T.InstancedMesh(new T.SphereGeometry(0.13, 16, 12), new T.MeshStandardMaterial({ color: 0x4cff9a, emissive: 0x109a50, emissiveIntensity: 0.8 }), 30); S.scene.add(o.nodes, o.anti);
      o.pts = Array.from({ length: SN + 1 }, () => V3()); o.m4 = new T.Matrix4(); o.sigL = ""; s.t = 0;
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t = (s.t || 0) + dt; },
    update(S, s, c) {
      const o = S.objs; if (s.t === undefined) return; const lam = c.wavelength * SU, k = TAU / lam, w = TAU * c.freq, t = s.t, A = 0.7, pts = o.pts;
      const fill = (row, fn) => { for (let i = 0; i <= SN; i++) { const x = -SL + (2 * SL * i) / SN; pts[i].set(x, o.rows[row] + fn(x), 0.0); } return pts; };
      o.str[0].setPts(fill(0, (x) => A * Math.sin(k * x - w * t))); o.str[1].setPts(fill(1, (x) => A * Math.sin(k * x + w * t))); o.str[2].setPts(fill(2, (x) => 2 * A * Math.sin(k * x) * Math.cos(w * t)));
      if (o.sigL !== c.wavelength + "") { o.sigL = c.wavelength + ""; o.env1.setPts(fill(2, (x) => 2 * A * Math.sin(k * x))); const keep = pts.map((p) => p.clone()); o.env2.setPts(fill(2, (x) => -2 * A * Math.sin(k * x))); let n = 0, a = 0; for (let m = Math.ceil((-SL * 2) / lam); m * lam / 2 <= SL; m++) { const x = (m * lam) / 2; if (x < -SL - 1e-6 || x > SL + 1e-6) continue; o.m4.setPosition(x, o.rows[2], 0.0); o.nodes.setMatrixAt(n++, o.m4); } for (let m = Math.ceil((-SL * 2) / lam - 1); (m + 0.5) * lam / 2 <= SL; m++) { const x = ((m + 0.5) * lam) / 2; if (x < -SL || x > SL) continue; o.m4.setPosition(x, o.rows[2], 0.0); o.anti.setMatrixAt(a++, o.m4); } o.nn = n; o.na = a; o.nodes.count = n; o.anti.count = a; o.nodes.instanceMatrix.needsUpdate = true; o.anti.instanceMatrix.needsUpdate = true; }
      S.aim([0, 3.5, 0], 14.8, 0.0, 0.05);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, v = c.wavelength * c.freq, lam = c.wavelength * SU; H.pill(ctx, 14, 26, "y = 2A sin(kx) cos(ωt)   two opposite waves superpose", "#ffd27a", 10); H.pill(ctx, 14, 48, `v = fλ = ${f1(c.freq, 1)} × ${f1(c.wavelength, 1)} = ${f1(v, 2)} m/s`, "#8df0be", 10.5); H.pill(ctx, 14, 70, `node spacing = λ/2 = ${f1(c.wavelength / 2, 2)} m`, "#cfe0ff", 10.5);
      const lab = ["wave travelling →", "reflected wave ←", "resultant: STANDING WAVE"], col = ["#7fc4ff", "#ffb070", "#ffffff"]; o.rows.forEach((y, i) => { const q = S.proj(V3(SL, y + 1.2, 0)); H.pill(ctx, q.x, q.y, lab[i], col[i], 9.5, "right"); });
      const n = S.proj(V3(-lam / 2 > -SL ? -lam / 2 : lam / 2, o.rows[2] - 1.35, 0)), a = S.proj(V3(lam / 4, o.rows[2] - 1.35, 0)); H.pill(ctx, n.x, n.y, "● node (always 0)", "#ff8080", 9.5, "center"); H.pill(ctx, a.x + 30, a.y, "● antinode (2A)", "#7affb0", 9.5, "center");
      if (lam / 2 < 11) dim(ctx, S, V3(0, o.rows[2] - 1.0, 0), V3(lam / 2, o.rows[2] - 1.0, 0), "λ/2", "#ffd27a");
    },
  };

  /* ================= DIFFRACTION THROUGH A GAP (ripple tank) ================= */
  const DX0 = -8, DX1 = 12, DZ = 6, DNX = 150, DNZ = 96, PXU = 0.05, VD = 1.8;
  S_["Diffraction Through a Gap"] = {
    env: "lab", envOpts: { w: 24, d: 14 }, cam: [[2.0, 12.5, 14], [2.0, 0, 0]], fov: 36, sub: 1,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; mk.box(DX1 - DX0 + 1.2, 0.3, 2 * DZ + 1.2, M.matte(0x1d2026, 0.5), (DX0 + DX1) / 2, 0.0, 0);
      const g = new T.PlaneGeometry(DX1 - DX0, 2 * DZ, DNX, DNZ); g.rotateX(-Math.PI / 2); g.translate((DX0 + DX1) / 2, 0.22, 0); g.setAttribute("color", new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3)); o.surf = new T.Mesh(g, new T.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.2, metalness: 0.0, clearcoat: 0.5, clearcoatRoughness: 0.15, envMapIntensity: 0.8, side: T.DoubleSide })); o.surf.receiveShadow = true; S.scene.add(o.surf);
      const rim = (x, z, w, d) => mk.box(w, 0.6, d, M.matte(0x2a2e36, 0.45), x, 0.2, z); rim((DX0 + DX1) / 2, DZ + 0.3, DX1 - DX0 + 1.2, 0.6); rim((DX0 + DX1) / 2, -DZ - 0.3, DX1 - DX0 + 1.2, 0.6); rim(DX0 - 0.3, 0, 0.6, 2 * DZ); rim(DX1 + 0.3, 0, 0.6, 2 * DZ);
      o.bt = new T.Mesh(new T.BoxGeometry(0.6, 0.8, 1), M.matte(0xb8b2a4, 0.8)); o.bb = new T.Mesh(new T.BoxGeometry(0.6, 0.8, 1), M.matte(0xb8b2a4, 0.8)); o.bt.castShadow = o.bb.castShadow = true; S.scene.add(o.bt, o.bb);
      o.dip = mk.cyl(0.08, 0.08, 2 * DZ, M.chrome(), DX0 + 0.35, 0.6, 0); o.dip.rotation.x = Math.PI / 2; o.ln = [0, 1].map(() => mk.rod(V3(), V3(1, 0, 0), 0.025, M.matte(0xffd27a, 0.4), 6));
      s.t = 0; s.sig = ""; o.xs = new Float32Array(DNX + 1); o.zs = new Float32Array(DNZ + 1);
      const p = g.attributes.position; o.ix = new Float32Array(p.count); o.iz = new Float32Array(p.count); for (let i = 0; i < p.count; i++) { o.ix[i] = p.getX(i); o.iz[i] = p.getZ(i); }
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t = (s.t || 0) + dt; },
    update(S, s, c) {
      const o = S.objs; if (s.t === undefined) return; const lam = c.wavelength * PXU, k = TAU / lam, w = k * VD, gap = c.gap * PXU, t = s.t, Af = Math.min(0.1, 0.3 / k), p = o.surf.geometry.attributes.position;
      const M_ = clamp(Math.ceil(gap / (lam / 3)), 6, 44), dz = gap / M_, zs = []; for (let m = 0; m < M_; m++) zs.push(-gap / 2 + (m + 0.5) * dz); const kk = Math.sqrt(k / TAU) * dz;
      for (let i = 0; i < p.count; i++) {
        const x = o.ix[i], z = o.iz[i]; let y;
        if (x < 0.0) { y = Math.cos(k * x - w * t); if (x > -0.5) { /* barrier face */ } }
        else { let u = 0; for (let m = 0; m < M_; m++) { const dzz = z - zs[m], r = Math.max(0.18, Math.sqrt(x * x + dzz * dzz)); u += (kk / Math.sqrt(r)) * Math.cos(k * r - w * t - Math.PI / 4); } y = clamp(u, -1.6, 1.6); if (x < 0.6 && Math.abs(z) < gap / 2) { const b = x / 0.6; y = y * b + Math.cos(k * x - w * t) * (1 - b); } }
        p.setY(i, 0.22 + Af * y); const kq = clamp(0.5 + 0.48 * y, 0, 1), cl = o.surf.geometry.attributes.color; cl.setXYZ(i, 0.02 + 0.30 * kq, 0.14 + 0.62 * kq, 0.30 + 0.62 * kq);
      } o.surf.geometry.attributes.color.needsUpdate = true; p.needsUpdate = true; o.surf.geometry.computeVertexNormals();
      const zt = gap / 2 + (DZ - gap / 2) / 2, ht = DZ - gap / 2; o.bt.scale.z = ht; o.bt.position.set(0, 0.45, gap / 2 + ht / 2); o.bb.scale.z = ht; o.bb.position.set(0, 0.45, -gap / 2 - ht / 2);
      o.dip.position.y = 0.22 + Af * Math.cos(-w * t) - 0.05; const th = lam < gap ? Math.asin(lam / gap) : null; o.th = th; if (th !== null) { S.setRod(o.ln[0], V3(0.3, 0.5, 0), V3(0.3 + 11 * Math.cos(th), 0.5, 11 * Math.sin(th))); S.setRod(o.ln[1], V3(0.3, 0.5, 0), V3(0.3 + 11 * Math.cos(th), 0.5, -11 * Math.sin(th))); o.ln[0].visible = o.ln[1].visible = true; } else o.ln[0].visible = o.ln[1].visible = false;
      S.aim([2.0, 0, 0], 24, 0.0, 1.0);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, ratio = c.gap / c.wavelength; H.pill(ctx, 14, 26, "DIFFRACTION: waves spread out through a gap", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `gap a = ${c.gap} px    λ = ${c.wavelength} px    a/λ = ${f1(ratio, 2)}`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, ratio < 1.5 ? "a ≲ λ : STRONG diffraction — almost circular waves" : "a ≫ λ : WEAK diffraction — straight beam, small edge spread", ratio < 1.5 ? "#8df0be" : "#ffb870", 10); H.pill(ctx, 14, 92, o.th != null ? `first minimum: sinθ = λ/a  →  θ = ${f1((o.th * 180) / Math.PI, 0)}°  (dashed lines)` : "a < λ : sinθ = λ/a > 1 → waves spread through 90°", "#9fb8d8", 9.5);
      const q = S.proj(V3(0, 0.5, DZ - 0.5)); H.pill(ctx, q.x + 8, q.y, "barrier", "#e8f1ff", 9.5); const q2 = S.proj(V3(DX0 + 2.5, 0.5, DZ + 0.6)); H.pill(ctx, q2.x, q2.y, "plane waves →", "#9fd0ff", 9.5); dim(ctx, S, V3(-0.5, 0.9, -c.gap * PXU / 2), V3(-0.5, 0.9, c.gap * PXU / 2), `a`, "#ffd27a");
    },
  };
})();
