/* agric-round3.js — third redesign round for the Agricultural Science lab (loads after agric-round2.js).
   1. Farm machinery rebuilt to real-machine anatomy: lugged tyres on dished rims, two-tone tractor with glass cab,
      roof lamps, exhaust stack, mudguards, steps and a full three-point linkage; implements built as box-section
      frames carrying repeated working units (disc plough, disc harrow, mouldboard plough, ridger, planter, boom
      sprayer, spring-tine cultivator, slasher, root lifter, tipping trailer); combine harvester and bulldozer.
   2. Farmland greenery: ground in several greens with dry patches, a tree line round every outdoor plot and
      distance haze.
   3. The remaining pests (tick, mite, snail, rat, worm, mealybug, whitefly, bird) and small tools (watering can,
      trowel, hand fork, dibber, secateurs, shears, knives).
   Machines are generic teaching models: proportions are typical values, no maker's design is copied.
   Everything is generated in code. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, AK = window.AK, GK = window.GK;
  if (!MK || !BK || !AK || !GK) return;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const cache = {}, once = (k, f) => cache[k] || (cache[k] = f());
  const M = (geo, mat, x = 0, y = 0, z = 0) => { const m = new (T().Mesh)(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };
  const box = (w, h, d, mat, x, y, z) => M(new (T().BoxGeometry)(w, h, d), mat, x, y, z);
  const cyl = (r0, r1, h, mat, x, y, z, seg = 14) => M(new (T().CylinderGeometry)(r0, r1, h, seg), mat, x, y, z);
  const rot = (m, rx, ry, rz) => { m.rotation.set(rx || 0, ry || 0, rz || 0); return m; };
  const grp = (x, y, z, ...kids) => { const g = new (T().Group)(); g.position.set(x, y, z); kids.forEach((k) => k && g.add(k)); return g; };
  /* a named part sits at its own centre and carries a pull-apart offset */
  const part = (g, obj, name, ex) => { obj.name = name; obj.userData.home = obj.position.clone(); obj.userData.ex = V(...(ex || [0, 0, 0])); g.add(obj); (g.parts = g.parts || []).push(obj); return obj; };
  /* a bar between two points (square or round) */
  const bar = (a, b, th, mat, round) => { const T3 = T(), A = V(...a), B = V(...b), L = A.distanceTo(B), m = M(round ? new T3.CylinderGeometry(th, th, L, 10) : new T3.BoxGeometry(th, L, th), mat); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), B.clone().sub(A).normalize()); return m; };
  const tube = (pts, r, mat, seg = 20) => M(new (T().TubeGeometry)(new (T().CatmullRomCurve3)(pts.map((p) => V(...p))), seg, r, 7, false), mat);
  const mergeGeos = (list) => { const T3 = T(), pos = [], nor = [], uv = []; list.forEach((g0) => { const g = g0.index ? g0.toNonIndexed() : g0; pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); if (g.attributes.uv) uv.push(...g.attributes.uv.array); else for (let i = 0; i < g.attributes.position.count; i++) uv.push(0, 0); }); const o = new T3.BufferGeometry(); o.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); o.setAttribute("normal", new T3.Float32BufferAttribute(nor, 3)); o.setAttribute("uv", new T3.Float32BufferAttribute(uv, 2)); return o; };

  /* ---------- materials ---------- */
  const paint = (col) => AK.phys(col, { roughness: 0.36, clearcoat: 0.8, clearcoatRoughness: 0.25 });
  const satin = () => AK.std(0x1b1d20, { roughness: 0.55, metalness: 0.35 });
  const rubber = () => once("rub", () => new (T().MeshStandardMaterial)({ color: 0x17171a, roughness: 0.92, side: T().DoubleSide }));
  const polished = () => once("pol", () => new (T().MeshStandardMaterial)({ color: 0xdfe3e6, roughness: 0.2, metalness: 0.95, side: T().DoubleSide }));
  const zinc = () => AK.std(0xb9bec4, { roughness: 0.4, metalness: 0.8 });
  const glassM = () => once("gl", () => new (T().MeshPhysicalMaterial)({ color: 0xbfe6dc, roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.3, depthWrite: false, side: T().DoubleSide }));
  const lampM = (col = 0xfff6d8, e = 0.7) => AK.std(col, { emissive: col, emissiveIntensity: e, roughness: 0.2 });
  const polymer = () => AK.phys(0xf1f1ea, { roughness: 0.35, transparent: true, opacity: 0.92 });
  const rrect = (w, h, r) => { const T3 = T(), s = new T3.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
  const rbox = (w, h, d, r) => { const T3 = T(), g = new T3.ExtrudeGeometry(rrect(w, h, r), { depth: Math.max(0.001, d - r), bevelEnabled: true, bevelSize: r * 0.5, bevelThickness: r * 0.5, bevelSegments: 3, curveSegments: 6 }); g.translate(0, 0, -(d - r) / 2); return g; };
  const rb = (w, h, d, r, mat, x, y, z) => M(rbox(w, h, d, r), mat, x, y, z);
  /* side profile [[x,y]...] extruded across the machine (z), centred */
  const prof = (pts, depth, bev = 0.02) => { const T3 = T(), s = new T3.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); const g = new T3.ExtrudeGeometry(s, { depth: depth - 2 * bev, bevelEnabled: bev > 0, bevelSize: bev, bevelThickness: bev, bevelSegments: 2 }); g.translate(0, 0, -(depth - 2 * bev) / 2); return g; };

  /* ================= 1. wheels: lathe-turned carcass, chevron lugs, dished rim with wheel nuts ================= */
  const tyreGeo = (r, w) => once("ty" + r.toFixed(3) + "_" + w.toFixed(3), () => {
    const T3 = T(), hw = w / 2, P = [[0.56, -0.8], [0.62, -0.93], [0.8, -1], [0.91, -0.95], [0.955, -0.8], [0.965, 0], [0.955, 0.8], [0.91, 0.95], [0.8, 1], [0.62, 0.93], [0.56, 0.8]];
    const lg = new T3.LatheGeometry(P.map(([a, b]) => new T3.Vector2(a * r, b * hw)), 40); lg.rotateX(Math.PI / 2);
    const gs = [lg];
    if (r >= 0.24) { const n = r > 0.5 ? 22 : 18, m4 = new T3.Matrix4(), ph = 0.72; for (const s of [-1, 1]) for (let i = 0; i < n; i++) { const a = ((i + (s > 0 ? 0.5 : 0)) / n) * 6.2832, rad = V(Math.cos(a), Math.sin(a), 0), tan = V(-Math.sin(a), Math.cos(a), 0), L = V(0, 0, s * Math.cos(ph)).addScaledVector(tan, -Math.sin(ph)).normalize(), Z = L.clone().cross(rad); const b = new T3.BoxGeometry(w * 0.66, r * 0.085, r * 0.085); m4.makeBasis(L, rad, Z); m4.setPosition(rad.clone().multiplyScalar(r * 0.985).add(V(0, 0, s * w * 0.235))); b.applyMatrix4(m4); gs.push(b); } }
    else for (const z of [-0.5, 0, 0.5]) { const t = new T3.TorusGeometry(r * 0.97, r * 0.03, 5, 28); t.translate(0, 0, z * hw); gs.push(t); }
    return mergeGeos(gs);
  });
  const rimGeo = (r, w) => once("rm" + r.toFixed(3) + "_" + w.toFixed(3), () => {
    const T3 = T(), hw = w / 2, P = [[0.0, 0.3], [0.2, 0.3], [0.24, 0.2], [0.44, 0.34], [0.52, 0.7], [0.57, 0.8], [0.6, 0.8]], gs = [];
    for (const s of [-1, 1]) { const lg = new T3.LatheGeometry(P.map(([a, b]) => new T3.Vector2(a * r, b * hw * s)), 28); lg.rotateX(Math.PI / 2); gs.push(lg); }
    return mergeGeos(gs);
  });
  const nutGeo = (r, w) => once("nt" + r.toFixed(3) + "_" + w.toFixed(3), () => { const T3 = T(), gs = [], hw = w / 2; for (const s of [-1, 1]) { const hub = new T3.CylinderGeometry(r * 0.13, r * 0.15, hw * 0.16, 12); hub.rotateX(Math.PI / 2); hub.translate(0, 0, s * hw * 0.36); gs.push(hub); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.2832, n = new T3.CylinderGeometry(r * 0.022, r * 0.022, hw * 0.1, 6); n.rotateX(Math.PI / 2); n.translate(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2, s * hw * 0.32); gs.push(n); } } return mergeGeos(gs); });
  const wheel0 = AK.wheel;
  AK.wheel = (r = 0.5, w = 0.3, rim = 0xd9dcde) => {
    try {
      const T3 = T(), g = new T3.Group();
      g.add(M(tyreGeo(r, w), rubber()));
      g.add(M(rimGeo(r, w), once("rimM" + rim, () => new T3.MeshPhysicalMaterial({ color: rim, roughness: 0.4, metalness: 0.35, clearcoat: 0.5, side: T3.DoubleSide }))));
      g.add(M(nutGeo(r, w), AK.std(0x2a2c30, { roughness: 0.45, metalness: 0.7 })));
      return g;
    } catch (e) { console.error("agric-round3 wheel: " + e.message); return wheel0(r, w, rim); }
  };

  /* ================= 2. tractor (faces +x; typical mid-size four-wheel-drive proportions) ================= */
  const tractor0 = AK.tractor;
  const tractor = (col) => {
    const T3 = T(), g = new T3.Group(), body = paint(col), dark = satin(), steel = zinc(), gl = glassM(), white = AK.std(0xf2f2ee, { roughness: 0.5 });
    const RR = 0.6, RW = 0.36, FR = 0.45, FW = 0.27, RX = -0.45, FX = 1.1, RZ = 0.6, FZ = 0.55;
    /* chassis, engine block, transmission and rear axle housing (satin black, below the paint line) */
    part(g, grp(0.35, 0.7, 0, rb(1.9, 0.26, 0.34, 0.05, dark, 0, -0.05, 0), rb(0.62, 0.36, 0.4, 0.05, AK.std(0x34373c, { roughness: 0.5, metalness: 0.5 }), 0.4, 0.2, 0), rb(0.5, 0.34, 0.44, 0.06, dark, -0.55, 0.02, 0), rot(cyl(0.085, 0.085, 1.0, dark, -0.8, -0.1, 0, 12), Math.PI / 2), rot(cyl(0.06, 0.06, 0.95, dark, 0.75, -0.25, 0, 10), Math.PI / 2), rot(cyl(0.11, 0.11, 0.12, dark, 0.75, -0.25, 0, 12), 0, 0, Math.PI / 2)), "Engine and gearbox", [0, -0.45, 0.95]);
    /* bonnet: tapers forward and down; stripe and side vents */
    const bon = M(prof([[-0.66, -0.26], [0.64, -0.26], [0.68, -0.2], [0.68, 0.06], [0.58, 0.15], [-0.66, 0.29]], 0.54, 0.035), body, 0.74, 1.2, 0);
    bon.add(M(new T3.BoxGeometry(1.05, 0.045, 0.548), white, -0.1, 0.0, 0)); for (const s of [-1, 1]) for (let i = 0; i < 4; i++) bon.add(M(new T3.BoxGeometry(0.035, 0.12, 0.01), dark, 0.2 + i * 0.07, -0.13, s * 0.272));
    part(g, bon, "Engine bonnet", [0.35, 0.55, 0]);
    const gr = grp(1.435, 1.13, 0, rb(0.03, 0.3, 0.44, 0.012, AK.std(0x15171a, { roughness: 0.45, metalness: 0.6 }), 0, 0, 0)); for (let i = 0; i < 6; i++) gr.add(M(new T3.BoxGeometry(0.014, 0.018, 0.4), AK.std(0x9aa0a6, { metalness: 0.7, roughness: 0.35 }), 0.02, -0.11 + i * 0.045, 0));
    part(g, gr, "Radiator grille", [0.9, 0, 0]);
    part(g, grp(1.455, 1.3, 0, rb(0.02, 0.05, 0.11, 0.008, lampM(), 0, 0, 0.15), rb(0.02, 0.05, 0.11, 0.008, lampM(), 0, 0, -0.15)), "Headlamps", [0.9, 0.35, 0]);
    part(g, grp(1.57, 0.74, 0, rb(0.2, 0.26, 0.62, 0.05, AK.std(0x26282c, { roughness: 0.6, metalness: 0.5 }), 0, 0, 0), rot(cyl(0.02, 0.02, 0.2, steel, -0.08, 0.02, 0, 8), 0, 0, Math.PI / 2)), "Front weights (ballast)", [0.8, -0.2, 0]);
    /* cab: slim pillars, glass all round, overhanging roof cap with work lamps and beacon */
    const cab = grp(-0.4, 1.45, 0), y0 = -0.45, y1 = 0.43;
    for (const s of [-1, 1]) { cab.add(bar([0.45, y0, s * 0.39], [0.36, y1, s * 0.37], 0.035, dark), bar([-0.44, y0, s * 0.39], [-0.42, y1, s * 0.37], 0.035, dark), bar([0.0, y0, s * 0.395], [0.0, y1, s * 0.375], 0.022, dark));
      const sg = M(new T3.PlaneGeometry(0.84, 0.86), gl, 0, -0.01, s * 0.385); sg.castShadow = false; cab.add(sg);
      cab.add(rot(M(new T3.BoxGeometry(0.02, 0.2, 0.11), dark, 0.47, 0.25, s * 0.56), 0, s * -0.25, 0), bar([0.42, 0.25, s * 0.4], [0.47, 0.25, s * 0.52], 0.008, dark, true)); }
    const fs = M(new T3.PlaneGeometry(0.76, 0.88), gl, 0.41, -0.01, 0); fs.rotation.set(0, Math.PI / 2, 0); fs.rotateX(0.1); fs.castShadow = false; cab.add(fs);
    const rs = M(new T3.PlaneGeometry(0.76, 0.86), gl, -0.43, -0.01, 0); rs.rotation.y = Math.PI / 2; rs.castShadow = false; cab.add(rs);
    cab.add(rb(1.02, 0.1, 0.9, 0.04, body, -0.02, 0.5, 0), M(new T3.BoxGeometry(0.98, 0.03, 0.86), dark, -0.02, 0.44, 0), rb(0.95, 0.07, 0.8, 0.02, dark, 0, -0.47, 0));
    for (const s of [-1, 1]) for (const z of [0.3, 0.16]) { cab.add(rb(0.03, 0.045, 0.09, 0.008, lampM(0xffffff, 0.5), 0.5, 0.5, s * z)); } for (const s of [-1, 1]) cab.add(rb(0.03, 0.045, 0.09, 0.008, lampM(0xffffff, 0.3), -0.54, 0.5, s * 0.28));
    cab.add(cyl(0.035, 0.04, 0.06, lampM(0xff9a1a, 0.8), -0.3, 0.585, 0.3, 10));
    part(g, cab, "Safety frame (ROPS)", [0, 1.0, 0]);
    /* seat, steering column and console inside the glass; fuel tank and steps below on the left */
    const seat = grp(-0.5, 1.22, 0, rb(0.3, 0.08, 0.34, 0.03, dark, 0, 0, 0), rot(rb(0.07, 0.36, 0.32, 0.03, dark, -0.16, 0.2, 0), 0, 0, 0.12), rb(0.42, 0.24, 0.24, 0.06, dark, 0.42, -0.45, 0.4));
    for (let i = 0; i < 3; i++) seat.add(M(new T3.BoxGeometry(0.2, 0.02, 0.1), steel, 0.52, -0.62 + i * 0.16, 0.5 - i * 0.02));
    part(g, seat, "Seat and fuel tank", [-0.25, 0.6, 0.5]);
    const sw = grp(-0.12, 1.47, 0, rot(M(new T3.TorusGeometry(0.13, 0.016, 8, 22), dark), 0, Math.PI / 2, 0), bar([0, 0, 0], [0.16, -0.3, 0], 0.02, dark, true)); sw.rotation.z = -0.5; part(g, sw, "Steering wheel", [0.25, 0.7, 0]);
    /* exhaust stack with heat shield up the front pillar; shorter air-intake pipe on the other side */
    part(g, grp(0.1, 1.72, -0.42, cyl(0.028, 0.028, 0.9, AK.std(0x3a3c40, { metalness: 0.7, roughness: 0.4 }), 0, 0, 0, 10), cyl(0.045, 0.045, 0.42, AK.std(0x8e9296, { metalness: 0.8, roughness: 0.35 }), 0, -0.1, 0, 12), rot(cyl(0.028, 0.028, 0.08, AK.std(0x3a3c40, { metalness: 0.7, roughness: 0.4 }), 0.02, 0.47, 0, 10), 0, 0, -0.6)), "Exhaust", [0, 0.7, -0.35]);
    part(g, grp(0.1, 1.6, 0.42, cyl(0.022, 0.022, 0.5, dark, 0, -0.05, 0, 8), cyl(0.055, 0.055, 0.14, AK.std(0x3a3c40, { roughness: 0.4, metalness: 0.5 }), 0, 0.26, 0, 12)), "Air cleaner", [0, 0.7, 0.35]);
    part(g, rb(0.2, 0.17, 0.16, 0.02, AK.std(0x101113, { roughness: 0.5 }), 0.02, 0.84, -0.3), "Battery", [0, 0.2, -0.8]);
    /* mudguards: wide arcs over the rear tyres carrying lamps, small ones following the front wheels */
    const mg = grp(RX, RR, 0), mgM = once("mg" + col, () => new T3.MeshPhysicalMaterial({ color: col, roughness: 0.38, clearcoat: 0.7, side: T3.DoubleSide }));
    for (const s of [-1, 1]) { const a = M(new T3.CylinderGeometry(RR + 0.07, RR + 0.07, RW + 0.06, 26, 1, true, Math.PI - 0.75, 2.05), mgM, 0, 0, s * RZ); a.rotation.x = Math.PI / 2; mg.add(a); mg.add(rb(0.02, 0.07, 0.1, 0.008, lampM(0xd82a1e, 0.5), -0.66, 0.2, s * RZ)); const f = M(new T3.CylinderGeometry(FR + 0.05, FR + 0.05, FW + 0.02, 18, 1, true, Math.PI - 0.5, 1.3), dark.clone(), FX - RX, FR - RR, s * FZ); f.material.side = T3.DoubleSide; f.rotation.x = Math.PI / 2; mg.add(f); }
    part(g, mg, "Mudguards (fenders)", [0, 0.75, 0]);
    /* wheels */
    const rw1 = AK.wheel(RR, RW), rw2 = AK.wheel(RR, RW), fw1 = AK.wheel(FR, FW), fw2 = AK.wheel(FR, FW);
    rw1.position.set(RX, RR, RZ); rw2.position.set(RX, RR, -RZ); fw1.position.set(FX, FR, FZ); fw2.position.set(FX, FR, -FZ);
    part(g, rw1, "Rear wheel (drive)", [0, 0, 0.8]); part(g, rw2, "Rear wheel", [0, 0, -0.8]); part(g, fw1, "Front wheel (steering)", [0.3, 0, 0.6]); part(g, fw2, "Front wheel", [0.3, 0, -0.6]);
    g.add(rot(cyl(0.045, 0.045, 2 * FZ - FW, dark, FX, FR, 0, 10), Math.PI / 2));
    /* rear: three-point linkage, top link, PTO with guard, drawbar, lift cylinder */
    const hx = -1.0, hitch = grp(hx, 0.5, 0);
    for (const s of [-1, 1]) { hitch.add(bar([0.22, 0.02, s * 0.2], [-0.22, -0.08, s * 0.3], 0.035, dark), rot(cyl(0.022, 0.022, 0.07, steel, -0.22, -0.08, s * 0.3, 8), Math.PI / 2), bar([-0.04, -0.03, s * 0.25], [0.12, 0.42, s * 0.22], 0.014, steel, true), bar([0.12, 0.42, s * 0.22], [0.3, 0.46, s * 0.2], 0.03, dark)); }
    part(g, hitch, "Three-point hitch", [-0.8, 0, 0]);
    part(g, grp(hx, 0.98, 0, bar([0.2, 0.04, 0], [-0.2, -0.05, 0], 0.018, steel, true), bar([0.05, 0.02, 0], [-0.05, -0.01, 0], 0.028, dark, true)), "Top link", [-0.8, 0.5, 0]);
    part(g, grp(-0.93, 0.62, 0, rot(cyl(0.028, 0.028, 0.16, AK.paint(0xe0a020), 0, 0, 0, 12), 0, 0, Math.PI / 2), rot(M(new T3.CylinderGeometry(0.075, 0.075, 0.14, 14, 1, true, Math.PI / 2, Math.PI), AK.std(0xf2c21a, { roughness: 0.5, side: T3.DoubleSide }), 0, 0.0, 0), 0, 0, Math.PI / 2)), "PTO shaft", [-0.9, -0.3, 0]);
    part(g, grp(-1.0, 0.33, 0, M(new T3.BoxGeometry(0.5, 0.035, 0.09), dark), cyl(0.016, 0.016, 0.09, steel, -0.21, 0.03, 0, 8)), "Drawbar", [-0.9, -0.3, 0]);
    part(g, grp(-0.78, 0.9, 0.24, bar([0.06, 0.1, 0], [-0.05, -0.1, 0], 0.032, AK.paint(0xd8d8d8), true), bar([-0.05, -0.1, 0], [-0.1, -0.2, 0], 0.014, steel, true)), "Hydraulic cylinder", [-0.5, 0.4, 0.4]);
    g.wheels = [rw1, rw2, fw1, fw2];
    return g;
  };
  AK.tractor = (col = 0xc8321e) => { try { return tractor(col); } catch (e) { console.error("agric-round3 tractor: " + e.message); return tractor0(col); } };

  /* ================= 3. implements (hitched behind at −x; box-section frames with repeated working units) ================= */
  const FRAME = 0x1f55a8;
  /* headstock: A-frame mast with top-link point and the two lower hitch pins */
  const headstock = (mat, w = 0.62, y = 0.5) => grp(0, 0, 0, bar([0, y, -w / 2], [0, y + 0.48, 0], 0.05, mat), bar([0, y, w / 2], [0, y + 0.48, 0], 0.05, mat), bar([0, y + 0.48, 0], [-0.3, y + 0.1, 0], 0.035, mat), rot(cyl(0.02, 0.02, w + 0.16, zinc(), 0, y, 0, 8), Math.PI / 2));
  /* concave disc (dish faces +x), with hub, bolts and bearing */
  const discGeo = (a) => once("dsc" + a.toFixed(3), () => { const T3 = T(), h = 0.28 * a, Rs = (a * a + h * h) / (2 * h), th = Math.asin(a / Rs), g = new T3.SphereGeometry(Rs, 30, 8, 0, 6.2832, 0, th); g.translate(0, -Rs * Math.cos(th), 0); g.rotateZ(-Math.PI / 2); return g; });
  const notchGeo = (a) => once("ntc" + a.toFixed(3), () => { const g = discGeo(a).clone(), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), z = p.getZ(i), r = Math.hypot(y, z); if (r > a * 0.86) { const k = 1 - 0.12 * (0.5 + 0.5 * Math.cos(Math.atan2(z, y) * 10)); p.setY(i, y * k); p.setZ(i, z * k); } } g.computeVertexNormals(); return g; });
  const disc = (a, notched) => { const g = new (T().Group)(); g.add(M(notched ? notchGeo(a) : discGeo(a), polished())); g.add(rot(cyl(a * 0.2, a * 0.22, a * 0.3, satin(), a * 0.3, 0, 0, 12), 0, 0, Math.PI / 2)); for (let i = 0; i < 5; i++) { const an = i * 1.2566; g.add(rot(cyl(a * 0.03, a * 0.03, a * 0.06, zinc(), a * 0.47, Math.cos(an) * a * 0.13, Math.sin(an) * a * 0.13, 6), 0, 0, Math.PI / 2)); } return g; };
  /* mouldboard body: twisted, soil-polished board with share, landside and leg (turns the slice to +z·side) */
  const mbGeo = (side) => once("mb" + side, () => { const T3 = T(), g = new T3.PlaneGeometry(1, 1, 12, 7), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const u = p.getX(i) + 0.5, v = p.getY(i) + 0.5; const x = -u * 0.5 - v * v * 0.07, y = v * (0.2 + 0.2 * Math.sin(u * 1.5)) + u * 0.02, z = side * (u * 0.1 + Math.pow(u, 1.4) * v * 0.3 + v * v * 0.06 * u); p.setXYZ(i, x, y, z); } g.computeVertexNormals(); return g; });
  const ploughBody = (side, mat) => { const T3 = T(), g = new T3.Group(); g.add(M(mbGeo(side), polished())); const sh = M(new T3.BoxGeometry(0.34, 0.012, 0.11), polished(), -0.13, 0.008, side * 0.05); sh.rotation.y = side * -0.35; g.add(sh); g.add(M(new T3.BoxGeometry(0.4, 0.09, 0.012), AK.std(0x3a3c40, { metalness: 0.7, roughness: 0.4 }), -0.22, 0.05, -side * 0.005)); g.add(bar([-0.2, 0.08, side * 0.03], [-0.26, 0.56, 0], 0.05, mat)); g.add(M(new T3.BoxGeometry(0.12, 0.08, 0.02), satin(), -0.22, 0.14, side * 0.02)); return g; };
  /* curved spring tine with a replaceable point */
  const tine = (mat, h = 0.52) => { const g = new (T().Group)(); g.add(tube([[0, h, 0], [-0.1, h + 0.02, 0], [-0.19, h - 0.08, 0], [-0.2, h - 0.25, 0], [-0.12, 0.12, 0], [-0.0, 0.03, 0], [0.07, 0.0, 0]], 0.014, mat, 18)); const pt = M(new (T().ConeGeometry)(0.03, 0.09, 4), polished(), 0.08, 0.005, 0); pt.rotation.z = -1.35; g.add(pt); g.add(M(new (T().BoxGeometry)(0.06, 0.04, 0.05), zinc(), 0, h + 0.012, 0)); return g; };
  const implement0 = AK.implement;
  const implement = (type) => {
    const T3 = T(), g = new T3.Group(), fr = paint(type === "sprayer" || type === "trailer" ? 0x2f7a34 : type === "planter" ? 0xc8321e : FRAME), dark = satin(), steel = zinc();
    const hs = headstock(fr); hs.position.x = 0.0;
    if (type === "disc") {
      /* disc plough: diagonal beam, three discs each on its own standard and bearing, scrapers, rear furrow wheel */
      g.add(hs, bar([0.0, 0.62, -0.5], [-1.15, 0.62, 0.5], 0.09, fr), bar([0, 0.5, -0.31], [-0.15, 0.62, -0.38], 0.05, fr), bar([0, 0.5, 0.31], [-0.6, 0.62, 0.02], 0.05, fr));
      [[-0.28, -0.3], [-0.62, 0.0], [-0.96, 0.3]].forEach(([x, z]) => { const d = disc(0.3); d.position.set(x - 0.06, 0.26, z + 0.12); d.rotation.set(0, 0.74, 0.3); g.add(d); g.add(bar([x, 0.62, z + 0.0], [x - 0.14, 0.27, z + 0.02], 0.055, fr)); const sc = M(new T3.BoxGeometry(0.02, 0.2, 0.1), steel, x + 0.1, 0.42, z + 0.3); sc.rotation.set(0.2, 0.74, 0); g.add(sc); });
      const fw = disc(0.2); fw.position.set(-1.25, 0.2, 0.52); fw.rotation.y = Math.PI / 2 + 0.25; g.add(fw, bar([-1.15, 0.62, 0.5], [-1.25, 0.22, 0.56], 0.04, fr));
    } else if (type === "harrow") {
      /* offset disc harrow: two gangs on common axles set in a V, notched discs in front */
      g.add(hs, M(new T3.BoxGeometry(0.08, 0.08, 1.9), fr, -0.3, 0.6, 0), M(new T3.BoxGeometry(0.08, 0.08, 1.9), fr, -1.0, 0.6, 0));
      for (const s of [-1, 1]) g.add(M(new T3.BoxGeometry(0.78, 0.08, 0.08), fr, -0.65, 0.6, s * 0.6), bar([0, 0.5, s * 0.31], [-0.3, 0.6, s * 0.4], 0.05, fr));
      [[-0.32, 0.2, true], [-0.98, -0.2, false]].forEach(([x, ang, notched]) => { const gang = new T3.Group(); gang.position.set(x, 0.24, 0); gang.rotation.y = ang; gang.add(rot(cyl(0.022, 0.022, 1.86, dark, 0, 0, 0, 8), Math.PI / 2)); for (let i = 0; i < 8; i++) { const d = disc(0.23, notched); d.rotation.y = (ang > 0 ? 1 : -1) * Math.PI / 2; d.position.z = -0.84 + i * 0.24; gang.add(d); } g.add(gang); for (const z of [-0.55, 0.55]) g.add(bar([x, 0.6, z], [x + Math.sin(ang) * z, 0.26, z], 0.045, fr)); });
    } else if (type === "mouldboard") {
      /* mounted plough: diagonal main beam carrying three bodies in echelon, with a rear land wheel */
      g.add(hs, bar([0.0, 0.66, -0.42], [-1.3, 0.66, 0.42], 0.09, fr), bar([0, 0.5, 0.31], [-0.6, 0.66, 0.0], 0.05, fr), bar([0, 0.5, -0.31], [-0.1, 0.66, -0.36], 0.05, fr));
      [[-0.18, -0.3], [-0.6, -0.03], [-1.02, 0.24]].forEach(([x, z]) => { const b = ploughBody(1, fr); b.position.set(x + 0.2, 0.06, z); g.add(b); const sk = disc(0.11); sk.position.set(x + 0.42, 0.13, z - 0.02); sk.rotation.y = Math.PI / 2; g.add(sk, bar([x + 0.42, 0.15, z - 0.05], [x + 0.3, 0.64, z + 0.06], 0.02, steel, true)); });
      const lw = AK.wheel(0.17, 0.08, FRAME); lw.position.set(-1.38, 0.17, 0.55); g.add(lw, bar([-1.3, 0.66, 0.42], [-1.38, 0.2, 0.5], 0.04, fr));
    } else if (type === "ridger") {
      /* ridger: toolbar with three double-mouldboard bodies that throw soil both ways */
      g.add(hs, M(new T3.BoxGeometry(0.09, 0.09, 1.8), fr, -0.25, 0.62, 0)); for (const s of [-1, 1]) g.add(bar([0, 0.5, s * 0.31], [-0.25, 0.62, s * 0.36], 0.05, fr));
      [-0.6, 0, 0.6].forEach((z) => { const u = new T3.Group(); u.position.set(-0.1, 0.05, z); const a = ploughBody(1, fr), b = ploughBody(-1, fr); u.add(a, b); const nose = M(new T3.ConeGeometry(0.05, 0.16, 4), polished(), 0.02, 0.03, 0); nose.rotation.z = -Math.PI / 2; u.add(nose); g.add(u); for (const s of [-1, 1]) g.add(M(new T3.BoxGeometry(0.035, 0.012, 0.012), steel, -0.25, 0.672, z + s * 0.035)); });
    } else if (type === "planter") {
      /* precision planter: square toolbar, four row units on parallelogram arms, ground-drive wheel, fertilizer hoppers */
      g.add(hs, M(new T3.BoxGeometry(0.1, 0.1, 2.0), dark, -0.22, 0.62, 0)); for (const s of [-1, 1]) g.add(bar([0, 0.5, s * 0.31], [-0.22, 0.62, s * 0.36], 0.05, fr));
      [-0.75, -0.25, 0.25, 0.75].forEach((z) => { const u = new T3.Group(); u.position.set(-0.22, 0, z);
        u.add(bar([-0.04, 0.6, 0.05], [-0.34, 0.48, 0.05], 0.022, fr), bar([-0.04, 0.5, 0.05], [-0.34, 0.38, 0.05], 0.022, fr), bar([-0.04, 0.6, -0.05], [-0.34, 0.48, -0.05], 0.022, fr), bar([-0.04, 0.5, -0.05], [-0.34, 0.38, -0.05], 0.022, fr));
        u.add(tube([[-0.06, 0.64, 0], [-0.14, 0.6, 0.01], [-0.2, 0.55, -0.01], [-0.28, 0.5, 0]], 0.012, steel, 10));
        u.add(M(new T3.BoxGeometry(0.34, 0.07, 0.07), fr, -0.5, 0.42, 0));
        const hop = M(new T3.CylinderGeometry(0.11, 0.075, 0.24, 14), polymer(), -0.46, 0.62, 0); u.add(hop, cyl(0.115, 0.115, 0.03, AK.std(0xf2c21a, { roughness: 0.5 }), -0.46, 0.755, 0, 14), cyl(0.07, 0.07, 0.05, dark, -0.46, 0.47, 0, 12));
        for (const s of [-1, 1]) { const d = M(new T3.CylinderGeometry(0.15, 0.15, 0.006, 22), polished(), -0.42, 0.15, s * 0.016); d.rotation.set(Math.PI / 2 + s * 0.07, 0, 0); u.add(d); const gw = AK.wheel(0.12, 0.045, 0x2a2c30); gw.position.set(-0.47, 0.13, s * 0.075); u.add(gw); }
        for (const s of [-1, 1]) { const pw = AK.wheel(0.1, 0.035, 0xb8bcc0); pw.position.set(-0.78, 0.1, s * 0.035); pw.rotation.x = s * 0.25; u.add(pw); } u.add(bar([-0.6, 0.42, 0], [-0.78, 0.12, 0], 0.025, fr));
        g.add(u); for (const s of [-1, 1]) g.add(M(new T3.BoxGeometry(0.12, 0.012, 0.012), steel, -0.22, 0.676, z + s * 0.06)); });
      for (const z of [-0.5, 0.5]) g.add(M(new T3.CylinderGeometry(0.16, 0.1, 0.3, 4), paint(0xc8321e), -0.2, 0.9, z), M(new T3.BoxGeometry(0.24, 0.02, 0.24), dark, -0.2, 1.06, z));
      const dw = AK.wheel(0.2, 0.09, 0xb8bcc0); dw.position.set(-0.22, 0.2, 1.08); g.add(dw, bar([-0.22, 0.62, 1.0], [-0.22, 0.22, 1.02], 0.035, fr));
    } else if (type === "sprayer") {
      /* mounted boom sprayer: polymer tank on a frame, pump and controls, folding lattice boom with nozzles every 0.45 */
      g.add(hs, M(new T3.BoxGeometry(0.5, 0.06, 0.9), dark, -0.25, 0.52, 0)); for (const s of [-1, 1]) g.add(bar([-0.02, 0.52, s * 0.4], [-0.02, 1.2, s * 0.4], 0.04, fr), bar([-0.48, 0.52, s * 0.4], [-0.48, 0.95, s * 0.4], 0.04, fr));
      const tank = M(new T3.CapsuleGeometry(0.32, 0.36, 8, 20), polymer(), -0.2, 0.92, 0); tank.rotation.x = Math.PI / 2; tank.scale.set(0.82, 1, 1); g.add(tank, cyl(0.09, 0.09, 0.04, AK.std(0xf2c21a, { roughness: 0.5 }), -0.2, 1.26, 0, 14));
      const liq = M(new T3.CapsuleGeometry(0.3, 0.34, 6, 16), AK.std(0x6fb0d8, { roughness: 0.3, transparent: true, opacity: 0.55 }), -0.2, 0.86, 0); liq.rotation.x = Math.PI / 2; liq.scale.set(0.8, 1, 0.72); liq.castShadow = false; g.add(liq);
      g.add(rb(0.16, 0.14, 0.16, 0.03, AK.std(0x3a5a8a, { roughness: 0.4, metalness: 0.5 }), -0.02, 0.6, 0), cyl(0.035, 0.035, 0.012, AK.std(0xf4f4f0), -0.5, 1.02, 0.3, 14), tube([[-0.02, 0.66, 0.05], [-0.1, 0.72, 0.2], [-0.35, 0.7, 0.2], [-0.5, 0.7, 0.05]], 0.012, dark, 14));
      g.add(M(new T3.BoxGeometry(0.035, 0.035, 4), fr, -0.5, 0.7, 0), M(new T3.BoxGeometry(0.03, 0.03, 4), fr, -0.5, 0.86, 0)); for (let i = 0; i <= 16; i++) { const z0 = -2 + i * 0.25; if (i < 16) g.add(bar([-0.5, i % 2 ? 0.7 : 0.86, z0], [-0.5, i % 2 ? 0.86 : 0.7, z0 + 0.25], 0.012, fr, true)); }
      for (let i = 0; i < 9; i++) { const z = -1.8 + i * 0.45; g.add(cyl(0.012, 0.02, 0.06, AK.std(0x2a2a2a), -0.5, 0.64, z, 6), cyl(0.018, 0.018, 0.02, AK.std(0xf2c21a), -0.5, 0.675, z, 8)); }
      g.add(tube([[-0.5, 0.69, -1.8], [-0.5, 0.685, 0], [-0.5, 0.69, 1.8]], 0.008, dark, 6));
    } else if (type === "cultivator") {
      /* spring-tine cultivator: two cross bars, staggered tines so no two follow the same line */
      g.add(hs, M(new T3.BoxGeometry(0.07, 0.07, 1.8), fr, -0.2, 0.56, 0), M(new T3.BoxGeometry(0.07, 0.07, 1.8), fr, -0.6, 0.56, 0)); for (const s of [-1, 1]) g.add(M(new T3.BoxGeometry(0.47, 0.07, 0.07), fr, -0.4, 0.56, s * 0.865), bar([0, 0.5, s * 0.31], [-0.2, 0.56, s * 0.4], 0.05, fr));
      for (let i = 0; i < 9; i++) { const t = tine(steel, 0.52); t.position.set(i % 2 ? -0.6 : -0.2, 0, -0.8 + i * 0.2); g.add(t); }
    } else if (type === "slasher") {
      /* rotary slasher: deck on skids, gearbox driven by the PTO shaft, rear castor wheel */
      g.add(hs, rb(1.3, 0.1, 1.5, 0.04, fr, -0.85, 0.42, 0)); const sk = prof([[-0.62, -0.1], [0.62, -0.1], [0.7, 0.05], [-0.62, 0.05]], 0.04, 0); for (const s of [-1, 1]) g.add(M(sk, dark, -0.85, 0.34, s * 0.74));
      g.add(rb(0.22, 0.2, 0.22, 0.04, dark, -0.85, 0.56, 0), rot(cyl(0.025, 0.025, 0.85, AK.paint(0xe0a020), -0.38, 0.6, 0, 10), 0, 0, Math.PI / 2 - 0.05), cyl(0.02, 0.02, 0.2, steel, -0.85, 0.32, 0, 8));
      const bl = M(new T3.BoxGeometry(1.2, 0.012, 0.09), polished(), -0.85, 0.24, 0); bl.rotation.y = 0.6; g.add(bl); g.blade = bl;
      const cw = AK.wheel(0.14, 0.07, 0xb8bcc0); cw.position.set(-1.75, 0.14, 0); g.add(cw, bar([-1.45, 0.46, 0], [-1.72, 0.3, 0], 0.04, fr));
      for (const s of [-1, 1]) g.add(bar([0, 0.5, s * 0.31], [-0.3, 0.46, s * 0.5], 0.04, fr));
    } else if (type === "harvester") {
      /* root lifter: share under the row lifts crop and soil onto an inclined web of rods that sieves the soil away */
      g.add(hs, M(new T3.BoxGeometry(0.08, 0.08, 1.2), fr, -0.2, 0.6, 0)); for (const s of [-1, 1]) g.add(bar([-0.2, 0.6, s * 0.5], [-1.2, 0.55, s * 0.5], 0.06, fr), bar([-0.2, 0.6, s * 0.5], [-0.12, 0.08, s * 0.48], 0.05, fr), bar([0, 0.5, s * 0.31], [-0.2, 0.6, s * 0.4], 0.05, fr));
      const sh = M(new T3.BoxGeometry(0.3, 0.012, 0.98), polished(), -0.1, 0.05, 0); sh.rotation.z = -0.3; g.add(sh);
      for (let i = 0; i < 16; i++) { const k = i / 15; g.add(rot(cyl(0.013, 0.013, 0.96, steel, -0.22 - k * 0.95, 0.1 + k * 0.38, 0, 6), Math.PI / 2)); } for (const s of [-1, 1]) g.add(bar([-0.2, 0.12, s * 0.49], [-1.19, 0.5, s * 0.49], 0.03, fr), M(prof([[-0.2, 0.06], [-1.2, 0.44], [-1.2, 0.56], [-0.2, 0.2]], 0.012, 0), fr, 0, 0, s * 0.5));
      for (const s of [-1, 1]) { const w = AK.wheel(0.18, 0.09, 0xb8bcc0); w.position.set(-0.9, 0.18, s * 0.62); g.add(w); }
    } else if (type === "trailer") {
      /* tipping trailer: ribbed box on a chassis, flotation tyres, drawbar and rear marker board */
      const tc = paint(0x4a7a2a);
      g.add(M(new T3.BoxGeometry(1.6, 0.04, 1.2), tc, -0.9, 0.52, 0), M(new T3.BoxGeometry(1.7, 0.07, 0.5), dark, -0.9, 0.46, 0));
      for (const s of [-1, 1]) { g.add(M(new T3.BoxGeometry(1.6, 0.46, 0.03), tc, -0.9, 0.77, s * 0.6)); for (let i = 0; i < 6; i++) g.add(M(new T3.BoxGeometry(0.035, 0.46, 0.02), tc, -1.62 + i * 0.29, 0.77, s * 0.622)); g.add(M(new T3.BoxGeometry(1.64, 0.035, 0.05), tc, -0.9, 1.0, s * 0.6)); }
      g.add(M(new T3.BoxGeometry(0.03, 0.46, 1.2), tc, -0.1, 0.77, 0), M(new T3.BoxGeometry(0.03, 0.46, 1.2), tc, -1.7, 0.77, 0));
      const cv = BK.cv(64, 16), x = cv.getContext("2d"); for (let i = -1; i < 9; i++) { x.fillStyle = i % 2 ? "#d8261c" : "#f4f4f0"; x.beginPath(); x.moveTo(i * 8, 16); x.lineTo(i * 8 + 8, 16); x.lineTo(i * 8 + 16, 0); x.lineTo(i * 8 + 8, 0); x.fill(); } const ct = new T3.CanvasTexture(cv); ct.colorSpace = T3.SRGBColorSpace;
      const mk = M(new T3.PlaneGeometry(0.9, 0.12), new T3.MeshStandardMaterial({ map: ct, roughness: 0.5 }), -1.72, 0.66, 0); mk.rotation.y = -Math.PI / 2; g.add(mk);
      const w1 = AK.wheel(0.3, 0.22), w2 = AK.wheel(0.3, 0.22); w1.position.set(-1.0, 0.3, 0.65); w2.position.set(-1.0, 0.3, -0.65); g.add(w1, w2, rot(cyl(0.035, 0.035, 1.3, dark, -1.0, 0.3, 0, 8), Math.PI / 2));
      g.add(bar([-0.1, 0.46, 0.2], [0.3, 0.36, 0], 0.05, dark), bar([-0.1, 0.46, -0.2], [0.3, 0.36, 0], 0.05, dark), cyl(0.03, 0.03, 0.3, steel, -0.2, 0.3, 0, 8));
    } else return implement0(type);
    return g;
  };
  AK.implement = (type = "disc") => { try { return implement(type); } catch (e) { console.error("agric-round3 implement " + type + ": " + e.message); return implement0(type); } };

  /* ================= 4. combine harvester and bulldozer ================= */
  const combine0 = AK.combine;
  AK.combine = () => { try {
    const T3 = T(), g = new T3.Group(), b = paint(0x2a8a3a), dark = satin(), steel = zinc(), yel = paint(0xf2c21a);
    part(g, M(prof([[-1.25, -0.6], [1.0, -0.6], [1.1, -0.2], [0.9, 0.55], [-1.0, 0.62], [-1.3, 0.3]], 1.4, 0.05), b, 0, 1.45, 0), "Threshing body (drum and sieves)", [0, 0.7, 0]);
    part(g, rb(1.0, 0.42, 1.2, 0.06, b, -0.3, 2.3, 0), "Grain tank", [-0.4, 0.9, 0]);
    const cab = grp(0.95, 2.2, 0, rb(0.7, 0.07, 0.9, 0.02, dark, 0, -0.4, 0), rb(0.78, 0.09, 1.0, 0.035, b, 0, 0.44, 0)); for (const s of [-1, 1]) { cab.add(bar([0.33, -0.38, s * 0.43], [0.3, 0.42, s * 0.42], 0.03, dark), bar([-0.33, -0.38, s * 0.43], [-0.33, 0.42, s * 0.42], 0.03, dark)); const p = M(new T3.PlaneGeometry(0.64, 0.8), glassM(), 0, 0.02, s * 0.43); p.castShadow = false; cab.add(p); cab.add(rb(0.03, 0.045, 0.1, 0.008, lampM(0xffffff, 0.5), 0.39, 0.44, s * 0.3)); } const ws = M(new T3.PlaneGeometry(0.86, 0.8), glassM(), 0.33, 0.02, 0); ws.rotation.y = Math.PI / 2; ws.castShadow = false; cab.add(ws); cab.add(rb(0.24, 0.3, 0.3, 0.04, dark, -0.1, -0.2, 0));
    part(g, cab, "Cab", [0.3, 0.9, 0]);
    part(g, rot(rb(1.0, 0.36, 0.8, 0.05, b, 1.5, 0.95, 0), 0, 0, -0.42), "Feeder house (conveyor)", [0.6, 0.5, 0]);
    /* header: table with cutter bar, table auger and dividers */
    const hd = grp(2.25, 0.42, 0, M(prof([[-0.3, -0.12], [0.36, -0.2], [0.4, -0.16], [-0.1, 0.0], [-0.26, 0.5], [-0.32, 0.5]], 3.4, 0), b), M(new T3.BoxGeometry(0.04, 0.02, 3.36), polished(), 0.41, -0.17, 0));
    for (let i = 0; i < 42; i++) { const t = M(new T3.ConeGeometry(0.014, 0.07, 4), polished(), 0.46, -0.17, -1.64 + i * 0.08); t.rotation.z = -Math.PI / 2; hd.add(t); }
    const aug = rot(cyl(0.11, 0.11, 3.3, steel, -0.02, 0.08, 0, 14), Math.PI / 2); hd.add(aug); for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 60; i++) { const k = i / 60; pts.push([-0.02 + Math.cos(k * 37.7) * 0.17, 0.08 + Math.sin(k * 37.7) * 0.17, s * (0.25 + k * 1.38)]); } hd.add(tube(pts, 0.012, steel, 120)); }
    for (const s of [-1, 1]) hd.add(M(prof([[-0.3, -0.12], [0.62, -0.2], [0.2, 0.22], [-0.3, 0.5]], 0.03, 0), yel, 0, 0, s * 1.71));
    part(g, hd, "Header (cutter bar and reel)", [1.0, 0, 0]);
    /* reel: bars with tines on spider arms */
    const reel = grp(2.5, 0.98, 0, rot(cyl(0.03, 0.03, 3.3, dark, 0, 0, 0, 8), Math.PI / 2)); for (let i = 0; i < 6; i++) { const a = i * 1.0472, cx = Math.cos(a) * 0.42, cy = Math.sin(a) * 0.42; reel.add(M(new T3.BoxGeometry(0.03, 0.03, 3.3), yel, cx, cy, 0)); for (const z of [-1.6, 0, 1.6]) reel.add(bar([0, 0, z], [cx, cy, z], 0.012, yel, true)); for (let j = 0; j < 17; j++) reel.add(bar([cx, cy, -1.6 + j * 0.2], [cx + Math.cos(a) * 0.1, cy + Math.sin(a) * 0.1 - 0.05, -1.6 + j * 0.2], 0.005, steel, true)); }
    part(g, reel, "Reel", [1.3, 0.5, 0]); g.reel = reel;
    for (const s of [-1, 1]) g.add(bar([1.6, 1.5, s * 1.3], [2.5, 0.98, s * 1.68], 0.03, b));
    part(g, grp(-0.35, 2.62, 0.82, rot(cyl(0.09, 0.09, 2.0, b, -0.2, 0, 0, 12), 0, 0, Math.PI / 2 - 0.08), rot(cyl(0.1, 0.1, 0.2, dark, -1.2, -0.12, 0, 12), 0, 0, 0.3)), "Grain unloading auger", [0, 0.6, 0.8]);
    part(g, grp(-0.95, 2.28, 0, rb(0.5, 0.36, 1.1, 0.05, dark, 0, 0, 0), cyl(0.03, 0.03, 0.4, AK.std(0x3a3c40, { metalness: 0.7, roughness: 0.4 }), -0.1, 0.35, -0.4, 8)), "Engine", [-0.5, 0.8, 0]);
    part(g, grp(-1.45, 1.0, 0, rot(rb(0.4, 0.3, 1.2, 0.04, dark, 0, 0, 0), 0, 0, 0.5)), "Straw chopper and spreader", [-0.7, -0.2, 0]);
    for (let i = 0; i < 4; i++) g.add(M(new T3.BoxGeometry(0.22, 0.02, 0.12), steel, 0.75, 0.9 + i * 0.26, 0.8 + (3 - i) * 0.05));
    const w = [[0.75, 0.68, 0.92, 0.42], [0.75, 0.68, -0.92, 0.42], [-0.95, 0.42, 0.72, 0.26], [-0.95, 0.42, -0.72, 0.26]].map(([x, r, z, ww]) => { const wh = AK.wheel(r, ww); wh.position.set(x, r, z); g.add(wh); return wh; }); g.wheels = w;
    g.add(rot(cyl(0.07, 0.07, 1.6, dark, 0.75, 0.68, 0, 10), Math.PI / 2), rot(cyl(0.05, 0.05, 1.3, dark, -0.95, 0.42, 0, 10), Math.PI / 2));
    return g;
  } catch (e) { console.error("agric-round3 combine: " + e.message); return combine0(); } };

  const dozer0 = AK.bulldozer;
  AK.bulldozer = () => { try {
    const T3 = T(), g = new T3.Group(), y = paint(0xf2b21a), dark = satin(), steel = zinc();
    part(g, grp(0.1, 1.0, 0, M(prof([[-0.95, -0.32], [1.0, -0.32], [1.0, 0.2], [0.9, 0.3], [-0.2, 0.36], [-0.95, 0.36]], 1.0, 0.04), y), rb(0.03, 0.4, 0.8, 0.01, AK.std(0x15171a, { roughness: 0.45, metalness: 0.6 }), 1.02, -0.02, 0), cyl(0.035, 0.035, 0.5, AK.std(0x3a3c40, { metalness: 0.7, roughness: 0.4 }), 0.5, 0.55, 0.3, 10)), "Engine and body", [0, 0.5, 0]);
    const cab = grp(-0.4, 1.75, 0, rb(0.82, 0.08, 1.0, 0.03, y, 0, 0.42, 0)); for (const s of [-1, 1]) { cab.add(bar([0.34, -0.4, s * 0.44], [0.32, 0.4, s * 0.44], 0.04, dark), bar([-0.34, -0.4, s * 0.44], [-0.34, 0.4, s * 0.44], 0.04, dark)); const p = M(new T3.PlaneGeometry(0.66, 0.78), glassM(), 0, 0, s * 0.44); p.castShadow = false; cab.add(p); } for (const x of [0.34, -0.35]) { const p = M(new T3.PlaneGeometry(0.88, 0.78), glassM(), x, 0, 0); p.rotation.y = Math.PI / 2; p.castShadow = false; cab.add(p); } cab.add(rb(0.26, 0.34, 0.34, 0.04, dark, -0.05, -0.2, 0));
    part(g, cab, "Cab", [0, 0.7, 0]);
    /* crawler tracks: drive sprocket high at the rear, idler in front, bogie rollers along the ground run, grouser shoes */
    [-0.72, 0.72].forEach((z) => { const tr = new T3.Group(); tr.position.set(0, 0.34, z); const loop = [[1.05, -0.1], [1.12, 0.0], [1.05, 0.12], [-0.8, 0.3], [-1.02, 0.22], [-1.08, 0.05], [-0.98, -0.24], [0.9, -0.24]]; const sh = new T3.Shape(); loop.forEach(([a, b2], i) => (i ? sh.lineTo(a, b2) : sh.moveTo(a, b2))); sh.closePath(); const belt = new T3.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.0, bevelSegments: 3 }); belt.translate(0, 0, -0.2); tr.add(M(belt, AK.std(0x2a2b2e, { roughness: 0.7, metalness: 0.5 })));
      const N = 34, per = loop.map((p, i) => { const q = loop[(i + 1) % loop.length]; return Math.hypot(q[0] - p[0], q[1] - p[1]); }), tot = per.reduce((a, c) => a + c, 0); for (let i = 0; i < N; i++) { let d = (i / N) * tot, k = 0; while (d > per[k]) { d -= per[k]; k++; } const p = loop[k], q = loop[(k + 1) % loop.length], f = d / per[k], ang = Math.atan2(q[1] - p[1], q[0] - p[0]), nx = Math.sin(ang), ny = -Math.cos(ang); const s = M(new T3.BoxGeometry(0.035, 0.04, 0.42), AK.std(0x3a3b3e, { roughness: 0.6, metalness: 0.6 }), p[0] + (q[0] - p[0]) * f + nx * 0.1, p[1] + (q[1] - p[1]) * f + ny * 0.1, 0); s.rotation.z = ang; tr.add(s); }
      const side = z > 0 ? 0.215 : -0.215; tr.add(rot(cyl(0.2, 0.2, 0.03, y, -0.82, 0.08, side, 16), Math.PI / 2), rot(cyl(0.17, 0.17, 0.03, y, 0.92, 0.0, side, 16), Math.PI / 2)); for (let i = 0; i < 5; i++) tr.add(rot(cyl(0.075, 0.075, 0.03, dark, -0.55 + i * 0.3, -0.15, side, 10), Math.PI / 2)); tr.add(M(new T3.BoxGeometry(1.5, 0.12, 0.03), y, 0, -0.02, side * 0.95));
      part(g, tr, z > 0 ? "Crawler track" : "Track", [0, -0.2, z * 0.8]); });
    /* blade: curved mouldboard on push arms with a tilt cylinder */
    const bl = grp(1.62, 0.52, 0); const bg = new T3.CylinderGeometry(0.75, 0.75, 2.3, 18, 1, true, Math.PI * 1.5 - 0.62, 1.24); const bm = M(bg, once("blade", () => new T3.MeshPhysicalMaterial({ color: 0xf2b21a, roughness: 0.4, clearcoat: 0.5, side: T3.DoubleSide })), 0.7, 0.05, 0); bm.rotation.x = Math.PI / 2; bl.add(bm); bl.add(M(new T3.BoxGeometry(0.05, 0.07, 2.3), polished(), 0.1, -0.44, 0)); for (const s of [-1, 1]) bl.add(M(new T3.BoxGeometry(0.3, 0.9, 0.03), y, 0.05, 0, s * 1.15));
    part(g, bl, "Blade", [0.7, 0, 0]);
    for (const s of [-1, 1]) g.add(bar([-0.2, 0.4, s * 1.0], [1.55, 0.3, s * 1.0], 0.07, y), bar([0.9, 1.0, s * 0.45], [1.6, 0.75, s * 0.5], 0.035, steel, true));
    const rip = grp(-1.3, 0.5, 0, M(new T3.BoxGeometry(0.12, 0.12, 0.9), y, 0.1, 0.3, 0)); for (const z of [-0.3, 0, 0.3]) rip.add(M(prof([[0.12, 0.34], [0.0, 0.34], [-0.08, -0.2], [0.1, -0.45], [0.06, -0.2]], 0.05, 0), AK.std(0x3a3c40, { metalness: 0.7, roughness: 0.4 }), 0, 0, z));
    part(g, rip, "Ripper", [-0.6, 0, 0]);
    return g;
  } catch (e) { console.error("agric-round3 bulldozer: " + e.message); return dozer0(); } };
  AK.r3 = { part, bar, tube, M, box, cyl, rot, grp, rb, prof, paint, satin, polished, zinc, glassM, lampM, polymer, disc, mergeGeos, once, sstep, clamp, V };
})();

