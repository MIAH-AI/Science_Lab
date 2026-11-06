/* p3d-light-c.js — eye vs camera, EM spectrum, optical fibre (TIR), LASER (three.js). Needs p3d-light.js + p3d-waves.js. */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready || !P.util.optics || !P.util.wave) return;
  const T = window.THREE, { V3, TAU } = P.util, M = P.mat, H = P.hud, S_ = P.scenes, O = P.util.optics, setBeam = O.setBeam, W = P.util.wave;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  const sci = (v) => { if (!v) return "0"; const e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e); return `${(+m.toFixed(2)).toString()}×10${String(e).replace(/./g, (ch) => SUP[ch])}`; };
  const glass = (col, op, ior) => new T.MeshPhysicalMaterial({ color: col, transparent: true, opacity: op, roughness: 0.04, clearcoat: 1, ior: ior || 1.45, side: T.DoubleSide, depthWrite: false, envMapIntensity: 1.5 });
  const halo = (S, col, size) => { const h = S.mk.soft(col, size, 0, 0, 0, 0.0); h.visible = false; return h; };

  /* ================= HUMAN EYE vs CAMERA ================= */
  const AY = 3.4, XE = -8.5, RE = 2.3, XL = 3.2, XSENS = 10.6;
  S_["Human Eye vs Camera"] = {
    env: "dark", envOpts: { w: 40, d: 12 }, cam: [[-2, 6, 27], [-2, 3.2, 0]], fov: 36,
    data: [["Lens", "adjustable focal length (accommodation)", "Lens", "fixed or manually focused"], ["Retina", "light-sensitive layer, converts light to nerve signals", "Film / CCD sensor", "records the image chemically or electronically"], ["Iris", "controls pupil size = amount of light entering", "Aperture (diaphragm)", "controls the size of the opening"], ["Eyelid", "blinks to protect / brief exposure", "Shutter", "opens briefly to expose the film/sensor"]],
    build(S, s, c) {
      O.clearFog(S); const mk = S.mk, o = S.objs; o.tbl = mk.box(44, 0.3, 9, M.wood(), -2, -0.15, 0);
      const eye = (o.eye = new T.Group()); eye.position.set(XE, AY, 0); S.scene.add(eye);
      const scl = new T.Mesh(new T.SphereGeometry(RE, 40, 28), glass(0xf4f1ea, 0.34, 1.33)); eye.add(scl);
      const vit = new T.Mesh(new T.SphereGeometry(RE * 0.97, 32, 20), new T.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.07, depthWrite: false })); eye.add(vit);
      const cg = new T.SphereGeometry(RE * 0.56, 32, 16, 0, TAU, 0, 1.1); cg.rotateZ(Math.PI / 2); const cor = new T.Mesh(cg, glass(0xcfe8ff, 0.22, 1.376)); cor.position.x = -RE * 0.64; eye.add(cor);
      const ig = new T.CylinderGeometry(RE * 0.5, RE * 0.5, 0.05, 40); ig.rotateZ(Math.PI / 2); o.iris = new T.Mesh(ig, M.matte(0x2f77b5, 0.4)); o.iris.position.x = -RE * 0.34; eye.add(o.iris);
      const pg = new T.CylinderGeometry(1, 1, 0.06, 32); pg.rotateZ(Math.PI / 2); o.pupil = new T.Mesh(pg, M.matte(0x020202, 0.2)); o.pupil.position.x = -RE * 0.34 - 0.04; eye.add(o.pupil);
      o.elens = new T.Mesh(new T.SphereGeometry(RE * 0.34, 28, 18), glass(0xffe9a8, 0.6, 1.41)); o.elens.position.x = -RE * 0.14; eye.add(o.elens);
      const rg = new T.SphereGeometry(RE * 0.965, 40, 20, 0, TAU, 0, 1.15); rg.rotateZ(-Math.PI / 2); o.retina = new T.Mesh(rg, new T.MeshStandardMaterial({ color: 0xd2574d, emissive: 0x4a0d0a, roughness: 0.6, side: T.DoubleSide })); eye.add(o.retina);
      const nv = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 1.4, 14), M.matte(0xf0d9a8, 0.6)); nv.rotation.z = Math.PI / 2; nv.position.set(RE + 0.55, -0.6, 0); eye.add(nv);
      const lidMat = M.matte(0xd9a07f, 0.7), lidGeo = (a0, a1) => { const sh = new T.Shape(), r0 = RE * 1.05, r1 = RE * 1.16, n = 14; for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; sh[i ? "lineTo" : "moveTo"](Math.cos(a) * r1, Math.sin(a) * r1); } for (let i = n; i >= 0; i--) { const a = a0 + ((a1 - a0) * i) / n; sh.lineTo(Math.cos(a) * r0, Math.sin(a) * r0); } const g = new T.ExtrudeGeometry(sh, { depth: 2.4, bevelEnabled: false }); g.translate(0, 0, -1.2); return g; };
      o.lidU = new T.Mesh(lidGeo(rad(70), rad(125)), lidMat); o.lidL = new T.Mesh(lidGeo(rad(235), rad(290)), lidMat); eye.add(o.lidU, o.lidL);
      /* camera */
      const cam = (o.cam = new T.Group()); S.scene.add(cam);
      const bodyG = new T.BoxGeometry(8.6, 4.8, 3.8), body = new T.Mesh(bodyG, new T.MeshPhysicalMaterial({ color: 0x1c2027, transparent: true, opacity: 0.3, roughness: 0.3, metalness: 0.3, depthWrite: false, side: T.DoubleSide })); body.position.set(8.2, AY, 0); cam.add(body);
      const edges = new T.LineSegments(new T.EdgesGeometry(bodyG), new T.LineBasicMaterial({ color: 0x8aa2c4 })); edges.position.copy(body.position); cam.add(edges);
      const barrel = new T.Mesh(new T.CylinderGeometry(1.75, 1.75, 2.0, 40), M.paint(0x15171c)); barrel.rotation.z = Math.PI / 2; barrel.position.set(3.4, AY, 0); cam.add(barrel);
      const ring = new T.Mesh(new T.TorusGeometry(1.75, 0.08, 10, 48), M.chrome()); ring.rotation.y = Math.PI / 2; ring.position.set(2.4, AY, 0); cam.add(ring);
      o.clens = new T.Mesh(new T.SphereGeometry(1.2, 32, 20), glass(0xbfe0ff, 0.5, 1.5)); o.clens.scale.set(0.3, 1, 1); o.clens.position.set(XL, AY, 0); cam.add(o.clens);
      o.blades = []; for (let i = 0; i < 8; i++) { const b = new T.Mesh(new T.BoxGeometry(0.06, 0.8, 0.5), M.matte(0x0a0a0a, 0.5)); cam.add(b); o.blades.push(b); }
      o.sensor = new T.Mesh(new T.BoxGeometry(0.14, 2.6, 3.0), new T.MeshStandardMaterial({ color: 0x0d3b2a, emissive: 0x0a3a24, roughness: 0.4, metalness: 0.5 })); o.sensor.position.set(XSENS, AY, 0); cam.add(o.sensor);
      const sh = new T.MeshStandardMaterial({ color: 0x24262b, roughness: 0.5, metalness: 0.7 }); o.shT = new T.Mesh(new T.BoxGeometry(0.06, 1.5, 3.1), sh); o.shB = new T.Mesh(new T.BoxGeometry(0.06, 1.5, 3.1), sh); cam.add(o.shT, o.shB);
      /* objects & images */
      o.c1 = O.candle(S, false); o.c2 = O.candle(S, false); o.i1 = O.candle(S, true, 0x9fe8ff); o.i2 = O.candle(S, true, 0x9fe8ff);
      const bm = (col) => mk.beam(V3(), V3(1, 0, 0), col, 0.03); o.r1 = [0, 1, 2].map(() => [bm(0xffcf70), bm(0xffcf70)]); o.r2 = [0, 1, 2].map(() => [bm(0xffcf70), bm(0xffcf70)]);
      o.hl = { lens: [halo(S, 0xffd27a, 3.6), halo(S, 0xffd27a, 3.6)], ret: [halo(S, 0xff8a6b, 4.2), halo(S, 0x7fe3a0, 4.2)], iris: [halo(S, 0x7fc4ff, 3.6), halo(S, 0x7fc4ff, 3.6)], lid: [halo(S, 0xffb888, 4.6), halo(S, 0xffb888, 4.6)] };
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c) {
      const o = S.objs, t = S.t, part = c.part | 0, hc = 1.5, sc0 = 1.0;
      /* object distance (oscillates for accommodation) */
      const sw = 0.5 + 0.5 * Math.sin(t * 0.7), u0 = 5.4, ux = part === 0 ? 3.6 + 3.8 * sw : u0;
      const xlE = XE - RE * 0.14, vE = XE + RE * 0.965 - xlE, xo1 = xlE - ux;
      /* camera focusing: lens moves so that image falls on sensor (fixed f) */
      const fC = 2.35, xo2c = part === 0 ? -0.6 + 1.0 * sw : 0.2, D2 = XSENS - xo2c, disc = Math.max(D2 * D2 - 4 * D2 * fC, 0), uC = (D2 - Math.sqrt(disc)) / 2, vC = D2 - uC, xlC = xo2c + uC;
      o.c1.position.set(xo1, AY, 0); o.c2.position.set(xo2c, AY, 0); o.clens.position.x = xlC;
      const fE = 1 / (1 / ux + 1 / vE); o.elens.scale.set(clamp(0.35 + 0.85 * (1 / fE - 0.5), 0.3, 0.9) / 0.34 * 0.34 * 1.0 || 1, 1, 1); o.elens.scale.x = clamp(0.6 + 3.2 * (1 / fE - 0.5), 0.45, 1.5);
      /* iris / aperture */
      const rn = part === 2 ? 0.7 + 0.3 * Math.sin(t * 1.1) : 0.72; const pr = RE * 0.32 * rn / 0.72 * 0.9; o.pupil.scale.set(1, pr, pr); const ra = 1.15 * rn / 0.72 * 0.7; o.blades.forEach((b, i) => { const a = (i / 8) * TAU, rr = ra + 0.4 + 0.0; b.position.set(xlC + 0.35, AY + Math.cos(a) * rr, Math.sin(a) * rr); b.rotation.x = -a; b.scale.set(1, 1, 1); });
      /* eyelid / shutter */
      let blink = 0, shOpen = 1; if (part === 3) { const ph = (t % 3.4); blink = ph < 0.5 ? Math.sin((ph / 0.5) * Math.PI) : 0; shOpen = ph < 0.5 ? 1 - Math.sin((ph / 0.5) * Math.PI) * 1.0 : 1; }
      o.lidU.rotation.z = rad(62) * blink * 1.0 - rad(8) * (1 - blink); o.lidL.rotation.z = -rad(60) * blink + rad(8) * (1 - blink); const lidOpen = 1 - blink;
      o.shT.position.set(XSENS - 0.25, AY + 0.75 + 1.1 * shOpen, 0); o.shB.position.set(XSENS - 0.25, AY - 0.75 - 1.1 * shOpen, 0);
      const lightE = lidOpen * (pr / (RE * 0.32)) ** 2 * 1.0, lightC = clamp(shOpen, 0, 1) * (ra / (1.15 * 0.7)) ** 2;
      /* rays */
      const rayset = (R, xo, xl, xs, u, v, rr, k) => { const T0 = V3(xo, AY + hc, 0), I = V3(xs, AY - (hc * v) / u, 0); R.forEach((pair, i) => { const yo = (i - 1) * rr; const L = V3(xl, AY + yo, 0); setBeam(S, pair[0], T0, L, k); setBeam(S, pair[1], L, I.clone().addScaledVector(I.clone().sub(L).normalize(), 0.0), k); }); return I; };
      const IE = rayset(o.r1, xo1, xlE, XE + RE * 0.965, ux, vE, pr * 0.9, clamp(lightE, 0.02, 1)), IC = rayset(o.r2, xo2c, xlC, XSENS - 0.12, uC, vC, ra * 0.7, clamp(lightC, 0.02, 1));
      const mE = vE / ux, mC = vC / uC; o.i1.position.set(XE + RE * 0.965 - 0.06, AY, 0); o.i1.scale.set(0.08, -mE, mE * 0.9); o.i2.position.set(XSENS - 0.16, AY, 0); o.i2.scale.set(0.08, -mC, mC * 0.9); o.i1.visible = lightE > 0.1; o.i2.visible = lightC > 0.1; o.mE = mE; o.mC = mC; o.uE = ux; o.vE = vE; o.fE = fE; o.uC = uC; o.vC = vC; o.pr = pr; o.ra = ra; o.lightE = lightE; o.lightC = lightC;
      /* highlights */
      const pulse = 0.35 + 0.25 * Math.sin(t * 4), pos = { lens: [V3(XE - RE * 0.14, AY, 0), V3(xlC, AY, 0)], ret: [V3(XE + RE * 0.9, AY, 0), V3(XSENS, AY, 0)], iris: [V3(XE - RE * 0.34, AY, 0), V3(xlC + 0.3, AY, 0)], lid: [V3(XE - RE * 1.1, AY, 0), V3(XSENS - 0.3, AY + 1.3, 0)] }, key = ["lens", "ret", "iris", "lid"];
      key.forEach((k, ki) => o.hl[k].forEach((h, j) => { h.visible = ki === part; h.position.copy(pos[k][j]); h.material.opacity = pulse; }));
      S.aim([-1.6, 4.3, 0], 30, 0.0, 0.11);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, d = this.data[c.part | 0], p = c.part | 0;
      H.pill(ctx, 14, 26, "Both form a real, INVERTED, diminished image on the light-sensitive surface", "#ffd27a", 10); H.pill(ctx, 14, 48, `1/f = 1/u + 1/v   eye: 1/${f1(o.fE, 2)} = 1/${f1(o.uE, 1)} + 1/${f1(o.vE, 1)}  (v fixed, f varies)`, "#cfe0ff", 9.5);
      H.pill(ctx, 14, 70, `${d[0]} (eye): ${d[1]}`, "#7fe3da", 10); H.pill(ctx, 14, 92, `${d[2]} (camera): ${d[3]}`, "#ef7a6d", 10);
      if (p === 2) H.pill(ctx, 14, 114, `pupil Ø ≈ ${f1(2 + (o.pr / (RE * 0.32)) * 3, 1)} mm → light ∝ Ø²   aperture f/${f1(50 / (o.ra * 14), 1)} (N = f/D)`, "#8df0be", 9.5);
      if (p === 3) H.pill(ctx, 14, 114, `blink ≈ 0.3 s     shutter speed ≈ 1/250 s     light = intensity × time`, "#8df0be", 9.5);
      if (p === 1) H.pill(ctx, 14, 114, `m = v/u = ${f1(o.mE, 2)} (eye)   ${f1(o.mC, 2)} (camera):  inverted on the retina; the brain re-inverts`, "#8df0be", 9.5);
      if (p === 0) H.pill(ctx, 14, 114, `eye: ciliary muscle changes lens curvature   camera: lens moves to focus`, "#8df0be", 9.5);
      const lab = (x, y, t, col) => { const q = S.proj(V3(x, y, 1.2)); H.pill(ctx, q.x, q.y, t, col, 11, "center"); };
      lab(XE, AY + 3.5, "EYE", "#7fe3da"); lab(8.0, AY + 3.4, "CAMERA", "#ef7a6d"); const nm = [["lens", "lens"], ["retina", "sensor"], ["iris", "aperture"], ["eyelid", "shutter"]][p];
      const e1 = S.proj(V3(XE, AY - 3.2, 1)), e2 = S.proj(V3(XL + 4, AY - 3.2, 1)); H.pill(ctx, e1.x, e1.y, nm[0], "#ffd27a", 10.5, "center"); H.pill(ctx, e2.x, e2.y, nm[1], "#ffd27a", 10.5, "center");
    },
    readouts(s, c) { const d = this.data[c.part | 0]; return [["Eye part", d[0]], ["Camera part", d[2]], ["Shared function", "controls or records the image"], ["Image", "Real, inverted, diminished"]]; },
  };

  /* ================= ELECTROMAGNETIC SPECTRUM ================= */
  const BANDS = [
    { name: "Radio waves", wl: "> 0.1 m", fq: "< 3×10⁹ Hz", use: "broadcasting, Wi-Fi, MRI", col: 0xc74dff, cyc: 1.2, lam: 1.0 },
    { name: "Microwaves", wl: "1 mm – 0.1 m", fq: "3×10⁹–3×10¹¹ Hz", use: "satellite links, cooking", col: 0x9a6bff, cyc: 2, lam: 0.01 },
    { name: "Infrared", wl: "700 nm – 1 mm", fq: "3×10¹¹–4×10¹⁴ Hz", use: "remote controls, thermal imaging", col: 0xef7a6d, cyc: 4, lam: 1e-5 },
    { name: "Visible light", wl: "400–700 nm", fq: "4–7.5×10¹⁴ Hz", use: "human vision, photography", col: 0x7fe3da, cyc: 7, lam: 5.5e-7 },
    { name: "Ultraviolet", wl: "10–400 nm", fq: "7.5×10¹⁴–3×10¹⁶ Hz", use: "sterilisation, sun tanning", col: 0x8f7bff, cyc: 11, lam: 1e-7 },
    { name: "X-rays", wl: "0.01–10 nm", fq: "3×10¹⁶–3×10¹⁹ Hz", use: "medical imaging, security", col: 0x5ad0ff, cyc: 16, lam: 1e-9 },
    { name: "Gamma rays", wl: "< 0.01 nm", fq: "> 3×10¹⁹ Hz", use: "cancer treatment, sterilising", col: 0xffe15a, cyc: 22, lam: 1e-12 },
  ];
  const sticks = (S, n, col) => { const im = new T.InstancedMesh(new T.CylinderGeometry(0.022, 0.022, 1, 6), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8 }), n); im.frustumCulled = false; S.scene.add(im); return im; };
  S_["Electromagnetic Spectrum"] = {
    env: "dark", envOpts: { w: 34, d: 14 }, cam: [[0, 4, 22], [0, 3, 0]], fov: 36,
    build(S, s, c) {
      O.clearFog(S); const mk = S.mk, o = S.objs, N = 60; o.N = N; o.tbl = mk.box(40, 0.3, 12, M.matte(0x1a1d25, 0.5), 0, -0.15, 0);
      o.E = W.curve(S, 200, 0.06, new T.MeshBasicMaterial({ color: 0xffffff })); o.B = W.curve(S, 200, 0.04, new T.MeshBasicMaterial({ color: 0x6aa0ff, transparent: true, opacity: 0.8 })); o.Es = sticks(S, N, 0xffffff); o.Bs = sticks(S, N, 0x6aa0ff);
      o.ax = mk.rod(V3(-9.5, 3.4, 0), V3(10.5, 3.4, 0), 0.012, M.glow(0xffffff, 0.35), 6);
      o.bar = BANDS.map((b, i) => mk.box(1.9, 0.5, 0.8, M.emissive(b.col, 0.6), -6.6 + i * 2.2, 0.3, 4.6)); o.mk = mk.cone(0.28, 0.55, M.emissive(0xffffff, 1.6), 0, 1.0, 4.6); o.mk.rotation.z = Math.PI;
      o.src = BANDS.map(() => { const g = new T.Group(); g.position.set(-11.6, 0, 0); S.scene.add(g); return g; });
      const add = (g, m) => { g.add(m); return m; };
      /* radio tower */ { const g = o.src[0], st = M.steel(); add(g, new T.Mesh(new T.CylinderGeometry(0.1, 0.22, 6.8, 10), st)).position.y = 3.4; for (let i = 0; i < 4; i++) { const b = add(g, new T.Mesh(new T.BoxGeometry(1.5 - i * 0.28, 0.07, 0.07), st)); b.position.y = 6.3 - i * 0.8; } add(g, new T.Mesh(new T.SphereGeometry(0.16, 14, 10), M.emissive(0xff3030, 2))).position.y = 6.9; }
      /* microwave dish */ { const g = o.src[1], d = add(g, new T.Mesh(new T.SphereGeometry(1.4, 32, 16, 0, TAU, 0, 0.9), M.steel())); d.material.side = T.DoubleSide; d.rotation.z = -Math.PI / 2; d.position.set(0.3, 3.4, 0); add(g, new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 3.4, 10), M.steel())).position.y = 1.7; add(g, new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.2, 8), M.steel())).rotation.z = Math.PI / 2; g.children[g.children.length - 1].position.set(0.8, 3.4, 0); }
      /* infrared: hot mug + heat lamp glow */ { const g = o.src[2]; add(g, new T.Mesh(new T.CylinderGeometry(0.9, 0.8, 1.6, 28), M.ceramic())).position.y = 0.8; add(g, new T.Mesh(new T.CylinderGeometry(0.78, 0.78, 0.06, 28), M.matte(0x3a1f0d, 0.4))).position.y = 1.52; const gl = mk.soft(0xff5a3a, 4.2, 0, 1.6, 0, 0.55); S.scene.remove(gl); g.add(gl); for (let i = 0; i < 3; i++) { const st = mk.soft(0xffffff, 0.9, (i - 1) * 0.3, 2.3 + i * 0.5, 0, 0.12); S.scene.remove(st); g.add(st); } add(g, new T.Mesh(new T.TorusGeometry(0.5, 0.1, 10, 24, Math.PI), M.ceramic())).position.set(0.9, 0.85, 0); g.children[g.children.length - 1].rotation.z = -Math.PI / 2; }
      /* visible: bulb */ { const g = o.src[3], b = mk.bulb(0xfff0c0, 10); S.scene.remove(b); b.scale.setScalar(2.4); b.position.y = 3.4; g.add(b); add(g, new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 2.4, 10), M.steel())).position.y = 1.2; o.bulb = b; }
      /* UV: tube lamp */ { const g = o.src[4], t = add(g, new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 3.4, 20), M.emissive(0x9a7bff, 1.8))); t.position.y = 3.2; add(g, new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.3, 20), M.matte(0x222222, 0.5))).position.y = 4.95; add(g, new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.3, 20), M.matte(0x222222, 0.5))).position.y = 1.45; const gl = mk.soft(0x8f7bff, 5.2, 0, 3.2, 0, 0.5); S.scene.remove(gl); g.add(gl); }
      /* X-ray: tube housing + hand bones */ { const g = o.src[5], hs = add(g, new T.Mesh(new T.BoxGeometry(2.2, 2.2, 2.2), M.paint(0x3a4252))); hs.position.y = 3.4; add(g, new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 0.5, 20), M.glass(0x5ad0ff))).position.set(1.2, 3.4, 0); g.children[g.children.length - 1].rotation.z = Math.PI / 2; const gl = mk.soft(0x5ad0ff, 3.6, 1.4, 3.4, 0, 0.6); S.scene.remove(gl); g.add(gl); }
      /* gamma: source in lead pot */ { const g = o.src[6]; add(g, new T.Mesh(new T.CylinderGeometry(1.1, 1.3, 1.8, 24), M.matte(0x4a4d55, 0.5))).position.y = 0.9; add(g, new T.Mesh(new T.SphereGeometry(0.4, 20, 14), M.emissive(0xffe15a, 2.2))).position.y = 2.3; const gl = mk.soft(0xffe15a, 4.2, 0, 2.3, 0, 0.6); S.scene.remove(gl); g.add(gl); }
      o.sig = -1; o.qm = new T.Matrix4(); o.qq = new T.Quaternion(); o.qs = V3(); o.qp = V3();
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c) {
      const o = S.objs, b = BANDS[c.band | 0], t = S.t, X0 = -9.5, X1 = 10.5, Y0 = 3.4, N = 200, A = 1.5, lamD = (X1 - X0) / b.cyc, k = TAU / lamD, w = k * 2.2;
      o.src.forEach((g, i) => (g.visible = i === (c.band | 0)));
      const col = new T.Color(b.col); o.E.material.color.copy(col.clone().lerp(new T.Color(0xffffff), 0.25)); o.Es.material.color.copy(col); const pe = [], pb = [];
      for (let i = 0; i <= N; i++) { const x = X0 + ((X1 - X0) * i) / N, env = Math.min(1, (x - X0) / 2.0), ph = k * (x - X0) - w * t, e = A * env * Math.sin(ph); pe.push(V3(x, Y0 + e, 0)); pb.push(V3(x, Y0, e * 0.95)); }
      o.E.setPts(pe); o.B.setPts(pb);
      const m = o.qm, q = o.qq, sc = o.qs, p = o.qp, up = V3(0, 1, 0), zq = new T.Quaternion().setFromUnitVectors(up, V3(0, 0, 1));
      for (let i = 0; i < o.N; i++) { const x = X0 + 1 + ((X1 - X0 - 1) * i) / (o.N - 1), env = Math.min(1, (x - X0) / 2.0), e = A * env * Math.sin(k * (x - X0) - w * t), L = Math.max(Math.abs(e), 0.001);
        q.identity(); sc.set(1, L, 1); p.set(x, Y0 + e / 2, 0); m.compose(p, q, sc); o.Es.setMatrixAt(i, m); sc.set(1, L * 0.95, 1); p.set(x, Y0, e * 0.95 / 2); m.compose(p, zq, sc); o.Bs.setMatrixAt(i, m); }
      o.Es.instanceMatrix.needsUpdate = o.Bs.instanceMatrix.needsUpdate = true; o.bar.forEach((bx, i) => { bx.scale.y = i === (c.band | 0) ? 1.8 : 1; bx.position.y = i === (c.band | 0) ? 0.45 : 0.3; }); o.mk.position.x = -6.6 + (c.band | 0) * 2.2; o.mk.position.y = 1.5 + 0.1 * Math.sin(t * 4);
      if ((c.band | 0) === 3) o.bulb.setPower && o.bulb.setPower(1); S.aim([0, 3.2, 0], 25, 0.0, 0.1);
    },
    overlay(ctx, s, c, w, h, S) {
      const b = BANDS[c.band | 0], f = 3e8 / b.lam, E = (6.626e-34 * f) / 1.602e-19; const col = "#" + new T.Color(b.col).getHexString();
      H.pill(ctx, 14, 26, `${b.name}   (${b.wl})`, col, 11); H.pill(ctx, 14, 48, "c = f · λ        c = 3×10⁸ m/s for ALL EM waves in vacuum", "#ffd27a", 10); H.pill(ctx, 14, 70, `λ = ${sci(b.lam)} m  →  f = c/λ = ${sci(f)} Hz   (band: ${b.fq})`, "#8df0be", 9.5); H.pill(ctx, 14, 92, `photon energy E = hf = ${sci(E)} eV      use: ${b.use}`, "#cfe0ff", 9.5);
      const lab = (x, y, t, cl, al) => { const q = S.proj(V3(x, y, 0.6)); H.pill(ctx, q.x, q.y, t, cl, 10, al || "center"); }; lab(-2, 5.4, "E-field (colour)", col); lab(8.0, 5.2, "B-field ⟂ E ⟂ direction", "#8fb4ff", "center"); BANDS.forEach((bb, i) => lab(-6.6 + i * 2.2, -0.45, ["Radio", "Micro", "IR", "Visible", "UV", "X-ray", "Gamma"][i], i === (c.band | 0) ? "#ffffff" : "#8aa0bb"));
      lab(-11.6, -0.4, "source", "#cfe0ff"); lab(3.5, 1.9, "transverse wave travelling at c →", "#cfe0ff"); lab(-6, 1.9, "short λ ⇒ high f ⇒ high energy →", "#9fb8d8");
    },
    readouts(s, c) { const b = BANDS[c.band | 0]; return [["Region", b.name], ["Wavelength", b.wl], ["Frequency", b.fq], ["Use", b.use]]; },
  };

  /* ================= FIBRE OPTICS — TIR ================= */
  const FY = 3.4, FD = 1.8, FCL = 0.55, FX0 = -11, FX1 = 11, N1 = 1.5;
  S_["Fibre Optics — Total Internal Reflection"] = {
    env: "dark", envOpts: { w: 36, d: 12 }, cam: [[0, 5.5, 22], [0, 3.4, 0]], fov: 36,
    build(S, s, c) {
      O.clearFog(S); const mk = S.mk, o = S.objs; o.tbl = mk.box(46, 0.3, 10, M.matte(0x1a1d25, 0.5), 0, -0.15, 0);
      const L = FX1 - FX0, cx = (FX0 + FX1) / 2, gm = (col, op) => glass(col, op, 1.5);
      o.core = new T.Mesh(new T.BoxGeometry(L, FD, 1.6), gm(0xbfe9ff, 0.28)); o.core.position.set(cx, FY, 0); S.scene.add(o.core);
      o.cl = [1, -1].map((sg) => { const m = new T.Mesh(new T.BoxGeometry(L, FCL, 1.6), gm(0x9fa8ff, 0.2)); m.position.set(cx, FY + sg * (FD / 2 + FCL / 2), 0); S.scene.add(m); return m; });
      o.jk = [1, -1].map((sg) => { const m = new T.Mesh(new T.BoxGeometry(L, 0.1, 1.6), M.matte(0x3a2f27, 0.7)); m.position.set(cx, FY + sg * (FD / 2 + FCL + 0.05), 0); S.scene.add(m); return m; });
      [o.core, ...o.cl].forEach((m) => { const e = new T.LineSegments(new T.EdgesGeometry(m.geometry), new T.LineBasicMaterial({ color: 0xbfd9ff, transparent: true, opacity: 0.5 })); e.position.copy(m.position); S.scene.add(e); });
      o.led = mk.box(1.6, 1.2, 1.4, M.paint(0x24272e), FX0 - 5.8, FY - 2.4, 0); o.ledg = mk.soft(0xffd27a, 2.2, FX0 - 5.0, FY - 2.1, 0, 0.5);
      /* decorative looping strand behind */
      const pts = [V3(FX0 - 1, FY + 0.2, -3), V3(-6, FY + 2.8, -3.6), V3(0, FY + 0.4, -4), V3(6, FY + 2.6, -3.6), V3(FX1 + 1, FY, -3)], cur = new T.CatmullRomCurve3(pts);
      mk.tube && 0; const st = new T.Mesh(new T.TubeGeometry(cur, 80, 0.2, 10, false), gm(0xbfe9ff, 0.35)); S.scene.add(st); const gl = new T.Mesh(new T.TubeGeometry(cur, 80, 0.06, 8, false), new T.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false })); S.scene.add(gl); o.gl = gl;
      o.in = mk.beam(V3(), V3(1, 0, 0), 0xffb703, 0.05); o.seg = []; o.leak = []; o.dots = []; for (let i = 0; i < 12; i++) { o.seg.push(mk.beam(V3(), V3(1, 0, 0), 0xffb703, 0.045)); o.leak.push(mk.beam(V3(), V3(1, 0, 0), 0xff7a6b, 0.04)); o.dots.push(mk.soft(0xff7a6b, 0.9, 0, 0, 0, 0)); } o.out = mk.beam(V3(), V3(1, 0, 0), 0xffb703, 0.05);
      o.nrm = [0, 1].map(() => mk.rod(V3(), V3(0, 1, 0), 0.01, M.glow(0xffffff, 0.35), 6));
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c) {
      const o = S.objs, n2 = c.nclad || 1.4, th = rad(c.angle), thc = Math.asin(n2 / N1), psi = Math.PI / 2 - th, tin = Math.asin(clamp(N1 * Math.sin(psi), 0, 1)), tir = th >= thc;
      const yTop = FY + FD / 2, yBot = FY - FD / 2, xE = FX0, yE = yBot + 0.4, d0 = V3(Math.cos(psi), Math.sin(psi), 0), Rf = tir ? 1 : O.fres(N1, n2, th), th2 = Math.asin(clamp((N1 * Math.sin(th)) / n2, 0, 1));
      const start = V3(xE - 3.4, yE - 3.4 * Math.tan(tin), 0); setBeam(S, o.in, start, V3(xE, yE, 0), 1);
      let p = V3(xE, yE, 0), dir = d0.clone(), I = 1, used = 0, leaked = 0; o.dots.forEach((d) => (d.visible = false)); o.leak.forEach((l) => (l.visible = false)); o.seg.forEach((sg) => (sg.visible = false));
      for (let i = 0; i < 12; i++) { const goUp = dir.y > 0, yW = goUp ? yTop : yBot, tt = (yW - p.y) / dir.y, q = p.clone().addScaledVector(dir, tt); if (q.x >= FX1) { const te = (FX1 - p.x) / dir.x, e = p.clone().addScaledVector(dir, te); setBeam(S, o.seg[i], p, e, I); p = e; used = i + 1; break; }
        setBeam(S, o.seg[i], p, q, clamp(I, 0.02, 1)); used = i + 1;
        if (!tir) { const lk = I * (1 - Rf), ld = V3(Math.cos(Math.PI / 2 - th2), (goUp ? 1 : -1) * Math.sin(Math.PI / 2 - th2), 0), lend = q.clone().addScaledVector(ld, FCL / Math.max(Math.sin(Math.PI / 2 - th2), 0.05) > 6 ? 6 : FCL / Math.max(Math.sin(Math.PI / 2 - th2), 0.05)); if (lk > 0.02) { setBeam(S, o.leak[i], q, lend, clamp(lk * 2.2, 0.15, 1)); o.dots[i].visible = true; o.dots[i].position.copy(lend); o.dots[i].material.opacity = clamp(lk * 1.4, 0.1, 0.8); } leaked += lk; I *= Rf; }
        p = q; dir = V3(dir.x, -dir.y, 0); if (I < 0.015) break; }
      if (p.x >= FX1 - 1e-3 && I > 0.02) { const od = V3(Math.cos(tin), Math.sign(dir.y) * Math.sin(tin), 0); setBeam(S, o.out, p, p.clone().addScaledVector(od, 4.2), clamp(I, 0.1, 1)); } else o.out.visible = false;
      o.tir = tir; o.thc = thc; o.th2 = th2; o.Rf = Rf; o.tin = tin; o.I = I; o.gl.material.opacity = 0.35 + 0.45 * (tir ? 1 : 0.3); o.NA = Math.sqrt(N1 * N1 - n2 * n2); o.thA = Math.asin(clamp(o.NA, 0, 1)); o.pt = V3(xE, yE, 0);
      const nx = -9.2, ny = [yTop, yBot]; o.nrm.forEach((r, i) => { const x = nx + i * 0, y = ny[i]; r.visible = false; });
      S.aim([-0.5, 3.0, 0], 25, 0.0, 0.12);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, n2 = c.nclad || 1.4;
      H.pill(ctx, 14, 26, "TIR needs n₁ > n₂  and  θ ≥ θc ,  sin θc = n₂ / n₁", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `θc = sin⁻¹(${f1(n2, 2)}/1.50) = ${f1(deg(o.thc), 1)}°     wall angle θ = ${c.angle}°`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, o.tir ? `θ ≥ θc → TOTAL INTERNAL REFLECTION: light trapped, I out = ${f1(o.I * 100, 0)} %` : `θ < θc → partial: ${f1((1 - o.Rf) * 100, 1)} % leaks at EVERY bounce, ${f1(o.I * 100, 1)} % left`, o.tir ? "#8df0be" : "#ff9d8a", 10);
      H.pill(ctx, 14, 92, `NA = √(n₁²−n₂²) = ${f1(o.NA, 2)}   acceptance half-angle = ${f1(deg(o.thA), 1)}°  (entry ray in air: ${f1(deg(o.tin), 1)}°)`, o.tin <= o.thA + 1e-6 ? "#9fb8d8" : "#ff9d8a", 9.5);
      const lab = (x, y, t, col, al) => { const q = S.proj(V3(x, y, 1)); H.pill(ctx, q.x, q.y, t, col, 10, al || "center"); }; lab(0, FY + FD / 2 + FCL + 0.9, "cladding (n₂)", "#a9b0ff"); lab(0, FY, "core (n₁ = 1.50)", "#9fe0ff"); lab(-6.5, FY - 2.9, "ray refracts into the end-face", "#ffb703"); lab(FX1 - 0.5, FY + 2.6, "emerges at same angle", "#ffb703", "right");
    },
    readouts(s, c) { const n2 = c.nclad || 1.4, thc = deg(Math.asin(n2 / N1)); return [["Critical angle θc", `${f1(thc, 1)}°`], ["Wall angle θ", `${c.angle}° → ${c.angle >= thc ? "TIR (trapped)" : "leaks into cladding"}`], ["Numerical aperture", `${f1(Math.sqrt(N1 * N1 - n2 * n2), 2)}`], ["Used in", "LAN, medical endoscopes, telecoms"]]; },
  };

  /* ================= LASER — stimulated emission ================= */
  const NA_ = 24, LXL = -6, LXR = 6, LV = 11, TAU_SP = 1.5;
  function linit(s) { s.atoms = Array.from({ length: NA_ }, (_, i) => ({ x: LXL + 0.7 + ((LXR - LXL - 1.4) * (i + Math.random() * 0.6)) / NA_, y: (Math.random() - 0.5) * 1.3, z: (Math.random() - 0.5) * 1.3, e: false })); s.atoms.sort((a, b) => a.x - b.x); s.ph = []; s.acc = 0; s.out = 0; s.rate = 0; s.outAcc = 0; s.flash = []; s.init = true; }
  function lstep(s, c, dt) {
    if (!s.init) linit(s); s.acc += c.pump * dt; while (s.acc >= 1) { s.acc -= 1; for (let k = 0; k < 2; k++) { const g = s.atoms.filter((a) => !a.e); if (g.length) g[(Math.random() * g.length) | 0].e = true; } }
    s.atoms.forEach((a) => { if (a.e && Math.random() < dt / TAU_SP) { a.e = false; if (Math.random() < 0.3 && s.ph.length < 220) s.ph.push({ x: a.x, d: Math.random() < 0.5 ? 1 : -1, y: a.y, z: a.z }); else s.flash.push({ x: a.x, y: a.y, z: a.z, t: 0 }); } });
    const spawn = [], keep = [];
    s.ph.forEach((p) => { const x0 = p.x, x1 = p.x + p.d * LV * dt; let alive = true; const lo = Math.min(x0, x1), hi = Math.max(x0, x1), hit = s.atoms.filter((a) => a.x >= lo && a.x < hi); if (p.d < 0) hit.reverse();
      for (const a of hit) { if (Math.random() < 0.7) { if (a.e) { a.e = false; spawn.push({ x: a.x, d: p.d, y: a.y, z: a.z }); } else { a.e = true; alive = false; break; } } }
      if (!alive) return; p.x = x1; if (p.x > LXR) { p.x = 2 * LXR - p.x; p.d = -1; } else if (p.x < LXL) { if (Math.random() < 0.14) { s.outAcc++; return; } p.x = 2 * LXL - p.x; p.d = 1; } keep.push(p); });
    s.ph = keep; spawn.forEach((p) => { if (s.ph.length < 220) s.ph.push(p); });
    s.flash = s.flash.filter((f) => (f.t += dt) < 0.4); s.rate += (s.outAcc / Math.max(dt, 1e-3) - s.rate) * Math.min(1, dt * 1.5); s.outAcc = 0;
  }
  S_["LASER — Stimulated Emission"] = {
    env: "dark", envOpts: { w: 36, d: 12 }, cam: [[-2, 5, 22], [-2, 3, 0]], fov: 36,
    build(S, s, c) {
      O.clearFog(S); const mk = S.mk, o = S.objs; s.init = false; o.tbl = mk.box(46, 0.3, 10, M.matte(0x1a1d25, 0.5), 0, -0.15, 0); const LY = 3.4;
      const rg = new T.CylinderGeometry(1.15, 1.15, LXR - LXL, 40); rg.rotateZ(Math.PI / 2); o.rod = new T.Mesh(rg, new T.MeshPhysicalMaterial({ color: 0xb02a40, transparent: true, opacity: 0.28, roughness: 0.1, clearcoat: 1, depthWrite: false, side: T.DoubleSide })); o.rod.position.set((LXL + LXR) / 2, LY, 0); S.scene.add(o.rod);
      const mr = new T.Mesh(new T.CylinderGeometry(1.6, 1.6, 0.18, 36), M.chrome()); mr.rotation.z = Math.PI / 2; mr.position.set(LXR + 0.35, LY, 0); S.scene.add(mr);
      const oc = new T.Mesh(new T.CylinderGeometry(1.6, 1.6, 0.14, 36), new T.MeshPhysicalMaterial({ color: 0xcfd8e4, metalness: 0.6, roughness: 0.1, transparent: true, opacity: 0.5, clearcoat: 1 })); oc.rotation.z = Math.PI / 2; oc.position.set(LXL - 0.35, LY, 0); S.scene.add(oc);
      [LXR + 0.35, LXL - 0.35].forEach((x) => { mk.box(0.3, LY - 1.6, 0.4, M.steel(), x, (LY - 1.6) / 2, 0); });
      o.lamp = mk.helix(6, 1.8, LXR - LXL - 1, 0.07, new T.MeshBasicMaterial({ color: 0x9fb8ff, transparent: true, opacity: 0.4, blending: T.AdditiveBlending, depthWrite: false })); o.lamp.position.set((LXL + LXR) / 2, LY, 0); o.lglow = mk.soft(0xaec4ff, 12, (LXL + LXR) / 2, LY, 0.5, 0.0);
      o.atoms = []; for (let i = 0; i < NA_; i++) { const m = new T.Mesh(new T.SphereGeometry(0.14, 14, 10), new T.MeshStandardMaterial({ color: 0x5a1520, roughness: 0.5, emissive: 0x000000 })); S.scene.add(m); o.atoms.push(m); }
      o.ph = mk.particles(220, 0.1, new T.MeshBasicMaterial({ color: 0xff4a3a })); o.ph.frustumCulled = false; o.fl = mk.particles(40, 0.08, new T.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.6 })); o.fl.frustumCulled = false;
      o.beam = mk.beam(V3(LXL - 0.5, LY, 0), V3(-17, LY, 0), 0xff3b2f, 0.14); o.spot = mk.soft(0xff3b2f, 2.6, -17, LY, 0, 0.0); o.wall = mk.box(0.3, 5, 6, M.matte(0x2a2d35, 0.9), -17.4, LY, 0);
      o.pl = new T.PointLight(0x9fb8ff, 0, 14, 1.6); o.pl.position.set(0, LY + 1.2, 1.5); S.scene.add(o.pl); o.LY = LY;
    },
    reset(s, c) { s.init = false; },
    step(s, c, dt) { lstep(s, c, dt); },
    update(S, s, c) {
      const o = S.objs; if (!s.init) linit(s); const LY = o.LY, n2 = s.atoms.filter((a) => a.e).length; o.n2 = n2;
      s.atoms.forEach((a, i) => { const m = o.atoms[i]; m.position.set(a.x, LY + a.y, a.z); m.material.emissive.setHex(a.e ? 0xffa010 : 0x000000); m.material.emissiveIntensity = a.e ? 1.8 : 0; m.material.color.setHex(a.e ? 0xffc040 : 0x5a1520); m.scale.setScalar(a.e ? 1.25 : 1); });
      for (let i = 0; i < 220; i++) { const p = s.ph[i]; if (p) o.ph.set(i, p.x, LY + p.y * 0.5, p.z * 0.5, 1); else o.ph.set(i, 0, -50, 0, 0.0001); } o.ph.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < 40; i++) { const f = s.flash[i]; if (f) o.fl.set(i, f.x, LY + f.y * 1.3 + f.t * 1.5 * Math.sign(f.y || 1), f.z * 1.3, 1 - f.t / 0.4); else o.fl.set(i, 0, -50, 0, 0.0001); } o.fl.instanceMatrix.needsUpdate = true;
      const br = clamp(s.rate / 5, 0, 1); setBeam(S, o.beam, V3(LXL - 0.5, LY, 0), V3(-17, LY, 0), br * 1 + 0.001); o.beam.visible = br > 0.03; o.beam.userData.core.scale.set(1 + br * 2, 1, 1); o.spot.visible = br > 0.03; o.spot.material.opacity = br * 0.9;
      const pw = clamp(c.pump / 20, 0, 1); o.lamp.material.opacity = 0.2 + 0.65 * pw * (0.8 + 0.2 * Math.sin(S.t * 30)); o.lglow.material.opacity = 0.35 * pw; o.lglow.visible = true; o.pl.intensity = 30 * pw; o.lasing = br > 0.15 && s.ph.length > 8;
      S.aim([-3, 3.2, 0], 24, 0.0, 0.1);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, n2 = o.n2 || 0, n1 = NA_ - n2, inv = n2 > n1;
      H.pill(ctx, 14, 26, "pump → population inversion (N₂ > N₁) → stimulated emission → coherent light", "#ffd27a", 10); H.pill(ctx, 14, 48, `N₂ (excited) = ${n2}    N₁ (ground) = ${n1}    ${inv ? "INVERTED ✓" : "N₂ ≤ N₁ : absorbs more than it amplifies"}`, inv ? "#8df0be" : "#ff9d8a", 10);
      H.pill(ctx, 14, 70, `photons in cavity = ${s.ph.length}      output = ${f1(s.rate, 1)} photons/s`, "#cfe0ff", 10); H.pill(ctx, 14, 92, o.lasing ? "LASING: identical, in-phase photons → narrow, coherent beam" : "below threshold: spontaneous emission = random direction & phase", o.lasing ? "#ff8a7a" : "#9fb8d8", 10);
      const lab = (x, y, t, col, al) => { const q = S.proj(V3(x, y, 1)); H.pill(ctx, q.x, q.y, t, col, 10, al || "center"); }; lab(LXR + 0.4, o.LY + 2.3, "100 % mirror", "#e8f1ff"); lab(LXL - 0.5, o.LY + 2.3, "partial mirror (14 % out)", "#e8f1ff"); lab(0, o.LY - 2.6, "ruby rod + flash lamp (pump)", "#ffb0b0"); lab(-15, o.LY + 3.4, "laser beam", "#ff8a7a");
    },
    readouts(s, c) { const n2 = s.atoms ? s.atoms.filter((a) => a.e).length : 0; return [["Excited atoms", `${n2}/${NA_}`], ["Photons in cavity", `${s.ph ? s.ph.length : 0}`], ["Key property", "light emitted in phase (coherent)"], ["Condition", "population inversion N₂ > N₁"]]; },
  };
})();
