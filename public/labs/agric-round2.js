/* agric-round2.js — second redesign round for the Agricultural Science lab (loads after agric-refine.js and agric-kit4.js).
   1. Crop pests rebuilt as proper insects: three body sections, six jointed legs, antennae, veined wings, real colour patterns.
   2. Hand tools reshaped: turned wooden handles, bevelled steel blades, a proper wheelbarrow (also the stand-ins behind the scanned models).
   3. Living water: every pond, canal and river ripples and has fish moving under the surface.
   4. 2D boards: rounded gradient bars, ring charts, glowing curves and cleaner tables.
   Everything is generated in code. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, BA = window.BA, AK = window.AK, GK = window.GK;
  if (!MK || !BK || !BA || !AK || !GK) return;
  const sd = BA.sd, lin = BA.lin, mix3 = BA.mix3, S = sd.smin;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ================= 1. insects ================= */
  /* P: abdomen [len, height, width], thorax [l, h, w], head [l, h, w], colours, pattern, legs, wings, extras */
  const INS = {
    grasshopper: { k: 1, ab: [0.36, 0.1, 0.095], th: [0.15, 0.13, 0.11], hd: [0.085, 0.115, 0.09], a: 0x7d9a2c, b: 0xd9b62a, pat: "stripe", jump: 1, wing: "tent", wc: 0x8aa04a, ant: 0.3, saddle: 1 },
    weevil: { k: 0.6, ab: [0.26, 0.17, 0.17], th: [0.12, 0.13, 0.13], hd: [0.07, 0.07, 0.07], a: 0x3d2516, b: 0x1c110a, pat: "ridges", snout: 1, ant: 0.16, elytra: 1 },
    beetle: { k: 0.7, ab: [0.28, 0.16, 0.2], th: [0.12, 0.12, 0.17], hd: [0.07, 0.07, 0.09], a: 0x66792a, b: 0x2c3a12, pat: "ridges", ant: 0.2, elytra: 1 },
    yambeetle: { k: 0.7, ab: [0.3, 0.17, 0.2], th: [0.13, 0.13, 0.18], hd: [0.07, 0.07, 0.1], a: 0x2c1c0c, b: 0x120a04, pat: "ridges", ant: 0.14, elytra: 1, horn: 1 },
    beanbeetle: { k: 0.7, ab: [0.24, 0.16, 0.18], th: [0.1, 0.12, 0.14], hd: [0.06, 0.07, 0.08], a: 0x7d5c3a, b: 0xe8dcc0, pat: "spots", ant: 0.2, elytra: 1 },
    aphid: { k: 0.4, ab: [0.26, 0.2, 0.2], th: [0.1, 0.11, 0.12], hd: [0.07, 0.07, 0.08], a: 0x86b846, b: 0x5a8a2a, pat: "plain", ant: 0.4, cornicles: 1, soft: 1 },
    bug: { k: 0.7, ab: [0.28, 0.07, 0.2], th: [0.13, 0.08, 0.2], hd: [0.07, 0.06, 0.08], a: 0x5d6e2a, b: 0x2c3414, pat: "shield", ant: 0.3, wing: "flat", wc: 0x4a3a22 },
    stainer: { k: 0.7, ab: [0.3, 0.07, 0.16], th: [0.12, 0.08, 0.15], hd: [0.07, 0.06, 0.07], a: 0xc8321e, b: 0x141414, pat: "bands", ant: 0.32, wing: "flat", wc: 0x2a1a14 },
    mirid: { k: 0.7, ab: [0.28, 0.07, 0.13], th: [0.11, 0.08, 0.12], hd: [0.06, 0.06, 0.07], a: 0x6a4428, b: 0x2c1c10, pat: "shield", ant: 0.36, wing: "flat", wc: 0x5a4028 },
    thrips: { k: 0.35, ab: [0.4, 0.06, 0.07], th: [0.12, 0.07, 0.08], hd: [0.07, 0.06, 0.06], a: 0x3d3220, b: 0x1c160c, pat: "bands", ant: 0.18, wing: "fringe", wc: 0xd8d0c0 },
    moth: { k: 0.7, ab: [0.26, 0.11, 0.11], th: [0.13, 0.13, 0.14], hd: [0.07, 0.09, 0.1], a: 0x8f7d5c, b: 0x5a4a34, pat: "bands", ant: 0.26, wing: "spread", wc: 0xa8987a, fuzzy: 1 },
    tsetse: { k: 0.7, ab: [0.24, 0.11, 0.13], th: [0.15, 0.14, 0.15], hd: [0.08, 0.1, 0.13], a: 0x6a563a, b: 0x2c2216, pat: "bands", ant: 0.06, wing: "scissor", wc: 0xcfc6b0, eyes: 0x7a2a1c, prob: 1 },
    termite: { k: 0.5, ab: [0.28, 0.13, 0.14], th: [0.1, 0.09, 0.1], hd: [0.11, 0.1, 0.11], a: 0xeadcbc, b: 0xc98a2c, pat: "head", ant: 0.16, soft: 1, jaws: 1 },
    louse: { k: 0.4, ab: [0.26, 0.07, 0.17], th: [0.1, 0.07, 0.12], hd: [0.08, 0.06, 0.09], a: 0xcbbba2, b: 0x8a7a62, pat: "bands", ant: 0.08, soft: 1 },
  };
  function insectSDF(P) {
    const [al, ah, aw] = P.ab, [tl, th, tw] = P.th, [hl, hh, hw] = P.hd, ax = -al * 0.82, hx = tl * 0.75 + hl * 0.7;
    return (x, y, z) => {
      const az = Math.abs(z);
      let d = sd.ell(x, y, z, ax, 0, 0, al, ah, aw);
      if (!P.elytra) d += 0.006 * Math.sin((x - ax) * (P.soft ? 46 : 62)) * sstep(ax + al, ax, x);                 // body rings
      else d = Math.min(d, sd.ell(x, y, z, ax, ah * 0.08, 0, al * 0.985, ah, aw) + 0.0);
      d = S(d, sd.ell(x, y, z, 0, P.saddle ? 0.015 : 0.005, 0, tl, th, tw), 0.02);
      d = S(d, sd.ell(x, y, z, hx, P.jump ? -0.01 : 0, 0, hl, hh, hw), 0.015);
      d = S(d, sd.ell(x, y, az, hx + hl * 0.25, hh * 0.3, hw * 0.72, hl * 0.42, hh * 0.42, hw * 0.34), 0.006);     // compound eyes
      if (P.snout) d = S(d, sd.cone(x, y, z, hx + hl * 0.5, -0.01, 0, hx + hl * 3.2, -0.09, 0, hl * 0.3, hl * 0.2), 0.012);
      if (P.prob) d = S(d, sd.cone(x, y, z, hx + hl * 0.7, -hh * 0.5, 0, hx + hl * 3.0, -hh * 0.45, 0, 0.012, 0.007), 0.008);
      if (P.horn) d = S(d, sd.cone(x, y, z, tl * 0.5, th * 0.7, 0, tl * 1.3, th * 1.5, 0, 0.03, 0.01), 0.015);
      if (P.jaws) d = S(d, sd.cone(x, y, az, hx + hl * 0.8, -0.01, hw * 0.3, hx + hl * 1.7, -0.01, hw * 0.08, 0.016, 0.005), 0.008);
      if (P.cornicles) d = S(d, sd.cone(x, y, az, ax - al * 0.55, ah * 0.6, aw * 0.45, ax - al * 1.0, ah * 1.25, aw * 0.6, 0.014, 0.008), 0.008);
      if (P.fuzzy) d -= 0.008 * BK.noise3(x * 60, y * 60, z * 60);
      return d;
    };
  }
  let veinTex = null;
  const veins = () => { if (veinTex) return veinTex; const c = BK.cv(128, 64), g = c.getContext("2d"); g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(0, 0, 128, 64); g.strokeStyle = "rgba(60,50,40,.7)"; g.lineWidth = 1; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(0, 32); g.bezierCurveTo(40, 32 + (i - 4) * 5, 90, 32 + (i - 4) * 9, 128, 32 + (i - 4) * 8); g.stroke(); } for (let x = 20; x < 128; x += 18) { g.beginPath(); g.moveTo(x, 6); g.lineTo(x + 4, 58); g.stroke(); } veinTex = BK.tex(c); return veinTex; };
  function insect(type, s) {
    const T3 = T(), P = INS[type], g = new T3.Group(), a = lin(P.a), b = lin(P.b), [al, ah, aw] = P.ab, [tl, th, tw] = P.th, [hl, hh, hw] = P.hd, ax = -al * 0.82, hx = tl * 0.75 + hl * 0.7;
    const geo = BA.cached("ai_" + type, () => BA.mesh(insectSDF(P), [ax - al * 1.25, -Math.max(ah, th) * 1.4, -Math.max(aw, tw, hw) * 1.5, hx + hl * 3.6, Math.max(ah, th) * 1.9, Math.max(aw, tw, hw) * 1.5], Math.max(0.0045, al / 46), { color: (x, y, z, nx, ny) => {
      const az = Math.abs(z); let c = a;
      if (P.pat === "stripe") c = mix3(a, b, sstep(0.3, 0.7, 0.5 + 0.5 * Math.sin(y * 70 + 1)) * 0.55);
      else if (P.pat === "ridges") c = mix3(a, b, x < tl * 0.6 ? (0.5 + 0.5 * Math.sin(az * 150)) * 0.7 : 0.35);
      else if (P.pat === "spots") c = mix3(a, b, x < 0 ? sstep(0.6, 0.7, BK.noise3(x * 26, y * 26, z * 26)) : 0);
      else if (P.pat === "bands") c = mix3(a, b, x < tl * 0.4 ? sstep(0.35, 0.65, 0.5 + 0.5 * Math.sin((x - ax) * 44)) * 0.85 : type === "stainer" ? 0 : 0.3);
      else if (P.pat === "shield") c = mix3(a, b, sstep(0.0, -al * 0.9, x) * 0.7 + (1 - sstep(0, 0.012, Math.abs(az - (x - ax) * 0.25))) * 0.4);
      else if (P.pat === "head") c = x > tl * 0.6 ? b : mix3(a, lin(0xd8c8a0), 0.5 + 0.5 * Math.sin((x - ax) * 46));
      if (P.elytra && x < tl * 0.7 && az < 0.006 && ny > 0) c = mix3(c, [0, 0, 0], 0.7);                               // line where the wing cases meet
      if (x > hx && az > hw * 0.5 && y > 0) c = P.eyes ? lin(P.eyes) : mix3(c, [0, 0, 0], 0.75);                       // eyes
      c = mix3(c, mix3(c, [1, 1, 1], 0.35), sstep(-0.3, -0.9, ny) * 0.5);
      return c; } }));
    const body = new T3.Mesh(geo, new T3.MeshPhysicalMaterial({ vertexColors: true, roughness: P.soft ? 0.55 : P.fuzzy ? 0.9 : 0.28, clearcoat: P.soft || P.fuzzy ? 0.1 : 0.9, clearcoatRoughness: 0.25, sheen: P.fuzzy ? 1 : 0 })); g.add(body);
    /* legs: three pairs on the thorax, each femur + tibia + tarsus */
    const lm = new T3.MeshStandardMaterial({ roughness: 0.5 }); lm.color.setRGB(...mix3(a, [0, 0, 0], 0.4));
    const gy = -Math.max(ah, th) - 0.1;
    for (const sv of [-1, 1]) [0.75, 0.1, -0.6].forEach((fx, i) => {
      const x0 = fx * tl, big = P.jump && i === 2, z0 = sv * tw * 0.8, reach = (i === 1 ? 0.2 : 0.17) + tw, dx = i === 0 ? 0.11 : i === 1 ? 0.0 : -0.13;
      const pts = big ? [[x0, 0, z0], [x0 - 0.22, 0.2, sv * (tw + 0.07)], [x0 - 0.04, gy, sv * (tw + 0.1)], [x0 + 0.06, gy, sv * (tw + 0.11)]] : [[x0, -th * 0.3, z0], [x0 + dx * 0.5, th * 0.5 + 0.03, sv * (reach * 0.62)], [x0 + dx, gy, sv * reach], [x0 + dx + 0.045, gy, sv * (reach + 0.015)]];
      g.add(BA.tube(BA.curve(pts), big ? 0.03 : 0.0135, lm, { seg: 24, rs: 6, r: (t) => (big ? (t < 0.45 ? 1.25 - t * 1.6 : 0.4) : t < 0.4 ? 1 : 0.65) }));
    });
    if (P.ant) for (const sv of [-1, 1]) g.add(BA.tube(BA.curve(P.snout ? [[hx + hl * 2.2, -0.06, sv * 0.012], [hx + hl * 2.6, 0.02, sv * 0.07], [hx + hl * 3.4, 0.0, sv * 0.11]] : [[hx + hl * 0.5, hh * 0.5, sv * hw * 0.3], [hx + hl + P.ant * 0.45, hh + P.ant * 0.35, sv * (hw * 0.5 + P.ant * 0.2)], [hx + hl + P.ant, hh + P.ant * 0.2, sv * (hw * 0.6 + P.ant * 0.45)]]), 0.006, lm, { seg: 14, rs: 5, r: (t) => 1 - 0.6 * t }));
    if (P.wing) {
      const wm = new T3.MeshPhysicalMaterial({ color: P.wc, map: veins(), roughness: 0.35, transparent: true, opacity: P.wing === "spread" ? 0.96 : P.wing === "tent" || P.wing === "flat" ? 0.9 : 0.5, side: T3.DoubleSide, depthWrite: false, iridescence: P.wing === "scissor" || P.wing === "fringe" ? 0.6 : 0 });
      const wingGeo = (L, W) => { const sh = new T3.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(L * 0.3, W * 0.7, L * 0.8, W * 0.6, L, 0); sh.bezierCurveTo(L * 0.8, -W * 0.5, L * 0.3, -W * 0.45, 0, 0); const ge = new T3.ShapeGeometry(sh, 10); const p = ge.attributes.position, uv = ge.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / L, 0.5 + p.getY(i) / (W * 1.4)); return ge; };
      for (const sv of [-1, 1]) {
        const L = P.wing === "spread" ? 0.5 : al * 1.9, W = P.wing === "spread" ? 0.3 : P.wing === "fringe" ? 0.035 : aw * 1.3, w = new T3.Mesh(wingGeo(L, W), wm), pv = new T3.Group(); pv.position.set(tl * 0.2, th * 0.92, sv * tw * 0.35);
        if (P.wing === "spread") { w.rotation.x = -Math.PI / 2; pv.rotation.y = sv * -1.25; pv.rotation.z = 0.0; pv.rotation.x = sv * 0.18; const hw2 = new T3.Mesh(wingGeo(0.34, 0.26), wm); hw2.rotation.x = -Math.PI / 2; const p2 = new T3.Group(); p2.position.set(-0.05, th * 0.9, sv * tw * 0.3); p2.rotation.y = sv * -1.9; p2.add(hw2); g.add(p2); }
        else if (P.wing === "tent") { w.rotation.x = -Math.PI / 2 + sv * 0.95; pv.rotation.y = Math.PI + sv * 0.04; pv.rotation.z = 0.06; }
        else if (P.wing === "scissor") { w.rotation.x = -Math.PI / 2; pv.rotation.y = Math.PI + sv * 0.07; pv.rotation.z = 0.08; pv.position.y += sv * 0.004; }
        else { w.rotation.x = -Math.PI / 2; pv.rotation.y = Math.PI + sv * (P.wing === "fringe" ? 0.12 : 0.1); pv.rotation.z = 0.05; pv.position.y -= ah * 0.1; }
        pv.add(w); g.add(pv);
      }
    }
    g.scale.setScalar(s * P.k); BK.shadow(g, true, false); g.userData.pest = type; return g;
  }
  /* caterpillars: a chain of soft segments with a hard head, true legs in front and prolegs behind */
  const CAT = { caterpillar: [0x6f9c3a, 0x3f6a22, 0], armyworm: [0x4c4a2c, 0xd8c86a, 1], stemborer: [0xe9dabc, 0xb89a7a, 0], bollworm: [0x8aa24c, 0x4a5a2a, 1] };
  function caterpillar(type, s) {
    const T3 = T(), [ca, cb, striped] = CAT[type], a = lin(ca), b = lin(cb), g = new T3.Group(), n = 11, L = 0.9, r = 0.06;
    const fn = (x, y, z) => { let d = 1e9; for (let i = 0; i < n; i++) { const cx = (i - n / 2 + 0.5) * L / n, cyy = Math.sin(i / n * Math.PI) * 0.03; d = S(d, sd.ell(x, y, z, cx, cyy, 0, L / n * 0.66, r * (1 - Math.abs(i - n / 2) / n * 0.45), r * (1 - Math.abs(i - n / 2) / n * 0.4)), 0.012); } d = S(d, sd.sph(x, y, z, L / 2 + 0.02, 0.0, 0, r * 0.82), 0.012); for (let i = 0; i < n; i++) if (i < 2 || (i > 3 && i < 8) || i === n - 1) { const cx = (i - n / 2 + 0.5) * L / n; d = S(d, sd.cone(x, y, Math.abs(z), cx, -r * 0.5, r * 0.45, cx, -r * 1.15, r * 0.5, 0.016, 0.01), 0.01); } return d; };
    const geo = BA.cached("ai_cat_" + type, () => BA.mesh(fn, [-L / 2 - 0.08, -0.1, -0.09, L / 2 + 0.11, 0.12, 0.09], 0.0085, { color: (x, y, z, nx, ny) => { let c = mix3(a, mix3(a, [1, 1, 1], 0.4), sstep(-0.2, -0.9, ny) * 0.6); if (striped) c = mix3(c, b, (1 - sstep(0.006, 0.014, Math.abs(Math.abs(z) - 0.036))) * (y > -0.01 ? 0.9 : 0)); else c = mix3(c, b, sstep(0.55, 0.7, BK.noise3(x * 40, y * 40, z * 40)) * 0.4); if (x > L / 2 - 0.035) c = lin(0x3a2616); return c; } }));
    g.add(new T3.Mesh(geo, new T3.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, clearcoat: 0.3 })));
    g.scale.setScalar(s); BK.shadow(g, true, false); g.userData.pest = type; return g;
  }
  const pest0 = AK.pest;
  AK.pest = (type = "grasshopper", s = 1) => { try { if (INS[type]) return insect(type, s); if (CAT[type]) return caterpillar(type, s); } catch (e) { console.error("agric-round2 pest " + type + ": " + e.message); } return pest0(type, s); };

  /* ================= 2. hand tools ================= */
  const tool0 = AK.tool;
  const woodM = () => AK.pbr("wood_table_worn", { repeat: [1, 3], color: 0xd9b98a }), steelM = () => new (T().MeshStandardMaterial)({ color: 0xc4c9ce, metalness: 0.85, roughness: 0.32 }), ironM = () => new (T().MeshStandardMaterial)({ color: 0x5a5d62, metalness: 0.7, roughness: 0.5 });
  const handle = (g, L, r) => { const T3 = T(), pts = [[0.001, 0], [r * 0.95, 0.005], [r * 1.1, L * 0.08], [r * 0.9, L * 0.3], [r, L * 0.75], [r * 1.12, L * 0.97], [r * 0.9, L], [0.001, L]].map((q) => new T3.Vector2(q[0], q[1])), m = new T3.Mesh(new T3.LatheGeometry(pts, 12), woodM()); g.add(m); return m; };
  /* a flat steel blade from an outline [[x, y], …], bevelled, lying in the x–y plane */
  const blade = (pts, th, mat) => { const T3 = T(), sh = new T3.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]); sh.closePath(); const ge = new T3.ExtrudeGeometry(sh, { depth: th, bevelEnabled: true, bevelSize: th * 0.6, bevelThickness: th * 0.5, bevelSegments: 2 }); ge.translate(0, 0, -th / 2); return new T3.Mesh(ge, mat || steelM()); };
  const dgrip = (g, y) => { const T3 = T(), t = new T3.Mesh(new T3.TorusGeometry(0.055, 0.012, 8, 16, Math.PI), woodM()); t.position.y = y; g.add(t); const bar = AK.cyl(0.012, 0.012, 0.11, woodM(), 0, y, 0, 8); bar.rotation.z = Math.PI / 2; g.add(bar); };
  AK.tool = (type) => {
    const T3 = T(), g = new T3.Group();
    try {
      switch (type) {
        case "hoe": { handle(g, 0.75, 0.019); const b = blade([[0, -0.1], [0.2, -0.12], [0.215, 0.0], [0.2, 0.12], [0, 0.1]], 0.008, ironM()); b.rotation.set(Math.PI / 2, 0, 0.35); b.position.set(0.02, 0.74, 0); g.add(b); const so = AK.cyl(0.028, 0.024, 0.07, ironM(), 0, 0.735, 0, 10); g.add(so); break; }
        case "longhoe": { handle(g, 1.4, 0.018); const b = blade([[0, -0.07], [0.15, -0.075], [0.15, 0.075], [0, 0.07]], 0.006); b.rotation.set(Math.PI / 2, 0, 0.2); b.position.set(0.015, 1.4, 0); g.add(b); break; }
        case "cutlass": case "machete": { const h = new T3.Mesh(new T3.CapsuleGeometry(0.019, 0.1, 4, 10), AK.std(0x2c1a10, { roughness: 0.6 })); h.scale.z = 0.7; h.position.y = 0.07; g.add(h); for (const y of [0.04, 0.1]) { const rv = AK.cyl(0.005, 0.005, 0.03, steelM(), 0, y, 0, 6); rv.rotation.x = Math.PI / 2; g.add(rv); } const b = blade([[-0.02, 0.13], [0.02, 0.13], [0.03, 0.4], [0.045, 0.62], [0.02, 0.72], [-0.03, 0.66], [-0.028, 0.4]], 0.0035); g.add(b); break; }
        case "spade": { handle(g, 0.8, 0.018); dgrip(g, 0.84); const b = blade([[-0.1, 0], [0.1, 0], [0.1, -0.24], [0.085, -0.27], [-0.085, -0.27], [-0.1, -0.24]], 0.005); g.add(b); g.add(AK.cyl(0.024, 0.02, 0.1, steelM(), 0, 0.04, 0, 10)); break; }
        case "shovel": { handle(g, 1.0, 0.018); const b = blade([[-0.09, 0], [0.09, 0], [0.11, -0.16], [0.07, -0.29], [0, -0.33], [-0.07, -0.29], [-0.11, -0.16]], 0.005); const p = b.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + p.getX(i) * p.getX(i) * 3.2 - p.getY(i) * 0.12); b.geometry.computeVertexNormals(); g.add(b); g.add(AK.cyl(0.024, 0.02, 0.1, steelM(), 0, 0.04, 0, 10)); break; }
        case "rake": { handle(g, 1.3, 0.017); g.add(AK.box(0.38, 0.026, 0.02, ironM(), 0, 1.3, 0)); for (let i = 0; i < 12; i++) g.add(BA.tube(BA.curve([[-0.176 + i * 0.032, 1.3, 0], [-0.176 + i * 0.032, 1.29, 0.04], [-0.176 + i * 0.032, 1.25, 0.075]]), 0.005, ironM(), { seg: 6, rs: 5 })); break; }
        case "fork": { handle(g, 1.0, 0.018); dgrip(g, 1.04); g.add(AK.box(0.17, 0.02, 0.02, steelM(), 0, 0.0, 0)); for (let i = 0; i < 4; i++) g.add(BA.tube(BA.curve([[-0.075 + i * 0.05, 0, 0], [-0.075 + i * 0.05, -0.14, 0.012], [-0.075 + i * 0.05, -0.29, 0]]), 0.007, steelM(), { seg: 8, rs: 6, r: (t) => 1 - 0.55 * t })); break; }
        case "sickle": { handle(g, 0.15, 0.017); const o = [], inn = []; for (let i = 0; i <= 18; i++) { const a = i / 18 * 3.4 - 0.2, w = 0.03 * (1 - i / 18 * 0.85); o.push([Math.sin(a) * 0.2, 0.15 + (1 - Math.cos(a)) * 0.16]); inn.push([Math.sin(a) * (0.2 - w), 0.15 + 0.16 - Math.cos(a) * (0.16 - w)]); } g.add(blade(o.concat(inn.reverse()), 0.003)); break; }
        case "axe": { const hd = handle(g, 0.8, 0.02); hd.scale.z = 0.72; const b = blade([[-0.035, 0.72], [0.04, 0.73], [0.17, 0.69], [0.175, 0.84], [0.04, 0.8], [-0.035, 0.81]], 0.026, ironM()); const p = b.geometry.attributes.position; for (let i = 0; i < p.count; i++) if (p.getX(i) > 0.1) p.setZ(i, p.getZ(i) * 0.12); b.geometry.computeVertexNormals(); g.add(b); break; }
        case "pickaxe": { const hd = handle(g, 0.9, 0.02); hd.scale.z = 0.75; g.add(BA.tube(BA.curve([[-0.3, 0.82, 0], [-0.15, 0.885, 0], [0, 0.9, 0], [0.15, 0.885, 0], [0.3, 0.82, 0]]), 0.02, ironM(), { seg: 30, rs: 8, r: (t) => 0.25 + 0.95 * Math.sin(t * Math.PI) })); g.add(AK.cyl(0.03, 0.03, 0.06, ironM(), 0, 0.9, 0, 10)); break; }
        case "wheelbarrow": { const tray = new T3.Mesh(new T3.CylinderGeometry(0.42, 0.26, 0.26, 4, 1, true), new T3.MeshStandardMaterial({ color: 0x3f7a4a, metalness: 0.5, roughness: 0.5, side: T3.DoubleSide })); tray.rotation.y = Math.PI / 4; tray.scale.set(1.25, 1, 0.85); tray.position.set(0.02, 0.5, 0); g.add(tray); const fl = AK.box(0.44, 0.012, 0.3, AK.std(0x356a40, { metalness: 0.5, roughness: 0.5 }), 0.02, 0.375, 0); g.add(fl);
          const w = AK.wheel(0.16, 0.07, 0x2a2a2a); w.position.set(0.5, 0.16, 0); g.add(w); const fm = AK.std(0x2a2c30, { metalness: 0.6, roughness: 0.5 });
          for (const sv of [-1, 1]) { g.add(BA.tube(BA.curve([[0.5, 0.16, sv * 0.06], [0.2, 0.36, sv * 0.2], [-0.35, 0.42, sv * 0.25], [-0.78, 0.5, sv * 0.27]]), 0.014, fm, { seg: 20, rs: 6 })); g.add(BA.tube(BA.curve([[-0.2, 0.4, sv * 0.24], [-0.26, 0.2, sv * 0.25], [-0.26, 0.0, sv * 0.25]]), 0.012, fm, { seg: 8, rs: 6 })); const gr = AK.cyl(0.02, 0.02, 0.14, AK.std(0x161616, { roughness: 0.9 }), -0.74, 0.493, sv * 0.27, 8); gr.rotation.z = Math.PI / 2 - 0.18; g.add(gr); } break; }
        default: return tool0(type);
      }
    } catch (e) { return tool0(type); }
    BK.shadow(g); g.userData.tool = type; return g;
  };

  /* ================= 3. living water ================= */
  const water0 = GK.water;
  let fishGeo = null;
  const fishShape = () => { if (fishGeo) return fishGeo; const T3 = T(), sh = new T3.Shape(); sh.moveTo(0.5, 0); sh.bezierCurveTo(0.3, 0.2, -0.15, 0.17, -0.32, 0.03); sh.lineTo(-0.5, 0.16); sh.lineTo(-0.45, 0); sh.lineTo(-0.5, -0.16); sh.lineTo(-0.32, -0.03); sh.bezierCurveTo(-0.15, -0.17, 0.3, -0.2, 0.5, 0); fishGeo = new T3.ShapeGeometry(sh, 8); return fishGeo; };
  GK.water = (w, d, color, opacity) => {
    const T3 = T(), m = water0(w, d, color, opacity);
    try {
      const mat = m.material; mat.roughness = 0.05; mat.envMapIntensity = 1.4; if (mat.normalMap) { mat.normalMap = mat.normalMap.clone(); mat.normalMap.needsUpdate = true; mat.normalMap.repeat.set(Math.max(1.5, w * 0.9), Math.max(1.5, d * 0.9)); mat.normalScale.set(0.5, 0.5); }
      const area = w * d, n = area < 1.2 ? 0 : Math.min(9, Math.round(area * 0.9) + 1), fl = clamp(Math.min(w, d) * 0.085, 0.05, 0.2), fish = [];
      const fm = new T3.MeshBasicMaterial({ color: 0x0e1a14, transparent: true, opacity: 0.38, depthWrite: false });
      for (let i = 0; i < n; i++) { const f = new T3.Mesh(fishShape(), fm); f.scale.set(fl * (0.8 + (i % 3) * 0.2), fl * (0.8 + (i % 3) * 0.2) * 0.9, 1); f.position.z = 0.004; f.renderOrder = 2; m.add(f); fish.push({ f, p: i * 2.4, sp: 0.25 + (i % 4) * 0.07, ax: (w / 2 - fl) * (0.45 + (i % 3) * 0.22), ay: (d / 2 - fl) * (0.4 + (i % 2) * 0.35), q: 1 + (i % 3) }); }
      if (w / d < 5 && d / w < 5) { const shore = new T3.Mesh(new T3.PlaneGeometry(w * 1.05 + 0.1, d * 1.05 + 0.1), AK.pbr("brown_mud_02", { repeat: [Math.max(1, Math.round(w)), Math.max(1, Math.round(d))], color: 0xb89a78 })); shore.position.z = -0.008; shore.receiveShadow = true; m.add(shore); }
      m.userData.water = true;
      m.onBeforeRender = () => { const t = performance.now() / 1000; if (mat.normalMap) mat.normalMap.offset.set(t * 0.012, t * 0.008); fish.forEach((o) => { const a = t * o.sp + o.p, x = Math.sin(a) * o.ax, y = Math.sin(a * o.q * 0.5 + o.p) * o.ay, x2 = Math.sin(a + 0.02) * o.ax, y2 = Math.sin((a + 0.02) * o.q * 0.5 + o.p) * o.ay; o.f.position.x = x; o.f.position.y = y; o.f.rotation.z = Math.atan2(y2 - y, x2 - x) + 0.12 * Math.sin(t * 6 + o.p); }); };
    } catch (e) { /* plain water */ }
    return m;
  };

  /* ================= 4. 2D boards ================= */
  const rr = (g, x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
  AK.barChart = (B, x, y, w, h, items, o = {}) => {
    const g = B.g, A = AK.axes(B, x, y, w, h, Object.assign({ x0: 0, x1: items.length, nx: 1, y0: 0, y1: o.max || Math.max(...items.map((i) => i[1])) * 1.15, grid: true }, o)), bw = A.pw / items.length * 0.62, base = A.py + A.ph;
    items.forEach(([n, v, col], i) => {
      const cx = A.px + (i + 0.5) * A.pw / items.length, top = Math.min(base - 1, A.Y(v)), hh = base - top, r = Math.min(7, bw / 2, hh);
      g.save(); g.shadowColor = "rgba(0,0,0,.22)"; g.shadowBlur = 7; g.shadowOffsetY = 2; g.fillStyle = col || B.P.blue; rr(g, cx - bw / 2, top, bw, hh, [r, r, 0, 0]); g.fill(); g.restore();
      const gr = g.createLinearGradient(cx - bw / 2, 0, cx + bw / 2, 0); gr.addColorStop(0, "rgba(255,255,255,.3)"); gr.addColorStop(0.45, "rgba(255,255,255,.04)"); gr.addColorStop(1, "rgba(0,0,0,.2)"); g.fillStyle = gr; rr(g, cx - bw / 2, top, bw, hh, [r, r, 0, 0]); g.fill();
      B.text(o.fmt ? o.fmt(v) : MK.fmt(v, 3), cx, top - 6, { size: 10.5, w: 700, align: "center", color: B.P.ink }); B.text(n, cx, base + 28, { size: 10, align: "center", color: B.P.soft });
    });
    return A;
  };
  AK.pie = (B, cx, cy, r, items) => {
    const g = B.g, tot = items.reduce((a, b) => a + b[1], 0) || 1, ri = r * 0.52; let a = -Math.PI / 2;
    items.forEach(([n, v, col]) => {
      const da = v / tot * Math.PI * 2, pad = Math.min(0.02, da / 4);
      g.save(); g.shadowColor = "rgba(0,0,0,.2)"; g.shadowBlur = 6; g.shadowOffsetY = 2; g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r, a + pad, a + da - pad); g.arc(cx, cy, ri, a + da - pad, a + pad, true); g.closePath(); g.fill(); g.restore();
      const m = a + da / 2; if (v / tot > 0.04) { B.line(cx + Math.cos(m) * r, cy + Math.sin(m) * r, cx + Math.cos(m) * (r + 9), cy + Math.sin(m) * (r + 9), col, 1.4); B.text(n + " " + Math.round(v / tot * 100) + "%", cx + Math.cos(m) * (r + 13), cy + Math.sin(m) * (r + 13) + 4, { size: 10.5, align: Math.cos(m) > 0 ? "left" : "right" }); }
      a += da;
    });
  };
  const curve0 = AK.curve;
  AK.curve = (B, A, f, x0, x1, col, w = 2.4, n = 80, dash) => {
    if (!dash) try { const g = B.g, lo = A.y0 == null ? -Infinity : Math.min(A.y0, A.y1), hi = A.y0 == null ? Infinity : Math.max(A.y0, A.y1); g.save(); g.strokeStyle = col; g.globalAlpha = 0.16; g.lineWidth = w + 6; g.lineCap = g.lineJoin = "round"; let pen = false; g.beginPath(); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = f(x); if (isFinite(y) && y >= lo - 1e-9 && y <= hi + 1e-9) { if (pen) g.lineTo(A.X(x), A.Y(y)); else { g.moveTo(A.X(x), A.Y(y)); pen = true; } } else pen = false; } g.stroke(); g.restore(); } catch (e) { /* no glow */ }
    return curve0(B, A, f, x0, x1, col, w, n, dash);
  };
  AK.btable = (B, x, y, colW, rows, o = {}) => {
    const g = B.g, rh = o.rh || 20, W = colW.reduce((a, b) => a + b, 0), H = rows.length * rh;
    g.save(); rr(g, x, y, W, H, 7); g.clip();
    rows.forEach((r, i) => { g.fillStyle = i === 0 ? (B.P.fillA || "rgba(120,140,200,.22)") : i === o.hi ? "rgba(217,164,65,.28)" : i % 2 ? "rgba(128,140,170,.07)" : "rgba(255,255,255,.02)"; g.fillRect(x, y + i * rh, W, rh); let xx = x; r.forEach((cell, j) => { B.text(String(cell), xx + 7, y + i * rh + 14, { size: o.size || 10.5, w: i === 0 ? 700 : 500, halo: false }); xx += colW[j]; }); });
    g.restore(); g.save(); g.strokeStyle = B.P.grid || "rgba(120,130,150,.35)"; g.lineWidth = 1; rr(g, x + 0.5, y + 0.5, W - 1, H - 1, 7); g.stroke(); g.beginPath(); g.moveTo(x, y + rh + 0.5); g.lineTo(x + W, y + rh + 0.5); g.stroke(); g.restore();
    return y + H;
  };

  /* ================= 5. trees: flared, slightly leaning trunks and irregular, lumpy crowns instead of round balls ================= */
  const plant0 = AK.plant;
  AK.plant = (kind, stage = 1, o = {}) => {
    const g = plant0(kind, stage, o), sp = (AK.PLANTS || {})[kind];
    if (!o || !o.raw || !sp || sp.f !== "tree") return g;
    try {
      const T3 = T(), seed = (o.seed || 1) * 3.7 + kind.length, lump = (x, y, z) => { const n = BK.fbm(x * 1.7 + seed, y * 1.7 + 2, z * 1.7 + seed * 0.5); return (0.7 + 0.62 * n) * (y < -0.35 ? 0.86 : 1); };
      const blob = g.children.find((m) => m.isMesh && m.geometry && m.geometry.type === "IcosahedronGeometry"), trunk = g.children.find((m) => m.isMesh && m.geometry && m.geometry.type === "CylinderGeometry");
      if (trunk) { const P = trunk.geometry.parameters, ge = new T3.CylinderGeometry(P.radiusTop, P.radiusBottom, P.height, 12, 8), p = ge.attributes.position, lean = (BK.rng(Math.round(seed * 10))() - 0.5) * 0.09; for (let i = 0; i < p.count; i++) { const t = p.getY(i) / P.height + 0.5, k = 1 + 0.85 * Math.exp(-t * 11) + 0.06 * Math.sin(Math.atan2(p.getZ(i), p.getX(i)) * 5) * Math.exp(-t * 6); p.setXYZ(i, p.getX(i) * k + Math.sin(t * 2.6) * P.height * lean, p.getY(i), p.getZ(i) * k + Math.sin(t * 1.9 + 1) * P.height * lean * 0.6); } ge.computeVertexNormals(); trunk.geometry.dispose(); trunk.geometry = ge; }
      if (blob) {
        const cy = blob.position.y, sy = blob.scale.y, R = blob.geometry.parameters.radius, cr = R / 0.86, ge = new T3.IcosahedronGeometry(R, 3), p = ge.attributes.position;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i) / R, y = p.getY(i) / R, z = p.getZ(i) / R, k = lump(x, y, z); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
        ge.computeVertexNormals();
        { /* smooth the facets: average the normals of vertices that share a position */
          const nn = ge.attributes.normal, acc = new Map(), key = (i) => Math.round(p.getX(i) * 400) + "_" + Math.round(p.getY(i) * 400) + "_" + Math.round(p.getZ(i) * 400);
          for (let i = 0; i < p.count; i++) { const k = key(i), q = acc.get(k) || [0, 0, 0]; q[0] += nn.getX(i); q[1] += nn.getY(i); q[2] += nn.getZ(i); acc.set(k, q); }
          for (let i = 0; i < p.count; i++) { const q = acc.get(key(i)), l = Math.hypot(q[0], q[1], q[2]) || 1; nn.setXYZ(i, q[0] / l, q[1] / l, q[2] / l); }
          blob.material = blob.material.clone(); blob.material.color.multiplyScalar(1.35); }
        blob.geometry.dispose(); blob.geometry = ge;
        g.children.forEach((m) => { if (m === blob || m === trunk) return; const dx = m.position.x, dy = (m.position.y - cy) / sy, dz = m.position.z, d = Math.hypot(dx, dy, dz); if (d < cr * 0.78 || d > cr * 1.25) return; if (m.geometry && m.geometry.type === "CylinderGeometry") return; const k = lump(dx / d, dy / d, dz / d) * 1.02; m.position.set(dx * k, cy + dy * sy * k, dz * k); });
      }
    } catch (e) { /* keep the plain tree */ }
    return g;
  };
})();
