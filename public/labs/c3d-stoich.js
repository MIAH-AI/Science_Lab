/* c3d-stoich.js — chemistry 3D, new module: reacting masses, limiting reagent, theoretical and percentage yield */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = (t) => t * t * (3 - 2 * t);
  const BOX = 1.35;
  /* species: [formula, coefficient, molar mass] */
  const RX = {
    water: { eq: "2H₂ + O₂ → 2H₂O", A: ["H₂", 2, 2.016], B: ["O₂", 1, 32.0], P: ["H₂O", 2, 18.015], ma: 4, mb: 24, note: "hydrogen burns in oxygen" },
    haber: { eq: "N₂ + 3H₂ → 2NH₃", A: ["N₂", 1, 28.014], B: ["H₂", 3, 2.016], P: ["NH₃", 2, 17.031], ma: 28, mb: 4, note: "the Haber process (ideal 100 % conversion)" },
    marble: { eq: "CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂", A: ["CaCO₃", 1, 100.09], B: ["HCl", 2, 36.46], P: ["CO₂", 1, 44.01], ma: 10, mb: 5, note: "marble chips and hydrochloric acid give carbon dioxide gas" },
    thermite: { eq: "4Al + 3O₂ → 2Al₂O₃", A: ["Al", 4, 26.98], B: ["O₂", 3, 32.0], P: ["Al₂O₃", 2, 101.96], ma: 27, mb: 16, note: "aluminium burns in oxygen" },
  };
  const NP = 150;
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  function calc(c) {
    const r = RX[c.rx], nA = c.mA / r.A[2], nB = c.mB / r.B[2], xA = nA / r.A[1], xB = nB / r.B[1], xi = Math.min(xA, xB), lim = xA <= xB ? "A" : "B";
    const nP = xi * r.P[1], theo = nP * r.P[2], act = theo * c.yld / 100, leftA = nA - xi * r.A[1], leftB = nB - xi * r.B[1], exc = lim === "A" ? "B" : "A";
    return { r, nA, nB, xA, xB, xi, lim, nP, theo, act, leftA, leftB, exc, mLeft: lim === "A" ? leftB * r.B[2] : leftA * r.A[2] };
  }

  C3.scenes.stoichiometry = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.85, fov: 36, free: true, cam: [[1.6, 2.6, 8.6], [1.6, 1.7, 0]],
    values: { rx: "water", mA: 4, mB: 24, yld: 100 },
    state: () => ({ t: 0, run: false, done: false }),
    get controls() {
      return [
        { type: "select", key: "rx", label: "Reaction", options: Object.keys(RX).map((k) => ({ value: k, label: RX[k].eq })) },
        { type: "range", key: "mA", label: "Mass of reactant A (g)", min: 1, max: 60, step: 0.5, unit: " g" },
        { type: "range", key: "mB", label: "Mass of reactant B (g)", min: 1, max: 60, step: 0.5, unit: " g" },
        { type: "range", key: "yld", label: "Percentage yield achieved (%)", min: 40, max: 100, step: 1, unit: " %" },
        { type: "button", label: "Start the reaction", action: (S, s) => { s.t = 0; s.run = true; s.done = false; } },
        { type: "button", label: "Reset the mixture", cls: "secondary", action: (S, s) => { s.t = 0; s.run = false; s.done = false; } },
      ];
    },
    views: [{ label: "Reaction vessel", cam: [[1.6, 2.6, 8.6], [1.6, 1.7, 0]] }, { label: "Close", cam: [[1.0, 2.4, 6.2], [1.4, 1.7, 0]] }],
    note: "Reacting masses: convert each mass to moles (n = m ÷ M), then use the coefficients of the balanced equation. Divide each amount by its coefficient: the smaller number belongs to the limiting reagent, which is used up first and decides how much product forms. The other reactant is in excess and some is left over. Theoretical yield = moles of product × M. Percentage yield = actual yield ÷ theoretical yield × 100. Particle counts are scaled so that the mole ratio is respected; the picture is not to scale in size.",
    onChange(S, s, c, key) { if (key === "rx") { c.mA = RX[c.rx].ma; c.mB = RX[c.rx].mb; } s.t = 0; s.run = false; s.done = false; },
    reset(S, s, c) { Object.assign(c, { rx: "water", mA: 4, mB: 24, yld: 100 }); s.t = 0; s.run = false; s.done = false; },
    table(s, c) {
      const k = calc(c), r = k.r;
      return '<table class="c3-table"><tr><th style="text-align:left">Species</th><th>coefficient</th><th>M / g mol⁻¹</th><th>mass / g</th><th>moles</th><th>moles ÷ coefficient</th></tr>' +
        '<tr><td style="text-align:left">A: ' + r.A[0] + "</td><td>" + r.A[1] + "</td><td>" + r.A[2] + "</td><td>" + c.mA.toFixed(2) + "</td><td>" + k.nA.toFixed(4) + "</td><td>" + k.xA.toFixed(4) + (k.lim === "A" ? " ← limiting" : "") + "</td></tr>" +
        '<tr><td style="text-align:left">B: ' + r.B[0] + "</td><td>" + r.B[1] + "</td><td>" + r.B[2] + "</td><td>" + c.mB.toFixed(2) + "</td><td>" + k.nB.toFixed(4) + "</td><td>" + k.xB.toFixed(4) + (k.lim === "B" ? " ← limiting" : "") + "</td></tr>" +
        '<tr><td style="text-align:left">Product: ' + r.P[0] + "</td><td>" + r.P[1] + "</td><td>" + r.P[2] + "</td><td>" + k.theo.toFixed(2) + " (theoretical)</td><td>" + k.nP.toFixed(4) + "</td><td>actual " + k.act.toFixed(2) + " g at " + c.yld + " %</td></tr></table>";
    },
    build(S, s, c) {
      S.mk.box(9, 0.1, 4, M.matte(0x1d222b, 0.7), 1.0, -0.05, 0); S.mk.rbox(3.4, 0.15, 3.4, 0.04, M.matte(0x2a2e36, 0.6), 0, 0.075, 0);
      const g = new T.BoxGeometry(BOX * 2, BOX * 2, BOX * 2); s.cube = new T.Mesh(g, new T.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.09, roughness: 0.05, depthWrite: false })); s.cube.position.set(0, 0.15 + BOX, 0); S.scene.add(s.cube);
      s.edges = new T.LineSegments(new T.EdgesGeometry(g), new T.LineBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: 0.55 })); s.edges.position.copy(s.cube.position); S.scene.add(s.edges);
      const mk = (col, r) => { const m = new T.InstancedMesh(new T.SphereGeometry(r, 14, 10), new T.MeshStandardMaterial({ color: col, roughness: 0.3 }), NP); m.frustumCulled = false; S.scene.add(m); return m; };
      s.mA = mk(0x4aa8ff, 0.11); s.mB = mk(0xffa040, 0.1); s.mP = mk(0x56e08a, 0.12);
      s.p = []; for (let i = 0; i < NP * 3; i++) s.p.push({ x: (Math.random() * 2 - 1) * (BOX - 0.15), y: (Math.random() * 2 - 1) * (BOX - 0.15), z: (Math.random() * 2 - 1) * (BOX - 0.15), vx: Math.random() * 2 - 1, vy: Math.random() * 2 - 1, vz: Math.random() * 2 - 1 });
      s.m4 = new T.Matrix4(); s.cnt = [0, 0, 0];
    },
    update(S, s, c, dt) {
      const k = calc(c), r = k.r; if (s.run && dt > 0) { s.t += dt / 6; if (s.t >= 1) { s.t = 1; s.run = false; s.done = true; } }
      /* particle numbers scaled so the mole ratio is kept */
      const sc = 70 / Math.max(k.nA, k.nB, 1e-9); const a0 = Math.max(1, Math.round(k.nA * sc)), b0 = Math.max(1, Math.round(k.nB * sc)), maxA = Math.min(a0, NP), maxB = Math.min(b0, NP);
      const xp = Math.min(Math.floor(maxA / r.A[1]), Math.floor(maxB / r.B[1])), evNow = Math.floor(xp * (c.yld / 100) * ease(s.t));
      const nA = Math.max(0, maxA - r.A[1] * evNow), nB = Math.max(0, maxB - r.B[1] * evNow), nP = Math.min(NP, r.P[1] * evNow); s.cnt = [nA, nB, nP]; s.sc = sc;
      const dts = Math.min(dt, 0.05), m4 = s.m4; let ia = 0, ib = 0, ip = 0;
      for (let i = 0; i < NP * 3; i++) { const q = s.p[i]; if (dts > 0) { q.x += q.vx * dts * 1.3; q.y += q.vy * dts * 1.3; q.z += q.vz * dts * 1.3; const L = BOX - 0.12; if (Math.abs(q.x) > L) { q.vx = -q.vx; q.x = Math.sign(q.x) * L; } if (Math.abs(q.y) > L) { q.vy = -q.vy; q.y = Math.sign(q.y) * L; } if (Math.abs(q.z) > L) { q.vz = -q.vz; q.z = Math.sign(q.z) * L; } }
        m4.makeTranslation(q.x, 0.15 + BOX + q.y, q.z); if (i < NP) { if (i < nA) s.mA.setMatrixAt(ia++, m4); } else if (i < 2 * NP) { if (i - NP < nB) s.mB.setMatrixAt(ib++, m4); } else if (i - 2 * NP < nP) s.mP.setMatrixAt(ip++, m4); }
      s.mA.count = ia; s.mB.count = ib; s.mP.count = ip; s.mA.instanceMatrix.needsUpdate = s.mB.instanceMatrix.needsUpdate = s.mP.instanceMatrix.needsUpdate = true; s.k = k; s.ev = evNow; s.xp = xp;
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250, k = s.k || calc(c), r = k.r;
      H.pill(ctx, 10, 22, r.eq, "#ffe9b8", 11); H.pill(ctx, 10, 44, r.note + ": " + (k.lim === "A" ? r.A[0] : r.B[0]) + " is the limiting reagent", "#9fe3ff", 9.5);
      const q = S.proj(V3(0, 3.1, 0)); H.pill(ctx, q.x, q.y, "● " + r.A[0] + ": " + (s.cnt ? s.cnt[0] : 0) + "   ● " + r.B[0] + ": " + (s.cnt ? s.cnt[1] : 0) + "   ● " + r.P[0] + ": " + (s.cnt ? s.cnt[2] : 0), "#bcd0ea", 8.5, "center");
      const frac = clamp(s.t, 0, 1), ez = ease(frac);
      H.panel(ctx, px, 58, 240, 112); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Step 1: moles = mass ÷ M", px + 8, 73); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff";
      ctx.fillText(r.A[0] + ": " + c.mA.toFixed(1) + " ÷ " + r.A[2] + " = " + k.nA.toFixed(3) + " mol", px + 8, 88); ctx.fillText(r.B[0] + ": " + c.mB.toFixed(1) + " ÷ " + r.B[2] + " = " + k.nB.toFixed(3) + " mol", px + 8, 102);
      ctx.fillStyle = "#8fb4ff"; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillText("Step 2: ÷ coefficient", px + 8, 120); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = k.lim === "A" ? "#ffd27a" : "#e8f0ff"; ctx.fillText(r.A[0] + ": " + k.nA.toFixed(3) + " ÷ " + r.A[1] + " = " + k.xA.toFixed(3) + (k.lim === "A" ? "  limiting" : ""), px + 8, 134); ctx.fillStyle = k.lim === "B" ? "#ffd27a" : "#e8f0ff"; ctx.fillText(r.B[0] + ": " + k.nB.toFixed(3) + " ÷ " + r.B[1] + " = " + k.xB.toFixed(3) + (k.lim === "B" ? "  limiting" : ""), px + 8, 148); ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText("smaller value = limiting reagent", px + 8, 162);
      H.panel(ctx, px, 176, 240, 128); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Step 3: yield of " + r.P[0], px + 8, 191); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText("n(" + r.P[0] + ") = " + k.xi.toFixed(3) + " × " + r.P[1] + " = " + k.nP.toFixed(3) + " mol", px + 8, 206); ctx.fillText("theoretical = " + k.nP.toFixed(3) + " × " + r.P[2] + " = " + k.theo.toFixed(2) + " g", px + 8, 220); ctx.fillStyle = "#8dffb8"; ctx.fillText("actual = " + k.act.toFixed(2) + " g  (" + c.yld + " % yield)", px + 8, 234);
      ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; wrapT(ctx, "excess " + (k.exc === "A" ? r.A[0] : r.B[0]) + " left over: " + k.mLeft.toFixed(2) + " g", px + 8, 250, 224, 10.5);
      const bw = 200; ctx.fillStyle = "rgba(143,180,255,0.15)"; ctx.fillRect(px + 8, 270, bw, 9); ctx.fillStyle = "#56e08a"; ctx.fillRect(px + 8, 270, bw * ez, 9); ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText("reaction progress " + (ez * 100).toFixed(0) + " %", px + 8, 294);
      ctx.restore();
    },
    readouts(s, c) {
      const k = s.k || calc(c), r = k.r; return [["Balanced equation", r.eq], ["n(" + r.A[0] + "), n(" + r.B[0] + ")", k.nA.toFixed(3) + " mol, " + k.nB.toFixed(3) + " mol"], ["Limiting reagent", (k.lim === "A" ? r.A[0] : r.B[0]) + " (used up first)"], ["Excess reagent left", (k.exc === "A" ? r.A[0] : r.B[0]) + ", " + k.mLeft.toFixed(2) + " g"], ["Theoretical yield of " + r.P[0], k.theo.toFixed(2) + " g"], ["Actual yield", k.act.toFixed(2) + " g"], ["Percentage yield", c.yld + " %  = actual ÷ theoretical × 100"]];
    },
    steps(s, c) { return [["Write and balance the equation", "done"], ["Convert masses to moles (n = m ÷ M)", "done"], ["Divide by coefficients: the smaller is the limiting reagent", "now"], ["Start the reaction and find the theoretical and actual yield", s.done ? "done" : ""]]; },
  };
})();
