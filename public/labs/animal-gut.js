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

  function goatOrgans() {
    const T3 = T(), group = new T3.Group(), parts = {}, add = (id, meshes, anchor, short) => { meshes = [].concat(meshes); meshes.forEach((m) => { group.add(m); m.userData.part = id; }); parts[id] = { id, name: GOAT[id][0], short, info: GOAT[id][1], meshes, anchor: V(anchor[0], anchor[1], anchor[2]) }; };
    const MOUTH = [[0.93, 0.925, 0, 0.02], [0.84, 0.975, 0, 0.03], [0.76, 1.02, 0, 0.028]];
    const GUL = [[0.76, 1.02, 0], [0.68, 0.965, -0.01], [0.56, 0.87, -0.015], [0.43, 0.775, -0.02], [0.3, 0.745, -0.025], [0.2, 0.71, -0.035], [0.14, 0.68, -0.04]];
    add("mouth", sdfMesh("ag_g_mouth", sd.chain(MOUTH, 0.02), [0.7, 0.88, -0.06, 0.98, 1.08, 0.06], 0.007, null, tis(TIS.mouth, { roughness: 0.35 })), [0.86, 0.965, -0.03]);
    add("gullet", tubeM(GUL, 0.016, tis(TIS.gullet)), [0.52, 0.845, -0.03]);
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
    add("liver", ellM([0.215, 0.735, 0.075], [0.04, 0.105, 0.09], tis(TIS.liver, { roughness: 0.2, clearcoat: 0.8 }), -0.25), [0.225, 0.76, 0.14]);
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
  window.AGUT = { BODY, goatOrgans, dogOrgans };
})();