/* ---------------- round three, part 2: farmland greenery, remaining pests, small tools ---------------- */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, AK = window.AK, GK = window.GK;
  if (!MK || !BK || !AK || !GK || !AK.r3) return;
  const T = () => window.THREE, R = AK.r3, { M, cyl, rot, bar, tube, grp, rb, polished, zinc, once, sstep, clamp, V } = R;

  /* ================= 5. greenery: several greens with dry patches, a tree line, distance haze ================= */
  const env0 = AK.env;
  AK.env = (hdri = "farm_field", o = {}) => { const e = env0(hdri, o); if (o.fog == null && e.bg === "hdri" && !o.blur) Object.assign(e, { fog: true, fogColor: 0xa9bccb, fogNear: 24, fogFar: 150 }); return e; };
  const PAL = { a: 0x4a7230, b: 0x5d8634, c: 0x74963c, dry: 0x8c8a4c, shade: 0x3a5e26 };
  let pending = null; const terrain0 = GK.terrain;
  GK.terrain = (o) => { if (pending && o && o.tint) { o = Object.assign({}, o, { tint: pending }); } pending = null; return terrain0(o); };
  const crownGeo = () => once("crown", () => { const T3 = T(), g = new T3.IcosahedronGeometry(1, 2), p = g.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 0.78 + 0.5 * BK.fbm(x * 1.6 + 5, z * 1.6 + y * 1.3, 3.3); x *= k; z *= k; y = y * k * 0.78; if (y < -0.25) y = -0.25 + (y + 0.25) * 0.3; p.setXYZ(i, x, y + 0.25, z); } g.computeVertexNormals(); const idx = {}, n = g.attributes.normal, acc = {}; for (let i = 0; i < p.count; i++) { const key = p.getX(i).toFixed(3) + p.getY(i).toFixed(3) + p.getZ(i).toFixed(3); (acc[key] = acc[key] || [0, 0, 0, []]); acc[key][0] += n.getX(i); acc[key][1] += n.getY(i); acc[key][2] += n.getZ(i); acc[key][3].push(i); } Object.values(acc).forEach(([x, y, z, ids]) => { const l = Math.hypot(x, y, z) || 1; ids.forEach((i) => n.setXYZ(i, x / l, y / l, z / l)); }); return g; });
  const treeLine = (g, w, d, seed, y) => {
    const T3 = T(), r = BK.rng(seed * 13 + 5), R0 = Math.max(w, d) * 1.15 + 17, per = 6.2832 * R0, n = Math.min(190, Math.round(per / 1.5));
    const cr = new T3.InstancedMesh(crownGeo(), new T3.MeshStandardMaterial({ roughness: 0.95 }), n), tk = new T3.InstancedMesh(new T3.CylinderGeometry(0.1, 0.17, 1, 6), AK.std(0x4a3a2a, { roughness: 0.95 }), n), m4 = new T3.Matrix4(), q = new T3.Quaternion(), up = V(0, 1, 0), c = new T3.Color(), cols = [0x2a4a22, 0x35582a, 0x456a30, 0x3c6226];
    for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832 + (r() - 0.5) * 0.03, rr = R0 + (i % 2) * 2.6 + r() * 2.4, x = Math.cos(a) * rr, z = Math.sin(a) * rr, h = 2.0 + r() * 1.5, cw = 1.5 + r() * 0.9; q.setFromAxisAngle(up, r() * 6.28);
      m4.compose(V(x, y + h * 0.42 + cw * 0.4, z), q, V(cw, cw * (0.85 + r() * 0.35), cw)); cr.setMatrixAt(i, m4); cr.setColorAt(i, c.set(cols[i % 4]).offsetHSL((r() - 0.5) * 0.03, 0, (r() - 0.5) * 0.06));
      m4.compose(V(x, y + h * 0.3, z), q, V(1, h * 0.62, 1)); tk.setMatrixAt(i, m4); }
    cr.castShadow = tk.castShadow = false; cr.userData.dyn = tk.userData.dyn = true; g.add(cr, tk);
  };
  const ground0 = AK.ground;
  AK.ground = (g, o = {}) => {
    const natural = !o.tint && (!o.tex || /grass/.test(o.tex)) && o.grassCol == null;
    const h3 = GK.hex3, mx = GK.mix3;
    if (!o.tint && (natural || o.fieldFn) && !/concrete|floor|tile|brick|plank/.test(o.tex || "")) {
      const seed = o.seed || 3, A = h3(o.grassCol || PAL.a), B = h3(PAL.b), C = h3(PAL.c), D = h3(PAL.dry), Sh = h3(PAL.shade), soil = h3(typeof o.soil === "number" ? o.soil : AK.SOILCOL[o.soil || "loam"] || AK.SOILCOL.loam), ff = o.fieldFn;
      pending = (hn, sl, x, z) => { const n1 = BK.fbm(x * 0.33 + seed, z * 0.33, 7.1), n2 = BK.fbm(x * 1.5 + 2, z * 1.5, 4.4); let c = mx(A, B, sstep(0.35, 0.65, n1)); c = mx(c, C, sstep(0.55, 0.82, n2) * 0.45); c = mx(c, Sh, sstep(0.58, 0.8, 1 - n1) * 0.45); c = mx(c, D, sstep(0.72, 0.9, n1 * n2 * 1.9) * 0.6); const k = ff ? ff(x, z) : 0; return mx(c, soil, clamp(k + (n2 - 0.5) * 0.25, 0, 1)); };
    }
    let h; try { h = ground0(g, o); } finally { pending = null; }
    if (o.apron !== false && o.treeline !== false) try { treeLine(g, o.w || 12, o.d || 9, o.seed || 3, o.apronY == null ? -0.06 : o.apronY); } catch (e) { /* no tree line */ }
    return h;
  };

  /* ================= 6. the remaining pests ================= */
  const coat = (col, o) => AK.phys(col, Object.assign({ roughness: 0.45, clearcoat: 0.5 }, o || {}));
  const ball = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1, seg = 20) => { const m = M(new (T().SphereGeometry)(r, seg, Math.round(seg * 0.7)), mat, x, y, z); m.scale.set(sx, sy, sz); return m; };
  const legs8 = (g, s, mat, span, y) => { for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) { const a = (i - 1.5) * 0.5, dx = Math.sin(a), dz = Math.cos(a) * sd; g.add(tube([[dx * 0.06 * s, y, dz * 0.07 * s], [dx * span * 0.6 * s + 0.02 * s, y + 0.07 * s, dz * span * 0.6 * s], [dx * span * 0.95 * s + 0.03 * s, y - 0.01 * s, dz * span * s], [dx * span * 1.1 * s + 0.03 * s, 0, dz * span * 1.12 * s]], 0.011 * s, mat, 10)); } };
  const acarine = (type, s) => { const T3 = T(), g = new T3.Group(), tick = type === "tick", body = coat(tick ? 0x6a4028 : 0xb8301e, { roughness: tick ? 0.5 : 0.35 }), dark = coat(0x2a180e);
    g.add(ball(0.17 * s, body, -0.03 * s, 0.1 * s, 0, 1.25, tick ? 0.42 : 0.7, 1.0));
    if (tick) { g.add(ball(0.1 * s, coat(0x3a2414, { roughness: 0.35 }), 0.09 * s, 0.135 * s, 0, 1.0, 0.3, 0.95)); for (let i = 0; i < 9; i++) { const a = Math.PI * 0.5 + (i / 8) * Math.PI; g.add(ball(0.022 * s, coat(0x4a2c18), -0.03 * s + Math.cos(a) * 0.2 * s, 0.1 * s, Math.sin(a) * 0.16 * s, 1, 0.8, 1, 8)); } }
    else for (let i = 0; i < 14; i++) { const a = i * 2.4, rr = 0.05 + (i % 5) * 0.025; g.add(bar([(-0.03 + Math.cos(a) * rr) * s, 0.2 * s, Math.sin(a) * rr * s], [(-0.03 + Math.cos(a) * rr * 1.5) * s, 0.27 * s, Math.sin(a) * rr * 1.5 * s], 0.003 * s, coat(0xf2e2d0), true)); }
    const cap = M(new T3.ConeGeometry(0.035 * s, 0.1 * s, 6), dark, 0.2 * s, 0.09 * s, 0); cap.rotation.z = -Math.PI / 2; g.add(cap); for (const sd of [-1, 1]) g.add(bar([0.18 * s, 0.09 * s, sd * 0.025 * s], [0.27 * s, 0.07 * s, sd * 0.04 * s], 0.008 * s, dark, true));
    legs8(g, s, dark, 0.26, 0.09 * s); return g; };
  const shellGeo = () => once("shell", () => { const T3 = T(), U = 150, W = 12, pos = [], col = [], idx = [], turns = 4.6, c1 = new T3.Color(0x8a5a2c), c2 = new T3.Color(0x3d2412), c3 = new T3.Color(0xcaa46a), cc = new T3.Color();
    for (let i = 0; i <= U; i++) { const t = i / U, th = t * turns * 6.2832, e = Math.exp(-2.3 * (1 - t)), R1 = 0.14 * e, r = 0.125 * e, ax = 0.36 * (1 - e); for (let j = 0; j <= W; j++) { const ph = (j / W) * 6.2832, rr = R1 + Math.cos(ph) * r; pos.push(ax + Math.sin(ph) * r * 0.9, Math.cos(th) * rr, Math.sin(th) * rr); const st = 0.5 + 0.5 * Math.sin(th * 7 + Math.sin(ph) * 1.5); cc.copy(c1).lerp(c2, sstep(0.55, 0.8, st)).lerp(c3, sstep(0.75, 1, 1 - st) * 0.5); col.push(cc.r, cc.g, cc.b); } }
    for (let i = 0; i < U; i++) for (let j = 0; j < W; j++) { const a = i * (W + 1) + j, b = a + W + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new T3.BufferGeometry(); g.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new T3.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; });
  const snail = (s) => { const T3 = T(), g = new T3.Group(), skin = coat(0x8d7a66, { roughness: 0.25, clearcoat: 1 });
    const sh = M(shellGeo(), once("shellM", () => new T3.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, clearcoat: 0.8, side: T3.DoubleSide }))); sh.scale.setScalar(s * 1.15); sh.rotation.set(0.25, Math.PI, -0.5); sh.position.set(0.16 * s, 0.25 * s, 0.0); g.add(sh);
    const ft = M(new T3.CapsuleGeometry(0.075 * s, 0.52 * s, 6, 14), skin, 0.08 * s, 0.05 * s, 0); ft.rotation.z = Math.PI / 2; ft.scale.set(0.62, 1, 1.15); g.add(ft);
    g.add(ball(0.07 * s, skin, 0.37 * s, 0.1 * s, 0, 1.2, 0.9, 0.9, 14));
    for (const sd of [-1, 1]) { g.add(tube([[0.4 * s, 0.13 * s, sd * 0.03 * s], [0.46 * s, 0.24 * s, sd * 0.05 * s], [0.5 * s, 0.32 * s, sd * 0.07 * s]], 0.012 * s, skin, 8), ball(0.018 * s, coat(0x1a1410), 0.5 * s, 0.325 * s, sd * 0.07 * s, 1, 1, 1, 8), tube([[0.43 * s, 0.08 * s, sd * 0.03 * s], [0.5 * s, 0.09 * s, sd * 0.05 * s]], 0.008 * s, skin, 6)); }
    return g; };
  const rat = (s) => { const T3 = T(), g = new T3.Group(), fur = AK.furMat ? AK.furMat({ col: 0x6a5c4e }) : coat(0x6a5c4e, { roughness: 0.9, clearcoat: 0 }), pink = coat(0xd9a59c, { roughness: 0.6, clearcoat: 0.1 }), dark = coat(0x14100e, { roughness: 0.15, clearcoat: 1 });
    g.add(ball(0.17 * s, fur, -0.05 * s, 0.17 * s, 0, 1.55, 0.95, 0.95), ball(0.13 * s, fur, 0.16 * s, 0.17 * s, 0, 1.2, 0.95, 0.9), ball(0.15 * s, fur, -0.17 * s, 0.16 * s, 0, 1.0, 0.98, 1.0));
    const hd = M(new T3.SphereGeometry(0.1 * s, 18, 12), fur, 0.33 * s, 0.2 * s, 0); hd.scale.set(1.25, 0.9, 0.85); g.add(hd); const sn = M(new T3.ConeGeometry(0.065 * s, 0.17 * s, 14), fur, 0.46 * s, 0.185 * s, 0); sn.rotation.z = -Math.PI / 2 - 0.08; g.add(sn, ball(0.018 * s, pink, 0.545 * s, 0.18 * s, 0, 1, 1, 1, 8));
    for (const sd of [-1, 1]) { const e = M(new T3.CircleGeometry(0.058 * s, 14), once("ear", () => new T3.MeshStandardMaterial({ color: 0xc99a90, roughness: 0.7, side: T3.DoubleSide })), 0.28 * s, 0.3 * s, sd * 0.075 * s); e.rotation.set(0, sd * 0.9 + Math.PI / 2, 0); e.scale.y = 1.15; g.add(e); g.add(ball(0.017 * s, dark, 0.4 * s, 0.225 * s, sd * 0.062 * s, 1, 1, 1, 8));
      for (let i = 0; i < 4; i++) g.add(bar([0.5 * s, 0.175 * s, sd * 0.02 * s], [0.5 * s + 0.02 * s, (0.15 + i * 0.022) * s, sd * 0.14 * s], 0.0018 * s, coat(0xe8e0d8), true));
      g.add(tube([[0.2 * s, 0.1 * s, sd * 0.09 * s], [0.24 * s, 0.03 * s, sd * 0.1 * s], [0.3 * s, 0.012 * s, sd * 0.1 * s]], 0.017 * s, pink, 8), tube([[-0.2 * s, 0.12 * s, sd * 0.12 * s], [-0.14 * s, 0.04 * s, sd * 0.14 * s], [-0.04 * s, 0.012 * s, sd * 0.14 * s]], 0.022 * s, pink, 8)); }
    const tp = []; for (let i = 0; i <= 12; i++) { const k = i / 12; tp.push([(-0.3 - k * 0.55) * s, (0.1 - Math.sin(k * 3.1) * 0.07 + k * k * 0.06) * s, Math.sin(k * 4) * 0.07 * s]); } g.add(M(new T3.TubeGeometry(new T3.CatmullRomCurve3(tp.map((p) => V(...p))), 30, 0.014 * s, 6), pink)); g.children[g.children.length - 1].scale.set(1, 1, 1);
    return g; };
  const worm = (type, s) => { const T3 = T(), g = new T3.Group(), earth = type === "worm", pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(V((t - 0.5) * 0.9 * s, (earth ? 0.03 : 0.022) * s + Math.max(0, Math.sin(t * 6.3 + 1)) * 0.012 * s, Math.sin(t * 8.5) * 0.07 * s * (0.6 + t * 0.6))); }
    const cv = new T3.CatmullRomCurve3(pts), R0 = (earth ? 0.028 : 0.014) * s, U = 160, W = 10, pos = [], col = [], idx = [], fr = cv.computeFrenetFrames(U, false), ca = new T3.Color(earth ? 0xb46a66 : 0xefe6d2), cb = new T3.Color(earth ? 0x8a4a4a : 0xd8c8a8), cl = new T3.Color(0xd9a08c), c = new T3.Color();
    for (let i = 0; i <= U; i++) { const t = i / U, p = cv.getPointAt(t), tap = Math.min(1, Math.sqrt(Math.min(t, 1 - t) * (earth ? 22 : 9))), ring = earth ? 1 + 0.07 * Math.cos(t * 380) : 1, clit = earth && t > 0.26 && t < 0.36, r = R0 * Math.min(1, tap) * ring * (clit ? 1.22 : 1); c.copy(ca).lerp(cb, earth ? 0.5 + 0.5 * Math.cos(t * 380) : t); if (clit) c.copy(cl); for (let j = 0; j <= W; j++) { const a = (j / W) * 6.2832, n = fr.normals[i].clone().multiplyScalar(Math.cos(a)).addScaledVector(fr.binormals[i], Math.sin(a)); pos.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r); col.push(c.r, c.g, c.b); } }
    for (let i = 0; i < U; i++) for (let j = 0; j < W; j++) { const a = i * (W + 1) + j, b = a + W + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const geo = new T3.BufferGeometry(); geo.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new T3.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals(); g.add(M(geo, new T3.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, clearcoat: 0.7 }))); return g; };
  const mealy = (s) => { const T3 = T(), g = new T3.Group(), wax = coat(0xf3efe6, { roughness: 1, clearcoat: 0 }); for (let i = 0; i < 9; i++) { const k = i / 8, w = Math.sin(Math.max(0.12, k) * Math.PI * 0.92) * 0.9 + 0.1; g.add(ball(0.07 * s, wax, (k - 0.5) * 0.36 * s, 0.06 * s, 0, 0.6, 0.75 * w, 1.6 * w, 12)); }
    for (let i = 0; i < 20; i++) { const a = (i / 20) * 6.2832, L = i === 5 || i === 15 ? 0 : 1; g.add(bar([Math.cos(a) * 0.17 * s, 0.03 * s, Math.sin(a) * 0.1 * s], [Math.cos(a) * (0.24 + (Math.abs(Math.cos(a)) > 0.95 && Math.cos(a) < 0 ? 0.12 : 0)) * s * (L || 1), 0.02 * s, Math.sin(a) * 0.16 * s], 0.008 * s, wax, true)); } return g; };
  const quelea = (s) => { const T3 = T(), g = new T3.Group(), br = coat(0x8a6a48, { roughness: 0.85, clearcoat: 0 }), pale = coat(0xd9c8a8, { roughness: 0.85, clearcoat: 0 });
    g.add(ball(0.13 * s, br, 0, 0.24 * s, 0, 1.35, 1, 0.95), ball(0.11 * s, pale, 0.02 * s, 0.21 * s, 0, 1.2, 0.9, 0.85), ball(0.08 * s, br, 0.17 * s, 0.33 * s, 0, 1, 1, 0.95), ball(0.05 * s, coat(0x2a1c14), 0.215 * s, 0.325 * s, 0, 0.8, 0.9, 1.1, 10));
    const bk = M(new T3.ConeGeometry(0.035 * s, 0.09 * s, 8), coat(0xd8402a, { roughness: 0.3 }), 0.27 * s, 0.32 * s, 0); bk.rotation.z = -Math.PI / 2; g.add(bk);
    for (const sd of [-1, 1]) { g.add(ball(0.012 * s, coat(0x100c0a, { roughness: 0.1, clearcoat: 1 }), 0.21 * s, 0.35 * s, sd * 0.06 * s, 1, 1, 1, 8)); const wg = ball(0.1 * s, coat(0x6a4e34, { roughness: 0.9, clearcoat: 0 }), -0.04 * s, 0.26 * s, sd * 0.1 * s, 1.5, 0.75, 0.3); wg.rotation.z = 0.2; g.add(wg); g.add(bar([0.0, 0.14 * s, sd * 0.04 * s], [0.01 * s, 0.01 * s, sd * 0.05 * s], 0.008 * s, coat(0xc88a6a), true), bar([0.01 * s, 0.01 * s, sd * 0.05 * s], [0.07 * s, 0.005 * s, sd * 0.05 * s], 0.006 * s, coat(0xc88a6a), true)); }
    const tl = M(new T3.BoxGeometry(0.2 * s, 0.012 * s, 0.07 * s), coat(0x5a4230, { roughness: 0.9, clearcoat: 0 }), -0.24 * s, 0.24 * s, 0); tl.rotation.z = 0.25; g.add(tl); return g; };
  const pest0 = AK.pest;
  AK.pest = (type = "grasshopper", s = 1) => {
    let g = null;
    try { if (type === "tick" || type === "mite") g = acarine(type, s); else if (type === "snail") g = snail(s); else if (type === "rat" || type === "rodent" || type === "grasscutter") g = rat(s); else if (type === "worm" || type === "nematode" || type === "roundworm") g = worm(type, s); else if (type === "mealybug") g = mealy(s); else if (type === "bird" || type === "quelea" || type === "weaverbird") g = quelea(s); }
    catch (e) { console.error("agric-round3 pest " + type + ": " + e.message); g = null; }
    if (!g) return pest0(type, s); BK.shadow(g); g.userData.pest = type; return g;
  };

  /* ================= 7. small tools ================= */
  const woodH = (L, r, y0 = 0) => { const T3 = T(), P = []; for (let i = 0; i <= 10; i++) { const k = i / 10; P.push(new T3.Vector2(r * (0.82 + 0.3 * Math.sin(k * Math.PI) - 0.12 * Math.sin(k * Math.PI * 2)) * (i === 0 || i === 10 ? 0.6 : 1), k * L)); } const m = M(new T3.LatheGeometry(P, 12), AK.wood()); m.position.y = y0; return m; };
  const tool0 = AK.tool;
  AK.tool = (type) => {
    const T3 = T(), g = new T3.Group(), steel = polished(), dark = AK.std(0x3a3c40, { metalness: 0.7, roughness: 0.4 });
    try {
      switch (type) {
        case "wateringcan": { const gal = once("galv", () => new T3.MeshStandardMaterial({ color: 0x4f8f5a, roughness: 0.45, metalness: 0.5, side: T3.DoubleSide }));
          g.add(M(new T3.CylinderGeometry(0.15, 0.17, 0.3, 24, 1, true), gal, 0, 0.16, 0), M(new T3.CircleGeometry(0.17, 24), gal, 0, 0.012, 0), M(new T3.TorusGeometry(0.15, 0.008, 6, 24), gal, 0, 0.31, 0), M(new T3.TorusGeometry(0.17, 0.008, 6, 24), gal, 0, 0.012, 0)); g.children[1].rotation.x = -Math.PI / 2; g.children[2].rotation.x = g.children[3].rotation.x = Math.PI / 2;
          const hood = M(new T3.SphereGeometry(0.15, 20, 8, 0, Math.PI, 0, Math.PI / 2), gal, 0, 0.31, 0); hood.rotation.y = Math.PI; hood.scale.y = 0.35; g.add(hood);
          const sp = M(new T3.CylinderGeometry(0.02, 0.034, 0.42, 12), gal); sp.position.set(0.3, 0.26, 0); sp.rotation.z = -0.95; g.add(sp); const rose = M(new T3.CylinderGeometry(0.055, 0.022, 0.06, 16), AK.std(0xd8b040, { metalness: 0.8, roughness: 0.3 }), 0.49, 0.395, 0); rose.rotation.z = -0.95; g.add(rose); g.add(bar([0.14, 0.2, 0], [0.3, 0.3, 0], 0.006, gal, true));
          g.add(M(new T3.TorusGeometry(0.1, 0.011, 8, 20, Math.PI), gal, -0.17, 0.18, 0)); g.children[g.children.length - 1].rotation.z = Math.PI / 2; g.add(M(new T3.TorusGeometry(0.12, 0.011, 8, 20, Math.PI), gal, 0, 0.31, 0)); const wt = M(new T3.CircleGeometry(0.145, 24), AK.std(0x6fb0d8, { roughness: 0.15, transparent: true, opacity: 0.7 }), 0, 0.27, 0); wt.rotation.x = -Math.PI / 2; g.add(wt); break; }
        case "trowel": { g.add(woodH(0.13, 0.017)); g.add(tube([[0, 0.13, 0], [0, 0.17, 0], [0.02, 0.2, 0], [0.02, 0.23, 0]], 0.007, dark, 8)); const bl = new T3.Shape(); bl.moveTo(-0.04, 0); bl.quadraticCurveTo(-0.045, 0.1, 0, 0.19); bl.quadraticCurveTo(0.045, 0.1, 0.04, 0); bl.closePath(); const bg = new T3.ExtrudeGeometry(bl, { depth: 0.003, bevelEnabled: false, curveSegments: 10 }), p = bg.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + p.getX(i) * p.getX(i) * 9); bg.computeVertexNormals(); const b = M(bg, steel, 0.02, 0.22, 0); b.rotation.y = Math.PI / 2; g.add(b); break; }
        case "handfork": { g.add(woodH(0.13, 0.017)); g.add(tube([[0, 0.13, 0], [0, 0.18, 0], [0.015, 0.21, 0]], 0.007, dark, 8), rot(cyl(0.007, 0.007, 0.08, dark, 0.015, 0.215, 0, 8), Math.PI / 2)); for (const z of [-0.035, 0, 0.035]) g.add(tube([[0.015, 0.215, z], [0.022, 0.27, z], [0.012, 0.33, z], [0.0, 0.37, z]], 0.006, steel, 10)); break; }
        case "dibber": { g.add(woodH(0.24, 0.016, 0.06)); const pt = M(new T3.ConeGeometry(0.017, 0.07, 12), steel, 0, 0.03, 0); pt.rotation.x = Math.PI; g.add(pt); g.add(rot(woodH(0.12, 0.014, 0), 0, 0, Math.PI / 2)); g.children[g.children.length - 1].position.set(0.06, 0.3, 0); break; }
        case "secateurs": case "shears": { const big = type === "shears", L = big ? 0.26 : 0.1, B = big ? 0.24 : 0.07; for (const sd of [-1, 1]) { const arm = new T3.Group(); arm.rotation.z = sd * (big ? 0.2 : 0.24); const h = big ? woodH(L, 0.016) : M(new T3.CapsuleGeometry(0.011, L, 4, 8), AK.std(sd > 0 ? 0xc8321e : 0xd84a34, { roughness: 0.5 }), 0, L / 2, 0); h.position.y = -L - 0.01; arm.add(h); const bs = new T3.Shape(); bs.moveTo(-0.014, 0); bs.lineTo(0.012, 0); bs.quadraticCurveTo(0.02, B * 0.6, 0, B); bs.quadraticCurveTo(-0.012, B * 0.5, -0.014, 0); const bl = M(new T3.ExtrudeGeometry(bs, { depth: 0.003, bevelEnabled: false }), steel, 0, 0.01, sd * 0.002); bl.scale.x = sd; arm.add(bl); g.add(arm); } g.add(rot(cyl(0.009, 0.009, 0.014, zinc(), 0, 0.0, 0, 10), Math.PI / 2)); if (!big) g.add(tube([[-0.02, -0.03, 0], [0, -0.012, 0], [0.02, -0.03, 0]], 0.003, zinc(), 8)); g.position.y = L + 0.02; const w = new T3.Group(); w.add(g); return w; }
        case "pruningknife": case "buddingknife": { const bud = type === "buddingknife"; g.add(woodH(0.11, 0.014)); g.add(cyl(0.015, 0.015, 0.012, AK.std(0xd8b040, { metalness: 0.8, roughness: 0.3 }), 0, 0.112, 0, 12)); const bs = new T3.Shape(); if (bud) { bs.moveTo(-0.009, 0); bs.lineTo(0.009, 0); bs.lineTo(0.009, 0.055); bs.quadraticCurveTo(0.004, 0.08, -0.009, 0.085); } else { bs.moveTo(-0.01, 0); bs.lineTo(0.01, 0); bs.quadraticCurveTo(0.014, 0.06, -0.022, 0.1); bs.quadraticCurveTo(-0.004, 0.05, -0.01, 0); } bs.closePath(); g.add(M(new T3.ExtrudeGeometry(bs, { depth: 0.002, bevelEnabled: false }), steel, 0, 0.118, -0.001)); break; }
        default: return tool0(type);
      }
    } catch (e) { console.error("agric-round3 tool " + type + ": " + e.message); return tool0(type); }
    BK.shadow(g); return g;
  };
})();
