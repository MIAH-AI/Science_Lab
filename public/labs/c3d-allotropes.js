/* c3d-allotropes.js — chemistry 3D, new module: carbon allotropes (diamond, graphite, C60) and alloys */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const Yv = new T.Vector3(0, 1, 0), tq = new T.Quaternion(), tp = new T.Vector3(), ts = new T.Vector3(), tm = new T.Matrix4(), td = new T.Vector3(), tmid = new T.Vector3();
  const rng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  /* build spheres + bonds as instanced meshes inside a group; pts: [x,y,z,radiusScale,colourIndex] */
  function lattice(group, pts, bonds, r, cols, br, bcol) {
    const byCol = {}; pts.forEach((p, i) => { (byCol[p[4] || 0] = byCol[p[4] || 0] || []).push(i); });
    Object.keys(byCol).forEach((k) => {
      const idx = byCol[k], sm = new T.InstancedMesh(new T.SphereGeometry(1, 20, 14), M.matte(cols[+k], 0.3), idx.length); sm.frustumCulled = false;
      idx.forEach((i, j) => { const p = pts[i], rr = r * (p[3] || 1); tm.compose(tp.set(p[0], p[1], p[2]), tq.identity(), ts.set(rr, rr, rr)); sm.setMatrixAt(j, tm); }); group.add(sm);
    });
    if (bonds.length) {
      const bm = new T.InstancedMesh(new T.CylinderGeometry(1, 1, 1, 8), M.matte(bcol, 0.4), bonds.length); bm.frustumCulled = false;
      bonds.forEach((b, i) => { const a = pts[b[0]], c = pts[b[1]]; td.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]); const L = td.length(); tmid.set((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2); tq.setFromUnitVectors(Yv, td.clone().multiplyScalar(1 / L)); tm.compose(tmid, tq, ts.set(br, L, br)); bm.setMatrixAt(i, tm); });
      group.add(bm);
    }
  }
  const findBonds = (pts, d, tol) => { const out = []; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1], dz = pts[i][2] - pts[j][2], q = Math.sqrt(dx * dx + dy * dy + dz * dz); if (Math.abs(q - d) < tol) out.push([i, j]); } return out; };
  /* split points into base / top groups by y; bonds crossing the plane are placed in the base group (drawn stretched when top slips: acceptable, hidden by flag) */
  function build2(root, pts, d, tol, yCut, r, cols, br, bcol, keepCross) {
    const bonds = findBonds(pts, d, tol), gb = new T.Group(), gt = new T.Group(); root.add(gb); root.add(gt);
    const idxB = [], idxT = []; pts.forEach((p, i) => (p[1] >= yCut ? idxT : idxB).push(i));
    const remap = (idx) => { const m = {}; idx.forEach((v, j) => (m[v] = j)); return m; }, mb = remap(idxB), mt = remap(idxT);
    lattice(gb, idxB.map((i) => pts[i]), bonds.filter((b) => mb[b[0]] !== undefined && mb[b[1]] !== undefined).map((b) => [mb[b[0]], mb[b[1]]]), r, cols, br, bcol);
    lattice(gt, idxT.map((i) => pts[i]), bonds.filter((b) => mt[b[0]] !== undefined && mt[b[1]] !== undefined).map((b) => [mt[b[0]], mt[b[1]]]), r, cols, br, bcol);
    return { base: gb, top: gt, nb: bonds.length };
  }

  const ST = {
    diamond: { n: "Diamond", form: "C (giant covalent, 3-D)", bond: "each C bonded to 4 others, tetrahedral, 109.5°", hard: 10, cond: 0, mp: 10, Fy: 1e9, use: "cutting and drilling tools, jewellery", why: "no free electrons: electrons are all in strong covalent bonds, so it is an insulator; the rigid 3-D network of strong bonds makes it the hardest natural substance, m.p. about 3550 °C" },
    graphite: { n: "Graphite", form: "C (giant covalent, layers)", bond: "each C bonded to 3 others, hexagonal rings, 120°", hard: 2, cond: 8, mp: 10, Fy: 0.6, use: "pencil ‘lead’, electrodes, dry lubricant", why: "layers are held by weak forces, so they slide over each other (soft, slippery); the fourth outer electron of each carbon is delocalised between the layers, so graphite conducts electricity; high m.p. because the covalent bonds in each layer are strong" },
    c60: { n: "Buckminsterfullerene C₆₀", form: "C₆₀ (simple molecular)", bond: "60 C atoms: 12 pentagons and 20 hexagons, each C bonded to 3", hard: 2, cond: 1, mp: 3, Fy: 1.6, use: "nanotechnology, drug-delivery research, lubricant additives", why: "separate C₆₀ molecules are held by weak intermolecular forces, so it is soft with a low m.p. (sublimes near 600 °C); a poor conductor because electrons cannot move easily between molecules" },
    metal: { n: "Pure metal", form: "metallic lattice", bond: "identical atoms in regular layers in a sea of delocalised electrons", hard: 3, cond: 10, mp: 6, Fy: 1.5, use: "wires, pans (copper, iron, aluminium)", why: "layers of identical atoms slip over each other easily, so a pure metal is soft and malleable; the electron sea conducts well" },
    alloy: { n: "Alloy", form: "mixture of metals (or metal + C)", bond: "atoms of a different size disturb the layers", hard: 7, cond: 6, mp: 7, Fy: 6.0, use: "brass, bronze, steel, solder", why: "atoms of a different size distort the regular layers and block them from sliding, so an alloy is harder and stronger than the pure metal; conduction is somewhat lower" },
  };
  const ALLOYS = { brass: "brass: copper + zinc (musical instruments, taps)", bronze: "bronze: copper + tin (statues, bells)", steel: "steel: iron + carbon (construction, tools)" };

  C3.scenes.allotropesAlloys = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.8, fov: 36, free: true, cam: [[2.6, 1.4, 7.8], [1.6, 0.1, 0]],
    values: { st: "diamond", F: 0, cond: 0, alloy: "brass" },
    state: () => ({ off: 0, t: 0 }),
    get controls() {
      return [
        { type: "select", key: "st", label: "Structure", options: [{ value: "diamond", label: "Diamond (carbon)" }, { value: "graphite", label: "Graphite (carbon)" }, { value: "c60", label: "Buckminsterfullerene C₆₀" }, { value: "metal", label: "Pure metal" }, { value: "alloy", label: "Alloy (mixed atom sizes)" }] },
        { type: "select", key: "alloy", label: "Alloy example", options: Object.keys(ALLOYS).map((k) => ({ value: k, label: ALLOYS[k] })) },
        { type: "range", key: "F", label: "Shearing force on the top layers (arbitrary units)", min: 0, max: 10, step: 0.5, unit: "" },
        { type: "toggle", key: "cond", label: "Connect a battery (test conductivity)" },
        { type: "button", label: "Release the force", cls: "secondary", action: (S, s, c, rc) => { c.F = 0; s.off = 0; if (rc) rc(); } },
      ];
    },
    views: [{ label: "Front", cam: [[2.6, 1.4, 7.8], [1.6, 0.1, 0]] }, { label: "Top", cam: [[1.0, 7.5, 2.5], [1.0, 0, 0]] }],
    note: "Structure and bonding explain properties. Diamond: each carbon makes 4 strong covalent bonds in a rigid 3-D lattice, so it is extremely hard, with a very high melting point, and cannot conduct (no free electrons). Graphite: each carbon makes 3 bonds in flat hexagonal layers held to each other by weak forces; layers slide (soft, used in pencils and as a lubricant) and the delocalised fourth electron conducts electricity. C₆₀ is a hollow sphere of 60 carbons, a simple molecule with weak forces between molecules. Pure metals have identical atoms in layers that slip easily (malleable); in an alloy the atoms of different sizes block the slipping, so alloys are harder. Slip thresholds here are qualitative, not measured values.",
    onChange(S, s, c, key) { s.off = 0; },
    reset(S, s, c) { Object.assign(c, { st: "diamond", F: 0, cond: 0, alloy: "brass" }); s.off = 0; },
    table(s, c) {
      return '<table class="c3-table"><tr><th style="text-align:left">Substance</th><th style="text-align:left">Bonding</th><th>hardness</th><th>conducts?</th><th style="text-align:left">Uses</th></tr>' + ["diamond", "graphite", "c60", "metal", "alloy"].map((k) => { const q = ST[k]; return '<tr><td style="text-align:left">' + q.n + '</td><td style="text-align:left">' + q.bond + "</td><td>" + q.hard + "/10</td><td>" + (q.cond > 4 ? "yes" : "no") + '</td><td style="text-align:left">' + q.use + "</td></tr>"; }).join("") + "</table>";
    },
    build(S, s, c) {
      S.mk.box(9, 0.1, 5, M.matte(0x1d222b, 0.7), 1.0, -2.2, 0);
      s.roots = {}; const r3 = S.scene; const mk = (name) => { const g = new T.Group(); S.scene.add(g); s.roots[name] = g; return g; };
      /* diamond cubic */
      { const a = 1.3, pts = [], f = [[0, 0, 0], [0, .5, .5], [.5, 0, .5], [.5, .5, 0]];
        for (let i = -1; i <= 2; i++) for (let j = -1; j <= 2; j++) for (let k = -1; k <= 2; k++) f.forEach((o) => [[0, 0, 0], [.25, .25, .25]].forEach((b) => { const x = i + o[0] + b[0], y = j + o[1] + b[1], z = k + o[2] + b[2]; if (x >= -0.01 && x <= 2.01 && y >= -0.01 && y <= 2.01 && z >= -0.01 && z <= 2.01) pts.push([(x - 1) * a, (y - 1) * a, (z - 1) * a]); }));
        s.dm = build2(mk("diamond"), pts, a * Math.sqrt(3) / 4, 0.03, 0, 0.13, [0xcfe9ff], 0.04, 0x8fb4d8); s.roots.diamond.scale.setScalar(0.82); }
      /* graphite */
      { const b = 0.4, pts = [], gap = 0.9, a1 = [1.5 * b, 0, Math.sqrt(3) / 2 * b], a2 = [1.5 * b, 0, -Math.sqrt(3) / 2 * b];
        for (let L = 0; L < 4; L++) for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) [0, b].forEach((bx) => { const x = i * a1[0] + j * a2[0] + bx + (L % 2) * b, z = i * a1[2] + j * a2[2]; if (Math.abs(x) < 1.85 && Math.abs(z) < 1.35) pts.push([x, (L - 1.5) * gap, z]); });
        s.gr = build2(mk("graphite"), pts, b, 0.03, 0.4, 0.075, [0x2a2d33], 0.03, 0x555a64);
        [-1.5, -0.5, 0.5, 1.5].forEach((q, L) => { const pl = new T.Mesh(new T.BoxGeometry(3.9, 0.012, 3.0), new T.MeshBasicMaterial({ color: 0x6a7280, transparent: true, opacity: 0.1, depthWrite: false })); pl.position.set(0, q * gap, 0); (L >= 2 ? s.gr.top : s.gr.base).add(pl); }); }
      /* C60: even (cyclic) permutations of the standard coordinates, edge length 2 */
      { const phi = (1 + Math.sqrt(5)) / 2, base = [[0, 1, 3 * phi], [1, 2 + phi, 2 * phi], [phi, 2, 2 * phi + 1]], pts = [], sc = 0.31;
        base.forEach((p) => { for (let rot = 0; rot < 3; rot++) { const q = [p[rot % 3], p[(rot + 1) % 3], p[(rot + 2) % 3]]; for (let sx = -1; sx <= 1; sx += 2) for (let sy = -1; sy <= 1; sy += 2) for (let sz = -1; sz <= 1; sz += 2) { const v = [q[0] * sx * sc, q[1] * sy * sc, q[2] * sz * sc]; if ((q[0] === 0 && sx < 0) || (q[1] === 0 && sy < 0) || (q[2] === 0 && sz < 0)) continue; pts.push(v); } } });
        s.c60n = pts.length; s.c60 = build2(mk("c60"), pts, 2 * sc, 0.04, -99, 0.09, [0x3a3f48], 0.032, 0x7a8696); s.roots.c60.position.set(0, 0.2, 0); }
      /* metal lattice, pure and alloy; top half = rows >= 3 */
      { const mkM = (alloy) => { const rg = rng(alloy ? 7 : 3), pts = [], d = 0.5; for (let ix = 0; ix < 7; ix++) for (let iy = 0; iy < 6; iy++) for (let iz = 0; iz < 3; iz++) { const big = alloy && ((iy >= 2 && iy <= 3 && rg() < 0.45) || rg() < 0.12); pts.push([(ix - 3) * d, (iy - 2.5) * d + 0.1, (iz - 1) * d, big ? 1.35 : 1, big ? 1 : 0]); } return pts; };
        const bp = mkM(false), ap = mkM(true), mkr = (pts, name) => { const root = mk(name), gb = new T.Group(), gt = new T.Group(); root.add(gb); root.add(gt); const ib = [], it = []; pts.forEach((p, i) => (p[1] > 0.1 ? it : ib).push(i)); lattice(gb, ib.map((i) => pts[i]), [], 0.17, [0xb87333, 0x9fb8d8], 0, 0); lattice(gt, it.map((i) => pts[i]), [], 0.17, [0xb87333, 0x9fb8d8], 0, 0); return { base: gb, top: gt }; };
        s.me = mkr(bp, "metal"); s.al = mkr(ap, "alloy"); }
      s.el = new T.InstancedMesh(new T.SphereGeometry(0.045, 10, 8), new T.MeshBasicMaterial({ color: 0xffe066 }), 40); s.el.frustumCulled = false; S.scene.add(s.el); s.ep = Array.from({ length: 40 }, (_, i) => ({ x: (i * 0.37) % 3.4 - 1.7, y: (i % 4), z: ((i * 0.53) % 2.4) - 1.2, r: (i * 0.713) % 1 }));
      s.m4 = new T.Matrix4();
    },
    update(S, s, c, dt) {
      const k = c.st; Object.keys(s.roots).forEach((n) => { s.roots[n].visible = n === k; }); const q = ST[k];
      const groups = k === "diamond" ? s.dm : k === "graphite" ? s.gr : k === "c60" ? s.c60 : k === "metal" ? s.me : s.al;
      if (k === "c60") s.roots.c60.rotation.y += dt * 0.35; if (k === "diamond") s.roots.diamond.rotation.y += dt * 0.12;
      /* shear: the top part slips when F exceeds the yield threshold */
      const Fy = q.Fy; let target = 0; if (c.F > Fy) { s.off += (c.F - Fy) * 0.12 * dt; s.off = Math.min(s.off, k === "graphite" ? 1.6 : k === "c60" ? 0.5 : 1.0); target = s.off; } else { target = (c.F / Fy) * (k === "diamond" ? 0.005 : 0.06); s.off += (target - s.off) * Math.min(1, dt * 6); target = s.off; }
      if (k !== "c60" && groups.top) groups.top.position.x = s.off; s.slip = c.F > Fy; s.Fy = Fy;
      if (k === "c60" && groups.top) groups.top.position.x = 0;
      /* electrons (conduction) */
      const showE = c.cond && (k === "graphite" || k === "metal" || k === "alloy"), m4 = s.m4, sp = k === "alloy" ? 0.8 : k === "graphite" ? 1.0 : 1.4; let cnt = 0;
      if (showE) { s.ep.forEach((e, i) => { if (dt > 0) e.x += sp * dt * (k === "graphite" ? 1.0 : 0.9); if (e.x > 1.9) e.x -= 3.8; const y = k === "graphite" ? ((i % 4) - 1.5) * 0.9 + 0.2 : ((i % 5) - 2.0) * 0.5 + 0.35, z = e.z + (k === "metal" || k === "alloy" ? 0.12 : 0); m4.makeTranslation(e.x, y, z); s.el.setMatrixAt(cnt++, m4); }); }
      s.el.count = cnt; s.el.instanceMatrix.needsUpdate = true; s.el.visible = showE;
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250, q = ST[c.st];
      const title = c.st === "alloy" ? ALLOYS[c.alloy].split(":")[0] + " (alloy)" : q.n; H.pill(ctx, 10, 22, title + " — " + q.form, "#ffe9b8", 11);
      const msg = c.F <= 0 ? "apply a shearing force with the slider" : s.slip ? (c.st === "c60" ? "weak forces between molecules: soft solid, molecules shift easily" : "the layers slip: the material deforms") : (c.st === "diamond" ? "rigid: the covalent network resists the force" : "below the slip threshold: only elastic strain, it springs back");
      H.pill(ctx, 10, 44, msg, s.slip ? "#ff9aa8" : "#9fe3ff", 9.5);
      H.panel(ctx, px, 58, 240, 128); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Bonding", px + 8, 73); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; const yy = wrapT(ctx, q.bond, px + 8, 87, 224, 11); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; wrapT(ctx, q.why, px + 8, yy + 14, 224, 10);
      H.panel(ctx, px, 192, 240, 92); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Properties (relative, 0–10)", px + 8, 207);
      [["hardness", q.hard, "#ffd27a"], ["conducts electricity", q.cond, "#7dd3ff"], ["melting point", q.mp, "#ff9a7a"]].forEach((r, i) => { const y = 220 + i * 20; ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText(r[0], px + 8, y + 8); ctx.fillStyle = "rgba(143,180,255,0.15)"; ctx.fillRect(px + 104, y, 120, 9); ctx.fillStyle = r[2]; ctx.fillRect(px + 104, y, 12 * r[1], 9); });
      if (c.F > 0) { const p0 = S.proj(V3(-1.6, c.st === "metal" || c.st === "alloy" ? 0.9 : 1.6, 0)), L = 14 + c.F * 7; ctx.strokeStyle = "#ff8fa0"; ctx.fillStyle = "#ff8fa0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p0.x - L, p0.y); ctx.lineTo(p0.x, p0.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(p0.x + 8, p0.y); ctx.lineTo(p0.x - 2, p0.y - 6); ctx.lineTo(p0.x - 2, p0.y + 6); ctx.fill(); ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText("force F = " + c.F.toFixed(1), p0.x - L, p0.y - 8); }
      if (c.cond) { const p = S.proj(V3(-1.8, -1.0, 0)); H.pill(ctx, p.x, p.y, (c.st === "graphite" || c.st === "metal" || c.st === "alloy") ? "current flows: mobile electrons" : "no current: no mobile electrons", (c.st === "graphite" || c.st === "metal" || c.st === "alloy") ? "#8dffb8" : "#ff9aa8", 8.5, "left"); }
      ctx.restore();
    },
    readouts(s, c) {
      const q = ST[c.st]; return [["Substance", c.st === "alloy" ? ALLOYS[c.alloy] : q.n], ["Structure", q.form], ["Bonding", q.bond], ["Slip threshold", q.Fy > 1e6 ? "none: very rigid" : q.Fy.toFixed(1) + " (relative units)"], ["Conducts electricity", q.cond > 4 ? "yes" : "no"], ["Uses", q.use]];
    },
    steps(s, c) { return [["Choose a structure and look at its bonding", "done"], ["Apply a shearing force", c.F > 0 ? "done" : "now"], ["Connect a battery to test conduction", c.cond ? "done" : ""], ["Compare pure metal and alloy", ""]]; },
  };
})();
