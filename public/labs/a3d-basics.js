/* a3d-basics.js — A. Basic concepts (A1–A7): a photoreal West African farm village built from the agric kit,
   used to explore branches of agriculture, its importance, problems and solutions, farming systems, government,
   NGOs and land tenure. Every subtopic has its own interactive scene with readouts and an experiment card. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, GK = window.GK, AK = window.AK, f = MK.fmt;
  const T = () => window.THREE;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- shared farm village ---------- zones: name -> [x,y,z] */
  const Z = { maize: [-3.3, 0, -1.6], cassava: [-0.7, 0, -1.9], yam: [1.6, 0, -1.9], pen: [3.4, 0, 0.6], poultry: [1.3, 0, 1.7], pond: [-3.2, 0, 2.0], store: [0.1, 0, 0.4], house: [-1.2, 0, 2.7], tractor: [-1.6, 0, 0.2], market: [4.5, 0, -1.8], hives: [4.6, 0, 2.6], orchard: [-5.2, 0, 0.2], office: [2.6, 0, 3.2], road: [0, 0, -3.5] };
  AK.ZONES = Z;
  AK.village = (g, o = {}) => {
    const T3 = T(), pd = (x, z) => (o.pond === false ? 0 : Math.max(0, 1 - Math.max(Math.abs(x - Z.pond[0]) / 1.25, Math.abs(z - Z.pond[2]) / 0.85)) ** 0.35), h = AK.ground(g, { w: 13, d: 9.4, amp: 0.06, soil: "laterite", h: (x, z) => 0.06 * (BK.fbm(x * 0.25 + 3, z * 0.25, 3) - 0.5) * 2 - 0.45 * pd(x, z), fieldFn: (x, z) => (z < -0.9 && z > -2.9 && x > -4.6 && x < 2.6 ? 1 : pd(x, z) > 0.05 ? 0.8 : 0) });
    const H = (x, z) => h(x, z);
    if (o.crops !== false) {
      AK.field(g, "maize", { x0: -4.4, x1: -2.2, z0: -2.7, z1: -0.9, dx: 0.42, dz: 0.36, s: 0.62 * (o.cropScale || 1), stage: o.stage == null ? 0.85 : o.stage, h: H });
      AK.field(g, "cassava", { x0: -1.6, x1: 0.2, z0: -2.7, z1: -1.1, dx: 0.5, dz: 0.5, s: 0.5 * (o.cropScale || 1), stage: o.stage == null ? 0.8 : o.stage, h: H });
      for (let x = 0.9; x <= 2.4; x += 0.5) for (let z = -2.6; z <= -1.2; z += 0.5) { const y = AK.plant("yam", o.stage == null ? 0.8 : o.stage, { seed: Math.round(x * 10 + z) }); AK.put(g, y, x, z, H, x * 3, 0.38); }
    }
    if (o.animals !== false) {
      g.add(AK.fence([[2.4, -0.4], [4.6, -0.4], [4.6, 1.7], [2.4, 1.7], [2.4, -0.4]], 0.45));
      g.cattle = [["whitefulani", 3.0, 0.2, 0.4], ["ndama", 3.9, 1.1, 2.6], ["wad", 3.6, 0.0, -0.8], ["wad", 4.1, 0.4, 1.9], ["yankasa", 2.9, 1.2, 0.2]].map(([b, x, z, r]) => AK.put(g, AK.animal(b), x, z, H, r, b === "wad" || b === "yankasa" ? 0.55 : 0.45));
      const ph = AK.building("poultry", { w: 1.4, d: 0.9, h: 0.55 }); AK.put(g, ph, Z.poultry[0], Z.poultry[2], H);
      g.hens = []; for (let i = 0; i < 5; i++) g.hens.push(AK.put(g, AK.bird(i % 3 ? "hen" : "cock"), 0.6 + i * 0.32, 2.5 + (i % 2) * 0.2, H, i, 0.45));
    }
    if (o.pond !== false) { const w = GK.water(2.3, 1.55, 0x3a6a4a, 0.92); w.position.set(Z.pond[0], -0.2, Z.pond[2]); g.add(w); for (let i = 0; i < 4; i++) AK.put(g, AK.fish("tilapia", 0.12), Z.pond[0] - 0.5 + i * 0.3, Z.pond[2] + (i % 2) * 0.2 - 0.1, () => -0.26, i); }
    const store = AK.building("store", { w: 1.6, d: 1.1, h: 0.75 }); AK.put(g, store, Z.store[0], Z.store[2], H);
    const house = AK.building("house", { w: 1.5, d: 1.0, h: 0.8, wall: "clay_block_wall", roof: "rusty_corrugated_iron" }); AK.put(g, house, Z.house[0], Z.house[2], H, 0.2);
    AK.put(g, GK.hut(0.32), -2.4, 3.3, H); AK.put(g, GK.hut(0.28), 0.2, 3.5, H);
    if (o.tractor !== false) { const tr = AK.tractor(); AK.put(g, tr, Z.tractor[0], Z.tractor[2], H, 0.4, 0.42); g.tractor = tr; }
    if (o.hives !== false) for (let i = 0; i < 3; i++) AK.put(g, AK.hive(), Z.hives[0] + i * 0.35, Z.hives[2], H, 0, 0.5);
    if (o.orchard !== false) { [[-5.4, -0.8], [-5.0, 0.6], [-5.6, 1.6], [-4.6, -0.1]].forEach(([x, z], i) => AK.put(g, AK.plant(i % 2 ? "oilpalm" : "cocoa", 1, { seed: i + 3 }), x, z, H, i, i % 2 ? 0.42 : 0.5)); }
    if (o.market !== false) { for (let i = 0; i < 3; i++) { const st = AK.building("shed", { w: 0.7, d: 0.5, h: 0.45, roof: "corrugated_iron_02" }); AK.put(g, st, Z.market[0] - 0.4 + i * 0.8, Z.market[2], H); } for (let i = 0; i < 6; i++) AK.put(g, AK.crate(), Z.market[0] - 0.8 + i * 0.32, Z.market[2] + 0.4, H, 0, 0.6); }
    AK.trees(g, GK.scatter(26, -6.6, 6.6, -4.7, 2.0, H, (x, z) => (Math.abs(x) > 5.9 || z < -4.0), 11), 0.3);
    const road = []; for (let i = 0; i <= 40; i++) { const x = -6.4 + i * 0.32; road.push([x, H(x, -3.5) + 0.02, -3.5 + 0.12 * Math.sin(x * 0.6)]); } g.add(GK.line(road, 0x8a6a4a, 0.14));
    return H;
  };
  const tickVillage = (S, s, c, dt) => { s.t = (s.t || 0) + dt; const g = s.g; if (!g) return; (g.cattle || []).forEach((a, i) => AK.animate(a, s.t + i, 0, 1)); (g.hens || []).forEach((h, i) => { h.rotation.y += Math.sin(s.t * 2 + i) * 0.01; }); };
  AK.tickVillage = tickVillage;
  const Y = (k, y = 0.6) => [Z[k][0], y, Z[k][2]];

  /* ===================== A1-a  Definition and branches ===================== */
  AK.tour("A1-a", {
    title: "Branches of agricultural science on one farm",
    blurb: "Agriculture is the cultivation of crops and rearing of animals for man's use. Each part of this village farm is studied by a different branch of agricultural science.",
    sky: "farm_field", cam: [[0.5, 4.6, 9.6], [0, 0.2, 0]], build(g, S, s) { AK.village(g); }, tick: tickVillage,
    feats: [
      { id: "crop", n: "Crop science (agronomy, horticulture)", p: Y("maize"), d: "Growing field crops, vegetables and fruits: varieties, planting, fertilizers and harvesting." },
      { id: "anim", n: "Animal science", p: Y("pen"), d: "Breeding, feeding, housing and health of cattle, goats, sheep, poultry and pigs." },
      { id: "soil", n: "Soil science", p: [Z.cassava[0], 0.3, Z.cassava[2]], d: "Soil formation, fertility, nutrients, conservation and fertilizers." },
      { id: "eng", n: "Agricultural engineering", p: Y("tractor"), d: "Farm machinery, power, surveying, irrigation and farm structures." },
      { id: "fish", n: "Fisheries and aquaculture", p: Y("pond", 0.3), d: "Rearing fish in ponds and managing wild fish stocks." },
      { id: "forest", n: "Forestry", p: Y("orchard", 1.5), d: "Planting, managing and harvesting trees and forest products." },
      { id: "econ", n: "Agricultural economics", p: Y("market"), d: "Costs, prices, marketing, credit and farm management decisions." },
      { id: "ext", n: "Agricultural extension", p: Y("house"), d: "Teaching farmers new practices and linking them with research." },
      { id: "api", n: "Apiculture (bee keeping)", p: Y("hives", 0.5), d: "Keeping honey bees for honey, wax and crop pollination." },
    ],
    notes: ["Agriculture: cultivation of crops and rearing of animals for man's use — including processing and marketing.", "Other branches: agricultural biochemistry, crop protection, animal health, home economics."],
    tasks: ["Pick each branch from the Feature list and read what it studies.", "Switch Labels to Numbers and name every branch from memory.", "Name one job in each branch (e.g. extension officer, veterinary doctor, soil scientist)."],
  });

  /* ===================== A1-b  Importance of agriculture ===================== */
  AK.def3d("A1-b", {
    title: "Importance of agriculture to the individual, community and nation",
    blurb: "Change the village's farm output and watch food, jobs, raw materials and export earnings respond.",
    sky: "farm_field", cam: [[0, 6.5, 9.5], [0, 0, 0]],
    vars: [{ key: "out", label: "Farm output", min: 20, max: 200, step: 5, value: 100, unit: "% of normal" }],
    build(S, s) { s.key = null; },
    update(S, s, c, dt) { const k = Math.round(c.out / 25); if (s.key !== k) { s.key = k; const g = BK.group(S, s); AK.village(g, { cropScale: 0.55 + c.out / 220, stage: Math.min(1, 0.3 + c.out / 160) }); s.crates = []; const n = Math.round(c.out / 12); for (let i = 0; i < n; i++) s.crates.push(AK.put(g, AK.crate(), 3.6 + (i % 6) * 0.32, -2.4 - Math.floor(i / 6) * 0.3, null, 0, 0.6)); } tickVillage(S, s, c, dt); },
    labels: (s, c) => [{ id: "food", p: Y("maize", 1.2), t: "Food for the family and the nation" }, { id: "raw", p: Y("cassava", 1.0), t: "Raw materials: cassava → starch, garri, ethanol" }, { id: "jobs", p: Y("pen", 1.2), t: "Employment and income" }, { id: "exp", p: Y("market", 1.0), t: "Export earnings (foreign exchange)" }, { id: "cap", p: Y("store", 1.4), t: "Savings and capital for industry" }],
    hud: (s, c) => { const k = c.out / 100; return [{ title: "What the farm gives", lines: [["Food supply: " + f(k * 100, 3) + "% of what people need", "#ffd27a", true], "Jobs on the farm and in trade: " + Math.round(18 * k) + " people", "Raw materials to factories: " + f(k * 40, 3) + " t", "Export earnings: " + AK.money(k * 3.2e6), "—", k < 0.8 ? "Below 80 %: food must be imported and prices rise." : k > 1.3 ? "Surplus: more sales, more income and more foreign exchange." : "Enough food, plus some surplus to sell."] }]; },
    readouts: (s, c) => { const k = c.out / 100; return [["Food supply", f(k * 100, 3) + " %"], ["Jobs", Math.round(18 * k)], ["Raw materials", f(k * 40, 3) + " t"], ["Export earnings", AK.money(k * 3.2e6)]]; },
    story: [{ d: 6, title: "Food", cap: "Agriculture first gives food — to the farmer's family, the community and the nation.", set: { out: 100 } }, { d: 6, title: "Low output", cap: "When farm output falls, food runs short, prices rise and the country must import food.", tween: { out: [100, 40] } }, { d: 6, title: "Surplus", cap: "When output rises, the surplus is sold: income, jobs, raw materials for industry and exports all grow.", tween: { out: [40, 170] } }, { d: 6, title: "Nation", cap: "Agriculture also provides foreign exchange, capital for industry, a market for industrial goods and rural development.", set: { out: 120 } }],
    tasks: ["Set output to 50 % and record the readings.", "Set output to 100 % and 150 % and record again.", "Plot export earnings against output. What kind of relationship is it?"],
    draw: GK.fallback("Importance of agriculture", ["Food", "Employment and income", "Raw materials for industry", "Foreign exchange from exports", "Market for industrial goods", "Capital formation and rural development"]),
  });

  /* ===================== A2-a  Problems of agricultural development ===================== */
  const PROBS = [["lt", "Land tenure (small, fragmented plots)", 0.12], ["am", "Lack of basic amenities", 0.06], ["fin", "Inadequate finance (credit)", 0.1], ["tr", "Poor transportation (bad roads)", 0.12], ["st", "Poor storage and processing", 0.15], ["ext", "Weak education and extension", 0.07], ["tool", "Simple tools, no machinery", 0.08], ["inp", "Scarce farm inputs (seeds, fertilizer)", 0.09], ["mk", "Poor marketing system", 0.08], ["env", "Environmental degradation (erosion)", 0.07]];
  AK.def3d("A2-a", {
    title: "Problems of agricultural development",
    blurb: "Switch problems on and off. The counter shows how much of the harvest reaches the market in good condition.",
    sky: "farmland_overcast", cam: [[0, 6, 9], [0, 0, 0]],
    values: Object.fromEntries(PROBS.map(([k]) => [k, 1])),
    controls: PROBS.map(([k, n]) => ({ type: "toggle", key: k, label: n })),
    build(S, s) { s.key = null; },
    update(S, s, c, dt) { const kk = PROBS.map(([k]) => c[k]).join(""); if (s.key !== kk) { s.key = kk; const g = BK.group(S, s); AK.village(g, { tractor: !c.tool, cropScale: c.inp || c.env ? 0.7 : 1, stage: c.inp ? 0.6 : 0.9 }); const reach = s.reach = PROBS.reduce((a, [k, , w]) => a * (c[k] ? 1 - w : 1), 1); const n = 16, good = Math.round(n * reach); for (let i = 0; i < n; i++) { const cr = AK.crate(i < good ? 0xffffff : 0x4a3a2a); AK.put(g, cr, 3.5 + (i % 8) * 0.34, -2.5 - Math.floor(i / 8) * 0.34, null, 0, 0.6); } if (c.env) { const gul = GK.line([[-4.5, 0.02, 3.5], [-3.6, 0.0, 2.9], [-2.9, -0.02, 2.4]], 0x6a3a1a, 0.12); g.add(gul); } } tickVillage(S, s, c, dt); },
    labels: (s, c) => PROBS.filter(([k]) => c[k]).slice(0, 6).map(([k, n], i) => ({ id: k, p: { lt: Y("maize", 1), am: Y("house", 1.2), fin: Y("office", 1), tr: [0, 0.3, -3.5], st: Y("store", 1.2), ext: Y("house", 0.6), tool: Y("tractor", 0.8), inp: Y("cassava", 0.8), mk: Y("market", 1), env: [-3.6, 0.2, 2.9] }[k], t: n })),
    hud: (s, c) => [{ title: "Harvest reaching market", lines: [[f((s.reach || 0) * 100, 3) + " % in good condition", "#ffd27a", true], "Dark crates = produce lost to rot, pests, delays or low prices.", "—", "Also assessed: pests and diseases, weather, labour shortage and unstable government policy."] }],
    readouts: (s, c) => [["Problems switched on", PROBS.filter(([k]) => c[k]).length], ["Harvest reaching market", f((s.reach || 0) * 100, 3) + " %"], ["Lost", f((1 - (s.reach || 0)) * 100, 3) + " %"]],
    tasks: ["Start with all problems on and record the reading.", "Turn off one problem at a time. Which single problem causes the biggest loss?", "Turn off all ten. What is the best possible result?"],
    draw: GK.fallback("Problems of agricultural development", PROBS.map((p) => p[1])),
  });

  /* ===================== A2-b  Solutions ===================== */
  AK.def3d("A2-b", {
    title: "Solving the problems — spend a fixed budget",
    blurb: "You have ₦10 million for the village. Share it between feeder roads, storage, credit and extension, and compare the income before and after.",
    sky: "farm_field", cam: [[0, 6, 9], [0, 0, 0]],
    vars: [{ key: "rd", label: "Feeder roads", min: 0, max: 10, value: 3, unit: "₦m" }, { key: "sto", label: "Storage and processing", min: 0, max: 10, value: 3, unit: "₦m" }, { key: "cr", label: "Credit and inputs", min: 0, max: 10, value: 2, unit: "₦m" }, { key: "ex", label: "Extension and training", min: 0, max: 10, value: 2, unit: "₦m" }],
    build(S, s) { s.key = null; },
    calc(c) { const tot = c.rd + c.sto + c.cr + c.ex, sc = tot > 10 ? 10 / tot : 1, e = (v, k) => 1 - Math.exp(-v * sc / k); const loss = 0.45 * (1 - 0.55 * e(c.rd, 3)) * (1 - 0.6 * e(c.sto, 3)); const yieldK = 1 + 0.35 * e(c.cr, 3) + 0.3 * e(c.ex, 2.5); return { tot, sc, loss, yieldK, inc: 4.0e6 * yieldK * (1 - loss) }; },
    update(S, s, c, dt) { const k = [c.rd, c.sto, c.cr, c.ex].map(Math.round).join("|"); if (s.key !== k) { s.key = k; const g = BK.group(S, s); const R = MK.scenes["A2-b"].calc(c); AK.village(g, { cropScale: 0.75 + 0.3 * (R.yieldK - 1) * 2, stage: 0.9 }); if (c.sto > 3) AK.put(g, AK.building("silo"), 1.2, 0.2, null, 0, 0.45); const n = 16, good = Math.round(n * (1 - R.loss)); for (let i = 0; i < n; i++) AK.put(g, AK.crate(i < good ? 0xffffff : 0x4a3a2a), 3.5 + (i % 8) * 0.34, -2.5 - Math.floor(i / 8) * 0.34, null, 0, 0.6); } tickVillage(S, s, c, dt); },
    hud: (s, c) => { const R = MK.scenes["A2-b"].calc(c); return [{ title: "Village farm income", lines: [[AK.money(R.inc) + " per season", "#ffd27a", true], "Before any spending: " + AK.money(4e6 * 0.55), "Post-harvest loss: " + f(R.loss * 100, 3) + " %", "Yield gain from credit and extension: +" + f((R.yieldK - 1) * 100, 3) + " %", R.tot > 10 ? ["Over budget — spending scaled down to ₦10m", "#ff7b72"] : "Budget used: ₦" + R.tot + "m of ₦10m"] }]; },
    readouts: (s, c) => { const R = MK.scenes["A2-b"].calc(c); return [["Spent", "₦" + R.tot + "m"], ["Loss", f(R.loss * 100, 3) + " %"], ["Yield gain", "+" + f((R.yieldK - 1) * 100, 3) + " %"], ["Income", AK.money(R.inc)]]; },
    tasks: ["Put all ₦10m into roads, then all into storage. Record each.", "Find the split that gives the highest income.", "Explain why spreading money across several solutions usually works better."],
    draw: GK.fallback("Solutions", ["Land reform and consolidation", "Rural roads, water and electricity", "Credit and subsidies", "Storage and processing facilities", "Extension and training", "Mechanisation and timely inputs", "Organised marketing", "Soil conservation", "Stable government policy"]),
  });

  /* ===================== A3  Subsistence vs commercial (a–d) ===================== */
  function twoFarms(g, c) {
    const T3 = T(), h = AK.ground(g, { w: 14, d: 9, amp: 0.04, soil: "laterite", fieldFn: (x, z) => (x > 0.3 && x < 6.6 && z > -3.6 && z < 3.2 ? 1 : (x < -1 && x > -5.2 && z > -2 && z < 1.2 ? 0.9 : 0)) });
    /* small mixed family plot (left) */
    [["maize", -4.6, -1.6], ["cassava", -3.5, -1.0], ["cowpea", -2.4, -1.5], ["yam", -4.2, 0.3], ["pepper", -2.2, 0.5], ["okra", -3.2, 0.6]].forEach(([k, x, z], i) => { for (let j = 0; j < 4; j++) AK.put(g, AK.plant(k, 0.85, { seed: i * 5 + j }), x + (j % 2) * 0.35, z + Math.floor(j / 2) * 0.35, h, j, k === "yam" ? 0.35 : 0.45); });
    AK.put(g, GK.hut(0.36), -3.6, 2.2, h); AK.put(g, AK.person({ shirt: 0x8a3a2a }), -2.6, 1.6, h, 0.5, 0.42); const hoe = AK.tool("hoe"); AK.put(g, hoe, -2.4, 1.6, h, 0, 0.45);
    for (let i = 0; i < 4; i++) AK.put(g, AK.bird("local"), -4.6 + i * 0.3, 2.6, h, i, 0.4);
    /* commercial estate (right) */
    AK.field(g, "maize", { x0: 0.6, x1: 6.4, z0: -3.4, z1: 1.2, dx: 0.42, dz: 0.4, s: 0.6, stage: 0.88, h });
    const tr = AK.tractor(); AK.put(g, tr, 3.4, 2.2, h, 0, 0.5); const sp = AK.implement("sprayer"); sp.position.set(-0.55, 0, 0); tr.add(sp);
    AK.put(g, AK.building("silo"), 6.0, 2.6, h, 0, 0.6); AK.put(g, AK.building("barn", { w: 2.2, d: 1.4, h: 1.0 }), 1.6, 2.8, h);
    return h;
  }
  const A3feats = [
    { id: "sub", n: "Subsistence farm", p: [-3.4, 0.8, -0.4], d: "A small family plot of mixed crops and a few animals: grown mainly to feed the family, with little surplus to sell." },
    { id: "com", n: "Commercial farm", p: [3.4, 1.2, -1.0], d: "A large estate of one main crop grown for sale and profit, with machines, hired labour and records." },
  ];
  const A3 = { sky: "farm_field", cam: [[0, 7, 10.5], [0.5, 0, 0]], build(g) { twoFarms(g); } };
  AK.tour("A3-a", Object.assign({}, A3, { title: "Subsistence and commercial agriculture", blurb: "Two farms side by side: a family subsistence plot and a commercial estate.", feats: A3feats, notes: ["Subsistence: production mainly for the family's own use.", "Commercial: production mainly for sale and profit."], tasks: ["Fly to each farm and read the description.", "List three things you can see on the commercial farm that are missing on the subsistence farm."] }));
  const TRAITS = [["Scale of land", "small (under 2 ha)", "large (10s–1000s of ha)"], ["Main aim", "feed the family", "profit from sales"], ["Labour", "family", "hired, skilled"], ["Capital", "very little", "large"], ["Tools", "hoe, cutlass", "tractors, machines"], ["Crops", "many mixed crops", "one or few (specialised)"], ["Inputs", "few, local seed", "improved seed, fertilizer, chemicals"], ["Records", "rarely kept", "kept for management and loans"], ["Output", "low", "high"], ["Market", "little surplus", "local, national and export"]];
  AK.tour("A3-b", Object.assign({}, A3, { title: "Differences based on characteristics", blurb: "Pick a characteristic and compare the two farms.", vars: [], values: { ti: 0 }, controls: [{ type: "select", key: "ti", label: "Characteristic", options: TRAITS.map((t, i) => [i, t[0]]) }],
    feats: A3feats, hud: (s, c) => { const t = TRAITS[c.ti | 0]; return [{ title: t[0], lines: [["Subsistence: " + t[1], "#ffd27a"], ["Commercial: " + t[2], "#7cb3ff"]] }]; },
    readouts: (s, c) => { const t = TRAITS[c.ti | 0]; return [["Characteristic", t[0]], ["Subsistence", t[1]], ["Commercial", t[2]]]; },
    notes: ["Tabulate at least four differences in the exam."], tasks: ["Step through all ten characteristics and record each one.", "Download the table as CSV — it is your comparison table."] }));
  AK.def3d("A3-c", Object.assign({}, A3, { title: "Advantages and disadvantages — a shock test", blurb: "Hit both farms with a drought or a price crash and compare how they cope.",
    values: { shock: "none" }, controls: [{ type: "tabs", key: "shock", label: "Shock", options: [["none", "Normal year"], ["drought", "Drought"], ["price", "Price crash (−50 %)"], ["pest", "Pest outbreak"]] }],
    build(S, s) { s.key = null; }, update(S, s, c) { if (s.key !== c.shock) { s.key = c.shock; const g = BK.group(S, s); twoFarms(g); } },
    calc(c) { const sh = c.shock, y1 = { none: 1, drought: 0.55, price: 1, pest: 0.75 }[sh], y2 = { none: 1, drought: 0.5, price: 1, pest: 0.65 }[sh], p = sh === "price" ? 0.5 : 1; const food1 = 0.9 * y1 + 0.1, sub = { food: food1, profit: 0.2e6 * y1 * p - 0.05e6 }, com = { food: 0, profit: 30e6 * y2 * p - 18e6 }; return { sub, com, food1 }; },
    hud: (s, c) => { const R = MK.scenes["A3-c"].calc(c); return [{ title: "Season result", lines: [["Subsistence: family food " + f(R.food1 * 100, 3) + " % · cash " + AK.money(R.sub.profit), "#ffd27a"], ["Commercial: profit " + AK.money(R.com.profit), R.com.profit < 0 ? "#ff7b72" : "#7cb3ff"], "—", "Subsistence: cheap and feeds the family, but low output and income.", "Commercial: high output and profit, but high cost and risk — a bad year can mean a big loss."] }]; },
    readouts: (s, c) => { const R = MK.scenes["A3-c"].calc(c); return [["Subsistence food", f(R.food1 * 100, 3) + " %"], ["Subsistence cash", AK.money(R.sub.profit)], ["Commercial profit", AK.money(R.com.profit)]]; },
    tasks: ["Record a normal year, then each shock.", "Which farm loses more money in a drought? Why?", "Which farm keeps the family fed? Why?"], draw: GK.fallback("Advantages and disadvantages", ["Subsistence: low cost, food security, but low output", "Commercial: high output and income, jobs, but high capital and risk"]) }));
  const PROBA3 = { sub: ["Small, fragmented land", "Little or no capital", "Low technology and simple tools", "Low yields and no surplus", "Illiteracy, limited extension contact"], com: ["High cost of machinery and inputs", "Price fluctuations", "Shortage of skilled labour", "Need for large loans (high interest)", "Pollution and soil degradation risks"] };
  AK.tour("A3-d", Object.assign({}, A3, { title: "Problems of subsistence and commercial agriculture", blurb: "Each farm system has its own problems.", feats: [
    { id: "s1", n: "Subsistence: small, fragmented land", p: [-3.4, 0.5, -1.0], d: "Plots are too small for machines or expansion." }, { id: "s2", n: "Subsistence: little capital", p: [-3.6, 0.8, 2.2], d: "The farmer cannot buy improved seed, fertilizer or tools." }, { id: "s3", n: "Subsistence: simple tools", p: [-2.4, 0.6, 1.6], d: "Hoe and cutlass limit the area that can be farmed." },
    { id: "c1", n: "Commercial: high cost of machinery", p: [3.4, 0.8, 2.2], d: "Tractors, fuel, spare parts and repairs are expensive." }, { id: "c2", n: "Commercial: price fluctuations", p: [6.0, 1.4, 2.6], d: "A fall in price can turn profit into loss on a large harvest." }, { id: "c3", n: "Commercial: labour and loans", p: [1.6, 1.2, 2.8], d: "Skilled labour is scarce and large loans carry high interest." }],
    notes: PROBA3.sub.slice(0, 2).concat(PROBA3.com.slice(0, 2)), tasks: ["Read every problem.", "Write one solution for each problem."] }));

  /* ===================== A4  Roles of government ===================== */
  AK.def3d("A4-a", {
    title: "Government finance: credit and subsidy",
    blurb: "A farmer grows 2 ha of maize. Choose how the government helps and follow the money over three seasons.",
    sky: "farm_field", cam: [[0, 5.5, 8], [0, 0, 0]],
    values: { mode: "none" }, controls: [{ type: "tabs", key: "mode", label: "Support", options: [["none", "No support"], ["credit", "Loan (₦300 000 at 9 %)"], ["subsidy", "50 % fertilizer subsidy"], ["both", "Loan + subsidy"]] }],
    vars: [{ key: "fert", label: "Fertilizer used", min: 0, max: 300, step: 25, value: 150, unit: "kg/ha NPK" }],
    calc(c) { const cash = c.mode === "credit" || c.mode === "both" ? 380000 : 80000, price = c.mode === "subsidy" || c.mode === "both" ? 12500 / 50 : 25000 / 50; const want = c.fert * 2 * price, used = Math.min(c.fert, cash / (2 * price)); const yld = 1.6 + 3.2 * (1 - Math.exp(-used / 120)); const rev = yld * 2 * 250000, cost = used * 2 * price + 120000 + (c.mode === "credit" || c.mode === "both" ? 300000 * 0.09 : 0); return { used, yld, rev, cost, profit: rev - cost, price, short: used < c.fert }; },
    build(S, s) { s.key = null; },
    update(S, s, c, dt) { const R = MK.scenes["A4-a"].calc(c), k = Math.round(R.yld * 4); if (s.key !== k) { s.key = k; const g = BK.group(S, s), h = AK.ground(g, { w: 12, d: 8, soil: "laterite", fieldFn: (x, z) => (Math.abs(x) < 3.4 && Math.abs(z) < 2.4 ? 1 : 0) }); AK.field(g, "maize", { x0: -3.2, x1: 3.2, z0: -2.2, z1: 2.2, dx: 0.42, dz: 0.4, s: 0.38 + R.yld * 0.07, stage: 0.88, h }); for (let i = 0; i < Math.round(R.used / 50); i++) AK.put(g, AK.sack(0xf4f4f0), 3.9 + (i % 3) * 0.3, -1 + Math.floor(i / 3) * 0.4, h, 0, 0.8); AK.put(g, AK.person(), 4.2, 1.6, h, -1.2, 0.5); } },
    hud: (s, c) => { const R = MK.scenes["A4-a"].calc(c); return [{ title: "One season, 2 ha of maize", lines: [["Yield " + f(R.yld, 3) + " t/ha · profit " + AK.money(R.profit), "#ffd27a", true], "Fertilizer price: " + AK.money(R.price * 50) + " per 50 kg bag", R.short ? ["Not enough cash: only " + Math.round(R.used) + " kg/ha bought", "#ff7b72"] : "All " + c.fert + " kg/ha bought", "Revenue " + AK.money(R.rev) + " · costs " + AK.money(R.cost), "—", "Credit gives cash to buy inputs on time; a subsidy lowers the price of inputs."] }]; },
    readouts: (s, c) => { const R = MK.scenes["A4-a"].calc(c); return [["Fertilizer actually used", Math.round(R.used) + " kg/ha"], ["Yield", f(R.yld, 3) + " t/ha"], ["Revenue", AK.money(R.rev)], ["Profit", AK.money(R.profit)]]; },
    tasks: ["Set fertilizer to 200 kg/ha. Record profit with no support, loan, subsidy and both.", "Why does the farmer with no support use less fertilizer than planned?", "Which support raises profit most? Explain."],
    draw: GK.fallback("Credit and subsidy", ["Credit: loans to buy inputs and machines", "Subsidy: government pays part of the cost of inputs", "Both raise input use and yields"]),
  });
  /* A4-b education and A4-c extension: adoption spreading across a village grid */
  function adoptionScene(key, o) {
    AK.def3d(key, {
      title: o.title, blurb: o.blurb, sky: "farm_field", cam: [[0, 8.5, 8.5], [0, 0, 0]],
      vars: o.vars, values: { wk: 0 },
      calc: o.calc,
      build(S, s) { s.key = null; },
      update(S, s, c, dt) { const R = o.calc(c), k = Math.round(R.share * 40) + "|" + (c.wk | 0); if (s.key !== k) { s.key = k; const g = BK.group(S, s), h = AK.ground(g, { w: 13, d: 9, amp: 0.03, soil: "laterite" }); const r = BK.rng(4); let n = 0; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const x = -5 + i * 2, z = -3 + j * 2, ad = r() < R.share; const tile = new (T().Mesh)(new (T().PlaneGeometry)(1.7, 1.7), AK.pbr(ad ? "farm_furrows" : "dry_mud_field_001", { repeat: 1 })); tile.rotation.x = -Math.PI / 2; tile.position.set(x, 0.02, z); g.add(tile); AK.field(g, "maize", { x0: x - 0.6, x1: x + 0.6, z0: z - 0.6, z1: z + 0.6, dx: 0.4, dz: 0.4, s: ad ? 0.55 : 0.32, stage: ad ? 0.9 : 0.55, h: () => 0.02 }); if (ad) n++; } s.n = n; o.extra && o.extra(g, c, h); } },
      hud: (s, c) => { const R = o.calc(c); return [{ title: o.hudTitle, lines: [[f(R.share * 100, 3) + " % of farms using the improved practice", "#ffd27a", true], "Average yield: " + f(1.6 + 2.2 * R.share, 3) + " t/ha", "—"].concat(o.lines) }]; },
      readouts: (s, c) => { const R = o.calc(c); return [["Farms adopting", f(R.share * 100, 3) + " %"], ["Average yield", f(1.6 + 2.2 * R.share, 3) + " t/ha"]]; },
      tasks: o.tasks, story: o.story, draw: GK.fallback(o.title, o.lines),
    });
  }
  adoptionScene("A4-b", { title: "Agricultural education", blurb: "Train more young farmers at the college of agriculture and watch improved practices spread through the village.", hudTitle: "Effect of agricultural education", vars: [{ key: "tr", label: "Farmers trained per year", min: 0, max: 40, value: 8 }, { key: "yr", label: "Years", min: 1, max: 10, value: 3 }], calc: (c) => ({ share: 1 - Math.exp(-c.tr * c.yr / 90) }), lines: ["Schools, colleges and universities train farmers, extension workers and researchers.", "Educated farmers adopt improved seed, fertilizer and pest control sooner."], tasks: ["Record adoption after 1, 3, 5 and 10 years with 8 farmers trained per year.", "Double the number trained. How many years does it now take to reach 50 % adoption?"] });
  adoptionScene("A4-c", { title: "Agricultural extension services", blurb: "Each extension agent visits farmers, runs demonstrations and spreads new practices. Add agents and visits.", hudTitle: "Effect of extension", vars: [{ key: "ag", label: "Extension agents", min: 0, max: 6, value: 1 }, { key: "vis", label: "Visits per agent per month", min: 0, max: 30, value: 10 }], calc: (c) => ({ share: 1 - Math.exp(-c.ag * c.vis / 45) }), extra: (g, c, h) => { for (let i = 0; i < c.ag; i++) AK.put(g, AK.person({ shirt: 0x2a8a3a }), -4 + i * 1.6, 0, h, 0, 0.55); }, lines: ["Extension is a two-way link: research results go to farmers; farmers' problems go back to researchers.", "Recommended ratio in Nigeria is about 1 agent to 800 farm families; the real figure is often 1 to 3000 or more."], tasks: ["Record adoption with 1, 3 and 6 agents (10 visits each).", "Is it better to add agents or add visits? Test it."] });
  const PROGS = [[1972, "NAFPP — National Accelerated Food Production Project", "Improved seeds and inputs for staple crops"], [1975, "ADPs — Agricultural Development Projects", "World Bank–supported input supply, roads and extension (Training and Visit)"], [1976, "OFN — Operation Feed the Nation", "Mobilised everyone, including schools, to grow food"], [1976, "RBDAs — River Basin Development Authorities", "Irrigation, dams and dry-season farming"], [1977, "NACB — Nigerian Agricultural and Cooperative Bank", "Credit to farmers and cooperatives"], [1980, "Green Revolution", "Self-sufficiency in food: fertilizer, irrigation, mechanisation"], [1986, "DFRRI — Directorate of Food, Roads and Rural Infrastructure", "Rural roads, water and electricity"], [1987, "NALDA — National Agricultural Land Development Authority", "Land clearing and development for farmers"], [2002, "NSPFS — National Special Programme for Food Security", "Water control and diversification with FAO"], [2011, "ATA — Agricultural Transformation Agenda", "Value chains and e-wallet fertilizer subsidy"], [2015, "Anchor Borrowers' Programme", "Loans in kind to smallholders, repaid with produce"]];
  AK.def3d("A4-d", {
    title: "Agricultural policies and programmes",
    blurb: "Slide through the years to see Nigeria's major agricultural programmes and what each one did. Farm settlement schemes began in the 1960s.",
    sky: "farm_field", cam: [[0, 6, 9], [0, 0, 0]], vars: [{ key: "yr", label: "Year", min: 1960, max: 2020, step: 1, value: 1976 }],
    build(S, s) { const g = BK.group(S, s); AK.village(g); },
    update: tickVillage,
    hud: (s, c) => { const L = PROGS.filter((p) => p[0] <= c.yr), p = L[L.length - 1]; return [{ title: c.yr + " — programmes so far: " + L.length, lines: p ? [[p[1], "#ffd27a", true], p[2], "—"].concat(L.slice(-4, -1).reverse().map((q) => q[0] + " · " + q[1].split(" — ")[0])) : [["1960s: Farm Settlement Schemes in the regions", "#ffd27a", true], "Young school leavers settled on planned farms with houses and credit."] }]; },
    readouts: (s, c) => { const L = PROGS.filter((p) => p[0] <= c.yr), p = L[L.length - 1]; return [["Year", c.yr], ["Latest programme", p ? p[1].split(" — ")[0] : "Farm Settlement Schemes"]]; },
    story: PROGS.slice(0, 8).map((p) => ({ d: 5, title: String(p[0]), cap: p[1] + ": " + p[2] + ".", set: { yr: p[0] } })),
    tasks: ["Move the slider and list five programmes with their years.", "For each, state one aim.", "Which programmes dealt with credit? Which with infrastructure?"],
    draw: GK.fallback("Policies and programmes", PROGS.slice(0, 8).map((p) => p[0] + " " + p[1].split(" — ")[0])),
  });

  /* ===================== A5  NGOs ===================== */
  AK.tour("A5-a", {
    title: "Meaning of non-governmental organisations",
    blurb: "Compare three organisations that help farmers: a government ministry, a private company and an NGO.",
    sky: "farm_field", cam: [[0, 4.5, 8], [0, 0.4, 0]],
    build(g) { const h = AK.ground(g, { w: 12, d: 8, amp: 0.03 }); const mk = (x, col, lab) => { const b = AK.building("house", { w: 1.6, d: 1.2, h: 1.2, wallCol: col }); AK.put(g, b, x, 0, h); AK.put(g, AK.sign(lab), x, 1.0, h); for (let i = 0; i < 2; i++) AK.put(g, AK.person({ shirt: [0x2a6ad8, 0x8a3a2a, 0x2a8a3a][i] }), x - 0.4 + i * 0.8, 1.4, h, -1.6, 0.45); }; mk(-3.2, 0xd8e0f0, "MINISTRY"); mk(0, 0xf0e0c8, "AGRO-CO. LTD"); mk(3.2, 0xd8f0d8, "NGO"); },
    feats: [{ id: "gov", n: "Government ministry or agency", p: [-3.2, 1.6, 0], d: "Owned and funded by government (taxes); carries out policies; e.g. Ministry of Agriculture, ADP." }, { id: "co", n: "Private company", p: [0, 1.6, 0], d: "Owned by shareholders; aims to make profit; e.g. seed and fertilizer companies." }, { id: "ngo", n: "Non-governmental organisation (NGO)", p: [3.2, 1.6, 0], d: "Not owned by government, usually not-for-profit, funded by donors and charities; works on research, training and rural development." }],
    notes: ["NGOs are independent of government but may cooperate with it."], tasks: ["Read each organisation type.", "Copy the three into a table: owner, source of funds, aim."],
  });
  AK.def3d("A5-b", {
    title: "Roles of NGOs and international research centres",
    blurb: "Research centres on the West African map. Pick one to see its work and a demonstration plot of its improved variety beside a local one.",
    sky: "farm_field", cam: [[0, 6.5, 6], [0, 0, 0.3]], values: { ctr: "iita" },
    controls: [{ type: "tabs", key: "ctr", label: "Centre", options: [["iita", "IITA"], ["warda", "AfricaRice (WARDA)"], ["ilri", "ILRI (ILCA)"], ["icrisat", "ICRISAT"]] }],
    build(S, s) { s.key = null; },
    C: { iita: { n: "IITA — International Institute of Tropical Agriculture, Ibadan (Nigeria)", ll: [3.9, 7.4], crop: "cassava", d: "Cassava, yam, cowpea, maize, soybean and plantain: disease-resistant varieties (e.g. mosaic-resistant cassava), soil management." }, warda: { n: "AfricaRice (formerly WARDA), Côte d'Ivoire / Benin", ll: [-5.0, 7.7], crop: "rice", d: "Rice research for Africa: NERICA (New Rice for Africa) upland varieties crossing African and Asian rice." }, ilri: { n: "ILRI (formerly ILCA) — station at Ibadan", ll: [3.9, 7.4], crop: "guinea", d: "Livestock research: trypanotolerant cattle (N'Dama), feed and forage, animal health." }, icrisat: { n: "ICRISAT — Sahelian Centre, Niamey (Niger); also Kano", ll: [2.1, 13.5], crop: "millet", d: "Crops of the semi-arid tropics: millet, sorghum, groundnut, cowpea and pigeon pea — drought tolerance." } },
    update(S, s, c, dt) { if (s.key !== c.ctr) { s.key = c.ctr; const g = BK.group(S, s), C = MK.scenes["A5-b"].C[c.ctr]; const m = GK.mapPlane({ bbox: [-18, 3.5, 16, 20], size: 7 }); m.position.set(0, 0.02, -1.0); g.add(m); s.P = m.P; Object.entries(MK.scenes["A5-b"].C).forEach(([k, v]) => { const pin = GK.pin(k === c.ctr ? 0xffc030 : 0xff5a3a, 0.4); pin.position.set(m.P.x(v.ll[0]), 0.02, m.P.z(v.ll[1]) - 1.0); g.add(pin); }); const ground = new (T().Mesh)(new (T().PlaneGeometry)(9, 2.8), AK.pbr("farm_soil", { repeat: 3 })); ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0.01, 3.4); g.add(ground); AK.field(g, C.crop, { x0: -3.6, x1: -0.6, z0: 2.6, z1: 4.2, dx: 0.5, dz: 0.5, s: 0.32, stage: 0.65, h: () => 0 }); AK.field(g, C.crop, { x0: 0.6, x1: 3.6, z0: 2.6, z1: 4.2, dx: 0.5, dz: 0.5, s: 0.42, stage: 0.95, h: () => 0 }); } },
    labels: (s, c) => { const C = MK.scenes["A5-b"].C[c.ctr]; return s.P ? [{ id: "c", p: [s.P.x(C.ll[0]), 0.45, s.P.z(C.ll[1]) - 1.0], t: C.n.split(" — ")[0] }, { id: "loc", p: [-2.1, 0.6, 3.4], t: "Local variety" }, { id: "imp", p: [2.1, 0.8, 3.4], t: "Improved variety" }] : []; },
    hud: (s, c) => { const C = MK.scenes["A5-b"].C[c.ctr]; return [{ title: C.n, lines: [[C.d, "#ffd27a", true], "—", "Roles of NGOs: research, improved varieties, training, credit and inputs, extension, relief, rural water and health projects."] }]; },
    readouts: (s, c) => [["Centre", MK.scenes["A5-b"].C[c.ctr].n.split(" — ")[0]], ["Main crop shown", MK.scenes["A5-b"].C[c.ctr].crop]],
    tasks: ["Select each centre and note its location and mandate crops or animals.", "Compare the improved and local demonstration plots."], draw: GK.fallback("NGOs in agriculture", ["IITA: cassava, yam, cowpea, maize", "AfricaRice (WARDA): rice, NERICA", "ILRI (ILCA): livestock", "ICRISAT: millet, sorghum, groundnut"]),
  });

  /* ===================== A7  Land tenure, laws and reforms ===================== */
  function plots(g, cuts, col, h) { const r = BK.rng(9), rects = [[-5, -3.5, 10, 7]]; for (let k = 0; k < cuts; k++) { const nx = []; rects.forEach(([x, z, w, d]) => { const split = w > d ? "x" : "z", t = 0.35 + r() * 0.3; if (split === "x") nx.push([x, z, w * t, d], [x + w * t, z, w * (1 - t), d]); else nx.push([x, z, w, d * t], [x, z + d * t, w, d * (1 - t)]); }); rects.length = 0; rects.push(...nx); }
    rects.forEach(([x, z, w, d], i) => { const crop = ["maize", "cassava", "groundnut", "yam", "sorghum", "cowpea"][i % 6]; const tile = new (T().Mesh)(new (T().PlaneGeometry)(w - 0.06, d - 0.06), AK.pbr(i % 3 ? "farm_furrows" : "raked_dirt", { repeat: Math.max(1, w / 2) })); tile.rotation.x = -Math.PI / 2; tile.position.set(x + w / 2, 0.02, z + d / 2); g.add(tile); if (w > 0.7 && d > 0.7) AK.field(g, crop, { x0: x + 0.3, x1: x + w - 0.3, z0: z + 0.3, z1: z + d - 0.3, dx: Math.max(0.45, w / 6), dz: Math.max(0.45, d / 6), s: 0.35, stage: 0.85, h: () => 0.02 }); g.add(GK.polyline([[x, 0.05, z], [x + w, 0.05, z], [x + w, 0.05, z + d], [x, 0.05, z + d], [x, 0.05, z]], col || 0xffd27a)); });
    return rects; }
  AK.def3d("A7-a", {
    title: "Land tenure systems — inheritance and fragmentation",
    blurb: "Under inheritance, land is shared among children at each generation. Slide through generations and watch plot size shrink. Then compare other tenure systems.",
    sky: "farm_field", cam: [[0, 9, 7], [0, 0, 0]], vars: [{ key: "gen", label: "Generations of inheritance", min: 0, max: 5, value: 0 }], values: { sys: "inh" },
    controls: [{ type: "select", key: "sys", label: "Tenure system", options: [["inh", "Inheritance"], ["com", "Communal"], ["free", "Freehold (outright purchase)"], ["lease", "Leasehold"], ["ten", "Tenancy (rent)"], ["gift", "Gift"], ["pledge", "Pledging"], ["state", "State (government) ownership"]] }],
    SYS: { inh: "Land passes from parents to children; fragmentation into small uneconomic plots over generations.", com: "Land belongs to the community or family; members are allocated plots; cannot be sold; little incentive to improve.", free: "Land bought outright and owned forever; owner can develop, sell or use it as collateral; costly.", lease: "Land rented for a fixed long period (e.g. 25–99 years) under agreement; secure for perennial crops.", ten: "Land rented yearly from a landlord; insecure, so tenants avoid long-term improvements.", gift: "Land given freely; may be reclaimed or disputed later.", pledge: "Land given as security for a loan; the lender farms it until the debt is repaid.", state: "Land held by government (e.g. under the Land Use Act); allocated by certificate of occupancy." },
    build(S, s) { s.key = null; },
    update(S, s, c) { const k = c.gen + c.sys; if (s.key !== k) { s.key = k; const g = BK.group(S, s); AK.ground(g, { w: 14, d: 10, amp: 0.02 }); s.rects = plots(g, c.sys === "inh" ? c.gen : 1, c.sys === "com" ? 0x9ad8ff : 0xffd27a); } },
    hud: (s, c) => { const n = s.rects ? s.rects.length : 1, a = 70 / n; return [{ title: { inh: "Inheritance", com: "Communal", free: "Freehold", lease: "Leasehold", ten: "Tenancy", gift: "Gift", pledge: "Pledging", state: "State ownership" }[c.sys], lines: [[MK.scenes["A7-a"].SYS[c.sys], "#ffd27a", true], "—", "Plots: " + n + " · average size " + f(a / 10, 3) + " ha (family land = 7 ha)"] }]; },
    readouts: (s, c) => { const n = s.rects ? s.rects.length : 1; return [["System", c.sys], ["Number of plots", n], ["Average plot size", f(7 / n, 3) + " ha"]]; },
    tasks: ["With Inheritance selected, record plot size for generations 0 to 5.", "At what generation do plots become smaller than 0.5 ha?", "Read every tenure system and write one advantage and one disadvantage of each."], draw: GK.fallback("Land tenure", ["Communal", "Inheritance", "Freehold", "Leasehold", "Tenancy", "Gift", "Pledging", "State ownership"]),
  });
  AK.tour("A7-b", {
    title: "Government laws on land use — the Land Use Act",
    blurb: "Nigeria's Land Use Act (Decree) of 1978 vests all land in each state in the Governor, who holds it in trust for the people. Fly to each feature.",
    sky: "farm_field", cam: [[0, 8, 8], [0, 0, 0]],
    build(g) { AK.ground(g, { w: 14, d: 10, amp: 0.02 }); plots(g, 3, 0x9ad8ff); AK.put(g, AK.building("house", { w: 1.4, d: 1, h: 1, wallCol: 0xd8e0f0 }), 4.4, 3.6, null); AK.put(g, AK.sign("LAND ALLOC."), 4.4, 2.6, null); },
    feats: [{ id: "gov", n: "Land vested in the State Governor", p: [4.4, 1.4, 3.6], d: "All land in a state is held in trust by the Governor for the use and benefit of all Nigerians." }, { id: "cofo", n: "Certificate of Occupancy (C of O)", p: [-2.5, 0.4, -1.7], d: "Urban land: a statutory right of occupancy granted by the Governor, normally for up to 99 years." }, { id: "cust", n: "Customary right of occupancy", p: [2.5, 0.4, 1.7], d: "Rural land: Local Government allocates customary rights — up to 500 ha for farming, 5000 ha for grazing." }, { id: "comp", n: "Compensation", p: [0, 0.4, 0], d: "When government takes land for public purposes, occupiers are compensated for crops and improvements, not for the bare land." }],
    notes: ["Other West African countries have their own land reforms that register titles and reduce communal restrictions."], tasks: ["Read each provision.", "Explain the difference between statutory and customary rights of occupancy."],
  });
  AK.def3d("A7-c", {
    title: "Advantages and disadvantages of the Land Use Act and reforms",
    blurb: "Turn on reform levers and see how farm size, investment and land disputes change.",
    sky: "farm_field", cam: [[0, 9, 7], [0, 0, 0]], values: { cons: 0, title: 0, comp: 0, bureau: 1 },
    controls: [{ type: "toggle", key: "cons", label: "Land consolidation" }, { type: "toggle", key: "title", label: "Registered titles (C of O) usable as collateral" }, { type: "toggle", key: "comp", label: "Fair, prompt compensation" }, { type: "toggle", key: "bureau", label: "Slow bureaucracy" }],
    calc(c) { return { size: 0.8 * (c.cons ? 3.5 : 1), inv: 30 + (c.title ? 35 : 0) + (c.cons ? 15 : 0) - (c.bureau ? 20 : 0), disp: 60 - (c.title ? 25 : 0) - (c.comp ? 20 : 0) + (c.bureau ? 10 : 0) }; },
    build(S, s) { s.key = null; },
    update(S, s, c) { const k = "" + c.cons; if (s.key !== k) { s.key = k; const g = BK.group(S, s); AK.ground(g, { w: 14, d: 10, amp: 0.02 }); plots(g, c.cons ? 1 : 4, 0xffd27a); } },
    hud: (s, c) => { const R = MK.scenes["A7-c"].calc(c); return [{ title: "Effect of reforms", lines: [["Average farm size " + f(R.size, 3) + " ha", "#ffd27a", true], "Investment score: " + R.inv + " / 100", "Land disputes: " + R.disp + " / 100", "—", "Advantages: land for projects and large farms, fewer disputes, titles as loan security.", "Disadvantages: delays in getting C of O, poor compensation, plots still fragmented in practice."] }]; },
    readouts: (s, c) => { const R = MK.scenes["A7-c"].calc(c); return [["Farm size", f(R.size, 3) + " ha"], ["Investment", R.inv], ["Disputes", R.disp]]; },
    tasks: ["Record the scores with no reforms.", "Turn each lever on alone and record.", "Which lever cuts disputes most? Which raises investment most?"], draw: GK.fallback("Land Use Act", ["Advantages: easier access to land, fewer disputes, collateral", "Disadvantages: bureaucracy, compensation problems"]),
  });
})();
