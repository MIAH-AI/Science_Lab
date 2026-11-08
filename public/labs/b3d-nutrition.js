/* b3d-nutrition.js — Topic B (Plant & Animal Nutrition) photoreal labs:
   B-a Elodea bubbling under a lamp (limiting factors) + starch test on a variegated leaf
   B-b water-culture jars (mineral deficiencies)      B-c balanced-diet plate (real nutrient values)
   B-d food tests in a test-tube rack                 B-e enzyme lock and key with activity curve
   B-f modes of nutrition diorama                     B-g alimentary canal and teeth / dental formulae */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, W = MK.when, f = MK.fmt;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const tube = (pts, r, mat, seg = 60, rs = 12) => new (T().Mesh)(new (T().TubeGeometry)(new (T().CatmullRomCurve3)(pts), seg, r, rs), mat);
  const glass = () => window.P3D.mat.glass();

  /* ===================== B-a  photosynthesis ===================== */
  function elodea(T3, h) { const g = new T3.Group(), lm = new T3.MeshPhysicalMaterial({ color: 0x3f9a3a, roughness: 0.4, transparent: true, opacity: 0.9, side: T3.DoubleSide }); const st = new T3.Mesh(new T3.CylinderGeometry(0.02, 0.02, h, 6), new T3.MeshStandardMaterial({ color: 0x6aa84a })); st.position.y = h / 2; g.add(st); for (let y = 0.1; y < h; y += 0.09) for (let k = 0; k < 3; k++) { const lf = new T3.Mesh(BK.leafGeo(0.16, 0.05, 0.1, 4), lm); lf.position.y = y; lf.rotation.set(-1.1, k * 2.09 + y * 3, 0); g.add(lf); } return g; }
  BK.def3d("B-a", {
    label: "Photoreal 3D bench experiment", title: "Photosynthesis",
    blurb: "Count the oxygen bubbles rising from Elodea as you move the lamp, add carbon dioxide (sodium hydrogencarbonate) or change the temperature. Then test a variegated leaf for starch.",
    env: "lab", cam: [[1.1, 2.0, 4.6], [1.0, 1.2, 0]], fov: 38,
    values: { mode: "rate", d: 20, co2: 0.5, temp: 25, step: 3 },
    controls: [{ type: "tabs", key: "mode", label: "Experiment", options: [["rate", "Rate (Elodea)"], ["starch", "Starch test (variegated leaf)"]] }, { key: "d", label: "Lamp distance", min: 5, max: 60, unit: "cm", show: W("mode", "rate") }, { key: "co2", label: "NaHCO₃ (CO₂ supply)", min: 0, max: 2, step: 0.1, unit: "%", show: W("mode", "rate") }, { key: "temp", label: "Water temperature", min: 5, max: 50, unit: "°C", show: W("mode", "rate") },
      { key: "step", label: "Test stage", min: 0, max: 3, step: 1, fmt: (v) => ["fresh leaf", "boiled in water", "decolourised in alcohol", "iodine added"][v], show: W("mode", "starch") }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) { const T3 = T();
      if (s.key !== c.mode) { s.key = c.mode; const g = BK.group(S, s);
        if (c.mode === "rate") { const bk = window.P3D.S.mk.beaker(0.9, 1.8, 1.5, 0x9ecfe8); g.add(bk); const pl = elodea(T3, 1.0); pl.position.set(0, 0.1, 0); g.add(pl); const fun = new T3.Mesh(new T3.ConeGeometry(0.6, 0.6, 32, 1, true), glass()); fun.position.set(0, 0.55, 0); fun.rotation.x = Math.PI; g.add(fun); const tt = new T3.Mesh(new T3.CylinderGeometry(0.12, 0.12, 1.6, 24, 1, true), glass()); tt.position.set(0, 1.6, 0); tt.renderOrder = 3; g.add(tt);
          s.gas = new T3.Mesh(new T3.CylinderGeometry(0.1, 0.1, 1, 20), new T3.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, roughness: 0, depthWrite: false })); g.add(s.gas); s.gasH = 0;
          s.lamp = window.P3D.S.mk.bulb(0xfff2c8, 16); g.add(s.lamp); const shade = new T3.Mesh(new T3.ConeGeometry(0.35, 0.4, 24, 1, true), new T3.MeshPhysicalMaterial({ color: 0x2a3a5a, metalness: 0.6, roughness: 0.3, side: T3.DoubleSide })); shade.rotation.z = Math.PI / 2; s.lamp.add(shade); shade.position.x = -0.15;
          s.bub = new T3.InstancedMesh(new T3.SphereGeometry(0.025, 8, 6), new T3.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, roughness: 0, depthWrite: false }), 60); g.add(s.bub); s.B = Array.from({ length: 60 }, () => [Math.random(), Math.random() < 0.5]); s.count = 0; s.acc = 0;
          const th = new T3.Mesh(new T3.CylinderGeometry(0.03, 0.03, 1.6, 8), glass()); th.position.set(0.5, 1.2, 0.3); g.add(th); const merc = new T3.Mesh(new T3.CylinderGeometry(0.012, 0.012, 1, 6), new T3.MeshStandardMaterial({ color: 0xd02020 })); g.add(merc); s.merc = merc; }
        else { s.leaf = new T3.Mesh(BK.leafGeo(2.6, 1.6, 0.05, 20), new T3.MeshStandardMaterial({ roughness: 0.6, side: T3.DoubleSide })); s.leaf.rotation.x = -Math.PI / 2 + 0.25; s.leaf.position.set(0, 0.5, 1.0); g.add(s.leaf); s.dish = new T3.Mesh(new T3.CylinderGeometry(1.8, 1.8, 0.2, 48, 1, true), glass()); s.dish.position.set(0, 0.4, 0); g.add(s.dish); s.lastStep = -1; }
        BK.shadow(g, true, true); }
      if (c.mode === "rate") { const Lrel = Math.pow(10 / c.d, 2), lightF = Lrel / (Lrel + 0.25), co2F = (c.co2 + 0.03) / (c.co2 + 0.03 + 0.35), tf = Math.exp(-Math.pow((c.temp - 30) / 11, 2)) * (c.temp > 42 ? Math.max(0, 1 - (c.temp - 42) / 8) : 1); const r = 60 * Math.min(lightF, co2F) * tf; s.r = r; s.lim = tf < Math.min(lightF, co2F) * 0.9 ? "temperature" : lightF < co2F ? "light intensity" : "carbon dioxide";
        s.lamp.position.set(0.95 + c.d / 18, 1.0, 0); s.lamp.setPower(1); const m4 = new (T().Matrix4)(); s.B.forEach((b, i) => { const on = i < Math.ceil(r / 1.2); if (on) b[0] = (b[0] + dt * (0.35 + r / 120)) % 1; m4.makeTranslation(Math.sin(i * 7) * 0.05, 0.8 + b[0] * 0.55, Math.cos(i * 7) * 0.05); if (!on) m4.makeTranslation(0, -10, 0); s.bub.setMatrixAt(i, m4); }); s.bub.instanceMatrix.needsUpdate = true;
        s.acc += dt * r / 60; s.count = Math.floor(s.acc); s.gasH = Math.min(1.2, s.gasH + dt * r * 0.0006); s.gas.scale.y = 0.01 + s.gasH; s.gas.position.y = 2.38 - (0.01 + s.gasH) / 2; s.merc.scale.y = 0.3 + c.temp / 60; s.merc.position.set(0.5, 0.55 + (0.3 + c.temp / 60) / 2, 0.3); }
      else if (s.lastStep !== c.step) { s.lastStep = c.step; const cv = BK.cv(256, 512), g2 = cv.getContext("2d"); const st = c.step; const green = st === 0 ? "#3f8a3a" : st === 1 ? "#5a8a3a" : st === 2 ? "#e8e4c0" : "#1a1a3a", white = st === 0 ? "#f2f0d8" : st === 1 ? "#d8d8b8" : st === 2 ? "#f2f0e0" : "#c8862a";
        g2.fillStyle = white; g2.fillRect(0, 0, 256, 512); g2.fillStyle = green; g2.beginPath(); g2.ellipse(128, 260, 80, 210, 0, 0, 6.3); g2.fill(); g2.strokeStyle = st >= 2 ? "rgba(120,100,60,.5)" : "rgba(200,230,170,.7)"; g2.lineWidth = 4; g2.beginPath(); g2.moveTo(128, 512); g2.lineTo(128, 0); g2.stroke(); s.leaf.material.map && s.leaf.material.map.dispose(); s.leaf.material.map = BK.tex(cv); s.leaf.material.needsUpdate = true; }
    },
    overlay(ctx, s, c, S, B) { if (c.mode === "rate") { BK.lab(S, B, 0, 2.5, 0, "O₂ collects", "#e8f1ff", 0, -6); BK.lab(S, B, 0.15, 0.4, 0.8, "Elodea", "#5bd68c", 10, 10); } },
    hud: (s, c) => c.mode === "rate" ? [{ title: "Rate of photosynthesis", lines: [["≈ " + f(s.r || 0, 0) + " bubbles per minute", "#ffd27a", true], ["Light intensity ∝ 1/d² = " + f(Math.pow(10 / c.d, 2) * 100, 0) + "% of 10 cm value", "#e8f1ff"], ["Limiting factor now: " + (s.lim || ""), "#ff7b72"], "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (light, chlorophyll)", "Light reaction: water split, ATP + NADPH made, O₂ released. Dark reaction: CO₂ fixed into sugar."] }]
      : [{ title: "Testing a leaf for starch", lines: [["Stage: " + ["fresh variegated leaf", "boil 1 min — kills cells, softens", "warm alcohol — removes chlorophyll", "iodine — blue-black where starch formed"][c.step], "#ffd27a", true], "Only the green (chlorophyll) parts made starch — chlorophyll is necessary.", "De-starch the plant in the dark for 48 h before the experiment.", "Alcohol is heated in a water bath — never over a flame."] }],
    readouts: (s, c) => c.mode === "rate" ? [["Bubbles counted", String(s.count || 0)], ["Rate", f(s.r || 0, 0) + " /min"], ["Limiting", s.lim || ""]] : [["Stage", c.step + 1 + " of 4"]],
    table: () => MK.table(["Condition", "Evidence experiment"], [["Light", "Cover part of a leaf with foil → no starch there"], ["CO₂", "Plant with soda lime (absorbs CO₂) → no starch"], ["Chlorophyll", "Variegated leaf → starch only in green parts"], ["O₂ produced", "Elodea bubbles relight a glowing splint"]]),
    note: "Fate of the products: glucose is used in respiration, stored as starch, converted to sucrose for transport, or to cellulose, proteins and oils.",
    draw: BK.fallback("Photosynthesis", (s, c) => ["Rate rises with light (∝ 1/d²), CO₂ and temperature up to a limit", "Starch test: boil → alcohol → iodine (blue-black = starch)"]),
  });

  /* ===================== B-b  mineral requirements ===================== */
  const MIN = { full: ["Complete culture", "#3f8a3a", "Healthy dark-green leaves, strong roots."], N: ["Without nitrogen (N)", "#b8c84a", "Stunted, older leaves turn yellow (chlorosis) — N is needed for proteins and chlorophyll."], Mg: ["Without magnesium (Mg)", "#9ab84a", "Yellowing between the veins — Mg is the centre of the chlorophyll molecule."], P: ["Without phosphorus (P)", "#5a6a8a", "Dull purplish leaves, poor root growth — P is in ATP and DNA."], K: ["Without potassium (K)", "#8a9a3a", "Leaf edges brown and scorched — K activates enzymes and controls stomata."], Fe: ["Without iron (Fe)", "#d8d870", "Young leaves pale yellow — Fe is needed to MAKE chlorophyll."] };
  BK.def3d("B-b", {
    label: "Photoreal 3D bench experiment", title: "Mineral requirements of plants",
    blurb: "Six water-culture jars, each missing one element. Compare the seedlings after four weeks and match each symptom to the job of the missing mineral.",
    env: "lab", cam: [[1.2, 2.4, 7.6], [1.2, 1.2, 0]], fov: 38,
    values: { sel: "N", weeks: 4 },
    controls: [{ type: "select", key: "sel", label: "Jar", options: Object.keys(MIN).map((k) => [k, MIN[k][0]]) }, { key: "weeks", label: "Time", min: 0, max: 6, step: 0.5, unit: "weeks" }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) { const T3 = T(), key = Math.round(c.weeks * 2);
      if (s.key !== key) { s.key = key; const g = BK.group(S, s); s.jars = {}; const k = c.weeks / 6;
        Object.keys(MIN).forEach((m, i) => { const x = -2.5 + i * 1.0; const jar = new T3.Mesh(new T3.CylinderGeometry(0.35, 0.35, 1.1, 32, 1, true), glass()); jar.position.set(x, 0.55, 0); jar.renderOrder = 3; g.add(jar); const sol = new T3.Mesh(new T3.CylinderGeometry(0.33, 0.33, 0.9, 32), window.P3D.mat.water(0xbfe0c0)); sol.position.set(x, 0.46, 0); sol.renderOrder = 2; g.add(sol); const lid = new T3.Mesh(new T3.CylinderGeometry(0.37, 0.37, 0.06, 32), new T3.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 })); lid.position.set(x, 1.12, 0); g.add(lid);
          const healthy = m === "full" ? 1 : 0.55; const pl = BK.plant({ h: 0.3 + 1.0 * k * healthy, leaves: 3 + Math.round(4 * k * healthy), leafLen: 0.32 * (0.6 + 0.4 * healthy), leafW: 0.18, leafCol: k < 0.15 ? "#3f8a3a" : MIN[m][1] }); pl.position.set(x, 1.15, 0); g.add(pl);
          for (let r = 0; r < 6; r++) { const pts = [V(x, 1.1, 0), V(x + (r - 2.5) * 0.04, 0.8, 0.02 * r), V(x + (r - 2.5) * 0.08 * healthy, 0.2 + (1 - k * healthy) * 0.5, 0)]; g.add(tube(pts, 0.008, new T3.MeshStandardMaterial({ color: 0xf2ecd0 }), 10, 4)); }
          s.jars[m] = jar; }); BK.shadow(g, true, true); } },
    overlay(ctx, s, c, S, B) { Object.keys(MIN).forEach((m, i) => BK.lab(S, B, -2.5 + i * 1.0, 0.0, 0.4, m === "full" ? "all" : "−" + m, m === c.sel ? "#ffd27a" : "#9fb3d6", 0, 16, m === c.sel ? 12 : 10)); },
    hud: (s, c) => [{ title: MIN[c.sel][0], lines: [MIN[c.sel][2], "—", "Macro-nutrients: C, H, O, N, P, K, Mg, S, Ca, Fe.", "Micro-nutrients (traces): Cu, Mn, Zn, B.", ["The sun's energy gives food; minerals come from soil water — they are NOT food.", "#7cb3ff"]] }],
    readouts: (s, c) => [["Jar", MIN[c.sel][0]], ["Weeks", c.weeks]],
    note: "Water culture: distilled water + known salts; aerate the solution and cover the jar to keep out light and algae.",
    draw: BK.fallback("Mineral nutrition", (s, c) => [MIN[c.sel][0] + ": " + MIN[c.sel][2]]),
  });

  /* ===================== B-c  balanced diet ===================== */
  const FOOD = { yam: { n: "Boiled yam", per: { kJ: 494, carb: 27, prot: 1.5, fat: 0.2, vit: 1 }, col: 0xf2ead0 }, beans: { n: "Beans (ewa)", per: { kJ: 530, carb: 22, prot: 9, fat: 0.5, vit: 1 }, col: 0x8a4a2a }, fish: { n: "Grilled fish", per: { kJ: 520, carb: 0, prot: 22, fat: 4, vit: 1 }, col: 0xc8a070 }, veg: { n: "Vegetables (efo)", per: { kJ: 97, carb: 3.6, prot: 2.9, fat: 0.4, vit: 8 }, col: 0x2f7a2a }, oil: { n: "Palm oil", per: { kJ: 3700, carb: 0, prot: 0, fat: 100, vit: 2 }, col: 0xd84a10 }, fruit: { n: "Orange", per: { kJ: 197, carb: 12, prot: 0.9, fat: 0.1, vit: 9 }, col: 0xf29a20 } };
  BK.def3d("B-c", {
    label: "Photoreal 3D lab", title: "Food substances and a balanced diet",
    blurb: "Fill the plate with local foods and watch the energy and nutrients add up against what a teenager needs at one meal.",
    env: "studio", cam: [[1.2, 3.8, 5.6], [1.0, 0.6, 0]], fov: 38,
    values: { yam: 150, beans: 100, fish: 60, veg: 80, oil: 10, fruit: 120 },
    controls: Object.keys(FOOD).map((k) => ({ key: k, label: FOOD[k].n, min: 0, max: k === "oil" ? 40 : 300, step: 5, unit: "g" })),
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); const prof = [[0, 0], [1.6, 0], [1.75, 0.08], [2.1, 0.22], [2.15, 0.26]].map(([r, y]) => new T3.Vector2(r, y)); const plate = new T3.Mesh(new T3.LatheGeometry(prof, 64), window.P3D.mat.ceramic(0xf6f4ee)); g.add(plate); const tbl = new T3.Mesh(new T3.CylinderGeometry(4, 4, 0.1, 64), window.P3D.mat.wood()); tbl.position.y = -0.06; g.add(tbl); s.items = {};
      const pos = { yam: [-0.8, 0.5], beans: [0.4, 0.7], fish: [0.8, -0.3], veg: [-0.3, -0.8], oil: [0.05, 0.05], fruit: [-2.6, 1.2] };
      Object.keys(FOOD).forEach((k) => { let m; const fd = FOOD[k];
        if (k === "yam") { m = new T3.Group(); for (let i = 0; i < 3; i++) { const p = new T3.Mesh(new T3.BoxGeometry(0.45, 0.3, 0.3, 2, 2, 2), new T3.MeshPhysicalMaterial({ color: fd.col, roughness: 0.75, sheen: 0.5 })); p.position.set(i * 0.25 - 0.25, 0.15, (i % 2) * 0.2); p.rotation.y = i; m.add(p); } }
        else if (k === "beans") { m = new T3.Mesh(BK.blob(0.5, 4, 0.15, 32, 1, 0.35, 1), new T3.MeshPhysicalMaterial({ map: BK.spotTex("#7a3a1a", "#a8622a", 300, 3), roughness: 0.5, clearcoat: 0.4 })); m.position.y = 0.12; }
        else if (k === "fish") { m = BK.fish(0.6, 0xc8a070); m.position.y = 0.18; m.rotation.x = Math.PI / 2; }
        else if (k === "veg") { m = new T3.Group(); const lm = BK.mat.leaf("#2f6a2a", "#6aa84a"); for (let i = 0; i < 9; i++) { const lf = BK.leaf(0.35, 0.2, lm, 0.2); lf.rotation.set(-1.4, i * 0.7, 0); lf.position.set(Math.cos(i) * 0.15, 0.06, Math.sin(i) * 0.15); m.add(lf); } }
        else if (k === "oil") { m = new T3.Mesh(new T3.CylinderGeometry(0.35, 0.35, 0.02, 32), new T3.MeshPhysicalMaterial({ color: fd.col, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 })); m.position.y = 0.04; }
        else { m = new T3.Mesh(new T3.SphereGeometry(0.35, 32, 24), new T3.MeshPhysicalMaterial({ map: BK.spotTex("#f29a20", "#d87a10", 400, 2), roughness: 0.6, clearcoat: 0.3 })); m.position.y = 0.35; }
        const holder = new T3.Group(); holder.position.set(pos[k][0], 0.22, pos[k][1]); holder.add(m); g.add(holder); s.items[k] = holder; });
      BK.shadow(g, true, true); },
    update(S, s, c, dt) { Object.keys(FOOD).forEach((k) => { const v = c[k], base = k === "oil" ? 15 : 120; const sc = v <= 0 ? 0.001 : Math.cbrt(v / base); s.items[k].scale.lerp(V(sc, sc, sc), dt * 5); }); s.g.rotation.y += dt * 0.05; },
    hud: (s, c) => { const tot = { kJ: 0, carb: 0, prot: 0, fat: 0, vit: 0 }; Object.keys(FOOD).forEach((k) => Object.keys(tot).forEach((q) => (tot[q] += FOOD[k].per[q] * c[k] / 100))); s.tot = tot; const ok = (v, lo, hi) => (v < lo ? "#7cb3ff" : v > hi ? "#ff7b72" : "#5bd68c");
      return [{ title: "This meal", lines: [["Energy: " + f(tot.kJ, 0) + " kJ (target ≈ 3000–3500)", ok(tot.kJ, 2800, 3700), true], ["Carbohydrate: " + f(tot.carb, 0) + " g (energy)", ok(tot.carb, 90, 140)], ["Protein: " + f(tot.prot, 0) + " g (growth, repair)", ok(tot.prot, 18, 45)], ["Fat/oil: " + f(tot.fat, 0) + " g (energy store, vitamins A D E K)", ok(tot.fat, 15, 35)], ["Vitamins/minerals/fibre score: " + f(tot.vit, 0), ok(tot.vit, 12, 99)], "A balanced diet has all classes — including water and roughage — in the right proportions."] }]; },
    readouts: (s, c) => { const t = s.tot || { kJ: 0 }; return [["Energy", f(t.kJ, 0) + " kJ"], ["Daily share", f(t.kJ / 10000 * 100, 0) + "% of ≈ 10 000 kJ"]]; },
    table: () => MK.table(["Food class", "Local sources", "Deficiency"], [["Carbohydrates", "Yam, cassava, rice, maize", "Weakness, weight loss"], ["Proteins", "Beans, fish, meat, eggs", "Kwashiorkor"], ["Fats and oils", "Palm oil, groundnut, shea", "Lack of energy"], ["Vitamin A", "Carrots, palm oil, liver", "Night blindness"], ["Vitamin C", "Oranges, guava, vegetables", "Scurvy"], ["Vitamin D", "Sunlight, fish oil", "Rickets"], ["Iron", "Liver, green vegetables", "Anaemia"], ["Iodine", "Iodised salt, sea food", "Goitre"]]),
    note: "Malnutrition includes both under-nutrition (kwashiorkor, marasmus) and over-nutrition (obesity).",
    draw: BK.fallback("Balanced diet", (s, c) => ["Energy this meal ≈ " + f(Object.keys(FOOD).reduce((a, k) => a + FOOD[k].per.kJ * c[k] / 100, 0), 0) + " kJ", "Carbohydrate, protein, fat, vitamins, minerals, water and fibre"]),
  });

  /* ===================== B-d  food tests ===================== */
  const SAMPLES = { starch: { n: "Starch solution", has: { starch: 1 } }, glucose: { n: "Glucose solution", has: { reducing: 1 } }, egg: { n: "Egg albumen", has: { protein: 1 } }, oil: { n: "Groundnut oil", has: { fat: 1 } }, milk: { n: "Milk", has: { reducing: 0.6, protein: 1, fat: 0.7 } }, yam: { n: "Yam (mashed)", has: { starch: 1, reducing: 0.2 } }, water: { n: "Water (control)", has: {} } };
  const TESTS = { iodine: { n: "Iodine test", f: "starch", pos: 0x14143a, neg: 0xc8862a, how: "Add 2 drops of iodine solution.", res: "Blue-black = starch present; stays brown = absent." }, benedict: { n: "Benedict's (heat)", f: "reducing", pos: 0xc8401a, neg: 0x3a6ad8, how: "Add Benedict's solution, heat in a boiling water bath for 5 min.", res: "Blue → green → yellow → brick-red precipitate = reducing sugar." }, biuret: { n: "Biuret test", f: "protein", pos: 0x8a3ab8, neg: 0x6a9ad8, how: "Add sodium hydroxide, then 1% copper(II) sulphate drop by drop.", res: "Violet/purple = protein; stays blue = absent." }, sudan: { n: "Sudan III / grease spot", f: "fat", pos: 0xd82a2a, neg: 0xf2c8c0, how: "Add Sudan III and shake (or rub on paper).", res: "Red-stained oil layer on top (translucent spot on paper) = fat." } };
  BK.def3d("B-d", {
    label: "Photoreal 3D bench experiment", title: "Food tests",
    blurb: "Run the four classic food tests on seven samples in a test-tube rack. Benedict's is heated in a water bath; watch the colours develop.",
    env: "lab", cam: [[1.3, 2.4, 6.4], [1.3, 1.0, 0]], fov: 38,
    values: { test: "benedict", run: 1 },
    controls: [{ type: "tabs", key: "test", label: "Test", options: Object.keys(TESTS).map((k) => [k, TESTS[k].n]) }],
    actions: [{ label: "↻ Repeat test", run: (s) => { s.p = 0; } }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); s.tubes = []; const rack = new T3.Mesh(new T3.BoxGeometry(4.6, 0.08, 0.7), window.P3D.mat.wood()); rack.position.y = 0.9; g.add(rack); const rack2 = rack.clone(); rack2.position.y = 0.1; g.add(rack2);
      Object.keys(SAMPLES).forEach((k, i) => { const x = -1.95 + i * 0.65, tt = new T3.Mesh(new T3.CylinderGeometry(0.16, 0.16, 1.5, 24, 1, true), glass()); tt.position.set(x, 1.0, 0); tt.renderOrder = 3; g.add(tt); const bot = new T3.Mesh(new T3.SphereGeometry(0.16, 20, 12, 0, 6.3, Math.PI / 2, Math.PI / 2), glass()); bot.position.set(x, 0.25, 0); g.add(bot);
        const liq = new T3.Mesh(new T3.CylinderGeometry(0.145, 0.145, 0.7, 24), new T3.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, roughness: 0.1, clearcoat: 1, depthWrite: false })); liq.position.set(x, 0.62, 0); liq.renderOrder = 2; g.add(liq); const top = new T3.Mesh(new T3.CylinderGeometry(0.145, 0.145, 0.12, 24), new T3.MeshPhysicalMaterial({ color: 0xd82a2a, transparent: true, opacity: 0.9, roughness: 0.1 })); top.position.set(x, 1.02, 0); g.add(top); s.tubes.push({ k, liq, top }); });
      s.bath = new T3.Mesh(new T3.BoxGeometry(5, 0.6, 1.0), new T3.MeshPhysicalMaterial({ color: 0x9ecfe8, transparent: true, opacity: 0.3, roughness: 0.05, depthWrite: false })); s.bath.position.set(0, 0.45, 0); g.add(s.bath); s.steam = 0; BK.shadow(g, true, true); s.p = 0; },
    update(S, s, c, dt) { if (s.lastTest !== c.test) { s.lastTest = c.test; s.p = 0; } s.p = Math.min(1, s.p + dt * 0.25); const te = TESTS[c.test], col = new (T().Color)();
      s.tubes.forEach((tb) => { const amt = (SAMPLES[tb.k].has[te.f] || 0) * s.p; const startCol = c.test === "iodine" ? 0xd8a860 : c.test === "benedict" ? 0x3a6ad8 : c.test === "biuret" ? 0x6a9ad8 : 0xf2e8e0;
        if (c.test === "benedict") { const stops = [0x3a6ad8, 0x4aa84a, 0xe8c82a, 0xc8401a]; const a = amt * 3, i = Math.min(2, Math.floor(a)); col.setHex(stops[i]).lerp(new (T().Color)(stops[i + 1]), a - i); } else col.setHex(startCol).lerp(new (T().Color)(te.pos), amt);
        tb.liq.material.color.copy(col); tb.top.visible = c.test === "sudan" && amt > 0.2; tb.top.scale.y = 0.5 + amt; });
      s.bath.visible = c.test === "benedict"; if (c.test === "benedict" && Math.random() < dt * 6) S.puff((Math.random() - 0.5) * 4.6, 0.8, 0, { color: 0xffffff, n: 2, size: 0.4, speed: 0.4, life: 1.4, op: 0.3 }); },
    overlay(ctx, s, c, S, B) { Object.keys(SAMPLES).forEach((k, i) => { const nm = SAMPLES[k].n.split(" ")[0]; BK.lab(S, B, -1.95 + i * 0.65, 1.9, 0, nm, "#e8f1ff", 0, -4, 9.5); }); },
    hud: (s, c) => { const te = TESTS[c.test]; return [{ title: te.n, lines: [["Method: " + te.how, "#e8f1ff"], ["Result: " + te.res, "#ffd27a"], "—", "Ptyalin (salivary amylase) turns cooked starch into maltose: a starch solution + saliva at 37 °C stops giving blue-black with iodine and starts giving brick-red with Benedict's."] }]; },
    readouts: (s, c) => Object.keys(SAMPLES).slice(0, 4).map((k) => [SAMPLES[k].n, (SAMPLES[k].has[TESTS[c.test].f] || 0) > 0.3 ? "positive" : "negative"]),
    table: (s, c) => MK.table(["Sample", "Iodine", "Benedict's", "Biuret", "Sudan III"], Object.keys(SAMPLES).map((k) => [SAMPLES[k].n].concat(Object.keys(TESTS).map((t) => ((SAMPLES[k].has[TESTS[t].f] || 0) > 0.3 ? "+" : "−"))))),
    note: "Always run a control (water) and use clean tubes for each test. Non-reducing sugars (sucrose) give a positive Benedict's test only after boiling with dilute HCl and neutralising.",
    draw: BK.fallback("Food tests", ["Iodine → blue-black (starch)", "Benedict's + heat → brick-red (reducing sugar)", "Biuret → violet (protein); Sudan III → red layer (fat)"]),
  });

  /* ===================== B-e  digestive enzymes ===================== */
  const ENZ = { amylase: { n: "Salivary amylase (ptyalin)", ph: 6.8, src: "Salivary glands", site: "Mouth", sub: "Starch → maltose" }, pepsin: { n: "Pepsin", ph: 2, src: "Gastric glands (stomach)", site: "Stomach", sub: "Protein → peptides" }, trypsin: { n: "Trypsin", ph: 8, src: "Pancreas", site: "Duodenum", sub: "Protein/peptides → smaller peptides" }, lipase: { n: "Lipase", ph: 8, src: "Pancreas", site: "Duodenum", sub: "Fats → fatty acids + glycerol" }, maltase: { n: "Maltase", ph: 7.5, src: "Intestinal wall", site: "Ileum", sub: "Maltose → glucose" } };
  BK.def3d("B-e", {
    label: "Photoreal 3D lab", title: "Digestive enzymes",
    blurb: "Substrate molecules lock into the active site of an enzyme and split into products. Push the temperature or pH away from the optimum and watch the rate fall — or the enzyme denature.",
    env: "micro", cam: [[1.4, 1.6, 7.0], [1.3, 0.6, 0]], fov: 38,
    values: { enz: "amylase", temp: 37, ph: 6.8, conc: 1 },
    controls: [{ type: "select", key: "enz", label: "Enzyme", options: Object.keys(ENZ).map((k) => [k, ENZ[k].n]) }, { key: "temp", label: "Temperature", min: 0, max: 80, unit: "°C" }, { key: "ph", label: "pH", min: 1, max: 12, step: 0.1 }, { key: "conc", label: "Substrate concentration", min: 0.2, max: 3, step: 0.1, unit: "×" }],
    onChange(s, c, k) { if (k === "enz") c.ph = ENZ[c.enz].ph; }, syncAll: true,
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); const eg = BK.blob(1.2, 6, 0.12, 64); const p = eg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (y > 0.6 && Math.abs(x) < 0.45 && z > -0.2) { p.setY(i, y - (0.45 - Math.abs(x)) * 1.1); } } eg.computeVertexNormals(); s.baseE = eg.attributes.position.array.slice();
      s.enz = new T3.Mesh(eg, new T3.MeshPhysicalMaterial({ color: 0x3f7ad6, roughness: 0.35, clearcoat: 0.8, sheen: 0.6, iridescence: 0.3 })); s.enz.position.y = 0.2; g.add(s.enz);
      s.subs = []; const sm = new T3.MeshPhysicalMaterial({ color: 0xf2b820, roughness: 0.3, clearcoat: 1 }), pm = new T3.MeshPhysicalMaterial({ color: 0x5bd68c, roughness: 0.3, clearcoat: 1 }); for (let i = 0; i < 12; i++) { const sg = new T3.Group(); const a = new T3.Mesh(new T3.BoxGeometry(0.3, 0.3, 0.3), sm), b = new T3.Mesh(new T3.ConeGeometry(0.2, 0.4, 4), sm); b.position.y = -0.3; b.rotation.y = Math.PI / 4; sg.add(a, b); sg.parts = [a, b]; sg.ph = Math.random() * 6; sg.state = 0; g.add(sg); s.subs.push(sg); } s.pm = pm; s.sm = sm; s.made = 0; },
    update(S, s, c, dt) { const e = ENZ[c.enz]; const tf = c.temp <= 40 ? Math.pow(2, (c.temp - 37) / 10) : Math.max(0, Math.pow(2, 0.3) * (1 - (c.temp - 40) / 18)); const pf = Math.exp(-Math.pow((c.ph - e.ph) / 1.6, 2)); const vmax = tf * pf, rate = vmax * c.conc / (c.conc + 0.6); s.rate = rate; s.den = c.temp > 55 || Math.abs(c.ph - e.ph) > 4;
      const pa = s.enz.geometry.attributes.position, b = s.baseE, d = s.den ? 1 : 0; for (let i = 0; i < pa.count; i++) { const x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2]; const n = d ? (BK.noise3(x * 2, y * 2, z * 2) - 0.5) * 0.5 : 0; pa.setXYZ(i, x * (1 + n), y + (d && y > 0.4 ? 0.35 : 0), z * (1 + n)); } pa.needsUpdate = true; s.enz.geometry.computeVertexNormals(); s.enz.rotation.y = Math.sin(S.t * 0.3) * 0.3;
      s.subs.forEach((sg, i) => { sg.visible = i < Math.round(4 * c.conc); sg.ph += dt * (0.5 + rate * 0.8); const cyc = sg.ph % 6; const a = i * 0.55; if (cyc < 2.5 || s.den || rate < 0.05) { const r = 3 - (s.den ? 0 : cyc * 0.4); sg.position.set(Math.cos(a + S.t * 0.2) * r, 1.6 + Math.sin(a * 2 + S.t) * 0.6, Math.sin(a + S.t * 0.2) * r * 0.6); sg.parts.forEach((pt) => (pt.material = s.sm)); sg.parts[1].position.set(0, -0.3, 0); }
        else if (cyc < 3.6) { sg.position.lerp(V(0, 1.45, 0.05), dt * 6); } else { sg.parts.forEach((pt) => (pt.material = s.pm)); const k = (cyc - 3.6) * 1.2; sg.position.set(Math.cos(a) * k, 1.6 + k * 0.4, Math.sin(a) * k); sg.parts[1].position.set(k * 0.6, -0.3 - k * 0.3, 0); if (cyc > 5.9) s.made++; } sg.rotation.y += dt; }); },
    overlay(ctx, s, c, S, B) { const e = ENZ[c.enz], pts = Array.from({ length: 41 }, (_, i) => { const tt = i * 2; return [tt, tt <= 40 ? Math.pow(2, (tt - 37) / 10) : Math.max(0, 1.23 * (1 - (tt - 40) / 18))]; }); BK.graph(B, 14, 262, 250, 126, { title: "Activity vs temperature", x0: 0, x1: 80, y0: 0, y1: 1.4, series: [{ pts, color: "#7cb3ff" }], dot: [c.temp, c.temp <= 40 ? Math.pow(2, (c.temp - 37) / 10) : Math.max(0, 1.23 * (1 - (c.temp - 40) / 18)), "#ffd27a"], xl: "°C" }); BK.lab(S, B, 0, 1.25, 0.6, "Active site", "#ffd27a", 14, 4); },
    hud: (s, c) => { const e = ENZ[c.enz]; return [{ title: e.n, lines: [["Rate: " + f((s.rate || 0) * 100, 0) + "% of maximum", s.den ? "#ff7b72" : "#5bd68c", true], s.den ? "DENATURED — the active site has changed shape; the substrate no longer fits (irreversible)." : c.temp < 15 ? "Cold: molecules move slowly, fewer collisions (enzyme not damaged)." : "Lock and key: substrate fits the active site; products leave; enzyme is reused.", ["Optimum pH " + e.ph + " · source " + e.src + " · acts in " + e.site, "#7cb3ff"], ["Substrate → product: " + e.sub, "#ffd27a"]] }]; },
    readouts: (s, c) => [["Temperature", c.temp + " °C"], ["pH", f(c.ph, 1)], ["Rate", f((s.rate || 0) * 100, 0) + "%"]],
    table: () => MK.table(["Enzyme", "Source", "Site", "Substrate → product", "pH"], Object.values(ENZ).map((e) => [e.n, e.src, e.site, e.sub, e.ph])),
    note: "Characteristics of enzymes: proteins, specific, catalysts (unchanged), work best at an optimum temperature (≈ 37 °C in humans) and pH, denatured by heat.",
    draw: BK.fallback("Enzymes", (s, c) => [ENZ[c.enz].n + ": " + ENZ[c.enz].sub + " (optimum pH " + ENZ[c.enz].ph + ")", "Rate rises with temperature to ≈ 37–40 °C, then the enzyme denatures"]),
  });

  /* ===================== B-f  modes of nutrition ===================== */
  const MODES = { auto: ["Autotrophic (photosynthesis)", "Green plants make their own food from CO₂ and water using light.", "Oil palm, maize, Spirogyra"], holo: ["Holozoic", "Ingests solid food, digests, absorbs, assimilates, egests.", "Cow, human, Amoeba"], para: ["Parasitic", "Feeds on a living host and harms it.", "Dodder (Cuscuta) on a host plant, tapeworm, tick"], sapro: ["Saprophytic", "Feeds on dead organic matter by extracellular digestion.", "Mushroom on a rotting log, Rhizopus"], sym: ["Symbiotic (mutualism)", "Two organisms live together and both benefit.", "Lichen = fungus + alga; Rhizobium in root nodules"] };
  BK.def3d("B-f", {
    label: "Photoreal 3D diorama", title: "Modes of nutrition",
    blurb: "A small field with a green plant, a grazing cow, orange dodder strangling a host shrub, mushrooms on a rotting log and lichen on a rock. Pick a mode to spotlight its example.",
    env: "outdoor", cam: [[0.8, 3.4, 8.6], [1.0, 0.8, 0]], fov: 38,
    values: { m: "para" },
    controls: [{ type: "tabs", key: "m", label: "Mode", options: Object.keys(MODES).map((k) => [k, MODES[k][0].split(" (")[0]]) }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); s.ex = {};
      const pl = BK.plant({ h: 1.6, leaves: 8 }); pl.position.set(-2.4, 0, 0.5); g.add(pl); s.ex.auto = pl;
      const cow = BK.quad(1.3, 0x8a5a3a, { ears: true }); cow.position.set(-0.6, 0, -1.0); cow.rotation.y = 0.6; g.add(cow); s.ex.holo = cow;
      const host = BK.plant({ h: 1.3, leaves: 6, leafCol: "#5a8a3a" }); host.position.set(1.2, 0, 0.9); g.add(host); const dod = new T3.Group(); for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 50; i++) { const u = i / 50, a = u * 18 + k * 2; pts.push(V(1.2 + Math.cos(a) * 0.09, u * 1.25, 0.9 + Math.sin(a) * 0.09)); } dod.add(tube(pts, 0.012, new T3.MeshPhysicalMaterial({ color: 0xf2a020, roughness: 0.4 }), 120, 5)); } g.add(dod); s.ex.para = dod;
      const log = new T3.Mesh(new T3.CylinderGeometry(0.28, 0.32, 2.0, 20), BK.mat.bark()); log.rotation.z = Math.PI / 2; log.position.set(2.8, 0.28, -0.4); g.add(log); const ms = new T3.Group(); for (let i = 0; i < 4; i++) { const m = BK.mushroom(0.5 + (i % 2) * 0.2, 0xc8a070); m.position.set(2.2 + i * 0.35, 0.45, -0.2 + (i % 2) * 0.1); ms.add(m); } g.add(ms); s.ex.sapro = ms;
      const rock = new T3.Mesh(BK.blob(0.6, 8, 0.2, 32, 1.2, 0.7, 1), new T3.MeshStandardMaterial({ map: BK.spotTex("#7a7a72", "#b8c870", 260, 7), roughness: 0.9 })); rock.position.set(0.8, 0.35, -2.2); g.add(rock); s.ex.sym = rock;
      s.spot = new T3.SpotLight(0xfff1d6, 120, 18, 0.32, 0.5, 1.2); s.spot.position.set(0, 9, 4); S.scene.add(s.spot, s.spot.target); BK.shadow(g, true, true); },
    update(S, s, c, dt) { const tgt = s.ex[c.m].position.clone(); if (c.m === "para") tgt.set(1.2, 0.6, 0.9); if (c.m === "sapro") tgt.set(2.7, 0.5, -0.2); s.spot.target.position.lerp(tgt, dt * 3); s.ex.holo.children[1].rotation.z = Math.PI / 2.6 + Math.sin(S.t * 2) * 0.15; },
    overlay(ctx, s, c, S, B) { const pos = { auto: [-2.4, 1.9, 0.5], holo: [-0.6, 1.5, -1.0], para: [1.2, 1.5, 0.9], sapro: [2.7, 0.9, -0.3], sym: [0.8, 0.9, -2.2] }; Object.keys(MODES).forEach((k) => BK.lab(S, B, ...pos[k], MODES[k][0].split(" (")[0], k === c.m ? "#ffd27a" : "#9fb3d6", 0, -4, k === c.m ? 12 : 10)); },
    hud: (s, c) => [{ title: MODES[c.m][0], lines: [MODES[c.m][1], ["Examples: " + MODES[c.m][2], "#ffd27a"], "—", "Autotrophs: producers. Heterotrophs (holozoic, parasitic, saprophytic, symbiotic) depend on food made by others."] }],
    readouts: (s, c) => [["Mode", MODES[c.m][0]]],
    draw: BK.fallback("Modes of nutrition", (s, c) => [MODES[c.m][0] + ": " + MODES[c.m][1], "e.g. " + MODES[c.m][2]]),
  });

  /* ===================== B-g  alimentary canal & teeth ===================== */
  const DENT = { human: { n: "Human", up: [2, 1, 2, 3], lo: [2, 1, 2, 3] }, goat: { n: "Goat (herbivore)", up: [0, 0, 3, 3], lo: [3, 1, 3, 3] }, dog: { n: "Dog (carnivore)", up: [3, 1, 4, 2], lo: [3, 1, 4, 3] } };
  function tooth(T3, type) { const m = new T3.MeshPhysicalMaterial({ color: 0xf6f2e6, roughness: 0.25, clearcoat: 1 }); if (type === 0) { const t = new T3.Mesh(new T3.BoxGeometry(0.16, 0.34, 0.06), m); return t; } if (type === 1) return new T3.Mesh(new T3.ConeGeometry(0.08, 0.42, 16), m); const g = new T3.Group(); const b = new T3.Mesh(new T3.BoxGeometry(type === 3 ? 0.26 : 0.18, 0.24, 0.22), m); g.add(b); for (let i = 0; i < (type === 3 ? 4 : 2); i++) { const cu = new T3.Mesh(new T3.SphereGeometry(0.06, 10, 8), m); cu.position.set((i % 2 - 0.5) * 0.1, 0.13, (Math.floor(i / 2) - 0.5) * 0.08); g.add(cu); } return g; }
  BK.def3d("B-g", {
    label: "Photoreal 3D lab", title: "Alimentary system and teeth",
    blurb: "Follow a bolus of food down the alimentary canal by peristalsis, then compare the jaws and dental formulae of a human, a goat and a dog.",
    env: "studio", cam: [[1.4, 2.4, 7.6], [1.2, 1.8, 0]], fov: 38,
    values: { mode: "canal", sp: "human" },
    controls: [{ type: "tabs", key: "mode", label: "View", options: [["canal", "Alimentary canal"], ["teeth", "Teeth & dental formula"]] }, { type: "tabs", key: "sp", label: "Animal", options: Object.keys(DENT).map((k) => [k, DENT[k].n]), show: W("mode", "teeth") }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) { const T3 = T(), key = c.mode + (c.mode === "teeth" ? c.sp : "");
      if (s.key !== key) { s.key = key; const g = BK.group(S, s);
        if (c.mode === "canal") { const hum = BK.human(BK.mat.glassSkin(0xc9a48a)); hum.scale.setScalar(1.0); g.add(hum); const P = [V(0, 3.05, 0.12), V(0, 2.75, 0.05), V(0.02, 2.3, 0), V(0.05, 2.05, 0.05), V(0.25, 1.95, 0.1), V(0.35, 1.85, 0.12), V(0.15, 1.75, 0.12), V(-0.05, 1.78, 0.1)]; for (let i = 0; i < 26; i++) { const a = i * 1.1; P.push(V(Math.cos(a) * 0.22, 1.7 - i * 0.012, 0.08 + Math.sin(a) * 0.12)); } P.push(V(-0.3, 1.35, 0.1), V(-0.32, 1.75, 0.1), V(0.3, 1.78, 0.1), V(0.32, 1.35, 0.1), V(0.05, 1.22, 0.08), V(0, 1.12, 0.05));
          s.curve = new T3.CatmullRomCurve3(P); g.add(new T3.Mesh(new T3.TubeGeometry(s.curve, 400, 0.045, 10), BK.mat.membrane(0xe8a090, 0.55))); const st = new T3.Mesh(BK.blob(0.18, 4, 0.1, 32, 1.4, 1, 0.8), BK.mat.membrane(0xe8a090, 0.45)); st.position.set(0.22, 1.92, 0.1); st.rotation.z = -0.5; g.add(st); const liv = new T3.Mesh(BK.blob(0.22, 6, 0.1, 32, 1.6, 0.6, 0.8), BK.mat.wet(0x7a2a2a)); liv.position.set(-0.2, 2.02, 0.08); g.add(liv); const pan = new T3.Mesh(new T3.CapsuleGeometry(0.04, 0.3, 4, 10), BK.mat.tissue(0xf0c890)); pan.rotation.z = Math.PI / 2; pan.position.set(0.08, 1.82, 0.0); g.add(pan);
          s.bolus = new T3.Mesh(new T3.SphereGeometry(0.06, 16, 12), new T3.MeshPhysicalMaterial({ color: 0xc8963a, roughness: 0.5 })); g.add(s.bolus); s.ring = new T3.Mesh(new T3.TorusGeometry(0.055, 0.025, 8, 20), BK.mat.muscle()); g.add(s.ring); s.u = 0; }
        else { const d = DENT[c.sp], gum = new T3.MeshPhysicalMaterial({ color: 0xd87a80, roughness: 0.4, clearcoat: 0.5, sheen: 1 }); s.counts = d; [1, -1].forEach((sd) => { const arch = new T3.Mesh(new T3.TorusGeometry(1.3, 0.12, 12, 48, Math.PI), gum); arch.rotation.x = Math.PI / 2; arch.position.y = 1.4 + sd * 0.42; arch.scale.setScalar(sd > 0 ? 1 : 0.94); g.add(arch); const row = sd > 0 ? d.up : d.lo; const types = []; row.forEach((n, t) => { for (let i = 0; i < n; i++) types.push(t); }); const half = types; const total = half.length;
            [1, -1].forEach((side) => { half.forEach((t, i) => { const a = Math.PI / 2 - side * (0.07 + (i / Math.max(1, total)) * 1.45); const R = sd > 0 ? 1.3 : 1.22; const th = tooth(T3, t); th.position.set(Math.cos(a) * R, 1.4 + sd * 0.42 - sd * 0.24, Math.sin(a) * R); th.rotation.y = -a + Math.PI / 2; if (sd < 0) th.rotation.x = Math.PI; g.add(th); }); }); });
          if (c.sp === "goat") { const pad = new T3.Mesh(new T3.BoxGeometry(0.6, 0.08, 0.3), gum); pad.position.set(0, 1.62, 1.25); g.add(pad); } }
        BK.shadow(g, true, true); }
      if (c.mode === "canal") { s.u = (s.u + dt * 0.035) % 1; const p = s.curve.getPointAt(s.u), tng = s.curve.getTangentAt(s.u); s.bolus.position.copy(p); s.ring.position.copy(s.curve.getPointAt(Math.max(0, s.u - 0.012))); s.ring.quaternion.setFromUnitVectors(V(0, 0, 1), tng); s.where = s.u < 0.06 ? "Mouth: chewing, saliva (amylase)" : s.u < 0.16 ? "Oesophagus: peristalsis" : s.u < 0.24 ? "Stomach: pepsin, HCl, churning (≈ 3–4 h)" : s.u < 0.3 ? "Duodenum: bile + pancreatic juice" : s.u < 0.85 ? "Ileum: digestion completed; absorption by villi" : "Colon: water absorbed; rectum stores faeces"; }
      else s.g.rotation.y = Math.sin(S.t * 0.4) * 0.5; },
    overlay(ctx, s, c, S, B) { if (c.mode === "canal" && s.bolus) { const p = s.bolus.position; BK.leader(S, B, [p.x, p.y, p.z], s.where, "#ffd27a", 70, -14); } },
    hud: (s, c) => c.mode === "canal" ? [{ title: "Journey of food", lines: [[s.where || "", "#ffd27a", true], "Ingestion → digestion → absorption → assimilation → egestion.", "Peristalsis: waves of contraction of circular and longitudinal muscles push food along.", "Villi: huge surface, thin walls, capillaries (glucose, amino acids) and lacteals (fats)."] }]
      : (() => { const d = DENT[c.sp], tot = 2 * (d.up.reduce((a, b) => a + b, 0) + d.lo.reduce((a, b) => a + b, 0)); return [{ title: "Dental formula — " + d.n, lines: [["i " + d.up[0] + "/" + d.lo[0] + "  c " + d.up[1] + "/" + d.lo[1] + "  pm " + d.up[2] + "/" + d.lo[2] + "  m " + d.up[3] + "/" + d.lo[3] + "  = " + tot, "#ffd27a", true], c.sp === "goat" ? "No upper incisors or canines — a horny pad; gap (diastema) lets the tongue move grass; ridged molars grind." : c.sp === "dog" ? "Long canines for gripping; carnassial teeth (last upper premolar + first lower molar) slice flesh." : "Omnivore: incisors cut, canines tear, premolars and molars crush and grind.", "Formula counts ONE side of the jaw: upper/lower; multiply by 2 for the total."] }]; })(),
    readouts: (s, c) => c.mode === "teeth" ? [["Total teeth", String(2 * (DENT[c.sp].up.reduce((a, b) => a + b, 0) + DENT[c.sp].lo.reduce((a, b) => a + b, 0)))]] : [["Region", (s.where || "").split(":")[0]]],
    table: () => MK.table(["Tooth", "Shape", "Function"], [["Incisor", "Chisel", "Cutting, biting"], ["Canine", "Pointed", "Tearing, gripping"], ["Premolar", "Two cusps", "Crushing, grinding"], ["Molar", "Four or more cusps", "Grinding"]]),
    note: "Dental care: brush twice daily, fluoride toothpaste, reduce sugary snacks, regular dental check-ups. Plaque bacteria make acid that dissolves enamel (caries).",
    draw: BK.fallback("Alimentary system", (s, c) => ["Mouth → oesophagus → stomach → duodenum → ileum → colon → rectum → anus", "Human dental formula: i 2/2 c 1/1 pm 2/2 m 3/3 = 32"]),
  });
})();
