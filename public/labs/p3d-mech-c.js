/* p3d-mech-c.js — statics, simple machines, springs and timing: photoreal three.js scenes with corrected physics. */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready) return;
  const T = window.THREE, { TAU, V3 } = P.util, M = P.mat, H = P.hud, G = 9.80665, S_ = P.scenes;
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const disposeGroup = (g) => { while (g.children.length) { const m = g.children.pop(); if (m.geometry) m.geometry.dispose(); } };

  /* ================= MOMENTS — BALANCING A BEAM ================= */
  const MPU = 1.15, PYB = 2.1;
  S_["Moments — Balancing a Beam"] = {
    env: "lab", envOpts: { w: 15, d: 8 }, cam: [[0, 2.8, 10], [0, 2.1, 0]], fov: 36, sub: 3,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; mk.box(2.6, 0.16, 1.4, M.matte(0x22262d, 0.45), 0, 0.08, 0); mk.box(0.42, 1.75, 0.55, M.steel(), 0, 1.0, 0); const w = mk.cone(0.26, 0.42, M.chrome(), 0, PYB - 0.3, 0, 4); w.rotation.y = Math.PI / 4; w.scale.set(1, 1, 0.9);
      o.beam = new T.Group(); o.beam.position.set(0, PYB, 0); S.scene.add(o.beam); const bar = new T.Mesh(new T.BoxGeometry(7.6, 0.17, 0.5), M.wood()); bar.castShadow = bar.receiveShadow = true; o.beam.add(bar);
      for (let i = -3; i <= 3.001; i += 0.5) { const t = new T.Mesh(new T.BoxGeometry(0.03, 0.02, i % 1 === 0 ? 0.36 : 0.22), M.matte(0x222222, 0.5)); t.position.set(i * MPU, 0.095, 0); o.beam.add(t); }
      o.h = [1, 2].map(() => { const g = new T.Group(); g.string = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 1, 8), M.matte(0xf0ece0, 0.9)); g.m = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 0.6, 36), M.steel()); g.m.castShadow = true; g.ring = new T.Mesh(new T.TorusGeometry(0.06, 0.014, 8, 20), M.steel()); g.add(g.string, g.m, g.ring); S.scene.add(g); return g; });
      o.lamp = mk.sphere(0.13, M.emissive(0x2dd36f, 0.1), 0, PYB + 0.55, 0); o.lampL = new T.PointLight(0x2dd36f, 0, 6, 1.6); o.lampL.position.set(0, PYB + 0.6, 0); S.scene.add(o.lampL);
    },
    reset(s, c) { s.phi = 0; s.w = 0; },
    step(s, c, dt) {
      if (s.phi === undefined) { s.phi = 0; s.w = 0; } const tau = (c.m2 * c.d2 - c.m1 * c.d1) * G * Math.cos(s.phi), I = 0.8 + c.m1 * c.d1 * c.d1 + c.m2 * c.d2 * c.d2, lim = rad(22);
      s.w += (tau / I - 5 * s.w) * dt; s.phi += s.w * dt; if (s.phi > lim) { s.phi = lim; s.w = Math.min(0, s.w); } if (s.phi < -lim) { s.phi = -lim; s.w = Math.max(0, s.w); }
    },
    update(S, s, c) {
      const o = S.objs; if (s.phi === undefined) return; o.beam.rotation.z = -s.phi; const cs = Math.cos(s.phi), sn = Math.sin(s.phi);
      [[-1, c.m1, c.d1], [1, c.m2, c.d2]].forEach(([sg, m, d], i) => { const x = sg * d * MPU, px = x * cs, py = PYB - x * sn, r = 0.2 + 0.1 * Math.cbrt(m), g = o.h[i], L = 0.9;
        g.m.scale.set(r / 0.4, r / 0.4, r / 0.4); g.m.position.set(px, py - L - r * 0.75, 0); g.ring.position.set(px, py - 0.05, 0); g.string.scale.y = L; g.string.position.set(px, py - L / 2 - 0.05, 0); g.pt = V3(px, py, 0); });
      const bal = Math.abs(c.m1 * c.d1 - c.m2 * c.d2) * G < 0.5; o.lamp.material.emissiveIntensity = bal ? 3.5 : 0.1; o.lampL.intensity = bal ? 14 : 0; S.aim([0, 2.1, 0], 11, 0.0, 0.2);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, t1 = c.m1 * G * c.d1, t2 = c.m2 * G * c.d2, bal = Math.abs(t1 - t2) < 0.5; if (!o.h[0].pt) return;
      H.at(ctx, S, o.h[0].pt.clone().setY(o.h[0].pt.y + 0.55), `${c.m1} kg · ${c.d1} m`, "#ffb0b0", -50, 0, 10.5); H.at(ctx, S, o.h[1].pt.clone().setY(o.h[1].pt.y + 0.55), `${c.m2} kg · ${c.d2} m`, "#a8d0ff", -50, 0, 10.5);
      H.pill(ctx, 14, 26, "principle of moments:  Στ(clockwise) = Στ(anticlockwise)  at balance", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `anticlockwise  m₁g·d₁ = ${f1(t1, 1)} N·m        clockwise  m₂g·d₂ = ${f1(t2, 1)} N·m`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, bal ? "BALANCED ✓  (lamp on)" : t2 > t1 ? "net clockwise moment → right side goes down" : "net anticlockwise moment → left side goes down", bal ? "#8df0be" : "#ff9d8a", 10.5);
    },
  };

  /* ================= CENTRE OF GRAVITY & STABILITY ================= */
  const KU = 0.02;
  S_["Centre of Gravity & Stability"] = {
    env: "lab", envOpts: { w: 15, d: 8 }, cam: [[0, 3.6, 9.5], [0, 2.1, 0]], fov: 36, sub: 3,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; mk.box(3, 0.14, 1.4, M.matte(0x22262d, 0.45), 0, 0.07, 0); mk.box(0.5, 1.0, 0.8, M.steel(), 0, 0.64, 0);
      o.tab = new T.Group(); o.tab.position.set(0, 1.25, 0); S.scene.add(o.tab); const board = new T.Mesh(new T.BoxGeometry(8, 0.2, 3), M.wood()); board.position.y = -0.1; board.castShadow = board.receiveShadow = true; o.tab.add(board);
      o.pivot = new T.Group(); o.tab.add(o.pivot); o.body = null; o.cg = null; o.sig = ""; o.line = mk.cyl(0.012, 0.012, 1, M.glow(0x6ee7a8, 0.9), 0, 0, 0, 6);
    },
    reset(s, c) { s.tilt = 0; s.psi = 0; s.w = 0; s.stand = 0; },
    step(s, c, dt) {
      if (s.tilt === undefined) P.scenes["Centre of Gravity & Stability"].reset(s, c); const bw = c.baseWidth * KU, cgh = c.cgHeight * KU, hw = bw / 2, Hh = cgh * 1.25;
      s.tilt += (rad(c.tilt) - s.tilt) * Math.min(1, dt * 5); const T_ = s.tilt, psi = s.psi, rx = -hw * Math.cos(psi) + cgh * Math.sin(psi), ry = hw * Math.sin(psi) + cgh * Math.cos(psi);
      const tau = 9.8 * (rx * Math.cos(T_) + ry * Math.sin(T_)), R2 = hw * hw + cgh * cgh, I = R2 + (bw * bw + Hh * Hh) / 12; s.tipping = tau > 0;
      if (psi <= 0 && tau <= 0) { s.psi = 0; s.w = 0; return; } s.w += (tau / I - 0.6 * s.w) * dt; s.psi += s.w * dt; if (s.psi < 0) { s.psi = 0; s.w = 0; } if (s.psi > Math.PI / 2) { s.psi = Math.PI / 2; s.w *= -0.2; }
      if (tau <= 0 && s.psi > 0) { s.psi = Math.max(0, s.psi - dt * 1.2); s.w = 0; }
    },
    update(S, s, c) {
      const o = S.objs; if (s.tilt === undefined) return; const bw = c.baseWidth * KU, cgh = c.cgHeight * KU, Hh = cgh * 1.25, hw = bw / 2, sig = `${c.baseWidth}|${c.cgHeight}`;
      if (o.sig !== sig) { o.sig = sig; if (o.body) { o.pivot.remove(o.body); o.body.geometry.dispose(); } if (o.cg) { o.pivot.remove(o.cg); } const b = new T.Mesh(new T.BoxGeometry(bw, Hh, 1.7), M.paint(0xe2a21e)); b.castShadow = true; b.add(new T.LineSegments(new T.EdgesGeometry(b.geometry), new T.LineBasicMaterial({ color: 0x4a3410 }))); o.body = b; o.pivot.add(b);
        const cg = new T.Mesh(new T.SphereGeometry(0.17, 24, 16), new T.MeshStandardMaterial({ map: (() => { const cc = P.util.cv(64, 64), q = cc.getContext("2d"); q.fillStyle = "#fff"; q.fillRect(0, 0, 64, 64); q.fillStyle = "#d8362c"; q.fillRect(0, 0, 32, 32); q.fillRect(32, 32, 32, 32); const t = new T.CanvasTexture(cc); t.colorSpace = T.SRGBColorSpace; return t; })(), roughness: 0.4 })); cg.position.set(0, cgh - Hh / 2, 0.9); o.cg = cg; b.add(cg); }
      o.tab.rotation.z = -s.tilt; o.pivot.position.set(hw, 0, 0); o.pivot.rotation.z = -s.psi; o.body.position.set(-hw, Hh / 2, 0);
      o.tab.updateMatrixWorld(true); const wp = V3(); o.cg.getWorldPosition(wp); const y0 = wp.y - 0.0; o.line.scale.set(1, Math.max(0.01, y0 - 0.14), 1); o.line.position.set(wp.x, 0.14 + (y0 - 0.14) / 2, 0.9);
      const tau0 = hw * 0 + (-hw * Math.cos(s.tilt) + cgh * Math.sin(s.tilt)); o.out = tau0 > 0 && s.psi < 0.05 || s.psi > 0.05; o.line.material.color.set(o.out ? 0xff5a5a : 0x6ee7a8); o.wp = wp.clone(); S.aim([0, 2.1, 0], 11, 0.0, 0.18);
    },
    overlay(ctx, s, c, w, h, S) {
      const bw = c.baseWidth * KU, cgh = c.cgHeight * KU, crit = deg(Math.atan(bw / 2 / cgh)); const top = c.tilt > crit || s.psi > 0.05;
      H.pill(ctx, 14, 26, "stable while the vertical line through the C.G. falls inside the base", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `critical angle  tan θ_c = (base/2) ÷ (C.G. height)  →  θ_c = ${f1(crit, 1)}°`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, top ? `TOPPLES — tilt ${c.tilt}° exceeds ${f1(crit, 1)}°` : `STABLE — tilt ${c.tilt}° is below ${f1(crit, 1)}°`, top ? "#ff9d8a" : "#8df0be", 10.5); H.pill(ctx, 14, 92, "● red/white ball = centre of gravity    ● line of action of weight", "#cfe0ff", 10);
    },
    readouts(s, c) { const bw = c.baseWidth * KU, cgh = c.cgHeight * KU, crit = deg(Math.atan(bw / 2 / cgh)); return [["Tilt", `${c.tilt}°`], ["Critical angle", `${f1(crit, 1)}°`], ["Status", c.tilt > crit || (s.psi || 0) > 0.05 ? "Topples" : "Stable"], ["Rule", "lower C.G. + wider base = more stable"]]; },
  };

  /* ================= INCLINED PLANE MACHINE ================= */
  const LR = 6.2;
  S_["Inclined Plane Machine"] = {
    env: "lab", envOpts: { w: 16, d: 8 }, cam: [[0.5, 3.4, 11], [0, 2.2, 0]], fov: 36,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.ramp = new T.Group(); S.scene.add(o.ramp); o.sig = "";
      o.cart = mk.cart(1.3, 0.9, 0xd8362c); S.scene.remove(o.cart); o.cg = new T.Group(); o.cg.add(o.cart); S.scene.add(o.cg); o.load = new T.Mesh(new T.BoxGeometry(1, 1, 1), M.steel()); o.load.castShadow = true; o.cart.add(o.load);
      o.pul = mk.cyl(0.26, 0.26, 0.16, M.chrome()); o.pul.rotation.x = Math.PI / 2; o.rope1 = mk.rod(V3(), V3(0, 1, 0), 0.016, M.matte(0xf0ece0, 0.9), 8); o.rope2 = mk.rod(V3(), V3(0, 1, 0), 0.016, M.matte(0xf0ece0, 0.9), 8); o.eff = null; o.nE = 0;
      o.aW = mk.arrow(0xff5a5a, 0.04, 0.14); o.aP = mk.arrow(0xffc857, 0.04, 0.14); o.aN = mk.arrow(0x58a6ff, 0.04, 0.14); o.aE = mk.arrow(0x6ee7a8, 0.045, 0.16);
    },
    reset(s, c) { s.u = 0.1; s.hold = 0.6; },
    step(s, c, dt) { if (s.u === undefined) { s.u = 0.1; s.hold = 0.6; } if (s.hold > 0) { s.hold -= dt; return; } s.u += 0.7 * dt; if (s.u > LR - 1.5) { s.u = 0.1; s.hold = 0.9; } },
    update(S, s, c) {
      const o = S.objs; if (s.u === undefined) return; const th = rad(c.angle), cs = Math.cos(th), sn = Math.sin(th), x0 = -LR * cs * 0.5, ht = LR * sn;
      if (o.sig !== String(c.angle)) { o.sig = String(c.angle); disposeGroup(o.ramp); const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(LR * cs, 0); sh.lineTo(LR * cs, ht); sh.closePath(); const g = new T.ExtrudeGeometry(sh, { depth: 2.0, bevelEnabled: false }); g.translate(x0, 0, -1.0); const m = new T.Mesh(g, M.matte(0x6f4a2a, 0.65)); m.castShadow = m.receiveShadow = true; o.ramp.add(m);
        const pl = new T.Mesh(new T.BoxGeometry(LR, 0.07, 2.0), M.matte(0xd8c9a4, 0.5)); pl.position.set(x0 + LR * cs / 2, ht / 2 + 0.035 * cs, 0); pl.rotation.z = th; pl.position.y += 0.0; pl.castShadow = true; o.ramp.add(pl); }
      const dir = V3(cs, sn, 0), nrm = V3(-sn, cs, 0), base = V3(x0, 0, 0), pos = base.clone().addScaledVector(dir, s.u).addScaledVector(nrm, 0.04);
      o.cg.position.copy(pos); o.cg.rotation.z = th; const ls = 0.5 + 0.17 * Math.cbrt(c.load / 100) * 1.5; o.load.scale.set(ls, ls, ls); o.load.position.set(0, 0.38 + ls / 2, 0);
      const top = V3(x0 + LR * cs, ht, 0), pp = top.clone().addScaledVector(nrm, 0.3).addScaledVector(dir, 0.05); o.pul.position.copy(pp);
      const E = c.load * sn * (1 + c.friction / 100), nE = clamp(Math.round(E / 70), 1, 6); if (o.nE !== nE) { o.nE = nE; if (o.eff) S.scene.remove(o.eff); o.eff = S.mk.slotted(nE); o.eff.scale.setScalar(1.6); }
      const hang = V3(pp.x + 0.27, pp.y - 0.0, 0), drop = s.u - 0.1, yh = Math.max(0.1, ht - 1.3 - drop + (LR - 1.5) * 0 - 0.0); o.eff.position.set(hang.x + 0.0, Math.max(0.05, pp.y - 1.0 - drop - o.eff.height * 1.6), 0);
      S.setRod(o.rope1, pos.clone().addScaledVector(dir, 0.65).addScaledVector(nrm, 0.5), pp.clone().addScaledVector(nrm, 0.0).addScaledVector(dir, -0.05).add(V3(0, 0, 0))); S.setRod(o.rope2, V3(hang.x, pp.y, 0), V3(hang.x, o.eff.position.y + o.eff.height * 1.6 + 0.12, 0));
      const k = 0.0075, cp = pos.clone().addScaledVector(nrm, 0.6 + ls / 2); S.setArrow(o.aW, cp, V3(0, -c.load * k, 0), 1); S.setArrow(o.aP, cp, dir.clone().multiplyScalar(-c.load * sn * k), 1); S.setArrow(o.aN, cp, nrm.clone().multiplyScalar(c.load * cs * k), 1); S.setArrow(o.aE, cp.clone().addScaledVector(nrm, -0.15), dir.clone().multiplyScalar(E * k), 1);
      S.aim([0, Math.max(1.6, ht * 0.5), 0], 11.5 + ht * 0.4, 0.05, 0.16);
    },
    overlay(ctx, s, c, w, h, S) {
      const th = rad(c.angle), VR = 1 / Math.sin(th), idealE = c.load * Math.sin(th), actE = idealE * (1 + c.friction / 100), MA = c.load / actE, eff = (MA / VR) * 100;
      H.pill(ctx, 14, 26, `V.R. = 1/sinθ = ${f1(VR, 2)}      ideal effort = W sinθ = ${f1(idealE, 1)} N`, "#ffd27a", 10.5); H.pill(ctx, 14, 48, `actual effort = ${f1(actE, 1)} N (with ${c.friction}% friction loss)     M.A. = load/effort = ${f1(MA, 2)}`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, `efficiency = M.A./V.R. × 100 = ${f1(eff, 0)}%`, "#8df0be", 10.5); H.pill(ctx, 14, 92, "● weight W   ● W sinθ (down slope)   ● normal reaction   ● effort", "#cfe0ff", 9.5);
    },
  };

  /* ================= PULLEY SYSTEM ================= */
  S_["Pulley System"] = {
    env: "lab", envOpts: { w: 16, d: 8 }, cam: [[0, 4.4, 14], [0, 4.6, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; mk.box(5.0, 0.16, 1.6, M.matte(0x22262d, 0.45), -0.4, 0.08, 0); mk.cyl(0.07, 0.07, 8.4, M.chrome(), -3.6, 4.2, -0.9); mk.rod(V3(-3.6, 8.3, -0.9), V3(3.2, 8.3, -0.9), 0.07, M.chrome());
      o.top = new T.Group(); o.bot = new T.Group(); o.rope = null; S.scene.add(o.top, o.bot); o.load = null; o.eff = null; o.nE = 0; o.lastN = 0; o.sigL = "";
      o.hook = mk.rod(V3(), V3(0, 1, 0), 0.02, M.steel(), 8); o.hang = mk.rod(V3(), V3(0, 1, 0), 0.02, M.steel(), 8);
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t = (s.t || 0) + dt; },
    update(S, s, c) {
      const o = S.objs, mk = S.mk, n = c.pulleys, r = 0.33, d = 2 * r, YT = 7.4, ys = YT - 0.15, A = 2.4 / n, rise = A * (0.5 - 0.5 * Math.cos(((s.t || 0) % 8) / 8 * TAU)), yb = 3.0 + rise, yz = yb + 0.3;
      const xs = (k) => (k - (n - 1) / 2) * d - 0.9 - (n === 1 ? 0 : 0), xg = xs(n - 1) + r, oddN = n % 2 === 1;
      const up = (k) => (k % 2 === 0) === oddN;                    // does strand k run upward?
      const sig = `${n}`; const rebuild = o.lastN !== n; o.lastN = n;
      if (rebuild) { disposeGroup(o.top); disposeGroup(o.bot);
        const wheel = (grp, cx, cy) => { const w = new T.Mesh(new T.CylinderGeometry(r - 0.02, r - 0.02, 0.12, 36), M.aluminium()); w.rotation.x = Math.PI / 2; w.position.set(cx, cy, 0); w.castShadow = true; grp.add(w); const hub = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.2, 14), M.steel()); hub.rotation.x = Math.PI / 2; hub.position.set(cx, cy, 0); grp.add(hub); const rim = new T.Mesh(new T.TorusGeometry(r - 0.02, 0.025, 8, 36), M.steel()); rim.position.set(cx, cy, 0); grp.add(rim); return w; };
        const x0 = xs(0) - 0.35, x1 = xg + r + 0.35;
        const plT = new T.Mesh(new T.BoxGeometry(x1 - x0, 0.14, 0.3), M.paint(0x2d6cdf)); plT.position.set((x0 + x1) / 2, ys + 0.55, 0); plT.castShadow = true; o.top.add(plT);
        const plB = new T.Mesh(new T.BoxGeometry(Math.max(0.9, xs(n - 1) - xs(0) + 0.7), 0.14, 0.3), M.paint(0x2d6cdf)); plB.position.set(xs(0) + (xs(n - 1) - xs(0)) / 2, -0.25, 0); plB.castShadow = true; o.bot.add(plB);
        for (let k = 0; k < n; k++) { const cx = xs(k) + r; if (k < n - 1) { if (up(k)) wheel(o.top, cx, ys); else wheel(o.bot, cx, yz - yb); } else wheel(o.top, cx, ys); }
        for (const x of [xs(0), xg]) { const h = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.5, 6), M.steel()); h.position.set(x, ys + 0.3, 0); o.top.add(h); }
        o.bot.userData.dummy = 1; }
      o.bot.position.y = yb;
      const pts = [], arcTop = (cx) => { for (let a = Math.PI; a >= -1e-6; a -= Math.PI / 10) pts.push(V3(cx + r * Math.cos(a), ys + r * Math.sin(a), 0)); }, arcBot = (cx) => { for (let a = Math.PI; a <= 2 * Math.PI + 1e-6; a += Math.PI / 10) pts.push(V3(cx + r * Math.cos(a), yz + r * Math.sin(a), 0)); };
      for (let k = 0; k < n; k++) { const x = xs(k); if (up(k)) { pts.push(V3(x, yz, 0), V3(x, ys, 0)); arcTop(x + r); } else { pts.push(V3(x, ys, 0), V3(x, yz, 0)); arcBot(x + r); } }
      const xe = xg + r, E = c.load / n, nE = clamp(Math.round(E / 45), 1, 6); if (o.nE !== nE) { o.nE = nE; if (o.eff) S.scene.remove(o.eff); o.eff = mk.slotted(nE); }
      const yG = 5.6 - rise * n; o.eff.position.set(xe, yG, 0); pts.push(V3(xe, yG + o.eff.height + 0.1, 0));
      // de-duplicate coincident points
      const clean = pts.filter((p, i) => i === 0 || p.distanceTo(pts[i - 1]) > 1e-3);
      if (o.rope) { S.scene.remove(o.rope); o.rope.geometry.dispose(); } o.rope = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(clean, false, "centripetal"), 260, 0.022, 6, false), M.matte(0xf4efe0, 0.9)); o.rope.castShadow = true; S.scene.add(o.rope);
      if (o.sigL !== c.load + "") { o.sigL = c.load + ""; if (o.load) S.scene.remove(o.load); const lr = 0.32 + 0.14 * Math.cbrt(c.load / 50); o.load = mk.cyl(lr, lr, lr * 1.5, M.iron()); o.lr = lr; }
      const cxm = xs(0) + (xs(n - 1) - xs(0)) / 2; o.load.position.set(cxm, yb - 0.25 - 0.5 - o.lr * 0.75, 0); S.setRod(o.hook, V3(cxm, yb - 0.25, 0), V3(cxm, o.load.position.y + o.lr * 0.75, 0)); o.hang.visible = false;
      o.yb = yb; o.yG = yG; o.xe = xe; o.cxm = cxm; S.aim([-0.4, 4.7, 0], 15, 0.0, 0.1);
    },
    overlay(ctx, s, c, w, h, S) {
      const n = c.pulleys, E = c.load / n; H.pill(ctx, 14, 26, `V.R. = number of supporting rope strands = ${n}`, "#ffd27a", 10.5); H.pill(ctx, 14, 48, `ideal effort = load / n = ${c.load} / ${n} = ${f1(E, 1)} N`, "#8df0be", 10.5); H.pill(ctx, 14, 70, `effort moves ${n}× as far as the load  (work in = work out)`, "#cfe0ff", 10);
      const o = S.objs; if (o.load) { const a = S.proj(V3(o.cxm + o.lr + 0.1, o.load.position.y, 0)); H.pill(ctx, a.x + 4, a.y, `load ${c.load} N`, "#ffb0b0", 10.5); const b = S.proj(V3(o.xe + 0.5, o.yG + 0.3, 0)); H.pill(ctx, b.x + 4, b.y, `effort ${f1(E, 1)} N`, "#a8f0c8", 10.5); }
    },
  };

  /* ================= LEVER ================= */
  const LU = 1.6;
  S_["Lever"] = {
    env: "lab", envOpts: { w: 16, d: 8 }, cam: [[0, 3.2, 11], [0.5, 1.4, 0]], fov: 36,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; const wedge = mk.cone(0.55, 0.9, M.matte(0x4a4f58, 0.5), 0, 0.45, 0, 4); wedge.rotation.y = Math.PI / 4; wedge.scale.set(1, 1, 1.0);
      o.bar = new T.Group(); o.bar.position.set(0, 1.0, 0); S.scene.add(o.bar); o.barM = null; o.crate = new T.Mesh(new T.BoxGeometry(1, 1, 1), M.matte(0x8a5a2e, 0.7)); o.crate.castShadow = true; o.crate.add(new T.LineSegments(new T.EdgesGeometry(o.crate.geometry), new T.LineBasicMaterial({ color: 0x3a2410 }))); o.bar.add(o.crate);
      o.aE = mk.arrow(0x6ee7a8, 0.06, 0.2); o.aW = mk.arrow(0xff5a5a, 0.06, 0.2); o.sig = "";
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t = (s.t || 0) + dt; },
    update(S, s, c) {
      const o = S.objs, sig = `${c.loadArm}|${c.effortArm}`; if (o.sig !== sig) { o.sig = sig; if (o.barM) { o.bar.remove(o.barM); o.barM.geometry.dispose(); } const len = (c.loadArm + c.effortArm) * LU; o.barM = new T.Mesh(new T.BoxGeometry(len, 0.2, 0.55), M.steel()); o.barM.position.x = (c.effortArm - c.loadArm) * LU / 2; o.barM.castShadow = true; o.bar.add(o.barM); }
      const phi = -0.12 + 0.12 * Math.sin((s.t || 0) * 0.9); o.bar.rotation.z = phi; const ls = 0.6 + 0.25 * Math.cbrt(c.load / 200); o.crate.scale.set(ls, ls, ls); o.crate.position.set(-c.loadArm * LU + ls * 0.0, 0.1 + ls / 2, 0);
      const E = (c.load * c.loadArm) / c.effortArm, endE = V3(c.effortArm * LU * Math.cos(phi), 1.0 + c.effortArm * LU * Math.sin(phi) + 0.1, 0), endL = V3(-c.loadArm * LU * Math.cos(phi), 1.0 - c.loadArm * LU * Math.sin(phi) + 0.1 + ls + 0.3, 0);
      S.setArrow(o.aE, endE.clone().add(V3(0, Math.min(0.95, 0.003 * E + 0.3), 0)), V3(0, -Math.min(0.95, 0.003 * E + 0.3), 0), 1); S.setArrow(o.aW, endL.clone().add(V3(0, Math.min(0.95, 0.003 * c.load + 0.3), 0)), V3(0, -Math.min(0.95, 0.003 * c.load + 0.3), 0), 1); o.eP = endE; o.lP = endL; S.aim([0.3, 1.7, 0], 8.4, 0.0, 0.2);
    },
    overlay(ctx, s, c, w, h, S) {
      const E = (c.load * c.loadArm) / c.effortArm, o = S.objs; H.pill(ctx, 14, 26, "principle of moments at the fulcrum:  effort × effort arm = load × load arm", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `E = (${c.load} × ${c.loadArm}) / ${c.effortArm} = ${f1(E, 1)} N         M.A. = ${f1(c.effortArm / c.loadArm, 2)}`, "#8df0be", 10.5);
      H.pill(ctx, 14, 70, "examples: crowbar, wheelbarrow, scissors, see-saw", "#cfe0ff", 10); if (o.eP) { const a = S.proj(o.eP.clone().setY(o.eP.y + 0.55)), b = S.proj(o.lP.clone().setY(o.lP.y + 0.55)); H.pill(ctx, a.x + 14, a.y, `effort ${f1(E, 0)} N`, "#a8f0c8", 10.5); H.pill(ctx, b.x + 14, b.y, `load ${c.load} N`, "#ffb0b0", 10.5); }
      const q = S.proj(V3(0, 0.15, 1.2)); const q1 = S.proj(V3(-c.loadArm * LU, 0.15, 1.2)), q2 = S.proj(V3(c.effortArm * LU, 0.15, 1.2)); ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1.5; [[q1, q], [q, q2]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }); ctx.restore(); H.pill(ctx, (q1.x + q.x) / 2, q.y + 20, `load arm ${c.loadArm} m`, "#ffd0d0", 9.5, "center"); H.pill(ctx, (q2.x + q.x) / 2, q.y + 20, `effort arm ${c.effortArm} m`, "#c8f5da", 9.5, "center");
    },
  };

  /* ================= HOOKE'S LAW ================= */
  S_["Hooke's Law"] = {
    env: "lab", envOpts: { w: 14, d: 8 }, cam: [[2, 4.4, 10.5], [0, 4.0, 0]], fov: 36, sub: 8,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; mk.box(2, 0.16, 1.2, M.matte(0x22262d, 0.45), -1.6, 0.08, 0); mk.cyl(0.06, 0.06, 8.8, M.chrome(), -2.6, 4.4, -0.8); mk.rod(V3(-2.6, 8.7, -0.8), V3(0.5, 8.7, -0.8), 0.05, M.chrome()); mk.rod(V3(0, 8.7, -0.8), V3(0, 8.4, 0), 0.04, M.steel()); mk.box(0.7, 0.07, 0.4, M.steel(), 0, 8.43, 0);
      o.spring = mk.spring(16, 0.3, 0.035, M.steel()); o.hook = mk.torus(0.08, 0.018, M.steel()); o.mass = null; o.nM = 0; o.sc = 3; o.rod = mk.rod(V3(), V3(0, 1, 0), 0.025, M.steel(), 8);
    },
    reset(s, c) { s.pos = 0; s.vel = 0; },
    step(s, c, dt) { if (s.pos === undefined) { s.pos = 0; s.vel = 0; } const z = 0.08, w = Math.sqrt(c.k / c.mass), a = G - (c.k / c.mass) * s.pos - 2 * z * w * s.vel; s.vel += a * dt; s.pos += s.vel * dt; },
    update(S, s, c) {
      const o = S.objs; if (s.pos === undefined) return; const eq = (c.mass * G) / c.k, tgt = 3.0 / (2.1 * eq); o.sc += (tgt - o.sc) * 0.15; const L0 = 1.9, ext = s.pos * o.sc, top = 8.4, L = L0 + ext;
      o.spring.position.set(0, top - L, 0); o.spring.scale.y = L; o.hook.position.set(0, top - L - 0.1, 0); const n = clamp(Math.round(c.mass * 2), 1, 7); if (o.nM !== n) { o.nM = n; if (o.mass) S.scene.remove(o.mass); o.mass = S.mk.slotted(n * 0.9); }
      o.mass.position.set(0, top - L - 0.45 - o.mass.height, 0); S.setRod(o.rod, V3(0, top - L - 0.18, 0), V3(0, top - L - 0.5, 0)); o.top0 = top - L0; o.yEnd = top - L - 0.3; S.aim([-0.3, 4.9, 0], 13.5, 0.12, 0.1);
    },
    overlay(ctx, s, c, w, h, S) {
      if (s.pos === undefined) return; const o = S.objs, eq = (c.mass * G) / c.k, sc = o.sc, F = c.k * s.pos;
      let st = 0.01; while (st * sc * 2 < 0.45) st *= st * 10 < 0.1 ? 5 : 2; const steps = [0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1]; st = steps.find((v) => v * sc >= 0.34) || 1;
      for (let e = 0; e * sc < 3.6; e += st) { const q = S.proj(V3(-1.0, o.top0 - e * sc, 0)), q2 = S.proj(V3(-0.75, o.top0 - e * sc, 0)); ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q2.x, q2.y); ctx.stroke(); ctx.restore(); H.pill(ctx, q.x - 4, q.y + 4, e >= 0.1 ? `${f1(e, 2)} m` : `${f1(e * 100, 1)} cm`, "#fff", 8.5, "right"); }
      const q = S.proj(V3(0.45, o.yEnd, 0)); H.pill(ctx, q.x + 6, q.y + 4, `x = ${f1(s.pos * 100, 1)} cm`, "#ffe8b0", 10.5);
      H.pill(ctx, 14, 26, "Hooke's law:  F = k x", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `equilibrium: kx = mg → x = ${f1(eq * 100, 1)} cm`, "#cfe0ff", 10.5); H.pill(ctx, 14, 70, `spring force now F = kx = ${f1(F, 1)} N`, "#8df0be", 10.5); H.pill(ctx, 14, 92, "force ∝ extension (elastic limit)", "#cfe0ff", 10);
      H.graph(ctx, w - 232, 12, 220, 132, { xmin: 0, xmax: 2.2 * eq, ymin: 0, ymax: 2.2 * eq * c.k, xl: "extension x (m)", yl: "force F (N)", ticksX: 4, series: [{ pts: [[0, 0], [2.2 * eq, 2.2 * eq * c.k]], color: "rgba(255,255,255,.4)", width: 1.4 }], dot: [clamp(s.pos, 0, 2.2 * eq), clamp(F, 0, 2.2 * eq * c.k), "#ffd27a"] });
    },
  };

  /* ================= TICKER-TIMER ================= */
  const CMU = 0.28, TW = 0.02;
  S_["Ticker-Timer — Measuring Time"] = {
    env: "lab", envOpts: { w: 17, d: 8 }, cam: [[0.4, 3.6, 8.4], [-0.5, 0.4, 0]], fov: 36,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; const tape = new T.Mesh(new T.BoxGeometry(15, 0.025, 1.0), new T.MeshStandardMaterial({ color: 0xe8d9ac, roughness: 0.95 })); tape.position.set(-3.5, 0.03, 0); tape.receiveShadow = true; S.scene.add(tape);
      o.body = mk.rbox(1.6, 1.3, 1.8, 0.12, M.paint(0x2e6a9e), 1.55, 0.8, 0); mk.cyl(0.16, 0.16, 0.18, M.steel(), 1.55, 1.52, 0); o.arm = new T.Group(); o.arm.position.set(0.8, 0.95, 0); S.scene.add(o.arm); const am = new T.Mesh(new T.BoxGeometry(0.85, 0.05, 0.2), M.steel()); am.position.x = -0.42; am.castShadow = true; o.arm.add(am); const tip = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.88, 8), M.steel()); tip.position.set(-0.8, -0.44, 0); o.arm.add(tip);
      o.dots = mk.particles(700, 0.04, M.matte(0x151515, 0.6));
    },
    reset(s, c) { s.t = 0; },
    step(s, c, dt) { s.t = (s.t || 0) + dt; },
    update(S, s, c) {
      const o = S.objs, t = s.t || 0, v = c.speed * CMU, i1 = Math.floor(t / TW); let n = 0;
      for (let i = i1; i >= 0 && n < 700; i--) { const x = -(t - i * TW) * v; if (x < -14) break; o.dots.set(n++, x - 0.8 + 0.8, 0.05, 0); } o.dots.count = n; o.dots.instanceMatrix.needsUpdate = true;
      const ph = (t / TW) % 1; o.arm.rotation.z = -0.06 * (0.5 + 0.5 * Math.cos(ph * TAU)); S.aim([-1.3, 0.6, 0], 10, 0.0, 0.42);
    },
    overlay(ctx, s, c, w, h, S) {
      H.pill(ctx, 14, 26, "ticker-timer: 50 dots every second → time between dots = 1/50 = 0.02 s", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `tape speed v = ${c.speed} cm/s → gap between dots = v × 0.02 = ${f1(c.speed * 0.02, 2)} cm`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, "equal spacing = constant speed;  spacing growing = accelerating", "#8df0be", 10);
      const q = S.proj(V3(-3.0, 0.15, 0.6)), q2 = S.proj(V3(-3.0 - 10 * c.speed * 0.02 * CMU, 0.15, 0.6)); ctx.save(); ctx.strokeStyle = "#ffd27a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q2.x, q2.y); ctx.stroke(); ctx.restore(); H.pill(ctx, (q.x + q2.x) / 2, q.y + 22, `10 gaps = 0.2 s  (${f1(c.speed * 0.2, 1)} cm)`, "#ffe8b0", 10, "center");
    },
  };
})();
