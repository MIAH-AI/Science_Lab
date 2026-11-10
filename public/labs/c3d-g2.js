/* c3d-g2.js — chemistry 3D gap scenes: criteria for purity (melting point, boiling point, chromatography) and naming ionic compounds (IUPAC) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready || !C3.gx) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, G = C3.gx, CM = C3.CM, TAU = Math.PI * 2;
  const { clamp, lerp } = G, rnd = U.rnd;

  /* =============================== criteria for purity =============================== */
  const MP = [
    { label: "Benzoic acid — pure", ts: 121.6, te: 122.3, pure: true },
    { label: "Benzoic acid + 10 % impurity", ts: 109.5, te: 117.5, pure: false },
    { label: "Naphthalene — pure", ts: 80.0, te: 80.4, pure: true },
    { label: "Naphthalene + 10 % impurity", ts: 72.5, te: 78.0, pure: false },
  ];
  const CHR = [
    { label: "Test sample is pure (same as the standard)", spots: [[0.62, [210, 40, 60]]] },
    { label: "Test sample contains an impurity", spots: [[0.62, [210, 40, 60]], [0.31, [240, 190, 30]]] },
    { label: "Test sample is a mixture of three dyes", spots: [[0.78, [40, 90, 210]], [0.48, [230, 170, 30]], [0.22, [200, 40, 120]]] },
  ];
  const KB = 0.512, LH = 40700, R = 8.314;
  const bpWater = (kPa) => 1 / (1 / 373.15 - (R * Math.log(kPa / 101.325)) / LH) - 273.15;
  const MODES = ["Melting point (Thiele tube)", "Boiling point (pure water vs salt solution)", "Paper chromatography (spots and Rf)"];

  C3.scenes.purityCriteria = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 28, shadowArea: 11 }, envI: 0.72, fov: 36, free: true, cam: [[0.8, 3.2, 8.2], [0, 2.6, 0]],
    values: { mode: 0, mp: 0, rate: 2, salt: 0, P: 101.3, chr: 1, run: 1 },
    state: () => ({ T: 25, t: 0, hist: [], f: 0, vol: 1 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Test of purity", options: MODES.map((m, i) => ({ value: i, label: m })) },
        { type: "select", key: "mp", label: "Melting point: sample in the capillary", options: MP.map((m, i) => ({ value: i, label: m.label })) },
        { type: "range", key: "rate", label: "Melting point: heating rate near the m.p. (°C/min)", min: 1, max: 10, step: 0.5 },
        { type: "range", key: "salt", label: "Boiling point: dissolved NaCl (mol per kg water)", min: 0, max: 2, step: 0.1 },
        { type: "range", key: "P", label: "Boiling point: atmospheric pressure (kPa)", min: 60, max: 110, step: 0.5 },
        { type: "select", key: "chr", label: "Chromatography: test sample", options: CHR.map((m, i) => ({ value: i, label: m.label })) },
        { type: "toggle", key: "run", label: "Heat / run (time-lapse)" },
        { type: "button", label: "Start again", cls: "secondary", action: (S, s, c) => { restart(s, c); } },
      ];
    },
    views: [{ label: "This test", cam: (S, s, c) => PV[c.mode | 0] }, { label: "Close", cam: (S, s, c) => PVc[c.mode | 0] }],
    note: "A pure substance has a sharp, fixed melting point and boiling point (at a stated pressure). Impurities lower the melting point and make it melt over a range of temperature; dissolved impurities raise the boiling point (ΔT = K_b·m·i, K_b = 0.512 °C kg/mol for water). Boiling point also depends on pressure: water boils below 100 °C on a mountain. In chromatography a pure substance gives only one spot, with the same R_f as the pure standard (R_f = distance moved by the spot ÷ distance moved by the solvent front).",
    onChange(S, s, c, key) { if (key === "mode") { restart(s, c); C3.setView(S, { cam: PV[c.mode | 0] }); } if (key === "mp" || key === "salt" || key === "chr") restart(s, c); },
    reset(S, s, c) { Object.assign(c, { mode: 0, mp: 0, rate: 2, salt: 0, P: 101.3, chr: 1, run: 1 }); restart(s, c); C3.setView(S, { cam: PV[0] }); },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(9, 0.06, 3.8, M.matte(0xb69a76, 0.62), 0, 0, 0).receiveShadow = true;
      /* ---- (0) Thiele tube with paraffin oil, thermometer + capillary, micro-burner under the side arm ---- */
      const g0 = new T.Group(); sc.add(g0); s.g0 = g0; const st = K.retort({ x: -0.35, z: -0.55, h: 70 }); sc.remove(st); g0.add(st);
      const ty = 1.6, tube = new T.Mesh(new T.CylinderGeometry(1.25 * CM, 1.25 * CM, 15 * CM, 40, 1, true), K.glassMat({ opacity: 0.1, env: 3 })); tube.position.y = ty + 7.5 * CM; tube.renderOrder = 4; g0.add(tube);
      const bot = new T.Mesh(new T.SphereGeometry(1.25 * CM, 32, 16, 0, TAU, Math.PI / 2, Math.PI / 2), K.glassMat({ opacity: 0.1, env: 3 })); bot.position.y = ty; bot.renderOrder = 4; g0.add(bot);
      const arm = [V3(0, ty + 4 * CM, 0), V3(3.5 * CM, ty + 2.5 * CM, 0), V3(5.2 * CM, ty + 1.2 * CM, 0), V3(6.4 * CM, ty + 2.2 * CM, 0), V3(5.6 * CM, ty + 7.5 * CM, 0), V3(1.0 * CM, ty + 11 * CM, 0)];
      const armM = G.glassTube(S, K, arm, 0.75, 0.1); sc.remove(armM); g0.add(armM); const oilA = G.liquidTube(S, K, arm, 0.62, [214, 168, 70], 0.4); sc.remove(oilA); g0.add(oilA);
      const oil = new T.Mesh(new T.CylinderGeometry(1.15 * CM, 1.15 * CM, 12.6 * CM, 32), K.liquidMat(G.col([214, 168, 70]), 0.38)); oil.position.y = ty + 6.1 * CM; oil.renderOrder = 3; g0.add(oil);
      const oilB = new T.Mesh(new T.SphereGeometry(1.15 * CM, 24, 12, 0, TAU, Math.PI / 2, Math.PI / 2), oil.material); oilB.position.y = ty; g0.add(oilB);
      const ca = K.clampArm(st, (ty / CM) + 12, 0, 0, 1.3); sc.remove(ca); g0.add(ca);
      s.th0 = G.thermo(S, { x: 0, y: ty + 2.4 * CM, z: 0.2 * CM, len: 22, min: 0, max: 150, T: 25 }); sc.remove(s.th0.group); g0.add(s.th0.group);
      const cap = new T.Mesh(new T.CylinderGeometry(0.16 * CM, 0.16 * CM, 6 * CM, 12), K.glassMat({ opacity: 0.25, env: 3 })); cap.position.set(0.55 * CM, ty + 2.4 * CM + 3 * CM, 0.25 * CM); cap.renderOrder = 4; g0.add(cap);
      s.sampMat = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 1 }); s.samp = new T.Mesh(new T.CylinderGeometry(0.12 * CM, 0.12 * CM, 0.6 * CM, 10), s.sampMat); s.samp.position.set(0.55 * CM, ty + 2.4 * CM + 0.35 * CM, 0.25 * CM); g0.add(s.samp);
      const band = new T.Mesh(new T.TorusGeometry(0.5 * CM, 0.1 * CM, 8, 20), M.rubber()); band.material.color.setHex(0x9c3b1f); band.rotation.x = Math.PI / 2; band.position.set(0.25 * CM, ty + 2.4 * CM + 4 * CM, 0.1 * CM); g0.add(band);
      const bnz = K.bunsen({ x: 6.0 * CM, z: 0, flameH: 3.2 }); sc.remove(bnz); g0.add(bnz); bnz.scale.setScalar(0.55); bnz.position.y = 0.45; s.bn0 = bnz;
      const blk = S.mk.rbox(0.8, 0.45, 0.8, 0.03, M.matte(0x5a4535, 0.8), 6.0 * CM, 0.225, 0); sc.remove(blk); g0.add(blk);
      /* ---- (1) boiling: flask + thermometer in the vapour on a tripod over a Bunsen ---- */
      const g1 = new T.Group(); sc.add(g1); s.g1 = g1; const tp = G.tripod(S, 0, 0, 20); sc.remove(tp); g1.add(tp); const bn1 = K.bunsen({ x: 0, z: 0 }); sc.remove(bn1); g1.add(bn1); s.bn1 = bn1;
      const fl = K.flask(); sc.remove(fl.group); fl.group.position.y = tp.topY; g1.add(fl.group); s.fl1 = fl; s.w1 = fl.addLiquid({ color: [215, 236, 248], opacity: 0.22 }); s.w1.setVolume(150);
      s.bub1 = K.bubbles(fl, s.w1, { n: 80, spread: 1.6 }); s.chips = G.crystals(6, "lump", [230, 225, 220], 0.35, { mat: M.ceramic(0xe8e4dc) }); fl.group.add(s.chips); s.chips.layout((i) => ({ x: rnd(-1.5, 1.5) * CM, y: 0.55 * CM, z: rnd(-1.5, 1.5) * CM, rx: rnd(0, 3), ry: rnd(0, 3) }));
      const bung = G.bung(S, 1.45, 2.2); sc.remove(bung); bung.position.y = tp.topY + 13.2 * CM; g1.add(bung);
      s.th1 = G.thermo(S, { x: 0, y: tp.topY + 4 * CM, z: 0, len: 20, min: 0, max: 120, T: 25 }); sc.remove(s.th1.group); g1.add(s.th1.group);
      const st1 = K.retort({ x: -1.0, z: -0.6, h: 70 }); sc.remove(st1); g1.add(st1); const ca1 = K.clampArm(st1, tp.topY / CM + 11, 0, 0, 1.6); sc.remove(ca1); g1.add(ca1);
      /* ---- (2) chromatography: beaker of solvent, paper strip on a glass rod ---- */
      const g2 = new T.Group(); sc.add(g2); s.g2 = g2; const bk = K.beaker(); sc.remove(bk.group); bk.group.scale.set(1.25, 1.6, 1.25); g2.add(bk.group); s.solv = bk.addLiquid({ color: [225, 238, 246], opacity: 0.2 }); s.solv.setVolume(22);
      const rod = new T.Mesh(new T.CylinderGeometry(0.25 * CM, 0.25 * CM, 11 * CM, 16), K.glassMat({ opacity: 0.25, env: 3 })); rod.rotation.z = Math.PI / 2; rod.position.y = 15.6 * CM; rod.renderOrder = 4; g2.add(rod);
      s.pc = U.cv(256, 512); s.ptex = new T.CanvasTexture(s.pc); s.ptex.colorSpace = T.SRGBColorSpace; s.ptex.anisotropy = 8;
      const paper = new T.Mesh(new T.PlaneGeometry(4.6 * CM, 14.6 * CM), new T.MeshStandardMaterial({ map: s.ptex, roughness: 0.9, side: T.DoubleSide })); paper.position.set(0, 15.4 * CM - 7.3 * CM, 0); paper.castShadow = true; g2.add(paper); s.paperY0 = 15.4 * CM - 14.6 * CM;
      const lid = new T.Mesh(new T.CylinderGeometry(4.6 * CM * 1.25, 4.6 * CM * 1.25, 0.25 * CM, 48), K.glassMat({ opacity: 0.12, env: 3 })); lid.position.y = 15.9 * CM; lid.renderOrder = 4; g2.add(lid);
      restart(s, c); s.drawn = -1; C3.setView(S, { cam: PV[c.mode | 0] });
    },
    update(S, s, c, dt) {
      const m = c.mode | 0; s.g0.visible = m === 0; s.g1.visible = m === 1; s.g2.visible = m === 2; const run = c.run && dt > 0, t = S.t;
      if (m === 0) {
        const X = MP[c.mp | 0], fast = clamp((X.ts - 12 - s.T) / 10, 0, 1), rateMin = lerp(c.rate, 12, fast); /* fast heating far below the m.p., slow near it */
        if (run) { const dts = dt * 30; s.T += (rateMin / 60) * dts; s.t += dts; if (s.t - (s.lastH || -99) > 15) { s.lastH = s.t; s.hist.push([s.t / 60, s.T]); } }
        const lag = c.rate * 0.18; /* thermometer lag grows with heating rate → reading rises past the true m.p. */ const Ts = s.T - lag; s.f = clamp((Ts - X.ts) / (X.te - X.ts), 0, 1);
        if (Ts >= X.ts && s.mStart == null) s.mStart = s.T; if (s.f >= 1 && s.mEnd == null) s.mEnd = s.T;
        s.th0.set(s.T); s.sampMat.opacity = 1 - 0.85 * s.f; s.sampMat.roughness = lerp(0.9, 0.05, s.f); s.samp.scale.y = lerp(1, 0.75, s.f); s.bn0.setGas(c.run ? 0.9 : 0); s.bn0.flame.update(t);
        if (s.T > 150) { c.run = 0; }
      } else if (m === 1) {
        const mol = c.salt * (1 / Math.max(0.25, s.vol)), bp0 = bpWater(c.P), bp = bp0 + KB * 2 * mol; s.bp = bp; s.bp0 = bp0; s.mol = mol;
        if (run) { const dts = dt * 30; s.t += dts; if (s.T < bp - 0.05) s.T = Math.min(bp, s.T + (1.8 / 60) * dts * 6); else { s.T = bp; s.vol = Math.max(0.3, s.vol - 0.0016 * dts); } if (s.t - (s.lastH || -99) > 20) { s.lastH = s.t; s.hist.push([s.t / 60, s.T]); } }
        s.boiling = s.T >= bp - 0.06 && c.run; s.bub1.rate = s.boiling ? 60 : s.T > 85 && c.run ? 6 : 0; s.w1.setVolume(150 * s.vol); s.w1.agit = s.boiling ? 1 : 0; s.bub1.update(dt, t); s.w1.update(t);
        s.th1.set(s.T); s.bn1.setGas(c.run ? 1 : 0); s.bn1.flame.update(t); s.puffT = (s.puffT || 0) + dt; if (s.boiling && s.puffT > 0.3) { s.puffT = 0; G.wisp(S, 0.05, s.fl1.group.position.y + 2.35, 0.05, 0xf4f8fb, { op: 0.25 }); }
      } else {
        if (run) s.t += dt * 45; const front = clamp(Math.sqrt(s.t / 600) * 0.92, 0, 0.92); s.front = front; /* fraction of paper height above the baseline */
        if (Math.abs(front - s.drawn) > 0.003) { s.drawn = front; drawPaper(s, c); }
        if (front >= 0.92) c.run = 0; s.solv.update(t);
      }
    },
    overlay(ctx, s, c, w, h, S) {
      const m = c.mode | 0, px = w - 250; ctx.save();
      if (m === 0) {
        const X = MP[c.mp | 0]; G.titles(ctx, "Melting point in a Thiele tube", "pure: sharp m.p.;   impure: lower m.p. and a wide melting range");
        G.tag(ctx, S, V3(0.25, s.th0.topY() + 0.12, 0), "θ = " + s.T.toFixed(1) + " °C", "#ffe9b8", 10); G.tag(ctx, S, V3(0.9, 2.05, 0.3), s.f <= 0 ? "solid (white)" : s.f < 1 ? "melting…" : "clear liquid", s.f > 0 && s.f < 1 ? "#ffd27a" : "#cfe0f5", 8.5);
        const xm = Math.max(10, Math.ceil(((s.hist.length ? s.hist[s.hist.length - 1][0] : 0) + 2) / 5) * 5);
        H.graph(ctx, px, 58, 240, 130, { series: [{ pts: s.hist, color: "#ffb35c" }], xmin: 0, xmax: xm, ymin: 20, ymax: 150, xl: "time / min", yl: "θ / °C", dot: [s.t / 60, s.T, "#ffd27a"] });
        G.panel(ctx, px, 194, 240, "Observed melting range", ["first liquid at: " + (s.mStart != null ? s.mStart.toFixed(1) + " °C" : "—"), "all clear at: " + (s.mEnd != null ? s.mEnd.toFixed(1) + " °C" : "—"), s.mEnd != null ? ["range = " + (s.mEnd - s.mStart).toFixed(1) + " °C → " + (s.mEnd - s.mStart < 2 ? "sharp: PURE" : "wide and low: IMPURE"), s.mEnd - s.mStart < 2 ? "#8dffb8" : "#ff9aa8"] : "", c.rate > 4 ? ["heating too fast: the thermometer lags and the reading is too high", "#ff9d8a"] : "heat slowly (1–2 °C/min) near the m.p."]);
      } else if (m === 1) {
        G.titles(ctx, "Boiling point: pure water vs a salt solution", "pure liquid: boils at one fixed temperature;   impure: higher b.p. that keeps rising");
        G.tag(ctx, S, V3(0.25, s.th1.topY() + 0.12, 0), "θ = " + s.T.toFixed(2) + " °C", "#ffe9b8", 10);
        const xm = Math.max(10, Math.ceil(((s.hist.length ? s.hist[s.hist.length - 1][0] : 0) + 2) / 5) * 5);
        H.graph(ctx, px, 58, 240, 130, { series: [{ pts: s.hist, color: "#7fd0ff" }], xmin: 0, xmax: xm, ymin: 20, ymax: 110, xl: "time / min", yl: "θ / °C", dot: [s.t / 60, s.T, "#ffd27a"] });
        G.panel(ctx, px, 194, 240, "Boiling point", ["pure water at " + c.P.toFixed(1) + " kPa: " + s.bp0.toFixed(2) + " °C", "NaCl molality now: " + s.mol.toFixed(2) + " mol/kg (i = 2)", "ΔT = K_b·m·i = 0.512 × " + s.mol.toFixed(2) + " × 2 = " + (s.bp - s.bp0).toFixed(2) + " °C", [c.salt > 0 ? "impure: b.p. raised and rises as water boils off" : "pure: temperature stays constant while it boils", c.salt > 0 ? "#ff9aa8" : "#8dffb8"]]);
        G.status(ctx, s.boiling ? "boiling: bubbles of vapour form throughout the liquid" : "", "info");
      } else {
        const X = CHR[c.chr | 0]; G.titles(ctx, "Paper chromatography: one spot = pure", "left lane: pure standard;   right lane: test sample");
        G.tag(ctx, S, V3(-0.17, s.paperY0 + 0.1, 0.08), "standard", "#cfe0f5", 8); G.tag(ctx, S, V3(0.17, s.paperY0 + 0.1, 0.08), "test", "#cfe0f5", 8);
        const rows = ["solvent front moved " + (s.front * 12).toFixed(1) + " cm", "standard: 1 spot, R_f = 0.62"]; X.spots.forEach((sp, i) => rows.push(["test spot " + (i + 1) + ": R_f = " + sp[0].toFixed(2), G.css(sp[1])])); rows.push([X.spots.length === 1 ? "one spot, same R_f as the standard: PURE" : X.spots.length + " spots: the sample is IMPURE (a mixture)", X.spots.length === 1 ? "#8dffb8" : "#ff9aa8"]);
        G.panel(ctx, px, 58, 240, "R_f = spot distance ÷ solvent distance", rows);
      }
      ctx.restore();
    },
    readouts(s, c) {
      const m = c.mode | 0; if (m === 0) { const X = MP[c.mp | 0]; return [["Thermometer", s.T.toFixed(1) + " °C"], ["Sample", s.f <= 0 ? "solid" : s.f < 1 ? Math.round(s.f * 100) + " % melted" : "liquid"], ["Literature m.p.", X.pure ? X.ts.toFixed(1) + " – " + X.te.toFixed(1) + " °C" : "impure: no fixed m.p."], ["Verdict", s.mEnd == null ? "keep heating" : s.mEnd - s.mStart < 2 ? "pure" : "impure"]]; }
      if (m === 1) return [["Thermometer", s.T.toFixed(2) + " °C"], ["Boiling point now", (s.bp || 100).toFixed(2) + " °C"], ["Pressure", c.P + " kPa"], ["Water left", Math.round(s.vol * 100) + " %"]];
      return [["Solvent front", (s.front * 12 || 0).toFixed(1) + " cm"], ["Spots in test lane", CHR[c.chr | 0].spots.length], ["Verdict", CHR[c.chr | 0].spots.length === 1 ? "pure" : "impure"]];
    },
    steps(s, c) {
      const m = c.mode | 0; if (m === 0) return [["Pack a little dry solid into a capillary sealed at one end", "done"], ["Tie it beside the thermometer bulb and dip both in the oil", "done"], ["Heat the side arm; heat slowly near the m.p.", s.f <= 0 ? "now" : "done"], ["Record the range from the first drop of liquid to all clear", s.f > 0 && s.mEnd == null ? "now" : s.mEnd != null ? "done" : ""]];
      if (m === 1) return [["Add anti-bumping chips", "done"], ["Heat; the thermometer bulb is in the vapour/liquid", s.boiling ? "done" : "now"], ["Read the steady boiling temperature", s.boiling ? "now" : ""]];
      return [["Spot the standard and the test on the pencil base line", "done"], ["Stand the paper in solvent below the base line; cover", "done"], ["Let the solvent rise, mark the front", s.front < 0.9 ? "now" : "done"], ["Count spots and work out R_f", s.front >= 0.9 ? "now" : ""]];
    },
  };
  const PV = [[[1.6, 3.8, 8.6], [0.9, 3.0, 0]], [[1.6, 4.6, 9.0], [0.9, 3.9, 0]], [[1.0, 1.9, 5.4], [0.7, 1.4, 0]]];
  const PVc = [[[0.5, 2.3, 3.4], [0.1, 2.0, 0]], [[0.5, 4.0, 3.8], [0, 3.6, 0]], [[0.2, 1.6, 2.6], [0, 1.4, 0]]];
  function restart(s, c) { s.T = 25; s.t = 0; s.hist = [[0, 25]]; s.lastH = 0; s.mStart = null; s.mEnd = null; s.f = 0; s.vol = 1; s.front = 0; s.drawn = -1; c.run = 1; }
  function drawPaper(s, c) {
    const g = s.pc.getContext("2d"), W = 256, Hh = 512, base = Hh - 70, top = 20, fr = base - (base - top) * s.front / 0.92 * 0.92; g.fillStyle = "#f7f4ec"; g.fillRect(0, 0, W, Hh);
    g.fillStyle = "rgba(170,190,210,0.28)"; g.fillRect(0, fr, W, Hh - fr); g.strokeStyle = "rgba(120,140,160,0.6)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, fr); for (let x = 0; x <= W; x += 8) g.lineTo(x, fr + Math.sin(x * 0.2) * 1.5); g.stroke();
    g.strokeStyle = "#555"; g.lineWidth = 1.2; g.setLineDash([6, 4]); g.beginPath(); g.moveTo(10, base); g.lineTo(W - 10, base); g.stroke(); g.setLineDash([]);
    const lane = (x, spots) => spots.forEach(([rf, col]) => { const y = base - rf * (base - fr), spread = 6 + 22 * s.front * rf; const gr = g.createRadialGradient(x, y, 1, x, y, spread); gr.addColorStop(0, G.css(col, 0.95)); gr.addColorStop(1, G.css(col, 0)); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, spread * 0.85, spread * (0.8 + 0.6 * s.front), 0, 0, TAU); g.fill(); });
    lane(78, [[0.62, [210, 40, 60]]]); lane(178, CHR[c.chr | 0].spots); g.fillStyle = "#333"; g.font = "14px sans-serif"; g.fillText("×", 73, base + 5); g.fillText("×", 173, base + 5); s.ptex.needsUpdate = true;
  }

  /* =============================== naming ionic compounds =============================== */
  const CAT = [
    { f: "Na", n: "sodium", z: 1, r: 102, col: 0xab5cf2 }, { f: "K", n: "potassium", z: 1, r: 138, col: 0x8f40d4 }, { f: "NH₄", n: "ammonium", z: 1, r: 148, poly: "NH4" }, { f: "Ag", n: "silver", z: 1, r: 115, col: 0xc0c0c0 },
    { f: "Mg", n: "magnesium", z: 2, r: 72, col: 0x8aff00 }, { f: "Ca", n: "calcium", z: 2, r: 100, col: 0x3dff00 }, { f: "Zn", n: "zinc", z: 2, r: 74, col: 0x7d80b0 }, { f: "Pb", n: "lead(II)", z: 2, r: 119, col: 0x575961 },
    { f: "Cu", n: "copper(II)", z: 2, r: 73, col: 0xc88033 }, { f: "Fe", n: "iron(II)", z: 2, r: 78, col: 0xe06633 }, { f: "Fe", n: "iron(III)", z: 3, r: 65, col: 0xd0501a }, { f: "Al", n: "aluminium", z: 3, r: 54, col: 0xbfa6a6 },
  ];
  const AN = [
    { f: "Cl", n: "chloride", iu: "chloride", z: 1, mono: "Cl", r: 181 }, { f: "O", n: "oxide", iu: "oxide", z: 2, mono: "O", r: 140 }, { f: "OH", n: "hydroxide", iu: "hydroxide", z: 1, poly: "OH" },
    { f: "NO₃", n: "nitrate", iu: "trioxonitrate(V)", z: 1, X: "N", nO: 3, geo: "planar", bl: 1.25, ox: 5 }, { f: "NO₂", n: "nitrite", iu: "dioxonitrate(III)", z: 1, X: "N", nO: 2, geo: "bent", bl: 1.24, ox: 3 },
    { f: "SO₄", n: "sulphate", iu: "tetraoxosulphate(VI)", z: 2, X: "S", nO: 4, geo: "tet", bl: 1.49, ox: 6 }, { f: "SO₃", n: "sulphite", iu: "trioxosulphate(IV)", z: 2, X: "S", nO: 3, geo: "pyr", bl: 1.51, ox: 4 },
    { f: "CO₃", n: "carbonate", iu: "trioxocarbonate(IV)", z: 2, X: "C", nO: 3, geo: "planar", bl: 1.29, ox: 4 }, { f: "HCO₃", n: "hydrogencarbonate", iu: "hydrogentrioxocarbonate(IV)", z: 1, X: "C", nO: 3, geo: "planar", bl: 1.3, ox: 4, H: true },
    { f: "PO₄", n: "phosphate", iu: "tetraoxophosphate(V)", z: 3, X: "P", nO: 4, geo: "tet", bl: 1.54, ox: 5 }, { f: "ClO₃", n: "chlorate", iu: "trioxochlorate(V)", z: 1, X: "Cl", nO: 3, geo: "pyr", bl: 1.49, ox: 5 },
    { f: "MnO₄", n: "permanganate", iu: "tetraoxomanganate(VII)", z: 1, X: "Mn", nO: 4, geo: "tet", bl: 1.63, ox: 7 },
  ];
  const ROM = ["", "I", "II", "III", "IV", "V", "VI", "VII"], SUB = (n) => (n > 1 ? String(n).replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[d]) : "");
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  function formula(ca, an) { const l = (ca.z * an.z) / gcd(ca.z, an.z), nc = l / ca.z, na = l / an.z; const cf = ca.poly && nc > 1 ? "(" + ca.f + ")" + SUB(nc) : ca.f + SUB(nc); const af = !an.mono && an.f.length > 1 && na > 1 ? "(" + an.f + ")" + SUB(na) : an.f + SUB(na); return { nc, na, f: cf + af }; }
  function colourOf(ca, an) {
    const k = ca.n, a = an.n; if (a === "permanganate") return [[120, 20, 120], "purple crystals"];
    if (k === "copper(II)") return a === "oxide" ? [[30, 30, 32], "black powder"] : a === "carbonate" ? [[60, 150, 110], "green powder"] : a === "hydroxide" ? [[110, 170, 225], "pale blue solid"] : a === "chloride" ? [[70, 160, 150], "blue-green crystals"] : [[40, 110, 220], "blue crystals (hydrated)"];
    if (k === "iron(II)") return a === "oxide" ? [[30, 30, 30], "black powder"] : a === "hydroxide" ? [[90, 120, 80], "dirty-green solid"] : [[170, 215, 170], "pale green crystals"];
    if (k === "iron(III)") return a === "oxide" ? [[150, 50, 30], "red-brown powder"] : a === "hydroxide" ? [[150, 70, 30], "red-brown solid"] : [[215, 170, 70], "yellow-brown solid"];
    if (k === "lead(II)" && a === "oxide") return [[230, 190, 60], "yellow powder (orange-red when hot)"]; if (k === "silver" && a === "oxide") return [[70, 50, 40], "brown-black powder"]; if (k === "silver" && a === "phosphate") return [[235, 210, 80], "yellow solid"]; if (k === "zinc" && a === "oxide") return [[248, 248, 245], "white (yellow when hot)"];
    return [[248, 248, 246], "white solid"];
  }
  function exists(ca, an) {
    if (an.n === "hydrogencarbonate" && !["sodium", "potassium", "ammonium"].includes(ca.n)) return ca.n === "calcium" || ca.n === "magnesium" ? "exists only in solution (temporary hardness of water)" : "not known as a solid";
    if (an.n === "carbonate" && ["aluminium", "iron(III)"].includes(ca.n)) return "does not exist: the carbonate is hydrolysed to the hydroxide and CO₂";
    if (ca.n === "ammonium" && (an.n === "oxide" || an.n === "hydroxide")) return an.n === "hydroxide" ? "only as aqueous ammonia, NH₃(aq)" : "does not exist";
    if (ca.n === "silver" && an.n === "hydroxide") return "unstable: decomposes to brown Ag₂O";
    return null;
  }
  function soluble(ca, an) {
    if (["sodium", "potassium", "ammonium"].includes(ca.n) || an.n === "nitrate" || an.n === "nitrite" || an.n === "chlorate" || an.n === "permanganate" || an.n === "hydrogencarbonate") return ca.n === "silver" && an.n === "nitrite" ? "sparingly soluble" : "soluble";
    if (an.n === "chloride") return ca.n === "silver" ? "insoluble (white AgCl)" : ca.n === "lead(II)" ? "insoluble in cold water, soluble in hot" : "soluble";
    if (an.n === "sulphate") return ca.n === "lead(II)" ? "insoluble" : ca.n === "calcium" ? "slightly soluble" : ca.n === "silver" ? "slightly soluble" : "soluble";
    if (an.n === "hydroxide") return ca.n === "calcium" ? "slightly soluble (lime water)" : "insoluble"; if (an.n === "oxide") return ca.n === "calcium" ? "reacts with water → Ca(OH)₂" : "insoluble";
    return "insoluble";
  }
  function anionDef(an) {
    if (an.mono) return { atoms: [{ el: an.mono, p: [0, 0, 0] }], bonds: [] }; if (an.poly === "OH") return { atoms: [{ el: "O", p: [0, 0, 0] }, { el: "H", p: [0.96, 0, 0] }], bonds: [[0, 1, 1]] };
    const atoms = [{ el: an.X, p: [0, 0, 0] }], bonds = [], L = an.bl; let dirs;
    if (an.geo === "planar") dirs = [0, 1, 2].map((k) => [Math.cos(k * TAU / 3 + Math.PI / 2), Math.sin(k * TAU / 3 + Math.PI / 2), 0]);
    else if (an.geo === "bent") dirs = [[Math.sin(1.0), Math.cos(1.0), 0], [-Math.sin(1.0), Math.cos(1.0), 0]];
    else { const t = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((v) => v.map((q) => q / Math.sqrt(3))); dirs = an.geo === "pyr" ? t.slice(1) : t; }
    dirs.forEach((d, i) => { atoms.push({ el: "O", p: d.map((q) => q * L) }); bonds.push([0, i + 1, 1]); });
    if (an.H) { const o = atoms[1].p, n = Math.hypot(...o); atoms.push({ el: "H", p: o.map((q, i) => q + (i === 0 ? 0.55 : (q / n) * 0.75)) }); bonds.push([1, atoms.length - 1, 1]); }
    return { atoms, bonds };
  }
  C3.scenes.ionicNaming = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.75, fov: 36, free: true, cam: [[1.4, 2.6, 8.4], [1.3, 1.3, 0]],
    values: { ca: 0, an: 5, style: 0 },
    state: () => ({}),
    get controls() {
      return [
        { type: "select", key: "ca", label: "Cation (positive ion)", options: CAT.map((x, i) => ({ value: i, label: x.f + (x.z > 1 ? SUB(1) : "") + "  " + ["", "⁺", "²⁺", "³⁺"][x.z] + "   " + x.n })) },
        { type: "select", key: "an", label: "Anion (negative ion)", options: AN.map((x, i) => ({ value: i, label: x.f + ["", "⁻", "²⁻", "³⁻"][x.z] + "   " + x.n + "  /  " + x.iu })) },
        { type: "toggle", key: "style", label: "Space-filling ions" },
      ];
    },
    views: [{ label: "Ions + bottle", cam: [[1.4, 2.6, 8.4], [1.3, 1.3, 0]] }, { label: "Ions close", cam: [[-0.6, 1.9, 5.0], [-0.4, 1.35, 0]] }],
    note: "Write the formula so that the total positive charge equals the total negative charge (use the lowest common multiple of the two charges; brackets round a polyatomic ion taken more than once). Name the metal first (with its oxidation state in Roman numerals if it has more than one, e.g. iron(II)), then the anion. IUPAC names of oxoanions, as used by WAEC: count the oxygen atoms (dioxo-, trioxo-, tetraoxo-), add the central atom with the ending -ate, and give its oxidation number in Roman numerals: NO₃⁻ trioxonitrate(V), SO₄²⁻ tetraoxosulphate(VI), CO₃²⁻ trioxocarbonate(IV), PO₄³⁻ tetraoxophosphate(V). Oxidation number of the central atom x: x + (number of O)(−2) = charge on the ion.",
    onChange(S, s, c) { rebuild(S, s, c); },
    reset(S, s, c) { Object.assign(c, { ca: 0, an: 5, style: 0 }); rebuild(S, s, c); },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; S.mk.box(9, 0.06, 3.6, M.matte(0xb69a76, 0.62), 0, 0, 0).receiveShadow = true;
      const ped = S.mk.cyl(1.9, 2.0, 0.12, M.plastic(0x1f2833, 0.3), -1.5, 0.06, 0); ped.receiveShadow = true;
      const wg = K.vessel(G.DEFS.dish, { noAdd: false }); wg.group.position.set(0.9, 0.02, 1.1); wg.group.scale.set(0.9, 0.45, 0.9); s.wg = wg;
      rebuild(S, s, c);
    },
    update(S, s, c, dt) { if (s.ions) s.ions.forEach((o, i) => { o.g.rotation.y += dt * 0.35 * (i % 2 ? -1 : 1); o.g.position.y = o.y + Math.sin(S.t * 1.3 + i) * 0.04; }); },
    overlay(ctx, s, c, w, h, S) {
      const ca = CAT[c.ca | 0], an = AN[c.an | 0], F = formula(ca, an), px = w - 250, ex = exists(ca, an); ctx.save();
      G.titles(ctx, F.f + "   —   " + ca.n + " " + an.iu, "traditional name: " + ca.n + " " + an.n);
      s.ions.forEach((o) => G.tag(ctx, S, o.g.position.clone().add(V3(0, o.r + 0.25, 0)), o.lab, o.pos ? "#ff9d8a" : "#9fd0ff", 9));
      const l = F.nc * ca.z, steps = ["charges: " + ca.f + ["", "⁺", "²⁺", "³⁺"][ca.z] + "  and  " + an.f + ["", "⁻", "²⁻", "³⁻"][an.z], "LCM of " + ca.z + " and " + an.z + " = " + l, F.nc + " × (+" + ca.z + ") = +" + l + "      " + F.na + " × (−" + an.z + ") = −" + l, ["formula: " + F.f, "#ffe9b8"]];
      let y2 = G.panel(ctx, px, 58, 240, "Balancing the charges", steps);
      if (an.X) y2 = G.panel(ctx, px, y2 + 6, 240, "Naming the oxoanion " + an.f + ["", "⁻", "²⁻", "³⁻"][an.z], [an.nO + " oxygen atoms → " + ["", "", "di", "tri", "tetra"][an.nO] + "oxo-", "oxidation number of " + an.X + ": x + " + an.nO + "(−2) = −" + an.z + (an.H ? " − (+1 for H)" : "") + " → x = +" + an.ox, ["IUPAC: " + an.iu, "#8dffb8"]]);
      G.panel(ctx, px, y2 + 6, 240, null, ["appearance: " + colourOf(ca, an)[1], "in water: " + soluble(ca, an), ex ? ["note: " + ex, "#ff9d8a"] : ""]);
      G.tag(ctx, S, V3(1.5, 2.75, -0.6), F.f, "#ffe9b8", 10);
      ctx.restore();
    },
    readouts(s, c) { const ca = CAT[c.ca | 0], an = AN[c.an | 0], F = formula(ca, an); return [["Formula", F.f], ["IUPAC name", ca.n + " " + an.iu], ["Traditional name", ca.n + " " + an.n], ["Ion ratio", F.nc + " : " + F.na], ["Solubility in water", soluble(ca, an)]]; },
    table() { return G.table(["Ion", "Traditional", "IUPAC (WAEC)", "Central atom ox. no."], AN.filter((a) => a.X).map((a) => [a.f + ["", "⁻", "²⁻", "³⁻"][a.z], a.n, a.iu, "+" + a.ox])); },
  };
  function rebuild(S, s, c) {
    const K = s.K, ca = CAT[c.ca | 0], an = AN[c.an | 0], F = formula(ca, an);
    (s.ions || []).forEach((o) => G.disposeGroup(o.g)); s.ions = []; G.disposeGroup(s.bottle); if (s.heap) G.disposeGroup(s.heap);
    const n = F.nc + F.na, list = []; for (let i = 0; i < F.nc; i++) list.push("c"); for (let i = 0; i < F.na; i++) list.push("a");
    const order = []; let ci = 0, ai = 0; while (order.length < n) { if (ci < F.nc && (ci <= ai * F.nc / F.na)) { order.push("c"); ci++; } else if (ai < F.na) { order.push("a"); ai++; } else { order.push("c"); ci++; } }
    const span = Math.min(4.4, (n - 1) * 1.3), sf = c.style ? 1 : 0, ks = sf ? 0.62 : 1;
    order.forEach((k, i) => {
      const x = -1.5 + (n > 1 ? -span / 2 + (span * i) / (n - 1) : 0), z = (i % 2 ? -0.25 : 0.25), y = 1.25; let g, r;
      if (k === "c") { if (ca.poly) { const mo = G.molecule(K, G.build([{ el: "N", ch: 1, nh: 4 }]), { scale: 0.55 * ks }); mo.refresh(sf); g = mo.group; r = 0.55; }
        else { r = (ca.r / 100) * 0.55; g = new T.Group(); const m = new T.Mesh(new T.SphereGeometry(r, 48, 36), new T.MeshPhysicalMaterial({ color: ca.col, roughness: 0.2, clearcoat: 1, metalness: 0.1 })); m.castShadow = true; g.add(m); S.scene.add(g); } }
      else { if (an.mono) { r = (an.r / 100) * 0.55; g = new T.Group(); const m = new T.Mesh(new T.SphereGeometry(r, 48, 36), new T.MeshPhysicalMaterial({ color: G.ELC[an.mono], roughness: 0.2, clearcoat: 1, transparent: true, opacity: 0.92 })); m.castShadow = true; g.add(m); S.scene.add(g); }
        else { const mo = G.molecule(K, anionDef(an), { scale: 0.42 * ks }); mo.refresh(sf); g = mo.group; r = 0.7; } }
      g.position.set(x, y, z); s.ions.push({ g, y, r, pos: k === "c", lab: k === "c" ? ca.f + ["", "⁺", "²⁺", "³⁺"][ca.z] : an.f + ["", "⁻", "²⁻", "³⁻"][an.z] });
    });
    const sub = (ca.n + " " + an.n).length > 22 ? an.n : ca.n + " " + an.n;
    s.bottle = K.bottle({ label: F.f.replace(/[()]/g, (m) => m), sub, color: an.n === "permanganate" || an.n === "nitrate" ? 0x7a4a1a : 0xd8e8f0 }); s.bottle.position.set(1.5, 0, -0.6);
    const [rgb] = colourOf(ca, an); s.heap = G.heap(3.4, 1.4, rgb, { rough: rgb[0] < 60 ? 0.9 : 0.6 }); s.heap.position.set(0.9, 0.05, 1.1); S.scene.add(s.heap);
  }
})();
