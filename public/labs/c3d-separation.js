/* c3d-separation.js — chemistry 3D, batch D (part 2): separation techniques — simple & fractional distillation (ethanol–water), paper chromatography */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, TAU = Math.PI * 2, CM = C3.CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  /* ethanol–water vapour–liquid data at 1 atm (mole fraction of ethanol in liquid x, in vapour y, boiling point °C) — approximate textbook values */
  const X = [0, 0.019, 0.0721, 0.0966, 0.1238, 0.1661, 0.2337, 0.2608, 0.3273, 0.3965, 0.5079, 0.5732, 0.6763, 0.7472, 0.8943, 1];
  const Y = [0, 0.17, 0.3891, 0.4375, 0.4704, 0.5089, 0.5445, 0.558, 0.5826, 0.6122, 0.6564, 0.6841, 0.7385, 0.7815, 0.8943, 1];
  const TB = [100, 95.5, 89, 86.7, 85.3, 84.1, 82.7, 82.3, 81.5, 80.7, 79.8, 79.3, 78.74, 78.41, 78.15, 78.3];
  const itp = (xs, ys, x) => { x = clamp(x, 0, 1); let i = 0; while (i < xs.length - 2 && x > xs[i + 1]) i++; return lerp(ys[i], ys[i + 1], (x - xs[i]) / (xs[i + 1] - xs[i])); };
  const yEq = (x) => itp(X, Y, x), tBoil = (x) => itp(X, TB, x), VE = 58.5, VW = 18.07;     // molar volumes, cm³/mol
  const PLATES = 4;
  const HX = -3.7, HP_Y = 0.4, XC0 = -2.9, END = V3(2.5, 1.85, 0.0), BX = 3.0;
  /* dyes for chromatography: Rf in the (water-like) solvent */
  const DYES = { yellow: { n: "yellow dye", rf: 0.86, c: [236, 196, 40] }, red: { n: "red dye", rf: 0.58, c: [208, 52, 64] }, blue: { n: "blue dye", rf: 0.29, c: [56, 90, 200] } };
  const INKS = { black: { n: "Black ink", d: ["yellow", "red", "blue"] }, green: { n: "Green ink", d: ["yellow", "blue"] }, purple: { n: "Purple ink", d: ["red", "blue"] }, orange: { n: "Orange ink", d: ["yellow", "red"] } };
  const SOLV = { water: { n: "Water", k: 1 }, eth: { n: "Ethanol", k: 1.22 } };
  const PAPER_H = 3.0, PAPER_W = 1.7, PY0 = 0.5;

  C3.scenes.separationTechniques = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[-0.3, 4.0, 12.8], [-0.3, 2.9, 0]],
    values: { mode: "simple", P: 60, eth: 30, water: 1, tap: 1, ink: "black", solv: "water", wrong: 0 },
    state: () => ({ t: 0 }),
    controls: [
      { type: "select", key: "mode", label: "Technique", options: [{ value: "simple", label: "Simple distillation (ethanol + water)" }, { value: "frac", label: "Fractional distillation (with a column)" }, { value: "chrom", label: "Paper chromatography (inks)" }] },
      { type: "range", key: "P", label: "Heating power (distillation)", min: 0, max: 100, step: 5, unit: " %" },
      { type: "range", key: "eth", label: "Ethanol in the mixture (distillation, % by volume)", min: 10, max: 60, step: 5, unit: " %" },
      { type: "toggle", key: "water", label: "Cooling water through the condenser" },
      { type: "button", label: "Change receiver (collect a new fraction)", action: (S, s, c) => newFraction(s) },
      { type: "button", label: "Fresh mixture (restart distillation)", action: (S, s, c) => initDist(s, c), cls: "secondary" },
      { type: "select", key: "ink", label: "Ink (chromatography)", options: Object.keys(INKS).map((k) => ({ value: k, label: INKS[k].n })) },
      { type: "select", key: "solv", label: "Solvent (chromatography)", options: Object.keys(SOLV).map((k) => ({ value: k, label: SOLV[k].n })) },
      { type: "toggle", key: "wrong", label: "Mistake: ink line below the solvent level" },
      { type: "button", label: "Start a new chromatogram", action: (S, s, c) => initChrom(s, c) },
    ],
    views: [{ label: "Apparatus", cam: [[-0.3, 4.0, 12.8], [-0.3, 2.9, 0]] }, { label: "Flask + column", cam: [[-3.4, 2.2, 6.8], [-3.6, 1.6, 0]] }, { label: "Condenser + receiver", cam: [[2.0, 1.8, 7.0], [1.2, 1.3, 0]] }],
    note: "Distillation separates liquids by boiling point: the more volatile liquid (ethanol, b.p. 78 °C) vaporises first, the vapour is cooled in the condenser (water in at the bottom, out at the top) and collects as distillate. A fractionating column repeats evaporation and condensation, so the distillate is richer in ethanol — but ethanol and water form an azeotrope (about 95 % ethanol) that no column can pass. Chromatography separates substances by how far they travel with the solvent: Rf = distance moved by the spot ÷ distance moved by the solvent front.",
    onChange(S, s, c, key) { if (key === "eth") initDist(s, c); if (key === "ink" || key === "solv" || key === "wrong") initChrom(s, c); if (key === "mode") { C3.setView(S, { cam: c.mode === "chrom" ? [[0, 3.2, 8.6], [0, 2.1, 0]] : [[-0.3, 4.0, 12.8], [-0.3, 2.9, 0]] }); } },
    reset(S, s, c) { Object.assign(c, { mode: "simple", P: 60, eth: 30, water: 1, ink: "black", solv: "water", wrong: 0 }); initDist(s, c); initChrom(s, c); },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K, s.grpD = [], s.grpS = [], s.grpF = [], s.grpC = []; const reg = (arr, m) => { arr.push(m); return m; }, dark = M.matte(0x252a31, 0.5), gm = K.glassMat({ opacity: 0.1 });
      /* --- distillation --- */
      K.contact(HX, 0, 0, 5.4, 0.5); K.contact(BX, 0, 0, 4, 0.5);
      reg(s.grpD, S.mk.cyl(1.05, 1.1, 0.4, M.paint(0x2b2f36), HX, 0.2, 0)); s.ring = new T.Mesh(new T.RingGeometry(0.4, 0.95, 40), new T.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: 0, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false })); s.ring.rotation.x = -Math.PI / 2; s.ring.position.set(HX, 0.405, 0); S.scene.add(s.ring); s.grpD.push(s.ring);
      s.fl = K.flask(); s.fl.group.position.set(HX, HP_Y, 0); s.flL = s.fl.addLiquid({ color: 0xd8ecf6, opacity: 0.22 }); s.bub = K.bubbles(s.fl, s.flL, { n: 60, spread: 3 });
      s.col = reg(s.grpF, new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 1.8, 28, 1, true), gm)); s.col.position.set(HX, HP_Y + 2.1 + 0.9, 0); s.col.renderOrder = 4; S.scene.add(s.col);
      s.beads = new T.InstancedMesh(new T.SphereGeometry(0.07, 10, 8), new T.MeshPhysicalMaterial({ color: 0xcfe0ef, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.8 }), 90); s.beads.frustumCulled = false; s.grpF.push(s.beads); S.scene.add(s.beads);
      const m4 = new T.Matrix4(); for (let i = 0; i < 90; i++) { m4.makeTranslation(HX + U.rnd(-0.18, 0.18), HP_Y + 2.25 + (i / 90) * 1.6, U.rnd(-0.18, 0.18)); s.beads.setMatrixAt(i, m4); }
      s.hy = [HP_Y + 2.15, HP_Y + 4.05]; s.stillhead = reg(s.grpD, S.mk.rod(V3(HX, HP_Y + 2.15, 0), V3(HX, HP_Y + 2.45, 0), 0.12, gm)); s.th = S.mk.cyl(0.03, 0.03, 0.8, M.glass ? M.glass() : gm, HX, HP_Y + 2.5, 0); s.tc = S.mk.cyl(0.016, 0.016, 1, M.matte(0xd8242a, 0.3), HX, HP_Y + 2.2, 0);
      const mkCond = (arr, y0) => { const a = V3(HX, y0 + 0.3, 0), b = V3(XC0, y0 + 0.28, 0), c0 = V3(XC0 + 0.2, y0 + 0.25, 0); reg(arr, S.mk.rod(a, b, 0.07, gm)); const dir = END.clone().sub(c0), L = dir.length(), u = dir.clone().normalize(), p0 = c0.clone().addScaledVector(u, 0.4), p1 = END.clone().addScaledVector(u, -0.35);
        reg(arr, S.mk.rod(c0, END, 0.075, gm)); reg(arr, S.mk.rod(p0, p1, 0.2, gm)); const w = S.mk.rod(p0, p1, 0.17, new T.MeshStandardMaterial({ color: 0x4aa0ff, transparent: true, opacity: 0.28, roughness: 0.2, depthWrite: false })); arr.push(w); return { c0, u, L, w, p0, p1 }; };
      s.cS = mkCond(s.grpS, HP_Y + 2.2); s.cF = mkCond(s.grpF, HP_Y + 4.1);
      reg(s.grpD, S.mk.rod(END, V3(END.x + 0.02, END.y - 0.32, 0), 0.07, gm)); s.bk = K.beaker(); s.bk.group.position.set(BX, 0, 0); s.bL = s.bk.addLiquid({ color: 0xd8ecf6, opacity: 0.2 });
      s.pIm = new T.InstancedMesh(new T.SphereGeometry(1, 10, 8), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }), 70); s.pIm.frustumCulled = false; S.scene.add(s.pIm); s.grpD.push(s.pIm);
      s.parts = []; for (let i = 0; i < 70; i++) s.parts.push({ on: false, u: 0 });
      /* --- chromatography --- */
      s.cb = K.beaker(); s.cb.group.position.set(0, 0, 0); s.cbL = s.cb.addLiquid({ color: 0xd8ecf6, opacity: 0.2 }); s.cbL.setVolume(25); s.grpC.push(s.cb.group);
      const rod = S.mk.rod(V3(-1.2, PY0 + PAPER_H + 0.05, 0), V3(1.2, PY0 + PAPER_H + 0.05, 0), 0.04, M.steel()); s.grpC.push(rod);
      s.cv = U.cv(128, 360); s.ctx = s.cv.getContext("2d"); s.tex = new T.CanvasTexture(s.cv); s.tex.colorSpace = T.SRGBColorSpace; s.paper = new T.Mesh(new T.PlaneGeometry(PAPER_W, PAPER_H), new T.MeshStandardMaterial({ map: s.tex, roughness: 0.95, side: T.DoubleSide })); s.paper.position.set(0, PY0 + PAPER_H / 2 - 0.0, 0); s.paper.castShadow = true; S.scene.add(s.paper); s.grpC.push(s.paper);
      initDist(s, c); initChrom(s, c);
    },
    update(S, s, c, dt) {
      const D = c.mode !== "chrom"; s.grpD.forEach((m) => (m.visible = D)); s.fl.group.visible = D; s.bk.group.visible = D; s.grpF.forEach((m) => (m.visible = c.mode === "frac")); s.grpS.forEach((m) => (m.visible = c.mode === "simple")); s.grpC.forEach((m) => (m.visible = !D)); s.cb.group.visible = !D;
      s.stillhead.visible = D && c.mode === "simple"; s.th.visible = s.tc.visible = D; s.cS.w.visible = D && c.mode === "simple" && !!c.water; s.cF.w.visible = c.mode === "frac" && !!c.water;
      if (D) updDist(S, s, c, dt); else updChrom(S, s, c, dt);
    },
    overlay(ctx, s, c, w, h, S) { if (c.mode === "chrom") ovChrom(ctx, s, c, S); else ovDist(ctx, s, c, S); },
    readouts(s, c) {
      if (c.mode === "chrom") { const ink = INKS[c.ink], t = s.tc_ || 0; return [["Ink", ink.n + " (" + ink.d.map((d) => DYES[d].n).join(" + ") + ")"], ["Solvent front", (s.front * 100).toFixed(0) + " % up the paper"], ["Spots found", c.wrong ? "none — the ink washed into the solvent" : ink.d.length + " (" + ink.d.map((d) => DYES[d].n.split(" ")[0]).join(", ") + ")"], ["Rf = d(spot) ÷ d(front)", c.wrong ? "—" : ink.d.map((d) => DYES[d].n.split(" ")[0] + " " + (DYES[d].rf * SOLV[c.solv].k > 0.95 ? 0.95 : DYES[d].rf * SOLV[c.solv].k).toFixed(2)).join(" · ")], ["Pure substance?", "a pure substance gives a single spot"]]; }
      const x = s.nE / (s.nE + s.nW), Tf = s.Tf, tot = s.dE + s.dW, dv = s.dE * VE + s.dW * VW;
      return [["Flask temperature", Tf.toFixed(1) + " °C"], ["Thermometer at the still head", s.Th.toFixed(1) + " °C"], ["Mixture left in flask", (s.nE * VE + s.nW * VW).toFixed(0) + " cm³ · " + (x * 100).toFixed(0) + " mol % ethanol"], ["Boiling point of this mixture", tBoil(x).toFixed(1) + " °C (ethanol 78.3 · water 100)"], ["Distillate in the receiver", dv.toFixed(0) + " cm³ · " + (tot > 0 ? ((s.dE * VE) / dv * 100).toFixed(0) : "—") + " % ethanol by volume"], ["Theoretical plates", c.mode === "frac" ? PLATES : "1 (simple)"], ["Azeotrope limit", "≈ 95.6 % ethanol by mass"]];
    },
    steps(s, c) {
      if (c.mode === "chrom") return [["Draw a pencil baseline above the solvent level; put a small spot of ink on it", c.wrong ? "now" : "done"], ["Stand the paper in the solvent — the solvent must be below the spot", c.wrong ? "" : "done"], ["Let the solvent rise; mark the solvent front before the paper dries", s.front > 0.9 ? "done" : "now"], ["Measure the distances and calculate Rf = spot ÷ front for each dye", s.front > 0.9 ? "now" : ""]];
      return [["Pour the mixture into the flask, add anti-bumping granules, fit the thermometer at the still head", "done"], ["Turn the cooling water on: in at the bottom, out at the top", c.water ? "done" : "now"], ["Heat gently; collect the first fraction near " + (c.mode === "frac" ? "78" : "80–85") + " °C", s.dE > 0 ? "done" : "now"], ["When the thermometer rises, change the receiver for the next fraction", s.fr && s.fr.length ? "done" : s.dE > 0 ? "now" : ""], ["Never heat to dryness; stop when the temperature nears 100 °C", ""]];
    },
    table(s, c) {
      if (c.mode === "chrom" || !s.fr || !s.fr.length) return '<div style="font:12px IBM Plex Sans;color:#9fb3d1;margin:8px 0">' + (c.mode === "chrom" ? "" : "Use “Change receiver” as the thermometer reading changes to record separate fractions.") + "</div>";
      let h = '<table class="c3-table"><tr><th>Fraction</th><th>Volume (cm³)</th><th>Ethanol (% v/v)</th><th>Thermometer (°C)</th></tr>'; s.fr.forEach((f, i) => { h += "<tr><td>" + (i + 1) + "</td><td>" + f.v.toFixed(0) + "</td><td>" + f.e.toFixed(0) + "</td><td>" + f.t0.toFixed(0) + "–" + f.t1.toFixed(0) + "</td></tr>"; }); return h + "</table>";
    },
  };

  /* ---------------- distillation ---------------- */
  function initDist(s, c) {
    const V = 150, ve = (c.eth / 100) * V, vw = V - ve; s.nE = ve / VE; s.nW = vw / VW; s.dE = 0; s.dW = 0; s.Tf = 20; s.Th = 20; s.fr = []; s.fe = 0; s.fw = 0; s.t0 = null; s.tmin = 200; s.tmax = 0; s.boil = 0; s.out = 0; s.msg = "";
    s.parts && s.parts.forEach((p) => (p.on = false)); s.bL && s.bL.setVolume(0.1);
  }
  function newFraction(s) { const dv = s.fe * VE + s.fw * VW; if (dv < 0.5) return; s.fr.push({ v: dv, e: ((s.fe * VE) / dv) * 100, t0: s.tmin > 150 ? s.Th : s.tmin, t1: s.tmax || s.Th }); s.fe = 0; s.fw = 0; s.tmin = 200; s.tmax = 0; s.bL.setVolume(0.1); }
  function updDist(S, s, c, dt) {
    const P = c.P, N = c.mode === "frac" ? PLATES : 1, V = s.nE * VE + s.nW * VW, x = s.nE / Math.max(1e-9, s.nE + s.nW), Tb = tBoil(x), sim = dt * 1.0, cond = !!c.water;
    /* flask temperature: heats toward a power-set limit; boils when it reaches the mixture's boiling point */
    const limit = 20 + P * 1.5; let boiling = false;
    if (dt > 0) { if (s.Tf < Tb - 0.05) s.Tf = Math.min(Tb, s.Tf + (limit - s.Tf) * 0.08 * sim * 4 + (P > 0 ? 0.5 * sim : 0)); else if (limit >= Tb + 8 && V > 8) { s.Tf = Tb; boiling = true; } else if (limit < Tb) s.Tf += (limit - s.Tf) * 0.06 * sim; }
    const rate = boiling ? 0.22 * clamp((P - 25) / 75, 0.05, 1) : 0; s.boil += ((rate > 0 ? 1 : 0) - s.boil) * Math.min(1, dt * 4 + (dt ? 0 : 1));
    /* vapour composition after N plates (each plate: condense, re-evaporate) */
    let y = yEq(x), xt = x; for (let i = 1; i < N; i++) { xt = y; y = yEq(xt); } s.y = y; s.xtop = xt;
    if (rate > 0 && dt > 0) { const dn = Math.min(rate * sim, s.nE + s.nW - 0.05), dE = dn * y, dW = dn - dE; s.nE = Math.max(0, s.nE - dE); s.nW = Math.max(0, s.nW - dW); s.out = rate; if (cond) { s.dE += dE; s.dW += dW; s.fe += dE; s.fw += dW; } }
    s.Th = lerp(s.Th, rate > 0 ? tBoil(xt) : Math.min(s.Tf, 20 + (s.Tf - 20) * 0.7), Math.min(1, dt * 2.5 + (dt ? 0 : 1))); if (rate > 0 && cond) { s.tmin = Math.min(s.tmin, s.Th); s.tmax = Math.max(s.tmax, s.Th); }
    s.flL.setVolume(Math.max(1, s.nE * VE + s.nW * VW)); s.flL.agit = boiling ? 1 : 0; s.flL.update(S.t); s.bub.rate = rate * 220; s.bub.update(dt, S.t);
    const dv = s.fe * VE + s.fw * VW; s.bL.setVolume(Math.max(0.1, dv)); s.bL.setColor([212, 233, 245], 0.2); s.bL.update(S.t);
    s.ring.material.opacity += ((P > 0 ? 0.1 + 0.55 * P / 100 : 0) - s.ring.material.opacity) * Math.min(1, dt * 4 + (dt ? 0 : 1));
    /* thermometer column */
    const ty = HP_Y + (c.mode === "frac" ? 4.05 : 2.15) + 0.35; s.th.position.set(HX, ty + 0.2, 0); const tl = 0.08 + 0.6 * clamp((s.Th - 0) / 110, 0, 1); s.tc.scale.y = tl; s.tc.position.set(HX, ty - 0.12 + tl / 2, 0);
    /* vapour / droplets travel the apparatus */
    const cd = c.mode === "frac" ? s.cF : s.cS, y0 = c.mode === "frac" ? s.hy[1] : s.hy[0], path = [V3(HX, HP_Y + 1.7, 0), V3(HX, y0 + 0.28, 0), cd.c0, END, V3(END.x + 0.02, END.y - 0.3, 0)], lens = [0]; for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + path[i].distanceTo(path[i - 1])); const total = lens[lens.length - 1];
    s.pa = (s.pa || 0) + (dt > 0 ? s.boil * 0.9 * dt : 0); const nOn = Math.round(70 * s.boil * 0.6 + (rate > 0 ? 4 : 0)), m4 = new T.Matrix4(), col = new T.Color();
    for (let i = 0; i < 70; i++) {
      if (i >= nOn) { m4.makeScale(0, 0, 0); s.pIm.setMatrixAt(i, m4); continue; } const q = s.parts[i]; q.u = ((i / Math.max(1, nOn)) + s.pa * 0.4) % 1; const d = q.u * total; let j = 1; while (j < lens.length - 1 && d > lens[j]) j++; const f = (d - lens[j - 1]) / (lens[j] - lens[j - 1]), p = path[j - 1].clone().lerp(path[j], f);
      const inCond = d > lens[2] + 0.4, liquid = cond && inCond; const r = liquid ? 0.05 : 0.07; m4.makeScale(r, r, r); m4.setPosition(p.x, p.y, p.z); s.pIm.setMatrixAt(i, m4); col.set(liquid ? 0x6fb6ff : 0xf0f0f0); s.pIm.setColorAt(i, col);
    }
    s.pIm.instanceMatrix.needsUpdate = true; s.pIm.instanceColor && (s.pIm.instanceColor.needsUpdate = true); s.pIm.material.opacity = 0.85;
    s.boilingNow = boiling; s.rate = rate;
  }
  function ovDist(ctx, s, c, S) {
    H.pill(ctx, 10, 22, c.mode === "frac" ? "fractional distillation: repeated evaporation–condensation in the column" : "simple distillation: evaporate, condense, collect", "#ffe9b8", 11); H.pill(ctx, 10, 44, "b.p. ethanol 78 °C   ·   b.p. water 100 °C   ·   water enters the condenser at the bottom, leaves at the top", "#bcd0ea", 9.5);
    const qf = S.proj(V3(HX + 0.95, 0.8, 0)); H.pill(ctx, qf.x, qf.y, "flask " + s.Tf.toFixed(0) + " °C · " + (s.nE / (s.nE + s.nW) * 100).toFixed(0) + " mol % EtOH", "#ffb199", 9.5, "left");
    const hy = c.mode === "frac" ? s.hy[1] : s.hy[0], qh = S.proj(V3(HX, HP_Y + hy + 0.9, 0)); H.pill(ctx, qh.x - 18, clamp(qh.y, 70, 140), "thermometer " + s.Th.toFixed(0) + " °C", "#ff9d8a", 10.5, "right");
    const qb = S.proj(V3(BX, 1.8, 0)); const dv = s.fe * VE + s.fw * VW; H.pill(ctx, qb.x, qb.y - 6, "distillate " + dv.toFixed(0) + " cm³" + (dv > 0.5 ? " · " + ((s.fe * VE) / dv * 100).toFixed(0) + " % EtOH" : ""), "#9fd2ff", 9.5, "center");
    const qc = S.proj(V3(-0.2, 2.5, 0)); H.pill(ctx, qc.x, qc.y - 18, "condenser", "#9fb3d1", 9.5, "center"); if (c.water) { const qa = S.proj(V3(1.9, 1.7, 0.3)); H.pill(ctx, qa.x + 4, qa.y + 22, "water in ↗", "#7ab8ff", 9, "left"); const qo = S.proj(V3(XC0 + 0.4, 2.9, 0.3)); H.pill(ctx, qo.x - 8, qo.y - 20 + (c.mode === "frac" ? -80 : 0), "water out ↗", "#7ab8ff", 9, "right"); }
    /* temperature–composition (boiling point) diagram */
    const gx = 400, gy = 58, gw = 236, gh = 126, X0 = gx + 34, Y0 = gy + 16, PW = gw - 46, PH = gh - 40, tl = [], tv = []; for (let i = 0; i <= 40; i++) { const x = i / 40; tl.push([x, tBoil(x)]); tv.push([yEq(x), tBoil(x)]); } tv.sort((a, b) => a[0] - b[0]);
    H.graph(ctx, gx, gy, gw, gh, { series: [{ pts: tl, color: "#7fb5ff", width: 2 }, { pts: tv, color: "#ffb347", width: 2 }], xmin: 0, xmax: 1, ymin: 76, ymax: 102, ticksX: 4, ticksY: 4, xl: "mole fraction of ethanol", yl: "temp / °C", dot: [clamp(s.nE / (s.nE + s.nW), 0, 1), s.Tf, "#ffd27a"] });
    ctx.save(); ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#7fb5ff"; ctx.textAlign = "left"; ctx.fillText("liquid", X0 + 6, Y0 + 12); ctx.fillStyle = "#ffb347"; ctx.fillText("vapour", X0 + 6, Y0 + 24); ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.textAlign = "right"; ctx.fillText("azeotrope 0.89", X0 + PW - 2, Y0 + PH - 4); ctx.restore();
    if (!c.water) H.pill(ctx, 10, 366, "cooling water OFF — vapour is escaping, nothing is collected", "#ff9d8a", 10.5); else if (c.P < 25) H.pill(ctx, 10, 366, "heating too low to boil — increase the power", "#ffd27a", 10.5); else if (s.nE + s.nW < 1.2) H.pill(ctx, 10, 366, "flask nearly dry — stop heating!", "#ff9d8a", 10.5);
    H.pill(ctx, 10, 386, "vapour ethanol: " + ((s.y || 0) * 100).toFixed(0) + " mol %  (liquid " + (s.nE / (s.nE + s.nW) * 100).toFixed(0) + " %)" + (c.mode === "frac" ? "  · " + PLATES + " plates" : ""), "#7dffbd", 10);
  }

  /* ---------------- chromatography ---------------- */
  function initChrom(s, c) { s.front = 0; s.run = true; s.tcr = 0; }
  function updChrom(S, s, c, dt) {
    if (dt > 0 && s.run) { s.tcr += dt; s.front = Math.min(1, Math.sqrt(s.tcr / 22)); if (s.front >= 1) s.run = false; }
    const ink = INKS[c.ink], ct = s.ctx, W = 128, Hh = 360, base = c.wrong ? 0.1 : 0.13, k = SOLV[c.solv].k;
    ct.fillStyle = "#f4f1e6"; ct.fillRect(0, 0, W, Hh);
    const pyF = (frac) => Hh - frac * Hh;                      // paper fraction (0 bottom → 1 top) → pixel y
    const wetTop = base + (0.9 - base) * s.front;              // solvent front position (paper fraction)
    ct.fillStyle = "rgba(160,180,200,.28)"; ct.fillRect(0, pyF(wetTop), W, Hh * wetTop);
    ct.strokeStyle = "rgba(60,60,60,.7)"; ct.lineWidth = 1.2; ct.beginPath(); ct.moveTo(6, pyF(base)); ct.lineTo(W - 6, pyF(base)); ct.stroke();   // pencil line
    ct.strokeStyle = "rgba(90,130,170,.9)"; ct.setLineDash([3, 3]); ct.beginPath(); ct.moveTo(0, pyF(wetTop)); ct.lineTo(W, pyF(wetTop)); ct.stroke(); ct.setLineDash([]);
    const lanes = [{ x: 24, d: ink.d }, { x: 55, d: ["yellow"] }, { x: 86, d: ["red"] }, { x: 112, d: ["blue"] }];
    lanes.forEach((ln, li) => ln.d.forEach((dn) => { const D = DYES[dn], rf = Math.min(0.95, D.rf * k), moved = (0.9 - base) * s.front * rf, y = c.wrong ? base - 0.02 : base + moved, rr = 4 + 5 * s.front * (0.6 + rf * 0.6);
      if (c.wrong && s.front > 0.02) { /* the ink washes off into the solvent */ ct.globalAlpha = Math.max(0, 0.9 - s.front * 2); } else ct.globalAlpha = 1; const gr = ct.createRadialGradient(ln.x, pyF(y), 1, ln.x, pyF(y), rr * 1.6); gr.addColorStop(0, "rgba(" + D.c.join(",") + ",0.95)"); gr.addColorStop(1, "rgba(" + D.c.join(",") + ",0)"); ct.fillStyle = gr; ct.beginPath(); ct.ellipse(ln.x, pyF(y), rr * 1.0, rr * 1.35, 0, 0, TAU); ct.fill(); ct.globalAlpha = 1; }));
    s.tex.needsUpdate = true; s.cbL.setColor(c.wrong && s.front > 0.2 ? [120, 120, 130] : [212, 233, 245], c.wrong && s.front > 0.2 ? 0.45 : 0.2); s.cbL.update(S.t); s.lanes = lanes; s.base = base; s.wetTop = wetTop;
  }
  function ovChrom(ctx, s, c, S) {
    const ink = INKS[c.ink], k = SOLV[c.solv].k;
    H.pill(ctx, 10, 22, "Rf = distance moved by the spot ÷ distance moved by the solvent front", "#ffe9b8", 11); H.pill(ctx, 10, 44, "a pure substance gives ONE spot · the same substance has the same Rf in the same solvent", "#bcd0ea", 9.5);
    const pt = (lx, fr) => S.proj(V3(((lx - 64) / 128) * PAPER_W, PY0 + fr * PAPER_H, 0.05));
    ["unknown", "yellow", "red", "blue"].forEach((n, i) => { const q = pt(s.lanes ? s.lanes[i].x : 64, 1.0); H.pill(ctx, q.x, q.y - 10, i ? n[0].toUpperCase() : "ink", i ? "#dbe7ff" : "#ffd27a", 9.5, "center"); });
    const qf = pt(128, s.wetTop || 0); H.pill(ctx, qf.x + 12, qf.y - 6, "solvent front", "#7ab8ff", 9.5); const qb = pt(128, s.base || 0.1); H.pill(ctx, qb.x + 12, qb.y + 8, "pencil baseline", "#e6e6e6", 9.5);
    if (c.wrong) H.pill(ctx, 10, 366, "ink line below the solvent: the ink dissolves into the beaker — no chromatogram", "#ff9d8a", 10.5); else if (!s.run) H.pill(ctx, 10, 366, "finished — measure each spot from the baseline and divide by the front distance", "#7dffbd", 10.5);
    if (!c.wrong) { const rows = ink.d.map((d) => { const rf = Math.min(0.95, DYES[d].rf * k); return DYES[d].n.split(" ")[0] + " Rf = " + rf.toFixed(2); }); H.panel(ctx, 440, 120, 190, 22 + rows.length * 18); ctx.save(); ctx.font = "600 10px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.textAlign = "left"; ctx.fillText("Rf values (" + SOLV[c.solv].n.toLowerCase() + ")", 450, 138); ctx.fillStyle = "#e8f0ff"; rows.forEach((r, i) => ctx.fillText(r, 450, 158 + i * 18)); ctx.restore(); }
    H.pill(ctx, 10, 386, "solvent: " + SOLV[c.solv].n.toLowerCase() + "   ·   front " + ((s.front || 0) * 100).toFixed(0) + " % of the way up", "#9fe3ff", 10);
  }
})();
