/* p2d-fields.js — Topics 24–28: Newton's law of gravitation & g, charging by friction/contact/induction,
   electroscope & lightning conductor, field & potential of a point charge, capacitors in series/parallel & energy,
   cells, ohmic vs non-ohmic conductors, electrical energy/power & fuses, shunt & multiplier, metre bridge & potentiometer,
   magnetisation & demagnetisation, Earth's magnetic field (dip & declination), force on a moving charge,
   self-inductance, eddy currents, power transmission, a.c. phasors & power factor. */
window.PX.push(function () {
  const K = window.PK, C = K.C, { txt, line, rect, circ, arr, panel, notes, axes, plot, f, clamp, rad, deg } = K;
  const gl = (ctx, pts, col, w = 2.2) => (typeof glowLine === "function" ? glowLine(ctx, pts, col, w, 6) : K.poly(ctx, pts, col, null, w, false));
  const res = (ctx, x1, y1, x2, y2, lab) => { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, hor = Math.abs(x2 - x1) > Math.abs(y2 - y1); line(ctx, x1, y1, hor ? mx - 22 : x1, hor ? y1 : my - 22, C.chalk, 2); line(ctx, hor ? mx + 22 : x2, hor ? y2 : my + 22, x2, y2, C.chalk, 2); if (hor) rect(ctx, mx - 22, my - 8, 44, 16, "#141e2e", C.amber, 2); else rect(ctx, mx - 8, my - 22, 16, 44, "#141e2e", C.amber, 2); if (lab) txt(ctx, mx, hor ? my - 12 : my, lab, C.amber, 10, hor ? "center" : "left"); };
  const meter = (ctx, x, y, r, frac, lab, val) => { circ(ctx, x, y, r, "#141e2e", C.teal, 2); const a = -Math.PI * 0.8 + clamp(frac, 0, 1) * Math.PI * 0.6 + Math.PI * 0.5 - Math.PI * 0.2; line(ctx, x, y, x + r * 0.8 * Math.cos(-Math.PI / 2 + (clamp(frac, 0, 1) - 0.5) * 1.6), y + r * 0.8 * Math.sin(-Math.PI / 2 + (clamp(frac, 0, 1) - 0.5) * 1.6), C.red, 2); txt(ctx, x, y + 5, lab, C.teal, 12, "center", true); if (val) txt(ctx, x, y + r + 14, val, C.chalk, 10.5, "center"); };

  /* ---------- T24 Newton's law of gravitation and g ---------- */
  K.add("24", {
    modeName: "Newton's Law of Gravitation & g", tag: "F = Gm₁m₂/r² · g = GM/R²", eqn: "F = G·m₁·m₂ / r²   (G = 6.67 × 10⁻¹¹ N·m²/kg²)   g = F/m = GM/R²",
    controls: [K.sel("pl", "Planet", ["Earth", "Moon", "Mars", "Jupiter"], 0), K.rng("h", "Height above surface", 0, 40000, 100, 0, " km"), K.rng("m", "Test mass", 1, 100, 1, 60, " kg")],
    P: [["Earth", 5.97e24, 6.37e6], ["Moon", 7.35e22, 1.74e6], ["Mars", 6.42e23, 3.39e6], ["Jupiter", 1.9e27, 6.99e7]],
    draw(ctx, s, c) {
      const [nm, M, R] = this.P[c.pl], r = R + c.h * 1000, g = (K.G * M) / (r * r), F = c.m * g, g0 = (K.G * M) / (R * R);
      const cx = 140, cy = 200, Rp = 60; circ(ctx, cx, cy, Rp, ["#2a6ab8", "#b8b8c0", "#c8603a", "#d8a878"][c.pl], "#fff", 1); const rp = Rp + (c.h / 40000) * 200; circ(ctx, cx + rp, cy, 7, C.amber); arr(ctx, cx + rp - 10, cy, cx + rp - 10 - clamp(g * 4, 6, 80), cy, C.red); txt(ctx, cx + rp, cy - 14, f(F, 1) + " N", C.red, 10.5, "center"); line(ctx, cx, cy, cx + rp, cy, C.dim, 1, [3, 3]); txt(ctx, cx + rp / 2, cy + 16, "r = " + K.sci(r, 2) + " m", C.dim, 10, "center");
      const A = axes(ctx, 360, 50, 250, 170, { x0: 1, x1: 7, y0: 0, y1: g0 * 1.05, nx: 6, xl: "distance from centre (× R)", yl: "g (N/kg)", title: "g falls as 1/r² outside the planet" }); plot(ctx, A, (x) => g0 / (x * x), 1, 7, C.teal); circ(ctx, A.X(clamp(r / R, 1, 7)), A.Y(g), 5, C.amber);
      notes(ctx, 360, 260, 265, [["g at this height = " + f(g, 3) + " N/kg", C.amber], "Surface g = GM/R² = " + f(g0, 2) + " N/kg", "Weight of " + c.m + " kg here = mg = " + f(F, 1) + " N", "Double the distance from the centre → force falls to ¼ (inverse-square law).", "g is the gravitational field intensity: force per unit mass."], 10.5);
    },
    readouts(s, c) { const [nm, M, R] = this.P[c.pl], r = R + c.h * 1000, g = (K.G * M) / (r * r); return [["g here", f(g, 3) + " N/kg"], ["Force on mass", f(c.m * g, 1) + " N"], ["Distance from centre", f(r / R, 2) + " R"]]; },
  });

  /* ---------- T25 Production of charges ---------- */
  K.add("25", {
    modeName: "Charging by Friction, Contact & Induction", tag: "ELECTROSTATICS", eqn: "Rubbing transfers electrons · contact shares charge · induction separates charge without touching (then earth it)",
    controls: [K.sel("m", "Method", ["Friction: rubbing a polythene rod with wool", "Contact: charged rod touches a metal sphere", "Induction: rod near sphere, sphere earthed, earth removed, rod removed"], 0), K.rng("st", "Step", 0, 3, 1, 0)],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; },
    draw(ctx, s, c) {
      const plus = (x, y) => txt(ctx, x, y + 4, "+", C.red, 14, "center", true), minus = (x, y) => txt(ctx, x, y + 4, "−", C.blue, 16, "center", true); let msg = "";
      if (c.m === 0) { const rubbed = c.st >= 1; rect(ctx, 80, 170, 220, 22, "#e8e8f0", "#888"); const wx = 120 + (c.st === 1 ? 60 * Math.sin(s.t * 8) : 0); rect(ctx, wx, 150, 60, 60, "rgba(200,120,90,.7)"); if (rubbed) { for (let i = 0; i < 8; i++) minus(100 + i * 25, 182); for (let i = 0; i < 6; i++) plus(wx + 10 + (i % 3) * 18, 168 + Math.floor(i / 3) * 24); } msg = rubbed ? "Electrons move from the wool to the polythene: rod becomes negative, wool equally positive. (Glass rubbed with silk becomes positive.)" : "Both start neutral (equal + and −)."; }
      else if (c.m === 1) { circ(ctx, 300, 200, 50, "#8a8f99", "#ccc"); const touch = c.st >= 1, away = c.st >= 2; const rx = away ? 60 : touch ? 170 : 110; rect(ctx, rx, 190, 80, 20, "#e8e8f0", "#888"); for (let i = 0; i < (touch ? 3 : 6); i++) minus(rx + 10 + i * 12, 202); if (touch) for (let i = 0; i < 6; i++) { const a = (i / 6) * K.TAU; minus(300 + 40 * Math.cos(a), 200 + 40 * Math.sin(a)); } msg = touch ? "Electrons flow onto the sphere: it gains the SAME sign of charge as the rod (shared)." : "Bring the negatively charged rod to the sphere."; }
      else { circ(ctx, 320, 200, 50, "#8a8f99", "#ccc"); const st = c.st; if (st < 3) { rect(ctx, 150, 190, 100, 20, "#e8e8f0", "#888"); for (let i = 0; i < 6; i++) minus(160 + i * 15, 202); } if (st === 0) { [0, 1, 2].forEach((k) => plus(285, 175 + k * 25)); [0, 1, 2].forEach((k) => minus(355, 175 + k * 25)); msg = "Rod repels electrons to the far side: near side +, far side − (charges separated)."; } else if (st === 1) { [0, 1, 2].forEach((k) => plus(285, 175 + k * 25)); line(ctx, 370, 200, 440, 200, C.chalk, 2); line(ctx, 440, 200, 440, 260, C.chalk, 2); [0, 1, 2].forEach((k) => line(ctx, 425 + k * 5, 260 + k * 6, 455 - k * 5, 260 + k * 6, C.chalk, 2)); msg = "Touch (earth) the sphere: the repelled electrons escape to earth."; } else { const pts = st === 3 ? 6 : 3; for (let i = 0; i < pts; i++) { const a = (i / pts) * K.TAU + (st === 3 ? 0 : Math.PI / 2); plus(st === 3 ? 320 + 38 * Math.cos(a) : 285, st === 3 ? 200 + 38 * Math.sin(a) : 175 + i * 25); } msg = st === 2 ? "Remove the earth connection first, keeping the rod in place." : "Remove the rod: the sphere is left POSITIVE — opposite to the inducing charge."; } }
      panel(ctx, 20, 300, 600, 80, null); notes(ctx, 30, 322, 580, [[msg, C.amber], "Like charges repel, unlike charges attract. Charge is measured in coulombs (C); only electrons move in solids."], 11);
    },
    readouts(s, c) { return [["Method", ["friction", "contact", "induction"][c.m]], ["Step", c.st], ["Final charge", ["rod −, wool +", "same as rod", "opposite to rod"][c.m]]]; },
  });

  /* ---------- T25 Distribution of charge: electroscope and lightning conductor ---------- */
  K.add("25", {
    modeName: "Gold-leaf Electroscope & Lightning Conductor", tag: "CHARGE DISTRIBUTION · POINT ACTION", eqn: "Charge collects most densely at sharp points; leaves diverge more for more charge",
    controls: [K.sel("m", "Show", ["Gold-leaf electroscope", "Charge density on a pear-shaped conductor", "Lightning conductor"], 0), K.rng("q", "Charge (relative)", -10, 10, 1, 6), K.sel("test", "Bring near the cap (electroscope)", ["Nothing", "Rod with SAME charge", "Rod with OPPOSITE charge", "Uncharged hand"], 0)],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; },
    draw(ctx, s, c) {
      if (c.m === 0) { let q = c.q; if (c.test === 1) q += Math.sign(c.q || 1) * 4; if (c.test === 2) q -= Math.sign(c.q || 1) * 4; if (c.test === 3) q *= 0.8; const ang = clamp(Math.abs(q) * 0.06, 0, 0.7); rect(ctx, 120, 140, 160, 200, "rgba(220,235,255,.06)", "#888", 2); circ(ctx, 200, 90, 18, "#c8a030"); line(ctx, 200, 108, 200, 220, "#c8a030", 4); ctx.save(); ctx.translate(200, 220); ctx.rotate(-ang); rect(ctx, -3, 0, 6, 70, "#f2c21a"); ctx.restore(); ctx.save(); ctx.translate(200, 220); ctx.rotate(ang); rect(ctx, -3, 0, 6, 70, "#f2c21a"); ctx.restore(); rect(ctx, 110, 340, 180, 10, "#555"); if (c.test === 1 || c.test === 2) { rect(ctx, 250, 40, 100, 16, "#e8e8f0"); txt(ctx, 300, 34, c.test === 1 ? "same sign" : "opposite sign", C.dim, 10, "center"); }
        notes(ctx, 330, 60, 290, [["Leaves diverge because they carry like charges and repel.", C.amber], "Same-sign rod brought near → divergence INCREASES (confirms the sign).", "Opposite-sign rod → divergence decreases (may collapse and re-open).", "An uncharged conductor (hand) also reduces divergence slightly.", "Uses: detect charge, find its sign, test conductors and insulators."], 11); }
      else if (c.m === 1) { ctx.save(); ctx.beginPath(); ctx.moveTo(100, 200); ctx.bezierCurveTo(100, 100, 300, 120, 420, 200); ctx.bezierCurveTo(300, 280, 100, 300, 100, 200); ctx.fillStyle = "#8a8f99"; ctx.fill(); ctx.restore(); for (let i = 0; i < 40; i++) { const u = i / 40, x = 100 + u * 320, dens = 1 + Math.pow(u, 6) * 10; for (let k = 0; k < Math.min(4, dens); k++) txt(ctx, x + k * 3, 140 + (1 - u) * 20 - 6 - k * 2, c.q >= 0 ? "+" : "−", c.q >= 0 ? C.red : C.blue, 10 + Math.min(6, dens), "center", true); } notes(ctx, 120, 330, 480, ["Charge resides on the OUTER surface of a conductor and is densest where the curvature is greatest (sharp end).", "At a sharp point the field is so strong that it ionises the air (point action / corona discharge)."], 11); }
      else { rect(ctx, 0, 0, 640, 120, "#2a2f40"); txt(ctx, 320, 30, "negatively charged thundercloud", "#ccc", 12, "center"); for (let i = 0; i < 14; i++) txt(ctx, 60 + i * 40, 100, "−", C.blue, 18, "center", true); rect(ctx, 260, 200, 120, 180, "#a86a4a", "#5a3a2a"); K.poly(ctx, [[250, 200], [320, 150], [390, 200]], null, "#7a4a3a"); line(ctx, 320, 150, 320, 110, "#c88a40", 4); line(ctx, 320, 150, 400, 160, "#c88a40", 3); line(ctx, 400, 160, 400, 380, "#c88a40", 3); line(ctx, 400, 380, 440, 380, "#c88a40", 3); for (let i = 0; i < 4; i++) txt(ctx, 312 + i * 6, 125, "+", C.red, 12, "center", true); for (let i = 0; i < 6; i++) { const yy = 112 - ((s.t * 40 + i * 12) % 30); circ(ctx, 315 + (i % 3) * 5, yy, 2, C.red); }
        notes(ctx, 30, 160, 210, ["Spikes on top (point action) spray + ions that neutralise the cloud's charge slowly.", "If lightning strikes, the thick copper strip conducts the charge safely to earth plate in damp ground, protecting the building."], 10.5); }
    },
    readouts(s, c) { return [["Display", ["electroscope", "charge density", "lightning conductor"][c.m]], ["Charge", c.q], ["Key idea", "charge densest at points"]]; },
  });

  /* ---------- T25 Electric field intensity and potential ---------- */
  K.add("25", {
    modeName: "Electric Field Intensity & Potential", tag: "E = kQ/r² · V = kQ/r", eqn: "Field intensity E = F/q = kQ/r² (N/C) · potential V = kQ/r (volts) · work to move q: W = qΔV",
    controls: [K.rng("Q", "Source charge Q", -10, 10, 0.5, 5, " µC"), K.rng("r", "Distance of test point r", 0.05, 1, 0.01, 0.3, " m", 2), K.rng("q", "Test charge q", 0.1, 5, 0.1, 1, " nC")],
    draw(ctx, s, c) {
      const Q = c.Q * 1e-6, r = c.r, E = (K.k * Q) / (r * r), V = (K.k * Q) / r, F = E * c.q * 1e-9, cx = 160, cy = 200;
      for (let k = 1; k <= 6; k++) circ(ctx, cx, cy, k * 26, null, "rgba(127,227,218," + (0.35 - k * 0.04) + ")", 1); for (let a = 0; a < 16; a++) { const t = (a / 16) * K.TAU, r1 = 22, r2 = 160; const d = Q >= 0 ? 1 : -1; arr(ctx, cx + Math.cos(t) * (d > 0 ? r1 : r2), cy + Math.sin(t) * (d > 0 ? r1 : r2), cx + Math.cos(t) * (d > 0 ? r2 : r1 + 4), cy + Math.sin(t) * (d > 0 ? r2 : r1 + 4), "rgba(255,183,3,.45)", 1.2); }
      circ(ctx, cx, cy, 16, Q >= 0 ? C.red : C.blue); txt(ctx, cx, cy + 5, Q >= 0 ? "+" : "−", "#fff", 16, "center", true); const px = cx + (r / 1) * 160; circ(ctx, px, cy, 6, C.green); arr(ctx, px, cy, px + Math.sign(E) * clamp(Math.abs(E) / 2e5, 10, 80), cy, C.green, 2.4); txt(ctx, px, cy - 14, "test charge", C.green, 10, "center");
      const A = axes(ctx, 360, 50, 250, 140, { x0: 0.05, x1: 1, y0: Math.min(0, (K.k * Q) / 0.05) * 1.05, y1: Math.max(0, (K.k * Q) / 0.05) * 1.05 || 1, nx: 4, xl: "r (m)", yl: "V (V)", title: "Potential V = kQ/r (equipotentials as circles)" }); plot(ctx, A, (x) => (K.k * Q) / x, 0.05, 1, C.teal); circ(ctx, A.X(r), A.Y(V), 5, C.amber);
      notes(ctx, 360, 230, 265, [["E = kQ/r² = " + K.sci(Math.abs(E)) + " N/C " + (E >= 0 ? "outwards" : "inwards"), C.amber], ["V = kQ/r = " + K.sci(V) + " V", C.teal], "Force on test charge F = qE = " + K.sci(Math.abs(F)) + " N", "Work to bring the test charge from infinity = qV = " + K.sci(c.q * 1e-9 * V) + " J", "Field lines point from + to −; equipotentials are always perpendicular to field lines."], 10.5);
    },
    readouts(s, c) { const Q = c.Q * 1e-6; return [["Field intensity", K.sci((K.k * Q) / (c.r * c.r)) + " N/C"], ["Potential", K.sci((K.k * Q) / c.r) + " V"], ["Force on q", K.sci((K.k * Q * c.q * 1e-9) / (c.r * c.r)) + " N"]]; },
  });

  /* ---------- T25 Capacitors in series and parallel; energy ---------- */
  K.add("25", {
    modeName: "Capacitors — Series, Parallel & Energy Stored", tag: "C = ε A/d · W = ½CV²", eqn: "Parallel: C = C₁ + C₂ · Series: 1/C = 1/C₁ + 1/C₂ · parallel plates C = εA/d · energy W = ½CV² = ½QV",
    controls: [K.rng("C1", "C₁", 1, 100, 1, 20, " µF"), K.rng("C2", "C₂", 1, 100, 1, 30, " µF"), K.sel("arr", "Arrangement", ["Parallel", "Series"], 0), K.rng("V", "Supply voltage", 1, 24, 0.5, 12, " V")],
    draw(ctx, s, c) {
      const Ct = c.arr === 0 ? c.C1 + c.C2 : (c.C1 * c.C2) / (c.C1 + c.C2), Q = Ct * c.V, W = 0.5 * Ct * 1e-6 * c.V * c.V; const cap = (x, y, lab) => { line(ctx, x - 6, y - 18, x - 6, y + 18, C.chalk, 3); line(ctx, x + 6, y - 18, x + 6, y + 18, C.chalk, 3); txt(ctx, x, y - 24, lab, C.amber, 10.5, "center"); };
      line(ctx, 60, 120, 60, 300, C.chalk, 2); line(ctx, 40, 210, 80, 210, C.chalk, 3); line(ctx, 48, 222, 72, 222, C.chalk, 2); txt(ctx, 30, 216, c.V + " V", C.dim, 10, "right");
      if (c.arr === 0) { line(ctx, 60, 120, 340, 120, C.chalk, 2); line(ctx, 60, 300, 340, 300, C.chalk, 2); [[200, c.C1], [300, c.C2]].forEach(([x, Cv], i) => { line(ctx, x, 120, x, 192, C.chalk, 2); line(ctx, x, 228, x, 300, C.chalk, 2); ctx.save(); ctx.translate(x, 210); ctx.rotate(Math.PI / 2); cap(0, 0, ""); ctx.restore(); txt(ctx, x, 320 + i * 0, "", C.amber, 10); txt(ctx, x + 22, 190 + i * 50, "C" + (i + 1) + " = " + Cv + " µF", C.amber, 10); txt(ctx, x + 22, 204 + i * 50, "Q = " + f(Cv * c.V, 0) + " µC", C.teal, 10); }); }
      else { line(ctx, 60, 120, 380, 120, C.chalk, 2); line(ctx, 60, 300, 380, 300, C.chalk, 2); line(ctx, 380, 120, 380, 300, C.chalk, 2); const V1 = (Q / c.C1), V2 = Q / c.C2; [[170, c.C1, V1], [290, c.C2, V2]].forEach(([x, Cv, Vv], i) => { rect(ctx, x - 10, 110, 20, 20, "#050c17"); cap(x, 120, "C" + (i + 1) + " = " + Cv + " µF"); txt(ctx, x, 150, f(Vv, 2) + " V", C.teal, 10.5, "center"); }); }
      panel(ctx, 400, 30, 228, 340, c.arr === 0 ? "Parallel" : "Series"); notes(ctx, 410, 70, 210, [["Combined C = " + f(Ct, 2) + " µF", C.amber], ["Total charge Q = CV = " + f(Q, 1) + " µC", C.chalk], ["Energy stored W = ½CV² = " + K.sci(W) + " J", C.teal], c.arr === 0 ? "Parallel: same p.d. across each, charges add, capacitance adds (like resistors in series)." : "Series: same charge on each, p.d.s add; combined C is smaller than either.", "Parallel plates: C = εA/d — bigger plates, closer together or a dielectric → more capacitance. Unit: farad (F)."], 10.5);
    },
    readouts(s, c) { const Ct = c.arr === 0 ? c.C1 + c.C2 : (c.C1 * c.C2) / (c.C1 + c.C2); return [["Combined capacitance", f(Ct, 2) + " µF"], ["Charge", f(Ct * c.V, 1) + " µC"], ["Energy", K.sci(0.5 * Ct * 1e-6 * c.V * c.V) + " J"]]; },
  });

  /* ---------- T25 Cells ---------- */
  const CELLS = [["Simple (voltaic) cell", "Copper +, zinc − in dilute H₂SO₄", 1.0, "Defects: polarisation (H₂ bubbles on Cu) and local action (impure zinc).", 0], ["Daniell cell", "Copper in CuSO₄ (+), zinc in ZnSO₄ (−), porous pot", 1.1, "Copper sulphate removes polarisation; steady e.m.f.", 0], ["Leclanché (wet)", "Carbon rod + (MnO₂ depolariser), zinc − in ammonium chloride", 1.5, "Used for intermittent work (bells).", 0], ["Dry cell", "Zinc case −, carbon rod +, NH₄Cl paste, MnO₂", 1.5, "Portable: torches, radios, clocks. Primary — not rechargeable.", 0], ["Lead–acid accumulator", "PbO₂ +, Pb −, dilute H₂SO₄ (R.D. 1.25)", 2.0, "Secondary: rechargeable. Car batteries (6 cells = 12 V). Low internal resistance.", 1], ["Nickel–cadmium (alkaline)", "Nickel hydroxide +, cadmium −, KOH electrolyte", 1.2, "Secondary; robust, long life; emergency lighting.", 1]];
  K.add("25", {
    modeName: "Electric Cells — Primary & Secondary", tag: "CHEMICAL → ELECTRICAL", eqn: "A cell converts chemical energy to electrical energy · e.m.f. = energy per coulomb delivered (volts)",
    controls: [K.sel("c", "Cell", CELLS.map((x) => x[0]), 1), K.rng("n", "Cells in series", 1, 6, 1, 1), K.rng("t", "Time in use", 0, 100, 1, 0, " %")],
    reset(s) { s.u = 0; }, step(s, c, dt) { s.u += dt; },
    draw(ctx, s, c) {
      const [nm, parts, emf, note, sec] = CELLS[c.c]; const Vcell = c.c === 0 ? emf * Math.max(0.3, 1 - c.t / 60) : emf * (1 - 0.15 * Math.pow(c.t / 100, 3)); rect(ctx, 70, 120, 200, 200, "rgba(220,235,255,.08)", "#cfe6ff", 2); rect(ctx, 74, 170, 192, 146, c.c >= 3 ? "#4a4a3a" : "#4aa8ff55"); rect(ctx, 110, 90, 20, 200, c.c === 4 ? "#7a3a2a" : "#c87a3a"); rect(ctx, 210, 90, 20, 200, c.c === 4 ? "#5a5a60" : "#9aa0a8"); txt(ctx, 120, 84, "+", C.red, 16, "center", true); txt(ctx, 220, 84, "−", C.blue, 18, "center", true);
      if (c.c === 0) for (let i = 0; i < 8; i++) circ(ctx, 105 + (i % 2) * 30, 300 - ((s.u * 30 + i * 20) % 120), 4, "rgba(255,255,255,.7)"); for (let i = 0; i < 6; i++) { const u = (s.u * 0.3 + i / 6) % 1; circ(ctx, 220 - u * 0, 90 - 20 - 0, 0); const pts = [[230, 80], [230, 40], [110, 40], [110, 80]]; const k = u * 3, j = Math.floor(k), r = k - j, a = pts[j], b = pts[j + 1]; circ(ctx, a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r, 3, C.blue); } line(ctx, 230, 80, 230, 40, C.chalk, 2); line(ctx, 230, 40, 110, 40, C.chalk, 2); line(ctx, 110, 40, 110, 80, C.chalk, 2); circ(ctx, 170, 40, 10, "#ffe680", "#888"); txt(ctx, 170, 30, "lamp", C.dim, 9.5, "center");
      panel(ctx, 300, 30, 328, 340, nm); notes(ctx, 310, 70, 310, [[parts, C.chalk], ["e.m.f. ≈ " + emf + " V per cell; " + c.n + " in series → " + f(emf * c.n, 1) + " V", C.amber], "Terminal voltage now ≈ " + f(Vcell * c.n, 2) + " V", [sec ? "SECONDARY cell — recharge by passing current backwards." : "PRIMARY cell — chemicals used up; not rechargeable.", sec ? C.green : C.red], note, "Electrons flow from − to + through the external circuit; conventional current flows from + to −."], 10.5);
    },
    readouts(s, c) { const [nm, , emf, , sec] = CELLS[c.c]; return [["Cell", nm], ["e.m.f.", f(emf * c.n, 1) + " V"], ["Type", sec ? "secondary" : "primary"]]; },
  });

  /* ---------- T25 Ohmic and non-ohmic conductors ---------- */
  const IV = [["Metal wire at constant temperature (ohmic)", (V) => V / 10], ["Filament lamp (non-ohmic)", (V) => Math.sign(V) * 0.12 * Math.pow(Math.abs(V), 0.55)], ["Semiconductor diode (non-ohmic)", (V) => (V > 0 ? 0.002 * (Math.exp(V / 0.12) - 1) : -0.0001)], ["Thermistor (NTC)", (V) => V / (100 / (1 + 0.04 * V * V))], ["Electrolyte (copper sulphate, Cu electrodes)", (V) => V / 12]];
  K.add("25", {
    modeName: "Ohmic & Non-ohmic Conductors (I–V)", tag: "R = V/I", eqn: "Ohmic: I ∝ V (straight line through origin, constant R) · non-ohmic: curved I–V graph, R changes",
    controls: [K.sel("d", "Conductor", IV.map((x) => x[0]), 1), K.rng("V", "Applied p.d.", -6, 12, 0.1, 6, " V")],
    draw(ctx, s, c) {
      const fn = IV[c.d][1], dV = c.V === 0 ? 0.01 : c.V; let I = fn(dV); if (c.d === 2) I = Math.min(I, 1.2); const A = axes(ctx, 70, 40, 320, 300, { x0: -6, x1: 12, y0: -0.4, y1: 1.3, nx: 6, xl: "p.d. V (V)", yl: "current I (A)", title: IV[c.d][0] }); line(ctx, A.X(0), A.y, A.X(0), A.y + A.h, "rgba(255,255,255,.25)", 1); line(ctx, A.x, A.Y(0), A.x + A.w, A.Y(0), "rgba(255,255,255,.25)", 1);
      plot(ctx, A, (v) => clamp(c.d === 2 ? Math.min(fn(v), 1.25) : fn(v), -0.4, 1.3), -6, 12, C.teal, 2.2, 240); circ(ctx, A.X(c.V), A.Y(clamp(I, -0.4, 1.3)), 6, C.amber);
      panel(ctx, 410, 30, 218, 340, "At V = " + c.V + " V"); notes(ctx, 420, 70, 200, [["I = " + f(I, 3) + " A", C.amber], ["R = V/I = " + (Math.abs(I) > 1e-4 ? f(c.V / I, 1) + " Ω" : "very large"), C.teal], ["The filament gets hotter as current rises, so its resistance increases.", "", "The diode conducts in one direction only (after ≈ 0.6 V).", "Heating lowers a thermistor's resistance.", "Copper sulphate with copper electrodes obeys Ohm's law."][c.d] || "Constant gradient: obeys Ohm's law (V ∝ I at constant temperature).", "Ohm's law: current through a metallic conductor is proportional to the p.d. across it, provided temperature and other physical conditions stay constant."], 10.5);
    },
    readouts(s, c) { let I = IV[c.d][1](c.V || 0.01); if (c.d === 2) I = Math.min(I, 1.2); return [["Current", f(I, 3) + " A"], ["Resistance", Math.abs(I) > 1e-4 ? f(c.V / I, 1) + " Ω" : "∞"], ["Ohmic?", c.d === 0 || c.d === 4 ? "yes" : "no"]]; },
  });

  /* ---------- T25 Electrical energy, power and fuses ---------- */
  K.add("25", {
    modeName: "Electrical Energy, Power & Fuses", tag: "P = IV = I²R = V²/R", eqn: "Power P = IV · energy W = IVt = I²Rt · heat in a heater element · choose a fuse just above the normal current",
    controls: [K.rng("P", "Appliance power", 60, 3000, 20, 2000, " W"), K.rng("V", "Mains voltage", 110, 240, 10, 230, " V"), K.sel("fuse", "Fuse fitted", ["3 A", "5 A", "13 A"], 2), K.rng("t", "Time used", 1, 120, 1, 30, " min")],
    reset(s) { s.u = 0; }, step(s, c, dt) { s.u += dt; },
    draw(ctx, s, c) {
      const I = c.P / c.V, R = (c.V * c.V) / c.P, W = c.P * c.t * 60, fz = [3, 5, 13][c.fuse], blown = I > fz; rect(ctx, 60, 100, 130, 110, "#d8d8dc", "#555"); for (let i = 0; i < 5; i++) { const glow = blown ? 0 : clamp(c.P / 3000, 0.2, 1); line(ctx, 75, 120 + i * 18, 175, 120 + i * 18, `rgba(255,${120 - glow * 60},${40},${0.3 + glow * 0.7})`, 4); } txt(ctx, 125, 230, "heating element R = " + f(R, 1) + " Ω", C.dim, 10, "center");
      rect(ctx, 230, 140, 90, 30, "rgba(220,235,255,.1)", "#cfe6ff"); line(ctx, 235, 155, blown ? 265 : 315, 155, blown ? C.red : "#c8ccd4", 2); if (blown) line(ctx, 285, 155, 315, 155, C.red, 2); txt(ctx, 275, 190, fz + " A fuse " + (blown ? "BLOWN" : "OK"), blown ? C.red : C.green, 11, "center", true);
      panel(ctx, 360, 30, 268, 340, "Calculations"); notes(ctx, 370, 70, 250, [["I = P/V = " + c.P + " ÷ " + c.V + " = " + f(I, 2) + " A", C.amber], ["R = V²/P = " + f(R, 1) + " Ω", C.chalk], ["Energy = Pt = " + K.sci(W) + " J = " + f((c.P * c.t) / 60000, 3) + " kWh", C.teal], blown ? ["Current exceeds the fuse rating: the fuse wire melts and breaks the circuit, protecting the cable from overheating.", C.red] : "Correct fuse: slightly above the normal current (13 A for heaters/kettles, 3 A for lamps, TVs).", "Fuse and switch go in the LIVE wire; the earth wire protects against shocks from a faulty metal case.", "Other effects of current: heating, magnetic (motors), chemical (electrolysis); solar cells turn light into electrical energy."], 10.5);
    },
    readouts(s, c) { const I = c.P / c.V; return [["Current", f(I, 2) + " A"], ["Energy used", f((c.P * c.t) / 60000, 3) + " kWh"], ["Fuse", I > [3, 5, 13][c.fuse] ? "blows" : "holds"]]; },
  });

  /* ---------- T25 Shunt and multiplier ---------- */
  K.add("25", {
    modeName: "Shunt & Multiplier — Galvanometer Conversion", tag: "AMMETER · VOLTMETER", eqn: "Shunt (parallel): S = I_g·G ÷ (I − I_g) · Multiplier (series): R = V ÷ I_g − G",
    controls: [K.sel("m", "Convert to", ["Ammeter (add shunt)", "Voltmeter (add multiplier)"], 0), K.rng("G", "Galvanometer resistance G", 5, 100, 1, 20, " Ω"), K.rng("Ig", "Full-scale current I_g", 1, 20, 0.5, 5, " mA"), K.rng("R", "Required range (A or V)", 0.1, 20, 0.1, 5)],
    draw(ctx, s, c) {
      const Ig = c.Ig / 1000, G = c.G, amm = c.m === 0, val = amm ? (Ig * G) / Math.max(1e-6, c.R - Ig) : c.R / Ig - G; meter(ctx, 220, 150, 50, 0.85, "G", "galvanometer " + G + " Ω, " + c.Ig + " mA f.s.d.");
      if (amm) { line(ctx, 80, 150, 170, 150, C.chalk, 2); line(ctx, 270, 150, 360, 150, C.chalk, 2); line(ctx, 120, 150, 120, 260, C.chalk, 2); line(ctx, 320, 150, 320, 260, C.chalk, 2); res(ctx, 120, 260, 320, 260, "shunt " + K.sci(val, 3) + " Ω"); arr(ctx, 90, 140, 115, 140, C.amber); txt(ctx, 84, 132, c.R + " A", C.amber, 10.5); txt(ctx, 220, 290, f(c.R - Ig, 3) + " A through the shunt", C.teal, 10.5, "center"); }
      else { line(ctx, 60, 150, 100, 150, C.chalk, 2); res(ctx, 100, 150, 170, 150, null); txt(ctx, 135, 130, "multiplier " + K.sci(val, 3) + " Ω", C.amber, 10.5, "center"); line(ctx, 270, 150, 360, 150, C.chalk, 2); txt(ctx, 210, 230, "range 0 – " + c.R + " V", C.teal, 11, "center"); }
      panel(ctx, 400, 30, 228, 340, amm ? "Shunt" : "Multiplier"); notes(ctx, 410, 70, 210, amm ? [["S = I_g G ÷ (I − I_g) = " + f(Ig, 4) + " × " + G + " ÷ (" + c.R + " − " + f(Ig, 4) + ")", C.chalk], ["S = " + K.sci(val, 3) + " Ω (very small)", C.amber], "Most of the current bypasses the delicate coil. Ammeter resistance ≈ " + K.sci((val * G) / (val + G), 3) + " Ω — low, connected in series."] : [["R = V/I_g − G = " + c.R + " ÷ " + f(Ig, 4) + " − " + G, C.chalk], ["R = " + K.sci(val, 3) + " Ω (large)", C.amber], "Total resistance " + K.sci(val + G, 3) + " Ω — high, so the voltmeter (in parallel) draws little current."], 10.5);
    },
    readouts(s, c) { const Ig = c.Ig / 1000, val = c.m === 0 ? (Ig * c.G) / Math.max(1e-6, c.R - Ig) : c.R / Ig - c.G; return [[c.m === 0 ? "Shunt" : "Multiplier", K.sci(val, 3) + " Ω"], ["Connected", c.m === 0 ? "in parallel with G" : "in series with G"], ["Range", c.R + (c.m === 0 ? " A" : " V")]]; },
  });

  /* ---------- T25 Metre bridge and potentiometer ---------- */
  K.add("25", {
    modeName: "Metre Bridge & Potentiometer", tag: "BALANCE (NULL) METHODS", eqn: "Metre bridge: R/S = l/(100 − l) · Potentiometer: E₁/E₂ = l₁/l₂ (no current drawn at balance)",
    controls: [K.sel("m", "Instrument", ["Metre bridge (unknown resistance)", "Potentiometer (compare e.m.f.s)"], 0), K.rng("x", "Jockey position", 1, 99, 0.1, 50, " cm"), K.rng("R", "Unknown R / test e.m.f. E₁", 0.5, 20, 0.1, 6), K.rng("S", "Standard S (Ω) / standard cell E₂ (V)", 1, 20, 0.5, 10)],
    draw(ctx, s, c) {
      const y = 260, x0 = 60, L = 500, jx = x0 + (c.x / 100) * L; rect(ctx, x0, y - 3, L, 6, "#c8a030"); for (let i = 0; i <= 100; i += 10) { line(ctx, x0 + (i / 100) * L, y + 6, x0 + (i / 100) * L, y + 14, C.dim, 1); txt(ctx, x0 + (i / 100) * L, y + 26, String(i), C.dim, 9, "center"); }
      let g, bal; if (c.m === 0) { bal = (100 * c.R) / (c.R + c.S); g = (c.R / (c.R + c.S) - c.x / 100) * 3; res(ctx, x0, 120, x0 + 200, 120, "R = ? (" + c.R + " Ω)"); res(ctx, x0 + 300, 120, x0 + L, 120, "S = " + c.S + " Ω"); line(ctx, x0 + 200, 120, x0 + 300, 120, C.chalk, 2); line(ctx, x0, 120, x0, y, C.chalk, 2); line(ctx, x0 + L, 120, x0 + L, y, C.chalk, 2); line(ctx, x0 + 250, 120, x0 + 250, 170, C.chalk, 2); meter(ctx, x0 + 250, 190, 20, 0.5 + clamp(g, -0.5, 0.5), "G"); line(ctx, x0 + 250, 210, jx, y - 4, C.chalk, 1.5); }
      else { const E0 = 2.5, k = E0 / 100; bal = c.R / k; g = (c.R - k * c.x) * 0.6; line(ctx, x0, y, x0, 200, C.chalk, 2); line(ctx, x0, 200, x0 + L, 200, C.chalk, 2); line(ctx, x0 + L, 200, x0 + L, y, C.chalk, 2); txt(ctx, x0 + L / 2, 192, "driver cell 2.5 V (steady current)", C.dim, 10, "center"); line(ctx, x0, y, x0 - 20, y, C.chalk, 2); line(ctx, x0 - 20, y, x0 - 20, 120, C.chalk, 2); line(ctx, x0 - 20, 120, 300, 120, C.chalk, 2); txt(ctx, 160, 112, "test cell E₁ = " + f(c.R / 8, 2) + " V", C.amber, 10.5, "center"); meter(ctx, 330, 120, 20, 0.5 + clamp(g, -0.5, 0.5), "G"); line(ctx, 350, 120, jx, y - 4, C.chalk, 1.5); bal = ((c.R / 8) / k); g = ((c.R / 8) - k * c.x) * 0.6; }
      circ(ctx, jx, y - 4, 6, C.red); const nul = Math.abs(g) < 0.03; txt(ctx, jx, y - 16, nul ? "BALANCE" : "", C.green, 11, "center", true);
      panel(ctx, 20, 300, 600, 80, null); notes(ctx, 30, 322, 580, c.m === 0 ? [["Balance at l = " + f(bal, 1) + " cm (galvanometer reads zero)", C.amber], "R = S × l/(100 − l) = " + c.S + " × " + f(bal, 1) + "/" + f(100 - bal, 1) + " = " + f(c.R, 2) + " Ω. Wheatstone bridge principle: P/Q = R/S at balance."] : [["Balance length for E₁: l₁ = " + f(Math.min(100, bal), 1) + " cm", C.amber], "E₁/E₂ = l₁/l₂. At balance no current flows from the test cell, so the potentiometer measures true e.m.f. (better than a voltmeter)."], 10.5);
    },
    readouts(s, c) { if (c.m === 0) { const bal = (100 * c.R) / (c.R + c.S); return [["Balance length", f(bal, 1) + " cm"], ["Jockey at", c.x + " cm"], ["R from balance", f((c.S * bal) / (100 - bal), 2) + " Ω"]]; } const bal = (c.R / 8) / 0.025; return [["Test e.m.f.", f(c.R / 8, 2) + " V"], ["Balance length", f(Math.min(100, bal), 1) + " cm"], ["Jockey at", c.x + " cm"]]; },
  });

  /* ---------- T26 Magnetisation and demagnetisation ---------- */
  K.add("26", {
    modeName: "Making & Destroying Magnets", tag: "SOFT IRON vs STEEL", eqn: "Magnetise: stroking, or a d.c. solenoid · demagnetise: a.c. solenoid (withdraw slowly), heating, hammering · soft iron: temporary · steel: permanent",
    controls: [K.sel("mat", "Material", ["Soft iron", "Steel", "Alnico / ferrite (alloy)"], 1), K.sel("m", "Process", ["Single-touch stroking", "D.C. in a solenoid", "A.C. solenoid, withdraw slowly", "Heat strongly", "Hammer (east–west)"], 1), K.rng("n", "Strokes / current", 0, 20, 1, 10)],
    domains(c) { const ret = [1, 0.08, 0.05, 0.02][0] && 0; const susc = [1.0, 0.45, 0.6][c.mat], keep = [0.05, 0.85, 0.95][c.mat]; let M; if (c.m <= 1) M = clamp(susc * c.n / 10, 0, 1); else M = c.m === 2 ? 0.02 : c.m === 3 ? 0 : 0.15; return { Mon: M, Moff: c.m <= 1 ? M * keep : M }; },
    draw(ctx, s, c) {
      const D = this.domains(c), r = K.rnd(17); rect(ctx, 60, 140, 320, 90, "#7a7f88", "#333"); for (let i = 0; i < 40; i++) { const x = 72 + (i % 10) * 31, y = 152 + Math.floor(i / 10) * 20, a = r() * K.TAU * (1 - D.Moff) + 0 * D.Moff; arr(ctx, x - 10 * Math.cos(a), y - 6 * Math.sin(a), x + 10 * Math.cos(a), y + 6 * Math.sin(a), C.amber, 1.4); }
      txt(ctx, 50, 190, D.Moff > 0.3 ? "S" : "", C.blue, 16, "right", true); txt(ctx, 390, 190, D.Moff > 0.3 ? "N" : "", C.red, 16, "left", true); txt(ctx, 220, 130, "domains after the process", C.dim, 10.5, "center");
      if (c.m === 0) { rect(ctx, 100 + ((c.n * 23) % 260), 90, 50, 30, "#d84a3a"); txt(ctx, 125 + ((c.n * 23) % 260), 110, "N", "#fff", 12, "center", true); } if (c.m === 1 || c.m === 2) for (let i = 0; i < 12; i++) ctx.save(), ctx.beginPath(), ctx.ellipse(80 + i * 26, 185, 8, 58, 0, 0, K.TAU), ctx.strokeStyle = "#c87a3a", ctx.lineWidth = 2, ctx.stroke(), ctx.restore();
      panel(ctx, 400, 30, 228, 340, ["Soft iron", "Steel", "Magnetic alloy"][c.mat]); notes(ctx, 410, 70, 210, [["Magnetisation retained: " + Math.round(D.Moff * 100) + " %", C.amber], c.mat === 0 ? "Soft iron magnetises easily but loses it when the field is removed — TEMPORARY magnet: electromagnets, transformer cores, relays." : "Steel and alloys are harder to magnetise but keep it — PERMANENT magnets: compasses, loudspeakers, motors.", "Magnetising aligns the domains; demagnetising jumbles them.", "Magnetic materials: iron, steel, nickel, cobalt and their alloys. Non-magnetic: copper, brass, aluminium, wood."], 10.5);
    },
    readouts(s, c) { const D = this.domains(c); return [["Material", ["soft iron", "steel", "alloy"][c.mat]], ["Domains aligned (after)", Math.round(D.Moff * 100) + " %"], ["Magnet type", c.mat === 0 ? "temporary" : "permanent"]]; },
  });

  /* ---------- T26 Earth's magnetic field: dip and declination ---------- */
  K.add("26", {
    modeName: "Earth's Magnetic Field — Dip & Declination", tag: "MARINER'S COMPASS", eqn: "Declination: angle between magnetic and geographic north · Dip (inclination): angle the field makes with the horizontal (0° at magnetic equator, 90° at magnetic poles)",
    controls: [K.rng("lat", "Magnetic latitude", -90, 90, 1, 10, "°"), K.rng("dec", "Local declination", -20, 20, 0.5, -2, "°")],
    draw(ctx, s, c) {
      const cx = 150, cy = 200, R = 100; circ(ctx, cx, cy, R, "#2a6ab8", "#7cb3ff"); ctx.save(); ctx.translate(cx, cy); ctx.rotate(rad(11)); rect(ctx, -8, -60, 16, 120, "rgba(255,255,255,.15)"); txt(ctx, 0, -66, "S", C.blue, 12, "center", true); txt(ctx, 0, 78, "N", C.red, 12, "center", true); ctx.restore(); txt(ctx, cx, cy - R - 10, "geographic N", C.dim, 10, "center"); txt(ctx, cx, cy + R + 22, "Earth's magnetic S pole lies near", C.dim, 9.5, "center"); txt(ctx, cx, cy + R + 35, "geographic North", C.dim, 9.5, "center");
      for (let k = -3; k <= 3; k++) { if (k === 0) continue; ctx.save(); ctx.strokeStyle = "rgba(255,183,3,.35)"; ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.3 + Math.abs(k) * 28, R + 40, 0, 0, K.TAU); ctx.stroke(); ctx.restore(); }
      const la = rad(c.lat), px = cx + R * Math.cos(la), py = cy - R * Math.sin(la); circ(ctx, px, py, 5, C.amber); const dip = Math.atan(2 * Math.tan(la)); txt(ctx, px + 10, py, f(deg(dip), 1) + "° dip", C.amber, 10.5);
      const dx = 420, dy = 130; circ(ctx, dx, dy, 70, "#141e2e", C.teal, 2); line(ctx, dx - 80, dy, dx + 80, dy, C.dim, 1, [4, 3]); ctx.save(); ctx.translate(dx, dy); ctx.rotate(dip); line(ctx, -60, 0, 0, 0, C.blue, 4); line(ctx, 0, 0, 60, 0, C.red, 4); ctx.restore(); txt(ctx, dx, dy + 90, "dip needle (side view) — dip " + f(deg(dip), 1) + "°", C.chalk, 10.5, "center");
      const cx2 = 420, cy2 = 300; circ(ctx, cx2, cy2, 55, "#141e2e", C.teal, 2); txt(ctx, cx2, cy2 - 60, "N (true)", C.dim, 9.5, "center"); line(ctx, cx2, cy2 - 52, cx2, cy2 + 52, C.dim, 1, [3, 3]); ctx.save(); ctx.translate(cx2, cy2); ctx.rotate(rad(c.dec)); K.poly(ctx, [[0, -48], [6, 0], [-6, 0]], null, C.red); K.poly(ctx, [[0, 48], [6, 0], [-6, 0]], null, "#ccc"); ctx.restore(); txt(ctx, cx2 + 70, cy2, "declination " + c.dec + "°", C.amber, 10.5);
      notes(ctx, 520, 40, 110, ["Nigeria/Ghana lie near the magnetic equator: dip is small, compass needles almost horizontal.", "Navigators correct compass bearings for declination."], 10);
    },
    readouts(s, c) { const dip = deg(Math.atan(2 * Math.tan(rad(c.lat)))); return [["Angle of dip", f(dip, 1) + "°"], ["Declination", c.dec + "°"], ["Needle", Math.abs(dip) < 20 ? "nearly horizontal" : "steeply inclined"]]; },
  });

  /* ---------- T26 Force on a moving charge ---------- */
  K.add("26", {
    modeName: "Force on a Moving Charge — F = qvB sinθ", tag: "CIRCULAR PATH r = mv/(qB)", eqn: "F = q·v·B·sinθ, perpendicular to v and B (Fleming's left-hand rule; reverse for negative charges) → circular path r = mv/(qB)",
    controls: [K.sel("p", "Particle", ["Electron", "Proton", "Alpha particle"], 0), K.rng("v", "Speed", 1, 10, 0.1, 4, " ×10⁶ m/s"), K.rng("B", "Magnetic flux density B (into page)", 0.1, 2, 0.05, 0.6, " mT")],
    reset(s) { s.t = 0; s.pts = []; }, step(s, c, dt) { s.t += dt; },
    draw(ctx, s, c) {
      const P = [[-1.6e-19, 9.11e-31], [1.6e-19, 1.67e-27], [3.2e-19, 6.64e-27]][c.p], v = c.v * 1e6, B = c.B * 1e-3, r = (P[1] * v) / (Math.abs(P[0]) * B), F = Math.abs(P[0]) * v * B, rpx = clamp(50 + 35 * Math.log10(r / 0.005), 25, 160);
      for (let x = 30; x < 420; x += 40) for (let y = 40; y < 380; y += 40) txt(ctx, x, y, "×", "rgba(147,170,196,.4)", 14, "center"); const w = v / (rpx * 1e4) * 0 + 1.5, sg = P[0] < 0 ? -1 : 1, cx = 220, cy = 210 + sg * rpx * 0, a = s.t * 1.5;
      ctx.save(); ctx.beginPath(); ctx.arc(220, 210, rpx, 0, K.TAU); ctx.strokeStyle = "rgba(255,183,3,.35)"; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.restore(); const px = 220 + rpx * Math.cos(-sg * a), py = 210 + rpx * Math.sin(-sg * a); if (typeof dot === "function") dot(ctx, px, py, 7, P[0] < 0 ? C.blue : C.red, 10); const tx = -Math.sin(-sg * a) * -sg, ty = Math.cos(-sg * a) * -sg; arr(ctx, px, py, px + tx * 40 * -1, py + ty * 40 * -1, C.teal); arr(ctx, px, py, px + (220 - px) * 0.3, py + (210 - py) * 0.3, C.red);
      panel(ctx, 430, 30, 198, 340, null); notes(ctx, 438, 52, 185, [["F = qvB = " + K.sci(F) + " N", C.amber], ["Radius r = mv/(qB) = " + K.sci(r) + " m", C.teal], "Field into the page (×). The force is always at right angles to the velocity, so the speed is unchanged and the path is a circle.", c.p === 0 ? "Electrons curve the opposite way to positive charges." : "Heavier particles curve less (bigger radius).", "Uses: TV tubes, mass spectrometer, cyclotron, aurora."], 10.5);
    },
    readouts(s, c) { const P = [[-1.6e-19, 9.11e-31], [1.6e-19, 1.67e-27], [3.2e-19, 6.64e-27]][c.p], v = c.v * 1e6, B = c.B * 1e-3; return [["Force", K.sci(Math.abs(P[0]) * v * B) + " N"], ["Radius", K.sci((P[1] * v) / (Math.abs(P[0]) * B)) + " m"], ["Path drawn", "radius on a log scale"]]; },
  });

  /* ---------- T27 Self-inductance ---------- */
  K.add("27", {
    modeName: "Self-inductance & Back e.m.f.", tag: "E = −L dI/dt · W = ½LI²", eqn: "A changing current induces an opposing (back) e.m.f.: E = −L·ΔI/Δt · current grows as I = (V/R)(1 − e^(−Rt/L)) · energy stored ½LI²",
    controls: [K.rng("L", "Inductance L", 0.1, 5, 0.1, 2, " H"), K.rng("R", "Resistance R", 2, 50, 1, 10, " Ω"), K.rng("V", "Supply", 1, 12, 0.5, 6, " V"), K.sel("sw", "Switch", ["Closed (current growing)", "Opened (current collapsing)"], 0)],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; if (s.t > (8 * c.L) / c.R + 1) s.t = 0; },
    draw(ctx, s, c) {
      const tau = c.L / c.R, I0 = c.V / c.R, I = c.sw === 0 ? I0 * (1 - Math.exp(-s.t / tau)) : I0 * Math.exp(-s.t / tau), emf = c.sw === 0 ? -c.V * Math.exp(-s.t / tau) : c.V * Math.exp(-s.t / tau) * 8;
      const A = axes(ctx, 70, 50, 300, 130, { x0: 0, x1: 6 * tau, y0: 0, y1: I0 * 1.1, nx: 6, xl: "time (s)", yl: "current (A)", title: "Current (rises slowly — the coil opposes the change)" }); plot(ctx, A, (t) => (c.sw === 0 ? I0 * (1 - Math.exp(-t / tau)) : I0 * Math.exp(-t / tau)), 0, 6 * tau, C.teal); circ(ctx, A.X(Math.min(s.t, 6 * tau)), A.Y(I), 5, C.amber); line(ctx, A.X(tau), A.y, A.X(tau), A.y + A.h, C.dim, 1, [3, 3]); txt(ctx, A.X(tau) + 4, A.y + 12, "τ = L/R", C.dim, 10);
      for (let i = 0; i < 8; i++) { ctx.save(); ctx.beginPath(); ctx.ellipse(100 + i * 18, 280, 8, 26, 0, 0, K.TAU); ctx.strokeStyle = "#c87a3a"; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore(); } rect(ctx, 90, 274, 150, 12, "rgba(160,160,170,.6)"); txt(ctx, 170, 330, "coil with iron core", C.dim, 10, "center"); circ(ctx, 300, 280, 16, `rgba(255,230,128,${clamp(I / I0, 0.05, 1)})`, "#888"); txt(ctx, 300, 314, c.sw === 1 && s.t < tau ? "spark at switch!" : "lamp", c.sw === 1 && s.t < tau ? C.red : C.dim, 10, "center");
      panel(ctx, 400, 30, 228, 340, null); notes(ctx, 410, 52, 210, [["Time constant τ = L/R = " + f(tau, 3) + " s", C.chalk], ["Current now " + f(I, 3) + " A (max " + f(I0, 2) + " A)", C.amber], ["Back e.m.f. now ≈ " + f(emf, 2) + " V", C.red], "Energy stored in the field = ½LI² = " + f(0.5 * c.L * I * I, 3) + " J", c.sw === 1 ? "Breaking the circuit makes I fall very fast: a large e.m.f. can cause a spark (used in car ignition coils)." : "Lenz's law: the induced e.m.f. opposes the change producing it.", "Unit of inductance: henry (H) — 1 V induced when current changes at 1 A/s."], 10.5);
    },
    readouts(s, c) { const tau = c.L / c.R, I0 = c.V / c.R, I = c.sw === 0 ? I0 * (1 - Math.exp(-s.t / tau)) : I0 * Math.exp(-s.t / tau); return [["Current", f(I, 3) + " A"], ["Time constant", f(tau, 3) + " s"], ["Energy ½LI²", f(0.5 * c.L * I * I, 3) + " J"]]; },
  });

  /* ---------- T27 Eddy currents ---------- */
  K.add("27", {
    modeName: "Eddy Currents — Magnetic Braking", tag: "LENZ'S LAW IN BULK METAL", eqn: "A moving magnet induces circulating (eddy) currents in nearby metal; they oppose the motion → braking and heating",
    controls: [K.sel("tube", "Tube the magnet falls through", ["Plastic (no eddy currents)", "Aluminium", "Copper (thicker)", "Copper with a slit"], 2), K.rng("B", "Magnet strength", 0.2, 1.5, 0.05, 1)],
    reset(s) { s.y = 0; s.v = 0; s.t = 0; },
    step(s, c, dt) { const k = [0, 6, 14, 1][c.tube] * c.B * c.B; s.v += (K.g - k * s.v) * dt; s.y += s.v * dt; s.t += dt; if (s.y > 1.2) { s.y = 0; s.v = 0; s.t = 0; } },
    draw(ctx, s, c) {
      const top = 40, H = 300, x = 200; rect(ctx, x - 30, top, 60, H, ["rgba(220,235,255,.15)", "#a8b0bc", "#c87a3a", "#c87a3a"][c.tube], "#888"); if (c.tube === 3) rect(ctx, x - 2, top, 4, H, "#050c17"); const my = top + (s.y / 1.2) * H; rect(ctx, x - 16, my - 14, 32, 28, "#d84a3a"); rect(ctx, x - 16, my, 32, 14, "#2a6ad8");
      if (c.tube === 1 || c.tube === 2) for (const dy of [-26, 26]) { ctx.save(); ctx.beginPath(); ctx.ellipse(x, my + dy, 36, 8, 0, 0, K.TAU); ctx.strokeStyle = "rgba(255,183,3,.7)"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); }
      const k = [0, 6, 14, 1][c.tube] * c.B * c.B, vt = k > 0 ? K.g / k : Infinity; panel(ctx, 300, 30, 328, 340, ["Plastic", "Aluminium", "Copper", "Slit copper"][c.tube]); notes(ctx, 310, 70, 310, [["Speed now " + f(s.v, 2) + " m/s; terminal speed " + (isFinite(vt) ? f(vt, 2) + " m/s" : "none (free fall)"), C.amber], ["Time in tube so far: " + f(s.t, 2) + " s", C.chalk], c.tube === 0 ? "Plastic is an insulator: no induced currents, the magnet falls freely." : c.tube === 3 ? "The slit breaks the circular current paths, so the braking almost disappears." : "Induced eddy currents produce their own magnetic field that opposes the falling magnet (Lenz's law).", "Uses: induction furnace and cooker (heating), eddy-current brakes on trains, damping of moving-coil meters, car speedometers.", "Unwanted in transformers: cores are laminated (thin insulated sheets) to reduce eddy-current losses."], 10.5);
    },
    readouts(s, c) { const k = [0, 6, 14, 1][c.tube] * c.B * c.B; return [["Speed", f(s.v, 2) + " m/s"], ["Terminal speed", k > 0 ? f(K.g / k, 2) + " m/s" : "—"], ["Eddy currents", c.tube === 0 ? "none" : c.tube === 3 ? "weak" : "strong"]]; },
  });

  /* ---------- T27 Power transmission ---------- */
  K.add("27", {
    modeName: "Power Transmission — Why High Voltage?", tag: "LOSS = I²R", eqn: "For the same power P = VI, raising V lowers the current I; cable loss = I²R falls by the square of the voltage ratio",
    controls: [K.rng("P", "Power sent", 10, 500, 10, 100, " MW"), K.rng("V", "Transmission voltage", 11, 400, 1, 330, " kV"), K.rng("R", "Total cable resistance", 1, 30, 0.5, 10, " Ω")],
    reset(s) { s.u = 0; }, step(s, c, dt) { s.u += dt; },
    draw(ctx, s, c) {
      const I = (c.P * 1e6) / (c.V * 1e3), loss = I * I * c.R, pct = (loss / (c.P * 1e6)) * 100; rect(ctx, 30, 220, 70, 80, "#6a6a72", "#333"); txt(ctx, 65, 316, "power station 11–25 kV", C.dim, 9.5, "center"); rect(ctx, 120, 240, 40, 50, "#8a8f99"); txt(ctx, 140, 306, "step-up", C.dim, 9.5, "center");
      for (const x of [220, 330, 440]) { line(ctx, x, 300, x, 120, "#9aa0a8", 3); line(ctx, x - 20, 130, x + 20, 130, "#9aa0a8", 3); } ctx.save(); ctx.strokeStyle = `rgba(255,${200 - clamp(pct * 10, 0, 180)},${100 - clamp(pct * 5, 0, 100)},.9)`; ctx.lineWidth = 2 + clamp(pct, 0, 6); ctx.beginPath(); ctx.moveTo(160, 250); ctx.quadraticCurveTo(190, 150, 220, 130); ctx.quadraticCurveTo(275, 150, 330, 130); ctx.quadraticCurveTo(385, 150, 440, 130); ctx.quadraticCurveTo(470, 150, 490, 250); ctx.stroke(); ctx.restore();
      for (let i = 0; i < 6; i++) { const u = (s.u * clamp(I / 2000, 0.1, 2) + i / 6) % 1; circ(ctx, 160 + u * 330, 140 + Math.sin(u * Math.PI * 3) * 10, 3, C.amber); } rect(ctx, 490, 240, 40, 50, "#8a8f99"); txt(ctx, 510, 306, "step-down", C.dim, 9.5, "center"); rect(ctx, 560, 230, 60, 60, "#a86a4a"); txt(ctx, 590, 306, "homes 230 V", C.dim, 9.5, "center");
      panel(ctx, 30, 30, 600, 70, null); notes(ctx, 40, 52, 580, [["Current in cables I = P/V = " + f(I, 0) + " A · power lost = I²R = " + f(loss / 1e6, 3) + " MW (" + f(pct, 2) + " %)", pct > 5 ? C.red : C.green], "Try 11 kV: the current is 30× bigger and the loss 900× bigger. Transformers make high-voltage a.c. transmission practical; household wiring uses live, neutral and earth wires with fuses."], 10.5);
    },
    readouts(s, c) { const I = (c.P * 1e6) / (c.V * 1e3), loss = I * I * c.R; return [["Line current", f(I, 0) + " A"], ["Power lost", f(loss / 1e6, 3) + " MW"], ["% lost", f((loss / (c.P * 1e6)) * 100, 2) + " %"]]; },
  });

  /* ---------- T28 Phasor diagram and power factor ---------- */
  K.add("28", {
    modeName: "R-L-C Phasor Diagram & Power", tag: "Z = √(R² + (X_L − X_C)²)", eqn: "V_R in phase with I · V_L leads I by 90° · V_C lags by 90° · tanφ = (X_L − X_C)/R · average power P = I_rms V_rms cosφ = I²_rms R",
    controls: [K.rng("R", "Resistance R", 10, 200, 5, 60, " Ω"), K.rng("L", "Inductance L", 0, 1, 0.01, 0.3, " H", 2), K.rng("C", "Capacitance C", 1, 100, 1, 20, " µF"), K.rng("f", "Frequency f", 10, 200, 1, 50, " Hz"), K.rng("V", "Supply r.m.s. voltage", 10, 240, 5, 230, " V")],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; },
    draw(ctx, s, c) {
      const w = K.TAU * c.f, XL = w * c.L, XC = 1 / (w * c.C * 1e-6), Z = Math.hypot(c.R, XL - XC), I = c.V / Z, phi = Math.atan2(XL - XC, c.R), VR = I * c.R, VL = I * XL, VC = I * XC, P = I * I * c.R; const ox = 170, oy = 210, sc = 120 / Math.max(VR, VL, VC, c.V), rot = s.t * 0.6;
      const ph = (mag, ang, col, lab) => { const a = ang + rot; arr(ctx, ox, oy, ox + mag * sc * Math.cos(a), oy - mag * sc * Math.sin(a), col, 2.6); txt(ctx, ox + mag * sc * Math.cos(a) * 1.12, oy - mag * sc * Math.sin(a) * 1.12, lab, col, 10.5, "center", true); };
      circ(ctx, ox, oy, 130, null, "rgba(255,255,255,.08)", 1); ph(VR, 0, C.teal, "V_R"); ph(VL, Math.PI / 2, C.amber, "V_L"); ph(VC, -Math.PI / 2, C.blue, "V_C"); ph(c.V, phi, C.red, "V"); txt(ctx, ox, oy + 160, "phasors rotate at ω; current I is in phase with V_R", C.dim, 10, "center");
      const A = axes(ctx, 350, 50, 270, 130, { x0: 0, x1: 2 / c.f, y0: -1.5, y1: 1.5, nx: 4, xl: "time (s)", yl: "", title: "v (red) and i (teal) — phase φ = " + f(deg(phi), 1) + "°" }); plot(ctx, A, (t) => Math.sin(w * t), 0, 2 / c.f, C.red, 2); plot(ctx, A, (t) => 0.8 * Math.sin(w * t - phi), 0, 2 / c.f, C.teal, 2);
      notes(ctx, 350, 220, 275, [["X_L = ωL = " + f(XL, 1) + " Ω · X_C = 1/ωC = " + f(XC, 1) + " Ω", C.chalk], ["Impedance Z = " + f(Z, 1) + " Ω → I = V/Z = " + f(I, 3) + " A", C.amber], ["Power factor cosφ = " + f(Math.cos(phi), 3), C.teal], ["Average power P = I²R = " + f(P, 1) + " W", C.teal], "Pure L or C uses no average power (cos 90° = 0); all power is dissipated in R.", Math.abs(XL - XC) < 0.03 * Z ? ["At resonance: X_L = X_C, Z = R, φ = 0.", C.green] : ""], 10.5);
    },
    readouts(s, c) { const w = K.TAU * c.f, XL = w * c.L, XC = 1 / (w * c.C * 1e-6), Z = Math.hypot(c.R, XL - XC), phi = Math.atan2(XL - XC, c.R), I = c.V / Z; return [["Impedance Z", f(Z, 1) + " Ω"], ["Phase angle φ", f(deg(phi), 1) + "°"], ["Average power", f(I * I * c.R, 1) + " W"]]; },
  });
});
