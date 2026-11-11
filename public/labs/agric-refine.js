/* agric-refine.js — finer shared props for the Agricultural Science lab (loads after agric-atlas.js).
   Replaces AK.person with a smooth clothed figure and refines the tractor and the farm buildings in place,
   so every scene that uses them improves without being rewritten. Shapes are generated in code. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, BA = window.BA, AK = window.AK;
  if (!MK || !BK || !BA || !AK) return;
  const sd = BA.sd, lin = BA.lin, mix3 = BA.mix3, S = sd.smin;
  const T = () => window.THREE;
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ================= people (face +x, 1.72 tall, arms on pivots as before) ================= */
  function bodySDF(x, y, z) {
    const az = Math.abs(z);
    let d = sd.ell(x, y, z, 0.012, 1.6, 0, 0.098, 0.118, 0.09);                                    // head
    d = S(d, sd.ell(x, y, z, 0.035, 1.535, 0, 0.07, 0.07, 0.068), 0.04);                           // jaw
    d = S(d, sd.ell(x, y, z, 0.108, 1.585, 0, 0.018, 0.026, 0.017), 0.015);                        // nose
    d = S(d, sd.ell(x, y, az, 0.0, 1.6, 0.092, 0.018, 0.03, 0.012), 0.012);                        // ears
    d = S(d, sd.cone(x, y, z, 0, 1.52, 0, -0.005, 1.4, 0, 0.05, 0.058), 0.03);                     // neck
    let t = sd.ell(x, y, z, 0.0, 1.24, 0, 0.115, 0.2, 0.168);                                      // chest
    t = S(t, sd.cone(x, y, az, 0, 1.41, 0.06, 0, 1.385, 0.19, 0.06, 0.066), 0.06);                 // shoulders
    t = S(t, sd.ell(x, y, z, 0.01, 1.02, 0, 0.11, 0.16, 0.152), 0.08);                             // waist (loose shirt)
    t = S(t, sd.ell(x, y, z, -0.005, 0.9, 0, 0.115, 0.1, 0.158), 0.06);                            // hips
    d = S(d, t, 0.035);
    let l = sd.cone(x, y, az, 0, 0.9, 0.085, 0.0, 0.5, 0.088, 0.085, 0.062);                       // thigh (trousers)
    l = S(l, sd.cone(x, y, az, 0.0, 0.5, 0.088, -0.005, 0.12, 0.088, 0.062, 0.052), 0.03);
    l = S(l, sd.ell(x, y, az, 0.035, 0.05, 0.088, 0.115, 0.052, 0.052), 0.03);                     // boot
    return S(d, l, 0.04);
  }
  function armSDF(x, y, z) {
    let d = sd.cone(x, y, z, 0, 0, 0, 0, -0.28, 0, 0.052, 0.043);
    d = S(d, sd.cone(x, y, z, 0, -0.28, 0, 0.02, -0.54, 0, 0.041, 0.033), 0.02);
    return S(d, sd.ell(x, y, z, 0.028, -0.6, 0, 0.03, 0.048, 0.021), 0.02);
  }
  AK.person = (o = {}) => {
    const T3 = T(), g = new T3.Group(), skin = lin(o.skin || 0x6a4430), shirt = lin(o.shirt || 0x2a6ad8), trou = lin(o.trousers || 0x3a3a4a), boot = lin(o.boots || 0x1c1a18), hair = lin(0x0e0c0a);
    const key = [o.skin || 0, o.shirt || 0, o.trousers || 0, o.boots || 0, o.sleeve || 0].join("_");
    const geo = BA.cached("ap_body_" + key, () => BA.mesh(bodySDF, [-0.2, -0.01, -0.3, 0.22, 1.76, 0.3], 0.0135, { color: (x, y, z, nx, ny) => {
      let c;
      if (y > 1.455) { c = skin; c = mix3(c, hair, Math.max(sstep(1.655, 1.675, y), sstep(-0.025, -0.055, x) * sstep(1.545, 1.575, y))); c = mix3(c, mix3(skin, [0, 0, 0], 0.35), (1 - sstep(0.012, 0.02, Math.hypot(y - 1.612, Math.abs(z) - 0.038))) * (x > 0.07 ? 1 : 0)); }   // hair and eyes
      else if (y > 0.87) { const fold = BK.fbm(x * 18, y * 6, z * 18); c = mix3(shirt, mix3(shirt, [0, 0, 0], 0.3), sstep(0.5, 0.7, fold) * 0.5); c = mix3(c, mix3(shirt, [1, 1, 1], 0.5), (1 - sstep(0.004, 0.01, Math.abs(z))) * (x > 0.06 ? 0.5 : 0)); if (y < 0.89) c = mix3(c, [0, 0, 0], 0.4); }   // shirt, placket, hem
      else if (y > 0.115) { const fold = BK.fbm(x * 14, y * 5, z * 14); c = mix3(trou, mix3(trou, [0, 0, 0], 0.35), sstep(0.5, 0.72, fold) * 0.5); }
      else c = boot;
      return c; } }));
    const mat = new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 }), body = new T3.Mesh(geo, mat); g.add(body);
    const ageo = BA.cached("ap_arm_" + key, () => BA.mesh(armSDF, [-0.07, -0.67, -0.07, 0.08, 0.07, 0.07], 0.0105, { color: (x, y) => (y > (o.sleeve ? -0.5 : -0.2) ? shirt : skin) }));
    g.arms = []; for (const sv of [-1, 1]) { const pv = new T3.Group(); pv.position.set(0, 1.4, sv * 0.205); pv.rotation.x = sv * -0.07; pv.add(new T3.Mesh(ageo, mat)); g.add(pv); g.arms.push(pv); }
    if (o.hat !== false) {
      const pts = [[0.001, 0.115], [0.07, 0.112], [0.105, 0.085], [0.115, 0.03], [0.12, 0.012], [0.2, 0.0], [0.27, -0.012], [0.275, -0.02], [0.118, -0.003], [0.108, 0.0]].map((q) => new T3.Vector2(q[0], q[1]));
      const hat = new T3.Mesh(new T3.LatheGeometry(pts, 28), new T3.MeshStandardMaterial({ color: o.hatCol || 0xd8c08a, roughness: 0.9, side: T3.DoubleSide })); hat.position.set(0.0, 1.665, 0); hat.rotation.z = -0.06; g.add(hat);
      const band = new T3.Mesh(new T3.CylinderGeometry(0.119, 0.122, 0.022, 24, 1, true), new T3.MeshStandardMaterial({ color: 0x5a3a24, roughness: 0.8 })); band.position.set(0, 1.69, 0); band.rotation.z = -0.06; g.add(band);
    }
    BK.shadow(g, true, false); return g;
  };

  /* ================= tractor: rounded bonnet, mudguards, cab glass, lights, seat ================= */
  const rrect = (w, h, r) => { const T3 = T(), s = new T3.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
  const rbox = (w, h, d, r) => { const T3 = T(), g = new T3.ExtrudeGeometry(rrect(w, h, r), { depth: d - 2 * r * 0.5, bevelEnabled: true, bevelSize: r * 0.5, bevelThickness: r * 0.5, bevelSegments: 3, curveSegments: 6 }); g.translate(0, 0, -(d - r) / 2); return g; };
  const tractor0 = AK.tractor;
  AK.tractor = (col = 0xc8321e) => {
    const T3 = T(), g = tractor0(col), body = AK.paint(col), dark = AK.std(0x1c1e22, { roughness: 0.55 }), named = (n) => (g.parts || []).find((p) => p.name === n);
    try {
      const bon = named("Engine bonnet"); if (bon && bon.isMesh) { bon.geometry = rbox(1.3, 0.55, 0.62, 0.11); const st = new T3.Mesh(new T3.BoxGeometry(1.0, 0.07, 0.635), AK.std(0xf2f2ee, { roughness: 0.5 })); st.position.set(-0.05, -0.08, 0); bon.add(st); for (const sv of [-1, 1]) { const hl = new T3.Mesh(new T3.SphereGeometry(0.055, 14, 10), new T3.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff0b0, emissiveIntensity: 0.6, roughness: 0.2 })); hl.scale.x = 0.4; hl.position.set(0.66, 0.12, sv * 0.2); bon.add(hl); } }
      const gr = named("Radiator grille"); if (gr) for (let i = 0; i < 6; i++) { const sl = new T3.Mesh(new T3.BoxGeometry(0.02, 0.025, 0.5), AK.std(0x9aa0a6, { metalness: 0.7, roughness: 0.35 })); sl.position.set(0.095, -0.2 + i * 0.075, 0); gr.add(sl); }
      const seat = named("Seat and fuel tank"); if (seat && seat.isMesh) { seat.geometry = rbox(0.5, 0.7, 0.9, 0.08); const cu = new T3.Mesh(rbox(0.34, 0.09, 0.38, 0.04), dark); cu.position.set(-0.02, 0.4, 0); seat.add(cu); const bk = new T3.Mesh(rbox(0.08, 0.36, 0.36, 0.035), dark); bk.position.set(-0.2, 0.6, 0); bk.rotation.z = 0.12; seat.add(bk);
        for (const sv of [-1, 1]) { const mg = new T3.Mesh(new T3.CylinderGeometry(0.83, 0.83, 0.34, 28, 1, true, Math.PI - 0.95, 1.9), new T3.MeshPhysicalMaterial({ color: col, roughness: 0.42, clearcoat: 0.6, side: T3.DoubleSide })); mg.rotation.x = Math.PI / 2; mg.position.set(-0.1, -0.3, sv * 0.62); mg.castShadow = true; seat.add(mg); } }
      const cab = named("Safety frame (ROPS)"); if (cab) { const gl = new T3.MeshPhysicalMaterial({ color: 0xbfe0f4, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false, side: T3.DoubleSide }); const ws = new T3.Mesh(new T3.PlaneGeometry(0.84, 1.0), gl); ws.rotation.y = Math.PI / 2; ws.position.set(-0.05, 1.95, 0); cab.add(ws); const rw = ws.clone(); rw.position.x = -0.6; cab.add(rw); for (const sv of [-1, 1]) { const sp = new T3.Mesh(new T3.PlaneGeometry(0.55, 1.0), gl); sp.position.set(-0.325, 1.95, sv * 0.42); cab.add(sp); } const rf = new T3.Mesh(rbox(0.86, 0.09, 1.06, 0.04), body); rf.position.set(-0.33, 2.52, 0); cab.add(rf); const bc = new T3.Mesh(new T3.CylinderGeometry(0.035, 0.035, 0.05, 10), new T3.MeshStandardMaterial({ color: 0xff9a1a, emissive: 0xff7a00, emissiveIntensity: 0.7 })); bc.position.set(-0.33, 2.6, 0); cab.add(bc); }
      const wt = new T3.Mesh(rbox(0.16, 0.26, 0.5, 0.03), AK.std(0x2a2c30, { roughness: 0.6, metalness: 0.4 })); wt.position.set(1.42, 0.62, 0); wt.castShadow = true; g.add(wt);
      const ax = new T3.Mesh(new T3.CylinderGeometry(0.04, 0.04, 0.9, 10), AK.std(0x2a2c30, { roughness: 0.5, metalness: 0.5 })); ax.rotation.x = Math.PI / 2; ax.position.set(1.0, 0.42, 0); g.add(ax);
    } catch (e) { /* keep the plain tractor if a part is missing */ }
    return g;
  };

  /* ================= buildings: closed gables, ridge cap, plinth, framed door and windows ================= */
  const building0 = AK.building;
  AK.building = (type = "barn", o = {}) => {
    const T3 = T(), g = building0(type, o);
    if (["silo", "hut", "cribs"].includes(type)) return g;
    try {
      /* chicken wire you can see through, in place of the netting photo */
      g.traverse((m) => { if (m.isMesh && m.material && m.material.alphaTest) { if (!AK._wire) { const c = BK.cv(64, 64), x = c.getContext("2d"); x.clearRect(0, 0, 64, 64); x.strokeStyle = "rgba(210,214,218,1)"; x.lineWidth = 3; for (const [a, b, e, f] of [[0, 0, 64, 64], [64, 0, 0, 64], [-32, 32, 32, 96], [32, -32, 96, 32], [32, 96, 96, 32], [-32, 32, 32, -32]]) { x.beginPath(); x.moveTo(a, b); x.lineTo(e, f); x.stroke(); } AK._wire = c; } const t = new T3.CanvasTexture(AK._wire); t.wrapS = t.wrapT = T3.RepeatWrapping; t.repeat.set((o.w || 2.2) * 9, 5); t.colorSpace = T3.SRGBColorSpace; m.material = new T3.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.4, side: T3.DoubleSide, roughness: 0.5, metalness: 0.6 }); m.castShadow = false; } });
      const w = o.w || 2.2, d = o.d || 1.6, h = o.h || 1.0, open = ["pen", "shed", "poultry", "hutch"].includes(type), yR = h + d * 0.12;
      const wallM = AK.pbr(o.wall || "clay_block_wall", { repeat: [d, 1], color: o.wallCol || 0xffffff }), trim = AK.std(0x4a3a2a, { roughness: 0.8 }), white = AK.std(0xf2efe6, { roughness: 0.7 });
      /* gable ends: the roof slabs rise d·0.62·sin(0.42) each side of the ridge */
      const rise = d * 0.232, sh = new T3.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(0, rise); sh.lineTo(d / 2, 0); sh.closePath();
      for (const x of [-w / 2, w / 2 - 0.03]) { const gb = new T3.Mesh(new T3.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }), open ? AK.wood() : wallM); gb.rotation.y = Math.PI / 2; gb.position.set(x, h, 0); gb.castShadow = true; g.add(gb); }
      const cap = new T3.Mesh(new T3.CylinderGeometry(0.035, 0.035, w * 1.14, 8), AK.std(0x8a9096, { roughness: 0.5, metalness: 0.5 })); cap.rotation.z = Math.PI / 2; cap.position.set(0, yR + d * 0.125, 0); g.add(cap);
      for (const sv of [-1, 1]) { const fa = new T3.Mesh(new T3.BoxGeometry(w * 1.12, 0.045, 0.02), white); fa.position.set(0, h - 0.005, sv * (d * 0.55)); g.add(fa); }
      if (!open) {
        const pl = new T3.Mesh(new T3.BoxGeometry(w + 0.06, 0.07, d + 0.06), AK.std(0x6a6660, { roughness: 0.95 })); pl.position.y = 0.035; pl.receiveShadow = true; g.add(pl);
        const hasDoor = ["store", "barn", "house"].includes(type), dz = d / 2 + 0.012, glass = AK.std(0x7fb4dc, { roughness: 0.15, metalness: 0.4 });
        if (hasDoor) { for (const [x, y, ww, hh] of [[-0.22, 0.36, 0.035, 0.74], [0.22, 0.36, 0.035, 0.74], [0, 0.73, 0.475, 0.035]]) { const fr = new T3.Mesh(new T3.BoxGeometry(ww, hh, 0.035), trim); fr.position.set(x, y, dz); g.add(fr); } const kn = new T3.Mesh(new T3.SphereGeometry(0.018, 8, 6), AK.std(0xd8b040, { metalness: 0.8, roughness: 0.3 })); kn.position.set(0.14, 0.36, dz + 0.02); g.add(kn); }
        const nW = Math.max(1, Math.floor((w / 2 - 0.35) / 0.42));
        for (const sv of [-1, 1]) for (let i = 0; i < nW; i++) { const x = sv * (0.48 + i * 0.42); if (Math.abs(x) > w / 2 - 0.16) continue; const wy = Math.min(h * 0.62, h - 0.2), ws = Math.min(0.22, h * 0.28); const gl = new T3.Mesh(new T3.BoxGeometry(ws, ws, 0.02), glass); gl.position.set(x, wy, dz); g.add(gl); const fr = new T3.Mesh(new T3.BoxGeometry(ws + 0.05, 0.03, 0.03), white); fr.position.set(x, wy - ws / 2 - 0.012, dz + 0.004); g.add(fr); const fr2 = new T3.Mesh(new T3.BoxGeometry(0.014, ws, 0.025), white); fr2.position.set(x, wy, dz + 0.004); g.add(fr2); }
      }
    } catch (e) { /* keep the plain building */ }
    return g;
  };

  /* ================= outdoor look: warmer sun, natural grass with tufts and wild flowers ================= */
  const env0 = AK.env;
  AK.env = (hdri = "farm_field", o = {}) => { const e = Object.assign(env0(hdri, {}), { exposure: 0.84, sunColor: 0xffecd2, sun: 2.6, hemi: 0.4 }, o); if (o.blur && e.bgI != null && e.bgI < 0.85) { e.bgI = 0.85; e.exposure = Math.max(e.exposure, 0.92); e.hemi = Math.max(e.hemi, 0.55); } return e; };
  let tuftGeo = null;
  const tufts = () => { if (tuftGeo) return tuftGeo; const T3 = T(), pos = [], col = [], g0 = lin(0x4f7a2e), g1 = lin(0x9bb85a); for (let i = 0; i < 5; i++) { const a = i * 1.257, w = 0.012, h = 0.07 + (i % 3) * 0.025, lx = Math.cos(a) * 0.02, lz = Math.sin(a) * 0.02, tx = Math.cos(a) * 0.045, tz = Math.sin(a) * 0.045, px = -Math.sin(a) * w, pz = Math.cos(a) * w; pos.push(lx - px, 0, lz - pz, lx + px, 0, lz + pz, lx + tx, h, lz + tz); col.push(...g0, ...g0, ...g1); } const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new T3.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); tuftGeo = g; return g; };
  const ground0 = AK.ground;
  AK.ground = (g, o = {}) => {
    const natural = !o.tint && (!o.tex || /grass/.test(o.tex)), o2 = Object.assign({}, o); if (natural && o.grassCol == null) o2.grassCol = 0x567a36; if (!o.tex && !o.tint && !o.fieldFn && !o.h) o2.tex = "Grass001";
    const h = ground0(g, o2);
    if (natural && o.tufts !== false) try {
      const T3 = T(), w = o.w || 12, d = o.d || 9, n = Math.min(900, Math.round(w * d * 5)), r = BK.rng((o.seed || 3) * 7 + 11), im = new T3.InstancedMesh(tufts(), new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: T3.DoubleSide }), n), m4 = new T3.Matrix4(), q = new T3.Quaternion(), up = new T3.Vector3(0, 1, 0), c = new T3.Color(); let k = 0;
      const fl = new T3.InstancedMesh(new T3.OctahedronGeometry(0.014, 0), new T3.MeshStandardMaterial({ roughness: 0.6 }), Math.round(n / 9)); let kf = 0;
      for (let i = 0; i < n * 3 && k < n; i++) { const x = (r() - 0.5) * (w - 0.3), z = (r() - 0.5) * (d - 0.3); if (o.fieldFn && o.fieldFn(x, z) > 0.12) continue; if (BK.fbm(x * 0.9 + 3, z * 0.9, 2.2) < 0.42) continue; const y = h(x, z), sc = 0.7 + r() * 0.9; q.setFromAxisAngle(up, r() * 6.28); m4.compose(new T3.Vector3(x, y, z), q, new T3.Vector3(sc, sc, sc)); im.setMatrixAt(k, m4); im.setColorAt(k, c.setHSL(0.24 + r() * 0.06, 0.45, 0.42 + r() * 0.2)); k++;
        if (kf < fl.count && r() < 0.12) { m4.compose(new T3.Vector3(x + 0.03, y + 0.06 * sc, z + 0.02), q, new T3.Vector3(1, 1, 1)); fl.setMatrixAt(kf, m4); fl.setColorAt(kf, c.set([0xffffff, 0xf7d64a, 0xe7a6d8][kf % 3])); kf++; } }
      im.count = k; fl.count = kf; im.receiveShadow = false; g.add(im); if (kf) g.add(fl);
    } catch (e) { /* plain ground */ }
    return h;
  };
})();
