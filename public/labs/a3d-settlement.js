/* a3d-settlement.js — two companion labs for the Agricultural Science lab.
   1. C9-d#settlement: a standard farm settlement with a forest reserve, bush fallow, arable plots, a tree-crop plantation,
      houses, farm office and stores, livestock and a fish pond. Understorey plants, shrubs and two tree species are real
      scanned or modelled plants (Poly Haven, CC0); West African crops and timber trees come from the lab's plant kit.
   2. C2-a#three: three farm machines (tractor, disc plough, seed planter) built part by part, with the use of every part.
   Every model file has a code-built stand-in, so both labs work without the files. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, GK = window.GK, AK = window.AK;
  if (!MK || !AK || !GK || !AK.scatter) return;
  const T = () => window.THREE, box = AK.box, cyl = AK.cyl;
  const K = 0.42;                                             // 1 map unit ≈ 2.4 m, so 1 m ≈ 0.42 units

  /* ============================== 1. farm settlement ============================== */
  function patch(g, x0, x1, z0, z1, tex, rep, y, col) {
    const T3 = T(), w = x1 - x0, d = z1 - z0, m = new T3.Mesh(new T3.PlaneGeometry(w, d), AK.pbr(tex, { repeat: [Math.max(1, Math.round(w * (rep || 0.6))), Math.max(1, Math.round(d * (rep || 0.6)))], color: col == null ? 0xffffff : col }));
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y || 0.012, (z0 + z1) / 2); m.receiveShadow = true; g.add(m); return m;
  }
  /* n scattered points in a rectangle: [x, 0, z, scale, turn]; keep(x, z) can reject a spot */
  function spots(n, x0, x1, z0, z1, s0, s1, seed, keep) {
    const r = BK.rng(seed), out = []; let guard = 0;
    while (out.length < n && guard++ < n * 30) { const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0); if (keep && !keep(x, z)) continue; out.push([x, 0, z, s0 + r() * (s1 - s0), r() * 6.283]); }
    return out;
  }
  const PLOTS = [["maize", 1.2, 7.4, -5.4, -1.7, 0.5, 0.3], ["cassava", 8.2, 14.4, -5.4, -1.7, 0.75, 0.3], ["cowpea", 1.2, 7.4, -0.9, 2.8, 0.45, 0.26], ["tomato", 8.2, 11.1, -0.9, 2.8, 0.5, 0.26], ["okra", 11.5, 14.4, -0.9, 2.8, 0.5, 0.26]];
  const ZONES = [
    { id: "forest", n: "Forest reserve", p: [-6, 2.6, -8.6], d: "Natural high forest kept at the edge of the farm. It protects the watershed and the soil, breaks the wind, shelters wildlife and pollinators, and supplies timber, firewood and medicines. Tall trees form the canopy; ferns, seedlings and fallen logs cover the floor." },
    { id: "bush", n: "Bush fallow", p: [9.5, 1.0, -8.6], d: "Land rested after cropping. Shrubs, grasses and weeds grow back, their roots and leaf litter restore organic matter and nutrients, and the cover stops erosion. After some years it is cleared and cropped again (shifting cultivation and bush fallowing)." },
    { id: "arable", n: "Arable crop plots", p: [7.8, 0.9, -3.4], d: "Annual food crops in rotation on ridged, rectangular plots: maize (cereal), cassava (root), cowpea (legume, fixes nitrogen) and vegetables. Rectangular plots suit tractors and make spacing and records simple." },
    { id: "veg", n: "Irrigated vegetables", p: [11.3, 0.8, 1.0], d: "Tomato and okra beside the water channel. Vegetables need frequent watering, so they are sited nearest the water source and the farmhouse for close care." },
    { id: "tree", n: "Tree-crop plantation", p: [-11.6, 1.8, -2.2], d: "Permanent crops: oil palm in triangular spacing with cocoa and plantain under shade. Tree crops occupy the land for many years, so they are placed on deep, well-drained soil away from the annual rotation." },
    { id: "homes", n: "Residential quarter", p: [-4.2, 1.3, -2.0], d: "Houses for the farm families with a well, shade trees and a compound fence. Homes are upwind of livestock, on raised ground, and close to the road, water and the farm office." },
    { id: "office", n: "Farm office, store and machinery shed", p: [-3.6, 1.3, 5.0], d: "The office keeps the farm records and accounts; the store holds seed, fertilizer and tools; the shed protects the tractor and implements from sun and rain. They stand at the centre, by the main road, so every plot is a short trip away." },
    { id: "stock", n: "Livestock unit", p: [5.2, 1.0, 6.9], d: "Cattle paddock, goat pen and poultry house, placed downwind of the homes so smell and flies are carried away. Manure goes back to the crop plots." },
    { id: "pond", n: "Fish pond and stream", p: [-12, 0.7, 6.2], d: "The stream on the lowest ground feeds an earth pond stocked with tilapia and catfish, and supplies irrigation water by channel. Pond water enriched with fish waste is good for vegetables." },
    { id: "road", n: "Farm road and gate", p: [-0.8, 0.5, 9.2], d: "An all-weather road from the gate to every unit, for bringing inputs in and taking produce to market. One guarded gate gives security." },
  ];
  function buildSettlement(g, S, s) {
    const T3 = T();
    const inPlot = (x, z) => PLOTS.some((P) => x > P[1] - 0.2 && x < P[2] + 0.2 && z > P[3] - 0.2 && z < P[4] + 0.2);
    const h = AK.ground(g, { w: 32, d: 24, amp: 0.035, seed: 5, tex: "farm_soil", rep: 26, nx: 170, fieldFn: (x, z) => (inPlot(x, z) ? 1 : 0), apronTex: "leafy_grass" });
    const Y = (x, z) => h(x, z);
    /* ground surfaces */
    patch(g, -15.4, 3.4, -11.4, -6.3, "forest_ground_04", 0.5, 0.014);
    patch(g, 4.2, 15.4, -11.4, -6.3, "withered_grass", 0.45, 0.014);
    PLOTS.forEach((P) => patch(g, P[1] - 0.15, P[2] + 0.15, P[3] - 0.15, P[4] + 0.15, "farm_furrows", 0.55, 0.016));
    patch(g, -15.2, -8.6, -5.6, 1.2, "leafy_grass", 0.5, 0.013);
    patch(g, -1.5, 0.1, 2.9, 11.6, "raked_dirt", 0.5, 0.02, 0xcbb089); patch(g, -8.4, 14.6, 3.0, 4.2, "raked_dirt", 0.5, 0.021, 0xcbb089); patch(g, -1.5, 0.1, -5.6, 3.0, "raked_dirt", 0.5, 0.019, 0xcbb089);
    patch(g, -7.6, -1.9, 4.5, 8.4, "brown_mud_dry", 0.5, 0.017, 0xd8c8a8);
    patch(g, 1.4, 9.4, 4.8, 9.2, "sparse_grass", 0.5, 0.015);
    /* ---- forest reserve: real trees and understorey, with kit timber species for the canopy mix ---- */
    const N = (k) => (GK.tier === "low" ? Math.ceil(k / 2) : k);
    AK.scatter(g, "island_tree_02", spots(N(20), -15, 3, -11, -6.8, 0.8, 1.25, 11), { h: 3.6 });
    AK.scatter(g, "jacaranda_tree", [[-13.2, 0, -6.9, 1, 0.4], [-7.4, 0, -6.7, 0.9, 2.1], [-1.2, 0, -7.0, 1.05, 4.0], [2.4, 0, -9.6, 0.85, 1.0]], { h: 4.6 });
    AK.trees(g, spots(N(9), -15, 3.2, -11.2, -8.4, 0.7, 1.1, 12).map(([x, y, z, sc]) => [x, Y(x, z), z, sc]), 0.42, ["iroko", "gmelina", "teak", "mango", "shea"]);
    AK.scatter(g, "fern_02", spots(N(34), -15, 3, -11, -6.4, 0.7, 1.3, 13), { h: 0.34, shadow: false });
    AK.scatter(g, "shrub_02", spots(14, -15, 3, -11, -6.4, 0.7, 1.2, 14), { h: 0.7 });
    AK.scatter(g, "tree_stump_01", spots(5, -14, 2, -7.4, -6.3, 0.8, 1.1, 15), { h: 0.32 });
    AK.scatter(g, "dead_tree_trunk", spots(4, -14, 2, -8.2, -6.4, 0.9, 1.2, 16), { h: 0.16 });
    /* ---- bush fallow: real shrubs, weeds and herbs with kit grasses ---- */
    AK.scatter(g, "shrub_03", spots(N(30), 4.4, 15.2, -11.2, -6.5, 0.7, 1.3, 21), { h: 0.42, shadow: false });
    AK.scatter(g, "shrub_04", spots(N(26), 4.4, 15.2, -11.2, -6.5, 0.7, 1.3, 22), { h: 0.5, shadow: false });
    AK.scatter(g, "wild_rooibos_bush", spots(16, 4.4, 15.2, -11.2, -6.5, 0.8, 1.3, 23), { h: 0.55 });
    AK.scatter(g, "shrub_02", spots(10, 4.4, 15.2, -11.2, -6.8, 0.8, 1.4, 24), { h: 0.8 });
    AK.scatter(g, "weed_plant_02", spots(N(30), 4.4, 15.2, -11.2, -6.4, 0.7, 1.3, 25), { h: 0.22, shadow: false });
    AK.scatter(g, "nettle_plant", spots(N(24), 4.4, 15.2, -11.2, -6.4, 0.7, 1.2, 26), { h: 0.3, shadow: false });
    AK.field(g, "elephant", { x0: 4.6, x1: 15, z0: -11, z1: -6.6, dx: 1.3, dz: 1.1, s: 0.3, jitter: 0.9, seed: 27, h: Y });
    AK.field(g, "siam", { x0: 5, x1: 15, z0: -10.6, z1: -6.8, dx: 1.7, dz: 1.5, s: 0.3, jitter: 1.1, seed: 28, h: Y });
    AK.trees(g, [[6.5, 0, -9.8, 0.8], [14.4, 0, -10.6, 0.9]], 0.36, ["shea", "gmelina"]);
    /* ---- arable plots ---- */
    PLOTS.forEach((P, i) => AK.field(g, P[0], { x0: P[1] + 0.15, x1: P[2] - 0.15, z0: P[3] + 0.15, z1: P[4] - 0.15, dx: P[5], dz: P[5] * 0.8, s: P[6], seed: 31 + i, h: Y, stage: i === 0 ? 0.8 : 0.7 }));
    /* ---- tree-crop plantation ---- */
    AK.field(g, "oilpalm", { x0: -14.6, x1: -9.2, z0: -5.2, z1: -2.4, dx: 1.8, dz: 1.4, s: 0.5, jitter: 0.1, seed: 41, h: Y });
    AK.field(g, "cocoa", { x0: -14.6, x1: -9.2, z0: -1.6, z1: 0.9, dx: 1.1, dz: 1.2, s: 0.42, jitter: 0.1, seed: 42, h: Y });
    AK.field(g, "banana", { x0: -14.0, x1: -9.6, z0: -1.0, z1: 0.4, dx: 2.2, dz: 1.4, s: 0.42, jitter: 0.1, seed: 43, h: Y });
    /* ---- residential quarter ---- */
    const put = (o, x, z, ry, sc) => { o.position.set(x, Y(x, z), z); if (ry) o.rotation.y = ry; if (sc) o.scale.setScalar(sc); g.add(o); return o; };
    [[-6.6, -4.2, 0, 0xf0e6d0], [-4.3, -4.3, 0, 0xe6d0b0], [-2.6, -4.0, 0.2, 0xf4ecd8], [-6.6, -1.6, 0, 0xe0c8a0], [-2.7, -1.2, -0.1, 0xf0e0c4]].forEach(([x, z, ry, col], i) => put(AK.building("house", { w: 1.5 + (i % 2) * 0.25, d: 1.1, h: 0.72, wallCol: col, roof: i % 2 ? "rusty_corrugated_iron" : "corrugated_iron_02" }), x, z, ry));
    [[-4.7, -1.6], [-5.3, 0.3]].forEach(([x, z]) => put(AK.building("hut", { r: 0.5 }), x, z));
    const well = new T3.Group(); well.add(cyl(0.26, 0.28, 0.3, AK.pbr("clay_block_wall", { repeat: [3, 1] }), 0, 0.15, 0, 18), cyl(0.2, 0.2, 0.02, AK.std(0x20405a, { roughness: 0.1 }), 0, 0.27, 0, 18), cyl(0.02, 0.02, 0.6, AK.wood(), -0.26, 0.4, 0, 6), cyl(0.02, 0.02, 0.6, AK.wood(), 0.26, 0.4, 0, 6), box(0.6, 0.03, 0.03, AK.wood(), 0, 0.7, 0)); BK.shadow(well); put(well, -4.3, -2.7);
    AK.trees(g, [[-7.4, 0, -2.9, 1], [-1.9, 0, -2.6, 0.8]], 0.36, ["mango", "citrus"]); AK.scatter(g, "island_tree_02", [[-3.5, 0, -2.5, 0.8, 1.1], [-7.2, 0, 0.7, 0.9, 2.6]], { h: 3.0 });
    AK.scatter(g, "shrub_04", [[-5.6, 0, -3.3, 1, 0], [-3.4, 0, -4.9, 0.9, 1], [-6.9, 0, -0.5, 1, 2], [-2.2, 0, 0.6, 0.8, 3]], { h: 0.4 });
    g.add(AK.fence([[-7.9, -5.3], [-1.8, -5.3], [-1.8, 1.4], [-7.9, 1.4], [-7.9, -5.3]], 0.3));
    for (let i = 0; i < 3; i++) put(AK.person({}), -5.2 + i * 1.3, -2.9 + (i % 2) * 0.8, i * 2.1, K);
    /* ---- office, store, machinery shed, silo ---- */
    put(AK.building("house", { w: 2.0, d: 1.2, h: 0.85, wallCol: 0xf2f2ea }), -6.4, 5.2); put(AK.sign("FARM OFFICE"), -6.4, 6.1, 0, 0.6);
    put(AK.building("store", { w: 1.8, d: 1.2, h: 0.9, wall: "clay_block_wall" }), -3.9, 5.1);
    put(AK.building("shed", { w: 2.2, d: 1.4, h: 0.95 }), -3.6, 7.4);
    put(AK.building("silo"), -6.9, 7.5, 0, 0.55);
    const tr = AK.tractor(0xc8321e); tr.add((() => { const o = AK.implement("disc"); o.position.x = -1.3; return o; })()); put(tr, -3.5, 7.4, Math.PI / 2, K);
    [["portable_generator", 0.62, -5.2, 7.0], ["Barrel_01", 0.9, -5.4, 7.7], ["metal_jerrycan", 0.47, -5.0, 7.75], ["old_tyre", 0.75, -2.2, 7.9]].forEach(([id, sz, x, z]) => g.add(AK.model(id, { fit: sz * K, at: [x, 0.02, z] })));
    for (let i = 0; i < 4; i++) put(AK.sack(), -4.9 + i * 0.22, 5.95, 0, 0.7);
    /* ---- livestock ---- */
    g.add(AK.fence([[1.6, 5.0], [6.4, 5.0], [6.4, 9.0], [1.6, 9.0], [1.6, 5.0]], 0.32));
    s.herd = []; [["bull", 2.6, 6.2], ["cow", 4.0, 7.4], ["cow", 5.2, 6.0], ["cow", 3.2, 8.2]].forEach(([b, x, z], i) => { const a = AK.animal(b); put(a, x, z, i * 1.7, K); s.herd.push({ a, ph: i * 1.3, graze: i % 2 }); });
    put(AK.building("pen", { w: 1.6, d: 1.1, h: 0.6 }), 7.9, 5.9); [["goat", 7.5, 5.8], ["goat", 8.2, 6.1]].forEach(([b, x, z], i) => { const a = AK.animal(b); put(a, x, z, 1 + i, K); s.herd.push({ a, ph: i, graze: 0 }); });
    put(AK.building("poultry", { w: 2.0, d: 1.1, h: 0.7 }), 8.0, 8.2);
    /* ---- stream, pond and irrigation channel ---- */
    const strm = GK.water(4.2, 24, 0x4a7f86, 0.9); strm.position.set(-15.3, 0.03, 0); g.add(strm);
    g.add(box(4.6, 0.08, 3.4, AK.pbr("brown_mud_02", { repeat: 3 }), -11.6, 0.04, 6.3)); const pw = GK.water(4.2, 3.0, 0x3f7a6a, 0.9); pw.position.set(-11.6, 0.09, 6.3); g.add(pw); s.water = [strm, pw];
    g.add(AK.pipe([[-13.4, 0.08, 4.4], [-9, 0.1, 3.6], [0.4, 0.1, 3.6], [8, 0.1, 3.1], [14.3, 0.1, 3.1]], 0.035, 0x3a78c8));
    AK.field(g, "elephant", { x0: -13.6, x1: -9.4, z0: 4.3, z1: 8.6, dx: 1.4, dz: 1.9, s: 0.28, jitter: 0.3, seed: 51, h: Y, skip: (x, z) => x > -13.5 && x < -9.6 && z > 4.8 && z < 7.9 });
    AK.scatter(g, "fern_02", spots(N(14), -13.4, -12.9, -10, 11, 0.8, 1.3, 52), { h: 0.3, shadow: false });
    AK.scatter(g, "island_tree_02", [[-12.7, 0, 9.6, 1, 0.5], [-9.2, 0, 9.9, 0.85, 2.2], [11.5, 0, 9.8, 1, 1.4], [14.2, 0, 6.3, 0.9, 3.0]], { h: 3.2 });
    /* ---- gate ---- */
    [-1.7, 0.3].forEach((x) => g.add(cyl(0.07, 0.08, 0.8, AK.pbr("clay_block_wall", { repeat: [1, 2] }), x, 0.4, 11.2, 10))); g.add(box(2.0, 0.08, 0.06, AK.wood(), -0.7, 0.82, 11.2)); put(AK.sign("FARM SETTLEMENT"), -0.7, 11.25, 0, 0.75).position.y = 0.86;
    g.add(AK.fence([[-15, 11.4], [-1.8, 11.4]], 0.3), AK.fence([[0.4, 11.4], [15.4, 11.4], [15.4, -5.8]], 0.3));
  }
  const sdef = {
    title: "A standard farm settlement — forest, bush, crops and homes",
    blurb: "A planned farm settlement in the forest–savanna zone. Pick a zone to fly to it. Shrubs, ferns, weeds, logs and two tree species are real scanned plants; the crops and timber trees are West African species from the lab's plant kit.",
    label: "Photoreal 3D lab: farm settlement", flabel: "Zone", sky: "farm_field", envX: { shadowExtent: 21, sunPos: [10, 16, 8] },
    cam: [[2, 15, 25], [0, 0, -1]], fov: 42, fly: [2.2, 2.6, 4.6], maxSteps: 12,
    values: { live: 1 }, controls: [{ type: "toggle", key: "live", label: "Animals moving" }],
    build: buildSettlement,
    tick(S, s, c, dt) { s.tt = (s.tt || 0) + dt; if (c.live && s.herd) s.herd.forEach((q) => AK.animate(q.a, s.tt + q.ph, 0, q.graze)); },
    feats: ZONES,
    notes: [["How the site is planned", "#9fc3ff"], "Homes upwind of livestock and near water and the road.", "Annual crops on level land; tree crops on deep soil; forest on the watershed.", "Fallow land rests and regains fertility; the pond and stream are on the lowest ground."],
    readouts: (s, c) => { const F = ZONES.find((x) => x.id === c.f) || ZONES[0]; return [["Zone", F.n], ["Zones on site", String(ZONES.length)], ["Scale", "1 unit ≈ 2.4 m"]]; },
    table: () => MK.table(["Zone", "What it is for"], ZONES.map((Z) => [Z.n, Z.d.split(". ")[0] + "."])),
    tasks: ["Visit every zone and state one reason for where it is placed.", "List the layers of the forest you can see and give three benefits of keeping a forest reserve on a farm.", "Explain how bush fallow restores soil fertility.", "Name the four arable crops in rotation and say why a legume is included.", "Sketch the settlement and mark the road, the water source, the homes and the livestock unit."],
    note: "A teaching layout, not a survey of a real settlement. Buildings are drawn larger than the plots for clarity. The scanned shrubs, ferns and the two broadleaf trees stand in for local species; they are not West African plants.",
    draw: GK.fallback("Farm settlement", ZONES.map((Z) => Z.n)),
  };
  AK.tour("C9-d#settlement", sdef);
  if (MK.scenes["C9-d#settlement"]) { MK.scenes["C9-d#settlement"].label = sdef.label; MK.scenes["C9-a#settlement"] = MK.scenes["C9-d#settlement"]; }

  /* ============================== 2. three farm machines ============================== */
  const part = (g, obj, name, ex) => { obj.name = name; obj.userData.home = obj.position.clone(); obj.userData.ex = new (T().Vector3)(ex[0], ex[1], ex[2]); g.add(obj); (g.parts = g.parts || []).push(obj); return obj; };
  const grp = (...kids) => { const o = new (T().Group)(); kids.forEach((k) => o.add(k)); return o; };
  const lay = (m, rx, ry, rz) => { m.rotation.set(rx || 0, ry || 0, rz || 0); return m; };
  function tractorHD() {
    const g = AK.tractor(0xc8321e), red = AK.paint(0xc8321e), dark = AK.std(0x222428, { roughness: 0.6 }), steel = AK.metal(), glassy = AK.phys(0xfff2c0, { roughness: 0.1, emissive: 0x554400 });
    part(g, grp(lay(box(0.95, 0.04, 0.5, red, -0.45, 1.56, 0.62), 0, 0, 0), box(0.95, 0.04, 0.5, red, -0.45, 1.56, -0.62), box(0.04, 0.5, 0.5, red, -0.92, 1.32, 0.62), box(0.04, 0.5, 0.5, red, -0.92, 1.32, -0.62)), "Mudguards (fenders)", [0, 0.5, 0]);
    part(g, grp(box(0.7, 0.05, 0.12, steel, -1.3, 0.38, 0), cyl(0.03, 0.03, 0.12, dark, -1.6, 0.38, 0, 8)), "Drawbar", [-0.9, -0.3, 0]);
    part(g, lay(cyl(0.025, 0.025, 0.6, steel, -1.1, 1.05, 0, 8), 0, 0, 1.25), "Top link", [-0.8, 0.5, 0]);
    part(g, grp(lay(cyl(0.07, 0.07, 0.05, glassy, 1.36, 1.05, 0.2, 14), 0, 0, Math.PI / 2), lay(cyl(0.07, 0.07, 0.05, glassy, 1.36, 1.05, -0.2, 14), 0, 0, Math.PI / 2)), "Headlamps", [0.9, 0.3, 0]);
    part(g, grp(cyl(0.035, 0.035, 0.45, dark, 0.55, 1.45, -0.2, 8), cyl(0.08, 0.08, 0.12, AK.std(0x3a3a3a, { roughness: 0.4, metalness: 0.5 }), 0.55, 1.72, -0.2, 12)), "Air cleaner", [0, 0.9, -0.3]);
    BK.shadow(g); return g;
  }
  function discPlough() {
    const T3 = T(), g = new T3.Group(), blue = AK.paint(0x1f55a8), steel = AK.metal(0xc9cdd2), dark = AK.std(0x2a2c30, { roughness: 0.6, metalness: 0.4 }), shiny = new T3.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.22, metalness: 0.9, side: T3.DoubleSide });
    const beam = lay(box(2.5, 0.14, 0.14, blue, 0, 0.95, 0), 0, 0.45, 0); part(g, beam, "Beam (main frame)", [0, 0.7, 0]);
    part(g, grp(lay(box(0.07, 0.85, 0.07, blue, 0.95, 1.35, -0.18), 0, 0, 0.25), lay(box(0.07, 0.85, 0.07, blue, 0.95, 1.35, -0.78), 0, 0, 0.25), box(0.1, 0.1, 0.7, blue, 1.05, 1.74, -0.48)), "Hitch mast (top-link point)", [0.6, 0.6, 0]);
    part(g, grp(box(0.1, 0.1, 1.5, blue, 1.0, 0.72, -0.45), lay(cyl(0.035, 0.035, 0.22, steel, 1.0, 0.72, 0.36, 10), Math.PI / 2), lay(cyl(0.035, 0.035, 0.22, steel, 1.0, 0.72, -1.26, 10), Math.PI / 2)), "Cross-shaft and lower hitch pins", [0.9, -0.2, 0]);
    const discs = new T3.Group(), stds = new T3.Group(), scr = new T3.Group();
    [[0.75, -0.42], [0.0, -0.06], [-0.75, 0.3]].forEach(([x, z]) => {
      const dg = new T3.SphereGeometry(0.62, 28, 10, 0, 6.283, 0, 0.6); dg.translate(0, -0.56, 0); const d = new T3.Mesh(dg, shiny); d.rotation.order = "YXZ"; d.rotation.set(Math.PI / 2 - 0.3, 0.75, 0); d.position.set(x - 0.08, 0.38, z + 0.3); d.castShadow = true; discs.add(d);
      stds.add(lay(box(0.08, 0.62, 0.08, blue, x, 0.64, z + 0.14), 0.25, 0, 0), lay(cyl(0.09, 0.09, 0.14, dark, x - 0.02, 0.4, z + 0.2, 12), Math.PI / 2 - 0.35, 0.75, 0));
      scr.add(lay(box(0.03, 0.26, 0.16, steel, x - 0.22, 0.62, z + 0.42), 0.2, 0.75, 0));
    });
    part(g, discs, "Disc blades (concave)", [0, -0.1, 0.9]); part(g, stds, "Standards and disc bearings", [0, 0.3, 0.4]); part(g, scr, "Scrapers", [-0.3, 0.7, 0.7]);
    const fw = new T3.Group(); const rim = new T3.Mesh(new T3.TorusGeometry(0.3, 0.03, 8, 28), steel); rim.rotation.set(0.35, 0.2, 0); rim.position.set(-1.45, 0.33, 0.62); fw.add(rim, lay(box(0.07, 0.75, 0.07, blue, -1.3, 0.66, 0.58), 0.2, 0, -0.3), lay(cyl(0.02, 0.02, 0.56, steel, -1.45, 0.33, 0.62, 6), 0.35, 0.2, Math.PI / 2));
    part(g, fw, "Rear furrow wheel", [-0.9, 0, 0.3]);
    part(g, grp(lay(cyl(0.02, 0.02, 0.5, steel, -1.05, 1.05, 0.5, 6), 0, 0, 0.5), cyl(0.05, 0.05, 0.1, dark, -0.95, 1.25, 0.5, 10)), "Depth and angle adjuster", [-0.4, 0.8, 0]);
    BK.shadow(g); return g;
  }
  function planter() {
    const T3 = T(), g = new T3.Group(), green = AK.paint(0x2e8a3c), yel = AK.paint(0xf2c21a), steel = AK.metal(0xc9cdd2), dark = AK.std(0x2a2c30, { roughness: 0.6, metalness: 0.4 }), clear = AK.phys(0xf4f4ee, { roughness: 0.35, transparent: true, opacity: 0.75 });
    part(g, grp(box(0.14, 0.14, 2.9, green, 0.2, 0.85, 0), box(0.14, 0.14, 2.9, green, -0.55, 0.85, 0), box(0.9, 0.1, 0.1, green, -0.17, 0.85, 1.4), box(0.9, 0.1, 0.1, green, -0.17, 0.85, -1.4)), "Tool bar (frame)", [0, 0.9, 0]);
    part(g, grp(lay(box(0.07, 0.8, 0.07, green, 0.42, 1.25, 0.3), 0, 0, 0.3), lay(box(0.07, 0.8, 0.07, green, 0.42, 1.25, -0.3), 0, 0, 0.3), box(0.1, 0.1, 0.7, green, 0.54, 1.62, 0), lay(cyl(0.035, 0.035, 0.2, steel, 0.3, 0.7, 0.75, 10), Math.PI / 2), lay(cyl(0.035, 0.035, 0.2, steel, 0.3, 0.7, -0.75, 10), Math.PI / 2)), "Three-point hitch frame", [0.9, 0.4, 0]);
    const rows = [-1.05, -0.35, 0.35, 1.05], hop = new T3.Group(), met = new T3.Group(), tubes = new T3.Group(), open = new T3.Group(), press = new T3.Group();
    rows.forEach((z) => {
      hop.add(cyl(0.24, 0.15, 0.42, yel, -0.18, 1.3, z, 16), cyl(0.25, 0.25, 0.03, dark, -0.18, 1.52, z, 16));
      met.add(box(0.22, 0.14, 0.2, dark, -0.18, 1.02, z), lay(cyl(0.09, 0.09, 0.05, steel, -0.18, 1.02, z + 0.12, 14), Math.PI / 2));
      tubes.add(lay(cyl(0.03, 0.025, 0.62, clear, -0.24, 0.62, z, 8), 0, 0, -0.18));
      const d1 = new T3.Mesh(new T3.CylinderGeometry(0.2, 0.2, 0.012, 22), new T3.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.25, metalness: 0.9 })), d2 = d1.clone(); d1.rotation.set(Math.PI / 2, 0.12, 0); d2.rotation.set(Math.PI / 2, -0.12, 0); d1.position.set(-0.3, 0.2, z + 0.03); d2.position.set(-0.3, 0.2, z - 0.03); open.add(d1, d2, box(0.05, 0.5, 0.05, green, -0.3, 0.55, z));
      const w = AK.wheel(0.17, 0.09, 0x2e8a3c); w.position.set(-0.95, 0.17, z); press.add(w, lay(box(0.6, 0.05, 0.05, green, -0.68, 0.48, z), 0, 0, 0.5));
    });
    part(g, hop, "Seed hoppers", [0, 0.9, 0]); part(g, met, "Seed metering units (seed plates)", [0.5, 0.35, 0]); part(g, tubes, "Seed tubes", [0.35, -0.05, 0]); part(g, open, "Furrow openers (double disc)", [0, -0.15, 0]); part(g, press, "Covering and press wheels", [-0.8, 0, 0]);
    part(g, grp(box(0.3, 0.34, 2.5, green, -0.62, 1.22, 0), box(0.34, 0.03, 2.54, dark, -0.62, 1.4, 0)), "Fertilizer hopper", [-0.5, 0.8, 0]);
    const dw = AK.wheel(0.34, 0.14, 0xf2c21a); dw.position.set(-0.2, 0.34, 1.62);
    part(g, grp(dw, lay(box(0.03, 0.8, 0.05, dark, -0.2, 0.7, 1.5), 0.0, 0, 0.0), cyl(0.07, 0.07, 0.04, steel, -0.2, 1.05, 1.5, 12)), "Ground drive wheel and chain", [0, 0, 0.8]);
    part(g, grp(lay(box(0.05, 0.05, 1.3, steel, 0.2, 1.0, -2.0), 0.35, 0, 0), lay(cyl(0.14, 0.14, 0.012, steel, 0.2, 0.55, -2.6, 16), Math.PI / 2 + 0.35)), "Row marker", [0, 0.3, -0.7]);
    BK.shadow(g); return g;
  }
  const USES = {
    tractor: ["Tractor", tractorHD, 1, "The main power unit of the farm. It pulls implements by the drawbar, carries them on the three-point hitch and drives them through the PTO shaft.", {
      "Engine bonnet": "Covers and protects the diesel engine.", "Radiator grille": "Lets air reach the radiator, which cools the engine water.", "Engine and gearbox": "The engine supplies power; the gearbox selects speed and pulling force.", "Seat and fuel tank": "The operator's seat, with the diesel tank that stores fuel.",
      "Safety frame (ROPS)": "Protects the operator if the tractor overturns.", "Exhaust": "Carries burnt gases away above the operator.", "Steering wheel": "Turns the front wheels to steer.", "Rear wheel (drive)": "Large drive wheels with deep tread: they give traction (grip) to pull loads.", "Front wheel (steering)": "Small wheels that steer the tractor.",
      "Three-point hitch": "Two lower links and a top link that carry and lift mounted implements.", "PTO shaft": "Power take-off: a spinning shaft that drives implements such as sprayers, mowers and shellers.", "Battery": "Stores electricity for starting and lights.", "Hydraulic cylinder": "Uses oil pressure to raise and lower the hitch.",
      "Mudguards (fenders)": "Shield the operator from mud and from the turning wheels.", "Drawbar": "Fixed bar for pulling trailed implements and trailers.", "Top link": "Adjustable third arm of the hitch; sets the tilt of the implement.", "Headlamps": "Light the way for early and late work.", "Air cleaner": "Filters dust from the air before it enters the engine." }],
    plough: ["Disc plough", discPlough, 1.05, "A primary tillage implement. Its angled, concave discs cut, lift and turn the soil, burying weeds and trash. It works well in hard, dry, sticky or stony soils and where roots remain.", {
      "Beam (main frame)": "Strong steel beam that carries every other part.", "Hitch mast (top-link point)": "Upright frame joined to the tractor's top link.", "Cross-shaft and lower hitch pins": "Pins that fit the tractor's two lower links.", "Disc blades (concave)": "Rotating steel discs that cut and turn the furrow slice.",
      "Standards and disc bearings": "Legs that hold each disc; the bearings let the discs spin freely.", "Scrapers": "Plates that clean soil off the discs and help turn the slice.", "Rear furrow wheel": "Runs in the furrow and resists side thrust, keeping the plough straight.", "Depth and angle adjuster": "Sets how deep and at what angle the discs cut." }],
    planter: ["Seed planter", planter, 1, "Plants seeds in rows at the right depth and spacing, and can place fertilizer at the same time. It saves seed, gives an even stand and makes later weeding by machine possible.", {
      "Tool bar (frame)": "Carries the planting units at the chosen row spacing.", "Three-point hitch frame": "Mounts the planter on the tractor's hitch.", "Seed hoppers": "Hold the seed for each row.", "Seed metering units (seed plates)": "Rotating plates that release one seed at a time, fixing the spacing within the row.",
      "Seed tubes": "Guide each seed down into the furrow.", "Furrow openers (double disc)": "Cut a narrow furrow of even depth for the seed.", "Covering and press wheels": "Close the furrow and firm the soil over the seed for good contact and germination.", "Fertilizer hopper": "Holds fertilizer that is placed beside and below the seed.",
      "Ground drive wheel and chain": "Turns the metering units as the planter moves, so seed rate matches distance travelled.", "Row marker": "Scratches a line for the next pass so rows stay parallel." }],
  };
  const centre = (p) => { const c = new (T().Box3)().setFromObject(p).getCenter(new (T().Vector3)()); return [c.x, c.y, c.z]; };
  const mdef = {
    title: "Three farm machines and their parts",
    blurb: "A tractor, a disc plough and a seed planter built part by part. Choose a machine, pull the parts apart, then pick each part to see what it does.",
    label: "3D lab: three farm machines — identify the parts", flabel: "Part", vlabel: "Machine", sky: "outdoor_workshop", envX: { blur: 0.5, bgI: 0.7, shadowExtent: 5 },
    cam: [[3.6, 2.5, 4.8], [0, 0.9, 0]], fly: [1.5, 1.0, 2.2],
    variants: [["tractor", "Tractor"], ["plough", "Disc plough"], ["planter", "Seed planter"]],
    vars: [{ key: "ex", label: "Pull parts apart", min: 0, max: 1, step: 0.05, value: 0 }],
    build(g, S, s, c) { AK.ground(g, { w: 10, d: 8, amp: 0.01, tex: "concrete_floor_worn_001", apronTex: "sparse_grass" }); const U = USES[c.v] || USES.tractor; s.m = U[1](); s.m.scale.setScalar(U[2]); s.mv = c.v; g.add(s.m); },
    tick(S, s, c) { if (s.m) AK.explode(s.m, c.ex || 0); },
    feats: (c, s) => { const U = USES[c.v] || USES.tractor, live = s && s.m && s.mv === c.v; return Object.keys(U[4]).map((n, i) => { const p = live ? s.m.parts.find((q) => q.name === n) : null, at = p ? centre(p) : [0, 1 + i * 0.01, 0]; return { id: n, n, d: U[4][n], p: [at[0], at[1] + 0.12, at[2]] }; }); },
    notes: (c) => { const U = USES[c.v] || USES.tractor; return [[U[0], "#9fc3ff"], U[3]]; },
    readouts: (s, c) => { const U = USES[c.v] || USES.tractor; return [["Machine", U[0]], ["Parts to identify", String(Object.keys(U[4]).length)], ["Selected part", c.f || ""]]; },
    table: () => MK.table(["Machine", "Part", "Function"], Object.values(USES).flatMap((U) => Object.entries(U[4]).map(([n, d]) => [U[0], n, d]))),
    tasks: ["Pull each machine apart and list its parts.", "Switch Labels to Numbers and name every part of the tractor.", "State the function of the PTO shaft, the three-point hitch and the drawbar.", "Explain how the disc plough turns the soil and why it has a rear furrow wheel.", "Describe the path of a seed through the planter from hopper to covered furrow.", "Give three daily maintenance checks for each machine."],
    note: "These machines are built in code from simple solids so that every part can be separated and named. Proportions are typical; they are not copies of any manufacturer's model.",
    draw: GK.fallback("Three farm machines", Object.values(USES).map((U) => U[0] + ": " + Object.keys(U[4]).join(", "))),
  };
  AK.tour("C2-a#three", mdef);
  if (MK.scenes["C2-a#three"]) { MK.scenes["C2-a#three"].label = mdef.label; MK.scenes["C2-b#three"] = MK.scenes["C2-a#three"]; }
})();
