/* p2d-matter.js — Topics 1, 3, 5, 6: Brownian motion, surface tension & capillarity, crystal structures,
   vernier calipers & micrometer, timing an interval, density & relative density, Archimedes with a spring balance,
   manometer, siphon, hydrometer / flotation / submarine. */
window.PX.push(function () {
  const K = window.PK, C = K.C, { txt, line, rect, circ, arr, panel, notes, axes, plot, f, clamp } = K;

  /* ---------- T1 Brownian motion (smoke cell) ---------- */
  K.add("1", {
    modeName: "Brownian Motion — Smoke Cell", tag: "EVIDENCE FOR PARTICLES", eqn: "Invisible air molecules strike a visible smoke particle unevenly → random zig-zag path",
    controls: [K.rng("T", "Air temperature", 100, 900, 10, 300, " K"), K.sel("show", "Air molecules", ["Hidden (as seen in microscope)", "Shown"], 0), K.rng("M", "Smoke particle mass (× molecule)", 20, 400, 10, 80)],
    reset(s) { const r = K.rnd(7); s.m = []; for (let i = 0; i < 170; i++) { const a = r() * K.TAU; s.m.push({ x: 40 + r() * 370, y: 40 + r() * 320, vx: Math.cos(a), vy: Math.sin(a) }); } s.P = { x: 225, y: 200, vx: 0, vy: 0 }; s.trail = [[225, 200]]; s.t = 0; s.hits = 0; },
    step(s, c, dt) {
      const v0 = 160 * Math.sqrt(c.T / 300), P = s.P, R = 9, M = c.M; s.t += dt;
      for (const q of s.m) { q.x += q.vx * v0 * dt; q.y += q.vy * v0 * dt; if (q.x < 34 || q.x > 416) { q.vx *= -1; q.x = clamp(q.x, 34, 416); } if (q.y < 34 || q.y > 366) { q.vy *= -1; q.y = clamp(q.y, 34, 366); }
        const dx = q.x - P.x, dy = q.y - P.y, d = Math.hypot(dx, dy); if (d < R + 2 && d > 0) { const nx = dx / d, ny = dy / d, vrel = (q.vx * v0 - P.vx) * nx + (q.vy * v0 - P.vy) * ny; if (vrel < 0) { const J = (2 * vrel) / (1 + 1 / M); P.vx += (J / M) * nx; P.vy += (J / M) * ny; q.vx -= (J / v0) * nx; q.vy -= (J / v0) * ny; const sp = Math.hypot(q.vx, q.vy) || 1; q.vx /= sp; q.vy /= sp; s.hits++; } q.x = P.x + nx * (R + 2.2); q.y = P.y + ny * (R + 2.2); } }
      P.x += P.vx * dt; P.y += P.vy * dt; if (P.x < 50 || P.x > 400) { P.vx *= -1; P.x = clamp(P.x, 50, 400); } if (P.y < 50 || P.y > 350) { P.vy *= -1; P.y = clamp(P.y, 50, 350); }
      const L = s.trail[s.trail.length - 1]; if (Math.hypot(P.x - L[0], P.y - L[1]) > 3) { s.trail.push([P.x, P.y]); if (s.trail.length > 600) s.trail.shift(); }
    },
    draw(ctx, s, c) {
      rect(ctx, 30, 30, 390, 340, "rgba(10,20,34,.9)", C.line, 2); txt(ctx, 36, 24, "Smoke cell under a microscope (side lit)", C.dim, 11);
      if (c.show) s.m.forEach((q) => circ(ctx, q.x, q.y, 2, "rgba(147,170,196,.7)"));
      if (typeof glowLine === "function" && s.trail.length > 1) glowLine(ctx, s.trail, "rgba(255,183,3,.55)", 1.4, 3);
      if (typeof dot === "function") dot(ctx, s.P.x, s.P.y, 9, "#f4f0e0", 14);
      panel(ctx, 432, 30, 196, 340, "What you see");
      notes(ctx, 442, 70, 178, ["Bright specks of smoke move in a random zig-zag (Brownian motion).", "Cause: fast, invisible air molecules hit each speck unevenly from all sides.", "Hotter air → faster molecules → more vigorous motion.", "Heavier specks move less.", ["Evidence that matter is made of tiny, moving particles (kinetic theory).", C.teal]]);
    },
    readouts(s, c) { const d = Math.hypot(s.P.x - 225, s.P.y - 200); return [["Molecule speed (relative)", "×" + f(Math.sqrt(c.T / 300), 2)], ["Speck displacement", f(d / 10, 1) + " µm (scaled)"], ["Molecular impacts", s.hits]]; },
  });

  /* ---------- T1 Surface tension and capillarity ---------- */
  const LIQ = [["Water", 0.072, 0, 1000, "#4aa8ff"], ["Mercury", 0.465, 140, 13600, "#c8ccd4"], ["Ethanol", 0.022, 0, 789, "#9fd8ff"], ["Soapy water", 0.03, 0, 1000, "#b8e0ff"]];
  K.add("1", {
    modeName: "Cohesion, Adhesion & Capillarity", tag: "SURFACE TENSION", eqn: "h = 2γ·cosθ / (ρ·g·r)     adhesion > cohesion → liquid rises, concave meniscus",
    controls: [K.sel("liq", "Liquid", LIQ.map((l) => l[0]), 0), K.rng("r", "Narrowest tube radius", 0.2, 2, 0.1, 0.5, " mm")],
    draw(ctx, s, c) {
      const [nm, gam, th, rho, col] = LIQ[c.liq], base = 300, scale = 6; // px per mm
      rect(ctx, 40, base, 360, 70, col + "aa", C.line, 2); txt(ctx, 46, base + 62, nm + " in a trough", C.chalk, 11);
      [1, 2, 4].forEach((mul, i) => { const r = c.r * mul / 1000, h = (2 * gam * Math.cos(K.rad(th))) / (rho * K.g * r), hmm = h * 1000, x = 90 + i * 110, wpx = 8 + mul * 6, top = base - 250, yl = clamp(base - hmm * scale, top + 4, base + 60);
        rect(ctx, x - wpx / 2, yl, wpx, base + 40 - yl, col + "dd"); ctx.save(); ctx.strokeStyle = "rgba(220,235,255,.8)"; ctx.lineWidth = 2; ctx.strokeRect(x - wpx / 2, top, wpx, base + 40 - top); ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.moveTo(x - wpx / 2, yl); ctx.quadraticCurveTo(x, yl + (th > 90 ? -1 : 1) * wpx * 0.45, x + wpx / 2, yl); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
        txt(ctx, x, top - 8, "r = " + f(c.r * mul, 1) + " mm", C.dim, 10, "center"); txt(ctx, x, Math.min(yl, base) - 10, (hmm >= 0 ? "+" : "") + f(hmm, 1) + " mm", hmm >= 0 ? C.teal : C.red, 11, "center", true); });
      line(ctx, 40, base, 400, base, "#fff", 1, [4, 3]);
      panel(ctx, 420, 30, 208, 340, nm);
      notes(ctx, 430, 70, 190, [["γ = " + gam + " N/m · θ = " + th + "° · ρ = " + rho + " kg/m³", C.amber], th < 90 ? "Adhesion (liquid–glass) is stronger than cohesion (liquid–liquid): the liquid wets the glass, the meniscus is concave and the liquid RISES." : "Cohesion is stronger than adhesion: mercury does not wet glass, the meniscus is convex and the level is DEPRESSED.", "Narrower tube → greater rise (h ∝ 1/r).", "Examples: water rising in soil, wicks, blotting paper, towels; insects walking on water (surface tension)."]);
    },
    readouts(s, c) { const [nm, gam, th, rho] = LIQ[c.liq], r = c.r / 1000, h = (2 * gam * Math.cos(K.rad(th))) / (rho * K.g * r); return [["Liquid", nm], ["Height in narrowest tube", f(h * 1000, 1) + " mm"], ["Meniscus", th < 90 ? "concave (wets glass)" : "convex (does not wet)"]]; },
  });

  /* ---------- T1 Crystalline vs amorphous ---------- */
  const CELLS = [["Simple cubic", 1, 6, 52.4], ["Body-centred cubic (BCC)", 2, 8, 68.0], ["Face-centred cubic (FCC)", 4, 12, 74.0], ["Amorphous (glass)", 0, 0, 0]];
  K.add("1", {
    modeName: "Crystalline vs Amorphous Solids", tag: "ATOMIC ARRANGEMENT", eqn: "Crystals: regular repeating unit cell · Amorphous: no long-range order",
    controls: [K.sel("cell", "Structure", CELLS.map((x) => x[0]), 2), K.rng("spin", "Rotation speed", 0, 1, 0.05, 0.4)],
    reset(s) { s.a = 0.6; }, step(s, c, dt) { s.a = (s.a || 0) + dt * c.spin; },
    draw(ctx, s, c) {
      const cx = 210, cy = 205, Lp = 110, ca = Math.cos(s.a || 0), sa = Math.sin(s.a || 0), P = (x, y, z) => { const X = x * ca - z * sa, Z = x * sa + z * ca; return [cx + X * Lp, cy - y * Lp + Z * Lp * 0.35, Z]; };
      const pts = [], edges = []; if (c.cell < 3) { for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) pts.push([x, y, z, C.teal]); if (c.cell === 1) pts.push([0, 0, 0, C.amber]); if (c.cell === 2) [[0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]].forEach((p) => pts.push([...p, C.amber]));
        const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]; [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => edges.push([V[a], V[b]])); }
      else { const r = K.rnd(11); for (let i = 0; i < 26; i++) pts.push([r() * 2.4 - 1.2, r() * 2.4 - 1.2, r() * 2.4 - 1.2, C.purple]); }
      edges.forEach(([a, b]) => { const A = P(...a), B = P(...b); line(ctx, A[0], A[1], B[0], B[1], "rgba(147,170,196,.45)", 1.4); });
      pts.map((p) => [P(p[0], p[1], p[2]), p[3]]).sort((a, b) => a[0][2] - b[0][2]).forEach(([q, col]) => { const r = 14 + q[2] * 3; if (typeof dot === "function") dot(ctx, q[0], q[1], r, col, 10); else circ(ctx, q[0], q[1], r, col); });
      const Cc = CELLS[c.cell]; panel(ctx, 420, 30, 208, 340, Cc[0]);
      notes(ctx, 430, 70, 190, c.cell < 3 ? [["Atoms per unit cell: " + Cc[1], C.amber], ["Each atom touches " + Cc[2] + " neighbours (coordination number)", C.teal], "Packing fraction ≈ " + Cc[3] + " %", c.cell === 1 ? "Corner atoms (teal) are shared by 8 cells: 8 × ⅛ = 1, plus 1 at the centre = 2. Examples: iron, sodium." : c.cell === 2 ? "Corners 8 × ⅛ = 1, face centres 6 × ½ = 3 → 4 atoms. Examples: copper, aluminium, gold." : "Corners only: 8 × ⅛ = 1 atom per cell. Example: polonium.", "Crystalline solids have sharp melting points and flat faces when cleaved."] : [["No repeating unit cell — only short-range order.", C.amber], "Melt gradually over a range of temperatures (soften).", "Examples: glass, rubber, plastics, wax, pitch."]);
    },
    readouts(s, c) { const Cc = CELLS[c.cell]; return [["Structure", Cc[0]], ["Atoms per cell", Cc[1] || "—"], ["Coordination no.", Cc[2] || "—"]]; },
  });

  /* ---------- T3 Vernier calipers and micrometer screw gauge ---------- */
  K.add("3", {
    modeName: "Vernier Calipers & Micrometer", tag: "MEASURING SMALL LENGTHS", eqn: "Vernier: least count 0.1 mm (0.01 cm) · Micrometer: least count 0.01 mm",
    controls: [K.sel("ins", "Instrument", ["Vernier calipers", "Micrometer screw gauge"], 0), K.rng("L", "True length of object", 1, 48, 0.01, 23.47, " mm", 2), K.rng("z", "Zero error", -0.05, 0.05, 0.01, 0, " mm", 2)],
    draw(ctx, s, c) {
      if (c.ins === 0) {
        const read = Math.round((c.L + c.z) * 10) / 10, sc = 12, x0 = 40, y = 150; // 12 px per mm
        rect(ctx, x0 - 10, y - 50, 600, 50, "#c8ccd4", "#555", 1); for (let mm = 0; mm <= 48; mm++) { const x = x0 + mm * sc; line(ctx, x, y, x, y - (mm % 10 === 0 ? 26 : mm % 5 === 0 ? 18 : 11), "#111", 1.2); if (mm % 10 === 0) txt(ctx, x, y - 30, String(mm / 10), "#111", 11, "center", true); }
        txt(ctx, x0 + 560, y - 34, "cm", "#111", 10);
        const vx = x0 + read * sc; rect(ctx, vx - 4, y, 9.6 * sc + 10, 40, "#e8e0c0", "#555", 1); for (let i = 0; i <= 10; i++) { const x = vx + i * 0.9 * sc, al = Math.abs((read * 10 % 10) - i) < 0.01 || (i === 10 && read * 10 % 10 === 0); line(ctx, x, y, x, y + (i % 5 === 0 ? 20 : 12), al ? C.red : "#111", al ? 2.4 : 1.2); if (i % 5 === 0) txt(ctx, x, y + 32, String(i), "#111", 10, "center"); }
        rect(ctx, x0 - 10, y - 50, 8, 120, "#9aa0a8"); rect(ctx, vx - 6, y - 50, 8, 120, "#9aa0a8"); rect(ctx, x0, y + 50, c.L * sc, 24, "rgba(255,183,3,.7)", C.amber); txt(ctx, x0 + c.L * sc / 2, y + 66, "object", "#111", 10, "center");
        const ms = Math.floor(read), vs = Math.round((read - ms) * 10);
        panel(ctx, 30, 250, 598, 120, "Reading the vernier calipers"); notes(ctx, 40, 290, 578, [["Main scale (just before vernier zero): " + ms + " mm = " + f(ms / 10, 1) + " cm", C.chalk], ["Vernier division in line with a main-scale mark (red): " + vs + " × 0.1 mm = " + f(vs / 10, 1) + " mm", C.chalk], ["Reading = " + f(read, 1) + " mm; corrected for zero error (" + f(c.z, 2) + " mm) = " + f(read - c.z, 2) + " mm", C.amber], "10 vernier divisions = 9 mm, so each is 0.9 mm and the least count is 1 − 0.9 = 0.1 mm."]);
      } else {
        const read = Math.round((c.L + c.z) * 100) / 100, sl = Math.floor(read * 2) / 2, th = Math.round((read - sl) * 100), y = 140, x0 = 60, sc = 20;
        rect(ctx, 30, y - 50, 30, 100, "#9aa0a8"); rect(ctx, x0, y - 10, Math.min(c.L, 14) * 8, 20, "rgba(255,183,3,.7)", C.amber); rect(ctx, x0 + Math.min(c.L, 14) * 8, y - 8, 120, 16, "#c8ccd4");
        const sx = 260; rect(ctx, sx, y - 14, 220, 28, "#c8ccd4", "#555"); line(ctx, sx, y, sx + 220, y, "#111", 1.2);
        for (let h = 0; h <= sl * 2 && h < 22; h++) { const x = sx + (h * 0.5 - Math.max(0, sl - 5.5)) * sc; if (x < sx || x > sx + 160) continue; line(ctx, x, y, x, y + (h % 2 === 0 ? -12 : 10), "#111", 1.2); if (h % 2 === 0 && (h / 2) % 5 === 0) txt(ctx, x, y - 16, String(h / 2), "#111", 10, "center"); }
        const tx = sx + 165; rect(ctx, tx, y - 46, 70, 92, "#b8bec8", "#555"); for (let k = -4; k <= 4; k++) { const v = (th + k + 50) % 50, yy = y - k * 10; line(ctx, tx, yy, tx + (v % 5 === 0 ? 18 : 10), yy, k === 0 ? C.red : "#111", k === 0 ? 2.4 : 1.2); if (v % 5 === 0) txt(ctx, tx + 22, yy + 4, String(v), "#111", 10); }
        rect(ctx, tx + 70, y - 30, 40, 60, "#9aa0a8"); txt(ctx, tx + 90, y + 46, "ratchet", C.dim, 9.5, "center");
        panel(ctx, 30, 250, 598, 120, "Reading the micrometer screw gauge"); notes(ctx, 40, 290, 578, [["Sleeve: " + f(sl, 1) + " mm (upper = whole mm, lower = half mm)", C.chalk], ["Thimble division on the datum line (red): " + th + " × 0.01 mm = " + f(th / 100, 2) + " mm", C.chalk], ["Reading = " + f(read, 2) + " mm; corrected for zero error = " + f(read - c.z, 2) + " mm", C.amber], "Pitch 0.5 mm ÷ 50 thimble divisions = 0.01 mm least count. Turn with the ratchet to avoid over-tightening."]);
      }
    },
    readouts(s, c) { const v = c.ins === 0 ? Math.round((c.L + c.z) * 10) / 10 : Math.round((c.L + c.z) * 100) / 100; return [["Instrument reads", f(v, c.ins ? 2 : 1) + " mm"], ["Corrected reading", f(v - c.z, 2) + " mm"], ["Least count", c.ins ? "0.01 mm" : "0.1 mm"]]; },
  });

  /* ---------- T5 Timing an interval ---------- */
  K.add("5", {
    modeName: "Timing an Interval — Stopwatch & Pendulum", tag: "REDUCING TIMING ERROR", eqn: "Period T = (time for n oscillations) ÷ n  — timing many swings divides the reaction-time error by n",
    controls: [K.rng("n", "Oscillations timed (n)", 1, 50, 1, 20), K.rng("rt", "Reaction time error", 0.05, 0.4, 0.01, 0.2, " s", 2), K.rng("L", "Pendulum length", 0.2, 2, 0.05, 1, " m", 2)],
    reset(s) { s.t = 0; s.trial = 0; s.res = []; s.r = K.rnd(3); s.err = 0; },
    step(s, c, dt) { const T = K.TAU * Math.sqrt(c.L / K.g); s.t += dt; if (s.t >= c.n * T) { const e = (s.r() - 0.5) * 2 * c.rt; s.res.unshift((c.n * T + e) / c.n); if (s.res.length > 6) s.res.pop(); s.t = 0; } },
    draw(ctx, s, c) {
      const T = K.TAU * Math.sqrt(c.L / K.g), th = 0.25 * Math.cos((K.TAU * s.t) / T), px = 160, py = 50, Lp = 110 + c.L * 70, bx = px + Lp * Math.sin(th), by = py + Lp * Math.cos(th);
      line(ctx, 80, py, 240, py, C.dim, 4); line(ctx, px, py, bx, by, C.chalk, 1.5); if (typeof dot === "function") dot(ctx, bx, by, 13, C.amber, 10);
      txt(ctx, 160, 385, "Swings counted: " + Math.floor(s.t / T) + " / " + c.n, C.chalk, 12, "center");
      circ(ctx, 330, 120, 52, "#141e2e", C.teal, 3); const ang = (s.t / 60) * K.TAU; line(ctx, 330, 120, 330 + 42 * Math.sin(ang), 120 - 42 * Math.cos(ang), C.red, 2); txt(ctx, 330, 196, f(s.t, 2) + " s", C.teal, 16, "center", true);
      panel(ctx, 400, 30, 228, 230, "Results (T in s)"); s.res.forEach((v, i) => txt(ctx, 412, 70 + i * 20, "Trial " + (s.res.length - i) + ": T = " + f(v, 3) + " s", i ? C.dim : C.amber, 12));
      txt(ctx, 412, 200, "True T = 2π√(L/g) = " + f(T, 3) + " s", C.teal, 11.5); txt(ctx, 412, 220, "Max error in T = ±" + f(c.rt / c.n, 3) + " s", C.chalk, 11.5); txt(ctx, 412, 240, "= ±" + f((c.rt / c.n / T) * 100, 2) + " %", C.chalk, 11.5);
      panel(ctx, 280, 270, 348, 100, "Devices for measuring time"); notes(ctx, 290, 306, 330, ["Heart-beat (pulse), sand-clock, water-clock, ticker-timer (1/50 s), pendulum clock, stopwatch, digital timer. SI unit: second (s).", ["Count many oscillations and start timing at the centre of the swing.", C.teal]], 10.5);
    },
    readouts(s, c) { const T = K.TAU * Math.sqrt(c.L / K.g); return [["True period", f(T, 3) + " s"], ["Last measured T", s.res[0] ? f(s.res[0], 3) + " s" : "timing…"], ["% error bound", f((c.rt / c.n / T) * 100, 2) + " %"]]; },
  });

  /* ---------- T6 Density and relative density ---------- */
  const SOL = [["Aluminium", 2700], ["Iron", 7870], ["Brass", 8500], ["Glass", 2500], ["Hard wood", 700], ["Stone", 2600]];
  const LQ = [["Kerosene", 800], ["Olive oil", 920], ["Sea water", 1030], ["Glycerine", 1260], ["Mercury", 13600]];
  K.add("6", {
    modeName: "Density & Relative Density", tag: "ρ = m / V", eqn: "Density ρ = mass ÷ volume (kg/m³) · Relative density = ρ(substance) ÷ ρ(water)",
    controls: [K.sel("m", "Method", ["Irregular solid — displacement", "Liquid — density bottle"], 0), K.sel("sol", "Solid", SOL.map((x) => x[0]), 0), K.rng("V", "Volume of solid", 5, 40, 1, 20, " cm³"), K.sel("liq", "Liquid", LQ.map((x) => x[0]), 0)],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t = Math.min(1, (s.t || 0) + dt * 0.4); },
    draw(ctx, s, c) {
      if (c.m === 0) {
        const [nm, rho] = SOL[c.sol], mass = (rho * c.V) / 1000 /* grams */, V1 = 50, V2 = 50 + c.V * Math.min(1, s.t * 1.4), x = 150, base = 340, sc = 2.2;
        rect(ctx, x - 40, base - 100 * sc, 80, 100 * sc, "rgba(200,230,255,.08)", "rgba(220,235,255,.8)", 2); for (let v = 0; v <= 100; v += 10) { line(ctx, x - 40, base - v * sc, x - 28, base - v * sc, C.dim, 1); txt(ctx, x - 44, base - v * sc + 3, String(v), C.dim, 9, "right"); }
        rect(ctx, x - 38, base - V2 * sc, 76, V2 * sc, "rgba(74,168,255,.45)"); const sy = base - 40 + (1 - Math.min(1, s.t * 1.4)) * -200; rect(ctx, x - 14, Math.max(sy, base - 40 - 20), 28, 26, rho < 1000 ? "#a07040" : "#8a8f99", "#333"); txt(ctx, x + 50, base - V2 * sc + 4, "← " + f(V2, 1) + " cm³", C.teal, 11);
        rect(ctx, 260, 280, 120, 50, "#2a2f38", "#555"); txt(ctx, 320, 310, f(mass, 1) + " g", C.green, 16, "center", true); txt(ctx, 320, 345, "balance (mass of solid)", C.dim, 10, "center");
        panel(ctx, 400, 30, 228, 340, nm); notes(ctx, 410, 70, 210, ["Initial water level V₁ = " + V1 + " cm³", "Final level V₂ = " + f(50 + c.V, 1) + " cm³", "Volume = V₂ − V₁ = " + c.V + " cm³", "Mass = " + f(mass, 1) + " g", ["ρ = m/V = " + f(mass / c.V, 2) + " g/cm³ = " + f(rho, 0) + " kg/m³", C.amber], ["Relative density = " + f(rho / 1000, 2), C.teal], rho < 1000 ? "Wood floats: use a sinker to push it under and subtract the sinker's displacement." : "Read the bottom of the meniscus at eye level."]);
      } else {
        const [nm, rho] = LQ[c.liq], m1 = 25.0, Vb = 50, m2 = m1 + Vb, m3 = m1 + (rho * Vb) / 1000, rd = (m3 - m1) / (m2 - m1);
        [[m1, "Empty bottle m₁", null], [m2, "Full of water m₂", "#4aa8ff"], [m3, "Full of " + nm.toLowerCase() + " m₃", nm === "Mercury" ? "#c8ccd4" : "#d8b450"]].forEach(([m, lab, col], i) => { const x = 70 + i * 115; K.poly(ctx, [[x - 24, 300], [x + 24, 300], [x + 24, 230], [x + 8, 210], [x + 8, 190], [x - 8, 190], [x - 8, 210], [x - 24, 230]], "rgba(220,235,255,.85)", col ? col + "aa" : null); rect(ctx, x - 40, 300, 80, 24, "#2a2f38", "#555"); txt(ctx, x, 317, f(m, 1) + " g", C.green, 12, "center", true); txt(ctx, x, 345, lab, C.dim, 9.5, "center"); });
        panel(ctx, 400, 30, 228, 340, "Density bottle"); notes(ctx, 410, 70, 210, ["Bottle volume = " + Vb + " cm³ (fixed by the stopper's capillary)", "Mass of water = m₂ − m₁ = " + f(m2 - m1, 1) + " g", "Mass of " + nm.toLowerCase() + " = m₃ − m₁ = " + f(m3 - m1, 1) + " g", ["R.D. = (m₃ − m₁) ÷ (m₂ − m₁) = " + f(rd, 3), C.amber], ["ρ = R.D. × 1000 = " + f(rd * 1000, 0) + " kg/m³", C.teal], "Same volume of each liquid is weighed, so R.D. = mass of liquid ÷ mass of equal volume of water."]);
      }
    },
    readouts(s, c) { if (c.m === 0) { const [nm, rho] = SOL[c.sol]; return [["Solid", nm], ["Density", f(rho, 0) + " kg/m³"], ["Relative density", f(rho / 1000, 2)]]; } const [nm, rho] = LQ[c.liq]; return [["Liquid", nm], ["Density", rho + " kg/m³"], ["Relative density", f(rho / 1000, 3)]]; },
  });

  /* ---------- T6 Archimedes with spring balance ---------- */
  K.add("6", {
    modeName: "Archimedes' Principle — Spring Balance", tag: "UPTHRUST = WEIGHT OF FLUID DISPLACED", eqn: "Upthrust U = W(air) − W(fluid) = ρ(fluid)·V(displaced)·g     R.D.(solid) = W(air) ÷ (W(air) − W(water))",
    controls: [K.rng("rho", "Density of solid", 1500, 11000, 100, 7800, " kg/m³"), K.rng("V", "Volume of solid", 50, 400, 10, 200, " cm³"), K.rng("d", "Lower the solid (fraction submerged)", 0, 1, 0.02, 1), K.sel("liq", "Fluid in beaker", ["Water (1000)", "Kerosene (800)", "Brine (1200)"], 0)],
    draw(ctx, s, c) {
      const rf = [1000, 800, 1200][c.liq], V = c.V * 1e-6, W = c.rho * V * K.g, U = rf * V * c.d * K.g, R = W - U, hb = 70, top = 40;
      rect(ctx, 140, top, 40, 120, "#d8d8dc", "#555"); const ext = (R / 40) * 80; line(ctx, 160, top + 20, 160, top + 30 + ext, "#333", 1); rect(ctx, 150, top + 30 + ext, 20, 6, C.red); for (let n = 0; n <= 40; n += 10) { txt(ctx, 186, top + 33 + (n / 40) * 80, n + " N", "#333", 9); line(ctx, 170, top + 30 + (n / 40) * 80, 178, top + 30 + (n / 40) * 80, "#333", 1); }
      const by = top + 160 + c.d * 70, bh = 30 + c.V / 10; line(ctx, 160, top + 120, 160, by, C.chalk, 1.2); rect(ctx, 140, by, 40, bh, "#8a8f99", "#333");
      const wl = 270; rect(ctx, 90, 220, 140, 150, null, "rgba(220,235,255,.8)", 2); rect(ctx, 92, wl - (c.V * c.d) / 40, 136, 370 - wl + (c.V * c.d) / 40, ["#4aa8ff55", "#d8b45055", "#7ab8d855"][c.liq]);
      K.poly(ctx, [[230, 250], [262, 250], [262, 256], [230, 256]], "rgba(220,235,255,.6)"); rect(ctx, 260, 310, 70, 60, "rgba(74,168,255,.2)", "rgba(220,235,255,.8)", 1.5); rect(ctx, 262, 370 - (U / K.g) * 1000 * 0.25, 66, (U / K.g) * 1000 * 0.25, "#4aa8ffaa"); txt(ctx, 295, 385, "displaced " + f(U / K.g * 1000, 0) + " g", C.dim, 9.5, "center");
      arr(ctx, 120, by + bh / 2, 120, by + bh / 2 - U * 4, C.teal); arr(ctx, 200, by + bh / 2, 200, by + bh / 2 + W * 2, C.red);
      panel(ctx, 380, 30, 248, 340, "Weighing in air and in fluid"); notes(ctx, 390, 70, 230, [["Weight in air W = " + f(W, 2) + " N", C.red], ["Upthrust U = " + f(U, 2) + " N", C.teal], ["Balance reads W − U = " + f(R, 2) + " N", C.amber], "Weight of fluid displaced = " + f(U, 2) + " N — equal to the upthrust (Archimedes).", c.d > 0.99 ? "R.D. of solid = W ÷ U(water) = " + f(W / (1000 * V * K.g), 2) + " (true " + f(c.rho / 1000, 2) + ")" : "Lower the solid fully to find relative density.", "R.D. of a liquid = loss of weight in liquid ÷ loss of weight in water."]);
    },
    readouts(s, c) { const rf = [1000, 800, 1200][c.liq], V = c.V * 1e-6, W = c.rho * V * K.g, U = rf * V * c.d * K.g; return [["Weight in air", f(W, 2) + " N"], ["Apparent weight", f(W - U, 2) + " N"], ["Upthrust", f(U, 2) + " N"]]; },
  });

  /* ---------- T6 U-tube manometer ---------- */
  K.add("6", {
    modeName: "U-tube Manometer", tag: "GAS PRESSURE", eqn: "P(gas) = P(atm) + ρ·g·Δh",
    controls: [K.rng("dp", "Gas pressure above atmospheric", -3, 12, 0.1, 4, " kPa"), K.sel("liq", "Manometer liquid", ["Water (1000 kg/m³)", "Mercury (13 600 kg/m³)", "Paraffin oil (800 kg/m³)"], 0)],
    draw(ctx, s, c) {
      const rho = [1000, 13600, 800][c.liq], dh = (c.dp * 1000) / (rho * K.g), px = 200 / 1.2, half = clamp(dh / 2, -1.1, 1.1) * px, L = 140, R = 260, mid = 240, col = ["#4aa8ff", "#c8ccd4", "#e8d070"][c.liq];
      ctx.save(); ctx.strokeStyle = "rgba(220,235,255,.85)"; ctx.lineWidth = 2; [L - 14, L + 14, R - 14, R + 14].forEach((x) => line(ctx, x, 50, x, 330, "rgba(220,235,255,.85)", 2)); ctx.beginPath(); ctx.arc((L + R) / 2, 330, (R - L) / 2 + 14, 0, Math.PI); ctx.stroke(); ctx.beginPath(); ctx.arc((L + R) / 2, 330, (R - L) / 2 - 14, 0, Math.PI); ctx.stroke(); ctx.restore();
      rect(ctx, L - 12, mid + half, 24, 330 - mid - half, col + "cc"); rect(ctx, R - 12, mid - half, 24, 330 - mid + half, col + "cc"); ctx.save(); ctx.beginPath(); ctx.arc((L + R) / 2, 330, (R - L) / 2, 0, Math.PI); ctx.strokeStyle = col + "cc"; ctx.lineWidth = 24; ctx.stroke(); ctx.restore();
      circ(ctx, 70, 80, 36, "rgba(255,143,199,.25)", C.pink, 2); txt(ctx, 70, 84, "GAS", C.pink, 12, "center", true); line(ctx, 106, 80, L - 14, 80, C.pink, 3); line(ctx, L - 14, 80, L - 14, 60, C.pink, 3); txt(ctx, R, 40, "open to air", C.dim, 10, "center");
      line(ctx, L + 20, mid + half, R + 40, mid + half, C.amber, 1, [4, 3]); line(ctx, R + 14, mid - half, R + 40, mid - half, C.amber, 1, [4, 3]); arr(ctx, R + 34, mid + half, R + 34, mid - half, C.amber, 1.6); txt(ctx, R + 44, mid + 4, "Δh = " + f(dh * 100, 1) + " cm", C.amber, 12, "left", true);
      panel(ctx, 400, 30, 228, 340, "Reading the manometer"); notes(ctx, 410, 70, 210, [["Δh = ΔP ÷ (ρg) = " + f(c.dp * 1000, 0) + " ÷ (" + rho + " × 9.8) = " + f(dh * 100, 2) + " cm", C.amber], ["P(gas) = 101.3 + " + f(c.dp, 1) + " = " + f(101.3 + c.dp, 1) + " kPa", C.teal], c.dp >= 0 ? "Gas pushes the liquid down on its side: gas pressure is above atmospheric." : "Liquid is higher on the gas side: gas pressure is below atmospheric (partial vacuum).", "A dense liquid (mercury) gives a small Δh for large pressures; water or oil give a sensitive reading for small pressures."]);
    },
    readouts(s, c) { const rho = [1000, 13600, 800][c.liq], dh = (c.dp * 1000) / (rho * K.g); return [["Height difference", f(dh * 100, 2) + " cm"], ["Gas pressure", f(101.3 + c.dp, 1) + " kPa"], ["Liquid density", rho + " kg/m³"]]; },
  });

  /* ---------- T6 Siphon ---------- */
  K.add("6", {
    modeName: "Siphon", tag: "ATMOSPHERIC PRESSURE AT WORK", eqn: "Flows while outlet is below the upper surface: v ≈ √(2gΔh) · crest must be < P(atm)/(ρg) ≈ 10 m (water)",
    controls: [K.rng("h0", "Initial level difference Δh", 0.1, 1.5, 0.05, 0.8, " m", 2), K.rng("crest", "Crest height above upper surface", 0.1, 12, 0.1, 0.5, " m"), K.rng("d", "Tube bore", 4, 20, 1, 10, " mm")],
    reset(s, c) { s.hA = 1.2; s.hB = 1.2 - c.h0; s.p = []; for (let i = 0; i < 40; i++) s.p.push(i / 40); s.vol = 0; },
    step(s, c, dt) { if (s.hA === undefined) this.reset(s, c); const dh = s.hA - s.hB, ok = c.crest * 1000 * K.g < 101300 - 2300; s.v = dh > 0 && ok ? Math.sqrt(2 * K.g * dh) * 0.85 : 0; const A = Math.PI * Math.pow(c.d / 2000, 2), Q = A * s.v, At = 0.05; s.hA -= (Q / At) * dt; s.hB += (Q / At) * dt; s.vol += Q * dt * 1000; s.p = s.p.map((u) => (u + s.v * dt * 0.25) % 1); },
    draw(ctx, s, c) {
      if (s.hA === undefined) return; const sc = 120, gy = 360, Ax = 110, Bx = 330, yA = gy - 140 - s.hA * sc * 0.6, yB = gy - s.hB * sc * 0.6, cy = Math.max(30, yA - Math.min(c.crest, 1.6) * sc * 0.6);
      rect(ctx, Ax - 60, gy - 220, 120, 120, null, "rgba(220,235,255,.8)", 2); rect(ctx, Ax - 58, yA, 116, gy - 100 - yA, "#4aa8ff88"); rect(ctx, 40, gy - 100, 140, 100, "#3a3328"); rect(ctx, Bx - 60, gy - 120, 120, 120, null, "rgba(220,235,255,.8)", 2); rect(ctx, Bx - 58, yB, 116, gy - yB, "#4aa8ff88");
      const P = [[Ax + 20, gy - 110], [Ax + 20, cy], [Bx - 30, cy], [Bx - 30, gy - 30]]; K.poly(ctx, P, "rgba(220,235,255,.9)", null, 7, false); if (s.v > 0) K.poly(ctx, P, "#4aa8ff", null, 4, false);
      if (s.v > 0) s.p.forEach((u) => { const segs = [P[1][1] - P[0][1], P[2][0] - P[1][0], P[3][1] - P[2][1]].map(Math.abs), Lt = segs.reduce((a, b) => a + b), d = u * Lt; let x, y; if (d < segs[0]) { x = P[0][0]; y = P[0][1] - d; } else if (d < segs[0] + segs[1]) { x = P[1][0] + (d - segs[0]); y = cy; } else { x = P[2][0]; y = cy + (d - segs[0] - segs[1]); } circ(ctx, x, y, 2, "#fff"); });
      const ok = c.crest * 1000 * K.g < 99000; txt(ctx, (Ax + Bx) / 2, cy - 8, "crest " + f(c.crest, 1) + " m above surface", ok ? C.dim : C.red, 10, "center");
      panel(ctx, 420, 30, 208, 340, "Siphon"); notes(ctx, 430, 70, 190, [["Δh now = " + f(s.hA - s.hB, 2) + " m", C.amber], ["Flow speed ≈ " + f(s.v, 2) + " m/s", C.teal], "Volume moved: " + f(s.vol, 2) + " L", !ok ? ["Crest too high: atmospheric pressure (≈10.3 m of water) cannot push the water up — the column breaks and flow stops.", C.red] : s.v === 0 ? "Levels equal — no pressure difference, flow stops." : "Atmospheric pressure on the upper surface pushes water up; the longer column on the outlet side keeps it flowing.", "Uses: emptying tanks and fish ponds, petrol transfer, flushing toilets."]);
    },
    readouts(s, c) { return [["Level difference", f((s.hA || 0) - (s.hB || 0), 2) + " m"], ["Flow speed", f(s.v || 0, 2) + " m/s"], ["Max crest (water)", "≈ 10.3 m"]]; },
  });

  /* ---------- T6 Law of flotation: hydrometer, boat, submarine ---------- */
  K.add("6", {
    modeName: "Flotation — Hydrometer, Boat & Submarine", tag: "LAW OF FLOTATION", eqn: "A floating body displaces its own weight of fluid:  m·g = ρ(fluid)·V(submerged)·g",
    controls: [K.sel("o", "Object", ["Hydrometer", "Loaded boat", "Submarine (ballast tanks)"], 0), K.rng("rho", "Liquid density", 700, 1400, 10, 1000, " kg/m³"), K.rng("load", "Boat load / ballast water", 0, 1, 0.02, 0.4)],
    reset(s) { s.y = 0; s.v = 0; },
    step(s, c, dt) { if (c.o !== 2) return; const Vh = 1.0, mHull = 900, mB = c.load * 250, m = mHull + mB, rhoW = c.rho, Fb = rhoW * Vh * K.g * clamp(1 + s.y / 0.6, 0, 1); const net = (m * K.g - Fb) / m - 2.5 * s.v; s.v += net * dt; s.y = clamp(s.y + s.v * dt * 0.3, -0.6, 3); if (s.y >= 3 || s.y <= -0.6) s.v = 0; },
    draw(ctx, s, c) {
      const wy = 160; rect(ctx, 20, wy, 380, 220, c.rho > 1100 ? "#3a7aa8aa" : c.rho < 900 ? "#c8b06aaa" : "#2a6ab8aa"); line(ctx, 20, wy, 400, wy, "#cfe6ff", 1.5);
      if (c.o === 0) { const m = 0.02, Vb = 1.35e-5, A = 7e-5, x = clamp((m / c.rho - Vb) / A, 0, 0.22), sc = 700, bulbTop = wy + x * sc; K.circ(ctx, 210, bulbTop + 24, 22, "rgba(220,235,255,.25)", "#e8f0ff", 2); circ(ctx, 210, bulbTop + 38, 8, "#555"); rect(ctx, 204, bulbTop - 0.24 * sc, 12, 0.24 * sc + 4, "rgba(220,235,255,.25)", "#e8f0ff", 1.5);
        for (let r = 700; r <= 1400; r += 50) { const xx = (m / r - Vb) / A; if (xx < 0 || xx > 0.22) continue; const yy = bulbTop - xx * sc; line(ctx, 216, yy, 224, yy, "#fff", 1); if (r % 100 === 0) txt(ctx, 228, yy + 3, (r / 1000).toFixed(1), "#fff", 9); }
        txt(ctx, 240, wy - 10, "reads " + f(c.rho / 1000, 2), C.amber, 12, "left", true); }
      else if (c.o === 1) { const mB = 400 + c.load * 1200, A = 3.0, draft = mB / (c.rho * A), dp = draft * 200; K.poly(ctx, [[110, wy - 60 + dp], [310, wy - 60 + dp], [290, wy + dp], [130, wy + dp]], "#333", "#a05030", 2); for (let i = 0; i < Math.round(c.load * 8); i++) rect(ctx, 140 + (i % 4) * 36, wy - 84 + dp - Math.floor(i / 4) * 22, 32, 22, "#c8a060", "#5a3a1a"); line(ctx, 300, wy - 30, 320, wy - 30, C.red, 2); txt(ctx, 324, wy - 26, "Plimsoll line", C.red, 9.5); txt(ctx, 210, wy + dp + 20, "draft " + f(draft * 100, 1) + " cm", C.amber, 11, "center"); }
      else { const y = wy + 20 + s.y * 50; ctx.save(); ctx.beginPath(); ctx.ellipse(210, y, 110, 26, 0, 0, K.TAU); ctx.fillStyle = "#4a5260"; ctx.fill(); ctx.restore(); rect(ctx, 190, y - 46, 30, 22, "#4a5260"); rect(ctx, 130, y + 4, 160 * c.load, 14, "#4aa8ffcc"); rect(ctx, 130, y + 4, 160, 14, null, "#9aa0a8"); txt(ctx, 210, y + 44, "ballast tank " + Math.round(c.load * 100) + " % full", C.dim, 10, "center"); }
      panel(ctx, 412, 30, 216, 340, ["Hydrometer", "Boat", "Submarine"][c.o]);
      notes(ctx, 422, 70, 198, c.o === 0 ? ["Floats lower in less dense liquids, higher in denser ones — the scale reads density directly (increasing downwards).", "Narrow stem → large movement for small density change (sensitive).", "Uses: testing milk, battery acid, beer, petrol."] : c.o === 1 ? ["More load → floats deeper until the weight of water displaced equals boat + load.", "Steel boats float because their hollow shape displaces a large volume.", "Ships float higher in dense sea water than in fresh water (Plimsoll marks)."] : ["Filling ballast tanks with water raises average density → sinks; blowing them with compressed air → rises.", "Neutral buoyancy when average density = water density.", "Balloons rise when their average density is less than air."]);
    },
    readouts(s, c) { if (c.o === 1) { const mB = 400 + c.load * 1200; return [["Total mass", f(mB, 0) + " kg"], ["Water displaced", f(mB / c.rho, 3) + " m³"], ["Draft", f((mB / (c.rho * 3)) * 100, 1) + " cm"]]; } if (c.o === 2) { const m = 900 + c.load * 250; return [["Average density", f(m / 1.0, 0) + " kg/m³"], ["Water density", c.rho + " kg/m³"], ["Motion", m > c.rho ? "sinking" : m < c.rho - 5 ? "rising" : "neutral"]]; } return [["Liquid density", c.rho + " kg/m³"], ["Hydrometer reads", f(c.rho / 1000, 2)], ["Principle", "law of flotation"]]; },
  });
});
