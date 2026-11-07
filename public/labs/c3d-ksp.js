/* c3d-ksp.js — chemistry 3D, new module: solubility product, common-ion effect and precipitation */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const sup = { "1": "", "2": "²", "3": "³" }, subs = { "1": "", "2": "₂", "3": "₃" };
  const fmt = (v) => { if (v === 0) return "0"; const e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e); return m.toFixed(1) + " × 10" + String(e).replace("-", "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d]); };
  /* salt: M(a)X(b); Ksp at 25 °C (textbook values), Mr, colour of the precipitate */
  const SALT = {
    agcl: { f: "AgCl", M: "Ag", mq: 1, a: 1, X: "Cl", xq: 1, b: 1, ksp: 1.8e-10, Mr: 143.3, col: [240, 240, 240] },
    agbr: { f: "AgBr", M: "Ag", mq: 1, a: 1, X: "Br", xq: 1, b: 1, ksp: 5.0e-13, Mr: 187.8, col: [238, 230, 180] },
    agi: { f: "AgI", M: "Ag", mq: 1, a: 1, X: "I", xq: 1, b: 1, ksp: 8.3e-17, Mr: 234.8, col: [235, 215, 90] },
    baso4: { f: "BaSO₄", M: "Ba", mq: 2, a: 1, X: "SO₄", xq: 2, b: 1, ksp: 1.1e-10, Mr: 233.4, col: [245, 245, 245] },
    pbi2: { f: "PbI₂", M: "Pb", mq: 2, a: 1, X: "I", xq: 1, b: 2, ksp: 7.1e-9, Mr: 461.0, col: [245, 205, 40] },
    caf2: { f: "CaF₂", M: "Ca", mq: 2, a: 1, X: "F", xq: 1, b: 2, ksp: 3.9e-11, Mr: 78.1, col: [240, 240, 240] },
    mgoh2: { f: "Mg(OH)₂", M: "Mg", mq: 2, a: 1, X: "OH", xq: 1, b: 2, ksp: 5.6e-12, Mr: 58.3, col: [238, 242, 244] },
    ag2cro4: { f: "Ag₂CrO₄", M: "Ag", mq: 1, a: 2, X: "CrO₄", xq: 2, b: 1, ksp: 1.1e-12, Mr: 331.7, col: [190, 70, 45] },
  };
  const SK = Object.keys(SALT), VOL = 0.25; /* dm³ of solution */
  const cat = (z) => z.M + (z.mq > 1 ? sup[z.mq] : "") + "⁺", an = (z) => z.X + (z.xq > 1 ? sup[z.xq] : "") + "⁻";
  const ksExpr = (z) => "Ksp = [" + cat(z) + "]" + (z.a > 1 ? sup[z.a] : "") + "[" + an(z) + "]" + (z.b > 1 ? sup[z.b] : "");
  const Q = (z, m, x) => Math.pow(m, z.a) * Math.pow(x, z.b);
  function solve(z, m0, x0) { /* molar solubility s with added common-ion concentrations m0, x0 */
    let lo = 0, hi = 1; for (let i = 0; i < 90; i++) { const mid = (lo + hi) / 2; if (Q(z, z.a * mid + m0, z.b * mid + x0) > z.ksp) hi = mid; else lo = mid; } return (lo + hi) / 2;
  }
  function precip(z, m0, x0) { /* extent x (mol/dm³) of precipitation from m0, x0 */
    if (Q(z, m0, x0) <= z.ksp) return { x: 0, m: m0, xx: x0 }; let lo = 0, hi = Math.min(m0 / z.a, x0 / z.b); for (let i = 0; i < 90; i++) { const mid = (lo + hi) / 2; if (Q(z, m0 - z.a * mid, x0 - z.b * mid) > z.ksp) lo = mid; else hi = mid; } const x = (lo + hi) / 2; return { x, m: m0 - z.a * x, xx: x0 - z.b * x };
  }
  const NMAX = 70;
  const state = (c) => {
    const z = SALT[c.salt];
    if (c.mode === "dissolve") { const m0 = c.common === "cat" ? c.cc : 0, x0 = c.common === "an" ? c.cc : 0, s = solve(z, m0, x0), s0 = solve(z, 0, 0); return { z, m: z.a * s + m0, x: z.b * s + x0, s, s0, ppt: 0, q: Q(z, z.a * s + m0, z.b * s + x0), sat: true }; }
    const m0 = Math.pow(10, c.lm), x0 = Math.pow(10, c.lx), pr = precip(z, m0, x0); return { z, m: pr.m, x: pr.xx, s: 0, s0: solve(z, 0, 0), ppt: pr.x, q0: Q(z, m0, x0), q: Q(z, pr.m, pr.xx), m0, x0, sat: pr.x > 0 };
  };

  C3.scenes.solubilityProduct = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[1.8, 2.0, 7.0], [1.8, 1.1, 0]],
    values: { mode: "dissolve", salt: "agcl", common: "an", cc: 0.0, lm: -4, lx: -4 },
    state: () => ({ t: 0, tm: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Experiment", options: [{ value: "dissolve", label: "Dissolve a sparingly soluble salt (common-ion effect)" }, { value: "mix", label: "Mix two solutions: will a precipitate form? (Q vs Ksp)" }] },
        { type: "select", key: "salt", label: "Salt", options: SK.map((k) => ({ value: k, label: SALT[k].f + "   (Ksp = " + fmt(SALT[k].ksp) + ")" })) },
        { type: "select", key: "common", label: "Common ion added (dissolve mode)", options: [{ value: "an", label: "the negative ion (e.g. add NaCl to AgCl)" }, { value: "cat", label: "the positive ion (e.g. add AgNO₃ to AgCl)" }] },
        { type: "range", key: "cc", label: "Concentration of common ion (mol/dm³)", min: 0, max: 0.1, step: 0.002, unit: " mol/dm³" },
        { type: "range", key: "lm", label: "log₁₀ [positive ion] after mixing (mix mode)", min: -7, max: -1, step: 0.1 },
        { type: "range", key: "lx", label: "log₁₀ [negative ion] after mixing (mix mode)", min: -7, max: -1, step: 0.1 },
      ];
    },
    views: [{ label: "Beaker", cam: [[1.8, 2.0, 7.0], [1.8, 1.1, 0]] }, { label: "Close", cam: [[1.4, 1.6, 4.8], [1.5, 1.0, 0]] }],
    note: "A sparingly soluble salt MₐXᵦ dissolves until the solution is saturated: MₐXᵦ(s) ⇌ aMᶻ⁺(aq) + bXᶻ⁻(aq). At equilibrium the ionic product equals the solubility product, Ksp = [M]ᵃ[X]ᵇ, which depends only on temperature. For AgCl, Ksp = [Ag⁺][Cl⁻], so the molar solubility is s = √Ksp. Adding a common ion raises that ion's concentration, so the other must fall to keep Ksp constant: the salt becomes less soluble (the common-ion effect). When two solutions are mixed, a precipitate forms only if the ionic product Q exceeds Ksp. Ksp values are textbook values at 25 °C; ion counts in the picture use a logarithmic scale because real concentrations are far too small to draw. Activity effects are ignored.",
    onChange(S, s, c, key) { s.tm = 0; },
    reset(S, s, c) { Object.assign(c, { mode: "dissolve", salt: "agcl", common: "an", cc: 0, lm: -4, lx: -4 }); s.tm = 0; },
    table() {
      return '<table class="c3-table"><tr><th style="text-align:left">Salt</th><th style="text-align:left">Ksp expression</th><th style="text-align:left">Ksp (25 °C)</th><th style="text-align:left">Molar solubility</th></tr>' + SK.map((k) => { const z = SALT[k]; return '<tr><td style="text-align:left">' + z.f + '</td><td style="text-align:left">' + ksExpr(z).replace("Ksp = ", "") + '</td><td style="text-align:left">' + fmt(z.ksp) + '</td><td style="text-align:left">' + fmt(solve(z, 0, 0)) + ' mol/dm³</td></tr>'; }).join("") + "</table>";
    },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; S.mk.box(11, 0.1, 4, M.matte(0xb99a74, 0.6), 0.5, -0.05, 0);
      s.bk = K.beaker(); s.bk.group.position.set(0, 0, 0); s.liq = s.bk.addLiquid({ color: 0xe8f2f8, opacity: 0.2 }); s.liq.setVolume(240);
      s.ia = new T.InstancedMesh(new T.SphereGeometry(0.055, 12, 8), new T.MeshStandardMaterial({ color: 0xff9a4a, roughness: 0.3 }), NMAX); s.ib = new T.InstancedMesh(new T.SphereGeometry(0.075, 12, 8), new T.MeshStandardMaterial({ color: 0x4ac8ff, roughness: 0.3 }), NMAX); [s.ia, s.ib].forEach((m) => { m.frustumCulled = false; S.scene.add(m); });
      s.pile = new T.Mesh(new T.SphereGeometry(1, 28, 16), new T.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.9 })); s.pile.position.set(0, 0.2, 0); S.scene.add(s.pile);
      s.pa = []; s.pb = []; for (let i = 0; i < NMAX; i++) { const r = () => Math.random(); s.pa.push({ x: (r() - 0.5) * 1.1, y: 0.3 + r() * 1.1, z: (r() - 0.5) * 1.1, vx: r() - 0.5, vy: r() - 0.5, vz: r() - 0.5 }); s.pb.push({ x: (r() - 0.5) * 1.1, y: 0.3 + r() * 1.1, z: (r() - 0.5) * 1.1, vx: r() - 0.5, vy: r() - 0.5, vz: r() - 0.5 }); }
      s.m4 = new T.Matrix4();
    },
    update(S, s, c, dt) {
      const st = state(c), z = st.z; s.st = st; s.tm += Math.max(0, dt);
      const tb = s.bk.tab, yc = tb.yAt(240), top = yc * C3.CM - 0.1, lo = tb.y0 * C3.CM + 0.1, R = Math.max(0.3, tb.rAt(yc * 0.5) * C3.CM * 0.85);
      const nOf = (conc) => Math.round(clamp((Math.log10(Math.max(conc, 1e-9)) + 8) / 7, 0, 1) * NMAX), na = nOf(st.m), nb = nOf(st.x);
      s.na = na; s.nb = nb; const d0 = Math.min(dt, 0.04), mv = (arr, n, inst, rr) => { for (let i = 0; i < n; i++) { const q = arr[i]; q.x += q.vx * d0 * 0.7; q.y += q.vy * d0 * 0.7; q.z += q.vz * d0 * 0.7; if (q.y > top) { q.y = top; q.vy = -Math.abs(q.vy); } if (q.y < lo) { q.y = lo; q.vy = Math.abs(q.vy); } const r2 = q.x * q.x + q.z * q.z; if (r2 > rr * rr) { const r = Math.sqrt(r2), nx = q.x / r, nz = q.z / r, dv = q.vx * nx + q.vz * nz; if (dv > 0) { q.vx -= 2 * dv * nx; q.vz -= 2 * dv * nz; } q.x = nx * rr; q.z = nz * rr; } s.m4.makeTranslation(q.x, q.y, q.z); inst.setMatrixAt(i, s.m4); } inst.count = n; inst.instanceMatrix.needsUpdate = true; };
      mv(s.pa, na, s.ia, R); mv(s.pb, nb, s.ib, R);
      /* solid and cloud */
      const col = z.col; s.pile.material.color.setRGB(col[0] / 255, col[1] / 255, col[2] / 255);
      let pileK, cloud = 0;
      if (c.mode === "dissolve") { pileK = 0.45; } else { const mass = st.ppt * VOL * z.Mr * 1000; /* mg */ pileK = st.ppt > 0 ? clamp(0.12 + Math.log10(1 + mass) * 0.14, 0.12, 0.6) * clamp(s.tm / 3, 0.05, 1) : 0; cloud = st.ppt > 0 ? clamp(0.8 - s.tm / 5, 0.08, 0.8) * clamp(Math.log10(1 + mass) / 1.5, 0.2, 1) : 0; }
      s.pile.visible = pileK > 0.01; s.pile.scale.set(0.55 * pileK + 0.1, 0.1 * pileK + 0.02, 0.55 * pileK + 0.1);
      s.liq.setColor([232 + (col[0] - 232) * cloud, 242 + (col[1] - 242) * cloud, 248 + (col[2] - 248) * cloud], 0.2 + cloud * 0.6); s.liq.update(S.t);
    },
    overlay(ctx, s, c, w, h, S) {
      const st = s.st || state(c), z = st.z; ctx.save(); ctx.textAlign = "left"; const px = w - 250;
      H.pill(ctx, 10, 22, z.f + "   Ksp = " + fmt(z.ksp) + " (25 °C)", "#ffe9b8", 11); H.pill(ctx, 10, 44, ksExpr(z), "#9fe3ff", 9.5);
      const q = S.proj(V3(0, 2.4, 0)); H.pill(ctx, q.x, q.y, "● " + cat(z) + "   ● " + an(z) + "   (ion counts: log scale)", "#bcd0ea", 8.5, "center");
      if (c.mode === "dissolve") ovDissolve(ctx, s, c, st, w, h, S, px); else ovMix(ctx, s, c, st, w, h, S, px);
      ctx.restore();
    },
    readouts(s, c) {
      const st = s.st || state(c), z = st.z; if (c.mode === "dissolve") return [["Salt", z.f + "  (" + ksExpr(z) + ")"], ["Ksp", fmt(z.ksp)], ["[" + cat(z) + "]", fmt(st.m) + " mol/dm³"], ["[" + an(z) + "]", fmt(st.x) + " mol/dm³"], ["Molar solubility s", fmt(st.s) + " mol/dm³ (" + fmt(st.s * z.Mr * 1000) + " mg/dm³)"], ["Pure-water solubility", fmt(st.s0) + " mol/dm³"], ["Reduced to", (100 * st.s / st.s0).toFixed(1) + " % of pure-water value"]];
      return [["Ionic product Q (initial)", fmt(st.q0)], ["Ksp", fmt(z.ksp)], ["Precipitate?", st.ppt > 0 ? "yes: Q > Ksp" : "no: Q < Ksp (unsaturated)"], ["Mass precipitated", st.ppt > 0 ? (st.ppt * VOL * z.Mr * 1000).toFixed(2) + " mg in 250 cm³" : "0"], ["[" + cat(z) + "] left", fmt(st.m) + " mol/dm³"], ["[" + an(z) + "] left", fmt(st.x) + " mol/dm³"]];
    },
    steps(s, c) { return [["Choose a salt and note its Ksp expression", "done"], ["Add a common ion and watch the solubility fall", c.mode === "dissolve" ? "now" : "done"], ["Switch to mixing and compare Q with Ksp", c.mode === "mix" ? "now" : ""], ["Find the concentration where precipitation just begins", ""]]; },
  };
  function ovDissolve(ctx, s, c, st, w, h, S, px) {
    const z = st.z, pts = []; const ccMax = 0.1; for (let i = 0; i <= 40; i++) { const cc = (ccMax * i) / 40, sv = solve(z, c.common === "cat" ? cc : 0, c.common === "an" ? cc : 0); pts.push([cc, Math.log10(sv)]); }
    const ymin = Math.floor(Math.min(...pts.map((p) => p[1])) - 0.3), ymax = Math.ceil(Math.max(...pts.map((p) => p[1])) + 0.3);
    H.graph(ctx, px, 58, 240, 130, { series: [{ pts, color: "#5ad0ff", width: 2 }], xmin: 0, xmax: ccMax, ymin, ymax, ticksX: 2, ticksY: 3, xl: "common ion / mol dm⁻³", yl: "log₁₀ s", dot: [c.cc, Math.log10(st.s), "#ffd27a"] });
    H.panel(ctx, px, 196, 240, 112); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Common-ion effect", px + 8, 211); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff";
    ctx.fillText("[" + cat(z) + "] = " + fmt(st.m), px + 8, 226); ctx.fillText("[" + an(z) + "] = " + fmt(st.x), px + 8, 240); ctx.fillStyle = "#8dffb8"; ctx.fillText("s = " + fmt(st.s) + " mol/dm³", px + 8, 256); ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; wrapT(ctx, c.cc > 0 ? "Added common ion pushes the equilibrium towards the solid: solubility is " + (100 * st.s / st.s0).toFixed(2) + " % of the pure-water value." : "In pure water s = " + (z.a === 1 && z.b === 1 ? "√Ksp" : "(Ksp / (aᵃbᵇ))^(1/(a+b))") + ".", px + 8, 270, 224, 10);
  }
  function ovMix(ctx, s, c, st, w, h, S, px) {
    const z = st.z, lo = -18, hi = -1, f = (v) => px + 14 + ((v - lo) / (hi - lo)) * 212; H.panel(ctx, px, 58, 240, 130); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("log₁₀ Q  compared with  log₁₀ Ksp", px + 8, 73);
    const y = 118, lq = Math.log10(st.q0), lk = Math.log10(z.ksp); ctx.strokeStyle = "#9fb2d2"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(f(lo), y); ctx.lineTo(f(hi), y); ctx.stroke(); ctx.fillStyle = "rgba(120,200,255,0.18)"; ctx.fillRect(f(lo), y - 18, f(lk) - f(lo), 36); ctx.fillStyle = "rgba(255,150,90,0.18)"; ctx.fillRect(f(lk), y - 18, f(hi) - f(lk), 36); ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#7ab8ff"; ctx.fillText("no precipitate", Math.max((f(lo) + f(lk)) / 2, f(lo) + 36), y - 22); ctx.fillStyle = "#ff9a6a"; ctx.fillText("precipitate", (f(lk) + f(hi)) / 2, y - 22); ctx.fillStyle = "#9fb2d2"; for (let v = -16; v <= -2; v += 2) ctx.fillText(String(v), f(v), y + 28);
    ctx.strokeStyle = "#ffd27a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f(lk), y - 14); ctx.lineTo(f(lk), y + 14); ctx.stroke(); ctx.fillStyle = "#ffd27a"; ctx.fillText("Ksp", f(lk), y + 40); const xq = f(clamp(lq, lo, hi)); ctx.fillStyle = st.ppt > 0 ? "#ff9a6a" : "#7ab8ff"; ctx.beginPath(); ctx.moveTo(xq, y - 3); ctx.lineTo(xq - 5, y - 13); ctx.lineTo(xq + 5, y - 13); ctx.fill(); ctx.fillText("Q", xq, y - 15); ctx.textAlign = "left";
    H.panel(ctx, px, 196, 240, 112); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Will it precipitate?", px + 8, 211); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText("Q = " + fmt(st.q0), px + 8, 226); ctx.fillText("Ksp = " + fmt(z.ksp), px + 8, 240); ctx.fillStyle = st.ppt > 0 ? "#ffb48a" : "#8dffb8"; ctx.fillText(st.ppt > 0 ? "Q > Ksp: " + z.f + " precipitates" : "Q < Ksp: stays dissolved", px + 8, 256); ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText(st.ppt > 0 ? (st.ppt * VOL * z.Mr * 1000).toFixed(2) + " mg of solid forms in 250 cm³" : "no solid forms", px + 8, 270);
  }
})();
