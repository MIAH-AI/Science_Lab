/* c3d-g9.js — chemistry 3D gap scenes: mineral processing in Ghana (gold, bauxite, manganese, diamond); cement manufacture (rotary kiln); coal: destructive distillation, water gas, producer gas */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready || !C3.gx) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, G = C3.gx, CM = C3.CM, TAU = Math.PI * 2;
  const { clamp, lerp } = G, rnd = U.rnd;

  /* model-making helpers */
  const steelM = () => new T.MeshPhysicalMaterial({ color: 0x9aa3ad, metalness: 0.85, roughness: 0.38 });
  function tank(S, g, x, z, r, h, rgb, o) {
    o = o || {}; const shell = new T.Mesh(new T.CylinderGeometry(r, r, h, 48, 1, true, o.cut ? 0.6 : 0, o.cut ? TAU - 1.2 : TAU), o.mat || steelM()); shell.material.side = T.DoubleSide; shell.position.set(x, h / 2, z); shell.castShadow = shell.receiveShadow = true; g.add(shell);
    const bot = new T.Mesh(new T.CircleGeometry(r, 48), steelM()); bot.rotation.x = -Math.PI / 2; bot.position.set(x, 0.01, z); g.add(bot);
    const slurry = new T.Mesh(new T.CircleGeometry(r * 0.97, 48), new T.MeshPhysicalMaterial({ color: G.col(rgb), roughness: 0.25, clearcoat: 0.6, map: G.noiseTex(rgb, 24) })); slurry.rotation.x = -Math.PI / 2; slurry.position.set(x, h * 0.86, z); g.add(slurry);
    const sh = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, h * 0.9, 10), M.steel()); sh.position.set(x, h * 0.55 + 0.1, z); g.add(sh); const motor = new T.Mesh(new T.BoxGeometry(0.22, 0.2, 0.22), M.paint(0x2266aa)); motor.position.set(x, h + 0.2, z); motor.castShadow = true; g.add(motor);
    const bar = new T.Mesh(new T.BoxGeometry(r * 2.1, 0.05, 0.08), M.paint(0xf2b705)); bar.position.set(x, h + 0.03, z); g.add(bar);
    const T2 = { shell, slurry, sh, x, z, r, h }; return T2;
  }
  function pipe(S, g, pts, r, mat) { const m = S.mk.tube(pts.map((p) => V3(...p)), r || 0.04, mat || steelM(), 60); S.scene.remove(m); g.add(m); return m; }
  function flowDots(g, path, n, col, size) { const curve = new T.CatmullRomCurve3(path.map((p) => V3(...p))), im = new T.InstancedMesh(new T.SphereGeometry(size || 0.035, 10, 8), new T.MeshStandardMaterial({ color: col, roughness: 0.5, emissive: col, emissiveIntensity: 0.25 }), n); im.frustumCulled = false; g.add(im); return { curve, im, n, ph: 0 }; }
  function stepFlow(F, dt, speed) { F.ph = (F.ph + dt * (speed || 0.15)) % 1; const m4 = new T.Matrix4(); for (let i = 0; i < F.n; i++) { const u = (i / F.n + F.ph) % 1; m4.makeTranslation(F.curve.getPointAt(u)); F.im.setMatrixAt(i, m4); } F.im.instanceMatrix.needsUpdate = true; }
  function board(S, w, d, rgb) { const b = S.mk.rbox(w, 0.14, d, 0.03, new T.MeshStandardMaterial({ color: 0xffffff, map: G.noiseTex(rgb || [110, 140, 80], 40, 9000), roughness: 0.95 }), 0.6, 0.07, 0); b.receiveShadow = true; return b; }

  /* =============================== minerals of Ghana =============================== */
  const MIN = [
    { n: "Gold — Obuasi, Tarkwa (cyanidation: carbon-in-leach)", ore: "native gold in quartz reefs; free-milling and sulphide ores" },
    { n: "Bauxite — Awaso, Nyinahin (Bayer process → alumina)", ore: "bauxite, Al₂O₃·2H₂O, with Fe₂O₃ and SiO₂ impurities" },
    { n: "Manganese — Nsuta (open-pit mining)", ore: "pyrolusite, MnO₂, and manganese carbonate ores" },
    { n: "Diamond — Akwatia (alluvial gravels)", ore: "diamonds (pure carbon) in river gravels" },
  ];
  C3.scenes.miningGhana = {
    env: "chemlab", envOpts: { w: 30, d: 12, wallH: 28, shadowArea: 13 }, envI: 0.8, fov: 36, free: true, cam: [[1.8, 4.2, 8.6], [1.0, 0.6, 0]],
    values: { min: 0, cn: 0.05, air: 1, galamsey: 0 },
    state: () => ({}),
    get controls() {
      return [
        { type: "select", key: "min", label: "Mineral and process (scale model)", options: MIN.map((m, i) => ({ value: i, label: m.n })) },
        { type: "range", key: "cn", label: "Gold: NaCN in the leach tanks (% by mass)", min: 0.0, max: 0.1, step: 0.005 },
        { type: "toggle", key: "air", label: "Gold: air (oxygen) blown into the tanks" },
        { type: "toggle", key: "galamsey", label: "Gold: show illegal small-scale mining (mercury, galamsey)" },
      ];
    },
    views: [{ label: "Plant model", cam: [[1.8, 4.2, 8.6], [1.0, 0.6, 0]] }, { label: "Low angle", cam: [[2.4, 1.6, 6.0], [0.8, 0.6, 0]] }],
    note: "Ghana's main minerals: gold (Obuasi, Tarkwa, Prestea), bauxite (Awaso, Nyinahin), manganese (Nsuta) and diamonds (Akwatia). Gold: crushed and milled ore is leached with dilute sodium cyanide and air (4Au + 8NaCN + O₂ + 2H₂O → 4Na[Au(CN)₂] + 4NaOH); the dissolved gold is adsorbed on activated carbon, stripped and recovered by electrolysis (or zinc dust), then smelted into bars. Bauxite: the Bayer process dissolves Al₂O₃ in hot concentrated NaOH, red mud (Fe₂O₃) settles out, Al(OH)₃ is precipitated and heated to pure alumina, which is electrolysed to aluminium. Manganese ore (MnO₂) is mined in open pits and exported for steel making and dry cells. Diamonds are washed out of gravel by their high density and picked out by X-ray or grease tables. Mining can pollute water (cyanide, mercury, silt), destroy land and cause dust; mined land must be reclaimed.",
    onChange(S, s, c, key) { if (key === "min") C3.setView(S, { cam: [[1.8, 4.2, 8.6], [1.0, 0.6, 0]] }); },
    reset(S, s, c) { Object.assign(c, { min: 0, cn: 0.05, air: 1, galamsey: 0 }); },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; board(S, 7.4, 4.2, [104, 138, 78]);
      /* gold */
      const gG = (s.gG = new T.Group()); sc.add(gG); gG.position.y = 0.14;
      const ore = G.heap(4.2, 2.1, [150, 135, 110]); ore.position.set(-2.4, 0, -1.0); gG.add(ore);
      const conv = new T.Mesh(new T.BoxGeometry(1.6, 0.04, 0.25), M.rubber()); conv.position.set(-1.6, 0.55, -0.6); conv.rotation.z = -0.35; conv.rotation.y = -0.5; gG.add(conv);
      s.mill = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 1.2, 40), M.paint(0x3a6ea8)); s.mill.rotation.z = Math.PI / 2; s.mill.position.set(-1.6, 0.6, 0.6); s.mill.castShadow = true; gG.add(s.mill); [-0.6, 0.6].forEach((dx) => { const r = new T.Mesh(new T.TorusGeometry(0.45, 0.05, 10, 40), M.steel()); r.rotation.y = Math.PI / 2; r.position.set(-1.6 + dx, 0.6, 0.6); gG.add(r); s.millRings = (s.millRings || []).concat(r); });
      s.tanks = [0, 1, 2].map((i) => tank(S, gG, -0.3 + i * 0.95, 0.2, 0.4, 0.9, [118, 104, 86]));
      s.col = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 1.4, 24), M.paint(0x404850)); s.col.position.set(2.35, 0.7, -0.6); s.col.castShadow = true; gG.add(s.col);
      const ew = S.mk.rbox(0.7, 0.4, 0.5, 0.02, M.plastic(0x2a3040, 0.4), 2.45, 0.2, 0.55); sc.remove(ew); gG.add(ew); for (let i = 0; i < 5; i++) { const pl = new T.Mesh(new T.BoxGeometry(0.02, 0.3, 0.4), i % 2 ? M.steel() : new T.MeshStandardMaterial({ color: 0x8a6d28, metalness: 0.9, roughness: 0.4 })); pl.position.set(2.2 + i * 0.12, 0.45, 0.55); gG.add(pl); }
      s.bars = []; for (let i = 0; i < 3; i++) { const b = S.mk.rbox(0.28, 0.08, 0.13, 0.01, M.gold()); sc.remove(b); b.position.set(3.2, 0.04 + i * 0.085, 0.4 + (i % 2) * 0.02); gG.add(b); s.bars.push(b); }
      s.fG = [flowDots(gG, [[-1.0, 0.6, 0.6], [-0.6, 0.8, 0.4], [-0.3, 0.95, 0.2], [0.65, 0.95, 0.2], [1.6, 0.95, 0.2], [2.0, 0.9, -0.2], [2.35, 1.42, -0.6]], 26, 0x8a7458), flowDots(gG, [[2.35, 0.05, -0.6], [2.4, 0.3, 0.0], [2.45, 0.6, 0.55]], 10, 0xffd34d, 0.03)];
      pipe(S, gG, [[-1.0, 0.6, 0.6], [-0.6, 0.8, 0.4], [-0.3, 0.95, 0.2], [0.65, 0.95, 0.2], [1.6, 0.95, 0.2], [2.0, 0.9, -0.2], [2.35, 1.42, -0.6]], 0.025, new T.MeshPhysicalMaterial({ color: 0xbfd4e0, transparent: true, opacity: 0.25, roughness: 0.05 }));
      s.river = new T.Mesh(new T.PlaneGeometry(7.2, 0.7, 40, 4), new T.MeshPhysicalMaterial({ color: 0x3a8ab0, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.85 })); s.river.rotation.x = -Math.PI / 2; s.river.position.set(0.6, 0.15, 1.75); sc.add(s.river);
      s.pits = []; for (let i = 0; i < 4; i++) { const p = new T.Mesh(new T.CylinderGeometry(0.25, 0.15, 0.12, 16), M.matte(0x7a5a3a, 1)); p.position.set(-2.4 + i * 0.6, 0.13, 1.35); sc.add(p); s.pits.push(p); }
      /* bauxite (Bayer) */
      const gB = (s.gB = new T.Group()); sc.add(gB); gB.position.y = 0.14; const bx = G.heap(4.0, 1.9, [175, 90, 55]); bx.position.set(-2.5, 0, -1.0); gB.add(bx);
      s.dig = new T.Mesh(new T.CapsuleGeometry(0.35, 0.9, 8, 24), steelM()); s.dig.position.set(-1.4, 0.8, 0); s.dig.castShadow = true; gB.add(s.dig);
      s.thick = tank(S, gB, 0.0, -0.3, 0.7, 0.45, [150, 50, 30]); s.prec = [0, 1].map((i) => tank(S, gB, 1.25, -0.7 + i * 1.0, 0.35, 1.0, [235, 235, 230]));
      s.calc = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 1.6, 32), M.paint(0x8a8f96)); s.calc.rotation.z = Math.PI / 2 - 0.08; s.calc.position.set(2.6, 0.35, 0.3); s.calc.castShadow = true; gB.add(s.calc);
      const alu = G.heap(2.1, 1.2, [250, 250, 250]); alu.position.set(3.5, 0, 0.3); gB.add(alu); const mud = G.heap(2.8, 0.5, [150, 45, 25]); mud.position.set(0.0, 0, 1.0); gB.add(mud);
      s.fB = [flowDots(gB, [[-1.4, 1.4, 0], [-0.8, 0.6, -0.2], [0.0, 0.42, -0.3], [0.8, 1.0, -0.6], [1.25, 1.0, -0.7], [1.25, 1.0, 0.3], [2.0, 0.6, 0.3], [2.6, 0.45, 0.3]], 26, 0xf2ecd8)];
      /* manganese: terraced open pit */
      const gM = (s.gM = new T.Group()); sc.add(gM); gM.position.y = 0.14; for (let i = 0; i < 5; i++) { const ring = new T.Mesh(new T.CylinderGeometry(2.2 - i * 0.38, 2.2 - i * 0.38, 0.14, 48, 1, false), new T.MeshStandardMaterial({ color: i < 2 ? 0x8a6a48 : 0x3a3532, map: G.noiseTex(i < 2 ? [138, 106, 72] : [60, 54, 50], 40), roughness: 0.95 })); ring.position.set(0, -i * 0.13 + 0.07 - 0.0, 0); ring.scale.y = -1; ring.position.y = 0.0; gM.add(ring); ring.position.y = -0.07 - i * 0.0; ring.visible = true; ring.position.set(0, 0.07 + (4 - i) * 0.0, 0); }
      const pitT = new T.Mesh(new T.CylinderGeometry(2.2, 0.6, 0.65, 48, 5, true), new T.MeshStandardMaterial({ color: 0x5a4a3a, map: G.noiseTex([90, 74, 58], 40), roughness: 0.95, side: T.BackSide })); pitT.position.set(0, -0.32 + 0.66, 0); pitT.scale.y = -1; gM.add(pitT); s.pitT = pitT;
      for (let i = 0; i < 6; i++) { const b = new T.Mesh(new T.TorusGeometry(0.75 + i * 0.25, 0.025, 6, 64), M.matte(0x7a6450, 1)); b.rotation.x = Math.PI / 2; b.position.y = 0.04 + 0.6 - i * 0.1 - 0.5 + 0.0; b.position.y = 0.66 - (5 - i) * 0.1 - 0.02; gM.add(b); }
      s.truck = new T.Group(); const cab = S.mk.rbox(0.18, 0.14, 0.16, 0.01, M.paint(0xf2b705)); sc.remove(cab); cab.position.set(0.18, 0.12, 0); s.truck.add(cab); const bed = S.mk.rbox(0.3, 0.12, 0.2, 0.01, M.paint(0xf2b705)); sc.remove(bed); bed.position.set(-0.07, 0.14, 0); s.truck.add(bed); const load = G.heap(0.7, 0.4, [40, 36, 34]); load.position.set(-0.07, 0.2, 0); s.truck.add(load); [[-0.15, 0.1], [-0.15, -0.1], [0.18, 0.1], [0.18, -0.1]].forEach(([wx, wz]) => { const w = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.04, 16), M.rubber()); w.rotation.x = Math.PI / 2; w.position.set(wx, 0.05, wz); s.truck.add(w); }); gM.add(s.truck);
      const stock = G.heap(3.6, 1.8, [40, 36, 34]); stock.position.set(2.9, 0.66, -1.1); gM.add(stock);
      /* diamond: alluvial gravel washing pan */
      const gD = (s.gD = new T.Group()); sc.add(gD); gD.position.y = 0.14; const grav = G.crystals(220, "lump", [150, 130, 105], 0.9, { mat: new T.MeshStandardMaterial({ color: 0xa08c70, roughness: 0.9 }) }); grav.layout((i) => { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * 0.9; return { x: -2.0 + Math.cos(a) * r, y: 0.05 + (0.9 - r) * 0.35 * Math.random(), z: -0.6 + Math.sin(a) * r, rx: i, ry: i * 2, s: rnd(0.5, 1.4) }; }); gD.add(grav);
      s.pan = new T.Mesh(new T.CylinderGeometry(1.0, 1.0, 0.3, 48, 1, true), steelM()); s.pan.material.side = T.DoubleSide; s.pan.position.set(0.6, 0.45, 0); gD.add(s.pan); const pw = new T.Mesh(new T.CircleGeometry(0.98, 48), new T.MeshPhysicalMaterial({ color: 0x8a7a60, roughness: 0.2, clearcoat: 1, map: G.noiseTex([130, 116, 92], 30) })); pw.rotation.x = -Math.PI / 2; pw.position.set(0.6, 0.5, 0); gD.add(pw); s.pw = pw;
      const legs = [0, 1, 2, 3].map((i) => { const l = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.32, 10), M.steel()); l.position.set(0.6 + Math.cos(i * TAU / 4 + 0.7) * 0.85, 0.16, Math.sin(i * TAU / 4 + 0.7) * 0.85); gD.add(l); return l; });
      s.rake = new T.Mesh(new T.BoxGeometry(1.8, 0.04, 0.05), M.steel()); s.rake.position.set(0.6, 0.6, 0); gD.add(s.rake);
      s.gems = G.crystals(9, "oct", [255, 255, 255], 0.6, { mat: new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, transparent: true, opacity: 0.7, ior: 2.42, envMapIntensity: 5, clearcoat: 1 }) }); s.gems.layout((i) => ({ x: 2.6 + (i % 3) * 0.14, y: 0.06, z: 0.3 + Math.floor(i / 3) * 0.14, ry: i, s: rnd(0.7, 1.1) })); gD.add(s.gems);
      const tray = S.mk.rbox(0.7, 0.04, 0.6, 0.01, M.paint(0x1c2028), 2.75, 0.02, 0.45); sc.remove(tray); gD.add(tray);
      s.spark = []; for (let i = 0; i < 9; i++) { const sp = S.mk.soft(0xffffff, 0.12, 0, 0, 0, 0); sc.remove(sp); gD.add(sp); s.spark.push(sp); }
    },
    update(S, s, c, dt) {
      const m = c.min | 0, t = S.t; s.gG.visible = m === 0; s.gB.visible = m === 1; s.gM.visible = m === 2; s.gD.visible = m === 3; s.river.visible = m === 0; s.pits.forEach((p) => { p.visible = m === 0 && !!c.galamsey; });
      if (m === 0) { s.mill.rotation.x += dt * 1.5; s.tanks.forEach((tk) => { tk.sh.rotation.y += dt * 4; tk.slurry.rotation.z += dt * 0.8; }); const rec = clamp((c.cn / 0.05) * 0.9, 0, 1) * (c.air ? 1 : 0.35); s.rec = rec * 94; stepFlow(s.fG[0], dt, 0.08); stepFlow(s.fG[1], dt * rec, 0.15);
        s.bars.forEach((b, i) => { b.visible = rec > i * 0.3; }); const dirty = c.galamsey ? 1 : 0; s.riverK = lerp(s.riverK || 0, dirty, dt * 0.6); s.river.material.color.copy(G.col(G.mix([58, 138, 176], [150, 110, 70], s.riverK))); s.river.material.opacity = 0.85 + 0.1 * s.riverK;
        const pa = s.river.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 3 + t * 2) * 0.01); pa.needsUpdate = true; }
      else if (m === 1) { s.thick.sh.rotation.y += dt * 0.6; s.prec.forEach((p) => { p.sh.rotation.y += dt * 3; }); s.calc.rotation.x += dt * 0.8; stepFlow(s.fB[0], dt, 0.07); }
      else if (m === 2) { const a = (t * 0.25) % 1, ang = a * TAU * 2.2, r = 0.8 + a * 1.2; s.truck.position.set(Math.cos(ang) * r, 0.66 - (1 - a) * 0.55 + 0.02, Math.sin(ang) * r); s.truck.rotation.y = -ang - Math.PI / 2; }
      else { s.pan.rotation.y += dt * 0.4; s.rake.rotation.y = t * 0.9; s.pw.material.map.offset.x = t * 0.05; s.spark.forEach((sp, i) => { const on = Math.sin(t * 3 + i * 2.1) > 0.92; sp.material.opacity = on ? 0.95 : 0; sp.position.set(2.6 + (i % 3) * 0.14, 0.12, 0.3 + Math.floor(i / 3) * 0.14); }); }
    },
    overlay(ctx, s, c, w, h, S) {
      const m = c.min | 0, px = w - 250; ctx.save(); G.titles(ctx, MIN[m].n, "ore: " + MIN[m].ore);
      const tg = (p, t2, col) => G.tag(ctx, S, V3(...p), t2, col || "#cfe0f5", 8);
      if (m === 0) { tg([-2.4, 0.75, -1.0], "ore stockpile"); tg([-1.6, 1.3, 0.6], "crusher + ball mill"); tg([0.65, 1.55, 0.2], "leach tanks: NaCN + air"); tg([2.35, 1.75, -0.6], "carbon columns"); tg([2.45, 0.95, 0.55], "electrowinning"); tg([3.2, 0.5, 0.4], "doré bars", "#ffe08a"); if (c.galamsey) tg([-1.5, 0.45, 1.35], "galamsey pits: Hg amalgamation", "#ff9d8a");
        G.panel(ctx, px, 58, 240, "Cyanidation (carbon-in-leach)", ["4Au + 8NaCN + O₂ + 2H₂O → 4Na[Au(CN)₂] + 4NaOH", "gold recovery ≈ " + Math.round(s.rec || 0) + " %", !c.air ? ["no air: O₂ is a reactant, so leaching is slow", "#ff9d8a"] : c.cn < 0.02 ? ["too little cyanide", "#ff9d8a"] : "dissolved gold adsorbed on carbon, stripped, electrolysed", c.galamsey ? ["galamsey: mercury and silt poison rivers (Pra, Ankobra, Offin), destroy farmland and cocoa farms", "#ffb38a"] : "keep the pH above 10 (lime) so poisonous HCN gas is not released"]); }
      else if (m === 1) { tg([-2.5, 0.7, -1.0], "bauxite"); tg([-1.4, 1.65, 0], "digester: hot conc. NaOH"); tg([0.0, 0.95, -0.3], "red-mud settler"); tg([1.25, 1.55, -0.2], "precipitators"); tg([2.6, 0.85, 0.3], "calciner (1100 °C)"); tg([3.5, 0.45, 0.3], "alumina"); tg([0.0, 0.4, 1.0], "red mud", "#ff9d8a");
        G.panel(ctx, px, 58, 240, "Bayer process", ["Al₂O₃ + 2NaOH + 3H₂O → 2Na[Al(OH)₄]  (dissolves)", "Fe₂O₃ and most SiO₂ do not dissolve → red mud", "2Na[Al(OH)₄] → 2Al(OH)₃↓ + 2NaOH  (seeded, cooled)", "2Al(OH)₃ → Al₂O₃ + 3H₂O  (calcined)", ["alumina is electrolysed to aluminium (VALCO, Tema)", "#ffe9b8"]]); }
      else if (m === 2) { tg([0, 1.2, 0], "benches of the open pit"); tg([2.9, 1.3, -1.1], "MnO₂ ore stockpile → Takoradi port");
        G.panel(ctx, px, 58, 240, "Manganese (Nsuta)", ["mined by blasting and loading benches in an open pit", "ore: pyrolusite MnO₂ (black)", "uses: ferromanganese for hard steel; MnO₂ in dry cells; KMnO₄", ["effects: dust, noise, land degradation — pits must be refilled and replanted", "#ffb38a"]]); }
      else { tg([-2.0, 0.75, -0.6], "diamond-bearing gravel"); tg([0.6, 1.0, 0], "rotary washing pan"); tg([2.75, 0.45, 0.45], "recovered diamonds", "#e8f6ff");
        G.panel(ctx, px, 58, 240, "Diamond (Akwatia)", ["gravel is crushed lightly and washed in rotary pans", "dense diamonds (3.5 g/cm³) sink and are concentrated", "picked out by X-ray fluorescence or grease tables (diamond is water-repellent)", ["diamond = giant covalent carbon: hardest natural substance; industrial cutting and drilling, jewellery", "#ffe9b8"]]); }
      ctx.restore();
    },
    readouts(s, c) { const m = c.min | 0; return m === 0 ? [["Gold recovery", Math.round(s.rec || 0) + " %"], ["NaCN", (c.cn * 100).toFixed(1) + " % w/w"], ["Air", c.air ? "on" : "off"]] : [["Mineral", MIN[m].n.split(" — ")[0]], ["Ore", MIN[m].ore]]; },
  };

  /* =============================== cement =============================== */
  C3.scenes.cement = {
    env: "chemlab", envOpts: { w: 30, d: 12, wallH: 28, shadowArea: 13 }, envI: 0.8, fov: 36, free: true, cam: [[1.6, 3.6, 8.4], [0.8, 1.0, 0]],
    values: { Tk: 1450, gyp: 4, run: 1 },
    state: () => ({}),
    get controls() {
      return [
        { type: "range", key: "Tk", label: "Burning-zone temperature (°C)", min: 1100, max: 1600, step: 10 },
        { type: "range", key: "gyp", label: "Gypsum ground with the clinker (%)", min: 0, max: 10, step: 0.5 },
        { type: "toggle", key: "run", label: "Kiln running" },
      ];
    },
    views: [{ label: "Plant model", cam: [[1.6, 3.6, 8.4], [0.8, 1.0, 0]] }, { label: "Kiln burner end", cam: [[3.6, 1.4, 3.6], [2.4, 0.9, 0]] }],
    note: "Portland cement is made by heating limestone (CaCO₃) with clay or shale (aluminosilicates, with some iron oxide and sand) in a long rotating kiln. As the raw meal moves down the kiln it is dried (100 °C), calcined at about 900 °C (CaCO₃ → CaO + CO₂) and finally partly melted at about 1450 °C, where lime combines with silica, alumina and iron oxide to form clinker: tricalcium silicate 3CaO·SiO₂, dicalcium silicate 2CaO·SiO₂, tricalcium aluminate 3CaO·Al₂O₃ and the ferrite 4CaO·Al₂O₃·Fe₂O₃. The cooled clinker is ground with 3–5 % gypsum (CaSO₄·2H₂O), which slows the setting. Cement sets and hardens by hydration. In Ghana, GHACEM (Tema, Takoradi) and Diamond Cement grind imported clinker; limestone is quarried at Nauli and Buipe.",
    reset(S, s, c) { Object.assign(c, { Tk: 1450, gyp: 4, run: 1 }); },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; board(S, 7.6, 4.0, [150, 145, 135]);
      const g = (s.g = new T.Group()); g.position.y = 0.14; sc.add(g);
      /* preheater tower */
      const tw = new T.Group(); tw.position.set(-2.5, 0, -0.5); g.add(tw); [[0, 0.5], [0, 1.2], [0, 1.9]].forEach(([x, y], i) => { const cy = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.35, 32), steelM()); cy.position.set(i % 2 ? 0.22 : -0.22, y + 0.35, 0); tw.add(cy); const cn = new T.Mesh(new T.ConeGeometry(0.28, 0.4, 32), steelM()); cn.rotation.x = Math.PI; cn.position.set(cy.position.x, y - 0.03, 0); tw.add(cn); });
      [[-0.5, 0], [0.5, 0]].forEach(([x]) => { for (let k = 0; k < 2; k++) { const col = new T.Mesh(new T.BoxGeometry(0.05, 2.4, 0.05), M.paint(0x6a6f76)); col.position.set(x, 1.2, k ? 0.4 : -0.4); tw.add(col); } });
      for (let k = 0; k < 4; k++) { const fl = new T.Mesh(new T.BoxGeometry(1.1, 0.03, 0.9), M.paint(0x6a6f76)); fl.position.set(0, 0.25 + k * 0.7, 0); tw.add(fl); } tw.traverse((q) => { if (q.isMesh) q.castShadow = true; });
      /* rotary kiln (inclined ~3.5°), glow gradient texture */
      const kc = U.cv(512, 64), kg = kc.getContext("2d"); const gr = kg.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, "#000"); gr.addColorStop(0.45, "#2a0800"); gr.addColorStop(0.75, "#ff5a10"); gr.addColorStop(0.92, "#ffd27a"); gr.addColorStop(1, "#ff9a30"); kg.fillStyle = gr; kg.fillRect(0, 0, 512, 64); s.kTex = new T.CanvasTexture(kc); s.kTex.colorSpace = T.SRGBColorSpace;
      s.kiln = new T.Group(); s.kiln.position.set(0.2, 0.75, 0.2); s.kiln.rotation.z = -0.06; g.add(s.kiln);
      const shellG = new T.CylinderGeometry(0.32, 0.32, 4.4, 48, 1, true, 1.25, TAU - 1.25); shellG.rotateZ(Math.PI / 2); s.shell = new T.Mesh(shellG, new T.MeshPhysicalMaterial({ color: 0x6f6a64, metalness: 0.7, roughness: 0.55, side: T.DoubleSide })); s.shell.castShadow = true; s.kiln.add(s.shell);
      const linG = new T.CylinderGeometry(0.28, 0.28, 4.38, 48, 1, true); linG.rotateZ(Math.PI / 2); const uv = linG.attributes.uv; for (let i = 0; i < uv.count; i++) { const p = linG.attributes.position; uv.setXY(i, (p.getX(i) + 2.19) / 4.38, 0.5); } s.lining = new T.Mesh(linG, new T.MeshStandardMaterial({ color: 0x2a2420, emissive: 0xffffff, emissiveMap: s.kTex, emissiveIntensity: 1.5, side: T.BackSide, roughness: 0.9 })); s.kiln.add(s.lining);
      [-1.4, 0, 1.4].forEach((x) => { const tyre = new T.Mesh(new T.TorusGeometry(0.36, 0.05, 10, 48), M.steel()); tyre.rotation.y = Math.PI / 2; tyre.position.x = x; s.kiln.add(tyre); const pier = S.mk.box(0.3, 0.75 - 0.08 * (x / 1.4) * 1.0 - 0.3, 0.5, M.ceramic(0xcfcac2), 0.2 + x, (0.75 - 0.3) / 2, 0.2); sc.remove(pier); g.add(pier); });
      s.cut = new T.Mesh(new T.CylinderGeometry(0.33, 0.33, 4.42, 48, 1, true, -0.9, 1.8), new T.MeshBasicMaterial({ visible: false })); s.kiln.add(s.cut);
      s.nod = new T.InstancedMesh(new T.IcosahedronGeometry(0.035, 1), new T.MeshStandardMaterial({ color: 0x2a2a2a, emissive: 0xff6a20, emissiveIntensity: 0, roughness: 0.8 }), 120); s.nod.frustumCulled = false; s.kiln.add(s.nod); s.nodP = []; for (let i = 0; i < 120; i++) s.nodP.push({ u: Math.random(), a: rnd(-0.5, 0.5) });
      s.burner = K.flame({ h: 9, r: 1.2 }); s.burner.set(0.85, 1); s.burner.group.rotation.z = Math.PI / 2; s.burner.group.position.set(2.15, 0, 0); s.kiln.add(s.burner.group);
      const hood = S.mk.rbox(0.6, 0.9, 0.9, 0.02, M.paint(0x8a8f96), 2.65, 0.45, 0.2); sc.remove(hood); g.add(hood); const cooler = S.mk.rbox(1.0, 0.35, 0.7, 0.02, M.paint(0x5a6068), 2.9, 0.18, 1.3); sc.remove(cooler); g.add(cooler);
      s.clink = G.crystals(60, "lump", [60, 60, 62], 0.5, { mat: new T.MeshStandardMaterial({ color: 0x3a3a3c, roughness: 0.85 }) }); s.clink.layout((i) => ({ x: 2.5 + rnd(-0.4, 0.4), y: 0.38 + rnd(0, 0.08), z: 1.3 + rnd(-0.25, 0.25), rx: i, ry: i, s: rnd(0.6, 1.2) })); g.add(s.clink);
      s.millC = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 1.0, 40), M.paint(0x2266aa)); s.millC.rotation.z = Math.PI / 2; s.millC.position.set(0.9, 0.35, 1.4); s.millC.castShadow = true; g.add(s.millC);
      const silo = new T.Mesh(new T.CylinderGeometry(0.35, 0.35, 1.6, 40), M.ceramic(0xdedad2)); silo.position.set(0.1, 0.8, -1.4); silo.castShadow = true; g.add(silo); const sr = new T.Mesh(new T.ConeGeometry(0.36, 0.25, 40), M.ceramic(0xdedad2)); sr.position.set(0.1, 1.72, -1.4); g.add(sr);
      const lime = G.heap(3.0, 1.4, [228, 224, 210]); lime.position.set(-3.1, 0, 1.1); g.add(lime); const clay = G.heap(2.6, 1.2, [176, 120, 80]); clay.position.set(-2.3, 0, 1.4); g.add(clay); const gyp = G.heap(1.6, 0.8, [250, 250, 246]); gyp.position.set(1.8, 0, 1.75); g.add(gyp);
      s.stack = S.mk.cyl(0.1, 0.12, 1.4, M.ceramic(0xd8d4cc), -2.5, 2.8, -0.5); sc.remove(s.stack); g.add(s.stack); s.pT = 0;
    },
    update(S, s, c, dt) {
      const t = S.t, run = c.run; if (run) { s.lining.rotation.x += dt * 0.6; s.millC.rotation.x += dt * 2; }
      const heat = clamp((c.Tk - 1100) / 500, 0, 1); s.lining.material.emissiveIntensity = (run ? 0.6 + 1.6 * heat : 0.15); s.burner.set(0.85, run ? 0.6 + 0.6 * heat : 0); s.burner.update(t);
      const m4 = new T.Matrix4(); s.nodP.forEach((p, i) => { if (run) p.u = (p.u + dt * 0.05) % 1; const x = -2.15 + p.u * 4.3, ang = -Math.PI / 2 + p.a + Math.sin(t * 0.6 + i) * 0.1; m4.makeTranslation(x, Math.sin(ang) * 0.24, Math.cos(ang) * 0.24); s.nod.setMatrixAt(i, m4); }); s.nod.instanceMatrix.needsUpdate = true; s.nod.material.emissiveIntensity = run ? heat * 1.2 : 0;
      s.pT += dt; if (run && s.pT > 0.35) { s.pT = 0; S.puff(-2.5, 3.65, -0.5, { n: 1, color: 0xd8dce2, speed: 0.12, up: 0.5, life: 3, size: 0.45, op: 0.3 }); }
      s.freeLime = c.Tk < 1350 ? 8 - (c.Tk - 1100) / 250 * 5 : c.Tk < 1430 ? 3 - (c.Tk - 1350) / 80 * 2 : 1; s.c3s = clamp((c.Tk - 1250) / 200, 0, 1) * 60; s.setMin = c.gyp < 1 ? 3 : c.gyp < 2.5 ? 30 + (c.gyp - 1) * 40 : c.gyp <= 5.5 ? 120 + (c.gyp - 2.5) * 20 : 180 + (c.gyp - 5.5) * 10;
    },
    overlay(ctx, s, c, w, h, S) {
      const px = w - 250; ctx.save(); G.titles(ctx, "Cement manufacture: the rotary kiln", "limestone + clay → (1450 °C) clinker → + gypsum → Portland cement");
      const k = s.kiln, P = (x) => k.localToWorld(V3(x, 0.55, 0)); G.tag(ctx, S, P(-1.6), "drying 100 °C", "#cfe0f5", 8); G.tag(ctx, S, P(-0.2), "calcining 900 °C: CaCO₃ → CaO + CO₂", "#ffd27a", 8); G.tag(ctx, S, P(1.5), "clinkering " + c.Tk + " °C", "#ff9d6a", 8.5);
      G.tag(ctx, S, V3(-2.5, 2.75, -0.5), "preheater cyclones", "#cfe0f5", 8); G.tag(ctx, S, V3(0.9, 0.85, 1.4), "cement mill (+ gypsum)", "#cfe0f5", 8); G.tag(ctx, S, V3(-2.7, 0.55, 1.25), "limestone + clay", "#cfe0f5", 8); G.tag(ctx, S, V3(2.6, 0.75, 1.3), "clinker", "#cfe0f5", 8);
      G.panel(ctx, px, 58, 240, "Quality control", ["free lime (unreacted CaO): " + s.freeLime.toFixed(1) + " %" + (s.freeLime > 2 ? " — too high: weak, unsound cement" : " — good"), "tricalcium silicate (gives early strength): ≈ " + Math.round(s.c3s) + " %", c.Tk > 1520 ? ["too hot: fuel wasted, kiln lining damaged", "#ff9d8a"] : "", "initial setting time: ≈ " + Math.round(s.setMin) + " min" + (c.gyp < 1 ? " — FLASH SET (no gypsum)" : c.gyp > 6 ? " — too much gypsum: expansion" : " — normal (≥ 45 min)"), ["setting: 2(3CaO·SiO₂) + 6H₂O → 3CaO·2SiO₂·3H₂O + 3Ca(OH)₂", "#ffe9b8"]]);
      ctx.restore();
    },
    readouts(s, c) { return [["Burning zone", c.Tk + " °C"], ["Free lime", s.freeLime.toFixed(1) + " %"], ["Gypsum", c.gyp + " %"], ["Setting time", Math.round(s.setMin) + " min"]]; },
  };

  /* =============================== coal, coke and fuel gases =============================== */
  const COAL = ["Destructive distillation of coal (laboratory)", "Water gas: steam over white-hot coke", "Producer gas: air through hot coke"];
  C3.scenes.coalCoke = {
    env: "chemlab", envOpts: { w: 28, d: 11, wallH: 26, shadowArea: 12 }, envI: 0.75, fov: 36, free: true, cam: [[1.6, 2.8, 7.4], [1.0, 1.2, 0]],
    values: { mode: 0, run: 1 },
    state: () => ({}),
    get controls() { return [{ type: "select", key: "mode", label: "Process", options: COAL.map((m, i) => ({ value: i, label: m })) }, { type: "toggle", key: "run", label: "Heat / blow (run)" }, { type: "button", label: "Start again", cls: "secondary", action: (S, s) => { restartCC(s); } }]; },
    views: [{ label: "This process", cam: (S, s, c) => CCV2[c.mode | 0] }, { label: "Close", cam: [[0.6, 2.0, 3.6], [0.2, 1.4, 0]] }],
    note: "Destructive distillation: heating coal strongly in the absence of air breaks it down into coke (residue, nearly pure carbon), coal tar (source of benzene, phenol, dyes, drugs), ammoniacal liquor (turns red litmus blue; used for fertilisers) and coal gas (H₂, CH₄, CO; burns). Water gas: steam passed over white-hot coke, C + H₂O → CO + H₂ (ΔH = +131 kJ/mol, endothermic, so the coke cools and must be reheated by blowing air). Producer gas: air passed through red-hot coke, 2C + O₂ + 4N₂ → 2CO + 4N₂ (exothermic); it has a low fuel value because of the nitrogen. Carbon(II) oxide burns with a blue flame and is very poisonous (it combines with haemoglobin); carbon(IV) oxide turns lime water milky.",
    onChange(S, s, c, key) { restartCC(s); if (key === "mode") C3.setView(S, { cam: CCV2[c.mode | 0] }); },
    reset(S, s, c) { Object.assign(c, { mode: 0, run: 1 }); restartCC(s); C3.setView(S, { cam: CCV2[0] }); },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(11, 0.06, 4, M.matte(0xb69a76, 0.62), 0.6, 0, 0).receiveShadow = true;
      /* lab */
      const gL = (s.gL = new T.Group()); sc.add(gL); const st = K.retort({ x: -1.6, z: -0.7, h: 60 }); sc.remove(st); gL.add(st);
      const bt = K.vessel(G.DEFS.boilingtube, { noAdd: true }); bt.group.rotation.z = -(Math.PI / 2 - 0.12); bt.group.position.set(-1.3, 2.35, 0); gL.add(bt.group); const ca = K.clampArm(st, 2.45 / CM, -0.95, 0, 1.2); sc.remove(ca); gL.add(ca);
      s.coal = G.crystals(16, "lump", [30, 30, 32], 0.7, { mat: new T.MeshPhysicalMaterial({ color: 0x18181a, roughness: 0.35, metalness: 0.2, clearcoat: 0.6, emissive: new T.Color(1, 0.3, 0.05), emissiveIntensity: 0 }) }); bt.group.add(s.coal); s.coal.layout((i) => ({ x: rnd(-0.55, 0.55) * CM, y: (0.8 + (i % 8) * 0.55) * CM, z: rnd(-0.55, 0.55) * CM, rx: i, ry: i * 2, s: rnd(0.7, 1.1) }));
      s.bn = K.bunsen({ x: -0.95, z: 0 }); sc.remove(s.bn); gL.add(s.bn);
      const ice = K.beaker(); sc.remove(ice.group); ice.group.position.set(1.4, 0, 0); ice.group.scale.set(1.3, 1.1, 1.3); gL.add(ice.group); const iw = ice.addLiquid({ color: [215, 235, 246], opacity: 0.2 }); iw.setVolume(150); s.iw = iw;
      const cubes = G.crystals(10, "box", [235, 245, 252], 1.3, { op: 0.55 }); ice.group.add(cubes); cubes.layout((i) => ({ x: rnd(-2.6, 2.6) * CM, y: (6.5 + rnd(0, 1)) * CM, z: rnd(-2.6, 2.6) * CM, rx: rnd(0, 1), ry: rnd(0, 3) }));
      const rt = K.vessel("testtube", { noAdd: true }); rt.group.position.set(1.4, 0.25, 0); gL.add(rt.group); s.tarL = rt.addLiquid({ color: [40, 28, 18], opacity: 0.9 }); s.liqL = null;
      const dp = [V3(1.2, 2.65, 0), V3(1.35, 2.7, 0), V3(1.42, 2.4, 0), V3(1.42, 1.0, 0)]; const d1 = G.glassTube(S, K, dp, 0.3, 0.14); sc.remove(d1); gL.add(d1);
      const jet = [V3(1.5, 2.1, 0), V3(1.8, 2.25, 0), V3(2.3, 2.3, 0), V3(2.6, 2.3, 0), V3(2.75, 2.55, 0)]; const d2 = G.glassTube(S, K, jet, 0.28, 0.14); sc.remove(d2); gL.add(d2);
      s.jetF = K.flame({ h: 2.2, r: 0.45 }); s.jetF.set(0.4, 1); s.jetF.group.position.set(2.75, 2.58, 0); gL.add(s.jetF.group);
      const lit = new T.Mesh(new T.BoxGeometry(0.14, 0.6, 0.005), new T.MeshStandardMaterial({ color: G.col([205, 60, 60]), roughness: 0.9 })); lit.position.set(1.62, 1.2, 0.15); lit.rotation.z = 0.2; gL.add(lit); s.lit = lit;
      /* gas generator */
      const gG = (s.gG = new T.Group()); sc.add(gG); const shell = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 2.6, 48, 1, true, 0.5, TAU - 1.0), new T.MeshPhysicalMaterial({ color: 0x5a5f66, metalness: 0.8, roughness: 0.5, side: T.DoubleSide })); shell.position.set(0, 1.3, 0); shell.castShadow = true; gG.add(shell);
      const lin = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 2.55, 48, 1, true, 0.5, TAU - 1.0), new T.MeshStandardMaterial({ color: 0xb08a68, map: G.noiseTex([176, 138, 104], 30), roughness: 0.95, side: T.BackSide })); lin.position.set(0, 1.3, 0); gG.add(lin);
      const top = new T.Mesh(new T.ConeGeometry(0.72, 0.4, 48), M.paint(0x4a4f56)); top.position.set(0, 2.8, 0); gG.add(top);
      s.coke = G.crystals(160, "lump", [70, 70, 72], 1.4, { mat: new T.MeshStandardMaterial({ color: 0x5a5a5c, roughness: 0.75, metalness: 0.2, emissive: new T.Color(1, 0.45, 0.1), emissiveIntensity: 0 }) }); gG.add(s.coke); s.coke.layout((i) => { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * 0.58; return { x: Math.cos(a) * r, y: 0.25 + Math.random() * 1.5, z: Math.sin(a) * r, rx: i, ry: i * 1.3, s: rnd(0.7, 1.2) }; });
      s.cokeL = new T.PointLight(0xff7a20, 0, 4, 1.5); s.cokeL.position.set(0, 1.0, 0.6); gG.add(s.cokeL);
      pipe(S, gG, [[-1.6, 0.25, 0], [-0.7, 0.25, 0]], 0.07, steelM()); pipe(S, gG, [[0, 3.0, 0], [0, 3.25, 0], [0.9, 3.25, 0], [1.6, 2.6, 0], [2.0, 2.6, 0]], 0.07, steelM());
      s.outF = K.flame({ h: 7, r: 1.4 }); s.outF.set(0.95, 1); s.outF.group.position.set(2.05, 2.6, 0); s.outF.group.rotation.z = -Math.PI / 2; gG.add(s.outF.group);
      s.inFlow = flowDots(gG, [[-1.6, 0.25, 0], [-0.7, 0.25, 0], [-0.3, 0.6, 0], [0, 1.4, 0], [0, 2.9, 0]], 22, 0xffffff, 0.04); s.outFlow = flowDots(gG, [[0, 3.0, 0], [0, 3.25, 0], [0.9, 3.25, 0], [1.6, 2.6, 0], [2.0, 2.6, 0]], 14, 0x9fd0ff, 0.035);
      restartCC(s); C3.setView(S, { cam: CCV2[c.mode | 0] });
    },
    update(S, s, c, dt) {
      const m = c.mode | 0, t = S.t, run = c.run && dt > 0; s.gL.visible = m === 0; s.gG.visible = m > 0;
      if (m === 0) { s.bn.setGas(c.run ? 1 : 0); s.bn.flame.update(t); if (run) s.p = clamp(s.p + dt * 0.04, 0, 1); const k = s.p; s.coal.material.emissiveIntensity = c.run ? 0.5 + 0.4 * Math.sin(t * 3) * 0.2 : 0; s.coal.material.color.copy(G.col(G.mix([24, 24, 26], [90, 92, 96], k))); s.coal.material.metalness = 0.2 + 0.5 * k;
        s.tarL.setVolume(0.2 + 6 * k); s.tarL.update(t); s.iw.update(t); s.jetF.set(0.4, c.run && k > 0.12 ? 0.8 : 0); s.jetF.update(t); s.lit.material.color.copy(G.col(G.mix([205, 60, 60], [60, 90, 205], G.smooth(0.3, 0.6, k)))); }
      else { const water = m === 1; if (run) { s.Tc += (water ? -55 : 40) * dt; s.Tc = clamp(s.Tc, 600, 1400); if (water && s.Tc <= 900) s.blowing = 1; if (s.blowing && s.Tc > 1300) s.blowing = 0; if (water && s.blowing) s.Tc += 110 * dt; }
        const glow = clamp((s.Tc - 600) / 800, 0, 1); s.coke.material.emissiveIntensity = glow * 0.85; s.coke.material.emissive.copy(G.glowCol(s.Tc)); s.cokeL.intensity = glow * 6; stepFlow(s.inFlow, run ? dt : 0, 0.25); stepFlow(s.outFlow, run ? dt : 0, 0.25);
        s.inFlow.im.material.color.setHex(water && !s.blowing ? 0xf4f8fb : 0x9fd8ff); s.outF.set(water ? 0.95 : 0.9, c.run ? (water && s.blowing ? 0.25 : 1) : 0); s.outF.update(t);
        if (run && water && !s.blowing) { s.pT = (s.pT || 0) + dt; if (s.pT > 0.2) { s.pT = 0; G.wisp(S, -1.55, 0.3, 0, 0xf4f8fb, { op: 0.3 }); } } }
    },
    overlay(ctx, s, c, w, h, S) {
      const m = c.mode | 0, px = w - 250; ctx.save();
      if (m === 0) { G.titles(ctx, "Destructive distillation of coal", "coal heated strongly in the absence of air"); G.tag(ctx, S, V3(-1.0, 2.75, 0), s.p > 0.7 ? "coke (residue)" : "coal", "#cfe0f5", 8.5); G.tag(ctx, S, V3(1.4, 0.15, 0.6), "coal tar + ammoniacal liquor (in ice)", "#ffd27a", 8); G.tag(ctx, S, V3(2.75, 3.0, 0), "coal gas burns", "#9fd0ff", 8.5); G.tag(ctx, S, V3(1.62, 1.6, 0.15), "red litmus", "#cfe0f5", 7.5);
        G.panel(ctx, px, 58, 240, "Products", ["coke: grey, porous, nearly pure carbon — fuel, blast furnace reducing agent", "coal tar: black, oily — benzene, phenol, naphthalene, dyes, drugs", "ammoniacal liquor: turns red litmus blue (NH₃) — fertilisers", "coal gas: H₂ ≈ 50 %, CH₄ ≈ 30 %, CO ≈ 8 % — fuel"]); }
      else if (m === 1) { G.titles(ctx, "Water gas", "C(s) + H₂O(g) → CO(g) + H₂(g)    ΔH = +131 kJ/mol (endothermic)"); G.tag(ctx, S, V3(-1.6, 0.6, 0), s.blowing ? "air blow (reheat)" : "steam in", "#cfe0f5", 8.5); G.tag(ctx, S, V3(0, 3.25, 0.8), "white-hot coke ≈ " + Math.round(s.Tc) + " °C", "#ffd27a", 8.5);
        G.panel(ctx, px, 58, 240, "Water gas", ["fuel value high: both CO and H₂ burn", "2CO + O₂ → 2CO₂;  2H₂ + O₂ → 2H₂O", s.blowing ? ["coke has cooled below 1000 °C — air is blown in to reheat it (producer-gas run)", "#ffb38a"] : "the coke cools because the reaction absorbs heat", "used as industrial fuel and to make H₂ for the Haber process"]); }
      else { G.titles(ctx, "Producer gas", "2C(s) + O₂(g) + 4N₂(g) → 2CO(g) + 4N₂(g)   exothermic"); G.tag(ctx, S, V3(-1.6, 0.6, 0), "air in", "#cfe0f5", 8.5); G.tag(ctx, S, V3(0, 3.25, 0.8), "red-hot coke ≈ " + Math.round(s.Tc) + " °C", "#ffd27a", 8.5);
        G.panel(ctx, px, 58, 240, "Producer gas", ["about 33 % CO and 66 % N₂: low fuel value (N₂ does not burn)", "cheap fuel for furnaces", ["CO burns with a blue flame; it is colourless, odourless and very poisonous", "#ff9d8a"], "CO₂ + C → 2CO when CO₂ meets hot coke higher in the bed"]); }
      ctx.restore();
    },
    readouts(s, c) { const m = c.mode | 0; return m === 0 ? [["Progress", Math.round(s.p * 100) + " %"], ["Residue", s.p > 0.7 ? "coke" : "coal → coke"]] : [["Coke temperature", Math.round(s.Tc) + " °C"], ["Gas made", m === 1 ? "CO + H₂ (water gas)" : "CO + N₂ (producer gas)"]]; },
  };
  const CCV2 = [[[1.6, 3.0, 7.4], [0.7, 1.5, 0]], [[1.4, 2.8, 7.6], [0.8, 1.6, 0]], [[1.4, 2.8, 7.6], [0.8, 1.6, 0]]];
  function restartCC(s) { s.p = 0; s.Tc = 1250; s.blowing = 0; }
})();
