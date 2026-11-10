/* p2d-waves.js — Topics 17–22: slinky & rope pulses, progressive wave equation, ripple tank reflection & refraction,
   two-source interference, eclipses, inclined mirrors & kaleidoscope, real & apparent depth, minimum deviation,
   microscope & telescope, defects of vision, colours of objects, sound needs a medium, speed of sound in media,
   pitch/loudness/quality (noise vs music), resonance tube with end correction. */
window.PX.push(function () {
  const K = window.PK, C = K.C, { txt, line, rect, circ, arr, panel, notes, axes, plot, f, clamp, rad, deg } = K;
  const gl = (ctx, pts, col, w = 2.2) => (typeof glowLine === "function" ? glowLine(ctx, pts, col, w, 6) : K.poly(ctx, pts, col, null, w, false));

  /* ---------- T17 Slinky and rope ---------- */
  K.add("17", {
    modeName: "Mechanical Waves — Slinky & Rope", tag: "ENERGY TRANSFER, NOT MATTER", eqn: "A wave carries energy from a vibrating source; the particles of the medium only vibrate about fixed positions",
    controls: [K.sel("m", "Medium", ["Rope — transverse pulse", "Slinky — longitudinal pulse", "Slinky — continuous waves"], 0), K.rng("f", "Hand frequency", 0.5, 4, 0.1, 1.5, " Hz"), K.rng("v", "Wave speed", 80, 300, 10, 160, " px/s")],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; if (c.m < 2 && s.t > 640 / c.v + 1) s.t = 0; },
    draw(ctx, s, c) {
      const y = 200, N = 60, src = (t) => (c.m === 2 ? Math.sin(K.TAU * c.f * t) : t > 0 && t < 1 / c.f / 2 ? Math.sin(K.TAU * c.f * t) : 0);
      const pts = []; for (let i = 0; i <= N; i++) { const x0 = 40 + (i * 560) / N, d = src(s.t - (x0 - 40) / c.v); pts.push([x0, d]); }
      if (c.m === 0) { gl(ctx, pts.map(([x, d]) => [x, y - d * 60]), C.teal, 3); const mk = pts[30]; circ(ctx, mk[0], y - mk[1] * 60, 6, C.red); txt(ctx, mk[0], y + 90, "red marker only moves up and down", C.red, 10.5, "center"); }
      else { for (let i = 0; i <= N; i++) { const [x0, d] = pts[i], x = x0 + d * 14; line(ctx, x, y - 40, x, y + 40, i === 30 ? C.red : C.teal, i === 30 ? 2.5 : 1.6); } txt(ctx, 320, y + 70, "compressions and rarefactions travel; the red coil only moves back and forth", C.red, 10.5, "center"); }
      rect(ctx, 14, y - 50 + src(s.t) * (c.m === 0 ? -60 : 0), 26, 100, "#c88a60"); arr(ctx, 60, 330, 580, 330, C.amber); txt(ctx, 320, 350, "direction of energy transfer", C.amber, 11, "center");
      notes(ctx, 40, 40, 560, ["Rope/slinky shaken by hand (the pulsating source). In a ripple tank a vibrating dipper sends ripples across the water.", "Frequency = vibrations per second (hertz, Hz). Each particle copies the motion of its neighbour, a little later."], 11);
    },
    readouts(s, c) { return [["Medium", ["rope", "slinky", "slinky"][c.m]], ["Wave type", c.m === 0 ? "transverse" : "longitudinal"], ["Wavelength", f(c.v / c.f, 0) + " px"]]; },
  });

  /* ---------- T18 Progressive wave equation ---------- */
  K.add("18", {
    modeName: "Wave Equation y = A sin(ωt − kx)", tag: "MATHEMATICAL REPRESENTATION", eqn: "y = A sin(2πft − 2πx/λ)    ω = 2πf   k = 2π/λ   v = fλ = ω/k",
    controls: [K.rng("A", "Amplitude A", 0.5, 3, 0.1, 2, " cm"), K.rng("f", "Frequency f", 0.2, 2, 0.05, 0.5, " Hz", 2), K.rng("lam", "Wavelength λ", 2, 10, 0.5, 6, " cm"), K.rng("x", "Watch point at x", 0, 12, 0.5, 3, " cm")],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; },
    draw(ctx, s, c) {
      const A = axes(ctx, 60, 40, 380, 150, { x0: 0, x1: 12, y0: -3.5, y1: 3.5, nx: 6, xl: "x (cm)", yl: "y (cm)", title: "Snapshot at t = " + f(s.t, 1) + " s" }); const y = (x, t) => c.A * Math.sin(K.TAU * c.f * t - (K.TAU * x) / c.lam); plot(ctx, A, (x) => y(x, s.t), 0, 12, C.teal); circ(ctx, A.X(c.x), A.Y(y(c.x, s.t)), 6, C.red);
      const B = axes(ctx, 60, 230, 380, 120, { x0: 0, x1: 8, y0: -3.5, y1: 3.5, nx: 8, xl: "time t (s)", yl: "y at watch point", title: "Displacement–time at x = " + c.x + " cm" }); plot(ctx, B, (t) => y(c.x, t), 0, 8, C.red); line(ctx, B.X(s.t % 8), B.y, B.X(s.t % 8), B.y + B.h, C.dim, 1, [3, 3]);
      panel(ctx, 460, 30, 168, 340, null); notes(ctx, 468, 52, 155, [["ω = 2πf = " + f(K.TAU * c.f, 3) + " rad/s", C.chalk], ["k = 2π/λ = " + f(K.TAU / c.lam, 3) + " rad/cm", C.chalk], ["v = fλ = " + f(c.f * c.lam, 2) + " cm/s", C.amber], ["T = 1/f = " + f(1 / c.f, 2) + " s", C.chalk], "y = " + c.A + " sin(" + f(K.TAU * c.f, 2) + "t − " + f(K.TAU / c.lam, 2) + "x)", "Minus sign: wave travels in +x direction. Plus sign: −x direction."], 10.5);
    },
    readouts(s, c) { return [["Wave speed", f(c.f * c.lam, 2) + " cm/s"], ["Period", f(1 / c.f, 2) + " s"], ["y at watch point", f(c.A * Math.sin(K.TAU * c.f * s.t - (K.TAU * c.x) / c.lam), 2) + " cm"]]; },
  });

  /* ---------- T19 Ripple tank: reflection and refraction ---------- */
  K.add("19", {
    modeName: "Ripple Tank — Reflection & Refraction", tag: "PLANE AND CIRCULAR WAVES", eqn: "Reflection: angle of incidence = angle of reflection · Refraction: waves slow in shallow water, λ shortens, direction bends (f unchanged)",
    controls: [K.sel("m", "Experiment", ["Plane waves on a plane barrier", "Circular waves on a plane barrier", "Refraction at a shallow region"], 0), K.rng("th", "Angle of incidence", 0, 60, 1, 35, "°"), K.rng("r", "Speed ratio (shallow ÷ deep)", 0.4, 1, 0.05, 0.6)],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; },
    draw(ctx, s, c) {
      const W = 600, H = 360, x0 = 20, y0 = 20; rect(ctx, x0, y0, W, H, "#0e2a3a"); const lam = 34, ph = (s.t * 60) % lam, t = rad(c.th);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, W, H); ctx.clip();
      if (c.m === 0) { const bx = 420; line(ctx, bx, y0, bx, y0 + H, "#c8ccd4", 6); for (let k = -20; k < 20; k++) { const d = k * lam + ph; const nx = Math.cos(t), ny = Math.sin(t); const px = 220 + nx * d, py = 200 + ny * d; const p1 = [px - ny * 400, py + nx * 400], p2 = [px + ny * 400, py - nx * 400]; ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, bx - x0, H); ctx.clip(); line(ctx, p1[0], p1[1], p2[0], p2[1], "rgba(180,230,255,.7)", 2); const rx = 2 * bx - px; line(ctx, 2 * bx - p1[0], p1[1], 2 * bx - p2[0], p2[1], "rgba(255,183,3,.55)", 2); ctx.restore(); } arr(ctx, 260, 200, 260 + Math.cos(t) * 120, 200 + Math.sin(t) * 120, C.teal); txt(ctx, 300, 370, "incident (blue) and reflected (amber) wavefronts", C.dim, 10.5); }
      else if (c.m === 1) { const bx = 450, sx = 260, sy = 200; line(ctx, bx, y0, bx, y0 + H, "#c8ccd4", 6); ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, bx - x0, H); ctx.clip(); for (let k = 1; k < 16; k++) { const R = k * lam - lam + ph; circ(ctx, sx, sy, R, null, "rgba(180,230,255,.7)", 2); circ(ctx, 2 * bx - sx, sy, R, null, "rgba(255,183,3,.55)", 2); } ctx.restore(); circ(ctx, sx, sy, 5, C.red); circ(ctx, 2 * bx - sx, sy, 4, null, C.amber, 1.5); txt(ctx, 2 * bx - sx, sy + 20, "image source", C.amber, 10, "center"); txt(ctx, 40, 370, "reflected waves appear to come from an image behind the barrier", C.dim, 10.5); }
      else { const bx = 320, sR = Math.asin(clamp(Math.sin(t) * c.r, -1, 1)), k1 = K.TAU / lam, k2 = k1 / c.r, wt = s.t * 6, st = 5;
        for (let x = x0; x < x0 + W; x += st) for (let y = y0; y < y0 + H; y += st) { const ph = x < bx ? k1 * (x * Math.cos(t) + y * Math.sin(t)) : k1 * (bx * Math.cos(t) + y * Math.sin(t)) + k2 * ((x - bx) * Math.cos(sR)) + (k2 * Math.sin(sR) - k1 * Math.sin(t)) * y; const v = Math.cos(ph - wt), b = Math.round(70 + 60 * v); ctx.fillStyle = x < bx ? `rgb(${b * 0.35},${b * 0.85},${Math.min(255, b * 1.25)})` : `rgb(${b * 0.45},${b * 0.95},${Math.min(255, b * 1.15)})`; ctx.fillRect(x, y, st, st); }
        txt(ctx, bx + 10, y0 + 18, "shallow water (glass plate)", "#fff", 10); txt(ctx, 30, y0 + 18, "deep water", "#fff", 10);
        line(ctx, bx, y0, bx, y0 + H, "rgba(255,255,255,.5)", 1, [4, 4]); arr(ctx, 160, 200, 160 + Math.cos(t) * 100, 200 + Math.sin(t) * 100, C.amber); arr(ctx, bx + 30, 200, bx + 30 + Math.cos(sR) * 100, 200 + Math.sin(sR) * 100, C.amber); txt(ctx, 40, 370, "refracted angle " + f(deg(sR), 1) + "° · wavelength shortened ×" + c.r + " · frequency unchanged", "#fff", 10.5); }
      ctx.restore();
    },
    readouts(s, c) { const sR = Math.asin(clamp(Math.sin(rad(c.th)) * c.r, -1, 1)); return c.m === 2 ? [["Angle in deep water", c.th + "°"], ["Angle in shallow water", f(deg(sR), 1) + "°"], ["λ shallow ÷ λ deep", c.r]] : [["Angle of incidence", c.th + "°"], ["Angle of reflection", c.th + "°"], ["Law", "i = r"]]; },
  });

  /* ---------- T19 Two-source interference ---------- */
  K.add("19", {
    modeName: "Interference from Two Sources", tag: "CONSTRUCTIVE · DESTRUCTIVE", eqn: "Path difference = nλ → constructive (bright/loud) · (n + ½)λ → destructive · fringe spacing ≈ λD/d",
    controls: [K.rng("lam", "Wavelength λ", 10, 40, 1, 22, " px"), K.rng("d", "Source separation d", 30, 160, 2, 90, " px"), K.sel("view", "Display", ["Ripple tank (instant)", "Intensity (time-averaged)"], 0)],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; },
    draw(ctx, s, c) {
      const W = 420, H = 360, x0 = 20, y0 = 20, s1 = [x0 + 30, y0 + H / 2 - c.d / 2], s2 = [x0 + 30, y0 + H / 2 + c.d / 2], step = 6, k = K.TAU / c.lam, w = 3;
      for (let x = x0; x < x0 + W; x += step) for (let y = y0; y < y0 + H; y += step) { const r1 = Math.hypot(x - s1[0], y - s1[1]), r2 = Math.hypot(x - s2[0], y - s2[1]); let v; if (c.view === 0) v = (Math.sin(k * r1 - w * s.t) + Math.sin(k * r2 - w * s.t)) / 2; else v = Math.abs(Math.cos((k * (r1 - r2)) / 2)) * 2 - 1; const b = Math.round(60 + 70 * v); ctx.fillStyle = `rgb(${b * 0.4},${b * 0.9},${b * 1.3 > 255 ? 255 : b * 1.3})`; ctx.fillRect(x, y, step, step); }
      circ(ctx, s1[0], s1[1], 5, C.red); circ(ctx, s2[0], s2[1], 5, C.red); const D = W - 40, sp = (c.lam * D) / c.d;
      panel(ctx, 450, 20, 178, 360, "Interference"); notes(ctx, 458, 56, 165, ["Bright bands: crests meet crests (path difference 0, λ, 2λ…).", "Dark bands: crest meets trough (λ/2, 3λ/2…) — the waves cancel.", ["Fringe spacing ≈ λD/d = " + f(sp, 0) + " px", C.amber], "Closer sources or longer λ → wider spacing.", "Sources must be coherent (same frequency, constant phase difference): one dipper with two prongs.", "Same idea: Young's double slit with light; two loudspeakers with sound."], 10.5);
    },
    readouts(s, c) { return [["Wavelength", c.lam + " px"], ["Separation", c.d + " px"], ["Fringe spacing", f((c.lam * 380) / c.d, 0) + " px"]]; },
  });

  /* ---------- T20 Eclipses (umbra and penumbra) ---------- */
  K.add("20", {
    modeName: "Eclipses — Umbra & Penumbra", tag: "RECTILINEAR PROPAGATION", eqn: "An extended luminous source gives a dark umbra (total shadow) and a lighter penumbra (partial shadow)",
    controls: [K.sel("m", "Eclipse", ["Solar eclipse (Moon between Sun and Earth)", "Lunar eclipse (Earth between Sun and Moon)"], 0), K.rng("a", "Moon's orbital position", -30, 30, 1, 0, "°")],
    draw(ctx, s, c) {
      rect(ctx, 0, 0, 640, 400, "#03060c"); const S = [70, 200], Rs = 55, E = [500, 200], Re = 34, mr = c.m === 0 ? 150 : 90, ang = rad(c.a + (c.m === 0 ? 180 : 0)), M = [E[0] + mr * Math.cos(ang), E[1] + mr * Math.sin(ang)], Rm = 12;
      circ(ctx, S[0], S[1], Rs, "#ffd84a"); circ(ctx, S[0], S[1], Rs + 10, null, "rgba(255,216,74,.3)", 8); txt(ctx, S[0], S[1] + Rs + 18, "Sun (luminous)", "#ffd84a", 10.5, "center");
      const occ = c.m === 0 ? [M, Rm] : [E, Re], tgt = c.m === 0 ? [E, Re] : [M, Rm]; const [O, Ro] = occ; const d = O[0] - S[0];
      const um = (sg) => { const k = (Rs - Ro) / d; return [[S[0], S[1] + sg * Rs], [O[0], O[1] + sg * Ro], [640, O[1] + sg * (Ro - k * (640 - O[0]))]]; }; const pe = (sg) => { const k = (Rs + Ro) / d; return [[S[0], S[1] - sg * Rs], [O[0], O[1] + sg * Ro], [640, O[1] + sg * (Ro + k * (640 - O[0]))]]; };
      const u1 = um(-1), u2 = um(1), p1 = pe(-1), p2 = pe(1); K.poly(ctx, [p1[1], p1[2], p2[2], p2[1]], null, "rgba(80,80,110,.35)"); K.poly(ctx, [u1[1], u1[2], u2[2], u2[1]], null, "rgba(0,0,0,.75)"); [u1, u2].forEach((L) => line(ctx, L[0][0], L[0][1], L[2][0], L[2][1], "rgba(255,216,74,.25)", 1)); [p1, p2].forEach((L) => line(ctx, L[0][0], L[0][1], L[2][0], L[2][1], "rgba(255,216,74,.15)", 1, [4, 4]));
      circ(ctx, E[0], E[1], Re, "#2a6ab8", "#7cb3ff"); circ(ctx, M[0], M[1], Rm, "#c8ccd4");
      const [T, Rt] = tgt, yU = (x) => [u1[1][1] + ((u1[2][1] - u1[1][1]) * (x - u1[1][0])) / (u1[2][0] - u1[1][0]), u2[1][1] + ((u2[2][1] - u2[1][1]) * (x - u2[1][0])) / (u2[2][0] - u2[1][0])], yP = (x) => [p1[1][1] + ((p1[2][1] - p1[1][1]) * (x - p1[1][0])) / (p1[2][0] - p1[1][0]), p2[1][1] + ((p2[2][1] - p2[1][1]) * (x - p2[1][0])) / (p2[2][0] - p2[1][0])];
      const [ua, ub] = yU(T[0] - (c.m === 0 ? Rt : 0)), [pa, pb] = yP(T[0]); const inU = T[1] > Math.min(ua, ub) - Rt && T[1] < Math.max(ua, ub) + Rt, inP = T[1] > Math.min(pa, pb) - Rt && T[1] < Math.max(pa, pb) + Rt;
      const res = c.m === 0 ? (inU && Math.abs(ub - ua) > 0 && T[0] > M[0] ? "Total eclipse for places in the umbra; partial in the penumbra" : inP && T[0] > M[0] ? "Partial solar eclipse" : "No eclipse — Moon out of line") : inU && T[0] > E[0] ? "Total lunar eclipse — Moon in Earth's umbra (looks red)" : inP && T[0] > E[0] ? "Partial / penumbral lunar eclipse" : "No eclipse — Moon out of line";
      txt(ctx, 320, 30, res, C.amber, 12, "center", true); txt(ctx, 320, 380, "Moon and Earth are non-luminous: they are seen by reflected sunlight. Not to scale.", C.dim, 10, "center");
    },
    readouts(s, c) { return [["Eclipse type", c.m === 0 ? "solar" : "lunar"], ["Moon position", c.a + "°"], ["Shadow regions", "umbra + penumbra"]]; },
  });

  /* ---------- T20 Inclined mirrors and kaleidoscope ---------- */
  K.add("20", {
    modeName: "Inclined Plane Mirrors & Kaleidoscope", tag: "n = 360°/θ − 1", eqn: "Number of images between two plane mirrors at angle θ: n = (360°/θ) − 1 · plane-mirror images are virtual, upright, laterally inverted, as far behind as the object is in front",
    controls: [K.rng("th", "Angle between mirrors", 30, 120, 1, 60, "°"), K.rng("a", "Object position (angle)", 5, 55, 1, 20, "°")],
    draw(ctx, s, c) {
      const O = [230, 220], R = 220, th = rad(c.th); line(ctx, O[0], O[1], O[0] + R, O[1], "#c8ccd4", 5); line(ctx, O[0], O[1], O[0] + R * Math.cos(-th), O[1] + R * Math.sin(-th), "#c8ccd4", 5);
      const ob = Math.min(rad(c.a), th * 0.9), r0 = 110; const imgs = []; const n = Math.round(360 / c.th) - 1; const refl = (a, m) => 2 * m - a; let A = [ob], B = [ob]; const seen = []; for (let k = 0; k < 12; k++) { A = A.map((a, i) => (k % 2 === 0 ? refl(a, 0) : refl(a, -th))); B = B.map((a) => (k % 2 === 0 ? refl(a, -th) : refl(a, 0))); [A[0], B[0]].forEach((a) => { const aa = ((a % K.TAU) + K.TAU) % K.TAU; if (!seen.some((q) => Math.abs(q - aa) < 0.02) && Math.abs(aa - ((ob + K.TAU) % K.TAU)) > 0.02) seen.push(aa); }); }
      seen.slice(0, Math.max(0, n)).forEach((a) => { const x = O[0] + r0 * Math.cos(-a), y = O[1] + r0 * Math.sin(-a); circ(ctx, x, y, 9, "rgba(255,183,3,.45)", C.amber, 1.5); });
      const ox = O[0] + r0 * Math.cos(-ob), oy = O[1] + r0 * Math.sin(-ob); if (typeof dot === "function") dot(ctx, ox, oy, 9, C.red, 10); txt(ctx, ox + 12, oy, "object", C.red, 10);
      panel(ctx, 450, 30, 178, 340, null); notes(ctx, 458, 52, 165, [["θ = " + c.th + "° → n = 360/" + c.th + " − 1 = " + f(360 / c.th - 1, 1), C.amber], "Images (amber) lie on a circle centred on the mirrors' junction.", "Parallel mirrors (θ = 0) → infinitely many images.", "Kaleidoscope: three mirrors at 60° inside a tube repeat coloured beads into symmetric patterns.", "Uses of plane mirrors: periscope, sextant, dressing mirror, optical lever."], 10.5);
    },
    readouts(s, c) { return [["Angle", c.th + "°"], ["Images (formula)", f(360 / c.th - 1, 1)], ["Image type", "virtual, upright"]]; },
  });

  /* ---------- T20 Real and apparent depth ---------- */
  K.add("20", {
    modeName: "Real & Apparent Depth", tag: "n = real ÷ apparent depth", eqn: "Refractive index n = real depth ÷ apparent depth   (viewed from directly above)",
    controls: [K.rng("D", "Real depth of coin", 10, 60, 1, 40, " cm"), K.sel("liq", "Liquid", ["Water (n = 1.33)", "Paraffin (n = 1.44)", "Glass block (n = 1.50)"], 0), K.rng("v", "Viewing angle from vertical", 0, 40, 1, 10, "°")],
    draw(ctx, s, c) {
      const n = [1.33, 1.44, 1.5][c.liq], sc = 4.5, sy = 90, by = sy + c.D * sc, cx = 220; rect(ctx, 60, sy, 340, c.D * sc + 20, ["#2a6ab8aa", "#c8b06aaa", "#9fd8e8aa"][c.liq]); line(ctx, 60, sy, 400, sy, "#cfe6ff", 1.5);
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx, by, 18, 5, 0, 0, K.TAU); ctx.fillStyle = "#d8b450"; ctx.fill(); ctx.restore(); const app = c.D / n, ay = sy + app * sc; ctx.save(); ctx.beginPath(); ctx.ellipse(cx, ay, 18, 5, 0, 0, K.TAU); ctx.strokeStyle = C.amber; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.restore();
      [-1, 1].forEach((sg) => { const r = rad(c.v + sg * 3), i = Math.asin(Math.sin(r) / n), xs = cx + c.D * sc * Math.tan(i); line(ctx, cx, by, xs, sy, C.teal, 1.6); line(ctx, xs, sy, xs + 140 * Math.sin(r), sy - 140 * Math.cos(r), C.teal, 1.6); line(ctx, xs, sy, cx + (xs - cx) * 0, ay, "rgba(255,183,3,.5)", 1, [3, 3]); });
      txt(ctx, 66, by + 4, "real " + c.D + " cm", C.chalk, 10.5); txt(ctx, 66, ay + 4, "apparent " + f(app, 1) + " cm", C.amber, 10.5); circ(ctx, cx + 120 * Math.sin(rad(c.v)) + 40, sy - 130, 10, null, C.chalk, 1.5); txt(ctx, cx + 120 * Math.sin(rad(c.v)) + 56, sy - 128, "eye", C.dim, 10);
      panel(ctx, 420, 30, 208, 340, "Results"); notes(ctx, 430, 70, 190, [["Apparent depth = " + c.D + " ÷ " + n + " = " + f(app, 1) + " cm", C.amber], ["Displacement of image = " + f(c.D - app, 1) + " cm", C.teal], "Light bends away from the normal as it leaves the denser medium, so the coin seems raised.", "Pools look shallower than they really are — dangerous for swimmers.", "Lab method: locate the image of a pin with a search pin (no parallax), then n = real/apparent."], 10.5);
    },
    readouts(s, c) { const n = [1.33, 1.44, 1.5][c.liq]; return [["Refractive index", n], ["Apparent depth", f(c.D / n, 1) + " cm"], ["Image raised by", f(c.D - c.D / n, 1) + " cm"]]; },
  });

  /* ---------- T20 Prism: deviation and minimum deviation ---------- */
  K.add("20", {
    modeName: "Prism — Angle of Minimum Deviation", tag: "n = sin((A + D)/2) ÷ sin(A/2)", eqn: "Deviation D = i₁ + i₂ − A · at minimum deviation the ray passes symmetrically: n = sin((A + D_min)/2) / sin(A/2)",
    controls: [K.rng("i", "Angle of incidence i₁", 25, 80, 0.5, 48, "°"), K.rng("A", "Prism angle A", 40, 70, 1, 60, "°"), K.rng("n", "Refractive index n", 1.4, 1.7, 0.01, 1.5, "", 2)],
    dev(i, A, n) { const r1 = Math.asin(Math.sin(rad(i)) / n), r2 = rad(A) - r1; const s2 = n * Math.sin(r2); if (Math.abs(s2) > 1) return null; return { r1, r2, i2: deg(Math.asin(s2)), D: i + deg(Math.asin(s2)) - A }; },
    draw(ctx, s, c) {
      const R = this.dev(c.i, c.A, c.n), Dm = 2 * deg(Math.asin(c.n * Math.sin(rad(c.A / 2)))) - c.A; const A = axes(ctx, 400, 50, 220, 170, { x0: 25, x1: 80, y0: 20, y1: 70, nx: 5, xl: "i₁ (°)", yl: "D (°)", title: "Deviation curve" }); plot(ctx, A, (i) => { const q = this.dev(i, c.A, c.n); return q ? q.D : NaN; }, 25, 80, C.teal); if (R) circ(ctx, A.X(c.i), A.Y(R.D), 5, C.amber); line(ctx, A.x, A.Y(Dm), A.x + A.w, A.Y(Dm), C.red, 1, [4, 3]);
      const ap = [200, 70], hh = 230, half = rad(c.A / 2), L = [ap[0] - hh * Math.tan(half), ap[1] + hh], Rr = [ap[0] + hh * Math.tan(half), ap[1] + hh]; K.poly(ctx, [ap, L, Rr], "rgba(200,230,255,.8)", "rgba(160,210,255,.12)");
      { const nz = (v) => { const L0 = Math.hypot(v[0], v[1]); return [v[0] / L0, v[1] / L0]; }, dot2 = (a, b) => a[0] * b[0] + a[1] * b[1], refr = (d, nn, eta) => { const ci = -dot2(nn, d), k = 1 - eta * eta * (1 - ci * ci); if (k < 0) return null; const q = eta * ci - Math.sqrt(k); return nz([eta * d[0] + q * nn[0], eta * d[1] + q * nn[1]]); };
        const u1 = nz([L[0] - ap[0], L[1] - ap[1]]), o1 = [-u1[1], u1[0]], u2 = nz([Rr[0] - ap[0], Rr[1] - ap[1]]), o2 = [u2[1], -u2[0]], P = [ap[0] + u1[0] * hh * 0.55, ap[1] + u1[1] * hh * 0.55 / Math.cos(half) * Math.cos(half)];
        const inN = [-o1[0], -o1[1]], ii = rad(c.i), d1 = [inN[0] * Math.cos(ii) + inN[1] * Math.sin(ii), -inN[0] * Math.sin(ii) + inN[1] * Math.cos(ii)]; line(ctx, P[0] - d1[0] * 170, P[1] - d1[1] * 170, P[0], P[1], C.amber, 2.2); line(ctx, P[0] - o1[0] * 40, P[1] - o1[1] * 40, P[0] + o1[0] * 40, P[1] + o1[1] * 40, "rgba(255,255,255,.3)", 1, [3, 3]);
        const d2 = refr(d1, o1, 1 / c.n); if (d2) { const den = d2[0] * o2[0] + d2[1] * o2[1], tt = ((ap[0] - P[0]) * o2[0] + (ap[1] - P[1]) * o2[1]) / den, Q = [P[0] + d2[0] * tt, P[1] + d2[1] * tt]; line(ctx, P[0], P[1], Q[0], Q[1], C.amber, 2.2); const d3 = refr(d2, [-o2[0], -o2[1]], c.n); if (d3) { line(ctx, Q[0], Q[1], Q[0] + d3[0] * 170, Q[1] + d3[1] * 170, C.amber, 2.2); line(ctx, P[0], P[1], P[0] + d1[0] * 200, P[1] + d1[1] * 200, "rgba(255,183,3,.3)", 1, [4, 4]); } else { const rr = [d2[0] - 2 * dot2(d2, o2) * o2[0], d2[1] - 2 * dot2(d2, o2) * o2[1]]; line(ctx, Q[0], Q[1], Q[0] + rr[0] * 120, Q[1] + rr[1] * 120, C.red, 2); } } }
      notes(ctx, 400, 260, 225, R ? [["Deviation D = " + f(R.D, 2) + "°", C.amber], ["Minimum D = " + f(Dm, 2) + "° (dashed)", C.red], "Emergence angle i₂ = " + f(R.i2, 1) + "°", "At D_min, i₁ = i₂ and the ray inside is parallel to the base."] : [["Total internal reflection at the second face — no emergent ray.", C.red]], 10.5);
    },
    readouts(s, c) { const R = this.dev(c.i, c.A, c.n), Dm = 2 * deg(Math.asin(c.n * Math.sin(rad(c.A / 2)))) - c.A; return [["Deviation", R ? f(R.D, 2) + "°" : "TIR"], ["Minimum deviation", f(Dm, 2) + "°"], ["n from D_min", f(Math.sin(rad((c.A + Dm) / 2)) / Math.sin(rad(c.A / 2)), 3)]]; },
  });

  /* ---------- T20 Compound microscope and astronomical telescope ---------- */
  K.add("20", {
    modeName: "Compound Microscope & Telescope", tag: "MAGNIFYING POWER", eqn: "Microscope M ≈ (v_o/u_o) × (D/f_e + 1) · Astronomical telescope (normal adjustment) M = f_o / f_e, length = f_o + f_e",
    controls: [K.sel("m", "Instrument", ["Compound microscope", "Astronomical telescope"], 0), K.rng("fo", "Objective focal length", 1, 100, 0.5, 2, " cm"), K.rng("fe", "Eyepiece focal length", 1, 10, 0.5, 5, " cm"), K.rng("u", "Object distance (microscope)", 1.1, 5, 0.05, 2.5, " cm", 2)],
    draw(ctx, s, c) {
      const lens = (x, y, h, lab) => { ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, 6, h, 0, 0, K.TAU); ctx.fillStyle = "rgba(160,210,255,.3)"; ctx.fill(); ctx.strokeStyle = "#cfe6ff"; ctx.stroke(); ctx.restore(); txt(ctx, x, y + h + 14, lab, C.dim, 10, "center"); }; const ax = 200; line(ctx, 20, ax, 620, ax, "rgba(255,255,255,.2)", 1);
      if (c.m === 0) { const fo = Math.min(c.fo, 3), u = Math.max(c.u, fo * 1.05), v = (u * fo) / (u - fo), mo = v / u, D = 25, Me = D / c.fe + 1, M = mo * Me, sc = 22, xo = 120; const xL1 = xo + u * sc, xI = xL1 + v * sc, xL2 = xI + c.fe * 0.8 * sc; arr(ctx, xo, ax, xo, ax - 30, C.red, 2.5); lens(xL1, ax, 50, "objective"); arr(ctx, Math.min(xI, 600), ax, Math.min(xI, 600), ax + 30 * mo, C.amber, 2); lens(Math.min(xL2, 610), ax, 60, "eyepiece"); line(ctx, xo, ax - 30, xL1, ax - 30, C.teal, 1.2); line(ctx, xL1, ax - 30, Math.min(xI, 600), ax + 30 * mo, C.teal, 1.2); line(ctx, xo, ax - 30, Math.min(xI, 600), ax + 30 * mo, C.teal, 1.2);
        panel(ctx, 20, 290, 600, 90, null); notes(ctx, 30, 310, 580, [["Objective: image distance v = " + f(v, 2) + " cm, magnification " + f(mo, 2), C.chalk], ["Eyepiece (image at 25 cm): " + f(Me, 2) + "×", C.chalk], ["Total magnifying power ≈ " + f(M, 1) + "× — final image virtual, inverted, enlarged", C.amber]], 10.5); }
      else { const fo = Math.max(c.fo, 20), fe = c.fe, M = fo / fe, sc = 300 / (fo + fe), x1 = 80, x2 = x1 + (fo + fe) * sc, xf = x1 + fo * sc; lens(x1, ax, 70, "objective (long f)"); lens(x2, ax, 40, "eyepiece (short f)"); for (const dy of [-50, -20, 10]) { line(ctx, 20, ax + dy - 12, x1, ax + dy, C.teal, 1.2); line(ctx, x1, ax + dy, xf, ax + 28, C.teal, 1.2); line(ctx, xf, ax + 28, x2, ax + 28 + ((x2 - xf) * (ax + 28 - (ax + dy))) / (xf - x1), C.teal, 1.2); } circ(ctx, xf, ax, 3, C.amber); txt(ctx, xf, ax - 8, "common focus", C.amber, 9.5, "center");
        panel(ctx, 20, 290, 600, 90, null); notes(ctx, 30, 310, 580, [["M = f_o / f_e = " + fo + " ÷ " + fe + " = " + f(M, 1) + "×", C.amber], ["Tube length (normal adjustment) = f_o + f_e = " + (fo + fe) + " cm", C.chalk], "Final image at infinity, inverted (fine for stars). A terrestrial telescope adds an erecting lens; binoculars use prisms."], 10.5); }
    },
    readouts(s, c) { if (c.m === 0) { const fo = Math.min(c.fo, 3), u = Math.max(c.u, fo * 1.05), v = (u * fo) / (u - fo); return [["Objective magnification", f(v / u, 2)], ["Eyepiece magnification", f(25 / c.fe + 1, 2)], ["Total", f((v / u) * (25 / c.fe + 1), 1) + "×"]]; } const fo = Math.max(c.fo, 20); return [["Magnifying power", f(fo / c.fe, 1) + "×"], ["Tube length", fo + c.fe + " cm"], ["Image", "inverted"]]; },
  });

  /* ---------- T20 Defects of vision ---------- */
  K.add("20", {
    modeName: "Defects of Vision & Correction", tag: "MYOPIA · HYPERMETROPIA", eqn: "Short sight: image in front of retina → concave (diverging) lens · Long sight: image behind retina → convex (converging) lens",
    controls: [K.sel("d", "Eye", ["Normal eye", "Short sight (myopia)", "Long sight (hypermetropia)"], 1), K.sel("obj", "Looking at", ["Distant object", "Near object (25 cm)"], 0), K.sel("cor", "Correcting lens", ["None", "Wear the correct spectacles"], 0)],
    draw(ctx, s, c) {
      const ex = 400, ey = 200, R = 80; circ(ctx, ex, ey, R, "rgba(240,240,250,.08)", "#e8e8f0", 2); ctx.save(); ctx.beginPath(); ctx.ellipse(ex - R + 18, ey, 10, 34, 0, 0, K.TAU); ctx.fillStyle = "rgba(160,210,255,.35)"; ctx.fill(); ctx.strokeStyle = "#cfe6ff"; ctx.stroke(); ctx.restore(); ctx.save(); ctx.beginPath(); ctx.arc(ex, ey, R - 3, -0.9, 0.9); ctx.strokeStyle = "#d84a5a"; ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); txt(ctx, ex + R + 6, ey + 4, "retina", "#d84a5a", 10);
      const retina = ex + R - 3, lensX = ex - R + 18; let focus = retina; if (c.d === 1 && c.obj === 0) focus = retina - 40; if (c.d === 2 && c.obj === 1) focus = retina + 50; if (c.d === 2 && c.obj === 0) focus = retina + 10; if (c.d === 1 && c.obj === 1) focus = retina - 10; const fixed = c.cor === 1 && c.d > 0; if (fixed) focus = retina;
      const src = c.obj === 0 ? null : [60, ey]; const sx = 300; if (fixed) { ctx.save(); ctx.beginPath(); if (c.d === 1) { ctx.moveTo(sx - 6, ey - 40); ctx.quadraticCurveTo(sx + 4, ey, sx - 6, ey + 40); ctx.lineTo(sx + 6, ey + 40); ctx.quadraticCurveTo(sx - 4, ey, sx + 6, ey - 40); } else { ctx.ellipse(sx, ey, 7, 40, 0, 0, K.TAU); } ctx.closePath(); ctx.fillStyle = "rgba(255,183,3,.35)"; ctx.fill(); ctx.strokeStyle = C.amber; ctx.stroke(); ctx.restore(); txt(ctx, sx, ey + 56, c.d === 1 ? "concave lens" : "convex lens", C.amber, 10, "center"); }
      [-26, 0, 26].forEach((dy) => { const y0 = ey + dy; if (src) { line(ctx, src[0], src[1], lensX, y0, C.teal, 1.3); } else line(ctx, 40, y0, lensX, y0, C.teal, 1.3); const yEnd = ey + (dy * (focus - lensX - (focus > retina ? 0 : 0))) / (focus - lensX) - dy; line(ctx, lensX, y0, focus, ey, C.teal, 1.3); if (focus < retina) line(ctx, focus, ey, retina, ey - (dy * (retina - focus)) / (focus - lensX), "rgba(127,227,218,.5)", 1.2); });
      circ(ctx, Math.min(focus, retina + 60), ey, 4, focus === retina ? C.green : C.red);
      panel(ctx, 20, 290, 600, 90, null); notes(ctx, 30, 310, 580, [focus === retina ? ["Image falls on the retina — sharp.", C.green] : focus < retina ? ["Image forms in front of the retina — blurred. Eyeball too long or lens too strong.", C.red] : ["Image would form behind the retina — blurred. Eyeball too short or lens too weak.", C.red], c.d === 1 ? "Myopic people see near objects clearly but not distant ones; a diverging lens spreads the rays first." : c.d === 2 ? "Hypermetropic people see distant objects clearly but not near ones; a converging lens adds focusing power." : "Normal eye: near point 25 cm, far point at infinity (accommodation by ciliary muscles). Presbyopia (old age) also needs convex lenses for reading."], 10.5);
    },
    readouts(s, c) { return [["Eye", ["normal", "myopic", "hypermetropic"][c.d]], ["Correction", ["none needed", "concave (diverging) lens", "convex (converging) lens"][c.d]], ["Spectacles on", c.cor ? "yes" : "no"]]; },
  });

  /* ---------- T20 Colours of objects and filters ---------- */
  const LIGHTS = [["White", [1, 1, 1]], ["Red", [1, 0, 0]], ["Green", [0, 1, 0]], ["Blue", [0, 0, 1]], ["Yellow (R+G)", [1, 1, 0]], ["Magenta (R+B)", [1, 0, 1]], ["Cyan (G+B)", [0, 1, 1]]];
  K.add("20", {
    modeName: "Colours of Objects & Filters", tag: "REFLECTION · ABSORPTION · ADDITION", eqn: "An object looks the colour(s) it reflects; a filter transmits only its own colour(s). Primary colours of light: red, green, blue",
    controls: [K.sel("L", "Light shining on objects", LIGHTS.map((x) => x[0]), 0), K.sel("F", "Filter in front of the lamp", ["None", "Red filter", "Green filter", "Blue filter"], 0)],
    draw(ctx, s, c) {
      let L = LIGHTS[c.L][1].slice(); if (c.F) L = L.map((v, i) => (i === c.F - 1 ? v : 0)); const lamp = `rgb(${L[0] * 255},${L[1] * 255},${L[2] * 255})`; circ(ctx, 60, 80, 26, lamp, "#888"); txt(ctx, 60, 124, "lamp + filter", C.dim, 10, "center"); ctx.save(); ctx.globalAlpha = 0.12; K.poly(ctx, [[80, 70], [620, 30], [620, 380], [80, 90]], null, lamp); ctx.restore();
      const OBJ = [["White shirt", [1, 1, 1]], ["Red tomato", [1, 0, 0]], ["Green leaf", [0, 1, 0]], ["Blue pen", [0, 0, 1]], ["Yellow banana", [1, 1, 0]], ["Black shoe", [0, 0, 0]]];
      OBJ.forEach(([n, rf], i) => { const x = 150 + (i % 3) * 150, y = 160 + Math.floor(i / 3) * 120, col = rf.map((v, k) => v * L[k]); rect(ctx, x - 40, y - 40, 80, 70, `rgb(${col[0] * 230 + 10},${col[1] * 230 + 10},${col[2] * 230 + 10})`, "#555"); txt(ctx, x, y + 46, n, C.dim, 10, "center"); const looks = col[0] + col[1] + col[2] === 0 ? "black" : col[0] && col[1] && col[2] ? "white" : col[0] && col[1] ? "yellow" : col[0] && col[2] ? "magenta" : col[1] && col[2] ? "cyan" : col[0] ? "red" : col[1] ? "green" : "blue"; txt(ctx, x, y + 60, "looks " + looks, C.amber, 10.5, "center", true); });
      txt(ctx, 20, 390, "A red object absorbs green and blue and reflects red, so under green light it looks black.", C.dim, 10.5);
    },
    readouts(s, c) { return [["Light", LIGHTS[c.L][0]], ["Filter", ["none", "red", "green", "blue"][c.F]], ["Secondary colours", "yellow, magenta, cyan"]]; },
  });

  /* ---------- T22 Sound needs a medium (bell jar) ---------- */
  K.add("22", {
    modeName: "Bell Jar — Sound Needs a Medium", tag: "NO SOUND IN A VACUUM", eqn: "Sound is a mechanical (longitudinal) wave: it needs particles to pass on the vibrations",
    controls: [K.rng("P", "Air pressure left in the jar", 0, 100, 1, 100, " kPa")],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; },
    draw(ctx, s, c) {
      const loud = clamp(c.P / 100, 0, 1); ctx.save(); ctx.beginPath(); ctx.moveTo(90, 320); ctx.lineTo(90, 140); ctx.quadraticCurveTo(90, 60, 200, 60); ctx.quadraticCurveTo(310, 60, 310, 140); ctx.lineTo(310, 320); ctx.strokeStyle = "rgba(220,235,255,.85)"; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); rect(ctx, 70, 320, 260, 16, "#555"); line(ctx, 320, 328, 420, 328, "#888", 6); txt(ctx, 430, 332, "to vacuum pump", C.dim, 10);
      const r = K.rnd(4); for (let i = 0; i < Math.round(loud * 80); i++) circ(ctx, 100 + r() * 200, 80 + r() * 230, 2, "rgba(147,170,196,.6)"); circ(ctx, 200, 180, 26, "#c8a030", "#806010"); const hammer = 200 + 30 + 6 * Math.sin(s.t * 40); line(ctx, 236, 210, hammer, 180, "#999", 3); circ(ctx, hammer, 180, 5, "#888");
      for (let k = 0; k < 4; k++) { const R = 40 + ((s.t * 60 + k * 30) % 120); ctx.save(); ctx.globalAlpha = loud * (1 - (R - 40) / 120); circ(ctx, 200, 180, R, null, C.teal, 2); ctx.restore(); }
      for (let k = 0; k < 3; k++) { const R = 160 + k * 30 + ((s.t * 60) % 30); ctx.save(); ctx.globalAlpha = loud * 0.8 * (1 - k / 3); ctx.beginPath(); ctx.arc(200, 180, R, -0.5, 0.5); ctx.strokeStyle = C.amber; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
      rect(ctx, 460, 120, 150, 20, "rgba(255,255,255,.08)"); rect(ctx, 460, 120, 150 * loud, 20, loud > 0.05 ? C.amber : C.red); txt(ctx, 535, 112, "loudness heard", C.dim, 10, "center"); notes(ctx, 450, 170, 175, [loud > 0.05 ? "Bell heard — fainter as air is pumped out." : ["Bell still seen vibrating but NOT heard — no particles to carry sound.", C.red], "Light still crosses the vacuum, so you can see the hammer.", "Sound travels through solids, liquids and gases (fastest in solids)."], 10.5);
    },
    readouts(s, c) { return [["Air pressure", c.P + " kPa"], ["Sound heard", c.P > 5 ? "yes (" + Math.round(c.P) + " %)" : "no"], ["Light passes", "yes"]]; },
  });

  /* ---------- T22 Speed of sound in different media ---------- */
  const MED = [["Air", 331, "gas"], ["Hydrogen", 1270, "gas"], ["Water", 1480, "liquid"], ["Sea water", 1530, "liquid"], ["Wood", 3850, "solid"], ["Concrete", 3400, "solid"], ["Steel", 5960, "solid"]];
  K.add("22", {
    modeName: "Speed of Sound in Solids, Liquids & Gases", tag: "v = d / t", eqn: "Speed of sound in air ≈ 331 + 0.6θ m/s (θ in °C) — independent of pressure; fastest in solids",
    controls: [K.rng("th", "Air temperature", -20, 45, 1, 30, " °C"), K.rng("d", "Distance (rail / pipe length)", 100, 2000, 50, 1000, " m")],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; if (s.t > c.d / (331 + 0.6 * c.th) + 1) s.t = 0; },
    draw(ctx, s, c) {
      const va = 331 + 0.6 * c.th; const rows = MED.map(([n, v, ph]) => [n, n === "Air" ? va : v, ph]); rows.forEach(([n, v, ph], i) => { const y = 50 + i * 44, prog = clamp((v * s.t) / c.d, 0, 1); rect(ctx, 130, y, 300, 14, ph === "solid" ? "#6a5a4a" : ph === "liquid" ? "#2a6ab8" : "rgba(147,170,196,.25)"); circ(ctx, 130 + prog * 300, y + 7, 6, prog >= 1 ? C.green : C.amber); txt(ctx, 124, y + 12, n, C.chalk, 11, "right"); txt(ctx, 440, y + 12, f(v, 0) + " m/s · " + f(c.d / v, 3) + " s", C.dim, 10.5); });
      panel(ctx, 20, 360 - 30, 600, 50, null); notes(ctx, 30, 350, 580, ["Particles closer and more strongly bonded → vibrations passed on faster. Warmer air → faster. A hammer blow on a long rail is heard twice: first through the steel, then through the air."], 10.5);
    },
    readouts(s, c) { const va = 331 + 0.6 * c.th; return [["Speed in air", f(va, 1) + " m/s"], ["Time in air over d", f(c.d / va, 3) + " s"], ["Time in steel over d", f(c.d / 5960, 3) + " s"]]; },
  });

  /* ---------- T22 Characteristics: pitch, loudness, quality; noise vs music ---------- */
  K.add("22", {
    modeName: "Pitch, Loudness & Quality — Music vs Noise", tag: "CRO TRACES", eqn: "Pitch ↔ frequency · Loudness ↔ amplitude (intensity) · Quality (timbre) ↔ overtones / waveform shape",
    controls: [K.rng("f", "Frequency (pitch)", 100, 1000, 10, 256, " Hz"), K.rng("A", "Amplitude (loudness)", 0.2, 1, 0.05, 0.7), K.sel("q", "Source (quality)", ["Tuning fork (pure tone)", "Flute", "Violin", "Guitar", "Noise (traffic)"], 0)],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; },
    wave(q, x) { const H = [[1], [1, 0.6, 0.2, 0.1], [1, 0.5, 0.33, 0.25, 0.2, 0.17], [1, 0.8, 0.5, 0.15, 0.3]][q]; if (!H) return 0; let y = 0, n = 0; H.forEach((a, i) => { y += a * Math.sin((i + 1) * x); n += a; }); return y / n; },
    draw(ctx, s, c) {
      rect(ctx, 30, 40, 400, 220, "#06140c", "#2a4a3a", 3); for (let i = 1; i < 10; i++) line(ctx, 30 + i * 40, 40, 30 + i * 40, 260, "rgba(91,214,140,.12)", 1); for (let i = 1; i < 6; i++) line(ctx, 30, 40 + i * 36.7, 430, 40 + i * 36.7, "rgba(91,214,140,.12)", 1);
      const r = K.rnd(Math.floor(s.t * 20)); const pts = []; for (let x = 0; x <= 400; x += 2) { const ph = (K.TAU * c.f * x) / 40000; const y = c.q === 4 ? (r() - 0.5) * 2 : this.wave(c.q, ph + s.t * 2); pts.push([30 + x, 150 - y * c.A * 95]); } gl(ctx, pts, C.green, 1.8); txt(ctx, 36, 56, "CRO · time base 1 ms/div", C.green, 10);
      const note = 440 * Math.pow(2, Math.round(12 * Math.log2(c.f / 440)) / 12), nn = ["A", "A♯", "B", "C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯"][((Math.round(12 * Math.log2(c.f / 440)) % 12) + 12) % 12];
      panel(ctx, 450, 30, 178, 340, null); notes(ctx, 458, 52, 165, [["Pitch: " + c.f + " Hz (near " + nn + ")", C.amber], "Higher frequency → higher pitch (closer waves).", ["Loudness: amplitude " + c.A, C.amber], "Bigger amplitude → louder (intensity ∝ A²). Measured in decibels.", ["Quality: " + ["pure sine", "few overtones", "rich in overtones", "plucked, decaying overtones", "irregular, no pattern"][c.q], C.amber], "Same note on different instruments sounds different because of overtones.", "Music: regular, periodic waveform, pleasant. Noise: irregular, unpleasant."], 10.5);
    },
    readouts(s, c) { return [["Frequency", c.f + " Hz"], ["Wavelength in air", f(340 / c.f, 2) + " m"], ["Type", c.q === 4 ? "noise" : "musical note"]]; },
  });

  /* ---------- T22 Resonance tube and end correction ---------- */
  K.add("22", {
    modeName: "Resonance Tube — Speed of Sound & End Correction", tag: "l₁ + e = λ/4 · l₂ + e = 3λ/4", eqn: "Closed tube resonances: l₁ + e = λ/4, l₂ + e = 3λ/4  ⇒  λ = 2(l₂ − l₁), v = fλ, e = (l₂ − 3l₁)/2 (≈ 0.3d)",
    controls: [K.sel("fk", "Tuning fork", ["256 Hz", "320 Hz", "384 Hz", "512 Hz"], 0), K.rng("l", "Air column length l", 5, 110, 0.5, 30, " cm"), K.rng("d", "Tube diameter d", 2, 6, 0.1, 4, " cm"), K.rng("th", "Air temperature", 15, 40, 1, 30, " °C")],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; },
    draw(ctx, s, c) {
      const fq = [256, 320, 384, 512][c.fk], v = 331 + 0.6 * c.th, lam = (v / fq) * 100, e = 0.3 * c.d, l1 = lam / 4 - e, l2 = (3 * lam) / 4 - e, amp = (l) => { const d1 = Math.min(Math.abs(l - l1), Math.abs(l - l2)); return Math.exp(-(d1 * d1) / 4); }, A = amp(c.l);
      const tx = 120, top = 40, sc = 2.6; rect(ctx, tx - c.d * 4, top, c.d * 8, 300, "rgba(220,235,255,.1)", "#e8f0ff", 2); rect(ctx, 40, top + c.l * sc, 260, 340 - top - c.l * sc, "#2a6ab8aa"); line(ctx, 40, top + c.l * sc, 300, top + c.l * sc, "#cfe6ff", 1.5);
      const pts = []; for (let y = 0; y <= c.l * sc; y += 3) { const xcm = c.l - y / sc; pts.push([tx + (c.d * 3.5) * Math.cos((K.TAU * xcm) / lam) * Math.sin(s.t * 20) * A, top + y]); } if (A > 0.05) gl(ctx, pts, C.amber, 2);
      line(ctx, tx - 20, top - 20, tx - 20, top - 4, "#aaa", 4); line(ctx, tx + 20, top - 20, tx + 20, top - 4, "#aaa", 4); txt(ctx, tx + 30, top - 8, fq + " Hz fork", C.dim, 10);
      [[l1, "1st"], [l2, "2nd"]].forEach(([L, n]) => { if (L > 0 && L < 115) { line(ctx, 300, top + L * sc, 330, top + L * sc, C.teal, 1.5); txt(ctx, 334, top + L * sc + 4, n + " resonance " + f(L, 1) + " cm", C.teal, 10.5); } });
      rect(ctx, 460, 50, 150, 20, "rgba(255,255,255,.08)"); rect(ctx, 460, 50, 150 * A, 20, A > 0.7 ? C.green : C.amber); txt(ctx, 535, 44, "loudness", C.dim, 10, "center");
      notes(ctx, 450, 100, 178, [["λ = 2(l₂ − l₁) = " + f(2 * (l2 - l1), 1) + " cm", C.amber], ["v = fλ = " + fq + " × " + f(lam / 100, 3) + " = " + f(v, 1) + " m/s", C.amber], ["End correction e ≈ 0.3d = " + f(e, 2) + " cm", C.teal], "Antinode is slightly above the open end, so the effective length is l + e.", "Loud booming sound = resonance: natural frequency of the air column equals the fork's frequency."], 10.5);
    },
    readouts(s, c) { const fq = [256, 320, 384, 512][c.fk], v = 331 + 0.6 * c.th, lam = (v / fq) * 100, e = 0.3 * c.d; return [["1st resonance l₁", f(lam / 4 - e, 1) + " cm"], ["2nd resonance l₂", f((3 * lam) / 4 - e, 1) + " cm"], ["Speed of sound", f(v, 1) + " m/s"]]; },
  });
});
