/* c3d-empirical.js — chemistry 3D, new module: empirical and molecular formulae by combustion analysis */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const AR = { C: 12.011, H: 1.008, O: 15.999 }, MCO2 = 44.009, MH2O = 18.015;
  const CMP = {
    ethanol: { n: "ethanol", f: [2, 6, 1], hid: 0 }, glucose: { n: "glucose", f: [6, 12, 6], hid: 0 }, propane: { n: "propane", f: [3, 8, 0], hid: 0 },
    butane: { n: "butane", f: [4, 10, 0], hid: 0 }, benzene: { n: "benzene", f: [6, 6, 0], hid: 0 }, ethanoic: { n: "ethanoic acid", f: [2, 4, 2], hid: 0 }, ethene: { n: "ethene", f: [2, 4, 0], hid: 0 },
    uA: { n: "Unknown A", f: [4, 8, 2], hid: 1 }, uB: { n: "Unknown B", f: [6, 6, 0], hid: 1 }, uC: { n: "Unknown C", f: [4, 10, 0], hid: 1 },
  };
  const sub = (n) => String(n).replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[d]);
  const formula = (f) => "C" + (f[0] > 1 ? sub(f[0]) : "") + "H" + (f[1] > 1 ? sub(f[1]) : "") + (f[2] ? "O" + (f[2] > 1 ? sub(f[2]) : "") : "");
  const molM = (f) => f[0] * AR.C + f[1] * AR.H + f[2] * AR.O;
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  function analyse(c) {
    const cp = CMP[c.cp], f = cp.f, M = molM(f), m = c.m, nmol = m / M;
    const mCO2 = nmol * f[0] * MCO2, mH2O = nmol * f[1] / 2 * MH2O;
    const mC = mCO2 * AR.C / MCO2, mH = mH2O * 2 * AR.H / MH2O, mO = Math.max(0, m - mC - mH);
    const mol = { C: mC / AR.C, H: mH / AR.H, O: mO / AR.O }; if (mol.O * AR.O < 0.002 * m) mol.O = 0;
    const els = ["C", "H", "O"].filter((e) => mol[e] > 1e-9), mn = Math.min.apply(null, els.map((e) => mol[e])), ratio = {}; els.forEach((e) => (ratio[e] = mol[e] / mn));
    let k = 1; for (let t = 1; t <= 8; t++) { if (els.every((e) => Math.abs(ratio[e] * t - Math.round(ratio[e] * t)) < 0.06 * t + 0.03)) { k = t; break; } }
    const emp = [Math.round((ratio.C || 0) * k), Math.round((ratio.H || 0) * k), Math.round((ratio.O || 0) * k)], Memp = molM(emp), mult = Math.max(1, Math.round(M / Memp));
    return { f, M, mCO2, mH2O, mC, mH, mO, mol, ratio, els, k, emp, Memp, mult, mf: emp.map((v) => v * mult) };
  }
  C3.scenes.empiricalFormula = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.85, fov: 36, free: true, cam: [[1.2, 2.4, 8.8], [1.2, 1.3, 0]],
    values: { cp: "ethanol", m: 1.0 },
    state: () => ({ t: 0, burning: false, done: false, flow: [] }),
    get controls() {
      return [
        { type: "select", key: "cp", label: "Compound to analyse", options: Object.keys(CMP).map((k) => ({ value: k, label: CMP[k].hid ? CMP[k].n + " (mystery)" : CMP[k].n + " (" + formula(CMP[k].f) + ")" })) },
        { type: "range", key: "m", label: "Mass of sample (g)", min: 0.2, max: 2.0, step: 0.05, unit: " g" },
        { type: "button", label: "Burn the sample in excess oxygen", action: (S, s) => { s.t = 0; s.burning = true; s.done = false; } },
        { type: "button", label: "Reset the apparatus", cls: "secondary", action: (S, s) => { s.t = 0; s.burning = false; s.done = false; } },
      ];
    },
    views: [{ label: "Bench", cam: [[1.2, 2.4, 8.8], [1.2, 1.3, 0]] }, { label: "Furnace", cam: [[-0.8, 1.8, 5.2], [-0.6, 1.1, 0]] }],
    note: "Combustion analysis: a weighed sample is burned in a stream of excess oxygen. CaCl₂ absorbs the water, and soda lime (or NaOH) absorbs the carbon dioxide, so the mass gain of each tube gives the products. Mass of C = m(CO₂) × 12.0/44.0. Mass of H = m(H₂O) × 2.02/18.0. Oxygen is found by difference. Divide each mass by Ar to get moles, divide by the smallest, and multiply to whole numbers: that is the empirical formula. Molecular formula = empirical formula × (M ÷ M of the empirical formula), with M from a mass spectrum. The empirical formula alone cannot tell glucose (CH₂O)₆ from ethanoic acid (CH₂O)₂.",
    onChange(S, s, c) { s.t = 0; s.burning = false; s.done = false; },
    reset(S, s, c) { Object.assign(c, { cp: "ethanol", m: 1.0 }); s.t = 0; s.burning = false; s.done = false; },
    table(s, c) {
      const a = analyse(c), rows = a.els.map((e) => "<tr><td>" + e + "</td><td>" + (e === "C" ? a.mC : e === "H" ? a.mH : a.mO).toFixed(4) + "</td><td>" + AR[e] + "</td><td>" + a.mol[e].toFixed(4) + "</td><td>" + a.ratio[e].toFixed(2) + "</td><td>" + Math.round(a.ratio[e] * a.k) + "</td></tr>").join("");
      return '<table class="c3-table"><tr><th>element</th><th>mass / g</th><th>Ar</th><th>moles</th><th>÷ smallest</th><th>whole numbers</th></tr>' + rows + '</table><div style="font:12px/1.5 IBM Plex Mono;color:#7dffbd">Empirical formula ' + formula(a.emp) + " (M = " + a.Memp.toFixed(1) + "). Molar mass " + a.M.toFixed(1) + " g/mol → × " + a.mult + " → molecular formula " + formula(a.mf) + "</div>";
    },
    build(S, s, c) {
      S.mk.box(8.4, 0.12, 3.4, M.matte(0x1d222b, 0.7), 1.0, -0.06, 0); s.softTex = U.softDot(64, "rgba(255,255,255,1)");
      const tube = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 2.0, 32, 1, true), new T.MeshPhysicalMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.25, roughness: 0.05, side: T.DoubleSide, depthWrite: false })); tube.rotation.z = Math.PI / 2; tube.position.set(-1.3, 1.1, 0); S.scene.add(tube);
      s.heater = new T.Mesh(new T.CylinderGeometry(0.46, 0.46, 1.0, 28), new T.MeshStandardMaterial({ color: 0x3a2a24, emissive: 0xff4a10, emissiveIntensity: 0.0, roughness: 0.6, transparent: true, opacity: 0.55, depthWrite: false })); s.heater.rotation.z = Math.PI / 2; s.heater.position.set(-1.3, 1.1, 0); S.scene.add(s.heater);
      S.mk.box(0.9, 0.55, 0.7, M.matte(0x2f343d, 0.6), -1.3, 0.28, 0); S.mk.box(0.14, 0.9, 0.3, M.steel(), -2.15, 0.45, 0); S.mk.box(0.14, 0.9, 0.3, M.steel(), -0.45, 0.45, 0);
      s.boat = S.mk.box(0.26, 0.05, 0.14, M.ceramic ? M.ceramic(0xe8e4dc) : M.matte(0xe8e4dc, 0.5), -1.3, 0.84, 0); s.smp = S.mk.sphere(0.07, M.matte(0xf3ecdc, 0.6), -1.3, 0.92, 0); s.smp.scale.y = 0.6;
      s.fl = new T.Sprite(new T.SpriteMaterial({ map: s.softTex, color: 0xffa040, transparent: true, depthWrite: false, opacity: 0, blending: T.AdditiveBlending })); s.fl.scale.set(0.7, 0.5, 1); s.fl.position.set(-1.3, 1.0, 0.0); S.scene.add(s.fl);
      /* absorption tubes (U-tubes drawn as two limbs) and pipework */
      const limb = (x, col) => { const g = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 1.2, 20, 1, true), new T.MeshPhysicalMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.25, roughness: 0.05, side: T.DoubleSide, depthWrite: false })); g.position.set(x, 0.7, 0); S.scene.add(g); const fill = new T.Mesh(new T.CylinderGeometry(0.17, 0.17, 0.9, 16), M.matte(col, 0.8)); fill.position.set(x, 0.55, 0); S.scene.add(fill); return fill; };
      s.f1a = limb(0.2, 0xf4f4f0); s.f1b = limb(0.65, 0xf4f4f0); s.f2a = limb(1.45, 0xcfd6dc); s.f2b = limb(1.9, 0xcfd6dc);
      S.mk.rod(V3(0.2, 0.05, 0), V3(0.65, 0.05, 0), 0.05, M.matte(0xdff0ff, 0.1)); S.mk.rod(V3(1.45, 0.05, 0), V3(1.9, 0.05, 0), 0.05, M.matte(0xdff0ff, 0.1));
      const pipe = (a, b) => S.mk.rod(V3(a[0], a[1], a[2]), V3(b[0], b[1], b[2]), 0.045, M.matte(0xbcd0e0, 0.15));
      pipe([-0.3, 1.1, 0], [0.2, 1.1, 0]); pipe([0.2, 1.1, 0], [0.2, 1.3, 0]); pipe([0.65, 1.3, 0], [1.45, 1.3, 0]); pipe([0.65, 1.1, 0], [0.65, 1.3, 0]); pipe([1.45, 1.3, 0], [1.45, 1.1, 0]); pipe([1.9, 1.3, 0], [1.9, 1.0, 0]);
      pipe([-2.3, 1.1, 0], [-2.3, 1.1, 0]);
      s.dots = new T.InstancedMesh(new T.SphereGeometry(0.04, 8, 6), new T.MeshBasicMaterial({ color: 0xbfe6ff }), 30); s.dots.frustumCulled = false; S.scene.add(s.dots); s.m4 = new T.Matrix4(); s.tp = Array.from({ length: 30 }, (_, i) => i / 30);
    },
    update(S, s, c, dt) {
      const a = analyse(c); if (s.burning && dt > 0) { s.t += dt / 6; if (s.t >= 1) { s.t = 1; s.burning = false; s.done = true; } }
      const k = s.t, ease = k * k * (3 - 2 * k), heat = s.burning ? 1 : s.done ? Math.max(0, 1) * 0.15 : 0;
      s.heater.material.emissiveIntensity = (s.burning ? 1.4 : s.done ? 0.1 : 0) * (0.85 + 0.15 * Math.sin(S.t * 14)); s.fl.material.opacity = s.burning ? 0.7 * (1 - k * 0.5) * (0.8 + 0.2 * Math.sin(S.t * 20)) : 0;
      s.smp.scale.setScalar(s.burning || s.done ? Math.max(0.01, 1 - 1.0 * ease) : 1); s.smp.visible = s.smp.scale.x > 0.03; s.smp.scale.y = 0.6 * s.smp.scale.x;
      s.gH2O = a.mH2O * ease; s.gCO2 = a.mCO2 * ease; const t1 = clamp(s.gH2O / 1.2, 0, 1), t2 = clamp(s.gCO2 / 3.5, 0, 1);
      s.f1a.material.color.setRGB(0.96 - 0.1 * t1, 0.96 - 0.05 * t1, 0.94); s.f2a.material.color.setRGB(0.81 - 0.05 * t2, 0.84, 0.86); s.f1a.scale.y = 1 - 0.15 * t1; s.f2a.scale.y = 1 - 0.15 * t2;
      const m4 = s.m4; let n = 0; const path = [[-2.3, 1.1], [-0.3, 1.1], [0.2, 1.1], [0.2, 1.3], [0.65, 1.3], [1.45, 1.3], [1.45, 1.1], [1.9, 1.1]], flowing = s.burning || (c.cp && s.t > 0 && !s.done) || s.burning;
      if (s.burning || s.done) { const seg = [0]; for (let i = 1; i < path.length; i++) seg.push(seg[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1])); const L = seg[seg.length - 1]; s.tp.forEach((u, i) => { if (dt > 0) s.tp[i] = (u + dt * (s.burning ? 0.22 : 0.05)) % 1; const d = s.tp[i] * L; let j = 1; while (j < seg.length - 1 && seg[j] < d) j++; const f = (d - seg[j - 1]) / (seg[j] - seg[j - 1]); m4.makeTranslation(path[j - 1][0] + (path[j][0] - path[j - 1][0]) * f, path[j - 1][1] + (path[j][1] - path[j - 1][1]) * f, 0); s.dots.setMatrixAt(n++, m4); }); }
      s.dots.count = n; s.dots.instanceMatrix.needsUpdate = true; s.a = a;
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250, cp = CMP[c.cp], a = s.a || analyse(c), show = s.done;
      H.pill(ctx, 10, 22, "Combustion analysis of " + (cp.hid && !show ? cp.n : cp.n + (cp.hid ? " (" + formula(cp.f) + ")" : "")), "#ffe9b8", 11);
      H.pill(ctx, 10, 44, s.done ? "complete: calculate the formula from the mass gains" : s.burning ? "burning in excess O₂ ..." : "press ‘Burn the sample’", "#9fe3ff", 10);
      const lab = (x, y, t, col) => { const q = S.proj(V3(x, y, 0)); H.pill(ctx, q.x, q.y, t, col || "#bcd0ea", 8, "center"); };
      lab(-1.3, 1.85, "sample " + c.m.toFixed(2) + " g, furnace", "#ffe9b8"); lab(-2.2, 0.4, "O₂ in →", "#bcd0ea"); lab(0.35, 1.75, "CaCl₂ → H₂O", "#9fe3ff"); lab(1.8, 1.75, "soda lime → CO₂", "#ffb27a");
      lab(0.45, -0.25, "+" + (s.gH2O || 0).toFixed(3) + " g", "#9fe3ff"); lab(1.7, -0.25, "+" + (s.gCO2 || 0).toFixed(3) + " g", "#ffb27a");
      H.panel(ctx, px, 58, 240, 108); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Mass gains (g)", px + 8, 73); ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#9fe3ff"; ctx.fillText("H₂O tube: " + (s.gH2O || 0).toFixed(3), px + 8, 90); ctx.fillStyle = "#ffb27a"; ctx.fillText("CO₂ tube: " + (s.gCO2 || 0).toFixed(3), px + 8, 105);
      ctx.fillStyle = "#e8f0ff"; ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillText("m(C) = m(CO₂) × 12.011/44.009", px + 8, 124); ctx.fillText("m(H) = m(H₂O) × 2.016/18.015", px + 8, 137); ctx.fillText("m(O) = m(sample) − m(C) − m(H)", px + 8, 150);
      H.panel(ctx, px, 172, 240, 128); ctx.font = "600 9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("el    mass/g   moles    ratio  whole", px + 8, 187); ctx.font = "9px 'IBM Plex Mono',monospace";
      if (show) { a.els.forEach((e, i) => { ctx.fillStyle = "#e8f0ff"; const y = 202 + i * 14; ctx.fillText(e, px + 8, y); ctx.fillText((e === "C" ? a.mC : e === "H" ? a.mH : a.mO).toFixed(3), px + 36, y); ctx.fillText(a.mol[e].toFixed(4), px + 92, y); ctx.fillText(a.ratio[e].toFixed(2), px + 150, y); ctx.fillStyle = "#ffd27a"; ctx.fillText(String(Math.round(a.ratio[e] * a.k)), px + 200, y); });
        ctx.fillStyle = "#8dffb8"; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillText("empirical: " + formula(a.emp) + "  (M = " + a.Memp.toFixed(1) + ")", px + 8, 252); ctx.fillText("M = " + a.M.toFixed(1) + " → × " + a.mult + " = " + formula(a.mf), px + 8, 268); if (cp.hid) { ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText("answer: " + formula(cp.f), px + 8, 284); } }
      else { ctx.fillStyle = "#9fb2d2"; ctx.font = "8.8px 'IBM Plex Mono',monospace"; wrapT(ctx, "burn the sample to fill in the table: mass of each element, moles (÷ Ar), divide by the smallest, make whole numbers", px + 8, 204, 224, 11); }
      ctx.restore();
    },
    readouts(s, c) {
      const a = s.a || analyse(c); if (!s.done) return [["Sample", c.m.toFixed(2) + " g"], ["H₂O absorbed", (s.gH2O || 0).toFixed(3) + " g"], ["CO₂ absorbed", (s.gCO2 || 0).toFixed(3) + " g"], ["Method", "mass gains → mass of C and H → O by difference"]];
      return [["m(CO₂)", a.mCO2.toFixed(3) + " g"], ["m(H₂O)", a.mH2O.toFixed(3) + " g"], ["m(C), m(H), m(O)", a.mC.toFixed(3) + ", " + a.mH.toFixed(3) + ", " + a.mO.toFixed(3) + " g"], ["Simplest ratio", a.els.map((e) => e + Math.round(a.ratio[e] * a.k)).join(" : ")], ["Empirical formula", formula(a.emp)], ["Molecular formula", formula(a.mf) + " (M = " + a.M.toFixed(1) + ")"]];
    },
    steps(s, c) { return [["Weigh the sample and set up the combustion train", "done"], ["Burn in excess oxygen and read the mass gains", s.done ? "done" : "now"], ["Work out mass of C, H and O", s.done ? "now" : ""], ["Moles → ratio → empirical formula, then × (M ÷ M(emp))", ""]]; },
  };
})();
