/* g3d-climate.js — Weather (WX), Climate (CL), Climate change (CC), Environment (EN), Hydrosphere (HY), Vegetation (VG), Soil (SO). */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, GK = window.GK, f = MK.fmt;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const hex3 = (h) => GK.hex3(h), mix3 = (a, b, k) => GK.mix3(a, b, k);
  const G = (x, z, cx, cz, rx, rz) => Math.exp(-(((x - cx) / rx) ** 2) - (((z - cz) / rz) ** 2));
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mat = (color, o = {}) => new (T().MeshStandardMaterial)(Object.assign({ color, roughness: 0.85 }, o));
  const OUT = { hdri: "noon_grass", sky: true, sunPos: [6, 9, 5], shadowExtent: 6, fogNear: 30, fogFar: 90 };
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const FZ = 2.02;

  /* Approximate long-term monthly averages (°C, mm) for teaching. */
  const ST = {
    lagos: ["Lagos, Nigeria", 6.5, 3.4, [27.0, 28.0, 28.3, 28.1, 27.3, 26.0, 25.4, 25.3, 25.8, 26.5, 27.5, 27.4], [15, 40, 90, 150, 215, 350, 240, 80, 170, 180, 60, 20]],
    kano: ["Kano, Nigeria", 12.0, 8.5, [21.6, 24.5, 28.6, 31.5, 31.2, 28.8, 26.6, 25.5, 26.9, 27.7, 25.0, 22.3], [0, 0, 2, 8, 55, 110, 200, 280, 110, 12, 0, 0]],
    jos: ["Jos, Nigeria (1 200 m)", 9.9, 8.9, [21, 23, 25, 25, 23, 21, 20, 20, 21, 22, 22, 21], [3, 5, 25, 90, 190, 220, 320, 290, 210, 40, 3, 1]],
    accra: ["Accra, Ghana", 5.6, -0.2, [27.2, 28.0, 28.1, 27.9, 27.2, 26.1, 25.0, 24.9, 25.6, 26.5, 27.2, 27.3], [15, 25, 60, 80, 140, 190, 50, 15, 40, 65, 30, 15]],
    tamale: ["Tamale, Ghana", 9.4, -0.85, [27.5, 29.6, 30.8, 30.3, 28.6, 26.8, 25.9, 25.6, 26.0, 27.1, 27.6, 26.8], [3, 8, 40, 80, 110, 140, 140, 190, 220, 80, 8, 3]],
    freetown: ["Freetown, Sierra Leone", 8.5, -13.2, [26.9, 27.3, 27.6, 27.8, 27.4, 26.3, 25.2, 25.0, 25.6, 26.1, 26.8, 26.9], [8, 5, 15, 60, 180, 370, 800, 900, 560, 280, 120, 30]],
    monrovia: ["Monrovia, Liberia", 6.3, -10.8, [26.3, 26.8, 27.0, 27.0, 26.5, 25.3, 24.8, 25.0, 25.2, 25.7, 26.2, 26.3], [30, 60, 110, 190, 450, 950, 700, 400, 750, 650, 250, 90]],
    banjul: ["Banjul, The Gambia", 13.45, -16.6, [23.8, 25.0, 25.9, 25.4, 26.0, 27.3, 27.4, 27.0, 27.4, 27.6, 26.4, 24.5], [0, 0, 0, 0, 5, 60, 250, 350, 230, 70, 2, 0]],
  };
  GK.STATIONS = ST;
  const itd = (m) => 13.5 + 7.5 * Math.sin((m - 4.0) / 12 * 2 * Math.PI);   /* latitude of the ITD (m = month 0..12) */

  /* ---------- a small climograph (bars = rain, line = temperature) ---------- */
  function climograph(ctx, x0, y0, w, h, Tm, R, o = {}) {
    ctx.save(); ctx.fillStyle = o.bg || "rgba(14,20,34,.88)"; ctx.fillRect(x0, y0, w, h); ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.strokeRect(x0, y0, w, h);
    const px = x0 + 30, py = y0 + (o.title ? 20 : 8), pw = w - 60, ph = h - (o.title ? 38 : 26), rMax = Math.max(100, Math.ceil(Math.max(...R) / 100) * 100), tMin = 0, tMax = 40, bw = pw / 12;
    if (o.title) { ctx.fillStyle = "#e8f1ff"; ctx.font = "700 10px 'IBM Plex Sans',sans-serif"; ctx.fillText(o.title, x0 + 8, y0 + 13); }
    R.forEach((r, i) => { ctx.fillStyle = i === o.hi ? "#6ab8ff" : "#3a7ac0"; const bh = r / rMax * ph; ctx.fillRect(px + i * bw + 1.5, py + ph - bh, bw - 3, bh); });
    ctx.strokeStyle = "#ff6a4a"; ctx.lineWidth = 2; ctx.beginPath(); Tm.forEach((t, i) => { const X = px + (i + 0.5) * bw, Y = py + ph - (t - tMin) / (tMax - tMin) * ph; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
    ctx.fillStyle = "#cfd8e8"; ctx.font = "8px 'IBM Plex Sans',sans-serif"; MON.forEach((m, i) => ctx.fillText(m[0], px + i * bw + bw / 2 - 2, py + ph + 10));
    ctx.fillStyle = "#ff9a8a"; ctx.fillText("40°", x0 + 6, py + 6); ctx.fillText("0°", x0 + 10, py + ph); ctx.fillStyle = "#8fc0ff"; ctx.fillText(rMax + "", px + pw + 4, py + 6); ctx.fillText("mm", px + pw + 4, py + ph);
    ctx.restore();
  }
  GK.climograph = climograph;

  /* ===================== WX-a  Stevenson screen and weather instruments ===================== */
  GK.tour("WX-a", {
    title: "The weather station",
    blurb: "A school weather station: the Stevenson screen and the instruments used to measure each element of weather. Pick an instrument to zoom in; change the wind to see the vane and anemometer respond.",
    envOpts: OUT, cam: [[3.4, 2.4, 5.6], [0.2, 0.8, 0]], fly: [0.9, 0.5, 1.6],
    values: { wdir: 225, wspd: 0.5 },
    controls: [{ type: "slider", key: "wdir", label: "Wind blowing from", min: 0, max: 359, step: 1, fmt: (v) => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(v / 45) % 8] + " (" + v + "°)" }, { type: "slider", key: "wspd", label: "Wind speed", min: 0, max: 1, step: 0.05 }],
    build(g, S, s) {
      const T3 = T(), white = mat(0xf4f4f0, { roughness: 0.6 });
      const grass = new T3.Mesh(new T3.CircleGeometry(6, 48), mat(0x5c7d34)); grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; g.add(grass);
      const fence = []; for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; const p = new T3.Mesh(new T3.BoxGeometry(0.05, 0.6, 0.05), mat(0x8a6a4a)); p.position.set(Math.cos(a) * 3.2, 0.3, Math.sin(a) * 3.2); g.add(p); }
      const scr = new T3.Group(); scr.position.set(-1.2, 0, 0); g.add(scr);
      [[-0.3, -0.25], [0.3, -0.25], [-0.3, 0.25], [0.3, 0.25]].forEach(([x, z]) => { const l = new T3.Mesh(new T3.BoxGeometry(0.05, 1.2, 0.05), white); l.position.set(x, 0.6, z); scr.add(l); });
      const box = new T3.Mesh(new T3.BoxGeometry(0.8, 0.55, 0.6), white); box.position.y = 1.48; scr.add(box);
      for (let i = 0; i < 7; i++) { const sl = new T3.Mesh(new T3.BoxGeometry(0.82, 0.02, 0.05), mat(0xd8d8d0)); sl.position.set(0, 1.25 + i * 0.075, 0.31); sl.rotation.x = 0.6; scr.add(sl); }
      const roof = new T3.Mesh(new T3.BoxGeometry(0.95, 0.05, 0.75), white); roof.position.y = 1.8; roof.rotation.x = 0.08; scr.add(roof);
      const door = new T3.Mesh(new T3.BoxGeometry(0.8, 0.5, 0.02), white); door.position.set(0.0, 1.48, 0.62); door.rotation.x = -1.2; scr.add(door);
      const therm = (x, y, col) => { const t = new T3.Mesh(new T3.CylinderGeometry(0.012, 0.012, 0.36, 8), new T3.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.6, roughness: 0.05 })); t.position.set(x, y, 0.29); t.rotation.z = Math.PI / 2; scr.add(t); const b = new T3.Mesh(new T3.SphereGeometry(0.02, 10, 8), mat(col)); b.position.set(x - 0.19, y, 0.29); scr.add(b); };
      therm(0, 1.6, 0xd0021b); therm(0, 1.5, 0x2a6ad8); therm(-0.18, 1.38, 0xd0021b); therm(0.2, 1.38, 0xd0021b);
      const wick = new T3.Mesh(new T3.SphereGeometry(0.025, 10, 8), mat(0xffffff)); wick.position.set(0.01, 1.38, 0.29); scr.add(wick);
      const rg = new T3.Group(); rg.position.set(0.6, 0, 1.0); g.add(rg); const cyl = new T3.Mesh(new T3.CylinderGeometry(0.1, 0.1, 0.35, 24), mat(0xb8bcc2, { metalness: 0.6, roughness: 0.3 })); cyl.position.y = 0.2; rg.add(cyl); const fun = new T3.Mesh(new T3.CylinderGeometry(0.1, 0.03, 0.08, 24, 1, true), mat(0x9aa0a8, { metalness: 0.6, side: T3.DoubleSide })); fun.position.y = 0.41; rg.add(fun);
      const pole = new T3.Mesh(new T3.CylinderGeometry(0.025, 0.03, 3.0, 10), mat(0x8a8a8a, { metalness: 0.5 })); pole.position.set(1.3, 1.5, -0.6); g.add(pole);
      s.vane = new T3.Group(); s.vane.position.set(1.3, 3.0, -0.6); g.add(s.vane); const shaft = new T3.Mesh(new T3.BoxGeometry(0.02, 0.02, 0.7), mat(0x333333)); s.vane.add(shaft); const head = new T3.Mesh(new T3.ConeGeometry(0.05, 0.14, 10), mat(0xd0021b)); head.rotation.x = -Math.PI / 2; head.position.z = -0.38; s.vane.add(head); const tail = new T3.Mesh(new T3.BoxGeometry(0.01, 0.16, 0.2), mat(0x333333)); tail.position.z = 0.32; s.vane.add(tail);
      ["N", "E", "S", "W"].forEach((d, i) => { const a = i * Math.PI / 2; const arm = new T3.Mesh(new T3.BoxGeometry(0.01, 0.01, 0.3), mat(0x333333)); arm.position.set(1.3 + Math.sin(a) * 0.15, 2.8, -0.6 - Math.cos(a) * 0.15); arm.rotation.y = -a; g.add(arm); });
      s.cups = new T3.Group(); s.cups.position.set(1.3, 2.55, -0.6); g.add(s.cups); for (let i = 0; i < 3; i++) { const a = i * 2.094; const arm = new T3.Mesh(new T3.BoxGeometry(0.28, 0.01, 0.01), mat(0x333333)); arm.position.set(Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14); arm.rotation.y = -a; s.cups.add(arm); const cup = new T3.Mesh(new T3.SphereGeometry(0.045, 12, 8, 0, Math.PI), mat(0x2a2a2a, { side: T3.DoubleSide })); cup.position.set(Math.cos(a) * 0.28, 0, Math.sin(a) * 0.28); cup.rotation.y = -a; s.cups.add(cup); }
      const ssr = new T3.Group(); ssr.position.set(-0.3, 0, -1.4); g.add(ssr); const st2 = new T3.Mesh(new T3.CylinderGeometry(0.15, 0.2, 0.9, 16), mat(0xd8d4cc)); st2.position.y = 0.45; ssr.add(st2); const ball = new T3.Mesh(new T3.SphereGeometry(0.12, 32, 24), new T3.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, roughness: 0, thickness: 0.2, ior: 1.5 })); ball.position.y = 1.05; ssr.add(ball); const bowl = new T3.Mesh(new T3.TorusGeometry(0.15, 0.015, 8, 24, Math.PI), mat(0x8a7a5a, { metalness: 0.4 })); bowl.position.y = 1.05; ssr.add(bowl);
      const pan = new T3.Mesh(new T3.CylinderGeometry(0.35, 0.35, 0.12, 32), mat(0xb8bcc2, { metalness: 0.5, roughness: 0.3 })); pan.position.set(-1.6, 0.06, 1.3); g.add(pan); const pw = GK.water(0.66, 0.66, 0x4a8ab0, 0.9); pw.position.set(-1.6, 0.11, 1.3); pw.geometry = new T3.CircleGeometry(0.33, 32); g.add(pw);
      const baro = new T3.Mesh(new T3.CylinderGeometry(0.16, 0.16, 0.06, 32), mat(0x8a6a3a, { metalness: 0.3 })); baro.position.set(-1.2, 1.48, 0.0); baro.rotation.x = Math.PI / 2; baro.visible = false; g.add(baro);
      s.t = 0;
    },
    tick(S, s, c, dt) { if (!s.vane) return; const target = -c.wdir * Math.PI / 180 + Math.PI; s.vane.rotation.y += (target - s.vane.rotation.y) * Math.min(1, dt * 3) + Math.sin(performance.now() / 300) * 0.002 * c.wspd; s.cups.rotation.y -= dt * c.wspd * 12; },
    feats: [
      { id: "screen", n: "Stevenson screen", p: [-1.2, 1.85, 0], d: "A white wooden box with louvred sides on legs about 1.2 m high: white reflects sunlight, the louvres let air in, and it shades the thermometers so they record air temperature in the shade." },
      { id: "maxmin", n: "Maximum and minimum thermometers (Six's)", p: [-1.2, 1.56, 0.32], d: "Record the highest and lowest temperatures in 24 hours (°C). Mean daily temperature = (max + min) ÷ 2; daily range = max − min." },
      { id: "hygro", n: "Wet- and dry-bulb thermometers (hygrometer)", p: [-1.2, 1.38, 0.32], d: "The wet bulb is cooled by evaporation. The difference between the two readings gives the relative humidity (%) from tables — a small difference means humid air." },
      { id: "rain", n: "Rain gauge", p: [0.6, 0.48, 1.0], d: "A funnel collects rain into a jar; measured daily in millimetres with a measuring cylinder. Sunk 30 cm into open ground, away from trees and buildings." },
      { id: "vane", n: "Wind vane", p: [1.3, 3.1, -0.6], d: "The arrow points to the direction the wind blows FROM. Winds are named by that direction (a south-west wind blows from the south-west)." },
      { id: "anemo", n: "Cup anemometer", p: [1.3, 2.6, -0.6], d: "The cups spin faster in stronger wind; it measures wind speed in km/h or knots (also estimated with the Beaufort scale)." },
      { id: "sun", n: "Campbell–Stokes sunshine recorder", p: [-0.3, 1.2, -1.4], d: "A glass sphere focuses the sun's rays to burn a trace on a card: the length of the burn gives the hours of sunshine." },
      { id: "evap", n: "Evaporation pan (evaporimeter)", p: [-1.6, 0.2, 1.3], d: "Measures how much water evaporates in a day (mm)." },
    ],
    notes: ["Other instruments: barometer (air pressure, millibars — mercury or aneroid), barograph, thermograph, hygrometer; Campbell–Stokes recorder for sunshine; satellites and radar for cloud.", "Siting a weather station: open, level ground, away from buildings and trees, fenced, with grass cover."],
  });

  /* ===================== WX-b  Recording and using weather observations (2D) ===================== */
  const WEEK = [["Mon", 31.5, 23.0, 28.0, 25.0, 12.0, "SW", 6], ["Tue", 32.0, 23.5, 29.0, 25.5, 0, "SW", 8], ["Wed", 30.0, 22.5, 27.0, 25.5, 35.0, "W", 3], ["Thu", 29.0, 22.0, 26.0, 25.0, 18.5, "SW", 2], ["Fri", 31.0, 23.0, 28.5, 25.0, 0, "S", 7], ["Sat", 32.5, 24.0, 30.0, 26.0, 0, "SW", 9], ["Sun", 31.0, 23.5, 28.0, 25.5, 4.5, "SW", 5]];
  const rh = (d, w) => { const es = (t) => 6.112 * Math.exp(17.67 * t / (t + 243.5)); const e = es(w) - 0.66 * (d - w); return Math.max(0, Math.min(100, e / es(d) * 100)); };
  MK.def("WX-b", {
    kind: "2d", label: "Interactive weather record", title: "Recording and using weather observations",
    blurb: "One week of readings from a school weather station in the rainy season. Pick a day to work out mean temperature, range and relative humidity; the weekly totals update below.",
    values: { day: 2 },
    controls: [{ type: "tabs", key: "day", label: "Day", options: WEEK.map((w, i) => [i, w[0]]) }],
    draw(g, s, c, B) {
      const W = B.wide ? 386 : B.W - 10; g.fillStyle = "#f4f6fa"; g.fillRect(0, 0, B.W, B.H);
      const cols = ["Day", "Max", "Min", "Dry", "Wet", "Rain", "Wind", "Sun h"], cw = (W - 20) / cols.length, x0 = 10, y0 = 40, rh2 = 22;
      g.fillStyle = "#1d3557"; g.fillRect(x0, y0, W - 20, rh2); g.fillStyle = "#fff"; g.font = "700 10px 'IBM Plex Sans',sans-serif"; cols.forEach((t, i) => g.fillText(t, x0 + i * cw + 4, y0 + 15));
      WEEK.forEach((r, j) => { const y = y0 + rh2 * (j + 1); g.fillStyle = j === c.day ? "#ffe9a8" : j % 2 ? "#fff" : "#eef2f8"; g.fillRect(x0, y, W - 20, rh2); g.fillStyle = "#222"; g.font = (j === c.day ? "700 " : "") + "10px 'IBM Plex Sans',sans-serif"; r.forEach((v, i) => g.fillText(String(v), x0 + i * cw + 4, y + 15)); });
      const yb = y0 + rh2 * 8 + 14, gw = W - 20, gh = 120; g.fillStyle = "#fff"; g.fillRect(x0, yb, gw, gh); g.strokeStyle = "#ccd"; g.strokeRect(x0, yb, gw, gh);
      const X = (i) => x0 + 20 + i * (gw - 40) / 6, Yt = (t) => yb + gh - 14 - (t - 20) / 15 * (gh - 28), Yr = (r) => yb + gh - 14 - r / 40 * (gh - 28);
      WEEK.forEach((r, i) => { g.fillStyle = "rgba(58,122,192,.6)"; g.fillRect(X(i) - 7, Yr(r[5]), 14, yb + gh - 14 - Yr(r[5])); });
      [[1, "#d0021b"], [2, "#2a6ad8"]].forEach(([k, col]) => { g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); WEEK.forEach((r, i) => (i ? g.lineTo(X(i), Yt(r[k])) : g.moveTo(X(i), Yt(r[k])))); g.stroke(); });
      g.fillStyle = "#333"; g.font = "9px 'IBM Plex Sans',sans-serif"; WEEK.forEach((r, i) => g.fillText(r[0], X(i) - 8, yb + gh - 2)); g.fillStyle = "#d0021b"; g.fillText("max °C", x0 + 4, yb + 12); g.fillStyle = "#2a6ad8"; g.fillText("min °C", x0 + 50, yb + 12); g.fillStyle = "#3a7ac0"; g.fillText("rain mm", x0 + 96, yb + 12);
    },
    hud: (s, c) => { const r = WEEK[c.day], mean = (r[1] + r[2]) / 2, tot = WEEK.reduce((a, w) => a + w[5], 0), wmx = WEEK.reduce((a, w) => a + w[1], 0) / 7, wmn = WEEK.reduce((a, w) => a + w[2], 0) / 7; return [{ title: { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" }[r[0]] + "'s readings", lines: [["Mean temperature = (" + r[1] + " + " + r[2] + ") ÷ 2 = " + f(mean, 2) + " °C", "#ffd27a", true], ["Daily range = " + r[1] + " − " + r[2] + " = " + f(r[1] - r[2], 1) + " °C", "#ffd27a", true], ["Relative humidity (dry " + r[3] + ", wet " + r[4] + ", difference " + f(r[3] - r[4], 1) + ") ≈ " + Math.round(rh(r[3], r[4])) + "%", "#8fd0ff", true], "—", "Week: total rainfall " + f(tot, 1) + " mm · mean max " + f(wmx, 1) + " °C · mean min " + f(wmn, 1) + " °C.", "Prevailing wind (most frequent direction): SW — the moist south-west monsoon.", "Uses of weather records: farming calendars, aviation and shipping, forecasting, planning outdoor events."] }]; },
    readouts: (s, c) => [["Mean", f((WEEK[c.day][1] + WEEK[c.day][2]) / 2, 2) + " °C"], ["RH", Math.round(rh(WEEK[c.day][3], WEEK[c.day][4])) + "%"]],
  });

  /* ===================== CL-a  Elements of climate — air masses and the ITD over West Africa ===================== */
  const WA = [-20, 2, 18, 24];
  GK.def3d("CL-a", {
    title: "Elements of climate over West Africa",
    blurb: "The moist south-west monsoon (tropical maritime air) and the dry north-east harmattan (tropical continental air) meet at the Inter-Tropical Discontinuity, which moves north and south with the overhead sun. Drag the month to see rainfall, temperature and winds change.",
    envOpts: Object.assign({}, OUT, { fog: false }), cam: [[0.6, 7.4, 6.6], [0.8, 0, 0.5]],
    values: { m: 7, layer: "air" },
    controls: [{ type: "slider", key: "m", label: "Month", min: 0, max: 11, step: 1, fmt: (v) => MON[v] }, { type: "tabs", key: "layer", label: "Show", options: [["air", "Air masses & ITD"], ["rain", "Rain belt"], ["stations", "Station readings"]] }],
    build(S, s) {
      const T3 = T(), g = BK.group(S, s); s.map = GK.mapPlane({ bbox: WA, size: 9, geo: [{ path: "maps/westafrica_countries_10m.geojson", col: 0x222222, op: 0.8 }] }); g.add(s.map); s.P = s.map.P;
      s.itd = new T3.Group(); g.add(s.itd); s.dyn = new T3.Group(); g.add(s.dyn); s.km = -1; s.kl = "";
      s.cloud = GK.particles(500, 0xf4f6fa, 0.22, 0.85); g.add(s.cloud); s.dust = GK.particles(400, 0xd8b480, 0.12, 0.7); g.add(s.dust); s.rain = GK.particles(500, 0x8ac0ff, 0.03, 0.8); g.add(s.rain);
      const r = BK.rng(3); s.cq = Array.from({ length: 500 }, () => [r(), r(), r()]); s.dq = Array.from({ length: 400 }, () => [r(), r(), r()]);
    },
    update(S, s, c, dt) {
      const T3 = T(), P = s.P, L = itd(c.m + 0.5), zL = P.z(L);
      if (s.km !== c.m || s.kl !== c.layer) { s.km = c.m; s.kl = c.layer; BK.dispose(S, s.itd); s.itd = new T3.Group(); s.g.add(s.itd);
        const pts = []; for (let i = 0; i <= 40; i++) { const lo = WA[0] + i / 40 * (WA[2] - WA[0]); pts.push([P.x(lo), 0.18, P.z(L + 0.8 * Math.sin(lo * 0.3))]); } s.itd.add(GK.line(pts, 0xffd23a, 0.03));
        if (c.layer === "air") { for (let k = 0; k < 5; k++) { const lo = -16 + k * 7; s.itd.add(GK.arrow([P.x(lo - 2), 0.25, P.z(Math.max(2.5, L - 7))], [P.x(lo + 1), 0.25, P.z(L - 0.6)], 0x4aa8ff, 0.035)); s.itd.add(GK.arrow([P.x(lo + 4), 0.25, P.z(Math.min(23.5, L + 7))], [P.x(lo + 1.5), 0.25, P.z(L + 0.6)], 0xff9a3a, 0.035)); } }
      }
      const t = performance.now() / 1000;
      const C = s.cloud.pos, show = c.layer !== "stations" || true; s.cq.forEach((q, i) => { const lo = WA[0] + q[0] * (WA[2] - WA[0]), la = Math.max(3, L - 2.5 - q[1] * 8), x = P.x(lo + Math.sin(t * 0.1 + i) * 0.3), z = P.z(la); const onLand = la > 4.5 || lo > 6 || lo < -12; C.set([x, 0.45 + q[2] * 0.25, z], i * 3); }); s.cloud.flush(); s.cloud.visible = c.layer !== "air" || true;
      const R = s.rain.pos; for (let i = 0; i < 500; i++) { const q = s.cq[i], lo = WA[0] + q[0] * (WA[2] - WA[0]), la = Math.max(3, L - 3 - q[1] * 7), k = (t * 0.9 + q[2]) % 1; R.set([P.x(lo), 0.45 - k * 0.45, P.z(la)], i * 3); } s.rain.flush(); s.rain.visible = c.layer === "rain";
      const D = s.dust.pos; s.dq.forEach((q, i) => { const lo = WA[0] + ((q[0] - t * 0.02 * (1 + q[2])) % 1 + 1) % 1 * (WA[2] - WA[0]), la = L + 1 + q[1] * (24 - L - 1); D.set([P.x(lo), 0.12 + q[2] * 0.2, P.z(la) + ((t * 0.05 + q[2]) % 1) * 0.3], i * 3); }); s.dust.flush(); s.dust.visible = L < 16;
    },
    overlay(ctx, s, c, S, B) { if (c.layer !== "stations") return; const y0 = GK.storyOn ? 230 : 300; ["lagos", "kano", "freetown", "banjul"].forEach((k, i) => { const d = ST[k]; climograph(ctx, 12 + (i % 2) * 190, y0 - 120 + Math.floor(i / 2) * 104, 184, 100, d[3], d[4], { title: d[0].split(",")[0] + " · " + MON[c.m] + " " + d[4][c.m] + " mm, " + d[3][c.m] + "°C", hi: c.m }); }); },
    labels: (s, c) => { if (!s.P) return []; const P = s.P, L = itd(c.m + 0.5), out = [{ id: "itd", p: [P.x(-17), 0.25, P.z(L)], t: "ITD ≈ " + f(L, 0) + "°N (" + MON[c.m] + ")", col: "#ffd23a", dy: -22 }];
      if (c.layer === "air") out.push({ id: "mT", p: [P.x(-6), 0.3, P.z(Math.max(3, L - 6))], t: "Tropical maritime (mT) air — SW monsoon, moist", col: "#8fd0ff", dy: 26 }, { id: "cT", p: [P.x(6), 0.3, P.z(Math.min(22, L + 6))], t: "Tropical continental (cT) air — NE trades / harmattan, dry", col: "#ffb36a", dy: -26 });
      if (c.layer === "rain") out.push({ id: "rb", p: [P.x(0), 0.6, P.z(Math.max(4, L - 6))], t: "Rain belt — 200–1 000 km south of the ITD", col: "#e8f1ff" });
      if (c.layer === "stations") Object.entries(ST).forEach(([k, d]) => out.push({ id: k, p: [P.x(d[2]), 0.1, P.z(d[1])], t: d[0].split(",")[0] + " " + d[4][c.m] + " mm", col: d[4][c.m] > 100 ? "#8fd0ff" : "#ffd27a" }));
      out.push({ id: "gog", p: [P.x(2), 0.05, P.z(3)], t: "Gulf of Guinea", col: "#b9d8ff", dy: 18 }, { id: "sah", p: [P.x(4), 0.05, P.z(22)], t: "Sahara", col: "#ffe0b0", dy: -14 });
      return out; },
    hud: (s, c) => { const L = itd(c.m + 0.5); return [{ title: MON[c.m] + ": ITD near " + f(L, 0) + "°N", lines: [[L > 15 ? "Rainy season over most of West Africa: moist mT air covers the south and the middle belt." : L > 10 ? "The rains are moving " + (c.m < 7 ? "north" : "south") + "; the north is still mostly dry." : "Dry season: dry, dusty harmattan (cT air) covers most of West Africa; only the coast gets some rain.", "#ffd27a", true], (c.m === 7 ? ["August: a 'little dry season' along the coast (e.g. Lagos, Accra) while the rain belt is far north.", "#8fd0ff", true] : ["Lagos " + ST.lagos[4][c.m] + " mm · Kano " + ST.kano[4][c.m] + " mm this month.", "#8fd0ff", true]), "Elements of climate: temperature, rainfall, humidity, pressure, wind, sunshine, cloud cover.", "Temperatures are high all year (over 21 °C); the annual range increases inland. Rainfall decreases from the coast (over 2 000 mm) to the Sahel (under 500 mm)."] }]; },
    story: [
      { d: 6, cap: "In January the overhead sun is in the southern hemisphere. The ITD lies near the coast and the dry harmattan blows over West Africa.", set: { m: 0, layer: "air" }, hl: "cT" },
      { d: 7, cap: "From March to August the ITD moves north. Moist south-west winds from the Gulf of Guinea spread inland, bringing the rains.", tween: { m: [2, 7] }, hl: "mT" },
      { d: 6, cap: "Rain falls in a belt well south of the ITD. In August the coast has a short break — the little dry season.", set: { layer: "rain", m: 7 }, hl: "rb" },
      { d: 7, cap: "From September the ITD retreats south. The north has a single short rainy season; the south has two rainy seasons.", tween: { m: [8, 11] } },
      { d: 6, cap: "Station readings show the pattern: Freetown and Monrovia are very wet; Kano and Banjul have a long dry season.", set: { layer: "stations", m: 7 } },
    ],
    draw: GK.fallback("Climate of West Africa", ["mT air (SW monsoon) brings rain", "cT air (harmattan) is dry and dusty", "The ITD follows the overhead sun: about 6°N in January, 21°N in August"]),
  });

  /* ===================== CL-b  Factors affecting climatic elements ===================== */
  GK.tour("CL-b", {
    title: "Factors affecting climate",
    blurb: "Why do places at the same latitude have different climates? Explore altitude and relief rainfall, latitude and the angle of the sun, and distance from the sea.",
    envOpts: OUT, cam: [[0.8, 3.0, 10.2], [0.6, 1.0, 0]], variants: [["relief", "Altitude & relief"], ["lat", "Latitude"], ["sea", "Distance from the sea"]], vlabel: "Factor",
    build(g, S, s, c) {
      const T3 = T(); s.rain = null;
      if (c.v === "relief") {
        const h = (x, z) => 0.05 + 2.2 * Math.exp(-((x / 1.3) ** 2)) * (1 - 0.15 * Math.abs(z) / 3) + (BK.fbm(x * 1.5, z * 1.5, 2) - 0.5) * 0.12;
        g.add(GK.terrain({ w: 9, d: 5, nx: 180, h, tint: (hn, sl, x, z) => (x < 0 ? mix3(GK.tintForest(hn, sl, x, z), hex3(0x8a8a7a), sm(1.6, 2.2, h(x, z))) : mix3(GK.tintDesert(hn, sl, x, z), hex3(0x8a8a7a), sm(1.6, 2.2, h(x, z)))) }));
        const sea = GK.water(4, 6, 0x2a6f8f, 0.9); sea.position.set(-5.5, 0.02, 0); g.add(sea);
        GK.flora(g, GK.scatter(220, -3.6, -0.6, -2.4, 2.4, h, (x, z) => h(x, z) < 1.7, 4), "broad", 0x2f5e26, 0.28);
        GK.flora(g, GK.scatter(40, 0.8, 4.4, -2.4, 2.4, h, (x, z) => h(x, z) < 1.2, 5), "shrub", 0x8a8a40, 0.3);
        [[-3.2, 0.5], [-1.6, 1.6], [-0.8, 2.3]].forEach(([x, y], i) => g.add(GK.arrow([x - 1, y - 0.3, 0], [x, y, 0], 0x4aa8ff, 0.04))); g.add(GK.arrow([0.6, 2.4, 0], [2.4, 0.9, 0], 0xff9a3a, 0.04));
        s.cl = GK.particles(300, 0xf4f6fa, 0.3, 0.9); g.add(s.cl); for (let i = 0; i < 300; i++) s.cl.pos.set([-1.5 + Math.random() * 1.5, 1.6 + Math.random() * 0.8, Math.random() * 4 - 2], i * 3); s.cl.flush();
        s.rain = GK.particles(300, 0x8ac0ff, 0.03, 0.8); g.add(s.rain); s.rq = Array.from({ length: 300 }, () => [-2.6 + Math.random() * 2.2, Math.random(), Math.random() * 4 - 2]); s.h = h;
      } else if (c.v === "lat") {
        const gl = GK.globe ? GK.globe(1.8, { clouds: false }) : new T3.Mesh(new T3.SphereGeometry(1.8, 48, 32), mat(0x3a7ac0)); gl.position.set(1.0, 1.8, 0); g.add(gl); s.gl = gl;
        [[0, 0xffd23a], [45, 0xffb03a], [70, 0xff8a3a]].forEach(([lat, col]) => { const y = 1.8 + 1.8 * Math.sin(lat * Math.PI / 180), x = 1.0 + 1.8 * Math.cos(lat * Math.PI / 180); g.add(GK.arrow([-4, y + 0.25, 0], [x - 0.02, y + 0.25, 0], col, 0.03)); g.add(GK.arrow([-4, y - 0.25, 0], [Math.max(x - 0.02, 1.0 + Math.sqrt(Math.max(0, 3.24 - (y - 0.25 - 1.8) ** 2))) - 0.02, y - 0.25, 0], col, 0.03)); });
        const ground = new T3.Mesh(new T3.CircleGeometry(6, 32), mat(0x1a1f2a)); ground.rotation.x = -Math.PI / 2; g.add(ground);
      } else {
        const h = (x, z) => 0.05 + Math.max(0, x + 2.5) * 0.05 + (BK.fbm(x, z, 3) - 0.5) * 0.06;
        g.add(GK.terrain({ w: 9, d: 4, nx: 150, h, tint: (hn, sl, x, z) => mix3(GK.tintSavanna(hn, sl, x, z), GK.tintDesert(hn, sl, x, z), sm(0, 4, x)) }));
        const sea = GK.water(4, 6, 0x2a6f8f, 0.9); sea.position.set(-5.5, 0.02, 0); g.add(sea);
        [["coast", -2.2], ["inland", 3.2]].forEach(([n, x]) => { const p = GK.pin(n === "coast" ? 0x4aa8ff : 0xff9a3a, 0.5); p.position.set(x, h(x, 0), 0); g.add(p); });
        GK.flora(g, GK.scatter(80, -2.5, 1.0, -1.8, 1.8, h, null, 6), "broad", 0x3a6a2a, 0.25); GK.flora(g, GK.scatter(40, 1.5, 4.4, -1.8, 1.8, h, null, 7), "umbrella", 0x6a7a30, 0.3);
      }
    },
    tick(S, s, c, dt) { if (s.rain) { const P = s.rain.pos; s.rq.forEach((q, i) => { q[1] = (q[1] + dt * 1.2) % 1; const y0 = 1.7, y1 = s.h(q[0], q[2]); P.set([q[0], y0 - (y0 - y1) * q[1], q[2]], i * 3); }); s.rain.flush(); } if (s.gl && s.gl.earth) { s.gl.earth.rotation.y += dt * 0.1; s.gl.setSun && s.gl.setSun(S, V(-1, 0, 0.2)); } },
    overlay(ctx, s, c, S, B) { if (c.v !== "sea") return; const x0 = 12, y0 = GK.storyOn ? 196 : 262; climograph(ctx, x0, y0 - 20, 184, 112, ST.lagos[3], ST.lagos[4], { title: "Coast: Lagos — range " + f(Math.max(...ST.lagos[3]) - Math.min(...ST.lagos[3]), 1) + "°C" }); climograph(ctx, x0 + 190, y0 - 20, 184, 112, ST.kano[3], ST.kano[4], { title: "Inland: Kano — range " + f(Math.max(...ST.kano[3]) - Math.min(...ST.kano[3]), 1) + "°C" }); },
    feats: (c) => ({
      relief: [{ id: "wind", n: "Windward side — relief rainfall", p: [-1.8, 1.3, 0], d: "Moist air from the sea is forced up the mountain, cools, condenses into clouds and gives heavy rain (orographic rainfall), e.g. the Cameroon Highlands, Jos Plateau, Fouta Djallon." }, { id: "lee", n: "Leeward side — rain shadow", p: [1.6, 1.0, 0], d: "Air descending on the other side warms and dries, so this side receives little rain." }, { id: "alt", n: "Altitude: temperature falls with height", p: [0, 2.3, 0], d: "Temperature falls by about 6.5 °C for every 1 000 m of height (lapse rate). Jos (1 200 m) is about 6 °C cooler than Lagos." }],
      lat: [{ id: "eq", n: "Low latitudes — overhead sun", p: [2.8, 1.8, 0], d: "Near the equator the sun's rays strike almost vertically, concentrating heat on a small area — hot all year." }, { id: "mid", n: "Middle latitudes", p: [2.3, 3.2, 0], d: "Rays strike at an angle and spread over a larger area, passing through more atmosphere — cooler." }, { id: "high", n: "High latitudes — slanting rays", p: [1.6, 3.6, 0], d: "Very low sun: heat spread thinly — cold climates near the poles." }],
      sea: [{ id: "coast", n: "Coastal (maritime) climate", p: [-2.2, 0.6, 0], d: "The sea heats and cools slowly, so coastal places have a small annual range and high humidity." }, { id: "inland", n: "Inland (continental) climate", p: [3.2, 0.8, 0], d: "Land heats and cools quickly: inland places have a larger range of temperature and lower rainfall." }, { id: "curr", n: "Ocean currents", p: [-4.6, 0.2, 0], d: "Warm currents (Guinea current) raise temperatures and humidity; cold currents (Canary, Benguela) cool the coast and cause dry, foggy conditions." }],
    })[c.v],
    notes: ["Other factors: winds and air masses, pressure belts, aspect (direction a slope faces), vegetation cover, cloud cover and urban areas."],
  });

  /* ===================== CL-c  Interpretation of climatic charts (2D) ===================== */
  MK.def("CL-c", {
    kind: "2d", label: "Interactive climograph", title: "Interpreting climatic charts and data",
    blurb: "Choose a weather station. Read the bar graph (rainfall) and line graph (temperature), then use the worked calculations to describe its climate.",
    values: { st: "lagos" },
    controls: [{ type: "select", key: "st", label: "Station", options: Object.entries(ST).map(([k, d]) => [k, d[0]]) }],
    draw(g, s, c, B) { const W = B.wide ? 386 : B.W - 10, d = ST[c.st]; g.fillStyle = "#0f1626"; g.fillRect(0, 0, B.W, B.H); climograph(g, 10, 40, W - 20, B.H - 60, d[3], d[4], { title: d[0] + "  (" + Math.abs(d[1]) + "°N, " + Math.abs(d[2]) + "°" + (d[2] >= 0 ? "E" : "W") + ") — approximate averages", bg: "#16203a" }); },
    hud: (s, c) => { const d = ST[c.st], Tm = d[3], R = d[4], mx = Math.max(...Tm), mn = Math.min(...Tm), tot = R.reduce((a, b) => a + b, 0), wet = R.filter((r) => r >= 50).length, w = R.indexOf(Math.max(...R)); const type = tot > 2000 && wet >= 9 ? "Tropical monsoon / equatorial (very wet)" : tot > 1200 && wet >= 7 ? (R[7] < R[5] && R[7] < R[8] ? "Tropical wet with a double maximum (Guinea type)" : "Tropical wet") : tot > 600 ? "Tropical continental (savanna / Sudan type)" : "Semi-arid (Sahel)"; return [{ title: d[0], lines: [["Mean annual temperature = " + f(Tm.reduce((a, b) => a + b, 0) / 12, 1) + " °C", "#ffd27a", true], ["Annual range = " + mx + " − " + mn + " = " + f(mx - mn, 1) + " °C", "#ffd27a", true], ["Total annual rainfall ≈ " + tot.toLocaleString("en-GB") + " mm; wettest month " + MON[w] + "; " + wet + " months with 50 mm or more", "#8fd0ff", true], ["Climate: " + type, "#9fe8b0"], "—", "How to describe a climate: temperature (mean, range, hottest/coolest months), rainfall (total, wet and dry seasons, distribution), then name the climate type and suggest the location."] }]; },
    readouts: (s, c) => [["Range", f(Math.max(...ST[c.st][3]) - Math.min(...ST[c.st][3]), 1) + " °C"], ["Rain", ST[c.st][4].reduce((a, b) => a + b, 0) + " mm"]],
  });

  /* ===================== CL-d  Major types of climate ===================== */
  const CLT = [
    ["eq", "Equatorial", 0, 10, [[0.3, 32.6, "Kampala"], [1.3, 103.8, "Singapore"], [-3.1, -60.0, "Manaus"]], 0x1f7a3a, "Hot (26–28 °C) and wet all year (over 2 000 mm), no dry season, small range (2–3 °C); convectional rain every afternoon. Vegetation: tropical rainforest."],
    ["sav", "Tropical continental (savanna)", 5, 18, [[12.0, 8.5, "Kano"], [9.4, -0.85, "Tamale"], [-15.4, 28.3, "Lusaka"]], 0x9ac040, "Hot all year; a wet season in summer and a long dry season; rainfall 500–1 500 mm; range 5–8 °C."],
    ["mon", "Tropical monsoon", 8, 25, [[19.1, 72.9, "Mumbai"], [8.5, -13.2, "Freetown"], [16.8, 96.2, "Yangon"]], 0x2aa8a0, "Very heavy rain in the wet monsoon season brought by onshore winds, followed by a dry season."],
    ["des", "Hot desert", 18, 30, [[24.5, 13.0, "Sahara"], [23.6, 25.6, "Kufra"], [-23.7, 133.9, "Alice Springs"]], 0xe0b060, "Very hot days, cool nights, rainfall under 250 mm, very large daily range; clear skies. Examples: Sahara, Kalahari, Arabian."],
    ["med", "Mediterranean", 30, 40, [[36.8, 3.1, "Algiers"], [-33.9, 18.4, "Cape Town"], [34.0, -118.2, "Los Angeles"]], 0xc06ab0, "Hot dry summers and mild wet winters (rain from westerly winds)."],
    ["ctw", "Cool temperate western margin", 40, 60, [[51.5, -0.1, "London"], [53.3, -6.3, "Dublin"], [47.6, -122.3, "Seattle"]], 0x4a8ad0, "Mild winters, cool summers and rain all year from westerly winds and depressions."],
    ["cont", "Cool temperate continental", 45, 60, [[55.8, 37.6, "Moscow"], [50.4, 30.5, "Kyiv"], [51.0, -114.1, "Calgary"]], 0x8a6ad0, "Very cold winters, warm summers, large annual range; low rainfall mainly in summer."],
    ["polar", "Polar / tundra", 60, 90, [[64.8, -147.7, "Fairbanks"], [69.6, 18.9, "Tromsø"], [71.3, -156.8, "Utqiagvik"]], 0xd0e8ff, "Very cold most of the year; short cool summer; little precipitation, mostly snow."],
  ];
  GK.def3d("CL-d", {
    title: "Major types of climate",
    blurb: "Pick a climate type: the globe turns to show its latitude band and example places, with the main characteristics.",
    envOpts: { bgColor: 0x02040b, fog: false, hemi: 0.15, sun: 3, sunPos: [20, 6, 14], shadow: false, envI: 0.12, hdri: "dikhololo_night" }, cam: [[0, 1.2, 7.4], [1.0, 0, 0]],
    values: { t: "eq" }, controls: [{ type: "select", key: "t", label: "Climate type", options: CLT.map((x) => [x[0], x[1]]) }],
    build(S, s) { const g = BK.group(S, s); g.add(GK.stars()); s.gl = GK.globe(2); g.add(s.gl); s.band = new (T().Group)(); s.gl.earth.add(s.band); s.k = ""; s.rotT = 0; },
    update(S, s, c, dt) {
      const T3 = T(), C = CLT.find((x) => x[0] === c.t);
      if (s.k !== c.t) { s.k = c.t; BK.dispose(S, s.band); s.band = new T3.Group(); s.gl.earth.add(s.band); [1, -1].forEach((sg) => { const m = new T3.Mesh(new T3.SphereGeometry(2.012, 96, 24, 0, Math.PI * 2, (90 - C[3]) * Math.PI / 180, (C[3] - C[2]) * Math.PI / 180), new T3.MeshBasicMaterial({ color: C[5], transparent: true, opacity: 0.32, depthWrite: false })); if (sg < 0) m.rotation.x = Math.PI; s.band.add(m); }); C[4].forEach(([la, lo]) => { const p = GK.pin(C[5], 0.35); p.position.set(...GK.ll(la, lo, 2)); p.lookAt(0, 0, 0); p.rotateX(-Math.PI / 2); s.band.add(p); }); s.rotT = -C[4][0][1] * Math.PI / 180 + 0.0; }
      s.gl.earth.rotation.y += (s.rotT - s.gl.earth.rotation.y) * Math.min(1, dt * 2); if (s.gl.clouds) s.gl.clouds.rotation.y = s.gl.earth.rotation.y; s.gl.setSun(S, V(0.4, 0.2, 1));
      s.gl.earth.rotation.x = -C[4][0][0] * Math.PI / 180 * 0.5 * 0; s.gl.rotation.y = Math.PI / 2;
    },
    labels: (s, c) => { if (!s.gl) return []; const C = CLT.find((x) => x[0] === c.t), ry = s.gl.earth.rotation.y + Math.PI / 2; return C[4].map(([la, lo, n], i) => ({ id: "p" + i, p: V(...GK.ll(la, lo, 2.4)).applyAxisAngle(V(0, 1, 0), ry).toArray(), t: n, col: "#ffe7a8" })); },
    hud: (s, c) => { const C = CLT.find((x) => x[0] === c.t); return [{ title: C[1] + " (about " + C[2] + "°–" + C[3] + "° N and S)", lines: [[C[6], "#ffd27a", true], "—", "Climate is the average weather of a place over about 30 years."] }]; },
    story: CLT.slice(0, 6).map((C) => ({ d: 5.5, title: C[1], cap: C[1] + ": " + C[6], set: { t: C[0] } })),
    draw: GK.fallback("Climate types", CLT.map((C) => C[1] + ": " + C[6])),
  });

  /* ===================== CL-e  Classification of climate ===================== */
  const koppen = (Tm, R) => { const mx = Math.max(...Tm), mn = Math.min(...Tm), mean = Tm.reduce((a, b) => a + b, 0) / 12, P = R.reduce((a, b) => a + b, 0), summer = [3, 4, 5, 6, 7, 8].reduce((a, i) => a + R[i], 0), th = 20 * mean + (summer / P >= 0.7 ? 280 : summer / P <= 0.3 ? 0 : 140); if (P < th) return [P < th / 2 ? "BW" : "BS", P < th / 2 ? "Hot desert" : "Hot semi-arid (steppe)", "Rainfall " + P + " mm is below the dryness threshold of " + Math.round(th) + " mm."]; if (mn >= 18) { const dry = Math.min(...R); if (dry >= 60) return ["Af", "Tropical rainforest", "Every month at least 18 °C and at least 60 mm of rain."]; if (dry >= 100 - P / 25) return ["Am", "Tropical monsoon", "Coolest month at least 18 °C; a short dry season made up for by very heavy rain."]; return ["Aw", "Tropical savanna (wet-and-dry)", "Coolest month at least 18 °C; a distinct dry season (driest month under 60 mm)."]; } if (mn > 0) return ["C", "Warm temperate", "Coolest month between 0 and 18 °C."]; if (mx > 10) return ["D", "Cold (continental)", "Coldest month below 0 °C, warmest above 10 °C."]; return ["E", "Polar", "Warmest month below 10 °C."]; };
  GK.def3d("CL-e", {
    title: "Classification of climate: Greek and Köppen",
    blurb: "The Greeks divided the world into three temperature zones by latitude. Köppen used temperature and rainfall figures with letters. Pick a station to classify it.",
    envOpts: { bgColor: 0x02040b, fog: false, hemi: 0.15, sun: 3, sunPos: [20, 6, 14], shadow: false, envI: 0.12, hdri: "dikhololo_night" }, cam: [[0, 1.0, 7.6], [1.1, 0, 0]],
    values: { st: "lagos", zones: 1 }, controls: [{ type: "select", key: "st", label: "Station to classify", options: Object.entries(ST).map(([k, d]) => [k, d[0]]) }, { type: "toggle", key: "zones", label: "Show Greek zones" }],
    build(S, s) { const T3 = T(), g = BK.group(S, s); g.add(GK.stars()); s.gl = GK.globe(2, { clouds: false }); g.add(s.gl); s.gl.rotation.y = Math.PI / 2; s.gl.earth.rotation.y = -0.1; s.z = new T3.Group(); s.gl.add(s.z); [[0, 23.44, 0xff6a3a], [23.44, 66.56, 0x6ad06a], [66.56, 90, 0x9ad0ff]].forEach(([a, b, col]) => [1, -1].forEach((sg) => { const m = new T3.Mesh(new T3.SphereGeometry(2.015, 96, 24, 0, Math.PI * 2, (90 - b) * Math.PI / 180, (b - a) * Math.PI / 180), new T3.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.28, depthWrite: false })); if (sg < 0) m.rotation.x = Math.PI; s.z.add(m); })); s.pinG = new T3.Group(); s.gl.earth.add(s.pinG); s.k = ""; },
    update(S, s, c) { s.z.visible = !!c.zones; s.gl.setSun(S, V(0.4, 0.2, 1)); if (s.k !== c.st) { s.k = c.st; BK.dispose(S, s.pinG); s.pinG = new (T().Group)(); s.gl.earth.add(s.pinG); const d = ST[c.st], p = GK.pin(0xffd23a, 0.35); p.position.set(...GK.ll(d[1], d[2], 2)); p.lookAt(0, 0, 0); p.rotateX(-Math.PI / 2); s.pinG.add(p); } },
    overlay(ctx, s, c, S, B) { const d = ST[c.st]; climograph(ctx, 12, GK.storyOn ? 214 : 278, 210, 110, d[3], d[4], { title: d[0] }); },
    labels: (s, c) => c.zones ? [{ id: "tor", p: [0, 0.3, 2.1], t: "Torrid zone (between the tropics)", col: "#ff9a6a", dx: -80 }, { id: "tem", p: [0, 1.4, 1.5], t: "North temperate zone", col: "#9fe8b0", dx: -70 }, { id: "fri", p: [0, 1.95, 0.4], t: "North frigid zone", col: "#b9e0ff", dx: -60, dy: -20 }, { id: "tem2", p: [0, -1.4, 1.5], t: "South temperate zone", col: "#9fe8b0", dx: -70 }] : [],
    hud: (s, c) => { const d = ST[c.st], k = koppen(d[3], d[4]); return [{ title: d[0] + " → Köppen " + k[0], lines: [[k[0] + " — " + k[1], "#ffd27a", true], [k[2], "#8fd0ff", true], "—", "Greek: torrid (hot, 0–23½°), temperate (23½–66½°), frigid (66½–90°) — based on latitude only.", "Köppen main groups: A tropical humid, B dry, C warm temperate, D cold continental, E polar; second letters f (no dry season), m (monsoon), w (dry winter), s (dry summer), W (desert), S (steppe).", "Advantages of Köppen: uses measurable figures and boundaries match vegetation; weakness: ignores winds and air masses."] }]; },
    story: [{ d: 6, cap: "The ancient Greeks divided the earth into torrid, temperate and frigid zones using latitude alone.", set: { zones: 1, st: "lagos" }, hl: "tor" }, { d: 6, cap: "Köppen used average temperature and rainfall. Lagos has every month above 18 °C and a short dry season.", set: { st: "lagos" } }, { d: 6, cap: "Kano has a long dry season: tropical savanna, Aw.", set: { st: "kano" } }, { d: 6, cap: "Monrovia is so wet that its dry season is made up for — tropical monsoon, Am.", set: { st: "monrovia" } }],
    draw: GK.fallback("Climate classification", ["Greek: torrid, temperate, frigid", "Köppen: A, B, C, D, E with second letters"]),
  });

  /* ===================== CC-a  Climate change ===================== */
  GK.def3d("CC-a", {
    title: "Climate change: causes, effects and remedies",
    blurb: "Greenhouse gases let sunlight in but trap some of the heat the earth gives off. Raise the carbon dioxide level and see how much warmer the world becomes, and what that means for West Africa.",
    envOpts: { bgColor: 0x02040b, fog: false, hemi: 0.18, sun: 3, sunPos: [-20, 4, 12], shadow: false, envI: 0.12, hdri: "dikhololo_night" }, cam: [[0, 1.0, 9.0], [1.4, 0.2, 0]],
    values: { co2: 420 }, controls: [{ type: "slider", key: "co2", label: "Carbon dioxide (ppm)", min: 280, max: 800, step: 5, fmt: (v) => v + " ppm" + (v === 280 ? " (1850)" : v === 420 ? " (today)" : "") }],
    build(S, s) { const T3 = T(), g = BK.group(S, s); g.add(GK.stars()); s.gl = GK.globe(2); g.add(s.gl); s.gl.rotation.y = 2.2; s.shell = new T3.Mesh(new T3.SphereGeometry(2.5, 64, 32), new T3.MeshBasicMaterial({ color: 0xff8a3a, transparent: true, opacity: 0.08, depthWrite: false, side: T3.DoubleSide })); g.add(s.shell); s.sunR = GK.particles(200, 0xffe28a, 0.07, 0.9); s.ir = GK.particles(260, 0xff5a3a, 0.07, 0.9); g.add(s.sunR, s.ir); const r = BK.rng(2); s.q = Array.from({ length: 260 }, () => [r(), r() * 2 - 1, r()]); },
    update(S, s, c, dt) { const t = performance.now() / 1000, trap = Math.min(0.85, 0.35 + (c.co2 - 280) / 800); s.shell.material.opacity = 0.05 + trap * 0.18; s.gl.setSun(S, V(-1, 0.1, 0.5)); s.gl.earth.rotation.y += dt * 0.05;
      const A = s.sunR.pos; for (let i = 0; i < 200; i++) { const q = s.q[i], k = (t * 0.35 + q[2]) % 1; A.set([-7 + k * 5.1, q[1] * 1.6, q[0] * 1.2 - 0.6], i * 3); } s.sunR.flush();
      const B2 = s.ir.pos; for (let i = 0; i < 260; i++) { const q = s.q[i], k = (t * 0.3 + q[0]) % 1, a = q[1] * 3.0 + 0.4, out = q[2] > trap, r = out ? 2.05 + k * 4 : 2.05 + (k < 0.5 ? k : 1 - k) * 0.9; B2.set([Math.cos(a) * r, Math.sin(a) * r, q[2] * 0.6], i * 3); } s.ir.flush(); },
    labels: (s, c) => [{ id: "sun", p: [-5, 1.0, 0], t: "Sunlight (short-wave) passes through", col: "#ffe28a" }, { id: "ir", p: [2.8, 1.8, 0], t: "Heat (infrared) escaping", col: "#ff9a6a" }, { id: "trap", p: [0.5, 2.55, 0.8], t: "Greenhouse gases trap heat (CO₂, methane, water vapour)", col: "#ffb36a", dy: -26 }],
    overlay(ctx, s, c, S, B) { const x0 = 12, y0 = GK.storyOn ? 214 : 278, w = 230, h = 110; B.panel(x0, y0, w, h); ctx.fillStyle = "#cfe0f5"; ctx.font = "700 10px 'IBM Plex Sans',sans-serif"; ctx.fillText("CO₂ (ppm)  —  past and today", x0 + 10, y0 + 15); const yrs = [[1850, 285], [1900, 296], [1950, 311], [1970, 325], [1990, 354], [2000, 369], [2010, 389], [2020, 413], [2024, 424]], X = (y) => x0 + 18 + (y - 1850) / 180 * (w - 36), Y = (p) => y0 + h - 16 - (p - 270) / 540 * (h - 36); ctx.strokeStyle = "#ffb36a"; ctx.lineWidth = 2; ctx.beginPath(); yrs.forEach(([y, p], i) => (i ? ctx.lineTo(X(y), Y(p)) : ctx.moveTo(X(y), Y(p)))); ctx.stroke(); ctx.setLineDash([4, 3]); ctx.strokeStyle = "#ff5a3a"; ctx.beginPath(); ctx.moveTo(X(2024), Y(424)); ctx.lineTo(X(2030), Y(c.co2)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#cfd8e8"; ctx.font = "8px 'IBM Plex Sans',sans-serif"; ctx.fillText("1850", X(1850), y0 + h - 4); ctx.fillText("2024", X(2024) - 14, y0 + h - 4); ctx.fillText(c.co2 + " ppm", X(2024) - 30, Y(c.co2) - 4); },
    hud: (s, c) => { const dT = 3 * Math.log2(c.co2 / 280); return [{ title: c.co2 + " ppm of CO₂", lines: [["Long-term warming compared with 1850 ≈ " + f(dT, 1) + " °C (assuming about 3 °C per doubling of CO₂).", "#ffd27a", true], ["Already observed: about 1.2–1.3 °C of warming since the 1800s.", "#8fd0ff", true], "Causes: burning coal, oil and gas; gas flaring (Niger Delta); deforestation and bush burning; farming (methane from rice and cattle); industry.", "Effects: rising sea level (coastal erosion at Lagos Bar Beach, Keta), floods and droughts, desertification in the Sahel, shrinking Lake Chad, crop failure, heat waves, spread of diseases.", "Remedies: renewable energy (solar, wind, HEP), stop gas flaring, afforestation (Great Green Wall), energy efficiency, international agreements (Kyoto, Paris), adaptation (sea walls, drought-resistant crops)."] }]; },
    story: [{ d: 6, cap: "Sunlight passes through the atmosphere and warms the earth's surface.", set: { co2: 280 }, hl: "sun" }, { d: 6, cap: "The warm earth gives off heat as infrared rays. Greenhouse gases absorb some of it and send it back — keeping the earth warm enough for life.", hl: "trap" }, { d: 7, cap: "Burning fossil fuels and cutting forests have raised CO₂ from 280 to about 420 ppm. More heat is trapped and the world warms.", tween: { co2: [280, 420] } }, { d: 6, cap: "If CO₂ doubles to 560 ppm, the world could warm by about 3 °C — with serious effects on farming, water and coasts.", tween: { co2: [420, 560] } }],
    draw: GK.fallback("Climate change", ["Greenhouse gases trap heat", "CO₂ has risen from 280 to about 420 ppm", "Effects: sea-level rise, drought, floods; remedies: renewables, afforestation"]),
  });

  /* ===================== EN a–c  The environment ===================== */
  const envH = (x, z) => 0.15 + 0.9 * Math.exp(-(((x + 2.4) / 1.2) ** 2) - ((z + 1.2) / 1.0) ** 2) + 0.3 * sm(1.5, 4.2, -z) + (BK.fbm(x, z, 21) - 0.5) * 0.1 - 0.12 * Math.exp(-(((z - 0.4 * Math.sin(x)) / 0.15) ** 2));
  function envBase(g, mode) {
    const T3 = T();
    g.add(GK.terrain({ w: 10, d: 7, nx: 200, h: envH, tint: (hn, sl, x, z) => { let c = GK.tintSavanna(hn, sl, x, z); if (mode === "prob" && x > 2 && z < -0.5) c = mix3(c, hex3(0xd8b480), 0.7); if (mode === "prob" && Math.hypot(x + 0.6, z + 1.7) < 0.5) c = hex3(0x8a5a3a); return c; } }));
    const rv = []; for (let i = 0; i <= 80; i++) { const x = -5 + i / 8, z = 0.4 * Math.sin(x); rv.push([x, envH(x, z) + 0.03, z]); } g.add(GK.line(rv, mode === "prob" ? 0x4a5a3a : 0x2f78c0, 0.05));
    const sea = GK.water(12, 3, 0x2a6f8f, 0.9); sea.position.set(0, 0.03, 4.6); g.add(sea);
    const forestOk = (x, z) => x < -0.8 && z < -0.2 && (mode !== "prob" || x < -3.0);
    GK.flora(g, GK.scatter(mode === "prob" ? 90 : 300, -4.9, -0.8, -3.4, -0.2, envH, forestOk, 31), "broad", 0x2f5e26, 0.32);
    if (mode === "prob") { GK.flora(g, GK.scatter(60, -2.9, -0.9, -3.0, -0.4, envH, null, 32), "shrub", 0x5a4a30, 0.12); const spill = new T3.Mesh(new T3.CircleGeometry(0.9, 32), new T3.MeshPhysicalMaterial({ color: 0x0c0c10, roughness: 0.05, clearcoat: 1, iridescence: 1, transparent: true, opacity: 0.9 })); spill.rotation.x = -Math.PI / 2; spill.position.set(2.6, 0.045, 4.0); g.add(spill); const flare = new T3.Mesh(new T3.CylinderGeometry(0.03, 0.04, 1.2, 8), mat(0x8a8a8a, { metalness: 0.6 })); flare.position.set(3.4, 0.6, 2.6); g.add(flare); const fire = new T3.Mesh(new T3.ConeGeometry(0.12, 0.35, 12), new T3.MeshBasicMaterial({ color: 0xff7a1a })); fire.position.set(3.4, 1.35, 2.6); g.add(fire); }
    if (mode === "cons") { for (let i = 0; i < 6; i++) { const P = []; for (let k = 0; k <= 30; k++) { const a = k / 30 * 3, x = -2.4 + Math.cos(a + 2) * (0.5 + i * 0.12), z = -1.2 + Math.sin(a + 2) * (0.45 + i * 0.1); P.push([x, envH(x, z) + 0.02, z]); } g.add(GK.line(P, 0x7a5a30, 0.015)); } GK.flora(g, GK.scatter(80, 2.0, 4.5, -3.2, -0.6, envH, null, 33).map((p, i) => [2.0 + (i % 10) * 0.25, envH(2.0 + (i % 10) * 0.25, -3.2 + Math.floor(i / 10) * 0.33), -3.2 + Math.floor(i / 10) * 0.33, 0.6]), "conifer", 0x2f6a2a, 0.3); const fence = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * 6.283; fence.push([-3.0 + Math.cos(a) * 1.9, 0, -1.8 + Math.sin(a) * 1.4]); } g.add(GK.polyline(fence.map(([x, , z]) => [x, envH(x, z) + 0.15, z]), 0xffe14a, 1)); [[1.0, 2.2], [1.4, 2.0]].forEach(([x, z]) => { const p = new T3.Mesh(new T3.BoxGeometry(0.4, 0.02, 0.25), mat(0x1a2a4a, { metalness: 0.6, roughness: 0.2 })); p.position.set(x, envH(x, z) + 0.12, z); p.rotation.x = -0.5; g.add(p); }); const wall = new T3.Mesh(new T3.BoxGeometry(3, 0.25, 0.12), mat(0x9a9a9a)); wall.position.set(-1.5, 0.12, 3.15); g.add(wall); }
    const town = GK.scatter(40, 0.4, 2.2, 1.2, 2.6, envH, null, 34); town.forEach(([x, y, z]) => { const h = GK.house(0.14); h.position.set(x, y, z); g.add(h); });
  }
  const EN = {
    "EN-a": ["The environment: resources", "res", [["land", "Land and soil", [0.5, 0.4, -1.2], "Land for farming, settlement, industry and transport; fertile soils for crops."], ["water", "Water", [-1.0, 0.3, 0.4], "Rivers, lakes, groundwater and the sea: drinking water, irrigation, fishing, transport, HEP."], ["forest", "Forest and vegetation", [-3.4, 0.7, -1.6], "Timber, fuelwood, medicines, food and habitats for wildlife; forests protect soils and regulate climate."], ["mineral", "Minerals and energy", [-2.4, 1.2, -1.2], "Rocks and minerals (limestone, tin, gold, petroleum) for industry and export; sunshine and wind for renewable energy."], ["coast", "The sea and coast", [0, 0.1, 3.6], "Fishing, salt, tourism, ports and offshore oil."], ["people", "Human resources", [1.3, 0.4, 1.9], "People and their skills develop the other resources."]]],
    "EN-b": ["Environmental problems and hazards", "prob", [["deforest", "Deforestation", [-1.8, 0.5, -1.6], "Clearing forest for farms, timber and fuelwood exposes soil to erosion and destroys habitats."], ["gully", "Soil erosion and gullies", [-0.6, 0.45, -1.7], "Bare soil is washed away; deep gullies form (e.g. Agulu–Nanka in Anambra State)."], ["desert", "Desertification", [3.2, 0.5, -1.6], "Overgrazing, over-cultivation and drought turn dry land into desert in the Sahel."], ["oil", "Oil pollution", [2.6, 0.2, 4.0], "Oil spills kill fish and mangroves and poison farmland (Niger Delta)."], ["flare", "Gas flaring and air pollution", [3.4, 1.6, 2.6], "Burning gas releases CO₂ and soot; acid rain damages roofs and crops."], ["flood", "Flooding", [0.6, 0.2, 0.4], "Heavy rain and blocked drains flood rivers and towns (e.g. 2012 and 2022 floods in Nigeria)."], ["waste", "Urban waste and congestion", [1.3, 0.4, 1.9], "Rapid urban growth brings refuse, slums, noise and traffic."]]],
    "EN-c": ["Environmental conservation", "cons", [["affor", "Afforestation and reafforestation", [3.2, 0.5, -1.8], "Planting trees on bare land, shelterbelts and the Great Green Wall across the Sahel."], ["reserve", "Forest and game reserves", [-3.0, 0.8, -1.8], "Protected areas such as Yankari, Kainji Lake National Park, Mole (Ghana), Gola (Sierra Leone)."], ["contour", "Contour ploughing and terracing", [-2.4, 1.1, -1.2], "Ridges across the slope slow runoff and keep soil in place."], ["solar", "Renewable energy", [1.2, 0.5, 2.1], "Solar panels and other clean energy reduce pollution."], ["wall", "Coastal protection", [-1.5, 0.3, 3.15], "Sea walls, groynes and mangrove planting slow coastal erosion (e.g. Eko Atlantic sea wall)."], ["laws", "Laws, education and recycling", [1.6, 0.4, 1.6], "Environmental laws and agencies (NESREA, EPA Ghana), public education, refuse recycling, controlled grazing."]]],
  };
  Object.entries(EN).forEach(([key, [title, mode, feats]]) => GK.tour(key, {
    title, blurb: "One West African landscape seen through three lenses: the resources it provides, the problems people cause or face, and the ways we conserve it.",
    envOpts: OUT, cam: [[2.8, 5.2, 8.8], [-0.2, 0, 0]], fly: [1.2, 1.4, 2.6],
    build(g) { envBase(g, mode); },
    feats: feats.map(([id, n, p, d]) => ({ id, n, p, d })),
    notes: { res: ["Resources are renewable (forests, water, soil, sun) or non-renewable (minerals, fossil fuels)."], prob: ["Hazards may be natural (drought, floods, storms, earthquakes) or caused by people (pollution, deforestation, erosion)."], cons: ["Conservation means wise use of resources so they last for future generations (sustainable development)."] }[mode],
  }));

  /* ===================== HY-a  Ocean basins and salinity ===================== */
  GK.tour("HY-a", {
    title: "Ocean basins and salinity",
    blurb: "A cut through the ocean floor from the continent to the deep sea, showing the main relief features. Salinity figures are in the notes.",
    envOpts: Object.assign({}, OUT, { hdri: "aristea_wreck_puresky" }), cam: [[1.0, 3.2, 8.6], [0.6, -0.6, 0]],
    build(g, S, s) {
      const T3 = T(); const floor = (x) => x < -3.6 ? 0.3 : x < -2.8 ? -0.12 * (x + 3.6) / 0.8 : x < -2.0 ? -0.12 - 1.1 * (x + 2.8) / 0.8 : x < -1.4 ? -1.22 - 0.2 * (x + 2.0) / 0.6 : -1.42 + 0.55 * Math.exp(-(((x - 1.0) / 0.5) ** 2)) + 0.75 * Math.exp(-(((x + 0.6) / 0.15) ** 2)) - 0.6 * Math.exp(-(((x - 3.0) / 0.18) ** 2)) + 0.9 * Math.exp(-(((x - 3.55) / 0.2) ** 2)) * 1.0;
      const h = (x, z) => floor(x) + (BK.fbm(x * 2, z * 2, 5) - 0.5) * 0.05;
      g.add(GK.block({ w: 8, d: 3, y0: -2.0, h, strata: (x, y, z, yt) => (y > yt - 0.05 ? hex3(0xb8a888) : y > yt - 0.35 ? hex3(0x5a5048) : hex3(0x3a3434)), tint: (hn, sl, x) => (x < -3.6 ? GK.tintSavanna(hn, sl, x, 0) : mix3(hex3(0xc8b890), hex3(0x5a6a6a), sm(-3, -1.6, x))) }));
      const w = new T3.Mesh(new T3.BoxGeometry(7.2, 1.42 + 0.0, 3.0), new T3.MeshPhysicalMaterial({ color: 0x2a6f9f, transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false })); w.position.set(0.4, -0.71 + 0.0, 0); g.add(w);
      const surf = GK.water(7.2, 3, 0x2a6f8f, 0.75); surf.position.set(0.4, 0.0, 0); g.add(surf);
    },
    feats: [
      { id: "shelf", n: "Continental shelf", p: [-3.2, 0.0, 1.5], d: "The gently sloping, shallow edge of the continent under the sea, down to about 200 m. Rich fishing grounds and offshore oil (Niger Delta, Ghana's Jubilee field)." },
      { id: "slope", n: "Continental slope", p: [-2.4, -0.6, 1.5], d: "The steep slope from the edge of the shelf down to the deep ocean floor." },
      { id: "plain", n: "Abyssal (deep-sea) plain", p: [-1.2, -1.35, 1.5], d: "The vast, flat floor of the ocean at 3 000–6 000 m, covered by fine ooze." },
      { id: "seamt", n: "Seamount", p: [-0.6, -0.7, 1.5], d: "An underwater volcanic mountain that does not reach the surface." },
      { id: "ridge", n: "Mid-ocean ridge", p: [1.0, -0.85, 1.5], d: "A long underwater mountain chain where plates move apart (e.g. the Mid-Atlantic Ridge)." },
      { id: "trench", n: "Ocean trench (deep)", p: [3.0, -2.0, 1.5], d: "A long, narrow, very deep trough where one plate sinks under another (Mariana Trench, about 11 000 m)." },
      { id: "island", n: "Volcanic island", p: [3.55, -0.2, 1.5], d: "A volcano that rises above sea level (e.g. São Tomé, Bioko, the Canary Islands)." },
    ],
    notes: ["Oceans cover about 71% of the earth: Pacific, Atlantic, Indian, Southern and Arctic.", "Salinity: the amount of dissolved salt, average about 35 parts per thousand (‰). Higher where evaporation is high and few rivers enter (Red Sea about 40‰, Dead Sea over 250‰); lower near river mouths, melting ice and heavy rain (Baltic Sea about 7‰).", "Importance of oceans: fishing, transport, salt, minerals and oil, climate control, tourism."],
  });

  /* ===================== HY-b  Ocean currents ===================== */
  const CUR = [
    ["canary", "Canary current", "cold", [[38, -12], [30, -14], [22, -18], [15, -19]], "Cold current flowing south along north-west Africa; cools and dries the coast — helps form the Sahara's coastal desert."],
    ["guinea", "Guinea current", "warm", [[6, -14], [4.6, -6], [4.5, 2], [3, 8]], "Warm current flowing east along the West African coast; brings warm, humid conditions and heavy rain."],
    ["benguela", "Benguela current", "cold", [[-34, 17], [-26, 13], [-18, 10], [-10, 8]], "Cold current flowing north along south-west Africa; causes the Namib Desert and rich fishing grounds."],
    ["sec", "South Equatorial current", "warm", [[-2, 8], [-4, -10], [-6, -30], [-8, -36]], "Warm current flowing west across the Atlantic near the equator."],
    ["gulf", "Gulf Stream and North Atlantic Drift", "warm", [[25, -80], [35, -74], [42, -50], [50, -25], [58, -10]], "Warm current from the Gulf of Mexico across the Atlantic; keeps north-west Europe's ports ice-free in winter."],
    ["brazil", "Brazil current", "warm", [[-10, -34], [-20, -39], [-30, -46], [-38, -54]], "Warm current flowing south along Brazil."],
    ["agulhas", "Mozambique and Agulhas currents", "warm", [[-12, 42], [-22, 37], [-30, 32], [-36, 24]], "Warm currents flowing south along south-east Africa."],
    ["labrador", "Labrador current", "cold", [[60, -58], [52, -52], [45, -50]], "Cold current from the Arctic; where it meets the Gulf Stream, fog and the Grand Banks fishing grounds form."],
  ];
  GK.def3d("HY-b", {
    title: "Ocean currents",
    blurb: "Ocean currents are large movements of surface water driven by the planetary winds. Warm currents are red, cold currents blue. Pick one to turn the globe to it.",
    envOpts: { bgColor: 0x02040b, fog: false, hemi: 0.2, sun: 3, sunPos: [10, 4, 20], shadow: false, envI: 0.15, hdri: "dikhololo_night" }, cam: [[0, 0.8, 7.0], [1.0, 0, 0]],
    values: { cur: "guinea" }, controls: [{ type: "select", key: "cur", label: "Current", options: CUR.map((x) => [x[0], x[1] + " (" + x[2] + ")"]) }],
    build(S, s) { const T3 = T(), g = BK.group(S, s); g.add(GK.stars()); s.gl = GK.globe(2, { clouds: false }); g.add(s.gl); s.arr = new T3.Group(); s.gl.earth.add(s.arr); s.k = ""; s.ry = 0; },
    update(S, s, c, dt) { const T3 = T(); if (s.k !== c.cur) { s.k = c.cur; BK.dispose(S, s.arr); s.arr = new T3.Group(); s.gl.earth.add(s.arr); CUR.forEach(([id, , kind, pts]) => { const sel = id === c.cur, col = kind === "warm" ? 0xff4a3a : 0x3a8aff, P = []; for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < 8; k++) { const t = k / 8; P.push(GK.ll(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t, 2.03)); } P.push(GK.ll(...pts[pts.length - 1], 2.03)); s.arr.add(GK.line(P, col, sel ? 0.025 : 0.012)); const a = V(...P[P.length - 2]), b = V(...P[P.length - 1]); const tip = new T3.Mesh(new T3.ConeGeometry(sel ? 0.07 : 0.045, sel ? 0.18 : 0.12, 12), new T3.MeshBasicMaterial({ color: col })); tip.position.copy(b); tip.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); s.arr.add(tip); }); const C = CUR.find((x) => x[0] === c.cur), mid = C[3][Math.floor(C[3].length / 2)]; s.ry = mid[1] * Math.PI / 180 - Math.PI / 2; s.rx = mid[0] * Math.PI / 180 * 0.6; }
      s.gl.earth.rotation.y += (s.ry - s.gl.earth.rotation.y) * Math.min(1, dt * 2); s.gl.rotation.x += (s.rx - s.gl.rotation.x) * Math.min(1, dt * 2); s.gl.setSun(S, V(0.3, 0.2, 1)); },
    labels: (s, c) => { if (!s.gl) return []; const C = CUR.find((x) => x[0] === c.cur), mid = C[3][Math.floor(C[3].length / 2)]; const p = V(...GK.ll(mid[0], mid[1], 2.1)); p.applyEuler(s.gl.earth.rotation); p.applyEuler(s.gl.rotation); return [{ id: "cur", p: p.toArray(), t: C[1], col: C[2] === "warm" ? "#ff9a8a" : "#8fd0ff" }]; },
    hud: (s, c) => { const C = CUR.find((x) => x[0] === c.cur); return [{ title: C[1] + " — " + C[2], lines: [[C[4], "#ffd27a", true], "—", "Causes: planetary winds dragging the surface water, differences in temperature and salinity (density), the earth's rotation (deflection), shape of coastlines.", "Effects: warm currents raise temperature and rainfall of coasts; cold currents lower temperature, cause fog and coastal deserts; where warm and cold meet, plankton grows — rich fishing grounds."] }]; },
    story: CUR.slice(0, 5).map((C) => ({ d: 5.5, title: C[1], cap: C[1] + " (" + C[2] + "): " + C[4], set: { cur: C[0] } })),
    draw: GK.fallback("Ocean currents", CUR.map((C) => C[1] + " (" + C[2] + ")")),
  });

  /* ===================== HY-c  Lakes, rivers and lagoons; water as a resource ===================== */
  GK.tour("HY-c", {
    title: "Lakes, rivers and lagoons — water as a resource",
    blurb: "Lakes form in different ways. Compare five kinds side by side, each with a real example, and see how people use water.",
    envOpts: OUT, cam: [[0.4, 4.4, 8.6], [0.4, 0, 0]], fly: [0.8, 1.4, 2.2],
    build(g) {
      const T3 = T(); const lakes = [[-4.0, (x, z) => -0.5 * sm(0.9, 0.5, Math.abs(x + 4.0)) * sm(1.8, 1.2, Math.abs(z)) + 0.6 * sm(0.5, 1.0, Math.abs(x + 4.0))], [-1.8, (x, z) => { const d = Math.hypot(x + 1.8, z); return 0.55 * Math.exp(-(((d - 0.75) / 0.3) ** 2)) - 0.3 * sm(0.7, 0.3, d); }], [0.2, (x, z) => -0.12 * Math.exp(-(((Math.hypot(x - 0.2, z) - 0.55) / 0.1) ** 2)) * (Math.atan2(z, x - 0.2) > -2.2 ? 1 : 0)], [2.2, (x, z) => (z > 0.6 ? -0.15 : 0) + 0.05 * Math.exp(-(((z - 0.55) / 0.06) ** 2))], [4.2, (x, z) => (z < -0.2 ? 0.35 : -0.15 * sm(-0.2, 0.4, -z + 0.6)) + 0.4 * Math.exp(-(((z + 0.2) / 0.08) ** 2)) * sm(0.8, 0.6, Math.abs(x - 4.2))]];
      const h = (x, z) => { let y = 0.15 + (BK.fbm(x, z, 41) - 0.5) * 0.06; for (const [cx, fn] of lakes) if (Math.abs(x - cx) < 1.0) y += fn(x, z) * sm(1.0, 0.8, Math.abs(x - cx)); return y; };
      g.add(GK.terrain({ w: 11, d: 4, nx: 260, h, tint: GK.tintSavanna }));
      const water = (x, z, w, d, y, col = 0x2f6f8a) => { const m = GK.water(w, d, col, 0.9); m.position.set(x, y, z); g.add(m); };
      water(-4.0, 0, 0.9, 2.6, 0.0); water(-1.8, 0, 0.9, 0.9, 0.05); water(2.2, 1.3, 1.9, 1.4, 0.04, 0x3d8a9a); water(4.2, 0.6, 1.8, 1.2, 0.05);
      const ox = new T3.Mesh(new T3.TorusGeometry(0.55, 0.06, 6, 32, Math.PI * 1.3), new T3.MeshPhysicalMaterial({ color: 0x3a7aa0, roughness: 0.1 })); ox.rotation.x = -Math.PI / 2; ox.position.set(0.2, 0.06, 0); g.add(ox);
      const dam = new T3.Mesh(new T3.BoxGeometry(1.6, 0.42, 0.12), mat(0xb8b4ac)); dam.position.set(4.2, 0.3, -0.2); g.add(dam);
    },
    feats: [
      { id: "rift", n: "Tectonic (rift-valley) lake", p: [-4.0, 0.3, 0], d: "Fills a long, deep rift valley (Lake Tanganyika, Lake Malawi)." },
      { id: "crater", n: "Crater / impact lake", p: [-1.8, 0.6, 0], d: "Water fills a volcanic crater or impact crater (Lake Bosumtwi in Ghana — a meteorite crater)." },
      { id: "oxbow", n: "Ox-bow lake (river erosion and deposition)", p: [0.2, 0.25, 0], d: "A cut-off meander on a flood plain." },
      { id: "lagoon", n: "Lagoon", p: [2.2, 0.2, 1.3], d: "Coastal water trapped behind a sand bar (Lagos Lagoon, Keta Lagoon)." },
      { id: "dam", n: "Man-made lake (reservoir)", p: [4.2, 0.6, 0.4], d: "Formed behind a dam (Lake Volta — Akosombo; Kainji Lake; Bumbuna in Sierra Leone; Mount Coffee in Liberia)." },
    ],
    notes: ["Water as a resource: domestic and industrial supply, irrigation (Sokoto–Rima, Kano river projects), hydro-electric power, fishing, transport, tourism and recreation.", "Problems: pollution, water-borne diseases, silting of reservoirs, floods, falling lake levels (Lake Chad has shrunk by about 90% since the 1960s)."],
  });

  /* ===================== VG-a  Major vegetation types ===================== */
  const VEG = [
    ["rain", "Tropical rainforest", 0x24502a, "Tall, dense evergreen trees in layers (emergents up to 60 m, canopy, under-storey); hardwoods such as mahogany, iroko and obeche; lianas and epiphytes. South of about 8°N in wet areas."],
    ["mang", "Mangrove swamp forest", 0x2e5a26, "Salt-tolerant trees with stilt roots along lagoons, estuaries and the Niger Delta."],
    ["guinea", "Guinea savanna", 0x6a8a30, "Tall grasses (1–3 m) with scattered trees (shea butter, locust bean); trees thin out northwards."],
    ["sudan", "Sudan savanna", 0x9a9a40, "Shorter grasses with scattered, drought-resistant trees such as baobab and acacia."],
    ["sahel", "Sahel savanna", 0xb0a050, "Short, sparse grass and thorny shrubs; long dry season; grazing land."],
    ["desert", "Desert", 0xc0a060, "Very sparse, drought-resistant plants (cacti, thorn scrub), mainly around oases."],
    ["mont", "Montane vegetation", 0x3a6a3a, "Temperate-type grassland and forest on high plateaus and mountains (Obudu, Mambilla, Jos)."],
  ];
  GK.tour("VG-a", {
    title: "Major vegetation types",
    blurb: "Travel from the coast to the desert: vegetation changes with rainfall. Pick a belt to fly there.",
    envOpts: OUT, cam: [[0, 6.5, 10.5], [0, 0, 0]], fly: [0.6, 1.6, 2.6],
    build(g) {
      const xs = [-6, -4.3, -2.6, -0.9, 0.8, 2.5, 4.2], h = (x, z) => 0.1 + 0.6 * Math.exp(-(((x - 5.6) / 0.8) ** 2) - ((z / 1.4) ** 2)) + (BK.fbm(x, z, 51) - 0.5) * 0.05;
      g.add(GK.terrain({ w: 14, d: 4, nx: 260, h, tint: (hn, sl, x, z) => { const k = (x + 7) / 12.6; return x > 5.0 ? GK.tintForest(hn, sl, x, z) : mix3(mix3(hex3(0x2f5a26), hex3(0x9a9a40), sm(0.1, 0.55, k)), hex3(0xd8b47a), sm(0.55, 0.85, k)); } }));
      const sea = GK.water(2, 5, 0x2a6f8f, 0.9); sea.position.set(-7.8, 0.06, 0); g.add(sea);
      GK.flora(g, GK.scatter(320, -6.2, -5.0, -1.9, 1.9, h, null, 61), "broad", 0x24502a, 0.42); GK.flora(g, GK.scatter(30, -6.2, -5.0, -1.9, 1.9, h, null, 62), "emergent", 0x2c5a2a, 0.9);
      GK.flora(g, GK.scatter(120, -7.0, -6.3, -1.9, 1.9, h, null, 63), "mangrove", 0x2e5a26, 0.3);
      GK.flora(g, GK.scatter(900, -4.8, -2.8, -1.9, 1.9, h, null, 64), "grass", 0x9aa040, 0.5); GK.flora(g, GK.scatter(40, -4.8, -2.8, -1.9, 1.9, h, null, 65), "broad", 0x4a7a30, 0.4);
      GK.flora(g, GK.scatter(700, -2.6, -0.4, -1.9, 1.9, h, null, 66), "grass", 0xb0a850, 0.3); GK.flora(g, GK.scatter(14, -2.6, -0.4, -1.9, 1.9, h, null, 67), "baobab", 0x6a7a30, 0.6); GK.flora(g, GK.scatter(20, -2.6, -0.4, -1.9, 1.9, h, null, 68), "umbrella", 0x6a7a30, 0.5);
      GK.flora(g, GK.scatter(300, -0.4, 1.8, -1.9, 1.9, h, null, 69), "grass", 0xc0b060, 0.18); GK.flora(g, GK.scatter(40, -0.4, 1.8, -1.9, 1.9, h, null, 70), "shrub", 0x7a7a40, 0.5);
      GK.flora(g, GK.scatter(12, 2.0, 4.6, -1.9, 1.9, h, null, 71), "shrub", 0x8a8a40, 0.3);
      GK.flora(g, GK.scatter(160, 5.0, 6.6, -1.6, 1.6, h, null, 72), "conifer", 0x2f5a2a, 0.35);
      void xs;
    },
    feats: VEG.map(([id, n, , d], i) => ({ id, n, d, p: [[-5.6, 0.9, 0], [-6.7, 0.5, 0.8], [-3.8, 0.6, 0], [-1.5, 0.6, 0], [0.7, 0.4, 0], [3.3, 0.3, 0], [5.6, 1.1, 0]][i] })),
    notes: ["Vegetation belts follow the decrease in rainfall and length of the wet season from the coast northwards.", "Factors: climate (rainfall, temperature), soil, relief and altitude, human activities (farming, bush burning, grazing)."],
  });

  /* ===================== VG-b  Vegetation as a resource and its conservation ===================== */
  GK.def3d("VG-b", {
    title: "Vegetation as a resource and its conservation",
    blurb: "Forests give timber, fuelwood, food and medicine — but cut too fast they disappear. Drag the slider to clear the forest, then switch on conservation measures.",
    envOpts: OUT, cam: [[4.4, 3.6, 6.8], [0, 0, 0]],
    values: { cut: 0.2, cons: 0 },
    controls: [{ type: "slider", key: "cut", label: "Forest cleared", min: 0, max: 1, step: 0.05, fmt: (v) => Math.round(v * 100) + "%" }, { type: "toggle", key: "cons", label: "Conservation measures" }],
    build(S, s) { s.k = ""; },
    update(S, s, c) { const key = Math.round(c.cut * 20) + "|" + c.cons; if (s.k === key) return; s.k = key; const g = BK.group(S, s), T3 = T(), h = (x, z) => 0.15 + (BK.fbm(x * 0.8, z * 0.8, 81) - 0.5) * 0.3;
      g.add(GK.terrain({ w: 8, d: 6, nx: 160, h, tint: (hn, sl, x, z) => { const cleared = (x + 4) / 8 < c.cut; return cleared ? mix3(hex3(0x9a7a4a), hex3(0xa4582c), BK.fbm(x * 3, z * 3, 2)) : GK.tintForest(hn, sl, x, z); } }));
      const trees = GK.scatter(500, -4, 4, -3, 3, h, (x) => (x + 4) / 8 >= c.cut, 82); GK.flora(g, trees, "broad", 0x24502a, 0.42); GK.flora(g, GK.scatter(40, -4, 4, -3, 3, h, (x) => (x + 4) / 8 >= c.cut, 83), "emergent", 0x2c5a2a, 0.9);
      const stumps = GK.scatter(Math.round(200 * c.cut), -4, -4 + 8 * c.cut, -3, 3, h, null, 84); stumps.forEach(([x, y, z]) => { const st = new T3.Mesh(new T3.CylinderGeometry(0.04, 0.05, 0.06, 6), mat(0x8a6a4a)); st.position.set(x, y + 0.03, z); g.add(st); });
      if (c.cut > 0.1) { const lg = new T3.Mesh(new T3.CylinderGeometry(0.06, 0.06, 0.9, 8), mat(0x7a5a3a)); lg.rotation.z = Math.PI / 2; lg.position.set(-3.5, h(-3.5, 2.4) + 0.06, 2.4); g.add(lg); const truck = new T3.Mesh(new T3.BoxGeometry(0.6, 0.25, 0.25), mat(0xc0392b)); truck.position.set(-2.8, h(-2.8, 2.4) + 0.15, 2.4); g.add(truck); }
      if (c.cons) { GK.flora(g, GK.scatter(160, -4, -4 + 8 * c.cut, -3, 3, h, null, 85).map(([x, y, z], i) => [-3.8 + (i % 16) * 8 * c.cut / 16, h(-3.8 + (i % 16) * 8 * c.cut / 16, -2.8 + Math.floor(i / 16) * 0.6), -2.8 + Math.floor(i / 16) * 0.6, 0.5]), "conifer", 0x3a7a2a, 0.3); const P = []; for (let i = 0; i <= 40; i++) { const x = -4 + 8 * c.cut + 0.05, z = -3 + i * 0.15; P.push([x, h(x, z) + 0.12, z]); } g.add(GK.polyline(P, 0xffe14a, 1)); } },
    labels: (s, c) => [c.cut > 0.1 ? { id: "cleared", p: [-4 + 4 * c.cut, 0.4, 0], t: "Cleared land — soil exposed to erosion", col: "#ffb36a" } : null, { id: "forest", p: [2.5, 0.9, 0], t: "Tropical forest", col: "#9fe8b0" }, c.cut > 0.1 ? { id: "log", p: [-3.2, 0.5, 2.4], t: "Lumbering", col: "#e8f1ff" } : null, c.cons ? { id: "plant", p: [-4 + 4 * c.cut, 0.6, -2.2], t: "Reafforestation — rows of young trees", col: "#9fe8b0" } : null, c.cons ? { id: "reserve", p: [-4 + 8 * c.cut, 0.5, 2.6], t: "Forest reserve boundary", col: "#ffe14a" } : null],
    hud: (s, c) => [{ title: Math.round(c.cut * 100) + "% of the forest cleared", lines: [[c.cut > 0.6 ? "Most of the forest is gone: soils erode, rivers silt up, wildlife and medicinal plants are lost, and the local climate becomes drier." : "Forests supply timber (mahogany, iroko, obeche), fuelwood, food, medicines, fodder, rubber, gum arabic and shea butter.", "#ffd27a", true], [c.cons ? "Conservation: reafforestation, forest reserves and national parks, selective logging, agroforestry (taungya), using alternative fuels, laws and education." : "Turn on conservation measures to see how forests are restored.", "#9fe8b0", true], "Causes of vegetation loss: farming (shifting cultivation), lumbering, fuelwood, bush burning, overgrazing, urban growth and mining."] }],
    story: [{ d: 5, cap: "The tropical forest is a valuable resource: timber, food, medicine and a home for wildlife.", set: { cut: 0, cons: 0 } }, { d: 7, cap: "Lumbering, farming and fuelwood collection clear the forest. The bare soil is easily washed away.", tween: { cut: [0, 0.7] }, hl: "cleared" }, { d: 6, cap: "Conservation: replanting trees and protecting forest reserves restore the land.", set: { cons: 1 }, hl: "plant" }],
    draw: GK.fallback("Vegetation as a resource", ["Timber, fuelwood, food, medicine", "Deforestation causes soil erosion", "Conservation: reafforestation, reserves, laws"]),
  });

  /* ===================== SO-a  Soil formation and the soil profile ===================== */
  const HOR = [["O", "O horizon — humus / litter", 0x2a1e14, 0.06, "Fallen leaves and decaying organic matter (humus): dark, rich in plant food."], ["A", "A horizon — topsoil", 0x4a3420, 0.28, "Dark, crumbly soil with humus, roots and soil organisms; minerals are washed down (leaching / eluviation)."], ["B", "B horizon — subsoil", 0x9a5a2a, 0.36, "Lighter, with clay and iron washed in from above (illuviation); may form a hard laterite pan in the tropics."], ["C", "C horizon — weathered parent rock", 0xb8a07a, 0.38, "Broken, partly weathered pieces of the parent rock."], ["R", "R — bedrock (parent rock)", 0x7a7068, 0.5, "Solid rock from which the soil forms."]];
  GK.def3d("SO-a", {
    title: "Soil formation and the soil profile",
    blurb: "A soil pit cut through the layers (horizons) of a tropical soil. Drag time forward to see soil form from bare rock.",
    envOpts: OUT, cam: [[3.0, 1.8, 5.4], [0.2, -0.3, 0]],
    values: { t: 1, hz: "A" },
    controls: [{ type: "slider", key: "t", label: "Time (soil formation)", min: 0, max: 1, step: 0.05 }, { type: "tabs", key: "hz", label: "Horizon", options: HOR.map((x) => [x[0], x[0]]) }],
    build(S, s) { s.k = -1; },
    update(S, s, c) { const key = Math.round(c.t * 20); if (s.k === key) return; s.k = key; const g = BK.group(S, s), T3 = T(), k = c.t, th = HOR.map((x, i) => (i === 4 ? 0.5 : x[3] * Math.max(0, Math.min(1, k * 1.6 - (3 - i) * 0.15)))); let y = 0.0; const tops = []; for (let i = 0; i < 5; i++) { tops.push(y); y -= th[i]; } s.tops = tops; s.th = th;
      const strata = (x, yy) => { for (let i = 0; i < 4; i++) if (yy > tops[i] - th[i] && th[i] > 0.005) { const col = hex3(HOR[i][2]); return col.map((v) => v * (0.85 + 0.3 * BK.noise3(x * 12, yy * 20, i))); } return hex3(0x7a7068).map((v) => v * (0.85 + 0.25 * BK.noise3(x * 6, yy * 6, 9))); };
      g.add(GK.block({ w: 3, d: 2, y0: -1.6, h: (x, z) => 0.0 + (BK.fbm(x * 3, z * 3, 1) - 0.5) * 0.02, strata: (x, yy) => strata(x, yy), tint: () => (k > 0.3 ? hex3(0x4f7a2a) : hex3(0x7a7068)), nx: 90, ny: 80 }));
      if (k > 0.3) GK.flora(g, GK.scatter(260, -1.45, 1.45, -0.95, 0.95, () => 0, null, 91), "grass", 0x5a8a30, 0.25 * k);
      if (k > 0.5) { const t = GK.tree(0.9, 4, 0x3a6a2a); t.position.set(-0.8, 0, -0.4); g.add(t); for (let i = 0; i < 6; i++) { const P = [[-0.8 + (i - 2.5) * 0.06, 0, 1.02]]; for (let j = 1; j <= 6; j++) P.push([-0.8 + (i - 2.5) * 0.12 * j / 2, -j * 0.1 * k, 1.02]); g.add(GK.line(P, 0xd8c8a8, 0.006)); } }
      if (k > 0.4) { for (let i = 0; i < 25; i++) { const p = new T3.Mesh(new T3.SphereGeometry(0.03 + Math.random() * 0.04, 6, 5), mat(0x9a9088)); p.position.set(-1.4 + Math.random() * 2.8, tops[3] - Math.random() * th[3], 1.0); g.add(p); } } },
    labels: (s, c) => (s.tops ? HOR.map(([id, n], i) => ({ id, p: [1.5, s.tops[i] - (i === 4 ? 0.2 : s.th[i] / 2), 1.0], t: n, col: c.hz === id ? "#ffd27a" : "#e8f1ff", dx: 70, hide: i < 4 && s.th[i] < 0.01 })) : []),
    hud: (s, c) => { const H = HOR.find((x) => x[0] === c.hz); return [{ title: H[1], lines: [[H[4], "#ffd27a", true], "—", "Soil = weathered rock particles + humus + water + air + living organisms.", "Factors of soil formation: parent rock, climate, relief, living organisms (vegetation, animals, people) and time.", "Tropical soils: heavy rain leaches nutrients (laterite and ferruginous soils); savanna soils are thinner and sandier; flood-plain alluvium is fertile."] }]; },
    story: [{ d: 5, cap: "Soil begins as bare rock. Weathering breaks the rock into small pieces.", set: { t: 0.1, hz: "R" }, hl: "R" }, { d: 7, cap: "Plants colonise the broken rock. Dead leaves rot into humus and the layers deepen.", tween: { t: [0.1, 1] } }, { d: 5, cap: "A mature soil has distinct horizons: O, A, B, C over the bedrock.", set: { hz: "A" }, hl: "A" }, { d: 5, cap: "In the B horizon, iron and clay washed down from the topsoil collect — in the tropics this can harden into laterite.", set: { hz: "B" }, hl: "B" }],
    draw: GK.fallback("Soil profile", HOR.map((h) => h[1])),
  });

  /* ===================== SO-b  Soil erosion and conservation ===================== */
  GK.tour("SO-b", {
    title: "Soil erosion and conservation",
    blurb: "Rain falling on a bare slope washes the topsoil away. Compare the types of soil erosion with the methods farmers use to prevent it.",
    envOpts: OUT, cam: [[4.6, 3.4, 6.6], [0, 0.4, 0]], variants: [["erosion", "Soil erosion"], ["cons", "Conservation"]], vlabel: "Show",
    build(g, S, s, c) {
      const T3 = T(), ero = c.v === "erosion", slope = (x, z) => 0.1 + Math.max(0, -x + 3) * 0.28;
      const gully = (x, z) => ero ? 0.22 * Math.exp(-(((z - 0.9 - 0.1 * Math.sin(x * 3)) / 0.12) ** 2)) * sm(-3, 2, -x) : 0;
      const rills = (x, z) => ero && z < 0 ? 0.03 * Math.max(0, Math.sin(z * 18)) * sm(2.8, 0, x) : 0;
      const terr = (x, z) => (!ero && x < 0 ? Math.floor(slope(x, z) / 0.25) * 0.25 - slope(x, z) : 0);
      const h = (x, z) => slope(x, z) + terr(x, z) * (x < 0 ? 1 : 0) - gully(x, z) - rills(x, z) + (BK.fbm(x, z, 3) - 0.5) * 0.04;
      g.add(GK.block({ w: 6, d: 4, h, strata: (x, y, z, yt) => (y > yt - 0.12 ? hex3(0x4a3420) : y > yt - 0.5 ? hex3(0x9a5a2a) : hex3(0xb8a07a)), tint: (hn, sl, x, z) => (ero ? mix3(hex3(0xa4582c), hex3(0x7a5a3a), BK.fbm(x * 2, z * 2, 1)) : x < 0 ? hex3(0x5a8a30) : mix3(hex3(0x4f7a2a), hex3(0x6a8a3a), BK.fbm(x * 3, z * 3, 2))) }));
      if (!ero) { for (let i = 0; i < 9; i++) { const P = []; for (let k = 0; k <= 20; k++) { const z = -1.9 + k * 0.19, x = 0.4 + i * 0.28; P.push([x, h(x, z) + 0.03, z]); } g.add(GK.line(P, 0x6a4a2a, 0.02)); } GK.flora(g, GK.scatter(60, -2.9, -0.2, -1.9, 1.9, h, null, 101).map(([x, y, z]) => [x, y, z, 0.6]), "shrub", 0x4a8a2a, 0.3); GK.flora(g, GK.scatter(12, 2.6, 2.95, -1.9, 1.9, h, null, 102), "broad", 0x2f5e26, 0.4); }
      else { const sp = GK.water(1.4, 0.8, 0x8a6a3a, 0.9); sp.position.set(3.4, 0.04, 0.9); g.add(sp); }
      s.rain = GK.particles(400, 0x9ac8ff, 0.03, 0.8); g.add(s.rain); s.rq = Array.from({ length: 400 }, () => [Math.random() * 6 - 3, Math.random(), Math.random() * 4 - 2]); s.h = h;
      s.mud = ero ? GK.particles(200, 0x8a5a2a, 0.04, 0.9) : null; if (s.mud) { g.add(s.mud); s.mq = Array.from({ length: 200 }, () => [Math.random(), Math.random() * 0.2 - 0.1]); }
    },
    tick(S, s, c, dt) { if (s.rain) { const P = s.rain.pos; s.rq.forEach((q, i) => { q[1] = (q[1] + dt * 1.4) % 1; P.set([q[0], 2.2 - (2.2 - s.h(q[0], q[2])) * q[1], q[2]], i * 3); }); s.rain.flush(); } if (s.mud) { const P = s.mud.pos; s.mq.forEach((q, i) => { q[0] = (q[0] + dt * 0.25) % 1; const x = -2.8 + q[0] * 5.8, z = 0.9 + q[1] + 0.1 * Math.sin(x * 3); P.set([x, s.h(x, z) + 0.03, z], i * 3); }); s.mud.flush(); } },
    feats: (c) => c.v === "erosion" ? [
      { id: "splash", n: "Splash erosion", p: [-2.0, 1.6, -1.0], d: "Raindrops hit bare soil and throw particles into the air." },
      { id: "sheet", n: "Sheet erosion", p: [1.2, 0.7, -1.4], d: "A thin layer of topsoil is washed off evenly over a wide area." },
      { id: "rill", n: "Rill erosion", p: [1.6, 0.5, -0.5], d: "Water collects into many small channels which cut into the soil." },
      { id: "gully", n: "Gully erosion", p: [-0.6, 0.8, 0.9], d: "Rills join and deepen into large gullies that destroy farmland, roads and houses (south-east Nigeria)." },
      { id: "silt", n: "Silting of rivers", p: [3.4, 0.2, 0.9], d: "Eroded soil is deposited in streams and reservoirs, causing floods." },
    ] : [
      { id: "terrace", n: "Terracing", p: [-1.6, 1.5, -1.0], d: "Steps cut into steep slopes hold water and soil (e.g. on the Jos Plateau and Obudu)." },
      { id: "contour", n: "Contour ploughing / ridging", p: [1.4, 0.55, -1.0], d: "Ridges made across the slope, along the contours, slow down runoff." },
      { id: "cover", n: "Cover crops and mulching", p: [-1.4, 1.0, 1.0], d: "Plants and mulch protect the soil from the impact of raindrops." },
      { id: "belt", n: "Shelter belts and afforestation", p: [2.8, 0.6, 0.6], d: "Rows of trees break the wind and bind the soil with their roots." },
    ],
    notes: ["Causes: heavy rainfall on bare soil, steep slopes, deforestation, overgrazing, bush burning, poor farming methods (ploughing down the slope), construction.", "Other conservation methods: crop rotation, strip cropping, controlled grazing, check dams in gullies, avoiding bush burning, adding manure."],
  });
})();
