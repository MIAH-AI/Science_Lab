/* g3d-human.js — Population (PO), Settlement (SE), Transport (TR), Industry (IN), Trade (TD), Tourism (TO), Field work (FW),
   GIS (GIS) and Surveying (SV). Real Natural Earth boundaries and population estimates where a map is used. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, GK = window.GK, f = MK.fmt;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const hex3 = (h) => GK.hex3(h), mix3 = (a, b, k) => GK.mix3(a, b, k);
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mat = (color, o = {}) => new (T().MeshStandardMaterial)(Object.assign({ color, roughness: 0.8 }, o));
  const OUT = { hdri: "noon_grass", sky: true, sunPos: [6, 9, 5], shadowExtent: 7, fogNear: 30, fogFar: 90 };
  const MAPENV = Object.assign({}, OUT, { fog: false, hdri: "rooitou_park" });
  const WA = [-18.5, 3.5, 16, 17];
  const AF = [-20, -36, 52, 38];
  const fmtN = (n) => (n >= 1e6 ? f(n / 1e6, n >= 1e8 ? 0 : 1) + " million" : Math.round(n).toLocaleString("en-GB"));

  /* ---------- small vehicles and buildings ---------- */
  const car = (col = 0xc0392b, s = 0.12) => { const T3 = T(), g = new T3.Group(); const b = new T3.Mesh(new T3.BoxGeometry(s * 2, s * 0.6, s), mat(col, { metalness: 0.3, roughness: 0.4 })); b.position.y = s * 0.45; g.add(b); const c = new T3.Mesh(new T3.BoxGeometry(s, s * 0.45, s * 0.9), mat(0x9ab8d0, { metalness: 0.5, roughness: 0.2 })); c.position.set(-s * 0.1, s * 0.95, 0); g.add(c); return g; };
  const truck = (col = 0x2a6ad8, s = 0.14) => { const T3 = T(), g = new T3.Group(); const b = new T3.Mesh(new T3.BoxGeometry(s * 2.4, s * 1.1, s), mat(0xdddddd)); b.position.set(-s * 0.4, s * 0.8, 0); g.add(b); const c = new T3.Mesh(new T3.BoxGeometry(s * 0.8, s * 0.9, s), mat(col)); c.position.set(s * 1.3, s * 0.7, 0); g.add(c); return g; };
  const train = (n = 4, s = 0.16) => { const T3 = T(), g = new T3.Group(); for (let i = 0; i < n; i++) { const w = new T3.Mesh(new T3.BoxGeometry(s * 2.2, s * 0.9, s * 0.8), mat(i ? 0x2a7a4a : 0xd0a020, { metalness: 0.3 })); w.position.set(-i * s * 2.4, s * 0.6, 0); g.add(w); } return g; };
  const ship = (s = 0.3, col = 0x8a2a20) => { const T3 = T(), g = new T3.Group(); const h = new T3.Mesh(new T3.BoxGeometry(s * 3, s * 0.5, s * 0.8), mat(col)); h.position.y = s * 0.15; g.add(h); for (let i = 0; i < 4; i++) { const c = new T3.Mesh(new T3.BoxGeometry(s * 0.5, s * 0.35, s * 0.6), mat([0x2a6ad8, 0xe0a020, 0x3a9a5a, 0xc0392b][i])); c.position.set(-s + i * s * 0.55, s * 0.55, 0); g.add(c); } const br = new T3.Mesh(new T3.BoxGeometry(s * 0.4, s * 0.6, s * 0.7), mat(0xeeeeee)); br.position.set(s * 1.2, s * 0.7, 0); g.add(br); return g; };
  const plane = (s = 0.3) => { const T3 = T(), g = new T3.Group(); const b = new T3.Mesh(new T3.CylinderGeometry(s * 0.12, s * 0.1, s * 2, 12), mat(0xf4f4f4, { metalness: 0.4, roughness: 0.3 })); b.rotation.z = Math.PI / 2; g.add(b); const w = new T3.Mesh(new T3.BoxGeometry(s * 0.4, s * 0.03, s * 1.8), mat(0xdedede)); g.add(w); const t = new T3.Mesh(new T3.BoxGeometry(s * 0.25, s * 0.35, s * 0.03), mat(0x2a6ad8)); t.position.set(-s * 0.9, s * 0.18, 0); g.add(t); return g; };
  const tower = (w, h, col = 0xb8c4d0) => { const T3 = T(), m = new T3.Mesh(new T3.BoxGeometry(w, h, w), mat(col, { metalness: 0.35, roughness: 0.35 })); m.position.y = h / 2; m.castShadow = true; return m; };
  const factory = (s = 0.4) => { const T3 = T(), g = new T3.Group(); const b = new T3.Mesh(new T3.BoxGeometry(s * 2, s * 0.8, s * 1.2), mat(0x9a9a9a)); b.position.y = s * 0.4; g.add(b); for (let i = 0; i < 2; i++) { const c = new T3.Mesh(new T3.CylinderGeometry(s * 0.1, s * 0.13, s * 1.8, 10), mat(0x7a5a4a)); c.position.set(-s * 0.5 + i * s * 0.6, s * 0.9, -s * 0.3); g.add(c); } g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return g; };
  GK.vehicles = { car, truck, train, ship, plane, tower, factory };
  const along = (P, t) => { const n = P.length - 1, i = Math.min(n - 1, Math.floor(t * n)), k = t * n - i, a = P[i], b = P[i + 1]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, Math.atan2(-(b[2] - a[2]), b[0] - a[0])]; };
  /* centroid of the largest ring of a GeoJSON geometry */
  const centroid = (geom) => { let best = null, ba = 0; GK.rings(geom).forEach((r) => { let a = 0, cx = 0, cy = 0; for (let i = 0; i < r.length - 1; i++) { const [x1, y1] = r[i], [x2, y2] = r[i + 1], cr = x1 * y2 - x2 * y1; a += cr; cx += (x1 + x2) * cr; cy += (y1 + y2) * cr; } if (Math.abs(a) > ba) { ba = Math.abs(a); best = [cx / (3 * a), cy / (3 * a), Math.abs(a) / 2]; } }); return best; };
  GK.centroid = centroid;

  /* ===================== PO-a  Population growth and distribution ===================== */
  const PYR = { ng: ["Nigeria", [15.5, 14, 12.5, 11, 9.5, 8, 7, 6, 5, 4, 3, 2.5, 2, 3]], uk: ["United Kingdom", [5.5, 6, 6, 5.7, 6, 6.6, 6.8, 6.7, 6.3, 6.5, 7, 6.8, 6, 19]] };
  const AGES = ["0–4", "5–9", "10–14", "15–19", "20–24", "25–29", "30–34", "35–39", "40–44", "45–49", "50–54", "55–59", "60–64", "65+"];
  const WORLD = [[1800, 1.0], [1900, 1.65], [1950, 2.5], [1970, 3.7], [1987, 5.0], [1999, 6.0], [2011, 7.0], [2022, 8.0]];
  GK.def3d("PO-a", {
    title: "Population growth and distribution",
    blurb: "Compare the age structure of a young, fast-growing population with an ageing one, then see how Africa's people are spread between countries (Natural Earth population estimates).",
    envOpts: MAPENV, cam: [[5.4, 4.2, 7.4], [0.6, 1.0, 0]],
    values: { view: "pyr", c: "ng" },
    controls: [{ type: "tabs", key: "view", label: "Show", options: [["pyr", "Population pyramid"], ["dist", "Distribution in Africa"]] }, { type: "tabs", key: "c", label: "Country", options: [["ng", "Nigeria"], ["uk", "United Kingdom"]], show: (c) => c.view === "pyr" }],
    onChange(s, c, k, H) { if (k === "view" && H && H.S) GK.flyTo(H.S, s, c.view === "pyr" ? [[5.4, 4.2, 7.4], [0.6, 1.0, 0]] : [[0.4, 8.6, 7.4], [0.6, 0, 0.6]]); },
    build(S, s) { s.k = ""; },
    update(S, s, c) { const key = c.view + c.c; if (s.k === key) return; s.k = key; const g = BK.group(S, s), T3 = T(); s.cols = [];
      if (c.view === "pyr") { const D = PYR[c.c][1]; const fl = new T3.Mesh(new T3.BoxGeometry(5.6, 0.05, 1.4), mat(0x2a2f3a)); g.add(fl); D.forEach((p, i) => { [-1, 1].forEach((sd) => { const w = p / 2 * 0.28; const b = new T3.Mesh(new T3.BoxGeometry(w, 0.18, 0.7), mat(sd < 0 ? 0x3a8ad8 : 0xd85a8a, { roughness: 0.5 })); b.position.set(sd * (w / 2 + 0.05), 0.12 + i * 0.2, 0); b.castShadow = true; g.add(b); }); }); }
      else { s.map = GK.mapPlane({ bbox: AF, size: 9, geo: [{ path: "maps/africa_countries_50m.geojson", col: 0x222222, op: 0.7 }] }); g.add(s.map); const P = s.map.P; GK.json("maps/africa_countries_50m.geojson").then((d) => { if (!d || s.k !== key) return; const mx = Math.max(...d.features.map((ft) => ft.properties.POP_EST || 0)); d.features.forEach((ft) => { const cn = centroid(ft.geometry); if (!cn) return; const pop = ft.properties.POP_EST || 0, h = 0.05 + 2.2 * pop / mx, dens = pop / (cn[2] * 12300); const col = new T3.Color().setHSL(0.6 - Math.min(0.6, dens / 300 * 0.6), 0.75, 0.5); const m = new T3.Mesh(new T3.CylinderGeometry(0.07, 0.07, h, 12), new T3.MeshStandardMaterial({ color: col, roughness: 0.5 })); m.position.set(P.x(cn[0]), h / 2, P.z(cn[1])); m.castShadow = true; g.add(m); s.cols.push([ft.properties.NAME, pop, dens, m.position.clone().setY(h + 0.05)]); }); s.cols.sort((a, b) => b[1] - a[1]); }); } },
    overlay(ctx, s, c, S, B) { if (c.view !== "pyr") return; const x0 = 12, y0 = GK.storyOn ? 214 : 278, w = 230, h = 110; B.panel(x0, y0, w, h); ctx.fillStyle = "#cfe0f5"; ctx.font = "700 10px 'IBM Plex Sans',sans-serif"; ctx.fillText("WORLD POPULATION (billions)", x0 + 10, y0 + 15); const X = (y) => x0 + 18 + (y - 1800) / 222 * (w - 36), Y = (p) => y0 + h - 16 - p / 8.5 * (h - 36); ctx.strokeStyle = "#ffd27a"; ctx.lineWidth = 2; ctx.beginPath(); WORLD.forEach(([y, p], i) => (i ? ctx.lineTo(X(y), Y(p)) : ctx.moveTo(X(y), Y(p)))); ctx.stroke(); ctx.fillStyle = "#cfd8e8"; ctx.font = "8px 'IBM Plex Sans',sans-serif"; WORLD.forEach(([y, p], i) => { if (i % 2 === 0 || i === 7) ctx.fillText(p + "", X(y) - 4, Y(p) - 4); }); ctx.fillText("1800", X(1800), y0 + h - 4); ctx.fillText("2022", X(2022) - 18, y0 + h - 4); },
    labels: (s, c) => c.view === "pyr" ? [{ id: "m", p: [-1.6, 1.6, 0], t: "Males", col: "#8fc0ff" }, { id: "f", p: [1.6, 1.6, 0], t: "Females", col: "#ffa8c8" }, { id: "base", p: [0, 0.15, 0.4], t: "Age 0–4 (base)", col: "#e8f1ff", dy: 30 }, { id: "top", p: [0, 2.85, 0], t: "65 and over", col: "#e8f1ff", dy: -20 }] : (s.cols || []).slice(0, 8).map(([n, p, , pos]) => ({ id: n, p: pos.toArray(), t: n + " " + fmtN(p), col: "#ffe7a8" })),
    hud: (s, c) => c.view === "pyr" ? [{ title: PYR[c.c][0] + " — approximate age structure (%)", lines: [[c.c === "ng" ? "Wide base, narrow top: high birth rate, many young dependants, rapid growth — over 40% are under 15." : "Narrow base and wide top: low birth and death rates, long life expectancy, an ageing population.", "#ffd27a", true], "Population growth = births − deaths ± migration. Nigeria: about 45 million in 1960, 140 million at the 2006 census, over 220 million today (estimate).", "Causes of rapid growth: high birth rates, falling death rates (better health care), early marriage, desire for large families.", "World population reached 8 billion in 2022."] }] : [{ title: "Population distribution in Africa", lines: [["Column height = population; colour = density (blue sparse → red dense). Nigeria has the largest population in Africa.", "#ffd27a", true], "Dense: Nile valley and delta, West African coast and south-east Nigeria, East African highlands and Lake Victoria basin, Great Lakes.", "Sparse: Sahara, Kalahari and Namib deserts, the dense rainforest of the Congo basin, tsetse-infested areas.", "Factors: climate, relief, soils, water supply, minerals, disease, history, transport, government policy."] }],
    story: [{ d: 6, cap: "A population pyramid shows the percentage of males and females in each age group.", set: { view: "pyr", c: "ng" } }, { d: 6, cap: "Nigeria's pyramid has a wide base: many children, a high birth rate and rapid growth.", hl: "base" }, { d: 6, cap: "The United Kingdom's pyramid is narrow at the base and wide at the top — an ageing population.", set: { c: "uk" }, hl: "top" }, { d: 7, cap: "Across Africa, people are concentrated where water, good soils and jobs are found. Nigeria stands out.", set: { view: "dist" }, cam: [[0.4, 8.6, 7.4], [0.6, 0, 0.6]] }],
    draw: GK.fallback("Population", ["Pyramid: wide base = young, growing population", "Distribution: dense where water, soils and jobs", "World population 8 billion (2022)"]),
  });

  /* ===================== PO-b  Population movement and growth problems ===================== */
  const MIG = [
    ["ru", "Rural–urban migration", [[[8.5, 12.0], [3.4, 6.5]], [[7.5, 9.0], [3.4, 6.5]], [[-1.0, 9.4], [-0.2, 5.6]], [[-5.0, 8.0], [-4.0, 5.35]]], "Young people move from villages to cities (Lagos, Accra, Abidjan) for jobs, education and amenities."],
    ["seasonal", "Seasonal migration", [[[2.0, 14.5], [3.0, 7.5]], [[-2.0, 14.0], [-3.0, 6.0]], [[-5.0, 13.5], [-6.5, 6.5]]], "In the long dry season, farmers and herders from the Sahel move south to the coast and to wetter pastures, returning when the rains start (Fulani herders, labourers)."],
    ["intl", "International migration", [[[-1.0, 12.4], [-4.0, 5.35]], [[2.1, 13.5], [3.4, 6.5]], [[-15.5, 14.0], [-17.0, 16.8]]], "People move between countries: within ECOWAS (free movement) to Côte d'Ivoire, Ghana and Nigeria; and overseas to Europe."],
    ["forced", "Forced migration (refugees, IDPs)", [[[13.0, 12.0], [13.5, 10.0]], [[-11.0, 8.0], [-9.0, 7.5]]], "Conflict, insurgency and disasters force people to flee — e.g. the north-east of Nigeria, past civil wars in Liberia and Sierra Leone."],
  ];
  GK.def3d("PO-b", {
    title: "Population movement and growth problems",
    blurb: "Arrows show the main kinds of migration across West Africa. Pick a type of movement to read its causes and effects.",
    envOpts: MAPENV, cam: [[0.6, 7.6, 6.6], [0.8, 0, 0.4]],
    values: { t: "ru" }, controls: [{ type: "select", key: "t", label: "Movement", options: MIG.map((m) => [m[0], m[1]]) }],
    build(S, s) { const g = BK.group(S, s); s.map = GK.mapPlane({ bbox: WA, size: 9, geo: [{ path: "maps/westafrica_countries_10m.geojson", col: 0x222222, op: 0.8 }] }); g.add(s.map); s.P = s.map.P; s.ar = new (T().Group)(); g.add(s.ar); s.k = ""; },
    update(S, s, c) { if (s.k === c.t) return; s.k = c.t; BK.dispose(S, s.ar); s.ar = new (T().Group)(); s.g.add(s.ar); const P = s.P, M = MIG.find((m) => m[0] === c.t); M[2].forEach(([[lo0, la0], [lo1, la1]]) => { const a = [P.x(lo0), 0.15, P.z(la0)], b = [P.x(lo1), 0.15, P.z(la1)]; const mid = [(a[0] + b[0]) / 2, 0.6, (a[2] + b[2]) / 2]; const curve = []; for (let i = 0; i <= 16; i++) { const t = i / 16; curve.push([a[0] * (1 - t) * (1 - t) + 2 * mid[0] * t * (1 - t) + b[0] * t * t, 0.15 + 0.9 * t * (1 - t), a[2] * (1 - t) * (1 - t) + 2 * mid[2] * t * (1 - t) + b[2] * t * t]); } s.ar.add(GK.line(curve, 0xffb03a, 0.03)); s.ar.add(GK.arrow(curve[14], curve[16], 0xffb03a, 0.04)); }); },
    labels: (s) => { if (!s.P) return []; const P = s.P; return [["Lagos", 3.4, 6.5], ["Accra", -0.2, 5.6], ["Abidjan", -4.0, 5.35], ["Kano", 8.5, 12.0], ["Dakar", -17.4, 14.7], ["Niamey", 2.1, 13.5], ["Ouagadougou", -1.5, 12.4]].map(([n, lo, la]) => ({ id: n, p: [P.x(lo), 0.05, P.z(la)], t: n, col: "#ffe7a8" })); },
    hud: (s, c) => { const M = MIG.find((m) => m[0] === c.t); return [{ title: M[1], lines: [[M[3], "#ffd27a", true], "—", "Push factors: poverty, unemployment, drought, conflict, lack of amenities. Pull factors: jobs, schools, hospitals, security, bright lights of the city.", "Effects on cities: overcrowding, slums, unemployment, traffic, crime, pressure on water and power. Effects on villages: loss of young labour, falling farm output, ageing population.", "Problems of rapid growth: unemployment, food shortages, pressure on schools and health care, environmental damage. Solutions: family planning, rural development, education of women, job creation."] }]; },
    story: MIG.map((M) => ({ d: 6, title: M[1], cap: M[1] + ": " + M[3], set: { t: M[0] } })),
    draw: GK.fallback("Migration", MIG.map((M) => M[1] + ": " + M[3])),
  });

  /* ===================== SE-a  Types and patterns of settlement ===================== */
  const seH = (x, z) => 0.12 + 0.5 * Math.exp(-(((x - 3.2) / 0.9) ** 2) - ((z + 1.4) / 0.9) ** 2) + (BK.fbm(x * 0.7, z * 0.7, 3) - 0.5) * 0.1 - 0.08 * Math.exp(-(((z - 1.6 - 0.25 * Math.sin(x)) / 0.15) ** 2));
  GK.tour("SE-a", {
    title: "Types and patterns of settlement",
    blurb: "Rural settlements take different shapes: clustered, strung out along a route, or scattered. Compare them with an urban settlement.",
    envOpts: OUT, cam: [[1.4, 6.0, 9.0], [0, 0, 0]], fly: [1.2, 1.6, 2.6],
    build(g) {
      const T3 = T(); g.add(GK.terrain({ w: 11, d: 7, nx: 200, h: seH, tint: GK.tintSavanna }));
      const rv = []; for (let i = 0; i <= 80; i++) { const x = -5.5 + i * 11 / 80, z = 1.6 + 0.25 * Math.sin(x); rv.push([x, seH(x, z) + 0.03, z]); } g.add(GK.line(rv, 0x2f78c0, 0.04));
      const road = []; for (let i = 0; i <= 60; i++) { const x = -5.5 + i * 11 / 60, z = -0.2 + 0.1 * Math.sin(x * 0.7); road.push([x, seH(x, z) + 0.02, z]); } g.add(GK.line(road, 0x6a5a4a, 0.03));
      const r = BK.rng(5), hut = (x, z, s) => { const h = GK.hut(s); h.position.set(x, seH(x, z), z); g.add(h); };
      for (let i = 0; i < 40; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 0.55; hut(-3.4 + Math.cos(a) * d, -1.6 + Math.sin(a) * d, 0.06); }
      for (let i = 0; i < 26; i++) { const x = -1.2 + i * 0.13; hut(x, -0.2 + 0.1 * Math.sin(x * 0.7) + (i % 2 ? 0.14 : -0.14), 0.055); }
      for (let i = 0; i < 12; i++) { const x = -5 + r() * 4, z = 2.2 + r() * 1.1; hut(x, z, 0.06); GK.flora(g, [[x + 0.2, seH(x + 0.2, z), z, 1]], "broad", 0x3a6a2a, 0.2); }
      const town = [[2.2, 1.0], [2.6, 1.2], [2.4, 0.7], [2.9, 0.9], [3.1, 1.3], [2.0, 1.4], [2.7, 0.5], [3.3, 0.6]]; town.forEach(([x, z], i) => { const tw = tower(0.18, 0.2 + (i % 4) * 0.15, i % 3 ? 0xd8d0c0 : 0xb8c4d0); tw.position.set(x, seH(x, z), z); g.add(tw); });
      for (let i = 0; i < 50; i++) { const x = 1.6 + r() * 2.4, z = 0.2 + r() * 1.6; if (Math.hypot(x - 2.6, z - 1.0) < 0.6) continue; const h = GK.house(0.1); h.position.set(x, seH(x, z), z); g.add(h); }
      GK.flora(g, GK.scatter(160, -5.5, 5.5, -3.4, 3.4, seH, (x, z) => Math.hypot(x + 3.4, z + 1.6) > 0.8 && Math.abs(z + 0.2) > 0.4 && Math.hypot(x - 2.6, z - 1) > 1.3, 7), "umbrella", 0x5a7a30, 0.3);
    },
    feats: [
      { id: "nuc", n: "Nucleated (clustered) settlement", p: [-3.4, 0.3, -1.6], d: "Houses grouped closely together around a centre — a water point, market, chief's compound or crossroads; good for defence and sharing services." },
      { id: "lin", n: "Linear (ribbon) settlement", p: [-0.2, 0.3, -0.2], d: "Houses strung out along a road, railway, river or coastline." },
      { id: "dis", n: "Dispersed (scattered) settlement", p: [-3.0, 0.3, 2.7], d: "Isolated farmsteads spread over farmland — common where land is plentiful and secure." },
      { id: "urb", n: "Urban settlement (town)", p: [2.6, 0.6, 1.0], d: "A large settlement where most people work in manufacturing, trade and services rather than farming." },
    ],
    notes: ["Rural settlements: hamlets, villages — people mainly engaged in primary activities (farming, fishing, lumbering).", "Urban settlements: towns, cities, conurbations, megacities (Lagos) — secondary and tertiary activities.", "Factors of settlement pattern: relief, water supply, soils, security, transport routes, culture."],
  });

  /* ===================== SE-b  Location, growth and functions of settlements ===================== */
  GK.tour("SE-b", {
    title: "Site, growth and functions of a town",
    blurb: "A West African port city: why it grew where it did and how its land is used — from the central business district to the industrial estates and suburbs.",
    envOpts: OUT, cam: [[1.4, 6.6, 9.4], [0, 0, 0.4]], fly: [1.2, 1.5, 2.4],
    build(g, S, s) {
      const T3 = T(), h = (x, z) => (z > 2.4 ? -0.05 : 0.12 + (BK.fbm(x, z, 31) - 0.5) * 0.05 + 0.4 * Math.exp(-(((x + 3.6) / 0.6) ** 2) - ((z + 2.0) / 0.6) ** 2));
      g.add(GK.terrain({ w: 11, d: 7, nx: 160, h, tint: (hn, sl, x, z) => (z > 2.3 ? hex3(0xd8c89c) : mix3(hex3(0x8a8a7a), hex3(0x5c7d34), sm(2.0, 3.5, Math.hypot(x, z)))) }));
      const sea = GK.water(14, 3, 0x2a6f8f, 0.9); sea.position.set(0, 0.0, 4.4); g.add(sea);
      const r = BK.rng(8); for (let i = 0; i < 22; i++) { const x = (r() - 0.5) * 1.4, z = (r() - 0.5) * 1.0; const tw = tower(0.16 + r() * 0.1, 0.4 + r() * 1.2, [0xb8c4d0, 0x9ab0c8, 0xd0d4d8][i % 3]); tw.position.set(x, h(x, z), z); g.add(tw); }
      for (let i = 0; i < 90; i++) { const a = r() * 6.28, d = 1.2 + r() * 1.4, x = Math.cos(a) * d * 1.4, z = Math.sin(a) * d * 0.8; if (z > 2.2) continue; const hs = GK.house(0.12, i % 3 ? 0x8a3a2a : 0x6b6b6b); hs.position.set(x, h(x, z), z); g.add(hs); }
      for (let i = 0; i < 25; i++) { const x = 3.4 + r() * 1.6, z = -2.6 + r() * 1.6; const hs = GK.house(0.18, 0x5a6a7a, 0xf4f0e8); hs.position.set(x, h(x, z), z); g.add(hs); } GK.flora(g, GK.scatter(40, 3.3, 5.2, -2.8, -0.9, h, null, 9), "broad", 0x3a7a2a, 0.25);
      [[-3.0, 0.8], [-3.8, 1.1], [-3.4, 0.3]].forEach(([x, z]) => { const fct = factory(0.35); fct.position.set(x, h(x, z), z); g.add(fct); });
      const quay = new T3.Mesh(new T3.BoxGeometry(2.4, 0.14, 0.5), mat(0x8a8a8a)); quay.position.set(2.0, 0.05, 2.7); g.add(quay); const sh = ship(0.32); sh.position.set(2.0, 0.02, 3.2); g.add(sh); for (let i = 0; i < 2; i++) { const cr = new T3.Mesh(new T3.BoxGeometry(0.05, 0.7, 0.05), mat(0xe0a020)); cr.position.set(1.4 + i * 1.1, 0.45, 2.7); g.add(cr); }
      const mk = new T3.Mesh(new T3.BoxGeometry(0.6, 0.06, 0.4), mat(0xd8a050)); mk.position.set(-1.2, h(-1.2, 1.2) + 0.03, 1.2); g.add(mk); for (let i = 0; i < 12; i++) { const st = new T3.Mesh(new T3.BoxGeometry(0.08, 0.06, 0.08), mat([0xc0392b, 0x2a6ad8, 0xe0a020][i % 3])); st.position.set(-1.45 + (i % 6) * 0.1, h(-1.2, 1.2) + 0.09, 1.08 + Math.floor(i / 6) * 0.25); g.add(st); }
      const fort = new T3.Mesh(new T3.BoxGeometry(0.4, 0.2, 0.4), mat(0xe8e0d0)); fort.position.set(-3.6, h(-3.6, -2.0), -2.0); g.add(fort);
    },
    feats: [
      { id: "cbd", n: "Central Business District (CBD)", p: [0, 1.5, 0], d: "The heart of the city: offices, banks, shops and government buildings; tallest buildings, highest land values, heavy traffic (e.g. Lagos Island, Accra central)." },
      { id: "port", n: "Port — site on a natural harbour", p: [2.0, 0.6, 2.8], d: "A coastal site with sheltered deep water allowed a port to grow; trade drew people and industry." },
      { id: "ind", n: "Industrial estate", p: [-3.4, 0.6, 0.8], d: "Factories on the edge of the city near the port, road and rail, with cheaper land (e.g. Ikeja, Apapa, Tema)." },
      { id: "hd", n: "High-density residential", p: [-1.6, 0.3, -1.2], d: "Crowded housing close to the centre and factories; low-income areas, sometimes slums." },
      { id: "ld", n: "Low-density residential (GRA)", p: [4.2, 0.4, -1.8], d: "Large houses with gardens on higher, healthier ground (government reservation areas)." },
      { id: "market", n: "Market", p: [-1.2, 0.35, 1.2], d: "Trade is a major function — periodic and daily markets supply the city and its region." },
      { id: "defence", n: "Defensive hill site", p: [-3.6, 0.7, -2.0], d: "Many old towns began on hills for defence (e.g. Abeokuta near Olumo Rock, Ibadan)." },
    ],
    notes: ["Factors of location (site): water supply, defence, a bridging point or route centre, flat dry land, a harbour, minerals, fertile soil, a gap through hills.", "Functions: administrative (capitals), commercial, industrial, educational, religious, mining, port, tourist, residential.", "Growth: natural increase, rural–urban migration, industrialisation, being chosen as a capital, transport improvements."],
  });

  /* ===================== SE-c  Interaction and migration (rural–urban interaction) ===================== */
  GK.def3d("SE-c", {
    title: "Rural–urban interaction",
    blurb: "Villages and towns depend on each other. Watch the two-way flows: food, raw materials and labour go to the town; goods, services, money and ideas go back to the villages.",
    envOpts: OUT, cam: [[1.2, 5.6, 8.6], [0, 0, 0]],
    build(S, s) {
      const g = BK.group(S, s), T3 = T(), h = (x, z) => 0.12 + (BK.fbm(x * 0.6, z * 0.6, 7) - 0.5) * 0.12;
      g.add(GK.terrain({ w: 12, d: 7, nx: 140, h, tint: GK.tintSavanna }));
      const r = BK.rng(3); for (let i = 0; i < 18; i++) { const tw = tower(0.18, 0.3 + r() * 0.9); const x = 2.6 + (r() - 0.5) * 1.2, z = (r() - 0.5) * 1.2; tw.position.set(x, h(x, z), z); g.add(tw); }
      s.villages = [[-3.6, -2.0], [-4.0, 1.6], [-1.4, 2.6], [-1.0, -2.6]]; s.villages.forEach(([vx, vz]) => { for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = r() * 0.35, hut = GK.hut(0.06); hut.position.set(vx + Math.cos(a) * d, h(vx, vz), vz + Math.sin(a) * d); g.add(hut); } const P = []; for (let i = 0; i <= 20; i++) { const t = i / 20, x = vx + (2.6 - vx) * t, z = vz * (1 - t); P.push([x, h(x, z) + 0.02, z]); } g.add(GK.line(P, 0x6a5a4a, 0.025)); });
      GK.flora(g, GK.scatter(120, -6, 6, -3.5, 3.5, h, (x, z) => Math.hypot(x - 2.6, z) > 1.3, 4), "umbrella", 0x5a7a30, 0.3);
      s.movers = []; s.villages.forEach(([vx, vz], i) => { [0, 1].forEach((dir) => { const m = dir ? truck(0xd0a020, 0.1) : truck(0x2a8a4a, 0.1); g.add(m); s.movers.push([m, vx, vz, dir, i * 0.25 + dir * 0.5]); }); }); s.h = h; s.t = 0;
    },
    update(S, s, c, dt) { s.t += dt; s.movers.forEach(([m, vx, vz, dir, ph]) => { let t = (s.t * 0.12 + ph) % 1; if (dir) t = 1 - t; const x = vx + (2.6 - vx) * t, z = vz * (1 - t); m.position.set(x, s.h(x, z) + 0.02, z); m.rotation.y = Math.atan2(-(0 - vz), 2.6 - vx) + (dir ? Math.PI : 0); }); },
    labels: () => [{ id: "town", p: [2.6, 1.3, 0], t: "Town (urban centre)", col: "#ffd27a" }, { id: "v", p: [-3.6, 0.3, -2.0], t: "Village", col: "#e8f1ff" }, { id: "to", p: [-0.4, 0.4, -1.0], t: "Green trucks → food, raw materials, labour", col: "#9fe8b0" }, { id: "back", p: [-0.6, 0.4, 1.3], t: "Yellow trucks → manufactured goods, money, services", col: "#ffe08a", dy: 26 }],
    hud: () => [{ title: "Rural–urban interaction", lines: [["Rural areas supply food, raw materials (cocoa, cotton, groundnuts, timber) and labour; towns supply manufactured goods, markets, jobs, schools, hospitals, banks and new ideas.", "#ffd27a", true], "Movements: daily commuting, periodic market visits, seasonal and permanent migration, remittances sent home.", "Benefits: wider markets for farmers, spread of development. Problems: rural depopulation, urban congestion.", "Ways to reduce rural–urban drift: rural electrification, roads, schools and clinics in villages, credit for farmers, small-scale industries."] }],
    story: [{ d: 6, cap: "Villages around the town send food, raw materials and workers along the roads.", hl: "to" }, { d: 6, cap: "The town sends back manufactured goods, money and services. Both depend on each other.", hl: "back" }],
    draw: GK.fallback("Rural–urban interaction", ["Villages: food, raw materials, labour", "Towns: goods, services, jobs, markets"]),
  });

  /* ===================== TR-a  Modes of transport ===================== */
  GK.tour("TR-a", {
    title: "Modes of transport",
    blurb: "Road, rail, water, air and pipeline transport in one landscape — each with its own advantages and problems. The vehicles are moving.",
    envOpts: OUT, cam: [[1.6, 5.8, 9.6], [0, 0, 0.4]], fly: [1.4, 1.4, 2.6],
    build(g, S, s) {
      const T3 = T(), h = (x, z) => (z > 2.6 ? -0.05 : 0.12 + (BK.fbm(x * 0.5, z * 0.5, 2) - 0.5) * 0.06 - 0.08 * Math.exp(-(((x + 0.4 * z - 3.6) / 0.25) ** 2)));
      g.add(GK.terrain({ w: 12, d: 7, nx: 160, h, tint: (hn, sl, x, z) => (z > 2.5 ? hex3(0xd8c89c) : GK.tintSavanna(hn, sl, x, z)) }));
      const sea = GK.water(14, 3, 0x2a6f8f, 0.9); sea.position.set(0, 0, 4.4); g.add(sea);
      const rvP = []; for (let i = 0; i <= 40; i++) { const z = -3.5 + i * 6.2 / 40, x = 3.6 - 0.4 * z; rvP.push([x, 0.06, z]); } g.add(GK.line(rvP, 0x2f78c0, 0.08));
      s.road = []; for (let i = 0; i <= 60; i++) { const x = -6 + i * 0.2, z = -0.6 + 0.3 * Math.sin(x * 0.5); s.road.push([x, h(x, z) + 0.03, z]); } g.add(GK.line(s.road, 0x3a3a3a, 0.05));
      s.rail = []; for (let i = 0; i <= 60; i++) { const x = -6 + i * 0.2, z = -2.2 + 0.2 * Math.sin(x * 0.4); s.rail.push([x, h(x, z) + 0.03, z]); } g.add(GK.line(s.rail, 0x5a4a3a, 0.035));
      s.pipe = [[-6, 0.2, 1.4], [-2, 0.2, 1.3], [1.0, 0.2, 1.8], [2.0, 0.2, 2.6]]; g.add(GK.line(s.pipe, 0x9a9a9a, 0.04));
      const quay = new T3.Mesh(new T3.BoxGeometry(2, 0.14, 0.4), mat(0x8a8a8a)); quay.position.set(-1, 0.05, 2.7); g.add(quay);
      const run = new T3.Mesh(new T3.BoxGeometry(3, 0.02, 0.3), mat(0x2a2a2a)); run.position.set(-3.6, h(-3.6, -3.2) + 0.02, -3.2); g.add(run);
      s.v = { car: truck(0xc0392b), train: train(), ship: ship(0.32), boat: ship(0.18, 0x2a6a8a), plane: plane(0.4) }; Object.values(s.v).forEach((m) => g.add(m)); s.t = 0; s.h = h;
    },
    tick(S, s, c, dt) { if (!s.v) return; s.t += dt; const r = along(s.road, (s.t * 0.05) % 1); s.v.car.position.set(r[0], r[1], r[2]); s.v.car.rotation.y = r[3]; const t2 = along(s.rail, (s.t * 0.04 + 0.3) % 1); s.v.train.position.set(t2[0], t2[1], t2[2]); s.v.train.rotation.y = t2[3]; const k = (s.t * 0.03) % 1; s.v.ship.position.set(-5 + k * 8, 0.0, 3.6); s.v.ship.rotation.y = 0; const kb = (s.t * 0.05) % 1, z = -3.0 + kb * 5.2; s.v.boat.position.set(3.6 - 0.4 * z, 0.05, z); s.v.boat.rotation.y = Math.PI / 2 - 0.38; const kp = (s.t * 0.08) % 1; s.v.plane.position.set(-5 + kp * 2.8, h0(kp), -3.2); s.v.plane.rotation.z = kp > 0.4 ? 0.25 : 0; },
    feats: [
      { id: "road", n: "Road transport", p: [-1, 0.4, -0.6], d: "Flexible, door-to-door, cheap to build compared with rail; carries most goods and passengers in West Africa. Problems: congestion, accidents, poor maintenance, high fuel costs." },
      { id: "rail", n: "Rail transport", p: [-1, 0.4, -2.2], d: "Carries heavy, bulky goods cheaply over long distances (Lagos–Kano, Port Harcourt–Maiduguri; Accra–Kumasi; the new standard-gauge lines). Problems: fixed routes, old equipment, high cost." },
      { id: "water", n: "Water transport (sea and inland waterways)", p: [-1, 0.2, 3.4], d: "Cheapest for bulky goods over long distances; ocean ships carry most international trade. Inland waterways: Niger, Benue, Lake Volta. Problems: slow, seasonal low water, silting, rapids." },
      { id: "air", n: "Air transport", p: [-3.6, 0.8, -3.2], d: "Fastest; for passengers, mail and valuable, perishable goods. Expensive; needs airports (Lagos, Abuja, Accra, Freetown–Lungi, Monrovia–Roberts, Banjul)." },
      { id: "pipe", n: "Pipeline", p: [-2, 0.35, 1.3], d: "Carries oil, gas and water cheaply and continuously (West African Gas Pipeline, Escravos–Lagos). Problems: costly to build, vandalism and leaks." },
    ],
    notes: ["Other modes: human porterage, animals (camels, donkeys) in the north, cable cars, canoes.", "Choosing a mode: cost, speed, distance, nature of goods (bulky, perishable), safety, availability."],
  });
  const h0 = (k) => (k < 0.4 ? 0.2 : 0.2 + (k - 0.4) * 4);

  /* ===================== TR-b  Transport and economic development ===================== */
  const ROUTES = [
    ["coast", "Trans-West African Coastal Highway", 0xffb03a, [[-17.4, 14.7], [-13.2, 8.5], [-10.8, 6.3], [-4.0, 5.35], [-0.2, 5.6], [1.2, 6.1], [2.4, 6.4], [3.4, 6.5]], "Links the coastal capitals from Dakar to Lagos — key ECOWAS trade route."],
    ["sahara", "Trans-Sahara Highway (Lagos–Algiers)", 0xffd23a, [[3.4, 6.5], [3.9, 7.4], [7.5, 9.0], [7.4, 10.5], [8.5, 12.0], [8.0, 13.8], [8.0, 16.9]], "Lagos – Kano – Zinder – Agadez – across the Sahara."],
    ["rngw", "Lagos–Kano railway", 0x2aa88a, [[3.4, 6.5], [3.9, 7.4], [4.5, 8.5], [5.0, 9.2], [7.4, 10.5], [8.5, 12.0]], "Built 1898–1912 to carry groundnuts and cotton to the port; now being modernised to standard gauge."],
    ["rnge", "Port Harcourt–Maiduguri railway", 0x2a8ad8, [[7.0, 4.8], [7.5, 6.4], [8.5, 7.7], [9.3, 9.0], [11.2, 10.3], [13.2, 11.8]], "The eastern line through Enugu, Makurdi and Kafanchan to Maiduguri."],
    ["rgh", "Ghana's railway triangle", 0xd85aa8, [[-0.2, 5.6], [-1.6, 6.7], [-1.75, 4.9], [-0.2, 5.6]], "Accra – Kumasi – Takoradi: built to carry gold, manganese, timber and cocoa."],
    ["volta", "Lake Volta waterway", 0x4aa8ff, [[0.0, 6.3], [-0.1, 7.5], [-0.6, 8.6], [-1.0, 9.2]], "Ferries and barges carry goods between the south and north of Ghana."],
  ];
  GK.def3d("TR-b", {
    title: "Transport and economic development",
    blurb: "The main routes and ports of West Africa. Transport links farms and mines to ports and markets — pick a route to follow it.",
    envOpts: MAPENV, cam: [[0.4, 7.8, 6.4], [0.6, 0, 0.3]],
    values: { r: "coast" }, controls: [{ type: "select", key: "r", label: "Route", options: ROUTES.map((x) => [x[0], x[1]]) }],
    build(S, s) { const g = BK.group(S, s); s.map = GK.mapPlane({ bbox: WA, size: 9, geo: [{ path: "maps/westafrica_countries_10m.geojson", col: 0x222222, op: 0.8 }] }); g.add(s.map); s.P = s.map.P; s.rt = new (T().Group)(); g.add(s.rt); s.k = ""; },
    update(S, s, c) { if (s.k === c.r) return; s.k = c.r; BK.dispose(S, s.rt); s.rt = new (T().Group)(); s.g.add(s.rt); const P = s.P; ROUTES.forEach(([id, , col, pts]) => s.rt.add(GK.line(pts.map(([lo, la]) => [P.x(lo), id === c.r ? 0.07 : 0.03, P.z(la)]), col, id === c.r ? 0.04 : 0.015))); [["Lagos/Apapa", 3.4, 6.45], ["Tema", 0.0, 5.65], ["Takoradi", -1.75, 4.9], ["Freetown", -13.2, 8.5], ["Monrovia", -10.8, 6.3], ["Banjul", -16.6, 13.45], ["Dakar", -17.4, 14.7], ["Abidjan", -4.0, 5.3], ["Port Harcourt", 7.0, 4.8]].forEach(([, lo, la]) => { const p = GK.pin(0x2a6ad8, 0.25); p.position.set(P.x(lo), 0, P.z(la)); s.rt.add(p); }); },
    labels: (s, c) => { if (!s.P) return []; const P = s.P, R = ROUTES.find((x) => x[0] === c.r), mid = R[3][Math.floor(R[3].length / 2)]; return [{ id: "r", p: [P.x(mid[0]), 0.1, P.z(mid[1])], t: R[1], col: "#ffd27a", dy: -30 }].concat([["Lagos", 3.4, 6.45], ["Tema", 0.0, 5.65], ["Freetown", -13.2, 8.5], ["Monrovia", -10.8, 6.3], ["Banjul", -16.6, 13.45], ["Kano", 8.5, 12.0]].map(([n, lo, la]) => ({ id: n, p: [P.x(lo), 0.25, P.z(la)], t: n, col: "#e8f1ff" }))); },
    hud: (s, c) => { const R = ROUTES.find((x) => x[0] === c.r); return [{ title: R[1], lines: [[R[4], "#ffd27a", true], "—", "Transport and development: carries raw materials to factories and ports, distributes goods, opens up new areas for farming and mining, creates jobs, encourages trade and tourism, aids national unity and administration.", "Problems in West Africa: poor roads, different rail gauges, few links between countries, border delays, congestion at ports."] }]; },
    story: ROUTES.slice(0, 5).map((R) => ({ d: 5.5, title: R[1], cap: R[1] + ": " + R[4], set: { r: R[0] } })),
    draw: GK.fallback("Transport routes", ROUTES.map((R) => R[1])),
  });

  /* ===================== IN-a  Classification and types of industry ===================== */
  GK.tour("IN-a", {
    title: "Classification and types of industry",
    blurb: "Industries are grouped by what they do: extracting raw materials, making goods, providing services. Follow cocoa from the farm to the shop.",
    envOpts: OUT, cam: [[1.4, 5.2, 9.0], [0, 0, 0]], fly: [1.2, 1.4, 2.4],
    build(g) {
      const T3 = T(), h = (x, z) => 0.12 + (BK.fbm(x * 0.5, z * 0.5, 9) - 0.5) * 0.1;
      g.add(GK.terrain({ w: 12, d: 6, nx: 140, h, tint: (hn, sl, x, z) => (x < -2 ? GK.tintForest(hn, sl, x, z) : x < 1.5 ? GK.tintSavanna(hn, sl, x, z) : hex3(0x8a8a82)) }));
      const cocoa = []; for (let x = -5.4; x < -2.4; x += 0.28) for (let z = -2.4; z < 2.4; z += 0.28) cocoa.push([x, h(x, z), z, 0.8]); GK.flora(g, cocoa, "broad", 0x3a6a2a, 0.3);
      const pit = new T3.Mesh(new T3.CylinderGeometry(0.6, 0.3, 0.3, 24, 1, true), mat(0x8a6a4a, { side: T3.DoubleSide })); pit.position.set(-1.0, 0.0, -1.8); g.add(pit);
      const f1 = factory(0.45); f1.position.set(0.6, h(0.6, 0), 0); g.add(f1);
      const r = BK.rng(2); for (let i = 0; i < 12; i++) { const tw = tower(0.2, 0.3 + r() * 0.9); const x = 3.4 + (r() - 0.5) * 2, z = (r() - 0.5) * 2; tw.position.set(x, h(x, z), z); g.add(tw); }
      const lab = tower(0.4, 0.5, 0x2a3a5a); lab.position.set(4.8, h(4.8, -2), -2); g.add(lab);
      const tk = truck(); tk.position.set(-1.8, h(-1.8, 0.6), 0.6); g.add(tk);
    },
    feats: [
      { id: "prim", n: "Primary industry", p: [-3.9, 0.6, 0], d: "Extracting raw materials from nature: farming (cocoa), fishing, lumbering, mining, quarrying." },
      { id: "mine", n: "Extractive industry — mining", p: [-1.0, 0.4, -1.8], d: "Mining and quarrying: tin, coal, gold, limestone, petroleum." },
      { id: "sec", n: "Secondary industry (manufacturing)", p: [0.6, 0.8, 0], d: "Processing raw materials into finished goods: cocoa into chocolate and butter, crude oil into petrol; also construction. Light (textiles, food) and heavy (iron and steel, cement)." },
      { id: "ter", n: "Tertiary industry (services)", p: [3.4, 1.2, 0], d: "Services to people and businesses: trade, transport, banking, education, health, tourism, government." },
      { id: "quat", n: "Quaternary industry", p: [4.8, 0.8, -2], d: "Knowledge industries: research, information technology, consultancy." },
    ],
    notes: ["Other classifications: cottage (craft) industries (weaving, pottery, blacksmithing) vs. large-scale factory industries; light vs. heavy; import substitution vs. export processing; footloose industries.", "Importance of industry: jobs, use of local raw materials, saves foreign exchange, export earnings, growth of towns, improved standard of living."],
  });

  /* ===================== IN-b  Factors of industrial location ===================== */
  const IND = {
    cement: ["Cement works", "A", "Raw material: limestone is heavy and loses weight in processing, so cement works are built at the limestone quarry (Ewekoro, Nkalagu, Obajana)."],
    brew: ["Brewery / soft drinks", "B", "Market: the product gains weight (water is added) and is bulky to carry, so bottling plants are built in or near large towns."],
    sugar: ["Sugar refinery", "C", "Raw material: sugar cane is bulky and perishable, so the refinery is beside the irrigated cane fields on the flood plain (Bacita, Numan, Savannah Sugar)."],
    alu: ["Aluminium smelter", "D", "Power: smelting needs huge amounts of cheap electricity, so it is sited near a hydro-electric dam and a port (VALCO at Tema, powered by Akosombo)."],
    textile: ["Textile mill", "B", "Labour and market: needs many workers and a large market; cotton is light to transport (Kaduna, Kano, Lagos)."],
  };
  const SITES = { A: [-2.6, 1.1, "A — beside the inselberg quarry"], B: [0.75, 1.75, "B — Okeho town"], C: [0.2, 2.6, "C — flood plain fields"], D: [3.0, -1.0, "D — near the dam and power line"] };
  GK.def3d("IN-b", {
    title: "Factors of industrial location",
    blurb: "Where should each factory go? Choose an industry: the best site on the Okeho map lights up, and the reason is explained.",
    envOpts: OUT, cam: [[3.2, 6.8, 9.4], [0.6, 0, 0.6]],
    values: { ind: "cement" }, controls: [{ type: "select", key: "ind", label: "Industry", options: Object.entries(IND).map(([k, v]) => [k, v[0]]) }],
    build(S, s) { const T3 = T(), g = BK.group(S, s), O = GK.okeho; if (!O) return; g.add(GK.terrain({ w: 10, d: 8, nx: 160, h: O.Y, tint: (hn, sl, x, z) => (O.hm(x, z) < 2 ? hex3(0xd9c79a) : GK.tintSavanna(hn, sl, x, z)) })); const sea = GK.water(16, 6, 0x2a6f8f, 0.9); sea.position.set(0, 0.001, 6.4); g.add(sea); const dam = new T3.Mesh(new T3.BoxGeometry(0.5, 0.25, 0.08), mat(0xb8b4ac)); dam.position.set(2.6, O.Y(2.6, -1.1) + 0.05, -1.1); g.add(dam); const line = []; for (let i = 0; i <= 10; i++) { const x = 2.6 - i * 0.2, z = -1.1 + i * 0.27; line.push([x, O.Y(x, z) + 0.15, z]); } g.add(GK.polyline(line, 0x333333, 1)); s.pins = {}; Object.entries(SITES).forEach(([k, [x, z]]) => { const p = GK.pin(0x9a9a9a, 0.45); p.position.set(x, O.Y(x, z), z); g.add(p); s.pins[k] = p; }); const tw = BK.rng(4); for (let i = 0; i < 40; i++) { const x = 0.75 + (tw() - 0.5) * 0.9, z = 1.75 + (tw() - 0.5) * 0.6, hs = GK.house(0.07); hs.position.set(x, O.Y(x, z), z); g.add(hs); } s.fac = factory(0.18); g.add(s.fac); s.k = ""; },
    update(S, s, c) { if (!s.pins || s.k === c.ind) return; s.k = c.ind; const best = IND[c.ind][1]; Object.entries(s.pins).forEach(([k, p]) => p.children[1].material.color.setHex(k === best ? 0x37d67a : 0x9a9a9a)); const [x, z] = SITES[best]; s.fac.position.set(x + 0.25, GK.okeho.Y(x + 0.25, z + 0.15), z + 0.15); },
    labels: (s, c) => (GK.okeho ? Object.entries(SITES).map(([k, [x, z, n]]) => ({ id: k, p: [x, GK.okeho.Y(x, z) + 0.5, z], t: n, col: k === IND[c.ind][1] ? "#5bd68c" : "#e8f1ff" })) : []),
    hud: (s, c) => { const I = IND[c.ind]; return [{ title: I[0] + " → site " + I[1], lines: [[I[2], "#ffd27a", true], "—", "Factors: raw materials, power, labour, market, transport, water supply, capital, government policy, land, climate, industrial inertia.", "Problems of industries in West Africa: unreliable power, poor transport, shortage of capital and skilled labour, competition from imports, pollution."] }]; },
    story: Object.entries(IND).map(([k, I]) => ({ d: 6, title: I[0], cap: I[0] + ": " + I[2], set: { ind: k }, hl: I[1] })),
    draw: GK.fallback("Industrial location", Object.values(IND).map((I) => I[0] + ": " + I[2])),
  });

  /* ===================== TD-a  Trade ===================== */
  const TRADE = [
    ["oil", "Crude oil — Nigeria", "export", [5.0, 5.5], [[22.0, 78.0], [40.0, -3.7], [40.0, -98.0]], "Nigeria's main export (about 80–90% of export earnings) to India, Europe and the USA."],
    ["cocoa", "Cocoa — Ghana and Côte d'Ivoire", "export", [6.5, -2.0], [[52.4, 4.9], [51.0, 10.0], [40.0, -75.0]], "The two produce over half the world's cocoa, shipped to the Netherlands, Germany, Belgium and the USA."],
    ["iron", "Iron ore — Liberia and Sierra Leone", "export", [7.0, -10.5], [[51.0, 10.0], [35.0, 117.0]], "Iron ore from Nimba/Bong and Tonkolili goes to Europe and China."],
    ["ground", "Groundnuts and fish — The Gambia and Senegal", "export", [13.5, -16.0], [[48.0, 2.0], [35.0, 105.0]], "Groundnuts and fish products to Europe and Asia."],
    ["mach", "Imports: machinery, vehicles, refined fuel", "import", [6.5, 3.4], [[35.0, 105.0], [51.0, 10.0], [40.0, -98.0]], "West Africa imports machinery, vehicles, electronics, refined petroleum, rice and wheat from China, Europe, the USA and India."],
  ];
  GK.def3d("TD-a", {
    title: "Trade: types, reasons and importance",
    blurb: "International trade links West Africa with the world. Pick a commodity to see where it goes.",
    envOpts: { bgColor: 0x02040b, fog: false, hemi: 0.2, sun: 3, sunPos: [10, 6, 20], shadow: false, envI: 0.15, hdri: "dikhololo_night" }, cam: [[0, 1.4, 7.2], [1.0, 0.2, 0]],
    values: { t: "oil" }, controls: [{ type: "select", key: "t", label: "Trade flow", options: TRADE.map((x) => [x[0], x[1]]) }],
    build(S, s) { const g = BK.group(S, s); g.add(GK.stars()); s.gl = GK.globe(2, { clouds: false }); g.add(s.gl); s.gl.earth.rotation.y = (-90 - 5) * Math.PI / 180; s.arcs = new (T().Group)(); s.gl.earth.add(s.arcs); s.k = ""; s.dots = GK.particles(120, 0xffe28a, 0.06, 1); s.gl.earth.add(s.dots); },
    update(S, s, c, dt) { const T3 = T(); s.gl.setSun(S, V(0.3, 0.3, 1)); if (s.k !== c.t) { s.k = c.t; BK.dispose(S, s.arcs); s.arcs = new T3.Group(); s.gl.earth.add(s.arcs); const R = TRADE.find((x) => x[0] === c.t); s.paths = R[4].map((dst) => { const a = V(...GK.ll(R[3][0], R[3][1], 2)), b = V(...GK.ll(dst[0], dst[1], 2)), pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40, p = a.clone().lerp(b, t).normalize().multiplyScalar(2 + 0.5 * Math.sin(Math.PI * t) * a.distanceTo(b) / 3); pts.push(R[2] === "import" ? pts.length ? p.toArray() : p.toArray() : p.toArray()); } if (R[2] === "import") pts.reverse(); s.arcs.add(GK.line(pts, R[2] === "import" ? 0x4aa8ff : 0xffb03a, 0.012)); return pts; }); s.ry = (-90 - R[3][1] - 25) * Math.PI / 180; }
      s.gl.earth.rotation.y += (s.ry - s.gl.earth.rotation.y) * Math.min(1, dt * 1.5); const t = performance.now() / 1000, P = s.dots.pos; for (let i = 0; i < 120; i++) { const path = s.paths[i % s.paths.length], k = (t * 0.15 + i / 120) % 1, j = Math.floor(k * 40); P.set(path[j], i * 3); } s.dots.flush(); },
    hud: (s, c) => { const R = TRADE.find((x) => x[0] === c.t); return [{ title: R[1], lines: [[R[5], "#ffd27a", true], "—", "Types: internal (home) and external (international) trade; bilateral and multilateral; entrepôt (re-export) trade.", "Reasons: uneven distribution of resources, differences in climate and skills, surplus production, specialisation.", "Importance: foreign exchange, wider markets, jobs, revenue from duties, access to goods not produced at home, international cooperation.", "Problems: dependence on a few primary exports with unstable prices, poor transport, trade barriers, smuggling. Balance of trade = value of exports − value of imports."] }]; },
    story: TRADE.map((R) => ({ d: 5.5, title: R[1], cap: R[1] + ": " + R[5], set: { t: R[0] } })),
    draw: GK.fallback("Trade", TRADE.map((R) => R[1])),
  });

  /* ===================== TO-a  Tourism ===================== */
  const TOUR = [
    ["yankari", "Yankari Game Reserve (Nigeria)", 9.75, 10.5, "Wildlife (elephants, baboons) and the warm Wikki springs."],
    ["obudu", "Obudu Mountain Resort (Nigeria)", 6.36, 9.37, "Cool highland resort with cable car and ranch."],
    ["olumo", "Olumo Rock, Abeokuta (Nigeria)", 7.15, 3.35, "Granite inselberg with historic caves."],
    ["zuma", "Zuma Rock (Nigeria)", 9.13, 7.24, "Giant monolith near Abuja."],
    ["capecoast", "Cape Coast and Elmina Castles (Ghana)", 5.1, -1.25, "UNESCO World Heritage forts of the Atlantic slave trade."],
    ["kakum", "Kakum National Park (Ghana)", 5.35, -1.38, "Rainforest canopy walkway."],
    ["mole", "Mole National Park (Ghana)", 9.7, -1.85, "Savanna wildlife — elephants and antelopes."],
    ["bunce", "Bunce Island and Tiwai Island (Sierra Leone)", 8.57, -13.04, "Historic slave fort; Tiwai's primates and rainforest."],
    ["sapo", "Sapo National Park (Liberia)", 5.4, -8.6, "Upper Guinean rainforest with pygmy hippos."],
    ["kunta", "Kunta Kinteh Island (The Gambia)", 13.32, -16.36, "UNESCO site on the Gambia River linked to Alex Haley's 'Roots'."],
    ["goree", "Gorée Island (Senegal)", 14.67, -17.4, "Former slave-trading island near Dakar."],
  ];
  GK.def3d("TO-a", {
    title: "Tourism: centres, importance and problems",
    blurb: "Major tourist attractions of West Africa — wildlife, scenery, beaches and history. Pick a centre to locate it.",
    envOpts: MAPENV, cam: [[0.4, 7.8, 6.4], [0.6, 0, 0.3]],
    values: { t: "yankari" }, controls: [{ type: "select", key: "t", label: "Tourist centre", options: TOUR.map((x) => [x[0], x[1]]) }],
    build(S, s) { const g = BK.group(S, s); s.map = GK.mapPlane({ bbox: WA, size: 9, geo: [{ path: "maps/westafrica_countries_10m.geojson", col: 0x222222, op: 0.8 }] }); g.add(s.map); s.P = s.map.P; s.pins = {}; TOUR.forEach(([id, , la, lo]) => { const p = GK.pin(0xffb03a, 0.3); p.position.set(s.P.x(lo), 0, s.P.z(la)); g.add(p); s.pins[id] = p; }); },
    update(S, s, c) { if (!s.pins) return; Object.entries(s.pins).forEach(([id, p]) => { const on = id === c.t; p.scale.setScalar(on ? 1.6 : 1); p.children[1].material.color.setHex(on ? 0x37d67a : 0xffb03a); }); },
    labels: (s, c) => { if (!s.P) return []; const R = TOUR.find((x) => x[0] === c.t); return [{ id: "t", p: [s.P.x(R[3]), 0.5, s.P.z(R[2])], t: R[1], col: "#9fe8b0", dy: -30 }]; },
    hud: (s, c) => { const R = TOUR.find((x) => x[0] === c.t); return [{ title: R[1], lines: [[R[4], "#ffd27a", true], "—", "Attractions: wildlife parks, beaches, highlands, waterfalls, historic sites, festivals (Argungu, Osun-Osogbo, Durbar, Homowo), arts and crafts.", "Importance: foreign exchange, jobs, development of infrastructure, preservation of culture and wildlife, revenue for government.", "Problems: poor roads and facilities, insecurity, high cost, lack of publicity, pollution and damage to sites, cultural erosion."] }]; },
    story: TOUR.slice(0, 7).map((R) => ({ d: 5, title: R[1], cap: R[1] + " — " + R[4], set: { t: R[0] } })),
    draw: GK.fallback("Tourism", TOUR.map((R) => R[1])),
  });

  /* ===================== FW  Field work ===================== */
  const LU = [["Forest", 0x1f7a3a], ["Farmland", 0xf2c94c], ["Plantation", 0x7ac043], ["Settlement", 0xd0021b], ["Grassland / scrub", 0xb0a060], ["Water", 0x2f78c0]];
  const luAt = (x, z) => { const O = GK.okeho; if (!O) return 4; const m = O.hm(x, z); if (m < 1) return 5; if (Math.hypot(x - 0.75, z - 1.75) < 0.5 || (Math.abs(z - 1.98) < 0.15 && x < -2.2 && x > -4.5)) return 3; if (Math.hypot((x - 3.0) / 1.3, (z + 2.3) / 0.9) < 1 && m > 330) return 0; if (x > 1.6 && x < 2.9 && z > -0.3 && z < 0.9) return 2; if (m < 160 && z > 0.5) return 1; return 4; };
  GK.def3d("FW-a", {
    title: "Field work: land use survey",
    blurb: "Students survey Okeho, recording the land use in every grid square. Switch on the survey map and read the results.",
    envOpts: OUT, cam: [[3.2, 7.4, 9.0], [0.6, 0, 0.4]],
    values: { grid: 1 }, controls: [{ type: "toggle", key: "grid", label: "Show survey results (land use map)" }],
    build(S, s) { const T3 = T(), g = BK.group(S, s), O = GK.okeho; if (!O) return; g.add(GK.terrain({ w: 10, d: 8, nx: 160, h: O.Y, tint: (hn, sl, x, z) => GK.tintSavanna(hn, sl, x, z) })); const sea = GK.water(16, 6, 0x2a6f8f, 0.9); sea.position.set(0, 0.001, 6.4); g.add(sea); s.cells = new T3.Group(); g.add(s.cells); s.count = [0, 0, 0, 0, 0, 0]; for (let i = 0; i < 20; i++) for (let j = 0; j < 16; j++) { const x = -5 + 0.25 + i * 0.5, z = -4 + 0.25 + j * 0.5, k = luAt(x, z); s.count[k]++; const m = new T3.Mesh(new T3.PlaneGeometry(0.48, 0.48), new T3.MeshBasicMaterial({ color: LU[k][1], transparent: true, opacity: 0.55, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, Math.max(O.Y(x, z), 0) + 0.04, z); s.cells.add(m); } const sv = BK.rng(1); for (let i = 0; i < 6; i++) { const st = BK.person ? null : null; void st; } },
    update(S, s, c) { if (s.cells) s.cells.visible = !!c.grid; },
    overlay(ctx, s, c, S, B) { if (!s.count) return; const x0 = 12, y0 = GK.storyOn ? 196 : 262, tot = s.count.reduce((a, b) => a + b, 0); B.panel(x0, y0, 250, 126); ctx.fillStyle = "#cfe0f5"; ctx.font = "700 10px 'IBM Plex Sans',sans-serif"; ctx.fillText("LAND USE (% of grid squares)", x0 + 10, y0 + 16); let a = -Math.PI / 2; const cx = x0 + 60, cy = y0 + 72; s.count.forEach((n, k) => { const da = n / tot * Math.PI * 2; ctx.fillStyle = "#" + LU[k][1].toString(16).padStart(6, "0"); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 44, a, a + da); ctx.fill(); a += da; }); s.count.forEach((n, k) => { ctx.fillStyle = "#" + LU[k][1].toString(16).padStart(6, "0"); ctx.fillRect(x0 + 118, y0 + 28 + k * 15, 9, 9); ctx.fillStyle = "#e8f1ff"; ctx.font = "9.5px 'IBM Plex Sans',sans-serif"; ctx.fillText(LU[k][0] + " " + Math.round(n / tot * 100) + "%", x0 + 132, y0 + 37 + k * 15); }); },
    hud: () => [{ title: "Land use survey", lines: [["Method: divide the area into grid squares, visit each one, record the main land use on a field sheet, then shade a land-use map with a key and draw a pie chart or bar graph.", "#ffd27a", true], "Steps in any field work: choose topic and aim → plan (maps, equipment, permission) → collect data (observation, measurement, questionnaire, interview, sketching, photographs) → process and present (maps, graphs, tables) → analyse and conclude → write the report.", "Equipment: base map, field notebook, compass, measuring tape, GPS or phone, camera."] }],
    story: [{ d: 6, cap: "The class divides the map of Okeho into grid squares and shares them out.", set: { grid: 0 } }, { d: 6, cap: "In each square they record the main land use: forest, farmland, plantation, settlement, grassland or water.", set: { grid: 1 } }, { d: 6, cap: "The results are shaded on a land-use map and summarised in a pie chart." }],
    draw: GK.fallback("Land use survey", ["Grid squares → record land use → map and pie chart"]),
  });

  const GOODS = [["Yam (tuber)", 1500, "Benue"], ["Tomatoes (basket)", 25000, "Kano / Jos"], ["Rice (50 kg bag)", 75000, "Kebbi / imported"], ["Palm oil (litre)", 2200, "Local farms"], ["Fish (smoked, kg)", 6000, "Lagos lagoon"], ["Cloth (6 yards)", 18000, "Kano / imported"], ["Plastic bucket", 2500, "Lagos factory"]];
  GK.def3d("FW-b", {
    title: "Field work: market survey",
    blurb: "A periodic market. Students record what is sold, the prices and where goods come from. Pick a stall.",
    envOpts: OUT, cam: [[3.0, 3.0, 5.6], [0, 0.2, 0]],
    values: { g: 0 }, controls: [{ type: "select", key: "g", label: "Stall / commodity", options: GOODS.map((x, i) => [i, x[0]]) }],
    build(S, s) { const T3 = T(), g = BK.group(S, s), ground = new T3.Mesh(new T3.CircleGeometry(6, 40), mat(0xa48a62)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground); s.st = []; GOODS.forEach((G2, i) => { const a = i / GOODS.length * 6.283, x = Math.cos(a) * 1.8, z = Math.sin(a) * 1.4; const tab = new T3.Mesh(new T3.BoxGeometry(0.6, 0.05, 0.4), mat(0x8a6a4a)); tab.position.set(x, 0.4, z); g.add(tab); [[-0.27, -0.17], [0.27, -0.17], [-0.27, 0.17], [0.27, 0.17]].forEach(([dx, dz]) => { const l = new T3.Mesh(new T3.BoxGeometry(0.03, 0.8, 0.03), mat(0x6a4a30)); l.position.set(x + dx, 0.4 + (dz < 0 ? 0.2 : 0), z + dz); g.add(l); }); const roof = new T3.Mesh(new T3.BoxGeometry(0.75, 0.03, 0.55), mat([0xc0392b, 0x2a6ad8, 0xe0a020, 0x3a9a5a][i % 4])); roof.position.set(x, 0.92, z); roof.rotation.x = 0.15; g.add(roof); for (let k = 0; k < 6; k++) { const it = new T3.Mesh(new T3.SphereGeometry(0.05, 8, 6), mat([0x8a5a2a, 0xd0302a, 0xf0f0e0, 0xd0a020, 0x6a4a2a, 0x9a2a8a, 0x2a8ad8][i])); it.position.set(x - 0.2 + (k % 3) * 0.2, 0.47, z - 0.08 + Math.floor(k / 3) * 0.16); g.add(it); } s.st.push([x, z]); }); },
    labels: (s, c) => (s.st || []).map(([x, z], i) => ({ id: "s" + i, p: [x, 1.0, z], t: GOODS[i][0], col: i === +c.g ? "#ffd27a" : "#e8f1ff" })),
    overlay(ctx, s, c, S, B) { const x0 = 12, y0 = GK.storyOn ? 180 : 246, w = 280, h = 142; B.panel(x0, y0, w, h); ctx.fillStyle = "#cfe0f5"; ctx.font = "700 10px 'IBM Plex Sans',sans-serif"; ctx.fillText("FIELD SHEET (illustrative prices, ₦)", x0 + 10, y0 + 15); GOODS.forEach(([n, p, o], i) => { ctx.fillStyle = i === +c.g ? "#ffd27a" : "#e8f1ff"; ctx.font = (i === +c.g ? "700 " : "") + "9.5px 'IBM Plex Sans',sans-serif"; ctx.fillText(n, x0 + 10, y0 + 32 + i * 15); ctx.fillText(p.toLocaleString("en-GB"), x0 + 140, y0 + 32 + i * 15); ctx.fillText(o, x0 + 196, y0 + 32 + i * 15); }); },
    hud: (s, c) => { const G2 = GOODS[c.g]; return [{ title: G2[0], lines: [["Comes from: " + G2[2] + ". Students record price, quantity, source and seller's origin.", "#ffd27a", true], "Aim examples: what goods are sold and where they come from; the market's sphere of influence; price changes between market days.", "Methods: observation, counting stalls, questionnaires and interviews with traders and buyers; present as tables, bar graphs and flow maps of where goods come from."] }]; },
    draw: GK.fallback("Market survey", GOODS.map((x) => x[0] + " — " + x[2])),
  });

  const VT = [["Cars", 0xc0392b], ["Buses", 0xe0a020], ["Lorries", 0x2a6ad8], ["Motorcycles", 0x2a2a2a]];
  GK.def3d("FW-c", {
    title: "Field work: traffic flow survey",
    blurb: "Students stand at a road junction and tally vehicles passing in each direction. The counts build up live — then present them as a flow diagram.",
    envOpts: OUT, cam: [[3.4, 4.0, 5.6], [0, 0, 0]],
    values: { run: 1 }, controls: [{ type: "toggle", key: "run", label: "Traffic moving" }],
    build(S, s) { const T3 = T(), g = BK.group(S, s), ground = new T3.Mesh(new T3.PlaneGeometry(12, 10), mat(0x5c7d34)); ground.rotation.x = -Math.PI / 2; g.add(ground); [[12, 0.8, 0], [0.8, 10, Math.PI / 2]].forEach(([w, d]) => { const r = new T3.Mesh(new T3.PlaneGeometry(w, d), mat(0x3a3a3a)); r.rotation.x = -Math.PI / 2; r.position.y = 0.005; g.add(r); }); s.cars = []; const rr = BK.rng(6); for (let i = 0; i < 18; i++) { const k = Math.floor(rr() * 4), m = k === 2 ? truck(VT[k][1], 0.13) : k === 3 ? car(VT[k][1], 0.06) : car(VT[k][1], k === 1 ? 0.16 : 0.11); g.add(m); s.cars.push({ m, k, dir: i % 4, t: rr(), sp: 0.06 + rr() * 0.04 }); } s.tally = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]; const st = GK.pin(0xffd23a, 0.4); st.position.set(0.8, 0, 0.8); g.add(st); },
    update(S, s, c, dt) { s.cars.forEach((v) => { if (c.run) { const t0 = v.t; v.t = (v.t + dt * v.sp) % 1; if (t0 < 0.5 && v.t >= 0.5) s.tally[v.dir][v.k]++; } const u = v.t * 12 - 6, L = 0.2; const pos = [[u, 0, L], [-u, 0, -L], [L * -1, 0, u * 0.8], [L, 0, -u * 0.8]][v.dir]; v.m.position.set(pos[0], 0.01, pos[2]); v.m.rotation.y = [0, Math.PI, -Math.PI / 2, Math.PI / 2][v.dir]; }); },
    overlay(ctx, s, c, S, B) { if (!s.tally) return; const x0 = 12, y0 = GK.storyOn ? 196 : 262, w = 270, h = 126; B.panel(x0, y0, w, h); ctx.fillStyle = "#cfe0f5"; ctx.font = "700 10px 'IBM Plex Sans',sans-serif"; ctx.fillText("TALLY SHEET  (E-bound, W-bound, N-bound, S-bound)", x0 + 10, y0 + 15); ["E", "W", "N", "S"].forEach((d, i) => { ctx.fillStyle = "#e8f1ff"; ctx.font = "9.5px 'IBM Plex Sans',sans-serif"; ctx.fillText(d, x0 + 10, y0 + 36 + i * 20); VT.forEach(([n, col], k) => { const v = s.tally[i][k]; ctx.fillStyle = "#" + col.toString(16).padStart(6, "0"); ctx.fillRect(x0 + 26 + k * 60, y0 + 28 + i * 20, Math.min(50, v * 3), 10); ctx.fillStyle = "#e8f1ff"; ctx.fillText(String(v), x0 + 26 + k * 60 + Math.min(50, v * 3) + 2, y0 + 37 + i * 20); }); }); VT.forEach(([n], k) => { ctx.fillStyle = "#cfd8e8"; ctx.font = "8px 'IBM Plex Sans',sans-serif"; ctx.fillText(n, x0 + 26 + k * 60, y0 + h - 6); }); },
    hud: (s) => { const tot = s.tally ? s.tally.flat().reduce((a, b) => a + b, 0) : 0; return [{ title: "Traffic count: " + tot + " vehicles so far", lines: [["Method: stand safely at a junction, use a tally sheet (||||) for each vehicle type and direction, count for fixed periods (e.g. 15 minutes) at different times of day.", "#ffd27a", true], "Present results as a traffic flow diagram (band width proportional to the number of vehicles), bar graphs and tables; identify rush hours and the busiest direction.", "Uses: planning roads, traffic lights, bus stops and parking."] }]; },
    draw: GK.fallback("Traffic survey", ["Tally by vehicle type and direction", "Flow diagram: width ∝ number of vehicles"]),
  });

  GK.def3d("FW-d", {
    title: "Field work: patterns of journey to work",
    blurb: "Where do Okeho's workers live, and how do they travel? Desire lines join homes to workplaces — thicker lines mean more people.",
    envOpts: OUT, cam: [[3.2, 7.0, 8.8], [0.6, 0, 0.4]],
    build(S, s) { const g = BK.group(S, s), O = GK.okeho; if (!O) return; g.add(GK.terrain({ w: 10, d: 8, nx: 140, h: O.Y, tint: GK.tintSavanna })); const sea = GK.water(16, 6, 0x2a6f8f, 0.9); sea.position.set(0, 0.001, 6.4); g.add(sea); s.flows = [["Ilu village", -3.6, 2.0, 40], ["Farmsteads", -3.6, 2.7, 12], ["Plateau villages", 2.6, -2.1, 18], ["Coast fishing camp", -1.0, 3.3, 10], ["Hill villages", 3.4, 1.8, 22]]; const wp = [0.75, O.Y(0.75, 1.75) + 0.1, 1.75]; s.flows.forEach(([, x, z, n]) => { const a = [x, Math.max(0, O.Y(x, z)) + 0.1, z], mid = [(a[0] + wp[0]) / 2, Math.max(a[1], wp[1]) + 0.6, (a[2] + wp[2]) / 2], P = []; for (let i = 0; i <= 20; i++) { const t = i / 20; P.push([a[0] * (1 - t) ** 2 + 2 * mid[0] * t * (1 - t) + wp[0] * t * t, a[1] * (1 - t) ** 2 + 2 * mid[1] * t * (1 - t) + wp[1] * t * t, a[2] * (1 - t) ** 2 + 2 * mid[2] * t * (1 - t) + wp[2] * t * t]); } g.add(GK.line(P, 0xffb03a, 0.006 + n / 1500)); const p = GK.pin(0x2a6ad8, 0.3); p.position.set(x, Math.max(0, O.Y(x, z)), z); g.add(p); }); const fct = factory(0.2); fct.position.set(1.1, O.Y(1.1, 1.9), 1.9); g.add(fct); },
    labels: (s) => (s.flows ? s.flows.map(([n, x, z, k]) => ({ id: n, p: [x, Math.max(0, GK.okeho.Y(x, z)) + 0.35, z], t: n + " · " + k + " workers", col: "#e8f1ff" })).concat([{ id: "w", p: [0.75, GK.okeho.Y(0.75, 1.75) + 0.4, 1.75], t: "Okeho town — workplaces", col: "#ffd27a" }]) : []),
    overlay(ctx, s, c, S, B) { const modes = [["Walking", 28, "#9fe8b0"], ["Okada (motorcycle)", 34, "#ffb03a"], ["Bus / taxi", 24, "#4aa8ff"], ["Car", 9, "#ff6a5a"], ["Bicycle", 5, "#d0d0d0"]], x0 = 12, y0 = GK.storyOn ? 214 : 278, w = 236, h = 110; B.panel(x0, y0, w, h); ctx.fillStyle = "#cfe0f5"; ctx.font = "700 10px 'IBM Plex Sans',sans-serif"; ctx.fillText("MODE OF TRAVEL (% of workers)", x0 + 10, y0 + 15); modes.forEach(([n, p, col], i) => { ctx.fillStyle = col; ctx.fillRect(x0 + 110, y0 + 24 + i * 16, p * 3, 11); ctx.fillStyle = "#e8f1ff"; ctx.font = "9.5px 'IBM Plex Sans',sans-serif"; ctx.fillText(n, x0 + 10, y0 + 33 + i * 16); ctx.fillText(p + "%", x0 + 114 + p * 3, y0 + 33 + i * 16); }); },
    hud: () => [{ title: "Journey to work", lines: [["Method: questionnaire to workers — where they live, how they travel, time and cost of the journey. Present as desire-line maps, bar graphs and pie charts.", "#ffd27a", true], "Findings usually show: most workers come from nearby villages; long journeys cost more time and money; motorcycles and buses dominate; congestion at peak hours.", "Uses: planning transport routes, housing and siting of workplaces."] }],
    draw: GK.fallback("Journey to work", ["Desire lines join homes to workplaces", "Questionnaire: origin, mode, time, cost"]),
  });

  GK.def3d("FW-e", {
    title: "Field work: rate of erosion in the locality",
    blurb: "Measuring pegs hammered into a bare slope show how much soil is lost. Drag the months forward and read the pegs.",
    envOpts: OUT, cam: [[3.4, 2.6, 4.8], [0, 0.4, 0]],
    values: { mo: 6 }, controls: [{ type: "slider", key: "mo", label: "Months since pegs were placed", min: 0, max: 12, step: 1 }],
    build(S, s) { s.k = -1; },
    update(S, s, c) { if (s.k === c.mo) return; s.k = c.mo; const T3 = T(), g = BK.group(S, s), loss = c.mo * 0.004, h = (x, z) => 0.1 + Math.max(0, -x + 2) * 0.32 - loss * (1 + Math.max(0, -x + 2) * 0.5) - 0.05 * Math.exp(-((z / 0.15) ** 2)) * (c.mo / 12) + (BK.fbm(x * 2, z * 2, 5) - 0.5) * 0.03; g.add(GK.block({ w: 4, d: 3, h, strata: (x, y, z, yt) => (y > yt - 0.1 ? hex3(0x8a5a32) : hex3(0xb8803a)), tint: () => hex3(0xa4683a), nx: 90, ny: 30 })); s.pegs = []; [-1.2, -0.2, 0.8].forEach((x, i) => { const y0 = 0.1 + Math.max(0, -x + 2) * 0.32, hy = h(x, 0.6); const peg = new T3.Mesh(new T3.CylinderGeometry(0.02, 0.02, 0.5, 8), mat(0xe8e0d0)); peg.position.set(x, y0 - 0.25 + 0.15, 0.6); g.add(peg); for (let k = 0; k < 10; k++) { const tick = new T3.Mesh(new T3.BoxGeometry(0.05, 0.004, 0.005), mat(k % 5 ? 0x333333 : 0xd0021b)); tick.position.set(x, y0 + 0.15 - k * 0.02, 0.62); g.add(tick); } s.pegs.push([x, hy, y0 - hy]); }); },
    labels: (s) => (s.pegs || []).map(([x, y, d], i) => ({ id: "p" + i, p: [x, y + 0.3, 0.6], t: "Peg " + (i + 1) + ": " + Math.round(d * 1000 / 3) + " mm exposed", col: "#ffd27a" })),
    hud: (s, c) => { const m = s.pegs ? s.pegs.reduce((a, p) => a + p[2], 0) / 3 * 1000 / 3 : 0; return [{ title: c.mo + " months", lines: [["Mean soil lowering ≈ " + f(m, 1) + " mm → rate ≈ " + (c.mo ? f(m / c.mo * 12, 0) : "0") + " mm per year", "#ffd27a", true], "Method: drive marked pegs into the slope, record the exposed length at intervals, average the readings; compare slopes with and without vegetation, steep and gentle slopes.", "Also observe rills and gullies, exposed roots, deposits at the foot of the slope."] }]; },
    draw: GK.fallback("Rate of erosion", ["Pegs show soil lost over time", "Rate = mean lowering ÷ time"]),
  });

  /* ===================== GIS-a  GIS concepts and components ===================== */
  GK.def3d("GIS-a", {
    title: "GIS: concepts and components",
    blurb: "A Geographic Information System stores geographic data in layers that line up on the same coordinates. Pull the layers apart to see them separately, then stack them to analyse.",
    envOpts: Object.assign({}, OUT, { fog: false }), cam: [[7.4, 5.6, 8.6], [0, 1.6, 0]],
    values: { spread: 0.8 }, controls: [{ type: "slider", key: "spread", label: "Separate the layers", min: 0, max: 1, step: 0.02 }],
    build(S, s) {
      const T3 = T(), g = BK.group(S, s), O = GK.okeho; if (!O) return; s.layers = [];
      const mk = (draw, name) => { const c = BK.cv(512, 410), x = c.getContext("2d"); draw(x, c); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; const m = new T3.Mesh(new T3.PlaneGeometry(5, 4), new T3.MeshStandardMaterial({ map: t, transparent: true, side: T3.DoubleSide, roughness: 0.8 })); m.rotation.x = -Math.PI / 2; g.add(m); s.layers.push([m, name]); };
      const X = (x) => (x + 5) / 10 * 512, Z = (z) => (z + 4) / 8 * 410;
      mk((x) => { for (let i = 0; i < 64; i++) for (let j = 0; j < 52; j++) { const wx = -5 + i / 6.4, wz = -4 + j / 6.5, m = O.hm(wx, wz), c = m < 1 ? [80, 140, 180] : [90 + m * 0.2, 120 + m * 0.12, 60]; x.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; x.fillRect(i * 8, j * 8, 8.5, 8.5); } }, "Raster: satellite image / elevation");
      mk((x) => { GK.contourSegs(O.hm, -5, -4, 5, 4, 90, 40).forEach((sg) => { x.strokeStyle = "rgba(150,80,30,1)"; x.lineWidth = 1.2; x.beginPath(); x.moveTo(X(sg[0]), Z(sg[1])); x.lineTo(X(sg[2]), Z(sg[3])); x.stroke(); }); }, "Contours (lines)");
      mk((x) => { x.strokeStyle = "#2f74b5"; x.lineWidth = 4; x.beginPath(); O.RIVER.forEach(([a, b], i) => (i ? x.lineTo(X(a), Z(b)) : x.moveTo(X(a), Z(b)))); x.stroke(); x.strokeStyle = "#e0442e"; x.lineWidth = 5; x.beginPath(); [[-5, 1.9], [-1.8, 1.75], [0.6, 1.62], [2.8, 2.3], [5, 2.5]].forEach(([a, b], i) => (i ? x.lineTo(X(a), Z(b)) : x.moveTo(X(a), Z(b)))); x.stroke(); }, "Vector lines: rivers and roads");
      mk((x) => { [[0.75, 1.75, 18], [-3.4, 2.0, 9], [-3.6, 2.6, 5], [2.6, -2.1, 7]].forEach(([a, b, r]) => { x.fillStyle = "#d0021b"; x.beginPath(); x.arc(X(a), Z(b), r, 0, 6.3); x.fill(); }); x.fillStyle = "rgba(31,122,58,.5)"; x.beginPath(); x.ellipse(X(3), Z(-2.3), 70, 50, 0, 0, 6.3); x.fill(); }, "Vector points and polygons: settlements, forest reserve");
    },
    update(S, s, c) { if (!s.layers) return; s.layers.forEach(([m], i) => { m.position.y = 0.2 + i * (0.04 + c.spread * 1.1); m.material.opacity = i === 0 ? 1 : 0.95; }); },
    labels: (s, c) => (s.layers || []).map(([m, n], i) => ({ id: "L" + i, p: [2.6, m.position.y, -2.0], t: (i + 1) + ". " + n, col: "#ffe7a8", dx: 40 })),
    hud: () => [{ title: "What is a GIS?", lines: [["A computer system for capturing, storing, analysing and displaying data linked to locations on the earth's surface.", "#ffd27a", true], "Components: hardware (computers, GPS, scanners), software (QGIS, ArcGIS), data (spatial + attribute), people, methods/procedures.", "Data models: raster (grid of cells — images, elevation) and vector (points, lines, polygons).", "Functions: data capture, storage, query, overlay analysis, buffering, map production."] }],
    story: [{ d: 6, cap: "A GIS keeps each kind of geographic data in its own layer, all lined up on the same coordinates.", tween: { spread: [0, 0.9] } }, { d: 6, cap: "Raster data is a grid of cells such as a satellite image; vector data uses points, lines and polygons.", hl: "L0" }, { d: 6, cap: "Stacking the layers (overlay) lets us ask questions — e.g. which settlements are within 1 km of the river?", tween: { spread: [0.9, 0] } }],
    draw: GK.fallback("GIS", ["Layers on common coordinates", "Raster vs vector data", "Hardware, software, data, people, methods"]),
  });

  /* ===================== GIS-b  Sources of data, uses and problems ===================== */
  GK.tour("GIS-b", {
    title: "GIS: sources of data, uses and problems",
    blurb: "Where does GIS data come from? Satellites, GPS, aerial photographs, drones and field surveys — shown orbiting and flying over the earth.",
    envOpts: { bgColor: 0x02040b, fog: false, hemi: 0.2, sun: 3, sunPos: [10, 6, 20], shadow: false, envI: 0.15, hdri: "dikhololo_night" }, cam: [[0, 1.6, 8.6], [0.8, 0.4, 0]], fly: [0.6, 0.6, 2.6],
    build(g, S, s) {
      const T3 = T(); g.add(GK.stars()); s.gl = GK.globe(2); g.add(s.gl);
      const sat = (col) => { const q = new T3.Group(); const b = new T3.Mesh(new T3.BoxGeometry(0.12, 0.12, 0.2), mat(0xd0c080, { metalness: 0.7, roughness: 0.3 })); q.add(b); [-1, 1].forEach((sd) => { const p = new T3.Mesh(new T3.BoxGeometry(0.35, 0.01, 0.12), mat(col, { metalness: 0.4, roughness: 0.3 })); p.position.x = sd * 0.25; q.add(p); }); return q; };
      s.rs = sat(0x1a3a8a); s.gps = [sat(0x3a3a3a), sat(0x3a3a3a), sat(0x3a3a3a)]; g.add(s.rs); s.gps.forEach((q) => g.add(q));
      s.cone = new T3.Mesh(new T3.ConeGeometry(0.35, 0.8, 24, 1, true), new T3.MeshBasicMaterial({ color: 0x7fd6ff, transparent: true, opacity: 0.18, side: T3.DoubleSide, depthWrite: false })); g.add(s.cone);
      s.drone = plane(0.18); g.add(s.drone);
    },
    tick(S, s, c, dt) { if (!s.gl) return; const t = performance.now() / 1000; s.gl.setSun(S, V(0.4, 0.3, 1)); s.gl.earth.rotation.y += dt * 0.03; const a = t * 0.3; s.rs.position.set(Math.cos(a) * 2.7, Math.sin(a) * 2.7 * 0.3, Math.sin(a) * 2.7 * 0.95); s.rs.lookAt(0, 0, 0); const d = s.rs.position.clone().normalize(); s.cone.position.copy(d.clone().multiplyScalar(2.3)); s.cone.quaternion.setFromUnitVectors(V(0, 1, 0), d); s.gps.forEach((q, i) => { const b = t * 0.12 + i * 2.1; q.position.set(Math.cos(b) * 3.6, Math.sin(b + i) * 1.6, Math.sin(b) * 3.6); }); const k = t * 0.5; s.drone.position.set(1.3 + Math.cos(k) * 0.25, 1.3, 1.1 + Math.sin(k) * 0.25); s.drone.rotation.y = -k; },
    feats: [
      { id: "rs", n: "Remote sensing satellites", p: [2.4, 0.6, 1.0], d: "Satellites (Landsat, Sentinel, Nigeria's NigeriaSat) record images of the earth's surface — land use, vegetation, floods, urban growth." },
      { id: "gps", n: "GPS (global navigation) satellites", p: [3.2, 1.4, 0], d: "Signals from several satellites let a receiver work out its exact position (latitude, longitude, height)." },
      { id: "drone", n: "Aerial photographs and drones", p: [1.3, 1.5, 1.1], d: "Photographs from aircraft and drones give detailed images for mapping towns, farms and roads." },
      { id: "field", n: "Field surveys and records", p: [0.5, 0.4, 2.0], d: "Ground surveys, censuses, questionnaires, existing paper maps (digitised) and statistical records." },
    ],
    notes: ["Uses: urban and regional planning, agriculture and food security, environmental monitoring (deforestation, erosion, oil spills), disaster management (floods), election mapping and census, transport routing, health (mapping disease outbreaks), security, mineral exploration.", "Problems in West Africa: high cost of hardware and software, shortage of trained people, unreliable power and internet, poor or outdated data, data security."],
  });

  /* ===================== SV-a  Chain survey ===================== */
  GK.def3d("SV-a", {
    title: "Chain survey",
    blurb: "Surveyors measure a straight chain line across a plot, then measure offsets at right angles to each feature. The field book records the readings that are later plotted to scale.",
    envOpts: OUT, cam: [[3.4, 4.6, 6.4], [0, 0, 0]],
    values: { k: 3 }, controls: [{ type: "slider", key: "k", label: "Offset reading", min: 0, max: 5, step: 1, fmt: (v) => ["Start A", "Tree", "Hut", "Well", "Path", "End B"][v] }],
    build(S, s) { const T3 = T(), g = BK.group(S, s), gr = new T3.Mesh(new T3.PlaneGeometry(10, 8), mat(0x6a8a3a)); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; g.add(gr); s.OFF = [[0, 0, "A (station)"], [1.2, 1.1, "Tree"], [2.4, -0.9, "Hut"], [3.4, 0.7, "Well"], [4.4, -1.3, "Path"], [5.4, 0, "B (station)"]]; g.add(GK.line([[-2.7, 0.02, 0], [2.7, 0.02, 0]], 0xd0a020, 0.012)); const r = (x, z, col) => { const p = new T3.Mesh(new T3.CylinderGeometry(0.02, 0.02, 0.8, 8), mat(col)); p.position.set(x, 0.4, z); g.add(p); }; r(-2.7, 0, 0xd0021b); r(2.7, 0, 0xd0021b); const tr = GK.tree(0.6, 2); tr.position.set(-1.5, 0, -1.1); g.add(tr); const hut = GK.hut(0.15); hut.position.set(-0.3, 0, 0.9); g.add(hut); const well = new T3.Mesh(new T3.CylinderGeometry(0.12, 0.12, 0.15, 16), mat(0x9a9a9a)); well.position.set(0.7, 0.07, -0.7); g.add(well); g.add(GK.line([[1.2, 0.01, 1.3], [2.4, 0.01, 1.6]], 0xc8a878, 0.03)); s.dyn = new T3.Group(); g.add(s.dyn); s.k = -1; },
    update(S, s, c) { if (s.k === c.k) return; s.k = c.k; BK.dispose(S, s.dyn); s.dyn = new (T().Group)(); s.g.add(s.dyn); const [ch, of] = s.OFF[c.k], x = -2.7 + ch; s.dyn.add(GK.line([[x, 0.03, 0], [x, 0.03, -of]], 0x37d67a, 0.012)); const p = GK.pin(0x37d67a, 0.3); p.position.set(x, 0, 0); s.dyn.add(p); },
    overlay(ctx, s, c, S, B) { const x0 = 12, y0 = GK.storyOn ? 168 : 232, w = 200, h = 156; B.panel(x0, y0, w, h); ctx.fillStyle = "#cfe0f5"; ctx.font = "700 10px 'IBM Plex Sans',sans-serif"; ctx.fillText("FIELD BOOK (×10 m)", x0 + 10, y0 + 15); ctx.strokeStyle = "#ffd27a"; ctx.beginPath(); ctx.moveTo(x0 + 100, y0 + 24); ctx.lineTo(x0 + 100, y0 + h - 8); ctx.moveTo(x0 + 114, y0 + 24); ctx.lineTo(x0 + 114, y0 + h - 8); ctx.stroke(); s.OFF.slice().reverse().forEach(([ch, of, n], j) => { const i = 5 - j, y = y0 + 36 + j * 20; ctx.fillStyle = i === c.k ? "#ffd27a" : "#e8f1ff"; ctx.font = (i === c.k ? "700 " : "") + "9.5px 'IBM Plex Sans',sans-serif"; ctx.fillText(f(ch * 10, 0), x0 + 100, y); if (of > 0) ctx.fillText(n + " " + f(of * 10, 0), x0 + 120, y); else if (of < 0) ctx.fillText(n + " " + f(-of * 10, 0), x0 + 10, y); else ctx.fillText(n, x0 + 120, y); }); },
    labels: (s, c) => (s.OFF ? [{ id: "line", p: [0, 0.1, 0], t: "Chain line A → B", col: "#ffe08a", dy: 30 }, { id: "off", p: [-2.7 + s.OFF[c.k][0], 0.4, -s.OFF[c.k][1] / 2], t: "Offset to " + s.OFF[c.k][2] + ": " + f(Math.abs(s.OFF[c.k][1]) * 10, 0) + " m", col: "#9fe8b0" }] : []),
    hud: (s, c) => [{ title: "Chain survey", lines: [["Chainage " + (s.OFF ? f(s.OFF[c.k][0] * 10, 0) : 0) + " m along the chain line; offset measured at right angles to the feature.", "#ffd27a", true], "Equipment: chain (20 m or 30 m) or tape, arrows, ranging poles, offset rod, field book, cross-staff or optical square.", "Procedure: reconnaissance, fix stations, range the line, chain, measure offsets, record in the field book (read from the bottom up), then plot to scale.", "Suitable for small, fairly flat, open areas. Errors: sagging chain, wrong ranging, misreading."] }],
    draw: GK.fallback("Chain survey", ["Chain line with stations", "Offsets at right angles", "Field book read from bottom upwards"]),
  });

  /* ===================== SV-b  Prismatic compass traverse ===================== */
  GK.def3d("SV-b", {
    title: "Prismatic compass traverse",
    blurb: "A closed traverse around a school compound: at each station the surveyor takes a forward bearing to the next station and measures the distance. Errors show up when the traverse fails to close.",
    envOpts: OUT, cam: [[2.4, 6.4, 6.4], [0, 0, 0]],
    values: { err: 0, st: 1 }, controls: [{ type: "slider", key: "err", label: "Bearing error at each station", min: 0, max: 3, step: 0.5, fmt: (v) => v + "°" }, { type: "slider", key: "st", label: "Station", min: 1, max: 5, step: 1, fmt: (v) => "ABCDE"[v - 1] }],
    build(S, s) { const T3 = T(), g = BK.group(S, s), gr = new T3.Mesh(new T3.PlaneGeometry(10, 8), mat(0x6a8a3a)); gr.rotation.x = -Math.PI / 2; g.add(gr); const b = new T3.Mesh(new T3.BoxGeometry(1.4, 0.4, 0.6), mat(0xe8dcc8)); b.position.set(0, 0.2, 0); g.add(b); s.dyn = new T3.Group(); g.add(s.dyn); s.k = ""; },
    update(S, s, c) { const key = c.err + "|" + c.st; if (s.k === key) return; s.k = key; BK.dispose(S, s.dyn); s.dyn = new (T().Group)(); s.g.add(s.dyn); const STN = [[-2.0, 1.2], [-1.0, -1.4], [1.6, -1.6], [2.4, 0.8], [0.2, 2.0]], L = STN.map(([ax, az], i) => { const [bx, bz] = STN[(i + 1) % 5]; return [Math.round((Math.atan2(bx - ax, -(bz - az)) * 180 / Math.PI + 360) % 360), Math.hypot(bx - ax, bz - az)]; }); let x = -2.0, z = 1.2; const P = [[x, z]]; s.legs = []; L.forEach(([b, d], i) => { const br = (i === 0 ? Math.atan2(STN[1][0] - STN[0][0], -(STN[1][1] - STN[0][1])) * 180 / Math.PI : b + (Math.atan2(STN[(i + 1) % 5][0] - STN[i][0], -(STN[(i + 1) % 5][1] - STN[i][1])) * 180 / Math.PI - b)) * Math.PI / 180 + c.err * (i + 1) * Math.PI / 180; const nx = x + Math.sin(br) * d, nz = z - Math.cos(br) * d; s.legs.push([b, d]); x = nx; z = nz; P.push([x, z]); }); s.P = P; s.dyn.add(GK.line(P.map(([a, b2]) => [a, 0.03, b2]), 0xffd23a, 0.015)); P.slice(0, 5).forEach(([a, b2], i) => { const p = GK.pin(i === c.st - 1 ? 0x37d67a : 0xd0021b, 0.35); p.position.set(a, 0, b2); s.dyn.add(p); }); s.close = Math.hypot(P[5][0] - P[0][0], P[5][1] - P[0][1]); if (s.close > 0.02) s.dyn.add(GK.line([[P[5][0], 0.05, P[5][1]], [P[0][0], 0.05, P[0][1]]], 0xff3a1a, 0.02)); const [sx, sz] = P[c.st - 1]; s.dyn.add(GK.polyline([[sx, 0.05, sz], [sx, 0.05, sz - 0.8]], 0xffffff, 1)); },
    labels: (s, c) => (s.P ? s.P.slice(0, 5).map(([x, z], i) => ({ id: "s" + i, p: [x, 0.4, z], t: "ABCDE"[i] + (i === c.st - 1 ? " — forward bearing " + String(s.legs[i][0]).padStart(3, "0") + "°, " + f(s.legs[i][1] * 10, 0) + " m" : ""), col: i === c.st - 1 ? "#5bd68c" : "#e8f1ff" })).concat(s.close > 0.02 ? [{ id: "ce", p: [s.P[5][0], 0.2, s.P[5][1]], t: "Closing error " + f(s.close * 10, 1) + " m", col: "#ff9a8a" }] : []) : []),
    hud: (s, c) => [{ title: "Station " + "ABCDE"[c.st - 1], lines: [[(s.legs ? "Forward bearing " + String(s.legs[c.st - 1][0]).padStart(3, "0") + "°, back bearing " + String((s.legs[c.st - 1][0] + 180) % 360).padStart(3, "0") + "°, distance " + f(s.legs[c.st - 1][1] * 10, 0) + " m." : ""), "#ffd27a", true], [c.err > 0 ? "With a " + c.err + "° error at every station the traverse does not close: closing error " + f((s.close || 0) * 10, 1) + " m." : "Without errors the traverse closes exactly at A.", c.err > 0 ? "#ff9a8a" : "#9fe8b0", true], "Equipment: prismatic compass, tripod, ranging poles, chain or tape, field book.", "Procedure: choose stations, take forward and back bearings (they should differ by 180°), measure each leg, plot to scale with a protractor, adjust the closing error (Bowditch method).", "Errors: local attraction from iron objects, misreading, instrument not level."] }],
    draw: GK.fallback("Compass traverse", ["Forward and back bearings differ by 180°", "Closed traverse returns to the start", "Closing error shows mistakes"]),
  });
})();
