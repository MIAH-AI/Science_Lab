/* c3d-batchP.js — chemistry 3D, new modules: complex ions & silicon, noble gases, food/biochemistry tests, limestone cycle & sodium compounds */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sm = (x) => x * x * (3 - 2 * x);
  const FONT = "'IBM Plex Mono',monospace";
  const rnd = (() => { let a = 777001; return () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  function sp(ctx, px, y, h, title, lines, fs) { H.panel(ctx, px, y, 240, h); ctx.textAlign = "left"; ctx.font = "600 9.5px " + FONT; ctx.fillStyle = "#8fb4ff"; ctx.fillText(title, px + 8, y + 15); ctx.font = (fs || 8.6) + "px " + FONT; let yy = y + 29; lines.forEach((t) => { ctx.fillStyle = "#e8f0ff"; yy = wrapT(ctx, t, px + 8, yy, 224, 10.5) + 11.5; }); }
  const pillAt = (ctx, S, x, y, z, t, col, size) => { const p = S.proj(V3(x, y, z)); H.pill(ctx, p.x, p.y, t, col || "#cfe0f5", size || 9, "center"); };
  const sph = (r, col, o) => new T.Mesh(new T.SphereGeometry(r, 20, 14), new T.MeshPhysicalMaterial(Object.assign({ color: col, roughness: 0.3, clearcoat: 0.6 }, o || {})));
  const rodBetween = (mesh, A, B) => { const d = B.clone().sub(A), L = d.length(); mesh.position.copy(A).addScaledVector(d, 0.5); mesh.scale.set(1, Math.max(L, 0.001), 1); mesh.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); };
  const dispose = (g) => { g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && !o.material.userData.keep) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }); g.parent && g.parent.remove(g); };
  const lerp3 = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  const hex = (n) => "#" + n.toString(16).padStart(6, "0");

  /* =================== 1. COMPLEX IONS & SILICON =================== */
  const S3 = 1 / Math.sqrt(3);
  const GEO = { linear: [[1, 0, 0], [-1, 0, 0]], tetra: [[S3, S3, S3], [-S3, -S3, S3], [-S3, S3, -S3], [S3, -S3, -S3]], square: [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]], oct: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]] };
  const CX = {
    ag: { f: "[Ag(NH₃)₂]⁺", ion: "silver(I)", m: "Ag", mc: 0xcfd6df, lig: "NH₃", don: "N", lc: 0x3454e8, lch: 0, cn: 2, g: "linear", shape: "linear", ang: "180°", ox: 1, d: "d¹⁰", col: "colourless", cc: [235, 240, 245], use: "Tollens' reagent: a silver mirror forms with aldehydes. Also dissolves AgCl in NH₃(aq)." },
    cunh3: { f: "[Cu(NH₃)₄]²⁺", ion: "copper(II)", m: "Cu", mc: 0xb4592f, lig: "NH₃", don: "N", lc: 0x3454e8, lch: 0, cn: 4, g: "square", shape: "square planar", ang: "90°", ox: 2, d: "d⁹", col: "deep blue", cc: [40, 80, 230], use: "Excess NH₃(aq) turns pale blue Cu²⁺(aq) deep blue: a test for Cu²⁺." },
    cuh2o: { f: "[Cu(H₂O)₆]²⁺", ion: "copper(II)", m: "Cu", mc: 0xb4592f, lig: "H₂O", don: "O", lc: 0xe8281c, lch: 0, cn: 6, g: "oct", shape: "octahedral", ang: "90°", ox: 2, d: "d⁹", col: "pale blue", cc: [120, 180, 240], use: "The colour of copper(II) sulphate solution: every Cu²⁺ ion in water is a hexaaqua complex." },
    fecn: { f: "[Fe(CN)₆]³⁻", ion: "iron(III)", m: "Fe", mc: 0xb0523a, lig: "CN⁻", don: "C", lc: 0x3b3f46, lch: -1, cn: 6, g: "oct", shape: "octahedral", ang: "90°", ox: 3, d: "d⁵", col: "red-orange", cc: [230, 120, 40], use: "Potassium hexacyanoferrate(III), used to detect Fe²⁺ (Turnbull's blue)." },
    cocl: { f: "[CoCl₄]²⁻", ion: "cobalt(II)", m: "Co", mc: 0x3a6ad2, lig: "Cl⁻", don: "Cl", lc: 0x22d03a, lch: -1, cn: 4, g: "tetra", shape: "tetrahedral", ang: "109.5°", ox: 2, d: "d⁷", col: "blue", cc: [50, 90, 230], use: "Large ligands (Cl⁻) favour four-coordinate tetrahedral shapes; pink [Co(H₂O)₆]²⁺ turns blue in conc. HCl." },
    znnh3: { f: "[Zn(NH₃)₄]²⁺", ion: "zinc(II)", m: "Zn", mc: 0x9aa8bc, lig: "NH₃", don: "N", lc: 0x3454e8, lch: 0, cn: 4, g: "tetra", shape: "tetrahedral", ang: "109.5°", ox: 2, d: "d¹⁰", col: "colourless", cc: [235, 240, 245], use: "Zn(OH)₂ dissolves in excess NH₃(aq) to give a colourless complex, unlike Al(OH)₃." },
    nicn: { f: "[Ni(CN)₄]²⁻", ion: "nickel(II)", m: "Ni", mc: 0x4fb06a, lig: "CN⁻", don: "C", lc: 0x3b3f46, lch: -1, cn: 4, g: "square", shape: "square planar", ang: "90°", ox: 2, d: "d⁸", col: "yellow", cc: [240, 220, 70], use: "Strong-field cyanide ligands give square-planar d⁸ complexes." },
  };
  const XK = Object.keys(CX);
  const SI = { pure: { n: "Pure silicon", sig: "1 (reference)", note: "Each Si has four covalent bonds to neighbours (a giant covalent lattice like diamond). At room temperature there are very few free electrons, so pure silicon is a poor conductor; conductivity rises with temperature (opposite to metals): a semiconductor." }, n: { n: "n-type: doped with phosphorus", sig: "about 10⁴ × larger", note: "Phosphorus has five valence electrons: four form bonds and the fifth is free to move. The negative carriers (electrons) conduct. The dopant is replaced at roughly one atom in 10⁷." }, p: { n: "p-type: doped with boron", sig: "about 10³ × larger", note: "Boron has only three valence electrons, leaving a missing electron (a positive hole) in one bond. Electrons from neighbouring bonds hop in, so the hole moves: positive carriers conduct." } };
  const SK = Object.keys(SI);
  C3.scenes.complexShapes = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.9, fov: 36, free: true, cam: [[2.4, 4.6, 8.6], [2.4, 1.8, 0]],
    values: { mode: "cx", cx: "cunh3", spin: 1, si: "n", volt: 1, Tk: 300 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Activity", options: [{ value: "cx", label: "Complex ions: ligands and shapes" }, { value: "si", label: "Silicon: lattice and doping" }] },
        { type: "select", key: "cx", label: "Complex ion", options: XK.map((k) => ({ value: k, label: CX[k].f + " — " + CX[k].shape })) },
        { type: "toggle", key: "spin", label: "Rotate model" },
        { type: "select", key: "si", label: "Silicon type", options: SK.map((k) => ({ value: k, label: SI[k].n })) },
        { type: "toggle", key: "volt", label: "Apply a voltage across the crystal (silicon)" },
        { type: "range", key: "Tk", label: "Temperature (silicon)", min: 250, max: 500, step: 10, unit: " K" },
      ];
    },
    views: [{ label: "Above", cam: [[2.4, 4.6, 8.6], [2.4, 1.8, 0]] }, { label: "Side", cam: [[2.4, 2.2, 9.6], [2.4, 1.9, 0]] }],
    note: "A complex ion has a central metal ion bonded to ligands: molecules or ions that each donate a lone pair of electrons to the metal by a dative (coordinate) covalent bond. The coordination number is the number of donor atoms bonded to the metal and decides the shape: 2 gives linear, 4 gives tetrahedral (or square planar for d⁸ and some d⁹ ions) and 6 gives octahedral. The charge on the complex is the oxidation state of the metal plus the charges of the ligands. Transition-metal complexes are usually coloured because the d orbitals split in the ligand field and light is absorbed to promote an electron. Silicon is a metalloid in Group 4 whose giant covalent lattice makes it a semiconductor: doping with Group 5 atoms (n-type) or Group 3 atoms (p-type) greatly raises its conductivity. Silicon dioxide (sand, quartz) is a giant covalent oxide used for glass. Colours are indicative, and the silicon lattice is drawn as a simple cubic grid for clarity (real silicon is diamond-cubic).",
    onChange(S, s, c, key) { if (key === "cx" || key === "mode" || key === "si") rebuild(S, s, c); },
    reset(S, s, c) { Object.assign(c, { mode: "cx", cx: "cunh3", spin: 1, si: "n", volt: 1, Tk: 300 }); rebuild(S, s, c); },
    table() { return '<table class="c3-table"><tr><th style="text-align:left">Complex</th><th style="text-align:left">Coord. no.</th><th style="text-align:left">Shape</th><th style="text-align:left">Metal ox. state</th><th style="text-align:left">Colour</th></tr>' + XK.map((k) => '<tr><td style="text-align:left">' + CX[k].f + '</td><td style="text-align:left">' + CX[k].cn + '</td><td style="text-align:left">' + CX[k].shape + '</td><td style="text-align:left">+' + CX[k].ox + '</td><td style="text-align:left">' + CX[k].col + "</td></tr>").join("") + "</table>"; },
    build(S, s, c) { S.mk.box(16, 0.1, 6, M.matte(0x1d222b, 0.7), 2.0, -0.05, 0); s.root = new T.Group(); s.root.position.set(0, 2.0, 0); S.scene.add(s.root); s.car = []; s.t = 0; rebuild(S, s, c); },
    update(S, s, c, dt) {
      if (c.spin) s.root.rotation.y += dt * 0.4; s.t += dt;
      if (c.mode === "si" && s.car.length) { const sg = c.si === "n" ? -1 : 1, v = c.volt ? 0.9 : 0; s.car.forEach((k) => { const u = k.userData; if (v) { u.x += sg * -1 * -v * dt * (u.hole ? -1 : 1) * 0 + (u.hole ? 1 : -1) * 0.0; } const dir = u.hole ? 1 : -1; u.x += (v ? dir * v : 0) * dt * 1.2 + 0.35 * Math.sin(s.t * 3 + u.ph) * dt; u.y += 0.5 * Math.cos(s.t * 2.3 + u.ph) * dt; u.z += 0.5 * Math.sin(s.t * 1.7 + u.ph) * dt; if (u.x > 1.9) u.x = -1.9; if (u.x < -1.9) u.x = 1.9; u.y = clamp(u.y, -1.5, 1.5); u.z = clamp(u.z, -1.5, 1.5); k.position.set(u.x, u.y, u.z); k.material.opacity = 0.7 + 0.25 * Math.sin(s.t * 6 + u.ph); }); }
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250;
      if (c.mode === "cx") {
        const x = CX[c.cx], tot = x.ox + x.cn * x.lch; H.pill(ctx, 10, 22, x.f + "   " + x.ion + " complex", "#ffe9b8", 10); H.pill(ctx, 10, 44, x.cn + " " + x.lig + " ligands: " + x.shape + ", " + x.ang, "#9fe3ff", 9.4); H.pill(ctx, 10, 66, "charge = " + (x.ox > 0 ? "+" : "") + x.ox + " + " + x.cn + "(" + x.lch + ") = " + (tot > 0 ? "+" : "") + tot, "#ffd27a", 9);
        s.lp.forEach((p) => { const q = S.proj(p.clone().applyMatrix4(s.root.matrixWorld)); H.pill(ctx, q.x, q.y + 17, x.lig, "#cfe0f5", 7.8, "center"); }); const qm = S.proj(V3(0, 2.0, 0)); H.pill(ctx, qm.x, qm.y - 26, x.m + "^" + (x.ox > 0 ? "+" : "") + x.ox, "#ffd27a", 8.6, "center");
        sp(ctx, px, 58, 128, "Bonding and shape", ["coordination number: " + x.cn, "shape: " + x.shape + " (" + x.ang + ")", "oxidation state of " + x.m + ": +" + x.ox + "   " + x.d, "solution colour: " + x.col], 8.5); sp(ctx, px, 194, 126, "Why it matters", [x.use, "orange arrows: lone pair donated by each ligand (dative bond)"], 8.3);
        const bar = "rgb(" + x.cc.join(",") + ")"; ctx.fillStyle = bar; ctx.beginPath(); ctx.arc(30, 330, 12, 0, 7); ctx.fill(); ctx.strokeStyle = "#ffffff55"; ctx.stroke(); ctx.fillStyle = "#e8f0ff"; ctx.font = "8.6px " + FONT; ctx.fillText("solution colour: " + x.col, 48, 333);
      } else {
        const t = SI[c.si]; H.pill(ctx, 10, 22, "Silicon: " + t.n, "#ffe9b8", 10); H.pill(ctx, 10, 44, c.si === "n" ? "free electrons (−) carry the current" : c.si === "p" ? "holes (+) carry the current" : "few carriers at this temperature", "#9fe3ff", 9.4); H.pill(ctx, 10, 66, c.volt ? "voltage on: electrons drift one way, holes the other" : "voltage off: carriers move randomly", "#ffd27a", 8.6);
        const dq = S.proj(V3(0, 2.0, 1.55)); pillAt(ctx, S, 0, 0.45, 1.2, "Si lattice: each atom has 4 covalent bonds", "#cfe0f5", 8.4); if (c.si !== "pure") { const dp = S.proj(s.dop.getWorldPosition(V3(0, 0, 0))); H.pill(ctx, dp.x + 30, dp.y - 12, c.si === "n" ? "P (5 valence e⁻)" : "B (3 valence e⁻)", c.si === "n" ? "#d69cff" : "#ffb0c0", 8.4, "center"); }
        sp(ctx, px, 58, 150, "What happens", [t.note], 8.3); H.panel(ctx, px, 216, 240, 104); ctx.font = "600 9.5px " + FONT; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Relative conductivity", px + 8, 231); const rel = { pure: 0.04, n: 0.95, p: 0.8 }[c.si] * (c.si === "pure" ? 1 + (c.Tk - 250) / 125 : 1); ctx.fillStyle = "#52627c"; ctx.fillRect(px + 12, 244, 216, 14); ctx.fillStyle = "#ffd27a"; ctx.fillRect(px + 12, 244, 216 * clamp(rel, 0, 1), 14); ctx.font = "8.4px " + FONT; ctx.fillStyle = "#e8f0ff"; ctx.fillText("σ " + t.sig + (c.si === "pure" ? "   (rises with T)" : ""), px + 12, 276); ctx.fillText("uses: chips, solar cells, transistors", px + 12, 290); ctx.fillText("SiO₂ (sand): glass, quartz", px + 12, 304);
      }
      ctx.restore();
    },
    readouts(s, c) { if (c.mode === "cx") { const x = CX[c.cx], tot = x.ox + x.cn * x.lch; return [["Complex ion", x.f + " (" + x.ion + ")"], ["Ligand", x.lig + " (donor atom " + x.don + ")"], ["Coordination number", String(x.cn)], ["Shape", x.shape + ", " + x.ang], ["Charge", "+" + x.ox + " + " + x.cn + "(" + x.lch + ") = " + tot], ["Colour", x.col]]; } const t = SI[c.si]; return [["Material", t.n], ["Bonding", "giant covalent lattice, 4 bonds per Si"], ["Carriers", c.si === "n" ? "electrons (negative)" : c.si === "p" ? "holes (positive)" : "few, thermally generated"], ["Conductivity", t.sig]]; },
    steps(s, c) { return [["Count the ligands to get the coordination number", c.mode === "cx" ? "now" : "done"], ["Match shape to coordination number (2, 4, 6)", ""], ["Add the metal and ligand charges to get the complex charge", ""], ["Dope silicon n-type and p-type and compare carriers", c.mode === "si" ? "now" : ""]]; },
  };
  function rebuild(S, s, c) {
    while (s.root.children.length) dispose(s.root.children[0]); s.root.rotation.y = 0; s.car = []; s.lp = [];
    if (c.mode === "cx") {
      const x = CX[c.cx]; const m = sph(0.5, x.mc, { metalness: 0.5 }); s.root.add(m); const dirs = GEO[x.g], R = 1.75; dirs.forEach((d) => { const p = V3(d[0] * R, d[1] * R, d[2] * R); s.lp.push(p); const L = sph(0.34, x.lc); L.position.copy(p); s.root.add(L); const rod = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 1, 10), new T.MeshStandardMaterial({ color: 0xc8cfd8 })); rodBetween(rod, V3(0, 0, 0), p); s.root.add(rod); const mid = p.clone().multiplyScalar(0.55); const cone = new T.Mesh(new T.ConeGeometry(0.1, 0.3, 14), new T.MeshStandardMaterial({ color: 0xffa93a, emissive: 0xff8a10, emissiveIntensity: 0.6 })); cone.position.copy(mid); cone.quaternion.setFromUnitVectors(V3(0, 1, 0), p.clone().negate().normalize()); s.root.add(cone); });
      s.root.position.y = 2.0; return;
    }
    const sil = 0.95, hm = new T.MeshStandardMaterial({ color: 0xc8cfd8, roughness: 0.5 }); const idx = (i, j, k) => V3(i * sil, j * sil, k * sil); const bondG = new T.CylinderGeometry(0.04, 0.04, 1, 8);
    const pts = []; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) pts.push([i, j, k]);
    pts.forEach(([i, j, k]) => { const p = idx(i, j, k), dop = c.si !== "pure" && i === 0 && j === 0 && k === 1; const a = sph(dop ? 0.27 : 0.2, dop ? (c.si === "n" ? 0xa070e0 : 0xff9ab0) : 0x8a96a8, { metalness: 0.5 }); a.position.copy(p); s.root.add(a); if (dop) s.dop = a;[[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((d) => { const ni = i + d[0], nj = j + d[1], nk = k + d[2]; if (ni > 1 || nj > 1 || nk > 1) return; const b = new T.Mesh(bondG, hm); rodBetween(b, p, idx(ni, nj, nk)); s.root.add(b); }); });
    const nT = Math.round(1 + (c.Tk - 250) / 40), N = c.si === "pure" ? nT : 6;
    const mkC = (hole) => { const m = new T.Sprite(new T.SpriteMaterial({ map: U.softDot(48, hole ? "rgba(255,255,255,1)" : "rgba(80,170,255,1)"), color: hole ? 0xffffff : 0x4fb0ff, transparent: true, depthWrite: false, blending: hole ? T.NormalBlending : T.AdditiveBlending })); m.scale.set(hole ? 0.55 : 0.6, hole ? 0.55 : 0.6, 1); m.userData = { x: (rnd() - 0.5) * 3.5, y: (rnd() - 0.5) * 2.6, z: (rnd() - 0.5) * 2.6, ph: rnd() * 6.28, hole }; s.root.add(m); s.car.push(m); };
    if (c.si === "pure") for (let i = 0; i < N; i++) { mkC(false); mkC(true); } else for (let i = 0; i < N; i++) mkC(c.si === "p");
    s.root.position.y = 2.0;
  }

  /* =================== 2. NOBLE GASES =================== */
  const NG = {
    He: { n: "Helium", Z: 2, sh: [2], bp: 4.2, r: 31, col: 0xffb08a, cs: [255, 176, 138], disc: "pink-orange", use: "balloons and airships (low density, non-flammable), cooling MRI magnets, deep-sea breathing mixes", abu: "5 × 10⁻⁴ %" },
    Ne: { n: "Neon", Z: 10, sh: [2, 8], bp: 27.1, r: 38, col: 0xff5a2a, cs: [255, 90, 42], disc: "bright red-orange", use: "red-orange advertising signs and indicator lamps", abu: "1.8 × 10⁻³ %" },
    Ar: { n: "Argon", Z: 18, sh: [2, 8, 8], bp: 87.3, r: 71, col: 0xa070ff, cs: [160, 112, 255], disc: "lilac to blue-violet", use: "inert atmosphere for welding, filling filament lamps (stops the tungsten burning)", abu: "0.93 % of air" },
    Kr: { n: "Krypton", Z: 36, sh: [2, 8, 18, 8], bp: 119.9, r: 88, col: 0xd8e8c8, cs: [216, 232, 200], disc: "pale white-green", use: "high-speed photography flash lamps, some fluorescent lamps", abu: "1.1 × 10⁻⁴ %" },
    Xe: { n: "Xenon", Z: 54, sh: [2, 8, 18, 18, 8], bp: 165.0, r: 108, col: 0x8aa8ff, cs: [138, 168, 255], disc: "blue-lavender", use: "car headlamps, camera flash tubes, ion thrusters", abu: "9 × 10⁻⁶ %" },
    Na: { n: "Sodium (compare)", Z: 11, sh: [2, 8, 1], bp: 1156, r: 190, col: 0xe0c040, cs: [224, 192, 64], disc: "—", use: "reactive metal: loses its one outer electron easily", abu: "—" },
    Cl: { n: "Chlorine (compare)", Z: 17, sh: [2, 8, 7], bp: 239, r: 99, col: 0x22d03a, cs: [34, 208, 58], disc: "—", use: "reactive non-metal: gains one electron easily", abu: "—" },
  };
  const NGK = Object.keys(NG), NOBLE = ["He", "Ne", "Ar", "Kr", "Xe"];
  C3.scenes.nobleGases = {
    env: "studio", envOpts: { top: "#14223a", bottom: "#03050a" }, envI: 0.7, fov: 36, free: true, cam: [[2.2, 1.9, 9.6], [2.2, 1.7, 0]],
    values: { mode: "disc", el: "Ne", volt: 1, spin: 1 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Activity", options: [{ value: "disc", label: "Discharge tubes: colours of the glow" }, { value: "shell", label: "Electron shells: why they are inert" }, { value: "bp", label: "Boiling points and atomic size" }] },
        { type: "select", key: "el", label: "Gas / element (tubes and shells)", options: NGK.map((k) => ({ value: k, label: NG[k].n + " (" + k + ")" })) },
        { type: "toggle", key: "volt", label: "Apply high voltage across the tube (tubes)" },
        { type: "toggle", key: "spin", label: "Orbit the electrons (shells)" },
      ];
    },
    views: [{ label: "Front", cam: [[2.2, 1.9, 9.6], [2.2, 1.7, 0]] }, { label: "Close", cam: [[1.6, 1.9, 6.4], [1.6, 1.7, 0]] }],
    note: "The noble gases (Group 18) are monatomic, colourless, odourless and unreactive because each has a complete outer electron shell (2 for helium, 8 for the rest) so atoms neither gain, lose nor share electrons easily. Their boiling points are very low and rise down the group (4 K for He to 165 K for Xe) because only weak London dispersion forces act between atoms and these grow with the number of electrons. When a high voltage is passed through a low-pressure gas in a tube, excited atoms emit light of colours characteristic of each gas, the basis of neon signs. Argon makes up 0.93 % of dry air and is obtained by fractional distillation of liquid air; helium comes from natural gas. Xenon and krypton can form a few compounds with fluorine and oxygen (such as XeF₄) because their outer electrons are further from the nucleus. Colours shown are approximate. Boiling points: He 4.2 K, Ne 27.1 K, Ar 87.3 K, Kr 119.9 K, Xe 165.0 K.",
    onChange(S, s, c, key) { if (key === "mode" || key === "el") rebuild(S, s, c); },
    reset(S, s, c) { Object.assign(c, { mode: "disc", el: "Ne", volt: 1, spin: 1 }); rebuild(S, s, c); },
    table() { return '<table class="c3-table"><tr><th style="text-align:left">Gas</th><th style="text-align:left">Z</th><th style="text-align:left">Electron arrangement</th><th style="text-align:left">Boiling point (K)</th><th style="text-align:left">Discharge colour</th></tr>' + NOBLE.map((k) => '<tr><td style="text-align:left">' + NG[k].n + '</td><td style="text-align:left">' + NG[k].Z + '</td><td style="text-align:left">' + NG[k].sh.join(",") + '</td><td style="text-align:left">' + NG[k].bp + '</td><td style="text-align:left">' + NG[k].disc + "</td></tr>").join("") + "</table>"; },
    build(S, s, c) { S.mk.box(16, 0.1, 6, M.matte(0x1d222b, 0.7), 2.0, -0.05, 0); s.root = new T.Group(); s.root.position.set(0, 1.8, 0); S.scene.add(s.root); s.t = 0; rebuild(S, s, c); },
    update(S, s, c, dt) {
      s.t += dt; const e = NG[c.el];
      if (c.mode === "disc") { const on = c.volt ? 1 : 0; s.glow.forEach((g, i) => { g.material.opacity = on * (0.55 + 0.25 * Math.sin(s.t * 9 + i * 1.3) * (c.el === "Ne" ? 0.5 : 1)); g.material.color.setHex(NG[NOBLE.indexOf(c.el) >= 0 ? c.el : "Ne"].col); }); s.core.material.opacity = on * 0.8; s.core.material.color.setHex(NG[NOBLE.indexOf(c.el) >= 0 ? c.el : "Ne"].col); s.lamp.intensity = on * 1.6; s.lamp.color.setHex(NG[NOBLE.indexOf(c.el) >= 0 ? c.el : "Ne"].col); s.pts.forEach((p, i) => { const u = p.userData; u.x += (c.volt ? 1.6 : 0) * dt * (u.dir); if (u.x > 1.7) u.x = -1.7; if (u.x < -1.7) u.x = 1.7; p.position.set(u.x, 0.12 * Math.sin(s.t * 4 + u.ph), 0.12 * Math.cos(s.t * 3 + u.ph)); p.visible = !!c.volt; }); }
      else if (c.mode === "shell") { if (c.spin) s.els.forEach((el) => { const u = el.userData; u.a += dt * u.w; el.position.set(Math.cos(u.a) * u.r, 0.0 * 0 + Math.sin(u.a) * u.r * 0.35 * 0, Math.sin(u.a) * u.r); }); s.root.rotation.x = -0.9; s.root.rotation.y = 0; }
      else { s.root.rotation.set(0, 0, 0); }
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250, e = NG[c.el];
      if (c.mode === "disc") {
        const g = NG[NOBLE.indexOf(c.el) >= 0 ? c.el : "Ne"]; H.pill(ctx, 10, 22, g.n + " discharge tube", "#ffe9b8", 10.5); H.pill(ctx, 10, 44, c.volt ? "glow colour: " + g.disc : "high voltage off: no light", "#9fe3ff", 9.5); H.pill(ctx, 10, 66, "excited atoms release the extra energy as light of a characteristic colour", "#ffd27a", 8.4);
        pillAt(ctx, S, -1.7, 2.7, 0, "electrode (−)", "#9fc4ff", 8.4); pillAt(ctx, S, 1.7, 2.7, 0, "electrode (+)", "#ffb0a0", 8.4);
        sp(ctx, px, 58, 128, g.n + " (" + (NOBLE.indexOf(c.el) >= 0 ? c.el : "Ne") + ")", ["Z = " + g.Z + ", electrons " + g.sh.join(",") , "in air: " + g.abu, "boiling point " + g.bp + " K"], 8.6); sp(ctx, px, 194, 126, "Uses", [g.use], 8.4);
      } else if (c.mode === "shell") {
        const nob = NOBLE.indexOf(c.el) >= 0; H.pill(ctx, 10, 22, e.n + ": electron arrangement " + e.sh.join(",") + "  (Z = " + e.Z + ")", "#ffe9b8", 9.6); const outer = e.sh[e.sh.length - 1], full = nob; H.pill(ctx, 10, 44, "outer shell has " + outer + " electron" + (outer > 1 ? "s" : "") + (full ? ": FULL, very stable" : ""), full ? "#8dffb8" : "#ffb48a", 9.4); H.pill(ctx, 10, 66, full ? "no tendency to gain, lose or share electrons: inert" : c.el === "Na" ? "tends to lose 1 electron → Na⁺ (reactive)" : "tends to gain 1 electron → Cl⁻ (reactive)", full ? "#8dffb8" : "#ffb48a", 8.8);
        sp(ctx, px, 58, 128, "Shells", e.sh.map((n, i) => "shell " + (i + 1) + ": " + n + " electron" + (n > 1 ? "s" : "")).concat(nob ? ["stable octet (or duplet for He)"] : []), 8.6); sp(ctx, px, 194, 126, "Why inert", ["A full outer shell is a stable arrangement, so noble gases have the highest ionisation energies in their periods and almost never form compounds.", "Compare with Na (1 outer e⁻) and Cl (7)."], 8.2);
      } else {
        H.pill(ctx, 10, 22, "Boiling point rises down Group 18", "#ffe9b8", 10.5); H.pill(ctx, 10, 44, "more electrons → stronger London forces → higher boiling point", "#9fe3ff", 9.2); H.pill(ctx, 10, 66, "atoms drawn to relative size (atomic radius in pm)", "#ffd27a", 8.6);
        NOBLE.forEach((k, i) => pillAt(ctx, S, -2.1 + i * 1.25, 0.35, 0.9, k + " " + NG[k].r + " pm", "#cfe0f5", 8.2));
        H.panel(ctx, px, 58, 240, 262); ctx.font = "600 9.5px " + FONT; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Boiling point (K)", px + 8, 73); const bw = 34, mx = 175; NOBLE.forEach((k, i) => { const x = px + 14 + i * (bw + 8), hh = (NG[k].bp / mx) * 170, y0 = 262; ctx.fillStyle = c.el === k ? "#ffd27a" : "#52627c"; ctx.fillRect(x, y0 - hh, bw, hh); ctx.fillStyle = "#e8f0ff"; ctx.font = "8.4px " + FONT; ctx.textAlign = "center"; ctx.fillText(NG[k].bp, x + bw / 2, y0 - hh - 4); ctx.fillText(k, x + bw / 2, y0 + 12); }); ctx.textAlign = "left"; ctx.fillStyle = "#9fb2d2"; ctx.font = "8.2px " + FONT; wrapT(ctx, "Only weak dispersion forces between atoms; they grow with the number of electrons.", px + 8, 290, 224, 10);
      }
      ctx.restore();
    },
    readouts(s, c) { const e = NG[c.el]; if (c.mode === "bp") return NOBLE.map((k) => [NG[k].n, NG[k].bp + " K, radius " + NG[k].r + " pm"]); return [["Element", e.n + " (" + c.el + ")"], ["Atomic number", String(e.Z)], ["Electron arrangement", e.sh.join(",")], ["Boiling point", e.bp + " K"], ["Discharge colour", e.disc], ["Use", e.use]]; },
    steps(s, c) { return [["Light each gas and match it to its colour", c.mode === "disc" ? "now" : "done"], ["Count the outer electrons: full shell = inert", c.mode === "shell" ? "now" : ""], ["Explain the rising boiling point down the group", c.mode === "bp" ? "now" : ""], ["Compare Ne, Na and Cl", ""]]; },
  };
  function rebuildNG(S, s, c) {
    while (s.root.children.length) dispose(s.root.children[0]); s.glow = []; s.pts = []; s.els = []; s.root.rotation.set(0, 0, 0); s.root.position.set(0, 1.8, 0);
    if (c.mode === "disc") {
      const tube = new T.Mesh(new T.CylinderGeometry(0.4, 0.4, 3.6, 28, 1, true), new T.MeshPhysicalMaterial({ color: 0xcfe8f5, transparent: true, opacity: 0.22, roughness: 0.05, side: T.DoubleSide, depthWrite: false })); tube.rotation.z = Math.PI / 2; s.root.add(tube);
      [-1, 1].forEach((sg) => { const e = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.3, 14), M.steel()); e.rotation.z = Math.PI / 2; e.position.x = sg * 1.75; s.root.add(e); const w = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.4, 8), M.steel()); w.rotation.z = Math.PI / 2; w.position.x = sg * 2.1; s.root.add(w); });
      for (let i = 0; i < 14; i++) { const g = new T.Sprite(new T.SpriteMaterial({ map: U.softDot(64, "rgba(255,255,255,1)"), color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); g.scale.set(1.6, 1.6, 1); g.position.set(-1.7 + (i / 13) * 3.4, 0, 0); s.root.add(g); s.glow.push(g); }
      s.core = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 3.3, 20), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })); s.core.rotation.z = Math.PI / 2; s.root.add(s.core); s.lamp = new T.PointLight(0xffffff, 0, 8); s.lamp.position.set(0, 0.4, 1.2); s.root.add(s.lamp);
      for (let i = 0; i < 26; i++) { const p = sph(0.05, 0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.6 }); p.userData = { x: -1.7 + rnd() * 3.4, ph: rnd() * 6.28, dir: i % 2 ? 1 : -0.3 }; s.root.add(p); s.pts.push(p); }
      const base = new T.Mesh(new T.BoxGeometry(4.6, 0.15, 0.7), M.matte(0x2a2f38, 0.5)); base.position.y = -0.8; s.root.add(base);
      return;
    }
    if (c.mode === "shell") {
      const e = NG[c.el]; const nuc = sph(0.35, 0xe85a4a, { emissive: 0x501810 }); s.root.add(nuc); e.sh.forEach((n, i) => { const R = 0.8 + i * 0.55, ring = new T.Mesh(new T.TorusGeometry(R, 0.012, 8, 72), new T.MeshBasicMaterial({ color: 0x6a86b8 })); ring.rotation.x = Math.PI / 2; s.root.add(ring); for (let k = 0; k < n; k++) { const el = sph(0.1, i === e.sh.length - 1 ? 0xffd23a : 0x4fb0ff, { emissive: 0x112244 }); el.userData = { r: R, a: (k / n) * 6.283 + i, w: 1.1 / (1 + i * 0.5) }; el.position.set(Math.cos(el.userData.a) * R, 0, Math.sin(el.userData.a) * R); s.root.add(el); s.els.push(el); } }); s.root.position.set(0, 2.0, 0); s.root.scale.setScalar(e.sh.length > 4 ? 0.75 : e.sh.length > 3 ? 0.9 : 1.1); return;
    }
    NOBLE.forEach((k, i) => { const r = NG[k].r / 100 * 0.62; const m = sph(r, NG[k].col, { transparent: true, opacity: 0.88 }); m.position.set(-2.1 + i * 1.25, -1.8 + r + 0.05, 0); s.root.add(m); });
  }
  C3.scenes.nobleGases.onChange = function (S, s, c, key) { if (key === "mode" || key === "el") rebuildNG(S, s, c); };
  C3.scenes.nobleGases.reset = function (S, s, c) { Object.assign(c, { mode: "disc", el: "Ne", volt: 1, spin: 1 }); rebuildNG(S, s, c); };
  C3.scenes.nobleGases.build = function (S, s, c) { S.mk.box(16, 0.1, 6, M.matte(0x1d222b, 0.7), 2.0, -0.05, 0); s.root = new T.Group(); s.root.position.set(0, 1.8, 0); S.scene.add(s.root); s.t = 0; rebuildNG(S, s, c); };

  /* =================== 3. FOOD TESTS & AMINO ACIDS =================== */
  const SMP = { glucose: "Glucose solution", sucrose: "Sucrose solution", starch: "Starch suspension", egg: "Egg white (protein)", oil: "Vegetable oil", gly: "Glycine (amino acid)", water: "Distilled water" };
  const SPK = Object.keys(SMP);
  const RGT = {
    benedict: { n: "Benedict's solution (heat)", start: [60, 120, 220, 0.5], pos: { glucose: [225, 110, 50, 0.7] }, ppt: { glucose: 1 }, look: { glucose: "blue → green → orange-red precipitate (reducing sugar)", sucrose: "stays blue: sucrose is a non-reducing sugar", starch: "stays blue", egg: "stays blue", oil: "stays blue", gly: "stays blue", water: "stays blue" }, tests: "reducing sugars (glucose, fructose, maltose)" },
    iodine: { n: "Iodine solution", start: [200, 140, 50, 0.55], pos: { starch: [20, 20, 70, 0.85] }, ppt: {}, look: { starch: "orange-brown → blue-black (starch)", glucose: "stays orange-brown", sucrose: "stays orange-brown", egg: "stays orange-brown", oil: "stays orange-brown", gly: "stays orange-brown", water: "stays orange-brown" }, tests: "starch" },
    biuret: { n: "Biuret reagent (NaOH + CuSO₄)", start: [60, 120, 225, 0.5], pos: { egg: [150, 70, 200, 0.65] }, ppt: {}, look: { egg: "blue → violet (peptide bonds: protein)", glucose: "stays blue", sucrose: "stays blue", starch: "stays blue", oil: "stays blue", gly: "stays blue: a single amino acid has no peptide bond", water: "stays blue" }, tests: "proteins (peptide bonds)" },
    emulsion: { n: "Emulsion test (ethanol, then water)", start: [225, 235, 240, 0.15], pos: { oil: [245, 245, 245, 0.7] }, ppt: {}, look: { oil: "clear → cloudy white emulsion (fat or oil)", glucose: "stays clear", sucrose: "stays clear", starch: "stays clear", egg: "stays clear", gly: "stays clear", water: "stays clear" }, tests: "fats and oils (lipids)" },
    ninhydrin: { n: "Ninhydrin (warm)", start: [250, 235, 190, 0.3], pos: { gly: [130, 40, 150, 0.75], egg: [170, 100, 180, 0.5] }, ppt: {}, look: { gly: "pale yellow → purple (amino acid)", egg: "weak purple (free amino groups)", glucose: "stays pale yellow", sucrose: "stays pale yellow", starch: "stays pale yellow", oil: "stays pale yellow", water: "stays pale yellow" }, tests: "amino acids" },
  };
  const RGK = Object.keys(RGT);
  /* glycine forms */
  const gly = (form) => { const a = [["C", 0, 0, 0], ["N", -1.2, 0.85, 0], ["C", 1.52, 0, 0], ["O", 2.1, 1.0, 0], ["O", 2.1, -1.1, 0], ["H", -0.35, -0.5, 0.89], ["H", -0.35, -0.5, -0.89], ["H", -2.1, 0.55, 0.35], ["H", -1.2, 1.55, 0.85]]; if (form !== "anion") a.push(["H", -1.2, 1.55, -0.85]); if (form === "cation") a.push(["H", 3.0, -1.4, 0]); return a; };
  const GCOL = { H: 0xf4f4f4, C: 0x3b3f46, N: 0x3454e8, O: 0xe8281c }, GRC = { H: 0.31, C: 0.76, N: 0.71, O: 0.66 };
  function glyMol(K, form) { const at = gly(form), b = []; for (let i = 0; i < at.length; i++) for (let j = i + 1; j < at.length; j++) { const d = Math.hypot(at[i][1] - at[j][1], at[i][2] - at[j][2], at[i][3] - at[j][3]); if (d < (GRC[at[i][0]] + GRC[at[j][0]]) * 1.25) b.push([i, j, i === 2 && j === 3 ? 2 : 1]); } let cx = 0, cy = 0, cz = 0; at.forEach((a) => { cx += a[1]; cy += a[2]; cz += a[3]; }); cx /= at.length; cy /= at.length; cz /= at.length; const mol = K.molecule({ atoms: at.map((a) => ({ el: a[0], p: [a[1] - cx, a[2] - cy, a[3] - cz] })), bonds: b }); mol.refresh(0.15); mol.atoms.forEach((q, i) => q.mesh.material.color.setHex(GCOL[at[i][0]])); mol.group.scale.setScalar(0.75); mol.cen = [cx, cy, cz]; mol.at = at; return mol; }
  const frac = (pH) => { const k1 = Math.pow(10, -2.34), k2 = Math.pow(10, -9.6), h = Math.pow(10, -pH), d = h * h + k1 * h + k1 * k2; return { cat: (h * h) / d, zw: (k1 * h) / d, an: (k1 * k2) / d }; };
  C3.scenes.biochemTests = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[1.6, 2.1, 6.6], [2.0, 1.6, 0]],
    values: { mode: "tests", smp: "glucose", rg: "benedict", prog: 0, run: 1, pH: 6 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Activity", options: [{ value: "tests", label: "Food tests with reagents" }, { value: "amino", label: "Amino acid (glycine) at different pH" }] },
        { type: "select", key: "smp", label: "Food sample (tests)", options: SPK.map((k) => ({ value: k, label: SMP[k] })) },
        { type: "select", key: "rg", label: "Reagent (tests)", options: RGK.map((k) => ({ value: k, label: RGT[k].n + " — tests for " + RGT[k].tests })) },
        { type: "range", key: "prog", label: "Progress of the test (%)", min: 0, max: 100, step: 1, unit: " %" },
        { type: "toggle", key: "run", label: "Run automatically (tests)" },
        { type: "range", key: "pH", label: "pH of the solution (amino acid)", min: 0.5, max: 12.5, step: 0.1, unit: "" },
      ];
    },
    views: [{ label: "Test tube", cam: [[1.6, 2.1, 6.6], [2.0, 1.6, 0]] }, { label: "Wide", cam: [[2.2, 2.4, 9.6], [2.2, 1.8, 0]] }],
    note: "Food tests identify the main classes of food. Benedict's test: heat the sample with Benedict's solution; a blue colour changing through green and yellow to an orange-red precipitate of copper(I) oxide shows a reducing sugar (glucose, fructose, maltose, lactose), but sucrose does not react until hydrolysed by acid. Iodine test: iodine solution turns blue-black with starch. Biuret test: sodium hydroxide then dilute copper(II) sulphate gives a violet colour with proteins (peptide bonds). Emulsion test: shake the sample with ethanol, then add water; a cloudy white emulsion shows fats or oils. Ninhydrin turns purple with amino acids. An amino acid has an amino group (–NH₂) and a carboxyl group (–COOH) on the same carbon. In water near neutral pH it exists as a zwitterion (+H₃N–CH₂–COO⁻), is a cation at low pH and an anion at high pH; the isoelectric point of glycine is about pH 6. Colours are indicative of the standard results.",
    onChange(S, s, c, key) { if (key === "smp" || key === "rg") { c.prog = 0; s.ppt && (s.ppt.amount = 0); } if (key === "mode" || key === "pH") rebuildB(S, s, c); if (key === "mode") C3.setView(S, { cam: c.mode === "amino" ? [[2.2, 2.6, 10.0], [2.2, 1.9, 0]] : [[1.6, 2.1, 6.6], [2.0, 1.6, 0]] }); },
    reset(S, s, c) { Object.assign(c, { mode: "tests", smp: "glucose", rg: "benedict", prog: 0, run: 1, pH: 6 }); rebuildB(S, s, c); },
    table() { return '<table class="c3-table"><tr><th style="text-align:left">Food class</th><th style="text-align:left">Reagent</th><th style="text-align:left">Positive result</th></tr><tr><td style="text-align:left">reducing sugar</td><td style="text-align:left">Benedict\'s, heat</td><td style="text-align:left">orange-red precipitate</td></tr><tr><td style="text-align:left">starch</td><td style="text-align:left">iodine solution</td><td style="text-align:left">blue-black</td></tr><tr><td style="text-align:left">protein</td><td style="text-align:left">biuret</td><td style="text-align:left">violet</td></tr><tr><td style="text-align:left">fat / oil</td><td style="text-align:left">ethanol then water</td><td style="text-align:left">cloudy white emulsion</td></tr><tr><td style="text-align:left">amino acid</td><td style="text-align:left">ninhydrin, warm</td><td style="text-align:left">purple</td></tr></table>'; },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; S.mk.box(13, 0.1, 5, M.matte(0xb99a74, 0.6), 2.0, -0.05, 0); s.t = 0;
      s.tube = K.vessel("testtube"); s.tube.group.position.set(0.4, 0.07, 0); s.liq = s.tube.addLiquid({ color: [60, 120, 220], opacity: 0.5 }); s.liq.setVolume(12); s.ppt = K.precipitate(s.tube, s.liq, { n: 500, size: 0.07, color: 0xb4351a }); s.bun = K.bunsen({ x: 1.9, z: -0.3, flameH: 2 }); s.bun.setAir(1); s.bun.setGas(0); s.bun.visible = false;
      s.molG = new T.Group(); s.molG.position.set(0.3, 2.0, 0); S.scene.add(s.molG); s.mol = null; rebuildB(S, s, c);
    },
    update(S, s, c, dt) {
      const tests = c.mode === "tests"; s.tube.group.visible = tests; s.molG.visible = !tests; if (!tests) { s.molG.rotation.y += dt * 0.4; s.bun.visible = false; return; }
      if (c.run && c.prog < 100) c.prog = Math.min(100, c.prog + dt * 11); const r = RGT[c.rg], pos = r.pos[c.smp], f = sm(clamp(c.prog / 100, 0, 1)); const col = pos ? lerp3(r.start, pos, f) : r.start; s.liq.setColor(col.slice(0, 3), col[3]); s.liq.update(S.t); s.ppt.amount = r.ppt[c.smp] ? clamp((f - 0.3) / 0.6, 0, 1) : 0; s.ppt.update(dt); const heat = c.rg === "benedict" || c.rg === "ninhydrin"; s.bun.visible = heat; s.bun.setGas(heat && c.prog > 0 && c.prog < 100 ? 0.7 : 0); s.bun.flame.update(S.t); s.pos = !!pos;
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250;
      if (c.mode === "tests") {
        const r = RGT[c.rg], look = r.look[c.smp], pos = !!r.pos[c.smp]; H.pill(ctx, 10, 22, SMP[c.smp] + " + " + r.n, "#ffe9b8", 9.6); H.pill(ctx, 10, 44, "result: " + (c.prog > 95 ? look : "testing ..."), pos ? "#8dffb8" : "#ffd27a", 8.6); H.pill(ctx, 10, 66, pos ? "POSITIVE for " + r.tests : "negative for " + r.tests, pos ? "#8dffb8" : "#ffb48a", 9);
        if (c.rg === "benedict" || c.rg === "ninhydrin") pillAt(ctx, S, 1.9, 0.0, 0.8, "heating (about 80 °C)", "#ffb48a", 8.4);
        sp(ctx, px, 58, 128, "Observation", [look, "tests for: " + r.tests], 8.6); sp(ctx, px, 194, 126, "Remember", ["Always include a negative control (distilled water) and compare colours with it.", "Benedict's test needs heat; sucrose is negative until it is hydrolysed."], 8.3);
      } else {
        const f = frac(c.pH), form = s.form, name = form === "cation" ? "cation (low pH)" : form === "anion" ? "anion (high pH)" : "zwitterion (near neutral)"; H.pill(ctx, 10, 22, "Glycine, H₂N–CH₂–COOH   pH " + c.pH.toFixed(1), "#ffe9b8", 10); H.pill(ctx, 10, 44, "dominant form: " + name, "#9fe3ff", 9.4); H.pill(ctx, 10, 66, "net charge " + (form === "cation" ? "+1" : form === "anion" ? "−1" : "0") + "     isoelectric point about pH 6.0", "#ffd27a", 9);
        if (s.mol) { const wp = (a, k) => S.proj(s.mol.group.localToWorld(s.mol.atoms[a].mesh.position.clone())); const nn = wp(1), o1 = wp(4); if (form !== "anion") H.pill(ctx, nn.x - 28, nn.y - 14, "–NH₃⁺", "#9fc4ff", 9, "center"); else H.pill(ctx, nn.x - 28, nn.y - 14, "–NH₂", "#9fc4ff", 9, "center"); H.pill(ctx, o1.x + 8, o1.y + 20, form === "cation" ? "–COOH" : "–COO⁻", "#ff9a8a", 9, "center"); }
        sp(ctx, px, 58, 110, "Amphoteric", ["Amino acids contain a basic –NH₂ and an acidic –COOH group, so they react with both acids and alkalis."], 8.4);
        H.panel(ctx, px, 176, 240, 144); ctx.font = "600 9.5px " + FONT; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Fraction of each form", px + 8, 191); const bars = [["cation", f.cat, "#ff9a8a"], ["zwitterion", f.zw, "#8dffb8"], ["anion", f.an, "#9fc4ff"]]; bars.forEach((b, i) => { const y = 204 + i * 28; ctx.fillStyle = "#52627c"; ctx.fillRect(px + 12, y, 200, 12); ctx.fillStyle = b[2]; ctx.fillRect(px + 12, y, 200 * clamp(b[1], 0, 1), 12); ctx.font = "8.4px " + FONT; ctx.fillStyle = "#e8f0ff"; ctx.fillText(b[0] + " " + (b[1] * 100).toFixed(0) + " %", px + 12, y + 24); });
      }
      ctx.restore();
    },
    readouts(s, c) { if (c.mode === "tests") { const r = RGT[c.rg]; return [["Sample", SMP[c.smp]], ["Reagent", r.n], ["Tests for", r.tests], ["Result", r.look[c.smp]]]; } const f = frac(c.pH); return [["pH", c.pH.toFixed(1)], ["Cation / zwitterion / anion", (f.cat * 100).toFixed(0) + " / " + (f.zw * 100).toFixed(0) + " / " + (f.an * 100).toFixed(0) + " %"], ["pKa values (glycine)", "2.34 (COOH), 9.60 (NH₃⁺)"], ["Isoelectric point", "about 5.97"]]; },
    steps(s, c) { return [["Test glucose, sucrose and starch with Benedict's and iodine", c.mode === "tests" ? "now" : "done"], ["Test egg white with biuret and oil with the emulsion test", ""], ["Run the water control for every reagent", c.smp === "water" ? "done" : ""], ["Move the pH slider to see glycine as cation, zwitterion and anion", c.mode === "amino" ? "now" : ""]]; },
  };
  function rebuildB(S, s, c) {
    if (s.mol) { dispose(s.mol.group); s.mol = null; } if (c.mode === "amino") { const f = frac(c.pH); s.form = f.cat > f.zw && f.cat > f.an ? "cation" : f.an > f.zw ? "anion" : "zwitterion"; s.mol = glyMol(s.K, s.form); s.molG.add(s.mol.group); }
  }

  /* =================== 4. LIMESTONE CYCLE & SODIUM COMPOUNDS =================== */
  const LS = {
    decomp: { n: "1. Heat limestone (thermal decomposition)", eq: "CaCO₃(s) → CaO(s) + CO₂(g)", dH: "+178 kJ/mol (endothermic)", type: "heat", g: "CO₂", note: "Strong heating (about 900–1000 °C) drives off carbon dioxide and leaves quicklime. The solid loses mass: 100 g CaCO₃ gives 56 g CaO. Used to make cement and quicklime.", a: [235, 238, 235], obs: "white lumps shrink; gas released; quicklime glows white-hot" },
    slake: { n: "2. Slake quicklime with water", eq: "CaO(s) + H₂O(l) → Ca(OH)₂(aq/s)", dH: "−65 kJ/mol (exothermic)", type: "aq", g: "", note: "Quicklime reacts violently with water, producing much heat (steam) and slaked lime; the solution is alkaline (pH about 12.4). Used to neutralise acidic soil and lakes.", c0: [225, 235, 240, 0.14], c1: [240, 240, 235, 0.5], obs: "temperature rises; milky solution forms" },
    lime: { n: "3. Limewater test for CO₂", eq: "Ca(OH)₂(aq) + CO₂(g) → CaCO₃(s) + H₂O(l)", dH: "exothermic (small)", type: "aq", g: "CO₂", note: "Carbon dioxide turns clear limewater milky because insoluble white calcium carbonate precipitates. This is the standard test for CO₂.", c0: [225, 235, 240, 0.14], c1: [245, 245, 245, 0.6], obs: "clear → milky", ppt: 1 },
    excess: { n: "4. Excess CO₂ clears the milkiness", eq: "CaCO₃(s) + CO₂(g) + H₂O(l) → Ca(HCO₃)₂(aq)", dH: "reversible", type: "aq", g: "CO₂", note: "More carbon dioxide dissolves the precipitate, giving soluble calcium hydrogencarbonate (temporary hard water). Boiling reverses it and forms limescale.", c0: [245, 245, 245, 0.6], c1: [225, 235, 240, 0.14], obs: "milky → clear again", ppt: -1 },
    na: { n: "5. Sodium on water", eq: "2Na(s) + 2H₂O(l) → 2NaOH(aq) + H₂(g)", dH: "−368 kJ per 2 mol Na (exothermic)", type: "aq", g: "H₂", note: "Sodium floats, melts into a silvery ball, skates about and fizzes as hydrogen forms. The solution becomes strongly alkaline: universal indicator turns purple. Sodium is stored under oil.", c0: [90, 200, 90, 0.35], c1: [140, 60, 180, 0.5], obs: "fizzing, ball shrinks, indicator turns purple", sod: 1 },
    nahco3: { n: "6. Heat sodium hydrogencarbonate", eq: "2NaHCO₃(s) → Na₂CO₃(s) + H₂O(g) + CO₂(g)", dH: "endothermic", type: "heat", g: "CO₂", note: "Baking soda decomposes on heating, releasing carbon dioxide (which makes cakes rise) and water vapour; sodium carbonate remains. Sodium carbonate itself is stable to heat.", a: [250, 250, 250], obs: "white solid fizzes; condensation on cool tube" },
    na2co3: { n: "7. Sodium carbonate + acid", eq: "Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂", dH: "small", type: "aq", g: "CO₂", note: "Carbonates fizz with dilute acids, releasing CO₂. Universal indicator changes from purple (alkaline carbonate) to green when the acid is used up.", c0: [140, 60, 180, 0.45], c1: [90, 200, 90, 0.35], obs: "effervescence; purple → green" },
    naoh: { n: "8. Sodium hydroxide + hydrochloric acid", eq: "NaOH + HCl → NaCl + H₂O", dH: "−57 kJ/mol (neutralisation)", type: "aq", g: "", note: "A strong alkali and a strong acid neutralise to give a neutral salt solution. Phenolphthalein turns from pink to colourless at the end-point.", c0: [235, 50, 150, 0.55], c1: [235, 235, 242, 0.12], obs: "pink → colourless; warm" },
  };
  const LSK = Object.keys(LS);
  C3.scenes.limeCycle = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[2.0, 2.8, 8.8], [2.4, 1.6, 0]],
    values: { st: "decomp", prog: 0, run: 1 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "st", label: "Stage / reaction", options: LSK.map((k) => ({ value: k, label: LS[k].n })) },
        { type: "range", key: "prog", label: "Progress (%)", min: 0, max: 100, step: 1, unit: " %" },
        { type: "toggle", key: "run", label: "Run automatically" },
        { type: "button", label: "Restart", action: (S, s, c) => { c.prog = 0; } },
      ];
    },
    views: [{ label: "Bench", cam: [[2.0, 2.8, 8.8], [2.4, 1.6, 0]] }, { label: "Close", cam: [[1.6, 2.2, 6.2], [1.8, 1.6, 0]] }],
    note: "The limestone cycle links calcium carbonate (limestone, chalk, marble), calcium oxide (quicklime), calcium hydroxide (slaked lime, limewater) and back to calcium carbonate. Heating CaCO₃ strongly decomposes it (endothermic) to CaO and CO₂. Adding water to CaO is highly exothermic and gives Ca(OH)₂; its saturated solution is limewater. Bubbling CO₂ through limewater gives milky CaCO₃, and excess CO₂ forms soluble Ca(HCO₃)₂ (temporary hardness). Sodium compounds: sodium is a soft, reactive Group 1 metal stored under oil that reacts vigorously with water to give NaOH and hydrogen; sodium hydroxide is a strong alkali made by electrolysing brine; sodium carbonate and sodium hydrogencarbonate are made in the Solvay process, the latter decomposing on heating to give CO₂. Enthalpy values are standard textbook values; flames and sprites are illustrative.",
    onChange(S, s, c, key) { if (key === "st") { c.prog = 0; rebuildL(S, s, c); C3.setView(S, { cam: LS[c.st].type === "heat" ? [[2.0, 5.0, 9.6], [2.0, 2.6, 0]] : [[2.0, 2.8, 8.8], [2.4, 1.6, 0]] }); } },
    reset(S, s, c) { Object.assign(c, { st: "decomp", prog: 0, run: 1 }); rebuildL(S, s, c); },
    table() { return '<table class="c3-table"><tr><th style="text-align:left">Stage</th><th style="text-align:left">Equation</th><th style="text-align:left">ΔH</th></tr>' + LSK.map((k) => '<tr><td style="text-align:left">' + LS[k].n + '</td><td style="text-align:left">' + LS[k].eq + '</td><td style="text-align:left">' + LS[k].dH + "</td></tr>").join("") + "</table>"; },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; S.mk.box(13, 0.1, 5, M.matte(0xb99a74, 0.6), 2.0, -0.05, 0); s.t = 0;
      s.bk = K.beaker(); s.bk.group.position.set(1.4, 0.07, 0); s.liq = s.bk.addLiquid({ color: [225, 235, 240], opacity: 0.14 }); s.liq.setVolume(200); s.bub = K.bubbles(s.bk, s.liq, { n: 70, x: 0, z: 0, baseY: 0.4, spread: 0.5 }); s.ppt = K.precipitate(s.bk, s.liq, { n: 1200, size: 0.05, color: 0xffffff }); s.na = sph(0.2, 0xdfe3ea, { metalness: 0.8, roughness: 0.25 }); S.scene.add(s.na); s.lump = new T.Mesh(new T.BoxGeometry(0.4, 0.3, 0.4), M.matte(0xf2efe6, 0.8)); s.lump.position.set(1.4, 0.35, 0); S.scene.add(s.lump);
      s.bun = K.bunsen({ x: 1.4, z: 0, flameH: 3 }); s.bun.setAir(1); s.bun.setGas(0.8); s.dy = 3.2; s.hg = new T.Group(); S.scene.add(s.hg); s.hg.position.set(1.4, 0, 0);
      const dish = new T.Mesh(new T.CylinderGeometry(1.0, 0.7, 0.3, 32, 1, true), new T.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.5, side: T.DoubleSide, transparent: true, opacity: 0.5, depthWrite: false })); dish.position.y = s.dy + 0.15; s.hg.add(dish); const bot = new T.Mesh(new T.CircleGeometry(0.7, 28), new T.MeshStandardMaterial({ color: 0xe9e6df, side: T.DoubleSide, transparent: true, opacity: 0.5 })); bot.rotation.x = -Math.PI / 2; bot.position.y = s.dy + 0.01; s.hg.add(bot); for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5, leg = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, s.dy - 0.02, 8), M.steel()); leg.position.set(0.8 * Math.cos(a), (s.dy - 0.02) / 2, 0.8 * Math.sin(a)); s.hg.add(leg); } const gz = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 0.03, 24), new T.MeshStandardMaterial({ color: 0x8c8f94 })); gz.position.y = s.dy - 0.03; s.hg.add(gz);
      s.ch = []; for (let i = 0; i < 16; i++) { const b = new T.Mesh(new T.IcosahedronGeometry(0.12 + rnd() * 0.04, 0), new T.MeshStandardMaterial({ color: 0xf0efe8, roughness: 0.85, emissive: 0x000000 })); const r = 0.5 * Math.sqrt(rnd()), a = rnd() * 6.28; b.position.set(r * Math.cos(a), s.dy + 0.12, r * Math.sin(a)); s.hg.add(b); s.ch.push(b); }
      s.gas = []; for (let i = 0; i < 12; i++) { const g = new T.Sprite(new T.SpriteMaterial({ map: U.softDot(48, "rgba(220,230,240,1)"), color: 0xdce6f0, transparent: true, opacity: 0, depthWrite: false })); g.scale.set(0.45, 0.45, 1); s.hg.add(g); s.gas.push(g); }
      s.stm = []; for (let i = 0; i < 10; i++) { const g = new T.Sprite(new T.SpriteMaterial({ map: U.softDot(48, "rgba(240,245,250,1)"), color: 0xf0f5fa, transparent: true, opacity: 0, depthWrite: false })); g.scale.set(0.6, 0.6, 1); S.scene.add(g); s.stm.push(g); }
      rebuildL(S, s, c);
    },
    update(S, s, c, dt) {
      const st = LS[c.st], heat = st.type === "heat"; if (c.run && c.prog < 100) c.prog = Math.min(100, c.prog + dt * 9); const p = c.prog / 100, f = sm(p);
      s.bk.group.visible = !heat; s.hg.visible = heat; s.bun.visible = heat; s.na.visible = !!st.sod && !heat; s.lump.visible = c.st === "slake" && p < 0.4; s.stm.forEach((g) => (g.material.opacity = 0));
      if (heat) { s.bun.setGas(p < 0.98 && c.prog > 0 ? 0.85 : 0.35); s.bun.flame.update(S.t); const lost = c.st === "decomp" ? f * 0.44 : f * 0.37; s.ch.forEach((b, i) => { b.scale.setScalar(1 - lost * 1.1); const glow = c.st === "decomp" ? clamp(f * 1.4, 0, 1) : 0; b.material.emissive.setRGB(0.9 * glow, 0.5 * glow, 0.1 * glow); b.material.color.setRGB(0.94 + 0.03 * f, 0.94, 0.9 - 0.05 * f); }); s.gas.forEach((g, i) => { const ph = (S.t * 0.35 + i / 12) % 1; g.position.set(0.25 * Math.sin(i * 2.4 + S.t), s.dy + 0.4 + ph * 1.9, 0.25 * Math.cos(i * 1.7)); g.material.opacity = p > 0.02 && p < 0.97 ? 0.45 * (1 - ph) : 0; }); }
      else {
        const col = lerp3(st.c0, st.c1, f); s.liq.setColor(col.slice(0, 3), col[3]); s.liq.update(S.t); const gasOn = st.g && p > 0.02 && p < 0.98; s.bub.rate = gasOn ? (c.st === "na" ? 1.6 : 1.0) : 0; s.bub.update(dt, S.t); s.ppt.amount = st.ppt === 1 ? clamp((f - 0.15) / 0.7, 0, 1) : st.ppt === -1 ? clamp(1 - f * 1.3, 0, 1) : (c.st === "slake" ? clamp(f, 0, 0.8) : 0); s.ppt.update(dt);
        if (st.sod) { const r = 0.2 * (1 - 0.95 * f); s.na.scale.setScalar(Math.max(0.05, 1 - 0.95 * f)); s.na.position.set(1.4 + 0.45 * Math.sin(S.t * 1.7) * (1 - f * 0.5), (s.liq.level > 0 && s.liq.level < 5 ? s.liq.level : 1.15) + 0.1, 0.35 * Math.cos(S.t * 1.3)); }
        if (c.st === "slake" && p > 0.05 && p < 0.95) s.stm.forEach((g, i) => { const ph = (S.t * 0.4 + i / 10) % 1; g.position.set(1.4 + 0.4 * Math.sin(i * 2 + S.t), 2.0 + ph * 1.6, 0.3 * Math.cos(i * 3)); g.material.opacity = 0.4 * (1 - ph); });
      }
    },
    overlay(ctx, s, c, w, h, S) {
      const st = LS[c.st], heat = st.type === "heat", p = c.prog / 100, px = w - 250; ctx.save(); ctx.textAlign = "left";
      H.pill(ctx, 10, 22, st.n, "#ffe9b8", 9.6); H.pill(ctx, 10, 44, st.eq, "#9fe3ff", 9); H.pill(ctx, 10, 66, "ΔH = " + st.dH + "    progress " + c.prog.toFixed(0) + " %", "#ffd27a", 8.6);
      if (heat) { pillAt(ctx, S, 1.4, s.dy + 0.9, 0, c.st === "decomp" ? (p < 0.5 ? "CaCO₃ (white lumps)" : "CaO (quicklime, white-hot)") : "NaHCO₃ → Na₂CO₃", "#cfe0f5", 8.8); if (st.g) pillAt(ctx, S, 2.3, s.dy + 1.8, 0, st.g + " ↑", "#d8e6f5", 8.8); }
      else { pillAt(ctx, S, 1.4, 3.2, 0, (c.st === "slake" ? "T ≈ " + (22 + 70 * Math.sin(Math.min(p, 1) * 3.1)).toFixed(0) + " °C" : st.obs), "#cfe0f5", 8.4); }
      sp(ctx, px, 58, 150, "What happens", [st.note], 8.2); sp(ctx, px, 216, 104, "Observation", [st.obs, "ΔH: " + st.dH], 8.4);
      ctx.restore();
    },
    readouts(s, c) { const st = LS[c.st]; return [["Stage", st.n], ["Equation", st.eq], ["Enthalpy change", st.dH], ["Observation", st.obs], ["Gas", st.g || "none"]]; },
    steps(s, c) { return [["Heat limestone and watch CaO form", c.st === "decomp" ? "now" : "done"], ["Slake the lime and then test with CO₂", c.st === "slake" || c.st === "lime" ? "now" : ""], ["Add excess CO₂: why does the milk clear?", c.st === "excess" ? "now" : ""], ["Compare sodium reactions: water, heating and acid", c.st === "na" || c.st === "nahco3" || c.st === "na2co3" || c.st === "naoh" ? "now" : ""]]; },
  };
  function rebuildL(S, s, c) { const st = LS[c.st]; s.liq.setColor(st.c0 ? st.c0.slice(0, 3) : [225, 235, 240], st.c0 ? st.c0[3] : 0.14); s.ppt.reset && s.ppt.reset(); s.ppt.amount = 0; }
  /* wire the real build/rebuild for scenes whose rebuild is defined after the object literal */
  C3.scenes.complexShapes.onChange = function (S, s, c, key) { if (key === "cx" || key === "mode" || key === "si" || key === "Tk") rebuild(S, s, c); };
})();
