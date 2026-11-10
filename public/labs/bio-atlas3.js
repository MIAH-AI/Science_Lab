/* bio-atlas3.js — animals and the farm kit for the Biology lab (loads after bio-atlas2.js).
   Cattle, goats and a Tilapia shaped from signed-distance bodies with painted coats (they replace the old
   capsule animals everywhere), plus maize, cassava, oil palm, mud-brick house, granary, fence and well
   for the farm settlement. All generated in code; no model files. */
(function () {
  "use strict";
  const BK = window.BK, BA = window.BA, sd = BA.sd, lin = BA.lin, mix3 = BA.mix3;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* paint a whole geometry one colour (as a vertex-colour attribute) so it can be merged with others */
  BA.tint = (g, hex, vary) => { const n = g.attributes.position.count, c = lin(hex), a = new Float32Array(n * 3), k = vary ? 1 + (Math.random() - 0.5) * vary : 1; for (let i = 0; i < n; i++) { a[i * 3] = c[0] * k; a[i * 3 + 1] = c[1] * k; a[i * 3 + 2] = c[2] * k; } g.setAttribute("color", new (T().BufferAttribute)(a, 3)); return g; };
  /* merge geometries that all carry position, normal and colour */
  BA.mergeC = (geos) => {
    let nv = 0, ni = 0; geos = geos.map((g) => (g.index ? g : g)); geos.forEach((g) => { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; });
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = new Uint32Array(ni); let vo = 0, io = 0;
    geos.forEach((g) => { const n = g.attributes.position.count; pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3); col.set(g.attributes.color.array, vo * 3); if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) idx[io + i] = a[i] + vo; io += a.length; } else { for (let i = 0; i < n; i++) idx[io + i] = vo + i; io += n; } vo += n; g.dispose(); });
    const out = new (T().BufferGeometry)(); out.setAttribute("position", new (T().BufferAttribute)(pos, 3)); out.setAttribute("normal", new (T().BufferAttribute)(nor, 3)); out.setAttribute("color", new (T().BufferAttribute)(col, 3)); out.setIndex(new (T().BufferAttribute)(idx, 1)); return out;
  };
  const place = (g, x, y, z, rx, ry, rz, sx, sy, sz) => { if (sx != null) g.scale(sx, sy == null ? sx : sy, sz == null ? sx : sz); if (rx) g.rotateX(rx); if (rz) g.rotateZ(rz); if (ry) g.rotateY(ry); g.translate(x, y, z); return g; };
  const vmat = (o) => new (T().MeshStandardMaterial)(Object.assign({ vertexColors: true, roughness: 0.85 }, o || {}));

  /* ================= quadrupeds (face +x, stand on y = 0, about 1.05 tall at the shoulder for s = 1) ================= */
  const KIND = {
    cow: { barrel: [0.62, 0.33, 0.3], legR: 0.06, legH: 0.5, neck: 0.55, horn: [0.24, 0.1], udder: 1, dewlap: 1, tail: 0.5, beard: 0, head: 1.15, hump: 1 },
    goat: { barrel: [0.5, 0.25, 0.22], legR: 0.042, legH: 0.52, neck: 0.85, horn: [0.2, -0.12], udder: 0, dewlap: 0, tail: 0.14, beard: 1, head: 0.82 },
  };
  function quadSDF(K) {
    const h = K.legH, by = h + K.barrel[1] * 0.75, hd = K.head;
    return (x, y, z) => {
      const az = Math.abs(z), S = sd.smin;
      let d = sd.ell(x, y, z, 0, by, 0, K.barrel[0], K.barrel[1], K.barrel[2]);
      d = S(d, sd.ell(x, y, z, 0.36, by + 0.03, 0, 0.27, K.barrel[1] * 1.08, K.barrel[2] * 0.95), 0.1);          // shoulders
      d = S(d, sd.ell(x, y, z, -0.4, by + 0.02, 0, 0.27, K.barrel[1] * 1.05, K.barrel[2]), 0.1);                   // hindquarters
      d = S(d, sd.cone(x, y, z, 0.5, by + 0.1, 0, 0.8, by + 0.3 * K.neck, 0, 0.19, 0.12 * hd), 0.1);               // neck
      const hx = 0.82, hy = by + 0.33 * K.neck;
      d = S(d, sd.cone(x, y, z, hx, hy, 0, hx + 0.27 * hd, hy - 0.15 * hd, 0, 0.125 * hd, 0.075 * hd), 0.05);      // head
      d = S(d, sd.ell(x, y, z, hx + 0.29 * hd, hy - 0.17 * hd, 0, 0.075 * hd, 0.07 * hd, 0.075 * hd), 0.04);       // muzzle
      d = S(d, sd.ell(x, y, az, hx - 0.01, hy + 0.06 * hd, 0.155 * hd, 0.045, 0.03, 0.085 * hd), 0.02);            // ears
      d = S(d, sd.cone(x, y, az, hx - 0.02, hy + 0.1 * hd, 0.07 * hd, hx - 0.02 + K.horn[1], hy + 0.1 * hd + K.horn[0], 0.07 * hd + (K.horn[1] < 0 ? 0.03 : 0.12), 0.028, 0.006), 0.012);   // horns
      for (const [lx, top, bend] of [[0.38, by - 0.1, 0.02], [-0.44, by - 0.08, -0.07]]) {
        let l = sd.cone(x, y, az, lx, top, K.barrel[2] * 0.55, lx + bend, h * 0.48, K.barrel[2] * 0.55, K.legR * 1.9, K.legR);
        l = S(l, sd.cone(x, y, az, lx + bend, h * 0.48, K.barrel[2] * 0.55, lx + bend * 0.4, 0.05, K.barrel[2] * 0.55, K.legR, K.legR * 0.9), 0.02);
        d = S(d, l, 0.05);
      }
      d = S(d, sd.cone(x, y, z, -0.64, by + 0.2, 0, -0.74, by + 0.2 - K.tail, 0, 0.03, 0.018), 0.03);              // tail
      if (K.tail > 0.3) d = S(d, sd.ell(x, y, z, -0.745, by + 0.12 - K.tail, 0, 0.035, 0.09, 0.035), 0.02);
      if (K.udder) d = S(d, sd.ell(x, y, z, -0.24, h + 0.02, 0, 0.13, 0.085, 0.11), 0.05);
      if (K.hump) d = S(d, sd.ell(x, y, z, 0.3, by + K.barrel[1] * 0.95, 0, 0.15, 0.12, 0.1), 0.09);                    // zebu hump
      if (K.dewlap) d = S(d, sd.ell(x, y, z, 0.56, by - 0.16, 0, 0.13, 0.15, 0.045), 0.07);
      if (K.beard) d = S(d, sd.cone(x, y, z, hx + 0.2 * hd, hy - 0.22 * hd, 0, hx + 0.17 * hd, hy - 0.36 * hd, 0, 0.03, 0.006), 0.02);
      return d;
    };
  }
  BA.quad = (s = 1, col = 0x8a6a4a, o = {}) => {
    const T3 = T(), kind = o.kind || (s >= 1.25 ? "cow" : "goat"), K = KIND[kind], h = K.legH, by = h + K.barrel[1] * 0.75, hx = 0.82, hy = by + 0.33 * K.neck, hd = K.head;
    const geo = BA.cached("quad_" + kind + col, () => {
      const base = lin(col), dark = mix3(base, [0, 0, 0], 0.55), light = mix3(base, [1, 1, 1], 0.55), hoof = lin(0x2a2420), horn = lin(0xe8dfc8), muz = lin(kind === "cow" ? 0x3a302c : 0x5a4a44), pink = lin(0xe0a8a0);
      return BA.mesh(quadSDF(K), [-0.95, -0.02, -0.4, 1.3, by + 0.75, 0.4], 0.026, { color: (x, y, z, nx, ny) => {
        const n = BK.fbm(x * 2.1 + (col % 7), y * 2.1 + 1.7, z * 2.1 + 3), az = Math.abs(z);
        let c = mix3(base, dark, sstep(0.455, 0.49, n) * (kind === "cow" ? 0.7 : 0.45));                               // large coat patches
        c = mix3(c, light, sstep(-0.35, -0.85, ny) * 0.45 * (y > h * 0.8 ? 1 : 0));                                  // paler belly
        c = mix3(c, dark, sstep(h * 0.55, 0.1, y) * 0.35);                                                           // darker lower legs
        if (y < 0.075) c = hoof;
        if (y > hy + 0.1 * hd + 0.02 && az > 0.03 && x > hx - 0.25 && x < hx + 0.25 && Math.hypot(x - hx, z) < 0.3) c = mix3(c, horn, sstep(hy + 0.11 * hd, hy + 0.15 * hd, y));
        if (x > hx + 0.26 * hd) c = muz;
        if (K.udder && y < h + 0.06 && x < -0.1 && x > -0.4 && az < 0.12 && y > h - 0.1) c = pink;
        if (K.tail > 0.3 && x < -0.7 && y < by - K.tail + 0.25) c = dark;
        return c;
      } });
    });
    const grp = new T3.Group(), body = new T3.Mesh(geo, new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 })); grp.add(body);
    const em = new T3.MeshPhysicalMaterial({ color: 0x0c0a08, roughness: 0.1, clearcoat: 1 });
    for (const sdv of [-1, 1]) { const e = new T3.Mesh(new T3.SphereGeometry(0.021 * hd, 10, 8), em); e.position.set(hx + 0.1 * hd, hy + 0.01, sdv * 0.105 * hd); grp.add(e); }
    grp.scale.setScalar(s * (kind === "cow" ? 0.86 : 0.95)); grp.traverse((q) => { if (q.isMesh) q.castShadow = true; }); grp.kind = kind;
    return grp;
  };
  BK.quad = BA.quad;

  /* ================= Tilapia (faces +x, about 1.6 long at s = 1) ================= */
  const fishSDF = (x, y, z) => {
    let d = sd.ell(x, y, z, 0.05, 0, 0, 0.62, 0.3, 0.115);
    d = sd.smin(d, sd.ell(x, y, z, 0.5, -0.02, 0, 0.26, 0.2, 0.1), 0.12);                                          // head
    d = sd.smin(d, sd.cone(x, y, z, -0.45, 0, 0, -0.72, 0, 0, 0.13, 0.075), 0.1);                                  // tail stalk
    return sd.smax(d, Math.abs(z) - 0.118, 0.03);
  };
  function fin(pts, mat) { const T3 = T(), sh = new T3.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]); sh.closePath(); return new T3.Mesh(new T3.ShapeGeometry(sh), mat); }
  let finTex = null;
  const finMap = () => { if (finTex) return finTex; const c = BK.cv(128, 128), g = c.getContext("2d"); g.fillStyle = "#c9c2a8"; g.fillRect(0, 0, 128, 128); g.strokeStyle = "rgba(70,70,50,.55)"; g.lineWidth = 1.6; for (let i = 0; i < 26; i++) { g.beginPath(); g.moveTo(i * 5, 0); g.lineTo(i * 5 + 8, 128); g.stroke(); } finTex = BK.tex(c, [3, 1]); return finTex; };
  BA.fish = (s = 1, col = 0x7d8a6a) => {
    const T3 = T(), grp = new T3.Group();
    const geo = BA.cached("fish" + col, () => { const back = mix3(lin(col), [0, 0, 0], 0.35), side = lin(col), belly = lin(0xe9e4d2), bar = mix3(lin(col), [0, 0, 0], 0.6);
      return BA.mesh(fishSDF, [-0.82, -0.36, -0.14, 0.82, 0.36, 0.14], 0.02, { color: (x, y, z) => { let c = mix3(belly, side, sstep(-0.2, 0.02, y)); c = mix3(c, back, sstep(0.08, 0.26, y)); c = mix3(c, bar, (0.5 + 0.5 * Math.sin(x * 26)) * sstep(-0.12, 0.1, y) * sstep(0.45, 0.2, x) * 0.45);
        const sc = Math.sin(x * 70 + Math.floor(y * 28) * 1.6) * Math.sin(y * 56); c = mix3(c, [1, 1, 1], Math.max(0, sc) * 0.12 * (x < 0.4 ? 1 : 0));                    // scales
        return mix3(c, back, (1 - sstep(0.008, 0.02, Math.abs(Math.hypot(x - 0.36, y + 0.02) - 0.17))) * (x < 0.42 ? 0.55 : 0)); } }); });                                // gill cover
    const body = new T3.Mesh(geo, new T3.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.25, iridescence: 0.35 })); grp.add(body);
    const fm = new T3.MeshPhysicalMaterial({ map: finMap(), color: col, roughness: 0.45, transparent: true, opacity: 0.86, side: T3.DoubleSide, depthWrite: false });
    const tail = fin([[0, 0.05], [-0.3, 0.24], [-0.26, 0], [-0.3, -0.24], [0, -0.05]], fm), piv = new T3.Group(); piv.position.x = -0.7; piv.add(tail); grp.add(piv); grp.tail = piv;
    const dorsal = fin([[0.34, 0.26], [0.2, 0.44], [-0.1, 0.43], [-0.36, 0.36], [-0.46, 0.2], [-0.4, 0.12]], fm); grp.add(dorsal);
    grp.add(fin([[-0.12, -0.26], [-0.2, -0.42], [-0.42, -0.3], [-0.44, -0.12]], fm), fin([[0.22, -0.26], [0.12, -0.44], [0.04, -0.28]], fm));
    for (const sdv of [-1, 1]) { const pf = fin([[0, 0], [-0.24, 0.07], [-0.26, -0.08], [-0.05, -0.07]], fm); pf.position.set(0.3, -0.06, sdv * 0.115); pf.rotation.y = sdv * -0.45; grp.add(pf);
      const eye = new T3.Mesh(new T3.SphereGeometry(0.036, 14, 10), new T3.MeshPhysicalMaterial({ color: 0xd8b04a, roughness: 0.15, clearcoat: 1 })); eye.position.set(0.56, 0.05, sdv * 0.085); eye.scale.z = 0.5; grp.add(eye);
      const pu = new T3.Mesh(new T3.SphereGeometry(0.018, 10, 8), new T3.MeshBasicMaterial({ color: 0x0a0a0a })); pu.position.set(0.565, 0.05, sdv * 0.1); pu.scale.z = 0.4; grp.add(pu); }
    grp.scale.setScalar(s); grp.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return grp;
  };
  BK.fish = BA.fish;

  /* ================= farm kit ================= */
  const F = (BA.farm = {});
  let roofTex = null, mudTex = null, thatchTex = null;
  const stripes = (base, line, n, noise) => { const c = BK.cv(256, 256), g = c.getContext("2d"); g.fillStyle = base; g.fillRect(0, 0, 256, 256); for (let i = 0; i < n; i++) { const x = (i + 0.5) * 256 / n; const gr = g.createLinearGradient(x - 128 / n, 0, x + 128 / n, 0); gr.addColorStop(0, line); gr.addColorStop(0.5, "rgba(255,255,255,.28)"); gr.addColorStop(1, line); g.fillStyle = gr; g.fillRect(x - 128 / n, 0, 256 / n, 256); } if (noise) for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${90 + Math.random() * 60},${50 + Math.random() * 40},30,${Math.random() * 0.25})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 5, 2 + Math.random() * 8); } return c; };
  F.roofMat = () => { roofTex = roofTex || BK.tex(stripes("#8f9aa3", "rgba(40,50,60,.5)", 14, true), [1.5, 1]); return new (T().MeshStandardMaterial)({ map: roofTex, roughness: 0.5, metalness: 0.55, side: T().DoubleSide }); };
  F.mudMat = () => { if (!mudTex) { const c = BK.cv(256, 256), g = c.getContext("2d"); g.fillStyle = "#b9763f"; g.fillRect(0, 0, 256, 256); for (let r = 0; r < 8; r++) for (let i = 0; i < 5; i++) { g.strokeStyle = "rgba(80,45,20,.35)"; g.lineWidth = 2; g.strokeRect(i * 52 - (r % 2) * 26, r * 32, 52, 32); } for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${110 + Math.random() * 90},${60 + Math.random() * 60},${30 + Math.random() * 30},.25)`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); } mudTex = BK.tex(c, [2, 1]); } return new (T().MeshStandardMaterial)({ map: mudTex, roughness: 0.95 }); };
  F.thatchMat = () => { if (!thatchTex) { const c = BK.cv(256, 256), g = c.getContext("2d"); g.fillStyle = "#b08a3c"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 1600; i++) { g.strokeStyle = `rgba(${120 + Math.random() * 110},${90 + Math.random() * 80},${20 + Math.random() * 50},.6)`; g.lineWidth = 1 + Math.random(); const x = Math.random() * 256, y = Math.random() * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 6, y + 14 + Math.random() * 22); g.stroke(); } thatchTex = BK.tex(c, [4, 2]); } return new (T().MeshStandardMaterial)({ map: thatchTex, roughness: 1, side: T().DoubleSide }); };
  /* mud-brick house with a corrugated metal gable roof */
  F.house = (w = 3, d = 2.4, h = 1.9) => {
    const T3 = T(), g = new T3.Group(), walls = new T3.Mesh(new T3.BoxGeometry(w, h, d), F.mudMat()); walls.position.y = h / 2; g.add(walls);
    const sh = new T3.Shape(); sh.moveTo(-d / 2 - 0.25, 0); sh.lineTo(0, d * 0.34); sh.lineTo(d / 2 + 0.25, 0); sh.closePath();
    const gable = new T3.Mesh(new T3.ExtrudeGeometry(sh, { depth: w, bevelEnabled: false }), F.mudMat()); gable.rotation.y = Math.PI / 2; gable.position.set(-w / 2, h, 0); g.add(gable);
    const L = Math.hypot(d / 2 + 0.25, d * 0.34) + 0.12;
    for (const s of [-1, 1]) { const r = new T3.Mesh(new T3.PlaneGeometry(w + 0.5, L), F.roofMat()); r.position.set(0, h + d * 0.17 + 0.02, s * (d / 4 + 0.125)); r.rotation.x = -Math.PI / 2 + s * Math.atan2(d * 0.34, d / 2 + 0.25); r.rotation.order = "YXZ"; g.add(r); }
    const dm = new T3.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.8 }), door = new T3.Mesh(new T3.BoxGeometry(0.62, 1.35, 0.05), dm); door.position.set(-w * 0.18, 0.68, d / 2 + 0.02); g.add(door);
    const wm = new T3.MeshStandardMaterial({ color: 0x1c2630, roughness: 0.3 }); for (const x of [w * 0.22]) { const win = new T3.Mesh(new T3.BoxGeometry(0.55, 0.5, 0.05), wm); win.position.set(x, h * 0.62, d / 2 + 0.02); g.add(win); const fr = new T3.Mesh(new T3.BoxGeometry(0.65, 0.07, 0.07), dm); fr.position.set(x, h * 0.62 - 0.29, d / 2 + 0.03); g.add(fr); }
    return BK.shadow(g);
  };
  /* round mud granary on stones with a conical thatched roof */
  F.granary = (r = 0.7, h = 1.3) => {
    const T3 = T(), g = new T3.Group(), pts = [[r * 0.72, 0], [r, h * 0.35], [r * 0.96, h * 0.8], [r * 0.7, h]].map((p) => new T3.Vector2(p[0], p[1]));
    const body = new T3.Mesh(new T3.LatheGeometry(pts, 28), new T3.MeshStandardMaterial({ color: 0xb37a45, roughness: 1 })); body.position.y = 0.28; g.add(body);
    const roof = new T3.Mesh(new T3.ConeGeometry(r * 1.38, h * 0.75, 28, 1, true), F.thatchMat()); roof.position.y = 0.28 + h + h * 0.3; g.add(roof);
    for (let i = 0; i < 5; i++) { const st = new T3.Mesh(BK.blob(0.16, i + 2, 0.2, 10), new T3.MeshStandardMaterial({ color: 0x77736c, roughness: 1 })); st.position.set(Math.cos(i * 1.26) * r * 0.6, 0.12, Math.sin(i * 1.26) * r * 0.6); g.add(st); }
    return BK.shadow(g);
  };
  /* post-and-rail fence through a list of [x, z] points */
  F.fence = (pts, o = {}) => {
    const T3 = T(), geos = [], h = o.h || 0.75;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / 0.9)), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (let k = 0; k <= n; k++) { const t = k / n; geos.push(place(new T3.CylinderGeometry(0.035, 0.045, h, 6), a[0] + (b[0] - a[0]) * t, h / 2, a[1] + (b[1] - a[1]) * t, 0, 0, (Math.random() - 0.5) * 0.08)); }
      for (const y of [h * 0.42, h * 0.82]) geos.push(place(new T3.BoxGeometry(len, 0.05, 0.03), (a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2, 0, -ang, 0));
    }
    const m = new T3.Mesh(BA.merge(geos), new T3.MeshStandardMaterial({ color: o.color || 0x7a5a3a, roughness: 0.95 })); m.castShadow = true; return m;
  };
  F.well = () => {
    const T3 = T(), g = new T3.Group(), ring = new T3.Mesh(new T3.CylinderGeometry(0.5, 0.55, 0.6, 24, 1, true), new T3.MeshStandardMaterial({ color: 0x9a968c, roughness: 1, side: T3.DoubleSide })); ring.position.y = 0.3; g.add(ring);
    const water = new T3.Mesh(new T3.CircleGeometry(0.48, 24), new T3.MeshPhysicalMaterial({ color: 0x24506a, roughness: 0.05 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.36; g.add(water);
    const wd = new T3.MeshStandardMaterial({ color: 0x6a4a30, roughness: 0.9 }); for (const s of [-1, 1]) { const p = new T3.Mesh(new T3.CylinderGeometry(0.04, 0.04, 1.5, 8), wd); p.position.set(s * 0.55, 0.75, 0); g.add(p); } const bar = new T3.Mesh(new T3.CylinderGeometry(0.035, 0.035, 1.25, 8), wd); bar.rotation.z = Math.PI / 2; bar.position.y = 1.45; g.add(bar);
    const bucket = new T3.Mesh(new T3.CylinderGeometry(0.12, 0.09, 0.2, 12), new T3.MeshStandardMaterial({ color: 0x5a6068, metalness: 0.5, roughness: 0.5 })); bucket.position.set(0.1, 0.95, 0); g.add(bucket); const rope = new T3.Mesh(new T3.CylinderGeometry(0.008, 0.008, 0.42, 5), wd); rope.position.set(0.1, 1.24, 0); g.add(rope);
    return BK.shadow(g);
  };
  /* oil palm: ringed trunk, arching fronds and a bunch of fruit */
  F.palm = (h = 4, seed = 3) => {
    const T3 = T(), g = new T3.Group(), rr = BK.rng(seed);
    const cv = BA.curve([[0, 0, 0], [0.08 * h * (rr() - 0.5), h * 0.5, 0.05 * h * (rr() - 0.5)], [0.14 * h * (rr() - 0.5), h, 0.1 * h * (rr() - 0.5)]]);
    const trunk = BA.tube(cv, 0.17, new T3.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), { seg: 40, rs: 9, r: (t) => 1.25 - 0.35 * t + 0.09 * Math.abs(Math.sin(t * 60)), color: (t) => (Math.sin(t * 120) > 0.2 ? lin(0x5a4632) : lin(0x3c3024)) }); g.add(trunk);
    const top = cv.getPointAt(1), geos = [];
    for (let i = 0; i < 16; i++) {
      const a = i * 2.4 + rr(), tilt = 0.35 + (i % 4) * 0.28 + rr() * 0.15, L = h * (0.48 + rr() * 0.14);
      const fr = BK.leafGeo(L, L * 0.2, 0.42 + tilt * 0.25, 14); const p = fr.attributes.position; for (let k = 0; k < p.count; k++) { const y = p.getY(k), x = p.getX(k); p.setZ(k, p.getZ(k) - Math.abs(Math.sin(y * 34 / L * 0.6)) * Math.abs(x) * 0.35); } fr.computeVertexNormals();
      BA.tint(fr, i % 3 ? 0x3d7a2c : 0x4f8f34, 0.2); fr.deleteAttribute("uv"); geos.push(place(fr, top.x, top.y, top.z, tilt, a, 0));
    }
    const crown = new T3.Mesh(BA.mergeC(geos), vmat({ side: T3.DoubleSide, roughness: 0.7 })); g.add(crown);
    const fruit = new T3.Mesh(BK.blob(0.2, seed, 0.3, 12, 1, 1.2, 1), new T3.MeshStandardMaterial({ color: 0x9a2a1a, roughness: 0.6 })); fruit.position.copy(top).add(V(0.12, -0.28, 0.1)); g.add(fruit);
    return BK.shadow(g);
  };
  /* one maize plant as a single coloured geometry (stem, arching leaves, tassel, cob) — for InstancedMesh */
  F.maizeGeo = () => BA.cached("maize", () => {
    const T3 = T(), geos = [], rr = BK.rng(5);
    geos.push(BA.tint(place(new T3.CylinderGeometry(0.022, 0.034, 1.9, 7), 0, 0.95, 0), 0x6f9a3c));
    for (let i = 0; i < 9; i++) { const y = 0.28 + i * 0.17, a = i * 2.5, L = 0.78 - Math.abs(i - 4) * 0.045; const lf = BK.leafGeo(L, 0.1, 0.62, 10); lf.deleteAttribute("uv"); BA.tint(lf, i % 2 ? 0x4f9638 : 0x5aa53f, 0.15); geos.push(place(lf, 0, y, 0, 0.75 + rr() * 0.2, a, 0)); }
    for (let i = 0; i < 7; i++) { const t = new T3.CylinderGeometry(0.004, 0.008, 0.3, 4); geos.push(BA.tint(place(t, 0, 2.02, 0, 0, i * 0.9, 0.25 + (i % 3) * 0.2), 0xd9c56a)); }
    const cob = new T3.SphereGeometry(0.055, 10, 8); geos.push(BA.tint(place(cob, 0.07, 1.12, 0.02, 0, 0, -0.35, 1, 2.6, 1), 0x8fb24a));
    const silk = new T3.ConeGeometry(0.03, 0.1, 6); geos.push(BA.tint(place(silk, 0.12, 1.27, 0.02, 0, 0, -0.35), 0x8a4a22));
    return BA.mergeC(geos.map((g) => { g.deleteAttribute("uv"); return g; }));
  });
  /* cassava: thin knobbly stems with hand-shaped leaves */
  F.cassavaGeo = () => BA.cached("cassava", () => {
    const T3 = T(), geos = [];
    for (let s = 0; s < 3; s++) { const lean = (s - 1) * 0.3, hgt = 1.15 + s * 0.12; geos.push(BA.tint(place(new T3.CylinderGeometry(0.014, 0.022, hgt, 6), Math.sin(lean) * hgt / 2, hgt / 2, (s - 1) * 0.04, 0, 0, -lean), 0x9a8a6a));
      for (let k = 0; k < 5; k++) { const y = hgt * (0.55 + k * 0.1), px = Math.sin(lean) * y, a = k * 2.2 + s; for (let f2 = 0; f2 < 5; f2++) { const lf = BK.leafGeo(0.3, 0.07, 0.25, 5); lf.deleteAttribute("uv"); BA.tint(lf, 0x3c8a35, 0.2); lf.rotateZ((f2 - 2) * 0.42); lf.rotateX(1.25); lf.translate(0, 0, 0.16); lf.rotateY(a); lf.translate(px, y, (s - 1) * 0.04); geos.push(lf); } } }
    return BA.mergeC(geos.map((g) => { g.deleteAttribute("uv"); return g; }));
  });
  /* low bush for the fallow strip */
  F.bushGeo = () => BA.cached("bush", () => { const T3 = T(), geos = []; for (let i = 0; i < 5; i++) { const b = BK.blob(0.28 + (i % 3) * 0.07, i + 4, 0.3, 10); b.deleteAttribute("uv"); geos.push(BA.tint(place(b, Math.cos(i * 1.3) * 0.22, 0.3 + (i % 2) * 0.15, Math.sin(i * 1.3) * 0.22), i % 2 ? 0x55772f : 0x6a8a3a)); } return BA.mergeC(geos); });
  /* ridged soil: rows run along x */
  F.ridges = (w, d, rows, mat) => { const T3 = T(), g = new T3.PlaneGeometry(w, d, 40, rows * 10); g.rotateX(-Math.PI / 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i), x = p.getX(i); p.setY(i, 0.09 * (0.5 + 0.5 * Math.cos((z / d + 0.5) * rows * 2 * Math.PI + Math.PI)) + (BK.noise3(x * 3, 0, z * 3) - 0.5) * 0.03); } g.computeVertexNormals(); const m = new T3.Mesh(g, mat); m.receiveShadow = true; return m; };
  /* ribbon of water along a path of [x, z] points */
  F.river = (pts, width, mat) => { const T3 = T(), cv = BA.curve(pts.map((p) => [p[0], 0, p[1]])), n = 60, pos = [], idx = [], uv = []; for (let i = 0; i <= n; i++) { const t = i / n, p = cv.getPointAt(t), tg = cv.getTangentAt(t), nx = -tg.z, nz = tg.x, w = width * (0.9 + 0.2 * Math.sin(t * 9)); pos.push(p.x + nx * w / 2, 0, p.z + nz * w / 2, p.x - nx * w / 2, 0, p.z - nz * w / 2); uv.push(0, t * 8, 1, t * 8); if (i < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } } const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new T3.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); const m = new T3.Mesh(g, mat); m.userData.curve = cv; return m; };
})();
