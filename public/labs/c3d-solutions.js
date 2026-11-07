/* c3d-solutions.js — chemistry 3D, batch B (part 1): the mole & Avogadro's constant · energy profile diagrams */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, sub = C3.chem.sub;

  /* =========================================================================== 1. THE MOLE */
  const NA = 6.022e23;
  const SUBS = {
    H2O: { name: "Water, H₂O", M: 18.02, st: "l", rho: 1.0, col: 0x9fd4ff, hex: "#7cc4ff" },
    CO2: { name: "Carbon dioxide, CO₂", M: 44.01, st: "g", col: 0xbfc8d0, hex: "#c3ccd4" },
    NaCl: { name: "Sodium chloride, NaCl", M: 58.44, st: "s", rho: 2.16, col: 0xf4f4f0, hex: "#f2f2ee" },
    O2: { name: "Oxygen, O₂", M: 32.0, st: "g", col: 0x8fd0ff, hex: "#8fd0ff" },
    C6H12O6: { name: "Glucose, C₆H₁₂O₆", M: 180.16, st: "s", rho: 1.54, col: 0xf0e6cf, hex: "#f0e6cf" },
    NH3: { name: "Ammonia, NH₃", M: 17.03, st: "g", col: 0xc9a8ff, hex: "#c9a8ff" },
    CaCO3: { name: "Calcium carbonate, CaCO₃", M: 100.09, st: "s", rho: 2.71, col: 0xe9e4da, hex: "#e9e4da" },
  };
  const KEYS = Object.keys(SUBS), MV = 22.4;               // molar volume of a gas at s.t.p., dm³/mol
  const HEAP = 160, DOTS = 400;

  C3.scenes.moleCalculator = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[0.4, 4.6, 15.5], [0, 2.3, 0]],
    values: { sub: "H2O", mass: 18, one: 0 },
    state: () => ({ t: 0 }),
    controls: [
      { type: "select", key: "sub", label: "Substance", options: KEYS.map((k) => ({ value: k, label: sub(k) + "  (M = " + SUBS[k].M + " g/mol)" })) },
      { type: "range", key: "mass", label: "Mass on the balance (g)", min: 1, max: 200, step: 1, unit: " g" },
      { type: "button", label: "Weigh exactly 1 mole", action: (S, s, c, ref) => { c.mass = clamp(Math.round(SUBS[c.sub].M), 1, 200); ref(); } },
      { type: "button", label: "Weigh 0.5 mole", action: (S, s, c, ref) => { c.mass = clamp(Math.round(SUBS[c.sub].M / 2), 1, 200); ref(); }, cls: "secondary" },
      { type: "toggle", key: "one", label: "Show the 1-mole reference pile" },
    ],
    views: [{ label: "Bench", cam: [[0.4, 4.6, 15.5], [0, 2.3, 0]] }, { label: "Balance", cam: [[-3.4, 2.6, 7.4], [-3.6, 1.2, 0]] }, { label: "Particles", cam: [[3.8, 3.2, 8.6], [3.9, 2.0, 0]] }],
    note: "n = m ÷ M, N = n × Nₐ, and for a gas at s.t.p. V = n × 22.4 dm³. One mole of any substance holds 6.02 × 10²³ particles, but the mass differs because M differs. Each dot in the box stands for 10²² particles (the real number is far too large to draw).",
    reset(S, s, c) { Object.assign(c, { sub: "H2O", mass: 18, one: 0 }); },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; K.contact(-3.8, 0, 0, 4.2, 0.55); K.contact(3.9, 0, 0, 4.6, 0.5);
      /* balance */
      S.mk.rbox(3.4, 0.5, 2.5, 0.08, M.paint(0xcfd3d8), -3.8, 0.25, 0);
      S.mk.rbox(2.0, 0.22, 0.12, 0.04, M.matte(0x0b1a10, 0.4), -3.8, 0.34, 1.28);
      S.mk.cyl(0.22, 0.28, 0.2, M.steel(), -3.8, 0.58, -0.1);
      S.mk.cyl(1.15, 1.15, 0.07, M.steel(), -3.8, 0.72, -0.1); s.panY = 0.76;
      /* sample holders on the pan */
      s.beaker = K.beaker(); s.beaker.group.position.set(-3.8, s.panY, -0.1); s.liq = s.beaker.addLiquid({ color: 0x9fd4ff, opacity: 0.26 });
      s.flask = K.flask(); s.flask.group.position.set(-3.8, s.panY, -0.1); s.flask.group.scale.setScalar(0.62);
      const grain = new T.BoxGeometry(0.1, 0.07, 0.09); s.heap = new T.InstancedMesh(grain, new T.MeshPhysicalMaterial({ roughness: 0.45, clearcoat: 0.3 }), HEAP);
      s.heap.frustumCulled = false; S.scene.add(s.heap);
      const hp = [], rr = U.rnd; for (let i = 0; i < HEAP; i++) { const a = rr(0, TAU), u = Math.random(), v = Math.random(); hp.push({ a, r: Math.sqrt(u), e: v, q: [rr(0, 3), rr(0, 3), rr(0, 3)] }); } s.hp = hp;
      /* particle box (each dot = 10²² particles) */
      const box = new T.Mesh(new T.BoxGeometry(3.6, 3.0, 2.4), K.glassMat({ opacity: 0.08 })); box.position.set(3.9, 1.6, 0); box.renderOrder = 4; S.scene.add(box);
      S.mk.rbox(3.9, 0.14, 2.7, 0.04, M.steel(), 3.9, 0.07, 0);
      s.dots = new T.InstancedMesh(new T.SphereGeometry(0.075, 14, 10), new T.MeshPhysicalMaterial({ roughness: 0.25, clearcoat: 0.7, color: 0xffffff }), DOTS); s.dots.frustumCulled = false; S.scene.add(s.dots);
      s.dp = []; for (let i = 0; i < DOTS; i++) s.dp.push({ p: V3(U.rnd(-1.6, 1.6), U.rnd(0.2, 2.8), U.rnd(-1, 1)), v: V3(U.rnd(-1, 1), U.rnd(-1, 1), U.rnd(-1, 1)).multiplyScalar(0.9) });
      s.m4 = new T.Matrix4(); s.last = ""; s.shown = 0;
      /* 1-mole reference: a tidy heap beside the balance */
      s.one = new T.Mesh(new T.SphereGeometry(1, 28, 16, 0, TAU, 0, Math.PI / 2), new T.MeshPhysicalMaterial({ roughness: 0.5, clearcoat: 0.3 })); s.one.position.set(-0.3, 0.02, 1.8); S.scene.add(s.one);
    },
    update(S, s, c, dt) {
      s.t += dt; const sb = SUBS[c.sub], n = c.mass / sb.M, N = n * NA, V = n * MV;
      const solid = sb.st === "s", liq = sb.st === "l", gas = sb.st === "g";
      s.beaker.group.visible = liq; s.flask.group.visible = gas; s.heap.visible = solid; s.liq.setVisible(liq);
      if (liq) { s.liq.setColor(sb.col, 0.28); s.liq.setVolume(c.mass / sb.rho); s.liq.update(S.t); }
      if (solid) {
        const R = 0.2 + 0.85 * Math.cbrt(c.mass / sb.rho / 60), cnt = Math.round(clamp(c.mass / 200, 0.05, 1) * HEAP);
        for (let i = 0; i < HEAP; i++) {
          if (i >= cnt) { s.m4.makeScale(0, 0, 0); s.heap.setMatrixAt(i, s.m4); continue; }
          const h = s.hp[i], rr = R * Math.sqrt(h.r) * (1 - 0.6 * h.e), y = s.panY + 0.04 + (1 - rr / R) * R * 0.9 * (0.5 + 0.5 * h.e);
          s.m4.makeRotationFromEuler(new T.Euler(h.q[0], h.q[1], h.q[2])); s.m4.setPosition(-3.8 + Math.cos(h.a) * rr, y, -0.1 + Math.sin(h.a) * rr); s.heap.setMatrixAt(i, s.m4);
        }
        s.heap.instanceMatrix.needsUpdate = true; s.heap.material.color.set(sb.col);
      }
      if (gas) { s.flask.liq || s.flask.addLiquid({ color: 0xffffff, opacity: 0 }); s.flask.liq.setVisible(false); }
      /* reference mole pile (same N for every substance — only the mass differs) */
      s.one.visible = !!c.one; if (c.one) { const Rr = 0.25 + 0.85 * Math.cbrt((solid ? sb.M / sb.rho : liq ? sb.M / sb.rho : 22.4 * 0.6) / 60); s.one.scale.set(Rr, Rr * 0.6, Rr); s.one.material.color.set(sb.col); s.one.material.opacity = gas ? 0.25 : 1; s.one.material.transparent = gas; }
      /* dots: 1 dot = 10²² particles, jittering in the box */
      const want = n > 0 ? clamp(Math.round(N / 1e22), 1, DOTS) : 0; s.shown = want; s.dots.material.color.set(sb.col);
      for (let i = 0; i < DOTS; i++) {
        if (i >= want) { s.m4.makeScale(0, 0, 0); s.dots.setMatrixAt(i, s.m4); continue; }
        const d = s.dp[i]; if (dt > 0) { d.p.addScaledVector(d.v, dt); if (Math.abs(d.p.x) > 1.65) d.v.x *= -1; if (d.p.y < 0.2 || d.p.y > 2.9) d.v.y *= -1; if (Math.abs(d.p.z) > 1.05) d.v.z *= -1; d.p.x = clamp(d.p.x, -1.65, 1.65); d.p.y = clamp(d.p.y, 0.2, 2.9); d.p.z = clamp(d.p.z, -1.05, 1.05); }
        s.m4.makeTranslation(3.9 + d.p.x, d.p.y, d.p.z); s.dots.setMatrixAt(i, s.m4);
      }
      s.dots.instanceMatrix.needsUpdate = true; s.n = n; s.N = N; s.V = V; s.sb = sb;
    },
    overlay(ctx, s, c, w, h, S) {
      const sb = s.sb; if (!sb) return;
      H.pill(ctx, 10, 22, "n = m ÷ M      N = n × Nₐ      V(gas, s.t.p.) = n × 22.4 dm³", "#ffe9b8", 11); H.pill(ctx, 10, 44, "Nₐ = 6.02 × 10²³ mol⁻¹   ·   M in g mol⁻¹   ·   1 dot = 10²² particles", "#bcd0ea", 10);
      const q = S.proj(V3(-3.8, 0.34, 1.34)); H.pill(ctx, q.x, q.y + 4, c.mass.toFixed(1) + " g", "#7dff9d", 12, "center");
      const q2 = S.proj(V3(-3.8, 2.7, -0.1)); H.pill(ctx, q2.x, clamp(q2.y, 80, 330), sub(c.sub) + "  M = " + sb.M + " g/mol", sb.hex, 10.5, "center");
      H.pill(ctx, 10, 364, s.shown + " dots in the box ≈ " + s.N.toExponential(2) + " particles", "#ffd27a", 10.5);
      /* bar chart: mass of 1 mole of each substance */
      const gx = 396, gy = 58, gw = 238, gh = 90; H.panel(ctx, gx, gy, gw, gh); ctx.save(); ctx.font = "600 9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#cfe0ff"; ctx.textAlign = "left"; ctx.fillText("mass of 1 mole (g) — same N in every bar", gx + 8, gy + 13);
      const bw = (gw - 20) / KEYS.length, mx = 190; KEYS.forEach((k, i) => { const m = SUBS[k].M, bh = (m / mx) * (gh - 40), x = gx + 10 + i * bw, y = gy + gh - 18 - bh; ctx.fillStyle = k === c.sub ? "#ffd27a" : "rgba(130,170,230,.6)"; ctx.fillRect(x + 3, y, bw - 6, bh); ctx.fillStyle = "#dbe7ff"; ctx.textAlign = "center"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText(Math.round(m), x + bw / 2, y - 3); ctx.fillText(k.replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[d]).slice(0, 6), x + bw / 2, gy + gh - 6); }); ctx.restore();
      H.pill(ctx, 10, 386, "n = " + s.n.toFixed(3) + " mol  →  " + s.n.toFixed(3) + " × 6.02×10²³ = " + s.N.toExponential(2), "#7dffbd", 10.5);
    },
    readouts(s, c) {
      const sb = s.sb; if (!sb) return [];
      return [["Moles  n = m ÷ M", s.n.toFixed(3) + " mol"], ["Particles  N = n × Nₐ", s.N.toExponential(2)], ["Volume of gas at s.t.p.", sb.st === "g" ? s.V.toFixed(2) + " dm³" : "— (not a gas)"], ["Molar mass M", sb.M + " g/mol"], ["Mass of 1 mole", sb.M + " g"], ["Dots drawn", s.shown + " × 10²² particles"]];
    },
    steps(s, c) { const sb = s.sb || SUBS[c.sub]; return [["Write the formula and add up the molar mass M of " + sub(c.sub) + " = " + sb.M + " g/mol", "done"], ["Read the mass m from the balance (" + c.mass + " g)", "done"], ["n = m ÷ M = " + c.mass + " ÷ " + sb.M + " = " + (c.mass / sb.M).toFixed(3) + " mol", "now"], ["N = n × 6.02×10²³ gives the number of particles", ""], ["If a gas at s.t.p.: V = n × 22.4 dm³", sb.st === "g" ? "" : ""]]; },
  };

  /* =========================================================================== 2. ENERGY PROFILE */
  const RXN = {
    comb: { name: "Methane burning (exothermic)", eq: "CH₄ + 2O₂ → CO₂ + 2H₂O", dH: -890, Ea: 160, type: "exo" },
    neut: { name: "HCl + NaOH neutralisation (exothermic)", eq: "HCl + NaOH → NaCl + H₂O", dH: -57, Ea: 25, type: "exo" },
    therm: { name: "Thermal decomposition of CaCO₃ (endothermic)", eq: "CaCO₃ → CaO + CO₂", dH: 178, Ea: 230, type: "endo" },
    photo: { name: "Photosynthesis (endothermic)", eq: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", dH: 2803, Ea: 3200, type: "endo" },
    gen: { name: "Generic profile — set Ea and ΔH yourself", eq: "A + B → C + D", dH: -100, Ea: 120, type: "exo" },
  };
  function prof(Ea, dH, x) {           // reaction coordinate x∈[0,1] → energy (kJ/mol) relative to the reactants; the peak at x = 0.5 equals Ea
    const g = Math.exp(-Math.pow((x - 0.5) / 0.19, 2)), base = dH * (0.5 + 0.5 * Math.tanh((x - 0.5) * 7));
    return base + Math.max(0, Ea - dH / 2) * g;
  }
  C3.scenes.energyProfile = {
    env: "studio", envOpts: {}, envI: 0.6, fov: 36, free: true, cam: [[0, 3.4, 13.2], [0, 2.6, 0]],
    values: { rx: "comb", cat: 0, Ea: 120, dH: -100, run: 0 },
    state: () => ({ t: 0, x: 0, run: false, hold: 0, temp: 25 }),
    controls: [
      { type: "select", key: "rx", label: "Reaction", options: Object.keys(RXN).map((k) => ({ value: k, label: RXN[k].name })) },
      { type: "range", key: "Ea", label: "Activation energy Eₐ (kJ/mol) — generic only", min: 20, max: 300, step: 5, unit: " kJ" },
      { type: "range", key: "dH", label: "Enthalpy change ΔH (kJ/mol) — generic only", min: -300, max: 300, step: 10, unit: " kJ" },
      { type: "toggle", key: "cat", label: "Add a catalyst (lowers Eₐ)" },
      { type: "button", label: "▶ Send reactants over the barrier", action: (S, s) => { s.run = true; s.x = 0; } },
    ],
    views: [{ label: "Front", cam: [[0, 3.4, 13.2], [0, 2.6, 0]] }, { label: "Angle", cam: [[6, 4.4, 11], [0, 2.4, 0]] }],
    note: "Exothermic: the products sit lower than the reactants, so ΔH is negative and heat is released (combustion, neutralisation). Endothermic: products sit higher, ΔH is positive, heat is absorbed. The barrier height is the activation energy Eₐ; a catalyst gives a new route with a lower Eₐ but the same ΔH. Eₐ(reverse) = Eₐ(forward) − ΔH.",
    onChange(S, s, c, key) { if (key === "rx") { const r = RXN[c.rx]; if (c.rx !== "gen") { c.Ea = r.Ea; c.dH = r.dH; } } },
    reset(S, s, c) { Object.assign(c, { rx: "comb", cat: 0, Ea: 160, dH: -890 }); s.run = false; s.x = 0; },
    build(S, s, c) {
      const r = RXN[c.rx]; c.Ea = r.Ea; c.dH = r.dH;
      S.mk.rbox(15, 0.2, 3, 0.05, M.matte(0x151a26, 0.5), 0, -0.1, 0);
      s.NX = 120; s.track = new T.Mesh(new T.BufferGeometry(), new T.MeshPhysicalMaterial({ color: 0xd8e4f4, roughness: 0.3, metalness: 0.7, clearcoat: 0.6 })); S.scene.add(s.track);
      s.ball = new T.Mesh(new T.SphereGeometry(0.22, 32, 24), M.paint(0xffb347)); s.ball.castShadow = true; S.scene.add(s.ball);
      s.heat = S.mk.soft(0xff7a3a, 3.2, 0, 1, 0.3, 0); s.glow = S.mk.soft(0x5ab0ff, 3.2, 0, 1, 0.3, 0); s.trail = [];
      s.lvR = new T.Mesh(new T.BoxGeometry(2.6, 0.04, 0.05), new T.MeshBasicMaterial({ color: 0xff8d6a })); s.lvP = s.lvR.clone(); s.lvT = s.lvR.clone(); [s.lvR, s.lvP, s.lvT].forEach((m) => S.scene.add(m));
      s.cur = s.cur || {}; s.sig = "";
    },
    update(S, s, c, dt) {
      s.t += dt; const r = RXN[c.rx], dH = c.dH, EaB = c.Ea, Ea = Math.max(Math.abs(dH) > 0 ? Math.max(0, dH) + 5 : 10, EaB * (c.cat ? 0.55 : 1)), X0 = -6.2, W = 12.4;
      if (c.rx !== "gen") { c.Ea = r.Ea; c.dH = r.dH; }
      const E = (x) => prof(Ea, dH, x), pmax = Math.max(Ea, dH, 0), pmin = Math.min(0, dH), ks = 3.3 / Math.max(50, pmax - pmin), Y = (E_) => 0.7 + (E_ - pmin) * ks;
      const sig = [Ea, dH, c.cat].join("|"); if (sig !== s.sig) {
        s.sig = sig; const pts = []; for (let i = 0; i <= s.NX; i++) { const x = i / s.NX; pts.push(V3(X0 + x * W, Y(E(x)), 0)); }
        s.track.geometry.dispose(); s.track.geometry = new T.TubeGeometry(new T.CatmullRomCurve3(pts), 200, 0.07, 10, false); s.pts = pts;
        s.yR = Y(0); s.yP = Y(dH); s.yT = Y(E(0.5)); s.lvR.position.set(X0 + 1.1, s.yR, 0); s.lvP.position.set(X0 + W - 1.1, s.yP, 0); s.lvT.position.set(0, s.yT, 0); s.lvT.scale.x = 0.7;
      }
      if (s.run && dt > 0) { const sp = clamp(1.25 - 0.5 * (E(s.x) / Math.max(Ea, 1)), 0.35, 1.2); s.x += dt * 0.34 * sp; if (s.x >= 1) { s.x = 1; s.run = false; s.hold = 2.2; } }
      else if (!s.run && s.hold > 0) { s.hold -= dt; if (s.hold <= 0) s.x = 0; }
      const x = clamp(s.x, 0, 1), bx = X0 + x * W, by = Y(E(x)) + 0.25; s.ball.position.set(bx, by, 0); s.ex = E(x);
      const heat = c.cat ? 0 : 0; const released = dH < 0 ? clamp((x - 0.5) * 2, 0, 1) : 0, absorbed = dH > 0 ? clamp((x - 0.5) * 2, 0, 1) : 0;
      s.heat.material.opacity += ((released * 0.8) - s.heat.material.opacity) * Math.min(1, dt * 5 + (dt ? 0 : 1)); s.glow.material.opacity += ((absorbed * 0.8) - s.glow.material.opacity) * Math.min(1, dt * 5 + (dt ? 0 : 1));
      s.heat.position.set(bx, by, 0.2); s.glow.position.set(bx, by, 0.2); s.eff = { Ea, dH, EaR: Ea - dH, x };
      s.ball.material.color.set(x < 0.5 ? 0xffb347 : dH < 0 ? 0xff6a4a : 0x5ab0ff);
    },
    overlay(ctx, s, c, w, h, S) {
      const r = RXN[c.rx], e = s.eff; if (!e) return;
      H.pill(ctx, 10, 22, r.eq, "#ffe9b8", 12); H.pill(ctx, 10, 44, "ΔH = ΣH(products) − ΣH(reactants)   ·   Eₐ(reverse) = Eₐ(forward) − ΔH", "#bcd0ea", 10);
      const lab = (p, t, col, dx) => { const q = S.proj(p); H.pill(ctx, q.x + (dx || 0), clamp(q.y, 70, 380), t, col, 10.5, "center"); };
      lab(V3(-5.1, s.yR + 0.35, 0), "Reactants", "#ffb347"); lab(V3(5.1, s.yP + (e.dH < 0 ? -0.4 : 0.35), 0), "Products", e.dH < 0 ? "#ff8d6a" : "#7cc4ff"); lab(V3(0, s.yT + 0.45, 0), "Transition state  (Eₐ " + e.Ea.toFixed(0) + " kJ)", "#ffd27a");
      /* Ea and ΔH arrows */
      const q1 = S.proj(V3(-1.9, s.yR, 0)), q2 = S.proj(V3(-1.9, s.yT, 0)); H.vec ? 0 : 0;
      ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = "#ffd27a"; ctx.beginPath(); ctx.moveTo(q1.x, q1.y); ctx.lineTo(q2.x, q2.y + 6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(q2.x, q2.y); ctx.lineTo(q2.x - 4, q2.y + 8); ctx.lineTo(q2.x + 4, q2.y + 8); ctx.fillStyle = "#ffd27a"; ctx.fill(); ctx.restore();
      H.pill(ctx, q1.x - 8, (q1.y + q2.y) / 2, "Eₐ = " + e.Ea.toFixed(0), "#ffd27a", 10.5, "right");
      const q3 = S.proj(V3(5.9, s.yR, 0)), q4 = S.proj(V3(5.9, s.yP, 0)); ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = e.dH < 0 ? "#ff8d6a" : "#7cc4ff"; ctx.beginPath(); ctx.moveTo(q3.x, q3.y); ctx.lineTo(q4.x, q4.y); ctx.stroke(); ctx.restore();
      H.pill(ctx, q3.x - 8, (q3.y + q4.y) / 2, "ΔH = " + (e.dH > 0 ? "+" : "") + e.dH.toFixed(0), e.dH < 0 ? "#ff8d6a" : "#7cc4ff", 10.5, "right");
      H.pill(ctx, 10, 386, (e.dH < 0 ? "EXOTHERMIC — heat released to surroundings (temperature rises)" : "ENDOTHERMIC — heat absorbed from surroundings (temperature falls)") + (c.cat ? "   ·   catalyst on" : ""), e.dH < 0 ? "#ff9d8a" : "#9fd2ff", 10.5);
      H.pill(ctx, 628, 340, "reaction coordinate →", "#bcd0ea", 10, "right");
      H.pill(ctx, 10, 366, "E(ball) = " + (Math.abs(s.ex || 0) < 0.5 ? "0" : (s.ex || 0).toFixed(0)) + " kJ/mol above the reactants", "#cfe0ff", 10);
    },
    readouts(s, c) {
      const e = s.eff; if (!e) return [];
      return [["Activation energy Eₐ (forward)", e.Ea.toFixed(0) + " kJ/mol"], ["Eₐ (reverse) = Eₐ − ΔH", e.EaR.toFixed(0) + " kJ/mol"], ["Enthalpy change ΔH", (e.dH > 0 ? "+" : "") + e.dH.toFixed(0) + " kJ/mol"], ["Type", e.dH < 0 ? "Exothermic" : "Endothermic"], ["Catalyst", c.cat ? "on — Eₐ × 0.55, ΔH unchanged" : "off"]];
    },
  };
})();
