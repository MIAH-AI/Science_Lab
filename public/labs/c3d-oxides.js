/* c3d-oxides.js — chemistry 3D, new module: oxides of the Period 3 elements (basic → amphoteric → acidic) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const UI = [[0, [222, 28, 36]], [3, [240, 88, 30]], [5, [250, 200, 32]], [7, [62, 170, 72]], [9, [40, 112, 204]], [11, [86, 62, 172]], [14, [112, 40, 152]]];
  const uiCol = (pH) => { pH = clamp(pH, 0, 14); let i = 0; while (i < UI.length - 2 && pH > UI[i + 1][0]) i++; const a = UI[i], b = UI[i + 1], t = clamp((pH - a[0]) / (b[0] - a[0]), 0, 1); return a[1].map((v, j) => v + (b[1][j] - v) * t); };
  const css = (rgb) => "rgb(" + rgb.map((v) => Math.round(v)).join(",") + ")";
  const TY = { basic: ["basic", "#7ab8ff"], amph: ["amphoteric", "#8dffb8"], acid: ["acidic", "#ffb48a"] };
  const OX = {
    na2o: { f: "Na₂O", name: "Sodium oxide", type: "basic", bond: "ionic", struct: "ionic", mp: 1275, cond: "conducts when molten", pH: 13.5, solid: 1, soluble: 1, acid: 1, alk: 0, w: "Na₂O + H₂O → 2NaOH", a: "Na₂O + 2HCl → 2NaCl + H₂O", b: "no reaction", cat: 0x9a5ae0 },
    mgo: { f: "MgO", name: "Magnesium oxide", type: "basic", bond: "ionic", struct: "ionic", mp: 2852, cond: "conducts when molten", pH: 9.5, solid: 1, soluble: 0.35, acid: 1, alk: 0, w: "MgO + H₂O → Mg(OH)₂  (slightly soluble)", a: "MgO + 2HCl → MgCl₂ + H₂O", b: "no reaction", cat: 0x7cd05a },
    al2o3: { f: "Al₂O₃", name: "Aluminium oxide", type: "amph", bond: "ionic with covalent character", struct: "ionic", mp: 2072, cond: "conducts when molten", pH: 7, solid: 1, soluble: 0, acid: 1, alk: 1, w: "insoluble in water: pH stays 7", a: "Al₂O₃ + 6HCl → 2AlCl₃ + 3H₂O", b: "Al₂O₃ + 2NaOH + 3H₂O → 2Na[Al(OH)₄]", cat: 0xaab4c0 },
    sio2: { f: "SiO₂", name: "Silicon dioxide", type: "acid", bond: "covalent", struct: "network", mp: 1610, cond: "does not conduct", pH: 7, solid: 1, soluble: 0, acid: 0, alk: 1, w: "insoluble in water: pH stays 7", a: "no reaction", b: "SiO₂ + 2NaOH → Na₂SiO₃ + H₂O  (hot, concentrated)", cat: 0xe0c070 },
    p4o10: { f: "P₄O₁₀", name: "Phosphorus(V) oxide", type: "acid", bond: "covalent, simple molecules", struct: "p4o10", mp: 340, cond: "does not conduct", pH: 1.5, solid: 1, soluble: 1, acid: 0, alk: 1, w: "P₄O₁₀ + 6H₂O → 4H₃PO₄", a: "no reaction", b: "P₄O₁₀ + 12NaOH → 4Na₃PO₄ + 6H₂O", cat: 0xff9a2a },
    so2: { f: "SO₂", name: "Sulphur dioxide", type: "acid", bond: "covalent, simple molecules", struct: "so2", mp: -72, cond: "does not conduct", pH: 3, solid: 0, gas: 1, soluble: 1, acid: 0, alk: 1, w: "SO₂ + H₂O ⇌ H₂SO₃", a: "no reaction", b: "SO₂ + 2NaOH → Na₂SO₃ + H₂O", cat: 0xf2e030 },
    so3: { f: "SO₃", name: "Sulphur trioxide", type: "acid", bond: "covalent, simple molecules", struct: "so3", mp: 17, cond: "does not conduct", pH: 0.5, solid: 0, soluble: 1, acid: 0, alk: 1, w: "SO₃ + H₂O → H₂SO₄", a: "no reaction", b: "SO₃ + 2NaOH → Na₂SO₄ + H₂O", cat: 0xf2e030 },
    cl2o7: { f: "Cl₂O₇", name: "Chlorine(VII) oxide", type: "acid", bond: "covalent, simple molecules", struct: "cl2o7", mp: -91, cond: "does not conduct", pH: 0, solid: 0, soluble: 1, acid: 0, alk: 1, w: "Cl₂O₇ + H₂O → 2HClO₄", a: "no reaction", b: "Cl₂O₇ + 2NaOH → 2NaClO₄ + H₂O", cat: 0x22d03a },
  };
  const OK = Object.keys(OX);
  const sumEl = { so2: [["S", [0, 0, 0]], ["O", [1.24, 0.7, 0]], ["O", [-1.24, 0.7, 0]]], so3: [["S", [0, 0, 0]], ["O", [1.43, 0, 0]], ["O", [-0.71, 0, 1.24]], ["O", [-0.71, 0, -1.24]]] };
  const molDef = (k) => {
    if (k === "so2") return { atoms: [{ el: "S", p: [0, -0.2, 0] }, { el: "O", p: [1.24, 0.5, 0] }, { el: "O", p: [-1.24, 0.5, 0] }], bonds: [[0, 1, 2], [0, 2, 2]] };
    if (k === "so3") return { atoms: sumEl.so3.map((a) => ({ el: a[0], p: a[1] })), bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1]] };
    if (k === "p4o10") { const a = 0.95, P = [[a, a, a], [-a, -a, a], [-a, a, -a], [a, -a, -a]], at = P.map((p) => ({ el: "P", p })), bd = []; P.forEach((p, i) => { const q = p.map((v) => v * 1.55); at.push({ el: "O", p: q }); bd.push([i, at.length - 1, 2]); }); for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const m = P[i].map((v, k2) => (v + P[j][k2]) / 2), n = Math.hypot(...m) || 1, o = m.map((v) => (v / n) * (n + 0.75)); at.push({ el: "O", p: o }); bd.push([i, at.length - 1, 1], [j, at.length - 1, 1]); } return { atoms: at, bonds: bd }; }
    if (k === "cl2o7") { const at = [{ el: "Cl", p: [-1.5, 0, 0] }, { el: "Cl", p: [1.5, 0, 0] }, { el: "O", p: [0, 0.4, 0] }, { el: "O", p: [-2.0, 0.95, 0] }, { el: "O", p: [-2.0, -0.45, 0.85] }, { el: "O", p: [-2.0, -0.45, -0.85] }, { el: "O", p: [2.0, 0.95, 0] }, { el: "O", p: [2.0, -0.45, 0.85] }, { el: "O", p: [2.0, -0.45, -0.85] }]; return { atoms: at, bonds: [[0, 2, 1], [1, 2, 1], [0, 3, 2], [0, 4, 2], [0, 5, 2], [1, 6, 2], [1, 7, 2], [1, 8, 2]] }; }
    return null;
  };

  C3.scenes.periodicOxides = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[1.8, 2.0, 7.0], [1.8, 1.1, 0]],
    values: { ox: "na2o", mode: "water", prog: 0, run: 1 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "ox", label: "Oxide of a Period 3 element", options: OK.map((k) => ({ value: k, label: OX[k].f + " — " + OX[k].name })) },
        { type: "select", key: "mode", label: "Test", options: [{ value: "water", label: "Add to water with universal indicator" }, { value: "tubes", label: "Add to dilute acid and to alkali" }, { value: "struct", label: "Structure and bonding" }] },
        { type: "range", key: "prog", label: "Extent of reaction (%)", min: 0, max: 100, step: 1, unit: " %" },
        { type: "toggle", key: "run", label: "Run the test automatically" },
        { type: "button", label: "Restart the test", action: (S, s, c) => { c.prog = 0; } },
      ];
    },
    views: [{ label: "Bench", cam: [[1.8, 2.0, 7.0], [1.8, 1.1, 0]] }, { label: "Close", cam: [[1.4, 1.6, 4.8], [1.5, 1.0, 0]] }],
    note: "Across Period 3 the oxides change from basic to acidic. Sodium and magnesium oxides are ionic and basic: they react with acids, and Na₂O dissolves in water to give a strongly alkaline solution (MgO only slightly). Aluminium oxide is amphoteric: it reacts with both acids and alkalis but not with water. Silicon dioxide is a giant covalent network: insoluble, with a very high melting point, and weakly acidic (it reacts with hot concentrated alkali). The oxides of phosphorus, sulphur and chlorine are simple covalent molecules that dissolve in water to form acids and react with alkalis. The trend follows the change from metal to non-metal and from ionic to covalent bonding. The pH values shown are typical for a dilute solution.",
    onChange(S, s, c, key) { c.prog = 0; if (key === "mode" || key === "ox") rebuildStruct(S, s, c); },
    reset(S, s, c) { Object.assign(c, { ox: "na2o", mode: "water", prog: 0, run: 1 }); rebuildStruct(S, s, c); },
    table() {
      return '<table class="c3-table"><tr><th style="text-align:left">Oxide</th><th style="text-align:left">Bonding</th><th style="text-align:left">mp (°C)</th><th style="text-align:left">pH in water</th><th style="text-align:left">Character</th></tr>' + OK.map((k) => { const o = OX[k]; return '<tr><td style="text-align:left">' + o.f + '</td><td style="text-align:left">' + o.bond + '</td><td style="text-align:left">' + o.mp + '</td><td style="text-align:left">' + (o.soluble ? o.pH : "7 (insoluble)") + '</td><td style="text-align:left">' + TY[o.type][0] + '</td></tr>'; }).join("") + "</table>";
    },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; S.mk.box(11, 0.1, 4, M.matte(0xb99a74, 0.6), 0.5, -0.05, 0);
      s.bk = K.beaker(); s.bk.group.position.set(0, 0, 0); s.liq = s.bk.addLiquid({ color: 0x3eaa48, opacity: 0.6 }); s.liq.setVolume(220);
      s.bub = K.bubbles(s.bk, s.liq, { n: 60, x: 0, z: 0, baseY: 0.4, spread: 0.45 });
      s.pile = new T.Mesh(new T.SphereGeometry(1, 24, 14), new T.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.9 })); S.scene.add(s.pile);
      s.tt = [0, 1].map((i) => { const v = K.vessel("testtube"); v.group.position.set(i ? 0.6 : -0.6, 0.0, 0); const l = v.addLiquid({ color: [190, 215, 240], opacity: 0.45 }); l.setVolume(14); const p = new T.Mesh(new T.SphereGeometry(1, 18, 10), new T.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.9 })); p.position.set(i ? 0.6 : -0.6, 0.1, 0); S.scene.add(p); return { v, l, p }; });
      s.structG = new T.Group(); S.scene.add(s.structG); s.sm = null; rebuildStruct(S, s, c);
    },
    update(S, s, c, dt) {
      const o = OX[c.ox], W = c.mode === "water", TB = c.mode === "tubes", ST = c.mode === "struct";
      s.bk.group.visible = W; s.pile.visible = false; s.tt.forEach((t) => { t.v.group.visible = TB; t.p.visible = false; }); s.structG.visible = ST; if (ST) s.structG.rotation.y += Math.max(0, dt) * 0.4;
      if (c.run && c.prog < 100 && dt > 0 && !ST) c.prog = Math.min(100, c.prog + dt * 10); const p = c.prog / 100;
      if (W) {
        const pH = 7 + (o.soluble ? (o.pH - 7) * Math.min(1, p * 1.4) * (o.soluble < 1 ? 0.8 + 0.2 * o.soluble : 1) : 0), col = uiCol(o.soluble && o.soluble < 1 ? 7 + (o.pH - 7) * Math.min(1, p * 1.4) : pH); s.pH = o.soluble ? (o.soluble < 1 ? 7 + (o.pH - 7) * Math.min(1, p * 1.4) : pH) : 7; s.liq.setColor(col, 0.62); s.liq.update(S.t);
        if (o.solid) { const k = o.soluble ? clamp(1 - p * (o.soluble < 1 ? 0.35 : 0.95), 0.05, 1) : 1; s.pile.visible = k > 0.06; s.pile.position.set(0, 0.17, 0); s.pile.scale.set(0.42 * k + 0.05, 0.12 * k + 0.02, 0.42 * k + 0.05); }
        s.bub.rate = o.gas ? 0.4 * (1 - p * 0.3) : 0; s.bub.update(dt, S.t);
      }
      if (TB) {
        s.tt.forEach((t, i) => { const reacts = i === 0 ? o.acid : o.alk, k = o.solid ? (reacts ? clamp(1 - p, 0.03, 1) : 1) : 0; t.p.visible = k > 0.05 && o.solid; t.p.position.y = 0.1; t.p.scale.set(0.12 * k + 0.02, 0.05 * k + 0.012, 0.12 * k + 0.02); t.l.setColor(i === 0 ? [185, 215, 242] : [215, 228, 245], 0.45); t.l.update(S.t); });
      }
    },
    overlay(ctx, s, c, w, h, S) {
      const o = OX[c.ox]; ctx.save(); ctx.textAlign = "left"; const px = w - 250; const ty = TY[o.type];
      H.pill(ctx, 10, 22, o.f + " — " + o.name, "#ffe9b8", 11); H.pill(ctx, 10, 44, ty[0] + " oxide  ·  " + o.bond, ty[1], 9.5);
      if (c.mode === "water") { H.pill(ctx, 10, 66, "pH ≈ " + (s.pH != null ? s.pH.toFixed(1) : "7"), "#e8f0ff", 10); const q = S.proj(V3(0, 1.75, 0)); H.pill(ctx, q.x, q.y, "universal indicator in water", "#cfe0f5", 8.5, "center"); }
      else if (c.mode === "tubes") { const q1 = S.proj(V3(-0.6, 1.3, 0)), q2 = S.proj(V3(0.6, 1.3, 0)); H.pill(ctx, q1.x, q1.y, "dilute HCl", "#cfe0f5", 8.5, "center"); H.pill(ctx, q2.x, q2.y, "NaOH(aq)", "#cfe0f5", 8.5, "center"); const p = c.prog > 80; const b1 = S.proj(V3(-0.6, -0.12, 0.4)), b2 = S.proj(V3(0.6, -0.12, 0.4)); H.pill(ctx, b1.x, b1.y + 12, p ? (o.acid ? (o.solid ? "dissolves" : "reacts") : "no reaction") : "…", o.acid ? "#8dffb8" : "#ffb48a", 8.5, "center"); H.pill(ctx, b2.x, b2.y + 12, p ? (o.alk ? (o.solid ? "dissolves" : "reacts") : "no reaction") : "…", o.alk ? "#8dffb8" : "#ffb48a", 8.5, "center"); }
      else { H.pill(ctx, 10, 66, "m.p. " + o.mp + " °C  ·  " + o.cond, "#9fe3ff", 9); }
      /* trend chart: pH of each oxide */
      H.panel(ctx, px, 58, 240, 128); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("pH of the solution across Period 3", px + 8, 73);
      const bx = px + 12, by = 168, bw = 20, gap = 8.4, mx = 14, bh = 78;
      OK.forEach((k, i) => { const q = OX[k], v = q.soluble ? q.pH : 7, x = bx + i * (bw + gap), hh = (v / mx) * bh; ctx.fillStyle = css(uiCol(v)); ctx.globalAlpha = k === c.ox ? 1 : 0.45; ctx.fillRect(x, by - hh, bw, hh); ctx.globalAlpha = 1; ctx.fillStyle = k === c.ox ? "#fff" : "#9fb2d2"; ctx.font = "7px 'IBM Plex Mono',monospace"; ctx.textAlign = "center"; ctx.fillText(q.f.replace(/[₀-₉]/g, (d) => d), x + bw / 2, by + 9); ctx.textAlign = "left"; });
      ctx.strokeStyle = "#9fb2d2"; ctx.setLineDash([3, 3]); const y7 = by - (7 / mx) * bh; ctx.beginPath(); ctx.moveTo(bx - 4, y7); ctx.lineTo(px + 232, y7); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#9fb2d2"; ctx.font = "7px 'IBM Plex Mono',monospace"; ctx.fillText("pH 7", px + 206, y7 - 2);
      H.panel(ctx, px, 194, 240, 124); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = ty[1]; ctx.fillText(ty[0].toUpperCase() + " OXIDE", px + 8, 209); ctx.font = "8.2px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff";
      let y = 223; ctx.fillStyle = "#9fb2d2"; ctx.fillText("water:", px + 8, y); ctx.fillStyle = "#e8f0ff"; y = wrapT(ctx, o.w, px + 46, y, 190, 10) + 13; ctx.fillStyle = "#9fb2d2"; ctx.fillText("acid:", px + 8, y); ctx.fillStyle = "#e8f0ff"; y = wrapT(ctx, o.a, px + 46, y, 190, 10) + 13; ctx.fillStyle = "#9fb2d2"; ctx.fillText("alkali:", px + 8, y); ctx.fillStyle = "#e8f0ff"; wrapT(ctx, o.b, px + 46, y, 190, 10);
      ctx.restore();
    },
    readouts(s, c) { const o = OX[c.ox]; return [["Oxide", o.f + " — " + o.name], ["Bonding", o.bond], ["Melting point", o.mp + " °C (" + (o.mp + 273) + " K)"], ["Electrical conduction", o.cond], ["Acid–base character", TY[o.type][0]], ["pH of solution in water", o.soluble ? "≈ " + o.pH : "7 (insoluble)"], ["With dilute acid", o.acid ? "reacts: " + o.a : "no reaction"], ["With alkali", o.alk ? "reacts: " + o.b : "no reaction"]]; },
    steps(s, c) { return [["Choose an oxide and add it to water with universal indicator", "done"], ["Test it with acid and with alkali", c.mode === "tubes" ? "now" : ""], ["Decide whether it is basic, amphoteric or acidic", ""], ["Relate the character to the bonding in the oxide", c.mode === "struct" ? "now" : ""]]; },
  };
  function rebuildStruct(S, s, c) {
    if (s.sm) { s.structG.remove(s.sm); s.sm = null; } const o = OX[c.ox]; if (!o) return;
    const g = new T.Group(); s.sm = g; s.structG.add(g); s.structG.position.set(0, 1.15, 0); const K = s.K;
    if (o.struct === "ionic") { const cat = new T.MeshStandardMaterial({ color: o.cat, roughness: 0.3 }), an = new T.MeshStandardMaterial({ color: 0xe8281c, roughness: 0.3 }), d = 0.62, n = 3, rc = o.f === "Al₂O₃" ? 0.14 : 0.17; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) { const isC = (i + j + k) % 2 === 0, m = new T.Mesh(new T.SphereGeometry(isC ? rc * 1.15 : 0.27, 20, 14), isC ? cat : an); m.position.set((i - 1) * d, (j - 1) * d, (k - 1) * d); g.add(m); } g.scale.setScalar(1.15); g.userData.rot = 1; }
    else if (o.struct === "network") { const a = 1.7, P = [], base = [[0, 0, 0], [0, .5, .5], [.5, 0, .5], [.5, .5, 0]]; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) base.forEach((b) => { [[0, 0, 0], [.25, .25, .25]].forEach((sh) => { const p = [i + b[0] + sh[0], j + b[1] + sh[1], k + b[2] + sh[2]]; if (p.every((v) => v <= 1.001)) P.push(p.map((v) => (v - 0.5) * a)); }); });
      const si = new T.MeshStandardMaterial({ color: 0x9aa3b0, roughness: 0.3 }), ox = new T.MeshStandardMaterial({ color: 0xe8281c, roughness: 0.3 }), dist = (a * Math.sqrt(3)) / 4, lg = []; const nb = P.map(() => 0); for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) if (Math.abs(Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1], P[i][2] - P[j][2]) - dist) < 0.02) { nb[i]++; nb[j]++; } P.forEach((p, i) => { if (!nb[i]) return; const m = new T.Mesh(new T.SphereGeometry(0.17, 18, 12), si); m.position.set(...p); g.add(m); }); for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const dd = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1], P[i][2] - P[j][2]); if (Math.abs(dd - dist) < 0.02) { const mid = P[i].map((v, k) => (v + P[j][k]) / 2), m = new T.Mesh(new T.SphereGeometry(0.1, 14, 10), ox); m.position.set(...mid); g.add(m); lg.push(new T.Vector3(...P[i]), new T.Vector3(...mid), new T.Vector3(...mid), new T.Vector3(...P[j])); } } g.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(lg), new T.LineBasicMaterial({ color: 0xcfd5df }))); g.scale.setScalar(0.95); g.userData.rot = 1; }
    else { const def = molDef(c.ox === "p4o10" ? "p4o10" : c.ox); if (def) { const cx = def.atoms.reduce((q, a) => q + a.p[0], 0) / def.atoms.length, cy = def.atoms.reduce((q, a) => q + a.p[1], 0) / def.atoms.length, cz = def.atoms.reduce((q, a) => q + a.p[2], 0) / def.atoms.length; const mol = K.molecule({ atoms: def.atoms.map((a) => ({ el: a.el, p: [a.p[0] - cx, a.p[1] - cy, a.p[2] - cz] })), bonds: def.bonds }); mol.refresh(0.1); g.add(mol.group); g.scale.setScalar(def.atoms.length > 5 ? 0.5 : 0.9); g.userData.rot = 1; } }
  }
})();
