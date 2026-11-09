/* c3d-g6.js — chemistry 3D gap scenes: local biotechnology (bread, palm wine → local gin, gari) and tests on plastics (thermoplastic vs thermosetting) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready || !C3.gx) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, G = C3.gx, CM = C3.CM, TAU = Math.PI * 2;
  const { clamp, lerp } = G, rnd = U.rnd;

  /* lumpy organic blob (dough, cassava mash) */
  function blob(r, rgb, rough, n) { const g = new T.IcosahedronGeometry(r, 5), p = g.attributes.position, v = V3(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + 0.06 * Math.sin(v.x * 9 + v.y * 4) * Math.cos(v.z * 7) + 0.03 * Math.sin(v.y * 23 + v.x * 17); if (v.y < -r * 0.35) v.y = -r * 0.35 - (v.y + r * 0.35) * 0.1; v.multiplyScalar(k); p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals();
    const m = new T.Mesh(g, new T.MeshPhysicalMaterial({ color: G.col(rgb), roughness: rough == null ? 0.7 : rough, sheen: 0.4, map: G.noiseTex([240, 240, 240], 30, n || 3000) })); m.castShadow = m.receiveShadow = true; return m; }

  /* =============================== biotechnology =============================== */
  const BMODES = ["Bread: yeast fermentation makes dough rise", "Palm wine → local gin (fermentation + distillation)", "Gari from cassava (fermentation, pressing, roasting)"];
  const GARI = ["peel and wash the cassava tubers", "grate into a wet mash", "ferment in a sack for 2–3 days", "press out the liquid", "sieve the cake", "roast (garify) in a wide pan"];
  const yeastRate = (Tc) => Tc <= 0 ? 0 : Tc < 37 ? Math.pow(2, (Tc - 37) / 10) : Tc < 55 ? Math.max(0, 1 - Math.pow((Tc - 37) / 18, 2)) : 0;
  C3.scenes.biotechnology = {
    env: "chemlab", envOpts: { w: 28, d: 11, wallH: 26, shadowArea: 12 }, envI: 0.78, fov: 36, free: true, cam: [[1.6, 2.6, 6.8], [1.0, 1.0, 0]],
    values: { mode: 0, T: 35, sugar: 1, gstage: 0, run: 1 },
    state: () => ({}),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Process", options: BMODES.map((m, i) => ({ value: i, label: m })) },
        { type: "range", key: "T", label: "Bread: temperature of the dough (°C)", min: 5, max: 70, step: 1 },
        { type: "toggle", key: "sugar", label: "Bread: sugar added to the dough" },
        { type: "button", label: "Bread: bake it", action: (S, s) => { s.bake = 1; } },
        { type: "select", key: "gstage", label: "Gari: stage", options: GARI.map((m, i) => ({ value: i, label: (i + 1) + ". " + m })) },
        { type: "toggle", key: "run", label: "Run (time-lapse)" },
        { type: "button", label: "Start again", cls: "secondary", action: (S, s) => { restartB(s); } },
      ];
    },
    views: [{ label: "This process", cam: (S, s, c) => BV[c.mode | 0] }, { label: "Wide", cam: [[2.2, 3.6, 9.4], [1.2, 1.2, 0]] }],
    note: "Biotechnology uses living organisms or their enzymes to make useful products. Yeast contains the enzyme zymase, which ferments sugar anaerobically: C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂. In bread the CO₂ makes the dough rise and the ethanol is driven off on baking; yeast works best near 35–40 °C and is killed above about 55 °C. Palm sap ferments naturally to palm wine (about 4–7 % ethanol); fractional distillation of palm wine gives the local gin (akpeteshie / ogogoro, 40 % ethanol or more). In gari making, bacteria ferment grated cassava: lactic acid lowers the pH (sour taste) and the poisonous cyanogenic glucoside (linamarin) is broken down, releasing hydrogen cyanide gas, which escapes; pressing and roasting remove more of it and the water.",
    onChange(S, s, c, key) { if (key === "mode") { restartB(s); C3.setView(S, { cam: BV[c.mode | 0] }); } },
    reset(S, s, c) { Object.assign(c, { mode: 0, T: 35, sugar: 1, gstage: 0, run: 1 }); restartB(s); C3.setView(S, { cam: BV[0] }); },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(12, 0.06, 4.2, M.matte(0xb69a76, 0.62), 0.6, 0, 0).receiveShadow = true;
      /* bread */
      s.gB = new T.Group(); sc.add(s.gB); const bowl = K.vessel({ outer: [[0, 0], [2.6, 0], [4.2, 1.2], [6.2, 4.2], [7.2, 7.2]], inner: [[0, 0.4], [2.5, 0.4], [4.0, 1.5], [5.9, 4.4], [6.9, 7.2]] }, { noAdd: true }); s.gB.add(bowl.group);
      s.dough = blob(0.5, [238, 222, 186], 0.75, 5000); s.dough.position.y = 0.35; s.gB.add(s.dough); s.th = G.thermo(S, { x: 0.9, y: 0.02, z: 0.5, len: 18, min: 0, max: 80, T: 35 }); sc.remove(s.th.group); s.th.group.rotation.z = -0.5; s.gB.add(s.th.group);
      s.cloth = new T.Mesh(new T.PlaneGeometry(1.0, 0.7, 8, 6), new T.MeshStandardMaterial({ color: 0xd9e4ee, map: G.noiseTex([220, 228, 236], 18), roughness: 0.95, side: T.DoubleSide })); s.cloth.rotation.x = -Math.PI / 2; s.cloth.position.set(-1.3, 0.04, 0.6); s.gB.add(s.cloth);
      const jar = K.bottle({ label: "YEAST", sub: "Saccharomyces", color: 0xd8c09a }); sc.remove(jar); jar.scale.setScalar(0.6); jar.position.set(-1.3, 0, -0.6); s.gB.add(jar);
      /* palm wine + distillation */
      s.gP = new T.Group(); sc.add(s.gP); const pot = K.vessel({ outer: [[0, 0], [3.5, 0], [6.2, 3], [7, 7], [6.2, 11], [4, 13], [4.2, 13.6]], inner: [[0, 0.5], [3.4, 0.5], [5.9, 3.2], [6.6, 7], [5.9, 11], [3.7, 12.8], [3.9, 13.6]] }, { noAdd: true }); G.opaque(pot, new T.MeshStandardMaterial({ color: 0x8a5634, map: G.noiseTex([140, 88, 52], 30), roughness: 0.85 })); pot.group.position.set(-1.6, 0.03, 0); s.gP.add(pot.group); s.potL = pot.addLiquid({ color: [242, 240, 230], opacity: 0.85 }); s.potL.setVolume(1400); s.potB = K.bubbles(pot, s.potL, { n: 40, spread: 3 });
      s.froth = new T.Mesh(new T.CylinderGeometry(3.8 * CM, 3.8 * CM, 0.6 * CM, 32), new T.MeshStandardMaterial({ color: 0xfbfaf4, roughness: 1, map: G.noiseTex([250, 249, 242], 20, 6000) })); s.froth.position.set(-1.6, 0.03 + 12.0 * CM, 0); s.gP.add(s.froth);
      const drum = S.mk.cyl(0.42, 0.42, 1.0, new T.MeshPhysicalMaterial({ color: 0x5a5f66, metalness: 0.85, roughness: 0.55 }), 0.4, 0.95, 0); sc.remove(drum); s.gP.add(drum); const fire = []; for (let i = 0; i < 5; i++) { const lg = S.mk.cyl(0.05, 0.05, 0.8, M.matte(0x5a3a22, 0.9), 0.4 + rnd(-0.2, 0.2), 0.12, rnd(-0.2, 0.2)); sc.remove(lg); lg.rotation.z = Math.PI / 2; lg.rotation.y = i; s.gP.add(lg); }
      [-0.3, 0.3].forEach((z) => { const st = S.mk.box(0.12, 0.45, 0.12, M.matte(0x7a6a58, 0.95), 0.4, 0.22, z * 1.3); sc.remove(st); s.gP.add(st); });
      s.fireF = K.flame({ h: 6, r: 2.4 }); s.fireF.set(0.2, 1); s.fireF.group.position.set(0.4, 0.15, 0); s.gP.add(s.fireF.group);
      const pipe = S.mk.tube([V3(0.4, 1.45, 0), V3(0.4, 1.75, 0), V3(1.0, 1.85, 0), V3(1.55, 1.45, 0)], 0.04, M.copper(), 40); sc.remove(pipe); s.gP.add(pipe);
      const barrel = S.mk.cyl(0.4, 0.4, 1.1, K.glassMat({ opacity: 0.12, env: 3 }), 1.75, 0.95, 0); sc.remove(barrel); barrel.renderOrder = 4; s.gP.add(barrel); const bw = S.mk.cyl(0.38, 0.38, 0.95, K.liquidMat(G.col([170, 205, 225]), 0.25), 1.75, 0.9, 0); sc.remove(bw); bw.renderOrder = 3; s.gP.add(bw);
      const coilPts = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * TAU * 5; coilPts.push(V3(1.75 + Math.cos(a) * 0.26, 1.42 - i / 120 * 0.95, Math.sin(a) * 0.26)); } coilPts.push(V3(2.25, 0.42, 0)); const coil = S.mk.tube(coilPts, 0.025, M.copper(), 400); sc.remove(coil); s.gP.add(coil);
      const bot = K.vessel({ outer: [[0, 0], [2.2, 0], [2.4, 0.3], [2.4, 7], [1.0, 9], [0.8, 11]], inner: [[0, 0.3], [2.0, 0.3], [2.2, 0.5], [2.2, 7], [0.8, 8.9], [0.6, 11]] }, { noAdd: true }); bot.group.position.set(2.35, 0.03, 0); s.gP.add(bot.group); s.botL = bot.addLiquid({ color: [240, 240, 236], opacity: 0.18 });
      s.drops = K.drops({ color: 0xeef4f8 });
      /* gari */
      s.gG = new T.Group(); sc.add(s.gG);
      s.tubers = []; for (let i = 0; i < 4; i++) { const tb = new T.Mesh(new T.CapsuleGeometry(0.12, 0.8, 8, 16), new T.MeshStandardMaterial({ color: 0x7a4e2c, map: G.noiseTex([122, 78, 44], 40), roughness: 0.9 })); tb.rotation.z = Math.PI / 2; tb.rotation.y = i * 0.3; tb.position.set(-1.8 + i * 0.05, 0.13 + (i > 1 ? 0.2 : 0), -0.3 + (i % 2) * 0.28); tb.castShadow = true; s.gG.add(tb); s.tubers.push(tb); }
      s.peeled = new T.Mesh(new T.CapsuleGeometry(0.11, 0.7, 8, 16), new T.MeshStandardMaterial({ color: 0xf4ecd8, roughness: 0.6 })); s.peeled.rotation.z = Math.PI / 2; s.peeled.position.set(-1.0, 0.13, 0.5); s.gG.add(s.peeled);
      s.mash = blob(0.42, [242, 236, 214], 0.85, 7000); s.mash.position.set(-0.6, 0.3, 0); s.mash.scale.y = 0.6; s.gG.add(s.mash);
      s.sack = new T.Mesh(new T.CylinderGeometry(0.42, 0.48, 0.75, 24, 6), new T.MeshStandardMaterial({ color: 0xcbb68a, map: (() => { const cc = U.cv(128, 128), g = cc.getContext("2d"); g.fillStyle = "#cbb68a"; g.fillRect(0, 0, 128, 128); g.strokeStyle = "rgba(120,100,60,.6)"; for (let i = 0; i < 128; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); } const t = new T.CanvasTexture(cc); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(4, 3); t.colorSpace = T.SRGBColorSpace; return t; })(), roughness: 1 })); s.sack.position.set(0.5, 0.4, 0); s.sack.castShadow = true; s.gG.add(s.sack);
      s.plank = S.mk.box(1.2, 0.08, 0.6, M.wood(), 0.5, 0.82, 0); sc.remove(s.plank); s.gG.add(s.plank); s.stones = []; for (let i = 0; i < 3; i++) { const st = new T.Mesh(new T.IcosahedronGeometry(0.16, 1), M.matte(0x8a8580, 0.95)); st.position.set(0.2 + i * 0.3, 0.98, rnd(-0.1, 0.1)); st.castShadow = true; s.gG.add(st); s.stones.push(st); }
      s.juice = new T.Mesh(new T.CircleGeometry(0.6, 32), K.liquidMat(G.col([235, 232, 210]), 0.5)); s.juice.rotation.x = -Math.PI / 2; s.juice.position.set(0.5, 0.035, 0); s.gG.add(s.juice);
      s.pan = K.vessel({ outer: [[0, 0], [8, 0], [11, 1.5], [13, 3.6]], inner: [[0, 0.4], [8, 0.4], [10.8, 1.8], [12.6, 3.6]] }, { noAdd: true }); G.opaque(s.pan, new T.MeshPhysicalMaterial({ color: 0x2a2c30, metalness: 0.8, roughness: 0.5 })); s.pan.group.position.set(2.4, 0.42, 0); s.gG.add(s.pan.group);
      const hearth = S.mk.cyl(0.78, 0.82, 0.42, M.matte(0x8a5a3a, 0.95), 2.4, 0.21, 0); sc.remove(hearth); s.gG.add(hearth); s.hearth = hearth;
      s.gari = new T.Points(new T.BufferGeometry(), new T.PointsMaterial({ color: 0xf2e6c4, size: 0.045, map: U.softDot(32, "rgba(255,255,255,1)"), transparent: true })); s.gariN = 3500; const gp = new Float32Array(s.gariN * 3); for (let i = 0; i < s.gariN; i++) { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * 1.3; gp[i * 3] = Math.cos(a) * r; gp[i * 3 + 1] = 0.09 + Math.random() * 0.03; gp[i * 3 + 2] = Math.sin(a) * r; } s.gari.geometry.setAttribute("position", new T.BufferAttribute(gp, 3)); s.gari.position.set(2.4, 0.42, 0); s.gG.add(s.gari);
      s.paddle = S.mk.box(0.08, 0.02, 0.9, M.wood(), 2.4, 0.6, 0); sc.remove(s.paddle); s.gG.add(s.paddle); s.gFire = K.flame({ h: 4, r: 1.8 }); s.gFire.set(0.2, 1); s.gFire.group.position.set(2.4, 0.05, 0.6); s.gG.add(s.gFire.group);
      s.sieve = S.mk.torus(0.4, 0.03, M.wood(), 1.4, 0.35, 1.0); sc.remove(s.sieve); s.sieve.rotation.x = Math.PI / 2; s.gG.add(s.sieve);
      restartB(s); C3.setView(S, { cam: BV[c.mode | 0] });
    },
    update(S, s, c, dt) {
      const m = c.mode | 0, t = S.t, run = c.run && dt > 0; s.gB.visible = m === 0; s.gP.visible = m === 1; s.gG.visible = m === 2;
      if (m === 0) { const r = s.bake ? 0 : yeastRate(c.T) * (c.sugar ? 1 : 0.35); s.rate = r; if (run && !s.baked) { s.co2 += r * dt * 0.08; } if (s.bake) { s.bakeK = clamp(s.bakeK + dt * 0.3, 0, 1); if (s.bakeK >= 1) s.baked = 1; }
        const v = 1 + Math.min(1.6, s.co2) * (1 + 0.08 * s.bakeK); s.dough.scale.set(Math.cbrt(v) * 1.15, Math.cbrt(v) * 0.85, Math.cbrt(v) * 1.15); s.dough.position.y = 0.35 + (Math.cbrt(v) - 1) * 0.25; s.dough.material.color.copy(G.col(G.mix([238, 222, 186], [176, 104, 48], s.bakeK))); s.th.set(s.bake ? lerp(c.T, 70, s.bakeK) : c.T); }
      else if (m === 1) { if (run) s.day += dt * 0.6; const ferm = clamp(s.day / 4, 0, 1), alc = 6.5 * (1 - Math.exp(-s.day * 0.9)); s.alc = alc; s.potB.rate = s.day < 5 ? 14 * (1 - ferm) + 2 : 0; s.froth.visible = s.day < 4; s.potB.update(dt, t); s.potL.update(t);
        const dist = s.day > 4; s.fireF.set(0.2, dist ? 1 : 0); s.fireF.update(t); if (dist && run) { s.distilled = Math.min(1, s.distilled + dt * 0.04); } s.ginPct = clamp(48 * (1 - s.distilled * 0.6), 20, 60); s.botL.setVolume(1 + 160 * s.distilled); s.botL.update(t);
        s.dropT += dt; if (dist && s.distilled < 1 && s.dropT > 0.45) { s.dropT = 0; s.drops.emit(2.31, 0.42, 0, 0.03 + (1.2 + 6 * s.distilled) * CM, 0.022); } s.drops.update(dt); }
      else { const st = c.gstage | 0; if (run) s.gk = clamp(s.gk + dt * 0.2, 0, 1); const k = s.gk;
        s.tubers.forEach((tb, i) => { tb.visible = st === 0; tb.material.color.copy(G.col(G.mix([122, 78, 44], [244, 236, 216], st === 0 ? clamp(k * 4 - i, 0, 1) : 1))); }); s.peeled.visible = st === 0 && k > 0.3;
        s.mash.visible = st === 1 || st === 4; s.mash.scale.set(st === 4 ? 1.2 : 1, st === 4 ? 0.35 : 0.6 * (st === 1 ? clamp(k * 2, 0.1, 1) : 1), st === 4 ? 1.2 : 1); s.mash.position.x = st === 4 ? 1.4 : -0.6; s.mash.position.z = st === 4 ? 1.0 : 0; s.mash.position.y = st === 4 ? 0.3 : 0.3;
        s.sack.visible = st === 2 || st === 3; s.plank.visible = st === 3; s.stones.forEach((q) => { q.visible = st === 3; }); s.sack.scale.y = st === 3 ? lerp(1, 0.62, k) : 1; s.sack.position.y = 0.4 * s.sack.scale.y; s.plank.position.y = 0.8 * s.sack.scale.y + 0.05; s.stones.forEach((q, i) => { q.position.y = s.plank.position.y + 0.16; });
        s.juice.visible = st === 3; s.pan.group.visible = st === 5; s.hearth.visible = st === 5; s.juice.scale.setScalar(0.4 + 0.8 * k); s.sieve.visible = st === 4; s.gari.visible = st === 5; s.paddle.visible = st === 5; s.gFire.set(0.2, st === 5 ? 1 : 0); s.gFire.update(t);
        if (st === 5) { s.paddle.rotation.y = Math.sin(t * 2) * 0.8; s.paddle.position.x = 2.4 + Math.sin(t * 1.3) * 0.2; s.gari.material.color.copy(G.col(G.mix([246, 240, 222], [236, 210, 150], k))); s.gari.rotation.y += dt * 0.6 * Math.sin(t); s.steamT += dt; if (s.steamT > 0.25 && k < 0.9) { s.steamT = 0; G.wisp(S, 2.4 + rnd(-0.4, 0.4), 0.6, rnd(-0.4, 0.4), 0xf4f6f8, { op: 0.22 }); } }
        if (st === 2 && dt > 0) { s.steamT += dt; if (s.steamT > 0.6) { s.steamT = 0; S.puff(0.5 + rnd(-0.2, 0.2), 0.85, rnd(-0.2, 0.2), { n: 1, color: 0xdde8d0, speed: 0.08, up: 0.3, life: 2.4, size: 0.3, op: 0.18 }); } } }
    },
    overlay(ctx, s, c, w, h, S) {
      const m = c.mode | 0, px = w - 250; ctx.save();
      if (m === 0) { G.titles(ctx, "Bread: yeast ferments sugar", "C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂   (enzyme: zymase)"); const rows = []; for (let T2 = 5; T2 <= 70; T2 += 1) rows.push([T2, yeastRate(T2) * 100]);
        H.graph(ctx, px, 58, 240, 110, { series: [{ pts: rows, color: "#ffd27a" }], xmin: 0, xmax: 70, ymin: 0, ymax: 100, xl: "temperature / °C", yl: "yeast activity / %", dot: [c.T, yeastRate(c.T) * 100, "#ff9d8a"] });
        G.panel(ctx, px, 174, 240, "Observations", ["dough volume: × " + (1 + Math.min(1.6, s.co2)).toFixed(2), c.T > 55 ? ["yeast killed (enzymes denatured): no rising", "#ff9aa8"] : c.T < 15 ? "too cold: fermentation very slow" : "CO₂ bubbles are trapped in the gluten, so the dough rises", c.sugar ? "sugar is food for the yeast" : "little sugar: slow", s.bake ? ["baking: yeast killed, ethanol and water driven off, crust browns", "#ffe9b8"] : ""]); }
      else if (m === 1) { G.titles(ctx, s.day <= 4 ? "Palm sap ferments to palm wine" : "Distilling palm wine to local gin", s.day <= 4 ? "wild yeasts: sugars → ethanol + CO₂ (froth)" : "ethanol (b.p. 78 °C) boils off first, condenses in the cooled copper coil");
        G.tag(ctx, S, V3(-1.6, 1.0, 0), "palm wine " + s.alc.toFixed(1) + " % ethanol", "#ffe9b8", 8.5); if (s.day > 4) { G.tag(ctx, S, V3(1.75, 1.7, 0), "condenser: coil in cold water", "#9fd0ff", 8); G.tag(ctx, S, V3(2.35, 0.9, 0), "local gin ≈ " + s.ginPct.toFixed(0) + " %", "#ffe9b8", 8.5); }
        G.panel(ctx, px, 58, 240, "Process", ["day " + Math.min(4, s.day).toFixed(1) + " of fermentation", "ethanol in palm wine: " + s.alc.toFixed(1) + " %", s.day > 4 ? "distillate collected: " + Math.round(s.distilled * 100) + " %" : "next: distil when fermentation slows", ["fractional distillation separates liquids by boiling point: ethanol 78 °C, water 100 °C", "#cfe0f5"], "the first runnings contain toxic methanol and must be thrown away"]); }
      else { const st = c.gstage | 0; G.titles(ctx, "Gari from cassava — stage " + (st + 1) + ": " + GARI[st], ["", "", "lactic-acid bacteria; linamarin → glucose + HCN (gas escapes)", "removes water and dissolved cyanide", "even-sized grains", "dries the grains; they swell and turn crisp"][st]);
        const pH = st < 2 ? 6.5 : st === 2 ? lerp(6.5, 4.1, s.gk) : 4.0, hcn = st < 2 ? 120 : st === 2 ? lerp(120, 40, s.gk) : st === 3 ? lerp(40, 25, s.gk) : st === 4 ? 25 : lerp(25, 6, s.gk);
        G.panel(ctx, px, 58, 240, "Chemistry", ["pH of the mash: " + pH.toFixed(1) + (pH < 5 ? " (sour: lactic acid)" : ""), "cyanide content: ≈ " + hcn.toFixed(0) + " mg/kg (safe below 10)", "moisture: " + (st < 3 ? "≈ 60 %" : st < 5 ? "≈ 45 %" : (lerp(45, 9, s.gk)).toFixed(0) + " %"), ["fermentation is a biotechnology process: microorganisms change the food", "#cfe0f5"]]); }
      ctx.restore();
    },
    readouts(s, c) { const m = c.mode | 0; if (m === 0) return [["Temperature", c.T + " °C"], ["Yeast activity", Math.round((s.rate || 0) * 100) + " %"], ["Dough volume", "× " + (1 + Math.min(1.6, s.co2)).toFixed(2)]]; if (m === 1) return [["Day", s.day.toFixed(1)], ["Ethanol in palm wine", s.alc.toFixed(1) + " %"], ["Local gin strength", s.day > 4 ? s.ginPct.toFixed(0) + " %" : "—"]]; return [["Stage", ((c.gstage | 0) + 1) + " of 6"], ["Step", GARI[c.gstage | 0]]]; },
  };
  const BV = [[[1.6, 2.0, 5.2], [0.9, 0.6, 0]], [[2.0, 2.8, 7.4], [1.0, 1.0, 0]], [[2.4, 3.0, 7.4], [1.2, 0.5, 0]]];
  function restartB(s) { s.co2 = 0; s.bake = 0; s.bakeK = 0; s.baked = 0; s.day = 0; s.distilled = 0; s.dropT = 0; s.gk = 0; s.steamT = 0; s.alc = 0; s.ginPct = 48; }

  /* =============================== tests on plastics =============================== */
  const PL = [
    { n: "poly(ethene) — polythene bag", f: "–(CH₂–CH₂)ₙ–", type: "thermoplastic", soft: 110, burn: "melts, drips and burns with a yellow flame; smells like candle wax", solv: "unaffected", col: 0xeef2f4, op: 0.75 },
    { n: "PVC — poly(chloroethene)", f: "–(CH₂–CHCl)ₙ–", type: "thermoplastic", soft: 85, burn: "softens and chars; green-edged flame and choking HCl fumes (Cl present)", solv: "unaffected", col: 0x6c8fb8, op: 1 },
    { n: "poly(phenylethene) — polystyrene", f: "–(CH₂–CH(C₆H₅))ₙ–", type: "thermoplastic", soft: 95, burn: "melts and burns with a very sooty yellow flame", solv: "dissolves / softens in propanone", col: 0xf4f4f0, op: 1 },
    { n: "nylon", f: "–[NH(CH₂)₆NHCO(CH₂)₄CO]ₙ–", type: "thermoplastic", soft: 220, burn: "melts into beads; blue flame edged yellow; smell like burnt hair", solv: "unaffected", col: 0xf2ece0, op: 0.9 },
    { n: "Bakelite (phenol–methanal resin)", f: "cross-linked network", type: "thermosetting", soft: 9999, burn: "does not melt; chars slowly and gives off a smell of phenol", solv: "unaffected", col: 0x3a2214, op: 1 },
    { n: "melamine (urea/melamine–methanal)", f: "cross-linked network", type: "thermosetting", soft: 9999, burn: "does not soften; chars and gives ammonia-like fumes", solv: "unaffected", col: 0xf6f4ee, op: 1 },
  ];
  const TESTS = ["Heat gently over a low flame", "Hold in a hot flame", "Dilute hydrochloric acid", "Dilute sodium hydroxide", "Propanone (organic solvent)"];
  C3.scenes.plasticsTests = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.75, fov: 36, free: true, cam: [[0.9, 2.5, 7.0], [0.4, 1.4, 0]],
    values: { pl: 0, test: 0, run: 1 },
    state: () => ({}),
    get controls() {
      return [
        { type: "select", key: "pl", label: "Plastic sample", options: PL.map((m, i) => ({ value: i, label: m.n + " — " + m.type })) },
        { type: "select", key: "test", label: "Test", options: TESTS.map((m, i) => ({ value: i, label: m })) },
        { type: "toggle", key: "run", label: "Run the test" },
        { type: "button", label: "New sample", cls: "secondary", action: (S, s) => { s.k = 0; } },
      ];
    },
    views: [{ label: "Bench + chains", cam: [[0.9, 2.5, 7.0], [0.4, 1.4, 0]] }, { label: "Sample close", cam: [[0.4, 2.0, 3.0], [0.2, 1.6, 0]] }],
    note: "Thermoplastics (poly(ethene), PVC, polystyrene, nylon) are made of long separate chains held by weak intermolecular forces; on heating the chains slide past each other, so the plastic softens and can be remoulded again and again. Thermosetting plastics (Bakelite, melamine, urea–methanal) have chains cross-linked by strong covalent bonds into a rigid network; once set they cannot be softened and they char on strong heating. Most plastics are not attacked by dilute acids and alkalis, which is why they are used for containers; some dissolve in organic solvents. Burning plastics gives toxic fumes (HCl from PVC, CO, soot).",
    onChange(S, s, c, key) { s.k = 0; buildChains(S, s, c); },
    reset(S, s, c) { Object.assign(c, { pl: 0, test: 0, run: 1 }); s.k = 0; buildChains(S, s, c); },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(10, 0.06, 3.8, M.matte(0xb69a76, 0.62), 0.6, 0, 0).receiveShadow = true;
      const mat = new T.Mesh(new T.BoxGeometry(2.0, 0.04, 1.6), M.matte(0x8a8f96, 0.95)); mat.position.set(0.2, 0.02, 0); mat.receiveShadow = true; sc.add(mat);
      s.bn = K.bunsen({ x: 0.2, z: 0 }); s.tng = G.tongs(S, [-0.15, 2.45, 0], [-1, 0.1, 0.25], 24);
      s.stripGeo = new T.BoxGeometry(1.0, 0.025, 0.22, 48, 1, 4); s.stripGeo.translate(0.5, 0, 0); s.base = Float32Array.from(s.stripGeo.attributes.position.array);
      s.stripMat = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.35, clearcoat: 0.6, transparent: true }); s.strip = new T.Mesh(s.stripGeo, s.stripMat); s.strip.position.set(-0.15, 2.45, 0); s.strip.castShadow = true; sc.add(s.strip);
      s.drip = new T.Mesh(new T.SphereGeometry(0.035, 12, 10), s.stripMat); sc.add(s.drip); s.soot = [];
      s.beakers = [0, 1, 2].map((i) => { const b = K.beaker(); b.group.position.set(-1.5 + i * 0.0, 0, 0); b.group.visible = false; const L = b.addLiquid({ color: [225, 238, 246], opacity: 0.22 }); L.setVolume(90); return { b, L }; }); s.bk = s.beakers[0];
      s.sub = new T.Mesh(new T.BoxGeometry(0.8, 0.025, 0.22), s.stripMat); sc.add(s.sub);
      s.gCh = new T.Group(); s.gCh.position.set(-1.9, 1.5, -0.6); sc.add(s.gCh); const fr = new T.Mesh(new T.BoxGeometry(2.0, 1.7, 0.05), new T.MeshStandardMaterial({ color: 0x101824, roughness: 0.6, transparent: true, opacity: 0.6 })); fr.position.z = -0.5; s.gCh.add(fr);
      s.k = 0; buildChains(S, s, c);
    },
    update(S, s, c, dt) {
      const P = PL[c.pl | 0], te = c.test | 0, t = S.t, run = c.run && dt > 0; if (run) s.k = clamp(s.k + dt * 0.12, 0, 1); const k = s.k, flameTest = te <= 1;
      s.bn.visible = flameTest; s.tng.visible = flameTest; s.strip.visible = flameTest; s.bn.setAir(te === 0 ? 0.3 : 1); s.bn.setGas(flameTest && c.run ? (te === 0 ? 0.45 : 1) : 0); s.bn.flame.update(t);
      s.bk.b.group.visible = !flameTest; s.sub.visible = !flameTest; s.drip.visible = false;
      const thermo = P.type === "thermoplastic", heat = flameTest ? k * (te === 0 ? 160 : 600) + 25 : 25; s.heatT = heat;
      const soften = thermo ? clamp((heat - P.soft) / 60, 0, 1) : 0, melt = thermo && te === 1 ? clamp((heat - P.soft - 80) / 200, 0, 1) : 0, char = te === 1 ? clamp((heat - (thermo ? 300 : 250)) / 250, 0, 1) : 0; s.soften = soften; s.char = char;
      const pa = s.stripGeo.attributes.position, b = s.base; for (let i = 0; i < pa.count; i++) { const x = b[i * 3], sag = soften * 0.55 * x * x * (1 + 0.15 * Math.sin(t * 2)), shrink = 1 - melt * 0.5 * clamp((x - 0.4) / 0.6, 0, 1); pa.setXYZ(i, x * shrink, b[i * 3 + 1] - sag * (thermo ? 1 : 0), b[i * 3 + 2]); } pa.needsUpdate = true; s.stripGeo.computeVertexNormals();
      const col = new T.Color(P.col); col.lerp(new T.Color(0x1a1410), char * 0.85); s.stripMat.color.copy(col); s.stripMat.opacity = P.op; s.stripMat.roughness = lerp(0.35, 0.95, char);
      if (melt > 0.05 && melt < 0.98) { s.drip.visible = true; const ph = (t * 0.8) % 1; s.drip.position.set(-0.15 + 0.6, 2.45 - 0.35 - ph * 2.0, 0); }
      if (te === 1 && heat > 300 && dt > 0) { s.pT = (s.pT || 0) + dt; if (s.pT > 0.18) { s.pT = 0; const sooty = P.n.includes("polystyrene") || !thermo; S.puff(0.35, 2.55, 0, { n: 1, color: sooty ? 0x1a1a1a : P.n.startsWith("PVC") ? 0xd8e0d0 : 0x606060, speed: 0.1, up: 0.8, life: 1.8, size: 0.25, op: sooty ? 0.5 : 0.25 }); } if (P.n.startsWith("PVC")) s.bn.flame.tint([0.3, 1, 0.4], 0.5 * k); else s.bn.flame.tint(null, 0); } else s.bn.flame.tint(null, 0);
      if (!flameTest) { const solvent = te === 4, dis = solvent && P.n.includes("polystyrene") ? k : 0; s.bk.L.setColor(te === 2 ? [228, 238, 246] : te === 3 ? [232, 236, 240] : [236, 240, 244], 0.2); s.sub.position.set(-1.5, 0.12 + 0.6 * (1 - Math.min(1, k * 3)), 0); s.sub.rotation.z = 0.3; s.sub.scale.set(1 - dis * 0.6, 1 + dis * 3, 1 - dis * 0.3); s.sub.material.opacity = P.op * (1 - dis * 0.7); s.bk.L.update(t); }
      /* chains: thermoplastic chains slide apart when warm; thermoset network only vibrates */
      if (s.chains) s.chains.forEach((ch, i) => { const j = thermo ? soften : 0; ch.position.x = Math.sin(t * 0.8 + i) * 0.12 * j + ch.userData.x; ch.position.y = ch.userData.y + Math.cos(t * 0.7 + i * 2) * 0.05 * (0.3 + j); ch.rotation.z = Math.sin(t * 0.5 + i) * 0.1 * j; });
    },
    overlay(ctx, s, c, w, h, S) {
      const P = PL[c.pl | 0], te = c.test | 0, px = w - 250, thermo = P.type === "thermoplastic"; ctx.save(); G.titles(ctx, P.n + "   " + P.f, P.type.toUpperCase() + (thermo ? ": separate chains, weak forces between them" : ": chains cross-linked by covalent bonds"));
      let obs; if (te === 0) obs = thermo ? (s.soften > 0.2 ? "softens and bends: can be reshaped (remoulded) when warm" : "warming…") : "stays hard and rigid: does not soften";
      else if (te === 1) obs = s.heatT > 250 ? P.burn : "heating strongly…"; else if (te === 4) obs = P.solv; else obs = "no visible change: plastics resist dilute acids and alkalis";
      G.panel(ctx, px, 58, 240, TESTS[te], [["observation: " + obs, "#ffe9b8"], te <= 1 ? "sample temperature ≈ " + Math.round(s.heatT) + " °C" : "", thermo ? "thermoplastic: chains slide apart on heating" : "thermoset: rigid network, chars instead of melting", te === 1 ? ["burning plastics release toxic fumes: work in a fume cupboard", "#ff9d8a"] : ""]);
      G.tag(ctx, S, V3(-1.9, 2.5, -0.6), thermo ? "separate polymer chains" : "cross-linked network", "#9fe3ff", 8.5);
      ctx.restore();
    },
    readouts(s, c) { const P = PL[c.pl | 0]; return [["Plastic", P.n], ["Type", P.type], ["Softens on heating?", P.type === "thermoplastic" ? "yes, at about " + P.soft + " °C" : "no (chars)"], ["Dilute acid / alkali", "no reaction"]]; },
    table() { return G.table(["Property", "Thermoplastic", "Thermosetting"], [["Structure", "long separate chains", "chains cross-linked (3-D network)"], ["On heating", "softens, can be remoulded", "does not soften; chars"], ["Examples", "poly(ethene), PVC, polystyrene, nylon", "Bakelite, melamine, urea–methanal"], ["Uses", "bags, pipes, bottles, fibres", "electrical sockets, pan handles, plates"]]); },
  };
  function buildChains(S, s, c) {
    (s.chains || []).forEach((g) => G.disposeGroup(g)); s.chains = []; const P = PL[c.pl | 0], thermo = P.type === "thermoplastic", n = 6, mat = new T.MeshPhysicalMaterial({ color: thermo ? 0x7fd0ff : 0xffb35c, roughness: 0.3, clearcoat: 0.6 });
    for (let i = 0; i < n; i++) { const y = -0.6 + i * 0.24, pts = []; for (let k = 0; k <= 30; k++) pts.push(V3(-0.85 + k * 0.057, Math.sin(k * 0.7 + i * 1.3) * 0.05, Math.cos(k * 0.5 + i) * 0.08)); const tb = S.mk.tube(pts, 0.025, mat, 80); S.scene.remove(tb); const g = new T.Group(); g.add(tb); g.userData = { x: 0, y }; g.position.y = y; s.gCh.add(g); s.chains.push(g); }
    if (!thermo) { const g = new T.Group(); g.userData = { x: 0, y: 0 }; for (let i = 0; i < n - 1; i++) for (let k = 0; k < 6; k++) { const x = -0.7 + k * 0.28 + (i % 2) * 0.12, r = S.mk.rod(V3(x, -0.6 + i * 0.24, 0), V3(x, -0.6 + (i + 1) * 0.24, 0), 0.016, M.emissive(0xffd27a, 1.2)); S.scene.remove(r); g.add(r); } s.gCh.add(g); s.chains.push(g); }
  }
})();
