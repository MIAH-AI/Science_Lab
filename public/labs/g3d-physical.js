/* g3d-physical.js — Rocks (RK), Tectonic processes and landforms (TC), Denudational processes (DN).
   Textbook block diagrams in 3D: the land surface on top and the rock strata exposed on the cut sides, every part labelled. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, GK = window.GK, f = MK.fmt;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const hex3 = (h) => GK.hex3(h), mix3 = (a, b, k) => GK.mix3(a, b, k);
  const G = (x, z, cx, cz, rx, rz) => Math.exp(-(((x - cx) / rx) ** 2) - (((z - cz) / rz) ** 2));
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const OUT = { hdri: "noon_grass", sky: true, sunPos: [6, 9, 5], shadowExtent: 6, fogNear: 30, fogFar: 90 };
  const BLOCKCAM = [[5.6, 3.4, 7.4], [0.5, -0.3, 0]];
  const FZ = 2.02; /* front face of a 6 × 4 block */
  const SED = [[-0.12, 0xc9a26b], [-0.45, 0x7d776b], [-0.8, 0xd3cab2], [-1.15, 0xb98b56], [-1.7, 0x6a645a]];
  const sedBands = GK.bands(SED, 0.05);
  const soilOn = (fn, depth = 0.07, col = 0x5e4026) => (x, y, z, yt) => (y > yt - depth ? hex3(col).map((v) => v * (0.9 + 0.2 * BK.noise3(x * 8, y * 8, z * 8))) : fn(x, y, z, yt));
  const darken = (c, k) => c.map((v) => v * k);
  const mat = (color, o = {}) => new (T().MeshStandardMaterial)(Object.assign({ color, roughness: 0.85 }, o));

  /* ---------- small builders ---------- */
  function flowParticles(n, col, size) { return GK.particles(n, col, size, 0.85); }
  function houseRow(g, pts, s = 0.12) { pts.forEach(([x, y, z], i) => { const h = GK.house(s, i % 2 ? 0x8a3a2a : 0x6b6b6b); h.position.set(x, y, z); h.rotation.y = i * 0.7; g.add(h); }); }
  function plinth(g, x, z, w = 1.4) { const p = new (T().Mesh)(new (T().CylinderGeometry)(w / 2, w / 2 + 0.05, 0.22, 40), mat(0x8c8a84, { roughness: 0.6 })); p.position.set(x, 0.11, z); p.receiveShadow = true; g.add(p); return 0.22; }

  /* ===================== RK-a  Igneous rocks ===================== */
  const ign = {
    h: (x, z) => 0.22 + 1.35 * Math.max(0, 1 - Math.hypot(x - 1.4, z - 0.2) / 1.25) ** 1.4 - 0.25 * G(x, z, 1.4, 0.2, 0.18, 0.18) + 0.2 * G(x, z, -2.2, 1.4, 0.55, 0.9) + (BK.fbm(x * 1.4, z * 1.4, 3) - 0.5) * 0.08,
    s: (x, y, z, yt) => {
      const cone = Math.hypot(x - 1.4, z - 0.2) < 1.25 && y > 0.18;
      if (((x + 1.5) / 1.35) ** 2 + ((y + 1.75) / 1.0) ** 2 < 1) return hex3(0xc98d7c);           // batholith
      if (Math.abs(x - (-0.5 + 0.12 * (y + 1))) < 0.06 && y > -1.1) return hex3(0x2e2e30);          // dyke
      if (Math.abs(y + 0.47) < 0.045 && x > -1.2 && x < 0.55) return hex3(0x2e2e30);                 // sill
      if (x > -2.85 && x < -1.55 && y > -0.12 && y < -0.12 + 0.32 * (1 - ((x + 2.2) / 0.65) ** 2)) return hex3(0xc98d7c); // laccolith
      if (Math.abs(x - 1.4) < 0.07 && y > -1.25) return hex3(0xd2481a);                                // pipe
      if (((x - 1.4) / 0.7) ** 2 + ((y + 1.38) / 0.24) ** 2 < 1) return hex3(0xe0581e);              // magma chamber
      if (cone) return Math.floor((y - 0.18) / 0.1) % 2 ? hex3(0x4a4440) : hex3(0x8a7f74);          // ash + lava layers
      return sedBands(x, y, z);
    },
  };
  GK.tour("RK-a", {
    title: "Igneous rocks",
    blurb: "Igneous rocks form when molten magma cools. Cut open the block to see intrusive rocks that cooled underground and extrusive rocks that cooled at the surface, then compare real specimens.",
    envOpts: OUT, cam: BLOCKCAM, variants: [["section", "Block diagram"], ["samples", "Rock specimens"]], vlabel: "Show",
    build(g, S, s, c) {
      if (c.v === "section") { g.add(GK.block({ w: 6, d: 4, h: ign.h, strata: soilOn(ign.s), tint: (hn, sl, x, z) => (Math.hypot(x - 1.4, z - 0.2) < 1.2 ? mix3(hex3(0x5a524a), hex3(0x3a3430), sm(0.6, 1.2, 1.25 - Math.hypot(x - 1.4, z - 0.2))) : GK.tintSavanna(hn, sl, x, z)) })); const lava = new (T().Mesh)(new (T().CircleGeometry)(0.15, 24), new (T().MeshBasicMaterial)({ color: 0xff6a1a, map: GK.ptex("Lava004", "color", 1) })); lava.rotation.x = -Math.PI / 2; lava.position.set(1.4, ign.h(1.4, 0.2) + 0.01, 0.2); g.add(lava); s.lava = lava; s.smoke = flowParticles(220, 0xc8c2bc, 0.16); g.add(s.smoke); s.sm = []; for (let i = 0; i < 220; i++) s.sm.push([Math.random() * 3]); }
      else { const specs = [["granite", -1.2], ["basalt", 1.2]]; specs.forEach(([t, x]) => { const y = plinth(g, x, 0, 1.3); const r = GK.rockSample(t, 0.45); r.position.set(x, y + 0.3, 0); g.add(r); }); s.smoke = null; }
    },
    tick(S, s, c, dt) { if (s.lava) s.lava.material.color.setHSL(0.05, 1, 0.45 + 0.1 * Math.sin(performance.now() / 300)); if (s.smoke) { const P = s.smoke.pos; s.sm.forEach((q, i) => { q[0] += dt * 0.5; if (q[0] > 3) q[0] = 0; const t = q[0]; P[i * 3] = 1.4 + Math.sin(i * 7.1) * t * 0.25 + t * 0.35; P[i * 3 + 1] = 1.55 + t * 0.8; P[i * 3 + 2] = 0.2 + Math.cos(i * 3.3) * t * 0.25; }); s.smoke.flush(); } },
    feats: (c) => c.v === "section" ? [
      { id: "bath", n: "Batholith (granite)", p: [-1.5, -1.2, FZ], d: "A huge dome of magma that cooled slowly deep underground, forming coarse-grained granite. Exposed by erosion it forms inselbergs (e.g. Olumo Rock, Idanre Hills)." },
      { id: "dyke", n: "Dyke", p: [-0.5, -0.7, FZ], d: "A vertical sheet of magma that cut across the rock layers and cooled — often stands up as a wall when the softer rock around it wears away." },
      { id: "sill", n: "Sill", p: [0.2, -0.47, FZ], d: "A horizontal sheet of magma squeezed between the rock layers (parallel to the bedding)." },
      { id: "lacc", n: "Laccolith", p: [-2.2, 0.0, FZ], d: "A lens of magma that pushed the overlying layers up into a dome." },
      { id: "chamber", n: "Magma chamber", p: [1.4, -1.38, FZ], d: "A reservoir of molten rock feeding the volcano through a pipe (vent)." },
      { id: "cone", n: "Volcanic cone — extrusive rock", p: [1.4, 0.75, 1.35], d: "Lava and ash pour out and cool quickly at the surface, forming fine-grained extrusive rocks such as basalt." },
    ] : [
      { id: "granite", n: "Granite (intrusive)", p: [-1.2, 0.6, 0], d: "Cooled slowly underground → large interlocking crystals of quartz (glassy), feldspar (pink/white) and mica (black). Hard and resistant; used for building and road chippings." },
      { id: "basalt", n: "Basalt (extrusive)", p: [1.2, 0.6, 0], d: "Lava that cooled quickly at the surface → tiny crystals, dark and heavy, sometimes with gas holes. Forms lava plateaus (e.g. Jos and Biu Plateaus) and weathers into fertile soil." },
    ],
    fly: [1.6, 1.4, 3.0],
    notes: ["Igneous = 'from fire'. Intrusive (plutonic) rocks cool slowly below ground → coarse crystals. Extrusive (volcanic) rocks cool quickly at the surface → fine crystals.", "Acid igneous rocks (granite) are light and rich in silica; basic rocks (basalt, gabbro) are dark and rich in iron and magnesium.", "Characteristics: crystalline, no layers, no fossils, hard and impermeable (except along joints)."],
    intro: [{ d: 5, cap: "This block of land has been cut open so we can see the rocks underneath. Molten magma has pushed up from below.", cam: BLOCKCAM }],
  });

  /* ===================== RK-b  Sedimentary rocks ===================== */
  const SEDL = [["Conglomerate", 0x9a8a72, "Rounded pebbles and gravel cemented together — deposited by fast rivers or on beaches."], ["Sandstone", 0xd2a66e, "Sand grains cemented by silica or iron oxide — porous, so it holds groundwater (aquifer)."], ["Shale (clay)", 0x6e6c66, "Fine mud and clay pressed into thin layers; soft and impermeable."], ["Limestone", 0xd8d0b8, "Shells and skeletons of sea creatures (calcium carbonate) — often full of fossils; used for cement."], ["Coal", 0x1d1c1e, "Plant remains buried in swamps, compressed and heated over millions of years (e.g. Enugu coal)."]];
  GK.tour("RK-b", {
    title: "Sedimentary rocks",
    blurb: "Rivers carry sediment into the sea where it settles in layers. Drag the time slider to watch layers build up and harden into rock — the oldest at the bottom.",
    envOpts: OUT, cam: [[1.6, 2.8, 8.2], [1.0, 0.8, 0]], variants: [["tank", "How they form"], ["samples", "Rock specimens"]], vlabel: "Show",
    values: { t: 0.65 },
    controls: [{ type: "slider", key: "t", label: "Time (millions of years)", min: 0, max: 1, step: 0.01, fmt: (v) => Math.round(v * 60) + " Ma", show: (c) => c.v === "tank" }],
    build(g, S, s, c) {
      const T3 = T();
      if (c.v === "tank") {
        const glass = new T3.Mesh(new T3.BoxGeometry(5, 2.4, 1.6), new T3.MeshPhysicalMaterial({ color: 0xbfe0f0, transparent: true, opacity: 0.12, roughness: 0.05, transmission: 0.6, side: T3.DoubleSide, depthWrite: false })); glass.position.y = 1.2; g.add(glass);
        s.water = new T3.Mesh(new T3.BoxGeometry(4.96, 1.9, 1.56), new T3.MeshPhysicalMaterial({ color: 0x3d8aa8, transparent: true, opacity: 0.25, roughness: 0.1, depthWrite: false })); s.water.position.y = 1.15; g.add(s.water);
        const base = new T3.Mesh(new T3.BoxGeometry(5.2, 0.12, 1.8), mat(0x3a3530)); base.position.y = -0.06; g.add(base);
        s.layers = SEDL.map(([n, col], i) => { const m = new T3.Mesh(new T3.BoxGeometry(4.96, 0.26, 1.56), GK.pbr(["dry_river_pebbles", "sandstone_cracks", "rock_wall_02", "rock_boulder_dry", "bitumen"][i], { repeat: [3, 0.4] })); m.position.y = 0.13 + i * 0.27; g.add(m); return m; });
        const river = new T3.Mesh(new T3.BoxGeometry(1.2, 0.08, 0.5), new T3.MeshPhysicalMaterial({ color: 0x6a8a70, roughness: 0.2, clearcoat: 1 })); river.position.set(-3.0, 2.15, 0); river.rotation.z = -0.25; g.add(river);
        s.fall = flowParticles(400, 0xc8a676, 0.05); g.add(s.fall); s.fq = []; for (let i = 0; i < 400; i++) s.fq.push([Math.random(), Math.random() * 2 - 1, Math.random()]);
      } else {
        ["sandstone", "shale", "limestone", "coal"].forEach((t, i) => { const x = -2.25 + i * 1.5, y = plinth(g, x, 0, 1.1); const r = GK.rockSample(t, 0.38); r.position.set(x, y + 0.26, 0); g.add(r); });
      }
    },
    tick(S, s, c, dt) {
      if (c.v !== "tank" || !s.layers) return; const n = c.t * SEDL.length;
      s.layers.forEach((m, i) => { const k = Math.max(0, Math.min(1, n - i)); m.visible = k > 0.02; m.scale.y = Math.max(0.02, k); m.position.y = 0.13 * k + (i ? 0 : 0) + s.layers.slice(0, i).reduce((a, L, j) => a + 0.26 * Math.max(0, Math.min(1, n - j)) + 0.01, 0) - 0.13 * (1 - k); m.material.color.setHex(0xffffff).multiplyScalar(1 - 0.25 * Math.max(0, Math.min(1, n - i - 1))); });
      const top = s.layers.reduce((a, L, j) => a + 0.27 * Math.max(0, Math.min(1, n - j)), 0); const P = s.fall.pos; s.fq.forEach((q, i) => { q[2] += dt * (0.3 + 0.4 * ((i % 5) / 5)); if (q[2] > 1) { q[2] = 0; q[0] = Math.random(); q[1] = Math.random() * 2 - 1; } const t = q[2]; P[i * 3] = -2.6 + t * 1.2 + q[0] * 3.6 * t; P[i * 3 + 1] = 2.0 - t * (2.0 - top); P[i * 3 + 2] = q[1] * 0.7; }); s.fall.flush();
    },
    feats: (c) => c.v === "tank" ? SEDL.map(([n, , d], i) => ({ id: "L" + i, n: (i + 1) + ". " + n, p: [2.5, 0.13 + i * 0.27, 0.8], d, dx: 60 })).concat([{ id: "river", n: "River bringing sediment", p: [-3.0, 2.25, 0], d: "Rivers erode the land and carry gravel, sand and mud into lakes and the sea, where it settles out — coarsest first." }]) : [
      { id: "sandstone", n: "Sandstone", p: [-2.25, 0.5, 0], d: SEDL[1][2] }, { id: "shale", n: "Shale", p: [-0.75, 0.5, 0], d: SEDL[2][2] }, { id: "limestone", n: "Limestone", p: [0.75, 0.5, 0], d: SEDL[3][2] }, { id: "coal", n: "Coal", p: [2.25, 0.5, 0], d: SEDL[4][2] }],
    notes: ["Formation: weathering → transport → deposition in layers (strata) → compaction by the weight above → cementation into rock.", "Types: mechanically formed (sandstone, shale, conglomerate), organically formed (limestone, coal), chemically formed (rock salt, gypsum, potash).", "Characteristics: layered (stratified), often contain fossils, usually soft and porous."],
  });

  /* ===================== RK-c  Metamorphic rocks and uses of rocks ===================== */
  const META = [["granite", "gneiss", "Granite → Gneiss", "Heat and pressure line the minerals up into light and dark bands."], ["shale", "slate", "Shale (clay) → Slate", "Pressure turns soft clay into hard slate that splits into thin sheets — roofing and blackboards."], ["limestone", "marble", "Limestone → Marble", "Heat recrystallises limestone into marble (e.g. Igbeti, Jakura in Nigeria) — tiles, sculpture."], ["sandstone", "quartzite", "Sandstone → Quartzite", "Grains fuse together into very hard quartzite."]];
  const USES = [["granite", "Granite", "Building stone, road chippings, monuments (quarries near Abeokuta, Accra plains)."], ["limestone", "Limestone", "Cement (Ewekoro, Nkalagu, Ghana's Nauli), lime for farms, flux in iron smelting."], ["marble", "Marble", "Floor tiles, sculpture, decoration."], ["coal", "Coal", "Fuel for power stations, railways and industry (Enugu)."], ["laterite", "Laterite", "Road surfaces, bricks and building blocks."], ["slate", "Slate", "Roofing, blackboards, paving."], ["sandstone", "Sandstone", "Building, glass making; aquifer for groundwater."], ["quartzite", "Quartzite", "Road stone, refractory bricks."]];
  GK.tour("RK-c", {
    title: "Metamorphic rocks and uses of rocks",
    blurb: "Heat and pressure change rocks without melting them. Compare each parent rock with the metamorphic rock it becomes, then browse rocks by their economic uses.",
    envOpts: OUT, cam: [[0.4, 2.6, 7.2], [0.4, 0.3, 0]], variants: [["meta", "Metamorphism"], ["uses", "Uses of rocks"]], vlabel: "Show",
    build(g, S, s, c) {
      if (c.v === "meta") META.forEach(([a, b], i) => { const z = -1.5 + i * 1.0, y = 0.02; const ra = GK.rockSample(a, 0.3); ra.position.set(-1.3, 0.3, z); g.add(ra); const rb = GK.rockSample(b, 0.3); rb.position.set(1.3, 0.3, z); g.add(rb); g.add(GK.arrow([-0.75, 0.3, z], [0.75, 0.3, z], 0xff8a3a, 0.025)); const slab = new (T().Mesh)(new (T().BoxGeometry)(3.6, 0.04, 0.8), mat(0x9a948a)); slab.position.set(0, y, z); slab.receiveShadow = true; g.add(slab); });
      else USES.forEach(([t], i) => { const x = -2.6 + (i % 4) * 1.75, z = i < 4 ? -0.8 : 0.9, y = plinth(g, x, z, 0.9); const r = GK.rockSample(t, 0.3); r.position.set(x, y + 0.2, z); g.add(r); });
    },
    feats: (c) => c.v === "meta" ? META.map(([a, b, n, d], i) => ({ id: b, n, p: [1.3, 0.62, -1.5 + i * 1.0], d, lp: [0, 0.65, -1.5 + i * 1.0] })) : USES.map(([t, n, d], i) => ({ id: t, n, p: [-2.6 + (i % 4) * 1.75, 0.75, i < 4 ? -0.8 : 0.9], d })),
    fly: [0.6, 1.4, 2.4],
    notes: (c) => c.v === "meta" ? ["Contact metamorphism: heat from nearby magma bakes the rock.", "Regional metamorphism: great heat and pressure during mountain building alters rocks over wide areas.", "Metamorphic rocks are usually harder and more compact than their parent rocks, and may be banded (foliated)."] : ["Rocks give building materials, minerals (tin, gold, iron ore), fuels (coal, petroleum in sedimentary rocks), soil parent material and groundwater.", "Inselbergs and rock scenery attract tourists (Olumo Rock, Zuma Rock, Aburi hills)."],
  });

  /* ===================== TC-a  Vulcanicity ===================== */
  const vol = (x, z, cx, cz, R, H, k = 1.4, crater = 0.18) => { const d = Math.hypot(x - cx, z - cz); return H * Math.max(0, 1 - d / R) ** k - H * 0.2 * G(x, z, cx, cz, crater, crater); };
  const volH = (x, z) => 0.2 + vol(x, z, 0.6, 0, 1.9, 1.9, 1.3, 0.2) + vol(x, z, -1.6, 0.6, 0.6, 0.45, 1.2, 0.08) + (BK.fbm(x * 1.2, z * 1.2, 7) - 0.5) * 0.08;
  const volS = (x, y, z, yt) => { if (Math.abs(x - 0.6) < 0.08 && y > -1.3) return hex3(0xff5a1a); if (Math.abs(y - (-1.25 + (x + 1.6) * 0.0)) < 0.0) return 0; if (((x - 0.6) / 0.9) ** 2 + ((y + 1.4) / 0.28) ** 2 < 1) return hex3(0xff6a20); if (Math.abs(x - (-1.6 + (y + 0.5) * 0.4)) < 0.05 && y > -0.5 && y < yt) return hex3(0xd2481a); if (Math.abs(y + 0.5) < 0.04 && x > -1.6 && x < 0.6) return hex3(0x3a3434); if (Math.abs(x - 2.2) < 0.04 && y > -0.9 && y < yt) return hex3(0x3a3434); if (y > 0.18 && Math.hypot(x - 0.6, z) < 1.9) return Math.floor((y - 0.18) / 0.12) % 2 ? hex3(0x4a4440) : hex3(0x8a7f74); return sedBands(x, y, z); };
  const TYPES = [["ash", "Ash / cinder cone", -2.6, (x, z) => vol(x, z, -2.6, 0, 0.75, 0.8, 1.0, 0.18), "Steep, concave sides built of ash and cinders thrown out by explosions."], ["comp", "Composite cone", -0.8, (x, z) => vol(x, z, -0.8, 0, 1.0, 1.25, 1.6, 0.12), "Alternate layers of ash and lava; tall and symmetrical, with secondary cones (e.g. Mt Cameroon, Kilimanjaro)."], ["shield", "Shield (basic lava) volcano", 1.0, (x, z) => vol(x, z, 1.0, 0, 1.15, 0.45, 1.0, 0.1), "Runny basic lava flows far before cooling → wide, gently sloping cone (e.g. Mauna Loa)."], ["caldera", "Caldera", 2.9, (x, z) => { const d = Math.hypot(x - 2.9, z); return 0.85 * Math.max(0, 1 - d / 0.95) ** 0.9 - 0.75 * sm(0.55, 0.15, d); }, "A huge crater formed when the top of a volcano is blown off or collapses; often fills with water (crater lake)."]];
  GK.tour("TC-a", {
    title: "Vulcanicity",
    blurb: "Magma forces its way up through the crust. See the inside of an active volcano with its intrusive features, then compare the main kinds of volcanic cone.",
    envOpts: OUT, cam: BLOCKCAM, variants: [["section", "Inside a volcano"], ["types", "Types of cone"]], vlabel: "Show",
    build(g, S, s, c) {
      const T3 = T(); s.lavaM = null;
      if (c.v === "section") { g.add(GK.block({ w: 6, d: 4, h: volH, strata: soilOn(volS, 0.05, 0x4a3a2a), tint: (hn, sl, x, z) => (Math.hypot(x - 0.6, z) < 1.8 || Math.hypot(x + 1.6, z - 0.6) < 0.55 ? mix3(hex3(0x6a5e52), hex3(0x3c3530), hn) : GK.tintSavanna(hn, sl, x, z)) }));
        const flow = []; for (let i = 0; i <= 20; i++) { const t = i / 20, x = 0.75 + t * 1.6, z = 0.15 + t * 1.2 + Math.sin(t * 6) * 0.08; flow.push([x, volH(x, z) + 0.02, z]); } const lv = GK.line(flow, 0xff5a1a, 0.06); lv.material.emissive = new T3.Color(0xff3a0a); lv.material.emissiveIntensity = 1.2; g.add(lv); s.lavaM = lv.material;
        s.ash = flowParticles(380, 0xb4aea8, 0.2); g.add(s.ash); s.aq = []; for (let i = 0; i < 380; i++) s.aq.push(Math.random() * 4);
        const gl = new T3.PointLight(0xff6a2a, 0.6, 1.2, 2); gl.position.set(0.6, volH(0.6, 0) + 0.3, 0); g.add(gl); s.glow = gl;
      } else { const h = (x, z) => 0.05 + Math.max(...TYPES.map((t) => t[3](x, z))) + (BK.fbm(x, z, 2) - 0.5) * 0.04; g.add(GK.terrain({ w: 8, d: 3.2, nx: 220, h, tint: (hn, sl, x, z) => mix3(GK.tintSavanna(hn, sl, x, z), hex3(0x4a4440), sm(0.08, 0.3, h(x, z))) })); const lake = new T3.Mesh(new T3.CircleGeometry(0.5, 40), new T3.MeshPhysicalMaterial({ color: 0x2f6f8a, roughness: 0.05, clearcoat: 1 })); lake.rotation.x = -Math.PI / 2; lake.position.set(2.9, 0.24, 0); g.add(lake); s.ash = null; }
    },
    tick(S, s, c, dt) { const t = performance.now() / 1000; if (s.lavaM) s.lavaM.emissiveIntensity = 1 + 0.4 * Math.sin(t * 3); if (s.glow) s.glow.intensity = 0.6 + 0.3 * Math.sin(t * 5); if (s.ash) { const P = s.ash.pos; s.aq.forEach((q, i) => { s.aq[i] = (q + dt * 0.6) % 4; const k = s.aq[i]; P[i * 3] = 0.6 + Math.sin(i * 1.7) * k * 0.3 + k * 0.4; P[i * 3 + 1] = 2.0 + k * 0.9; P[i * 3 + 2] = Math.cos(i * 2.3) * k * 0.3; }); s.ash.flush(); } },
    feats: (c) => c.v === "section" ? [
      { id: "chamber", n: "Magma chamber", p: [0.6, -1.4, FZ], d: "A store of molten rock deep in the crust; pressure of gases drives it upward." },
      { id: "vent", n: "Main vent (pipe)", p: [0.6, -0.6, FZ], d: "The channel through which magma rises to the surface." },
      { id: "crater", n: "Crater", p: [0.6, 1.8, 0], d: "The funnel-shaped opening at the top of the volcano." },
      { id: "cone", n: "Cone of ash and lava layers", p: [1.6, 0.6, FZ], d: "Built up by repeated eruptions of ash and lava (a composite cone)." },
      { id: "lava", n: "Lava flow", p: [2.0, 0.45, 1.2], d: "Molten rock pouring out at the surface; it cools into basalt." },
      { id: "ash", n: "Ash cloud and gases", p: [1.3, 3.0, 0], d: "Dust, ash, steam and gases blasted into the air." },
      { id: "par", n: "Secondary (parasitic) cone", p: [-1.6, 0.7, 0.6], d: "A smaller cone fed by a branch vent on the side of the main volcano." },
      { id: "dyke", n: "Dyke and sill", p: [-0.4, -0.5, FZ], d: "Intrusive sheets of magma that cooled underground: dykes cut across layers, sills lie along them." },
    ] : TYPES.map(([id, n, x, , d]) => ({ id, n, p: [x, 0.95, 0], d })),
    fly: [1.4, 1.6, 3.2],
    notes: ["Vulcanicity: all the ways magma moves into the crust (intrusive) or onto the surface (extrusive).", "Volcanoes may be active (erupting), dormant (sleeping) or extinct (dead).", "Other features: hot springs, geysers, fumaroles. Effects: fertile volcanic soils, minerals, tourism, geothermal power — but loss of life and property."],
  });

  /* ===================== TC-b  Earthquakes ===================== */
  GK.def3d("TC-b", {
    title: "Earthquakes",
    blurb: "Rocks under strain snap along a fault and release energy as seismic waves. Set the magnitude, start the quake and watch the waves spread from the focus while the seismograph records them.",
    envOpts: OUT, cam: [[5.4, 3.6, 7.6], [0.3, -0.3, 0]],
    values: { mag: 6.5, go: 1 },
    controls: [{ type: "slider", key: "mag", label: "Magnitude (Richter scale)", min: 2, max: 9, step: 0.1 }, { type: "toggle", key: "go", label: "Quake running" }],
    build(S, s) {
      const T3 = T(), g = BK.group(S, s), h = (x, z) => 0.25 + (BK.fbm(x * 0.8, z * 0.8, 4) - 0.5) * 0.12 + (x > 0 ? 0.08 : 0);
      const fault = (x, y) => Math.abs(x - (y + 1.6) * 0.18 + 0.29) < 0.025;
      g.add(GK.block({ w: 6, d: 4, h, strata: soilOn((x, y, z, yt) => (fault(x, y) ? hex3(0x201a18) : sedBands(x, y + (x > (y + 1.6) * 0.18 - 0.29 ? 0.08 : 0), z))) }));
      s.focus = V(0, -1.15, 2.02); s.epi = V(0, h(0, 2) , 2.0);
      const fm = new T3.Mesh(new T3.SphereGeometry(0.07, 16, 12), new T3.MeshBasicMaterial({ color: 0xff3a1a })); fm.position.copy(s.focus); g.add(fm);
      const em = new T3.Mesh(new T3.ConeGeometry(0.08, 0.2, 16), new T3.MeshBasicMaterial({ color: 0xffd23a })); em.rotation.x = Math.PI; em.position.set(0, h(0, 1.6) + 0.15, 1.6); g.add(em);
      s.rings = []; for (let i = 0; i < 4; i++) { const r = new T3.Mesh(new T3.TorusGeometry(1, 0.012, 6, 96), new T3.MeshBasicMaterial({ color: 0xffd23a, transparent: true, opacity: 0.8 })); r.rotation.x = Math.PI / 2; r.position.set(0, h(0, 1.6) + 0.02, 1.6); g.add(r); s.rings.push(r); }
      s.sec = []; for (let i = 0; i < 4; i++) { const r = new T3.Mesh(new T3.RingGeometry(0.98, 1, 64, 1, 0, Math.PI * 2), new T3.MeshBasicMaterial({ color: i % 2 ? 0x7fd6ff : 0xff8a6a, transparent: true, opacity: 0.8, side: T3.DoubleSide })); r.position.copy(s.focus); r.position.z = 2.025; g.add(r); s.sec.push(r); }
      s.houses = []; [[-2.2, 0.6], [-1.6, 1.2], [1.0, 0.9], [1.6, 1.4], [2.3, 0.2], [-0.8, -0.6], [0.6, -1.0]].forEach(([x, z], i) => { const hs = GK.house(0.22); hs.position.set(x, h(x, z), z); g.add(hs); s.houses.push([hs, x, z, h(x, z)]); });
      s.t = 0; s.trace = [];
    },
    update(S, s, c, dt) {
      if (c.go) s.t += dt; const per = 4, tt = s.t % per, A = Math.pow(10, (c.mag - 6.5) * 0.35) * 0.04;
      s.rings.forEach((r, i) => { const k = ((tt * 0.9 - i * 0.35) % 3 + 3) % 3; r.scale.setScalar(0.05 + k * 1.3); r.material.opacity = Math.max(0, 0.9 - k / 3); });
      s.sec.forEach((r, i) => { const k = ((tt * (i % 2 ? 0.6 : 1.0) - Math.floor(i / 2) * 0.5) % 3 + 3) % 3; r.scale.setScalar(0.05 + k * 1.0); r.material.opacity = Math.max(0, 0.9 - k / 3); });
      s.houses.forEach(([hs, x, z, y]) => { const d = Math.hypot(x, z - 1.6), arr = d / 1.2, sh = tt > arr ? A * Math.exp(-(tt - arr) * 0.9) * Math.max(0, 1 - d / 6) * 2 : 0; hs.position.x = x + Math.sin(s.t * 40 + d) * sh; hs.rotation.z = Math.sin(s.t * 33 + d) * sh * 2; if (c.mag > 7.5 && sh > 0.03) hs.rotation.x = Math.min(0.5, (hs.rotation.x || 0) + dt * 0.3); if (tt < 0.05) hs.rotation.x = 0; });
      const P = 1.2, Sw = 2.0, L = 3.0; const v = (tt > P ? Math.sin(tt * 60) * 0.3 * Math.exp(-(tt - P) * 3) : 0) + (tt > Sw ? Math.sin(tt * 30) * 0.7 * Math.exp(-(tt - Sw) * 2.5) : 0) + (tt > L ? Math.sin(tt * 12) * 1.0 * Math.exp(-(tt - L) * 1.6) : 0);
      s.trace.push(v * Math.min(1.6, A / 0.04)); if (s.trace.length > 200) s.trace.shift(); if (tt < dt) s.trace = [];
    },
    overlay(ctx, s, c, S, B) { const x0 = 12, y0 = GK.storyOn ? 196 : 262, w = 300, h = 126; B.panel(x0, y0, w, h); ctx.fillStyle = "#cfe0f5"; ctx.font = "700 10px 'IBM Plex Sans',sans-serif"; ctx.fillText("SEISMOGRAPH TRACE", x0 + 10, y0 + 16); const my = y0 + 72; ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.beginPath(); ctx.moveTo(x0 + 10, my); ctx.lineTo(x0 + w - 10, my); ctx.stroke(); ctx.strokeStyle = "#7fd6ff"; ctx.lineWidth = 1.3; ctx.beginPath(); (s.trace || []).forEach((v, i) => { const X = x0 + 10 + i * (w - 20) / 200, Y = my - Math.max(-44, Math.min(44, v * 30)); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); ctx.fillStyle = "#ffd27a"; ctx.font = "9px 'IBM Plex Sans',sans-serif"; [["P", 1.2], ["S", 2.0], ["L (surface)", 3.0]].forEach(([n, t]) => ctx.fillText(n, x0 + 10 + t / 4 * 60 * (w - 20) / 200 * 1, y0 + h - 8)); },
    labels: (s, c) => [{ id: "focus", p: [0, -1.15, 2.05], t: "Focus (hypocentre)", col: "#ff9a8a", dx: -60, dy: 10 }, { id: "epi", p: [0, 0.45, 1.6], t: "Epicentre — directly above the focus", col: "#ffd27a", dy: -40 }, { id: "fault", p: [-0.05, -0.4, 2.05], t: "Fault line", col: "#e8f1ff", dx: -70, dy: -10 }, { id: "pw", p: [0.9, -0.5, 2.05], t: "Seismic waves", col: "#7fd6ff", dx: 50 }],
    hud: (s, c) => { const E = Math.pow(10, 1.5 * (c.mag - 6.5)); return [{ title: "Magnitude " + f(c.mag, 1), lines: [["Each whole number on the Richter scale = 10× bigger ground movement and ≈ 32× more energy.", "#ffd27a", true], ["Compared with a magnitude 6.5 quake: " + (E >= 1 ? f(E, E < 10 ? 1 : 0) + "× the energy" : "1/" + f(1 / E, 0) + " of the energy"), "#8fd0ff", true], "Waves: P (primary, fastest, push–pull), S (secondary, side to side, not through liquid), L (surface waves, slowest, most damaging).", "Causes: plate movements along faults, volcanic eruptions, collapse of mine roofs, reservoirs.", "Effects: collapse of buildings, landslides, tsunamis, fires, loss of life. Recorded by a seismograph; intensity on the Mercalli scale."] }]; },
    story: [
      { d: 5, cap: "Stress builds up in rocks on either side of a fault until they suddenly snap and slip.", set: { mag: 6.5, go: 1 }, hl: "fault" },
      { d: 5, cap: "The point underground where the rocks break is the focus. Energy spreads out from it as seismic waves.", hl: "focus", cam: [[2.8, 0.2, 5.4], [0, -0.8, 2]] },
      { d: 5, cap: "The point on the surface directly above the focus is the epicentre, where shaking is usually strongest.", hl: "epi", cam: [[3.6, 3.2, 6.6], [0, 0, 1]] },
      { d: 6, cap: "A seismograph records P waves first, then S waves, then the slow, destructive surface waves.", cam: [[5.4, 3.6, 7.6], [0.3, -0.3, 0]] },
      { d: 6, cap: "At magnitude 8 the ground motion is 30 times bigger than at magnitude 6.5 — buildings collapse.", tween: { mag: [6.5, 8.2] } },
    ],
    draw: GK.fallback("Earthquakes", ["Focus: point of rupture underground", "Epicentre: surface point above focus", "P, S and L waves; Richter scale is logarithmic"]),
  });

  /* ===================== TC-c  Mountains ===================== */
  const fold = (x, k) => k * 0.55 * Math.sin(x * 1.25 + 0.5) + (k > 0.7 ? (k - 0.7) * 0.9 * Math.sin(x * 2.5 + 1) : 0);
  const MT = {
    fold: { h: (x, z, k) => 0.3 + fold(x, k) + (BK.fbm(x, z, 1) - 0.5) * 0.06, s: (k) => soilOn((x, y, z) => sedBands(x, y - fold(x, k) + (fold(x, k) > 0 ? 0 : 0), z)) },
    block: { h: (x, z, k) => 0.3 + (Math.abs(x) < 0.9 ? -0.6 * k : x < -1.6 || x > 1.6 ? 0 : 0.0) + (x < -2.3 || x > 2.3 ? 0.55 * k : 0) * 0 + (Math.abs(x) > 0.9 && Math.abs(x) < 3 ? 0.5 * k : 0) + (BK.fbm(x * 1.5, z, 2) - 0.5) * 0.05 },
  };
  MT.block.s = (k) => soilOn((x, y, z) => { const off = Math.abs(x) < 0.9 ? -0.6 * k : 0.5 * k; if (Math.abs(Math.abs(x) - 0.9) < 0.025) return hex3(0x1c1816); return sedBands(x, y - off, z); });
  GK.tour("TC-c", {
    title: "Mountains",
    blurb: "Mountains form in four ways. Squeeze the layers to make fold mountains, pull the crust apart to make block mountains and rift valleys, or compare volcanic and residual mountains.",
    envOpts: OUT, cam: BLOCKCAM, variants: [["fold", "Fold"], ["block", "Block & rift valley"], ["volc", "Volcanic"], ["resid", "Residual"]], vlabel: "Kind",
    values: { k: 0.8 },
    controls: [{ type: "slider", key: "k", label: "Earth movement (compression / tension)", min: 0, max: 1, step: 0.05, show: (c) => c.v === "fold" || c.v === "block" }],
    rebuildOn: (c) => (c.v === "fold" || c.v === "block" ? Math.round(c.k * 20) : 0),
    build(g, S, s, c) {
      const k = c.k;
      if (c.v === "fold" || c.v === "block") { const M = MT[c.v]; g.add(GK.block({ w: 6, d: 4, h: (x, z) => M.h(x, z, k), strata: M.s(k), nx: 140, ny: 54 })); const dir = c.v === "fold" ? 1 : -1; g.add(GK.arrow([-4.4 * 1, 0, 2.3], [-4.4 + 0.9 * dir, 0, 2.3], 0xff5a3a, 0.05)); g.add(GK.arrow([4.4, 0, 2.3], [4.4 - 0.9 * dir, 0, 2.3], 0xff5a3a, 0.05)); }
      else if (c.v === "volc") { g.add(GK.block({ w: 6, d: 4, h: volH, strata: soilOn(volS, 0.05), tint: (hn, sl, x, z) => mix3(GK.tintSavanna(hn, sl, x, z), hex3(0x4a4440), sm(0.4, 1.2, volH(x, z))) })); }
      else { const h = (x, z) => 0.2 + 1.0 * G(x, z, -0.8, 0, 0.7, 0.8) ** 0.7 + 0.6 * G(x, z, 1.4, -0.6, 0.45, 0.5) ** 0.6 + (BK.fbm(x * 2, z * 2, 5) - 0.5) * 0.08; g.add(GK.block({ w: 6, d: 4, h, strata: soilOn((x, y, z, yt) => (((x + 0.8) / 1.0) ** 2 + ((y + 0.4) / 1.6) ** 2 < 1 || ((x - 1.4) / 0.6) ** 2 + ((y + 0.6) / 1.3) ** 2 < 1 ? hex3(0xbf9a8c).map((v) => v * (0.9 + 0.2 * BK.noise3(x * 6, y * 6, 1))) : sedBands(x, y, z)), 0.04), tint: (hn, sl, x, z) => mix3(GK.tintSavanna(hn, sl, x, z), hex3(0x8a7c72), sm(0.25, 0.5, sl)) })); }
    },
    feats: (c) => ({
      fold: [{ id: "anti", n: "Anticline (upfold)", p: [-0.4, 0.85, FZ], d: "Layers bent upwards into an arch by compression." }, { id: "syn", n: "Syncline (downfold)", p: [2.1, -0.1, FZ], d: "Layers bent downwards into a trough." }, { id: "limb", n: "Limb", p: [0.9, 0.3, FZ], d: "The sloping side of a fold between an anticline and a syncline." }, { id: "comp", n: "Compressional force", p: [-3.6, 0, 2.3], d: "Two plates push towards each other, crumpling the rocks. Examples: Atlas Mountains, Alps, Himalayas, Andes, Rockies." }],
      block: [{ id: "horst", n: "Block mountain (horst)", p: [-2.0, 0.3 + 0.5 * c.k, FZ], d: "A block of land left standing (or pushed up) between two faults. Examples: Ruwenzori, Vosges, Usambara." }, { id: "rift", n: "Rift valley (graben)", p: [0, 0.3 - 0.6 * c.k, FZ], d: "A block that sank between two parallel faults. Example: the Great Rift Valley of East Africa." }, { id: "scarp", n: "Fault scarp", p: [0.9, 0.3, 1.2], d: "The steep slope formed along a fault line." }, { id: "fault", n: "Normal faults", p: [-0.9, -0.6, FZ], d: "Cracks along which rocks have moved; tension pulled the crust apart." }],
      volc: [{ id: "cone", n: "Volcanic mountain", p: [0.6, 2.0, 0], d: "Built up by lava and ash from eruptions. Examples: Mount Cameroon, Kilimanjaro, Mount Kenya." }, { id: "pipe", n: "Vent", p: [0.6, -0.6, FZ], d: "Magma rises through the vent and piles up around it." }],
      resid: [{ id: "insel", n: "Residual mountain / inselberg", p: [-0.8, 1.25, 0], d: "The remnant of an old landmass worn down by erosion; hard granite survives while softer rock is removed. Examples: Idanre Hills, Olumo Rock, Zuma Rock." }, { id: "hard", n: "Resistant granite core", p: [-0.8, -0.6, FZ], d: "Hard igneous rock resists weathering and stands up above the plain." }, { id: "small", n: "Smaller residual hill", p: [1.4, 0.85, -0.6], d: "Further erosion will reduce it to a low rounded hill." }],
    })[c.v],
    notes: ["Mountains are high land rising steeply above the surroundings, usually over 600 m.", "Importance: barriers to movement, sources of rivers, minerals, timber, tourism, relief rainfall, hydro-electric power sites."],
  });

  /* ===================== TC-d  Plains and plateaus ===================== */
  GK.tour("TC-d", {
    title: "Plains and plateaus",
    blurb: "Plains are low, flat lands; plateaus are high, flat-topped lands. Compare the main kinds and their uses.",
    envOpts: OUT, cam: BLOCKCAM, variants: [["plain", "Plains"], ["plat", "Plateaus"]], vlabel: "Show",
    build(g, S, s, c) {
      const T3 = T();
      if (c.v === "plain") { const rv = (x) => 0.3 * Math.sin(x * 1.6); const h = (x, z) => 0.18 - 0.012 * z + (x < -1.5 ? (-1.5 - x) * 0.35 : 0) - 0.05 * Math.exp(-(((z - rv(x)) / 0.12) ** 2)) + (z > 1.4 ? -(z - 1.4) * 0.25 : 0) + (BK.fbm(x, z, 3) - 0.5) * 0.03; g.add(GK.block({ w: 6, d: 4, h, strata: soilOn((x, y, z) => (y > -0.25 ? hex3(0x8a7050).map((v) => v * (0.85 + 0.3 * BK.noise3(x * 5, y * 30, z))) : sedBands(x, y, z)), 0.06), tint: (hn, sl, x, z) => mix3(hex3(0x6a8a3a), hex3(0x8a9a4a), BK.fbm(x * 2, z * 2, 1)) })); const P = []; for (let i = 0; i <= 60; i++) { const x = -1.6 + i / 60 * 4.6; P.push([x, h(x, rv(x)) + 0.03, rv(x)]); } g.add(GK.line(P, 0x2f78c0, 0.04)); const sea = GK.water(8, 3, 0x2a6f8f, 0.9); sea.position.set(0, 0.13, 3.0); g.add(sea); }
      else { const h = (x, z) => { const r = Math.hypot((x - 0.4) / 2.0, (z + 0.2) / 1.4); let y = 0.15 + 1.0 / (1 + Math.pow(r, 10)); const val = Math.exp(-(((x - 0.2 - 0.6 * z) / 0.25) ** 2)) * (r < 1.1 ? 0.55 : 0); y -= val; y += 0.6 * G(x, z, -2.3, 1.2, 0.25, 0.25) ** 0.4 * (Math.hypot(x + 2.3, z - 1.2) < 0.3 ? 1 : 0.3); return y + (BK.fbm(x * 1.5, z * 1.5, 8) - 0.5) * 0.06; }; g.add(GK.block({ w: 6, d: 4, h, strata: soilOn((x, y, z) => (y > 0.85 ? hex3(0x3a3434) : sedBands(x, y, z)), 0.05), tint: (hn, sl, x, z) => mix3(GK.tintSavanna(hn, sl, x, z), hex3(0x8a6a50), sm(0.3, 0.6, sl)) })); }
    },
    feats: (c) => c.v === "plain" ? [
      { id: "flood", n: "Flood plain (alluvial plain)", p: [0.6, 0.3, 0.3], d: "Flat land beside a river built up by silt deposited in floods — very fertile (e.g. Niger and Benue flood plains, Sokoto–Rima)." },
      { id: "coast", n: "Coastal plain", p: [0.8, 0.2, 1.3], d: "Low land along the sea, formed by deposition or uplift of the sea floor (e.g. the coastal plains of West Africa)." },
      { id: "alluv", n: "Layers of alluvium", p: [0.4, -0.15, FZ], d: "Fine sediment laid down by rivers; deep, rich soils for rice, sugar cane and vegetables." },
      { id: "up", n: "Upland edge", p: [-2.5, 0.6, 0], d: "Plains often lie between uplands and the sea; they suit farming, settlement, roads and railways." },
    ] : [
      { id: "table", n: "Tableland (plateau surface)", p: [0.9, 1.25, -0.6], d: "High, extensive and fairly flat land, often above 600 m (e.g. Jos Plateau, Futa Jallon, Adamawa)." },
      { id: "escarp", n: "Escarpment", p: [1.2, 0.6, FZ - 0.4], d: "The steep edge of a plateau." },
      { id: "dissect", n: "Dissected plateau — river valley", p: [0.4, 0.6, -0.4], d: "Rivers cut deep valleys into the plateau, breaking it into separate blocks." },
      { id: "lava", n: "Lava cap (volcanic plateau)", p: [-0.8, 1.0, FZ], d: "Sheets of basalt poured out from fissures can build a lava plateau (e.g. Biu Plateau, Deccan)." },
      { id: "butte", n: "Butte / mesa", p: [-2.3, 0.85, 1.2], d: "Isolated flat-topped hills left as the plateau edge retreats." },
    ],
    notes: (c) => c.v === "plain" ? ["Types: structural (uplifted sea floor), depositional (flood, delta, coastal, lacustrine, glacial) and erosional (peneplain).", "Uses: agriculture, settlement, transport routes, industry."] : ["Types: intermontane (between mountains), piedmont (at the foot of mountains), continental (tableland), volcanic, dissected.", "Uses: mining (tin on Jos Plateau), cool climate for livestock, tourism, sources of rivers, HEP."],
  });

  /* ===================== TC-e  Karst landforms ===================== */
  GK.tour("TC-e", {
    title: "Karst (limestone) landforms",
    blurb: "Rain water containing carbon dioxide slowly dissolves limestone along its joints, creating a dry surface full of hollows and a world of caves underneath.",
    envOpts: Object.assign({}, OUT, { hdri: "rooitou_park" }), cam: BLOCKCAM,
    build(g, S, s, c) {
      const T3 = T(); const h = (x, z) => 0.45 - 0.22 * G(x, z, -1.4, -0.4, 0.4, 0.4) - 0.18 * G(x, z, 0.6, -0.8, 0.35, 0.3) - 0.2 * G(x, z, 1.4, 0.6, 0.7, 0.35) - 0.3 * G(x, z, -0.2, 1.0, 0.13, 0.13) + (BK.fbm(x * 3, z * 3, 6) - 0.5) * 0.05 - (x > 2.2 ? (x - 2.2) * 0.4 : 0);
      const cave = (x, y) => Math.hypot((x + 0.3) / 1.4, (y + 0.65) / 0.28) < 1 || (Math.abs(y + 1.05) < 0.07 && x > -2.4 && x < 3.1) || Math.hypot((x - 1.8) / 0.3, (y + 0.85) / 0.25) < 1;
      g.add(GK.block({ w: 6, d: 4, h, ground: "rock_boulder_dry", strata: soilOn((x, y, z, yt) => { if (cave(x, y)) return Math.abs(y + 1.05) < 0.07 ? hex3(0x2a6a8a) : hex3(0x141210); if (y < -1.3) return hex3(0x6a645a); const j = Math.abs(((x * 2.3) % 1 + 1) % 1 - 0.5) < 0.02; return hex3(j ? 0x8a8470 : 0xd8d0b8).map((v) => v * (0.9 + 0.15 * BK.noise3(x * 4, y * 9, z))); }, 0.035), tint: (hn, sl, x, z) => mix3(hex3(0x7a8a5a), hex3(0xbab4a2), sm(0.3, 0.7, BK.fbm(x * 4, z * 4, 2))) }));
      const sm1 = mat(0xe4dcc4, { roughness: 0.6 }); for (let i = 0; i < 14; i++) { const x = -1.5 + i * 0.18, L = 0.08 + Math.random() * 0.12; const st = new T3.Mesh(new T3.ConeGeometry(0.025, L, 8), sm1); st.rotation.x = Math.PI; st.position.set(x, -0.39 - L / 2, 2.03); g.add(st); const sg = new T3.Mesh(new T3.ConeGeometry(0.03, L * 0.8, 8), sm1); sg.position.set(x + 0.05, -0.92 + L * 0.4, 2.03); g.add(sg); }
      const pil = new T3.Mesh(new T3.CylinderGeometry(0.035, 0.05, 0.52, 10), sm1); pil.position.set(0.55, -0.66, 2.03); g.add(pil);
      const spring = []; for (let i = 0; i <= 12; i++) spring.push([3.02 + i * 0.05, -1.05 - i * i * 0.004, 1.9]); g.add(GK.line(spring, 0x4a9ac8, 0.03));
    },
    feats: [
      { id: "doline", n: "Doline (sink hole)", p: [-1.4, 0.3, -0.4], d: "A funnel-shaped hollow where the limestone has been dissolved or a cave roof has collapsed." },
      { id: "swallow", n: "Swallow hole (sinkhole)", p: [-0.2, 0.2, 1.0], d: "A stream disappears underground through an enlarged joint." },
      { id: "uvala", n: "Uvala", p: [1.4, 0.3, 0.6], d: "A large hollow formed when several dolines join together." },
      { id: "clint", n: "Clints and grikes (limestone pavement)", p: [0.4, 0.45, -1.3], d: "Bare limestone blocks (clints) separated by deep, widened joints (grikes)." },
      { id: "cave", n: "Cavern", p: [-0.3, -0.62, FZ], d: "Underground hollow dissolved out by water flowing along bedding planes and joints." },
      { id: "stal", n: "Stalactites and stalagmites", p: [-1.1, -0.6, FZ], d: "Dripping water deposits calcite: stalactites hang from the roof, stalagmites grow up from the floor." },
      { id: "pillar", n: "Pillar (column)", p: [0.55, -0.66, FZ], d: "Where a stalactite and stalagmite join." },
      { id: "river", n: "Underground river", p: [1.0, -1.05, FZ], d: "Surface streams flow underground along the impermeable layer." },
      { id: "resurg", n: "Resurgence (spring)", p: [3.1, -1.05, 1.9], d: "Where the underground river comes back to the surface at the junction with impermeable rock." },
    ],
    fly: [1.2, 0.8, 2.8],
    notes: ["Conditions: thick, well-jointed, pure limestone; moderate to heavy rainfall; a deep water table.", "Carbonation: CaCO₃ + H₂O + CO₂ → Ca(HCO₃)₂ (soluble).", "Examples: Karst region of Slovenia, Kentucky caves; in West Africa, limestone areas near Ewekoro, Yandev and the Ogbunike caves.", "Uses: limestone for cement; tourism; poor soils for farming; water shortage on the surface."],
  });

  /* ===================== TC-f  Coastal landforms ===================== */
  const coastEdge = (x) => 1.0 + 1.25 * Math.exp(-(((x + 1.0) / 0.75) ** 2)) - 0.55 * Math.exp(-(((x - 1.3) / 0.9) ** 2));
  const coastH = (x, z) => { const e = coastEdge(x), head = Math.exp(-(((x + 1.0) / 0.9) ** 2)), cliffK = 0.35 + 0.65 * head; const land = 0.55 + 0.15 * head - 0.1 * z * 0 + (BK.fbm(x * 1.5, z * 1.5, 9) - 0.5) * 0.06; const drop = sm(e - 0.06 - (1 - cliffK) * 0.9, e, z); return Math.max(-0.06, land * (1 - drop) - 0.06 * drop); };
  GK.tour("TC-f", {
    title: "Coastal landforms",
    blurb: "Waves wear back headlands and build up beaches, spits and bars. Explore the features of a coast of erosion and a coast of deposition.",
    envOpts: Object.assign({}, OUT, { hdri: "aristea_wreck_puresky" }), cam: [[2.6, 2.4, 6.4], [-0.4, 0.1, 1.8]], variants: [["erosion", "Erosion"], ["deposition", "Deposition"]], vlabel: "Coast of",
    build(g, S, s, c) {
      const T3 = T();
      if (c.v === "erosion") {
        g.add(GK.terrain({ w: 8, d: 6, nx: 240, h: coastH, ground: "coast_sand_rocks_02", tint: (hn, sl, x, z) => (coastH(x, z) < 0.04 ? hex3(0xd8c89c) : sl > 0.3 ? hex3(0xc8c0b0) : GK.tintSavanna(hn, sl, x, z)) }));
        const rock = GK.rockMat("limestone", 1.5);
        const arch = new T3.Mesh(new T3.TorusGeometry(0.28, 0.12, 12, 24, Math.PI), rock); arch.position.set(-1.0, 0, 2.5); arch.rotation.y = Math.PI / 2; g.add(arch);
        const stack = new T3.Mesh(new T3.CylinderGeometry(0.13, 0.2, 0.75, 9), rock); stack.position.set(-0.7, 0.3, 3.0); g.add(stack);
        const stump = new T3.Mesh(new T3.CylinderGeometry(0.15, 0.2, 0.12, 9), rock); stump.position.set(-0.45, 0.0, 3.45); g.add(stump);
        const plat = new T3.Mesh(new T3.BoxGeometry(2.0, 0.03, 0.8), mat(0xa89c88)); plat.position.set(-0.8, -0.005, 2.8); g.add(plat);
      } else {
        const h = (x, z) => { let y = 0.45 - 0.35 * sm(-0.6, 1.0, z); const spit = Math.exp(-(((z - 1.35 - 0.12 * (x + 3)) / 0.09) ** 2)) * sm(-3.5, 2.6, -x + 3.0) * (x < 2.0 ? 1 : 0); y = Math.max(y, -0.06 + spit * 0.12); if (z > 1.8) y = -0.06; return y + (BK.fbm(x * 2, z * 2, 2) - 0.5) * 0.03; };
        g.add(GK.terrain({ w: 8, d: 6, nx: 200, h, ground: "coast_sand_rocks_02", tint: (hn, sl, x, z) => (h(x, z) < 0.1 ? hex3(0xe2d2a4) : GK.tintSavanna(hn, sl, x, z)) }));
        const lag = GK.water(5, 0.9, 0x3d8a9a, 0.85); lag.position.set(-0.6, -0.03, 0.95); g.add(lag);
        const mangr = []; for (let i = 0; i < 40; i++) mangr.push([-2.6 + Math.random() * 3.2, 0.7 + Math.random() * 0.3]); mangr.forEach(([x, z]) => { const t = GK.tree(0.12, x * 9, 0x2e5a26); t.position.set(x, h(x, z), z); g.add(t); });
      }
      const sea = GK.water(14, 8, 0x2a6f8f, 0.9); sea.position.set(0, -0.02, 5.2); g.add(sea); s.sea = sea;
      s.foam = flowParticles(300, 0xffffff, 0.04); g.add(s.foam); s.fq = Array.from({ length: 300 }, () => [Math.random() * 8 - 4, Math.random()]);
    },
    tick(S, s, c, dt) { if (s.sea && s.sea.material.normalMap) s.sea.material.normalMap.offset.y += dt * 0.03; if (s.foam) { const P = s.foam.pos; s.fq.forEach((q, i) => { q[1] = (q[1] + dt * 0.25) % 1; P[i * 3] = q[0]; P[i * 3 + 1] = 0.0; P[i * 3 + 2] = 4.2 - q[1] * 1.6 + Math.sin(q[0] * 2) * 0.2; }); s.foam.flush(); } },
    feats: (c) => c.v === "erosion" ? [
      { id: "head", n: "Headland", p: [-1.0, 0.72, 1.4], d: "Hard rock that juts out into the sea because it resists erosion." },
      { id: "bay", n: "Bay", p: [1.3, 0.1, 0.6], d: "A curved inlet where softer rock has been worn back." },
      { id: "cliff", n: "Cliff and wave-cut notch", p: [-0.4, 0.35, 2.05], d: "Waves undercut the base of the land, forming a notch; the rock above collapses and the cliff retreats." },
      { id: "plat", n: "Wave-cut platform", p: [-1.5, 0.0, 2.8], d: "A flat rock shelf left at the foot of a retreating cliff, exposed at low tide." },
      { id: "arch", n: "Arch", p: [-1.0, 0.42, 2.5], d: "Caves on both sides of a headland meet to form an arch." },
      { id: "stack", n: "Stack", p: [-0.7, 0.7, 3.0], d: "When the arch roof collapses, a pillar of rock — a stack — is left standing in the sea." },
      { id: "stump", n: "Stump", p: [-0.45, 0.1, 3.45], d: "A stack worn down until only a low stump is left, covered at high tide." },
    ] : [
      { id: "beach", n: "Beach", p: [0.4, 0.15, 0.6], d: "Sand and shingle deposited by constructive waves between low and high tide." },
      { id: "spit", n: "Spit", p: [-0.5, 0.1, 1.35], d: "A long ridge of sand built out across a bay by longshore drift, joined to the land at one end." },
      { id: "bar", n: "Sand bar", p: [-2.4, 0.08, 1.2], d: "A spit that grows right across a bay, closing it off." },
      { id: "lagoon", n: "Lagoon", p: [-0.6, 0.0, 0.95], d: "The calm water trapped behind a bar or spit (e.g. Lagos, Lekki and Keta lagoons)." },
      { id: "mang", n: "Mangrove swamp", p: [-1.0, 0.25, 0.8], d: "Salt-tolerant trees trap mud along sheltered lagoons and creeks (Niger Delta, Sierra Leone coast)." },
    ],
    fly: [1.4, 1.4, 2.6],
    notes: (c) => c.v === "erosion" ? ["Processes of wave erosion: hydraulic action, abrasion (corrasion), attrition, solution (corrosion).", "Destructive waves: high, frequent and steep, with a strong backwash."] : ["Longshore drift moves sand along the coast in the direction of the prevailing waves.", "Constructive waves: low, gentle, with a strong swash and weak backwash — they build beaches.", "West African coast: long sandy beaches, sand bars and lagoons (Lagos to Keta); estuaries and rias in Sierra Leone."],
  });

  /* ===================== DN-a  Weathering ===================== */
  GK.tour("DN-a", {
    title: "Weathering",
    blurb: "Weathering breaks rocks down where they are, without moving them. Drag time forward to see each process at work on the rocks.",
    envOpts: OUT, cam: [[0.6, 3.2, 7.6], [0.4, 0.4, 0]], variants: [["phys", "Physical (mechanical)"], ["chem", "Chemical"], ["bio", "Biological"]], vlabel: "Kind",
    values: { t: 0.6 }, controls: [{ type: "slider", key: "t", label: "Time", min: 0, max: 1, step: 0.02 }],
    rebuildOn: (c) => Math.round(c.t * 25),
    build(g, S, s, c) {
      const T3 = T(), t = c.t, ground = new T3.Mesh(new T3.CircleGeometry(6, 48), GK.pbr("dry_ground_rocks", { repeat: 6 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
      const rockM = (type) => GK.rockMat(type, 1);
      if (c.v === "phys") {
        for (let k = 0; k < 3; k++) { const sh = new T3.Mesh(new T3.SphereGeometry(1.0 - k * 0.12, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), rockM("granite")); sh.position.set(-2.2 + (k === 0 ? t * 0.35 : 0), 0, 0); sh.rotation.z = k === 0 ? -t * 0.35 : 0; sh.castShadow = true; g.add(sh); if (k === 0 && t > 0.5) sh.scale.set(1, 1, 1 - (t - 0.5)); }
        for (let i = 0; i < 8; i++) { const b = new T3.Mesh(new T3.BoxGeometry(0.42, 0.42, 0.42), rockM("sandstone")); const ix = i % 2, iy = Math.floor(i / 4), iz = Math.floor(i / 2) % 2, sp = t * 0.25; b.position.set(0.4 + (ix - 0.5) * (0.43 + sp), 0.22 + iy * (0.43 + sp * 0.2), (iz - 0.5) * (0.43 + sp)); b.rotation.set(sp * i * 0.3, sp * i, 0); b.castShadow = true; g.add(b); }
        const grains = flowParticles(Math.round(80 + t * 400), 0xd8c8a8, 0.05); for (let i = 0; i < grains.n; i++) { grains.pos.set([2.6 + (Math.random() - 0.5) * (0.8 + t), 0.03, (Math.random() - 0.5) * (0.8 + t)], i * 3); } grains.flush(); g.add(grains); const core = new T3.Mesh(new T3.IcosahedronGeometry(0.45 * (1 - t * 0.5), 1), rockM("granite")); core.position.set(2.6, 0.35 * (1 - t * 0.5), 0); g.add(core);
      } else if (c.v === "chem") {
        const lime = new T3.Mesh(new T3.BoxGeometry(1.4, 0.6, 1.0, 20, 10, 14), rockM("limestone")); const p = lime.geometry.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getY(i) > 0.29) p.setY(i, 0.3 - t * 0.25 * BK.noise3(p.getX(i) * 6, 0, p.getZ(i) * 6) ** 2); } lime.geometry.computeVertexNormals(); lime.position.set(-2.4, 0.3, 0); g.add(lime);
        const lat = GK.rockSample("granite", 0.55); lat.position.set(0, 0.45, 0); lat.material.color.copy(new T3.Color(0xffffff).lerp(new T3.Color(0xb0582a), t)); g.add(lat);
        const gr = GK.rockSample("granite", 0.5); gr.position.set(2.4, 0.4, 0); gr.scale.y = 1 - t * 0.5; g.add(gr); const clay = new T3.Mesh(new T3.CylinderGeometry(0.6 * t + 0.01, 0.8 * t + 0.01, 0.12, 24), mat(0xc8b8a0)); clay.position.set(2.4, 0.06, 0); g.add(clay);
        s.rain = flowParticles(300, 0x9ac8ff, 0.03); g.add(s.rain); s.rq = Array.from({ length: 300 }, () => [Math.random() * 7 - 3.5, Math.random() * 3, Math.random() * 2 - 1]);
      } else {
        const boulder = new T3.Mesh(new T3.BoxGeometry(1.2, 0.8, 1.0), rockM("granite")); boulder.position.set(-2.0 - t * 0.12, 0.4, 0); g.add(boulder); const b2 = boulder.clone(); b2.position.set(-0.75 + t * 0.12, 0.4, 0); b2.scale.x = 0.9; g.add(b2); const tr = GK.tree(0.9 + t * 0.6, 3, 0x3a6a2a); tr.position.set(-1.38, 0.8, 0); g.add(tr); const root = GK.line([[-1.38, 0.85, 0], [-1.38, 0.4, 0.05], [-1.38, 0.0, -0.05]], 0x6a4a30, 0.03 + t * 0.05); g.add(root);
        const mound = new T3.Mesh(new T3.ConeGeometry(0.55, 1.6, 20, 6), mat(0xa4582c, { roughness: 1 })); const mp = mound.geometry.attributes.position; for (let i = 0; i < mp.count; i++) mp.setX(i, mp.getX(i) * (1 + 0.15 * Math.sin(mp.getY(i) * 9))); mound.geometry.computeVertexNormals(); mound.position.set(1.6, 0.8, 0); g.add(mound);
        s.ants = flowParticles(60, 0x1a1210, 0.03); g.add(s.ants);
      }
      s.rain = s.rain && c.v === "chem" ? s.rain : null; s.ants = c.v === "bio" ? s.ants : null;
    },
    tick(S, s, c, dt) { if (s.rain) { const P = s.rain.pos; s.rq.forEach((q, i) => { q[1] -= dt * 3; if (q[1] < 0) q[1] = 3; P.set(q, i * 3); }); s.rain.flush(); } if (s.ants) { const P = s.ants.pos, t = performance.now() / 1000; for (let i = 0; i < 60; i++) { const a = i * 0.7 + t * 0.6; P.set([1.6 + Math.cos(a) * (0.6 + (i % 5) * 0.1), 0.02, Math.sin(a) * (0.6 + (i % 5) * 0.1)], i * 3); } s.ants.flush(); } },
    feats: (c) => ({
      phys: [{ id: "exfol", n: "Exfoliation (onion weathering)", p: [-2.2, 1.1, 0], d: "Hot days and cold nights make the outer layers of rock expand and contract until they peel off like onion skins — common on granite domes in the savanna." }, { id: "block", n: "Block disintegration", p: [0.4, 1.1, 0], d: "Rocks with joints break into blocks as temperature changes widen the joints." }, { id: "gran", n: "Granular disintegration", p: [2.6, 0.8, 0], d: "Different minerals expand by different amounts, so coarse rocks crumble into grains of sand." }],
      chem: [{ id: "carb", n: "Carbonation (solution)", p: [-2.4, 0.8, 0], d: "Rain water with carbon dioxide (weak carbonic acid) dissolves limestone." }, { id: "oxid", n: "Oxidation", p: [0, 1.1, 0], d: "Oxygen combines with iron in rocks, turning them red-brown and weak — this forms laterite in the tropics." }, { id: "hydro", n: "Hydrolysis", p: [2.4, 0.95, 0], d: "Water reacts with feldspar in granite, turning it into soft clay (kaolin)." }],
      bio: [{ id: "roots", n: "Plant roots", p: [-1.38, 1.4, 0], d: "Roots grow into cracks and force the rock apart; they also release acids." }, { id: "termite", n: "Termites and burrowing animals", p: [1.6, 1.7, 0], d: "Termites, earthworms and rodents loosen and mix the soil and expose rock to air and water." }, { id: "man", n: "Human activities", p: [0, 0.2, 1.4], d: "Quarrying, mining, road building and farming break up rocks and expose them to weathering." }],
    })[c.v],
    notes: (c) => ({ phys: ["Physical weathering is most active in deserts and dry savanna with a large daily range of temperature."], chem: ["Chemical weathering is most active in hot, wet climates such as the rainforest — deep weathered layers form."], bio: ["Biological weathering combines physical and chemical action by living things."] })[c.v].concat(["Factors: climate, rock type and structure, vegetation, relief, time."]),
  });

  /* ===================== DN-b  Mass movement ===================== */
  const slopeH = (x, z) => 0.1 + Math.max(0, (-x + 2.6)) * 0.42 - Math.max(0, -x - 1.6) * 0.2 + (BK.fbm(x, z, 4) - 0.5) * 0.06;
  GK.tour("DN-b", {
    title: "Mass movement",
    blurb: "Mass movement is the downhill movement of weathered material under gravity. Increase the rain to see what triggers a landslide, and compare slow and fast movements.",
    envOpts: OUT, cam: [[3.8, 2.8, 6.8], [-0.2, 0.4, 0]], variants: [["creep", "Soil creep"], ["slide", "Landslide / slump"], ["mud", "Mudflow"], ["fall", "Rockfall"]], vlabel: "Kind",
    values: { rain: 0.6 }, controls: [{ type: "slider", key: "rain", label: "Rainfall / saturation", min: 0, max: 1, step: 0.05 }],
    build(g, S, s, c) {
      const T3 = T(); g.add(GK.block({ w: 6, d: 4, h: slopeH, strata: soilOn((x, y, z, yt) => (y > yt - 0.3 ? hex3(0x8a6a44) : sedBands(x, y + 0.6, z)), 0.06), tint: GK.tintSavanna }));
      s.mover = null; s.parts = null;
      if (c.v === "creep") { for (let i = 0; i < 7; i++) { const x = -1.6 + i * 0.6, z = 1.3, lean = 0.25; const post = new T3.Mesh(new T3.CylinderGeometry(0.02, 0.02, 0.4, 6), mat(0x6a4a30)); post.position.set(x, slopeH(x, z) + 0.18, z); post.rotation.z = lean; g.add(post); const tr = GK.tree(0.35, i, 0x3a6a2a); tr.position.set(x + 0.3, slopeH(x + 0.3, -0.6), -0.6); tr.rotation.z = 0.18; g.add(tr); } for (let i = 0; i < 6; i++) { const P = []; for (let k = 0; k <= 20; k++) { const z = -1.8 + k * 0.18, x = -1.8 + i * 0.7; P.push([x, slopeH(x, z) + 0.01, z]); } g.add(GK.line(P, 0x6a5a3a, 0.012)); } }
      else if (c.v === "slide" || c.v === "mud") { const geo = new T3.BoxGeometry(1.4, 0.22, 1.6, 10, 2, 10); const m = new T3.Mesh(geo, new T3.MeshStandardMaterial({ color: c.v === "mud" ? 0x6a4a2a : 0x8a6a44, roughness: 1 })); g.add(m); s.mover = m; const hs = GK.house(0.22); m.add(hs); hs.position.y = 0.11; const tr = GK.tree(0.4, 2); tr.position.set(0.4, 0.11, 0.3); m.add(tr); }
      else { const rr = BK.rng(9); s.parts = []; for (let i = 0; i < 26; i++) { const r = GK.rockSample("granite", 0.07 + rr() * 0.08); g.add(r); s.parts.push([r, rr(), rr() * 3 - 1.5]); } const scree = new T3.Mesh(new T3.ConeGeometry(0.9, 0.5, 24, 1, false, 0, Math.PI), mat(0x8a8078)); scree.position.set(-2.1, 0.25, 0); scree.rotation.y = Math.PI / 2; g.add(scree); }
      s.t = 0;
    },
    tick(S, s, c, dt) { s.t += dt; if (s.mover) { const thr = c.v === "mud" ? 0.4 : 0.55, k = c.rain > thr ? ((s.t * (c.rain - thr) * (c.v === "mud" ? 1.2 : 0.7)) % 1) : 0; const x = 1.6 - k * 3.3, z = 0; s.mover.position.set(x, slopeH(x, z) + 0.11, z); s.mover.rotation.z = c.v === "slide" ? 0.38 + k * 0.4 : 0.4 * (1 - k); s.mover.scale.set(1 + (c.v === "mud" ? k * 0.8 : 0), 1 - (c.v === "mud" ? k * 0.5 : 0), 1 + (c.v === "mud" ? k * 0.5 : 0)); } if (s.parts) s.parts.forEach((p) => { const [r, ph, z] = p, k = (s.t * (0.3 + c.rain * 0.4) + ph) % 1, x = 2.4 - k * 4.4; r.position.set(x, slopeH(x, z) + 0.08 + Math.abs(Math.sin(k * 12)) * 0.15 * (1 - k), z); r.rotation.x += dt * 4; }); },
    feats: (c) => ({
      creep: [{ id: "creep", n: "Soil creep", p: [0, 0.9, 0], d: "Extremely slow downhill movement of soil — seen in tilted fence posts, poles and bent tree trunks." }, { id: "post", n: "Tilted posts", p: [-0.4, 1.0, 1.3], d: "Posts and walls lean downslope as the soil around them creeps." }, { id: "terr", n: "Terracettes", p: [-0.4, 0.95, -1.2], d: "Small steps on the slope formed as soil slowly slips." }],
      slide: [{ id: "slide", n: "Landslide / slump", p: [0.2, 1.0, 0], d: "A mass of earth and rock suddenly slides along a curved surface, often after heavy rain on a steep slope." }, { id: "scar", n: "Scar", p: [1.8, 1.4, 0], d: "The bare, steep face left where the material broke away." }],
      mud: [{ id: "mud", n: "Mudflow", p: [0, 0.9, 0], d: "Saturated soil flows like a liquid down valleys — fast and destructive (e.g. Freetown mudslide, 2017)." }],
      fall: [{ id: "fall", n: "Rockfall", p: [1.2, 1.4, 0], d: "Loose rocks fall freely from cliffs and steep slopes." }, { id: "scree", n: "Scree (talus)", p: [-2.1, 0.5, 0], d: "Broken rock pieces pile up at the foot of the slope." }],
    })[c.v],
    notes: ["Factors: steep slopes, heavy rain (water adds weight and lubricates), lack of vegetation, earthquakes, weak rocks, human activities (cutting slopes, deforestation, mining).", "Slow movements: soil creep, solifluction. Fast movements: landslide, slump, mudflow, rockfall, avalanche."],
  });

  /* ===================== DN-c  Running water: rivers ===================== */
  const RV = (x) => (x < -3 ? 0.15 * Math.sin(x * 2.6) : x < 2.5 ? 0.75 * Math.sin(x * 1.9) * sm(-3, -1.5, x) * (1 - sm(2.0, 2.5, x) * 0.4) : 0.3 * Math.sin(x * 1.9));
  const riverH = (x, z) => { const base = 1.9 - (x + 7) * 0.18 - 0.35 * sm(-3.75, -3.45, x) + (x < 3.5 ? 0 : -(x - 3.5) * 0.12); const w = x < -3 ? 0.25 : x < 2.5 ? 0.9 : 1.6, d = Math.abs(z - RV(x)); const valley = x < -3 ? Math.min(1, d / 1.4) * 1.1 : sm(w, w + 1.6, d) * 0.7; return Math.max(-0.08, base + valley * (x < -3 ? 1 : 0.8) - 0.06 * Math.exp(-((d / 0.08) ** 2)) + (BK.fbm(x, z, 11) - 0.5) * 0.08); };
  GK.tour("DN-c", {
    title: "Running water: rivers",
    blurb: "Follow a river from its source in the hills to the sea. Each stage has its own landforms — or watch a meander migrate until it is cut off as an ox-bow lake.",
    envOpts: OUT, cam: [[1, 7, 10], [0, 0, 0]], variants: [["course", "Course of a river"], ["meander", "Meander → ox-bow lake"]], vlabel: "Show",
    values: { t: 0.3 }, controls: [{ type: "slider", key: "t", label: "Time", min: 0, max: 1, step: 0.02, show: (c) => c.v === "meander" }],
    rebuildOn: (c) => (c.v === "meander" ? Math.round(c.t * 25) : 0),
    build(g, S, s, c) {
      const T3 = T();
      if (c.v === "course") {
        g.add(GK.terrain({ w: 14, d: 6, nx: 280, h: riverH, tint: (hn, sl, x, z) => (Math.abs(z - RV(x)) < 1.0 && x > -2 ? hex3(0x6a8a3a) : GK.tintSavanna(hn, sl, x, z)) }));
        const P = []; for (let i = 0; i <= 200; i++) { const x = -6.8 + i / 200 * 13.6; P.push([x, riverH(x, RV(x)) + 0.03, RV(x)]); } g.add(GK.line(P, 0x2f78c0, 0.05));
        const wf = new T3.Mesh(new T3.PlaneGeometry(0.3, 0.38), new T3.MeshStandardMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.8, emissive: 0x8ab0d0, emissiveIntensity: 0.3 })); wf.position.set(-3.6, riverH(-3.7, RV(-3.7)) - 0.15, RV(-3.6)); wf.rotation.y = Math.PI / 2; g.add(wf);
        const ox = new T3.Mesh(new T3.TorusGeometry(0.35, 0.05, 6, 32, Math.PI * 1.4), new T3.MeshPhysicalMaterial({ color: 0x3a7aa0, roughness: 0.1 })); ox.rotation.x = -Math.PI / 2; ox.position.set(0.2, riverH(0.2, -1.5) + 0.02, -1.6); g.add(ox);
        const sea = GK.water(4, 8, 0x2a6f8f, 0.9); sea.position.set(8.8, -0.03, 0); g.add(sea);
        const delta = [[5.6, 0.3], [6.4, -0.6], [6.4, 0.9]]; delta.forEach(([x, z]) => g.add(GK.line([[5.0, 0, RV(5.0)], [x, -0.04, z]].map(([a, b, cc]) => [a, riverH(a, cc) + 0.02, cc]), 0x2f78c0, 0.025)));
        houseRow(g, [[2.8, riverH(2.8, 1.4), 1.4], [3.0, riverH(3.0, 1.7), 1.7], [3.3, riverH(3.3, 1.5), 1.5]], 0.16);
      } else {
        const t = c.t, amp = 0.6 + t * 1.1, neck = t > 0.8; const cx = (z) => { const a = amp * Math.sin(z * 1.3); return neck && Math.abs(z) < 1.4 ? a * (1 - (t - 0.8) * 5 * (1 - Math.abs(z) / 1.4)) : a; };
        const h = (x, z) => 0.2 + (BK.fbm(x, z, 2) - 0.5) * 0.04 - 0.07 * Math.exp(-(((x - cx(z)) / 0.18) ** 2)) - (neck ? 0.07 * Math.exp(-(((x - amp * Math.sin(z * 1.3)) / 0.18) ** 2)) * (Math.abs(z) < 1.3 ? 1 : 0) : 0);
        g.add(GK.terrain({ w: 6, d: 6, nx: 200, h, tint: (hn, sl, x, z) => mix3(hex3(0x6a8a3a), hex3(0xc8b48a), Math.exp(-(((x - cx(z)) / 0.3) ** 2)) * 0.6) }));
        const P = []; for (let i = 0; i <= 120; i++) { const z = -3 + i / 120 * 6; P.push([cx(z), 0.17, z]); } g.add(GK.line(P, 0x2f78c0, 0.07));
        if (neck) { const Q = []; for (let i = 0; i <= 60; i++) { const z = -1.3 + i / 60 * 2.6; Q.push([amp * Math.sin(z * 1.3), 0.16, z]); } g.add(GK.line(Q, 0x3a7aa0, 0.06)); }
        const arrows = [[-0.6, 1.2], [0.6, -1.2]]; arrows.forEach(([x, z], i) => g.add(GK.arrow([cx(z * 1.0) * 0.6, 0.3, z], [cx(z) * 1.25, 0.3, z], 0xff6a3a, 0.025)));
      }
    },
    feats: (c) => c.v === "course" ? [
      { id: "source", n: "Source", p: [-6.6, 1.9, 0], d: "Where the river begins — a spring, lake or marsh in the highlands." },
      { id: "vval", n: "Upper course: V-shaped valley", p: [-5.4, 1.6, 0], d: "Fast, steep river eroding downwards (vertical erosion) into a narrow, steep-sided valley with interlocking spurs and rapids." },
      { id: "fall", n: "Waterfall and gorge", p: [-3.6, 1.2, 0], d: "Where the river crosses a band of hard rock it plunges over a step; the falls retreat upstream, leaving a gorge (e.g. Kainji's Awba falls, Erin-Ijesha, Kintampo)." },
      { id: "meander", n: "Middle course: meanders", p: [-0.6, 0.65, 0.8], d: "Lateral erosion widens the valley; the river swings in loops, eroding the outer bank and depositing on the inner bank." },
      { id: "oxbow", n: "Ox-bow lake", p: [0.2, 0.6, -1.6], d: "A meander cut off during a flood, leaving a horseshoe-shaped lake." },
      { id: "flood", n: "Lower course: flood plain and levees", p: [3.0, 0.3, -0.8], d: "Slow river depositing silt on a wide flat plain; raised banks (levees) form from flood deposits — fertile farmland and settlements." },
      { id: "delta", n: "Delta", p: [6.0, 0.1, 0.3], d: "At the mouth, the river drops its load and splits into many distributaries (e.g. Niger Delta)." },
    ] : [
      { id: "outer", n: "Outer bank: erosion — river cliff", p: [1.5, 0.35, 1.2], d: "Fastest water on the outside of the bend undercuts the bank, forming a steep river cliff." },
      { id: "inner", n: "Inner bank: deposition — slip-off slope", p: [-0.4, 0.3, 1.2], d: "Slow water on the inside of the bend drops sand and gravel, forming a gentle point bar." },
      { id: "neck", n: "Meander neck", p: [0, 0.3, 0], d: "As erosion continues the neck narrows; in a flood the river cuts straight through it." },
      { id: "oxbow", n: "Ox-bow lake", p: [1.2, 0.3, -0.4], d: "The abandoned loop is sealed off by deposits and becomes an ox-bow lake, which slowly fills to a swamp." },
    ],
    fly: [1.6, 2.0, 3.2],
    notes: ["Processes of river erosion: hydraulic action, abrasion (corrasion), attrition, solution.", "Transport: traction (rolling), saltation (bouncing), suspension, solution.", "Deposition happens when velocity falls: inside bends, in lakes, on flood plains and at the mouth.", "Drainage basin, watershed, tributary, confluence, distributary, mouth."],
  });

  /* ===================== DN-d  Underground water ===================== */
  GK.tour("DN-d", {
    title: "Underground water",
    blurb: "Rain soaks into permeable rocks and collects above impermeable layers. Change the rainfall to raise or lower the water table and see wells and springs respond.",
    envOpts: OUT, cam: BLOCKCAM, values: { rain: 0.6 }, controls: [{ type: "slider", key: "rain", label: "Rainfall (wet → dry season)", min: 0, max: 1, step: 0.05 }],
    rebuildOn: (c) => Math.round(c.rain * 10),
    build(g, S, s, c) {
      const T3 = T(), h = (x, z) => 0.25 + 0.75 * Math.exp(-(((x + 2.4) / 0.9) ** 2)) + 0.75 * Math.exp(-(((x - 2.5) / 0.9) ** 2)) + (BK.fbm(x, z, 6) - 0.5) * 0.05;
      const syn = (x) => -0.9 + 0.5 * (x / 3) ** 2, wt = (x) => Math.min(h(x, 2) - 0.05, -0.15 + 0.35 * c.rain + 0.35 * Math.exp(-(((Math.abs(x) - 2.4) / 1.0) ** 2)) - 0.15);
      g.add(GK.block({ w: 6, d: 4, h, strata: soilOn((x, y, z, yt) => { const top = syn(x) + 0.45, bot = syn(x); if (y > top) return y < wt(x) ? hex3(0x5a7aa0) : hex3(0xc2a070); if (y > bot) return hex3(y < wt(x) + 0.2 ? 0x3a6a9a : 0xd2b07a).map((v) => v * (0.9 + 0.2 * BK.noise3(x * 6, y * 10, z))); return hex3(0x6a645a); }, 0.05), tint: GK.tintSavanna }));
      const wl = []; for (let i = 0; i <= 60; i++) { const x = -3 + i / 10; wl.push([x, wt(x), 2.03]); } g.add(GK.line(wl, 0x7fd6ff, 0.012));
      const well = new T3.Mesh(new T3.CylinderGeometry(0.06, 0.06, 1.2, 12, 1, true), mat(0x8a8a8a, { side: T3.DoubleSide })); well.position.set(-0.6, h(-0.6, 1.9) - 0.5, 1.9); g.add(well);
      const art = new T3.Mesh(new T3.CylinderGeometry(0.04, 0.04, 1.2, 12), mat(0x5a5a5a)); art.position.set(0.6, h(0.6, 1.9) - 0.4, 1.9); g.add(art);
      if (c.rain > 0.3) { s.jet = flowParticles(120, 0x9ad0ff, 0.04); g.add(s.jet); } else s.jet = null;
      s.h = h;
    },
    tick(S, s, c, dt) { if (s.jet) { const P = s.jet.pos, t = performance.now() / 1000, y0 = s.h(0.6, 1.9) + 0.2; for (let i = 0; i < 120; i++) { const k = ((t * 0.8 + i / 120) % 1); P.set([0.6 + Math.sin(i) * k * 0.2, y0 + Math.sin(k * Math.PI) * 0.6 * c.rain, 1.9 + Math.cos(i) * k * 0.2], i * 3); } s.jet.flush(); } },
    feats: [
      { id: "perm", n: "Permeable rock (aquifer)", p: [0, -0.7, FZ], d: "Porous rock such as sandstone or limestone that stores water and lets it pass through." },
      { id: "imp", n: "Impermeable rock", p: [0, -1.3, FZ], d: "Clay or shale that does not let water through; water collects above it." },
      { id: "wt", n: "Water table", p: [-1.4, -0.1, FZ], d: "The upper surface of the saturated zone. It rises in the wet season and falls in the dry season." },
      { id: "well", n: "Well", p: [-0.6, 0.3, 1.9], d: "A hole dug below the water table. If the water table falls below the well bottom, the well dries up." },
      { id: "art", n: "Artesian well", p: [0.6, 0.5, 1.9], d: "In a basin (syncline) of permeable rock between impermeable layers, water is under pressure and rises on its own when a borehole is drilled." },
      { id: "spring", n: "Spring", p: [2.0, 0.5, 1.6], d: "Where the water table meets the surface, often at the junction of permeable and impermeable rocks." },
    ],
    notes: ["Sources: rainfall seeping in (infiltration and percolation), rivers and lakes, magma (juvenile water).", "Uses: wells and boreholes for drinking, irrigation and industry; springs and oases.", "Problems: falling water tables, pollution, salt-water intrusion near coasts."],
  });

  /* ===================== DN-e  Wind action ===================== */
  GK.tour("DN-e", {
    title: "Wind action in deserts",
    blurb: "In deserts the wind erodes rock with sand blasting and piles sand into dunes. Watch the sand blow across barchans and past rock pedestals.",
    envOpts: Object.assign({}, OUT, { hdri: "spruit_sunrise", fogColor: 0xe0c8a0 }), cam: [[3.6, 3.0, 7.4], [0, 0.2, 0]],
    build(g, S, s, c) {
      const T3 = T(); const barchan = (x, z, cx, cz, r) => { const dx = x - cx, dz = z - cz, d = Math.hypot(dx * 1.2, dz), horn = dx > 0 ? Math.exp(-(((Math.abs(dz) - r * 0.8) / (r * 0.25)) ** 2)) * Math.exp(-dx / (r * 1.2)) * 0.4 : 0; return 0.45 * r * Math.max(0, 1 - d / r) ** 1.5 * (dx < 0 ? 1 : Math.exp(-dx * 3)) + horn * r * 0.4; };
      const h = (x, z) => 0.05 + barchan(x, z, -1.6, -0.8, 1.0) + barchan(x, z, 0.4, 0.9, 0.8) + 0.25 * Math.exp(-(((z + 2.1 - 0.15 * x) / 0.25) ** 2)) * sm(-4, -1, x) + 0.05 * Math.sin(x * 9 + z * 2) * 0.3 - 0.18 * G(x, z, 2.2, -0.9, 0.5, 0.4) + (BK.fbm(x * 2, z * 2, 3) - 0.5) * 0.04;
      g.add(GK.terrain({ w: 9, d: 6, nx: 220, h, tint: GK.tintDesert }));
      const rk = GK.rockMat("sandstone", 1.5);
      const ped = new T3.Group(); const cap = new T3.Mesh(new T3.SphereGeometry(0.35, 20, 12), rk); cap.scale.set(1, 0.45, 1); cap.position.y = 0.7; const stem = new T3.Mesh(new T3.CylinderGeometry(0.1, 0.18, 0.6, 12), rk); stem.position.y = 0.3; ped.add(cap, stem); ped.position.set(2.4, 0.04, 1.2); g.add(ped);
      const z1 = new T3.Mesh(new T3.BoxGeometry(1.2, 0.35, 0.25), rk); z1.position.set(-2.8, 0.18, 1.6); g.add(z1); const z2 = z1.clone(); z2.position.z = 2.05; g.add(z2);
      const insel = new T3.Mesh(new T3.SphereGeometry(0.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), GK.pbr("rock_face_03", { repeat: 2 })); insel.position.set(3.4, 0, -1.6); insel.scale.y = 1.3; g.add(insel);
      const oasis = GK.water(0.6, 0.5, 0x2f7a8a, 0.9); oasis.position.set(2.2, -0.08, -0.9); g.add(oasis); [[2.0, -0.6], [2.5, -0.7], [2.3, -1.2]].forEach(([x, z]) => { const p = GK.tree(0.3, x * 5, 0x3a7a2a); p.position.set(x, 0, z); g.add(p); });
      s.sand = flowParticles(600, 0xe0c090, 0.035); g.add(s.sand); s.sq = Array.from({ length: 600 }, () => [Math.random() * 9 - 4.5, Math.random() * 6 - 3, Math.random() * 0.5]); s.h = h;
    },
    tick(S, s, c, dt) { const P = s.sand.pos; s.sq.forEach((q, i) => { q[0] += dt * (1.5 + q[2] * 2); if (q[0] > 4.5) q[0] = -4.5; P.set([q[0], s.h(q[0], q[1]) + 0.05 + q[2] * 0.4 + Math.abs(Math.sin(q[0] * 5 + i)) * 0.08, q[1]], i * 3); }); s.sand.flush(); },
    feats: [
      { id: "barchan", n: "Barchan (crescent dune)", p: [-1.4, 0.55, -0.8], d: "A crescent-shaped dune with horns pointing downwind; gentle windward slope, steep slip face. Barchans move slowly downwind." },
      { id: "seif", n: "Seif (longitudinal) dune", p: [-2.4, 0.35, -2.2], d: "A long sand ridge parallel to the prevailing wind." },
      { id: "ped", n: "Rock pedestal (mushroom rock)", p: [2.4, 0.9, 1.2], d: "Sand blasting is strongest near the ground, so the base is undercut, leaving a mushroom shape." },
      { id: "zeugen", n: "Zeugen / yardangs", p: [-2.8, 0.4, 1.8], d: "Ridges of hard rock separated by grooves where softer rock has been scoured away by the wind." },
      { id: "insel", n: "Inselberg", p: [3.4, 0.9, -1.6], d: "Isolated steep-sided hill rising from the desert plain." },
      { id: "oasis", n: "Deflation hollow and oasis", p: [2.2, 0.15, -0.9], d: "The wind lifts away loose sand, lowering the ground until it reaches the water table — an oasis." },
    ],
    notes: ["Wind erosion: deflation (lifting loose material), abrasion (sand blasting), attrition (grains wearing each other).", "Wind deposits: dunes (barchan, seif), loess.", "Harmattan: the dry, dusty north-east trade wind that carries Saharan dust across West Africa between November and March."],
  });

  /* ===================== DN-f  Wave action ===================== */
  GK.def3d("DN-f", {
    title: "Wave action",
    blurb: "Waves are made by wind blowing over the sea. Switch between constructive and destructive waves, and watch longshore drift carry a pebble along the beach.",
    envOpts: Object.assign({}, OUT, { hdri: "aristea_wreck_puresky" }), cam: [[3.2, 2.4, 5.8], [0, 0, 0.4]],
    values: { kind: "con", angle: 30 },
    controls: [{ type: "tabs", key: "kind", label: "Waves", options: [["con", "Constructive"], ["des", "Destructive"]] }, { type: "slider", key: "angle", label: "Angle of waves to the beach", min: 0, max: 50, step: 1, fmt: (v) => v + "°" }],
    build(S, s) {
      const T3 = T(), g = BK.group(S, s), beachH = (x, z) => 0.3 - z * 0.18 + (BK.fbm(x, z, 2) - 0.5) * 0.02;
      g.add(GK.terrain({ w: 8, d: 6, nx: 160, h: beachH, ground: "coast_sand_01", tint: (hn, sl, x, z) => (z < -1.6 ? GK.tintSavanna(hn, sl, x, z) : mix3(hex3(0xe2d2a4), hex3(0xbca880), sm(0.5, 2.5, z))) }));
      const geo = new T3.PlaneGeometry(8, 5, 160, 100); geo.rotateX(-Math.PI / 2); s.sea = new T3.Mesh(geo, new T3.MeshPhysicalMaterial({ color: 0x2a6f8f, roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.92 })); s.sea.position.z = 3.2; g.add(s.sea); s.base = Float32Array.from(geo.attributes.position.array);
      [-2, 0.5, 3].forEach((x) => { const gy = new T3.Mesh(new T3.BoxGeometry(0.08, 0.14, 2.4), mat(0x6a4a30)); gy.position.set(x, beachH(x, 1.4) + 0.05, 1.4); gy.rotation.x = Math.atan(0.18); g.add(gy); });
      s.peb = GK.rockSample("granite", 0.06); g.add(s.peb); s.trail = []; s.t = 0; s.beachH = beachH;
    },
    update(S, s, c, dt) {
      s.t += dt; const p = s.sea.geometry.attributes.position, B = s.base, A = c.kind === "des" ? 0.11 : 0.05, L = c.kind === "des" ? 0.7 : 1.4, a = c.angle * Math.PI / 180;
      for (let i = 0; i < p.count; i++) { const x = B[i * 3], z = B[i * 3 + 2], ph = (z * Math.cos(a) + x * Math.sin(a)) / L * 6.283 + s.t * 2.4; p.setY(i, A * Math.sin(ph) * (1 - Math.max(0, -z) * 0.2) + 0.02); } p.needsUpdate = true; s.sea.geometry.computeVertexNormals();
      const cyc = (s.t * 0.45) % 1, sw = cyc < 0.5 ? cyc * 2 : 2 - cyc * 2, x0 = -3.2 + ((s.t * 0.45) | 0) % 8 * 0.5 * Math.sin(a) * 2;
      const px = ((x0 + 4) % 7) - 3.5 + (cyc < 0.5 ? sw * Math.tan(a) * 0.6 : Math.tan(a) * 0.6), pz = 1.6 - sw * (c.kind === "des" ? 0.7 : 1.1); s.peb.position.set(px, s.beachH(px, pz) + 0.05, pz);
    },
    labels: (s, c) => [{ id: "swash", p: [-1.2, 0.2, 1.0], t: c.kind === "des" ? "Weak swash" : "Strong swash — carries sand up the beach", col: "#ffd27a" }, { id: "back", p: [1.4, 0.15, 1.8], t: c.kind === "des" ? "Strong backwash — drags material away" : "Weak backwash", col: "#8fd0ff", dy: 26 }, { id: "peb", p: s.peb ? s.peb.position.toArray() : [0, 0, 0], t: "Pebble moved by longshore drift", col: "#ff9a8a", dy: -40 }, { id: "groyne", p: [0.5, 0.35, 0.6], t: "Groyne — slows longshore drift", col: "#e8f1ff", dy: -26 }],
    hud: (s, c) => [{ title: c.kind === "des" ? "Destructive waves" : "Constructive waves", lines: [[c.kind === "des" ? "High, steep and frequent (10–14 a minute); the backwash is stronger than the swash, so they erode the coast." : "Low, gentle and far apart (6–8 a minute); the swash is stronger than the backwash, so they build up beaches.", "#ffd27a", true], ["Longshore drift: waves approach at " + c.angle + "°, the swash pushes material up the beach at an angle and the backwash pulls it straight down — a zig-zag along the coast.", "#8fd0ff"], "Fetch (distance of open water), wind strength and duration decide wave size.", "Coastal protection: groynes, sea walls, breakwaters, planting mangroves."] }],
    story: [
      { d: 6, cap: "Wind blowing over the sea makes waves. As a wave reaches shallow water it breaks: the rush up the beach is the swash, the return is the backwash.", set: { kind: "con", angle: 0 }, hl: "swash" },
      { d: 6, cap: "Constructive waves have a strong swash and weak backwash, so they leave sand behind and build the beach.", set: { kind: "con" } },
      { d: 6, cap: "Destructive waves are steep and frequent. Their backwash is strong and drags material out to sea.", set: { kind: "des" }, hl: "back" },
      { d: 7, cap: "When waves arrive at an angle, the pebble zig-zags along the beach: this is longshore drift. Groynes are built to trap the sand.", set: { kind: "con", angle: 35 }, hl: "peb" },
    ],
    draw: GK.fallback("Wave action", ["Swash up, backwash down", "Constructive: strong swash builds beaches", "Destructive: strong backwash erodes", "Longshore drift moves material along the coast"]),
  });
})();
