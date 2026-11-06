/* p3d-heat-b.js — expansion, heat transfer, humidity and the bimetallic thermostat (three.js, corrected physics). */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready || !P.util.heat) return;
  const T = window.THREE, { TAU, V3 } = P.util, M = P.mat, H = P.hud, S_ = P.scenes, { thermometer, bunsen } = P.util.heat;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const sm = (x) => x * x * (3 - 2 * x);
  const lerpc = (a, b, k) => new T.Color(a).lerp(new T.Color(b), clamp(k, 0, 1));

  /* ================= THERMAL EXPANSION ================= */
  const EU = 1.2, EX0 = -3.6, EMAG = 100, BY = 2.95;
  const MAT = (a) => (a <= 8 ? ["cast iron / glass", () => M.iron()] : a <= 14 ? ["steel", () => M.steel()] : a <= 18 ? ["copper", () => M.copper()] : a <= 21 ? ["brass", () => M.brass()] : a <= 26 ? ["aluminium", () => M.aluminium()] : ["zinc / lead", () => M.matte(0x8b8f96, 0.45)]);
  S_["Thermal Expansion"] = {
    env: "lab", envOpts: { w: 20, d: 8 }, cam: [[0, 3.6, 13.5], [0.4, 2.0, 0]], fov: 36, sub: 3,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.cat = ""; o.bar = new T.Mesh(new T.BoxGeometry(1, 1, 1), M.steel()); o.bar.castShadow = o.bar.receiveShadow = true; S.scene.add(o.bar);
      mk.box(0.7, BY + 0.5, 1.6, M.matte(0x2a2e36, 0.45), EX0 - 0.35, (BY + 0.5) / 2, 0); mk.box(0.14, 0.8, 1.0, M.steel(), EX0 + 0.06, BY, 0);
      o.post = mk.box(0.5, BY - 0.35, 1.2, M.matte(0x2a2e36, 0.45), 0, (BY - 0.35) / 2, 0); o.roll = mk.cyl(0.14, 0.14, 1.0, M.chrome(), 0, BY - 0.35 - 0.1, 0); o.roll.rotation.x = Math.PI / 2;
      o.bn = [0, 1, 2].map((i) => bunsen(S, 0, 0)); o.th = thermometer(S, EX0 - 1.5, 0.0, 0.5, 4.2);
      o.rr = new T.Mesh(new T.BoxGeometry(4.2, 0.03, 0.34), new T.MeshStandardMaterial({ color: 0xe9ddb0, roughness: 0.5 })); o.rr.position.set(0, 0.03, 1.05); S.scene.add(o.rr);
      for (let i = 0; i <= 30; i++) { const t = new T.Mesh(new T.BoxGeometry(0.012, 0.01, i % 5 === 0 ? 0.26 : 0.15), M.matte(0x111111, 0.5)); t.position.set(0, 0.05, 1.05); t.userData.mm = i; S.scene.add(t); (o.ticks = o.ticks || []).push(t); }
      o.mk0 = mk.rod(V3(0, 0, 0), V3(0, 1, 0), 0.02, M.matte(0x2f7bff, 0.4), 8); o.mk1 = mk.rod(V3(0, 0, 0), V3(0, 1, 0), 0.025, M.matte(0xe53935, 0.4), 8); o.arm = mk.rod(V3(0, 0, 0), V3(0, 1, 0), 0.02, M.matte(0xe53935, 0.4), 8);
      s.dth = 0;
    },
    reset(s, c) { s.dth = 0; },
    step(s, c, dt) { if (s.dth === undefined) s.dth = 0; s.dth += (c.temp - s.dth) * Math.min(1, dt * 0.5); },
    update(S, s, c, dt) {
      const o = S.objs; if (s.dth === undefined) return; const dth = s.dth, len = c.L0 * EU, dL = c.alpha * 1e-6 * c.L0 * dth, dLv = dL * EU * EMAG, x1 = EX0 + len + dLv;
      const cat = MAT(c.alpha); if (o.cat !== cat[0]) { o.cat = cat[0]; o.bar.material = cat[1](); o.bar.material.emissive = new T.Color(0xff4a12); }
      o.bar.material.emissiveIntensity = clamp((dth / 200) ** 1.6 * 0.5, 0, 0.5); o.bar.scale.set(len + dLv, 0.36, 0.5); o.bar.position.set(EX0 + (len + dLv) / 2, BY, 0);
      o.post.position.x = EX0 + len * 0.82; o.roll.position.x = o.post.position.x; o.rr.position.x = EX0 + len + 2.1 - 0.3;
      o.ticks.forEach((t) => { t.position.x = EX0 + len + t.userData.mm * EU * EMAG * 1e-3 * 1.0 * 1; }); // 1 mm of real ΔL = 0.12 units on the scale
      const fx = EX0 + len; o.mk0.visible = true; S.setRod(o.mk0, V3(fx, 0.04, 1.2), V3(fx, BY - 0.3, 1.2)); S.setRod(o.mk1, V3(x1, 0.04, 1.2), V3(x1, BY - 0.3, 1.2)); S.setRod(o.arm, V3(x1, BY - 0.3, 0.3), V3(x1, BY - 0.3, 1.2));
      const heating = c.temp > 0.5 ? 0.3 + 0.7 * clamp((c.temp - dth) / 25, 0, 1) : 0; o.bn.forEach((b, i) => { b.position.x = EX0 + len * (0.18 + i * 0.3); b.set(heating, S.t + i); });
      o.th.set((20 + dth) / 240); S.aim([0.5, 1.9, 0], 12.6, 0.0, 0.17);
    },
    overlay(ctx, s, c, w, h, S) {
      if (s.dth === undefined) return; const dth = s.dth, dL = c.alpha * 1e-6 * c.L0 * dth, cat = MAT(c.alpha), len = c.L0 * EU, fx = EX0 + len;
      H.pill(ctx, 14, 26, "Linear expansion:  ΔL = α L₀ Δθ", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `ΔL = ${c.alpha}×10⁻⁶ × ${f1(c.L0, 1)} × ${f1(dth, 0)} = ${f1(dL * 1000, 3)} mm`, "#8df0be", 10.5);
      H.pill(ctx, 14, 70, `L = L₀ + ΔL = ${f1(c.L0 + dL, 5)} m     α ≈ ${cat[0]}`, "#cfe0ff", 10.5); H.pill(ctx, 14, 92, `θ = 20 + Δθ = ${f1(20 + dth, 0)} °C     (extension shown ×${EMAG})`, "#9fb8d8", 9.5);
      for (let mm = 0; mm <= 30; mm += 5) { const q = S.proj(V3(fx + mm * EU * EMAG * 1e-3, 0.05, 1.5)); if (q.z < 1) H.pill(ctx, q.x, q.y + 6, `${mm}`, "#e8f1ff", 9, "center"); } const e = S.proj(V3(fx + 3.9, 0.05, 1.5)); H.pill(ctx, e.x + 4, e.y + 6, "mm", "#cfe0ff", 9);
      const mx = c.alpha * 1e-6 * c.L0 * 200 * 1000; H.graph(ctx, w - 200, 12, 188, 124, { xmin: 0, xmax: 200, ymin: 0, ymax: mx, xl: "Δθ (K)", yl: "ΔL (mm)", ticksX: 4, ticksY: 4, series: [{ pts: [[0, 0], [200, mx]], color: "#7fe3da", width: 2.2 }], dot: [dth, dL * 1000, "#ffd27a"] });
    },
    readouts(s, c) { const dth = s.dth || 0, dL = c.alpha * 1e-6 * c.L0 * dth; return [["Extension ΔL", `${f1(dL * 1000, 3)} mm`], ["New length", `${f1(c.L0 + dL, 5)} m`], ["Expansivity α", `${c.alpha}×10⁻⁶ /K (${MAT(c.alpha)[0]})`], ["Temperature rise Δθ", `${f1(dth, 0)} K`]]; },
  };

  /* ================= HEAT TRANSFER MODES ================= */
  const NN = 40, DXN = 0.2, ROD_Y = 2.9, PIN_I = [6, 12, 18, 24, 30, 36];
  const RB = 2.0, RG = 1.65;
  S_["Heat Transfer Modes"] = {
    env: "lab", envOpts: { w: 17, d: 8 }, cam: [[0, 4.2, 12.5], [0, 2.4, 0]], fov: 36, sub: 3,
    build(S, s, c) {
      const mk = S.mk, o = S.objs;
      /* --- conduction --- */
      o.g0 = new T.Group(); S.scene.add(o.g0); o.rod = new T.InstancedMesh(new T.BoxGeometry(DXN * 1.02, 0.36, 0.36), new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.75, roughness: 0.32 }), NN); o.rod.castShadow = true; o.g0.add(o.rod);
      const m4 = new T.Matrix4(); for (let i = 0; i < NN; i++) { m4.setPosition(-4 + (i + 0.5) * DXN, ROD_Y, 0); o.rod.setMatrixAt(i, m4); o.rod.setColorAt(i, new T.Color(0.75, 0.77, 0.8)); }
      const cl = new T.Mesh(new T.BoxGeometry(0.6, 0.9, 1.0), M.matte(0x2a2e36, 0.45)); cl.position.set(-4.35, ROD_Y - 0.1, 0); o.g0.add(cl); const st = new T.Mesh(new T.BoxGeometry(0.5, ROD_Y - 0.45, 1.2), M.matte(0x2a2e36, 0.45)); st.position.set(-4.35, (ROD_Y - 0.45) / 2 - 0.0, 0); o.g0.add(st);
      const st2 = new T.Mesh(new T.BoxGeometry(0.4, ROD_Y - 0.5, 1.0), M.matte(0x2a2e36, 0.45)); st2.position.set(4.1, (ROD_Y - 0.5) / 2, 0); o.g0.add(st2);
      o.bn0 = bunsen(S, -3.55, 0); S.scene.remove(o.bn0); o.g0.add(o.bn0);
      o.pins = PIN_I.map((i) => { const b = new T.Mesh(new T.SphereGeometry(0.13, 20, 14), M.chrome()); b.castShadow = true; const wx = new T.Mesh(new T.SphereGeometry(0.075, 12, 8), M.matte(0xf3e9c3, 0.7)); wx.scale.y = 0.7; const x = -4 + (i + 0.5) * DXN; o.g0.add(b, wx); return { b, wx, x, y: ROD_Y - 0.18 - 0.14, vy: 0, fell: false, rest: false }; });
      /* --- convection --- */
      o.g1 = new T.Group(); S.scene.add(o.g1); const leg = (a) => { const l = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.75, 10), M.chrome()); l.position.set(Math.cos(a) * 1.6, 0.875, Math.sin(a) * 1.6); l.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); l.castShadow = true; o.g1.add(l); }; [0.4, 0.4 + TAU / 3, 0.4 + 2 * TAU / 3].forEach(leg);
      const gz = new T.Mesh(new T.CylinderGeometry(1.9, 1.9, 0.05, 40), new T.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.8, roughness: 0.5 })); gz.position.y = 1.7; o.g1.add(gz);
      o.bk = mk.beaker(RB, 4.2, 3.7, 0x9fd0ee); S.scene.remove(o.bk); o.bk.position.y = 1.72; o.bk.water.material.opacity = 0.34; o.g1.add(o.bk);
      o.bn1 = bunsen(S, -1.15, 0); S.scene.remove(o.bn1); o.bn1.scale.set(1, 0.5, 1); o.g1.add(o.bn1);
      o.tr = mk.particles(150, 0.075, new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, emissive: 0x444444, emissiveIntensity: 0.4 })); S.scene.remove(o.tr); o.g1.add(o.tr); o.tr.setColorAt(0, new T.Color(1, 1, 1)); o.trp = Array.from({ length: 150 }, () => ({ u: Math.random(), v: Math.random(), zf: rnd(-0.85, 0.85) }));
      o.dye = new T.Mesh(new T.SphereGeometry(0.12, 12, 8), M.matte(0x7a2bd0, 0.4)); o.dye.position.set(-1.7, 1.86, 0.2); o.g1.add(o.dye);
      /* --- radiation --- */
      o.g2 = new T.Group(); S.scene.add(o.g2); const pan = new T.Mesh(new T.BoxGeometry(0.5, 3.4, 4.0), M.paint(0x2a2e36)); pan.position.set(-5.0, 1.7, 0); o.g2.add(pan);
      o.bars = [0.6, 1.2, 1.8, 2.4].map((y) => { const b = new T.Mesh(new T.BoxGeometry(0.12, 0.14, 3.4), new T.MeshStandardMaterial({ color: 0x331a10, emissive: 0xff4a12, emissiveIntensity: 0.1, roughness: 0.5 })); b.position.set(-4.7, y + 0.2, 0); o.g2.add(b); return b; });
      o.hl = new T.PointLight(0xff6a2a, 0, 14, 1.4); o.hl.position.set(-4.2, 1.7, 0); o.g2.add(o.hl); o.cans = [[-1.3, M.matte(0x0b0b0c, 0.95)], [1.3, M.chrome()]].map(([z, mat]) => { const cn = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 1.6, 48), mat); cn.position.set(2.4, 0.8, z); cn.castShadow = true; o.g2.add(cn); const lid = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 0.05, 48), M.steel()); lid.position.set(2.4, 1.62, z); o.g2.add(lid); const th = thermometer(S, 2.4, 1.0, z, 3.0); S.scene.remove(th); o.g2.add(th); th.position.set(2.4, 1.05, z); th.rotation.z = 0; return { z, th }; });
      o.ph = new T.InstancedMesh(new T.SphereGeometry(0.075, 10, 8), new T.MeshBasicMaterial({ color: 0xff9a40, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }), 90); o.g2.add(o.ph); o.php = Array.from({ length: 90 }, () => ({ x: rnd(-4.4, 1.6), y: rnd(0.3, 2.4), z: rnd(-1.9, 1.9), vx: rnd(5.5, 7), vy: 0, vz: 0 }));
      s.mode = -1;
    },
    reset(s, c) { s.mode = -1; },
    step(s, c, dt) {
      const o = P.S && P.S.objs; if (!o || !o.pins) return; if (s.mode !== c.mode) {
        s.mode = c.mode; s.t = 0; s.Tn = new Array(NN).fill(20); o.pins.forEach((p) => { p.fell = false; p.rest = false; p.y = ROD_Y - 0.32; p.vy = 0; }); s.Tb = 20; s.Ts = 20; s.fell = 0;
      } s.t += dt;
      if (c.mode === 0) {
        const nsub = Math.ceil(dt / 0.012), h = dt / nsub, D = 1.3, k = D * h / (DXN * DXN), hl = 0.012; const Th = 20 + 480 * sm(clamp(s.t / 4, 0, 1));
        for (let n = 0; n < nsub; n++) { const T0 = s.Tn.slice(); for (let i = 1; i < NN; i++) { const l = T0[i - 1], r = i < NN - 1 ? T0[i + 1] : T0[i]; s.Tn[i] = T0[i] + k * (l - 2 * T0[i] + r) - hl * h * (T0[i] - 20); } s.Tn[0] = Th; }
        s.fell = 0; o.pins.forEach((p, j) => { const Tl = s.Tn[PIN_I[j]]; if (!p.fell && Tl >= 55) p.fell = true; if (p.fell && !p.rest) { p.vy -= 16 * dt; p.y += p.vy * dt; if (p.y < 0.15) { p.y = 0.15; if (Math.abs(p.vy) > 1.2) p.vy *= -0.32; else { p.vy = 0; p.rest = true; } } } if (p.fell) s.fell++; });
      } else if (c.mode === 1) {
        const V = 1.15 * sm(clamp(s.t / 5, 0, 1)), W = 2 * RG, Hh = 3.35; o.trp.forEach((p) => { const vy = V * Math.cos(Math.PI * p.u) * Math.sin(Math.PI * p.v), vx = -V * (W / Hh) * Math.sin(Math.PI * p.u) * Math.cos(Math.PI * p.v); p.u = clamp(p.u + (vx * dt) / W + rnd(-1, 1) * 0.006, 0.01, 0.99); p.v = clamp(p.v + (vy * dt) / Hh + rnd(-1, 1) * 0.006, 0.01, 0.99); p.vy = vy; });
      } else {
        const ramp = sm(clamp(s.t / 2, 0, 1)); s.Tb += (0.95 * 2.2 * ramp - 0.04 * (s.Tb - 20)) * dt; s.Ts += (0.1 * 2.2 * ramp - 0.04 * (s.Ts - 20)) * dt;
        o.php.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; let dead = p.x > 3.4 || p.x < -4.5 || Math.abs(p.z) > 2.6 || p.y < 0 || p.y > 2.6;
          for (const cn of o.cans) { const dx = p.x - 2.4, dz = p.z - cn.z; if (p.y < 1.6 && dx * dx + dz * dz < 0.88 * 0.88) { if (cn.z < 0) dead = true; else { const d = Math.hypot(dx, dz) || 1, nx = dx / d, nz = dz / d, vn = p.vx * nx + p.vz * nz; p.vx -= 2 * vn * nx; p.vz -= 2 * vn * nz; p.x = 2.4 + nx * 0.9; p.z = cn.z + nz * 0.9; } } }
          if (dead) { p.x = -4.4; p.y = rnd(0.3, 2.4); p.z = rnd(-1.9, 1.9); p.vx = rnd(5.5, 7); p.vy = rnd(-0.15, 0.15); p.vz = rnd(-0.3, 0.3); } });
      }
    },
    update(S, s, c) {
      const o = S.objs; if (!s.Tn) return; o.g0.visible = c.mode === 0; o.g1.visible = c.mode === 1; o.g2.visible = c.mode === 2; const m4 = new T.Matrix4();
      if (c.mode === 0) {
        const col = new T.Color(); for (let i = 0; i < NN; i++) { const k = clamp((s.Tn[i] - 20) / 420, 0, 1); col.setRGB(0.75 + 1.6 * k, 0.77 - 0.15 * k + (k > 0.7 ? 0.3 * (k - 0.7) : 0) * 0, 0.8 - 0.7 * k); col.g = k < 0.5 ? 0.77 - 0.5 * k * 1.2 : 0.47 - 0.35 * (k - 0.5); o.rod.setColorAt(i, col); } o.rod.instanceColor.needsUpdate = true;
        o.bn0.set(0.9, S.t); o.pins.forEach((p) => { p.b.position.set(p.x, p.y, 0); p.wx.visible = !p.fell; p.wx.position.set(p.x, ROD_Y - 0.19, 0); }); S.aim([0, 2.0, 0], 13.2, 0.0, 0.16);
      } else if (c.mode === 1) {
        const W = 2 * RG, Hh = 3.35, y0 = 1.72 + 0.35, r = new T.Color(); for (let i = 0; i < 150; i++) { const p = o.trp[i], x = -RG + p.u * W, y = y0 + p.v * Hh, rz = Math.sqrt(Math.max(0.02, RB * RB - x * x)) * 0.85; o.tr.set(i, x, y, p.zf * rz); r.set(p.vy > 0.05 ? 0xff6a3a : p.vy < -0.05 ? 0x4aa8ff : 0xcfd8e6); o.tr.setColorAt(i, r); } o.tr.instanceMatrix.needsUpdate = true; o.tr.instanceColor.needsUpdate = true;
        o.bn1.set(0.9, S.t); S.aim([0, 3.3, 0], 12.5, 0.0, 0.12);
      } else {
        const ramp = sm(clamp(s.t / 2, 0, 1)); o.bars.forEach((b) => (b.material.emissiveIntensity = 0.1 + 3.2 * ramp)); o.hl.intensity = 22 * ramp; o.cans[0].th.set((s.Tb - 10) / 80); o.cans[1].th.set((s.Ts - 10) / 80);
        o.php.forEach((p, i) => { m4.makeScale(1, 1, 1); m4.setPosition(p.x, p.y, p.z); o.ph.setMatrixAt(i, m4); }); o.ph.instanceMatrix.needsUpdate = true; S.aim([-1.0, 1.4, 0], 12.4, 0.0, 0.2);
      }
    },
    overlay(ctx, s, c, w, h, S) {
      if (!s.Tn) return;
      if (c.mode === 0) {
        H.pill(ctx, 14, 26, "CONDUCTION — in solids, no bulk movement", "#ffd27a", 10.5); H.pill(ctx, 14, 48, "vibrating atoms & free electrons pass energy on", "#cfe0ff", 10); H.pill(ctx, 14, 70, "rate of heat flow:  Q/t = k A Δθ / L", "#8df0be", 10.5); H.pill(ctx, 14, 92, `wax melts at 55 °C → balls fallen: ${s.fell} / 6`, "#ffb870", 10);
        H.graph(ctx, w - 200, 12, 188, 124, { xmin: 0, xmax: 80, ymin: 0, ymax: 500, xl: "distance from flame (cm)", yl: "θ (°C)", ticksX: 4, ticksY: 4, series: [{ pts: s.Tn.map((v, i) => [(i + 0.5) * 2, v]), color: "#ff8a4a", width: 2.2 }], dot: [0.5 * 2, s.Tn[0], "#ffd27a"] });
      } else if (c.mode === 1) {
        H.pill(ctx, 14, 26, "CONVECTION — in fluids (liquids & gases)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, "hot fluid expands, is less dense → rises", "#cfe0ff", 10); H.pill(ctx, 14, 70, "cool, denser fluid sinks → convection current", "#8df0be", 10); const a = S.proj(V3(-1.6, 3.2, 1.6)), b = S.proj(V3(1.6, 3.2, 1.6)); H.pill(ctx, a.x - 6, a.y, "hot ↑", "#ff9a6a", 10.5, "right"); H.pill(ctx, b.x + 6, b.y, "↓ cool", "#7fc4ff", 10.5);
      } else {
        H.pill(ctx, 14, 26, "RADIATION — infrared (EM waves), no medium", "#ffd27a", 10.5); H.pill(ctx, 14, 48, "travels through vacuum at c = 3×10⁸ m/s", "#cfe0ff", 10); H.pill(ctx, 14, 70, "dull black: good absorber · shiny: good reflector", "#8df0be", 10);
        const a = S.proj(V3(2.4, 4.6, -1.3)), b = S.proj(V3(2.4, 4.6, 1.3)); H.pill(ctx, a.x - 10, a.y, `black ${f1(s.Tb, 0)} °C`, "#ffb0a0", 10.5, "right"); H.pill(ctx, b.x + 10, b.y, `shiny ${f1(s.Ts, 0)} °C`, "#c8e0ff", 10.5);
      }
    },
  };

  /* ================= HUMIDITY & DEW POINT ================= */
  const es = (t) => 6.112 * Math.exp((17.62 * t) / (243.12 + t));
  const dewp = (t, rh) => { const g = Math.log(Math.max(1e-3, rh) / 100) + (17.62 * t) / (243.12 + t); return (243.12 * g) / (17.62 - g); };
  const NV = 160, NA = 200, CR = 0.95, CHH = 2.5;
  S_["Humidity & Dew Point"] = {
    env: "lab", envOpts: { w: 17, d: 8 }, cam: [[0, 3.6, 12], [0, 2.2, 0]], fov: 36, sub: 3,
    build(S, s, c) {
      const mk = S.mk, o = S.objs, pts = [V3(0, 0), V3(CR, 0), V3(CR, CHH), V3(CR - 0.04, CHH), V3(CR - 0.04, 0.05), V3(0, 0.05)].map((v) => new T.Vector2(v.x, v.y));
      o.can = new T.Mesh(new T.LatheGeometry(pts, 56), (() => { const m = M.chrome(); m.side = T.DoubleSide; return m; })()); o.can.position.y = 0.0; o.can.castShadow = true; S.scene.add(o.can);
      o.wat = mk.cyl(CR - 0.06, CR - 0.06, 0.02, M.water(0x9ed0ee), 0, CHH - 0.55, 0); o.ice = []; for (let i = 0; i < 5; i++) { const b = new T.Mesh(new T.BoxGeometry(0.36, 0.36, 0.36), new T.MeshPhysicalMaterial({ color: 0xdff3ff, roughness: 0.1, transmission: 0.5, thickness: 0.3, transparent: true, opacity: 0.85, clearcoat: 1 })); b.position.set(Math.cos(i * 1.3) * 0.4, CHH - 0.45, Math.sin(i * 1.3) * 0.4); b.rotation.set(i, i * 2, 0); S.scene.add(b); o.ice.push(b); }
      o.fog = new T.Mesh(new T.CylinderGeometry(CR + 0.012, CR + 0.012, CHH - 0.06, 56, 1, true), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.75, transparent: true, opacity: 0, depthWrite: false })); o.fog.position.y = CHH / 2; S.scene.add(o.fog);
      o.dr = new T.InstancedMesh(new T.SphereGeometry(1, 10, 8), M.glass(0xbfe2ff), 340); o.dr.material.opacity = 0.7; o.drp = Array.from({ length: 340 }, () => ({ a: rnd(0, TAU), y: rnd(0.08, CHH - 0.2), r: rnd(0.018, 0.045), th: Math.random() })); S.scene.add(o.dr);
      o.th = thermometer(S, 0.15, 0.25, 0.1, 3.6); o.vp = mk.particles(NV, 0.075, M.plastic(0x4da3ff, 0.25)); o.ap = mk.particles(NA, 0.05, M.matte(0xb4b8bf, 0.6)); o.vps = Array.from({ length: NV }, () => V3(rnd(-6, 6), rnd(0.4, 5.6), rnd(-3, 1.5))); o.aps = Array.from({ length: NA }, () => V3(rnd(-6, 6), rnd(0.4, 5.6), rnd(-3, 1.5)));
      mk.box(1.4, 0.05, 1.4, M.matte(0x22262d, 0.5), 0, 0.0, 0); s.t = 0; s.f = 0;
    },
    reset(s, c) { s.t = 0; s.f = 0; },
    step(s, c, dt) { s.t = (s.t || 0) + dt; const cyc = 24, t = s.t % cyc; const Tmin = 1; const Tair = c.temp; s.Tc = t < 12 ? Tair - (Tair - Tmin) * sm(t / 12) : t < 18 ? Tmin : Tmin + (Tair - Tmin) * sm((t - 18) / 6); const Td = dewp(c.temp, c.humidity); const tgt = s.Tc <= Td ? clamp(0.3 + (Td - s.Tc) * 0.3, 0, 1) : 0; s.f += (tgt - s.f) * Math.min(1, dt * 1.2); s.Td = Td; },
    update(S, s, c, dt) {
      const o = S.objs; if (s.Tc === undefined) return; const f = s.f, e = (c.humidity / 100) * es(c.temp), nv = clamp(Math.round((NV * e) / 60), 4, NV), m4 = new T.Matrix4();
      o.fog.material.opacity = 0.45 * f; o.th.set((s.Tc + 5) / 50); o.dr.visible = f > 0.01; for (let i = 0; i < 340; i++) { const d = o.drp[i], vis = f > d.th * 0.9; const rr = vis ? d.r * (0.5 + f) : 0.0001; m4.makeScale(rr, rr, rr); m4.setPosition(Math.cos(d.a) * (CR + 0.012), d.y, Math.sin(d.a) * (CR + 0.012)); o.dr.setMatrixAt(i, m4); } o.dr.instanceMatrix.needsUpdate = true;
      const wob = (arr, mesh, n, sp) => { for (let i = 0; i < arr.length; i++) { const p = arr[i]; p.x += rnd(-1, 1) * sp * dt; p.y += rnd(-1, 1) * sp * dt; p.z += rnd(-1, 1) * sp * dt; p.x = clamp(p.x, -6.5, 6.5); p.y = clamp(p.y, 0.3, 5.8); p.z = clamp(p.z, -3.2, 1.8); if (Math.hypot(p.x, p.z) < CR + 0.1 && p.y < CHH + 0.1) p.x = CR + 0.2 + Math.abs(p.x); if (i < n) mesh.set(i, p.x, p.y, p.z, 1); else mesh.set(i, 0, -50, 0, 0.001); } mesh.instanceMatrix.needsUpdate = true; };
      wob(o.vps, o.vp, nv, 3.2); wob(o.aps, o.ap, NA, 2.4); S.aim([0, 2.3, 0], 12.4, 0.0, 0.15);
    },
    overlay(ctx, s, c, w, h, S) {
      if (s.Tc === undefined) return; const esT = es(c.temp), e = (c.humidity / 100) * esT, Td = s.Td, on = s.Tc <= Td;
      H.pill(ctx, 14, 26, "RH = e / e_s × 100 %   (vapour pressure ÷ saturated)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `e_s(${c.temp} °C) = ${f1(esT, 1)} hPa    e = ${f1(e, 1)} hPa`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, `dew point θ_d = ${f1(Td, 1)} °C   can = ${f1(s.Tc, 1)} °C`, "#8df0be", 10.5); H.pill(ctx, 14, 92, on ? "CONDENSATION — surface is below the dew point" : Td < 1 ? "air too dry: the can never reaches θ_d" : "dry surface — can still above the dew point", on ? "#8ad0ff" : "#ffb870", 10);
      const pts = []; for (let t = 5; t <= 40; t += 1) pts.push([t, es(t)]); H.graph(ctx, w - 200, 12, 188, 124, { xmin: 5, xmax: 40, ymin: 0, ymax: es(40), xl: "θ (°C)", yl: "p (hPa)", ticksX: 5, ticksY: 4, series: [{ pts, color: "#7fe3da", width: 2.2 }, { pts: [[5, e], [40, e]], color: "rgba(255,210,122,.6)", width: 1.4 }], dot: [clamp(Td, 5, 40), e, "#ffd27a"] });
    },
    readouts(s, c) { const esT = es(c.temp), e = (c.humidity / 100) * esT, Td = dewp(c.temp, c.humidity); return [["Relative humidity", `${c.humidity} %`], ["Dew point (Magnus)", `${f1(Td, 1)} °C`], ["Vapour pressure e", `${f1(e, 1)} hPa`], ["Saturation e_s", `${f1(esT, 1)} hPa`], ["Condensation on can?", s.Tc !== undefined && s.Tc <= Td ? "Yes" : "No"]]; },
  };

  /* ================= BIMETALLIC STRIP & THERMOSTAT ================= */
  const NS = 48, SLEN = 7, SX0 = -3.4, SY0 = 3.7, THK = 0.2, UPM = 7 / 0.3, GAP = 0.35, HM = 1e-3, LM = 0.3;
  S_["Bimetallic Strip & Thermostat"] = {
    env: "lab", envOpts: { w: 18, d: 8 }, cam: [[0, 3.6, 12.5], [0, 2.8, 0]], fov: 36, sub: 3,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.top = []; o.bot = []; for (let i = 0; i < NS; i++) { const a = new T.Mesh(new T.BoxGeometry(1, THK, 0.7), M.iron()), b = new T.Mesh(new T.BoxGeometry(1, THK, 0.7), M.brass()); a.castShadow = b.castShadow = true; S.scene.add(a, b); o.top.push(a); o.bot.push(b); }
      /* brass is on TOP → bends downward when heated */ o.top.forEach((m) => (m.material = M.brass())); o.bot.forEach((m) => (m.material = M.iron()));
      mk.box(0.9, 1.6, 1.3, M.matte(0x2a2e36, 0.45), SX0 - 0.45, SY0 - 0.1, 0); mk.box(0.5, SY0 + 0.7, 1.4, M.matte(0x2a2e36, 0.45), SX0 - 0.45, (SY0 + 0.7) / 2 - 0.0, 0).position.y = (SY0 - 0.9) / 2;
      mk.box(3.0, 0.2, 1.6, M.matte(0x22262d, 0.45), 4.8, 0.1, 0); o.post = mk.box(0.4, SY0 + 1.4, 0.5, M.matte(0x2a2e36, 0.45), SX0 + SLEN + 0.9, (SY0 + 1.4) / 2, 0.0); o.pl = mk.cyl(0.07, 0.07, 1, M.steel(), 0, 0, 0, 14); o.plb = mk.cyl(0.16, 0.16, 0.2, M.brass(), 0, 0, 0, 20);
      o.lamp = mk.bulb(0xffe6a8, 12); o.lamp.position.set(-6.0, 1.2, 0); o.lamp.scale.setScalar(1.6); mk.box(0.9, 0.5, 0.9, M.matte(0x22262d, 0.45), -6.0, 0.25, 0);
      o.w1 = mk.rod(V3(), V3(0, 1, 0), 0.03, M.matte(0xd8362c, 0.5), 8); o.w2 = mk.rod(V3(), V3(0, 1, 0), 0.03, M.matte(0x222222, 0.5), 8); o.th = thermometer(S, 4.6, 0.2, 0.4, 4.0);
      s.dth = 0;
    },
    reset(s, c) { s.dth = 0; },
    step(s, c, dt) { if (s.dth === undefined) s.dth = 0; s.dth += (c.temp - s.dth) * Math.min(1, dt * 0.5); },
    update(S, s, c) {
      const o = S.objs; if (s.dth === undefined) return; const kap = (3 * c.alphaDiff * 1e-6 * s.dth) / (2 * HM), kv = Math.min((kap / UPM) * 2, 2.2 / SLEN), ds = SLEN / NS; let x = SX0, y = SY0, tipDy = 0;
      for (let i = 0; i < NS; i++) { const sMid = (i + 0.5) * ds, phi = -kv * sMid; if (i > 0) { const pphi = -kv * (i - 0.5) * ds, mphi = (pphi + phi) / 2; x += ds * Math.cos(mphi); y += ds * Math.sin(mphi); } else { x += (ds / 2) * Math.cos(phi); y += (ds / 2) * Math.sin(phi); }
        const nx = -Math.sin(phi), ny = Math.cos(phi); o.top[i].position.set(x + nx * THK / 2, y + ny * THK / 2, 0); o.bot[i].position.set(x - nx * THK / 2, y - ny * THK / 2, 0); o.top[i].rotation.z = o.bot[i].rotation.z = phi; o.top[i].scale.x = o.bot[i].scale.x = ds * 1.03; }
      const tipX = x, tipY = y, dl = SY0 - tipY, closed = dl < GAP; o.dl = dl; o.closed = closed; o.kap = kap; o.tip = V3(tipX, tipY, 0);
      const cx = SX0 + SLEN - 0.3, ext = clamp(dl, 0, GAP), top0 = SY0 + THK + 0.0; o.pl.position.set(cx, top0 + 0.3 - ext * 0.0 + 0.0, 0); const plTop = top0 + 1.4, plBot = top0 - ext + 0.0; S.setRod(o.pl, V3(cx, plBot, 0), V3(cx, plTop, 0)); o.plb.position.set(cx, plBot, 0); o.post.position.x = cx + 0.9;
      o.lamp.setPower(closed ? 1 : 0.0); S.setRod(o.w1, V3(cx, plTop, 0), V3(cx + 0.9, plTop, 0)); S.setRod(o.w2, V3(cx + 0.9, plTop, 0), V3(cx + 0.9, SY0 + 1.9, 0)); o.w1.visible = o.w2.visible = false;
      o.th.set((20 + s.dth) / 190); S.aim([0, 2.4, 0], 11.5, 0.0, 0.12);
    },
    overlay(ctx, s, c, w, h, S) {
      if (s.dth === undefined) return; const o = S.objs, kap = o.kap || 0, R = kap > 1e-6 ? 1 / kap : Infinity, dmm = ((kap * LM * LM) / 2) * 1000, open = (4 * HM * 15e-3) / (3 * c.alphaDiff * 1e-6 * LM * LM);
      H.pill(ctx, 14, 26, "Bimetallic strip: brass (large α) on iron", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `κ = 3 Δα Δθ / 2h = ${f1(kap, 2)} m⁻¹   R = ${isFinite(R) ? f1(R * 100, 0) + " cm" : "∞"}`, "#cfe0ff", 10);
      H.pill(ctx, 14, 70, `tip droop δ = κL²/2 = ${f1(dmm, 1)} mm  (bend drawn ×2)`, "#8df0be", 10); H.pill(ctx, 14, 92, o.closed ? `CONTACT CLOSED → heater ON (cut-out at Δθ ≈ ${f1(open, 0)} K)` : `CONTACT OPEN → heater OFF  (Δθ > ${f1(open, 0)} K)`, o.closed ? "#8df0be" : "#ff9d8a", 10);
      const mx = (3 * c.alphaDiff * 1e-6 * 150 * LM * LM) / (4 * HM) * 1000; H.graph(ctx, w - 200, 12, 188, 124, { xmin: 0, xmax: 150, ymin: 0, ymax: mx, xl: "Δθ (K)", yl: "δ (mm)", ticksX: 5, ticksY: 4, series: [{ pts: [[0, 0], [150, mx]], color: "#7fe3da", width: 2.2 }, { pts: [[0, 15], [150, 15]], color: "rgba(255,150,120,.7)", width: 1.3 }], dot: [s.dth, dmm, "#ffd27a"] });
    },
    readouts(s, c) { const kap = (3 * c.alphaDiff * 1e-6 * (s.dth || 0)) / (2 * HM), dmm = ((kap * LM * LM) / 2) * 1000; return [["Temperature change", `${f1(s.dth || 0, 0)} K`], ["Curvature κ", `${f1(kap, 2)} m⁻¹`], ["Tip deflection", `${f1(dmm, 1)} mm`], ["Thermostat contact", dmm < 15 ? "closed (heater on)" : "open (heater off)"]]; },
  };
})();
