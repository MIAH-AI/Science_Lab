/* b3d-regional.js — photoreal labs for Section B (Ghana) and Section C (Nigeria, Sierra Leone, The Gambia, Liberia).
   New scenes plus re-uses of core labs with their own notes. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, W = MK.when, f = MK.fmt;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const tube = (pts, r, mat, seg = 60, rs = 12) => new (T().Mesh)(new (T().TubeGeometry)(new (T().CatmullRomCurve3)(pts), seg, r, rs), mat);
  const glass = () => window.P3D.mat.glass();
  const alias = (key, from, over) => { const base = MK.scenes[from]; if (base) MK.def(key, Object.assign({}, base, over)); };

  /* ---------- re-used labs with their own focus ---------- */
  alias("GH3-a", "A-c", { title: "Amoeba, Paramecium and Euglena", values: { org: "paramecium" }, controls: [{ type: "tabs", key: "org", label: "Organism", options: [["amoeba", "Amoeba"], ["paramecium", "Paramecium"], ["euglena", "Euglena"]] }],
    note: "Mount Paramecium in a drop of pond water with cotton fibres (or methyl cellulose) to slow it down. Life processes: nutrition, respiration (diffusion), excretion and osmoregulation (contractile vacuole), movement, sensitivity, reproduction (fission, conjugation)." });
  alias("GH4-a", "A-a", { title: "Diversity of living things", note: "Representative groups: bacteria, Amoeba, Rhizopus, moss, fern, flowering plant; Hydra, earthworm, insect, fish, toad, lizard, bird, mammal — learn one distinguishing feature of each." });
  alias("GH5-b", "S-c", { title: "Transport — the heartbeat", values: { hr: 72, sv: 70, ex: 0 }, note: "Heartbeat is myogenic: the SA node (pacemaker) in the right atrium sends an impulse over both atria, then the AV node passes it down the bundle of His to the ventricles. Exercise raises heart rate and stroke volume; pulse is felt at the wrist (radial artery)." });
  alias("GH5-c", "A-g", { title: "Cellular respiration in mammals", note: "Respirometer: small animal (or seeds) in a tube with soda lime to absorb CO₂; the coloured drop moves toward the organism as O₂ is used. RQ = CO₂ given out ÷ O₂ taken in (carbohydrate 1.0, fat 0.7, protein 0.9)." });
  alias("GH5-d", "S-a", { title: "Movement — muscles and skeletal tissues", values: { mode: "arm", ang: 70, load: 8 }, note: "Skeletal muscle is made of fibres containing actin and myosin filaments that slide over each other when the muscle contracts (needs ATP and Ca²⁺)." });
  alias("GH6-b", "S-d", { title: "Transport in flowering plants" });
  alias("GH6-c", "R-f", { title: "Reproduction and floral formulae", note: "Floral formula symbols: K calyx, C corolla, A androecium, G gynoecium; brackets = fused; ∞ = many; a line above or below G = inferior/superior ovary. Hibiscus: K5 C5 A(∞) G(5); Crotalaria (legume): K(5) C5 A(10) G1." });
  alias("WA1-c", "S-f", { title: "Diseases of the kidney and liver", values: { water: 2, salt: 1, disease: "neph" }, note: "Liver diseases: hepatitis (viral infection — jaundice; prevent with vaccine, safe blood and needles), cirrhosis (scarring, often alcohol). Kidney failure is treated by dialysis or transplant." });

  /* ===================== GH1-b  symmetry ===================== */
  BK.def3d("GH1-b", {
    label: "Photoreal 3D lab", title: "Body symmetry, sectioning and orientation",
    blurb: "A starfish (radial symmetry) and a fish (bilateral symmetry) with cutting planes. Name the anterior, posterior, dorsal and ventral surfaces and the type of section.",
    env: "studio", cam: [[1.0, 3.0, 7.6], [1.6, 0.9, 0]], fov: 38,
    values: { plane: "LS" },
    controls: [{ type: "tabs", key: "plane", label: "Section", options: [["LS", "Longitudinal (median)"], ["TS", "Transverse"], ["VS", "Vertical"]] }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); const sm = new T3.MeshPhysicalMaterial({ map: BK.spotTex("#e8743a", "#b84a1a", 200, 5), roughness: 0.6, clearcoat: 0.4 }); const star = new T3.Group(); for (let i = 0; i < 5; i++) { const arm = new T3.Mesh(new T3.ConeGeometry(0.28, 1.4, 16), sm); arm.rotation.z = -Math.PI / 2; arm.scale.set(1, 1, 0.45); arm.position.x = 0.7; const piv = new T3.Group(); piv.rotation.y = i / 5 * Math.PI * 2; piv.add(arm); star.add(piv); } star.add(new T3.Mesh(new T3.SphereGeometry(0.38, 24, 16), sm)); star.scale.set(0.75, 0.45, 0.75); star.position.set(-1.9, 0.2, 0.4); g.add(star); s.star = star;
      const fish = BK.fish(1.05, 0x7d8a6a); fish.rotation.y = Math.PI; fish.position.set(0.8, 1.0, 0); g.add(fish); s.fish = fish;
      s.plane = new T3.Mesh(new T3.PlaneGeometry(3.4, 2.4), new T3.MeshPhysicalMaterial({ color: 0x7cb3ff, transparent: true, opacity: 0.28, side: T3.DoubleSide, depthWrite: false })); g.add(s.plane); s.splane = new T3.Mesh(new T3.PlaneGeometry(2.6, 1.2), s.plane.material); g.add(s.splane); BK.shadow(g, true, true); },
    update(S, s, c, dt) { const p = s.plane; p.position.set(0.8, 1.0, 0); p.rotation.set(0, 0, 0); if (c.plane === "TS") { p.rotation.y = Math.PI / 2; p.scale.set(0.55, 0.9, 1); } else if (c.plane === "VS") { p.rotation.x = Math.PI / 2; p.scale.set(1, 0.4, 1); } else p.scale.set(1, 0.9, 1);
      s.splane.position.set(-1.9, 0.5, 0.4); s.splane.rotation.set(0, S.t * 0.3, 0); s.star.rotation.y = S.t * 0.2; },
    overlay(ctx, s, c, S, B) { BK.labc(S, B, -0.2, 1.55, 0, "Anterior (head)", "#ffd27a"); BK.labc(S, B, 1.9, 1.55, 0, "Posterior (tail)", "#ffd27a"); BK.labc(S, B, 0.8, 1.75, 0, "Dorsal", "#5bd68c", -6); BK.labc(S, B, 0.8, 0.3, 0, "Ventral", "#5bd68c"); BK.labc(S, B, -1.9, -0.25, 0.4, "Starfish — radial symmetry", "#ff9fb0"); },
    hud: (s, c) => [{ title: "Symmetry and sections", lines: ["Bilateral symmetry: only ONE plane (median) gives mirror halves — fish, insects, mammals.", "Radial symmetry: any plane through the centre gives similar halves — starfish, Hydra, jellyfish.", ["Section shown: " + { LS: "longitudinal section (L.S.) — along the length", TS: "transverse section (T.S.) — across the body", VS: "vertical section (V.S.) — top to bottom" }[c.plane], "#7cb3ff", true], "Views: anterior/posterior, dorsal/ventral, lateral (side)."] }],
    draw: BK.fallback("Symmetry", ["Bilateral: one plane of symmetry (fish)", "Radial: many planes (starfish)", "L.S. along the length, T.S. across"]),
  });

  /* ===================== GH1-c / WA1-a  microscope ===================== */
  const SPEC = { onion: ["Onion epidermis", 0.25, "rectangular cells in rows, wall, nucleus"], cheek: ["Cheek cells", 0.06, "flat irregular cells, central nucleus"], cork: ["Cork (Hooke, 1665)", 0.035, "empty box-like dead cells"], blood: ["Blood smear", 0.0075, "biconcave red cells, a few white cells"], para: ["Paramecium", 0.2, "slipper-shaped, cilia"] };
  function micro(key, extra) { BK.def3d(key, Object.assign({
    label: "Photoreal 3D microscope", env: "lab", cam: [[2.0, 2.6, 5.4], [0.8, 1.4, 0]], fov: 38,
    build(S, s, c) { const T3 = T(), g = BK.group(S, s), body = window.P3D.mat.paint(0xe8ecf2), dark = window.P3D.mat.paint(0x2a2f3a), chrome = window.P3D.mat.chrome();
      const base = new T3.Mesh(new T3.BoxGeometry(1.2, 0.18, 1.4), dark); base.position.set(0, 0.09, 0); g.add(base); const arm = tube([V(0, 0.2, -0.5), V(0, 1.2, -0.55), V(0, 2.0, -0.35)], 0.1, body); g.add(arm);
      const stage = new T3.Mesh(new T3.BoxGeometry(0.9, 0.05, 0.9), dark); stage.position.set(0, 1.05, 0); g.add(stage); const slide = new T3.Mesh(new T3.BoxGeometry(0.75, 0.01, 0.25), window.P3D.mat.glass(0xf6fbff)); slide.position.set(0, 1.085, 0); g.add(slide); for (const sd of [-1, 1]) { const clip = new T3.Mesh(new T3.BoxGeometry(0.06, 0.01, 0.28), chrome); clip.position.set(sd * 0.3, 1.095, 0); g.add(clip); }
      const tb = new T3.Mesh(new T3.CylinderGeometry(0.11, 0.11, 0.8, 24), body); tb.position.set(0, 2.0, -0.1); tb.rotation.x = 0.0; g.add(tb); const ep = new T3.Mesh(new T3.CylinderGeometry(0.07, 0.07, 0.3, 20), dark); ep.position.set(0, 2.5, -0.1); g.add(ep);
      s.turret = new T3.Group(); s.turret.position.set(0, 1.55, -0.05); for (let i = 0; i < 3; i++) { const ob = new T3.Mesh(new T3.CylinderGeometry(0.045, 0.03, 0.25 + i * 0.06, 16), chrome); const a = i / 3 * 6.28; ob.position.set(Math.sin(a) * 0.12, -0.15 - i * 0.03, Math.cos(a) * 0.12); s.turret.add(ob); } const nose = new T3.Mesh(new T3.CylinderGeometry(0.16, 0.13, 0.08, 24), body); s.turret.add(nose); g.add(s.turret);
      for (const sd of [-1, 1]) { const kn = new T3.Mesh(new T3.CylinderGeometry(0.15, 0.15, 0.08, 24), dark); kn.rotation.z = Math.PI / 2; kn.position.set(sd * 0.18, 1.2, -0.5); g.add(kn); } const lamp = window.P3D.S.mk.bulb(0xfff6e0, 4); lamp.position.set(0, 0.45, 0); lamp.scale.setScalar(0.35); g.add(lamp); BK.shadow(g, true, true); },
    update(S, s, c, dt) { const idx = [4, 10, 40].indexOf(+c.obj); s.turret.rotation.y += ((-idx / 3 * 6.28) - s.turret.rotation.y) * dt * 4; },
    overlay(ctx, s, c, S, B) { const mag = 10 * c.obj, fov = 18 / c.obj, cx = 120, cy = 300, R = 88; ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.3); ctx.fillStyle = "#f6f0e0"; ctx.fill(); ctx.clip(); const sp = SPEC[c.spec], px = sp[1] / fov * 2 * R;
      for (let y = -R; y < R + px; y += px * (c.spec === "onion" ? 0.45 : 1)) for (let x = -R; x < R + px; x += px) { if (c.spec === "onion") { ctx.strokeStyle = "#a89060"; ctx.lineWidth = 1.2; ctx.strokeRect(cx + x + ((y / px) % 2 ? px * 0.3 : 0), cy + y, px, px * 0.45); ctx.fillStyle = "#8a6ab8"; ctx.beginPath(); ctx.arc(cx + x + px * 0.5, cy + y + px * 0.22, Math.max(1, px * 0.06), 0, 6.3); ctx.fill(); }
        else if (c.spec === "cork") { ctx.strokeStyle = "#8a6a3a"; ctx.lineWidth = Math.max(1, px * 0.08); ctx.strokeRect(cx + x, cy + y, px * 0.95, px * 0.75); }
        else if (c.spec === "blood") { ctx.fillStyle = "#e86a6a"; ctx.beginPath(); ctx.arc(cx + x + (y % 3), cy + y, px * 0.45, 0, 6.3); ctx.fill(); ctx.fillStyle = "#f6a0a0"; ctx.beginPath(); ctx.arc(cx + x + (y % 3), cy + y, px * 0.18, 0, 6.3); ctx.fill(); }
        else if (c.spec === "cheek" && ((x * 7 + y * 3) / px) % 3 < 1) { ctx.fillStyle = "rgba(240,190,180,.7)"; ctx.beginPath(); ctx.ellipse(cx + x, cy + y, px * 0.6, px * 0.45, x, 0, 6.3); ctx.fill(); ctx.fillStyle = "#6a4ab8"; ctx.beginPath(); ctx.arc(cx + x, cy + y, px * 0.1, 0, 6.3); ctx.fill(); }
        else if (c.spec === "para" && Math.abs(x) < px && Math.abs(y) < px) { ctx.fillStyle = "rgba(160,200,220,.7)"; ctx.beginPath(); ctx.ellipse(cx, cy, px * 0.6, px * 0.22, 0.3, 0, 6.3); ctx.fill(); } }
      ctx.restore(); ctx.strokeStyle = "#111"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.3); ctx.stroke(); B.pill("×" + mag + " · field " + f(fov, 2) + " mm", cx, cy - R - 8, "#ffd27a", 10.5, "center"); },
    hud: (s, c) => { const mag = 10 * c.obj; return extra.hudx ? extra.hudx(s, c) : [{ title: "Compound light microscope", lines: [["Total magnification = eyepiece × objective = 10 × " + c.obj + " = ×" + mag, "#ffd27a", true], ["Field of view ≈ " + f(18 / c.obj, 2) + " mm; one " + SPEC[c.spec][0] + " cell ≈ " + f(SPEC[c.spec][1] * 1000, 0) + " μm", "#e8f1ff"], ["Drawing magnification = drawing size ÷ actual size: a " + c.draw + " mm drawing of a " + f(SPEC[c.spec][1] * 1000, 0) + " μm cell = ×" + f(c.draw / SPEC[c.spec][1], 0), "#5bd68c"], "Resolution: light ≈ 0.2 μm; electron microscope ≈ 0.2 nm (shows organelles).", "Start on low power, focus with the coarse knob, then switch to high power and use only the fine knob."] }]; },
    readouts: (s, c) => [["Magnification", "×" + 10 * c.obj], ["Specimen", SPEC[c.spec][0]]],
    draw: BK.fallback("The microscope", (s, c) => ["Magnification = eyepiece × objective = ×" + 10 * c.obj, "Drawing magnification = drawing size ÷ actual size"]),
  }, extra.def)); }
  micro("GH1-c", { def: { title: "The microscope and biological drawings", blurb: "A compound microscope on the bench with the view through the eyepiece. Switch objectives, choose a slide and work out the magnification of a drawing.",
    values: { obj: 10, spec: "onion", draw: 60 }, controls: [{ type: "tabs", key: "obj", label: "Objective", options: [[4, "×4 (low)"], [10, "×10 (medium)"], [40, "×40 (high)"]] }, { type: "select", key: "spec", label: "Slide", options: Object.keys(SPEC).map((k) => [k, SPEC[k][0]]) }, { key: "draw", label: "Length of your drawing", min: 20, max: 120, unit: "mm" }],
    table: () => MK.table(["Part", "Function"], [["Eyepiece", "Magnifies (×10)"], ["Objectives", "×4, ×10, ×40 lenses"], ["Coarse / fine focus", "Moves the stage or tube to focus"], ["Stage and clips", "Hold the slide"], ["Condenser, diaphragm, lamp/mirror", "Light and its amount"]]),
    note: "Biological drawings: pencil, clear single lines, no shading, ruled label lines, a title and the magnification (e.g. ×200)." } });
  micro("WA1-a", { hudx: (s, c) => [{ title: "Cell theory", lines: [["Hooke (1665) saw 'cells' in cork — empty walls of dead cells.", "#ffd27a"], "Dujardin (1835): living 'sarcode' (cytoplasm).", "Schleiden (1838): all plants are made of cells. Schwann (1839): all animals too.", "Virchow (1855): all cells come from pre-existing cells.", ["Cell theory: all living things are made of cells; the cell is the basic unit of structure and function; cells arise from existing cells.", "#5bd68c"]] }],
    def: { title: "Cell theory", blurb: "Look at cork the way Robert Hooke did in 1665, then at living onion and cheek cells — the observations that built the cell theory.", values: { obj: 40, spec: "cork", draw: 60 }, controls: [{ type: "tabs", key: "obj", label: "Objective", options: [[4, "×4"], [10, "×10"], [40, "×40"]] }, { type: "select", key: "spec", label: "Slide", options: Object.keys(SPEC).map((k) => [k, SPEC[k][0]]) }] } });

  /* ===================== GH2-a  endo/exocytosis ===================== */
  BK.def3d("GH2-a", {
    label: "Photoreal 3D lab", title: "Endocytosis and exocytosis",
    blurb: "A white blood cell engulfs a bacterium (phagocytosis), sips droplets (pinocytosis), and releases a secretory vesicle at its surface (exocytosis).",
    env: "micro", cam: [[1.4, 1.6, 7.0], [1.3, 0.4, 0]], fov: 38,
    values: { mode: "phago" },
    controls: [{ type: "tabs", key: "mode", label: "Process", options: [["phago", "Phagocytosis"], ["pino", "Pinocytosis"], ["exo", "Exocytosis"]] }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); const geo = new T3.SphereGeometry(1.8, 72, 48); s.base = geo.attributes.position.array.slice(); s.cell = new T3.Mesh(geo, BK.mat.membrane(0xd8e8ff, 0.4)); g.add(s.cell); const n = new T3.Mesh(BK.blob(0.5, 4, 0.2, 32, 1.3, 0.9, 1), BK.mat.organelle(0x7b6ad6, 0.1)); n.position.set(-0.6, -0.3, 0); g.add(n);
      s.p = new T3.Mesh(new T3.CapsuleGeometry(0.15, 0.4, 6, 12), new T3.MeshPhysicalMaterial({ color: 0x9fcf5a, roughness: 0.3, clearcoat: 1 })); g.add(s.p); s.ves = new T3.Mesh(new T3.SphereGeometry(0.32, 24, 16), BK.mat.membrane(0xd8e8ff, 0.5)); g.add(s.ves); s.t = 0; },
    update(S, s, c, dt) { if (s.lm !== c.mode) { s.lm = c.mode; s.t = 0; } s.t = (s.t + dt * 0.18) % 1.2; const u = Math.min(1, s.t); const pa = s.cell.geometry.attributes.position, b = s.base, dir = V(1, 0.3, 0.4).normalize();
      const inv = c.mode === "exo" ? Math.max(0, 1 - Math.abs(u - 0.6) * 3) * -0.35 : (u < 0.55 ? u / 0.55 : Math.max(0, 1 - (u - 0.55) * 4)); const wid = c.mode === "pino" ? 0.22 : 0.45;
      for (let i = 0; i < pa.count; i++) { const v = V(b[i * 3], b[i * 3 + 1], b[i * 3 + 2]), n = v.clone().normalize(), d = n.dot(dir); let k = 1; if (d > 1 - wid) { const w = (d - (1 - wid)) / wid; k = 1 - inv * 0.45 * Math.sin(w * Math.PI) * (c.mode === "phago" ? -1 : 1) - inv * 0.25 * w; } pa.setXYZ(i, v.x * k, v.y * k, v.z * k); } pa.needsUpdate = true; s.cell.geometry.computeVertexNormals();
      const out = dir.clone().multiplyScalar(2.9), inn = dir.clone().multiplyScalar(0.9); if (c.mode === "exo") { s.ves.position.copy(inn.clone().lerp(dir.clone().multiplyScalar(1.75), Math.min(1, u * 1.6))); s.ves.visible = u < 0.7; s.p.position.copy(dir.clone().multiplyScalar(1.8 + Math.max(0, u - 0.6) * 2)); s.p.visible = u > 0.55; s.p.scale.setScalar(0.5); }
      else { s.p.visible = true; s.p.scale.setScalar(c.mode === "pino" ? 0.35 : 1); s.p.position.copy(out.clone().lerp(inn, Math.min(1, u * 1.1))); s.ves.visible = u > 0.55; s.ves.position.copy(s.p.position); s.ves.scale.setScalar(c.mode === "pino" ? 0.45 : 1); } s.p.rotation.z += dt; },
    hud: (s, c) => [{ title: { phago: "Phagocytosis ('cell eating')", pino: "Pinocytosis ('cell drinking')", exo: "Exocytosis" }[c.mode], lines: [{ phago: "The membrane flows around a large particle (bacterium) and pinches off a food vacuole; lysosomes then digest it. Phagocytes and Amoeba.", pino: "Tiny infoldings take in droplets of fluid with dissolved substances.", exo: "A vesicle (from the Golgi body) fuses with the membrane and releases its contents — enzymes, hormones (insulin), mucus." }[c.mode], "—", ["Both are active processes: they need energy (ATP) and a flexible membrane.", "#ffd27a"]] }],
    draw: BK.fallback("Endocytosis and exocytosis", ["Phagocytosis: engulf solids", "Pinocytosis: take in liquid droplets", "Exocytosis: vesicles release substances"]),
  });

  /* ===================== GH3-b  Spirogyra & Rhizopus ===================== */
  BK.def3d("GH3-b", {
    label: "Photoreal 3D lab", title: "Spirogyra and Rhizopus",
    blurb: "Bread mould (Rhizopus) spreading its hyphae, stolons and black sporangia over a slice of bread; and two Spirogyra filaments joined by conjugation tubes.",
    env: "lab", cam: [[0.4, 2.0, 3.8], [0.9, 0.5, 0]], fov: 38,
    values: { mode: "rhiz", day: 3 },
    controls: [{ type: "tabs", key: "mode", label: "Organism", options: [["rhiz", "Rhizopus on bread"], ["conj", "Spirogyra conjugation"]] }, { key: "day", label: "Time", min: 0, max: 5, step: 0.1, unit: "days" }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) { const T3 = T(), key = c.mode + Math.round(c.day * 5);
      if (s.key !== key) { s.key = key; const g = BK.group(S, s); const k = c.day / 5;
        if (c.mode === "rhiz") { const bread = new T3.Mesh(new T3.BoxGeometry(2.6, 0.3, 2.0), new T3.MeshStandardMaterial({ map: BK.spotTex("#e8d4a0", "#c8a870", 500, 3), roughness: 0.95 })); bread.position.y = 0.3; g.add(bread); const crust = new T3.Mesh(new T3.BoxGeometry(2.7, 0.28, 2.1), new T3.MeshStandardMaterial({ color: 0x8a5a2a, roughness: 0.8 })); crust.position.y = 0.28; g.add(crust); const rr = BK.rng(5), hm = new T3.MeshStandardMaterial({ color: 0xf2f2ea, roughness: 0.8, transparent: true, opacity: 0.85 }), sm = new T3.MeshPhysicalMaterial({ color: 0x1a1a1a, roughness: 0.6 });
            const fz = new T3.MeshStandardMaterial({ map: BK.spotTex("#e8e8e0", "#9a9a92", 300, 3), roughness: 1, transparent: true, opacity: 0.75, depthWrite: false }); for (let i = 0; i < 6; i++) { const r = 0.15 + 0.5 * k * (0.6 + rr() * 0.6); if (k < 0.05) break; const pt = new T3.Mesh(BK.blob(r, i + 2, 0.25, 24, 1, 0.12, 1), fz); pt.position.set((rr() - 0.5) * 1.6, 0.47, (rr() - 0.5) * 1.1); g.add(pt); }
            const n = Math.round(70 * k); for (let i = 0; i < n; i++) { const x = (rr() - 0.5) * 2.0, z = (rr() - 0.5) * 1.5; g.add(tube([V(x, 0.46, z), V(x + (rr() - 0.5) * 0.4, 0.52, z + (rr() - 0.5) * 0.4), V(x + (rr() - 0.5) * 0.7, 0.46, z + (rr() - 0.5) * 0.7)], 0.01, hm, 12, 4)); if (i % 2 === 0 && k > 0.3) { const h = 0.12 + rr() * 0.22; g.add(tube([V(x, 0.46, z), V(x + 0.01, 0.46 + h, z)], 0.009, hm, 4, 4)); const sp = new T3.Mesh(new T3.SphereGeometry(0.035 + 0.025 * k, 14, 10), sm); sp.position.set(x + 0.01, 0.46 + h, z); g.add(sp); } } }
        else { const wall = BK.mat.membrane(0xcff2c0, 0.35), chl = BK.mat.organelle(0x2c9a34, 0.15); for (const z of [-0.6, 0.6]) for (let i = 0; i < 4; i++) { const cx = -2.4 + i * 1.6; const w = new T3.Mesh(new T3.CylinderGeometry(0.4, 0.4, 1.5, 24, 1, true), wall); w.rotation.z = Math.PI / 2; w.position.set(cx, 0.8, z); g.add(w); const done = z > 0 && k > 0.5; if (!done) { const pts = []; for (let j = 0; j <= 40; j++) { const u = j / 40, a = u * 18; pts.push(V(cx - 0.7 + u * 1.4, 0.8 + Math.cos(a) * 0.32 * (z < 0 && k > 0.6 ? 0.6 : 1), z + Math.sin(a) * 0.32)); } g.add(tube(pts, 0.05, chl, 80, 6)); } if (z < 0 && k > 0.6) { const zy = new T3.Mesh(new T3.SphereGeometry(0.25, 20, 14), new T3.MeshPhysicalMaterial({ color: 0x3a5a2a, roughness: 0.4 })); zy.position.set(cx, 0.8, z); g.add(zy); } if (z > 0 && k > 0.2) { const ct = new T3.Mesh(new T3.CylinderGeometry(0.1, 0.1, 0.8 * Math.min(1, k * 2), 12), wall); ct.rotation.x = Math.PI / 2; ct.position.set(cx, 0.8, 0); g.add(ct); } } }
        BK.shadow(g, true, true); } },
    hud: (s, c) => c.mode === "rhiz" ? [{ title: "Rhizopus (bread mould)", lines: ["Hyphae (white threads) form a mycelium; stolons spread, rhizoids anchor and secrete enzymes.", "Saprophytic: extracellular digestion of the starch in bread.", ["Asexual: black sporangia release thousands of spores. Sexual: conjugation of + and − hyphae → zygospore.", "#ffd27a"], "Grows best on moist bread kept warm and dark."] }]
      : [{ title: "Spirogyra — conjugation (sexual)", lines: ["Two filaments lie side by side; conjugation tubes form between opposite cells.", "Contents of one cell (male) flow through the tube and fuse with the other (female) → zygospore.", ["Zygospore survives bad conditions, then undergoes meiosis to form a new filament.", "#ffd27a"], "Asexual reproduction: fragmentation of the filament."] }],
    draw: BK.fallback("Spirogyra and Rhizopus", ["Rhizopus: hyphae, stolons, rhizoids, sporangia; saprophytic", "Spirogyra: spiral chloroplasts; conjugation → zygospore"]),
  });

  /* ===================== GH3-c  moss & fern ===================== */
  BK.def3d("GH3-c", {
    label: "Photoreal 3D lab", title: "Mosses and ferns",
    blurb: "A moss cushion with spore capsules on stalks, and a fern frond with brown sori beneath its leaflets. Follow alternation of generations.",
    env: "outdoor", cam: [[0.6, 2.4, 5.0], [1.0, 0.7, 0]], fov: 38,
    values: { sp: "fern" },
    controls: [{ type: "tabs", key: "sp", label: "Plant", options: [["moss", "Moss"], ["fern", "Fern"]] }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) { const T3 = T();
      if (s.key !== c.sp) { s.key = c.sp; const g = BK.group(S, s); const rock = new T3.Mesh(BK.blob(0.9, 3, 0.2, 32, 1.4, 0.5, 1), new T3.MeshStandardMaterial({ map: BK.spotTex("#6a6a62", "#4a5a3a", 200, 6), roughness: 0.95 })); rock.position.set(c.sp === "moss" ? 0 : -1.4, 0.1, -0.4); if (c.sp !== "moss") rock.scale.setScalar(0.5); g.add(rock);
        if (c.sp === "moss") { const lm = new T3.MeshStandardMaterial({ color: 0x4a8a2a, roughness: 0.8, side: T3.DoubleSide }), rr = BK.rng(3); for (let i = 0; i < 160; i++) { const a = rr() * 6.3, r = Math.sqrt(rr()) * 1.0, x = Math.cos(a) * r * 1.3, z = Math.sin(a) * r; const st = new T3.Group(); for (let k = 0; k < 5; k++) { const lf = new T3.Mesh(new T3.ConeGeometry(0.03, 0.09, 4), lm); lf.position.y = k * 0.04; lf.rotation.set(0.8, k * 1.3, 0); st.add(lf); } st.position.set(x, 0.42 - r * 0.25, z); g.add(st); if (i % 9 === 0) { const se = tube([V(x, 0.6 - r * 0.25, z), V(x + 0.02, 0.95 - r * 0.25, z)], 0.006, new T3.MeshStandardMaterial({ color: 0xb8742a }), 6, 4); g.add(se); const cap = new T3.Mesh(new T3.CapsuleGeometry(0.02, 0.05, 4, 8), new T3.MeshPhysicalMaterial({ color: 0x8a5a2a, roughness: 0.5 })); cap.position.set(x + 0.02, 0.98 - r * 0.25, z); cap.rotation.z = 0.6; g.add(cap); } } }
        else { const lm = BK.mat.leaf("#3f8a2f", "#7fb85a"), sori = new T3.MeshStandardMaterial({ color: 0x8a4a1a, roughness: 0.8 }), rm = new T3.MeshStandardMaterial({ color: 0x5a7a2a });
          for (let fr = 0; fr < 5; fr++) { const F = new T3.Group(), L = 1.5 + (fr % 2) * 0.3, rach = []; for (let i = 0; i <= 20; i++) { const u = i / 20; rach.push(V(u * L, Math.sin(u * Math.PI * 0.75) * 0.9 * L * 0.7, 0)); } F.add(tube(rach, 0.018, rm, 40, 6));
            for (let i = 2; i < 20; i++) for (const sd of [-1, 1]) { const p = rach[i], pl = 0.42 * Math.sin(i / 20 * Math.PI) + 0.05; const lf = BK.leaf(pl, 0.11, lm, 0.1); lf.position.copy(p); lf.rotation.set(-Math.PI / 2 * sd * 0.55, 0, -0.35); F.add(lf); if (fr === 0) for (let k = 1; k < 4; k++) { const so = new T3.Mesh(new T3.SphereGeometry(0.014, 6, 5), sori); so.position.copy(p).add(V(0.02, -0.015, sd * pl * k / 4.5)); F.add(so); } }
            F.position.set(0.5, 0.2, 0.5); F.rotation.y = -0.4 + fr * 1.26 + (fr === 0 ? 0.5 : 0); g.add(F); }
          for (let r2 = 0; r2 < 8; r2++) g.add(tube([V(0.5, 0.2, 0.5), V(0.5 + Math.cos(r2) * 0.3, 0.05, 0.5 + Math.sin(r2) * 0.3), V(0.5 + Math.cos(r2) * 0.5, 0.0, 0.5 + Math.sin(r2) * 0.5)], 0.01, new T3.MeshStandardMaterial({ color: 0x4a3a20 }), 10, 4)); }
        BK.shadow(g, true, true); } s.g.rotation.y = Math.sin(S.t * 0.3) * 0.3; },
    hud: (s, c) => [{ title: c.sp === "moss" ? "Moss (Bryophyta)" : "Fern (Filicinophyta)", lines: [...(c.sp === "moss" ? ["Main plant = gametophyte (n): simple leaves, rhizoids, no vascular tissue.", "Sporophyte (2n) grows on it: seta + capsule releasing spores.", "Needs water for sperm to swim to the egg."] : ["Main plant = sporophyte (2n): roots, rhizome, fronds, vascular tissue.", "Sori under the leaflets release spores → tiny heart-shaped prothallus (gametophyte, n).", "Water needed for fertilisation on the prothallus."]), "—", ["Alternation of generations: gametophyte (n) → gametes → zygote → sporophyte (2n) → spores by meiosis → gametophyte.", "#ffd27a"]] }],
    draw: BK.fallback("Mosses and ferns", ["Moss: gametophyte dominant", "Fern: sporophyte dominant (sori under leaflets)", "Alternation of generations"]),
  });

  /* ===================== GH5-a  organs of a mammal ===================== */
  const SYSN = { all: "All organs", digestive: "Digestive", respiratory: "Respiratory", circulatory: "Circulatory", excretory: "Excretory" };
  const ORG_LABELS = ["trachea", "lungR", "heart", "diaphragm", "liver", "stomach", "spleen", "gall", "pancreas", "largeInt", "smallInt", "kidneyL", "bladder"];
  BK.def3d("GH5-a", {
    label: "Realistic 3D lab", title: "Internal organs of a mammal",
    blurb: "A see-through body with every organ of the thorax and abdomen in its real place. Tap any organ to isolate it, show one body system at a time, then play Find the Organ.",
    env: "clinic", cam: [[0.85, 2.12, 3.35], [0.5, 2.02, 0]], fov: 34, free: true,
    values: { sys: "all", o: "", quiz: 0, beat: 1 },
    controls: [{ type: "tabs", key: "sys", label: "Body system", options: Object.keys(SYSN).map((k) => [k, SYSN[k]]) },
      { type: "select", key: "o", label: "Go to organ", options: [["", "Tap the model, or choose…"]].concat(window.BA.TRUNK.map((k) => [k, window.BA.INFO[k][0]])) },
      { type: "toggle", key: "quiz", label: "Game: find the organ" }, { type: "toggle", key: "beat", label: "Heartbeat and breathing" }],
    onChange(s, c, k) { const BA = window.BA; if (!s.aF) return; if (k === "o") { BA.focus.select(s, c.o || null); if (c.o && c.sys !== "all" && !BA.SYS[c.sys].includes(c.o)) c.sys = "all"; } if (k === "quiz") BA.focus.setQuiz(s, c.quiz); if (k === "sys") { s.aF.sel = null; if (c.quiz) { s.applied = ""; } } },
    syncAll: true,
    build(S, s, c) { const BA = window.BA, g = BK.group(S, s); s.body = BA.body({ dark: S.clinicDark }); g.add(s.body); const O = BA.organs(); g.add(O.group); s.aparts = O.parts; s.applied = ""; s.ph = 0; s.br = 0; BA.focus.init(S, s); if (c.quiz) BA.focus.setQuiz(s, 1); },
    update(S, s, c, dt) { const BA = window.BA, P = s.aparts;
      if (s.applied !== c.sys) { s.applied = c.sys; Object.values(P).forEach((p) => { p.hidden = c.sys !== "all" && !BA.SYS[c.sys].includes(p.id); p.noQuiz = c.sys === "all" && ["aorta", "cava", "ureter", "gullet"].includes(p.id); }); if (s.aF.quiz) BA.focus.next(s); }
      if (c.beat) { s.ph = (s.ph + dt * 1.2) % 1; s.br += dt * 1.6; const p = s.ph, ve = p > 0.15 && p < 0.5 ? Math.sin((p - 0.15) / 0.35 * Math.PI) : 0, at = p < 0.15 ? Math.sin(p / 0.15 * Math.PI) : 0; const h = P.heart.obj; h.vent.scale.setScalar(1 - 0.07 * ve); h.atria.scale.setScalar(1 - 0.1 * at);
        const b = 0.5 + 0.5 * Math.sin(s.br); for (const id of ["lungR", "lungL"]) { const m = P[id].meshes[0]; m.scale.set(1 + 0.035 * b, 1 + 0.02 * b, 1 + 0.06 * b); m.position.set(-(id === "lungR" ? -0.19 : 0.19) * 0.035 * b, -2.39 * 0.02 * b + 0.012 * b, 0); } P.diaphragm.meshes[0].scale.y = 1 - 0.03 * b; P.diaphragm.meshes[0].position.y = 1.76 * 0.03 * b - 0.01 * b; }
      BA.focus.update(S, s, dt); },
    overlay(ctx, s, c, S, B) { window.BA.focus.overlay(S, s, B, { labels: ORG_LABELS }); },
    hud: (s, c) => window.BA.focus.card(s, [{ title: SYSN[c.sys] + (c.sys === "all" ? "" : " system"), lines: [c.sys === "digestive" ? "Mouth → oesophagus → stomach → small intestine → large intestine. Liver, gall bladder and pancreas add their juices." : c.sys === "respiratory" ? "Air: trachea → bronchi → lungs. The diaphragm and ribs change the volume of the thorax." : c.sys === "circulatory" ? "The heart pumps blood out through the aorta; the venae cavae bring it back. The spleen filters it." : c.sys === "excretory" ? "Kidneys filter urea from the blood; ureters carry urine to the bladder." : "Thorax (inside the ribs): heart, lungs, trachea, oesophagus.", c.sys === "all" ? "Abdomen (below the diaphragm): liver, stomach, intestines, pancreas, spleen, kidneys, bladder." : "—", ["Front view: the liver is on the body's right, which is your left.", "#7cb3ff"], ["Dissection of a rat shows the same layout: pin it on its back and cut along the mid-ventral line.", "#a9b6d3"]] }]),
    readouts: (s, c) => { const F = s.aF, P = s.aparts || {}; return F && F.quiz ? [["Score", F.score + " / " + F.tries]] : [["Selected", F && F.sel && P[F.sel] ? P[F.sel].name : "none"], ["Showing", SYSN[c.sys]]]; },
    table: () => MK.table(["Organ", "System", "Main function"], window.BA.TRUNK.map((k) => { const i = window.BA.INFO[k]; return [i[0], i[1], i[2]]; })),
    note: "Be able to draw and label the organs in position, and say which lie in the thorax and which in the abdomen. This is a simplified teaching model: sizes and positions are close to a real adult but not exact.",
    draw: BK.fallback("Mammal organs", ["Thorax: heart, lungs, trachea, oesophagus", "Abdomen: liver, stomach, intestines, pancreas, spleen, kidneys, bladder", "The diaphragm separates thorax from abdomen"]),
  });

  /* ===================== GH6-a  monocot vs dicot ===================== */
  function parTex() { const c = BK.cv(128, 512), g = c.getContext("2d"); g.fillStyle = "#4f8a2f"; g.fillRect(0, 0, 128, 512); g.strokeStyle = "rgba(190,230,150,.7)"; g.lineWidth = 2; for (let x = 8; x < 128; x += 12) { g.beginPath(); g.moveTo(x, 512); g.lineTo(64 + (x - 64) * 0.2, 0); g.stroke(); } return BK.tex(c); }
  BK.def3d("GH6-a", {
    label: "Photoreal 3D lab", title: "Monocotyledons and dicotyledons",
    blurb: "A maize plant (monocot) and a bean plant (dicot) lifted from the soil to show their roots, stems and leaves side by side.",
    env: "lab", cam: [[0.6, 2.4, 7.2], [1.1, 1.5, 0]], fov: 38,
    values: { part: "leaf" },
    controls: [{ type: "tabs", key: "part", label: "Compare", options: [["leaf", "Leaves"], ["root", "Roots"], ["stem", "Stem T.S."], ["seed", "Seeds"]] }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s), rootM = new T3.MeshStandardMaterial({ color: 0xf2e8cc, roughness: 0.6 }), Y = 1.0, Z = 0.62;
      const box = new T3.Mesh(new T3.BoxGeometry(5.0, 1.0, 1.2), BK.mat.soil([3, 1])); box.position.set(0, 0.5, 0); g.add(box); const front = new T3.Mesh(new T3.PlaneGeometry(5.0, 1.0), window.P3D.mat.glass()); front.position.set(0, 0.5, 0.64); front.renderOrder = 3; g.add(front);
      const mz = new T3.Group(); mz.add(tube([V(0, 0, 0), V(0, 2.0, 0)], 0.05, new T3.MeshPhysicalMaterial({ color: 0x8aaa4a, roughness: 0.5 }))); const pm = new T3.MeshStandardMaterial({ map: parTex(), roughness: 0.6, side: T3.DoubleSide }); for (let i = 0; i < 7; i++) { const lf = BK.leaf(1.0 - i * 0.06, 0.13, pm, 0.5); lf.rotation.x = -0.95; const pv = new T3.Group(); pv.position.y = 0.2 + i * 0.25; pv.rotation.y = (i % 2 ? 1 : -1) * Math.PI / 2 + 0.25; pv.add(lf); mz.add(pv); } mz.position.set(-1.4, Y, 0.2); g.add(mz);
      for (let i = 0; i < 16; i++) { const a = (i / 15 - 0.5) * 2.6, L = 0.6 + (i % 3) * 0.12; g.add(tube([V(-1.4, Y, Z), V(-1.4 + Math.sin(a) * L * 0.4, Y - L * 0.5, Z + 0.01), V(-1.4 + Math.sin(a) * L * 0.7, Y - L * 0.95, Z + 0.02)], 0.013, rootM, 10, 4)); }
      const bn = BK.plant({ h: 1.5, leaves: 6, leafLen: 0.5, leafW: 0.36 }); bn.position.set(1.2, Y, 0.2); g.add(bn); g.add(tube([V(1.2, Y, Z), V(1.22, Y - 0.45, Z + 0.01), V(1.2, Y - 0.95, Z + 0.02)], 0.035, rootM, 12, 6)); for (let i = 0; i < 10; i++) { const y = Y - 0.12 - i * 0.075, sd = i % 2 ? 1 : -1, L = 0.35 - i * 0.02; g.add(tube([V(1.2, y, Z), V(1.2 + sd * L * 0.6, y - 0.08, Z + 0.01), V(1.2 + sd * L, y - 0.18, Z + 0.02)], 0.009, rootM, 8, 4)); }
      BK.shadow(g, true, true); },
    update(S, s, c, dt) {},
    overlay(ctx, s, c, S, B) { BK.labc(S, B, -1.4, 3.15, 0.2, "Maize — MONOCOT", "#ffd27a"); BK.labc(S, B, 1.2, 2.75, 0.2, "Bean — DICOT", "#ffd27a"); BK.labc(S, B, -1.4, 0.0, 0.62, "Fibrous roots", "#f2e8cc", 14); BK.labc(S, B, 1.2, 0.0, 0.62, "Taproot + laterals", "#f2e8cc", 14); },
    hud: (s, c) => { const R = { leaf: ["Parallel veins, long narrow leaf, sheath base", "Net (reticulate) veins, broad leaf with petiole"], root: ["Fibrous roots of similar size", "Taproot with lateral roots"], stem: ["Vascular bundles scattered; no cambium", "Bundles in a ring; cambium (secondary growth)"], seed: ["One cotyledon; endosperm stores food", "Two cotyledons store food"] }[c.part]; return [{ title: "Monocot vs dicot — " + c.part, lines: [["Monocot: " + R[0], "#5bd68c"], ["Dicot: " + R[1], "#ffd27a"], "—", "Modifications: storage roots (cassava), prop roots (maize), tendrils (pea), rhizomes (ginger), tubers (yam), bulbs (onion), spines (cactus)."] }]; },
    table: () => MK.table(["Feature", "Monocot", "Dicot"], [["Cotyledons", "1", "2"], ["Leaf veins", "Parallel", "Net"], ["Roots", "Fibrous", "Tap"], ["Stem bundles", "Scattered", "Ring"], ["Flower parts", "Threes", "Fours or fives"]]),
    draw: BK.fallback("Monocots and dicots", ["Monocot: 1 cotyledon, parallel veins, fibrous roots", "Dicot: 2 cotyledons, net veins, taproot"]),
  });

  /* ===================== GH7-a  water resources ===================== */
  BK.def3d("GH7-a", {
    label: "Photoreal 3D lab", title: "Integrated water resources management",
    blurb: "A river catchment feeding a dam reservoir that supplies a town and farms. Balance rainfall against use, and protect the catchment.",
    env: "outdoor", cam: [[0.2, 5.6, 9.0], [1.1, 0.2, 0.6]], fov: 40,
    values: { rain: 1200, use: 50, forest: 60 },
    controls: [{ key: "rain", label: "Annual rainfall", min: 300, max: 2500, step: 50, unit: "mm" }, { key: "use", label: "Water used (town + irrigation)", min: 10, max: 150, unit: "million m³/yr" }, { key: "forest", label: "Forest cover in catchment", min: 0, max: 100, unit: "%" }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); const hill = new T3.Mesh(new T3.PlaneGeometry(12, 8, 48, 32), new T3.MeshStandardMaterial({ map: BK.spotTex("#6a8a3a", "#4f6f2a", 900, 5), roughness: 0.95 })); const p = hill.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.max(-0.2, Math.abs(x) * 0.25 + (y + 4) * 0.12 + BK.fbm(x * 0.3, y * 0.3, 2) * 0.8 - 0.5 - 1.0 * Math.exp(-(x * x + (y + 1) * (y + 1)) / 3))); } hill.geometry.computeVertexNormals(); hill.rotation.x = -Math.PI / 2; g.add(hill);
      s.res = new T3.Mesh(new T3.PlaneGeometry(6, 5.1), new T3.MeshStandardMaterial({ color: 0x1a4a6a, roughness: 0.25 })); s.res.rotation.x = -Math.PI / 2; s.res.position.set(0, 0, 0.05); g.add(s.res); const dam = new T3.Mesh(new T3.CylinderGeometry(4, 4, 0.8, 48, 1, true, -0.45, 0.9), new T3.MeshStandardMaterial({ map: BK.spotTex("#a8a498", "#8a867a", 400, 3), roughness: 0.9, side: T3.DoubleSide })); dam.position.set(0, 0.2, -1.4); g.add(dam); const spill = new T3.Mesh(new T3.PlaneGeometry(0.5, 0.9), window.P3D.mat.water(0xc8e8ff)); spill.position.set(0, 0.25, 2.62); spill.rotation.x = -0.3; g.add(spill);
      s.trees = []; const rr = BK.rng(8); for (let i = 0; i < 30; i++) { const tr = BK.tree(0.9 + rr() * 0.5, i); const x = (rr() - 0.5) * 10, z = -3.5 + rr() * 3; tr.position.set(x, Math.abs(x) * 0.25 + (-z + 4) * 0.12 - 0.3, z); g.add(tr); s.trees.push(tr); }
      for (let i = 0; i < 6; i++) { const h = new T3.Mesh(new T3.BoxGeometry(0.4, 0.3, 0.4), window.P3D.mat.paint(0xe8e0d0)); h.position.set(1.6 + (i % 3) * 0.6, 0.15, 3.4 + Math.floor(i / 3) * 0.6); g.add(h); const rf = new T3.Mesh(new T3.ConeGeometry(0.34, 0.22, 4), window.P3D.mat.paint(0xa84a2a)); rf.rotation.y = Math.PI / 4; rf.position.set(h.position.x, 0.41, h.position.z); g.add(rf); } const cm = BK.mat.leaf("#6a9a3a", "#a8c870"); for (let i = 0; i < 20; i++) { const cr = BK.grassTuft(cm, 6, 0.4, i); cr.position.set(-2.6 + (i % 5) * 0.32, 0, 3.2 + Math.floor(i / 5) * 0.3); g.add(cr); } BK.shadow(g, true, true); s.lvl = 0.6; },
    update(S, s, c, dt) { const area = 400, runoffCoef = 0.45 - c.forest / 100 * 0.2, inflow = c.rain / 1000 * area * runoffCoef, evap = 15, net = inflow - c.use - evap; s.inflow = inflow; s.net = net; s.lvl = Math.max(0.05, Math.min(1, s.lvl + net / 400 * dt)); s.res.position.y = -0.17 + 0.45 * s.lvl; s.trees.forEach((tr, i) => (tr.visible = i / s.trees.length < c.forest / 100)); s.silt = (100 - c.forest) / 100; s.res.material.color.setHex(0x2f6a8a).lerp(new (T().Color)(0x8a6a3a), s.silt * 0.6); },
    hud: (s, c) => [{ title: "Water budget", lines: [["Inflow ≈ " + f(s.inflow || 0, 0) + " million m³/yr · use " + c.use + " · evaporation 15", "#7cb3ff"], [(s.net || 0) >= 0 ? "Reservoir filling — supply is sustainable" : "Reservoir falling — water shortage ahead", (s.net || 0) >= 0 ? "#5bd68c" : "#ff7b72", true], "Forests slow run-off, recharge groundwater and reduce silting of the dam.", "IWRM: manage surface and ground water together; share fairly between homes, farms, industry and nature; protect catchments; harvest rainwater; treat waste water."] }],
    readouts: (s, c) => [["Reservoir", f((s.lvl || 0) * 100, 0) + "% full"], ["Net", f(s.net || 0, 0) + " Mm³/yr"]],
    draw: BK.fallback("Water resources", (s, c) => ["Rainfall " + c.rain + " mm; use " + c.use + " million m³/yr", "Protect catchments, conserve and treat water"]),
  });

  /* ===================== GH8-a  water treatment ===================== */
  BK.def3d("GH8-a", {
    label: "Photoreal 3D lab", title: "Biology and the water industry",
    blurb: "River water passes through screening, coagulation and sedimentation, sand filtration and chlorination — watch it clear, and measure its BOD.",
    env: "lab", cam: [[0.2, 3.2, 8.0], [1.0, 0.7, 0]], fov: 38,
    values: { bod: 30, alum: 1, cl: 1 },
    controls: [{ key: "bod", label: "Raw water BOD", min: 2, max: 200, unit: "mg O₂/dm³" }, { type: "toggle", key: "alum", label: "Add alum (coagulant)" }, { type: "toggle", key: "cl", label: "Chlorinate" }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); s.tanks = []; ["Screening", "Sedimentation", "Sand filter", "Chlorination"].forEach((n, i) => { const x = -2.9 + i * 1.5; const tk = new T3.Mesh(new T3.BoxGeometry(1.3, 1.2, 1.2), glass()); tk.position.set(x, 0.6, 0); tk.renderOrder = 3; g.add(tk); const w = new T3.Mesh(new T3.BoxGeometry(1.22, 1.0, 1.1), new T3.MeshStandardMaterial({ color: 0x8a6a3a, transparent: true, opacity: 0.7, roughness: 0.2, depthWrite: false })); w.position.set(x, 0.52, 0); w.renderOrder = 2; g.add(w); s.tanks.push(w); if (i === 2) { const sand = new T3.Mesh(new T3.BoxGeometry(1.22, 0.35, 1.1), new T3.MeshStandardMaterial({ map: BK.spotTex("#d8c08a", "#a88a5a", 400, 2) })); sand.position.set(x, 0.2, 0); g.add(sand); } if (i === 0) { for (let k = 0; k < 8; k++) { const bar = new T3.Mesh(new T3.CylinderGeometry(0.015, 0.015, 1.1, 6), window.P3D.mat.steel()); bar.position.set(x - 0.4, 0.6, -0.45 + k * 0.13); g.add(bar); } } if (i < 3) g.add(tube([V(x + 0.65, 0.9, 0), V(x + 0.85, 0.9, 0)], 0.06, window.P3D.mat.steel())); });
      s.floc = new T3.InstancedMesh(new T3.SphereGeometry(0.03, 8, 6), new T3.MeshStandardMaterial({ color: 0x6a4a2a }), 120); g.add(s.floc); s.F = Array.from({ length: 120 }, () => [-1.4 + (Math.random() - 0.5) * 1.1, Math.random(), (Math.random() - 0.5) * 1.0]); BK.shadow(g, true, true); },
    update(S, s, c, dt) { const raw = Math.min(1, c.bod / 50), stages = [raw, raw * (c.alum ? 0.35 : 0.8), raw * (c.alum ? 0.08 : 0.4), raw * (c.alum ? 0.06 : 0.35)]; const col = new (T().Color)(); s.tanks.forEach((w, i) => { col.setHex(0x9ecfe8).lerp(new (T().Color)(0x5a3a10), stages[i]); w.material.color.copy(col); w.material.opacity = 0.35 + stages[i] * 0.55; }); const m4 = new (T().Matrix4)(); s.F.forEach((p, i) => { p[1] = Math.max(0.04, p[1] - dt * (c.alum ? 0.15 : 0.03)); if (p[1] <= 0.04 && Math.random() < dt * 0.1) p[1] = 1; m4.makeTranslation(p[0], 0.05 + p[1] * 0.9, p[2]); s.floc.setMatrixAt(i, m4); }); s.floc.instanceMatrix.needsUpdate = true; s.out = c.bod * (c.alum ? 0.06 : 0.35); s.safe = s.out < 5 && c.cl; },
    overlay(ctx, s, c, S, B) { ["Screening", "Coagulation + settling", "Sand filtration", "Chlorination"].forEach((n, i) => BK.labc(S, B, -2.9 + i * 1.5, i % 2 ? 1.75 : 1.45, 0, n, "#e8f1ff", 0, 9.5)); },
    hud: (s, c) => [{ title: "Water treatment", lines: [["Raw BOD " + c.bod + " → treated ≈ " + f(s.out || 0, 1) + " mg/dm³", "#7cb3ff", true], [s.safe ? "Safe to drink (low BOD, disinfected)" : c.cl ? "Still too much organic matter" : "Not disinfected — germs (e.g. cholera) may survive", s.safe ? "#5bd68c" : "#ff7b72"], "BOD (biochemical oxygen demand) = oxygen used by microbes in 5 days at 20 °C; high BOD = heavy organic pollution.", "Clean river < 3; polluted > 10; raw sewage 200–600 mg/dm³.", "Sewage works use aerobic bacteria (activated sludge, trickling filters) to break down organic matter."] }],
    readouts: (s, c) => [["Treated BOD", f(s.out || 0, 1)], ["Chlorine", c.cl ? "yes" : "no"]],
    draw: BK.fallback("Water treatment", ["Screen → coagulate/settle → filter → chlorinate", "BOD measures organic pollution"]),
  });

  /* ===================== GH8-b  fish farming ===================== */
  BK.def3d("GH8-b", {
    label: "Photoreal 3D lab", title: "Biology and the fishing industry",
    blurb: "A Tilapia pond: set the stocking density, feeding and aeration, and see oxygen, growth and harvest — fish stock management in miniature.",
    env: "outdoor", cam: [[0.6, 5.2, 7.2], [1.3, -0.2, 0]], fov: 38,
    values: { dens: 3, feed: 3, aer: 0 },
    controls: [{ key: "dens", label: "Stocking density", min: 1, max: 10, step: 0.5, unit: "fish/m²" }, { key: "feed", label: "Feeding rate", min: 0, max: 6, step: 0.5, unit: "% body mass/day" }, { type: "toggle", key: "aer", label: "Aerator on" }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); g.position.y = 0.5; const wall = new T3.Mesh(new T3.CylinderGeometry(4.0, 4.3, 0.5, 64, 1, true), BK.mat.soil([6, 1])); wall.position.y = -0.25; g.add(wall); const bank = new T3.Mesh(new T3.RingGeometry(3.2, 4.0, 64), BK.mat.soil([2, 2])); bank.rotation.x = -Math.PI / 2; bank.position.y = 0.05; g.add(bank); const floor = new T3.Mesh(new T3.CircleGeometry(3.2, 64), new T3.MeshStandardMaterial({ map: BK.spotTex("#4a4030", "#2a3020", 300, 6), roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.45; g.add(floor); s.pond = new T3.Mesh(new T3.CircleGeometry(3.2, 64), new T3.MeshPhysicalMaterial({ color: 0x3a7a6a, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.4, depthWrite: false })); s.pond.rotation.x = -Math.PI / 2; s.pond.position.y = 0.02; g.add(s.pond); s.fish = []; for (let i = 0; i < 40; i++) { const fi = BK.fish(0.25); fi.position.y = -0.1; g.add(fi); s.fish.push(fi); } s.aer = new T3.Mesh(new T3.CylinderGeometry(0.2, 0.2, 0.15, 16), window.P3D.mat.paint(0xd8a020)); s.aer.position.set(1.4, 0.1, 0.6); g.add(s.aer); s.wl = new T3.Mesh(new T3.CylinderGeometry(3.2, 3.2, 0.5, 64, 1, true), new T3.MeshStandardMaterial({ map: BK.spotTex("#4a4030", "#2a3020", 200, 6), side: T3.BackSide })); s.wl.position.y = -0.2; g.add(s.wl); BK.shadow(g, false, true); },
    update(S, s, c, dt) { const n = Math.round(c.dens * 4); const DO = Math.max(0.5, 8 - c.dens * 0.55 - c.feed * 0.45 + (c.aer ? 3.5 : 0)); s.DO = DO; const growth = Math.max(0, Math.min(1, c.feed / 4) * (DO > 4 ? 1 : DO / 4) * (1 - Math.max(0, c.dens - 6) * 0.08)); s.gr = growth; s.yield = c.dens * 10000 * 0.25 * (0.4 + growth * 1.4) / 1000;
      s.fish.forEach((fi, i) => { fi.visible = i < n; const a = S.t * (0.4 + (i % 5) * 0.08) + i, r = 0.6 + (i % 7) * 0.35; fi.position.set(Math.cos(a) * r, DO < 3 ? 0.0 : -0.15, Math.sin(a) * r); fi.rotation.y = -a - Math.PI / 2; fi.scale.setScalar(0.36 * (0.7 + growth * 0.6)); });
      s.pond.material.color.setHex(0x3a7a6a).lerp(new (T().Color)(0x5a8a2a), Math.min(1, c.feed / 8)); s.aer.visible = !!c.aer; if (c.aer && Math.random() < dt * 8) S.puff(1.4, 0.65, 0.6, { color: 0xffffff, n: 2, size: 0.25, speed: 0.6, up: 1, life: 0.8, op: 0.6 }); },
    hud: (s, c) => [{ title: "Fish pond management", lines: [["Dissolved oxygen ≈ " + f(s.DO || 0, 1) + " mg/dm³", (s.DO || 0) < 3 ? "#ff7b72" : "#5bd68c", true], (s.DO || 0) < 3 ? "Fish gasp at the surface — too crowded or overfed." : "Healthy oxygen level (Tilapia need > 3 mg/dm³).", ["Estimated harvest ≈ " + f(s.yield || 0, 1) + " tonnes per hectare per cycle", "#ffd27a"], "Stock management: closed seasons, minimum mesh size, quotas, protect breeding grounds, ban poisons and dynamite fishing.", "Preservation: smoking, salting, drying, freezing, canning."] }],
    readouts: (s, c) => [["Fish", String(Math.round(c.dens * 4))], ["O₂", f(s.DO || 0, 1) + " mg/dm³"]],
    draw: BK.fallback("Fish farming", (s, c) => ["Density " + c.dens + " fish/m², feed " + c.feed + "%", "Keep dissolved oxygen above 3 mg/dm³"]),
  });

  /* ===================== GH8-c  fermenter ===================== */
  BK.def3d("GH8-c", {
    label: "Photoreal 3D lab", title: "Food industry and biotechnology",
    blurb: "A stainless-steel fermenter growing yeast: control temperature, pH and air, and watch the growth curve — the same biology behind bread, kenkey, yoghurt and medicines.",
    env: "lab", cam: [[1.2, 2.8, 8.8], [1.6, 1.9, 0]], fov: 38,
    values: { temp: 30, ph: 5, air: 1, prod: "bread" },
    controls: [{ key: "temp", label: "Temperature", min: 10, max: 55, unit: "°C" }, { key: "ph", label: "pH", min: 2, max: 9, step: 0.1 }, { type: "toggle", key: "air", label: "Air supply (aerobic)" }, { type: "select", key: "prod", label: "Product", options: [["bread", "Bread / baker's yeast"], ["kenkey", "Kenkey / ogi (lactic fermentation)"], ["yog", "Yoghurt"], ["pen", "Penicillin"], ["ins", "Insulin (GM bacteria)"]] }],
    actions: [{ label: "↻ New batch", run: (s) => { s.N = 1; s.hist = []; } }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); const tank = new T3.Mesh(new T3.CylinderGeometry(1.0, 1.0, 2.4, 48), window.P3D.mat.steel()); tank.position.y = 1.4; g.add(tank); const dome = new T3.Mesh(new T3.SphereGeometry(1.0, 48, 16, 0, 6.3, 0, Math.PI / 2), window.P3D.mat.steel()); dome.position.y = 2.6; g.add(dome); const win = new T3.Mesh(new T3.CircleGeometry(0.35, 32), glass()); win.position.set(0, 1.3, 1.01); g.add(win); s.brew = new T3.Mesh(new T3.CircleGeometry(0.33, 32), new T3.MeshPhysicalMaterial({ color: 0xe8d8a0, roughness: 0.3 })); s.brew.position.set(0, 1.3, 1.005); g.add(s.brew);
      s.motor = new T3.Mesh(new T3.CylinderGeometry(0.2, 0.2, 0.4, 24), window.P3D.mat.paint(0x2a5ad8)); s.motor.position.y = 3.8; g.add(s.motor); g.add(tube([V(0, 3.6, 0), V(0, 3.0, 0)], 0.04, window.P3D.mat.chrome())); for (const [x, col] of [[-1.5, 0xd82a2a], [1.5, 0x2a8ad8]]) { const p = tube([V(x, 0.2, 0), V(x, 2.2, 0), V(x * 0.7, 2.4, 0)], 0.05, window.P3D.mat.paint(col)); g.add(p); } BK.shadow(g, true, true); g.position.x = 0.9; s.N = 1; s.hist = []; s.ht = 0; },
    update(S, s, c, dt) { const tf = Math.exp(-Math.pow((c.temp - 30) / 9, 2)) * (c.temp > 45 ? Math.max(0, 1 - (c.temp - 45) / 8) : 1), pf = Math.exp(-Math.pow((c.ph - 5) / 2, 2)), af = c.air ? 1 : 0.35; const r = 0.6 * tf * pf * af; s.r = r; s.N = Math.min(100, s.N + r * s.N * (1 - s.N / 100) * dt * 1.5); s.ht += dt; if (s.ht > 0.25) { s.ht = 0; s.hist.push(s.N); if (s.hist.length > 100) s.hist.shift(); } s.motor.rotation.y += dt * 8; s.brew.material.color.setHex(0xe8d8a0).lerp(new (T().Color)(0xb89a50), s.N / 100); },
    overlay(ctx, s, c, S, B) { BK.graph(B, 14, 252, 260, 136, { title: "Yeast population (% of maximum)", x0: 0, x1: 100, y0: 0, y1: 100, series: [{ pts: s.hist.map((v, i) => [i, v]), color: "#ffd27a" }], xl: "time" }); },
    hud: (s, c) => { const P = { bread: "Yeast respires sugar → CO₂ makes dough rise; ethanol evaporates on baking.", kenkey: "Lactic acid bacteria and yeasts ferment maize dough — sour taste, longer keeping.", yog: "Lactobacillus turns lactose into lactic acid, thickening milk.", pen: "Penicillium grown in fermenters makes the antibiotic penicillin.", ins: "Genetically modified bacteria carrying the human insulin gene make insulin for diabetics." }; return [{ title: "Fermenter", lines: [["Growth rate ≈ " + f((s.r || 0) * 100, 0) + "% of maximum", "#ffd27a", true], "Growth curve: lag → log (exponential) → stationary → death.", "Controlled: temperature (water jacket), pH (acid/alkali), oxygen (sterile air), nutrients, stirring, sterility.", ["" + P[c.prod], "#5bd68c"], "Food additives: preservatives, colourings, flavourings, emulsifiers, sweeteners."] }]; },
    readouts: (s, c) => [["Yeast", f(s.N || 0, 0) + "%"], ["Rate", f((s.r || 0) * 100, 0) + "%"]],
    draw: BK.fallback("Biotechnology", ["Fermenters control temperature, pH, oxygen and nutrients", "Products: bread, kenkey, yoghurt, penicillin, insulin"]),
  });

  /* ===================== GH8-d  biogas ===================== */
  BK.def3d("GH8-d", {
    label: "Photoreal 3D lab", title: "Biological fuel generation",
    blurb: "A floating-drum biogas digester: feed in cow dung, let bacteria digest it without oxygen, and watch the gas holder rise and the burner light.",
    env: "outdoor", cam: [[1.6, 3.4, 8.0], [2.2, 0.7, 0]], fov: 38,
    values: { dung: 40, temp: 32 },
    controls: [{ key: "dung", label: "Cow dung added per day", min: 0, max: 100, unit: "kg" }, { key: "temp", label: "Digester temperature", min: 10, max: 45, unit: "°C" }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); const pit = new T3.Mesh(new T3.CylinderGeometry(1.2, 1.2, 1.6, 48, 1, true), new T3.MeshStandardMaterial({ map: BK.spotTex("#8a8478", "#6a645a", 300, 4), side: T3.DoubleSide, roughness: 0.95 })); pit.position.set(0, 0.0, 0); g.add(pit); s.slurry = new T3.Mesh(new T3.CylinderGeometry(1.15, 1.15, 1.2, 48), new T3.MeshPhysicalMaterial({ color: 0x5a4a2a, roughness: 0.4, clearcoat: 0.5 })); s.slurry.position.y = -0.2; g.add(s.slurry);
      s.drum = new T3.Mesh(new T3.CylinderGeometry(1.05, 1.05, 1.0, 48), window.P3D.mat.paint(0x3a6ab8)); g.add(s.drum); const inl = tube([V(-2.2, 0.6, 0), V(-1.6, 0.3, 0), V(-1.2, -0.4, 0)], 0.12, window.P3D.mat.matte(0x8a8478)); g.add(inl); const outl = tube([V(1.2, -0.4, 0), V(1.7, 0.2, 0), V(2.4, 0.3, 0)], 0.12, window.P3D.mat.matte(0x8a8478)); g.add(outl);
      g.add(tube([V(0, 1.2, 0), V(0.6, 1.6, 0), V(2.2, 1.6, 0), V(2.6, 0.9, 0)], 0.03, window.P3D.mat.paint(0x2a2a2a))); const stove = new T3.Mesh(new T3.CylinderGeometry(0.25, 0.3, 0.3, 24), window.P3D.mat.iron()); stove.position.set(2.6, 0.75, 0); g.add(stove); s.flame = window.P3D.S.mk.soft(0x5a8aff, 0.6, 2.6, 1.0, 0, 0.8); g.add(s.flame); BK.shadow(g, true, true); s.gas = 0; },
    update(S, s, c, dt) { const tf = Math.exp(-Math.pow((c.temp - 35) / 9, 2)); const prod = c.dung * 0.04 * tf; s.prod = prod; s.gas = Math.max(0, Math.min(1, s.gas + (prod * 0.08 - 0.06) * dt)); s.drum.position.y = 0.55 + s.gas * 0.7; s.flame.visible = s.gas > 0.1; s.flame.scale.setScalar(0.3 + s.gas * 0.6); },
    overlay(ctx, s, c, S, B) { BK.labc(S, B, -2.2, 0.9, 0, "Inlet: dung + water", "#e8d8a0"); BK.labc(S, B, 0, s.drum.position.y + 0.7, 0, "Floating gas holder", "#7cb3ff"); BK.labc(S, B, 2.6, 1.4, 0, "Biogas burner", "#9fc3ff"); BK.labc(S, B, 2.4, 0.6, 0, "Slurry → fertiliser", "#c8a070", 14); },
    hud: (s, c) => [{ title: "Biogas", lines: [["Biogas ≈ " + f(s.prod || 0, 2) + " m³/day (≈ 60% methane, 40% CO₂)", "#ffd27a", true], "Anaerobic bacteria: hydrolysis → acid formation → methanogens make CH₄.", "Best at 30–40 °C, no oxygen, steady feeding.", "1 m³ of biogas ≈ 2 h of cooking on one burner.", "Bioethanol: yeast fermentation of sugar cane or cassava starch → ethanol fuel."] }],
    readouts: (s, c) => [["Biogas", f(s.prod || 0, 2) + " m³/day"], ["Holder", f((s.gas || 0) * 100, 0) + "% full"]],
    draw: BK.fallback("Biogas", (s, c) => ["Dung " + c.dung + " kg/day → ≈ " + f(c.dung * 0.04, 1) + " m³ biogas/day", "Anaerobic bacteria make methane"]),
  });

  /* ===================== WA1-b  taxis & nastism ===================== */
  BK.def3d("WA1-b", {
    label: "Photoreal 3D lab", title: "Irritability — taxis and nastic movements",
    blurb: "Touch the sensitive plant (Mimosa) and its leaflets fold; dim the light and flowers close; Euglena swim toward a light — taxis.",
    env: "lab", cam: [[0.4, 3.0, 4.0], [0.8, 1.2, 0]], fov: 38,
    values: { mode: "mimosa", light: 80 },
    controls: [{ type: "tabs", key: "mode", label: "Response", options: [["mimosa", "Thigmonasty (Mimosa)"], ["flower", "Photonasty (flower closing)"], ["taxis", "Phototaxis (Euglena)"]] }, { key: "light", label: "Light", min: 0, max: 100, unit: "%", show: W("mode", "flower", "taxis") }],
    actions: [{ label: "☝ Touch the plant", run: (s) => { s.touch = 0; } }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) { const T3 = T();
      if (s.key !== c.mode) { s.key = c.mode; const g = BK.group(S, s); s.lf = []; s.eu = [];
        if (c.mode === "mimosa") { const pot = new T3.Mesh(new T3.CylinderGeometry(0.45, 0.35, 0.6, 24), new T3.MeshPhysicalMaterial({ color: 0xb8643a, roughness: 0.7 })); pot.position.y = 0.3; g.add(pot); g.add(tube([V(0, 0.6, 0), V(0, 2.0, 0)], 0.03, new T3.MeshPhysicalMaterial({ color: 0x8a5a3a })));
          const lm = BK.mat.leaf("#4f9a3a", "#9ccc7a"); for (let k = 0; k < 4; k++) { const piv = new T3.Group(); piv.position.y = 0.9 + k * 0.3; piv.rotation.y = k * 1.6; const rach = new T3.Group(); piv.add(rach); rach.add(tube([V(0, 0, 0), V(1.0, 0.12, 0)], 0.014, new T3.MeshStandardMaterial({ color: 0x6a8a3a }), 8, 4)); for (let j = 0; j < 11; j++) for (const sd of [-1, 1]) { const lp = new T3.Group(); lp.position.set(0.15 + j * 0.078, 0.02 + j * 0.01, 0); const leaf = BK.leaf(0.2, 0.075, lm, 0); leaf.rotation.x = -Math.PI / 2 * sd; lp.add(leaf); rach.add(lp); s.lf.push({ lp, sd }); } piv.rach = rach; g.add(piv); s.lf.push({ piv }); } s.touch = 9; }
        if (c.mode === "flower") { const fm = new T3.MeshPhysicalMaterial({ color: 0xf2c020, roughness: 0.5, side: T3.DoubleSide, sheen: 1 }); g.add(tube([V(0, 0, 0), V(0, 1.6, 0)], 0.04, new T3.MeshPhysicalMaterial({ color: 0x4f8a3a }))); for (let i = 0; i < 12; i++) { const piv = new T3.Group(); piv.position.y = 1.6; piv.rotation.y = i / 12 * 6.28; const p = new T3.Mesh(BK.leafGeo(0.6, 0.18, -0.05, 6), fm); piv.add(p); g.add(piv); s.lf.push(piv); } const ctr = new T3.Mesh(new T3.SphereGeometry(0.15, 20, 14), new T3.MeshStandardMaterial({ color: 0x5a3a1a })); ctr.position.y = 1.62; g.add(ctr); }
        if (c.mode === "taxis") { const dish = new T3.Mesh(new T3.CylinderGeometry(2.0, 2.0, 0.15, 64), window.P3D.mat.water(0x9fd8c0)); dish.position.y = 0.5; g.add(dish); for (let i = 0; i < 30; i++) { const e = new T3.Mesh(new T3.CapsuleGeometry(0.03, 0.12, 4, 8), new T3.MeshPhysicalMaterial({ color: 0x3f9a3a, roughness: 0.3 })); e.rotation.z = Math.PI / 2; e.position.set((Math.random() - 0.5) * 3, 0.6, (Math.random() - 0.5) * 3); g.add(e); s.eu.push(e); } s.lamp = window.P3D.S.mk.bulb(0xfff2c8, 10); s.lamp.position.set(2.6, 1.0, 0); g.add(s.lamp); }
        BK.shadow(g, true, true); }
      if (c.mode === "mimosa") { s.touch = (s.touch ?? 9) + dt; const fold = s.touch < 0.4 ? s.touch / 0.4 : Math.max(0, 1 - (s.touch - 4) / 4); s.fold = fold; s.lf.forEach((q) => { if (q.lp) q.lp.rotation.x = q.sd * fold * 1.3; if (q.piv) q.piv.rach.rotation.z = -fold * 0.8; }); }
      if (c.mode === "flower") { const open = c.light / 100; s.lf.forEach((piv) => (piv.rotation.x = -(1 - open) * 1.3 - 0.2)); }
      if (c.mode === "taxis") { s.lamp.setPower(c.light / 100); s.eu.forEach((e, i) => { const tx = 1.6 * (c.light / 100) + Math.cos(S.t + i) * 0.3 * (1 - c.light / 100), dx = tx - e.position.x; e.position.x += Math.sign(dx) * Math.min(Math.abs(dx), dt * 0.3) + Math.cos(S.t * 2 + i) * dt * 0.05; e.position.z += Math.sin(S.t * 1.5 + i) * dt * 0.08; if (Math.hypot(e.position.x, e.position.z) > 1.9) e.position.multiplyScalar(0.98); }); } },
    hud: (s, c) => [{ title: { mimosa: "Thigmonasty (touch)", flower: "Photonasty (light)", taxis: "Phototaxis" }[c.mode], lines: [c.mode === "mimosa" ? ((s.fold || 0) > 0.5 ? "Leaflets folded — turgor lost in the pulvinus cells; recovers in ≈ 10 min." : "Press ☝ Touch — the response spreads along the leaf.") : c.mode === "flower" ? "Many flowers open in light and close in darkness; the direction of the stimulus does not matter." : "Whole Euglena swim toward moderate light, detected by the eyespot.", "—", "Taxis: movement of a WHOLE organism toward or away from a directional stimulus (phototaxis, chemotaxis).", "Nastic movement: movement of PART of a plant, independent of the stimulus direction (thigmonasty, photonasty).", "Tropism: directional growth movement of part of a plant."] }],
    draw: BK.fallback("Irritability", ["Taxis: whole organism moves toward/away from a stimulus", "Nastism: part of a plant moves, direction independent of stimulus"]),
  });

  /* ===================== WA1-e  eggs & reproduction ===================== */
  BK.def3d("WA1-e", {
    label: "Photoreal 3D lab", title: "Courtship and adaptive features in reproduction",
    blurb: "Fish eggs, toad spawn in jelly and a hen's egg cut open to show the yolk — compare numbers of eggs, food stores and parental care.",
    env: "lab", cam: [[0.8, 2.0, 4.8], [1.0, 0.6, 0]], fov: 38,
    values: { e: "bird" },
    controls: [{ type: "tabs", key: "e", label: "Egg", options: [["fish", "Fish (Tilapia)"], ["toad", "Toad spawn"], ["bird", "Bird (hen)"]] }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); S.renderer.localClippingEnabled = true; s.g2 = {};
      const fe = new T3.InstancedMesh(new T3.SphereGeometry(0.04, 12, 8), new T3.MeshPhysicalMaterial({ color: 0xf2c060, roughness: 0.2, clearcoat: 1 }), 200), m4 = new T3.Matrix4(); for (let i = 0; i < 200; i++) { m4.makeTranslation(-1.5 + (Math.random() - 0.5) * 0.9, 0.08 + Math.random() * 0.15, (Math.random() - 0.5) * 0.9); fe.setMatrixAt(i, m4); } g.add(fe); s.g2.fish = [-1.5, 0.5, 0];
      const spawn = []; for (let i = 0; i <= 60; i++) spawn.push(V(-0.1 + Math.sin(i * 0.3) * 0.4, 0.15, -0.6 + i * 0.02)); g.add(tube(spawn, 0.09, new T3.MeshPhysicalMaterial({ color: 0xe8f0e8, transparent: true, opacity: 0.45, roughness: 0, clearcoat: 1, depthWrite: false }), 120, 12)); spawn.forEach((p, i) => { if (i % 2) return; const d = new T3.Mesh(new T3.SphereGeometry(0.03, 10, 8), new T3.MeshStandardMaterial({ color: 0x1a1a1a })); d.position.copy(p); g.add(d); }); s.g2.toad = [-0.1, 0.5, 0];
      const clip = [new T3.Plane(V(0, 0, -1), 0)]; const prof = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * Math.PI; prof.push(new T3.Vector2(Math.sin(a) * 0.45 * (1 - 0.15 * Math.cos(a)), -Math.cos(a) * 0.6)); } const shell = new T3.Mesh(new T3.LatheGeometry(prof, 48), new T3.MeshPhysicalMaterial({ color: 0xd8b088, roughness: 0.6, side: T3.DoubleSide, clippingPlanes: clip })); shell.rotation.z = Math.PI / 2; shell.position.set(1.25, 0.5, 0); g.add(shell);
      const alb = new T3.Mesh(new T3.LatheGeometry(prof.map((p) => new T3.Vector2(p.x * 0.94, p.y * 0.94)), 48), new T3.MeshPhysicalMaterial({ color: 0xf6f2e8, roughness: 0.2, transparent: true, opacity: 0.8, clippingPlanes: clip })); alb.rotation.z = Math.PI / 2; alb.position.copy(shell.position); g.add(alb); const yolk = new T3.Mesh(new T3.SphereGeometry(0.2, 32, 24), new T3.MeshPhysicalMaterial({ color: 0xf2a020, roughness: 0.3, clearcoat: 0.6 })); yolk.position.set(1.25, 0.5, 0); g.add(yolk); s.g2.bird = [1.0, -0.1, 0.6]; BK.shadow(g, true, true); },
    update(S, s, c, dt) {},
    overlay(ctx, s, c, S, B) { BK.labc(S, B, ...s.g2[c.e], { fish: "Many small yolky eggs", toad: "Spawn: eggs in protective jelly", bird: "Shell · albumen · yolk" }[c.e], "#ffd27a"); },
    hud: (s, c) => [{ title: { fish: "Fish", toad: "Toad", bird: "Bird" }[c.e], lines: [{ fish: "External fertilisation in water; hundreds to thousands of small eggs; Tilapia mouth-brood the young.", toad: "Courtship: male clasps female (amplexus); external fertilisation; thousands of eggs in jelly that protects and floats them; no parental care.", bird: "Courtship displays and pairing; internal fertilisation; a few large eggs with much yolk; shell prevents drying; parents incubate and feed the chicks." }[c.e], "—", "Oviparous: lay eggs (fish, toad, most reptiles, birds). Viviparous: young develop inside the mother (mammals).", ["Trend: more parental care → fewer, larger eggs.", "#5bd68c"]] }],
    draw: BK.fallback("Eggs and care", ["Fish/toad: many eggs, external fertilisation, little care", "Birds: few yolky shelled eggs, incubation, feeding"]),
  });

  /* ===================== WA1-f  germination ===================== */
  BK.def3d("WA1-f", {
    label: "Photoreal 3D lab", title: "Germination of seeds",
    blurb: "A bean (epigeal) and a maize grain (hypogeal) germinating in a cut-away pot. Remove water, oxygen or warmth and see what happens.",
    env: "lab", cam: [[-0.2, 1.8, 5.2], [0.4, 0.9, 0]], fov: 38,
    values: { day: 5, water: 1, o2: 1, warm: 1 },
    controls: [{ key: "day", label: "Days after sowing", min: 0, max: 10, step: 0.2, unit: "days" }, { type: "toggle", key: "water", label: "Water" }, { type: "toggle", key: "o2", label: "Oxygen (air)" }, { type: "toggle", key: "warm", label: "Suitable warmth (≈ 25 °C)" }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) { const T3 = T(), ok = c.water && c.o2 && c.warm, key = c.day + "|" + ok;
      if (s.key !== key) { s.key = key; const g = BK.group(S, s), k = ok ? Math.min(1, c.day / 10) : 0; const soil = new T3.Mesh(new T3.BoxGeometry(4.2, 0.9, 1.2), BK.mat.soil([3, 1])); soil.position.y = 0.45; g.add(soil); const front = new T3.Mesh(new T3.PlaneGeometry(4.2, 0.9), glass()); front.position.set(0, 0.45, 0.61); g.add(front);
        const rootM = new T3.MeshStandardMaterial({ color: 0xf2ecd0 }), stemM = new T3.MeshPhysicalMaterial({ color: 0x9abf5a, roughness: 0.5 }), bean = new T3.MeshPhysicalMaterial({ color: 0xe8d8b0, roughness: 0.4 });
        const bx = -1.2, mx = 0.5; const rl = 0.1 + 0.6 * Math.min(1, k * 2); g.add(tube([V(bx, 0.7, 0.62), V(bx, 0.7 - rl, 0.62)], 0.02, rootM, 8, 6)); const hy = Math.max(0, (k - 0.3) / 0.7); const coty = V(bx, 0.7 + hy * 0.9, 0.62); if (hy > 0) g.add(tube([V(bx, 0.7, 0.62), V(bx + 0.1 * (1 - hy), 0.7 + hy * 0.5, 0.62), coty], 0.025, stemM, 12, 6)); for (const sd of [-1, 1]) { const ct = new T3.Mesh(new T3.SphereGeometry(0.12, 16, 12), hy > 0.4 ? new T3.MeshPhysicalMaterial({ color: 0x7aaa4a, roughness: 0.5 }) : bean); ct.scale.set(1, 0.6, 0.8); ct.position.copy(coty).add(V(sd * 0.08, 0, 0)); g.add(ct); } if (hy > 0.6) { const lf = BK.leaf(0.3, 0.18, BK.mat.leaf("#4f9a3a", "#9ccc7a"), 0.1); lf.position.copy(coty).add(V(0, 0.05, 0)); g.add(lf); }
        const grain = new T3.Mesh(BK.blob(0.1, 4, 0.05, 16, 1, 1.3, 0.7), new T3.MeshPhysicalMaterial({ color: 0xe8b830, roughness: 0.4 })); grain.position.set(mx, 0.65, 0.62); g.add(grain); for (let i = 0; i < 4; i++) g.add(tube([V(mx, 0.6, 0.62), V(mx + (i - 1.5) * 0.12 * k, 0.6 - rl * (0.6 + i * 0.1), 0.62)], 0.012, rootM, 8, 4)); if (k > 0.2) { const ph = (k - 0.2) * 1.6; g.add(tube([V(mx, 0.7, 0.62), V(mx, 0.7 + ph, 0.62)], 0.02, stemM, 8, 6)); if (ph > 0.5) { const lf = BK.leaf(0.6 * Math.min(1, ph), 0.07, BK.mat.leaf("#5f9a3a", "#a8c870"), 0.4); lf.position.set(mx, 0.7 + ph * 0.7, 0.62); g.add(lf); } } BK.shadow(g, true, true); } },
    overlay(ctx, s, c, S, B) { BK.labc(S, B, -1.2, 1.95, 0.6, "Bean — epigeal", "#ffd27a"); BK.labc(S, B, 0.5, 1.75, 0.6, "Maize — hypogeal", "#ffd27a"); },
    hud: (s, c) => { const ok = c.water && c.o2 && c.warm; return [{ title: "Germination", lines: [[ok ? "Germinating — day " + c.day : "No germination: " + [!c.water && "no water", !c.o2 && "no oxygen", !c.warm && "too cold"].filter(Boolean).join(", "), ok ? "#5bd68c" : "#ff7b72", true], "Water: activates enzymes, softens the testa, swells the seed.", "Oxygen: for respiration to release energy for growth.", "Warmth: enzymes work best at ≈ 25–35 °C.", "Epigeal: hypocotyl lengthens, cotyledons rise (bean, cowpea). Hypogeal: epicotyl lengthens, cotyledons stay below (maize, pea)."] }]; },
    note: "Control experiment: four tubes of seeds — complete; dry; boiled cooled water with oil layer (no O₂); in a refrigerator. Only the complete tube germinates.",
    draw: BK.fallback("Germination", ["Needs water, oxygen and warmth", "Epigeal (bean): cotyledons above ground; hypogeal (maize): below"]),
  });

  /* ===================== WA3-a  sampling ===================== */
  BK.def3d("WA3-a", {
    label: "Photoreal 3D lab", title: "Population studies by sampling",
    blurb: "Throw 1 m² quadrats at random over a field of plants and count what falls inside to estimate density and frequency. Capture–recapture estimates moving animals.",
    env: "outdoor", cam: [[0.6, 7.0, 7.6], [0.8, 0, 0]], fov: 38,
    values: { M: 40, C: 50, R: 8 },
    controls: [{ key: "M", label: "Marked and released (first catch)", min: 10, max: 100 }, { key: "C", label: "Second catch", min: 10, max: 100 }, { key: "R", label: "Marked in second catch", min: 1, max: 40 }],
    actions: [{ label: "▣ Throw a quadrat", run: (s) => { s.throwq = true; } }, { label: "↻ Clear quadrats", run: (s) => { s.clear = true; } }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); s.plants = []; const rr = BK.rng(4), fm = new T3.MeshPhysicalMaterial({ color: 0xf2e020, roughness: 0.5, sheen: 1 }), lm = new T3.MeshStandardMaterial({ color: 0x3f7a2f }); const r2 = BK.rng(77), CL = Array.from({ length: 10 }, () => [-3.6 + r2() * 4.6, (r2() - 0.5) * 5.4]); const im = new T3.InstancedMesh(new T3.SphereGeometry(0.06, 8, 6), fm, 300), im2 = new T3.InstancedMesh(new T3.ConeGeometry(0.08, 0.25, 6), lm, 300), m4 = new T3.Matrix4();
      for (let i = 0; i < 300; i++) { const cl = Math.floor(i / 30), cx = CL[cl][0], cz = CL[cl][1]; const x = cx + (rr() - 0.5) * 1.6, z = cz + (rr() - 0.5) * 1.6; m4.makeTranslation(x, 0.15, z); im.setMatrixAt(i, m4); s.plants.push([x, z, 0]); const x2 = -4.2 + rr() * 5.6, z2 = (rr() - 0.5) * 7; m4.makeTranslation(x2, 0.12, z2); im2.setMatrixAt(i, m4); s.plants.push([x2, z2, 1]); } g.add(im, im2); s.q = []; s.qg = new T3.Group(); g.add(s.qg); },
    update(S, s, c, dt) { const T3 = T(); if (s.clear) { s.clear = false; s.q = []; BK.dispose(S, s.qg); s.qg = new T3.Group(); s.g.add(s.qg); } if (s.throwq) { s.throwq = false; const x = -3.8 + Math.random() * 4.8, z = (Math.random() - 0.5) * 6; const fr = new T3.Mesh(new T3.TorusGeometry(0.71, 0.03, 6, 4), window.P3D.mat.paint(0xffffff)); fr.rotation.set(Math.PI / 2, 0, Math.PI / 4); fr.position.set(x, 0.05, z); s.qg.add(fr); const inQ = (p) => Math.abs(p[0] - x) < 0.5 && Math.abs(p[1] - z) < 0.5; s.q.push({ x, z, a: s.plants.filter((p) => p[2] === 0 && inQ(p)).length, b: s.plants.filter((p) => p[2] === 1 && inQ(p)).length }); } },
    overlay(ctx, s, c, S, B) { s.q.forEach((q) => BK.labc(S, B, q.x, 0.2, q.z, "A " + q.a + " · B " + q.b, "#ffd27a", -10, 9.5)); },
    hud: (s, c) => { const Q = s.q || [], n = Q.length, da = n ? Q.reduce((t, q) => t + q.a, 0) / n : 0, db = n ? Q.reduce((t, q) => t + q.b, 0) / n : 0, fa = n ? Q.filter((q) => q.a > 0).length / n * 100 : 0, area = 5.6 * 7; return [{ title: "Quadrat sampling (" + n + " quadrats)", lines: [["Species A (yellow, clumped): density " + f(da, 2) + " /m², frequency " + f(fa, 0) + "% → ≈ " + f(da * area, 0) + " in the field (true 300)", "#ffd27a"], ["Species B (green, scattered): density " + f(db, 2) + " /m² → ≈ " + f(db * area, 0) + " (true 300)", "#5bd68c"], "More quadrats → a better estimate. Dominant species: highest density or cover.", "—", ["Capture–recapture (Lincoln index): N = M × C ÷ R = " + c.M + " × " + c.C + " ÷ " + c.R + " ≈ " + f(c.M * c.C / c.R, 0), "#7cb3ff", true]] }]; },
    readouts: (s, c) => [["Quadrats", String((s.q || []).length)], ["Lincoln index", f(c.M * c.C / c.R, 0)]],
    draw: BK.fallback("Sampling", (s, c) => ["Density = number ÷ area sampled", "Lincoln index N = M × C ÷ R = " + f(c.M * c.C / c.R, 0)]),
  });

  /* ===================== WA3-e  biology & agriculture ===================== */
  BK.def3d("WA3-e", {
    label: "Photoreal 3D lab", title: "Biology in agriculture",
    blurb: "A farm plot: burn the bush, add fertiliser or pesticide, or switch to organic and mixed cropping — and watch soil life, yield and the river below.",
    env: "outdoor", cam: [[0.6, 4.6, 8.6], [1.0, 0.4, 0]], fov: 38,
    values: { burn: 0, fert: 40, pest: 20, method: "mono" },
    controls: [{ type: "toggle", key: "burn", label: "Bush burning" }, { key: "fert", label: "Chemical fertiliser", min: 0, max: 100, unit: "%" }, { key: "pest", label: "Pesticide use", min: 0, max: 100, unit: "%" }, { type: "tabs", key: "method", label: "Method", options: [["mono", "Monocropping"], ["mixed", "Mixed cropping + rotation"], ["organic", "Organic (manure, mulch)"]] }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); s.field = new T3.Mesh(new T3.PlaneGeometry(8, 5), BK.mat.soil([5, 3])); s.field.rotation.x = -Math.PI / 2; s.field.position.y = 0.01; g.add(s.field); s.crops = []; for (let i = 0; i < 40; i++) { const cr = BK.plant({ h: 0.9, leaves: 5, leafLen: 0.45, leafW: 0.16, leafCol: "#5f9a3a" }); cr.position.set(-3.5 + (i % 10) * 0.75, 0, -1.8 + Math.floor(i / 10) * 1.1); g.add(cr); s.crops.push(cr); }
      s.worms = new T3.InstancedMesh(new T3.CapsuleGeometry(0.02, 0.12, 4, 6), new T3.MeshStandardMaterial({ color: 0xc87a7a }), 60); const m4 = new T3.Matrix4(); for (let i = 0; i < 60; i++) { m4.compose(V((Math.random() - 0.5) * 7.5, 0.03, (Math.random() - 0.5) * 4.5), new T3.Quaternion().setFromEuler(new T3.Euler(0, Math.random() * 6, Math.PI / 2)), V(1, 1, 1)); s.worms.setMatrixAt(i, m4); } g.add(s.worms); s.river = new T3.Mesh(new T3.PlaneGeometry(9, 0.8), new T3.MeshPhysicalMaterial({ color: 0x2f6a8a, roughness: 0.05, clearcoat: 1 })); s.river.rotation.x = -Math.PI / 2; s.river.position.set(0, 0.02, 3.0); g.add(s.river); BK.shadow(g, true, true); },
    update(S, s, c, dt) { const org = c.method === "organic", mix = c.method === "mixed"; const soilLife = Math.max(0.05, 1 - c.pest / 120 - (c.burn ? 0.5 : 0) + (org ? 0.3 : 0)); const fertility = Math.max(0.2, 0.5 + c.fert / 200 + (org ? 0.35 : 0) + (mix ? 0.2 : 0) - (c.burn ? 0.15 : 0) - (c.method === "mono" ? 0.1 : 0)); const yieldI = Math.min(1.4, fertility * (1 - (c.pest < 10 && !mix ? 0.25 : 0))); s.life = soilLife; s.yi = yieldI; s.eut = (org ? 0.2 : 1) * c.fert / 100;
      s.worms.count = Math.round(60 * Math.min(1, soilLife)); s.crops.forEach((cr, i) => { const k = 0.5 + 0.6 * yieldI; cr.scale.set(k, k, k); }); s.field.material.color.setHex(c.burn ? 0x6a6a6a : 0xffffff); s.river.material.color.setHex(0x2f6a8a).lerp(new (T().Color)(0x4a8a2a), Math.min(1, s.eut)); if (c.burn && Math.random() < dt * 6) S.puff((Math.random() - 0.5) * 7, 0.2, (Math.random() - 0.5) * 4, { color: 0x5a5a5a, n: 2, size: 0.9, speed: 0.4, up: 1.2, life: 2.5, op: 0.5 }); },
    hud: (s, c) => [{ title: "Effects of farming practices", lines: [["Crop yield index " + f((s.yi || 0) * 100, 0) + " · soil organisms " + f((s.life || 0) * 100, 0) + "%", "#ffd27a", true], c.burn ? "Bush burning kills soil organisms, destroys humus, exposes soil to erosion and pollutes the air." : "No burning: organic matter returns to the soil.", c.fert > 60 && c.method !== "organic" ? "Excess fertiliser washes into the river → algal bloom (eutrophication)." : "Fertiliser replaces nutrients removed by crops.", c.pest > 50 ? "Heavy pesticide use kills useful insects (pollinators, predators) and accumulates in food chains." : "Pesticides control pests but must be used carefully.", "Plants by life cycle: annuals (maize), biennials (carrot), perennials (cocoa, oil palm)."] }],
    readouts: (s, c) => [["Yield index", f((s.yi || 0) * 100, 0)], ["Soil life", f((s.life || 0) * 100, 0) + "%"]],
    draw: BK.fallback("Biology in agriculture", ["Bush burning destroys soil organisms and humus", "Excess fertiliser → eutrophication; pesticides harm useful organisms"]),
  });

  /* ===================== WA5-a  competition ===================== */
  BK.def3d("WA5-a", {
    label: "Photoreal 3D lab", title: "Adaptation for survival — competition",
    blurb: "Maize seedlings sown thinly and thickly in trays: when crowded they compete for light, water and nutrients — tall, thin and weak plants result.",
    env: "lab", cam: [[1.2, 3.0, 6.4], [1.0, 0.8, 0]], fov: 38,
    values: { n: 25, weeks: 3, inter: 0 },
    controls: [{ key: "n", label: "Seedlings in the crowded tray", min: 4, max: 64, step: 1 }, { key: "weeks", label: "Time", min: 0, max: 6, step: 0.5, unit: "weeks" }, { type: "toggle", key: "inter", label: "Add a weed species (inter-specific)" }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) { const T3 = T(), key = c.n + "|" + c.weeks + "|" + c.inter;
      if (s.key !== key) { s.key = key; const g = BK.group(S, s), k = c.weeks / 6; const lm = BK.mat.leaf("#5f9a3a", "#a8c870"), wm = BK.mat.leaf("#8a9a3a", "#c8c870");
        [-1.4, 1.4].forEach((tx, ti) => { const tray = new T3.Mesh(new T3.BoxGeometry(2.2, 0.3, 2.2), window.P3D.mat.plastic(0x2a2a2a)); tray.position.set(tx, 0.15, 0); g.add(tray); const soil = new T3.Mesh(new T3.PlaneGeometry(2.1, 2.1), BK.mat.soil([1, 1])); soil.rotation.x = -Math.PI / 2; soil.position.set(tx, 0.31, 0); g.add(soil);
          const n = ti === 0 ? 4 : c.n, side = Math.ceil(Math.sqrt(n)), crowd = n / 4; const h = (0.2 + 1.4 * k) * (1 + Math.min(0.4, (crowd - 1) * 0.03)), thick = 0.03 / Math.sqrt(Math.max(1, crowd * 0.5)), leafS = 1 / Math.sqrt(Math.max(1, crowd * 0.35));
          for (let i = 0; i < n; i++) { const x = tx - 0.9 + (i % side + 0.5) * 1.8 / side, z = -0.9 + (Math.floor(i / side) + 0.5) * 1.8 / side, weed = c.inter && ti === 1 && i % 3 === 0; const pl = new T3.Group(); pl.add(tube([V(0, 0, 0), V(0, h * (weed ? 0.8 : 1), 0)], weed ? thick * 1.3 : thick, new T3.MeshPhysicalMaterial({ color: weed ? 0x8aaa4a : 0x9abf5a }), 6, 6)); for (let j = 0; j < 3; j++) { const lf = BK.leaf(0.4 * leafS * (0.5 + k), 0.06 * leafS + 0.02, weed ? wm : lm, 0.4); lf.rotation.x = -0.8; const pv = new T3.Group(); pv.position.y = h * (0.4 + j * 0.25); pv.rotation.y = j * 2.1 + i; pv.add(lf); pl.add(pv); } pl.position.set(x, 0.31, z); pl.visible = k > 0.02; g.add(pl); } }); BK.shadow(g, true, true); s.h1 = 0.2 + 1.4 * k; } },
    overlay(ctx, s, c, S, B) { BK.labc(S, B, -1.4, 0.0, 1.2, "4 seedlings — sturdy", "#5bd68c", 16); BK.labc(S, B, 1.4, 0.0, 1.2, c.n + " seedlings — crowded", "#ff7b72", 16); },
    hud: (s, c) => [{ title: c.inter ? "Inter-specific competition" : "Intra-specific competition", lines: ["Crowded seedlings compete for light, water, mineral salts and space.", ["Crowded plants: taller and thinner (etiolated), smaller leaves, lower dry mass per plant.", "#ffd27a"], c.inter ? "Weeds of another species compete with the crop — farmers weed to reduce this." : "Members of the same species have identical needs, so intra-specific competition is intense.", "Survival of the fittest: only the best adapted grow to maturity."] }],
    readouts: (s, c) => [["Crowding", f(c.n / 4, 1) + "× denser"], ["Weeks", c.weeks]],
    draw: BK.fallback("Competition", (s, c) => ["Crowded trays (" + c.n + " plants): thin, tall, weak seedlings", "Competition for light, water, nutrients, space"]),
  });
})();

/* ---------- cycles, energy flow and tolerance (Section C) ---------- */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, f = MK.fmt;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const tube = (pts, r, mat, seg = 60, rs = 12) => new (T().Mesh)(new (T().TubeGeometry)(new (T().CatmullRomCurve3)(pts), seg, r, rs), mat);
  const curve = (pts) => new (T().CatmullRomCurve3)(pts.map((p) => V(...p)));
  /* glowing particle streams along curves; streams = [{c:curve, col, on, n}] */
  function streams(S, g, list, n = 6) { return list.map((L) => { const sp = []; for (let i = 0; i < n; i++) { const d = window.P3D.S.mk.soft(L.col, L.size || 0.32, 0, 0, 0, 0.95); g.add(d); sp.push(d); } return Object.assign({ sp }, L); }); }
  function runStreams(st, t, sel) { st.forEach((L, k) => { const on = sel == null || sel === "all" || L.id === sel || (Array.isArray(sel) && sel.includes(L.id)); const rate = L.rate == null ? 1 : L.rate; L.sp.forEach((d, i) => { d.visible = on && rate > 0.02 && i < Math.max(1, Math.round(L.sp.length * Math.min(1, rate))); const u = (t * 0.25 * (L.speed || 1) + i / L.sp.length) % 1; d.position.copy(L.c.getPointAt(u)); d.material.opacity = 0.9 * Math.sin(u * Math.PI); }); }); }
  function bolt(a, b, seed) { const rr = BK.rng(seed), pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(V(a[0] + (b[0] - a[0]) * u + (i && i < 8 ? (rr() - 0.5) * 0.5 : 0), a[1] + (b[1] - a[1]) * u, a[2])); } const grp = new (T().Group)(); for (let i = 0; i < 8; i++) { const m = window.P3D.S.mk.beam(pts[i], pts[i + 1], 0xb8c8ff, 0.025); grp.add(m); } return grp; }
  function cloud(x, y, z, s = 1, col = 0xf2f4f8) { const grp = new (T().Group)(), m = new (T().MeshStandardMaterial)({ color: col, roughness: 1 }); for (let i = 0; i < 6; i++) { const b = new (T().Mesh)(new (T().SphereGeometry)(0.35 * s * (0.8 + (i % 3) * 0.2), 20, 14), m); b.position.set((i - 2.5) * 0.3 * s, Math.sin(i * 2) * 0.1 * s, (i % 2) * 0.2 * s); grp.add(b); } grp.position.set(x, y, z); return grp; }
  function soilBlock(g, w, d, depth, x = 0) { const T3 = T(); const blk = new T3.Mesh(new T3.BoxGeometry(w, depth, d), BK.mat.soil([w / 2, depth / 2])); blk.position.set(x, -depth / 2, 0); blk.receiveShadow = true; g.add(blk); const top = new T3.Mesh(new T3.PlaneGeometry(w, d), new T3.MeshStandardMaterial({ color: 0x5f8a34, roughness: 0.95 })); top.rotation.x = -Math.PI / 2; top.position.set(x, 0.005, 0); top.receiveShadow = true; g.add(top); return blk; }

  /* ===================== WA2-a  nitrogen cycle ===================== */
  const NPROC = { fix: ["Nitrogen fixation", "Rhizobium in root nodules of legumes (and free-living Azotobacter, Clostridium, Nostoc) turn N₂ into ammonium compounds."], light: ["Lightning", "Lightning makes N₂ combine with O₂ → oxides of nitrogen → nitric acid in rain → nitrates in soil."], abs: ["Absorption", "Roots take up nitrates by active transport; plants build amino acids and proteins."], feed: ["Feeding", "Animals eat plants and convert plant protein into animal protein."], decay: ["Decay (ammonification)", "Putrefying bacteria and fungi break down dead bodies, urine and faeces → ammonium compounds."], nitr: ["Nitrification", "Nitrosomonas: ammonium → nitrite (NO₂⁻). Nitrobacter: nitrite → nitrate (NO₃⁻). Needs oxygen (aerated soil)."], den: ["Denitrification", "Denitrifying bacteria (Pseudomonas, Thiobacillus denitrificans) turn nitrates back into N₂ gas — fastest in waterlogged, airless soil."] };
  BK.def3d("WA2-a", {
    label: "Photoreal 3D lab", title: "The nitrogen cycle",
    blurb: "A cut-away field: a bean plant with pink root nodules, lightning, a grazing goat and decaying leaves. Follow nitrogen as glowing particles between air, soil, plants and animals.",
    env: "outdoor", cam: [[0.8, 3.4, 8.6], [1.2, 1.9, 0]], fov: 40,
    values: { p: "all", wet: 0, legume: 1 },
    controls: [{ type: "select", key: "p", label: "Process", options: [["all", "Whole cycle"], ...Object.keys(NPROC).map((k) => [k, NPROC[k][0]])] }, { type: "toggle", key: "wet", label: "Waterlogged soil" }, { type: "toggle", key: "legume", label: "Legume (bean) crop" }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) { const T3 = T(), key = c.legume + "|" + c.wet;
      if (s.key !== key) { s.key = key; const g = BK.group(S, s); g.position.y = 1.6; soilBlock(g, 6.4, 1.6, 1.6, 0.4); const Z = 0.82; s.Z = Z;
        if (c.wet) { const w = new T3.Mesh(new T3.BoxGeometry(6.42, 0.6, 1.62), new T3.MeshPhysicalMaterial({ color: 0x3a6a9a, transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false })); w.position.set(0.4, -0.3, 0); g.add(w); const pud = new T3.Mesh(new T3.CircleGeometry(0.8, 32), window.P3D.mat.water(0x6a8aa8)); pud.rotation.x = -Math.PI / 2; pud.position.set(1.8, 0.02, 0.2); g.add(pud); }
        const rootM = new T3.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.7 }), nodM = new T3.MeshPhysicalMaterial({ color: 0xe8909a, roughness: 0.35, clearcoat: 0.6 });
        const pl = c.legume ? BK.plant({ h: 1.5, leaves: 7, leafLen: 0.4, leafW: 0.3 }) : BK.plant({ h: 1.6, leaves: 6, leafLen: 0.8, leafW: 0.1, leafCol: "#6a9a3a" }); pl.position.set(-1.8, 0, Z - 0.1); g.add(pl);
        const rr = BK.rng(2); for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.28, L = 0.5 + rr() * 0.5; const pts = [V(-1.8, 0, Z), V(-1.8 + Math.sin(a) * L * 0.5, -L * 0.5, Z + 0.02), V(-1.8 + Math.sin(a) * L, -L, Z + 0.03)]; g.add(tube(pts, 0.018, rootM, 12, 5)); if (c.legume) for (let k = 0; k < 3; k++) { const p = new T3.CatmullRomCurve3(pts).getPointAt(0.35 + k * 0.22); const n = new T3.Mesh(new T3.SphereGeometry(0.045 + rr() * 0.02, 12, 10), nodM); n.position.copy(p); n.position.z += 0.03; g.add(n); } }
        const goat = BK.quad(0.55, 0xd8c8a8); goat.position.set(0.2, 0, -0.3); goat.rotation.y = -0.4; g.add(goat); s.goat = goat;
        const lm = BK.mat.leaf("#8a6a2a", "#b8944a"); for (let i = 0; i < 14; i++) { const lf = BK.leaf(0.22, 0.12, lm, 0); lf.rotation.set(-Math.PI / 2 + 0.1, 0, rr() * 6.3); lf.position.set(0.9 + rr() * 0.9, 0.02, 0.2 + rr() * 0.5); g.add(lf); }
        const gm = BK.mat.leaf("#5f9a3a", "#9ccc7a"); for (let i = 0; i < 16; i++) { const t = BK.grassTuft(gm, 6, 0.25, i); t.position.set(-2.6 + rr() * 6, 0, -0.7 + rr() * 0.6); g.add(t); }
        g.add(cloud(2.6, 3.1, -0.4, 1.3, 0x8a90a0)); s.bolt = bolt([2.6, 2.8, -0.2], [2.4, 0.05, 0.4], 3); g.add(s.bolt);
        const P = { air: [0.4, 3.0, 0], nod: [-1.8, -0.5, Z + 0.08], leaf: [-1.8, 1.2, Z], goat: [0.2, 0.7, -0.3], dead: [1.3, 0.1, 0.4], nh4: [0.6, -0.6, Z + 0.06], no2: [1.6, -0.95, Z + 0.06], no3: [2.6, -0.55, Z + 0.06] }; s.P = P;
        s.st = streams(S, g, [
          { id: "fix", c: curve([P.air, [-1.2, 2.2, 0.5], [-2.2, 0.6, Z], P.nod]), col: 0x8fd0ff },
          { id: "fix", c: curve([P.nod, [-1.7, 0.2, Z], P.leaf]), col: 0x9fffb0 },
          { id: "light", c: curve([[2.5, 2.6, -0.2], [2.5, 1.0, 0.4], [2.6, 0, Z], P.no3]), col: 0xd8d8ff },
          { id: "abs", c: curve([P.no3, [1.0, -1.2, Z + 0.1], [-1.0, -0.9, Z + 0.1], [-1.75, -0.3, Z + 0.06], P.leaf]), col: 0x7cffb0 },
          { id: "feed", c: curve([P.leaf, [-0.9, 1.4, 0.3], P.goat]), col: 0xffd27a },
          { id: "decay", c: curve([P.goat, [0.8, 0.6, 0.2], P.dead]), col: 0xc8a070 },
          { id: "decay", c: curve([P.leaf, [-0.4, 0.9, 0.6], [0.8, 0.4, 0.5], P.dead]), col: 0xc8a070 },
          { id: "decay", c: curve([P.dead, [0.9, -0.2, Z], P.nh4]), col: 0xff9fb0 },
          { id: "nitr", c: curve([P.nh4, [1.1, -0.9, Z + 0.1], P.no2]), col: 0xffb06a },
          { id: "nitr", c: curve([P.no2, [2.1, -0.9, Z + 0.1], P.no3]), col: 0xffe06a },
          { id: "den", c: curve([P.no3, [3.2, 0.8, 0.5], [2.0, 2.4, 0.2], P.air]), col: 0xff7b72 },
        ], 7); BK.shadow(g, true, true); }
      const wet = c.wet, rate = { fix: c.legume ? 1 : 0.15, light: 0.5, abs: 1, feed: 0.7, decay: 0.8, nitr: wet ? 0.15 : 1, den: wet ? 1 : 0.15 }; s.st.forEach((L) => (L.rate = rate[L.id]));
      runStreams(s.st, S.t, c.p); const flash = (c.p === "all" || c.p === "light") && (S.t % 3.2) < 0.18; s.bolt.visible = flash; s.goat.rotation.y = -0.4 + Math.sin(S.t * 0.6) * 0.15;
      s.no3 = 50 + 25 * rate.fix + 10 * rate.light + 30 * rate.nitr - 40 * rate.den - 30; },
    overlay(ctx, s, c, S, B) { if (!s.P) return; const P = {}; Object.entries(s.P).forEach(([k, v]) => (P[k] = [v[0], v[1] + 1.6, v[2]])); BK.labc(S, B, ...P.air, "N₂ in the air (78%)", "#8fd0ff"); BK.labc(S, B, ...P.nod, c.legume ? "Root nodules — Rhizobium" : "No nodules (cereal)", "#ff9fb0", 18); BK.labc(S, B, ...P.nh4, "NH₄⁺ ammonium", "#ff9fb0", 18); BK.labc(S, B, ...P.no2, "NO₂⁻ nitrite", "#ffb06a", 18); BK.labc(S, B, ...P.no3, "NO₃⁻ nitrate", "#ffe06a", 18); BK.labc(S, B, ...P.dead, "Dead leaves, dung", "#c8a070", -14); BK.labc(S, B, -1.8, 3.4, s.Z, "Plant protein", "#9fffb0"); },
    hud: (s, c) => { const p = c.p === "all" ? null : NPROC[c.p]; return [{ title: p ? p[0] : "Nitrogen cycle", lines: [p ? p[1] : "Plants need nitrogen for proteins but cannot use N₂ gas directly — bacteria make it usable.", "—", ["Soil nitrate is " + ((s.no3 || 0) > 55 ? "rising" : (s.no3 || 0) > 35 ? "steady" : "falling"), (s.no3 || 0) > 35 ? "#5bd68c" : "#ff7b72", true], c.wet ? "Waterlogged: no air → nitrifiers slow, denitrifiers thrive; nitrogen is lost to the air." : "Aerated soil: nitrification works well.", c.legume ? "Legumes (beans, groundnut, cowpea) enrich soil — used in crop rotation." : "Cereals take nitrate but do not fix nitrogen."] }]; },
    readouts: (s, c) => [["Soil nitrate", (s.no3 || 0) > 55 ? "rising" : (s.no3 || 0) > 35 ? "steady" : "falling"], ["Process", c.p === "all" ? "whole cycle" : NPROC[c.p][0]]],
    table: () => MK.table(["Process", "Organisms", "Change"], [["Fixation", "Rhizobium, Azotobacter, Nostoc", "N₂ → NH₄⁺"], ["Ammonification", "Putrefying bacteria, fungi", "protein → NH₄⁺"], ["Nitrification", "Nitrosomonas → Nitrobacter", "NH₄⁺ → NO₂⁻ → NO₃⁻"], ["Denitrification", "Pseudomonas, Thiobacillus", "NO₃⁻ → N₂"]]),
    draw: BK.fallback("Nitrogen cycle", ["Fixation (Rhizobium), lightning → nitrates", "Decay → NH₄⁺ → NO₂⁻ (Nitrosomonas) → NO₃⁻ (Nitrobacter)", "Denitrification (Pseudomonas) → N₂"]),
  });

  /* ===================== WA3-b  energy flow ===================== */
  BK.def3d("WA3-b", {
    label: "Photoreal 3D lab", title: "Energy transformation in nature",
    blurb: "Sunlight falls on a grassland. Only a small part is captured by grass; at each step up the chain — grasshopper, frog, snake, hawk — most energy is lost as heat.",
    env: "outdoor", cam: [[1.0, 3.0, 8.8], [1.5, 0.9, 0]], fov: 40,
    values: { sun: 1000000, cap: 1, eff: 10 },
    controls: [{ key: "sun", label: "Sunlight reaching the grass", min: 200000, max: 2000000, step: 50000, unit: "kJ/m²/yr" }, { key: "cap", label: "Captured by photosynthesis", min: 0.5, max: 5, step: 0.1, unit: "%" }, { key: "eff", label: "Transfer to the next level", min: 2, max: 25, unit: "%" }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); const gr = new T3.Mesh(new T3.CircleGeometry(5.5, 64), new T3.MeshStandardMaterial({ color: 0x6a8a3a, roughness: 0.95 })); gr.rotation.x = -Math.PI / 2; g.add(gr); const gm = BK.mat.leaf("#5f9a3a", "#9ccc7a"), rr = BK.rng(5); for (let i = 0; i < 50; i++) { const t = BK.grassTuft(gm, 7, 0.34, i); t.position.set(-3.6 + rr() * 2.2, 0, -1.2 + rr() * 2.4); g.add(t); }
      const X = [-2.5, -0.9, 0.5, 1.9, 3.3]; s.X = X; const org = [null, BK.insect(0.55, 0x5a9a2a), BK.frog(0.9), BK.snake(0.6), BK.bird(1.1, 0x5a3a1a)]; org.forEach((o, i) => { if (!o) return; o.position.set(X[i], i === 4 ? 0.5 : i === 1 ? 0.2 : 0, 0.3); if (i === 4) o.rotation.y = -0.4; g.add(o); }); s.org = org;
      s.blocks = X.map((x, i) => { const b = new T3.Mesh(new T3.BoxGeometry(0.7, 1, 0.7), new T3.MeshPhysicalMaterial({ color: [0x5bd68c, 0xa8e05a, 0xffd27a, 0xffa05a, 0xff7b72][i], roughness: 0.2, transmission: 0.3, thickness: 0.4, emissive: [0x1a5a2a, 0x3a5a1a, 0x5a4a1a, 0x5a2a0a, 0x5a1a1a][i], emissiveIntensity: 0.5 })); b.position.set(x, 1, -1.0); g.add(b); return b; });
      s.sun = window.P3D.S.mk.soft(0xfff2b0, 2.4, -3.6, 4.6, -1.5, 1); g.add(s.sun); s.rays = []; for (let i = 0; i < 6; i++) { const b = window.P3D.S.mk.beam(V(-3.6, 4.5, -1.5), V(-3.4 + i * 0.4, 0.3, -0.6 + (i % 3) * 0.6), 0xfff2b0, 0.012); g.add(b); s.rays.push(b); }
      s.heat = []; for (let i = 0; i < 5; i++) for (let k = 0; k < 4; k++) { const h = window.P3D.S.mk.soft(0xff5a3a, 0.35, X[i], 0.5, 0.3, 0.7); g.add(h); s.heat.push({ h, i, k }); } BK.shadow(g, true, true); },
    update(S, s, c, dt) { const E = [c.sun * c.cap / 100]; for (let i = 1; i < 5; i++) E.push(E[i - 1] * c.eff / 100); s.E = E; const mx = Math.log10(E[0] + 1);
      s.blocks.forEach((b, i) => { const h = Math.max(0.03, 2.4 * Math.log10(E[i] + 1) / Math.max(1, mx)); b.scale.y = h; b.position.y = h / 2 + 0.02; });
      s.heat.forEach((q) => { const u = (S.t * 0.4 + q.k / 4 + q.i * 0.17) % 1; q.h.position.set(s.X[q.i] + Math.sin(u * 6 + q.k) * 0.2, 0.4 + u * 1.8, 0.3); q.h.material.opacity = 0.7 * (1 - u) * (q.i === 0 ? 1 : 0.8); });
      s.rays.forEach((r, i) => (r.userData.halo.material.opacity = 0.18 + 0.1 * Math.sin(S.t * 3 + i))); if (s.org[4] && s.org[4].wings) s.org[4].wings.forEach((w, i) => (w.rotation.x = (i ? 1 : -1) * (0.3 + 0.4 * Math.sin(S.t * 6)))); },
    overlay(ctx, s, c, S, B) { if (!s.E) return; const names = ["Grass", "Grasshopper", "Frog", "Snake", "Hawk"]; s.X.forEach((x, i) => BK.labc(S, B, x, s.blocks[i].scale.y + 0.25, -1.0, names[i] + " · " + MK.num(s.E[i], s.E[i] < 10 ? 2 : 0) + " kJ", ["#5bd68c", "#a8e05a", "#ffd27a", "#ffa05a", "#ff7b72"][i], 0, 9.5));
      const lost = 100 - c.cap; const x0 = 14, y0 = 300, w = 250; B.panel(x0, y0, w, 74); B.text("WHAT HAPPENS TO SUNLIGHT ON A LEAF", x0 + 10, y0 + 16, { size: 9.5, w: 700, color: "#ffd27a", halo: false }); const parts = [["captured", c.cap, "#5bd68c"], ["reflected", 15, "#9fc3ff"], ["transmitted", 10, "#c4a7ff"], ["heat / evaporation", lost - 25, "#ff7b72"]]; let xx = x0 + 10; parts.forEach(([n, v, col]) => { const ww = Math.max(3, (w - 20) * v / 100); ctx.fillStyle = col; ctx.fillRect(xx, y0 + 26, ww, 14); xx += ww; }); parts.forEach(([n, v, col], i) => B.text(n + " " + f(v, 1) + "%", x0 + 10 + (i % 2) * 120, y0 + 54 + Math.floor(i / 2) * 14, { size: 9.5, color: col, halo: false })); },
    hud: (s, c) => { const E = s.E || [0]; return [{ title: "Energy flow", lines: [["Grass captures " + c.cap + "% = " + MK.num(E[0], 0) + " kJ/m²/yr", "#5bd68c", true], "At each trophic level about " + c.eff + "% passes on; the rest is lost:", "• respiration (released as heat), movement", "• undigested food in faeces, dead parts to decomposers", ["Hawk receives only " + MK.num(E[4] || 0, 3) + " kJ — " + f((E[4] || 0) / c.sun * 100, 6) + "% of the sunlight", "#ff7b72"], "This is why food chains rarely exceed 4–5 links and pyramids of energy are never inverted."] }]; },
    readouts: (s, c) => [["Producers", MK.num((s.E || [0])[0], 0) + " kJ"], ["Top carnivore", MK.num((s.E || [0, 0, 0, 0, 0])[4], 2) + " kJ"]],
    draw: BK.fallback("Energy flow", (s, c) => ["Producers capture ≈ " + c.cap + "% of sunlight", "≈ " + c.eff + "% passes to each next level; rest lost as heat"]),
  });

  /* ===================== WA3-c  carbon and water cycles ===================== */
  const CPROC = { photo: ["Photosynthesis", "Green plants take CO₂ from the air and make sugars."], resp: ["Respiration", "Plants, animals and decomposers release CO₂."], comb: ["Combustion", "Burning fuels (wood, coal, petrol, gas) releases CO₂."], decomp: ["Decomposition", "Bacteria and fungi break down dead matter, releasing CO₂."], ocean: ["Ocean exchange", "CO₂ dissolves in sea water; used by algae and shells (CaCO₃)."], fossil: ["Fossilisation", "Buried remains over millions of years → coal, oil, gas."] };
  const WPROC = { evap: ["Evaporation", "The sun heats the sea, lakes and rivers; water vapour rises."], trans: ["Transpiration", "Plants lose water vapour through stomata."], cond: ["Condensation", "Vapour cools as it rises and forms clouds."], rain: ["Precipitation", "Rain, hail or snow falls back to the land and sea."], run: ["Run-off and infiltration", "Water flows over land in rivers, or soaks into the ground to recharge wells."] };
  BK.def3d("WA3-c", {
    label: "Photoreal 3D lab", title: "Carbon and water cycles",
    blurb: "One landscape, two cycles: watch carbon move between air, forest, animals, factory and sea, then switch to the water cycle — evaporation, transpiration, clouds and rain.",
    env: "outdoor", cam: [[0.6, 4.4, 10.2], [1.2, 1.5, 0]], fov: 40,
    values: { cyc: "carbon", p: "all", forest: 80, burn: 40 },
    controls: [{ type: "tabs", key: "cyc", label: "Cycle", options: [["carbon", "Carbon cycle"], ["water", "Water cycle"]] }, { type: "select", key: "p", label: "Process", options: [["all", "All processes"], ...Object.entries(CPROC).map(([k, v]) => [k, "Carbon · " + v[0]]), ...Object.entries(WPROC).map(([k, v]) => [k, "Water · " + v[0]])] }, { key: "forest", label: "Forest cover", min: 0, max: 100, unit: "%" }, { key: "burn", label: "Fossil-fuel burning", min: 0, max: 100, unit: "%", show: (c) => c.cyc === "carbon" }],
    syncAll: true,
    onChange(s, c, k) { if (k === "cyc") c.p = "all"; if (k === "p" && c.p !== "all") c.cyc = CPROC[c.p] ? "carbon" : "water"; },
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); g.position.y = 0.8; const sb = new T3.Mesh(new T3.BoxGeometry(7, 0.8, 6), BK.mat.soil([4, 1])); sb.position.set(-1.5, -0.41, 0); g.add(sb); const seab = new T3.Mesh(new T3.BoxGeometry(4.4, 0.8, 6), new T3.MeshPhysicalMaterial({ color: 0x1f4a7a, roughness: 0.1, transparent: true, opacity: 0.85 })); seab.position.set(3.6, -0.38, 0); g.add(seab); const land = new T3.Mesh(new T3.PlaneGeometry(7, 6, 40, 30), new T3.MeshStandardMaterial({ color: 0x6a8a3a, roughness: 0.95 })); const p = land.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.max(0, (-x + 1) * 0.18 + BK.fbm(x * 0.4, y * 0.4, 2) * 0.4)); } land.geometry.computeVertexNormals(); land.rotation.x = -Math.PI / 2; land.position.x = -1.5; g.add(land);
      const sea = new T3.Mesh(new T3.PlaneGeometry(4.4, 6), new T3.MeshPhysicalMaterial({ color: 0x1f5a8a, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.9 })); sea.rotation.x = -Math.PI / 2; sea.position.set(3.6, 0.03, 0); g.add(sea);
      s.trees = []; const rr = BK.rng(11); for (let i = 0; i < 18; i++) { const tr = BK.tree(1.1 + rr() * 0.5, i); tr.position.set(-4.4 + rr() * 2.6, 0.55 + rr() * 0.2, -2.2 + rr() * 3.2); g.add(tr); s.trees.push(tr); }
      const cow = BK.quad(0.6, 0x6a4a3a, { kind: "cow" }); cow.position.set(-0.6, 0.25, 1.2); g.add(cow); const fac = new T3.Group(); const bld = new T3.Mesh(new T3.BoxGeometry(0.9, 0.6, 0.6), window.P3D.mat.matte(0x8a7a6a)); bld.position.y = 0.3; fac.add(bld); const ch = new T3.Mesh(new T3.CylinderGeometry(0.08, 0.1, 1.2, 12), window.P3D.mat.matte(0x6a5a4a)); ch.position.set(0.25, 0.8, 0); fac.add(ch); fac.position.set(0.6, 0.12, -1.2); g.add(fac);
      const log = new T3.Mesh(new T3.CylinderGeometry(0.15, 0.18, 1.0, 14), BK.mat.bark()); log.rotation.z = Math.PI / 2; log.position.set(-1.2, 0.35, 2.0); g.add(log); const ms = BK.mushroom(0.45); ms.position.set(-1.1, 0.42, 2.12); g.add(ms);
      const river = tube([V(-3.6, 0.65, -2.4), V(-2.0, 0.4, -1.0), V(-0.4, 0.2, 0.0), V(1.4, 0.06, 0.4)], 0.12, new T3.MeshPhysicalMaterial({ color: 0x3a7aaa, roughness: 0.05, clearcoat: 1 }), 60, 8); river.scale.y = 0.2; g.add(river);
      const coal = new T3.Mesh(new T3.BoxGeometry(3.0, 0.22, 1.2), new T3.MeshPhysicalMaterial({ color: 0x141414, roughness: 0.4, clearcoat: 0.6 })); coal.position.set(-1.0, -0.45, 2.45); g.add(coal); s.coal = coal;
      s.clouds = [cloud(2.6, 3.4, -0.6, 1.4), cloud(-1.8, 3.6, -0.4, 1.6)]; s.clouds.forEach((cl) => g.add(cl)); s.rain = new T3.InstancedMesh(new T3.CapsuleGeometry(0.012, 0.12, 2, 4), new T3.MeshPhysicalMaterial({ color: 0x9fc8ff, transparent: true, opacity: 0.7 }), 160); g.add(s.rain); s.R = Array.from({ length: 160 }, () => [-3 + Math.random() * 2.6, Math.random() * 3.4, -1.2 + Math.random() * 1.6]);
      const A = { air: [0.6, 3.0, 0], tree: [-3.2, 1.8, -0.6], cow: [-0.6, 0.9, 1.2], fac: [0.85, 1.6, -1.2], dead: [-1.15, 0.6, 2.0], sea: [3.4, 0.1, 0.4], coal: [-0.6, -0.45, 2.9], cl: [2.6, 3.3, -0.6], cl2: [-1.8, 3.4, -0.4] }; s.A = A;
      s.cst = streams(S, g, [
        { id: "photo", c: curve([A.air, [-1.6, 2.6, -0.3], A.tree]), col: 0x7cffb0 },
        { id: "resp", c: curve([A.tree, [-1.8, 3.0, 0.4], A.air]), col: 0xc8c8c8 },
        { id: "resp", c: curve([A.cow, [0.0, 2.0, 0.8], A.air]), col: 0xc8c8c8 },
        { id: "comb", c: curve([A.fac, [0.9, 2.4, -0.8], A.air]), col: 0x7a7a7a, size: 0.45 },
        { id: "decomp", c: curve([A.dead, [-0.4, 1.8, 1.4], A.air]), col: 0xc8a070 },
        { id: "ocean", c: curve([A.air, [2.4, 1.8, 0.4], A.sea]), col: 0x8fd0ff },
        { id: "ocean", c: curve([A.sea, [2.0, 1.4, -0.2], A.air]), col: 0xd8e8ff },
        { id: "fossil", c: curve([A.dead, [-0.9, 0.1, 2.6], A.coal]), col: 0x8a6a4a },
        { id: "comb", c: curve([A.coal, [0.6, 0.3, 0.6], A.fac]), col: 0x8a6a4a } ], 7);
      s.wst = streams(S, g, [
        { id: "evap", c: curve([A.sea, [3.2, 1.8, -0.2], A.cl]), col: 0xd8ecff },
        { id: "trans", c: curve([A.tree, [-2.6, 2.8, -0.5], A.cl2]), col: 0xbfe8d0 },
        { id: "cond", c: curve([A.cl, [0.4, 3.9, -0.5], A.cl2]), col: 0xffffff, size: 0.5 },
        { id: "rain", c: curve([A.cl2, [-1.8, 1.8, -0.4], [-2.0, 0.6, -0.6]]), col: 0x8fc0ff },
        { id: "run", c: curve([[-3.6, 0.7, -2.4], [-2.0, 0.45, -1.0], [-0.4, 0.25, 0.0], [1.4, 0.1, 0.4], A.sea]), col: 0x6ab0ff },
        { id: "run", c: curve([[-2.2, 0.5, 0.2], [-1.4, -0.2, 0.4], [0.4, -0.25, 0.4], [2.4, -0.1, 0.4]]), col: 0x4a90d8 } ], 7); BK.shadow(g, true, true); s.co2 = 420; },
    update(S, s, c, dt) { const carbon = c.cyc === "carbon"; s.trees.forEach((tr, i) => (tr.visible = i / s.trees.length < c.forest / 100)); const fr = c.forest / 100;
      const rate = { photo: fr, resp: 0.8, comb: Math.max(0.05, c.burn / 100), decomp: 0.7, ocean: 0.7, fossil: 0.2, evap: 1, trans: fr, cond: 1, rain: 1, run: 1 }; [...s.cst, ...s.wst].forEach((L) => (L.rate = rate[L.id]));
      s.cst.forEach((L) => L.sp.forEach((d) => (d.visible = false))); s.wst.forEach((L) => L.sp.forEach((d) => (d.visible = false))); runStreams(carbon ? s.cst : s.wst, S.t, c.p);
      s.coal.visible = carbon; s.rain.visible = !carbon && (c.p === "all" || c.p === "rain"); if (s.rain.visible) { const m4 = new (T().Matrix4)(); s.R.forEach((r, i) => { r[1] -= dt * 3; if (r[1] < 0.5) r[1] = 3.3; m4.makeTranslation(r[0], r[1], r[2]); s.rain.setMatrixAt(i, m4); }); s.rain.instanceMatrix.needsUpdate = true; }
      s.clouds.forEach((cl, i) => (cl.visible = !carbon || i === 0)); const net = 2.6 * c.burn / 100 + 1.6 * (1 - fr) - 1.0 * fr; s.trend = net; },
    overlay(ctx, s, c, S, B) { if (!s.A) return; const A = {}; Object.entries(s.A).forEach(([k, v]) => (A[k] = [v[0], v[1] + 0.8, v[2]])); if (c.cyc === "carbon") { BK.labc(S, B, ...A.air, "CO₂ in the air", "#e8f1ff"); BK.labc(S, B, ...A.coal, "Fossil fuels", "#c8a070", 16); BK.labc(S, B, ...A.sea, "Ocean (dissolved CO₂)", "#8fd0ff", 14); BK.labc(S, B, ...A.fac, "Factory — combustion", "#c8c8c8", -12); } else { BK.labc(S, B, ...A.cl, "Clouds (condensation)", "#e8f1ff", -26); BK.labc(S, B, ...A.sea, "Sea", "#8fd0ff", 14); BK.labc(S, B, -0.4, 1.1, 0.0, "River (run-off)", "#6ab0ff", 14); BK.labc(S, B, -3.2, 3.2, -0.6, "Transpiration", "#bfe8d0"); } },
    hud: (s, c) => { const tab = c.cyc === "carbon" ? CPROC : WPROC, p = c.p !== "all" && tab[c.p]; const lines = c.cyc === "carbon" ? [["Atmospheric CO₂ trend: " + ((s.trend || 0) > 0.6 ? "rising fast" : (s.trend || 0) > 0 ? "rising slowly" : "balanced"), (s.trend || 0) > 0 ? "#ff7b72" : "#5bd68c", true], "CO₂–O₂ balance: photosynthesis removes CO₂ and adds O₂; respiration and burning do the reverse.", "Deforestation and burning fossil fuels raise CO₂ → greenhouse effect, global warming."] : ["The sun drives the water cycle; it purifies water by distillation.", "Importance: supplies fresh water, moves heat, shapes weather, supports all life.", c.forest < 40 ? "Low forest cover: less transpiration, more run-off and erosion, lower rainfall inland." : "Forests return much rainfall to the air by transpiration."]; return [{ title: p ? p[0] : c.cyc === "carbon" ? "Carbon cycle" : "Water cycle", lines: [p ? p[1] : "Select a process to follow its path.", "—", ...lines] }]; },
    readouts: (s, c) => [["Cycle", c.cyc], ["Forest", c.forest + "%"]],
    draw: BK.fallback("Carbon and water cycles", ["Carbon: photosynthesis, respiration, combustion, decomposition", "Water: evaporation, transpiration, condensation, precipitation, run-off"]),
  });

  /* ===================== WA3-d  tolerance ===================== */
  const SPP = [
    { n: "Tilapia", col: 0x7d8a6a, css: "#a8c070", T: [12, 22, 33, 41], S: [-1, 0, 15, 32], O: [1, 3 ] },
    { n: "Catfish (Clarias)", col: 0x4a4a3a, css: "#c8a070", T: [14, 24, 30, 38], S: [-1, 0, 4, 10], O: [0, 0.5] },
    { n: "Trout (cold water)", col: 0x8a9aa8, css: "#8fd0ff", T: [0, 10, 16, 25], S: [-1, 0, 20, 34], O: [5, 7] },
  ];
  const perf = (v, r) => (v <= r[0] || v >= r[3] ? 0 : v < r[1] ? (v - r[0]) / (r[1] - r[0]) : v > r[2] ? (r[3] - v) / (r[3] - r[2]) : 1);
  const perfO = (v, r) => (v <= r[0] ? 0 : v >= r[1] ? 1 : (v - r[0]) / (r[1] - r[0]));
  BK.def3d("WA3-d", {
    label: "Photoreal 3D lab", title: "Tolerance and limiting factors",
    blurb: "Three fish in one aquarium, each with its own range of tolerance. Change the temperature, salt and oxygen and see which survive, which are stressed and which die.",
    env: "lab", cam: [[1.0, 1.7, 6.6], [1.3, 0.45, 0]], fov: 38,
    values: { t: 27, sal: 2, o2: 6, fac: "t" },
    controls: [{ key: "t", label: "Water temperature", min: 0, max: 45, step: 0.5, unit: "°C" }, { key: "sal", label: "Salinity", min: 0, max: 35, step: 0.5, unit: "‰" }, { key: "o2", label: "Dissolved oxygen", min: 0, max: 10, step: 0.1, unit: "mg/dm³" }, { type: "tabs", key: "fac", label: "Graph", options: [["t", "Temperature"], ["sal", "Salinity"], ["o2", "Oxygen"]] }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); const tank = new T3.Mesh(new T3.BoxGeometry(3.6, 1.8, 1.6), window.P3D.mat.glass()); tank.position.set(0, 0.95, 0); tank.renderOrder = 3; g.add(tank); s.water = new T3.Mesh(new T3.BoxGeometry(3.5, 1.55, 1.5), new T3.MeshPhysicalMaterial({ color: 0x6ab0c8, transparent: true, opacity: 0.25, roughness: 0.05, depthWrite: false })); s.water.position.set(0, 0.85, 0); s.water.renderOrder = 2; g.add(s.water);
      const grav = new T3.Mesh(new T3.BoxGeometry(3.5, 0.12, 1.5), new T3.MeshStandardMaterial({ map: BK.spotTex("#c8b08a", "#8a7050", 500, 3), roughness: 0.9 })); grav.position.y = 0.12; g.add(grav); const wm = BK.mat.leaf("#3f8a3a", "#8ac870"); for (let i = 0; i < 9; i++) { const w = BK.grassTuft(wm, 9, 0.9 + (i % 3) * 0.25, i + 3); w.position.set(-1.6 + i * 0.4, 0.17, -0.5 + (i % 2) * 0.12); g.add(w); }
      const base = new T3.Mesh(new T3.BoxGeometry(3.9, 0.06, 1.9), window.P3D.mat.wood()); base.position.y = 0.03; g.add(base); s.fish = []; SPP.forEach((sp, k) => { for (let i = 0; i < 3; i++) { const fi = BK.fish(0.3, sp.col); g.add(fi); s.fish.push({ fi, k, i }); } }); s.therm = new T3.Mesh(new T3.CylinderGeometry(0.03, 0.03, 1.2, 10), window.P3D.mat.glass()); s.therm.position.set(1.65, 1.0, 0.6); g.add(s.therm); BK.shadow(g, true, true); },
    update(S, s, c, dt) { s.P = SPP.map((sp) => Math.min(perf(c.t, sp.T), perf(c.sal, sp.S), perfO(c.o2, sp.O))); s.fish.forEach(({ fi, k, i }) => { const p = s.P[k]; if (p <= 0) { fi.position.set(-1.2 + k * 1.1 + i * 0.25, 1.55, -0.2 + i * 0.25); fi.rotation.set(Math.PI, 0, 0); return; } const sp = (0.2 + p * 0.8), a = S.t * sp * 0.7 + i * 2 + k; fi.rotation.set(0, 0, 0); fi.position.set(Math.cos(a) * 1.3, 0.45 + k * 0.38 + Math.sin(a * 2) * 0.05 + (p < 0.5 ? 0.5 : 0), Math.sin(a) * 0.5); fi.rotation.y = -a - Math.PI / 2; if (fi.tail) fi.tail.rotation.y = Math.sin(S.t * 8 * sp) * 0.4; });
      s.water.material.color.setHex(0x6ab0c8).lerp(new (T().Color)(0x8a9a6a), Math.max(0, (5 - c.o2) / 5) * 0.6); },
    overlay(ctx, s, c, S, B) { if (!s.P) return; const key = c.fac, range = { t: [0, 45], sal: [0, 35], o2: [0, 10] }[key], lab = { t: "temperature (°C)", sal: "salinity (‰)", o2: "dissolved O₂ (mg/dm³)" }[key];
      BK.graph(B, 14, 262, 280, 128, { title: "Performance vs " + lab, x0: range[0], x1: range[1], y0: 0, y1: 1.1, series: SPP.map((sp) => { const pts = []; for (let i = 0; i <= 90; i++) { const v = range[0] + (range[1] - range[0]) * i / 90; pts.push([v, key === "t" ? perf(v, sp.T) : key === "sal" ? perf(v, sp.S) : perfO(v, sp.O)]); } return { pts, color: sp.css }; }), dot: [c[key], 1.05], xl: lab });
      SPP.forEach((sp, k) => BK.labc(S, B, -1.3 + k * 1.15, 2.0 + (k % 2) * 0.22, 0, sp.n.split(" (")[0] + ": " + (s.P[k] <= 0 ? "dead" : s.P[k] < 0.5 ? "stressed" : s.P[k] < 1 ? "tolerating" : "optimum"), sp.css, 0, 9.5)); },
    hud: (s, c) => [{ title: "Range of tolerance", lines: ["Each species survives only between a lower and an upper limit of each factor; it thrives in the optimum range.", ["Zones: optimum → stress (physiological strain) → intolerance (death).", "#ffd27a"], "Limiting factor: the factor nearest its limit controls survival (Shelford's law of tolerance).", "Catfish gulp air — they tolerate very low oxygen. Trout need cold, well-oxygenated water.", "Habitats: aquatic (marine, freshwater, estuarine) and terrestrial (forest, savanna, desert); in a balanced ecosystem numbers stay fairly steady."] }],
    readouts: (s, c) => (s.P ? SPP.map((sp, k) => [sp.n.split(" ")[0], s.P[k] <= 0 ? "dead" : f(s.P[k] * 100, 0) + "%"]) : []),
    draw: BK.fallback("Tolerance", (s, c) => ["Every species has a range of tolerance for each factor", "Temperature " + c.t + " °C, salinity " + c.sal + "‰, O₂ " + c.o2 + " mg/dm³"]),
  });
})();

/* b3d-body.js — realistic body-system views for the Biology lab (loads after the other b3d files).
   Uses the anatomy kit (bio-atlas.js, bio-atlas2.js): ghost body, fixed tissue colours, tap-to-isolate and a find-it game.
   S-c heart (outside, inside, double circulation) · S-e human lungs · B-g alimentary canal ·
   R-a endocrine glands · R-b brain · S-a arm and the muscular system */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, BA = window.BA, W = MK.when, f = MK.fmt;
  if (!BA || !BA.addMode) return;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const QUIZ = () => ({ type: "toggle", key: "quiz", label: "Game: find the part" });
  const part = (id, name, info, meshes, anchor, extra) => ({ id, name, info, meshes: [].concat(meshes || []), anchor: V(anchor[0], anchor[1], anchor[2]), extra });
  /* instanced dots that travel along curves */
  function dots(n, r, basic) { const T3 = T(), im = new T3.InstancedMesh(new T3.SphereGeometry(r, 10, 8), basic ? new T3.MeshBasicMaterial({ color: 0xffffff }) : new T3.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 0.6 }), n); im.instanceColor = new T3.InstancedBufferAttribute(new Float32Array(n * 3), 3); im.frustumCulled = false; im.userData.m4 = new T3.Matrix4(); im.userData.col = new T3.Color(); return im; }
  function putDot(im, i, p, hex, sc) { const m4 = im.userData.m4; if (sc != null) m4.makeScale(sc, sc, sc); else m4.identity(); m4.setPosition(p.x, p.y, p.z); im.setMatrixAt(i, m4); im.setColorAt(i, im.userData.col.setHex(hex)); }
  function flush(im) { im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; }

  /* =====================================================================
     S-c  Heart and double circulation
     ===================================================================== */
  const old = MK.scenes["S-c"] || {};
  const HP = {
    vent: ["Ventricles", "The two lower chambers. They pump blood out of the heart: the right to the lungs, the left to the whole body, so the left wall is much thicker."],
    atria: ["Atria (auricles)", "The two upper chambers. They receive blood from the veins and pass it down to the ventricles."],
    aorta: ["Aorta", "The main artery. Carries oxygenated blood from the left ventricle to the body at high pressure."],
    pulm: ["Pulmonary artery", "Carries deoxygenated blood from the right ventricle to the lungs. It is the only artery with deoxygenated blood."],
    cava: ["Venae cavae", "The two main veins. Bring deoxygenated blood from the body back to the right atrium."],
    pveins: ["Pulmonary veins", "Bring oxygenated blood from the lungs to the left atrium. They are the only veins with oxygenated blood."],
    coronary: ["Coronary vessels", "Supply the heart muscle itself with food and oxygen. A blocked coronary artery causes a heart attack."],
  };
  const HANCH = { vent: [0.1, -0.35, 0.5], atria: [-0.6, 0.5, 0.36], aorta: [0.3, 1.42, -0.1], pulm: [-0.1, 0.85, 0.36], cava: [-0.52, 1.6, 0.1], pveins: [0.98, 0.62, -0.3], coronary: [0.2, -0.5, 0.45] };
  const SEC = {
    ra: ["Right atrium", "Receives deoxygenated blood from the body through the venae cavae."], rv: ["Right ventricle", "Pumps deoxygenated blood to the lungs through the pulmonary artery. Thin wall: the lungs are close."],
    la: ["Left atrium", "Receives oxygenated blood from the lungs through the pulmonary veins."], lv: ["Left ventricle", "Pumps oxygenated blood to the whole body through the aorta."],
    wallL: ["Thick left ventricle wall", "About three times thicker than the right: it must push blood all round the body."], septum: ["Septum", "The wall of muscle that keeps oxygenated and deoxygenated blood apart."],
    tri: ["Tricuspid valve", "Three flaps between the right atrium and ventricle. Stops blood flowing back when the ventricle contracts."], bi: ["Bicuspid (mitral) valve", "Two flaps between the left atrium and ventricle. Stops backflow."],
    ao: ["Aorta", "To the body. A semilunar valve at its base stops blood falling back into the ventricle."], pa: ["Pulmonary artery", "To the lungs, with its own semilunar valve."],
    svc: ["Vena cava", "From the body."], pv: ["Pulmonary veins", "From the lungs."],
  };
  const beat = (s, c, dt) => { s.ph = ((s.ph || 0) + dt * c.hr / 60) % 1; const p = s.ph; s.at = p < 0.15 ? Math.sin(p / 0.15 * Math.PI) : 0; s.ve = p > 0.15 && p < 0.5 ? Math.sin((p - 0.15) / 0.35 * Math.PI) : 0; s.state = p < 0.15 ? "Atrial systole" : p < 0.5 ? "Ventricular systole" : "Diastole"; };
  const CAMS = { heart: [[2.1, 2.0, 8.6], [1.15, 1.72, 0]], inside: [[1.75, 1.75, 8.4], [1.25, 1.6, 0]], circ: [[1.15, 1.85, 6.3], [0.8, 1.72, 0]] };
  BK.def3d("S-c", Object.assign({}, old, {
    label: "Realistic 3D lab", title: "Heart and double circulation",
    blurb: "A beating heart you can turn and take apart: tap a vessel or chamber to isolate it, open the heart to watch the valves and the two streams of blood, then follow blood round the whole body.",
    env: "clinic", cam: CAMS.heart, fov: 34, free: true,
    values: { mode: "heart", hr: 72, sv: 70, ex: 0, quiz: 0 },
    controls: [{ type: "tabs", key: "mode", label: "View", options: [["heart", "The heart"], ["inside", "Inside the heart"], ["circ", "Double circulation"]] },
      { key: "hr", label: "Heart rate", min: 40, max: 190, unit: "beats/min" }, { key: "sv", label: "Stroke volume", min: 40, max: 120, unit: "cm³" },
      { type: "toggle", key: "ex", label: "Exercising muscles", show: W("mode", "circ") }, Object.assign(QUIZ(), { show: W("mode", "heart", "inside") })],
    syncAll: true,
    onChange(s, c, k) { if (k === "quiz" && s.aF) BA.focus.setQuiz(s, c.quiz); if (k === "ex") { c.hr = c.ex ? 150 : 72; c.sv = c.ex ? 110 : 70; } },
    build(S, s, c) { s.key = ""; s.ph = 0; BA.focus.init(S, s); },
    update(S, s, c, dt) {
      const T3 = T();
      if (s.key !== c.mode) {
        const first = s.key === ""; s.key = c.mode; const g = BK.group(S, s); s.aparts = null; s.aF.sel = null; s.heart = s.sec = s.net = null;
        if (c.mode === "heart") {
          const h = BA.heart(); h.scale.setScalar(1.12); h.position.set(0, 1.5, 0); g.add(h); s.heart = h; s.aparts = {};
          Object.keys(HP).forEach((id) => { const ms = [].concat(h.parts[id]); ms.forEach((m) => { m.userData.part = id; }); const a = HANCH[id]; s.aparts[id] = part(id, HP[id][0], HP[id][1], ms, [a[0] * 1.12, 1.5 + a[1] * 1.12, a[2] * 1.12]); });
        } else if (c.mode === "inside") {
          const h = BA.heartSection(); h.scale.setScalar(1.25); h.position.set(0, 1.35, 0.3); g.add(h); s.sec = h; s.aparts = {};
          Object.keys(SEC).forEach((id) => { const a = h.anch[id]; s.aparts[id] = part(id, SEC[id][0], SEC[id][1], [], [a[0] * 1.25, 1.35 + a[1] * 1.25, 0.3 + a[2] * 1.25]); });
          /* invisible pick targets so the chambers can be tapped */
          Object.keys(SEC).forEach((id) => { const p = s.aparts[id], m = new T3.Mesh(new T3.SphereGeometry(["ra", "la", "rv", "lv"].includes(id) ? 0.24 : 0.12, 10, 8), new T3.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); m.position.copy(p.anchor); m.userData.part = id; m.userData.pick = true; g.add(m); p.meshes.push(m); });
          s.cellR = dots(46, 0.035); s.cellL = dots(46, 0.035); h.add(s.cellR, s.cellL); s.u = Array.from({ length: 46 }, (_, i) => i / 46);
        } else {
          s.body = BA.body({ dark: S.clinicDark }); g.add(s.body);
          const O = BA.organs({ only: ["heart", "lungR", "lungL", "kidneyR", "kidneyL", "liver"], fast: true }); g.add(O.group); s.org = O.parts;
          ["lungR", "lungL", "liver", "kidneyR", "kidneyL"].forEach((id) => O.parts[id].meshes.forEach((m) => { m.material.transparent = true; m.material.opacity = 0.42; m.material.depthWrite = false; }));
          s.net = BA.vessels(); g.add(s.net.group);
          s.aparts = { lungs: part("lungs", "Lungs: blood takes up oxygen", "", [], [-0.3, 2.45, 0.1]), heartL: part("heartL", "Heart", "", [], [0.08, 2.28, 0.15]), art: part("art", "Artery (away from the heart)", "", [], [0.2, 0.95, 0.03]), vein: part("vein", "Vein (back to the heart)", "", [], [-0.62, 1.95, -0.03]), muscle: part("muscle", "Body tissues", "", [], [-0.2, 1.1, 0.03]) };
          s.legs = [-1, 1].map((sd) => { const m = new T3.Mesh(new T3.SphereGeometry(0.1, 16, 12), BK.mat.glow(0xff5a3a, 0)); m.scale.set(1, 2.6, 1); m.position.set(sd * 0.2, 1.1, 0.02); g.add(m); return m; });
        }
        BA.view(S, CAMS[c.mode][0], CAMS[c.mode][1]); if (first) { const o = S.orbit; o.yaw = o.ty; o.pitch = o.tp; o.r = o.tr; }
        BA.focus.setQuiz(s, 0); if (c.quiz && c.mode !== "circ") BA.focus.setQuiz(s, 1);
      }
      beat(s, c, dt); const flow = (c.hr * c.sv) / (72 * 70);
      if (s.heart) { s.heart.vent.scale.setScalar(1 - 0.06 * s.ve); s.heart.atria.scale.setScalar(1 - 0.09 * s.at); }
      if (s.sec) {
        const h = s.sec; h.scale.setScalar(1.25 * (1 - 0.025 * s.ve));
        const avOpen = s.ve > 0.05 ? 0 : 1, slOpen = s.ve > 0.05 ? 1 : 0; s.av = (s.av == null ? avOpen : s.av + (avOpen - s.av) * Math.min(1, dt * 14));
        [h.tri, h.bi].forEach((v) => v.forEach((piv) => { piv.rotation.z = piv.userData.s * -1.15 * s.av; }));
        h.semi.forEach((m) => { m.scale.setScalar(0.7 + 0.5 * slOpen); });
        /* blood moves in two steps: atria → ventricles in diastole, ventricles → arteries in systole */
        const sp = dt * 0.16 * flow;
        for (let i = 0; i < 46; i++) { const u0 = s.u[i]; let v = sp * (0.35 + (u0 < 0.5 ? (1 - s.ve) * 1.5 + s.at : s.ve * 3.2)); s.u[i] = (u0 + v) % 1;
          putDot(s.cellR, i, h.pathR.getPointAt(s.u[i]), 0x4a63ff); putDot(s.cellL, i, h.pathL.getPointAt(s.u[i]), 0xff3b30); }
        flush(s.cellR); flush(s.cellL);
      }
      if (s.net) { const hh = s.org.heart.obj; hh.vent.scale.setScalar(1 - 0.08 * s.ve); hh.atria.scale.setScalar(1 - 0.1 * s.at); s.net.group.step(dt, flow * (0.55 + 1.6 * s.ve)); s.legs.forEach((m) => { m.material.opacity += ((c.ex ? 0.3 + 0.1 * Math.sin(S.t * 6) : 0) - m.material.opacity) * Math.min(1, dt * 4); }); }
      BA.focus.update(S, s, dt);
    },
    overlay(ctx, s, c, S, B) {
      if (c.mode === "heart") BA.focus.overlay(S, s, B, { labels: ["aorta", "pulm", "cava", "atria", "vent", "coronary", "pveins"] });
      else if (c.mode === "inside") { BA.focus.overlay(S, s, B, { labels: ["svc", "ra", "tri", "rv", "septum", "pa", "ao", "pv", "la", "bi", "lv", "wallL"], reach: 40 }); B.pill("Blue = deoxygenated   Red = oxygenated", 12, 388, "#a9b6d3", 10); }
      else { s.aparts.muscle.name = c.ex ? "Working muscles: more blood" : "Body tissues: oxygen delivered"; BA.focus.overlay(S, s, B, { labels: ["lungs", "heartL", "art", "vein", "muscle"], hint: false, side: (id) => id === "lungs" || id === "vein" || id === "muscle" }); B.pill("Arteries red · veins blue", 12, 388, "#a9b6d3", 10); }
    },
    hud: (s, c) => { const co = c.hr * c.sv / 1000; const base = [{ title: "Cardiac cycle", lines: [[s.state || "", "#ffd27a", true], ["Cardiac output = heart rate × stroke volume", "#e8f1ff"], ["= " + c.hr + " × " + c.sv + " cm³ = " + f(co, 2) + " dm³/min", "#5bd68c"]].concat(c.mode === "inside" ? [(s.ve || 0) > 0.05 ? "Ventricles contract: tricuspid and bicuspid valves shut ('lub'), semilunar valves open." : "Ventricles relax: semilunar valves shut ('dub'), blood fills the ventricles.", "Right side → lungs. Left side → body."] : c.mode === "circ" ? ["Pulmonary circulation: heart → lungs → heart.", "Systemic circulation: heart → body → heart.", "Blood passes through the heart twice in one circuit, so pressure stays high."] : ["Right side pumps to the lungs, left side to the body.", "Valves keep the blood flowing one way."]) }]; return c.mode === "circ" ? base : BA.focus.card(s, base); },
    readouts: (s, c) => [["Heart rate", c.hr + " /min"], ["Cardiac output", f(c.hr * c.sv / 1000, 2) + " dm³/min"], ["Phase", s.state || ""]],
  }));

  /* =====================================================================
     S-e  Human lungs (new first view)
     ===================================================================== */
  BA.INFO.bronchi = ["Bronchi and bronchioles", "respiratory", "Each bronchus divides again and again into narrower bronchioles that end in the air sacs (alveoli)."];
  (function () {
    const sc = MK.scenes["S-e"]; if (!sc) return;
    const rate = sc.controls.find((q) => q.key === "rate"), sh = rate.show; rate.show = (c) => c.mode === "lungs" || sh(c);
    BA.addMode("S-e", "lungs", {
      label: "Human lungs", first: true, cam: [[0.95, 2.42, 2.55], [0.48, 2.36, 0]],
      blurb: "Real lungs in a see-through chest: watch the ribs lift and the diaphragm flatten as air is drawn down the windpipe, look inside the left lung at the bronchial tree, then try the bell-jar model, alveoli, gills and stomata.",
      values: { ribs: 1, quiz: 0 },
      controls: [{ type: "toggle", key: "ribs", label: "Rib cage" }, QUIZ()],
      make(S, s, c, g) {
        const T3 = T(); g.add(BA.body({ dark: S.clinicDark }));
        const O = BA.extra(BA.organs({ only: ["trachea", "lungR", "lungL", "diaphragm", "heart"], fast: true }), ["ribs"]); g.add(O.group); s.aparts = O.parts;
        const lm = O.parts.lungL.meshes[0]; lm.userData.baseOp = 0.34; lm.userData.soft = true;
        const br = BA.bronchi(1, 31); br.userData.part = "bronchi"; O.group.add(br); s.aparts.bronchi = part("bronchi", BA.INFO.bronchi[0], BA.INFO.bronchi[2], [br], [0.2, 2.3, 0.06]);
        s.air = dots(40, 0.011, true); g.add(s.air); s.airP = [BA.curve([[0, 3.0, 0.1], [0, 2.93, 0.035], [0, 2.56, 0.0], [0, 2.5, -0.01], [-0.07, 2.44, -0.01], [-0.16, 2.38, -0.01], [-0.2, 2.3, 0.0]]), BA.curve([[0, 3.0, 0.1], [0, 2.93, 0.035], [0, 2.56, 0.0], [0, 2.5, -0.01], [0.07, 2.44, -0.01], [0.16, 2.38, -0.01], [0.21, 2.28, 0.0]])];
        s.airU = Array.from({ length: 40 }, (_, i) => i / 40); s.ph = 0; s.hb = 0;
      },
      update(S, s, c, dt) {
        const P = s.aparts; s.ph = (s.ph + dt * c.rate / 60) % 1; const b = 0.5 - 0.5 * Math.cos(s.ph * Math.PI * 2), inn = s.ph < 0.5; s.br = b; s.inn = inn;
        for (const id of ["lungR", "lungL"]) { const m = P[id].meshes[0], cx = id === "lungR" ? -0.19 : 0.19; m.scale.set(1 + 0.06 * b, 1 + 0.045 * b, 1 + 0.1 * b); m.position.set(-cx * 0.06 * b, -2.39 * 0.045 * b + 0.028 * b, 0); }
        const d = P.diaphragm.meshes[0]; d.scale.y = 1 - 0.09 * b; d.position.y = 1.76 * 0.09 * b - 0.03 * b;
        P.ribs.hidden = !c.ribs; const r = P.ribs.meshes[0]; r.scale.set(1 + 0.045 * b, 1, 1 + 0.07 * b); r.position.set(0, 0.022 * b, 0.012 * b);
        s.hb = (s.hb + dt * 1.2) % 1; const hh = P.heart.obj; hh.vent.scale.setScalar(1 - 0.07 * (s.hb > 0.15 && s.hb < 0.5 ? Math.sin((s.hb - 0.15) / 0.35 * Math.PI) : 0));
        const sp = dt * c.rate / 60 * 2.0 * Math.sin(s.ph * Math.PI * 2);
        for (let i = 0; i < 40; i++) { s.airU[i] = ((s.airU[i] + sp) % 1 + 1) % 1; putDot(s.air, i, s.airP[i % 2].getPointAt(s.airU[i]), inn ? 0x4aa8ff : 0x9aa7bd); } flush(s.air);
      },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["trachea", "lungR", "bronchi", "heart", "diaphragm"].concat(c.ribs ? ["ribs"] : []) }); },
      hud: (s, c) => BA.focus.card(s, [{ title: s.inn ? "Inspiration (breathing in)" : "Expiration (breathing out)", lines: [s.inn ? "Diaphragm contracts and flattens; ribs move up and out." : "Diaphragm relaxes and domes up; ribs move down and in.", s.inn ? "Volume of the thorax increases → pressure falls → air is drawn in." : "Volume of the thorax decreases → pressure rises → air is pushed out.", ["Lung volume ≈ " + f(2.5 + 0.5 * (s.br || 0), 2) + " dm³ (tidal volume 0.5 dm³)", "#7cb3ff"], ["Ventilation = " + c.rate + " × 0.5 = " + f(c.rate * 0.5, 1) + " dm³/min", "#5bd68c"], ["The left lung is drawn see-through to show the bronchial tree.", "#a9b6d3"]] }]),
      readouts: (s, c) => [["Breaths", c.rate + " /min"], ["Ventilation", f(c.rate * 0.5, 1) + " dm³/min"], ["Phase", s.inn ? "Inspiration" : "Expiration"]],
    });
  })();

  /* =====================================================================
     B-g  Alimentary canal (replaces the old tube-in-a-mannequin view)
     ===================================================================== */
  (function () {
    if (!MK.scenes["B-g"]) return;
    const ST = [["mouth", "Mouth", "Teeth chew; salivary amylase starts starch → maltose. pH about 7.", 0xd9a441, "20–30 s"], ["gullet", "Oesophagus", "Peristalsis pushes the bolus down. No digestion here.", 0xd9a441, "about 8 s"], ["stomach", "Stomach", "Gastric juice: pepsin starts protein → peptides; hydrochloric acid (pH 2) kills germs; rennin clots milk.", 0xc98a3a, "3–4 hours"],
      ["smallInt", "Small intestine", "Duodenum: bile emulsifies fats; pancreatic juice adds amylase, trypsin and lipase. Ileum: digestion is completed and food is absorbed through the villi.", 0xb89a50, "4–6 hours"], ["largeInt", "Large intestine", "Water and mineral salts are absorbed. Faeces are stored in the rectum and egested through the anus.", 0x7a5230, "12–24 hours"]];
    BA.addMode("B-g", "canal", {
      label: "Alimentary canal", cam: [[0.95, 2.26, 3.45], [0.55, 2.16, 0]],
      blurb: "Follow a mouthful of food through a realistic digestive system, from the teeth to the rectum. Tap any organ to isolate it and read what it does, then compare the teeth of a human, a goat and a dog.",
      values: { jsp: 1, quiz: 0 },
      controls: [{ key: "jsp", label: "Journey speed", min: 0, max: 4, step: 0.5, unit: "×" }, QUIZ()],
      make(S, s, c, g) {
        g.add(BA.body({ dark: S.clinicDark }));
        const O = BA.extra(BA.organs({ only: ["gullet", "stomach", "liver", "gall", "pancreas", "smallInt", "largeInt"] }), ["mouth", "saliva"]); g.add(O.group); s.aparts = O.parts;
        const P = BA.paths, seg = [[[0, 2.995, 0.2], [0, 2.995, 0.1], [0, 2.99, 0.04]], P.gullet, P.stomach.map((p) => [p[0], p[1], p[2]]), P.small, P.colon];
        const len = seg.map((q) => BA.curve(q).getLength()), tot = len.reduce((a, b) => a + b, 0); let acc = 0; s.th = len.map((l) => (acc += l) / tot);
        s.curve = BA.curve([].concat(...seg)); s.u = 0; s.reg = 0;
        s.bolus = new (T().Mesh)(new (T().SphereGeometry)(0.024, 16, 12), new (T().MeshPhysicalMaterial)({ color: 0xd9a441, roughness: 0.5, emissive: 0xffc24a, emissiveIntensity: 0.5 })); s.bolus.renderOrder = 8; s.bolus.material.depthTest = false; g.add(s.bolus);
      },
      update(S, s, c, dt) {
        const sp = [0.5, 0.9, 0.35, 0.55, 0.45][s.reg] || 0.5; s.u = (s.u + dt * 0.04 * c.jsp * sp) % 1;
        s.reg = s.th.findIndex((t) => s.u < t); if (s.reg < 0) s.reg = 4;
        s.bolus.position.copy(s.curve.getPointAt(s.u)); s.bolus.material.color.setHex(ST[s.reg][3]); s.bolus.scale.setScalar(1 + 0.18 * Math.sin(S.t * 9)); s.bolus.visible = !s.aF.quiz;
        s.aF.auto = s.aF.sel ? null : ST[s.reg][0];
      },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["mouth", "saliva", "gullet", "liver", "gall", "stomach", "pancreas", "largeInt", "smallInt"] }); if (!s.aF.quiz && !s.aF.sel && s.bolus) { const p = s.bolus.position, q = MK.proj(S, p.x, p.y, p.z); B.dot(q.x, q.y, "#ffd27a", 4); } },
      hud: (s, c) => BA.focus.card(s, [{ title: "Journey of food", lines: [["Now in the " + ST[s.reg || 0][1].toLowerCase() + " (" + ST[s.reg || 0][4] + ")", "#ffd27a", true], ST[s.reg || 0][2], "—", "Ingestion → digestion → absorption → assimilation → egestion.", ["Peristalsis: waves of muscle contraction push food along.", "#7cb3ff"]] }]),
      readouts: (s, c) => [["Region", ST[s.reg || 0][1]], ["Time spent there", ST[s.reg || 0][4]]],
    });
  })();

  /* =====================================================================
     R-a  Endocrine glands
     ===================================================================== */
  (function () {
    const sc = MK.scenes["R-a"]; if (!sc) return;
    const GL = { pituitary: ["pit", "Growth hormone, ADH, FSH, LH, TSH", "Too much growth hormone: gigantism.", "Too little: dwarfism. Too little ADH: diabetes insipidus.", ["thyroid", "adrenal", "ovary", "kidneyL", "kidneyR"]],
      thyroid: ["thy", "Thyroxine: controls metabolic rate and growth", "Overactive: fast metabolism, weight loss, bulging eyes.", "Underactive: goitre (lack of iodine), cretinism in children.", ["heart", "liver", "legs"]],
      adrenal: ["adr", "Adrenaline: 'fight or flight'", "Excess: high blood pressure.", "Shortage: weakness, low blood pressure.", ["heart", "liver", "legs"]],
      islets: ["pan", "Insulin lowers blood glucose; glucagon raises it", "Too much insulin: hypoglycaemia (fainting).", "Too little insulin: diabetes mellitus (glucose in the urine).", ["liver", "legs"]],
      ovary: ["gon", "Oestrogen and progesterone (testosterone in the testes)", "Early puberty.", "Delayed puberty, infertility.", ["uterus", "chest"]] };
    const TG = { heart: [0.055, 2.28, 0.075], liver: [-0.14, 1.99, 0.05], legs: [0.2, 1.05, 0.03], uterus: [0, 1.41, 0.03], chest: [0.2, 2.42, 0.16] };
    const byOld = {}; Object.keys(GL).forEach((k) => { byOld[GL[k][0]] = k; });
    BA.addMode("R-a", "gland", {
      label: "Endocrine glands", cam: [[0.95, 2.3, 3.7], [0.55, 2.22, 0]],
      blurb: "The endocrine glands in their real places inside a see-through body. Tap a gland to isolate it, release its hormone and watch it travel in the blood to its target organs.",
      values: { quiz: 0 }, controls: [QUIZ()],
      onChange(s, c, k) { if (k === "gl") BA.focus.select(s, byOld[c.gl]); },
      make(S, s, c, g) {
        g.add(BA.body({ dark: S.clinicDark }));
        const O = BA.extra(BA.organs({ only: ["kidneyR", "kidneyL", "pancreas", "brain", "heart", "liver"], fast: true }), ["pituitary", "thyroid", "adrenal", "islets", "ovary"]); g.add(O.group); s.aparts = O.parts;
        ["kidneyR", "kidneyL", "brain", "heart", "liver"].forEach((id) => { const p = O.parts[id]; p.noQuiz = true; p.context = true; p.meshes.forEach((m) => { m.userData.baseOp = 0.3; m.userData.soft = true; }); });
        s.horm = dots(60, 0.012, true); g.add(s.horm); s.hu = Array.from({ length: 60 }, (_, i) => i / 60); s.hp = null; s.hsel = "";
      },
      update(S, s, c, dt) {
        const P = s.aparts, F = s.aF, sel = F.sel && GL[F.sel] ? F.sel : null; F.also = sel ? GL[sel][4] : null;
        if (s.hsel !== (sel || "")) { s.hsel = sel || ""; s.hp = sel ? GL[sel][4].map((t) => { const a = P[sel].anchor, b = P[t] ? P[t].anchor : V(...TG[t]); const m = a.clone().lerp(b, 0.5); m.x += 0.1; m.z -= 0.05; return BA.curve([a, m, b]); }) : null; }
        for (let i = 0; i < 60; i++) { if (!s.hp) { putDot(s.horm, i, V(0, -5, 0), 0xffd24a, 0.001); continue; } s.hu[i] = (s.hu[i] + dt * 0.28) % 1; const cv = s.hp[i % s.hp.length], u = s.hu[i]; putDot(s.horm, i, cv.getPointAt(u), 0xffc21a, Math.sin(u * Math.PI) * 1.2 + 0.2); } flush(s.horm);
        /* context organs stay visible (faint) when a gland is isolated, if they are its targets */
        Object.values(P).forEach((p) => { if (p.context) p.hidden = false; });
      },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["pituitary", "thyroid", "adrenal", "islets", "ovary"], hint: "Tap a gland to release its hormone" }); },
      hud: (s, c) => { const F = s.aF, id = F && F.sel && GL[F.sel] ? F.sel : null; if (F && F.quiz) return BA.focus.card(s); return id ? [{ title: s.aparts[id].name, lines: [["Hormone: " + GL[id][1], "#ffd27a"], s.aparts[id].info, "—", ["Too much: " + GL[id][2], "#ff7b72"], ["Too little: " + GL[id][3], "#7cb3ff"], ["Yellow dots: the hormone carried in the blood to its target organs.", "#a9b6d3"]] }] : BA.focus.card(s, [{ title: "Endocrine system", lines: ["Ductless glands release hormones straight into the blood.", "Each hormone affects only its target organs.", ["Hormones act more slowly than nerves, but their effects last longer and spread wider.", "#7cb3ff"], ["The pancreas is both a digestive gland and an endocrine gland.", "#a9b6d3"]] }]); },
      readouts: (s, c) => { const F = s.aF, P = s.aparts || {}; return [["Gland", F && F.sel && P[F.sel] ? P[F.sel].name : "tap one"]]; },
    });
    const oldSel = sc.controls.find((q) => q.key === "gl"); if (oldSel) oldSel.label = "Go to gland";
  })();

  /* =====================================================================
     R-b  Brain
     ===================================================================== */
  (function () {
    const sc = MK.scenes["R-b"]; if (!sc) return;
    const oldSel = sc.controls.find((q) => q.key === "part"); if (oldSel) oldSel.show = () => false;
    BA.addMode("R-b", "brain", {
      label: "Brain", dark: true, cam: [[5.2, 2.5, 4.6], [0.85, 1.75, -0.7]],
      blurb: "Touch a hot object and follow the impulse round the reflex arc, see how myelin speeds up a neurone, then explore a 3D brain: tap a lobe or region to isolate it and learn what it controls.",
      values: { quiz: 0 }, controls: [QUIZ()],
      make(S, s, c, g) {
        const b = BA.brain({ cell: 0.027 }); b.scale.setScalar(1.45); b.position.set(0, 2.0, 0); b.rotation.y = 0; g.add(b); s.brain = b; s.aparts = {};
        Object.values(b.parts).forEach((p) => { s.aparts[p.id] = part(p.id, p.name, p.info, p.meshes, [p.anchor.x * 1.45, 2.0 + p.anchor.y * 1.45, p.anchor.z * 1.45]); });
        ["frontal", "parietal", "temporal", "occipital"].forEach((id) => { s.aparts[id].extra = [["Part of the cerebrum, the largest part of the brain.", "#7cb3ff"]]; });
      },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["frontal", "parietal", "occipital", "temporal", "cerebellum", "hypo", "medulla", "cord"], hint: "Tap a region to isolate it" }); },
      hud: (s, c) => BA.focus.card(s, [{ title: "The brain", lines: ["Cerebrum (four lobes): thought, memory, senses and voluntary movement.", "Cerebellum: balance and coordination.", "Medulla oblongata: heartbeat and breathing.", ["Hypothalamus: temperature, water balance; controls the pituitary.", "#e8f1ff"], ["CNS = brain + spinal cord. Colours here are a teaching code, not real tissue colours.", "#a9b6d3"]] }]),
      readouts: (s, c) => { const F = s.aF, P = s.aparts || {}; return F && F.quiz ? [["Score", F.score + " / " + F.tries]] : [["Region", F && F.sel && P[F.sel] ? P[F.sel].name : "tap one"]]; },
    });
  })();

  /* =====================================================================
     S-a  Muscular system (new first view) and a realistic arm
     ===================================================================== */
  (function () {
    const sc = MK.scenes["S-a"]; if (!sc) return;
    const sd = BA.sd, lin = BA.lin, mix3 = BA.mix3, TIS = BA.tis;
    const sst = (a, b, x) => { const q = Math.max(0, Math.min(1, (x - a) / (b - a))); return q * q * (3 - 2 * q); };
    /* spindle-shaped muscle belly with pale tendons at both ends: unit length along +y */
    const fusiGeo = () => BA.cached("fusi", () => { const T3 = T(), g = new T3.CylinderGeometry(1, 1, 1, 28, 40, false); g.translate(0, 0.5, 0); const p = g.attributes.position, col = new Float32Array(p.count * 3), red = lin(TIS.muscle), hi = lin(TIS.muscleHi), ten = lin(TIS.tendon);
      for (let i = 0; i < p.count; i++) { const u = p.getY(i), r = 0.11 + 0.89 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 1.5); p.setX(i, p.getX(i) * r); p.setZ(i, p.getZ(i) * r); const c = mix3(mix3(hi, red, sst(0.2, 0.9, Math.abs(u - 0.5) * 2)), ten, sst(0.66, 0.84, Math.abs(u - 0.5) * 2)); col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; }
      g.setAttribute("color", new T3.BufferAttribute(col, 3)); g.computeVertexNormals(); return g; });
    const span = (m, a, b, thick) => { const d = b.clone().sub(a), L = d.length(); m.position.copy(a); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); m.scale.set(thick, L, thick * 0.85); };
    const boneMat = () => BA.mat.matte(TIS.bone, { roughness: 0.62 });
    const humerus = () => BA.cached("humerus", () => BA.mesh((x, y, z) => { let d = sd.cone(x, y, z, 0, 0.12, 0, 0, 2.12, 0, 0.085, 0.09); d = sd.smin(d, sd.sph(x, y, z, -0.09, 2.2, 0, 0.17), 0.1); d = sd.smin(d, sd.ell(x, y, z, 0.1, 2.12, 0, 0.09, 0.1, 0.1), 0.06); return sd.smin(d, sd.ell(x, y, z, 0, 0.03, 0, 0.13, 0.11, 0.19), 0.1); }, [-0.3, -0.12, -0.24, 0.24, 2.42, 0.24], 0.026));
    const forearm = () => BA.cached("forearm", () => BA.mesh((x, y, z) => { let u = sd.cone(x, y, z, -0.06, 0.02, 0, -0.05, 2.0, -0.03, 0.08, 0.045); u = sd.smin(u, sd.ell(x, y, z, -0.1, -0.1, 0, 0.09, 0.14, 0.1), 0.06); let r = sd.cone(x, y, z, 0.07, 0.14, 0, 0.06, 2.0, 0.03, 0.05, 0.08); r = sd.smin(r, sd.ell(x, y, z, 0.07, 0.12, 0, 0.075, 0.04, 0.075), 0.03); return Math.min(u, r); }, [-0.24, -0.28, -0.14, 0.18, 2.1, 0.14], 0.022));
    const hand = () => BA.cached("hand", () => BA.mesh((x, y, z) => { let d = sd.ell(x, y, z, 0, 2.26, 0, 0.13, 0.19, 0.055); for (let i = 0; i < 4; i++) { const fx = -0.09 + i * 0.06; d = sd.smin(d, sd.cone(x, y, z, fx, 2.4, 0, fx * 1.2 + 0.1, 2.62 + (i === 1 || i === 2 ? 0.04 : 0), 0.1, 0.028, 0.022), 0.02); } return sd.smin(d, sd.cone(x, y, z, 0.1, 2.2, 0, 0.2, 2.36, 0.08, 0.03, 0.024), 0.02); }, [-0.2, 2.02, -0.1, 0.3, 2.74, 0.18], 0.02));
    BA.addMode("S-a", "arm", {
      label: "Arm: antagonistic muscles", cam: [[1.9, 2.2, 8.4], [1.45, 1.7, 0]],
      make(S, s, c, g) {
        const T3 = T(), el = V(-0.4, 1.0, 0); s.el = el;
        const hu = new T3.Mesh(humerus(), boneMat()); hu.position.copy(el); g.add(hu);
        const scap = new T3.Mesh(new T3.SphereGeometry(1, 24, 16), boneMat()); scap.scale.set(0.34, 0.5, 0.07); scap.position.set(-0.72, 3.0, -0.16); scap.rotation.z = 0.25; g.add(scap);
        s.fore = new T3.Group(); s.fore.position.copy(el); const fb = new T3.Mesh(forearm(), boneMat()), hd = new T3.Mesh(hand(), boneMat()); fb.scale.set(1.35, 1, 1.35); hd.scale.set(1.5, 1.25, 1.5); hd.position.y = -2.02 * 0.25; s.fore.add(fb, hd); g.add(s.fore);
        s.bi = new T3.Mesh(fusiGeo(), BA.mat.muscle(4)); s.tri = new T3.Mesh(fusiGeo(), BA.mat.muscle(4)); g.add(s.bi, s.tri);
        const db = new T3.Group(), bar = new T3.Mesh(new T3.CylinderGeometry(0.04, 0.04, 0.7, 12), window.P3D.mat.chrome()); bar.rotation.x = Math.PI / 2; db.add(bar); s.plates = [-0.3, 0.3].map((z) => { const p = new T3.Mesh(new T3.CylinderGeometry(1, 1, 0.1, 24), new T3.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.4, roughness: 0.45 })); p.rotation.x = Math.PI / 2; p.position.z = z; db.add(p); return p; }); db.position.set(0.06, 2.42, 0.06); s.fore.add(db); s.db = db;
        s.aparts = { biceps: part("biceps", "Biceps (flexor)", "Contracts to bend the arm at the elbow. Its tendon is attached to the radius, close to the elbow.", [s.bi], [-0.12, 2.2, 0.2]), triceps: part("triceps", "Triceps (extensor)", "Contracts to straighten the arm. Its tendon is attached to the tip of the ulna behind the elbow.", [s.tri], [-0.62, 2.2, 0.2]),
          humerus: part("humerus", "Humerus", "The bone of the upper arm. Its round head fits the socket of the scapula (ball-and-socket joint).", [hu], [-0.4, 2.7, 0.12]), scapula: part("scapula", "Scapula (shoulder blade)", "Both muscles have their fixed end (origin) here.", [scap], [-0.85, 3.3, -0.1]),
          forearm: part("forearm", "Radius and ulna", "The two bones of the forearm: together they form the lever that the muscles move.", s.fore.children.slice(0, 2), [0.6, 1.0, 0.1]), elbow: part("elbow", "Elbow: the fulcrum", "A hinge joint: it allows movement in one plane only.", [], [-0.4, 1.0, 0.2]) };
        Object.values(s.aparts).forEach((p) => p.meshes.forEach((m) => { m.userData.part = p.id; })); s.a = c.ang;
      },
      update(S, s, c, dt) {
        s.a += (c.ang - s.a) * Math.min(1, dt * 6); const a = s.a * Math.PI / 180, el = s.el, dir = V(Math.sin(a), Math.cos(a), 0), nrm = V(Math.cos(a), -Math.sin(a), 0);
        s.fore.rotation.z = -a;
        const flex = (170 - s.a) / 130;
        span(s.bi, V(-0.2, 3.12, 0.05), el.clone().addScaledVector(dir, 0.36).addScaledVector(nrm, 0.08), 0.16 + flex * 0.09 + c.load * 0.003);
        span(s.tri, V(-0.64, 3.05, 0.0), el.clone().addScaledVector(dir, -0.2).addScaledVector(nrm, -0.1), 0.19 - flex * 0.05);
        s.bi.position.z = 0.04; s.db.visible = c.load > 0; const pr = 0.1 + c.load * 0.008; s.plates.forEach((p) => p.scale.set(pr, 1, pr));
        const P = s.aparts; P.biceps.name = "Biceps: " + (c.ang < 105 ? "contracted" : "relaxed"); P.triceps.name = "Triceps: " + (c.ang < 105 ? "relaxed" : "contracted");
        P.forearm.anchor.copy(el).addScaledVector(dir, 1.3).add(V(0, 0, 0.1));
        const W8 = c.load * 9.81 + 15; s.F = W8 * 0.35 / 0.04; s.W = W8;
      },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["scapula", "triceps", "humerus", "biceps", "elbow", "forearm"], side: (id) => id === "scapula" || id === "triceps" || id === "elbow" }); },
      hud: (s, c) => BA.focus.card(s, [{ title: "Third-class lever", lines: ["Biceps tendon joins the radius 4 cm from the elbow; the load is 35 cm away.", ["Load (hand + forearm + weight) ≈ " + f(s.W || 0, 0) + " N", "#e8f1ff"], ["Biceps force = load × 35 ÷ 4 ≈ " + f(s.F || 0, 0) + " N", "#ff7b72", true], "Antagonistic pair: the biceps bends (flexes) the arm, the triceps straightens (extends) it.", ["Muscles can only pull, never push.", "#7cb3ff"]] }]),
      readouts: (s, c) => [["Elbow angle", c.ang + "°"], ["Biceps force", f(s.F || 0, 0) + " N"]],
    });
    BA.addMode("S-a", "muscles", {
      label: "Muscular system", first: true, cam: [[1.25, 1.85, 5.6], [0.82, 1.74, 0]],
      blurb: "The main muscles of the body, front and back, in real anatomical colours: red muscle fading into pale tendon. Tap a muscle to isolate it and read what it moves, then bend a realistic arm to see how the biceps and triceps work against each other.",
      values: { quiz: 0, spin: 0 }, controls: [{ type: "toggle", key: "spin", label: "Turn slowly" }, QUIZ()],
      make(S, s, c, g) {
        const T3 = T(); s.fig = new T3.Group(); g.add(s.fig);
        const under = new T3.Mesh(BA.fasciaGeo(), BA.mat.matte(0xe9cdc6, { roughness: 0.7 })); s.fig.add(under);
        const M = BA.muscles(); s.fig.add(M.group); s.aparts = M.parts; s.rot = 0;
        Object.values(M.parts).forEach((p) => { p.facing = p.anchor.z < 0 ? -1 : 1; });
      },
      update(S, s, c, dt) { if (c.spin) s.rot += dt * 0.35; s.fig.rotation.y = s.rot; },
      overlay(ctx, s, c, S, B) { const back = Math.cos(S.orbit.yaw - (s.rot || 0)) < 0; BA.focus.overlay(S, s, B, { labels: Object.keys(s.aparts).filter((k) => (s.aparts[k].facing < 0) === back), hint: "Tap a muscle to isolate it · turn the model to see the back", world: s.fig }); },
      hud: (s, c) => BA.focus.card(s, [{ title: "Skeletal muscles", lines: ["Muscles are joined to bones by tendons and work in antagonistic pairs.", ["Flexors bend a joint: biceps, hamstrings.", "#ff9f95"], ["Extensors straighten it: triceps, quadriceps.", "#7cb3ff"], "When one muscle of a pair contracts, the other relaxes.", ["Turn the model to see the muscles of the back.", "#a9b6d3"]] }]),
      readouts: (s, c) => { const F = s.aF, P = s.aparts || {}; return F && F.quiz ? [["Score", F.score + " / " + F.tries]] : [["Muscle", F && F.sel && P[F.sel] ? P[F.sel].name : "tap one"]]; },
    });
  })();

  /* =====================================================================
     S-f  Urinary system and a sectioned kidney (new first view)
     ===================================================================== */
  (function () {
    if (!MK.scenes["S-f"]) return;
    const sd = BA.sd, lin = BA.lin, mix3 = BA.mix3;
    const sst = (a, b, x) => { const q = Math.max(0, Math.min(1, (x - a) / (b - a))); return q * q * (3 - 2 * q); };
    const bean = (x, y, z) => sd.smax(sd.ell(x, y, z, 0, 0, 0, 0.62, 1.0, 0.46), -sd.sph(x, y, z, 0.95, 0, 0, 0.52), 0.25);
    const kidneySec = () => BA.cached("kidneySec", () => { const out = lin(0x8a3b34), cortex = lin(0xb8695a), med = lin(0x7c2f33), medHi = lin(0xa8494c), pel = lin(0xf0dfb8);
      return BA.mesh((x, y, z) => sd.smax(bean(x, y, z), z - 0.0, 0.012), [-0.72, -1.1, -0.52, 0.72, 1.1, 0.04], 0.026, { color: (x, y, z, nx, ny, nz) => {
        if (nz < 0.6) return mix3(out, lin(0x6e2a2e), sst(0.4, 0.7, BK.fbm(x * 4, y * 4, z * 4)) * 0.5);
        const depth = -bean(x, y, 0), pelv = sd.ell(x, y, 0, 0.3, 0, 0, 0.2, 0.52, 1);
        if (pelv < 0) return pel; if (depth < 0.15) return mix3(cortex, lin(0xc98070), BK.noise3(x * 40, y * 40, 0));
        const th = Math.atan2(y, x - 0.42), pyr = Math.cos(th * 5.2 + 0.4);
        if (pyr < -0.55 || pelv < 0.05) return pelv < 0.05 ? pel : cortex;                                      // renal columns between the pyramids
        return mix3(med, medHi, 0.5 + 0.5 * Math.sin(th * 90)); } }); });
    const KP = { cortex: ["Cortex", "The outer layer. It holds the Bowman's capsules and glomeruli, where blood is filtered under pressure.", [-0.42, 0.5, 0.02]], medulla: ["Medulla (pyramids)", "The striped inner zone: loops of Henle and collecting ducts, where water is reabsorbed.", [-0.12, -0.42, 0.02]], pelvis: ["Pelvis", "The funnel that collects urine from the pyramids and passes it into the ureter.", [0.26, 0.05, 0.02]],
      ureterK: ["Ureter", "Carries urine to the bladder by peristalsis.", [0.5, -0.95, -0.2]], rart: ["Renal artery", "Brings blood with urea, straight from the aorta, at high pressure.", [0.95, 0.24, -0.2]], rvein: ["Renal vein", "Takes filtered blood, with much less urea, back to the vena cava.", [0.95, -0.1, -0.2]] };
    BA.addMode("S-f", "urinary", {
      label: "Urinary system", first: true, keep: true, base: ["nephron", "The nephron"], cam: [[0.55, 2.0, 4.7], [0.2, 1.84, 0]],
      blurb: "The kidneys, ureters and bladder in their real places, with one kidney cut open to show the cortex, medulla and pelvis. Tap a part to isolate it, then follow filtration and reabsorption along a single nephron.",
      values: { quiz: 0 }, controls: [QUIZ()],
      make(S, s, c, g) {
        const T3 = T(); g.add(BA.body({ dark: S.clinicDark }));
        const O = BA.organs({ only: ["kidneyR", "kidneyL", "ureter", "bladder", "aorta", "cava"] }); g.add(O.group); s.aparts = O.parts;
        const kg = new T3.Group(), K = 0.36; kg.position.set(-1.25, 2.0, 0.25); kg.scale.setScalar(K); g.add(kg); s.kg = kg;
        kg.add(new T3.Mesh(kidneySec(), BA.mat.vtissue({ roughness: 0.4, clearcoat: 0.4 })));
        const tubes = { ureterK: BA.tube(BA.curve([[0.34, -0.1, -0.2], [0.5, -0.5, -0.22], [0.5, -1.4, -0.2]]), 0.075, BA.mat.tissue(0xe8d9a8), { seg: 20, rs: 10 }), rart: BA.tube(BA.curve([[0.3, 0.22, -0.2], [0.7, 0.26, -0.2], [1.2, 0.24, -0.2]]), 0.07, BA.mat.vessel(BA.tis.arteryBright), { seg: 12, rs: 10 }), rvein: BA.tube(BA.curve([[0.3, -0.02, -0.24], [0.7, -0.08, -0.24], [1.2, -0.1, -0.24]]), 0.085, BA.mat.vessel(BA.tis.vein), { seg: 12, rs: 10 }) };
        Object.keys(KP).forEach((id) => { const a = KP[id][2], ms = []; if (tubes[id]) { kg.add(tubes[id]); tubes[id].userData.part = id; ms.push(tubes[id]); } else { const m = new T3.Mesh(new T3.SphereGeometry(0.2, 10, 8), new T3.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); m.position.set(a[0], a[1], a[2]); m.userData.part = id; m.userData.pick = true; kg.add(m); ms.push(m); }
          s.aparts[id] = part(id, KP[id][0], KP[id][1], ms, [-1.25 + a[0] * K, 2.0 + a[1] * K, 0.25 + a[2] * K]); });
        s.drops = dots(18, 0.008, true); g.add(s.drops); s.du = Array.from({ length: 18 }, (_, i) => i / 18);
        s.dp = [-1, 1].map((sdv) => BA.curve([[sdv * 0.13, 1.79, -0.1], [sdv * 0.1, 1.65, -0.09], [sdv * 0.08, 1.5, -0.05], [sdv * 0.035, 1.38, 0.03], [0, 1.35, 0.06]]));
      },
      update(S, s, c, dt) { const rate = 0.12 + 0.1 * c.water; for (let i = 0; i < 18; i++) { s.du[i] = (s.du[i] + dt * rate * 0.5) % 1; putDot(s.drops, i, s.dp[i % 2].getPointAt(s.du[i]), 0xf2d24a); } flush(s.drops); const b = s.aparts.bladder.meshes[0]; b.scale.setScalar(0.85 + 0.25 * (0.5 + 0.5 * Math.sin(S.t * 0.4))); },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["cava", "aorta", "kidneyR", "ureter", "bladder", "cortex", "medulla", "pelvis", "rart", "rvein", "ureterK"], side: (id) => !!KP[id], maxX: 392, reach: 26 }); },
      hud: (s, c) => BA.focus.card(s, [{ title: "Urinary system", lines: ["Renal arteries bring blood to the kidneys; renal veins take it away.", "Each kidney has about a million nephrons that filter the blood.", ["Urine: kidney → ureter → bladder → urethra.", "#ffd27a"], ["Drinking " + f(c.water, 2) + " dm³ of water a day: " + (c.water > 2.6 ? "large volume of dilute urine." : c.water < 1.2 ? "small volume of concentrated urine." : "normal urine, about 1.5 dm³ a day."), "#5bd68c"], ["The cut kidney on the left is enlarged.", "#a9b6d3"]] }]),
      readouts: (s, c) => { const F = s.aF, P = s.aparts || {}; return [["Selected", F && F.sel && P[F.sel] ? P[F.sel].name : "none"]]; },
    });
  })();

  /* =====================================================================
     R-d  Reproductive systems (syllabus level, shown like any other organ system)
     ===================================================================== */
  (function () {
    if (!MK.scenes["R-d"]) return;
    const TI = BA.tis, tis = (c, o) => BA.mat.tissue(c, o);
    const build = (sex) => {
      const T3 = T(), group = new T3.Group(), parts = {};
      const add = (id, name, info, meshes, anchor) => { meshes = [].concat(meshes); meshes.forEach((m) => { m.userData.part = id; group.add(m); }); parts[id] = part(id, name, info, meshes, anchor); };
      const bl = new T3.Mesh(BK.blob(0.05, 4, 0.04, 18, 1, 0.9, 0.9), tis(TI.bladder, { roughness: 0.4, transparent: true, opacity: 0.55 })); bl.userData.baseOp = 0.55; bl.userData.soft = true;
      if (sex === "female") {
        bl.position.set(0, 1.335, 0.085); add("bladderF", "Urinary bladder", "Not part of the reproductive system: it lies in front of the uterus.", bl, [0, 1.32, 0.13]);
        const ut = new T3.Mesh(BA.cached("uterus", () => BA.mesh(BA.sd.chain([[0, 1.468, 0.03, 0.048], [0, 1.425, 0.03, 0.04], [0, 1.375, 0.027, 0.024], [0, 1.352, 0.025, 0.02]], 0.02), [-0.07, 1.32, -0.03, 0.07, 1.53, 0.09], 0.006)), tis(TI.uterus, { roughness: 0.35, clearcoat: 0.5 }));
        add("uterus", "Uterus (womb)", "A muscular organ where the embryo implants and the foetus develops. Its lining thickens each month and is shed at menstruation.", ut, [0, 1.45, 0.08]);
        const cx = new T3.Mesh(new T3.SphereGeometry(0.021, 14, 10), tis(0xd98c84)); cx.position.set(0, 1.35, 0.025); add("cervix", "Cervix", "The narrow neck of the uterus. It widens at birth.", cx, [0.01, 1.35, 0.05]);
        add("vagina", "Vagina", "Receives sperm during mating and is the birth canal.", BA.tube(BA.curve([[0, 1.345, 0.022], [0, 1.29, 0.01], [0, 1.235, 0.0]]), 0.017, tis(TI.mouth, { roughness: 0.45 }), { seg: 14, rs: 10 }), [0, 1.27, 0.03]);
        const ducts = [], ov = [], fim = [];
        for (const s of [-1, 1]) { ducts.push(BA.tube(BA.curve([[s * 0.035, 1.47, 0.03], [s * 0.085, 1.497, 0.035], [s * 0.135, 1.492, 0.035], [s * 0.158, 1.462, 0.032]]), 0.0075, tis(TI.uterus), { seg: 20, rs: 8, r: (t) => 0.8 + 0.9 * t * t }));
          const f2 = new T3.Mesh(new T3.ConeGeometry(0.018, 0.03, 10, 1, true), tis(TI.uterus, { side: T3.DoubleSide })); f2.position.set(s * 0.16, 1.449, 0.032); fim.push(f2);
          const o = new T3.Mesh(new T3.SphereGeometry(0.02, 14, 10), BA.mat.matte(TI.ovary)); o.scale.set(1.25, 0.85, 0.85); o.position.set(s * 0.14, 1.432, 0.03); ov.push(o); }
        add("oviduct", "Oviducts (Fallopian tubes)", "Carry the ovum from the ovary to the uterus. Fertilisation takes place here.", ducts.concat(fim), [0.1, 1.5, 0.045]);
        add("ovaryF", "Ovaries", "Produce the ova (eggs) and the hormones oestrogen and progesterone. One ovum is released about every 28 days.", ov, [0.14, 1.43, 0.055]);
        group.userData.path = BA.curve([[0.14, 1.432, 0.03], [0.16, 1.45, 0.032], [0.158, 1.462, 0.032], [0.135, 1.492, 0.035], [0.085, 1.497, 0.035], [0.035, 1.47, 0.03], [0, 1.45, 0.03]]);
      } else {
        bl.position.set(0, 1.395, 0.045); add("bladderM", "Urinary bladder", "Stores urine. In the male, urine and semen leave through the same tube, the urethra, but never at the same time.", bl, [0, 1.41, 0.09]);
        const sac = new T3.Mesh(new T3.SphereGeometry(1, 20, 14), BK.mat.skin(0x8d5a3b, 0.32)); sac.scale.set(0.075, 0.062, 0.052); sac.position.set(0, 1.165, 0.1); sac.userData.baseOp = 0.32; sac.userData.soft = true;
        add("scrotum", "Scrotum", "A sac of skin that holds the testes outside the body cavity, about 2–3 °C cooler than body temperature, which sperm production needs.", sac, [0, 1.12, 0.14]);
        const te = [], ep = [], vd = [], sv = [];
        for (const s of [-1, 1]) { const t1 = new T3.Mesh(new T3.SphereGeometry(0.026, 16, 12), BA.mat.matte(TI.ovary)); t1.scale.set(0.9, 1.25, 0.9); t1.position.set(s * 0.036, 1.168, 0.1); te.push(t1);
          ep.push(BA.tube(BA.curve([[s * 0.04, 1.2, 0.085], [s * 0.056, 1.17, 0.08], [s * 0.046, 1.14, 0.085]]), 0.008, tis(TI.gland), { seg: 10, rs: 6 }));
          vd.push(BA.tube(BA.curve([[s * 0.046, 1.14, 0.085], [s * 0.066, 1.2, 0.075], [s * 0.085, 1.3, 0.085], [s * 0.095, 1.4, 0.07], [s * 0.06, 1.45, 0.02], [s * 0.025, 1.4, -0.01], [s * 0.012, 1.345, 0.0]]), 0.005, tis(0xe8d9a8), { seg: 40, rs: 6 }));
          const v = new T3.Mesh(BK.blob(0.016, 6 + s, 0.2, 12, 0.8, 1.5, 0.8), tis(TI.gland)); v.position.set(s * 0.032, 1.37, -0.022); v.rotation.z = s * -0.5; sv.push(v); }
        add("testis", "Testes", "Produce sperm in the seminiferous tubules and the hormone testosterone.", te, [0.04, 1.17, 0.13]);
        add("epididymis", "Epididymis", "A coiled tube on each testis where sperm mature and are stored.", ep, [0.058, 1.17, 0.09]);
        add("spermduct", "Sperm ducts (vas deferens)", "Carry sperm from the epididymis up and over the bladder to the urethra.", vd, [0.095, 1.4, 0.08]);
        add("vesicle", "Seminal vesicles", "Add a fluid rich in sugar that gives the sperm energy.", sv, [0.035, 1.375, -0.01]);
        const pr = new T3.Mesh(new T3.SphereGeometry(0.024, 16, 12), tis(TI.gland, { roughness: 0.5 })); pr.scale.set(1.15, 0.9, 1); pr.position.set(0, 1.335, 0.012); add("prostate", "Prostate gland", "Adds an alkaline fluid. Sperm plus the fluids from the glands make semen.", pr, [0, 1.335, 0.04]);
        const uc = BA.curve([[0, 1.345, 0.03], [0, 1.31, 0.02], [0, 1.275, 0.05], [0, 1.25, 0.1], [0, 1.2, 0.145], [0, 1.15, 0.165]]);
        add("urethra", "Urethra", "The tube through the penis that carries semen out of the body (and urine, at other times).", BA.tube(uc, 0.006, tis(TI.mouth), { seg: 30, rs: 6 }), [0, 1.29, 0.04]);
        const pn = BA.tube(BA.curve([[0, 1.27, 0.07], [0, 1.25, 0.1], [0, 1.2, 0.145], [0, 1.15, 0.165]]), 0.02, BK.mat.skin(0x8d5a3b, 0.4), { seg: 16, rs: 12 }); pn.userData.baseOp = 0.4; pn.userData.soft = true;
        add("penis", "Penis", "Passes sperm into the vagina of the female during mating.", pn, [0, 1.2, 0.17]);
        group.userData.path = BA.curve([[0.036, 1.168, 0.1], [0.046, 1.14, 0.085], [0.066, 1.2, 0.075], [0.085, 1.3, 0.085], [0.095, 1.4, 0.07], [0.06, 1.45, 0.02], [0.025, 1.4, -0.01], [0.012, 1.345, 0.0], [0, 1.31, 0.02], [0, 1.275, 0.05], [0, 1.25, 0.1], [0, 1.2, 0.145], [0, 1.15, 0.165]]);
      }
      return { group, parts };
    };
    const mode = (sex, label, labels, first) => BA.addMode("R-d", sex, {
      label, keep: true, base: ["fert", "Fertilisation and the embryo"], cam: sex === "female" ? [[0.28, 1.47, 1.2], [0.16, 1.41, 0.03]] : [[0.3, 1.36, 1.35], [0.17, 1.3, 0.04]],
      blurb: "The male and female reproductive systems in their real places, then fertilisation: sperm swim to the ovum, the zygote divides and the blastocyst implants. The hormone graph follows the menstrual cycle.",
      values: { quiz: 0 }, controls: [QUIZ()],
      make(S, s, c, g) { g.add(BA.body({ dark: S.clinicDark })); const O = build(sex); g.add(O.group); s.aparts = O.parts; s.rp = O.group.userData.path; s.cell = dots(sex === "female" ? 1 : 14, sex === "female" ? 0.006 : 0.0028, true); g.add(s.cell); s.ru = Array.from({ length: 14 }, (_, i) => i / 14); },
      update(S, s, c, dt) { const n = sex === "female" ? 1 : 14; for (let i = 0; i < n; i++) { s.ru[i] = (s.ru[i] + dt * (sex === "female" ? 0.07 : 0.1)) % 1; putDot(s.cell, i, s.rp.getPointAt(s.ru[i]), sex === "female" ? 0xffd24a : 0xffffff); } flush(s.cell); },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels, maxX: 392 }); },
      hud: (s, c) => BA.focus.card(s, [{ title: sex === "female" ? "Female reproductive system" : "Male reproductive system", lines: sex === "female" ? ["Ovary → oviduct → uterus → cervix → vagina.", ["Yellow dot: an ovum released at ovulation (about day 14) moves down the oviduct.", "#ffd27a"], "If it meets a sperm in the oviduct it is fertilised and the zygote implants in the uterus.", ["If not, the lining of the uterus is shed: menstruation.", "#7cb3ff"]] : ["Testis → epididymis → sperm duct → urethra.", ["White dots: sperm on their way out of the body.", "#e8f1ff"], "Seminal vesicles and the prostate gland add fluids to make semen.", ["The testes hang outside the body because sperm form best below body temperature.", "#7cb3ff"]] }]),
      readouts: (s, c) => { const F = s.aF, P = s.aparts || {}; return [["Selected", F && F.sel && P[F.sel] ? P[F.sel].name : "none"]]; },
    });
    mode("female", "Female system", ["oviduct", "ovaryF", "uterus", "cervix", "vagina", "bladderF"]);
    mode("male", "Male system", ["spermduct", "vesicle", "bladderM", "prostate", "urethra", "epididymis", "testis", "scrotum", "penis"]);
  })();

  /* =====================================================================
     WA3-e  Biology in agriculture: a farm settlement
     ===================================================================== */
  (function () {
    const old = MK.scenes["WA3-e"]; if (!old || !BA.farm) return;
    const FK = BA.farm, RX = 8.4, RZ = 4.8, ROWS = 6, PER = 11;
    BK.def3d("WA3-e", Object.assign({}, old, {
      label: "Realistic 3D lab", title: "Biology in agriculture",
      blurb: "A West African farm settlement: maize on ridges, cattle in the kraal, a granary, a well and the river below. Burn the bush, add fertiliser or pesticide, or switch to mixed and organic farming, and watch the crops, the soil life, the bees and the river respond.",
      env: "outdoor", cam: [[3.6, 6.6, 14.0], [3.0, 0.5, -1.0]], fov: 38,
      build(S, s, c) {
        const T3 = T(), g = BK.group(S, s), rr = BK.rng(9), m4 = new T3.Matrix4(), q4 = new T3.Quaternion(), e3 = new T3.Euler();
        s.field = FK.ridges(RX, RZ, ROWS, BK.mat.soil([6, 4])); s.field.position.y = 0.012; g.add(s.field);
        /* crops: maize on every row; cassava takes the alternate rows in mixed cropping */
        s.maize = new T3.InstancedMesh(FK.maizeGeo(), new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: T3.DoubleSide }), ROWS * PER); s.maize.castShadow = true; g.add(s.maize);
        s.cass = new T3.InstancedMesh(FK.cassavaGeo(), new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: T3.DoubleSide }), (ROWS / 2) * PER); s.cass.castShadow = true; g.add(s.cass);
        s.slots = []; for (let r = 0; r < ROWS; r++) for (let i = 0; i < PER; i++) s.slots.push({ x: -RX / 2 + 0.45 + i * (RX - 0.9) / (PER - 1) + (rr() - 0.5) * 0.12, z: -RZ / 2 + (r + 0.5) * RZ / ROWS, r, rot: rr() * 6.3, k: 0.85 + rr() * 0.3 });
        s.set = (im, i, x, y, z, rot, k) => { e3.set(0, rot, 0); q4.setFromEuler(e3); m4.compose(V(x, y, z), q4, V(k, k, k)); im.setMatrixAt(i, m4); };
        /* mulch and compost for organic farming */
        s.mulch = new T3.InstancedMesh(new T3.SphereGeometry(0.2, 7, 5), new T3.MeshStandardMaterial({ color: 0xa8894a, roughness: 1 }), 70); for (let i = 0; i < 70; i++) { m4.compose(V((rr() - 0.5) * (RX - 0.6), 0.03, -RZ / 2 + Math.floor(rr() * (ROWS + 1)) * RZ / ROWS + (rr() - 0.5) * 0.15), q4.setFromEuler(e3.set(0, rr() * 6, 0)), V(1 + rr(), 0.18, 0.6 + rr() * 0.5)); s.mulch.setMatrixAt(i, m4); } s.mulch.receiveShadow = true; g.add(s.mulch);
        s.compost = new T3.Mesh(BK.blob(0.6, 8, 0.25, 16, 1.3, 0.55, 1), new T3.MeshStandardMaterial({ color: 0x4a3a28, roughness: 1 })); s.compost.position.set(5.0, 0.2, -1.2); g.add(s.compost);
        /* fertiliser sacks */
        s.sacks = [0, 1, 2].map((i) => { const m = new T3.Mesh(new T3.BoxGeometry(0.5, 0.2, 0.32), new T3.MeshStandardMaterial({ color: 0xf2f0e6, roughness: 0.8 })); m.position.set(4.7 + (i % 2) * 0.3, 0.1 + Math.floor(i / 2) * 0.2 + (i === 2 ? 0.0 : 0), 0.9 + (i % 2) * 0.1); m.rotation.y = 0.3 * i; g.add(m); return m; });
        /* worms and bees */
        s.worms = new T3.InstancedMesh(new T3.CapsuleGeometry(0.022, 0.14, 4, 6), new T3.MeshStandardMaterial({ color: 0xc87a7a, roughness: 0.5 }), 60); for (let i = 0; i < 60; i++) { m4.compose(V((rr() - 0.5) * (RX - 0.4), 0.06, (rr() - 0.5) * (RZ - 0.3)), q4.setFromEuler(e3.set(0, rr() * 6, Math.PI / 2)), V(1, 1, 1)); s.worms.setMatrixAt(i, m4); } g.add(s.worms);
        s.bees = dots(26, 0.03, true); g.add(s.bees); s.beeP = Array.from({ length: 26 }, () => [rr() * 6.3, 0.6 + rr() * 2.2, (rr() - 0.5) * (RX - 1), (rr() - 0.5) * (RZ - 0.6), 0.8 + rr()]);
        /* river with reeds and algae */
        s.river = FK.river([[-9, 4.2], [-4, 3.5], [0, 3.9], [4, 3.4], [9, 4.1]], 1.25, new T3.MeshPhysicalMaterial({ color: 0x2f6a8a, roughness: 0.06, clearcoat: 1 })); s.river.position.y = 0.025; g.add(s.river);
        const bank = FK.river([[-9, 4.2], [-4, 3.5], [0, 3.9], [4, 3.4], [9, 4.1]], 1.7, new T3.MeshStandardMaterial({ color: 0x8a7248, roughness: 1 })); bank.position.y = 0.015; bank.receiveShadow = true; g.add(bank);
        s.algae = new T3.InstancedMesh(new T3.CircleGeometry(0.16, 9), new T3.MeshStandardMaterial({ color: 0x5f9a2a, roughness: 0.9, transparent: true, opacity: 0.85 }), 60); const cv = s.river.userData.curve; for (let i = 0; i < 60; i++) { const p = cv.getPointAt(rr()); m4.compose(V(p.x + (rr() - 0.5) * 0.3, 0.035, p.z + (rr() - 0.5) * 0.9), q4.setFromEuler(e3.set(-Math.PI / 2, 0, rr() * 6)), V(0.6 + rr(), 0.6 + rr(), 1)); s.algae.setMatrixAt(i, m4); } g.add(s.algae);
        const reedM = BK.mat.leaf("#5f8a3a", "#9cc47a"); for (let i = 0; i < 14; i++) { const p = cv.getPointAt(rr()), t = BK.grassTuft(reedM, 7, 0.7, i + 2); t.position.set(p.x, 0, p.z + (rr() > 0.5 ? 0.75 : -0.75)); g.add(t); }
        /* fallow bush strip on the left: this is what burns */
        s.bush = new T3.InstancedMesh(FK.bushGeo(), new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), 16); for (let i = 0; i < 16; i++) { m4.compose(V(-RX / 2 - 0.9 - rr() * 1.3, 0, -RZ / 2 + rr() * RZ), q4.setFromEuler(e3.set(0, rr() * 6, 0)), V(0.8 + rr() * 0.6, 0.8 + rr() * 0.5, 0.8 + rr() * 0.6)); s.bush.setMatrixAt(i, m4); } s.bush.castShadow = true; g.add(s.bush);
        s.ash = new T3.Mesh(new T3.PlaneGeometry(2.6, RZ + 0.6), new T3.MeshStandardMaterial({ color: 0x1c1a18, roughness: 1, transparent: true, opacity: 0 })); s.ash.rotation.x = -Math.PI / 2; s.ash.position.set(-RX / 2 - 1.5, 0.02, 0); g.add(s.ash);
        s.fire = [0, 1, 2, 3, 4].map((i) => { const fl = window.P3D.S.mk.soft(0xff7a20, 1.3, -RX / 2 - 0.9 - (i % 2) * 0.9, 0.5, -RZ / 2 + 0.5 + i * (RZ - 1) / 4, 0.9); g.add(fl); return fl; });
        /* the settlement behind the field */
        const house = FK.house(3.2, 2.4, 1.9); house.position.set(-2.6, 0, -5.4); house.rotation.y = 0.18; g.add(house);
        const g1 = FK.granary(0.7, 1.3); g1.position.set(0.6, 0, -5.6); g.add(g1); const g2 = FK.granary(0.55, 1.05); g2.position.set(1.9, 0, -4.9); g.add(g2);
        const well = FK.well(); well.position.set(3.5, 0, -4.4); g.add(well);
        const K = [[-5.0, -7.6], [-9.4, -7.6], [-9.4, -4.2], [-5.0, -4.2], [-5.0, -5.2]]; g.add(FK.fence(K)); g.add(FK.fence([[-5.0, -6.3], [-5.0, -7.6]]));
        s.herd = [[BK.quad(1.3, 0xe8e2d4, { kind: "cow" }), -7.9, -6.4, -0.5], [BK.quad(1.3, 0x7a5236, { kind: "cow" }), -6.4, -5.3, -2.4], [BK.quad(0.75, 0xd8c8a8, { kind: "goat" }), -8.5, -4.9, -1.0], [BK.quad(0.7, 0x4a3a30, { kind: "goat" }), -6.0, -6.9, 0.4]].map(([a, x, z, ry]) => { a.position.set(x, 0, z); a.rotation.y = ry; g.add(a); return a; });
        const dung = new T3.Mesh(BK.blob(0.3, 5, 0.3, 10, 1.2, 0.4, 1), new T3.MeshStandardMaterial({ color: 0x3c2c1c, roughness: 1 })); dung.position.set(-5.6, 0.08, -4.7); g.add(dung);
        [[-3.9, -8.2, 4.6, 3], [6.2, -6.0, 4.2, 5], [-8.4, -1.6, 3.4, 8]].forEach(([x, z, h, sd2]) => { const p = FK.palm(h, sd2); p.position.set(x, 0, z); g.add(p); });
        const mango = BK.tree(3.4, 6, 0x2f6b2e); mango.position.set(-0.6, 0, -7.6); g.add(mango);
        const path = new T3.Mesh(new T3.PlaneGeometry(1.0, 3.2), new T3.MeshStandardMaterial({ color: 0xc8a878, roughness: 1 })); path.rotation.x = -Math.PI / 2; path.rotation.z = 0.12; path.position.set(-2.2, 0.012, -3.3); path.receiveShadow = true; g.add(path);
        BK.shadow(g, true, true); [s.river, s.algae, s.ash, s.bees, s.mulch, s.worms].forEach((m) => { m.castShadow = false; }); s.fire.forEach((fl) => { fl.castShadow = false; }); s.applied = "";
      },
      update(S, s, c, dt) {
        const org = c.method === "organic", mixd = c.method === "mixed";
        const soilLife = Math.max(0.05, 1 - c.pest / 120 - (c.burn ? 0.5 : 0) + (org ? 0.3 : 0));
        const fertility = Math.max(0.2, 0.5 + c.fert / 200 + (org ? 0.35 : 0) + (mixd ? 0.2 : 0) - (c.burn ? 0.15 : 0) - (c.method === "mono" ? 0.1 : 0));
        const yieldI = Math.min(1.4, fertility * (1 - (c.pest < 10 && !mixd ? 0.25 : 0))); s.life = soilLife; s.yi = yieldI; s.eut = (org ? 0.2 : 1) * c.fert / 100;
        s.gy = s.gy == null ? yieldI : s.gy + (yieldI - s.gy) * Math.min(1, dt * 2.5);
        let ci = 0; s.slots.forEach((q, i) => { const alt = mixd && q.r % 2 === 1, k = (0.42 + 0.48 * s.gy) * q.k; s.set(s.maize, i, q.x, 0.08, q.z, q.rot, alt ? 0.0001 : k); if (q.r % 2 === 1) { s.set(s.cass, ci++, q.x, 0.08, q.z, q.rot, alt ? k * 0.95 : 0.0001); } });
        s.maize.instanceMatrix.needsUpdate = true; s.cass.instanceMatrix.needsUpdate = true;
        /* stressed crops yellow, well-fed crops deep green */
        s.maize.material.color.setRGB(1, 1, 1).lerp(new (T().Color)(0xe6d36a), Math.max(0, Math.min(1, (0.75 - s.gy) * 1.6)));
        s.mulch.visible = org; s.compost.visible = org; s.sacks.forEach((m, i) => { m.visible = !org && c.fert > 15 + i * 30; });
        s.worms.count = Math.round(60 * Math.min(1, soilLife));
        const bees = Math.round(26 * Math.max(0, 1 - c.pest / 85) * (c.burn ? 0.5 : 1)); s.nb = bees;
        for (let i = 0; i < 26; i++) { const b = s.beeP[i]; b[0] += dt * b[4] * 1.6; putDot(s.bees, i, V(b[2] + Math.cos(b[0]) * 0.5, i < bees ? b[1] + Math.sin(b[0] * 2.3) * 0.15 : -5, b[3] + Math.sin(b[0] * 1.3) * 0.5), i % 3 ? 0xffc21a : 0x2a2210); } flush(s.bees);
        s.field.material.color.setHex(0xffffff).lerp(new (T().Color)(org ? 0x8a6a4a : 0xffffff), org ? 0.5 : 0);
        s.river.material.color.setHex(0x2f6a8a).lerp(new (T().Color)(0x4a8a2a), Math.min(1, s.eut)); s.algae.count = Math.round(60 * Math.max(0, Math.min(1, (s.eut - 0.35) / 0.65)));
        s.bk = s.bk == null ? (c.burn ? 1 : 0) : s.bk + ((c.burn ? 1 : 0) - s.bk) * Math.min(1, dt * 1.2);
        s.ash.material.opacity = 0.85 * s.bk; s.bush.material.color.setRGB(1, 1, 1).lerp(new (T().Color)(0x241c14), s.bk);
        s.fire.forEach((fl, i) => { fl.visible = !!c.burn; const k = 1.1 + 0.5 * Math.sin(S.t * 9 + i * 2); fl.scale.set(k * 1.2, k * 1.7, 1); });
        if (c.burn && Math.random() < dt * 7) S.puff(-RX / 2 - 0.8 - Math.random() * 1.2, 0.5, (Math.random() - 0.5) * RZ, { color: 0x4a4a4a, n: 2, size: 1.1, speed: 0.4, up: 1.4, life: 3, op: 0.5 });
        if (!org && c.pest > 50 && Math.random() < dt * 5) S.puff((Math.random() - 0.5) * RX, 1.2, (Math.random() - 0.5) * RZ, { color: 0xdfe8c8, n: 1, size: 0.7, speed: 0.2, up: 0.1, life: 1.6, op: 0.35 });
        s.herd.forEach((a, i) => { a.rotation.z = Math.sin(S.t * 0.6 + i * 2) * 0.012; });
      },
      overlay(ctx, s, c, S, B) { const L = (x, y, z, t, col, dx) => BK.lab(S, B, x, y, z, t, col, dx, 0, 10); L(0, 2.3, 0, c.method === "mixed" ? "Maize + cassava (mixed cropping)" : "Maize on ridges", "#bfe6a0", 0); L(-7.2, 1.7, -5.9, "Kraal: cattle and goats", "#ffd27a", 0); L(1.2, 2.4, -5.3, "Granaries", "#e8f1ff", 0); L(0, 0.3, 3.9, s.eut > 0.5 ? "River: algal bloom" : "River", s.eut > 0.5 ? "#9fdc6a" : "#8fb4ff", 0); if (c.burn) L(-5.6, 1.4, 0, "Bush burning", "#ff8f66", 0); },
      hud: (s, c) => [{ title: "Effects of farming practices", lines: [["Maize yield ≈ " + f(2.0 * (s.yi || 0), 1) + " t/ha (index " + f((s.yi || 0) * 100, 0) + ")", "#ffd27a", true], ["Soil organisms " + f((s.life || 0) * 100, 0) + "% · bees " + (s.nb || 0) + " of 26", "#5bd68c"], c.burn ? "Bush burning kills soil organisms, destroys humus, exposes soil to erosion and pollutes the air." : "No burning: organic matter returns to the soil.", c.fert > 60 && c.method !== "organic" ? "Excess fertiliser washes into the river → algal bloom (eutrophication)." : c.method === "organic" ? "Manure, compost and mulch feed the soil slowly and hold water." : "Fertiliser replaces the nutrients removed by crops.", c.pest > 50 ? "Heavy pesticide use kills useful insects (bees, predators) and builds up in food chains." : "Pesticides control pests but must be used with care.", c.method === "mixed" ? "Mixed cropping and rotation: fewer pests, better use of soil nutrients." : "Life cycles: annuals (maize), biennials (carrot), perennials (cocoa, oil palm)."] }],
      readouts: (s, c) => [["Maize yield", f(2.0 * (s.yi || 0), 1) + " t/ha"], ["Soil life", f((s.life || 0) * 100, 0) + "%"], ["Bees", String(s.nb || 0)]],
      note: (old.note ? old.note + " " : "") + "The yield figure assumes 2.0 t/ha of maize at index 100, a typical smallholder value; it is a teaching model, not a forecast.",
    }));
  })();

  /* Regional topics that reuse these scenes were copied before the redesign: point them at the new versions,
     keeping their own titles, notes and starting values. */
  [["GH5-b", "S-c", { mode: "heart" }], ["GH5-d", "S-a", { mode: "arm" }], ["WA1-c", "S-f", { mode: "nephron" }]].forEach(([key, from, vals]) => {
    const al = MK.scenes[key], base = MK.scenes[from]; if (!al || !base) return;
    MK.def(key, Object.assign({}, base, { title: al.title, note: al.note || base.note, values: Object.assign({}, base.values, al.values, vals) }));
  });
})();

/* b3d-upgrades.js — second round of Biology lab upgrades (loads after b3d-body.js).
   Part 1: better shared builders (people, frog, snake, bird, insect, tree, plant) that every scene picks up,
   and realistic joints, vertebral column, teeth, ear and toad metamorphosis. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, BA = window.BA, W = MK.when, f = MK.fmt;
  if (!BA || !BA.addMode) return;
  const sd = BA.sd, lin = BA.lin, mix3 = BA.mix3, TIS = BA.tis;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sst = (a, b, x) => { const q = clamp((x - a) / (b - a), 0, 1); return q * q * (3 - 2 * q); };
  const part = (id, name, info, meshes, anchor) => ({ id, name, info, meshes: [].concat(meshes || []), anchor: V(anchor[0], anchor[1], anchor[2]) });
  const tag = (parts) => { Object.values(parts).forEach((p) => p.meshes.forEach((m) => { m.userData.part = p.id; })); return parts; };
  const QUIZ = () => ({ type: "toggle", key: "quiz", label: "Game: find the part" });
  const std = (o) => new (T().MeshStandardMaterial)(o);
  const vstd = (o) => std(Object.assign({ vertexColors: true, roughness: 0.8 }, o || {}));
  const shadow = (g) => { g.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return g; };
  const pickBall = (r, x, y, z) => { const m = new (T().Mesh)(new (T().SphereGeometry)(r, 10, 8), new (T().MeshBasicMaterial)({ transparent: true, opacity: 0, depthWrite: false })); m.position.set(x, y, z); m.userData.pick = true; return m; };
  function dots(n, r) { const T3 = T(), im = new T3.InstancedMesh(new T3.SphereGeometry(r, 8, 6), new T3.MeshBasicMaterial({ color: 0xffffff }), n); im.instanceColor = new T3.InstancedBufferAttribute(new Float32Array(n * 3), 3); im.frustumCulled = false; im.userData.m4 = new T3.Matrix4(); im.userData.col = new T3.Color(); return im; }
  function putDot(im, i, p, hex, sc) { const m4 = im.userData.m4; if (sc != null) m4.makeScale(sc, sc, sc); else m4.identity(); m4.setPosition(p.x, p.y, p.z); im.setMatrixAt(i, m4); im.setColorAt(i, im.userData.col.setHex(hex)); }
  const flush = (im) => { im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; };

  /* ======================= people ======================= */
  /* light figure for crowds: skin, shirt, shorts and hair painted on a coarse body mesh; about 1 unit tall at s = 1 */
  BA.personGeo = (shirt) => BA.cached("person" + shirt, () => { const sk = lin(0x8d5a3b), sh = lin(shirt), st = lin(0x2a3140), hair = lin(0x16110d);
    return BA.mesh(BA.bodySDF, [-0.86, -0.03, -0.34, 0.86, 3.46, 0.36], 0.05, { color: (x, y, z) => { const ax = Math.abs(x); if (y > 3.2 && z < 0.12 || y > 3.3) return hair; if (y > 1.62 && y < 2.7 && (ax < 0.4 || y > 2.3 && ax < 0.62)) return sh; if (y > 0.95 && y <= 1.62 && ax < 0.42) return st; return sk; } }); });
  BK.person = (s = 1, col = 0x3a6ad8) => { const m = new (T().Mesh)(BA.personGeo(col), vstd({ roughness: 0.75 })); m.scale.setScalar(s * 0.295); m.castShadow = true; const g = new (T().Group)(); g.add(m); return g; };

  /* ======================= frog / toad ======================= */
  const frogSDF = (x, y, z) => { const az = Math.abs(z), S = sd.smin;
    let d = sd.ell(x, y, z, -0.05, 0.2, 0, 0.36, 0.2, 0.25); d = S(d, sd.ell(x, y, z, 0.3, 0.24, 0, 0.2, 0.14, 0.2), 0.12);
    d = S(d, sd.sph(x, y, az, 0.34, 0.37, 0.12, 0.07), 0.04);                                                         // eye bumps
    let l = sd.cone(x, y, az, -0.25, 0.16, 0.2, -0.02, 0.1, 0.36, 0.1, 0.06); l = S(l, sd.cone(x, y, az, -0.02, 0.1, 0.36, -0.3, 0.05, 0.4, 0.06, 0.04), 0.03); l = S(l, sd.cone(x, y, az, -0.3, 0.05, 0.4, -0.12, 0.025, 0.5, 0.035, 0.02), 0.02);   // folded hind leg
    d = S(d, l, 0.05); return S(d, S(sd.cone(x, y, az, 0.2, 0.16, 0.17, 0.26, 0.05, 0.24, 0.05, 0.03), sd.ell(x, y, az, 0.32, 0.025, 0.25, 0.07, 0.02, 0.05), 0.02), 0.04); };
  BK.frog = (s = 1) => { const T3 = T(), g = new T3.Group();
    const geo = BA.cached("frog", () => { const gr = lin(0x5c8f2e), dk = lin(0x2a4a14), be = lin(0xe6e2c0); return BA.mesh(frogSDF, [-0.6, -0.02, -0.56, 0.56, 0.5, 0.56], 0.02, { color: (x, y, z, nx, ny) => { let c = mix3(gr, dk, sst(0.5, 0.62, BK.fbm(x * 9, y * 9, z * 9)) * 0.85); return mix3(c, be, sst(-0.2, -0.75, ny) * (y < 0.2 ? 1 : 0)); } }); });
    g.add(new T3.Mesh(geo, new T3.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, clearcoat: 0.8 })));
    for (const z of [-0.12, 0.12]) { const e = new T3.Mesh(new T3.SphereGeometry(0.045, 12, 10), new T3.MeshPhysicalMaterial({ color: 0xd8a020, roughness: 0.1, clearcoat: 1 })); e.position.set(0.37, 0.39, z); g.add(e); const p = new T3.Mesh(new T3.SphereGeometry(0.022, 8, 6), new T3.MeshBasicMaterial({ color: 0x050505 })); p.position.set(0.4, 0.395, z * 1.12); g.add(p); }
    g.scale.setScalar(s); return shadow(g); };

  /* ======================= snake ======================= */
  BK.snake = (s = 1) => { const T3 = T(), g = new T3.Group(), pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([u * 2.2 - 1.1, 0.07 + (u > 0.86 ? (u - 0.86) * 1.4 : 0), Math.sin(u * 9.5) * 0.26 * (1 - u * 0.3)]); }
    const a = lin(0x8a7a34), b = lin(0x2e2412), be = lin(0xd9cf9a), cv = BA.curve(pts);
    g.add(BA.tube(cv, 0.07, new T3.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.35, clearcoat: 0.7 }), { seg: 160, rs: 12, r: (t) => (t < 0.12 ? 0.25 + t * 6.2 : t > 0.93 ? 1.15 : 1), color: (t, q) => (q > 0.6 && q < 0.9 ? be : Math.sin(t * 150) > 0.35 ? b : a) }));
    const hp = cv.getPointAt(1), hd = new T3.Mesh(new T3.SphereGeometry(0.095, 16, 12), new T3.MeshPhysicalMaterial({ color: 0x7a6a2c, roughness: 0.35, clearcoat: 0.7 })); hd.scale.set(1.5, 0.7, 1); hd.position.copy(hp).add(V(0.06, 0.01, 0)); g.add(hd);
    for (const z of [-0.06, 0.06]) { const e = new T3.Mesh(new T3.SphereGeometry(0.016, 8, 6), new T3.MeshBasicMaterial({ color: 0x0a0a0a })); e.position.copy(hd.position).add(V(0.07, 0.035, z)); g.add(e); }
    const tg = new T3.Mesh(new T3.CylinderGeometry(0.004, 0.004, 0.16, 4), std({ color: 0xc02a3a })); tg.rotation.z = Math.PI / 2; tg.position.copy(hd.position).add(V(0.2, -0.01, 0)); g.add(tg);
    g.scale.setScalar(s); return shadow(g); };

  /* ======================= bird (faces +x; g.wings = two pivots that flap about x) ======================= */
  const birdSDF = (x, y, z) => { let d = sd.ell(x, y, z, 0, 0, 0, 0.36, 0.19, 0.17); d = sd.smin(d, sd.sph(x, y, z, 0.34, 0.14, 0, 0.125), 0.1); d = sd.smin(d, sd.cone(x, y, z, 0.43, 0.13, 0, 0.6, 0.08, 0, 0.05, 0.008), 0.02); return sd.smin(d, sd.ell(x, y, z, -0.48, 0.0, 0, 0.26, 0.035, 0.11), 0.08); };
  BK.bird = (s = 1, col = 0x6a4a2a) => { const T3 = T(), g = new T3.Group();
    const geo = BA.cached("bird" + col, () => { const c0 = lin(col), dk = mix3(c0, [0, 0, 0], 0.4), lt = mix3(c0, [1, 1, 1], 0.6), bk = lin(0xe0a020); return BA.mesh(birdSDF, [-0.8, -0.24, -0.22, 0.66, 0.32, 0.22], 0.018, { color: (x, y, z, nx, ny) => { if (x > 0.455) return bk; let c = mix3(c0, dk, sst(0.45, 0.65, BK.fbm(x * 12, y * 12, z * 12)) * 0.6); c = mix3(c, lt, sst(-0.1, -0.7, ny) * 0.8); return x < -0.45 ? mix3(c, dk, 0.5) : c; } }); });
    g.add(new T3.Mesh(geo, vstd({ roughness: 0.7 })));
    const wm = std({ color: col, roughness: 0.75, side: T3.DoubleSide }), sh = new T3.Shape(); sh.moveTo(-0.16, 0); sh.lineTo(0.16, 0); sh.quadraticCurveTo(0.2, 0.42, 0.02, 0.78); sh.lineTo(-0.1, 0.62); sh.lineTo(-0.16, 0.66); sh.lineTo(-0.2, 0.42); sh.lineTo(-0.27, 0.44); sh.closePath();
    g.wings = [1, -1].map((sdv) => { const piv = new T3.Group(), w = new T3.Mesh(new T3.ShapeGeometry(sh), wm); w.rotation.x = sdv * Math.PI / 2; w.position.set(0, 0, 0); piv.add(w); piv.position.set(0.02, 0.1, sdv * 0.1); g.add(piv); return piv; });
    for (const z of [-0.085, 0.085]) { const e = new T3.Mesh(new T3.SphereGeometry(0.018, 8, 6), new T3.MeshBasicMaterial({ color: 0x0a0a0a })); e.position.set(0.41, 0.17, z); g.add(e); const lg = new T3.Mesh(new T3.CylinderGeometry(0.008, 0.008, 0.2, 5), std({ color: 0xd9a030 })); lg.position.set(-0.02, -0.26, z * 0.7); g.add(lg); }
    g.scale.setScalar(s); return shadow(g); };

  /* ======================= insect (faces +x; optional g.wings) ======================= */
  const oldInsect = BK.insect;
  BK.insect = (s = 1, col = 0x5a3a1a, o = {}) => { const T3 = T(), g = new T3.Group(), c0 = new T3.Color(col), m = new T3.MeshPhysicalMaterial({ color: col, roughness: 0.32, clearcoat: 0.9, clearcoatRoughness: 0.25 }), dk = new T3.MeshPhysicalMaterial({ color: c0.clone().multiplyScalar(0.45), roughness: 0.4, clearcoat: 0.6 });
    for (let i = 0; i < 6; i++) { const r = 0.14 * (1 - Math.abs(i - 1.6) / 6.5), sg = new T3.Mesh(new T3.SphereGeometry(r, 14, 10), i % 2 ? dk : m); sg.scale.set(0.75, 0.82, 1); sg.position.set(-0.1 - i * 0.085, 0.005 - i * 0.004, 0); g.add(sg); }
    const th = new T3.Mesh(new T3.SphereGeometry(0.125, 16, 12), m); th.scale.set(1.25, 0.9, 0.95); th.position.x = 0.04; g.add(th);
    const hd = new T3.Mesh(new T3.SphereGeometry(0.085, 14, 10), m); hd.scale.set(0.9, 1.05, 1); hd.position.set(0.21, -0.01, 0); g.add(hd);
    const eyeM = new T3.MeshPhysicalMaterial({ color: 0x1a0c08, roughness: 0.15, clearcoat: 1 }), lm = std({ color: 0x1e1408, roughness: 0.6 });
    for (const sdv of [-1, 1]) { const e = new T3.Mesh(new T3.SphereGeometry(0.038, 10, 8), eyeM); e.position.set(0.24, 0.035, sdv * 0.062); g.add(e);
      for (let i = 0; i < 3; i++) { const hind = i === 2 && o.jump !== false && !o.wings, x0 = 0.09 - i * 0.075, k = hind ? 1.7 : 1;
        const fe = new T3.Mesh(new T3.CylinderGeometry(0.014 * k, 0.011, 0.2 * k, 6), hind ? m : lm), ti = new T3.Mesh(new T3.CylinderGeometry(0.008, 0.006, 0.24 * k, 5), lm);
        const knee = V(x0 + (i - 1) * 0.07 - (hind ? 0.12 : 0), 0.06 + (hind ? 0.16 : 0), sdv * (0.17 + (hind ? 0.02 : 0))), hip = V(x0, -0.04, sdv * 0.07), foot = V(knee.x + (i - 1) * 0.04 - (hind ? 0.02 : 0), -0.2, sdv * 0.26);
        const put = (mesh, a, b) => { const d = b.clone().sub(a), L = d.length(); mesh.scale.y = L / mesh.geometry.parameters.height; mesh.position.copy(a).addScaledVector(d, 0.5); mesh.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); g.add(mesh); };
        put(fe, hip, knee); put(ti, knee, foot); }
      if (o.antennae !== false) g.add(BA.tube(BA.curve([[0.26, 0.05, sdv * 0.03], [0.4, 0.17, sdv * 0.08], [0.56, 0.16, sdv * 0.16]]), 0.005, lm, { seg: 10, rs: 4 })); }
    if (o.wings && (o.wingOp || 0) > 0.92 && (o.wingR || 0) >= 0.4) {                                   // butterfly: patterned fore and hind wings
      const path = (q, k) => { q.moveTo(0.62 * k, 0); q.quadraticCurveTo(0.95 * k, 0.35 * k, k, 0.8 * k); q.quadraticCurveTo(0.9 * k, 1.02 * k, 0.72 * k, 0.9 * k); q.quadraticCurveTo(0.55 * k, 0.7 * k, 0.5 * k, 0.55 * k); q.quadraticCurveTo(0.4 * k, 0.85 * k, 0.2 * k, 0.8 * k); q.quadraticCurveTo(0, 0.6 * k, 0.08 * k, 0.35 * k); q.quadraticCurveTo(0.15 * k, 0.1 * k, 0.4 * k, 0); q.closePath(); };
      const cv = BK.cv(256, 256), q = cv.getContext("2d"); q.translate(0, 256); q.scale(1, -1); q.fillStyle = "#" + (o.wingCol || 0xff8a20).toString(16).padStart(6, "0"); q.fillRect(0, 0, 256, 256); q.strokeStyle = "#17110c"; q.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = 0.12 + i * 0.26; q.beginPath(); q.moveTo(140, 0); q.lineTo(140 + Math.cos(a) * 300, Math.sin(a) * 300); q.stroke(); } q.lineWidth = 26; q.beginPath(); path(q, 256); q.stroke(); q.fillStyle = "#fff"; for (let i = 0; i < 16; i++) { const u = i / 16; q.beginPath(); q.arc(160 + u * 84, 60 + u * 150 + Math.sin(u * 9) * 6, 4, 0, 6.3); q.fill(); }
      const tx2 = BK.tex(cv); tx2.wrapS = tx2.wrapT = T3.ClampToEdgeWrapping; const wm = new T3.MeshStandardMaterial({ map: tx2, roughness: 0.6, side: T3.DoubleSide }), sh = new T3.Shape(); path(sh, 1); g.wings = [];
      for (const sdv of [-1, 1]) { const w = new T3.Mesh(new T3.ShapeGeometry(sh, 10), wm), k = (o.wingR || 0.42) * 2.6; w.scale.setScalar(k); w.rotation.x = sdv * Math.PI / 2; w.position.set(-0.55 * k + 0.02, 0, sdv * 0.02); const piv = new T3.Group(); piv.position.set(0, 0.09, sdv * 0.04); piv.add(w); g.add(piv); g.wings.push(piv); }
    } else
    if (o.wings) { const wm = new T3.MeshPhysicalMaterial({ color: o.wingCol || 0xffffff, transparent: true, opacity: o.wingOp || 0.35, roughness: 0.1, iridescence: 1, side: T3.DoubleSide, depthWrite: false }); g.wings = [];
      for (const sdv of [-1, 1]) { const w = new T3.Mesh(new T3.CircleGeometry(o.wingR || 0.3, 24), wm); w.scale.set(1.6, 0.6, 1); const piv = new T3.Group(); piv.position.set(0, 0.08, sdv * 0.06); w.rotation.x = -Math.PI / 2; w.position.set(-0.15, 0, sdv * 0.28); piv.add(w); g.add(piv); g.wings.push(piv); } }
    g.scale.setScalar(s); return shadow(g); };

  /* ======================= tree and plant ======================= */
  BK.tree = (h = 4, seed = 1, leafCol = 0x2f6b2e) => { const T3 = T(), g = new T3.Group(), rr = BK.rng(seed * 13 + 1), bark = BK.mat.bark();
    const top = V((rr() - 0.5) * h * 0.08, h * 0.56, (rr() - 0.5) * h * 0.08), tc = BA.curve([[0, 0, 0], [top.x * 0.4, h * 0.3, top.z * 0.4], top]);
    g.add(BA.tube(tc, h * 0.06, bark, { seg: 16, rs: 9, r: (t) => 1.35 - 0.75 * t + 0.5 * Math.pow(1 - t, 6) }));
    const lc = lin(leafCol), l2 = mix3(lc, [1, 1, 0.3], 0.22), l3 = mix3(lc, [0, 0, 0], 0.35), geos = [], n = 9;
    for (let i = 0; i < n; i++) { const a = i * 2.4 + rr(), el = 0.25 + rr() * 0.9, R = h * (0.2 + rr() * 0.1), c = V(top.x + Math.cos(a) * Math.cos(el) * h * 0.22, h * 0.66 + Math.sin(el) * h * 0.2, top.z + Math.sin(a) * Math.cos(el) * h * 0.22);
      if (i < 4) g.add(BA.tube(BA.curve([tc.getPointAt(0.62 + i * 0.09), top.clone().lerp(c, 0.5).add(V(0, -h * 0.03, 0)), c]), h * 0.02, bark, { seg: 8, rs: 6, r: (t) => 1.2 - 0.7 * t }));
      const b = new T3.SphereGeometry(R, 18, 13), p = b.attributes.position, col = new Float32Array(p.count * 3), v = V();
      for (let k = 0; k < p.count; k++) { v.fromBufferAttribute(p, k); const nn = BK.fbm(v.x * 5 / h * 4 + seed + i, v.y * 5 / h * 4, v.z * 5 / h * 4), hf = BK.noise3(v.x * 26 / h * 4, v.y * 26 / h * 4 + i, v.z * 26 / h * 4); v.multiplyScalar(1 + (nn - 0.5) * 0.7 + (hf - 0.5) * 0.22); p.setXYZ(k, v.x + c.x, v.y * 0.82 + c.y, v.z + c.z); const cc = mix3(mix3(l3, lc, sst(0.25, 0.6, hf + v.y / R * 0.25)), l2, sst(0.55, 0.85, hf) * 0.8); col[k * 3] = cc[0]; col[k * 3 + 1] = cc[1]; col[k * 3 + 2] = cc[2]; }
      b.computeVertexNormals(); b.setAttribute("color", new T3.BufferAttribute(col, 3)); geos.push(b); }
    g.add(new T3.Mesh(BA.mergeC(geos), vstd({ roughness: 0.9, flatShading: false }))); return shadow(g); };
  const oldPlant = BK.plant;
  BK.plant = (o = {}) => { const T3 = T(), h = o.h || 2, grp = new T3.Group(), bend = o.bend || 0, lean = o.lean || 0, pts = [];
    for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(V(Math.sin(t * Math.PI * 0.5) * bend * h + lean * t * h, t * h, 0)); }
    const stemMat = o.stemMat || new T3.MeshPhysicalMaterial({ color: o.stemCol || 0x5f9a3c, roughness: 0.5, sheen: 0.4 }), r0 = o.r || 0.045, n = o.leaves || 6;
    const stem = BA.tube(new T3.CatmullRomCurve3(pts), r0, stemMat, { seg: 48, rs: 10, r: (t) => (1.25 - 0.6 * t) * (1 + 0.16 * Math.exp(-Math.pow(((t * (n + 1.5)) % 1) - 0.5, 2) * 60)) }); stem.castShadow = true; grp.add(stem); grp.stem = stem; grp.leaves = []; grp.curve = pts;
    const lm = o.leafMat || BK.mat.leaf(o.leafCol || "#3f8a3a", "#a8d47e"), L0 = o.leafLen || 0.55, W0 = o.leafW || 0.28;
    for (let i = 0; i < n; i++) { const t = 0.3 + 0.65 * i / Math.max(1, n - 1), p = pts[Math.round(t * 12)], L = L0 * (1.15 - t * 0.45);
      const lf = BK.leaf(L, W0 * (1.1 - t * 0.3), lm, 0.34), piv = new T3.Group(); piv.position.copy(p); piv.rotation.y = i * 2.4; lf.rotation.x = -1.0; lf.position.set(0, 0, 0);
      const pet = new T3.Mesh(new T3.CylinderGeometry(r0 * 0.28, r0 * 0.34, L * 0.22, 5), stemMat); pet.rotation.x = Math.PI / 2 - 1.0 + Math.PI / 2; pet.position.set(0, -Math.cos(1.0) * 0 , 0); pet.visible = false;
      piv.add(lf); grp.add(piv); grp.leaves.push(lf); }
    /* young leaves folded at the growing tip */
    for (const sdv of [-1, 1]) { const b = BK.leaf(L0 * 0.34, W0 * 0.4, lm, 0.1), piv = new T3.Group(); piv.position.copy(pts[12]); piv.rotation.y = sdv * 1.4 + n; b.rotation.x = -0.35; piv.add(b); grp.add(piv); }
    grp.tip = pts[12].clone(); return grp; };

  /* =====================================================================
     S-a  Joints and the vertebral column
     ===================================================================== */
  (function () {
    if (!MK.scenes["S-a"]) return;
    const bone = () => BA.mat.matte(TIS.bone, { roughness: 0.6 }), cart = () => new (T().MeshPhysicalMaterial)({ color: 0xbfe2f2, roughness: 0.25, clearcoat: 0.8 });
    const humerus = () => BA.cached("humerus", () => BA.mesh((x, y, z) => { let d = sd.cone(x, y, z, 0, 0.12, 0, 0, 2.12, 0, 0.085, 0.09); d = sd.smin(d, sd.sph(x, y, z, -0.09, 2.2, 0, 0.17), 0.1); d = sd.smin(d, sd.ell(x, y, z, 0.1, 2.12, 0, 0.09, 0.1, 0.1), 0.06); return sd.smin(d, sd.ell(x, y, z, 0, 0.03, 0, 0.13, 0.11, 0.19), 0.1); }, [-0.3, -0.12, -0.24, 0.24, 2.42, 0.24], 0.026));
    const forearm = () => BA.cached("forearm", () => BA.mesh((x, y, z) => { let u = sd.cone(x, y, z, -0.06, 0.02, 0, -0.05, 2.0, -0.03, 0.08, 0.045); u = sd.smin(u, sd.ell(x, y, z, -0.1, -0.1, 0, 0.09, 0.14, 0.1), 0.06); let r = sd.cone(x, y, z, 0.07, 0.14, 0, 0.06, 2.0, 0.03, 0.05, 0.08); r = sd.smin(r, sd.ell(x, y, z, 0.07, 0.12, 0, 0.075, 0.04, 0.075), 0.03); return Math.min(u, r); }, [-0.24, -0.28, -0.14, 0.18, 2.1, 0.14], 0.022));
    const scapula = () => BA.cached("scapula", () => BA.mesh((x, y, z) => { let d = sd.ell(x, y, z, -0.45, -0.25, -0.05, 0.42, 0.62, 0.06); d = sd.smin(d, sd.ell(x, y, z, -0.12, 0.0, 0, 0.14, 0.2, 0.17), 0.1); d = sd.smin(d, sd.cone(x, y, z, -0.6, 0.2, -0.08, 0.05, 0.32, 0.02, 0.05, 0.07), 0.06); return sd.smax(d, -sd.sph(x, y, z, 0.12, 0, 0, 0.2), 0.03); }, [-0.95, -0.95, -0.28, 0.2, 0.5, 0.24], 0.024));
    BA.addMode("S-a", "joints", {
      label: "Joints", dark: true, cam: [[1.5, 2.4, 9.4], [1.3, 1.9, 0]],
      values: { quiz: 0 }, controls: [QUIZ()],
      make(S, s, c, g) { const T3 = T(), P = (s.aparts = {});
        /* shoulder: ball and socket */
        const sc = new T3.Mesh(scapula(), bone()); sc.position.set(-1.9, 3.0, 0); g.add(sc);
        s.ball = new T3.Group(); s.ball.position.set(-1.78, 3.0, 0); const hu = new T3.Mesh(humerus(), bone()); hu.position.set(0.09, -2.2, 0); s.ball.add(hu);
        const cap = new T3.Mesh(new T3.SphereGeometry(0.185, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), cart()); cap.rotation.z = Math.PI / 2 + 0.3; s.ball.add(cap); g.add(s.ball);
        const caps = new T3.Mesh(new T3.SphereGeometry(0.33, 24, 16), new T3.MeshPhysicalMaterial({ color: 0xf2d98a, roughness: 0.2, transparent: true, opacity: 0.28, depthWrite: false })); caps.position.set(-1.82, 3.0, 0); caps.userData.baseOp = 0.28; caps.userData.soft = true; g.add(caps);
        /* elbow: hinge */
        const hu2 = new T3.Mesh(humerus(), bone()); hu2.position.set(1.5, 1.7, 0); g.add(hu2);
        s.hinge = new T3.Group(); s.hinge.position.set(1.5, 1.7, 0); const fa = new T3.Mesh(forearm(), bone()); fa.scale.set(1.3, 1, 1.3); s.hinge.add(fa); g.add(s.hinge);
        const c2 = new T3.Mesh(new T3.CylinderGeometry(0.135, 0.135, 0.36, 20), cart()); c2.rotation.x = Math.PI / 2; c2.position.set(1.5, 1.72, 0); g.add(c2);
        const lig = [-1, 1].map((z) => { const m = new T3.Mesh(new T3.BoxGeometry(0.1, 0.5, 0.025), std({ color: 0xf3dcd7, roughness: 0.6 })); m.position.set(1.5, 1.7, z * 0.21); g.add(m); return m; });
        P.ball = part("ball", "Ball: head of the humerus", "The rounded head fits into the socket and can turn in every direction.", [hu], [-1.5, 2.2, 0.15]);
        P.socket = part("socket", "Socket: scapula", "A shallow cup in the shoulder blade. The hip has a deeper socket in the pelvis.", [sc], [-2.5, 2.9, 0.1]);
        P.cart = part("cart", "Cartilage", "Smooth and slippery: it covers the ends of the bones, reduces friction and absorbs shock.", [cap, c2], [-1.72, 3.05, 0.2]);
        P.syn = part("syn", "Capsule with synovial fluid", "The synovial membrane makes synovial fluid, which lubricates the joint.", [caps], [-1.6, 3.3, 0.2]);
        P.hinge = part("hinge", "Hinge joint (elbow)", "Moves in one plane only, like a door hinge. The knee is also a hinge joint.", [fa, hu2], [1.9, 1.8, 0.2]);
        P.lig = part("lig", "Ligaments", "Tough, slightly elastic bands that join bone to bone and hold the joint together.", lig, [1.5, 1.9, 0.26]);
        tag(P); },
      update(S, s, c, dt) { const t = S.t; s.ball.rotation.set(Math.sin(t * 0.9) * 0.55, 0, 0.25 + Math.cos(t * 0.9) * 0.5); s.hinge.rotation.z = -0.25 - (0.5 + 0.5 * Math.sin(t * 1.1)) * 1.9; },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["socket", "syn", "cart", "ball", "lig", "hinge"], side: (id) => id === "socket" || id === "syn" || id === "ball" });  },
      hud: (s, c) => BA.focus.card(s, [{ title: "Synovial joints", lines: ["Ball and socket: movement in all planes (shoulder, hip).", "Hinge: movement in one plane (elbow, knee).", "Gliding (wrist, ankle), pivot (atlas–axis), fixed (skull sutures).", ["Cartilage reduces friction; synovial fluid lubricates.", "#7cb3ff"], ["Ligaments join bone to bone; tendons join muscle to bone.", "#ffd27a"]] }]),
    });
    /* one vertebra (centrum radius about 0.3; neural spine points −z) */
    const vert = () => BA.cached("vertebra", () => BA.mesh((x, y, z) => { const ax = Math.abs(x);
      let d = sd.smax(Math.hypot(x, z) - 0.3 * (0.94 + 0.5 * y * y / 0.02 * 0.02 + 0.06 * Math.abs(y) / 0.13), Math.abs(y) - 0.13, 0.04);
      const q = Math.hypot(Math.hypot(x, z + 0.4) - 0.19, y * 0.8) - 0.055; d = sd.smin(d, q, 0.05);                                          // neural arch round the canal
      d = sd.smin(d, sd.cone(x, y, z, 0, 0, -0.58, 0, -0.14, -1.0, 0.06, 0.035), 0.05);                                                       // neural spine
      d = sd.smin(d, sd.cone(ax, y, z, 0.2, 0, -0.36, 0.62, 0.02, -0.42, 0.055, 0.04), 0.05);                                                 // transverse processes
      return sd.smin(d, sd.sph(ax, y, z, 0.2, 0.12, -0.52, 0.06), 0.04); }, [-0.72, -0.26, -1.1, 0.72, 0.26, 0.36], 0.026));
    const REG = [["cervical", "Cervical vertebrae (7)", "Small and light: they support the head. The first two (atlas and axis) let the head nod and turn.", 7, 0.6, 0.72], ["thoracic", "Thoracic vertebrae (12)", "Each carries a pair of ribs. Long neural spines point downwards.", 12, 0.74, 0.96], ["lumbar", "Lumbar vertebrae (5)", "The largest: a thick centrum carries the weight of the upper body.", 5, 1.04, 1.16]];
    BA.addMode("S-a", "spine", {
      label: "Vertebral column", dark: true, cam: [[8.2, 2.6, -1.3], [0, 2.3, -1.3]],
      values: { quiz: 0 }, controls: [QUIZ()],
      make(S, s, c, g) { const T3 = T(), P = (s.aparts = {}), col = new T3.Group(); col.scale.setScalar(0.56); g.add(col);
        let y = 8.1, idx = 0; const total = 24, cordPts = [], discs = [], zAt = (t) => 0.3 * Math.sin(t * Math.PI * 2.5 + 0.5) - 0.12 * t;
        REG.forEach(([id, name, info, n, s0, s1]) => { const ms = []; for (let i = 0; i < n; i++) { const t = idx / total, k = s0 + (s1 - s0) * i / Math.max(1, n - 1), hgt = 0.27 * k; y -= hgt / 2; const z = zAt(t), m = new T3.Mesh(vert(), bone()); m.scale.setScalar(k); if (id === "thoracic") m.scale.z = k * 1.12; m.position.set(0, y, z); m.rotation.x = Math.atan2(zAt(t + 0.02) - zAt(t - 0.02), 0.3) * -0.9; col.add(m); ms.push(m); cordPts.push([0, y, z - 0.4 * k]);
            const dsc = new T3.Mesh(new T3.CylinderGeometry(0.27 * k, 0.27 * k, 0.07 * k, 18), cart()); dsc.position.set(0, y - hgt / 2 - 0.035 * k, z); dsc.rotation.x = m.rotation.x; col.add(dsc); discs.push(dsc); y -= hgt / 2 + 0.07 * k; idx++; }
          P[id] = part(id, name, info, ms, [0.25, ms[Math.floor(n / 2)].position.y * 0.56, 0.2]); });
        const zs = zAt(1), sac = new T3.Mesh(BA.cached("sacrum", () => BA.mesh((x, yy, z) => sd.smin(sd.smax(sd.cone(x, yy, z, 0, 0, 0, 0, -0.95, -0.34, 0.36, 0.1), Math.abs(z + (-yy) * 0.36) - 0.15, 0.08), sd.cone(x, yy, z, 0, -0.95, -0.34, 0, -1.35, -0.26, 0.07, 0.03), 0.05), [-0.5, -1.45, -0.6, 0.5, 0.2, 0.3], 0.03)), bone()); sac.position.set(0, y + 0.05, zs); col.add(sac);
        P.sacrum = part("sacrum", "Sacrum (5 fused) and coccyx", "Five vertebrae fused into one strong bone joined to the pelvic girdle. The coccyx below it is the remains of a tail.", [sac], [0.25, (y - 0.5) * 0.56, 0.1]);
        P.disc = part("disc", "Intervertebral discs", "Pads of cartilage between the vertebrae: they absorb shock and let the column bend.", discs, [0.2, discs[14].position.y * 0.56, 0.22]);
        const cord = BA.tube(BA.curve(cordPts), 0.075, std({ color: 0xf2d27a, roughness: 0.5 }), { seg: 80, rs: 8 }); col.add(cord);
        P.cord = part("cord", "Spinal cord", "Runs through the neural canals of the vertebrae, which protect it.", [cord], [0, 3.0, -0.3]);
        /* one enlarged lumbar vertebra, seen from above, with its parts named */
        const big = new T3.Mesh(vert(), bone()); big.scale.setScalar(1.25); big.rotation.set(0, 0, -Math.PI / 2); big.position.set(0, 2.3, 2.7); g.add(big); s.big = big;
        const L = (id, name, info, a) => { const m = pickBall(0.16, a[0], a[1], a[2]); g.add(m); P[id] = part(id, name, info, [m], a); P[id].noQuiz = false; };
        L("centrum", "Centrum", "The solid body of the vertebra: it carries the weight.", [0.2, 2.3, 2.7]); L("canal", "Neural canal", "The hole through which the spinal cord passes.", [0.2, 2.3, 2.2]); L("nspine", "Neural spine", "Points backwards: back muscles are attached to it.", [0.2, 2.3, 1.6]); L("trans", "Transverse process", "Side projections for muscles and ligaments (and ribs in the thorax).", [0.2, 1.6, 2.2]);
        tag(P); },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["cervical", "thoracic", "disc", "lumbar", "sacrum", "nspine", "canal", "trans", "centrum"], side: (id) => ["nspine", "canal", "trans", "centrum"].includes(id), hint: "Tap a region to isolate it", reach: 20 }); },
      hud: (s, c) => BA.focus.card(s, [{ title: "Vertebral column", lines: ["33 vertebrae: cervical 7, thoracic 12, lumbar 5, sacral 5 (fused), caudal 4 (coccyx).", "The S-shaped curves make it springy.", ["Centrum carries weight; the neural canal protects the spinal cord.", "#ffd27a"], ["Functions of the skeleton: support, protection, movement, breathing, making blood cells.", "#7cb3ff"], ["Left: one vertebra enlarged, seen from above.", "#a9b6d3"]] }]),
    });
  })();

  /* =====================================================================
     B-g  Teeth
     ===================================================================== */
  (function () {
    if (!MK.scenes["B-g"]) return;
    const DENT = { human: { up: [2, 1, 2, 3], lo: [2, 1, 2, 3] }, goat: { up: [0, 0, 3, 3], lo: [3, 1, 3, 3] }, dog: { up: [3, 1, 4, 2], lo: [3, 1, 4, 3] } };
    const TN = [["Incisor", "Chisel-shaped, one root: cuts and bites."], ["Canine", "Pointed, one long root: grips and tears."], ["Premolar", "Two cusps, one or two roots: crushes and grinds."], ["Molar", "Four or more cusps, two or three roots: grinds."]];
    /* tooth types: crown above y = 0 (enamel), root below (covered by the gum) */
    const toothSDF = [
      (x, y, z) => sd.smin(sd.smax(sd.ell(x, y, z, 0, 0.14, 0, 0.085, 0.2, 0.05 + 0.03 * clamp(1 - y / 0.3, 0, 1)), -y - 0.02, 0.03), sd.cone(x, y, z, 0, 0.02, 0, 0, -0.42, 0, 0.055, 0.014), 0.04),
      (x, y, z) => sd.smin(sd.cone(x, y, z, 0, 0.0, 0, 0, 0.36, 0, 0.085, 0.012), sd.cone(x, y, z, 0, 0.02, 0, 0, -0.56, 0, 0.065, 0.014), 0.05),
      (x, y, z) => { let d = sd.ell(x, y, z, 0, 0.1, 0, 0.095, 0.13, 0.11); for (const s of [-1, 1]) d = sd.smin(d, sd.sph(x, y, z, 0, 0.21, s * 0.055, 0.05), 0.03); return sd.smin(d, sd.cone(x, y, z, 0, 0.02, 0, 0, -0.44, 0, 0.06, 0.016), 0.04); },
      (x, y, z) => { let d = sd.ell(x, y, z, 0, 0.09, 0, 0.15, 0.12, 0.13); for (const a of [-1, 1]) for (const b of [-1, 1]) d = sd.smin(d, sd.sph(x, y, z, a * 0.075, 0.19, b * 0.065, 0.05), 0.03); for (const a of [-1, 1]) d = sd.smin(d, sd.cone(x, y, z, a * 0.075, 0.02, 0, a * 0.1, -0.4, 0, 0.055, 0.016), 0.03); return d; },
    ];
    const toothGeo = (t) => BA.cached("tooth" + t, () => { const en = lin(0xf7f4ea), en2 = lin(0xe9e2cf), rt = lin(0xe3cf9c); return BA.mesh(toothSDF[t], [-0.22, -0.6, -0.2, 0.22, 0.4, 0.2], 0.014, { color: (x, y, z) => (y < -0.01 ? rt : mix3(en, en2, sst(0.1, -0.0, y) * 0.6 + BK.noise3(x * 30, y * 30, z * 30) * 0.12)) }); });
    const tmat = () => new (T().MeshPhysicalMaterial)({ vertexColors: true, roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.2 });
    BA.addMode("B-g", "teeth", {
      label: "Teeth and dental formula", dark: true, cam: [[1.5, 2.6, 7.6], [1.15, 1.2, 0.4]],
      make(S, s, c, g) { s.sp = ""; s.jg = null; },
      update(S, s, c, dt) { const T3 = T();
        if (s.sp !== c.sp) { s.sp = c.sp; if (s.jg) BK.dispose(S, s.jg); const jg = (s.jg = new T3.Group()); s._ag ? s._ag.add(jg) : s.g.add(jg); const d = DENT[c.sp], P = (s.aparts = {}), byT = [[], [], [], []];
          const gum = new T3.MeshPhysicalMaterial({ color: 0xd9767c, roughness: 0.38, clearcoat: 0.6 }), el = c.sp === "human" ? 1 : 1.35;
          [1, -1].forEach((sdv) => { const R = sdv > 0 ? 1.25 : 1.17, y0 = 1.5 + sdv * 0.5;
            const arch = BA.tube(BA.curve(Array.from({ length: 21 }, (_, i) => { const a = Math.PI * (i / 20); return [Math.cos(a) * R, y0 + sdv * 0.27, Math.sin(a) * R * el]; })), 0.25, gum, { seg: 60, rs: 12 }); arch.scale.y = 1; jg.add(arch);
            const row = sdv > 0 ? d.up : d.lo, types = []; row.forEach((n, t) => { for (let i = 0; i < n; i++) types.push(t); }); const tot = types.length;
            [1, -1].forEach((side) => types.forEach((t, i) => { const a = Math.PI / 2 - side * (0.085 + (i / Math.max(1, tot)) * 1.42), th = new T3.Mesh(toothGeo(t), tmat()); const k = c.sp === "dog" && t === 1 ? 1.5 : c.sp === "dog" && (sdv > 0 ? t === 2 && i === tot - row[3] - 1 : t === 3 && i === tot - row[3]) ? 1.35 : 1;
              th.scale.set(k, sdv * k * (c.sp === "goat" && t >= 2 ? 1.15 : 1) * -1, k); th.position.set(Math.cos(a) * R, y0 - sdv * 0.03, Math.sin(a) * R * el); th.rotation.y = -a + Math.PI / 2; jg.add(th); byT[t].push(th); })); });
          if (c.sp === "goat") { const pad = new T3.Mesh(new T3.SphereGeometry(0.3, 20, 12), gum); pad.scale.set(1.5, 0.3, 0.8); pad.position.set(0, 1.86, 1.2 * el); jg.add(pad); P.pad = part("pad", "Horny pad", "A goat has no upper incisors or canines: the lower incisors bite against this hard pad.", [pad], [0, 1.9, 1.6]); }
          /* one of each kind, pulled out to show the root */
          TN.forEach(([name, info], t) => { const m = new T3.Mesh(toothGeo(t), tmat()); m.scale.setScalar(1.25); m.position.set(-0.95 + t * 0.62, 0.42, 1.9); jg.add(m); byT[t].push(m); P["t" + t] = part("t" + t, name + (byT[t].length > 1 ? "s" : " (none in this jaw)"), info, byT[t], [-0.95 + t * 0.62, 0.3, 2.0]); });
          tag(P); s.aF.sel = null; }
        s.jg.rotation.y = Math.sin(S.t * 0.35) * 0.18; },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["t0", "t1", "t2", "t3"].concat(c.sp === "goat" ? ["pad"] : []), world: s.jg, hint: "Tap a tooth type to see where it sits in the jaw", side: (id) => id === "t0" || id === "t1", reach: 26 }); },
    });
  })();

  /* =====================================================================
     R-c  The ear
     ===================================================================== */
  (function () {
    if (!MK.scenes["R-c"]) return;
    const EP = { pinna: ["Pinna (ear flap)", "Collects sound waves and directs them into the ear canal."], canal: ["Ear canal", "Carries sound to the eardrum. Wax and hairs trap dust."], drum: ["Eardrum", "A thin membrane that vibrates when sound waves hit it."], oss: ["Ossicles", "Three tiny bones (hammer, anvil, stirrup) that pass on and amplify the vibrations about 20 times."], oval: ["Oval window", "Passes the vibrations into the fluid of the cochlea."], coch: ["Cochlea", "A coiled, fluid-filled tube. Its sensory hair cells turn vibrations into nerve impulses."], canals: ["Semicircular canals", "Three fluid-filled loops at right angles: they detect movement of the head and keep balance."], nerve: ["Auditory nerve", "Carries impulses to the brain, which interprets them as sound."], eust: ["Eustachian tube", "Joins the middle ear to the throat and keeps the air pressure equal on both sides of the eardrum."] };
    BA.addMode("R-c", "ear", {
      label: "Ear", dark: true, cam: [[1.3, 2.0, 7.4], [0.95, 1.55, 0]],
      values: { quiz: 0, loud: 60 }, controls: [{ key: "loud", label: "Loudness", min: 0, max: 100, unit: "dB" }, QUIZ()],
      make(S, s, c, g) { const T3 = T(), M = {}, skin = BK.mat.skin(0x9a6544), pink = BA.mat.tissue(0xe0a090, { roughness: 0.5 }), bn = BA.mat.matte(TIS.bone, { roughness: 0.5 });
        M.pinna = new T3.Mesh(BA.cached("pinna", () => BA.mesh((x, y, z) => { let d = sd.ell(x, y, z, 0, 0.1, 0, 0.16, 0.72, 0.5); d = sd.smax(d, -sd.ell(x, y, z, 0.13, 0.12, 0.04, 0.14, 0.56, 0.36), 0.06); d = sd.smin(d, sd.ell(x, y, z, 0.02, -0.02, 0.12, 0.1, 0.22, 0.14), 0.08); return sd.smax(d, -sd.ell(x, y, z, 0.16, -0.02, 0.1, 0.16, 0.13, 0.1), 0.05); }, [-0.22, -0.7, -0.56, 0.24, 0.9, 0.56], 0.022)), skin); M.pinna.position.set(-3.0, 1.55, 0);
        M.canal = BA.tube(BA.curve([[-2.86, 1.53, 0.1], [-2.3, 1.6, 0.06], [-1.75, 1.5, 0]]), 0.16, new T3.MeshPhysicalMaterial({ color: 0xe9b8a4, roughness: 0.5, transparent: true, opacity: 0.5, side: T3.DoubleSide, depthWrite: false }), { seg: 24, rs: 16 }); M.canal.userData.baseOp = 0.5; M.canal.userData.soft = true;
        M.drum = new T3.Mesh(new T3.ConeGeometry(0.2, 0.07, 24, 1, true), new T3.MeshPhysicalMaterial({ color: 0xf0d8c8, roughness: 0.3, side: T3.DoubleSide, transparent: true, opacity: 0.9 })); M.drum.rotation.z = -Math.PI / 2; M.drum.position.set(-1.72, 1.5, 0); M.drum.userData.baseOp = 0.9;
        const o1 = BA.tube(BA.curve([[-1.68, 1.5, 0], [-1.6, 1.7, 0], [-1.52, 1.82, 0]]), 0.03, bn, { seg: 10, rs: 8, r: (t) => 0.7 + 1.1 * t }), o2 = BA.tube(BA.curve([[-1.52, 1.82, 0], [-1.38, 1.78, 0], [-1.3, 1.6, 0]]), 0.035, bn, { seg: 10, rs: 8, r: (t) => 1.3 - 0.6 * t }), o3 = new T3.Mesh(new T3.TorusGeometry(0.07, 0.016, 8, 16), bn); o3.position.set(-1.2, 1.56, 0); o3.rotation.y = Math.PI / 2; o3.scale.set(1, 1, 1.5); s.oss = [o1, o2, o3];
        M.oval = new T3.Mesh(new T3.CylinderGeometry(0.075, 0.075, 0.02, 16), std({ color: 0xbfe2f2, roughness: 0.3 })); M.oval.rotation.z = Math.PI / 2; M.oval.position.set(-1.1, 1.56, 0);
        const cp = []; for (let i = 0; i <= 90; i++) { const u = i / 90, a = u * Math.PI * 2 * 2.6, r = 0.52 * (1 - u * 0.78) + 0.06; cp.push([-0.42 + Math.cos(a + Math.PI) * r, 1.3 + Math.sin(a + Math.PI) * r * 0.95 - 0.1, u * 0.34]); }
        M.coch = BA.tube(BA.curve(cp), 0.115, BA.mat.tissue(0xd8b48c, { roughness: 0.4, clearcoat: 0.5 }), { seg: 200, rs: 12, r: (t) => 1.15 - 0.6 * t }); s.cochC = BA.curve(cp);
        const vest = new T3.Mesh(new T3.SphereGeometry(0.2, 18, 14), BA.mat.tissue(0xd8b48c, { roughness: 0.4, clearcoat: 0.5 })); vest.position.set(-0.86, 1.62, 0);
        const sc = [[0, 0, 0], [Math.PI / 2, 0, 0], [0, Math.PI / 2, 0.3]].map((r, i) => { const m = new T3.Mesh(new T3.TorusGeometry(0.27, 0.035, 8, 28, Math.PI * 1.55), BA.mat.tissue(0xc9a47c, { roughness: 0.4, clearcoat: 0.5 })); m.rotation.set(r[0], r[1], r[2] + 0.4); m.position.set(-0.86 + (i === 2 ? -0.05 : 0.02), 1.98 + (i === 1 ? -0.06 : 0), i === 1 ? -0.12 : 0); return m; });
        M.nerve = BA.tube(BA.curve([[-0.4, 1.2, 0.1], [0.2, 1.3, 0.05], [0.9, 1.7, 0], [1.5, 1.9, 0]]), 0.07, std({ color: TIS.nerve, roughness: 0.5 }), { seg: 30, rs: 10, r: (t) => 1.2 - 0.3 * t });
        M.eust = BA.tube(BA.curve([[-1.45, 1.38, 0], [-1.2, 0.9, 0.1], [-0.7, 0.45, 0.2]]), 0.06, pink, { seg: 20, rs: 10, r: (t) => 0.7 + 0.7 * t });
        const P = (s.aparts = {}), A = { pinna: [-3.0, 2.2, 0.1], canal: [-2.3, 1.62, 0.2], drum: [-1.72, 1.36, 0.1], oss: [-1.45, 1.86, 0.05], oval: [-1.1, 1.52, 0.1], coch: [-0.42, 0.85, 0.2], canals: [-0.8, 2.25, 0.05], nerve: [0.9, 1.7, 0.1], eust: [-1.0, 0.7, 0.15] };
        const meshes = { pinna: [M.pinna], canal: [M.canal], drum: [M.drum], oss: s.oss, oval: [M.oval], coch: [M.coch, vest], canals: sc, nerve: [M.nerve], eust: [M.eust] };
        Object.keys(EP).forEach((id) => { meshes[id].forEach((m) => g.add(m)); P[id] = part(id, EP[id][0], EP[id][1], meshes[id], A[id]); }); tag(P); s.drum = M.drum;
        s.wave = dots(30, 0.03); g.add(s.wave); s.imp = dots(10, 0.035); g.add(s.imp); s.wu = Array.from({ length: 30 }, (_, i) => i / 30); },
      update(S, s, c, dt) { const k = c.loud / 100, vib = Math.sin(S.t * 34) * 0.03 * k; s.drum.position.x = -1.72 + vib; s.oss.forEach((m, i) => { m.position.x = (i === 2 ? -1.2 : 0) + vib * (1 + i * 0.5); });
        for (let i = 0; i < 30; i++) { s.wu[i] = (s.wu[i] + dt * 0.45) % 1; const u = s.wu[i], ring = Math.floor(i / 6), a = (i % 6) / 6 * Math.PI * 2, uu = (u + ring * 0.2) % 1; putDot(s.wave, i, V(-4.3 + uu * 2.55, 1.55 + Math.sin(a) * 0.12 * (1 + (1 - uu) * 2.4), Math.cos(a) * 0.12 * (1 + (1 - uu) * 2.4)), 0x7fc8ff, k > 0.02 ? 0.5 + k : 0.001); } flush(s.wave);
        for (let i = 0; i < 10; i++) { const u = (S.t * 0.5 + i / 10) % 1; putDot(s.imp, i, u < 0.55 ? s.cochC.getPointAt(u / 0.55) : V(-0.4 + (u - 0.55) / 0.45 * 1.9, 1.2 + (u - 0.55) / 0.45 * 0.7, 0.1), u < 0.55 ? 0x9fe7ff : 0xffe066, k > 0.02 ? 0.4 + k * 0.8 : 0.001); } flush(s.imp); },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["pinna", "canal", "drum", "eust", "oss", "canals", "oval", "coch", "nerve"], side: (id) => ["pinna", "canal", "drum", "eust"].includes(id) }); },
      hud: (s, c) => BA.focus.card(s, [{ title: "Hearing", lines: [["Outer ear → middle ear → inner ear", "#ffd27a", true], "Sound waves → eardrum vibrates → ossicles amplify → oval window → fluid in the cochlea → hair cells → auditory nerve → brain.", ["Loudness " + c.loud + " dB: " + (c.loud > 85 ? "long exposure damages the hair cells (deafness)." : c.loud < 5 ? "silence." : "safe level."), c.loud > 85 ? "#ff7b72" : "#5bd68c"], ["Semicircular canals: balance. Eustachian tube: equal pressure.", "#7cb3ff"]] }]),
      readouts: (s, c) => [["Loudness", c.loud + " dB"]],
    });
  })();

  /* =====================================================================
     R-a  Toad metamorphosis
     ===================================================================== */
  (function () {
    if (!MK.scenes["R-a"]) return;
    const ease = (x) => { const q = clamp(x, 0, 1); return q * q * (3 - 2 * q); };
    const toadSDF = (p) => { const tail = 1 - ease((p - 0.6) / 0.35), hind = ease((p - 0.22) / 0.22), fore = ease((p - 0.45) / 0.2), bw = 0.3 + 0.12 * p;
      return (x, y, z) => { const az = Math.abs(z), S = sd.smin; let d = sd.ell(x, y, z, 0, 0.3, 0, 0.42 + 0.08 * p, 0.26 - 0.03 * p, bw);
        d = S(d, sd.ell(x, y, z, 0.38, 0.32, 0, 0.22, 0.17, 0.2 + 0.06 * p), 0.14); d = S(d, sd.sph(x, y, az, 0.42, 0.46, 0.13 + 0.03 * p, 0.05 + 0.035 * p), 0.04);
        if (tail > 0.03) d = S(d, sd.smax(sd.cone(x, y, z, -0.35, 0.3, 0, -0.4 - 1.25 * tail, 0.3, 0, 0.2, 0.02), az - 0.07, 0.04), 0.14);
        if (hind > 0.03) { let l = sd.cone(x, y, az, -0.3, 0.24, bw * 0.7, -0.05 - 0.05 * hind, 0.12, bw + 0.2 * hind, 0.1 * hind, 0.06 * hind); l = S(l, sd.cone(x, y, az, -0.05 - 0.05 * hind, 0.12, bw + 0.2 * hind, -0.42 * hind, 0.05, bw + 0.24 * hind, 0.06 * hind, 0.04 * hind), 0.03); l = S(l, sd.ell(x, y, az, -0.28 * hind, 0.03, bw + 0.33 * hind, 0.16 * hind, 0.022, 0.07 * hind), 0.03); d = S(d, l, 0.05); }
        if (fore > 0.03) d = S(d, S(sd.cone(x, y, az, 0.24, 0.22, bw * 0.75, 0.32, 0.06, bw + 0.12 * fore, 0.06 * fore, 0.035 * fore), sd.ell(x, y, az, 0.38, 0.03, bw + 0.13 * fore, 0.08 * fore, 0.02, 0.06 * fore), 0.02), 0.04);
        return d; }; };
    const toadGeo = (step) => BA.cached("toad" + step, () => { const p = step / 16, tad = lin(0x3c4426), toad = lin(0x6b6a34), wart = lin(0x3a3418), belly = lin(0xe2dcb8);
      return BA.mesh(toadSDF(p), [-1.75, -0.02, -0.8, 0.72, 0.62, 0.8], 0.03, { color: (x, y, z, nx, ny) => { let c = mix3(tad, toad, p); c = mix3(c, wart, sst(0.55, 0.66, BK.fbm(x * 10, y * 10, z * 10)) * (0.3 + 0.6 * p)); return mix3(c, belly, sst(-0.3, -0.8, ny) * 0.9); } }); });
    BA.addMode("R-a", "toad", {
      label: "Toad metamorphosis", cam: [[1.6, 2.7, 6.8], [1.0, 1.25, 0]],
      make(S, s, c, g) { const T3 = T(); BA.stage(S, s, false);
        s.tm = new T3.Mesh(toadGeo(0), new T3.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.3, clearcoat: 0.7 })); s.tm.castShadow = true; s.tg = new T3.Group(); s.tg.add(s.tm); s.tg.position.set(0.4, 0.9, 0); s.tg.scale.setScalar(1.5); g.add(s.tg);
        s.eyes = [-1, 1].map((sdv) => { const e = new T3.Mesh(new T3.SphereGeometry(0.035, 10, 8), new T3.MeshBasicMaterial({ color: 0x050505 })); s.tg.add(e); e.userData.s = sdv; return e; });
        s.water = new T3.Mesh(new T3.CircleGeometry(5, 48), new T3.MeshPhysicalMaterial({ color: 0x2f6a5a, roughness: 0.06, clearcoat: 1, transparent: true, opacity: 0.82 })); s.water.rotation.x = -Math.PI / 2; s.water.position.y = 1.5; g.add(s.water);
        const bed = new T3.Mesh(new T3.CircleGeometry(5, 48), BK.mat.soil([5, 5])); bed.rotation.x = -Math.PI / 2; bed.position.y = 0.42; bed.receiveShadow = true; g.add(bed);
        const lm = BK.mat.leaf("#3f8a3a", "#9ccc7a"); for (let i = 0; i < 5; i++) { const pad = new T3.Mesh(new T3.CircleGeometry(0.42 + (i % 2) * 0.15, 20, 0.3, 5.7), lm); pad.rotation.x = -Math.PI / 2; pad.position.set(-2.4 + i * 1.2, 1.52, -1.6 + (i % 3) * 0.5); g.add(pad); }
        for (let i = 0; i < 9; i++) { const w = BK.grassTuft(lm, 6, 0.9, i + 3); w.position.set(-3 + i * 0.8, 0.42, -2.4 + (i % 2) * 0.4); g.add(w); }
        s.step = -1; },
      update(S, s, c, dt) { const prog = Math.min(1, c.day / 90 * (0.15 + 0.85 * c.thy)); s.prog = prog; const st = Math.round(prog * 16);
        if (st !== s.step) { s.step = st; s.tm.geometry = toadGeo(st); }
        const p = st / 16; s.eyes.forEach((e) => { e.position.set(0.47, 0.47 + 0.01 * p, e.userData.s * (0.15 + 0.045 * p)); e.scale.setScalar(0.8 + p); });
        const out = ease((prog - 0.8) / 0.2); s.tg.position.y = 0.95 + out * 0.5 + Math.sin(S.t * 1.3) * 0.04 * (1 - out); s.tg.rotation.y = Math.sin(S.t * 0.4) * 0.35; s.tg.rotation.z = Math.sin(S.t * 5) * 0.03 * (1 - out); s.tg.position.x = 0.2 + Math.sin(S.t * 0.25) * 0.5 * (1 - out); },
      overlay(ctx, s, c, S, B) { const p = s.prog || 0, t = s.tg.position; if (p < 0.6) BK.lab(S, B, t.x - 1.6, t.y + 0.4, 0, "Tail", "#e8f1ff", 0, -8, 10); if (p > 0.25) BK.lab(S, B, t.x - 0.3, t.y + 0.15, 0.7, "Hind leg", "#ffd27a", 6, 10, 10); if (p > 0.48) BK.lab(S, B, t.x + 0.5, t.y + 0.1, 0.6, "Fore leg", "#ffd27a", 8, 12, 10); },
    });
  })();

  /* =====================================================================
     Part 2: touch-ups applied to existing scenes right after they build
     ===================================================================== */
  /* run fn once each time the scene (re)builds its main group */
  let afterN = 0;
  const after = (key, fn) => { const sc = MK.scenes[key]; if (!sc) return; const up = sc.update, flag = "_pg" + afterN++; sc.update = function (S, s, c, dt) { up && up.call(sc, S, s, c, dt); if (s.g && s[flag] !== s.g) { s[flag] = s.g; try { fn(S, s, c); } catch (e) { console.error("upgrade " + key, e); } } }; sc.label = "Realistic 3D lab"; };
  const strip = (grp) => { while (grp.children.length) { const ch = grp.children[0]; grp.remove(ch); ch.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); } };

  /* ---- R-f: fuller hibiscus petals with veins, and leaves on the stalk ---- */
  let petalTex = null;
  const petalMap = () => { if (petalTex) return petalTex; const c = BK.cv(256, 512), g = c.getContext("2d"), gr = g.createLinearGradient(0, 512, 0, 0); gr.addColorStop(0, "#5a0a18"); gr.addColorStop(0.22, "#b8182c"); gr.addColorStop(0.7, "#e0354a"); gr.addColorStop(1, "#f2647a"); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
    g.strokeStyle = "rgba(120,10,30,.38)"; for (let i = -9; i <= 9; i++) { g.lineWidth = 1.2; g.beginPath(); g.moveTo(128 + i * 3, 512); g.quadraticCurveTo(128 + i * 9, 300, 128 + i * 15, 0); g.stroke(); } petalTex = BK.tex(c); return petalTex; };
  const petalGeo2 = (len, wid) => { const g = new (T().PlaneGeometry)(wid, len, 12, 16), p = g.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i) + len / 2; const t = y / len, w = Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.86)), 0.7) * (0.35 + 0.65 * t); x *= w; p.setXYZ(i, x, y, -0.22 * t * t * len - Math.abs(x) * 0.18 + Math.sin(x * 9 + t * 4) * 0.035 * t); } g.computeVertexNormals(); return g; };
  after("R-f", (S, s, c) => { if (c.mode !== "insect" || !s.fl) return; const T3 = T(), pm = new T3.MeshStandardMaterial({ map: petalMap(), roughness: 0.62, side: T3.DoubleSide }), geo = petalGeo2(1.6, 1.45);
    s.fl.whorls[1].children.forEach((piv) => { const m = piv.children[0]; m.geometry.dispose(); m.geometry = geo; m.material = pm; });
    const lm = BK.mat.leaf("#3f8a3a", "#a8d47e"); [[-0.9, 0.6, 2.2], [-1.3, -0.5, 5.0]].forEach(([y, tilt, ry]) => { const piv = new T3.Group(); piv.position.y = y; piv.rotation.y = ry; const lf = BK.leaf(1.0, 0.62, lm, 0.3); lf.rotation.x = -1.1; piv.add(lf); s.fl.add(piv); }); });

  /* ---- R-e: a real caterpillar and chrysalis ---- */
  after("R-e", (S, s, c) => { if (c.sp !== "butterfly" || !s.cat) return; const T3 = T();
    s.cat.children.forEach((m) => { m.visible = false; });
    const geo = BA.cached("caterpillar", () => { const gr = lin(0x7ab83c), dk = lin(0x16240c), ye = lin(0xf2d83a); return BA.mesh((x, y, z) => { let d = 1e9; for (let i = 0; i < 11; i++) d = sd.smin(d, sd.ell(x, y, z, i * 0.13, 0, 0, 0.085, 0.105 - Math.abs(i - 5) * 0.004, 0.105 - Math.abs(i - 5) * 0.004), 0.03); d = sd.smin(d, sd.sph(x, y, z, 1.38, -0.01, 0, 0.085), 0.02); for (const i of [1, 2, 3, 5, 6, 7, 8, 10]) d = sd.smin(d, sd.cone(x, y, Math.abs(z), i * 0.13, -0.06, 0.05, i * 0.13, -0.15, 0.07, 0.03, 0.018), 0.015); return d; }, [-0.14, -0.2, -0.16, 1.5, 0.16, 0.16], 0.014, { color: (x, y, z) => { if (x > 1.32) return dk; const band = (x / 0.13 + 0.5) % 1; let col = mix3(gr, dk, (1 - sst(0.0, 0.1, Math.abs(band - 0.5))) * 0.85); col = mix3(col, ye, (1 - sst(0.02, 0.07, Math.abs(band - 0.32))) * 0.9 * (y > -0.03 ? 1 : 0)); return y < -0.07 ? mix3(col, dk, 0.4) : col; } }); });
    const m = new T3.Mesh(geo, new T3.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.45, clearcoat: 0.4 })); m.castShadow = true; s.cat.add(m);
    const pg = s.st[2], old = pg.children[0]; if (old) { old.visible = false; const ch = new T3.Mesh(BA.cached("chrysalis", () => BA.mesh((x, y, z) => { let d = sd.cone(x, y, z, 0, 0.36, 0, 0, -0.34, 0, 0.13, 0.03); d = sd.smin(d, sd.ell(x, y, z, 0, 0.2, 0.03, 0.15, 0.2, 0.16), 0.08); return d + 0.01 * Math.sin(y * 60); }, [-0.2, -0.4, -0.2, 0.2, 0.52, 0.24], 0.012, { color: (x, y, z) => mix3(lin(0x8fae4a), lin(0xd9c24a), sst(0.5, 0.9, 0.5 + 0.5 * Math.sin(y * 60)) * 0.5 + (y > 0.3 ? 0.4 : 0)) })), new T3.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.25, clearcoat: 1, iridescence: 0.5 })); ch.position.copy(old.position); ch.castShadow = true; pg.add(ch); const silk = new T3.Mesh(new T3.CylinderGeometry(0.006, 0.006, 0.25, 4), std({ color: 0xf2f2e6 })); silk.position.copy(old.position).add(V(0, 0.48, 0)); pg.add(silk); } });

  /* ---- A-b: organ, system and organism shown with the real models ---- */
  after("A-b", (S, s, c) => { if (c.mode !== "lvl" || !s.lv || s.lv.length < 5) return; const T3 = T();
    strip(s.lv[2]); const h = BA.heart({ simple: true }); h.scale.setScalar(0.42); h.position.y = -0.1; s.lv[2].add(h);
    strip(s.lv[3]); const net = BA.vessels(); net.group.scale.setScalar(0.6); net.group.position.y = -1.1; s.lv[3].add(net.group); net.group.step(0.016, 1); const h2 = BA.heart({ simple: true }); h2.scale.setScalar(0.08); h2.position.set(0.033, 0.27, 0.04); s.lv[3].add(h2); s.lvNet = net.group;
    strip(s.lv[4]); const b = BK.person(1.7, 0x3a6ad8); b.position.y = -0.85; s.lv[4].add(b); shadow(s.lv[2]); shadow(s.lv[4]); });
  (function () { const sc = MK.scenes["A-b"]; if (!sc) return; const up = sc.update; sc.update = function (S, s, c, dt) { up.call(sc, S, s, c, dt); if (c.mode === "lvl" && s.lvNet && s.lvNet.parent) s.lvNet.step(dt, 1); }; })();

  /* ---- R-b: a real arm for the reflex arc ---- */
  const armGeo = () => BA.cached("reflexArm", () => BA.mesh((x, y, z) => { let d = sd.cone(x, y, z, -1.7, 0.16, 0, -0.3, 0, 0, 0.27, 0.2); d = sd.smin(d, sd.cone(x, y, z, -0.3, 0, 0, 1.15, 0.04, 0, 0.2, 0.12), 0.08); d = sd.smin(d, sd.ell(x, y, z, 1.42, 0.05, 0, 0.24, 0.075, 0.16), 0.06);
    for (let i = 0; i < 4; i++) d = sd.smin(d, sd.cone(x, y, z, 1.6, 0.05, -0.12 + i * 0.08, 1.95 - Math.abs(i - 1.5) * 0.05, 0.03, -0.15 + i * 0.1, 0.04, 0.03), 0.02); return sd.smin(d, sd.cone(x, y, z, 1.35, 0.05, 0.14, 1.6, 0.06, 0.3, 0.05, 0.035), 0.03); }, [-2.0, -0.3, -0.36, 2.05, 0.46, 0.4], 0.028));
  after("R-b", (S, s, c) => { if (c.mode !== "reflex") return; const T3 = T(), cap = s.g.children.find((m) => m.isMesh && m.geometry.type === "CapsuleGeometry" && m.geometry.parameters.radius > 0.25); if (!cap) return;
    cap.visible = false; const arm = new T3.Mesh(armGeo(), BK.mat.skin(0x8d5a3b)); arm.scale.setScalar(0.82); arm.position.copy(cap.position).add(V(-0.1, 0, 0)); arm.rotation.z = cap.rotation.z - Math.PI / 2; arm.castShadow = true; s.g.add(arm); });

  /* ---- S-g: skin block with a living surface, fat lobules, oil glands and a nerve ---- */
  after("S-g", (S, s, c) => { const T3 = T(), g = s.g, boxes = g.children.filter((m) => m.isMesh && m.geometry.type === "BoxGeometry" && m.geometry.parameters.width === 4); if (boxes.length < 4) return;
    const top = boxes[0], geo = new T3.BoxGeometry(4, 0.25, 2.6, 60, 1, 40), p = geo.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setY(i, p.getY(i) + (BK.fbm(p.getX(i) * 2.2, 0, p.getZ(i) * 2.2) - 0.5) * 0.09 + (BK.noise3(p.getX(i) * 16, 1, p.getZ(i) * 16) - 0.5) * 0.02); geo.computeVertexNormals(); top.geometry.dispose(); top.geometry = geo; top.material = BK.mat.skin(0x8d5a3b); top.material.roughness = 0.62;
    const fat = boxes[3]; fat.material.opacity = 0.35; fat.material.transparent = true; fat.material.depthWrite = false; const rr = BK.rng(12), lob = new T3.InstancedMesh(new T3.SphereGeometry(0.2, 12, 9), new T3.MeshPhysicalMaterial({ color: 0xf0cf6a, roughness: 0.35, clearcoat: 0.5 }), 90), m4 = new T3.Matrix4();
    for (let i = 0; i < 90; i++) { const k = 0.7 + rr() * 0.6; m4.makeScale(k, k * 0.85, k); m4.setPosition(-1.8 + rr() * 3.6, -0.02 + rr() * 0.42, -1.1 + rr() * 2.2); lob.setMatrixAt(i, m4); } g.add(lob);
    (s.hairs || []).forEach((hg) => { const sg = new T3.Mesh(BK.blob(0.11, 6, 0.25, 12), new T3.MeshPhysicalMaterial({ color: 0xe8c04a, roughness: 0.4, clearcoat: 0.4 })); sg.position.set(hg.position.x - 0.16, 1.28, hg.position.z); g.add(sg); });
    const nv = BA.tube(BA.curve([[-2, 0.62, 0.9], [-1, 0.78, 0.8], [0.2, 0.7, 0.95], [0.9, 1.0, 0.9], [1.0, 1.42, 0.9]]), 0.03, std({ color: TIS.nerve, roughness: 0.5 }), { seg: 40, rs: 8 }); g.add(nv); const end = new T3.Mesh(new T3.SphereGeometry(0.07, 12, 10), std({ color: TIS.nerve, roughness: 0.5 })); end.scale.set(1, 1.5, 1); end.position.set(1.0, 1.46, 0.9); g.add(end); });
  (function () { const sc = MK.scenes["S-g"]; if (!sc) return; const ov = sc.overlay; sc.overlay = function (ctx, s, c, S, B) { ov && ov.call(sc, ctx, s, c, S, B); BK.lab(S, B, 1.0, 1.46, 0.95, "Nerve ending", "#ffe066", 8, -10, 10); BK.lab(S, B, 0.4, 0.2, 1.3, "Fat (insulation)", "#f0cf6a", 8, 8, 10); }; })();

  /* ---- S-e: leaf epidermis with jigsaw cells and chloroplasts in the guard cells ---- */
  let epiTex = null;
  const epiMap = () => { if (epiTex) return epiTex; const c = BK.cv(512, 512), g = c.getContext("2d"), rr = BK.rng(8); g.fillStyle = "#7fb866"; g.fillRect(0, 0, 512, 512);
    const pts = []; for (let i = 0; i < 70; i++) pts.push([rr() * 512, rr() * 512]);
    const im = g.getImageData(0, 0, 512, 512), d = im.data; for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) { let a = 1e9, b = 1e9; const wx = x + Math.sin(y * 0.09) * 9, wy = y + Math.sin(x * 0.08) * 9; for (const q of pts) { let dx = Math.abs(wx - q[0]), dy = Math.abs(wy - q[1]); dx = Math.min(dx, 512 - dx); dy = Math.min(dy, 512 - dy); const dd = dx * dx + dy * dy; if (dd < a) { b = a; a = dd; } else if (dd < b) b = dd; } const e = Math.sqrt(b) - Math.sqrt(a), k = e < 3.5 ? 0.55 : 1 + (rr() - 0.5) * 0.05, i = (y * 512 + x) * 4; d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; } g.putImageData(im, 0, 0); epiTex = BK.tex(c, [2, 1]); return epiTex; };
  after("S-e", (S, s, c) => { if (c.mode !== "stom" || !s.guards) return; const T3 = T(), leaf = s.g.children.find((m) => m.isMesh && m.geometry.type === "BoxGeometry"); if (leaf) leaf.material = new T3.MeshPhysicalMaterial({ map: epiMap(), roughness: 0.45, clearcoat: 0.3 });
    const cm = new T3.MeshPhysicalMaterial({ color: 0x1f7a2a, roughness: 0.4, clearcoat: 0.5 }); s.guards.forEach((gg) => gg.children.forEach((gc) => { if (!gc.isMesh) return; for (let i = 0; i < 7; i++) { const a = 0.3 + i * 0.42, ch = new T3.Mesh(new T3.SphereGeometry(0.045, 8, 6), cm); ch.scale.set(1.5, 1, 0.8); ch.position.set(Math.cos(a) * 0.34, Math.sin(a) * 0.34, 0.12); gc.add(ch); } })); });

  /* ---- A-e: plant cells with a visible cellulose wall ---- */
  after("A-e", (S, s, c) => { if (c.mode !== "plas") return; const T3 = T(); s.g.children.filter((m) => m.isMesh && m.geometry.type === "BoxGeometry" && m.geometry.parameters.width === 2).forEach((w) => { const ed = new T3.LineSegments(new T3.EdgesGeometry(w.geometry), new T3.LineBasicMaterial({ color: 0x3f7a2a })); w.add(ed); const fr = new T3.Mesh(new T3.BoxGeometry(2.06, 1.46, 1.46), new T3.MeshPhysicalMaterial({ color: 0x8fc46a, roughness: 0.5, transparent: true, opacity: 0.16, depthWrite: false, side: T3.BackSide })); w.add(fr); }); });

  /* ---- B-c: yam as boiled slices ---- */
  after("B-c", (S, s, c) => { const y = s.items && s.items.yam; if (!y) return; const T3 = T(); let i = 0; y.traverse((p) => { if (!p.isMesh || p.geometry.type !== "BoxGeometry") return; p.geometry.dispose(); p.geometry = new T3.CylinderGeometry(0.27, 0.27, 0.16, 24); p.material = [std({ color: 0x8a6a48, roughness: 0.9 }), std({ color: 0xf6eed6, roughness: 0.8 }), std({ color: 0xf6eed6, roughness: 0.8 })]; p.rotation.set(0.25 * (i - 1), i, 0.2); p.position.y = 0.1 + i * 0.07; i++; }); });

  /* =====================================================================
     Part 3: fruits, wild animals, dividing cells, food, starch test, factory and pyramids
     ===================================================================== */
  /* ---- R-g: seed dispersal props ---- */
  after("R-g", (S, s, c) => { const T3 = T(), g = s.g;
    if (c.mode === "wind") { const pole = g.children.find((m) => m.isMesh && m.geometry.type === "CylinderGeometry" && m.material.map); if (pole) { const hgt = pole.geometry.parameters.height, x = pole.position.x; pole.material = new T3.MeshPhysicalMaterial({ color: 0x5f9a3c, roughness: 0.5 }); pole.scale.set(0.45, 1, 0.45);
        const head = new T3.Mesh(new T3.SphereGeometry(0.2, 16, 12), std({ color: 0x8a7a4a, roughness: 0.9 })); head.scale.set(1, 0.6, 1); head.position.set(x, hgt, 0); g.add(head);
        const fl = new T3.InstancedMesh(new T3.CylinderGeometry(0.004, 0.004, 0.36, 3), std({ color: 0xffffff, roughness: 0.6 }), 90), m4 = new T3.Matrix4(), q = new T3.Quaternion(), rr = BK.rng(3); for (let i = 0; i < 90; i++) { const d = V(rr() - 0.5, rr() * 0.9 + 0.05, rr() - 0.5).normalize(); q.setFromUnitVectors(V(0, 1, 0), d); m4.compose(V(x, hgt, 0).addScaledVector(d, 0.3), q, V(1, 1, 1)); fl.setMatrixAt(i, m4); } g.add(fl);
        const lm = BK.mat.leaf("#3f8a3a", "#a8d47e"); for (let i = 0; i < 5; i++) { const piv = new T3.Group(); piv.position.set(x, 0.02, 0); piv.rotation.y = i * 1.26; const lf = BK.leaf(0.75, 0.3, lm, 0.35); lf.rotation.x = -1.25; piv.add(lf); g.add(piv); } } }
    if (c.mode === "expl" && s.pod) { const pm = new T3.MeshStandardMaterial({ map: (() => { const cv = BK.cv(128, 64), q = cv.getContext("2d"); q.fillStyle = "#8a6a2c"; q.fillRect(0, 0, 128, 64); for (let i = 0; i < 300; i++) { q.strokeStyle = `rgba(${60 + Math.random() * 60},${40 + Math.random() * 40},10,.4)`; q.beginPath(); const y = Math.random() * 64; q.moveTo(0, y); q.lineTo(128, y + (Math.random() - 0.5) * 8); q.stroke(); } return BK.tex(cv); })(), roughness: 0.75, side: T3.DoubleSide });
      s.pod.children.forEach((h) => { if (!h.isMesh) return; h.material = pm; h.scale.set(3.0, 0.62, 0.55); }); const stalk = BA.tube(BA.curve([[-1.25, 0, 0], [-1.7, 0.25, 0], [-2.3, 0.35, 0]]), 0.035, std({ color: 0x5a6a2a, roughness: 0.8 }), { seg: 10, rs: 6 }); s.pod.add(stalk); const lm = BK.mat.leaf("#4f8a3a", "#a8d47e"); for (const sdv of [-1, 1]) { const lf = BK.leaf(0.7, 0.3, lm, 0.2); lf.position.set(-2.1, 0.33, 0); lf.rotation.set(0.3, 0, sdv * 1.1 + 1.57); s.pod.add(lf); } }
    if (c.mode === "water" && s.nut) { s.nut.material = new T3.MeshStandardMaterial({ map: (() => { const cv = BK.cv(256, 256), q = cv.getContext("2d"); q.fillStyle = "#7a5a30"; q.fillRect(0, 0, 256, 256); for (let i = 0; i < 1400; i++) { q.strokeStyle = `rgba(${90 + Math.random() * 90},${60 + Math.random() * 60},${20 + Math.random() * 30},.55)`; q.lineWidth = 1 + Math.random(); const x = Math.random() * 256; q.beginPath(); q.moveTo(x, 0); q.bezierCurveTo(x + 8, 90, x - 8, 170, x + 4, 256); q.stroke(); } return BK.tex(cv, [2, 1]); })(), roughness: 0.95 });
      const isl = new T3.Mesh(new T3.SphereGeometry(3.2, 40, 16, 0, Math.PI * 2, 0, 0.5), std({ color: 0xe6d3a0, roughness: 1 })); isl.position.set(-5.6, -2.55, -4.5); isl.receiveShadow = true; g.add(isl); const pa = BA.farm.palm(3.6, 4); pa.position.set(-5.4, 0.35, -4.6); pa.rotation.z = -0.12; g.add(pa); const p2 = BA.farm.palm(2.8, 9); p2.position.set(-6.6, 0.3, -4.0); g.add(p2); } });

  /* ---- population scenes: animals instead of capsules ---- */
  const herdGeo = (kind, col, size) => BA.cached("herd" + kind + col, () => { const g = BA.quad(1, col, { kind }).children[0].geometry.clone(); g.scale(size, size, size); g.translate(0, -0.12, 0); g.rotateZ(-Math.PI / 2); return g; });
  ["C-i", "GH4-b"].forEach((key) => after(key, (S, s, c) => { s.g.traverse((m) => { if (!m.isInstancedMesh || m.geometry.type !== "CapsuleGeometry") return; const pred = m.geometry.parameters.radius > 0.1; m.geometry = herdGeo(pred ? "fox" : "antelope", pred ? 0xc8602a : 0xb89a7a, pred ? 0.5 : 0.36); m.material = vstd({ roughness: 0.8 }); m.castShadow = true; }); }));

  /* ---- A-k / GH2-d: a living cell around the chromosomes ---- */
  ["A-k", "GH2-d"].forEach((key) => after(key, (S, s, c) => { if (!s.mem) return; const T3 = T(), rr = BK.rng(21), g = s.g;
    s.mem.material = new T3.MeshPhysicalMaterial({ color: c.mode === "bud" ? 0xf3d9a0 : 0x9fd0ea, roughness: 0.12, transparent: true, opacity: 0.3, clearcoat: 1, sheen: 1, sheenColor: new T3.Color(0xffffff), side: T3.DoubleSide, depthWrite: false });
    const mito = new T3.InstancedMesh(new T3.CapsuleGeometry(0.055, 0.16, 4, 8), new T3.MeshPhysicalMaterial({ color: 0xe8884a, roughness: 0.4, clearcoat: 0.5, transparent: true, opacity: 0.85 }), 16), m4 = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler();
    for (let i = 0; i < 16; i++) { const d = V(rr() - 0.5, rr() - 0.5, rr() - 0.5).normalize().multiplyScalar(1.05 + rr() * 0.45); m4.compose(d, q.setFromEuler(e.set(rr() * 3, rr() * 3, rr() * 3)), V(1, 1, 1)); mito.setMatrixAt(i, m4); } g.add(mito);
    const er = new T3.MeshPhysicalMaterial({ color: 0x7fb8d8, roughness: 0.4, transparent: true, opacity: 0.4, depthWrite: false }); for (let i = 0; i < 5; i++) { const a = i * 1.26, pts = []; for (let j = 0; j <= 10; j++) { const u = j / 10; pts.push([Math.cos(a + u * 0.9) * (1.2 + Math.sin(u * 9 + i) * 0.12), -0.5 + u + Math.sin(u * 7 + i) * 0.1, Math.sin(a + u * 0.9) * (1.2 + Math.cos(u * 8) * 0.12)]); } g.add(BA.tube(BA.curve(pts), 0.03, er, { seg: 30, rs: 6 })); } }));

  /* ---- food: beans, leafy vegetables and tomatoes with stalks ---- */
  after("B-c", (S, s, c) => { const T3 = T(), it = s.items || {}, rr = BK.rng(6), swap = (holder, make) => { if (!holder) return; const inner = holder.children[0] || holder; const keep = inner.children && inner.children.length ? inner : holder; keep.children.slice().forEach((ch) => { ch.visible = false; }); if (keep.isMesh) { keep.material = keep.material.clone(); keep.material.visible = false; } keep.add(make()); };
    swap(it.beans, () => { const im = new T3.InstancedMesh(new T3.SphereGeometry(0.07, 10, 8), new T3.MeshPhysicalMaterial({ color: 0x8a4a2a, roughness: 0.45, clearcoat: 0.4 }), 70), m4 = new T3.Matrix4(), q = new T3.Quaternion(), e = new T3.Euler(); for (let i = 0; i < 70; i++) { const r = Math.sqrt(rr()) * 0.42, a = rr() * 6.3; m4.compose(V(Math.cos(a) * r, 0.05 + (0.42 - r) * 0.35 * rr() + 0.02, Math.sin(a) * r), q.setFromEuler(e.set(rr() * 3, rr() * 3, 0)), V(1.5, 0.8, 0.9)); im.setMatrixAt(i, m4); } im.castShadow = true; return im; });
    swap(it.veg, () => { const gr = new T3.Group(), lm = BK.mat.leaf("#2f7a2a", "#7fbf5a"); for (let i = 0; i < 12; i++) { const lf = BK.leaf(0.42 + rr() * 0.2, 0.26, lm, 0.5); lf.rotation.set(-1.3 + rr() * 0.5, rr() * 6.3, 0); lf.position.set((rr() - 0.5) * 0.4, 0.05 + rr() * 0.12, (rr() - 0.5) * 0.4); gr.add(lf); } return gr; }); });
  after("C-j", (S, s, c) => { const T3 = T(); (s.toms || []).forEach((tm) => { const st = new T3.Mesh(new T3.CylinderGeometry(0.012, 0.016, 0.1, 5), std({ color: 0x3f6a2a })); st.position.y = 0.3; tm.add(st); for (let i = 0; i < 5; i++) { const sp = new T3.Mesh(new T3.ConeGeometry(0.03, 0.14, 4), std({ color: 0x3f7a2a, roughness: 0.7 })); sp.position.set(Math.cos(i * 1.257) * 0.06, 0.265, Math.sin(i * 1.257) * 0.06); sp.rotation.set(Math.sin(i * 1.257) * 1.35, 0, -Math.cos(i * 1.257) * 1.35); tm.add(sp); } }); });

  /* ---- B-a: starch test on a white tile with an iodine dropper bottle ---- */
  after("B-a", (S, s, c) => { if (c.mode !== "starch" || !s.leaf) return; const T3 = T(), g = s.g, lp = s.leaf.position;
    const tile = new T3.Mesh(new T3.BoxGeometry(3.6, 0.07, 2.6), window.P3D.mat.ceramic(0xf7f7f2)); tile.position.set(lp.x, Math.max(0.035, lp.y - 0.08), lp.z); tile.receiveShadow = true; g.add(tile);
    const pet = BA.tube(BA.curve([[0, 0, 0], [0, -0.3, 0.02], [0.05, -0.6, 0.0]]), 0.03, std({ color: 0x6f9a3c, roughness: 0.6 }), { seg: 8, rs: 6 }); s.leaf.add(pet);
    const bt = new T3.Group(); const body = new T3.Mesh(new T3.CylinderGeometry(0.2, 0.22, 0.55, 20), new T3.MeshPhysicalMaterial({ color: 0x6a3a12, roughness: 0.15, transparent: true, opacity: 0.8, clearcoat: 1 })); body.position.y = 0.28; const neck = new T3.Mesh(new T3.CylinderGeometry(0.08, 0.1, 0.14, 14), body.material); neck.position.y = 0.62; const cap = new T3.Mesh(new T3.SphereGeometry(0.1, 14, 10), std({ color: 0x1c1c1c, roughness: 0.6 })); cap.scale.y = 1.5; cap.position.y = 0.78; bt.add(body, neck, cap); bt.position.set(lp.x + 2.3, 0, lp.z - 0.5); g.add(shadow(bt)); s.iodine = bt; });
  (function () { const sc = MK.scenes["B-a"]; if (!sc) return; const ov = sc.overlay; sc.overlay = function (ctx, s, c, S, B) { ov && ov.call(sc, ctx, s, c, S, B); if (c.mode === "starch" && s.iodine && s.iodine.parent) BK.lab(S, B, s.iodine.position.x, 1.05, s.iodine.position.z, "Iodine solution", "#ffd27a", 0, -6, 10); }; })();

  /* ---- C-g: a factory that looks like one ---- */
  after("C-g", (S, s, c) => { const T3 = T(), g = s.g, fac = g.children.find((m) => m.isMesh && m.geometry.type === "BoxGeometry" && m.geometry.parameters.width === 1.8); if (!fac) return; const F = BA.farm, p = fac.position;
    fac.material = F.mudMat(); fac.material.color.setHex(0xc9c2b8);
    for (let i = 0; i < 3; i++) { const sh = new T3.Shape(); sh.moveTo(0, 0); sh.lineTo(0.6, 0); sh.lineTo(0, 0.34); sh.closePath(); const r = new T3.Mesh(new T3.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false }), F.roofMat()); r.position.set(p.x - 0.9 + i * 0.6, p.y + 0.6, p.z - 0.6); g.add(r); }
    const wm = new T3.MeshStandardMaterial({ color: 0x9fd0ea, emissive: 0x2a4a6a, emissiveIntensity: 0.4, roughness: 0.2 }); for (let i = 0; i < 4; i++) { const w = new T3.Mesh(new T3.BoxGeometry(0.26, 0.22, 0.03), wm); w.position.set(p.x - 0.66 + i * 0.44, p.y + 0.22, p.z + 0.61); g.add(w); }
    const door = new T3.Mesh(new T3.BoxGeometry(0.42, 0.6, 0.03), std({ color: 0x3a4250, metalness: 0.4, roughness: 0.5 })); door.position.set(p.x + 0.5, 0.3, p.z + 0.61); g.add(door);
    if (s.chim) { s.chim.material = F.mudMat(); s.chim.material.color.setHex(0xb85a44); for (const y of [0.7, 1.0]) { const band = new T3.Mesh(new T3.TorusGeometry(0.17, 0.025, 6, 20), std({ color: 0xf2f2f2 })); band.rotation.x = Math.PI / 2; band.position.set(s.chim.position.x, s.chim.position.y + y, s.chim.position.z); g.add(band); } }
    const tank = new T3.Mesh(new T3.CylinderGeometry(0.32, 0.32, 0.8, 20), std({ color: 0x8a949e, metalness: 0.6, roughness: 0.4 })); tank.position.set(p.x - 1.35, 0.4, p.z + 0.2); g.add(tank); g.add(BA.tube(BA.curve([[p.x - 1.35, 0.8, p.z + 0.2], [p.x - 1.35, 1.0, p.z + 0.1], [p.x - 0.95, 1.0, p.z]]), 0.04, std({ color: 0x8a949e, metalness: 0.6, roughness: 0.4 }), { seg: 12, rs: 8 })); shadow(g); });

  /* ---- C-d: living things on each step of the pyramid ---- */
  after("C-d", (S, s, c) => { const T3 = T(), g = s.g, bars = g.children.filter((m) => m.isMesh && m.geometry.type === "BoxGeometry").sort((a, b) => a.position.y - b.position.y); if (bars.length < 3) return; const rr = BK.rng(4), gm = BK.mat.leaf("#5f9a3a", "#9ccc7a");
    bars.forEach((b, i) => { const P = b.geometry.parameters, w = P.width * b.scale.x, d = P.depth * b.scale.z, top = b.position.y + P.height * b.scale.y / 2, n = [7, 4, 2, 1][Math.min(3, i)];
      for (let k = 0; k < n; k++) { const x = b.position.x + (n === 1 ? 0 : (k / (n - 1) - 0.5) * w * 0.8), z = b.position.z + d * 0.5 - 0.12 - rr() * Math.min(0.3, d * 0.3); let o;
        if (i === 0) o = BK.grassTuft(gm, 7, 0.3, k + 2); else if (i === 1) o = BK.insect(0.3, 0x5a9a2a); else if (i === 2) o = BK.frog(0.42); else o = BK.bird(0.5, 0x5a3a1a);
        o.position.set(x, top + (i === 1 ? 0.07 : i === 3 ? 0.16 : 0), z); o.rotation.y = i === 0 ? rr() * 6 : -0.6 + rr() * 0.5; b.parent.add(o); } }); });
})();

/* animal-gut.js — a goat (ruminant herbivore) and a dog (monogastric carnivore) with their digestive systems.
   Bodies are signed-distance shapes with painted coats; organs sit in their real positions inside.
   Three skins: see-through, opened left flank, full coat. Tap an organ to isolate it, follow the food, or play Find the Organ.
   Needs bio-kit.js and bio-atlas.js. Registers "H2-c#gut" in the Agricultural Science lab and "B-g#gut" in the Biology lab.
   All shapes are generated in code; no model files. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, BA = window.BA, AK = window.AK;
  if (!MK || !BK || !BA) return;
  const sd = BA.sd, lin = BA.lin, mix3 = BA.mix3, TIS = BA.tis;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ================= bodies (face +x, stand on y = 0, left side is −z) ================= */
  function leg(x, y, az, pts, k) { let l = 1e9; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; l = sd.smin(l, sd.cone(x, y, az, a[0], a[1], a[2], b[0], b[1], b[2], a[3], b[3]), k || 0.02); } return l; }
  function goatSDF(x, y, z) {
    const az = Math.abs(z), S = sd.smin;
    let d = sd.ell(x, y, z, -0.04, 0.665, 0, 0.47, 0.27, 0.24);                                   // pot-bellied barrel
    d = S(d, sd.ell(x, y, z, 0.3, 0.7, 0, 0.2, 0.24, 0.185), 0.1);                                // chest and shoulders
    d = S(d, sd.ell(x, y, z, -0.4, 0.72, 0, 0.19, 0.2, 0.19), 0.1);                               // rump
    d = S(d, sd.cone(x, y, z, 0.4, 0.78, 0, 0.66, 1.0, 0, 0.16, 0.1), 0.09);                    // neck
    d = S(d, sd.ell(x, y, z, 0.715, 1.06, 0, 0.12, 0.105, 0.095), 0.05);                          // skull
    d = S(d, sd.cone(x, y, z, 0.74, 1.05, 0, 0.95, 0.935, 0, 0.095, 0.056), 0.04);                 // face
    d = S(d, sd.ell(x, y, z, 0.955, 0.925, 0, 0.045, 0.04, 0.045), 0.03);                         // muzzle
    d = S(d, sd.cone(x, y, az, 0.68, 1.085, 0.07, 0.63, 1.05, 0.2, 0.034, 0.018), 0.02);          // ears
    d = S(d, sd.cone(x, y, az, 0.7, 1.14, 0.04, 0.6, 1.25, 0.06, 0.026, 0.016), 0.012);           // horns sweep back
    d = S(d, sd.cone(x, y, az, 0.6, 1.25, 0.06, 0.5, 1.27, 0.085, 0.016, 0.005), 0.01);
    d = S(d, sd.cone(x, y, z, 0.9, 0.9, 0, 0.875, 0.77, 0, 0.028, 0.006), 0.02);                  // beard
    d = S(d, leg(x, y, az, [[0.3, 0.62, 0.105, 0.075], [0.31, 0.33, 0.1, 0.036], [0.3, 0.07, 0.1, 0.03]]), 0.05);
    d = S(d, sd.ell(x, y, az, 0.315, 0.035, 0.1, 0.045, 0.035, 0.036), 0.015);                    // fore hoof
    d = S(d, leg(x, y, az, [[-0.4, 0.68, 0.115, 0.095], [-0.36, 0.4, 0.11, 0.045], [-0.44, 0.3, 0.11, 0.034], [-0.41, 0.07, 0.11, 0.03]]), 0.05);
    d = S(d, sd.ell(x, y, az, -0.395, 0.035, 0.11, 0.045, 0.035, 0.036), 0.015);                  // hind hoof
    d = S(d, sd.cone(x, y, z, -0.57, 0.85, 0, -0.65, 0.95, 0, 0.032, 0.014), 0.03);               // short upturned tail
    return d;
  }
  function dogSDF(x, y, z) {
    const az = Math.abs(z), S = sd.smin;
    let d = sd.ell(x, y, z, 0.2, 0.69, 0, 0.27, 0.205, 0.15);                                     // deep rib cage
    d = S(d, sd.ell(x, y, z, -0.12, 0.735, 0, 0.3, 0.14, 0.125), 0.12);                           // loin with tucked-up belly
    d = S(d, sd.ell(x, y, z, -0.4, 0.71, 0, 0.16, 0.165, 0.14), 0.1);                             // hindquarters
    d = S(d, sd.cone(x, y, z, 0.38, 0.79, 0, 0.6, 1.0, 0, 0.125, 0.08), 0.08);                    // neck
    d = S(d, sd.ell(x, y, z, 0.65, 1.05, 0, 0.1, 0.09, 0.092), 0.05);                             // skull
    d = S(d, sd.cone(x, y, z, 0.72, 1.02, 0, 0.9, 0.975, 0, 0.062, 0.042), 0.035);                // muzzle
    d = S(d, sd.ell(x, y, z, 0.915, 0.99, 0, 0.022, 0.02, 0.026), 0.015);                         // nose
    d = S(d, sd.cone(x, y, az, 0.62, 1.11, 0.062, 0.595, 1.23, 0.09, 0.036, 0.008), 0.02);        // pricked ears
    d = S(d, leg(x, y, az, [[0.3, 0.62, 0.095, 0.06], [0.3, 0.34, 0.09, 0.032], [0.31, 0.06, 0.09, 0.026]]), 0.05);
    d = S(d, sd.ell(x, y, az, 0.335, 0.03, 0.09, 0.05, 0.03, 0.036), 0.015);                      // fore paw
    d = S(d, leg(x, y, az, [[-0.4, 0.68, 0.105, 0.085], [-0.33, 0.42, 0.1, 0.042], [-0.47, 0.27, 0.1, 0.028], [-0.44, 0.06, 0.1, 0.024]]), 0.05);
    d = S(d, sd.ell(x, y, az, -0.415, 0.03, 0.1, 0.05, 0.03, 0.036), 0.015);                      // hind paw
    d = S(d, leg(x, y, z, [[-0.53, 0.79, 0, 0.032], [-0.67, 0.9, 0, 0.024], [-0.67, 1.03, 0, 0.018], [-0.6, 1.1, 0, 0.012]]), 0.03);   // tail carried over the back
    return d;
  }
  const BODY = {
    goat: {
      sdf: goatSDF, b: [-0.72, -0.02, -0.3, 1.04, 1.32, 0.3], win: [-0.06, 0.675, 0.43, 0.215], eye: [0.79, 1.075, 0.083, 0.017], eyeCol: 0xc9a23a,
      coat(x, y, z, nx, ny) { const az = Math.abs(z), base = lin(0x7a5236), dark = lin(0x1e1714), white = lin(0xece4d6), n = BK.fbm(x * 2.3 + 4, y * 2.3, z * 2.3 + 1);
        let c = mix3(base, dark, sstep(0.5, 0.56, n) * 0.85);                                               // dark patches
        c = mix3(c, white, sstep(0.36, 0.3, n) * (x < 0.35 ? 0.95 : 0));                                    // white patches on the body
        c = mix3(c, dark, sstep(0.05, 0.0, az) * sstep(0.8, 0.9, y) * (x < 0.5 ? 0.8 : 0));                 // dorsal stripe
        c = mix3(c, white, sstep(-0.4, -0.9, ny) * 0.5 * (y > 0.36 ? 1 : 0));                               // paler belly
        c = mix3(c, dark, sstep(0.3, 0.1, y) * 0.7);                                                        // dark socks
        if (y < 0.07) c = lin(0x231c18);                                                                    // hooves
        if (y > 1.135 && x < 0.76 && az > 0.018) c = mix3(c, lin(0xb7ab92), sstep(1.14, 1.17, y));          // horns
        if (x > 0.93) c = lin(0x2a2220);                                                                    // muzzle
        return c; },
    },
    dog: {
      sdf: dogSDF, b: [-0.76, -0.02, -0.26, 1.0, 1.3, 0.26], win: [-0.02, 0.7, 0.44, 0.165], eye: [0.735, 1.065, 0.067, 0.016], eyeCol: 0x4a2c14,
      coat(x, y, z, nx, ny) { const az = Math.abs(z), base = lin(0xc48a4c), dark = lin(0x7a4e26), white = lin(0xf2ece0), n = BK.fbm(x * 3 + 2, y * 3, z * 3);
        let c = mix3(base, dark, sstep(0.06, 0.0, az) * sstep(0.78, 0.9, y) * 0.5 + (n - 0.5) * 0.25);      // darker saddle
        c = mix3(c, white, sstep(-0.3, -0.85, ny) * 0.75 * (y > 0.4 ? 1 : 0));                              // pale chest and belly
        c = mix3(c, white, sstep(0.2, 0.1, y));                                                             // white socks
        c = mix3(c, white, sstep(0.6, 0.72, x) * sstep(1.0, 0.94, y) * sstep(0.5, 0.42, x - 0.3) * 0.0);
        if (x > 0.5 && y < 0.86 && y > 0.6) c = mix3(c, white, 0.7 * sstep(0.1, 0.02, az));                 // white throat blaze
        if (x < -0.6 && y > 1.03) c = white;                                                                // tail tip
        if (y > 1.13 && x < 0.7) c = mix3(c, dark, 0.7);                                                    // darker ears
        if (x > 0.895) c = lin(0x15110f);                                                                   // nose
        else if (x > 0.8) c = mix3(c, dark, 0.35);
        return c; },
    },
  };
  const bodyGeo = (k) => BA.cached("ag_body_" + k, () => BA.mesh(BODY[k].sdf, BODY[k].b, 0.019, { color: BODY[k].coat }));
  /* coat with an oval window cut in the left flank (fragments inside the window are discarded) */
  function coatMat(win) {
    const m = new (T().MeshStandardMaterial)({ vertexColors: true, roughness: 0.86 });
    if (win) {
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uWin = { value: new (T().Vector4)(win[0], win[1], win[2], win[3]) };
        sh.vertexShader = "varying vec3 vOP;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvOP = position;");
        sh.fragmentShader = "varying vec3 vOP;\nuniform vec4 uWin;\n" + sh.fragmentShader
          .replace("void main() {", "void main() {\nvec2 wq = (vOP.xy - uWin.xy) / uWin.zw; float we = pow(abs(wq.x), 3.0) + pow(abs(wq.y), 3.0);\nif (vOP.z < -0.012 && we < 1.0) discard;")
          .replace("#include <color_fragment>", "#include <color_fragment>\nif (vOP.z < -0.012 && we < 1.14) diffuseColor.rgb = vec3(0.62, 0.2, 0.19);");
      };
      m.customProgramCacheKey = () => "agwin" + win.join("_");
    }
    return m;
  }
  function makeBody(kind, skin, dark) {
    const T3 = T(), B = BODY[kind], grp = new T3.Group(), geo = bodyGeo(kind);
    if (skin === "xray") { const m = new T3.Mesh(geo, BA.ghostMat({ dark })); m.renderOrder = 20; grp.add(m); return grp; }
    grp.add(new T3.Mesh(geo, coatMat(skin === "open" ? B.win : null)));
    if (skin === "open") grp.add(new T3.Mesh(geo, new T3.MeshStandardMaterial({ color: 0x8e3f3c, roughness: 0.75, side: T3.BackSide })));
    const em = new T3.MeshPhysicalMaterial({ color: B.eyeCol, roughness: 0.12, clearcoat: 1 }), pm = new T3.MeshBasicMaterial({ color: 0x0a0806 });
    for (const sv of [-1, 1]) { const e = new T3.Mesh(new T3.SphereGeometry(B.eye[3], 14, 10), em); e.position.set(B.eye[0], B.eye[1], sv * B.eye[2]); grp.add(e); const p = new T3.Mesh(new T3.SphereGeometry(B.eye[3] * 0.55, 10, 8), pm); p.position.set(B.eye[0] + 0.004, B.eye[1], sv * (B.eye[2] + B.eye[3] * 0.62)); p.scale.set(kind === "goat" ? 1.6 : 1, kind === "goat" ? 0.6 : 1, 0.5); grp.add(p); }
    return grp;
  }

  /* ================= organs ================= */
  const tis = (col, o) => BA.mat.tissue(col, o), vt = (o) => BA.mat.vtissue(o);
  const sdfMesh = (key, fn, b, cell, color, mat) => new (T().Mesh)(BA.cached(key, () => BA.mesh(fn, b, cell, color ? { color } : {})), mat);
  const tubeM = (pts, r, mat, o) => BA.tube(BA.curve(pts), r, mat, Object.assign({ seg: Math.max(24, pts.length * 10), rs: 10 }, o || {}));
  const ball = (p, r, mat) => { const m = new (T().Mesh)(new (T().SphereGeometry)(r, 14, 10), mat); m.position.set(p[0], p[1], p[2]); return m; };
  const ellM = (c, r, mat, rz) => { const m = new (T().Mesh)(new (T().SphereGeometry)(1, 28, 18), mat); m.position.set(c[0], c[1], c[2]); m.scale.set(r[0], r[1], r[2]); if (rz) m.rotation.z = rz; return m; };
  /* meandering loops that fill a box: the coiled small intestine */
  function coils(x0, x1, y0, y1, z0, z1, rows, start, end) {
    const p = [start]; for (let i = 0; i < rows; i++) { const y = y0 + (y1 - y0) * (i / (rows - 1)), dir = i % 2 ? -1 : 1; for (let j = 0; j <= 4; j++) { const u = dir > 0 ? j / 4 : 1 - j / 4; p.push([x0 + (x1 - x0) * u, y + 0.012 * Math.sin(j * 2.1 + i), z0 + (z1 - z0) * (0.5 + 0.5 * Math.sin(j * 1.7 + i * 2.3))]); } }
    p.push(end); return p;
  }
  const sample = (pts, n) => { const c = BA.curve(pts), out = []; for (let i = 0; i <= n; i++) { const q = c.getPointAt(i / n); out.push([q.x, q.y, q.z]); } return out; };

  const GOAT = {
    mouth: ["Mouth", "No upper incisors: the lower incisors bite against a hard dental pad to crop grass. Broad ridged molars grind sideways. Dental formula 2 × (i 0/3, c 0/1, pm 3/3, m 3/3) = 32."],
    gullet: ["Oesophagus", "Carries swallowed grass down to the rumen and brings the cud back up to the mouth by reverse peristalsis."],
    rumen: ["Rumen", "The largest chamber, on the left side. Bacteria and protozoa ferment cellulose into fatty acids, which are absorbed through its wall. Gases are belched out."],
    reticulum: ["Reticulum (honeycomb)", "Honeycomb lining traps stones and wire, and shapes fermented food into cud that is sent back to the mouth."],
    omasum: ["Omasum (many plies)", "Many leaf-like folds squeeze the re-chewed food and absorb water from it."],
    abomasum: ["Abomasum (true stomach)", "The only glandular chamber: hydrochloric acid, pepsin and rennin start protein digestion, as in a simple stomach."],
    liver: ["Liver", "Makes bile, which emulsifies fats in the small intestine; stores glycogen and removes toxins."],
    smallInt: ["Small intestine", "Very long. Pancreatic juice, bile and intestinal juice complete digestion; villi absorb the products."],
    caecum: ["Caecum", "Blind pouch where a little more fermentation of fibre takes place."],
    colon: ["Large intestine (spiral colon)", "Coiled like a flat spring. Absorbs water and shapes the dry faecal pellets."],
    rectum: ["Rectum and anus", "Stores faeces and passes them out as pellets."],
  };
  const DOG = {
    mouth: ["Mouth", "Pointed canines seize and tear flesh; carnassial teeth shear it like scissors. Food is swallowed in lumps. Dental formula 2 × (i 3/3, c 1/1, pm 4/4, m 2/3) = 42."],
    gullet: ["Oesophagus", "Wide and stretchy: peristalsis pushes large lumps of food to the stomach."],
    stomach: ["Stomach (simple)", "One chamber. Very strong hydrochloric acid kills germs and softens bone; pepsin digests protein. It stretches to hold a big meal."],
    liver: ["Liver", "Makes bile to emulsify the fat in a meat diet; stores glycogen and makes urea from spare amino acids."],
    pancreas: ["Pancreas", "Pancreatic juice with protease, lipase and amylase enters the duodenum."],
    smallInt: ["Small intestine", "Short compared with a herbivore's, because meat is easy to digest. Digestion is completed and food is absorbed here."],
    caecum: ["Caecum", "Small and coiled, with little work to do, because the dog does not digest cellulose."],
    colon: ["Large intestine", "Short and simple. Absorbs water and forms faeces."],
    rectum: ["Rectum and anus", "Stores faeces before egestion."],
  };

  function goatOrgans(o) {
    o = o || {};
    const T3 = T(), group = new T3.Group(), parts = {}, add = (id, meshes, anchor, short) => { meshes = [].concat(meshes); meshes.forEach((m) => { group.add(m); m.userData.part = id; }); parts[id] = { id, name: GOAT[id][0], short, info: GOAT[id][1], meshes, anchor: V(anchor[0], anchor[1], anchor[2]) }; };
    const MOUTH = [[0.93, 0.925, 0, 0.02], [0.84, 0.975, 0, 0.03], [0.76, 1.02, 0, 0.028]];
    const GUL = [[0.76, 1.02, 0], [0.68, 0.965, -0.01], [0.56, 0.87, -0.015], [0.43, 0.775, -0.02], [0.3, 0.745, -0.025], [0.2, 0.71, -0.035], [0.14, 0.68, -0.04]];
    if (!o.trunk) add("mouth", sdfMesh("ag_g_mouth", sd.chain(MOUTH, 0.02), [0.7, 0.88, -0.06, 0.98, 1.08, 0.06], 0.007, null, tis(TIS.mouth, { roughness: 0.35 })), [0.86, 0.965, -0.03]);
    add("gullet", tubeM(o.trunk ? GUL.slice(3) : GUL, 0.016, tis(TIS.gullet)), o.trunk ? [0.3, 0.745, -0.04] : [0.52, 0.845, -0.03]);
    /* rumen: dorsal and ventral sacs with a groove between, plus the small front sac */
    const rumenFn = (x, y, z) => { let d = sd.smin(sd.ell(x, y, z, -0.15, 0.76, -0.075, 0.25, 0.108, 0.125), sd.ell(x, y, z, -0.12, 0.61, -0.07, 0.245, 0.115, 0.135), 0.03); d = sd.smin(d, sd.ell(x, y, z, 0.07, 0.715, -0.06, 0.085, 0.075, 0.09), 0.05); return d + (BK.fbm(x * 22, y * 22, z * 22) - 0.5) * 0.008; };
    const rumenCol = (x, y, z) => { const n = BK.fbm(x * 9, y * 9, z * 9), base = lin(0xc79276), groove = lin(0x7e4a40); let c = mix3(base, lin(0xdcb090), sstep(0.4, 0.7, n) * 0.6); c = mix3(c, groove, (1 - sstep(0.0, 0.03, Math.abs(y - 0.688 - (x + 0.1) * 0.06))) * 0.75); return mix3(c, groove, (1 - sstep(0.0, 0.012, Math.abs(BK.fbm(x * 14 + 3, y * 14, z * 14 + 5) - 0.5))) * 0.3); };
    add("rumen", sdfMesh("ag_g_rumen", rumenFn, [-0.44, 0.47, -0.24, 0.19, 0.9, 0.09], 0.0105, rumenCol, vt({ roughness: 0.45, clearcoat: 0.35 })), [-0.16, 0.72, -0.2]);
    const hexCol = (x, y, z) => { const s = 105, a = Math.sin(x * s) + Math.sin((x * 0.5 + y * 0.866) * s) + Math.sin((x * 0.5 - y * 0.866) * s), b = Math.sin(z * s + 1) + Math.sin((z * 0.5 + y * 0.866) * s) + Math.sin((z * 0.5 - y * 0.866) * s); return mix3(lin(0xd99a6a), lin(0x8a4a30), sstep(-0.4, -1.5, Math.min(a, b)) * 0.8); };
    add("reticulum", sdfMesh("ag_g_ret", (x, y, z) => sd.ell(x, y, z, 0.165, 0.585, -0.035, 0.07, 0.072, 0.078), [0.08, 0.5, -0.13, 0.25, 0.67, 0.06], 0.007, hexCol, vt({ roughness: 0.5, clearcoat: 0.3 })), [0.18, 0.57, -0.11], "Reticulum");
    const omaCol = (x, y, z) => mix3(lin(0xb86a8a), lin(0x7a3a5a), sstep(0.2, 0.9, Math.sin(Math.atan2(y - 0.665, x - 0.1) * 13)) * 0.7);
    add("omasum", sdfMesh("ag_g_oma", (x, y, z) => sd.ell(x, y, z, 0.1, 0.665, 0.1, 0.068, 0.078, 0.062), [0.02, 0.57, 0.02, 0.18, 0.76, 0.18], 0.007, omaCol, vt({ roughness: 0.45, clearcoat: 0.35 })), [0.1, 0.67, 0.165], "Omasum");
    const ABO = [[0.1, 0.585, 0.105, 0.03], [0.065, 0.52, 0.115, 0.056], [-0.05, 0.495, 0.125, 0.055], [-0.16, 0.505, 0.13, 0.038], [-0.225, 0.53, 0.125, 0.02]];
    add("abomasum", sdfMesh("ag_g_abo", sd.chain(ABO, 0.03), [-0.27, 0.42, 0.04, 0.16, 0.63, 0.2], 0.0075, (x, y, z) => mix3(lin(TIS.stomach), lin(0xd98c84), sstep(0.45, 0.7, BK.fbm(x * 18, y * 18, z * 18)) * 0.6), vt({ roughness: 0.36, clearcoat: 0.5 })), [-0.02, 0.49, 0.185], "Abomasum");
    add("liver", ellM([0.215, 0.735, 0.075], [0.04, 0.105, 0.09], tis(0x8a3a36, { roughness: 0.25, clearcoat: 0.7 }), -0.25), [0.225, 0.76, 0.14]);
    const SI = coils(-0.36, -0.2, 0.555, 0.665, 0.1, 0.165, 5, [-0.225, 0.53, 0.125], [-0.29, 0.725, 0.12]);
    add("smallInt", tubeM(SI, 0.0135, tis(TIS.smallInt, { roughness: 0.33, clearcoat: 0.55 }), { seg: 420 }), [-0.28, 0.6, 0.18]);
    const CAE = [[-0.29, 0.725, 0.12], [-0.35, 0.755, 0.115], [-0.42, 0.745, 0.1]];
    add("caecum", [tubeM(CAE, 0.026, tis(TIS.largeInt)), ball(CAE[2], 0.026, tis(TIS.largeInt))], [-0.37, 0.765, 0.13]);
    /* spiral colon: winds in to the centre of a flat coil and out again, then runs back as the rectum */
    const SP = [[-0.29, 0.725, 0.12], [-0.22, 0.75, 0.16]]; const cx = -0.11, cy = 0.675, turns = 2.25;
    for (let i = 0; i <= 54; i++) { const u = i / 54, a = 2.4 - u * turns * 2 * Math.PI, r = 0.072 * (1 - u * 0.82); SP.push([cx + r * Math.cos(a), cy + r * Math.sin(a), 0.19 - u * 0.012]); }
    SP.push([cx, cy + 0.02, 0.15], [-0.16, 0.8, 0.09], [-0.3, 0.825, 0.04]);
    add("colon", tubeM(SP, 0.016, tis(TIS.largeInt, { roughness: 0.4, clearcoat: 0.45 }), { seg: 380 }), [-0.11, 0.675, 0.21], "Spiral colon");
    const REC = [[-0.3, 0.825, 0.04], [-0.42, 0.83, 0.01], [-0.52, 0.815, 0], [-0.585, 0.795, 0]];
    add("rectum", [tubeM(REC, 0.02, tis(0xc9685e)), ball(REC[3], 0.022, tis(0x8a3b3a))], [-0.5, 0.82, -0.02]);
    /* route of the food: [points, part id, stage index] */
    const g1 = sample(GUL, 14), rum = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * 3.2 * Math.PI; rum.push([-0.13 + 0.17 * Math.cos(a + 0.4), 0.69 + 0.1 * Math.sin(a + 0.4), -0.07 + 0.03 * Math.sin(a * 0.5)]); }
    const mouthP = [[0.92, 0.93, 0], [0.84, 0.975, 0], [0.76, 1.02, 0]], chew = []; for (let i = 0; i <= 16; i++) chew.push([0.84 + 0.035 * Math.sin(i * 1.6), 0.975 + 0.012 * Math.cos(i * 2.1), 0.012 * Math.sin(i * 2.6)]);
    const route = [
      [mouthP, "mouth", 0], [g1, "gullet", 1], [rum, "rumen", 2], [[rum[30], [0.1, 0.62, -0.05], [0.165, 0.585, -0.035], [0.15, 0.62, -0.035]], "reticulum", 3],
      [[[0.15, 0.62, -0.035]].concat(g1.slice().reverse()), "gullet", 4], [chew, "mouth", 5], [g1.concat([[0.165, 0.6, -0.035]]), "gullet", 6],
      [[[0.165, 0.6, -0.035], [0.13, 0.64, 0.04], [0.1, 0.665, 0.1], [0.1, 0.62, 0.105]], "omasum", 7], [ABO.map((q) => q.slice(0, 3)), "abomasum", 8],
      [sample(SI, 70), "smallInt", 9], [sample(CAE, 8).concat(sample(CAE, 8).reverse()), "caecum", 10], [sample(SP, 70), "colon", 11], [sample(REC, 10).concat([[-0.63, 0.74, 0], [-0.65, 0.5, 0]]), "rectum", 12],
    ];
    return { group, parts, route };
  }
  const GOAT_STAGES = [
    ["Mouth: cropping", "Grass is gripped by the tongue and cut by the lower incisors against the dental pad. It is swallowed after very little chewing."],
    ["Oesophagus", "Peristalsis carries the rough food down to the rumen."],
    ["Rumen: fermentation", "Food churns for hours. Bacteria and protozoa break cellulose down to fatty acids, which pass through the rumen wall into the blood. Methane and carbon dioxide are belched."],
    ["Reticulum: forming cud", "The honeycomb wall moulds the coarse food into balls of cud."],
    ["Back up the oesophagus", "Reverse peristalsis returns the cud to the mouth. This is regurgitation."],
    ["Mouth: chewing the cud", "The goat lies down and chews the cud thoroughly with a sideways grind. This is rumination."],
    ["Swallowed again", "The fine, re-chewed food is swallowed a second time and passes on from the reticulum."],
    ["Omasum", "Leaf-like folds press the food and absorb water."],
    ["Abomasum: true stomach", "Hydrochloric acid, pepsin and rennin digest protein, including the bodies of the rumen microbes."],
    ["Small intestine", "Bile and pancreatic juice enter. Digestion is completed and the products are absorbed through the villi."],
    ["Caecum", "A little more fibre is fermented here."],
    ["Large intestine", "Water is absorbed in the spiral colon and the waste is shaped into pellets."],
    ["Rectum and anus", "Faeces leave as dry pellets, good manure for the farm."],
  ];

  function dogOrgans() {
    const T3 = T(), group = new T3.Group(), parts = {}, add = (id, meshes, anchor, short) => { meshes = [].concat(meshes); meshes.forEach((m) => { group.add(m); m.userData.part = id; }); parts[id] = { id, name: DOG[id][0], short, info: DOG[id][1], meshes, anchor: V(anchor[0], anchor[1], anchor[2]) }; };
    const MOUTH = [[0.885, 0.975, 0, 0.018], [0.79, 0.995, 0, 0.028], [0.7, 1.01, 0, 0.028]];
    const GUL = [[0.7, 1.01, 0], [0.62, 0.96, 0], [0.52, 0.875, -0.01], [0.4, 0.79, -0.015], [0.26, 0.76, -0.02], [0.12, 0.745, -0.03], [0.05, 0.715, -0.04]];
    add("mouth", sdfMesh("ag_d_mouth", sd.chain(MOUTH, 0.02), [0.64, 0.92, -0.06, 0.93, 1.06, 0.06], 0.007, null, tis(TIS.mouth, { roughness: 0.35 })), [0.8, 0.99, -0.03]);
    add("gullet", tubeM(GUL, 0.017, tis(TIS.gullet)), [0.48, 0.85, -0.03]);
    const STO = [[0.05, 0.715, -0.04, 0.024], [0.01, 0.7, -0.05, 0.05], [-0.025, 0.655, -0.045, 0.06], [-0.01, 0.61, -0.015, 0.05], [0.03, 0.595, 0.03, 0.032], [0.06, 0.61, 0.06, 0.018]];
    add("stomach", sdfMesh("ag_d_sto", sd.chain(STO, 0.03), [-0.11, 0.53, -0.13, 0.1, 0.77, 0.1], 0.0075, (x, y, z) => mix3(lin(TIS.stomach), lin(0xd98c84), sstep(0.45, 0.7, BK.fbm(x * 18, y * 18, z * 18)) * 0.6), vt({ roughness: 0.36, clearcoat: 0.5 })), [-0.02, 0.65, -0.105]);
    add("liver", ellM([0.1, 0.675, 0.0], [0.036, 0.1, 0.105], tis(TIS.liver, { roughness: 0.2, clearcoat: 0.8 }), -0.2), [0.115, 0.72, -0.09]);
    add("pancreas", sdfMesh("ag_d_pan", (x, y, z) => sd.chain([[0.05, 0.63, 0.075, 0.011], [-0.02, 0.64, 0.085, 0.014], [-0.1, 0.665, 0.08, 0.01]], 0.015)(x, y, z) + (BK.noise3(x * 90, y * 90, z * 90) - 0.5) * 0.006, [-0.13, 0.6, 0.05, 0.08, 0.7, 0.12], 0.005, null, tis(TIS.pancreas, { roughness: 0.55, clearcoat: 0.25 })), [-0.03, 0.645, 0.1]);
    const SI = [[0.06, 0.61, 0.06], [0.02, 0.615, 0.1], [-0.1, 0.645, 0.1], [-0.2, 0.68, 0.085]].concat(coils(-0.3, -0.1, 0.665, 0.76, -0.06, 0.06, 4, [-0.24, 0.66, 0.05], [-0.13, 0.79, 0.045]).slice(1));
    add("smallInt", tubeM(SI, 0.015, tis(TIS.smallInt, { roughness: 0.33, clearcoat: 0.55 }), { seg: 320 }), [-0.21, 0.7, -0.075]);
    const CAE = [[-0.13, 0.79, 0.045], [-0.17, 0.805, 0.065], [-0.2, 0.79, 0.075], [-0.225, 0.805, 0.06]];
    add("caecum", [tubeM(CAE, 0.013, tis(TIS.largeInt)), ball(CAE[3], 0.013, tis(TIS.largeInt))], [-0.2, 0.8, 0.09]);
    const COL = [[-0.13, 0.79, 0.045], [-0.05, 0.8, 0.05], [0.0, 0.8, 0.02], [-0.02, 0.805, -0.04], [-0.14, 0.82, -0.05], [-0.3, 0.815, -0.03]];
    add("colon", tubeM(COL, 0.022, tis(TIS.largeInt, { roughness: 0.4, clearcoat: 0.45 })), [-0.08, 0.815, -0.06], "Large intestine");
    const REC = [[-0.3, 0.815, -0.03], [-0.4, 0.8, -0.01], [-0.49, 0.775, 0], [-0.552, 0.755, 0]];
    add("rectum", [tubeM(REC, 0.021, tis(0xc9685e)), ball(REC[3], 0.022, tis(0x8a3b3a))], [-0.46, 0.79, -0.03]);
    const route = [
      [[[0.89, 0.975, 0], [0.79, 0.995, 0], [0.7, 1.01, 0]], "mouth", 0], [sample(GUL, 14), "gullet", 1],
      [STO.map((q) => q.slice(0, 3)).concat([[0.0, 0.64, -0.03], [-0.02, 0.67, -0.045], [-0.01, 0.62, -0.02], [0.03, 0.595, 0.03], [0.06, 0.61, 0.06]]), "stomach", 2],
      [sample(SI, 60), "smallInt", 3], [sample(CAE, 6).concat(sample(CAE, 6).reverse()), "caecum", 4], [sample(COL, 20), "colon", 5], [sample(REC, 10).concat([[-0.6, 0.7, 0], [-0.62, 0.5, 0]]), "rectum", 6],
    ];
    return { group, parts, route };
  }
  const DOG_STAGES = [
    ["Mouth: tearing", "Canines grip and tear; the carnassial teeth slice meat and crack bone. Food is not chewed fine but swallowed in lumps."],
    ["Oesophagus", "Peristalsis moves each lump quickly to the stomach."],
    ["Stomach", "One simple chamber. Strong hydrochloric acid and pepsin break down protein over several hours. There is no fermentation chamber and no cud."],
    ["Small intestine", "Bile emulsifies fat; pancreatic and intestinal enzymes finish digestion. Amino acids, fatty acids, glycerol and glucose are absorbed."],
    ["Caecum", "Small, because a dog has no cellulose to ferment."],
    ["Large intestine", "Short. Water is absorbed and faeces are formed."],
    ["Rectum and anus", "Faeces are passed out."],
  ];

  /* ================= scene ================= */
  const AN = { goat: { label: "Goat", make: goatOrgans, stages: GOAT_STAGES, labels: ["mouth", "gullet", "rumen", "reticulum", "omasum", "abomasum", "smallInt", "caecum", "colon", "rectum", "liver"], food: 0x86c540, time: 62 },
    dog: { label: "Dog", make: dogOrgans, stages: DOG_STAGES, labels: ["mouth", "gullet", "stomach", "liver", "pancreas", "smallInt", "caecum", "colon", "rectum"], food: 0xd8563c, time: 34 } };
  const view = (S, pos, tg) => { const o = S.orbit, t = V(tg[0], tg[1], tg[2]), d = V(pos[0], pos[1], pos[2]).sub(t), r = d.length(); o.target.copy(t); o.tr = r; o.ty = Math.atan2(d.x, d.z); o.tp = Math.asin(d.y / r); o.home = { yaw: o.ty, pitch: o.tp, r, target: t.clone() }; o.touched = false; if (!S.t) { o.yaw = o.ty; o.pitch = o.tp; o.r = o.tr; } };
  const CAMS = { goat: [[-0.42, 1.0, -3.0], [-0.42, 0.7, 0]], dog: [[-0.42, 1.0, -3.0], [-0.42, 0.7, 0]], both: [[-1.3, 1.05, -5.3], [-1.3, 0.56, 0]] };
  function makeRoute(route) {
    /* flatten into one polyline with a stage index per point, and cumulative length for constant speed */
    const pts = [], st = [], id = []; route.forEach(([p, part, k]) => p.forEach((q) => { pts.push(q); st.push(k); id.push(part); }));
    const len = [0]; for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    return { pts, st, id, len, total: len[len.length - 1] };
  }
  function at(R, u) { const L = clamp(u, 0, 1) * R.total; let i = 1; while (i < R.len.length - 1 && R.len[i] < L) i++; const a = R.pts[i - 1], b = R.pts[i], f = (L - R.len[i - 1]) / Math.max(1e-6, R.len[i] - R.len[i - 1]); return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f], st: R.st[i], id: R.id[i] }; }

  const def = {
    label: "Realistic 3D lab: goat and dog", title: "Goat and dog: two digestive systems",
    blurb: "A goat eats grass and a dog eats meat, so their guts are built differently. See through each animal, open its flank or show its coat, tap any organ, and follow a mouthful from mouth to anus.",
    env: "clinic", envOpts: { floor: 0 }, cam: CAMS.goat, fov: 34, free: true, syncAll: true,
    values: { an: "goat", skin: "xray", food: 0, quiz: 0 },
    controls: [{ type: "tabs", key: "an", label: "Animal", options: [["goat", "Goat (ruminant)"], ["dog", "Dog (simple stomach)"], ["both", "Compare both"]] },
      { type: "tabs", key: "skin", label: "Body", options: [["xray", "See-through"], ["open", "Opened flank"], ["coat", "Coat"]] },
      { type: "toggle", key: "food", label: "Follow the food" }, { type: "toggle", key: "quiz", label: "Game: find the organ" }],
    onChange(s, c, k) { if (!s.aF) return; if (k === "quiz") { if (c.quiz) { c.food = 0; if (c.skin === "coat") c.skin = "xray"; } BA.focus.setQuiz(s, c.quiz); } if (k === "food" && c.food) { c.quiz = 0; BA.focus.setQuiz(s, 0); s.aF.sel = null; if (c.skin === "coat") c.skin = "xray"; (s.an || []).forEach((a) => { a.u = 0; }); } },
    build(S, s, c) { s.key = null; s.an = []; BA.focus.init(S, s); },
    update(S, s, c, dt) {
      const k = c.an + "|" + c.skin;
      if (s.key !== k) {
        const T3 = T(), g = BK.group(S, s), kinds = c.an === "both" ? ["goat", "dog"] : [c.an], prevAn = s.anKey; s.key = k; s.anKey = c.an; s.an = []; s.aparts = {}; s.floorY = 0;
        kinds.forEach((kind, i) => {
          const A = AN[kind], sub = new T3.Group(), off = kinds.length > 1 ? (i ? -1.62 : 0.12) : 0; sub.position.x = off; g.add(sub);
          sub.add(makeBody(kind, c.skin, S.clinicDark));
          const O = A.make(); sub.add(O.group);
          Object.values(O.parts).forEach((p) => { const id = kinds.length > 1 ? kind[0] + "_" + p.id : p.id; p.anchor.x += off; p.meshes.forEach((m) => { m.userData.part = id; }); if (kinds.length > 1) p.name = A.label + ": " + p.name.toLowerCase(); p.pid = p.id; p.id = id; p.kind = kind; s.aparts[id] = p; });
          const bol = new T3.Group(), bm = new T3.MeshBasicMaterial({ color: A.food, depthTest: false, transparent: true }); for (let j = 0; j < 7; j++) { const b = new T3.Mesh(new T3.SphereGeometry(0.02 - j * 0.0022, 12, 8), bm); b.renderOrder = 40; bol.add(b); } bol.visible = false; sub.add(bol);
          s.an.push({ kind, A, R: makeRoute(O.route), bol, u: 0, st: 0, off, pre: kinds.length > 1 ? kind[0] + "_" : "" });
        });
        const sh = new T3.Mesh(new T3.CircleGeometry(1, 40), new T3.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: S.clinicDark ? 0.35 : 0.1, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.scale.set(kinds.length > 1 ? 1.75 : 0.78, 0.3, 1); sh.position.set(kinds.length > 1 ? -0.72 : 0.08, 0.002, 0); g.add(sh);
        s.aF.sel = null; s.aF.hov = null; s.aF.auto = null; if (prevAn !== c.an) view(S, CAMS[c.an][0], CAMS[c.an][1]);
        BA.focus.setQuiz(s, 0); if (c.quiz) BA.focus.setQuiz(s, 1);
      }
      /* the coat hides everything inside */
      const show = c.skin !== "coat"; Object.values(s.aparts).forEach((p) => { p.hidden = !show; });
      s.aF.auto = null;
      s.an.forEach((a) => {
        a.bol.visible = !!c.food && show;
        if (!c.food) return;
        a.u += dt / a.A.time; if (a.u > 1.04) a.u = 0;
        const q = at(a.R, a.u); a.st = q.st; a.cur = a.pre + q.id;
        a.bol.children.forEach((b, j) => { const w = at(a.R, a.u - j * 0.0035); b.position.set(w.p[0], w.p[1], w.p[2]); });
        if (s.an.length === 1) s.aF.auto = a.cur;
      });
      s.aF.also = c.food ? s.an.map((a) => a.cur) : null;
      BA.focus.update(S, s, dt);
    },
    overlay(ctx, s, c, S, B) {
      const one = s.an && s.an.length === 1, hide = c.skin === "coat";
      if (!one && s.an) s.an.forEach((a) => { const q = MK.proj(S, a.off + 0.1, -0.14, 0); if (q.z < 1) B.pill(a.kind === "goat" ? "GOAT · ruminant herbivore" : "DOG · monogastric carnivore", q.x, q.y, "#ffd27a", 11, "center"); });
      if (hide) { B.pill("Choose See-through or Opened flank to look inside", 12, 388, "#a9b6d3", 10); return; }
      if (c.food && s.an) s.an.forEach((a, i) => { const st = a.A.stages[a.st]; B.pill((one ? "" : a.A.label + " · ") + "Step " + (a.st + 1) + " of " + a.A.stages.length + ": " + st[0], 12, 58 + i * 24, i ? "#ffb8a8" : "#b9f08a", 11.5); });
      BA.focus.overlay(S, s, B, { labels: c.food || !one ? null : s.an[0].A.labels, gap: 21, maxX: 400, hint: c.food ? "Watch the food move. Tap an organ to isolate it." : one ? undefined : "Tap any organ to name and isolate it" });
    },
    hud(s, c) {
      const one = s.an && s.an.length === 1 ? s.an[0] : null;
      if (c.food && s.an && s.an.length && !(s.aF && s.aF.sel)) return s.an.map((a) => { const st = a.A.stages[a.st]; return { title: a.A.label + " · step " + (a.st + 1) + ": " + st[0], lines: [[st[1], "#e8f1ff", true]].concat(a.kind === "goat" && one ? ["—", ["Order: mouth → rumen → reticulum → mouth (cud) → omasum → abomasum → small intestine → large intestine → anus.", "#b9f08a"]] : a.kind === "dog" && one ? ["—", ["Order: mouth → oesophagus → stomach → small intestine → large intestine → anus.", "#ffb8a8"]] : []) }; });
      const base = c.an === "goat" ? [{ title: "Goat: ruminant herbivore", lines: [["A four-chambered stomach lets microbes digest cellulose before the true stomach.", "#ffd27a", true], "Rumen → reticulum → omasum → abomasum.", "The rumen fills most of the left side of the abdomen.", "—", ["Chews the cud: food is swallowed, brought back up, re-chewed and swallowed again.", "#b9f08a"], "Very long intestine: about 25 times the body length.", ["Teeth: no upper incisors, a dental pad, a gap (diastema) and grinding molars.", "#a9b6d3"]] }]
        : c.an === "dog" ? [{ title: "Dog: monogastric carnivore", lines: [["One simple, very acid stomach digests meat. There is no fermentation chamber.", "#ffd27a", true], "Mouth → oesophagus → stomach → small intestine → large intestine.", "—", ["Short intestine: about 5 times the body length, because meat is easy to digest.", "#ffb8a8"], "Small caecum: cellulose is not digested.", ["Teeth: long canines and scissor-like carnassials.", "#a9b6d3"]] }]
        : [{ title: "Ruminant and non-ruminant compared", lines: [["Goat: four stomach chambers and a very long gut. Dog: one stomach and a short gut.", "#ffd27a", true], "Diet decides the design. Grass is tough and low in nutrients, so the goat needs microbes, time and length.", "Meat is rich and easy to digest, so the dog's gut is short and simple.", "—", ["Pigs, rabbits and poultry are also non-ruminants; cattle and sheep are ruminants.", "#a9b6d3"]] }];
      return BA.focus.card(s, base);
    },
    readouts(s, c) { const F = s.aF; if (F && F.quiz) return [["Score", F.score + " / " + F.tries]]; const P = s.aparts || {}; return [["Animal", c.an === "both" ? "goat and dog" : c.an], ["Selected", F && F.sel && P[F.sel] ? P[F.sel].name : "none"]].concat(c.food && s.an ? s.an.map((a) => [a.A.label + " food is in", a.A.stages[a.st][0]]) : []); },
    table: () => MK.table(["Feature", "Goat (ruminant)", "Dog (monogastric)"], [["Diet", "Grass and browse (herbivore)", "Meat (carnivore)"], ["Stomach", "Four chambers: rumen, reticulum, omasum, abomasum", "One simple chamber"], ["Cellulose", "Digested by microbes in the rumen", "Not digested"], ["Chewing the cud", "Yes (rumination)", "No"], ["Front teeth", "No upper incisors; dental pad", "Incisors in both jaws"], ["Canines", "None in the upper jaw", "Long and pointed"], ["Cheek teeth", "Flat, ridged, grind sideways", "Carnassials shear like scissors"], ["Dental formula", "i 0/3, c 0/1, pm 3/3, m 3/3 = 32", "i 3/3, c 1/1, pm 4/4, m 2/3 = 42"], ["Gut length ÷ body length", "about 25", "about 5"], ["Caecum", "Moderate, some fermentation", "Small"], ["Faeces", "Dry pellets", "Formed stool"]]),
    tasks: ["Name the four stomach chambers of the goat in the order food first enters them.", "Follow the food in the goat. At which two steps is the food in the mouth?", "Give three differences between the gut of the goat and the gut of the dog, and link each to diet.", "Why is the abomasum called the true stomach?"],
    note: "Teaching models built to scale by eye: organ positions follow veterinary anatomy (rumen on the left, omasum and abomasum on the right) but sizes are approximate. Gut-to-body ratios are textbook round figures.",
    draw: BK.fallback("Goat and dog digestive systems", ["Goat (ruminant): rumen → reticulum → omasum → abomasum, then intestines", "Chews the cud; microbes digest cellulose", "Dog (monogastric): one simple acid stomach, short intestine", "Goat teeth 32 with a dental pad; dog teeth 42 with canines and carnassials"]),
  };
  if (AK && AK.def3d) AK.def3d("H2-c#gut", Object.assign({}, def));
  else BK.def3d("B-g#gut", Object.assign({}, def));
  window.AGUT = { BODY, goatOrgans, dogOrgans, GOAT, DOG, coatMat, coils, sample };
})();
