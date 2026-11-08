/* m-trigcalc.js — WAEC Core Mathematics: Trigonometry (F) and Introductory Calculus (G). */
(function () {
  "use strict";
  const MK = window.MK, f = MK.fmt, T = MK.table, W = MK.when, R = MK.rad, D = MK.deg, TAU = MK.TAU;
  const EXACT = { 0: ["0", "1", "0"], 30: ["1/2", "√3/2", "1/√3 = √3/3"], 45: ["1/√2 = √2/2", "1/√2 = √2/2", "1"], 60: ["√3/2", "1/2", "√3"], 90: ["1", "0", "undefined"] };
  const b3 = (d) => String(((Math.round(d) % 360) + 360) % 360).padStart(3, "0") + "°";
  const compass = (d) => { d = ((d % 360) + 360) % 360; if (d === 0) return "N"; if (d === 90) return "E"; if (d === 180) return "S"; if (d === 270) return "W"; if (d < 90) return `N${f(d, 1)}°E`; if (d < 180) return `S${f(180 - d, 1)}°E`; if (d < 270) return `S${f(d - 180, 1)}°W`; return `N${f(360 - d, 1)}°W`; };
  MK.bearing3 = b3; MK.compass = compass;

  /* ---------------- F-a Trigonometric ratios & graphs ---------------- */
  MK.def("F-a", {
    title: "Sine, cosine & tangent", env: "graph",
    values: { mode: "circle", th: 40, opp: 3, adj: 4, a: 2, b: 1, k: 1, fn: "sin" },
    controls: [{ type: "tabs", key: "mode", label: "View", options: [["circle", "Unit circle → graph"], ["tri", "Right-angled triangle"], ["graph", "Graphs y = a sin x + b cos x"]] },
      { key: "th", label: "Angle θ", min: 0, max: 360, unit: "°", show: W("mode", "circle") }, { type: "select", key: "fn", label: "Trace", options: [["sin", "sin θ"], ["cos", "cos θ"], ["tan", "tan θ"]], show: W("mode", "circle") },
      { key: "opp", label: "Opposite", min: 1, max: 12, step: 0.5, show: W("mode", "tri") }, { key: "adj", label: "Adjacent", min: 1, max: 12, step: 0.5, show: W("mode", "tri") },
      { key: "a", label: "a (in a sin x)", min: -3, max: 3, step: 0.5, show: W("mode", "graph") }, { key: "b", label: "b (in b cos x)", min: -3, max: 3, step: 0.5, show: W("mode", "graph") }, { key: "k", label: "Solve = k", min: -4, max: 4, step: 0.25, show: W("mode", "graph") }],
    hint: "Drag the point round the circle",
    state: () => ({}),
    draw(g, s, c, B) {
      const P = B.P, a = B.area;
      if (c.mode === "tri") { const F = MK.fit([[0, 0], [c.adj, 0], [c.adj, c.opp]], a, 40), A = F.map([0, 0]), Cc = F.map([c.adj, 0]), Bq = F.map([c.adj, c.opp]); B.poly([A, Cc, Bq], P.ink, P.fillB, 2.4); B.right(...Cc, Math.PI, -Math.PI / 2, 12);
        MK.arcAt(B, A, Cc, Bq, "θ = " + f(D(Math.atan2(c.opp, c.adj)), 2) + "°", P.purple, 34); B.text("adjacent = " + c.adj, (A[0] + Cc[0]) / 2, A[1] + 20, { align: "center", w: 700, color: P.green }); B.text("opposite = " + c.opp, Cc[0] + 8, (Cc[1] + Bq[1]) / 2, { w: 700, color: P.red }); B.text("hypotenuse = " + f(Math.hypot(c.opp, c.adj), 3), (A[0] + Bq[0]) / 2 - 12, (A[1] + Bq[1]) / 2 - 10, { align: "right", w: 700, color: P.blue }); return; }
      if (c.mode === "graph") { const fn = (x) => c.a * Math.sin(R(x)) + c.b * Math.cos(R(x)), Am = Math.max(1, Math.hypot(c.a, c.b)) + 0.5; const m = B.axes({ xmin: 0, xmax: 360, ymin: -Math.max(Am, Math.abs(c.k) + 0.5), ymax: Math.max(Am, Math.abs(c.k) + 0.5), xstep: 30, xl: "x°" });
        B.plot(m, (x) => c.a * Math.sin(R(x)), P.faint, 1.4, { dash: [5, 4] }); B.plot(m, (x) => c.b * Math.cos(R(x)), P.faint, 1.4, { dash: [2, 3] }); B.plot(m, fn, P.blue, 2.8); B.plot(m, () => c.k, P.green, 1.8);
        MK.roots((x) => fn(x) - c.k, 0, 360, 720).forEach((r) => { B.dot(m.X(r), m.Y(c.k), P.red, 6, f(r, 1) + "°", { dy: -12, size: 10.5 }); B.line(m.X(r), m.Y(c.k), m.X(r), m.Y(0), P.red, 1, [3, 3]); }); return; }
      // unit circle + traced graph
      const R0 = Math.min(a.h * 0.36, a.w * 0.22), cx = a.x + R0 + 18, cy = a.y + a.h / 2 + 6, th = R(c.th), px = cx + Math.cos(th) * R0, py = cy - Math.sin(th) * R0;
      s.g = { cx, cy, R0 };
      B.line(cx - R0 - 10, cy, cx + R0 + 10, cy, P.axis, 1.4); B.line(cx, cy - R0 - 10, cx, cy + R0 + 10, P.axis, 1.4); B.circle(cx, cy, R0, P.ink, null, 2);
      ["S", "A", "T", "C"].forEach((L, i) => { const q = [[1, -1], [-1, -1], [-1, 1], [1, 1]][[1, 0, 2, 3][i]]; }); B.text("A", cx + R0 * 0.62, cy - R0 * 0.62, { size: 13, w: 800, color: P.soft, align: "center" }); B.text("S", cx - R0 * 0.62, cy - R0 * 0.62, { size: 13, w: 800, color: P.soft, align: "center" }); B.text("T", cx - R0 * 0.62, cy + R0 * 0.7, { size: 13, w: 800, color: P.soft, align: "center" }); B.text("C", cx + R0 * 0.62, cy + R0 * 0.7, { size: 13, w: 800, color: P.soft, align: "center" });
      B.line(cx, cy, px, py, P.ink, 2.2); B.line(px, py, px, cy, P.red, 2.6); B.line(cx, cy, px, cy, P.green, 2.6); B.angle(cx, cy, 0, -th + (c.th >= 360 ? 0.0001 : 0), 20, P.purple, "");
      B.dot(px, py, P.amber, 7); B.text("θ = " + c.th + "°", cx + 8, cy - R0 - 14, { size: 12, w: 700, color: P.purple });
      const gx0 = cx + R0 + 30, gw = a.x + a.w - gx0 - 6, yk = c.fn === "tan" ? R0 / 3 : R0, Y = (v) => cy - MK.clamp(v, -3.2, 3.2) * yk, X = (d) => gx0 + d / 360 * gw;
      B.line(gx0, cy, gx0 + gw, cy, P.axis, 1.4); for (let d = 0; d <= 360; d += 90) { B.line(X(d), cy - 4, X(d), cy + 4, P.axis, 1.2); B.text(String(d), X(d), cy + 16, { size: 9.5, align: "center", color: P.soft }); }
      const fnv = (d) => (c.fn === "sin" ? Math.sin(R(d)) : c.fn === "cos" ? Math.cos(R(d)) : Math.tan(R(d)));
      g.save(); g.strokeStyle = P.faint; g.lineWidth = 1.4; g.beginPath(); let pen = false; for (let d = 0; d <= 360; d += 2) { const v = fnv(d); if (Math.abs(v) > 3.2) { pen = false; continue; } pen ? g.lineTo(X(d), Y(v)) : g.moveTo(X(d), Y(v)); pen = true; } g.stroke(); g.restore();
      g.save(); g.strokeStyle = c.fn === "cos" ? P.green : P.red; g.lineWidth = 2.8; g.beginPath(); pen = false; for (let d = 0; d <= c.th; d += 1) { const v = fnv(d); if (Math.abs(v) > 3.2) { pen = false; continue; } pen ? g.lineTo(X(d), Y(v)) : g.moveTo(X(d), Y(v)); pen = true; } g.stroke(); g.restore();
      const v = fnv(c.th); if (Math.abs(v) <= 3.2) { B.dot(X(c.th), Y(v), P.amber, 5); if (c.fn === "sin") B.line(px, py, X(c.th), Y(v), P.amber, 1, [3, 3]); }
      B.text("y = " + c.fn + " θ", gx0 + 4, a.y + 40, { size: 12, w: 700, color: c.fn === "cos" ? P.green : P.red });
    },
    pointer: MK.dragger((s, c) => (c.mode === "circle" && s.g ? [[s.g.cx + Math.cos(R(c.th)) * s.g.R0, s.g.cy - Math.sin(R(c.th)) * s.g.R0]] : []), (i, p, s, c) => { c.th = Math.round((D(Math.atan2(-(p.y - s.g.cy), p.x - s.g.cx)) + 360) % 360); }, 24),
    syncAll: true,
    hud(s, c) {
      if (c.mode === "tri") { const h = Math.hypot(c.opp, c.adj); return [{ title: "SOH CAH TOA", lines: [`sin θ = opp/hyp = ${c.opp}/${f(h, 3)} = ${f(c.opp / h, 4)}`, `cos θ = adj/hyp = ${c.adj}/${f(h, 3)} = ${f(c.adj / h, 4)}`, `tan θ = opp/adj = ${c.opp}/${c.adj} = ${f(c.opp / c.adj, 4)}`, [`θ = ${f(D(Math.atan2(c.opp, c.adj)), 2)}°`, null, true]] }]; }
      if (c.mode === "graph") { const Rr = Math.hypot(c.a, c.b); return [{ title: "Graph", lines: [`y = ${c.a} sin x + ${c.b} cos x`, `max = ${f(Rr, 3)}, min = −${f(Rr, 3)}`, `solutions of y = ${c.k}: ${MK.roots((x) => c.a * Math.sin(R(x)) + c.b * Math.cos(R(x)) - c.k, 0, 360, 720).map((r) => f(r, 1) + "°").join(", ") || "none"}`] }]; }
      const th = c.th, q = th % 360 < 90 ? "1st: all +" : th < 180 ? "2nd: sin +" : th < 270 ? "3rd: tan +" : "4th: cos +", ex = EXACT[th % 360] || null, ref = th <= 90 ? th : th <= 180 ? 180 - th : th <= 270 ? th - 180 : 360 - th;
      return [{ title: "Ratios at θ = " + th + "°", lines: [`sin θ = ${f(Math.sin(R(th)), 4)}${ex ? " = " + ex[0] : ""}`, `cos θ = ${f(Math.cos(R(th)), 4)}${ex ? " = " + ex[1] : ""}`, `tan θ = ${Math.abs(Math.cos(R(th))) < 1e-9 ? "undefined" : f(Math.tan(R(th)), 4)}`, "—", `quadrant ${q}`, `reference (acute) angle ${ref}°`] }]; },
    readouts(s, c) { if (c.mode === "tri") { const h = Math.hypot(c.opp, c.adj); return [["sin θ", f(c.opp / h, 4)], ["cos θ", f(c.adj / h, 4)], ["tan θ", f(c.opp / c.adj, 4)]]; } return [["sin " + c.th + "°", f(Math.sin(R(c.th)), 4)], ["cos " + c.th + "°", f(Math.cos(R(c.th)), 4)], ["tan " + c.th + "°", Math.abs(Math.cos(R(c.th))) < 1e-9 ? "undefined" : f(Math.tan(R(c.th)), 4)]]; },
    table() { return T(["θ", "0°", "30°", "45°", "60°", "90°"], [["sin θ", "0", "1/2", "√2/2", "√3/2", "1"], ["cos θ", "1", "√3/2", "√2/2", "1/2", "0"], ["tan θ", "0", "√3/3", "1", "√3", "—"]]); },
    steps(s, c) { if (c.mode === "tri") return ["Label the sides relative to θ: opposite, adjacent, hypotenuse.", "Choose the ratio that links the known and unknown sides (SOH CAH TOA).", `θ = tan⁻¹(${c.opp}/${c.adj}) = ${f(D(Math.atan2(c.opp, c.adj)), 2)}°`];
      const th = c.th, ref = th <= 90 ? th : th <= 180 ? 180 - th : th <= 270 ? th - 180 : 360 - th; return [`Find the reference angle: ${ref}°`, `Use CAST to fix the sign in the quadrant of ${th}°`, `sin ${th}° = ${th > 180 && th < 360 ? "−" : ""}sin ${ref}° = ${f(Math.sin(R(th)), 4)}`]; },
    note: "Sine, cosine and tangent of acute angles; exact ratios of 30°, 45°, 60° without tables; ratios for 0°–360° related to the unit circle; graphs of sine and cosine, e.g. y = a sin x + b cos x and graphical solutions.",
    mistake: "Giving a positive value for sin 210°. Use CAST: only tan is positive in the third quadrant.",
  });

  /* ---------------- F-b Angles of elevation & depression (2D) ---------------- */
  MK.def("F-b", {
    title: "Elevation & depression", env: "paper",
    values: { mode: "elev", h: 30, d: 40, eye: 1.6, a1: 30, a2: 45, gap: 20 },
    controls: [{ type: "tabs", key: "mode", label: "Problem", options: [["elev", "Angle of elevation"], ["dep", "Angle of depression"], ["two", "Two positions (find the height)"]] }, { key: "h", label: "Height of tower / cliff", min: 2, max: 120, unit: "m", show: W("mode", "elev", "dep") }, { key: "d", label: "Horizontal distance", min: 2, max: 150, unit: "m", show: W("mode", "elev", "dep") }, { key: "eye", label: "Observer eye height", min: 0, max: 2, step: 0.1, unit: "m", show: W("mode", "elev") },
      { key: "a1", label: "Angle from far point A", min: 5, max: 80, unit: "°", show: W("mode", "two") }, { key: "a2", label: "Angle from near point B", min: 6, max: 85, unit: "°", show: W("mode", "two") }, { key: "gap", label: "Distance AB", min: 2, max: 100, unit: "m", show: W("mode", "two") }],
    two(c) { const t1 = Math.tan(R(c.a1)), t2 = Math.tan(R(c.a2)); if (t2 <= t1) return null; const x = c.gap * t1 / (t2 - t1); return { x, h: x * t2 }; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area, gy = a.y + a.h - 40;
      g.save(); const gr = g.createLinearGradient(0, gy, 0, a.y + a.h); gr.addColorStop(0, MK.isNight() ? "#1f3b2a" : "#7fb069"); gr.addColorStop(1, MK.isNight() ? "#10201a" : "#4f7d36"); g.fillStyle = gr; g.fillRect(a.x - 14, gy, a.w + 28, a.y + a.h - gy + 14); g.restore();
      const person = (x, y, k = 1) => { B.circle(x, y - 34 * k, 6 * k, null, P.ink); B.line(x, y - 28 * k, x, y - 12 * k, P.ink, 3 * k); B.line(x, y - 12 * k, x - 6 * k, y, P.ink, 3 * k); B.line(x, y - 12 * k, x + 6 * k, y, P.ink, 3 * k); B.line(x - 7 * k, y - 23 * k, x + 7 * k, y - 23 * k, P.ink, 3 * k); };
      const tower = (x, top, w = 26) => { g.save(); const gr2 = g.createLinearGradient(x, 0, x + w, 0); gr2.addColorStop(0, "#9aa3ad"); gr2.addColorStop(0.5, "#d1d5db"); gr2.addColorStop(1, "#7b8490"); g.fillStyle = gr2; g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = 8; g.fillRect(x, top, w, gy - top); g.restore(); for (let y = top + 8; y < gy - 10; y += 16) { g.save(); g.fillStyle = "rgba(255,230,150,.75)"; g.fillRect(x + 6, y, 5, 7); g.fillRect(x + w - 11, y, 5, 7); g.restore(); } };
      if (c.mode === "two") { const r = this.two(c); if (!r) { B.text("The nearer angle must be larger than the farther angle", a.x + 10, a.y + 60, { color: P.red, w: 700 }); return; }
        const span = c.gap + r.x, k = Math.min((a.w - 70) / span, (gy - a.y - 60) / r.h), tx = a.x + 30 + span * k, top = gy - r.h * k, Ax = a.x + 30, Bx = Ax + c.gap * k; tower(tx, top, 22);
        person(Ax, gy, 0.6); person(Bx, gy, 0.6); B.line(Ax, gy, tx + 11, top, P.red, 1.8, [6, 4]); B.line(Bx, gy, tx + 11, top, P.blue, 1.8, [6, 4]);
        B.angle(Ax, gy, 0, Math.atan2(top - gy, tx + 11 - Ax), 34, P.red, c.a1 + "°"); B.angle(Bx, gy, 0, Math.atan2(top - gy, tx + 11 - Bx), 30, P.blue, c.a2 + "°");
        B.dim(Ax, gy + 2, Bx, gy + 2, c.gap + " m", P.ink, 18); B.dim(Bx, gy + 2, tx + 11, gy + 2, "x = " + f(r.x, 2), P.soft, 18); B.dim(tx + 24, gy, tx + 24, top, "h = " + f(r.h, 2) + " m", P.green, -22); B.text("A", Ax - 4, gy + 38, { w: 800 }); B.text("B", Bx - 4, gy + 38, { w: 800 }); return; }
      const k = Math.min((a.w - 90) / c.d, (gy - a.y - 70) / (c.h + 2)), ox = a.x + 40, tx = ox + c.d * k;
      if (c.mode === "elev") { tower(tx, gy - c.h * k); person(ox, gy, 0.9); const ey = gy - c.eye * k - 2; B.line(ox, ey, tx + 13, gy - c.h * k, P.red, 2.2, [6, 4]); B.line(ox, ey, tx + 13, ey, P.soft, 1.2, [3, 3]); B.angle(ox, ey, 0, Math.atan2(gy - c.h * k - ey, tx + 13 - ox), 40, P.red, f(D(Math.atan((c.h - c.eye) / c.d)), 1) + "°"); B.dim(ox, gy + 2, tx + 13, gy + 2, c.d + " m", P.ink, 18); B.dim(tx + 30, gy, tx + 30, gy - c.h * k, c.h + " m", P.green, -16); }
      else { const top = gy - c.h * k; g.save(); g.fillStyle = MK.isNight() ? "#5b5246" : "#a8957a"; g.beginPath(); g.moveTo(ox - 30, gy); g.lineTo(ox - 30, top); g.lineTo(ox + 10, top); g.lineTo(ox + 26, gy); g.closePath(); g.fill(); g.restore(); person(ox, top, 0.8);
        const bx = tx; g.save(); g.fillStyle = P.red; g.beginPath(); g.moveTo(bx - 18, gy - 8); g.lineTo(bx + 18, gy - 8); g.lineTo(bx + 12, gy); g.lineTo(bx - 12, gy); g.closePath(); g.fill(); g.restore(); B.line(bx, gy - 8, bx, gy - 24, P.ink, 1.6);
        const ey = top - 30; B.line(ox, ey, bx, gy - 6, P.red, 2.2, [6, 4]); B.line(ox, ey, ox + 140, ey, P.soft, 1.2, [3, 3]); B.angle(ox, ey, 0, Math.atan2(gy - 6 - ey, bx - ox), 44, P.red, f(D(Math.atan(c.h / c.d)), 1) + "°"); B.dim(ox, gy + 2, bx, gy + 2, c.d + " m", P.ink, 18); B.text("horizontal", ox + 90, ey - 6, { size: 10, color: P.soft }); }
    },
    hud(s, c) { if (c.mode === "two") { const r = this.two(c); return [{ title: "Two angles", lines: ["h = x tan β = (x + d) tan α", "x = d tan α / (tan β − tan α)", r ? `x = ${f(r.x, 3)} m` : "", r ? [`h = ${f(r.h, 3)} m`, null, true] : ["no solution", "#ff7b72"]] }]; }
      if (c.mode === "elev") { const ang = D(Math.atan((c.h - c.eye) / c.d)); return [{ title: "Elevation", lines: ["tan θ = opposite / adjacent", `= (${c.h} − ${c.eye}) / ${c.d}`, [`θ = ${f(ang, 2)}°`, null, true], "Measured UP from the horizontal"] }]; }
      return [{ title: "Depression", lines: ["tan θ = height / distance", `= ${c.h} / ${c.d}`, [`θ = ${f(D(Math.atan(c.h / c.d)), 2)}°`, null, true], "Measured DOWN from the horizontal", "= angle of elevation from the boat (alternate angles)"] }]; },
    readouts(s, c) { if (c.mode === "two") { const r = this.two(c); return r ? [["Height", f(r.h, 3) + " m"], ["Distance from B to foot", f(r.x, 3) + " m"]] : [["Height", "—"]]; } const ang = c.mode === "elev" ? D(Math.atan((c.h - c.eye) / c.d)) : D(Math.atan(c.h / c.d)); return [["Angle", f(ang, 2) + "°"], ["Line of sight", f(Math.hypot(c.d, c.h - (c.mode === "elev" ? c.eye : 0)), 2) + " m"]]; },
    steps(s, c) { if (c.mode === "two") { const r = this.two(c); return ["Let the foot of the tower be F and BF = x.", `From B: h = x tan ${c.a2}°. From A: h = (x + ${c.gap}) tan ${c.a1}°.`, `Equate: x(tan ${c.a2}° − tan ${c.a1}°) = ${c.gap} tan ${c.a1}°`, r ? `x = ${f(r.x, 3)} m, h = ${f(r.h, 3)} m` : "No solution"]; } return ["Draw the horizontal through the observer's eye.", "Mark the angle between the horizontal and the line of sight.", "Use tan = opposite/adjacent in the right-angled triangle."]; },
    note: "Calculate angles of elevation and depression and apply them to heights and distances (simple problems). The angle of depression from A to B equals the angle of elevation from B to A. A photoreal 3D version is below.",
    mistake: "Measuring the angle of depression from the vertical instead of from the horizontal.",
  });

  /* ---------------- F-c Bearings (2D) ---------------- */
  MK.def("F-c", {
    title: "Bearings", env: "paper",
    values: { b1: 60, d1: 8, b2: 150, d2: 6 },
    controls: [{ key: "b1", label: "Leg 1 bearing", min: 0, max: 359, unit: "°" }, { key: "d1", label: "Leg 1 distance", min: 1, max: 20, step: 0.5, unit: "km" }, { key: "b2", label: "Leg 2 bearing", min: 0, max: 359, unit: "°" }, { key: "d2", label: "Leg 2 distance", min: 0, max: 20, step: 0.5, unit: "km" }],
    calc(c) { const p1 = [c.d1 * Math.sin(R(c.b1)), c.d1 * Math.cos(R(c.b1))], p2 = [p1[0] + c.d2 * Math.sin(R(c.b2)), p1[1] + c.d2 * Math.cos(R(c.b2))], dist = Math.hypot(p2[0], p2[1]), brg = (D(Math.atan2(p2[0], p2[1])) + 360) % 360; let inc = 180 - Math.abs(((c.b2 - c.b1 + 540) % 360) - 180); return { p1, p2, dist, brg, back: (brg + 180) % 360, inc: 180 - inc }; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area, r = this.calc(c), F = MK.fit([[0, 0], r.p1, r.p2, [0, 3], [r.p1[0], r.p1[1] + 3]], a, 46), O = F.map([0, 0]), A = F.map(r.p1), Bq = F.map(r.p2);
      const north = (p) => { B.arrow(p[0], p[1] + 10, p[0], p[1] - 58, P.soft, 1.6, 9); B.text("N", p[0] - 4, p[1] - 62, { size: 11, w: 800, color: P.soft }); };
      // compass rose at O
      g.save(); g.translate(O[0], O[1]); for (let i = 0; i < 16; i++) { const t = i * TAU / 16, L = i % 4 === 0 ? 30 : i % 2 === 0 ? 20 : 12; g.strokeStyle = P.faint; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(t) * L, -Math.cos(t) * L); g.stroke(); } g.restore();
      north(O); north(A); B.line(...O, ...A, P.blue, 2.8); B.line(...A, ...Bq, P.green, 2.8); B.line(...O, ...Bq, P.red, 2.2, [7, 5]);
      const arcN = (p, brg, col, r0) => { B.arc(p[0], p[1], r0, -Math.PI / 2, -Math.PI / 2 + R(brg), col, 2.2); B.text(b3(brg), p[0] + Math.sin(R(brg / 2)) * (r0 + 14), p[1] - Math.cos(R(brg / 2)) * (r0 + 14) + 4, { align: "center", size: 11, w: 800, color: col }); };
      arcN(O, c.b1, P.blue, 28); arcN(A, c.b2, P.green, 24); arcN(O, r.brg, P.red, 56);
      B.dot(...O, P.ink, 5, "O", { dx: -16, dy: 16 }); B.dot(...A, P.blue, 5, "A"); B.dot(...Bq, P.green, 6, "B");
      B.text(c.d1 + " km", (O[0] + A[0]) / 2 - 10, (O[1] + A[1]) / 2 - 8, { size: 11, w: 700, color: P.blue, align: "right" }); B.text(c.d2 + " km", (A[0] + Bq[0]) / 2 + 8, (A[1] + Bq[1]) / 2, { size: 11, w: 700, color: P.green });
    },
    hud(s, c) { const r = this.calc(c); return [{ title: "Bearing of B from O", lines: ["angle at A = 180° − |change of bearing|", `∠OAB = ${f(r.inc, 1)}°`, "OB² = OA² + AB² − 2·OA·AB cos A", `OB = ${f(r.dist, 3)} km`, [`bearing ${b3(r.brg)} (${compass(r.brg)})`, null, true], `back bearing of O from B: ${b3(r.back)}`] }]; },
    readouts(s, c) { const r = this.calc(c); return [["Distance OB", f(r.dist, 3) + " km"], ["Bearing of B from O", b3(r.brg)], ["Compass form", compass(r.brg)], ["Bearing of O from B", b3(r.back)]]; },
    steps(s, c) { const r = this.calc(c); return [`Draw a north line at O and at A. Leg 1: ${b3(c.b1)} for ${c.d1} km; leg 2: ${b3(c.b2)} for ${c.d2} km.`, `Angle at A between the legs = ${f(r.inc, 1)}° (use co-interior angles on the north lines).`, `Cosine rule: OB² = ${c.d1}² + ${c.d2}² − 2(${c.d1})(${c.d2})cos ${f(r.inc, 1)}° ⇒ OB = ${f(r.dist, 3)} km`, `Sine rule gives ∠AOB = ${f(Math.abs(((r.brg - c.b1 + 540) % 360) - 180), 2)}°, so the bearing is ${b3(r.brg)}.`, `Back bearing = bearing ± 180° = ${b3(r.back)}.`]; },
    note: "Bearing of one point from another; calculation of distances and angles. Notation e.g. 035°, N35°E. Use of a diagram is required; sine and cosine rules may be used. Try the 3D sea version below.",
    mistake: "Measuring bearings anticlockwise or from the east. Bearings are clockwise from north and written with three figures.",
  });

  /* ---------------- G-i Differentiation ---------------- */
  MK.def("G-i", {
    title: "Differentiation", env: "graph",
    values: { mode: "tangent", a3: 0, a2: 1, a1: -2, a0: -3, x0: 2, h: 1.5, sA: 2, sB: -9, sC: 12, sD: 0 },
    controls: [{ type: "tabs", key: "mode", label: "Idea", options: [["first", "From first principles"], ["tangent", "Gradient function"], ["turn", "Maximum & minimum"], ["kin", "Rates: s → v → a"]] },
      { key: "a3", label: "a (x³)", min: -2, max: 2, step: 0.5, show: (c) => c.mode !== "kin" }, { key: "a2", label: "b (x²)", min: -4, max: 4, step: 0.5, show: (c) => c.mode !== "kin" }, { key: "a1", label: "c (x)", min: -8, max: 8, step: 0.5, show: (c) => c.mode !== "kin" }, { key: "a0", label: "d", min: -10, max: 10, step: 0.5, show: (c) => c.mode !== "kin" },
      { key: "x0", label: "Point x₀", min: -4, max: 4, step: 0.1, show: (c) => c.mode === "first" || c.mode === "tangent" }, { key: "h", label: "h (secant width)", min: 0.01, max: 3, step: 0.01, show: W("mode", "first") },
      { key: "sA", label: "s = At³ + Bt² + Ct + D:  A", min: -2, max: 3, step: 0.5, show: W("mode", "kin") }, { key: "sB", label: "B", min: -12, max: 12, step: 0.5, show: W("mode", "kin") }, { key: "sC", label: "C", min: -20, max: 20, step: 0.5, show: W("mode", "kin") }, { key: "sD", label: "D", min: -10, max: 10, step: 0.5, show: W("mode", "kin") }],
    state: () => ({ t: 0 }),
    tick(dt, s, c) { if (c.mode !== "kin") return true; s.t = (s.t + dt * 0.8) % 5; return true; },
    hint: "Drag the gold point",
    coef(c) { return [c.a0, c.a1, c.a2, c.a3]; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area, Pn = MK.poly;
      if (c.mode === "kin") { const sc = [c.sD, c.sC, c.sB, c.sA], vc = Pn.d(sc), ac = Pn.d(vc), t = s.t, top = { x: a.x, y: a.y + 30, w: a.w, h: 60 }, track = a.y + 70;
        const ss = Pn.ev(sc, t), xs = []; for (let k = 0; k <= 50; k++) xs.push(Pn.ev(sc, k / 10)); const lo = Math.min(...xs, 0), hi = Math.max(...xs, 1), X = (v) => a.x + 20 + (v - lo) / (hi - lo) * (a.w - 40);
        B.line(a.x + 10, track, a.x + a.w - 10, track, P.ink, 2); for (let v = Math.ceil(lo / 5) * 5; v <= hi; v += 5) { B.line(X(v), track - 5, X(v), track + 5, P.ink, 1); B.text(f(v), X(v), track + 17, { size: 9, align: "center", color: P.soft }); }
        B.circle(X(ss), track, 9, null, P.red); const vv = Pn.ev(vc, t); B.arrow(X(ss), track - 16, X(ss) + MK.clamp(vv, -40, 40) * 2, track - 16, P.blue, 2.4, 8); B.text("v", X(ss) + MK.clamp(vv, -40, 40) * 2 + 6, track - 20, { size: 10, w: 700, color: P.blue });
        const m = B.axes({ rect: { x: a.x, y: a.y + 100, w: a.w, h: a.h - 100 }, xmin: 0, xmax: 5, ymin: Math.min(-5, ...[0, 1, 2, 3, 4, 5].map((q) => Math.min(Pn.ev(sc, q), Pn.ev(vc, q), Pn.ev(ac, q)))), ymax: Math.max(5, ...[0, 1, 2, 3, 4, 5].map((q) => Math.max(Pn.ev(sc, q), Pn.ev(vc, q), Pn.ev(ac, q)))), xl: "t (s)" });
        B.plot(m, (x) => Pn.ev(sc, x), P.red, 2.4); B.plot(m, (x) => Pn.ev(vc, x), P.blue, 2.4); B.plot(m, (x) => Pn.ev(ac, x), P.green, 2.2); B.line(m.X(t), m.r.y, m.X(t), m.r.y + m.r.h, P.amber, 1.4, [4, 3]); B.legend([["s (m)", P.red], ["v = ds/dt", P.blue], ["a = dv/dt", P.green]], m.r.x + 30, m.r.y + m.r.h - 8); return; }
      const cf = this.coef(c), fn = (x) => Pn.ev(cf, x), d1 = Pn.d(cf), dfn = (x) => Pn.ev(d1, x);
      const ys = []; for (let x = -5; x <= 5; x += 0.25) ys.push(fn(x)); const lo = Math.max(-40, Math.min(...ys) - 1), hi = Math.min(40, Math.max(...ys) + 1);
      const m = B.axes({ xmin: -5, xmax: 5, ymin: lo, ymax: hi }); s.m = m; B.plot(m, fn, P.blue, 2.8);
      if (c.mode === "tangent" || c.mode === "turn") B.plot(m, dfn, P.purple, 1.8, { dash: [6, 4] });
      if (c.mode === "first") { const x0 = c.x0, x1 = x0 + c.h, y0 = fn(x0), y1 = fn(x1), msec = (y1 - y0) / c.h; B.plot(m, (x) => y0 + msec * (x - x0), P.red, 2, {}); B.plot(m, (x) => y0 + dfn(x0) * (x - x0), P.amber, 1.6, { dash: [5, 4] }); B.dot(m.X(x1), m.Y(y1), P.red, 6, "x₀ + h"); B.dot(m.X(x0), m.Y(y0), P.amber, 7, "x₀"); B.poly([[m.X(x0), m.Y(y0)], [m.X(x1), m.Y(y0)], [m.X(x1), m.Y(y1)]], P.red, P.fillR, 1, true, [3, 3]); }
      if (c.mode === "tangent") { const x0 = c.x0, y0 = fn(x0), gr = dfn(x0); B.plot(m, (x) => y0 + gr * (x - x0), P.amber, 2.4, { from: x0 - 2, to: x0 + 2 }); B.dot(m.X(x0), m.Y(y0), P.amber, 7); B.dot(m.X(x0), m.Y(gr), P.purple, 5, "dy/dx = " + f(gr, 3), { dy: 16 }); B.line(m.X(x0), m.Y(y0), m.X(x0), m.Y(gr), P.purple, 1, [3, 3]); }
      if (c.mode === "turn") MK.roots(dfn, -5, 5).forEach((x) => { const d2 = Pn.ev(Pn.d(d1), x); B.dot(m.X(x), m.Y(fn(x)), d2 > 0 ? P.green : d2 < 0 ? P.red : P.amber, 7, (d2 > 0 ? "min" : d2 < 0 ? "max" : "inflexion") + ` (${f(x, 2)}, ${f(fn(x), 2)})`, { dy: d2 > 0 ? 20 : -10 }); });
      B.legend([["y = f(x)", P.blue], ["dy/dx", P.purple]], m.r.x + m.r.w - 150, m.r.y + m.r.h - 8);
    },
    pointer: MK.dragger((s, c) => (s.m && (c.mode === "tangent" || c.mode === "first") ? [[s.m.X(c.x0), s.m.Y(MK.poly.ev([c.a0, c.a1, c.a2, c.a3], c.x0))]] : []), (i, p, s, c) => { c.x0 = MK.clamp(MK.round(s.m.ix(p.x), 1), -4, 4); }, 22), syncAll: true,
    hud(s, c) { const Pn = MK.poly;
      if (c.mode === "kin") { const sc = [c.sD, c.sC, c.sB, c.sA], vc = Pn.d(sc), ac = Pn.d(vc), t = s.t; return [{ title: "Rates of change", lines: [`s = ${Pn.str(sc, "t")}`, `v = ds/dt = ${Pn.str(vc, "t")}`, `a = dv/dt = ${Pn.str(ac, "t")}`, "—", `t = ${f(t, 2)} s: s = ${f(Pn.ev(sc, t), 2)} m`, `v = ${f(Pn.ev(vc, t), 2)} m/s, a = ${f(Pn.ev(ac, t), 2)} m/s²`] }, { title: "Units", lines: ["s in m, v in m/s, a in m/s²"] }]; }
      const cf = this.coef(c), d1 = Pn.d(cf), L = [`y = ${Pn.str(cf)}`, `dy/dx = ${Pn.str(d1)}`, "rule: d/dx(axⁿ) = naxⁿ⁻¹"];
      if (c.mode === "first") { const fx = (x) => Pn.ev(cf, x), msec = (fx(c.x0 + c.h) - fx(c.x0)) / c.h; L.push("—", "f′(x) = lim [f(x+h) − f(x)]/h as h → 0", `h = ${c.h}: secant gradient ${f(msec, 4)}`, [`limit = ${f(Pn.ev(d1, c.x0), 4)}`, null, true]); }
      if (c.mode === "tangent") L.push("—", [`gradient at x = ${c.x0}: ${f(Pn.ev(d1, c.x0), 4)}`, null, true]);
      if (c.mode === "turn") { const r = MK.roots((x) => Pn.ev(d1, x), -5, 5); L.push("—", "turning points where dy/dx = 0", r.length ? r.map((x) => `x = ${f(x, 3)}: d²y/dx² = ${f(Pn.ev(Pn.d(d1), x), 2)}`).join("; ") : "none in view", "d²y/dx² > 0 min, < 0 max"); }
      return [{ title: "Derivative", lines: L }]; },
    readouts(s, c) { const Pn = MK.poly; if (c.mode === "kin") { const sc = [c.sD, c.sC, c.sB, c.sA], vc = Pn.d(sc); return [["t", f(s.t, 2) + " s"], ["Displacement", f(Pn.ev(sc, s.t), 2) + " m"], ["Velocity", f(Pn.ev(vc, s.t), 2) + " m/s"], ["Momentarily at rest at t =", MK.roots((x) => Pn.ev(vc, x), 0, 5).map((r) => f(r, 2)).join(", ") || "—"]]; }
      const cf = this.coef(c), d1 = Pn.d(cf); return [["f(x₀)", f(Pn.ev(cf, c.x0), 3)], ["f′(x₀)", f(Pn.ev(d1, c.x0), 4)], ["Stationary x", MK.roots((x) => Pn.ev(d1, x), -5, 5).map((r) => f(r, 2)).join(", ") || "none"]]; },
    table(s, c) { if (c.mode !== "first") return ""; const Pn = MK.poly, cf = this.coef(c), fx = (x) => Pn.ev(cf, x); const hs = [1, 0.5, 0.1, 0.01, 0.001]; return T(["h", ...hs], [["[f(x₀+h) − f(x₀)]/h", ...hs.map((h) => f((fx(c.x0 + h) - fx(c.x0)) / h, 5))]]); },
    steps(s, c) { const Pn = MK.poly; if (c.mode === "kin") { const sc = [c.sD, c.sC, c.sB, c.sA]; return [`s = ${Pn.str(sc, "t")}`, `Differentiate term by term: v = ${Pn.str(Pn.d(sc), "t")}`, `Differentiate again: a = ${Pn.str(Pn.d(Pn.d(sc)), "t")}`, "Set v = 0 to find when the particle is momentarily at rest."]; }
      const cf = this.coef(c), d1 = Pn.d(cf); if (c.mode === "first") return [`f(x + h) − f(x) for f(x) = ${Pn.str(cf)}`, "Divide by h and simplify (every term keeps a factor of h except the gradient terms).", `Let h → 0: f′(x) = ${Pn.str(d1)}`, `At x = ${c.x0}: f′ = ${f(Pn.ev(d1, c.x0), 4)}`];
      if (c.mode === "turn") return [`dy/dx = ${Pn.str(d1)}`, "Set dy/dx = 0 and solve for x.", `d²y/dx² = ${Pn.str(Pn.d(d1))}; its sign classifies each point.`]; return [`Bring down the power and reduce it by one for each term.`, `dy/dx = ${Pn.str(d1)}`, `Substitute x = ${c.x0}: ${f(Pn.ev(d1, c.x0), 4)}`]; },
    note: "Concept of the derived function dy/dx; the gradient of a curve at a point equals the differential coefficient there. Standard derivatives, e.g. y = x² ⇒ dy/dx = 2x; s = 2t³ + 4 ⇒ v = 6t². Applications: maximum and minimum values, rates of change.",
    mistake: "Forgetting that the derivative of a constant is 0, or not reducing the power: d/dx(x³) = 3x², not 3x³.",
  });

  /* ---------------- G-ii Integration ---------------- */
  MK.def("G-ii", {
    title: "Integration", env: "graph",
    values: { a3: 0, a2: 1, a1: 0, a0: 1, lo: 0, hi: 3, n: 6, kind: "mid" },
    controls: [{ key: "a3", label: "a (x³)", min: -1, max: 1, step: 0.25 }, { key: "a2", label: "b (x²)", min: -3, max: 3, step: 0.25 }, { key: "a1", label: "c (x)", min: -6, max: 6, step: 0.5 }, { key: "a0", label: "d", min: -6, max: 6, step: 0.5 }, { key: "lo", label: "Lower limit a", min: -4, max: 4, step: 0.5 }, { key: "hi", label: "Upper limit b", min: -4, max: 5, step: 0.5 }, { key: "n", label: "Strips n", min: 1, max: 60 }, { type: "select", key: "kind", label: "Strips", options: [["mid", "Rectangles (midpoint)"], ["trap", "Trapezia"]] }],
    coef(c) { return [c.a0, c.a1, c.a2, c.a3]; },
    anti(cf) { return [0, ...cf.map((v, i) => v / (i + 1))]; },
    draw(g, s, c, B) {
      const P = B.P, Pn = MK.poly, cf = this.coef(c), fn = (x) => Pn.ev(cf, x), a = Math.min(c.lo, c.hi), b = Math.max(c.lo, c.hi);
      const ys = []; for (let x = -5; x <= 5.5; x += 0.25) ys.push(fn(x)); const m = B.axes({ xmin: -5, xmax: 5.5, ymin: Math.max(-30, Math.min(-1, ...ys) - 1), ymax: Math.min(40, Math.max(1, ...ys) + 1) });
      B.shade(m, fn, a, b, MK.isNight() ? "rgba(91,214,140,.22)" : "rgba(21,128,61,.2)");
      const w = (b - a) / c.n; for (let i = 0; i < c.n; i++) { const x0 = a + i * w, x1 = x0 + w; if (c.kind === "mid") { const y = fn((x0 + x1) / 2); B.poly([[m.X(x0), m.Y(0)], [m.X(x0), m.Y(y)], [m.X(x1), m.Y(y)], [m.X(x1), m.Y(0)]], P.blue, y >= 0 ? P.fillB : P.fillR, 1); } else B.poly([[m.X(x0), m.Y(0)], [m.X(x0), m.Y(fn(x0))], [m.X(x1), m.Y(fn(x1))], [m.X(x1), m.Y(0)]], P.blue, P.fillB, 1); }
      B.plot(m, fn, P.ink, 2.6); B.line(m.X(a), m.r.y, m.X(a), m.r.y + m.r.h, P.red, 1.2, [4, 3]); B.line(m.X(b), m.r.y, m.X(b), m.r.y + m.r.h, P.red, 1.2, [4, 3]); B.text("a = " + a, m.X(a) + 4, m.r.y + m.r.h - 24, { size: 10.5, color: P.red, w: 700 }); B.text("b = " + b, m.X(b) + 4, m.r.y + m.r.h - 24, { size: 10.5, color: P.red, w: 700 });
    },
    vals(c) { const Pn = MK.poly, cf = this.coef(c), F = this.anti(cf), a = Math.min(c.lo, c.hi), b = Math.max(c.lo, c.hi), exact = Pn.ev(F, b) - Pn.ev(F, a), fn = (x) => Pn.ev(cf, x), w = (b - a) / c.n; let approx = 0; for (let i = 0; i < c.n; i++) { const x0 = a + i * w; approx += c.kind === "mid" ? fn(x0 + w / 2) * w : (fn(x0) + fn(x0 + w)) / 2 * w; } return { F, a, b, exact, approx }; },
    hud(s, c) { const Pn = MK.poly, v = this.vals(c), cf = this.coef(c); return [{ title: "Definite integral", lines: [`∫ (${Pn.str(cf)}) dx = ${Pn.str(v.F)} + C`, `[F(x)] from ${v.a} to ${v.b}`, `= ${f(Pn.ev(v.F, v.b), 4)} − (${f(Pn.ev(v.F, v.a), 4)})`, [`= ${f(v.exact, 4)}`, null, true], "—", `${c.n} ${c.kind === "mid" ? "rectangles" : "trapezia"} ≈ ${f(v.approx, 4)}`, `error ${f(Math.abs(v.approx - v.exact), 5)}`] }, { title: "Rule", lines: ["∫ xⁿ dx = xⁿ⁺¹/(n + 1) + C, n ≠ −1"] }]; },
    readouts(s, c) { const v = this.vals(c); return [["Exact value", f(v.exact, 5)], ["Strip estimate", f(v.approx, 5)], ["Error", f(Math.abs(v.approx - v.exact), 6)]]; },
    steps(s, c) { const Pn = MK.poly, v = this.vals(c), cf = this.coef(c); return [`Integrate term by term (raise each power by 1, divide by the new power): F(x) = ${Pn.str(v.F)}`, `Evaluate F(${v.b}) = ${f(Pn.ev(v.F, v.b), 4)}`, `Evaluate F(${v.a}) = ${f(Pn.ev(v.F, v.a), 4)}`, `Subtract: ${f(v.exact, 4)} (the constant C cancels)`, "Area below the x-axis comes out negative — take the modulus for a physical area."]; },
    note: "Meaning of integration as the reverse of differentiation and as the area under a curve; evaluation of simple definite algebraic integrals.",
    mistake: "Adding +C to a definite integral, or forgetting to subtract F(a).",
  });
})();
