/* m-geometry.js — WAEC Core Mathematics: Mensuration (2D parts of C), Plane Geometry (D) and Coordinate Geometry (E). */
(function () {
  "use strict";
  const MK = window.MK, f = MK.fmt, T = MK.table, W = MK.when, R = MK.rad, D = MK.deg, TAU = MK.TAU;
  const snap = (v, k = 0.5) => Math.round(v / k) * k;
  /* fit a set of points (model units) into a rect, y up; returns {map:(p)=>[x,y], k} */
  function fit(pts, r, pad = 30) { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const k = Math.min((r.w - 2 * pad) / Math.max(1e-6, x1 - x0), (r.h - 2 * pad) / Math.max(1e-6, y1 - y0)); const ox = r.x + (r.w - (x1 - x0) * k) / 2, oy = r.y + (r.h + (y1 - y0) * k) / 2;
    return { k, map: (p) => [ox + (p[0] - x0) * k, oy - (p[1] - y0) * k] }; }
  MK.fit = fit;
  const tri3 = (a, b, c) => { const ax = (c * c - b * b + a * a) / (2 * a), ay = Math.sqrt(Math.max(0, c * c - ax * ax)); return { B: [0, 0], C: [a, 0], A: [ax, ay] }; };   // sides a=BC, b=CA, c=AB
  const ang = (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]);
  const angAt = (V, P, Q) => { let d = Math.abs(ang(V, P) - ang(V, Q)); if (d > Math.PI) d = TAU - d; return D(d); };
  MK.angAt = angAt;
  /* draw angle arc at screen vertex V between screen points P and Q (interior), with label */
  function arcAt(B, V, P, Q, label, color, r = 26) { let a0 = Math.atan2(P[1] - V[1], P[0] - V[0]), a1 = Math.atan2(Q[1] - V[1], Q[0] - V[0]); let d = a1 - a0; while (d <= -Math.PI) d += TAU; while (d > Math.PI) d -= TAU; B.angle(V[0], V[1], a0, a0 + d, r, color, label); }
  MK.arcAt = arcAt;

  /* ---------------- C-a Lengths & perimeters (2D) ---------------- */
  MK.def("C-a", {
    title: "Lengths & perimeters", env: "paper",
    values: { mode: "pyth", find: "hyp", a: 6, b: 8, hc: 13, A: 40, Bang: 65, sa: 9, cb: 7, cc: 10, cang: 50, r: 7, th: 120 },
    controls: [{ type: "tabs", key: "mode", label: "Rule", options: [["pyth", "Pythagoras"], ["sine", "Sine rule"], ["cosine", "Cosine rule"], ["arc", "Arcs, sectors & segments"]] },
      { type: "select", key: "find", label: "Find", options: [["hyp", "hypotenuse c"], ["leg", "a leg b (given c, a)"]], show: W("mode", "pyth") }, { key: "a", label: "a", min: 1, max: 20, step: 0.5, unit: "cm", show: W("mode", "pyth") }, { key: "b", label: "b", min: 1, max: 20, step: 0.5, unit: "cm", show: (c) => c.mode === "pyth" && c.find === "hyp" }, { key: "hc", label: "c (hypotenuse)", min: 2, max: 30, step: 0.5, unit: "cm", show: (c) => c.mode === "pyth" && c.find === "leg" },
      { key: "A", label: "Angle A", min: 10, max: 120, unit: "°", show: W("mode", "sine") }, { key: "Bang", label: "Angle B", min: 10, max: 120, unit: "°", show: W("mode", "sine") }, { key: "sa", label: "Side a (opposite A)", min: 1, max: 20, step: 0.5, unit: "cm", show: W("mode", "sine") },
      { key: "cb", label: "Side b", min: 1, max: 20, step: 0.5, unit: "cm", show: W("mode", "cosine") }, { key: "cc", label: "Side c", min: 1, max: 20, step: 0.5, unit: "cm", show: W("mode", "cosine") }, { key: "cang", label: "Included angle A", min: 5, max: 170, unit: "°", show: W("mode", "cosine") },
      { key: "r", label: "Radius r", min: 1, max: 20, step: 0.5, unit: "cm", show: W("mode", "arc") }, { key: "th", label: "Angle θ", min: 5, max: 355, unit: "°", show: W("mode", "arc") }],
    calc(c) { if (c.mode === "pyth") { if (c.find === "hyp") return { a: c.a, b: c.b, c: Math.hypot(c.a, c.b) }; const b = Math.sqrt(Math.max(0, c.hc * c.hc - c.a * c.a)); return { a: c.a, b, c: c.hc, bad: c.a >= c.hc }; }
      if (c.mode === "sine") { const C = 180 - c.A - c.Bang, k = c.sa / Math.sin(R(c.A)); return { A: c.A, B: c.Bang, C, a: c.sa, b: k * Math.sin(R(c.Bang)), c: k * Math.sin(R(C)), bad: C <= 0 }; }
      if (c.mode === "cosine") { const a = Math.sqrt(c.cb * c.cb + c.cc * c.cc - 2 * c.cb * c.cc * Math.cos(R(c.cang))); return { a, b: c.cb, c: c.cc, A: c.cang }; }
      const l = c.th / 360 * TAU * c.r, ch = 2 * c.r * Math.sin(R(c.th / 2)); return { l, ch, sector: l + 2 * c.r, seg: l + ch }; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area, r = this.calc(c);
      if (c.mode === "arc") { const cx = a.x + a.w / 2, cy = a.y + a.h / 2 + 10, rr = Math.min(a.w, a.h) * 0.36, a0 = -Math.PI / 2, a1 = a0 + R(c.th);
        B.circle(cx, cy, rr, P.faint, null, 1.2, [4, 4]);
        g.save(); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, rr, a0, a1); g.closePath(); g.fillStyle = P.fillB; g.fill(); g.restore();
        const p0 = [cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr], p1 = [cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr];
        g.save(); g.beginPath(); g.arc(cx, cy, rr, a0, a1); g.closePath(); g.fillStyle = P.fillA; g.fill(); g.restore();
        B.arc(cx, cy, rr, a0, a1, P.red, 4); B.line(cx, cy, p0[0], p0[1], P.ink, 2); B.line(cx, cy, p1[0], p1[1], P.ink, 2); B.line(p0[0], p0[1], p1[0], p1[1], P.green, 2, [6, 4]);
        B.angle(cx, cy, a0, a1, 24, P.purple, "θ = " + c.th + "°"); B.text("r = " + c.r + " cm", (cx + p0[0]) / 2 + 6, (cy + p0[1]) / 2, { size: 11.5 });
        const am = (a0 + a1) / 2; B.text("arc l = " + f(r.l, 3), cx + Math.cos(am) * (rr + 26), cy + Math.sin(am) * (rr + 26), { align: "center", color: P.red, w: 700, size: 12 });
        B.legend([["sector", P.blue], ["segment", P.amber], ["chord", P.green]], a.x + 8, a.y + a.h - 8); return; }
      let pts, lab = {};
      if (c.mode === "pyth") { pts = { C: [0, 0], B: [r.a, 0], A: [0, r.b] }; }
      else { const t = tri3(r.a, r.b, r.c); pts = { B: t.B, C: t.C, A: t.A }; }
      const all = Object.values(pts); if (c.mode === "pyth") { all.push([r.a + r.b, 0], [-r.b, r.b], [0, -r.a], [r.a, -r.a], [r.a + r.b, r.a]); }
      const F = fit(all, a, 26), M = (k) => F.map(pts[k]);
      if (c.mode === "pyth") { // squares on the sides
        const sq = (p, q, col, txt) => { const P1 = F.map(p), Q1 = F.map(q), dx = Q1[0] - P1[0], dy = Q1[1] - P1[1]; const pp = [P1, Q1, [Q1[0] + dy, Q1[1] - dx], [P1[0] + dy, P1[1] - dx]]; B.poly(pp, col, col + "33", 1.6); const cx = (P1[0] + Q1[0] + dy) / 2, cy = (P1[1] + Q1[1] - dx) / 2; B.text(txt, cx, cy + 4, { align: "center", size: 12, w: 800, color: col }); };
        sq(pts.B, pts.C, P.blue, "a² = " + f(r.a * r.a, 2)); sq(pts.C, pts.A, P.green, "b² = " + f(r.b * r.b, 2)); sq(pts.A, pts.B, P.red, "c² = " + f(r.c * r.c, 2));
      }
      B.poly([M("A"), M("B"), M("C")], P.ink, P.panel, 2.4);
      if (c.mode === "pyth") B.right(...M("C"), ang(M("C"), M("B")), ang(M("C"), M("A")), 12);
      else { arcAt(B, M("A"), M("B"), M("C"), f(c.mode === "sine" ? r.A : r.A, 1) + "°", P.purple); if (c.mode === "sine") arcAt(B, M("B"), M("A"), M("C"), f(r.B, 1) + "°", P.amber); }
      ["A", "B", "C"].forEach((k) => { const p = M(k), cen = [(M("A")[0] + M("B")[0] + M("C")[0]) / 3, (M("A")[1] + M("B")[1] + M("C")[1]) / 3], d = Math.hypot(p[0] - cen[0], p[1] - cen[1]) || 1; B.text(k, p[0] + (p[0] - cen[0]) / d * 14, p[1] + (p[1] - cen[1]) / d * 14 + 4, { align: "center", size: 14, w: 800, fam: "serif" }); });
      const side = (p, q, t, col) => { const P1 = M(p), Q1 = M(q), mx = (P1[0] + Q1[0]) / 2, my = (P1[1] + Q1[1]) / 2, cen = [(M("A")[0] + M("B")[0] + M("C")[0]) / 3, (M("A")[1] + M("B")[1] + M("C")[1]) / 3], d = Math.hypot(mx - cen[0], my - cen[1]) || 1; B.text(t, mx + (mx - cen[0]) / d * 16, my + (my - cen[1]) / d * 16 + 4, { align: "center", size: 12, w: 700, color: col }); };
      if (c.mode !== "pyth") { side("B", "C", "a = " + f(r.a, 3), P.red); side("C", "A", "b = " + f(r.b, 3), c.mode === "cosine" ? P.ink : P.green); side("A", "B", "c = " + f(r.c, 3), c.mode === "cosine" ? P.ink : P.green); }
      if (r.bad) B.text(c.mode === "sine" ? "Angles must total less than 180°" : "a must be shorter than the hypotenuse", a.x + 10, a.y + a.h - 10, { color: P.red, w: 700 });
    },
    hud(s, c) { const r = this.calc(c);
      if (c.mode === "pyth") return [{ title: "Pythagoras", lines: ["c² = a² + b²", c.find === "hyp" ? `c = √(${c.a}² + ${c.b}²) = √${f(c.a * c.a + c.b * c.b, 2)}` : `b = √(${c.hc}² − ${c.a}²) = √${f(c.hc * c.hc - c.a * c.a, 2)}`, [c.find === "hyp" ? `c = ${f(r.c, 3)} cm` : `b = ${f(r.b, 3)} cm`, null, true]] }];
      if (c.mode === "sine") return [{ title: "Sine rule", lines: ["a/sin A = b/sin B = c/sin C", `C = 180° − ${c.A}° − ${c.Bang}° = ${r.C}°`, `b = ${c.sa} sin ${c.Bang}° / sin ${c.A}°`, [`b = ${f(r.b, 3)} cm, c = ${f(r.c, 3)} cm`, null, true]] }];
      if (c.mode === "cosine") return [{ title: "Cosine rule", lines: ["a² = b² + c² − 2bc cos A", `= ${c.cb}² + ${c.cc}² − 2(${c.cb})(${c.cc})cos ${c.cang}°`, `= ${f(r.a * r.a, 3)}`, [`a = ${f(r.a, 3)} cm`, null, true]] }];
      return [{ title: "Circle formulae", lines: ["arc l = (θ/360°) × 2πr", `= ${c.th}/360 × 2π × ${c.r} = ${f(r.l, 3)} cm`, `sector perimeter = l + 2r = ${f(r.sector, 3)} cm`, `chord = 2r sin(θ/2) = ${f(r.ch, 3)} cm`, [`segment perimeter = ${f(r.seg, 3)} cm`, null, false]] }, { title: "Units", lines: ["lengths in cm; take π = 22/7 or 3.142 as told"] }]; },
    readouts(s, c) { const r = this.calc(c); if (c.mode === "arc") return [["Arc length", f(r.l, 3) + " cm"], ["Sector perimeter", f(r.sector, 3) + " cm"], ["Segment perimeter", f(r.seg, 3) + " cm"]]; return [["a", f(r.a, 3) + " cm"], ["b", f(r.b, 3) + " cm"], ["c", f(r.c, 3) + " cm"], ["Perimeter", f(r.a + r.b + r.c, 3) + " cm"]]; },
    steps(s, c) { const r = this.calc(c); if (c.mode === "pyth") return c.find === "hyp" ? [`c² = ${c.a}² + ${c.b}² = ${c.a * c.a} + ${c.b * c.b} = ${f(c.a * c.a + c.b * c.b, 3)}`, `c = √${f(c.a * c.a + c.b * c.b, 3)} = ${f(r.c, 3)} cm`] : [`b² = c² − a² = ${c.hc * c.hc} − ${c.a * c.a} = ${f(c.hc * c.hc - c.a * c.a, 3)}`, `b = ${f(r.b, 3)} cm`];
      if (c.mode === "sine") return [`Third angle C = ${r.C}°`, `b = a sin B / sin A = ${c.sa} × ${f(Math.sin(R(c.Bang)), 4)} / ${f(Math.sin(R(c.A)), 4)} = ${f(r.b, 3)}`, `c = a sin C / sin A = ${f(r.c, 3)}`];
      if (c.mode === "cosine") return [`a² = ${c.cb * c.cb} + ${c.cc * c.cc} − ${2 * c.cb * c.cc} × ${f(Math.cos(R(c.cang)), 4)}`, `a² = ${f(r.a * r.a, 3)}`, `a = ${f(r.a, 3)} cm`];
      return [`l = ${c.th}/360 × 2 × π × ${c.r} = ${f(r.l, 3)} cm`, `Sector perimeter = ${f(r.l, 3)} + 2 × ${c.r} = ${f(r.sector, 3)} cm`, `Segment perimeter = arc + chord = ${f(r.l, 3)} + ${f(r.ch, 3)} = ${f(r.seg, 3)} cm`]; },
    note: "Use Pythagoras, sine and cosine rules for lengths and distances (no proofs required). Lengths of arcs, perimeters of sectors and segments. Latitude/longitude distances: open the 3D globe lab below.",
    mistake: "Using the sine rule when you know two sides and the included angle — that needs the cosine rule.",
  });

  /* ---------------- C-b Areas (2D) ---------------- */
  MK.def("C-b", {
    title: "Areas of plane shapes", env: "graph",
    values: { shape: "tri2", b: 10, h: 6, a2: 8, c2: 9, C: 50, top: 6, r: 6, th: 100, k: 2 },
    controls: [{ type: "select", key: "shape", label: "Shape", options: [["tri", "Triangle ½bh"], ["tri2", "Triangle ½ab sin C"], ["para", "Parallelogram"], ["trap", "Trapezium"], ["circle", "Circle"], ["sector", "Sector"], ["segment", "Segment"], ["comp", "Compound: rectangle + semicircle"], ["sim", "Similar figures (area ∝ k²)"]] },
      { key: "b", label: "base / length", min: 1, max: 20, step: 0.5, unit: "cm", show: (c) => ["tri", "para", "trap", "comp", "sim"].includes(c.shape) }, { key: "h", label: "height", min: 1, max: 15, step: 0.5, unit: "cm", show: (c) => ["tri", "para", "trap", "comp", "sim"].includes(c.shape) },
      { key: "top", label: "parallel side a", min: 1, max: 20, step: 0.5, unit: "cm", show: W("shape", "trap") }, { key: "a2", label: "side a", min: 1, max: 20, step: 0.5, unit: "cm", show: W("shape", "tri2") }, { key: "c2", label: "side b", min: 1, max: 20, step: 0.5, unit: "cm", show: W("shape", "tri2") }, { key: "C", label: "included angle C", min: 5, max: 175, unit: "°", show: W("shape", "tri2") },
      { key: "r", label: "radius r", min: 1, max: 15, step: 0.5, unit: "cm", show: W("shape", "circle", "sector", "segment") }, { key: "th", label: "angle θ", min: 5, max: 355, unit: "°", show: W("shape", "sector", "segment") }, { key: "k", label: "scale factor k", min: 0.5, max: 3, step: 0.25, show: W("shape", "sim") }],
    area(c) { switch (c.shape) { case "tri": return 0.5 * c.b * c.h; case "tri2": return 0.5 * c.a2 * c.c2 * Math.sin(R(c.C)); case "para": return c.b * c.h; case "trap": return 0.5 * (c.top + c.b) * c.h; case "circle": return Math.PI * c.r * c.r; case "sector": return c.th / 360 * Math.PI * c.r * c.r; case "segment": return c.th / 360 * Math.PI * c.r * c.r - 0.5 * c.r * c.r * Math.sin(R(c.th)); case "comp": return c.b * c.h + 0.5 * Math.PI * (c.b / 2) * (c.b / 2); default: return 0.5 * c.b * c.h * c.k * c.k; } },
    draw(g, s, c, B) {
      const P = B.P, a = B.area;
      if (["circle", "sector", "segment"].includes(c.shape)) { const cx = a.x + a.w / 2, cy = a.y + a.h / 2 + 8, rr = Math.min(a.w, a.h) * 0.38, a0 = -Math.PI / 2, a1 = c.shape === "circle" ? a0 + TAU : a0 + R(c.th);
        B.circle(cx, cy, rr, P.faint, null, 1, [4, 4]); g.save(); g.beginPath(); if (c.shape === "segment") g.arc(cx, cy, rr, a0, a1); else { g.moveTo(cx, cy); g.arc(cx, cy, rr, a0, a1); } g.closePath(); g.fillStyle = P.fillB; g.fill(); g.strokeStyle = P.blue; g.lineWidth = 2.4; g.stroke(); g.restore();
        B.line(cx, cy, cx, cy - rr, P.ink, 1.6); B.text("r = " + c.r, cx + 6, cy - rr / 2, { size: 11.5 }); if (c.shape !== "circle") B.angle(cx, cy, a0, a1, 22, P.purple, c.th + "°"); return; }
      let poly, extra = null;
      if (c.shape === "tri") poly = [[0, 0], [c.b, 0], [c.b * 0.35, c.h]];
      else if (c.shape === "tri2") { const C = [0, 0], A = [c.c2, 0], Bp = [c.a2 * Math.cos(R(c.C)), c.a2 * Math.sin(R(c.C))]; poly = [C, A, Bp]; }
      else if (c.shape === "para") poly = [[0, 0], [c.b, 0], [c.b + c.h * 0.5, c.h], [c.h * 0.5, c.h]];
      else if (c.shape === "trap") { const off = (c.b - c.top) / 2; poly = [[0, 0], [c.b, 0], [c.b - off, c.h], [off, c.h]]; }
      else if (c.shape === "comp") { poly = [[0, 0], [c.b, 0], [c.b, c.h], [0, c.h]]; extra = "semi"; }
      else poly = [[0, 0], [c.b, 0], [c.b * 0.35, c.h]];
      const bound = poly.slice(); if (extra) bound.push([c.b / 2, c.h + c.b / 2]); if (c.shape === "sim") bound.push([c.b * (1 + c.k) + 2, 0], [c.b * (1 + 0.35 * c.k) + 2, c.h * c.k]);
      const F = fit(bound, a, 34), S = poly.map(F.map);
      B.poly(S, P.blue, P.fillB, 2.4);
      if (extra) { const cx = F.map([c.b / 2, c.h]), rr = c.b / 2 * F.k; g.save(); g.beginPath(); g.arc(cx[0], cx[1], rr, Math.PI, TAU); g.closePath(); g.fillStyle = P.fillA; g.fill(); g.strokeStyle = P.amber; g.lineWidth = 2.4; g.stroke(); g.restore(); }
      if (["tri", "para", "trap", "sim"].includes(c.shape)) { const top = S.reduce((m, p) => (p[1] < m[1] ? p : m), S[0]), foot = [top[0], S[0][1]]; B.line(top[0], top[1], foot[0], foot[1], P.red, 1.6, [5, 4]); B.right(foot[0], foot[1], -Math.PI / 2, 0, 9, P.red); B.text("h = " + c.h, foot[0] + 6, (top[1] + foot[1]) / 2, { size: 11.5, color: P.red, w: 700 }); }
      if (c.shape !== "tri2") B.text("b = " + c.b, (S[0][0] + S[1][0]) / 2, S[0][1] + 18, { align: "center", size: 11.5, w: 700 });
      if (c.shape === "trap") B.text("a = " + c.top, (S[2][0] + S[3][0]) / 2, S[2][1] - 8, { align: "center", size: 11.5, w: 700 });
      if (c.shape === "tri2") { B.angle(S[0][0], S[0][1], Math.atan2(S[1][1] - S[0][1], S[1][0] - S[0][0]), Math.atan2(S[2][1] - S[0][1], S[2][0] - S[0][0]), 22, P.purple, c.C + "°"); B.text("b = " + c.c2, (S[0][0] + S[1][0]) / 2, S[0][1] + 18, { align: "center", w: 700 }); B.text("a = " + c.a2, (S[0][0] + S[2][0]) / 2 - 18, (S[0][1] + S[2][1]) / 2, { align: "right", w: 700 }); }
      if (c.shape === "sim") { const p2 = [[c.b + 2, 0], [c.b * (1 + c.k) + 2, 0], [c.b + 2 + c.b * 0.35 * c.k, c.h * c.k]].map(F.map); B.poly(p2, P.green, P.fillG, 2.4); B.text("× k = " + c.k, p2[1][0], p2[1][1] + 18, { align: "right", color: P.green, w: 700 }); }
    },
    hud(s, c) { const A = this.area(c), L = { tri: ["A = ½ × b × h", `= ½ × ${c.b} × ${c.h}`], tri2: ["A = ½ab sin C", `= ½ × ${c.a2} × ${c.c2} × sin ${c.C}°`], para: ["A = b × h", `= ${c.b} × ${c.h}`], trap: ["A = ½(a + b)h", `= ½(${c.top} + ${c.b}) × ${c.h}`], circle: ["A = πr²", `= π × ${c.r}²`], sector: ["A = (θ/360)πr²", `= ${c.th}/360 × π × ${c.r}²`], segment: ["A = sector − triangle", "= (θ/360)πr² − ½r² sin θ"], comp: ["A = lw + ½π(w/2)²", `= ${c.b}×${c.h} + ½π(${c.b / 2})²`], sim: ["Area ratio = k²", `small = ${f(0.5 * c.b * c.h, 3)}, × ${c.k}² = ${f(c.k * c.k, 3)}`] }[c.shape];
      return [{ title: "Area formula", lines: [...L, [`= ${f(A, 3)} cm²`, null, true]] }, { title: "Units", lines: ["cm × cm = cm²; 10 000 m² = 1 hectare"] }]; },
    readouts(s, c) { return [["Area", f(this.area(c), 3) + " cm²"], ["In m²", f(this.area(c) / 10000, 6) + " m²"]]; },
    steps(s, c) { const A = this.area(c); if (c.shape === "segment") { const sec = c.th / 360 * Math.PI * c.r * c.r, tr = 0.5 * c.r * c.r * Math.sin(R(c.th)); return [`Sector = ${c.th}/360 × π × ${c.r}² = ${f(sec, 3)}`, `Triangle = ½ × ${c.r}² × sin ${c.th}° = ${f(tr, 3)}`, `Segment = ${f(sec, 3)} − ${f(tr, 3)} = ${f(A, 3)} cm²`]; }
      if (c.shape === "comp") return [`Rectangle: ${c.b} × ${c.h} = ${c.b * c.h}`, `Semicircle: ½ × π × ${c.b / 2}² = ${f(0.5 * Math.PI * c.b * c.b / 4, 3)}`, `Total = ${f(A, 3)} cm²`];
      if (c.shape === "sim") return [`Lengths scale by k = ${c.k}`, `Areas scale by k² = ${c.k * c.k}`, `${f(0.5 * c.b * c.h, 3)} × ${c.k * c.k} = ${f(A, 3)} cm²`];
      return [`Choose the formula for the shape (see panel).`, `Substitute and calculate: ${f(A, 3)} cm².`]; },
    note: "Triangles (½bh and ½ab sin C), special quadrilaterals, circles, sectors and segments, compound shapes and areas of similar figures. Surface areas and the sector–cone relation: open the 3D lab below.",
    mistake: "Using the slant side instead of the perpendicular height in ½bh or in the parallelogram formula.",
  });

  /* ---------------- D-a Angles ---------------- */
  const kind = (d) => (d < 89.5 ? "acute" : d < 90.5 ? "right angle" : d < 179.5 ? "obtuse" : d < 180.5 ? "straight angle" : "reflex");
  MK.def("D-a", {
    title: "Angles at a point & on a line", env: "paper",
    values: { mode: "point", t1: 20, t2: 140, t3: 250 },
    controls: [{ type: "tabs", key: "mode", label: "Fact", options: [["point", "Angles at a point (360°)"], ["line", "Angles on a straight line (180°)"], ["vert", "Vertically opposite angles"]] }, { key: "t1", label: "Ray 1 direction", min: 0, max: 359, unit: "°" }, { key: "t2", label: "Ray 2 direction", min: 0, max: 359, unit: "°" }, { key: "t3", label: "Ray 3 direction", min: 0, max: 359, unit: "°", show: W("mode", "point") }],
    hint: "Drag the ends of the rays", syncAll: true,
    rays(c) { if (c.mode === "point") return [c.t1, c.t2, c.t3].sort((x, y) => x - y); if (c.mode === "line") return [0, c.t2 % 180 || 1, 180]; return [c.t1 % 180, (c.t1 % 180) + 180]; },
    geo(B) { const a = B.area; return { cx: a.x + a.w / 2, cy: a.y + a.h / 2 + 14, L: Math.min(a.w, a.h) * 0.42 }; },
    draw(g, s, c, B) {
      const P = B.P, { cx, cy, L } = this.geo(B), cols = [P.red, P.blue, P.green, P.amber], rays = this.rays(c);
      const end = (t) => [cx + Math.cos(-R(t)) * L, cy + Math.sin(-R(t)) * L];
      if (c.mode === "vert") { const t2 = c.t2 % 180; [c.t1 % 180, t2].forEach((t, i) => { const p = end(t), q = end(t + 180); B.line(p[0], p[1], q[0], q[1], i ? P.blue : P.red, 2.6); B.dot(p[0], p[1], i ? P.blue : P.red, 6); });
        let a1 = c.t1 % 180, a2 = t2; if (a2 < a1) [a1, a2] = [a2, a1]; const x = a2 - a1, y = 180 - x;
        [[a1, a2, x, P.purple], [a2, a1 + 180, y, P.green], [a1 + 180, a2 + 180, x, P.purple], [a2 + 180, a1 + 360, y, P.green]].forEach(([u, v, val, col]) => B.angle(cx, cy, -R(u), -R(v), 30, col, f(val, 0) + "°")); return; }
      if (c.mode === "line") { const p = end(0), q = end(180); B.line(p[0], p[1], q[0], q[1], P.ink, 2.8); }
      rays.forEach((t, i) => { const p = end(t); if (c.mode !== "line" || (i === 1)) { B.line(cx, cy, p[0], p[1], cols[i], 2.6); B.dot(p[0], p[1], cols[i], 6); } });
      const n = c.mode === "point" ? 3 : 2; for (let i = 0; i < n; i++) { const u = rays[i], v = c.mode === "point" ? (i === 2 ? rays[0] + 360 : rays[i + 1]) : rays[i + 1], val = v - u; B.angle(cx, cy, -R(u), -R(v - 0.0001), 34 + i * 6, [P.purple, P.green, P.amber][i], f(val, 0) + "°"); }
      B.dot(cx, cy, P.ink, 4, "O", { dx: -16, dy: 16 });
    },
    pointer: MK.dragger((s, c, B) => { const { cx, cy, L } = MK.scenes["D-a"].geo(B), e = (t) => [cx + Math.cos(-R(t)) * L, cy + Math.sin(-R(t)) * L]; return c.mode === "point" ? [e(c.t1), e(c.t2), e(c.t3)] : c.mode === "line" ? [[-999, -999], e(c.t2 % 180)] : [e(c.t1 % 180), e(c.t2 % 180)]; },
      (i, p, s, c, B, H) => { const { cx, cy } = MK.scenes["D-a"].geo(B); let t = Math.round((D(Math.atan2(-(p.y - cy), p.x - cx)) + 360) % 360); if (c.mode === "line") t = MK.clamp(t, 1, 179); c[["t1", "t2", "t3"][i]] = t; }),
    angles(c) { const r = this.rays(c); if (c.mode === "point") return [r[1] - r[0], r[2] - r[1], 360 - (r[2] - r[0])]; if (c.mode === "line") return [r[1], 180 - r[1]]; let x = Math.abs((c.t2 % 180) - (c.t1 % 180)); return [x, 180 - x]; },
    hud(s, c) { const A = this.angles(c); const L = { point: ["Angles at a point add up to 360°", `${A.map((v) => f(v, 0) + "°").join(" + ")} = 360°`], line: ["Adjacent angles on a straight line are supplementary", `${f(A[0], 0)}° + ${f(A[1], 0)}° = 180°`], vert: ["Vertically opposite angles are equal", `pair 1: ${f(A[0], 0)}° = ${f(A[0], 0)}°`, `pair 2: ${f(A[1], 0)}° = ${f(A[1], 0)}°`, "adjacent pair sums to 180°"] }[c.mode]; return [{ title: "Angle fact", lines: L }, { title: "Types", lines: A.map((v) => `${f(v, 0)}° — ${kind(v)}`) }]; },
    readouts(s, c) { return this.angles(c).map((v, i) => ["Angle " + (i + 1), f(v, 0) + "° (" + kind(v) + ")"]); },
    steps(s, c) { const A = this.angles(c); if (c.mode === "point") return [`Two of the angles are ${f(A[0], 0)}° and ${f(A[1], 0)}°`, `Third = 360° − ${f(A[0], 0)}° − ${f(A[1], 0)}° = ${f(A[2], 0)}°`]; if (c.mode === "line") return [`Angles on a straight line sum to 180°`, `x = 180° − ${f(A[0], 0)}° = ${f(A[1], 0)}°`]; return [`Vertically opposite angles are equal: ${f(A[0], 0)}°`, `Adjacent angles are supplementary: 180° − ${f(A[0], 0)}° = ${f(A[1], 0)}°`]; },
    note: "The degree as a unit of measure; acute, obtuse and reflex angles. Give the reason with each statement in Paper 2 (e.g. “angles on a straight line”).",
    mistake: "Writing an answer without a reason — reasons earn marks in geometry questions.",
  });

  /* ---------------- D-b Parallel lines & intercept theorem ---------------- */
  MK.def("D-b", {
    title: "Parallel lines & intercepts", env: "paper",
    values: { mode: "angles", th: 62, pair: "corr", m: 2, n: 3 },
    controls: [{ type: "tabs", key: "mode", label: "Topic", options: [["angles", "Angles on parallel lines"], ["inter", "Intercept theorem"]] }, { key: "th", label: "Transversal angle", min: 15, max: 165, unit: "°", show: W("mode", "angles") }, { type: "select", key: "pair", label: "Highlight", options: [["corr", "Corresponding (equal)"], ["alt", "Alternate (equal)"], ["co", "Co-interior (sum 180°)"], ["vo", "Vertically opposite (equal)"]], show: W("mode", "angles") }, { key: "m", label: "Ratio m", min: 1, max: 6, show: W("mode", "inter") }, { key: "n", label: "Ratio n", min: 1, max: 6, show: W("mode", "inter") }],
    draw(g, s, c, B) {
      const P = B.P, a = B.area;
      if (c.mode === "inter") { const A = [a.x + 30, a.y + a.h - 70], Bp = [a.x + a.w - 30, a.y + a.h - 70], N = c.m + c.n, Cp = [A[0] + (a.w - 80) * 0.55, a.y + 60];
        B.line(A[0], A[1], Bp[0], Bp[1], P.ink, 2.6); B.line(A[0], A[1], Cp[0], Cp[1], P.soft, 1.6);
        const pt = (k) => [A[0] + (Cp[0] - A[0]) * k / N, A[1] + (Cp[1] - A[1]) * k / N];
        for (let k = 1; k <= N; k++) { const q = pt(k); B.dot(q[0], q[1], P.soft, 3); B.text(String(k), q[0] - 10, q[1] - 4, { size: 10, color: P.soft }); }
        const last = pt(N); B.line(last[0], last[1], Bp[0], Bp[1], P.blue, 2); const km = pt(c.m), t = c.m / N, D0 = [A[0] + (Bp[0] - A[0]) * t, A[1]];
        B.line(km[0], km[1], D0[0], D0[1], P.red, 2.2, [6, 4]); B.dot(D0[0], D0[1], P.red, 6, "P", { dy: 20 });
        B.text("A", A[0] - 14, A[1] + 4, { w: 800 }); B.text("B", Bp[0] + 6, Bp[1] + 4, { w: 800 }); B.text(`AP : PB = ${c.m} : ${c.n}`, a.x + 14, a.y + 40, { size: 15, w: 800, color: P.red }); B.text("Red line is drawn parallel to the blue line", a.x + 14, a.y + a.h - 14, { size: 11, color: P.soft }); return; }
      const y1 = a.y + a.h * 0.34, y2 = a.y + a.h * 0.7, cx = a.x + a.w / 2, th = R(c.th), dx = Math.cos(th) / Math.sin(th);
      B.line(a.x + 10, y1, a.x + a.w - 10, y1, P.ink, 2.4); B.line(a.x + 10, y2, a.x + a.w - 10, y2, P.ink, 2.4);
      [y1, y2].forEach((y) => { B.arrow(a.x + 40, y, a.x + 56, y, P.ink, 2, 8); });
      const X = (y) => cx + (y2 - y) * dx * 0.5 - (y2 - y1) * dx * 0.25; const top = a.y + 20, bot = a.y + a.h - 20;
      B.line(X(top), top, X(bot), bot, P.red, 2.4);
      const I1 = [X(y1), y1], I2 = [X(y2), y2], up = -th, labels = [];
      // 4 angles at each intersection (screen angles): ray right 0, ray up-along-transversal = -th
      const angs = (I, base, tag) => { const dirs = [0, -th, Math.PI, Math.PI - th]; const names = tag === 1 ? ["a", "b", "c", "d"] : ["e", "f", "g", "h"]; const vals = [c.th, 180 - c.th, c.th, 180 - c.th];
        return [[dirs[0], dirs[1], names[0], vals[0]], [dirs[1], dirs[2] - TAU, names[1], vals[1]], [dirs[2], dirs[3] + 0, names[2], vals[2]], [dirs[3], TAU, names[3], vals[3]]].map(([u, v, nm, val]) => ({ I, u, v, nm, val })); };
      const all = angs(I1, 0, 1).concat(angs(I2, 0, 2));
      const hi = { corr: ["a", "e"], alt: ["c", "e"], co: ["d", "e"], vo: ["a", "c"] }[c.pair];
      all.forEach((A) => { const on = hi.includes(A.nm), col = on ? (A.nm === hi[0] ? P.purple : P.green) : P.faint; let a0 = A.u, a1 = A.u - (A.nm === "a" || A.nm === "e" ? th : A.nm === "b" || A.nm === "f" ? Math.PI - th : A.nm === "c" || A.nm === "g" ? th : Math.PI - th);
        a0 = { a: 0, b: -th, c: Math.PI, d: Math.PI - th, e: 0, f: -th, g: Math.PI, h: Math.PI - th }[A.nm]; a1 = { a: -th, b: -Math.PI, c: Math.PI - th, d: 0, e: -th, f: -Math.PI, g: Math.PI - th, h: 0 }[A.nm];
        if (on) B.angle(A.I[0], A.I[1], a0, a1, 26, col, A.nm + " = " + A.val + "°"); else { const m = (a0 + a1) / 2; B.text(A.nm, A.I[0] + Math.cos(m) * 18, A.I[1] + Math.sin(m) * 18 + 4, { align: "center", size: 11, color: P.soft }); } });
    },
    hud(s, c) { if (c.mode === "inter") return [{ title: "Intercept theorem", lines: ["Parallel lines cut transversals proportionally", `Divide AB into ${c.m + c.n} equal steps on AC`, `Join step ${c.m + c.n} to B; parallel through step ${c.m}`, [`AP : PB = ${c.m} : ${c.n}`, null, true]] }];
      const t = c.th, L = { corr: [`a = e = ${t}° (corresponding)`, "F-shape"], alt: [`c = e = ${t}° (alternate)`, "Z-shape"], co: [`d + e = ${180 - t}° + ${t}° = 180°`, "C/U-shape (co-interior)"], vo: [`a = c = ${t}° (vertically opposite)`, "X-shape"] }[c.pair]; return [{ title: "Angle fact", lines: L }, { title: "All eight angles", lines: [`a = c = e = g = ${t}°`, `b = d = f = h = ${180 - t}°`] }]; },
    readouts(s, c) { return c.mode === "inter" ? [["Ratio", c.m + " : " + c.n], ["AP as fraction of AB", c.m + "/" + (c.m + c.n)]] : [["Acute angles", c.th < 90 ? c.th + "°" : 180 - c.th + "°"], ["Obtuse angles", c.th > 90 ? c.th + "°" : 180 - c.th + "°"]]; },
    steps(s, c) { if (c.mode === "inter") return ["Draw a line AC at any acute angle to AB.", `With compasses, step off ${c.m + c.n} equal lengths along AC.`, `Join the last point to B.`, `Through point ${c.m}, draw a line parallel to that join; it meets AB at P.`, `Then AP : PB = ${c.m} : ${c.n} (intercept theorem).`]; return ["Identify the pair (F, Z, C or X shape).", c.pair === "co" ? "Co-interior angles add up to 180°." : "The two angles are equal.", "Write the reason beside the statement."]; },
    note: "Alternate and corresponding angles are equal; interior opposite (co-interior) angles are supplementary; intercept theorem applied to proportional division of a line segment.",
    mistake: "Calling co-interior angles equal. They add to 180°.",
  });

  /* ---------------- D-c Triangles & polygons ---------------- */
  const QUADS = { parallelogram: { p: [[0, 0], [6, 0], [8, 3.5], [2, 3.5]], props: ["Opposite sides equal and parallel", "Opposite angles equal", "Diagonals bisect each other"] }, rhombus: { p: [[0, 0], [5, 0], [8, 4], [3, 4]], props: ["All sides equal", "Diagonals bisect at right angles", "Diagonals bisect the angles"] }, rectangle: { p: [[0, 0], [7, 0], [7, 4], [0, 4]], props: ["All angles 90°", "Diagonals equal and bisect each other"] }, square: { p: [[0, 0], [5, 0], [5, 5], [0, 5]], props: ["All sides equal, all angles 90°", "Diagonals equal, bisect at 90°"] }, trapezium: { p: [[0, 0], [8, 0], [6, 4], [2, 4]], props: ["One pair of parallel sides"] }, kite: { p: [[0, 0], [3, -2.5], [8, 0], [3, 2.5]], props: ["Two pairs of adjacent equal sides", "Diagonals cross at 90°", "One diagonal bisected"] } };
  MK.def("D-c", {
    title: "Triangles & polygons", env: "paper",
    values: { mode: "sum", ax: 2, ay: 5, bx: -4, by: -2, cx: 5, cy: -2, cond: "SSS", k: 1.5, quad: "parallelogram", n: 6, shift: 2 },
    controls: [{ type: "tabs", key: "mode", label: "Topic", options: [["sum", "Angle sum & exterior angle"], ["cong", "Congruence"], ["sim", "Similar triangles"], ["quad", "Special quadrilaterals"], ["poly", "Polygons"], ["area", "Same base, same parallels"]] },
      { type: "select", key: "cond", label: "Condition", options: [["SSS", "SSS"], ["SAS", "SAS"], ["ASA", "ASA / AAS"], ["RHS", "RHS"], ["SSA", "SSA (not enough!)"]], show: W("mode", "cong") }, { key: "k", label: "Scale factor k", min: 0.5, max: 2.5, step: 0.1, show: W("mode", "sim") },
      { type: "select", key: "quad", label: "Quadrilateral", options: Object.keys(QUADS), show: W("mode", "quad") }, { key: "n", label: "Number of sides n", min: 3, max: 12, show: W("mode", "poly") }, { key: "shift", label: "Slide the top edge", min: -6, max: 6, step: 0.1, show: W("mode", "area") }],
    hint: "Drag the triangle's vertices",
    geo(B) { return B.axes ? null : null; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area;
      if (c.mode === "sum" || c.mode === "sim") {
        const m = { X: (x) => a.x + a.w / 2 + x * Math.min(a.w, a.h) / 16, Y: (y) => a.y + a.h / 2 + 10 - y * Math.min(a.w, a.h) / 16 }; s.m = m;
        const A = [m.X(c.ax), m.Y(c.ay)], Bp = [m.X(c.bx), m.Y(c.by)], C = [m.X(c.cx), m.Y(c.cy)];
        if (c.mode === "sim") { const k = c.k, cen = [(A[0] + Bp[0] + C[0]) / 3, (A[1] + Bp[1] + C[1]) / 3], sc = (p) => [cen[0] + (p[0] - cen[0]) * k * 0.6 + a.w * 0.0, cen[1] + (p[1] - cen[1]) * k * 0.6];
          const sh = (p) => [p[0] - a.w * 0.22, p[1]]; const A1 = sh(A), B1 = sh(Bp), C1 = sh(C); B.poly([A1, B1, C1], P.blue, P.fillB, 2.2); const off = (p) => [p[0] + a.w * 0.22, p[1]]; const A2 = off(sc(A)), B2 = off(sc(Bp)), C2 = off(sc(C)); B.poly([A2, B2, C2], P.green, P.fillG, 2.2);
          [[A1, B1, C1], [A2, B2, C2]].forEach(([p, q, r2]) => { arcAt(B, p, q, r2, "", P.purple, 16); arcAt(B, q, p, r2, "", P.amber, 16); }); B.text("k = " + c.k, a.x + a.w / 2, a.y + a.h - 14, { align: "center", w: 800, color: P.green }); return; }
        B.poly([A, Bp, C], P.ink, P.fillB, 2.4);
        const ext = [C[0] + (C[0] - Bp[0]) * 0.45, C[1] + (C[1] - Bp[1]) * 0.45]; B.line(C[0], C[1], ext[0], ext[1], P.soft, 2, [6, 4]);
        const aA = angAt([c.ax, c.ay], [c.bx, c.by], [c.cx, c.cy]), aB = angAt([c.bx, c.by], [c.ax, c.ay], [c.cx, c.cy]), aC = 180 - aA - aB;
        arcAt(B, A, Bp, C, f(aA, 1) + "°", P.red); arcAt(B, Bp, A, C, f(aB, 1) + "°", P.blue); arcAt(B, C, A, Bp, f(aC, 1) + "°", P.green); arcAt(B, C, ext, A, "ext " + f(aA + aB, 1) + "°", P.amber, 40);
        [["A", A], ["B", Bp], ["C", C]].forEach(([n, p]) => B.dot(p[0], p[1], P.ink, 6, n, { dx: -18, dy: -6 })); return; }
      if (c.mode === "cong") { const base = [[0, 0], [6, 0], [2, 4]], F = fit(base.concat([[16, 0], [18, 4]]), a, 30), t1 = base.map(F.map), mirror = base.map((p) => F.map([16 - p[0] + 0, p[1]]));
        const ok = c.cond !== "SSA"; B.poly(t1, P.blue, P.fillB, 2.2); B.poly(mirror, ok ? P.green : P.red, ok ? P.fillG : P.fillR, 2.2);
        if (!ok) { const alt = [[0, 0], [6, 0], [3.3, 2.2]].map((p) => F.map([16 - p[0], p[1]])); B.poly(alt, P.red, null, 1.6, true, [5, 4]); B.text("Two different triangles fit SSA!", a.x + 10, a.y + a.h - 12, { color: P.red, w: 800 }); }
        const mark = (T3) => { if (["SSS", "SAS", "SSA", "RHS"].includes(c.cond)) { B.ticks(...T3[0], ...T3[1], 1); B.ticks(...T3[1], ...T3[2], 2); } if (c.cond === "SSS") B.ticks(...T3[2], ...T3[0], 3); if (c.cond === "SAS") arcAt(B, T3[1], T3[0], T3[2], "", P.purple, 16); if (c.cond === "ASA") { arcAt(B, T3[0], T3[1], T3[2], "", P.purple, 16); arcAt(B, T3[1], T3[0], T3[2], "", P.amber, 16); B.ticks(...T3[0], ...T3[1], 1); } if (c.cond === "SSA") arcAt(B, T3[0], T3[1], T3[2], "", P.purple, 16); };
        mark(t1); mark(mirror); B.text(ok ? "Congruent (≡) — one is a reflection of the other" : "SSA does not guarantee congruence", a.x + 10, a.y + 40, { size: 13, w: 800, color: ok ? P.green : P.red }); return; }
      if (c.mode === "quad") { const Q = QUADS[c.quad], F = fit(Q.p, a, 40), S = Q.p.map(F.map); B.poly(S, P.blue, P.fillB, 2.4); B.line(S[0][0], S[0][1], S[2][0], S[2][1], P.purple, 1.4, [5, 4]); B.line(S[1][0], S[1][1], S[3][0], S[3][1], P.purple, 1.4, [5, 4]);
        for (let i = 0; i < 4; i++) { const p = Q.p[i], q = Q.p[(i + 1) % 4]; const len = Math.hypot(q[0] - p[0], q[1] - p[1]); const same = Q.p.map((pp, j) => Math.hypot(Q.p[(j + 1) % 4][0] - pp[0], Q.p[(j + 1) % 4][1] - pp[1])).findIndex((l) => Math.abs(l - len) < 1e-6); B.ticks(...S[i], ...S[(i + 1) % 4], same + 1); }
        Q.props.forEach((t, i) => B.text("• " + t, a.x + 10, a.y + a.h - 12 - (Q.props.length - 1 - i) * 16, { size: 11.5 })); return; }
      if (c.mode === "poly") { const n = c.n, cx = a.x + a.w / 2, cy = a.y + a.h / 2 + 10, rr = Math.min(a.w, a.h) * 0.36, V = []; for (let i = 0; i < n; i++) { const t = -Math.PI / 2 + i * TAU / n; V.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr]); }
        for (let i = 1; i < n - 1; i++) B.poly([V[0], V[i], V[i + 1]], P.faint, i % 2 ? P.fillB : P.fillG, 0.8); B.poly(V, P.ink, null, 2.4);
        const p0 = V[0], p1 = V[1], ext = [p1[0] + (p1[0] - p0[0]) * 0.5, p1[1] + (p1[1] - p0[1]) * 0.5]; B.line(p1[0], p1[1], ext[0], ext[1], P.amber, 2, [5, 4]); arcAt(B, p1, ext, V[2], f(360 / n, 1) + "°", P.amber, 22);
        B.text(`${n - 2} triangles × 180° = ${(n - 2) * 180}°`, a.x + 10, a.y + a.h - 12, { size: 13, w: 800, color: P.blue }); return; }
      // same base, same parallels
      const F = fit([[0, 0], [8, 0], [8 + 6, 5], [-6, 5]], a, 30), b0 = F.map([0, 0]), b1 = F.map([8, 0]), t0 = F.map([c.shift, 5]), t1 = F.map([8 + c.shift, 5]), t0b = F.map([0, 5]), t1b = F.map([8, 5]);
      B.line(a.x, t0[1], a.x + a.w, t0[1], P.soft, 1.4, [8, 5]); B.line(a.x, b0[1], a.x + a.w, b0[1], P.soft, 1.4, [8, 5]); B.poly([b0, b1, t1b, t0b], P.blue, P.fillB, 1.8, true, [5, 4]); B.poly([b0, b1, t1, t0], P.green, P.fillG, 2.6);
      B.text("Area = base × height = 8 × 5 = 40 (unchanged)", a.x + 10, a.y + 40, { size: 13, w: 800, color: P.green });
    },
    pointer: MK.dragger((s, c) => (c.mode === "sum" && s.m ? [[s.m.X(c.ax), s.m.Y(c.ay)], [s.m.X(c.bx), s.m.Y(c.by)], [s.m.X(c.cx), s.m.Y(c.cy)]] : []), (i, p, s, c) => { const k = 16 / Math.min(1, 1); const a = s.m; const x = (p.x - a.X(0)) / (a.X(1) - a.X(0)), y = (p.y - a.Y(0)) / (a.Y(1) - a.Y(0)); c[["ax", "bx", "cx"][i]] = MK.clamp(snap(x), -7, 7); c[["ay", "by", "cy"][i]] = MK.clamp(snap(y), -5, 6); }),
    hud(s, c) { if (c.mode === "sum") { const aA = angAt([c.ax, c.ay], [c.bx, c.by], [c.cx, c.cy]), aB = angAt([c.bx, c.by], [c.ax, c.ay], [c.cx, c.cy]); return [{ title: "Triangle facts", lines: ["A + B + C = 180°", `${f(aA, 1)} + ${f(aB, 1)} + ${f(180 - aA - aB, 1)} = 180°`, "Exterior angle = sum of the interior opposite angles", [`${f(aA + aB, 1)}° = ${f(aA, 1)}° + ${f(aB, 1)}°`, null, false]] }]; }
      if (c.mode === "cong") return [{ title: "Congruence", lines: ["SSS, SAS, ASA/AAS, RHS prove congruence", "SSA and AAA do NOT", "—", [c.cond === "SSA" ? "Not sufficient" : c.cond + " ✓", null, true]] }];
      if (c.mode === "sim") return [{ title: "Similar triangles", lines: ["Equal angles (equiangular)", `Sides in ratio 1 : ${c.k}`, `Areas in ratio 1 : ${f(c.k * c.k, 3)}`] }];
      if (c.mode === "quad") return [{ title: c.quad, lines: QUADS[c.quad].props }];
      if (c.mode === "poly") return [{ title: "Polygon", lines: ["Interior sum = (n − 2) × 180°", `= (${c.n} − 2) × 180° = ${(c.n - 2) * 180}°`, `Each interior (regular) = ${f((c.n - 2) * 180 / c.n, 2)}°`, "Exterior angles sum to 360°", [`Each exterior = ${f(360 / c.n, 2)}°`, null, false]] }];
      return [{ title: "Theorem", lines: ["Parallelograms on the same base and between the same parallels are equal in area"] }]; },
    readouts(s, c) { if (c.mode === "poly") return [["Interior sum", (c.n - 2) * 180 + "°"], ["Each interior", f((c.n - 2) * 180 / c.n, 2) + "°"], ["Each exterior", f(360 / c.n, 2) + "°"]]; if (c.mode === "sum") { const aA = angAt([c.ax, c.ay], [c.bx, c.by], [c.cx, c.cy]), aB = angAt([c.bx, c.by], [c.ax, c.ay], [c.cx, c.cy]); return [["A", f(aA, 1) + "°"], ["B", f(aB, 1) + "°"], ["C", f(180 - aA - aB, 1) + "°"]]; } if (c.mode === "sim") return [["Length ratio", "1 : " + c.k], ["Area ratio", "1 : " + f(c.k * c.k, 3)]]; return [["Topic", c.mode]]; },
    steps(s, c) { if (c.mode === "poly") return [`Split the ${c.n}-gon into ${c.n - 2} triangles from one vertex.`, `Sum = ${c.n - 2} × 180° = ${(c.n - 2) * 180}°`, `Exterior angle = 360° ÷ ${c.n} = ${f(360 / c.n, 2)}°`]; if (c.mode === "sum") return ["Draw a line through A parallel to BC.", "Alternate angles move B and C up beside A.", "The three angles lie on a straight line, so they total 180°."]; return ["State the property, then the reason.", "Use symmetry where it helps."]; },
    note: "Know the conditions for congruence (SSS, SAS, ASA, RHS) without proof; properties of special triangles and quadrilaterals; similar triangles (ratio of sides and areas); polygon angle sums (n − 2)180°. Underlined theorems may need formal proof.",
    mistake: "Using AAA to claim congruence — equal angles only prove similarity.",
  });

  /* ---------------- D-d Circle theorems ---------------- */
  MK.def("D-d", {
    title: "Circle theorems", env: "paper",
    values: { th: "centre", A: 200, Bv: 340, Pv: 90, Qv: 120, Cv: 30, Dv: 250 },
    controls: [{ type: "select", key: "th", label: "Theorem", options: [["centre", "Angle at centre = 2 × angle at circumference"], ["semi", "Angle in a semicircle = 90°"], ["seg", "Angles in the same segment are equal"], ["cyclic", "Opposite angles of a cyclic quadrilateral = 180°"], ["tangent", "Tangent ⟂ radius"], ["alt", "Alternate segment theorem"], ["chord", "Perpendicular from centre bisects a chord"]] }],
    hint: "Drag the points round the circle", syncAll: true,
    geo(B) { const a = B.area; return { cx: a.x + a.w / 2, cy: a.y + a.h / 2 + 12, r: Math.min(a.w, a.h) * 0.36 }; },
    pts(c) { const keys = { centre: ["A", "Bv", "Pv"], semi: ["A", "Pv"], seg: ["A", "Bv", "Pv", "Qv"], cyclic: ["A", "Bv", "Cv", "Dv"], tangent: ["A"], alt: ["A", "Bv", "Pv"], chord: ["A", "Bv"] }[c.th]; return keys; },
    draw(g, s, c, B) {
      const P = B.P, { cx, cy, r } = this.geo(B), at = (d) => [cx + Math.cos(-R(d)) * r, cy + Math.sin(-R(d)) * r], O = [cx, cy];
      g.save(); g.shadowColor = P.shadow; g.shadowBlur = 8; B.circle(cx, cy, r, P.ink, P.panel, 2.6); g.restore(); B.circle(cx, cy, r, P.ink, null, 2.6); B.dot(cx, cy, P.ink, 3.5, "O", { dx: 6, dy: 14 });
      const A = at(c.A), Bp = at(c.Bv), Pp = at(c.Pv), Q = at(c.Qv), C = at(c.Cv), Dp = at(c.Dv);
      if (c.th === "centre") { B.line(...O, ...A, P.red, 2.2); B.line(...O, ...Bp, P.red, 2.2); B.line(...Pp, ...A, P.blue, 2.2); B.line(...Pp, ...Bp, P.blue, 2.2); const ac = angAt(O, A, Bp), ap = angAt(Pp, A, Bp); arcAt(B, O, A, Bp, f(ac, 1) + "°", P.red); arcAt(B, Pp, A, Bp, f(ap, 1) + "°", P.blue); s.vals = [ac, ap]; }
      if (c.th === "semi") { const A2 = at(c.A + 180); B.line(...A, ...A2, P.ink, 2.2); B.line(...Pp, ...A, P.blue, 2.2); B.line(...Pp, ...A2, P.blue, 2.2); B.right(...Pp, Math.atan2(A[1] - Pp[1], A[0] - Pp[0]), Math.atan2(A2[1] - Pp[1], A2[0] - Pp[0]), 12, P.red); s.vals = [angAt(Pp, A, A2)]; B.dot(...A2, P.ink, 5, "B"); }
      if (c.th === "seg") { [Pp, Q].forEach((X, i) => { B.line(...X, ...A, i ? P.green : P.blue, 2.2); B.line(...X, ...Bp, i ? P.green : P.blue, 2.2); arcAt(B, X, A, Bp, f(angAt(X, A, Bp), 1) + "°", i ? P.green : P.blue); }); B.line(...A, ...Bp, P.ink, 1.6); s.vals = [angAt(Pp, A, Bp), angAt(Q, A, Bp)]; }
      if (c.th === "cyclic") { const pts = [[c.A, A], [c.Bv, Bp], [c.Cv, C], [c.Dv, Dp]].sort((u, v) => u[0] - v[0]).map((u) => u[1]); B.poly(pts, P.blue, P.fillB, 2.2); const v = pts.map((p, i) => angAt(p, pts[(i + 3) % 4], pts[(i + 1) % 4])); pts.forEach((p, i) => arcAt(B, p, pts[(i + 3) % 4], pts[(i + 1) % 4], f(v[i], 1) + "°", i % 2 ? P.green : P.purple, 20)); s.vals = v; }
      if (c.th === "tangent") { const t = -R(c.A), dir = [-Math.sin(t), Math.cos(t)]; B.line(A[0] - dir[0] * 160, A[1] - dir[1] * 160, A[0] + dir[0] * 160, A[1] + dir[1] * 160, P.green, 2.6); B.line(...O, ...A, P.red, 2.2); B.right(...A, Math.atan2(O[1] - A[1], O[0] - A[0]), Math.atan2(dir[1], dir[0]), 12, P.red); s.vals = [90]; }
      if (c.th === "alt") { const t = -R(c.A), dir = [-Math.sin(t), Math.cos(t)]; const T1 = [A[0] + dir[0] * 140, A[1] + dir[1] * 140], T2 = [A[0] - dir[0] * 140, A[1] - dir[1] * 140]; B.line(...T2, ...T1, P.green, 2.6); B.line(...A, ...Bp, P.ink, 2.2); B.line(...Pp, ...A, P.blue, 2.2); B.line(...Pp, ...Bp, P.blue, 2.2);
        const cand = [T1, T2].map((T0) => ({ T0, d: angAt(A, T0, Bp) })); const ap = angAt(Pp, A, Bp); const use = cand.reduce((m, q) => (Math.abs(q.d - ap) < Math.abs(m.d - ap) ? q : m), cand[0]); arcAt(B, A, use.T0, Bp, f(use.d, 1) + "°", P.purple); arcAt(B, Pp, A, Bp, f(ap, 1) + "°", P.blue); s.vals = [use.d, ap]; }
      if (c.th === "chord") { B.line(...A, ...Bp, P.ink, 2.4); const M = [(A[0] + Bp[0]) / 2, (A[1] + Bp[1]) / 2]; B.line(...O, ...M, P.red, 2, [6, 4]); B.right(...M, Math.atan2(O[1] - M[1], O[0] - M[0]), Math.atan2(Bp[1] - M[1], Bp[0] - M[0]), 10, P.red); B.ticks(...A, ...M, 1); B.ticks(...M, ...Bp, 1); s.vals = [Math.hypot(A[0] - M[0], A[1] - M[1]) / r]; }
      const names = { A: "A", Bv: "B", Pv: "P", Qv: "Q", Cv: "C", Dv: "D" }; this.pts(c).forEach((k) => { if (c.th === "semi" && k === "Bv") return; const p = at(c[k]); B.dot(p[0], p[1], P.red, 6.5); const d = Math.hypot(p[0] - cx, p[1] - cy); B.text(c.th === "cyclic" ? names[k] : names[k], p[0] + (p[0] - cx) / d * 16, p[1] + (p[1] - cy) / d * 16 + 4, { align: "center", w: 800, fam: "serif", size: 14 }); });
    },
    pointer: MK.dragger((s, c, B) => { const sc = MK.scenes["D-d"], { cx, cy, r } = sc.geo(B); return sc.pts(c).map((k) => [cx + Math.cos(-R(c[k])) * r, cy + Math.sin(-R(c[k])) * r]); }, (i, p, s, c, B) => { const sc = MK.scenes["D-d"], { cx, cy } = sc.geo(B); c[sc.pts(c)[i]] = Math.round((D(Math.atan2(-(p.y - cy), p.x - cx)) + 360) % 360); }, 24),
    hud(s, c) { const v = s.vals || []; const L = { centre: ["∠AOB = 2 × ∠APB", `${f(v[0], 1)}° = 2 × ${f(v[1], 1)}°`, "(P on the major arc)"], semi: ["Angle in a semicircle = 90°", `∠APB = ${f(v[0], 1)}°`], seg: ["∠APB = ∠AQB (same segment)", `${f(v[0], 1)}° = ${f(v[1], 1)}°`], cyclic: ["Opposite angles sum to 180°", `${f(v[0], 1)} + ${f(v[2], 1)} = ${f((v[0] || 0) + (v[2] || 0), 1)}°`, `${f(v[1], 1)} + ${f(v[3], 1)} = ${f((v[1] || 0) + (v[3] || 0), 1)}°`], tangent: ["Tangent ⟂ radius at the point of contact", "∠OAT = 90°"], alt: ["Angle between tangent and chord = angle in alternate segment", `${f(v[0], 1)}° = ${f(v[1], 1)}°`], chord: ["Perpendicular from O to a chord bisects it", "AM = MB"] }[c.th]; return [{ title: "Theorem", lines: L }, { title: "Exam tip", lines: ["Underlined theorems may need formal proof in Paper 2"] }]; },
    readouts(s, c) { return (s.vals || []).slice(0, 4).map((v, i) => ["Angle " + (i + 1), f(v, 1) + (c.th === "chord" ? "" : "°")]); },
    steps(s, c) { return { centre: ["Join PO and extend to the circumference.", "Two isosceles triangles: OA = OP = OB (radii).", "Exterior angle of each isosceles triangle = 2 × base angle.", "Add the two parts: ∠AOB = 2∠APB."], semi: ["AB is a diameter, so ∠AOB = 180°.", "Angle at circumference = ½ × 180° = 90°."], seg: ["Both angles stand on the same arc AB.", "Each equals ½∠AOB, so they are equal."], cyclic: ["Angles at the centre on opposite arcs add to 360°.", "Half of 360° is 180°, so opposite angles are supplementary."], tangent: ["The radius to the point of contact is perpendicular to the tangent."], alt: ["The angle between the tangent and chord AB equals any angle in the alternate segment."], chord: ["Triangles OAM and OBM are congruent (RHS), so AM = MB."] }[c.th]; },
    note: "Chords; angle at the centre; angle in a semicircle; same segment; cyclic quadrilateral; tangent–radius; alternate segment theorem; perpendicular bisectors of chords. Formal proofs of the underlined theorems may be required.",
    mistake: "Applying the angle-at-the-centre theorem with P on the minor arc — it then gives the reflex angle.",
  });

  /* ---------------- D-e Construction (animated compass & ruler) ---------------- */
  function construction(kind, B) {
    const a = B.area, s = Math.min(a.w, a.h) / 300, O = [a.x + a.w * 0.22, a.y + a.h * 0.78], L = 210 * s, prims = [];
    const P = (p, lab) => prims.push({ t: "pt", p, lab }), seg = (p, q, col, txt) => prims.push({ t: "line", p, q, col, txt }), arc = (c0, r, a0, a1, txt) => prims.push({ t: "arc", c: c0, r, a0, a1, txt });
    const pol = (c0, r, d) => [c0[0] + Math.cos(-R(d)) * r, c0[1] + Math.sin(-R(d)) * r];
    const circInt = (c1, r1, c2, r2, up = true) => { const dx = c2[0] - c1[0], dy = c2[1] - c1[1], d = Math.hypot(dx, dy), al = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - al * al)), xm = c1[0] + dx * al / d, ym = c1[1] + dy * al / d; const s1 = [xm + h * dy / d, ym - h * dx / d], s2 = [xm - h * dy / d, ym + h * dx / d]; return up ? (s1[1] < s2[1] ? s1 : s2) : (s1[1] < s2[1] ? s2 : s1); };
    const bisectRays = (V, d1, d2, r1, r2, txt) => { const p1 = pol(V, r1, d1), p2 = pol(V, r1, d2); arc(V, r1, Math.min(d1, d2) - 8, Math.max(d1, d2) + 8, "Arc centre vertex cuts both arms"); const mid = (d1 + d2) / 2, X = pol(V, r1 + 0.95 * r2 * Math.cos(R((d2 - d1) / 2)) * 0 + Math.hypot(...[0, 0]), mid);
      const Xp = circInt(p1, r2, p2, r2, true); const Xq = circInt(p1, r2, p2, r2, false); const far = Math.hypot(Xp[0] - V[0], Xp[1] - V[1]) > Math.hypot(Xq[0] - V[0], Xq[1] - V[1]) ? Xp : Xq; const dd = D(Math.atan2(-(far[1] - p1[1]), far[0] - p1[0]));
      arc(p1, r2, dd - 18, dd + 18, "Same radius from the first cut"); const dd2 = D(Math.atan2(-(far[1] - p2[1]), far[0] - p2[0])); arc(p2, r2, dd2 - 18, dd2 + 18, "…and from the second cut"); seg(V, pol(V, L * 0.95, mid), "red", txt || "Join the vertex to the crossing point"); return mid; };
    const base = () => { seg(O, [O[0] + L * 1.25, O[1]], "ink", "Draw the base line with a ruler"); P(O, "A"); };
    const ray60 = (r) => { const p = [O[0] + r, O[1]]; arc(O, r, -10, 75, "Arc centre A, any radius, cuts the line"); arc(p, r, 105, 140, "Same radius from the cut point"); const q = pol(O, r, 60); seg(O, pol(O, L, 60), "soft", "Join A to the crossing: 60°"); return q; };
    const ray90 = (r) => { arc(O, r, -12, 192, "Semicircle centre A cuts the line on both sides"); const p = [O[0] - r, O[1]], q = [O[0] + r, O[1]], r2 = r * 1.3, X = circInt(p, r2, q, r2, true); arc(p, r2, 40, 75, "Larger radius from the left cut"); arc(q, r2, 105, 140, "Same radius from the right cut"); seg(O, pol(O, L, 90), "soft", "Join A to the crossing: 90°"); };
    const r0 = 70 * s, r2 = 66 * s;
    if (kind === "bisectSeg") { const A = [a.x + a.w * 0.2, a.y + a.h * 0.6], Bq = [a.x + a.w * 0.8, a.y + a.h * 0.6], rr = Math.hypot(Bq[0] - A[0], 0) * 0.62; seg(A, Bq, "ink", "Draw AB"); P(A, "A"); P(Bq, "B"); arc(A, rr, -60, 60, "Radius more than half AB, centre A"); arc(Bq, rr, 120, 240, "Same radius, centre B"); const X1 = circInt(A, rr, Bq, rr, true), X2 = circInt(A, rr, Bq, rr, false); seg(X1, X2, "red", "Join the crossings: perpendicular bisector"); P([(A[0] + Bq[0]) / 2, A[1]], "M"); return { prims, deg: null }; }
    if (kind === "bisectAng") { base(); const d2 = 70; seg(O, pol(O, L, d2), "ink", "Draw the second arm"); bisectRays(O, 0, d2, r0, r2, "Join A to the crossing: bisector (35°)"); return { prims, deg: 35 }; }
    if (kind === "a60") { base(); ray60(r0); return { prims, deg: 60 }; }
    if (kind === "a90") { base(); ray90(r0); return { prims, deg: 90 }; }
    if (kind === "a30") { base(); ray60(r0); bisectRays(O, 0, 60, r0 * 1.4, r2, "Bisect 60° → 30°"); return { prims, deg: 30 }; }
    if (kind === "a45") { base(); ray90(r0); bisectRays(O, 0, 90, r0 * 1.5, r2, "Bisect 90° → 45°"); return { prims, deg: 45 }; }
    if (kind === "a75") { base(); ray60(r0); ray90(r0 * 0.75); bisectRays(O, 60, 90, r0 * 1.6, r2 * 0.8, "Bisect between 60° and 90° → 75°"); return { prims, deg: 75 }; }
    if (kind === "a120") { base(); const p = [O[0] + r0, O[1]]; arc(O, r0, -10, 135, "Arc centre A cuts the line"); arc(p, r0, 105, 140, "Step the radius once (60°)"); const q = pol(O, r0, 60); arc(q, r0, 165, 200, "Step again (120°)"); seg(O, pol(O, L, 120), "red", "Join A: 120°"); return { prims, deg: 120 }; }
    if (kind === "a135") { base(); ray90(r0); seg(O, [O[0] - L * 0.7, O[1]], "ink", "Extend the line to the left"); bisectRays(O, 90, 180, r0 * 1.5, r2, "Bisect 90°–180° → 135°"); return { prims, deg: 135 }; }
    if (kind === "tri") { const a1 = 7, b1 = 6, c1 = 8, k = Math.min(a.w * 0.6 / c1, a.h * 0.55 / b1), A = [a.x + a.w * 0.15, a.y + a.h * 0.78], Bq = [A[0] + c1 * k, A[1]]; seg(A, Bq, "ink", "Draw AB = 8 cm"); P(A, "A"); P(Bq, "B"); const C = circInt(A, b1 * k, Bq, a1 * k, true);
      const dA = D(Math.atan2(-(C[1] - A[1]), C[0] - A[0])), dB = D(Math.atan2(-(C[1] - Bq[1]), C[0] - Bq[0])); arc(A, b1 * k, dA - 15, dA + 15, "Radius 6 cm, centre A"); arc(Bq, a1 * k, dB - 15, dB + 15, "Radius 7 cm, centre B"); seg(A, C, "blue", "Join AC"); seg(Bq, C, "blue", "Join BC"); P(C, "C"); return { prims, deg: null }; }
    // perpendicular from a point to a line
    const Pp = [a.x + a.w * 0.5, a.y + a.h * 0.28], y = a.y + a.h * 0.72; seg([a.x + 10, y], [a.x + a.w - 10, y], "ink", "The given line"); P(Pp, "P"); const rr = (y - Pp[1]) * 1.35, dx = Math.sqrt(rr * rr - (y - Pp[1]) ** 2), Q1 = [Pp[0] - dx, y], Q2 = [Pp[0] + dx, y];
    arc(Pp, rr, -90 - 45, -90 + 45, "Centre P: arc cuts the line twice"); arc(Q1, rr, -60, -20, "Same radius from the left cut (below the line)"); arc(Q2, rr, 200, 240, "…and from the right cut"); const S = [Pp[0], y + (y - Pp[1])]; seg(Pp, S, "red", "Join P to the crossing: perpendicular"); return { prims, deg: 90 };
  }
  const CONS = [["bisectSeg", "Bisect a line segment"], ["bisectAng", "Bisect an angle"], ["perp", "Perpendicular from a point to a line"], ["a60", "Construct 60°"], ["a90", "Construct 90°"], ["a30", "Construct 30°"], ["a45", "Construct 45°"], ["a75", "Construct 75°"], ["a120", "Construct 120°"], ["a135", "Construct 135°"], ["tri", "Triangle from 3 sides (8, 7, 6 cm)"]];
  MK.def("D-e", {
    title: "Geometrical construction", env: "desk",
    values: { kind: "a60", speed: 1 },
    controls: [{ type: "select", key: "kind", label: "Construction", options: CONS }, { key: "speed", label: "Speed", min: 0.25, max: 3, step: 0.25, unit: "×" }],
    state: () => ({ p: 0 }), onChange(s, c, k) { if (k === "kind" || k === "_reset") s.p = 0; },
    actions: [{ label: "◀ Step back", run: (s) => { s.p = Math.max(0, Math.ceil(s.p) - 1); } }, { label: "Step ▶", run: (s) => { s.p = Math.floor(s.p) + 1; } }],
    tick(dt, s, c, H) { const n = (H.B && construction(c.kind, H.B).prims.length) || 8; if (s.p < n) s.p = Math.min(n, s.p + dt * 0.6 * c.speed); return s.p < n; },
    draw(g, s, c, B) {
      const P = B.P, { prims, deg } = construction(c.kind, B), col = { ink: P.ink, red: P.red, blue: P.blue, soft: P.soft }, n = prims.length;
      let cur = null;
      prims.forEach((q, i) => { const t = MK.clamp(s.p - i, 0, 1); if (t <= 0) return; const active = t < 1;
        if (q.t === "pt") { if (t > 0.3) B.dot(q.p[0], q.p[1], P.ink, 3.5, q.lab, { dx: -14, dy: 16, size: 13 }); }
        else if (q.t === "line") { const e = [q.p[0] + (q.q[0] - q.p[0]) * t, q.p[1] + (q.q[1] - q.p[1]) * t]; B.line(q.p[0], q.p[1], e[0], e[1], col[q.col] || P.ink, q.col === "red" ? 2.6 : 1.8); if (active) { B.ruler(q.p[0], q.p[1] + 4, Math.hypot(q.q[0] - q.p[0], q.q[1] - q.p[1]), Math.atan2(q.q[1] - q.p[1], q.q[0] - q.p[0])); cur = q; } }
        else { const a0 = -R(q.a0), a1 = -R(q.a0 + (q.a1 - q.a0) * t); B.arc(q.c[0], q.c[1], q.r, a1, a0, MK.isNight() ? "#a9b6d3" : "#6b7280", 1.3); if (active) { B.compass(q.c[0], q.c[1], q.c[0] + Math.cos(a1) * q.r, q.c[1] + Math.sin(a1) * q.r); cur = q; } } });
      const k = Math.min(n - 1, Math.floor(s.p)); const step = prims.slice(0, k + 1).filter((q) => q.txt).pop();
      if (step) B.pill("Step: " + step.txt, B.area.x + 6, B.area.y + B.area.h - 4, P.panelInk, 11);
      if (deg && s.p >= n) B.protractor(B.area.x + B.area.w * 0.22, B.area.y + B.area.h * 0.78, 80 * Math.min(B.area.w, B.area.h) / 300, 0);
    },
    hud(s, c) { const name = CONS.find((x) => x[0] === c.kind)[1]; return [{ title: "Construction", lines: [name, "Instruments: ruler, compasses, pencil", "Leave all construction arcs visible", "—", "Check with a protractor at the end"] }]; },
    readouts(s, c) { const B = { area: { x: 0, y: 0, w: 372, h: 372 } }, n = construction(c.kind, B).prims.length; return [["Progress", Math.min(n, Math.floor(s.p)) + " / " + n], ["Construction", CONS.find((x) => x[0] === c.kind)[1]]]; },
    steps(s, c) { const B = { area: { x: 0, y: 0, w: 372, h: 372 } }; return construction(c.kind, B).prims.filter((q) => q.txt).map((q) => q.txt); },
    note: "Bisectors of angles and line segments; lines parallel or perpendicular to a given line; angles 90°, 60°, 45°, 30° and combinations (75°, 105°, 135°…); triangles and quadrilaterals from sufficient data. Use only ruler and compasses.",
    mistake: "Rubbing out construction arcs — examiners award marks for visible construction lines.",
  });

  /* ---------------- D-f Loci ---------------- */
  MK.def("D-f", {
    title: "Loci", env: "paper",
    values: { mode: "twoPoints", d: 3, ax: -3, ay: 0, bx: 3, by: 1, l2: 50, region: 0, inter: 1 },
    controls: [{ type: "tabs", key: "mode", label: "Locus", options: [["point", "Fixed distance from a point"], ["twoPoints", "Equidistant from two points"], ["twoLines", "Equidistant from two lines"], ["line", "Fixed distance from a line"], ["combo", "Intersection of loci"]] }, { key: "d", label: "Distance d", min: 0.5, max: 7, step: 0.5, unit: "cm" }, { key: "l2", label: "Angle between the lines", min: 10, max: 170, unit: "°", show: W("mode", "twoLines") }, { type: "toggle", key: "region", label: "Shade the region (inside / nearer A)", show: W("mode", "point", "twoPoints", "combo") }],
    hint: "Drag A and B",
    draw(g, s, c, B) {
      const P = B.P, m = B.axes({ xmin: -8, xmax: 8, ymin: -6, ymax: 6, labels: false, xstep: 1, ystep: 1 }); s.m = m; const k = m.X(1) - m.X(0);
      const A = [m.X(c.ax), m.Y(c.ay)], Bp = [m.X(c.bx), m.Y(c.by)];
      if (c.mode === "point" || c.mode === "combo") { if (c.region) B.circle(A[0], A[1], c.d * k, null, P.fillB); B.circle(A[0], A[1], c.d * k, P.red, null, 2.6); }
      if (c.mode === "twoPoints" || c.mode === "combo") { const mx = (A[0] + Bp[0]) / 2, my = (A[1] + Bp[1]) / 2, dx = Bp[0] - A[0], dy = Bp[1] - A[1], L = 900, n = Math.hypot(dx, dy) || 1, ux = -dy / n, uy = dx / n;
        if (c.region) { g.save(); g.beginPath(); g.rect(m.r.x, m.r.y, m.r.w, m.r.h); g.clip(); g.beginPath(); g.moveTo(mx + ux * L, my + uy * L); g.lineTo(mx - ux * L, my - uy * L); g.lineTo(mx - ux * L - dx / n * L, my - uy * L - dy / n * L); g.lineTo(mx + ux * L - dx / n * L, my + uy * L - dy / n * L); g.closePath(); g.fillStyle = P.fillA; g.fill(); g.restore(); }
        g.save(); g.beginPath(); g.rect(m.r.x, m.r.y, m.r.w, m.r.h); g.clip(); B.line(mx + ux * L, my + uy * L, mx - ux * L, my - uy * L, P.green, 2.6); g.restore(); B.line(A[0], A[1], Bp[0], Bp[1], P.soft, 1.2, [4, 4]); B.right(mx, my, Math.atan2(dy, dx), Math.atan2(uy, ux), 10, P.green); }
      if (c.mode === "combo") { // circle ∩ perpendicular bisector
        const mx = (c.ax + c.bx) / 2, my = (c.ay + c.by) / 2, dx = c.bx - c.ax, dy = c.by - c.ay, n = Math.hypot(dx, dy), ux = -dy / n, uy = dx / n, h = Math.hypot(mx - c.ax, my - c.ay); if (c.d >= h) { const t = Math.sqrt(c.d * c.d - h * h); [[mx + ux * t, my + uy * t], [mx - ux * t, my - uy * t]].forEach((p) => B.dot(m.X(p[0]), m.Y(p[1]), P.purple, 7, `(${f(p[0], 2)}, ${f(p[1], 2)})`)); } else B.text("No intersection: d is less than half of AB", m.r.x + 10, m.r.y + m.r.h - 10, { color: P.red, w: 700 }); }
      if (c.mode === "twoLines") { const O = [m.X(0), m.Y(-1)], t2 = R(c.l2), L = 600; B.line(O[0] - L, O[1], O[0] + L, O[1], P.ink, 2.4); B.line(O[0] - Math.cos(t2) * L, O[1] + Math.sin(t2) * L, O[0] + Math.cos(t2) * L, O[1] - Math.sin(t2) * L, P.ink, 2.4);
        [t2 / 2, t2 / 2 + Math.PI / 2].forEach((b, i) => B.line(O[0] - Math.cos(b) * L, O[1] + Math.sin(b) * L, O[0] + Math.cos(b) * L, O[1] - Math.sin(b) * L, i ? P.purple : P.green, 2.4, i ? [8, 5] : null));
        const q = [O[0] + Math.cos(t2 / 2) * 4 * k, O[1] - Math.sin(t2 / 2) * 4 * k]; B.dot(q[0], q[1], P.red, 5); const foot1 = [q[0], O[1]], s2 = [Math.cos(t2), -Math.sin(t2)], v = [q[0] - O[0], q[1] - O[1]], tt = v[0] * s2[0] + v[1] * s2[1], foot2 = [O[0] + s2[0] * tt, O[1] + s2[1] * tt]; B.line(...q, ...foot1, P.red, 1.4, [4, 3]); B.line(...q, ...foot2, P.red, 1.4, [4, 3]); B.ticks(...q, ...foot1, 1, P.red); B.ticks(...q, ...foot2, 1, P.red); B.angle(O[0], O[1], 0, -t2 / 2, 30, P.green, ""); B.angle(O[0], O[1], -t2 / 2, -t2, 36, P.green, ""); }
      if (c.mode === "line") { const y = m.Y(0); B.line(m.r.x, y, m.r.x + m.r.w, y, P.ink, 2.6); [1, -1].forEach((sg) => B.line(m.r.x, y - sg * c.d * k, m.r.x + m.r.w, y - sg * c.d * k, P.red, 2.4, [10, 6])); B.arrow(m.X(4), y, m.X(4), y - c.d * k, P.soft, 1.6, 8); B.text("d = " + c.d, m.X(4) + 6, y - c.d * k / 2, { size: 11.5 }); }
      if (c.mode !== "twoLines" && c.mode !== "line") { B.dot(A[0], A[1], P.blue, 7, "A"); if (c.mode !== "point") B.dot(Bp[0], Bp[1], P.blue, 7, "B"); }
      B.text("1 square = 1 cm", m.r.x + m.r.w - 6, m.r.y + m.r.h - 6, { size: 10, color: P.soft, align: "right" });
    },
    pointer: MK.dragger((s, c) => (s.m ? [[s.m.X(c.ax), s.m.Y(c.ay)], [s.m.X(c.bx), s.m.Y(c.by)]] : []), (i, p, s, c) => { c[i ? "bx" : "ax"] = MK.clamp(snap(s.m.ix(p.x)), -7.5, 7.5); c[i ? "by" : "ay"] = MK.clamp(snap(s.m.iy(p.y)), -5.5, 5.5); }),
    hud(s, c) { const L = { point: ["Locus: circle, centre A, radius d", `radius = ${c.d} cm`], twoPoints: ["Locus: perpendicular bisector of AB", "every point on it is equally far from A and B"], twoLines: ["Locus: the two angle bisectors", `${f(c.l2 / 2, 1)}° and ${f(90 + c.l2 / 2, 1)}° to the first line`], line: ["Locus: two lines parallel to the given line", `each ${c.d} cm away`], combo: ["Points d from A AND equidistant from A and B", "= intersection of circle and perpendicular bisector"] }[c.mode]; return [{ title: "Locus", lines: L }]; },
    readouts(s, c) { return [["A", `(${c.ax}, ${c.ay})`], ["B", `(${c.bx}, ${c.by})`], ["|AB|", f(Math.hypot(c.bx - c.ax, c.by - c.ay), 3) + " cm"]]; },
    steps(s, c) { return { point: ["Set compasses to d.", "Draw a full circle centred on A."], twoPoints: ["With radius more than ½AB, draw arcs from A and B on both sides.", "Join the crossing points — that line is the locus."], twoLines: ["Bisect the angle between the lines with compasses.", "Bisect the adjacent angle too — both bisectors form the locus."], line: ["Draw perpendiculars of length d on both sides.", "Draw lines through their ends parallel to the given line."], combo: ["Construct each locus separately.", "The required points are where the loci meet."] }[c.mode]; },
    note: "Know these loci and their intersections in two dimensions; consider parallel and intersecting lines; real-life applications (e.g. a goat tied to a post).",
    mistake: "Drawing only one angle bisector for two intersecting lines — there are two perpendicular bisectors.",
  });

  /* ---------------- E-i … E-iv Coordinate geometry ---------------- */
  const gridScene = (key, def) => MK.def(key, Object.assign({ env: "paper", hint: "Drag the points", syncAll: true }, def, {
    pointer: MK.dragger((s, c) => (s.m ? def.pts(c).map((k) => [s.m.X(c[k + "x"]), s.m.Y(c[k + "y"])]) : []), (i, p, s, c) => { const k = def.pts(c)[i]; c[k + "x"] = MK.clamp(snap(s.m.ix(p.x)), -9, 9); c[k + "y"] = MK.clamp(snap(s.m.iy(p.y)), -9, 9); }),
  }));
  const nb = (v) => (v < 0 ? "(" + f(v) + ")" : f(v));
  const quad = (x, y) => (x > 0 && y > 0 ? "I" : x < 0 && y > 0 ? "II" : x < 0 && y < 0 ? "III" : x > 0 && y < 0 ? "IV" : "on an axis");
  gridScene("E-i", {
    title: "The x–y plane", values: { Px: 3, Py: 4, tx: -4, ty: 2, seed: 1 }, pts: () => ["P"],
    actions: [{ label: "New target", run: (s, c) => { c.seed++; const r = MK.rng(c.seed * 7919); c.tx = MK.ri(-8, 8, r); c.ty = MK.ri(-8, 8, r); } }],
    draw(g, s, c, B) { const P = B.P, m = B.axes({ xmin: -10, xmax: 10, ymin: -10, ymax: 10, xstep: 1, ystep: 1 }); s.m = m;
      const q = quad(c.Px, c.Py); [["I", 1, 1], ["II", -1, 1], ["III", -1, -1], ["IV", 1, -1]].forEach(([n, sx, sy]) => { if (n === q) { g.save(); g.fillStyle = P.fillA; g.fillRect(Math.min(m.X(0), m.X(10 * sx)), Math.min(m.Y(0), m.Y(10 * sy)), Math.abs(m.X(10 * sx) - m.X(0)), Math.abs(m.Y(10 * sy) - m.Y(0))); g.restore(); } B.text(n, m.X(7 * sx), m.Y(8.5 * sy), { align: "center", size: 16, w: 800, color: P.soft, fam: "serif" }); });
      B.circle(m.X(c.tx), m.Y(c.ty), 12, P.green, null, 2.4, [4, 3]); B.text(`target (${c.tx}, ${c.ty})`, m.X(c.tx) + 14, m.Y(c.ty) + 18, { size: 10.5, color: P.green, w: 700 });
      B.line(m.X(c.Px), m.Y(c.Py), m.X(c.Px), m.Y(0), P.red, 1.2, [4, 3]); B.line(m.X(c.Px), m.Y(c.Py), m.X(0), m.Y(c.Py), P.red, 1.2, [4, 3]); B.dot(m.X(c.Px), m.Y(c.Py), P.red, 7, `P(${f(c.Px)}, ${f(c.Py)})`);
      if (c.Px === c.tx && c.Py === c.ty) B.pill("✓ On target!", m.r.x + 8, m.r.y + m.r.h - 8, P.green, 12); },
    hud(s, c) { return [{ title: "Coordinates", lines: ["(x, y): across first, then up", `P = (${f(c.Px)}, ${f(c.Py)})`, `Quadrant ${quad(c.Px, c.Py)}`] }]; },
    readouts(s, c) { return [["P", `(${f(c.Px)}, ${f(c.Py)})`], ["Quadrant", quad(c.Px, c.Py)], ["Target", c.Px === c.tx && c.Py === c.ty ? "hit ✓" : `(${c.tx}, ${c.ty})`]]; },
    steps(s, c) { return [`Start at the origin O(0, 0).`, `Move ${Math.abs(c.Px)} ${c.Px >= 0 ? "right" : "left"} along the x-axis.`, `Move ${Math.abs(c.Py)} ${c.Py >= 0 ? "up" : "down"} parallel to the y-axis.`, `Mark P(${f(c.Px)}, ${f(c.Py)}).`]; },
    note: "The concept of the x–y plane; coordinates of points. The x-coordinate is always written first.", mistake: "Swapping x and y: (3, 4) is 3 across and 4 up, not 3 up.",
  });
  gridScene("E-ii", {
    title: "Midpoint & distance", values: { Px: -4, Py: -2, Qx: 5, Qy: 4 }, pts: () => ["P", "Q"],
    draw(g, s, c, B) { const P = B.P, m = B.axes({ xmin: -10, xmax: 10, ymin: -10, ymax: 10, xstep: 1, ystep: 1 }); s.m = m; const p = [m.X(c.Px), m.Y(c.Py)], q = [m.X(c.Qx), m.Y(c.Qy)], k = [q[0], p[1]];
      B.poly([p, k, q], null, P.fillB); B.line(...p, ...k, P.blue, 1.8, [5, 4]); B.line(...k, ...q, P.blue, 1.8, [5, 4]); B.text("Δx = " + f(c.Qx - c.Px), (p[0] + k[0]) / 2, p[1] + (q[1] < p[1] ? 16 : -6), { align: "center", size: 11, color: P.blue, w: 700 }); B.text("Δy = " + f(c.Qy - c.Py), k[0] + 6, (k[1] + q[1]) / 2, { size: 11, color: P.blue, w: 700 });
      B.line(...p, ...q, P.red, 2.6); const M = [(c.Px + c.Qx) / 2, (c.Py + c.Qy) / 2]; B.dot(m.X(M[0]), m.Y(M[1]), P.green, 6, `M(${f(M[0])}, ${f(M[1])})`, { dy: 18 }); B.dot(...p, P.red, 7, `P(${f(c.Px)}, ${f(c.Py)})`); B.dot(...q, P.red, 7, `Q(${f(c.Qx)}, ${f(c.Qy)})`); B.ticks(...p, m.X(M[0]), m.Y(M[1]), 1); B.ticks(m.X(M[0]), m.Y(M[1]), ...q, 1); },
    hud(s, c) { const d = Math.hypot(c.Qx - c.Px, c.Qy - c.Py); return [{ title: "Formulae", lines: ["M = ((x₁ + x₂)/2, (y₁ + y₂)/2)", `= ((${nb(c.Px)} + ${nb(c.Qx)})/2, (${nb(c.Py)} + ${nb(c.Qy)})/2) = (${f((c.Px + c.Qx) / 2)}, ${f((c.Py + c.Qy) / 2)})`, "|PQ| = √[(x₂ − x₁)² + (y₂ − y₁)²]", `= √(${f(c.Qx - c.Px)}² + ${f(c.Qy - c.Py)}²)`, [`= ${f(d, 4)} units`, null, true]] }]; },
    readouts(s, c) { return [["Midpoint", `(${f((c.Px + c.Qx) / 2)}, ${f((c.Py + c.Qy) / 2)})`], ["|PQ|", f(Math.hypot(c.Qx - c.Px, c.Qy - c.Py), 4)], ["|PQ|²", f((c.Qx - c.Px) ** 2 + (c.Qy - c.Py) ** 2)]]; },
    steps(s, c) { const dx = c.Qx - c.Px, dy = c.Qy - c.Py; return [`x₂ − x₁ = ${c.Qx} − (${c.Px}) = ${dx}`, `y₂ − y₁ = ${c.Qy} − (${c.Py}) = ${dy}`, `|PQ| = √(${dx * dx} + ${dy * dy}) = √${dx * dx + dy * dy} = ${f(Math.hypot(dx, dy), 4)}`, `Midpoint = (${f((c.Px + c.Qx) / 2)}, ${f((c.Py + c.Qy) / 2)})`]; },
    note: "Midpoint of P(x₁, y₁) and Q(x₂, y₂); distance |PQ| = √[(x₂ − x₁)² + (y₂ − y₁)²] — Pythagoras on the grid.", mistake: "Subtracting in the midpoint formula. The midpoint uses the average (add, then halve).",
  });
  gridScene("E-iii", {
    title: "Gradient of a line", values: { Px: -3, Py: -2, Qx: 4, Qy: 3 }, pts: () => ["P", "Q"],
    draw(g, s, c, B) { const P = B.P, m = B.axes({ xmin: -10, xmax: 10, ymin: -10, ymax: 10, xstep: 1, ystep: 1 }); s.m = m; const dx = c.Qx - c.Px, dy = c.Qy - c.Py;
      if (dx) { const mm = dy / dx; B.plot(m, (x) => c.Py + mm * (x - c.Px), P.soft, 1.6, { dash: [6, 4] }); } else B.line(m.X(c.Px), m.r.y, m.X(c.Px), m.r.y + m.r.h, P.soft, 1.6, [6, 4]);
      const p = [m.X(c.Px), m.Y(c.Py)], q = [m.X(c.Qx), m.Y(c.Qy)], k = [q[0], p[1]]; B.poly([p, k, q], P.amber, P.fillA, 1.6); B.text("run = " + f(dx), (p[0] + k[0]) / 2, p[1] + 16, { align: "center", size: 11.5, w: 700, color: P.amber }); B.text("rise = " + f(dy), k[0] + 6, (k[1] + q[1]) / 2, { size: 11.5, w: 700, color: P.amber });
      B.line(...p, ...q, P.red, 2.8); if (dx) B.angle(p[0], p[1], 0, Math.atan2(q[1] - p[1], q[0] - p[0]) * (dx < 0 ? 1 : 1), 26, P.purple, "θ"); B.dot(...p, P.red, 7, "P"); B.dot(...q, P.red, 7, "Q"); },
    hud(s, c) { const dx = c.Qx - c.Px, dy = c.Qy - c.Py; return [{ title: "Gradient", lines: ["m = (y₂ − y₁)/(x₂ − x₁) = rise/run", `= (${nb(c.Qy)} − ${nb(c.Py)})/(${nb(c.Qx)} − ${nb(c.Px)})`, dx ? [`= ${MK.toFr(dy / dx).str()} = ${f(dy / dx, 4)}`, null, true] : ["undefined (vertical line)", "#ff7b72"], dx ? `θ = tan⁻¹ m = ${f(D(Math.atan(dy / dx)), 2)}°` : "θ = 90°"] }, { title: "Sign", lines: [!dx ? "vertical: undefined" : dy === 0 ? "horizontal: m = 0" : dy / dx > 0 ? "positive: rises left to right" : "negative: falls left to right"] }]; },
    readouts(s, c) { const dx = c.Qx - c.Px, dy = c.Qy - c.Py; return [["Gradient m", dx ? MK.toFr(dy / dx).str() : "undefined"], ["Decimal", dx ? f(dy / dx, 4) : "—"], ["Angle with x-axis", dx ? f(D(Math.atan(dy / dx)), 2) + "°" : "90°"]]; },
    steps(s, c) { const dx = c.Qx - c.Px, dy = c.Qy - c.Py; return [`Rise = ${c.Qy} − (${c.Py}) = ${dy}`, `Run = ${c.Qx} − (${c.Px}) = ${dx}`, dx ? `m = ${dy}/${dx} = ${MK.toFr(dy / dx).str()}` : "Run = 0, gradient undefined"]; },
    note: "Gradient (slope) m = (y₂ − y₁)/(x₂ − x₁).", mistake: "Mixing the order: (y₂ − y₁)/(x₁ − x₂) gives the wrong sign.",
  });
  gridScene("E-iv", {
    title: "Equation of a straight line", values: { Px: -2, Py: -3, Qx: 4, Qy: 1, Rx: 1, Ry: 5, par: 1, perp: 1 }, pts: () => ["P", "Q", "R"],
    controls: [{ type: "toggle", key: "par", label: "Parallel line through R" }, { type: "toggle", key: "perp", label: "Perpendicular line through R" }],
    draw(g, s, c, B) { const P = B.P, m = B.axes({ xmin: -10, xmax: 10, ymin: -10, ymax: 10, xstep: 1, ystep: 1 }); s.m = m; const dx = c.Qx - c.Px, dy = c.Qy - c.Py, mm = dx ? dy / dx : null;
      if (mm !== null) { B.plot(m, (x) => c.Py + mm * (x - c.Px), P.red, 2.8); if (c.par) B.plot(m, (x) => c.Ry + mm * (x - c.Rx), P.blue, 2, { dash: [7, 5] }); if (c.perp) { if (mm) B.plot(m, (x) => c.Ry - (x - c.Rx) / mm, P.green, 2, { dash: [7, 5] }); else B.line(m.X(c.Rx), m.r.y, m.X(c.Rx), m.r.y + m.r.h, P.green, 2, [7, 5]); } B.dot(m.X(0), m.Y(c.Py - mm * c.Px), P.purple, 5, "c = " + f(c.Py - mm * c.Px, 3), { dx: 8 }); }
      else B.line(m.X(c.Px), m.r.y, m.X(c.Px), m.r.y + m.r.h, P.red, 2.8);
      B.dot(m.X(c.Px), m.Y(c.Py), P.red, 7, "P"); B.dot(m.X(c.Qx), m.Y(c.Qy), P.red, 7, "Q"); if (c.par || c.perp) B.dot(m.X(c.Rx), m.Y(c.Ry), P.blue, 7, "R"); },
    eq(c) { const dx = c.Qx - c.Px, dy = c.Qy - c.Py; if (!dx) return { mi: "x = " + f(c.Px), pg: "x = " + f(c.Px) }; const mm = MK.toFr(dy / dx), cc = MK.toFr(c.Py - dy / dx * c.Px); return { m: dy / dx, mi: `y = ${mm.str()}x ${cc.v < 0 ? "− " + MK.toFr(-cc.v).str() : "+ " + cc.str()}`, pg: `y − (${c.Py}) = ${mm.str()}(x − (${c.Px}))` }; },
    hud(s, c) { const e = this.eq(c), L = ["y = mx + c", e.mi, "y − y₁ = m(x − x₁)", e.pg]; if (e.m != null && (c.par || c.perp)) L.push("—", c.par ? `parallel: same m = ${MK.toFr(e.m).str()}` : "", c.perp && e.m ? `perpendicular: m₂ = −1/m = ${MK.toFr(-1 / e.m).str()}` : ""); return [{ title: "Equation", lines: L.filter((x) => x !== "") }]; },
    readouts(s, c) { const e = this.eq(c); return [["Line PQ", e.mi], ["Gradient", e.m == null ? "undefined" : MK.toFr(e.m).str()], ["y-intercept c", e.m == null ? "—" : f(c.Py - e.m * c.Px, 3)]]; },
    steps(s, c) { const e = this.eq(c); if (e.m == null) return ["x₁ = x₂, so the line is vertical: " + e.mi]; return [`m = (${nb(c.Qy)} − ${nb(c.Py)})/(${nb(c.Qx)} − ${nb(c.Px)}) = ${MK.toFr(e.m).str()}`, `Use y − y₁ = m(x − x₁) with P(${c.Px}, ${c.Py}): ${e.pg}`, `Rearrange: ${e.mi}`, c.perp && e.m ? `Perpendicular through R: gradient −1/m = ${MK.toFr(-1 / e.m).str()}` : ""].filter(Boolean); },
    note: "Equation of a line in the forms y = mx + c and y − y₁ = m(x − x₁), where m is the gradient and c is a constant.", mistake: "Writing c as the x-intercept. c is where the line crosses the y-axis.",
  });
})();
