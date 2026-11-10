/* b3d-cells.js — Topic A (Concept of Living) photoreal 3D labs:
   A-d cell structure (plant / animal / bacterium, cut-away, every organelle selectable)
   A-c, A-f, A-h, A-j  single-celled organisms (Amoeba, Paramecium, Euglena, Chlamydomonas, Volvox, Spirogyra, cheek cells, yeast)
   A-e membrane transport (diffusion, osmosis, active transport, red cells, plasmolysis)
   A-k + GH2-d cell division (mitosis, meiosis, binary fission, budding) */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, W = MK.when, f = MK.fmt;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);

  /* =====================================================================
     A-d  CELL STRUCTURE
     ===================================================================== */
  const ORG = {
    wall: { n: "Cell wall", fn: "Rigid cellulose layer; gives shape, support and stops the cell bursting (turgor).", in: "plant" },
    mem: { n: "Cell membrane", fn: "Selectively permeable lipid–protein layer; controls what enters and leaves.", in: "both" },
    nuc: { n: "Nucleus", fn: "Contains chromosomes (DNA); controls cell activities and heredity. Nucleolus makes ribosomes.", in: "both" },
    mito: { n: "Mitochondria", fn: "Site of aerobic respiration — Krebs cycle and oxidative phosphorylation make ATP.", in: "both" },
    chl: { n: "Chloroplasts", fn: "Contain chlorophyll in grana; site of photosynthesis (light and dark reactions).", in: "plant" },
    vac: { n: "Large vacuole", fn: "Stores cell sap (water, salts, sugars); keeps the cell turgid.", in: "plant" },
    er: { n: "Endoplasmic reticulum", fn: "Network of membranes; rough ER carries ribosomes and transports proteins, smooth ER makes lipids.", in: "both" },
    gol: { n: "Golgi body", fn: "Stack of flattened sacs; packages and secretes proteins in vesicles.", in: "both" },
    ribo: { n: "Ribosomes", fn: "Tiny granules on ER and in cytoplasm; site of protein synthesis.", in: "both" },
    lys: { n: "Lysosomes", fn: "Vesicles of digestive enzymes; break down worn-out organelles and engulfed food.", in: "animal" },
    cen: { n: "Centrosome (centrioles)", fn: "Organises the spindle fibres during cell division (animal cells).", in: "animal" },
    cyt: { n: "Cytoplasm", fn: "Jelly-like medium where most chemical reactions of the cell take place.", in: "both" },
  };
  const orgList = (type) => Object.keys(ORG).filter((k) => ORG[k].in === "both" || ORG[k].in === type);
  function buildCell(S, s, c) {
    const g = BK.group(S, s, "cell"), M = BK.mat, plant = c.type === "plant", bact = c.type === "bacteria";
    const clip = [new (T().Plane)(V(0, 0, -1), 0.02)]; S.renderer.localClippingEnabled = true; s.parts = {};
    const reg = (k, m) => { (s.parts[k] = s.parts[k] || []).push(m); m.userData.org = k; g.add(m); return m; };
    if (bact) {
      const wall = reg("wall", new (T().Mesh)(new (T().CapsuleGeometry)(0.9, 2.6, 16, 32), Object.assign(M.membrane(0xb8e08a, 0.35), { clippingPlanes: clip }))); wall.rotation.z = Math.PI / 2;
      const memb = reg("mem", new (T().Mesh)(new (T().CapsuleGeometry)(0.8, 2.6, 16, 32), Object.assign(M.membrane(0xffe9a8, 0.3), { clippingPlanes: clip }))); memb.rotation.z = Math.PI / 2;
      const dna = []; for (let i = 0; i <= 80; i++) { const t = i / 80 * Math.PI * 6; dna.push(V(Math.cos(t * 1.3) * 0.9 + Math.sin(t * 0.5) * 0.3, Math.sin(t) * 0.35, Math.cos(t) * 0.3)); }
      reg("nuc", new (T().Mesh)(new (T().TubeGeometry)(new (T().CatmullRomCurve3)(dna, true), 240, 0.035, 8, true), M.organelle(0x5f8cff, 0.3)));
      const rb = MK.rng(5), im = new (T().InstancedMesh)(new (T().SphereGeometry)(0.035, 8, 6), M.organelle(0x8a6dcc, 0.2), 260), m4 = new (T().Matrix4)();
      for (let i = 0; i < 260; i++) { m4.makeTranslation((rb() - 0.5) * 3.6, (rb() - 0.5) * 1.3, (rb() - 0.5) * 1.3); im.setMatrixAt(i, m4); } reg("ribo", im);
      const fl = []; for (let i = 0; i <= 30; i++) fl.push(V(-2.2 - i * 0.09, Math.sin(i * 0.6) * 0.18, 0)); s.flag = reg("mem", new (T().Mesh)(new (T().TubeGeometry)(new (T().CatmullRomCurve3)(fl), 60, 0.03, 6), M.organelle(0xd9c58a)));
      reg("cyt", new (T().Mesh)(new (T().CapsuleGeometry)(0.75, 2.5, 12, 24), Object.assign(M.cyto(0xe6f2c4, 0.12), { clippingPlanes: clip }))).rotation.z = Math.PI / 2;
      return;
    }
    // envelope
    if (plant) {
      reg("wall", new (T().Mesh)(new (T().BoxGeometry)(4.6, 3.2, 3.2, 1, 1, 1), Object.assign(M.membrane(0x9fd08a, 0.42), { clippingPlanes: clip })));
      reg("mem", new (T().Mesh)(BK.blob(1, 3, 0.02, 40, 2.2, 1.5, 1.5), Object.assign(M.membrane(0xfff0b0, 0.2), { clippingPlanes: clip })));
      reg("vac", new (T().Mesh)(BK.blob(1, 9, 0.08, 40, 1.35, 0.9, 0.9), Object.assign(M.membrane(0x9fd4ff, 0.32), { clippingPlanes: clip }))).position.set(0.3, 0, 0);
    } else {
      reg("mem", new (T().Mesh)(BK.blob(2.1, 4, 0.1, 64, 1.1, 0.8, 0.9), Object.assign(M.membrane(0xffd6c4, 0.3), { clippingPlanes: clip })));
    }
    reg("cyt", new (T().Mesh)(plant ? BK.blob(1, 3, 0.02, 32, 2.15, 1.45, 1.45) : BK.blob(2.05, 4, 0.1, 40, 1.1, 0.8, 0.9), Object.assign(M.cyto(plant ? 0xd9efc7 : 0xf5d9cf, 0.1), { clippingPlanes: clip })));
    // nucleus with pores and nucleolus
    const np = plant ? V(-1.45, 0.35, 0.2) : V(-0.2, 0.15, 0.1);
    const nucG = new (T().Group)(); nucG.position.copy(np); g.add(nucG);
    const nuc = new (T().Mesh)(new (T().SphereGeometry)(0.62, 48, 32), Object.assign(M.organelle(0x7b6ad6, 0.05), { transparent: true, opacity: 0.85 })); nucG.add(nuc); nuc.userData.org = "nuc"; (s.parts.nuc = s.parts.nuc || []).push(nuc);
    const nl = new (T().Mesh)(new (T().SphereGeometry)(0.22, 24, 16), M.organelle(0x3d2f8f, 0.1)); nl.position.set(0.12, 0.08, 0.1); nucG.add(nl); s.parts.nuc.push(nl);
    // mitochondria
    const rr = MK.rng(plant ? 11 : 12), mitoTex = BK.spotTex("#d9733c", "#7a2f12", 40, 14);
    for (let i = 0; i < (plant ? 6 : 10); i++) { const m = reg("mito", new (T().Mesh)(new (T().CapsuleGeometry)(0.13, 0.36, 8, 16), new (T().MeshPhysicalMaterial)({ map: mitoTex, roughness: 0.4, clearcoat: 0.7, sheen: 0.5 }))); const a = rr() * 6.3; m.position.set(plant ? (rr() - 0.5) * 3.4 : Math.cos(a) * (0.9 + rr() * 0.9), (rr() - 0.5) * (plant ? 2.2 : 1.6), plant ? (rr() > 0.5 ? 1 : -1) * (0.9 + rr() * 0.3) : Math.sin(a) * (0.9 + rr() * 0.6)); m.rotation.set(rr() * 3, rr() * 3, rr() * 3); }
    if (plant) { const chlTex = BK.spotTex("#2f8a2c", "#0f4d12", 70, 6); for (let i = 0; i < 14; i++) { const m = reg("chl", new (T().Mesh)(new (T().SphereGeometry)(0.26, 24, 16), new (T().MeshPhysicalMaterial)({ map: chlTex, roughness: 0.35, clearcoat: 0.8, sheen: 0.6 }))); m.scale.set(1.5, 0.55, 1); const side = i % 2 ? 1 : -1; m.position.set(-2.0 + (i / 14) * 4.0, (rr() - 0.5) * 2.4, side * (1.18 + rr() * 0.1)); m.rotation.set(Math.PI / 2 * side + rr() * 0.3, rr() * 3, 0); } }
    // rough ER: wavy membrane ribbons around the nucleus, studded with ribosomes
    const erMat = M.organelle(0x4fb0c6, 0.05), riboMat = M.organelle(0x2d2f6b, 0.15); const ribPts = [];
    for (let k = 0; k < 4; k++) { const pts = []; const R = 0.85 + k * 0.17; for (let i = 0; i <= 30; i++) { const a = -1.3 + i / 30 * 2.6; pts.push(V(np.x + Math.cos(a) * R, np.y + Math.sin(a) * R * 0.9, np.z + Math.sin(i * 0.9 + k) * 0.12)); }
      const er = reg("er", new (T().Mesh)(new (T().TubeGeometry)(new (T().CatmullRomCurve3)(pts), 80, 0.05, 8), erMat)); er.scale.set(1, 1, 1); pts.forEach((p, i) => { if (i % 2) ribPts.push(p); }); }
    const im = new (T().InstancedMesh)(new (T().SphereGeometry)(0.04, 8, 6), riboMat, ribPts.length + 80), m4 = new (T().Matrix4)();
    ribPts.forEach((p, i) => { m4.makeTranslation(p.x + (rr() - 0.5) * 0.08, p.y + 0.06, p.z + (rr() - 0.5) * 0.08); im.setMatrixAt(i, m4); });
    for (let i = ribPts.length; i < ribPts.length + 80; i++) { m4.makeTranslation((rr() - 0.5) * (plant ? 3.8 : 3), (rr() - 0.5) * 2, (rr() - 0.5) * 2); im.setMatrixAt(i, m4); } reg("ribo", im);
    // Golgi: stack of curved discs
    const golG = new (T().Group)(); golG.position.set(plant ? 1.6 : 1.0, plant ? -0.7 : -0.5, plant ? 0.9 : 0.4); g.add(golG);
    for (let i = 0; i < 5; i++) { const d = new (T().Mesh)(new (T().SphereGeometry)(0.5 - i * 0.03, 32, 8, 0, 6.3, 0, 0.55), Object.assign(M.organelle(0xe0b44f, 0.05), { side: T().DoubleSide })); d.position.y = i * 0.07; d.userData.org = "gol"; golG.add(d); (s.parts.gol = s.parts.gol || []).push(d); }
    golG.rotation.z = 0.5;
    if (!plant) {
      for (let i = 0; i < 6; i++) { const l = reg("lys", new (T().Mesh)(new (T().SphereGeometry)(0.13, 16, 12), M.organelle(0x9adf6a, 0.1))); l.position.set((rr() - 0.5) * 2.8, (rr() - 0.5) * 1.5, (rr() - 0.5) * 1.8); }
      const cg = new (T().Group)(); cg.position.set(0.6, 0.8, 0.5); g.add(cg); for (let i = 0; i < 2; i++) { const cc = new (T().Mesh)(new (T().CylinderGeometry)(0.05, 0.05, 0.28, 12), M.organelle(0xff8fb1, 0.2)); cc.rotation.z = i ? Math.PI / 2 : 0; cc.position.x = i * 0.12; cc.userData.org = "cen"; cg.add(cc); (s.parts.cen = s.parts.cen || []).push(cc); }
    }
    BK.shadow(g, false, false);
  }
  BK.def3d("A-d", {
    label: "Photoreal 3D cell", title: "Cell structure (3D cut-away)",
    blurb: "A plant cell, an animal cell and a bacterium cut open so you can look inside. Pick any organelle to light it up and read its function.",
    env: "micro", cam: [[4.4, 3.0, 7.4], [1.3, 0, 0]], fov: 38, envI: 0.8,
    values: { type: "plant", org: "nuc", spin: 1 },
    controls: (c) => [{ type: "tabs", key: "type", label: "Cell", options: [["plant", "Plant cell"], ["animal", "Animal cell"], ["bacteria", "Bacterium (prokaryote)"]] },
      { type: "select", key: "org", label: "Highlight organelle", options: Object.keys(ORG).map((k) => [k, ORG[k].n]) }, { type: "toggle", key: "spin", label: "Slow turntable" }],
    onChange(s, c, k) { if (k === "type") { const ok = orgList(c.type === "bacteria" ? "plant" : c.type); if (c.type === "bacteria" && !["wall", "mem", "nuc", "ribo", "cyt"].includes(c.org)) c.org = "nuc"; else if (!ok.includes(c.org)) c.org = "nuc"; } },
    syncAll: true,
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) {
      if (s.key !== c.type) { s.key = c.type; buildCell(S, s, c); }
      if (c.spin) s.cell.rotation.y += dt * 0.15;
      const t = S.t; Object.entries(s.parts).forEach(([k, arr]) => arr.forEach((m) => { const mt = m.material; if (!mt || !mt.emissive) return; const u = mt.userData; if (u.e0 == null) { u.e0 = mt.emissive.getHex(); u.i0 = mt.emissiveIntensity; } if (k === c.org) { mt.emissive.setHex(0xffc861); mt.emissiveIntensity = 0.35 + 0.25 * Math.sin(t * 4); } else { mt.emissive.setHex(u.e0); mt.emissiveIntensity = u.i0; } }));
      if (s.flag) s.flag.rotation.x = Math.sin(t * 8) * 0.3;
    },
    overlay(ctx, s, c, S, B) { const arr = s.parts && s.parts[c.org]; if (!arr || !arr.length) return; const m = arr[0], p = V(); m.getWorldPosition(p); BK.leader(S, B, [p.x, p.y, p.z], ORG[c.org].n, "#ffd27a", -70, -40); },
    hud: (s, c) => { const o = ORG[c.org], kind = c.type === "bacteria" ? "Prokaryote — no true nucleus or membrane-bound organelles; DNA lies free as a loop." : c.type === "plant" ? "Plant cell: cell wall, large vacuole and chloroplasts." : "Animal cell: no wall, small vacuoles, centrioles and lysosomes."; return [{ title: o.n, lines: [o.fn, "—", ["Found in: " + (o.in === "both" ? "plant and animal cells" : o.in + " cells only"), "#7cb3ff"], "—", kind] }]; },
    readouts: (s, c) => [["Cell type", c.type === "bacteria" ? "Prokaryote" : "Eukaryote"], ["Typical size", c.type === "bacteria" ? "1–5 μm" : c.type === "plant" ? "10–100 μm" : "10–30 μm"], ["Selected", ORG[c.org].n]],
    table: () => MK.table(["Feature", "Plant cell", "Animal cell"], [["Cell wall", "Present (cellulose)", "Absent"], ["Chloroplasts", "Present", "Absent"], ["Vacuole", "One large, central", "Small, temporary"], ["Centrioles", "Absent", "Present"], ["Shape", "Regular, fixed", "Irregular"], ["Food store", "Starch", "Glycogen"]]),
    note: "WAEC asks for the <b>function of each organelle</b> and a table of <b>plant vs animal</b> differences. Draw large, label with ruled lines, never shade.",
    draw: BK.fallback("Cell structure", (s, c) => [ORG[c.org].n + ": " + ORG[c.org].fn, "Plant cells: wall, large vacuole, chloroplasts. Animal cells: centrioles, lysosomes."], (g, s, c, B) => { BK.cell2d(g, 200, 140, 110, c.type === "plant" ? "rgba(120,190,110,.5)" : "rgba(230,170,160,.5)", "#9fd08a", "#7b6ad6"); }),
  });

  /* =====================================================================
     Single-celled organisms — shared builders
     ===================================================================== */
  const ORGS = {
    amoeba: { n: "Amoeba", k: "Protoctista · Rhizopoda", note: "Moves and feeds with pseudopodia; contractile vacuole removes excess water." },
    paramecium: { n: "Paramecium", k: "Protoctista · Ciliophora", note: "Slipper-shaped; beats thousands of cilia; oral groove sweeps food in." },
    euglena: { n: "Euglena", k: "Protoctista · Euglenophyta", note: "Has chloroplasts (autotrophic) and can also feed heterotrophically; swims with a flagellum toward light." },
    chlamy: { n: "Chlamydomonas", k: "Protoctista · Chlorophyta", note: "Two flagella, cup-shaped chloroplast with pyrenoid, red eyespot." },
    volvox: { n: "Volvox (colony)", k: "Protoctista · Chlorophyta", note: "Hollow sphere of hundreds of flagellate cells joined by cytoplasm; daughter colonies inside." },
    spiro: { n: "Spirogyra (filament)", k: "Protoctista · Chlorophyta", note: "Unbranched filament of identical cells, each with spiral ribbon chloroplasts." },
    cheek: { n: "Cheek cells (tissue)", k: "Part of an organism", note: "Flat squamous epithelial cells that cannot live independently." },
    yeast: { n: "Yeast", k: "Fungi · Ascomycota", note: "Single-celled fungus; reproduces by budding." },
  };
  function cilia(N, surface, mat) { const im = new (T().InstancedMesh)(new (T().CylinderGeometry)(0.008, 0.012, 0.16, 4), mat, N); im.userData.base = surface; return im; }
  function buildOrganism(S, s, kind) {
    const g = BK.group(S, s, "org"), M = BK.mat, rr = MK.rng(21); s.kind = kind; s.cv = null; s.anim = null;
    const nucleus = (r, x, y, z) => { const n = new (T().Mesh)(new (T().SphereGeometry)(r, 32, 24), Object.assign(M.organelle(0x7b6ad6, 0.08), { transparent: true, opacity: 0.85 })); n.position.set(x, y, z); g.add(n); return n; };
    if (kind === "amoeba") {
      const body = new (T().Mesh)(BK.blob(1.6, 2, 0.42, 72, 1.5, 0.45, 1.2), M.membrane(0x8ec9e0, 0.38)); g.add(body); s.body = body;
      const endo = new (T().Mesh)(BK.blob(1.25, 5, 0.32, 48, 1.4, 0.35, 1.1), M.cyto(0x86b88a, 0.42)); g.add(endo); s.endo = endo;
      { const N = 220, im = new (T().InstancedMesh)(new (T().SphereGeometry)(0.035, 6, 5), M.organelle(0xe9d9a0, 0.1), N), m4 = new (T().Matrix4)(); for (let i = 0; i < N; i++) { m4.makeTranslation((rr() - 0.5) * 3.2, (rr() - 0.5) * 0.45, (rr() - 0.5) * 2.4); im.setMatrixAt(i, m4); } g.add(im); s.gran = im; }
      nucleus(0.32, -0.3, 0.05, 0.2); s.cv = new (T().Mesh)(new (T().SphereGeometry)(0.25, 24, 16), M.membrane(0x8fd8ff, 0.55)); s.cv.position.set(0.9, 0.12, -0.3); g.add(s.cv);
      s.food = []; for (let i = 0; i < 4; i++) { const fv = new (T().Mesh)(new (T().SphereGeometry)(0.13, 16, 12), M.organelle(0xc9a64b, 0.05)); fv.position.set((rr() - 0.5) * 1.6, 0.05, (rr() - 0.5) * 1.2); g.add(fv); s.food.push(fv); }
      s.anim = (t, dt) => { BK.wobble(body, 1.6, t, 0.22, 0.3, 2); BK.wobble(endo, 1.25, t, 0.18, 0.3, 2); g.position.x = Math.sin(t * 0.12) * 0.6; s.gran.rotation.y = Math.sin(t * 0.2) * 0.25; };
    } else if (kind === "paramecium") {
      const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new (T().Vector2)(Math.sin(Math.PI * t) * 0.62 * (1 - 0.25 * Math.sin(Math.PI * t * 2)) + 0.01, (t - 0.5) * 3.4)); }
      const body = new (T().Mesh)(new (T().LatheGeometry)(pts, 48), M.membrane(0xe8f4ff, 0.4)); body.rotation.z = Math.PI / 2; body.scale.set(1, 1, 0.7); g.add(body); s.body = body;
      const groove = new (T().Mesh)(new (T().TorusGeometry)(0.35, 0.06, 8, 24, 3), M.organelle(0x8ab2d8, 0.05)); groove.position.set(0.1, 0.12, 0.35); g.add(groove);
      nucleus(0.38, -0.1, 0.05, 0).scale.set(1.4, 0.8, 0.8); const mi = nucleus(0.12, 0.35, 0.18, 0.1); mi.material = M.organelle(0x3d2f8f, 0.2);
      s.cv = new (T().Mesh)(new (T().SphereGeometry)(0.2, 20, 14), M.membrane(0x8fd8ff, 0.6)); s.cv.position.set(1.0, 0.2, 0); g.add(s.cv); s.cv2 = s.cv.clone(); s.cv2.position.x = -1.1; g.add(s.cv2);
      const N = 520, cm = cilia(N, null, M.organelle(0xdff1ff, 0.1)), m4 = new (T().Matrix4)(), q = new (T().Quaternion)(), up = V(0, 1, 0); s.cil = [];
      for (let i = 0; i < N; i++) { const u = rr(), a = rr() * 6.28, yy = (u - 0.5) * 3.2, r = Math.sin(Math.PI * u) * 0.62 * (1 - 0.25 * Math.sin(Math.PI * u * 2)); const p = V(yy, Math.cos(a) * r * 0.7, Math.sin(a) * r); const n = V(0, Math.cos(a), Math.sin(a)).normalize(); s.cil.push([p, n, yy]); }
      g.add(cm); s.cm = cm;
      s.anim = (t) => { s.cil.forEach(([p, n, yy], i) => { const beat = Math.sin(t * 9 - yy * 3) * 0.7; const d = n.clone().applyAxisAngle(V(0, 0, 1).cross(n).normalize(), beat); q.setFromUnitVectors(up, d); m4.compose(p.clone().addScaledVector(d, 0.07), q, V(1, 1, 1)); cm.setMatrixAt(i, m4); }); cm.instanceMatrix.needsUpdate = true; g.position.x = ((t * 0.35) % 3.8) - 2.6; g.rotation.x = t * 0.6; };
    } else if (kind === "euglena" || kind === "chlamy") {
      const eu = kind === "euglena", pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new (T().Vector2)((eu ? Math.sin(Math.PI * t) * 0.45 * (1 - 0.4 * t) : Math.sin(Math.PI * t) * 0.6) + 0.01, (t - 0.5) * (eu ? 3 : 1.6))); }
      const body = new (T().Mesh)(new (T().LatheGeometry)(pts, 40), M.membrane(0xd8f5d0, 0.42)); body.rotation.z = Math.PI / 2; g.add(body); s.body = body;
      nucleus(eu ? 0.3 : 0.22, eu ? -0.3 : -0.1, 0, 0);
      const chlTex = BK.spotTex("#2f9a3c", "#0e5418", 50, 5);
      if (eu) { for (let i = 0; i < 14; i++) { const ch = new (T().Mesh)(new (T().SphereGeometry)(0.14, 16, 12), new (T().MeshPhysicalMaterial)({ map: chlTex, roughness: 0.35, clearcoat: 0.8 })); ch.scale.set(1.6, 0.5, 1); ch.position.set(-1.1 + i * 0.16, (rr() - 0.5) * 0.4, (rr() - 0.5) * 0.4); ch.rotation.set(rr() * 3, rr() * 3, 0); g.add(ch); } }
      else { const cup = new (T().Mesh)(new (T().SphereGeometry)(0.55, 32, 16, 0, 6.3, Math.PI * 0.35, Math.PI * 0.65), new (T().MeshPhysicalMaterial)({ map: chlTex, roughness: 0.4, side: T().DoubleSide })); cup.rotation.z = Math.PI / 2; g.add(cup); const py = new (T().Mesh)(new (T().SphereGeometry)(0.14, 16, 12), M.organelle(0xe9f0c0, 0.1)); py.position.x = -0.35; g.add(py); }
      const eye = new (T().Mesh)(new (T().SphereGeometry)(0.08, 12, 8), M.organelle(0xff3020, 0.6)); eye.position.set(eu ? 1.25 : 0.62, 0.15, 0.1); g.add(eye);
      s.flags = []; for (let k = 0; k < (eu ? 1 : 2); k++) { const fl = new (T().Mesh)(new (T().TubeGeometry)(new (T().CatmullRomCurve3)([V(0, 0, 0), V(1, 0, 0)]), 40, 0.025, 6), M.organelle(0xdff7d8, 0.1)); g.add(fl); s.flags.push(fl); }
      s.cv = new (T().Mesh)(new (T().SphereGeometry)(0.12, 16, 12), M.membrane(0x8fd8ff, 0.6)); s.cv.position.set(eu ? 1.0 : 0.5, -0.1, 0); g.add(s.cv);
      s.anim = (t) => { s.flags.forEach((fl, k) => { const p = []; for (let i = 0; i <= 30; i++) { const u = i / 30; p.push(V((eu ? 1.45 : 0.78) + u * (eu ? 2.2 : 1.4) * (eu ? 1 : 0.7), (eu ? 0 : (k ? 1 : -1) * u * 0.8) + Math.sin(u * 9 - t * 10) * 0.18 * u, Math.cos(u * 7 - t * 10) * 0.08 * u)); } fl.geometry.dispose(); fl.geometry = new (T().TubeGeometry)(new (T().CatmullRomCurve3)(p), 40, 0.025, 6); }); g.rotation.x = t * 1.4; g.position.x = 1.0 - ((t * 0.3) % 3.8); };
    } else if (kind === "volvox") {
      const shell = new (T().Mesh)(new (T().SphereGeometry)(2, 48, 32), M.membrane(0xcff2c0, 0.18)); g.add(shell);
      const N = 600, im = new (T().InstancedMesh)(new (T().SphereGeometry)(0.06, 10, 8), M.organelle(0x2f9a3c, 0.15), N), m4 = new (T().Matrix4)(); for (let i = 0; i < N; i++) { const y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), a = i * 2.39996; m4.makeTranslation(Math.cos(a) * r * 2, y * 2, Math.sin(a) * r * 2); im.setMatrixAt(i, m4); } g.add(im);
      for (let k = 0; k < 4; k++) { const d = new (T().Mesh)(new (T().SphereGeometry)(0.42, 24, 16), new (T().MeshPhysicalMaterial)({ color: 0x3a9a2c, roughness: 0.4, transparent: true, opacity: 0.8, clearcoat: 0.6 })); d.position.set(Math.cos(k * 1.6) * 0.9, Math.sin(k * 2.1) * 0.7, Math.sin(k * 1.6) * 0.9); g.add(d); }
      s.anim = (t) => { g.rotation.y = t * 0.4; g.rotation.x = t * 0.15; };
    } else if (kind === "spiro") {
      for (let k = 0; k < 4; k++) { const cx = -3.3 + k * 2.2; const wall = new (T().Mesh)(new (T().CylinderGeometry)(0.55, 0.55, 2.1, 32, 1, true), M.membrane(0xcff2c0, 0.32)); wall.rotation.z = Math.PI / 2; wall.position.x = cx; g.add(wall);
        const sep = new (T().Mesh)(new (T().CircleGeometry)(0.55, 32), M.membrane(0xb9e2a6, 0.45)); sep.rotation.y = Math.PI / 2; sep.position.x = cx + 1.1; g.add(sep);
        const pts = []; for (let i = 0; i <= 80; i++) { const u = i / 80, a = u * Math.PI * 2 * 3.5; pts.push(V(cx - 1.0 + u * 2.0, Math.cos(a) * 0.46, Math.sin(a) * 0.46)); } g.add(new (T().Mesh)(new (T().TubeGeometry)(new (T().CatmullRomCurve3)(pts), 200, 0.07, 8), M.organelle(0x2c9a34, 0.15)));
        nucleus(0.12, cx, 0, 0); }
      s.anim = (t) => { g.rotation.x = Math.sin(t * 0.3) * 0.4; };
    } else if (kind === "cheek") {
      for (let i = 0; i < 9; i++) { const cell = new (T().Mesh)(BK.blob(0.9, i + 3, 0.22, 32, 1, 0.12, 1), M.membrane(0xf2c9c0, 0.45)); cell.position.set((i % 3 - 1) * 1.65 + (rr() - 0.5) * 0.3, (rr() - 0.5) * 0.1, (Math.floor(i / 3) - 1) * 1.5 + (rr() - 0.5) * 0.3); cell.rotation.y = rr() * 3; g.add(cell); nucleus(0.16, cell.position.x + 0.1, cell.position.y + 0.06, cell.position.z); }
      s.anim = (t) => { g.rotation.y = t * 0.08; };
    } else if (kind === "yeast") {
      s.cells = []; for (let i = 0; i < 6; i++) { const cl = new (T().Mesh)(BK.blob(0.5, i + 7, 0.05, 32, 1.2, 1, 1), M.membrane(0xf3e3b8, 0.55)); cl.position.set((i % 3 - 1) * 1.6, 0, (Math.floor(i / 3) - 0.5) * 1.6); g.add(cl); nucleus(0.12, cl.position.x, 0.02, cl.position.z); const bud = new (T().Mesh)(new (T().SphereGeometry)(0.25, 24, 16), M.membrane(0xf3e3b8, 0.55)); bud.position.set(cl.position.x + 0.62, 0.22, cl.position.z); g.add(bud); s.cells.push(bud); }
      s.anim = (t) => { s.cells.forEach((b, i) => { const k = 0.4 + 0.6 * ((t * 0.2 + i * 0.17) % 1); b.scale.setScalar(k); }); };
    }
    BK.shadow(g, false, false);
  }
  const orgFallback = (s, c) => { const o = ORGS[c.org]; return [o.n + " — " + o.k, o.note]; };
  const orgDef = (key, extra) => BK.def3d(key, Object.assign({
    env: "micro", cam: [[1.2, 2.6, 7.6], [1.2, 0, 0]], fov: 40, envI: 0.65,
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) {
      if (s.key !== c.org) { s.key = c.org; buildOrganism(S, s, c.org); s.t0 = 0; }
      s.t0 = (s.t0 || 0) + dt; if (s.anim) s.anim(s.t0, dt); if (extra.tick3) extra.tick3(S, s, c, dt);
    },
    draw: BK.fallback("Living cells", orgFallback, (g, s, c, B) => BK.cell2d(g, 220, 150, 100, "rgba(160,220,180,.45)", "#bfe8d0", "#7b6ad6")),
  }, extra));

  orgDef("A-c", {
    label: "Photoreal 3D microscope view", title: "Forms in which living cells exist",
    blurb: "Free-living single cells, a colony, a filament and cells that only live as part of a tissue — swimming under the microscope.",
    values: { org: "amoeba" },
    controls: [{ type: "select", key: "org", label: "Specimen", options: Object.keys(ORGS).map((k) => [k, ORGS[k].n]) }],
    hud: (s, c) => { const o = ORGS[c.org], form = { amoeba: "Single, free-living", paramecium: "Single, free-living", euglena: "Single, free-living", chlamy: "Single, free-living", volvox: "Colony", spiro: "Filament", cheek: "Part of an organism (tissue)", yeast: "Single, free-living" }[c.org]; return [{ title: o.n, lines: [["Form: " + form, "#ffd27a", true], o.k, "—", o.note] }]; },
    readouts: (s, c) => [["Specimen", ORGS[c.org].n], ["Approx. size", { amoeba: "≈ 500 μm", paramecium: "≈ 200 μm", euglena: "≈ 50 μm", chlamy: "≈ 20 μm", volvox: "≈ 0.5 mm colony", spiro: "cells ≈ 40 μm wide", cheek: "≈ 60 μm", yeast: "≈ 5–10 μm" }[c.org]]],
    note: "WAEC distinguishes <b>cells that form tissues</b> (cheek, onion epidermis) from cells that form <b>colonies</b> (Volvox) or <b>filaments</b> (Spirogyra).",
  });
  orgDef("A-f", {
    label: "Photoreal 3D microscope view", title: "Nutrition in single cells",
    blurb: "Euglena and Chlamydomonas make food by photosynthesis; Amoeba and Paramecium take in ready-made food (holozoic).",
    values: { org: "euglena", light: 70 },
    controls: [{ type: "tabs", key: "org", label: "Organism", options: [["euglena", "Euglena"], ["chlamy", "Chlamydomonas"], ["spiro", "Spirogyra"], ["amoeba", "Amoeba"], ["paramecium", "Paramecium"]] }, { key: "light", label: "Light intensity", min: 0, max: 100, unit: "%", show: W("org", "euglena", "chlamy", "spiro") }],
    tick3(S, s, c, dt) { if (s.kind === "amoeba" && s.food) s.food.forEach((fv, i) => { fv.scale.setScalar(0.6 + 0.4 * Math.abs(Math.sin(s.t0 * 0.3 + i))); }); },
    hud: (s, c) => { const auto = ["euglena", "chlamy", "spiro"].includes(c.org); return [{ title: auto ? "Autotrophic (photosynthesis)" : "Heterotrophic (holozoic)", lines: auto ? ["6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", ["Rate ∝ light up to saturation: " + f(Math.min(100, c.light * 1.25), 0) + "% of max", "#5bd68c"], "Euglena also absorbs organic food in darkness (mixotroph)."] : c.org === "amoeba" ? ["Pseudopodia surround food → food vacuole (phagocytosis)", "Enzymes digest food; soluble products diffuse into cytoplasm", "Undigested remains egested anywhere on the surface"] : ["Cilia sweep food down the oral groove to the gullet", "Food vacuoles circulate (cyclosis) while enzymes digest", "Waste leaves at the cytoproct (anal pore)"] }]; },
    readouts: (s, c) => [["Mode", ["euglena", "chlamy", "spiro"].includes(c.org) ? "Autotrophic" : "Holozoic"], ["Organism", ORGS[c.org].n]],
  });
  orgDef("A-h", {
    label: "Photoreal 3D microscope view", title: "Excretion in single cells",
    blurb: "Watch the contractile vacuole fill with water and burst out at the surface, while CO₂ and ammonia diffuse out across the membrane.",
    values: { org: "amoeba", tonic: 0 },
    controls: [{ type: "tabs", key: "org", label: "Organism", options: [["amoeba", "Amoeba"], ["paramecium", "Paramecium"], ["euglena", "Euglena"]] }, { key: "tonic", label: "Salt in surrounding water", min: 0, max: 0.9, step: 0.05, unit: "%" }],
    tick3(S, s, c, dt) { if (!s.cv) return; const rate = 1.4 * (1 - c.tonic / 1.0) + 0.1; s.cvp = (s.cvp || 0) + dt * rate * 0.35; if (s.cvp > 1) { s.cvp = 0; s.bursts = (s.bursts || 0) + 1; } const k = 0.25 + s.cvp * 0.9; s.cv.scale.setScalar(k); if (s.cv2) s.cv2.scale.setScalar(0.25 + ((s.cvp + 0.5) % 1) * 0.9); s.rate = rate; },
    hud: (s, c) => [{ title: "Osmoregulation & excretion", lines: ["Fresh water enters by osmosis (cytoplasm is hypertonic).", ["Contractile vacuole: ≈ " + f((s.rate || 1) * 21, 0) + " fillings per minute", "#7cb3ff"], "More salt outside → less water enters → slower vacuole.", "—", "CO₂ and ammonia diffuse out through the whole body surface."] }],
    readouts: (s, c) => [["Vacuole fill", f((s.cvp || 0) * 100, 0) + "%"], ["Bursts counted", String(s.bursts || 0)]],
  });
  orgDef("A-j", {
    label: "Photoreal 3D microscope view", title: "Movement in cells",
    blurb: "Cilia beat in coordinated waves, flagella lash like whips and pseudopodia flow — see each organelle of movement up close.",
    values: { org: "paramecium" },
    controls: [{ type: "tabs", key: "org", label: "Organelle", options: [["paramecium", "Cilia (Paramecium)"], ["euglena", "Flagellum (Euglena)"], ["chlamy", "2 flagella (Chlamydomonas)"], ["amoeba", "Pseudopodia & cyclosis (Amoeba)"]] }],
    hud: (s, c) => [{ title: "Organelle of movement", lines: { paramecium: ["Cilia: short hair-like, many, beat in metachronal waves", "Effective stroke stiff, recovery stroke bent", ["Speed ≈ 1 mm s⁻¹ (≈ 5 body lengths per second)", "#ffd27a"]], euglena: ["Flagellum: long whip, one or two per cell", "Undulating wave pulls the cell forward", ["Speed ≈ 0.1 mm s⁻¹", "#ffd27a"]], chlamy: ["Two equal flagella — breast-stroke motion", "Eyespot detects light (phototaxis)", ["Speed ≈ 0.1 mm s⁻¹", "#ffd27a"]], amoeba: ["Pseudopodia: cytoplasm flows into extensions", "Cyclosis: streaming of cytoplasm inside the cell", ["Speed ≈ 1–2 μm s⁻¹", "#ffd27a"]] }[c.org] }],
  });

  /* =====================================================================
     A-e  MEMBRANE TRANSPORT
     ===================================================================== */
  BK.def3d("A-e", {
    label: "Photoreal 3D lab", title: "The cell and its environment",
    blurb: "Dye diffusing in water, an osmometer whose level rises, a protein pump using ATP, and red blood cells and onion cells in different salt solutions.",
    env: "lab", envOpts: { w: 14, d: 8 }, cam: [[1.4, 3.4, 8.5], [1.4, 1.4, 0]], fov: 38,
    values: { mode: "diff", conc: 0.9, temp: 25 },
    controls: [{ type: "tabs", key: "mode", label: "Process", options: [["diff", "Diffusion"], ["osm", "Osmosis (osmometer)"], ["act", "Active transport"], ["rbc", "Red blood cells"], ["plas", "Plant cell (plasmolysis)"]] },
      { key: "conc", label: "Salt concentration outside", min: 0, max: 3, step: 0.05, unit: "%", show: W("mode", "rbc", "plas") }, { key: "temp", label: "Temperature", min: 5, max: 45, unit: "°C", show: W("mode", "diff") }],
    build(S, s, c) { s.key = ""; S.renderer.localClippingEnabled = true; },
    reset3d(S, s) { s.key = ""; },
    update(S, s, c, dt) {
      const T3 = T(), M = BK.mat;
      if (s.key !== c.mode) { s.key = c.mode; const g = BK.group(S, s); s.t = 0; s.pm = null;
        if (c.mode === "diff") { const tank = new T3.Mesh(new T3.BoxGeometry(5, 2.2, 1.6), window.P3D.mat.glass()); tank.position.y = 1.1; tank.renderOrder = 3; g.add(tank); const water = new T3.Mesh(new T3.BoxGeometry(4.9, 1.9, 1.5), window.P3D.mat.water(0x9ecfe8)); water.position.y = 1.0; water.renderOrder = 2; g.add(water);
          const N = 420, im = new T3.InstancedMesh(new T3.SphereGeometry(0.04, 8, 6), new T3.MeshPhysicalMaterial({ color: 0x7a1fa2, roughness: 0.3, emissive: 0x3a0060, emissiveIntensity: 0.4 }), N); g.add(im); s.pm = im; s.P = []; const rr = MK.rng(3); for (let i = 0; i < N; i++) s.P.push([-2.3 + rr() * 0.6, 0.15 + rr() * 1.7, -0.7 + rr() * 1.4]); }
        else if (c.mode === "osm") { const beaker = window.P3D.mat.glass(); const bk = new T3.Mesh(new T3.CylinderGeometry(1.4, 1.4, 2, 48, 1, true), beaker); bk.position.y = 1; bk.renderOrder = 3; g.add(bk); const w = new T3.Mesh(new T3.CylinderGeometry(1.35, 1.35, 1.5, 48), window.P3D.mat.water(0x9ecfe8)); w.position.y = 0.75; w.renderOrder = 2; g.add(w);
          const funnel = new T3.Mesh(new T3.SphereGeometry(0.7, 32, 16, 0, 6.3, Math.PI / 2, Math.PI / 2), beaker); funnel.position.y = 1.0; funnel.renderOrder = 4; g.add(funnel); const memb = new T3.Mesh(new T3.CircleGeometry(0.7, 32), new T3.MeshStandardMaterial({ color: 0xd8c7a0, roughness: 0.8, side: T3.DoubleSide })); memb.rotation.x = -Math.PI / 2; memb.position.y = 0.3; g.add(memb);
          const sug = new T3.Mesh(new T3.SphereGeometry(0.66, 32, 16, 0, 6.3, Math.PI / 2, Math.PI / 2), new T3.MeshPhysicalMaterial({ color: 0xd9a03a, transparent: true, opacity: 0.55, roughness: 0.2, depthWrite: false })); sug.position.y = 1.0; g.add(sug);
          const tube = new T3.Mesh(new T3.CylinderGeometry(0.07, 0.07, 3.2, 16, 1, true), beaker); tube.position.y = 3.2; tube.renderOrder = 4; g.add(tube); s.col = new T3.Mesh(new T3.CylinderGeometry(0.05, 0.05, 1, 12), new T3.MeshPhysicalMaterial({ color: 0xd9a03a, roughness: 0.2 })); g.add(s.col); s.h = 0;
          const ruler = window.P3D.S.mk.ruler(3, 0.25, 0.35, 3.2, 0); ruler.rotation.z = Math.PI / 2; ruler.position.set(0.35, 3.2, 0); g.add(ruler); }
        else if (c.mode === "act") { const N = 14 * 7, heads = new T3.InstancedMesh(new T3.SphereGeometry(0.11, 12, 8), new T3.MeshPhysicalMaterial({ color: 0xe9c46a, roughness: 0.3, clearcoat: 0.8 }), N * 2), m4 = new T3.Matrix4(); let k = 0; for (let i = 0; i < 14; i++) for (let j = 0; j < 7; j++) { if (Math.abs(i - 7) < 1.5 && Math.abs(j - 3) < 1.5) continue; for (const y of [1.55, 0.85]) { m4.makeTranslation(-2.6 + i * 0.4, y, -1.2 + j * 0.4); heads.setMatrixAt(k++, m4); } } heads.count = k; g.add(heads);
          const pump = new T3.Mesh(BK.blob(0.55, 4, 0.12, 32, 1, 1.3, 1), BK.mat.tissue(0x4f8fd6)); pump.position.y = 1.2; g.add(pump); s.pump = pump;
          const N2 = 40, im = new T3.InstancedMesh(new T3.SphereGeometry(0.09, 12, 8), new T3.MeshPhysicalMaterial({ color: 0x5bd68c, roughness: 0.2, emissive: 0x1f6a3a, emissiveIntensity: 0.4 }), N2); g.add(im); s.pm = im; s.P = []; const rr = MK.rng(9); for (let i = 0; i < N2; i++) s.P.push([(rr() - 0.5) * 5, i < 30 ? 2.1 + rr() * 1.2 : 0.1 + rr() * 0.4, (rr() - 0.5) * 2.4, i < 30 ? 1 : 0]); s.inside = 30; }
        else if (c.mode === "rbc") { s.cells = []; const geo = (() => { const pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI; const r = Math.sin(a) * 0.9; const y = Math.cos(a) * (0.18 + 0.28 * Math.pow(r / 0.9, 2)); pts.push(new T3.Vector2(r + 0.001, y)); } return new T3.LatheGeometry(pts, 40); })();
          for (let i = 0; i < 5; i++) { const m = new T3.Mesh(geo.clone(), BK.mat.blood()); m.position.set(-2.4 + i * 1.2, 1.4 + Math.sin(i) * 0.3, (i % 2 - 0.5) * 0.6); m.rotation.set(1.1 + i * 0.3, i, 0); g.add(m); s.cells.push(m); }
          const slide = new T3.Mesh(new T3.BoxGeometry(6.5, 0.08, 2.4), window.P3D.mat.glass(0xf4fbff)); slide.position.y = 0.6; g.add(slide); }
        else if (c.mode === "plas") { s.cells = []; for (let i = 0; i < 3; i++) { const cx = -2.2 + i * 2.2; const wall = new T3.Mesh(new T3.BoxGeometry(2, 1.4, 1.4), Object.assign(M.membrane(0x9fd08a, 0.35))); wall.position.set(cx, 1.4, 0); g.add(wall);
            const pro = new T3.Mesh(new T3.BoxGeometry(1.9, 1.3, 1.3, 6, 6, 6), new T3.MeshPhysicalMaterial({ color: 0x8a3b8f, roughness: 0.3, transparent: true, opacity: 0.7, clearcoat: 0.8 })); pro.position.set(cx, 1.4, 0); g.add(pro); s.cells.push(pro); } }
        BK.shadow(g, true, true);
      }
      s.t += dt; const t = s.t, m4 = new (T().Matrix4)();
      if (c.mode === "diff" && s.pm) { const D = 0.06 * (c.temp + 273) / 298 * Math.exp((c.temp - 25) / 60); const step = Math.sqrt(2 * D * dt); let L = 0; s.P.forEach((p, i) => { p[0] += (Math.random() * 2 - 1) * step * 1.7; p[1] += (Math.random() * 2 - 1) * step * 1.7; p[2] += (Math.random() * 2 - 1) * step * 1.7; p[0] = Math.max(-2.4, Math.min(2.4, p[0])); p[1] = Math.max(0.1, Math.min(1.9, p[1])); p[2] = Math.max(-0.72, Math.min(0.72, p[2])); if (p[0] < 0) L++; m4.makeTranslation(p[0], p[1], p[2]); s.pm.setMatrixAt(i, m4); }); s.pm.instanceMatrix.needsUpdate = true; s.left = L / s.P.length; s.D = D; }
      if (c.mode === "osm" && s.col) { const target = 1.9; s.h += (target - s.h) * dt * 0.08; s.col.scale.y = 0.6 + s.h; s.col.position.y = 1.6 + (0.6 + s.h) / 2; }
      if (c.mode === "act" && s.pm) { s.pump.scale.y = 1 + 0.12 * Math.sin(t * 6); s.P.forEach((p, i) => { if (p[3] === 0) { p[0] += (0 - p[0]) * dt * 0.6; p[2] += (0 - p[2]) * dt * 0.6; if (Math.hypot(p[0], p[2]) < 0.3) { p[1] += dt * 0.9; if (p[1] > 2.1) { p[3] = 1; s.inside++; p[0] = (Math.random() - 0.5) * 5; p[2] = (Math.random() - 0.5) * 2.4; } } } else { p[1] = 2.1 + ((p[1] - 2.1 + dt * 0.05) % 1.2); } m4.makeTranslation(p[0], p[1], p[2]); s.pm.setMatrixAt(i, m4); }); s.pm.instanceMatrix.needsUpdate = true; if (Math.random() < dt * 0.6) { const out = s.P.filter((p) => p[3] === 1); if (out.length) { const p = out[Math.floor(Math.random() * out.length)]; p[3] = 0; p[1] = 0.3; s.inside--; s.atp = (s.atp || 0) + 1; } } }
      if (c.mode === "rbc" && s.cells) { const iso = 0.9, k = c.conc < iso ? Math.min(1.5, 1 + (iso - c.conc) * 0.9) : Math.max(0.7, 1 - (c.conc - iso) * 0.14); s.burst = c.conc < 0.35; s.cells.forEach((m, i) => { m.visible = !(s.burst && ((t * 0.5 + i * 0.2) % 2) > 1.2); const sy = c.conc < iso ? 1 + (iso - c.conc) * 2.4 : 1, sxz = k; m.scale.set(sxz, sy, sxz); m.rotation.y += dt * 0.3; if (!m.geometry.userData.base) m.geometry.userData.base = m.geometry.attributes.position.array.slice(); const pa = m.geometry.attributes.position, b = m.geometry.userData.base, spike = c.conc > iso ? Math.min(0.35, (c.conc - iso) * 0.22) : 0; for (let j = 0; j < pa.count; j++) { const x = b[j * 3], y = b[j * 3 + 1], z = b[j * 3 + 2], a = Math.atan2(z, x); const r = 1 + spike * Math.max(0, Math.sin(a * 9) * Math.sin(y * 12)); pa.setXYZ(j, x * r, y, z * r); } pa.needsUpdate = true; m.geometry.computeVertexNormals(); }); }
      if (c.mode === "plas" && s.cells) { const iso = 0.9; const k = c.conc <= iso ? 1 : Math.max(0.45, 1 - (c.conc - iso) * 0.28); s.cells.forEach((m) => { m.scale.lerp(V(k, k * 0.95, k * 0.92), dt * 2); }); s.shrink = k; }
    },
    hud: (s, c) => {
      if (c.mode === "diff") return [{ title: "Diffusion", lines: ["Net movement of particles from high to low concentration (random motion).", ["Particles still on the left: " + f((s.left || 1) * 100, 0) + "%", "#c4a7ff"], ["Diffusion speed at " + c.temp + " °C: × " + f((s.D || 0.06) / 0.06, 2) + " of the 25 °C rate", "#ffd27a"], "Distance spread grows as √(time)."] }];
      if (c.mode === "osm") return [{ title: "Osmosis — thistle funnel", lines: ["Water moves through the selectively permeable membrane from dilute (water) into the sugar solution.", ["Column risen: " + f((s.h || 0) * 10, 1) + " cm", "#7cb3ff"], "Sucrose molecules are too large to pass back."] }];
      if (c.mode === "act") return [{ title: "Active transport", lines: ["Carrier protein pumps ions AGAINST the concentration gradient.", ["Ions above membrane: " + (s.inside || 30) + " / 40", "#5bd68c"], ["ATP used: " + (s.atp || 0) + " (one per ion moved)", "#ffd27a"], "Stops if respiration stops (cyanide, no O₂)."] }];
      if (c.mode === "rbc") { const st = c.conc < 0.35 ? "Haemolysis — cells burst" : c.conc < 0.85 ? "Hypotonic — cells swell" : c.conc <= 0.95 ? "Isotonic (0.9% NaCl) — normal biconcave shape" : "Hypertonic — crenation (shrinks, spiky)"; return [{ title: "Red blood cells", lines: [[st, "#ff7b72", true], "Blood plasma ≈ 0.9% salt. Animal cells have no wall, so they burst in water."] }]; }
      const st = c.conc <= 0.9 ? "Turgid — protoplast presses on the wall" : c.conc < 1.6 ? "Incipient plasmolysis" : "Plasmolysed — protoplast pulls away from the wall"; return [{ title: "Plant cell (onion / Rhoeo)", lines: [[st, "#5bd68c", true], "The cellulose wall stops the cell bursting in water (turgidity).", "Gaps fill with the outside solution because the wall is fully permeable."] }];
    },
    readouts: (s, c) => c.mode === "rbc" || c.mode === "plas" ? [["Outside", f(c.conc, 2) + "% NaCl"], ["Relative to cell", c.conc < 0.85 ? "hypotonic" : c.conc <= 0.95 ? "isotonic" : "hypertonic"]] : c.mode === "diff" ? [["Temperature", c.temp + " °C"], ["Mixed", f(100 - Math.abs((s.left || 1) - 0.5) * 200, 0) + "%"]] : [],
    note: "Know the four words: <b>haemolysis</b> (animal cell bursts), <b>crenation</b> (animal cell shrinks), <b>turgidity</b> and <b>plasmolysis</b> (plant cell).",
    mistake: "Osmosis is the movement of <b>water</b> only, across a <b>selectively permeable membrane</b>. Saying 'salt moves by osmosis' loses the mark.",
    draw: BK.fallback("The cell and its environment", ["Diffusion: high → low concentration, no energy", "Osmosis: water through a selectively permeable membrane", "Active transport: against the gradient, uses ATP"]),
  });

  /* =====================================================================
     A-k / GH2-d  CELL DIVISION
     ===================================================================== */
  const PHASES = { mitosis: ["Interphase", "Prophase", "Metaphase", "Anaphase", "Telophase", "Cytokinesis"], meiosis: ["Prophase I (crossing over)", "Metaphase I", "Anaphase I", "Telophase I", "Metaphase II", "Anaphase II", "Four haploid cells"] };
  function chromosome(col, len) { const g = new (T().Group)(), m = new (T().MeshPhysicalMaterial)({ color: col, roughness: 0.35, clearcoat: 0.8, sheen: 0.5 }); const a = new (T().Mesh)(new (T().CapsuleGeometry)(0.11, len * 1.5, 6, 12), m), b = a.clone(); a.position.x = -0.09; b.position.x = 0.09; a.rotation.z = 0.12; b.rotation.z = -0.12; g.add(a, b); g.chromatids = [a, b]; const cen = new (T().Mesh)(new (T().SphereGeometry)(0.06, 12, 8), new (T().MeshStandardMaterial)({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.4 })); g.add(cen); return g; }
  const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  BK.def3d("A-k", {
    label: "Photoreal 3D cell division", title: "Reproduction in cells",
    blurb: "Scrub through mitosis and meiosis with real chromosomes, spindle fibres and a dividing membrane — or watch binary fission and budding.",
    env: "micro", cam: [[1.4, 2.0, 7.0], [1.4, 0, 0]], fov: 38,
    values: { mode: "mitosis", p: 0, auto: 1 },
    controls: [{ type: "tabs", key: "mode", label: "Process", options: [["mitosis", "Mitosis"], ["meiosis", "Meiosis"], ["fission", "Binary fission (Amoeba)"], ["bud", "Budding (yeast)"]] }, { key: "p", label: "Stage", min: 0, max: 6, step: 0.01, fmt: (v) => "", show: W("mode", "mitosis", "meiosis") }, { type: "toggle", key: "auto", label: "Play automatically" }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) {
      const T3 = T(), M = BK.mat;
      if (s.key !== c.mode) { s.key = c.mode; const g = BK.group(S, s); s.chr = []; s.mem = null;
        const mg = new T3.SphereGeometry(1.75, 64, 40); s.memBase = mg.attributes.position.array.slice(); s.mem = new T3.Mesh(mg, M.membrane(c.mode === "bud" ? 0xf3d9a0 : 0x9fd0ea, 0.34)); g.add(s.mem);
        { const rr = MK.rng(4), N = 160, im = new T3.InstancedMesh(new T3.SphereGeometry(0.03, 6, 5), M.organelle(0xbfe3a0, 0.15), N), m4 = new T3.Matrix4(); for (let i = 0; i < N; i++) { const v = V(rr() - 0.5, rr() - 0.5, rr() - 0.5).normalize().multiplyScalar(1.1 + rr() * 0.5); m4.makeTranslation(v.x, v.y, v.z); im.setMatrixAt(i, m4); } g.add(im); s.gran = im; }
        if (c.mode === "mitosis" || c.mode === "meiosis") { const cols = [0xd63c3c, 0x3c6fd6, 0xe0703c, 0x5c8fe8]; const lens = [0.9, 0.9, 0.5, 0.5]; for (let i = 0; i < 4; i++) { const ch = chromosome(cols[i], lens[i]); g.add(ch); s.chr.push(ch); }
          s.nuc = new T3.Mesh(new T3.SphereGeometry(0.95, 40, 28), M.membrane(0x9f8fff, 0.3)); g.add(s.nuc); s.sp = []; for (let i = 0; i < 16; i++) { const l = new T3.Mesh(new T3.CylinderGeometry(0.008, 0.008, 1, 4), M.glow(0x9fe7ff, 0.6)); g.add(l); s.sp.push(l); }
          s.poles = [new T3.Mesh(new T3.SphereGeometry(0.08, 12, 8), M.organelle(0xff8fb1, 0.5)), new T3.Mesh(new T3.SphereGeometry(0.08, 12, 8), M.organelle(0xff8fb1, 0.5))]; s.poles.forEach((p) => g.add(p)); s.nuc2 = []; }
        else { const n = new T3.Mesh(new T3.SphereGeometry(0.35, 24, 16), M.organelle(0x7b6ad6, 0.08)); g.add(n); s.n1 = n; s.n2 = n.clone(); g.add(s.n2); }
        s.p = 0; }
      const max = c.mode === "meiosis" ? 7 : 6; if (c.auto) { c.p = (c.p + dt * 0.35) % max; } const p = Math.min(c.p, max - 0.001); s.p = p;
      const pa = s.mem.geometry.attributes.position, b = s.memBase;
      const deform = (pinch, sep) => { for (let i = 0; i < pa.count; i++) { let x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2]; const k = 1 - pinch * Math.exp(-(x * x) / 0.9); x = x * (1 + sep * 0.55) + Math.sign(x) * sep * 0.3; pa.setXYZ(i, x, y * k, z * k); } pa.needsUpdate = true; s.mem.geometry.computeVertexNormals(); };
      if (c.mode === "mitosis") {
        const cond = ease(p - 0.6), meta = ease(p - 1.6), ana = ease(p - 2.6), tel = ease(p - 3.6), cyto = ease(p - 4.4);
        s.nuc.material.opacity = 0.3 * (1 - cond) + 0.3 * tel; s.nuc.scale.setScalar(1 - 0.3 * tel); s.nuc.position.x = 0; s.nuc.visible = cond < 0.98 || tel > 0.05;
        if (tel > 0.05) { s.nuc.visible = false; if (!s.nuc2.length) { for (let k = 0; k < 2; k++) { const nn = s.nuc.clone(); nn.material = s.nuc.material.clone(); s.cell.add(nn); s.nuc2.push(nn); } } s.nuc2.forEach((nn, k) => { nn.visible = true; nn.position.x = (k ? 1 : -1) * 1.5; nn.scale.setScalar(0.7); nn.material.opacity = 0.35 * tel; }); } else s.nuc2.forEach((nn) => (nn.visible = false));
        s.chr.forEach((ch, i) => { const home = V(Math.cos(i * 1.7) * 0.5, Math.sin(i * 2.3) * 0.45, Math.sin(i * 1.7) * 0.4), eq = V(0, -0.6 + i * 0.4, 0); const pos = home.clone().lerp(eq, meta); ch.position.copy(pos); ch.scale.setScalar(0.35 + 0.65 * cond); ch.rotation.set(0, 0, (1 - meta) * (i * 0.9) + meta * Math.PI / 2);
          const sepd = ana * 1.45; ch.chromatids[0].position.set(-0.06, sepd, 0); ch.chromatids[1].position.set(0.06, -sepd, 0); ch.children[2].visible = ana < 0.05; });
        const poleX = 2.0 * Math.min(1, cond * 1.2); s.poles.forEach((pp, k) => { pp.position.set((k ? 1 : -1) * poleX, 0, 0); pp.visible = cond > 0.1 && cyto < 0.8; });
        s.sp.forEach((l, i) => { const ch = s.chr[i % 4], k = i < 8 ? -1 : 1, from = V(k * poleX, 0, 0), to = ch.position.clone().add(V(k * ana * 1.45, 0, 0)); const d = to.clone().sub(from), L = d.length(); l.visible = meta > 0.05 && tel < 0.9; l.position.copy(from).addScaledVector(d, 0.5); l.scale.set(1, L, 1); l.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); });
        deform(cyto * 0.95, tel * 0.6 + cyto * 0.4);
        s.label = PHASES.mitosis[Math.min(5, Math.floor(p))];
      } else if (c.mode === "meiosis") {
        const st = Math.floor(p), u = p - st; const pair = [[0, 1], [2, 3]];
        const tel1 = ease(p - 3), sep2 = ease(p - 5);
        s.nuc.visible = p < 0.4; s.nuc.material.opacity = 0.3 * (1 - p / 0.4);
        s.chr.forEach((ch, i) => { const pi = i < 2 ? 0 : 1, side = i % 2 ? 1 : -1; let x = side * 0.25, y = pi ? -0.35 : 0.35; const m1 = ease(p - 0.6); x = side * (0.18 + 0.02); if (p > 1.6) x = side * (0.18 + ease(p - 1.6) * 1.5); if (p >= 3.6) { y = (pi ? -0.35 : 0.35) * (1 - ease(p - 3.6)) + 0; }
          const cellX = side * 1.75 * tel1; ch.position.set(p > 1.6 ? side * Math.max(1.0, cellX) * (p > 2.6 ? 1 : ease(p - 1.6)) : x, y, 0); ch.scale.setScalar(0.6 + 0.4 * m1); ch.rotation.z = Math.PI / 2;
          const s2 = sep2 * 0.85; ch.chromatids[0].position.set(-0.06, p >= 5 ? s2 : 0, p >= 5 ? s2 * 0.0 : 0); ch.chromatids[1].position.set(0.06, p >= 5 ? -s2 : 0, 0); if (p >= 5) { ch.rotation.z = 0; ch.chromatids[0].position.set(0, 0, s2 * 1.2); ch.chromatids[1].position.set(0, 0, -s2 * 1.2); }
          if (st === 0) { ch.chromatids[1].material = ch.chromatids[0].material; } });
        s.sp.forEach((l) => (l.visible = false)); s.poles.forEach((pp) => (pp.visible = false));
        deform(tel1 * 0.95, tel1 * 0.7); s.mem.rotation.y = sep2 * 0; s.label = PHASES.meiosis[Math.min(6, st)];
      } else if (c.mode === "fission") { const k = ((S.t * 0.12) % 1.2); const e = ease(k * 1.4 - 0.3); deform(e * 0.97, e); s.n1.position.x = -1.2 * e; s.n2.position.x = 1.2 * e; s.label = e < 0.05 ? "Nucleus divides by mitosis" : e < 0.95 ? "Cytoplasm constricts" : "Two daughter Amoebae"; s.mem.rotation.y = S.t * 0.1; }
      else { const k = (S.t * 0.15) % 1; const pinch = 0.2 + k * 0.6; for (let i = 0; i < pa.count; i++) { let x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2]; const bud = x > 0.8 ? 1 : 0; const sc2 = bud ? (0.3 + k * 0.45) : 1; const bx = bud ? 1.9 + (x - 1.9) * sc2 + k * 1.2 : x; pa.setXYZ(i, bx, y * (bud ? sc2 : 1), z * (bud ? sc2 : 1)); } pa.needsUpdate = true; s.mem.geometry.computeVertexNormals(); s.n1.position.x = -0.3; s.n2.position.x = 1.5 + k * 1.2; s.n2.scale.setScalar(0.4 + 0.5 * k); s.label = k < 0.5 ? "Bud grows out of the parent cell" : "Nucleus divides; bud pinches off"; }
    },
    hud: (s, c) => { const mit = c.mode === "mitosis", mei = c.mode === "meiosis"; return [{ title: mit ? "Mitosis (2n → 2n)" : mei ? "Meiosis (2n → n)" : c.mode === "fission" ? "Binary fission" : "Budding", lines: [[s.label || "", "#ffd27a", true], mit ? "One division → two identical diploid cells. Growth, repair, asexual reproduction." : mei ? "Two divisions → four genetically different haploid gametes. Crossing over and independent assortment create variation." : c.mode === "fission" ? "Asexual: Amoeba, Paramecium, bacteria. Offspring identical to parent." : "Asexual: yeast, Hydra. Bud may stay attached and form chains.", "—", mit || mei ? "Chromosome number here: 2n = 4 (two homologous pairs, red = maternal, blue = paternal)" : ""] }]; },
    readouts: (s, c) => c.mode === "mitosis" || c.mode === "meiosis" ? [["Stage", s.label || ""], ["Daughter cells", c.mode === "mitosis" ? "2 (2n)" : "4 (n)"]] : [["Process", c.mode === "fission" ? "Binary fission" : "Budding"]],
    table: () => MK.table(["", "Mitosis", "Meiosis"], [["Divisions", "1", "2"], ["Daughter cells", "2", "4"], ["Chromosome number", "Same (2n)", "Halved (n)"], ["Genetically", "Identical", "Different"], ["Where", "Growing tissues, root tips", "Testes, ovaries, anthers, ovules"]]),
    note: "Onion root-tip squash shows mitosis. Remember <b>PMAT</b> — prophase, metaphase, anaphase, telophase.",
    draw: BK.fallback("Cell division", (s, c) => [c.mode === "meiosis" ? "Meiosis: 2 divisions, 4 haploid cells, variation" : "Mitosis: 1 division, 2 identical diploid cells", "Stages: prophase → metaphase → anaphase → telophase → cytokinesis"]),
  });
  /* the same lab for the Ghana cell-cycle subtopic */
  MK.def("GH2-d", Object.assign({}, MK.scenes["A-k"], { values: { mode: "mitosis", p: 1.5, auto: 1 }, title: "Cell cycle, mitosis and meiosis",
    hud: (s, c) => MK.scenes["A-k"].hud(s, c).concat([{ title: "Cell cycle", lines: ["Interphase: G₁ (growth) → S (DNA replicates) → G₂ (prepares)", "M phase: mitosis (karyokinesis) + cytokinesis", ["Interphase is ≈ 90% of the cycle", "#7cb3ff"]] }]) }));
})();
