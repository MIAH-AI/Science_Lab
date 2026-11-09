/* c3d-g5.js — chemistry 3D gap scenes: cracking of petroleum fractions & octane number; alkanols (1°/2°/3°) and their tests */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready || !C3.gx) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, G = C3.gx, CM = C3.CM, TAU = Math.PI * 2;
  const { clamp, lerp } = G, rnd = U.rnd;

  /* =============================== cracking & octane number =============================== */
  const CMODES = ["Catalytic cracking in the laboratory", "What happens to the molecules", "Octane number and engine knocking"];
  const EQS = [
    { n: "decane → octane + ethene", eq: "C₁₀H₂₂ → C₈H₁₈ + C₂H₄", parent: 10, prods: [[8, 0], [2, 1]] },
    { n: "dodecane → octane + 2 ethene", eq: "C₁₂H₂₆ → C₈H₁₈ + 2C₂H₄", parent: 12, prods: [[8, 0], [2, 1], [2, 1]] },
    { n: "decane → hexane + butene", eq: "C₁₀H₂₂ → C₆H₁₄ + C₄H₈", parent: 10, prods: [[6, 0], [4, 1]] },
    { n: "hexadecane → octane + octene", eq: "C₁₆H₃₄ → C₈H₁₈ + C₈H₁₆", parent: 16, prods: [[8, 0], [8, 1]] },
  ];
  C3.scenes.crudeOilCracking = {
    env: "chemlab", envOpts: { w: 28, d: 10, wallH: 26, shadowArea: 12 }, envI: 0.74, fov: 36, free: true, cam: [[1.6, 3.4, 8.8], [1.0, 1.4, 0]],
    values: { mode: 0, eq: 0, ON: 85, CR: 9 },
    state: () => ({}),
    get controls() {
      return [
        { type: "select", key: "mode", label: "View", options: CMODES.map((m, i) => ({ value: i, label: m })) },
        { type: "button", label: "Lab: heat the catalyst (then the paraffin)", action: (S, s) => { s.heat = 1; } },
        { type: "button", label: "Lab: test the gas with bromine water", action: (S, s) => { s.brTest = 1; s.brT = 0; } },
        { type: "button", label: "Lab: take the delivery tube out of the water", cls: "secondary", action: (S, s) => { s.tubeOut = 1; } },
        { type: "button", label: "Lab: stop heating", cls: "secondary", action: (S, s) => { s.heat = 0; if (!s.tubeOut && s.gas > 0.05) s.suck = 1; } },
        { type: "select", key: "eq", label: "Molecules: cracking reaction", options: EQS.map((m, i) => ({ value: i, label: m.n })) },
        { type: "button", label: "Molecules: crack it", action: (S, s) => { s.crackT = 0; s.crack = 1; } },
        { type: "range", key: "ON", label: "Engine: octane number of the petrol (% 2,2,4-trimethylpentane)", min: 40, max: 100, step: 1 },
        { type: "range", key: "CR", label: "Engine: compression ratio", min: 6, max: 12, step: 0.5 },
        { type: "button", label: "Start again", cls: "secondary", action: (S, s, c) => { restartCr(S, s, c); } },
      ];
    },
    views: [{ label: "This view", cam: (S, s, c) => CRV[c.mode | 0] }, { label: "Close", cam: (S, s, c) => CRC[c.mode | 0] }],
    note: "Cracking breaks long-chain alkanes from heavy fractions (low demand) into shorter alkanes for petrol and alkenes for making plastics. Catalytic cracking uses heat (about 500 °C) and a catalyst (aluminium oxide / zeolite, or broken porous pot in the laboratory). The alkene in the gas decolourises bromine water. Remove the delivery tube from the water before you stop heating, or cold water sucks back into the hot tube and cracks it. Octane number = % of 2,2,4-trimethylpentane (iso-octane, 100) in a mixture with heptane (0) that knocks like the fuel. Branched, cyclic and aromatic hydrocarbons have high octane numbers; cracking, reforming and isomerisation raise the octane number of petrol.",
    onChange(S, s, c, key) { if (key === "mode") { C3.setView(S, { cam: CRV[c.mode | 0] }); } if (key === "eq") { s.crack = 0; s.crackT = 0; buildMols(S, s, c); } },
    reset(S, s, c) { Object.assign(c, { mode: 0, eq: 0, ON: 85, CR: 9 }); restartCr(S, s, c); C3.setView(S, { cam: CRV[0] }); },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(11, 0.06, 4, M.matte(0xb69a76, 0.62), 0.6, 0, 0).receiveShadow = true;
      /* ---- lab apparatus ---- */
      s.gLab = new T.Group(); sc.add(s.gLab); const st = K.retort({ x: -1.5, z: -0.7, h: 60 }); sc.remove(st); s.gLab.add(st);
      const bt = K.vessel(G.DEFS.boilingtube, { noAdd: true }); bt.group.rotation.z = -Math.PI / 2 - 0.04; bt.group.position.set(-1.1, 2.35, 0); s.gLab.add(bt.group); s.bt = bt;
      const ca = K.clampArm(st, 2.35 / CM, -0.75, 0, 1.2); sc.remove(ca); s.gLab.add(ca);
      const wool = new T.Mesh(new T.CylinderGeometry(0.95 * CM, 0.95 * CM, 3.2 * CM, 20), new T.MeshStandardMaterial({ color: 0xf2efe6, map: G.noiseTex([238, 234, 222], 30, 9000), roughness: 1 })); wool.position.y = 2.0 * CM; bt.group.add(wool); s.wool = wool;
      s.cat = G.crystals(14, "lump", [205, 120, 90], 0.55, { mat: new T.MeshStandardMaterial({ color: 0xc87a58, roughness: 0.95, emissive: new T.Color(1, 0.3, 0.05), emissiveIntensity: 0 }) }); bt.group.add(s.cat); s.cat.layout((i) => ({ x: rnd(-0.5, 0.5) * CM, y: (7 + (i % 7) * 0.45) * CM, z: rnd(-0.5, 0.5) * CM, rx: i, ry: i * 2, s: rnd(0.7, 1.1) }));
      const bung = G.bung(S, 1.05, 2.0); sc.remove(bung); bung.rotation.z = -Math.PI / 2; bung.position.set(-1.1 + 2.55, 2.35 - 0.1, 0); s.gLab.add(bung);
      s.mouth = V3(-0.2 + 15.6 * CM, 1.55 + 15.6 * CM * Math.sin(0.08) * 0 + 0.19, 0);
      const dp = [V3(1.5, 2.25, 0), V3(1.95, 2.27, 0), V3(2.3, 1.9, 0), V3(2.45, 0.8, 0), V3(2.45, 0.22, 0), V3(2.62, 0.22, 0)]; s.dt = G.glassTube(S, K, dp, 0.32, 0.14); sc.remove(s.dt); s.gLab.add(s.dt);
      const tr = K.vessel(G.DEFS.trough, { noAdd: true }); tr.group.position.set(2.75, 0.0, 0); tr.group.scale.set(0.7, 0.9, 0.7); s.gLab.add(tr.group); s.trL = tr.addLiquid({ color: [205, 228, 240], opacity: 0.22 }); s.trL.setVolume(1900);
      const ct = K.vessel("testtube", { noAdd: true }); ct.group.rotation.z = Math.PI; ct.group.position.set(2.72, 2.55, 0); s.gLab.add(ct.group); s.ct = ct; s.ctL = ct.addLiquid({ color: [205, 228, 240], opacity: 0.3 }); s.ctL.setVolume(13); s.ctL.cap.visible = false;
      s.collB = K.bubbles(tr, s.trL, { n: 30, x: 0.0, z: 0, spread: 0.08 }); s.bn = K.bunsen({ x: 0.15, z: 0 }); sc.remove(s.bn); s.gLab.add(s.bn);
      const br = K.vessel("testtube", { noAdd: true }); br.group.position.set(-2.7, 0.6, 0.7); s.gLab.add(br.group); s.brL = br.addLiquid({ color: [215, 120, 30], opacity: 0.6 }); s.brL.setVolume(9); s.br = br;
      const rack = S.mk.rbox(0.6, 0.6, 0.5, 0.03, M.wood(), -2.7, 0.3, 0.7); sc.remove(rack); s.gLab.add(rack);
      /* ---- molecules ---- */
      s.gMol = new T.Group(); sc.add(s.gMol); const ped = new T.Mesh(new T.CylinderGeometry(2.4, 2.5, 0.1, 64), M.plastic(0x1f2833, 0.3)); ped.position.set(0.4, 0.05, 0); s.gMol.add(ped);
      /* ---- engine cylinder (cut-away) ---- */
      s.gEng = new T.Group(); sc.add(s.gEng); s.gEng.position.set(0.2, 0, 0);
      const blk = S.mk.rbox(2.2, 1.0, 1.6, 0.05, M.paint(0x3a4048), 0, 0.5, 0); sc.remove(blk); s.gEng.add(blk);
      const cyl = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 2.0, 48, 1, true), new T.MeshPhysicalMaterial({ color: 0xdfe8ee, transparent: true, opacity: 0.22, roughness: 0.05, clearcoat: 1, side: T.DoubleSide, depthWrite: false })); cyl.position.y = 2.0; cyl.renderOrder = 4; s.gEng.add(cyl);
      const head = S.mk.cyl(0.72, 0.72, 0.3, M.aluminium(), 0, 3.15, 0); sc.remove(head); s.gEng.add(head); const plug = S.mk.cyl(0.08, 0.08, 0.5, M.ceramic(0xf2f0ea), 0, 3.45, 0); sc.remove(plug); s.gEng.add(plug);
      s.piston = S.mk.cyl(0.58, 0.58, 0.45, M.aluminium(), 0, 1.5, 0); sc.remove(s.piston); s.gEng.add(s.piston); [0, 1, 2].forEach((k) => { const r = S.mk.torus(0.585, 0.012, M.steel(), 0, 0.12 - k * 0.08, 0); sc.remove(r); r.rotation.x = Math.PI / 2; s.piston.add(r); });
      s.rod = S.mk.rod(V3(0, 1.3, 0), V3(0, 0.5, 0), 0.07, M.steel()); sc.remove(s.rod); s.gEng.add(s.rod);
      s.charge = new T.Mesh(new T.CylinderGeometry(0.57, 0.57, 1, 40), new T.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false })); s.gEng.add(s.charge);
      s.spark = S.mk.soft(0xbfe0ff, 0.5, 0, 2.95, 0, 0); sc.remove(s.spark); s.gEng.add(s.spark); s.knockF = S.mk.soft(0xff7a20, 1.0, 0.25, 2.4, 0.2, 0); sc.remove(s.knockF); s.gEng.add(s.knockF); s.engL = new T.PointLight(0xffa040, 0, 5, 1.6); s.engL.position.set(0, 2.6, 0.6); s.gEng.add(s.engL);
      s.crank = 0; restartCr(S, s, c); C3.setView(S, { cam: CRV[c.mode | 0] });
    },
    update(S, s, c, dt) {
      const m = c.mode | 0, t = S.t; s.gLab.visible = m === 0; s.gMol.visible = m === 1; (s.mols || []).forEach((o) => { o.group.visible = m === 1; }); s.gEng.visible = m === 2;
      if (m === 0) {
        s.bn.setGas(s.heat ? 1 : 0); s.bn.flame.update(t); s.Tc = clamp(s.Tc + (s.heat ? 110 : -40) * dt, 25, 520); const hot = clamp((s.Tc - 250) / 270, 0, 1); s.cat.material.emissiveIntensity = hot * 1.1;
        const cracking = s.Tc > 400 && s.heat && s.oil > 0; if (cracking && dt > 0) { s.oil = Math.max(0, s.oil - dt * 0.02); s.gas = Math.min(1, s.gas + dt * 0.035); }
        s.wool.material.color.setRGB(lerp(0.88, 0.95, s.oil), lerp(0.84, 0.93, s.oil), lerp(0.7, 0.88, s.oil));
        const out = s.tubeOut; s.dt.visible = true; s.dt.position.y = out ? 0.75 : 0; s.collB.rate = cracking && !out ? 14 : 0; s.collB.update(dt, t); s.trL.update(t);
        /* inverted collecting tube: gas pushes the water down (clip plane set in world space) */ s.ctL.update(t); const top = 2.55, bot = 2.55 - 15 * CM, wl = lerp(top - 0.12, bot + 0.55, s.gas); s.ctL.mat.clippingPlanes[0].constant = wl; s.ctL.mat.userData.u.uSurf.value = wl; s.ctL.cap.visible = false;
        if (s.brTest) { s.brT += dt; const k = s.gas > 0.2 ? G.smooth(0.3, 2.5, s.brT) : 0; s.brL.setColor(G.mix([215, 120, 30], [232, 238, 242], k), lerp(0.6, 0.2, k)); s.brL.agit = s.brT < 2.5 ? 0.7 : 0; s.brOK = s.gas > 0.2; } s.brL.update(t);
        if (s.suck) { s.suckT = (s.suckT || 0) + dt; }
      } else if (m === 1) {
        if (s.crack) s.crackT += dt; const k = G.smooth(0.3, 2.2, s.crackT || 0); if (s.par) { s.par.group.visible = k < 0.5; s.par.group.rotation.y = t * 0.2; const sh = k < 0.5 ? 1 + 0.06 * Math.sin(t * 30) * (s.crack ? 1 : 0) : 1; s.par.group.scale.setScalar(0.42 * sh); }
        s.prods.forEach((p, i) => { p.mo.group.visible = k >= 0.5; p.mo.group.position.lerpVectors(p.from, p.to, k); p.mo.group.rotation.y = t * 0.3 * (i % 2 ? -1 : 1); });
      } else {
        const rpm = 1.2; s.crank += dt * TAU * rpm; const ang = s.crank % TAU, y = 1.95 + Math.cos(ang) * 0.6 * ((c.CR - 1) / c.CR) * 1.25 - 0.1, pY = y; s.piston.position.y = pY; S.setRod(s.rod, V3(0, pY - 0.15, 0), V3(Math.sin(ang) * 0.35, 0.65, 0));
        const top = 3.0, ch = top - (pY + 0.225); s.charge.scale.y = Math.max(0.01, ch); s.charge.position.y = pY + 0.225 + ch / 2;
        const need = 50 + (c.CR - 6) * 8.3, knock = c.ON < need; s.knock = knock; s.need = need; const ph = (ang / TAU); /* ph 0 = TDC */
        const sparkOn = ph < 0.04 || ph > 0.985, burn = ph < 0.25 ? 1 - ph / 0.25 : 0; const kn = knock && ph > 0.93 && ph < 0.985;
        s.spark.material.opacity = sparkOn ? 1 : 0; s.knockF.material.opacity = kn ? 0.95 : 0; s.knockF.scale.setScalar(kn ? 1.3 + Math.random() * 0.4 : 1);
        s.charge.material.opacity = burn * 0.5 + (kn ? 0.6 : 0); s.charge.material.color.setHex(kn ? 0xff5a10 : 0xffa040); s.engL.intensity = (burn * 4 + (kn ? 8 : 0)); s.gEng.position.x = 0.2 + (kn ? (Math.random() - 0.5) * 0.03 : 0);
      }
    },
    overlay(ctx, s, c, w, h, S) {
      const m = c.mode | 0, px = w - 250; ctx.save();
      if (m === 0) { G.titles(ctx, "Catalytic cracking of liquid paraffin", "heat the catalyst strongly; paraffin vapour cracks as it passes over it");
        G.tag(ctx, S, V3(-0.85, 2.7, 0), "paraffin on mineral wool", "#e8f0ff", 8); G.tag(ctx, S, V3(0.2, 2.95, 0), "catalyst (porous pot / Al₂O₃)  " + Math.round(s.Tc) + " °C", "#ffd27a", 8); G.tag(ctx, S, V3(2.72, 2.75, 0), "gas collected over water", "#cfe0f5", 8); G.tag(ctx, S, V3(-2.7, 3.25, 0.7), "bromine water", "#ffc08a", 8);
        G.panel(ctx, px, 58, 240, "Observations", ["gas collected: " + Math.round(s.gas * 100) + " % of the tube", s.brTest ? [s.brOK ? "bromine water: orange → colourless → the gas contains an ALKENE (ethene)" : "not enough gas yet: bromine water stays orange", s.brOK ? "#8dffb8" : "#ffb38a"] : "test: shake the gas with bromine water", "C₁₂H₂₆(l) → C₁₀H₂₂(l) + C₂H₄(g)  (one possibility)", s.suck ? ["SUCK-BACK! cold water rushed into the hot tube — always remove the delivery tube first", "#ff7a7a"] : s.tubeOut ? ["delivery tube out of the water: safe to stop heating", "#8dffb8"] : "safety: take the delivery tube out before you stop heating"]);
        if (s.suck) G.status(ctx, "suck-back: the boiling tube would crack", "bad"); }
      else if (m === 1) { const E = EQS[c.eq | 0]; G.titles(ctx, "Cracking: " + E.eq, "a C–C bond breaks; the products are a shorter alkane and an alkene");
        G.panel(ctx, px, 58, 240, "Why crack?", ["heavy fractions (C₁₂+) are made in excess; petrol (C₅–C₁₀) is in demand", "the alkene (ethene, propene, butene) is the raw material for plastics: poly(ethene), PVC", "atoms are conserved: C and H totals are the same on both sides", ["alkane CₙH₂ₙ₊₂ → alkane + alkene CₙH₂ₙ", "#ffe9b8"]]);
        if (s.par && s.par.group.visible) G.tag(ctx, S, V3(0.4, 2.7, 0), "C" + SUBN(E.parent) + "H" + SUBN(2 * E.parent + 2), "#ffe9b8", 10); s.prods.forEach((p) => { if (p.mo.group.visible) G.tag(ctx, S, p.mo.group.position.clone().add(V3(0, 0.75, 0)), p.lab, p.alk ? "#9fe3ff" : "#ffe9b8", 9.5); }); }
      else { G.titles(ctx, "Octane number and knocking", "petrol must not ignite before the spark when it is compressed");
        G.panel(ctx, px, 58, 240, "Engine", ["fuel octane number: " + c.ON, "compression ratio " + c.CR + " : 1 needs about " + Math.round(s.need), [s.knock ? "KNOCKING: the fuel–air mixture explodes before the spark (pinking), wasting energy and damaging the engine" : "smooth: the mixture burns only after the spark", s.knock ? "#ff9aa8" : "#8dffb8"], "octane 100 = 2,2,4-trimethylpentane (branched); octane 0 = heptane (straight chain)", "raise it by cracking, reforming (aromatics), isomerisation; lead additives are now banned"]);
        G.tag(ctx, S, V3(0.2, 3.85, 0), "spark plug", "#bfe0ff", 8.5); }
      ctx.restore();
    },
    readouts(s, c) { const m = c.mode | 0; if (m === 0) return [["Catalyst temperature", Math.round(s.Tc) + " °C"], ["Gas collected", Math.round(s.gas * 100) + " %"], ["Bromine water", s.brTest ? (s.brOK ? "decolourised" : "orange") : "not tested"]]; if (m === 1) return [["Reaction", EQS[c.eq | 0].eq], ["Products", "alkane + alkene"]]; return [["Octane number", c.ON], ["Compression ratio", c.CR + " : 1"], ["Knocking?", s.knock ? "yes" : "no"]]; },
    steps(s, c) { if ((c.mode | 0) === 1) return [["Choose a long-chain alkane", "done"], ["Crack it: a C–C bond breaks", s.crack ? "done" : "now"], ["Count the C and H atoms on each side", s.crack ? "now" : ""]]; if ((c.mode | 0) === 2) return [["Set the octane number of the petrol", "done"], ["Raise the compression ratio", "now"], ["Watch for knocking (early ignition)", s.knock ? "now" : ""]]; return [["Soak mineral wool in liquid paraffin; put catalyst in the middle", "done"], ["Heat the catalyst strongly, then flick the flame to the paraffin", s.heat ? "done" : "now"], ["Collect the gas over water (discard the first tube of air)", s.gas > 0.3 ? "done" : s.heat ? "now" : ""], ["Test the gas with bromine water", s.brTest ? "done" : s.gas > 0.3 ? "now" : ""], ["Remove the delivery tube, then stop heating", s.tubeOut ? "done" : s.brTest ? "now" : ""]]; },
  };
  const SUBN = (n) => String(n).replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[d]);
  const CRV = [[[1.6, 3.4, 8.8], [1.0, 1.4, 0]], [[1.2, 2.4, 7.0], [1.0, 1.4, 0]], [[1.6, 2.6, 6.6], [1.0, 1.9, 0]]], CRC = [[[0.6, 2.2, 3.6], [0.5, 1.6, 0]], [[0.4, 1.8, 4.2], [0.4, 1.4, 0]], [[0.6, 2.6, 3.6], [0.2, 2.3, 0]]];
  function restartCr(S, s, c) { s.heat = 0; s.Tc = 25; s.oil = 1; s.gas = 0; s.brTest = 0; s.brOK = 0; s.tubeOut = 0; s.suck = 0; s.suckT = 0; s.crack = 0; s.crackT = 0; if (s.brL) s.brL.setColor([215, 120, 30], 0.6); if (s.K) buildMols(S, s, c); }
  function buildMols(S, s, c) {
    (s.mols || []).forEach((o) => G.disposeGroup(o.group)); s.mols = []; s.prods = []; const E = EQS[c.eq | 0], K = s.K;
    s.par = G.molecule(K, G.build(G.chain(E.parent))); s.par.group.position.set(0.4, 1.4, 0); s.par.group.scale.setScalar(0.42); s.mols.push(s.par);
    const n = E.prods.length; E.prods.forEach(([nc, alk], i) => { const mo = G.molecule(K, G.build(G.chain(nc, alk ? { db: 1 } : {})), { scale: 0.45 }); const to = V3(0.4 + (i - (n - 1) / 2) * (n > 2 ? 1.5 : 2.0), 1.4 + (i % 2 ? 0.3 : 0), i % 2 ? -0.4 : 0.2); mo.group.position.set(0.4, 1.4, 0); s.mols.push(mo); s.prods.push({ mo, from: V3(0.4, 1.4, 0), to, alk, lab: "C" + SUBN(nc) + "H" + SUBN(alk ? 2 * nc : 2 * nc + 2) + (alk ? " (alkene)" : " (alkane)") }); });
  }

  /* =============================== alkanols =============================== */
  const ALK = [
    { n: "methanol", f: "CH₃OH", cls: "primary (1°)", spec: [{ el: "C" }, { el: "O", p: 0 }], cOH: 0, iod: false, ox: "methanal → methanoic acid" },
    { n: "ethanol", f: "C₂H₅OH", cls: "primary (1°)", spec: [{ el: "C" }, { el: "C", p: 0 }, { el: "O", p: 1 }], cOH: 1, iod: true, ox: "ethanal → ethanoic acid" },
    { n: "propan-1-ol", f: "CH₃CH₂CH₂OH", cls: "primary (1°)", spec: [{ el: "C" }, { el: "C", p: 0 }, { el: "C", p: 1 }, { el: "O", p: 2 }], cOH: 2, iod: false, ox: "propanal → propanoic acid" },
    { n: "propan-2-ol", f: "CH₃CH(OH)CH₃", cls: "secondary (2°)", spec: [{ el: "C" }, { el: "C", p: 0 }, { el: "C", p: 1 }, { el: "O", p: 1 }], cOH: 1, iod: true, ox: "propanone (a ketone); no further oxidation" },
    { n: "butan-1-ol", f: "CH₃(CH₂)₃OH", cls: "primary (1°)", spec: [{ el: "C" }, { el: "C", p: 0 }, { el: "C", p: 1 }, { el: "C", p: 2 }, { el: "O", p: 3 }], cOH: 3, iod: false, ox: "butanal → butanoic acid" },
    { n: "butan-2-ol", f: "CH₃CH(OH)CH₂CH₃", cls: "secondary (2°)", spec: [{ el: "C" }, { el: "C", p: 0 }, { el: "C", p: 1 }, { el: "C", p: 2 }, { el: "O", p: 1 }], cOH: 1, iod: true, ox: "butanone (a ketone)" },
    { n: "2-methylpropan-2-ol", f: "(CH₃)₃COH", cls: "tertiary (3°)", spec: [{ el: "C" }, { el: "C", p: 0 }, { el: "C", p: 1 }, { el: "C", p: 1 }, { el: "O", p: 1 }], cOH: 1, iod: false, ox: "not oxidised by acidified dichromate" },
  ];
  C3.scenes.alkanols = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.75, fov: 36, free: true, cam: [[1.4, 2.4, 7.0], [1.2, 1.2, 0]],
    values: { a: 1, sf: 0 },
    state: () => ({}),
    get controls() {
      return [
        { type: "select", key: "a", label: "Alkanol", options: ALK.map((m, i) => ({ value: i, label: m.n + "  " + m.f + "  — " + m.cls })) },
        { type: "button", label: "Run the three tests", action: (S, s) => { s.go = 1; s.t0 = S.t; } },
        { type: "toggle", key: "sf", label: "Space-filling model" },
        { type: "button", label: "Fresh test tubes", cls: "secondary", action: (S, s) => { s.go = 0; } },
      ];
    },
    views: [{ label: "Molecule + tests", cam: [[1.4, 2.4, 7.0], [1.2, 1.2, 0]] }, { label: "Test tubes", cam: [[2.4, 1.6, 4.0], [2.2, 1.0, 0]] }],
    note: "Alkanols CₙH₂ₙ₊₁OH are classified by the carbon atom that carries the –OH group: primary (1°) if it is joined to one other carbon (RCH₂OH), secondary (2°) if joined to two (R₂CHOH), tertiary (3°) if joined to three (R₃COH). All alkanols give hydrogen with sodium (2ROH + 2Na → 2RONa + H₂). Warm acidified potassium heptaoxodichromate(VI) turns from orange to green with 1° alkanols (→ alkanal → alkanoic acid) and 2° alkanols (→ alkanone), but not with 3° alkanols. The iodoform test (I₂ + NaOH, warm) gives a yellow precipitate of CHI₃ with ethanol and any alkanol containing CH₃CH(OH)–.",
    onChange(S, s, c, key) { s.go = 0; buildAlk(S, s, c); },
    reset(S, s, c) { Object.assign(c, { a: 1, sf: 0 }); s.go = 0; buildAlk(S, s, c); },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(10, 0.06, 3.8, M.matte(0xb69a76, 0.62), 0.6, 0, 0).receiveShadow = true;
      const ped = S.mk.cyl(1.5, 1.6, 0.1, M.plastic(0x1f2833, 0.3), -0.9, 0.05, 0); ped.receiveShadow = true;
      const rack = S.mk.rbox(2.6, 0.62, 0.5, 0.03, M.wood(), 2.1, 0.31, 0.3); rack.castShadow = true;
      const wb = K.beaker(); wb.group.position.set(2.1 + 0.85, 0, -0.9); wb.group.scale.set(1.4, 1.2, 1.4); s.wbL = wb.addLiquid({ color: [215, 232, 244], opacity: 0.2 }); s.wbL.setVolume(120);
      s.tubes = [0, 1, 2].map((i) => { const v = K.vessel("testtube"); v.group.position.set(1.25 + i * 0.85, 0.62, 0.3); const L = v.addLiquid({ color: [235, 240, 244], opacity: 0.25 }); L.setVolume(8); return { v, L }; });
      s.naBub = K.bubbles(s.tubes[0].v, s.tubes[0].L, { n: 30, spread: 0.15 }); s.na = new T.Mesh(new T.BoxGeometry(0.5 * CM, 0.35 * CM, 0.4 * CM), new T.MeshPhysicalMaterial({ color: 0xd8dbe0, metalness: 0.9, roughness: 0.35 })); s.tubes[0].v.group.add(s.na);
      s.iodP = K.precipitate(s.tubes[2].v, s.tubes[2].L, { color: 0xf2d028, n: 700, size: 0.03 });
      [["Na", "#cfe0f5"], ["K₂Cr₂O₇ / H⁺", "#ffc08a"], ["I₂ / NaOH", "#ffd27a"]].forEach(() => { });
      buildAlk(S, s, c);
    },
    update(S, s, c, dt) {
      const A = ALK[c.a | 0], el = s.go ? S.t - s.t0 : 0, t = S.t; if (s.mo) s.mo.group.rotation.y = Math.sin(t * 0.4) * 0.6;
      const k1 = G.smooth(0.3, 1.0, el); s.na.position.set(0, lerp(17 * CM, (1.0 + 8 * 0.35) * CM, k1), 0); s.na.visible = !!s.go && el < 9; s.na.scale.setScalar(Math.max(0.05, 1 - Math.max(0, el - 1) / 8)); s.naBub.rate = s.go && el > 1 && el < 9 ? 22 : 0; s.naBub.update(dt, t);
      const dich = A.cls.startsWith("tert") ? 0 : G.smooth(1.5, 5, el); s.tubes[1].L.setColor(s.go ? G.mix([235, 130, 30], [60, 150, 90], dich) : [235, 130, 30], 0.55);
      s.tubes[2].L.setColor(s.go ? G.mix([140, 70, 30], [240, 236, 220], G.smooth(0.5, 3, el)) : [140, 70, 30], s.go ? lerp(0.5, 0.25, G.smooth(0.5, 3, el)) : 0.5); s.iodP.amount = A.iod ? G.smooth(2.5, 7, el) * 0.8 : 0; s.iodP.update(dt);
      s.tubes.forEach((q, i) => { q.L.agit = s.go && el < 6 ? 0.5 : 0; q.L.update(t); }); s.wbL.update(t);
    },
    overlay(ctx, s, c, w, h, S) {
      const A = ALK[c.a | 0], px = w - 250, el = s.go ? S.t - s.t0 : 0; ctx.save(); G.titles(ctx, A.n + "   " + A.f, A.cls + " alkanol");
      if (s.mo && s.mo.atoms[A.cOH]) { const p = s.mo.group.localToWorld(s.mo.atoms[A.cOH].p.clone()); G.tag(ctx, S, p.add(V3(0, 0.45, 0)), "C bearing –OH", "#ffd27a", 8.5); }
      ["Na", "K₂Cr₂O₇/H⁺ (warm)", "I₂ + NaOH (warm)"].forEach((l, i) => G.tag(ctx, S, V3(1.25 + i * 0.85, 0.42, 0.62), l, "#cfe0f5", 7.5));
      const res = [["sodium: " + (s.go && el > 1 ? "fizzes, H₂ given off → all alkanols" : "—"), "#e8f0ff"], ["dichromate: " + (s.go && el > 4 ? (A.cls.startsWith("tert") ? "stays ORANGE: 3° not oxidised" : "orange → GREEN: oxidised to " + A.ox) : "—"), A.cls.startsWith("tert") ? "#ffb38a" : "#8dffb8"], ["iodoform: " + (s.go && el > 6 ? (A.iod ? "YELLOW precipitate of CHI₃ (antiseptic smell)" : "no yellow precipitate") : "—"), A.iod ? "#ffe08a" : "#e8f0ff"]];
      G.panel(ctx, px, 58, 240, "Test results", res.concat([["classification: " + A.cls, "#ffe9b8"]]));
      ctx.restore();
    },
    readouts(s, c) { const A = ALK[c.a | 0]; return [["Alkanol", A.n], ["Class", A.cls], ["Oxidation product", A.ox], ["Iodoform test", A.iod ? "positive" : "negative"]]; },
    table() { return G.table(["Alkanol", "Class", "K₂Cr₂O₇/H⁺", "Iodoform"], ALK.map((a) => [a.n, a.cls, a.cls.startsWith("tert") ? "stays orange" : "turns green", a.iod ? "yellow ppt" : "—"])); },
  };
  function buildAlk(S, s, c) { if (s.mo) G.disposeGroup(s.mo.group); const A = ALK[c.a | 0]; s.mo = G.molecule(s.K, G.build(A.spec), { scale: c.sf ? 0.42 : 0.62, pos: [-0.9, 1.35, 0] }); s.mo.refresh(c.sf ? 1 : 0); }
})();
