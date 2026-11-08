/* agric-kit2.js — Agricultural Science toolkit part 2: farm animals (West African breeds), poultry, fish,
   honey bees, insect and non-insect pests, parasites, microbes and people. Procedural, PBR-shaded,
   with fur / feather texture from canvas noise. Animals face +x and stand on y = 0. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, GK = window.GK, AK = window.AK;
  const T = () => window.THREE, V3 = (x, y, z) => new (T().Vector3)(x, y, z);
  const cache = {};
  const once = (k, f) => cache[k] || (cache[k] = f());
  const hexs = (h) => "#" + (h >>> 0).toString(16).padStart(6, "0");

  /* coat texture: base colour + speckle + optional patches (Holstein), saddle / bicolour, face colour */
  function coatTex(o) {
    return once("coat" + JSON.stringify(o), () => {
      const c = BK.cv(512, 256), g = c.getContext("2d"), r = BK.rng(o.seed || 5);
      g.fillStyle = hexs(o.col); g.fillRect(0, 0, 512, 256);
      if (o.front != null) { g.fillStyle = hexs(o.front); g.fillRect(0, 0, 512 * (o.split || 0.45), 256); }
      if (o.patch != null) { g.fillStyle = hexs(o.patch); for (let i = 0; i < 9; i++) { g.beginPath(); const x = r() * 512, y = r() * 256, rr = 30 + r() * 55; for (let k = 0; k <= 14; k++) { const a = (k / 14) * 6.283, q = rr * (0.6 + 0.5 * BK.noise3(x + Math.cos(a), y + Math.sin(a), i)); g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q * 0.8); } g.fill(); } }
      for (let i = 0; i < 9000; i++) { const x = r() * 512, y = r() * 256, v = r(); g.fillStyle = v < 0.5 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)"; g.fillRect(x, y, 1 + r() * 2, 3 + r() * 5); }
      const grad = g.createLinearGradient(0, 0, 0, 256); grad.addColorStop(0, "rgba(0,0,0,0.0)"); grad.addColorStop(0.75, "rgba(0,0,0,0.0)"); grad.addColorStop(1, "rgba(0,0,0,0.22)"); g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
      const t = new (T().CanvasTexture)(c); t.colorSpace = T().SRGBColorSpace; t.wrapS = t.wrapT = T().RepeatWrapping; return t;
    });
  }
  const furBump = () => once("furbump", () => { const c = BK.cv(256, 256), g = c.getContext("2d"), r = BK.rng(9); g.fillStyle = "#808080"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 7000; i++) { g.fillStyle = r() < 0.5 ? "rgba(0,0,0,.25)" : "rgba(255,255,255,.25)"; g.fillRect(r() * 256, r() * 256, 1, 2 + r() * 4); } const t = new (T().CanvasTexture)(c); t.wrapS = t.wrapT = T().RepeatWrapping; t.repeat.set(4, 2); return t; });
  AK.furMat = (o) => once("fur" + JSON.stringify(o), () => new (T().MeshPhysicalMaterial)({ map: coatTex(o), bumpMap: furBump(), bumpScale: o.wool ? 3 : 1.2, roughness: o.wool ? 1 : 0.78, sheen: 0.7, sheenRoughness: 0.6, sheenColor: new (T().Color)(o.sheen || 0xffe8d0) }));
  const skin = (col, r = 0.55) => AK.phys(col, { roughness: r, sheen: 0.5, sheenColor: new (T().Color)(0xffd8c8) });

  /* body: deformed sphere along x — chest fuller than loin, belly sag, optional hump */
  function bodyGeo(L, Hh, W, o = {}) {
    const T3 = T(), g = new T3.SphereGeometry(1, 40, 24), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const f = 1 + 0.12 * Math.max(0, x) - (o.taper || 0.06) * Math.max(0, -x); y *= f; z *= f; if (y < 0) y *= 1 + (o.belly || 0.1) * (1 - x * x); if (o.hump && x > 0.35 && y > 0) y += o.hump * Math.exp(-((x - 0.62) ** 2) / 0.02) * y; if (y > 0) y *= 0.92; p.setXYZ(i, x * L / 2, y * Hh / 2, z * W / 2); }
    g.computeVertexNormals(); return g;
  }
  const limb = (r0, r1, L, mat) => { const T3 = T(), m = new T3.Mesh(new T3.CapsuleGeometry((r0 + r1) / 2, L, 4, 8), mat); m.geometry.translate(0, -L / 2, 0); return m; };
  /* quadruped breeds */
  const Q = {
    whitefulani: { L: 1.7, H: 0.62, W: 0.48, leg: 0.72, coat: { col: 0xf0ece2 }, face: 0xe8e2d6, horn: "lyre", hl: 0.55, hump: 0.55, dewlap: 1, ear: "droop", kind: "cow" },
    ndama: { L: 1.45, H: 0.55, W: 0.44, leg: 0.6, coat: { col: 0xc89356 }, horn: "lyre", hl: 0.35, ear: "side", kind: "cow" },
    muturu: { L: 1.15, H: 0.48, W: 0.38, leg: 0.48, coat: { col: 0x2a2420 }, horn: "short", hl: 0.12, ear: "side", kind: "cow" },
    holstein: { L: 1.75, H: 0.66, W: 0.52, leg: 0.74, coat: { col: 0xf4f2ee, patch: 0x161616, seed: 3 }, horn: "none", ear: "side", udder: 1, kind: "cow" },
    cow: { L: 1.6, H: 0.62, W: 0.48, leg: 0.7, coat: { col: 0x9a6a3a }, horn: "short", hl: 0.2, ear: "side", udder: 1, kind: "cow" },
    bull: { L: 1.85, H: 0.72, W: 0.56, leg: 0.74, coat: { col: 0x5a3a24 }, horn: "short", hl: 0.25, hump: 0.4, ear: "side", kind: "cow" },
    calf: { L: 0.9, H: 0.38, W: 0.3, leg: 0.5, coat: { col: 0xc89356 }, horn: "none", ear: "side", kind: "cow" },
    wad: { L: 0.75, H: 0.32, W: 0.26, leg: 0.3, coat: { col: 0x2a2420, front: 0xf0e8e0, split: 0.3 }, horn: "back", hl: 0.12, beard: 1, ear: "side", kind: "goat" },
    redsokoto: { L: 0.85, H: 0.32, W: 0.26, leg: 0.42, coat: { col: 0x9a4a24 }, horn: "back", hl: 0.16, ear: "side", kind: "goat" },
    goat: { L: 0.8, H: 0.32, W: 0.26, leg: 0.38, coat: { col: 0xf0ece4, patch: 0x5a3a24, seed: 7 }, horn: "back", hl: 0.12, beard: 1, ear: "droop", kind: "goat" },
    yankasa: { L: 1.0, H: 0.42, W: 0.36, leg: 0.48, coat: { col: 0xf2eee6, wool: 1 }, face: 0x2a2420, horn: "curl", hl: 0.12, ear: "droop", kind: "sheep" },
    uda: { L: 1.05, H: 0.42, W: 0.34, leg: 0.55, coat: { col: 0xf2eee6, front: 0x241e1a, split: 0.5 }, face: 0x241e1a, horn: "curl", hl: 0.18, ear: "droop", kind: "sheep" },
    sheep: { L: 0.95, H: 0.44, W: 0.38, leg: 0.42, coat: { col: 0xf0ece0, wool: 1 }, face: 0xe8e0d0, horn: "none", ear: "side", kind: "sheep" },
    pig: { L: 1.25, H: 0.55, W: 0.5, leg: 0.28, coat: { col: 0xf2c8b8 }, horn: "none", ear: "pig", snout: 1, kind: "pig", sheen: 0xffd0c0 },
    piglet: { L: 0.45, H: 0.22, W: 0.2, leg: 0.12, coat: { col: 0xf2c8b8 }, horn: "none", ear: "pig", snout: 1, kind: "pig" },
    rabbit: { L: 0.36, H: 0.24, W: 0.22, leg: 0.06, coat: { col: 0xf4f2ee }, horn: "none", ear: "rabbit", kind: "rabbit" },
  };
  AK.BREEDS = Q;
  /* AK.animal(breed) → Group with .legs [pivots] .head (pivot) .tail for animation */
  AK.animal = (breed = "cow", o = {}) => {
    const T3 = T(), B = Q[breed] || Q.cow, g = new T3.Group(), coat = Object.assign({}, B.coat, o.coat || {}), fur = AK.furMat(Object.assign({ sheen: B.sheen }, coat));
    const faceMat = B.face != null ? AK.furMat({ col: B.face }) : fur, hoof = AK.std(0x1e1a18, { roughness: 0.5 }), L = B.L, Hh = B.H, W = B.W, leg = B.leg;
    const body = new T3.Mesh(bodyGeo(L, Hh, W, { hump: B.hump, belly: B.kind === "pig" ? 0.25 : 0.14 }), fur); body.position.y = leg + Hh * 0.45; g.add(body);
    if (coat.wool) { const wl = new T3.Mesh(bodyGeo(L * 1.06, Hh * 1.12, W * 1.12, {}), fur); wl.position.copy(body.position); g.add(wl); }
    /* legs */
    g.legs = [];
    const lx = L * 0.32, lz = W * 0.28;
    [[lx, lz], [lx, -lz], [-lx, lz], [-lx, -lz]].forEach(([x, z], i) => { const pv = new T3.Group(); pv.position.set(x, leg + Hh * 0.15, z); const up = limb(W * 0.13, W * 0.1, leg * 0.5, fur); pv.add(up); const low = limb(W * 0.075, W * 0.06, leg * 0.48, B.kind === "pig" || B.kind === "rabbit" ? fur : faceMat); low.position.y = -leg * 0.52; pv.add(low); const hf = new T3.Mesh(new T3.CylinderGeometry(W * 0.075, W * 0.085, leg * 0.08, 8), hoof); hf.position.y = -leg - Hh * 0.12; if (B.kind !== "rabbit") pv.add(hf); g.add(pv); g.legs.push(pv); });
    if (B.kind === "rabbit") { g.legs.forEach((p, i) => { p.scale.y = i < 2 ? 1.2 : 1.6; }); }
    /* neck + head */
    const hp = new T3.Group(); hp.position.set(L * 0.42, leg + Hh * 0.7, 0); g.add(hp); g.head = hp;
    const neckL = B.kind === "pig" ? 0.08 : B.kind === "rabbit" ? 0.04 : L * 0.22;
    const neck = new T3.Mesh(new T3.CylinderGeometry(W * 0.24, W * 0.34, neckL, 12), fur); neck.rotation.z = -0.9; neck.position.set(neckL * 0.35, neckL * 0.2, 0); hp.add(neck);
    const hs = B.kind === "pig" ? W * 0.55 : B.kind === "rabbit" ? W * 0.62 : L * 0.17;
    const head = new T3.Mesh(new T3.SphereGeometry(hs, 24, 16), faceMat); head.scale.set(1.25, 0.9, 0.78); head.position.set(neckL * 0.75 + hs * 0.5, neckL * 0.35 + (B.kind === "pig" ? 0 : hs * 0.2), 0); hp.add(head);
    const muz = new T3.Mesh(new T3.SphereGeometry(hs * 0.62, 18, 12), B.snout ? skin(0xe8a8a0) : faceMat); muz.scale.set(1.2, 0.85, 0.85); muz.position.set(head.position.x + hs * 0.95, head.position.y - hs * 0.28, 0); hp.add(muz);
    if (B.snout) { const sn = new T3.Mesh(new T3.CylinderGeometry(hs * 0.32, hs * 0.36, hs * 0.2, 16), skin(0xd88a88)); sn.rotation.z = Math.PI / 2; sn.position.set(muz.position.x + hs * 0.62, muz.position.y, 0); hp.add(sn); }
    const nose = new T3.Mesh(new T3.SphereGeometry(hs * 0.3, 12, 8), AK.phys(B.kind === "pig" ? 0xc87878 : 0x2a2222, { roughness: 0.3, clearcoat: 0.6 })); nose.scale.set(0.6, 0.8, 1.4); nose.position.set(muz.position.x + hs * 0.6, muz.position.y + hs * 0.08, 0); if (!B.snout) hp.add(nose);
    [-1, 1].forEach((sd) => { const e = new T3.Mesh(new T3.SphereGeometry(hs * 0.11, 12, 8), AK.phys(0x0c0a08, { roughness: 0.05, clearcoat: 1 })); e.position.set(head.position.x + hs * 0.55, head.position.y + hs * 0.25, sd * hs * 0.6); hp.add(e);
      const earL = B.ear === "rabbit" ? hs * 1.9 : B.ear === "pig" ? hs * 0.7 : hs * 0.7; const ear = new T3.Mesh(BK.leafGeo(earL, earL * (B.ear === "rabbit" ? 0.35 : 0.55), 0.1, 6), Object.assign(fur.clone(), { side: T3.DoubleSide })); const ep = new T3.Group(); ep.position.set(head.position.x - hs * 0.2, head.position.y + hs * 0.55, sd * hs * 0.55); ear.rotation.x = sd * (B.ear === "droop" ? 2.3 : B.ear === "pig" ? 0.9 : B.ear === "rabbit" ? 0.25 : 1.6); ear.rotation.z = B.ear === "rabbit" ? 0.4 : 0; ep.add(ear); hp.add(ep);
      if (B.horn && B.horn !== "none") { const hm = AK.phys(0xd8ccb0, { roughness: 0.4, clearcoat: 0.4 }), hl = B.hl || 0.2, pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; let x = 0, y = 0, z = 0; if (B.horn === "lyre") { x = -0.2 * t * hl; y = t * hl * 0.9; z = sd * (0.35 * Math.sin(t * 2.2) * hl + 0.05); } else if (B.horn === "back") { x = -t * hl; y = t * hl * 0.6 - t * t * hl * 0.3; z = sd * t * 0.03; } else if (B.horn === "curl") { const a = t * 4; x = -Math.sin(a) * hl * 0.5; y = (1 - Math.cos(a)) * hl * 0.3; z = sd * (0.04 + t * hl * 0.6); } else { x = 0.02 * t; y = t * hl; z = sd * t * hl * 0.5; } pts.push(V3(x, y, z)); }
        const horn = new T3.Mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 16, hs * 0.08, 8), hm); horn.position.set(head.position.x - hs * 0.15, head.position.y + hs * 0.6, sd * hs * 0.32); hp.add(horn); }
    });
    if (B.beard) { const bd = new T3.Mesh(new T3.ConeGeometry(hs * 0.18, hs * 0.6, 6), AK.furMat({ col: coat.col })); bd.rotation.x = Math.PI; bd.position.set(muz.position.x, muz.position.y - hs * 0.5, 0); hp.add(bd); }
    if (B.dewlap) { const dw = new T3.Mesh(new T3.SphereGeometry(W * 0.25, 12, 10), fur); dw.scale.set(1.4, 1.2, 0.25); dw.position.set(L * 0.42, leg + Hh * 0.25, 0); g.add(dw); }
    if (B.udder) { const ud = new T3.Mesh(new T3.SphereGeometry(W * 0.22, 16, 12), skin(0xe8b0a0)); ud.scale.set(1.1, 0.8, 1); ud.position.set(-L * 0.22, leg + Hh * 0.02, 0); g.add(ud); for (let i = 0; i < 4; i++) { const t = new T3.Mesh(new T3.CylinderGeometry(0.012, 0.015, 0.06, 6), skin(0xe0a090)); t.position.set(-L * 0.22 + (i < 2 ? 0.05 : -0.05), leg - 0.04, (i % 2 ? 0.05 : -0.05)); g.add(t); } g.udder = ud; }
    /* tail */
    const tp = new T3.Group(); tp.position.set(-L * 0.5, leg + Hh * 0.75, 0); g.add(tp); g.tail = tp;
    if (B.kind === "pig") { const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(V3(-t * 0.08, Math.sin(t * 9) * 0.03, Math.cos(t * 9) * 0.03)); } tp.add(new T3.Mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 20, 0.008, 5), skin(0xf0c0b0))); }
    else if (B.kind === "rabbit") { const pf = new T3.Mesh(new T3.SphereGeometry(W * 0.22, 10, 8), fur); pf.position.x = -0.02; tp.add(pf); }
    else { const tl = (B.kind === "cow" ? leg * 1.0 : leg * 0.4), tm = new T3.Mesh(new T3.CylinderGeometry(0.008, 0.016, tl, 6), fur); tm.position.y = -tl / 2; tp.add(tm); if (B.kind === "cow") { const sw = new T3.Mesh(new T3.ConeGeometry(0.03, 0.14, 6), AK.std(0x1a1614)); sw.rotation.x = Math.PI; sw.position.y = -tl - 0.04; tp.add(sw); } tp.rotation.z = B.kind === "goat" ? -2.4 : -0.15; }
    BK.shadow(g); g.userData.breed = breed; return g;
  };
  /* walk / graze animation (t seconds, speed) */
  AK.animate = (a, t, walk = 1, graze = 0) => { if (!a || !a.legs) return; a.legs.forEach((p, i) => { p.rotation.z = walk * 0.35 * Math.sin(t * 5 + (i === 0 || i === 3 ? 0 : Math.PI)); }); if (a.head) a.head.rotation.z = graze ? -0.65 + 0.08 * Math.sin(t * 2) : 0.04 * Math.sin(t * 2.5); if (a.tail) a.tail.rotation.x = 0.25 * Math.sin(t * 3); };

  /* poultry */
  AK.bird = (type = "hen") => {
    const T3 = T(), g = new T3.Group(), cols = { hen: [0x9a5a2a, 0x6a3a1a], layer: [0x9a5a2a, 0x6a3a1a], broiler: [0xf6f4ee, 0xe8e4dc], cock: [0xc85a1a, 0x1a3a2a], local: [0x6a4a2a, 0x2a2a2a], turkey: [0x2a2a2a, 0x5a4a3a], duck: [0xf2f0ea, 0xe0dcd0], chick: [0xf6d84a, 0xf2c83a], weaver: [0xf2d21a, 0x2a2a1a] }[type] || [0x9a5a2a, 0x6a3a1a];
    const feather = AK.furMat({ col: cols[0], patch: cols[1], seed: 4, sheen: 0xfff0e0 }), s = type === "chick" ? 0.35 : type === "weaver" ? 0.28 : type === "turkey" ? 1.4 : type === "broiler" ? 1.15 : 1;
    const body = new T3.Mesh(new T3.SphereGeometry(0.16, 24, 16), feather); body.scale.set(1.35, 1, 0.95); body.position.y = 0.26; g.add(body);
    const head = new T3.Mesh(new T3.SphereGeometry(0.065, 16, 12), feather); head.position.set(0.17, 0.43, 0); g.add(head);
    const neck = new T3.Mesh(new T3.CylinderGeometry(0.04, 0.07, 0.14, 10), feather); neck.position.set(0.14, 0.35, 0); neck.rotation.z = -0.4; g.add(neck);
    const beak = new T3.Mesh(new T3.ConeGeometry(0.018, 0.05, 8), AK.phys(type === "duck" ? 0xf2a020 : 0xe8b030, { roughness: 0.4 })); beak.rotation.z = -Math.PI / 2; beak.position.set(0.24, 0.425, 0); if (type === "duck") beak.scale.set(1.5, 1, 1.8); g.add(beak);
    if (type !== "chick" && type !== "duck" && type !== "weaver") { const red = AK.phys(0xc8141e, { roughness: 0.45 }); for (let i = 0; i < 4; i++) { const cb = new T3.Mesh(new T3.SphereGeometry(type === "cock" ? 0.022 : 0.014, 8, 6), red); cb.position.set(0.15 + i * 0.018, 0.49 + (i % 2) * 0.008, 0); g.add(cb); } const wt = new T3.Mesh(new T3.SphereGeometry(0.016, 8, 6), red); wt.scale.y = 1.6; wt.position.set(0.21, 0.385, 0); g.add(wt); }
    [-1, 1].forEach((sd) => { const e = new T3.Mesh(new T3.SphereGeometry(0.01, 8, 6), AK.phys(0x111111, { clearcoat: 1, roughness: 0.05 })); e.position.set(0.205, 0.445, sd * 0.045); g.add(e); const lg = new T3.Mesh(new T3.CylinderGeometry(0.008, 0.008, 0.16, 6), AK.std(0xe0b030)); lg.position.set(0.0, 0.08, sd * 0.05); g.add(lg); const ft = new T3.Mesh(new T3.BoxGeometry(0.07, 0.006, 0.03), AK.std(0xe0b030)); ft.position.set(0.02, 0.003, sd * 0.05); g.add(ft); const wg = new T3.Mesh(new T3.SphereGeometry(0.1, 12, 8), feather); wg.scale.set(1.2, 0.6, 0.25); wg.position.set(-0.02, 0.28, sd * 0.13); g.add(wg); });
    if (type !== "chick") { const tm = new T3.MeshPhysicalMaterial({ map: coatTex({ col: cols[1] }), roughness: 0.6, side: T3.DoubleSide, sheen: 0.8, sheenColor: new T3.Color(0x88ffcc) }); for (let i = 0; i < (type === "cock" ? 7 : 4); i++) { const f = new T3.Mesh(BK.leafGeo(type === "cock" ? 0.3 : 0.16, 0.05, 0.4, 5), tm); f.position.set(-0.17, 0.3, (i - 2) * 0.02); f.rotation.z = 1.6 + i * 0.12; f.rotation.y = Math.PI / 2; g.add(f); } }
    g.scale.setScalar(s); BK.shadow(g); return g;
  };
  /* fish: tilapia (BK.fish) or catfish */
  AK.fish = (type = "tilapia", s = 1) => {
    if (type === "tilapia") return BK.fish(s, 0x7d8a6a);
    const T3 = T(), g = new T3.Group(), m = AK.phys(0x3a3a34, { roughness: 0.25, clearcoat: 1, map: coatTex({ col: 0x4a4a40, patch: 0x2a2a24, seed: 11 }) });
    const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(new T3.Vector2(Math.max(0.01, (t < 0.25 ? Math.sqrt(t / 0.25) : 1 - (t - 0.25) * 0.9) * 0.16), (t - 0.5) * 1.9)); }
    const body = new T3.Mesh(new T3.LatheGeometry(pts, 24), m); body.rotation.z = Math.PI / 2; body.scale.set(1, 1, 0.75); g.add(body);
    const head = new T3.Mesh(new T3.SphereGeometry(0.17, 16, 12), m); head.scale.set(1.1, 0.6, 1.1); head.position.x = 0.78; g.add(head);
    [-1, 1].forEach((sd) => { for (let k = 0; k < 2; k++) { const b = new T3.Mesh(new T3.CylinderGeometry(0.004, 0.006, 0.3, 4), AK.std(0x2a2a24)); b.position.set(0.95, -0.03 - k * 0.04, sd * 0.06); b.rotation.set(sd * 0.8, 0, 1.1 + k * 0.3); g.add(b); } const e = new T3.Mesh(new T3.SphereGeometry(0.018, 8, 6), AK.phys(0x0a0a0a, { clearcoat: 1 })); e.position.set(0.86, 0.05, sd * 0.12); g.add(e); });
    const fin = new T3.Mesh(new T3.BoxGeometry(1.1, 0.12, 0.01), AK.phys(0x3a3a34, { transparent: true, opacity: 0.7 })); fin.position.set(-0.2, 0.15, 0); g.add(fin);
    g.scale.setScalar(s); BK.shadow(g); return g;
  };
  /* honey bee (striped abdomen, translucent wings) */
  AK.bee = (s = 1, role = "worker") => { const T3 = T(); const b = BK.insect(s * (role === "queen" ? 1.3 : role === "drone" ? 1.15 : 1), 0x3a2a12, { wings: true, wingR: 0.24, wingOp: 0.3 }); const stripes = once("beestripe", () => { const c = BK.cv(128, 64), g = c.getContext("2d"); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#1a1208" : "#e0a020"; g.fillRect(i * 16, 0, 16, 64); } const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; }); b.children[0].material = new T3.MeshPhysicalMaterial({ map: stripes, roughness: 0.45, sheen: 1, sheenColor: new T3.Color(0xffe0a0) }); if (role === "queen") b.children[0].scale.x *= 1.4; return b; };

  /* insect and other pests. type: grasshopper | weevil | beetle | caterpillar | armyworm | stemborer | aphid | mealybug | bug | stainer | mirid | thrips | moth | mite | tick | louse | snail | rat | worm | fluke | tapeworm | tsetse | termite */
  AK.pest = (type = "grasshopper", s = 1) => {
    const T3 = T(); let g;
    const seg = (n, r, col, len, curve = 0) => { const grp = new T3.Group(), m = AK.phys(col, { roughness: 0.5, clearcoat: 0.3 }); for (let i = 0; i < n; i++) { const sg = new T3.Mesh(new T3.SphereGeometry(r * (1 - Math.abs(i - n / 2) / n * 0.5), 12, 8), m); sg.position.set((i - n / 2) * len / n, Math.sin(i / n * 3.14) * curve, 0); grp.add(sg); } return grp; };
    switch (type) {
      case "grasshopper": { g = BK.insect(s, 0x6a8a2a, { wings: true, wingCol: 0x8aa04a, wingOp: 0.7, wingR: 0.32 }); g.children[0].scale.x *= 1.5; g.children[0].material = new T3.MeshPhysicalMaterial({ map: coatTex({ col: 0x8a9a2a, patch: 0xd8b020, seed: 2 }), roughness: 0.5, clearcoat: 0.4 }); [-1, 1].forEach((sd) => { const hl = new T3.Mesh(new T3.CylinderGeometry(0.02 * s, 0.012 * s, 0.6 * s, 6), AK.std(0x6a8a2a)); hl.position.set(-0.15 * s, 0.05 * s, sd * 0.14 * s); hl.rotation.set(sd * 0.3, 0, 0.9); g.add(hl); }); break; }
      case "weevil": { g = BK.insect(s * 0.6, 0x3a2418, { antennae: true }); const sn = new T3.Mesh(new T3.CylinderGeometry(0.012, 0.02, 0.22, 6), AK.std(0x3a2418)); sn.rotation.z = -1.2; sn.position.set(0.24, -0.04, 0); g.add(sn); break; }
      case "beetle": case "yambeetle": case "beanbeetle": { g = BK.insect(s * 0.7, type === "yambeetle" ? 0x2a1a0a : type === "beanbeetle" ? 0x7a5a3a : 0x6a7a2a); g.children[0].scale.set(1.2, 1.1, 1.3); break; }
      case "caterpillar": case "armyworm": case "stemborer": case "bollworm": { g = seg(11, 0.06 * s, type === "armyworm" ? 0x4a4a2a : type === "stemborer" ? 0xe8d8b8 : type === "bollworm" ? 0x8aa04a : 0x6a9a3a, 0.9 * s, 0.03 * s); const hd = new T3.Mesh(new T3.SphereGeometry(0.06 * s, 12, 8), AK.std(0x3a2a1a)); hd.position.x = 0.48 * s; g.add(hd); break; }
      case "aphid": { g = BK.insect(s * 0.4, 0x7ab040); g.children[0].scale.set(1.1, 1.3, 1.2); break; }
      case "mealybug": { g = new T3.Group(); const b = new T3.Mesh(new T3.SphereGeometry(0.12 * s, 14, 10), AK.phys(0xf4f0e8, { roughness: 1, sheen: 1 })); b.scale.set(1.5, 0.7, 1); g.add(b); for (let i = 0; i < 14; i++) { const f = new T3.Mesh(new T3.CylinderGeometry(0.004, 0.008, 0.08 * s, 4), AK.std(0xf4f0e8)); const a = i / 14 * 6.283; f.position.set(Math.cos(a) * 0.18 * s, 0, Math.sin(a) * 0.12 * s); f.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2); g.add(f); } break; }
      case "bug": case "stainer": case "mirid": { g = BK.insect(s * 0.7, type === "stainer" ? 0xc8321e : type === "mirid" ? 0x5a3a24 : 0x5a6a2a, { wings: true, wingCol: 0x3a2a1a, wingOp: 0.85 }); if (type === "stainer") g.children[0].material = new T3.MeshPhysicalMaterial({ map: coatTex({ col: 0xc8321e, patch: 0x1a1a1a, seed: 8 }), roughness: 0.4, clearcoat: 0.6 }); break; }
      case "thrips": { g = BK.insect(s * 0.35, 0x3a3020, { wings: true, wingOp: 0.4 }); g.children[0].scale.set(2, 0.6, 0.6); break; }
      case "moth": { g = BK.insect(s * 0.7, 0x8a7a5a, { wings: true, wingCol: 0xa89a7a, wingOp: 0.95, wingR: 0.35 }); break; }
      case "tsetse": { g = BK.insect(s * 0.7, 0x5a4a32, { wings: true, wingOp: 0.35, wingR: 0.3 }); break; }
      case "termite": { g = BK.insect(s * 0.5, 0xe8d8b8); break; }
      case "mite": case "tick": { g = new T3.Group(); const b = new T3.Mesh(new T3.SphereGeometry(0.16 * s, 18, 12), AK.phys(type === "tick" ? 0x5a3a24 : 0x6aa040, { roughness: 0.35, clearcoat: 0.8 })); b.scale.set(1.25, 0.5, 1); g.add(b); if (type === "tick") { const sh = new T3.Mesh(new T3.SphereGeometry(0.1 * s, 12, 8), AK.phys(0xc8a060, { roughness: 0.4 })); sh.scale.set(1, 0.3, 0.9); sh.position.set(0.08 * s, 0.07 * s, 0); g.add(sh); } for (let i = 0; i < 4; i++) [-1, 1].forEach((sd) => { const l = new T3.Mesh(new T3.CylinderGeometry(0.008 * s, 0.006 * s, 0.22 * s, 5), AK.std(0x3a2a1a)); l.position.set((0.1 - i * 0.07) * s, -0.02, sd * 0.17 * s); l.rotation.x = sd * 1.1; g.add(l); }); break; }
      case "louse": { g = BK.insect(s * 0.4, 0xc8b8a0, { antennae: false }); break; }
      case "snail": { g = new T3.Group(); const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40 * 4 * 6.283, r = 0.02 * Math.exp(t * 0.18) * s; pts.push(V3(Math.cos(t) * r, t * 0.012 * s, Math.sin(t) * r)); } const sh = new T3.Mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 80, 0.06 * s, 10), new T3.MeshPhysicalMaterial({ map: coatTex({ col: 0x8a5a2a, patch: 0x3a2412, seed: 6 }), roughness: 0.3, clearcoat: 0.8 })); sh.rotation.x = Math.PI / 2; sh.position.y = 0.2 * s; g.add(sh); const ft = new T3.Mesh(new T3.CapsuleGeometry(0.07 * s, 0.4 * s, 4, 10), AK.phys(0x9a8a7a, { roughness: 0.2, clearcoat: 1 })); ft.rotation.z = Math.PI / 2; ft.position.set(0.1 * s, 0.06 * s, 0); g.add(ft); [-1, 1].forEach((sd) => { const tn = new T3.Mesh(new T3.CylinderGeometry(0.006 * s, 0.01 * s, 0.14 * s, 5), ft.material); tn.position.set(0.36 * s, 0.14 * s, sd * 0.03 * s); tn.rotation.z = -0.5; g.add(tn); }); break; }
      case "rat": { g = new T3.Group(); const m = AK.furMat({ col: 0x5a524a }); const b = new T3.Mesh(new T3.SphereGeometry(0.18 * s, 18, 12), m); b.scale.set(1.6, 0.9, 0.9); b.position.y = 0.16 * s; g.add(b); const h = new T3.Mesh(new T3.ConeGeometry(0.1 * s, 0.24 * s, 14), m); h.rotation.z = -Math.PI / 2; h.position.set(0.36 * s, 0.17 * s, 0); g.add(h); [-1, 1].forEach((sd) => { const e = new T3.Mesh(new T3.CircleGeometry(0.05 * s, 12), AK.phys(0xd8a0a0, { side: T3.DoubleSide })); e.position.set(0.3 * s, 0.27 * s, sd * 0.07 * s); e.rotation.y = sd * 0.6; g.add(e); }); const pts = []; for (let i = 0; i <= 10; i++) pts.push(V3(-0.28 * s - i * 0.05 * s, 0.1 * s - Math.sin(i / 3) * 0.06 * s, Math.sin(i / 2) * 0.04 * s)); g.add(new T3.Mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 16, 0.012 * s, 5), AK.phys(0xd8a8a0))); break; }
      case "worm": case "nematode": case "roundworm": { const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push(V3((t - 0.5) * 0.9 * s, 0.03 * s, Math.sin(t * 9) * 0.06 * s)); } g = new T3.Group(); g.add(new T3.Mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 60, 0.02 * s, 8), AK.phys(type === "worm" ? 0xb06a6a : 0xf0e8d8, { roughness: 0.3, clearcoat: 0.6 }))); break; }
      case "fluke": { g = new T3.Group(); const m = new T3.Mesh(new T3.SphereGeometry(0.2 * s, 18, 10), AK.phys(0xb07850, { roughness: 0.35, clearcoat: 0.6 })); m.scale.set(1.5, 0.12, 0.7); g.add(m); break; }
      case "tapeworm": { g = new T3.Group(); const m = AK.phys(0xf0e8d0, { roughness: 0.4 }); for (let i = 0; i < 40; i++) { const sg = new T3.Mesh(new T3.BoxGeometry(0.04 * s, 0.008 * s, (0.02 + i * 0.0015) * s), m); sg.position.set(-i * 0.042 * s, 0, Math.sin(i * 0.25) * 0.08 * s); g.add(sg); } break; }
      default: g = BK.insect(s, 0x5a3a1a);
    }
    BK.shadow(g); g.userData.pest = type; return g;
  };
  /* microbes for disease scenes: virus | bacterium | fungus | protozoan | trypanosome */
  AK.microbe = (type = "virus", s = 1) => {
    const T3 = T(), g = new T3.Group();
    if (type === "virus") { const c = new T3.Mesh(new T3.IcosahedronGeometry(0.2 * s, 1), AK.phys(0xd84a5a, { roughness: 0.4, flatShading: true })); g.add(c); for (let i = 0; i < 20; i++) { const sp = new T3.Mesh(new T3.CylinderGeometry(0.01 * s, 0.01 * s, 0.1 * s, 5), AK.std(0xf0c040)); const d = V3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(); sp.position.copy(d.clone().multiplyScalar(0.24 * s)); sp.quaternion.setFromUnitVectors(V3(0, 1, 0), d); g.add(sp); } }
    else if (type === "bacterium") { const c = new T3.Mesh(new T3.CapsuleGeometry(0.08 * s, 0.3 * s, 6, 12), AK.phys(0x6ab05a, { roughness: 0.3, transparent: true, opacity: 0.9 })); c.rotation.z = Math.PI / 2; g.add(c); }
    else if (type === "fungus") { const m = AK.phys(0xe8e0c8, { roughness: 0.6 }); for (let i = 0; i < 9; i++) { const pts = []; let p = V3(0, 0, 0); for (let k = 0; k < 6; k++) { p = p.clone().add(V3((Math.random() - 0.5) * 0.1 * s, 0.05 * s, (Math.random() - 0.5) * 0.1 * s)); pts.push(p); } g.add(new T3.Mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 12, 0.008 * s, 5), m)); const sp = new T3.Mesh(new T3.SphereGeometry(0.025 * s, 10, 8), AK.std(0x2a3a2a)); sp.position.copy(pts[5]); g.add(sp); } }
    else { const c = new T3.Mesh(new T3.SphereGeometry(0.14 * s, 16, 12), AK.phys(0x8ab0e0, { roughness: 0.3, transparent: true, opacity: 0.85 })); c.scale.set(type === "trypanosome" ? 2.6 : 1.2, 0.5, 0.6); g.add(c); const fl = new T3.Mesh(new T3.CylinderGeometry(0.006 * s, 0.003 * s, 0.4 * s, 4), AK.std(0x6a8ab0)); fl.rotation.z = Math.PI / 2; fl.position.x = 0.45 * s; g.add(fl); }
    return g;
  };

  /* people: farmer, extension worker, trader, vet (opaque, simple, clothed) */
  AK.person = (o = {}) => {
    const T3 = T(), g = new T3.Group(), skinM = skin(o.skin || 0x6a4430, 0.6), shirt = AK.furMat({ col: o.shirt || 0x2a6ad8 }), trou = AK.std(o.trousers || 0x3a3a4a, { roughness: 0.85 });
    const torso = new T3.Mesh(new T3.CapsuleGeometry(0.17, 0.42, 6, 12), shirt); torso.position.y = 1.12; torso.scale.z = 0.62; g.add(torso);
    const head = new T3.Mesh(new T3.SphereGeometry(0.11, 18, 14), skinM); head.scale.set(0.9, 1.1, 0.95); head.position.y = 1.58; g.add(head);
    if (o.hat !== false) { const hat = new T3.Mesh(new T3.CylinderGeometry(0.2, 0.22, 0.03, 18), AK.std(o.hatCol || 0xd8c08a)); hat.position.y = 1.68; g.add(hat); const cr = new T3.Mesh(new T3.CylinderGeometry(0.1, 0.11, 0.1, 14), hat.material); cr.position.y = 1.73; g.add(cr); }
    g.arms = []; [-1, 1].forEach((sd) => { const pv = new T3.Group(); pv.position.set(0, 1.4, sd * 0.2); const a = new T3.Mesh(new T3.CapsuleGeometry(0.045, 0.5, 4, 8), shirt); a.position.y = -0.28; pv.add(a); const hd = new T3.Mesh(new T3.SphereGeometry(0.045, 10, 8), skinM); hd.position.y = -0.58; pv.add(hd); g.add(pv); g.arms.push(pv); const l = new T3.Mesh(new T3.CapsuleGeometry(0.06, 0.72, 4, 8), trou); l.position.set(0, 0.45, sd * 0.08); g.add(l); const sh = new T3.Mesh(new T3.BoxGeometry(0.16, 0.05, 0.08), AK.std(0x1a1a1a)); sh.position.set(0.03, 0.03, sd * 0.08); g.add(sh); });
    BK.shadow(g); return g;
  };
})();
