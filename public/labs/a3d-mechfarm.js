/* a3d-mechfarm.js — a standard mechanised farm laid out by department (companion lab for C4-b and C9-d).
   Thirteen departments on one site with working machines: a tractor ploughing, a boom sprayer, a combine harvester and sprinklers.
   Pick a department to fly to it, or switch on the flow of materials between departments.
   Built from the Agricultural Science kit (agric-kit*.js); no model files. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, GK = window.GK, AK = window.AK;
  if (!MK || !AK || !GK) return;
  const T = () => window.THREE, box = AK.box, cyl = AK.cyl;
  const K = 0.42;                                         // machines, animals and people are built at about 1 unit = 1 m; the site uses 1 unit ≈ 2.4 m

  /* flat textured rectangle just above the ground (yards, roads, field surfaces) */
  function patch(g, x0, x1, z0, z1, tex, rep, y, col) {
    const T3 = T(), w = x1 - x0, d = z1 - z0, m = new T3.Mesh(new T3.PlaneGeometry(w, d), AK.pbr(tex, { repeat: [Math.max(1, Math.round(w * (rep || 0.6))), Math.max(1, Math.round(d * (rep || 0.6)))], color: col == null ? 0xffffff : col }));
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y || 0.012, (z0 + z1) / 2); m.receiveShadow = true; g.add(m); return m;
  }
  /* steel-clad farm building with a gable roof. o: col, roofCol, open (no front wall), door (width), win (window strip), brick */
  function hall(w, d, h, o) {
    o = o || {}; const T3 = T(), g = new T3.Group();
    const wall = AK.std(o.col || 0xd8dde2, { roughness: o.brick ? 0.9 : 0.6, metalness: o.brick ? 0 : 0.15 }), roof = AK.std(o.roofCol || 0xc9ced3, { roughness: 0.5, metalness: 0.45 }), base = AK.std(0x6a6e72, { roughness: 0.9 });
    if (o.open) { g.add(box(w, h, 0.05, wall, 0, h / 2, -d / 2), box(0.05, h, d, wall, -w / 2, h / 2, 0), box(0.05, h, d, wall, w / 2, h / 2, 0)); const n = Math.round(w / 1.3); for (let i = 1; i < n; i++) g.add(cyl(0.035, 0.035, h, base, -w / 2 + i * (w / n), h / 2, d / 2, 6)); }
    else { g.add(box(w, h, d, wall, 0, h / 2, 0)); g.add(box(w + 0.03, 0.07, d + 0.03, base, 0, 0.035, 0)); }
    const sh = new T3.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(0, d * 0.2); sh.lineTo(d / 2, 0); sh.closePath();
    for (const x of [-w / 2, w / 2 - 0.04]) { const gb = new T3.Mesh(new T3.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false }), wall); gb.rotation.y = Math.PI / 2; gb.position.set(x, h, 0); g.add(gb); }
    const L = Math.hypot(d / 2, d * 0.2) + 0.1, a = Math.atan2(d * 0.2, d / 2);
    for (const s of [-1, 1]) { const r = box(w + 0.2, 0.03, L, roof, 0, h + d * 0.1 + 0.02, s * (d / 4 + 0.02)); r.rotation.x = s * a; g.add(r); }
    const dark = AK.std(0x2a3038, { roughness: 0.5, metalness: 0.4 }), dw = o.door === 0 ? 0 : o.door || Math.min(0.9, w * 0.3), dx = o.doorX || 0;
    if (!o.open && dw) g.add(box(dw, h * 0.72, 0.03, dark, dx, h * 0.36, d / 2 + 0.012));
    if (o.win) { const gl = AK.std(0x8cc4ee, { roughness: 0.15, metalness: 0.5 }); for (const [a0, a1] of [[-w / 2 + 0.12, dx - dw / 2 - 0.12], [dx + dw / 2 + 0.12, w / 2 - 0.12]]) if (a1 - a0 > 0.2) g.add(box(a1 - a0, h * 0.26, 0.02, gl, (a0 + a1) / 2, h * 0.62, d / 2 + 0.012)); }
    BK.shadow(g); return g;
  }
  function silo(r, h) { const T3 = T(), g = new T3.Group(), m = AK.std(0xdfe4e8, { roughness: 0.38, metalness: 0.55 }); g.add(cyl(r, r, h, m, 0, h / 2 + 0.12, 0, 22)); for (let i = 0; i < 4; i++) g.add(cyl(0.03, 0.03, 0.14, AK.metal(), Math.cos(i * 1.57 + 0.78) * r * 0.8, 0.07, Math.sin(i * 1.57 + 0.78) * r * 0.8, 6)); const c = new T3.Mesh(new T3.ConeGeometry(r * 1.05, r * 0.6, 22), AK.std(0xc3c9cf, { roughness: 0.4, metalness: 0.6 })); c.position.y = h + 0.12 + r * 0.3; g.add(c); BK.shadow(g); return g; }
  function tunnel(L, r) { const T3 = T(), g = new T3.Group(), skin = new T3.MeshPhysicalMaterial({ color: 0xf4f8f4, roughness: 0.35, transparent: true, opacity: 0.42, side: T3.DoubleSide, depthWrite: false }); const m = new T3.Mesh(new T3.CylinderGeometry(r, r, L, 24, 1, true, 0, Math.PI), skin); m.rotation.set(Math.PI / 2, 0, Math.PI / 2); m.renderOrder = 4; g.add(m); g.userData.dyn = true; for (let i = 0; i <= 5; i++) { const hoop = new T3.Mesh(new T3.TorusGeometry(r, 0.012, 6, 20, Math.PI), AK.metal(0xb8bec4)); hoop.position.z = -L / 2 + i * L / 5; g.add(hoop); } return g; }
  function waterTower() { const g = new (T().Group)(); [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].forEach(([x, z]) => g.add(cyl(0.03, 0.03, 1.5, AK.metal(0x7a8086), x, 0.75, z, 6))); g.add(box(0.75, 0.04, 0.75, AK.metal(0x7a8086), 0, 1.5, 0)); const t = AK.tank(0.36, 0.6, 0x1f2a36); t.position.y = 1.52; g.add(t); g.add(cyl(0.025, 0.025, 1.5, AK.std(0x2a6ad8), 0.12, 0.75, 0, 6)); BK.shadow(g); return g; }
  function pond(g, x, z, w, d) { g.add(box(w + 0.24, 0.07, d + 0.24, AK.pbr("brown_mud_02", { repeat: 2 }), x, 0.035, z)); const wat = dynF(GK.water(w, d, 0x3f7a6a, 0.9)); wat.position.set(x, 0.075, z); g.add(wat); g.add(cyl(0.025, 0.025, 0.3, AK.std(0x9aa0a6), x - w / 2 - 0.1, 0.1, z - d / 2 + 0.15, 6)); return wat; }
  /* ---- light, instanced plants: each kind is one merged, vertex-coloured geometry of 20 to 120 triangles ---- */
  function mergeGeo(parts) {
    const T3 = T(); let n = 0; const gs = parts.map(([g, c]) => { const q = g.index ? g.toNonIndexed() : g; n += q.attributes.position.count; return [q, new T3.Color(c)]; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
    gs.forEach(([q, c]) => { const k = q.attributes.position.count; pos.set(q.attributes.position.array, o * 3); nor.set(q.attributes.normal.array, o * 3); for (let i = 0; i < k; i++) { col[(o + i) * 3] = c.r; col[(o + i) * 3 + 1] = c.g; col[(o + i) * 3 + 2] = c.b; } o += k; });
    const out = new T3.BufferGeometry(); out.setAttribute("position", new T3.BufferAttribute(pos, 3)); out.setAttribute("normal", new T3.BufferAttribute(nor, 3)); out.setAttribute("color", new T3.BufferAttribute(col, 3)); return out;
  }
  const at = (g, x, y, z) => { g.translate(x, y, z); return g; };
  function blade(len, w, tilt, ry, y) { const T3 = T(), g = new T3.PlaneGeometry(w, len, 1, 2); g.translate(0, len / 2, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const t = p.getY(i) / len; p.setZ(i, -t * t * len * 0.45); p.setX(i, p.getX(i) * (1 - t * 0.8)); } g.computeVertexNormals(); g.rotateX(tilt); g.rotateY(ry); g.translate(0, y, 0); return g; }
  const blob = (r, det, sy) => { const g = new (T().IcosahedronGeometry)(r, det); g.scale(1, sy || 1, 1); return g; };
  const GEO = {};
  const lowGeo = (kind) => GEO[kind] || (GEO[kind] = (() => {
    const T3 = T(), P = [];
    if (kind === "maize") { P.push([at(new T3.CylinderGeometry(0.018, 0.028, 1, 5), 0, 0.5, 0), 0x86a04a]); for (let i = 0; i < 7; i++) P.push([blade(0.5, 0.085, 0.95, i * 2.4, 0.2 + i * 0.11), i % 2 ? 0x5a9634 : 0x6aa63c]); P.push([at(new T3.ConeGeometry(0.05, 0.16, 4), 0, 1.07, 0), 0xd8c070], [at(blob(0.05, 0, 2.2), 0.05, 0.55, 0), 0xc8d070]); }
    else if (kind === "bush") { P.push([at(blob(0.5, 0, 0.62), 0, 0.3, 0), 0x3f8a36], [at(blob(0.32, 0, 0.7), 0.26, 0.26, 0.12), 0x57a044]); }
    else if (kind === "veg") { P.push([at(blob(0.5, 0, 0.8), 0, 0.38, 0), 0xffffff]); }
    else if (kind === "seedling") { for (let i = 0; i < 4; i++) P.push([blade(0.5, 0.2, 0.7, i * 1.57, 0.05), 0x6ab84a]); }
    else if (kind === "citrus") { P.push([at(new T3.CylinderGeometry(0.05, 0.07, 0.7, 5), 0, 0.35, 0), 0x6a4a30], [at(blob(0.6, 1, 0.9), 0, 1.1, 0), 0x2f7030]); for (let i = 0; i < 7; i++) P.push([at(blob(0.07, 0), 0.56 * Math.cos(i * 0.9), 0.85 + (i % 3) * 0.22, 0.56 * Math.sin(i * 0.9)), 0xf29a1e]); }
    else if (kind === "palm") { P.push([at(new T3.CylinderGeometry(0.07, 0.11, 1.5, 6), 0, 0.75, 0), 0x6e5a42]); for (let i = 0; i < 10; i++) P.push([blade(1.05, 0.3, i % 2 ? 1.25 : 0.85, i * 0.63, 1.5), i % 2 ? 0x3f7a2c : 0x4f8a34]); P.push([at(blob(0.16, 0), 0, 1.45, 0), 0xa8401e]); }
    else { P.push([at(new T3.CylinderGeometry(0.06, 0.1, 1.2, 6), 0, 0.6, 0), 0x6a5038], [at(blob(0.7, 1, 0.85), 0, 1.75, 0), kind === "tree2" ? 0x3f8236 : 0x2f6a2c], [at(blob(0.45, 0, 0.8), 0.45, 1.45, 0.2), kind === "tree2" ? 0x5a9a44 : 0x3f7a34]); }
    return mergeGeo(P);
  })());
  /* pts: [[x, z, scale, rotation, colour?]] */
  function inst(g, kind, pts, shadow) {
    const T3 = T(); if (!pts.length) return; const im = new T3.InstancedMesh(lowGeo(kind), new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: T3.DoubleSide }), pts.length), m4 = new T3.Matrix4(), q = new T3.Quaternion(), up = new T3.Vector3(0, 1, 0), col = new T3.Color();
    pts.forEach(([x, z, sc, r, c], i) => { q.setFromAxisAngle(up, r == null ? (x * 12.9898 + z * 78.233) % 6.283 : r); m4.compose(new T3.Vector3(x, 0, z), q, new T3.Vector3(sc, sc, sc)); im.setMatrixAt(i, m4); if (c != null) im.setColorAt(i, col.set(c)); });
    im.castShadow = !!shadow; im.receiveShadow = false; g.add(im); return im;
  }
  function rows(a, dx, dz, sc, jit, skip, col) { const out = [], r = BK.rng(Math.round(Math.abs(a[0] * 7 + a[2] * 13)) + 3); for (let x = a[0]; x <= a[1] + 1e-6; x += dx) for (let z = a[2]; z <= a[3] + 1e-6; z += dz) { if (skip && skip(x, z)) continue; out.push([x + (r() - 0.5) * jit, z + (r() - 0.5) * jit, sc * (0.85 + r() * 0.3), r() * 6.28, typeof col === "function" ? col(x, z) : col]); } return out; }
  /* post-and-rail fence as a handful of long boxes */
  function rails(g, x0, z0, x1, z1, h) { const L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(z1 - z0, x1 - x0), m = AK.std(0xe8e2d2, { roughness: 0.8 }); for (const y of [h * 0.5, h]) { const r = box(L, 0.03, 0.03, m, (x0 + x1) / 2, y, (z0 + z1) / 2); r.rotation.y = -a; r.castShadow = false; g.add(r); } const n = Math.max(1, Math.round(L / 1.3)); for (let i = 0; i <= n; i++) { const p = box(0.05, h + 0.06, 0.05, m, x0 + (x1 - x0) * i / n, (h + 0.06) / 2, z0 + (z1 - z0) * i / n); p.castShadow = false; g.add(p); } }
  const put = (g, o, x, z, ry, s) => { o.position.set(x, 0, z); if (ry) o.rotation.y = ry; if (s) o.scale.multiplyScalar(s); g.add(o); return o; };

  /* merge every static mesh that shares a material into one mesh, so hundreds of small parts become a few dozen draw calls.
     Anything inside an object flagged userData.dyn (moving machines, grazing cattle, water) is left alone. */
  function bake(g) {
    const T3 = T(); g.updateMatrixWorld(true); const inv = new T3.Matrix4().copy(g.matrixWorld).invert(), groups = new Map(), kill = [], OK = ["position", "normal", "uv", "color", "uv1", "uv2"];
    const dyn = (o) => { for (let q = o; q && q !== g; q = q.parent) if (q.userData.dyn) return true; return false; };
    g.traverse((o) => { if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || !o.visible || dyn(o)) return; const a = o.geometry.attributes; if (!a.position || !a.normal || !Object.keys(a).every((k) => OK.includes(k))) return;
      const key = o.material.uuid + (o.castShadow ? "c" : "") + (o.receiveShadow ? "r" : ""); if (!groups.has(key)) groups.set(key, { mat: o.material, cs: o.castShadow, rs: o.receiveShadow, list: [] }); groups.get(key).list.push(o); });
    groups.forEach((G) => {
      const mt = G.mat, needUv = !!(mt.map || mt.normalMap || mt.roughnessMap || mt.bumpMap || mt.aoMap), needCol = !!mt.vertexColors, list = G.list.filter((o) => (!needUv || o.geometry.attributes.uv) && (!needCol || o.geometry.attributes.color));
      if (list.length < 2) return; let n = 0; const m4 = new T3.Matrix4();
      const parts = list.map((o) => { const q = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); m4.multiplyMatrices(inv, o.matrixWorld); q.applyMatrix4(m4); q.userData.flip = m4.determinant() < 0; n += q.attributes.position.count; return q; });
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = needUv ? new Float32Array(n * 2) : null, col = needCol ? new Float32Array(n * 3) : null; let off = 0;
      parts.forEach((q) => { const k = q.attributes.position.count, P = q.attributes.position.array, N = q.attributes.normal.array, U = uv && q.attributes.uv.array, C = col && q.attributes.color.array;
        for (let i = 0; i < k; i++) { let j = i; if (q.userData.flip) { const r = i % 3; j = r === 1 ? i + 1 : r === 2 ? i - 1 : i; } const d = off + i; pos[d * 3] = P[j * 3]; pos[d * 3 + 1] = P[j * 3 + 1]; pos[d * 3 + 2] = P[j * 3 + 2]; nor[d * 3] = N[j * 3]; nor[d * 3 + 1] = N[j * 3 + 1]; nor[d * 3 + 2] = N[j * 3 + 2]; if (uv) { uv[d * 2] = U[j * 2]; uv[d * 2 + 1] = U[j * 2 + 1]; } if (col) { col[d * 3] = C[j * 3]; col[d * 3 + 1] = C[j * 3 + 1]; col[d * 3 + 2] = C[j * 3 + 2]; } }
        off += k; q.dispose(); });
      const out = new T3.BufferGeometry(); out.setAttribute("position", new T3.BufferAttribute(pos, 3)); out.setAttribute("normal", new T3.BufferAttribute(nor, 3)); if (uv) { out.setAttribute("uv", new T3.BufferAttribute(uv, 2)); if (mt.aoMap) out.setAttribute("uv1", new T3.BufferAttribute(uv, 2)); } if (col) out.setAttribute("color", new T3.BufferAttribute(col, 3));
      const mesh = new T3.Mesh(out, mt); mesh.castShadow = G.cs; mesh.receiveShadow = G.rs; g.add(mesh); list.forEach((o) => kill.push(o));
    });
    kill.forEach((o) => { if (o.parent) o.parent.remove(o); });
  }
  const dynF = (o) => { o.userData.dyn = true; return o; };

  const DEPTS = [
    { id: "admin", n: "Administration and gate", p: [-5, 1.5, 6.4], d: "The farm office plans the work, keeps records and accounts and pays staff. The gatehouse and weighbridge check and weigh everything that enters or leaves.", m: "Computers, weighbridge, radios" },
    { id: "mach", n: "Machinery and workshop", p: [-5.4, 1.6, 1.2], d: "Tractors, implements and the combine are parked, serviced and repaired here. It sits in the middle of the farm so every field is a short drive away; fuel is stored apart for safety.", m: "Tractors, plough, harrow, ridger, planter, boom sprayer, combine, trailer, welding and service tools" },
    { id: "crop", n: "Arable fields", p: [-11, 1.3, -3.6], cam: [[-9.5, 8, 8.5], [-9.5, 0, -3.6]], d: "Large rectangular fields let machines work in long straight runs. Here one field is being ploughed, one sprayed and the ripe maize is being combine-harvested.", m: "Disc plough, harrow, planter, boom sprayer, combine harvester" },
    { id: "irrig", n: "Irrigation and vegetables", p: [-4.6, 1.0, -2.1], cam: [[-3.2, 4.6, 3.4], [-3.4, 0.2, -2.0]], d: "A borehole pump fills the overhead tank; pipes and sprinklers water the vegetable beds in the dry season so the farm produces all year.", m: "Borehole pump, overhead tank, sprinklers and drip lines" },
    { id: "nurs", n: "Nursery and orchard", p: [3.4, 1.2, -4.2], cam: [[4.4, 6.5, 3.6], [3.4, 0, -4.4]], d: "Seedlings are raised under cover and hardened off before transplanting. Citrus and oil palm stand on a square grid so slashers and sprayers can drive between the rows.", m: "Seed trays, misting system, slasher, orchard sprayer" },
    { id: "store", n: "Storage and processing", p: [3.2, 2.2, 1.2], d: "Grain is dried and held in metal silos; the warehouse keeps seed, fertilizer and chemicals; the feed mill grinds maize and soya into livestock feed.", m: "Grain dryer, elevators and augers, silos, sheller, feed mill and mixer" },
    { id: "cattle", n: "Cattle unit", p: [10.6, 1.6, -6], cam: [[12.6, 6, 1.6], [11, 0.2, -6]], d: "Cows are housed in the barn, milked by machine in the parlour and grazed in fenced paddocks in rotation. Hay and silage are stored beside the barn.", m: "Milking machine, bulk milk cooler, forage chopper, baler, water troughs" },
    { id: "small", n: "Goats, sheep and pigs", p: [9.6, 1.1, -2.2], d: "Goats and sheep are kept on raised slatted floors; pigs in concrete pens that are easy to wash, with automatic drinkers.", m: "Automatic drinkers, feed troughs, pressure washer" },
    { id: "poultry", n: "Poultry unit", p: [10.6, 1.2, 1.5], d: "Long, narrow houses run east to west for shade and ventilation. Layers and broilers are fed and watered automatically; eggs are collected and graded each day.", m: "Incubator, brooder, automatic feeders, nipple drinkers, egg grader, feed bins" },
    { id: "fish", n: "Fishery", p: [11, 0.7, 6.7], cam: [[11.5, 5, 13], [10.6, 0, 6.4]], d: "Ponds lie on the lowest ground with inlet and outlet pipes. Fingerlings come from the hatchery; rich pond water can be used to irrigate crops.", m: "Water pump, aerators, hatchery tanks, harvest nets" },
    { id: "vet", n: "Vet clinic and laboratory", p: [-9.6, 1.3, 6.4], d: "Animals are vaccinated and treated and new stock is quarantined. The laboratory tests soil, feed and water so that inputs match need.", m: "Vaccine fridge, microscope, soil test kit, weighing crate" },
    { id: "sales", n: "Sales and cold store", p: [3.4, 1.5, 6.4], d: "Produce is graded, packed and kept cool, then loaded on to vehicles. It stands by the gate so buyers do not drive through the farm.", m: "Grader, packing line, cold room, forklift, delivery truck" },
    { id: "waste", n: "Manure and biogas", p: [13.2, 1.1, -9.4], d: "Dung and litter are composted or fed to a biogas digester, far from the offices and downwind. The gas is used for power; the slurry goes back to the fields as manure.", m: "Manure spreader, biogas digester, generator" },
  ];
  const FLOWS = [
    [[-10.5, 1.5, -1], [1.6, 2.6, 0.4], 0xf2c21a, "Harvest → silos"], [[3.4, 1.4, 2.8], [9, 1.3, 1.6], 0xff9a3a, "Feed"], [[3.6, 1.4, 1.6], [9.2, 1.5, -5.2], 0xff9a3a, ""],
    [[4.6, 1.4, 2.6], [3.6, 1.4, 5.6], 0x5bd68c, "Produce → sales"], [[9.2, 1.2, 2.9], [5, 1.3, 6.1], 0x5bd68c, "Eggs and milk"],
    [[11.6, 1.3, -7.4], [13.1, 1.2, -9.0], 0xb07a4a, "Manure"], [[12.4, 1.9, -9.9], [-4.6, 1.9, -9.6], 0xb07a4a, "Compost and slurry → fields"],
    [[-5.8, 1.5, 0.2], [-10.6, 1.3, -5.4], 0x7cb3ff, "Machines"], [[0.2, 1.7, -1.7], [-3.2, 0.9, -2.0], 0x6ad8ff, "Water"],
  ];

  function buildFarm(g, S, s, c) {
    const T3 = T(); s.mv = []; s.spin = []; s.herd = []; s.rain = null;
    const inR = (x, z, a) => x > a[0] && x < a[1] && z > a[2] && z < a[3];
    const F1 = [-13.7, -8.3, -3.3, 1.3], F2 = [-13.7, -8.3, -9.2, -4.2], F3 = [-7.5, -2.1, -9.2, -4.2], F4 = [-7.5, -2.1, -3.5, -0.7], PAD = [11.7, 14.6, -8.3, -3.2];
    AK.ground(g, { w: 32, d: 22, amp: 0, h: () => 0, nx: 64, tex: "grass_ground", rep: 22, grassCol: 0x5f8238, fieldFn: (x, z) => (inR(x, z, F1) || inR(x, z, F3) || inR(x, z, F4) ? 0.9 : inR(x, z, F2) ? 1 : 0) });
    /* roads and yards */
    patch(g, -16, 16, 8.7, 9.7, "Asphalt031", 0.5, 0.014);
    patch(g, -1.6, -0.4, -9.6, 8.7, "red_laterite_soil_stones", 0.45); patch(g, -14.6, 14.6, 3.7, 4.5, "red_laterite_soil_stones", 0.45, 0.013); patch(g, -0.4, 14.6, -3.9, -3.3, "red_laterite_soil_stones", 0.45, 0.013); patch(g, 6.6, 7.3, -9.6, 3.7, "red_laterite_soil_stones", 0.45, 0.0125);
    patch(g, -7.6, -1.8, -0.2, 3.5, "concrete_floor_worn_001", 0.4, 0.011); patch(g, -0.2, 6.4, -0.4, 3.5, "concrete_floor_worn_001", 0.4, 0.011); patch(g, 1.2, 5.6, 5.0, 8.4, "concrete_floor_worn_001", 0.4, 0.011); patch(g, -7.2, -2.6, 7.3, 8.4, "red_laterite_soil_stones", 0.45, 0.011);
    patch(g, F2[0], F2[1], F2[2], F2[3] - 2.4, "farm_furrows", 0.5, 0.012); patch(g, F2[0], F2[1], F2[3] - 2.4, F2[3], "sparse_grass", 0.5, 0.012, 0xb8a878);
    patch(g, PAD[0], PAD[1], PAD[2], PAD[3], "grass_ground", 0.5, 0.012, 0xb8e078);

    /* 1 administration, gate, weighbridge */
    put(g, hall(3.2, 1.5, 1.0, { brick: true, col: 0xf0e6d2, roofCol: 0xb8553a, win: 1, door: 0.4 }), -5, 6.2);
    for (const x of [-1.75, -0.25]) g.add(box(0.14, 0.9, 0.14, AK.std(0xe8e2d6), x, 0.45, 8.6)); g.add(box(1.7, 0.22, 0.06, AK.std(0x1e4a2a), -1, 1.0, 8.6));
    put(g, hall(0.7, 0.6, 0.62, { brick: true, col: 0xf0e6d2, roofCol: 0xb8553a, win: 1, door: 0.22 }), 0.15, 8.0);
    g.add(box(1.1, 0.03, 1.5, AK.metal(0x9aa0a6), -1, 0.03, 6.7));
    put(g, hall(1.1, 0.9, 0.7, { brick: true, col: 0xe6d8c0, roofCol: 0x8a4a3a, win: 1, door: 0.25 }), -13.2, 6.3); put(g, hall(1.1, 0.9, 0.7, { brick: true, col: 0xe6d8c0, roofCol: 0x8a4a3a, win: 1, door: 0.25 }), -11.8, 7.5);
    /* 11 vet and laboratory */
    put(g, hall(2.2, 1.3, 0.9, { brick: true, col: 0xf6f6f2, roofCol: 0x3a7a5a, win: 1, door: 0.35 }), -9.4, 6.2); g.add(box(0.3, 0.09, 0.02, AK.std(0xd82a2a), -9.4, 0.82, 6.87), box(0.09, 0.3, 0.02, AK.std(0xd82a2a), -9.4, 0.82, 6.87));
    /* 12 sales, cold store, loading bay */
    put(g, hall(3.2, 1.7, 1.15, { col: 0xf2f4f6, roofCol: 0x3a6aa8, door: 1.0, doorX: -0.7, win: 1 }), 3.4, 6.0);
    for (let i = 0; i < 6; i++) { const cr = AK.crate(i % 2 ? 0xd8b070 : 0xffffff); put(g, cr, 2.2 + (i % 3) * 0.2, 7.2 + Math.floor(i / 3) * 0.16, 0, K); cr.position.y = 0.012; }
    const truck = AK.tractor(0x2a5aa8); truck.add((() => { const t = AK.implement("trailer"); t.position.x = -1.3; return t; })()); put(g, truck, 4.2, 7.7, Math.PI, K);
    /* 2 machinery shed, workshop, fuel */
    put(g, hall(4.2, 1.7, 1.25, { open: 1, col: 0x4a7a4a, roofCol: 0xd8dde2 }), -5.6, 0.75);
    if (AK.model) [["old_military_compressor", 1.15, -4.3, 1.25, 0.3], ["portable_generator", 0.62, -4.75, 1.3, -0.2], ["old_tyre", 0.75, -6.9, 1.35, 0], ["Barrel_01", 0.9, -7.3, 1.3, 0], ["tool_cart", 0.95, -5.2, 1.3, 0.2]].forEach(([id, sz, x, z, ry]) => g.add(AK.model(id, { fit: sz * K, at: [x, 0.012, z], ry })));
    const t2 = AK.tractor(0x2a8a3a); t2.add((() => { const o = AK.implement("ridger"); o.position.x = -1.3; return o; })()); put(g, t2, -5.9, 0.75, -Math.PI / 2, K);
    ["planter", "harrow", "mouldboard"].forEach((k, i) => put(g, AK.implement(k), -4.9 + i * 0.55, 0.7, -Math.PI / 2, K));
    put(g, hall(1.8, 1.3, 1.0, { col: 0x8a9aa8, roofCol: 0xd8dde2, door: 0.8 }), -3.0, 2.5);
    const fuel = cyl(0.26, 0.26, 0.9, AK.paint(0xc8321e), -7.1, 0.5, 2.9, 20); fuel.rotation.z = Math.PI / 2; g.add(fuel, box(0.7, 0.24, 0.3, AK.std(0x5a5a5a), -7.1, 0.12, 2.9));
    /* 6 storage and processing */
    for (let i = 0; i < 3; i++) put(g, silo(0.5, 1.9), 1.0 + i * 1.15, 0.4);
    g.add(AK.pipe([[0.6, 0.2, 1.1], [1.0, 2.5, 0.4], [2.15, 2.6, 0.4], [3.3, 2.5, 0.4]], 0.03, 0x8a9096));
    put(g, hall(2.5, 1.7, 1.2, { col: 0xc8a86a, roofCol: 0xd8dde2, door: 0.9 }), 5.0, 0.7);
    put(g, hall(1.7, 1.2, 1.3, { col: 0x3a6aa8, roofCol: 0xd8dde2, door: 0.6 }), 1.6, 2.6); g.add(AK.pipe([[2.75, 0.5, 2.6], [2.5, 1.5, 2.6], [2.2, 1.6, 2.6]], 0.03, 0x8a9096));
    patch(g, 3.9, 6.2, 2.2, 3.4, "concrete_floor_worn_001", 1, 0.016, 0xf0d890);
    for (let i = 0; i < 8; i++) { const sk = AK.sack(i % 2 ? 0xe8dcc0 : 0xd8c8a0); put(g, sk, 3.6 + (i % 4) * 0.17, 1.9 + Math.floor(i / 4) * 0.13, i, K); }
    /* 9 poultry */
    for (const z of [0.5, 2.5]) { put(g, hall(5.2, 1.0, 0.7, { col: 0xf2ead2, roofCol: 0xd8dde2, door: 0.3, doorX: -2.3, win: 1 }), 10.7, z); const bin = silo(0.2, 0.7); put(g, bin, 13.6, z - 0.1); }
    ["layer", "cock"].forEach((k, i) => put(g, AK.bird(k), 8.0 + i * 0.3, 1.5 + (i % 2) * 0.2, i * 1.3, K * 1.2));
    /* 10 fishery */
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) pond(g, 9.0 + i * 2.1, 5.6 + j * 1.5, 1.8, 1.2);
    put(g, hall(1.2, 0.9, 0.7, { col: 0x5a9ab8, roofCol: 0xd8dde2, door: 0.3 }), 6.9, 7.4);
    /* 4 irrigation and vegetables */
    put(g, waterTower(), 0.5, -1.5); put(g, hall(0.6, 0.6, 0.55, { brick: true, col: 0xe8e2d6, roofCol: 0x3a6aa8, door: 0.2 }), 0.5, -2.7); const pm = AK.machine("pump"); put(g, pm, 0.5, -2.15, 0, K);
    g.add(AK.pipe([[0.4, 0.04, -1.5], [-1.9, 0.04, -1.5], [-2.3, 0.04, -2.1], [-7.3, 0.04, -2.1]], 0.02, 0x2a6ad8));
    [0x3f8a36, 0x6aa63c, 0x2f7a3a, 0x8a3a5a, 0x7ab84a].forEach((cc, i) => inst(g, "veg", rows([-7.1, -2.5, -3.2 + i * 0.5, -3.2 + i * 0.5 + 0.2], 0.24, 0.2, 0.2, 0.04, null, cc)));
    for (let i = 0; i < 4; i++) g.add(cyl(0.012, 0.012, 0.3, AK.metal(0xc8ccd0), -6.6 + i * 1.3, 0.15, -2.1, 6));
    s.rain = AK.rain(160, 5, 0.42); s.rain.position.set(-4.8, 0.05, -2.1); s.rain.scale.set(1, 1, 0.75); g.add(s.rain);
    /* 3 arable fields */
    inst(g, "maize", rows([F1[0] + 0.25, F1[1] - 0.25, F1[2] + 0.25, 0.1], 0.27, 0.36, 0.78, 0.05));
    patch(g, F1[0], F1[1], 0.35, F1[3], "sparse_grass", 0.6, 0.012, 0xd8c890);
    const comb = dynF(AK.combine()); comb.traverse((q) => { if (q.isMesh && q.material.transmission) q.material = AK.std(0x9ccdf0, { roughness: 0.15, metalness: 0.5 }); }); put(g, comb, -11, 0.72, 0, K * 0.85); s.mv.push({ o: comb, x0: F1[0] + 0.9, x1: F1[1] - 0.9, sp: 0.35, dir: 1, base: 0 });
    const tp = dynF(AK.tractor(0xc8321e)); tp.add((() => { const o = AK.implement("disc"); o.position.x = -1.3; return o; })()); put(g, tp, -11, F2[3] - 2.75, 0, K); s.mv.push({ o: tp, x0: F2[0] + 0.7, x1: F2[1] - 0.7, sp: 0.55, dir: 1, base: 0 }); s.spin.push(tp);
    inst(g, "bush", rows([F3[0] + 0.25, F3[1] - 0.25, F3[2] + 0.25, F3[3] - 0.25], 0.26, 0.38, 0.3, 0.04, (x, z) => Math.abs(z + 6.7) < 0.3));
    const ts = dynF(AK.tractor(0x2a5aa8)); ts.add((() => { const o = AK.implement("sprayer"); o.position.x = -1.3; return o; })()); put(g, ts, -5, -6.7, 0, K); s.mv.push({ o: ts, x0: F3[0] + 0.7, x1: F3[1] - 0.7, sp: 0.45, dir: -1, base: 0 }); s.spin.push(ts);
    /* 5 nursery, greenhouse, orchard */
    for (const x of [2.2, 4.0]) { const tn = tunnel(2.2, 0.55); tn.position.set(x, 0, -1.9); g.add(tn); inst(g, "seedling", rows([x - 0.33, x + 0.33, -2.8, -1.0], 0.22, 0.2, 0.2, 0.02)); }
    patch(g, 5.0, 6.3, -2.9, -0.9, "raked_dirt", 1, 0.012); inst(g, "citrus", rows([5.2, 6.1, -2.7, -1.1], 0.3, 0.3, 0.13, 0.02));
    const cit = [], palm = []; for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) (j < 3 ? cit : palm).push([0.9 + i * 1.2, -5.0 - j * 1.25, j < 3 ? 0.62 : 0.8, i * 1.3 + j]);
    inst(g, "citrus", cit, true); inst(g, "palm", palm, true);
    /* 7 cattle */
    put(g, hall(4.0, 1.9, 1.2, { open: 1, col: 0xa8442e, roofCol: 0xd8dde2 }), 9.4, -7.0); put(g, hall(2.0, 1.2, 0.9, { col: 0xf2f4f6, roofCol: 0x3a6aa8, door: 0.5, win: 1 }), 9.0, -4.9);
    const mk = AK.machine("milker"); put(g, mk, 10.4, -4.6, 0, K); put(g, AK.tank(0.3, 0.5, 0xd8dde2), 8.0, -5.6);
    ["holstein", "holstein"].forEach((k, i) => { const a = AK.animal(k); put(g, a, 8.6 + i * 1.2, -6.6, Math.PI / 2, K); });
    rails(g, PAD[0], PAD[2], PAD[1], PAD[2], 0.3); rails(g, PAD[1], PAD[2], PAD[1], PAD[3], 0.3); rails(g, PAD[1], PAD[3], PAD[0], PAD[3], 0.3); rails(g, PAD[0], PAD[3], PAD[0], PAD[2], 0.3); rails(g, PAD[0], -5.7, PAD[1], -5.7, 0.3);
    [["ndama", 12.6, -7.2, 0.6], ["whitefulani", 13.6, -6.5, 2.4], ["holstein", 13.0, -4.4, 4.0]].forEach(([k, x, z, r], i) => { const a = dynF(AK.animal(k)); put(g, a, x, z, r, K); s.herd.push({ a, graze: i === 0 ? 1 : 0, ph: i * 1.7 }); });
    for (let i = 0; i < 5; i++) { const b = cyl(0.2, 0.2, 0.32, AK.pbr("thatch_roof_angled", { repeat: 1 }), 11.0 + (i % 3) * 0.36, 0.2 + Math.floor(i / 3) * 0.36, -8.9 - (i > 2 ? 0.02 : 0), 16); b.rotation.x = Math.PI / 2; g.add(b); }
    /* 8 small ruminants and piggery */
    put(g, AK.building("pen", { w: 2.0, d: 1.1, h: 0.6, roof: "corrugated_iron_02" }), 8.6, -2.2); ["wad", "redsokoto"].forEach((k, i) => { const a = AK.animal(k); put(g, a, 8.2 + i * 0.7, -2.2 + (i % 2) * 0.2, 0.5 + i, K); });
    put(g, hall(2.2, 1.1, 0.6, { brick: true, col: 0xd8d2c6, roofCol: 0xd8dde2, door: 0.3, doorX: -0.8 }), 11.4, -2.2); put(g, AK.animal("pig"), 11.2, -1.35, 0.4, K);
    /* 13 manure, compost, biogas */
    const dome = new T3.Mesh(new T3.SphereGeometry(0.55, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), AK.std(0x2e3a2e, { roughness: 0.6 })); dome.position.set(13.4, 0.02, -9.6); g.add(dome); g.add(AK.pipe([[13.4, 0.56, -9.6], [13.4, 0.75, -9.6], [12.6, 0.75, -9.6], [12.6, 0.2, -9.6]], 0.02, 0xf2c21a));
    for (let i = 0; i < 3; i++) { const hp = new T3.Mesh(new T3.SphereGeometry(0.34, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), AK.pbr("brown_mud_02", { repeat: 1, color: 0x8a6a4a })); hp.scale.set(1.5, 0.7, 1); hp.position.set(10.9 + i * 0.95, 0.01, -9.9); g.add(hp); }
    /* shelter belt and people */
    const tr = [[], []]; for (let i = 0; i < 34; i++) tr[i % 2].push([-15.2 + i * 0.92, -10.5 + (i % 3) * 0.2, 0.5 + (i % 4) * 0.06, i]); for (let i = 0; i < 12; i++) tr[i % 2].push([-15.4 + (i % 2) * 0.2, -9.4 + i * 1.5, 0.5 + (i % 3) * 0.07, i]); for (let i = 0; i < 6; i++) tr[i % 2].push([[-7.6, -2.2, 5.9, 7.2, -14.2, 14.9][i], [8.0, 5.2, 8.1, 5.1, 4.9, 3.0][i], 0.42, i]);
    inst(g, "tree", tr[0], true); inst(g, "tree2", tr[1], true);
    [[-4.4, 7.4, 0.4, 0x2a6ad8], [-0.2, 7.2, 2.2, 0x3a3a4a], [2.8, 7.6, 1.2, 0xe8e8e0], [-3.6, 1.6, 4.1, 0xd87a1a], [9.6, -5.6, 3.0, 0xf2f2f2]].forEach(([x, z, r, col]) => put(g, AK.person({ shirt: col }), x, z, r, K));
    /* wind arrow */
    g.add(GK.arrow([-13.5, 3.2, 9.4], [-11.2, 3.2, 7.6], 0x9ad8ff, 0.06));
    s.flow = new T3.Group(); FLOWS.forEach(([a, b, col]) => s.flow.add(GK.arrow(a, b, col, 0.05))); s.flow.visible = false; s.flow.userData.dyn = true; g.add(s.flow);
    bake(g);
  }

  const def = {
    title: "A mechanised farm and its departments",
    blurb: "A standard commercial farm seen from the air: thirteen departments, each with its own buildings and machines. Pick a department to fly to it, watch the machines at work, and show how materials flow between departments.",
    label: "Photoreal 3D lab: mechanised farm tour", flabel: "Department", sky: "farm_field", envX: { shadowExtent: 19, sunPos: [12, 18, 9] },
    cam: [[5.5, 18, 23.5], [5.5, 0, -1.2]], fov: 42, fly: [2.6, 3.4, 5.6], maxSteps: 14,
    values: { work: 1, flow: 0 },
    controls: [{ type: "toggle", key: "work", label: "Machines working" }, { type: "toggle", key: "flow", label: "Show flow of materials" }],
    build: buildFarm,
    tick(S, s, c, dt) {
      if (!s.mv) return; s.tt = (s.tt || 0) + dt;
      if (s.flow) s.flow.visible = !!c.flow;
      if (s.rain) { s.rain.visible = !!c.work; if (c.work) s.rain.step(dt, 1); }
      s.herd.forEach((h) => AK.animate(h.a, s.tt + h.ph, 0, h.graze));
      if (!c.work) return;
      s.mv.forEach((m) => { m.o.position.x += m.dir * m.sp * dt; if (m.o.position.x > m.x1) { m.dir = -1; } else if (m.o.position.x < m.x0) { m.dir = 1; } m.o.rotation.y = m.dir > 0 ? 0 : Math.PI; });
      s.spin.forEach((t) => t.wheels && t.wheels.forEach((w, i) => { w.rotation.z -= dt * (i < 2 ? 1.6 : 2.8); }));
    },
    overlay(ctx, s, c, S, B) {
      const q = MK.proj(S, -12.3, 3.5, 8.5); if (q.z < 1) B.pill("Prevailing wind", q.x, q.y - 12, "#9ad8ff", 10, "center");
      if (c.flow) FLOWS.forEach(([a, b, col, t]) => { if (!t) return; const m = MK.proj(S, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.25, (a[2] + b[2]) / 2); if (m.z < 1) B.pill(t, m.x, m.y, "#" + col.toString(16).padStart(6, "0"), 10, "center"); });
    },
    feats: (c) => (c && c.flow ? DEPTS.map((F) => Object.assign({}, F, { lp: [F.p[0], -400, F.p[2]] })) : DEPTS),
    notes: (c) => c.flow ? [["Follow the arrows: crops go to the silos, grain becomes feed, feed becomes eggs, milk and meat, and manure returns to the fields.", "#b9f08a"], "Nothing is wasted: the departments feed one another."]
      : [["Why it is laid out this way", "#9fc3ff"], "Office and sales by the gate; machinery in the centre; fields large and rectangular.", "Livestock and manure downwind of the offices and stores; fish ponds on the lowest ground.", "All-weather roads link every department; fuel and chemicals are stored apart."],
    readouts: (s, c) => { const F = DEPTS.find((x) => x.id === c.f) || DEPTS[0]; return [["Department", F.n], ["Machines", F.m], ["Departments on site", String(DEPTS.length)]]; },
    table: () => MK.table(["Department", "Work done", "Machines and equipment"], DEPTS.map((D) => [D.n, D.d.split(". ")[0] + ".", D.m])),
    tasks: ["Visit every department and list one machine used in each.", "Explain why the cattle, pig and manure units are in the north-east corner when the wind blows from the south-west.", "Switch on the flow of materials. Draw the cycle: field → silo → feed mill → animals → manure → field.", "Give four advantages and three limitations of running a farm like this in West Africa.", "Sketch the layout and mark the roads, the water supply and the gate."],
    note: "A teaching layout, not a survey of a real farm: buildings are drawn larger than the fields for clarity, and one map unit is roughly 2.4 m.",
  };
  AK.tour("C4-b#farm", def);
  if (MK.scenes["C4-b#farm"]) { MK.scenes["C4-b#farm"].label = def.label; MK.scenes["C9-d#farm"] = MK.scenes["C4-b#farm"]; }
})();
