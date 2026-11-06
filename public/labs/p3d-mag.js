/* p3d-mag.js — electromagnetism: wire field, solenoid/electromagnet, motor effect, induction, transformer, a.c., RLC resonance (three.js). */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready || !P.util.elec) return;
  const T = window.THREE, { V3, TAU } = P.util, M = P.mat, H = P.hud, S_ = P.scenes, E = P.util.elec, W = P.util.wave;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const MU0 = 4e-7 * Math.PI, eng = E.eng, sci = E.sci;
  const lab = E.lab, bench = E.bench;
  const labTex = (txt, bg) => { const cv = document.createElement("canvas"); cv.width = cv.height = 128; const x = cv.getContext("2d"); x.fillStyle = bg; x.fillRect(0, 0, 128, 128); x.fillStyle = "#fff"; x.font = "bold 84px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(txt, 64, 70); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return t; };
  const magnetBar = (w, h, d, nCol, sCol) => { const g = new T.Group(), mf = (txt, col) => [M.paint(col), M.paint(col), M.paint(col), M.paint(col), new T.MeshStandardMaterial({ map: labTex(txt, "#" + col.toString(16).padStart(6, "0")), roughness: 0.4 }), new T.MeshStandardMaterial({ map: labTex(txt, "#" + col.toString(16).padStart(6, "0")), roughness: 0.4 })]; const n = new T.Mesh(new T.BoxGeometry(w / 2, h, d), mf("N", nCol)), s = new T.Mesh(new T.BoxGeometry(w / 2, h, d), mf("S", sCol)); n.position.x = w / 4; s.position.x = -w / 4; n.castShadow = s.castShadow = true; g.add(n, s); return g; };
  const sceneSky = "lab";

  /* ================= MAGNETIC FIELD OF A CURRENT ================= */
  S_["Magnetic Field of a Current"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 14 }, cam: [[6, 11, 14], [0, 2.5, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); o.wire = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 7.2, 20), M.copper()); o.wire.position.y = 3.6; o.wire.castShadow = true; S.scene.add(o.wire);
      o.card = new T.Mesh(new T.CylinderGeometry(6.4, 6.4, 0.05, 64), new T.MeshStandardMaterial({ color: 0xe9e1cf, roughness: 0.9, transparent: true, opacity: 0.88 })); o.card.position.y = 3.5; S.scene.add(o.card);
      o.cur = mk.arrow(0xffb703, 0.07, 0.24); o.rings = []; o.fil = []; const NF = 520; o.filI = new T.InstancedMesh(new T.CylinderGeometry(0.016, 0.016, 0.34, 5), new T.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.4, metalness: 0.7 }), NF); o.filI.frustumCulled = false; S.scene.add(o.filI); o.fp = [];
      for (let i = 0; i < NF; i++) { const r = 0.7 + 5.5 * Math.pow(Math.random(), 0.8), a = Math.random() * TAU; o.fp.push([r, a]); }
      o.arc = []; [1.5, 2.8, 4.2, 5.6].forEach((r) => { const pts = []; for (let i = 0; i <= 80; i++) { const a = (i / 80) * TAU; pts.push(V3(Math.cos(a) * r, 3.56, Math.sin(a) * r)); } const t = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 160, 0.03, 6, true), new T.MeshBasicMaterial({ color: 0x7fe3da, transparent: true, opacity: 0.8 })); S.scene.add(t); o.rings.push(r); });
      o.cones = [1.5, 2.8, 4.2, 5.6].map(() => [0, 1, 2, 3].map(() => { const c2 = new T.Mesh(new T.ConeGeometry(0.14, 0.38, 12), new T.MeshBasicMaterial({ color: 0x7fe3da })); S.scene.add(c2); return c2; }));
      o.tr = []; for (let i = 0; i < 12; i++) { const m = new T.Mesh(new T.SphereGeometry(0.075, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff })); S.scene.add(m); o.tr.push(m); } o.compass = [2.2, 4.4].map((r) => { const g = new T.Group(), n = new T.Mesh(new T.ConeGeometry(0.16, 0.7, 14), M.paint(0xd02a2a)), sd = new T.Mesh(new T.ConeGeometry(0.16, 0.7, 14), M.paint(0xe8e8e8)); n.rotation.z = -Math.PI / 2; sd.rotation.z = Math.PI / 2; n.position.x = 0.35; sd.position.x = -0.35; g.add(n, sd, new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.1, 10), M.chrome())); g.position.set(r, 3.7, 0); g.userData.r = r; S.scene.add(g); return g; });
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c, dt) {
      const o = S.objs, I = c.current, sg = I >= 0 ? 1 : -1, m = new T.Matrix4(), q = new T.Quaternion(), p = V3(), sc = V3(1, 1, 1), up = V3(0, 1, 0);
      S.setArrow(o.cur, V3(0.45, I >= 0 ? 4.4 : 6.9, 0), V3(0, sg * 2.2, 0), 1); o.cur.visible = Math.abs(I) > 0;
      for (let i = 0; i < o.fp.length; i++) { const [r, a] = o.fp[i], x = Math.cos(a) * r, z = Math.sin(a) * r, tang = V3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(sg); if (I === 0) tang.set(Math.cos(a * 7 + i), 0, Math.sin(a * 3 + i)); q.setFromUnitVectors(up, V3(tang.z, 0, -tang.x).lengthSq() ? V3(0, 0, 0).add(tang) : up); const dir = I === 0 ? V3(1, 0, 0) : tang; q.setFromUnitVectors(up, dir.clone().normalize()); p.set(x, 3.56, z); sc.set(1, 1, 1); m.compose(p, q, sc); o.filI.setMatrixAt(i, m); } o.filI.instanceMatrix.needsUpdate = true;
      o.cones.forEach((arr, ri) => { const r = o.rings[ri]; arr.forEach((cn, k) => { const a = (k / 4) * TAU + 0.4 + ri * 0.5, tang = V3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(sg); cn.position.set(Math.cos(a) * r, 3.56, Math.sin(a) * r); cn.quaternion.setFromUnitVectors(up, tang.normalize()); cn.visible = I !== 0; }); });
      o.tr.forEach((t, i) => { const r = o.rings[i % 4], a = ((i / 12) * TAU + S.t * 0.8 * sg * (1.5 / r) * Math.min(1, Math.abs(I) / 3)) % TAU; t.position.set(Math.cos(a) * r, 3.62, Math.sin(a) * r); t.visible = I !== 0; });
      o.compass.forEach((g, i) => { const r = g.userData.r, a = 0.9 + i * 2.4, ang = I === 0 ? 0 : Math.atan2(Math.cos(a) * sg, -Math.sin(a) * sg); g.position.set(Math.cos(a) * r, 3.72, Math.sin(a) * r); g.rotation.y = I === 0 ? 0 : -Math.atan2(Math.cos(a) * sg, -Math.sin(a) * sg) + 0; const tx = -Math.sin(a) * sg, tz = Math.cos(a) * sg; g.rotation.y = Math.atan2(-tz, tx); if (I === 0) g.rotation.y = 0; });
      S.aim([0, 3.2, 0], 19, 0.55 + 0.25 * Math.sin(S.t * 0.12), 0.55);
    },
    overlay(ctx, s, c, w, h, S) {
      const I = c.current, B = (r) => (MU0 * Math.abs(I)) / (2 * Math.PI * r); H.pill(ctx, 14, 26, "B = μ₀I / 2πr        (right-hand grip rule)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `I = ${I} A ${I >= 0 ? "upward (out of the page, seen from above ⊙)" : "downward (into the page ⊗)"}`, "#cfe0ff", 10);
      H.pill(ctx, 14, 70, `B(2 cm) = ${f1(B(0.02) * 1e6, 0)} µT     B(5 cm) = ${f1(B(0.05) * 1e6, 0)} µT   (B ∝ I,  B ∝ 1/r)`, "#8df0be", 10); H.pill(ctx, 14, 92, I === 0 ? "no current → no field: compass points to the Earth's field" : `thumb along I, fingers curl ${I >= 0 ? "ANTICLOCKWISE" : "CLOCKWISE"} (viewed from above)`, "#9fb8d8", 9.5);
      lab(ctx, S, V3(0.7, I >= 0 ? 6.4 : 5.2, 0), "I", "#ffb703", "left"); lab(ctx, S, V3(4.6, 3.9, 1.8), "iron filings: concentric circles", "#cfe0ff"); lab(ctx, S, V3(0.3, 1.0, 0), "straight wire", "#cfe0ff", "left");
    },
    readouts(s, c) { return [["Current", `${c.current} A`], ["Field direction", c.current >= 0 ? "Anticlockwise (viewed from above)" : c.current === 0 ? "No field" : "Clockwise"], ["Field strength", `B = μ₀I/2πr  (∝ I / r)`]]; },
  };

  /* ================= SOLENOID & ELECTROMAGNET ================= */
  const SL = 5.4, SR = 1.4;
  function solenoidLines(turns) {
    const nseg = 20, mx = [], my = [], mz = [], dx = [], dy = [], dz = []; for (let k = 0; k < turns; k++) { const x0 = -SL / 2 + 0.3 + ((SL - 0.6) * (k + 0.5)) / turns; for (let j = 0; j < nseg; j++) { const a0 = (j / nseg) * TAU, a1 = ((j + 1) / nseg) * TAU; mx.push(x0); my.push(SR * Math.cos((a0 + a1) / 2)); mz.push(SR * Math.sin((a0 + a1) / 2)); dx.push(0); dy.push(SR * (Math.cos(a1) - Math.cos(a0))); dz.push(SR * (Math.sin(a1) - Math.sin(a0))); } }
    const n = mx.length, B = (px, py, pz, out) => { let bx = 0, by = 0, bz = 0; for (let i = 0; i < n; i++) { const rx = px - mx[i], ry = py - my[i], rz = pz - mz[i], r2 = rx * rx + ry * ry + rz * rz + 0.02, k = 1 / (r2 * Math.sqrt(r2)); bx += (dy[i] * rz - dz[i] * ry) * k; by += (dz[i] * rx - dx[i] * rz) * k; bz += (dx[i] * ry - dy[i] * rx) * k; } out[0] = bx; out[1] = by; out[2] = bz; };
    const lines = [], o1 = [0, 0, 0], o2 = [0, 0, 0]; const starts = []; [0, 0.35, 0.7].forEach((fr) => [0, 1, 2, 3].forEach((k) => { const a = (k / 4) * TAU; starts.push([-SL / 2 + 0.5, fr * SR * Math.cos(a), fr * SR * Math.sin(a)]); if (fr === 0) return; }));
    const seen = new Set(); starts.forEach((st) => { const key = st.join(","); if (seen.has(key)) return; seen.add(key); let [x, y, z] = st; const pts = [V3(x, y, z)]; for (let i = 0; i < 520; i++) { B(x, y, z, o1); let l = Math.hypot(o1[0], o1[1], o1[2]) || 1; const h = 0.12; B(x + (o1[0] / l) * h * 0.5, y + (o1[1] / l) * h * 0.5, z + (o1[2] / l) * h * 0.5, o2); l = Math.hypot(o2[0], o2[1], o2[2]) || 1; x += (o2[0] / l) * h; y += (o2[1] / l) * h; z += (o2[2] / l) * h; pts.push(V3(x, y, z)); if (Math.hypot(x, y, z) > 9 || (i > 40 && x < -SL / 2 - 0.3 && Math.hypot(y, z) < SR * 1.1)) break; } if (pts.length > 10) lines.push(pts); });
    return lines;
  }
  S_["Solenoid & Electromagnet"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 14 }, cam: [[0, 7, 17], [1, 2.6, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); o.sig = ""; o.y0 = 3.0; o.coilG = new T.Group(); S.scene.add(o.coilG); o.lineG = new T.Group(); S.scene.add(o.lineG);
      const cg = new T.CylinderGeometry(0.34, 0.34, SL + 3.2, 20); cg.rotateZ(Math.PI / 2); o.core = new T.Mesh(cg, M.iron ? M.iron() : M.steel()); o.core.position.set(0.5, o.y0, 0); o.core.castShadow = true; S.scene.add(o.core); const tip = new T.Mesh(new T.SphereGeometry(0.34, 16, 12), M.steel()); tip.position.set(0.5 + (SL + 3.2) / 2, o.y0, 0); S.scene.add(tip);
      o.bat = E.supply(S); o.bat.position.set(-7.5, 2.0, 0); o.bat.scale.setScalar(0.8); o.bat.position.y = 1.7; wireTo(S, o);
      o.pins = []; for (let i = 0; i < 10; i++) { const g = new T.Group(), sh = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.9, 8), M.steel()), hd = new T.Mesh(new T.SphereGeometry(0.08, 10, 8), M.steel()); sh.rotation.z = Math.PI / 2; hd.position.x = -0.46; g.add(sh, hd); g.userData = { hx: 4.6 + (i % 5) * 0.8, hz: -1.4 + Math.floor(i / 5) * 1.2, k: 0 }; g.position.set(g.userData.hx, 0.06, g.userData.hz); S.scene.add(g); o.pins.push(g); }
      o.tr = []; o.car = null;
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c, dt) {
      const o = S.objs, turns = clamp(Math.round(c.turns * 0.7), 4, 28), sig = `${turns}`; if (o.sig !== sig) { o.sig = sig; while (o.coilG.children.length) { const m = o.coilG.children.pop(); m.geometry.dispose(); }
        const hx = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3((() => { const pts = [], n = turns * 24; for (let i = 0; i <= n; i++) { const a = (i / 24) * TAU, x = -SL / 2 + 0.3 + ((SL - 0.6) * i) / n; pts.push(V3(x, Math.cos(a) * SR, Math.sin(a) * SR)); } return pts; })()), turns * 48, 0.075, 8, false), M.copper()); hx.castShadow = true; o.coilG.add(hx); o.coilG.position.set(0, o.y0, 0);
        while (o.lineG.children.length) { const m = o.lineG.children.pop(); if (m.geometry) m.geometry.dispose(); } o.lines = solenoidLines(turns).map((pts) => { pts.forEach((p) => p.y += o.y0); const cur = new T.CatmullRomCurve3(pts), tb = new T.Mesh(new T.TubeGeometry(cur, Math.min(pts.length, 240), 0.022, 5, false), new T.MeshBasicMaterial({ color: 0x7fe3da, transparent: true, opacity: 0.75 })); o.lineG.add(tb); [0.25, 0.7].forEach((u) => { const cn = new T.Mesh(new T.ConeGeometry(0.09, 0.26, 10), new T.MeshBasicMaterial({ color: 0x7fe3da })); cn.position.copy(cur.getPointAt(u)); cn.quaternion.setFromUnitVectors(V3(0, 1, 0), cur.getTangentAt(u)); o.lineG.add(cn); }); return cur; });
        o.tr.forEach((m) => S.scene.remove(m)); o.tr = []; o.lines.forEach((cur, i) => { const m = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff })); m.userData = { cur, u: (i * 0.137) % 1 }; S.scene.add(m); o.tr.push(m); }); }
      const I = c.current, on = I > 0.05, Bt = MU0 * c.turns * 100 * I; o.lineG.visible = on; o.tr.forEach((m) => { m.visible = on; m.userData.u = (m.userData.u + 0.0035 * (0.4 + I / 6)) % 1; m.position.copy(m.userData.cur.getPointAt(m.userData.u)); }); o.bat.set(`${f1(I, 1)} A`, "DC SUPPLY");
      const k = on ? Math.min(10, Math.floor((Bt * 1000 * 1.0) / 5)) : 0; o.pins.forEach((g, i) => { const d = g.userData, tgtAttached = i < k, tp = tgtAttached ? V3(0.5 + (SL + 3.2) / 2 + 0.4 + (i % 3) * 0.12, o.y0 - 0.15 - i * 0.18, 0.12 * ((i % 2) - 0.5)) : V3(d.hx, 0.06, d.hz); g.position.lerp(tp, 0.12); g.rotation.z += ((tgtAttached ? -Math.PI / 2 * 1.0 + 0 : 0) - g.rotation.z) * 0.12; }); o.k = k; o.Bt = Bt;
      S.aim([0.5, 2.8, 0], 20, 0.35, 0.35);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, n = c.turns * 100, I = c.current; H.pill(ctx, 14, 26, "B = μ₀ n I        (inside a long solenoid; uniform)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `n = ${c.turns} turns/cm = ${n} turns/m     I = ${I} A     μ₀ = 4π×10⁻⁷ T·m/A`, "#cfe0ff", 10);
      H.pill(ctx, 14, 70, `B = ${f1(o.Bt * 1000, 1)} mT   (air core);  with soft-iron core ≈ ${f1(o.Bt * 200, 0)} T-scale ×μᵣ (≈200)`.replace(/;.*/, "; iron core multiplies it ×μᵣ ≈ 200"), "#8df0be", 10); H.pill(ctx, 14, 92, I > 0.05 ? `electromagnet picks up ${o.k} pin${o.k === 1 ? "" : "s"} — B ∝ I and ∝ n; switch off I → pins drop` : "I = 0 → no field, core is not magnetised", "#9fb8d8", 9.5);
      lab(ctx, S, V3(0, 5.0, 0.5), "solenoid (coil) with soft-iron core", "#ffd27a"); lab(ctx, S, V3(7.6, 4.4, 0.6), "N pole (right-hand rule)", "#ff8a7a", "right"); lab(ctx, S, V3(6.2, -0.1, 1.5), "steel pins", "#cfe0ff");
    },
    readouts(s, c) { const Bt = MU0 * c.turns * 100 * c.current; return [["Field inside (air)", `${f1(Bt * 1000, 1)} mT`], ["Current", `${c.current} A`], ["Turns per cm", `${c.turns}`], ["Used in", "electric bell, relay, electromagnetic crane"]]; },
  };
  function wireTo(S, o) { const y = o.y0 + SR; E.wires(S, [V3(-7.5, 3.4, 0.5), V3(-7.5, 5.8, 0.5), V3(-SL / 2 + 0.3, 5.8, 0.5), V3(-SL / 2 + 0.3, y + 0.05, 0)]); E.wires(S, [V3(SL / 2 - 0.3, y + 0.05, 0), V3(SL / 2 - 0.3, 5.3, -0.6), V3(-6.6, 5.3, -0.6), V3(-6.6, 0.1, -0.6), V3(-7.5, 0.1, 0.2), V3(-7.5, 0.0, 0.0)]); }

  /* ================= MOTOR EFFECT ================= */
  S_["Motor Effect — Force on a Conductor"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 14 }, cam: [[5, 9, 15], [0, 3, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); s.x = 0; s.v = 0; s.hold = 0;
      const pole = (txt, col, y) => { const g = new T.Mesh(new T.BoxGeometry(8, 1.6, 4.2), [M.paint(col), M.paint(col), new T.MeshStandardMaterial({ map: labTex(txt, "#" + col.toString(16).padStart(6, "0")), roughness: 0.4 }), M.paint(col), M.paint(col), M.paint(col)]); g.position.set(0, y, 0); g.castShadow = true; S.scene.add(g); return g; };
      o.n = pole("N", 0xd0322a, 7.6); o.sp = pole("S", 0x2a58c8, 0.9); mk.box(1.2, 7.4, 4.0, M.steel(), -4.6, 4.0, 0);
      o.rails = [-1, 1].map((sg) => mk.box(11, 0.14, 0.14, M.copper(), 0, 2.2, sg * 1.5)); o.rod = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 3, 24), M.chrome()); o.rod.rotation.x = Math.PI / 2; o.rod.position.y = 2.42; o.rod.castShadow = true; S.scene.add(o.rod);
      o.bat = E.supply(S); o.bat.position.set(-7.7, 1.7, 0); o.bat.scale.setScalar(0.8);
      o.aB = mk.arrow(0x7fe3da, 0.05, 0.2); o.aI = mk.arrow(0xffb703, 0.05, 0.2); o.aF = mk.arrow(0xff6b5a, 0.07, 0.26);
      o.bf = []; for (let i = 0; i < 6; i++) { const a = mk.arrow(0x7fe3da, 0.025, 0.12); o.bf.push(a); }
      o.ca = E.carriers(S, E.mkPath([V3(-5, 2.55, -1.5), V3(-5, 2.55, 1.5)], false), 14);
    },
    reset(s, c) { s.x = 0; s.v = 0; },
    step(s, c, dt) { if (s.hold > 0) { s.hold -= dt; if (s.hold <= 0) { s.x = 0; s.v = 0; } return; } const F = c.B * c.current * c.length, m = 0.05, a = (F / m) * 0.012; s.v += a * dt; s.x += s.v * dt; if (s.x > 4.6) { s.x = 4.6; s.hold = 1.0; } },
    update(S, s, c, dt) {
      const o = S.objs, F = c.B * c.current * c.length, Lu = c.length * 10; o.rod.scale.set(1, Lu / 3, 1); o.rod.position.x = s.x; o.rails.forEach((r, i) => (r.position.z = (i ? 1 : -1) * Lu / 2)); o.rod.rotation.z = 0; o.rod.rotation.x = Math.PI / 2; o.rod.rotation.y = 0; const sx = s.x - 4.6 * 0;
      o.bat.set(`${f1(c.current, 1)} A`, "DC SUPPLY"); const y0 = 2.65, up = c.current > 0;
      S.setArrow(o.aB, V3(s.x - 1.8, 6.2, 0), V3(0, -2.4, 0), 1); S.setArrow(o.aI, V3(s.x, y0 + 0.2, -Lu / 2 - 0.2), V3(0, 0, up ? Lu + 0.4 : 0), 1); S.setArrow(o.aF, V3(s.x + 0.3, y0 + 0.5, 0), V3(F > 0 ? clamp(0.8 + F * 1.4, 0.8, 4.5) : 0, 0, 0), 1);
      o.bf.forEach((a, i) => S.setArrow(a, V3(-3 + (i % 3) * 3, 6.4, -1.2 + Math.floor(i / 3) * 2.4), V3(0, -3.4, 0), 1)); o.ca.im.visible = up; if (up) { o.cph = ((o.cph || 0) + (dt || 0.016) * 0.35) % 1; for (let i = 0; i < 14; i++) o.ca.im.set(i, s.x, 2.5, -Lu / 2 + ((i / 14 + o.cph) % 1) * Lu, 1); o.ca.im.instanceMatrix.needsUpdate = true; }
      S.aim([0.4, 3.9, 0], 22, 0.55, 0.34);
    },
    overlay(ctx, s, c, w, h, S) {
      const F = c.B * c.current * c.length; H.pill(ctx, 14, 26, "F = B I L sinθ        (θ = 90° here, so F = BIL)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `F = ${c.B} T × ${c.current} A × ${c.length} m = ${f1(F, 3)} N`, "#8df0be", 10.5);
      H.pill(ctx, 14, 70, "Fleming's LEFT hand: First finger = Field (N→S), seCond = Current, thuMb = Motion/force", "#cfe0ff", 9.5); H.pill(ctx, 14, 92, c.current > 0 ? "rod rolls along the rails; reverse I or B → reverses the force" : "I = 0 → no force", "#9fb8d8", 9.5);
      lab(ctx, S, V3(s.x - 2.4, 4.3, 0), "B (N→S)", "#7fe3da", "right"); lab(ctx, S, V3(s.x, 2.2, 2.4), "I", "#ffb703"); lab(ctx, S, V3(s.x + 3.0, 3.4, 0), "F", "#ff8a7a", "left"); lab(ctx, S, V3(4.6, 7.6, 0), "N pole", "#ff8a7a", "left"); lab(ctx, S, V3(4.6, 0.9, 0), "S pole", "#7fb6ff", "left");
    },
    readouts(s, c) { const F = c.B * c.current * c.length; return [["Force on conductor", `${f1(F, 3)} N`], ["Direction", "Fleming's left-hand rule"], ["Used in", "electric motors, loudspeakers"]]; },
  };

  /* ================= ELECTROMAGNETIC INDUCTION ================= */
  const CL = 5.0, CRAD = 1.5, MS = 0.0, SPREAD = 3.0, UCM = 0.62;
  S_["Electromagnetic Induction"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 14 }, cam: [[0, 6, 18], [0, 3, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); s.x = -12; s.emf = 0; s.fl = []; s.ef = []; s.t = 0; o.sig = ""; o.coilG = new T.Group(); S.scene.add(o.coilG); o.mag = magnetBar(3.6, 0.9, 0.9, 0xd0322a, 0x2a58c8); o.mag.position.y = 3.0; S.scene.add(o.mag); o.gal = E.meter(S, "GALVANOMETER", 3.0); o.gal.position.set(7, 2.2, 1.6); o.gal.scale.setScalar(1.1);
      const neg = new T.Group(); o.needleBase = mk.cyl(0.9, 0.9, 0.2, M.matte(0x1b1d22, 0.4), 7, 2.2, 1.9); o.needleBase.rotation.x = Math.PI / 2; o.needleBase.visible = false; o.ndl = new T.Mesh(new T.BoxGeometry(0.06, 1.4, 0.04), M.matte(0xe02a2a, 0.4)); o.ndl.geometry.translate(0, 0.7, 0); o.ndl.position.set(7, 1.9, 2.1); o.ndl.visible = false;
      o.lead = [E.lead(S, V3(-CL / 2 - 0.2, 3.0 + CRAD, 0), V3(5.9, 2.7, 1.6), 1.2, 0xc0392b), E.lead(S, V3(CL / 2 + 0.2, 3.0 + CRAD, 0), V3(8.1, 2.7, 1.6), 0.8, 0x111111)];
      o.rail = mk.box(26, 0.14, 0.6, M.matte(0x2a2e36, 0.4), 0, 1.7, 0); o.hlam = mk.sphere(0.0001, M.matte(0, 1), 0, 0, 0); o.tr = [];
    },
    reset(s, c) { s.x = -12; s.emf = 0; },
    step(s, c, dt) { const v = c.speed, x0 = s.x; s.x += v * dt; const B = (x) => c.strength * Math.exp(-Math.pow(x / SPREAD, 2)), A = Math.PI * 0.02 * 0.02, dPhi = (B(s.x) - B(x0)) * A; s.emf = dt > 0 ? -c.turns * (dPhi / (dt)) * 100 /* x in cm/s: dt in s => per s */ : 0; s.emf = -c.turns * A * (B(s.x) - B(x0)) / Math.max(dt, 1e-4); if (s.x > 12) s.x = -12; if (s.x < -12) s.x = 12; s.t += dt; s.fl.push([s.t, B(s.x) * A * c.turns * 1e3]); s.ef.push([s.t, s.emf]); if (s.fl.length > 260) { s.fl.shift(); s.ef.shift(); } },
    update(S, s, c, dt) {
      const o = S.objs, turns = clamp(Math.round(c.turns / 8), 3, 26), sig = `${turns}`; if (o.sig !== sig) { o.sig = sig; while (o.coilG.children.length) { const m = o.coilG.children.pop(); m.geometry.dispose(); } const pts = [], n = turns * 24; for (let i = 0; i <= n; i++) { const a = (i / 24) * TAU, x = -CL / 2 + (CL * i) / n; pts.push(V3(x, Math.cos(a) * CRAD, Math.sin(a) * CRAD)); } const hx = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), turns * 48, 0.07, 8, false), M.copper()); o.coilG.add(hx); o.coilG.position.set(0, 3.0, 0); }
      o.mag.position.x = s.x * UCM; o.mag.position.y = 3.0; const emf = s.emf; const scale = clamp(emf / (0.05 * 1 + Math.abs(emf) * 0 + 4), -1, 1); const full = 1.2; const defl = Math.tanh(emf / (0.6 + 0.002 * c.turns * c.strength * 30)) * 1.0; o.gal.set((emf >= 0 ? "+" : "") + eng(emf, "V"), emf >= 0 ? "#7dffa0" : "#ff9d8a");
      S.aim([0, 3.4, 0], 19, 0.0, 0.2);
    },
    overlay(ctx, s, c, w, h, S) {
      const emf = s.emf, B = c.strength * Math.exp(-Math.pow(s.x / SPREAD, 2)), A = Math.PI * 0.02 * 0.02; H.pill(ctx, 14, 26, "ε = − N dΦ/dt        Φ = B A cosθ", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `N = ${c.turns}     B(coil) = ${f1(B, 2)} T     Φ per turn = ${sci(B * A, 2)} Wb`, "#cfe0ff", 10);
      H.pill(ctx, 14, 70, `ε = ${eng(emf, "V")}   ${Math.abs(emf) < 1e-3 ? "(no flux change → no EMF)" : emf > 0 ? "(flux decreasing → induced field opposes the loss)" : "(flux increasing → induced field opposes the gain)"}`, Math.abs(emf) < 1e-3 ? "#9fb8d8" : "#8df0be", 9.5); H.pill(ctx, 14, 92, "faster magnet, more turns, stronger magnet → larger EMF; reverse direction → reverse sign (Lenz)", "#9fb8d8", 9.5);
      lab(ctx, S, V3(0, 5.6, 0), `coil: ${c.turns} turns`, "#ffd27a"); lab(ctx, S, V3(7, 4.0, 1.6), "galvanometer", "#cfe0ff");
      if (s.fl.length > 4) { const t0 = s.fl[0][0], t1 = s.fl[s.fl.length - 1][0], fmax = c.turns * c.strength * A * 1e3 * 1.05, ef = s.ef.map((p) => [p[0], p[1]]), emax = Math.max(0.05, ...ef.map((p) => Math.abs(p[1]))) * 1.1;
        H.graph(ctx, 14, h - 132, 200, 52, { series: [{ pts: s.fl, color: "#7fe3da", width: 1.6 }], xmin: t0, xmax: t1, ymin: 0, ymax: fmax, xl: "", yl: "NΦ (mWb)", ticksX: 0, ticksY: 2 }); H.graph(ctx, 14, h - 76, 200, 52, { series: [{ pts: ef, color: "#ffb703", width: 1.6 }], xmin: t0, xmax: t1, ymin: -emax, ymax: emax, xl: "time", yl: "ε (V)", ticksX: 0, ticksY: 2 }); }
    },
    readouts(s, c) { return [["Induced EMF", eng(s.emf || 0, "V")], ["Law", "ε = −N dΦ/dt"], ["Turns", `${c.turns}`], ["Magnet speed", `${c.speed} cm/s`]]; },
  };

  /* ================= TRANSFORMER ================= */
  S_["Transformer"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 14 }, cam: [[0, 6, 18], [0, 3.6, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); o.sig = ""; const lam = M.matte(0x6a7480, 0.35); o.coreMats = lam; const cx = 0, cy = 3.6;
      mk.box(8.6, 0.9, 1.6, lam, cx, cy + 3.15, 0); mk.box(8.6, 0.9, 1.6, lam, cx, cy - 3.15, 0); mk.box(0.9, 6.0, 1.6, lam, -3.85, cy, 0); mk.box(0.9, 6.0, 1.6, lam, 3.85, cy, 0); for (let i = 0; i < 14; i++) { mk.box(8.6, 0.01, 0.01, M.matte(0x222831, 0.6), cx, cy + 3.15 + 0.46, -0.78 + i * 0.12); }
      o.pc = new T.Group(); o.sc = new T.Group(); S.scene.add(o.pc, o.sc); o.pc.position.set(-3.85, cy, 0); o.sc.position.set(3.85, cy, 0); o.vp = E.meter(S, "Vp (AC)", 2.3); o.vp.position.set(-8.5, 2.0, 1.2); o.vs = E.meter(S, "Vs", 2.3); o.vs.position.set(8.4, 5.4, 1.2);
      o.bulb = mk.bulb(0xfff0c0, 8); o.bulb.position.set(8.4, 2.4, 0); o.bulb.scale.setScalar(1.6); o.stand = mk.cyl(0.4, 0.5, 0.3, M.matte(0x222222, 0.5), 8.4, 0.15, 0);
      o.flux = []; const loop = E.mkPath([V3(-3.85, cy - 3.15, 0), V3(3.85, cy - 3.15, 0), V3(3.85, cy + 3.15, 0), V3(-3.85, cy + 3.15, 0)], true); o.fp = loop; o.fm = []; for (let i = 0; i < 18; i++) { const m = new T.Mesh(new T.SphereGeometry(0.12, 10, 8), new T.MeshBasicMaterial({ color: 0x7fe3da, transparent: true, opacity: 0.9 })); S.scene.add(m); o.fm.push(m); }
      E.wires(S, [V3(-8.5, 3.0, 0), V3(-6.2, 3.0, 0), V3(-6.2, cy + 1.2 + 0.0, 0), V3(-4.7, cy + 1.2, 0)]); E.wires(S, [V3(-8.5, 1.1, 0), V3(-6.8, 1.1, 0), V3(-6.8, cy - 1.2, 0), V3(-4.7, cy - 1.2, 0)]); E.wires(S, [V3(4.7, cy + 1.2, 0), V3(6.4, cy + 1.2, 0), V3(6.4, 3.0, 0), V3(8.4, 3.0, 0)]); E.wires(S, [V3(4.7, cy - 1.2, 0), V3(6.0, cy - 1.2, 0), V3(6.0, 0.3, 0), V3(8.4, 0.3, 0), V3(8.4, 0.15, 0)]);
      o.blown = false;
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c, dt) {
      const o = S.objs, np = clamp(Math.round(c.np / 50), 1, 20), ns = clamp(Math.round(c.ns / 50), 1, 20), sig = `${np}|${ns}`; if (o.sig !== sig) { o.sig = sig; const mkc = (grp, n, col, cy) => { while (grp.children.length) { const m = grp.children.pop(); m.geometry.dispose(); } const pts = [], seg = 20, th = 5.0; for (let i = 0; i <= n * seg; i++) { const a = (i / seg) * TAU, y = -th / 2 + (th * i) / (n * seg); pts.push(V3(Math.cos(a) * 0.95, y, Math.sin(a) * 0.95)); } grp.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), n * seg * 2, 0.07, 6, false), M.copper())); }; mkc(o.pc, np); mkc(o.sc, ns); }
      const vs = c.vp * (c.ns / c.np), Vrms = vs, tt = S.t, ph = Math.sin(tt * 3.2), fl = ph; o.vp.set(`${c.vp} V`);
      const rated = 12, k = vs / rated; o.blown = k > 2.4; const br = o.blown ? 0 : clamp(k * k, 0, 1.6); o.bulb.setPower(br); o.br = br;
      o.fm.forEach((m, i) => { const u = (i / o.fm.length) * o.fp.len + tt * 1.6 * Math.sign(fl || 1) * Math.abs(fl) * 4, p = o.fp.pos(u); m.position.copy(p); m.material.opacity = 0.15 + 0.8 * Math.abs(fl); m.scale.setScalar(0.6 + 0.8 * Math.abs(fl)); }); o.vs.set(o.blown ? "BLOWN!" : `${f1(vs, 1)} V`, o.blown ? "#ff7a6a" : vs > c.vp ? "#ffd27a" : "#7dffa0"); o.vsv = vs;
      S.aim([0, 3.6, 0], 22, 0.0, 0.12);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, vs = o.vsv, step = c.ns > c.np; H.pill(ctx, 14, 26, "Vs / Vp = Ns / Np = Ip / Is        (ideal: Vp·Ip = Vs·Is)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `Vs = ${c.vp} × ${c.ns}/${c.np} = ${f1(vs, 1)} V      turns ratio Ns/Np = ${f1(c.ns / c.np, 2)}`, "#8df0be", 10.5);
      const Rl = 100, Is = vs / Rl, Ip = (Is * vs) / c.vp; H.pill(ctx, 14, 70, `${step ? "STEP-UP" : c.ns === c.np ? "1 : 1" : "STEP-DOWN"} transformer:  with a 100 Ω load, Is = ${f1(Is, 2)} A, Ip = ${f1(Ip, 2)} A  (power ${f1(vs * Is, 0)} W)`, "#cfe0ff", 9.5);
      H.pill(ctx, 14, 92, o.blown ? "Vs far above the 12 V lamp rating → filament burns out!" : "changing flux in the laminated iron core induces the secondary EMF (a.c. only)", o.blown ? "#ff9d8a" : "#9fb8d8", 9.5);
      lab(ctx, S, V3(-3.85, 0.2, 1.0), `primary Np = ${c.np}`, "#ffb703"); lab(ctx, S, V3(3.85, 0.2, 1.0), `secondary Ns = ${c.ns}`, "#7fe3da"); lab(ctx, S, V3(0, 3.6, 1.0), "laminated iron core: Φ alternates", "#9fb8d8"); lab(ctx, S, V3(-8.5, 0.4, 1.2), "a.c. input", "#cfe0ff"); lab(ctx, S, V3(8.4, 0.9, 0.6), "12 V lamp", "#ffd27a");
    },
    readouts(s, c) { const vs = c.vp * (c.ns / c.np); return [["Secondary voltage", `${f1(vs, 1)} V`], ["Turns ratio", `${f1(c.ns / c.np, 2)}`], ["Type", vs > c.vp ? "Step-up" : vs === c.vp ? "1 : 1" : "Step-down"], ["Current ratio Ip/Is", `${f1(c.ns / c.np, 2)}`]]; },
  };

  /* ================= A.C. VOLTAGE & CURRENT ================= */
  S_["A.C. Voltage & Current"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 14 }, cam: [[0, 7, 19], [0, 3.6, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); s.t = 0; const cy = 3.6;
      o.n = new T.Mesh(new T.BoxGeometry(1.2, 3.0, 3.4), M.paint(0xd0322a)); o.n.position.set(-3.6, cy, 0); o.sp = new T.Mesh(new T.BoxGeometry(1.2, 3.0, 3.4), M.paint(0x2a58c8)); o.sp.position.set(-0.4, cy, 0); S.scene.add(o.n, o.sp);
      mk.box(0.4, 0.2, 3.6, M.steel(), -2.0, cy - 2.0, 0); o.loop = new T.Group(); o.loop.position.set(-2.0, cy, 0); S.scene.add(o.loop); const cm = M.copper(); [[0, 1.1], [0, -1.1]].forEach(([_, z]) => { const r = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 2.6, 10), cm); r.rotation.z = Math.PI / 2; r.position.set(0, 0, 0); }); const mkr = (a, b) => { const m = S.mk.rod(a, b, 0.06, cm, 10); S.scene.remove(m); o.loop.add(m); }; mkr(V3(0, 1.0, 1.0), V3(0, 1.0, -1.0)); mkr(V3(0, -1.0, 1.0), V3(0, -1.0, -1.0)); mkr(V3(0, 1.0, 1.0), V3(0, -1.0, 1.0)); mkr(V3(0, 1.0, -1.0), V3(0, -1.0, -1.0));
      const ax = S.mk.rod(V3(-1.6, 0, 0), V3(1.8, 0, 0), 0.05, M.steel(), 10); S.scene.remove(ax); o.loop.add(ax); o.ph = S.mk.arrow(0xffb703, 0.05, 0.18); o.ph2 = S.mk.arrow(0x7fe3da, 0.05, 0.18);
      mk.cyl(0.35, 0.35, 0.22, M.copper(), -0.3, cy, 0).rotation.z = Math.PI / 2; mk.cyl(0.35, 0.35, 0.22, M.copper(), 2.0, cy, 0).rotation.z = Math.PI / 2; o.disc = mk.cyl(2.6, 2.6, 0.06, M.matte(0x151a22, 0.5), 7.6, 6.2, -0.4); o.disc.rotation.x = Math.PI / 2;
      o.pE = mk.arrow(0xffb703, 0.07, 0.22); o.pI = mk.arrow(0x7fe3da, 0.07, 0.22); o.scr = mk.box(9.6, 4.4, 0.2, M.matte(0x05110a, 0.3), 4.3, 1.9, -1.0); o.E = W.curve(S, 160, 0.05, new T.MeshBasicMaterial({ color: 0xffb703 })); o.I = W.curve(S, 160, 0.05, new T.MeshBasicMaterial({ color: 0x7fe3da })); o.zero = mk.rod(V3(-0.3, 1.9, -0.85), V3(8.9, 1.9, -0.85), 0.012, M.glow(0xffffff, 0.35), 6); o.grid = [];
      for (let i = 0; i <= 8; i++) mk.rod(V3(-0.3 + i * 1.15, -0.2, -0.88), V3(-0.3 + i * 1.15, 4.0, -0.88), 0.006, M.glow(0x335533, 0.35), 4);
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t += dt; },
    update(S, s, c, dt) {
      const o = S.objs, om = TAU * c.freq, th = om * s.t, phi = (c.phase * Math.PI) / 180, cy = 3.6; o.loop.rotation.x = th;
      const pe = [], pi = [], x0 = -0.3, x1 = 8.9, y0 = 1.9, T0 = 3.0, A = 1.7; for (let i = 0; i <= 160; i++) { const x = x0 + ((x1 - x0) * i) / 160, tt = s.t - T0 * (1 - i / 160) * 1.0; pe.push(V3(x, y0 + A * Math.sin(om * tt), -0.8)); pi.push(V3(x, y0 + A * 0.7 * Math.sin(om * tt - phi), -0.8)); } o.E.setPts(pe); o.I.setPts(pi);
      const cxp = 7.6, cyp = 6.2, R = 2.0; S.setArrow(o.pE, V3(cxp, cyp, -0.3), V3(R * Math.cos(th), R * Math.sin(th), 0), 1); S.setArrow(o.pI, V3(cxp, cyp, -0.3), V3(R * 0.7 * Math.cos(th - phi), R * 0.7 * Math.sin(th - phi), 0), 1); S.setArrow(o.ph, V3(-2.0, cy, 0), V3(0, 1.4 * Math.cos(th), 1.4 * Math.sin(th)).multiplyScalar(0.0), 1); o.ph.visible = false; o.ph2.visible = false;
      S.aim([2.8, 3.8, 0], 23, 0.0, 0.14);
    },
    overlay(ctx, s, c, w, h, S) {
      const om = TAU * c.freq, phi = c.phase, E0 = 325, I0 = 5 * 0.7; H.pill(ctx, 14, 26, "E = E₀ sin ωt          I = I₀ sin(ωt − φ)          ω = 2πf", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `f = ${c.freq} Hz → T = ${f1(1 / c.freq, 2)} s     ω = ${f1(om, 2)} rad/s     φ = ${phi}°`, "#cfe0ff", 10.5);
      const th = om * s.t, e = Math.sin(th), i = Math.sin(th - (phi * Math.PI) / 180); H.pill(ctx, 14, 70, `now:  E = ${f1(e * 100, 0)} % of E₀    I = ${f1(i * 100, 0)} % of I₀     ${phi > 0 ? "I lags E (inductive)" : phi < 0 ? "I leads E (capacitive)" : "in phase (resistive)"}`, "#8df0be", 9.5); H.pill(ctx, 14, 92, "rotating coil cuts field lines: EMF ∝ sin ωt; phasors rotate anticlockwise at ω", "#9fb8d8", 9.5);
      lab(ctx, S, V3(7.6, 8.8, -0.3), "phasors", "#cfe0ff"); lab(ctx, S, V3(4.3, -0.4, -0.6), "oscilloscope: E (amber), I (cyan)", "#cfe0ff"); lab(ctx, S, V3(-2.0, 6.0, 0), "alternator coil", "#ffd27a"); lab(ctx, S, V3(7.6, 3.9, -0.3), `φ = ${phi}°`, "#9fb8d8");
    },
    readouts(s, c) { return [["Frequency", `${c.freq} Hz`], ["Phase lag φ", `${c.phase}°`], ["ω", `${f1(TAU * c.freq, 2)} rad/s`], ["Period T", `${f1(1 / c.freq, 2)} s`]]; },
  };

  /* ================= RESONANCE — REACTANCE vs FREQUENCY ================= */
  const RR = 10, VR = 10;
  S_["Resonance — Reactance vs Frequency"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 14 }, cam: [[0, 7, 19], [0, 3.4, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); s.t = 0; o.gen = E.supply(S); o.gen.position.set(-8, 3.4, 0); o.ind = new T.Group(); S.scene.add(o.ind); const hx = mk.helix(9, 0.55, 3.0, 0.07, M.copper()); S.scene.remove(hx); o.ind.add(hx); o.ind.position.set(-2.9, 6.6, 0); const cc = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 3.0, 14), M.steel()); cc.rotation.z = Math.PI / 2; o.ind.add(cc);
      o.cap = new T.Group(); S.scene.add(o.cap); const cb = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 2.0, 28), M.paint(0x1a4fa0)); cb.rotation.z = Math.PI / 2; o.cap.add(cb); const cs = new T.Mesh(new T.CylinderGeometry(0.705, 0.705, 0.3, 28), M.matte(0xdddddd, 0.4)); cs.rotation.z = Math.PI / 2; cs.position.x = -0.6; o.cap.add(cs); o.cap.position.set(2.4, 6.6, 0);
      o.bulb = mk.bulb(0xfff0c0, 8); o.bulb.position.set(7.3, 3.8, 0); o.bulb.scale.setScalar(1.6); o.am = E.meter(S, "AMMETER (rms)", 2.3); o.am.position.set(-4.5, 1.4, 0.3);
      E.wires(S, [V3(-8, 5.2, 0), V3(-8, 6.6, 0), V3(-4.5, 6.6, 0)]); E.wires(S, [V3(-1.4, 6.6, 0), V3(1.4, 6.6, 0)]); E.wires(S, [V3(3.4, 6.6, 0), V3(7.3, 6.6, 0), V3(7.3, 4.8, 0)]); E.wires(S, [V3(7.3, 3.0, 0), V3(7.3, 1.4, 0), V3(-3.3, 1.4, 0)]); E.wires(S, [V3(-5.7, 1.4, 0), V3(-8, 1.4, 0), V3(-8, 1.7, 0)]);
      o.path = E.mkPath([V3(-8, 5.2, 0), V3(-8, 6.6, 0), V3(7.3, 6.6, 0), V3(7.3, 1.4, 0), V3(-8, 1.4, 0), V3(-8, 1.7, 0)], true); o.car = E.carriers(S, o.path, 56);
      o.bars = [0xe0523a, 0x3a8be8, 0x2fb85a].map((col, i) => { const b = mk.box(1.0, 1, 1.0, M.matte(col, 0.35), -1.9 + i * 1.9, 0, 3.4); return b; }); o.bs = mk.box(7, 0.06, 2.0, M.matte(0x151a22, 0.5), 0, 0.02, 3.4);
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t += dt; },
    update(S, s, c, dt) {
      const o = S.objs, w = TAU * c.freq, XL = w * c.L, XC = 1 / (w * c.Cap * 1e-6), Xn = XL - XC, Z = Math.hypot(RR, Xn), I = VR / Z, Imax = VR / RR, f0 = 1 / (TAU * Math.sqrt(c.L * c.Cap * 1e-6)), br = Math.pow(I / Imax, 1.2);
      o.gen.set(`${c.freq} Hz`, "10 V a.c."); o.am.set(eng(I, "A")); o.bulb.setPower(br);
      const sc = (x) => (Math.log10(1 + x) / Math.log10(1 + 3400)) * 5.2, vals = [XL, XC, Math.abs(Xn)]; o.bars.forEach((b, i) => { const hgt = Math.max(0.05, sc(vals[i])); b.scale.y = hgt; b.position.y = hgt / 2 + 0.06; });
      const visf = 1.5, A = clamp(I / Imax, 0.02, 1) * 0.9 * Math.sin(S.t * 2 * Math.PI * visf); o.car.ph = A * 5.0; o.car.step(0, 0);
      o.XL = XL; o.XC = XC; o.Z = Z; o.I = I; o.f0 = f0; o.Imax = Imax; S.aim([0, 3.4, 0], 22, 0.0, 0.16);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs; H.pill(ctx, 14, 26, "X_L = 2πfL      X_C = 1/(2πfC)      resonance when X_L = X_C", "#ffd27a", 10); H.pill(ctx, 14, 48, `f₀ = 1/(2π√LC) = ${f1(o.f0, 1)} Hz      f = ${c.freq} Hz`, "#8df0be", 10.5);
      H.pill(ctx, 14, 70, `X_L = ${f1(o.XL, 1)} Ω     X_C = ${f1(o.XC, 1)} Ω     Z = √(R² + (X_L−X_C)²) = ${f1(o.Z, 1)} Ω  (R = 10 Ω)`, "#cfe0ff", 9.5); H.pill(ctx, 14, 92, Math.abs(o.XL - o.XC) < 0.05 * Math.max(o.XL, o.XC) ? `AT RESONANCE: Z = R, I = ${eng(o.I, "A")} is a maximum — lamp brightest` : `off resonance: I = ${eng(o.I, "A")} (max ${eng(o.Imax, "A")}) — lamp dims`, Math.abs(o.XL - o.XC) < 0.05 * Math.max(o.XL, o.XC) ? "#ffd27a" : "#9fb8d8", 9.5);
      lab(ctx, S, V3(-2.9, 5.2, 0), "inductor L", "#ff9d8a"); lab(ctx, S, V3(2.4, 5.2, 0), "capacitor C", "#7fb6ff"); lab(ctx, S, V3(-1.9, -0.5, 3.4), "X_L", "#ff9d8a"); lab(ctx, S, V3(0, -0.5, 3.4), "X_C", "#7fb6ff"); lab(ctx, S, V3(1.9, -0.5, 3.4), "|X_L−X_C|", "#7dffa0");
      const pi = [], pz = []; for (let f = 5; f <= 500; f += 3) { const XL = TAU * f * c.L, XC = 1 / (TAU * f * c.Cap * 1e-6); pi.push([f, VR / Math.hypot(RR, XL - XC)]); } H.graph(ctx, w - 214, h - 132, 200, 110, { series: [{ pts: pi, color: "#7fe3da", width: 2 }], xmin: 5, xmax: 500, ymin: 0, ymax: VR / RR * 1.05, xl: "f (Hz)", yl: "I (A)", dot: [c.freq, o.I, "#ffb703"], ticksX: 4, ticksY: 3 });
    },
    readouts(s, c) { const f0 = 1 / (TAU * Math.sqrt(c.L * c.Cap * 1e-6)), XL = TAU * c.freq * c.L, XC = 1 / (TAU * c.freq * c.Cap * 1e-6); return [["Resonant frequency f₀", `${f1(f0, 1)} Hz`], ["X_L at f", `${f1(XL, 1)} Ω`], ["X_C at f", `${f1(XC, 1)} Ω`], ["Current", eng(10 / Math.hypot(10, XL - XC), "A")]]; },
  };
})();
