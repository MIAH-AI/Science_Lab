/* m-algebra.js — WAEC Core Mathematics, Topic B: Algebraic Processes (B-a … B-i). */
(function () {
  "use strict";
  const MK = window.MK, f = MK.fmt, T = MK.table, W = MK.when;
  const sgn = (v, first) => (v < 0 ? (first ? "−" : " − ") : first ? "" : " + ") + f(Math.abs(v));
  const term = (coef, v, first) => { if (!coef) return ""; const a = Math.abs(coef); return (coef < 0 ? (first ? "−" : " − ") : first ? "" : " + ") + (a === 1 && v ? "" : f(a)) + v; };
  const lin = (a, b, v = "x") => (term(a, v, true) + (b ? sgn(b, !a) : "")) || "0";
  MK.lin = lin;
  /* half-plane clipping (Sutherland–Hodgman) for feasible regions: constraint {a,b,c,op} means a x + b y op c */
  MK.clipRegion = (cons, box) => {
    let poly = [[box[0], box[2]], [box[1], box[2]], [box[1], box[3]], [box[0], box[3]]];
    cons.forEach(({ a, b, c, op }) => {
      const inside = (p) => { const v = a * p[0] + b * p[1] - c; return op === "<=" || op === "<" ? v <= 1e-9 : v >= -1e-9; }, out = [];
      for (let i = 0; i < poly.length; i++) { const P = poly[i], Q = poly[(i + 1) % poly.length], pi = inside(P), qi = inside(Q);
        if (pi) out.push(P); if (pi !== qi) { const d1 = a * P[0] + b * P[1] - c, d2 = a * Q[0] + b * Q[1] - c, t = d1 / (d1 - d2); out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); } }
      poly = out;
    });
    return poly;
  };

  /* ---------------- B-a Algebraic expressions ---------------- */
  MK.def("B-a", {
    title: "Algebraic expressions", env: "desk",
    values: { scen: "shop", p: 4, q: 3, x: 60, y: 20, age: 12 },
    controls: [{ type: "tabs", key: "scen", label: "Situation", options: [["shop", "Shopping"], ["age", "Ages"], ["taxi", "Taxi fare"]] },
      { key: "p", label: "Number of pens", min: 0, max: 10, show: W("scen", "shop") }, { key: "q", label: "Number of oranges", min: 0, max: 10, show: W("scen", "shop") },
      { key: "x", label: "x (price of a pen / km driven)", min: 0, max: 200, step: 5, unit: "", show: W("scen", "shop", "taxi") }, { key: "y", label: "y (price of an orange / flag-down fee)", min: 0, max: 500, step: 5, show: W("scen", "shop", "taxi") }, { key: "age", label: "Ada's age x", min: 1, max: 40, show: W("scen", "age") }],
    expr(c) { if (c.scen === "shop") return { e: `C = ${c.p}x + ${c.q}y`, sub: `${c.p}(${c.x}) + ${c.q}(${c.y})`, v: c.p * c.x + c.q * c.y, unit: "naira", words: `Cost of ${c.p} pens at x naira and ${c.q} oranges at y naira` };
      if (c.scen === "age") return { e: "F = 3x + 4", sub: `3(${c.age}) + 4`, v: 3 * c.age + 4, unit: "years", words: "Ada is x years old. Her father is 4 years more than 3 times her age." };
      return { e: "C = y + 150x", sub: `${c.y} + 150(${c.x})`, v: c.y + 150 * c.x, unit: "naira", words: "A taxi charges a flag-down fee of y naira plus ₦150 per km for x km." }; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area, E = this.expr(c);
      B.text(E.words, a.x + 16, a.y + 46, { size: 11.5, color: P.soft });
      if (c.scen === "shop") {
        const pen = (x, y) => { g.save(); g.translate(x, y); g.rotate(-0.5); const gr = g.createLinearGradient(0, -4, 0, 4); gr.addColorStop(0, "#3b82f6"); gr.addColorStop(1, "#1e3a8a"); g.fillStyle = gr; g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = 4; g.fillRect(-28, -4, 48, 8); g.fillStyle = "#e5e7eb"; g.beginPath(); g.moveTo(20, -4); g.lineTo(30, 0); g.lineTo(20, 4); g.fill(); g.fillStyle = "#111"; g.fillRect(-30, -4, 5, 8); g.restore(); };
        const orange = (x, y) => { g.save(); const gr = g.createRadialGradient(x - 5, y - 5, 2, x, y, 15); gr.addColorStop(0, "#ffd08a"); gr.addColorStop(0.5, "#f59e0b"); gr.addColorStop(1, "#b45309"); g.fillStyle = gr; g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = 5; g.beginPath(); g.arc(x, y, 14, 0, MK.TAU); g.fill(); g.restore(); B.line(x, y - 14, x + 3, y - 19, "#3f6212", 2); };
        for (let i = 0; i < c.p; i++) pen(a.x + 50 + (i % 5) * 62, a.y + 100 + Math.floor(i / 5) * 34);
        for (let i = 0; i < c.q; i++) orange(a.x + 50 + (i % 5) * 62, a.y + 200 + Math.floor(i / 5) * 36);
        B.pill(`${c.p} × x = ${c.p * c.x}`, a.x + 16, a.y + 84, P.blue); B.pill(`${c.q} × y = ${c.q * c.y}`, a.x + 16, a.y + 180, P.amber);
      } else if (c.scen === "age") {
        const fig = (x, h, col, lab) => { const y0 = a.y + a.h - 40; B.circle(x, y0 - h - 12, 12, null, col); g.save(); g.fillStyle = col; g.beginPath(); g.roundRect ? g.roundRect(x - 14, y0 - h, 28, h, 8) : g.rect(x - 14, y0 - h, 28, h); g.fill(); g.restore(); B.text(lab, x, y0 + 18, { align: "center", size: 12, w: 700 }); };
        fig(a.x + 100, 60 + c.age * 1.2, P.pink, `Ada: x = ${c.age}`); fig(a.x + 250, 60 + Math.min(150, (3 * c.age + 4) * 0.9), P.blue, `Father: ${3 * c.age + 4}`);
      } else {
        const y = a.y + 150; g.save(); g.fillStyle = MK.isNight() ? "#2a2f3a" : "#4b5563"; g.fillRect(a.x + 10, y - 14, a.w - 20, 28); g.restore();
        for (let k = 0; k <= Math.min(20, c.x); k++) { const xx = a.x + 20 + k * (a.w - 40) / Math.max(1, Math.min(20, c.x)); B.line(xx, y - 18, xx, y + 18, "#f8f1c6", 1.4); }
        B.text(`${c.x} km × ₦150 + flag-down ₦${c.y}`, a.x + 16, y + 50, { size: 12.5, w: 700 });
      }
      B.text(E.e, a.x + 16, a.y + a.h - 50, { size: 18, w: 800, color: P.blue, fam: "serif" });
      B.text(`= ${E.sub} = ${f(E.v)} ${E.unit}`, a.x + 16, a.y + a.h - 22, { size: 14, w: 700, color: P.green });
    },
    hud(s, c) { const E = this.expr(c); return [{ title: "Expression", lines: [E.e, "—", "Substitute:", E.sub, [`= ${f(E.v)} ${E.unit}`, null, true]] }, { title: "Vocabulary", lines: ["term · coefficient · variable · constant", "Like terms have the same letters & powers"] }]; },
    readouts(s, c) { const E = this.expr(c); return [["Expression", E.e], ["Value", f(E.v) + " " + E.unit]]; },
    steps(s, c) { const E = this.expr(c); return [`Read the situation: ${E.words}`, `Choose letters for the unknowns and write ${E.e}`, `Substitute the values: ${E.sub}`, `Evaluate: ${f(E.v)} ${E.unit}`]; },
    note: "e.g. the cost C naira of 4 pens at x naira each and 3 oranges at y naira each: C = 4x + 3y. If x = 60 and y = 20, C = ₦300.",
    mistake: "Writing 4 + x instead of 4x for “4 pens at x naira each” — each means multiply.",
  });

  /* ---------------- B-b Expansion, factorisation, binary operations ---------------- */
  MK.def("B-b", {
    title: "Expansion, factorisation & binary operations", env: "graph",
    values: { mode: "expand", a: 1, b: 3, c2: 2, d: -4, r1: -2, r2: 3, ka: 1, big: 49, small: 47, op: "2a+b-ab", u: 3, v: 2 },
    controls: [{ type: "tabs", key: "mode", label: "Mode", options: [["expand", "Expand (ax+b)(cx+d)"], ["factor", "Factorise ax²+bx+c"], ["dots", "Difference of two squares"], ["binop", "Binary operation"]] },
      { key: "a", label: "a", min: -4, max: 4, show: W("mode", "expand") }, { key: "b", label: "b", min: -9, max: 9, show: W("mode", "expand") }, { key: "c2", label: "c", min: -4, max: 4, show: W("mode", "expand") }, { key: "d", label: "d", min: -9, max: 9, show: W("mode", "expand") },
      { key: "ka", label: "Leading coefficient", min: 1, max: 4, show: W("mode", "factor") }, { key: "r1", label: "Root r₁ (hidden factor)", min: -6, max: 6, show: W("mode", "factor") }, { key: "r2", label: "Root r₂", min: -6, max: 6, show: W("mode", "factor") },
      { key: "big", label: "Larger number", min: 2, max: 200, show: W("mode", "dots") }, { key: "small", label: "Smaller number", min: 1, max: 199, show: W("mode", "dots") },
      { type: "select", key: "op", label: "a * b =", options: ["2a+b-ab", "a+b+ab", "a^2-b^2", "(a+b)/2", "ab-a-b"], show: W("mode", "binop") }, { key: "u", label: "a", min: -5, max: 9, show: W("mode", "binop") }, { key: "v", label: "b", min: -5, max: 9, show: W("mode", "binop") }],
    poly(c) { if (c.mode === "expand") return [c.b * c.d, c.a * c.d + c.b * c.c2, c.a * c.c2]; return [c.ka * c.r1 * c.r2, -c.ka * (c.r1 + c.r2), c.ka]; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area;
      if (c.mode === "expand" || c.mode === "factor") {
        // algebra-tile area model
        const A = c.mode === "expand" ? [c.a, c.b] : [c.ka, -c.ka * c.r1], Cc = c.mode === "expand" ? [c.c2, c.d] : [1, -c.r2];
        const X = 46, U = 16, x0 = a.x + 60, y0 = a.y + 70;
        const wcol = Math.abs(A[0]) * X + Math.abs(A[1]) * U, hrow = Math.abs(Cc[0]) * X + Math.abs(Cc[1]) * U, k = Math.min(1, (a.w - 80) / Math.max(1, wcol), (a.h - 100) / Math.max(1, hrow)), Xs = X * k, Us = U * k;
        const tile = (x, y, w, h, pos, lab) => { g.save(); g.fillStyle = pos ? (lab === "x²" ? P.blue : lab === "x" ? P.green : P.amber) : P.red; g.globalAlpha = 0.78; g.shadowColor = P.shadow; g.shadowBlur = 2; g.fillRect(x + 1, y + 1, w - 2, h - 2); g.restore(); if (w > 18 && h > 14) B.text((pos ? "" : "−") + lab, x + w / 2, y + h / 2 + 4, { align: "center", size: 10, color: "#fff", halo: false, w: 700 }); };
        const cols = [], rows = []; for (let i = 0; i < Math.abs(A[0]); i++) cols.push([Xs, "x", Math.sign(A[0])]); for (let i = 0; i < Math.abs(A[1]); i++) cols.push([Us, "1", Math.sign(A[1])]);
        for (let i = 0; i < Math.abs(Cc[0]); i++) rows.push([Xs, "x", Math.sign(Cc[0])]); for (let i = 0; i < Math.abs(Cc[1]); i++) rows.push([Us, "1", Math.sign(Cc[1])]);
        let yy = y0; rows.forEach(([h, lr, sr]) => { let xx = x0; cols.forEach(([w, lc, scn]) => { const lab = lr === "x" && lc === "x" ? "x²" : lr === "1" && lc === "1" ? "1" : "x"; tile(xx, yy, w, h, sr * scn > 0, lab); xx += w; }); yy += h; });
        let xx = x0; cols.forEach(([w, lc, scn]) => { B.text((scn < 0 ? "−" : "") + lc, xx + w / 2, y0 - 8, { align: "center", size: 11, w: 700, color: scn < 0 ? P.red : P.ink }); xx += w; });
        yy = y0; rows.forEach(([h, lr, sr]) => { B.text((sr < 0 ? "−" : "") + lr, x0 - 10, yy + h / 2 + 4, { align: "right", size: 11, w: 700, color: sr < 0 ? P.red : P.ink }); yy += h; });
        const p = this.poly(c); B.text(c.mode === "expand" ? `(${lin(c.a, c.b)})(${lin(c.c2, c.d)}) = ${MK.poly.str(p)}` : `${MK.poly.str(p)} = ${c.ka === 1 ? "" : c.ka}(${lin(1, -c.r1)})(${lin(1, -c.r2)})`, a.x + 10, a.y + 44, { size: 14, w: 800, color: P.blue });
        return;
      }
      if (c.mode === "dots") { const A = c.big, Bv = Math.min(c.small, c.big - 1), k = Math.min((a.w - 60) / A, (a.h - 90) / A), x0 = a.x + 30, y0 = a.y + 70;
        g.save(); g.fillStyle = P.fillB; g.fillRect(x0, y0, A * k, A * k); g.fillStyle = MK.isNight() ? "#0d1426" : "#fbfaf4"; g.fillRect(x0 + (A - Bv) * k, y0 + (A - Bv) * k, Bv * k, Bv * k); g.restore();
        B.poly([[x0, y0], [x0 + A * k, y0], [x0 + A * k, y0 + (A - Bv) * k], [x0 + (A - Bv) * k, y0 + (A - Bv) * k], [x0 + (A - Bv) * k, y0 + A * k], [x0, y0 + A * k]], P.blue, null, 2);
        B.poly([[x0 + (A - Bv) * k, y0 + (A - Bv) * k], [x0 + A * k, y0 + (A - Bv) * k], [x0 + A * k, y0 + A * k], [x0 + (A - Bv) * k, y0 + A * k]], P.red, null, 1.5, true, [5, 4]);
        B.text(`${A}² − ${Bv}² = (${A} + ${Bv})(${A} − ${Bv}) = ${A + Bv} × ${A - Bv} = ${(A + Bv) * (A - Bv)}`, a.x + 10, a.y + 44, { size: 13, w: 800, color: P.blue }); return; }
      // binary operation table
      const fn = MK.parse(c.op.replace(/ab/g, "a*b"), { vars: ["a", "b"] }), vals = [-2, -1, 0, 1, 2, 3], x0 = a.x + 20, y0 = a.y + 70, cw = Math.min(50, (a.w - 40) / 7), rh = 28;
      B.panel(x0, y0, cw * 7, rh * 7); B.text("*", x0 + cw / 2, y0 + 19, { align: "center", w: 800, halo: false });
      vals.forEach((v, i) => { B.text(String(v), x0 + (i + 1.5) * cw, y0 + 19, { align: "center", w: 800, color: P.panelHead, halo: false }); B.text(String(v), x0 + cw / 2, y0 + (i + 1) * rh + 19, { align: "center", w: 800, color: P.panelHead, halo: false });
        vals.forEach((u, j) => { const r = fn.multi({ a: v, b: u }); B.text(f(r, 2), x0 + (j + 1.5) * cw, y0 + (i + 1) * rh + 19, { align: "center", size: 11, halo: false, color: v === c.u && u === c.v ? P.red : P.ink }); }); });
      B.text(`${c.u} * ${c.v} = ${f(fn.multi({ a: c.u, b: c.v }), 4)}`, a.x + 10, a.y + 44, { size: 15, w: 800, color: P.blue });
    },
    hud(s, c) {
      if (c.mode === "expand") { const p = this.poly(c); return [{ title: "Expansion (FOIL)", lines: ["(ax + b)(cx + d) = acx² + (ad + bc)x + bd", "—", `First ${f(c.a * c.c2)}x², Outer ${f(c.a * c.d)}x, Inner ${f(c.b * c.c2)}x, Last ${f(c.b * c.d)}`, [`= ${MK.poly.str(p)}`, null, true]] }]; }
      if (c.mode === "factor") { const p = this.poly(c); return [{ title: "Factorisation", lines: [`${MK.poly.str(p)}`, `Find two numbers: product ac = ${p[2] * p[0]}, sum b = ${p[1]}`, `→ ${-c.ka * c.r1} and ${-c.ka * c.r2}`.replace(/--/g, ""), [`= ${c.ka === 1 ? "" : c.ka}(${lin(1, -c.r1)})(${lin(1, -c.r2)})`, null, true]] }]; }
      if (c.mode === "dots") return [{ title: "Identity", lines: ["a² − b² = (a + b)(a − b)", [`= ${(c.big + Math.min(c.small, c.big - 1)) * (c.big - Math.min(c.small, c.big - 1))}`, null, true]] }];
      return [{ title: "Binary operation", lines: [`a * b = ${c.op}`, `${c.u} * ${c.v} = ${c.op.replace(/a/g, `(${c.u})`).replace(/b/g, `(${c.v})`)}`, [`= ${f(MK.parse(c.op.replace(/ab/g, "a*b"), { vars: ["a", "b"] }).multi({ a: c.u, b: c.v }), 4)}`, null, true]] }];
    },
    readouts(s, c) { const p = this.poly(c); if (c.mode === "binop") { const fn = MK.parse(c.op.replace(/ab/g, "a*b"), { vars: ["a", "b"] }); return [["a * b", f(fn.multi({ a: c.u, b: c.v }), 4)], ["b * a", f(fn.multi({ a: c.v, b: c.u }), 4)], ["Commutative here?", fn.multi({ a: c.u, b: c.v }) === fn.multi({ a: c.v, b: c.u }) ? "yes" : "no"]]; } if (c.mode === "dots") return [["Value", (c.big + c.small) * (c.big - c.small)]]; return [["Polynomial", MK.poly.str(p)], ["Check at x = 2", f(MK.poly.ev(p, 2))]]; },
    steps(s, c) { if (c.mode === "expand") return [`(${lin(c.a, c.b)})(${lin(c.c2, c.d)})`, `= ${lin(c.a, 0)}(${lin(c.c2, c.d)})${sgn(c.b)}(${lin(c.c2, c.d)})`, `= ${f(c.a * c.c2)}x² ${sgn(c.a * c.d)}x${sgn(c.b * c.c2)}x${sgn(c.b * c.d)}`, `= ${MK.poly.str(this.poly(c))}`];
      if (c.mode === "factor") { const p = this.poly(c), m = -c.ka * c.r1, n = -c.ka * c.r2; return [`ac = ${p[2]} × ${p[0]} = ${p[2] * p[0]}; b = ${p[1]}`, `Numbers ${m} and ${n}: product ${m * n}, sum ${m + n}`, `Split: ${p[2] === 1 ? "" : p[2]}x² ${sgn(m)}x${sgn(n)}x${sgn(p[0])}`, `Group and factor: ${c.ka === 1 ? "" : c.ka}(${lin(1, -c.r1)})(${lin(1, -c.r2)})`]; }
      if (c.mode === "dots") return [`Recognise a² − b² with a = ${c.big}, b = ${c.small}`, `(${c.big} + ${c.small})(${c.big} − ${c.small}) = ${c.big + c.small} × ${c.big - c.small}`, `= ${(c.big + c.small) * (c.big - c.small)}`];
      return [`Replace a by ${c.u} and b by ${c.v} in ${c.op}`, `Evaluate carefully with brackets.`]; },
    note: "Expansion e.g. (a + 3)(c − 4); factorisation of ax + ay, a(b + c) + d(b + c), a² − b², ax² + bx + c; binary operations such as a * b = 2a + b − ab.",
    mistake: "(a + b)² is a² + 2ab + b², not a² + b² — the area model shows the two missing ab rectangles.",
  });

  /* ---------------- B-c Linear equations (balance + simultaneous) ---------------- */
  MK.def("B-c", {
    title: "Linear equations", env: "paper",
    values: { mode: "one", a: 3, b: 4, cc: 1, d: 12, a1: 2, b1: 3, c1: 12, a2: 1, b2: -1, c2: 1, stage: 0 },
    controls: [{ type: "tabs", key: "mode", label: "Mode", options: [["one", "One variable (balance)"], ["sim", "Simultaneous equations"]] },
      { key: "a", label: "a (in ax + b = cx + d)", min: 1, max: 6, show: W("mode", "one") }, { key: "b", label: "b", min: 0, max: 12, show: W("mode", "one") }, { key: "cc", label: "c", min: 0, max: 5, show: W("mode", "one") }, { key: "d", label: "d", min: 0, max: 30, show: W("mode", "one") },
      { key: "a1", label: "Eq 1: a₁", min: -5, max: 5, show: W("mode", "sim") }, { key: "b1", label: "b₁", min: -5, max: 5, show: W("mode", "sim") }, { key: "c1", label: "c₁", min: -20, max: 20, show: W("mode", "sim") }, { key: "a2", label: "Eq 2: a₂", min: -5, max: 5, show: W("mode", "sim") }, { key: "b2", label: "b₂", min: -5, max: 5, show: W("mode", "sim") }, { key: "c2", label: "c₂", min: -20, max: 20, show: W("mode", "sim") }],
    actions: [{ label: "Next balancing move ▸", run: (s, c) => { c.stage = (c.stage + 1) % 4; } }],
    onChange(s, c, k) { if (k !== "_act") c.stage = 0; },
    sol1(c) { const den = c.a - c.cc; return den === 0 ? null : (c.d - c.b) / den; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area;
      if (c.mode === "sim") {
        const { a1, b1, c1, a2, b2, c2 } = c, det = a1 * b2 - a2 * b1, xs = det ? (c1 * b2 - c2 * b1) / det : 0, ys = det ? (a1 * c2 - a2 * c1) / det : 0, R = Math.max(6, Math.ceil(Math.max(Math.abs(xs), Math.abs(ys)) + 2));
        const m = B.axes({ xmin: -R, xmax: R, ymin: -R, ymax: R });
        const line = (A, Bc, C, col) => { if (Bc) B.plot(m, (x) => (C - A * x) / Bc, col, 2.6); else if (A) B.line(m.X(C / A), m.r.y, m.X(C / A), m.r.y + m.r.h, col, 2.6); };
        line(a1, b1, c1, P.blue); line(a2, b2, c2, P.green);
        if (det) B.dot(m.X(xs), m.Y(ys), P.red, 7, `(${f(xs, 3)}, ${f(ys, 3)})`); else B.text(a1 * c2 === a2 * c1 && b1 * c2 === b2 * c1 ? "Same line: infinitely many solutions" : "Parallel lines: no solution", m.r.x + 10, m.r.y + 40, { color: P.red, w: 700 });
        B.text(`${lin(a1, 0)}${b1 ? (b1 > 0 ? " + " : " − ") + (Math.abs(b1) === 1 ? "" : Math.abs(b1)) + "y" : ""} = ${c1}`, m.r.x + 8, m.r.y + m.r.h - 28, { color: P.blue, w: 700 }); B.text(`${lin(a2, 0)}${b2 ? (b2 > 0 ? " + " : " − ") + (Math.abs(b2) === 1 ? "" : Math.abs(b2)) + "y" : ""} = ${c2}`, m.r.x + 8, m.r.y + m.r.h - 10, { color: P.green, w: 700 });
        return;
      }
      // balance scale with x-boxes and unit weights, stage = moves applied
      let L = { x: c.a, u: c.b }, Rr = { x: c.cc, u: c.d }; const st = c.stage;
      if (st >= 1) { L.x -= c.cc; Rr.x -= c.cc; } if (st >= 2) { Rr.u -= L.u; L.u = 0; } const xv = this.sol1(c); if (st >= 3 && L.x) { Rr.u = Rr.u / L.x; L.x = 1; }
      const cx = a.x + a.w / 2, by = a.y + a.h - 50, tilt = 0;
      g.save(); g.fillStyle = MK.isNight() ? "#3b4252" : "#6b7280"; g.beginPath(); g.moveTo(cx - 40, by + 20); g.lineTo(cx + 40, by + 20); g.lineTo(cx + 8, by - 150); g.lineTo(cx - 8, by - 150); g.closePath(); g.fill(); g.restore();
      const beamY = by - 150; g.save(); g.translate(cx, beamY); g.rotate(tilt); const gr = g.createLinearGradient(0, -6, 0, 6); gr.addColorStop(0, "#e5e7eb"); gr.addColorStop(1, "#9ca3af"); g.fillStyle = gr; g.fillRect(-a.w * 0.44, -5, a.w * 0.88, 10); g.restore();
      const pan = (px, side, lab) => { B.line(px - 50, beamY, px - 60, beamY + 70, P.soft, 1.2); B.line(px + 50, beamY, px + 60, beamY + 70, P.soft, 1.2); g.save(); g.fillStyle = MK.isNight() ? "#a3a3a3" : "#d4d4d8"; g.beginPath(); g.ellipse(px, beamY + 72, 72, 10, 0, 0, MK.TAU); g.fill(); g.restore();
        let k = 0; const place = (w, h, col, t) => { const row = Math.floor(k / 5), colI = k % 5; const x = px - 60 + colI * 25, y = beamY + 66 - row * (h + 2) - h; g.save(); g.fillStyle = col; g.shadowColor = "rgba(0,0,0,.3)"; g.shadowBlur = 3; g.fillRect(x, y, w, h); g.restore(); B.text(t, x + w / 2, y + h / 2 + 4, { align: "center", size: 9.5, color: "#fff", halo: false, w: 800 }); k++; };
        for (let i = 0; i < Math.round(side.x); i++) place(22, 22, P.blue, "x");
        const u = Math.round(side.u * 100) / 100; if (Number.isInteger(u)) { for (let i = 0; i < Math.min(25, u); i++) place(22, 12, P.amber, "1"); } else B.text(f(u, 3), px, beamY + 50, { align: "center", size: 16, w: 800, color: P.amber });
        B.text(lab, px, beamY + 100, { align: "center", size: 13, w: 700 }); };
      const sideStr = (o) => (o.x ? (o.x === 1 ? "x" : f(o.x, 3) + "x") : "") + (o.u ? (o.x ? " + " : "") + f(o.u, 3) : o.x ? "" : "0");
      pan(cx - a.w * 0.3, L, sideStr(L)); pan(cx + a.w * 0.3, Rr, sideStr(Rr));
      B.text(["Start", "Take " + c.cc + "x off both sides", "Take " + c.b + " off both sides", "Divide both sides by " + (c.a - c.cc)][st], cx, a.y + 46, { align: "center", size: 13, w: 800, color: P.blue });
    },
    hud(s, c) { if (c.mode === "sim") { const { a1, b1, c1, a2, b2, c2 } = c, det = a1 * b2 - a2 * b1; return [{ title: "Solution", lines: ["Elimination / substitution / graph", "—", det ? [`x = ${f((c1 * b2 - c2 * b1) / det, 4)}, y = ${f((a1 * c2 - a2 * c1) / det, 4)}`, null, true] : ["No unique solution", "#ff7b72"], "Intersection of the two lines"] }]; }
      const x = this.sol1(c); return [{ title: "Equation", lines: [`${lin(c.a, c.b)} = ${lin(c.cc, c.d)}`, "Do the same to both sides", "—", x == null ? ["No unique solution", "#ff7b72"] : [`x = ${f(x, 4)}`, null, true], x == null ? "" : `Check: ${f(c.a * x + c.b, 4)} = ${f(c.cc * x + c.d, 4)} ✓`] }]; },
    readouts(s, c) { if (c.mode === "sim") { const { a1, b1, c1, a2, b2, c2 } = c, det = a1 * b2 - a2 * b1; return det ? [["x", f((c1 * b2 - c2 * b1) / det, 4)], ["y", f((a1 * c2 - a2 * c1) / det, 4)]] : [["Solution", "none / infinite"]]; } const x = this.sol1(c); return [["x", x == null ? "—" : f(x, 4)], ["Truth set", x == null ? "∅ or all x" : "{" + f(x, 4) + "}"]]; },
    steps(s, c) { if (c.mode === "sim") { const { a1, b1, c1, a2, b2, c2 } = c, det = a1 * b2 - a2 * b1; if (!det) return ["The lines are parallel or the same: no unique solution."]; const x = (c1 * b2 - c2 * b1) / det, y = (a1 * c2 - a2 * c1) / det;
        return [`Multiply eq 1 by ${b2} and eq 2 by ${b1} to match the y coefficients`, `${a1 * b2}x + ${b1 * b2}y = ${c1 * b2}  and  ${a2 * b1}x + ${b1 * b2}y = ${c2 * b1}`, `Subtract: ${det}x = ${c1 * b2 - c2 * b1} ⇒ x = ${f(x, 4)}`, `Substitute into eq 1: ${a1}(${f(x, 4)}) + ${b1}y = ${c1} ⇒ y = ${f(y, 4)}`, `Check in eq 2: ${f(a2 * x + b2 * y, 4)} = ${c2} ✓`]; }
      const x = this.sol1(c); return [`${lin(c.a, c.b)} = ${lin(c.cc, c.d)}`, `Subtract ${c.cc}x: ${lin(c.a - c.cc, c.b)} = ${c.d}`, `Subtract ${c.b}: ${lin(c.a - c.cc, 0)} = ${c.d - c.b}`, x == null ? "Coefficient of x is 0: no unique solution" : `Divide by ${c.a - c.cc}: x = ${f(x, 4)}`]; },
    note: "Solve by elimination, substitution and graphical methods; find the truth (solution) set. Word problems involving one or two variables.",
    mistake: "Doing an operation to only one side of the equation, or forgetting to multiply every term when scaling an equation.",
  });

  /* ---------------- B-d Change of subject ---------------- */
  const FORMS = {
    lens: { f: "1/f = 1/u + 1/v", make: "v", res: "v = uf/(u − f)", vars: { u: [30, 5, 100, 1, "cm"], f: [10, 2, 40, 1, "cm"] }, fn: (o) => o.u * o.f / (o.u - o.f), unit: "cm", chain: ["1/v = 1/f − 1/u", "1/v = (u − f)/(uf)", "v = uf/(u − f)"], flow: [["v", "1/□"], ["+ 1/u", ""], ["", "1/f"]] },
    motion: { f: "v = u + at", make: "t", res: "t = (v − u)/a", vars: { v: [30, 0, 80, 1, "m/s"], u: [10, 0, 40, 1, "m/s"], a: [2, 0.5, 10, 0.5, "m/s²"] }, fn: (o) => (o.v - o.u) / o.a, unit: "s", chain: ["v − u = at", "t = (v − u)/a"], flow: [["t", "× a"], ["+ u", ""], ["", "v"]] },
    cyl: { f: "V = πr²h", make: "r", res: "r = √(V/(πh))", vars: { V: [500, 50, 3000, 10, "cm³"], h: [10, 1, 40, 1, "cm"] }, fn: (o) => Math.sqrt(o.V / (Math.PI * o.h)), unit: "cm", chain: ["r² = V/(πh)", "r = √(V/(πh))"], flow: [["r", "square"], ["× πh", ""], ["", "V"]] },
    pend: { f: "T = 2π√(l/g)", make: "l", res: "l = gT²/(4π²)", vars: { T: [2, 0.5, 5, 0.1, "s"], g: [9.8, 9.8, 9.8, 0.1, "m/s²"] }, fn: (o) => o.g * o.T * o.T / (4 * Math.PI * Math.PI), unit: "m", chain: ["T/(2π) = √(l/g)", "T²/(4π²) = l/g", "l = gT²/(4π²)"], flow: [["l", "÷ g"], ["√", "× 2π"], ["", "T"]] },
    si: { f: "I = PRT/100", make: "R", res: "R = 100I/(PT)", vars: { I: [3000, 100, 20000, 100, "₦"], P: [20000, 1000, 100000, 1000, "₦"], T: [3, 1, 10, 1, "yr"] }, fn: (o) => 100 * o.I / (o.P * o.T), unit: "%", chain: ["100I = PRT", "R = 100I/(PT)"], flow: [["R", "× PT"], ["÷ 100", ""], ["", "I"]] },
  };
  MK.def("B-d", {
    title: "Change of subject", env: "paper",
    values: { form: "lens", u: 30, f: 10, v: 30, a: 2, V: 500, h: 10, T: 2, g: 9.8, I: 3000, P: 20000 },
    controls: [{ type: "select", key: "form", label: "Formula", options: Object.keys(FORMS).map((k) => [k, FORMS[k].f + "  → make " + FORMS[k].make + " the subject"]) },
      { key: "u", label: "u", min: 0, max: 100, step: 1, show: (c) => ["lens", "motion"].includes(c.form) }, { key: "f", label: "f", min: 2, max: 40, show: W("form", "lens") }, { key: "v", label: "v", min: 0, max: 80, show: W("form", "motion") }, { key: "a", label: "a", min: 0.5, max: 10, step: 0.5, show: W("form", "motion") },
      { key: "V", label: "V", min: 50, max: 3000, step: 10, show: W("form", "cyl") }, { key: "h", label: "h", min: 1, max: 40, show: W("form", "cyl") }, { key: "T", label: "T", min: 0.5, max: 10, step: 0.1, show: W("form", "pend", "si") }, { key: "I", label: "I", min: 100, max: 20000, step: 100, show: W("form", "si") }, { key: "P", label: "P", min: 1000, max: 100000, step: 1000, show: W("form", "si") }],
    draw(g, s, c, B) {
      const P = B.P, a = B.area, F = FORMS[c.form];
      B.text(F.f, a.x + 14, a.y + 52, { size: 20, w: 700, fam: "serif" }); B.text("make " + F.make + " the subject", a.x + 14, a.y + 74, { size: 12, color: P.soft });
      // forward flow (build up the formula) and reverse flow (undo in reverse order)
      const ops = { lens: ["v", "1/v", "1/v + 1/u", "= 1/f"], motion: ["t", "× a → at", "+ u → u + at", "= v"], cyl: ["r", "square → r²", "× πh → πr²h", "= V"], pend: ["l", "÷ g → l/g", "√ → √(l/g)", "× 2π = T"], si: ["R", "× PT → PRT", "÷ 100 → PRT/100", "= I"] }[c.form];
      const inv = { lens: ["1/f", "− 1/u", "take reciprocal", "v"], motion: ["v", "− u", "÷ a", "t"], cyl: ["V", "÷ πh", "√", "r"], pend: ["T", "÷ 2π", "square, × g", "l"], si: ["I", "× 100", "÷ PT", "R"] }[c.form];
      const box = (x, y, t, col) => { g.save(); g.font = MK.font(700, 12); const w = Math.max(54, g.measureText(t).width + 18); g.restore(); B.panel(x, y, w, 30); B.text(t, x + w / 2, y + 20, { align: "center", size: 12, w: 700, color: col, halo: false }); return w; };
      const bw = (t) => { g.save(); g.font = MK.font(700, 12); const w = Math.max(54, g.measureText(t).width + 18); g.restore(); return w; };
      const row = (items, y, col) => { let x = a.x + 14; items.forEach((t, i) => { const w = bw(t); if (x + w > a.x + a.w) { x = a.x + 14; y += 42; } box(x, y, t, col); const nx = x + w + 20; if (i < items.length - 1 && nx + bw(items[i + 1]) <= a.x + a.w) B.arrow(x + w + 2, y + 15, x + w + 16, y + 15, col, 2, 7); x = nx; }); return y; };
      let y = a.y + 110; B.text("Build the formula:", a.x + 14, y - 8, { size: 11, color: P.soft }); y = row(ops, y, P.blue);
      y += 70; B.text("Undo in reverse order:", a.x + 14, y - 8, { size: 11, color: P.soft }); row(inv, y, P.green);
      const o = Object.assign({}, c); B.text(F.res + " = " + f(F.fn(o), 4) + " " + F.unit, a.x + 14, a.y + a.h - 18, { size: 16, w: 800, color: P.red });
    },
    hud(s, c) { const F = FORMS[c.form], o = Object.assign({}, c); return [{ title: "Rearrangement", lines: [F.f, ...F.chain, "—", [`${F.make} = ${f(F.fn(o), 4)} ${F.unit}`, null, true]] }, { title: "Units", lines: [Object.entries(F.vars).map(([k, v]) => `${k} in ${v[4]}`).join(", ")] }]; },
    readouts(s, c) { const F = FORMS[c.form]; return [["New subject", F.res], ["Value", f(F.fn(Object.assign({}, c)), 4) + " " + F.unit]]; },
    steps(s, c) { const F = FORMS[c.form]; return [`Start: ${F.f}`, ...F.chain.map((t) => t), `Substitute the given values: ${F.make} = ${f(F.fn(Object.assign({}, c)), 4)} ${F.unit}`]; },
    note: "e.g. given 1/f = 1/u + 1/v, find v; then evaluate v given u and f. Undo operations in the reverse order they were applied.",
    mistake: "From 1/v = 1/f − 1/u writing v = f − u. Combine into one fraction first, then take the reciprocal.",
  });

  /* ---------------- B-e Quadratic equations ---------------- */
  MK.def("B-e", {
    title: "Quadratic equations", env: "graph",
    values: { mode: "formula", a: 1, b: -2, c: -3, p1: "-3", p2: "2/5" },
    controls: [{ type: "tabs", key: "mode", label: "Method", options: [["factor", "Factorisation"], ["square", "Completing the square"], ["formula", "Quadratic formula"], ["form", "Form from roots"]] },
      { key: "a", label: "a", min: -4, max: 4, step: 1, show: (c) => c.mode !== "form" }, { key: "b", label: "b", min: -12, max: 12, step: 1, show: (c) => c.mode !== "form" }, { key: "c", label: "c", min: -20, max: 20, step: 1, show: (c) => c.mode !== "form" },
      { type: "text", key: "p1", label: "Root 1 (e.g. −3)", wide: false, show: W("mode", "form") }, { type: "text", key: "p2", label: "Root 2 (e.g. 2/5)", wide: false, show: W("mode", "form") }],
    coefs(c) { if (c.mode === "form") { const r1 = MK.parseFr(c.p1) || new MK.Fr(0), r2 = MK.parseFr(c.p2) || new MK.Fr(0), L = r1.d * r2.d; const A = L, Bc = -(r1.n * r2.d + r2.n * r1.d), Cc = r1.n * r2.n; return { a: A, b: Bc, c: Cc, r1, r2 }; } return { a: c.a || 1, b: c.b, c: c.c }; },
    draw(g, s, c, B) {
      const P = B.P, q = this.coefs(c), fn = (x) => q.a * x * x + q.b * x + q.c, xv = -q.b / (2 * q.a), yv = fn(xv), D = q.b * q.b - 4 * q.a * q.c;
      const span = Math.max(5, Math.abs(xv) + Math.sqrt(Math.abs(D)) / Math.abs(q.a) / 2 + 3), ymin = Math.min(-5, yv - 2, fn(xv - span), fn(xv + span)), ymax = Math.max(5, yv + 2);
      const m = B.axes({ xmin: Math.floor(xv - span), xmax: Math.ceil(xv + span), ymin: Math.max(ymin, -60), ymax: Math.min(ymax, 60) });
      if (c.mode === "square") { const k = (x) => q.a * (x - xv) * (x - xv); B.plot(m, (x) => yv, P.amber, 1.4, { dash: [5, 4] }); }
      B.line(m.X(xv), m.r.y, m.X(xv), m.r.y + m.r.h, P.purple, 1.2, [5, 4]); B.text("x = " + f(xv, 3), m.X(xv) + 4, m.r.y + 14, { size: 10.5, color: P.purple });
      B.plot(m, fn, P.blue, 2.8); B.dot(m.X(xv), m.Y(yv), P.purple, 5, `vertex (${f(xv, 2)}, ${f(yv, 2)})`, { dy: q.a > 0 ? 18 : -10 });
      if (D >= 0) { const r1 = (-q.b - Math.sqrt(D)) / (2 * q.a), r2 = (-q.b + Math.sqrt(D)) / (2 * q.a); B.dot(m.X(r1), m.Y(0), P.red, 6, f(r1, 3), { dy: -10 }); if (D > 0) B.dot(m.X(r2), m.Y(0), P.red, 6, f(r2, 3), { dy: -10 }); }
      else B.text("No real roots (curve does not cross the x-axis)", m.r.x + 10, m.r.y + m.r.h - 10, { color: P.red, size: 11.5, w: 700 });
      B.dot(m.X(0), m.Y(q.c), P.green, 4, "c = " + f(q.c), { dx: 6 });
    },
    roots(q) { const D = q.b * q.b - 4 * q.a * q.c; if (D < 0) return null; return [(-q.b - Math.sqrt(D)) / (2 * q.a), (-q.b + Math.sqrt(D)) / (2 * q.a)]; },
    hud(s, c) { const q = this.coefs(c), D = q.b * q.b - 4 * q.a * q.c, r = this.roots(q), eq = MK.poly.str([q.c, q.b, q.a]) + " = 0";
      if (c.mode === "form") return [{ title: "Forming the equation", lines: [`Roots ${q.r1.str()} and ${q.r2.str()}`, `(x − ${q.r1.str()})(x − ${q.r2.str()}) = 0`, "Clear fractions:", [eq, null, true], `sum = ${MK.toFr(-q.b / q.a).str()}, product = ${MK.toFr(q.c / q.a).str()}`] }];
      if (c.mode === "square") { const h = q.b / (2 * q.a), k = q.c / q.a - h * h; return [{ title: "Completing the square", lines: [eq, `${q.a === 1 ? "" : q.a + "("}x² ${sgn(q.b / q.a)}x${q.a === 1 ? "" : ")"} = ${f(-q.c)}`, `(x${sgn(h)})² = ${f(-k, 4)}`, r ? [`x = ${f(-h, 3)} ± √${f(-k, 4)}`, null, true] : ["no real roots", "#ff7b72"]] }]; }
      return [{ title: c.mode === "factor" ? "Factorisation" : "Quadratic formula", lines: [eq, c.mode === "formula" ? "x = [−b ± √(b² − 4ac)] / 2a" : "ab = 0 ⇒ a = 0 or b = 0", `b² − 4ac = ${f(D)}`, r ? [`x = ${f(r[0], 4)} or ${f(r[1], 4)}`, null, true] : ["no real roots", "#ff7b72"]] }, { title: "Discriminant", lines: [D > 0 ? "> 0: two real roots" : D === 0 ? "= 0: equal roots" : "< 0: no real roots"] }]; },
    readouts(s, c) { const q = this.coefs(c), D = q.b * q.b - 4 * q.a * q.c, r = this.roots(q); return [["Equation", MK.poly.str([q.c, q.b, q.a]) + " = 0"], ["Discriminant", f(D)], ["Roots", r ? (D === 0 ? f(r[0], 4) : f(r[0], 4) + ", " + f(r[1], 4)) : "none (real)"], ["Sum / product", f(-q.b / q.a, 3) + " / " + f(q.c / q.a, 3)]]; },
    steps(s, c) { const q = this.coefs(c), D = q.b * q.b - 4 * q.a * q.c, r = this.roots(q);
      if (c.mode === "form") return [`If the roots are ${q.r1.str()} and ${q.r2.str()}, then (x − (${q.r1.str()}))(x − (${q.r2.str()})) = 0`, `Multiply out and clear fractions (× ${q.a})`, `${MK.poly.str([q.c, q.b, q.a])} = 0`];
      if (c.mode === "factor") { if (!r || !Number.isInteger(MK.round(r[0] * q.a, 6)) || !Number.isInteger(MK.round(r[1] * q.a, 6))) return ["This quadratic does not factorise with whole numbers — use the formula or complete the square."]; const m = MK.round(-r[0] * q.a, 6), n = MK.round(-r[1] * q.a, 6);
        return [`Product ac = ${q.a * q.c}, sum b = ${q.b} → numbers ${m}, ${n}`, `${q.a === 1 ? "" : q.a}x² ${sgn(m)}x${sgn(n)}x${sgn(q.c)} = 0`, `Factorise into two brackets, then set each bracket = 0`, `x = ${f(r[0], 4)} or x = ${f(r[1], 4)}`]; }
      if (c.mode === "square") { const h = q.b / (2 * q.a), k = q.c / q.a - h * h; return [`Divide by a = ${q.a}: x² ${sgn(q.b / q.a)}x${sgn(q.c / q.a)} = 0`, `Add (b/2a)² = ${f(h * h, 4)} to both sides`, `(x${sgn(h)})² = ${f(-k, 4)}`, r ? `x = ${f(-h, 4)} ± ${f(Math.sqrt(Math.max(0, -k)), 4)} → ${f(r[0], 4)} or ${f(r[1], 4)}` : "Right side negative: no real roots"]; }
      return [`a = ${q.a}, b = ${q.b}, c = ${q.c}`, `b² − 4ac = ${q.b * q.b} − ${4 * q.a * q.c} = ${D}`, r ? `x = (${-q.b} ± √${D}) / ${2 * q.a}` : "Discriminant negative: no real roots", r ? `x = ${f(r[0], 4)} or x = ${f(r[1], 4)}` : ""].filter(Boolean); },
    note: "Solve by factorisation (ab = 0 ⇒ a = 0 or b = 0), completing the square and the formula. Form a quadratic with given rational roots, e.g. −3 and 2/5 ⇒ 5x² + 13x − 6 = 0.",
    mistake: "Sign slips in −b: if b = −2 then −b = +2. Also dividing only part of the numerator by 2a.",
  });

  /* ---------------- B-f Graphs of linear & quadratic functions ---------------- */
  MK.def("B-f", {
    title: "Graphs: quadratic & linear", env: "graph",
    values: { a: 1, b: -2, c: -3, m: 1, k: 1, x0: 2, showLine: 1, showTan: 1, lo: -3, hi: 5 },
    controls: [{ key: "a", label: "a", min: -3, max: 3, step: 0.5 }, { key: "b", label: "b", min: -8, max: 8 }, { key: "c", label: "c", min: -10, max: 10 }, { type: "toggle", key: "showLine", label: "Line y = mx + k" }, { key: "m", label: "m", min: -5, max: 5, step: 0.5, show: (c) => !!c.showLine }, { key: "k", label: "k", min: -10, max: 10, show: (c) => !!c.showLine }, { type: "toggle", key: "showTan", label: "Tangent at x₀" }, { key: "x0", label: "x₀", min: -4, max: 6, step: 0.5, show: (c) => !!c.showTan }, { key: "lo", label: "Table from x =", min: -6, max: 0 }, { key: "hi", label: "to x =", min: 1, max: 8 }],
    hint: "Drag the gold point along the curve",
    fn(c) { return (x) => (c.a || 0.5) * x * x + c.b * x + c.c; },
    draw(g, s, c, B) {
      const P = B.P, fn = this.fn(c), a = c.a || 0.5, ys = []; for (let x = c.lo; x <= c.hi; x++) ys.push(fn(x));
      const m = B.axes({ xmin: c.lo - 1, xmax: c.hi + 1, ymin: Math.min(-2, ...ys) - 1, ymax: Math.max(2, ...ys) + 1 }); s.m = m;
      for (let x = c.lo; x <= c.hi; x++) B.dot(m.X(x), m.Y(fn(x)), P.ink, 3.2);
      B.plot(m, fn, P.blue, 2.6, { from: c.lo, to: c.hi });
      const xv = -c.b / (2 * a); B.line(m.X(xv), m.r.y, m.X(xv), m.r.y + m.r.h, P.purple, 1.1, [5, 4]); B.dot(m.X(xv), m.Y(fn(xv)), P.purple, 5, (a > 0 ? "min" : "max") + " (" + f(xv, 2) + ", " + f(fn(xv), 2) + ")", { dy: a > 0 ? 18 : -10, size: 10.5 });
      if (c.showLine) { B.plot(m, (x) => c.m * x + c.k, P.green, 2.2); MK.roots((x) => fn(x) - (c.m * x + c.k), c.lo - 1, c.hi + 1).forEach((r) => B.dot(m.X(r), m.Y(fn(r)), P.red, 6, "x = " + f(r, 2), { dy: -12 })); }
      if (c.showTan) { const x0 = c.x0, y0 = fn(x0), gr = 2 * a * x0 + c.b; B.plot(m, (x) => y0 + gr * (x - x0), P.amber, 2, { from: x0 - 2.2, to: x0 + 2.2 });
        const dx = 1.5, p1 = [m.X(x0 - dx), m.Y(y0 - gr * dx)], p2 = [m.X(x0 + dx), m.Y(y0 + gr * dx)]; B.poly([p1, [p2[0], p1[1]], p2], P.amber, P.fillA, 1.2, true, [3, 3]);
        B.text("Δx = " + f(2 * dx), (p1[0] + p2[0]) / 2, p1[1] + (gr > 0 ? 14 : -6), { align: "center", size: 10, color: P.amber }); B.text("Δy = " + f(2 * dx * gr, 2), p2[0] + 4, (p1[1] + p2[1]) / 2, { size: 10, color: P.amber }); B.dot(m.X(x0), m.Y(y0), P.amber, 7); }
    },
    pointer: { down(p, s, c) { if (!s.m || !c.showTan) return false; const fn = (x) => (c.a || 0.5) * x * x + c.b * x + c.c; return Math.hypot(p.x - s.m.X(c.x0), p.y - s.m.Y(fn(c.x0))) < 22; }, move(p, s, c, B, H) { c.x0 = MK.clamp(MK.round(s.m.ix(p.x) * 4, 0) / 4, -4, 6); H.refresh(); } },
    hud(s, c) { const a = c.a || 0.5, xv = -c.b / (2 * a), D = c.b * c.b - 4 * a * c.c, gr = 2 * a * c.x0 + c.b; return [{ title: "Curve", lines: [`y = ${MK.poly.str([c.c, c.b, a])}`, `axis of symmetry x = −b/2a = ${f(xv, 3)}`, `turning point (${f(xv, 2)}, ${f(this.fn(c)(xv), 2)})`, `y-intercept ${f(c.c)}`] }, { title: "Tangent & line", lines: [c.showTan ? `gradient at x = ${c.x0}: Δy/Δx = ${f(gr, 3)}` : "tangent off", c.showLine ? `curve = line where ${MK.poly.str([c.c - c.k, c.b - c.m, a])} = 0` : ""] }]; },
    readouts(s, c) { const fn = this.fn(c), a = c.a || 0.5; const R = MK.roots(fn, -20, 20); return [["Roots (y = 0)", R.length ? R.map((r) => f(r, 3)).join(", ") : "none"], ["Gradient at x₀", f(2 * a * c.x0 + c.b, 3)], ["Intersections with line", c.showLine ? MK.roots((x) => fn(x) - c.m * x - c.k, -20, 20).map((r) => f(r, 3)).join(", ") || "none" : "—"]]; },
    table(s, c) { const fn = this.fn(c), xs = []; for (let x = c.lo; x <= c.hi; x++) xs.push(x); return T(["x", ...xs], [["y", ...xs.map((x) => f(fn(x), 2))]]); },
    steps(s, c) { const a = c.a || 0.5; return ["Complete the table of values for the given range.", "Choose a sensible scale (e.g. 2 cm to 1 unit on x) and plot every point.", "Join with a smooth curve — not straight segments.", `Read roots where the curve cuts y = 0; turning point at x = ${f(-c.b / (2 * a), 3)}.`, `Gradient at x = ${c.x0}: draw a tangent, build a right triangle, gradient = Δy/Δx ≈ ${f(2 * a * c.x0 + c.b, 3)}.`, c.showLine ? `Solve curve = line by reading the x-coordinates of the intersections.` : ""].filter(Boolean); },
    note: "Interpret graphs, complete tables of values, find max/min points, intercepts and the axis of symmetry; solve related equations, e.g. use y = x² + 5x + 6 to solve x² + 5x + 4 = 0 by drawing y = 2.",
    mistake: "Joining plotted points with a ruler. A quadratic graph is a smooth curve.",
  });

  /* ---------------- B-g Linear inequalities & linear programming ---------------- */
  MK.def("B-g", {
    title: "Linear inequalities & linear programming", env: "graph",
    values: { mode: "lp", a: 3, b: -2, op: "<", c: 7, l1: 8, l2: 12, l3: 10, px: 3, py: 2, obj: 0 },
    controls: [{ type: "tabs", key: "mode", label: "Mode", options: [["one", "One variable (number line)"], ["lp", "Two variables & linear programming"]] },
      { key: "a", label: "a in ax + b ? c", min: -5, max: 5, show: W("mode", "one") }, { key: "b", label: "b", min: -10, max: 10, show: W("mode", "one") }, { type: "select", key: "op", label: "Sign", options: [["<", "<"], ["<=", "≤"], [">", ">"], [">=", "≥"]], show: W("mode", "one") }, { key: "c", label: "c", min: -10, max: 20, show: W("mode", "one") },
      { key: "l1", label: "x + y ≤", min: 2, max: 14, show: W("mode", "lp") }, { key: "l2", label: "2x + y ≤", min: 2, max: 20, show: W("mode", "lp") }, { key: "l3", label: "x + 2y ≤", min: 2, max: 20, show: W("mode", "lp") }, { key: "px", label: "Profit per x (₦00)", min: 1, max: 10, show: W("mode", "lp") }, { key: "py", label: "Profit per y (₦00)", min: 1, max: 10, show: W("mode", "lp") }, { key: "obj", label: "Slide profit line P =", min: 0, max: 60, step: 0.5, show: W("mode", "lp") }],
    one(c) { if (!c.a) return null; let op = c.op; const v = (c.c - c.b) / c.a; if (c.a < 0) op = { "<": ">", "<=": ">=", ">": "<", ">=": "<=" }[op]; return { v, op }; },
    lp(c) { const cons = [{ a: 1, b: 1, c: c.l1, op: "<=" }, { a: 2, b: 1, c: c.l2, op: "<=" }, { a: 1, b: 2, c: c.l3, op: "<=" }, { a: 1, b: 0, c: 0, op: ">=" }, { a: 0, b: 1, c: 0, op: ">=" }];
      const poly = MK.clipRegion(cons, [-1, 25, -1, 25]); const verts = poly.map((p) => [MK.round(p[0], 4), MK.round(p[1], 4)]).filter((p, i, arr) => arr.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-6) === i);
      let best = null; verts.forEach((p) => { const v = c.px * p[0] + c.py * p[1]; if (!best || v > best.v) best = { p, v }; }); return { poly, verts, best }; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area;
      if (c.mode === "one") { const r = this.one(c), y = a.y + a.h / 2, lo = -10, hi = 12, X = (v) => a.x + 14 + (v - lo) / (hi - lo) * (a.w - 28);
        B.line(a.x + 6, y, a.x + a.w - 6, y, P.ink, 2); for (let k = lo; k <= hi; k++) { B.line(X(k), y - 6, X(k), y + 6, P.ink, 1.4); if (k % 2 === 0) B.text(String(k).replace("-", "−"), X(k), y + 22, { align: "center", size: 10.5 }); }
        if (r) { const v = MK.clamp(r.v, lo, hi), right = r.op.startsWith(">"); g.save(); g.strokeStyle = P.red; g.lineWidth = 5; g.globalAlpha = 0.7; g.beginPath(); g.moveTo(X(v), y - 14); g.lineTo(right ? X(hi) : X(lo), y - 14); g.stroke(); g.restore(); B.arrow(X(v), y - 14, right ? X(hi) + 4 : X(lo) - 4, y - 14, P.red, 3, 10);
          B.circle(X(v), y - 14, 7, P.red, r.op.includes("=") ? P.red : (MK.isNight() ? "#0d1426" : "#fff"), 2.5);
          const ints = []; for (let k = lo; k <= hi; k++) { const ok = { "<": k < r.v - 1e-9, "<=": k <= r.v + 1e-9, ">": k > r.v + 1e-9, ">=": k >= r.v - 1e-9 }[r.op]; if (ok) { ints.push(k); B.dot(X(k), y, P.green, 3.5); } }
          B.text(`x ${{ "<": "<", "<=": "≤", ">": ">", ">=": "≥" }[r.op]} ${MK.toFr(r.v).str()}`, a.x + 14, a.y + 60, { size: 18, w: 800, color: P.red }); B.text(r.op.includes("=") ? "● closed circle: value included" : "○ open circle: value not included", a.x + 14, a.y + 84, { size: 11.5, color: P.soft }); }
        return; }
      const L = this.lp(c), R = Math.max(c.l1, c.l2 / 1, c.l3) + 1, m = B.axes({ xmin: -0.5, xmax: Math.min(15, R), ymin: -0.5, ymax: Math.min(15, R), xstep: 1, ystep: 1 }); s.m = m;
      B.poly(L.poly.map((p) => [m.X(p[0]), m.Y(p[1])]), null, MK.isNight() ? "rgba(91,214,140,.22)" : "rgba(21,128,61,.18)");
      [[1, 1, c.l1, P.blue], [2, 1, c.l2, P.purple], [1, 2, c.l3, P.amber]].forEach(([A, Bc, C, col]) => B.plot(m, (x) => (C - A * x) / Bc, col, 2.2));
      L.verts.forEach((p) => B.dot(m.X(p[0]), m.Y(p[1]), P.ink, 3.5, `(${f(p[0], 2)}, ${f(p[1], 2)})`, { size: 9.5, dx: 5, dy: -5 }));
      const Pv = c.obj || (L.best ? L.best.v : 0); B.plot(m, (x) => (Pv - c.px * x) / c.py, P.red, 2.2, { dash: [7, 5] });
      if (L.best) B.dot(m.X(L.best.p[0]), m.Y(L.best.p[1]), P.red, 7);
      B.text("feasible region", m.X(0.4), m.Y(0.6), { size: 11, color: P.green, w: 700 });
    },
    hud(s, c) { if (c.mode === "one") { const r = this.one(c); return [{ title: "Solve", lines: [`${lin(c.a, c.b)} ${{ "<": "<", "<=": "≤", ">": ">", ">=": "≥" }[c.op]} ${c.c}`, c.a < 0 ? "Dividing by a negative REVERSES the sign" : "Same rules as equations", r ? [`x ${{ "<": "<", "<=": "≤", ">": ">", ">=": "≥" }[r.op]} ${f(r.v, 4)}`, null, true] : "a = 0"] }]; }
      const L = this.lp(c); return [{ title: "Constraints", lines: [`x + y ≤ ${c.l1}`, `2x + y ≤ ${c.l2}`, `x + 2y ≤ ${c.l3}`, "x ≥ 0, y ≥ 0"] }, { title: "Objective", lines: [`P = ${c.px}x + ${c.py}y (₦00)`, L.best ? [`max P = ${f(L.best.v, 2)} at (${f(L.best.p[0], 2)}, ${f(L.best.p[1], 2)})`, null, true] : "", "Max/min occurs at a vertex"] }]; },
    readouts(s, c) { if (c.mode === "one") { const r = this.one(c); if (!r) return [["Solution", "—"]]; const ints = []; for (let k = -10; k <= 12; k++) if ({ "<": k < r.v - 1e-9, "<=": k <= r.v + 1e-9, ">": k > r.v + 1e-9, ">=": k >= r.v - 1e-9 }[r.op]) ints.push(k); return [["Solution", `x ${{ "<": "<", "<=": "≤", ">": ">", ">=": "≥" }[r.op]} ${f(r.v, 4)}`], ["Integer truth set (−10…12)", ints.length > 8 ? `{${ints.slice(0, 4).join(", ")}, …, ${ints[ints.length - 1]}}` : `{${ints.join(", ")}}`]]; }
      const L = this.lp(c); return [["Vertices", L.verts.length], ["Max profit", L.best ? "₦" + f(L.best.v * 100) : "—"], ["Best (x, y)", L.best ? `(${f(L.best.p[0], 2)}, ${f(L.best.p[1], 2)})` : "—"]]; },
    table(s, c) { if (c.mode !== "lp") return ""; const L = this.lp(c); return T(["Vertex (x, y)", `P = ${c.px}x + ${c.py}y`], L.verts.map((p) => [`(${f(p[0], 2)}, ${f(p[1], 2)})`, f(c.px * p[0] + c.py * p[1], 3)]), L.verts.findIndex((p) => L.best && p === L.best.p)); },
    steps(s, c) { if (c.mode === "one") { const r = this.one(c); return [`${lin(c.a, c.b)} ${c.op} ${c.c}`, `Subtract ${c.b}: ${lin(c.a, 0)} ${c.op} ${c.c - c.b}`, c.a < 0 ? `Divide by ${c.a} (negative) and reverse the sign` : `Divide by ${c.a}`, r ? `x ${r.op} ${f(r.v, 4)}` : ""]; }
      return ["Draw each boundary line (solid for ≤ / ≥).", "Shade the unwanted side of each line; the unshaded/common region is feasible.", "List the vertices of the feasible region.", "Evaluate the objective function at each vertex (see table).", "Choose the largest (max) or smallest (min) value."]; },
    note: "One variable: show the truth set on the number line. Two variables: graphical solution of simultaneous inequalities, then maximum/minimum values — linear programming (minimum cost, maximum profit).",
    mistake: "Forgetting to reverse the inequality sign when multiplying or dividing by a negative number.",
  });

  /* ---------------- B-h Algebraic fractions ---------------- */
  MK.def("B-h", {
    title: "Algebraic fractions", env: "graph",
    values: { mode: "binom", p: 1, q: 1, a: 3, b: -2, x: 1, m1: 2, m2: 3 },
    controls: [{ type: "tabs", key: "mode", label: "Denominators", options: [["mono", "Monomial: p/x + q/y"], ["binom", "Binomial: p/(x−a) + q/(x−b)"]] }, { key: "p", label: "p", min: -5, max: 5 }, { key: "q", label: "q", min: -5, max: 5 }, { key: "a", label: "a", min: -6, max: 6, show: W("mode", "binom") }, { key: "b", label: "b", min: -6, max: 6, show: W("mode", "binom") }, { key: "m1", label: "x value", min: -6, max: 6, show: W("mode", "mono") }, { key: "m2", label: "y value", min: -6, max: 6, show: W("mode", "mono") }, { key: "x", label: "Evaluate at x", min: -8, max: 8, step: 0.5, show: W("mode", "binom") }],
    fn(c) { return (x) => c.p / (x - c.a) + c.q / (x - c.b); },
    draw(g, s, c, B) {
      const P = B.P, a = B.area;
      if (c.mode === "mono") { const x = c.m1, y = c.m2; B.text(`${c.p}/x + ${c.q}/y = (${c.p}y + ${c.q}x)/(xy)`, a.x + 14, a.y + 60, { size: 17, w: 800, color: P.blue, fam: "serif" });
        if (!x || !y) B.text("Undefined: x and y cannot be 0", a.x + 14, a.y + 100, { size: 14, color: P.red, w: 700 }); else { B.text(`x = ${x}, y = ${y}:  ${c.p}/${x} + ${c.q}/${y} = ${MK.toFr(c.p / x + c.q / y).str()}`, a.x + 14, a.y + 100, { size: 14, w: 700 }); }
        B.text("LCM of the denominators is xy", a.x + 14, a.y + 140, { size: 12, color: P.soft }); return; }
      const fn = this.fn(c), m = B.axes({ xmin: -8, xmax: 8, ymin: -8, ymax: 8 });
      [c.a, c.b].forEach((v) => { B.line(m.X(v), m.r.y, m.X(v), m.r.y + m.r.h, P.red, 1.4, [6, 4]); B.text("x = " + v + " undefined", m.X(v) + 4, m.r.y + 26 + (v === c.b ? 16 : 0), { size: 10.5, color: P.red, w: 700 }); });
      B.plot(m, fn, P.blue, 2.6); if (c.x !== c.a && c.x !== c.b) B.dot(m.X(c.x), m.Y(MK.clamp(fn(c.x), -8, 8)), P.amber, 6, f(fn(c.x), 3));
    },
    combined(c) { const A = c.p + c.q, Bc = -(c.p * c.b + c.q * c.a); return `(${lin(A, Bc)}) / ((x${sgn(-c.a)})(x${sgn(-c.b)}))`; },
    hud(s, c) { if (c.mode === "mono") return [{ title: "Rule", lines: ["a/x + b/y = (ay + bx)/xy", "x ≠ 0, y ≠ 0"] }]; const fx = this.fn(c)(c.x); return [{ title: "Combine", lines: [`${c.p}/(x${sgn(-c.a)}) + ${c.q}/(x${sgn(-c.b)})`, [`= ${this.combined(c)}`, null, false], "—", `Undefined at x = ${c.a} and x = ${c.b}`, c.x === c.a || c.x === c.b ? ["At this x: undefined", "#ff7b72"] : `At x = ${c.x}: ${f(fx, 4)}`] }]; },
    readouts(s, c) { if (c.mode === "mono") return [["Combined", `(${c.p}y + ${c.q}x)/(xy)`]]; return [["Combined", this.combined(c)], ["Undefined for", `x = ${c.a}, ${c.b}`], ["Value", c.x === c.a || c.x === c.b ? "undefined" : f(this.fn(c)(c.x), 4)]]; },
    steps(s, c) { if (c.mode === "mono") return ["LCM of x and y is xy.", `${c.p}/x = ${c.p}y/xy and ${c.q}/y = ${c.q}x/xy`, `Add numerators: (${c.p}y + ${c.q}x)/xy`]; return [`LCM of the denominators: (x${sgn(-c.a)})(x${sgn(-c.b)})`, `Numerator: ${c.p}(x${sgn(-c.b)}) + ${c.q}(x${sgn(-c.a)})`, `= ${lin(c.p + c.q, -(c.p * c.b + c.q * c.a))}`, `Result: ${this.combined(c)}; undefined where a denominator is 0 (x = ${c.a}, ${c.b}).`]; },
    note: "Simple cases with monomial and binomial denominators, and values for which a fraction is undefined, e.g. 1/(x + 3) is not defined for x = −3.",
    mistake: "Adding numerators and denominators separately: 1/x + 1/y ≠ 2/(x + y).",
  });

  /* ---------------- B-i Functions & relations ---------------- */
  const RELS = { "x+1": { lab: "x → x + 1", f: (x) => [x + 1], type: "one-to-one" }, "2x-1": { lab: "x → 2x − 1", f: (x) => [2 * x - 1], type: "one-to-one" }, "x2": { lab: "x → x²", f: (x) => [x * x], type: "many-to-one" }, const: { lab: "x → 3", f: () => [3], type: "many-to-one" }, sqrt: { lab: "x → ±√x", f: (x) => (x >= 0 ? (x ? [Math.sqrt(x), -Math.sqrt(x)] : [0]) : []), type: "one-to-many" }, factor: { lab: "x → its factors", f: (x) => { const r = []; for (let k = 1; k <= Math.abs(x); k++) if (x % k === 0) r.push(k); return r; }, type: "many-to-many" } };
  MK.def("B-i", {
    title: "Functions & relations", env: "paper",
    values: { rule: "x2", dom: "-2,-1,0,1,2", guessA: 2, guessB: -1, hideA: 3, hideB: 1, mode: "map" },
    controls: [{ type: "tabs", key: "mode", label: "Mode", options: [["map", "Mapping types"], ["rule", "Find the rule"]] }, { type: "select", key: "rule", label: "Relation", options: Object.keys(RELS).map((k) => [k, RELS[k].lab]), show: W("mode", "map") }, { type: "text", key: "dom", label: "Domain (comma separated)", show: W("mode", "map") },
      { key: "hideA", label: "Hidden rule: a (in ax + b)", min: -4, max: 5, show: W("mode", "rule") }, { key: "hideB", label: "Hidden rule: b", min: -6, max: 6, show: W("mode", "rule") }, { key: "guessA", label: "Your guess a", min: -4, max: 5, show: W("mode", "rule") }, { key: "guessB", label: "Your guess b", min: -6, max: 6, show: W("mode", "rule") }],
    pairs(c) { if (c.mode === "rule") return [1, 2, 3, 4].map((x) => [x, c.hideA * x + c.hideB]); const R = RELS[c.rule] || RELS.x2, dom = [...new Set(String(c.dom).split(",").map((t) => parseFloat(t)).filter((v) => !isNaN(v)))].slice(0, 7); const out = []; dom.forEach((x) => R.f(x).forEach((y) => out.push([x, MK.round(y, 3)]))); return out; },
    classify(pairs) { const byX = {}, byY = {}; pairs.forEach(([x, y]) => { (byX[x] = byX[x] || new Set()).add(y); (byY[y] = byY[y] || new Set()).add(x); }); const oneX = Object.values(byX).every((s) => s.size <= 1), oneY = Object.values(byY).every((s) => s.size <= 1); return oneX && oneY ? "one-to-one" : oneX ? "many-to-one" : oneY ? "one-to-many" : "many-to-many"; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area, pr = this.pairs(c), xs = [...new Set(pr.map((p) => p[0]))], ys = [...new Set(pr.map((p) => p[1]))].sort((p, q) => p - q);
      const oval = (cx, items, lab, col) => { const h = Math.max(120, items.length * 30 + 30), cy = a.y + 70 + h / 2; g.save(); g.beginPath(); g.ellipse(cx, cy, 52, h / 2, 0, 0, MK.TAU); g.fillStyle = col + "1f"; g.fill(); g.strokeStyle = col; g.lineWidth = 2; g.stroke(); g.restore(); B.text(lab, cx, a.y + 58, { align: "center", w: 800, color: col }); return items.map((v, i) => [v, cx, cy - (items.length - 1) * 15 + i * 30]); };
      const L = oval(a.x + 70, xs, "Domain", P.blue), R = oval(a.x + 260, ys, c.mode === "rule" ? "Image" : "Co-domain", P.green);
      L.forEach(([v, x, y]) => { B.dot(x, y, P.blue, 4); B.text(f(v, 2), x - 14, y + 4, { align: "right", size: 12, w: 700 }); });
      R.forEach(([v, x, y]) => { B.dot(x, y, P.green, 4); B.text(f(v, 2), x + 14, y + 4, { size: 12, w: 700 }); });
      pr.forEach(([x, y]) => { const p = L.find((q) => q[0] === x), q = R.find((r) => r[0] === y); if (p && q) B.arrow(p[1] + 6, p[2], q[1] - 7, q[2], P.red, 1.8, 8); });
      if (c.mode === "rule") { const ok = c.guessA === c.hideA && c.guessB === c.hideB; B.text(`Your rule x → ${lin(c.guessA, c.guessB)} gives ${[1, 2, 3, 4].map((x) => c.guessA * x + c.guessB).join(", ")}`, a.x + 10, a.y + a.h - 34, { size: 12, color: ok ? P.green : P.soft, w: 700 }); B.text(ok ? "✓ Correct rule!" : "Compare with the images above", a.x + 10, a.y + a.h - 12, { size: 13, w: 800, color: ok ? P.green : P.amber }); }
      else B.text(this.classify(pr), a.x + 10, a.y + a.h - 12, { size: 16, w: 800, color: P.purple });
    },
    hud(s, c) { const pr = this.pairs(c), t = this.classify(pr); return [{ title: "Classification", lines: [c.mode === "rule" ? "Images: " + pr.map((p) => p[1]).join(", ") : RELS[c.rule].lab, [t, null, true], t === "one-to-one" || t === "many-to-one" ? "It IS a function (each x has one image)" : "NOT a function (some x has several images)"] }, { title: "Types", lines: ["one-to-one · many-to-one", "one-to-many · many-to-many"] }]; },
    readouts(s, c) { const pr = this.pairs(c); return [["Ordered pairs", pr.slice(0, 6).map((p) => `(${f(p[0], 2)}, ${f(p[1], 2)})`).join(" ") + (pr.length > 6 ? " …" : "")], ["Type", this.classify(pr)]]; },
    steps(s, c) { if (c.mode === "rule") return ["Look at how the images change when x increases by 1 — that change is a.", `Here the images go up by ${c.hideA} each time, so a = ${c.hideA}.`, `Substitute x = 1: image = a + b ⇒ b = ${c.hideA + c.hideB} − ${c.hideA} = ${c.hideB}.`, `Rule: x → ${lin(c.hideA, c.hideB)}`]; return ["List each element of the domain and its image(s).", "If every x has exactly one image, the relation is a function.", "Check whether two different x share an image (many-to-one) or if any x has two images (one-to-many)."]; },
    note: "Types of functions: one-to-one, one-to-many, many-to-one, many-to-many. Functions as mappings; determine the rule of a given mapping.",
    mistake: "Calling a one-to-many relation (like x → ±√x) a function. A function gives exactly one image for each input.",
  });
})();
