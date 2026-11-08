/* b3d-life.js — more Topic A photoreal labs:
   A-a classification gallery (virus → five kingdoms) with a dichotomous key
   A-b surface area / volume and levels of organisation
   A-g respiration on the bench (germinating seeds + lime water; yeast + balloon)
   A-i growth and tropisms (phototropism, geotropism, regions of growth) */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, W = MK.when, f = MK.fmt;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const ease = (x) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));

  /* ---------------- A-a  classification gallery ---------------- */
  const KING = [
    { k: "virus", n: "Virus (link: living/non-living)", key: ["Not made of cells → virus", "Reproduces only inside a host cell", "Crystallises when isolated — non-living outside a cell"], ex: "HIV, measles virus, tobacco mosaic virus", traits: "Protein coat (capsid) around DNA or RNA; no cytoplasm or metabolism." },
    { k: "monera", n: "Kingdom Monera (Prokaryotae)", key: ["Made of cells", "No true nucleus (no nuclear membrane) → Monera"], ex: "Bacteria (Bacillus, Streptococcus), blue-green algae (Nostoc)", traits: "Single-celled, motile or non-motile, DNA loop free in cytoplasm, cell wall of murein." },
    { k: "protoctista", n: "Kingdom Protoctista", key: ["True nucleus (eukaryote)", "Mostly single-celled → Protoctista"], ex: "Amoeba, Paramecium, Euglena, Chlamydomonas, Plasmodium", traits: "Phyla: Rhizopoda, Zoomastigina, Apicomplexa, Ciliophora, Euglenophyta, Oomycota, Chlorophyta, Rhodophyta, Phaeophyta." },
    { k: "fungi", n: "Kingdom Fungi", key: ["Eukaryotic, mostly multicellular", "No chlorophyll; body of hyphae; cell walls of chitin → Fungi"], ex: "Mushroom, Rhizopus (bread mould), yeast, Penicillium", traits: "Saprophytic or parasitic; spores. Phyla: Zygomycota, Ascomycota, Basidiomycota." },
    { k: "plantae", n: "Kingdom Plantae", key: ["Eukaryotic, multicellular", "Chlorophyll present; cellulose walls → Plantae"], ex: "Mosses, ferns, pines, oil palm, yam", traits: "Bryophyta, Lycopodophyta, Filicinophyta, Coniferophyta, Cycadophyta, Angiospermophyta (monocots, dicots)." },
    { k: "animalia", n: "Kingdom Animalia", key: ["Eukaryotic, multicellular", "No chlorophyll, no cell walls; feeds on other organisms; usually motile → Animalia"], ex: "Corals, worms, insects, snails, fish, frogs, snakes, birds, mammals", traits: "Phyla include Cnidaria, Annelida, Arthropoda, Mollusca, Chordata (fish, amphibians, reptiles, birds, mammals)." },
  ];
  function specimen(k) {
    const T3 = T(), M = BK.mat, g = new T3.Group();
    if (k === "virus") { const cap = new T3.Mesh(new T3.IcosahedronGeometry(0.42, 0), new T3.MeshPhysicalMaterial({ color: 0x8e5bd6, roughness: 0.3, clearcoat: 1, flatShading: true })); g.add(cap); const sp = new T3.IcosahedronGeometry(0.42, 1).attributes.position;
      for (let i = 0; i < sp.count; i += 3) { const v = V(sp.getX(i), sp.getY(i), sp.getZ(i)).normalize(); const st = new T3.Mesh(new T3.CylinderGeometry(0.015, 0.015, 0.22, 5), M.organelle(0xd6c2ff, 0.1)); st.position.copy(v.clone().multiplyScalar(0.5)); st.quaternion.setFromUnitVectors(V(0, 1, 0), v); g.add(st); const kb = new T3.Mesh(new T3.SphereGeometry(0.035, 8, 6), M.organelle(0xff9fd0, 0.2)); kb.position.copy(v.clone().multiplyScalar(0.62)); g.add(kb); } g.position.y = 0.6; }
    if (k === "monera") { const b = new T3.Mesh(new T3.CapsuleGeometry(0.17, 0.6, 8, 20), new T3.MeshPhysicalMaterial({ color: 0x9fcf5a, roughness: 0.25, clearcoat: 1, transparent: true, opacity: 0.9 })); b.rotation.z = Math.PI / 2; b.position.y = 0.4; g.add(b); for (let i = 0; i < 3; i++) { const pts = []; for (let j = 0; j <= 20; j++) pts.push(V(-0.47 - j * 0.04, 0.4 + Math.sin(j * 0.7 + i) * 0.06, (i - 1) * 0.06 + Math.cos(j * 0.6) * 0.04)); g.add(new T3.Mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 30, 0.008, 5), M.organelle(0xdfe8c0))); } const b2 = b.clone(); b2.position.set(0.25, 0.25, 0.25); b2.rotation.y = 1; g.add(b2); }
    if (k === "protoctista") { const a = new T3.Mesh(BK.blob(0.42, 3, 0.4, 40, 1.4, 0.4, 1.1), BK.mat.membrane(0x8ec9e0, 0.55)); a.position.y = 0.2; g.add(a); const n = new T3.Mesh(new T3.SphereGeometry(0.09, 16, 12), M.organelle(0x7b6ad6, 0.1)); n.position.set(-0.05, 0.22, 0.05); g.add(n); g.userData.blob = a; }
    if (k === "fungi") { const m1 = BK.mushroom(1.1, 0xb5583a); g.add(m1); const m2 = BK.mushroom(0.7, 0xc66a44); m2.position.set(0.32, 0, 0.18); g.add(m2); }
    if (k === "plantae") { const pot = new T3.Mesh(new T3.CylinderGeometry(0.28, 0.2, 0.36, 24), new T3.MeshPhysicalMaterial({ color: 0xb8643a, roughness: 0.7 })); pot.position.y = 0.18; g.add(pot); const soil = new T3.Mesh(new T3.CircleGeometry(0.26, 24), BK.mat.soil([1, 1])); soil.rotation.x = -Math.PI / 2; soil.position.y = 0.35; g.add(soil); const pl = BK.plant({ h: 0.9, leaves: 6, leafLen: 0.42, leafW: 0.22 }); pl.position.y = 0.34; g.add(pl); }
    if (k === "animalia") { const fsh = BK.fish(0.55, 0x7d8a6a); fsh.position.set(0, 0.5, 0); g.add(fsh); const ins = BK.insect(0.55, 0x6a3a14); ins.position.set(0.1, 0.1, 0.35); g.add(ins); }
    return BK.shadow(g, true, true);
  }
  BK.def3d("A-a", {
    label: "Photoreal 3D specimen gallery", title: "Classification of living things",
    blurb: "A virus and one specimen from each of the five kingdoms on museum pedestals. Pick one and follow the dichotomous key to its kingdom.",
    env: "studio", cam: [[0.6, 3.6, 8.6], [0.9, 0.8, 0]], fov: 36,
    values: { sel: "fungi" },
    controls: [{ type: "tabs", key: "sel", label: "Specimen", options: KING.map((q) => [q.k, q.n.replace("Kingdom ", "").replace(" (link: living/non-living)", "").replace(" (Prokaryotae)", "")]) }],
    build(S, s, c) {
      const T3 = T(), g = BK.group(S, s); s.ped = {}; const ceramic = window.P3D.mat.ceramic(0xf1ede4);
      KING.forEach((q, i) => { const a = -0.95 + i * 0.38, x = Math.sin(a) * 4.2, z = -Math.cos(a) * 4.2 + 3.2; const ped = new T3.Mesh(new T3.CylinderGeometry(0.55, 0.62, 0.8, 40), ceramic); ped.position.set(x, 0.4, z); ped.castShadow = ped.receiveShadow = true; g.add(ped);
        const sp = specimen(q.k); sp.position.set(x, 0.8, z); g.add(sp); s.ped[q.k] = sp; });
      s.spot = new T3.SpotLight(0xfff1d6, 60, 14, 0.35, 0.6, 1.2); s.spot.position.set(0, 7, 4); S.scene.add(s.spot, s.spot.target);
    },
    update(S, s, c, dt) { const t = S.t; KING.forEach((q) => { const sp = s.ped[q.k], on = q.k === c.sel; sp.rotation.y += dt * (on ? 0.8 : 0.15); sp.scale.lerp(V(on ? 1.35 : 1, on ? 1.35 : 1, on ? 1.35 : 1), dt * 3); if (sp.userData.blob) BK.wobble(sp.userData.blob, 0.42, t, 0.25, 0.4); });
      const tg = s.ped[c.sel].position; s.spot.target.position.lerp(tg, dt * 3); S.aim([tg.x + 1.1, 0.9, tg.z], 6.2, Math.atan2(tg.x, 6) * 0.6, 0.38); },
    overlay(ctx, s, c, S, B) { const p = s.ped[c.sel].position; BK.lab(S, B, p.x, p.y + 1.25, p.z, KING.find((q) => q.k === c.sel).n, "#ffd27a", 0, -6, 11.5); },
    hud: (s, c) => { const q = KING.find((x) => x.k === c.sel); return [{ title: "Dichotomous key", lines: q.key.map((l, i) => [(i + 1) + ". " + l, i === q.key.length - 1 ? "#5bd68c" : "#e8f1ff"]).concat(["—", q.traits, ["e.g. " + q.ex, "#7cb3ff"]]) }]; },
    readouts: (s, c) => { const q = KING.find((x) => x.k === c.sel); return [["Group", q.n], ["Cells", q.k === "virus" ? "none" : q.k === "monera" ? "prokaryotic" : "eukaryotic"]]; },
    table: () => MK.table(["Feature", "Plants", "Animals"], [["Chlorophyll", "Present — autotrophic", "Absent — heterotrophic"], ["Cell wall", "Cellulose", "None"], ["Movement", "Fixed (only parts move)", "Whole body moves"], ["Growth", "At tips, throughout life", "All parts, stops at maturity"], ["Response", "Slow", "Fast (nerves, muscles)"], ["Excretory organs", "None", "Present"]]),
    note: "Know the <b>characteristics of each kingdom</b> with named examples, and the external features of cockroach, butterfly, Tilapia, toad, lizard and fowl.",
    draw: BK.fallback("Five kingdoms", (s, c) => { const q = KING.find((x) => x.k === c.sel); return [q.n + ": " + q.traits, "Examples: " + q.ex]; }),
  });

  /* ---------------- A-b  SA/V and levels of organisation ---------------- */
  const LEVELS = [["Cell", "Amoeba, Euglena — one cell does everything"], ["Tissue", "Hydra — groups of similar cells with one function"], ["Organ", "Heart, bulb, rhizome — tissues working together"], ["System", "Circulatory, reproductive, excretory systems"], ["Organism", "The whole living thing — systems combined"]];
  BK.def3d("A-b", {
    label: "Photoreal 3D lab", title: "Organisation of life",
    blurb: "Cut a cube into smaller cubes and watch surface area / volume rise — the reason large organisms need organs, systems and transport. Then step through the levels of organisation.",
    env: "studio", cam: [[1.2, 4.6, 9.4], [1.5, 1.1, 0]], fov: 36,
    values: { mode: "sav", L: 4, split: 0, lvl: 2 },
    controls: [{ type: "tabs", key: "mode", label: "View", options: [["sav", "Surface area / volume"], ["lvl", "Levels of organisation"]] },
      { key: "L", label: "Cube side", min: 1, max: 5, step: 1, unit: "cm", show: W("mode", "sav") }, { type: "toggle", key: "split", label: "Cut into 1 cm cubes", show: W("mode", "sav") },
      { key: "lvl", label: "Level", min: 0, max: 4, step: 1, fmt: (v) => LEVELS[v][0], show: W("mode", "lvl") }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) {
      const T3 = T(), key = c.mode + (c.mode === "sav" ? c.L : "");
      if (s.key !== key) { s.key = key; const g = BK.group(S, s); s.cubes = []; s.lv = [];
        if (c.mode === "sav") { const tissue = BK.mat.tissue(0xd98a6a, 0.45); const n = c.L, sz = 0.5; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) { const m = new T3.Mesh(window.P3D.S ? new T3.BoxGeometry(sz * 0.98, sz * 0.98, sz * 0.98) : null, tissue); m.userData.h = V((i - (n - 1) / 2) * sz, j * sz + sz / 2, (k - (n - 1) / 2) * sz); m.position.copy(m.userData.h); m.castShadow = true; g.add(m); s.cubes.push(m); } }
        else { const M = BK.mat; const items = []; const cell = new T3.Mesh(BK.blob(0.45, 2, 0.25, 32, 1.3, 0.5, 1), M.membrane(0x8ec9e0, 0.6)); items.push(cell);
          const tis = new T3.Group(); const hexM = M.tissue(0xd98a8a, 0.4); for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const h = new T3.Mesh(new T3.CylinderGeometry(0.13, 0.13, 0.12, 6), hexM); h.position.set(i * 0.23 + (j % 2) * 0.115, 0, j * 0.2); tis.add(h); } items.push(tis);
          const heart = new T3.Mesh(BK.blob(0.45, 7, 0.12, 40, 1, 1.2, 0.9), M.wet(0xa8323a)); items.push(heart);
          const sys = new T3.Group(); const vm = M.wet(0xb3121b), vm2 = M.wet(0x2b4fb3); const h2 = heart.clone(); h2.scale.setScalar(0.5); sys.add(h2); for (let i = 0; i < 6; i++) { const pts = [V(0, 0, 0), V(Math.cos(i) * 0.5, 0.3 + Math.sin(i * 2) * 0.3, Math.sin(i) * 0.5), V(Math.cos(i) * 0.7, -0.5, Math.sin(i) * 0.6)]; sys.add(new T3.Mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 20, 0.035, 6), i % 2 ? vm : vm2)); } items.push(sys);
          const hum = BK.human(M.skin(0x8d5a3b)); hum.scale.setScalar(0.42); hum.position.y = -0.6; const og = new T3.Group(); og.add(hum); items.push(og);
          items.forEach((it, i) => { it.position.x = -3 + i * 1.6; it.position.y += 1.2; BK.shadow(it, true, true); g.add(it); s.lv.push(it); }); }
      }
      if (c.mode === "sav") { const spread = c.split ? 0.35 : 0; s.cubes.forEach((m) => { const h = m.userData.h; const tgt = V(h.x * (1 + spread * 2), h.y * (1 + spread * 1.4) + (c.split ? 0.1 : 0), h.z * (1 + spread * 2)); m.position.lerp(tgt, dt * 4); }); s.grp = s.g; s.g.rotation.y += dt * 0.2; }
      else s.lv.forEach((it, i) => { const on = i === c.lvl; it.scale.lerp(V(on ? 1.4 : 0.85, on ? 1.4 : 0.85, on ? 1.4 : 0.85), dt * 4); it.rotation.y += dt * (on ? 0.8 : 0.1); });
    },
    overlay(ctx, s, c, S, B) { if (c.mode === "lvl") s.lv.forEach((it, i) => BK.lab(S, B, it.position.x, it.position.y + 1.05, it.position.z, LEVELS[i][0], i === c.lvl ? "#ffd27a" : "#9fb3d6", 0, 0, i === c.lvl ? 12 : 10)); },
    hud: (s, c) => { if (c.mode === "lvl") return [{ title: "Level: " + LEVELS[c.lvl][0], lines: [LEVELS[c.lvl][1], "—", "Cell → tissue → organ → system → organism", "Higher levels = division of labour and specialisation."] }];
      const L = c.L, big = { sa: 6 * L * L, v: L * L * L }, small = { sa: 6 * L * L * L, v: L * L * L }, q = c.split ? small : big; return [{ title: "Surface area / volume", lines: [["SA = " + q.sa + " cm²   V = " + q.v + " cm³", "#ffd27a"], ["SA : V = " + f(q.sa / q.v, 2) + " : 1", "#5bd68c", true], c.split ? "Same volume, " + L + "× more surface — like many small cells." : "Bigger cube → smaller SA:V (= 6 ÷ side).", "Large organisms cannot rely on diffusion through their surface; they need lungs, gills, a gut and blood."] }]; },
    readouts: (s, c) => c.mode === "sav" ? [["Side", c.L + " cm"], ["SA : V", f(c.split ? 6 : 6 / c.L, 2)]] : [["Level", LEVELS[c.lvl][0]]],
    steps: (s, c) => c.mode === "sav" ? [`Surface area of one cube = 6 × side² = 6 × ${c.L}² = ${6 * c.L * c.L} cm²`, `Volume = side³ = ${c.L}³ = ${c.L ** 3} cm³`, `SA : V = ${6 * c.L * c.L} ÷ ${c.L ** 3} = ${f(6 / c.L, 2)} : 1`, `Cut into ${c.L ** 3} cubes of 1 cm: SA = ${6 * c.L ** 3} cm², same volume → SA:V = 6 : 1`] : null,
    note: "Complexity brings <b>division of labour</b> and efficiency, but cells become dependent on each other — a cell from a tissue cannot live alone.",
    draw: BK.fallback("Organisation of life", (s, c) => ["SA : V = 6 ÷ side for a cube; side " + c.L + " cm → " + f(6 / c.L, 2) + " : 1", "Cell → tissue → organ → system → organism"]),
  });

  /* ---------------- A-g  respiration on the bench ---------------- */
  function flask(T3) { const pts = []; const prof = [[0.02, 0], [0.75, 0], [0.8, 0.06], [0.78, 0.15], [0.25, 1.15], [0.2, 1.3], [0.2, 1.65], [0.24, 1.7]]; prof.forEach(([r, y]) => pts.push(new T3.Vector2(r, y))); const m = new T3.Mesh(new T3.LatheGeometry(pts, 48), window.P3D.mat.glass()); m.renderOrder = 3; return m; }
  BK.def3d("A-g", {
    label: "Photoreal 3D bench experiment", title: "Cellular respiration",
    blurb: "Germinating seeds turn lime water milky with the CO₂ they breathe out; yeast fermenting sugar blows up a balloon. Change the temperature and watch the rate.",
    env: "lab", cam: [[1.3, 3.0, 7.6], [1.4, 1.0, 0]], fov: 38,
    values: { mode: "aer", temp: 30 },
    controls: [{ type: "tabs", key: "mode", label: "Experiment", options: [["aer", "Aerobic — germinating seeds"], ["ana", "Anaerobic — yeast fermentation"]] }, { key: "temp", label: "Temperature", min: 5, max: 70, unit: "°C" }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) {
      const T3 = T();
      if (s.key !== c.mode) { s.key = c.mode; const g = BK.group(S, s); s.prog = 0;
        const fl = flask(T3); fl.position.set(-1.6, 0, 0); g.add(fl); const fl2 = flask(T3); fl2.position.set(1.0, 0, 0); g.add(fl2);
        if (c.mode === "aer") { const rr = MK.rng(5), seedM = new T3.MeshPhysicalMaterial({ color: 0xd8c08a, roughness: 0.5, sheen: 0.6 }), dead = new T3.MeshPhysicalMaterial({ color: 0xa08a60, roughness: 0.8 });
          [[fl, seedM], [fl2, dead]].forEach(([F, mt], k) => { const im = new T3.InstancedMesh(new T3.SphereGeometry(0.07, 12, 8), mt, 50), m4 = new T3.Matrix4(); for (let i = 0; i < 50; i++) { const a = rr() * 6.3, r = rr() * 0.6; m4.compose(V(F.position.x + Math.cos(a) * r, 0.06 + rr() * 0.18, Math.sin(a) * r), new T3.Quaternion(), V(1.3, 0.9, 1)); im.setMatrixAt(i, m4); } g.add(im); if (!k) { for (let i = 0; i < 18; i++) { const pts = [V(0, 0, 0), V((rr() - 0.5) * 0.1, 0.12, (rr() - 0.5) * 0.1), V((rr() - 0.5) * 0.25, 0.22, (rr() - 0.5) * 0.25)]; const sh = new T3.Mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 8, 0.012, 5), new T3.MeshStandardMaterial({ color: 0xf2f0d8 })); const a = rr() * 6.3, r = rr() * 0.5; sh.position.set(F.position.x + Math.cos(a) * r, 0.2, Math.sin(a) * r); g.add(sh); } } });
          s.lime = []; [fl, fl2].forEach((F) => { const tt = new T3.Mesh(new T3.CylinderGeometry(0.18, 0.18, 1.2, 24, 1, true), window.P3D.mat.glass()); tt.position.set(F.position.x + 0.9, 0.6, 0.4); tt.renderOrder = 3; g.add(tt); const lw = new T3.Mesh(new T3.CylinderGeometry(0.16, 0.16, 0.7, 24), new T3.MeshPhysicalMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false })); lw.position.set(F.position.x + 0.9, 0.4, 0.4); lw.renderOrder = 2; g.add(lw); s.lime.push(lw);
            const pipe = new T3.Mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3([V(F.position.x, 1.7, 0), V(F.position.x, 2.05, 0.1), V(F.position.x + 0.9, 2.0, 0.4), V(F.position.x + 0.9, 0.35, 0.4)]), 40, 0.03, 8), window.P3D.mat.glass()); g.add(pipe); });
        } else { s.liq = []; [fl, fl2].forEach((F, k) => { const lq = new T3.Mesh(new T3.CylinderGeometry(0.62, 0.74, 0.5, 40), new T3.MeshPhysicalMaterial({ color: k ? 0xf2e6b8 : 0xe6c98a, transparent: true, opacity: 0.6, roughness: 0.1, depthWrite: false })); lq.position.set(F.position.x, 0.27, 0); lq.renderOrder = 2; g.add(lq);
            const bal = new T3.Mesh(BK.blob(0.35, 3 + k, 0.03, 32, 1, 1.25, 1), new T3.MeshPhysicalMaterial({ color: k ? 0x2f7fd6 : 0xd63c3c, roughness: 0.3, clearcoat: 1, sheen: 0.4 })); bal.position.set(F.position.x, 2.0, 0); g.add(bal); s.liq.push(bal); });
          s.bub = new T3.InstancedMesh(new T3.SphereGeometry(0.03, 8, 6), new T3.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, roughness: 0, depthWrite: false }), 60); g.add(s.bub); s.B = Array.from({ length: 60 }, () => [Math.random()]); }
        BK.shadow(g, true, true);
      }
      const opt = c.mode === "aer" ? 30 : 35, r = Math.max(0, Math.exp(-Math.pow((c.temp - opt) / 15, 2)) * (c.temp > 55 ? Math.max(0, 1 - (c.temp - 55) / 10) : 1));
      s.rate = r; s.prog = Math.min(1, s.prog + dt * 0.05 * r);
      if (c.mode === "aer" && s.lime) { s.lime[0].material.color.setRGB(0.91, 0.95, 1).lerp(new (T().Color)(0xf4f1ea), s.prog); s.lime[0].material.opacity = 0.35 + 0.55 * s.prog; }
      if (c.mode === "ana" && s.liq) { const k = 0.4 + 1.4 * s.prog; s.liq[0].scale.set(k, k, k); s.liq[0].position.y = 1.85 + 0.35 * k; const m4 = new (T().Matrix4)(); s.B.forEach((b, i) => { b[0] = (b[0] + dt * (0.3 + r)) % 1; const a = i * 2.4; m4.makeTranslation(-1.6 + Math.cos(a) * 0.5 * (1 - b[0] * 0.4), 0.05 + b[0] * 0.5, Math.sin(a) * 0.5); s.bub.setMatrixAt(i, m4); }); s.bub.instanceMatrix.needsUpdate = true; }
    },
    overlay(ctx, s, c, S, B) { BK.lab(S, B, -1.6, 2.3, 0, c.mode === "aer" ? "Germinating seeds" : "Yeast + glucose", "#ffd27a", 0, 0); BK.lab(S, B, 1.0, 2.3, 0, c.mode === "aer" ? "Control: boiled seeds" : "Control: boiled yeast", "#9fb3d6", 0, 0); },
    hud: (s, c) => c.mode === "aer" ? [{ title: "Aerobic respiration", lines: ["C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy", ["≈ 38 ATP per glucose (2 glycolysis + 2 Krebs + 34 electron transport)", "#ffd27a"], ["Rate at " + c.temp + " °C: " + f(s.rate * 100, 0) + "% of maximum", "#5bd68c"], ["Lime water milkiness: " + f((s.prog || 0) * 100, 0) + "%", "#e8f1ff"], "Boiled seeds are dead — no respiration, lime water stays clear."] }]
      : [{ title: "Anaerobic respiration (fermentation)", lines: ["Yeast: C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂ + energy", "Muscle: glucose → lactic acid + energy", ["Only ≈ 2 ATP per glucose", "#ffd27a"], ["Rate at " + c.temp + " °C: " + f(s.rate * 100, 0) + "% (enzymes denature above ≈ 55 °C)", "#5bd68c"], "Uses: bread rising (CO₂), palm wine and beer (ethanol), kenkey and garri (fermentation)."] }],
    readouts: (s, c) => [["Temperature", c.temp + " °C"], ["Relative rate", f((s.rate || 0) * 100, 0) + "%"], ["Progress", f((s.prog || 0) * 100, 0) + "%"]],
    table: () => MK.table(["", "Aerobic", "Anaerobic"], [["Oxygen", "Needed", "Not needed"], ["Products", "CO₂ + water", "Ethanol + CO₂ (yeast) or lactic acid"], ["Energy", "≈ 38 ATP", "2 ATP"], ["Where", "Cytoplasm then mitochondria", "Cytoplasm only"]]),
    note: "Glycolysis (glucose → 2 pyruvate) happens in the cytoplasm; the Krebs cycle in the mitochondrial matrix.",
    draw: BK.fallback("Respiration", ["Aerobic: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38 ATP", "Anaerobic (yeast): C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂ + 2 ATP"]),
  });

  /* ---------------- A-i  growth and tropisms ---------------- */
  BK.def3d("A-i", {
    label: "Photoreal 3D bench experiment", title: "Growth and tropisms",
    blurb: "A seedling bends towards a lamp, a horizontal seedling sends its root down and shoot up, and an ink-marked root shows where growth happens fastest.",
    env: "lab", cam: [[1.3, 2.6, 6.8], [1.2, 1.2, 0]], fov: 38,
    values: { mode: "photo", side: 1, days: 3 },
    controls: [{ type: "tabs", key: "mode", label: "Experiment", options: [["photo", "Phototropism"], ["geo", "Geotropism"], ["zones", "Regions of growth"]] },
      { type: "tabs", key: "side", label: "Light from", options: [[1, "Right"], [0, "Above"], [-1, "Left"]], show: W("mode", "photo") }, { key: "days", label: "Time", min: 0, max: 6, step: 0.1, unit: "days" }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) {
      const T3 = T();
      if (s.key !== c.mode) { s.key = c.mode; s.dk = ""; const g = BK.group(S, s); s.dyn = BK.group(S, s, "dyn");
        const pot = new T3.Mesh(new T3.CylinderGeometry(0.5, 0.38, 0.7, 32), new T3.MeshPhysicalMaterial({ color: 0xb8643a, roughness: 0.7 })); const soil = new T3.Mesh(new T3.CircleGeometry(0.48, 32), BK.mat.soil([1, 1])); soil.rotation.x = -Math.PI / 2;
        if (c.mode !== "zones") { pot.position.y = 0.35; soil.position.y = 0.69; g.add(pot, soil); }
        if (c.mode === "photo") { s.lamp = window.P3D.S.mk.bulb(0xfff2c8, 14); g.add(s.lamp); const box = new T3.Mesh(new T3.BoxGeometry(3.4, 3.2, 2.2), new T3.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.9, side: T3.BackSide, transparent: true, opacity: 0.35 })); box.position.y = 1.6; g.add(box); }
        if (c.mode === "zones") { const jar = new T3.Mesh(new T3.CylinderGeometry(0.9, 0.9, 2.4, 40, 1, true), window.P3D.mat.glass()); jar.position.y = 1.2; jar.renderOrder = 3; g.add(jar); const bean = new T3.Mesh(BK.blob(0.22, 4, 0.05, 24, 1.3, 0.9, 0.8), new T3.MeshPhysicalMaterial({ color: 0x9b3b2f, roughness: 0.35, clearcoat: 0.7 })); bean.position.set(0, 2.0, 0.5); g.add(bean); s.bean = bean; }
        BK.shadow(g, true, true);
      }
      const d = c.days, k = Math.min(1, d / 6), dk = c.mode + "|" + c.side + "|" + c.days; if (s.dk === dk) return; s.dk = dk;
      // rebuild the curved organs whenever the inputs change (differential growth model)
      BK.dispose(S, s.dyn); const g2 = BK.group(S, s, "dyn"), stemM = new T3.MeshPhysicalMaterial({ color: 0x8fbf5a, roughness: 0.45, sheen: 0.5 }), rootM = new T3.MeshPhysicalMaterial({ color: 0xefe6cf, roughness: 0.6, sheen: 0.4 });
      const organ = (start, dir0, len, bendTo, bendAmt, r, mat, n = 16) => { const pts = [start.clone()]; let dir = dir0.clone().normalize(); const seg = len / n; for (let i = 0; i < n; i++) { dir.lerp(bendTo, bendAmt / n).normalize(); pts.push(pts[pts.length - 1].clone().addScaledVector(dir, seg)); } g2.add(new T3.Mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 40, r, 10), mat)); return pts; };
      if (c.mode === "photo") { const side = +c.side; s.lamp.position.set(side * 1.4, side === 0 ? 3.0 : 1.8, 0); const len = 0.3 + 1.7 * k; const pts = organ(V(0, 0.7, 0), V(0, 1, 0), len, V(side * 0.9, 1, 0).normalize(), side === 0 ? 0 : 2.2 * k, 0.04, stemM);
        const tip = pts[pts.length - 1]; const lm = BK.mat.leaf("#4f9a3a", "#b8e08a"); for (const sd of [-1, 1]) { const lf = BK.leaf(0.32, 0.18, lm, 0.2); lf.position.copy(tip); lf.rotation.z = sd * 1.0 - side * 0.5 * k; g2.add(lf); }
        s.aux = side === 0 ? "Even on both sides — grows straight up" : "Auxin moves to the shaded " + (side > 0 ? "left" : "right") + " side → those cells elongate more → shoot bends toward light";
        for (let i = 2; i < pts.length; i += 2) { const sh = new T3.Mesh(new T3.SphereGeometry(0.035, 8, 6), BK.mat.glow(0xffb347, 0.75)); sh.position.copy(pts[i]).add(V(-side * 0.05, 0, 0.03)); if (side) g2.add(sh); } }
      if (c.mode === "geo") { const len = 0.3 + 1.3 * k; const base = V(0, 1.2, 0); const seed = new T3.Mesh(BK.blob(0.18, 4, 0.05, 20, 1.3, 0.9, 0.8), new T3.MeshPhysicalMaterial({ color: 0xc9a46a, roughness: 0.5 })); seed.position.copy(base); g2.add(seed);
        organ(base.clone().add(V(0.15, 0, 0)), V(1, 0, 0), len, V(0, 1, 0), 2.5 * k, 0.035, stemM); organ(base.clone().add(V(-0.15, 0, 0)), V(-1, 0, 0), len * 0.9, V(0, -1, 0), 2.5 * k, 0.03, rootM); s.aux = "Shoot: positively phototropic, negatively geotropic. Root: positively geotropic."; }
      if (c.mode === "zones") { const start = V(0, 1.85, 0.5), marks = 8, gap0 = 0.12; // zone of elongation 2–5 mm behind tip grows fastest
        let y = start.y; const ys = [y]; for (let i = 0; i < marks; i++) { const fromTip = marks - i; const grow = fromTip >= 2 && fromTip <= 4 ? 1 + 2.4 * k : fromTip === 1 ? 1 + 0.4 * k : 1 + 0.05 * k; y -= gap0 * grow; ys.push(y); }
        const pts = ys.map((yy) => V(0, yy, 0.5)); g2.add(new T3.Mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 40, 0.035, 10), rootM)); const cap = new T3.Mesh(new T3.ConeGeometry(0.035, 0.08, 10), new T3.MeshStandardMaterial({ color: 0xdcc59a })); cap.rotation.x = Math.PI; cap.position.set(0, y - 0.04, 0.5); g2.add(cap);
        ys.forEach((yy, i) => { if (i === 0) return; const m = new T3.Mesh(new T3.TorusGeometry(0.037, 0.008, 6, 16), new T3.MeshStandardMaterial({ color: 0x111111 })); m.rotation.x = Math.PI / 2; m.position.set(0, yy, 0.5); g2.add(m); }); s.ys = ys; s.aux = "Marks spread most just behind the tip — the zone of elongation."; }
      BK.shadow(g2, true, false);
    },
    overlay(ctx, s, c, S, B) { if (c.mode === "zones" && s.ys) { const L = s.ys.length; BK.lab(S, B, 0.05, s.ys[L - 1], 0.5, "Root cap + cell division", "#ff7b72", 14, 6); BK.lab(S, B, 0.05, s.ys[L - 3], 0.5, "Zone of elongation", "#ffd27a", 14, 0); BK.lab(S, B, 0.05, s.ys[1], 0.5, "Differentiation / maturation", "#5bd68c", 14, 0); } },
    hud: (s, c) => [{ title: { photo: "Phototropism", geo: "Geotropism", zones: "Regions of fastest growth" }[c.mode], lines: [s.aux || "", "—", ["Day " + f(c.days, 1) + " of 6", "#7cb3ff"], c.mode === "zones" ? "Equal 2 mm ink marks; after growth the spacing shows where cells elongated." : "Tropism = growth movement of part of a plant in response to a directional stimulus."] }],
    readouts: (s, c) => [["Day", f(c.days, 1)], ["Stimulus", { photo: "Light", geo: "Gravity", zones: "—" }[c.mode]]],
    table: () => MK.table(["Tropism", "Stimulus", "Shoot", "Root"], [["Phototropism", "Light", "Positive", "Negative"], ["Geotropism", "Gravity", "Negative", "Positive"], ["Hydrotropism", "Water", "—", "Positive"], ["Thigmotropism", "Touch", "Tendrils", "—"]]),
    note: "Growth = irreversible increase in dry mass. Auxins (IAA) are made at the tips; in roots high auxin <b>inhibits</b> elongation, which is why roots bend down.",
    draw: BK.fallback("Growth and tropisms", ["Shoots bend toward light (auxin on the shaded side)", "Roots grow down (positive geotropism)", "Fastest growth: zone of elongation just behind the tip"]),
  });
})();
