/* p3d-elec.js — DC circuits on a lab bench: Ohm's law, RC charge/discharge, resistivity, series/parallel, internal resistance (three.js). */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready) return;
  const T = window.THREE, { V3, TAU } = P.util, M = P.mat, H = P.hud, S_ = P.scenes;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const SUPS = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  const sci = (v, d = 2) => { if (!v) return "0"; const e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e); return `${(+m.toFixed(d)).toString()}×10${String(e).replace(/./g, (ch) => SUPS[ch])}`; };
  const eng = (v, u) => { const a = Math.abs(v); if (a >= 1) return `${f1(v, a >= 100 ? 0 : a >= 10 ? 1 : 2)} ${u}`; if (a >= 1e-3) return `${f1(v * 1e3, a * 1e3 >= 100 ? 0 : a * 1e3 >= 10 ? 1 : 2)} m${u}`; return `${f1(v * 1e6, 1)} µ${u}`; };

  /* ---------- shared bench components ---------- */
  function mkPath(pts, closed) { const p = pts.slice(); if (closed) p.push(pts[0].clone()); const cum = [0]; for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + p[i].distanceTo(p[i - 1])); const len = cum[cum.length - 1], tmp = V3();
    return { pts: p, len, pos(u) { u = ((u % len) + len) % len; let i = 1; while (i < cum.length - 1 && cum[i] < u) i++; const t = (u - cum[i - 1]) / Math.max(cum[i] - cum[i - 1], 1e-9); return tmp.lerpVectors(p[i - 1], p[i], t); } }; }
  function carriers(S, path, n, col) { const im = S.mk.particles(n, 0.15, new T.MeshBasicMaterial({ color: col || 0xffe27a })); im.frustumCulled = false; return { im, path, n, ph: Math.random() * 10, step(dt, speed) { this.ph += speed * dt; for (let i = 0; i < n; i++) { const u = (i / n) * path.len + this.ph, p = path.pos(u); im.set(i, p.x, p.y, p.z, 1); } im.instanceMatrix.needsUpdate = true; } }; }
  const wire = (S, a, b, r) => S.mk.rod(a, b, r || 0.1, M.copper(), 10);
  function wires(S, pts, r) { const out = []; for (let i = 0; i < pts.length - 1; i++) out.push(wire(S, pts[i], pts[i + 1], r)); pts.forEach((p, i) => { if (i && i < pts.length - 1) S.mk.sphere((r || 0.1) * 1.05, M.copper(), p.x, p.y, p.z); }); return out; }
  function lead(S, a, b, lift, col) { const m = a.clone().add(b).multiplyScalar(0.5); m.y += lift; const cur = new T.QuadraticBezierCurve3(a, m, b), mesh = new T.Mesh(new T.TubeGeometry(cur, 24, 0.045, 6, false), M.matte(col || 0x222222, 0.5)); S.scene.add(mesh); return mesh; }
  function meter(S, title, w) { w = w || 2.3; const g = new T.Group(), body = new T.Mesh(new T.BoxGeometry(w, 1.7, 0.9), M.paint(0x2b2f38)); body.castShadow = true; g.add(body); const cv = document.createElement("canvas"); cv.width = 256; cv.height = 112; const cx = cv.getContext("2d"), tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
    const face = new T.Mesh(new T.PlaneGeometry(w - 0.3, 1.2), new T.MeshBasicMaterial({ map: tex, toneMapped: false })); face.position.set(0, 0.08, 0.46); g.add(face);
    g.set = (txt, col) => { const k = txt + (col || ""); if (g.last === k) return; g.last = k; cx.fillStyle = "#06120a"; cx.fillRect(0, 0, 256, 112); cx.fillStyle = col || "#7dffa0"; cx.font = "bold 52px monospace"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.fillText(txt, 128, 46); cx.font = "bold 20px sans-serif"; cx.fillStyle = "#9fb8c4"; cx.fillText(title, 128, 92); tex.needsUpdate = true; }; S.scene.add(g); return g; }
  function supply(S) { const g = new T.Group(), body = new T.Mesh(new T.BoxGeometry(2.6, 3.4, 1.4), M.paint(0x30343e)); body.castShadow = true; g.add(body); const cv = document.createElement("canvas"); cv.width = 256; cv.height = 128; const cx = cv.getContext("2d"), tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
    const face = new T.Mesh(new T.PlaneGeometry(2.2, 1.1), new T.MeshBasicMaterial({ map: tex, toneMapped: false })); face.position.set(0, 0.6, 0.71); g.add(face); const knob = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 0.25, 24), M.chrome()); knob.rotation.x = Math.PI / 2; knob.position.set(0, -0.8, 0.8); g.add(knob); const ind = new T.Mesh(new T.BoxGeometry(0.05, 0.3, 0.05), M.matte(0x111111, 0.4)); ind.position.set(0, -0.68, 0.93); g.add(ind);
    const tp = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.2, 14), M.matte(0xd02a2a, 0.4)), tm = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.2, 14), M.matte(0x111111, 0.4)); tp.position.set(0, 1.78, 0); tm.position.set(0, -1.78, 0); g.add(tp, tm);
    g.set = (txt, sub) => { const k = txt + sub; if (g.last === k) return; g.last = k; cx.fillStyle = "#06120a"; cx.fillRect(0, 0, 256, 128); cx.fillStyle = "#ffd27a"; cx.font = "bold 64px monospace"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.fillText(txt, 128, 54); cx.font = "bold 22px sans-serif"; cx.fillStyle = "#9fb8c4"; cx.fillText(sub || "DC SUPPLY", 128, 106); tex.needsUpdate = true; }; S.scene.add(g); return g; }
  const CODE = [0x111111, 0x7a3b12, 0xd02a2a, 0xf08a1c, 0xf0d21c, 0x2fa84a, 0x2f6fd8, 0x8a3ad8, 0x8a8f98, 0xf4f4f4];
  function resistor(S, len) { len = len || 3.4; const g = new T.Group(), bg = new T.CylinderGeometry(0.42, 0.42, len * 0.7, 28); bg.rotateZ(Math.PI / 2); const body = new T.Mesh(bg, new T.MeshStandardMaterial({ color: 0xd9c79c, roughness: 0.55, emissive: 0x000000 })); body.castShadow = true; g.add(body);
    [-1, 1].forEach((s) => { const cap = new T.Mesh(new T.SphereGeometry(0.42, 20, 14), body.material); cap.scale.set(0.5, 1, 1); cap.position.x = s * len * 0.35; g.add(cap); });
    const bands = [-0.5, -0.28, -0.06, 0.4].map((k) => { const bgm = new T.CylinderGeometry(0.435, 0.435, 0.13, 28); bgm.rotateZ(Math.PI / 2); const b = new T.Mesh(bgm, new T.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 })); b.position.x = k * len * 0.62; g.add(b); return b; });
    g.set = (R, heat) => { let e = Math.floor(Math.log10(Math.max(R, 1e-3))), m = e - 1, d = Math.round(R / Math.pow(10, m)); if (d >= 100) { d = 10; m += 1; } const d1 = Math.floor(d / 10) % 10, d2 = d % 10; bands[0].material.color.setHex(CODE[d1]); bands[1].material.color.setHex(CODE[d2]); bands[2].material.color.setHex(m >= 0 && m <= 9 ? CODE[m] : m === -1 ? 0xd4af37 : 0xc0c0c0); bands[3].material.color.setHex(0xd4af37); body.material.emissive.setHex(0xff3a00); body.material.emissiveIntensity = clamp(heat || 0, 0, 1.2); };
    S.scene.add(g); return g; }
  const bench = (S) => S.mk.box(30, 0.3, 11, M.wood(), 0, -0.15, 0);
  const lab = (ctx, S, p, t, col, al) => { const q = S.proj(p); H.pill(ctx, q.x, q.y, t, col, 10, al || "center"); };

  /* ================= OHM'S LAW & CIRCUIT ================= */
  S_["Ohm's Law & Circuit"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[0, 5, 21], [0, 4, 0]], fov: 36,
    build(S, s, c) {
      const o = S.objs; bench(S); o.sup = supply(S); o.sup.position.set(-7, 4.1, 0); o.res = resistor(S); o.res.position.set(0, 6.8, 0); o.am = meter(S, "AMMETER"); o.am.position.set(7, 4.1, 0); o.vm = meter(S, "VOLTMETER"); o.vm.position.set(0, 3.9, 0);
      wires(S, [V3(-7, 5.8, 0), V3(-7, 6.8, 0), V3(-1.8, 6.8, 0)]); wires(S, [V3(1.8, 6.8, 0), V3(7, 6.8, 0), V3(7, 4.95, 0)]); wires(S, [V3(7, 3.25, 0), V3(7, 1.4, 0), V3(-7, 1.4, 0), V3(-7, 2.4, 0)]); lead(S, V3(-1.8, 6.55, 0.2), V3(-0.7, 4.7, 0.3), 0.4, 0xc0392b); lead(S, V3(1.8, 6.55, 0.2), V3(0.7, 4.7, 0.3), 0.4, 0x111111);
      o.path = mkPath([V3(-7, 5.8, 0), V3(-7, 6.8, 0), V3(7, 6.8, 0), V3(7, 1.4, 0), V3(-7, 1.4, 0), V3(-7, 2.4, 0)], true); o.car = carriers(S, o.path, 64);
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c, dt) { const o = S.objs, I = c.voltage / c.resistance, Pw = I * c.voltage; o.sup.set(`${f1(c.voltage, 1)} V`, "DC SUPPLY"); o.am.set(`${f1(I, 2)} A`); o.vm.set(`${f1(c.voltage, 1)} V`); o.res.set(c.resistance, Pw / 70); o.car.step(dt || 0.016, clamp(I * 0.9, 0, 9)); o.I = I; S.aim([0, 5.3, 0], 24, 0.0, 0.12); },
    overlay(ctx, s, c, w, h, S) {
      const I = c.voltage / c.resistance, Pw = I * c.voltage; H.pill(ctx, 14, 26, "V = I · R          P = I·V = I²R = V²/R", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `I = V/R = ${f1(c.voltage, 1)} V / ${c.resistance} Ω = ${f1(I, 3)} A`, "#8df0be", 10.5); H.pill(ctx, 14, 70, `P = I·V = ${f1(Pw, Pw < 10 ? 2 : 1)} W   (heat in resistor; glows as P rises)`, "#cfe0ff", 10); H.pill(ctx, 14, 92, "dots = conventional current (+ → −); speed ∝ I.   Resistor colour code shows R", "#9fb8d8", 9.5);
      lab(ctx, S, V3(2.9, 7.5, 0.5), `R = ${c.resistance} Ω`, "#ffd27a", "left"); lab(ctx, S, V3(-7, 6.1, 0.9), "+", "#ff8a7a"); lab(ctx, S, V3(7, 5.9, 0.6), "A in series", "#9fe0ff"); lab(ctx, S, V3(0, 2.7, 0.8), "V in parallel", "#9fe0ff");
      H.graph(ctx, w - 202, h - 126, 188, 104, { series: [{ pts: [[0, 0], [20, 20 / c.resistance]], color: "#7fe3da", width: 2 }], xmin: 0, xmax: 20, ymin: 0, ymax: 20 / c.resistance * 1.02, xl: "V (volts)", yl: "I (A)", dot: [c.voltage, I, "#ffb703"], ticksX: 4, ticksY: 3 });
    },
    readouts(s, c) { const I = c.voltage / c.resistance; return [["Current", `${f1(I, 3)} A`], ["Power", `${f1(I * c.voltage, 2)} W`], ["Law", "V = I·R"]]; },
  };

  /* ================= CAPACITOR CHARGE / DISCHARGE ================= */
  const CX = 7.0, CT = 4.9, CB = 3.0;
  S_["Capacitor Charge/Discharge"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[0, 5, 22], [0, 4, 0]], fov: 36,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; s.x = 0; s.hold = 0; s.mode = -1; bench(S); o.sup = supply(S); o.sup.position.set(-8.8, 4.1, 0); o.res = resistor(S); o.res.position.set(-1.0, 6.6, 0); o.am = meter(S, "AMMETER"); o.am.position.set(1.8, 1.4, 0); o.vm = meter(S, "V across C"); o.vm.position.set(3.0, 4.0, 1.6);
      wires(S, [V3(-8.8, 5.8, 0), V3(-8.8, 6.6, 0), V3(-6.9, 6.6, 0)]); wires(S, [V3(-5.7, 6.6, 0), V3(-2.7, 6.6, 0)]); wires(S, [V3(0.7, 6.6, 0), V3(CX, 6.6, 0), V3(CX, CT + 0.08, 0)]); wires(S, [V3(CX, CB - 0.08, 0), V3(CX, 1.4, 0), V3(3.1, 1.4, 0)]); wires(S, [V3(0.5, 1.4, 0), V3(-8.8, 1.4, 0), V3(-8.8, 2.4, 0)]);
      wires(S, [V3(-4.6, 6.6, 0), V3(-4.6, 4.9, 0)]); wires(S, [V3(-4.6, 3.1, 0), V3(-4.6, 1.4, 0)]);
      const pm = M.chrome(); o.pT = mk.box(3.6, 0.16, 2.0, pm, CX, CT + 0.08, 0); o.pB = mk.box(3.6, 0.16, 2.0, pm, CX, CB - 0.08, 0); o.die = mk.box(3.4, CT - CB - 0.16, 1.8, new T.MeshPhysicalMaterial({ color: 0xffd27a, transparent: true, opacity: 0.22, roughness: 0.2, depthWrite: false }), CX, (CT + CB) / 2, 0);
      const sw = (x, y) => { const g = new T.Group(), b1 = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.2, 12), M.chrome()), b2 = b1.clone(); b1.rotation.x = b2.rotation.x = Math.PI / 2; b1.position.x = -0.5; b2.position.x = 0.5; const lv = new T.Mesh(new T.BoxGeometry(1.1, 0.07, 0.07), M.chrome()); lv.position.x = 0.55; const pv = new T.Group(); pv.position.x = -0.5; pv.add(lv); g.add(b1, b2, pv); g.pv = pv; g.position.set(x, y, 0); S.scene.add(g); return g; };
      o.s1 = sw(-6.3, 6.6); o.s2 = sw(-4.6, 4.0); o.s2.rotation.z = -Math.PI / 2; o.s2.position.x = -4.6;
      o.qp = []; o.qn = []; for (let i = 0; i < 36; i++) { const x = CX - 1.5 + (i % 9) * 0.375, z = -0.7 + Math.floor(i / 9) * 0.47; const a = mk.sphere(0.075, M.emissive(0xff4a3a, 1.8), x, CT - 0.12, z), b = mk.sphere(0.075, M.emissive(0x4a9aff, 1.8), x, CB + 0.12, z); a.visible = b.visible = false; o.qp.push(a); o.qn.push(b); }
      o.ar = [0, 1, 2, 3, 4].map((i) => mk.arrow(0xffe27a, 0.04, 0.14)); o.loopCh = mkPath([V3(-8.8, 5.8, 0), V3(-8.8, 6.6, 0), V3(CX, 6.6, 0), V3(CX, CT, 0), V3(CX, CB, 0), V3(CX, 1.4, 0), V3(-8.8, 1.4, 0), V3(-8.8, 2.4, 0)], true); o.loopDis = mkPath([V3(-4.6, 6.6, 0), V3(CX, 6.6, 0), V3(CX, CT, 0), V3(CX, CB, 0), V3(CX, 1.4, 0), V3(-4.6, 1.4, 0)], true); o.cA = carriers(S, o.loopCh, 54); o.cB = carriers(S, o.loopDis, 54); o.lead1 = lead(S, V3(3.9, 4.5, 1.6), V3(CX - 1.8, CT + 0.1, 1.0), 0.5, 0xc0392b); o.lead2 = lead(S, V3(3.9, 3.5, 1.6), V3(CX - 1.8, CB - 0.1, 1.0), 0.0, 0x111111);
    },
    reset(s, c) { s.x = 0; },
    step(s, c, dt) { if (s.mode !== c.mode) { s.mode = c.mode; s.x = 0; s.hold = 0; } if (s.hold > 0) { s.hold -= dt; if (s.hold <= 0) s.x = 0; return; } s.x += dt * 0.62; if (s.x > 5.3) { s.hold = 1.2; } },
    update(S, s, c, dt) {
      const o = S.objs, tau = c.resistance * c.capacitance * 1e-6, x = Math.min(s.x, 5.3), ch = c.mode === 0, q = ch ? 1 - Math.exp(-x) : Math.exp(-x), Vc = c.voltage * q, I = (c.voltage / c.resistance) * Math.exp(-x);
      o.sup.set(`${f1(c.voltage, 0)} V`, ch ? "CONNECTED" : "DISCONNECTED"); o.res.set(c.resistance, 0); o.am.set(eng(I, "A")); o.vm.set(`${f1(Vc, 2)} V`); o.s1.pv.rotation.z = ch ? 0 : 0.9; o.s2.pv.rotation.z = ch ? 0.9 : 0.0; o.s2.pv.rotation.z = ch ? -0.9 : 0;
      const n = Math.round(36 * q); o.qp.forEach((m, i) => (m.visible = i < n)); o.qn.forEach((m, i) => (m.visible = i < n)); o.ar.forEach((a, i) => { a.visible = q > 0.05; S.setArrow(a, V3(CX - 1.4 + i * 0.7, CT - 0.2, 0.0), V3(0, -(CT - CB - 0.5) * (0.35 + 0.65 * q), 0), 1); });
      const spd = clamp(I / (c.voltage / c.resistance) * 4.5, 0, 6) * (ch ? 1 : -1) * (I > 1e-4 ? 1 : 0); o.cA.im.visible = ch; o.cB.im.visible = !ch; (ch ? o.cA : o.cB).step(dt || 0.016, ch ? spd : -spd * -1 * 1); (ch ? o.cA : o.cB).ph += 0; o.q = q; o.Vc = Vc; o.I = I; o.x = x; o.tau = tau; S.aim([0, 5.0, 0], 25, 0.0, 0.12);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, ch = c.mode === 0, tau = o.tau, t = o.x * tau, Q = c.capacitance * 1e-6 * o.Vc; H.pill(ctx, 14, 26, "Q = CV     τ = RC     V(t) = V₀(1 − e^(−t/τ))  [charging]   V₀e^(−t/τ) [discharging]", "#ffd27a", 9.5); H.pill(ctx, 14, 48, `τ = RC = ${c.resistance} Ω × ${c.capacitance} µF = ${eng(tau, "s")}     t = ${eng(t, "s")} (${f1(o.x, 1)} τ)`, "#cfe0ff", 10);
      H.pill(ctx, 14, 70, `V_C = ${f1(o.Vc, 2)} V   (${f1(o.q * 100, 0)} % of ${c.voltage} V)     Q = CV = ${eng(Q, "C")}`, "#8df0be", 10); H.pill(ctx, 14, 92, `I = (V/R)e^(−t/τ) = ${eng(o.I, "A")}   — current falls as the capacitor fills`, "#9fb8d8", 9.5);
      lab(ctx, S, V3(CX, 7.6, 0), ch ? "+ plate" : "+ plate (discharging)", "#ff8a7a"); lab(ctx, S, V3(CX - 2.3, CB - 0.6, 0), "− plate", "#7fb6ff", "right"); lab(ctx, S, V3(CX + 2.9, 4.0, 0), "E-field", "#ffe27a", "left"); lab(ctx, S, V3(-6.3, 7.6, 0), "S₁", "#cfe0ff"); lab(ctx, S, V3(-4.0, 4.0, 0), "S₂", "#cfe0ff", "left");
      const pv = [], pi = []; for (let x = 0; x <= 5.3; x += 0.1) { const q2 = ch ? 1 - Math.exp(-x) : Math.exp(-x); pv.push([x, q2]); pi.push([x, Math.exp(-x)]); }
      H.graph(ctx, w - 214, h - 132, 200, 110, { series: [{ pts: pv, color: "#7fe3da", width: 2 }, { pts: pi, color: "#ffb703", width: 1.5 }], xmin: 0, xmax: 5, ymin: 0, ymax: 1.05, xl: "t / τ   (cyan V/V₀, amber I/I₀)", yl: "", dot: [Math.min(o.x, 5), o.q, "#fff"], ticksX: 5, ticksY: 2 });
    },
    readouts(s, c) { const tau = c.resistance * c.capacitance * 1e-6; return [["Time constant τ", `${eng(tau, "s")}`], ["At t = τ", c.mode === 0 ? "63 % charged" : "37 % remains"], ["Full (5τ)", `${eng(5 * tau, "s")}`], ["Charge at V", `${eng(c.capacitance * 1e-6 * c.voltage, "C")}`]]; },
  };

  /* ================= RESISTIVITY ================= */
  const RMAT = (rho) => { const t = clamp(Math.log10(rho) / 2, 0, 1); return new T.Color(0xb87333).lerp(new T.Color(0x8c919a), clamp(t * 2, 0, 1)).lerp(new T.Color(0x3d3d44), clamp(t * 2 - 1, 0, 1)); };
  S_["Resistivity"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[0, 6, 22], [0, 3, 0]], fov: 36,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); const wm = new T.MeshPhysicalMaterial({ color: 0xb87333, metalness: 1, roughness: 0.28, clearcoat: 0.3 }); o.w = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 40), wm); o.w.castShadow = true; S.scene.add(o.w); o.disc = new T.Mesh(new T.CylinderGeometry(1, 1, 0.04, 40), new T.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9 })); S.scene.add(o.disc);
      o.ref = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 24), new T.MeshBasicMaterial({ color: 0x9fb8d8, wireframe: true, transparent: true, opacity: 0.35 })); S.scene.add(o.ref); o.om = meter(S, "OHMMETER", 3.0); o.om.position.set(5.5, 5.1, 2.6);
      o.l1 = lead(S, V3(-7, 1.4, 0.5), V3(4.7, 4.5, 2.6), 1.0, 0xc0392b); o.l2 = lead(S, V3(0, 1.4, 0.5), V3(6.3, 4.5, 2.6), 0.5, 0x111111);
      /* microscopic lattice panel */
      o.mic = new T.Group(); o.mic.position.set(-3.5, 6.4, 0); S.scene.add(o.mic); const fr = new T.Mesh(new T.BoxGeometry(8.4, 3.2, 2.4), new T.MeshPhysicalMaterial({ color: 0x9fb8d8, transparent: true, opacity: 0.1, depthWrite: false })); o.mic.add(fr); o.mic.add(new T.LineSegments(new T.EdgesGeometry(fr.geometry), new T.LineBasicMaterial({ color: 0x9fb8d8, transparent: true, opacity: 0.6 })));
      o.ions = new T.InstancedMesh(new T.SphereGeometry(1, 16, 12), M.metal ? M.steel() : M.chrome(), 5 * 3 * 3); o.mic.add(o.ions); let k = 0; o.ionP = []; for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) for (let l = 0; l < 3; l++) { o.ionP.push(V3(-3.2 + i * 1.6, -1.0 + j * 1.0, -0.8 + l * 0.8)); }
      o.el = mk.particles(26, 0.12, M.emissive(0x6fc0ff, 2)); S.scene.remove(o.el); o.mic.add(o.el); o.ev = []; for (let i = 0; i < 26; i++) o.ev.push({ p: V3(-4 + Math.random() * 8, -1.3 + Math.random() * 2.6, -1 + Math.random() * 2), v: V3(1 + Math.random() * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4) });
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c, dt) {
      const o = S.objs, L = c.length, A = c.area, rho = c.rho * 1e-8, R = (rho * L) / (A * 1e-6), Lu = L * 2.2, ru = 0.2 * Math.sqrt(A), x0 = -7;
      o.w.scale.set(ru, Lu, ru); o.w.rotation.z = Math.PI / 2; o.w.position.set(x0 + Lu / 2, 1.4, 0); o.w.material.color.copy(RMAT(c.rho)); o.w.material.roughness = 0.25 + 0.4 * clamp(Math.log10(c.rho) / 2, 0, 1); o.disc.scale.set(ru * 1.04, 1, ru * 1.04); o.disc.rotation.z = Math.PI / 2; o.disc.position.set(x0 + Lu + 0.02, 1.4, 0);
      const Lr = 2 * 2.2, rr = 0.2; o.ref.scale.set(rr, Lr, rr); o.ref.rotation.z = Math.PI / 2; o.ref.position.set(x0 + Lr / 2, 1.4, 0);
      o.om.set(R < 1 ? `${f1(R * 1e3, 1)} mΩ` : R < 1e3 ? `${f1(R, 2)} Ω` : `${f1(R / 1e3, 2)} kΩ`);
      const sc = 0.2 + 0.05 * Math.cbrt(c.rho), dt2 = Math.min(dt || 0.016, 0.05), pc = clamp(0.015 + c.rho * 0.004, 0.02, 0.5);
      for (let i = 0; i < o.ionP.length; i++) { const p = o.ionP[i], jig = 0.04 + 0.002 * c.rho, m = new T.Matrix4().makeScale(sc, sc, sc); m.setPosition(p.x + Math.sin(S.t * 9 + i) * jig, p.y + Math.cos(S.t * 7 + i * 2) * jig, p.z); o.ions.setMatrixAt(i, m); } o.ions.instanceMatrix.needsUpdate = true;
      o.ev.forEach((e, i) => { if (Math.random() < pc * dt2 * 60 * 0.3) { e.v.set(0.6 + Math.random() * 0.6, (Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 2.4); } e.p.addScaledVector(e.v, dt2 * 1.4); if (e.p.x > 4.1) e.p.x = -4.1; if (Math.abs(e.p.y) > 1.4) e.v.y *= -1; if (Math.abs(e.p.z) > 1.1) e.v.z *= -1; o.el.set(i, e.p.x, e.p.y, e.p.z, 1); }); o.el.instanceMatrix.needsUpdate = true; o.R = R; o.Lu = Lu; o.x0 = x0; o.ru = ru;
      S.aim([-0.5, 4.6, 0], 24, 0.0, 0.18);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, rho = c.rho * 1e-8, R = o.R; H.pill(ctx, 14, 26, "R = ρ L / A", "#ffd27a", 11); H.pill(ctx, 14, 48, `R = ${sci(rho)} × ${c.length} m / ${c.area}×10⁻⁶ m² = ${R < 1 ? f1(R * 1e3, 2) + " mΩ" : f1(R, 3) + " Ω"}`, "#8df0be", 10.5);
      H.pill(ctx, 14, 70, "R ∝ L (doubling length doubles R);  R ∝ 1/A (thicker wire → lower R)", "#cfe0ff", 9.5); H.pill(ctx, 14, 92, "higher ρ → ions scatter electrons more often → larger R.  ghost wire = ρ 17, 2 m, 1 mm²", "#9fb8d8", 9.5);
      lab(ctx, S, V3(o.x0 + o.Lu / 2, 0.15, 1.0), `L = ${c.length} m`, "#9fe0ff"); lab(ctx, S, V3(o.x0 + o.Lu + 0.6, 2.4 + o.ru, 0.5), `A = ${c.area} mm²`, "#ffd27a", "left"); lab(ctx, S, V3(-3.5, 4.6, 1.3), "inside the wire (magnified)", "#9fb8d8"); lab(ctx, S, V3(5.5, 6.4, 2.6), "R reading", "#cfe0ff");
    },
    readouts(s, c) { const R = (c.rho * 1e-8 * c.length) / (c.area * 1e-6); return [["Resistance", R < 1 ? `${f1(R * 1e3, 2)} mΩ` : `${f1(R, 3)} Ω`], ["ρ", `${c.rho}×10⁻⁸ Ω·m`], ["Length", `${c.length} m`], ["Area", `${c.area} mm²`]]; },
  };

  /* ================= SERIES & PARALLEL RESISTORS ================= */
  const VS = 12;
  S_["Series & Parallel Resistors"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[0, 5, 22], [0, 4.3, 0]], fov: 36,
    build(S, s, c) {
      const o = S.objs; bench(S); o.sup = supply(S); o.sup.position.set(-8, 4.1, 0); o.sup.set(`${VS} V`, "DC SUPPLY");
      o.sg = new T.Group(); o.pg = new T.Group(); S.scene.add(o.sg, o.pg);
      /* series */ { const take = (m) => { S.scene.remove(m); o.sg.add(m); return m; }; o.r1s = resistor(S); o.r2s = resistor(S); [o.r1s, o.r2s].forEach(take); o.r1s.position.set(-2.8, 6.8, 0); o.r2s.position.set(2.8, 6.8, 0); o.vm1 = take(meter(S, "V₁")); o.vm2 = take(meter(S, "V₂")); o.vm1.position.set(-2.8, 9.6, 0); o.vm2.position.set(2.8, 9.6, 0); o.ams = take(meter(S, "I")); o.ams.position.set(8, 4.1, 0);
        const m0 = S.scene.children.length; wires(S, [V3(-8, 5.8, 0), V3(-8, 6.8, 0), V3(-4.5, 6.8, 0)]); wires(S, [V3(-1.1, 6.8, 0), V3(1.1, 6.8, 0)]); wires(S, [V3(4.5, 6.8, 0), V3(8, 6.8, 0), V3(8, 4.95, 0)]); wires(S, [V3(8, 3.25, 0), V3(8, 1.4, 0), V3(-8, 1.4, 0), V3(-8, 2.4, 0)]); [[-4.5, -1.1], [1.1, 4.5]].forEach(([a, b], i) => { lead(S, V3(a, 7.1, 0.3), V3(i ? 2.3 : -3.3, 8.7, 0.3), 0.4, 0xc0392b); lead(S, V3(b, 7.1, 0.3), V3(i ? 3.3 : -2.3, 8.7, 0.3), 0.4, 0x111111); });
        while (S.scene.children.length > m0) o.sg.add(S.scene.children[m0]); o.ps = mkPath([V3(-8, 5.8, 0), V3(-8, 6.8, 0), V3(8, 6.8, 0), V3(8, 1.4, 0), V3(-8, 1.4, 0), V3(-8, 2.4, 0)], true); o.cs = carriers(S, o.ps, 64); }
      /* parallel */ { const take = (m) => { S.scene.remove(m); o.pg.add(m); return m; }; o.r1p = resistor(S); o.r2p = resistor(S); [o.r1p, o.r2p].forEach((r) => { take(r); r.rotation.z = Math.PI / 2; }); o.r1p.position.set(-2.8, 4.9, 0); o.r2p.position.set(2.8, 4.9, 0); o.a1 = take(meter(S, "I₁")); o.a2 = take(meter(S, "I₂")); o.at = take(meter(S, "I total")); o.a1.position.set(-2.8, 2.35, 0); o.a2.position.set(2.8, 2.35, 0); o.at.position.set(8, 4.1, 0);
        const m0 = S.scene.children.length; wires(S, [V3(-8, 5.8, 0), V3(-8, 7.2, 0), V3(8, 7.2, 0), V3(8, 4.95, 0)]); wires(S, [V3(8, 3.25, 0), V3(8, 0.9, 0), V3(-8, 0.9, 0), V3(-8, 2.4, 0)]); [-2.8, 2.8].forEach((x) => { wires(S, [V3(x, 7.2, 0), V3(x, 6.7, 0)]); wires(S, [V3(x, 3.1, 0), V3(x, 3.2, 0)]); wires(S, [V3(x, 1.5, 0), V3(x, 0.9, 0)]); });
        while (S.scene.children.length > m0) o.pg.add(S.scene.children[m0]); o.pp1 = mkPath([V3(-8, 5.8, 0), V3(-8, 7.2, 0), V3(-2.8, 7.2, 0), V3(-2.8, 0.9, 0), V3(-8, 0.9, 0), V3(-8, 2.4, 0)], true); o.pp2 = mkPath([V3(-8, 5.8, 0), V3(-8, 7.2, 0), V3(2.8, 7.2, 0), V3(2.8, 0.9, 0), V3(-8, 0.9, 0), V3(-8, 2.4, 0)], true); o.cp1 = carriers(S, o.pp1, 40); o.cp2 = carriers(S, o.pp2, 46); o.pt = mkPath([V3(8, 7.2, 0), V3(8, 0.9, 0)], false); }
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c, dt) {
      const o = S.objs, par = c.arrangement === 1, R1 = c.r1, R2 = c.r2; o.sg.visible = !par; o.pg.visible = par; o.cs.im.visible = !par; o.cp1.im.visible = o.cp2.im.visible = par; const d = dt || 0.016;
      if (!par) { const Rt = R1 + R2, I = VS / Rt; o.r1s.set(R1, I * I * R1 / 15); o.r2s.set(R2, I * I * R2 / 15); o.vm1.set(`${f1(I * R1, 2)} V`); o.vm2.set(`${f1(I * R2, 2)} V`); o.ams.set(`${f1(I, 3)} A`); o.cs.step(d, clamp(I * 6, 0.2, 9)); o.I = I; o.Rt = Rt; }
      else { const Rt = (R1 * R2) / (R1 + R2), I1 = VS / R1, I2 = VS / R2, It = I1 + I2; o.r1p.set(R1, I1 * VS / 40); o.r2p.set(R2, I2 * VS / 40); o.a1.set(`${f1(I1, 3)} A`); o.a2.set(`${f1(I2, 3)} A`); o.at.set(`${f1(It, 3)} A`); o.cp1.step(d, clamp(I1 * 5, 0.2, 9)); o.cp2.step(d, clamp(I2 * 5, 0.2, 9)); o.I = It; o.Rt = Rt; o.I1 = I1; o.I2 = I2; }
      S.aim([0, par ? 5.2 : 6.2, 0], par ? 23 : 26, 0.0, 0.12);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, par = c.arrangement === 1; H.pill(ctx, 14, 26, par ? "PARALLEL:  1/R = 1/R₁ + 1/R₂      same V across each; I splits" : "SERIES:  R = R₁ + R₂      same I through each; V splits", "#ffd27a", 10); const Rt = o.Rt;
      H.pill(ctx, 14, 48, par ? `1/R = 1/${c.r1} + 1/${c.r2}  →  R = ${f1(Rt, 2)} Ω  (less than the smallest)` : `R = ${c.r1} + ${c.r2} = ${f1(Rt, 1)} Ω  (more than either)`, "#8df0be", 10.5); H.pill(ctx, 14, 70, par ? `V = ${VS} V on both;  I₁ = ${f1(o.I1, 3)} A,  I₂ = ${f1(o.I2, 3)} A,  I = I₁ + I₂ = ${f1(o.I, 3)} A` : `I = V/R = ${VS}/${f1(Rt, 1)} = ${f1(o.I, 3)} A;  V₁ = ${f1(o.I * c.r1, 2)} V,  V₂ = ${f1(o.I * c.r2, 2)} V  (sum = ${VS} V)`, "#cfe0ff", 9.5);
      H.pill(ctx, 14, 92, par ? "carriers: the bigger current flows through the smaller resistor" : "supply 12 V fixed; dots show the same current everywhere in the loop", "#9fb8d8", 9.5); if (!par) { lab(ctx, S, V3(-2.8, 5.7, 0.5), `R₁ = ${c.r1} Ω`, "#ffd27a"); lab(ctx, S, V3(2.8, 5.7, 0.5), `R₂ = ${c.r2} Ω`, "#ffd27a"); } else { lab(ctx, S, V3(-1.6, 5.0, 0.5), `R₁ = ${c.r1} Ω`, "#ffd27a", "left"); lab(ctx, S, V3(4.0, 5.0, 0.5), `R₂ = ${c.r2} Ω`, "#ffd27a", "left"); }
    },
    readouts(s, c) { const par = c.arrangement === 1; const Rt = par ? (c.r1 * c.r2) / (c.r1 + c.r2) : c.r1 + c.r2; return [["Arrangement", par ? "Parallel" : "Series"], ["Total resistance", `${f1(Rt, 2)} Ω`], ["Total current (12 V)", `${f1(VS / Rt, 3)} A`], [par ? "Rule" : "Rule", par ? "1/R = 1/R₁ + 1/R₂" : "R = R₁ + R₂"]]; },
  };

  /* ================= INTERNAL RESISTANCE & LOST VOLTS ================= */
  S_["Internal Resistance & Lost Volts"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[0, 5, 22], [0, 4, 0]], fov: 36,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; bench(S); const cell = new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 4.2, 40), new T.MeshPhysicalMaterial({ color: 0x9fb8d8, transparent: true, opacity: 0.16, roughness: 0.05, clearcoat: 1, depthWrite: false, side: T.DoubleSide })); cell.position.set(-6, 4.1, 0); S.scene.add(cell);
      const ring = (y) => { const t = new T.Mesh(new T.TorusGeometry(1.3, 0.05, 8, 40), M.chrome()); t.rotation.x = Math.PI / 2; t.position.set(-6, y, 0); S.scene.add(t); }; ring(6.2); ring(2.0);
      mk.cyl(0.35, 0.35, 0.3, M.chrome(), -6, 6.35, 0); mk.cyl(0.6, 0.6, 0.12, M.matte(0x111111, 0.5), -6, 1.88, 0);
      const emf = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 0.12, 28), M.matte(0x2fa84a, 0.4)); emf.position.set(-6, 3.0, 0); S.scene.add(emf); const emf2 = emf.clone(); emf2.position.y = 2.5; emf2.material = M.matte(0xb0b0b0, 0.4); S.scene.add(emf2);
      o.rin = resistor(S, 2.6); o.rin.rotation.z = Math.PI / 2; o.rin.position.set(-6, 4.6, 0); o.rout = resistor(S); o.rout.position.set(0, 6.8, 0); o.am = meter(S, "AMMETER"); o.am.position.set(7, 4.1, 0); o.vm = meter(S, "TERMINAL V"); o.vm.position.set(-1.8, 3.2, 1.2);
      wires(S, [V3(-6, 6.45, 0), V3(-6, 6.8, 0), V3(-1.8, 6.8, 0)]); wires(S, [V3(1.8, 6.8, 0), V3(7, 6.8, 0), V3(7, 4.95, 0)]); wires(S, [V3(7, 3.25, 0), V3(7, 1.4, 0), V3(-6, 1.4, 0), V3(-6, 1.82, 0)]); wires(S, [V3(-6, 3.5, 0), V3(-6, 3.3, 0)]);
      lead(S, V3(-6.15, 6.55, 0.3), V3(-2.9, 3.9, 1.3), 0.8, 0xc0392b); lead(S, V3(-6.15, 1.82, 0.3), V3(-2.9, 2.5, 1.3), -0.4, 0x111111);
      o.path = mkPath([V3(-6, 2.0, 0), V3(-6, 6.4, 0), V3(-6, 6.8, 0), V3(7, 6.8, 0), V3(7, 1.4, 0), V3(-6, 1.4, 0)], true); o.car = carriers(S, o.path, 60);
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c, dt) { const o = S.objs, I = c.emf / (c.externalR + c.internalR), Vt = c.emf - I * c.internalR; o.rin.set(Math.max(c.internalR * 10, 1), (I * I * c.internalR) / 4); o.rout.set(c.externalR, (I * I * c.externalR) / 15); o.am.set(`${f1(I, 3)} A`); o.vm.set(`${f1(Vt, 2)} V`); o.car.step(dt || 0.016, clamp(I * 3, 0.2, 9)); o.I = I; o.Vt = Vt; S.aim([-0.5, 5.4, 0], 24, 0.0, 0.12); },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, I = o.I, lost = I * c.internalR; H.pill(ctx, 14, 26, "E = I(R + r)        V = E − Ir        (terminal p.d.)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `I = E/(R+r) = ${c.emf}/(${c.externalR}+${c.internalR}) = ${f1(I, 3)} A`, "#8df0be", 10.5);
      H.pill(ctx, 14, 70, `lost volts Ir = ${f1(lost, 2)} V      terminal V = IR = ${f1(o.Vt, 2)} V      E = ${c.emf} V`, "#cfe0ff", 10); H.pill(ctx, 14, 92, "the cell's own resistance wastes energy as heat inside the cell (internal resistor glows)", "#9fb8d8", 9.5);
      lab(ctx, S, V3(-6, 0.7, 0.9), "cell: E (EMF) with internal r", "#ffd27a"); lab(ctx, S, V3(-8.4, 4.6, 0.8), `r = ${c.internalR} Ω`, "#ff9d8a", "right"); lab(ctx, S, V3(2.9, 7.5, 0.5), `R = ${c.externalR} Ω`, "#ffd27a", "left"); lab(ctx, S, V3(-1.8, 1.9, 1.4), "V across terminals", "#9fe0ff");
      const bx = 14, by = 118, bw = 220, f = lost / c.emf; ctx.save(); ctx.fillStyle = "rgba(10,16,26,0.7)"; ctx.fillRect(bx, by, bw, 22); ctx.fillStyle = "#2fa84a"; ctx.fillRect(bx + 2, by + 2, (bw - 4) * (1 - f), 18); ctx.fillStyle = "#e0523a"; ctx.fillRect(bx + 2 + (bw - 4) * (1 - f), by + 2, (bw - 4) * f, 18); ctx.fillStyle = "#fff"; ctx.font = "10px monospace"; ctx.fillText(`terminal ${f1(o.Vt, 1)} V`, bx + 6, by + 15); ctx.fillText(`lost ${f1(lost, 1)}`, bx + bw - 56, by + 15); ctx.restore();
      const ii = c.emf / c.internalR; H.graph(ctx, w - 202, h - 126, 188, 104, { series: [{ pts: [[0, c.emf], [ii, 0]], color: "#7fe3da", width: 2 }], xmin: 0, xmax: ii, ymin: 0, ymax: c.emf * 1.05, xl: "I (A)", yl: "V (V)", dot: [I, o.Vt, "#ffb703"], ticksX: 3, ticksY: 3 });
    },
    readouts(s, c) { const I = c.emf / (c.externalR + c.internalR); return [["Current", `${f1(I, 3)} A`], ["Terminal p.d.", `${f1(c.emf - I * c.internalR, 2)} V`], ["Lost volts", `${f1(I * c.internalR, 2)} V`], ["EMF", `${c.emf} V`]]; },
  };
  P.util.elec = { mkPath, carriers, wire, wires, lead, meter, supply, resistor, bench, lab, eng, sci };
})();
