/* c3d-saltprep.js — chemistry 3D, new module: preparation of salts (excess-solid, titration, precipitation) and behaviour of salts in air (deliquescent, efflorescent) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, CM = C3.CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const CLR = [208, 230, 248];
  const PREP = {
    znso4: { label: "Zinc sulphate: zinc + dilute H₂SO₄", type: "excess", salt: "ZnSO₄·7H₂O", eq: "Zn(s) + H₂SO₄(aq) → ZnSO₄(aq) + H₂(g)", solid: 0x9aa3ab, sc: [234, 240, 244], xc: 0xf2f4f6, gas: "H₂", acid: "dilute sulphuric acid", why: "Zn is above hydrogen in the reactivity series, so it displaces H₂ and the sulphate is soluble.", sname: "zinc granules" },
    feso4: { label: "Iron(II) sulphate: iron + dilute H₂SO₄", type: "excess", salt: "FeSO₄·7H₂O", eq: "Fe(s) + H₂SO₄(aq) → FeSO₄(aq) + H₂(g)", solid: 0x4a4e55, sc: [196, 228, 196], xc: 0x9fd89a, gas: "H₂", acid: "dilute sulphuric acid", why: "Iron displaces hydrogen from dilute acid and gives green Fe²⁺ ions.", sname: "iron filings" },
    cuo: { label: "Copper(II) sulphate: copper(II) oxide + H₂SO₄", type: "excess", salt: "CuSO₄·5H₂O", eq: "CuO(s) + H₂SO₄(aq) → CuSO₄(aq) + H₂O(l)", solid: 0x1a1a1c, sc: [88, 160, 236], xc: 0x2f86e8, gas: null, acid: "dilute sulphuric acid (warm)", why: "Copper is below hydrogen so it will not react with the acid, but its oxide (an insoluble base) will.", sname: "black copper(II) oxide" },
    cuco3: { label: "Copper(II) sulphate: copper(II) carbonate + H₂SO₄", type: "excess", salt: "CuSO₄·5H₂O", eq: "CuCO₃(s) + H₂SO₄(aq) → CuSO₄(aq) + H₂O(l) + CO₂(g)", solid: 0x3fae8a, sc: [88, 160, 236], xc: 0x2f86e8, gas: "CO₂", acid: "dilute sulphuric acid", why: "A carbonate reacts with an acid to give a salt, water and CO₂, which fizzes away.", sname: "green copper(II) carbonate" },
    nacl: { label: "Sodium chloride: NaOH + HCl (titration)", type: "titr", salt: "NaCl", eq: "NaOH(aq) + HCl(aq) → NaCl(aq) + H₂O(l)", sc: CLR, xc: 0xf6f6f6, acid: "hydrochloric acid", why: "Both reactants are soluble, so no solid can be filtered off: find the exact volume by titration, then repeat without indicator.", sname: "" },
    pbi2: { label: "Lead(II) iodide: Pb(NO₃)₂ + KI (precipitation)", type: "ppt", salt: "PbI₂", eq: "Pb(NO₃)₂(aq) + 2KI(aq) → PbI₂(s) + 2KNO₃(aq)", sc: CLR, xc: 0xf0cd1a, ppt: 0xf0cd1a, why: "PbI₂ is insoluble: mixing two soluble salts that contain Pb²⁺ and I⁻ makes it as a precipitate.", sname: "" },
    baso4: { label: "Barium sulphate: BaCl₂ + Na₂SO₄ (precipitation)", type: "ppt", salt: "BaSO₄", eq: "BaCl₂(aq) + Na₂SO₄(aq) → BaSO₄(s) + 2NaCl(aq)", sc: CLR, xc: 0xf6f6f2, ppt: 0xf6f6f2, why: "BaSO₄ is insoluble (all sulphates dissolve except those of Ba, Pb and Ca slightly).", sname: "" },
    agcl: { label: "Silver chloride: AgNO₃ + NaCl (precipitation)", type: "ppt", salt: "AgCl", eq: "AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)", sc: CLR, xc: 0xf2f2ee, ppt: 0xf2f2ee, why: "All chlorides dissolve except AgCl and PbCl₂: the white precipitate forms at once.", sname: "" },
  };
  const KINDS = { excess: ["warm", "add", "filter", "evap", "xtal"], titr: ["pip", "titr", "rep", "evap", "xtal"], ppt: ["mix", "filter", "wash", "dry"] };
  const STEP = {
    warm: "Warm the dilute acid (about 60 °C) in a beaker", add: "Add the solid a little at a time until no more reacts (excess)", filter: "Filter off the excess solid / precipitate", evap: "Evaporate the filtrate to the crystallising point (glass-rod test)", xtal: "Leave to cool: crystals form; filter and dry between filter papers",
    pip: "Pipette 25.0 cm³ of alkali into a flask and add indicator", titr: "Titrate with acid to the end-point (pink → colourless)", rep: "Repeat with the same volumes but NO indicator", mix: "Mix the two clear solutions: a precipitate forms", wash: "Wash the residue with distilled water", dry: "Dry the residue in a warm oven or between filter papers",
  };
  const AIR = {
    cacl2: { name: "Calcium chloride (anhydrous)", f: "CaCl₂", rhd: 30, rhe: -1, kind: "deliquescent", note: "absorbs so much water vapour that it dissolves in it", m0: 111, color: 0xf2f2f0 },
    naoh: { name: "Sodium hydroxide pellets", f: "NaOH", rhd: 10, rhe: -1, kind: "deliquescent", note: "absorbs water vapour (and CO₂) and becomes a solution", m0: 40, color: 0xf4f4f6 },
    fecl3: { name: "Iron(III) chloride", f: "FeCl₃", rhd: 40, rhe: -1, kind: "deliquescent", note: "absorbs water vapour and dissolves into a brown solution", m0: 162, color: 0xb35a1a },
    na2co3: { name: "Washing soda crystals", f: "Na₂CO₃·10H₂O", rhd: 101, rhe: 55, kind: "efflorescent", note: "loses water of crystallisation to dry air and crumbles to powder", m0: 286, color: 0xe8f0f4 },
    cuso4: { name: "Blue copper(II) sulphate crystals", f: "CuSO₄·5H₂O", rhd: 101, rhe: 15, kind: "efflorescent (only in very dry air)", note: "stable in ordinary air; slowly loses water only when it is very dry", m0: 250, color: 0x2f86e8 },
    nacl: { name: "Sodium chloride", f: "NaCl", rhd: 75, rhe: -1, kind: "stable (deliquescent only above 75 % humidity)", note: "pure NaCl does not take up water until the air is very humid", m0: 58.5, color: 0xf6f6f6 },
  };
  const FIN = { na2co3: 0.43, cuso4: 0.64 };            // mass fraction left when the hydrate effloresces (to monohydrate / lower hydrate)
  const airMass = (k, rh, hrs) => { const a = AIR[k]; let m = 100; if (rh > a.rhd) { const r = 0.012 * (rh - a.rhd) * hrs; m = Math.min(100 + 220 * (1 - Math.exp(-r * 0.12)) * (k === "nacl" ? 0.2 : 1), 320); } else if (rh < a.rhe) { const fl = (FIN[k] || 0.5) * 100; m = lerp(100, fl, 1 - Math.exp(-0.002 * (a.rhe - rh) * hrs)); } return m; };
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const BASIN = { outer: [[0, 0], [2.4, 0], [5.9, 2.0], [6.4, 2.6]], inner: [[0, 0.3], [2.3, 0.3], [5.7, 2.1], [6.1, 2.6]] };

  C3.scenes.saltPrep = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.8, fov: 38, free: true, cam: [[1.7, 3.4, 14.0], [1.9, 1.7, 0]],
    values: { mode: "prep", prep: "cuo", salt: "cacl2", rh: 70, auto: 0 },
    state: () => ({ st: 0, pr: 0, run: false, hrs: 0, play: true, last: -1 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Topic", options: [{ value: "prep", label: "Preparing a salt" }, { value: "air", label: "Salts in air: deliquescent and efflorescent" }] },
        { type: "select", key: "prep", label: "Salt to prepare", options: Object.keys(PREP).map((k) => ({ value: k, label: PREP[k].label })) },
        { type: "button", label: "Do the next step", action: (S, s, c) => { const n = KINDS[PREP[c.prep].type].length; if (!s.run && s.st < n) { s.run = true; s.pr = 0; } } },
        { type: "toggle", key: "auto", label: "Run all the steps automatically" },
        { type: "button", label: "Start again", cls: "secondary", action: (S, s) => { s.st = 0; s.pr = 0; s.run = false; s.hrs = 0; } },
        { type: "select", key: "salt", label: "Substance left in the open air", options: Object.keys(AIR).map((k) => ({ value: k, label: AIR[k].name + " (" + AIR[k].f + ")" })) },
        { type: "range", key: "rh", label: "Relative humidity of the air (%)", min: 5, max: 95, step: 1, unit: " %" },
      ];
    },
    views: [{ label: "Bench", cam: [[1.7, 3.4, 14.0], [1.9, 1.7, 0]] }, { label: "Close up", cam: [[-2.4, 2.6, 7.4], [-2.4, 1.4, 0]] }, { label: "Basin", cam: [[1.9, 2.2, 5.6], [1.9, 0.9, 0]] }],
    note: "Choose the method from the solubility of the salt. Soluble salt from a metal, insoluble base or carbonate: add the solid in excess, filter, evaporate to the crystallising point and cool. Soluble salt from an alkali: titrate to find the exact volumes, then repeat without indicator. Insoluble salt: precipitate it by mixing two soluble salts, then filter, wash and dry. Air mode: deliquescent substances take up water vapour until they dissolve; efflorescent hydrates lose water of crystallisation to dry air.",
    onChange(S, s, c, key) { s.st = 0; s.pr = 0; s.run = false; s.hrs = 0; },
    reset(S, s, c) { Object.assign(c, { mode: "prep", prep: "cuo", salt: "cacl2", rh: 70, auto: 0 }); s.st = 0; s.pr = 0; s.run = false; s.hrs = 0; },
    table(s, c) {
      if (c.mode === "air") return '<table class="c3-table"><tr><th style="text-align:left">Substance</th><th style="text-align:left">Behaviour</th><th>takes up water above</th><th>loses water below</th></tr>' + Object.keys(AIR).map((k) => { const a = AIR[k]; return '<tr class="' + (k === c.salt ? "ok" : "") + '"><td style="text-align:left">' + a.name + " (" + a.f + ')</td><td style="text-align:left">' + a.kind + "</td><td>" + (a.rhd > 100 ? "-" : a.rhd + " %") + "</td><td>" + (a.rhe < 0 ? "-" : a.rhe + " %") + "</td></tr>"; }).join("") + "</table>";
      return '<table class="c3-table"><tr><th style="text-align:left">Salt wanted</th><th style="text-align:left">Method</th></tr><tr><td style="text-align:left">soluble, from a metal / insoluble base / carbonate</td><td style="text-align:left">excess solid, filter, crystallise</td></tr><tr><td style="text-align:left">soluble, from an alkali (NaOH, KOH, NH₃)</td><td style="text-align:left">titration, then crystallise</td></tr><tr><td style="text-align:left">insoluble</td><td style="text-align:left">precipitation, filter, wash, dry</td></tr></table>';
    },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; s.m4 = new T.Matrix4(); s.cl = new T.Color(); S.mk.box(9.4, 0.1, 3, M.matte(0x2a2e36, 0.7), -0.9, -0.05, 0); s.hb = [];
      const gl = new T.MeshStandardMaterial({ color: 0xcfe3ee, transparent: true, opacity: 0.4, roughness: 0.1, side: T.DoubleSide, depthWrite: false });
      s.stA = new T.Group(); s.stB = new T.Group(); s.stC = new T.Group(); [s.stA, s.stB, s.stC].forEach((g) => S.scene.add(g));
      const hotp = (x) => { const b = S.mk.box(1.7, 0.16, 1.7, M.matte(0x2a2c30, 0.5), x, 0.08, 0); s.hb.push(b); const r = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 0.02, 32), new T.MeshBasicMaterial({ color: 0x401010 })); r.position.set(x, 0.17, 0); S.scene.add(r); return r; };
      s.hotA = hotp(-4.0); s.hotC = hotp(1.9);
      /* A: reaction beaker */
      s.bk = K.vessel("beaker"); s.bk.group.position.set(-4.0, 0.18, 0); s.liqA = s.bk.addLiquid({ color: CLR, opacity: 0.4 }); s.liqA.setVolume(120);
      s.pileA = new T.Mesh(new T.CylinderGeometry(1.4 * CM, 2.4 * CM, 1.0 * CM, 20), new T.MeshStandardMaterial({ color: 0x999999, roughness: 0.9 })); s.pileA.position.y = 0.8 * CM; s.bk.group.add(s.pileA);
      s.bubA = K.bubbles(s.bk, s.liqA, { n: 50, x: 0, z: 0, baseY: 1.2, spread: 1.6 }); s.pptA = K.precipitate(s.bk, s.liqA, { n: 900, size: 0.1, color: 0xffffff });
      s.dropsA = K.drops({ color: 0xe8f0f4 }); s.sc = new T.Group(); s.sp = S.mk.rbox(0.55, 0.05, 0.25, 0.02, M.steel(), -3.6, 3.6, 0); S.scene.remove(s.sp);
      /* B: funnel + flask */
      s.fk = K.vessel("flask"); s.fk.group.position.set(-1.1, 0.0, 0); s.liqB = s.fk.addLiquid({ color: CLR, opacity: 0.4 }); s.liqB.setVolume(0);
      s.fun = new T.Mesh(new T.CylinderGeometry(1.0, 0.07, 1.0, 36, 1, true), gl); s.fun.position.set(-1.1, 2.65, 0); S.scene.add(s.fun);
      s.paper = new T.Mesh(new T.CylinderGeometry(0.9, 0.08, 0.9, 36, 1, true), new T.MeshStandardMaterial({ color: 0xf6f3ea, roughness: 1, side: T.DoubleSide })); s.paper.position.set(-1.1, 2.62, 0); S.scene.add(s.paper);
      s.resid = new T.Mesh(new T.SphereGeometry(0.35, 20, 12), new T.MeshStandardMaterial({ color: 0x999999, roughness: 0.9 })); s.resid.scale.y = 0.35; s.resid.position.set(-1.1, 2.3, 0); S.scene.add(s.resid);
      s.dropsB = K.drops({ color: 0xe8f0f4 });
      /* C: evaporating basin */
      s.bs = K.vessel(BASIN); s.bs.group.position.set(1.9, 0.18, 0); s.liqC = s.bs.addLiquid({ color: CLR, opacity: 0.4 }); s.liqC.setVolume(0);
      s.cry = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.0 }), 70); s.cry.frustumCulled = false; s.bs.group.add(s.cry); s.cd = []; for (let i = 0; i < 70; i++) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 0.85; s.cd.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, s: 0.08 + Math.random() * 0.1, rot: Math.random() * 3, d: Math.random() * 0.7 }); }
      s.steam = new T.InstancedMesh(new T.SphereGeometry(0.06, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }), 40); s.steam.frustumCulled = false; S.scene.add(s.steam); s.sd = []; for (let i = 0; i < 40; i++) s.sd.push({ u: Math.random(), x: (Math.random() - 0.5) * 1.4, z: (Math.random() - 0.5) * 0.8 });
      s.rod = null;
      /* air mode: watch glass with substance, humidity cloud */
      s.ag = new T.Group(); const wg = new T.Mesh(new T.CylinderGeometry(1.6, 1.0, 0.18, 40, 1, true), gl); wg.position.y = 0.09; s.ag.add(wg); s.apile = new T.Mesh(new T.SphereGeometry(0.7, 28, 16), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })); s.apile.scale.y = 0.45; s.apile.position.y = 0.3; s.ag.add(s.apile); s.apud = new T.Mesh(new T.CylinderGeometry(1, 1, 0.04, 40), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.7 })); s.apud.position.y = 0.2; s.ag.add(s.apud); s.ag.position.set(0, 0, 0); S.scene.add(s.ag);
      s.vap = new T.InstancedMesh(new T.SphereGeometry(0.05, 8, 6), new T.MeshBasicMaterial({ color: 0x9fd2ff, transparent: true, opacity: 0.7 }), 90); s.vap.frustumCulled = false; S.scene.add(s.vap); s.vd = []; for (let i = 0; i < 90; i++) s.vd.push({ x: (Math.random() - 0.5) * 7, y: Math.random() * 3.6, z: (Math.random() - 0.5) * 1.6, v: 0.2 + Math.random() * 0.3 });
    },
    update(S, s, c, dt) {
      const prepMode = c.mode === "prep";
      [s.stA, s.stB, s.stC, s.hotA, s.hotC, s.hb[0], s.hb[1], s.bk.group, s.fk.group, s.bs.group, s.fun, s.paper, s.resid, s.cry, s.steam].forEach((o) => { if (o) o.visible = prepMode; }); s.ag.visible = !prepMode; s.vap.visible = !prepMode;
      if (!prepMode) { this.airUpdate(S, s, c, dt); return; }
      const m = PREP[c.prep], kinds = KINDS[m.type], n = kinds.length;
      if (s.run && dt > 0) { s.pr += dt / (m.type === "titr" && kinds[s.st] === "titr" ? 5 : 3.5); if (s.pr >= 1) { s.pr = 0; s.run = false; s.st++; } } if (!s.run && c.auto && s.st < n) { s.run = true; s.pr = 0; }
      const ph = Math.min(n, s.st + (s.run ? s.pr : 0));
      /* state is a pure function of ph: apply every stage in order */
      const X = { volA: m.type === "titr" ? 0 : 40, colA: CLR, hotA: 0, pile: 0, bub: 0, ppt: 0, pptC: 0xffffff, volB: 0, paperR: 0, drip: 0, volC: 0, hotC: 0, steam: 0, cry: 0, tit: 0, tcol: CLR, wash: 0 };
      kinds.forEach((k, i) => {
        const p = clamp(ph - i, 0, 1); if (p <= 0 && k !== kinds[0]) return;
        switch (k) {
          case "warm": X.hotA = p; break;
          case "add": X.hotA = 1; X.colA = mixc(CLR, m.sc, clamp(p * 1.1, 0, 1)); X.pile = p < 0.85 ? 0.25 * p : 0.22; X.bub = m.gas && p < 1 && p > 0 ? 34 * (1 - p * 0.85) : 0; break;
          case "filter": X.hotA = 0.5 * (1 - p); X.colA = m.sc; if (m.type === "excess") { X.volA = 40 * (1 - p); X.volB = 40 * p; X.pile = 0.22 * (1 - p); X.paperR = 0.22 * p; X.colA = m.sc; X.drip = p > 0.05 && p < 0.97 ? 1 : 0; } else { X.colA = CLR; X.ppt = 1 - p; X.pptC = m.ppt; X.volA = 40 * (1 - p); X.volB = 40 * p; X.paperR = p * 0.3; X.drip = p > 0.05 && p < 0.97 ? 1 : 0; } X.colB = m.sc; break;
          case "evap": X.hotA = 0; X.volA = 0; X.pile = 0; X.paperR = 0.22; X.volB = 0; X.volC = 40 * (1 - 0.7 * p) + (p < 0.02 ? 40 * (1 - p / 0.02) : 0) * 0; X.hotC = p; X.steam = p < 1 ? 1 : 0; X.colB = m.sc; break;
          case "xtal": X.hotA = 0; X.volA = 0; X.pile = 0; X.paperR = 0.22; X.volB = 0; X.volC = 12 * (1 - 0.35 * p); X.cry = p; X.hotC = 0; break;
          case "pip": X.volA = 25 * p; X.colA = [236, 90, 150]; break;
          case "titr": X.volA = 25 + 25 * p; X.colA = p < 0.88 ? [236, 90, 150] : mixc([236, 90, 150], CLR, clamp((p - 0.88) / 0.04, 0, 1)); X.tit = p > 0.02 && p < 0.97 ? 1 : 0; break;
          case "rep": X.volA = 50 * p; X.colA = CLR; X.tit = p > 0.02 && p < 0.97 ? 1 : 0; break;
          case "mix": X.volA = 40; X.ppt = p; X.pptC = m.ppt; X.colA = CLR; break;
          case "wash": X.volA = 0; X.volB = 0; X.paperR = 0.3; X.wash = p > 0.05 && p < 0.97 ? 1 : 0; X.drip = X.wash; break;
          case "dry": X.paperR = 0.3 * (1 - 0.25 * p); X.hotC = 0; break;
        }
      });
      if (m.type === "titr" && ph > 2) { /* evaporate/crystallise happen in the basin from the combined solution */ }
      if (m.type === "titr") { const q = kinds.indexOf("rep"); if (ph >= q + 1) { X.volA = 0; } }
      /* apply */
      s.liqA.setVisible(X.volA > 0.2); s.liqA.setColor(X.colA, 0.42); s.liqA.setVolume(Math.max(0.1, X.volA * 3.2)); s.liqA.update(S.t);
      const colB = m.type === "ppt" ? CLR : m.sc; s.liqB.setVisible(X.volB > 0.2); s.liqB.setColor(colB, 0.42); s.liqB.setVolume(Math.max(0.1, X.volB * 3.2)); s.liqB.update(S.t);
      s.liqC.setVisible(X.volC > 0.2); s.liqC.setColor(ph >= (kinds.indexOf("evap") >= 0 ? kinds.indexOf("evap") : 99) ? mixc(m.sc, [m.sc[0] * 0.9, m.sc[1] * 0.95, m.sc[2]], 0.5) : m.sc, 0.45); s.liqC.setVolume(Math.max(0.1, X.volC * 1.8)); s.liqC.update(S.t);
      s.pileA.visible = X.pile > 0.01; s.pileA.scale.set(1, Math.max(0.2, X.pile / 0.22), 1); s.pileA.material.color.setHex(m.solid || 0x999999);
      s.bubA.rate = X.bub; s.bubA.update(dt, S.t); s.pptA.setColor(X.pptC); s.pptA.amount = X.ppt; s.pptA.update(dt);
      s.resid.visible = X.paperR > 0.01; s.resid.scale.set(1, 0.35, 1); s.resid.scale.setScalar(0.5 + X.paperR * 1.6); s.resid.scale.y = 0.25 + X.paperR * 0.4; s.resid.material.color.setHex(m.type === "excess" ? (m.solid || 0x999999) : m.ppt || 0xffffff);
      s.paper.material.color.setHex(0xf6f3ea);
      const hot = (mesh, h) => { mesh.material.color.setRGB(0.25 + 0.75 * h, 0.06 + 0.14 * h, 0.06); };
      hot(s.hotA, X.hotA); hot(s.hotC, X.hotC);
      if (dt > 0 && X.drip) { s.da = (s.da || 0) + dt * 5; while (s.da >= 1) { s.da -= 1; s.dropsB.emit(-1.1, 2.2, 0, 0.18 + Math.max(0.3, s.liqB.level * CM) + 0.0, 0.03); } } s.dropsB.setColor(m.type === "ppt" ? 0xe8f0f4 : new T.Color().setRGB(m.sc[0] / 255, m.sc[1] / 255, m.sc[2] / 255)); s.dropsB.update(dt);
      if (dt > 0 && X.tit) { s.dt = (s.dt || 0) + dt * 4; while (s.dt >= 1) { s.dt -= 1; s.dropsA.emit(-4.0, 3.3, 0, 0.2 + s.liqA.level * CM, 0.03); } } s.dropsA.update(dt);
      s.sd.forEach((q, i) => { q.u = (q.u + dt * 0.45) % 1; const on = X.steam && i < 36; if (!on) { s.m4.makeScale(0, 0, 0); } else { s.m4.makeTranslation(1.9 + q.x * (0.5 + q.u * 0.6), 0.9 + q.u * 2.2, q.z); } s.steam.setMatrixAt(i, s.m4); }); s.steam.instanceMatrix.needsUpdate = true;
      const cnt = Math.floor(70 * clamp(X.cry, 0, 1)); s.cd.forEach((q, i) => { const g = i < cnt ? clamp(X.cry * 1.4 - q.d * 0.4, 0, 1) : 0; s.m4.makeRotationY(q.rot); s.m4.scale(new T.Vector3(q.s * g * 1.2, q.s * g * 1.5, q.s * g * 1.2)); s.m4.setPosition(q.x, 0.3 * CM + 0.06 + q.s * 0.4 * g, q.z); s.cry.setMatrixAt(i, s.m4); }); s.cry.instanceMatrix.needsUpdate = true; s.cry.material.color.setHex(m.xc);
      if (m.type === "titr") { s.fk.group.visible = false; s.fun.visible = false; s.paper.visible = false; s.resid.visible = false; } s.X = X; s.ph = ph; s.n = n; s.kinds = kinds;
    },
    airUpdate(S, s, c, dt) {
      if (dt > 0) s.hrs = Math.min(48, s.hrs + dt * 1.2); const a = AIR[c.salt], mp = airMass(c.salt, c.rh, s.hrs); s.mp = mp;
      s.apile.material.color.setHex(a.color); s.apud.material.color.setHex(a.color === 0xb35a1a ? 0x8a4010 : a.color); const d = mp > 101, e = mp < 99;
      const wet = d ? clamp((mp - 100) / 120, 0, 1) : 0, dry = e ? clamp((100 - mp) / 60, 0, 1) : 0; s.apile.scale.set(1 + 0.4 * wet - 0.1 * dry, 0.45 * (1 - 0.65 * wet) * (1 - 0.2 * dry), 1 + 0.4 * wet - 0.1 * dry); s.apud.visible = wet > 0.05; s.apud.scale.set(0.5 + wet * 1.0, 1, 0.5 + wet * 1.0); s.apud.material.opacity = 0.75;
      if (e) s.apile.material.color.setHex(0xf2f2ee); if (e && c.salt === "cuso4") s.apile.material.color.setHex(0x9fc6ee);
      const n = Math.floor(90 * c.rh / 100); s.vd.forEach((q, i) => { if (dt > 0) { q.y += q.v * dt * (d ? -1.2 : e ? 1 : 0.1); if (q.y < 0.3) q.y = 3.6; if (q.y > 3.6) q.y = 0.4; } if (i >= n) s.m4.makeScale(0, 0, 0); else s.m4.makeTranslation(q.x, q.y, q.z); s.vap.setMatrixAt(i, s.m4); }); s.vap.instanceMatrix.needsUpdate = true;
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); const px = w - 250;
      if (c.mode === "air") {
        const a = AIR[c.salt], mp = s.mp, d = mp > 101, e = mp < 99; H.pill(ctx, 10, 22, a.name + " in air at " + c.rh + " % humidity", "#ffe9b8", 11); H.pill(ctx, 10, 44, d ? "DELIQUESCENT: takes up water and dissolves" : e ? "EFFLORESCENT: loses water of crystallisation" : "no change at this humidity", d ? "#9fe3ff" : e ? "#ffd27a" : "#cbd6e8", 10);
        const gx = px, gy = 58, gw = 240, gh = 150, pts = []; for (let t = 0; t <= 48; t += 2) pts.push([t, airMass(c.salt, c.rh, t)]); const ymax = Math.max(120, ...pts.map((p) => p[1])) * 1.05, ymin = Math.min(60, ...pts.map((p) => p[1])) * 0.95;
        H.graph(ctx, gx, gy, gw, gh, { series: [{ pts, color: "#9fe3ff", width: 2 }], xmin: 0, xmax: 48, ymin, ymax, ticksX: 4, ticksY: 4, xl: "time / hours", yl: "mass / % of start", dot: [s.hrs, mp, "#ffd27a"] });
        H.panel(ctx, px, 214, 240, 74); ctx.textAlign = "left"; ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText("mass now = " + mp.toFixed(0) + " % of the starting mass", px + 8, 230); ctx.fillStyle = "#9fb2d2"; wrapT(ctx, a.note, px + 8, 244, 224, 11);
        const q = S.proj(V3(0, 1.2, 0)); H.pill(ctx, q.x, q.y, "watch glass: " + a.f, "#bcd0ea", 8.5, "center");
        ctx.restore(); return;
      }
      const m = PREP[c.prep], X = s.X, kinds = s.kinds, ph = s.ph, idx = Math.min(s.n - 1, Math.floor(ph - 1e-6)), cur = ph >= s.n ? "Finished: " + m.salt + " obtained" : STEP[kinds[Math.max(0, Math.floor(ph))]];
      H.pill(ctx, 10, 22, "Preparing " + m.salt, "#ffe9b8", 11); H.pill(ctx, 10, 44, ph >= s.n ? "Finished" : (s.run ? "Step " + (s.st + 1) + " of " + s.n + ": in progress" : "Press ‘Do the next step’ (step " + (s.st + 1) + " of " + s.n + ")"), ph >= s.n ? "#7dffbd" : "#9fe3ff", 10);
      H.panel(ctx, px, 58, 240, 150); ctx.textAlign = "left"; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Steps", px + 8, 73); ctx.font = "8.8px 'IBM Plex Mono',monospace"; let y = 87;
      kinds.forEach((k, i) => { const done = ph >= i + 1 - 1e-6, now = !done && (s.run ? i === s.st : i === s.st); ctx.fillStyle = done ? "#7dffbd" : now ? "#ffd27a" : "#9fb2d2"; ctx.fillText((done ? "✓ " : now ? "▶ " : "  ") + (i + 1) + ". ", px + 8, y); y = wrapT(ctx, STEP[k], px + 28, y, 204, 10.5) + 13; });
      H.panel(ctx, px, 214, 240, 78); ctx.fillStyle = "#e8f0ff"; ctx.font = "9px 'IBM Plex Mono',monospace"; let y2 = wrapT(ctx, m.eq, px + 8, 229, 224, 11); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; wrapT(ctx, m.why, px + 8, y2 + 14, 224, 10.5);
      const lab = (x, yy, t) => { const q = S.proj(V3(x, yy, 0)); H.pill(ctx, q.x, q.y, t, "#bcd0ea", 8.5, "center"); };
      lab(-4.0, 3.0, m.type === "titr" ? "flask: alkali" : m.type === "ppt" ? "beaker: mixture" : "beaker: acid + solid"); if (m.type !== "titr") lab(-1.1, 3.45, "funnel + filter paper"); lab(1.9, 1.1, "evaporating basin"); if (X && X.hotA > 0.1) lab(-4.0, -0.3, "hot plate");
      ctx.restore();
    },
    readouts(s, c) {
      if (c.mode === "air") { const a = AIR[c.salt]; return [["Substance", a.name + ", " + a.f], ["Behaviour in air", a.kind], ["Relative humidity", c.rh + " %"], ["Mass now", s.mp.toFixed(0) + " % of the starting mass after " + s.hrs.toFixed(0) + " h"], ["Deliquescent", "absorbs water vapour until it dissolves (CaCl₂, NaOH, FeCl₃)"], ["Efflorescent", "loses water of crystallisation (Na₂CO₃·10H₂O, Na₂SO₄·10H₂O)"]]; }
      const m = PREP[c.prep]; const rows = [["Salt", m.salt], ["Method", m.type === "excess" ? "acid + excess insoluble solid, filter, crystallise" : m.type === "titr" ? "titration, then crystallise" : "precipitation, filter, wash, dry"], ["Equation", m.eq], ["Why this method", m.why]]; if (m.gas) rows.push(["Gas given off", m.gas]); if (s.X) rows.push(["Step", Math.min(s.n, s.st + 1) + " of " + s.n + (s.ph >= s.n ? " (done)" : "")]); return rows;
    },
    steps(s, c) { if (c.mode === "air") return [["Pick a substance and set the humidity", "now"], ["Watch the mass over 48 h on the graph", ""], ["Compare a deliquescent with an efflorescent substance", ""]]; const m = PREP[c.prep]; return KINDS[m.type].map((k, i) => [STEP[k], s.ph >= i + 1 - 1e-6 ? "done" : i === s.st ? "now" : ""]); },
  };
})();
