/* c3d-g7.js — chemistry 3D gap scenes: thermal stability of carbonates & nitrates; polarisation (Fajans' rules); double-indicator titration (Na₂CO₃/NaHCO₃) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready || !C3.gx) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, G = C3.gx, CM = C3.CM, TAU = Math.PI * 2;
  const { clamp, lerp } = G, rnd = U.rnd;

  /* ---------- shared titration rig (burette over a conical flask on a white tile) ---------- */
  G.titr = function (S, K, s, o) {
    o = o || {}; K.tile(18); K.contact(0, 0.8 * CM, 0, 5.4, 0.5);
    const flask = K.flask(); flask.group.position.set(0, 0.8 * CM, 0); s.flask = flask; s.flL = flask.addLiquid({ color: o.flask || [225, 238, 246], opacity: 0.22 });
    const stand = K.retort({ x: -1.8, z: -0.9, h: 88 }); K.contact(-1.8, 0, 0, 8, 0.55);
    const bur = K.burette({ color: 0xcfe8f5, opacity: 0.3 }); bur.position.set(0, 17.5 * CM, 0); s.bur = bur; s.tipY = bur.position.y; K.clampArm(stand, 46, 0, 0, 0.66); K.clampArm(stand, 64, 0, 0, 0.66);
    s.drops = K.drops({ color: 0xcfe8f5 }); if (o.burCol) { s.bur.setLiquid(o.burCol, o.burOp == null ? 0.3 : o.burOp); s.drops.setColor(o.burCol); }
    s.V = 0; s.hang = 0; s.swirlPh = 0;
    const R = {};
    R.release = (n) => { for (let i = 0; i < (n || 1); i++) { s.V = Math.min(50, s.V + 0.05); const surf = s.flask.group.position.y + s.flL.level * CM; s.drops.emit(0, s.tipY - 0.03, 0, surf, 0.036); } };
    R.update = (c, dt, t) => { s.bur.tapAngle(clamp(c.tap, 0, 1)); const tap = clamp(c.tap, 0, 1), rate = tap < 0.02 ? 0 : 3.3 * Math.pow(tap, 1.5); const surfY = s.flask.group.position.y + s.flL.level * CM; let stream = false;
      if (rate > 0 && s.V < 50 && dt > 0) { if (rate > 0.7) { s.V = Math.min(50, s.V + rate * dt); stream = true; s.hang = 0; } else { s.hang += rate * dt; if (s.hang >= 0.05) { s.hang -= 0.05; R.release(1); } } }
      s.drops.setStream(0, s.tipY, 0, surfY, stream); s.drops.setHang(0, s.tipY, 0, stream ? 0 : clamp(s.hang / 0.05, 0, 1), 0.036); s.drops.update(dt); s.bur.setReading(s.V);
      const sw = c.swirl; s.flL.agit = sw ? 0.9 : 0; s.flask.group.position.x = sw ? Math.cos(s.swirlPh) * 0.045 : 0; s.flask.group.position.z = sw ? Math.sin(s.swirlPh) * 0.045 : 0; if (sw && dt > 0) s.swirlPh += dt * 2.6 * TAU;
      s.flL.update(t); s.bur.ves.liq.update(t); };
    R.controls = () => [
      { type: "range", key: "tap", label: "Burette tap (0 shut → 1 open)", min: 0, max: 1, step: 0.01 },
      { type: "button", label: "+ 1 drop (≈ 0.05 cm³)", action: () => R.release(1) }, { type: "button", label: "+ 1 cm³", action: () => R.release(20) },
      { type: "button", label: "Close tap", cls: "secondary", action: (S2, s2, c2, ref) => { c2.tap = 0; ref(); } }, { type: "toggle", key: "swirl", label: "Swirl the flask" }];
    R.views = [{ label: "Burette + flask", cam: [[4.6, 4.6, 12.8], [1.4, 3.7, 0]] }, { label: "Flask", cam: [[3.4, 3.0, 6.2], [1.1, 1.7, 0]] }, { label: "Read burette", cam: (S2, s2) => { const y = s2.bur.levelWorldY(); return [[0.25, y + 0.05, 2.1], [0, y, 0]]; } }];
    return R;
  };

  /* =============================== thermal stability =============================== */
  const SALTS = [
    { f: "Li₂CO₃", n: "lithium trioxocarbonate(IV)", kind: "c", Td: 1000, col: [248, 248, 246], prod: [248, 248, 246], eq: "Li₂CO₃ → Li₂O + CO₂  (only on strong heating)" },
    { f: "Na₂CO₃", n: "sodium trioxocarbonate(IV)", kind: "c", Td: 9999, col: [248, 248, 246], prod: [248, 248, 246], eq: "no decomposition at Bunsen temperatures" },
    { f: "K₂CO₃", n: "potassium trioxocarbonate(IV)", kind: "c", Td: 9999, col: [248, 248, 246], prod: [248, 248, 246], eq: "no decomposition at Bunsen temperatures" },
    { f: "MgCO₃", n: "magnesium trioxocarbonate(IV)", kind: "c", Td: 350, col: [248, 248, 246], prod: [248, 248, 246], eq: "MgCO₃ → MgO + CO₂" },
    { f: "CaCO₃", n: "calcium trioxocarbonate(IV)", kind: "c", Td: 700, col: [248, 248, 246], prod: [248, 248, 246], eq: "CaCO₃ → CaO + CO₂  (strong heating)" },
    { f: "CuCO₃", n: "copper(II) trioxocarbonate(IV)", kind: "c", Td: 250, col: [70, 160, 110], prod: [30, 30, 32], eq: "CuCO₃ → CuO + CO₂  (green → black)" },
    { f: "NaNO₃", n: "sodium trioxonitrate(V)", kind: "n1", Td: 380, col: [248, 248, 246], prod: [248, 246, 230], eq: "2NaNO₃ → 2NaNO₂ + O₂  (no brown gas)" },
    { f: "KNO₃", n: "potassium trioxonitrate(V)", kind: "n1", Td: 400, col: [248, 248, 246], prod: [248, 246, 230], eq: "2KNO₃ → 2KNO₂ + O₂  (no brown gas)" },
    { f: "LiNO₃", n: "lithium trioxonitrate(V)", kind: "n2", Td: 500, col: [248, 248, 246], prod: [248, 248, 246], eq: "4LiNO₃ → 2Li₂O + 4NO₂ + O₂" },
    { f: "Mg(NO₃)₂", n: "magnesium trioxonitrate(V)", kind: "n2", Td: 330, col: [248, 248, 246], prod: [248, 248, 246], eq: "2Mg(NO₃)₂ → 2MgO + 4NO₂ + O₂" },
    { f: "Ca(NO₃)₂", n: "calcium trioxonitrate(V)", kind: "n2", Td: 500, col: [248, 248, 246], prod: [248, 248, 246], eq: "2Ca(NO₃)₂ → 2CaO + 4NO₂ + O₂" },
    { f: "Cu(NO₃)₂", n: "copper(II) trioxonitrate(V)", kind: "n2", Td: 200, col: [40, 110, 220], prod: [30, 30, 32], eq: "2Cu(NO₃)₂ → 2CuO + 4NO₂ + O₂  (blue → black)" },
  ];
  C3.scenes.thermalStability = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.74, fov: 36, free: true, cam: [[1.4, 3.2, 7.6], [0.9, 1.7, 0]],
    values: { salt: 3, strong: 1 },
    state: () => ({ rec: {} }),
    get controls() {
      return [
        { type: "select", key: "salt", label: "Salt in the tube", options: SALTS.map((m, i) => ({ value: i, label: m.f + " — " + m.n })) },
        { type: "toggle", key: "strong", label: "Strong heating (roaring blue flame)" },
        { type: "button", label: "Heat the tube", action: (S, s) => { s.heat = 1; } },
        { type: "button", label: "Test the gas: glowing splint at the mouth", action: (S, s) => { s.splint = 1; s.spT = 0; } },
        { type: "button", label: "Fresh sample", cls: "secondary", action: (S, s, c) => { restartTS(s); } },
      ];
    },
    views: [{ label: "Apparatus", cam: [[1.4, 3.2, 7.6], [0.9, 1.7, 0]] }, { label: "Tube close", cam: [[0.2, 2.9, 3.6], [-0.2, 2.5, 0]] }],
    note: "Trioxocarbonates(IV) decompose on heating to the oxide and carbon(IV) oxide, which turns lime water milky. Group 1 carbonates (Na, K) are stable to Bunsen heat; lithium carbonate decomposes, like magnesium carbonate (diagonal relationship). Down group 2 the carbonates and trioxonitrates(V) become more stable: MgCO₃ decomposes far more easily than CaCO₃. Trioxonitrates(V) of Na and K give the dioxonitrate(III) and oxygen only (relights a glowing splint); those of Li, group 2 and heavy metals give the oxide, brown nitrogen(IV) oxide and oxygen. The smaller and more highly charged the cation, the more it polarises (distorts) the large CO₃²⁻ or NO₃⁻ ion and the easier the salt decomposes.",
    onChange(S, s, c, key) { if (key === "salt") restartTS(s); },
    reset(S, s, c) { Object.assign(c, { salt: 3, strong: 1 }); restartTS(s); s.rec = {}; },
    build(S, s, c) {
      const K = C3.kit(S), sc = S.scene; s.K = K; S.mk.box(10, 0.06, 3.8, M.matte(0xb69a76, 0.62), 0.4, 0, 0).receiveShadow = true;
      const st = K.retort({ x: -1.4, z: -0.7, h: 60 }); const bt = K.vessel(G.DEFS.boilingtube); bt.group.rotation.z = -(Math.PI / 2 - 0.25); bt.group.position.set(-1.05, 2.35, 0); s.bt = bt;
      K.clampArm(st, 2.55 / CM + 0, -0.35, 0, 1.2); s.bn = K.bunsen({ x: -0.85, z: 0 });
      s.solid = G.heap(0.95, 0.8, [248, 248, 246]); s.solid.position.y = 0.5 * CM; s.solid.scale.set(1, 1, 1); bt.group.add(s.solid); s.solid.material.map = null; s.solid.material.color.setRGB(1, 1, 1);
      s.solid.material.emissive = new T.Color(1, 0.35, 0.06); s.solid.material.emissiveIntensity = 0;
      const bung = G.bung(S, 1.05, 2.0); bung.rotation.z = -(Math.PI / 2 - 0.25); bung.position.set(-1.05 + Math.cos(0.25) * 15.4 * CM, 2.35 + Math.sin(0.25) * 15.4 * CM, 0); s.bung = bung;
      const m0 = bung.position.clone(); s.mouth = m0.clone(); const dp = [m0.clone().add(V3(0.2, 0.06, 0)), m0.clone().add(V3(0.55, 0.1, 0)), V3(2.35, m0.y - 0.1, 0), V3(2.45, 1.2, 0), V3(2.45, 0.85, 0)]; s.dt = G.glassTube(S, K, dp, 0.3, 0.14);
      const lw = K.vessel("testtube"); lw.group.position.set(2.45, 0.6, 0); s.lwL = lw.addLiquid({ color: [235, 240, 244], opacity: 0.22 }); s.lwL.setVolume(10); s.lwB = K.bubbles(lw, s.lwL, { n: 30, spread: 0.1 }); S.mk.rbox(0.6, 0.6, 0.5, 0.03, M.wood(), 2.45, 0.3, 0);
      s.fumes = []; for (let i = 0; i < 26; i++) { const sp = new T.Sprite(new T.SpriteMaterial({ map: U.softDot(64, "rgba(255,255,255,1)"), color: 0x9a4a14, transparent: true, opacity: 0, depthWrite: false })); sp.scale.setScalar(0.3); sc.add(sp); s.fumes.push({ sp, f: Math.random(), r: rnd(-0.04, 0.04) }); }
      s.spl = new T.Group(); const sp = new T.Mesh(new T.BoxGeometry(1.4, 0.03, 0.03), M.matte(0xd8b47a, 0.8)); sp.position.x = 0.7; s.spl.add(sp); s.ember = new T.Mesh(new T.SphereGeometry(0.025, 10, 8), M.emissive(0xff5a10, 2.5)); s.spl.add(s.ember); s.splF = K.flame({ h: 1.4, r: 0.3 }); s.splF.set(0.05, 1); s.splF.group.rotation.z = Math.PI / 2; s.spl.add(s.splF.group); sc.add(s.spl); s.spl.visible = false;
      restartTS(s);
    },
    update(S, s, c, dt) {
      const X = SALTS[c.salt | 0], t = S.t, Tmax = c.strong ? 850 : 520; s.bn.setAir(c.strong ? 1 : 0.35); s.bn.setGas(s.heat ? 1 : 0); s.bn.flame.update(t);
      if (dt > 0) { s.T += ((s.heat ? Tmax : 25) - s.T) * (1 - Math.exp(-dt * (s.heat ? 0.22 : 0.12))); if (s.heat) s.time += dt * 6; }
      const k = X.Td > 5000 ? 0 : clamp((s.T - X.Td) / 220, 0, 1) * 0.06; if (dt > 0) s.dec = clamp(s.dec + k * dt * (s.dec < 1 ? 1 : 0), 0, 1);
      s.solid.material.color.copy(G.col(G.mix(X.col, X.prod, s.dec))); s.solid.material.emissiveIntensity = clamp((s.T - 550) / 400, 0, 1) * 0.8; s.solid.scale.y = X.kind === "n1" && s.T > 320 ? 0.55 : 1 - 0.3 * s.dec; s.solid.material.roughness = X.kind === "n1" && s.T > 320 ? 0.1 : 0.95;
      const gasRate = k * (1 - s.dec) * 60; s.gas += gasRate * dt; const co2 = X.kind === "c" ? s.gas : 0; s.milky = clamp(co2 / 0.25, 0, 1); s.lwL.setColor(G.mix([235, 240, 244], [246, 246, 244], s.milky), 0.22 + 0.62 * s.milky); s.lwB.rate = gasRate > 0.02 && !s.splint ? 18 : 0; s.lwB.update(dt, t); s.lwL.update(t);
      if (X.kind === "c" && s.milky > 0.5 && s.tMilky == null) { s.tMilky = s.time; s.rec[X.f] = s.time; }
      if (X.kind === "c" && s.heat && s.tMilky == null && s.time > 600) { s.rec[X.f] = s.rec[X.f] || "no change"; }
      const brown = X.kind === "n2" ? clamp(s.gas / 0.6, 0, 1) : 0; s.fumes.forEach((f) => { f.f = (f.f + dt * 0.12) % 1; const p = V3(-1.05, 2.35, 0).add(V3(Math.cos(0.25), Math.sin(0.25), 0).multiplyScalar(0.25 + f.f * 2.3)); f.sp.position.set(p.x, p.y + f.r, f.r); f.sp.material.opacity = brown * 0.35 * Math.sin(f.f * Math.PI); });
      s.bung.visible = !s.splint; s.dt.visible = !s.splint;
      if (s.splint) { s.spT += dt; s.spl.visible = true; const kk = G.smooth(0, 1, s.spT); s.spl.position.copy(s.mouth.clone().add(V3(0.25 + 0.8 * (1 - kk), 0.15 + 0.3 * (1 - kk), 0.3 * (1 - kk)))); s.spl.rotation.set(0, 0, 0.3); const o2 = X.kind !== "c" && s.gas > 0.05; s.relit = o2 && s.spT > 1; s.splF.set(0.05, s.relit ? 1 : 0); s.splF.update(t); s.ember.visible = !s.relit; }
    },
    overlay(ctx, s, c, w, h, S) {
      const X = SALTS[c.salt | 0], px = w - 250; ctx.save(); G.titles(ctx, "Heating " + X.f + " — " + X.n, X.eq);
      G.tag(ctx, S, V3(-0.85, 3.15, 0), "≈ " + Math.round(s.T) + " °C", "#ffd27a", 9); G.tag(ctx, S, V3(2.45, 3.3, 0), "lime water", "#cfe0f5", 8.5);
      const obs = [X.kind === "c" ? (s.milky > 0.5 ? "lime water turned milky after " + Math.round(s.tMilky) + " s: CO₂ given off" : s.heat ? "lime water still clear…" : "heat the tube") : X.kind === "n2" ? (s.gas > 0.05 ? "brown fumes of NO₂ fill the tube" : "heat the tube") : (s.T > 320 ? "the salt melts to a clear liquid; no brown gas" : "heat the tube"), s.splint ? (s.relit ? "glowing splint relights: oxygen" : "splint is not relit") : "", X.col[0] !== X.prod[0] ? "colour: " + (s.dec > 0.5 ? "now black (CuO)" : "changing…") : ""];
      G.panel(ctx, px, 58, 240, "Observations", obs);
      const rows = Object.keys(s.rec).map((f) => [f + ": " + (typeof s.rec[f] === "number" ? Math.round(s.rec[f]) + " s to turn lime water milky" : s.rec[f]), "#e8f0ff"]);
      G.panel(ctx, px, 170, 240, "Carbonates tested (stability ↑ with longer time)", rows.length ? rows : ["heat several carbonates and compare the times"]);
      ctx.restore();
    },
    readouts(s, c) { const X = SALTS[c.salt | 0]; return [["Salt", X.f], ["Temperature", Math.round(s.T) + " °C"], ["Decomposed", Math.round(s.dec * 100) + " %"], ["Heating time", Math.round(s.time) + " s"]]; },
    table() { return G.table(["Cation", "Carbonate on heating", "Trioxonitrate(V) on heating"], [["Na⁺, K⁺", "stable", "MNO₂ + O₂"], ["Li⁺", "Li₂O + CO₂", "Li₂O + NO₂ + O₂"], ["Mg²⁺ → Ca²⁺ → Ba²⁺", "MO + CO₂ (harder down the group)", "MO + NO₂ + O₂"], ["Cu²⁺, Zn²⁺, Pb²⁺", "MO + CO₂ (easily)", "MO + NO₂ + O₂"]]); },
  };
  function restartTS(s) { s.heat = 0; s.T = 25; s.time = 0; s.dec = 0; s.gas = 0; s.milky = 0; s.tMilky = null; s.splint = 0; s.relit = 0; if (s.spl) s.spl.visible = false; }

  /* =============================== polarisation (Fajans) =============================== */
  const CATS = [{ f: "K⁺", r: 138, z: 1, col: 0x8f40d4 }, { f: "Na⁺", r: 102, z: 1, col: 0xab5cf2 }, { f: "Li⁺", r: 76, z: 1, col: 0xcc80ff }, { f: "Ca²⁺", r: 100, z: 2, col: 0x3dff00 }, { f: "Mg²⁺", r: 72, z: 2, col: 0x8aff00 }, { f: "Be²⁺", r: 45, z: 2, col: 0xc2ff00 }, { f: "Al³⁺", r: 54, z: 3, col: 0xbfa6a6 }];
  const ANS = [{ f: "F⁻", r: 133, z: 1, col: 0x8ee04a, a: 1.0 }, { f: "Cl⁻", r: 181, z: 1, col: 0x22d03a, a: 3.7 }, { f: "Br⁻", r: 196, z: 1, col: 0xa62929, a: 4.8 }, { f: "I⁻", r: 220, z: 1, col: 0x940094, a: 7.1 }, { f: "O²⁻", r: 140, z: 2, col: 0xe8281c, a: 3.9 }];
  const MPS = { "Na⁺Cl⁻": "801 °C", "Mg²⁺Cl⁻": "714 °C", "Al³⁺Cl⁻": "sublimes at 180 °C", "Li⁺F⁻": "845 °C", "Li⁺I⁻": "469 °C", "Be²⁺Cl⁻": "399 °C", "K⁺Cl⁻": "770 °C", "Na⁺I⁻": "661 °C", "Ca²⁺Cl⁻": "772 °C", "Al³⁺F⁻": "1290 °C", "Mg²⁺O²⁻": "2852 °C", "Al³⁺I⁻": "189 °C" };
  C3.scenes.polarisation = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.75, fov: 36, free: true, cam: [[1.2, 2.2, 6.6], [1.1, 1.5, 0]],
    values: { cat: 1, an: 1 },
    state: () => ({}),
    get controls() { return [{ type: "select", key: "cat", label: "Cation", options: CATS.map((m, i) => ({ value: i, label: m.f + "  (radius " + m.r + " pm)" })) }, { type: "select", key: "an", label: "Anion", options: ANS.map((m, i) => ({ value: i, label: m.f + "  (radius " + m.r + " pm)" })) }]; },
    views: [{ label: "Ion pair", cam: [[1.2, 2.2, 6.6], [1.1, 1.5, 0]] }, { label: "Top", cam: [[0.6, 5.6, 1.8], [0.4, 1.5, 0]] }],
    note: "Fajans' rules: a small, highly charged cation has a high charge density (polarising power) and pulls the electron cloud of a nearby anion towards itself. A large anion (or one with a high charge) is easily polarised. The more the anion is distorted, the more electron density is shared between the ions and the more covalent character the bond has. So covalent character increases: Na⁺ < Mg²⁺ < Al³⁺ (AlCl₃ sublimes at 180 °C) and F⁻ < Cl⁻ < Br⁻ < I⁻. Polarisation explains why LiI and BeCl₂ are partly covalent and why small cations like Li⁺ and Mg²⁺ make carbonates and nitrates decompose easily.",
    onChange(S, s, c) { rebuildPol(S, s, c); },
    reset(S, s, c) { Object.assign(c, { cat: 1, an: 1 }); rebuildPol(S, s, c); },
    build(S, s, c) { const K = C3.kit(S); s.K = K; S.mk.box(9, 0.06, 3.6, M.matte(0xb69a76, 0.62), 0.4, 0, 0).receiveShadow = true; S.mk.cyl(2.2, 2.3, 0.1, M.plastic(0x1f2833, 0.3), 0, 0.05, 0).receiveShadow = true; rebuildPol(S, s, c); },
    update(S, s, c, dt) { const t = S.t; if (!s.cloud) return; const d = s.dist * (1.3 - 0.33 * G.smooth(0, 2, t - s.t0)); s.cat.position.set(s.ax - d, 1.5, 0); const pa = s.cloud.geometry.attributes.position, b = s.cbase, kk = s.idx * G.smooth(0, 2, t - s.t0); const u = V3(-1, 0, 0), v = V3();
      for (let i = 0; i < pa.count; i++) { v.set(b[i * 3], b[i * 3 + 1], b[i * 3 + 2]); const n = v.clone().normalize(), f = Math.max(0, n.dot(u)); const st = 1 + kk * 0.75 * Math.pow(f, 2.5) - kk * 0.12 * Math.max(0, -n.dot(u)); v.multiplyScalar(st); v.x -= kk * 0.08; pa.setXYZ(i, v.x, v.y, v.z); } pa.needsUpdate = true; s.cloud.geometry.computeVertexNormals();
      s.dots.rotation.x += dt * 0.3; s.bridge.material.opacity = 0.5 * kk; s.bridge.scale.setScalar(0.3 + kk); },
    overlay(ctx, s, c, w, h, S) {
      const C = CATS[c.cat | 0], A = ANS[c.an | 0], px = w - 250; ctx.save(); G.titles(ctx, "Polarisation of " + A.f + " by " + C.f, "the cation pulls the anion's electron cloud towards itself");
      G.tag(ctx, S, V3(s.ax - s.dist * 0.97, 1.5 + s.rc + 0.35, 0), C.f, "#ff9d8a", 10); G.tag(ctx, S, V3(s.ax + s.ra * 0.3, 1.5 + s.ra + 0.3, 0), A.f + " electron cloud", "#9fd0ff", 9);
      const cov = s.idx, x0 = px + 12, wb = 216; H.panel(ctx, px, 58, 240, 66); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.textAlign = "left"; ctx.fillText("Bond character", px + 8, 73); const gr = ctx.createLinearGradient(x0, 0, x0 + wb, 0); gr.addColorStop(0, "#ff9d8a"); gr.addColorStop(1, "#7fd0ff"); ctx.fillStyle = gr; ctx.fillRect(x0, 82, wb, 12);
      ctx.fillStyle = "#fff"; const xm = x0 + wb * cov; ctx.beginPath(); ctx.moveTo(xm, 80); ctx.lineTo(xm - 5, 72 + 0); ctx.lineTo(xm + 5, 72); ctx.fill(); ctx.fillStyle = "#bcd0ea"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText("ionic", x0, 108); ctx.textAlign = "right"; ctx.fillText("covalent character", x0 + wb, 108); ctx.textAlign = "left";
      const key = C.f + A.f; G.panel(ctx, px, 130, 240, "Fajans' rules", ["polarising power of " + C.f + ": z/r² = " + (C.z / Math.pow(C.r / 100, 2)).toFixed(2) + " e Å⁻²", "polarisability of " + A.f + ": " + A.a.toFixed(1) + " Å³ (grows with size)", MPS[key] ? ["melting point of the compound: " + MPS[key], "#ffe9b8"] : "", cov > 0.55 ? ["strongly polarised: much covalent character (low m.p., soluble in organic solvents)", "#7fd0ff"] : cov > 0.3 ? "some covalent character" : ["little distortion: mainly ionic (high m.p., conducts when molten)", "#ff9d8a"]]);
      ctx.restore();
    },
    readouts(s, c) { const C = CATS[c.cat | 0], A = ANS[c.an | 0]; return [["Cation", C.f + ", " + C.r + " pm, charge +" + C.z], ["Anion", A.f + ", " + A.r + " pm"], ["Charge density z/r²", (C.z / Math.pow(C.r / 100, 2)).toFixed(2) + " e Å⁻²"], ["Covalent character", Math.round(s.idx * 100) + " %"]]; },
  };
  function rebuildPol(S, s, c) {
    [s.cat, s.cloud, s.core, s.dots, s.bridge].forEach((o) => o && G.disposeGroup(o)); const C = CATS[c.cat | 0], A = ANS[c.an | 0], sc = S.scene; s.rc = C.r / 100 * 0.55; s.ra = A.r / 100 * 0.55; s.dist = s.rc + s.ra;
    const pw = C.z / Math.pow(C.r / 100, 2), raw = pw * A.a * (A.z === 2 ? 1.6 : 1); s.idx = clamp(Math.log10(1 + raw) / Math.log10(1 + 120), 0, 1); s.t0 = S.t;
    s.cat = new T.Mesh(new T.SphereGeometry(s.rc, 48, 36), new T.MeshPhysicalMaterial({ color: C.col, roughness: 0.2, clearcoat: 1, emissive: C.col, emissiveIntensity: 0.15 })); s.cat.castShadow = true; sc.add(s.cat);
    const ag = new T.SphereGeometry(s.ra, 96, 64); s.cbase = Float32Array.from(ag.attributes.position.array); s.cloud = new T.Mesh(ag, new T.MeshPhysicalMaterial({ color: 0x6fb8ff, roughness: 0.15, transparent: true, opacity: 0.38, clearcoat: 1, depthWrite: false, side: T.DoubleSide })); s.ax = 0.7; s.cloud.position.set(s.ax, 1.5, 0); s.cloud.renderOrder = 5; sc.add(s.cloud);
    s.core = new T.Mesh(new T.SphereGeometry(s.ra * 0.32, 32, 24), new T.MeshPhysicalMaterial({ color: A.col, roughness: 0.25, clearcoat: 1 })); s.core.position.copy(s.cloud.position); sc.add(s.core);
    const n = 260, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const v = V3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(s.ra * Math.cbrt(Math.random()) * 0.95); pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z; } const dg = new T.BufferGeometry(); dg.setAttribute("position", new T.BufferAttribute(pos, 3));
    s.dots = new T.Points(dg, new T.PointsMaterial({ color: 0xbfe2ff, size: 0.03, map: U.softDot(32, "rgba(255,255,255,1)"), transparent: true, depthWrite: false })); s.dots.position.copy(s.cloud.position); sc.add(s.dots);
    s.bridge = S.mk.soft(0x9fd8ff, 0.8, s.ax - s.ra * 0.95, 1.5, 0, 0);
  }

  /* =============================== double-indicator titration =============================== */
  const KA1 = 4.47e-7, KA2 = 4.69e-11, KW = 1e-14, CHCL = 0.1;
  const MIX = [{ n: "Na₂CO₃ + NaHCO₃ mixture", b: "NaHCO₃" }, { n: "NaOH + Na₂CO₃ mixture", b: "NaOH" }, { n: "Na₂CO₃ only", b: null }];
  function phOf(c, V) { const Vt = (25 + V) / 1000, CT = (c.cco3 + (c.mix === 0 ? c.cb : 0)) * 0.025 / Vt, Na = (2 * c.cco3 + (c.mix !== 2 ? c.cb : 0)) * 0.025 / Vt, Cl = CHCL * V / 1000 / Vt;
    const f = (pH) => { const h = Math.pow(10, -pH), D = h * h + KA1 * h + KA1 * KA2, a1 = KA1 * h / D, a2 = KA1 * KA2 / D; return h + Na - KW / h - Cl - CT * (a1 + 2 * a2); };
    let lo = 0, hi = 14; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; } return (lo + hi) / 2; }
  function eqVols(c) { const nC = c.cco3 * 25, nB = c.mix === 2 ? 0 : c.cb * 25; if (c.mix === 0) return { v1: nC / CHCL, v2: (2 * nC + nB) / CHCL }; if (c.mix === 1) return { v1: (nC + nB) / CHCL, v2: (2 * nC + nB) / CHCL }; return { v1: nC / CHCL, v2: 2 * nC / CHCL }; }
  C3.scenes.doubleIndicator = {
    env: "chemlab", envOpts: { w: 30, d: 11, wallH: 30, shadowArea: 12 }, envI: 0.75, fov: 38, free: false, cam: [[4.6, 4.6, 12.8], [1.4, 3.7, 0]],
    values: { mix: 0, cco3: 0.05, cb: 0.04, tap: 0, swirl: 1 },
    state: () => ({ hist: [[0, 11]], recs: [] }),
    get controls() {
      return [
        { type: "select", key: "mix", label: "Solution in the flask (25.0 cm³)", options: MIX.map((m, i) => ({ value: i, label: m.n })) },
        { type: "range", key: "cco3", label: "Na₂CO₃ concentration (mol/dm³)", min: 0.02, max: 0.08, step: 0.005 },
        { type: "range", key: "cb", label: "NaHCO₃ or NaOH concentration (mol/dm³)", min: 0.0, max: 0.08, step: 0.005 },
      ].concat(this._rig ? this._rig.controls() : []).concat([
        { type: "button", label: "Add 2 drops of methyl orange", action: (S, s) => { s.mo = 1; } },
        { type: "button", label: "Record end point", action: (S, s) => { s.recs.push({ V: s.V, mo: s.mo }); } },
        { type: "button", label: "Refill burette and new flask", cls: "secondary", action: (S, s, c, ref) => { c.tap = 0; restartDI(s); ref(); } },
      ]);
    },
    views: null,
    note: "Two-stage titration with 0.100 mol/dm³ HCl. Phenolphthalein changes (pink → colourless) when CO₃²⁻ has been converted to HCO₃⁻: CO₃²⁻ + H⁺ → HCO₃⁻ (volume V₁). Methyl orange is then added; it turns from yellow to orange-red when all HCO₃⁻ has become CO₂: HCO₃⁻ + H⁺ → H₂O + CO₂ (further volume V₂ − V₁). For Na₂CO₃ + NaHCO₃: n(CO₃²⁻) = c·V₁ and n(HCO₃⁻) = c(V₂ − 2V₁). For NaOH + Na₂CO₃: n(CO₃²⁻) = c(V₂ − V₁) and n(OH⁻) = c(2V₁ − V₂). A back titration is used when a sample reacts slowly or is insoluble: excess standard acid is added and the excess is titrated.",
    onChange(S, s, c, key) { if (key !== "tap" && key !== "swirl") { c.tap = 0; restartDI(s); } },
    reset(S, s, c) { Object.assign(c, { mix: 0, cco3: 0.05, cb: 0.04, tap: 0, swirl: 1 }); restartDI(s); },
    build(S, s, c) { const K = C3.kit(S); s.K = K; s.rig = G.titr(S, K, s, {}); s.co2B = K.bubbles(s.flask, s.flL, { n: 50, spread: 1.4 }); [[-4.7, -3.7, "HCl"], [-3.3, -3.7, "Na₂CO₃"]].forEach(([x, z, l]) => { const b = K.bottle({ label: l, sub: l === "HCl" ? "0.100 mol/dm³" : "" }); b.position.set(x, 0, z); }); restartDI(s); },
    update(S, s, c, dt) {
      s.rig.update(c, dt, S.t); const pH = phOf(c, s.V); s.pH = pH; const ind = C3.chem.indicators, pp = C3.chem.indicatorAt(ind.phenolphthalein, pH), mo = C3.chem.indicatorAt(ind.methylOrange, pH);
      let rgb = pp.rgb, op = pp.op; if (s.mo) { const w2 = clamp((pp.op - 0.16) / 0.46, 0, 1); rgb = G.mix(mo.rgb, pp.rgb, w2 * 0.7); op = Math.max(mo.op, pp.op); } s.flL.setColor(rgb, op); s.flL.setVolume(25 + s.V);
      const E = eqVols(c); s.co2B.rate = s.V > E.v1 && s.V < E.v2 + 2 && pH < 5.5 ? 10 : 0; s.co2B.update(dt, S.t);
      if (s.V - s.lastH >= 0.2) { s.hist.push([s.V, pH]); s.lastH = s.V; }
    },
    overlay(ctx, s, c, w, h, S) {
      const px = w - 250, E = eqVols(c); ctx.save(); G.titles(ctx, "Double-indicator titration: " + MIX[c.mix | 0].n, "1st: phenolphthalein (CO₃²⁻ → HCO₃⁻);  2nd: methyl orange (HCO₃⁻ → CO₂)");
      const xm = Math.max(20, Math.ceil((E.v2 * 1.3) / 5) * 5); H.graph(ctx, px, 58, 240, 130, { series: [{ pts: s.hist, color: "#7fd0ff" }], xmin: 0, xmax: xm, ymin: 0, ymax: 14, xl: "V(HCl) / cm³", yl: "pH", dot: [s.V, s.pH, "#ffd27a"] });
      const r = s.recs, v1 = r[0] ? r[0].V : null, v2 = r[1] ? r[1].V : null, rows = ["V₁ (phenolphthalein) = " + (v1 != null ? v1.toFixed(2) : "—") + " cm³", "V₂ (methyl orange, total) = " + (v2 != null ? v2.toFixed(2) : "—") + " cm³"];
      if (v1 != null && v2 != null) { if ((c.mix | 0) === 1) rows.push(["n(CO₃²⁻) = 0.1 × (V₂−V₁) = " + (0.1 * (v2 - v1)).toFixed(3) + " mmol → " + (0.1 * (v2 - v1) / 25).toFixed(4) + " M", "#8dffb8"], ["n(OH⁻) = 0.1 × (2V₁−V₂) = " + (0.1 * (2 * v1 - v2)).toFixed(3) + " mmol → " + (0.1 * (2 * v1 - v2) / 25).toFixed(4) + " M", "#8dffb8"]);
        else rows.push(["n(CO₃²⁻) = 0.1 × V₁ = " + (0.1 * v1).toFixed(3) + " mmol → " + (0.1 * v1 / 25).toFixed(4) + " M", "#8dffb8"], ["n(HCO₃⁻) = 0.1 × (V₂−2V₁) = " + (0.1 * (v2 - 2 * v1)).toFixed(3) + " mmol → " + (0.1 * (v2 - 2 * v1) / 25).toFixed(4) + " M", "#8dffb8"]); }
      G.panel(ctx, px, 194, 240, "Results", rows);
      const st = !s.mo ? (s.pH > 9.5 ? "pink: CO₃²⁻ still present" : s.pH > 8.2 ? "fading pink: near the 1st end point" : "colourless: 1st end point passed — record V₁, add methyl orange") : (s.pH > 4.4 ? "yellow: HCO₃⁻ still present" : s.pH > 3.1 ? "orange: 2nd END POINT — record V₂" : "red: overshot");
      G.status(ctx, st, /END|record/.test(st) ? "ok" : st.startsWith("red") ? "bad" : "info"); G.foot(ctx, "flask: " + (s.mo ? "phenolphthalein + methyl orange" : "phenolphthalein") + "   pH " + s.pH.toFixed(2), "#cfe8ff");
      ctx.restore();
    },
    readouts(s, c) { const E = eqVols(c); return [["Burette reading", s.V.toFixed(2) + " cm³"], ["pH", s.pH.toFixed(2)], ["Indicators", s.mo ? "phenolphthalein + methyl orange" : "phenolphthalein"], ["Expected V₁ / V₂", E.v1.toFixed(2) + " / " + E.v2.toFixed(2) + " cm³"]]; },
    steps(s, c) { const r = s.recs.length; return [["Pipette 25.0 cm³ of the mixture; add phenolphthalein", "done"], ["Titrate with HCl until the pink just disappears; record V₁", r >= 1 ? "done" : "now"], ["Add methyl orange (yellow)", s.mo ? "done" : r >= 1 ? "now" : ""], ["Continue until yellow → orange; record V₂", r >= 2 ? "done" : s.mo ? "now" : ""], ["Calculate each component", r >= 2 ? "now" : ""]]; },
  };
  function restartDI(s) { s.V = 0; s.hang = 0; s.mo = 0; s.recs = []; s.hist = [[0, 11]]; s.lastH = 0; if (s.bur) { s.bur.setReading(0); } }
  /* controls/views need the rig helpers before mount: build a stand-in with the same functions */
  { const sc = C3.scenes.doubleIndicator, fake = { release() { }, controls: null }; const rigCtl = () => [
      { type: "range", key: "tap", label: "Burette tap (0 shut → 1 open)", min: 0, max: 1, step: 0.01 },
      { type: "button", label: "+ 1 drop (≈ 0.05 cm³)", action: (S, s) => s.rig.release(1) }, { type: "button", label: "+ 1 cm³", action: (S, s) => s.rig.release(20) },
      { type: "button", label: "Close tap", cls: "secondary", action: (S, s, c, ref) => { c.tap = 0; ref(); } }, { type: "toggle", key: "swirl", label: "Swirl the flask" }];
    sc._rig = { controls: rigCtl }; G.rigControls = rigCtl;
    sc.views = [{ label: "Burette + flask", cam: [[4.6, 4.6, 12.8], [1.4, 3.7, 0]] }, { label: "Flask", cam: [[3.4, 3.0, 6.2], [1.1, 1.7, 0]] }, { label: "Read burette", cam: (S, s) => { const y = s.bur.levelWorldY(); return [[0.25, y + 0.05, 2.1], [0, y, 0]]; } }]; G.rigViews = sc.views; void fake; }
})();
