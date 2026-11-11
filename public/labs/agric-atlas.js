/* agric-atlas.js — realistic farm animals for the Agricultural Science lab, each with four body views.
   Loads after agric-kit*.js, bio-atlas*.js and animal-gut.js; replaces AK.animal, AK.bird and AK.fish, so every scene gets the new animals.
   Body views (o.view or the lab-wide AK.bodyView): "coat" (as seen on the farm), "clear" (transparent coat), "xray" (see-through outline)
   and "open" (a window cut in each flank). All views except coat show the organs in their real positions.
   Cattle, goats, sheep, pigs and rabbits keep moving legs, head and tail (AK.animate still works).
   Everything is shaped from signed-distance functions and painted in code; no model files. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, BA = window.BA, AK = window.AK;
  if (!MK || !BK || !BA || !AK) return;
  const sd = BA.sd, lin = BA.lin, mix3 = BA.mix3, TIS = BA.tis, S = sd.smin;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const WHITE = [1, 1, 1], BLACK = [0.012, 0.01, 0.009];
  AK.bodyView = "coat";
  AK.VIEWS = [["coat", "Coat"], ["clear", "Transparent"], ["xray", "See-through"], ["open", "Opened flank"]];

  /* ================= materials for the four views ================= */
  const coatMat = (o) => new (T().MeshPhysicalMaterial)(Object.assign({ vertexColors: true, roughness: 0.82, sheen: 0.45, sheenRoughness: 0.55, sheenColor: new (T().Color)(0xfff0e0) }, o || {}));
  /* coat with a rounded window cut out of the left flank (object space); win = [cx, cy, rx, ry] */
  function windowMat(win, o) {
    const m = coatMat(o);
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uWin = { value: new (T().Vector4)(win[0], win[1], win[2], win[3]) };
      sh.vertexShader = "varying vec3 vOP;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvOP = position;");
      sh.fragmentShader = "varying vec3 vOP;\nuniform vec4 uWin;\n" + sh.fragmentShader
        .replace("void main() {", "void main() {\nvec2 wq = (vOP.xy - uWin.xy) / uWin.zw; float we = pow(abs(wq.x), 3.0) + pow(abs(wq.y), 3.0);\nif (we < 1.0) discard;")
        .replace("#include <color_fragment>", "#include <color_fragment>\nif (we < 1.16) diffuseColor.rgb = vec3(0.62, 0.2, 0.19);");
    };
    m.customProgramCacheKey = () => "akwin" + win.map((v) => v.toFixed(3)).join("_");
    return m;
  }
  const fleshMat = () => new (T().MeshStandardMaterial)({ color: 0x8e3f3c, roughness: 0.75, side: T().BackSide });
  /* dress a list of body meshes for a view. trunk (optional) is the mesh that gets the window; returns extra meshes to add */
  function dress(meshes, view, o) {
    o = o || {}; const T3 = T(), extra = [];
    meshes.forEach((m) => {
      if (view === "xray") { m.material = BA.ghostMat({ dark: o.dark }); m.renderOrder = 20; m.castShadow = false; }
      else if (view === "clear") { m.material = coatMat(Object.assign({ transparent: true, opacity: 0.3, depthWrite: false }, o.mat || {})); m.renderOrder = 20; m.castShadow = false; }
      else if (view === "open" && m === o.trunk) { m.material = windowMat(o.win, o.mat); const inner = new T3.Mesh(m.geometry, fleshMat()); inner.position.copy(m.position); inner.rotation.copy(m.rotation); inner.scale.copy(m.scale); extra.push(inner); m.castShadow = true; }
      else { m.material = coatMat(o.mat); m.castShadow = true; }
    });
    return extra;
  }

  /* ================= organ helpers ================= */
  const tis = (col, o) => BA.mat.tissue(col, o), vt = (o) => BA.mat.vtissue(o);
  const sdfMesh = (key, fn, b, cell, color, mat) => new (T().Mesh)(BA.cached(key, () => BA.mesh(fn, b, cell, color ? { color } : {})), mat);
  const tubeM = (pts, r, mat, o) => BA.tube(BA.curve(pts), r, mat, Object.assign({ seg: Math.max(24, pts.length * 10), rs: 10 }, o || {}));
  const ball = (p, r, mat) => { const m = new (T().Mesh)(new (T().SphereGeometry)(r, 14, 10), mat); m.position.set(p[0], p[1], p[2]); return m; };
  const ellM = (c, r, mat, rz, rx) => { const m = new (T().Mesh)(new (T().SphereGeometry)(1, 28, 18), mat); m.position.set(c[0], c[1], c[2]); m.scale.set(r[0], r[1], r[2]); if (rz) m.rotation.z = rz; if (rx) m.rotation.x = rx; return m; };
  function coils(x0, x1, y0, y1, z0, z1, rows, start, end) { const p = [start]; for (let i = 0; i < rows; i++) { const y = y0 + (y1 - y0) * (i / (rows - 1)), dir = i % 2 ? -1 : 1; for (let j = 0; j <= 4; j++) { const u = dir > 0 ? j / 4 : 1 - j / 4; p.push([x0 + (x1 - x0) * u, y + (y1 - y0) * 0.08 * Math.sin(j * 2.1 + i), z0 + (z1 - z0) * (0.5 + 0.5 * Math.sin(j * 1.7 + i * 2.3))]); } } p.push(end); return p; }
  const haustra = (n) => ({ r: (t) => 1 + 0.22 * Math.pow(Math.abs(Math.sin(t * n * Math.PI)), 0.6) - 0.1 });
  /* organ registry: each maker returns { group, parts:{ id:{ id, name, sys, info, meshes, anchor } } } in its own coordinate frame */
  function reg() { const group = new (T().Group)(), parts = {}; return { group, parts, add(id, name, sys, info, meshes, anchor) { meshes = [].concat(meshes); meshes.forEach((m) => { group.add(m); m.userData.part = id; }); parts[id] = { id, name, sys, info, meshes, anchor: V(anchor[0], anchor[1], anchor[2]) }; } }; }

  /* ---- shared thorax and urinary organs, in "trunk space": the frame of the goat in animal-gut.js
        (body centre (−0.04, 0.665, 0), half-sizes 0.47 × 0.27 × 0.24, head towards +x, left side −z) ---- */
  function addChest(R, o) {
    o = o || {};
    const lungCol = (x, y, z) => mix3(lin(TIS.lung), lin(TIS.lungMottle), sstep(0.4, 0.7, BK.fbm(x * 30, y * 30, z * 30)) * 0.7);
    const lungs = [-1, 1].map((sv) => sdfMesh("aa_lung" + sv, (x, y, z) => sd.smax(S(sd.ell(x, y, z, 0.3, 0.76, sv * 0.075, 0.12, 0.1, 0.06), sd.ell(x, y, z, 0.2, 0.73, sv * 0.08, 0.1, 0.085, 0.055), 0.04), -sd.sph(x, y, z, 0.31, 0.63, 0, 0.085), 0.03), [0.08, 0.6, sv > 0 ? 0 : -0.16, 0.44, 0.88, sv > 0 ? 0.16 : 0], 0.009, lungCol, vt({ roughness: 0.5, clearcoat: 0.3 })));
    R.add("lungs", "Lungs", "resp", "Spongy organs in the chest where oxygen enters the blood and carbon dioxide leaves it.", lungs, [0.33, 0.8, -0.13]);
    R.add("trachea", "Trachea", "resp", "The windpipe, held open by rings of cartilage, carries air to and from the lungs.", tubeM([[0.46, 0.8, 0.0], [0.38, 0.78, 0.0], [0.31, 0.77, 0.0]], 0.014, BA.mat.matte(TIS.cartilage, { roughness: 0.6 }), { seg: 30, r: (t) => 1 + 0.12 * Math.max(0, Math.sin(t * 22 * Math.PI)) }), [0.42, 0.8, -0.02]);
    const heart = sdfMesh("aa_heart", (x, y, z) => S(sd.ell(x, y, z, 0.31, 0.635, 0, 0.055, 0.07, 0.052), sd.cone(x, y, z, 0.31, 0.6, 0, 0.33, 0.545, 0, 0.045, 0.012), 0.03), [0.22, 0.52, -0.08, 0.4, 0.72, 0.08], 0.006, (x, y, z) => mix3(lin(TIS.heart), lin(TIS.heartDeep), sstep(0.62, 0.56, y) * 0.7), vt({ roughness: 0.35, clearcoat: 0.6 }));
    const aorta = tubeM([[0.3, 0.7, 0], [0.24, 0.8, 0], [0.1, 0.86, 0.0], [-0.2, 0.875, 0.0], [-0.42, 0.85, 0.0]], 0.012, BA.mat.vessel(TIS.arteryBright), { seg: 50, rs: 8 });
    R.add("heart", "Heart", "circ", "A muscular pump with four chambers. It drives blood to the lungs and round the body.", heart, [0.31, 0.62, -0.06]);
    R.add("aorta", "Aorta", "circ", "The main artery. It runs back under the spine and branches to every organ.", aorta, [-0.1, 0.875, -0.01]);
    const kp = o.kidneys || [[-0.25, 0.855, 0.035], [-0.16, 0.86, 0.11]];
    const kid = kp.map((q) => { const m = ellM(q, [0.04, 0.024, 0.028], tis(TIS.kidney, { roughness: 0.3, clearcoat: 0.6 })); return m; });
    R.add("kidneys", "Kidneys", "excr", "Filter urea and excess salts from the blood to make urine.", kid, [kp[1][0], kp[1][1] + 0.02, kp[1][2]]);
    const bl = ellM(o.bladder || [-0.44, 0.6, 0.0], [0.05, 0.036, 0.036], tis(TIS.bladder, { roughness: 0.4, clearcoat: 0.4 }));
    const ur = kp.map((q) => tubeM([q, [q[0] - 0.1, q[1] - 0.08, q[2] * 0.6], (o.bladder || [-0.44, 0.6, 0.0])], 0.005, tis(0xe8d9a8), { seg: 20, rs: 6 }));
    R.add("bladder", "Bladder and ureters", "excr", "The ureters carry urine from the kidneys to the bladder, where it is stored.", [bl].concat(ur), [(o.bladder || [-0.44])[0], 0.6, -0.04]);
  }
  /* reproductive tract in trunk space: female (ovaries, oviducts, two-horned uterus, vagina) or male (testes, sperm ducts, glands, penis) */
  function addRepro(R, male) {
    if (male) {
      const tes = [-1, 1].map((sv) => ellM([-0.32, 0.325, sv * 0.03], [0.034, 0.056, 0.028], tis(0xe8d2c4, { roughness: 0.35, clearcoat: 0.5 })));
      R.add("testes", "Testes (in the scrotum)", "repro", "Make sperm and the hormone testosterone. They hang outside the body in the scrotum because sperm form best a few degrees below body temperature.", tes, [-0.32, 0.31, -0.06]);
      const vas = [-1, 1].map((sv) => tubeM([[-0.32, 0.38, sv * 0.03], [-0.36, 0.5, sv * 0.05], [-0.42, 0.6, sv * 0.05], [-0.47, 0.655, sv * 0.02]], 0.006, tis(0xf0e0d0), { seg: 30, rs: 6 }));
      const ep = [-1, 1].map((sv) => tubeM([[-0.345, 0.37, sv * 0.03], [-0.352, 0.32, sv * 0.03], [-0.34, 0.275, sv * 0.03]], 0.009, tis(0xd9b8a8), { seg: 12, rs: 6 }));
      R.add("vas", "Epididymis and sperm ducts", "repro", "Sperm mature and are stored in the epididymis, then travel up the sperm duct (vas deferens) to the urethra.", vas.concat(ep), [-0.4, 0.57, -0.07]);
      R.add("glands", "Accessory glands", "repro", "Seminal vesicles, prostate and Cowper's glands add fluid to the sperm to make semen.", [-1, 1].map((sv) => ellM([-0.485, 0.665, sv * 0.03], [0.03, 0.014, 0.014], tis(TIS.gland, { roughness: 0.5 }), 0.3)).concat([ball([-0.5, 0.64, 0], 0.016, tis(0xd9a04a))]), [-0.485, 0.68, -0.05]);
      R.add("penis", "Penis and urethra", "repro", "Carries semen (and urine) out. The S-shaped bend, the sigmoid flexure, straightens at mating.", tubeM([[-0.5, 0.63, 0], [-0.515, 0.55, 0], [-0.47, 0.47, 0], [-0.4, 0.455, 0], [-0.36, 0.42, 0], [-0.4, 0.4, 0], [-0.3, 0.405, 0], [-0.12, 0.405, 0], [0.0, 0.41, 0]], 0.011, tis(0xe0a8a0, { roughness: 0.4 }), { seg: 80, rs: 8 }), [-0.15, 0.4, -0.02]);
    } else {
      const horns = [-1, 1].map((sv) => tubeM([[-0.405, 0.715, sv * 0.012], [-0.34, 0.705, sv * 0.05], [-0.295, 0.665, sv * 0.072], [-0.31, 0.625, sv * 0.062], [-0.345, 0.635, sv * 0.045]], 0.017, tis(TIS.uterus, { roughness: 0.4, clearcoat: 0.5 }), { seg: 50, rs: 8, r: (t) => 1.15 - 0.6 * t }));
      const bodyU = tubeM([[-0.455, 0.725, 0], [-0.43, 0.72, 0], [-0.4, 0.715, 0]], 0.024, tis(TIS.uterus, { roughness: 0.4, clearcoat: 0.5 }), { seg: 12, rs: 10 });
      R.add("uterus", "Uterus (womb)", "repro", "A short body and two long horns. The fertilised egg implants in a horn and the foetus grows there, fed through the placenta.", horns.concat([bodyU]), [-0.3, 0.665, -0.09]);
      const ov = [-1, 1].map((sv) => ellM([-0.375, 0.665, sv * 0.085], [0.017, 0.013, 0.012], tis(TIS.ovary, { roughness: 0.4, clearcoat: 0.5 })));
      const ovd = [-1, 1].map((sv) => tubeM([[-0.345, 0.635, sv * 0.045], [-0.35, 0.645, sv * 0.07], [-0.37, 0.66, sv * 0.08]], 0.004, tis(0xf2c8c0), { seg: 12, rs: 5 }));
      R.add("ovaries", "Ovaries and oviducts", "repro", "The ovaries release eggs (ova) and make oestrogen and progesterone. Fertilisation takes place in the oviduct (Fallopian tube).", ov.concat(ovd), [-0.375, 0.675, -0.1]);
      R.add("vagina", "Cervix, vagina and vulva", "repro", "The cervix closes the womb during pregnancy. The vagina receives semen at mating and is the birth canal; it opens at the vulva.", [tubeM([[-0.455, 0.725, 0], [-0.52, 0.74, 0], [-0.575, 0.745, 0]], 0.019, tis(0xdc8f8a, { roughness: 0.4 }), { seg: 16, rs: 10 }), ball([-0.455, 0.725, 0], 0.024, tis(0xc97a78))], [-0.52, 0.745, -0.03]);
    }
  }
  /* ruminant: the goat's four-chambered stomach and gut from animal-gut.js, plus chest and urinary organs */
  function ruminantOrgans() {
    const R = reg(), G = window.AGUT.goatOrgans({ trunk: true });
    Object.values(G.parts).forEach((p) => R.add(p.id, p.name, "dig", p.info, p.meshes, [p.anchor.x, p.anchor.y, p.anchor.z]));
    Object.values(R.parts).forEach((p) => { p.short = G.parts[p.id] && G.parts[p.id].short; });
    addChest(R); return R;
  }
  /* pig: simple stomach, long small intestine, spiral colon */
  function pigOrgans() {
    const R = reg();
    const GUL = [[0.44, 0.775, -0.02], [0.3, 0.75, -0.025], [0.21, 0.72, -0.04]];
    R.add("gullet", "Oesophagus", "dig", "Carries swallowed food to the stomach by peristalsis.", tubeM(GUL, 0.016, tis(TIS.gullet)), [0.32, 0.76, -0.04]);
    const STO = [[0.21, 0.72, -0.04, 0.026], [0.15, 0.69, -0.07, 0.075], [0.11, 0.61, -0.065, 0.085], [0.14, 0.55, -0.01, 0.06], [0.19, 0.555, 0.05, 0.03]];
    R.add("stomach", "Stomach (simple)", "dig", "One chamber. Gastric juice with hydrochloric acid and pepsin begins protein digestion. The pig is a non-ruminant.", sdfMesh("aa_p_sto", sd.chain(STO, 0.03), [0, 0.46, -0.17, 0.26, 0.78, 0.1], 0.008, (x, y, z) => mix3(lin(TIS.stomach), lin(0xd98c84), sstep(0.45, 0.7, BK.fbm(x * 18, y * 18, z * 18)) * 0.6), vt({ roughness: 0.36, clearcoat: 0.5 })), [0.12, 0.62, -0.15]);
    R.add("liver", "Liver", "dig", "Makes bile, stores glycogen and vitamins, and removes poisons from the blood.", ellM([0.25, 0.67, 0.02], [0.04, 0.13, 0.15], tis(TIS.liver, { roughness: 0.2, clearcoat: 0.8 }), -0.2), [0.265, 0.72, -0.1]);
    const SI = coils(-0.2, 0.08, 0.5, 0.6, 0.03, 0.17, 5, [0.19, 0.555, 0.05], [-0.22, 0.64, 0.05]);
    R.add("smallInt", "Small intestine", "dig", "About 18 m long in a grown pig. Enzymes finish digestion and villi absorb the products.", tubeM(SI, 0.014, tis(TIS.smallInt, { roughness: 0.33, clearcoat: 0.55 }), { seg: 420 }), [-0.06, 0.55, 0.185]);
    const CAE = [[-0.22, 0.64, 0.05], [-0.3, 0.6, -0.04], [-0.37, 0.55, -0.09]];
    R.add("caecum", "Caecum", "dig", "A blind sac where some fibre is fermented by microbes.", [tubeM(CAE, 0.036, tis(TIS.largeInt), haustra(8)), ball(CAE[2], 0.034, tis(TIS.largeInt))], [-0.33, 0.58, -0.11]);
    const SP = [[-0.22, 0.64, 0.05]]; for (let i = 0; i <= 60; i++) { const u = i / 60, a = u * 3.4 * 2 * Math.PI, r = 0.105 * (1 - u * 0.55); SP.push([-0.1 + r * Math.cos(a), 0.79 - u * 0.2, -0.09 + r * Math.sin(a) * 0.75]); } SP.push([-0.22, 0.8, -0.02], [-0.34, 0.83, 0.0]);
    R.add("colon", "Large intestine (spiral colon)", "dig", "Coiled in a cone on the left side. Absorbs water and forms the faeces.", tubeM(SP, 0.024, tis(TIS.largeInt, { roughness: 0.4, clearcoat: 0.45 }), Object.assign({ seg: 420, rs: 10 }, haustra(46))), [-0.1, 0.72, -0.2]);
    const REC = [[-0.34, 0.83, 0.0], [-0.44, 0.83, 0], [-0.515, 0.8, 0]];
    R.add("rectum", "Rectum and anus", "dig", "Stores faeces before they are passed out.", [tubeM(REC, 0.022, tis(0xc9685e)), ball(REC[2], 0.024, tis(0x8a3b3a))], [-0.46, 0.84, -0.02]);
    addChest(R, { kidneys: [[-0.2, 0.855, -0.075], [-0.2, 0.855, 0.075]] }); return R;
  }
  /* rabbit: a hind-gut fermenter with a very large caecum */
  function rabbitOrgans() {
    const R = reg();
    R.add("gullet", "Oesophagus", "dig", "Carries chewed food to the stomach.", tubeM([[0.44, 0.775, -0.02], [0.3, 0.75, -0.025], [0.22, 0.72, -0.04]], 0.016, tis(TIS.gullet)), [0.32, 0.76, -0.04]);
    const STO = [[0.22, 0.72, -0.04, 0.026], [0.16, 0.69, -0.07, 0.07], [0.13, 0.62, -0.06, 0.075], [0.17, 0.57, 0.0, 0.05], [0.21, 0.58, 0.05, 0.026]];
    R.add("stomach", "Stomach (simple)", "dig", "One chamber, never empty in a healthy rabbit. Acid and pepsin begin digestion.", sdfMesh("aa_r_sto", sd.chain(STO, 0.03), [0.02, 0.48, -0.16, 0.28, 0.78, 0.1], 0.008, null, tis(TIS.stomach, { roughness: 0.36, clearcoat: 0.5 })), [0.14, 0.64, -0.14]);
    R.add("liver", "Liver", "dig", "Makes bile and processes absorbed food.", ellM([0.26, 0.67, 0.02], [0.04, 0.12, 0.14], tis(TIS.liver, { roughness: 0.2, clearcoat: 0.8 }), -0.2), [0.275, 0.72, -0.1]);
    const SI = coils(-0.05, 0.12, 0.72, 0.8, -0.1, 0.12, 3, [0.21, 0.58, 0.05], [-0.1, 0.7, 0.1]);
    R.add("smallInt", "Small intestine", "dig", "Digestion is completed and soluble food is absorbed.", tubeM(SI, 0.013, tis(TIS.smallInt, { roughness: 0.33, clearcoat: 0.55 }), { seg: 300 }), [0.04, 0.78, -0.12]);
    const CAE = [[-0.1, 0.7, 0.1]]; for (let i = 0; i <= 40; i++) { const u = i / 40, a = u * 1.6 * 2 * Math.PI + 1; CAE.push([-0.08 + 0.17 * Math.cos(a) * (1 - u * 0.35), 0.585 - u * 0.05 + 0.03 * Math.sin(a * 2), 0.02 + 0.14 * Math.sin(a) * (1 - u * 0.35)]); }
    R.add("caecum", "Caecum (very large)", "dig", "The biggest organ of the gut. Bacteria ferment cellulose here. Soft pellets from it are eaten again (coprophagy) so the nutrients can be absorbed.", [tubeM(CAE, 0.05, tis(0xa9836a, { roughness: 0.45, clearcoat: 0.4 }), Object.assign({ seg: 300, rs: 12 }, { r: (t) => (1 + 0.16 * Math.pow(Math.abs(Math.sin(t * 30 * Math.PI)), 0.6)) * (1 - 0.5 * sstep(0.8, 1, t)) })), ball(CAE[0], 0.045, tis(0xa9836a))], [-0.1, 0.56, -0.19]);
    const COL = [[-0.1, 0.7, 0.1], [-0.2, 0.74, 0.12], [-0.3, 0.72, 0.06], [-0.26, 0.78, -0.06], [-0.34, 0.82, 0.0]];
    R.add("colon", "Large intestine", "dig", "Absorbs water and forms the hard, dry pellets.", tubeM(COL, 0.022, tis(TIS.largeInt, { roughness: 0.4, clearcoat: 0.45 }), Object.assign({ seg: 120 }, haustra(20))), [-0.27, 0.76, -0.09]);
    const REC = [[-0.34, 0.82, 0.0], [-0.44, 0.81, 0], [-0.51, 0.78, 0]];
    R.add("rectum", "Rectum and anus", "dig", "Passes out faecal pellets.", [tubeM(REC, 0.02, tis(0xc9685e)), ball(REC[2], 0.022, tis(0x8a3b3a))], [-0.46, 0.82, -0.02]);
    addChest(R, { kidneys: [[-0.22, 0.86, -0.07], [-0.2, 0.86, 0.07]] }); return R;
  }
  const ISMALE = (breed) => breed === "bull";
  const TRUNK_ORGANS = { cow: ruminantOrgans, goat: ruminantOrgans, sheep: ruminantOrgans, pig: pigOrgans, rabbit: rabbitOrgans };

  /* ================= quadrupeds ================= */
  const KIND = {
    cow: { nl: 0.2, na: 0.5, hs: 0.15, fa: 0.55, fl: 1.55, belly: 0.12, neckR: 0.4 },
    goat: { nl: 0.27, na: 0.9, hs: 0.15, fa: 0.5, fl: 1.4, belly: 0.14, neckR: 0.34 },
    sheep: { nl: 0.2, na: 0.75, hs: 0.145, fa: 0.6, fl: 1.35, belly: 0.14, neckR: 0.38 },
    pig: { nl: 0.07, na: 0.1, hs: 0.11, fa: 0.2, fl: 1.5, belly: 0.24, neckR: 0.5 },
    rabbit: { nl: 0.06, na: 0.45, hs: 0.2, fa: 0.3, fl: 0.95, belly: 0.1, neckR: 0.42 },
  };
  function dims(B) {
    const K = KIND[B.kind] || KIND.cow, L = B.L, H = B.H, W = B.W, leg = B.leg, a = L / 2, b = H / 2, c = W / 2, cy = leg + H * 0.45;
    const P0 = [L * 0.42, leg + H * 0.7, 0], hs = B.kind === "pig" ? W * 0.42 : B.kind === "rabbit" ? W * 0.5 : L * K.hs, nl = L * K.nl;
    const hx = nl * Math.cos(K.na), hy = nl * Math.sin(K.na), fx = hx + hs * K.fl * Math.cos(K.fa), fy = hy - hs * K.fl * Math.sin(K.fa);
    return { K, L, H, W, leg, a, b, c, cy, P0, hs, nl, hx, hy, fx, fy, legTop: leg + H * 0.15, lx: L * 0.32, lz: W * 0.28, hoof: Math.max(0.012, leg * 0.085) };
  }
  function trunkSDF(B, D) {
    const { a, b, c, cy, H, W, K } = D, k = H * 0.16, wool = B.coat && B.coat.wool, rab = B.kind === "rabbit", pig = B.kind === "pig";
    return (x, y, z) => {
      const az = Math.abs(z);
      let d = sd.ell(x, y, z, 0, cy, 0, a * 0.92, b, c);
      d = S(d, sd.ell(x, y, z, -a * 0.05, cy - b * 0.2, 0, a * 0.72, b * (0.9 + K.belly), c * 1.06), k);
      d = S(d, sd.ell(x, y, z, a * 0.62, cy + b * (rab ? -0.05 : 0.1), 0, a * 0.36, b * (pig ? 1.0 : 1.02), c * (pig ? 0.95 : 0.86)), k);
      d = S(d, sd.ell(x, y, z, -a * 0.66, cy + b * (rab ? 0.28 : 0.12), 0, a * 0.38, b * (rab ? 1.12 : 0.95), c * (rab ? 1.05 : 0.95)), k);
      d = S(d, sd.ell(x, y, z, a * 0.84, cy - b * 0.28, 0, a * 0.22, b * 0.62, c * 0.6), k);                       // brisket
      d = S(d, sd.ell(x, y, az, -a * 0.62, cy - b * 0.38, c * 0.5, a * 0.3, b * 0.85, c * 0.42), k * 0.7);         // thighs
      d = S(d, sd.ell(x, y, az, a * 0.62, cy - b * 0.42, c * 0.5, a * 0.2, b * 0.7, c * 0.34), k * 0.7);           // shoulders
      d = S(d, sd.cone(x, y, z, a * 0.7, cy + b * 0.3, 0, D.P0[0] + D.nl * 0.3 * Math.cos(K.na), D.P0[1] + D.nl * 0.3 * Math.sin(K.na), 0, H * K.neckR * 1.05, H * K.neckR * 0.8), k);   // neck root
      if (B.hump) d = S(d, sd.ell(x, y, z, a * 0.56, cy + b * 1.02, 0, a * 0.2, b * 0.8 * B.hump, c * 0.42), k * 0.8);
      if (B.dewlap) d = S(d, sd.ell(x, y, z, a * 0.95, cy - b * 0.72, 0, a * 0.26, b * 0.6, c * 0.15), k * 0.6);
      if (B.udder) { d = S(d, sd.ell(x, y, z, -a * 0.5, cy - b * 1.08, 0, a * 0.22, b * 0.36, c * 0.52), k * 0.5); d = S(d, sd.cone(Math.abs(x + a * 0.5), y, az, a * 0.09, cy - b * 1.3, c * 0.2, a * 0.09, cy - b * 1.62, c * 0.2, W * 0.035, W * 0.022), W * 0.03); }
      if (pig) d = S(d, sd.ell(x, y, az, -a * 0.1, cy - b * 1.02, c * 0.3, a * 0.5, b * 0.14, c * 0.12), k * 0.4);  // line of teats
      if (B.male) d = S(d, sd.ell(x, y, z, -a * 0.56, cy - b * 1.26, 0, a * 0.1, b * 0.36, c * 0.26), k * 0.45);         // scrotum
      if (wool) d -= W * 0.035 + (BK.fbm(x * 9 / W * 0.4, y * 9 / W * 0.4, z * 9 / W * 0.4) - 0.5) * W * 0.16;
      return d;
    };
  }
  function legSDF(B, D, hind) {
    const { W, L, hoof } = D, ln = D.legTop, pig = B.kind === "pig", rab = B.kind === "rabbit", r0 = W * (pig ? 0.21 : 0.19), r1 = W * (pig ? 0.13 : 0.11), r2 = W * (pig ? 0.1 : 0.082), wool = B.coat && B.coat.wool;
    return (x, y, z) => {
      let d;
      if (rab) { d = sd.cone(x, y, z, 0, 0, 0, 0, -ln + hoof, 0, r0 * 1.2, r1 * 1.2); d = S(d, sd.ell(x, y, z, hind ? L * 0.1 : L * 0.04, -ln + hoof, 0, hind ? L * 0.2 : L * 0.08, hoof * 1.1, r1 * 1.3), 0.01); return d; }
      if (hind) { d = sd.cone(x, y, z, 0, 0, 0, L * 0.035, -ln * 0.42, 0, r0 * 1.3, r1 * 1.15); d = S(d, sd.cone(x, y, z, L * 0.035, -ln * 0.42, 0, -L * 0.035, -ln * 0.63, 0, r1 * 1.15, r2 * 1.1), W * 0.05); d = S(d, sd.cone(x, y, z, -L * 0.035, -ln * 0.63, 0, -L * 0.01, -ln + hoof, 0, r2 * 1.05, r2), W * 0.04); d = S(d, sd.ell(x, y, z, 0, -ln + hoof * 0.55, 0, r2 * 1.7, hoof * 0.62, r2 * 1.35), W * 0.02); }
      else { d = sd.cone(x, y, z, 0, 0, 0, L * 0.012, -ln * 0.5, 0, r0, r1); d = S(d, sd.sph(x, y, z, L * 0.012, -ln * 0.5, 0, r1 * 1.08), W * 0.03); d = S(d, sd.cone(x, y, z, L * 0.012, -ln * 0.5, 0, 0, -ln + hoof, 0, r1 * 0.9, r2), W * 0.04); d = S(d, sd.ell(x, y, z, L * 0.01, -ln + hoof * 0.55, 0, r2 * 1.7, hoof * 0.62, r2 * 1.35), W * 0.02); }
      if (wool) d -= sstep(-ln * 0.45, -ln * 0.2, y) * W * 0.03;
      return d;
    };
  }
  function headSDF(B, D) {
    const { K, H, L, W, hs, hx, hy, fx, fy } = D, pig = B.kind === "pig", rab = B.kind === "rabbit", nr = H * K.neckR, ear = B.ear || "side", wool = B.coat && B.coat.wool;
    return (x, y, z) => {
      const az = Math.abs(z);
      let d = sd.cone(x, y, z, -L * 0.07, -H * 0.12, 0, hx, hy, 0, nr, hs * 0.66);
      if (wool) d -= W * 0.03 * sstep(hx - hs * 0.2, hx - hs * 0.9, x);
      d = S(d, sd.ell(x, y, z, hx, hy, 0, hs * 0.86, hs * 0.74, hs * 0.64), hs * 0.25);
      d = S(d, sd.cone(x, y, z, hx, hy - hs * 0.05, 0, fx, fy, 0, hs * 0.6, hs * (pig ? 0.36 : rab ? 0.34 : 0.33)), hs * 0.2);
      if (pig) d = S(d, sd.ell(x, y, z, fx + hs * 0.08, fy, 0, hs * 0.1, hs * 0.33, hs * 0.36), hs * 0.06);
      else d = S(d, sd.ell(x, y, z, fx, fy - hs * 0.03, 0, hs * 0.3, hs * 0.3, hs * (B.kind === "cow" ? 0.4 : 0.3)), hs * 0.15);
      d = S(d, sd.ell(x, y, az, hx + hs * 0.25, hy + hs * 0.3, hs * 0.42, hs * 0.22, hs * 0.16, hs * 0.14), hs * 0.1);           // brow
      d = S(d, sd.ell(x, y, az, hx + hs * 0.2, hy - hs * 0.42, hs * 0.3, hs * 0.5, hs * 0.26, hs * 0.2), hs * 0.12);            // jaw
      const ex = hx - hs * 0.42, ey = hy + hs * 0.42, ez = hs * 0.5;
      if (ear === "rabbit") d = S(d, sd.smax(sd.cone(x, y, az, ex + hs * 0.1, ey, hs * 0.3, ex - hs * 0.5, ey + hs * 2.3, hs * 0.42, hs * 0.24, hs * 0.16), Math.abs(az - hs * 0.36 - (y - ey) * 0.05) - hs * 0.1, hs * 0.05), hs * 0.06);
      else if (ear === "pig") d = S(d, sd.cone(x, y, az, ex + hs * 0.2, ey, ez, ex + hs * 1.0, ey + hs * 0.55, ez + hs * 0.35, hs * 0.26, hs * 0.07), hs * 0.08);
      else if (ear === "droop") d = S(d, sd.cone(x, y, az, ex, ey - hs * 0.1, ez, ex - hs * 0.15, ey - hs * 0.95, ez + hs * 0.55, hs * 0.17, hs * 0.1), hs * 0.06);
      else d = S(d, sd.cone(x, y, az, ex, ey - hs * 0.05, ez, ex - hs * 0.2, ey + hs * 0.05, ez + hs * 0.95, hs * 0.16, hs * 0.07), hs * 0.06);
      if (B.beard) d = S(d, sd.cone(x, y, z, fx - hs * 0.25, fy - hs * 0.3, 0, fx - hs * 0.4, fy - hs * 1.05, 0, hs * 0.15, hs * 0.03), hs * 0.08);
      return d;
    };
  }
  /* coat colour at a point in animal coordinates; part = "trunk" | "leg" | "head" (head gets local head coordinates too) */
  function coatFn(B, D, breed) {
    const co = B.coat || {}, base = lin(co.col), patch = co.patch != null ? lin(co.patch) : null, front = co.front != null ? lin(co.front) : null, face = B.face != null ? lin(B.face) : null;
    const dark = mix3(base, BLACK, 0.55), seed = co.seed || 1, f = 2.6 / D.L, pig = B.kind === "pig", hoofC = lin(pig ? 0x8a6a5a : 0x1e1a18), pink = lin(0xe8a8a0), muz = lin(pig ? 0xd88a88 : 0x2a2220);
    return (x, y, z, ny, part, lx, ly, lz) => {
      const n = BK.fbm(x * f + seed * 3.1, y * f + seed, z * f + seed * 1.7);
      let c = base;
      if (patch) c = mix3(c, patch, sstep(0.585, 0.61, n));
      if (front) c = mix3(c, front, sstep(-0.03, 0.03, x / D.L - (0.5 - co.split) + (n - 0.5) * 0.25));
      if (breed === "holstein") { const nb = BK.fbm(x * f * 1.0 + 5.3, y * f * 1.0 + 2.1, z * f * 1.0 + 1.9); c = mix3(base, lin(0x0b0b0b), sstep(0.475, 0.5, nb)); if (part === "leg") c = mix3(c, base, sstep(D.leg * 0.8, D.leg * 0.55, y)); }   // bold black-and-white blocks, white stockings
      if (breed === "wad") { const nb = BK.fbm(x * f * 0.62 + 7.7, y * f * 0.62 + 0.4, z * f * 0.62 + 1.3); c = mix3(lin(0x2b211a), lin(0xefe6da), sstep(0.535, 0.565, nb)); c = mix3(c, lin(0x6a4428), sstep(0.3, 0.42, nb) * (1 - sstep(0.42, 0.5, nb)) * 0.55); if (part === "trunk") c = mix3(c, lin(0x120e0c), (1 - sstep(D.c * 0.1, D.c * 0.32, Math.abs(z))) * sstep(0.55, 0.85, ny) * 0.9); }   // pied dwarf goat with a dark line along the back
      if (!co.wool) c = mix3(c, mix3(c, WHITE, 0.5), sstep(-0.35, -0.9, ny) * (part === "trunk" ? 0.5 : 0.15));          // paler underside
      c = mix3(c, mix3(c, BLACK, 0.25), sstep(0.47, 0.6, BK.fbm(x * f * 6, y * f * 6, z * f * 6)) * 0.25);                  // soft hair shading
      if (breed === "ndama") c = mix3(c, dark, sstep(D.leg * 0.6, D.leg * 0.2, y) * 0.45);
      if (part === "leg") {
        if ((B.kind === "sheep" || breed === "uda") && face) c = mix3(c, face, sstep(D.leg * 0.75, D.leg * 0.55, y));
        if (breed === "wad") c = mix3(c, lin(0x1a1614), sstep(D.leg * 0.7, D.leg * 0.4, y) * 0.8);
        if (y < D.hoof * 1.25 && B.kind !== "rabbit") c = hoofC;
      }
      if (part === "trunk" && B.udder && y < D.cy - D.b * 0.95 && x < -D.a * 0.2 && x > -D.a * 0.8 && Math.abs(z) < D.c * 0.6) c = pink;
      if (part === "head") {
        const t = sstep(D.hx - D.hs * 1.1, D.hx - D.hs * 0.3, lx), az = Math.abs(lz);
        if (face) c = mix3(c, face, t);
        if (breed === "yankasa") { c = mix3(base, WHITE, 0.2); const eye = Math.hypot(lx - (D.hx + D.hs * 0.35), ly - (D.hy + D.hs * 0.18), az - D.hs * 0.5); c = mix3(c, BLACK, Math.max(1 - sstep(D.hs * 0.3, D.hs * 0.42, eye), sstep(D.hs * 0.72, D.hs * 0.8, az), sstep(D.fx - D.hs * 0.45, D.fx - D.hs * 0.2, lx))); }
        if (breed === "whitefulani") c = mix3(c, BLACK, Math.max(sstep(D.hs * 0.74, D.hs * 0.84, az) * sstep(D.hy + D.hs * 0.9, D.hy + D.hs * 0.2, ly), 0));
        if (breed === "holstein") c = mix3(c, WHITE, (1 - sstep(D.hs * 0.12, D.hs * 0.2, az)) * sstep(D.hx - D.hs * 0.2, D.hx + D.hs * 0.3, lx));     // white blaze
        if (B.kind === "rabbit" || pig) { const inEar = sstep(D.hy + D.hs * 0.7, D.hy + D.hs * 1.0, ly); c = mix3(c, pink, inEar * 0.35); }
        if (B.kind !== "rabbit") c = mix3(c, muz, sstep(D.fx - D.hs * (pig ? 0.02 : 0.08), D.fx + D.hs * (pig ? 0.06 : 0.1), lx) * (ly < D.fy + D.hs * 0.34 ? 1 : 0));
        else c = mix3(c, pink, sstep(D.fx + D.hs * 0.12, D.fx + D.hs * 0.24, lx));
      }
      return c;
    };
  }
  const HORN = {
    lyre: (t, hl, sv) => [-0.2 * t * hl, t * hl * 0.9, sv * (0.35 * Math.sin(t * 2.2) * hl + 0.05 * t)],
    back: (t, hl, sv) => [-t * hl, t * hl * 0.6 - t * t * hl * 0.3, sv * t * 0.03],
    curl: (t, hl, sv) => { const a = t * 4; return [-Math.sin(a) * hl * 0.5, (1 - Math.cos(a)) * hl * 0.3 - t * hl * 0.2, sv * (0.02 + t * hl * 0.55)]; },
    short: (t, hl, sv) => [0.02 * t, t * hl, sv * t * hl * 0.5],
  };
  const BKEY = (breed, B) => breed + "_" + [B.L, B.H, B.W, B.leg].join("_");
  /* build one animal. Returns a Group with .legs, .head, .tail (for AK.animate), .parts (organs, when shown) and .dims */
  function quad(breed, o) {
    o = o || {};
    const T3 = T(), Q = AK.BREEDS, B0 = Q[breed] || Q.cow, B = Object.assign({}, B0, o.coat ? { coat: Object.assign({}, B0.coat, o.coat) } : {}, { male: ISMALE(breed) }), D = dims(B), view = o.view || AK.bodyView || "coat";
    const key = BKEY(breed, B) + (o.coat ? JSON.stringify(o.coat) : ""), col = coatFn(B, D, breed), cell = Math.max(0.006, Math.min(B.L / 70, B.H / 24)), g = new T3.Group(), skinMeshes = [];
    const pigMat = B.kind === "pig" ? { roughness: 0.6, sheen: 0.25 } : B.coat && B.coat.wool ? { roughness: 1, sheen: 0.8 } : null;
    /* trunk */
    const tg = BA.cached("aq_t_" + key, () => BA.mesh(trunkSDF(B, D), [-D.a * 1.25, D.cy - D.b * 2.1, -D.c * 1.5, D.a * 1.3, D.cy + D.b * 2.2 + (B.hump ? D.b : 0), D.c * 1.5], cell, { color: (x, y, z, nx, ny) => col(x, y, z, ny, "trunk") }));
    const trunk = new T3.Mesh(tg); g.add(trunk); skinMeshes.push(trunk);
    /* legs */
    g.legs = [];
    [[D.lx, D.lz, 0], [D.lx, -D.lz, 0], [-D.lx, D.lz, 1], [-D.lx, -D.lz, 1]].forEach(([x, z, hind]) => {
      const pv = new T3.Group(); pv.position.set(x, D.legTop, z);
      const lg = BA.cached("aq_l" + hind + (z > 0 ? "p" : "m") + key, () => BA.mesh(legSDF(B, D, hind), [-Math.max(B.L * 0.14, B.W * 0.42), -D.legTop - 0.01, -B.W * 0.34, Math.max(B.L * (B.kind === "rabbit" ? 0.34 : 0.14), B.W * 0.42), B.W * 0.34, B.W * 0.34], Math.max(0.004, cell * 0.62), { color: (lx, ly, lz2, nx, ny) => col(lx + x, ly + D.legTop, lz2 + z, ny, "leg") }));
      const m = new T3.Mesh(lg); pv.add(m); skinMeshes.push(m); g.add(pv); g.legs.push(pv);
    });
    /* head and neck */
    const hp = new T3.Group(); hp.position.set(D.P0[0], D.P0[1], 0); g.add(hp); g.head = hp;
    const hgeo = BA.cached("aq_h_" + key, () => BA.mesh(headSDF(B, D), [-B.L * 0.07 - B.H * D.K.neckR * 1.2, Math.min(D.fy - D.hs * 1.3, -B.H * (0.14 + D.K.neckR * 1.2)), -Math.max(D.hs * 1.7, B.H * D.K.neckR * 1.2), D.fx + D.hs * 0.6, D.hy + D.hs * (B.ear === "rabbit" ? 3.0 : 1.5), Math.max(D.hs * 1.7, B.H * D.K.neckR * 1.2)], Math.max(0.004, cell * 0.6), { color: (lx, ly, lz, nx, ny) => col(lx + D.P0[0], ly + D.P0[1], lz, ny, "head", lx, ly, lz) }));
    const head = new T3.Mesh(hgeo); hp.add(head); skinMeshes.push(head);
    const solid = view === "coat" || view === "open", eyeM = new T3.MeshPhysicalMaterial({ color: B.kind === "goat" ? 0xb8922e : 0x1a120c, roughness: 0.08, clearcoat: 1 });
    if (solid) for (const sv of [-1, 1]) {
      const e = new T3.Mesh(new T3.SphereGeometry(D.hs * 0.09, 12, 8), eyeM); e.position.set(D.hx + D.hs * 0.36, D.hy + D.hs * 0.2, sv * D.hs * 0.56); hp.add(e);
      if (B.kind === "pig") { const nn = new T3.Mesh(new T3.SphereGeometry(D.hs * 0.05, 8, 6), new T3.MeshBasicMaterial({ color: 0x5a2a2a })); nn.position.set(D.fx + D.hs * 0.185, D.fy + D.hs * 0.02, sv * D.hs * 0.12); nn.scale.x = 0.4; hp.add(nn); }
    }
    if (B.horn && B.horn !== "none" && HORN[B.horn]) {
      const hm = view === "xray" ? BA.ghostMat({ dark: o.dark }) : new T3.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.45, clearcoat: 0.35, transparent: view === "clear", opacity: view === "clear" ? 0.35 : 1 }), hl = B.hl || 0.2, c0 = lin(0xd9cdb2), c1 = lin(0x3a3028);
      for (const sv of [-1, 1]) { const pts = []; for (let i = 0; i <= 10; i++) { const q = HORN[B.horn](i / 10, hl, sv); pts.push(V(q[0], q[1], q[2])); } const hn = BA.tube(BA.curve(pts), D.hs * 0.12, hm, { seg: 24, rs: 8, r: (t) => 1 - 0.82 * t, color: (t) => mix3(c0, c1, sstep(0.55, 0.95, t)) }); hn.position.set(D.hx - D.hs * 0.15, D.hy + D.hs * 0.55, sv * D.hs * 0.3); hn.castShadow = view === "coat"; hp.add(hn); }
    }
    /* tail */
    const tp = new T3.Group(); tp.position.set(-B.L * 0.5, B.leg + B.H * 0.75, 0); g.add(tp); g.tail = tp;
    const tailCol = (t) => (B.kind === "cow" && t > 0.78 ? BLACK : col(-B.L * 0.5, B.leg + B.H * 0.5, 0, 0, "trunk")), tm = new T3.Mesh(undefined);
    if (B.kind === "pig") { const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push(V(-t * 0.09, Math.sin(t * 9) * 0.035, Math.cos(t * 9) * 0.035)); } tm.geometry = BA.tube(BA.curve(pts), 0.011, null, { seg: 40, rs: 6, r: (t) => 1 - 0.6 * t, color: tailCol }).geometry; }
    else if (B.kind === "rabbit") { tm.geometry = new T3.SphereGeometry(B.W * 0.2, 12, 8); const n = tm.geometry.attributes.position.count, ca = new Float32Array(n * 3).fill(0.95); tm.geometry.setAttribute("color", new T3.BufferAttribute(ca, 3)); tm.position.x = -0.02; }
    else { const cow = B.kind === "cow", tl = cow ? B.leg * 1.0 : B.kind === "sheep" ? B.leg * 0.75 : B.leg * 0.4; tm.geometry = BA.tube(BA.curve([[0, 0, 0], [-tl * 0.12, -tl * 0.4, 0], [-tl * 0.1, -tl, 0]]), B.W * 0.045, null, { seg: 24, rs: 8, r: (t) => (cow ? (t > 0.75 ? 0.5 + 2.2 * Math.sin((t - 0.75) / 0.25 * Math.PI) : 1 - 0.55 * t) : 1 - 0.6 * t), color: tailCol }).geometry; tp.rotation.z = B.kind === "goat" ? -2.3 : -0.12; }
    tp.add(tm); skinMeshes.push(tm);
    /* views */
    const win = [-D.a * 0.02, D.cy - D.b * 0.05, D.a * 0.8, D.b * 0.82];
    dress(skinMeshes, view, { trunk, win, dark: o.dark, mat: pigMat }).forEach((m) => g.add(m));
    if (view !== "coat" && o.organs !== false) {
      const R = (TRUNK_ORGANS[B.kind] || ruminantOrgans)(); addRepro(R, B.male); const sx = D.a * 0.92 / 0.47, sy = D.b / 0.27, sz = D.c / 0.24;
      R.group.scale.set(sx, sy, sz); R.group.position.set(0.04 * sx, D.cy - 0.665 * sy, 0); g.add(R.group);
      /* mouth and the neck part of the gullet travel with the head */
      const gm = tis(TIS.gullet), gul = tubeM([[D.fx - D.hs * 0.5, D.fy + D.hs * 0.02, 0], [D.hx - D.hs * 0.2, D.hy - D.hs * 0.3, 0], [D.hx * 0.45, D.hy * 0.4 - D.hs * 0.15, 0], [B.L * 0.045, -B.H * 0.05, -0.02 * sz]], D.hs * 0.085, gm);
      const mouth = ellM([D.fx - D.hs * 0.35, D.fy + D.hs * 0.0, 0], [D.hs * 0.42, D.hs * 0.13, D.hs * 0.2], tis(TIS.mouth, { roughness: 0.35 }), -D.K.fa * 0.9);
      hp.add(gul, mouth); gul.userData.part = "gullet"; mouth.userData.part = "mouth";
      if (R.parts.gullet) R.parts.gullet.meshes.push(gul);
      R.parts.mouth = { id: "mouth", name: "Mouth", sys: "dig", info: B.kind === "pig" ? "Omnivore teeth: incisors, tusk-like canines and crushing molars. Dental formula 2 × (i 3/3, c 1/1, pm 4/4, m 3/3) = 44." : B.kind === "rabbit" ? "Chisel incisors that never stop growing, a gap (diastema) and grinding cheek teeth. Dental formula 2 × (i 2/1, c 0/0, pm 3/2, m 3/3) = 28." : "No upper incisors: the lower incisors bite against a hard dental pad. Ridged molars grind sideways. Dental formula 2 × (i 0/3, c 0/1, pm 3/3, m 3/3) = 32.", meshes: [mouth], anchor: V(D.fx - D.hs * 0.3, D.fy, -D.hs * 0.2), inHead: true };
      g.parts = R.parts; g.organs = R.group;
    }
    g.traverse((m) => { if (m.isMesh && m.castShadow !== false && view === "coat") { m.castShadow = true; m.receiveShadow = false; } });
    g.userData.breed = breed; g.dims = D; g.view = view; g.kind = B.kind;
    if (B.kind === "rabbit") g.legs.forEach((p, i) => { p.position.y = D.legTop; });
    return g;
  }

  /* ================= poultry ================= */
  const BIRDS = {
    hen: { s: 1, a: 0x9a5a2a, b: 0x6a3a1a, comb: 0.7 }, layer: { s: 1, a: 0xa8602c, b: 0x70401c, comb: 0.8 }, broiler: { s: 1.15, a: 0xf6f4ee, b: 0xe6e2d8, comb: 0.6, plump: 1 },
    cock: { s: 1.08, a: 0xc85a1a, b: 0x16302a, comb: 1.25, sickle: 1 }, local: { s: 0.92, a: 0x6a4a2a, b: 0x2a2a2a, comb: 0.7 }, turkey: { s: 1.4, a: 0x2e2a28, b: 0x6a5a48, comb: 0, turkey: 1 },
    duck: { s: 1, a: 0xf2f0ea, b: 0xe0dcd0, comb: 0, duck: 1 }, chick: { s: 0.35, a: 0xf6d84a, b: 0xf2c83a, comb: 0, chick: 1 }, weaver: { s: 0.28, a: 0xf2d21a, b: 0x2a2a1a, comb: 0, chick: 1 },
  };
  function birdSDF(P) {
    const pl = P.plump ? 1.12 : 1, ck = P.chick ? 1 : 0;
    return (x, y, z) => {
      const az = Math.abs(z);
      let d = sd.ell(x, y, z, 0, 0.26, 0, 0.2, 0.15 * pl, 0.135 * pl);
      d = S(d, sd.ell(x, y, z, 0.09, 0.225, 0, 0.14, 0.14 * pl, 0.125 * pl), 0.05);                      // breast
      d = S(d, sd.ell(x, y, z, -0.12, 0.29, 0, 0.13, 0.11, 0.105), 0.05);                                 // saddle
      d = S(d, sd.cone(x, y, z, 0.1, 0.33, 0, P.duck ? 0.2 : 0.17, P.duck ? 0.47 : 0.445, 0, 0.065, 0.04), 0.04);   // neck
      const hx = P.duck ? 0.215 : 0.185, hy = P.duck ? 0.49 : 0.46;
      d = S(d, sd.ell(x, y, z, hx, hy, 0, 0.052, 0.047, 0.043), 0.025);                                   // head
      d = S(d, sd.ell(x, y, az, 0.0, 0.17, 0.07, 0.06, 0.085, 0.05), 0.03);                               // thighs
      d = S(d, sd.ell(x, y, az, -0.03, 0.29, 0.128 * pl, 0.15, 0.085, 0.026), 0.02);                      // folded wings
      if (!ck) {
        if (P.duck) d = S(d, sd.cone(x, y, z, -0.2, 0.3, 0, -0.32, 0.33, 0, 0.07, 0.02), 0.04);
        else if (P.turkey) d = S(d, sd.smax(sd.sph(x, y, z, -0.2, 0.34, 0, 0.21), Math.abs(x + 0.26 + (y - 0.34) * 0.25) - 0.012, 0.01), 0.02);       // fan
        else d = S(d, sd.smax(sd.cone(x, y, z, -0.17, 0.31, 0, -0.33, 0.47, 0, 0.085, 0.03), az - 0.035, 0.02), 0.04);                              // tail
      } else d = S(d, sd.sph(x, y, z, -0.19, 0.3, 0, 0.04), 0.04);
      if (P.comb) { const cs = P.comb; for (let i = 0; i < 4; i++) d = S(d, sd.ell(x, y, z, hx - 0.035 + i * 0.022, hy + 0.045 + (i === 1 || i === 2 ? 0.012 : 0) * cs, 0, 0.016, 0.022 * cs, 0.007), 0.008); d = S(d, sd.ell(x, y, az, hx + 0.03, hy - 0.055, 0.012, 0.013, 0.028 * cs, 0.008), 0.008); }
      if (P.turkey) d = S(d, sd.cone(x, y, z, hx + 0.045, hy + 0.01, 0, hx + 0.05, hy - 0.09, 0, 0.012, 0.006), 0.008);                             // snood
      return d;
    };
  }
  function birdOrgans(type) {
    const R = reg(), hen = type === "hen" || type === "layer" || type === "local";
    R.add("gullet", "Oesophagus", "dig", "Carries swallowed grain down the neck. Birds have no teeth, so food is swallowed whole.", tubeM([[0.215, 0.445, 0], [0.17, 0.4, 0.005], [0.135, 0.33, 0.015]], 0.009, tis(TIS.gullet), { seg: 24, rs: 8 }), [0.17, 0.4, -0.02]);
    R.add("crop", "Crop", "dig", "A pouch at the base of the neck that stores food and moistens it before digestion.", ellM([0.125, 0.3, 0.018], [0.034, 0.038, 0.034], tis(0xe8b89a, { roughness: 0.4, clearcoat: 0.5 })), [0.125, 0.3, -0.03]);
    R.add("proventriculus", "Proventriculus (glandular stomach)", "dig", "Adds hydrochloric acid and pepsin to the food.", [tubeM([[0.115, 0.275, 0.015], [0.08, 0.27, 0.0], [0.05, 0.265, -0.015]], 0.008, tis(TIS.gullet), { seg: 16, rs: 8 }), ellM([0.035, 0.262, -0.02], [0.03, 0.02, 0.02], tis(TIS.stomach, { roughness: 0.4, clearcoat: 0.5 }), 0.15)], [0.035, 0.27, -0.05]);
    R.add("gizzard", "Gizzard (muscular stomach)", "dig", "Thick muscular walls and swallowed grit grind the food. It does the work of teeth.", sdfMesh("aa_b_giz", (x, y, z) => sd.ell(x, y, z, -0.025, 0.215, -0.03, 0.052, 0.042, 0.036), [-0.09, 0.16, -0.08, 0.04, 0.27, 0.02], 0.005, (x, y, z) => mix3(lin(0x8a2e34), lin(0xd8c8c0), (1 - sstep(0.004, 0.014, Math.abs(Math.hypot(x + 0.025, y - 0.215) - 0.025))) * 0.6), vt({ roughness: 0.35, clearcoat: 0.6 })), [-0.025, 0.2, -0.075]);
    R.add("liver", "Liver", "dig", "Two large lobes. Makes bile, which is stored in the gall bladder.", [ellM([0.055, 0.2, 0.035], [0.045, 0.032, 0.04], tis(TIS.liver, { roughness: 0.2, clearcoat: 0.8 }), 0.3), ellM([0.05, 0.195, -0.045], [0.04, 0.03, 0.03], tis(TIS.liver, { roughness: 0.2, clearcoat: 0.8 }), 0.3)], [0.07, 0.185, -0.07]);
    const DUO = [[-0.055, 0.2, 0.0], [-0.04, 0.165, 0.03], [0.02, 0.15, 0.04], [0.06, 0.15, 0.035], [0.065, 0.163, 0.03], [0.02, 0.168, 0.03], [-0.03, 0.185, 0.04]];
    R.add("duodenum", "Duodenal loop and pancreas", "dig", "A U-shaped loop of the small intestine with the pancreas lying inside it. Pancreatic juice and bile enter here.", [tubeM(DUO, 0.0085, tis(TIS.smallInt, { roughness: 0.33, clearcoat: 0.55 }), { seg: 60, rs: 8 }), tubeM([[-0.02, 0.172, 0.036], [0.02, 0.159, 0.038], [0.05, 0.157, 0.034]], 0.005, tis(TIS.pancreas), { seg: 16, rs: 6 })], [0.03, 0.145, 0.05]);
    const SI = coils(-0.13, -0.05, 0.215, 0.285, 0.0, 0.07, 4, [-0.03, 0.185, 0.04], [-0.13, 0.26, 0.0]);
    R.add("smallInt", "Small intestine", "dig", "Digestion is completed and the products are absorbed.", tubeM(SI, 0.008, tis(TIS.smallInt, { roughness: 0.33, clearcoat: 0.55 }), { seg: 260, rs: 8 }), [-0.09, 0.25, 0.085]);
    R.add("caeca", "Caeca (a pair)", "dig", "Two blind pouches where bacteria break down some fibre and water is absorbed.", [-1, 1].map((sv) => tubeM([[-0.13, 0.26, 0.0], [-0.1, 0.235, sv * 0.03], [-0.05, 0.225, sv * 0.045], [-0.01, 0.235, sv * 0.04]], 0.0085, tis(0x7a8a5a, { roughness: 0.4 }), { seg: 30, rs: 8, r: (t) => 0.7 + 0.6 * t })), [-0.05, 0.225, -0.05]);
    R.add("cloaca", "Large intestine and cloaca", "dig", "A short large intestine opens into the cloaca, the single exit for droppings, urine and eggs. The opening is the vent.", [tubeM([[-0.13, 0.26, 0.0], [-0.165, 0.255, 0], [-0.19, 0.25, 0]], 0.011, tis(TIS.largeInt), { seg: 16, rs: 8 }), ball([-0.2, 0.25, 0], 0.02, tis(0x8a3b3a))], [-0.2, 0.24, -0.02]);
    R.add("heart", "Heart", "circ", "Four chambers, beating about 300 times a minute in a hen.", ellM([0.1, 0.245, -0.005], [0.022, 0.028, 0.022], tis(TIS.heart, { roughness: 0.35, clearcoat: 0.6 }), 0.3), [0.1, 0.245, -0.03]);
    R.add("lungs", "Lungs and air sacs", "resp", "Small lungs fixed against the ribs, joined to thin-walled air sacs that keep air flowing one way.", [-1, 1].map((sv) => ellM([0.035, 0.345, sv * 0.04], [0.045, 0.02, 0.03], tis(TIS.lung, { roughness: 0.5 }))).concat([-1, 1].map((sv) => ellM([-0.05, 0.3, sv * 0.075], [0.06, 0.035, 0.022], new (T().MeshPhysicalMaterial)({ color: 0xcfe6ff, roughness: 0.2, transparent: true, opacity: 0.35, depthWrite: false })))), [0.035, 0.36, -0.05]);
    R.add("kidneys", "Kidneys", "excr", "Long, three-lobed kidneys under the backbone. Birds excrete white uric acid, not liquid urine, to save water.", [-1, 1].map((sv) => ellM([-0.09, 0.345, sv * 0.03], [0.05, 0.014, 0.018], tis(TIS.kidney, { roughness: 0.3, clearcoat: 0.6 }))), [-0.09, 0.355, -0.04]);
    if (type === "cock") R.add("testes", "Testes", "repro", "Two bean-shaped testes lie inside the body, near the kidneys. Sperm pass down the sperm ducts to the cloaca.", [-1, 1].map((sv) => ellM([-0.02, 0.33, sv * 0.03], [0.026, 0.014, 0.014], tis(0xf0e2c8, { roughness: 0.35, clearcoat: 0.5 }), 0.2)), [-0.02, 0.345, -0.045]);
    if (hen) {
      const yk = new (T().MeshPhysicalMaterial)({ color: 0xf2b21a, roughness: 0.3, clearcoat: 0.7 }), ov = [[0, 0, 0, 0.02], [0.022, 0.012, 0.012, 0.014], [-0.02, 0.01, -0.01, 0.011], [0.006, -0.018, 0.016, 0.009], [0.028, -0.012, -0.012, 0.007], [-0.012, 0.022, 0.014, 0.006]].map((q) => ball([-0.005 + q[0], 0.325 + q[1], -0.035 + q[2]], q[3], yk));
      R.add("ovary", "Ovary", "repro", "Only the left ovary works. It looks like a bunch of grapes: yolks (ova) at different stages. One ripe yolk is released about every 25 hours.", ov, [-0.005, 0.34, -0.06]);
      const OD = [[-0.02, 0.31, -0.05], [-0.06, 0.3, -0.075], [-0.1, 0.315, -0.06], [-0.12, 0.29, -0.075], [-0.09, 0.265, -0.08], [-0.13, 0.25, -0.065], [-0.17, 0.25, -0.035], [-0.195, 0.25, -0.01]];
      const od = tubeM(OD, 0.011, tis(0xeab4b0, { roughness: 0.4, clearcoat: 0.5 }), { seg: 120, rs: 10, r: (t) => (t < 0.12 ? 1.9 - t * 7 : t > 0.62 && t < 0.86 ? 1 + 1.9 * Math.sin((t - 0.62) / 0.24 * Math.PI) : 1) });
      const egg = ellM([-0.126, 0.251, -0.067], [0.03, 0.023, 0.023], new (T().MeshPhysicalMaterial)({ color: 0xead2b4, roughness: 0.5 }), 0.1); egg.userData.soft = false;
      R.add("oviduct", "Oviduct with an egg", "repro", "Infundibulum (fertilisation, 15 min) → magnum (albumen, 3 h) → isthmus (shell membranes, 1¼ h) → shell gland or uterus (shell, 20 h) → vagina → cloaca.", [od, egg], [-0.126, 0.235, -0.1]);
    }
    return R;
  }
  function bird(type, o) {
    o = o || {}; const T3 = T(), P = BIRDS[type] || BIRDS.hen, view = o.view || AK.bodyView || "coat", g = new T3.Group(), skin = [];
    const a = lin(P.a), b = lin(P.b), red = lin(0xc8141e), hx = P.duck ? 0.215 : 0.185, hy = P.duck ? 0.49 : 0.46;
    const geo = BA.cached("ab_" + type, () => BA.mesh(birdSDF(P), [-0.46, 0.06, -0.24, 0.3, 0.62, 0.24], 0.0075, { color: (x, y, z, nx, ny) => {
      const az = Math.abs(z), n = BK.fbm(x * 26, y * 26, z * 26); let c = mix3(a, b, sstep(0.5, 0.62, n) * 0.6);
      c = mix3(c, mix3(a, BLACK, 0.3), (0.5 + 0.5 * Math.sin((x * 0.6 + y) * 150)) * 0.18 * (P.chick ? 0 : 1));                                   // feather rows
      if (!P.chick) { c = mix3(c, b, sstep(0.105, 0.125, az) * sstep(0.2, 0.26, y) * 0.75); c = mix3(c, b, sstep(-0.16, -0.21, x) * (P.sickle ? 1 : 0.8)); }
      if (P.sickle) c = mix3(c, lin(0xe8a020), sstep(0.3, 0.4, y) * sstep(0.2, 0.1, x) * sstep(-0.1, 0.0, x) * 0.9);                              // golden hackle
      c = mix3(c, mix3(c, WHITE, 0.4), sstep(-0.4, -0.9, ny) * 0.4);
      if (P.comb && ((y > hy + 0.04 && Math.abs(x - hx) < 0.07 && az < 0.011) || (y < hy - 0.03 && y > hy - 0.1 && x > hx && az < 0.028))) c = red;
      if (P.turkey && x > 0.12 && y > 0.36) c = mix3(lin(0xb8404a), lin(0x6a8ac8), sstep(0.44, 0.5, y));
      return c; } }));
    const body = new T3.Mesh(geo); g.add(body); skin.push(body);
    const solid = view === "coat" || view === "open", horn = new T3.MeshPhysicalMaterial({ color: P.duck ? 0xf29a1e : 0xe2b040, roughness: 0.45, transparent: !solid, opacity: solid ? 1 : 0.4 });
    const beak = new T3.Mesh(new T3.ConeGeometry(0.02, 0.055, 10), horn); beak.rotation.z = -Math.PI / 2 - 0.15; beak.position.set(hx + 0.065, hy - 0.006, 0); if (P.duck) beak.scale.set(1.5, 1.25, 0.5); g.add(beak);
    for (const sv of [-1, 1]) {
      if (solid) { const e = new T3.Mesh(new T3.SphereGeometry(0.0085, 10, 8), new T3.MeshPhysicalMaterial({ color: 0x1a0e06, roughness: 0.05, clearcoat: 1 })); e.position.set(hx + 0.022, hy + 0.01, sv * 0.04); g.add(e); }
      const leg = BA.tube(BA.curve([[0.0, 0.14, sv * 0.06], [0.012, 0.07, sv * 0.058], [0.0, 0.012, sv * 0.058]]), 0.0085, horn, { seg: 12, rs: 6 }); g.add(leg);
      for (const [dx, dz] of [[0.06, 0], [0.045, 0.03], [0.045, -0.03], [-0.03, 0]]) { const toe = BA.tube(BA.curve([[0, 0.012, sv * 0.058], [dx * 0.5, 0.008, sv * 0.058 + dz * 0.5], [dx, 0.004, sv * 0.058 + dz]]), P.duck ? 0.009 : 0.0055, horn, { seg: 6, rs: 5 }); if (P.duck) toe.scale.y = 0.5; g.add(toe); }
    }
    if (P.sickle && view !== "xray") { const tm = new T3.MeshPhysicalMaterial({ color: 0x143a30, roughness: 0.4, side: T3.DoubleSide, sheen: 1, sheenColor: new T3.Color(0x66ffcc), transparent: view === "clear", opacity: view === "clear" ? 0.35 : 1 }); for (let i = 0; i < 7; i++) { const f = new T3.Mesh(BK.leafGeo(0.34 - i * 0.02, 0.05, 0.55, 6), tm); f.position.set(-0.24, 0.39, (i - 3) * 0.014); f.rotation.z = 1.9 + i * 0.13; f.rotation.y = Math.PI / 2; f.castShadow = true; g.add(f); } }
    dress(skin, view, { trunk: body, win: [-0.03, 0.26, 0.17, 0.115], dark: o.dark, mat: { roughness: 0.75, sheen: 0.7 } }).forEach((m) => g.add(m));
    if (view !== "coat" && o.organs !== false && !P.chick) { const R = birdOrgans(type); g.add(R.group); g.parts = R.parts; g.organs = R.group; }
    g.scale.setScalar(P.s); g.traverse((m) => { if (m.isMesh && view === "coat") m.castShadow = true; }); g.userData.bird = type; g.view = view; g.kind = "bird";
    return g;
  }

  /* ================= fish ================= */
  const catSDF = (x, y, z) => {
    let d = sd.ell(x, y, z, 0.0, 0, 0, 0.72, 0.15, 0.13);
    d = S(d, sd.ell(x, y, z, 0.52, -0.01, 0, 0.26, 0.1, 0.17), 0.12);                                      // broad flat head
    d = S(d, sd.cone(x, y, z, -0.5, 0, 0, -0.8, 0, 0, 0.1, 0.05), 0.1);
    return sd.smax(d, Math.abs(z) - (0.175 - sstep(0.2, -0.7, x) * 0.11), 0.04);
  };
  function fishOrgans(cat) {
    const R = reg(), k = cat ? 0.55 : 1;                                                                    // the catfish body is shallower
    const gm = new (T().MeshPhysicalMaterial)({ color: 0xc0222e, roughness: 0.4, side: T().DoubleSide });
    const gills = [0, 1, 2, 3].map((i) => { const m = new (T().Mesh)(new (T().TorusGeometry)(0.11 * k + 0.02, 0.012, 6, 20, Math.PI * 1.1), gm); m.position.set(0.4 - i * 0.03, -0.01 * k, 0); m.rotation.set(0, Math.PI / 2, 0); m.rotation.z = Math.PI * 0.45; m.scale.set(0.6, 1, 1); return m; });
    R.add("gills", "Gills", "resp", "Rows of thin red filaments rich in blood. Water passes over them and dissolved oxygen diffuses into the blood.", gills, [0.36, 0.04 * k, -0.09]);
    R.add("heart", "Heart", "circ", "Two chambers. It pumps blood forward to the gills, then round the body in a single circuit.", ellM([0.3, -0.16 * k, 0], [0.032, 0.028, 0.026], tis(TIS.heart, { roughness: 0.35, clearcoat: 0.6 })), [0.3, -0.16 * k, -0.03]);
    R.add("liver", "Liver", "dig", "Makes bile and stores oil and glycogen.", ellM([0.2, -0.09 * k, 0.0], [0.075, 0.05 * k + 0.012, 0.045], tis(TIS.liver, { roughness: 0.2, clearcoat: 0.8 }), 0.2), [0.2, -0.09 * k, -0.05]);
    R.add("stomach", "Stomach", "dig", "Food from the gullet is churned and partly digested here.", sdfMesh("aa_f_sto" + k, sd.chain([[0.3, 0.0, 0.01, 0.014], [0.16, -0.005 * k, 0.015, 0.04 * (0.6 + 0.4 * k)], [0.04, -0.03 * k, 0.015, 0.045 * (0.6 + 0.4 * k)], [-0.02, -0.07 * k, 0.01, 0.02]], 0.02), [-0.08, -0.14, -0.05, 0.34, 0.06, 0.08], 0.006, null, tis(TIS.stomach, { roughness: 0.36, clearcoat: 0.5 })), [0.1, -0.01 * k, -0.04]);
    const IN = coils(-0.16, 0.12, -0.2 * k, -0.11 * k, -0.03, 0.03, 3, [-0.02, -0.07 * k, 0.01], [-0.2, -0.22 * k, 0]);
    R.add("intestine", "Intestine and anus", "dig", cat ? "Short, because the catfish eats flesh, insects and pellets that are easy to digest." : "Long and coiled, because Tilapia feeds largely on algae and plant matter.", [tubeM(IN, 0.012, tis(TIS.smallInt, { roughness: 0.33, clearcoat: 0.55 }), { seg: 200, rs: 8 }), ball([-0.2, -0.23 * k - 0.01, 0], 0.014, tis(0x8a3b3a))], [-0.05, -0.16 * k, -0.045]);
    R.add("swim", "Swim bladder", "other", cat ? "A gas-filled sac that controls buoyancy. Clarias also has a tree-like air-breathing organ above the gills, so it survives in poor water." : "A gas-filled sac under the backbone. The fish changes the amount of gas to rise, sink or stay level.", ellM([-0.02, 0.07 * k + 0.01, 0], [0.24, 0.05 * k + 0.012, 0.05], new (T().MeshPhysicalMaterial)({ color: 0xe8eef2, roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.8 })), [-0.02, 0.07 * k + 0.02, -0.05]);
    R.add("kidneys", "Kidney", "excr", "A long dark strip under the backbone. It removes wastes and controls the water content of the body.", tubeM([[0.3, 0.14 * k + 0.012, 0], [0.0, 0.135 * k + 0.02, 0], [-0.3, 0.1 * k + 0.012, 0]], 0.014, tis(TIS.kidney, { roughness: 0.35, clearcoat: 0.5 }), { seg: 30, rs: 8 }), [0.1, 0.14 * k + 0.02, -0.02]);
    R.add("gonad", "Gonad (ovary or testis)", "repro", "Produces eggs (roe) or milt. Hatchery workers strip ripe brood fish to collect them.", ellM([-0.14, -0.02 * k, -0.02], [0.13, 0.03 * k + 0.008, 0.03], tis(0xf0c060, { roughness: 0.4, clearcoat: 0.5 }), -0.12), [-0.14, -0.02 * k, -0.06]);
    return R;
  }
  function fish(type, s, o) {
    o = o || {}; const T3 = T(), view = o.view || AK.bodyView || "coat", cat = type !== "tilapia";
    let g, body;
    if (!cat && BA.fish) { g = BA.fish(1, 0x7d8a6a); body = g.children[0]; }
    else {
      g = new T3.Group();
      const geo = BA.cached("af_cat", () => { const back = lin(0x3a3a32), belly = lin(0xd8d4c4); return BA.mesh(catSDF, [-0.9, -0.2, -0.2, 0.82, 0.2, 0.2], 0.014, { color: (x, y, z) => { let c = mix3(belly, back, sstep(-0.07, 0.03, y)); return mix3(c, lin(0x1e1e1a), sstep(0.5, 0.65, BK.fbm(x * 9, y * 9, z * 9)) * sstep(-0.03, 0.05, y) * 0.6); } }); });
      body = new T3.Mesh(geo); g.add(body);
      const fm = new T3.MeshPhysicalMaterial({ color: 0x4a4a40, roughness: 0.45, transparent: true, opacity: 0.85, side: T3.DoubleSide, depthWrite: false });
      const fin = (pts) => { const sh = new T3.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]); sh.closePath(); return new T3.Mesh(new T3.ShapeGeometry(sh), fm); };
      const tail = fin([[0, 0.04], [-0.2, 0.13], [-0.24, 0], [-0.2, -0.13], [0, -0.04]]), piv = new T3.Group(); piv.position.x = -0.78; piv.add(tail); g.add(piv); g.tail = piv;
      g.add(fin([[0.25, 0.13], [0.1, 0.24], [-0.5, 0.2], [-0.74, 0.1], [-0.74, 0.04]]), fin([[-0.12, -0.13], [-0.3, -0.24], [-0.7, -0.14], [-0.74, -0.04]]));
      const bm = new T3.MeshStandardMaterial({ color: 0x2a2a24, roughness: 0.6 });
      for (const sv of [-1, 1]) { for (let q = 0; q < 4; q++) g.add(BA.tube(BA.curve([[0.74, -0.03 + (q > 1 ? 0.05 : 0), sv * 0.08], [0.9, -0.08 + q * 0.05, sv * (0.16 + (q % 2) * 0.08)], [0.98 - q * 0.04, -0.14 + q * 0.07, sv * (0.26 + (q % 2) * 0.1)]]), 0.006, bm, { seg: 10, rs: 5, r: (t) => 1 - 0.7 * t })); if (view === "coat" || view === "open") { const e = new T3.Mesh(new T3.SphereGeometry(0.018, 10, 8), new T3.MeshPhysicalMaterial({ color: 0x0a0a0a, roughness: 0.05, clearcoat: 1 })); e.position.set(0.66, 0.06, sv * 0.13); g.add(e); } }
    }
    const fishMat = { roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.25, sheen: 0, iridescence: cat ? 0 : 0.35 };
    dress([body], view, { trunk: body, win: cat ? [0.05, 0, 0.42, 0.11] : [0.08, -0.03, 0.4, 0.21], dark: o.dark, mat: fishMat }).forEach((m) => g.add(m));
    if (view !== "coat" && o.organs !== false) { const R = fishOrgans(cat); g.add(R.group); g.parts = R.parts; g.organs = R.group; }
    g.scale.setScalar(s || 1); g.traverse((m) => { if (m.isMesh && view === "coat") m.castShadow = true; }); g.view = view; g.kind = "fish"; g.userData.fish = type;
    return g;
  }

  /* ================= replace the kit builders ================= */
  const old = { animal: AK.animal, bird: AK.bird, fish: AK.fish };
  AK.used = 0;
  AK.animal = (breed = "cow", o = {}) => { AK.used++; try { return quad(breed, o); } catch (e) { console.error("agric-atlas animal " + breed + ": " + e.message); return old.animal(breed, o); } };
  AK.bird = (type = "hen", o) => { AK.used++; try { return bird(type, o); } catch (e) { console.error("agric-atlas bird " + type + ": " + e.message); return old.bird(type); } };
  AK.fish = (type = "tilapia", s = 1, o) => { AK.used++; try { return fish(type, s, o); } catch (e) { console.error("agric-atlas fish " + type + ": " + e.message); return old.fish(type, s); } };
  AK.atlas = { quad, bird, fish, dims, BIRDS };
})();
