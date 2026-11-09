/* c3d-g4.js — chemistry 3D gap scenes: calorimetry (neutralisation, dissolution, combustion; open/closed/isolated systems) and reactions of acids */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready || !C3.gx) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, G = C3.gx, CM = C3.CM, TAU = Math.PI * 2;
  const { clamp, lerp } = G, rnd = U.rnd;
  const C_W = 4.18;

  /* =============================== calorimetry =============================== */
  const EXPS = ["Heat of neutralisation (acid + alkali)", "Heat of solution (dissolving a solid)", "Heat of combustion of an alkanol (spirit burner)"];
  const ACIDS = [{ n: "HCl (strong acid)", dH: -57.1 }, { n: "CH₃COOH (weak acid)", dH: -55.2 }];
  const SOLIDS = [{ n: "ammonium trioxonitrate(V), NH₄NO₃", f: "NH₄NO₃", dH: 25.7, M: 80.0 }, { n: "potassium trioxonitrate(V), KNO₃", f: "KNO₃", dH: 34.9, M: 101.1 }, { n: "sodium hydroxide, NaOH", f: "NaOH", dH: -44.5, M: 40.0 }, { n: "anhydrous calcium chloride, CaCl₂", f: "CaCl₂", dH: -82.8, M: 111.0 }];
  const FUELS = [{ n: "methanol, CH₃OH", f: "CH₃OH", dH: -726, M: 32.0, eq: "CH₃OH + 1½O₂ → CO₂ + 2H₂O" }, { n: "ethanol, C₂H₅OH", f: "C₂H₅OH", dH: -1367, M: 46.1, eq: "C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O" }, { n: "propan-1-ol, C₃H₇OH", f: "C₃H₇OH", dH: -2021, M: 60.1, eq: "C₃H₇OH + 4½O₂ → 3CO₂ + 4H₂O" }, { n: "butan-1-ol, C₄H₉OH", f: "C₄H₉OH", dH: -2676, M: 74.1, eq: "C₄H₉OH + 6O₂ → 4CO₂ + 5H₂O" }];
  const SYS = [{ n: "open beaker (open system)", k: 0.012, d: "energy and matter (water vapour) can leave" }, { n: "polystyrene cup with lid (closed system)", k: 0.0022, d: "energy can leave slowly; matter cannot" }, { n: "vacuum flask (isolated system)", k: 0.00025, d: "almost no energy or matter is exchanged" }];
  C3.scenes.calorimetry = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.74, fov: 36, free: true, cam: [[2.0, 2.6, 7.0], [1.1, 1.0, 0]],
    values: { exp: 0, sys: 1, acid: 0, Va: 50, Vb: 50, conc: 1, solid: 0, ms: 5, fuel: 1, shield: 0 },
    state: () => ({}),
    get controls() {
      return [
        { type: "select", key: "exp", label: "Experiment", options: EXPS.map((m, i) => ({ value: i, label: m })) },
        { type: "select", key: "sys", label: "Container (neutralisation / dissolving)", options: SYS.map((m, i) => ({ value: i, label: m.n })) },
        { type: "select", key: "acid", label: "Neutralisation: acid", options: ACIDS.map((m, i) => ({ value: i, label: m.n })) },
        { type: "range", key: "Va", label: "Neutralisation: volume of acid (cm³)", min: 25, max: 100, step: 5 },
        { type: "range", key: "Vb", label: "Neutralisation: volume of NaOH (cm³)", min: 25, max: 100, step: 5 },
        { type: "select", key: "conc", label: "Neutralisation: concentration of both (mol/dm³)", options: [{ value: 1, label: "1.0 mol/dm³" }, { value: 2, label: "2.0 mol/dm³" }] },
        { type: "select", key: "solid", label: "Dissolving: solid added to 50 cm³ water", options: SOLIDS.map((m, i) => ({ value: i, label: m.n + (m.dH > 0 ? "  (endothermic)" : "  (exothermic)") })) },
        { type: "range", key: "ms", label: "Dissolving: mass of solid (g)", min: 1, max: 10, step: 0.5 },
        { type: "select", key: "fuel", label: "Combustion: alkanol in the spirit burner", options: FUELS.map((m, i) => ({ value: i, label: m.n })) },
        { type: "toggle", key: "shield", label: "Combustion: draught shield around the flame" },
        { type: "button", label: "Mix / add the solid / light the burner", action: (S, s, c) => { if (!s.started) { s.started = 1; s.t0 = s.t; } } },
        { type: "button", label: "Stop / put out the burner", cls: "secondary", action: (S, s) => { s.stopped = 1; } },
        { type: "button", label: "Start again", cls: "secondary", action: (S, s, c) => { restartCal(s, c); } },
      ];
    },
    views: [{ label: "This experiment", cam: (S, s, c) => CALV[c.exp | 0] }, { label: "Thermometer", cam: (S, s, c) => CALT[c.exp | 0] }],
    note: "Enthalpy change from a calorimeter: heat q = m·c·ΔT (c of water = 4.18 J g⁻¹ K⁻¹), then ΔH = −q / n (per mole of water formed, solid dissolved or fuel burnt). A rise in temperature means an exothermic change (ΔH negative); a fall means endothermic (ΔH positive). Strong acid + strong alkali gives about −57 kJ per mole of water; a weak acid gives slightly less because some energy is used to ionise it. Spirit-burner values are much smaller than data-book values because heat is lost to the air and the can, and combustion is incomplete. Open system: exchanges energy and matter with the surroundings; closed: energy only; isolated: neither.",
    onChange(S, s, c, key) { if (key === "exp") C3.setView(S, { cam: CALV[c.exp | 0] }); restartCal(s, c); },
    reset(S, s, c) { Object.assign(c, { exp: 0, sys: 1, acid: 0, Va: 50, Vb: 50, conc: 1, solid: 0, ms: 5, fuel: 1, shield: 0 }); restartCal(s, c); C3.setView(S, { cam: CALV[0] }); },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(9, 0.06, 3.8, M.matte(0xb69a76, 0.62), 0.4, 0, 0).receiveShadow = true;
      /* containers */
      s.gCup = new T.Group(); sc.add(s.gCup);
      const bk = K.beaker(); sc.remove(bk.group); bk.group.scale.set(1.05, 1.15, 1.05); s.gCup.add(bk.group); s.bkL = bk.addLiquid({ color: [220, 236, 246], opacity: 0.22 }); s.bk = bk;
      const cup = K.vessel(G.DEFS.cup, { noAdd: true }); G.opaque(cup, G.foam()); cup.group.position.y = 0.0; s.gCup.add(cup.group); s.cupL = cup.addLiquid({ color: [220, 236, 246], opacity: 0.35 }); s.cup = cup;
      const lid = new T.Mesh(new T.CylinderGeometry(4.6 * CM, 4.6 * CM, 0.4 * CM, 40), G.foam()); lid.position.y = 9.8 * CM; lid.castShadow = true; s.gCup.add(lid); s.lid = lid;
      const vf = K.vessel({ outer: [[0, 0], [3.3, 0], [3.8, 0.6], [3.8, 15], [3.0, 15.4], [2.4, 15.6]], inner: [[0, 1.0], [2.8, 1.0], [3.0, 1.4], [3.0, 14.6], [2.4, 15.2], [2.3, 15.6]] }, { noAdd: true }); G.opaque(vf, new T.MeshPhysicalMaterial({ color: 0xe8ecf0, metalness: 1, roughness: 0.12, clearcoat: 1 })); s.gCup.add(vf.group); s.vfL = vf.addLiquid({ color: [220, 236, 246], opacity: 0.4 }); s.vf = vf;
      const vfc = new T.Mesh(new T.CylinderGeometry(4.1 * CM, 4.1 * CM, 13 * CM, 40, 1, true), M.paint(0x2266aa)); vfc.material.side = T.DoubleSide; vfc.position.y = 7.6 * CM; s.gCup.add(vfc); s.vfCase = vfc;
      s.th = G.thermo(S, { x: 0.8 * CM, y: 1.0 * CM, z: 0.4 * CM, len: 26, min: -10, max: 60, T: 25 }); sc.remove(s.th.group); s.th.group.rotation.z = -0.08; s.gCup.add(s.th.group);
      s.stir = S.mk.cyl(0.18 * CM, 0.18 * CM, 20 * CM, K.glassMat({ opacity: 0.25, env: 3 }), -1.0 * CM, 10.5 * CM, -0.6 * CM); sc.remove(s.stir); s.stir.rotation.z = 0.12; s.gCup.add(s.stir);
      s.grains = G.crystals(40, "box", [250, 250, 250], 0.35, { op: 0.95 }); s.gCup.add(s.grains);
      const mc = K.measCylinder(); mc.group.position.set(1.15, 0, -0.5); s.mcL = mc.addLiquid({ color: [228, 238, 246], opacity: 0.25 }); s.mc = mc;
      /* combustion: copper can clamped over a spirit burner */
      s.gComb = new T.Group(); sc.add(s.gComb); const st = K.retort({ x: -0.9, z: -0.5, h: 70 }); sc.remove(st); s.gComb.add(st);
      const can = K.vessel(G.DEFS.can, { noAdd: true }); G.opaque(can, new T.MeshPhysicalMaterial({ color: 0xc8703f, metalness: 1, roughness: 0.28, clearcoat: 0.4 })); can.group.position.set(0, 2.25, 0); s.gComb.add(can.group); s.canL = can.addLiquid({ color: [214, 232, 242], opacity: 0.35 }); s.canL.setVolume(100); s.can = can;
      const ca = K.clampArm(st, 2.25 / CM + 7, 0, 0, 4.1); sc.remove(ca); s.gComb.add(ca);
      s.th2 = G.thermo(S, { x: 0.6 * CM, y: 2.25 + 1.0 * CM, z: 0.4 * CM, len: 26, min: -10, max: 110, T: 25 }); sc.remove(s.th2.group); s.gComb.add(s.th2.group);
      const lamp = K.vessel({ outer: [[0, 0], [3.0, 0], [3.4, 0.5], [3.4, 3.4], [2.2, 4.6], [0.9, 5.0], [0.9, 5.6]], inner: [[0, 0.3], [2.8, 0.3], [3.15, 0.7], [3.15, 3.3], [2.0, 4.4], [0.7, 4.8], [0.7, 5.6]] }, { noAdd: true }); lamp.group.position.set(0, 0.03, 0); s.gComb.add(lamp.group); s.lampL = lamp.addLiquid({ color: [230, 240, 246], opacity: 0.25 }); s.lampL.setVolume(60); s.lamp = lamp;
      const wick = new T.Mesh(new T.CylinderGeometry(0.35 * CM, 0.35 * CM, 1.6 * CM, 12), M.matte(0xf1ead8, 1)); wick.position.y = 0.03 + 6.0 * CM; s.gComb.add(wick); const cap = new T.Mesh(new T.CylinderGeometry(1.0 * CM, 1.0 * CM, 0.4 * CM, 20), M.aluminium()); cap.position.y = 0.03 + 5.6 * CM; s.gComb.add(cap);
      s.fl = K.flame({ h: 6.0, r: 0.9 }); s.fl.group.position.y = 0.03 + 6.7 * CM; s.gComb.add(s.fl.group); s.fl.set(0.15, 1);
      s.shield = new T.Mesh(new T.CylinderGeometry(9 * CM, 9 * CM, 15 * CM, 40, 1, true, -2.2, 4.4), M.aluminium()); s.shield.material.side = T.DoubleSide; s.shield.position.set(0, 7.5 * CM, 0); s.shield.rotation.y = Math.PI; s.gComb.add(s.shield);
      s.bal = G.balance(S, 1.6, 0.2); s.bal.group.visible = false;
      restartCal(s, c); C3.setView(S, { cam: CALV[c.exp | 0] });
    },
    update(S, s, c, dt) {
      const e = c.exp | 0, t = S.t; s.t += dt; const comb = e === 2; s.gCup.visible = !comb; s.gComb.visible = comb; s.mc.group.visible = e === 0;
      const sys = SYS[c.sys | 0]; s.bk.group.visible = !comb && (c.sys | 0) !== 2; s.cup.group.visible = !comb && (c.sys | 0) === 1; s.lid.visible = (c.sys | 0) === 1; s.vf.group.visible = !comb && (c.sys | 0) === 2; s.vfCase.visible = s.vf.group.visible;
      const liq = (c.sys | 0) === 0 ? s.bkL : (c.sys | 0) === 1 ? s.cupL : s.vfL; [s.bkL, s.cupL, s.vfL].forEach((L) => L.setVisible(L === liq && !comb)); s.shield.visible = comb && !!c.shield;
      const ts = 6; /* time-lapse: 1 s on screen = 6 s */ const dts = dt * ts;
      if (!comb) {
        let mass, qRate = 0;
        if (e === 0) { const na = c.conc * c.Va / 1000, nb = c.conc * c.Vb / 1000, n = Math.min(na, nb); s.nRx = n; s.qTot = -n * ACIDS[c.acid | 0].dH * 1000; mass = c.Va + c.Vb * (s.started ? 1 : 0); }
        else { const X = SOLIDS[c.solid | 0], n = c.ms / X.M; s.nRx = n; s.qTot = -n * X.dH * 1000; mass = 50 + (s.started ? c.ms : 0); }
        if (s.started && !s.done) { const rel = 1 - Math.exp(-(s.t - s.t0) * ts / (e === 0 ? 4 : 14)), dq = (rel - s.rel) * s.qTot; s.rel = rel; s.T += dq / (mass * C_W); if (rel > 0.999) s.done = 1; }
        s.T += -sys.k * (s.T - 25) * dts; s.hiT = Math.max(s.hiT, s.T); s.loT = Math.min(s.loT, s.T); if (s.t - s.lastH > 0.35) { s.lastH = s.t; s.hist.push([(s.t * ts) / 60, s.T]); if (s.hist.length > 400) s.hist.shift(); }
        const vol = e === 0 ? c.Va + (s.started ? c.Vb : 0) : 50; liq.setVolume(vol); liq.agit = s.started && !s.done ? 0.8 : 0; liq.update(t); s.th.set(s.T);
        s.mcL.setVolume(e === 0 && !s.started ? c.Vb : 0.1); s.mcL.update(t); s.stir.rotation.y = s.started && !s.done ? t * 6 : 0;
        const left = e === 1 ? (s.started ? Math.exp(-(s.t - s.t0) * ts / 14) : 1) : 0, by = (c.sys | 0) === 2 ? 1.0 * CM : 0.5 * CM; s.grains.visible = e === 1 && left > 0.02;
        s.grains.layout((i) => ({ x: rnd(-1.6, 1.6) * CM * 0 + Math.cos(i * 2.4) * (i % 5) * 0.5 * CM, y: s.started ? by + 0.15 * CM + (i % 3) * 0.2 * CM : 12.5 * CM + (i % 4) * 0.25 * CM, z: Math.sin(i * 2.4) * (i % 5) * 0.5 * CM, rx: i, ry: i * 1.3, s: Math.max(0.01, left) * (0.6 + (i % 4) * 0.15) }));
        if ((c.sys | 0) === 0 && s.T > 30 && dt > 0) { s.puffT += dt; if (s.puffT > 0.6) { s.puffT = 0; G.wisp(S, 0, 1.75, 0, 0xf0f4f8, { op: 0.12 }); } }
      } else {
        const X = FUELS[c.fuel | 0], eff = c.shield ? 0.62 : 0.42, burning = s.started && !s.stopped, rate = 0.0045; /* g of fuel per second (real) */
        if (burning) { const dm = rate * dts; s.burnt += dm; s.T += (eff * dm / X.M * -X.dH * 1000) / (100 * C_W + 60 * 0.385); }
        s.T += -0.0012 * (s.T - 25) * dts; if (s.T > 100) s.T = 100; s.hiT = Math.max(s.hiT, s.T); if (s.t - s.lastH > 0.35) { s.lastH = s.t; s.hist.push([(s.t * ts) / 60, s.T]); if (s.hist.length > 400) s.hist.shift(); }
        s.fl.set(0.15, burning ? 0.9 : 0); s.fl.update(t); s.th2.set(s.T); s.canL.agit = s.T > 98 ? 1 : 0; s.canL.update(t); s.lampL.setVolume(60 - s.burnt * 1.2); s.lampL.update(t);
        if (burning && dt > 0) { s.puffT += dt; if (s.puffT > 0.5 && !c.shield) { s.puffT = 0; S.puff(rnd(-0.2, 0.2), 2.1, 0.3, { n: 1, color: 0x30302e, speed: 0.1, up: 0.4, life: 1.6, size: 0.25, op: 0.25 }); } }
      }
    },
    overlay(ctx, s, c, w, h, S) {
      const e = c.exp | 0, px = w - 250; ctx.save(); const xm = Math.max(5, Math.ceil(((s.hist.length ? s.hist[s.hist.length - 1][0] : 0) + 1) / 5) * 5);
      const ymin = e === 1 && SOLIDS[c.solid | 0].dH > 0 ? 0 : 15, ymax = e === 2 ? 100 : 50;
      H.graph(ctx, px, 58, 240, 120, { series: [{ pts: s.hist, color: e === 1 && SOLIDS[c.solid | 0].dH > 0 ? "#7fd0ff" : "#ffb35c" }], xmin: 0, xmax: xm, ymin, ymax, xl: "time / min", yl: "θ / °C", dot: [s.hist.length ? s.hist[s.hist.length - 1][0] : 0, s.T, "#ffd27a"] });
      G.tag(ctx, S, e === 2 ? V3(0.25, s.th2.topY() + 0.1, 0) : V3(0.2, s.th.topY() + 0.1, 0), "θ = " + s.T.toFixed(1) + " °C", "#ffe9b8", 10);
      if (e === 0) { const A = ACIDS[c.acid | 0], m = c.Va + c.Vb, dT = s.hiT - 25, q = m * C_W * dT, dH = s.nRx > 0 ? -q / s.nRx / 1000 : 0;
        G.titles(ctx, "Heat of neutralisation", "H⁺(aq) + OH⁻(aq) → H₂O(l)   using " + A.n);
        G.panel(ctx, px, 184, 240, "Calculation", ["n(H₂O) = smaller of n(acid), n(alkali) = " + (s.nRx * 1000).toFixed(1) + " mmol", "q = m c ΔT = " + m + " × 4.18 × " + dT.toFixed(2) + " = " + (q / 1000).toFixed(2) + " kJ", ["ΔH = −q / n = " + (s.done ? dH.toFixed(1) : "…") + " kJ/mol  (data: " + A.dH + ")", "#ffe9b8"], SYS[c.sys | 0].n + ": " + SYS[c.sys | 0].d]); }
      else if (e === 1) { const X = SOLIDS[c.solid | 0], m = 50 + c.ms, dT = (X.dH > 0 ? s.loT : s.hiT) - 25, q = m * C_W * dT, dH = -q / s.nRx / 1000;
        G.titles(ctx, "Heat of solution: " + X.f, X.dH > 0 ? "ENDOTHERMIC: the solution gets colder (ΔH > 0)" : "EXOTHERMIC: the solution gets warmer (ΔH < 0)");
        G.panel(ctx, px, 184, 240, "Calculation", ["n = " + c.ms + " g ÷ " + X.M + " g/mol = " + s.nRx.toFixed(4) + " mol", "q = m c ΔT = " + m.toFixed(1) + " × 4.18 × " + dT.toFixed(2) + " = " + (q / 1000).toFixed(3) + " kJ", ["ΔH(soln) = −q / n = " + (s.done ? dH.toFixed(1) : "…") + " kJ/mol  (data: " + (X.dH > 0 ? "+" : "") + X.dH + ")", "#ffe9b8"], SYS[c.sys | 0].n + ": " + SYS[c.sys | 0].d]); }
      else { const X = FUELS[c.fuel | 0], dT = s.hiT - 25, q = 100 * C_W * dT, n = s.burnt / X.M, dH = n > 0 ? -q / n / 1000 : 0;
        G.titles(ctx, "Heat of combustion: " + X.f, X.eq); G.foot(ctx, "spirit burner mass: " + (78.5 - s.burnt).toFixed(2) + " g   (burnt " + s.burnt.toFixed(2) + " g)", "#cfe8ff");
        G.panel(ctx, px, 184, 240, "Calculation (100 g water in the can)", ["q = 100 × 4.18 × " + dT.toFixed(1) + " = " + (q / 1000).toFixed(2) + " kJ", "n(fuel) = " + s.burnt.toFixed(2) + " ÷ " + X.M + " = " + n.toFixed(4) + " mol", ["ΔHc (experiment) = " + (n > 0.0005 ? dH.toFixed(0) : "…") + " kJ/mol", "#ffe9b8"], "data book: " + X.dH + " kJ/mol", ["smaller because heat is lost to the air and the can, and combustion is incomplete (soot)", "#ffb8a8"]]); }
      ctx.restore();
    },
    readouts(s, c) { const e = c.exp | 0; return [["Temperature", s.T.toFixed(1) + " °C"], ["Change ΔT", ((e === 1 && SOLIDS[c.solid | 0].dH > 0 ? s.loT : s.hiT) - 25).toFixed(2) + " K"], ["Container / system", e === 2 ? "copper can (open)" : SYS[c.sys | 0].n], ["Sign of ΔH", e === 1 && SOLIDS[c.solid | 0].dH > 0 ? "positive (endothermic)" : "negative (exothermic)"]]; },
    steps(s, c) { const e = c.exp | 0; return [[e === 2 ? "Weigh the spirit burner; put 100 cm³ water in the can" : "Measure the starting temperature of the liquid", "done"], [e === 0 ? "Pour in the alkali and stir" : e === 1 ? "Add the solid and stir" : "Light the burner and stir the water", s.started ? "done" : "now"], ["Record the highest (or lowest) temperature", s.started && !s.done ? "now" : s.done ? "done" : ""], ["Calculate q = mcΔT and ΔH = −q/n", s.done || s.stopped ? "now" : ""]]; },
  };
  const CALV = [[[2.0, 2.6, 7.0], [1.1, 1.0, 0]], [[2.0, 2.7, 7.4], [1.1, 1.1, 0]], [[2.2, 3.4, 8.2], [1.1, 2.0, 0]]];
  const CALT = [[[0.6, 1.9, 2.4], [0.1, 1.6, 0]], [[0.6, 1.9, 2.4], [0.1, 1.6, 0]], [[0.8, 3.4, 2.8], [0.1, 3.2, 0]]];
  function restartCal(s, c) { s.T = 25; s.hiT = 25; s.loT = 25; s.t = 0; s.t0 = 0; s.started = 0; s.done = 0; s.stopped = 0; s.rel = 0; s.burnt = 0; s.hist = [[0, 25]]; s.lastH = 0; s.puffT = 0; }

  /* =============================== reactions of acids =============================== */
  const RX = [
    { n: "Acid + metal → salt + hydrogen", sub: "test: a burning splint gives a squeaky pop" },
    { n: "Acid + trioxocarbonate(IV) → salt + water + CO₂", sub: "test: CO₂ turns lime water milky" },
    { n: "Acid + base (metal oxide) → salt + water", sub: "warm black CuO with dilute H₂SO₄" },
    { n: "Acids and indicators: litmus", sub: "acids turn blue litmus red" },
  ];
  const METALS = [{ n: "magnesium", f: "Mg", k: 1.0, col: 0xc9ccd2, eq: "Mg(s) + 2HCl(aq) → MgCl₂(aq) + H₂(g)" }, { n: "zinc", f: "Zn", k: 0.35, col: 0x9aa0a8, eq: "Zn(s) + 2HCl(aq) → ZnCl₂(aq) + H₂(g)" }, { n: "iron", f: "Fe", k: 0.12, col: 0x6a6e76, eq: "Fe(s) + 2HCl(aq) → FeCl₂(aq) + H₂(g)" }, { n: "copper", f: "Cu", k: 0, col: 0xc8703f, eq: "Cu(s) + HCl(aq) → no reaction (Cu is below H in the reactivity series)" }];
  const CARBS = [{ n: "marble chips, CaCO₃", eq: "CaCO₃(s) + 2HCl(aq) → CaCl₂(aq) + H₂O(l) + CO₂(g)", k: 0.5 }, { n: "sodium trioxocarbonate(IV), Na₂CO₃", eq: "Na₂CO₃(s) + 2HCl(aq) → 2NaCl(aq) + H₂O(l) + CO₂(g)", k: 1.0 }];
  C3.scenes.acidReactions = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.74, fov: 36, free: true, cam: [[1.4, 2.2, 5.6], [0.8, 1.0, 0]],
    values: { rx: 0, metal: 0, carb: 0, conc: 1 },
    state: () => ({}),
    get controls() {
      return [
        { type: "select", key: "rx", label: "Reaction", options: RX.map((m, i) => ({ value: i, label: m.n })) },
        { type: "select", key: "metal", label: "Metal (with dilute HCl)", options: METALS.map((m, i) => ({ value: i, label: m.n + " (" + m.f + ")" })) },
        { type: "select", key: "carb", label: "Trioxocarbonate(IV)", options: CARBS.map((m, i) => ({ value: i, label: m.n })) },
        { type: "range", key: "conc", label: "Acid concentration (mol/dm³)", min: 0.25, max: 2, step: 0.25 },
        { type: "button", label: "Add the solid to the acid / dip the litmus", action: (S, s) => { if (!s.go) { s.go = 1; s.t0 = S.t; } } },
        { type: "button", label: "Do the gas test (splint / lime water)", action: (S, s) => { s.test = 1; s.testT = 0; } },
        { type: "button", label: "Start again", cls: "secondary", action: (S, s, c) => { restartAR(S, s, c); } },
      ];
    },
    views: [{ label: "This reaction", cam: (S, s, c) => ARV[c.rx | 0] }, { label: "Close", cam: (S, s, c) => ARC[c.rx | 0] }],
    note: "Dilute acids: (1) react with metals above hydrogen in the reactivity series to give a salt and hydrogen (burns with a squeaky pop); copper, silver and gold do not react; (2) react with trioxocarbonates(IV) and hydrogentrioxocarbonates(IV) to give a salt, water and carbon(IV) oxide, which turns lime water milky (CaCO₃ precipitate) and clear again with excess CO₂ (soluble Ca(HCO₃)₂); (3) neutralise bases and metal oxides to give a salt and water only; (4) turn blue litmus red, have a sour taste and pH below 7. All these reactions are caused by H⁺(aq) ions, which is why acids show them only in water.",
    onChange(S, s, c, key) { if (key === "rx") C3.setView(S, { cam: ARV[c.rx | 0] }); if (key !== "conc") restartAR(S, s, c); },
    reset(S, s, c) { Object.assign(c, { rx: 0, metal: 0, carb: 0, conc: 1 }); restartAR(S, s, c); C3.setView(S, { cam: ARV[0] }); },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(9, 0.06, 3.8, M.matte(0xb69a76, 0.62), 0.4, 0, 0).receiveShadow = true;
      /* gas generator: conical flask + bung + delivery tube into a test tube of lime water */
      s.gGas = new T.Group(); sc.add(s.gGas); const fl = K.flask(); sc.remove(fl.group); s.gGas.add(fl.group); s.fl = fl; s.fL = fl.addLiquid({ color: [225, 238, 246], opacity: 0.22 }); s.fL.setVolume(60);
      s.bub = K.bubbles(fl, s.fL, { n: 90, spread: 1.2 }); s.bung = G.bung(S, 1.45, 2.2); sc.remove(s.bung); s.bung.position.y = 13.2 * CM; s.gGas.add(s.bung);
      const dp = [V3(0.3 * CM, 13.0 * CM, 0), V3(0.3 * CM, 17.5 * CM, 0), V3(1.0, 18.2 * CM, 0), V3(1.55, 17.5 * CM, 0), V3(1.55, 3.0 * CM, 0)]; const dtm = G.glassTube(S, K, dp, 0.35, 0.14); sc.remove(dtm); s.gGas.add(dtm);
      const lw = K.vessel("testtube", { noAdd: true }); lw.group.position.set(1.55, 0.6, 0); s.gGas.add(lw.group); s.lwL = lw.addLiquid({ color: [235, 240, 244], opacity: 0.22 }); s.lwL.setVolume(10); s.lw = lw; s.lwB = K.bubbles(lw, s.lwL, { n: 30, spread: 0.1 });
      const rack = S.mk.rbox(0.8, 0.6, 0.5, 0.03, M.wood(), 1.55, 0.3, 0); sc.remove(rack); s.gGas.add(rack);
      s.metal = new T.Group(); fl.group.add(s.metal); s.carbIM = G.crystals(9, "lump", [240, 238, 232], 0.9, { mat: G.powderMat([238, 236, 230], 0.6) }); fl.group.add(s.carbIM);
      s.splint = new T.Group(); const sp = new T.Mesh(new T.BoxGeometry(0.035, 0.035, 1.6), M.matte(0xd8b47a, 0.8)); sp.position.z = 0.8; s.splint.add(sp); s.spF = K.flame({ h: 1.6, r: 0.35 }); s.spF.set(0.1, 1); s.spF.group.rotation.x = 0; s.splint.add(s.spF.group); sc.add(s.splint); s.splint.visible = false;
      s.pop = S.mk.soft(0xbfd8ff, 0.8, 0, 0, 0, 0); sc.remove(s.pop); sc.add(s.pop);
      /* metal oxide: beaker on tripod with Bunsen */
      s.gOx = new T.Group(); sc.add(s.gOx); const tp = G.tripod(S, 0, 0, 20); sc.remove(tp); s.gOx.add(tp); s.bn = K.bunsen({ x: 0, z: 0 }); sc.remove(s.bn); s.gOx.add(s.bn); s.bn.setAir(1);
      const bk = K.beaker(); sc.remove(bk.group); bk.group.position.y = tp.topY; s.gOx.add(bk.group); s.bk = bk; s.bkL = bk.addLiquid({ color: [225, 238, 246], opacity: 0.22 }); s.bkL.setVolume(80);
      s.cuo = G.heap(2.4, 0.9, [26, 26, 28]); s.cuo.position.y = 0.32 * CM; bk.group.add(s.cuo); s.oxP = K.precipitate(bk, s.bkL, { color: 0x1c1c1e, n: 500, size: 0.03 });
      /* litmus: white tile, beaker of acid, papers */
      s.gLit = new T.Group(); sc.add(s.gLit); const tile = K.tile(18); sc.remove(tile); tile.position.set(0, 0.067, 0); s.gLit.add(tile);
      const lb = K.beaker(); sc.remove(lb.group); lb.group.position.set(-0.9, 0, 0); s.gLit.add(lb.group); s.lbL = lb.addLiquid({ color: [225, 238, 246], opacity: 0.22 }); s.lbL.setVolume(100);
      s.papers = [[66, 110, 210], [205, 60, 60]].map((rgb, i) => { const m = new T.Mesh(new T.BoxGeometry(0.16, 0.9, 0.006), new T.MeshStandardMaterial({ color: G.col(rgb), roughness: 0.9 })); m.castShadow = true; s.gLit.add(m); return { m, rgb }; });
      restartAR(S, s, c); C3.setView(S, { cam: ARV[c.rx | 0] });
    },
    update(S, s, c, dt) {
      const r = c.rx | 0, t = S.t; s.gGas.visible = r <= 1; s.gOx.visible = r === 2; s.gLit.visible = r === 3; const el = s.go ? (t - s.t0) : 0;
      if (r <= 1) {
        let rate = 0; if (r === 0) { const X = METALS[c.metal | 0]; s.left = s.go ? Math.max(0, 1 - el * 0.05 * X.k * c.conc) : 1; rate = s.go ? 140 * X.k * c.conc * Math.min(1, s.left * 3) : 0; s.metal.scale.setScalar(Math.max(0.05, Math.cbrt(s.left))); s.metal.visible = true; s.carbIM.visible = false; }
        else { const X = CARBS[c.carb | 0]; s.left = s.go ? Math.max(0, 1 - el * 0.04 * X.k * c.conc) : 1; rate = s.go ? 160 * X.k * c.conc * Math.min(1, s.left * 3) : 0; s.carbIM.visible = true; s.metal.visible = false;
          s.carbIM.layout((i) => ({ x: Math.cos(i * 2.2) * (0.6 + (i % 3) * 0.7) * CM, y: s.go ? 0.6 * CM : 14.5 * CM, z: Math.sin(i * 2.2) * (0.6 + (i % 3) * 0.7) * CM, rx: i, ry: i * 1.7, s: Math.max(0.02, (c.carb | 0) === 1 ? s.left * 0.6 : Math.cbrt(s.left)) * (0.8 + (i % 3) * 0.15) })); }
        s.bub.rate = rate; s.fL.agit = rate > 20 ? 0.7 : 0; s.bub.update(dt, t); s.fL.update(t); s.gasMade = (s.gasMade || 0) + rate * dt * 0.001;
        /* lime water: CO₂ first gives milky CaCO₃, then excess CO₂ clears it (Ca(HCO₃)₂) */
        const co2 = r === 1 ? s.gasMade : 0, milky = clamp(co2 / 0.6, 0, 1) * (1 - clamp((co2 - 2.4) / 1.6, 0, 1)); s.milky = milky; s.lwL.setColor(G.mix([235, 240, 244], [246, 246, 244], milky), 0.22 + 0.62 * milky); s.lwB.rate = rate > 5 && s.bung.visible ? Math.min(25, rate * 0.25) : 0; s.lwB.update(dt, t); s.lwL.update(t);
        if (s.test) { s.testT += dt; const k = G.smooth(0, 0.8, s.testT); s.splint.visible = r === 0; s.bung.visible = r === 1; const mouth = V3(0, 12.8 * CM + 0.15, 0); s.splint.position.copy(mouth.clone().add(V3(0.9 * (1 - k) + 0.05, 0.4 * (1 - k), 0.5 * (1 - k)))); s.splint.rotation.set(0, Math.PI / 2 + 0.3, 0.6);
          s.spF.update(t); s.spF.group.position.set(0, 0, 0); if (r === 0 && s.testT > 0.8 && !s.popped) { s.popped = 1; s.popT = 0; } }
        else { s.splint.visible = false; s.bung.visible = true; }
        if (s.popped) { s.popT += dt; const k = clamp(1 - s.popT / 0.35, 0, 1), ok = (c.metal | 0) !== 3 && s.gasMade > 0.05; s.pop.position.set(0, 12.8 * CM + 0.12, 0); s.pop.material.opacity = ok ? k : 0; s.pop.scale.setScalar(0.5 + (1 - k) * 1.2); s.popOK = ok; }
      } else if (r === 2) {
        const heat = s.go ? 1 : 0; s.bn.setGas(heat); s.bn.flame.update(t); s.left = s.go ? Math.max(0.25, 1 - el * 0.05 * c.conc) : 1; s.cuo.scale.setScalar(Math.max(0.05, Math.cbrt(s.left))); s.cuo.visible = s.go;
        const blue = 1 - s.left; s.bkL.setColor(G.mix([225, 238, 246], [40, 120, 225], clamp(blue * 1.4, 0, 1)), 0.22 + 0.4 * blue); s.bkL.agit = s.go ? 0.4 : 0; s.bkL.update(t); s.oxP.amount = 0; s.oxP.update(dt);
        if (s.go && dt > 0) { s.puffT = (s.puffT || 0) + dt; if (s.puffT > 0.7) { s.puffT = 0; G.wisp(S, 0, 3.35 + 1.6, 0, 0xf0f4f8, { op: 0.14 }); } }
      } else {
        const k = s.go ? G.smooth(0, 1.2, el) : 0, k2 = s.go ? G.smooth(1.2, 3.0, el) : 0; s.papers.forEach((p, i) => { const x0 = 0.25 + i * 0.35, dipX = -0.9 + (i ? 0.12 : -0.12); const x = lerp(x0, dipX, k) , y = lerp(0.09, 1.2, k) - 0.55 * k + 0.55 * k * (1 - Math.min(1, k2 * 2)); p.m.position.set(x, Math.max(0.09, y), i ? 0.05 : -0.05); p.m.rotation.set(k < 0.05 ? -Math.PI / 2 : 0, 0, 0);
          const toRed = i === 0 && k2 > 0; p.m.material.color.copy(G.col(toRed ? G.mix(p.rgb, [210, 50, 55], clamp(k2 * 1.5, 0, 1)) : p.rgb)); }); s.lbL.update(t);
      }
    },
    overlay(ctx, s, c, w, h, S) {
      const r = c.rx | 0, px = w - 250; ctx.save(); G.titles(ctx, RX[r].n, RX[r].sub);
      if (r === 0) { const X = METALS[c.metal | 0]; G.foot(ctx, X.eq, "#ffe9b8"); G.panel(ctx, px, 58, 240, "Observations", [X.k > 0 ? "effervescence: " + (X.k > 0.6 ? "vigorous" : X.k > 0.2 ? "steady" : "slow") + " bubbles of a colourless gas" : "no bubbles: copper does not react with dilute HCl", X.k > 0 ? "the metal dissolves; a colourless solution forms" + (X.f === "Fe" ? " (pale green Fe²⁺)" : "") : "", X.k > 0.6 ? "the flask becomes warm (exothermic)" : "", s.popped ? [s.popOK ? "burning splint: squeaky POP → the gas is hydrogen" : "no pop: no hydrogen was made", s.popOK ? "#8dffb8" : "#ff9aa8"] : "test: hold a burning splint at the mouth"]); }
      else if (r === 1) { const X = CARBS[c.carb | 0]; G.foot(ctx, X.eq, "#ffe9b8"); G.panel(ctx, px, 58, 240, "Observations", ["effervescence: bubbles of colourless, odourless gas", "the gas bubbles through lime water, Ca(OH)₂(aq)", [s.milky > 0.3 ? "lime water turns MILKY: Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O" : s.gasMade > 2.4 ? "excess CO₂: the milkiness clears (soluble Ca(HCO₃)₂)" : "lime water still clear", s.milky > 0.3 ? "#8dffb8" : "#e8f0ff"], "→ the gas is carbon(IV) oxide"]); G.tag(ctx, S, V3(1.55, 3.2, 0), "lime water", "#cfe0f5", 8.5); }
      else if (r === 2) { G.foot(ctx, "CuO(s) + H₂SO₄(aq) → CuSO₄(aq) + H₂O(l)", "#ffe9b8"); G.panel(ctx, px, 58, 240, "Observations", ["black copper(II) oxide dissolves on warming", "the solution turns BLUE (Cu²⁺ ions)", "no gas is given off: only salt + water", "add CuO until some is left over (excess), filter, then evaporate to crystallise blue CuSO₄·5H₂O"]); }
      else { G.foot(ctx, "HCl(aq) → H⁺(aq) + Cl⁻(aq): the H⁺ ions change the indicator", "#ffe9b8"); s.papers.forEach((p, i) => G.tag(ctx, S, p.m.position.clone().add(V3(0, 0.62, 0)), i ? "red litmus" : "blue litmus", "#cfe0f5", 8));
        G.panel(ctx, px, 58, 240, "Observations", ["blue litmus → RED in the acid", "red litmus stays red", "an alkali would turn red litmus blue", "pH of dilute HCl ≈ " + (-Math.log10(c.conc)).toFixed(1)]); }
      ctx.restore();
    },
    readouts(s, c) { const r = c.rx | 0; return [["Reaction", RX[r].n], ["Acid", (c.conc).toFixed(2) + " mol/dm³ " + (r === 2 ? "H₂SO₄" : "HCl")], ["Solid left", Math.round((s.left == null ? 1 : s.left) * 100) + " %"], ["Gas", r === 0 ? (METALS[c.metal | 0].k ? "hydrogen" : "none") : r === 1 ? "carbon(IV) oxide" : "none"]]; },
    steps(s, c) { const r = c.rx | 0; return [["Put dilute acid in the vessel", "done"], [r === 3 ? "Dip the litmus papers" : "Add the solid", s.go ? "done" : "now"], [r <= 1 ? "Test the gas" : "Observe the colour", s.go && !s.test ? "now" : s.test ? "done" : ""], ["Write the equation", s.test || (r >= 2 && s.go) ? "now" : ""]]; },
  };
  const ARV = [[[1.9, 2.6, 6.8], [1.0, 1.3, 0]], [[1.9, 2.6, 6.8], [1.0, 1.3, 0]], [[1.8, 4.6, 8.0], [0.9, 3.2, 0]], [[1.6, 2.2, 5.6], [0.6, 0.7, 0]]];
  const ARC = [[[0.7, 2.6, 3.2], [0.2, 2.0, 0]], [[1.8, 1.5, 3.0], [1.3, 1.2, 0]], [[0.6, 4.4, 3.4], [0.1, 3.9, 0]], [[0.2, 1.4, 3.0], [-0.4, 0.8, 0]]];
  function restartAR(S, s, c) {
    s.go = 0; s.test = 0; s.popped = 0; s.gasMade = 0; s.left = 1; s.milky = 0; if (!s.metal) return;
    while (s.metal.children.length) G.disposeGroup(s.metal.children[0]); const X = METALS[c.metal | 0];
    if (X.f === "Mg") for (let i = 0; i < 6; i++) { const m = new T.Mesh(new T.BoxGeometry(1.8 * CM, 0.06 * CM, 0.35 * CM), new T.MeshPhysicalMaterial({ color: X.col, metalness: 1, roughness: 0.3 })); m.position.set(rnd(-1.5, 1.5) * CM, 0.4 * CM, rnd(-1.5, 1.5) * CM); m.rotation.y = rnd(0, 3); s.metal.add(m); }
    else for (let i = 0; i < 7; i++) { const m = new T.Mesh(new T.IcosahedronGeometry(0.45 * CM, 0), new T.MeshPhysicalMaterial({ color: X.col, metalness: 1, roughness: X.f === "Cu" ? 0.3 : 0.45 })); m.position.set(rnd(-1.4, 1.4) * CM, 0.6 * CM, rnd(-1.4, 1.4) * CM); m.scale.set(1, 0.6, 1.2); m.rotation.set(rnd(0, 3), rnd(0, 3), 0); s.metal.add(m); }
    s.lwL && s.lwL.setColor([235, 240, 244], 0.22); s.bkL && s.bkL.setColor([225, 238, 246], 0.22);
  }
})();
