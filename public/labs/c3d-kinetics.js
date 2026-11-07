/* c3d-kinetics.js — chemistry 3D, batch B (part 3): reaction rate (collision theory + Arrhenius) · chemical equilibrium (N₂O₄ ⇌ 2NO₂, Le Chatelier) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, R = 8.314;
  const NR = 240, NE = 110;
  /* rate-mode box */
  const BX0 = -3.3, BX1 = 0.9, BY0 = 0.12, BY1 = 3.3, BZ = 1.2, RP = 0.13;
  /* equilibrium cylinder */
  const CX = -2.2, RC = 1.25, KC298 = 0.0061, DH = 57.2e3, EAF = 55e3, KF0 = 0.35;
  const Kc = (Tk) => KC298 * Math.exp(-(DH / R) * (1 / Tk - 1 / 298));
  const kf = (Tk) => KF0 * Math.exp(-(EAF / R) * (1 / Tk - 1 / 298));
  const pReact = (Tk, Ea, cat) => Math.min(1, 0.06 * Math.exp(-((Ea * 1000 * (cat ? 0.6 : 1)) / (R * Tk) - 50000 / (R * 298))));   // relative to Ea = 50 kJ at 298 K → 6 %
  const fmtE = (v) => v.toExponential(1).replace("e", "×10^");

  C3.scenes.kineticsEquilibrium = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[-0.8, 4.0, 14.5], [-1.2, 1.9, 0]],
    values: { mode: "rate", T: 298, conc: 1, Ea: 50, cat: 0, V: 4 },
    state: () => ({ t: 0 }),
    controls: [
      { type: "select", key: "mode", label: "Investigation", options: [{ value: "rate", label: "Rate of reaction  (A + B → C)" }, { value: "eq", label: "Equilibrium  (N₂O₄ ⇌ 2NO₂)" }] },
      { type: "range", key: "T", label: "Temperature T (K)", min: 273, max: 373, step: 1, unit: " K" },
      { type: "range", key: "conc", label: "Concentration of A and B (rate mode, relative)", min: 0.3, max: 3, step: 0.1 },
      { type: "range", key: "Ea", label: "Activation energy Eₐ (rate mode, kJ/mol)", min: 20, max: 80, step: 1, unit: " kJ" },
      { type: "toggle", key: "cat", label: "Catalyst (rate mode) — lowers Eₐ to 60 %" },
      { type: "range", key: "V", label: "Volume of the gas syringe (equilibrium mode, dm³)", min: 1, max: 6, step: 0.1, unit: " dm³" },
      { type: "button", label: "Restart the experiment", action: (S, s, c) => init(S, s, c) },
      { type: "button", label: "Add N₂O₄ (+50 %)  — equilibrium mode", action: (S, s) => { s.nA *= 1.5; }, cls: "secondary" },
      { type: "button", label: "Remove some NO₂ (−40 %)  — equilibrium mode", action: (S, s) => { s.nB *= 0.6; }, cls: "secondary" },
    ],
    views: [{ label: "Overview", cam: [[-0.8, 4.0, 14.5], [-1.2, 1.9, 0]] }, { label: "Close up", cam: [[-1.0, 2.6, 8.2], [-1.2, 1.7, 0]] }],
    note: "Rate: a reaction needs a collision with enough energy (≥ Eₐ) — raising the concentration gives more collisions, raising T gives faster molecules, and a catalyst lowers Eₐ so more collisions succeed. Equilibrium: the forward and reverse reactions go on at the same rate, so the amounts stop changing (Kc = [NO₂]²/[N₂O₄]). Le Chatelier: the system opposes any change — heat (forward is endothermic) or lower pressure favours NO₂; added N₂O₄ shifts it to NO₂; removing NO₂ does too.",
    onChange(S, s, c, key) { if (key === "conc" || key === "mode") init(S, s, c); if (key === "mode") C3.setView(S, { cam: [[-0.8, 4.0, 14.5], [-1.2, 1.9, 0]] }); },
    reset(S, s, c) { Object.assign(c, { mode: "rate", T: 298, conc: 1, Ea: 50, cat: 0, V: 4 }); init(S, s, c); },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; K.contact(-1.2, 0, 0, 7.5, 0.5);
      /* rate box */
      s.rg = new T.Group(); S.scene.add(s.rg);
      const box = new T.Mesh(new T.BoxGeometry(BX1 - BX0, BY1 - BY0, BZ * 2), K.glassMat({ opacity: 0.08 })); box.position.set((BX0 + BX1) / 2, (BY0 + BY1) / 2, 0); box.renderOrder = 4; s.rg.add(box);
      s.plate = new T.Mesh(new T.BoxGeometry(BX1 - BX0 + 0.5, 0.2, BZ * 2 + 0.5), M.paint(0x2b2f36)); s.plate.position.set((BX0 + BX1) / 2, 0.0, 0); s.plate.receiveShadow = true; s.rg.add(s.plate);
      s.glow = new T.Mesh(new T.PlaneGeometry(BX1 - BX0, BZ * 2), new T.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false })); s.glow.rotation.x = -Math.PI / 2; s.glow.position.set((BX0 + BX1) / 2, 0.115, 0); s.rg.add(s.glow);
      s.pel = new T.Group(); for (let i = 0; i < 9; i++) { const g = new T.Mesh(new T.BoxGeometry(0.22, 0.12, 0.2), M.brass()); g.position.set(BX0 + 0.5 + (i % 5) * 0.8, BY0 + 0.06, -0.9 + Math.floor(i / 5) * 0.5 + (i % 2) * 0.3); g.rotation.y = i; s.pel.add(g); } s.rg.add(s.pel);
      s.ri = new T.InstancedMesh(new T.SphereGeometry(1, 18, 12), new T.MeshPhysicalMaterial({ roughness: 0.25, clearcoat: 0.7 }), NR); s.ri.frustumCulled = false; s.rg.add(s.ri);
      /* equilibrium syringe */
      s.eg = new T.Group(); S.scene.add(s.eg);
      { const base = new T.Mesh(new T.CylinderGeometry(RC + 0.12, RC + 0.15, 0.2, 40), M.steel()); base.position.set(CX, 0.0, 0); s.eg.add(base); }
      const tube = new T.Mesh(new T.CylinderGeometry(RC, RC, 6.6, 48, 1, true), K.glassMat({ opacity: 0.06 })); tube.position.set(CX, 3.3, 0); tube.renderOrder = 4; s.eg.add(tube);
      s.gas = new T.Mesh(new T.CylinderGeometry(RC * 0.97, RC * 0.97, 1, 40), new T.MeshBasicMaterial({ color: 0x8a4a14, transparent: true, opacity: 0, depthWrite: false })); s.gas.renderOrder = 3; s.eg.add(s.gas);
      const pg = new T.Group(); pg.add(new T.Mesh(new T.CylinderGeometry(RC * 0.98, RC * 0.98, 0.2, 40), M.steel())); const rod = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 1.6, 12), M.chrome()); rod.position.y = 0.9; pg.add(rod); const kn = new T.Mesh(new T.SphereGeometry(0.2, 18, 14), M.paint(0xd23b2e)); kn.position.y = 1.75; pg.add(kn); s.piston = pg; s.eg.add(pg);
      s.heat = new T.Mesh(new T.RingGeometry(0.4, 1.2, 40), new T.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: 0, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false })); s.heat.rotation.x = -Math.PI / 2; s.heat.position.set(CX, 0.115, 0); s.eg.add(s.heat);
      s.ei = new T.InstancedMesh(new T.SphereGeometry(1, 18, 12), new T.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 0.6 }), NE); s.ei.frustumCulled = false; s.eg.add(s.ei);
      s.m4 = new T.Matrix4(); s.col = new T.Color(); init(S, s, c);
    },
    update(S, s, c, dt) {
      const rate = c.mode === "rate"; s.rg.visible = rate; s.eg.visible = !rate; if (rate) updRate(S, s, c, dt); else updEq(S, s, c, dt);
    },
    overlay(ctx, s, c, w, h, S) { if (c.mode === "rate") ovRate(ctx, s, c, S); else ovEq(ctx, s, c, S); },
    readouts(s, c) {
      if (c.mode === "rate") {
        const p = pReact(c.T, c.Ea, c.cat), p0 = pReact(298, c.Ea, c.cat), frac = Math.exp(-(c.Ea * 1000 * (c.cat ? 0.6 : 1)) / (R * c.T));
        return [["Temperature", c.T + " K · " + (c.T - 273).toFixed(0) + " °C"], ["Collisions A–B per s", (s.cr || 0).toFixed(1)], ["Successful per s (rate)", (s.er || 0).toFixed(2)], ["Fraction of collisions with E ≥ Eₐ  (e^(−Eₐ/RT))", frac.toExponential(2)], ["Rate compared with 298 K", "× " + (p / p0).toFixed(2)], ["Effective activation energy", (c.Ea * (c.cat ? 0.6 : 1)).toFixed(0) + " kJ/mol"], ["Product C formed", (s.nC | 0) + " of " + s.n0 + " A"], ["Concentration", "× " + c.conc.toFixed(1)]];
      }
      const V = c.V, a = s.nA / V, b = s.nB / V, Q = a > 1e-9 ? (b * b) / a : 0, kc = Kc(c.T), tot = 2 * s.nA + s.nB;
      return [["Kc at this T = [NO₂]²/[N₂O₄]", kc.toExponential(2) + " mol/dm³"], ["Reaction quotient Q", Q.toExponential(2)], ["Q compared with Kc", Math.abs(Q / kc - 1) < 0.03 ? "Q = Kc  (equilibrium)" : Q < kc ? "Q < Kc → forward" : "Q > Kc → reverse"], ["[N₂O₄]", a.toFixed(4) + " mol/dm³"], ["[NO₂]", b.toFixed(4) + " mol/dm³"], ["NO₂ share of the N atoms", (s.nB / Math.max(1e-9, tot) * 100).toFixed(0) + " %"], ["Volume / pressure", V.toFixed(1) + " dm³ · P ≈ " + ((s.nA + s.nB) * 0.08206 * c.T / V).toFixed(2) + " atm"], ["Temperature", c.T + " K"]];
    },
    steps(s, c) {
      if (c.mode === "rate") return [["Set the temperature, concentration and Eₐ; watch the collisions and the fraction that succeed", "done"], ["Raise the concentration → more collisions per second", ""], ["Raise T → faster molecules and a larger fraction with E ≥ Eₐ (rate roughly doubles per +10 K)", ""], ["Switch the catalyst on: the barrier drops, the rate climbs, nothing is used up", ""]];
      const eqm = s.q && Math.abs(s.q - 1) < 0.04; return [["Start with pure colourless N₂O₄ — brown NO₂ appears as it dissociates", "done"], ["Wait until the colour and the graph lines go flat: dynamic equilibrium, Q = Kc", eqm ? "done" : "now"], ["Apply a stress: heat it, squeeze the piston, add N₂O₄ or remove NO₂", eqm ? "now" : ""], ["Watch the new equilibrium: the system moves to oppose the change (Le Chatelier)", ""]];
    },
  };

  function init(S, s, c) {
    s.t = 0; s.hist = []; s.last = -9; s.cw = []; s.ew = []; s.cr = 0; s.er = 0;
    /* rate mode particles */
    const n = Math.round(8 + c.conc * 18); s.n0 = n; s.nC = 0; s.rp = [];
    for (let i = 0; i < 2 * n; i++) s.rp.push({ k: i < n ? 0 : 1, p: V3(U.rnd(BX0 + 0.3, BX1 - 0.3), U.rnd(BY0 + 0.3, BY1 - 0.3), U.rnd(-BZ + 0.3, BZ - 0.3)), v: V3(U.rnd(-1, 1), U.rnd(-1, 1), U.rnd(-1, 1)), on: true });
    s.rp.forEach((q) => q.v.set(gs(), gs(), gs()));
    /* equilibrium mode: pure N₂O₄ */
    s.nA = 0.04; s.nB = 0; s.hv = c.V; s.q = 0; s.ehist = []; s.elast = -9; s.eparts = []; s.eKind = "";
    for (let i = 0; i < 60; i++) s.eparts.push({ k: 0, p: V3(U.rnd(-RC * 0.8, RC * 0.8), U.rnd(0.2, 3), U.rnd(-RC * 0.8, RC * 0.8)), v: V3(gs(), gs(), gs()) });
  }
  function gs() { return (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.7; }

  /* ============================================================ RATE */
  function updRate(S, s, c, dt) {
    const tk = c.T, sp = Math.sqrt(tk / 298) * 0.55, p = pReact(tk, c.Ea, c.cat), P = s.rp; s.pel.visible = !!c.cat;
    if (dt > 0) { s.t += dt; const steps = Math.max(1, Math.ceil(dt / 0.02)), h = dt / steps; for (let st = 0; st < steps; st++) stepRate(s, h, sp, p); }
    /* windowed rates (events in the last 4 s) */
    const t = s.t; s.cw = s.cw.filter((x) => t - x < 4); s.ew = s.ew.filter((x) => t - x < 4); const win = Math.min(4, Math.max(0.5, t)); s.cr = s.cw.length / win; s.er = s.ew.length / win;
    for (let i = 0; i < NR; i++) {
      const q = P[i]; if (!q || !q.on) { s.m4.makeScale(0, 0, 0); s.ri.setMatrixAt(i, s.m4); continue; }
      const r = q.k === 2 ? RP * 1.25 : RP; s.m4.makeScale(r, r, r); s.m4.setPosition(q.p.x, q.p.y, q.p.z); s.ri.setMatrixAt(i, s.m4); s.col.set(q.k === 0 ? 0xff5a4a : q.k === 1 ? 0x4a8dff : 0xffd24a); s.ri.setColorAt(i, s.col);
    }
    s.ri.instanceMatrix.needsUpdate = true; s.ri.instanceColor && (s.ri.instanceColor.needsUpdate = true);
    const hot = clamp((tk - 273) / 100, 0, 1); s.glow.material.color.setRGB(tk < 290 ? 0.2 : 1, tk < 290 ? 0.5 : 0.35, tk < 290 ? 1 : 0.1); s.glow.material.opacity = tk < 290 ? 0.16 : 0.05 + 0.4 * hot;
    if (t - s.last >= 0.5 && dt > 0) { s.last = t; s.hist.push([t, s.nC]); if (s.hist.length > 400) s.hist.shift(); }
  }
  function stepRate(s, h, sp, p) {
    const P = s.rp, n = P.length;
    for (let i = 0; i < n; i++) {
      const q = P[i]; if (!q.on) continue; q.p.addScaledVector(q.v, h * sp);
      if (q.p.x < BX0 + RP) { q.p.x = BX0 + RP; q.v.x = Math.abs(q.v.x); } else if (q.p.x > BX1 - RP) { q.p.x = BX1 - RP; q.v.x = -Math.abs(q.v.x); }
      if (q.p.y < BY0 + RP) { q.p.y = BY0 + RP; q.v.y = Math.abs(q.v.y); } else if (q.p.y > BY1 - RP) { q.p.y = BY1 - RP; q.v.y = -Math.abs(q.v.y); }
      if (q.p.z < -BZ + RP) { q.p.z = -BZ + RP; q.v.z = Math.abs(q.v.z); } else if (q.p.z > BZ - RP) { q.p.z = BZ - RP; q.v.z = -Math.abs(q.v.z); }
    }
    const D2 = 4 * RP * RP;
    for (let i = 0; i < n; i++) { const a = P[i]; if (!a.on) continue; for (let j = i + 1; j < n; j++) { const b = P[j]; if (!b.on) continue; const dx = a.p.x - b.p.x; if (dx > 0.3 || dx < -0.3) continue; const dy = a.p.y - b.p.y, dz = a.p.z - b.p.z, d2 = dx * dx + dy * dy + dz * dz; if (d2 >= D2 || d2 < 1e-8) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, nz = dz / d, vn = (a.v.x - b.v.x) * nx + (a.v.y - b.v.y) * ny + (a.v.z - b.v.z) * nz; if (vn >= 0) continue;
        const ab = (a.k === 0 && b.k === 1) || (a.k === 1 && b.k === 0);
        if (ab) { s.cw.push(s.t); if (Math.random() < p) { a.k = 2; b.on = false; s.nC++; s.ew.push(s.t); s.flash = s.t; continue; } }
        a.v.x -= vn * nx; a.v.y -= vn * ny; a.v.z -= vn * nz; b.v.x += vn * nx; b.v.y += vn * ny; b.v.z += vn * nz; const ov = (2 * RP - d) / 2; a.p.x += nx * ov; a.p.y += ny * ov; a.p.z += nz * ov; b.p.x -= nx * ov; b.p.y -= ny * ov; b.p.z -= nz * ov; } }
  }
  function ovRate(ctx, s, c, S) {
    H.pill(ctx, 10, 22, "A + B → C        rate = Δ[C]/Δt        k = A·e^(−Eₐ/RT)", "#ffe9b8", 11.5); H.pill(ctx, 10, 44, "R = 8.314 J mol⁻¹ K⁻¹  ·  Eₐ in kJ mol⁻¹  ·  T in K  ·  effective collision needs E ≥ Eₐ and the right orientation", "#bcd0ea", 9);
    const lg = [["A", "#ff5a4a"], ["B", "#4a8dff"], ["C (product)", "#ffd24a"]]; lg.forEach(([t, col], i) => { const x = 14 + i * 64; ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, 72, 5, 0, TAU); ctx.fill(); ctx.restore(); H.pill(ctx, x + 8, 76, t, "#dbe7ff", 9.5); });
    /* energy distribution (schematic scale) */
    const gx = 388, gy = 58, gw = 250, gh = 140; H.panel(ctx, gx, gy, gw, gh); const px = gx + 12, py = gy + 24, pw = gw - 24, ph = gh - 48, xmax = 1;
    const kT = 0.075 * (c.T / 298), Ea = (c.Ea / 50) * 0.38 * (c.cat ? 0.6 : 1), Ea0 = (c.Ea / 50) * 0.38, f = (E) => Math.sqrt(E) * Math.exp(-E / kT), pk = f(kT / 2) * 1.12;
    ctx.save(); ctx.font = "600 9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#cfe0ff"; ctx.textAlign = "left"; ctx.fillText("molecular energy distribution (schematic)", gx + 8, gy + 13);
    ctx.beginPath(); ctx.moveTo(px + Ea * pw, py + ph); for (let i = Math.round(Ea * 100); i <= 100; i++) { const E = i / 100 * xmax; ctx.lineTo(px + (E / xmax) * pw, py + ph - clamp(f(E) / pk, 0, 1) * ph); } ctx.lineTo(px + pw, py + ph); ctx.closePath(); ctx.fillStyle = "rgba(255,150,90,.55)"; ctx.fill();
    ctx.strokeStyle = "#7fd0ff"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i <= 100; i++) { const E = i / 100 * xmax, x = px + (E / xmax) * pw, y = py + ph - clamp(f(E) / pk, 0, 1) * ph; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.setLineDash([4, 3]); ctx.strokeStyle = "#ffd27a"; ctx.beginPath(); ctx.moveTo(px + Ea * pw, py - 4); ctx.lineTo(px + Ea * pw, py + ph); ctx.stroke(); if (c.cat) { ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.beginPath(); ctx.moveTo(px + Ea0 * pw, py - 4); ctx.lineTo(px + Ea0 * pw, py + ph); ctx.stroke(); }
    ctx.setLineDash([]); ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.strokeRect(px, py, pw, ph); ctx.fillStyle = "#ffd27a"; ctx.textAlign = "left"; ctx.fillText("Eₐ" + (c.cat ? " (catalysed)" : ""), px + Ea * pw + 3, py + 7); ctx.fillStyle = "#bcd0ea"; ctx.textAlign = "right"; ctx.fillText("energy →", px + pw, py + ph + 11); ctx.textAlign = "left"; ctx.fillText("shaded = molecules with E ≥ Eₐ", px, py + ph + 11); ctx.restore();
    /* product vs time */
    const hx = 388, hy = 208, hw = 250, hh = 150, tmax = Math.max(30, Math.ceil(s.t / 10) * 10), ymax = Math.max(10, Math.ceil(s.n0 / 10) * 10);
    H.graph(ctx, hx, hy, hw, hh, { series: [{ pts: s.hist, color: "#ffd24a", width: 2.4 }], xmin: 0, xmax: tmax, ymin: 0, ymax, ticksX: 4, ticksY: 4, xl: "time / s", yl: "C formed (particles)" });
    H.pill(ctx, 10, 366, "collisions A–B: " + s.cr.toFixed(1) + " /s   ·   successful: " + s.er.toFixed(2) + " /s", "#ffb199", 10.5); H.pill(ctx, 10, 386, "p(success) = " + (pReact(c.T, c.Ea, c.cat) * 100).toFixed(1) + " % of A–B collisions", "#7dffbd", 10);
  }

  /* ============================================================ EQUILIBRIUM */
  function updEq(S, s, c, dt) {
    const tk = c.T, V = c.V, kc = Kc(tk), kF = kf(tk), kR = kF / kc;
    if (dt > 0) { const sim = dt * 2.0, n = Math.max(1, Math.ceil(sim / 0.004)), h = sim / n; s.t += sim; for (let i = 0; i < n; i++) { const a = s.nA / V, b = s.nB / V, r = kF * a - kR * b * b, dn = r * V * h; s.nA = Math.max(0, s.nA - dn); s.nB = Math.max(0, s.nB + 2 * dn); } }
    const a = s.nA / V, b = s.nB / V; s.q = a > 1e-9 ? (b * b / a) / kc : 0; s.hv += (V - s.hv) * Math.min(1, dt * 5 + (dt ? 0 : 1)); const ht = s.hv * 1.0;
    s.piston.position.set(CX, ht + 0.1, 0); s.gas.scale.y = ht; s.gas.position.set(CX, ht / 2 + 0.1, 0); s.gas.material.opacity = clamp(b / 0.014 * 0.55, 0, 0.7);
    s.heat.material.color.setRGB(tk < 290 ? 0.2 : 1, tk < 290 ? 0.5 : 0.35, tk < 290 ? 1 : 0.1); s.heat.material.opacity = tk < 290 ? 0.35 : 0.08 + 0.55 * clamp((tk - 273) / 100, 0, 1);
    /* particles: 80 NO₂-equivalents; N₂O₄ = pale double-size sphere, NO₂ = brown */
    const tot = 2 * s.nA + s.nB, nb = Math.round(80 * s.nB / Math.max(1e-9, tot)), na = Math.round((80 - nb) / 2), P = s.eparts, sp = Math.sqrt(tk / 298) * 0.5;
    let cA = 0, cB = 0; P.forEach((q) => (q.k === 0 ? cA++ : cB++));
    while (cA < na || cB < nb) { if (cA < na) { const q = P.find((x) => x.k === 1); if (q && cB > nb) { q.k = 0; cA++; cB--; continue; } P.push({ k: 0, p: V3(U.rnd(-RC * 0.8, RC * 0.8), U.rnd(0.2, ht), U.rnd(-RC * 0.8, RC * 0.8)), v: V3(gs(), gs(), gs()) }); cA++; continue; } if (cB < nb) { const q = P.find((x) => x.k === 0); if (q && cA > na) { q.k = 1; cB++; cA--; continue; } P.push({ k: 1, p: V3(U.rnd(-RC * 0.8, RC * 0.8), U.rnd(0.2, ht), U.rnd(-RC * 0.8, RC * 0.8)), v: V3(gs(), gs(), gs()) }); cB++; continue; } break; }
    while (cA > na) { const i = P.findIndex((x) => x.k === 0); if (i < 0) break; P.splice(i, 1); cA--; }
    while (cB > nb) { const i = P.findIndex((x) => x.k === 1); if (i < 0) break; P.splice(i, 1); cB--; }
    if (cA > na && cB < nb) { /* handled above */ }
    s.cnt = [cA, cB];
    for (let i = 0; i < NE; i++) {
      const q = P[i]; if (!q) { s.m4.makeScale(0, 0, 0); s.ei.setMatrixAt(i, s.m4); continue; }
      if (dt > 0) { q.p.addScaledVector(q.v, dt * sp); const r = Math.hypot(q.p.x, q.p.z), lim = RC - 0.15; if (r > lim) { const nx = q.p.x / r, nz = q.p.z / r, vn = q.v.x * nx + q.v.z * nz; q.p.x = nx * lim; q.p.z = nz * lim; if (vn > 0) { q.v.x -= 2 * vn * nx; q.v.z -= 2 * vn * nz; } } if (q.p.y < 0.2) { q.p.y = 0.2; q.v.y = Math.abs(q.v.y); } else if (q.p.y > ht - 0.1) { q.p.y = ht - 0.1; q.v.y = -Math.abs(q.v.y); } }
      const rr = q.k === 0 ? 0.17 : 0.1; s.m4.makeScale(rr, rr, rr); s.m4.setPosition(CX + q.p.x, q.p.y, q.p.z); s.ei.setMatrixAt(i, s.m4); s.col.set(q.k === 0 ? 0xcfe4ff : 0xb5651d); s.ei.setColorAt(i, s.col);
    }
    s.ei.instanceMatrix.needsUpdate = true; s.ei.instanceColor && (s.ei.instanceColor.needsUpdate = true);
    if (s.t - s.elast >= 0.25 && dt > 0) { s.elast = s.t; s.ehist.push([s.t, a, b]); if (s.ehist.length > 260) s.ehist.shift(); }
  }
  function ovEq(ctx, s, c, S) {
    const kc = Kc(c.T), V = c.V;
    H.pill(ctx, 10, 22, "N₂O₄(g)  ⇌  2NO₂(g)      ΔH = +57 kJ/mol (forward endothermic)", "#ffe9b8", 11.5); H.pill(ctx, 10, 44, "Kc = [NO₂]² ÷ [N₂O₄]   ·   Q = Kc at equilibrium   ·   Kc rises with T (van ’t Hoff)", "#bcd0ea", 9.5);
    const lg = [["N₂O₄ colourless", "#cfe4ff"], ["NO₂ brown", "#b5651d"]]; lg.forEach(([t, col], i) => { const x = 14 + i * 116; ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, 72, 5, 0, TAU); ctx.fill(); ctx.restore(); H.pill(ctx, x + 8, 76, t, "#dbe7ff", 9.5); });
    const q = S.proj(V3(CX, s.hv + 2.2, 0)); H.pill(ctx, q.x, clamp(q.y, 90, 320), "V = " + V.toFixed(1) + " dm³", "#cfe0ff", 10.5, "center");
    const eqm = Math.abs(s.q - 1) < 0.04; H.pill(ctx, 10, 366, eqm ? "DYNAMIC EQUILIBRIUM — both reactions continue at equal rates" : s.q < 1 ? "Q < Kc → net forward reaction (making NO₂)" : "Q > Kc → net reverse reaction (making N₂O₄)", eqm ? "#7dffbd" : "#ffd27a", 10.5);
    H.pill(ctx, 10, 386, "Kc(" + c.T + " K) = " + kc.toExponential(2) + "   ·   Q = " + (s.q * kc).toExponential(2), "#9fe3ff", 10);
    const gx = 388, gy = 58, gw = 250, gh = 190, tmax = Math.max(20, Math.ceil(s.t / 10) * 10), t0 = Math.max(0, s.t - 40), ymax = 0.02;
    const win = s.ehist.filter((p) => p[0] >= t0), ym = Math.max(20, Math.ceil(Math.max(...win.map((p) => Math.max(p[1], p[2])), 0) * 1150 / 10) * 10);
    H.graph(ctx, gx, gy, gw, gh, { series: [{ pts: win.map((p) => [p[0], p[1] * 1000]), color: "#cfe4ff", width: 2.4 }, { pts: win.map((p) => [p[0], p[2] * 1000]), color: "#d9843a", width: 2.4 }], xmin: Math.floor(t0), xmax: Math.floor(t0) + 40, ymin: 0, ymax: ym, ticksX: 4, ticksY: 4, xl: "time / s", yl: "conc / 10⁻³ mol dm⁻³" });
    ctx.save(); ctx.font = "600 9px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; ctx.fillStyle = "#cfe4ff"; ctx.fillText("[N₂O₄]", gx + 40, gy + 28); ctx.fillStyle = "#d9843a"; ctx.fillText("[NO₂]", gx + 90, gy + 28); ctx.restore();
    H.pill(ctx, gx + gw, gy + gh + 17, "flat lines = equilibrium", "#bcd0ea", 9.5, "right");
  }
})();
