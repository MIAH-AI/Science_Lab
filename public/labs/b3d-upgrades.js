/* b3d-upgrades.js — second round of Biology lab upgrades (loads after b3d-body.js).
   Part 1: better shared builders (people, frog, snake, bird, insect, tree, plant) that every scene picks up,
   and realistic joints, vertebral column, teeth, ear and toad metamorphosis. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, BA = window.BA, W = MK.when, f = MK.fmt;
  if (!BA || !BA.addMode) return;
  const sd = BA.sd, lin = BA.lin, mix3 = BA.mix3, TIS = BA.tis;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sst = (a, b, x) => { const q = clamp((x - a) / (b - a), 0, 1); return q * q * (3 - 2 * q); };
  const part = (id, name, info, meshes, anchor) => ({ id, name, info, meshes: [].concat(meshes || []), anchor: V(anchor[0], anchor[1], anchor[2]) });
  const tag = (parts) => { Object.values(parts).forEach((p) => p.meshes.forEach((m) => { m.userData.part = p.id; })); return parts; };
  const QUIZ = () => ({ type: "toggle", key: "quiz", label: "Game: find the part" });
  const std = (o) => new (T().MeshStandardMaterial)(o);
  const vstd = (o) => std(Object.assign({ vertexColors: true, roughness: 0.8 }, o || {}));
  const shadow = (g) => { g.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return g; };
  const pickBall = (r, x, y, z) => { const m = new (T().Mesh)(new (T().SphereGeometry)(r, 10, 8), new (T().MeshBasicMaterial)({ transparent: true, opacity: 0, depthWrite: false })); m.position.set(x, y, z); m.userData.pick = true; return m; };
  function dots(n, r) { const T3 = T(), im = new T3.InstancedMesh(new T3.SphereGeometry(r, 8, 6), new T3.MeshBasicMaterial({ color: 0xffffff }), n); im.instanceColor = new T3.InstancedBufferAttribute(new Float32Array(n * 3), 3); im.frustumCulled = false; im.userData.m4 = new T3.Matrix4(); im.userData.col = new T3.Color(); return im; }
  function putDot(im, i, p, hex, sc) { const m4 = im.userData.m4; if (sc != null) m4.makeScale(sc, sc, sc); else m4.identity(); m4.setPosition(p.x, p.y, p.z); im.setMatrixAt(i, m4); im.setColorAt(i, im.userData.col.setHex(hex)); }
  const flush = (im) => { im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; };

  /* ======================= people ======================= */
  /* light figure for crowds: skin, shirt, shorts and hair painted on a coarse body mesh; about 1 unit tall at s = 1 */
  BA.personGeo = (shirt) => BA.cached("person" + shirt, () => { const sk = lin(0x8d5a3b), sh = lin(shirt), st = lin(0x2a3140), hair = lin(0x16110d);
    return BA.mesh(BA.bodySDF, [-0.86, -0.03, -0.34, 0.86, 3.46, 0.36], 0.05, { color: (x, y, z) => { const ax = Math.abs(x); if (y > 3.2 && z < 0.12 || y > 3.3) return hair; if (y > 1.62 && y < 2.7 && (ax < 0.4 || y > 2.3 && ax < 0.62)) return sh; if (y > 0.95 && y <= 1.62 && ax < 0.42) return st; return sk; } }); });
  BK.person = (s = 1, col = 0x3a6ad8) => { const m = new (T().Mesh)(BA.personGeo(col), vstd({ roughness: 0.75 })); m.scale.setScalar(s * 0.295); m.castShadow = true; const g = new (T().Group)(); g.add(m); return g; };

  /* ======================= frog / toad ======================= */
  const frogSDF = (x, y, z) => { const az = Math.abs(z), S = sd.smin;
    let d = sd.ell(x, y, z, -0.05, 0.2, 0, 0.36, 0.2, 0.25); d = S(d, sd.ell(x, y, z, 0.3, 0.24, 0, 0.2, 0.14, 0.2), 0.12);
    d = S(d, sd.sph(x, y, az, 0.34, 0.37, 0.12, 0.07), 0.04);                                                         // eye bumps
    let l = sd.cone(x, y, az, -0.25, 0.16, 0.2, -0.02, 0.1, 0.36, 0.1, 0.06); l = S(l, sd.cone(x, y, az, -0.02, 0.1, 0.36, -0.3, 0.05, 0.4, 0.06, 0.04), 0.03); l = S(l, sd.cone(x, y, az, -0.3, 0.05, 0.4, -0.12, 0.025, 0.5, 0.035, 0.02), 0.02);   // folded hind leg
    d = S(d, l, 0.05); return S(d, S(sd.cone(x, y, az, 0.2, 0.16, 0.17, 0.26, 0.05, 0.24, 0.05, 0.03), sd.ell(x, y, az, 0.32, 0.025, 0.25, 0.07, 0.02, 0.05), 0.02), 0.04); };
  BK.frog = (s = 1) => { const T3 = T(), g = new T3.Group();
    const geo = BA.cached("frog", () => { const gr = lin(0x5c8f2e), dk = lin(0x2a4a14), be = lin(0xe6e2c0); return BA.mesh(frogSDF, [-0.6, -0.02, -0.56, 0.56, 0.5, 0.56], 0.02, { color: (x, y, z, nx, ny) => { let c = mix3(gr, dk, sst(0.5, 0.62, BK.fbm(x * 9, y * 9, z * 9)) * 0.85); return mix3(c, be, sst(-0.2, -0.75, ny) * (y < 0.2 ? 1 : 0)); } }); });
    g.add(new T3.Mesh(geo, new T3.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, clearcoat: 0.8 })));
    for (const z of [-0.12, 0.12]) { const e = new T3.Mesh(new T3.SphereGeometry(0.045, 12, 10), new T3.MeshPhysicalMaterial({ color: 0xd8a020, roughness: 0.1, clearcoat: 1 })); e.position.set(0.37, 0.39, z); g.add(e); const p = new T3.Mesh(new T3.SphereGeometry(0.022, 8, 6), new T3.MeshBasicMaterial({ color: 0x050505 })); p.position.set(0.4, 0.395, z * 1.12); g.add(p); }
    g.scale.setScalar(s); return shadow(g); };

  /* ======================= snake ======================= */
  BK.snake = (s = 1) => { const T3 = T(), g = new T3.Group(), pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([u * 2.2 - 1.1, 0.07 + (u > 0.86 ? (u - 0.86) * 1.4 : 0), Math.sin(u * 9.5) * 0.26 * (1 - u * 0.3)]); }
    const a = lin(0x8a7a34), b = lin(0x2e2412), be = lin(0xd9cf9a), cv = BA.curve(pts);
    g.add(BA.tube(cv, 0.07, new T3.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.35, clearcoat: 0.7 }), { seg: 160, rs: 12, r: (t) => (t < 0.12 ? 0.25 + t * 6.2 : t > 0.93 ? 1.15 : 1), color: (t, q) => (q > 0.6 && q < 0.9 ? be : Math.sin(t * 150) > 0.35 ? b : a) }));
    const hp = cv.getPointAt(1), hd = new T3.Mesh(new T3.SphereGeometry(0.095, 16, 12), new T3.MeshPhysicalMaterial({ color: 0x7a6a2c, roughness: 0.35, clearcoat: 0.7 })); hd.scale.set(1.5, 0.7, 1); hd.position.copy(hp).add(V(0.06, 0.01, 0)); g.add(hd);
    for (const z of [-0.06, 0.06]) { const e = new T3.Mesh(new T3.SphereGeometry(0.016, 8, 6), new T3.MeshBasicMaterial({ color: 0x0a0a0a })); e.position.copy(hd.position).add(V(0.07, 0.035, z)); g.add(e); }
    const tg = new T3.Mesh(new T3.CylinderGeometry(0.004, 0.004, 0.16, 4), std({ color: 0xc02a3a })); tg.rotation.z = Math.PI / 2; tg.position.copy(hd.position).add(V(0.2, -0.01, 0)); g.add(tg);
    g.scale.setScalar(s); return shadow(g); };

  /* ======================= bird (faces +x; g.wings = two pivots that flap about x) ======================= */
  const birdSDF = (x, y, z) => { let d = sd.ell(x, y, z, 0, 0, 0, 0.36, 0.19, 0.17); d = sd.smin(d, sd.sph(x, y, z, 0.34, 0.14, 0, 0.125), 0.1); d = sd.smin(d, sd.cone(x, y, z, 0.43, 0.13, 0, 0.6, 0.08, 0, 0.05, 0.008), 0.02); return sd.smin(d, sd.ell(x, y, z, -0.48, 0.0, 0, 0.26, 0.035, 0.11), 0.08); };
  BK.bird = (s = 1, col = 0x6a4a2a) => { const T3 = T(), g = new T3.Group();
    const geo = BA.cached("bird" + col, () => { const c0 = lin(col), dk = mix3(c0, [0, 0, 0], 0.4), lt = mix3(c0, [1, 1, 1], 0.6), bk = lin(0xe0a020); return BA.mesh(birdSDF, [-0.8, -0.24, -0.22, 0.66, 0.32, 0.22], 0.018, { color: (x, y, z, nx, ny) => { if (x > 0.455) return bk; let c = mix3(c0, dk, sst(0.45, 0.65, BK.fbm(x * 12, y * 12, z * 12)) * 0.6); c = mix3(c, lt, sst(-0.1, -0.7, ny) * 0.8); return x < -0.45 ? mix3(c, dk, 0.5) : c; } }); });
    g.add(new T3.Mesh(geo, vstd({ roughness: 0.7 })));
    const wm = std({ color: col, roughness: 0.75, side: T3.DoubleSide }), sh = new T3.Shape(); sh.moveTo(-0.16, 0); sh.lineTo(0.16, 0); sh.quadraticCurveTo(0.2, 0.42, 0.02, 0.78); sh.lineTo(-0.1, 0.62); sh.lineTo(-0.16, 0.66); sh.lineTo(-0.2, 0.42); sh.lineTo(-0.27, 0.44); sh.closePath();
    g.wings = [1, -1].map((sdv) => { const piv = new T3.Group(), w = new T3.Mesh(new T3.ShapeGeometry(sh), wm); w.rotation.x = sdv * Math.PI / 2; w.position.set(0, 0, 0); piv.add(w); piv.position.set(0.02, 0.1, sdv * 0.1); g.add(piv); return piv; });
    for (const z of [-0.085, 0.085]) { const e = new T3.Mesh(new T3.SphereGeometry(0.018, 8, 6), new T3.MeshBasicMaterial({ color: 0x0a0a0a })); e.position.set(0.41, 0.17, z); g.add(e); const lg = new T3.Mesh(new T3.CylinderGeometry(0.008, 0.008, 0.2, 5), std({ color: 0xd9a030 })); lg.position.set(-0.02, -0.26, z * 0.7); g.add(lg); }
    g.scale.setScalar(s); return shadow(g); };

  /* ======================= insect (faces +x; optional g.wings) ======================= */
  const oldInsect = BK.insect;
  BK.insect = (s = 1, col = 0x5a3a1a, o = {}) => { const T3 = T(), g = new T3.Group(), c0 = new T3.Color(col), m = new T3.MeshPhysicalMaterial({ color: col, roughness: 0.32, clearcoat: 0.9, clearcoatRoughness: 0.25 }), dk = new T3.MeshPhysicalMaterial({ color: c0.clone().multiplyScalar(0.45), roughness: 0.4, clearcoat: 0.6 });
    for (let i = 0; i < 6; i++) { const r = 0.14 * (1 - Math.abs(i - 1.6) / 6.5), sg = new T3.Mesh(new T3.SphereGeometry(r, 14, 10), i % 2 ? dk : m); sg.scale.set(0.75, 0.82, 1); sg.position.set(-0.1 - i * 0.085, 0.005 - i * 0.004, 0); g.add(sg); }
    const th = new T3.Mesh(new T3.SphereGeometry(0.125, 16, 12), m); th.scale.set(1.25, 0.9, 0.95); th.position.x = 0.04; g.add(th);
    const hd = new T3.Mesh(new T3.SphereGeometry(0.085, 14, 10), m); hd.scale.set(0.9, 1.05, 1); hd.position.set(0.21, -0.01, 0); g.add(hd);
    const eyeM = new T3.MeshPhysicalMaterial({ color: 0x1a0c08, roughness: 0.15, clearcoat: 1 }), lm = std({ color: 0x1e1408, roughness: 0.6 });
    for (const sdv of [-1, 1]) { const e = new T3.Mesh(new T3.SphereGeometry(0.038, 10, 8), eyeM); e.position.set(0.24, 0.035, sdv * 0.062); g.add(e);
      for (let i = 0; i < 3; i++) { const hind = i === 2 && o.jump !== false && !o.wings, x0 = 0.09 - i * 0.075, k = hind ? 1.7 : 1;
        const fe = new T3.Mesh(new T3.CylinderGeometry(0.014 * k, 0.011, 0.2 * k, 6), hind ? m : lm), ti = new T3.Mesh(new T3.CylinderGeometry(0.008, 0.006, 0.24 * k, 5), lm);
        const knee = V(x0 + (i - 1) * 0.07 - (hind ? 0.12 : 0), 0.06 + (hind ? 0.16 : 0), sdv * (0.17 + (hind ? 0.02 : 0))), hip = V(x0, -0.04, sdv * 0.07), foot = V(knee.x + (i - 1) * 0.04 - (hind ? 0.02 : 0), -0.2, sdv * 0.26);
        const put = (mesh, a, b) => { const d = b.clone().sub(a), L = d.length(); mesh.scale.y = L / mesh.geometry.parameters.height; mesh.position.copy(a).addScaledVector(d, 0.5); mesh.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); g.add(mesh); };
        put(fe, hip, knee); put(ti, knee, foot); }
      if (o.antennae !== false) g.add(BA.tube(BA.curve([[0.26, 0.05, sdv * 0.03], [0.4, 0.17, sdv * 0.08], [0.56, 0.16, sdv * 0.16]]), 0.005, lm, { seg: 10, rs: 4 })); }
    if (o.wings && (o.wingOp || 0) > 0.92 && (o.wingR || 0) >= 0.4) {                                   // butterfly: patterned fore and hind wings
      const path = (q, k) => { q.moveTo(0.62 * k, 0); q.quadraticCurveTo(0.95 * k, 0.35 * k, k, 0.8 * k); q.quadraticCurveTo(0.9 * k, 1.02 * k, 0.72 * k, 0.9 * k); q.quadraticCurveTo(0.55 * k, 0.7 * k, 0.5 * k, 0.55 * k); q.quadraticCurveTo(0.4 * k, 0.85 * k, 0.2 * k, 0.8 * k); q.quadraticCurveTo(0, 0.6 * k, 0.08 * k, 0.35 * k); q.quadraticCurveTo(0.15 * k, 0.1 * k, 0.4 * k, 0); q.closePath(); };
      const cv = BK.cv(256, 256), q = cv.getContext("2d"); q.translate(0, 256); q.scale(1, -1); q.fillStyle = "#" + (o.wingCol || 0xff8a20).toString(16).padStart(6, "0"); q.fillRect(0, 0, 256, 256); q.strokeStyle = "#17110c"; q.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = 0.12 + i * 0.26; q.beginPath(); q.moveTo(140, 0); q.lineTo(140 + Math.cos(a) * 300, Math.sin(a) * 300); q.stroke(); } q.lineWidth = 26; q.beginPath(); path(q, 256); q.stroke(); q.fillStyle = "#fff"; for (let i = 0; i < 16; i++) { const u = i / 16; q.beginPath(); q.arc(160 + u * 84, 60 + u * 150 + Math.sin(u * 9) * 6, 4, 0, 6.3); q.fill(); }
      const tx2 = BK.tex(cv); tx2.wrapS = tx2.wrapT = T3.ClampToEdgeWrapping; const wm = new T3.MeshStandardMaterial({ map: tx2, roughness: 0.6, side: T3.DoubleSide }), sh = new T3.Shape(); path(sh, 1); g.wings = [];
      for (const sdv of [-1, 1]) { const w = new T3.Mesh(new T3.ShapeGeometry(sh, 10), wm), k = (o.wingR || 0.42) * 2.6; w.scale.setScalar(k); w.rotation.x = sdv * Math.PI / 2; w.position.set(-0.55 * k + 0.02, 0, sdv * 0.02); const piv = new T3.Group(); piv.position.set(0, 0.09, sdv * 0.04); piv.add(w); g.add(piv); g.wings.push(piv); }
    } else
    if (o.wings) { const wm = new T3.MeshPhysicalMaterial({ color: o.wingCol || 0xffffff, transparent: true, opacity: o.wingOp || 0.35, roughness: 0.1, iridescence: 1, side: T3.DoubleSide, depthWrite: false }); g.wings = [];
      for (const sdv of [-1, 1]) { const w = new T3.Mesh(new T3.CircleGeometry(o.wingR || 0.3, 24), wm); w.scale.set(1.6, 0.6, 1); const piv = new T3.Group(); piv.position.set(0, 0.08, sdv * 0.06); w.rotation.x = -Math.PI / 2; w.position.set(-0.15, 0, sdv * 0.28); piv.add(w); g.add(piv); g.wings.push(piv); } }
    g.scale.setScalar(s); return shadow(g); };

  /* ======================= tree and plant ======================= */
  BK.tree = (h = 4, seed = 1, leafCol = 0x2f6b2e) => { const T3 = T(), g = new T3.Group(), rr = BK.rng(seed * 13 + 1), bark = BK.mat.bark();
    const top = V((rr() - 0.5) * h * 0.08, h * 0.56, (rr() - 0.5) * h * 0.08), tc = BA.curve([[0, 0, 0], [top.x * 0.4, h * 0.3, top.z * 0.4], top]);
    g.add(BA.tube(tc, h * 0.06, bark, { seg: 16, rs: 9, r: (t) => 1.35 - 0.75 * t + 0.5 * Math.pow(1 - t, 6) }));
    const lc = lin(leafCol), l2 = mix3(lc, [1, 1, 0.3], 0.22), l3 = mix3(lc, [0, 0, 0], 0.35), geos = [], n = 9;
    for (let i = 0; i < n; i++) { const a = i * 2.4 + rr(), el = 0.25 + rr() * 0.9, R = h * (0.2 + rr() * 0.1), c = V(top.x + Math.cos(a) * Math.cos(el) * h * 0.22, h * 0.66 + Math.sin(el) * h * 0.2, top.z + Math.sin(a) * Math.cos(el) * h * 0.22);
      if (i < 4) g.add(BA.tube(BA.curve([tc.getPointAt(0.62 + i * 0.09), top.clone().lerp(c, 0.5).add(V(0, -h * 0.03, 0)), c]), h * 0.02, bark, { seg: 8, rs: 6, r: (t) => 1.2 - 0.7 * t }));
      const b = new T3.SphereGeometry(R, 18, 13), p = b.attributes.position, col = new Float32Array(p.count * 3), v = V();
      for (let k = 0; k < p.count; k++) { v.fromBufferAttribute(p, k); const nn = BK.fbm(v.x * 5 / h * 4 + seed + i, v.y * 5 / h * 4, v.z * 5 / h * 4), hf = BK.noise3(v.x * 26 / h * 4, v.y * 26 / h * 4 + i, v.z * 26 / h * 4); v.multiplyScalar(1 + (nn - 0.5) * 0.7 + (hf - 0.5) * 0.22); p.setXYZ(k, v.x + c.x, v.y * 0.82 + c.y, v.z + c.z); const cc = mix3(mix3(l3, lc, sst(0.25, 0.6, hf + v.y / R * 0.25)), l2, sst(0.55, 0.85, hf) * 0.8); col[k * 3] = cc[0]; col[k * 3 + 1] = cc[1]; col[k * 3 + 2] = cc[2]; }
      b.computeVertexNormals(); b.setAttribute("color", new T3.BufferAttribute(col, 3)); geos.push(b); }
    g.add(new T3.Mesh(BA.mergeC(geos), vstd({ roughness: 0.9, flatShading: false }))); return shadow(g); };
  const oldPlant = BK.plant;
  BK.plant = (o = {}) => { const T3 = T(), h = o.h || 2, grp = new T3.Group(), bend = o.bend || 0, lean = o.lean || 0, pts = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(V(Math.sin(t * Math.PI * 0.5) * bend * h + lean * t * h, t * h, 0)); }
    const stemMat = o.stemMat || new T3.MeshPhysicalMaterial({ color: o.stemCol || 0x5f9a3c, roughness: 0.5, sheen: 0.4 }), r0 = o.r || 0.045, n = o.leaves || 6;
    const stem = BA.tube(new T3.CatmullRomCurve3(pts), r0, stemMat, { seg: 48, rs: 10, r: (t) => (1.25 - 0.6 * t) * (1 + 0.16 * Math.exp(-Math.pow(((t * (n + 1.5)) % 1) - 0.5, 2) * 60)) }); stem.castShadow = true; grp.add(stem); grp.stem = stem; grp.leaves = []; grp.curve = pts;
    const lm = o.leafMat || BK.mat.leaf(o.leafCol || "#3f8a3a", "#a8d47e"), L0 = o.leafLen || 0.55, W0 = o.leafW || 0.28;
    for (let i = 0; i < n; i++) { const t = 0.3 + 0.65 * i / Math.max(1, n - 1), p = pts[Math.round(t * 12)], L = L0 * (1.15 - t * 0.45);
      const lf = BK.leaf(L, W0 * (1.1 - t * 0.3), lm, 0.34), piv = new T3.Group(); piv.position.copy(p); piv.rotation.y = i * 2.4; lf.rotation.x = -1.0; lf.position.set(0, 0, 0);
      const pet = new T3.Mesh(new T3.CylinderGeometry(r0 * 0.28, r0 * 0.34, L * 0.22, 5), stemMat); pet.rotation.x = Math.PI / 2 - 1.0 + Math.PI / 2; pet.position.set(0, -Math.cos(1.0) * 0 , 0); pet.visible = false;
      piv.add(lf); grp.add(piv); grp.leaves.push(lf); }
    /* young leaves folded at the growing tip */
    for (const sdv of [-1, 1]) { const b = BK.leaf(L0 * 0.34, W0 * 0.4, lm, 0.1), piv = new T3.Group(); piv.position.copy(pts[12]); piv.rotation.y = sdv * 1.4 + n; b.rotation.x = -0.35; piv.add(b); grp.add(piv); }
    grp.tip = pts[12].clone(); return grp; };

  /* =====================================================================
     S-a  Joints and the vertebral column
     ===================================================================== */
  (function () {
    if (!MK.scenes["S-a"]) return;
    const bone = () => BA.mat.matte(TIS.bone, { roughness: 0.6 }), cart = () => new (T().MeshPhysicalMaterial)({ color: 0xbfe2f2, roughness: 0.25, clearcoat: 0.8 });
    const humerus = () => BA.cached("humerus", () => BA.mesh((x, y, z) => { let d = sd.cone(x, y, z, 0, 0.12, 0, 0, 2.12, 0, 0.085, 0.09); d = sd.smin(d, sd.sph(x, y, z, -0.09, 2.2, 0, 0.17), 0.1); d = sd.smin(d, sd.ell(x, y, z, 0.1, 2.12, 0, 0.09, 0.1, 0.1), 0.06); return sd.smin(d, sd.ell(x, y, z, 0, 0.03, 0, 0.13, 0.11, 0.19), 0.1); }, [-0.3, -0.12, -0.24, 0.24, 2.42, 0.24], 0.026));
    const forearm = () => BA.cached("forearm", () => BA.mesh((x, y, z) => { let u = sd.cone(x, y, z, -0.06, 0.02, 0, -0.05, 2.0, -0.03, 0.08, 0.045); u = sd.smin(u, sd.ell(x, y, z, -0.1, -0.1, 0, 0.09, 0.14, 0.1), 0.06); let r = sd.cone(x, y, z, 0.07, 0.14, 0, 0.06, 2.0, 0.03, 0.05, 0.08); r = sd.smin(r, sd.ell(x, y, z, 0.07, 0.12, 0, 0.075, 0.04, 0.075), 0.03); return Math.min(u, r); }, [-0.24, -0.28, -0.14, 0.18, 2.1, 0.14], 0.022));
    const scapula = () => BA.cached("scapula", () => BA.mesh((x, y, z) => { let d = sd.ell(x, y, z, -0.45, -0.25, -0.05, 0.42, 0.62, 0.06); d = sd.smin(d, sd.ell(x, y, z, -0.12, 0.0, 0, 0.14, 0.2, 0.17), 0.1); d = sd.smin(d, sd.cone(x, y, z, -0.6, 0.2, -0.08, 0.05, 0.32, 0.02, 0.05, 0.07), 0.06); return sd.smax(d, -sd.sph(x, y, z, 0.12, 0, 0, 0.2), 0.03); }, [-0.95, -0.95, -0.28, 0.2, 0.5, 0.24], 0.024));
    BA.addMode("S-a", "joints", {
      label: "Joints", dark: true, cam: [[1.5, 2.4, 9.4], [1.3, 1.9, 0]],
      values: { quiz: 0 }, controls: [QUIZ()],
      make(S, s, c, g) { const T3 = T(), P = (s.aparts = {});
        /* shoulder: ball and socket */
        const sc = new T3.Mesh(scapula(), bone()); sc.position.set(-1.9, 3.0, 0); g.add(sc);
        s.ball = new T3.Group(); s.ball.position.set(-1.78, 3.0, 0); const hu = new T3.Mesh(humerus(), bone()); hu.position.set(0.09, -2.2, 0); s.ball.add(hu);
        const cap = new T3.Mesh(new T3.SphereGeometry(0.185, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), cart()); cap.rotation.z = Math.PI / 2 + 0.3; s.ball.add(cap); g.add(s.ball);
        const caps = new T3.Mesh(new T3.SphereGeometry(0.33, 24, 16), new T3.MeshPhysicalMaterial({ color: 0xf2d98a, roughness: 0.2, transparent: true, opacity: 0.28, depthWrite: false })); caps.position.set(-1.82, 3.0, 0); caps.userData.baseOp = 0.28; caps.userData.soft = true; g.add(caps);
        /* elbow: hinge */
        const hu2 = new T3.Mesh(humerus(), bone()); hu2.position.set(1.5, 1.7, 0); g.add(hu2);
        s.hinge = new T3.Group(); s.hinge.position.set(1.5, 1.7, 0); const fa = new T3.Mesh(forearm(), bone()); fa.scale.set(1.3, 1, 1.3); s.hinge.add(fa); g.add(s.hinge);
        const c2 = new T3.Mesh(new T3.CylinderGeometry(0.135, 0.135, 0.36, 20), cart()); c2.rotation.x = Math.PI / 2; c2.position.set(1.5, 1.72, 0); g.add(c2);
        const lig = [-1, 1].map((z) => { const m = new T3.Mesh(new T3.BoxGeometry(0.1, 0.5, 0.025), std({ color: 0xf3dcd7, roughness: 0.6 })); m.position.set(1.5, 1.7, z * 0.21); g.add(m); return m; });
        P.ball = part("ball", "Ball: head of the humerus", "The rounded head fits into the socket and can turn in every direction.", [hu], [-1.5, 2.2, 0.15]);
        P.socket = part("socket", "Socket: scapula", "A shallow cup in the shoulder blade. The hip has a deeper socket in the pelvis.", [sc], [-2.5, 2.9, 0.1]);
        P.cart = part("cart", "Cartilage", "Smooth and slippery: it covers the ends of the bones, reduces friction and absorbs shock.", [cap, c2], [-1.72, 3.05, 0.2]);
        P.syn = part("syn", "Capsule with synovial fluid", "The synovial membrane makes synovial fluid, which lubricates the joint.", [caps], [-1.6, 3.3, 0.2]);
        P.hinge = part("hinge", "Hinge joint (elbow)", "Moves in one plane only, like a door hinge. The knee is also a hinge joint.", [fa, hu2], [1.9, 1.8, 0.2]);
        P.lig = part("lig", "Ligaments", "Tough, slightly elastic bands that join bone to bone and hold the joint together.", lig, [1.5, 1.9, 0.26]);
        tag(P); },
      update(S, s, c, dt) { const t = S.t; s.ball.rotation.set(Math.sin(t * 0.9) * 0.55, 0, 0.25 + Math.cos(t * 0.9) * 0.5); s.hinge.rotation.z = -0.25 - (0.5 + 0.5 * Math.sin(t * 1.1)) * 1.9; },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["socket", "syn", "cart", "ball", "lig", "hinge"], side: (id) => id === "socket" || id === "syn" || id === "ball" });  },
      hud: (s, c) => BA.focus.card(s, [{ title: "Synovial joints", lines: ["Ball and socket: movement in all planes (shoulder, hip).", "Hinge: movement in one plane (elbow, knee).", "Gliding (wrist, ankle), pivot (atlas–axis), fixed (skull sutures).", ["Cartilage reduces friction; synovial fluid lubricates.", "#7cb3ff"], ["Ligaments join bone to bone; tendons join muscle to bone.", "#ffd27a"]] }]),
    });
    /* one vertebra (centrum radius about 0.3; neural spine points −z) */
    const vert = () => BA.cached("vertebra", () => BA.mesh((x, y, z) => { const ax = Math.abs(x);
      let d = sd.smax(Math.hypot(x, z) - 0.3 * (0.94 + 0.5 * y * y / 0.02 * 0.02 + 0.06 * Math.abs(y) / 0.13), Math.abs(y) - 0.13, 0.04);
      const q = Math.hypot(Math.hypot(x, z + 0.4) - 0.19, y * 0.8) - 0.055; d = sd.smin(d, q, 0.05);                                          // neural arch round the canal
      d = sd.smin(d, sd.cone(x, y, z, 0, 0, -0.58, 0, -0.14, -1.0, 0.06, 0.035), 0.05);                                                       // neural spine
      d = sd.smin(d, sd.cone(ax, y, z, 0.2, 0, -0.36, 0.62, 0.02, -0.42, 0.055, 0.04), 0.05);                                                 // transverse processes
      return sd.smin(d, sd.sph(ax, y, z, 0.2, 0.12, -0.52, 0.06), 0.04); }, [-0.72, -0.26, -1.1, 0.72, 0.26, 0.36], 0.026));
    const REG = [["cervical", "Cervical vertebrae (7)", "Small and light: they support the head. The first two (atlas and axis) let the head nod and turn.", 7, 0.6, 0.72], ["thoracic", "Thoracic vertebrae (12)", "Each carries a pair of ribs. Long neural spines point downwards.", 12, 0.74, 0.96], ["lumbar", "Lumbar vertebrae (5)", "The largest: a thick centrum carries the weight of the upper body.", 5, 1.04, 1.16]];
    BA.addMode("S-a", "spine", {
      label: "Vertebral column", dark: true, cam: [[8.2, 2.6, -1.3], [0, 2.3, -1.3]],
      values: { quiz: 0 }, controls: [QUIZ()],
      make(S, s, c, g) { const T3 = T(), P = (s.aparts = {}), col = new T3.Group(); col.scale.setScalar(0.56); g.add(col);
        let y = 8.1, idx = 0; const total = 24, cordPts = [], discs = [], zAt = (t) => 0.3 * Math.sin(t * Math.PI * 2.5 + 0.5) - 0.12 * t;
        REG.forEach(([id, name, info, n, s0, s1]) => { const ms = []; for (let i = 0; i < n; i++) { const t = idx / total, k = s0 + (s1 - s0) * i / Math.max(1, n - 1), hgt = 0.27 * k; y -= hgt / 2; const z = zAt(t), m = new T3.Mesh(vert(), bone()); m.scale.setScalar(k); if (id === "thoracic") m.scale.z = k * 1.12; m.position.set(0, y, z); m.rotation.x = Math.atan2(zAt(t + 0.02) - zAt(t - 0.02), 0.3) * -0.9; col.add(m); ms.push(m); cordPts.push([0, y, z - 0.4 * k]);
            const dsc = new T3.Mesh(new T3.CylinderGeometry(0.27 * k, 0.27 * k, 0.07 * k, 18), cart()); dsc.position.set(0, y - hgt / 2 - 0.035 * k, z); dsc.rotation.x = m.rotation.x; col.add(dsc); discs.push(dsc); y -= hgt / 2 + 0.07 * k; idx++; }
          P[id] = part(id, name, info, ms, [0.25, ms[Math.floor(n / 2)].position.y * 0.56, 0.2]); });
        const zs = zAt(1), sac = new T3.Mesh(BA.cached("sacrum", () => BA.mesh((x, yy, z) => sd.smin(sd.smax(sd.cone(x, yy, z, 0, 0, 0, 0, -0.95, -0.34, 0.36, 0.1), Math.abs(z + (-yy) * 0.36) - 0.15, 0.08), sd.cone(x, yy, z, 0, -0.95, -0.34, 0, -1.35, -0.26, 0.07, 0.03), 0.05), [-0.5, -1.45, -0.6, 0.5, 0.2, 0.3], 0.03)), bone()); sac.position.set(0, y + 0.05, zs); col.add(sac);
        P.sacrum = part("sacrum", "Sacrum (5 fused) and coccyx", "Five vertebrae fused into one strong bone joined to the pelvic girdle. The coccyx below it is the remains of a tail.", [sac], [0.25, (y - 0.5) * 0.56, 0.1]);
        P.disc = part("disc", "Intervertebral discs", "Pads of cartilage between the vertebrae: they absorb shock and let the column bend.", discs, [0.2, discs[14].position.y * 0.56, 0.22]);
        const cord = BA.tube(BA.curve(cordPts), 0.075, std({ color: 0xf2d27a, roughness: 0.5 }), { seg: 80, rs: 8 }); col.add(cord);
        P.cord = part("cord", "Spinal cord", "Runs through the neural canals of the vertebrae, which protect it.", [cord], [0, 3.0, -0.3]);
        /* one enlarged lumbar vertebra, seen from above, with its parts named */
        const big = new T3.Mesh(vert(), bone()); big.scale.setScalar(1.25); big.rotation.set(0, 0, -Math.PI / 2); big.position.set(0, 2.3, 2.7); g.add(big); s.big = big;
        const L = (id, name, info, a) => { const m = pickBall(0.16, a[0], a[1], a[2]); g.add(m); P[id] = part(id, name, info, [m], a); P[id].noQuiz = false; };
        L("centrum", "Centrum", "The solid body of the vertebra: it carries the weight.", [0.2, 2.3, 2.7]); L("canal", "Neural canal", "The hole through which the spinal cord passes.", [0.2, 2.3, 2.2]); L("nspine", "Neural spine", "Points backwards: back muscles are attached to it.", [0.2, 2.3, 1.6]); L("trans", "Transverse process", "Side projections for muscles and ligaments (and ribs in the thorax).", [0.2, 1.6, 2.2]);
        tag(P); },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["cervical", "thoracic", "disc", "lumbar", "sacrum", "nspine", "canal", "trans", "centrum"], side: (id) => ["nspine", "canal", "trans", "centrum"].includes(id), hint: "Tap a region to isolate it", reach: 20 }); },
      hud: (s, c) => BA.focus.card(s, [{ title: "Vertebral column", lines: ["33 vertebrae: cervical 7, thoracic 12, lumbar 5, sacral 5 (fused), caudal 4 (coccyx).", "The S-shaped curves make it springy.", ["Centrum carries weight; the neural canal protects the spinal cord.", "#ffd27a"], ["Functions of the skeleton: support, protection, movement, breathing, making blood cells.", "#7cb3ff"], ["Left: one vertebra enlarged, seen from above.", "#a9b6d3"]] }]),
    });
  })();

  /* =====================================================================
     B-g  Teeth
     ===================================================================== */
  (function () {
    if (!MK.scenes["B-g"]) return;
    const DENT = { human: { up: [2, 1, 2, 3], lo: [2, 1, 2, 3] }, goat: { up: [0, 0, 3, 3], lo: [3, 1, 3, 3] }, dog: { up: [3, 1, 4, 2], lo: [3, 1, 4, 3] } };
    const TN = [["Incisor", "Chisel-shaped, one root: cuts and bites."], ["Canine", "Pointed, one long root: grips and tears."], ["Premolar", "Two cusps, one or two roots: crushes and grinds."], ["Molar", "Four or more cusps, two or three roots: grinds."]];
    /* tooth types: crown above y = 0 (enamel), root below (covered by the gum) */
    const toothSDF = [
      (x, y, z) => sd.smin(sd.smax(sd.ell(x, y, z, 0, 0.14, 0, 0.085, 0.2, 0.05 + 0.03 * clamp(1 - y / 0.3, 0, 1)), -y - 0.02, 0.03), sd.cone(x, y, z, 0, 0.02, 0, 0, -0.42, 0, 0.055, 0.014), 0.04),
      (x, y, z) => sd.smin(sd.cone(x, y, z, 0, 0.0, 0, 0, 0.36, 0, 0.085, 0.012), sd.cone(x, y, z, 0, 0.02, 0, 0, -0.56, 0, 0.065, 0.014), 0.05),
      (x, y, z) => { let d = sd.ell(x, y, z, 0, 0.1, 0, 0.095, 0.13, 0.11); for (const s of [-1, 1]) d = sd.smin(d, sd.sph(x, y, z, 0, 0.21, s * 0.055, 0.05), 0.03); return sd.smin(d, sd.cone(x, y, z, 0, 0.02, 0, 0, -0.44, 0, 0.06, 0.016), 0.04); },
      (x, y, z) => { let d = sd.ell(x, y, z, 0, 0.09, 0, 0.15, 0.12, 0.13); for (const a of [-1, 1]) for (const b of [-1, 1]) d = sd.smin(d, sd.sph(x, y, z, a * 0.075, 0.19, b * 0.065, 0.05), 0.03); for (const a of [-1, 1]) d = sd.smin(d, sd.cone(x, y, z, a * 0.075, 0.02, 0, a * 0.1, -0.4, 0, 0.055, 0.016), 0.03); return d; },
    ];
    const toothGeo = (t) => BA.cached("tooth" + t, () => { const en = lin(0xf7f4ea), en2 = lin(0xe9e2cf), rt = lin(0xe3cf9c); return BA.mesh(toothSDF[t], [-0.22, -0.6, -0.2, 0.22, 0.4, 0.2], 0.014, { color: (x, y, z) => (y < -0.01 ? rt : mix3(en, en2, sst(0.1, -0.0, y) * 0.6 + BK.noise3(x * 30, y * 30, z * 30) * 0.12)) }); });
    const tmat = () => new (T().MeshPhysicalMaterial)({ vertexColors: true, roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.2 });
    BA.addMode("B-g", "teeth", {
      label: "Teeth and dental formula", dark: true, cam: [[1.5, 2.6, 7.6], [1.15, 1.2, 0.4]],
      make(S, s, c, g) { s.sp = ""; s.jg = null; },
      update(S, s, c, dt) { const T3 = T();
        if (s.sp !== c.sp) { s.sp = c.sp; if (s.jg) BK.dispose(S, s.jg); const jg = (s.jg = new T3.Group()); s._ag ? s._ag.add(jg) : s.g.add(jg); const d = DENT[c.sp], P = (s.aparts = {}), byT = [[], [], [], []];
          const gum = new T3.MeshPhysicalMaterial({ color: 0xd9767c, roughness: 0.38, clearcoat: 0.6 }), el = c.sp === "human" ? 1 : 1.35;
          [1, -1].forEach((sdv) => { const R = sdv > 0 ? 1.25 : 1.17, y0 = 1.5 + sdv * 0.5;
            const arch = BA.tube(BA.curve(Array.from({ length: 21 }, (_, i) => { const a = Math.PI * (i / 20); return [Math.cos(a) * R, y0 + sdv * 0.27, Math.sin(a) * R * el]; })), 0.25, gum, { seg: 60, rs: 12 }); arch.scale.y = 1; jg.add(arch);
            const row = sdv > 0 ? d.up : d.lo, types = []; row.forEach((n, t) => { for (let i = 0; i < n; i++) types.push(t); }); const tot = types.length;
            [1, -1].forEach((side) => types.forEach((t, i) => { const a = Math.PI / 2 - side * (0.085 + (i / Math.max(1, tot)) * 1.42), th = new T3.Mesh(toothGeo(t), tmat()); const k = c.sp === "dog" && t === 1 ? 1.5 : c.sp === "dog" && (sdv > 0 ? t === 2 && i === tot - row[3] - 1 : t === 3 && i === tot - row[3]) ? 1.35 : 1;
              th.scale.set(k, sdv * k * (c.sp === "goat" && t >= 2 ? 1.15 : 1) * -1, k); th.position.set(Math.cos(a) * R, y0 - sdv * 0.03, Math.sin(a) * R * el); th.rotation.y = -a + Math.PI / 2; jg.add(th); byT[t].push(th); })); });
          if (c.sp === "goat") { const pad = new T3.Mesh(new T3.SphereGeometry(0.3, 20, 12), gum); pad.scale.set(1.5, 0.3, 0.8); pad.position.set(0, 1.86, 1.2 * el); jg.add(pad); P.pad = part("pad", "Horny pad", "A goat has no upper incisors or canines: the lower incisors bite against this hard pad.", [pad], [0, 1.9, 1.6]); }
          /* one of each kind, pulled out to show the root */
          TN.forEach(([name, info], t) => { const m = new T3.Mesh(toothGeo(t), tmat()); m.scale.setScalar(1.25); m.position.set(-0.95 + t * 0.62, 0.42, 1.9); jg.add(m); byT[t].push(m); P["t" + t] = part("t" + t, name + (byT[t].length > 1 ? "s" : " (none in this jaw)"), info, byT[t], [-0.95 + t * 0.62, 0.3, 2.0]); });
          tag(P); s.aF.sel = null; }
        s.jg.rotation.y = Math.sin(S.t * 0.35) * 0.18; },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["t0", "t1", "t2", "t3"].concat(c.sp === "goat" ? ["pad"] : []), world: s.jg, hint: "Tap a tooth type to see where it sits in the jaw", side: (id) => id === "t0" || id === "t1", reach: 26 }); },
    });
  })();

  /* =====================================================================
     R-c  The ear
     ===================================================================== */
  (function () {
    if (!MK.scenes["R-c"]) return;
    const EP = { pinna: ["Pinna (ear flap)", "Collects sound waves and directs them into the ear canal."], canal: ["Ear canal", "Carries sound to the eardrum. Wax and hairs trap dust."], drum: ["Eardrum", "A thin membrane that vibrates when sound waves hit it."], oss: ["Ossicles", "Three tiny bones (hammer, anvil, stirrup) that pass on and amplify the vibrations about 20 times."], oval: ["Oval window", "Passes the vibrations into the fluid of the cochlea."], coch: ["Cochlea", "A coiled, fluid-filled tube. Its sensory hair cells turn vibrations into nerve impulses."], canals: ["Semicircular canals", "Three fluid-filled loops at right angles: they detect movement of the head and keep balance."], nerve: ["Auditory nerve", "Carries impulses to the brain, which interprets them as sound."], eust: ["Eustachian tube", "Joins the middle ear to the throat and keeps the air pressure equal on both sides of the eardrum."] };
    BA.addMode("R-c", "ear", {
      label: "Ear", dark: true, cam: [[1.3, 2.0, 7.4], [0.95, 1.55, 0]],
      values: { quiz: 0, loud: 60 }, controls: [{ key: "loud", label: "Loudness", min: 0, max: 100, unit: "dB" }, QUIZ()],
      make(S, s, c, g) { const T3 = T(), M = {}, skin = BK.mat.skin(0x9a6544), pink = BA.mat.tissue(0xe0a090, { roughness: 0.5 }), bn = BA.mat.matte(TIS.bone, { roughness: 0.5 });
        M.pinna = new T3.Mesh(BA.cached("pinna", () => BA.mesh((x, y, z) => { let d = sd.ell(x, y, z, 0, 0.1, 0, 0.16, 0.72, 0.5); d = sd.smax(d, -sd.ell(x, y, z, 0.13, 0.12, 0.04, 0.14, 0.56, 0.36), 0.06); d = sd.smin(d, sd.ell(x, y, z, 0.02, -0.02, 0.12, 0.1, 0.22, 0.14), 0.08); return sd.smax(d, -sd.ell(x, y, z, 0.16, -0.02, 0.1, 0.16, 0.13, 0.1), 0.05); }, [-0.22, -0.7, -0.56, 0.24, 0.9, 0.56], 0.022)), skin); M.pinna.position.set(-3.0, 1.55, 0);
        M.canal = BA.tube(BA.curve([[-2.86, 1.53, 0.1], [-2.3, 1.6, 0.06], [-1.75, 1.5, 0]]), 0.16, new T3.MeshPhysicalMaterial({ color: 0xe9b8a4, roughness: 0.5, transparent: true, opacity: 0.5, side: T3.DoubleSide, depthWrite: false }), { seg: 24, rs: 16 }); M.canal.userData.baseOp = 0.5; M.canal.userData.soft = true;
        M.drum = new T3.Mesh(new T3.ConeGeometry(0.2, 0.07, 24, 1, true), new T3.MeshPhysicalMaterial({ color: 0xf0d8c8, roughness: 0.3, side: T3.DoubleSide, transparent: true, opacity: 0.9 })); M.drum.rotation.z = -Math.PI / 2; M.drum.position.set(-1.72, 1.5, 0); M.drum.userData.baseOp = 0.9;
        const o1 = BA.tube(BA.curve([[-1.68, 1.5, 0], [-1.6, 1.7, 0], [-1.52, 1.82, 0]]), 0.03, bn, { seg: 10, rs: 8, r: (t) => 0.7 + 1.1 * t }), o2 = BA.tube(BA.curve([[-1.52, 1.82, 0], [-1.38, 1.78, 0], [-1.3, 1.6, 0]]), 0.035, bn, { seg: 10, rs: 8, r: (t) => 1.3 - 0.6 * t }), o3 = new T3.Mesh(new T3.TorusGeometry(0.07, 0.016, 8, 16), bn); o3.position.set(-1.2, 1.56, 0); o3.rotation.y = Math.PI / 2; o3.scale.set(1, 1, 1.5); s.oss = [o1, o2, o3];
        M.oval = new T3.Mesh(new T3.CylinderGeometry(0.075, 0.075, 0.02, 16), std({ color: 0xbfe2f2, roughness: 0.3 })); M.oval.rotation.z = Math.PI / 2; M.oval.position.set(-1.1, 1.56, 0);
        const cp = []; for (let i = 0; i <= 90; i++) { const u = i / 90, a = u * Math.PI * 2 * 2.6, r = 0.52 * (1 - u * 0.78) + 0.06; cp.push([-0.42 + Math.cos(a + Math.PI) * r, 1.3 + Math.sin(a + Math.PI) * r * 0.95 - 0.1, u * 0.34]); }
        M.coch = BA.tube(BA.curve(cp), 0.115, BA.mat.tissue(0xd8b48c, { roughness: 0.4, clearcoat: 0.5 }), { seg: 200, rs: 12, r: (t) => 1.15 - 0.6 * t }); s.cochC = BA.curve(cp);
        const vest = new T3.Mesh(new T3.SphereGeometry(0.2, 18, 14), BA.mat.tissue(0xd8b48c, { roughness: 0.4, clearcoat: 0.5 })); vest.position.set(-0.86, 1.62, 0);
        const sc = [[0, 0, 0], [Math.PI / 2, 0, 0], [0, Math.PI / 2, 0.3]].map((r, i) => { const m = new T3.Mesh(new T3.TorusGeometry(0.27, 0.035, 8, 28, Math.PI * 1.55), BA.mat.tissue(0xc9a47c, { roughness: 0.4, clearcoat: 0.5 })); m.rotation.set(r[0], r[1], r[2] + 0.4); m.position.set(-0.86 + (i === 2 ? -0.05 : 0.02), 1.98 + (i === 1 ? -0.06 : 0), i === 1 ? -0.12 : 0); return m; });
        M.nerve = BA.tube(BA.curve([[-0.4, 1.2, 0.1], [0.2, 1.3, 0.05], [0.9, 1.7, 0], [1.5, 1.9, 0]]), 0.07, std({ color: TIS.nerve, roughness: 0.5 }), { seg: 30, rs: 10, r: (t) => 1.2 - 0.3 * t });
        M.eust = BA.tube(BA.curve([[-1.45, 1.38, 0], [-1.2, 0.9, 0.1], [-0.7, 0.45, 0.2]]), 0.06, pink, { seg: 20, rs: 10, r: (t) => 0.7 + 0.7 * t });
        const P = (s.aparts = {}), A = { pinna: [-3.0, 2.2, 0.1], canal: [-2.3, 1.62, 0.2], drum: [-1.72, 1.36, 0.1], oss: [-1.45, 1.86, 0.05], oval: [-1.1, 1.52, 0.1], coch: [-0.42, 0.85, 0.2], canals: [-0.8, 2.25, 0.05], nerve: [0.9, 1.7, 0.1], eust: [-1.0, 0.7, 0.15] };
        const meshes = { pinna: [M.pinna], canal: [M.canal], drum: [M.drum], oss: s.oss, oval: [M.oval], coch: [M.coch, vest], canals: sc, nerve: [M.nerve], eust: [M.eust] };
        Object.keys(EP).forEach((id) => { meshes[id].forEach((m) => g.add(m)); P[id] = part(id, EP[id][0], EP[id][1], meshes[id], A[id]); }); tag(P); s.drum = M.drum;
        s.wave = dots(30, 0.03); g.add(s.wave); s.imp = dots(10, 0.035); g.add(s.imp); s.wu = Array.from({ length: 30 }, (_, i) => i / 30); },
      update(S, s, c, dt) { const k = c.loud / 100, vib = Math.sin(S.t * 34) * 0.03 * k; s.drum.position.x = -1.72 + vib; s.oss.forEach((m, i) => { m.position.x = (i === 2 ? -1.2 : 0) + vib * (1 + i * 0.5); });
        for (let i = 0; i < 30; i++) { s.wu[i] = (s.wu[i] + dt * 0.45) % 1; const u = s.wu[i], ring = Math.floor(i / 6), a = (i % 6) / 6 * Math.PI * 2, uu = (u + ring * 0.2) % 1; putDot(s.wave, i, V(-4.3 + uu * 2.55, 1.55 + Math.sin(a) * 0.12 * (1 + (1 - uu) * 2.4), Math.cos(a) * 0.12 * (1 + (1 - uu) * 2.4)), 0x7fc8ff, k > 0.02 ? 0.5 + k : 0.001); } flush(s.wave);
        for (let i = 0; i < 10; i++) { const u = (S.t * 0.5 + i / 10) % 1; putDot(s.imp, i, u < 0.55 ? s.cochC.getPointAt(u / 0.55) : V(-0.4 + (u - 0.55) / 0.45 * 1.9, 1.2 + (u - 0.55) / 0.45 * 0.7, 0.1), u < 0.55 ? 0x9fe7ff : 0xffe066, k > 0.02 ? 0.4 + k * 0.8 : 0.001); } flush(s.imp); },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["pinna", "canal", "drum", "eust", "oss", "canals", "oval", "coch", "nerve"], side: (id) => ["pinna", "canal", "drum", "eust"].includes(id) }); },
      hud: (s, c) => BA.focus.card(s, [{ title: "Hearing", lines: [["Outer ear → middle ear → inner ear", "#ffd27a", true], "Sound waves → eardrum vibrates → ossicles amplify → oval window → fluid in the cochlea → hair cells → auditory nerve → brain.", ["Loudness " + c.loud + " dB: " + (c.loud > 85 ? "long exposure damages the hair cells (deafness)." : c.loud < 5 ? "silence." : "safe level."), c.loud > 85 ? "#ff7b72" : "#5bd68c"], ["Semicircular canals: balance. Eustachian tube: equal pressure.", "#7cb3ff"]] }]),
      readouts: (s, c) => [["Loudness", c.loud + " dB"]],
    });
  })();

  /* =====================================================================
     R-a  Toad metamorphosis
     ===================================================================== */
  (function () {
    if (!MK.scenes["R-a"]) return;
    const ease = (x) => { const q = clamp(x, 0, 1); return q * q * (3 - 2 * q); };
    const toadSDF = (p) => { const tail = 1 - ease((p - 0.6) / 0.35), hind = ease((p - 0.22) / 0.22), fore = ease((p - 0.45) / 0.2), bw = 0.3 + 0.12 * p;
      return (x, y, z) => { const az = Math.abs(z), S = sd.smin; let d = sd.ell(x, y, z, 0, 0.3, 0, 0.42 + 0.08 * p, 0.26 - 0.03 * p, bw);
        d = S(d, sd.ell(x, y, z, 0.38, 0.32, 0, 0.22, 0.17, 0.2 + 0.06 * p), 0.14); d = S(d, sd.sph(x, y, az, 0.42, 0.46, 0.13 + 0.03 * p, 0.05 + 0.035 * p), 0.04);
        if (tail > 0.03) d = S(d, sd.smax(sd.cone(x, y, z, -0.35, 0.3, 0, -0.4 - 1.25 * tail, 0.3, 0, 0.2, 0.02), az - 0.07, 0.04), 0.14);
        if (hind > 0.03) { let l = sd.cone(x, y, az, -0.3, 0.24, bw * 0.7, -0.05 - 0.05 * hind, 0.12, bw + 0.2 * hind, 0.1 * hind, 0.06 * hind); l = S(l, sd.cone(x, y, az, -0.05 - 0.05 * hind, 0.12, bw + 0.2 * hind, -0.42 * hind, 0.05, bw + 0.24 * hind, 0.06 * hind, 0.04 * hind), 0.03); l = S(l, sd.ell(x, y, az, -0.28 * hind, 0.03, bw + 0.33 * hind, 0.16 * hind, 0.022, 0.07 * hind), 0.03); d = S(d, l, 0.05); }
        if (fore > 0.03) d = S(d, S(sd.cone(x, y, az, 0.24, 0.22, bw * 0.75, 0.32, 0.06, bw + 0.12 * fore, 0.06 * fore, 0.035 * fore), sd.ell(x, y, az, 0.38, 0.03, bw + 0.13 * fore, 0.08 * fore, 0.02, 0.06 * fore), 0.02), 0.04);
        return d; }; };
    const toadGeo = (step) => BA.cached("toad" + step, () => { const p = step / 16, tad = lin(0x3c4426), toad = lin(0x6b6a34), wart = lin(0x3a3418), belly = lin(0xe2dcb8);
      return BA.mesh(toadSDF(p), [-1.75, -0.02, -0.8, 0.72, 0.62, 0.8], 0.03, { color: (x, y, z, nx, ny) => { let c = mix3(tad, toad, p); c = mix3(c, wart, sst(0.55, 0.66, BK.fbm(x * 10, y * 10, z * 10)) * (0.3 + 0.6 * p)); return mix3(c, belly, sst(-0.3, -0.8, ny) * 0.9); } }); });
    BA.addMode("R-a", "toad", {
      label: "Toad metamorphosis", cam: [[1.6, 2.7, 6.8], [1.0, 1.25, 0]],
      make(S, s, c, g) { const T3 = T(); BA.stage(S, s, false);
        s.tm = new T3.Mesh(toadGeo(0), new T3.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, clearcoat: 0.7 })); s.tm.castShadow = true; s.tg = new T3.Group(); s.tg.add(s.tm); s.tg.position.set(0.4, 0.9, 0); s.tg.scale.setScalar(1.5); g.add(s.tg);
        s.eyes = [-1, 1].map((sdv) => { const e = new T3.Mesh(new T3.SphereGeometry(0.035, 10, 8), new T3.MeshBasicMaterial({ color: 0x050505 })); s.tg.add(e); e.userData.s = sdv; return e; });
        s.water = new T3.Mesh(new T3.CircleGeometry(5, 48), new T3.MeshPhysicalMaterial({ color: 0x2f6a5a, roughness: 0.06, clearcoat: 1, transparent: true, opacity: 0.82 })); s.water.rotation.x = -Math.PI / 2; s.water.position.y = 1.5; g.add(s.water);
        const bed = new T3.Mesh(new T3.CircleGeometry(5, 48), BK.mat.soil([5, 5])); bed.rotation.x = -Math.PI / 2; bed.position.y = 0.42; bed.receiveShadow = true; g.add(bed);
        const lm = BK.mat.leaf("#3f8a3a", "#9ccc7a"); for (let i = 0; i < 5; i++) { const pad = new T3.Mesh(new T3.CircleGeometry(0.42 + (i % 2) * 0.15, 20, 0.3, 5.7), lm); pad.rotation.x = -Math.PI / 2; pad.position.set(-2.4 + i * 1.2, 1.52, -1.6 + (i % 3) * 0.5); g.add(pad); }
        for (let i = 0; i < 9; i++) { const w = BK.grassTuft(lm, 6, 0.9, i + 3); w.position.set(-3 + i * 0.8, 0.42, -2.4 + (i % 2) * 0.4); g.add(w); }
        s.step = -1; },
      update(S, s, c, dt) { const prog = Math.min(1, c.day / 90 * (0.15 + 0.85 * c.thy)); s.prog = prog; const st = Math.round(prog * 16);
        if (st !== s.step) { s.step = st; s.tm.geometry = toadGeo(st); }
        const p = st / 16; s.eyes.forEach((e) => { e.position.set(0.47, 0.47 + 0.01 * p, e.userData.s * (0.15 + 0.045 * p)); e.scale.setScalar(0.8 + p); });
        const out = ease((prog - 0.8) / 0.2); s.tg.position.y = 0.95 + out * 0.5 + Math.sin(S.t * 1.3) * 0.04 * (1 - out); s.tg.rotation.y = Math.sin(S.t * 0.4) * 0.35; s.tg.rotation.z = Math.sin(S.t * 5) * 0.03 * (1 - out); s.tg.position.x = 0.2 + Math.sin(S.t * 0.25) * 0.5 * (1 - out); },
      overlay(ctx, s, c, S, B) { const p = s.prog || 0, t = s.tg.position; if (p < 0.6) BK.lab(S, B, t.x - 1.6, t.y + 0.4, 0, "Tail", "#e8f1ff", 0, -8, 10); if (p > 0.25) BK.lab(S, B, t.x - 0.3, t.y + 0.15, 0.7, "Hind leg", "#ffd27a", 6, 10, 10); if (p > 0.48) BK.lab(S, B, t.x + 0.5, t.y + 0.1, 0.6, "Fore leg", "#ffd27a", 8, 12, 10); },
    });
  })();

  /* =====================================================================
     Part 2: touch-ups applied to existing scenes right after they build
     ===================================================================== */
  /* run fn once each time the scene (re)builds its main group */
  let afterN = 0;
  const after = (key, fn) => { const sc = MK.scenes[key]; if (!sc) return; const up = sc.update, flag = "_pg" + afterN++; sc.update = function (S, s, c, dt) { up && up.call(sc, S, s, c, dt); if (s.g && s[flag] !== s.g) { s[flag] = s.g; try { fn(S, s, c); } catch (e) { console.error("upgrade " + key, e); } } }; sc.label = "Realistic 3D lab"; };
  const strip = (grp) => { while (grp.children.length) { const ch = grp.children[0]; grp.remove(ch); ch.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); } };

  /* ---- R-f: fuller hibiscus petals with veins, and leaves on the stalk ---- */
  let petalTex = null;
  const petalMap = () => { if (petalTex) return petalTex; const c = BK.cv(256, 512), g = c.getContext("2d"), gr = g.createLinearGradient(0, 512, 0, 0); gr.addColorStop(0, "#5a0a18"); gr.addColorStop(0.22, "#b8182c"); gr.addColorStop(0.7, "#e0354a"); gr.addColorStop(1, "#f2647a"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
    g.strokeStyle = "rgba(120,10,30,.38)"; for (let i = -9; i <= 9; i++) { g.lineWidth = 1.2; g.beginPath(); g.moveTo(128 + i * 3, 512); g.quadraticCurveTo(128 + i * 9, 300, 128 + i * 15, 0); g.stroke(); } petalTex = BK.tex(c); return petalTex; };
  const petalGeo2 = (len, wid) => { const g = new (T().PlaneGeometry)(wid, len, 12, 16), p = g.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i) + len / 2; const t = y / len, w = Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.86)), 0.7) * (0.35 + 0.65 * t); x *= w; p.setXYZ(i, x, y, -0.22 * t * t * len - Math.abs(x) * 0.18 + Math.sin(x * 9 + t * 4) * 0.035 * t); } g.computeVertexNormals(); return g; };
  after("R-f", (S, s, c) => { if (c.mode !== "insect" || !s.fl) return; const T3 = T(), pm = new T3.MeshStandardMaterial({ map: petalMap(), roughness: 0.62, side: T3.DoubleSide }), geo = petalGeo2(1.6, 1.45);
    s.fl.whorls[1].children.forEach((piv) => { const m = piv.children[0]; m.geometry.dispose(); m.geometry = geo; m.material = pm; });
    const lm = BK.mat.leaf("#3f8a3a", "#a8d47e"); [[-0.9, 0.6, 2.2], [-1.3, -0.5, 5.0]].forEach(([y, tilt, ry]) => { const piv = new T3.Group(); piv.position.y = y; piv.rotation.y = ry; const lf = BK.leaf(1.0, 0.62, lm, 0.3); lf.rotation.x = -1.1; piv.add(lf); s.fl.add(piv); }); });

  /* ---- R-e: a real caterpillar and chrysalis ---- */
  after("R-e", (S, s, c) => { if (c.sp !== "butterfly" || !s.cat) return; const T3 = T();
    s.cat.children.forEach((m) => { m.visible = false; });
    const geo = BA.cached("caterpillar", () => { const gr = lin(0x7ab83c), dk = lin(0x16240c), ye = lin(0xf2d83a); return BA.mesh((x, y, z) => { let d = 1e9; for (let i = 0; i < 11; i++) d = sd.smin(d, sd.ell(x, y, z, i * 0.13, 0, 0, 0.085, 0.105 - Math.abs(i - 5) * 0.004, 0.105 - Math.abs(i - 5) * 0.004), 0.03); d = sd.smin(d, sd.sph(x, y, z, 1.38, -0.01, 0, 0.085), 0.02); for (const i of [1, 2, 3, 5, 6, 7, 8, 10]) d = sd.smin(d, sd.cone(x, y, Math.abs(z), i * 0.13, -0.06, 0.05, i * 0.13, -0.15, 0.07, 0.03, 0.018), 0.015); return d; }, [-0.14, -0.2, -0.16, 1.5, 0.16, 0.16], 0.014, { color: (x, y, z) => { if (x > 1.32) return dk; const band = (x / 0.13 + 0.5) % 1; let col = mix3(gr, dk, (1 - sst(0.0, 0.1, Math.abs(band - 0.5))) * 0.85); col = mix3(col, ye, (1 - sst(0.02, 0.07, Math.abs(band - 0.32))) * 0.9 * (y > -0.03 ? 1 : 0)); return y < -0.07 ? mix3(col, dk, 0.4) : col; } }); });
    const m = new T3.Mesh(geo, new T3.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.45, clearcoat: 0.4 })); m.castShadow = true; s.cat.add(m);
    const pg = s.st[2], old = pg.children[0]; if (old) { old.visible = false; const ch = new T3.Mesh(BA.cached("chrysalis", () => BA.mesh((x, y, z) => { let d = sd.cone(x, y, z, 0, 0.36, 0, 0, -0.34, 0, 0.13, 0.03); d = sd.smin(d, sd.ell(x, y, z, 0, 0.2, 0.03, 0.15, 0.2, 0.16), 0.08); return d + 0.01 * Math.sin(y * 60); }, [-0.2, -0.4, -0.2, 0.2, 0.52, 0.24], 0.012, { color: (x, y, z) => mix3(lin(0x8fae4a), lin(0xd9c24a), sst(0.5, 0.9, 0.5 + 0.5 * Math.sin(y * 60)) * 0.5 + (y > 0.3 ? 0.4 : 0)) })), new T3.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.25, clearcoat: 1, iridescence: 0.5 })); ch.position.copy(old.position); ch.castShadow = true; pg.add(ch); const silk = new T3.Mesh(new T3.CylinderGeometry(0.006, 0.006, 0.25, 4), std({ color: 0xf2f2e6 })); silk.position.copy(old.position).add(V(0, 0.48, 0)); pg.add(silk); } });

  /* ---- A-b: organ, system and organism shown with the real models ---- */
  after("A-b", (S, s, c) => { if (c.mode !== "lvl" || !s.lv || s.lv.length < 5) return; const T3 = T();
    strip(s.lv[2]); const h = BA.heart({ simple: true }); h.scale.setScalar(0.42); h.position.y = -0.1; s.lv[2].add(h);
    strip(s.lv[3]); const net = BA.vessels(); net.group.scale.setScalar(0.6); net.group.position.y = -1.1; s.lv[3].add(net.group); net.group.step(0.016, 1); const h2 = BA.heart({ simple: true }); h2.scale.setScalar(0.08); h2.position.set(0.033, 0.27, 0.04); s.lv[3].add(h2); s.lvNet = net.group;
    strip(s.lv[4]); const b = BK.person(1.7, 0x3a6ad8); b.position.y = -0.85; s.lv[4].add(b); shadow(s.lv[2]); shadow(s.lv[4]); });
  (function () { const sc = MK.scenes["A-b"]; if (!sc) return; const up = sc.update; sc.update = function (S, s, c, dt) { up.call(sc, S, s, c, dt); if (c.mode === "lvl" && s.lvNet && s.lvNet.parent) s.lvNet.step(dt, 1); }; })();

  /* ---- R-b: a real arm for the reflex arc ---- */
  const armGeo = () => BA.cached("reflexArm", () => BA.mesh((x, y, z) => { let d = sd.cone(x, y, z, -1.7, 0.16, 0, -0.3, 0, 0, 0.27, 0.2); d = sd.smin(d, sd.cone(x, y, z, -0.3, 0, 0, 1.15, 0.04, 0, 0.2, 0.12), 0.08); d = sd.smin(d, sd.ell(x, y, z, 1.42, 0.05, 0, 0.24, 0.075, 0.16), 0.06);
    for (let i = 0; i < 4; i++) d = sd.smin(d, sd.cone(x, y, z, 1.6, 0.05, -0.12 + i * 0.08, 1.95 - Math.abs(i - 1.5) * 0.05, 0.03, -0.15 + i * 0.1, 0.04, 0.03), 0.02); return sd.smin(d, sd.cone(x, y, z, 1.35, 0.05, 0.14, 1.6, 0.06, 0.3, 0.05, 0.035), 0.03); }, [-2.0, -0.3, -0.36, 2.05, 0.46, 0.4], 0.028));
  after("R-b", (S, s, c) => { if (c.mode !== "reflex") return; const T3 = T(), cap = s.g.children.find((m) => m.isMesh && m.geometry.type === "CapsuleGeometry" && m.geometry.parameters.radius > 0.25); if (!cap) return;
    cap.visible = false; const arm = new T3.Mesh(armGeo(), BK.mat.skin(0x8d5a3b)); arm.scale.setScalar(0.82); arm.position.copy(cap.position).add(V(-0.1, 0, 0)); arm.rotation.z = cap.rotation.z - Math.PI / 2; arm.castShadow = true; s.g.add(arm); });

  /* ---- S-g: skin block with a living surface, fat lobules, oil glands and a nerve ---- */
  after("S-g", (S, s, c) => { const T3 = T(), g = s.g, boxes = g.children.filter((m) => m.isMesh && m.geometry.type === "BoxGeometry" && m.geometry.parameters.width === 4); if (boxes.length < 4) return;
    const top = boxes[0], geo = new T3.BoxGeometry(4, 0.25, 2.6, 60, 1, 40), p = geo.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setY(i, p.getY(i) + (BK.fbm(p.getX(i) * 2.2, 0, p.getZ(i) * 2.2) - 0.5) * 0.09 + (BK.noise3(p.getX(i) * 16, 1, p.getZ(i) * 16) - 0.5) * 0.02); geo.computeVertexNormals(); top.geometry.dispose(); top.geometry = geo; top.material = BK.mat.skin(0x8d5a3b); top.material.roughness = 0.62;
    const fat = boxes[3]; fat.material.opacity = 0.35; fat.material.transparent = true; fat.material.depthWrite = false; const rr = BK.rng(12), lob = new T3.InstancedMesh(new T3.SphereGeometry(0.2, 12, 9), new T3.MeshPhysicalMaterial({ color: 0xf0cf6a, roughness: 0.35, clearcoat: 0.5 }), 90), m4 = new T3.Matrix4();
    for (let i = 0; i < 90; i++) { const k = 0.7 + rr() * 0.6; m4.makeScale(k, k * 0.85, k); m4.setPosition(-1.8 + rr() * 3.6, -0.02 + rr() * 0.42, -1.1 + rr() * 2.2); lob.setMatrixAt(i, m4); } g.add(lob);
    (s.hairs || []).forEach((hg) => { const sg = new T3.Mesh(BK.blob(0.11, 6, 0.25, 12), new T3.MeshPhysicalMaterial({ color: 0xe8c04a, roughness: 0.4, clearcoat: 0.4 })); sg.position.set(hg.position.x - 0.16, 1.28, hg.position.z); g.add(sg); });
    const nv = BA.tube(BA.curve([[-2, 0.62, 0.9], [-1, 0.78, 0.8], [0.2, 0.7, 0.95], [0.9, 1.0, 0.9], [1.0, 1.42, 0.9]]), 0.03, std({ color: TIS.nerve, roughness: 0.5 }), { seg: 40, rs: 8 }); g.add(nv); const end = new T3.Mesh(new T3.SphereGeometry(0.07, 12, 10), std({ color: TIS.nerve, roughness: 0.5 })); end.scale.set(1, 1.5, 1); end.position.set(1.0, 1.46, 0.9); g.add(end); });
  (function () { const sc = MK.scenes["S-g"]; if (!sc) return; const ov = sc.overlay; sc.overlay = function (ctx, s, c, S, B) { ov && ov.call(sc, ctx, s, c, S, B); BK.lab(S, B, 1.0, 1.46, 0.95, "Nerve ending", "#ffe066", 8, -10, 10); BK.lab(S, B, 0.4, 0.2, 1.3, "Fat (insulation)", "#f0cf6a", 8, 8, 10); }; })();

  /* ---- S-e: leaf epidermis with jigsaw cells and chloroplasts in the guard cells ---- */
  let epiTex = null;
  const epiMap = () => { if (epiTex) return epiTex; const c = BK.cv(512, 512), g = c.getContext("2d"), rr = BK.rng(8); g.fillStyle = "#7fb866"; g.fillRect(0, 0, 512, 512);
    const pts = []; for (let i = 0; i < 70; i++) pts.push([rr() * 512, rr() * 512]);
    const im = g.getImageData(0, 0, 512, 512), d = im.data; for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) { let a = 1e9, b = 1e9; const wx = x + Math.sin(y * 0.09) * 9, wy = y + Math.sin(x * 0.08) * 9; for (const q of pts) { let dx = Math.abs(wx - q[0]), dy = Math.abs(wy - q[1]); dx = Math.min(dx, 512 - dx); dy = Math.min(dy, 512 - dy); const dd = dx * dx + dy * dy; if (dd < a) { b = a; a = dd; } else if (dd < b) b = dd; } const e = Math.sqrt(b) - Math.sqrt(a), k = e < 3.5 ? 0.55 : 1 + (rr() - 0.5) * 0.05, i = (y * 512 + x) * 4; d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; } g.putImageData(im, 0, 0); epiTex = BK.tex(c, [2, 1]); return epiTex; };
  after("S-e", (S, s, c) => { if (c.mode !== "stom" || !s.guards) return; const T3 = T(), leaf = s.g.children.find((m) => m.isMesh && m.geometry.type === "BoxGeometry"); if (leaf) leaf.material = new T3.MeshPhysicalMaterial({ map: epiMap(), roughness: 0.45, clearcoat: 0.3 });
    const cm = new T3.MeshPhysicalMaterial({ color: 0x1f7a2a, roughness: 0.4, clearcoat: 0.5 }); s.guards.forEach((gg) => gg.children.forEach((gc) => { if (!gc.isMesh) return; for (let i = 0; i < 7; i++) { const a = 0.3 + i * 0.42, ch = new T3.Mesh(new T3.SphereGeometry(0.045, 8, 6), cm); ch.scale.set(1.5, 1, 0.8); ch.position.set(Math.cos(a) * 0.34, Math.sin(a) * 0.34, 0.12); gc.add(ch); } })); });

  /* ---- A-e: plant cells with a visible cellulose wall ---- */
  after("A-e", (S, s, c) => { if (c.mode !== "plas") return; const T3 = T(); s.g.children.filter((m) => m.isMesh && m.geometry.type === "BoxGeometry" && m.geometry.parameters.width === 2).forEach((w) => { const ed = new T3.LineSegments(new T3.EdgesGeometry(w.geometry), new T3.LineBasicMaterial({ color: 0x3f7a2a })); w.add(ed); const fr = new T3.Mesh(new T3.BoxGeometry(2.06, 1.46, 1.46), new T3.MeshPhysicalMaterial({ color: 0x8fc46a, roughness: 0.5, transparent: true, opacity: 0.16, depthWrite: false, side: T3.BackSide })); w.add(fr); }); });

  /* ---- B-c: yam as boiled slices ---- */
  after("B-c", (S, s, c) => { const y = s.items && s.items.yam; if (!y) return; const T3 = T(); let i = 0; y.traverse((p) => { if (!p.isMesh || p.geometry.type !== "BoxGeometry") return; p.geometry.dispose(); p.geometry = new T3.CylinderGeometry(0.27, 0.27, 0.16, 24); p.material = [std({ color: 0x8a6a48, roughness: 0.9 }), std({ color: 0xf6eed6, roughness: 0.8 }), std({ color: 0xf6eed6, roughness: 0.8 })]; p.rotation.set(0.25 * (i - 1), i, 0.2); p.position.y = 0.1 + i * 0.07; i++; }); });

  /* =====================================================================
     Part 3: fruits, wild animals, dividing cells, food, starch test, factory and pyramids
     ===================================================================== */
  /* ---- R-g: seed dispersal props ---- */
  after("R-g", (S, s, c) => { const T3 = T(), g = s.g;
    if (c.mode === "wind") { const pole = g.children.find((m) => m.isMesh && m.geometry.type === "CylinderGeometry" && m.material.map); if (pole) { const hgt = pole.geometry.parameters.height, x = pole.position.x; pole.material = new T3.MeshPhysicalMaterial({ color: 0x5f9a3c, roughness: 0.5 }); pole.scale.set(0.45, 1, 0.45);
        const head = new T3.Mesh(new T3.SphereGeometry(0.2, 16, 12), std({ color: 0x8a7a4a, roughness: 0.9 })); head.scale.set(1, 0.6, 1); head.position.set(x, hgt, 0); g.add(head);
        const fl = new T3.InstancedMesh(new T3.CylinderGeometry(0.004, 0.004, 0.36, 3), std({ color: 0xffffff, roughness: 0.6 }), 90), m4 = new T3.Matrix4(), q = new T3.Quaternion(), rr = BK.rng(3); for (let i = 0; i < 90; i++) { const d = V(rr() - 0.5, rr() * 0.9 + 0.05, rr() - 0.5).normalize(); q.setFromUnitVectors(V(0, 1, 0), d); m4.compose(V(x, hgt, 0).addScaledVector(d, 0.3), q, V(1, 1, 1)); fl.setMatrixAt(i, m4); } g.add(fl);
        const lm = BK.mat.leaf("#3f8a3a", "#a8d47e"); for (let i = 0; i < 5; i++) { const piv = new T3.Group(); piv.position.set(x, 0.02, 0); piv.rotation.y = i * 1.26; const lf = BK.leaf(0.75, 0.3, lm, 0.35); lf.rotation.x = -1.25; piv.add(lf); g.add(piv); } } }
    if (c.mode === "expl" && s.pod) { const pm = new T3.MeshStandardMaterial({ map: (() => { const cv = BK.cv(128, 64), q = cv.getContext("2d"); q.fillStyle = "#8a6a2c"; q.fillRect(0, 0, 128, 64); for (let i = 0; i < 300; i++) { q.strokeStyle = `rgba(${60 + Math.random() * 60},${40 + Math.random() * 40},10,.4)`; q.beginPath(); const y = Math.random() * 64; q.moveTo(0, y); q.lineTo(128, y + (Math.random() - 0.5) * 8); q.stroke(); } return BK.tex(cv); })(), roughness: 0.75, side: T3.DoubleSide });
      s.pod.children.forEach((h) => { if (!h.isMesh) return; h.material = pm; h.scale.set(3.0, 0.62, 0.55); }); const stalk = BA.tube(BA.curve([[-1.25, 0, 0], [-1.7, 0.25, 0], [-2.3, 0.35, 0]]), 0.035, std({ color: 0x5a6a2a, roughness: 0.8 }), { seg: 10, rs: 6 }); s.pod.add(stalk); const lm = BK.mat.leaf("#4f8a3a", "#a8d47e"); for (const sdv of [-1, 1]) { const lf = BK.leaf(0.7, 0.3, lm, 0.2); lf.position.set(-2.1, 0.33, 0); lf.rotation.set(0.3, 0, sdv * 1.1 + 1.57); s.pod.add(lf); } }
    if (c.mode === "water" && s.nut) { s.nut.material = new T3.MeshStandardMaterial({ map: (() => { const cv = BK.cv(256, 256), q = cv.getContext("2d"); q.fillStyle = "#7a5a30"; q.fillRect(0, 0, 256, 256); for (let i = 0; i < 1400; i++) { q.strokeStyle = `rgba(${90 + Math.random() * 90},${60 + Math.random() * 60},${20 + Math.random() * 30},.55)`; q.lineWidth = 1 + Math.random(); const x = Math.random() * 256; q.beginPath(); q.moveTo(x, 0); q.bezierCurveTo(x + 8, 90, x - 8, 170, x + 4, 256); q.stroke(); } return BK.tex(cv, [2, 1]); })(), roughness: 0.95 });
      const isl = new T3.Mesh(new T3.SphereGeometry(3.2, 40, 16, 0, Math.PI * 2, 0, 0.5), std({ color: 0xe6d3a0, roughness: 1 })); isl.position.set(-5.6, -2.55, -4.5); isl.receiveShadow = true; g.add(isl); const pa = BA.farm.palm(3.6, 4); pa.position.set(-5.4, 0.35, -4.6); pa.rotation.z = -0.12; g.add(pa); const p2 = BA.farm.palm(2.8, 9); p2.position.set(-6.6, 0.3, -4.0); g.add(p2); } });

  /* ---- population scenes: animals instead of capsules ---- */
  const herdGeo = (kind, col, size) => BA.cached("herd" + kind + col, () => { const g = BA.quad(1, col, { kind }).children[0].geometry.clone(); g.scale(size, size, size); g.translate(0, -0.12, 0); g.rotateZ(-Math.PI / 2); return g; });
  ["C-i", "GH4-b"].forEach((key) => after(key, (S, s, c) => { s.g.traverse((m) => { if (!m.isInstancedMesh || m.geometry.type !== "CapsuleGeometry") return; const pred = m.geometry.parameters.radius > 0.1; m.geometry = herdGeo(pred ? "fox" : "antelope", pred ? 0xc8602a : 0xb89a7a, pred ? 0.5 : 0.36); m.material = vstd({ roughness: 0.8 }); m.castShadow = true; }); }));

  /* ---- A-k / GH2-d: a living cell around the chromosomes ---- */
  ["A-k", "GH2-d"].forEach((key) => after(key, (S, s, c) => { if (!s.mem) return; const T3 = T(), rr = BK.rng(21), g = s.g;
    s.mem.material = new T3.MeshPhysicalMaterial({ color: c.mode === "bud" ? 0xf3d9a0 : 0x9fd0ea, roughness: 0.12, transparent: true, opacity: 0.3, clearcoat: 1, sheen: 1, sheenColor: new T3.Color(0xffffff), side: T3.DoubleSide, depthWrite: false });
    const mito = new T3.InstancedMesh(new T3.CapsuleGeometry(0.055, 0.16, 4, 8), new T3.MeshPhysicalMaterial({ color: 0xe8884a, roughness: 0.4, clearcoat: 0.5, transparent: true, opacity: 0.85 }), 16), m4 = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler();
    for (let i = 0; i < 16; i++) { const d = V(rr() - 0.5, rr() - 0.5, rr() - 0.5).normalize().multiplyScalar(1.05 + rr() * 0.45); m4.compose(d, q.setFromEuler(e.set(rr() * 3, rr() * 3, rr() * 3)), V(1, 1, 1)); mito.setMatrixAt(i, m4); } g.add(mito);
    const er = new T3.MeshPhysicalMaterial({ color: 0x7fb8d8, roughness: 0.4, transparent: true, opacity: 0.4, depthWrite: false }); for (let i = 0; i < 5; i++) { const a = i * 1.26, pts = []; for (let j = 0; j <= 10; j++) { const u = j / 10; pts.push([Math.cos(a + u * 0.9) * (1.2 + Math.sin(u * 9 + i) * 0.12), -0.5 + u + Math.sin(u * 7 + i) * 0.1, Math.sin(a + u * 0.9) * (1.2 + Math.cos(u * 8) * 0.12)]); } g.add(BA.tube(BA.curve(pts), 0.03, er, { seg: 30, rs: 6 })); } }));

  /* ---- food: beans, leafy vegetables and tomatoes with stalks ---- */
  after("B-c", (S, s, c) => { const T3 = T(), it = s.items || {}, rr = BK.rng(6), swap = (holder, make) => { if (!holder) return; const inner = holder.children[0] || holder; const keep = inner.children && inner.children.length ? inner : holder; keep.children.slice().forEach((ch) => { ch.visible = false; }); if (keep.isMesh) { keep.material = keep.material.clone(); keep.material.visible = false; } keep.add(make()); };
    swap(it.beans, () => { const im = new T3.InstancedMesh(new T3.SphereGeometry(0.07, 10, 8), new T3.MeshPhysicalMaterial({ color: 0x8a4a2a, roughness: 0.45, clearcoat: 0.4 }), 70), m4 = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler(); for (let i = 0; i < 70; i++) { const r = Math.sqrt(rr()) * 0.42, a = rr() * 6.3; m4.compose(V(Math.cos(a) * r, 0.05 + (0.42 - r) * 0.35 * rr() + 0.02, Math.sin(a) * r), q.setFromEuler(e.set(rr() * 3, rr() * 3, 0)), V(1.5, 0.8, 0.9)); im.setMatrixAt(i, m4); } im.castShadow = true; return im; });
    swap(it.veg, () => { const gr = new T3.Group(), lm = BK.mat.leaf("#2f7a2a", "#7fbf5a"); for (let i = 0; i < 12; i++) { const lf = BK.leaf(0.42 + rr() * 0.2, 0.26, lm, 0.5); lf.rotation.set(-1.3 + rr() * 0.5, rr() * 6.3, 0); lf.position.set((rr() - 0.5) * 0.4, 0.05 + rr() * 0.12, (rr() - 0.5) * 0.4); gr.add(lf); } return gr; }); });
  after("C-j", (S, s, c) => { const T3 = T(); (s.toms || []).forEach((tm) => { const st = new T3.Mesh(new T3.CylinderGeometry(0.012, 0.016, 0.1, 5), std({ color: 0x3f6a2a })); st.position.y = 0.3; tm.add(st); for (let i = 0; i < 5; i++) { const sp = new T3.Mesh(new T3.ConeGeometry(0.03, 0.14, 4), std({ color: 0x3f7a2a, roughness: 0.7 })); sp.position.set(Math.cos(i * 1.257) * 0.06, 0.265, Math.sin(i * 1.257) * 0.06); sp.rotation.set(Math.sin(i * 1.257) * 1.35, 0, -Math.cos(i * 1.257) * 1.35); tm.add(sp); } }); });

  /* ---- B-a: starch test on a white tile with an iodine dropper bottle ---- */
  after("B-a", (S, s, c) => { if (c.mode !== "starch" || !s.leaf) return; const T3 = T(), g = s.g, lp = s.leaf.position;
    const tile = new T3.Mesh(new T3.BoxGeometry(3.6, 0.07, 2.6), window.P3D.mat.ceramic(0xf7f7f2)); tile.position.set(lp.x, Math.max(0.035, lp.y - 0.08), lp.z); tile.receiveShadow = true; g.add(tile);
    const pet = BA.tube(BA.curve([[0, 0, 0], [0, -0.3, 0.02], [0.05, -0.6, 0.0]]), 0.03, std({ color: 0x6f9a3c, roughness: 0.6 }), { seg: 8, rs: 6 }); s.leaf.add(pet);
    const bt = new T3.Group(); const body = new T3.Mesh(new T3.CylinderGeometry(0.2, 0.22, 0.55, 20), new T3.MeshPhysicalMaterial({ color: 0x6a3a12, roughness: 0.15, transparent: true, opacity: 0.8, clearcoat: 1 })); body.position.y = 0.28; const neck = new T3.Mesh(new T3.CylinderGeometry(0.08, 0.1, 0.14, 14), body.material); neck.position.y = 0.62; const cap = new T3.Mesh(new T3.SphereGeometry(0.1, 14, 10), std({ color: 0x1c1c1c, roughness: 0.6 })); cap.scale.y = 1.5; cap.position.y = 0.78; bt.add(body, neck, cap); bt.position.set(lp.x + 2.3, 0, lp.z - 0.5); g.add(shadow(bt)); s.iodine = bt; });
  (function () { const sc = MK.scenes["B-a"]; if (!sc) return; const ov = sc.overlay; sc.overlay = function (ctx, s, c, S, B) { ov && ov.call(sc, ctx, s, c, S, B); if (c.mode === "starch" && s.iodine && s.iodine.parent) BK.lab(S, B, s.iodine.position.x, 1.05, s.iodine.position.z, "Iodine solution", "#ffd27a", 0, -6, 10); }; })();

  /* ---- C-g: a factory that looks like one ---- */
  after("C-g", (S, s, c) => { const T3 = T(), g = s.g, fac = g.children.find((m) => m.isMesh && m.geometry.type === "BoxGeometry" && m.geometry.parameters.width === 1.8); if (!fac) return; const F = BA.farm, p = fac.position;
    fac.material = F.mudMat(); fac.material.color.setHex(0xc9c2b8);
    for (let i = 0; i < 3; i++) { const sh = new T3.Shape(); sh.moveTo(0, 0); sh.lineTo(0.6, 0); sh.lineTo(0, 0.34); sh.closePath(); const r = new T3.Mesh(new T3.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false }), F.roofMat()); r.position.set(p.x - 0.9 + i * 0.6, p.y + 0.6, p.z - 0.6); g.add(r); }
    const wm = new T3.MeshStandardMaterial({ color: 0x9fd0ea, emissive: 0x2a4a6a, emissiveIntensity: 0.4, roughness: 0.2 }); for (let i = 0; i < 4; i++) { const w = new T3.Mesh(new T3.BoxGeometry(0.26, 0.22, 0.03), wm); w.position.set(p.x - 0.66 + i * 0.44, p.y + 0.22, p.z + 0.61); g.add(w); }
    const door = new T3.Mesh(new T3.BoxGeometry(0.42, 0.6, 0.03), std({ color: 0x3a4250, metalness: 0.4, roughness: 0.5 })); door.position.set(p.x + 0.5, 0.3, p.z + 0.61); g.add(door);
    if (s.chim) { s.chim.material = F.mudMat(); s.chim.material.color.setHex(0xb85a44); for (const y of [0.7, 1.0]) { const band = new T3.Mesh(new T3.TorusGeometry(0.17, 0.025, 6, 20), std({ color: 0xf2f2f2 })); band.rotation.x = Math.PI / 2; band.position.set(s.chim.position.x, s.chim.position.y + y, s.chim.position.z); g.add(band); } }
    const tank = new T3.Mesh(new T3.CylinderGeometry(0.32, 0.32, 0.8, 20), std({ color: 0x8a949e, metalness: 0.6, roughness: 0.4 })); tank.position.set(p.x - 1.35, 0.4, p.z + 0.2); g.add(tank); g.add(BA.tube(BA.curve([[p.x - 1.35, 0.8, p.z + 0.2], [p.x - 1.35, 1.0, p.z + 0.1], [p.x - 0.95, 1.0, p.z]]), 0.04, std({ color: 0x8a949e, metalness: 0.6, roughness: 0.4 }), { seg: 12, rs: 8 })); shadow(g); });

  /* ---- C-d: living things on each step of the pyramid ---- */
  after("C-d", (S, s, c) => { const T3 = T(), g = s.g, bars = g.children.filter((m) => m.isMesh && m.geometry.type === "BoxGeometry").sort((a, b) => a.position.y - b.position.y); if (bars.length < 3) return; const rr = BK.rng(4), gm = BK.mat.leaf("#5f9a3a", "#9ccc7a");
    bars.forEach((b, i) => { const P = b.geometry.parameters, w = P.width * b.scale.x, d = P.depth * b.scale.z, top = b.position.y + P.height * b.scale.y / 2, n = [7, 4, 2, 1][Math.min(3, i)];
      for (let k = 0; k < n; k++) { const x = b.position.x + (n === 1 ? 0 : (k / (n - 1) - 0.5) * w * 0.8), z = b.position.z + d * 0.5 - 0.12 - rr() * Math.min(0.3, d * 0.3); let o;
        if (i === 0) o = BK.grassTuft(gm, 7, 0.3, k + 2); else if (i === 1) o = BK.insect(0.3, 0x5a9a2a); else if (i === 2) o = BK.frog(0.42); else o = BK.bird(0.5, 0x5a3a1a);
        o.position.set(x, top + (i === 1 ? 0.07 : i === 3 ? 0.16 : 0), z); o.rotation.y = i === 0 ? rr() * 6 : -0.6 + rr() * 0.5; b.parent.add(o); } }); });
})();
