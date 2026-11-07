/* c3d-water.js — chemistry 3D, new module: hardness of water (soap test) and softening (boiling, washing soda, ion exchange, distillation) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, CM = C3.CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  /* ion concentrations, mmol/dm³ */
  const WATER = {
    dist: { name: "Distilled water", ion: { Ca: 0, Mg: 0, HCO3: 0, SO4: 0, Na: 0 }, note: "pure water: no dissolved ions" },
    soft: { name: "Soft tap water", ion: { Ca: 0.1, Mg: 0.05, HCO3: 0.3, SO4: 0.05, Na: 0.4 }, note: "very little Ca²⁺ and Mg²⁺" },
    temp: { name: "Temporary hard water", ion: { Ca: 3.0, Mg: 0, HCO3: 6.0, SO4: 0, Na: 0 }, note: "contains calcium hydrogencarbonate, Ca(HCO₃)₂" },
    perm: { name: "Permanent hard water", ion: { Ca: 2.0, Mg: 1.0, HCO3: 0, SO4: 3.0, Na: 0 }, note: "contains calcium / magnesium sulphate (CaSO₄, MgSO₄)" },
    both: { name: "Hard water (both kinds)", ion: { Ca: 4.0, Mg: 0, HCO3: 4.0, SO4: 2.0, Na: 0 }, note: "temporary + permanent hardness" },
  };
  const TREAT = { none: "No treatment", boil: "Boil it", soda: "Add washing soda, Na₂CO₃", resin: "Pass through an ion-exchange resin", distil: "Distil it" };
  function after(w, tr) {
    const i = Object.assign({}, WATER[w].ion), o = Object.assign({}, i);
    if (tr === "boil") { const x = Math.min(i.HCO3 / 2, i.Ca + i.Mg), fromCa = Math.min(i.Ca, x); o.Ca = i.Ca - fromCa; o.Mg = i.Mg - (x - fromCa); o.HCO3 = Math.max(0, i.HCO3 - 2 * x); }
    if (tr === "soda") { o.Na = i.Na + 2 * (i.Ca + i.Mg); o.Ca = 0; o.Mg = 0; }
    if (tr === "resin") { o.Na = i.Na + 2 * (i.Ca + i.Mg); o.Ca = 0; o.Mg = 0; }
    if (tr === "distil") { o.Ca = o.Mg = o.HCO3 = o.SO4 = o.Na = 0; }
    return { before: i, after: o, M: o.Ca + o.Mg, removed: (i.Ca + i.Mg) - (o.Ca + o.Mg) };
  }
  const SAMPLE = 10, SOAP = 0.02;                     // cm³ of sample; soap solution 0.02 mol/dm³ (2 soap anions per M²⁺)
  const needed = (M2) => (2 * M2 * (SAMPLE / 1000)) / SOAP;      // cm³ of soap solution that precipitates all M²⁺
  const ION = [["Ca", "Ca²⁺", "#ffb35a"], ["Mg", "Mg²⁺", "#c78cff"], ["HCO3", "HCO₃⁻", "#7ab8ff"], ["SO4", "SO₄²⁻", "#ffe27a"], ["Na", "Na⁺", "#9fe3b8"]];
  const WT = { outer: [[0, 0], [0.5, 0.05], [0.8, 0.4], [0.92, 1.0], [0.92, 18]], inner: [[0, 0.15], [0.45, 0.2], [0.72, 0.5], [0.84, 1.0], [0.84, 18]] };
  const class_ = (mgl) => (mgl < 60 ? "soft" : mgl < 120 ? "moderately hard" : mgl < 180 ? "hard" : "very hard");

  C3.scenes.waterHardness = {
    env: "studio", envOpts: { top: "#16223a", bottom: "#05080f" }, envI: 0.8, fov: 36, free: true, cam: [[0.3, 2.4, 7.4], [0.3, 1.3, 0]],
    values: { w: "temp", tr: "none" },
    state: () => ({ soap: 0, soapShown: 0, shake: 0, tt: 0, drop: 0 }),
    controls: [
      { type: "select", key: "w", label: "Water sample (10 cm³)", options: Object.keys(WATER).map((k) => ({ value: k, label: WATER[k].name })) },
      { type: "select", key: "tr", label: "Softening treatment", options: Object.keys(TREAT).map((k) => ({ value: k, label: TREAT[k] })) },
      { type: "button", label: "Add 1 cm³ of soap solution and shake", action: (S, s) => { s.soap = Math.min(20, s.soap + 1); s.shake = 1.4; } },
      { type: "button", label: "Add 0.2 cm³ (fine steps near the end-point)", action: (S, s) => { s.soap = Math.min(20, s.soap + 0.2); s.shake = 1.2; } },
      { type: "button", label: "Fresh sample", action: (S, s) => { s.soap = 0; s.soapShown = 0; s.tt = 0; }, cls: "secondary" },
    ],
    views: [{ label: "Bench", cam: [[0.3, 2.4, 7.4], [0.3, 1.3, 0]] }, { label: "Tube close-up", cam: [[0.1, 1.9, 4.0], [0.1, 1.0, 0]] }],
    note: "Hard water contains dissolved Ca²⁺ and Mg²⁺ ions. They react with soap (sodium stearate) to make an insoluble scum, so no lather forms until enough soap has been added to remove them: 2C₁₇H₃₅COO⁻ + Ca²⁺ → (C₁₇H₃₅COO)₂Ca↓. The volume of soap needed measures the hardness. Temporary hardness (Ca(HCO₃)₂) is removed by boiling, which gives limescale (CaCO₃); permanent hardness (CaSO₄, MgSO₄) is not, but washing soda (Na₂CO₃) precipitates the ions and an ion-exchange resin swaps them for Na⁺. Distillation removes everything but wastes energy.",
    onChange(S, s, c, key) { s.soap = 0; s.soapShown = 0; s.tt = 0; },
    reset(S, s, c) { Object.assign(c, { w: "temp", tr: "none" }); s.soap = 0; s.soapShown = 0; s.tt = 0; },
    table(s, c) {
      const rows = Object.keys(TREAT).map((t) => { const a = after(c.w, t); return '<tr class="' + (t === c.tr ? "ok" : "") + '"><td style="text-align:left">' + TREAT[t] + "</td><td>" + a.M.toFixed(1) + "</td><td>" + needed(a.M).toFixed(1) + "</td></tr>"; });
      return '<table class="c3-table"><tr><th style="text-align:left">Treatment (' + WATER[c.w].name + ')</th><th>Ca²⁺ + Mg²⁺ / mmol dm⁻³</th><th>soap needed / cm³</th></tr>' + rows.join("") + "</table>";
    },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K;
      S.mk.rbox(1.6, 0.22, 1.0, 0.06, M.matte(0x7a5330, 0.55), 0, 0.11, 0.2);
      s.tube = K.vessel(WT); s.tube.group.position.set(0, 0.24, 0.2); s.liq = s.tube.addLiquid({ color: [226, 241, 250], opacity: 0.3 }); s.liq.setVolume(SAMPLE);
      s.ppt = K.precipitate(s.tube, s.liq, { n: 900, size: 0.1, color: 0xf6f6f2 }); s.bub = K.bubbles(s.tube, s.liq, { n: 60, x: 0, z: 0, baseY: 0.5, spread: 0.3 });
      s.foam = new T.InstancedMesh(new T.SphereGeometry(1, 10, 8), new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, transparent: true, opacity: 0.92 }), 260); s.foam.frustumCulled = false; s.tube.group.add(s.foam); s.fp = []; for (let i = 0; i < 260; i++) s.fp.push({ a: Math.random() * 6.28, r: Math.sqrt(Math.random()), l: Math.random(), s: 0.016 + Math.random() * 0.022 });
      s.m4 = new T.Matrix4();
      s.dropper = new T.Group(); const pg = new T.Mesh(new T.CylinderGeometry(0.03, 0.05, 0.9, 14), M.matte(0xd8eaf5, 0.08)); pg.position.y = 0.45; const pb = new T.Mesh(new T.SphereGeometry(0.13, 20, 14), M.rubber()); pb.position.y = 1.05; pb.scale.y = 1.4; s.dropper.add(pg, pb); s.dropper.position.set(0, 3.0, 0.2); S.scene.add(s.dropper); s.dropper.visible = false;
      s.drops = K.drops({ color: 0xe8f0f4 });
      s.bunsen = K.bunsen({ x: 1.8, z: 0.5, flameH: 7 }); s.bunsen.setAir(1); s.bunsen.setGas(0);
      s.bottle = K.bottle({ h: 9, r: 1.7, label: "Na₂CO₃", sub: "washing soda", color: 0x8a4a14 }); s.bottle.position.set(-1.9, 0, -0.2); s.bottle.visible = false;
      s.bottle2 = K.bottle({ h: 9, r: 1.7, label: "SOAP", sub: "0.02 mol/dm³", color: 0x2a6aa8 }); s.bottle2.position.set(-1.2, 0, -0.4);
      /* ion-exchange column */
      s.col = new T.Group(); const gl = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 2.0, 24, 1, true), new T.MeshPhysicalMaterial({ color: 0xcfe8f5, transparent: true, opacity: 0.2, roughness: 0.05, side: T.DoubleSide, depthWrite: false })); gl.position.y = 1.3; s.col.add(gl);
      for (let i = 0; i < 70; i++) { const b = new T.Mesh(new T.SphereGeometry(0.045, 8, 6), new T.MeshStandardMaterial({ color: 0x2f7be8, roughness: 0.3 })); b.position.set((Math.random() - 0.5) * 0.4, 0.55 + Math.random() * 1.5, (Math.random() - 0.5) * 0.4); s.col.add(b); } s.col.position.set(-2.8, 0, 0.1); S.scene.add(s.col); s.col.visible = false;
    },
    update(S, s, c, dt) {
      const a = after(c.w, c.tr), need = needed(a.M), W = WATER[c.w];
      if (dt > 0) { s.tt = Math.min(1, s.tt + dt * 0.35); s.shake = Math.max(0, s.shake - dt); s.soapShown += (s.soap - s.soapShown) * Math.min(1, dt * 3); if (Math.abs(s.soap - s.soapShown) < 0.003) s.soapShown = s.soap; }
      const dr = Math.abs(s.soap - s.soapShown) > 0.02; s.dropper.visible = dr; if (dr && dt > 0) { s.drop += dt * 5; while (s.drop >= 1) { s.drop -= 1; s.drops.emit(0, 3.0 - 0.15, 0.2, 0.24 + s.liq.level * CM, 0.03); } } s.drops.update(dt);
      s.liq.setVolume(SAMPLE + s.soapShown + (c.tr === "soda" ? 1 * s.tt : 0)); s.liq.setColor([196, 224, 248], 0.4); s.liq.update(S.t);
      /* scum (soap + Ca²⁺) and treatment precipitates */
      const scum = need > 0 ? clamp(s.soapShown / need, 0, 1) * clamp(0.35 + a.M / 3, 0, 1) : 0, treat = clamp(a.removed / 3, 0, 1) * (c.tr === "boil" || c.tr === "soda" ? s.tt : 0);
      s.ppt.amount = clamp(scum + treat, 0, 1); s.ppt.setColor(treat > scum ? 0xf3f0e6 : 0xf6f6f2); s.ppt.update(dt);
      const boil = c.tr === "boil" && s.tt < 1 && a.removed > 0; s.bunsen.visible = c.tr === "boil"; s.bunsen.setGas(c.tr === "boil" && s.tt < 1 ? 0.8 : 0); s.bunsen.flame.update(S.t); s.bub.rate = boil ? 45 : 0; s.bub.update(dt, S.t);
      s.col.visible = c.tr === "resin"; s.bottle.visible = c.tr === "soda";
      /* lather appears only when there is spare soap and the tube has been shaken */
      const excess = s.soapShown - need, L = a.M === 0 && s.soapShown > 0 ? clamp(s.soapShown / 1.0, 0, 1) : clamp((excess - 0.1) / 1.4, 0, 1); s.L = L;
      const topY = s.liq.level; const n = Math.floor(260 * L); const rr = 0.84 * CM;
      for (let i = 0; i < 260; i++) { const p = s.fp[i]; if (i >= n) { s.m4.makeScale(0, 0, 0); s.foam.setMatrixAt(i, s.m4); continue; } const hgt = p.l * (0.14 + 0.5 * L) * 1.0, sc2 = p.s * (0.8 + 0.5 * L); s.m4.makeScale(sc2, sc2, sc2); s.m4.setPosition(Math.cos(p.a) * rr * 0.8 * p.r, topY * CM + 0.02 + hgt * (0.4 + p.l * 0.6), Math.sin(p.a) * rr * 0.8 * p.r); s.foam.setMatrixAt(i, s.m4); }
      s.foam.instanceMatrix.needsUpdate = true;
      const sk = s.shake > 0 ? Math.sin(S.t * 38) * 0.05 * Math.min(1, s.shake) : 0; s.tube.group.position.x = sk; s.tube.group.rotation.z = sk * 0.5;
      s.a = a; s.need = need;
    },
    overlay(ctx, s, c, w, h, S) {
      const a = s.a, W = WATER[c.w], need = s.need; const mgl = a.M * 100.09; H.pill(ctx, 10, 22, W.name + " — " + TREAT[c.tr], "#ffe9b8", 10.5);
      H.pill(ctx, 10, 44, "soap added: " + s.soapShown.toFixed(1) + " cm³ " + (s.L > 0.3 ? "→ stable lather ✔" : s.soap > 0 ? (a.M > 0 ? "→ scum, no lather yet" : "") : ""), s.L > 0.3 ? "#7dffbd" : "#9fe3ff", 10);
      /* ion chart */
      const px = 388, py = 58, pw = 248, ph = 160; H.panel(ctx, px, py, pw, ph); ctx.save(); ctx.textAlign = "left"; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Dissolved ions (mmol/dm³)", px + 8, py + 15);
      const mx = 8; ION.forEach(([k, lab, col], i) => { const y = py + 28 + i * 22, x0 = px + 52, bw = pw - 70; ctx.fillStyle = col; ctx.font = "9.5px 'IBM Plex Mono',monospace"; ctx.fillText(lab, px + 8, y + 9); ctx.fillStyle = "rgba(255,255,255,0.10)"; ctx.fillRect(x0, y, bw, 14); ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.fillRect(x0, y, bw * clamp(a.before[k] / mx, 0, 1), 5); ctx.fillStyle = col; ctx.fillRect(x0, y + 5, bw * clamp(lerp(a.before[k], a.after[k], c.tr === "none" ? 1 : s.tt) / mx, 0, 1), 9); ctx.fillStyle = "#dbe7ff"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText(lerp(a.before[k], a.after[k], c.tr === "none" ? 1 : s.tt).toFixed(1), x0 + bw * clamp(lerp(a.before[k], a.after[k], c.tr === "none" ? 1 : s.tt) / mx, 0, 1) + 4, y + 12); });
      ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText("light bar = before treatment, bright bar = now", px + 8, py + ph - 8); ctx.restore();
      const qx = 388, qy = 224, qw = 248, qh = 76; H.panel(ctx, qx, qy, qw, qh); ctx.save(); ctx.textAlign = "left"; ctx.font = "9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#dbe7ff"; ctx.fillText("[Ca²⁺ + Mg²⁺] = " + a.M.toFixed(2) + " mmol/dm³ (" + mgl.toFixed(0) + " mg/dm³)", qx + 8, qy + 15); ctx.fillStyle = "#ffd27a"; ctx.fillText("water is " + class_(mgl) + " · soap ≈ " + need.toFixed(1) + " cm³", qx + 8, qy + 29); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; wrapT(ctx, c.tr === "boil" ? "boiling: Ca(HCO₃)₂ → CaCO₃↓ + CO₂ + H₂O (limescale)" : c.tr === "soda" ? "Ca²⁺ + CO₃²⁻ → CaCO₃↓ (also removes permanent hardness)" : c.tr === "resin" ? "resin: Ca²⁺/Mg²⁺ held, Na⁺ released (2Na⁺ per M²⁺)" : c.tr === "distil" ? "distillation removes all dissolved ions" : W.note, qx + 8, qy + 44, qw - 16, 10); ctx.restore();
      const q = S.proj(V3(-1.2, 1.7, -0.4)); H.pill(ctx, q.x, q.y, "soap solution", "#8fb4ff", 8.5, "center");
    },
    readouts(s, c) { const a = s.a, W = WATER[c.w]; return [["Water", W.name + " — " + W.note], ["Treatment", TREAT[c.tr]], ["Ca²⁺ + Mg²⁺", a.M.toFixed(2) + " mmol/dm³  (" + (a.M * 100.09).toFixed(0) + " mg CaCO₃/dm³)"], ["Classification", class_(a.M * 100.09)], ["Soap needed for a lather", s.need.toFixed(1) + " cm³ of 0.02 mol/dm³ soap per 10 cm³ sample"], ["Soap added so far", s.soapShown.toFixed(1) + " cm³"], ["Scum reaction", "2C₁₇H₃₅COO⁻(aq) + Ca²⁺(aq) → (C₁₇H₃₅COO)₂Ca(s)"]]; },
    steps(s, c) { return [["Choose a water sample", "done"], ["Add soap 1 cm³ at a time and shake: scum, then a lather at the end-point", s.soap > 0 ? "done" : "now"], ["Apply a softening treatment (boil, washing soda, resin) and repeat the test", c.tr !== "none" ? "done" : ""], ["Compare the soap volumes in the table", ""]]; },
  };
  function wrapT(ctx, text, x, y, maxW, lh) { const words = String(text).split(" "); let line = ""; for (const wd of words) { const t = line ? line + " " + wd : wd; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = wd; } else line = t; } if (line) ctx.fillText(line, x, y); return y + lh; }
})();
