/* c3d-imf.js — chemistry 3D, new module: intermolecular forces and hydrogen bonding */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const d = 0.55; /* tetrahedral helper */
  const SUB = {
    h2o: { name: "Water, H₂O", f: "H₂O", bp: 373, mp: 273, kind: "H", kj: "≈ 20", atoms: [{ el: "O", p: [0, 0, 0] }, { el: "H", p: [0.757, 0.586, 0] }, { el: "H", p: [-0.757, 0.586, 0] }], bonds: [[0, 1, 1], [0, 2, 1]], why: "O–H bonds are very polar and O has two lone pairs: each molecule can form up to four hydrogen bonds (O–H···O)." },
    nh3: { name: "Ammonia, NH₃", f: "NH₃", bp: 240, mp: 195, kind: "H", kj: "≈ 14", atoms: [{ el: "N", p: [0, 0.1, 0] }, { el: "H", p: [0.94, -0.3, 0] }, { el: "H", p: [-0.47, -0.3, 0.81] }, { el: "H", p: [-0.47, -0.3, -0.81] }], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]], why: "N–H bonds are polar and N has one lone pair, so hydrogen bonds form (N–H···N) but fewer per molecule than in water." },
    hf: { name: "Hydrogen fluoride, HF", f: "HF", bp: 293, mp: 190, kind: "H", kj: "≈ 29", atoms: [{ el: "H", p: [-0.46, 0, 0] }, { el: "F", p: [0.46, 0, 0] }], bonds: [[0, 1, 1]], why: "F is the most electronegative element, so the H–F bond is very polar and the hydrogen bond (F–H···F) is the strongest of all." },
    hcl: { name: "Hydrogen chloride, HCl", f: "HCl", bp: 188, mp: 159, kind: "D", kj: "≈ 3", atoms: [{ el: "H", p: [-0.63, 0, 0] }, { el: "Cl", p: [0.63, 0, 0] }], bonds: [[0, 1, 1]], why: "HCl is polar (δ+ H, δ− Cl) but Cl is too large for hydrogen bonding, so only weaker permanent dipole–dipole forces act." },
    ch4: { name: "Methane, CH₄", f: "CH₄", bp: 112, mp: 91, kind: "L", kj: "≈ 2", atoms: [{ el: "C", p: [0, 0, 0] }, { el: "H", p: [d, d, d] }, { el: "H", p: [-d, -d, d] }, { el: "H", p: [-d, d, -d] }, { el: "H", p: [d, -d, -d] }], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]], why: "CH₄ is non-polar, so only weak London (dispersion) forces from temporary dipoles act between molecules: very low boiling point." },
  };
  const KEYS = Object.keys(SUB);
  const KCOL = { H: "#5ad0ff", D: "#ffb04a", L: "#b6c0cc" }, KNAME = { H: "hydrogen bonding", D: "permanent dipole–dipole", L: "London dispersion only" };
  const HYD = [["Group 14", [[2, 112], [3, 161], [4, 183], [5, 221]], "#b6c0cc"], ["Group 15", [[2, 240], [3, 185], [4, 218], [5, 255]], "#8fb4ff"], ["Group 16", [[2, 373], [3, 213], [4, 231], [5, 271]], "#5ad0ff"], ["Group 17", [[2, 293], [3, 188], [4, 206], [5, 238]], "#ff9a5a"]];
  const NM = 12, BX = 1.8, SC = 0.34, ER = 0.78; /* molecules, half box, molecule scale, reduced boiling temperature */

  C3.scenes.intermolecular = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.9, fov: 36, free: true, cam: [[1.6, 2.4, 8.6], [1.6, 1.9, 0]],
    values: { sub: "h2o", T: 273, graph: "bp" },
    state: () => ({ t: 0, mol: null, vel: [], ang: [] }),
    get controls() {
      return [
        { type: "select", key: "sub", label: "Substance", options: KEYS.map((k) => ({ value: k, label: SUB[k].name })) },
        { type: "range", key: "T", label: "Temperature (K)", min: 60, max: 420, step: 1, unit: " K" },
        { type: "select", key: "graph", label: "Graph", options: [{ value: "bp", label: "Boiling points of the five substances" }, { value: "hyd", label: "Boiling points of hydrides in groups 14–17" }] },
        { type: "button", label: "Heat above the boiling point", action: (S, s, c, ref) => { c.T = Math.min(420, SUB[c.sub].bp + 40); ref(); } },
        { type: "button", label: "Cool below the melting point", action: (S, s, c, ref) => { c.T = Math.max(60, SUB[c.sub].mp - 30); ref(); }, cls: "secondary" },
      ];
    },
    views: [{ label: "Molecules", cam: [[1.6, 2.4, 8.6], [1.6, 1.9, 0]] }, { label: "Close", cam: [[1.2, 2.1, 5.6], [1.2, 1.9, 0]] }],
    note: "Intermolecular forces are the attractions between molecules; they are much weaker than the covalent bonds inside a molecule, so melting and boiling break them while the molecules stay intact. London dispersion forces act between all molecules and grow with the number of electrons. Permanent dipole–dipole forces act between polar molecules. Hydrogen bonds are the strongest: a hydrogen atom bonded to N, O or F is attracted to a lone pair on N, O or F in a neighbouring molecule. That is why NH₃, H₂O and HF boil far higher than the hydrides below them in the group. In the model the molecules move under a simple attraction whose strength follows the boiling point; the dashed lines show neighbours close enough to attract. It is qualitative: real molecules also rotate into the hydrogen-bonding orientation.",
    onChange(S, s, c, key) { if (key === "sub") { buildMol(S, s, c); } },
    reset(S, s, c) { Object.assign(c, { sub: "h2o", T: 273, graph: "bp" }); buildMol(S, s, c); },
    table() {
      return '<table class="c3-table"><tr><th style="text-align:left">Substance</th><th style="text-align:left">Main force</th><th style="text-align:left">Boiling point (K)</th></tr>' + KEYS.map((k) => '<tr><td style="text-align:left">' + SUB[k].name + '</td><td style="text-align:left">' + KNAME[SUB[k].kind] + '</td><td style="text-align:left">' + SUB[k].bp + '</td></tr>').join("") + "</table>";
    },
    build(S, s, c) {
      s.K = C3.kit(S); S.mk.box(9, 0.1, 4, M.matte(0x1d222b, 0.7), 1.6, -0.05, 0);
      const g = new T.BoxGeometry(BX * 2, BX * 2, BX * 2); s.cube = new T.Mesh(g, new T.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.05, roughness: 0.05, depthWrite: false })); s.cube.position.set(0, 0.2 + BX, 0); S.scene.add(s.cube);
      s.edges = new T.LineSegments(new T.EdgesGeometry(g), new T.LineBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: 0.5 })); s.edges.position.copy(s.cube.position); S.scene.add(s.edges);
      S.mk.rbox(4.2, 0.2, 4.2, 0.05, M.matte(0x2a2e36, 0.6), 0, 0.1, 0);
      s.NL = 60; const lg = new T.BufferGeometry(); lg.setAttribute("position", new T.BufferAttribute(new Float32Array(s.NL * 6), 3)); lg.setAttribute("color", new T.BufferAttribute(new Float32Array(s.NL * 6), 3)); s.lines = new T.LineSegments(lg, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 })); s.lines.frustumCulled = false; S.scene.add(s.lines);
      s.molG = new T.Group(); S.scene.add(s.molG); buildMol(S, s, c);
    },
    update(S, s, c, dt) {
      const sb = SUB[c.sub], kT = c.T, d0 = Math.min(dt, 0.03), P = s.pos, V = s.vel, n = NM; s.nb = 0; s.hcount = 0;
      if (d0 > 0 && P) {
        const sig = 0.85, step = 4, h = (d0 * 3) / step, Ts = (0.78 * kT) / sb.bp, vs = 0.9 * Math.sqrt(Ts), pr = 1 - Math.exp(-3 * h);
        for (let st = 0; st < step; st++) {
          const F = P.map(() => [0, 0, 0]);
          for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1], dz = P[i][2] - P[j][2]; let r2 = dx * dx + dy * dy + dz * dz; if (r2 < 0.1) r2 = 0.1; const sr6 = Math.pow((sig * sig) / r2, 3), f = clamp((24 / r2) * (2 * sr6 * sr6 - sr6), -60, 60); F[i][0] += f * dx; F[i][1] += f * dy; F[i][2] += f * dz; F[j][0] -= f * dx; F[j][1] -= f * dy; F[j][2] -= f * dz; }
          for (let i = 0; i < n; i++) { if (Math.random() < pr) { V[i][0] = vs * gauss(); V[i][1] = vs * gauss(); V[i][2] = vs * gauss(); } for (let k = 0; k < 3; k++) { V[i][k] = clamp(V[i][k] + F[i][k] * h, -4, 4); P[i][k] += V[i][k] * h; } const lim = BX - 0.4; for (let k = 0; k < 3; k++) { if (Math.abs(P[i][k]) > lim) { P[i][k] = Math.sign(P[i][k]) * lim; V[i][k] *= -1; } } }
        }
      }
      /* molecules position and tumbling */
      s.mols.forEach((m, i) => { m.group.position.set(P[i][0], 0.2 + BX + P[i][1], P[i][2]); const spin = 0.4 + (kT / 300) * 1.4; m.group.rotation.x += s.ang[i][0] * spin * d0; m.group.rotation.y += s.ang[i][1] * spin * d0; m.group.rotation.z += s.ang[i][2] * spin * d0; });
      /* neighbour lines */
      const pos = s.lines.geometry.attributes.position, col = s.lines.geometry.attributes.color, cc = new T.Color(KCOL[sb.kind]); let k = 0;
      for (let i = 0; i < n && k < s.NL; i++) for (let j = i + 1; j < n && k < s.NL; j++) { const dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1], dz = P[i][2] - P[j][2], r = Math.sqrt(dx * dx + dy * dy + dz * dz); if (r < 1.5) { pos.setXYZ(2 * k, P[i][0], 0.2 + BX + P[i][1], P[i][2]); pos.setXYZ(2 * k + 1, P[j][0], 0.2 + BX + P[j][1], P[j][2]); col.setXYZ(2 * k, cc.r, cc.g, cc.b); col.setXYZ(2 * k + 1, cc.r, cc.g, cc.b); k++; } }
      s.nb = k; for (let q = k; q < s.NL; q++) { pos.setXYZ(2 * q, 0, -50, 0); pos.setXYZ(2 * q + 1, 0, -50, 0); } pos.needsUpdate = true; col.needsUpdate = true;
      /* state estimate from mean neighbours */
      s.state = c.T < sb.mp ? "solid" : c.T < sb.bp ? "liquid" : "gas";
    },
    overlay(ctx, s, c, w, h, S) {
      const sb = SUB[c.sub]; ctx.save(); ctx.textAlign = "left"; const px = w - 250;
      H.pill(ctx, 10, 22, sb.name + " — " + KNAME[sb.kind], "#ffe9b8", 11); H.pill(ctx, 10, 44, "T = " + c.T + " K  (" + (c.T - 273).toFixed(0) + " °C):  " + s.state + "   ·   mp " + sb.mp + " K, bp " + sb.bp + " K", "#9fe3ff", 9.5);
      H.pill(ctx, 10, 66, "dashed lines = neighbours attracting: " + (s.nb || 0), KCOL[sb.kind], 9);
      H.panel(ctx, px, 58, 240, 128);
      if (c.graph === "bp") {
        ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Boiling point / K", px + 8, 73); const bx = px + 14, by0 = 168, bwid = 36, mx = 400, bhmax = 80;
        KEYS.forEach((k, i) => { const b = SUB[k], x = bx + i * 45, bh = (b.bp / mx) * bhmax; ctx.fillStyle = KCOL[b.kind]; ctx.globalAlpha = k === c.sub ? 1 : 0.45; ctx.fillRect(x, by0 - bh, bwid, bh); ctx.globalAlpha = 1; ctx.fillStyle = "#e8f0ff"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.textAlign = "center"; ctx.fillText(String(b.bp), x + bwid / 2, by0 - bh - 3); ctx.fillText(b.f, x + bwid / 2, by0 + 9); ctx.textAlign = "left"; });
        const ty = by0 - (c.T / mx) * bhmax; ctx.strokeStyle = "#ffd27a"; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(px + 8, ty); ctx.lineTo(px + 232, ty); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#ffd27a"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText("T", px + 226, ty - 3);
      } else {
        H.graph(ctx, px, 58, 240, 128, { series: HYD.map((g) => ({ pts: g[1], color: g[2], width: 2 })), xmin: 2, xmax: 5, ymin: 80, ymax: 400, ticksX: 3, ticksY: 3, xl: "period of the central atom (2 = N, O, F, C)", yl: "boiling point / K" });
        ctx.font = "7.5px 'IBM Plex Mono',monospace"; HYD.forEach((g, i) => { ctx.fillStyle = g[2]; ctx.fillText(g[0], px + 6 + i * 60, 52); });
      }
      H.panel(ctx, px, 194, 240, 102); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Strength " + sb.kj + " kJ/mol (covalent ≈ 400)", px + 8, 209); ctx.font = "8.4px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; wrapT(ctx, sb.why, px + 8, 224, 224, 10.5);
      ctx.restore();
    },
    readouts(s, c) { const sb = SUB[c.sub]; return [["Substance", sb.name], ["Main intermolecular force", KNAME[sb.kind]], ["Typical strength", sb.kj + " kJ/mol (covalent bond ≈ 400)"], ["Melting / boiling point", sb.mp + " K / " + sb.bp + " K"], ["State at " + c.T + " K", s.state || ""], ["Neighbour pairs shown", String(s.nb || 0)]]; },
    steps(s, c) { return [["Pick a substance and identify its intermolecular force", "done"], ["Heat it to the boiling point: the attractions are overcome", c.T >= SUB[c.sub].bp ? "done" : "now"], ["Compare water with methane on the boiling-point chart", ""], ["Switch to the hydride graph and explain the first point of each group", c.graph === "hyd" ? "done" : ""]]; },
  };
  function buildMol(S, s, c) {
    if (s.mols) s.mols.forEach((m) => s.molG.remove(m.group)); const sb = SUB[c.sub]; s.mols = []; s.pos = []; s.vel = []; s.ang = [];
    const g = Math.cbrt(NM), step = 0.95; for (let i = 0; i < NM; i++) { const m = s.K.molecule({ atoms: sb.atoms, bonds: sb.bonds }); m.group.scale.setScalar(SC * 0.85); m.refresh && m.refresh(0.25); s.molG.add(m.group); s.mols.push(m); const a = i % 3, b = Math.floor(i / 3) % 2, cc = Math.floor(i / 6); s.pos.push([(a - 1) * step, (b - 0.5) * step - 0.5 + cc * step * 0.9, (cc - 0.5) * step]); s.vel.push([gauss() * 0.1, gauss() * 0.1, gauss() * 0.1]); s.ang.push([gauss(), gauss(), gauss()]); }
  }
})();
