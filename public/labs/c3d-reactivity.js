/* c3d-reactivity.js — chemistry 3D, new module: the reactivity series (metals with water, steam, dilute acid) and displacement reactions */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, CM = C3.CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  /* rank in the reactivity series (10 = most reactive) and metal colours */
  const MET = {
    K: { n: "Potassium", r: 10, c: 0xc9ccd2 }, Na: { n: "Sodium", r: 9, c: 0xc9ccd2 }, Ca: { n: "Calcium", r: 8, c: 0xcfcfc8 }, Mg: { n: "Magnesium", r: 7, c: 0xd4d6da }, Al: { n: "Aluminium", r: 6, c: 0xc6cad0 },
    Zn: { n: "Zinc", r: 5, c: 0x9fa6ae }, Fe: { n: "Iron", r: 4, c: 0x6a6f76 }, Pb: { n: "Lead", r: 3, c: 0x6d7076 }, Cu: { n: "Copper", r: 2, c: 0xc2703d }, Ag: { n: "Silver", r: 1, c: 0xdfe2e6 },
  };
  const ORDER = ["K", "Na", "Ca", "Mg", "Al", "Zn", "Fe", "Pb", "H", "Cu", "Ag"];
  /* rate 0..1, what is seen, equation (per reagent) */
  const R = {
    water: {
      K: [1, "bursts into a lilac flame, darts about, melts to a ball; very vigorous (explosive)", "2K + 2H₂O → 2KOH + H₂"], Na: [0.8, "fizzes and darts about on the surface, melts into a silvery ball and disappears", "2Na + 2H₂O → 2NaOH + H₂"], Ca: [0.45, "sinks, steady stream of bubbles; the water turns milky (Ca(OH)₂ is slightly soluble)", "Ca + 2H₂O → Ca(OH)₂ + H₂"],
      Mg: [0.04, "a very few bubbles after a long time (a thin Mg(OH)₂ film forms)", "Mg + 2H₂O → Mg(OH)₂ + H₂  (very slow)"], Al: [0, "no reaction: protected by its oxide film", "no reaction"], Zn: [0, "no reaction with cold water", "no reaction"], Fe: [0, "no reaction with cold water (it rusts only with air as well)", "no reaction"], Pb: [0, "no reaction", "no reaction"], Cu: [0, "no reaction", "no reaction"], Ag: [0, "no reaction", "no reaction"],
    },
    steam: {
      K: [1, "too violent: reacts explosively even with cold water", "2K + 2H₂O → 2KOH + H₂"], Na: [1, "too violent: reacts vigorously even with cold water", "2Na + 2H₂O → 2NaOH + H₂"], Ca: [1, "reacts with cold water already, so steam is not needed", "Ca + 2H₂O → Ca(OH)₂ + H₂"],
      Mg: [1, "burns with a brilliant white flame leaving white MgO", "Mg + H₂O(g) → MgO + H₂"], Al: [0.35, "reacts slowly once hot, leaving white Al₂O₃", "2Al + 3H₂O(g) → Al₂O₃ + 3H₂"], Zn: [0.45, "glows when heated; leaves ZnO (yellow hot, white cold)", "Zn + H₂O(g) → ZnO + H₂"], Fe: [0.25, "slow reaction: red-hot iron turns black, Fe₃O₄ (reversible)", "3Fe + 4H₂O(g) ⇌ Fe₃O₄ + 4H₂"], Pb: [0, "no reaction", "no reaction"], Cu: [0, "no reaction", "no reaction"], Ag: [0, "no reaction", "no reaction"],
    },
    acid: {
      K: [1, "explodes: NEVER carried out in a school laboratory", "2K + 2HCl → 2KCl + H₂"], Na: [1, "explodes: NEVER carried out in a school laboratory", "2Na + 2HCl → 2NaCl + H₂"], Ca: [0.9, "very vigorous fizzing; the metal dissolves quickly and the tube warms up", "Ca + 2HCl → CaCl₂ + H₂"],
      Mg: [0.8, "vigorous fizzing, the metal dissolves in seconds; tube becomes warm", "Mg + 2HCl → MgCl₂ + H₂"], Al: [0.5, "slow at first (oxide film), then steady fizzing", "2Al + 6HCl → 2AlCl₃ + 3H₂"], Zn: [0.4, "steady stream of bubbles", "Zn + 2HCl → ZnCl₂ + H₂"], Fe: [0.18, "slow bubbling; pale green Fe²⁺ solution forms", "Fe + 2HCl → FeCl₂ + H₂"], Pb: [0.05, "almost no reaction: a coating of insoluble PbCl₂ forms", "Pb + 2HCl → PbCl₂ + H₂  (stops quickly)"], Cu: [0, "no reaction: copper is below hydrogen", "no reaction"], Ag: [0, "no reaction: silver is below hydrogen", "no reaction"],
    },
  };
  const SALT = {
    CuSO4: { name: "copper(II) sulphate", f: "CuSO₄", m: "Cu", col: [88, 160, 236], dep: 0xc2703d, depn: "reddish-brown copper" },
    ZnSO4: { name: "zinc sulphate", f: "ZnSO₄", m: "Zn", col: [214, 232, 246], dep: 0x9fa6ae, depn: "grey zinc" },
    FeSO4: { name: "iron(II) sulphate", f: "FeSO₄", m: "Fe", col: [196, 228, 196], dep: 0x5a5f66, depn: "grey iron" },
    MgSO4: { name: "magnesium sulphate", f: "MgSO₄", m: "Mg", col: [214, 232, 246], dep: 0xd4d6da, depn: "magnesium" },
    PbNO3: { name: "lead(II) nitrate", f: "Pb(NO₃)₂", m: "Pb", col: [214, 232, 246], dep: 0x7a7e86, depn: "grey feathery lead crystals" },
    AgNO3: { name: "silver nitrate", f: "AgNO₃", m: "Ag", col: [214, 232, 246], dep: 0xe4e8ec, depn: "shiny silver crystals" },
  };
  const ION = { Zn: [214, 232, 246], Fe: [196, 228, 196], Mg: [214, 232, 246], Al: [214, 232, 246], Pb: [214, 232, 246], Cu: [88, 160, 236] };
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const dispEq = (m, sk) => { const S = SALT[sk]; return { Zn: { CuSO4: "Zn + CuSO₄ → ZnSO₄ + Cu", FeSO4: "Zn + FeSO₄ → ZnSO₄ + Fe", MgSO4: "", PbNO3: "Zn + Pb(NO₃)₂ → Zn(NO₃)₂ + Pb", AgNO3: "Zn + 2AgNO₃ → Zn(NO₃)₂ + 2Ag" }, Mg: { CuSO4: "Mg + CuSO₄ → MgSO₄ + Cu", ZnSO4: "Mg + ZnSO₄ → MgSO₄ + Zn", FeSO4: "Mg + FeSO₄ → MgSO₄ + Fe", PbNO3: "Mg + Pb(NO₃)₂ → Mg(NO₃)₂ + Pb", AgNO3: "Mg + 2AgNO₃ → Mg(NO₃)₂ + 2Ag" }, Fe: { CuSO4: "Fe + CuSO₄ → FeSO₄ + Cu", PbNO3: "Fe + Pb(NO₃)₂ → Fe(NO₃)₂ + Pb", AgNO3: "Fe + 2AgNO₃ → Fe(NO₃)₂ + 2Ag" }, Al: { CuSO4: "2Al + 3CuSO₄ → Al₂(SO₄)₃ + 3Cu", ZnSO4: "2Al + 3ZnSO₄ → Al₂(SO₄)₃ + 3Zn", FeSO4: "2Al + 3FeSO₄ → Al₂(SO₄)₃ + 3Fe", PbNO3: "2Al + 3Pb(NO₃)₂ → 2Al(NO₃)₃ + 3Pb", AgNO3: "Al + 3AgNO₃ → Al(NO₃)₃ + 3Ag" }, Pb: { CuSO4: "Pb + CuSO₄ → PbSO₄ + Cu (PbSO₄ is insoluble)", AgNO3: "Pb + 2AgNO₃ → Pb(NO₃)₂ + 2Ag" }, Cu: { AgNO3: "Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag" } }[m]?.[sk] || ""; };
  const reacts = (m, sk) => MET[m].r > MET[SALT[sk].m].r;

  C3.scenes.metalReactivity = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.8, fov: 36, free: true, cam: [[1.2, 2.0, 5.6], [1.35, 1.2, 0]],
    values: { mode: "react", metal: "Mg", reagent: "acid", salt: "CuSO4" },
    state: () => ({ t: 0, run: false, flash: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Experiment", options: [{ value: "react", label: "Metal + water / steam / dilute acid" }, { value: "disp", label: "Displacement: metal in a salt solution" }] },
        { type: "select", key: "metal", label: "Metal", options: Object.keys(MET).map((k) => ({ value: k, label: MET[k].n + " (" + k + ")" })) },
        { type: "select", key: "reagent", label: "Reagent", options: [{ value: "water", label: "Cold water" }, { value: "steam", label: "Steam (heated)" }, { value: "acid", label: "Dilute hydrochloric acid" }] },
        { type: "select", key: "salt", label: "Salt solution", options: Object.keys(SALT).map((k) => ({ value: k, label: SALT[k].name.charAt(0).toUpperCase() + SALT[k].name.slice(1) + " (" + SALT[k].f + ")" })) },
        { type: "button", label: "Add the metal / start", action: (S, s) => { s.t = 0; s.run = true; s.flash = 0; } },
        { type: "button", label: "Fresh tube", cls: "secondary", action: (S, s) => { s.t = 0; s.run = false; s.flash = 0; } },
      ];
    },
    views: [{ label: "Test tube", cam: [[1.2, 2.0, 5.6], [1.35, 1.2, 0]] }, { label: "Close up", cam: [[0.6, 1.2, 3.8], [0.9, 0.9, 0]] }],
    note: "The reactivity series ranks metals by how readily they lose electrons to form positive ions: K > Na > Ca > Mg > Al > Zn > Fe > Pb > (H) > Cu > Ag. A metal above hydrogen displaces it from water, steam or dilute acid (more vigorously the higher it is), and a more reactive metal displaces a less reactive one from a solution of its salt: Zn + CuSO₄ → ZnSO₄ + Cu. A metal below the other in the series cannot displace it. Sodium and potassium are shown in water only as a demonstration: never add them to acid.",
    onChange(S, s, c, key) { s.t = 0; s.run = false; s.flash = 0; },
    reset(S, s, c) { Object.assign(c, { mode: "react", metal: "Mg", reagent: "acid", salt: "CuSO4" }); s.t = 0; s.run = false; },
    table(s, c) {
      if (c.mode === "disp") { const ms = ["Mg", "Al", "Zn", "Fe", "Pb", "Cu"], ss = Object.keys(SALT); return '<table class="c3-table"><tr><th style="text-align:left">strip ↓ / solution →</th>' + ss.map((k) => "<th>" + SALT[k].f + "</th>").join("") + "</tr>" + ms.map((m) => '<tr class="' + (m === c.metal ? "ok" : "") + '"><td style="text-align:left">' + MET[m].n + "</td>" + ss.map((k) => "<td>" + (m === SALT[k].m ? "-" : reacts(m, k) ? "✓" : "✗") + "</td>").join("") + "</tr>").join("") + "</table>"; }
      return '<table class="c3-table"><tr><th style="text-align:left">Metal</th><th>cold water</th><th>steam</th><th>dil. HCl</th></tr>' + Object.keys(MET).map((m) => '<tr class="' + (m === c.metal ? "ok" : "") + '"><td style="text-align:left">' + MET[m].n + "</td>" + ["water", "steam", "acid"].map((r) => "<td>" + (R[r][m][0] > 0 ? (R[r][m][0] >= 0.8 ? "vigorous" : R[r][m][0] >= 0.3 ? "moderate" : "slow") : "none") + "</td>").join("") + "</tr>").join("") + "</table>";
    },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; s.m4 = new T.Matrix4(); s.cl = new T.Color(); S.mk.box(7, 0.1, 3, M.matte(0x2a2e36, 0.7), 1.4, -0.05, 0); S.mk.rbox(1.7, 0.2, 1.1, 0.05, M.matte(0x7a5330, 0.55), 0, 0.1, 0);
      /* vertical tube */
      s.tube = K.vessel("testtube"); s.tube.group.position.set(0, 0.2, 0); s.liq = s.tube.addLiquid({ color: [214, 232, 246], opacity: 0.5 }); s.liq.setVolume(10);
      s.bub = K.bubbles(s.tube, s.liq, { n: 90, x: 0, z: 0, baseY: 0.6, spread: 0.3 }); s.ppt = K.precipitate(s.tube, s.liq, { n: 500, size: 0.08, color: 0xf6f6f2 });
      s.piece = new T.Mesh(new T.SphereGeometry(0.09, 20, 14), M.steel()); s.piece.position.set(0, 3.6, 0); S.scene.add(s.piece);
      s.strip = new T.Mesh(new T.BoxGeometry(0.1, 1.5, 0.02), M.steel()); S.scene.add(s.strip); s.dep = new T.Mesh(new T.BoxGeometry(0.11, 1.1, 0.05), new T.MeshStandardMaterial({ color: 0xc2703d, roughness: 0.7 })); S.scene.add(s.dep);
      s.dpts = new T.InstancedMesh(new T.OctahedronGeometry(0.035), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.6 }), 80); s.dpts.frustumCulled = false; S.scene.add(s.dpts); s.dd = []; for (let i = 0; i < 80; i++) s.dd.push({ a: Math.random() * 6.28, y: Math.random(), r: 0.04 + Math.random() * 0.04, s: 0.6 + Math.random() * 0.8 });
      s.fl = K.flame({ h: 3, r: 0.4 }); s.fl.group.visible = false; S.scene.add(s.fl.group); s.glowL = S.mk.soft(0xc08cff, 1.1, 0, 0, 0, 0); S.scene.remove(s.glowL); S.scene.add(s.glowL);
      /* steam rig: tilted tube with wet wool and metal, heated by a Bunsen */
      s.rig = new T.Group(); s.tube2 = K.vessel("testtube", { noAdd: true }); s.rig.add(s.tube2.group); s.wool = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.4, 14), new T.MeshStandardMaterial({ color: 0xd8d4c8, roughness: 1 })); s.wool.position.y = 0.3; s.rig.add(s.wool); s.met2 = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.35, 12), M.steel()); s.met2.position.y = 1.0; s.rig.add(s.met2);
      s.rig.position.set(-0.6, 2.6, 0); s.rig.rotation.z = -1.42; S.scene.add(s.rig);
      s.bunsen = K.bunsen({ x: 0.45, z: 0, flameH: 3 }); s.bunsen.setAir(1); s.bunsen.setGas(0); s.stand = S.mk.rod(V3(-0.8, 0, -0.5), V3(-0.8, 3.2, -0.5), 0.04, M.steel()); S.scene.remove(s.stand); S.scene.add(s.stand);
      s.stm = new T.InstancedMesh(new T.SphereGeometry(0.045, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }), 40); s.stm.frustumCulled = false; S.scene.add(s.stm); s.sdd = []; for (let i = 0; i < 40; i++) s.sdd.push({ u: Math.random() });
      s.flash = S.mk.soft(0xffffff, 2.6, 0, 0, 0, 0); S.scene.remove(s.flash); S.scene.add(s.flash);
    },
    update(S, s, c, dt) {
      const react = c.mode === "react", steam = react && c.reagent === "steam", vert = !steam;
      if (s.run && dt > 0) s.t = Math.min(1, s.t + dt / 7); const t = s.t, M_ = MET[c.metal];
      s.tube.group.visible = vert; s.rig.visible = steam; s.bunsen.visible = steam; s.stand.visible = steam; s.piece.visible = react && !steam; s.strip.visible = !react; s.dep.visible = !react; s.dpts.visible = !react; s.stm.visible = steam; s.fl.group.visible = false;
      s.glowL.material.opacity = 0; s.flash.material.opacity = 0;
      let rate = 0, bub = 0, ppt = 0, solCol = [214, 232, 246];
      if (react && !steam) {
        const r = c.reagent, d = R[r][c.metal], rt = d[0]; s.dd.forEach(() => {}); const run = s.run || t > 0;
        /* piece motion */
        const fall = clamp(t * 12, 0, 1), top = 3.6, surf = 0.2 + s.liq.level * CM, floats = r === "water" && (c.metal === "K" || c.metal === "Na");
        let y = lerp(top, floats ? surf + 0.02 : 0.45 + 0.1, fall), x = 0; if (floats && fall >= 1) x = 0.25 * Math.sin(S.t * 3.1 + 1) * clamp(rt, 0.3, 1);
        if (r === "acid" && rt > 0 && fall >= 1) y = 0.45 + 0.05 * Math.sin(S.t * 5) * rt; s.piece.position.set(x, run ? y : top, 0);
        const life = rt > 0 ? clamp(1 - t * (0.15 + rt * 1.0) * (rt >= 0.8 ? 1.0 : 0.8), 0.05, 1) : 1; const keep = (c.metal === "K" || c.metal === "Na") ? Math.max(0.04, life) : Math.max(0.12, rt > 0.3 ? life : 1 - 0.3 * rt * t);
        s.piece.scale.setScalar(run ? keep : 1); s.piece.material.color.setHex(M_.c); s.piece.material.metalness = 0.85;
        const act = run && fall >= 1 && rt > 0 && keep > 0.08 ? 1 : 0; bub = act * rt * 70; if (c.metal === "K" && act) { s.glowL.material.opacity = 0.7; s.glowL.position.set(s.piece.position.x, s.piece.position.y + 0.12, 0); s.glowL.scale.setScalar(0.8 + 0.2 * Math.sin(S.t * 30)); }
        if (r === "water" && c.metal === "Ca") ppt = clamp(t * 1.6, 0, 0.8) * (rt > 0 ? 1 : 0); if (r === "acid" && c.metal === "Pb") ppt = clamp(t, 0, 0.3); if (r === "acid" && c.metal === "Fe") solCol = mixc([214, 232, 246], [196, 228, 196], clamp(t * 1.6, 0, 1)); s.liq.setColor(solCol, 0.55);
        s.liq.setVolume(10); s.rate = rt;
      } else if (steam) {
        const d = R.steam[c.metal], rt = d[0], run = s.run || t > 0; s.met2.material.color.setHex(M_.c); const heat = run ? clamp(t * 3, 0, 1) : 0; s.bunsen.setGas(run ? 0.8 : 0); s.bunsen.flame.update(S.t); const glow = heat * Math.min(1, rt * 1.4);
        s.met2.material.emissive = new T.Color(1, 0.35 * glow, 0.05); s.met2.material.emissiveIntensity = glow * (c.metal === "Mg" ? 0.2 + 0.8 * Math.max(0, Math.sin(S.t * 12) * 0.5 + 0.5) : 1.0);
        const mp = new T.Vector3(); s.met2.getWorldPosition(mp); if (c.metal === "Mg" && rt > 0 && run && t > 0.25 && t < 0.8) { s.flash.position.copy(mp); s.flash.material.opacity = 0.9; s.flash.scale.setScalar(1.8 + 0.5 * Math.sin(S.t * 25)); }
        if (t > 0.8 && rt > 0) s.met2.material.color.setHex(c.metal === "Fe" ? 0x1a1a1c : 0xf2f2ee); else s.met2.material.color.setHex(M_.c); if (rt === 0) s.met2.material.emissiveIntensity = 0;
        s.sdd.forEach((q, i) => { q.u = (q.u + dt * 0.6) % 1; const on = run && i < 36; const x0 = -0.62 + 0.35 + q.u * 0.55, wy = 2.6 + 0.0; if (!on) s.m4.makeScale(0, 0, 0); else s.m4.makeTranslation(-0.6 + 0.12 + q.u * 0.9, 2.6 - 0.02 + 0.03 * Math.sin(S.t * 10 + i), 0.02 * Math.sin(i)); s.stm.setMatrixAt(i, s.m4); }); s.stm.instanceMatrix.needsUpdate = true; s.rate = rt;
        s.bunsen.position.x = -0.6 + 0.9 * Math.sin(1.42) * 0.0 + 0.43;
      } else {
        const sk = SALT[c.salt], ok = reacts(c.metal, c.salt) && c.metal !== sk.m, run = s.run || t > 0;
        s.strip.position.set(0, run ? lerp(3.4, 1.35, clamp(t * 10, 0, 1)) : 3.4, 0); s.strip.material.color.setHex(M_.c); const p = ok ? clamp((t - 0.1) / 0.85, 0, 1) : 0;
        s.dep.position.copy(s.strip.position); s.dep.position.y -= 0.18; s.dep.position.z = 0; s.dep.material.color.setHex(sk.dep); s.dep.scale.set(1 + 0.8 * p, 1, 1 + 0.4 * p); s.dep.visible = ok && p > 0.02; s.dep.material.opacity = 1;
        const endCol = ion(c.metal, sk); solCol = mixc(sk.col, endCol, p); s.liq.setColor(solCol, 0.6); s.liq.setVolume(10); s.rate = ok ? 1 : 0;
        const nD = Math.floor(80 * p); s.dd.forEach((q, i) => { if (i >= nD || !ok) s.m4.makeScale(0, 0, 0); else { s.m4.makeScale(q.s * (c.salt === "AgNO3" || c.salt === "PbNO3" ? 2.4 : 1), q.s * (c.salt === "AgNO3" || c.salt === "PbNO3" ? 3.5 : 1), q.s); s.m4.setPosition(Math.cos(q.a) * q.r * (1 + p) + 0.07 * (i % 2 ? 1 : -1) * 0, s.strip.position.y - 0.7 + q.y * 1.1, Math.sin(q.a) * q.r * 0.6); } s.dpts.setMatrixAt(i, s.m4); }); s.dpts.instanceMatrix.needsUpdate = true; s.dpts.material.color.setHex(sk.dep);
        bub = 0; s.ok = ok;
      }
      s.liq.update(S.t); s.bub.rate = bub; s.bub.update(dt, S.t); s.ppt.amount = ppt; s.ppt.update(dt);
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); const px = w - 250, run = s.run || s.t > 0; ctx.textAlign = "left";
      /* reactivity ladder */
      H.panel(ctx, px, 58, 240, 154); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Reactivity series (most reactive at top)", px + 8, 72);
      const sel = new Set([c.metal]); if (c.mode === "disp") sel.add(SALT[c.salt].m);
      ORDER.forEach((k, i) => { const y = 82 + i * 11.4, col = k === "H" ? "#9fb2d2" : "#e8f0ff", isSel = sel.has(k); const bw = (k === "H" ? 5.5 : MET[k].r) * 13; ctx.fillStyle = isSel ? (k === c.metal ? "#ffd27a" : "#7dd3ff") : "rgba(143,180,255,0.22)"; ctx.fillRect(px + 40, y - 7, bw, 8); ctx.fillStyle = isSel ? "#fff" : col; ctx.font = (isSel ? "600 " : "") + "9px 'IBM Plex Mono',monospace"; ctx.fillText(k === "H" ? "(H)" : k, px + 8, y); if (k !== "H") { ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText(MET[k].n, px + 44 + bw, y); } });
      H.panel(ctx, px, 218, 240, 74); ctx.font = "9px 'IBM Plex Mono',monospace";
      if (c.mode === "react") { const d = R[c.reagent][c.metal]; H.pill(ctx, 10, 22, MET[c.metal].n + " + " + { water: "cold water", steam: "steam", acid: "dilute HCl" }[c.reagent], "#ffe9b8", 11); H.pill(ctx, 10, 44, d[0] === 0 ? "no reaction" : d[0] >= 0.8 ? "vigorous reaction" : d[0] >= 0.3 ? "moderate reaction" : "slow reaction", d[0] === 0 ? "#cbd6e8" : "#8dffb8", 10); ctx.fillStyle = "#e8f0ff"; ctx.fillText(d[2], px + 8, 232); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; if (run && s.t > 0.35) wrapT(ctx, d[1], px + 8, 246, 224, 10.5); else ctx.fillText("Press “Add the metal / start”.", px + 8, 246); }
      else { const sk = SALT[c.salt], ok = s.ok; H.pill(ctx, 10, 22, MET[c.metal].n + " in " + sk.name + " solution", "#ffe9b8", 11); H.pill(ctx, 10, 44, c.metal === sk.m ? "same metal: nothing to displace" : ok ? MET[c.metal].n + " is above " + MET[sk.m].n.toLowerCase() + ": it displaces it" : MET[c.metal].n + " is below " + MET[sk.m].n.toLowerCase() + ": no reaction", ok ? "#8dffb8" : "#cbd6e8", 10); ctx.fillStyle = "#e8f0ff"; wrapT(ctx, ok ? dispEq(c.metal, c.salt) : "no reaction", px + 8, 232, 224, 11); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; if (ok && run && s.t > 0.4) wrapT(ctx, "coating of " + sk.depn + (ION[c.metal] && sk.col[2] < 240 && sk.col[0] < 150 ? "; the blue colour fades" : "") + ".", px + 8, 250, 224, 10.5); else if (!ok && run && s.t > 0.4) ctx.fillText("no change in the strip or the solution.", px + 8, 250); }
      ctx.restore();
    },
    readouts(s, c) {
      if (c.mode === "react") { const d = R[c.reagent][c.metal]; return [["Metal", MET[c.metal].n + ", position " + (11 - MET[c.metal].r) + " from the top (rank " + MET[c.metal].r + " of 10)"], ["Reagent", { water: "cold water", steam: "steam", acid: "dilute hydrochloric acid" }[c.reagent]], ["Reactivity", d[0] === 0 ? "none" : d[0] >= 0.8 ? "vigorous" : d[0] >= 0.3 ? "moderate" : "slow"], ["Observation", d[1]], ["Equation", d[2]], ["Rule", "a metal above hydrogen displaces H₂ from steam / dilute acid; only the most reactive (K, Na, Ca) react with cold water"]]; }
      const sk = SALT[c.salt], ok = reacts(c.metal, c.salt) && c.metal !== sk.m; return [["Strip", MET[c.metal].n], ["Solution", sk.name + " (" + sk.f + ")"], ["Reaction", c.metal === sk.m ? "same metal" : ok ? "displacement occurs" : "no reaction"], ["Equation", ok ? dispEq(c.metal, c.salt) : "none"], ["Rule", "a more reactive metal displaces a less reactive metal from its salt solution"]];
    },
    steps(s, c) { return [["Choose the metal and reagent (or salt)", "done"], ["Press start and watch the strip or the metal", s.t > 0 ? "done" : "now"], ["Compare the vigour with the series ladder", s.t > 0.6 ? "done" : ""], ["Try another metal and rank them yourself", ""]]; },
  };
  function ion(metal, sk) { const r = ION[metal]; return r || [214, 232, 246]; }
})();
