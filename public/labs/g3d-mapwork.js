/* g3d-mapwork.js — Topic 1 Map Work. One shared fictional West African landscape ("Sheet 1 · Okeho", 1 : 50 000)
   shown as a 3D model and as a matching contoured topographical map. 1 world unit = 1 km; heights ×3 vertical exaggeration. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, GK = window.GK, f = MK.fmt;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const VEX = 3, X0 = -5, X1 = 5, Z0 = -4, Z1 = 4;

  /* ---------- the landscape (metres) ---------- */
  const segD = (px, pz, ax, az, bx, bz) => { const vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz))); return Math.hypot(px - ax - t * vx, pz - az - t * vz); };
  const pathD = (x, z, P) => { let d = 1e9; for (let i = 0; i < P.length - 1; i++) d = Math.min(d, segD(x, z, P[i][0], P[i][1], P[i + 1][0], P[i + 1][1])); return d; };
  const RIVER = [[0.6, -1.75], [0.35, -0.9], [0.62, -0.1], [0.12, 0.75], [0.62, 1.55], [0.18, 2.35], [0.48, 3.05], [0.45, 3.45]];
  const TRIBS = [[[-2.1, -1.85], [-1.2, -1.05], [-0.3, -0.55], [0.4, -0.45]], [[2.35, -1.05], [1.7, -0.55], [1.0, -0.05], [0.6, 0.0]], [[-1.7, 0.35], [-0.8, 0.85], [0.15, 0.95]], [[1.9, 1.3], [1.2, 1.25], [0.6, 1.5]]];
  const PTS = { A: [3.0, -2.4, "Trig. station on the plateau"], B: [0.6, 1.62, "Okeho town bridge"], C: [-2.8, 1.0, "Inselberg summit"], D: [-2.75, -2.2, "Ridge summit"], E: [3.6, 1.25, "Conical hill"], F: [0.6, -1.75, "River source near the col"], G: [-3.6, 2.4, "Farmstead on the plain"] };
  function hm(x, z) {
    let h = 130 - 32 * z;
    const dr = segD(x, z, -4.6, -3.2, -0.6, -1.25); h += 310 * Math.exp(-Math.pow(dr / 0.75, 2));
    for (let k = 0; k < 5; k++) { const sx = -4.0 + k * 0.85, sz = -2.9 + k * 0.43; const ds = segD(x, z, sx, sz, sx + 0.55, sz + 0.75); h += 70 * Math.exp(-Math.pow(ds / 0.26, 2)); }
    const dp = Math.hypot((x - 3.0) / 1.55, (z + 2.3) / 1.2); h += 300 / (1 + Math.pow(dp, 8)) - (z > -2.3 ? 0 : 0);
    const di = Math.hypot(x + 2.8, z - 1.0); h += 230 * Math.exp(-Math.pow(di / 0.38, 2.4));
    const dc = Math.hypot(x - 3.6, z - 1.25); h += Math.max(0, 270 * (1 - dc / 0.75));
    const rv = pathD(x, z, RIVER); let cut = 55 * Math.exp(-Math.pow(rv / 0.22, 2)) + 45 * Math.exp(-Math.pow(rv / 0.85, 2));
    TRIBS.forEach((P) => { const d = pathD(x, z, P); cut += 35 * Math.exp(-Math.pow(d / 0.2, 2)); });
    h -= cut * Math.max(0.15, Math.min(1, (h - 10) / 160));
    h += (BK.fbm(x * 0.8 + 3, z * 0.8, 2.2) - 0.5) * 40;
    if (z > 2.4) { const k = Math.min(1, (z - 2.4) / 1.2); h = h * (1 - k) + (10 - 60 * Math.max(0, z - 3.5)) * k; }
    const dl = Math.hypot((x - 0.1) / 2.5, (z - 3.2) / 0.2); if (dl < 1.6) { const k = Math.max(0, Math.min(1, (1.6 - dl) / 0.6)); h = h * (1 - k) + -3 * k; }
    const db = Math.abs(z - 3.5) / 0.08; if (db < 1.5 && x > -3.4 && x < 3.6) h = Math.max(h, 3.5 * Math.max(0, 1 - db * db / 2.25) + 0.5);
    return h;
  }
  const Y = (x, z) => hm(x, z) * VEX / 1000;
  /* put summit points exactly on the local high point */
  ["A", "C", "D", "E"].forEach((k) => { let [bx, bz] = PTS[k], best = hm(bx, bz); const [x0, z0] = PTS[k]; for (let i = -12; i <= 12; i++) for (let j = -12; j <= 12; j++) { const x = x0 + i * 0.025, z = z0 + j * 0.025, h = hm(x, z); if (h > best) { best = h; bx = x; bz = z; } } PTS[k][0] = bx; PTS[k][1] = bz; });
  GK.okeho = { hm, Y, PTS, RIVER, TRIBS, VEX };

  /* cultural features (km) */
  const ROAD_MAIN = [[-5, 1.9], [-3.4, 2.05], [-1.8, 1.75], [-0.4, 1.7], [0.6, 1.62], [1.6, 1.85], [2.8, 2.3], [5, 2.5]];
  const ROAD_N = [[0.6, 1.62], [0.9, 0.6], [1.4, -0.4], [1.75, -1.2], [2.3, -2.0], [3.0, -2.4]];
  const RAIL = [[0.2, -4], [0.05, -2.6], [0.85, -1.3], [0.95, 0.0], [0.95, 1.3], [1.05, 2.4], [1.4, 3.3]];
  const PATHS = [[[-2.8, 1.0], [-2.2, 1.45], [-1.8, 1.75]], [[-3.6, 2.4], [-3.4, 2.05]], [[3.6, 1.25], [3.0, 1.9], [2.8, 2.3]]];
  const rr = BK.rng(11), TOWN = [], VILLAGE = [], FARMS = [];
  for (let i = 0; i < 70; i++) { const a = rr() * 6.28, r = Math.sqrt(rr()) * 0.42; TOWN.push([0.75 + Math.cos(a) * r * 1.2, 1.75 + Math.sin(a) * r * 0.8]); }
  for (let i = 0; i < 16; i++) { const t = i / 15, p = [-1.8 + (2.8 - 1.6) * 0 + (-4.6 + 2.8 * t) * 0, 0]; const x = -4.4 + 2.4 * t; VILLAGE.push([x, 1.95 + 0.12 * Math.sin(i * 1.7) + (i % 2 ? 0.1 : -0.1)]); void p; }
  for (let i = 0; i < 14; i++) FARMS.push([-4.6 + rr() * 3.4, 2.5 + rr() * 0.8]);
  const FOREST = { c: [3.0, -2.3], r: [1.3, 0.9] }, COCOA = { x0: 1.6, x1: 2.9, z0: -0.3, z1: 0.9 };

  /* ---------- builders ---------- */
  function instTrees(g, pts, h = 0.12, col = 0x2f5e26, trunk = 0x5a4030) {
    const T3 = T(), n = pts.length; if (!n) return;
    const can = new T3.InstancedMesh(new T3.IcosahedronGeometry(0.5, 1), new T3.MeshStandardMaterial({ color: col, roughness: 0.9 }), n);
    const tr = new T3.InstancedMesh(new T3.CylinderGeometry(0.08, 0.12, 1, 6), new T3.MeshStandardMaterial({ color: trunk, roughness: 0.9 }), n);
    const m4 = new T3.Matrix4(), q = new T3.Quaternion(), c = new T3.Color();
    pts.forEach(([x, z, s = 1], i) => { const y = Y(x, z), k = h * s; m4.compose(V(x, y + k * 0.9, z), q, V(k * 0.9, k * 0.75, k * 0.9)); can.setMatrixAt(i, m4); c.setHex(col).offsetHSL(0, 0, (BK.noise3(x * 3, z * 3, 1) - 0.5) * 0.12); can.setColorAt(i, c); m4.compose(V(x, y + k * 0.3, z), q, V(k * 0.5, k * 0.6, k * 0.5)); tr.setMatrixAt(i, m4); });
    can.castShadow = tr.castShadow = true; g.add(can, tr);
  }
  function drape(pts, y = 0.012) { return pts.map(([x, z]) => [x, Y(x, z) + y, z]); }
  function densify(P, step = 0.08) { const out = []; for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step)); for (let k = 0; k < n; k++) out.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]); } out.push(P[P.length - 1]); return out; }
  /* build the whole sheet into group g. o: {map: bool (drape topo texture), layers: {roads, settle, landuse}} */
  function buildSheet(g, o = {}) {
    const T3 = T(), L = Object.assign({ roads: true, settle: true, landuse: true, rivers: true }, o.layers || {});
    const ter = GK.terrain({ w: 10, d: 8, nx: GK.tier === "low" ? 120 : 200, h: Y, map: o.map ? sheetTexture() : null, tint: o.map ? () => [1, 1, 1] : (hn, sl, x, z) => { const m = hm(x, z); if (m < 2) return GK.hex3(0xd9c79a); return GK.tintSavanna(hn, sl, x, z); }, bump: o.map ? 0.3 : 1.2 });
    g.add(ter);
    const sea = GK.water(16, 6, 0x2a6f8f, 0.9); sea.position.set(0, 0.001, 6.4); g.add(sea);
    const lag = GK.water(5.2, 0.5, 0x3d8a9a, 0.8); lag.position.set(0.1, -0.003, 3.2); g.add(lag);
    if (L.rivers) { g.add(GK.line(drape(densify(RIVER), 0.004), 0x2f74b5, 0.022)); TRIBS.forEach((P) => g.add(GK.line(drape(densify(P), 0.004), 0x3a82c0, 0.012))); }
    if (L.roads) {
      g.add(GK.line(drape(densify(ROAD_MAIN), 0.01), 0xc0392b, 0.016)); g.add(GK.line(drape(densify(ROAD_N), 0.01), 0xd8892b, 0.012));
      g.add(GK.line(drape(densify(RAIL), 0.012), 0x2a2a2a, 0.012)); PATHS.forEach((P) => g.add(GK.line(drape(densify(P), 0.006), 0xe0c890, 0.006)));
      const br = new T3.Mesh(new T3.BoxGeometry(0.22, 0.012, 0.05), new T3.MeshStandardMaterial({ color: 0x9a9a9a })); br.position.set(0.6, Y(0.6, 1.62) + 0.03, 1.62); br.rotation.y = -0.25; g.add(br);
    }
    if (L.settle) {
      const hs = new T3.InstancedMesh(new T3.BoxGeometry(1, 0.7, 0.8), new T3.MeshStandardMaterial({ color: 0xe9e1cf, roughness: 0.85 }), TOWN.length + VILLAGE.length + FARMS.length);
      const rf = new T3.InstancedMesh(new T3.ConeGeometry(0.75, 0.45, 4), new T3.MeshStandardMaterial({ color: 0x9a3b28, roughness: 0.7 }), TOWN.length + VILLAGE.length + FARMS.length);
      const m4 = new T3.Matrix4(), q = new T3.Quaternion(); let i = 0;
      [[TOWN, 0.07], [VILLAGE, 0.06], [FARMS, 0.06]].forEach(([arr, s]) => arr.forEach(([x, z]) => { const y = Y(x, z); q.setFromAxisAngle(V(0, 1, 0), BK.noise3(x * 9, z * 9, 2) * 3); m4.compose(V(x, y + s * 0.35, z), q, V(s, s, s)); hs.setMatrixAt(i, m4); m4.compose(V(x, y + s * 0.92, z), q.clone().multiply(new T3.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.PI / 4)), V(s, s, s)); rf.setMatrixAt(i, m4); i++; }));
      hs.castShadow = rf.castShadow = true; g.add(hs, rf);
    }
    if (L.landuse) {
      const fr = BK.rng(5), fp = []; for (let i = 0; i < 420; i++) { const a = fr() * 6.28, r = Math.sqrt(fr()); const x = FOREST.c[0] + Math.cos(a) * r * FOREST.r[0], z = FOREST.c[1] + Math.sin(a) * r * FOREST.r[1]; if (hm(x, z) > 330) fp.push([x, z, 0.8 + fr() * 0.5]); } instTrees(g, fp, 0.11, 0x24502a);
      const cp = []; for (let x = COCOA.x0; x <= COCOA.x1; x += 0.09) for (let z = COCOA.z0; z <= COCOA.z1; z += 0.09) cp.push([x, z, 0.7]); instTrees(g, cp, 0.08, 0x3d7a2a);
      const sp = []; for (let i = 0; i < 160; i++) { const x = -4.8 + fr() * 9.6, z = -3.8 + fr() * 6.0; const m = hm(x, z); if (m > 20 && m < 300 && Math.hypot(x - 0.75, z - 1.75) > 0.6) sp.push([x, z, 0.6 + fr() * 0.6]); } instTrees(g, sp, 0.1, 0x5a7a30);
      const q = new T3.Mesh(new T3.CylinderGeometry(0.16, 0.12, 0.05, 16), new T3.MeshStandardMaterial({ color: 0xb8a890, roughness: 1 })); q.position.set(-2.45, Y(-2.45, 1.25) + 0.01, 1.25); g.add(q);
    }
    const trig = new T3.Mesh(new T3.ConeGeometry(0.04, 0.09, 3), new T3.MeshStandardMaterial({ color: 0xffffff })); trig.position.set(3.0, Y(3.0, -2.4) + 0.05, -2.4); g.add(trig);
    return ter;
  }
  /* cached topographical sheet canvas */
  let SHEET = null;
  const sheetFeatures = (g, X, Z) => {
    const line = (P, col, w, dash) => { g.save(); g.strokeStyle = col; g.lineWidth = w; if (dash) g.setLineDash(dash); g.beginPath(); P.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)))); g.stroke(); g.restore(); };
    g.fillStyle = "rgba(159,197,232,1)"; g.fillRect(X(-5), Z(3.5), X(5) - X(-5), Z(4) - Z(3.5));
    line(densify(RIVER), "#2f74b5", 2.2); TRIBS.forEach((P) => line(densify(P), "#3a82c0", 1.2));
    g.save(); g.fillStyle = "rgba(40,110,40,.22)"; g.beginPath(); g.ellipse(X(FOREST.c[0]), Z(FOREST.c[1]), (X(FOREST.r[0]) - X(0)), (Z(FOREST.r[1]) - Z(0)), 0, 0, 6.3); g.fill(); g.restore();
    g.fillStyle = "#2e6b2e"; for (let x = COCOA.x0; x <= COCOA.x1; x += 0.18) for (let z = COCOA.z0; z <= COCOA.z1; z += 0.18) { g.beginPath(); g.arc(X(x), Z(z), 1.3, 0, 6.3); g.fill(); }
    line(ROAD_MAIN, "#000", 4); line(ROAD_MAIN, "#e0442e", 2.6); line(ROAD_N, "#000", 3); line(ROAD_N, "#f0a33b", 1.8); line(RAIL, "#111", 2.4); line(RAIL, "#fff", 1.2, [4, 4]); PATHS.forEach((P) => line(P, "#7a4a20", 1, [3, 2]));
    g.fillStyle = "#222"; TOWN.forEach(([x, z]) => g.fillRect(X(x) - 1.5, Z(z) - 1.5, 3, 3)); VILLAGE.forEach(([x, z]) => g.fillRect(X(x) - 1.5, Z(z) - 1.5, 3, 3)); FARMS.forEach(([x, z]) => g.fillRect(X(x) - 1.5, Z(z) - 1.5, 3, 3));
    g.fillStyle = "#000"; g.beginPath(); g.moveTo(X(3.0), Z(-2.4) - 4); g.lineTo(X(3.0) - 3.5, Z(-2.4) + 2.5); g.lineTo(X(3.0) + 3.5, Z(-2.4) + 2.5); g.fill(); g.font = "700 9px 'IBM Plex Sans',sans-serif"; g.fillText(String(Math.round(hm(PTS.A[0], PTS.A[1]))), X(PTS.A[0]) + 5, Z(PTS.A[1]) + 3);
    g.font = "italic 700 10px 'IBM Plex Sans',sans-serif"; g.fillStyle = "#222"; g.fillText("OKEHO", X(1.15), Z(1.5)); g.font = "italic 9px 'IBM Plex Sans',sans-serif"; g.fillText("Ilu", X(-4.4), Z(1.8)); g.fillStyle = "#1d5f9a"; g.fillText("R. Oba", X(0.1), Z(-0.9)); g.fillText("Lagoon", X(-1.2), Z(3.28)); g.fillStyle = "#2a5a2a"; g.fillText("Forest Reserve", X(2.3), Z(-2.85)); g.fillText("Cocoa", X(1.9), Z(1.05));
  };
  const SHEET_O = { x0: X0, z0: Z0, x1: X1, z1: Z1, hm, ci: 20, sea: 0, grid: 1, features: sheetFeatures, res: 110 };
  function sheet() { if (SHEET) return SHEET; const c = BK.cv(500, 400), g = c.getContext("2d"); GK.drawTopo(g, Object.assign({}, SHEET_O, { px: 0, py: 0, pw: 500, ph: 400 })); SHEET = c; return c; }
  function sheetTexture() { const t = new (T().CanvasTexture)(sheet()); t.colorSpace = T().SRGBColorSpace; t.anisotropy = 8; return t; }
  /* draw the map inset on the HUD; returns mapping functions */
  function inset(ctx, B, o = {}) {
    const px = o.x == null ? 12 : o.x, py = (o.y == null ? 400 - 12 - (o.h || 176) : o.y) - (GK.storyOn ? 64 : 0), pw = o.w || 220, ph = o.h || 176;
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 10; ctx.drawImage(sheet(), px, py, pw, ph); ctx.restore(); ctx.strokeStyle = "#111"; ctx.lineWidth = 1.5; ctx.strokeRect(px, py, pw, ph);
    const X = (x) => px + (x - X0) / (X1 - X0) * pw, Z = (z) => py + (z - Z0) / (Z1 - Z0) * ph;
    if (o.north !== false) { ctx.fillStyle = "#111"; ctx.beginPath(); ctx.moveTo(px + pw - 14, py + 8); ctx.lineTo(px + pw - 19, py + 22); ctx.lineTo(px + pw - 14, py + 18); ctx.lineTo(px + pw - 9, py + 22); ctx.fill(); ctx.font = "700 9px 'IBM Plex Sans',sans-serif"; ctx.textAlign = "center"; ctx.fillText("N", px + pw - 14, py + 32); ctx.textAlign = "left"; }
    return { X, Z, px, py, pw, ph };
  }
  const markPt = (ctx, M, x, z, lab, col = "#d0021b") => { ctx.fillStyle = col; ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(M.X(x), M.Z(z), 4, 0, 6.3); ctx.fill(); ctx.stroke(); if (lab) { ctx.font = "800 10px 'IBM Plex Sans',sans-serif"; ctx.fillStyle = "#fff"; ctx.strokeStyle = "rgba(0,0,0,.8)"; ctx.lineWidth = 3; ctx.strokeText(lab, M.X(x) + 6, M.Z(z) - 4); ctx.fillText(lab, M.X(x) + 6, M.Z(z) - 4); } };
  const ptLabel = (k, col = "#ffd27a", dy = -30) => { const p = PTS[k]; return { id: k, p: [p[0], Y(p[0], p[1]) + 0.02, p[1]], t: k + " · " + p[2], col, dy }; };
  const ENV = { hdri: "spruit_sunrise", sky: true, sunPos: [9, 8, 7], shadowExtent: 7, fogNear: 25, fogFar: 70 };
  const pin = (g, x, z, col) => { const p = GK.pin(col, 0.32); p.position.set(x, Y(x, z), z); g.add(p); return p; };
  const dist = (a, b) => Math.hypot(PTS[b][0] - PTS[a][0], PTS[b][1] - PTS[a][1]);
  const brg = (a, b) => { const dx = PTS[b][0] - PTS[a][0], dn = -(PTS[b][1] - PTS[a][1]); return (Math.atan2(dx, dn) * 180 / Math.PI + 360) % 360; };
  const POINT_OPTS = Object.keys(PTS).map((k) => [k, k + " — " + PTS[k][2]]);
  const RF = { 25000: "1 : 25 000", 50000: "1 : 50 000", 100000: "1 : 100 000" };
  const curveLen = (P) => { let s = 0; for (let i = 0; i < P.length - 1; i++) s += Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]); return s; };

  /* ===================== MW-a  Maps: meaning, types, uses ===================== */
  GK.def3d("MW-a", {
    title: "Maps — from landscape to topographical map",
    blurb: "A fictional West African landscape and its 1 : 50 000 topographical map. Switch between the real landscape, the map draped over it, and a land-use (thematic) map.",
    envOpts: ENV, cam: [[3.6, 7.0, 9.8], [1.4, 0.2, 0.5]],
    values: { view: "land" },
    controls: [{ type: "tabs", key: "view", label: "Show", options: [["land", "3D landscape"], ["topo", "Topographical map draped"], ["theme", "Thematic: land use"]] }],
    build(S, s) { s.key = ""; },
    update(S, s, c) { if (s.key !== c.view) { s.key = c.view; const g = BK.group(S, s); buildSheet(g, { map: c.view === "topo", layers: { landuse: c.view !== "topo" } }); if (c.view === "theme") { const T3 = T(); [[FOREST.c[0], FOREST.c[1], 2.6, 1.8, 0x1f7a3a], [2.25, 0.3, 1.3, 1.2, 0x7ac043], [0.75, 1.75, 1.0, 0.7, 0xd0021b], [-3.0, 2.6, 3.6, 1.0, 0xf2c94c]].forEach(([x, z, w, d, col]) => { const m = new T3.Mesh(new T3.PlaneGeometry(w, d, 24, 18), new T3.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.38, depthWrite: false })); m.rotation.x = -Math.PI / 2; const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const wx = x + p.getX(i), wz = z - p.getY(i); p.setZ(i, Y(wx, wz) + 0.03); } m.position.set(x, 0, z); g.add(m); }); } } },
    overlay(ctx, s, c, S, B) { if (c.view !== "topo") return; const M = inset(ctx, B); ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.fillRect(M.px, M.py - 20, M.pw, 18); ctx.fillStyle = "#111"; ctx.font = "700 10px 'IBM Plex Sans',sans-serif"; ctx.fillText("SHEET 1 · OKEHO · 1 : 50 000 · contours 20 m", M.px + 6, M.py - 7); },
    labels: (s, c) => [ptLabel("A"), { p: [0.75, Y(0.75, 1.75) + 0.05, 1.75], t: "Settlement (nucleated town)", col: "#ff9a8a" }, { p: [3.0, Y(3, -2.0) + 0.1, -2.0], t: c.view === "theme" ? "Forest reserve" : "Plateau with forest", col: "#9fe8b0" }, { p: [0.3, Y(0.3, -0.8) + 0.02, -0.8], t: "River valley", col: "#8fd0ff" }, { p: [0.1, 0, 3.25], t: "Lagoon behind a sand bar", col: "#8fd0ff", dy: 24 }, { p: [-2.8, Y(-2.8, 1.0) + 0.02, 1.0], t: "Inselberg", col: "#ffd27a" }],
    hud: (s, c) => [{ title: { land: "The landscape", topo: "Topographical map", theme: "Thematic map" }[c.view], lines: [{ land: "A map shows this landscape on a flat sheet, reduced to scale, using symbols.", topo: "Contours show height and shape of the land; symbols show roads, rivers, settlements and vegetation.", theme: "A thematic map shows one theme — here land use: forest, plantation, settlement, farmland." }[c.view], "—", "Marginal information: title, scale (RF, statement, linear), key, north point, grid, contour interval, date.", "Types: topographical, atlas, cadastral, thematic, sketch maps, plans.", "Uses: navigation, planning, defence, teaching, tourism, resource surveys."] }],
    story: [
      { d: 5, cap: "This is a stretch of West African landscape: a ridge and plateau in the north, a river valley, a town, and a lagoon by the sea.", cam: [[2.8, 7.2, 9.6], [0.4, 0.2, 0.6]], set: { view: "land" } },
      { d: 5, cap: "A map shows the same land from directly above, reduced to scale. Watch the map appear on the land.", cam: [[0.3, 10.5, 2.6], [0.2, 0, 0.3]], set: { view: "topo" } },
      { d: 6, cap: "Brown contour lines join places of equal height. Red and orange lines are roads; the black-and-white line is the railway; blue lines are rivers.", cam: [[0.4, 8.5, 5.5], [0.4, 0, 0.4]] },
      { d: 5, cap: "A thematic map shows only one theme. Here colours show land use: forest reserve, cocoa plantation, town and farmland.", set: { view: "theme" }, cam: [[2.8, 7.2, 9.6], [0.4, 0.2, 0.6]] },
    ],
    draw: GK.fallback("Maps", ["A map is a scaled representation of the earth's surface on a flat surface", "Types: topographical, atlas, cadastral, thematic, sketch", "Marginal information: title, scale, key, north point, grid"]),
  });

  /* ===================== MW-b  Scale and distance ===================== */
  GK.def3d("MW-b", {
    title: "Scale and measuring distance",
    blurb: "Measure the straight-line distance between two places and the distance along the winding road, then convert map centimetres to kilometres at different scales.",
    envOpts: ENV, cam: [[1.5, 8.5, 7.6], [0.9, 0, 0.2]],
    values: { from: "B", to: "A", rf: 50000, along: 1 },
    controls: [{ type: "select", key: "from", label: "From", options: POINT_OPTS }, { type: "select", key: "to", label: "To", options: POINT_OPTS }, { type: "tabs", key: "rf", label: "Map scale", options: Object.entries(RF).map(([k, v]) => [+k, v]) }, { type: "toggle", key: "along", label: "Show road distance B → A" }],
    build(S, s) { const g = BK.group(S, s); buildSheet(g); s.g2 = new (T().Group)(); g.add(s.g2); s.k = ""; },
    update(S, s, c) { const key = c.from + c.to; if (s.k !== key) { s.k = key; BK.dispose(S, s.g2); s.g2 = new (T().Group)(); s.g.add(s.g2); const a = PTS[c.from], b = PTS[c.to]; pin(s.g2, a[0], a[1], 0xd0021b); pin(s.g2, b[0], b[1], 0x2a6ad8); const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; pts.push([x, Math.max(Y(a[0], a[1]), Y(b[0], b[1])) + 0.35 - 0.3 * Math.sin(t * Math.PI) * 0, z]); } s.g2.add(GK.line(pts, 0xffd27a, 0.015)); } },
    overlay(ctx, s, c, S, B) {
      const M = inset(ctx, B), a = PTS[c.from], b = PTS[c.to];
      if (c.along) { ctx.save(); ctx.strokeStyle = "#ffe14a"; ctx.lineWidth = 4; ctx.globalAlpha = 0.85; ctx.beginPath(); ROAD_N.forEach(([x, z], i) => (i ? ctx.lineTo(M.X(x), M.Z(z)) : ctx.moveTo(M.X(x), M.Z(z)))); ctx.stroke(); ctx.restore(); }
      ctx.strokeStyle = "#d0021b"; ctx.lineWidth = 2; ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.moveTo(M.X(a[0]), M.Z(a[1])); ctx.lineTo(M.X(b[0]), M.Z(b[1])); ctx.stroke(); ctx.setLineDash([]);
      markPt(ctx, M, a[0], a[1], c.from); markPt(ctx, M, b[0], b[1], c.to, "#2a6ad8");
      const km = 100000 / c.rf, bx = M.px + 8, by = M.py + M.ph - 12, unit = M.pw / 10 * (c.rf / 50000) * 0 + (M.pw / 10); ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.fillRect(bx - 4, by - 14, 4 * unit + 8, 20); for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? "#fff" : "#111"; ctx.fillRect(bx + i * unit, by - 4, unit, 4); } ctx.strokeStyle = "#111"; ctx.strokeRect(bx, by - 4, 4 * unit, 4); ctx.fillStyle = "#111"; ctx.font = "600 8px 'IBM Plex Sans',sans-serif"; for (let i = 0; i <= 4; i++) ctx.fillText(String(i), bx + i * unit - 2, by - 6); ctx.fillText("km", bx + 4 * unit + 2, by); void km;
    },
    labels: (s, c) => [ptLabel(c.from, "#ff9a8a"), ptLabel(c.to, "#8fd0ff")],
    hud: (s, c) => { const d = dist(c.from, c.to), cm = d * 1e5 / c.rf, road = curveLen(ROAD_N); return [{ title: "Scale " + RF[c.rf], lines: [["Statement: 1 cm on the map represents " + f(c.rf / 1e5, 2) + " km", "#e8f1ff"], ["Straight distance " + c.from + "–" + c.to + " = " + f(d, 2) + " km", "#ffd27a", true], ["On this map: " + f(cm, 1) + " cm  (map distance = ground ÷ " + c.rf.toLocaleString("en-GB") + ")", "#e8f1ff"], c.along ? ["Road B → A (along the winding road) ≈ " + f(road, 2) + " km = " + f(road * 1e5 / c.rf, 1) + " cm — use string or a paper edge", "#ffe14a"] : "Tick ‘road distance’ to measure a curved route.", "RF = map distance ÷ ground distance (same units)."] }]; },
    readouts: (s, c) => [["Distance", f(dist(c.from, c.to), 2) + " km"], ["Map length", f(dist(c.from, c.to) * 1e5 / c.rf, 1) + " cm"]],
    story: [
      { d: 5, cap: "The representative fraction 1 : 50 000 means one unit on the map stands for 50 000 of the same units on the ground.", set: { rf: 50000, from: "B", to: "A", along: 0 }, cam: [[1.5, 8.5, 7.6], [0.9, 0, 0.2]] },
      { d: 5, cap: "1 cm × 50 000 = 50 000 cm = 500 m = 0.5 km. So 1 cm on this map represents half a kilometre.", hl: "A" },
      { d: 6, cap: "The straight line from B to A measures " + f(dist("B", "A") * 2, 1) + " cm on the map. × 0.5 km per cm = " + f(dist("B", "A"), 2) + " km on the ground.", cam: [[2.2, 4.6, 3.2], [1.8, 0.3, -0.4]] },
      { d: 6, cap: "Roads bend, so lay a string or paper edge along the curves, mark it, then measure it against the linear scale.", set: { along: 1 } },
      { d: 5, cap: "At 1 : 25 000 the same distance would be twice as long on paper; at 1 : 100 000 only half as long.", set: { rf: 25000 } },
    ],
    draw: GK.fallback("Scale", ["RF = map distance ÷ ground distance", "1 : 50 000 → 1 cm = 0.5 km", "Curved distances: string or paper edge"]),
  });

  /* ===================== MW-c  Direction, bearing, grid reference ===================== */
  const DIR16 = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const gridRef = (x, z) => { const e = (x - X0) * 10, n = (Z1 - z) * 10; const e3 = String(Math.floor(e * 1 + 100)).padStart(3, "0").slice(-3), n3 = String(Math.floor(n + 100)).padStart(3, "0").slice(-3); return e3 + n3; };
  GK.def3d("MW-c", {
    title: "Direction, bearing and grid references",
    blurb: "A giant compass rose on the land: find the compass direction, whole-circle bearing and back bearing from one place to another, and read six-figure grid references.",
    envOpts: ENV, cam: [[0.8, 8.6, 7.0], [0.6, 0, 0.0]],
    values: { from: "B", to: "A" },
    controls: [{ type: "select", key: "from", label: "From", options: POINT_OPTS }, { type: "select", key: "to", label: "To", options: POINT_OPTS }],
    build(S, s) { const g = BK.group(S, s); buildSheet(g); s.k = ""; s.g2 = new (T().Group)(); g.add(s.g2); },
    update(S, s, c) { const T3 = T(), key = c.from + c.to; if (s.k !== key) { s.k = key; BK.dispose(S, s.g2); s.g2 = new T3.Group(); s.g.add(s.g2); const a = PTS[c.from], b = PTS[c.to], y = Math.max(Y(a[0], a[1]), 0) + 0.08; const rose = new T3.Group(); rose.position.set(a[0], y, a[1]); const disc = new T3.Mesh(new T3.CircleGeometry(0.72, 64), new T3.MeshBasicMaterial({ color: 0x0a1020, transparent: true, opacity: 0.35, depthWrite: false })); disc.rotation.x = -Math.PI / 2; rose.add(disc); const ring = new T3.Mesh(new T3.RingGeometry(0.68, 0.75, 64), new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: T3.DoubleSide })); ring.rotation.x = -Math.PI / 2; rose.add(ring); const nTip = new T3.Mesh(new T3.ConeGeometry(0.07, 0.25, 12), new T3.MeshBasicMaterial({ color: 0xff4a3a })); nTip.rotation.x = -Math.PI / 2; nTip.position.set(0, 0.01, -0.8); rose.add(nTip); for (let i = 0; i < 16; i++) { const L = i % 4 === 0 ? 0.62 : i % 2 ? 0.3 : 0.45, a2 = i / 16 * 6.283; const pts = [V(0, 0, 0), V(Math.sin(a2) * L, 0, -Math.cos(a2) * L)]; rose.add(new T3.Line(new T3.BufferGeometry().setFromPoints(pts), new T3.LineBasicMaterial({ color: i === 0 ? 0xff4a3a : 0xffffff }))); } s.g2.add(rose); s.rose = rose; const ang = Math.atan2(b[0] - a[0], -(b[1] - a[1])); const arr = new T3.ArrowHelper(V(Math.sin(ang), 0, -Math.cos(ang)), V(a[0], y + 0.01, a[1]), Math.min(dist(c.from, c.to), 4), 0xffd27a, 0.22, 0.12); s.g2.add(arr); pin(s.g2, b[0], b[1], 0x2a6ad8); } },
    overlay(ctx, s, c, S, B) { const M = inset(ctx, B), a = PTS[c.from], b = PTS[c.to]; ctx.strokeStyle = "#d0021b"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(M.X(a[0]), M.Z(a[1])); ctx.lineTo(M.X(b[0]), M.Z(b[1])); ctx.stroke(); ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(M.X(a[0]), M.Z(a[1])); ctx.lineTo(M.X(a[0]), M.Z(a[1]) - 34); ctx.stroke(); ctx.setLineDash([]); const br = brg(c.from, c.to) * Math.PI / 180; ctx.strokeStyle = "#ffb000"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(M.X(a[0]), M.Z(a[1]), 20, -Math.PI / 2, -Math.PI / 2 + br); ctx.stroke(); markPt(ctx, M, a[0], a[1], c.from); markPt(ctx, M, b[0], b[1], c.to, "#2a6ad8"); ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = "600 7.5px 'IBM Plex Sans',sans-serif"; for (let e = 0; e <= 10; e += 2) ctx.fillText(String(e + 10).padStart(2, "0"), M.X(X0 + e) + 1, M.py + 8); for (let n = 0; n <= 8; n += 2) ctx.fillText(String(n + 10).padStart(2, "0"), M.px + 1, M.Z(Z1 - n) - 1); },
    labels: (s, c) => [ptLabel(c.from, "#ff9a8a"), ptLabel(c.to, "#8fd0ff"), { p: [PTS[c.from][0], Math.max(Y(PTS[c.from][0], PTS[c.from][1]), 0) + 0.1, PTS[c.from][1] - 0.78], t: "North", col: "#ff6a5a", dy: -14 }],
    hud: (s, c) => { const b0 = brg(c.from, c.to), back = (b0 + 180) % 360; return [{ title: "From " + c.from + " to " + c.to, lines: [["Compass direction: " + DIR16[Math.round(b0 / 22.5) % 16], "#ffd27a", true], ["Whole-circle bearing: " + String(Math.round(b0)).padStart(3, "0") + "°", "#ffd27a", true], ["Back bearing (" + c.to + " to " + c.from + "): " + String(Math.round(back)).padStart(3, "0") + "°", "#8fd0ff"], "Bearings are measured clockwise from north, always with three figures.", "—", ["Grid ref. " + c.from + ": " + gridRef(PTS[c.from][0], PTS[c.from][1]) + " · " + c.to + ": " + gridRef(PTS[c.to][0], PTS[c.to][1]), "#9fe8b0"], "Six figures: easting (3 digits) first, then northing — “along the corridor, then up the stairs”."] }]; },
    readouts: (s, c) => [["Bearing", String(Math.round(brg(c.from, c.to))).padStart(3, "0") + "°"], ["Direction", DIR16[Math.round(brg(c.from, c.to) / 22.5) % 16]]],
    story: [
      { d: 5, cap: "Stand at B, the town bridge. The red arm of the compass rose points to north.", set: { from: "B", to: "A" }, cam: [[0.6, 4.2, 4.6], [0.6, 0.1, 1.4]], hl: "B" },
      { d: 6, cap: "A whole-circle bearing is the angle measured clockwise from north to the line joining the two places — here " + String(Math.round(brg("B", "A"))).padStart(3, "0") + "°.", cam: [[1.4, 6.6, 4.6], [1.4, 0, 0]] },
      { d: 5, cap: "The back bearing, from A back to B, differs by exactly 180°: " + String(Math.round((brg("B", "A") + 180) % 360)).padStart(3, "0") + "°.", hl: "A" },
      { d: 6, cap: "From B to the inselberg C the direction is " + DIR16[Math.round(brg("B", "C") / 22.5) % 16] + " — a bearing of " + String(Math.round(brg("B", "C"))).padStart(3, "0") + "°.", set: { to: "C" }, cam: [[-0.8, 5.0, 5.4], [-1.0, 0.1, 1.2]] },
      { d: 5, cap: "Grid references: read the easting along the bottom first, then the northing up the side. Six figures locate a point to within 100 m." },
    ],
    draw: GK.fallback("Bearing", ["Bearings: clockwise from north, three figures", "Back bearing = bearing ± 180°", "Grid reference: eastings then northings"]),
  });

  /* ===================== MW-d  Reduction and enlargement (2D) ===================== */
  MK.def("MW-d", {
    kind: "2d", label: "Interactive drawing board", title: "Reduction and enlargement of maps",
    blurb: "The square (grid) method: copy each grid square of the original into a smaller or larger grid. Area changes by the square of the linear factor.",
    values: { k: 0.5 },
    controls: [{ type: "tabs", key: "k", label: "New size", options: [[0.5, "Reduce to ½"], [0.75, "Reduce to ¾"], [1.5, "Enlarge ×1½"], [2, "Enlarge ×2"]] }],
    draw(g, s, c, B) {
      const W = B.wide ? 386 : B.W - 10; g.fillStyle = "#eef1f6"; g.fillRect(0, 0, B.W, B.H);
      const base = 160, k = c.k, px = 16, py = 54, nx = 4, nz = 3, cell = base / nx;
      B.text("ORIGINAL 1 : 50 000", px, py - 10, { size: 10, w: 700, color: "#333" });
      const src = sheet(), sx = -1.4, sz = -0.2, sw = 4, sh = 3; const crop = [(sx - X0) / 10 * 500, (sz - Z0) / 8 * 400, sw / 10 * 500, sh / 8 * 400];
      g.drawImage(src, crop[0], crop[1], crop[2], crop[3], px, py, base, base * 0.75);
      const grid = (x0, y0, w, h, col) => { g.strokeStyle = col; g.lineWidth = 1; for (let i = 0; i <= nx; i++) { g.beginPath(); g.moveTo(x0 + w * i / nx, y0); g.lineTo(x0 + w * i / nx, y0 + h); g.stroke(); } for (let j = 0; j <= nz; j++) { g.beginPath(); g.moveTo(x0, y0 + h * j / nz); g.lineTo(x0 + w, y0 + h * j / nz); g.stroke(); } };
      grid(px, py, base, base * 0.75, "rgba(220,30,30,.8)");
      const nw = base * k, qx = Math.min(W - nw - 10, px + base + 30), qy = py; B.text("NEW 1 : " + Math.round(50000 / k).toLocaleString("en-GB"), qx, qy - 10, { size: 10, w: 700, color: "#333" });
      g.fillStyle = "#fff"; g.fillRect(qx, qy, nw, nw * 0.75); g.drawImage(src, crop[0], crop[1], crop[2], crop[3], qx, qy, nw, nw * 0.75); grid(qx, qy, nw, nw * 0.75, "rgba(30,90,220,.8)");
      g.fillStyle = "rgba(255,210,0,.35)"; g.fillRect(px + cell, py + cell, cell, cell); g.fillRect(qx + cell * k, qy + cell * k, cell * k, cell * k);
      B.text("Copy each square in turn, matching where", px, py + base * 0.75 + 30, { size: 10.5, color: "#333" }); B.text("rivers, roads and contours enter and leave it.", px, py + base * 0.75 + 45, { size: 10.5, color: "#333" });
    },
    hud: (s, c) => [{ title: c.k < 1 ? "Reduction" : "Enlargement", lines: [["Linear factor ×" + c.k + " → new scale 1 : " + Math.round(50000 / c.k).toLocaleString("en-GB"), "#ffd27a", true], ["Area becomes ×" + f(c.k * c.k, 4) + " (the square of the linear factor)", "#8fd0ff"], "Square method: draw a grid on the original, a proportionally smaller or larger grid on new paper, and copy square by square.", "Always state the new scale on the copy."] }],
    readouts: (s, c) => [["New RF", "1 : " + Math.round(50000 / c.k).toLocaleString("en-GB")], ["Area factor", "×" + f(c.k * c.k, 4)]],
  });

  /* ===================== MW-e  Relief features ===================== */
  const FEAT = {
    ridge: ["Ridge", [-2.75, -2.2], "A long, narrow area of high ground; contours are elongated loops."],
    spur: ["Spur", [-2.55, -1.45], "A tongue of high ground projecting into lower land; V-shaped contours point downhill."],
    valley: ["Valley", [0.32, -0.85], "Low ground between hills, usually with a river; V-shaped contours point uphill."],
    plateau: ["Plateau", [3.0, -2.3], "An extensive area of high, fairly flat land; few contours on top, close contours at the edges."],
    escarp: ["Escarpment", [3.0, -1.35], "A steep slope on one side of a plateau or ridge; contours bunched together."],
    col: ["Col / saddle", [0.95, -1.9], "A dip between two areas of high ground — often used by routes."],
    insel: ["Inselberg", [-2.8, 1.0], "An isolated steep-sided granite hill rising from a plain; small, closed, concentric contours."],
    cone: ["Conical hill", [3.6, 1.25], "A hill with evenly spaced circular contours — even slopes on all sides."],
    gorge: ["Narrow valley / gorge", [0.6, -0.15], "Steep-sided valley where contours crowd close to the river."],
    plain: ["Coastal plain", [-2.6, 2.9], "Low, nearly flat land near sea level; very few contours."],
  };
  GK.def3d("MW-e", {
    title: "Relief: contours and landforms",
    blurb: "Pick a landform: the camera flies to it in 3D while the map shows the pattern its contours make. Drape the contours over the land to see how they wrap the slopes.",
    envOpts: ENV, cam: [[2.8, 6.8, 9.2], [0.2, 0.3, 0]],
    values: { feat: "spur", drape: 1 },
    controls: [{ type: "select", key: "feat", label: "Landform", options: Object.entries(FEAT).map(([k, v]) => [k, v[0]]) }, { type: "toggle", key: "drape", label: "Drape contour map on the land" }],
    onChange(s, c, k, H) { if (k === "feat" && H && H.setView) { const p = FEAT[c.feat][1], y = Y(p[0], p[1]); H.setView({ cam: [[p[0] + 1.6, y + 2.6, p[1] + 3.0], [p[0], y, p[1]]] }); } },
    build(S, s) { s.key = ""; },
    update(S, s, c) { if (s.key !== c.drape) { s.key = c.drape; const g = BK.group(S, s); buildSheet(g, { map: !!c.drape }); } },
    overlay(ctx, s, c, S, B) { const M = inset(ctx, B), p = FEAT[c.feat][1]; ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(M.X(p[0]), M.Z(p[1]), 14, 0, 6.3); ctx.stroke(); },
    labels: (s, c) => Object.entries(FEAT).map(([k, v]) => ({ id: k, p: [v[1][0], Y(v[1][0], v[1][1]) + 0.03, v[1][1]], t: v[0], col: k === c.feat ? "#ffd27a" : "#e8f1ff" })),
    hud: (s, c) => [{ title: FEAT[c.feat][0], lines: [[FEAT[c.feat][2], "#ffd27a", true], "—", "Close contours = steep; wide apart = gentle.", "Concave slope: contours close at the top, wide at the bottom. Convex: the reverse.", "Spot heights and trig. stations give exact heights."] }],
    story: Object.entries(FEAT).slice(0, 8).map(([k, v]) => { const y = Y(v[1][0], v[1][1]); return { d: 4.5, title: v[0], cap: v[0] + ": " + v[2], set: { feat: k, drape: 1 }, cam: [[v[1][0] + 1.6, y + 2.6, v[1][1] + 3.0], [v[1][0], y, v[1][1]]], hl: k }; }),
    draw: GK.fallback("Relief features", Object.values(FEAT).map((v) => v[0] + ": " + v[2])),
  });

  /* ===================== MW-f  Gradient and cross profile ===================== */
  const PROFILES = { "A-B": ["A", "B"], "D-B": ["D", "B"], "C-E": ["C", "E"], "F-B": ["F", "B"], "D-A": ["D", "A"] };
  function profile(a, b, n = 120) { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, x = PTS[a][0] + (PTS[b][0] - PTS[a][0]) * t, z = PTS[a][1] + (PTS[b][1] - PTS[a][1]) * t; out.push({ t, x, z, m: Math.max(0, hm(x, z)) }); } return out; }
  function drawProfile(ctx, B, P, a, b, o = {}) {
    const x0 = o.x || 12, y0 = (o.y || 228) - (GK.storyOn ? 64 : 0), w = o.w || 366, h = o.h || 160, L = dist(a, b);
    B.panel(x0, y0, w, h); const px = x0 + 34, py = y0 + 18, pw = w - 46, ph = h - 40, mx = Math.max(500, ...P.map((p) => p.m));
    const X = (t) => px + t * pw, Yp = (m) => py + ph - m / mx * ph;
    ctx.fillStyle = "rgba(180,140,90,.75)"; ctx.beginPath(); ctx.moveTo(X(0), py + ph); P.forEach((p) => ctx.lineTo(X(p.t), Yp(p.m))); ctx.lineTo(X(1), py + ph); ctx.fill(); ctx.strokeStyle = "#5a3a1a"; ctx.lineWidth = 1.6; ctx.beginPath(); P.forEach((p, i) => (i ? ctx.lineTo(X(p.t), Yp(p.m)) : ctx.moveTo(X(p.t), Yp(p.m)))); ctx.stroke();
    ctx.fillStyle = "#cfd8e8"; ctx.font = "9px 'IBM Plex Sans',sans-serif"; for (let m = 0; m <= mx; m += 100) { ctx.fillText(String(m), x0 + 6, Yp(m) + 3); ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(px, Yp(m), pw, 1); ctx.fillStyle = "#cfd8e8"; }
    ctx.fillText(a, X(0) - 3, py + ph + 12); ctx.fillText(b, X(1) - 3, py + ph + 12); ctx.fillText(f(L, 2) + " km", X(0.5) - 14, py + ph + 12); ctx.fillText("m", x0 + 6, py - 6);
    o.extra && o.extra(ctx, X, Yp, px, py, pw, ph);
    return { X, Yp };
  }
  GK.def3d("MW-f", {
    title: "Gradient and cross profiles",
    blurb: "Choose a line across the map: a vertical cut through the 3D land shows the cross profile, and the graph gives the profile you would draw in the exam, with gradient and vertical exaggeration.",
    envOpts: ENV, cam: [[4.6, 6.0, 8.0], [0.6, 0.2, 0]],
    values: { line: "D-B" },
    controls: [{ type: "select", key: "line", label: "Section line", options: Object.keys(PROFILES).map((k) => [k, k.replace("-", " → ")]) }],
    build(S, s) { const g = BK.group(S, s); buildSheet(g, { map: true }); s.k = ""; s.g2 = new (T().Group)(); g.add(s.g2); },
    update(S, s, c) { if (s.k === c.line) return; s.k = c.line; const T3 = T(); BK.dispose(S, s.g2); s.g2 = new T3.Group(); s.g.add(s.g2); const [a, b] = PROFILES[c.line], P = profile(a, b, 140); const pos = [], idx = []; P.forEach((p, i) => { pos.push(p.x, -0.15, p.z, p.x, Y(p.x, p.z) + 0.005, p.z); if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); } }); const geo = new T3.BufferGeometry(); geo.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); s.g2.add(new T3.Mesh(geo, new T3.MeshStandardMaterial({ color: 0xf2c46a, side: T3.DoubleSide, roughness: 0.8, emissive: 0x3a2a0a }))); s.g2.add(GK.polyline(P.map((p) => [p.x, Y(p.x, p.z) + 0.02, p.z]), 0xff3a1a)); pin(s.g2, PTS[a][0], PTS[a][1], 0xd0021b); pin(s.g2, PTS[b][0], PTS[b][1], 0x2a6ad8); },
    overlay(ctx, s, c, S, B) { const [a, b] = PROFILES[c.line], P = profile(a, b); drawProfile(ctx, B, P, a, b); },
    labels: (s, c) => { const [a, b] = PROFILES[c.line]; return [ptLabel(a, "#ff9a8a"), ptLabel(b, "#8fd0ff")]; },
    hud: (s, c) => { const [a, b] = PROFILES[c.line], ha = Math.max(0, hm(PTS[a][0], PTS[a][1])), hb = Math.max(0, hm(PTS[b][0], PTS[b][1])), L = dist(a, b) * 1000, vi = Math.abs(ha - hb), n = L / vi, ve = 50000 / 10000; return [{ title: "Gradient " + a + " → " + b, lines: [["Vertical interval (VI) = " + f(ha, 0) + " − " + f(hb, 0) + " = " + f(vi, 0) + " m", "#e8f1ff"], ["Horizontal equivalent (HE) = " + f(L, 0) + " m", "#e8f1ff"], ["Gradient = VI ÷ HE = 1 in " + f(n, 0) + "  (" + f(vi / L * 100, 1) + "%)", "#ffd27a", true], ["Vertical exaggeration if the vertical scale is 1 cm : 100 m = " + f(ve, 0) + "×", "#8fd0ff"], "Profile: lay paper along the line, mark each contour crossing and its height, then plot heights above the base line."] }]; },
    readouts: (s, c) => { const [a, b] = PROFILES[c.line], vi = Math.abs(Math.max(0, hm(PTS[a][0], PTS[a][1])) - Math.max(0, hm(PTS[b][0], PTS[b][1]))); return [["Gradient", "1 in " + f(dist(a, b) * 1000 / vi, 0)], ["Length", f(dist(a, b), 2) + " km"]]; },
    story: [
      { d: 5, cap: "Draw a straight line on the map between two points — here from the ridge summit D to the town bridge B.", set: { line: "D-B" }, cam: [[-0.8, 8.0, 5.0], [-1.0, 0, -0.2]] },
      { d: 6, cap: "Imagine slicing the land vertically along that line. The cut face is the cross profile.", cam: [[3.6, 3.0, 4.6], [-1.0, 0.4, -0.3]] },
      { d: 6, cap: "In the exam: place paper along the line, mark where each contour crosses with its height, then plot these heights above a base line.", cam: [[4.6, 6.0, 8.0], [0.6, 0.2, 0]] },
      { d: 6, cap: "Gradient = vertical interval ÷ horizontal equivalent, in the same units, written as 1 in n.", set: { line: "A-B" } },
    ],
    draw: GK.fallback("Gradient", ["Gradient = VI ÷ HE (same units)", "Express as 1 in n or %", "VE = horizontal scale ÷ vertical scale"]),
  });

  /* ===================== MW-g  Inter-visibility ===================== */
  const VIS = { "E-B": ["E", "B"], "C-B": ["C", "B"], "D-G": ["D", "G"], "A-C": ["A", "C"], "A-B": ["A", "B"], "F-C": ["F", "C"] };
  function visible(a, b) { const P = profile(a, b, 200), h0 = P[0].m + 2, h1 = P[P.length - 1].m + 2; let ok = true, block = null; P.forEach((p) => { const sight = h0 + (h1 - h0) * p.t; if (p.t > 0.1 && p.t < 0.9 && p.m > sight + 6 && !block) { ok = false; block = p; } }); return { ok, block, P, h0, h1 }; }
  GK.def3d("MW-g", {
    title: "Inter-visibility",
    blurb: "Can a person at one point see the other? A line of sight is drawn in 3D and on the profile — red where hills block the view.",
    envOpts: ENV, cam: [[4.6, 5.6, 8.0], [0.2, 0.3, 0]],
    values: { pair: "E-B" },
    controls: [{ type: "select", key: "pair", label: "Observer → target", options: Object.keys(VIS).map((k) => [k, k.replace("-", " → ")]) }],
    build(S, s) { const g = BK.group(S, s); buildSheet(g); s.k = ""; s.g2 = new (T().Group)(); g.add(s.g2); },
    update(S, s, c) { if (s.k === c.pair) return; s.k = c.pair; BK.dispose(S, s.g2); s.g2 = new (T().Group)(); s.g.add(s.g2); const [a, b] = VIS[c.pair], v = visible(a, b), A = PTS[a], Bp = PTS[b]; const ya = Y(A[0], A[1]) + 0.006 * VEX, yb = Y(Bp[0], Bp[1]) + 0.006 * VEX; s.g2.add(GK.line([[A[0], ya + 0.02, A[1]], [Bp[0], yb + 0.02, Bp[1]]], v.ok ? 0x37d67a : 0xff4a3a, 0.012)); const p1 = BK.person ? null : null; void p1; const obs = GK.pin(0xffd27a, 0.3); obs.position.set(A[0], Y(A[0], A[1]), A[1]); s.g2.add(obs); pin(s.g2, Bp[0], Bp[1], v.ok ? 0x37d67a : 0xff4a3a); if (v.block) { const m = GK.pin(0xff4a3a, 0.5); m.position.set(v.block.x, Y(v.block.x, v.block.z), v.block.z); s.g2.add(m); } },
    overlay(ctx, s, c, S, B) { const [a, b] = VIS[c.pair], v = visible(a, b); drawProfile(ctx, B, v.P, a, b, { extra: (g, X, Yp) => { g.strokeStyle = v.ok ? "#37d67a" : "#ff4a3a"; g.lineWidth = 2; g.setLineDash([6, 3]); g.beginPath(); g.moveTo(X(0), Yp(v.h0)); g.lineTo(X(1), Yp(v.h1)); g.stroke(); g.setLineDash([]); if (v.block) { g.fillStyle = "#ff4a3a"; g.beginPath(); g.arc(X(v.block.t), Yp(v.block.m), 4, 0, 6.3); g.fill(); } } }); },
    labels: (s, c) => { const [a, b] = VIS[c.pair], v = visible(a, b), L = [ptLabel(a, "#ffd27a"), ptLabel(b, v.ok ? "#9fe8b0" : "#ff9a8a")]; if (v.block) L.push({ id: "blk", p: [v.block.x, Y(v.block.x, v.block.z) + 0.05, v.block.z], t: "High ground blocks the view", col: "#ff9a8a" }); return L; },
    hud: (s, c) => { const [a, b] = VIS[c.pair], v = visible(a, b); return [{ title: a + " → " + b, lines: [[v.ok ? b + " is visible from " + a : b + " is NOT visible from " + a, v.ok ? "#5bd68c" : "#ff7b72", true], v.ok ? "The line of sight stays above the ground all the way." : "The line of sight cuts the land at " + f(v.block.m, 0) + " m — that land is in the way.", "Method: draw the profile, join the two end points with a straight ruled line; if the line cuts the profile, the points are not inter-visible.", "Ground hidden behind a convex slope or ridge is called dead ground."] }]; },
    story: () => { const say = (k) => { const [a, b] = VIS[k], v = visible(a, b); return v.ok ? "From " + a + ", " + b + " IS visible: the line of sight stays above the land all the way." : "From " + a + ", " + b + " is NOT visible: land at " + Math.round(v.block.m) + " m rises above the line of sight."; }; return [
      { d: 5, cap: "Can a person on the conical hill E see the town bridge B? Join the two points with a straight line of sight.", set: { pair: "E-B" }, cam: [[4.6, 4.0, 6.0], [2.0, 0.3, 1.4]], hl: "E" },
      { d: 6, cap: "Draw the cross profile between them, then rule a straight line from the observer to the target. " + say("E-B") },
      { d: 6, cap: "Now stand at the trig. station A in the middle of the plateau and look down to B. " + say("A-B"), set: { pair: "A-B" }, cam: [[4.4, 4.6, 3.6], [2.2, 0.6, -1.0]], hl: "A" },
      { d: 6, cap: "The land you cannot see beyond the plateau edge is dead ground — hidden behind a convex slope.", hl: "blk" },
      { d: 6, cap: "From the river source F, looking to the inselberg C: " + say("F-C").replace(/^From F, C /, "C "), set: { pair: "F-C" }, cam: [[-0.4, 4.4, 4.6], [-1.0, 0.3, -0.3]] },
    ]; },
    draw: GK.fallback("Inter-visibility", ["Draw the profile and rule the line of sight", "If the line cuts the profile → not inter-visible", "Dead ground lies behind convex slopes"]),
  });

  /* ===================== MW-h  Drainage patterns ===================== */
  const DRAIN = {
    dendritic: ["Dendritic", "Tree-like: tributaries join the main river at acute angles. Develops on rocks of uniform resistance (granite, clays)."],
    trellis: ["Trellis", "Tributaries join at right angles along parallel valleys of alternating hard and soft rock (folded areas)."],
    radial: ["Radial", "Rivers flow outwards in all directions from a central high point — a volcano or dome."],
    centripetal: ["Centripetal", "Rivers flow inwards from all sides into a central basin or lake (e.g. the Lake Chad basin)."],
    parallel: ["Parallel", "Rivers flow side by side down a uniform slope, such as a coastal plain or escarpment."],
    annular: ["Annular", "Streams follow rings of soft rock around an eroded dome, linked by short radial channels."],
    rectangular: ["Rectangular", "Rivers follow joints and faults in rock, turning at right angles."],
    deranged: ["Deranged", "Irregular streams, lakes and swamps on poorly drained land with no clear pattern."],
  };
  function drainNet(type) {
    const R = [], rr2 = BK.rng(7);
    const branch = (x, z, ang, len, depth) => { if (depth > 3 || len < 0.3) return; const x2 = x + Math.sin(ang) * len, z2 = z + Math.cos(ang) * len; R.push({ p: [[x2, z2], [x, z]], w: 0.028 - depth * 0.006 }); for (const s2 of [-1, 1]) branch(x + Math.sin(ang) * len * 0.5, z + Math.cos(ang) * len * 0.5, ang + s2 * (0.55 + rr2() * 0.3), len * 0.6, depth + 1); };
    if (type === "dendritic") branch(0, 2.6, Math.PI, 2.4, 0);
    if (type === "trellis") { R.push({ p: [[0, -2.6], [0, 2.6]], w: 0.03 }); for (let k = -3; k <= 3; k++) if (k) { const z = k * 0.7; R.push({ p: [[-2.6, z], [0, z]], w: 0.016 }); R.push({ p: [[2.6, z + 0.2], [0, z + 0.2]], w: 0.016 }); } }
    if (type === "radial") for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28; R.push({ p: [[Math.sin(a) * 0.5, Math.cos(a) * 0.5], [Math.sin(a + 0.15) * 1.6, Math.cos(a + 0.15) * 1.6], [Math.sin(a) * 2.8, Math.cos(a) * 2.8]], w: 0.02 }); }
    if (type === "centripetal") for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28; R.push({ p: [[Math.sin(a) * 2.8, Math.cos(a) * 2.8], [Math.sin(a - 0.2) * 1.6, Math.cos(a - 0.2) * 1.6], [Math.sin(a) * 0.7, Math.cos(a) * 0.7]], w: 0.02 }); }
    if (type === "parallel") for (let k = -3; k <= 3; k++) R.push({ p: [[k * 0.75, -2.6], [k * 0.75 + 0.1, 0], [k * 0.75, 2.6]], w: 0.018 });
    if (type === "annular") { [1.0, 1.8, 2.5].forEach((r, j) => { const P = []; for (let i = 0; i <= 30; i++) { const a = 0.4 + i / 30 * 5.2; P.push([Math.sin(a) * r, Math.cos(a) * r]); } R.push({ p: P, w: 0.016 }); }); R.push({ p: [[Math.sin(0.4) * 1.0, Math.cos(0.4) * 1.0], [Math.sin(0.25) * 2.9, Math.cos(0.25) * 2.9]], w: 0.024 }); }
    if (type === "rectangular") { const P = [[-2.6, -2.4], [-1.2, -2.4], [-1.2, -0.8], [0.6, -0.8], [0.6, 0.9], [2.0, 0.9], [2.0, 2.6]]; R.push({ p: P, w: 0.026 }); [[[-2.2, -0.8], [-1.2, -0.8]], [[0.6, -2.2], [0.6, -0.8]], [[-0.8, 0.9], [0.6, 0.9]], [[2.0, -0.6], [2.0, 0.9]]].forEach((p) => R.push({ p, w: 0.015 })); }
    if (type === "deranged") for (let k = 0; k < 12; k++) { const x = (rr2() - 0.5) * 5, z = (rr2() - 0.5) * 5; R.push({ p: [[x, z], [x + (rr2() - 0.5), z + (rr2() - 0.5)], [x + (rr2() - 0.5) * 1.5, z + (rr2() - 0.5) * 1.5]], w: 0.015, lake: rr2() > 0.6 }); }
    return R;
  }
  function drainH(type) {
    return (x, z) => { const r = Math.hypot(x, z), n = (BK.fbm(x * 0.9, z * 0.9, 5) - 0.5) * 0.12;
      switch (type) { case "radial": return 1.1 * Math.exp(-r * r / 2.2) + n; case "centripetal": return 0.08 + 0.12 * r * r / 4 + n; case "parallel": return 0.6 - z * 0.18 + n * 0.5; case "annular": return 0.5 + 0.15 * Math.cos(r * 4.2) * Math.exp(-r / 4) + 0.25 * Math.exp(-r * r / 3) + n; case "trellis": return 0.35 + 0.18 * Math.cos(z * 4.5) * (Math.abs(x) > 0.25 ? 1 : 0.2) + n; case "deranged": return 0.12 + n * 0.6; default: return 0.2 + 0.25 * (2.6 - z) / 5 + n; } };
  }
  GK.def3d("MW-h", {
    title: "Drainage patterns",
    blurb: "Eight drainage patterns on model landscapes. Each shows how rock type and slope arrange the rivers — read the pattern from the map, then see the land that made it.",
    envOpts: Object.assign({}, ENV, { hdri: "rooitou_park" }), cam: [[1.9, 4.4, 5.4], [1.3, -0.2, 0.2]],
    values: { type: "dendritic" },
    controls: [{ type: "select", key: "type", label: "Pattern", options: Object.entries(DRAIN).map(([k, v]) => [k, v[0]]) }],
    build(S, s) { s.key = ""; },
    update(S, s, c) {
      if (s.key === c.type) return; s.key = c.type; const g = BK.group(S, s), T3 = T(), H0 = drainH(c.type), H = (x, z) => H0(x, z) * 1.6, R = drainNet(c.type);
      const carve = (x, z) => { let h = H(x, z); R.forEach((r) => { const d = pathD(x, z, r.p); h -= 0.08 * Math.exp(-Math.pow(d / 0.18, 2)); }); return h; };
      g.add(GK.terrain({ w: 6.4, d: 6.4, nx: 150, h: carve, tint: (hn, sl, x, z) => GK.mix3(GK.tintSavanna(hn, sl, x, z), GK.hex3(0x4f7a2a), c.type === "deranged" ? 0.4 : 0) }));
      R.forEach((r) => { const P = densify(r.p, 0.06).map(([x, z]) => [x, carve(x, z) + 0.012, z]); g.add(GK.line(P, 0x2f78c0, r.w)); if (r.lake) { const l = new T3.Mesh(new T3.CircleGeometry(0.22, 24), new T3.MeshPhysicalMaterial({ color: 0x2f6f9a, roughness: 0.1, clearcoat: 1 })); l.rotation.x = -Math.PI / 2; l.position.set(r.p[0][0], carve(r.p[0][0], r.p[0][1]) + 0.02, r.p[0][1]); g.add(l); } });
      if (c.type === "centripetal") { const l = new T3.Mesh(new T3.CircleGeometry(0.75, 40), new T3.MeshPhysicalMaterial({ color: 0x2f6f9a, roughness: 0.08, clearcoat: 1 })); l.rotation.x = -Math.PI / 2; l.position.y = carve(0, 0) + 0.03; g.add(l); }
      s.R = R;
    },
    overlay(ctx, s, c, S, B) { if (!s.R) return; const x0 = 12, y0 = GK.storyOn ? 164 : 228, w = 160, h = 160; ctx.fillStyle = "#fbf7ec"; ctx.fillRect(x0, y0, w, h); ctx.strokeStyle = "#111"; ctx.lineWidth = 1.2; ctx.strokeRect(x0, y0, w, h); s.R.forEach((r) => { ctx.strokeStyle = "#1f6fbf"; ctx.lineWidth = Math.max(0.8, r.w * 55); ctx.beginPath(); r.p.forEach(([x, z], i) => { const X = x0 + (x + 3.2) / 6.4 * w, Z = y0 + (z + 3.2) / 6.4 * h; i ? ctx.lineTo(X, Z) : ctx.moveTo(X, Z); }); ctx.stroke(); }); ctx.fillStyle = "#111"; ctx.font = "700 9.5px 'IBM Plex Sans',sans-serif"; ctx.fillText("MAP · " + DRAIN[c.type][0].toUpperCase(), x0 + 6, y0 + 12); },
    hud: (s, c) => [{ title: DRAIN[c.type][0] + " pattern", lines: [[DRAIN[c.type][1], "#ffd27a", true], "—", "When describing drainage on a map: direction of flow (from contours), density, pattern, nature of channels (meanders, rapids, swamps).", "Watershed: the boundary between two drainage basins."] }],
    story: Object.entries(DRAIN).slice(0, 6).map(([k, v]) => ({ d: 4.5, title: v[0], cap: v[0] + " — " + v[1], set: { type: k } })),
    draw: GK.fallback("Drainage patterns", Object.values(DRAIN).map((v) => v[0] + ": " + v[1])),
  });

  /* ===================== MW-i  Communication, settlement, land use ===================== */
  const SITES = {
    bridge: ["Bridging point", [0.6, 1.62], "Okeho grew where the main road crosses the river — a bridging point and route centre."],
    linear: ["Linear settlement", [-3.4, 2.0], "Ilu village stretches along the main road: a linear (ribbon) pattern."],
    dispersed: ["Dispersed settlement", [-3.6, 2.6], "Isolated farmsteads scattered over the fertile coastal plain."],
    rail: ["Railway in the valley", [0.95, 0.0], "The railway follows the gentle gradient of the river valley and uses the col to cross the ridge."],
    ridge: ["Road climbing the escarpment", [2.3, -2.0], "The minor road zig-zags to climb the steep escarpment to the plateau."],
    forest: ["Forest reserve on the plateau", [3.0, -2.3], "Steep, high, thin-soiled land is kept as a forest reserve."],
    cocoa: ["Cocoa plantation", [2.25, 0.3], "Plantation on well-drained lower slopes near the road to the port."],
    quarry: ["Quarry at the inselberg", [-2.45, 1.25], "Granite quarried from the inselberg for building and roads."],
  };
  GK.def3d("MW-i", {
    title: "Communication, settlement and land use",
    blurb: "Read the human geography of the map: why the town is where it is, why routes follow valleys, and how land use changes with relief.",
    envOpts: ENV, cam: [[2.6, 6.6, 9.0], [0, 0.2, 0.6]],
    values: { site: "bridge", roads: 1, settle: 1, landuse: 1 },
    controls: [{ type: "select", key: "site", label: "Feature", options: Object.entries(SITES).map(([k, v]) => [k, v[0]]) }, { type: "toggle", key: "roads", label: "Routes" }, { type: "toggle", key: "settle", label: "Settlements" }, { type: "toggle", key: "landuse", label: "Land use" }],
    onChange(s, c, k, H) { if (k === "site" && H && H.setView) { const p = SITES[c.site][1], y = Y(p[0], p[1]); H.setView({ cam: [[p[0] + 1.4, y + 2.2, p[1] + 2.6], [p[0], y, p[1]]] }); } },
    build(S, s) { s.key = ""; },
    update(S, s, c) { const key = "" + c.roads + c.settle + c.landuse; if (s.key !== key) { s.key = key; const g = BK.group(S, s); buildSheet(g, { layers: { roads: !!c.roads, settle: !!c.settle, landuse: !!c.landuse } }); } },
    overlay(ctx, s, c, S, B) { const M = inset(ctx, B), p = SITES[c.site][1]; ctx.strokeStyle = "#ffcc00"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(M.X(p[0]), M.Z(p[1]), 13, 0, 6.3); ctx.stroke(); },
    labels: (s, c) => Object.entries(SITES).map(([k, v]) => ({ id: k, p: [v[1][0], Y(v[1][0], v[1][1]) + 0.04, v[1][1]], t: v[0], col: k === c.site ? "#ffd27a" : "#e8f1ff" })),
    hud: (s, c) => [{ title: SITES[c.site][0], lines: [[SITES[c.site][2], "#ffd27a", true], "—", "Patterns: nucleated (clustered), linear (along routes), dispersed (scattered).", "Routes avoid steep slopes and swamps; they follow valleys, cols and ridges.", "Land use reflects relief, soils, drainage and access."] }],
    story: Object.entries(SITES).slice(0, 6).map(([k, v]) => { const y = Y(v[1][0], v[1][1]); return { d: 4.5, title: v[0], cap: v[2], set: { site: k }, cam: [[v[1][0] + 1.4, y + 2.2, v[1][1] + 2.6], [v[1][0], y, v[1][1]]], hl: k }; }),
    draw: GK.fallback("Settlement and routes", Object.values(SITES).map((v) => v[0] + ": " + v[2])),
  });
})();
