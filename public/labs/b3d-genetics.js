/* b3d-genetics.js — Topics E (Variation), F (Genetics), G (Evolution) photoreal labs:
   E-a heights of a class (continuous variation)     E-b ABO blood typing slide (+ tongue rolling, PTC)
   F-a Mendel's peas through P, F1, F2               F-b / GH2-b / GH2-c DNA, replication, protein synthesis
   F-e sickle cell blood in a vessel + counselling  G-a bees and termites   G-b fossil strata   G-c natural selection */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, W = MK.when, f = MK.fmt;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const tube = (pts, r, mat, seg = 60, rs = 12) => new (T().Mesh)(new (T().TubeGeometry)(new (T().CatmullRomCurve3)(pts), seg, r, rs), mat);
  const gauss = (r) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  /* ===================== E-a  heights ===================== */
  BK.def3d("E-a", {
    label: "Photoreal 3D lab", title: "Morphological variation",
    blurb: "A class of students arranged into columns by height — the columns make a bell-shaped histogram: continuous variation.",
    env: "studio", cam: [[0.2, 3.6, 10.0], [0.2, 1.6, 0]], fov: 38,
    values: { n: 40, seed: 1 },
    controls: [{ key: "n", label: "Students measured", min: 10, max: 80, step: 5 }],
    actions: [{ label: "↻ Measure another class", run: (s, c) => { c.seed = (c.seed || 1) + 1; s.key = ""; } }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) { const T3 = T(), key = c.n + "|" + c.seed;
      if (s.key !== key) { s.key = key; const g = BK.group(S, s); const rr = BK.rng(c.seed * 97 + 5), hs = Array.from({ length: c.n }, () => Math.round(158 + gauss(rr) * 7)); s.hs = hs; const bins = {}; hs.forEach((h) => { const b = Math.floor((h - 135) / 5); (bins[b] = bins[b] || []).push(h); }); s.bins = bins; const cols = [0x3a6ad8, 0xd83a6a, 0x3ab86a, 0xd8a03a, 0x8a5ad8];
        Object.entries(bins).forEach(([b, arr]) => { arr.sort((a2, b2) => a2 - b2).forEach((h, i) => { const p = BK.person(h / 160 * 1.0, cols[(i + +b) % 5]); p.position.set(-4.5 + (+b) * 0.75, 0, -i * 0.42 + 1.2); g.add(p); }); });
        BK.shadow(g, true, true); } },
    overlay(ctx, s, c, S, B) { if (!s.bins) return; Object.keys(s.bins).forEach((b) => BK.labc(S, B, -4.5 + (+b) * 0.75, 0.05, 1.7, (135 + b * 5) + "–" + (139 + b * 5), "#e8f1ff", 16, 9)); },
    hud: (s, c) => { const hs = s.hs || [158], m = hs.reduce((a, b) => a + b, 0) / hs.length, sd = Math.sqrt(hs.reduce((a, b) => a + (b - m) * (b - m), 0) / hs.length); return [{ title: "Heights of " + hs.length + " students (cm)", lines: [["Mean " + f(m, 1) + " cm · standard deviation " + f(sd, 1) + " cm", "#ffd27a", true], ["Range " + Math.min(...hs) + "–" + Math.max(...hs) + " cm", "#e8f1ff"], "Continuous variation: a smooth range of values with most near the middle (normal distribution).", "Caused by many genes plus the environment (food, health).", "Discontinuous variation: clear-cut classes — blood group, tongue rolling."] }]; },
    readouts: (s, c) => { const hs = s.hs || []; return [["Tallest", hs.length ? Math.max(...hs) + " cm" : "—"], ["Shortest", hs.length ? Math.min(...hs) + " cm" : "—"]]; },
    note: "Measure height and mass of pupils of the same age, group into classes (e.g. 5 cm) and draw a histogram — WAEC practical favourite.",
    draw: BK.fallback("Variation", ["Height shows continuous variation (bell-shaped histogram)", "Blood groups show discontinuous variation"]),
  });

  /* ===================== E-b / WA4-a  blood typing ===================== */
  const BG = { A: { antigens: ["A"], anti: "anti-B", don: "A, AB", rec: "A, O" }, B: { antigens: ["B"], anti: "anti-A", don: "B, AB", rec: "B, O" }, AB: { antigens: ["A", "B"], anti: "none", don: "AB only", rec: "A, B, AB, O (universal recipient)" }, O: { antigens: [], anti: "anti-A and anti-B", don: "A, B, AB, O (universal donor)", rec: "O only" } };
  function bloodScene(key, extra) { BK.def3d(key, Object.assign({
    label: "Photoreal 3D bench experiment", env: "lab", cam: [[1.2, 2.6, 4.6], [1.0, 0.6, 0]], fov: 38,
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); const slide = new T3.Mesh(new T3.BoxGeometry(3.2, 0.06, 1.2), window.P3D.mat.glass(0xf6fbff)); slide.position.y = 0.4; g.add(slide); s.drops = []; s.cells = [];
      ["anti-A", "anti-B"].forEach((lab, k) => { const x = -0.8 + k * 1.6; const drop = new T3.Mesh(new T3.SphereGeometry(0.45, 40, 20, 0, 6.3, 0, Math.PI / 2), new T3.MeshPhysicalMaterial({ color: 0xc8202a, roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.55 })); drop.scale.y = 0.35; drop.position.set(x, 0.43, 0); g.add(drop); s.drops.push(drop);
        const im = new T3.InstancedMesh(new T3.SphereGeometry(0.035, 10, 8), BK.mat.blood(), 140); g.add(im); const P = Array.from({ length: 140 }, () => { const a = Math.random() * 6.3, r = Math.sqrt(Math.random()) * 0.38; return { x: x + Math.cos(a) * r, z: Math.sin(a) * r, hx: 0, hz: 0 }; }); const cl = []; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.3 + 0.3; cl.push([x + Math.cos(a) * 0.26 * (i % 2 ? 1 : 0.45), Math.sin(a) * 0.26 * (i % 2 ? 1 : 0.45)]); } P.forEach((p, i) => { const cc = cl[i % cl.length]; p.hx = cc[0] + (Math.random() - 0.5) * 0.035; p.hz = cc[1] + (Math.random() - 0.5) * 0.035; }); s.cells.push({ im, P, x }); });
      BK.shadow(g, false, true); s.p = 0; },
    update(S, s, c, dt) { if (s.lastG !== c.g) { s.lastG = c.g; s.p = 0; } s.p = Math.min(1, s.p + dt * 0.4); const ag = BG[c.g].antigens, m4 = new (T().Matrix4)();
      s.cells.forEach((cs, k) => { const clump = ag.includes(k ? "B" : "A"); cs.P.forEach((p, i) => { const e = clump ? s.p : 0; const x = p.x + (p.hx - p.x) * e, z = p.z + (p.hz - p.z) * e; m4.makeTranslation(x, 0.48, z); cs.im.setMatrixAt(i, m4); }); cs.im.instanceMatrix.needsUpdate = true; }); },
    overlay(ctx, s, c, S, B) { ["anti-A serum", "anti-B serum"].forEach((t, k) => BK.labc(S, B, -0.8 + k * 1.6, 0.95, 0, t, "#e8f1ff")); const ag = BG[c.g].antigens; [0, 1].forEach((k) => BK.labc(S, B, -0.8 + k * 1.6, 0.42, 0.55, ag.includes(k ? "B" : "A") ? "Agglutination (clumps)" : "No clumping", ag.includes(k ? "B" : "A") ? "#ff7b72" : "#5bd68c", 18)); },
    draw: BK.fallback("Blood groups", (s, c) => ["Group " + c.g + ": antigens " + (BG[c.g].antigens.join(" + ") || "none") + "; plasma antibodies " + BG[c.g].anti, "Can donate to " + BG[c.g].don + "; receive from " + BG[c.g].rec]),
  }, extra)); }
  bloodScene("E-b", { title: "Physiological variation — blood groups", blurb: "Mix a drop of blood with anti-A and anti-B sera and watch for clumping (agglutination) to find the ABO blood group. Tongue rolling and PTC tasting are summarised alongside.",
    values: { g: "A" }, controls: [{ type: "tabs", key: "g", label: "Blood sample", options: [["A", "Group A"], ["B", "Group B"], ["AB", "Group AB"], ["O", "Group O"]] }],
    hud: (s, c) => [{ title: "Blood group " + c.g, lines: [["Antigens on red cells: " + (BG[c.g].antigens.join(" + ") || "none"), "#ffd27a"], ["Antibodies in plasma: " + BG[c.g].anti, "#7cb3ff"], "Can donate to: " + BG[c.g].don, "Can receive from: " + BG[c.g].rec, "—", "Tongue rolling (dominant allele) and tasting PTC (bitter to tasters) are discontinuous: you can or you cannot."] }],
    table: () => MK.table(["Group", "Genotypes", "Antigen", "Antibody"], [["A", "IᴬIᴬ, Iᴬi", "A", "anti-B"], ["B", "IᴮIᴮ, Iᴮi", "B", "anti-A"], ["AB", "IᴬIᴮ", "A and B", "none"], ["O", "ii", "none", "anti-A, anti-B"]]),
    readouts: (s, c) => [["Group", c.g], ["Clumps with", BG[c.g].antigens.map((a) => "anti-" + a).join(", ") || "neither serum"]] });
  bloodScene("WA4-a", { title: "Crime detection, blood transfusion and paternity", blurb: "Blood typing on a slide is used to match donors, rule out a suspect and settle paternity disputes. Fingerprints (loops, whorls, arches) are unique to each person.",
    values: { g: "O", mom: "A", kid: "B", dad: "O" }, controls: [{ type: "tabs", key: "g", label: "Blood on the slide", options: [["A", "A"], ["B", "B"], ["AB", "AB"], ["O", "O"]] }, { type: "select", key: "mom", label: "Mother", options: ["A", "B", "AB", "O"] }, { type: "select", key: "kid", label: "Child", options: ["A", "B", "AB", "O"] }, { type: "select", key: "dad", label: "Alleged father", options: ["A", "B", "AB", "O"] }],
    hud: (s, c) => { const al = { A: ["Iᴬ", "i"], B: ["Iᴮ", "i"], AB: ["Iᴬ", "Iᴮ"], O: ["i", "i"] }; const ph = (a, b) => { const s2 = [a, b].sort().join(""); return s2.includes("Iᴬ") && s2.includes("Iᴮ") ? "AB" : s2.includes("Iᴬ") ? "A" : s2.includes("Iᴮ") ? "B" : "O"; }; const poss = new Set(); al[c.mom].forEach((a) => al[c.dad].forEach((b) => poss.add(ph(a, b)))); const ok = poss.has(c.kid);
      return [{ title: "Paternity test", lines: [["Children possible from " + c.mom + " × " + c.dad + ": " + [...poss].join(", "), "#ffd27a"], [ok ? "The man COULD be the father (blood groups cannot prove it)." : "The man CANNOT be the father — excluded.", ok ? "#5bd68c" : "#ff7b72", true], "Blood groups can exclude, but not prove, paternity; DNA fingerprinting can confirm.", "Transfusion: donor red cells must not carry antigens the recipient has antibodies against."] }]; },
    readouts: (s, c) => [["Slide group", c.g]] });

  /* ===================== F-a  Mendel's peas ===================== */
  function pea(T3, tall, red) { const g = new T3.Group(), h = tall ? 1.6 : 0.55; const pot = new T3.Mesh(new T3.CylinderGeometry(0.22, 0.17, 0.3, 20), new T3.MeshPhysicalMaterial({ color: 0xb8643a, roughness: 0.7 })); pot.position.y = 0.15; g.add(pot); const pl = BK.plant({ h, leaves: tall ? 7 : 4, leafLen: 0.22, leafW: 0.13, r: 0.025 }); pl.position.y = 0.3; g.add(pl); const fm = new T3.MeshPhysicalMaterial({ color: red ? 0xc8202a : 0xf6f2ea, roughness: 0.5, sheen: 1, side: T3.DoubleSide }); for (let i = 0; i < 3; i++) { const fl = new T3.Mesh(new T3.SphereGeometry(0.07, 12, 8, 0, 6.3, 0, 1.6), fm); fl.position.set(Math.cos(i * 2) * 0.12, 0.3 + h * (0.7 + i * 0.1), Math.sin(i * 2) * 0.12); g.add(fl); } return BK.shadow(g, true, false); }
  BK.def3d("F-a", {
    label: "Photoreal 3D greenhouse", title: "Genetic terms and Mendel's work",
    blurb: "Cross pure-breeding tall and dwarf (or red- and white-flowered) peas. Every F1 plant is tall; self them and the F2 comes out about 3 tall : 1 dwarf.",
    env: "lab", cam: [[1.4, 3.4, 8.2], [1.3, 1.0, 0]], fov: 38,
    values: { trait: "height", gen: 2, seed: 1 },
    controls: [{ type: "tabs", key: "trait", label: "Character", options: [["height", "Stem height (T / t)"], ["colour", "Flower colour (R / r)"]] }, { type: "tabs", key: "gen", label: "Generation", options: [[0, "P (parents)"], [1, "F1"], [2, "F2"]] }],
    actions: [{ label: "↻ Grow another F2", run: (s, c) => { c.seed = (c.seed || 1) + 1; } }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) { const T3 = T(), key = c.trait + c.gen + "|" + c.seed;
      if (s.key !== key) { s.key = key; const g = BK.group(S, s); const rr = BK.rng(c.seed * 13 + 7); let geno = [];
        if (+c.gen === 0) geno = ["DD", "dd"]; else if (+c.gen === 1) geno = Array(8).fill("Dd"); else geno = Array.from({ length: 24 }, () => (rr() < 0.5 ? "D" : "d") + (rr() < 0.5 ? "D" : "d"));
        s.geno = geno; const per = +c.gen === 2 ? 8 : 8; geno.forEach((gt, i) => { const dom = gt.includes("D"); const p = pea(T3, c.trait === "height" ? dom : true, c.trait === "colour" ? dom : true); p.position.set(-3.2 + (i % per) * 0.9 + (+c.gen === 0 ? 2.2 + i * 1.2 : 0), 0, -Math.floor(i / per) * 1.0 + 0.6); g.add(p); }); } },
    overlay(ctx, s, c, S, B) { if (+c.gen === 0) { BK.lab(S, B, -1.0, 2.2, 0.6, c.trait === "height" ? "TT (tall)" : "RR (red)", "#ffd27a", 0, 0); BK.lab(S, B, 0.2 + 0.9, 1.0, 0.6, c.trait === "height" ? "tt (dwarf)" : "rr (white)", "#ffd27a", 0, 0); } },
    hud: (s, c) => { const g2 = s.geno || [], dom = g2.filter((x) => x.includes("D")).length, A = c.trait === "height" ? ["T", "t", "tall", "dwarf"] : ["R", "r", "red", "white"]; const rename = (x) => x.replace(/D/g, A[0]).replace(/d/g, A[1]).split("").sort().join(""); return [{ title: ["Parents (pure-breeding)", "First filial generation (F1)", "Second filial generation (F2)"][+c.gen], lines: [+c.gen === 0 ? A[0] + A[0] + " × " + A[1] + A[1] : +c.gen === 1 ? "All " + A[0] + A[1] + " — all " + A[2] + " (dominant hides recessive)" : "F1 selfed: " + A[0] + A[1] + " × " + A[0] + A[1], +c.gen === 2 ? [A[2] + ": " + dom + " · " + A[3] + ": " + (g2.length - dom) + "  → ratio " + f(dom / Math.max(1, g2.length - dom), 2) + " : 1 (expected 3 : 1)", "#ffd27a", true] : "", +c.gen === 2 ? "Genotypes: " + A[0] + A[0] + " " + g2.filter((x) => x === "DD").length + " · " + A[0] + A[1] + " " + g2.filter((x) => x.length === 2 && x.includes("D") && x.includes("d")).length + " · " + A[1] + A[1] + " " + g2.filter((x) => x === "dd").length + " (expected 1 : 2 : 1)" : "", "—", "Law of segregation: the two alleles of a gene separate into different gametes."] }]; },
    table: () => MK.table(["Term", "Meaning"], [["Gene", "Unit of heredity on a chromosome"], ["Allele", "Alternative form of a gene (T or t)"], ["Locus", "Position of a gene on a chromosome"], ["Genotype", "Alleles present (TT, Tt, tt)"], ["Phenotype", "Observable character (tall, dwarf)"], ["Dominant / recessive", "Expressed when present / only when homozygous"], ["Test cross", "Cross with homozygous recessive to find an unknown genotype"], ["Back cross", "Cross of offspring with one of its parents"]]),
    readouts: (s, c) => [["Plants", String((s.geno || []).length)]],
    draw: BK.fallback("Mendel's peas", ["TT × tt → F1 all Tt (tall)", "Tt × Tt → F2 1 TT : 2 Tt : 1 tt — 3 tall : 1 dwarf"]),
  });

  /* ===================== F-b / GH2-b / GH2-c  DNA ===================== */
  const BASES = { A: 0xd83a3a, T: 0xd8c83a, G: 0x3a8ad8, C: 0x3ac86a, U: 0xc83ad8 };
  const PAIR = { A: "T", T: "A", G: "C", C: "G" }, RPAIR = { A: "U", T: "A", G: "C", C: "G" };
  const CODON = { AUG: "Met", UUU: "Phe", GGC: "Gly", UAC: "Tyr", GCA: "Ala", AAA: "Lys", UGG: "Trp", CUG: "Leu", UAA: "STOP" };
  function dnaScene(key, extra) { BK.def3d(key, Object.assign({
    label: "Photoreal 3D molecular model", env: "micro", cam: [[1.6, 1.4, 8.6], [1.4, 0.4, 0]], fov: 38,
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) { const T3 = T(), mode = c.mode;
      if (s.key !== mode) { s.key = mode; const g = BK.group(S, s); s.t0 = 0; const seq = "ATGTTTGGCTACGCAAAATGGCTGTAA".split(""); s.seq = seq; const n = seq.length, step = 0.34, twist = Math.PI * 2 / 10;
        const bbM = [new T3.MeshPhysicalMaterial({ color: 0xdfe6f0, roughness: 0.3, clearcoat: 1 }), new T3.MeshPhysicalMaterial({ color: 0xf0d8b8, roughness: 0.3, clearcoat: 1 })];
        s.pairs = []; s.strandA = []; s.strandB = []; const R = 0.75;
        for (let i = 0; i < n; i++) { const a = i * twist, x = -n * step / 2 + i * step; const pA = V(x, Math.cos(a) * R, Math.sin(a) * R), pB = V(x, Math.cos(a + Math.PI * 0.8) * R, Math.sin(a + Math.PI * 0.8) * R); s.strandA.push(pA); s.strandB.push(pB);
          const b1 = seq[i], b2 = PAIR[b1]; const half = (from, to, base) => { const d = to.clone().sub(from), L = d.length(); const m = new T3.Mesh(new T3.CylinderGeometry(0.07, 0.07, L, 10), new T3.MeshPhysicalMaterial({ color: BASES[base], roughness: 0.35, clearcoat: 0.8 })); m.position.copy(from).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); g.add(m); return m; };
          const mid = pA.clone().lerp(pB, 0.5); const h1 = half(pA, mid, b1), h2 = half(mid, pB, b2); s.pairs.push({ h1, h2, pA, pB, mid, b1, b2, a }); }
        s.bbA = tube(s.strandA, 0.09, bbM[0], 200, 10); s.bbB = tube(s.strandB, 0.09, bbM[1], 200, 10); g.add(s.bbA, s.bbB); s.new = [];
        if (mode === "trans" || mode === "prot") { s.mrna = new T3.Group(); g.add(s.mrna); }
        if (mode === "prot") { s.ribo = new T3.Group(); const big = new T3.Mesh(BK.blob(0.7, 3, 0.1, 32, 1.2, 0.8, 1), new T3.MeshPhysicalMaterial({ color: 0x8a6ad8, roughness: 0.4, transparent: true, opacity: 0.8, clearcoat: 0.6 })); big.position.y = 0.55; const small = new T3.Mesh(BK.blob(0.5, 5, 0.1, 32, 1.2, 0.6, 1), new T3.MeshPhysicalMaterial({ color: 0xb89ae8, roughness: 0.4, transparent: true, opacity: 0.8 })); small.position.y = -0.35; s.ribo.add(big, small); g.add(s.ribo); s.chain = new T3.Group(); g.add(s.chain); s.bbA.visible = s.bbB.visible = false; s.pairs.forEach((p) => { p.h1.visible = p.h2.visible = false; }); }
        BK.shadow(g, false, false); }
      s.t0 += dt; const t = s.t0, T3b = T();
      if (mode === "struct") s.g.rotation.x = t * 0.25;
      if (mode === "rep" || mode === "trans") { const k = Math.min(1, t / 10), open = Math.floor(k * s.pairs.length); s.pairs.forEach((p, i) => { const o = i < open ? Math.min(1, (k * s.pairs.length - i) * 0.6) : 0; const sep = o * 0.55; p.h1.position.copy(p.pA.clone().lerp(p.mid, 0.5)).add(V(0, sep, 0)); p.h2.position.copy(p.mid.clone().lerp(p.pB, 0.5)).add(V(0, -sep, 0)); p.h1.visible = true; p.h2.visible = true;
          if (o > 0.6 && !p.done) { p.done = true; const nb = mode === "rep" ? [PAIR[p.b1], p.b1] : [RPAIR[p.b2 === "A" ? "T" : p.b2 === "T" ? "A" : p.b2 === "G" ? "C" : "G"]]; nb.forEach((b, k2) => { if (mode === "trans" && k2 > 0) return; const m = new T3b.Mesh(new T3b.CylinderGeometry(0.065, 0.065, 0.4, 10), new T3b.MeshPhysicalMaterial({ color: BASES[mode === "trans" ? (b === "T" ? "U" : b) : b], roughness: 0.3, clearcoat: 1, transparent: true, opacity: mode === "trans" ? 0.85 : 1 })); const base = k2 ? p.pB.clone().add(V(0, -0.55, 0)) : p.pA.clone().add(V(0, 0.55, 0)); m.position.copy(base).add(V(0, k2 ? 0.35 : -0.35, 0)); s.g.add(m); s.new.push(m); }); } }); s.bbA.position.y = 0; }
      if (mode === "prot") { const codons = []; for (let i = 0; i + 2 < s.seq.length; i += 3) codons.push(s.seq.slice(i, i + 3).join("").replace(/T/g, "U")); s.codons = codons; const k = Math.min(codons.length - 1, Math.floor(t / 1.6)); s.k = k;
        if (s.lastK !== k) { s.lastK = k; BK.dispose(S, s.mrna); s.mrna = new T3b.Group(); s.g.add(s.mrna); codons.forEach((cd, i) => cd.split("").forEach((b, j) => { const m = new T3b.Mesh(new T3b.BoxGeometry(0.28, 0.35, 0.28), new T3b.MeshPhysicalMaterial({ color: BASES[b], roughness: 0.35, clearcoat: 0.8 })); m.position.set(-4 + (i * 3 + j) * 0.32 - k * 0.96 + 1.0, -0.2, 0); s.mrna.add(m); }));
          BK.dispose(S, s.chain); s.chain = new T3b.Group(); s.g.add(s.chain); for (let i = 0; i <= k; i++) { if (CODON[codons[i]] === "STOP") break; const aa = new T3b.Mesh(new T3b.SphereGeometry(0.2, 16, 12), new T3b.MeshPhysicalMaterial({ color: new T3b.Color().setHSL(i * 0.13 % 1, 0.6, 0.55), roughness: 0.3, clearcoat: 1 })); aa.position.set(0.2 - (k - i) * 0.42, 1.6 + Math.sin(i) * 0.15, 0); s.chain.add(aa); } }
        s.ribo.position.set(0.3, 0, 0); s.ribo.rotation.y = Math.sin(t) * 0.1; }
    },
    draw: BK.fallback("DNA", ["Double helix: sugar–phosphate backbones, base pairs A–T and G–C", "Replication is semi-conservative; transcription makes mRNA; ribosomes translate codons"]),
  }, extra)); }
  dnaScene("F-b", { title: "Chromosomes and DNA", blurb: "A rotating DNA double helix with colour-coded base pairs; then watch it unzip and copy itself (semi-conservative replication).",
    values: { mode: "struct" }, controls: [{ type: "tabs", key: "mode", label: "View", options: [["struct", "Double helix"], ["rep", "Replication"]] }],
    hud: (s, c) => [{ title: c.mode === "struct" ? "Structure of DNA" : "DNA replication", lines: c.mode === "struct" ? ["Two sugar–phosphate backbones twisted into a double helix (Watson and Crick, 1953).", ["Base pairs: A–T (red–yellow) and G–C (blue–green), joined by hydrogen bonds", "#ffd27a"], "≈ 10 base pairs per turn, 0.34 nm apart.", "DNA coils around proteins to form chromosomes (46 in human body cells, 23 pairs)."] : ["Helicase unzips the hydrogen bonds between bases.", "Free nucleotides pair with each exposed base (A–T, G–C).", ["Each new DNA = one old strand + one new strand (semi-conservative)", "#5bd68c"], "Happens in the S phase of interphase, before mitosis or meiosis."] }],
    readouts: (s, c) => [["Base pairs", String((s.seq || []).length)]] });
  dnaScene("GH2-b", { title: "Nucleic acids, DNA structure and replication", blurb: "The double helix, its replication and transcription into messenger RNA (U replaces T).",
    values: { mode: "struct" }, controls: [{ type: "tabs", key: "mode", label: "Process", options: [["struct", "Double helix"], ["rep", "Replication"], ["trans", "Transcription → mRNA"]] }],
    hud: (s, c) => [{ title: { struct: "DNA", rep: "Replication", trans: "Transcription" }[c.mode], lines: [c.mode === "trans" ? "RNA polymerase reads the template strand and builds mRNA: A→U, T→A, G→C, C→G." : c.mode === "rep" ? "Semi-conservative: each daughter molecule keeps one parent strand." : "Double helix of deoxyribose–phosphate backbones with paired bases.", "—", MK.table ? "DNA: deoxyribose, bases A T G C, double-stranded, in nucleus. RNA: ribose, bases A U G C, single-stranded, leaves the nucleus." : ""] }],
    table: () => MK.table(["", "DNA", "RNA"], [["Sugar", "Deoxyribose", "Ribose"], ["Bases", "A, T, G, C", "A, U, G, C"], ["Strands", "Double helix", "Single"], ["Location", "Nucleus (chromosomes)", "Nucleus and cytoplasm"], ["Types", "One", "mRNA, tRNA, rRNA"]]) });
  dnaScene("GH2-c", { title: "Protein synthesis", blurb: "mRNA threads through a ribosome; each codon of three bases calls up one amino acid and the polypeptide chain grows until a stop codon.",
    values: { mode: "prot" }, controls: [],
    actions: [{ label: "↻ Translate again", run: (s) => { s.t0 = 0; s.lastK = -1; } }],
    hud: (s, c) => { const cd = (s.codons || [])[s.k || 0] || ""; return [{ title: "Translation at the ribosome", lines: [["Codon " + cd + " → " + (CODON[cd] || "?"), "#ffd27a", true], "tRNA carries the matching amino acid; its anticodon pairs with the codon.", "Peptide bonds join amino acids into a polypeptide.", "Proteins made by humans: haemoglobin, insulin, enzymes (amylase), antibodies, keratin."] }]; },
    readouts: (s, c) => [["Amino acids joined", String(Math.min(8, (s.k || 0) + 1))]] });

  /* ===================== F-e  sickle cell ===================== */
  BK.def3d("F-e", {
    label: "Photoreal 3D lab", title: "Applications of heredity — sickle cell and rhesus",
    blurb: "Red blood cells flowing through a capillary. Choose the genotype — AA, AS or SS — and watch sickled cells jam the vessel when oxygen is low. Plan the risks for a couple's children.",
    env: "micro", envOpts: { top: 0x5a1a1a, bot: 0x140404 }, cam: [[1.4, 1.2, 6.4], [1.4, 0, 0]], fov: 38,
    values: { gt: "AS", o2: 60, mum: "AS", dad: "AS" },
    controls: [{ type: "tabs", key: "gt", label: "Genotype in the vessel", options: [["AA", "AA (normal)"], ["AS", "AS (carrier)"], ["SS", "SS (sickle cell anaemia)"]] }, { key: "o2", label: "Oxygen level", min: 10, max: 100, unit: "%" }, { type: "select", key: "mum", label: "Mother", options: ["AA", "AS", "SS"] }, { type: "select", key: "dad", label: "Father", options: ["AA", "AS", "SS"] }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); const ves = new T3.Mesh(new T3.CylinderGeometry(1.1, 1.1, 14, 48, 1, true), new T3.MeshPhysicalMaterial({ color: 0xd88080, roughness: 0.4, transparent: true, opacity: 0.25, side: T3.DoubleSide, depthWrite: false })); ves.rotation.z = Math.PI / 2; g.add(ves);
      const disc = (() => { const pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI, r = Math.sin(a) * 0.38; pts.push(new T3.Vector2(r + 0.001, Math.cos(a) * (0.08 + 0.12 * Math.pow(r / 0.38, 2)))); } return new T3.LatheGeometry(pts, 32); })();
      const sick = (() => { const sh = new T3.Shape(); sh.absarc(0, 0, 0.45, 0.4, Math.PI - 0.4, false); sh.absarc(0, 0.25, 0.32, Math.PI - 0.55, 0.55, true); return new T3.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 }); })();
      s.norm = new T3.InstancedMesh(disc, BK.mat.blood(), 80); s.sick = new T3.InstancedMesh(sick, BK.mat.blood(), 80); g.add(s.norm, s.sick); s.P = Array.from({ length: 80 }, () => ({ x: Math.random() * 14 - 7, y: (Math.random() - 0.5) * 1.4, z: (Math.random() - 0.5) * 1.4, r: Math.random() * 6, k: Math.random() })); },
    update(S, s, c, dt) { const fs = c.gt === "AA" ? 0 : c.gt === "AS" ? (c.o2 < 25 ? 0.12 : 0.01) : Math.min(0.85, 0.25 + (100 - c.o2) / 100 * 0.6); s.fs = fs; const jam = c.gt === "SS" ? Math.min(0.9, fs * 1.1) : 0; const m4 = new (T().Matrix4)(), q = new (T().Quaternion)(), e = new (T().Euler)(); let n = 0, k2 = 0;
      s.P.forEach((p) => { const sk = p.k < fs; const v = (sk ? 1 - jam : 1) * 1.6 * (1 - jam * 0.6); p.x += dt * v; if (p.x > 7) p.x -= 14; p.r += dt * 1.5; e.set(p.r, p.r * 0.7, 0); q.setFromEuler(e); m4.compose(V(p.x, p.y, p.z), q, V(1, 1, 1)); if (sk) s.sick.setMatrixAt(k2++, m4); else s.norm.setMatrixAt(n++, m4); }); s.norm.count = n; s.sick.count = k2; s.norm.instanceMatrix.needsUpdate = true; s.sick.instanceMatrix.needsUpdate = true; },
    hud: (s, c) => { const a1 = c.mum.split(""), a2 = c.dad.split(""), kids = []; a1.forEach((x) => a2.forEach((y) => kids.push([x, y].sort().join("")))); const pc = (gt) => kids.filter((k) => k === gt).length * 25; return [{ title: "Sickle cell — genotype " + c.gt, lines: [["Sickled cells now ≈ " + f((s.fs || 0) * 100, 0) + "%", "#ff7b72", true], c.gt === "SS" ? "SS: haemoglobin S crystallises at low O₂ → sickle cells block capillaries → pain crises, anaemia." : c.gt === "AS" ? "AS carriers are usually healthy (and partly protected from malaria)." : "AA: normal haemoglobin.", "—", ["Children of " + c.mum + " × " + c.dad + ": AA " + pc("AA") + "% · AS " + pc("AS") + "% · SS " + pc("SS") + "%", "#ffd27a"], "Rhesus: an Rh⁻ mother carrying an Rh⁺ baby may make anti-D antibodies that harm a later Rh⁺ baby — prevented by anti-D injection."] }]; },
    readouts: (s, c) => [["Genotype", c.gt], ["Sickled", f((s.fs || 0) * 100, 0) + "%"]],
    table: () => MK.table(["Application", "Examples"], [["Agriculture", "Disease-resistant cassava and maize, high-yield rice, cross-bred cattle and poultry"], ["Inbreeding", "Fixes desirable traits but exposes harmful recessives"], ["Outbreeding", "Hybrid vigour; more variation"], ["Medicine", "Genetic counselling: sickle cell, rhesus factor, haemophilia"]]),
    note: "Genetic counselling: two AS carriers have a 1 in 4 chance of an SS child in EACH pregnancy.",
    draw: BK.fallback("Sickle cell", (s, c) => ["AS × AS → 25% AA, 50% AS, 25% SS", "Sickled cells (SS) block capillaries at low oxygen"]),
  });

  /* ===================== G-a  social insects ===================== */
  BK.def3d("G-a", {
    label: "Photoreal 3D lab", title: "Behavioural adaptations in social animals",
    blurb: "Inside a honeycomb: one queen, a few drones and many workers each doing their job. Or cut open a termite mound to see the royal chamber and fungus gardens.",
    env: "studio", cam: [[1.4, 2.6, 6.4], [1.2, 1.4, 0]], fov: 38,
    values: { sp: "bee", caste: "worker" },
    controls: [{ type: "tabs", key: "sp", label: "Colony", options: [["bee", "Honeybees"], ["ter", "Termites"]] }, { type: "tabs", key: "caste", label: "Caste", options: [["queen", "Queen"], ["drone", "Drone / king"], ["worker", "Worker"], ["soldier", "Soldier (termites)"]] }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) { const T3 = T();
      if (s.key !== c.sp) { s.key = c.sp; const g = BK.group(S, s); s.ins = [];
        if (c.sp === "bee") { const comb = new T3.InstancedMesh(new T3.CylinderGeometry(0.15, 0.15, 0.4, 6, 1, true), new T3.MeshPhysicalMaterial({ color: 0xe8b830, roughness: 0.3, clearcoat: 1, side: T3.DoubleSide }), 400), honey = new T3.InstancedMesh(new T3.CylinderGeometry(0.13, 0.13, 0.05, 6), new T3.MeshPhysicalMaterial({ color: 0xd88a10, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 }), 400), m4 = new T3.Matrix4(), q = new T3.Quaternion().setFromEuler(new T3.Euler(Math.PI / 2, 0, Math.PI / 6)); let k = 0;
            for (let i = 0; i < 20; i++) for (let j = 0; j < 20; j++) { const x = -2.6 + i * 0.27, y = 0.2 + j * 0.155 * 2 * 0.5 + (i % 2) * 0.155; m4.compose(V(x, y + j * 0.155 * 0.98, -0.3), q, V(1, 1, 1)); comb.setMatrixAt(k, m4); m4.compose(V(x, y + j * 0.155 * 0.98, -0.12), q, V(1, 1, 1)); honey.setMatrixAt(k, m4); k++; } g.add(comb, honey);
          const add = (caste, n, sz, col) => { for (let i = 0; i < n; i++) { const b = BK.insect(sz, col, { wings: true, wingCol: 0xffffff, wingOp: 0.35, wingR: 0.2 }); b.userData.caste = caste; b.position.set(-2 + Math.random() * 4.2, 0.8 + Math.random() * 2.6, 0.15); b.rotation.set(Math.PI / 2, 0, Math.random() * 6.3); g.add(b); s.ins.push(b); } };
          add("queen", 1, 0.55, 0x6a3a10); add("drone", 3, 0.42, 0x3a2410); add("worker", 18, 0.32, 0xb88a20); }
        else { const mound = new T3.Mesh(new T3.ConeGeometry(2.2, 4, 48, 8, true, 0, Math.PI * 1.4), new T3.MeshStandardMaterial({ map: BK.soilTex([3, 3]), roughness: 1, side: T3.DoubleSide })); mound.position.y = 2; g.add(mound); const cham = new T3.Mesh(new T3.SphereGeometry(0.4, 24, 16), new T3.MeshStandardMaterial({ color: 0x3a2414, side: T3.BackSide })); cham.position.set(0, 0.6, 0); g.add(cham);
          for (let i = 0; i < 6; i++) { const fg = new T3.Mesh(BK.blob(0.18, i, 0.3, 16), new T3.MeshStandardMaterial({ color: 0xe8e0c8, roughness: 0.9 })); fg.position.set(Math.cos(i) * 0.8, 1 + i * 0.25, Math.sin(i) * 0.6); g.add(fg); } for (let i = 0; i < 8; i++) g.add(tube([V(0, 0.6, 0), V(Math.cos(i) * 0.6, 1.2 + i * 0.2, Math.sin(i) * 0.6), V(Math.cos(i) * 1.2, 2 + i * 0.1, Math.sin(i) * 1.0)], 0.06, new T3.MeshStandardMaterial({ color: 0x2a1a0a })));
          const add = (caste, n, sz, col, sx = 1) => { for (let i = 0; i < n; i++) { const b = BK.insect(sz, col); b.userData.caste = caste; if (sx !== 1) b.children[0].scale.x *= sx; b.position.set(Math.cos(i * 1.3) * 0.9, 0.6 + Math.random() * 2, Math.sin(i * 1.3) * 0.7 + 0.3); g.add(b); s.ins.push(b); } };
          add("queen", 1, 0.6, 0xe8d8b0, 3); add("drone", 1, 0.45, 0x6a4a2a); add("worker", 14, 0.28, 0xf2e6c8); add("soldier", 5, 0.38, 0xd8a050); }
        BK.shadow(g, true, true); }
      s.ins.forEach((b, i) => { const on = b.userData.caste === c.caste; b.scale.setScalar((on ? 1.25 : 1) * (b.userData.s0 || (b.userData.s0 = b.scale.x))); if (b.wings) b.wings.forEach((w, k) => (w.rotation.x = (k ? 1 : -1) * Math.sin(S.t * 30 + i) * 0.4)); if (b.userData.caste === "worker") { b.position.x += Math.cos(S.t + i) * dt * 0.15; b.position.y += Math.sin(S.t * 0.7 + i) * dt * 0.1; } }); },
    overlay(ctx, s, c, S, B) { const b = s.ins.find((x) => x.userData.caste === c.caste); if (b) BK.leader(S, B, [b.position.x, b.position.y, b.position.z], c.caste, "#ffd27a", -60, -24); },
    hud: (s, c) => { const D = c.sp === "bee" ? { queen: "One fertile female; lays up to 2000 eggs a day; fed royal jelly.", drone: "Fertile males; mate with a queen; no sting; expelled in hard times.", worker: "Sterile females: clean cells, nurse larvae, build comb, guard, forage; waggle dance tells others where food is.", soldier: "Honeybees have no soldier caste — workers guard the hive." } : { queen: "Huge egg-laying female in the royal chamber.", drone: "King: stays with the queen for life.", worker: "Blind, sterile; build the mound, tend fungus gardens, feed others.", soldier: "Large heads and jaws (or chemical sprays) defend the colony." }; return [{ title: (c.sp === "bee" ? "Honeybee" : "Termite") + " — " + c.caste, lines: [D[c.caste], "—", "Division of labour makes the colony efficient — individuals cannot survive alone.", "Other behaviour: territorial birds and lizards, warning cries, basking (lizards), hibernation and aestivation."] }]; },
    readouts: (s, c) => [["Colony", c.sp === "bee" ? "Honeybees" : "Termites"], ["Caste", c.caste]],
    draw: BK.fallback("Social insects", ["Bees: queen, drones, workers", "Termites: queen, king, workers, soldiers"]),
  });

  /* ===================== G-b  fossil strata ===================== */
  const LAYERS = [["Recent soil", 0, 0x6a4a2a, "humans, modern mammals"], ["Mammal age (Cenozoic)", 40, 0xc8a070, "early mammals, flowering plants"], ["Reptile age (Mesozoic)", 150, 0xb88a5a, "dinosaurs, first birds"], ["Coal forests (Carboniferous)", 320, 0x4a4a4a, "giant ferns, amphibians"], ["Fish age (Devonian)", 390, 0xa8644a, "fish with lungs and fins"], ["Early sea life (Cambrian)", 520, 0x8a7a6a, "trilobites, shellfish"]];
  BK.def3d("G-b", {
    label: "Photoreal 3D lab", title: "Evidence of evolution",
    blurb: "A cliff of rock layers with fossils: the deeper the layer, the older and simpler the life it holds.",
    env: "outdoor", cam: [[2.4, 3.0, 7.4], [1.2, 1.8, 0]], fov: 38,
    values: { L: 2 },
    controls: [{ key: "L", label: "Rock layer", min: 0, max: 5, step: 1, fmt: (v) => LAYERS[v][0] }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); s.lay = []; LAYERS.forEach((l, i) => { const m = new T3.Mesh(new T3.BoxGeometry(4.6, 0.6, 2.2), new T3.MeshStandardMaterial({ map: BK.spotTex("#" + l[2].toString(16).padStart(6, "0"), "#" + BK.shade("#" + l[2].toString(16).padStart(6, "0"), -30).slice(1), 160, 5), roughness: 0.95 })); m.position.set(0, 3.5 - i * 0.62, 0); g.add(m); s.lay.push(m); });
      const fos = new T3.MeshPhysicalMaterial({ color: 0xe8e0c8, roughness: 0.6 }); const add = (m, li, x) => { m.position.set(x, 3.5 - li * 0.62, 1.12); g.add(m); };
      const shell = new T3.Mesh(new T3.TorusGeometry(0.12, 0.05, 8, 24, 5), fos); add(shell, 5, -1.2); const tri = new T3.Mesh(BK.blob(0.15, 3, 0.1, 16, 1.4, 0.3, 1), fos); add(tri, 5, 0.6);
      const fsk = BK.fish(0.3, 0xe8e0c8); add(fsk, 4, -0.4); const fern = BK.leaf(0.5, 0.2, fos, 0); fern.rotation.z = 0.6; add(fern, 3, 1.0); const dino = new T3.Group(); for (let i = 0; i < 10; i++) { const v = new T3.Mesh(new T3.SphereGeometry(0.05, 8, 6), fos); v.position.set(i * 0.1 - 0.5, Math.sin(i * 0.5) * 0.08, 0); dino.add(v); } add(dino, 2, -0.2); const mam = BK.quad(0.25, 0xe8e0c8); add(mam, 1, 0.7); BK.shadow(g, true, true); },
    update(S, s, c, dt) { s.lay.forEach((m, i) => { m.position.z = i === +c.L ? 0.35 : 0; }); },
    overlay(ctx, s, c, S, B) { LAYERS.forEach((l, i) => BK.labc(S, B, -1.2, 3.5 - i * 0.62, 1.12, l[0] + " · " + l[1] + " Ma", i === +c.L ? "#ffd27a" : "#c9d6ee", 4, i === +c.L ? 11 : 9.5)); },
    hud: (s, c) => [{ title: LAYERS[c.L][0], lines: [["≈ " + LAYERS[c.L][1] + " million years ago: " + LAYERS[c.L][3], "#ffd27a", true], "Palaeontology: older (deeper) rocks hold simpler, mostly aquatic fossils.", "Other evidence: comparative anatomy (homologous limbs — arm, flipper, wing), comparative embryology, comparative biochemistry (similar proteins and DNA), geographical distribution, adaptive radiation.", "Mutation creates new variation for selection to act on."] }],
    readouts: (s, c) => [["Layer", LAYERS[c.L][0]], ["Age", LAYERS[c.L][1] + " Ma"]],
    draw: BK.fallback("Evidence of evolution", ["Fossils: deeper rock = older, simpler life", "Homologous limbs, embryology, biochemistry, distribution"]),
  });

  /* ===================== G-c / WA5-b  natural selection ===================== */
  function selScene(key, extra) { BK.def3d(key, Object.assign({
    label: "Photoreal 3D lab", env: "outdoor", cam: [[1.6, 2.2, 5.6], [1.2, 1.6, 0]], fov: 38,
    build(S, s, c) { s.key = ""; s.p = 0.1; s.gen = 0; s.hist = [[0, 0.1]]; s.acc = 0; },
    update(S, s, c, dt) { const T3 = T(), bg = extra.bg(c);
      if (s.key !== bg.k) { s.key = bg.k; const g = BK.group(S, s); s.trunk = new T3.Mesh(extra.geo ? extra.geo(T3) : new T3.CylinderGeometry(0.9, 1.0, 4.4, 40), new T3.MeshStandardMaterial({ map: BK.spotTex(bg.base, bg.spot, 600, 5), roughness: 0.95 })); s.trunk.position.y = 2.2; g.add(s.trunk); s.moths = []; for (let i = 0; i < 24; i++) { const m = BK.insect(0.32, 0x999999, { wings: true, wingCol: 0xcccccc, wingOp: 0.98, wingR: 0.28, antennae: false }); g.add(m); s.moths.push(m); } s.bird = BK.bird(0.8, 0x3a3a3a); g.add(s.bird); BK.shadow(g, true, true); }
      if (c.auto) { s.acc += dt; if (s.acc > 1.2) { s.acc = 0; const sd = extra.sel(c), w1 = 1 - sd.dark, w0 = 1 - sd.light; s.p = s.p * w1 / (s.p * w1 + (1 - s.p) * w0); s.p = Math.min(0.995, Math.max(0.005, s.p)); s.gen++; s.hist.push([s.gen, s.p]); if (s.hist.length > 60) s.hist.shift(); } }
      const dk = new (T().Color)(extra.dark), lt = new (T().Color)(extra.light); s.moths.forEach((m, i) => { const dark = i < Math.round(s.p * 24); const a = i * 0.9 + 0.3, y = 0.6 + (i % 8) * 0.48; if (extra.geo) { m.position.set(-2.0 + (i % 6) * 0.8, 0.7 + Math.floor(i / 6) * 0.9, 0.22); m.rotation.set(Math.PI / 2, 0, i * 0.7); } else { m.position.set(Math.cos(a) * 1.0, y, Math.sin(a) * 1.0); m.lookAt(V(Math.cos(a) * 3, y, Math.sin(a) * 3)); m.rotateY(-Math.PI / 2); m.rotateX(Math.PI / 2); } m.traverse((q) => { if (q.isMesh && q.material.opacity > 0.9) q.material.color.copy(dark ? dk : lt); }); });
      const t = S.t; s.bird.position.set(Math.cos(t * 0.8) * 2.2, 2.6 + Math.sin(t * 1.6) * 0.4, Math.sin(t * 0.8) * 2.2); s.bird.rotation.y = -t * 0.8 - Math.PI / 2; s.bird.wings.forEach((w, k) => (w.rotation.x = (k ? 1 : -1) * Math.sin(t * 8) * 0.6)); },
    overlay(ctx, s, c, S, B) { BK.graph(B, 14, 262, 260, 126, { title: extra.gtitle, x0: Math.max(0, s.gen - 59), x1: Math.max(60, s.gen + 1), y0: 0, y1: 1, series: [{ pts: s.hist, color: "#ffd27a" }], xl: "generation", yl: "freq" }); },
    draw: BK.fallback("Natural selection", ["Variation → over-production → struggle → survival of the fittest → inheritance", "Camouflaged forms survive predation and become common"]),
  }, extra.def)); }
  selScene("G-c", { bg: (c) => c.pol ? { k: "dark", base: "#2a2620", spot: "#4a4038" } : { k: "light", base: "#c8c4b0", spot: "#8a9a6a" }, dark: 0x2a2620, light: 0xe8e4d0, gtitle: "Frequency of dark moths",
    sel: (c) => c.pol ? { dark: 0.05, light: 0.35 } : { dark: 0.35, light: 0.05 },
    def: { title: "Theories of evolution", blurb: "Peppered moths on a tree trunk, hunted by birds. Pollution blackens the bark: watch the dark form spread over the generations by natural selection.",
      values: { pol: 1, auto: 1 }, controls: [{ type: "toggle", key: "pol", label: "Industrial pollution (soot on bark)" }, { type: "toggle", key: "auto", label: "Run generations" }],
      actions: [{ label: "↻ Restart (10% dark)", run: (s) => { s.p = 0.1; s.gen = 0; s.hist = [[0, 0.1]]; } }],
      hud: (s, c) => [{ title: "Darwin: natural selection", lines: [["Generation " + (s.gen || 0) + " · dark moths " + f((s.p || 0) * 100, 0) + "%", "#ffd27a", true], c.pol ? "Sooty bark: pale moths stand out and are eaten; dark moths survive and breed." : "Clean lichen-covered bark: dark moths stand out; pale moths survive.", "Darwin: variation, over-production, struggle for existence, survival of the fittest, inheritance → new species over time.", ["Lamarck: use and disuse, inheritance of acquired characters (e.g. giraffes stretching their necks) — rejected: acquired traits are not inherited.", "#7cb3ff"]] }],
      readouts: (s, c) => [["Generation", String(s.gen || 0)], ["Dark moths", f((s.p || 0) * 100, 0) + "%"]] } });
  selScene("WA5-b", { bg: (c) => ({ sand: { k: "sand", base: "#d8c08a", spot: "#b89a60" }, grass: { k: "grass", base: "#4f8a3a", spot: "#3a6a2a" }, bark: { k: "bark", base: "#5a4330", spot: "#3a2a1a" } }[c.bg]), dark: 0x4f8a3a, light: 0xd8c08a, gtitle: "Frequency of green prey",
    sel: (c) => c.bg === "grass" ? { dark: 0.05, light: 0.35 } : c.bg === "sand" ? { dark: 0.35, light: 0.05 } : { dark: 0.2, light: 0.2 },
    def: { title: "Structural adaptation and adaptive colouration", blurb: "Prey of two colours on sand, grass or bark backgrounds: predators remove the ones that stand out, so camouflage evolves.",
      values: { bg: "grass", auto: 1 }, controls: [{ type: "tabs", key: "bg", label: "Background", options: [["grass", "Grass"], ["sand", "Sand"], ["bark", "Bark"]] }, { type: "toggle", key: "auto", label: "Run generations" }],
      actions: [{ label: "↻ Restart", run: (s) => { s.p = 0.1; s.gen = 0; s.hist = [[0, 0.1]]; } }],
      hud: (s, c) => [{ title: "Adaptive colouration", lines: [["Green prey: " + f((s.p || 0) * 100, 0) + "% after " + (s.gen || 0) + " generations", "#ffd27a", true], "Camouflage (cryptic colouration): blending in — chameleon, grasshopper, nightjar.", "Warning colouration: bright colours advertise poison — some caterpillars, arrow-poison frogs.", "Mimicry: a harmless species copies a harmful one.", "Structural adaptations: for food (beaks, teeth), protection (spines, shells), mates (plumage), temperature (fur, blubber) and water conservation (thick cuticle, spines)."] }],
      readouts: (s, c) => [["Generation", String(s.gen || 0)], ["Green prey", f((s.p || 0) * 100, 0) + "%"]] },
    geo: (T3) => new T3.BoxGeometry(5, 4.4, 0.3) });
})();
