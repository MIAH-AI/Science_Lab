/* c3d-g11.js — chemistry 3D gap scenes: extraction of aluminium (Hall–Héroult) and tin; compounds of copper; iodine–thiosulphate (iodometric) titration */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready || !C3.gx || !C3.gx.titr) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, G = C3.gx, CM = C3.CM, TAU = Math.PI * 2;
  const { clamp, lerp } = G, rnd = U.rnd, F = 96485;

  /* =============================== extraction of aluminium / tin =============================== */
  const AMODES = ["Aluminium: electrolysis of alumina in molten cryolite (Hall–Héroult)", "Tin: reduction of cassiterite with carbon"];
  C3.scenes.aluminiumExtraction = {
    env: "chemlab", envOpts: { w: 28, d: 11, wallH: 26, shadowArea: 12 }, envI: 0.7, fov: 36, free: true, cam: [[1.4, 3.0, 7.4], [0.7, 1.0, 0]],
    values: { mode: 0, I: 180, run: 1 },
    state: () => ({}),
    get controls() { return [{ type: "select", key: "mode", label: "Metal", options: AMODES.map((m, i) => ({ value: i, label: m })) }, { type: "range", key: "I", label: "Cell current (kA)", min: 50, max: 350, step: 10 }, { type: "toggle", key: "run", label: "Run (1 s on screen = 1 hour)" }, { type: "button", label: "Siphon off the molten metal", action: (S, s) => { s.tap = 1; s.tapT = 0; } }, { type: "button", label: "Replace the anodes / restart", cls: "secondary", action: (S, s) => { restartAl(s); } }]; },
    views: [{ label: "Cell (cut-away)", cam: [[1.4, 3.0, 7.4], [0.7, 1.0, 0]] }, { label: "Close", cam: [[0.6, 1.8, 4.0], [0.2, 0.9, 0]] }],
    note: "Aluminium is too reactive to be extracted by carbon, so purified alumina (Al₂O₃ from bauxite) is electrolysed. Alumina melts at 2050 °C, so it is dissolved in molten cryolite, Na₃AlF₆, which lowers the operating temperature to about 950 °C and conducts well. Cathode (carbon lining): Al³⁺ + 3e⁻ → Al (molten aluminium collects at the bottom and is siphoned off). Anode (carbon blocks): 2O²⁻ → O₂ + 4e⁻; the hot oxygen burns the carbon, C + O₂ → CO₂, so the anodes must be replaced regularly. Mass deposited m = I·t·M/(z·F) with z = 3. The process uses huge amounts of electricity (about 14 kWh per kg), which is why smelters (VALCO, Tema) are sited near hydroelectric power (Akosombo). Tin is obtained by heating cassiterite (SnO₂) with coke/charcoal in a furnace: SnO₂ + 2C → Sn + 2CO (Jos Plateau, Nigeria).",
    onChange(S, s, c, key) { if (key === "mode") restartAl(s); },
    reset(S, s, c) { Object.assign(c, { mode: 0, I: 180, run: 1 }); restartAl(s); },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(10, 0.06, 4, M.matte(0x8a8580, 0.8), 0.4, 0, 0).receiveShadow = true;
      const gA = (s.gA = new T.Group()); sc.add(gA); const W = 3.0, D = 1.6, Hh = 1.0; const steel = new T.MeshPhysicalMaterial({ color: 0x4a4f56, metalness: 0.8, roughness: 0.5 });
      [[0, -D / 2, W, 0.08, Hh], [-W / 2, 0, 0.08, D, Hh], [W / 2, 0, 0.08, D, Hh]].forEach(([x, z, w, d, h]) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), steel); m.position.set(x, h / 2, z); m.castShadow = m.receiveShadow = true; gA.add(m); });
      const bot = new T.Mesh(new T.BoxGeometry(W, 0.12, D), steel); bot.position.y = 0.06; gA.add(bot); const lin = new T.Mesh(new T.BoxGeometry(W - 0.16, 0.2, D - 0.12), new T.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.7, map: G.noiseTex([30, 30, 32], 20) })); lin.position.y = 0.22; gA.add(lin);
      [-1, 1].forEach((k) => { const r = new T.Mesh(new T.BoxGeometry(0.1, 0.06, D + 0.4), M.copper()); r.position.set(k * 0.9, 0.18, 0); gA.add(r); });
      s.al = new T.Mesh(new T.BoxGeometry(W - 0.18, 0.12, D - 0.14), new T.MeshPhysicalMaterial({ color: 0xd8dde2, metalness: 1, roughness: 0.12, emissive: 0x401808, emissiveIntensity: 0.4 })); s.al.position.y = 0.38; gA.add(s.al);
      s.elec = new T.Mesh(new T.BoxGeometry(W - 0.18, 0.36, D - 0.14), new T.MeshStandardMaterial({ color: 0x401008, emissive: 0xff6a18, emissiveIntensity: 1.3, transparent: true, opacity: 0.85, roughness: 0.4 })); s.elec.position.y = 0.62; gA.add(s.elec);
      const crust = new T.Mesh(new T.BoxGeometry(W - 0.18, 0.05, D - 0.14), new T.MeshStandardMaterial({ color: 0xd8d2c4, map: G.noiseTex([216, 210, 196], 30), roughness: 1 })); crust.position.y = 0.83; gA.add(crust);
      s.anodes = []; for (let i = 0; i < 4; i++) { const an = new T.Mesh(new T.BoxGeometry(0.55, 0.5, 0.9), new T.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.85, map: G.noiseTex([46, 46, 48], 20) })); an.position.set(-1.05 + i * 0.7, 0.85, 0); an.castShadow = true; gA.add(an); const rod = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.0, 12), M.copper()); rod.position.set(an.position.x, 1.6, 0); gA.add(rod); s.anodes.push({ an, rod }); }
      const bus = new T.Mesh(new T.BoxGeometry(3.0, 0.14, 0.18), M.copper()); bus.position.set(0, 2.1, 0); bus.castShadow = true; gA.add(bus);
      s.bub = []; for (let i = 0; i < 40; i++) { const b = new T.Mesh(new T.SphereGeometry(0.03, 8, 6), new T.MeshBasicMaterial({ color: 0xffd8a0, transparent: true, opacity: 0.6 })); gA.add(b); s.bub.push({ b, y: Math.random(), x: rnd(-1.3, 1.3), z: rnd(-0.35, 0.35) }); }
      s.cellL = new T.PointLight(0xff7a20, 5, 6, 1.5); s.cellL.position.set(0, 1.2, 1.2); gA.add(s.cellL);
      s.ladle = new T.Group(); const lv = new T.Mesh(new T.CylinderGeometry(0.3, 0.24, 0.5, 32, 1, true), steel); lv.material.side = T.DoubleSide; lv.position.y = 0.25; s.ladle.add(lv); s.ladleAl = new T.Mesh(new T.CylinderGeometry(0.28, 0.26, 0.02, 32), s.al.material); s.ladle.add(s.ladleAl); s.ladle.position.set(2.2, 0.03, 0.9); gA.add(s.ladle);
      s.siphon = S.mk.tube([V3(1.2, 0.4, 0.4), V3(1.3, 1.3, 0.5), V3(1.9, 1.4, 0.8), V3(2.2, 0.55, 0.9)], 0.04, steel, 40); sc.remove(s.siphon); gA.add(s.siphon);
      /* tin furnace */
      const gT = (s.gT = new T.Group()); sc.add(gT); const brick = new T.MeshStandardMaterial({ color: 0xffffff, map: (() => { const cc = U.cv(256, 256), g = cc.getContext("2d"); g.fillStyle = "#8a4a2a"; g.fillRect(0, 0, 256, 256); g.strokeStyle = "#d8c8b0"; g.lineWidth = 3; for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); for (let x = (y / 32) % 2 ? 0 : 32; x < 256; x += 64) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } } const t = new T.CanvasTexture(cc); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(2, 1); t.colorSpace = T.SRGBColorSpace; return t; })(), roughness: 0.95 });
      [[0, -0.8, 2.6, 0.2, 1.2], [-1.3, 0, 0.2, 1.6, 1.2], [1.3, 0, 0.2, 1.6, 1.2]].forEach(([x, z, w, d, h]) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), brick); m.position.set(x, h / 2, z); m.castShadow = true; gT.add(m); });
      const arch = new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 1.6, 32, 1, true, -Math.PI / 2, Math.PI), brick); arch.material.side = T.DoubleSide; arch.rotation.x = Math.PI / 2; arch.rotation.z = Math.PI / 2; arch.position.set(0, 1.2, 0); arch.scale.set(1, 1, 0.4); gT.add(arch);
      s.charge = G.crystals(120, "lump", [60, 40, 30], 1.2, { mat: new T.MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.9, emissive: new T.Color(1, 0.4, 0.08), emissiveIntensity: 0.6 }) }); s.charge.layout((i) => ({ x: rnd(-1.1, 1.1), y: 0.15 + Math.random() * 0.2, z: rnd(-0.6, 0.6), rx: i, ry: i, s: rnd(0.6, 1.2) })); gT.add(s.charge);
      s.tin = new T.Mesh(new T.BoxGeometry(2.3, 0.04, 1.3), new T.MeshPhysicalMaterial({ color: 0xe8ecef, metalness: 1, roughness: 0.1 })); s.tin.position.y = 0.12; gT.add(s.tin); s.tinL = new T.PointLight(0xff8a30, 6, 5, 1.5); s.tinL.position.set(0, 0.8, 1.0); gT.add(s.tinL);
      s.ingots = []; for (let i = 0; i < 4; i++) { const ig = S.mk.rbox(0.34, 0.1, 0.16, 0.01, new T.MeshPhysicalMaterial({ color: 0xdfe4e8, metalness: 1, roughness: 0.2 })); sc.remove(ig); ig.position.set(1.8 + (i % 2) * 0.38, 0.05 + Math.floor(i / 2) * 0.1, 1.0); gT.add(ig); s.ingots.push(ig); }
      restartAl(s);
    },
    update(S, s, c, dt) {
      const m = c.mode | 0, t = S.t; s.gA.visible = m === 0; s.gT.visible = m === 1; const run = c.run && dt > 0;
      if (m === 0) { if (run) { s.hours += dt; s.mass += (c.I * 1000 * 3600 * dt * 26.98 / (3 * F)) / 1000; s.anodeUse = s.mass * 0.42; } const lvl = clamp(0.12 + s.mass / 9000 * 0.5 - s.tapped, 0.05, 0.3); s.al.scale.y = lvl / 0.12; s.al.position.y = 0.32 + lvl / 2;
        const ah = Math.max(0.15, 0.5 - s.anodeUse / 3000 * 0.35); s.anodes.forEach((a, i) => { a.an.scale.y = ah / 0.5; a.an.position.y = 0.6 + ah / 2; a.rod.position.y = 0.6 + ah + 0.5; a.rod.scale.y = (2.1 - (0.6 + ah)) / 1.0; a.rod.position.y = (2.1 + 0.6 + ah) / 2; });
        s.elec.material.emissiveIntensity = 1.1 + 0.25 * Math.sin(t * 7) * 0.3 + c.I / 600; s.bub.forEach((q) => { q.y = (q.y + dt * (0.3 + c.I / 600)) % 1; q.b.position.set(q.x, 0.45 + q.y * 0.36, q.z); q.b.visible = !!c.run; });
        if (s.tap) { s.tapT += dt; if (s.tapT < 3) { const d = Math.min(dt * 0.05, Math.max(0, 0.12 + s.mass / 9000 * 0.5 - s.tapped - 0.08)); s.tapped += d; s.ladleFill = Math.min(1, s.ladleFill + d * 6); } else s.tap = 0; } s.ladleAl.position.y = 0.03 + 0.44 * s.ladleFill; s.ladleAl.visible = s.ladleFill > 0.01; s.siphon.visible = !!s.tap; }
      else { if (run) s.hours += dt; const k = clamp(s.hours / 20, 0, 1); s.charge.scale.y = 1; s.charge.material.emissiveIntensity = 0.5 + 0.3 * Math.sin(t * 3); s.tin.scale.y = 0.5 + 3 * k; s.ingots.forEach((ig, i) => { ig.visible = k > (i + 1) * 0.22; }); s.tinL.intensity = 5 + Math.sin(t * 9) * 0.6; }
    },
    overlay(ctx, s, c, w, h, S) {
      const m = c.mode | 0, px = w - 250; ctx.save();
      if (m === 0) { G.titles(ctx, "Hall–Héroult cell (cut-away)", "Al₂O₃ dissolved in molten cryolite Na₃AlF₆ at ≈ 950 °C");
        G.tag(ctx, S, V3(0, 2.35, 0), "busbar (+) → carbon anodes", "#ffd27a", 8.5); G.tag(ctx, S, V3(-1.2, 0.62, 0.9), "molten electrolyte", "#ff9d6a", 8.5); G.tag(ctx, S, V3(0.4, 0.38, 0.9), "molten aluminium", "#e8f0ff", 8.5); G.tag(ctx, S, V3(-1.3, 0.12, 0.95), "carbon cathode lining (−)", "#cfe0f5", 8);
        const Q = c.I * 1000 * 3600; G.panel(ctx, px, 58, 240, "Electrolysis", ["cathode (−): Al³⁺ + 3e⁻ → Al(l)", "anode (+): 2O²⁻ → O₂ + 4e⁻,  then C + O₂ → CO₂", "per hour: m = I t M / (3F) = " + c.I + "000 × 3600 × 27 / (3 × 96 485) = " + (Q * 26.98 / (3 * F) / 1000).toFixed(0) + " kg", ["after " + s.hours.toFixed(1) + " h: " + Math.round(s.mass) + " kg Al;  anode carbon burnt ≈ " + Math.round(s.anodeUse) + " kg", "#ffe9b8"], "≈ 4.3 V per cell; energy ≈ 14 kWh per kg of Al"]); }
      else { G.titles(ctx, "Smelting tin ore (cassiterite)", "SnO₂(s) + 2C(s) → Sn(l) + 2CO(g)   in a reverberatory furnace ≈ 1200 °C"); G.tag(ctx, S, V3(0, 1.0, 0.7), "ore + coke/charcoal + limestone flux", "#ffd27a", 8.5); G.tag(ctx, S, V3(2.0, 0.45, 1.0), "tin ingots", "#e8f0ff", 8.5);
        G.panel(ctx, px, 58, 240, "Tin", ["ore concentrated by washing (dense SnO₂)", "roasted to remove S and As, then reduced by carbon", "slag (silicates) floats on the molten tin and is run off", ["uses: tin plate (cans), solder (Sn/Pb), bronze (Cu/Sn)", "#ffe9b8"]]); }
      ctx.restore();
    },
    readouts(s, c) { return (c.mode | 0) === 0 ? [["Current", c.I + " kA"], ["Time", s.hours.toFixed(1) + " h"], ["Aluminium made", Math.round(s.mass) + " kg"], ["Anode carbon used", Math.round(s.anodeUse) + " kg"]] : [["Time", s.hours.toFixed(1) + " h"], ["Product", "tin"]]; },
  };
  function restartAl(s) { s.hours = 0; s.mass = 0; s.anodeUse = 0; s.tap = 0; s.tapped = 0; s.ladleFill = 0; }

  /* =============================== compounds of copper =============================== */
  const CU = ["Hydrated copper(II) tetraoxosulphate(VI): heat, then add water", "Copper(II) oxide: heat copper in air, reduce with hydrogen", "Tests for Cu²⁺: NaOH(aq) and NH₃(aq)", "Copper(II) chloride solution: concentration and colour"];
  C3.scenes.copperCompounds = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.75, fov: 36, free: true, cam: [[1.4, 2.8, 7.0], [0.8, 1.4, 0]],
    values: { mode: 0, nd: 0, conc: 2 },
    state: () => ({}),
    get controls() { return [{ type: "select", key: "mode", label: "Experiment", options: CU.map((m, i) => ({ value: i, label: m })) }, { type: "button", label: "Heat / start", action: (S, s) => { s.go = 1; s.t0 = S.t; } }, { type: "button", label: "Add water (to the white powder) / pass hydrogen", action: (S, s) => { s.go2 = 1; s.t2 = S.t; } }, { type: "range", key: "nd", label: "Tests: drops of reagent added", min: 0, max: 40, step: 1 }, { type: "range", key: "conc", label: "CuCl₂ concentration (mol/dm³)", min: 0.05, max: 4, step: 0.05 }, { type: "button", label: "Start again", cls: "secondary", action: (S, s, c, ref) => { s.go = 0; s.go2 = 0; c.nd = 0; ref(); } }]; },
    views: [{ label: "Bench", cam: [[1.4, 2.8, 7.0], [0.8, 1.4, 0]] }, { label: "Close", cam: [[0.6, 2.2, 3.8], [0.3, 1.4, 0]] }],
    note: "Copper(II) tetraoxosulphate(VI) pentahydrate CuSO₄·5H₂O is blue; on heating it loses its water of crystallisation and becomes white anhydrous CuSO₄; adding water turns it blue again with a lot of heat (a test for water). Copper heated in air forms a black coat of copper(II) oxide, 2Cu + O₂ → 2CuO; CuO is reduced back to pink-brown copper by hydrogen (CuO + H₂ → Cu + H₂O), carbon or ammonia. Cu²⁺(aq) gives a pale-blue precipitate of Cu(OH)₂ with NaOH(aq), insoluble in excess (and turning black CuO on boiling); with NH₃(aq) the same precipitate dissolves in excess to give a deep-blue solution of [Cu(NH₃)₄]²⁺. Concentrated copper(II) chloride is green (CuCl₄²⁻) and turns blue on dilution ([Cu(H₂O)₆]²⁺).",
    onChange(S, s, c, key) { if (key === "mode") { s.go = 0; s.go2 = 0; c.nd = 0; } },
    reset(S, s, c) { Object.assign(c, { mode: 0, nd: 0, conc: 2 }); s.go = 0; s.go2 = 0; },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(10, 0.06, 3.8, M.matte(0xb69a76, 0.62), 0.4, 0, 0).receiveShadow = true;
      /* (0) heating hydrated CuSO4 */
      const g0 = (s.g0 = new T.Group()); sc.add(g0); const st = K.retort({ x: -0.9, z: -0.6, h: 50 }); sc.remove(st); g0.add(st); const bt = K.vessel(G.DEFS.boilingtube, { noAdd: true }); bt.group.rotation.z = -(Math.PI / 2 - 0.3); bt.group.position.set(-0.6, 2.35, 0); g0.add(bt.group); const ca = K.clampArm(st, 2.6 / CM, -0.2, 0, 1.2); sc.remove(ca); g0.add(ca);
      s.cs = G.heap(0.95, 0.9, [40, 110, 220]); s.cs.position.y = 0.4 * CM; bt.group.add(s.cs); s.cs.material.map = null; s.bn0 = K.bunsen({ x: -0.45, z: 0 }); sc.remove(s.bn0); g0.add(s.bn0);
      s.drip = G.crystals(16, "lump", [220, 236, 248], 0.12, { op: 0.6 }); bt.group.add(s.drip); s.drip.layout((i) => ({ x: rnd(-0.8, 0.8) * CM, y: (11 + rnd(0, 3)) * CM, z: rnd(-0.8, 0.8) * CM, s: rnd(0.6, 1.2) }));
      const dish = K.vessel(G.DEFS.dish, { noAdd: true }); G.opaque(dish, M.ceramic(0xf3f0e8)); dish.group.position.set(1.8, 0.03, 0.5); g0.add(dish.group); s.wh = G.heap(3.2, 1.2, [250, 250, 248]); s.wh.position.y = 0.4 * CM; dish.group.add(s.wh); s.wh.material.map = null;
      s.dropper = new T.Group(); const dg = G.glassTube(S, K, [V3(0, 0, 0), V3(0, 0.5, 0)], 0.2, 0.2); sc.remove(dg); s.dropper.add(dg); const bl = new T.Mesh(new T.SphereGeometry(0.06, 16, 12), M.rubber()); bl.material.color.setHex(0xb03a1a); bl.scale.y = 1.6; bl.position.y = 0.55; s.dropper.add(bl); s.dropper.position.set(1.8, 0.75, 0.5); g0.add(s.dropper); s.drops = K.drops({ color: 0xcfe8f5 });
      /* (1) copper oxide: foil in tongs, then combustion tube with H2 */
      const g1 = (s.g1 = new T.Group()); sc.add(g1); s.foil = new T.Mesh(new T.BoxGeometry(0.5, 0.01, 0.3), new T.MeshPhysicalMaterial({ color: 0xd87a4a, metalness: 1, roughness: 0.25 })); s.foil.position.set(-1.6, 2.35, 0); g1.add(s.foil); s.tg1 = G.tongs(S, [-1.85, 2.35, 0], [-1, 0.2, 0.4], 20); sc.remove(s.tg1); g1.add(s.tg1); s.bn1 = K.bunsen({ x: -1.6, z: 0 }); sc.remove(s.bn1); g1.add(s.bn1);
      const ct = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 2.2, 32, 1, true), K.glassMat({ opacity: 0.12, env: 3 })); ct.rotation.z = Math.PI / 2; ct.position.set(1.0, 1.9, 0); ct.renderOrder = 4; g1.add(ct); const boat = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.5, 20, 1, true, Math.PI / 2, Math.PI), M.ceramic(0xf2efe6)); boat.material.side = T.DoubleSide; boat.rotation.z = Math.PI / 2; boat.position.set(1.0, 1.85, 0); g1.add(boat);
      s.cuoP = new T.Mesh(new T.BoxGeometry(0.46, 0.04, 0.12), new T.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.9, map: G.noiseTex([28, 28, 30], 20) })); s.cuoP.position.set(1.0, 1.82, 0); g1.add(s.cuoP); s.bn1b = K.bunsen({ x: 1.0, z: 0 }); sc.remove(s.bn1b); s.bn1b.position.y = -0.3; g1.add(s.bn1b);
      s.h2F = K.flame({ h: 1.4, r: 0.3 }); s.h2F.set(0.95, 1); s.h2F.group.rotation.z = -Math.PI / 2; s.h2F.group.position.set(2.15, 1.9, 0); g1.add(s.h2F.group); const kip = K.bottle({ label: "H₂", sub: "dry hydrogen", color: 0xbfd8e8 }); sc.remove(kip); kip.position.set(-0.4, 0, -0.6); g1.add(kip); const hp = G.glassTube(S, K, [V3(-0.4, 1.0, -0.6), V3(-0.3, 1.9, -0.3), V3(-0.1, 1.9, 0)], 0.25, 0.14); sc.remove(hp); g1.add(hp);
      s.wdrop = G.crystals(12, "lump", [220, 236, 248], 0.1, { op: 0.6 }); g1.add(s.wdrop); s.wdrop.layout((i) => ({ x: 1.6 + rnd(0, 0.4), y: 1.78 + rnd(0, 0.05), z: rnd(-0.08, 0.08), s: rnd(0.6, 1.2) }));
      /* (2) Cu2+ tests */
      const g2 = (s.g2 = new T.Group()); sc.add(g2); const rack = S.mk.rbox(1.6, 0.62, 0.5, 0.03, M.wood(), 0.4, 0.31, 0.3); sc.remove(rack); g2.add(rack); s.tt = [0, 1].map((i) => { const v = K.vessel("testtube", { noAdd: true }); v.group.position.set(0.0 + i * 0.8, 0.62, 0.3); g2.add(v.group); const L = v.addLiquid({ color: [90, 160, 230], opacity: 0.4 }); L.setVolume(6); const P = K.precipitate(v, L, { color: 0x86c0f0, n: 900, size: 0.03 }); return { v, L, P }; });
      [["NaOH(aq)", -1.0], ["NH₃(aq)", -1.7]].forEach(([l, x]) => { const b = K.bottle({ label: l, sub: "2 mol/dm³" }); sc.remove(b); b.scale.setScalar(0.8); b.position.set(x, 0, -0.5); g2.add(b); });
      /* (3) CuCl2 dilution */
      const g3 = (s.g3 = new T.Group()); sc.add(g3); s.bk3 = [0, 1, 2].map((i) => { const b = K.beaker({ noAdd: true }); b.group.position.set(-0.4 + i * 1.1, 0, 0); g3.add(b.group); const L = b.addLiquid({ color: [60, 160, 120], opacity: 0.6 }); L.setVolume(100); return { b, L }; });
      s.go = 0; s.go2 = 0;
    },
    update(S, s, c, dt) {
      const m = c.mode | 0, t = S.t, el = s.go ? t - s.t0 : 0, el2 = s.go2 ? t - s.t2 : 0; [s.g0, s.g1, s.g2, s.g3].forEach((g, i) => { g.visible = i === m; });
      if (m === 0) { const k = G.smooth(0.5, 7, el); s.bn0.setGas(s.go && k < 1 ? 1 : 0); s.bn0.flame.update(t); s.cs.material.color.copy(G.col(G.mix([40, 110, 220], [246, 246, 244], k))); s.drip.visible = k > 0.15; s.drip.scale.setScalar(1);
        const k2 = G.smooth(0.3, 2.5, el2); s.wh.material.color.copy(G.col(G.mix([250, 250, 248], [40, 110, 220], k2))); s.dropper.visible = s.go2 && el2 < 3; if (s.go2 && el2 < 2.2) { s.dT = (s.dT || 0) + dt; if (s.dT > 0.4) { s.dT = 0; s.drops.emit(1.8, 0.73, 0.5, 0.15, 0.03); } } s.drops.update(dt); if (s.go2 && el2 > 0.5 && el2 < 4) { s.wT = (s.wT || 0) + dt; if (s.wT > 0.3) { s.wT = 0; G.wisp(S, 1.8, 0.3, 0.5, 0xf4f6f8, { op: 0.2 }); } } }
      else if (m === 1) { const k = G.smooth(0.5, 5, el); s.bn1.setGas(s.go ? 1 : 0); s.bn1.flame.update(t); s.foil.material.color.copy(G.col(G.mix([216, 122, 74], [26, 24, 24], k))); s.foil.material.metalness = 1 - 0.7 * k; s.foil.material.roughness = 0.25 + 0.6 * k;
        const k2 = G.smooth(1.5, 6, el2); s.bn1b.setGas(s.go2 && el2 > 1 ? 1 : 0); s.bn1b.flame.update(t); s.h2F.set(0.95, s.go2 ? 0.8 : 0); s.h2F.update(t); s.cuoP.material.color.copy(G.col(G.mix([26, 26, 28], [196, 110, 70], k2))); s.cuoP.material.metalness = 0.8 * k2; s.wdrop.visible = k2 > 0.3; }
      else if (m === 2) { const n = c.nd; s.tt.forEach((q, i) => { const ppt = n <= 0 ? 0 : i === 0 ? clamp(n / 8, 0, 1) : clamp(n / 8, 0, 1) * (1 - clamp((n - 12) / 14, 0, 1)); const deep = i === 1 ? clamp((n - 12) / 14, 0, 1) : 0; q.P.amount = ppt * 0.8; q.L.setColor(G.mix([90, 160, 230], [20, 40, 170], deep), 0.4 + 0.45 * deep); q.L.setVolume(6 + n * 0.05); q.P.update(dt); q.L.update(t); }); }
      else { s.bk3.forEach((q, i) => { const cc = c.conc / Math.pow(4, i), g = clamp(Math.log10(cc / 0.3) / 1.2, 0, 1); q.L.setColor(G.mix([70, 140, 225], [60, 160, 90], g), 0.25 + 0.5 * clamp(cc / 2, 0.1, 1)); q.L.update(t); }); }
    },
    overlay(ctx, s, c, w, h, S) {
      const m = c.mode | 0, px = w - 250; ctx.save(); G.titles(ctx, CU[m], ["CuSO₄·5H₂O(s) ⇌ CuSO₄(s) + 5H₂O(g)", "2Cu + O₂ → 2CuO;   CuO + H₂ → Cu + H₂O", "Cu²⁺(aq) + 2OH⁻(aq) → Cu(OH)₂(s)", "[CuCl₄]²⁻ (green) + 6H₂O ⇌ [Cu(H₂O)₆]²⁺ (blue) + 4Cl⁻"][m]);
      let rows; if (m === 0) rows = [s.go ? "blue crystals → WHITE powder; water condenses near the mouth of the tube" : "heat the blue crystals", s.go2 ? ["white powder + water → BLUE again; the dish gets hot (exothermic)", "#8dffb8"] : "then add water to the white powder in the dish", "used as a test for water"];
      else if (m === 1) rows = [s.go ? "pink-brown copper becomes coated with BLACK copper(II) oxide" : "heat the copper foil in the flame", s.go2 ? ["hydrogen over hot CuO: black → pink-brown copper; water droplets form; excess H₂ burns at the end", "#8dffb8"] : "pass dry hydrogen over heated CuO (light the excess at the end only after air is swept out)", "CuO is a basic oxide: CuO + H₂SO₄ → CuSO₄ + H₂O"];
      else if (m === 2) { const n = c.nd; rows = ["NaOH: " + (n === 0 ? "—" : "pale blue precipitate of Cu(OH)₂; insoluble in excess"), "NH₃: " + (n === 0 ? "—" : n < 12 ? "pale blue precipitate of Cu(OH)₂" : "precipitate dissolves → DEEP BLUE solution, [Cu(NH₃)₄]²⁺"), ["Cu(OH)₂ + 4NH₃ → [Cu(NH₃)₄]²⁺ + 2OH⁻", "#ffe9b8"], "boiling Cu(OH)₂ gives black CuO"]; G.tag(ctx, S, V3(0, 3.3, 0.3), "+ NaOH", "#cfe0f5", 8.5); G.tag(ctx, S, V3(0.8, 3.3, 0.3), "+ NH₃", "#cfe0f5", 8.5); }
      else { rows = ["beakers: " + c.conc.toFixed(2) + ", " + (c.conc / 4).toFixed(2) + ", " + (c.conc / 16).toFixed(3) + " mol/dm³", "concentrated: green (chloro complex)", "dilute: blue (aqua complex)", "electrolysis of CuCl₂(aq) gives Cu at the cathode and Cl₂ at the anode"]; }
      G.panel(ctx, px, 58, 240, "Observations", rows); ctx.restore();
    },
    readouts(s, c) { return [["Experiment", CU[c.mode | 0]]]; },
  };

  /* =============================== iodometric titration =============================== */
  const IOD = [
    { n: "Standardise Na₂S₂O₃ with KIO₃ (+ excess KI, acid)", c0: 0.0167, ratio: 3, eq: "IO₃⁻ + 5I⁻ + 6H⁺ → 3I₂ + 3H₂O", per: "1 IO₃⁻ → 3 I₂ → 6 S₂O₃²⁻", a: "IO₃⁻", ppt: false },
    { n: "Copper(II) in CuSO₄ (+ excess KI)", c0: 0.1, ratio: 0.5, eq: "2Cu²⁺ + 4I⁻ → 2CuI(s) + I₂", per: "2 Cu²⁺ → 1 I₂ → 2 S₂O₃²⁻", a: "Cu²⁺", ppt: true },
    { n: "Chlorine bleach, NaOCl (+ excess KI, acid)", c0: 0.05, ratio: 1, eq: "OCl⁻ + 2I⁻ + 2H⁺ → I₂ + Cl⁻ + H₂O", per: "1 OCl⁻ → 1 I₂ → 2 S₂O₃²⁻", a: "OCl⁻", ppt: false },
  ];
  const CTH = 0.1;
  C3.scenes.iodometric = {
    env: "chemlab", envOpts: { w: 30, d: 11, wallH: 30, shadowArea: 12 }, envI: 0.75, fov: 38, free: false, cam: [[4.6, 4.6, 12.8], [1.4, 3.7, 0]],
    values: { cs: 0, ca: 0.0167, tap: 0, swirl: 1 },
    state: () => ({ recs: [] }),
    get controls() {
      return [{ type: "select", key: "cs", label: "Titration (25.0 cm³ in the flask)", options: IOD.map((m, i) => ({ value: i, label: m.n })) }, { type: "range", key: "ca", label: "Concentration of the analyte (mol/dm³)", min: 0.01, max: 0.12, step: 0.0005 }]
        .concat(G.rigControls()).concat([{ type: "button", label: "Add 1 cm³ of starch solution", action: (S, s) => { s.starch = 1; s.starchAt = s.V; } }, { type: "button", label: "Record the end point", action: (S, s) => { s.recs.push(s.V); } }, { type: "button", label: "Refill burette and new flask", cls: "secondary", action: (S, s, c, ref) => { c.tap = 0; restartIO(s); ref(); } }]);
    },
    views: null,
    note: "Iodometric titration: an oxidising agent liberates iodine from excess potassium iodide, and the iodine is titrated with standard sodium thiosulphate: I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻. The brown iodine colour fades to pale straw-yellow; then starch is added, giving an intense blue-black colour with the remaining iodine, and the titration is continued until the blue-black colour just disappears (end point). Starch is added near the end, not at the start, because a large amount of iodine forms a starch complex that releases iodine only slowly. In the copper determination the white CuI precipitate makes the mixture look creamy at the end point.",
    onChange(S, s, c, key) { if (key === "cs") c.ca = IOD[c.cs | 0].c0; if (key !== "tap" && key !== "swirl") { c.tap = 0; restartIO(s); } },
    reset(S, s, c) { Object.assign(c, { cs: 0, ca: 0.0167, tap: 0, swirl: 1 }); restartIO(s); },
    build(S, s, c) { const K = C3.kit(S); s.K = K; s.rig = G.titr(S, K, s, {}); s.cui = K.precipitate(s.flask, s.flL, { color: 0xf2ead8, n: 1200, size: 0.03 }); [[-4.7, -3.7, "Na₂S₂O₃"], [-3.3, -3.7, "KI"], [8, -3.7, "starch"]].forEach(([x, z, l]) => { const b = K.bottle({ label: l, sub: l === "Na₂S₂O₃" ? "0.100 mol/dm³" : "" }); b.position.set(x, 0, z); }); restartIO(s); },
    update(S, s, c, dt) {
      const X = IOD[c.cs | 0]; s.rig.update(c, dt, S.t); const nI2 = c.ca * 25 / 1000 * X.ratio, nT = CTH * s.V / 1000, left = Math.max(0, nI2 - nT / 2), conc = left / ((25 + 10 + s.V) / 1000); s.Ve = nI2 * 2 / CTH * 1000; s.conc = conc;
      let rgb, op; const brown = clamp(Math.log10(conc / 2e-5 + 1) / 2.2, 0, 1); rgb = brown < 0.35 ? G.mix([240, 240, 232], [238, 216, 110], brown / 0.35) : G.mix([238, 216, 110], [150, 60, 14], (brown - 0.35) / 0.65); op = 0.2 + 0.65 * brown;
      if (s.starch) { const bb = clamp(Math.log10(conc / 1e-6 + 1) / 1.6, 0, 1); rgb = G.mix(rgb, [16, 18, 62], bb); op = Math.max(op, 0.2 + 0.7 * bb); }
      if (X.ppt) { s.cui.amount = 0.55; rgb = G.mix(rgb, [242, 234, 216], 0.35); op = Math.max(op, 0.45); } else s.cui.amount = 0; s.cui.update(dt);
      s.flL.setColor(rgb, op); s.flL.setVolume(35 + s.V); if (s.V - s.lastH >= 0.2) { s.hist.push([s.V, conc * 1e3]); s.lastH = s.V; }
    },
    overlay(ctx, s, c, w, h, S) {
      const X = IOD[c.cs | 0], px = w - 250; ctx.save(); G.titles(ctx, "Iodine–thiosulphate titration", X.eq + "     then I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻");
      const xm = Math.max(10, Math.ceil(s.Ve * 1.4 / 5) * 5), ym = Math.max(0.5, (c.ca * 25 / 1000 * X.ratio) / 0.035 * 1e3 * 1.05); H.graph(ctx, px, 58, 240, 120, { series: [{ pts: s.hist, color: "#ffb35c" }], xmin: 0, xmax: xm, ymin: 0, ymax: ym, xl: "V(S₂O₃²⁻) / cm³", yl: "[I₂] / mmol dm⁻³", dot: [s.V, s.conc * 1e3, "#ffd27a"] });
      const r = s.recs, rows = ["mole ratio: " + X.per]; if (r.length) { const v = r[r.length - 1], nT = CTH * v / 1000, nI2 = nT / 2, na = nI2 / X.ratio; rows.push("titre " + v.toFixed(2) + " cm³ → n(S₂O₃²⁻) = " + (nT * 1000).toFixed(3) + " mmol", "n(I₂) = " + (nI2 * 1000).toFixed(3) + " mmol → n(" + X.a + ") = " + (na * 1000).toFixed(3) + " mmol", ["c(" + X.a + ") = " + (na / 0.025).toFixed(4) + " mol/dm³", "#8dffb8"]); }
      if (s.starch && s.starchAt < s.Ve * 0.7) rows.push(["starch was added too early: end point may be sluggish", "#ff9d8a"]); G.panel(ctx, px, 184, 240, "Results", rows);
      const cl = s.conc; const st = !s.starch ? (cl > 4e-4 ? "brown: plenty of iodine left" : cl > 2e-6 ? "pale straw-yellow: add starch now" : "colourless — add starch to check") : (cl > 2e-6 ? "blue-black: iodine still present" : "END POINT: blue-black colour just disappeared");
      G.status(ctx, st, st.startsWith("END") ? "ok" : st.startsWith("pale") ? "info" : "info"); G.foot(ctx, "burette: 0.100 mol/dm³ Na₂S₂O₃ (colourless)", "#cfe8ff"); ctx.restore();
    },
    readouts(s, c) { return [["Burette reading", s.V.toFixed(2) + " cm³"], ["[I₂] left", (s.conc * 1000).toFixed(3) + " mmol/dm³"], ["Starch", s.starch ? "added" : "not yet"], ["Expected end point", s.Ve.toFixed(2) + " cm³"]]; },
    steps(s) { return [["Pipette 25.0 cm³ of the oxidant; add excess KI (and acid)", "done"], ["Titrate the brown iodine with thiosulphate", s.conc > 2e-4 ? "now" : "done"], ["At pale straw colour add starch (blue-black)", s.starch ? "done" : s.conc <= 2e-4 ? "now" : ""], ["Continue drop by drop until the blue-black just disappears", s.recs.length ? "done" : s.starch ? "now" : ""]]; },
  };
  C3.scenes.iodometric.views = G.rigViews;
  function restartIO(s) { s.V = 0; s.hang = 0; s.starch = 0; s.starchAt = 0; s.recs = []; s.hist = [[0, 0]]; s.lastH = 0; s.Ve = 0; s.conc = 0; if (s.bur) s.bur.setReading(0); if (s.hist) s.hist = []; }
})();
