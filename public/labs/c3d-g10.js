/* c3d-g10.js — chemistry 3D gap scenes: town water treatment; the fountain experiment (solubility of HCl / NH₃); allotropes of sulphur and the effect of heat */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready || !C3.gx) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, G = C3.gx, CM = C3.CM, TAU = Math.PI * 2;
  const { clamp, lerp } = G, rnd = U.rnd;
  const concrete = () => new T.MeshStandardMaterial({ color: 0xffffff, map: G.noiseTex([196, 192, 184], 26, 8000), roughness: 0.92 });

  /* =============================== water treatment =============================== */
  const STAGES = ["intake + screens", "aeration", "coagulation (alum)", "sedimentation", "sand filtration", "chlorination", "storage + distribution"];
  C3.scenes.waterTreatment = {
    env: "chemlab", envOpts: { w: 30, d: 12, wallH: 28, shadowArea: 13 }, envI: 0.8, fov: 36, free: true, cam: [[1.2, 4.0, 8.4], [0.6, 0.6, 0]],
    values: { ntu: 80, alum: 50, cl: 1.5 },
    state: () => ({}),
    get controls() {
      return [
        { type: "range", key: "ntu", label: "Turbidity of the river water (NTU)", min: 5, max: 300, step: 5 },
        { type: "range", key: "alum", label: "Alum dose, Al₂(SO₄)₃ (mg/dm³)", min: 0, max: 200, step: 5 },
        { type: "range", key: "cl", label: "Chlorine dose (mg/dm³)", min: 0, max: 4, step: 0.1 },
      ];
    },
    views: [{ label: "Plant model", cam: [[1.2, 4.0, 8.4], [0.6, 0.6, 0]] }, { label: "Low", cam: [[1.0, 1.6, 6.0], [0.4, 0.5, 0]] }],
    note: "Town water treatment (e.g. GWCL Weija and Kpong plants): (1) screening removes floating rubbish; (2) aeration lets out bad-smelling gases and oxidises dissolved iron; (3) coagulation: aluminium tetraoxosulphate(VI) (alum) reacts with the natural alkalinity, Al₂(SO₄)₃ + 3Ca(HCO₃)₂ → 2Al(OH)₃ + 3CaSO₄ + 6CO₂, and the sticky Al(OH)₃ floc traps clay and bacteria; lime may be added to keep the pH correct; (4) sedimentation: the floc settles as sludge; (5) filtration through beds of sand and gravel removes the remaining fine particles; (6) chlorination kills germs: Cl₂ + H₂O ⇌ HCl + HOCl, and a small residual (0.2–0.5 mg/dm³) protects the water in the pipes; fluoride may also be added; (7) the water is stored in reservoirs and pumped to homes.",
    reset(S, s, c) { Object.assign(c, { ntu: 80, alum: 50, cl: 1.5 }); },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; const b = S.mk.rbox(8.2, 0.14, 4.4, 0.03, new T.MeshStandardMaterial({ color: 0xffffff, map: G.noiseTex([106, 140, 80], 40, 9000), roughness: 0.95 }), 0.6, 0.07, 0); b.receiveShadow = true;
      const g = (s.g = new T.Group()); g.position.y = 0.14; sc.add(g); const xs = [-3.0, -2.1, -1.1, 0.1, 1.3, 2.3, 3.3]; s.xs = xs;
      s.river = new T.Mesh(new T.PlaneGeometry(8.0, 0.9, 60, 6), new T.MeshPhysicalMaterial({ color: 0x8a6a40, roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.9 })); s.river.rotation.x = -Math.PI / 2; s.river.position.set(0.6, 0.02, 1.65); g.add(s.river);
      const scr = new T.Group(); for (let i = 0; i < 8; i++) { const bar = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.5, 6), M.steel()); bar.position.set(xs[0] - 0.25 + i * 0.07, 0.25, 0.9); scr.add(bar); } g.add(scr); const pit = S.mk.rbox(0.7, 0.4, 0.6, 0.02, concrete(), xs[0], 0.2, 0.3); sc.remove(pit); g.add(pit);
      for (let i = 0; i < 4; i++) { const st = S.mk.box(0.6, 0.12, 0.25, concrete(), xs[1], 0.85 - i * 0.2, -0.2 + i * 0.22); sc.remove(st); g.add(st); }
      const mkBasin = (x, w, d, h) => { const bs = new T.Group(); const mat = concrete(); [[0, -d / 2, w, 0.05], [0, d / 2, w, 0.05], [-w / 2, 0, 0.05, d], [w / 2, 0, 0.05, d]].forEach(([dx, dz, ww, dd]) => { const wall = new T.Mesh(new T.BoxGeometry(ww, h, dd), mat); wall.position.set(dx, h / 2, dz); wall.castShadow = wall.receiveShadow = true; bs.add(wall); }); const fl = new T.Mesh(new T.BoxGeometry(w, 0.03, d), mat); fl.position.y = 0.015; bs.add(fl); bs.position.x = x; g.add(bs); const water = new T.Mesh(new T.PlaneGeometry(w - 0.06, d - 0.06), new T.MeshPhysicalMaterial({ color: 0x7a6040, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.88 })); water.rotation.x = -Math.PI / 2; water.position.set(x, h * 0.85, 0); g.add(water); return { bs, water, h }; };
      s.coag = mkBasin(xs[2], 0.8, 1.2, 0.5); s.sed = mkBasin(xs[3], 1.2, 1.4, 0.45); s.filt = mkBasin(xs[4], 0.9, 1.2, 0.6); s.chl = mkBasin(xs[5], 0.7, 1.0, 0.45);
      s.paddles = []; for (let i = 0; i < 2; i++) { const p = new T.Group(); const sh = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.6, 8), M.steel()); sh.position.y = 0.2; p.add(sh); for (let k = 0; k < 4; k++) { const bl = new T.Mesh(new T.BoxGeometry(0.28, 0.12, 0.01), M.paint(0x2266aa)); bl.rotation.y = k * Math.PI / 2; bl.position.y = 0.15; bl.position.x = Math.cos(k * Math.PI / 2) * 0.14; bl.position.z = -Math.sin(k * Math.PI / 2) * 0.14; p.add(bl); } p.position.set(xs[2], 0, -0.3 + i * 0.6); g.add(p); s.paddles.push(p); }
      s.sludge = new T.Mesh(new T.BoxGeometry(1.1, 0.06, 1.3), new T.MeshStandardMaterial({ color: 0x6a5232, roughness: 1, map: G.noiseTex([106, 82, 50], 30) })); s.sludge.position.set(xs[3], 0.05, 0); g.add(s.sludge);
      [[0.04, 0x5a5652, "gravel"], [0.16, 0xd8c79a, "sand"]].forEach(([y, col], i) => { const l = new T.Mesh(new T.BoxGeometry(0.84, i ? 0.22 : 0.12, 1.14), new T.MeshStandardMaterial({ color: col, map: G.noiseTex(i ? [216, 199, 154] : [90, 86, 82], 40, 9000), roughness: 1 })); l.position.set(xs[4], i ? 0.25 : 0.08, 0); g.add(l); });
      s.cyl = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.45, 24), M.paint(0x3a9a3a)); s.cyl.position.set(xs[5] + 0.5, 0.23, -0.5); s.cyl.castShadow = true; g.add(s.cyl); const vlv = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.08, 12), M.brass()); vlv.position.set(xs[5] + 0.5, 0.5, -0.5); g.add(vlv);
      const tower = new T.Mesh(new T.CylinderGeometry(0.38, 0.38, 0.5, 32), M.paint(0xd8dde2)); tower.position.set(xs[6], 1.4, 0); g.add(tower); [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b2]) => { const leg = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 1.15, 8), M.steel()); leg.position.set(xs[6] + a * 0.25, 0.57, b2 * 0.25); g.add(leg); });
      for (let i = 0; i < 3; i++) { const hs = new T.Group(); const wall = S.mk.box(0.3, 0.22, 0.26, M.matte(0xe8dcc4, 0.9)); sc.remove(wall); wall.position.y = 0.11; hs.add(wall); const roof = new T.Mesh(new T.ConeGeometry(0.24, 0.16, 4), M.matte(0x8a3a2a, 0.8)); roof.rotation.y = Math.PI / 4; roof.position.y = 0.3; hs.add(roof); hs.position.set(2.8 + i * 0.42, 0, -1.6); g.add(hs); }
      s.pipeFlow = []; const path = [[xs[0], 0.35, 0.3], [xs[1], 0.95, -0.2], [xs[1], 0.25, 0.5], [xs[2], 0.42, 0.0], [xs[3], 0.38, 0.0], [xs[4], 0.5, 0.0], [xs[5], 0.38, 0], [xs[6], 1.2, 0], [xs[6], 0.1, -0.6], [3.6, 0.1, -1.5]];
      const curve = new T.CatmullRomCurve3(path.map((p) => V3(...p))); const pm = S.mk.tube(curve.getPoints(80), 0.02, new T.MeshPhysicalMaterial({ color: 0xbfd4e0, transparent: true, opacity: 0.25, roughness: 0.05 }), 120); sc.remove(pm); g.add(pm);
      s.dots = new T.InstancedMesh(new T.SphereGeometry(0.03, 8, 6), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }), 50); s.dots.frustumCulled = false; g.add(s.dots); s.curve = curve; s.ph = 0;
      s.mud = new T.Points(new T.BufferGeometry(), new T.PointsMaterial({ color: 0x5a4022, size: 0.025, transparent: true, depthWrite: false })); const n = 800, mp = new Float32Array(n * 3); s.mudP = []; for (let i = 0; i < n; i++) { const st = Math.floor(Math.random() * 3); s.mudP.push({ st, x: rnd(-0.35, 0.35) * (st === 1 ? 1.4 : 1), y: rnd(0.05, 0.4), z: rnd(-0.55, 0.55), v: rnd(0.02, 0.08) }); } s.mud.geometry.setAttribute("position", new T.BufferAttribute(mp, 3)); g.add(s.mud);
    },
    update(S, s, c, dt) {
      const t = S.t, opt = 10 + 0.45 * c.ntu, eff = clamp(1 - Math.abs(c.alum - opt) / (opt * 0.9), 0, 0.97) * (c.alum > 0 ? 1 : 0), afterSed = c.ntu * (1 - 0.94 * eff) * (c.alum > 0 ? 1 : 0.8), afterFilt = afterSed * (eff > 0.3 ? 0.08 : 0.35); s.opt = opt; s.eff = eff; s.sedNTU = afterSed; s.final = afterFilt; s.resid = Math.max(0, c.cl - (0.6 + afterFilt * 0.02));
      const col = (ntu) => G.col(G.mix([70, 150, 200], [138, 106, 64], clamp(ntu / 150, 0, 1))); s.river.material.color.copy(col(c.ntu)); s.coag.water.material.color.copy(col(c.ntu)); s.sed.water.material.color.copy(col(afterSed)); s.filt.water.material.color.copy(col(afterSed * 0.5)); s.chl.water.material.color.copy(col(afterFilt));
      [s.coag, s.sed, s.filt, s.chl].forEach((b2, i) => { b2.water.material.opacity = 0.9 - 0.4 * clamp(1 - [c.ntu, afterSed, afterSed * 0.5, afterFilt][i] / 60, 0, 1); });
      s.paddles.forEach((p, i) => { p.rotation.y += dt * (1.5 + i * 0.3); }); s.sludge.scale.y = 0.3 + 2.0 * eff * c.ntu / 150; s.sludge.position.y = 0.03 + 0.03 * s.sludge.scale.y;
      const pa = s.river.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 4 + t * 1.6) * 0.012); pa.needsUpdate = true;
      s.ph = (s.ph + dt * 0.05) % 1; const m4 = new T.Matrix4(), cc = new T.Color(); for (let i = 0; i < 50; i++) { const u = (i / 50 + s.ph) % 1, p = s.curve.getPointAt(u); m4.makeTranslation(p); s.dots.setMatrixAt(i, m4); const ntu = u < 0.35 ? c.ntu : u < 0.5 ? afterSed : u < 0.6 ? afterSed * 0.5 : afterFilt; cc.copy(col(ntu)); s.dots.setColorAt(i, cc); } s.dots.instanceMatrix.needsUpdate = true; if (s.dots.instanceColor) s.dots.instanceColor.needsUpdate = true;
      const mp = s.mud.geometry.attributes.position; s.mudP.forEach((q, i) => { const base = [s.xs[2], s.xs[3], s.xs[4]][q.st]; let y = q.y; if (q.st === 1) { q.y -= q.v * dt * eff * 3; if (q.y < 0.06) q.y = 0.42; y = q.y; } const show = q.st === 0 ? c.ntu > 10 : q.st === 1 ? afterSed > 5 || eff > 0.2 : afterSed > 15; mp.setXYZ(i, base + q.x + Math.sin(t + i) * 0.01, show ? y : -5, q.z); }); mp.needsUpdate = true;
    },
    overlay(ctx, s, c, w, h, S) {
      const px = w - 250; ctx.save(); G.titles(ctx, "Treatment of town water supply", "river → screen → aerate → coagulate → settle → filter → chlorinate → store");
      STAGES.forEach((n, i) => G.tag(ctx, S, V3(s.xs[i], i === 6 ? 2.0 : 0.95 + (i % 2) * 0.22, i === 0 ? 0.3 : 0), (i + 1) + ". " + n, "#cfe0f5", 7.5));
      G.panel(ctx, px, 58, 240, "Water quality", ["raw water: " + c.ntu + " NTU", "best alum dose ≈ " + Math.round(s.opt) + " mg/dm³ (jar test); flocculation " + Math.round(s.eff * 100) + " %", "after settling: " + s.sedNTU.toFixed(1) + " NTU", ["after filtering: " + s.final.toFixed(2) + " NTU " + (s.final <= 1 ? "(good, WHO < 1)" : s.final <= 5 ? "(acceptable < 5)" : "(TOO CLOUDY)"), s.final <= 1 ? "#8dffb8" : s.final <= 5 ? "#ffe9b8" : "#ff9aa8"], ["residual chlorine: " + s.resid.toFixed(2) + " mg/dm³ " + (s.resid < 0.2 ? "(too low: germs survive)" : s.resid > 0.8 ? "(too high: taste/smell)" : "(safe)"), s.resid < 0.2 || s.resid > 0.8 ? "#ff9aa8" : "#8dffb8"], "Cl₂ + H₂O ⇌ HCl + HOCl (HOCl kills bacteria)"]);
      ctx.restore();
    },
    readouts(s, c) { return [["Final turbidity", s.final.toFixed(2) + " NTU"], ["Residual chlorine", s.resid.toFixed(2) + " mg/dm³"], ["Coagulation efficiency", Math.round(s.eff * 100) + " %"]]; },
  };

  /* =============================== fountain experiment =============================== */
  const GASES = [{ f: "HCl", n: "hydrogen chloride", sol: 450, acid: 1 }, { f: "NH₃", n: "ammonia", sol: 700, acid: -1 }, { f: "SO₂", n: "sulphur(IV) oxide", sol: 40, acid: 1 }, { f: "CO₂", n: "carbon(IV) oxide", sol: 0.9, acid: 0.3 }, { f: "O₂", n: "oxygen", sol: 0.03, acid: 0 }];
  const INDS = [{ n: "blue litmus", base: [60, 90, 210], acid: [210, 50, 55], alk: [60, 90, 210] }, { n: "red litmus", base: [205, 60, 60], acid: [205, 60, 60], alk: [60, 90, 210] }, { n: "phenolphthalein", base: [228, 238, 246], acid: [228, 238, 246], alk: [226, 40, 140] }, { n: "methyl orange", base: [246, 190, 40], acid: [226, 50, 40], alk: [246, 190, 40] }];
  C3.scenes.fountain = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 28, shadowArea: 11 }, envI: 0.75, fov: 36, free: true, cam: [[1.2, 3.0, 7.6], [0.8, 2.2, 0]],
    values: { gas: 0, ind: 0 },
    state: () => ({}),
    get controls() { return [{ type: "select", key: "gas", label: "Dry gas in the flask", options: GASES.map((m, i) => ({ value: i, label: m.f + " — " + m.n + " (" + m.sol + " vol per vol of water)" })) }, { type: "select", key: "ind", label: "Indicator in the trough water", options: INDS.map((m, i) => ({ value: i, label: m.n })) }, { type: "button", label: "Squeeze the dropper (a few drops of water in)", action: (S, s) => { if (!s.go) { s.go = 1; s.t0 = S.t; } } }, { type: "button", label: "Refill the flask with dry gas", cls: "secondary", action: (S, s) => { s.go = 0; s.fill = 0; } }]; },
    views: [{ label: "Apparatus", cam: [[1.2, 3.0, 7.6], [0.8, 2.2, 0]] }, { label: "Flask", cam: [[0.6, 3.6, 3.6], [0.1, 3.4, 0]] }],
    note: "The fountain experiment shows that hydrogen chloride and ammonia are extremely soluble in water (about 450 and 700 volumes per volume of water at room temperature). A few drops of water squeezed into the dry flask dissolve so much gas that the pressure inside falls; atmospheric pressure then forces water up the tube as a fountain. The indicator shows the solution formed: HCl gives an acid (blue litmus → red), NH₃ gives an alkali (phenolphthalein → pink, red litmus → blue). Gases of low solubility (O₂, CO₂) give no fountain. The flask and gas must be dry, otherwise the gas dissolves before the experiment starts.",
    onChange(S, s) { s.go = 0; s.fill = 0; },
    reset(S, s, c) { Object.assign(c, { gas: 0, ind: 0 }); s.go = 0; s.fill = 0; },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(9, 0.06, 3.6, M.matte(0xb69a76, 0.62), 0.4, 0, 0).receiveShadow = true;
      const tr = K.vessel(G.DEFS.trough); tr.group.scale.set(0.8, 1.0, 0.8); s.trL = tr.addLiquid({ color: [60, 90, 210], opacity: 0.4 }); s.trL.setVolume(1900); s.tr = tr;
      const st = K.retort({ x: -1.2, z: -0.7, h: 80 }); const fl = K.vessel(G.DEFS.rbflask); fl.group.rotation.x = Math.PI; fl.group.position.set(0, 4.65, 0); s.fl = fl; s.flL = fl.addLiquid({ color: [60, 90, 210], opacity: 0.45 }); s.flL.cap.visible = false;
      K.clampArm(st, (4.65 - 15.5 * CM) / CM, 0, 0, 1.6); const bung = G.bung(S, 1.45, 2.0); bung.rotation.x = Math.PI; bung.position.set(0, 4.65 - 17.2 * CM, 0);
      s.tube = G.glassTube(S, K, [V3(0.05, 0.2, 0), V3(0.05, 4.65 - 10 * CM, 0)], 0.3, 0.14); s.flowL = new T.Mesh(new T.CylinderGeometry(0.2 * CM, 0.2 * CM, 1, 10), K.liquidMat(G.col([60, 90, 210]), 0.6)); s.flowL.renderOrder = 3; sc.add(s.flowL);
      const drop = new T.Group(); const dg = G.glassTube(S, K, [V3(-0.12, 4.65 - 14 * CM, 0), V3(-0.12, 4.65 - 18.8 * CM, 0)], 0.2, 0.2); sc.remove(dg); drop.add(dg); s.bulb = new T.Mesh(new T.SphereGeometry(0.9 * CM, 20, 16), M.rubber()); s.bulb.material.color.setHex(0xb03a1a); s.bulb.scale.y = 1.6; s.bulb.position.set(-0.12, 4.65 - 20.3 * CM, 0); drop.add(s.bulb); sc.add(drop);
      s.spray = new T.Points(new T.BufferGeometry(), new T.PointsMaterial({ color: 0x5f80e0, size: 0.04, map: U.softDot(32, "rgba(255,255,255,1)"), transparent: true, depthWrite: false })); s.sp = []; const n = 240, pp = new Float32Array(n * 3); for (let i = 0; i < n; i++) s.sp.push({ age: Math.random(), vx: rnd(-0.5, 0.5), vz: rnd(-0.5, 0.5), vy: rnd(2.2, 3.2) }); s.spray.geometry.setAttribute("position", new T.BufferAttribute(pp, 3)); sc.add(s.spray);
      s.jet = new T.Mesh(new T.CylinderGeometry(0.012, 0.02, 1, 10), K.liquidMat(G.col([60, 90, 210]), 0.7)); sc.add(s.jet); s.go = 0; s.fill = 0;
    },
    update(S, s, c, dt) {
      const Gs = GASES[c.gas | 0], I = INDS[c.ind | 0], t = S.t, el = s.go ? t - s.t0 : 0; const strong = Gs.sol > 100, med = Gs.sol > 10; const maxFill = strong ? 0.94 : med ? 0.55 : Gs.sol > 0.5 ? 0.03 : 0;
      const rate = strong ? 0.16 : med ? 0.03 : 0.004; if (s.go && el > 0.8 && dt > 0) s.fill = Math.min(maxFill, s.fill + rate * dt * (strong ? 1 : 1)); s.bulb.scale.set(s.go && el < 0.8 ? 0.7 : 1, 1.6, s.go && el < 0.8 ? 0.7 : 1);
      const kind = Gs.acid > 0.5 ? "acid" : Gs.acid < 0 ? "alk" : Gs.acid > 0 && s.fill > 0.01 ? "acid" : "base"; const col = I[kind]; s.flL.setColor(col, 0.5); s.trL.setColor(I.base, 0.35);
      s.flL.update(t); const fy = 4.65, neckBot = fy - 17.2 * CM, bulbTop = fy, R = 5 * CM; const level = neckBot + 0.2 + (fy - (neckBot + 0.2)) * Math.cbrt(s.fill) * 0.98; s.flL.mat.clippingPlanes[0].constant = level; s.flL.mat.userData.u.uSurf.value = level;
      const flowing = s.go && el > 0.8 && s.fill < maxFill - 0.002 && maxFill > 0.02; const tipY = fy - 10 * CM; s.flowL.visible = flowing; s.flowL.scale.y = tipY - 0.2; s.flowL.position.set(0.05, (tipY + 0.2) / 2, 0); s.flowL.material.color.copy(G.col(I.base));
      s.jet.visible = flowing; const jh = strong ? 0.5 + 0.2 * Math.sin(t * 12) : 0.2; s.jet.scale.y = jh; s.jet.position.set(0.05, tipY + jh / 2, 0); s.jet.material.color.copy(G.col(col));
      const pa = s.spray.geometry.attributes.position; s.spray.visible = flowing && strong; s.spray.material.color.copy(G.col(col)); s.sp.forEach((q, i) => { q.age += dt * 1.6; if (q.age > 1) { q.age = 0; } const tt = q.age * 0.35; const y = tipY + jh + q.vy * tt - 4.9 * tt * tt; pa.setXYZ(i, 0.05 + q.vx * tt, Math.min(y, fy + R * 0.9), q.vz * tt); }); pa.needsUpdate = true; s.trL.update(t);
    },
    overlay(ctx, s, c, w, h, S) {
      const Gs = GASES[c.gas | 0], I = INDS[c.ind | 0], px = w - 250; ctx.save(); G.titles(ctx, "The fountain experiment: " + Gs.f, Gs.sol + " volumes of " + Gs.n + " dissolve in 1 volume of water");
      const res = Gs.sol > 100 ? "a FOUNTAIN: water rushes in and almost fills the flask" : Gs.sol > 10 ? "water rises slowly into the flask" : "no fountain: the gas is only slightly soluble";
      const col = Gs.acid > 0.5 ? "acidic solution: " + I.n + " → " + (I.acid === I.base ? "no change" : "changes colour") : Gs.acid < 0 ? "alkaline solution: " + I.n + " → " + (I.alk === I.base ? "no change" : "changes colour") : "neutral / very weakly acidic";
      G.panel(ctx, px, 58, 240, "Observation", [s.go ? res : "squeeze the dropper to start", s.go ? col : "", "flask filled: " + Math.round(s.fill * 100) + " %", Gs.f === "HCl" ? "HCl(g) + H₂O(l) → H₃O⁺(aq) + Cl⁻(aq)" : Gs.f === "NH₃" ? "NH₃(g) + H₂O(l) ⇌ NH₄⁺(aq) + OH⁻(aq)" : Gs.f === "SO₂" ? "SO₂ + H₂O ⇌ H₂SO₃ (weak acid)" : ""]);
      G.tag(ctx, S, V3(0, 5.15, 0), "dry " + Gs.f, "#ffe9b8", 9); G.tag(ctx, S, V3(0.9, 1.75, 0), "water + " + I.n, "#cfe0f5", 8.5); ctx.restore();
    },
    readouts(s, c) { const Gs = GASES[c.gas | 0]; return [["Gas", Gs.n], ["Solubility", Gs.sol + " vol / vol water"], ["Flask filled", Math.round(s.fill * 100) + " %"]]; },
  };

  /* =============================== allotropes of sulphur =============================== */
  const SM = ["Rhombic (α) sulphur: crystals from CS₂ solution", "Monoclinic (β) sulphur: needles from molten sulphur", "Plastic (amorphous) sulphur: boiling sulphur poured into water", "Effect of heat on sulphur"];
  function s8(K) { const atoms = [], bonds = []; const r = 2.34 * 0.5 / 0.5 * 0.5 + 0.0; for (let k = 0; k < 8; k++) { const a = k * TAU / 8; atoms.push({ el: "S", p: [1.17 * 1.0 * Math.cos(a) * 1.0 * 2, (k % 2 ? 0.5 : -0.5), 1.17 * 2 * Math.sin(a)] }); bonds.push([k, (k + 1) % 8, 1]); } void r; return { atoms, bonds }; }
  function chain(n) { const atoms = [], bonds = []; for (let k = 0; k < n; k++) { const a = k * 1.9; atoms.push({ el: "S", p: [k * 1.6 - n * 0.8, Math.sin(a) * 0.6, Math.cos(a) * 0.6] }); if (k) bonds.push([k - 1, k, 1]); } return { atoms, bonds }; }
  C3.scenes.sulphurAllotropes = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.75, fov: 36, free: true, cam: [[1.4, 2.6, 7.0], [0.9, 1.3, 0]],
    values: { mode: 0, T: 25 },
    state: () => ({}),
    get controls() { return [{ type: "select", key: "mode", label: "Form of sulphur", options: SM.map((m, i) => ({ value: i, label: m })) }, { type: "range", key: "T", label: "Temperature of the sulphur (°C)", min: 20, max: 460, step: 1 }, { type: "button", label: "Run (crystallise / pour)", action: (S, s) => { s.go = 1; s.t0 = S.t; } }, { type: "button", label: "Start again", cls: "secondary", action: (S, s) => { s.go = 0; } }]; },
    views: [{ label: "Bench", cam: [[1.4, 2.6, 7.0], [0.9, 1.3, 0]] }, { label: "Molecule", cam: [[1.6, 2.2, 3.6], [1.6, 1.8, 0]] }],
    note: "Sulphur shows allotropy. Rhombic (α) sulphur, stable below 96 °C, forms bright yellow octahedral crystals when a solution in carbon disulphide evaporates. Monoclinic (β) sulphur, stable from 96 °C to its melting point (119 °C), forms long needle-shaped crystals when molten sulphur cools. Both are made of crown-shaped S₈ rings. 96 °C is the transition temperature. Plastic sulphur is made by pouring boiling sulphur into cold water: the long chains are frozen in a rubbery, brown, amorphous solid that slowly turns back to rhombic sulphur. On heating, sulphur melts to a mobile amber liquid; at about 160 °C the S₈ rings break and join into long chains so the liquid becomes dark red-brown and very viscous (most viscous near 190 °C); above about 250 °C the chains break up and it becomes runny again; it boils at 444 °C giving an orange-brown vapour.",
    onChange(S, s, c, key) { if (key === "mode") { s.go = 0; if ((c.mode | 0) === 3 && c.T < 100) c.T = 120; } },
    reset(S, s, c) { Object.assign(c, { mode: 0, T: 25 }); s.go = 0; },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(10, 0.06, 3.6, M.matte(0xb69a76, 0.62), 0.6, 0, 0).receiveShadow = true;
      const yel = new T.MeshPhysicalMaterial({ color: 0xf2d22a, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.88, emissive: 0x2a2000 });
      s.gR = new T.Group(); sc.add(s.gR); const wg = K.vessel(G.DEFS.dish, { noAdd: true }); wg.group.scale.set(1, 0.4, 1); s.gR.add(wg.group); s.wgL = wg.addLiquid({ color: [240, 236, 200], opacity: 0.3 });
      s.rh = G.crystals(26, "oct", [242, 210, 42], 1.5, { mat: yel }); s.gR.add(s.rh); s.rhP = []; for (let i = 0; i < 26; i++) { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * 4.6 * CM; s.rhP.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, ry: rnd(0, 3), rx: rnd(-0.4, 0.4), s: rnd(0.6, 1.3) }); }
      s.gM = new T.Group(); sc.add(s.gM); const cone = new T.Mesh(new T.ConeGeometry(0.55, 0.8, 40, 1, true), new T.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.95, side: T.DoubleSide, transparent: true, opacity: 0.95 })); cone.rotation.x = Math.PI; cone.position.y = 0.42 + 0.4; s.gM.add(cone); const fun = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.42, 16), M.matte(0x8a6a4a, 0.8)); fun.position.y = 0.21; s.gM.add(fun);
      s.ne = G.crystals(60, "needle", [236, 214, 80], 0.5, { mat: new T.MeshPhysicalMaterial({ color: 0xe8d050, roughness: 0.2, clearcoat: 0.8, transparent: true, opacity: 0.9 }) }); s.gM.add(s.ne); s.neP = []; for (let i = 0; i < 60; i++) { const a = rnd(0, TAU), hh = rnd(0.1, 0.75); s.neP.push({ a, hh, r: (0.55 * (hh / 0.8)) * 0.95, rot: rnd(-0.6, 0.6) }); }
      s.gP = new T.Group(); sc.add(s.gP); const bk = K.beaker(); sc.remove(bk.group); bk.group.scale.set(1.3, 1.2, 1.3); s.gP.add(bk.group); s.pw = bk.addLiquid({ color: [210, 232, 246], opacity: 0.2 }); s.pw.setVolume(160);
      const pts = []; for (let i = 0; i < 90; i++) { const a = i * 0.45; pts.push(V3(Math.cos(a) * (1.2 + i * 0.012) * CM, (0.8 + i * 0.05) * CM, Math.sin(a) * (1.2 + i * 0.012) * CM)); } s.plastic = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 200, 0.25 * CM, 10), new T.MeshPhysicalMaterial({ color: 0x7a3a12, roughness: 0.35, clearcoat: 0.7, transparent: true, opacity: 0.92 })); bk.group.add(s.plastic); s.plastic.geometry.setDrawRange(0, 0);
      s.gH = new T.Group(); sc.add(s.gH); const st = K.retort({ x: -0.6, z: -0.6, h: 50 }); sc.remove(st); s.gH.add(st); const bt = K.vessel(G.DEFS.boilingtube, { noAdd: true }); bt.group.position.set(0, 2.45, 0); bt.group.rotation.z = 0.25; s.gH.add(bt.group); s.sL = bt.addLiquid({ color: [240, 210, 40], opacity: 0.85 }); s.sL.setVolume(16);
      const ca = K.clampArm(st, (2.45 + Math.cos(0.25) * 9 * CM) / CM, -Math.sin(0.25) * 9 * CM, 0, 1.2); sc.remove(ca); s.gH.add(ca); s.bn = K.bunsen({ x: 0, z: 0 }); sc.remove(s.bn); s.gH.add(s.bn); s.sB = K.bubbles(bt, s.sL, { n: 30, spread: 0.4 }); s.solidS = G.heap(0.95, 2.4, [242, 214, 60]); s.solidS.position.y = 0.3 * CM; bt.group.add(s.solidS);
      s.vap = []; for (let i = 0; i < 16; i++) { const sp = new T.Sprite(new T.SpriteMaterial({ map: U.softDot(64, "rgba(255,255,255,1)"), color: 0xc8701a, transparent: true, opacity: 0, depthWrite: false })); sp.scale.setScalar(0.25); s.gH.add(sp); s.vap.push({ sp, f: Math.random() }); }
      s.ring = G.molecule(K, s8(K), { scale: 0.3, pos: [-1.6, 2.0, -0.3] }); s.chainM = G.molecule(K, chain(8), { scale: 0.26, pos: [-1.6, 2.0, -0.3] });
      s.go = 0;
    },
    update(S, s, c, dt) {
      const m = c.mode | 0, t = S.t, el = s.go ? t - s.t0 : 0; s.gR.visible = m === 0; s.gM.visible = m === 1; s.gP.visible = m === 2; s.gH.visible = m === 3;
      const chains = (m === 2 && el > 0.5) || (m === 3 && c.T > 159 && c.T < 444); s.ring.group.visible = !chains; s.chainM.group.visible = chains; s.ring.group.rotation.y += dt * 0.4; s.chainM.group.rotation.y += dt * 0.3;
      if (m === 0) { const k = s.go ? G.smooth(0, 6, el) : 0; s.wgL.setVolume(Math.max(0.05, 20 * (1 - k))); s.wgL.update(t); s.rh.layout((i) => { const q = s.rhP[i], g2 = clamp(k * 1.4 - i / 40, 0, 1); return { x: q.x, y: 0.6 * CM, z: q.z, rx: q.rx, ry: q.ry, s: q.s * g2 + 0.001, sy: 2.6 }; }); }
      else if (m === 1) { const k = s.go ? G.smooth(0, 5, el) : 0; s.ne.layout((i) => { const q = s.neP[i], g2 = clamp(k * 1.5 - i / 80, 0, 1); return { x: Math.cos(q.a) * q.r * 0.9, y: 0.42 + q.hh, z: Math.sin(q.a) * q.r * 0.9, ry: -q.a, rx: q.rot, s: g2 + 0.001 }; }); }
      else if (m === 2) { const k = s.go ? G.smooth(0.2, 3, el) : 0; s.plastic.geometry.setDrawRange(0, Math.floor(k * 200 * 10 * 6)); s.pw.update(t); s.puT = (s.puT || 0) + dt; if (s.go && el < 3 && s.puT > 0.2) { s.puT = 0; G.wisp(S, 0, 1.4, 0, 0xf4f6f8, { op: 0.3 }); } }
      else { const T2 = c.T, melted = T2 >= 119; s.solidS.visible = !melted; s.sL.setVisible(melted); const colr = T2 < 160 ? G.mix([246, 214, 40], [214, 140, 30], clamp((T2 - 119) / 40, 0, 1)) : T2 < 250 ? G.mix([140, 50, 18], [90, 24, 10], clamp((T2 - 160) / 90, 0, 1)) : [70, 18, 8];
        s.sL.setColor(colr, melted ? 0.9 : 0.5); s.sL.setVolume(16); s.sL.update(t); s.bn.setGas(T2 > 30 ? clamp((T2 - 30) / 200, 0.3, 1) : 0); s.bn.flame.update(t); s.sB.rate = T2 >= 440 ? 30 : 0; s.sB.update(dt, t);
        const vis = T2 >= 430 ? clamp((T2 - 430) / 20, 0, 1) : 0; s.vap.forEach((v) => { v.f = (v.f + dt * 0.15) % 1; v.sp.position.set(-Math.sin(0.25) * (0.6 + v.f * 1.8), 2.45 + Math.cos(0.25) * (0.6 + v.f * 1.8), 0); v.sp.material.opacity = vis * 0.45 * Math.sin(v.f * Math.PI); }); }
    },
    overlay(ctx, s, c, w, h, S) {
      const m = c.mode | 0, px = w - 250, T2 = c.T; ctx.save(); G.titles(ctx, SM[m], ["S₈ rings packed in an orthorhombic lattice; stable below 96 °C", "S₈ rings packed in a monoclinic lattice; stable 96–119 °C", "long tangled Sₙ chains frozen in place", "rings → chains → shorter chains → vapour"][m]);
      G.tag(ctx, S, V3(-1.6, 2.75, -0.3), s.chainM.group.visible ? "Sₙ chain" : "S₈ crown ring", "#ffe9b8", 9);
      let rows;
      if (m === 0) rows = ["dissolve powdered sulphur in carbon disulphide (CS₂), filter, let the solvent evaporate in a covered dish", "bright yellow, octahedral (rhombic) crystals; density 2.06 g/cm³", "CS₂ is very flammable and poisonous: no flames, fume cupboard"];
      else if (m === 1) rows = ["melt sulphur, pour into a filter-paper cone, let a crust form, then open it", "long, thin, pale-yellow needle-shaped crystals; density 1.98 g/cm³", "kept at room temperature they slowly change back into rhombic sulphur (below 96 °C)"];
      else if (m === 2) rows = ["heat sulphur until it boils, then pour it in a thin stream into cold water", "brown, rubbery, elastic threads (chains of S atoms)", "not crystalline; hardens to rhombic sulphur over a few days"];
      else { const visc = T2 < 119 ? "solid" : T2 < 159 ? "mobile (runny) amber liquid" : T2 < 250 ? "very viscous, dark red-brown (max near 190 °C)" : T2 < 444 ? "runny again, almost black" : "boiling: orange-brown vapour"; rows = ["temperature: " + T2 + " °C", [visc, "#ffe9b8"], "m.p. 113 °C (rhombic) / 119 °C (monoclinic)", "b.p. 444 °C", "rings break at 160 °C and the chains tangle → viscous"];
        H.panel(ctx, px, 186, 240, 42); ctx.fillStyle = "#8fb4ff"; ctx.font = "600 9px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; ctx.fillText("viscosity", px + 8, 200); const vb = T2 < 119 ? 0 : T2 < 159 ? 0.12 : T2 < 190 ? 0.12 + 0.88 * (T2 - 159) / 31 : T2 < 300 ? 1 - 0.8 * (T2 - 190) / 110 : 0.2; ctx.fillStyle = "#ffb35c"; ctx.fillRect(px + 70, 192, 160 * vb, 10); ctx.strokeStyle = "#9fb2d2"; ctx.strokeRect(px + 70, 192, 160, 10); }
      G.panel(ctx, px, 58, 240, "Observations", rows); ctx.restore();
    },
    readouts(s, c) { const m = c.mode | 0; return [["Allotrope", ["rhombic (α)", "monoclinic (β)", "plastic (amorphous)", "molten sulphur"][m]], ["Temperature", m === 3 ? c.T + " °C" : "—"], ["Molecules", s.chainM.group.visible ? "Sₙ chains" : "S₈ rings"]]; },
    table() { return G.table(["Property", "Rhombic (α)", "Monoclinic (β)"], [["Shape", "octahedral crystals", "needles"], ["Colour", "bright yellow", "pale yellow"], ["Stable range", "below 96 °C", "96–119 °C"], ["Density / g cm⁻³", "2.06", "1.98"], ["Melting point", "113 °C", "119 °C"]]); },
  };
})();
