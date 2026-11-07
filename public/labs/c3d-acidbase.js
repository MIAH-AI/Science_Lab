/* c3d-acidbase.js — chemistry 3D, batch B (part 2): acids, bases & the pH scale · solubility curves */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, TAU = Math.PI * 2, chem = C3.chem, sub = chem.sub;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;

  /* =========================================================================== 1. ACIDS, BASES & pH */
  const UI = [[0, [222, 28, 36]], [3, [240, 88, 30]], [5, [250, 200, 32]], [7, [62, 170, 72]], [9, [40, 112, 204]], [11, [86, 62, 172]], [14, [112, 40, 152]]];
  function uiRgb(pH) { pH = clamp(pH, 0, 14); let i = 0; while (i < UI.length - 2 && pH > UI[i + 1][0]) i++; const a = UI[i], b = UI[i + 1], k = (pH - a[0]) / (b[0] - a[0]); return a[1].map((v, j) => v + (b[1][j] - v) * k); }
  const SOL = {
    hcl: { name: "Hydrochloric acid, HCl", kind: "SA", f: "HCl → H⁺ + Cl⁻", mol: 0xb9c4d0, cat: [0xff4a3a, 0.07], an: [0x7fe0a8, 0.11], cl: "H⁺", al: "Cl⁻", ml: "HCl" },
    eth: { name: "Ethanoic acid, CH₃COOH", kind: "WA", K: 1.74e-5, f: "CH₃COOH ⇌ H⁺ + CH₃COO⁻", mol: 0xd7c2a0, cat: [0xff4a3a, 0.07], an: [0xffc83a, 0.11], cl: "H⁺", al: "CH₃COO⁻", ml: "CH₃COOH" },
    naoh: { name: "Sodium hydroxide, NaOH", kind: "SB", f: "NaOH → Na⁺ + OH⁻", mol: 0xb9c4d0, cat: [0xa98bff, 0.09], an: [0x4a8dff, 0.1], cl: "Na⁺", al: "OH⁻", ml: "NaOH" },
    nh3: { name: "Ammonia solution, NH₃", kind: "WB", K: 1.8e-5, f: "NH₃ + H₂O ⇌ NH₄⁺ + OH⁻", mol: 0xc9a8ff, cat: [0x45d6c6, 0.1], an: [0x4a8dff, 0.1], cl: "NH₄⁺", al: "OH⁻", ml: "NH₃" },
    h2o: { name: "Pure water, H₂O", kind: "N", f: "2H₂O ⇌ H₃O⁺ + OH⁻   (Kw = 10⁻¹⁴ at 25 °C)", mol: 0x9fd4ff, cat: [0xff4a3a, 0.07], an: [0x4a8dff, 0.1], cl: "H⁺", al: "OH⁻", ml: "H₂O" },
  };
  const HOUSE = [[2.0, "lemon juice"], [2.9, "vinegar"], [5.6, "rain"], [7.0, "pure water"], [7.4, "blood"], [8.1, "sea water"], [11.5, "ammonia"], [12.6, "bleach"]];
  function acid(c) {
    const sl = SOL[c.sub], conc = Math.pow(10, c.lc); let pH;
    if (sl.kind === "N") pH = 7; else pH = chem.ph(Object.assign({ c: conc }, { type: sl.kind, K: sl.K }), { type: "SA", c: 0.1 }, 25, 0);
    const h = Math.pow(10, -pH), oh = 1e-14 / h, alpha = sl.kind === "SA" || sl.kind === "SB" ? 1 : sl.kind === "N" ? 0 : (sl.kind === "WA" ? h : oh) / conc;
    return { pH, h, oh, conc, alpha: Math.min(1, alpha) };
  }
  const NT = 60, NMAXP = 130;

  C3.scenes.acidBasePH = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[0.3, 4.2, 15.5], [0.2, 2.3, 0]],
    values: { sub: "hcl", lc: -1.0, uni: 1 },
    state: () => ({ t: 0 }),
    controls: [
      { type: "select", key: "sub", label: "Solution", options: Object.keys(SOL).map((k) => ({ value: k, label: SOL[k].name })) },
      { type: "range", key: "lc", label: "log₁₀ of concentration c  (c = 10^x mol/dm³)", min: -4, max: 0, step: 0.05 },
      { type: "button", label: "Dilute ×10 (add 9 volumes of water)", action: (S, s, c, ref) => { c.lc = Math.max(-4, c.lc - 1); ref(); } },
      { type: "button", label: "Concentrate ×10", action: (S, s, c, ref) => { c.lc = Math.min(0, c.lc + 1); ref(); }, cls: "secondary" },
      { type: "toggle", key: "uni", label: "Universal indicator in the beaker" },
    ],
    views: [{ label: "Bench", cam: [[0.3, 4.2, 15.5], [0.2, 2.3, 0]] }, { label: "Particles", cam: [[3.9, 2.6, 8.4], [3.9, 1.7, 0]] }, { label: "Beaker + meter", cam: [[-2.2, 2.8, 8.6], [-2.2, 1.6, 0]] }],
    note: "pH = −log₁₀[H⁺]  and  pH + pOH = 14 at 25 °C (Kw = [H⁺][OH⁻] = 10⁻¹⁴). A strong acid or base is fully ionised, so the ions equal the concentration; a weak one only ionises a little (Ka = [H⁺][A⁻]/[HA]). The particle box is a magnified model: 60 formula units, with the ionised share shown; for very weak electrolytes at least one ion pair is drawn so you can see them.",
    reset(S, s, c) { Object.assign(c, { sub: "hcl", lc: -1, uni: 1 }); },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; K.contact(-3.6, 0, 0, 5, 0.5); K.contact(3.9, 0, 0, 4.8, 0.5);
      s.bk = K.beaker(); s.bk.group.position.set(-3.6, 0, 0); s.liq = s.bk.addLiquid({ color: 0x9fd4ff, opacity: 0.32 }); s.liq.setVolume(160);
      S.mk.rbox(2.0, 1.1, 1.3, 0.1, M.paint(0xe2e5ea), -0.2, 0.55, -0.3); S.mk.rbox(1.3, 0.55, 0.06, 0.03, M.matte(0x0b1a10, 0.35), -0.2, 0.75, 0.36);
      S.mk.cyl(0.07, 0.07, 1.4, M.matte(0x252a31, 0.5), -2.6, 1.3, 0.1); S.mk.cyl(0.05, 0.05, 1.8, M.matte(0x252a31, 0.5), -1.6, 2.0, 0.1);
      S.mk.rod(V3(-0.5, 1.05, -0.3), V3(-0.5, 1.9, -0.3), 0.04, M.matte(0x252a31, 0.5)); S.mk.rod(V3(-0.5, 1.9, -0.3), V3(-3.3, 2.2, 0.1), 0.04, M.matte(0x252a31, 0.5)); S.mk.rod(V3(-3.3, 2.2, 0.1), V3(-3.3, 0.7, 0.1), 0.06, M.steel());
      const box = new T.Mesh(new T.BoxGeometry(3.6, 3.0, 2.4), K.glassMat({ opacity: 0.08 })); box.position.set(3.9, 1.6, 0); box.renderOrder = 4; S.scene.add(box); S.mk.rbox(3.9, 0.14, 2.7, 0.04, M.steel(), 3.9, 0.07, 0);
      s.inst = new T.InstancedMesh(new T.SphereGeometry(1, 20, 14), new T.MeshPhysicalMaterial({ roughness: 0.25, clearcoat: 0.7 }), NMAXP); s.inst.frustumCulled = false; S.scene.add(s.inst);
      s.pp = []; for (let i = 0; i < NMAXP; i++) s.pp.push({ p: V3(U.rnd(-1.6, 1.6), U.rnd(0.3, 2.8), U.rnd(-1, 1)), v: V3(U.rnd(-1, 1), U.rnd(-1, 1), U.rnd(-1, 1)).multiplyScalar(0.8) });
      s.m4 = new T.Matrix4(); s.col = new T.Color(); s.sig = ""; s.parts = []; s.pHs = 7; s.enl = false;
    },
    update(S, s, c, dt) {
      s.t += dt; const sl = SOL[c.sub], a = acid(c); s.a = a; s.sl = sl;
      const sig = c.sub + "|" + c.lc.toFixed(2);
      if (sig !== s.sig) {
        s.sig = sig; s.parts = []; let k = Math.round(NT * a.alpha); s.enl = false; if (sl.kind === "N") k = 0; else if (a.alpha > 0 && k === 0) { k = 1; s.enl = true; }
        if (sl.kind === "SA" || sl.kind === "SB") k = NT;
        for (let i = 0; i < NT; i++) { if (i < k) { s.parts.push({ col: sl.cat[0], r: sl.cat[1] }); s.parts.push({ col: sl.an[0], r: sl.an[1] }); } else if (sl.kind !== "N") s.parts.push({ col: sl.mol, r: 0.13 }); }
        if (sl.kind === "N") { for (let i = 0; i < NT; i++) s.parts.push({ col: sl.mol, r: 0.11 }); s.parts[0] = { col: sl.cat[0], r: sl.cat[1] }; s.parts[1] = { col: sl.an[0], r: sl.an[1] }; s.enl = true; }
        s.parts = s.parts.slice(0, NMAXP); s.k = k;
      }
      s.pHs += (a.pH - s.pHs) * Math.min(1, dt * 3 + (dt ? 0 : 1));
      const rgb = c.uni ? uiRgb(s.pHs) : [200, 228, 244]; s.liq.setColor(rgb, c.uni ? 0.5 : 0.2); s.liq.update(S.t);
      for (let i = 0; i < NMAXP; i++) {
        const pt = s.parts[i]; if (!pt) { s.m4.makeScale(0, 0, 0); s.inst.setMatrixAt(i, s.m4); continue; }
        const d = s.pp[i]; if (dt > 0) { d.p.addScaledVector(d.v, dt); if (Math.abs(d.p.x) > 1.65) d.v.x *= -1; if (d.p.y < 0.25 || d.p.y > 2.85) d.v.y *= -1; if (Math.abs(d.p.z) > 1.05) d.v.z *= -1; d.p.x = clamp(d.p.x, -1.65, 1.65); d.p.y = clamp(d.p.y, 0.25, 2.85); d.p.z = clamp(d.p.z, -1.05, 1.05); }
        s.m4.makeScale(pt.r, pt.r, pt.r); s.m4.setPosition(3.9 + d.p.x, d.p.y, d.p.z); s.inst.setMatrixAt(i, s.m4); s.col.set(pt.col); s.inst.setColorAt(i, s.col);
      }
      s.inst.instanceMatrix.needsUpdate = true; s.inst.instanceColor && (s.inst.instanceColor.needsUpdate = true);
    },
    overlay(ctx, s, c, w, h, S) {
      const a = s.a, sl = s.sl; if (!a) return;
      H.pill(ctx, 10, 22, sl.f, "#ffe9b8", 11.5); H.pill(ctx, 10, 44, "pH = −log₁₀[H⁺]   ·   pOH = −log₁₀[OH⁻]   ·   pH + pOH = 14   ·   Kw = [H⁺][OH⁻] = 10⁻¹⁴", "#bcd0ea", 9.5);
      const m = S.proj(V3(-0.2, 0.75, 0.4)); H.pill(ctx, m.x, m.y + 4, "pH " + a.pH.toFixed(2), "#7dff9d", 12, "center");
      const bq = S.proj(V3(-3.6, 1.9, 0)); H.pill(ctx, bq.x, clamp(bq.y - 14, 76, 200), "c = " + a.conc.toExponential(1).replace("e", "×10^") + " mol/dm³", "#cfe0ff", 10, "center");
      /* legend for the particle box */
      const lg = [[sl.ml, "#" + (sl.mol).toString(16).padStart(6, "0")], [sl.cl, "#" + (sl.cat[0]).toString(16).padStart(6, "0")], [sl.al, "#" + (sl.an[0]).toString(16).padStart(6, "0")]];
      lg.forEach(([t, col], i) => { const x = 398 + i * 78; ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, 74, 5, 0, TAU); ctx.fill(); ctx.restore(); H.pill(ctx, x + 9, 78, t, "#dbe7ff", 9.5); });
      H.pill(ctx, 398, 98, sl.kind === "N" ? "1 in 5.5×10⁸ molecules is ionised" : a.alpha >= 0.999 ? "fully ionised (strong)" : "ionised: " + (a.alpha * 100).toPrecision(2) + " % (weak)" + (s.enl ? " — pair enlarged" : ""), sl.kind === "N" ? "#9fe3ff" : a.alpha >= 0.999 ? "#ff9d8a" : "#ffd27a", 10);
      /* zoom lines beaker → box */
      ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.28)"; ctx.setLineDash([4, 4]); const p1 = S.proj(V3(-3.0, 1.6, 0)), p2 = S.proj(V3(2.1, 2.6, 0)), p3 = S.proj(V3(-3.0, 0.6, 0)), p4 = S.proj(V3(2.1, 0.3, 0)); ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke(); ctx.restore();
      H.pill(ctx, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 8, "zoom ×10⁹", "#9fb3d1", 9.5, "center");
      /* pH ribbon */
      const x0 = 40, x1 = 600, y0 = 330, hh = 14, X = (p) => x0 + (p / 14) * (x1 - x0);
      for (let i = 0; i < x1 - x0; i++) { ctx.fillStyle = chem.rgbCss(uiRgb((i / (x1 - x0)) * 14)); ctx.fillRect(x0 + i, y0, 1.2, hh); }
      ctx.save(); ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#dbe7ff"; ctx.textAlign = "center"; for (let p = 0; p <= 14; p++) { ctx.fillRect(X(p) - 0.5, y0 + hh, 1, 4); ctx.fillText(p, X(p), y0 + hh + 13); }
      ctx.fillStyle = "#ffb199"; ctx.textAlign = "left"; ctx.fillText("acidic", x0, y0 - 4); ctx.fillStyle = "#b8f5c0"; ctx.textAlign = "center"; ctx.fillText("neutral", X(7), y0 - 4); ctx.fillStyle = "#a9c4ff"; ctx.textAlign = "right"; ctx.fillText("alkaline", x1, y0 - 4);
      ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = "8px 'IBM Plex Mono',monospace"; HOUSE.forEach(([p, t], i) => { ctx.textAlign = "center"; ctx.fillText("▾" + t, clamp(X(p), x0 + 30, x1 - 30), y0 - 14 - (i % 3) * 9); });
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(X(a.pH), y0 - 1); ctx.lineTo(X(a.pH) - 6, y0 + hh + 8); ctx.lineTo(X(a.pH) + 6, y0 + hh + 8); ctx.closePath(); ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.fill(); ctx.stroke(); ctx.restore();
    },
    readouts(s, c) {
      const a = s.a, sl = s.sl; if (!a) return [];
      return [["pH = −log₁₀[H⁺]", a.pH.toFixed(2)], ["pOH", (14 - a.pH).toFixed(2)], ["[H⁺]", a.h.toExponential(2) + " mol/dm³"], ["[OH⁻]", a.oh.toExponential(2) + " mol/dm³"], ["Concentration c", a.conc.toExponential(2) + " mol/dm³"],
        ["Degree of ionisation α", sl.kind === "N" ? "1.8×10⁻⁹" : (a.alpha * 100).toPrecision(3) + " %"], [sl.kind === "WA" ? "Ka" : sl.kind === "WB" ? "Kb" : "Type", sl.K ? sl.K.toExponential(2) : sl.kind === "N" ? "neutral" : "strong (complete)"], ["Reaction", a.pH < 6.95 ? "acidic" : a.pH > 7.05 ? "alkaline" : "neutral"]];
    },
  };

  /* =========================================================================== 2. SOLUBILITY CURVES */
  const TT = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const SALT = {
    KNO3: { name: "KNO₃", col: "#ff6b4a", d: [13.3, 20.9, 31.6, 45.8, 63.9, 85.5, 110, 138, 169, 202, 246] },
    NH4Cl: { name: "NH₄Cl", col: "#ffd27a", d: [29.4, 33.3, 37.2, 41.4, 45.8, 50.4, 55.3, 60.2, 65.6, 71.3, 77.3] },
    KCl: { name: "KCl", col: "#7fd36a", d: [28.0, 31.2, 34.2, 37.2, 40.1, 42.6, 45.8, 48.3, 51.3, 54.0, 56.3] },
    NaCl: { name: "NaCl", col: "#6fa8ff", d: [35.7, 35.8, 36.0, 36.3, 36.6, 37.0, 37.3, 37.8, 38.4, 39.0, 39.8] },
  };
  function Sol(k, t) { const d = SALT[k].d, x = clamp(t, 0, 100) / 10, i = Math.min(9, Math.floor(x)); return lerp(d[i], d[i + 1], x - i); }

  C3.scenes.solubilityCurve = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[-0.6, 4.4, 15], [-1.6, 2.1, 0]],
    values: { salt: "KNO3", Tset: 20, stir: 1 },
    state: () => ({ t: 0, m: 0, d: 0, T: 20, msg: "" }),
    controls: [
      { type: "select", key: "salt", label: "Salt", options: Object.keys(SALT).map((k) => ({ value: k, label: SALT[k].name })) },
      { type: "range", key: "Tset", label: "Hot-plate temperature setting (°C)", min: 0, max: 100, step: 1, unit: " °C" },
      { type: "button", label: "+ 5 g salt (in 100 g water)", action: (S, s) => { s.m += 5; } },
      { type: "button", label: "+ 20 g salt", action: (S, s) => { s.m += 20; }, cls: "secondary" },
      { type: "button", label: "Fresh 100 g water", action: (S, s, c) => { s.m = 0; s.d = 0; s.pre && s.pre.reset(); } , cls: "secondary" },
      { type: "button", label: "Demo: cool a hot saturated KNO₃ solution", action: (S, s, c, ref) => { c.salt = "KNO3"; c.Tset = 80; s.T = 80; s.m = Math.round(Sol("KNO3", 80)) - 5; s.d = s.m; s.pre && s.pre.reset(); ref(); s.msg = "Now slide the setting down to 20 °C and watch the crystals form"; } },
      { type: "toggle", key: "stir", label: "Stir" },
    ],
    views: [{ label: "Bench", cam: [[-0.6, 4.4, 15], [-1.6, 2.1, 0]] }, { label: "Beaker", cam: [[-3.4, 2.4, 7.2], [-3.4, 1.2, 0]] }, { label: "Crystals", cam: [[-3.4, 1.0, 4.4], [-3.4, 0.35, 0]] }],
    note: "Solubility is the mass of salt that dissolves in 100 g of water at a given temperature to give a saturated solution. A point below the curve is unsaturated (all dissolves); on the curve it is saturated; above it the excess cannot dissolve and sits as crystals. KNO₃ rises steeply with temperature, NaCl hardly changes — so cooling a hot saturated solution crystallises KNO₃ but not NaCl.",
    onChange(S, s, c, key) { if (key === "salt") { s.m = 0; s.d = 0; s.pre && s.pre.reset(); s.msg = ""; } },
    reset(S, s, c) { Object.assign(c, { salt: "KNO3", Tset: 20, stir: 1 }); s.m = 0; s.d = 0; s.T = 20; s.msg = ""; s.pre && s.pre.reset(); },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; K.contact(-3.4, 0, 0, 5.6, 0.55);
      s.plate = S.mk.cyl(2.2, 2.3, 0.4, M.paint(0x2b2f36), -3.4, 0.2, 0); s.coil = new T.Mesh(new T.RingGeometry(0.5, 1.9, 48), new T.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: 0, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false })); s.coil.rotation.x = -Math.PI / 2; s.coil.position.set(-3.4, 0.405, 0); S.scene.add(s.coil);
      s.bk = K.beaker(); s.bk.group.position.set(-3.4, 0.42, 0); s.liq = s.bk.addLiquid({ color: 0xcfe8f5, opacity: 0.26 }); s.liq.setVolume(100);
      s.pre = K.precipitate(s.bk, s.liq, { n: 1500, size: 0.05, color: 0xffffff });
      /* thermometer: glass rod with a red column */
      s.th = S.mk.cyl(0.035, 0.035, 2.2, K.glassMat({ opacity: 0.25 }), -3.0, 1.55, 0.2); s.col = S.mk.cyl(0.018, 0.018, 1, M.matte(0xd8242a, 0.3), -3.0, 0.6, 0.2);
      S.mk.cyl(0.07, 0.07, 0.09, M.matte(0xd8242a, 0.3), -3.0, 0.58, 0.2);
      /* salt jar */
      S.mk.cyl(0.55, 0.55, 1.3, K.glassMat({ opacity: 0.18 }), -0.2, 0.65, 0.6); s.jar = S.mk.cyl(0.5, 0.5, 0.9, M.matte(0xf4f4ee, 0.6), -0.2, 0.45, 0.6); S.mk.cyl(0.58, 0.58, 0.18, M.paint(0x2b6fd6), -0.2, 1.4, 0.6);
      s.msg = s.msg || ""; s.swirl = 0; s.stirRod = S.mk.rod(V3(-3.4, 0.6, 0), V3(-3.4, 2.3, 0), 0.05, M.chrome());
    },
    update(S, s, c, dt) {
      s.t += dt; const k = c.salt, Tn = s.T;
      s.T += (c.Tset - s.T) * (1 - Math.exp(-dt / 5)); if (dt === 0 && Math.abs(s.T - c.Tset) < 20 && s.t < 0.01) s.T = c.Tset;
      const target = Math.min(s.m, Sol(k, s.T)), rate = c.stir ? 8 : 3; if (s.d < target) s.d = Math.min(target, s.d + rate * dt); else if (s.d > target) s.d = Math.max(target, s.d - 10 * dt);
      const ex = Math.max(0, s.m - s.d); s.ex = ex; s.pre.amount = ex / 60; s.pre.mat.opacity = 0.9; s.pre.update(dt);
      const SS = Sol(k, s.T); s.S = SS; s.state = s.m <= 0 ? "empty" : s.m < SS - 0.3 ? "unsaturated" : ex > 0.3 || s.d < s.m - 0.3 ? "saturated + excess" : "just saturated";
      s.liq.setColor(0xdbeaf4, 0.24 + Math.min(0.2, s.d / 400)); s.liq.agit = c.stir ? 0.9 : 0; s.liq.update(S.t);
      s.coil.material.opacity += ((c.Tset > s.T + 1 ? 0.15 + 0.6 * (c.Tset / 100) : 0.04) - s.coil.material.opacity) * Math.min(1, dt * 4 + (dt ? 0 : 1));
      const th = 0.5 + 1.5 * (s.T / 100); s.col.scale.y = th; s.col.position.y = 0.6 + th / 2; s.jar.scale.y = clamp(1 - 0.0004 * s.m, 0.3, 1) ;
      s.swirl += c.stir ? dt * 6 : 0; s.stirRod.position.set(c.stir ? Math.cos(s.swirl) * 0.18 : 0.25, 0, c.stir ? Math.sin(s.swirl) * 0.18 : 0.1); s.stirRod.visible = !!c.stir;
    },
    overlay(ctx, s, c, w, h, S) {
      const k = c.salt, SS = s.S; if (SS == null) return;
      H.pill(ctx, 10, 22, "solubility = g of salt per 100 g of water in a saturated solution", "#ffe9b8", 11); H.pill(ctx, 10, 44, "unsaturated: m < S   ·   saturated: m = S   ·   excess crystals = m − S   (S at temperature T)", "#bcd0ea", 9.5);
      const bq = S.proj(V3(-3.4, 2.6, 0)); H.pill(ctx, bq.x, clamp(bq.y - 4, 62, 300) - 12, s.m.toFixed(0) + " g " + SALT[k].name + " + 100 g water", "#cfe0ff", 10, "center");
      H.pill(ctx, 10, 344, "water " + s.T.toFixed(0) + " °C   (setting " + c.Tset + " °C)", "#ff9d8a", 10.5);
      H.pill(ctx, 10, 366, s.state.toUpperCase() + (s.ex > 0.3 ? "  — " + s.ex.toFixed(1) + " g undissolved" : ""), s.state === "unsaturated" ? "#9fe3ff" : s.state === "empty" ? "#bcd0ea" : "#ffd27a", 11);
      if (s.msg) H.pill(ctx, 10, 386, s.msg, "#7dffbd", 10.5);
      /* the solubility graph */
      const gx = 388, gy = 56, gw = 250, gh = 218, ymax = 250, series = Object.keys(SALT).map((q) => ({ pts: TT.map((t, i) => [t, SALT[q].d[i]]), color: q === k ? SALT[q].col : SALT[q].col.replace(")", ""), width: q === k ? 3 : 1.4 }));
      H.graph(ctx, gx, gy, gw, gh, { series, xmin: 0, xmax: 100, ymin: 0, ymax, ticksX: 5, ticksY: 5, xl: "temperature / °C", yl: "g per 100 g water" });
      const X0 = gx + 34, Y0 = gy + 16, PW = gw - 46, PH = gh - 40, X = (t) => X0 + (t / 100) * PW, Y = (v) => Y0 + PH - (v / ymax) * PH;
      ctx.save(); ctx.font = "600 9px 'IBM Plex Mono',monospace"; Object.keys(SALT).forEach((q, i) => { ctx.fillStyle = SALT[q].col; ctx.textAlign = "left"; ctx.fillText(SALT[q].name, X0 + 6, Y0 + 12 + i * 11); });
      ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.textAlign = "right"; ctx.fillText("above the curve: excess crystals", X0 + PW - 4, Y0 + PH - 6);
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(X(s.T), Y0); ctx.lineTo(X(s.T), Y0 + PH); ctx.stroke(); ctx.setLineDash([]);
      const my = clamp(s.m, 0, ymax); ctx.fillStyle = s.ex > 0.3 ? "#ff9d8a" : "#7dff9d"; ctx.beginPath(); ctx.arc(X(s.T), Y(my), 5, 0, TAU); ctx.fill(); ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "#ffd27a"; ctx.beginPath(); ctx.arc(X(s.T), Y(SS), 4, 0, TAU); ctx.fill(); ctx.restore();
      H.pill(ctx, gx + gw, gy + gh + 17, "● your mixture   ● S at T", "#cfe0ff", 9.5, "right");
    },
    readouts(s, c) {
      if (s.S == null) return [];
      return [["Salt", SALT[c.salt].name], ["Water temperature", s.T.toFixed(1) + " °C"], ["Solubility S at this T", s.S.toFixed(1) + " g/100 g"], ["Salt added m", s.m.toFixed(0) + " g"], ["Dissolved", s.d.toFixed(1) + " g"], ["Undissolved crystals", s.ex.toFixed(1) + " g"], ["State", s.state], ["Concentration (saturated)", (s.S / (100 + s.S) * 100).toFixed(1) + " % by mass"]];
    },
    steps(s, c) { const st = s.state; return [["Choose a salt and set the water temperature", "done"], ["Add salt 5 g at a time, stirring, until some stays undissolved — the solution is saturated", st === "empty" ? "now" : st === "unsaturated" ? "now" : "done"], ["Read S from the curve at this temperature and compare with the mass you added", st === "saturated + excess" || st === "just saturated" ? "now" : ""], ["Change the temperature: heating dissolves more; cooling a saturated solution deposits crystals (m − S)", ""]]; },
  };
})();
