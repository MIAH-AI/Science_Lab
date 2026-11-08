/* b3d-systems.js — Topic S (Tissues & Body Systems) photoreal labs:
   S-a arm lever, joints and vertebral column     S-b stem/root T.S. and wilting
   S-c heart and double circulation               S-d potometer, eosin, ringing experiment
   S-e bell-jar lungs, alveoli, gills, stomata    S-f nephron                S-g skin and temperature */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, W = MK.when, f = MK.fmt;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const tube = (pts, r, mat, seg = 60, rs = 12) => new (T().Mesh)(new (T().TubeGeometry)(new (T().CatmullRomCurve3)(pts), seg, r, rs), mat);
  const glass = () => window.P3D.mat.glass();

  /* ===================== S-a  skeleton & support ===================== */
  function bone(len, r) { const T3 = T(), g = new T3.Group(), m = BK.mat.bone(); const sh = new T3.Mesh(new T3.CylinderGeometry(r * 0.75, r * 0.75, len, 20), m); sh.position.y = len / 2; g.add(sh); for (const y of [0, len]) { const e = new T3.Mesh(new T3.SphereGeometry(r * 1.25, 24, 16), m); e.scale.set(1.2, 0.8, 1); e.position.y = y; g.add(e); } return BK.shadow(g); }
  function muscle(a, b, thick, mat) { const T3 = T(), d = b.clone().sub(a), L = d.length(); const m = new T3.Mesh(new T3.SphereGeometry(1, 32, 20), mat); m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(thick, L / 2, thick); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); m.castShadow = true; return m; }
  BK.def3d("S-a", {
    label: "Photoreal 3D lab", title: "Skeleton, joints and movement",
    blurb: "The biceps and triceps pull on the forearm lever as you bend the elbow; feel how much force the muscle needs. Also: ball-and-socket versus hinge joints, and the vertebral column.",
    env: "studio", cam: [[1.4, 2.6, 7.4], [1.3, 1.6, 0]], fov: 38,
    values: { mode: "arm", ang: 90, load: 5 },
    controls: [{ type: "tabs", key: "mode", label: "View", options: [["arm", "Arm — antagonistic muscles"], ["joints", "Joints"], ["spine", "Vertebral column"]] }, { key: "ang", label: "Elbow angle", min: 40, max: 170, unit: "°", show: W("mode", "arm") }, { key: "load", label: "Load in hand", min: 0, max: 20, unit: "kg", show: W("mode", "arm") }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) {
      const T3 = T();
      if (s.key !== c.mode) { s.key = c.mode; const g = BK.group(S, s); s.dyn = null;
        if (c.mode === "joints") { s.ball = new T3.Group(); const sock = new T3.Mesh(new T3.SphereGeometry(0.45, 32, 16, 0, 6.3, 0, Math.PI * 0.55), Object.assign(BK.mat.bone(), { side: T3.DoubleSide })); sock.rotation.x = Math.PI; sock.position.set(-1.6, 2.0, 0); g.add(sock); const hum = bone(1.8, 0.16); s.ball.add(hum); const head = new T3.Mesh(new T3.SphereGeometry(0.38, 32, 24), BK.mat.bone()); s.ball.add(head); s.ball.position.set(-1.6, 2.0, 0); s.ball.rotation.x = Math.PI; g.add(s.ball);
          const hz = new T3.Group(); const hb = bone(1.6, 0.15); hb.rotation.z = Math.PI; hb.position.y = 1.6; hz.add(hb); hz.position.set(1.6, 0.6, 0); g.add(hz); s.hinge = new T3.Group(); s.hinge.add(bone(1.5, 0.13)); s.hinge.position.set(1.6, 2.2, 0); g.add(s.hinge); const cart = new T3.Mesh(new T3.CylinderGeometry(0.2, 0.2, 0.4, 24), new T3.MeshPhysicalMaterial({ color: 0xbfe6ff, roughness: 0.2, transparent: true, opacity: 0.7, clearcoat: 1 })); cart.rotation.x = Math.PI / 2; cart.position.set(1.6, 2.2, 0); g.add(cart); }
        if (c.mode === "spine") { s.vert = []; for (let i = 0; i < 18; i++) { const vg = new T3.Group(); const body = new T3.Mesh(new T3.CylinderGeometry(0.3 + i * 0.008, 0.3 + i * 0.008, 0.18, 24), BK.mat.bone()); vg.add(body); const sp = new T3.Mesh(new T3.BoxGeometry(0.1, 0.12, 0.5), BK.mat.bone()); sp.position.z = -0.45; sp.rotation.x = 0.4; vg.add(sp); for (const sd of [-1, 1]) { const tp = new T3.Mesh(new T3.BoxGeometry(0.42, 0.08, 0.08), BK.mat.bone()); tp.position.set(sd * 0.35, 0, -0.15); vg.add(tp); } const ring = new T3.Mesh(new T3.TorusGeometry(0.14, 0.05, 8, 16), BK.mat.bone()); ring.rotation.x = Math.PI / 2; ring.position.z = -0.25; vg.add(ring);
            const disc = new T3.Mesh(new T3.CylinderGeometry(0.28, 0.28, 0.07, 24), new T3.MeshPhysicalMaterial({ color: 0x9fd0ff, roughness: 0.2, transparent: true, opacity: 0.8, clearcoat: 1 })); disc.position.y = 0.13; vg.add(disc); vg.position.set(0, 0.4 + i * 0.27, Math.sin(i * 0.33) * 0.25); BK.shadow(vg); g.add(vg); s.vert.push(vg); }
          const cord = tube(s.vert.map((v) => V(0, v.position.y, v.position.z - 0.25)), 0.07, new T3.MeshPhysicalMaterial({ color: 0xf2d7a0, roughness: 0.4, sheen: 0.6 })); g.add(cord); }
        BK.shadow(g);
      }
      if (c.mode === "arm") { const dk = c.ang + "|" + c.load; if (s.dk !== dk) { s.dk = dk; const g = BK.group(S, s, "dyn"), sh = V(-0.4, 3.2, 0), el = V(-0.4, 1.0, 0), a = c.ang * Math.PI / 180;
          const dir = V(Math.sin(a), Math.cos(a), 0); const hand = el.clone().addScaledVector(dir, 2.1);
          const hum = bone(2.2, 0.16); hum.position.copy(el); g.add(hum);
          const rad = bone(2.0, 0.12); rad.position.copy(el); rad.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()); g.add(rad);
          const ins = el.clone().addScaledVector(dir, 0.35), tri = el.clone().add(V(-0.2, -0.15, 0));
          g.add(muscle(sh.clone().add(V(0.22, -0.2, 0)), ins.clone().add(V(0.05, 0, 0)), 0.22 + (170 - c.ang) / 130 * 0.12 + c.load * 0.004, BK.mat.muscle()));
          g.add(muscle(sh.clone().add(V(-0.25, -0.2, 0)), tri, 0.18 + (c.ang - 40) / 130 * 0.08, BK.mat.muscle()));
          const db = new T3.Group(), mt = window.P3D.mat.iron(); const bar = new T3.Mesh(new T3.CylinderGeometry(0.04, 0.04, 0.7, 12), window.P3D.mat.chrome()); bar.rotation.x = Math.PI / 2; db.add(bar); const plate = 0.12 + c.load * 0.012; for (const z of [-0.3, 0.3]) { const p = new T3.Mesh(new T3.CylinderGeometry(plate, plate, 0.1, 24), mt); p.rotation.x = Math.PI / 2; p.position.z = z; db.add(p); } db.position.copy(hand); db.visible = c.load > 0; g.add(db);
          BK.shadow(g); s.hand = hand; s.el = el; s.ins = ins; }
        const dl = 0.35, dm = 0.04, a = c.ang * Math.PI / 180, W8 = c.load * 9.81 + 15; s.F = W8 * dl * Math.sin(a) / (dm * Math.sin(a)); s.W = W8; }
      if (c.mode === "joints") { const t = S.t; s.ball.rotation.set(Math.PI + Math.sin(t) * 0.6, t * 0.8, Math.cos(t * 1.3) * 0.5); s.hinge.rotation.z = -Math.abs(Math.sin(t)) * 1.6; }
    },
    overlay(ctx, s, c, S, B) { if (c.mode === "arm" && s.el) { BK.lab(S, B, -0.1, 2.4, 0.3, "Biceps (contracts)", c.ang < 120 ? "#ff7b72" : "#9fb3d6", 10, 0); BK.lab(S, B, -0.75, 2.4, 0.3, "Triceps (relaxes)", "#9fb3d6", -10, 0); BK.lab(S, B, s.el.x, s.el.y, 0.2, "Elbow = fulcrum (hinge joint)", "#ffd27a", 10, 22); }
      if (c.mode === "joints") { BK.lab(S, B, -1.6, 2.6, 0, "Ball and socket (shoulder, hip)", "#ffd27a", 0, -10); BK.lab(S, B, 1.6, 2.6, 0, "Hinge (elbow, knee)", "#ffd27a", 0, -10); }
      if (c.mode === "spine" && s.vert) { BK.lab(S, B, 0.4, s.vert[2].position.y, 0, "Lumbar (large centrum)", "#ffd27a", 10, 0); BK.lab(S, B, 0.4, s.vert[16].position.y, 0, "Cervical / thoracic", "#ffd27a", 10, 0); BK.lab(S, B, 0.3, s.vert[9].position.y + 0.13, 0, "Intervertebral disc (cartilage)", "#7cb3ff", 10, 0); } },
    hud: (s, c) => c.mode === "arm" ? [{ title: "Third-class lever", lines: ["Biceps insertion 4 cm from elbow; load 35 cm away.", ["Load (hand + forearm) ≈ " + f(s.W || 0, 0) + " N", "#e8f1ff"], ["Biceps force = load × 35 ÷ 4 ≈ " + f(s.F || 0, 0) + " N", "#ff7b72", true], "Antagonistic pair: biceps bends (flexes), triceps straightens (extends) the arm.", "Muscles can only pull — never push."] }]
      : c.mode === "joints" ? [{ title: "Synovial joints", lines: ["Ball and socket: movement in all planes (shoulder, hip).", "Hinge: movement in one plane (elbow, knee).", "Gliding (wrist), pivot (atlas–axis), fixed (skull sutures).", "Cartilage reduces friction; synovial fluid lubricates; ligaments join bone to bone, tendons join muscle to bone."] }]
      : [{ title: "Vertebral column", lines: ["Cervical (7), thoracic (12), lumbar (5), sacral (5 fused), caudal.", "Centrum carries weight; neural canal protects the spinal cord.", "Discs of cartilage absorb shock.", "Functions of the skeleton: support, protection, movement, breathing, blood cell production."] }],
    readouts: (s, c) => c.mode === "arm" ? [["Elbow angle", c.ang + "°"], ["Biceps force", f(s.F || 0, 0) + " N"]] : [],
    table: () => MK.table(["Skeleton", "Material", "Example"], [["Exoskeleton", "Chitin", "Insects, crabs"], ["Endoskeleton", "Bone and cartilage", "Vertebrates"], ["Hydrostatic", "Fluid under pressure", "Earthworm, Hydra"]]),
    note: "Learn the bones of the girdles and limbs: scapula, humerus, radius, ulna; pelvic girdle, femur, tibia, fibula.",
    draw: BK.fallback("Movement", (s, c) => ["Biceps force ≈ " + f(s.F || 0, 0) + " N at " + c.ang + "° (lever: elbow = fulcrum)", "Antagonistic muscles: biceps flexes, triceps extends"]),
  });

  /* ===================== S-b  plant support tissues ===================== */
  function tsTex(kind, sel) { const c = BK.cv(512, 512), g = c.getContext("2d"), cx = 256, R = 240;
    const ring = (r0, r1, col) => { g.fillStyle = col; g.beginPath(); g.arc(cx, cx, r1, 0, 6.3); g.arc(cx, cx, r0, 0, 6.3, true); g.fill(); };
    const cells = (r0, r1, sz, col, edge) => { for (let r = r0 + sz / 2; r < r1; r += sz) { const n = Math.floor(2 * Math.PI * r / sz); for (let i = 0; i < n; i++) { const a = i / n * 6.283 + r; g.fillStyle = col; g.strokeStyle = edge; g.lineWidth = 1; g.beginPath(); g.arc(cx + Math.cos(a) * r, cx + Math.sin(a) * r, sz * 0.46, 0, 6.3); g.fill(); g.stroke(); } } };
    const hi = (k) => (sel === k ? 1 : 0);
    g.fillStyle = "#d9ecc4"; g.fillRect(0, 0, 512, 512);
    if (kind === "stem") { ring(R - 10, R, hi("epi") ? "#ffd27a" : "#4f8a3a"); cells(R - 60, R - 10, 14, hi("col") ? "#ffe6a0" : "#bfe0a0", "#7fae6a"); cells(110, R - 60, 20, hi("par") ? "#ffe6a0" : "#cfe6b0", "#7fae6a"); cells(0, 110, 22, hi("pith") ? "#ffe6a0" : "#f2f6e6", "#b8d4a8");
      for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283, x = cx + Math.cos(a) * 140, y = cx + Math.sin(a) * 140; g.save(); g.translate(x, y); g.rotate(a); g.scale(2.1, 2.1); g.fillStyle = hi("phl") ? "#ffd27a" : "#6fae4a"; g.beginPath(); g.ellipse(22, 0, 12, 16, 0, 0, 6.3); g.fill(); g.fillStyle = "#3f7a2f"; g.fillRect(8, -14, 3, 28); g.fillStyle = hi("xyl") ? "#ffb347" : "#a8322a"; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(-8 + (k % 3) * 7, (Math.floor(k / 3) - 0.5) * 10, 3.6, 0, 6.3); g.fill(); } g.fillStyle = hi("scl") ? "#ffd27a" : "#3d5a2a"; g.beginPath(); g.ellipse(38, 0, 5, 15, 0, 0, 6.3); g.fill(); g.restore(); } }
    else { ring(R - 8, R, hi("epi") ? "#ffd27a" : "#b8a070"); cells(70, R - 8, 22, hi("par") ? "#ffe6a0" : "#efe8d0", "#c9b88a"); ring(62, 72, "#d4b483"); g.fillStyle = hi("xyl") ? "#ffb347" : "#b84a3a"; for (let i = 0; i < 4; i++) { g.save(); g.translate(cx, cx); g.rotate(i * Math.PI / 2); g.beginPath(); g.moveTo(-14, 0); g.lineTo(0, -58); g.lineTo(14, 0); g.fill(); g.restore(); } g.beginPath(); g.arc(cx, cx, 20, 0, 6.3); g.fill(); g.fillStyle = hi("phl") ? "#ffd27a" : "#8fc46a"; for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; g.beginPath(); g.arc(cx + Math.cos(a) * 38, cx + Math.sin(a) * 38, 12, 0, 6.3); g.fill(); } }
    return BK.tex(c); }
  const TIS = { epi: ["Epidermis", "Protective outer layer; cuticle reduces water loss."], col: ["Collenchyma", "Cells thickened at the corners with cellulose — flexible support in young stems."], par: ["Cortex parenchyma", "Thin-walled cells; when turgid they give rigidity, store food."], scl: ["Sclerenchyma", "Dead cells with lignified walls — strength (fibres)."], xyl: ["Xylem", "Lignified vessels: carry water and minerals AND support (wood)."], phl: ["Phloem", "Sieve tubes and companion cells carry food (sucrose)."], pith: ["Pith", "Central parenchyma for storage."] };
  BK.def3d("S-b", {
    label: "Photoreal 3D lab", title: "Supporting tissues in plants",
    blurb: "A cut herbaceous stem and root with their transverse sections on the cut face, plus a plant that wilts as it loses water.",
    env: "lab", cam: [[1.6, 3.2, 6.6], [1.4, 1.2, 0]], fov: 38,
    values: { mode: "stem", tis: "xyl", water: 100 },
    controls: [{ type: "tabs", key: "mode", label: "Specimen", options: [["stem", "Dicot stem T.S."], ["root", "Dicot root T.S."], ["wilt", "Turgor and wilting"]] }, { type: "select", key: "tis", label: "Highlight tissue", options: Object.keys(TIS).map((k) => [k, TIS[k][0]]), show: W("mode", "stem", "root") }, { key: "water", label: "Water in cells (turgor)", min: 20, max: 100, unit: "%", show: W("mode", "wilt") }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) {
      const T3 = T(), key = c.mode + (c.mode === "wilt" ? Math.round(c.water / 5) : c.tis);
      if (s.key !== key) { s.key = key; const g = BK.group(S, s);
        if (c.mode !== "wilt") { const col = c.mode === "stem" ? 0x6fa94a : 0xd8c49a; const side = new T3.MeshPhysicalMaterial({ color: col, roughness: 0.5, sheen: 0.5 }), cap = new T3.MeshStandardMaterial({ map: tsTex(c.mode, c.tis), roughness: 0.6 }); const cyl = new T3.Mesh(new T3.CylinderGeometry(1.1, 1.1, 2.4, 64), [side, cap, side]); cyl.position.y = 1.4; cyl.rotation.x = 0.85; g.add(cyl); s.cyl = cyl;
          const knife = new T3.Mesh(new T3.BoxGeometry(2.6, 0.03, 0.5), window.P3D.mat.steel()); knife.position.set(1.9, 0.2, 0.9); knife.rotation.y = 0.6; g.add(knife); }
        else { const k = c.water / 100, pot = new T3.Mesh(new T3.CylinderGeometry(0.5, 0.38, 0.7, 32), new T3.MeshPhysicalMaterial({ color: 0xb8643a, roughness: 0.7 })); pot.position.y = 0.35; g.add(pot); const pl = BK.plant({ h: 2, bend: (1 - k) * 0.55, leaves: 7, leafLen: 0.55, leafW: 0.3, leafCol: k > 0.6 ? "#3f8a3a" : "#6f8a3a" }); pl.position.y = 0.7; pl.leaves.forEach((lf) => (lf.rotation.x = -1.0 - (1 - k) * 1.2)); g.add(pl); }
        BK.shadow(g); }
      if (s.cyl) s.cyl.rotation.y += dt * 0.25;
    },
    hud: (s, c) => c.mode === "wilt" ? [{ title: "Turgor pressure", lines: [["Cells " + c.water + "% full", c.water > 70 ? "#5bd68c" : "#ff7b72", true], c.water > 70 ? "Vacuoles press cytoplasm against the walls — turgid parenchyma holds the stem and leaves firm." : "Cells lose water faster than they absorb it → flaccid → plant wilts.", "Woody plants stay upright because of lignified xylem and sclerenchyma."] }]
      : [{ title: TIS[c.tis][0], lines: [TIS[c.tis][1], "—", c.mode === "stem" ? "Dicot stem: vascular bundles in a ring, xylem inside, phloem outside." : "Dicot root: xylem in a central star, phloem between the arms; no pith.", ["Functions: strength, rigidity, flexibility, resilience against wind and water.", "#7cb3ff"]] }],
    readouts: (s, c) => c.mode === "wilt" ? [["Turgor", c.water > 70 ? "Turgid" : c.water > 45 ? "Partly flaccid" : "Wilted"]] : [["Tissue", TIS[c.tis][0]]],
    note: "Draw the T.S. at <b>low power</b>: outline the tissue regions (epidermis, cortex, stele) — do not draw individual cells.",
    draw: BK.fallback("Supporting tissues", (s, c) => [TIS[c.tis][0] + ": " + TIS[c.tis][1], "Stem: bundles in a ring. Root: xylem star in the centre."]),
  });

  /* ===================== S-c  heart & circulation ===================== */
  function heartMesh() { const T3 = T(), g = new T3.Group(), wet = BK.mat.wet(0xa22a33);
    const geo = BK.blob(0.9, 5, 0.08, 64, 1, 1.25, 0.85), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 0) { const k = 1 + y * 0.45; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } } geo.computeVertexNormals();
    const v = new T3.Mesh(geo, wet); v.rotation.z = 0.35; g.add(v); g.vent = v;
    const atr = []; for (const sd of [-1, 1]) { const a = new T3.Mesh(BK.blob(0.45, 7 + sd, 0.12, 32, 1, 0.9, 0.9), BK.mat.wet(sd > 0 ? 0xb03a3f : 0x8a3a5a)); a.position.set(sd * 0.55, 0.95, 0.15); g.add(a); atr.push(a); } g.atr = atr;
    const aorta = tube([V(0.1, 0.8, 0), V(0.15, 1.7, 0), V(-0.4, 2.0, -0.1), V(-0.9, 1.6, -0.2), V(-0.95, 0.4, -0.3)], 0.17, BK.mat.wet(0xc23a3a)); g.add(aorta);
    const pul = tube([V(-0.2, 0.75, 0.3), V(-0.15, 1.5, 0.4), V(0.45, 1.7, 0.2), V(0.9, 1.55, 0)], 0.15, BK.mat.wet(0x5a6ad6)); g.add(pul);
    const vc = tube([V(-0.75, 2.2, 0), V(-0.7, 1.2, 0.1), V(-0.6, 0.9, 0.15)], 0.15, BK.mat.wet(0x3a4aa8)); g.add(vc);
    const fat = BK.mat.tissue(0xe8c870, 0.6); for (let i = 0; i < 6; i++) { const cor = tube([V(0.3 - i * 0.1, 0.6, 0.75), V(0.4 - i * 0.2, 0, 0.82), V(0.2 - i * 0.15, -0.8, 0.5)], 0.03, BK.mat.wet(i % 2 ? 0xd04040 : 0x4050c0), 20, 6); cor.rotation.z = 0.35; g.add(cor); }
    return BK.shadow(g); }
  BK.def3d("S-c", {
    label: "Photoreal 3D lab", title: "Heart and double circulation",
    blurb: "A beating heart pumps oxygenated (red) and deoxygenated (blue) blood around the lungs and body — set the heart rate and follow the blood.",
    env: "studio", cam: [[1.6, 2.4, 8.4], [1.4, 1.4, 0]], fov: 38,
    values: { hr: 72, sv: 70, ex: 0 },
    controls: [{ key: "hr", label: "Heart rate", min: 40, max: 190, unit: "beats/min" }, { key: "sv", label: "Stroke volume", min: 40, max: 120, unit: "cm³" }, { type: "toggle", key: "ex", label: "Exercising muscles" }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s); s.heart = heartMesh(); s.heart.position.set(0, 1.4, 0); s.heart.scale.setScalar(0.85); g.add(s.heart);
      const lung = new T3.MeshPhysicalMaterial({ map: BK.spotTex("#e89aa0", "#b85a66", 200, 5), roughness: 0.6, sheen: 1, sheenColor: new T3.Color(0xffd0d8) }); for (const sd of [-1, 1]) { const l = new T3.Mesh(BK.blob(0.6, 3 + sd, 0.15, 40, 0.85, 1.3, 0.7), lung); l.position.set(sd * 1.5, 3.6, -0.3); g.add(l); }
      const body = new T3.Mesh(BK.blob(0.8, 9, 0.12, 40, 1.8, 0.7, 0.9), BK.mat.tissue(0xc8755a)); body.position.set(0, -1.1, 0); g.add(body); s.body = body;
      const A = V(0.4, 1.9, 0), Vn = V(-0.4, 1.9, 0);
      s.loops = [{ pts: [V(-0.25, 2.0, 0.2), V(-1.0, 3.0, 0), V(-1.5, 3.6, 0), V(-0.5, 4.2, 0), V(0.5, 4.2, 0), V(1.5, 3.6, 0), V(1.0, 3.0, 0), V(0.3, 2.0, 0.2)], from: 0x3355ee, to: 0xee2222 },
        { pts: [V(0.35, 1.0, 0.3), V(1.4, 0.2, 0.2), V(1.6, -1.1, 0), V(0, -1.6, 0.4), V(-1.6, -1.1, 0), V(-1.4, 0.2, 0.2), V(-0.35, 1.0, 0.3)], from: 0xee2222, to: 0x3355ee }];
      s.loops.forEach((L) => { L.curve = new T3.CatmullRomCurve3(L.pts); const half = new T3.CatmullRomCurve3(L.pts.slice(0, Math.ceil(L.pts.length / 2) + 1)), half2 = new T3.CatmullRomCurve3(L.pts.slice(Math.floor(L.pts.length / 2))); g.add(new T3.Mesh(new T3.TubeGeometry(half, 60, 0.07, 10), Object.assign(BK.mat.membrane(L.from, 0.35)))); g.add(new T3.Mesh(new T3.TubeGeometry(half2, 60, 0.07, 10), Object.assign(BK.mat.membrane(L.to, 0.35))));
        L.im = new T3.InstancedMesh(new T3.SphereGeometry(0.045, 10, 8), new T3.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 1 }), 70); L.im.instanceColor = new T3.InstancedBufferAttribute(new Float32Array(70 * 3), 3); g.add(L.im); L.u = Array.from({ length: 70 }, (_, i) => i / 70); });
      BK.shadow(g); s.ph = 0; },
    update(S, s, c, dt) { const hr = c.hr * (c.ex ? 1 : 1), bps = hr / 60; s.ph = (s.ph + dt * bps) % 1; const p = s.ph; const at = p < 0.15 ? Math.sin(p / 0.15 * Math.PI) : 0, ve = p > 0.15 && p < 0.5 ? Math.sin((p - 0.15) / 0.35 * Math.PI) : 0;
      s.heart.vent.scale.set(1 - 0.09 * ve, 1 - 0.06 * ve, 1 - 0.09 * ve); s.heart.atr.forEach((a) => a.scale.setScalar(1 - 0.14 * at)); s.state = p < 0.15 ? "Atrial systole" : p < 0.5 ? "Ventricular systole" : "Diastole";
      const flow = (c.hr * c.sv) / (72 * 70), m4 = new (T().Matrix4)(), col = new (T().Color)(); s.loops.forEach((L) => { L.u.forEach((u, i) => { const push = 0.02 + 0.18 * ve; L.u[i] = (u + dt * 0.08 * flow * (0.4 + push * 6)) % 1; const pt = L.curve.getPointAt(L.u[i]); m4.makeTranslation(pt.x, pt.y, pt.z); L.im.setMatrixAt(i, m4); col.setHex(L.u[i] < 0.5 ? L.from : L.to); L.im.setColorAt(i, col); }); L.im.instanceMatrix.needsUpdate = true; L.im.instanceColor.needsUpdate = true; });
      s.body.material.color.setHex(c.ex ? 0xd8604a : 0xc8755a); },
    overlay(ctx, s, c, S, B) { BK.lab(S, B, 0, 4.4, 0, "Lungs — pulmonary circulation", "#7cb3ff", 0, -4); BK.lab(S, B, 0, -1.9, 0.4, "Body tissues — systemic circulation", "#ff7b72", 0, 16); BK.lab(S, B, 0.7, 1.4, 0.6, "Heart", "#ffd27a", 18, 0); },
    hud: (s, c) => { const co = c.hr * c.sv / 1000; return [{ title: "Cardiac cycle", lines: [[s.state || "", "#ffd27a", true], ["Cardiac output = HR × SV = " + c.hr + " × " + c.sv + " cm³ = " + f(co, 2) + " dm³/min", "#5bd68c"], "Right side → lungs (pulmonary artery carries deoxygenated blood).", "Left side → body (aorta); thicker left ventricle wall.", "Valves (tricuspid, bicuspid, semilunar) stop backflow."] }]; },
    readouts: (s, c) => [["Heart rate", c.hr + " /min"], ["Cardiac output", f(c.hr * c.sv / 1000, 2) + " dm³/min"], ["Phase", s.state || ""]],
    table: () => MK.table(["Component", "Function"], [["Red cells (erythrocytes)", "Carry O₂ as oxyhaemoglobin; no nucleus, biconcave"], ["White cells (phagocytes, lymphocytes)", "Engulf germs; make antibodies"], ["Platelets", "Blood clotting"], ["Plasma", "Carries food, urea, CO₂, hormones, heat"], ["Lymph", "Returns tissue fluid; carries fats from lacteals"]]),
    note: "Arteries: thick elastic walls, high pressure, away from heart. Veins: thin walls, valves, towards heart. Capillaries: one cell thick — exchange.",
    draw: BK.fallback("Double circulation", (s, c) => ["Heart → lungs → heart → body → heart", "Cardiac output = " + f(c.hr * c.sv / 1000, 2) + " dm³/min"]),
  });

  /* ===================== S-d  transport in plants ===================== */
  BK.def3d("S-d", {
    label: "Photoreal 3D bench experiment", title: "Transport in plants",
    blurb: "A potometer measures transpiration as an air bubble moves along a capillary; a cut shoot in eosin turns its xylem red; a ringed stem swells above the ring.",
    env: "lab", cam: [[1.6, 2.8, 7.2], [1.5, 1.4, 0]], fov: 38,
    values: { mode: "pot", light: 70, wind: 1, hum: 50, temp: 28 },
    controls: [{ type: "tabs", key: "mode", label: "Experiment", options: [["pot", "Potometer"], ["eosin", "Eosin uptake"], ["ring", "Ringing experiment"]] }, { key: "light", label: "Light", min: 0, max: 100, unit: "%", show: W("mode", "pot") }, { key: "wind", label: "Wind speed", min: 0, max: 5, step: 0.5, unit: "m/s", show: W("mode", "pot") }, { key: "hum", label: "Relative humidity", min: 20, max: 95, unit: "%", show: W("mode", "pot") }, { key: "temp", label: "Temperature", min: 10, max: 40, unit: "°C", show: W("mode", "pot") }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) {
      const T3 = T();
      if (s.key !== c.mode) { s.key = c.mode; const g = BK.group(S, s); s.t = 0; s.bub = 0;
        const stand = window.P3D.S.mk.stand(3.6, -1.8, -0.4); g.add(stand);
        const shoot = BK.plant({ h: 1.4, leaves: 8, leafLen: 0.5, leafW: 0.28, r: 0.04 }); shoot.position.set(-0.6, 2.0, 0); g.add(shoot); s.shoot = shoot;
        if (c.mode === "pot") { const cap = tube([V(-0.6, 2.0, 0), V(-0.6, 1.4, 0), V(-0.3, 1.0, 0), V(0.5, 1.0, 0), V(3.0, 1.0, 0)], 0.05, glass()); g.add(cap); const water = tube([V(-0.6, 1.95, 0), V(-0.6, 1.4, 0), V(-0.3, 1.0, 0), V(0.5, 1.0, 0), V(3.0, 1.0, 0)], 0.035, window.P3D.mat.water(0x8fc8ea)); g.add(water);
          s.bubble = new T3.Mesh(new T3.SphereGeometry(0.045, 16, 12), new T3.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, transparent: true, opacity: 0.85, clearcoat: 1 })); s.bubble.scale.set(1.8, 1, 1); g.add(s.bubble);
          const rul = window.P3D.S.mk.ruler(3, 0.3, 1.25, 0.82, 0.25); g.add(rul); const res = new T3.Mesh(new T3.CylinderGeometry(0.3, 0.3, 0.8, 24), glass()); res.position.set(0.0, 1.8, 0); res.renderOrder = 3; g.add(res); }
        if (c.mode === "eosin") { const bk = window.P3D.S.mk.beaker(0.5, 1.0, 0.7, 0xc0124a); bk.position.set(-0.6, 0, 0); g.add(bk); shoot.position.set(-0.6, 0.6, 0); s.shoot.stem.material = new T3.MeshPhysicalMaterial({ color: 0x6fa94a, roughness: 0.45, sheen: 0.4 });
          const cut = new T3.Mesh(new T3.CylinderGeometry(0.4, 0.4, 0.3, 48), [new T3.MeshPhysicalMaterial({ color: 0x6fa94a }), new T3.MeshStandardMaterial({ map: tsTex("stem", "xyl") }), new T3.MeshPhysicalMaterial({ color: 0x6fa94a })]); cut.position.set(1.4, 0.6, 0.4); cut.rotation.x = 0.9; g.add(cut); s.cut = cut; }
        if (c.mode === "ring") { shoot.visible = false; const tr = new T3.Group(); const lower = new T3.Mesh(new T3.CylinderGeometry(0.22, 0.24, 1.2, 32), BK.mat.bark()); lower.position.y = 0.6; tr.add(lower); const wood = new T3.Mesh(new T3.CylinderGeometry(0.17, 0.17, 0.3, 32), new T3.MeshPhysicalMaterial({ color: 0xe8d4a8, roughness: 0.7 })); wood.position.y = 1.35; tr.add(wood); s.upper = new T3.Mesh(new T3.CylinderGeometry(0.22, 0.22, 1.4, 32), BK.mat.bark()); s.upper.position.y = 2.2; tr.add(s.upper); const can = BK.tree(2.0, 4); can.position.y = 1.5; tr.add(can); tr.position.set(0.2, 0, 0); g.add(tr); }
        BK.shadow(g, true, true); }
      s.t += dt;
      const sat = (c.hum / 100), es = 0.611 * Math.exp(17.27 * c.temp / (c.temp + 237.3)), vpd = es * (1 - sat), stom = 0.15 + 0.85 * (c.light / 100); s.rate = vpd * stom * (1 + 0.45 * c.wind) * 2.4;
      if (c.mode === "pot" && s.bubble) { s.bub = (s.bub + dt * s.rate * 0.06) % 2.6; s.bubble.position.set(2.95 - s.bub, 1.0, 0); s.shoot.leaves.forEach((lf, i) => (lf.rotation.z = Math.sin(s.t * (1 + c.wind) + i) * 0.04 * c.wind)); }
      if (c.mode === "eosin") { s.ey = Math.min(1, (s.ey || 0) + dt * 0.08); s.shoot.stem.material.color.setHex(0x6fa94a).lerp(new (T().Color)(0xb8324a), s.ey * 0.75); s.shoot.leaves.forEach((lf) => lf.material.color && lf.material.color.setRGB(1, 1 - s.ey * 0.3, 1 - s.ey * 0.3)); if (s.cut) s.cut.rotation.y += dt * 0.3; }
      if (c.mode === "ring" && s.upper) { s.sw = Math.min(1, (s.sw || 0) + dt * 0.06); s.upper.scale.set(1 + 0.25 * s.sw * 1, 1, 1 + 0.25 * s.sw); }
    },
    overlay(ctx, s, c, S, B) { if (c.mode === "pot" && s.bubble) { const p = s.bubble.position; BK.lab(S, B, p.x, p.y + 0.1, p.z, "air bubble", "#e8f1ff", 0, -6); } if (c.mode === "ring") { BK.lab(S, B, 0.45, 2.3, 0, "Swells — sugars pile up above the ring", "#ffd27a", 12, 0); BK.lab(S, B, 0.45, 1.35, 0, "Ring: bark + phloem removed", "#ff7b72", 12, 0); BK.lab(S, B, 0.45, 0.6, 0, "Below: no food arrives", "#9fb3d6", 12, 0); } if (c.mode === "eosin") BK.lab(S, B, 1.4, 1.1, 0.4, "Stem T.S.: only xylem stains red", "#ff7b72", 0, -10); },
    hud: (s, c) => c.mode === "pot" ? [{ title: "Rate of transpiration", lines: [["Bubble speed ≈ " + f(s.rate || 0, 2) + " mm/min", "#ffd27a", true], "Faster when: brighter (stomata open), windier, warmer, drier.", ["Vapour pressure deficit = " + f(((0.611 * Math.exp(17.27 * c.temp / (c.temp + 237.3))) * (1 - c.hum / 100)), 2) + " kPa", "#7cb3ff"], "The potometer actually measures water UPTAKE (≈ 99% is transpired)."] }]
      : c.mode === "eosin" ? [{ title: "Uptake of water", lines: ["Root hairs → cortex (osmosis) → xylem → stem → leaves.", "Red dye rises only in the xylem vessels.", "Forces: root pressure, capillarity/adhesion, cohesion–tension (transpiration pull)."] }]
      : [{ title: "Translocation", lines: ["Removing a ring of bark removes the phloem but leaves the xylem.", "Leaves stay green (water still rises in xylem).", "Sugars made in leaves cannot pass the ring → swelling above it.", "Mass (pressure) flow: sucrose moves from source (leaf) to sink (root, fruit)."] }],
    readouts: (s, c) => c.mode === "pot" ? [["Rate", f(s.rate || 0, 2) + " mm/min"], ["Humidity", c.hum + "%"], ["Wind", c.wind + " m/s"]] : [],
    table: () => MK.table(["Factor", "Effect on transpiration", "Reason"], [["Light ↑", "Increases", "Stomata open"], ["Temperature ↑", "Increases", "More evaporation, higher VPD"], ["Humidity ↑", "Decreases", "Smaller diffusion gradient"], ["Wind ↑", "Increases", "Removes saturated air"], ["Soil water ↓", "Decreases", "Stomata close"]]),
    note: "Types of transpiration: <b>stomatal</b> (≈ 90%), cuticular and lenticular. Advantages: cooling, mineral transport; disadvantage: wilting.",
    draw: BK.fallback("Transport in plants", (s, c) => ["Potometer rate ≈ " + f(s.rate || 1, 2) + " mm/min — up with light, wind, heat; down with humidity", "Eosin rises in xylem; ringing shows food moves in phloem"]),
  });

  /* ===================== S-e  respiratory surfaces ===================== */
  BK.def3d("S-e", {
    label: "Photoreal 3D lab", title: "Respiratory systems",
    blurb: "Pull the rubber sheet of the bell-jar model and the balloons inflate; zoom into alveoli exchanging gases; watch water flow over fish gills; open and close stomata.",
    env: "lab", cam: [[1.4, 2.8, 7.2], [1.4, 1.6, 0]], fov: 38,
    values: { mode: "bell", rate: 16, light: 80 },
    controls: [{ type: "tabs", key: "mode", label: "Surface", options: [["bell", "Bell-jar model (mammal)"], ["alv", "Alveoli"], ["gill", "Fish gills"], ["stom", "Stomata (plants)"]] }, { key: "rate", label: "Breathing rate", min: 6, max: 40, unit: "/min", show: W("mode", "bell", "alv", "gill") }, { key: "light", label: "Light", min: 0, max: 100, unit: "%", show: W("mode", "stom") }],
    build(S, s, c) { s.key = ""; },
    update(S, s, c, dt) {
      const T3 = T();
      if (s.key !== c.mode) { s.key = c.mode; const g = BK.group(S, s); s.ph = 0;
        if (c.mode === "bell") { const pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI / 2; pts.push(new T3.Vector2(Math.sin(a) * 1.2 + (i === 24 ? 0 : 0), 3.0 - (1 - Math.cos(a)) * 0.6 - i / 24 * 0)); } const prof = [new T3.Vector2(0.2, 3.4), new T3.Vector2(0.25, 3.0), new T3.Vector2(1.0, 2.8), new T3.Vector2(1.25, 2.3), new T3.Vector2(1.3, 0.4), new T3.Vector2(1.32, 0.35)];
          const jar = new T3.Mesh(new T3.LatheGeometry(prof, 48), glass()); jar.renderOrder = 3; g.add(jar); g.add(tube([V(0, 4.0, 0), V(0, 2.3, 0)], 0.07, glass())); g.add(tube([V(0, 2.35, 0), V(-0.35, 2.0, 0), V(-0.5, 1.75, 0)], 0.05, glass())); g.add(tube([V(0, 2.35, 0), V(0.35, 2.0, 0), V(0.5, 1.75, 0)], 0.05, glass()));
          s.balls = [-1, 1].map((sd) => { const b = new T3.Mesh(BK.blob(0.38, 4 + sd, 0.04, 40, 1, 1.15, 1), new T3.MeshPhysicalMaterial({ color: 0xe86a80, roughness: 0.3, clearcoat: 1, sheen: 0.5 })); b.position.set(sd * 0.55, 1.4, 0); g.add(b); return b; });
          s.sheet = new T3.Mesh(new T3.SphereGeometry(1.3, 48, 12, 0, 6.3, Math.PI * 0.5, Math.PI * 0.5), new T3.MeshPhysicalMaterial({ color: 0x2a2a2a, roughness: 0.8, side: T3.DoubleSide })); s.sheet.position.y = 0.4; g.add(s.sheet); const knob = new T3.Mesh(new T3.SphereGeometry(0.12, 16, 12), window.P3D.mat.rubber()); g.add(knob); s.knob = knob; }
        if (c.mode === "alv") { s.alv = []; const mat = new T3.MeshPhysicalMaterial({ color: 0xf0a0a8, roughness: 0.35, transparent: true, opacity: 0.55, clearcoat: 1, sheen: 1, depthWrite: false }); for (let i = 0; i < 9; i++) { const a = new T3.Mesh(new T3.SphereGeometry(0.55, 32, 24), mat); a.position.set(Math.cos(i * 0.7) * 1.1 + (i % 3) * 0.4 - 0.6, 1.6 + Math.sin(i * 1.3) * 0.8, Math.sin(i * 0.7) * 0.7); g.add(a); s.alv.push(a); }
          g.add(tube([V(0, 4.0, 0), V(0, 2.8, 0), V(0, 2.2, 0)], 0.18, mat)); const cap = []; for (let i = 0; i < 6; i++) { const pts = []; for (let j = 0; j <= 20; j++) { const u = j / 20; pts.push(V(-2.2 + u * 4.4, 0.6 + i * 0.4 + Math.sin(u * 6 + i) * 0.3, Math.cos(u * 5 + i) * 0.9)); } const capm = tube(pts, 0.05, BK.mat.wet(i % 2 ? 0xc0303a : 0x5050c0), 60, 8); g.add(capm); }
          s.gas = new T3.InstancedMesh(new T3.SphereGeometry(0.05, 8, 6), new T3.MeshPhysicalMaterial({ roughness: 0.2 }), 60); s.gas.instanceColor = new T3.InstancedBufferAttribute(new Float32Array(180), 3); g.add(s.gas); s.G = Array.from({ length: 60 }, (_, i) => [Math.random(), i % 2]); }
        if (c.mode === "gill") { const arch = tube([V(-1.2, 0.8, 0), V(-0.4, 2.2, 0), V(0.6, 2.5, 0), V(1.6, 1.8, 0)], 0.1, BK.mat.bone()); g.add(arch); const curve = new T3.CatmullRomCurve3([V(-1.2, 0.8, 0), V(-0.4, 2.2, 0), V(0.6, 2.5, 0), V(1.6, 1.8, 0)]); const fm = BK.mat.wet(0xd0404a);
          for (let i = 0; i <= 30; i++) { const p = curve.getPointAt(i / 30), t = curve.getTangentAt(i / 30), n = V(-t.y, t.x, 0); for (const sd of [-1, 1]) { const fil = new T3.Mesh(new T3.CapsuleGeometry(0.03, 0.75, 4, 8), fm); fil.position.copy(p).addScaledVector(n, -0.42).add(V(0, 0, sd * 0.07)); fil.quaternion.setFromUnitVectors(V(0, 1, 0), n.clone().negate()); g.add(fil); } }
          for (let i = 0; i < 4; i++) { const gr = tube([V(-0.8 + i * 0.6, 1.9 + i * 0.1, 0.25), V(-0.7 + i * 0.6, 1.1, 0.25)], 0.04, BK.mat.bone(), 10, 6); g.add(gr); }
          s.water = new T3.InstancedMesh(new T3.SphereGeometry(0.035, 8, 6), window.P3D.mat.water(0x9fd8ff), 120); g.add(s.water); s.Wp = Array.from({ length: 120 }, () => [Math.random() * 4 - 2, Math.random() * 1.6 + 0.6, (Math.random() - 0.5) * 1.2]); }
        if (c.mode === "stom") { const leaf = new T3.Mesh(new T3.BoxGeometry(4.5, 0.2, 2.6), BK.mat.leaf("#3f8a3a", "#7fb85a")); leaf.position.y = 0.9; g.add(leaf); s.guards = []; for (let i = 0; i < 3; i++) { const gg = new T3.Group(); for (const sd of [-1, 1]) { const gc = new T3.Mesh(new T3.TorusGeometry(0.34, 0.14, 16, 32, Math.PI), BK.mat.tissue(0x5fb04a, 0.4)); gc.rotation.x = -Math.PI / 2; gc.rotation.z = sd > 0 ? 0 : Math.PI; gg.add(gc); gc.userData.sd = sd; } gg.position.set(-1.4 + i * 1.4, 1.02, 0); g.add(gg); s.guards.push(gg); const pore = new T3.Mesh(new T3.CircleGeometry(0.2, 24), new T3.MeshBasicMaterial({ color: 0x0b1a0b })); pore.rotation.x = -Math.PI / 2; pore.scale.set(0.3, 1, 1); pore.position.set(-1.4 + i * 1.4, 1.005, 0); g.add(pore); gg.pore = pore; } }
        BK.shadow(g, true, true); }
      s.ph = (s.ph + dt * c.rate / 60) % 1; const br = 0.5 - 0.5 * Math.cos(s.ph * Math.PI * 2);
      if (c.mode === "bell") { s.sheet.scale.y = 0.15 + 0.85 * br; s.knob.position.set(0, 0.4 - 1.3 * (0.15 + 0.85 * br), 0); s.balls.forEach((b) => b.scale.setScalar(0.65 + 0.55 * br)); s.br = br; }
      if (c.mode === "alv") { s.alv.forEach((a, i) => a.scale.setScalar(0.9 + 0.12 * br)); const m4 = new (T().Matrix4)(), col = new (T().Color)(); s.G.forEach((g2, i) => { g2[0] = (g2[0] + dt * 0.25) % 1; const a = s.alv[i % 9].position, d = g2[1] ? 1 : -1, y = a.y + (g2[1] ? -0.6 + g2[0] * 0.9 : 0.3 - g2[0] * 0.9); m4.makeTranslation(a.x + Math.cos(i) * 0.3, y, a.z + Math.sin(i) * 0.3); s.gas.setMatrixAt(i, m4); col.setHex(g2[1] ? 0xff4040 : 0x4060ff); s.gas.setColorAt(i, col); }); s.gas.instanceMatrix.needsUpdate = true; s.gas.instanceColor.needsUpdate = true; }
      if (c.mode === "gill") { const m4 = new (T().Matrix4)(); s.Wp.forEach((p, i) => { p[0] += dt * (0.4 + c.rate / 30); if (p[0] > 2.2) p[0] = -2.2; m4.makeTranslation(p[0], p[1] - Math.max(0, -p[0]) * 0.1, p[2]); s.water.setMatrixAt(i, m4); }); s.water.instanceMatrix.needsUpdate = true; }
      if (c.mode === "stom") { const open = c.light / 100; s.guards.forEach((gg) => { gg.children.forEach((gc) => { gc.position.z = gc.userData.sd * (0.02 + 0.18 * open); }); gg.pore.scale.set(0.15 + 0.85 * open, 1, 1); }); s.open = open; }
    },
    overlay(ctx, s, c, S, B) { if (c.mode === "bell") { BK.lab(S, B, 0, 3.9, 0, "Trachea", "#e8f1ff", 10, 0); BK.lab(S, B, 0.9, 1.5, 0, "Balloons = lungs", "#ff9fb0", 10, 0); BK.lab(S, B, 0.9, 0.3, 0, "Rubber sheet = diaphragm", "#ffd27a", 10, 0); BK.lab(S, B, -1.2, 2.0, 0, "Bell jar = thorax", "#9fb3d6", -10, 0); } if (c.mode === "gill") { BK.lab(S, B, 0, 2.6, 0, "Gill arch + rakers", "#e8f1ff", 0, -8); BK.lab(S, B, 0.4, 1.3, 0, "Filaments (lamellae)", "#ff9fb0", 10, 0); } if (c.mode === "alv") BK.lab(S, B, 0, 2.6, 0.6, "Alveoli + capillaries", "#ff9fb0", 10, -10); },
    hud: (s, c) => ({ bell: [{ title: (s.br || 0) > 0.5 ? "Inspiration" : "Expiration", lines: ["Diaphragm down → thorax volume up → pressure falls below atmospheric → air rushes in.", ["Lung volume ≈ " + f(2.5 + 0.5 * (s.br || 0), 2) + " dm³ (tidal volume 0.5 dm³)", "#7cb3ff"], ["Ventilation = " + c.rate + " × 0.5 = " + f(c.rate * 0.5, 1) + " dm³/min", "#5bd68c"], "Real chest: intercostal muscles also raise the ribs."] }],
      alv: [{ title: "Gaseous exchange in alveoli", lines: ["O₂ diffuses into blood (red); CO₂ out (blue).", "Features: huge area (≈ 70 m²), thin (one cell), moist, rich blood supply, ventilated.", ["Inhaled air: 21% O₂, 0.04% CO₂ — exhaled: 16% O₂, 4% CO₂", "#ffd27a"]] }],
      gill: [{ title: "Gills of a bony fish (Tilapia)", lines: ["Mouth opens, floor lowers → water in; operculum opens → water out over the gills.", "Counter-current flow: blood and water flow in opposite directions — up to 80% of O₂ extracted.", "Gill rakers filter food; filaments give a large, thin, well-vascularised surface."] }],
      stom: [{ title: "Opening and closing of stomata", lines: [[(s.open || 0) > 0.5 ? "Open (light: guard cells turgid)" : "Closing (dark: guard cells flaccid)", "#5bd68c", true], "Light → photosynthesis in guard cells → K⁺ and sugar enter → water in by osmosis → thick inner walls bow apart.", "Plants exchange gases through stomata and lenticels by diffusion."] }] }[c.mode]),
    readouts: (s, c) => c.mode === "stom" ? [["Pore", f((s.open || 0) * 100, 0) + "% open"]] : [["Breaths", c.rate + " /min"]],
    table: () => MK.table(["Organism", "Surface", "Ventilation"], [["Amoeba", "Body surface", "Diffusion only"], ["Insect", "Tracheae + spiracles", "Abdominal pumping"], ["Fish", "Gills", "Mouth + operculum"], ["Toad", "Skin, mouth lining, lungs", "Buccal pumping"], ["Mammal", "Lungs (alveoli)", "Diaphragm + intercostals"], ["Plant", "Stomata, lenticels", "Diffusion"]]),
    note: "Respiratory surfaces are always <b>large, thin, moist and well supplied with blood</b>.",
    draw: BK.fallback("Respiratory surfaces", ["Bell jar: diaphragm down → volume up → air in", "Alveoli: large, thin, moist, rich blood supply", "Gills: counter-current exchange"]),
  });

  /* ===================== S-f  nephron ===================== */
  function nephronPath() { return [V(-1.6, 3.0, 0), V(-0.9, 3.2, 0.2), V(-0.5, 2.7, -0.2), V(-0.9, 2.3, 0.2), V(-0.4, 2.0, 0), V(-0.3, 1.4, 0), V(-0.3, 0.2, 0), V(0.1, -0.1, 0), V(0.4, 0.2, 0), V(0.4, 1.6, 0), V(0.8, 2.0, 0.2), V(1.2, 2.4, -0.2), V(1.4, 2.8, 0), V(1.9, 3.0, 0), V(2.0, 1.0, 0), V(2.0, -0.6, 0)]; }
  BK.def3d("S-f", {
    label: "Photoreal 3D lab", title: "Excretion — the nephron",
    blurb: "Blood is filtered at the glomerulus; glucose is reabsorbed, water is saved under the control of ADH, and urea leaves in urine. Drink more or less water and watch.",
    env: "studio", cam: [[1.1, 2.0, 9.4], [1.1, 1.5, 0]], fov: 38,
    values: { water: 2, salt: 1, disease: "none" },
    controls: [{ key: "water", label: "Water drunk today", min: 0.5, max: 5, step: 0.25, unit: "dm³" }, { key: "salt", label: "Salt intake", min: 0.5, max: 2, step: 0.25, unit: "× normal" }, { type: "select", key: "disease", label: "Condition", options: [["none", "Healthy kidney"], ["neph", "Nephritis (protein in urine)"], ["diab", "Diabetes (glucose in urine)"], ["stone", "Kidney stone"]] }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s), path = nephronPath(); s.curve = new T3.CatmullRomCurve3(path);
      g.add(new T3.Mesh(new T3.TubeGeometry(s.curve, 240, 0.13, 14), BK.mat.membrane(0xf2d0a0, 0.45)));
      const cup = new T3.Mesh(new T3.SphereGeometry(0.55, 32, 20, 0, 6.3, 0, Math.PI * 0.62), Object.assign(BK.mat.membrane(0xf2d0a0, 0.5))); cup.position.set(-1.9, 3.0, 0); cup.rotation.z = Math.PI / 2; g.add(cup);
      const glom = []; for (let i = 0; i < 70; i++) { const a = i * 0.7, r = 0.28 + 0.06 * Math.sin(i); glom.push(V(-2.0 + Math.cos(a) * r * 0.8, 3.0 + Math.sin(a * 1.3) * r, Math.sin(a) * r)); } g.add(tube(glom, 0.035, BK.mat.wet(0xc0303a), 300, 8));
      g.add(tube([V(-3.4, 3.4, 0), V(-2.6, 3.2, 0), V(-2.1, 3.05, 0)], 0.07, BK.mat.wet(0xd03838))); g.add(tube([V(-2.1, 2.95, 0), V(-2.6, 2.6, 0), V(-1.2, 1.2, 0.5), V(0.1, 0.4, 0.5), V(1.6, 1.5, 0.5), V(3.4, 2.4, 0)], 0.05, BK.mat.wet(0x8a3a6a)));
      s.stone = new T3.Mesh(BK.blob(0.12, 5, 0.3, 16), new T3.MeshPhysicalMaterial({ color: 0xd8c08a, roughness: 0.8 })); s.stone.position.set(2.0, 0.3, 0); g.add(s.stone);
      const N = 160; s.im = new T3.InstancedMesh(new T3.SphereGeometry(0.045, 8, 6), new T3.MeshPhysicalMaterial({ roughness: 0.25, clearcoat: 0.8 }), N); s.im.instanceColor = new T3.InstancedBufferAttribute(new Float32Array(N * 3), 3); g.add(s.im);
      s.P = Array.from({ length: N }, (_, i) => ({ u: Math.random(), type: i % 10 < 6 ? "w" : i % 10 < 8 ? "u" : i % 10 < 9 ? "g" : "s", off: V((Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.12) }));
      BK.shadow(g, false, false); },
    update(S, s, c, dt) { const m4 = new (T().Matrix4)(), col = new (T().Color)(); const adh = Math.max(0.05, Math.min(1, 1.6 - c.water * 0.32)), glucLeak = c.disease === "diab", prot = c.disease === "neph"; s.adh = adh; s.stone.visible = c.disease === "stone";
      const COLS = { w: 0x5aa8ff, u: 0x5bd68c, g: 0xffd27a, s: 0xe8e8e8, p: 0xff5050 };
      s.P.forEach((p, i) => { p.u += dt * 0.05 * (c.disease === "stone" && p.u > 0.85 ? 0.3 : 1); let gone = false; if (p.type === "g" && !glucLeak && p.u > 0.25 && p.u < 0.4) gone = Math.random() < dt * 4; if (p.type === "w" && p.u > 0.82 && Math.random() < dt * adh * 1.6) gone = true; if (p.type === "s" && p.u > 0.35 && p.u < 0.6 && Math.random() < dt * (1.2 / c.salt)) gone = true; if (gone || p.u > 1) { p.u = 0; if (prot && Math.random() < 0.15) p.type = "p"; else if (p.type === "p") p.type = "w"; }
        const pt = s.curve.getPointAt(Math.min(1, p.u)).add(p.off); m4.makeTranslation(pt.x, pt.y, pt.z); s.im.setMatrixAt(i, m4); col.setHex(COLS[p.type]); s.im.setColorAt(i, col); }); s.im.instanceMatrix.needsUpdate = true; s.im.instanceColor.needsUpdate = true;
      s.urine = 1.5 * c.water / 2 * (1.1 - adh * 0.5); },
    overlay(ctx, s, c, S, B) { BK.lab(S, B, -2.0, 3.6, 0, "Glomerulus + Bowman's capsule: ultrafiltration", "#ff7b72", 0, -6); BK.lab(S, B, -0.7, 2.4, 0.3, "PCT: glucose & most water reabsorbed", "#ffd27a", 14, 22); BK.lab(S, B, 0.1, -0.1, 0.2, "Loop of Henle", "#7cb3ff", 0, 18); BK.lab(S, B, 2.1, 1.6, 0, "Collecting duct (ADH)", "#5aa8ff", 12, 0); },
    hud: (s, c) => [{ title: "Nephron at work", lines: [["ADH level: " + f((s.adh || 0) * 100, 0) + "%", "#5aa8ff", true], ["Urine ≈ " + f(s.urine || 1.5, 1) + " dm³/day — " + ((s.adh || 0) > 0.6 ? "small volume, concentrated" : "large volume, dilute"), "#5bd68c"], "Blue = water, green = urea, yellow = glucose, white = salts, red = protein.", c.disease === "neph" ? "Nephritis: damaged filters let protein into urine." : c.disease === "diab" ? "Diabetes: too much glucose to reabsorb — glucose in urine." : c.disease === "stone" ? "Kidney stone (calcium salts) blocks flow — pain, may need surgery or shock-wave treatment." : "Healthy: no glucose or protein in urine."] }],
    readouts: (s, c) => [["Water intake", c.water + " dm³"], ["ADH", f((s.adh || 0) * 100, 0) + "%"], ["Urine", f(s.urine || 1.5, 1) + " dm³/day"]],
    table: () => MK.table(["Substance", "Plasma", "Filtrate", "Urine"], [["Water", "90%", "90%", "96%"], ["Protein", "8%", "0", "0"], ["Glucose", "0.1%", "0.1%", "0"], ["Urea", "0.03%", "0.03%", "2%"], ["Salts", "0.7%", "0.7%", "1–1.5%"]]),
    note: "Liver: deamination makes urea, stores glycogen, makes bile, detoxifies. It lies under the diaphragm next to the gall bladder, stomach and duodenum.",
    draw: BK.fallback("The nephron", ["Ultrafiltration at the glomerulus", "Selective reabsorption in the tubules (all glucose)", "ADH controls water reabsorption in the collecting duct"]),
  });

  /* ===================== S-g  skin & temperature ===================== */
  BK.def3d("S-g", {
    label: "Photoreal 3D lab", title: "Homeostasis — skin and temperature",
    blurb: "A block of skin: change the air temperature and the capillaries widen or narrow, sweat glands pour sweat and hairs rise or flatten.",
    env: "studio", cam: [[2.6, 3.8, 8.2], [1.2, 0.9, 0]], fov: 36,
    values: { air: 30, act: 0 },
    controls: [{ key: "air", label: "Air temperature", min: 0, max: 45, unit: "°C" }, { type: "toggle", key: "act", label: "Running (more heat made)" }],
    build(S, s, c) { const T3 = T(), g = BK.group(S, s), w = 4, d = 2.6;
      const layer = (h, y, col, op) => { const m = new T3.Mesh(new T3.BoxGeometry(w, h, d), new T3.MeshPhysicalMaterial({ color: col, roughness: 0.6, sheen: 0.6, transparent: op < 1, opacity: op, depthWrite: op >= 1 })); m.position.y = y; g.add(m); return m; };
      layer(0.25, 1.75, 0x9a5a3a, 1); layer(0.12, 1.57, 0x6a3a2a, 0.9); layer(1.0, 1.0, 0xe8b8a8, 0.45); layer(0.6, 0.2, 0xf2dc8a, 0.7);
      s.hairs = []; for (let i = 0; i < 4; i++) { const hg = new T3.Group(); const hair = new T3.Mesh(new T3.CylinderGeometry(0.02, 0.025, 1.6, 8), new T3.MeshStandardMaterial({ color: 0x1a1008 })); hair.position.y = 0.8; hg.add(hair); hg.position.set(-1.5 + i * 1.0, 1.3, 0.6 - (i % 2) * 1.1); g.add(hg); s.hairs.push(hg); const fol = new T3.Mesh(new T3.CylinderGeometry(0.08, 0.06, 0.8, 12), BK.mat.tissue(0xc88a70)); fol.position.set(hg.position.x, 1.1, hg.position.z); g.add(fol); const er = tube([V(hg.position.x + 0.05, 0.9, hg.position.z), V(hg.position.x + 0.35, 1.35, hg.position.z)], 0.035, BK.mat.muscle(), 10, 6); g.add(er); }
      s.caps = []; for (let i = 0; i < 3; i++) { const pts = []; for (let j = 0; j <= 30; j++) { const u = j / 30; pts.push(V(-2 + u * 4, 1.38 + Math.sin(u * 9 + i) * 0.06, -0.9 + i * 0.9)); } const cp = tube(pts, 0.05, BK.mat.wet(0xd02a30), 60, 8); g.add(cp); s.caps.push(cp); }
      s.glands = []; for (let i = 0; i < 2; i++) { const pts = []; for (let j = 0; j < 40; j++) { const a = j * 0.9; pts.push(V(-0.6 + i * 1.4 + Math.cos(a) * 0.15, 0.6 + Math.sin(a * 0.5) * 0.08 + j * 0.002, -0.2 + Math.sin(a) * 0.15)); } pts.push(V(-0.6 + i * 1.4, 1.2, -0.2), V(-0.6 + i * 1.4, 1.9, -0.2)); g.add(tube(pts, 0.035, BK.mat.tissue(0xf0d0a0), 120, 8)); s.glands.push(V(-0.6 + i * 1.4, 1.9, -0.2)); }
      s.drops = new T3.InstancedMesh(new T3.SphereGeometry(0.07, 16, 12), window.P3D.mat.water(0xcfeaff), 30); g.add(s.drops); s.D = Array.from({ length: 30 }, () => [Math.random() * 3.6 - 1.8, Math.random() * 2.2 - 1.1, Math.random()]);
      BK.shadow(g, true, true); s.core = 37; },
    update(S, s, c, dt) { const load = (c.act ? 1.6 : 1) * 0.5, need = (c.air - 33) / 12 + (c.act ? 0.6 : 0); const hot = Math.max(-1, Math.min(1, need)); s.hot = hot;
      s.caps.forEach((cp) => cp.scale.set(1, 1, 1), 0); s.caps.forEach((cp, i) => { const k = 0.55 + 0.45 * (hot + 1); cp.scale.set(1, k, k); cp.position.y = 1.38 * (1 - k) + 0; });
      s.hairs.forEach((h) => (h.rotation.z = hot < -0.2 ? 0 : 1.1 * Math.min(1, (hot + 0.2) * 2))); const m4 = new (T().Matrix4)(); const sweat = Math.max(0, hot); s.D.forEach((d, i) => { d[2] = (d[2] + dt * 0.3) % 1; const vis = i < sweat * 30; const k = vis ? 0.6 + d[2] * 0.6 : 0.0001; m4.compose(V(d[0], 1.9, d[1]), new (T().Quaternion)(), V(k, k * 0.6, k)); s.drops.setMatrixAt(i, m4); }); s.drops.instanceMatrix.needsUpdate = true;
      s.core = 37 + Math.max(-0.4, Math.min(0.6, (c.air - 33) * 0.01 + (c.act ? 0.3 : 0))); },
    overlay(ctx, s, c, S, B) { BK.lab(S, B, -2.1, 1.8, 1.3, "Epidermis", "#e8f1ff", -10, 0); BK.lab(S, B, -2.1, 1.0, 1.3, "Dermis: capillaries, glands, follicles", "#ff9fb0", -10, 0); BK.lab(S, B, -2.1, 0.2, 1.3, "Fat — insulation", "#ffd27a", -10, 0); },
    hud: (s, c) => [{ title: (s.hot || 0) > 0 ? "Too hot → lose heat" : "Too cold → keep heat", lines: [["Core temperature held at ≈ " + f(s.core || 37, 1) + " °C", "#5bd68c", true], (s.hot || 0) > 0 ? "Vasodilation: arterioles widen → more blood near surface → heat radiates." : "Vasoconstriction: less blood near surface.", (s.hot || 0) > 0 ? "Sweating: evaporation takes latent heat (2.4 kJ per g)." : "Hair erector muscles contract → hairs trap air; shivering makes heat.", "Hypothalamus is the thermostat (negative feedback)."] }],
    readouts: (s, c) => [["Air", c.air + " °C"], ["Sweat", f(Math.max(0, s.hot || 0) * 100, 0) + "%"], ["Capillaries", (s.hot || 0) > 0 ? "dilated" : "constricted"]],
    note: "Homeostasis = keeping the internal environment constant: temperature (skin), water and salts (kidney), blood sugar (liver + insulin).",
    draw: BK.fallback("Skin and temperature", (s, c) => [c.air > 33 ? "Hot: vasodilation, sweating, hairs flat" : "Cold: vasoconstriction, hairs raised, shivering", "Hypothalamus controls body temperature (≈ 37 °C)"]),
  });
})();
