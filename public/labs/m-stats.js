/* m-stats.js — WAEC Core Mathematics: Statistics & Probability (H) and Vectors & Transformation (I). */
(function () {
  "use strict";
  const MK = window.MK, f = MK.fmt, T = MK.table, W = MK.when, R = MK.rad, D = MK.deg, TAU = MK.TAU;
  const DATA = "34, 45, 52, 38, 61, 47, 55, 42, 49, 58, 36, 44, 51, 63, 40, 48, 57, 53, 46, 39, 50, 59, 43, 54, 41, 65, 37, 56, 47, 52";
  const nums = (t) => String(t).split(/[,\s]+/).map(parseFloat).filter((v) => !isNaN(v));
  /* grouped frequency table with equal class widths */
  function group(data, start, width) { const mx = Math.max(...data), cls = []; for (let lo = start; lo <= mx; lo += width) { const hi = lo + width - 1, fr = data.filter((v) => v >= lo && v <= hi).length; cls.push({ lo, hi, lb: lo - 0.5, ub: hi + 0.5, x: (lo + hi) / 2, f: fr }); } let cum = 0; cls.forEach((k) => { cum += k.f; k.cf = cum; }); return cls; }
  MK.group = group;
  const tally = (B, x, y, n, col) => { let k = 0; for (let g5 = 0; g5 < Math.floor(n / 5); g5++) { for (let i = 0; i < 4; i++) B.line(x + k + i * 5, y - 12, x + k + i * 5, y + 2, col, 1.6); B.line(x + k - 3, y - 2, x + k + 18, y - 9, col, 1.6); k += 28; } for (let i = 0; i < n % 5; i++) B.line(x + k + i * 5, y - 12, x + k + i * 5, y + 2, col, 1.6); };
  function stats(data) { const n = data.length, s = [...data].sort((a, b) => a - b), mean = data.reduce((a, b) => a + b, 0) / n, q = (p) => { const pos = p * (n + 1); if (pos <= 1) return s[0]; if (pos >= n) return s[n - 1]; const i = Math.floor(pos); return s[i - 1] + (pos - i) * (s[i] - s[i - 1]); };
    const fr = {}; data.forEach((v) => (fr[v] = (fr[v] || 0) + 1)); const mf = Math.max(...Object.values(fr)), modes = Object.keys(fr).filter((k) => fr[k] === mf).map(Number);
    const vr = data.reduce((a, v) => a + (v - mean) ** 2, 0) / n, md = data.reduce((a, v) => a + Math.abs(v - mean), 0) / n; return { n, s, mean, median: q(0.5), q1: q(0.25), q3: q(0.75), modes, mf, range: s[n - 1] - s[0], vr, sd: Math.sqrt(vr), md }; }
  MK.stats = stats;

  /* ---------------- H-A(i) Frequency distribution ---------------- */
  MK.def("H-A(i)", {
    title: "Frequency distribution", env: "paper",
    values: { data: DATA, start: 30, width: 5 },
    controls: [{ type: "text", key: "data", label: "Raw data (comma separated)" }, { key: "start", label: "First class starts at", min: 0, max: 60 }, { key: "width", label: "Class width (equal intervals)", min: 2, max: 20 }],
    cls(c) { const d = nums(c.data); if (!d.length) return []; return group(d, Math.min(c.start, Math.min(...d)), c.width); },
    draw(g, s, c, B) {
      const P = B.P, a = B.area, cls = this.cls(c); if (!cls.length) { B.text("Enter some numbers", a.x + 10, a.y + 60, { color: P.red }); return; }
      const rows = cls.length, rh = Math.min(30, (a.h - 70) / (rows + 1)), x0 = a.x + 6, cols = [0, 80, 210, 260];
      B.panel(x0, a.y + 36, a.w - 12, rh * (rows + 1) + 8); ["Class", "Tally", "f", "c.f."].forEach((h, i) => B.text(h, x0 + 10 + cols[i], a.y + 36 + rh * 0.75, { w: 800, color: P.panelHead, halo: false }));
      cls.forEach((k, i) => { const y = a.y + 36 + rh * (i + 1.75); B.text(`${k.lo} – ${k.hi}`, x0 + 10, y, { halo: false, size: 11.5 }); tally(B, x0 + 10 + cols[1], y, k.f, P.ink); B.text(String(k.f), x0 + 10 + cols[2], y, { w: 800, halo: false }); B.text(String(k.cf), x0 + 10 + cols[3], y, { halo: false, color: P.soft }); });
    },
    hud(s, c) { const cls = this.cls(c), n = nums(c.data).length; return [{ title: "Vocabulary", lines: [cls.length ? `class ${cls[0].lo}–${cls[0].hi}` : "", cls.length ? `class boundaries ${cls[0].lb} – ${cls[0].ub}` : "", cls.length ? `class mark (mid-value) ${cls[0].x}` : "", `class width = ${c.width}`, "—", `Σf = ${n}`] }]; },
    readouts(s, c) { const d = nums(c.data); return [["Number of data", d.length], ["Smallest / largest", d.length ? Math.min(...d) + " / " + Math.max(...d) : "—"], ["Classes", this.cls(c).length]]; },
    table(s, c) { const cls = this.cls(c); return T(["Class", "Boundaries", "Class mark x", "f", "Cum. f"], cls.map((k) => [`${k.lo}–${k.hi}`, `${k.lb}–${k.ub}`, k.x, k.f, k.cf])); },
    steps(s, c) { const d = nums(c.data); return [`Find the smallest (${Math.min(...d)}) and largest (${Math.max(...d)}) values.`, `Choose equal classes of width ${c.width}, starting at ${Math.min(c.start, Math.min(...d))}.`, "Go through the data once, making a tally mark for each value (bundle in fives).", "Count the tallies to get each frequency; Σf must equal the number of data.", "Class boundaries are 0.5 below and above the class limits; the class mark is their midpoint."]; },
    note: "Construct frequency distribution tables; understand class intervals, class mark and class boundary. Unequal class intervals are excluded.",
    mistake: "Using class limits (30, 34) instead of boundaries (29.5, 34.5) when drawing histograms or ogives.",
  });

  /* ---------------- H-A(ii) Charts ---------------- */
  MK.def("H-A(ii)", {
    title: "Pie chart, bar chart, histogram & polygon", env: "graph",
    values: { kind: "pie", cats: "Maths:12, English:9, Physics:7, Chemistry:5, Biology:3", data: DATA, start: 30, width: 5 },
    controls: [{ type: "tabs", key: "kind", label: "Chart", options: [["pie", "Pie chart"], ["bar", "Bar chart"], ["hist", "Histogram"], ["poly", "Frequency polygon"]] }, { type: "text", key: "cats", label: "Categories (label:value, …)", show: W("kind", "pie", "bar") }, { type: "text", key: "data", label: "Raw data", show: W("kind", "hist", "poly") }, { key: "width", label: "Class width", min: 2, max: 20, show: W("kind", "hist", "poly") }, { key: "start", label: "First class starts at", min: 0, max: 60, show: W("kind", "hist", "poly") }],
    cats(c) { return String(c.cats).split(",").map((t) => t.split(":")).filter((p) => p.length === 2 && !isNaN(parseFloat(p[1]))).map(([l, v]) => [l.trim(), parseFloat(v)]); },
    draw(g, s, c, B) {
      const P = B.P, a = B.area, cols = [P.blue, P.red, P.green, P.amber, P.purple, P.teal, P.pink];
      if (c.kind === "pie" || c.kind === "bar") { const cats = this.cats(c), tot = cats.reduce((x, y) => x + y[1], 0); if (!tot) return;
        if (c.kind === "pie") { const cx = a.x + a.w / 2, cy = a.y + a.h / 2 + 14, r = Math.min(a.w, a.h) * 0.3; let t = -Math.PI / 2; cats.forEach(([l, v], i) => { const ang = v / tot * TAU; g.save(); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r, t, t + ang); g.closePath(); g.fillStyle = cols[i % 7]; g.shadowColor = P.shadow; g.shadowBlur = 6; g.fill(); g.restore(); B.arc(cx, cy, r, t, t + ang, "#fff", 2); const m = t + ang / 2; B.text(`${l} ${f(v / tot * 360, 1)}°`, cx + Math.cos(m) * (r + 18), cy + Math.sin(m) * (r + 18) + 4, { align: Math.cos(m) > 0.1 ? "left" : Math.cos(m) < -0.1 ? "right" : "center", size: 11, w: 700, color: cols[i % 7] }); t += ang; }); return; }
        const mx = Math.max(...cats.map((x) => x[1])), m = B.axes({ xmin: 0, xmax: cats.length, ymin: 0, ymax: mx * 1.15, xstep: 1, labels: true, xl: "", yl: "f", grid: true }); const bw = (m.X(1) - m.X(0)) * 0.6;
        cats.forEach(([l, v], i) => { const x = m.X(i + 0.5); g.save(); g.fillStyle = cols[i % 7]; g.shadowColor = P.shadow; g.shadowBlur = 4; g.fillRect(x - bw / 2, m.Y(v), bw, m.Y(0) - m.Y(v)); g.restore(); B.text(l, x, m.Y(0) + 28, { align: "center", size: 10, w: 700 }); }); return; }
      const d = nums(c.data); if (!d.length) return; const cls = group(d, Math.min(c.start, Math.min(...d)), c.width), mx = Math.max(...cls.map((k) => k.f));
      const m = B.axes({ xmin: cls[0].lb - c.width, xmax: cls[cls.length - 1].ub + c.width, ymin: 0, ymax: mx + 1, xstep: c.width, ystep: 1, xl: "score", yl: "f" });
      if (c.kind === "hist") cls.forEach((k) => B.poly([[m.X(k.lb), m.Y(0)], [m.X(k.lb), m.Y(k.f)], [m.X(k.ub), m.Y(k.f)], [m.X(k.ub), m.Y(0)]], P.blue, P.fillB, 1.6));
      else { cls.forEach((k) => B.poly([[m.X(k.lb), m.Y(0)], [m.X(k.lb), m.Y(k.f)], [m.X(k.ub), m.Y(k.f)], [m.X(k.ub), m.Y(0)]], P.faint, null, 1, true, [3, 3])); const pts = [[cls[0].x - c.width, 0], ...cls.map((k) => [k.x, k.f]), [cls[cls.length - 1].x + c.width, 0]]; B.poly(pts.map((p) => [m.X(p[0]), m.Y(p[1])]), P.red, null, 2.6, false); pts.forEach((p) => B.dot(m.X(p[0]), m.Y(p[1]), P.red, 3.5)); }
    },
    hud(s, c) { if (c.kind === "pie") { const cats = this.cats(c), tot = cats.reduce((x, y) => x + y[1], 0); return [{ title: "Pie chart", lines: ["angle = (value ÷ total) × 360°", ...cats.slice(0, 6).map(([l, v]) => `${l}: ${v}/${tot} × 360 = ${f(v / tot * 360, 1)}°`)] }]; }
      if (c.kind === "bar") return [{ title: "Bar chart", lines: ["Bars of equal width with gaps", "height = frequency"] }];
      return [{ title: c.kind === "hist" ? "Histogram" : "Frequency polygon", lines: c.kind === "hist" ? ["bars touch at the class boundaries", "height = frequency (equal widths)"] : ["plot (class mark, f) and join with straight lines", "close at the class marks either side with f = 0"] }]; },
    readouts(s, c) { if (c.kind === "pie" || c.kind === "bar") { const cats = this.cats(c), tot = cats.reduce((x, y) => x + y[1], 0), best = cats.reduce((m, x) => (x[1] > m[1] ? x : m), cats[0] || ["—", 0]); return [["Total", tot], ["Largest group", best[0]]]; } const d = nums(c.data); const cls = group(d, Math.min(c.start, Math.min(...d)), c.width), mc = cls.reduce((m, k) => (k.f > m.f ? k : m), cls[0]); return [["Modal class", `${mc.lo}–${mc.hi}`], ["Classes", cls.length]]; },
    steps(s, c) { if (c.kind === "pie") return ["Add the values to get the total.", "Each sector angle = value ÷ total × 360°.", "Check the angles add to 360°, then draw each sector with a protractor."]; if (c.kind === "bar") return ["Choose a scale for the frequency axis.", "Draw separate bars of equal width."]; return ["Mark class boundaries on the horizontal axis.", c.kind === "hist" ? "Draw touching bars whose heights are the frequencies." : "Plot each frequency above its class mark and join the points."]; },
    note: "Read and draw simple inferences from graphs; interpret data in histograms.", mistake: "Leaving gaps between histogram bars — histograms show continuous classes, so the bars touch.",
  });

  /* ---------------- H-A(iii) Mean, median, mode ---------------- */
  MK.def("H-A(iii)", {
    title: "Mean, median & mode", env: "graph",
    values: { mode: "discrete", data: "4, 7, 2, 9, 7, 5, 3, 7, 8, 6, 5", gdata: DATA, start: 30, width: 5, A: 47 },
    controls: [{ type: "tabs", key: "mode", label: "Data", options: [["discrete", "Discrete (list)"], ["grouped", "Grouped frequency"]] }, { type: "text", key: "data", label: "Data", show: W("mode", "discrete") }, { type: "text", key: "gdata", label: "Raw data to group", show: W("mode", "grouped") }, { key: "width", label: "Class width", min: 2, max: 20, show: W("mode", "grouped") }, { key: "start", label: "First class starts at", min: 0, max: 60, show: W("mode", "grouped") }, { key: "A", label: "Assumed mean A", min: 0, max: 100, step: 0.5, show: W("mode", "grouped") }],
    g(c) { const d = nums(c.gdata); const cls = group(d, Math.min(c.start, Math.min(...d)), c.width), N = d.length, sfx = cls.reduce((a, k) => a + k.f * k.x, 0), mean = sfx / N; const mi = cls.reduce((m, k, i) => (k.f > cls[m].f ? i : m), 0), mc = cls[mi], d1 = mc.f - (cls[mi - 1] ? cls[mi - 1].f : 0), d2 = mc.f - (cls[mi + 1] ? cls[mi + 1].f : 0), mode = mc.lb + (d1 / ((d1 + d2) || 1)) * c.width;
      const half = N / 2, k = cls.find((q) => q.cf >= half), prev = cls[cls.indexOf(k) - 1], median = k.lb + ((half - (prev ? prev.cf : 0)) / (k.f || 1)) * c.width; return { cls, N, sfx, mean, mode, median, mi }; },
    draw(g, s, c, B) {
      const P = B.P, a = B.area;
      if (c.mode === "discrete") { const d = nums(c.data); if (!d.length) return; const S = stats(d), lo = Math.min(...d) - 1, hi = Math.max(...d) + 1, m = B.axes({ xmin: lo, xmax: hi, ymin: 0, ymax: S.mf + 1.5, xstep: 1, ystep: 1, yl: "count", xl: "value" }), cnt = {};
        d.forEach((v) => { cnt[v] = (cnt[v] || 0) + 1; const y = cnt[v] - 0.5; g.save(); const gr = g.createRadialGradient(m.X(v) - 3, m.Y(y) - 3, 1, m.X(v), m.Y(y), 11); gr.addColorStop(0, "#9cc2ff"); gr.addColorStop(1, P.blue); g.fillStyle = gr; g.beginPath(); g.arc(m.X(v), m.Y(y), Math.min(10, (m.Y(0) - m.Y(1)) * 0.42), 0, TAU); g.fill(); g.restore(); });
        const fy = m.Y(0) + 4; g.save(); g.fillStyle = P.red; g.beginPath(); g.moveTo(m.X(S.mean), fy); g.lineTo(m.X(S.mean) - 9, fy + 14); g.lineTo(m.X(S.mean) + 9, fy + 14); g.closePath(); g.fill(); g.restore();
        B.line(m.X(S.mean), m.r.y, m.X(S.mean), m.Y(0), P.red, 1.6, [5, 4]); B.text("mean (balance point) " + f(S.mean, 3), m.X(S.mean) + 5, m.r.y + 14, { size: 10.5, color: P.red, w: 700 }); B.line(m.X(S.median), m.r.y + 20, m.X(S.median), m.Y(0), P.green, 1.6, [2, 3]); B.text("median " + f(S.median, 2), m.X(S.median) + 5, m.r.y + 32, { size: 10.5, color: P.green, w: 700 }); return; }
      const G = this.g(c), cls = G.cls, mx = Math.max(...cls.map((k) => k.f)), m = B.axes({ xmin: cls[0].lb - c.width, xmax: cls[cls.length - 1].ub + c.width, ymin: 0, ymax: mx + 1, xstep: c.width, ystep: 1, xl: "score", yl: "f" });
      cls.forEach((k, i) => B.poly([[m.X(k.lb), m.Y(0)], [m.X(k.lb), m.Y(k.f)], [m.X(k.ub), m.Y(k.f)], [m.X(k.ub), m.Y(0)]], P.blue, i === G.mi ? P.fillA : P.fillB, 1.6));
      const mc = cls[G.mi], pv = cls[G.mi - 1], nx = cls[G.mi + 1]; B.line(m.X(mc.lb), m.Y(mc.f), m.X(mc.ub), m.Y(nx ? nx.f : 0), P.red, 1.8); B.line(m.X(mc.ub), m.Y(mc.f), m.X(mc.lb), m.Y(pv ? pv.f : 0), P.red, 1.8);
      B.line(m.X(G.mode), m.Y(0), m.X(G.mode), m.Y(mc.f), P.red, 1.4, [4, 3]); B.text("mode ≈ " + f(G.mode, 2), m.X(G.mode) + 4, m.Y(mc.f) - 8, { color: P.red, w: 800, size: 11 });
    },
    hud(s, c) { if (c.mode === "discrete") { const d = nums(c.data), S = stats(d); return [{ title: "Averages", lines: [`mean x̄ = Σx/n = ${d.reduce((a, b) => a + b, 0)}/${S.n} = ${f(S.mean, 3)}`, `median = middle value = ${f(S.median, 2)}`, `mode = most frequent = ${S.modes.join(", ")}`] }]; }
      const G = this.g(c), sfd = G.cls.reduce((a, k) => a + k.f * (k.x - c.A), 0); return [{ title: "Grouped data", lines: [`x̄ = Σfx/Σf = ${G.sfx}/${G.N} = ${f(G.mean, 3)}`, `assumed mean: x̄ = A + Σfd/Σf = ${c.A} + ${f(sfd, 2)}/${G.N} = ${f(c.A + sfd / G.N, 3)}`, `median (interpolated) ≈ ${f(G.median, 2)}`, `mode (from histogram) ≈ ${f(G.mode, 2)}`] }]; },
    readouts(s, c) { if (c.mode === "discrete") { const S = stats(nums(c.data)); return [["Mean", f(S.mean, 3)], ["Median", f(S.median, 2)], ["Mode", S.modes.join(", ")]]; } const G = this.g(c); return [["Mean", f(G.mean, 3)], ["Median", f(G.median, 2)], ["Mode", f(G.mode, 2)]]; },
    table(s, c) { if (c.mode === "discrete") return ""; const G = this.g(c); return T(["Class", "x", "f", "fx", "d = x − A", "fd"], G.cls.map((k) => [`${k.lo}–${k.hi}`, k.x, k.f, f(k.f * k.x, 1), f(k.x - c.A, 1), f(k.f * (k.x - c.A), 1)]).concat([["Σ", "", G.N, f(G.sfx, 1), "", f(G.cls.reduce((a, k) => a + k.f * (k.x - c.A), 0), 1)]]), G.mi); },
    steps(s, c) { if (c.mode === "discrete") { const d = nums(c.data), S = stats(d); return [`Arrange in order: ${S.s.join(", ")}`, `Mean = ${d.reduce((a, b) => a + b, 0)} ÷ ${S.n} = ${f(S.mean, 3)}`, `Median: position (n + 1)/2 = ${(S.n + 1) / 2} → ${f(S.median, 2)}`, `Mode: ${S.modes.join(", ")} (appears ${S.mf} times)`]; }
      const G = this.g(c); return ["Find the class marks x and work out fx for each class (see table).", `x̄ = Σfx ÷ Σf = ${f(G.sfx, 1)} ÷ ${G.N} = ${f(G.mean, 3)}`, `Mode: draw the crossing lines in the tallest bar → ≈ ${f(G.mode, 2)}`, `Median: read from the ogive at N/2 = ${G.N / 2} (≈ ${f(G.median, 2)})`]; },
    note: "Mean, median and mode for discrete and grouped data. Use of an assumed mean is acceptable. For grouped data the mode is estimated from the histogram and the median from the cumulative frequency curve.",
    mistake: "Dividing Σfx by the number of classes instead of Σf.",
  });

  /* ---------------- H-A(iv) Ogive ---------------- */
  MK.def("H-A(iv)", {
    title: "Cumulative frequency curve (ogive)", env: "graph",
    values: { data: DATA, start: 30, width: 5, pc: 90 },
    controls: [{ type: "text", key: "data", label: "Raw data" }, { key: "width", label: "Class width", min: 2, max: 20 }, { key: "start", label: "First class starts at", min: 0, max: 60 }, { key: "pc", label: "Percentile to read", min: 1, max: 99, unit: "th" }],
    cls(c) { const d = nums(c.data); return group(d, Math.min(c.start, Math.min(...d)), c.width); },
    read(cls, N, frac) { const tgt = frac * N, pts = [[cls[0].lb, 0], ...cls.map((k) => [k.ub, k.cf])]; for (let i = 1; i < pts.length; i++) if (pts[i][1] >= tgt) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return x0 + (tgt - y0) / ((y1 - y0) || 1) * (x1 - x0); } return pts[pts.length - 1][0]; },
    draw(g, s, c, B) {
      const P = B.P, cls = this.cls(c), N = cls[cls.length - 1].cf, m = B.axes({ xmin: cls[0].lb - c.width, xmax: cls[cls.length - 1].ub + c.width / 2, ymin: 0, ymax: N * 1.08, xstep: c.width, xl: "upper boundary", yl: "cum. f" });
      const pts = [[cls[0].lb, 0], ...cls.map((k) => [k.ub, k.cf])];
      g.save(); g.strokeStyle = P.blue; g.lineWidth = 2.8; g.beginPath(); const sp = pts.map((p) => [m.X(p[0]), m.Y(p[1])]); g.moveTo(...sp[0]); for (let i = 1; i < sp.length; i++) { const p0 = sp[Math.max(0, i - 2)], p1 = sp[i - 1], p2 = sp[i], p3 = sp[Math.min(sp.length - 1, i + 1)]; g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); } g.stroke(); g.restore();
      sp.forEach((p) => B.dot(p[0], p[1], P.ink, 3.2));
      [[0.25, "Q₁", P.green], [0.5, "median", P.red], [0.75, "Q₃", P.green], [c.pc / 100, "P" + MK.sub(c.pc), P.purple]].forEach(([fr, lab, col]) => { const x = this.read(cls, N, fr), y = fr * N; B.line(m.X(m.xmin), m.Y(y), m.X(x), m.Y(y), col, 1.4, [5, 4]); B.line(m.X(x), m.Y(y), m.X(x), m.Y(0), col, 1.4, [5, 4]); B.text(lab + " ≈ " + f(x, 1), m.X(x) + 4, m.Y(0) - 6 - (lab === "Q₃" ? 14 : lab === "median" ? 28 : lab.startsWith("P") ? 42 : 0), { size: 10.5, color: col, w: 700 }); });
    },
    hud(s, c) { const cls = this.cls(c), N = cls[cls.length - 1].cf, q1 = this.read(cls, N, 0.25), q2 = this.read(cls, N, 0.5), q3 = this.read(cls, N, 0.75); return [{ title: "Reading the ogive", lines: [`N = ${N}`, `median at N/2 = ${N / 2} → ${f(q2, 2)}`, `Q₁ at N/4 = ${N / 4} → ${f(q1, 2)}`, `Q₃ at 3N/4 = ${3 * N / 4} → ${f(q3, 2)}`, `IQR = Q₃ − Q₁ = ${f(q3 - q1, 2)}`, `SIQR = ½(Q₃ − Q₁) = ${f((q3 - q1) / 2, 2)}`, `${c.pc}th percentile ≈ ${f(this.read(cls, N, c.pc / 100), 2)}`] }]; },
    readouts(s, c) { const cls = this.cls(c), N = cls[cls.length - 1].cf; return [["Median", f(this.read(cls, N, 0.5), 2)], ["IQR", f(this.read(cls, N, 0.75) - this.read(cls, N, 0.25), 2)], [c.pc + "th percentile", f(this.read(cls, N, c.pc / 100), 2)]]; },
    table(s, c) { const cls = this.cls(c); return T(["Class", "Upper boundary", "f", "Cum. f"], cls.map((k) => [`${k.lo}–${k.hi}`, k.ub, k.f, k.cf])); },
    steps(s, c) { return ["Make a cumulative frequency column (running totals).", "Plot cumulative frequency against the UPPER class boundary; start at (lowest boundary, 0).", "Join with a smooth S-shaped curve.", "Read the median at N/2, the quartiles at N/4 and 3N/4, percentiles at p% of N.", "Application: e.g. pass marks so that a given percentage of candidates pass."]; },
    note: "Constructing and reading the ogive; application to everyday life (e.g. finding a pass mark).", mistake: "Plotting cumulative frequency against class marks instead of upper class boundaries.",
  });

  /* ---------------- H-A(v) Measures of dispersion ---------------- */
  MK.def("H-A(v)", {
    title: "Measures of dispersion", env: "graph",
    values: { data: "12, 15, 12, 18, 20, 15, 15, 22, 18, 12" },
    controls: [{ type: "text", key: "data", label: "Data" }],
    draw(g, s, c, B) {
      const P = B.P, d = nums(c.data); if (d.length < 2) return; const S = stats(d), lo = Math.min(...d) - 3, hi = Math.max(...d) + 3, m = B.axes({ xmin: lo, xmax: hi, ymin: 0, ymax: d.length + 1, xstep: Math.max(1, Math.round((hi - lo) / 10)), ystep: 1, xl: "value", yl: "#" });
      g.save(); g.fillStyle = P.fillA; g.fillRect(m.X(S.mean - S.sd), m.r.y, m.X(S.mean + S.sd) - m.X(S.mean - S.sd), m.r.h); g.restore();
      d.forEach((v, i) => { const y = m.Y(i + 1); B.line(m.X(S.mean), y, m.X(v), y, v >= S.mean ? P.green : P.red, 2); B.dot(m.X(v), y, P.blue, 5); });
      B.line(m.X(S.mean), m.r.y, m.X(S.mean), m.Y(0), P.ink, 2); B.text("x̄ = " + f(S.mean, 3), m.X(S.mean) + 4, m.r.y + 40, { w: 800, size: 11 }); B.text("x̄ ± 1 s.d.", m.X(S.mean + S.sd) + 4, m.r.y + 56, { size: 10.5, color: P.amber, w: 700 });
      // box plot strip
      const by = m.Y(0) - 14; B.line(m.X(S.s[0]), by, m.X(S.s[S.n - 1]), by, P.purple, 1.4); B.poly([[m.X(S.q1), by - 6], [m.X(S.q3), by - 6], [m.X(S.q3), by + 6], [m.X(S.q1), by + 6]], P.purple, P.fillP, 1.6); B.line(m.X(S.median), by - 6, m.X(S.median), by + 6, P.purple, 2.4);
    },
    hud(s, c) { const d = nums(c.data); if (d.length < 2) return [{ title: "Dispersion", lines: ["enter at least two values"] }]; const S = stats(d); return [{ title: "Dispersion", lines: [`range = ${S.s[S.n - 1]} − ${S.s[0]} = ${f(S.range, 2)}`, `IQR = ${f(S.q3, 2)} − ${f(S.q1, 2)} = ${f(S.q3 - S.q1, 2)}; SIQR = ${f((S.q3 - S.q1) / 2, 2)}`, `mean deviation = Σ|x − x̄|/n = ${f(S.md, 3)}`, `variance σ² = Σ(x − x̄)²/n = ${f(S.vr, 3)}`, [`s.d. σ = √variance = ${f(S.sd, 3)}`, null, true]] }]; },
    readouts(s, c) { const d = nums(c.data); if (d.length < 2) return []; const S = stats(d); return [["Range", f(S.range, 2)], ["Mean deviation", f(S.md, 3)], ["Variance", f(S.vr, 3)], ["Standard deviation", f(S.sd, 3)]]; },
    table(s, c) { const d = nums(c.data); if (d.length < 2) return ""; const S = stats(d); return T(["x", "x − x̄", "|x − x̄|", "(x − x̄)²"], d.map((v) => [v, f(v - S.mean, 3), f(Math.abs(v - S.mean), 3), f((v - S.mean) ** 2, 3)]).concat([["Σ = " + d.reduce((a, b) => a + b, 0), "0", f(S.md * S.n, 3), f(S.vr * S.n, 3)]])); },
    steps(s, c) { const d = nums(c.data), S = stats(d); return [`Mean x̄ = ${f(S.mean, 4)}`, "Find each deviation x − x̄ (they add to 0).", `Mean deviation = Σ|x − x̄| ÷ n = ${f(S.md * S.n, 3)} ÷ ${S.n} = ${f(S.md, 3)}`, `Variance = Σ(x − x̄)² ÷ n = ${f(S.vr * S.n, 3)} ÷ ${S.n} = ${f(S.vr, 3)}`, `Standard deviation = √${f(S.vr, 3)} = ${f(S.sd, 3)}`]; },
    note: "Range, semi-interquartile/interquartile range, variance, mean deviation and standard deviation. Mean deviation is the mean of the absolute deviations; variance is the square of the standard deviation.",
    mistake: "Forgetting the square root at the end — variance and standard deviation are different.",
  });

  /* ---------------- H-B(i) Experimental & theoretical probability ---------------- */
  const EXP = { coin: { n: 2, lab: ["H", "T"], name: "Toss a fair coin" }, die: { n: 6, lab: ["1", "2", "3", "4", "5", "6"], name: "Roll a fair die" }, spin: { n: 4, lab: ["Red", "Blue", "Green", "Yellow"], name: "Spin a 4-colour spinner" }, bag: { n: 5, lab: ["R", "R", "B", "B", "G"], name: "Draw from a bag (2R, 2B, 1G)" } };
  MK.def("H-B(i)", {
    title: "Experimental vs theoretical probability", env: "graph",
    values: { exp: "die", ev: 0 },
    controls: [{ type: "select", key: "exp", label: "Experiment", options: Object.keys(EXP).map((k) => [k, EXP[k].name]) }, { key: "ev", label: "Event: outcome number", min: 0, max: 5 }],
    actions: [{ label: "+1 trial", run: (s, c) => MK.scenes["H-B(i)"].run(s, c, 1) }, { label: "+10", run: (s, c) => MK.scenes["H-B(i)"].run(s, c, 10) }, { label: "+100", run: (s, c) => MK.scenes["H-B(i)"].run(s, c, 100) }, { label: "+1000", run: (s, c) => MK.scenes["H-B(i)"].run(s, c, 1000) }],
    state: () => ({ n: 0, hits: 0, hist: [] }), onChange(s, c, k) { if (k === "exp" || k === "ev") { s.n = 0; s.hits = 0; s.hist = []; } },
    target(c) { const E = EXP[c.exp], lab = E.lab[Math.min(c.ev, E.n - 1)]; return { lab, p: E.lab.filter((l) => l === lab).length / E.n }; },
    run(s, c, k) { const E = EXP[c.exp], t = this.target(c); for (let i = 0; i < k; i++) { const o = E.lab[Math.floor(Math.random() * E.n)]; s.n++; if (o === t.lab) s.hits++; if (s.n <= 50 || s.n % Math.ceil(s.n / 300) === 0) s.hist.push([s.n, s.hits / s.n]); } s.last = k; },
    draw(g, s, c, B) { const P = B.P, t = this.target(c), N = Math.max(10, s.n), m = B.axes({ xmin: 0, xmax: N, ymin: 0, ymax: Math.min(1, Math.max(0.5, t.p * 2.2)), xl: "trials", yl: "rel. freq" });
      B.plot(m, () => t.p, P.red, 2, { dash: [6, 4] }); B.text("theoretical " + MK.toFr(t.p).str(), m.r.x + m.r.w - 4, m.Y(t.p) - 6, { align: "right", size: 11, color: P.red, w: 700 });
      if (s.hist.length > 1) B.poly(s.hist.map(([n, r]) => [m.X(n), m.Y(r)]), P.blue, null, 2.2, false); if (s.n) B.dot(m.X(s.n), m.Y(s.hits / s.n), P.blue, 5, f(s.hits / s.n, 3));
      B.pill(`event: "${t.lab}"   trials ${s.n}   successes ${s.hits}`, m.r.x + m.r.w - 4, m.r.y + 40, P.panelInk, 11, "right"); },
    hud(s, c) { const t = this.target(c); return [{ title: "Probability", lines: ["P(E) = favourable / possible outcomes", `= ${MK.toFr(t.p).str()} = ${f(t.p, 4)}`, "—", "relative frequency = successes / trials", s.n ? `= ${s.hits}/${s.n} = ${f(s.hits / s.n, 4)}` : "run some trials"] }]; },
    readouts(s, c) { const t = this.target(c); return [["Trials", s.n], ["Successes", s.hits], ["Experimental", s.n ? f(s.hits / s.n, 4) : "—"], ["Theoretical", f(t.p, 4)]]; },
    steps(s, c) { const t = this.target(c), E = EXP[c.exp]; return [`List the equally likely outcomes: ${E.lab.join(", ")}`, `Favourable outcomes for "${t.lab}": ${E.lab.filter((l) => l === t.lab).length}`, `P = ${E.lab.filter((l) => l === t.lab).length}/${E.n} = ${MK.toFr(t.p).str()}`, "Run more trials — the relative frequency gets closer to P (law of large numbers)."]; },
    note: "Probability of equally likely events, e.g. a six with a fair die or a head with a fair coin. The 3D lab below rolls real dice.", mistake: "Thinking a coin is “due” a head after several tails — each toss is independent.",
  });

  /* ---------------- H-B(ii) Addition of probabilities ---------------- */
  const EVENTS = { even: ["first die even", (a, b) => a % 2 === 0], six: ["a six on the first die", (a) => a === 6], sum7: ["sum is 7", (a, b) => a + b === 7], sum8: ["sum is 8", (a, b) => a + b === 8], dbl: ["a double", (a, b) => a === b], b4: ["second die > 4", (a, b) => b > 4], sumgt9: ["sum > 9", (a, b) => a + b > 9] };
  MK.def("H-B(ii)", {
    title: "Addition rule (two dice sample space)", env: "paper",
    values: { A: "sum7", Bev: "dbl" },
    controls: [{ type: "select", key: "A", label: "Event A", options: Object.keys(EVENTS).map((k) => [k, EVENTS[k][0]]) }, { type: "select", key: "Bev", label: "Event B", options: Object.keys(EVENTS).map((k) => [k, EVENTS[k][0]]) }],
    count(c) { let nA = 0, nB = 0, nAB = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) { const x = EVENTS[c.A][1](a, b), y = EVENTS[c.Bev][1](a, b); nA += x; nB += y; nAB += x && y; } return { nA, nB, nAB, nU: nA + nB - nAB }; },
    draw(g, s, c, B) { const P = B.P, a = B.area, cs = Math.min((a.w - 40) / 6, (a.h - 70) / 6), x0 = a.x + 30, y0 = a.y + 50;
      B.text("first die →", x0 + 6 * cs, y0 - 24, { size: 10.5, color: P.soft, align: "right" }); B.text("second ↓", x0 - 8, y0 - 24, { size: 10.5, color: P.soft, align: "right" }); for (let i = 1; i <= 6; i++) { B.text(String(i), x0 + (i - 0.5) * cs, y0 - 24 + 10, { align: "center", w: 800, size: 11 }); B.text(String(i), x0 - 12, y0 + (i - 0.5) * cs + 4, { align: "center", w: 800, size: 11 }); }
      for (let a1 = 1; a1 <= 6; a1++) for (let b1 = 1; b1 <= 6; b1++) { const x = x0 + (a1 - 1) * cs, y = y0 + (b1 - 1) * cs, A = EVENTS[c.A][1](a1, b1), Bb = EVENTS[c.Bev][1](a1, b1); g.save(); g.fillStyle = A && Bb ? P.fillP : A ? P.fillR : Bb ? P.fillB : "transparent"; g.fillRect(x + 1, y + 1, cs - 2, cs - 2); g.restore(); g.save(); g.strokeStyle = P.faint; g.strokeRect(x, y, cs, cs); g.restore(); B.text(`${a1},${b1}`, x + cs / 2, y + cs / 2 + 4, { align: "center", size: cs > 40 ? 10.5 : 8.5, color: A || Bb ? P.ink : P.faint, halo: false }); }
      B.legend([["A", P.red], ["B", P.blue], ["A and B", P.purple]], x0, a.y + a.h - 6); },
    hud(s, c) { const k = this.count(c), ex = k.nAB === 0; return [{ title: "Addition rule", lines: [`P(A) = ${k.nA}/36, P(B) = ${k.nB}/36`, `P(A and B) = ${k.nAB}/36`, ex ? "A and B are mutually exclusive" : "not mutually exclusive", ex ? "P(A or B) = P(A) + P(B)" : "P(A or B) = P(A) + P(B) − P(A and B)", [`P(A or B) = ${k.nU}/36 = ${MK.toFr(k.nU / 36).str()}`, null, true]] }, { title: "Independence", lines: [Math.abs(k.nAB / 36 - (k.nA / 36) * (k.nB / 36)) < 1e-9 ? "P(A∩B) = P(A)P(B): independent" : "P(A∩B) ≠ P(A)P(B): dependent"] }]; },
    readouts(s, c) { const k = this.count(c); return [["P(A)", MK.toFr(k.nA / 36).str()], ["P(B)", MK.toFr(k.nB / 36).str()], ["P(A and B)", MK.toFr(k.nAB / 36).str()], ["P(A or B)", MK.toFr(k.nU / 36).str()]]; },
    steps(s, c) { const k = this.count(c); return ["List the 36 equally likely outcomes in a grid.", `Count A: ${k.nA}; count B: ${k.nB}; count both: ${k.nAB}.`, k.nAB ? "Outcomes in both are counted twice, so subtract them once." : "No outcome is in both — the events are mutually exclusive.", `P(A or B) = (${k.nA} + ${k.nB} − ${k.nAB})/36 = ${MK.toFr(k.nU / 36).str()}`]; },
    note: "Addition of probabilities for mutually exclusive and independent events (with replacement).", mistake: "Adding P(A) + P(B) when the events overlap — that double-counts the overlap.",
  });

  /* ---------------- H-B(iii) Multiplication rule & tree diagrams ---------------- */
  MK.def("H-B(iii)", {
    title: "Multiplication rule & tree diagrams", env: "paper",
    values: { r: 5, b: 3, repl: 0, ev: "both" },
    controls: [{ key: "r", label: "Red balls", min: 1, max: 10 }, { key: "b", label: "Blue balls", min: 1, max: 10 }, { type: "tabs", key: "repl", label: "Second draw", options: [[0, "Without replacement"], [1, "With replacement"]] }, { type: "select", key: "ev", label: "Event", options: [["both", "both red"], ["bb", "both blue"], ["one", "one of each colour"], ["atleast", "at least one red"]] }],
    paths(c) { const n = c.r + c.b, p1R = c.r / n, p1B = c.b / n, n2 = c.repl ? n : n - 1; return [{ k: "RR", p: [p1R, (c.repl ? c.r : c.r - 1) / n2] }, { k: "RB", p: [p1R, c.b / n2] }, { k: "BR", p: [p1B, c.r / n2] }, { k: "BB", p: [p1B, (c.repl ? c.b : c.b - 1) / n2] }].map((q) => Object.assign(q, { P: q.p[0] * q.p[1] })); },
    inEv(c, k) { return { both: k === "RR", bb: k === "BB", one: k === "RB" || k === "BR", atleast: k !== "BB" }[c.ev]; },
    draw(g, s, c, B) { const P = B.P, a = B.area, ps = this.paths(c), n = c.r + c.b, n2 = c.repl ? n : n - 1, Fr = (num, den) => MK.toFr(num / den).str(), x0 = a.x + 20, x1 = a.x + a.w * 0.27, x2 = a.x + a.w * 0.5, ym = a.y + a.h / 2 + 10, yR = a.y + a.h * 0.3, yB = a.y + a.h * 0.78;
      // bag
      g.save(); g.fillStyle = MK.isNight() ? "#3b2f22" : "#c8a27a"; g.beginPath(); g.ellipse(x0 + 10, ym, 16, 26, 0, 0, TAU); g.fill(); g.restore(); B.text(`${c.r}R ${c.b}B`, x0 + 10, ym + 44, { align: "center", size: 10, w: 700 });
      const br = (xa, ya, xb, yb, lab, on) => { B.line(xa, ya, xb, yb, on ? P.amber : P.ink, on ? 3 : 1.6); B.text(lab, (xa + xb) / 2, (ya + yb) / 2 - 6, { align: "center", size: 11, w: 700, color: P.soft }); };
      const leaf = { RR: [x2, yR - 40], RB: [x2, yR + 30], BR: [x2, yB - 30], BB: [x2, yB + 40] };
      const onR = ps.filter((q) => q.k[0] === "R").some((q) => this.inEv(c, q.k)), onB = ps.filter((q) => q.k[0] === "B").some((q) => this.inEv(c, q.k));
      br(x0 + 28, ym, x1, yR, Fr(c.r, n), onR); br(x0 + 28, ym, x1, yB, Fr(c.b, n), onB); B.dot(x1, yR, P.red, 9); B.dot(x1, yB, P.blue, 9);
      ps.forEach((q) => { const [lx, ly] = leaf[q.k], from = q.k[0] === "R" ? [x1, yR] : [x1, yB], on = this.inEv(c, q.k); br(from[0] + 10, from[1], lx, ly, MK.toFr(q.p[1]).str(), on); B.dot(lx, ly, q.k[1] === "R" ? P.red : P.blue, 8); B.text(`${q.k}: ${MK.toFr(q.p[0]).str()} × ${MK.toFr(q.p[1]).str()} = ${MK.toFr(q.P).str()}`, lx + 12, ly + 4, { size: 10.5, w: on ? 800 : 500, color: on ? P.amber : P.ink }); });
      B.text("1st draw", x1, a.y + 40, { align: "center", size: 10.5, color: P.soft }); B.text("2nd draw", x2, a.y + 40, { align: "center", size: 10.5, color: P.soft }); },
    hud(s, c) { const ps = this.paths(c), Pev = ps.filter((q) => this.inEv(c, q.k)).reduce((a, q) => a + q.P, 0); return [{ title: "Multiplication rule", lines: ["along a branch: multiply", "between branches (“or”): add", c.repl ? "with replacement: independent draws" : "without replacement: 2nd draw has one fewer ball", "—", [`P(${({ both: "both red", bb: "both blue", one: "one of each", atleast: "at least one red" })[c.ev]}) = ${MK.toFr(Pev).str()}`, null, true], `≈ ${f(Pev, 4)}`] }]; },
    readouts(s, c) { const ps = this.paths(c); return ps.map((q) => ["P(" + q.k + ")", MK.toFr(q.P).str()]); },
    steps(s, c) { const ps = this.paths(c), on = ps.filter((q) => this.inEv(c, q.k)); return ["Draw the tree: first draw, then second draw on each branch.", c.repl ? "Probabilities on the second set of branches are the same as the first." : "On the second draw there is one ball fewer, and one fewer of the colour already taken.", ...on.map((q) => `P(${q.k}) = ${MK.toFr(q.p[0]).str()} × ${MK.toFr(q.p[1]).str()} = ${MK.toFr(q.P).str()}`), on.length > 1 ? `Add the paths (“or”): ${MK.toFr(on.reduce((a, q) => a + q.P, 0)).str()}` : ""].filter(Boolean); },
    note: "Multiplication of probabilities for independent events; without replacement; interpretation of “and” (multiply) and “or” (add).", mistake: "Keeping the same denominator on the second draw when the ball is not replaced.",
  });

  /* ---------------- I-a Vectors in a plane ---------------- */
  MK.def("I-a", {
    title: "Vectors in a plane", env: "paper", hint: "Drag the arrow heads", syncAll: true,
    values: { ux: 4, uy: 2, vx: 1, vy: 4, op: "add", k: 2 },
    controls: [{ type: "tabs", key: "op", label: "Operation", options: [["add", "u + v (triangle / parallelogram)"], ["sub", "u − v"], ["scal", "k u"]] }, { key: "k", label: "Scalar k", min: -3, max: 3, step: 0.5, show: W("op", "scal") }],
    draw(g, s, c, B) {
      const P = B.P, m = B.axes({ xmin: -10, xmax: 10, ymin: -10, ymax: 10, xstep: 1, ystep: 1 }); s.m = m; const O = [m.X(0), m.Y(0)], U = [m.X(c.ux), m.Y(c.uy)], V = [m.X(c.vx), m.Y(c.vy)];
      if (c.op === "add") { const S2 = [m.X(c.ux + c.vx), m.Y(c.uy + c.vy)]; B.poly([O, U, S2, V], null, P.fillA); B.line(...U, ...S2, P.green, 1.6, [6, 4]); B.line(...V, ...S2, P.red, 1.6, [6, 4]); B.arrow(...O, ...S2, P.amber, 3.2, 12); B.text(`u + v = (${c.ux + c.vx}, ${c.uy + c.vy})`, S2[0] + (S2[0] > m.r.x + m.r.w - 130 ? -8 : 8), S2[1] - 8, { w: 800, color: P.amber, align: S2[0] > m.r.x + m.r.w - 130 ? "right" : "left" }); }
      if (c.op === "sub") { const D2 = [m.X(c.ux - c.vx), m.Y(c.uy - c.vy)], NV = [m.X(-c.vx), m.Y(-c.vy)]; B.arrow(...O, ...NV, P.green, 1.8, 9); B.arrow(...U, m.X(c.ux - c.vx), m.Y(c.uy - c.vy), P.green, 1.6, 9); B.arrow(...V, ...U, P.purple, 2.4, 10); B.arrow(...O, ...D2, P.amber, 3, 12); B.text(`u − v = (${c.ux - c.vx}, ${c.uy - c.vy})`, D2[0] + 8, D2[1] - 6, { w: 800, color: P.amber }); B.text("−v", NV[0] + 6, NV[1], { color: P.green, w: 700 }); }
      if (c.op === "scal") { const K = [m.X(c.k * c.ux), m.Y(c.k * c.uy)]; B.arrow(...O, ...K, P.amber, 3, 12); B.text(`${c.k}u = (${f(c.k * c.ux)}, ${f(c.k * c.uy)})`, K[0] + 8, K[1] - 6, { w: 800, color: P.amber }); }
      B.arrow(...O, ...U, P.red, 2.8, 11); B.text("u", U[0] + 8, U[1] + 4, { w: 800, color: P.red, size: 14, fam: "serif" }); if (c.op !== "scal") { B.arrow(...O, ...V, P.green, 2.8, 11); B.text("v", V[0] + 8, V[1] + 4, { w: 800, color: P.green, size: 14, fam: "serif" }); }
    },
    pointer: MK.dragger((s, c) => (s.m ? [[s.m.X(c.ux), s.m.Y(c.uy)], [s.m.X(c.vx), s.m.Y(c.vy)]] : []), (i, p, s, c) => { c[i ? "vx" : "ux"] = MK.clamp(Math.round(s.m.ix(p.x)), -9, 9); c[i ? "vy" : "uy"] = MK.clamp(Math.round(s.m.iy(p.y)), -9, 9); }),
    hud(s, c) { const mag = (x, y) => f(Math.hypot(x, y), 3), dir = (x, y) => f((D(Math.atan2(y, x)) + 360) % 360, 1) + "°", par = c.ux * c.vy - c.uy * c.vx === 0; const r = c.op === "add" ? [c.ux + c.vx, c.uy + c.vy] : c.op === "sub" ? [c.ux - c.vx, c.uy - c.vy] : [c.k * c.ux, c.k * c.uy];
      return [{ title: "Column vectors", lines: [`u = (${c.ux}, ${c.uy})ᵀ, |u| = √(${c.ux}² + ${c.uy}²) = ${mag(c.ux, c.uy)}`, `v = (${c.vx}, ${c.vy})ᵀ, |v| = ${mag(c.vx, c.vy)}`, [`result = (${f(r[0])}, ${f(r[1])})ᵀ, |r| = ${mag(r[0], r[1])}`, null, false], `direction of result: ${dir(r[0], r[1])} from +x`, "—", par ? "u ∥ v (parallel: one is a multiple of the other)" : "u and v are not parallel", c.ux === c.vx && c.uy === c.vy ? "u = v (equal vectors)" : ""] }]; },
    readouts(s, c) { return [["|u|", f(Math.hypot(c.ux, c.uy), 3)], ["|v|", f(Math.hypot(c.vx, c.vy), 3)], ["u + v", `(${c.ux + c.vx}, ${c.uy + c.vy})`], ["u − v", `(${c.ux - c.vx}, ${c.uy - c.vy})`]]; },
    steps(s, c) { return ["Write each vector as a column (x-component over y-component).", "Add or subtract the corresponding components.", "Magnitude |r| = √(x² + y²) (Pythagoras).", "Triangle law: put v at the head of u; parallelogram law: complete the parallelogram on u and v."]; },
    note: "Vectors as directed line segments; Cartesian components; magnitude; equal, zero and parallel vectors; addition and subtraction; multiplication by a scalar. Graphical representation is necessary.",
    mistake: "Adding magnitudes: |u + v| is not |u| + |v| unless the vectors point the same way.",
  });

  /* ---------------- I-b Transformation in the Cartesian plane ---------------- */
  const TR = { rx: "Reflection in the x-axis", ry: "Reflection in the y-axis", ryx: "Reflection in y = x", rynx: "Reflection in y = −x", rxk: "Reflection in x = k", ryk: "Reflection in y = k", rot: "Rotation about a point", tr: "Translation by a vector", en: "Enlargement about a centre" };
  MK.def("I-b", {
    title: "Transformations", env: "paper", syncAll: true,
    values: { t: "rot", k: 2, ang: 90, cx: 1, cy: 0, tx: 3, ty: -4, sf: 2, anim: 1, quiz: 0 },
    controls: [{ type: "select", key: "t", label: "Transformation", options: Object.keys(TR).map((k) => [k, TR[k]]) }, { key: "k", label: "k (line x = k / y = k)", min: -5, max: 5, show: W("t", "rxk", "ryk") }, { key: "ang", label: "Angle (+ anticlockwise)", min: -180, max: 180, step: 15, unit: "°", show: W("t", "rot") }, { key: "cx", label: "Centre x", min: -6, max: 6, show: W("t", "rot", "en") }, { key: "cy", label: "Centre y", min: -6, max: 6, show: W("t", "rot", "en") }, { key: "tx", label: "Translation x", min: -8, max: 8, show: W("t", "tr") }, { key: "ty", label: "Translation y", min: -8, max: 8, show: W("t", "tr") }, { key: "sf", label: "Scale factor", min: -3, max: 3, step: 0.5, show: W("t", "en") }],
    state: () => ({ p: 0 }), onChange(s) { s.p = 0; },
    tick(dt, s) { s.p = Math.min(1, s.p + dt * 0.7); return true; },
    shape: [[1, 1], [4, 1], [1, 3]],
    map(c, p, u = 1) { const [x, y] = p; switch (c.t) { case "rx": return [x, y - 2 * y * u]; case "ry": return [x - 2 * x * u, y]; case "ryx": return [x + (y - x) * u, y + (x - y) * u]; case "rynx": return [x + (-y - x) * u, y + (-x - y) * u]; case "rxk": return [x + (2 * c.k - 2 * x) * u, y]; case "ryk": return [x, y + (2 * c.k - 2 * y) * u];
      case "rot": { const a = R(c.ang * u), dx = x - c.cx, dy = y - c.cy; return [c.cx + dx * Math.cos(a) - dy * Math.sin(a), c.cy + dx * Math.sin(a) + dy * Math.cos(a)]; } case "tr": return [x + c.tx * u, y + c.ty * u]; default: { const k = 1 + (c.sf - 1) * u; return [c.cx + (x - c.cx) * k, c.cy + (y - c.cy) * k]; } } },
    draw(g, s, c, B) {
      const P = B.P, m = B.axes({ xmin: -10, xmax: 10, ymin: -10, ymax: 10, xstep: 1, ystep: 1 }), M = (p) => [m.X(p[0]), m.Y(p[1])], sh = this.shape, img = sh.map((p) => this.map(c, p)), mid = sh.map((p) => this.map(c, p, s.p));
      const mirror = { rx: [[-10, 0], [10, 0]], ry: [[0, -10], [0, 10]], ryx: [[-10, -10], [10, 10]], rynx: [[-10, 10], [10, -10]], rxk: [[c.k, -10], [c.k, 10]], ryk: [[-10, c.k], [10, c.k]] }[c.t]; if (mirror) B.line(...M(mirror[0]), ...M(mirror[1]), P.purple, 2.2, [8, 5]);
      if (c.t === "rot" || c.t === "en") B.dot(...M([c.cx, c.cy]), P.purple, 5, "centre", { size: 10.5 });
      if (c.t === "en") sh.forEach((p, i) => B.line(...M([c.cx, c.cy]), ...M(img[i]), P.faint, 1, [3, 3])); if (c.t === "tr") B.arrow(...M(sh[0]), ...M(img[0]), P.purple, 2, 9);
      B.poly(sh.map(M), P.blue, P.fillB, 2.4); B.poly(img.map(M), P.red, null, 1.4, true, [5, 4]); B.poly(mid.map(M), P.red, P.fillR, 2.4);
      ["A", "B", "C"].forEach((L, i) => { B.text(L, ...M(sh[i]).map((v, j) => v + (j ? -6 : 6)), { size: 11, w: 800, color: P.blue }); B.text(L + "′", ...M(img[i]).map((v, j) => v + (j ? -6 : 6)), { size: 11, w: 800, color: P.red }); });
    },
    hud(s, c) { const img = this.shape.map((p) => this.map(c, p)); const desc = { rx: "(x, y) → (x, −y)", ry: "(x, y) → (−x, y)", ryx: "(x, y) → (y, x)", rynx: "(x, y) → (−y, −x)", rxk: `(x, y) → (${2 * c.k} − x, y)`, ryk: `(x, y) → (x, ${2 * c.k} − y)`, rot: `rotate ${c.ang}° about (${c.cx}, ${c.cy})`, tr: `(x, y) → (x + ${c.tx}, y + ${c.ty})`, en: `scale factor ${c.sf}, centre (${c.cx}, ${c.cy})` }[c.t];
      return [{ title: TR[c.t], lines: [desc, "—", ...img.map((p, i) => `${"ABC"[i]}(${this.shape[i].join(", ")}) → ${"ABC"[i]}′(${f(p[0], 2)}, ${f(p[1], 2)})`), c.t === "en" ? `area × ${f(c.sf * c.sf, 2)}` : "shape and size unchanged (congruent)"] }]; },
    readouts(s, c) { const img = this.shape.map((p) => this.map(c, p)); return img.map((p, i) => ["ABC"[i] + "′", `(${f(p[0], 2)}, ${f(p[1], 2)})`]); },
    steps(s, c) { const img = this.shape.map((p) => this.map(c, p)); const how = { rot: [`Use tracing paper or the rule for ${c.ang}° about (${c.cx}, ${c.cy}).`, "Each point stays the same distance from the centre."], en: [`Draw rays from the centre through each vertex.`, `Multiply each distance from the centre by ${c.sf}${c.sf < 0 ? " (negative: go through the centre to the other side)" : ""}.`], tr: [`Move every point ${c.tx} across and ${c.ty} up.`] }[c.t] || ["Each image point is the same perpendicular distance from the mirror line, on the other side."];
      return [...how, ...img.map((p, i) => `${"ABC"[i]}′ = (${f(p[0], 2)}, ${f(p[1], 2)})`)]; },
    note: "Reflection (in the axes, x = k, y = x, y = kx), rotation about the origin and other points (−180° to 180°), translation by a vector, and enlargement with a given centre and scale factor. Determine mirror lines and angles of rotation.",
    mistake: "Rotating about the origin when the question gives a different centre of rotation.",
  });
})();
