/* c3d-gasprep.js — chemistry 3D, new module: laboratory preparation, collection and tests of gases (O₂, H₂, CO₂, NH₃, Cl₂, HCl) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, CM = C3.CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const AIR = 29, JAR = 500, YIELD = 900;                 // Mr(air); jar volume in cm³; total gas the flask can give in cm³
  const GAS = {
    o2: { name: "Oxygen", f: "O₂", Mr: 32, heat: 0, eq: "2H₂O₂(aq) → 2H₂O(l) + O₂(g)", re: "hydrogen peroxide + MnO₂ catalyst", dry: "conc. H₂SO₄", sol: "sparingly soluble", liq: [232, 240, 247], solid: 0x1b1b1d, col: 0xa9cdf5, op: 0.5 },
    h2: { name: "Hydrogen", f: "H₂", Mr: 2, heat: 0, eq: "Zn(s) + 2HCl(aq) → ZnCl₂(aq) + H₂(g)", re: "zinc granules + dilute hydrochloric acid", dry: "conc. H₂SO₄", sol: "insoluble", liq: [226, 240, 248], solid: 0xa3acb4, col: 0xa9cdf5, op: 0.5 },
    co2: { name: "Carbon dioxide", f: "CO₂", Mr: 44, heat: 0, eq: "CaCO₃(s) + 2HCl(aq) → CaCl₂(aq) + H₂O(l) + CO₂(g)", re: "marble chips + dilute hydrochloric acid", dry: "conc. H₂SO₄", sol: "slightly soluble (makes H₂CO₃)", liq: [226, 240, 248], solid: 0xeeeae0, col: 0xa9cdf5, op: 0.5 },
    nh3: { name: "Ammonia", f: "NH₃", Mr: 17, heat: 1, eq: "2NH₄Cl(s) + Ca(OH)₂(s) → CaCl₂(s) + 2H₂O(g) + 2NH₃(g)", re: "ammonium chloride + calcium hydroxide, heated (dry solids)", dry: "quicklime, CaO", sol: "extremely soluble (≈ 700 dm³ in 1 dm³ of water)", liq: null, solid: 0xf2f2ee, col: 0xa9cdf5, op: 0.5 },
    cl2: { name: "Chlorine", f: "Cl₂", Mr: 71, heat: 1, eq: "MnO₂(s) + 4HCl(conc) → MnCl₂ + 2H₂O + Cl₂(g)", re: "manganese(IV) oxide + conc. HCl, heated", dry: "conc. H₂SO₄ (after washing with water)", sol: "fairly soluble (reacts with water)", liq: [238, 236, 205], solid: 0x1b1b1d, col: 0xc8dc3c, op: 0.6 },
    hcl: { name: "Hydrogen chloride", f: "HCl", Mr: 36.5, heat: 1, eq: "NaCl(s) + H₂SO₄(conc) → NaHSO₄(s) + HCl(g)", re: "sodium chloride + conc. sulphuric acid, heated", dry: "conc. H₂SO₄", sol: "extremely soluble (≈ 450 dm³ in 1 dm³ of water)", liq: [242, 240, 226], solid: 0xf4f4f2, col: 0xd9e4f0, op: 0.3 },
  };
  /* fraction of the gas that actually ends up in the jar for each method, from solubility and density: 1 = collected well */
  const EFF = { o2: { water: 1, down: 0.7, up: 0.1 }, h2: { water: 1, down: 0, up: 0.9 }, co2: { water: 0.3, down: 1, up: 0 }, nh3: { water: 0, down: 0, up: 1 }, cl2: { water: 0.15, down: 1, up: 0 }, hcl: { water: 0, down: 1, up: 0 } };
  const METHOD = { water: "Over water (downward displacement of water)", down: "Downward delivery (upward displacement of air)", up: "Upward delivery (downward displacement of air)" };
  const TESTS = { glow: "Glowing splint", lit: "Lighted splint", red: "Damp red litmus paper", blue: "Damp blue litmus paper", lime: "Limewater" };
  const WHY = { water: "gas must be insoluble (or sparingly soluble) in water", down: "gas must be denser than air (Mr > 29) and not react with air", up: "gas must be lighter than air (Mr < 29)" };
  /* result of every test on every gas: [what is seen, conclusion] */
  const RES = {
    o2: { glow: ["relights", "oxygen supports burning"], lit: ["burns brighter", "oxygen"], red: ["no change", "neutral gas"], blue: ["no change", "neutral gas"], lime: ["no change", "not CO₂"] },
    h2: { glow: ["goes out", "not oxygen"], lit: ["squeaky pop", "hydrogen (burns with O₂ to make water)"], red: ["no change", "neutral gas"], blue: ["no change", "neutral gas"], lime: ["no change", "not CO₂"] },
    co2: { glow: ["goes out", "not oxygen"], lit: ["flame goes out", "does not support burning"], red: ["no change", "only weakly acidic"], blue: ["turns pink slowly", "weakly acidic gas"], lime: ["turns milky", "carbon dioxide (CaCO₃ forms)"] },
    nh3: { glow: ["goes out", "not oxygen"], lit: ["flame goes out", "does not support burning"], red: ["turns BLUE", "alkaline gas: ammonia (the only common alkaline gas)"], blue: ["no change", "not acidic"], lime: ["no change", "not CO₂"] },
    cl2: { glow: ["goes out", "not oxygen"], lit: ["flame goes out", "does not support burning"], red: ["bleached white", "chlorine bleaches dye"], blue: ["turns red, then bleached white", "chlorine (acidic and bleaching)"], lime: ["no change", "not CO₂"] },
    hcl: { glow: ["goes out", "not oxygen"], lit: ["flame goes out", "does not support burning"], red: ["no change", "acidic gas, litmus already red"], blue: ["turns RED", "acidic gas: HCl (white fumes with NH₃)"], lime: ["no change", "not CO₂"] },
  };
  const AIRRES = { glow: ["stays glowing", "ordinary air"], lit: ["burns normally", "ordinary air"], red: ["no change", "no gas"], blue: ["no change", "no gas"], lime: ["no change", "no gas"] };
  const PATH = {
    water: [[-3.6, 4.85], [-3.6, 5.1], [-0.2, 5.1], [-0.2, 0.5], [0.6, 0.5], [0.6, 1.15]],
    up: [[-3.6, 4.85], [-3.6, 5.1], [-0.2, 5.1], [-0.2, 0.3], [0.6, 0.3], [0.6, 2.7]],
    down: [[-3.6, 4.85], [-3.6, 5.1], [0.6, 5.1], [0.6, 0.45]],
  };
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const best = (g) => { const e = EFF[g]; return e.water >= 0.9 ? "water" : e.up >= 0.9 ? "up" : "down"; };

  C3.scenes.gasPreparation = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.8, fov: 38, free: true, cam: [[2.1, 3.6, 13.6], [2.1, 2.4, 0]],
    values: { gas: "co2", method: "down", rate: 60, burner: 0, test: "lime" },
    state: () => ({ prod: 0, col: 0, tst: null, last: null, acc: 0, sample: 0, lw: 0, flash: 0 }),
    get controls() {
      return [
        { type: "select", key: "gas", label: "Gas to prepare", options: Object.keys(GAS).map((k) => ({ value: k, label: GAS[k].name + " (" + GAS[k].f + ")" })) },
        { type: "select", key: "method", label: "Method of collection", options: Object.keys(METHOD).map((k) => ({ value: k, label: METHOD[k] })) },
        { type: "range", key: "rate", label: "Reagent supply (reaction rate)", min: 20, max: 100, step: 5, unit: " %" },
        { type: "toggle", key: "burner", label: "Light the Bunsen burner (needed for NH₃, Cl₂, HCl)" },
        { type: "select", key: "test", label: "Test to carry out on the gas", options: Object.keys(TESTS).map((k) => ({ value: k, label: TESTS[k] })) },
        { type: "button", label: "Run the test on the collected gas", action: (S, s) => { s.tst = { t: 0 }; s.sample = 0; s.lw = 0; } },
        { type: "button", label: "New batch of reagents", cls: "secondary", action: (S, s) => { s.prod = 0; s.col = 0; s.tst = null; s.last = null; s.sample = 0; s.lw = 0; } },
      ];
    },
    views: [{ label: "Apparatus", cam: [[2.1, 3.6, 13.6], [2.1, 2.4, 0]] }, { label: "Collection", cam: [[1.4, 2.0, 7.5], [1.4, 1.6, 0]] }, { label: "Test tubes", cam: [[2.9, 2.2, 6.2], [2.9, 1.6, 0]] }],
    note: "Choose the collection method from two properties: solubility in water and density compared with air (Mr of air ≈ 29). Gases that are insoluble (O₂, H₂) can be collected over water; soluble gases are collected by displacement of air — downward delivery if the gas is denser than air (CO₂, Cl₂, HCl), upward delivery if lighter (NH₃, H₂). Try a wrong choice and see why it fails. Heated preparations (NH₃, Cl₂, HCl) need the burner; in practice NH₃ is made in a hard-glass test tube. Always prepare Cl₂ and HCl in a fume cupboard.",
    onChange(S, s, c, key) {
      if (key === "gas") { c.method = best(c.gas); c.burner = GAS[c.gas].heat ? 1 : 0; c.test = c.gas === "nh3" ? "red" : c.gas === "co2" ? "lime" : c.gas === "h2" ? "lit" : c.gas === "o2" ? "glow" : "blue"; }
      s.prod = 0; s.col = 0; s.tst = null; s.last = null; s.sample = 0; s.lw = 0;
    },
    reset(S, s, c) { Object.assign(c, { gas: "co2", method: "down", rate: 60, burner: 0, test: "lime" }); s.prod = 0; s.col = 0; s.tst = null; s.last = null; s.sample = 0; s.lw = 0; },
    table(s, c) {
      return '<table class="c3-table"><tr><th style="text-align:left">Gas</th><th>Mr</th><th>vs air</th><th style="text-align:left">Solubility</th><th style="text-align:left">Collect by</th><th style="text-align:left">Drying agent</th></tr>' +
        Object.keys(GAS).map((k) => { const g = GAS[k]; return '<tr class="' + (k === c.gas ? "ok" : "") + '"><td style="text-align:left">' + g.name + " (" + g.f + ")</td><td>" + g.Mr + "</td><td>" + (g.Mr > AIR ? "denser" : "lighter") + '</td><td style="text-align:left">' + g.sol + '</td><td style="text-align:left">' + METHOD[best(k)].split(" (")[0] + '</td><td style="text-align:left">' + g.dry + "</td></tr>"; }).join("") + "</table>";
    },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; s.m4 = new T.Matrix4(); s.cl = new T.Color();
      const gl = new T.MeshStandardMaterial({ color: 0xcfe3ee, transparent: true, opacity: 0.75, roughness: 0.1 });
      S.mk.box(11, 0.1, 3, M.matte(0x2a2e36, 0.7), 0.4, -0.05, 0);
      /* tripod + gauze */
      s.GY = 2.5; const tx = -3.6; for (let i = 0; i < 3; i++) { const a = i * 2.094 + 1.57, px = tx + Math.cos(a) * 0.9, pz = Math.sin(a) * 0.9; S.mk.rod(V3(px, 0, pz), V3(px, 2.45, pz), 0.04, M.steel()); }
      S.mk.cyl(1.0, 1.0, 0.03, M.matte(0x8d9299, 0.6), tx, 2.47, 0); S.mk.cyl(0.9, 0.9, 0.02, M.matte(0xb9bdc3, 0.9), tx, 2.5, 0);
      s.fl = K.vessel("flask"); s.fl.group.position.set(tx, s.GY, 0); s.liq = s.fl.addLiquid({ color: [226, 240, 248], opacity: 0.4 }); s.liq.setVolume(120);
      s.pile = new T.Mesh(new T.CylinderGeometry(2.6 * CM, 2.9 * CM, 0.7 * CM, 24), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 })); s.pile.position.y = 0.65 * CM; s.fl.group.add(s.pile);
      s.bub = K.bubbles(s.fl, s.liq, { n: 50, x: 0, z: 0, baseY: 1.2, spread: 1.8 });
      s.bung = S.mk.cyl(0.25, 0.3, 0.3, M.rubber(), tx, s.GY + 2.15, 0);
      s.bunsen = K.bunsen({ x: tx, z: 0, flameH: 3 }); s.bunsen.setAir(1); s.bunsen.setGas(0);
      /* delivery tube */
      s.seg = []; for (let i = 0; i < 5; i++) { const m = S.mk.rod(V3(0, 0, 0), V3(0, 1, 0), 0.05, gl); s.seg.push(m); }
      s.flow = new T.InstancedMesh(new T.SphereGeometry(0.05, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff }), 40); s.flow.frustumCulled = false; S.scene.add(s.flow); s.fd = []; for (let i = 0; i < 40; i++) s.fd.push({ u: i * 0.4 });
      /* trough with water, jar, gas, water column, clamp */
      s.trough = new T.Group(); const tw = new T.Mesh(new T.BoxGeometry(3.0, 1.0, 1.9), new T.MeshStandardMaterial({ color: 0xcfe3ee, transparent: true, opacity: 0.22, roughness: 0.1, side: T.DoubleSide, depthWrite: false })); tw.position.y = 0.5; s.trough.add(tw);
      const wt = new T.Mesh(new T.BoxGeometry(2.88, 0.8, 1.78), new T.MeshStandardMaterial({ color: 0x4a9ae0, transparent: true, opacity: 0.4, roughness: 0.1, depthWrite: false })); wt.position.y = 0.45; s.trough.add(wt); s.trough.position.set(0.6, 0, 0); S.scene.add(s.trough);
      s.jar = K.vessel("gasjar"); s.gasM = new T.Mesh(new T.CylinderGeometry(0.52, 0.52, 1, 32), new T.MeshBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.3, depthWrite: false })); s.gasM.renderOrder = 3; S.scene.add(s.gasM);
      s.wcol = new T.Mesh(new T.CylinderGeometry(0.53, 0.53, 1, 32), new T.MeshBasicMaterial({ color: 0x4a9ae0, transparent: true, opacity: 0.35, depthWrite: false })); s.wcol.renderOrder = 2; S.scene.add(s.wcol);
      s.clamp = new T.Group(); const rod = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 4.6, 12), M.steel()); rod.position.set(1.6, 2.3, -0.7); s.clamp.add(rod); s.clamp.add(S.mk.rod(V3(1.6, 1.9, -0.7), V3(0.95, 1.9, -0.1), 0.035, M.steel())); S.scene.remove(s.clamp.children[1]); s.clamp.children[1] = s.clamp.children[1]; S.scene.add(s.clamp);
      /* test tube (gas sample) with splint / litmus, and limewater tube */
      s.tt = K.vessel("testtube"); s.tt.group.position.set(3.15, 0, 0); s.gs = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 2.3, 16), new T.MeshBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.3, depthWrite: false })); s.gs.position.set(3.15, 1.2, 0); s.gs.renderOrder = 3; S.scene.add(s.gs);
      s.lt = K.vessel("testtube"); s.lt.group.position.set(2.4, 0, 0); s.llq = s.lt.addLiquid({ color: [228, 242, 250], opacity: 0.28 }); s.llq.setVolume(6); s.lppt = K.precipitate(s.lt, s.llq, { n: 600, size: 0.09, color: 0xf6f6f2 });
      s.lb = K.bubbles(s.lt, s.llq, { n: 30, x: 0, z: 0, baseY: 0.6, spread: 0.2 });
      s.sp = new T.Group(); const stick = new T.Mesh(new T.BoxGeometry(0.03, 1.2, 0.03), new T.MeshStandardMaterial({ color: 0xc8a06a, roughness: 0.9 })); stick.position.y = 0.6; s.sp.add(stick); s.tip = new T.Mesh(new T.SphereGeometry(0.05, 12, 10), new T.MeshBasicMaterial({ color: 0xff5a1a })); s.sp.add(s.tip); s.fm = new T.Mesh(new T.ConeGeometry(0.075, 0.3, 14), new T.MeshBasicMaterial({ color: 0xffa633, transparent: true, opacity: 0.9 })); s.fm.position.y = 0.17; s.sp.add(s.fm);
      s.glow = S.mk.soft(0xffa040, 0.7, 0, 0, 0, 0.0); S.scene.remove(s.glow); s.sp.add(s.glow); s.flash = S.mk.soft(0xffffff, 1.6, 0, 0, 0, 0.0); S.scene.remove(s.flash); s.sp.add(s.flash); s.sp.visible = false; S.scene.add(s.sp);
      s.lit = new T.Mesh(new T.BoxGeometry(0.12, 0.7, 0.012), new T.MeshBasicMaterial({ color: 0xd8453a })); s.lit.visible = false; S.scene.add(s.lit);
    },
    update(S, s, c, dt) {
      const g = GAS[c.gas], eff = EFF[c.gas][c.method], K = s.K;
      /* reaction */
      const live = (g.heat ? c.burner : 1) && s.prod < YIELD; const rate = live ? 30 * (c.rate / 100) : 0;
      if (dt > 0) { s.prod = Math.min(YIELD, s.prod + rate * dt); s.col = Math.min(JAR, s.col + rate * dt * eff); }
      const f = s.col / JAR, used = s.prod / YIELD;
      if (g.liq) { s.liq.setVisible(true); s.liq.setColor(c.gas === "cl2" && used > 0.05 ? [226, 232, 160] : g.liq, 0.55); s.liq.setVolume(120 - 14 * used); } else s.liq.setVisible(false);
      s.liq.update(S.t); s.pile.material.color.setHex(g.solid); s.pile.scale.y = Math.max(0.15, 1 - 0.7 * used); s.bub.rate = live && g.liq ? rate * 1.4 : 0; s.bub.update(dt, S.t);
      s.bunsen.visible = !!g.heat; s.bunsen.setGas(g.heat && c.burner && s.prod < YIELD ? 0.8 : 0); s.bunsen.flame.update(S.t);
      /* tube */
      const pts = PATH[c.method].map((p) => V3(p[0], p[1], 0)); let L = 0; const seg = []; for (let i = 0; i < pts.length - 1; i++) { const d = pts[i].distanceTo(pts[i + 1]); seg.push(d); L += d; }
      s.seg.forEach((m, i) => { if (i < pts.length - 1) { m.visible = true; S.setRod(m, pts[i], pts[i + 1]); } else m.visible = false; });
      const at = (u) => { let r = u; for (let i = 0; i < seg.length; i++) { if (r <= seg[i]) return pts[i].clone().lerp(pts[i + 1], r / seg[i]); r -= seg[i]; } return pts[pts.length - 1].clone(); };
      s.fd.forEach((d, i) => { if (dt > 0 && rate > 0) d.u = (d.u + dt * (1.4 + rate * 0.08)) % L; const on = rate > 0 && i < 8 + (c.rate / 100) * 32; if (!on) { s.m4.makeScale(0, 0, 0); } else { const p = at(d.u); s.m4.makeTranslation(p.x, p.y, p.z); } s.flow.setMatrixAt(i, s.m4); s.cl.setHex(g.col); s.flow.setColorAt(i, s.cl); }); s.flow.instanceMatrix.needsUpdate = true; s.flow.instanceColor && (s.flow.instanceColor.needsUpdate = true);
      /* jar, gas, water */
      const xj = 0.6, inv = c.method !== "down", yOpen = c.method === "water" ? 0.4 : c.method === "up" ? 0.45 : 0, JH = 2.45, h = JH * f;
      s.trough.visible = c.method === "water"; s.wcol.visible = c.method === "water"; s.clamp.visible = inv;
      s.jar.group.rotation.x = inv ? Math.PI : 0; s.jar.group.position.set(xj, inv ? yOpen + 2.5 : 0, 0);
      s.gasM.material.color.setHex(g.col); s.gasM.material.opacity = g.op; s.gasM.visible = f > 0.01; s.gasM.scale.y = Math.max(0.001, h);
      s.gasM.position.set(xj, inv ? yOpen + 2.5 - 0.05 - h / 2 : 0.05 + h / 2, 0);
      const wh = JH * (1 - f); s.wcol.scale.y = Math.max(0.001, wh); s.wcol.position.set(xj, yOpen + 0.03 + wh / 2, 0);
      /* tests */
      let tipGlow = 0, tipFlame = 0, flash = 0, spY = 5, lit = 0, showSp = false, showLit = false, bleach = 0;
      if (s.tst) {
        const t = s.tst.t += dt, ok = f >= 0.25, R = (ok ? RES[c.gas] : AIRRES)[c.test], gasAt = ok ? c.gas : null;
        s.sample = Math.min(1, s.sample + dt * 2); const kind = c.test;
        if (kind === "glow" || kind === "lit") {
          showSp = true; spY = t < 0.8 ? lerp(4.2, 4.2, 0) : t < 1.8 ? lerp(4.2, 2.1, (t - 0.8)) : t < 4.2 ? 2.1 : lerp(2.1, 4.4, Math.min(1, (t - 4.2) / 0.8));
          const dipped = t > 1.6; const w = R[0];
          if (kind === "glow") { tipGlow = 1; if (dipped && w === "relights") tipFlame = 1.3; else if (dipped && w === "goes out") tipGlow = Math.max(0, 1 - (t - 1.6) * 1.5); }
          else { tipFlame = 1; tipGlow = 0.4; if (dipped) { if (w === "burns brighter") tipFlame = 1.7; else if (w === "squeaky pop") { tipFlame = t < 2.0 ? 1 : 0; flash = Math.max(0, 1 - Math.abs(t - 2.0) / 0.18) * (t > 1.9 ? 1 : 0); tipGlow = t < 2 ? 0.4 : 0; } else tipFlame = Math.max(0, 1 - (t - 1.6) * 1.6); } }
          if (t > 5.1) { s.last = { test: kind, gas: gasAt, res: R, ok }; s.tst = null; }
        } else if (kind === "red" || kind === "blue") {
          showLit = true; const p = clamp((t - 1.0) / 1.6, 0, 1), w = R[0]; const base = kind === "red" ? [0.85, 0.27, 0.23] : [0.29, 0.38, 0.78]; let to = base;
          if (w.indexOf("BLUE") >= 0) to = [0.2, 0.3, 0.85]; else if (w.indexOf("RED") >= 0) to = [0.9, 0.2, 0.18]; else if (w.indexOf("pink") >= 0) to = [0.78, 0.4, 0.55]; else if (w.indexOf("bleached") >= 0) to = [0.96, 0.96, 0.94];
          if (c.gas === "cl2" && kind === "blue") { const q = p < 0.5 ? p * 2 : 1; const mid = [0.9, 0.2, 0.18]; const col = p < 0.5 ? base.map((b, i) => lerp(b, mid[i], q)) : mid.map((m, i) => lerp(m, 0.96, (p - 0.5) * 2)); s.lit.material.color.setRGB(col[0], col[1], col[2]); }
          else s.lit.material.color.setRGB(lerp(base[0], to[0], p), lerp(base[1], to[1], p), lerp(base[2], to[2], p));
          s.lit.position.set(3.15, t < 1 ? lerp(3.4, 2.65, t) : 2.65, 0.05); if (t > 4.5) { s.last = { test: kind, gas: gasAt, res: R, ok }; s.tst = null; }
        } else {
          s.lw = Math.min(1, s.lw + dt * 0.45); s.lb.rate = t < 3 ? 12 : 0; const milky = ok && c.gas === "co2" ? clamp((t - 0.5) / 2.5, 0, 1) : 0; s.lppt.amount = milky; s.llq.setColor(milky > 0.1 ? [236, 238, 238] : [228, 242, 250], 0.28 + 0.45 * milky);
          if (t > 4.2) { s.last = { test: kind, gas: gasAt, res: R, ok }; s.tst = null; }
        }
      }
      s.sp.visible = showSp; if (showSp) { s.sp.position.set(3.15, spY, 0); s.tip.material.color.setRGB(1, 0.25 + 0.2 * tipGlow, 0.05); s.tip.visible = tipGlow > 0.05 || tipFlame > 0.05; s.fm.visible = tipFlame > 0.05; s.fm.scale.set(1 + 0.15 * Math.sin(S.t * 30), tipFlame, 1 + 0.15 * Math.cos(S.t * 27)); s.fm.position.y = 0.04 + 0.15 * tipFlame; s.glow.material.opacity = 0.45 * Math.max(tipGlow * 0.6, tipFlame * 0.7); s.flash.material.opacity = flash; s.flash.scale.setScalar(1.6 + 1.2 * flash); }
      s.lit.visible = showLit; s.lb.update(dt, S.t); s.lppt.update(dt);
      s.gs.visible = !!s.tst && s.sample > 0.01 && f >= 0.25; s.gs.material.color.setHex(g.col); s.gs.material.opacity = g.op * Math.min(1, s.sample);
      if (!s.tst) { s.lppt.amount = s.last && s.last.test === "lime" && s.last.res[0] === "turns milky" ? 1 : s.lppt.amount; }
    },
    overlay(ctx, s, c, w, h, S) {
      const g = GAS[c.gas], eff = EFF[c.gas][c.method], f = s.col / JAR; ctx.save();
      H.pill(ctx, 10, 22, "Preparing " + g.name + " (" + g.f + ")", "#ffe9b8", 11); H.pill(ctx, 10, 44, METHOD[c.method].split(" (")[0], eff >= 0.9 ? "#8dffb8" : eff > 0 ? "#ffd27a" : "#ff9a8a", 10);
      const warn = eff >= 0.9 ? null : eff === 0 ? (c.method === "water" ? g.f + " dissolves in the water: nothing collects" : g.f + " escapes: " + (g.Mr > AIR ? "it is denser than air and sinks out of an upturned jar" : "it is lighter than air and rises out of an open jar")) : "Poor method: only about " + Math.round(eff * 100) + " % is collected";
      if (warn) H.pill(ctx, 10, 66, warn, "#ff9a8a", 9);
      const px = w - 250; H.panel(ctx, px, 58, 240, 138); ctx.textAlign = "left"; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Preparation", px + 8, 73); ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; let y = wrapT(ctx, g.eq, px + 8, 88, 224, 11); ctx.fillStyle = "#9fb2d2"; y = wrapT(ctx, "Reagents: " + g.re, px + 8, y + 15, 224, 11); y = wrapT(ctx, "Drying agent: " + g.dry, px + 8, y + 13, 224, 11); wrapT(ctx, "Solubility: " + g.sol, px + 8, y + 13, 224, 11);
      H.panel(ctx, px, 202, 240, 64); ctx.fillStyle = "#e8f0ff"; ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillText("Mr = " + g.Mr + " → " + (g.Mr / AIR).toFixed(2) + " × density of air", px + 8, 218); ctx.fillStyle = eff >= 0.9 ? "#7dffbd" : "#ffd27a"; wrapT(ctx, "Best method: " + METHOD[best(c.gas)].split(" (")[0] + " (" + WHY[best(c.gas)] + ")", px + 8, 232, 224, 11);
      const pq = S.proj(V3(0.6, 3.1, 0)); H.pill(ctx, pq.x, pq.y, "gas jar " + Math.round(f * 100) + " % full", "#bcd0ea", 8.5, "center"); const fq = S.proj(V3(-3.6, -0.3, 0)); H.pill(ctx, fq.x, fq.y, "reaction flask", "#bcd0ea", 8.5, "center"); const tq = S.proj(V3(3.15, 3.1, 0)); H.pill(ctx, tq.x, tq.y, "test tube", "#bcd0ea", 8.5, "center"); const lq = S.proj(V3(2.4, 3.1, 0)); if (c.test === "lime") H.pill(ctx, lq.x, lq.y - 14, "limewater", "#bcd0ea", 8.5, "center");
      const ry = h - 76; H.panel(ctx, 10, ry, Math.min(w - 270, 330), 62); ctx.textAlign = "left"; ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#9fb2d2"; if (s.last) { ctx.fillStyle = "#e8f0ff"; ctx.fillText(TESTS[s.last.test] + (s.last.ok ? "" : " (not enough gas: tested air)"), 18, ry + 15); ctx.fillStyle = "#ffd27a"; ctx.fillText("Observation: " + s.last.res[0], 18, ry + 31); ctx.fillStyle = "#7dffbd"; wrapT(ctx, "Conclusion: " + s.last.res[1], 18, ry + 46, Math.min(w - 290, 310), 10); } else if (s.tst) { ctx.fillStyle = "#e8f0ff"; ctx.fillText("Testing with " + TESTS[c.test].toLowerCase() + "…", 18, ry + 15); } else { ctx.fillText("Collect a jar of gas (≥ 25 % full) then press", 18, ry + 15); ctx.fillText("“Run the test” to identify it.", 18, ry + 29); }
      ctx.restore();
    },
    readouts(s, c) {
      const g = GAS[c.gas], eff = EFF[c.gas][c.method]; const out = [["Gas", g.name + " (" + g.f + "), Mr = " + g.Mr], ["Equation", g.eq], ["Heat needed", g.heat ? "yes, light the burner" : "no, at room temperature"], ["Density vs air", (g.Mr / AIR).toFixed(2) + " × (" + (g.Mr > AIR ? "denser" : "lighter") + " than air)"], ["Solubility", g.sol], ["Gas produced", s.prod.toFixed(0) + " cm³ at r.t.p. (24 000 cm³ per mole)"], ["Gas in the jar", s.col.toFixed(0) + " cm³ of " + JAR + " cm³  (" + Math.round(eff * 100) + " % of the gas collected)"]]; if (s.last) out.push(["Last test", TESTS[s.last.test] + ": " + s.last.res[0] + " → " + s.last.res[1]]); return out;
    },
    steps(s, c) { const g = GAS[c.gas], f = s.col / JAR; return [["Pick the gas and look at its solubility and density", "done"], ["Choose a collection method that suits those properties", EFF[c.gas][c.method] >= 0.9 ? "done" : "now"], [g.heat ? "Light the burner and start the reaction" : "Watch the reaction and the gas jar fill", f > 0.25 ? "done" : "now"], ["Test the gas and read the conclusion", s.last ? "done" : ""]]; },
  };
})();
