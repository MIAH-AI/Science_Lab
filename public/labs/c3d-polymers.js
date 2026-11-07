/* c3d-polymers.js — chemistry 3D, batch D (part 4): polymerisation & biomolecules (addition and condensation polymers, with real bond geometry) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready || !C3.chainMol) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rad = (d) => (d * Math.PI) / 180, lerp = (a, b, t) => a + (b - a) * t;
  const rotZ = (v, deg) => { const a = rad(deg), c = Math.cos(a), s = Math.sin(a); return V3(v.x * c - v.y * s, v.x * s + v.y * c, 0); };
  function disposeGroup(g) { g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }); g.parent && g.parent.remove(g); }

  /* ---- peptide chain: backbone N–CA–C repeated, trans peptide bonds (O and N–H on opposite sides) ---- */
  function peptide(n) {
    const atoms = [], bonds = [], ez = V3(0, 0, 1), types = []; for (let k = 0; k < n; k++) types.push("N", "CA", "C");
    const len = (a, b) => (a === "N" && b === "CA" ? 1.46 : a === "CA" && b === "C" ? 1.52 : 1.33);
    const add = (el, p) => { atoms.push({ el, p: [p.x, p.y, p.z] }); return atoms.length - 1; }, bond = (i, j, o) => bonds.push([i, j, o || 1]);
    const pos = [V3(0, 0, 0)]; for (let i = 1; i < types.length; i++) { const L = len(types[i - 1], types[i]); pos.push(pos[i - 1].clone().add(V3(Math.sin(rad(58)) * L, (i % 2 ? 1 : -1) * Math.cos(rad(58)) * L, 0))); }
    const id = types.map((t, i) => add(t === "CA" ? "C" : t, pos[i])); for (let i = 1; i < id.length; i++) bond(id[i - 1], id[i], 1);
    types.forEach((t, i) => {
      const p = pos[i], nb = []; if (i > 0) nb.push(pos[i - 1].clone().sub(p).normalize()); if (i < types.length - 1) nb.push(pos[i + 1].clone().sub(p).normalize());
      if (t === "N") { if (nb.length === 2) { const o = nb[0].clone().add(nb[1]).multiplyScalar(-1).normalize(), h = add("H", p.clone().addScaledVector(o, 1.01)); bond(id[i], h); } else { [120, -120].forEach((a) => { const h = add("H", p.clone().addScaledVector(rotZ(nb[0], a), 1.01)); bond(id[i], h); }); } }
      else if (t === "CA") { const o = nb[0].clone().add(nb[1]).multiplyScalar(-1).normalize(); [1, -1].forEach((sg) => { const d = o.clone().multiplyScalar(0.577).addScaledVector(ez, sg * 0.816).normalize(), h = add("H", p.clone().addScaledVector(d, 1.09)); bond(id[i], h); }); }
      else if (i < types.length - 1) { const o = nb[0].clone().add(nb[1]).multiplyScalar(-1).normalize(), ox = add("O", p.clone().addScaledVector(o, 1.23)); bond(id[i], ox, 2); }
      else { const u = nb[0], dO = rotZ(u, 120), dOH = rotZ(u, -120), ox = add("O", p.clone().addScaledVector(dO, 1.23)); bond(id[i], ox, 2); const hp = p.clone().addScaledVector(dOH, 1.34), o2 = add("O", hp); bond(id[i], o2); const h = add("H", hp.clone().addScaledVector(rotZ(dOH, -62), 0.96)); bond(o2, h); }
    });
    return finish(atoms, bonds);
  }
  /* ---- glucose chain: schematic pyranose rings joined through glycosidic oxygens (1→4 links) ---- */
  function glucose(n) {
    const atoms = [], bonds = [], ez = V3(0, 0, 1), SP = 5.25, R = 1.42;
    const add = (el, p) => { atoms.push({ el, p: [p.x, p.y, p.z] }); return atoms.length - 1; }, bond = (i, j, o) => bonds.push([i, j, o || 1]);
    const ring = [], bridge = [];
    for (let k = 0; k < n; k++) {
      const cx = k * SP, ids = [], ang = [0, 60, 120, 180, 240, 300], el = ["C", "C", "C", "C", "C", "O"];                 // C1, C2, C3, C4, C5, O5
      ang.forEach((a, j) => { const p = V3(cx + R * Math.cos(rad(a)), R * Math.sin(rad(a)), (j % 2 ? 0.25 : -0.25)); ids.push(add(el[j], p)); });
      for (let j = 0; j < 6; j++) bond(ids[j], ids[(j + 1) % 6]);
      const rp = (j) => V3(atoms[ids[j]].p[0], atoms[ids[j]].p[1], atoms[ids[j]].p[2]), out = (j) => V3(Math.cos(rad(ang[j])), Math.sin(rad(ang[j])), 0);
      const OH = (j, up) => { const p = rp(j), d = out(j).multiplyScalar(0.55).addScaledVector(ez, up * 0.83).normalize(), o = add("O", p.clone().addScaledVector(d, 1.43)); bond(ids[j], o); const h = add("H", atoms[o] && V3(...atoms[o].p).addScaledVector(d.clone().multiplyScalar(0.4).addScaledVector(out(j), 0.6).normalize(), 0.96)); bond(o, h); return o; };
      const Hh = (j, up) => { const p = rp(j), d = out(j).multiplyScalar(0.45).addScaledVector(ez, up * 0.89).normalize(), h = add("H", p.clone().addScaledVector(d, 1.09)); bond(ids[j], h); };
      Hh(0, 1); Hh(1, 1); OH(1, -1); Hh(2, -1); OH(2, 1); Hh(3, 1);                                                              // C1–C4 (C1 and C4 get the glycosidic oxygen / OH below)
      { const p = rp(4), d = out(4).multiplyScalar(0.55).addScaledVector(ez, 0.83).normalize(), c6 = add("C", p.clone().addScaledVector(d, 1.52)); bond(ids[4], c6); const o6 = add("O", V3(...atoms[c6].p).addScaledVector(V3(0, -0.3, 1).normalize().add(out(4).multiplyScalar(0.6)).normalize(), 1.43)); bond(c6, o6); const h6 = add("H", V3(...atoms[o6].p).addScaledVector(V3(0, 0, 1), 0.96)); bond(o6, h6); Hh(4, -1); }
      ring.push(ids); const c1 = ids[0], c4 = ids[3];
      if (k === n - 1) { const p = rp(0), d = out(0).multiplyScalar(0.55).addScaledVector(ez, -0.83).normalize(), o = add("O", p.clone().addScaledVector(d, 1.43)); bond(c1, o); const h = add("H", V3(...atoms[o].p).addScaledVector(V3(0.4, 0, -0.9).normalize(), 0.96)); bond(o, h); }
      if (k === 0) { const p = rp(3), d = out(3).multiplyScalar(0.55).addScaledVector(ez, -0.83).normalize(), o = add("O", p.clone().addScaledVector(d, 1.43)); bond(c4, o); const h = add("H", V3(...atoms[o].p).addScaledVector(V3(-0.4, 0, -0.9).normalize(), 0.96)); bond(o, h); }
    }
    for (let k = 0; k < n - 1; k++) { const a = V3(...atoms[ring[k][0]].p), b = V3(...atoms[ring[k + 1][3]].p), o = add("O", a.clone().add(b).multiplyScalar(0.5).add(V3(0, -0.3, 0.1))); bond(ring[k][0], o); bond(o, ring[k + 1][3]); }
    return finish(atoms, bonds);
  }
  function finish(atoms, bonds) { const xs = atoms.map((a) => a.p[0]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = atoms.reduce((s, a) => s + a.p[1], 0) / atoms.length; atoms.forEach((a) => { a.p[0] -= cx; a.p[1] -= cy; }); return { atoms, bonds, width: Math.max(...xs) - Math.min(...xs) }; }

  const TYPES = {
    pe: { name: "Poly(ethene)  — addition", add: true, M: 28.054, mono: "ethene  CH₂=CH₂", rep: "–(CH₂–CH₂)ₙ–", sp: 2.55, uses: "carrier bags, bottles, cling film", eq: "n CH₂=CH₂ → –(CH₂–CH₂)ₙ–", nat: "synthetic thermoplastic", mono3: () => C3.chainMol({ n: 2, type: "alkene" }), poly3: (n) => C3.chainMol({ n: 2 * n, type: "alkane" }) },
    pvc: { name: "PVC (poly(chloroethene)) — addition", add: true, M: 62.498, mono: "chloroethene  CH₂=CHCl", rep: "–(CH₂–CHCl)ₙ–", sp: 2.55, uses: "pipes, window frames, cable insulation", eq: "n CH₂=CHCl → –(CH₂–CHCl)ₙ–", nat: "synthetic thermoplastic", mono3: () => C3.chainMol({ n: 2, type: "alkene", subs: { 0: "Cl" } }), poly3: (n) => { const subs = {}; for (let k = 0; k < n; k++) subs[2 * k + 1 < 2 * n - 1 ? 2 * k + 1 : -1] = "Cl"; delete subs[-1]; const s2 = {}; for (let k = 0; k < n; k++) s2[2 * k] = "Cl"; return C3.chainMol({ n: 2 * n, type: "alkane", subs: s2 }); } },
    pep: { name: "Polypeptide (protein) — condensation", add: false, M: 75.067, unit: 57.052, mono: "glycine  H₂N–CH₂–COOH (an amino acid)", rep: "–(NH–CH₂–CO)ₙ–", sp: 3.7, uses: "proteins: enzymes, muscle, hair, silk", eq: "n H₂N–CH₂–COOH → H–(NH–CH₂–CO)ₙ–OH + (n−1) H₂O", nat: "natural polymer (peptide / amide link)", mono3: () => peptide(1), poly3: (n) => peptide(n) },
    starch: { name: "Starch / glycogen — condensation", add: false, M: 180.156, unit: 162.141, mono: "glucose  C₆H₁₂O₆", rep: "–(C₆H₁₀O₅)ₙ–", sp: 5.25, uses: "energy store in plants (starch), in animals (glycogen)", eq: "n C₆H₁₂O₆ → (C₆H₁₀O₅)ₙ + (n−1) H₂O", nat: "natural polymer (glycosidic link)", mono3: () => glucose(1), poly3: (n) => glucose(n) },
  };
  const WATER = { atoms: [{ el: "O", p: [0, 0, 0] }, { el: "H", p: [0.76, 0.59, 0] }, { el: "H", p: [-0.76, 0.59, 0] }], bonds: [[0, 1, 1], [0, 2, 1]] };
  const Y0 = 2.6;

  C3.scenes.polymersBiomolecules = {
    env: "studio", envOpts: { top: "#0d1424", bottom: "#03050b" }, envI: 0.7, fov: 36, free: true, cam: [[0, 3.4, 12], [0, 2.4, 0]],
    values: { ty: "pe", n: 4, sf: 0 },
    state: () => ({ t: 0, stage: 0, run: false }),
    controls: [
      { type: "select", key: "ty", label: "Polymer", options: Object.keys(TYPES).map((k) => ({ value: k, label: TYPES[k].name })) },
      { type: "range", key: "n", label: "Number of monomer units, n", min: 1, max: 8, step: 1 },
      { type: "button", label: "▶ Polymerise (join the monomers)", action: (S, s) => { s.run = true; s.stage = 0; } },
      { type: "button", label: "Show the separate monomers again", action: (S, s) => { s.run = false; s.stage = 0; }, cls: "secondary" },
      { type: "toggle", key: "sf", label: "Space-filling view" },
    ],
    views: [{ label: "Whole chain", cam: [[0, 3.4, 12], [0, 2.4, 0]] }, { label: "Close up", cam: [[-1.5, 3.0, 6.5], [-1.5, 2.6, 0]] }, { label: "From above", cam: [[0, 11, 3], [0, 2.6, 0]] }],
    note: "Addition polymers form when many small unsaturated monomers (such as ethene) open their C=C double bonds and join end to end — nothing is lost, so the polymer's mass equals the sum of the monomers. Condensation polymers form when monomers with two reactive groups join and lose a small molecule (usually water) at each link: n monomers make n−1 water molecules. Real polymer molecules contain thousands of units; only a few are drawn here.",
    onChange(S, s, c, key) { if (key === "ty" || key === "n") { s.run = false; s.stage = 0; s.sig = ""; } },
    reset(S, s, c) { Object.assign(c, { ty: "pe", n: 4, sf: 0 }); s.run = false; s.stage = 0; s.sig = ""; },
    build(S, s, c) { const K = C3.kit(S); s.K = K; s.sig = ""; s.monos = []; s.water = []; s.poly = null; s.t = 0; },
    update(S, s, c, dt) {
      const ty = TYPES[c.ty], n = c.n, K = s.K;
      if (c.ty + n !== s.sig) {
        s.sig = c.ty + n; s.monos.forEach((m) => disposeGroup(m.group)); s.water.forEach((m) => disposeGroup(m.group)); s.poly && disposeGroup(s.poly.group); s.monos = []; s.water = [];
        const pl = ty.poly3(n), W = pl.width, sc = clamp(9.2 / (Math.max(W, 6) * 1.15 + 3), 0.22, 0.85); s.sc = sc; s.poly = K.molecule({ atoms: pl.atoms, bonds: pl.bonds }); s.poly.group.scale.setScalar(sc); s.poly.group.position.set(0, Y0, 0);
        const mono = ty.mono3(); for (let k = 0; k < n; k++) { const m = K.molecule({ atoms: mono.atoms, bonds: mono.bonds }); m.group.scale.setScalar(sc); m.k = k; s.monos.push(m); }
        if (!ty.add) for (let k = 0; k < n - 1; k++) { const w = K.molecule(WATER); w.group.scale.setScalar(sc * 0.9); w.k = k; s.water.push(w); }
        s.lstyle = -1;
      }
      const ss = c.sf ? 1 : 0; if (ss !== s.lstyle) { s.lstyle = ss; [s.poly].concat(s.monos, s.water).forEach((m) => m.refresh(ss)); }
      if (s.run && dt > 0) { s.stage = Math.min(1, s.stage + dt * 0.3); if (s.stage >= 1) s.run = false; }
      const st = s.stage, e = st * st * (3 - 2 * st), joined = st >= 0.999, sp = ty.sp * 1.15 * s.sc;
      s.poly.group.visible = joined; s.monos.forEach((m, k) => { m.group.visible = !joined;
        const gx = (k - (n - 1) / 2) * sp * 1.3, tx = (k - (n - 1) / 2) * sp, wob = (1 - e);
        m.group.position.set(lerp(gx, tx, e), Y0 + wob * Math.sin(S.t * 1.3 + k * 1.7) * 0.45 + (k % 2 ? 0.5 : -0.4) * wob, wob * Math.cos(S.t + k) * 0.8); m.group.rotation.set(wob * Math.sin(S.t * 0.8 + k) * 0.6, wob * Math.cos(S.t * 0.6 + k) * 0.5, wob * Math.sin(S.t * 0.5 + k * 2) * 0.4); });
      s.water.forEach((w, k) => { const lx = (k + 0.5 - (n) / 2) * sp, p = clamp((st - 0.35) / 0.65, 0, 1); w.group.visible = st > 0.35; w.group.position.set(lx + Math.sin(k * 2.1) * 0.2 * p, Y0 - 0.2 + p * (1.6 + (k % 3) * 0.35) + (st >= 1 ? Math.sin(S.t * 1.4 + k) * 0.08 : 0), p * (0.8 + (k % 2) * 0.5)); w.group.rotation.set(S.t * 0.7 + k, S.t * 0.9, 0); });
    },
    overlay(ctx, s, c, w, h, S) {
      const ty = TYPES[c.ty], n = c.n, st = s.stage; if (!s.poly) return;
      H.pill(ctx, 10, 22, ty.eq, "#ffe9b8", 11); H.pill(ctx, 10, 44, ty.nat + "   ·   repeat unit " + ty.rep, "#bcd0ea", 9.5);
      H.pill(ctx, 10, 66, st < 0.999 ? (st === 0 ? n + " separate monomer molecules — press Polymerise" : "monomers joining…") : n + " monomers joined into one chain", st < 0.999 ? "#9fe3ff" : "#7dffbd", 10);
      if (!ty.add && st > 0.35 && s.water.length) { const q = S.proj(V3(0, Y0 + 2.4, 0)); H.pill(ctx, q.x, clamp(q.y - 8, 82, 150), (n - 1) + " H₂O released (one per link)", "#7ab8ff", 10.5, "center"); }
      if (ty.add && st >= 0.999) H.pill(ctx, 320, 108, "no by-product: every atom of the monomers is in the polymer", "#7dffbd", 10, "center");
      const bx = 396, by = 262, bw = 240, bh = 100; H.panel(ctx, bx, by, bw, bh); ctx.save(); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Monomer: " + ty.mono.split("  ")[0], bx + 8, by + 15); ctx.fillStyle = "#dbe7ff"; ctx.font = "9.5px 'IBM Plex Mono',monospace";
      const mono = ty.M, pol = ty.add ? n * mono : n * mono - (n - 1) * 18.015;
      ctx.fillText("Mr(monomer) = " + mono.toFixed(2), bx + 8, by + 33); ctx.fillText("n × Mr(monomer) = " + (n * mono).toFixed(1), bx + 8, by + 49); if (!ty.add) { ctx.fillStyle = "#7ab8ff"; ctx.fillText("− (n−1) × 18.02 (water) = −" + ((n - 1) * 18.015).toFixed(1), bx + 8, by + 65); } ctx.fillStyle = "#ffd27a"; ctx.fillText("Mr(" + (ty.add ? "polymer" : "chain") + ") = " + pol.toFixed(1), bx + 8, by + (ty.add ? 65 : 81)); ctx.restore();
    },
    readouts(s, c) {
      const ty = TYPES[c.ty], n = c.n, pol = ty.add ? n * ty.M : n * ty.M - (n - 1) * 18.015;
      return [["Polymer", ty.name.split(" — ")[0]], ["Type of polymerisation", ty.add ? "addition (no by-product)" : "condensation (loses H₂O at each link)"], ["Monomer", ty.mono], ["Repeat unit", ty.rep], ["Units in the chain, n", n], ["By-product", ty.add ? "none" : (n - 1) + " × H₂O"], ["Mr of this chain", pol.toFixed(1)], ["Uses / where found", ty.uses]];
    },
    steps(s, c) { const ty = TYPES[c.ty]; return [["Identify the monomer: " + ty.mono, "done"], ["Press Polymerise: " + (ty.add ? "the C=C double bonds open and the monomers bond end to end" : "an —OH and an —H from neighbouring monomers leave as water as each link forms"), s.stage > 0 ? "done" : "now"], ["Count what is lost: " + (ty.add ? "nothing" : "one H₂O per link, so n − 1 molecules"), s.stage >= 0.999 ? "done" : ""], ["Real polymers have thousands of units — compare Mr(polymer) with n × Mr(monomer)", ""]]; },
  };
})();
