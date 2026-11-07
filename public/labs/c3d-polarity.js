/* c3d-polarity.js — chemistry 3D, new module: electronegativity, bond polarity, dipoles and molecules in an electric field */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const EN = { H: 2.2, B: 2.04, C: 2.55, N: 3.04, O: 3.44, F: 3.98, Cl: 3.16 };
  const K_Q = 0.18, DEB = 4.8; /* partial charge per unit ΔEN (illustrative); e·Å → debye */
  const t4 = (r) => [[r, r, r], [-r, -r, r], [-r, r, -r], [r, -r, -r]];
  const MOL = {
    cl2: { f: "Cl₂", name: "Chlorine", shape: "linear", atoms: [["Cl", -1.0, 0, 0], ["Cl", 1.0, 0, 0]], bonds: [[0, 1, 1]], exp: 0, why: "Both atoms are the same, so the shared pair is shared equally: a non-polar bond and a non-polar molecule." },
    hcl: { f: "HCl", name: "Hydrogen chloride", shape: "linear", atoms: [["H", -0.63, 0, 0], ["Cl", 0.64, 0, 0]], bonds: [[0, 1, 1]], exp: 1.08, why: "Cl is more electronegative than H, so the bonding pair is pulled towards Cl: Cl is δ−, H is δ+, and the molecule is polar." },
    hf: { f: "HF", name: "Hydrogen fluoride", shape: "linear", atoms: [["H", -0.46, 0, 0], ["F", 0.46, 0, 0]], bonds: [[0, 1, 1]], exp: 1.82, why: "F is the most electronegative element (3.98), so H–F is very polar. This is why HF forms strong hydrogen bonds." },
    h2o: { f: "H₂O", name: "Water", shape: "bent (104.5°)", atoms: [["O", 0, 0, 0], ["H", 0.757, 0.586, 0], ["H", -0.757, 0.586, 0]], bonds: [[0, 1, 1], [0, 2, 1]], exp: 1.85, why: "Two polar O–H bonds in a bent shape do not cancel: the molecule has a net dipole towards oxygen." },
    nh3: { f: "NH₃", name: "Ammonia", shape: "pyramidal (107°)", atoms: [["N", 0, 0.1, 0], ["H", 0.94, -0.3, 0], ["H", -0.47, -0.3, 0.81], ["H", -0.47, -0.3, -0.81]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]], exp: 1.47, why: "Three polar N–H bonds in a pyramid add up to a net dipole pointing towards N, which also carries a lone pair." },
    co2: { f: "CO₂", name: "Carbon dioxide", shape: "linear", atoms: [["C", 0, 0, 0], ["O", 1.16, 0, 0], ["O", -1.16, 0, 0]], bonds: [[0, 1, 2], [0, 2, 2]], exp: 0, why: "Each C=O bond is polar, but the two dipoles are equal and opposite in a linear molecule, so they cancel: CO₂ is non-polar." },
    ch4: { f: "CH₄", name: "Methane", shape: "tetrahedral (109.5°)", atoms: [["C", 0, 0, 0]].concat(t4(0.63).map((p) => ["H", p[0], p[1], p[2]])), bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]], exp: 0, why: "The C–H bonds are only slightly polar and the four dipoles cancel in a symmetric tetrahedron: non-polar." },
    ccl4: { f: "CCl₄", name: "Tetrachloromethane", shape: "tetrahedral (109.5°)", atoms: [["C", 0, 0, 0]].concat(t4(1.02).map((p) => ["Cl", p[0], p[1], p[2]])), bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]], exp: 0, why: "Each C–Cl bond is polar but the tetrahedral shape is symmetric, so the dipoles cancel: CCl₄ is a non-polar solvent." },
    bf3: { f: "BF₃", name: "Boron trifluoride", shape: "trigonal planar (120°)", atoms: [["B", 0, 0, 0], ["F", 1.31, 0, 0], ["F", -0.655, 0, 1.134], ["F", -0.655, 0, -1.134]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]], exp: 0, why: "The B–F bonds are very polar, but three equal dipoles at 120° cancel: BF₃ is non-polar." },
    ch3cl: { f: "CH₃Cl", name: "Chloromethane", shape: "tetrahedral, unsymmetrical", atoms: [["C", 0, 0, 0], ["Cl", 0, 1.78, 0], ["H", 1.033, -0.346, 0], ["H", -0.5165, -0.346, 0.895], ["H", -0.5165, -0.346, -0.895]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]], exp: 1.87, why: "Replacing one H by Cl breaks the symmetry: the C–Cl dipole is not cancelled, so the molecule is polar." },
  };
  const MK = Object.keys(MOL);
  /* partial charges, net dipole (e·Å) */
  function analyse(m) {
    const q = m.atoms.map(() => 0); m.bonds.forEach(([i, j]) => { const d = K_Q * (EN[m.atoms[j][0]] - EN[m.atoms[i][0]]); q[i] += d; q[j] -= d; });
    const mu = [0, 0, 0]; m.atoms.forEach((a, i) => { mu[0] += q[i] * a[1]; mu[1] += q[i] * a[2]; mu[2] += q[i] * a[3]; }); const mag = Math.hypot(...mu);
    return { q, mu, mag: mag < 0.02 ? 0 : mag };
  }
  const qCol = (q) => (q > 0.02 ? new T.Color().setRGB(0.3, 0.52, 1.0).lerp(new T.Color(0xbfd2ff), 1 - clamp(q / 0.45, 0, 1)) : q < -0.02 ? new T.Color().setRGB(1.0, 0.25, 0.22).lerp(new T.Color(0xffc0b8), 1 - clamp(-q / 0.45, 0, 1)) : new T.Color(0xcfd6c8));

  C3.scenes.bondPolarity = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[1.9, 2.4, 8.4], [1.9, 2.0, 0]],
    values: { mol: "hcl", field: 0, col: 1 },
    state: () => ({ t: 0, q: new T.Quaternion() }),
    get controls() {
      return [
        { type: "select", key: "mol", label: "Molecule", options: MK.map((k) => ({ value: k, label: MOL[k].f + " — " + MOL[k].name })) },
        { type: "toggle", key: "field", label: "Switch on an electric field between charged plates" },
        { type: "toggle", key: "col", label: "Colour atoms by partial charge" },
      ];
    },
    views: [{ label: "Molecule + plates", cam: [[1.9, 2.4, 8.4], [1.9, 2.0, 0]] }, { label: "Close", cam: [[1.2, 2.2, 5.2], [1.2, 2.0, 0]] }],
    note: "Electronegativity is the power of an atom to attract the bonding pair of electrons. When two bonded atoms differ in electronegativity the shared pair is pulled towards the more electronegative atom, which becomes slightly negative (δ−) and the other slightly positive (δ+): a polar bond. A molecule is polar only if its bond dipoles do not cancel, which depends on the shape: CO₂, CH₄, CCl₄ and BF₃ have polar bonds (except CH₄, almost) but are non-polar molecules; H₂O, NH₃ and CH₃Cl are polar. Polar molecules turn to line up in an electric field; non-polar molecules do not. Polarity explains solubility in water, boiling points and dipole–dipole forces. Partial charges here use a simple scale (0.18 e per unit of electronegativity difference), so the model dipole is only roughly the experimental value, which is given beside it.",
    onChange(S, s, c, key) { if (key === "mol") rebuild(S, s, c); if (key === "col") recolour(s, c); },
    reset(S, s, c) { Object.assign(c, { mol: "hcl", field: 0, col: 1 }); rebuild(S, s, c); },
    table() {
      return '<table class="c3-table"><tr><th style="text-align:left">Atom</th><th style="text-align:left">Electronegativity (Pauling)</th></tr>' + Object.keys(EN).map((e) => '<tr><td style="text-align:left">' + e + '</td><td style="text-align:left">' + EN[e].toFixed(2) + "</td></tr>").join("") + '</table><table class="c3-table"><tr><th style="text-align:left">ΔEN</th><th style="text-align:left">Bond type</th></tr><tr><td style="text-align:left">0 – 0.4</td><td style="text-align:left">non-polar covalent</td></tr><tr><td style="text-align:left">0.4 – 1.8</td><td style="text-align:left">polar covalent</td></tr><tr><td style="text-align:left">above about 1.8</td><td style="text-align:left">mainly ionic</td></tr></table>';
    },
    build(S, s, c) {
      s.K = C3.kit(S); S.mk.box(11, 0.1, 4, M.matte(0xb99a74, 0.6), 0.5, -0.05, 0);
      s.plP = S.mk.box(0.12, 3.4, 2.6, M.matte(0xd24a3a, 0.5), -2.0, 1.9, 0); s.plN = S.mk.box(0.12, 3.4, 2.6, M.matte(0x3a6ad2, 0.5), 2.0, 1.9, 0);
      const pts = []; for (let i = 0; i < 7; i++) { const y = 0.6 + i * 0.45; pts.push(new T.Vector3(-1.94, y + 0.1, 0), new T.Vector3(1.94, y + 0.1, 0)); } s.fl = new T.LineSegments(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.55 })); S.scene.add(s.fl);
      s.pivot = new T.Group(); s.pivot.position.set(0, 2.0, 0); S.scene.add(s.pivot); s.q = new T.Quaternion(); s.mol = null; rebuild(S, s, c);
    },
    update(S, s, c, dt) {
      s.plP.visible = s.plN.visible = s.fl.visible = !!c.field; const a = s.an; if (!a) return; const d = Math.min(Math.max(dt, 0), 0.05);
      const q = s.pivot.quaternion; if (a.mag > 0 && c.field) { const dirL = new T.Vector3(a.mu[0], a.mu[1], a.mu[2]).normalize(), E = new T.Vector3(1, 0, 0), qt = new T.Quaternion().setFromUnitVectors(dirL, E); q.slerp(qt, clamp(d * 3.2, 0, 1)); s.wob = 0; }
      else { const w = 0.5 + 0.0; const ax = new T.Vector3(Math.sin(S.t * 0.7), Math.cos(S.t * 0.53), Math.sin(S.t * 0.41 + 1)).normalize(); q.premultiply(new T.Quaternion().setFromAxisAngle(ax, d * w)); }
      s.pivot.updateMatrixWorld(true);
    },
    overlay(ctx, s, c, w, h, S) {
      const m = MOL[c.mol], a = s.an; ctx.save(); ctx.textAlign = "left"; const px = w - 250;
      H.pill(ctx, 10, 22, m.f + " — " + m.name + "  ·  " + m.shape, "#ffe9b8", 10.5); H.pill(ctx, 10, 44, a.mag > 0 ? "POLAR molecule: net dipole " + (a.mag * DEB).toFixed(2) + " D (model)" : "NON-POLAR molecule: dipoles cancel or are absent", a.mag > 0 ? "#ffb48a" : "#8dffb8", 9.5);
      const seen = {}; s.mol.atoms.forEach((at, i) => { const qq = a.q[i], key = m.atoms[i][0] + qq.toFixed(2), cnt = a.q.filter((v, k) => m.atoms[k][0] + v.toFixed(2) === key).length; if (Math.abs(qq) < 0.02 || seen[key]) return; seen[key] = 1; const wp = s.mol.group.localToWorld(at.p.clone()), p = S.proj(wp); H.pill(ctx, p.x, p.y - 2, (qq > 0 ? "δ+ " : "δ− ") + Math.abs(qq).toFixed(2) + (cnt > 1 ? " (each " + m.atoms[i][0] + ")" : ""), qq > 0 ? "#9fc4ff" : "#ffa59c", 8, "center"); });
      /* bond dipole arrows (+→ from δ+ to δ−) */
      m.bonds.forEach(([i, j]) => { const di = EN[m.atoms[j][0]] - EN[m.atoms[i][0]]; if (Math.abs(di) < 0.1) return; const from = di > 0 ? i : j, to = di > 0 ? j : i, pf = S.proj(s.mol.group.localToWorld(s.mol.atoms[from].p.clone())), pt = S.proj(s.mol.group.localToWorld(s.mol.atoms[to].p.clone())), dx = pt.x - pf.x, dy = pt.y - pf.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, ax = pf.x + dx * 0.3 + nx * 11, ay = pf.y + dy * 0.3 + ny * 11, bx = pf.x + dx * 0.7 + nx * 11, by = pf.y + dy * 0.7 + ny * 11; ctx.strokeStyle = "#ffd27a"; ctx.fillStyle = "#ffd27a"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); const ux = (bx - ax) / (Math.hypot(bx - ax, by - ay) || 1), uy = (by - ay) / (Math.hypot(bx - ax, by - ay) || 1); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - ux * 6 - uy * 3.5, by - uy * 6 + ux * 3.5); ctx.lineTo(bx - ux * 6 + uy * 3.5, by - uy * 6 - ux * 3.5); ctx.fill(); ctx.beginPath(); ctx.moveTo(ax - uy * 3, ay + ux * 3); ctx.lineTo(ax + uy * 3, ay - ux * 3); ctx.stroke(); });
      if (c.field) { const pp = S.proj(V3(-2.0, 3.8, 0)), pn = S.proj(V3(2.0, 3.8, 0)); H.pill(ctx, pp.x, pp.y, "+ plate", "#ffa59c", 9, "center"); H.pill(ctx, pn.x, pn.y, "− plate", "#9fc4ff", 9, "center"); const pe = S.proj(V3(0, 0.35, 0.9)); H.pill(ctx, pe.x, pe.y, "electric field E →", "#ffe08a", 9, "center"); }
      /* panels */
      H.panel(ctx, px, 58, 240, 128); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Electronegativity (Pauling)", px + 8, 73);
      const els = Object.keys(EN), used = {}; m.atoms.forEach((at) => (used[at[0]] = 1)); const bx0 = px + 12, by0 = 172, bw = 22, gap = 8.5, bhm = 80, mx = 4.2;
      els.sort((p, q) => EN[p] - EN[q]).forEach((e, i) => { const x = bx0 + i * (bw + gap), hh = (EN[e] / mx) * bhm; ctx.fillStyle = used[e] ? "#ffd27a" : "#52627c"; ctx.fillRect(x, by0 - hh, bw, hh); ctx.fillStyle = "#e8f0ff"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.textAlign = "center"; ctx.fillText(EN[e].toFixed(2), x + bw / 2, by0 - hh - 3); ctx.fillStyle = used[e] ? "#fff" : "#9fb2d2"; ctx.fillText(e, x + bw / 2, by0 + 10); ctx.textAlign = "left"; });
      H.panel(ctx, px, 194, 240, 126); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Dipole  μ", px + 8, 209); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText("model:  " + (a.mag * DEB).toFixed(2) + " D", px + 8, 224); ctx.fillText("measured: " + m.exp.toFixed(2) + " D", px + 8, 238); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.2px 'IBM Plex Mono',monospace"; wrapT(ctx, m.why, px + 8, 254, 224, 10);
      ctx.restore();
    },
    readouts(s, c) { const m = MOL[c.mol], a = s.an || analyse(m); const rows = [["Molecule", m.f + " — " + m.name + " (" + m.shape + ")"]]; m.bonds.slice(0, 2).forEach(([i, j]) => { const A = m.atoms[i][0], B = m.atoms[j][0]; rows.push([A + "–" + B + " bond", "ΔEN = " + Math.abs(EN[A] - EN[B]).toFixed(2) + (Math.abs(EN[A] - EN[B]) < 0.4 ? " (non-polar)" : " (polar)")]); }); rows.push(["Net dipole (model)", (a.mag * DEB).toFixed(2) + " D"], ["Net dipole (measured)", m.exp.toFixed(2) + " D"], ["Molecule is", a.mag > 0 ? "polar" : "non-polar"], ["In an electric field", a.mag > 0 ? "lines up (δ+ end towards the − plate)" : "does not line up"]); return rows; },
    steps(s, c) { return [["Look at ΔEN for each bond and the δ+/δ− labels", "done"], ["Decide whether the bond dipoles cancel (shape!)", "now"], ["Switch on the field and see which molecules line up", c.field ? "done" : ""], ["Compare CO₂ with H₂O and CCl₄ with CH₃Cl", ""]]; },
  };
  function rebuild(S, s, c) {
    if (s.mol) { s.pivot.remove(s.mol.group); s.mol = null; } const m = MOL[c.mol]; if (!m) return; s.an = analyse(m);
    const cx = m.atoms.reduce((q, a) => q + a[1], 0) / m.atoms.length, cy = m.atoms.reduce((q, a) => q + a[2], 0) / m.atoms.length, cz = m.atoms.reduce((q, a) => q + a[3], 0) / m.atoms.length;
    m.cen = [cx, cy, cz]; const mol = s.K.molecule({ atoms: m.atoms.map((a) => ({ el: a[0], p: [a[1] - cx, a[2] - cy, a[3] - cz] })), bonds: m.bonds }); mol.refresh(0.15); s.pivot.add(mol.group); s.mol = mol; mol.group.scale.setScalar(m.atoms.length > 3 ? 0.8 : 1.0);
    s.an.mu = [s.an.mu[0], s.an.mu[1], s.an.mu[2]]; if (s.arrow) { s.arrow.parent && s.arrow.parent.remove(s.arrow); s.arrow = null; }
    if (s.an.mag > 0) { const L = clamp(s.an.mag * 2.6, 0.6, 1.8), g = new T.Group(), mat = new T.MeshStandardMaterial({ color: 0xffa93a, emissive: 0xff8a10, emissiveIntensity: 0.5, roughness: 0.4 }), cyl = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, L, 12), mat), cone = new T.Mesh(new T.ConeGeometry(0.13, 0.3, 16), mat); cyl.position.y = L / 2; cone.position.y = L + 0.15; g.add(cyl, cone); const dir = new T.Vector3(...s.an.mu).normalize().multiplyScalar(-1); g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir); g.position.copy(dir).multiplyScalar(-L / 2); mol.group.add(g); s.arrow = g; g.scale.setScalar(1 / mol.group.scale.x); }
    s.pivot.quaternion.identity(); recolour(s, c);
  }
  function recolour(s, c) {
    if (!s.mol || !s.an) return; const m = MOL[c.mol]; s.mol.atoms.forEach((a, i) => { if (c.col) a.mesh.material.color.copy(qCol(s.an.q[i])); else { const cp = { H: 0xf4f4f4, C: 0x3b3f46, N: 0x3454e8, O: 0xe8281c, F: 0x8ee04a, Cl: 0x22d03a, B: 0xffa8a0 }; a.mesh.material.color.setHex(cp[m.atoms[i][0]] || 0xcccccc); } });
  }
})();
