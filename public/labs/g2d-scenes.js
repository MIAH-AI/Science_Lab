/* g2d-scenes.js — Statistical maps and diagrams (SD a–f) drawn on an interactive board with real
   Natural Earth country boundaries and population estimates for West Africa. */
(function () {
  "use strict";
  const MK = window.MK, GK = window.GK, BK = window.BK, f = MK.fmt;
  const BB = [-18.2, 3.8, 16.2, 22.5];
  const DATA = { d: null };
  const load = () => (DATA.p = DATA.p || GK.json("maps/africa_countries_50m.geojson").then((d) => { if (d) { d = { features: d.features.filter((ft) => { const c = GK.centroid(ft.geometry); return c && c[0] > -18 && c[0] < 19 && c[1] > 2 && c[1] < 22; }) }; d.features.forEach((ft) => { ft.c = GK.centroid(ft.geometry); ft.area = areaKm2(ft.geometry); }); } DATA.d = d; return d; }));
  try { load(); } catch (e) { /* loads on first draw */ }
  function areaKm2(geom) { let A = 0; GK.rings(geom).forEach((r) => { let a = 0; for (let i = 0; i < r.length - 1; i++) { const [x1, y1] = r[i], [x2, y2] = r[i + 1]; a += (x2 - x1) * (2 + Math.sin(y1 * Math.PI / 180) + Math.sin(y2 * Math.PI / 180)); } A += a; }); return Math.abs(A * 6371 * 6371 * (Math.PI / 180) / 2); }
  const inPoly = (x, y, ring) => { let ins = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins; } return ins; };
  const inGeom = (x, y, geom) => { const g = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates; return g.some((poly) => inPoly(x, y, poly[0]) && !poly.slice(1).some((h) => inPoly(x, y, h))); };
  function frame(B) { const W = B.wide ? 386 : B.W - 10, x0 = 10, y0 = 36, w = W - 20, h = Math.min(B.H - 56, w * (BB[3] - BB[1]) / (BB[2] - BB[0]) * 1.05); return { x0, y0, w, h, X: (lo) => x0 + (lo - BB[0]) / (BB[2] - BB[0]) * w, Y: (la) => y0 + (BB[3] - la) / (BB[3] - BB[1]) * h }; }
  function drawCountries(g, F, fill, stroke = "#333") { if (!DATA.d) return false; g.save(); g.beginPath(); g.rect(F.x0, F.y0, F.w, F.h); g.clip(); DATA.d.features.forEach((ft) => { g.beginPath(); GK.rings(ft.geometry).forEach((r) => r.forEach(([lo, la], i) => (i ? g.lineTo(F.X(lo), F.Y(la)) : g.moveTo(F.X(lo), F.Y(la))))); g.fillStyle = fill ? fill(ft) : "#f3efe2"; g.fill(); g.strokeStyle = stroke; g.lineWidth = 0.8; g.stroke(); }); g.restore(); g.strokeStyle = "#111"; g.strokeRect(F.x0, F.y0, F.w, F.h); return true; }
  const bg = (g, B) => { g.fillStyle = "#cfe3f2"; g.fillRect(0, 0, B.W, B.H); };
  const waiting = (g, B) => B.text("Loading map data…", 20, 60, { size: 12, color: "#333" });
  const tick = (dt, s) => (DATA.d ? false : true);
  const POP = (ft) => ft.properties.POP_EST || 0;
  const SHORT = { "Central African Rep.": "C.A.R.", "Côte d'Ivoire": "Côte d'Iv.", "Guinea-Bissau": "G.-Bissau", "Eq. Guinea": "Eq. Guinea" };

  /* ===================== SD-a  Bar graphs and line graphs ===================== */
  const CENSUS = [[1952, 30.4], [1963, 55.7], [1991, 88.9], [2006, 140.4]];
  const POPS = [["Nigeria", 224], ["Ghana", 34], ["Côte d'Ivoire", 29], ["Senegal", 18], ["Sierra Leone", 8.9], ["Liberia", 5.4], ["Gambia", 2.8]];
  const LANDUSE = [["Nigeria", [38, 9, 24, 29]], ["Ghana", [31, 35, 15, 19]], ["Senegal", [17, 42, 25, 16]]];
  const EXPORTS = [["Crude oil", 76, "#2a2a2a"], ["Natural gas", 11, "#4aa8ff"], ["Cocoa and farm produce", 4, "#8a5a2a"], ["Manufactures and others", 9, "#9fe8b0"]];
  MK.def("SD-a", {
    kind: "2d", label: "Interactive graph board", title: "Bar graphs, line graphs and pie charts",
    blurb: "Four ways to show statistics. Switch between them and read the method for drawing each one.",
    values: { t: "bar" },
    controls: [{ type: "tabs", key: "t", label: "Diagram", options: [["bar", "Simple bar"], ["div", "Divided (compound) bar"], ["line", "Line graph"], ["pie", "Pie chart"]] }],
    draw(g, s, c, B) {
      const W = B.wide ? 386 : B.W - 10; g.fillStyle = "#fbfaf6"; g.fillRect(0, 0, B.W, B.H); const x0 = 46, y0 = 40, w = W - 66, h = B.H - 100; g.strokeStyle = "#333"; g.lineWidth = 1;
      const axes = (ymax, step, lab) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0, y0 + h); g.lineTo(x0 + w, y0 + h); g.stroke(); g.fillStyle = "#333"; g.font = "9px 'IBM Plex Sans',sans-serif"; for (let v = 0; v <= ymax; v += step) { const y = y0 + h - v / ymax * h; g.fillText(String(v), x0 - 26, y + 3); g.strokeStyle = "rgba(0,0,0,.08)"; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w, y); g.stroke(); } g.save(); g.translate(12, y0 + h / 2); g.rotate(-Math.PI / 2); g.fillText(lab, -40, 0); g.restore(); };
      if (c.t === "bar") { axes(240, 40, "Population (millions)"); const bw = w / POPS.length; POPS.forEach(([n, v], i) => { const bh = v / 240 * h; g.fillStyle = "#3a7ac0"; g.fillRect(x0 + i * bw + 6, y0 + h - bh, bw - 12, bh); g.fillStyle = "#222"; g.font = "8.5px 'IBM Plex Sans',sans-serif"; g.fillText(n.length > 9 ? n.slice(0, 8) + "." : n, x0 + i * bw + 4, y0 + h + 12); g.fillText(String(v), x0 + i * bw + 8, y0 + h - bh - 3); }); B.text("Population of selected West African countries (approx., 2024 estimates)", x0, y0 + h + 28, { size: 10, w: 700, color: "#222" }); }
      if (c.t === "div") { axes(100, 20, "Percentage of land"); const cols = ["#f2c94c", "#1f7a3a", "#b0a060", "#9a9a9a"], bw = w / LANDUSE.length; LANDUSE.forEach(([n, parts], i) => { let y = y0 + h; parts.forEach((p, k) => { const bh = p / 100 * h; g.fillStyle = cols[k]; g.fillRect(x0 + i * bw + 20, y - bh, bw - 40, bh); g.fillStyle = "#222"; g.font = "8.5px 'IBM Plex Sans',sans-serif"; g.fillText(p + "%", x0 + i * bw + bw / 2 - 8, y - bh / 2 + 3); y -= bh; }); g.fillText(n, x0 + i * bw + bw / 2 - 16, y0 + h + 12); }); ["Arable", "Forest", "Pasture", "Other"].forEach((n, k) => { g.fillStyle = cols[k]; g.fillRect(x0 + k * 80, B.H - 24, 10, 10); g.fillStyle = "#222"; g.fillText(n, x0 + 14 + k * 80, B.H - 15); }); B.text("Land use (%) — illustrative figures", x0 + 200, B.H - 15, { size: 10, w: 700, color: "#222" }); }
      if (c.t === "line") { axes(160, 20, "Population (millions)"); const X = (y) => x0 + (y - 1950) / 60 * w; g.strokeStyle = "#d0021b"; g.lineWidth = 2; g.beginPath(); CENSUS.forEach(([y, v], i) => { const py = y0 + h - v / 160 * h; i ? g.lineTo(X(y), py) : g.moveTo(X(y), py); }); g.stroke(); CENSUS.forEach(([y, v]) => { const py = y0 + h - v / 160 * h; g.fillStyle = "#d0021b"; g.beginPath(); g.arc(X(y), py, 3.5, 0, 6.3); g.fill(); g.fillStyle = "#222"; g.font = "9px 'IBM Plex Sans',sans-serif"; g.fillText(y + ": " + v, X(y) - 22, py - 7); g.fillText(String(y), X(y) - 10, y0 + h + 12); }); B.text("Nigeria's census population, 1952–2006", x0, y0 + h + 28, { size: 10, w: 700, color: "#222" }); }
      if (c.t === "pie") { const cx = x0 + 90, cy = y0 + h / 2, r = Math.min(90, h / 2); let a = -Math.PI / 2; EXPORTS.forEach(([n, p, col]) => { const da = p / 100 * Math.PI * 2; g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r, a, a + da); g.fill(); g.strokeStyle = "#fff"; g.stroke(); a += da; }); EXPORTS.forEach(([n, p, col], i) => { g.fillStyle = col; g.fillRect(cx + r + 24, y0 + 20 + i * 22, 12, 12); g.fillStyle = "#222"; g.font = "10px 'IBM Plex Sans',sans-serif"; g.fillText(n + " " + p + "% = " + f(p * 3.6, 1) + "°", cx + r + 42, y0 + 30 + i * 22); }); B.text("Nigeria's exports by value (approximate shares)", x0, y0 + h + 28, { size: 10, w: 700, color: "#222" }); }
    },
    hud: (s, c) => [{ title: { bar: "Simple bar graph", div: "Divided (compound) bar graph", line: "Line graph", pie: "Pie chart" }[c.t], lines: [[{ bar: "Bars of equal width, separated by equal gaps; heights proportional to the values. Good for comparing separate items.", div: "Each bar is 100% (or the total) divided into its parts; good for showing composition and comparing it between places.", line: "Points joined by a line; good for continuous data that changes over time (trends).", pie: "A circle divided into sectors: angle = (value ÷ total) × 360°. Good for showing parts of a whole." }[c.t], "#ffd27a", true], "Every diagram needs: title, scale or key, labelled axes with units, source of data.", "Advantages: easy to read and compare. Disadvantages: exact values are hard to read; too many items make them cluttered."] }],
  });

  /* ===================== SD-b  Flow charts and flow maps ===================== */
  const STEPS = ["Cocoa pods harvested", "Beans fermented (5–7 days)", "Beans dried in the sun", "Bagged and graded", "Transported to port (Tema / Takoradi)", "Exported / processed into cocoa butter, powder and chocolate"];
  const FLOWS = [["Netherlands", 380, [4.9, 52.4]], ["Belgium", 210, [4.4, 50.8]], ["Germany", 190, [10, 51]], ["USA", 160, [-75, 40]], ["Malaysia", 120, [101.7, 3.1]]];
  MK.def("SD-b", {
    kind: "2d", label: "Interactive diagram board", title: "Flow charts and flow maps",
    blurb: "A flow chart shows the stages of a process; a flow map shows movement between places with arrows whose width is proportional to the amount.",
    values: { t: "chart" }, tick,
    controls: [{ type: "tabs", key: "t", label: "Show", options: [["chart", "Flow chart"], ["map", "Flow map: cocoa exports"]] }],
    draw(g, s, c, B) {
      const W = B.wide ? 386 : B.W - 10;
      if (c.t === "chart") { g.fillStyle = "#fbfaf6"; g.fillRect(0, 0, B.W, B.H); B.text("From cocoa farm to chocolate — a flow chart", 14, B.H - 8, { size: 10, w: 700, color: "#222" }); STEPS.forEach((t, i) => { const y = 34 + i * ((B.H - 60) / STEPS.length), bw = W - 60, bh = (B.H - 60) / STEPS.length - 14; g.fillStyle = ["#8a5a2a", "#a86a32", "#c8843a", "#d8a050", "#4a8ad0", "#3a9a5a"][i]; g.beginPath(); g.roundRect ? g.roundRect(30, y, bw, bh, 8) : g.rect(30, y, bw, bh); g.fill(); g.fillStyle = "#fff"; g.font = "700 10.5px 'IBM Plex Sans',sans-serif"; g.fillText((i + 1) + ". " + t, 42, y + bh / 2 + 4); if (i < STEPS.length - 1) { g.fillStyle = "#333"; g.beginPath(); g.moveTo(W / 2 - 6, y + bh + 2); g.lineTo(W / 2 + 6, y + bh + 2); g.lineTo(W / 2, y + bh + 12); g.fill(); } }); return; }
      bg(g, B); const F = frame(B); if (!drawCountries(g, F, (ft) => (ft.properties.NAME === "Ghana" || ft.properties.NAME === "Côte d'Ivoire" ? "#e8c890" : "#f3efe2"))) return waiting(g, B);
      const src = [F.X(-3), F.Y(6.5)]; FLOWS.forEach(([n, v, [lo, la]], i) => { const wdt = v / 380 * 16, ang = [-0.95, -0.75, -0.55, -2.6, 0.2][i], L = 80 + i * 6; const ex = Math.max(F.x0 + 12, Math.min(F.x0 + F.w - 12, src[0] + Math.cos(ang) * L * 1.6)), ey = Math.max(F.y0 + 12, src[1] + Math.sin(ang) * L * 1.4); g.strokeStyle = "rgba(160,90,30,.85)"; g.lineWidth = wdt; g.lineCap = "round"; g.beginPath(); g.moveTo(src[0], src[1]); g.quadraticCurveTo((src[0] + ex) / 2 + 20, (src[1] + ey) / 2 - 30, ex, ey); g.stroke(); g.fillStyle = "#222"; g.font = "700 9.5px 'IBM Plex Sans',sans-serif"; g.fillText(n + " " + v + " kt", ex - 30, ey - wdt / 2 - 4); });
      g.fillStyle = "#222"; g.font = "9px 'IBM Plex Sans',sans-serif"; g.fillText("Arrow width ∝ tonnage (illustrative, thousand tonnes)", F.x0 + 6, F.y0 + F.h - 6);
    },
    hud: (s, c) => [{ title: c.t === "chart" ? "Flow chart" : "Flow map", lines: [[c.t === "chart" ? "Boxes in sequence joined by arrows show the stages of a process (production, manufacturing, decision making)." : "Lines or arrows drawn from origin to destination; the width of each band is proportional to the quantity moved (goods, people, traffic).", "#ffd27a", true], "Flow maps show direction and volume of movement; they need a scale for the band widths.", "Disadvantages: overlapping lines become confusing; exact values must be read from the scale."] }],
  });

  /* ===================== SD-c  Dot maps ===================== */
  MK.def("SD-c", {
    kind: "2d", label: "Interactive map board", title: "Dot maps",
    blurb: "Each dot stands for a fixed number of people. Change the dot value and see how the map's appearance changes.",
    values: { v: 2 }, tick,
    controls: [{ type: "tabs", key: "v", label: "One dot =", options: [[1, "1 million"], [2, "2 million"], [5, "5 million"]] }],
    draw(g, s, c, B) {
      bg(g, B); const F = frame(B); if (!drawCountries(g, F)) return waiting(g, B);
      const key = c.v + "|" + F.w; if (s.key !== key) { s.key = key; s.dots = []; const r = BK.rng(7); DATA.d.features.forEach((ft) => { const n = Math.round(POP(ft) / 1e6 / c.v); let tries = 0, k = 0; const bb = GK.rings(ft.geometry).flat(); const lo0 = Math.min(...bb.map((p) => p[0])), lo1 = Math.max(...bb.map((p) => p[0])), la0 = Math.min(...bb.map((p) => p[1])), la1 = Math.max(...bb.map((p) => p[1])); const south = ft.properties.NAME === "Nigeria" || ft.properties.NAME === "Ghana"; while (k < n && tries++ < n * 400) { const lo = lo0 + r() * (lo1 - lo0), la = la0 + Math.pow(r(), south ? 1.3 : 1) * (la1 - la0); if (inGeom(lo, la, ft.geometry) && la < 18 + (r() < 0.1 ? 6 : 0)) { s.dots.push([lo, la]); k++; } } }); }
      g.save(); g.beginPath(); g.rect(F.x0, F.y0, F.w, F.h); g.clip(); g.fillStyle = "#c0392b"; s.dots.forEach(([lo, la]) => { g.beginPath(); g.arc(F.X(lo), F.Y(la), 1.8, 0, 6.3); g.fill(); }); g.restore();
      g.fillStyle = "#222"; g.font = "9px 'IBM Plex Sans',sans-serif"; g.fillText("● = " + c.v + " million people  ·  " + s.dots.length + " dots", F.x0 + 6, F.y0 + F.h - 6);
    },
    hud: (s, c) => [{ title: "Dot map", lines: [["Each dot represents a fixed quantity (here " + c.v + " million people), placed where the people actually live.", "#ffd27a", true], "Choosing the dot value: too small → dots merge in dense areas; too large → sparse areas show nothing.", "Advantages: shows distribution and density patterns clearly; values can be counted. Disadvantages: tedious to draw; needs detailed data; dots can be wrongly placed.", "This illustration places dots at random within each country, slightly favouring the south — a real dot map uses data for small areas."] }],
  });

  /* ===================== SD-d  Proportional circles ===================== */
  MK.def("SD-d", {
    kind: "2d", label: "Interactive map board", title: "Proportional circles (and spheres)",
    blurb: "Circles drawn with area proportional to each country's population: radius = k × √(value). Pick a country to see the working.",
    values: { n: "Nigeria" }, tick,
    controls: [{ type: "select", key: "n", label: "Country", options: ["Nigeria", "Ghana", "Côte d'Ivoire", "Senegal", "Sierra Leone", "Liberia", "Gambia", "Mali", "Niger", "Burkina Faso"].map((x) => [x, x]) }],
    draw(g, s, c, B) {
      bg(g, B); const F = frame(B); if (!drawCountries(g, F)) return waiting(g, B);
      const k = 1.8; DATA.d.features.slice().sort((a, b) => POP(b) - POP(a)).forEach((ft) => { if (!ft.c) return; const r = k * Math.sqrt(POP(ft) / 1e6); g.fillStyle = ft.properties.NAME === c.n ? "rgba(255,170,30,.85)" : "rgba(42,106,216,.55)"; g.strokeStyle = "#123"; g.beginPath(); g.arc(F.X(ft.c[0]), F.Y(ft.c[1]), r, 0, 6.3); g.fill(); g.stroke(); });
      [10, 50, 200].forEach((v, i) => { const r = k * Math.sqrt(v), x = F.x0 + 34 + i * 60, y = F.y0 + F.h - 8 - r; g.strokeStyle = "#123"; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.stroke(); g.fillStyle = "#222"; g.font = "8.5px 'IBM Plex Sans',sans-serif"; g.fillText(v + "m", x - 8, y + 3); });
    },
    hud: (s, c) => { const ft = DATA.d && DATA.d.features.find((x) => x.properties.NAME === c.n); const p = ft ? POP(ft) / 1e6 : 0; return [{ title: c.n + " — " + f(p, 1) + " million (Natural Earth estimate)", lines: [["√" + f(p, 1) + " = " + f(Math.sqrt(p), 2) + " → radius = " + f(Math.sqrt(p), 2) + " × scale factor", "#ffd27a", true], "Method: find the square root of each value, choose a scale (e.g. 1 mm per unit of √value), draw circles centred on each place, add a key of sample circles.", "Proportional spheres use the cube root — useful when values vary enormously.", "Advantages: easy comparison of totals; clear visual impact. Disadvantages: circles overlap; areas are hard to judge exactly."] }]; },
  });

  /* ===================== SD-e  Density (choropleth) maps ===================== */
  const CLS = [[0, 25, "#fff5d6"], [25, 50, "#fcd38a"], [50, 100, "#f59c4a"], [100, 200, "#d9531e"], [200, 1e9, "#8c1d0e"]];
  MK.def("SD-e", {
    kind: "2d", label: "Interactive map board", title: "Density (choropleth) maps",
    blurb: "Each country is shaded by population density (people per km²): the darker the shade, the more crowded. Densities are worked out from Natural Earth population estimates and boundary areas.",
    values: { n: "Nigeria" }, tick,
    controls: [{ type: "select", key: "n", label: "Show the working for", options: ["Nigeria", "Ghana", "Gambia", "Sierra Leone", "Liberia", "Senegal", "Niger", "Mali"].map((x) => [x, x]) }],
    draw(g, s, c, B) {
      bg(g, B); const F = frame(B); const dens = (ft) => POP(ft) / Math.max(1, ft.area);
      if (!drawCountries(g, F, (ft) => (CLS.find(([a, b]) => dens(ft) >= a && dens(ft) < b) || CLS[0])[2], "#555")) return waiting(g, B);
      const sel = DATA.d.features.find((x) => x.properties.NAME === c.n); if (sel) { g.save(); g.strokeStyle = "#1a5aff"; g.lineWidth = 2.4; g.beginPath(); GK.rings(sel.geometry).forEach((r) => r.forEach(([lo, la], i) => (i ? g.lineTo(F.X(lo), F.Y(la)) : g.moveTo(F.X(lo), F.Y(la))))); g.stroke(); g.restore(); }
      CLS.forEach(([a, b, col], i) => { g.fillStyle = col; g.fillRect(F.x0 + 6 + i * 70, F.y0 + F.h - 18, 14, 10); g.strokeStyle = "#555"; g.strokeRect(F.x0 + 6 + i * 70, F.y0 + F.h - 18, 14, 10); g.fillStyle = "#222"; g.font = "8.5px 'IBM Plex Sans',sans-serif"; g.fillText(b > 1e8 ? "200+" : a + "–" + b, F.x0 + 24 + i * 70, F.y0 + F.h - 9); });
    },
    hud: (s, c) => { const ft = DATA.d && DATA.d.features.find((x) => x.properties.NAME === c.n); if (!ft) return [{ title: "Choropleth map", lines: ["Loading…"] }]; const d = POP(ft) / ft.area; return [{ title: c.n + ": " + f(d, 0) + " people per km²", lines: [["Density = population ÷ area = " + fmtM(POP(ft)) + " ÷ " + Math.round(ft.area).toLocaleString("en-GB") + " km² = " + f(d, 1), "#ffd27a", true], "Method: calculate the density of each area, group the values into classes, shade each class with darker tones for higher values, add a key.", "Advantages: clear regional pattern; easy to draw from statistics. Disadvantages: assumes even density within each area; sharp changes at boundaries; the choice of classes changes the picture."] }]; },
  });
  const fmtM = (n) => f(n / 1e6, 1) + " million";

  /* ===================== SD-f  Isopleth maps ===================== */
  const RAIN = (lo, la) => { const coast = Math.max(0, 1 - (la - 4.5) / 4) * 1100, sl = 1700 * Math.exp(-(((lo + 11.5) / 2.6) ** 2) - (((la - 7.8) / 2.0) ** 2)), cam = 1200 * Math.exp(-(((lo - 9.5) / 1.6) ** 2) - (((la - 5) / 1.6) ** 2)), dahomey = -500 * Math.exp(-(((lo - 1) / 1.5) ** 2) - (((la - 6.2) / 1.2) ** 2)); return Math.max(20, 2600 * Math.exp(-(la - 5) / 6.2) - 250 + coast * 0.3 + sl + cam + dahomey); };
  MK.def("SD-f", {
    kind: "2d", label: "Interactive map board", title: "Isopleth maps",
    blurb: "Isopleths join places with equal values. These isohyets (lines of equal rainfall) show annual rainfall falling from the coast to the Sahara. Change the interval to see more or fewer lines.",
    values: { ci: 500, shade: 1 }, tick,
    controls: [{ type: "tabs", key: "ci", label: "Interval", options: [[250, "250 mm"], [500, "500 mm"]] }, { type: "toggle", key: "shade", label: "Layer shading" }],
    draw(g, s, c, B) {
      bg(g, B); const F = frame(B); if (!drawCountries(g, F, () => "#f6f2e6", "#888")) return waiting(g, B);
      g.save(); g.beginPath(); g.rect(F.x0, F.y0, F.w, F.h); g.clip();
      if (c.shade) { const cs = 6; for (let y = F.y0; y < F.y0 + F.h; y += cs) for (let x = F.x0; x < F.x0 + F.w; x += cs) { const lo = BB[0] + (x - F.x0) / F.w * (BB[2] - BB[0]), la = BB[3] - (y - F.y0) / F.h * (BB[3] - BB[1]), r = RAIN(lo, la), k = Math.min(1, r / 3000); g.fillStyle = `rgba(${Math.round(240 - 200 * k)},${Math.round(220 - 60 * k)},${Math.round(150 + 80 * k)},.45)`; g.fillRect(x, y, cs, cs); } }
      const segs = GK.contourSegs((x, z) => RAIN(x, -z), BB[0], -BB[3], BB[2], -BB[1], 120, c.ci); g.strokeStyle = "#1a4a9a"; g.lineWidth = 1.1; segs.forEach((sg) => { g.beginPath(); g.moveTo(F.X(sg[0]), F.Y(-sg[1])); g.lineTo(F.X(sg[2]), F.Y(-sg[3])); g.stroke(); });
      const done = {}; segs.forEach((sg, i) => { if (i % 9) return; const k = sg[4] + "_" + Math.round(F.X(sg[0]) / 130); if (done[k]) return; done[k] = 1; g.fillStyle = "#1a4a9a"; g.font = "700 8.5px 'IBM Plex Sans',sans-serif"; g.fillText(sg[4], F.X(sg[0]) + 2, F.Y(-sg[1]) - 2); });
      g.restore(); g.fillStyle = "#222"; g.font = "9px 'IBM Plex Sans',sans-serif"; g.fillText("Isohyets in mm per year (simplified)", F.x0 + 6, F.y0 + F.h - 6);
    },
    hud: (s, c) => [{ title: "Isopleth (isoline) map", lines: [["Lines joining places of equal value — drawn by interpolating between station readings.", "#ffd27a", true], "Kinds: isohyets (rainfall), isotherms (temperature), isobars (pressure), contours (height), isohalines (salinity), isochrones (travel time).", "Pattern here: rainfall decreases northwards from over 2 500 mm on the coast to under 250 mm in the Sahara; the Freetown–Monrovia coast and Cameroon highlands are wettest; the Accra plains (Dahomey gap) are drier.", "Advantages: shows gradual change; can be layer-shaded. Disadvantages: needs many evenly spread data points; lines are estimates between stations."] }],
  });
})();
