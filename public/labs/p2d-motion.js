/* p2d-motion.js — Topics 7–13: relative motion, types of force, banked roads, speed vs velocity, instantaneous speed,
   free fall, uniform vs non-uniform acceleration, scalars vs vectors, resolution, river crossing, couples,
   three-force equilibrium, mass–spring S.H.M., forced vibration & resonance, determining g, inertia, impulse. */
window.PX.push(function () {
  const K = window.PK, C = K.C, { txt, line, rect, circ, arr, panel, notes, axes, plot, f, clamp, rad, deg } = K;
  const car = (ctx, x, y, col, dir = 1) => { rect(ctx, x - 26, y - 14, 52, 16, col, "#111"); rect(ctx, x - 14 + dir * 2, y - 24, 26, 11, col, "#111"); circ(ctx, x - 15, y + 3, 6, "#222", "#888"); circ(ctx, x + 15, y + 3, 6, "#222", "#888"); };

  /* ---------- T7 Relative motion ---------- */
  K.add("7", {
    modeName: "Relative Motion (co-linear)", tag: "v(B rel A) = v(B) − v(A)", eqn: "Relative velocity of B as seen from A:  v(BA) = v(B) − v(A)  (take one direction as positive)",
    controls: [K.rng("vA", "Velocity of car A", -30, 30, 1, 20, " m/s"), K.rng("vB", "Velocity of car B", -30, 30, 1, -15, " m/s"), K.rng("d0", "B starts ahead of A by", 50, 400, 10, 300, " m"), K.sel("frame", "View from", ["The ground", "Car A (A seems still)"], 0)],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; const gap = c.d0 + (c.vB - c.vA) * s.t; if (gap < -60 || gap > 600 || s.t > 30) s.t = 0; },
    draw(ctx, s, c) {
      const sc = 0.9, xA0 = 80, xA = c.frame ? xA0 : xA0 + c.vA * s.t * sc, xB = c.frame ? xA0 + (c.d0 + (c.vB - c.vA) * s.t) * sc : xA0 + (c.d0 + c.vB * s.t) * sc, y = 150, shift = c.frame ? -c.vA * s.t * sc : 0;
      rect(ctx, 0, y + 10, 640, 40, "#2a2f38"); for (let i = -2; i < 20; i++) { const x = ((i * 60 + shift) % 640 + 640) % 640; rect(ctx, x, y + 28, 30, 4, "#d8d8d8"); }
      rect(ctx, 0, y + 50, 640, 40, "#2a2f38"); car(ctx, ((xA % 700) + 700) % 700 - 30, y, "#2a6ad8", Math.sign(c.vA) || 1); car(ctx, ((xB % 700) + 700) % 700 - 30, y + 46, "#d84a3a", Math.sign(c.vB) || 1);
      txt(ctx, ((xA % 700) + 700) % 700 - 30, y - 30, "A", C.blue, 12, "center", true); txt(ctx, ((xB % 700) + 700) % 700 - 30, y + 16, "B", C.red, 12, "center", true);
      const vr = c.vB - c.vA, gap = c.d0 + vr * s.t, meet = vr < 0 ? c.d0 / -vr : null;
      panel(ctx, 20, 220, 600, 150, "Relative velocity"); notes(ctx, 30, 256, 580, [["v(B rel A) = " + c.vB + " − (" + c.vA + ") = " + vr + " m/s", C.amber], vr < 0 ? "The gap closes at " + -vr + " m/s; they meet after t = " + c.d0 + " ÷ " + -vr + " = " + f(meet, 2) + " s." : vr > 0 ? "B moves away from A at " + vr + " m/s; the gap grows." : "Same velocity: the gap stays constant — each car seems at rest to the other.", "Moving in the SAME direction → subtract speeds. OPPOSITE directions → add speeds.", ["Gap now: " + f(gap, 1) + " m   (t = " + f(s.t, 1) + " s)", C.teal]]);
    },
    readouts(s, c) { const vr = c.vB - c.vA; return [["v(B rel A)", vr + " m/s"], ["Gap", f(c.d0 + vr * s.t, 1) + " m"], ["Meet after", vr < 0 ? f(c.d0 / -vr, 2) + " s" : "never"]]; },
  });

  /* ---------- T7 Cause of motion and types of force ---------- */
  const FSC = ["Pulling a box (contact forces)", "Magnet and steel clip (field force)", "Charged rod and paper (field force)", "Falling ball (gravitational field force)"];
  K.add("7", {
    modeName: "Force — Cause of Motion; Contact vs Field Forces", tag: "PUSH · PULL", eqn: "A force starts, stops, speeds up, slows down, changes the direction or the shape of a body",
    controls: [K.sel("sc", "Situation", FSC, 0), K.rng("F", "Applied force / field strength", 0, 40, 1, 20, " N"), K.rng("mu", "Friction coefficient (box)", 0, 0.8, 0.05, 0.3)],
    reset(s) { s.x = 0; s.v = 0; s.t = 0; }, step(s, c, dt) { s.t += dt; if (c.sc === 0) { const m = 4, N = m * K.g, fmax = c.mu * N; let net = s.v > 0.001 ? c.F - fmax : c.F > fmax ? c.F - fmax : 0; s.v = Math.max(0, s.v + (net / m) * dt); s.x += s.v * dt; if (s.x > 6) { s.x = 0; s.v = 0; } } else if (c.sc === 3) { s.x += 0; } },
    draw(ctx, s, c) {
      const F = c.F; if (c.sc === 0) { const y = 240, x = 80 + s.x * 50, m = 4, N = m * K.g, fr = Math.min(c.F, c.mu * N); rect(ctx, 20, y, 600, 14, "#6a4a2a"); rect(ctx, x - 30, y - 50, 60, 50, "#c8a060", "#5a3a1a"); line(ctx, x + 30, y - 25, x + 120, y - 25, C.chalk, 2);
        arr(ctx, x + 30, y - 25, x + 30 + F * 3, y - 25, C.amber); txt(ctx, x + 40 + F * 3, y - 30, "Tension " + F + " N", C.amber, 10.5); arr(ctx, x - 30, y - 6, x - 30 - fr * 3, y - 6, C.red); txt(ctx, Math.max(90, x - 20 - fr * 3), y + 28, "friction " + f(fr, 1) + " N", C.red, 10.5, "right"); arr(ctx, x, y - 50, x, y - 50 - N * 1.5, C.teal); txt(ctx, x + 6, y - 50 - N * 1.5, "normal reaction " + f(N, 1) + " N", C.teal, 10.5); arr(ctx, x, y - 25, x, y - 25 + N * 1.5, C.purple); txt(ctx, x + 6, y + 30 + N, "weight " + f(N, 1) + " N (field)", C.purple, 10.5); }
      else if (c.sc === 1 || c.sc === 2) { const gap = clamp(140 - F * 2.5, 30, 140), osc = 4 * Math.sin(s.t * 6); if (c.sc === 1) { rect(ctx, 100, 170, 50, 40, "#d84a3a"); rect(ctx, 150, 170, 50, 40, "#2a6ad8"); txt(ctx, 125, 196, "N", "#fff", 14, "center", true); txt(ctx, 175, 196, "S", "#fff", 14, "center", true); for (let i = -2; i <= 2; i++) { ctx.save(); ctx.strokeStyle = "rgba(147,170,196,.4)"; ctx.beginPath(); ctx.ellipse(200, 190, 40 + Math.abs(i) * 30, 14 + Math.abs(i) * 12, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke(); ctx.restore(); } rect(ctx, 200 + gap, 184 + osc * (F > 10 ? 0 : 1), 30, 8, "#c8ccd4"); }
        else { rect(ctx, 80, 170, 140, 16, "#e8d8a0"); for (let i = 0; i < 8; i++) txt(ctx, 95 + i * 16, 182, "+", C.red, 13, "center", true); for (let i = 0; i < 6; i++) rect(ctx, 100 + i * 20, 330 - clamp(F * 4 - i * 10, 0, 140), 10, 8, "#f4f4f0"); }
        txt(ctx, 160, 260, "No contact needed — the force acts across the gap", C.teal, 12, "center"); }
      else { const t = (s.t % 1.6), y = 60 + 0.5 * K.g * t * t * 30; circ(ctx, 160, Math.min(y, 330), 14, "#f2a020"); rect(ctx, 20, 345, 300, 10, "#4f7d36"); arr(ctx, 190, Math.min(y, 330), 190, Math.min(y, 330) + 40, C.purple); txt(ctx, 196, Math.min(y, 330) + 30, "weight (gravity)", C.purple, 10.5); }
      panel(ctx, 400, 30, 228, 340, FSC[c.sc].split(" (")[0]);
      notes(ctx, 410, 70, 210, c.sc === 0 ? [["Contact forces: push, pull, tension, friction, normal reaction, air resistance.", C.amber], s.v > 0 ? "Pull > limiting friction → the box accelerates: an unbalanced force causes motion." : "Pull ≤ limiting friction → forces balance and the box stays at rest.", "Weight is a field (non-contact) force from the Earth's gravity.", "Speed now: " + f(s.v, 2) + " m/s"] : [["Field (non-contact) forces act at a distance: gravitational, magnetic, electric (electrostatic).", C.amber], c.sc === 1 ? "A magnet attracts steel but not brass or plastic." : c.sc === 2 ? "A rod charged by rubbing attracts small uncharged bits of paper." : "Every mass attracts every other mass; near Earth the pull is the weight W = mg.", "Field forces weaken with distance."]);
    },
    readouts(s, c) { return c.sc === 0 ? [["Pull", c.F + " N"], ["Limiting friction", f(c.mu * 4 * K.g, 1) + " N"], ["Box", s.v > 0 ? "moving" : "at rest"]] : [["Force type", "field (non-contact)"], ["Situation", FSC[c.sc].split(" (")[0]], ["Strength", c.F]]; },
  });

  /* ---------- T7 Banked road ---------- */
  K.add("7", {
    modeName: "Banking of Roads", tag: "tanθ = v²/(rg)", eqn: "No friction needed when v = √(r·g·tanθ)    with friction μ: v(max) = √(rg(sinθ + μcosθ)/(cosθ − μsinθ))",
    controls: [K.rng("v", "Speed", 5, 50, 1, 22, " m/s"), K.rng("r", "Radius of bend", 20, 200, 5, 80, " m"), K.rng("th", "Banking angle", 0, 40, 1, 15, "°"), K.rng("mu", "Tyre–road friction μ", 0, 1, 0.05, 0.3)],
    reset(s) { s.a = 0; }, step(s, c, dt) { s.a += (c.v / c.r) * dt; },
    calc(c) { const t = rad(c.th), g = K.g, v0 = Math.sqrt(c.r * g * Math.tan(t)), vmax = Math.cos(t) - c.mu * Math.sin(t) > 0 ? Math.sqrt((c.r * g * (Math.sin(t) + c.mu * Math.cos(t))) / (Math.cos(t) - c.mu * Math.sin(t))) : Infinity, vmin = Math.sin(t) - c.mu * Math.cos(t) > 0 ? Math.sqrt((c.r * g * (Math.sin(t) - c.mu * Math.cos(t))) / (Math.cos(t) + c.mu * Math.sin(t))) : 0; return { v0, vmax, vmin, st: c.v > vmax ? "skids outward (too fast)" : c.v < vmin ? "slides down (too slow)" : "holds the bend" }; },
    draw(ctx, s, c) {
      const R = this.calc(c), t = rad(c.th), cx = 150, cy = 180; circ(ctx, cx, cy, 110, null, "#555", 26); circ(ctx, cx, cy, 110, null, "#888", 1); const a = s.a, px = cx + 110 * Math.cos(a), py = cy + 110 * Math.sin(a) * 0.95; ctx.save(); ctx.translate(px, py); ctx.rotate(a + Math.PI / 2); rect(ctx, -9, -14, 18, 28, R.st[0] === "h" ? "#2a6ad8" : C.red, "#111"); ctx.restore(); txt(ctx, cx, cy + 4, "top view", C.dim, 10, "center");
      const bx = 380, by = 280, L = 200; ctx.save(); ctx.translate(bx, by); ctx.rotate(-t); rect(ctx, -L / 2, 0, L, 12, "#555"); rect(ctx, -22, -26, 44, 26, "#2a6ad8", "#111"); const N = 1, sc = 60; arr(ctx, 0, -13, 0, -13 - sc, C.teal); txt(ctx, 6, -13 - sc, "N", C.teal, 12, "left", true); const fdir = c.v > R.v0 ? 1 : -1; if (c.mu > 0 && Math.abs(c.v - R.v0) > 0.5) { arr(ctx, 0, 0, -fdir * 45, 0, C.red); txt(ctx, -fdir * 50, 14, "friction", C.red, 10, "center"); } ctx.restore();
      arr(ctx, bx, by - 13, bx, by - 13 + 60, C.purple); txt(ctx, bx + 6, by + 46, "mg", C.purple, 12, "left", true); arr(ctx, bx, by - 30, bx - 70, by - 30, C.amber); txt(ctx, bx - 74, by - 36, "towards centre", C.amber, 10, "right"); txt(ctx, bx, by + 70, "cross-section, θ = " + c.th + "°", C.dim, 10, "center");
      panel(ctx, 20, 300, 260, 80, null); notes(ctx, 30, 322, 245, [["Ideal (no-friction) speed " + f(R.v0, 1) + " m/s", C.teal], ["Safe range " + f(R.vmin, 1) + " – " + (isFinite(R.vmax) ? f(R.vmax, 1) : "∞") + " m/s", C.amber], ["Car " + R.st, R.st[0] === "h" ? C.green : C.red]], 11);
      panel(ctx, 470, 30, 158, 200, "Why bank?"); notes(ctx, 478, 66, 145, ["The horizontal component of N supplies the centripetal force mv²/r.", "Less reliance on friction → safer on wet roads.", "Also: railway curves, cycle tracks, aircraft banking."], 10.5);
    },
    readouts(s, c) { const R = this.calc(c); return [["Ideal speed", f(R.v0, 1) + " m/s"], ["Max safe speed", isFinite(R.vmax) ? f(R.vmax, 1) + " m/s" : "no limit"], ["Car", R.st]]; },
  });

  /* ---------- T8 Speed vs velocity ---------- */
  const ROUTES = [["Straight there and back (200 m + 200 m)", [[0, 0], [200, 0], [0, 0]]], ["300 m East then 400 m North", [[0, 0], [300, 0], [300, 400]]], ["Round a 400 m track (one lap)", null]];
  K.add("8", {
    modeName: "Speed vs Velocity — A Journey", tag: "SCALAR vs VECTOR", eqn: "Average speed = total distance ÷ time · Average velocity = displacement ÷ time (with direction)",
    controls: [K.sel("rt", "Route", ROUTES.map((r) => r[0]), 1), K.rng("sp", "Walking speed", 1, 8, 0.5, 4, " m/s")],
    reset(s) { s.t = 0; },
    path(rt) { if (rt === 2) { const P = []; for (let i = 0; i <= 64; i++) { const a = (i / 64) * K.TAU; P.push([63.7 * Math.sin(a) * 1.0 + 0, 63.7 - 63.7 * Math.cos(a)]); } return P; } return ROUTES[rt][1]; },
    step(s, c, dt) { s.t += dt; const P = this.path(c.rt); let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if (s.t * c.sp > L + 40) s.t = 0; },
    pos(P, d) { let acc = 0; for (let i = 1; i < P.length; i++) { const L = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if (acc + L >= d) { const u = (d - acc) / L; return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * u, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * u, acc + (d - acc)]; } acc += L; } const e = P[P.length - 1]; return [e[0], e[1], acc]; },
    draw(ctx, s, c) {
      const P = this.path(c.rt), sc = c.rt === 1 ? 0.62 : c.rt === 0 ? 1.4 : 2.3, ox = 60, oy = 340, X = (p) => ox + p[0] * sc, Y = (p) => oy - p[1] * sc * (c.rt === 0 ? 1 : 1);
      K.poly(ctx, P.map((p) => [X(p), c.rt === 0 ? oy - 60 : Y(p)]), "rgba(147,170,196,.6)", null, 3, false);
      const q = this.pos(P, s.t * c.sp), dist = Math.min(q[2], s.t * c.sp), disp = Math.hypot(q[0], q[1]), qx = X(q), qy = c.rt === 0 ? oy - 60 : Y(q);
      circ(ctx, X([0, 0]), c.rt === 0 ? oy - 60 : Y([0, 0]), 6, C.green); arr(ctx, X([0, 0]), c.rt === 0 ? oy - 60 : Y([0, 0]), qx, qy, C.amber, 2.6); if (typeof dot === "function") dot(ctx, qx, qy, 8, C.red, 8);
      txt(ctx, X([0, 0]) - 6, (c.rt === 0 ? oy - 60 : Y([0, 0])) + 18, "start", C.green, 10);
      const T = s.t || 1e-9; panel(ctx, 390, 30, 238, 340, "After " + f(s.t, 1) + " s"); notes(ctx, 400, 70, 220, [["Distance travelled = " + f(dist, 0) + " m", C.chalk], ["Displacement = " + f(disp, 0) + " m " + (disp > 0.5 ? "at bearing " + f((deg(Math.atan2(q[0], q[1])) + 360) % 360, 0) + "°" : ""), C.amber], ["Average speed = " + f(dist / T, 2) + " m/s", C.chalk], ["Average velocity = " + f(disp / T, 2) + " m/s", C.amber], "Speed is a scalar (size only). Velocity is a vector (size and direction).", c.rt !== 1 ? "Back at the start: displacement and average velocity are ZERO, though the speed was not." : "Displacement = √(300² + 400²) = 500 m (Pythagoras)."]);
    },
    readouts(s, c) { const P = this.path(c.rt), q = this.pos(P, s.t * c.sp), T = s.t || 1e-9; return [["Distance", f(Math.min(q[2], s.t * c.sp), 0) + " m"], ["Displacement", f(Math.hypot(q[0], q[1]), 0) + " m"], ["Avg velocity", f(Math.hypot(q[0], q[1]) / T, 2) + " m/s"]]; },
  });

  /* ---------- T8 Instantaneous speed from the gradient ---------- */
  const sOf = (t) => 2 * t + 0.6 * t * t - 0.03 * t * t * t;
  K.add("8", {
    modeName: "Instantaneous Speed — Tangent to s–t Graph", tag: "v = ds/dt", eqn: "Instantaneous speed = gradient of the tangent at that instant · average speed = gradient of the chord",
    controls: [K.rng("t", "Instant t", 0.5, 11, 0.1, 5, " s"), K.rng("dt", "Chord width Δt", 0.2, 5, 0.1, 2, " s")],
    draw(ctx, s, c) {
      const A = axes(ctx, 70, 40, 340, 300, { x0: 0, x1: 12, y0: 0, y1: 80, nx: 6, xl: "time t (s)", yl: "distance s (m)", title: "Non-uniform speed (car accelerating then easing off)" });
      plot(ctx, A, sOf, 0, 12, C.teal); const v = 2 + 1.2 * c.t - 0.09 * c.t * c.t, s0 = sOf(c.t); plot(ctx, A, (t) => s0 + v * (t - c.t), c.t - 3, c.t + 3, C.amber, 1.8);
      const t2 = Math.min(12, c.t + c.dt), s2 = sOf(t2); line(ctx, A.X(c.t), A.Y(s0), A.X(t2), A.Y(s2), C.red, 1.8, [5, 3]); circ(ctx, A.X(c.t), A.Y(s0), 5, C.amber); circ(ctx, A.X(t2), A.Y(s2), 4, C.red);
      line(ctx, A.X(c.t), A.Y(s0), A.X(t2), A.Y(s0), C.dim, 1, [3, 3]); line(ctx, A.X(t2), A.Y(s0), A.X(t2), A.Y(s2), C.dim, 1, [3, 3]); txt(ctx, (A.X(c.t) + A.X(t2)) / 2, A.Y(s0) + 14, "Δt", C.dim, 10, "center"); txt(ctx, A.X(t2) + 6, (A.Y(s0) + A.Y(s2)) / 2, "Δs", C.dim, 10);
      panel(ctx, 430, 30, 198, 340, "Gradients"); notes(ctx, 440, 70, 180, [["Tangent at t = " + c.t + " s: v = " + f(v, 2) + " m/s", C.amber], ["Chord over " + f(t2 - c.t, 1) + " s: average v = " + f((s2 - s0) / (t2 - c.t), 2) + " m/s", C.red], "Make Δt smaller: the chord approaches the tangent — that limit is the instantaneous speed.", "Uniform speed → straight s–t line (same gradient everywhere). Curved line → non-uniform speed."]);
    },
    readouts(s, c) { const v = 2 + 1.2 * c.t - 0.09 * c.t * c.t, t2 = Math.min(12, c.t + c.dt); return [["Instantaneous speed", f(v, 2) + " m/s"], ["Average over chord", f((sOf(t2) - sOf(c.t)) / (t2 - c.t), 2) + " m/s"], ["Distance at t", f(sOf(c.t), 1) + " m"]]; },
  });

  /* ---------- T9 Free fall and vertical throw ---------- */
  K.add("9", {
    modeName: "Motion Under Gravity — Free Fall & Vertical Throw", tag: "a = −g", eqn: "v = u − gt   s = ut − ½gt²   v² = u² − 2gs   (upwards positive)",
    controls: [K.rng("u", "Initial velocity (up +)", -10, 30, 1, 20, " m/s"), K.sel("pl", "Place", ["Earth (g = 9.8)", "Moon (g = 1.6)", "Mars (g = 3.7)"], 0), K.rng("h0", "Launch height", 0, 60, 1, 0, " m")],
    reset(s) { s.t = 0; }, step(s, c, dt) { const g = [9.8, 1.6, 3.7][c.pl], y = c.h0 + c.u * s.t - 0.5 * g * s.t * s.t; s.t += dt; if (y < 0) s.done = (s.done || 0) + dt; else s.done = 0; if (s.done > 1.2) { s.t = 0; s.done = 0; } },
    draw(ctx, s, c) {
      const g = [9.8, 1.6, 3.7][c.pl], tf = (c.u + Math.sqrt(c.u * c.u + 2 * g * c.h0)) / g, t = Math.min(s.t, tf), y = c.h0 + c.u * t - 0.5 * g * t * t, v = c.u - g * t, H = c.h0 + (c.u > 0 ? (c.u * c.u) / (2 * g) : 0), sc = 300 / Math.max(10, H * 1.1), gy = 360;
      rect(ctx, 20, gy, 120, 10, "#4f7d36"); circ(ctx, 80, gy - y * sc - 10, 10, C.amber); arr(ctx, 104, gy - y * sc - 10, 104, gy - y * sc - 10 - v * 3, v > 0 ? C.teal : C.red); txt(ctx, 112, gy - y * sc - 10, "v = " + f(v, 1), C.chalk, 10);
      if (H > 0) { line(ctx, 40, gy - H * sc - 10, 130, gy - H * sc - 10, C.dim, 1, [4, 3]); txt(ctx, 40, gy - H * sc - 16, "max " + f(H, 1) + " m", C.dim, 10); }
      const tm = Math.max(tf, 1); const A = axes(ctx, 200, 40, 200, 130, { x0: 0, x1: tm, y0: -Math.max(30, g * tm), y1: 30, xl: "t (s)", yl: "v (m/s)", title: "velocity–time: straight line, gradient −g" }); plot(ctx, A, (tt) => c.u - g * tt, 0, tf, C.teal); circ(ctx, A.X(t), A.Y(v), 4, C.amber);
      const B = axes(ctx, 200, 220, 200, 130, { x0: 0, x1: tm, y0: 0, y1: Math.max(5, H * 1.1), xl: "t (s)", yl: "height (m)", title: "height–time: parabola" }); plot(ctx, B, (tt) => c.h0 + c.u * tt - 0.5 * g * tt * tt, 0, tf, C.amber); circ(ctx, B.X(t), B.Y(Math.max(0, y)), 4, C.teal);
      panel(ctx, 430, 30, 198, 340, "Results"); notes(ctx, 440, 70, 180, [["Time to top = u/g = " + (c.u > 0 ? f(c.u / g, 2) : "0") + " s", C.chalk], ["Max height = h₀ + u²/2g = " + f(H, 2) + " m", C.chalk], ["Time of flight = " + f(tf, 2) + " s", C.amber], ["Impact speed = " + f(Math.sqrt(c.u * c.u + 2 * g * c.h0), 2) + " m/s", C.amber], "At the top v = 0 but the acceleration is still g downwards.", "All bodies fall with the same acceleration in a vacuum, whatever their mass."]);
    },
    readouts(s, c) { const g = [9.8, 1.6, 3.7][c.pl], tf = (c.u + Math.sqrt(c.u * c.u + 2 * g * c.h0)) / g, t = Math.min(s.t, tf); return [["Time", f(t, 2) + " s"], ["Velocity", f(c.u - g * t, 2) + " m/s"], ["Height", f(Math.max(0, c.h0 + c.u * t - 0.5 * g * t * t), 2) + " m"]]; },
  });

  /* ---------- T9 Uniform vs non-uniform acceleration ---------- */
  const VT = [["Uniform acceleration", (t) => 2 + 2 * t], ["Uniform deceleration (braking)", (t) => Math.max(0, 24 - 3 * t)], ["Increasing acceleration", (t) => 0.25 * t * t], ["Decreasing acceleration (car nearing top speed)", (t) => 25 * (1 - Math.exp(-t / 3))], ["Constant velocity (a = 0)", () => 12]];
  K.add("9", {
    modeName: "Uniform vs Non-uniform Acceleration (v–t)", tag: "a = gradient · s = area", eqn: "Acceleration = gradient of the v–t graph · displacement = area under it",
    controls: [K.sel("m", "Motion", VT.map((x) => x[0]), 0), K.rng("t", "Time cursor", 0, 10, 0.1, 4, " s")],
    draw(ctx, s, c) {
      const fn = VT[c.m][1], A = axes(ctx, 70, 40, 340, 300, { x0: 0, x1: 10, y0: 0, y1: 30, nx: 5, ny: 6, xl: "time (s)", yl: "velocity (m/s)", title: VT[c.m][0] });
      const pts = [[A.X(0), A.Y(0)]]; for (let i = 0; i <= 80; i++) { const tt = (c.t * i) / 80; pts.push([A.X(tt), A.Y(Math.min(30, fn(tt)))]); } pts.push([A.X(c.t), A.Y(0)]); K.poly(ctx, pts, null, "rgba(127,227,218,.18)");
      plot(ctx, A, fn, 0, 10, C.teal); const dtt = 0.01, a = (fn(c.t + dtt) - fn(Math.max(0, c.t - dtt))) / (c.t > dtt ? 2 * dtt : dtt), v = fn(c.t); plot(ctx, A, (tt) => v + a * (tt - c.t), c.t - 2, c.t + 2, C.amber, 1.6); circ(ctx, A.X(c.t), A.Y(v), 5, C.amber);
      let area = 0; for (let i = 0; i < 200; i++) { const t1 = (c.t * i) / 200, t2 = (c.t * (i + 1)) / 200; area += ((fn(t1) + fn(t2)) / 2) * (t2 - t1); }
      panel(ctx, 430, 30, 198, 340, "At t = " + c.t + " s"); notes(ctx, 440, 70, 180, [["v = " + f(v, 2) + " m/s", C.chalk], ["a = gradient = " + f(a, 2) + " m/s²", C.amber], ["s = shaded area = " + f(area, 1) + " m", C.teal], c.m === 0 || c.m === 1 ? "Straight line: the gradient (acceleration) is the same at every instant — uniform." : c.m === 4 ? "Horizontal line: zero gradient, zero acceleration." : "Curved line: the gradient changes — non-uniform acceleration. Find a at an instant from the tangent.", "Negative gradient = deceleration (retardation)."]);
    },
    readouts(s, c) { const fn = VT[c.m][1], a = (fn(c.t + 0.01) - fn(Math.max(0, c.t - 0.01))) / (c.t > 0.01 ? 0.02 : 0.01); return [["Velocity", f(fn(c.t), 2) + " m/s"], ["Acceleration", f(a, 2) + " m/s²"], ["Type", c.m < 2 || c.m === 4 ? "uniform" : "non-uniform"]]; },
  });

  /* ---------- T10 Scalars or vectors ---------- */
  const QTY = [["Mass", 0, "kg"], ["Distance", 0, "m"], ["Speed", 0, "m/s"], ["Time", 0, "s"], ["Energy", 0, "J"], ["Temperature", 0, "K"], ["Density", 0, "kg/m³"], ["Weight", 1, "N"], ["Displacement", 1, "m"], ["Velocity", 1, "m/s"], ["Acceleration", 1, "m/s²"], ["Force", 1, "N"], ["Momentum", 1, "kg·m/s"], ["Electric field", 1, "N/C"]];
  K.add("10", {
    modeName: "Scalar or Vector?", tag: "MAGNITUDE ± DIRECTION", eqn: "Scalar: magnitude only · Vector: magnitude AND direction, drawn as a directed line segment to scale",
    controls: [K.sel("q", "Quantity", QTY.map((x) => x[0]), 9), K.rng("mag", "Magnitude", 1, 10, 0.5, 6), K.rng("dir", "Direction (bearing)", 0, 359, 1, 60, "°")],
    draw(ctx, s, c) {
      const [nm, vec, u] = QTY[c.q]; rect(ctx, 30, 40, 170, 300, "rgba(127,227,218,.08)", C.teal, 1.5); rect(ctx, 220, 40, 170, 300, "rgba(255,183,3,.08)", C.amber, 1.5); txt(ctx, 115, 62, "SCALARS", C.teal, 13, "center", true); txt(ctx, 305, 62, "VECTORS", C.amber, 13, "center", true);
      let si = 0, vi = 0; QTY.forEach(([n, v], i) => { const x = v ? 305 : 115, y = 90 + (v ? vi++ : si++) * 26; rect(ctx, x - 70, y - 15, 140, 21, i === c.q ? (v ? C.amber : C.teal) : "rgba(255,255,255,.05)"); txt(ctx, x, y, n, i === c.q ? "#111" : C.chalk, 11.5, "center", i === c.q); });
      const cx = 510, cy = 200; panel(ctx, 410, 40, 218, 300, nm + " = " + c.mag + " " + u);
      if (vec) { const a = rad(c.dir), L = c.mag * 14; line(ctx, cx, cy - 90, cx, cy - 76, C.dim, 1); txt(ctx, cx, cy - 94, "N", C.dim, 10, "center"); arr(ctx, cx, cy, cx + L * Math.sin(a), cy - L * Math.cos(a), C.amber, 3); txt(ctx, cx, cy + 110, "scale: 1 cm ≙ 1 " + u, C.dim, 10, "center"); notes(ctx, 420, 250, 200, ["Vector: " + c.mag + " " + u + " on bearing " + String(c.dir).padStart(3, "0") + "°.", "Length ∝ magnitude, arrow shows direction."], 10.5); }
      else notes(ctx, 420, 90, 200, [[nm + " is a SCALAR.", C.teal], "It has size only — direction has no meaning. Scalars add by ordinary arithmetic (2 kg + 3 kg = 5 kg)."]);
    },
    readouts(s, c) { const [nm, vec, u] = QTY[c.q]; return [["Quantity", nm], ["Type", vec ? "vector" : "scalar"], ["Unit", u]]; },
  });

  /* ---------- T10 Resolution of vectors ---------- */
  K.add("10", {
    modeName: "Resolution of a Vector", tag: "Fx = F cosθ · Fy = F sinθ", eqn: "A vector F at θ to the horizontal has components F·cosθ (horizontal) and F·sinθ (vertical)",
    controls: [K.rng("F", "Pull on the rope F", 10, 100, 1, 60, " N"), K.rng("th", "Angle with horizontal θ", 0, 90, 1, 35, "°"), K.rng("m", "Mass of box", 5, 40, 1, 15, " kg")],
    draw(ctx, s, c) {
      const t = rad(c.th), Fx = c.F * Math.cos(t), Fy = c.F * Math.sin(t), ox = 140, oy = 300, sc = 2.4;
      rect(ctx, 20, oy, 400, 12, "#6a4a2a"); rect(ctx, ox - 50, oy - 60, 60, 60, "#c8a060", "#5a3a1a"); line(ctx, ox + 10, oy - 30, ox + 10 + 160 * Math.cos(t), oy - 30 - 160 * Math.sin(t), C.chalk, 1.5);
      const x0 = ox + 10, y0 = oy - 30; arr(ctx, x0, y0, x0 + Fx * sc, y0 - Fy * sc, C.amber, 3); arr(ctx, x0, y0, x0 + Fx * sc, y0, C.teal, 2.4); arr(ctx, x0 + Fx * sc, y0, x0 + Fx * sc, y0 - Fy * sc, C.red, 2.4); line(ctx, x0, y0 - Fy * sc, x0 + Fx * sc, y0 - Fy * sc, C.dim, 1, [3, 3]);
      ctx.save(); ctx.beginPath(); ctx.arc(x0, y0, 40, -t, 0); ctx.strokeStyle = C.dim; ctx.stroke(); ctx.restore(); txt(ctx, x0 + 46, y0 - 6, "θ", C.dim, 12);
      txt(ctx, x0 + Fx * sc / 2, y0 + 18, "Fx = " + f(Fx, 1) + " N", C.teal, 11.5, "center"); txt(ctx, x0 + Fx * sc + 8, y0 - Fy * sc / 2, "Fy = " + f(Fy, 1) + " N", C.red, 11.5); txt(ctx, x0 + Fx * sc / 2 - 20, y0 - Fy * sc / 2 - 10, "F = " + c.F + " N", C.amber, 12, "right", true);
      const N = Math.max(0, c.m * K.g - Fy); panel(ctx, 430, 30, 198, 340, "Components"); notes(ctx, 440, 70, 180, [["Fx = F cos θ = " + c.F + " × cos " + c.th + "° = " + f(Fx, 2) + " N", C.teal], ["Fy = F sin θ = " + f(Fy, 2) + " N", C.red], "Check: √(Fx² + Fy²) = " + f(Math.hypot(Fx, Fy), 2) + " N", "Only Fx drags the box along; Fy lifts part of its weight, so the normal reaction falls to " + f(N, 1) + " N.", "Resolve along two perpendicular directions — they act independently."]);
    },
    readouts(s, c) { const t = rad(c.th); return [["Horizontal Fx", f(c.F * Math.cos(t), 2) + " N"], ["Vertical Fy", f(c.F * Math.sin(t), 2) + " N"], ["Normal reaction", f(Math.max(0, c.m * K.g - c.F * Math.sin(t)), 1) + " N"]]; },
  });

  /* ---------- T10 Resultant velocity: crossing a river ---------- */
  K.add("10", {
    modeName: "Resultant Velocity — Crossing a River", tag: "v(resultant) = v(boat) + v(current)", eqn: "Resultant = vector sum: |v| = √(v_b² + v_r² + 2v_b v_r cos α) — time to cross = width ÷ (boat's speed across)",
    controls: [K.rng("vb", "Boat speed in still water", 1, 8, 0.1, 4, " m/s"), K.rng("vr", "River current", 0, 5, 0.1, 2, " m/s"), K.rng("hd", "Heading (0° = straight across, + upstream)", -60, 80, 1, 0, "°"), K.rng("w", "River width", 40, 200, 5, 100, " m")],
    reset(s) { s.t = 0; }, step(s, c, dt) { const a = rad(c.hd), vy = c.vb * Math.cos(a); s.t += dt; if (vy <= 0 || s.t * vy > c.w + 12) s.t = 0; },
    draw(ctx, s, c) {
      const a = rad(c.hd), vx = c.vr - c.vb * Math.sin(a), vy = c.vb * Math.cos(a), sc = 260 / c.w, y0 = 330, y1 = y0 - c.w * sc, x0 = 160;
      rect(ctx, 20, y1, 600, y0 - y1, "#2a6ab8aa"); rect(ctx, 20, y1 - 20, 600, 20, "#4f7d36"); rect(ctx, 20, y0, 600, 30, "#4f7d36"); for (let i = 0; i < 12; i++) { const xx = 30 + ((i * 60 + s.t * c.vr * 20) % 600); arr(ctx, xx, (y0 + y1) / 2 + ((i % 3) - 1) * 50, xx + 20, (y0 + y1) / 2 + ((i % 3) - 1) * 50, "rgba(207,230,255,.5)", 1.2); }
      const tc = vy > 0 ? c.w / vy : Infinity, t = Math.min(s.t, tc), bx = x0 + vx * t * sc, by = y0 - vy * t * sc; line(ctx, x0, y0, x0 + vx * tc * sc, y1, C.amber, 1.5, [5, 4]); ctx.save(); ctx.translate(bx, by); ctx.rotate(-a); K.poly(ctx, [[0, -14], [7, 6], [-7, 6]], "#111", "#f4f0e0"); ctx.restore();
      const vx0 = 470, vy0 = 300, k = 18; arr(ctx, vx0, vy0, vx0 - c.vb * Math.sin(a) * k, vy0 - c.vb * Math.cos(a) * k, C.teal); arr(ctx, vx0 - c.vb * Math.sin(a) * k, vy0 - c.vb * Math.cos(a) * k, vx0 + vx * k, vy0 - vy * k, C.blue); arr(ctx, vx0, vy0, vx0 + vx * k, vy0 - vy * k, C.amber, 3); txt(ctx, vx0, vy0 + 16, "triangle of velocities", C.dim, 10, "center");
      const vres = Math.hypot(vx, vy), drift = vy > 0 ? vx * tc : NaN; panel(ctx, 400, 20, 228, 150, null); notes(ctx, 410, 40, 210, [["Resultant " + f(vres, 2) + " m/s at " + f(deg(Math.atan2(vx, vy)), 1) + "° downstream of straight across", C.amber], vy > 0 ? "Time to cross = " + c.w + " ÷ " + f(vy, 2) + " = " + f(tc, 1) + " s" : "Boat cannot make progress across!", vy > 0 ? "Lands " + f(Math.abs(drift), 1) + " m " + (drift >= 0 ? "downstream" : "upstream") : "", Math.abs(vx) < 0.05 ? ["Heading upstream at sin⁻¹(v_r/v_b) gives a straight crossing.", C.green] : "Shortest TIME: head straight across."], 10.5);
    },
    readouts(s, c) { const a = rad(c.hd), vx = c.vr - c.vb * Math.sin(a), vy = c.vb * Math.cos(a); return [["Resultant speed", f(Math.hypot(vx, vy), 2) + " m/s"], ["Crossing time", vy > 0 ? f(c.w / vy, 1) + " s" : "—"], ["Drift", vy > 0 ? f((vx * c.w) / vy, 1) + " m" : "—"]]; },
  });

  /* ---------- T11 Couple ---------- */
  K.add("11", {
    modeName: "Couple — Steering Wheel & Tap", tag: "MOMENT OF A COUPLE = F × d", eqn: "Two equal, opposite, parallel forces → turning effect only:  moment = F × perpendicular distance between them",
    controls: [K.rng("F", "Each force F", 5, 60, 1, 20, " N"), K.rng("d", "Wheel diameter d", 0.2, 0.6, 0.01, 0.38, " m", 2), K.rng("I", "Resistance (damping)", 0.5, 5, 0.1, 2)],
    reset(s) { s.a = 0; s.w = 0; }, step(s, c, dt) { const tau = c.F * c.d, damp = c.I * s.w * 6; s.w += ((tau - damp) / 1.2) * dt; s.a += s.w * dt; },
    draw(ctx, s, c) {
      const cx = 200, cy = 200, R = 70 + c.d * 200, a = s.a; circ(ctx, cx, cy, R, null, "#333", 18); circ(ctx, cx, cy, R, null, "#555", 2); for (let k = 0; k < 3; k++) { const b = a + (k * K.TAU) / 3; line(ctx, cx, cy, cx + R * Math.cos(b), cy + R * Math.sin(b), "#444", 10); } circ(ctx, cx, cy, 18, "#222", "#666");
      const p1 = [cx + R * Math.cos(a), cy + R * Math.sin(a)], p2 = [cx - R * Math.cos(a), cy - R * Math.sin(a)], tx = -Math.sin(a), ty = Math.cos(a), L = c.F * 2.4; arr(ctx, p1[0], p1[1], p1[0] + tx * L, p1[1] + ty * L, C.amber, 3); arr(ctx, p2[0], p2[1], p2[0] - tx * L, p2[1] - ty * L, C.amber, 3);
      line(ctx, p1[0], p1[1], p2[0], p2[1], C.dim, 1, [4, 3]); txt(ctx, cx + 4, cy - 26, "d = " + c.d + " m", C.dim, 10);
      panel(ctx, 410, 30, 218, 340, "Couple"); notes(ctx, 420, 70, 200, [["Moment of couple = F × d = " + c.F + " × " + c.d + " = " + f(c.F * c.d, 2) + " N·m", C.amber], "Resultant force = 0 → the wheel does not move sideways, it only rotates.", "Bigger wheel (larger d) → same turning effect with a smaller force.", "Examples: turning a tap, a corkscrew, a screwdriver, a steering wheel, winding a clock, the coil of an electric motor."]);
    },
    readouts(s, c) { return [["Moment", f(c.F * c.d, 2) + " N·m"], ["Resultant force", "0 N"], ["Angular speed", f(s.w || 0, 2) + " rad/s"]]; },
  });

  /* ---------- T11 Three forces in equilibrium (force board) ---------- */
  K.add("11", {
    modeName: "Equilibrium of Three Forces — Force Board", tag: "TRIANGLE OF FORCES · LAMI", eqn: "Three forces in equilibrium form a closed triangle:  F₁/sinα = F₂/sinβ = F₃/sinγ  (Lami's theorem)",
    controls: [K.rng("W1", "Weight on left pulley W₁", 1, 10, 0.1, 4, " N"), K.rng("W2", "Weight on right pulley W₂", 1, 10, 0.1, 5, " N"), K.rng("W3", "Weight hanging at knot W₃", 1, 15, 0.1, 6, " N")],
    solve(c) { const { W1, W2, W3 } = c; if (W3 >= W1 + W2 || W1 >= W2 + W3 || W2 >= W1 + W3) return null; const c1 = (W3 * W3 + W1 * W1 - W2 * W2) / (2 * W1 * W3), c2 = (W3 * W3 + W2 * W2 - W1 * W1) / (2 * W2 * W3); return { a1: Math.acos(clamp(c1, -1, 1)), a2: Math.acos(clamp(c2, -1, 1)) }; },
    draw(ctx, s, c) {
      const S = this.solve(c), P1 = [70, 60], P2 = [350, 60]; rect(ctx, 30, 40, 360, 330, "rgba(232,224,192,.08)", C.line, 2); circ(ctx, P1[0], P1[1], 12, null, C.chalk, 2); circ(ctx, P2[0], P2[1], 12, null, C.chalk, 2);
      if (!S) { txt(ctx, 210, 200, "No equilibrium: one weight exceeds the sum of the other two", C.red, 12, "center"); return; }
      if (S.a1 >= Math.PI / 2 || S.a2 >= Math.PI / 2) { txt(ctx, 210, 200, "Knot would rise above the pulleys — change the weights", C.red, 12, "center"); }
      const t1 = Math.tan(S.a1), t2 = Math.tan(S.a2), h = (P2[0] - P1[0]) / (t1 + t2), kx = P1[0] + h * t1, ky = P1[1] + h, Hs = clamp(ky, 80, 340);
      line(ctx, P1[0], P1[1], kx, Hs, C.chalk, 1.5); line(ctx, P2[0], P2[1], kx, Hs, C.chalk, 1.5); line(ctx, kx, Hs, kx, Hs + 30, C.chalk, 1.5); line(ctx, P1[0] - 12, P1[1], P1[0] - 12, 150, C.chalk, 1.5); line(ctx, P2[0] + 12, P2[1], P2[0] + 12, 150, C.chalk, 1.5);
      [[P1[0] - 12, 150, c.W1], [P2[0] + 12, 150, c.W2], [kx, Hs + 30, c.W3]].forEach(([x, y, w]) => { rect(ctx, x - 12, y, 24, 10 + w * 3, "#8a8f99", "#333"); txt(ctx, x, y + 22 + w * 3, w + " N", C.dim, 10, "center"); });
      const sc = 9; arr(ctx, kx, Hs, kx - Math.sin(S.a1) * c.W1 * sc, Hs - Math.cos(S.a1) * c.W1 * sc, C.teal); arr(ctx, kx, Hs, kx + Math.sin(S.a2) * c.W2 * sc, Hs - Math.cos(S.a2) * c.W2 * sc, C.amber); arr(ctx, kx, Hs, kx, Hs + c.W3 * sc * 0.6, C.red);
      const tx = 470, ty = 300, k = 12, A = [tx, ty], B = [tx + Math.sin(S.a1) * c.W1 * k * -1 * -1, ty - Math.cos(S.a1) * c.W1 * k]; const Bp = [tx - Math.sin(S.a1) * c.W1 * k, ty - Math.cos(S.a1) * c.W1 * k], Cp = [Bp[0] + Math.sin(S.a2) * c.W2 * k, Bp[1] - Math.cos(S.a2) * c.W2 * k];
      arr(ctx, A[0], A[1], Bp[0], Bp[1], C.teal); arr(ctx, Bp[0], Bp[1], Cp[0], Cp[1], C.amber); arr(ctx, Cp[0], Cp[1], A[0], A[1], C.red); txt(ctx, tx, ty + 18, "closed triangle of forces", C.dim, 10, "center");
      panel(ctx, 400, 30, 228, 130, null); notes(ctx, 410, 52, 210, [["Angles from vertical: " + f(deg(S.a1), 1) + "° and " + f(deg(S.a2), 1) + "°", C.chalk], ["W₁ sinα₁ = " + f(c.W1 * Math.sin(S.a1), 2) + " = W₂ sinα₂ = " + f(c.W2 * Math.sin(S.a2), 2) + " N", C.amber], "Vertical: W₁cosα₁ + W₂cosα₂ = " + f(c.W1 * Math.cos(S.a1) + c.W2 * Math.cos(S.a2), 2) + " N = W₃", "Any one force is the equilibrant of the other two."], 10.5);
    },
    readouts(s, c) { const S = this.solve(c); return S ? [["Angle α₁", f(deg(S.a1), 1) + "°"], ["Angle α₂", f(deg(S.a2), 1) + "°"], ["Resultant", "0 (equilibrium)"]] : [["Equilibrium", "impossible"], ["Rule", "each force < sum of others"], ["", ""]]; },
  });

  /* ---------- T12 Mass–spring S.H.M. with reference circle and energy ---------- */
  K.add("12", {
    modeName: "S.H.M. — Spring, Reference Circle & Energy", tag: "a = −ω²x", eqn: "x = A cos ωt   v = −Aω sin ωt   a = −ω²x   T = 2π√(m/k)   E = ½kA²",
    controls: [K.sel("sys", "Oscillator", ["Spiral spring with mass", "Loaded test-tube in water"], 0), K.rng("k", "Spring constant k", 5, 80, 1, 20, " N/m"), K.rng("m", "Mass m", 0.1, 2, 0.05, 0.5, " kg", 2), K.rng("A", "Amplitude A", 0.02, 0.12, 0.005, 0.08, " m", 3)],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; },
    kk(c) { return c.sys === 0 ? c.k : 1000 * K.g * 4e-4; },
    draw(ctx, s, c) {
      const k = this.kk(c), w = Math.sqrt(k / c.m), x = c.A * Math.cos(w * s.t), v = -c.A * w * Math.sin(w * s.t), a = -w * w * x, sc = 900, cx = 110, eq = 210;
      if (c.sys === 0) { line(ctx, 40, 40, 180, 40, C.dim, 5); const top = 40, by = eq + x * sc; const coils = 16; const pts = []; for (let i = 0; i <= coils * 2; i++) pts.push([cx + (i % 2 ? 14 : -14) * (i > 0 && i < coils * 2 ? 1 : 0), top + ((by - 22 - top) * i) / (coils * 2)]); K.poly(ctx, pts, C.chalk, null, 1.5, false); rect(ctx, cx - 22, by - 22, 44, 44, "#8a8f99", "#333"); }
      else { rect(ctx, 50, 150, 120, 200, "#2a6ab888"); const ty = eq + x * sc; rect(ctx, cx - 12, ty - 110, 24, 150, "rgba(220,235,255,.25)", "#e8f0ff"); rect(ctx, cx - 10, ty + 10, 20, 26, "#c8a060"); line(ctx, 50, 150, 170, 150, "#cfe6ff", 1); }
      line(ctx, 30, eq, 200, eq, C.dim, 1, [4, 3]); txt(ctx, 196, eq - 4, "equilibrium", C.dim, 9.5, "right");
      const rx = 290, ry = eq, R = c.A * sc, ph = w * s.t; circ(ctx, rx, ry, R, null, "rgba(147,170,196,.5)", 1.2); const qx = rx + R * Math.sin(ph), qy = ry + R * Math.cos(ph); circ(ctx, qx, qy, 6, C.amber); line(ctx, qx, qy, 200, qy, C.amber, 1, [3, 3]); line(ctx, rx, ry, qx, qy, C.amber, 1); txt(ctx, rx, ry + R + 18, "reference circle (ω)", C.dim, 9.5, "center");
      const E = 0.5 * k * c.A * c.A, PE = 0.5 * k * x * x, KE = E - PE, bx = 370, bh = 220; [["KE", KE, C.teal], ["PE", PE, C.amber], ["Total", E, C.red]].forEach(([n, val, col], i) => { const hgt = (val / E) * bh; rect(ctx, bx + i * 38, 330 - hgt, 28, hgt, col); txt(ctx, bx + 14 + i * 38, 346, n, C.dim, 10, "center"); });
      panel(ctx, 488, 30, 140, 340, null); notes(ctx, 496, 52, 128, [["T = " + f((K.TAU / w), 3) + " s", C.amber], "f = " + f(w / K.TAU, 2) + " Hz", "ω = " + f(w, 2) + " rad/s", "x = " + f(x * 100, 2) + " cm", "v = " + f(v, 3) + " m/s", "a = " + f(a, 2) + " m/s²", ["v max = ωA = " + f(w * c.A, 3), C.teal], ["a max = ω²A = " + f(w * w * c.A, 2), C.teal], "E = ½kA² = " + f(E * 1000, 1) + " mJ"], 10.5);
    },
    readouts(s, c) { const k = this.kk(c), w = Math.sqrt(k / c.m); return [["Period T", f(K.TAU / w, 3) + " s"], ["Max speed", f(w * c.A, 3) + " m/s"], ["Total energy", f(0.5 * k * c.A * c.A * 1000, 1) + " mJ"]]; },
  });

  /* ---------- T12 Forced vibration & resonance (Barton's pendulums) ---------- */
  const BL = [0.3, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5];
  K.add("12", {
    modeName: "Forced Vibration & Resonance (Barton's Pendulums)", tag: "RESONANCE", eqn: "Forced oscillators swing at the driver's frequency; the one whose natural frequency equals it resonates (largest amplitude)",
    controls: [K.rng("Ld", "Driver pendulum length", 0.3, 1.5, 0.05, 0.9, " m", 2), K.rng("b", "Damping", 0.05, 1, 0.05, 0.2)],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; },
    amp(L, c) { const w0 = Math.sqrt(K.g / L), w = Math.sqrt(K.g / c.Ld); return 1 / Math.sqrt(Math.pow(w0 * w0 - w * w, 2) + Math.pow(c.b * 2 * w, 2)); },
    draw(ctx, s, c) {
      const w = Math.sqrt(K.g / c.Ld), amax = this.amp(c.Ld, c); line(ctx, 30, 40, 400, 60, C.chalk, 1.5); const px = (i) => 60 + i * 48;
      BL.forEach((L, i) => { const x = px(i), y0 = 40 + (x - 30) * (20 / 370), A = (this.amp(L, c) / amax) * 0.35, w0 = Math.sqrt(K.g / L), ph = Math.atan2(c.b * 2 * w, w0 * w0 - w * w), th = A * Math.cos(w * s.t - ph), len = 60 + L * 160, bx = x + len * Math.sin(th), by = y0 + len * Math.cos(th); line(ctx, x, y0, bx, by, C.dim, 1.2); circ(ctx, bx, by, 8, Math.abs(L - c.Ld) < 0.06 ? C.amber : C.teal); txt(ctx, x, 370, L.toFixed(1), C.dim, 9.5, "center"); });
      const dx = 30, dy = 40, dl = 60 + c.Ld * 160, dth = 0.35 * Math.cos(w * s.t); line(ctx, dx, dy, dx + dl * Math.sin(dth), dy + dl * Math.cos(dth), C.red, 1.5); circ(ctx, dx + dl * Math.sin(dth), dy + dl * Math.cos(dth), 13, C.red); txt(ctx, 20, 386, "lengths (m)", C.dim, 9.5);
      const A = axes(ctx, 450, 60, 170, 160, { x0: 0.3, x1: 1.5, y0: 0, y1: 1.05, xl: "pendulum length (m)", yl: "amplitude", title: "Resonance curve" }); plot(ctx, A, (L) => this.amp(L, c) / amax, 0.3, 1.5, C.amber); line(ctx, A.X(c.Ld), A.y, A.X(c.Ld), A.y + A.h, C.red, 1, [4, 3]);
      notes(ctx, 450, 260, 175, [["Driver frequency " + f(w / K.TAU, 2) + " Hz", C.red], "The pendulum of the SAME length (natural frequency) swings most: resonance.", "More damping → lower, broader peak.", "Examples: tuning a radio, Tacoma bridge, soldiers break step on bridges, resonance boxes."], 10.5);
    },
    readouts(s, c) { return [["Driver frequency", f(Math.sqrt(K.g / c.Ld) / K.TAU, 2) + " Hz"], ["Resonating pendulum", "L ≈ " + f(c.Ld, 2) + " m"], ["Damping", c.b]]; },
  });

  /* ---------- T12 Determining g with a simple pendulum ---------- */
  K.add("12", {
    modeName: "Determining g — Graph of T² against L", tag: "g = 4π² ÷ slope", eqn: "T = 2π√(L/g)  ⇒  T² = (4π²/g)·L  — a straight line through the origin; slope = 4π²/g",
    controls: [K.sel("pl", "Location", ["Lagos (g ≈ 9.78)", "Accra (g ≈ 9.78)", "Pole (g ≈ 9.83)", "Moon (g ≈ 1.62)"], 0), K.rng("n", "Number of readings", 3, 10, 1, 6), K.rng("err", "Timing scatter", 0, 0.05, 0.005, 0.015, " s", 3)],
    data(c) { const g = [9.78, 9.78, 9.83, 1.62][c.pl], r = K.rnd(42 + c.n), pts = []; for (let i = 0; i < c.n; i++) { const L = 0.3 + (1.2 * i) / Math.max(1, c.n - 1), T = K.TAU * Math.sqrt(L / g) + (r() - 0.5) * 2 * c.err; pts.push([L, T, T * T]); } const n = pts.length, sx = pts.reduce((a, p) => a + p[0], 0), sy = pts.reduce((a, p) => a + p[2], 0), sxx = pts.reduce((a, p) => a + p[0] * p[0], 0), sxy = pts.reduce((a, p) => a + p[0] * p[2], 0), m = (n * sxy - sx * sy) / (n * sxx - sx * sx), b = (sy - m * sx) / n; return { g, pts, m, b }; },
    draw(ctx, s, c) {
      const D = this.data(c), ymax = Math.max(...D.pts.map((p) => p[2])) * 1.15, A = axes(ctx, 70, 40, 320, 290, { x0: 0, x1: 1.6, y0: 0, y1: ymax, nx: 4, xl: "length L (m)", yl: "T² (s²)", title: "T² against L" });
      plot(ctx, A, (L) => D.m * L + D.b, 0, 1.6, C.amber, 1.8); D.pts.forEach((p) => { circ(ctx, A.X(p[0]), A.Y(p[2]), 4.5, C.teal); });
      const gm = (4 * Math.PI * Math.PI) / D.m; panel(ctx, 410, 30, 218, 340, "Results table"); txt(ctx, 420, 66, "L (m)   T (s)   T² (s²)", C.chalk, 11);
      D.pts.forEach((p, i) => txt(ctx, 420, 86 + i * 17, f(p[0], 2).padEnd(7) + " " + f(p[1], 3).padEnd(7) + " " + f(p[2], 3), C.dim, 11));
      notes(ctx, 420, 100 + D.pts.length * 17, 200, [["Slope = " + f(D.m, 3) + " s²/m", C.amber], ["g = 4π² ÷ slope = " + f(gm, 3) + " m/s²", C.teal], "Accepted value: " + D.g + " m/s² (" + f((Math.abs(gm - D.g) / D.g) * 100, 2) + " % error)", "Precautions: small amplitude (< 10°), time 20+ oscillations, measure L to the centre of the bob."], 10.5);
    },
    readouts(s, c) { const D = this.data(c); return [["Slope", f(D.m, 3) + " s²/m"], ["g from graph", f((4 * Math.PI * Math.PI) / D.m, 3) + " m/s²"], ["Readings", c.n]]; },
  });

  /* ---------- T13 Inertia: coin on a card ---------- */
  K.add("13", {
    modeName: "Inertia — Coin, Card & Glass", tag: "NEWTON'S FIRST LAW", eqn: "A body stays at rest or moves uniformly in a straight line unless a resultant force acts — inertia ∝ mass",
    controls: [K.rng("acc", "Card acceleration (flick)", 0.5, 40, 0.5, 25, " m/s²"), K.rng("mu", "Coin–card friction μ", 0.1, 0.8, 0.05, 0.35)],
    reset(s) { s.t = 0; s.xc = 0; s.vc = 0; s.xk = 0; s.drop = 0; s.state = 0; },
    step(s, c, dt) { s.t += dt; if (s.t > 4) { this.reset(s, c); return; } if (s.t < 0.6) return; if (s.state === 0) { const vk = c.acc * (s.t - 0.6); s.xk = 0.5 * c.acc * Math.pow(s.t - 0.6, 2); const ac = Math.min(c.acc, c.mu * K.g); s.vc = Math.min(vk, s.vc + ac * dt); s.xc += s.vc * dt; if (s.xk - s.xc > 0.06) s.state = 1; } else if (s.state === 1) { s.xk += 3 * dt; s.vc = Math.max(0, s.vc - 0.4 * K.g * dt); s.xc += s.vc * dt; s.drop += dt; } },
    draw(ctx, s, c) {
      const sc = 1500, gx = 220, top = 200; rect(ctx, gx - 40, top, 80, 140, "rgba(220,235,255,.12)", "rgba(220,235,255,.8)", 2); rect(ctx, 100, 340, 340, 10, "#6a4a2a");
      const cardX = gx - 70 + s.xk * sc; rect(ctx, cardX, top - 6, 140, 6, "#e84a5a"); const coinX = gx + s.xc * sc, onCard = s.state === 0, coinY = onCard ? top - 12 : Math.min(top + 120, top - 12 + 0.5 * K.g * s.drop * s.drop * 900);
      const inGlass = Math.abs(s.xc * sc) < 34; ctx.save(); ctx.beginPath(); ctx.ellipse(coinX, s.state === 1 && !inGlass ? top - 12 : coinY, 16, 5, 0, 0, K.TAU); ctx.fillStyle = "#d8b450"; ctx.fill(); ctx.restore();
      const slips = c.acc > c.mu * K.g; panel(ctx, 400, 30, 228, 340, slips ? "Quick flick" : "Slow pull"); notes(ctx, 410, 70, 210, [["Max friction can accelerate the coin at μg = " + f(c.mu * K.g, 2) + " m/s²", C.amber], slips ? "The card accelerates faster than friction can drag the coin: the coin's inertia keeps it almost at rest and it drops into the glass." : "Friction is enough to carry the coin with the card — it moves off the glass.", "Inertia: reluctance of a body to change its state of rest or motion. Mass measures inertia; weight is the pull of gravity on that mass.", "Seat belts and head-rests protect passengers because their bodies keep moving when a car stops suddenly."]);
    },
    readouts(s, c) { return [["Card acceleration", c.acc + " m/s²"], ["Friction limit μg", f(c.mu * K.g, 2) + " m/s²"], ["Outcome", c.acc > c.mu * K.g ? "coin drops in glass" : "coin goes with card"]]; },
  });

  /* ---------- T13 Impulse ---------- */
  const SURF = [["Concrete floor", 0.002], ["Grass", 0.012], ["Sponge cushion", 0.06], ["Air bag / sand pit", 0.12]];
  K.add("13", {
    modeName: "Impulse — Ft = Δ(mv)", tag: "F = Δp / Δt", eqn: "Impulse = F·Δt = change in momentum = m(v − u)   — a longer stopping time means a smaller force",
    controls: [K.rng("m", "Mass of egg/ball", 0.03, 0.3, 0.01, 0.06, " kg", 2), K.rng("h", "Drop height", 0.2, 5, 0.1, 1.5, " m"), K.sel("sf", "Landing surface", SURF.map((x) => x[0]), 0)],
    reset(s) { s.t = 0; }, step(s, c, dt) { s.t += dt; if (s.t > Math.sqrt((2 * c.h) / K.g) + 2) s.t = 0; },
    draw(ctx, s, c) {
      const v = Math.sqrt(2 * K.g * c.h), dtc = SURF[c.sf][1], p = c.m * v, F = p / dtc + c.m * K.g, tf = Math.sqrt((2 * c.h) / K.g), y = Math.min(c.h, 0.5 * K.g * s.t * s.t), gy = 340, sc = 260 / 5, breaks = F > 25;
      rect(ctx, 30, gy, 200, 26, ["#8a8a8a", "#4f7d36", "#f2c84a", "#e8e0c0"][c.sf]); const landed = s.t >= tf, ey = gy - (c.h - y) * sc - 14;
      if (landed && breaks && c.m < 0.1) { K.poly(ctx, [[110, gy - 4], [150, gy - 10], [140, gy - 2]], null, "#f4f0e0"); circ(ctx, 130, gy - 4, 10, "#f2c21a"); } else { ctx.save(); ctx.beginPath(); ctx.ellipse(130, landed ? gy - 14 : ey, 11, 14, 0, 0, K.TAU); ctx.fillStyle = "#f4f0e0"; ctx.fill(); ctx.restore(); }
      const A = axes(ctx, 290, 60, 160, 160, { x0: 0, x1: 0.15, y0: 0, y1: Math.max(10, (c.m * Math.sqrt(2 * K.g * 5)) / 0.002 / 1.5), xl: "time (s)", yl: "force (N)", title: "Force–time on impact" });
      const pk = (2 * p) / dtc; plot(ctx, A, (t) => (t < dtc ? pk * Math.sin((Math.PI * t) / dtc) * 0.785 : 0), 0, 0.15, C.red, 2, 300); txt(ctx, 300, 240, "area under curve = impulse = " + f(p, 3) + " N·s", C.dim, 10);
      panel(ctx, 470, 30, 158, 340, null); notes(ctx, 478, 52, 145, [["Impact speed v = √(2gh) = " + f(v, 2) + " m/s", C.chalk], ["Momentum change = " + f(p, 3) + " kg·m/s", C.amber], ["Stopping time = " + dtc * 1000 + " ms", C.chalk], ["Average force ≈ " + f(F, 1) + " N", breaks ? C.red : C.green], breaks ? "Large force — an egg breaks." : "Force is small enough — no damage.", "Uses: crumple zones, air bags, catching a ball with moving hands, padded floors."], 10.5);
    },
    readouts(s, c) { const v = Math.sqrt(2 * K.g * c.h), p = c.m * v; return [["Impulse", f(p, 3) + " N·s"], ["Stopping time", SURF[c.sf][1] * 1000 + " ms"], ["Average force", f(p / SURF[c.sf][1] + c.m * K.g, 1) + " N"]]; },
  });
});
