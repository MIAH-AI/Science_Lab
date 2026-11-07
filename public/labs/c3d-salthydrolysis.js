/* c3d-salthydrolysis.js — chemistry 3D, new module: salts, hydrolysis and the pH of salt solutions */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const KW = 1e-14;
  /* type: n neutral; ac acidic cation (Ka of the cation); bs basic anion (Ka of its conjugate acid → Kb = Kw/Ka) */
  const SALTS = {
    NaCl: { f: "NaCl", n: "sodium chloride", from: "strong acid (HCl) + strong base (NaOH)", t: "n", eq: "no hydrolysis: Na⁺ and Cl⁻ do not react with water" },
    KNO3: { f: "KNO₃", n: "potassium nitrate", from: "strong acid (HNO₃) + strong base (KOH)", t: "n", eq: "no hydrolysis: K⁺ and NO₃⁻ do not react with water" },
    Na2SO4: { f: "Na₂SO₄", n: "sodium sulfate", from: "strong acid (H₂SO₄) + strong base (NaOH)", t: "n", eq: "no hydrolysis (SO₄²⁻ is the ion of a strong acid)" },
    NH4Cl: { f: "NH₄Cl", n: "ammonium chloride", from: "strong acid (HCl) + weak base (NH₃)", t: "ac", Ka: 5.6e-10, eq: "NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺   (solution is acidic)" },
    AlCl3: { f: "AlCl₃", n: "aluminium chloride", from: "strong acid (HCl) + weak base (Al(OH)₃)", t: "ac", Ka: 1.0e-5, eq: "[Al(H₂O)₆]³⁺ + H₂O ⇌ [Al(H₂O)₅OH]²⁺ + H₃O⁺   (acidic)" },
    CuSO4: { f: "CuSO₄", n: "copper(II) sulfate", from: "strong acid (H₂SO₄) + weak base (Cu(OH)₂)", t: "ac", Ka: 4e-8, eq: "[Cu(H₂O)₆]²⁺ + H₂O ⇌ [Cu(H₂O)₅OH]⁺ + H₃O⁺   (weakly acidic)" },
    CH3COONa: { f: "CH₃COONa", n: "sodium ethanoate", from: "weak acid (CH₃COOH) + strong base (NaOH)", t: "bs", Ka: 1.8e-5, eq: "CH₃COO⁻ + H₂O ⇌ CH₃COOH + OH⁻   (solution is alkaline)" },
    Na2CO3: { f: "Na₂CO₃", n: "sodium carbonate", from: "weak acid (H₂CO₃) + strong base (NaOH)", t: "bs", Ka: 4.7e-11, eq: "CO₃²⁻ + H₂O ⇌ HCO₃⁻ + OH⁻   (strongly alkaline)" },
  };
  const KEYS = Object.keys(SALTS);
  function pHof(sa, c) {
    if (sa.t === "n") return 7.0;
    if (sa.t === "ac") { const Ka = sa.Ka, x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * c)) / 2; return -Math.log10(x); }
    const Kb = KW / sa.Ka, x = (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * c)) / 2; return 14 + Math.log10(x);
  }
  const UI = [[1, [235, 30, 30]], [3, [240, 90, 30]], [4, [245, 140, 30]], [5, [245, 190, 40]], [6, [225, 225, 50]], [7, [90, 200, 80]], [8, [40, 190, 150]], [9, [40, 130, 210]], [10, [60, 70, 190]], [11, [100, 50, 170]], [13, [130, 30, 150]]];
  function ui(ph) { if (ph <= UI[0][0]) return UI[0][1].slice(); for (let i = 1; i < UI.length; i++) if (ph <= UI[i][0]) { const a = UI[i - 1], b = UI[i], t = (ph - a[0]) / (b[0] - a[0]); return [lerp(a[1][0], b[1][0], t), lerp(a[1][1], b[1][1], t), lerp(a[1][2], b[1][2], t)]; } return UI[UI.length - 1][1].slice(); }
  const kindOf = (ph) => (ph < 6.5 ? "acidic" : ph > 7.5 ? "alkaline" : "neutral");
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const NI = 70;

  C3.scenes.saltHydrolysis = {
    env: "chemlab", envOpts: { w: 30, d: 11, wallH: 30, shadowArea: 12 }, envI: 0.75, fov: 38, free: true, cam: [[1.6, 2.4, 8.0], [0.7, 1.3, 0]],
    values: { mode: "one", salt: "NH4Cl", c: 0.1 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "View", options: [{ value: "one", label: "One salt in a beaker (with ions, litmus and pH meter)" }, { value: "all", label: "Compare all eight salts with universal indicator" }] },
        { type: "select", key: "salt", label: "Salt", options: KEYS.map((k) => ({ value: k, label: SALTS[k].n + " (" + SALTS[k].f + ")" })) },
        { type: "range", key: "c", label: "Concentration of the salt (mol/dm³)", min: 0.01, max: 1, step: 0.01, unit: " mol/dm³" },
      ];
    },
    views: [{ label: "Bench", cam: [[1.6, 2.4, 8.0], [0.7, 1.3, 0]] }, { label: "Close", cam: [[1.4, 1.9, 5.2], [0.9, 1.2, 0]] }],
    note: "A salt solution is not always neutral. It depends on the parent acid and base. Strong acid + strong base gives a neutral salt (pH 7). Strong acid + weak base gives an acidic salt: the cation donates H⁺ to water (NH₄⁺, hydrated Al³⁺ and Cu²⁺). Weak acid + strong base gives an alkaline salt: the anion takes H⁺ from water, leaving OH⁻ (CH₃COO⁻, CO₃²⁻). The pH here comes from the equilibrium constant of the hydrolysis: for an acidic cation [H⁺] = √(Ka·c), for a basic anion [OH⁻] = √(Kb·c) with Kb = Kw ÷ Ka (solved exactly with the quadratic). Universal-indicator colours are approximate.",
    onChange(S, s, c, key) { },
    reset(S, s, c) { Object.assign(c, { mode: "one", salt: "NH4Cl", c: 0.1 }); },
    table(s, c) {
      return '<table class="c3-table"><tr><th style="text-align:left">Salt</th><th style="text-align:left">Made from</th><th>pH at ' + c.c.toFixed(2) + ' M</th><th>solution</th></tr>' + KEYS.map((k) => { const sa = SALTS[k], ph = pHof(sa, c.c); return '<tr><td style="text-align:left">' + sa.n + " (" + sa.f + ')</td><td style="text-align:left">' + sa.from + "</td><td>" + ph.toFixed(2) + "</td><td>" + kindOf(ph) + "</td></tr>"; }).join("") + "</table>";
    },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; K.tile(18); s.softTex = U.softDot(64, "rgba(255,255,255,1)");
      s.bk = K.beaker(); s.bk.group.position.set(0.6, 0.0, 0); s.bl = s.bk.addLiquid({ color: 0x90c8f0, opacity: 0.3 }); s.bl.setVolume(210); K.contact(0.6, 0, 0, 3.6, 0.5);
      /* ions inside the beaker */
      s.im = [0xffa070, 0x70d0ff, 0xff5a5a, 0x5a8aff].map((col, i) => { const m = new T.InstancedMesh(new T.SphereGeometry(i < 2 ? 0.05 : 0.036, 10, 8), new T.MeshStandardMaterial({ color: col, roughness: 0.3 }), NI); m.frustumCulled = false; S.scene.add(m); return m; });
      s.ip = Array.from({ length: NI * 4 }, () => ({ x: (Math.random() * 2 - 1) * 0.42, y: Math.random() * 0.9 + 0.12, z: (Math.random() * 2 - 1) * 0.42, vx: Math.random() * 2 - 1, vy: Math.random() * 2 - 1, vz: Math.random() * 2 - 1 })); s.m4 = new T.Matrix4();
      /* litmus strips */
      const strip = (x, col) => { const m = new T.Mesh(new T.BoxGeometry(0.1, 1.0, 0.012), new T.MeshStandardMaterial({ color: col, roughness: 0.9 })); m.position.set(x, 1.55, 0); S.scene.add(m); return m; };
      s.rl = strip(-1.3, 0xd23a3a); s.bl2 = strip(-1.0, 0x3a52d2);
      s.pm = new T.Group(); const body = new T.Mesh(new T.BoxGeometry(0.5, 0.8, 0.3), M.matte(0x2c3340, 0.4)); body.position.y = 0.5; s.pm.add(body); const el = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1.6, 10), M.matte(0xdde6f0, 0.2)); el.position.set(-0.3, 1.0, 0); s.pm.add(el); s.pm.position.set(-2.2, 0.2, 0.3); S.scene.add(s.pm);
      /* compare tubes */
      s.tubes = KEYS.map((k, i) => { const v = K.vessel("testtube"); v.group.position.set(-3.2 + i * 0.6, 0.0, 0); const l = v.addLiquid({ color: 0x90c8f0, opacity: 0.4 }); l.setVolume(12); return { v, l }; });
      s.rack = S.mk.box(5.0, 0.06, 0.6, M.matte(0x7a5330, 0.6), 0.0 + 0.0, 0.03, 0); s.rack.position.x = -3.2 + 3.5 * 0.6;
    },
    update(S, s, c, dt) {
      const one = c.mode === "one", sa = SALTS[c.salt], ph = pHof(sa, c.c), col = ui(ph); s.ph = ph;
      s.bk.group.visible = one; s.im.forEach((m) => (m.visible = one)); s.rl.visible = s.bl2.visible = one; s.pm.visible = one; s.tubes.forEach((t) => (t.v.group.visible = !one)); s.rack.visible = !one;
      if (one) {
        s.bl.setColor(col, 0.55); s.bl.update(S.t); const k2 = ph < 6.5 ? 1 : 0, alk = ph > 7.5 ? 1 : 0;
        s.rl.material.color.setRGB(alk ? 0.2 : 0.82, alk ? 0.3 : 0.23, alk ? 0.85 : 0.23); s.bl2.material.color.setRGB(k2 ? 0.82 : 0.23, k2 ? 0.23 : 0.32, k2 ? 0.23 : 0.82);
        const nH = Math.round(clamp(Math.abs(ph - 7) * 11, 0, NI)), counts = [Math.round(clamp(c.c * 55, 6, NI)), Math.round(clamp(c.c * 55, 6, NI)), ph < 7 ? nH : 0, ph > 7 ? nH : 0], m4 = s.m4, dts = Math.min(dt, 0.05);
        for (let g = 0; g < 4; g++) { let n = 0; for (let i = 0; i < NI; i++) { const q = s.ip[g * NI + i]; if (dts > 0) { q.x += q.vx * dts * 0.5; q.y += q.vy * dts * 0.5; q.z += q.vz * dts * 0.5; if (Math.abs(q.x) > 0.5) { q.vx *= -1; q.x = Math.sign(q.x) * 0.5; } if (q.y > 1.0 || q.y < 0.12) { q.vy *= -1; q.y = clamp(q.y, 0.12, 1.0); } if (Math.abs(q.z) > 0.5) { q.vz *= -1; q.z = Math.sign(q.z) * 0.5; } } if (i < counts[g]) { m4.makeTranslation(0.6 + q.x, q.y, q.z); s.im[g].setMatrixAt(n++, m4); } } s.im[g].count = n; s.im[g].instanceMatrix.needsUpdate = true; }
      } else s.tubes.forEach((t, i) => { const p = pHof(SALTS[KEYS[i]], c.c), cc = ui(p); t.l.setColor(cc, 0.62); t.l.update(S.t); t.ph = p; });
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250, sa = SALTS[c.salt], ph = s.ph == null ? pHof(sa, c.c) : s.ph, kd = kindOf(ph);
      if (c.mode === "one") {
        H.pill(ctx, 10, 22, sa.n + " (" + sa.f + ", " + c.c.toFixed(2) + " mol/dm³)", "#ffe9b8", 11); H.pill(ctx, 10, 44, "made from " + sa.from, "#9fe3ff", 9.5);
        const b = S.proj(V3(0.6, 1.6, 0)); H.pill(ctx, b.x, b.y, "universal indicator: " + kd, "#" + ui(ph).map((v) => Math.round(v).toString(16).padStart(2, "0")).join(""), 9, "center");
        const pm = S.proj(V3(-2.2, 1.7, 0)); H.pill(ctx, pm.x, pm.y, "pH meter: " + ph.toFixed(2), "#ffd27a", 10, "center"); const l1 = S.proj(V3(-1.15, 2.2, 0)); H.pill(ctx, l1.x, l1.y, ph > 7.5 ? "red litmus → blue" : "red litmus: no change", "#bcd0ea", 8, "center"); const l2 = S.proj(V3(-1.15, 0.85, 0)); H.pill(ctx, l2.x, l2.y, ph < 6.5 ? "blue litmus → red" : "blue litmus: no change", "#bcd0ea", 8, "center");
        H.panel(ctx, px, 58, 240, 120); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Hydrolysis", px + 8, 73); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; const y = wrapT(ctx, sa.eq, px + 8, 89, 224, 11); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.4px 'IBM Plex Mono',monospace"; wrapT(ctx, sa.t === "n" ? "Neither ion is the conjugate of a weak acid or base, so the water equilibrium is undisturbed: [H⁺] = [OH⁻]." : sa.t === "ac" ? "Weak base cation: [H⁺] = √(Ka·c) with Ka = " + sa.Ka.toExponential(1) + ". The H₃O⁺ makes it acidic." : "Weak acid anion: Kb = Kw ÷ Ka = " + (KW / sa.Ka).toExponential(1) + ", [OH⁻] = √(Kb·c). The OH⁻ makes it alkaline.", px + 8, y + 16, 224, 10.5);
        H.panel(ctx, px, 184, 240, 98); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("pH scale", px + 8, 199); const x0 = px + 10, x1 = px + 230; for (let i = 0; i < 100; i++) { const cc = ui((i / 99) * 13 + 0.5); ctx.fillStyle = "rgb(" + cc.map(Math.round).join(",") + ")"; ctx.fillRect(x0 + (x1 - x0) * i / 100, 210, (x1 - x0) / 100 + 1, 14); } const mx = x0 + (x1 - x0) * clamp((ph - 0.5) / 13, 0, 1); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(mx, 226); ctx.lineTo(mx - 5, 236); ctx.lineTo(mx + 5, 236); ctx.fill(); ctx.fillStyle = "#e8f0ff"; ctx.font = "8px 'IBM Plex Mono',monospace"; ["1", "7", "13"].forEach((t, i) => ctx.fillText(t, x0 + (x1 - x0) * [0.0, 0.5, 1.0][i] - 2, 248)); ctx.fillStyle = "#ffd27a"; ctx.font = "600 10px 'IBM Plex Mono',monospace"; ctx.fillText("pH = " + ph.toFixed(2) + "  (" + kd + ")", px + 8, 266);
      } else {
        H.pill(ctx, 10, 22, "Eight salts with universal indicator at " + c.c.toFixed(2) + " mol/dm³", "#ffe9b8", 11); H.pill(ctx, 10, 44, "strong+strong: neutral · strong acid+weak base: acidic · weak acid+strong base: alkaline", "#9fe3ff", 9);
        (s.tubes || []).forEach((t, i) => { const q = S.proj(V3(-3.2 + i * 0.6, 0.1, 0)); H.pill(ctx, q.x, q.y + 14 + (i % 2) * 12, SALTS[KEYS[i]].f, "#bcd0ea", 8, "center"); const q2 = S.proj(V3(-3.2 + i * 0.6, 2.0, 0)); H.pill(ctx, q2.x, q2.y - (i % 2) * 12, (t.ph || 7).toFixed(1), "#ffd27a", 8.5, "center"); });
        H.panel(ctx, px, 58, 240, 150); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("pH of the salts", px + 8, 73); ctx.font = "8.8px 'IBM Plex Mono',monospace"; KEYS.forEach((k, i) => { const p = pHof(SALTS[k], c.c), y = 86 + i * 15; ctx.fillStyle = "#e8f0ff"; ctx.fillText(SALTS[k].f, px + 8, y + 8); ctx.fillStyle = "rgb(" + ui(p).map(Math.round).join(",") + ")"; ctx.fillRect(px + 90, y, clamp(p / 14, 0.05, 1) * 100, 10); ctx.fillStyle = "#e8f0ff"; ctx.fillText(p.toFixed(1), px + 196, y + 8); });
        H.panel(ctx, px, 214, 240, 76); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.8px 'IBM Plex Mono',monospace"; wrapT(ctx, "Lower the concentration and the acidic and alkaline salts move closer to pH 7; the neutral salts do not change.", px + 8, 230, 224, 11);
      }
      ctx.restore();
    },
    readouts(s, c) { const sa = SALTS[c.salt], ph = s.ph == null ? pHof(sa, c.c) : s.ph; return [["Salt", sa.n + " (" + sa.f + ")"], ["Parent acid and base", sa.from], ["pH of " + c.c.toFixed(2) + " mol/dm³", ph.toFixed(2) + " (" + kindOf(ph) + ")"], ["Hydrolysis", sa.eq], ["Litmus", ph > 7.5 ? "red litmus turns blue" : ph < 6.5 ? "blue litmus turns red" : "no change"], ["Ka used", sa.t === "n" ? "none (no hydrolysis)" : sa.Ka.toExponential(1)]]; },
    steps(s, c) { return [["Identify the parent acid and base of the salt", "done"], ["Predict: acidic, neutral or alkaline?", "now"], ["Check with indicator, litmus and the pH meter", ""], ["Write the hydrolysis equation for the ion responsible", ""]]; },
  };
})();
