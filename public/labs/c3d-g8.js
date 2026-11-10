/* c3d-g8.js — chemistry 3D gap scenes: rate-determining step (SN1 vs SN2); Lassaigne sodium-fusion test & C/H test; bond fission, nucleophiles/electrophiles, inductive effect */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready || !C3.gx) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, G = C3.gx, CM = C3.CM, TAU = Math.PI * 2;
  const { clamp, lerp } = G, rnd = U.rnd, R = 8.314;

  /* =============================== rate-determining step =============================== */
  const MECH = ["Two-step (SN1): (CH₃)₃CBr hydrolysis", "One-step (SN2): CH₃Br + OH⁻"];
  C3.scenes.rateDeterminingStep = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.75, fov: 36, free: true, cam: [[1.2, 2.4, 8.0], [1.0, 1.6, 0]],
    values: { mech: 0, A0: 0.1, B0: 0.1, Ea1: 85, Ea2: 30, Tc: 25 },
    state: () => ({ recs: [] }),
    get controls() {
      return [
        { type: "select", key: "mech", label: "Mechanism", options: MECH.map((m, i) => ({ value: i, label: m })) },
        { type: "range", key: "A0", label: "[halogenoalkane]₀ (mol/dm³)", min: 0.02, max: 0.2, step: 0.01 },
        { type: "range", key: "B0", label: "[OH⁻]₀ (mol/dm³)", min: 0.02, max: 0.2, step: 0.01 },
        { type: "range", key: "Ea1", label: "Eₐ of step 1 (kJ/mol)", min: 40, max: 110, step: 1 },
        { type: "range", key: "Ea2", label: "Eₐ of step 2 (kJ/mol, SN1 only)", min: 20, max: 110, step: 1 },
        { type: "range", key: "Tc", label: "Temperature (°C)", min: 10, max: 70, step: 1 },
        { type: "button", label: "Measure the initial rate", action: (S, s, c) => { s.recs.push({ A: c.A0, B: c.B0, r: initRate(c) }); if (s.recs.length > 6) s.recs.shift(); } },
        { type: "button", label: "Restart the reaction", cls: "secondary", action: (S, s, c) => { restartRD(s, c); } },
      ];
    },
    views: [{ label: "Energy profile", cam: [[1.2, 2.4, 8.0], [1.0, 1.6, 0]] }, { label: "Side", cam: [[-3.4, 2.6, 5.2], [0, 1.4, 0]] }],
    note: "Many reactions happen in a series of elementary steps. The slowest step (highest activation energy) controls the overall rate, like the narrowest part of a funnel: it is the rate-determining step. Only species that take part in (or before) the rate-determining step appear in the rate equation. For the SN1 hydrolysis of 2-bromo-2-methylpropane the slow step is the ionisation (CH₃)₃CBr → (CH₃)₃C⁺ + Br⁻, so rate = k[(CH₃)₃CBr] and changing [OH⁻] has no effect. For bromomethane the reaction is a single step (SN2), so rate = k[CH₃Br][OH⁻].",
    onChange(S, s, c, key) { restartRD(s, c); if (key === "mech" || key === "Ea1" || key === "Ea2") buildProfile(S, s, c); },
    reset(S, s, c) { Object.assign(c, { mech: 0, A0: 0.1, B0: 0.1, Ea1: 85, Ea2: 30, Tc: 25 }); s.recs = []; restartRD(s, c); buildProfile(S, s, c); },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; S.mk.box(10, 0.06, 3.6, M.matte(0xb69a76, 0.62), 0.6, 0, 0).receiveShadow = true;
      s.tok = { A: new T.InstancedMesh(new T.SphereGeometry(0.075, 16, 12), new T.MeshPhysicalMaterial({ color: 0x4a8bff, roughness: 0.25, clearcoat: 1 }), 40), I: new T.InstancedMesh(new T.SphereGeometry(0.075, 16, 12), new T.MeshPhysicalMaterial({ color: 0xffc33a, roughness: 0.25, clearcoat: 1, emissive: 0x402800 }), 40), P: new T.InstancedMesh(new T.SphereGeometry(0.075, 16, 12), new T.MeshPhysicalMaterial({ color: 0x3fd07a, roughness: 0.25, clearcoat: 1 }), 40) };
      Object.values(s.tok).forEach((im) => { im.castShadow = true; im.frustumCulled = false; S.scene.add(im); });
      s.hop = []; for (let i = 0; i < 10; i++) { const m = new T.Mesh(new T.SphereGeometry(0.075, 16, 12), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.25, clearcoat: 1 })); m.visible = false; S.scene.add(m); s.hop.push({ m, on: false }); }
      buildProfile(S, s, c); restartRD(s, c);
    },
    update(S, s, c, dt) {
      const two = (c.mech | 0) === 0, TK = c.Tc + 273.15, k1 = 1e11 * Math.exp(-c.Ea1 * 1000 / (R * TK)), k2 = 1e11 * Math.exp(-c.Ea2 * 1000 / (R * TK)) * 1e2; s.k1 = k1; s.k2 = k2;
      const slow = two ? Math.min(k1, k2 * Math.max(0.005, s.B)) : k1 * c.B0 * 10; const ts = 0.12 / Math.max(1e-12, slow); s.ts = ts; let sd = dt * ts;
      for (let n = 0; n < 40 && sd > 0; n++) { const h = sd / (40 - n); sd -= h;
        if (two) { const d1 = Math.min(s.A, k1 * s.A * h), d2 = Math.min(s.I + d1, k2 * (s.I + d1) * s.B * h, s.B); s.A -= d1; s.I += d1 - d2; s.B -= d2; s.P += d2; if (d1 > 0) s.fl1 += d1; if (d2 > 0) s.fl2 += d2; }
        else { const d = Math.min(s.A, s.B, k1 * 10 * s.A * s.B * h); s.A -= d; s.B -= d; s.P += d; s.fl1 += d; } }
      s.time += dt * ts; if (dt > 0 && S.t - s.lastH > 0.2) { s.lastH = S.t; s.hist.push([s.time, s.A * 1000, s.I * 1000, s.P * 1000]); if (s.hist.length > 300) s.hist.shift(); }
      const sc = 40 / c.A0, cnt = { A: Math.round(s.A * sc), I: Math.round(s.I * sc), P: Math.round(s.P * sc) }, m4 = new T.Matrix4(), wells = s.wells;
      ["A", "I", "P"].forEach((k) => { const im = s.tok[k], w = wells[k]; im.count = clamp(cnt[k], 0, 40); im.visible = !(k === "I" && !two); for (let i = 0; i < im.count; i++) { const row = Math.floor(i / 8), col = i % 8; m4.makeTranslation(w.x + (col - 3.5) * 0.08 + (row % 2) * 0.04, w.y + 0.08 + row * 0.13, (col % 2 ? 0.12 : -0.12) + (row % 3 - 1) * 0.04); im.setMatrixAt(i, m4); } im.instanceMatrix.needsUpdate = true; });
      /* hopping tokens over the barriers */
      ["fl1", "fl2"].forEach((f, j) => { while (s[f] * sc >= 1) { s[f] -= 1 / sc; const h2 = s.hop.find((q) => !q.on); if (!h2) break; Object.assign(h2, { on: true, u: 0, j }); h2.m.visible = true; h2.m.material.color.setHex(j === 0 ? 0x4a8bff : 0xffc33a); } });
      s.hop.forEach((h2) => { if (!h2.on) return; h2.u += dt * 1.6; const seg = s.segs[h2.j]; if (!seg || h2.u >= 1) { h2.on = false; h2.m.visible = false; return; } const x = lerp(seg[0], seg[1], h2.u); h2.m.position.set(x, s.E(x) + 0.08, 0); });
    },
    overlay(ctx, s, c, w, h, S) {
      const two = (c.mech | 0) === 0, px = w - 250; ctx.save(); G.titles(ctx, two ? "SN1: two steps — the slow step sets the rate" : "SN2: one step", two ? "step 1 (slow): (CH₃)₃CBr → (CH₃)₃C⁺ + Br⁻     step 2 (fast): (CH₃)₃C⁺ + OH⁻ → (CH₃)₃COH" : "CH₃Br + OH⁻ → [HO···CH₃···Br]⁻ → CH₃OH + Br⁻");
      const W = s.wells; G.tag(ctx, S, V3(W.A.x, W.A.y - 0.25, 0.3), two ? "(CH₃)₃CBr" : "CH₃Br + OH⁻", "#9fc4ff", 8.5); if (two) G.tag(ctx, S, V3(W.I.x, W.I.y - 0.25, 0.3), "carbocation (intermediate)", "#ffd27a", 8.5); G.tag(ctx, S, V3(W.P.x, W.P.y - 0.25, 0.3), two ? "(CH₃)₃COH + Br⁻" : "CH₃OH + Br⁻", "#8dffb8", 8.5);
      G.tag(ctx, S, V3(s.peaks[0], s.E(s.peaks[0]) + 0.35, 0), "Eₐ₁ = " + c.Ea1 + " kJ/mol", "#ffb38a", 8.5); if (two) G.tag(ctx, S, V3(s.peaks[1], s.E(s.peaks[1]) + 0.35, 0), "Eₐ₂ = " + c.Ea2 + " kJ/mol", "#ffb38a", 8.5);
      const xm = Math.max(1e-9, s.hist.length ? s.hist[s.hist.length - 1][0] : 1); const f = (i) => s.hist.map((p) => [p[0], p[i]]);
      H.graph(ctx, px, 58, 240, 120, { series: [{ pts: f(1), color: "#7fb0ff" }, { pts: f(2), color: "#ffd27a" }, { pts: f(3), color: "#6fe0a0" }], xmin: 0, xmax: xm, ymin: 0, ymax: c.A0 * 1000, xl: "time / s", yl: "mmol/dm³  (RX, cation, product)" });
      const rds = two ? (s.k1 < s.k2 * c.B0 ? "step 1 (ionisation)" : "step 2 (attack by OH⁻)") : "the only step";
      const rows = ["rate-determining step: " + rds, ["rate = " + (two ? (s.k1 < s.k2 * c.B0 ? "k[(CH₃)₃CBr]   — zero order in OH⁻" : "k[(CH₃)₃C⁺][OH⁻]") : "k[CH₃Br][OH⁻]   — first order in each"), "#ffe9b8"]];
      s.recs.forEach((r) => rows.push("[RX] " + r.A.toFixed(2) + "  [OH⁻] " + r.B.toFixed(2) + "  → rate " + r.r.toExponential(2)));
      if (s.recs.length < 2) rows.push(["measure the initial rate, change [OH⁻], measure again", "#9fb2d2"]); G.panel(ctx, px, 184, 240, "Rate law", rows);
      ctx.restore();
    },
    readouts(s, c) { return [["k₁", (s.k1 || 0).toExponential(2) + " s⁻¹"], ["k₂", (s.k2 || 0).toExponential(2) + " dm³ mol⁻¹ s⁻¹"], ["[RX] now", s.A.toFixed(3) + " M"], ["Product", s.P.toFixed(3) + " M"]]; },
  };
  function initRate(c) { const TK = c.Tc + 273.15, k1 = 1e11 * Math.exp(-c.Ea1 * 1000 / (R * TK)), k2 = 1e11 * Math.exp(-c.Ea2 * 1000 / (R * TK)) * 1e2; return (c.mech | 0) === 0 ? (k1 < k2 * c.B0 ? k1 * c.A0 : k2 * c.B0 * c.A0 * (k1 / (k1 + k2 * c.B0))) : k1 * 10 * c.A0 * c.B0; }
  function restartRD(s, c) { s.A = c.A0; s.I = 0; s.B = c.B0; s.P = 0; s.fl1 = 0; s.fl2 = 0; s.time = 0; s.hist = [[0, c.A0 * 1000, 0, 0]]; s.lastH = 0; (s.hop || []).forEach((h) => { h.on = false; h.m.visible = false; }); }
  function buildProfile(S, s, c) {
    G.disposeGroup(s.prof); const two = (c.mech | 0) === 0, ks = 0.022; const xs = two ? [-2.4, -1.1, 0.2, 1.4, 2.6] : [-2.4, 0, 2.4];
    const lv = two ? [0, c.Ea1 * ks, 0.6, 0.6 + c.Ea2 * ks * 0.8, -0.55] : [0, c.Ea1 * ks, -0.6]; const base = 0.9;
    const E = (x) => { for (let i = 0; i < xs.length - 1; i++) if (x <= xs[i + 1]) { const t = (x - xs[i]) / (xs[i + 1] - xs[i]), tt = (1 - Math.cos(t * Math.PI)) / 2; return base + lerp(lv[i], lv[i + 1], tt); } return base + lv[lv.length - 1]; };
    const shp = new T.Shape(); shp.moveTo(-3.0, 0.05); shp.lineTo(-3.0, E(-2.4)); for (let x = -3.0; x <= 3.0; x += 0.04) shp.lineTo(x, x < -2.4 ? E(-2.4) : x > xs[xs.length - 1] ? E(xs[xs.length - 1]) : E(x)); shp.lineTo(3.0, 0.05); shp.lineTo(-3.0, 0.05);
    const geo = new T.ExtrudeGeometry(shp, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3, curveSegments: 8 }); geo.translate(0, 0, -0.25);
    s.prof = new T.Mesh(geo, new T.MeshPhysicalMaterial({ color: 0x2b4f7a, roughness: 0.18, clearcoat: 1, transparent: true, opacity: 0.85, metalness: 0.1 })); s.prof.castShadow = s.prof.receiveShadow = true; S.scene.add(s.prof);
    s.E = (x) => E(clamp(x, -2.4, xs[xs.length - 1])); s.wells = two ? { A: { x: -2.4, y: E(-2.4) }, I: { x: 0.2, y: E(0.2) }, P: { x: 2.6, y: E(2.6) } } : { A: { x: -2.4, y: E(-2.4) }, I: { x: 0, y: 0 }, P: { x: 2.4, y: E(2.4) } };
    s.peaks = two ? [-1.1, 1.4] : [0]; s.segs = two ? [[-2.4, 0.2], [0.2, 2.6]] : [[-2.4, 2.4], null];
  }

  /* =============================== Lassaigne & C/H tests =============================== */
  const CPD = [
    { n: "urea, CO(NH₂)₂", N: 1, S: 0, X: null }, { n: "thiourea, CS(NH₂)₂", N: 1, S: 1, X: null }, { n: "chlorobenzene, C₆H₅Cl", N: 0, S: 0, X: "Cl" },
    { n: "bromobenzene, C₆H₅Br", N: 0, S: 0, X: "Br" }, { n: "iodoform, CHI₃", N: 0, S: 0, X: "I" }, { n: "4-aminobenzenesulphonic acid", N: 1, S: 1, X: null }, { n: "glucose, C₆H₁₂O₆", N: 0, S: 0, X: null },
  ];
  const XCOL = { Cl: [[250, 250, 248], "white AgCl, soluble in dilute NH₃"], Br: [[240, 232, 190], "cream AgBr, soluble in conc. NH₃"], I: [[240, 220, 90], "yellow AgI, insoluble in NH₃"] };
  C3.scenes.lassaigne = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.75, fov: 36, free: true, cam: [[1.0, 3.0, 8.6], [0.2, 1.3, 0]],
    values: { cpd: 1 },
    state: () => ({}),
    get controls() {
      return [
        { type: "select", key: "cpd", label: "Organic compound", options: CPD.map((m, i) => ({ value: i, label: m.n })) },
        { type: "button", label: "1. Fuse with sodium in an ignition tube (heat red-hot)", action: (S, s) => { s.stage = Math.max(s.stage, 1); s.st = S.t; } },
        { type: "button", label: "2. Plunge into water, boil and filter (fusion extract)", action: (S, s) => { if (s.stage >= 1) { s.stage = Math.max(s.stage, 2); s.st = S.t; } } },
        { type: "button", label: "3. Test the extract for N, S and halogens", action: (S, s) => { if (s.stage >= 2) { s.stage = 3; s.st = S.t; } } },
        { type: "button", label: "Test for C and H: heat with copper(II) oxide", action: (S, s) => { s.ch = 1; s.cht = S.t; } },
        { type: "button", label: "Start again", cls: "secondary", action: (S, s) => { s.stage = 0; s.ch = 0; } },
      ];
    },
    views: [{ label: "Bench", cam: [[1.0, 3.0, 8.6], [0.2, 1.3, 0]] }, { label: "Test tubes", cam: [[1.6, 1.7, 3.8], [1.4, 1.0, 0]] }],
    note: "Lassaigne's test: the organic compound is fused with sodium, converting covalently bonded N, S and halogens into ionic NaCN, Na₂S and NaX, which dissolve in water (the fusion extract). Nitrogen: boil with iron(II) tetraoxosulphate(VI), then acidify: Prussian blue. Sulphur: sodium pentacyanonitrosylferrate(III) gives a purple colour (or lead(II) ethanoate gives black PbS). Halogens: acidify with dilute trioxonitric(V) acid and boil (to remove CN⁻ and S²⁻), then add silver trioxonitrate(V): white AgCl, cream AgBr, yellow AgI. Carbon and hydrogen: heat the compound with dry copper(II) oxide; CO₂ turns lime water milky and water turns white anhydrous copper(II) tetraoxosulphate(VI) blue.",
    onChange(S, s) { s.stage = 0; s.ch = 0; },
    reset(S, s, c) { c.cpd = 1; s.stage = 0; s.ch = 0; },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(10, 0.06, 3.8, M.matte(0xb69a76, 0.62), 0.6, 0, 0).receiveShadow = true;
      s.bn = K.bunsen({ x: -1.6, z: 0.2 }); s.it = new T.Group(); const itv = K.vessel({ outer: [[0, 0], [0.3, 0.05], [0.45, 0.3], [0.5, 0.6], [0.5, 6]], inner: [[0, 0.1], [0.25, 0.12], [0.38, 0.35], [0.42, 0.65], [0.42, 6]] }, { noAdd: true }); s.it.add(itv.group); s.itHot = new T.Mesh(new T.SphereGeometry(0.42 * CM, 16, 12), G.hotMat()); s.itHot.position.y = 0.6 * CM; s.it.add(s.itHot); sc.add(s.it);
      s.tng = G.tongs(S, [-1.6, 2.3, 0.2], [1, 0.2, 0.6], 22);
      const dish = K.vessel(G.DEFS.dish); G.opaque(dish, M.ceramic(0xf3f0e8)); dish.group.position.set(-0.4, 0.03, 0.4); s.dishL = dish.addLiquid({ color: [215, 232, 244], opacity: 0.3 }); s.dishL.setVolume(80); s.dish = dish;
      s.shards = G.crystals(14, "box", [230, 240, 245], 0.3, { op: 0.4 }); dish.group.add(s.shards); s.shards.layout((i) => ({ x: rnd(-2, 2) * CM, y: 0.5 * CM, z: rnd(-2, 2) * CM, rx: rnd(0, 3), ry: rnd(0, 3), sz: 0.2 })); s.shards.visible = false;
      S.mk.rbox(2.8, 0.62, 0.5, 0.03, M.wood(), 1.5, 0.31, 0.3);
      s.tubes = [0, 1, 2].map((i) => { const v = K.vessel("testtube"); v.group.position.set(0.6 + i * 0.85, 0.62, 0.3); const L = v.addLiquid({ color: [236, 240, 244], opacity: 0.25 }); L.setVolume(8); const P = K.precipitate(v, L, { color: 0xffffff, n: 700, size: 0.03 }); return { v, L, P }; });
      /* C/H apparatus */
      s.gCH = new T.Group(); sc.add(s.gCH); const bt = K.vessel(G.DEFS.boilingtube, { noAdd: true }); bt.group.rotation.z = -(Math.PI / 2 - 0.2); bt.group.position.set(-3.2, 2.35, -1.0); s.gCH.add(bt.group); const cuo = G.heap(0.9, 0.7, [26, 26, 28]); cuo.position.y = 0.4 * CM; bt.group.add(cuo); s.cuoH = cuo;
      s.cuso = G.heap(0.8, 0.5, [250, 250, 248]); s.cuso.scale.set(1, 0.6, 1); s.cuso.position.set(-1.05, 2.79, -1.0); s.gCH.add(s.cuso); s.bn2 = K.bunsen({ x: -2.95, z: -1.0 }); sc.remove(s.bn2); s.gCH.add(s.bn2);
      const dpp = [V3(-0.72, 2.86, -1.0), V3(-0.3, 2.9, -1.0), V3(0.0, 2.5, -1.0), V3(0.0, 0.75, -1.0)]; const dtm = G.glassTube(S, K, dpp, 0.3, 0.14); sc.remove(dtm); s.gCH.add(dtm);
      const lw = K.vessel("testtube", { noAdd: true }); lw.group.position.set(0.0, 0.45, -1.0); s.gCH.add(lw.group); s.lwL = lw.addLiquid({ color: [235, 240, 244], opacity: 0.22 }); s.lwL.setVolume(10);
      s.stage = 0; s.ch = 0;
    },
    update(S, s, c, dt) {
      const P = CPD[c.cpd | 0], t = S.t, el = t - (s.st || 0), st = s.stage;
      s.bn.setGas(st === 1 ? 1 : 0); s.bn.flame.update(t); const hot = st === 1 ? G.smooth(0, 3, el) : st >= 2 ? 0 : 0; s.itHot.material.emissiveIntensity = hot * 2.2; s.itHot.material.emissive.copy(G.glowCol(500 + hot * 500));
      const plunge = st === 2 ? G.smooth(0, 0.8, el) : st > 2 ? 1 : 0; s.it.visible = plunge < 1; s.tng.visible = plunge < 1; s.it.position.set(lerp(-1.6, -0.4, plunge), lerp(2.3, 0.4, plunge), lerp(0.2, 0.4, plunge)); s.it.rotation.z = lerp(0.4, 0, plunge);
      if (st === 2 && plunge >= 1 && !s.burst) { s.burst = 1; S.puff(-0.4, 0.4, 0.4, { n: 14, color: 0xf2f6fa, speed: 0.5, up: 1, life: 1.6, size: 0.4, op: 0.5 }); } if (st < 2) s.burst = 0; s.shards.visible = st >= 2; s.dishL.update(t);
      const k = st === 3 ? G.smooth(0.5, 4, el) : 0;
      s.tubes[0].L.setColor(G.mix([226, 236, 214], P.N ? [30, 60, 160] : [210, 220, 190], k), 0.25 + 0.5 * k * (P.N ? 1 : 0.3)); s.tubes[0].P.amount = P.N ? k * 0.5 : 0; s.tubes[0].P.setColor(0x1a3aa0);
      s.tubes[1].L.setColor(G.mix([236, 236, 236], P.S ? [140, 40, 150] : [230, 220, 200], k), 0.25 + 0.45 * k * (P.S ? 1 : 0.2));
      const xc = P.X ? XCOL[P.X][0] : null; s.tubes[2].P.amount = xc ? k * 0.7 : 0; if (xc) s.tubes[2].P.setColor(new T.Color().setRGB(xc[0] / 255, xc[1] / 255, xc[2] / 255).getHex()); s.tubes[2].L.setColor(xc ? G.mix([236, 240, 244], xc, k * 0.6) : [236, 240, 244], 0.25 + (xc ? 0.4 * k : 0));
      s.tubes.forEach((q) => { q.P.update(dt); q.L.update(t); });
      const ce = s.ch ? t - s.cht : 0; s.bn2.setGas(s.ch ? 1 : 0); s.bn2.flame.update(t); const kk = G.smooth(1, 5, ce); s.lwL.setColor(G.mix([235, 240, 244], [246, 246, 244], kk), 0.22 + 0.6 * kk); s.lwL.update(t); const hasH = true; s.cuso.material.color.copy(G.col(G.mix([250, 250, 248], [60, 120, 225], hasH ? kk : 0))); s.cuoH.material.color.copy(G.col(G.mix([26, 26, 28], [170, 90, 50], kk * 0.7)));
    },
    overlay(ctx, s, c, w, h, S) {
      const P = CPD[c.cpd | 0], px = w - 250, st = s.stage; ctx.save(); G.titles(ctx, "Lassaigne's sodium fusion test: " + P.n, ["load a small piece of sodium and a little compound", "heat the ignition tube until red-hot", "plunge into water: the tube shatters; boil and filter", "add the reagents to portions of the fusion extract"][st]);
      ["N: FeSO₄, boil, H₂SO₄", "S: nitroprusside", "X: HNO₃, AgNO₃"].forEach((l, i) => G.tag(ctx, S, V3(0.6 + i * 0.85, 0.42, 0.62), l, "#cfe0f5", 7.5)); G.tag(ctx, S, V3(-2.9, 2.95, -1.0), "compound + CuO", "#cfe0f5", 8); G.tag(ctx, S, V3(-1.05, 3.2, -1.0), "anhydrous CuSO₄", "#cfe0f5", 8);
      const done = st === 3 && S.t - s.st > 4; const rows = [["nitrogen: " + (done ? (P.N ? "Prussian blue → N present (NaCN formed)" : "no blue colour → no N") : "—"), P.N && done ? "#7fb0ff" : "#e8f0ff"], ["sulphur: " + (done ? (P.S ? "purple colour → S present (Na₂S formed)" : "no purple → no S") : "—"), P.S && done ? "#d08cff" : "#e8f0ff"], ["halogen: " + (done ? (P.X ? XCOL[P.X][1] + " → " + P.X + " present" : "no precipitate → no halogen") : "—"), P.X && done ? "#ffe9b8" : "#e8f0ff"]];
      if (s.ch) rows.push(["C/H test: lime water milky (CO₂ → C present); white CuSO₄ turns blue (H₂O → H present)", "#8dffb8"]);
      G.panel(ctx, px, 58, 240, "Results", rows); G.foot(ctx, "Na + C + N → NaCN     2Na + S → Na₂S     Na + X → NaX", "#ffe9b8");
      ctx.restore();
    },
    readouts(s, c) { const P = CPD[c.cpd | 0]; return [["Compound", P.n], ["Contains N", P.N ? "yes" : "no"], ["Contains S", P.S ? "yes" : "no"], ["Halogen", P.X || "none"]]; },
    steps(s) { return [["Fuse with sodium", s.stage >= 1 ? "done" : "now"], ["Make the fusion extract", s.stage >= 2 ? "done" : s.stage === 1 ? "now" : ""], ["Test for N, S, halogens", s.stage >= 3 ? "done" : s.stage === 2 ? "now" : ""], ["Test for C and H with CuO", s.ch ? "done" : ""]]; },
  };

  /* =============================== bond fission & reactive species =============================== */
  const BF = ["Homolytic fission: Cl–Cl → 2Cl• (UV light)", "Heterolytic fission: (CH₃)₃C–Br → (CH₃)₃C⁺ + Br⁻", "Nucleophile attacks δ+ carbon: OH⁻ + CH₃Br", "Electrophile attacks a C=C bond: Br₂ + ethene", "Inductive effect: chloroethanoic acids"];
  const ACIDS = [{ n: "ethanoic acid, CH₃COOH", nCl: 0, pKa: 4.76 }, { n: "chloroethanoic acid, CH₂ClCOOH", nCl: 1, pKa: 2.86 }, { n: "dichloroethanoic acid, CHCl₂COOH", nCl: 2, pKa: 1.29 }, { n: "trichloroethanoic acid, CCl₃COOH", nCl: 3, pKa: 0.65 }];
  C3.scenes.bondFission = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.75, fov: 36, free: true, cam: [[1.1, 2.4, 7.4], [0.7, 1.5, 0]],
    values: { mode: 0, acid: 1, sf: 0 },
    state: () => ({ p: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Concept", options: BF.map((m, i) => ({ value: i, label: m })) },
        { type: "button", label: "Break / make the bond (animate)", action: (S, s) => { s.go = 1; s.p = 0; } },
        { type: "select", key: "acid", label: "Inductive effect: acid", options: ACIDS.map((m, i) => ({ value: i, label: m.n })) },
        { type: "toggle", key: "sf", label: "Space-filling model" },
      ];
    },
    views: [{ label: "Molecules", cam: [[1.1, 2.4, 7.4], [0.7, 1.5, 0]] }, { label: "Close", cam: [[0.2, 1.8, 3.6], [0.1, 1.5, 0]] }],
    note: "Homolytic fission: a covalent bond breaks evenly, each atom keeping one electron, giving free radicals (species with an unpaired electron), e.g. Cl₂ → 2Cl• in UV light. Heterolytic fission: both electrons go to the more electronegative atom, giving a cation and an anion. A nucleophile is an electron-pair donor (OH⁻, CN⁻, NH₃, H₂O) that attacks an electron-deficient (δ+) carbon; an electrophile is an electron-pair acceptor (H⁺, Br⁺/polarised Br₂, NO₂⁺) that attacks an electron-rich region such as a C=C double bond or a benzene ring. Inductive effect: electronegative atoms such as Cl pull electron density along σ bonds (−I effect), stabilising the carboxylate anion and making chloroethanoic acids stronger; alkyl groups push electrons (+I), which stabilises carbocations: 3° > 2° > 1°.",
    onChange(S, s, c) { s.go = 0; s.p = 0; buildBF(S, s, c); },
    reset(S, s, c) { Object.assign(c, { mode: 0, acid: 1, sf: 0 }); s.go = 0; s.p = 0; buildBF(S, s, c); },
    build(S, s, c) { const K = C3.kit(S); s.K = K; S.mk.box(9, 0.06, 3.6, M.matte(0xb69a76, 0.62), 0.4, 0, 0).receiveShadow = true; S.mk.cyl(2.2, 2.3, 0.1, M.plastic(0x1f2833, 0.3), 0.2, 0.05, 0).receiveShadow = true;
      s.e = [0, 1].map(() => { const m = new T.Mesh(new T.SphereGeometry(0.05, 16, 12), M.emissive(0x7fd8ff, 2.4)); S.scene.add(m); return m; }); s.uv = S.mk.soft(0xb07aff, 2.2, -2.0, 2.6, 0, 0); buildBF(S, s, c); },
    update(S, s, c, dt) {
      const m = c.mode | 0, t = S.t; if (s.go && dt > 0) s.p = clamp(s.p + dt * 0.45, 0, 1); const k = G.smooth(0.15, 0.85, s.p);
      s.uv.material.opacity = m === 0 && s.go && s.p < 0.6 ? 0.55 + 0.3 * Math.sin(t * 20) : 0;
      if (!s.A || !s.B) { s.e.forEach((e) => { e.visible = false; }); if (s.mols) s.mols.forEach((mo, i) => { mo.group.rotation.y = Math.sin(t * 0.4 + i) * 0.5; }); return; }
      const sep = m <= 1 ? 1.1 * k : 0; s.A.group.position.x = s.A.x0 - sep * (m === 1 ? 0.7 : 1); s.B.group.position.x = s.B.x0 + sep * (m === 1 ? 1.2 : 1);
      if (m >= 2) { s.A.group.position.x = s.A.x0 + 0.8 * k; }
      const pa = s.A.group.localToWorld(s.A.mo.atoms[s.A.ai].p.clone()), pb = s.B.group.localToWorld(s.B.mo.atoms[s.B.bi].p.clone()); s.pa = pa; s.pb = pb;
      s.e.forEach((e, i) => { e.visible = m <= 1; const mid = pa.clone().lerp(pb, 0.5).add(V3(0, (i ? 0.07 : -0.07), 0.12)); let to; if (m === 0) to = (i ? pb : pa).clone().add(V3(0, 0.32, 0.2)); else to = pb.clone().add(V3(0.1 * (i ? 1 : -1), 0.32, 0.2)); e.position.lerpVectors(mid, to, k); e.scale.setScalar(1 + 0.2 * Math.sin(t * 8 + i)); });
      (s.mols || []).forEach((mo) => mo.refresh(c.sf ? 1 : 0));
    },
    overlay(ctx, s, c, w, h, S) {
      const m = c.mode | 0, px = w - 250, k = G.smooth(0.15, 0.85, s.p); ctx.save(); G.titles(ctx, BF[m], ["each atom keeps ONE electron: free radicals", "both electrons go to Br (more electronegative): ions", "nucleophile = electron-pair donor", "electrophile = electron-pair acceptor", "electron-withdrawing Cl stabilises the anion"][m]);
      if (s.pa && s.pb && m <= 1 && k < 0.5) { const a = S.proj(s.pa.clone().lerp(s.pb, 0.5)), b = S.proj(m === 0 ? s.pa : s.pb), b2 = S.proj(s.pb); G.curly(ctx, { x: a.x, y: a.y - 6 }, { x: b.x, y: b.y - 14 }, "#ffd27a", m === 0, 0.5); if (m === 0) G.curly(ctx, { x: a.x, y: a.y - 6 }, { x: b2.x, y: b2.y - 14 }, "#ffd27a", true, -0.5); }
      if (m === 0 && k > 0.6) { G.tag(ctx, S, s.pa.clone().add(V3(0, 0.6, 0)), "Cl•  (radical)", "#9fe3ff", 9); G.tag(ctx, S, s.pb.clone().add(V3(0, 0.6, 0)), "Cl•  (radical)", "#9fe3ff", 9); }
      if (m === 1) { G.tag(ctx, S, s.pa.clone().add(V3(-0.2, 0.75, 0)), k > 0.6 ? "(CH₃)₃C⁺ carbocation" : "δ+", "#ff9d8a", 9); G.tag(ctx, S, s.pb.clone().add(V3(0, 0.6, 0)), k > 0.6 ? "Br⁻" : "δ−", "#9fd0ff", 9); }
      if (m === 2 || m === 3) { const a = S.proj(s.pa), b = S.proj(s.pb); G.curly(ctx, { x: a.x + 8, y: a.y - 8 }, { x: b.x - 8, y: b.y - 8 }, "#ffd27a", false, 0.4); G.tag(ctx, S, s.pa.clone().add(V3(0, 0.6, 0)), m === 2 ? "OH⁻ nucleophile (lone pair)" : "Br–Br polarised (δ+ Br attacks)", "#ffe9b8", 8.5); G.tag(ctx, S, s.pb.clone().add(V3(0, 0.6, 0)), m === 2 ? "δ+ carbon" : "electron-rich C=C (π bond)", "#9fd0ff", 8.5);
        if (k > 0.9) G.status(ctx, m === 2 ? "CH₃Br + OH⁻ → CH₃OH + Br⁻ (nucleophilic substitution)" : "CH₂=CH₂ + Br₂ → CH₂BrCH₂Br (electrophilic addition)", "ok"); }
      if (m === 4) { const A = ACIDS[c.acid | 0]; H.panel(ctx, px, 58, 240, 110); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.textAlign = "left"; ctx.fillText("Acid strength (Ka = 10^−pKa)", px + 8, 73);
        ACIDS.forEach((q, i) => { const bw = (5 - q.pKa) / 5 * 150; ctx.fillStyle = i === (c.acid | 0) ? "#ffd27a" : "#6f8fbf"; ctx.fillRect(px + 70, 84 + i * 20, bw, 12); ctx.fillStyle = "#cfe0f5"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText(["CH₃", "CH₂Cl", "CHCl₂", "CCl₃"][i] + "COOH", px + 8, 94 + i * 20); ctx.fillText("pKa " + q.pKa, px + 74 + bw, 94 + i * 20); });
        G.panel(ctx, px, 174, 240, "Why?", ["each Cl pulls electron density away from the –COO⁻ group (−I effect)", "the negative charge is spread out, so the anion is more stable", ["more Cl → stronger acid: pKa " + A.pKa + ", Ka = " + Math.pow(10, -A.pKa).toExponential(2), "#ffe9b8"], "alkyl groups push electrons (+I): carbocation stability 3° > 2° > 1°"]); }
      ctx.restore();
    },
    readouts(s, c) { const m = c.mode | 0; if (m === 4) { const A = ACIDS[c.acid | 0]; return [["Acid", A.n], ["pKa", A.pKa], ["Ka", Math.pow(10, -A.pKa).toExponential(2) + " mol/dm³"]]; } return [["Concept", BF[m]], ["Progress", Math.round(s.p * 100) + " %"]]; },
  };
  function buildBF(S, s, c) {
    (s.mols || []).forEach((mo) => G.disposeGroup(mo.group)); s.mols = []; s.A = s.B = null; const K = s.K, m = c.mode | 0;
    const mk = (spec, x, sc) => { const mo = G.molecule(K, G.build(spec), { scale: sc || 0.6 }); mo.group.position.set(x, 1.5, 0); s.mols.push(mo); return mo; };
    if (m === 0) { const a = mk([{ el: "Cl", nh: 0 }], -0.55), b = mk([{ el: "Cl", nh: 0 }], 0.55); s.A = { mo: a, group: a.group, ai: 0, x0: -0.55 }; s.B = { mo: b, group: b.group, bi: 0, x0: 0.55 }; }
    else if (m === 1) { const a = mk([{ el: "C", nh: 0, h: "sp3" }, { el: "C", p: 0 }, { el: "C", p: 0 }, { el: "C", p: 0 }], -0.7, 0.5), b = mk([{ el: "Br", nh: 0 }], 0.7, 0.6); s.A = { mo: a, group: a.group, ai: 0, x0: -0.7 }; s.B = { mo: b, group: b.group, bi: 0, x0: 0.7 }; }
    else if (m === 2) { const a = mk([{ el: "O", nh: 1 }], -1.6, 0.6), b = mk([{ el: "C" }, { el: "Br", p: 0 }], 0.6, 0.6); s.A = { mo: a, group: a.group, ai: 0, x0: -1.6 }; s.B = { mo: b, group: b.group, bi: 0, x0: 0.6 }; }
    else if (m === 3) { const a = mk([{ el: "Br", nh: 0 }, { el: "Br", p: 0, nh: 0 }], -1.6, 0.6), b = mk(G.chain(2, { db: 1 }), 0.7, 0.7); s.A = { mo: a, group: a.group, ai: 0, x0: -1.6 }; s.B = { mo: b, group: b.group, bi: 0, x0: 0.7 }; }
    else { const A = ACIDS[c.acid | 0], sp = [{ el: "C", nh: 3 - A.nCl }, { el: "C", p: 0 }, { el: "O", p: 1, o: 2 }, { el: "O", p: 1 }]; for (let i = 0; i < A.nCl; i++) sp.push({ el: "Cl", p: 0 }); const mo = mk(sp, -0.7, 0.5); mo.atoms.forEach((at) => { if (at.el === "Cl") at.mesh.material.emissive = new T.Color(0x0a4010); }); }
    (s.mols || []).forEach((mo) => mo.refresh(c.sf ? 1 : 0));
  }
})();
