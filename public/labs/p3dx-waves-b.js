/* p3dx-waves-b.js — photoreal 3D scenes for T20–T22 simulations in p2d-waves.js (prism, optical instruments, eye, colour, sound). */
(function () {
  "use strict";
  const X = window.PX3; if (!X || !X.ready) return;
  const T = THREE, P = window.P3D, M = P.mat, H = P.hud, V = X.V, K = window.PK, TAU = Math.PI * 2;
  const clampv = (v, a, b) => Math.max(a, Math.min(b, v)), rad = (d) => (d * Math.PI) / 180;
  const lab = (ctx, S, p, t, col, dx, dy, sz) => X.lbl(ctx, S, p, t, col, dx, dy, sz);
  const lensGlass = () => new T.MeshPhysicalMaterial({ color: 0xdff2ff, roughness: 0.02, transparent: true, opacity: 0.38, clearcoat: 1, envMapIntensity: 1.8, depthWrite: false });
  const lens = (S, r, t) => { const m = new T.Mesh(new T.SphereGeometry(1, 40, 28), lensGlass()); m.scale.set(t, r, r); m.renderOrder = 4; S.scene.add(m); return m; };
  const beams = (mk, n, col, w) => Array.from({ length: n }, () => { const b = mk.beam(V(0, 0, 0), V(0, 0.01, 0), col, w); b.visible = false; return b; });
  const setB = (S, b, a, c) => { S.setBeam(b, a, c); };

  /* ---------- Prism: minimum deviation ---------- */
  const qx = (px) => (px - 200) * 0.012, qy = (py) => (300 - py) * 0.012;
  X.def("Prism — Angle of Minimum Deviation", {
    env: "dark", envOpts: { w: 12, d: 7 }, cam: [[0.1, 1.9, 7.8], [0.4, 1.5, 0]], shift: 118, hudOpt0: { bgAll: 1 },
    build(S, s, c, mk, o) { o.pr = null; o.b = beams(mk, 4, 0xffc040, 0.02); o.box = X.group(S); X.mesh(new T.BoxGeometry(0.5, 0.3, 0.3), M.matte(0x1b1e24, 0.4), o.box); X.mesh(new T.CircleGeometry(0.06, 20), M.emissive(0xfff0c0, 2), o.box, 0.251, 0, 0).rotation.y = Math.PI / 2; },
    update(S, s, c) {
      const o = S.objs; if (X.changed(S, "A" + c.A)) { X.clear(S, [o.pr]); const ap = [200, 70], hh = 230, half = rad(c.A / 2), sh = new T.Shape(); sh.moveTo(qx(ap[0]), qy(ap[1])); sh.lineTo(qx(ap[0] - hh * Math.tan(half)), qy(ap[1] + hh)); sh.lineTo(qx(ap[0] + hh * Math.tan(half)), qy(ap[1] + hh)); sh.closePath();
        const g = new T.ExtrudeGeometry(sh, { depth: 0.9, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 }); g.translate(0, 0, -0.45); o.pr = new T.Mesh(g, new T.MeshPhysicalMaterial({ color: 0xcfeeff, roughness: 0.02, transparent: true, opacity: 0.3, clearcoat: 1, envMapIntensity: 2, depthWrite: false, side: T.DoubleSide })); o.pr.renderOrder = 4; S.scene.add(o.pr); }
      const ap = [200, 70], hh = 230, half = rad(c.A / 2), L = [ap[0] - hh * Math.tan(half), ap[1] + hh], Rr = [ap[0] + hh * Math.tan(half), ap[1] + hh], nz = (v) => { const l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l]; }, dot = (a, b) => a[0] * b[0] + a[1] * b[1];
      const refr = (d, nn, eta) => { const ci = -dot(nn, d), k = 1 - eta * eta * (1 - ci * ci); if (k < 0) return null; const q = eta * ci - Math.sqrt(k); return nz([eta * d[0] + q * nn[0], eta * d[1] + q * nn[1]]); };
      const u1 = nz([L[0] - ap[0], L[1] - ap[1]]), o1 = [-u1[1], u1[0]], u2 = nz([Rr[0] - ap[0], Rr[1] - ap[1]]), o2 = [u2[1], -u2[0]], Pp = [ap[0] + u1[0] * hh * 0.55, ap[1] + u1[1] * hh * 0.55], inN = [-o1[0], -o1[1]], ii = rad(c.i), d1 = [inN[0] * Math.cos(ii) + inN[1] * Math.sin(ii), -inN[0] * Math.sin(ii) + inN[1] * Math.cos(ii)];
      const W = (p) => V(qx(p[0]), qy(p[1]), 0); o.b.forEach((b) => (b.visible = false)); const st = [Pp[0] - d1[0] * 170, Pp[1] - d1[1] * 170]; setB(S, o.b[0], W(st), W(Pp)); o.box.position.copy(W(st)); o.box.rotation.z = -Math.atan2(d1[1], d1[0]); o.P = W(Pp); o.n1 = o1;
      const d2 = refr(d1, o1, 1 / c.n); if (d2) { const den = dot(d2, o2), tt = ((ap[0] - Pp[0]) * o2[0] + (ap[1] - Pp[1]) * o2[1]) / den, Q = [Pp[0] + d2[0] * tt, Pp[1] + d2[1] * tt]; setB(S, o.b[1], W(Pp), W(Q)); const d3 = refr(d2, [-o2[0], -o2[1]], c.n);
        if (d3) setB(S, o.b[2], W(Q), W([Q[0] + d3[0] * 190, Q[1] + d3[1] * 190])); else { const rr = [d2[0] - 2 * dot(d2, o2) * o2[0], d2[1] - 2 * dot(d2, o2) * o2[1]]; setB(S, o.b[2], W(Q), W([Q[0] + rr[0] * 120, Q[1] + rr[1] * 120])); } o.tir = !d3; }
    },
    hud(ctx, s, c, S) { const o = S.objs; if (!o.P) return; const n = V(o.n1[0] * 0.5, -o.n1[1] * 0.5, 0); H.line(ctx, S, o.P.clone().sub(n), o.P.clone().add(n), "rgba(255,255,255,.45)", 1, [3, 3]); lab(ctx, S, o.P, "i₁ = " + c.i + "°", "#ffd27a", -70, -14, 10.5); if (o.tir) H.pill(ctx, 14, 390, "total internal reflection at the second face", "#ef7a6d", 10.5); },
  });

  /* ---------- Compound microscope & astronomical telescope on an optical bench ---------- */
  const ox = (px) => (px - 320) * 0.0092, oy = (py) => 1.6 + (200 - py) * 0.0092;
  X.def("Compound Microscope & Telescope", {
    env: "dark", envOpts: { w: 12, d: 7 }, cam: [[0, 2.2, 6.4], [0, 1.45, 0]], shift: [0, 62],
    build(S, s, c, mk, o) { X.mesh(new T.BoxGeometry(6, 0.12, 0.3), M.aluminium(), S.scene, 0, 0.5, 0); X.mesh(new T.BoxGeometry(6, 0.06, 0.32), M.matte(0x1b1e24, 0.4), S.scene, 0, 0.42, 0);
      o.L1 = lens(S, 0.45, 0.05); o.L2 = lens(S, 0.55, 0.05); o.posts = [0, 1].map(() => { const g = X.group(S); X.mesh(new T.CylinderGeometry(0.03, 0.03, 1, 12), M.chrome(), g, 0, 0.5, 0); X.mesh(new T.BoxGeometry(0.2, 0.08, 0.34), M.matte(0x22262d), g, 0, 0.04, 0); return g; });
      o.obj = mk.arrow(0xff4a3a, 0.025, 0.08); o.img = mk.arrow(0xffb703, 0.02, 0.07); o.b = beams(mk, 12, 0x7fe3da, 0.01); o.cf = mk.sphere(0.03, M.emissive(0xffb703, 1.5)); },
    update(S, s, c) {
      const o = S.objs, ax = 200, W = (x, y) => V(ox(x), oy(y), 0); o.b.forEach((b) => (b.visible = false)); let k = 0; const ray = (a, b) => { if (k < o.b.length) setB(S, o.b[k++], a, b); };
      const place = (m, post, x, h) => { m.position.set(ox(x), oy(ax), 0); m.scale.set(0.05, h * 0.0092, h * 0.0092); post.position.set(ox(x), 0.53, 0); post.scale.y = (oy(ax) - h * 0.0092 - 0.53) / 1; };
      if (c.m === 0) { const fo = Math.min(c.fo, 3), u = Math.max(c.u, fo * 1.05), v = (u * fo) / (u - fo), mo = v / u, sc = 22, xo = 120, xL1 = xo + u * sc, xI = Math.min(xL1 + v * sc, 600), xL2 = Math.min(xL1 + v * sc + c.fe * 0.8 * sc, 610);
        place(o.L1, o.posts[0], xL1, 50); place(o.L2, o.posts[1], xL2, 60); o.obj.visible = o.img.visible = true; o.cf.visible = false; S.setArrow(o.obj, W(xo, ax), V(0, 30 * 0.0092, 0), 1); S.setArrow(o.img, W(xI, ax), V(0, -30 * mo * 0.0092, 0), 1);
        ray(W(xo, ax - 30), W(xL1, ax - 30)); ray(W(xL1, ax - 30), W(xI, ax + 30 * mo)); ray(W(xo, ax - 30), W(xI, ax + 30 * mo)); o.lbl = [["objective", xL1, 50], ["eyepiece", xL2, 60], ["object", xo, -34], ["real image", xI, 30 * mo + 4]]; }
      else { const fo = Math.max(c.fo, 20), fe = c.fe, sc = 300 / (fo + fe), x1 = 80, x2 = x1 + (fo + fe) * sc, xf = x1 + fo * sc; place(o.L1, o.posts[0], x1, 70); place(o.L2, o.posts[1], x2, 40); o.obj.visible = o.img.visible = false; o.cf.visible = true; o.cf.position.copy(W(xf, ax));
        for (const dy of [-50, -20, 10]) { const ye = ax + 28 + ((x2 - xf) * (ax + 28 - (ax + dy))) / (xf - x1); ray(W(20, ax + dy - 12), W(x1, ax + dy)); ray(W(x1, ax + dy), W(xf, ax + 28)); ray(W(xf, ax + 28), W(x2, ye)); } o.lbl = [["objective (long f)", x1, 70], ["eyepiece (short f)", x2, 40], ["common focus", xf, -14]]; }
    },
    hud(ctx, s, c, S) { const o = S.objs; (o.lbl || []).forEach(([t, x, h]) => lab(ctx, S, V(ox(x), oy(200 - h) + 0.05, 0), t, "#c9d6ea", -30, -8, 9.5)); },
  });

  /* ---------- Defects of vision: eyeball cross-section ---------- */
  const vx = (px) => (px - 320) * 0.0105, vy = (py) => 1.75 + (200 - py) * 0.0105;
  X.def("Defects of Vision & Correction", {
    env: "dark", envOpts: { w: 12, d: 7 }, cam: [[0, 2.0, 5.6], [0, 1.65, 0]], shift: [-10, 62],
    build(S, s, c, mk, o) { const R = 80 * 0.0105, e = (o.eye = X.group(S, vx(400), vy(200), 0)); const scl = new T.Mesh(new T.SphereGeometry(R, 64, 40, Math.PI / 2, Math.PI), new T.MeshPhysicalMaterial({ color: 0xf4efe8, roughness: 0.4, clearcoat: 0.6, side: T.DoubleSide })); scl.rotation.y = Math.PI / 2; e.add(scl);
      const ret = new T.Mesh(new T.TorusGeometry(R * 0.96, 0.035, 10, 48, 1.8), new T.MeshStandardMaterial({ color: 0xc8303f, roughness: 0.6 })); ret.rotation.z = -0.9; e.add(ret);
      const cor = new T.Mesh(new T.SphereGeometry(R * 0.45, 32, 20), lensGlass()); cor.scale.set(0.35, 1, 1); cor.position.x = -R * 0.97; e.add(cor); o.lens = lens(S, 34 * 0.0105, 0.1); o.lens.position.set(vx(400 - 80 + 18), vy(200), 0);
      o.b = beams(mk, 9, 0x7fe3da, 0.009); o.fp = mk.sphere(0.04, M.emissive(0x5bd68c, 1.6)); o.spec = X.group(S, vx(300), vy(200), 0); X.mesh(new T.TorusGeometry(0.43, 0.02, 10, 40), M.matte(0x20242a), o.spec).rotation.y = Math.PI / 2; o.sl = []; },
    update(S, s, c) {
      const o = S.objs, ex = 400, ey = 200, R = 80, retina = ex + R - 3, lensX = ex - R + 18; let focus = retina; if (c.d === 1 && c.obj === 0) focus = retina - 40; if (c.d === 2 && c.obj === 1) focus = retina + 50; if (c.d === 2 && c.obj === 0) focus = retina + 10; if (c.d === 1 && c.obj === 1) focus = retina - 10; const fixed = c.cor === 1 && c.d > 0; if (fixed) focus = retina;
      o.spec.visible = fixed; if (X.changed(S, "sp" + c.d)) { X.clear(S, o.sl); o.sl = []; const pr = []; for (let i = 0; i <= 20; i++) { const y = (i / 20) * 0.42, th = c.d === 1 ? 0.02 + 0.06 * (y / 0.42) ** 2 : 0.08 - 0.06 * (y / 0.42) ** 2; pr.push(new T.Vector2(y, th)); } for (let i = 20; i >= 0; i--) pr.push(new T.Vector2(pr[i].x, -pr[i].y)); const g = new T.LatheGeometry(pr.map((p) => new T.Vector2(Math.max(0.001, p.x), p.y)), 48); g.rotateZ(Math.PI / 2); const m = new T.Mesh(g, new T.MeshPhysicalMaterial({ color: 0xffd38a, roughness: 0.05, transparent: true, opacity: 0.45, depthWrite: false, clearcoat: 1 })); m.renderOrder = 4; o.spec.add(m); o.sl.push(m); }
      o.b.forEach((b) => (b.visible = false)); let k = 0; const W = (x, y) => V(vx(x), vy(y), 0.02), ray = (a, b) => { if (k < o.b.length) setB(S, o.b[k++], a, b); };
      [-26, 0, 26].forEach((dy) => { const y0 = ey + dy; if (c.obj === 1) ray(W(60, ey), W(lensX, y0)); else ray(W(40, y0), W(lensX, y0)); ray(W(lensX, y0), W(Math.min(focus, retina + 60), ey + (focus > retina ? dy * (1 - (retina + 60 - lensX) / (focus - lensX)) * 0 : 0))); if (focus < retina) ray(W(focus, ey), W(retina, ey - (dy * (retina - focus)) / (focus - lensX))); });
      o.fp.position.copy(W(Math.min(focus, retina + 60), ey)); o.fp.material.emissive.set(focus === retina ? 0x5bd68c : 0xef5a4a); o.focus = focus; o.retina = retina;
    },
    hud(ctx, s, c, S) { lab(ctx, S, V(vx(400 + 80), vy(200), 0), "retina", "#ff8f9a", 8, 4, 10); lab(ctx, S, S.objs.lens.position, "eye lens", "#c9d6ea", -20, -50, 9.5); if (S.objs.spec.visible) lab(ctx, S, S.objs.spec.position, c.d === 1 ? "concave lens" : "convex lens", "#ffd27a", -30, 60, 10); },
  });

  /* ---------- Colours of objects under coloured light ---------- */
  const LIGHTS = [[1, 1, 1], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1]], OBJ = [["White shirt", [1, 1, 1]], ["Red tomato", [1, 0, 0]], ["Green leaf", [0, 1, 0]], ["Blue pen", [0, 0, 1]], ["Yellow banana", [1, 1, 0]], ["Black shoe", [0, 0, 0]]];
  X.def("Colours of Objects & Filters", {
    env: "dark", envOpts: { w: 12, d: 7, sun: 0.05, hemi: 0.02 }, envI: 0.02, cam: [[0, 3.6, 4.6], [0.1, 0.2, 0.1]], shift: 0,
    build(S, s, c, mk, o) { S.scene.traverse((q) => { if (q.isLight) q.intensity *= 0.05; });
      const lamp = X.group(S, -2.9, 2.6, 1.0); X.mesh(new T.CylinderGeometry(0.22, 0.3, 0.5, 32), M.matte(0x1d2026, 0.4), lamp).rotation.z = 1.1; o.lens = X.mesh(new T.CircleGeometry(0.2, 32), M.emissive(0xffffff, 2), lamp, 0.24, -0.12, 0); o.lens.rotation.y = Math.PI / 2; o.lens.rotation.x = -0.5;
      o.spot = new T.SpotLight(0xffffff, 120, 14, 0.62, 0.5, 1.2); o.spot.position.set(-2.8, 2.6, 1.0); o.spot.target.position.set(0.3, 0.2, -0.2); o.spot.castShadow = true; o.spot.shadow.mapSize.set(1024, 1024); S.scene.add(o.spot, o.spot.target);
      const m = (rf) => new T.MeshStandardMaterial({ color: new T.Color(rf[0] * 0.85 + 0.03, rf[1] * 0.85 + 0.03, rf[2] * 0.85 + 0.03), roughness: 0.55 }); o.pos = [];
      const P0 = (i) => V(-1.4 + (i % 3) * 1.5, 0, -0.5 + Math.floor(i / 3) * 1.2); OBJ.forEach(([n, rf], i) => { const p = P0(i); o.pos.push(p); const g = X.group(S, p.x, 0, p.z);
        if (i === 0) { X.mesh(new T.BoxGeometry(0.7, 0.08, 0.6), m(rf), g, 0, 0.04, 0); X.mesh(new T.BoxGeometry(0.3, 0.05, 0.2), m(rf), g, -0.42, 0.06, -0.1).rotation.y = 0.5; X.mesh(new T.BoxGeometry(0.3, 0.05, 0.2), m(rf), g, 0.42, 0.06, -0.1).rotation.y = -0.5; }
        if (i === 1) { X.mesh(new T.SphereGeometry(0.28, 40, 28), m(rf), g, 0, 0.26, 0).scale.y = 0.85; X.mesh(new T.ConeGeometry(0.06, 0.08, 6), m([0, 0.6, 0]), g, 0, 0.5, 0); }
        if (i === 2) { const sh = new T.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(0.35, 0.25, 0, 0.75); sh.quadraticCurveTo(-0.35, 0.25, 0, 0); const lf = X.mesh(new T.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: false }), m(rf), g, 0, 0.03, 0.3); lf.rotation.x = -Math.PI / 2; }
        if (i === 3) { const pen = X.mesh(new T.CylinderGeometry(0.04, 0.04, 0.8, 20), m(rf), g, 0, 0.05, 0); pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.4; }
        if (i === 4) { const ban = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([V(-0.35, 0.12, 0), V(-0.1, 0.07, 0.08), V(0.15, 0.08, 0.06), V(0.38, 0.18, -0.02)]), 30, 0.07, 14), m(rf)); ban.castShadow = true; g.add(ban); }
        if (i === 5) { X.mesh(new T.BoxGeometry(0.7, 0.18, 0.3), m(rf), g, 0, 0.09, 0); X.mesh(new T.BoxGeometry(0.3, 0.2, 0.28), m(rf), g, -0.2, 0.25, 0); }
        X.mesh(new T.BoxGeometry(1.2, 0.02, 1.0), M.matte(0x8a8a8a, 0.9), g, 0, 0.0, 0); }); },
    update(S, s, c) { const o = S.objs; let L = LIGHTS[c.L].slice(); if (c.F) L = L.map((v, i) => (i === c.F - 1 ? v : 0)); const on = L[0] + L[1] + L[2] > 0; o.spot.color.setRGB(L[0], L[1], L[2]); o.spot.intensity = on ? 120 : 0; o.lens.material.emissive.setRGB(L[0], L[1], L[2]); o.L = L; },
    hud(ctx, s, c, S) { const o = S.objs; if (!o.L) return; OBJ.forEach(([n, rf], i) => { const col = rf.map((v, k) => v * o.L[k]), looks = col[0] + col[1] + col[2] === 0 ? "black" : col[0] && col[1] && col[2] ? "white" : col[0] && col[1] ? "yellow" : col[0] && col[2] ? "magenta" : col[1] && col[2] ? "cyan" : col[0] ? "red" : col[1] ? "green" : "blue"; lab(ctx, S, o.pos[i].clone().add(V(0, i < 3 ? 0.6 : 0, i < 3 ? -0.45 : 0.5)), n + " → looks " + looks, "#ffd27a", -60, i < 3 ? -6 : 18, 9.5); });
      H.pill(ctx, 14, 26, "Lamp + " + ["no filter", "red filter", "green filter", "blue filter"][c.F], "#e6eef8", 11); },
  });

  /* ---------- Bell jar ---------- */
  X.def("Bell Jar — Sound Needs a Medium", {
    cam: [[0.3, 2.1, 6.2], [0.3, 1.5, 0]], shift: 118, hudOpt0: { bgAll: 1, extra: [X.bgr(452, 96, 166, 50)] },
    build(S, s, c, mk, o) { X.mesh(new T.CylinderGeometry(1.35, 1.4, 0.16, 64), M.matte(0x30343b, 0.4), S.scene, 0, 0.08, 0); const pr = []; for (let i = 0; i <= 30; i++) { const a = (i / 30) * (Math.PI / 2); pr.push(new T.Vector2(1.15 * Math.cos(a) + 0.001, 1.6 + 1.0 * Math.sin(a))); } pr.unshift(new T.Vector2(1.15, 0.16)); const jar = new T.Mesh(new T.LatheGeometry(pr, 64), M.glass()); jar.renderOrder = 3; S.scene.add(jar); X.mesh(new T.SphereGeometry(0.07, 16, 12), M.glass(), S.scene, 0, 2.62, 0);
      X.mesh(new T.CylinderGeometry(0.03, 0.03, 1.1, 12), M.steel(), S.scene, 0, 0.7, 0); o.gong = X.mesh(new T.SphereGeometry(0.28, 40, 20, 0, TAU, 0, Math.PI / 2), M.brass(), S.scene, 0, 1.25, 0); o.gong.rotation.x = Math.PI / 2; o.gong.position.z = -0.05; o.ham = mk.rod(V(0, 0, 0), V(0, 1, 0), 0.015, M.steel()); o.hb = mk.sphere(0.05, M.steel());
      mk.tube([[1.38, 0.08, 0], [1.9, 0.1, 0.1], [2.4, 0.2, 0.2]], 0.05, M.matte(0x1a1a1a)); X.mesh(new T.BoxGeometry(0.7, 0.6, 0.5), M.paint(0x2a5ad8), S.scene, 2.7, 0.3, 0.2);
      o.air = mk.particles(80, 0.025, M.matte(0x9fb6d0, 0.5)); const r = K.rnd(4); o.ap = Array.from({ length: 80 }, () => { const a = r() * TAU, rr = Math.sqrt(r()) * 1.0; return V(rr * Math.cos(a), 0.3 + r() * 2.1, rr * Math.sin(a)); });
      o.waves = [0, 1, 2, 3].map(() => { const m = new T.Mesh(new T.SphereGeometry(1, 32, 20), new T.MeshBasicMaterial({ color: 0x5fe0d0, transparent: true, opacity: 0.2, depthWrite: false, side: T.DoubleSide, wireframe: true })); m.position.set(0, 1.25, 0); S.scene.add(m); return m; }); },
    update(S, s, c) { const o = S.objs, loud = clampv(c.P / 100, 0, 1), t = s.t || 0, n = Math.round(loud * 80); o.ap.forEach((p, i) => o.air.set(i, p.x + 0.02 * Math.sin(t * 9 + i), i < n ? p.y : -5, p.z)); o.air.instanceMatrix.needsUpdate = true;
      const hx = 0.32 + 0.05 * Math.sin(t * 40); S.setRod(o.ham, V(0.3, 0.7, 0.05), V(hx, 1.28, 0.1)); o.hb.position.set(hx, 1.28, 0.1); o.waves.forEach((w, k) => { const R = 0.35 + ((t * 0.6 + k * 0.3) % 1.2); w.scale.setScalar(R); w.material.opacity = loud * 0.25 * (1 - (R - 0.35) / 1.2); }); },
    hud(ctx, s, c, S) { lab(ctx, S, V(2.7, 0.65, 0.2), "to vacuum pump", "#c9d6ea", -40, -6, 10); lab(ctx, S, V(0, 1.25, 0.3), "electric bell", "#ffd27a", 30, -40, 10); },
  });

  /* ---------- Speed of sound in different media ---------- */
  const MED = [["Air", 331, "gas", 0], ["Hydrogen", 1270, "gas", 0], ["Water", 1480, "liquid", 0x2a6ab8], ["Sea water", 1530, "liquid", 0x1e5a8a], ["Wood", 3850, "solid", 0], ["Concrete", 3400, "solid", 0], ["Steel", 5960, "solid", 0]];
  X.def("Speed of Sound in Solids, Liquids & Gases", {
    cam: [[0, 2.3, 7.4], [0.25, 2.05, 0]], shift: [40, 40],
    build(S, s, c, mk, o) { o.rows = MED.map(([n, v, ph, col], i) => { const y = 3.6 - i * 0.5, g = X.group(S, 0, y, 0); let m;
        if (ph === "gas") { m = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 3.2, 32, 1, true), M.glass(i === 1 ? 0xffe8f0 : 0xeef8ff)); m.rotation.z = Math.PI / 2; m.renderOrder = 3; g.add(m); }
        else if (ph === "liquid") { m = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 3.2, 32, 1, true), M.glass()); m.rotation.z = Math.PI / 2; m.renderOrder = 3; g.add(m); const w = X.mesh(new T.CylinderGeometry(0.1, 0.1, 3.2, 24), M.water(col), g); w.rotation.z = Math.PI / 2; w.renderOrder = 2; }
        else { const mat = n === "Wood" ? M.wood() : n === "Concrete" ? M.matte(0x9a958c, 0.95) : M.steel(); m = X.mesh(n === "Steel" ? new T.BoxGeometry(3.2, 0.14, 0.12) : new T.BoxGeometry(3.2, 0.2, 0.2), mat, g); }
        const p = mk.sphere(0.07, M.emissive(0xffb703, 1.6)); g.add(p); return { g, p, y }; }); X.mesh(new T.BoxGeometry(0.06, 3.6, 0.06), M.paint(0xd23a2a), S.scene, -1.65, 2.1, 0); X.mesh(new T.BoxGeometry(0.06, 3.6, 0.06), M.paint(0x2bb04a), S.scene, 1.65, 2.1, 0); },
    update(S, s, c) { const o = S.objs, va = 331 + 0.6 * c.th; o.rows.forEach((r, i) => { const v = i === 0 ? va : MED[i][1], pr = clampv((v * (s.t || 0)) / c.d, 0, 1); r.p.position.x = -1.6 + pr * 3.2; r.p.material.emissive.set(pr >= 1 ? 0x5bd68c : 0xffb703); r.v = v; }); },
    hud(ctx, s, c, S) { S.objs.rows.forEach((r, i) => { if (!r.v) return; lab(ctx, S, V(-1.7, r.y, 0), MED[i][0], "#e6eef8", -8 - MED[i][0].length * 7.4, 4, 10.5); lab(ctx, S, V(1.7, r.y, 0), K.f(r.v, 0) + " m/s · " + K.f(c.d / r.v, 3) + " s", "#c9d6ea", 6, 4, 9.5); }); lab(ctx, S, V(-1.65, 3.95, 0), "hammer blow", "#ff8f80", -40, -4, 9.5); lab(ctx, S, V(1.65, 3.95, 0), c.d + " m away", "#5bd68c", -30, -4, 9.5); },
  });

  /* ---------- Pitch, loudness and quality: CRO ---------- */
  X.def("Pitch, Loudness & Quality — Music vs Noise", {
    cam: [[0.2, 1.9, 5.4], [0.1, 1.45, 0]], shift: 120,
    build(S, s, c, mk, o) { const cro = X.group(S, 0.45, 0, 0); X.mesh(new T.BoxGeometry(2.6, 1.7, 1.4), M.plastic(0xd9d4c8, 0.45), cro, 0, 1.15, 0); X.mesh(new T.BoxGeometry(1.7, 1.25, 0.06), M.matte(0x1a1d22, 0.5), cro, -0.3, 1.2, 0.71);
      o.cv = document.createElement("canvas"); o.cv.width = 512; o.cv.height = 360; o.tex = new T.CanvasTexture(o.cv); o.tex.colorSpace = T.SRGBColorSpace; const scr = new T.Mesh(new T.PlaneGeometry(1.55, 1.09), new T.MeshBasicMaterial({ map: o.tex, toneMapped: false })); scr.position.set(-0.3, 1.2, 0.745); cro.add(scr);
      for (let i = 0; i < 6; i++) X.mesh(new T.CylinderGeometry(0.07, 0.07, 0.08, 24), M.matte(0x22252b, 0.4), cro, 0.85 + (i % 2) * 0.25, 1.65 - Math.floor(i / 2) * 0.32, 0.72).rotation.x = Math.PI / 2;
      const src = (o.src = [0, 1, 2, 3, 4].map(() => X.group(S, -2.3, 0, 0.3)));
      X.mesh(new T.BoxGeometry(0.9, 0.35, 0.5), M.wood(), src[0], 0, 0.18, 0); [-0.06, 0.06].forEach((x) => X.mesh(new T.BoxGeometry(0.05, 0.9, 0.06), M.steel(), src[0], x, 0.9, 0)); X.mesh(new T.CylinderGeometry(0.03, 0.03, 0.25, 12), M.steel(), src[0], 0, 0.4, 0);
      const fl = X.mesh(new T.CylinderGeometry(0.05, 0.05, 1.8, 24), M.chrome(), src[1], 0, 1.0, 0); fl.rotation.z = 1.2; for (let i = 0; i < 6; i++) X.mesh(new T.CylinderGeometry(0.018, 0.018, 0.02, 12), M.matte(0x111111), src[1], -0.4 + i * 0.16, 0.85 + i * 0.06, 0.05).rotation.x = Math.PI / 2;
      [[src[2], 0x7a3a12, 0.35], [src[3], 0xb07838, 0.5]].forEach(([g, col, w]) => { const b = X.mesh(new T.SphereGeometry(w, 40, 28), new T.MeshPhysicalMaterial({ color: col, roughness: 0.3, clearcoat: 1 }), g, 0, 0.8, 0); b.scale.set(0.8, 1.15, 0.22); X.mesh(new T.BoxGeometry(0.1, 1.1, 0.06), M.matte(0x2a1a0a, 0.6), g, 0, 1.75, 0); X.mesh(new T.CircleGeometry(w * 0.25, 24), M.matte(0x111111), g, 0, 0.9, w * 0.23); });
      const car = mk.car(0xd8402e); car.scale.setScalar(0.45); src[4].add(car); },
    update(S, s, c) { const o = S.objs, t = s.t || 0, g = o.cv.getContext("2d"), W = 512, Hh = 360; o.src.forEach((q, i) => (q.visible = i === c.q)); if (c.q === 0) o.src[0].children.forEach((m, i) => { if (i === 1 || i === 2) m.position.x = (i === 1 ? -0.06 : 0.06) + (i === 1 ? -1 : 1) * 0.008 * Math.sin(t * 60) * c.A; });
      g.fillStyle = "#04120a"; g.fillRect(0, 0, W, Hh); g.strokeStyle = "rgba(91,214,140,.18)"; g.lineWidth = 1; for (let i = 1; i < 10; i++) { g.beginPath(); g.moveTo((i * W) / 10, 0); g.lineTo((i * W) / 10, Hh); g.stroke(); } for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(0, (i * Hh) / 8); g.lineTo(W, (i * Hh) / 8); g.stroke(); }
      const r = K.rnd(Math.floor(t * 20)); g.strokeStyle = "#7dff9a"; g.shadowColor = "#5bd68c"; g.shadowBlur = 10; g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= 400; x += 2) { const ph = (TAU * c.f * x) / 40000, y = c.q === 4 ? (r() - 0.5) * 2 : S.variant.wave(c.q, ph + t * 2), px = (x / 400) * W, py = Hh / 2 - y * c.A * Hh * 0.42; x ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); g.shadowBlur = 0; g.fillStyle = "#7dff9a"; g.font = "18px monospace"; g.fillText("1 ms/div", 10, 24); o.tex.needsUpdate = true; },
    hud(ctx, s, c, S) { lab(ctx, S, V(-2.3, 0.05, 0.6), ["Tuning fork", "Flute", "Violin", "Guitar", "Traffic noise"][c.q], "#ffd27a", -40, 22, 10.5); lab(ctx, S, V(0.15, 2.0, 0.7), "cathode-ray oscilloscope (CRO)", "#c9d6ea", -90, -10, 10); },
  });

  /* ---------- Resonance tube ---------- */
  X.def("Resonance Tube — Speed of Sound & End Correction", {
    cam: [[0.2, 2.1, 6.4], [0.1, 1.95, 0]], shift: 120, hudOpt0: { bgAll: 1, extra: [X.bgr(452, 30, 166, 46)] },
    build(S, s, c, mk, o) { const jar = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 3.3, 48, 1, true), M.glass()); jar.position.y = 1.65; jar.renderOrder = 3; S.scene.add(jar); X.mesh(new T.CylinderGeometry(0.55, 0.55, 0.08, 48), M.matte(0x2a2f37), S.scene, 0, 0.04, 0); o.w = new T.Mesh(new T.CylinderGeometry(0.48, 0.48, 1, 48), M.water(0x2a6ab8)); o.w.renderOrder = 2; S.scene.add(o.w);
      o.tube = null; o.fork = X.group(S, 0, 3.95, 0); X.mesh(new T.CylinderGeometry(0.025, 0.025, 0.3, 12), M.steel(), o.fork, 0, 0.55, 0); o.pr = [-1, 1].map((k) => X.mesh(new T.BoxGeometry(0.04, 0.5, 0.05), M.steel(), o.fork, k * 0.08, 0.2, 0)); o.wave = null; },
    update(S, s, c) { const o = S.objs, fq = [256, 320, 384, 512][c.fk], v = 331 + 0.6 * c.th, lam = (v / fq) * 100, e = 0.3 * c.d, l1 = lam / 4 - e, l2 = (3 * lam) / 4 - e, amp = (l) => { const d1 = Math.min(Math.abs(l - l1), Math.abs(l - l2)); return Math.exp(-(d1 * d1) / 4); }, A = amp(c.l), sc = 0.028, top = 3.65, t = s.t || 0, r = c.d * 0.04;
      if (X.changed(S, "d" + c.d)) { X.clear(S, [o.tube, o.inw]); o.tube = new T.Mesh(new T.CylinderGeometry(r + 0.012, r + 0.012, 3.4, 40, 1, true), M.glass()); o.tube.position.y = top - 1.7; o.tube.renderOrder = 4; S.scene.add(o.tube); }
      const wl = top - c.l * sc; o.w.scale.y = Math.max(0.01, wl - 0.08); o.w.position.y = 0.08 + o.w.scale.y / 2; o.pr.forEach((p, k) => (p.position.x = (k ? 1 : -1) * (0.08 + 0.01 * Math.sin(t * 70)))); o.fork.position.y = top + 0.2;
      X.clear(S, [o.wave]); o.wave = null; if (A > 0.05) { const pts = []; for (let y = 0; y <= c.l * sc; y += 0.04) { const xcm = c.l - y / sc; pts.push(V(r * 0.85 * Math.cos((TAU * xcm) / lam) * Math.sin(t * 20) * A, top - y, 0)); } if (pts.length > 2) { o.wave = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), pts.length * 2, 0.012, 6), M.emissive(0xffb703, 1.4)); S.scene.add(o.wave); } }
      o.l1 = l1; o.l2 = l2; o.top = top; o.sc = sc; o.wl = wl; o.fq = fq; },
    hud(ctx, s, c, S) { const o = S.objs; if (o.l1 == null) return; [[o.l1, "1st"], [o.l2, "2nd"]].forEach(([L, n]) => { if (L > 0 && L < 115) { const y = o.top - L * o.sc; H.line(ctx, S, V(0.55, y, 0), V(0.85, y, 0), "#7fe3da", 1.5); lab(ctx, S, V(0.85, y, 0), n + " resonance " + K.f(L, 1) + " cm", "#7fe3da", 4, 4, 10); } });
      lab(ctx, S, V(0, o.top + 0.8, 0), o.fq + " Hz fork", "#c9d6ea", 12, -4, 10); lab(ctx, S, V(0.5, o.wl, 0), "water level · l = " + c.l + " cm", "#9fd0ff", 8, 18, 10); },
  });
})();
