/* c3d-dilution.js — chemistry 3D, new module: preparing solutions (dilution C₁V₁ = C₂V₂, and standard solution from a solid) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, CM = C3.CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const VF = 250, MARK_CM = 16; /* 250 cm³ volumetric flask; mark on the neck */
  const FLASK = {
    inner: [[0, 0.3], [2.1, 0.3], [2.9, 0.6], [3.3, 2.2], [3.3, 4.4], [2.9, 6.6], [1.7, 8.6], [0.85, 10.2], [0.8, 10.8], [0.8, 22]],
    outer: [[0, 0], [2.2, 0], [3.05, 0.4], [3.45, 2.2], [3.45, 4.4], [3.05, 6.6], [1.85, 8.6], [1.0, 10.2], [0.95, 10.8], [0.95, 22], [1.1, 22.3]],
  };
  const SOL = {
    cu: { n: "copper(II) sulfate, CuSO₄·5H₂O", M: 249.7, col: [50, 130, 235], k: 1.5 },
    mn: { n: "potassium manganate(VII), KMnO₄", M: 158.0, col: [170, 25, 130], k: 70 },
    cr: { n: "potassium dichromate(VI), K₂Cr₂O₇", M: 294.2, col: [240, 140, 20], k: 9 },
  };
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const fmt = (v, d) => (v >= 0.1 ? v.toFixed(d == null ? 3 : d) : v.toPrecision(2));
  const conc = (s) => (s.vol > 0 ? (s.n * 1000) / s.vol : 0); /* mol/dm³ */
  function reset(s, c) { s.n = 0; s.vol = 0; s.pend = 0; s.pendN = 0; s.mix = 1; s.mixing = 0; s.stock = 180; s.msg = ""; s.solid = c.mode === "std" ? 1 : 0; s.done = false; s.hist = []; }
  const sol = (c) => SOL[c.sol] || SOL.cu;

  C3.scenes.dilutionPrep = {
    env: "chemlab", envOpts: { w: 30, d: 11, wallH: 30, shadowArea: 12 }, envI: 0.75, fov: 38, free: true,
    cam: [[3.6, 2.8, 9.8], [1.2, 1.9, 0]],
    values: { mode: "dil", sol: "cu", c1: 1.0, c2: 0.2, V1: 20, m: 3.0 },
    state: () => ({ n: 0, vol: 0, pend: 0, pendN: 0, mix: 1, mixing: 0, stock: 180, msg: "", solid: 0, hist: [] }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Method", options: [{ value: "dil", label: "Dilute a stock solution (C₁V₁ = C₂V₂)" }, { value: "std", label: "Standard solution from a solid (c = m ÷ MV)" }] },
        { type: "select", key: "sol", label: "Solute", options: Object.keys(SOL).map((k) => ({ value: k, label: SOL[k].n })) },
        { type: "range", key: "c1", label: "Stock concentration C₁ (mol/dm³)", min: 0.2, max: 2.0, step: 0.1, unit: " mol/dm³" },
        { type: "range", key: "c2", label: "Target concentration C₂ (mol/dm³)", min: 0.02, max: 0.5, step: 0.01, unit: " mol/dm³" },
        { type: "range", key: "V1", label: "Pipette volume V₁ (cm³)", min: 1, max: 50, step: 1, unit: " cm³" },
        { type: "range", key: "m", label: "Mass of solid weighed (g)", min: 0.1, max: 10, step: 0.1, unit: " g" },
        { type: "button", label: "Transfer the solute into the flask", action: (S, s, c) => { if (s.n > 0) { s.msg = "Solute is already in the flask"; return; } if (c.mode === "dil") { if (s.stock < c.V1) { s.msg = "Not enough stock left"; return; } s.pend += c.V1; s.pendN += (c.c1 * c.V1) / 1000; s.stock -= c.V1; } else { s.pend += 100; s.pendN += c.m / sol(c).M; s.solid = 0; } s.mix = 0; s.msg = ""; } },
        { type: "button", label: "Add distilled water quickly (to about 1 cm below the mark)", action: (S, s) => { if (s.n <= 0 && s.pendN <= 0) { s.msg = "Put the solute in first"; return; } const room = VF - 1 - (s.vol + s.pend); if (room > 0) s.pend += room; s.mix = Math.min(s.mix, 0.0); s.msg = ""; } },
        { type: "button", label: "+ 1 drop (≈ 0.05 cm³)", action: (S, s) => { s.pend += 0.05; s.msg = ""; } },
        { type: "button", label: "+ 1 cm³", cls: "secondary", action: (S, s) => { s.pend += 1; s.msg = ""; } },
        { type: "button", label: "Stopper and invert to mix", action: (S, s) => { s.mixing = 1; s.msg = ""; } },
        { type: "button", label: "Empty flask and start again", cls: "secondary", action: (S, s, c, ref) => { reset(s, c); ref(); } },
      ];
    },
    views: [{ label: "Bench", cam: [[3.6, 2.8, 9.8], [1.2, 1.9, 0]] }, { label: "Flask neck", cam: (S, s) => [[1.4, MARK_CM * CM + 0.15, 2.6], [0.6, MARK_CM * CM, 0]] }],
    note: "Preparing an accurate solution. Dilution: the amount of solute does not change when water is added, so n = C₁V₁ = C₂V₂ and V₁ = C₂V₂ ÷ C₁. Use a pipette for V₁ and a volumetric flask for V₂. From a solid: n = m ÷ M and c = n ÷ V. Dissolve the solid in a little water, rinse everything into the flask, fill to about 1 cm below the mark, then add the last water drop by drop until the bottom of the meniscus sits on the mark at eye level, then stopper and invert several times. Colours follow the Beer–Lambert law, so a more dilute solution is paler; the visible layering before mixing is illustrative.",
    onChange(S, s, c, key) { if (key === "mode" || key === "sol") { reset(s, c); } },
    reset(S, s, c) { Object.assign(c, { mode: "dil", sol: "cu", c1: 1.0, c2: 0.2, V1: 20, m: 3.0 }); reset(s, c); },
    table(s, c) {
      const so = sol(c), V1need = (c.c2 * VF) / c.c1, m = c.c2 * VF / 1000 * so.M;
      return '<table class="c3-table"><tr><th style="text-align:left">Quantity</th><th>value</th></tr>' + (c.mode === "dil" ? "<tr><td style=\"text-align:left\">Amount of solute needed: n = C₂V₂</td><td>" + (c.c2 * VF / 1000).toFixed(4) + " mol</td></tr><tr><td style=\"text-align:left\">Volume of stock needed: V₁ = C₂V₂ ÷ C₁</td><td>" + V1need.toFixed(2) + " cm³</td></tr><tr><td style=\"text-align:left\">Dilution factor</td><td>× " + (c.c1 / c.c2).toFixed(1) + "</td></tr>" : "<tr><td style=\"text-align:left\">Mass for " + c.c2.toFixed(2) + " mol/dm³ in 250 cm³: m = c × V × M</td><td>" + m.toFixed(2) + " g</td></tr><tr><td style=\"text-align:left\">Molar mass M</td><td>" + so.M + " g/mol</td></tr>") + "<tr><td style=\"text-align:left\">Volume of the flask</td><td>250.0 cm³</td></tr></table>";
    },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; K.tile(18);
      s.ves = K.vessel(FLASK); s.ves.group.position.set(1.0, 0.0, 0); s.fl = s.ves.addLiquid({ color: 0xcfe8f5, opacity: 0.25 }); K.contact(1.0, 0, 0, 4.6, 0.5);
      const ring = new T.Mesh(new T.TorusGeometry(1.0 * CM, 0.012, 8, 48), new T.MeshBasicMaterial({ color: 0x101418 })); ring.rotation.x = Math.PI / 2; ring.position.set(1.0, MARK_CM * CM, 0); S.scene.add(ring);
      s.stk = K.beaker(); s.stk.group.position.set(-2.2, 0, 0.3); s.sl = s.stk.addLiquid({ color: 0x3282eb, opacity: 0.5 }); K.contact(-2.2, 0, 0.3, 4, 0.5);
      s.drop = K.drops({ color: 0xcfe8f5 });
      /* pipette (decor) hovering above the flask mouth */
      s.pip = new T.Group(); const pg = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 3.0, 14, 1, true), new T.MeshPhysicalMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.28, roughness: 0.05, side: T.DoubleSide, depthWrite: false })); pg.position.y = 1.5; s.pip.add(pg);
      const bulb = new T.Mesh(new T.SphereGeometry(0.19, 20, 14), new T.MeshPhysicalMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.3, roughness: 0.05, depthWrite: false })); bulb.scale.y = 1.7; bulb.position.y = 1.6; s.pip.add(bulb); const pl = new T.Mesh(new T.CylinderGeometry(0.19, 0.19, 0.5, 18), new T.MeshBasicMaterial({ color: 0x3282eb, transparent: true, opacity: 0.55 })); pl.position.y = 1.6; s.pip.add(pl); s.pipL = pl; s.pip.position.set(-0.4, 4.6, 0.3); s.pip.rotation.z = -0.12; S.scene.add(s.pip);
      s.solid3 = new T.Mesh(new T.SphereGeometry(0.4, 24, 14), M.matte(0x3282eb, 0.7)); s.solid3.scale.y = 0.35; s.solid3.position.set(-3.7, 0.15, -0.4); S.scene.add(s.solid3);
      const w = K.bottle({ label: "H₂O", sub: "distilled" }); w.position.set(-4.6, 0, -2.6);
      reset(s, c);
    },
    update(S, s, c, dt) {
      const so = sol(c), dil = c.mode === "dil"; s.solid3.visible = !dil && s.solid > 0; s.solid3.scale.set(0.4 + 0.1 * c.m / 10, 0.35, 0.4 + 0.1 * c.m / 10); s.solid3.material.color.setRGB(so.col[0] / 255, so.col[1] / 255, so.col[2] / 255);
      /* liquids flowing in */
      if (s.pend > 0 && dt > 0) { const rate = s.pend > 3 ? 30 : 8, dv = Math.min(s.pend, rate * dt); s.vol += dv; s.pend -= dv; if (s.pendN > 0) { const f = dv / (dv + s.pend); const dn = s.pendN * f; s.n += dn; s.pendN -= dn; } s.mix = Math.min(s.mix, 0.0); }
      if (s.mixing > 0 && dt > 0) { s.mixing -= dt / 1.4; s.mix = clamp(1 - s.mixing, 0, 1); s.ves.group.rotation.z = Math.sin(s.mixing * 14) * 0.5 * (s.mixing > 0 ? 1 : 0); if (s.mixing <= 0) { s.mix = 1; s.ves.group.rotation.z = 0; s.mixing = 0; } }
      const cn = conc(s), cb = cn * 1.0, shown = lerp(cb * 1.6 + 0.0001, cn, s.mix); const op = 1 - Math.exp(-so.k * shown), vv = Math.max(s.vol, 0);
      s.fl.setVolume(vv > 0 ? vv : 0.01); s.fl.setColor(so.col, vv > 0 ? clamp(0.04 + 0.78 * op, 0.05, 0.85) : 0); s.fl.update(S.t);
      s.sl.setColor(dil ? [50, 130, 235] : [255, 255, 255], dil ? clamp(0.04 + 0.78 * (1 - Math.exp(-so.k * c.c1)), 0.1, 0.85) : 0); s.sl.setVolume(dil ? Math.max(0.5, s.stock) : 0.01); s.sl.update(S.t); s.stk.group.visible = dil; s.pip.visible = dil;
      s.pipL.visible = dil; s.pipL.scale.set(1, clamp(c.V1 / 25, 0.1, 2), 1);
      s.pipL.material.color.setRGB(0.2, 0.5, 0.92); s.fl.agit = s.mixing > 0 ? 1 : 0;
      s.over = vv > VF + 0.12; s.onMark = Math.abs(vv - VF) <= 0.1; s.cn = cn;
      if (s.over) s.msg = "overshot the mark: the concentration is now too low; start again"; else if (s.msg.startsWith("overshot")) s.msg = "";
      if (dt > 0 && s.vol > 0 && (s.hist.length === 0 || Math.abs(s.hist[s.hist.length - 1][0] - s.vol) > 2)) s.hist.push([s.vol, cn]);
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const so = sol(c), px = w - 250, dil = c.mode === "dil", V1need = (c.c2 * VF) / c.c1, mneed = c.c2 * VF / 1000 * so.M;
      H.pill(ctx, 10, 22, dil ? "C₁V₁ = C₂V₂   →   V₁ = C₂V₂ ÷ C₁" : "n = m ÷ M      c = n ÷ V", "#ffe9b8", 11);
      H.pill(ctx, 10, 44, dil ? "need V₁ = " + c.c2.toFixed(2) + " × 250 ÷ " + c.c1.toFixed(1) + " = " + V1need.toFixed(1) + " cm³ of stock" : "need m = " + c.c2.toFixed(2) + " × 0.250 × " + so.M + " = " + mneed.toFixed(2) + " g", "#9fe3ff", 10);
      const q = S.proj(V3(1.0, MARK_CM * CM, 0)); H.pill(ctx, q.x - 24, q.y, "250.0 cm³ mark", "#ffe9b8", 9, "right");
      const f = S.proj(V3(1.0, 0.1, 0)); H.pill(ctx, f.x, f.y + 22, "250 cm³ volumetric flask: " + s.vol.toFixed(2) + " cm³", s.over ? "#ff9aa8" : s.onMark ? "#8dffb8" : "#bcd0ea", 9, "center");
      if (dil) { const b = S.proj(V3(-2.2, 1.0, 0.3)); H.pill(ctx, b.x, b.y + 20, "stock " + c.c1.toFixed(1) + " mol/dm³", "#cfe8ff", 9, "center"); }
      const xm = 260, hist = s.hist.length ? s.hist : [[0, 0]], pts = []; const nn = s.n > 0 ? s.n : 0;
      for (let i = 1; i <= 40; i++) { const v = 10 + (xm - 10) * i / 40; if (nn > 0) pts.push([v, nn * 1000 / v]); }
      const cm = Math.max(0.1, nn > 0 ? nn * 1000 / 10 : c.c2 * 2);
      H.graph(ctx, px, 58, 240, 124, { series: [{ pts: nn > 0 ? pts : [], color: "#7dd3ff", width: 2 }], xmin: 0, xmax: xm, ymin: 0, ymax: Math.min(cm, Math.max(c.c1, c.c2 * 2)) * 1.1, ticksX: 4, ticksY: 3, xl: "volume of solution / cm³", yl: "c / mol dm⁻³", dot: nn > 0 ? [clamp(s.vol, 0, xm), Math.min(s.cn, 1e9), "#ffd27a"] : undefined });
      H.panel(ctx, px, 188, 240, 100); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Your solution", px + 8, 203); ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText("n = " + (s.n * 1000).toFixed(2) + " mmol    V = " + s.vol.toFixed(2) + " cm³", px + 8, 218); ctx.fillText("c = n ÷ V = " + (s.cn || 0).toFixed(4) + " mol/dm³", px + 8, 232);
      const err = s.cn > 0 ? ((s.cn - c.c2) / c.c2) * 100 : 0; ctx.fillStyle = s.n > 0 && s.onMark && s.mix >= 1 ? (Math.abs(err) < 2 ? "#8dffb8" : "#ffd27a") : "#9fb2d2"; ctx.font = "8.8px 'IBM Plex Mono',monospace"; wrapT(ctx, s.n <= 0 ? "put the solute in the flask first" : !s.onMark ? "fill to the mark with water (last drops dropwise)" : s.mix < 1 ? "now stopper and invert to mix" : "target " + c.c2.toFixed(3) + " mol/dm³: error " + err.toFixed(1) + " %" + (Math.abs(err) < 2 ? "  ✓ good" : "  ✗ check V₁ / mass"), px + 8, 247, 224, 11);
      if (s.msg) H.pill(ctx, 10, 66, s.msg, "#ff9d8a", 10); ctx.restore();
    },
    readouts(s, c) {
      const so = sol(c), dil = c.mode === "dil"; const base = [["Solute", so.n], ["Flask volume now", s.vol.toFixed(2) + " cm³"], ["Amount of solute in the flask", (s.n * 1000).toFixed(2) + " mmol"], ["Concentration now", (s.cn || 0).toFixed(4) + " mol/dm³"], ["Target", c.c2.toFixed(3) + " mol/dm³"]];
      return dil ? [["V₁ you chose", c.V1 + " cm³"], ["V₁ needed", ((c.c2 * VF) / c.c1).toFixed(2) + " cm³"], ...base, ["Dilution factor", "× " + (c.c1 / c.c2).toFixed(1)]] : [["Mass chosen", c.m.toFixed(1) + " g"], ["Mass needed", (c.c2 * VF / 1000 * so.M).toFixed(2) + " g"], ["n = m ÷ M", (c.m / so.M * 1000).toFixed(2) + " mmol"], ...base];
    },
    steps(s, c) {
      const dil = c.mode === "dil", st = (d, n) => (d ? "done" : n ? "now" : ""), have = s.n > 0 || s.pendN > 0;
      return [[dil ? "Calculate V₁ = C₂V₂ ÷ C₁ and set the pipette" : "Calculate and weigh the mass m = c × V × M", "done"], [dil ? "Pipette the stock solution into the volumetric flask" : "Dissolve the solid in a little water and transfer it with rinsings", st(have, true)], ["Add distilled water to about 1 cm below the mark", st(have && s.vol > 245, have)], ["Add the last water dropwise: meniscus bottom on the mark", st(s.onMark, s.vol > 245)], ["Stopper and invert to mix, then compare with the target", st(s.onMark && s.mix >= 1 && s.n > 0, s.onMark)]];
    },
  };
})();
