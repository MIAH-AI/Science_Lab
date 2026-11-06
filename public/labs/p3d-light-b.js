/* p3d-light-b.js — prism dispersion, pinhole camera, periscope (three.js). Needs p3d-light.js (P.util.optics). */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready || !P.util.optics) return;
  const T = window.THREE, { V3 } = P.util, M = P.mat, H = P.hud, S_ = P.scenes, O = P.util.optics, setBeam = O.setBeam;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;

  /* visible wavelength (nm) → hex colour (Bruton) */
  function wl2hex(w) {
    let r = 0, g = 0, b = 0;
    if (w < 440) { r = -(w - 440) / 60; b = 1; } else if (w < 490) { g = (w - 440) / 50; b = 1; } else if (w < 510) { g = 1; b = -(w - 510) / 20; } else if (w < 580) { r = (w - 510) / 70; g = 1; } else if (w < 645) { r = 1; g = -(w - 645) / 65; } else r = 1;
    const k = w < 420 ? 0.35 + (0.65 * (w - 380)) / 40 : w > 700 ? 0.35 + (0.65 * (780 - w)) / 80 : 1;
    const c = (x) => Math.round(255 * Math.pow(Math.max(0, x * k), 0.8));
    return (c(r) << 16) | (c(g) << 8) | c(b);
  }

  /* ================= PRISM DISPERSION ================= */
  const NM = 1.52, A_ = rad(60), AP = V3(0, 0, -2.6), BL = V3(-3, 0, 2.6), BR = V3(3, 0, 2.6);
  const NL = V3(-0.866, 0, -0.5), NR = V3(0.866, 0, -0.5), XS = 9, PY = 0.8;
  const cauchy = (nm) => 1.5046 + 0.0042 / ((nm / 1000) * (nm / 1000));
  const refr = (d, N, n1, n2) => { const eta = n1 / n2, ci = -d.dot(N), k = 1 - eta * eta * (1 - ci * ci); if (k < 0) return null; return d.clone().multiplyScalar(eta).addScaledVector(N, eta * ci - Math.sqrt(k)); };
  const iInc = Math.asin(NM * Math.sin(rad(30))), d0 = V3(Math.cos(rad(30) - iInc), 0, Math.sin(rad(30) - iInc)), H1 = V3(-1.5, 0, 0);
  function trace(n) { const din = refr(d0, NL, 1, n); if (!din) return null; const t = AP.clone().sub(H1).dot(NR) / din.dot(NR), H2 = H1.clone().addScaledVector(din, t), dout = refr(din, NR.clone().negate(), n, 1); if (!dout) return { din, H2, dout: null }; return { din, H2, dout, dev: Math.acos(clamp(d0.dot(dout), -1, 1)) }; }
  const nAt = (k, nm) => NM + k * (cauchy(nm) - cauchy(550));
  function spreadAt(k) { const a = trace(nAt(k, 400)), b = trace(nAt(k, 700)); if (!a || !b || !a.dout || !b.dout) return 99; return deg(Math.abs(a.dev - b.dev)); }
  const calc = (() => { let key = null, val = null; return (sp) => { if (key === sp) return val; let lo = 0.05, hi = 80; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (spreadAt(mid) < sp) lo = mid; else hi = mid; } const k = (lo + hi) / 2; key = sp; val = { k, nr: nAt(k, 700), nv: nAt(k, 400), real: spreadAt(1) }; return val; }; })();
  const WLS = [400, 420, 440, 460, 480, 500, 520, 540, 560, 580, 600, 620, 640, 660, 680, 700];

  S_["Prism Dispersion"] = {
    env: "dark", envOpts: { w: 30, d: 20 }, cam: [[1, 17, 8], [1, 0, 0.5]], fov: 36,
    build(S, s, c) {
      O.clearFog(S);
      const mk = S.mk, o = S.objs, sh = new T.Shape(); sh.moveTo(AP.x, AP.z); sh.lineTo(BL.x, BL.z); sh.lineTo(BR.x, BR.z); sh.closePath();
      const g = new T.ExtrudeGeometry(sh, { depth: 1.5, bevelEnabled: false }); g.rotateX(Math.PI / 2); g.translate(0, 1.55, 0);
      o.prism = new T.Mesh(g, new T.MeshPhysicalMaterial({ color: 0xd9f0ff, transparent: true, opacity: 0.42, roughness: 0.03, clearcoat: 1, ior: 1.52, side: T.DoubleSide, depthWrite: false, envMapIntensity: 1.6 })); o.prism.renderOrder = 2; S.scene.add(o.prism);
      const e = new T.LineSegments(new T.EdgesGeometry(g, 20), new T.LineBasicMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.7 })); S.scene.add(e);
      o.inc = mk.beam(V3(), V3(1, 0, 0), 0xffffff, 0.07); o.ins = WLS.map((w) => mk.beam(V3(), V3(1, 0, 0), wl2hex(w), 0.035)); o.outs = WLS.map((w) => mk.beam(V3(), V3(1, 0, 0), wl2hex(w), 0.045));
      o.dots = []; for (let i = 0; i < 41; i++) o.dots.push(mk.soft(wl2hex(400 + (300 * i) / 40), 1.1, XS - 0.1, PY, 0, 0.55));
      o.screen = mk.box(0.15, 1.1, 24, M.matte(0xe9e9e4, 0.9), XS + 0.1, 0.55, 2.5);
      const S0 = H1.clone().addScaledVector(d0, -7.5); o.lamp = mk.box(1.6, 0.9, 1.0, M.paint(0x24272e), S0.x, 0.55, S0.z); o.lamp.rotation.y = -Math.atan2(d0.z, d0.x); o.lamp.position.addScaledVector(d0, -0.6);
      o.lens = mk.cyl(0.32, 0.32, 0.3, M.glass(0xffffff), S0.x, PY, S0.z); o.lens.rotation.z = Math.PI / 2; o.lens.rotation.y = -Math.atan2(d0.z, d0.x); o.S0 = S0;
      o.base = mk.box(6, 0.1, 5.4, M.matte(0x1b1f27, 0.5), 0, 0.02, 0.2); o.cl = {}; o.Hn = [];
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c) {
      const o = S.objs, k = calc(c.spread).k; setBeam(S, o.inc, o.S0.clone().setY(PY), H1.clone().setY(PY), 1);
      const pts = [], zs = [];
      WLS.forEach((w, i) => { const r = trace(nAt(k, w)), bi = o.ins[i], bo = o.outs[i]; if (!r || !r.dout || r.dout.x <= 0.01) { bi.visible = bo.visible = false; return; } const t = (XS - r.H2.x) / r.dout.x, E = r.H2.clone().addScaledVector(r.dout, t);
        setBeam(S, bi, H1.clone().setY(PY), r.H2.clone().setY(PY), 0.7); setBeam(S, bo, r.H2.clone().setY(PY), E.setY(PY), 1); });
      o.dots.forEach((d, i) => { const w = 400 + (300 * i) / 40, r = trace(nAt(k, w)); if (!r || !r.dout || r.dout.x <= 0.01) { d.visible = false; return; } const t = (XS - r.H2.x) / r.dout.x, E = r.H2.clone().addScaledVector(r.dout, t); d.visible = true; d.position.set(XS - 0.05, PY, E.z); if (i === 0) o.zV = E.z; if (i === 40) o.zR = E.z; });
      { const zv = Math.max(0, o.zV || 0); S.aim([1.0, 0, 1.0 + zv * 0.4], 25, 0.0, 1.22); }
    },
    overlay(ctx, s, c, w, h, S) {
      const cc = calc(c.spread); H.pill(ctx, 14, 26, "n(λ) = A + B/λ²   (Cauchy: short λ bends more)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `δ = i + e − A     A = 60°     spread R→V = ${c.spread}°`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, `n(red) = ${f1(cc.nr, 3)}   n(violet) = ${f1(cc.nv, 3)}   (dispersion ×${f1(cc.k, 0)} exaggerated)`, "#8df0be", 9.5); H.pill(ctx, 14, 92, `real crown glass spreads only ≈ ${f1(cc.real, 1)}° — exaggerated for visibility`, "#9fb8d8", 9.5);
      const lab = (x, z, t, col, al) => { const q = S.proj(V3(x, PY, z)); H.pill(ctx, q.x, q.y, t, col, 10.5, al || "center"); };
      lab(XS - 0.6, S.objs.zR - 0.7, "RED", "#ff7a6b", "right"); lab(XS - 0.6, S.objs.zV + 0.7, "VIOLET", "#b58aff", "right"); lab(-4.2, 3.3, "white light", "#eef4fa"); lab(0, 3.6, "glass prism", "#9fd8ff");
    },
    readouts(s, c) { const cc = calc(c.spread); return [["Least deviated", "Red"], ["Most deviated", "Violet"], ["n(red) / n(violet)", `${f1(cc.nr, 3)} / ${f1(cc.nv, 3)}`], ["Dispersion angle", `${c.spread}°`], ["Cause", "n(violet) > n(red) in glass"]]; },
  };

  /* ================= PINHOLE CAMERA ================= */
  const PX = 0.03, PAX = 3.6;
  S_["Pinhole Camera & Shadows"] = {
    env: "dark", envOpts: { w: 30, d: 10 }, cam: [[1, 5.5, 19], [1, 3.3, 0]], fov: 36,
    build(S, s, c) {
      O.clearFog(S);
      const mk = S.mk, o = S.objs, wall = M.matte(0x16181d, 0.7);
      o.up = new T.Mesh(new T.BoxGeometry(0.2, 1, 3.4), wall); o.dn = new T.Mesh(new T.BoxGeometry(0.2, 1, 3.4), wall); S.scene.add(o.up, o.dn);
      o.plt = new T.Mesh(new T.BoxGeometry(1, 0.12, 3.4), wall); o.plb = new T.Mesh(new T.BoxGeometry(1, 0.12, 3.4), wall); o.plt.position.y = 7.1; o.plb.position.y = 0.2; S.scene.add(o.plt, o.plb);
      o.side = new T.Mesh(new T.BoxGeometry(1, 6.9, 0.04), new T.MeshPhysicalMaterial({ color: 0x9fb8d8, transparent: true, opacity: 0.1, roughness: 0.1, depthWrite: false })); o.side.position.set(0, 3.65, 1.7); S.scene.add(o.side);
      o.scr = new T.Mesh(new T.BoxGeometry(0.08, 6.8, 3.4), new T.MeshStandardMaterial({ color: 0xf6f3ea, roughness: 0.95, transparent: true, opacity: 0.55, depthWrite: false })); S.scene.add(o.scr);
      o.obj = O.candle(S, false); o.img = O.candle(S, true, 0x9fe8ff); o.tbl = mk.box(44, 0.2, 9, M.wood(), 0, -0.1, 0);
      o.hole = mk.sphere(0.04, M.emissive(0xffffff, 1), 0, PAX, 0);
      const bm = (col, w) => mk.beam(V3(), V3(1, 0, 0), col, w); o.r = [0xffb703, 0x7fe3da, 0xff7a6b].map((col) => ({ a: bm(col, 0.035), b: bm(col, 0.035) })); o.fan = [0, 1, 2, 3, 4, 5].map(() => bm(0xffe2a8, 0.012));
      o.sig = "";
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c) {
      const o = S.objs, ho = c.objHeight * PX, a = 100 * PX, b = c.boxLength * PX, k = b / a, s0 = ho / 1.5, hi = ho * k;
      [o.up, o.dn].forEach((m) => m.position.x = 0); const hole = 0.07, top = 7.1, bot = 0.2; o.up.scale.y = top - PAX - hole; o.up.position.y = PAX + hole + (top - PAX - hole) / 2; o.dn.scale.y = PAX - hole - bot; o.dn.position.y = bot + (PAX - hole - bot) / 2;
      [o.plt, o.plb].forEach((m) => { m.scale.x = b + 0.3; m.position.x = b / 2; }); o.side.scale.x = b; o.side.position.x = b / 2; o.scr.position.set(b, 3.65, 0);
      o.obj.position.set(-a, PAX, 0); o.obj.scale.setScalar(s0); o.img.position.set(b, PAX, 0); o.img.scale.set(s0 * k, -s0 * k, 0.12);
      const A = V3(-a, PAX + ho, 0), Mid = V3(-a, PAX + ho / 2, 0), B0 = V3(-a, PAX, 0), Hh = V3(0, PAX, 0); const ends = [A, Mid, B0];
      o.r.forEach((r, i) => { const P0 = ends[i], d = Hh.clone().sub(P0).normalize(), t = b / d.x, E = P0.clone().addScaledVector(d, t); setBeam(S, r.a, P0, Hh, 1); setBeam(S, r.b, Hh, E, 1); });
      o.fan.forEach((g, i) => { const y = PAX + (i - 2.5) * 0.9; setBeam(S, g, A, V3(-0.12, y, 0), 0.45); });
      o.exceeds = hi > 3.4; S.aim([(b - a) / 2, 3.4, 0], clamp(Math.max(16, (a + b + 5) / 1.0), 16, 34), 0.0, 0.1);
    },
    overlay(ctx, s, c, w, h, S) {
      const ho = c.objHeight, a = 100, b = c.boxLength, hi = (ho * b) / a;
      H.pill(ctx, 14, 26, "light travels in straight lines  →  image through pinhole is INVERTED", "#ffd27a", 10); H.pill(ctx, 14, 48, "hᵢ / hₒ = b / a      (similar triangles at the pinhole)", "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, `hᵢ = ${ho} px × ${b}/${a} = ${f1(hi, 0)} px     m = b/a = ${f1(b / a, 2)}`, "#8df0be", 10.5); H.pill(ctx, 14, 92, S.objs.exceeds ? "image taller than the screen — cropped" : "longer box → bigger, dimmer image;  smaller hole → sharper", S.objs.exceeds ? "#ff9d8a" : "#9fb8d8", 9.5);
      const lab = (x, y, t, col) => { const q = S.proj(V3(x, y, 1.0)); H.pill(ctx, q.x, q.y, t, col, 10.5, "center"); }; lab(-a * 0.03, 0.4, `object a = ${a} px`, "#ffb703"); lab(0, 1.0, "pinhole", "#e8f1ff"); lab(b * 0.03, 0.4, `screen b = ${b} px`, "#7fe3da");
    },
    readouts(s, c) { return [["Image", "Inverted, real"], ["Cause", "light travels in straight lines through the pinhole"], ["Magnification", `${f1(c.boxLength / 100, 2)}`], ["Image height", `${f1((c.objHeight * c.boxLength) / 100, 0)} px`]]; },
  };

  /* ================= PERISCOPE ================= */
  S_["Periscope"] = {
    env: "dark", envOpts: { w: 34, d: 10 }, cam: [[-1, 6, 24], [-1, 5, 0]], fov: 36,
    build(S, s, c) {
      O.clearFog(S);
      const mk = S.mk, o = S.objs; o.tube = new T.Group(); S.scene.add(o.tube); o.sig = "";
      o.gnd = mk.box(44, 0.3, 12, M.matte(0x2b3a26, 0.95), 0, -0.15, 0);
      o.wall = new T.Mesh(new T.BoxGeometry(1.2, 1, 4), new T.MeshStandardMaterial({ color: 0x9a5b45, roughness: 0.9 })); S.scene.add(o.wall); o.pole = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 1, 12), M.steel()); S.scene.add(o.pole);
      o.ball = mk.sphere(0.5, M.plastic(0xe83030, 0.15), -7, 3, 0); o.ball.castShadow = true;
      o.m1 = new T.Mesh(new T.BoxGeometry(2.2 * Math.SQRT2 * 0.5, 0.06, 1.5), new T.MeshPhysicalMaterial({ color: 0xf2f4f7, metalness: 1, roughness: 0.02, clearcoat: 1 })); o.m1.rotation.z = -Math.PI / 4; o.m2 = o.m1.clone(); S.scene.add(o.m1, o.m2);
      o.eye = new T.Group(); const ew = mk.sphere(0.45, M.matte(0xf2f2f0, 0.3), 0, 0, 0); S.scene.remove(ew); o.eye.add(ew); const ir = new T.Mesh(new T.SphereGeometry(0.2, 18, 12), M.matte(0x2b6fa8, 0.3)); ir.position.x = -0.32; ir.scale.set(0.4, 1, 1); o.eye.add(ir); const pu = new T.Mesh(new T.SphereGeometry(0.1, 12, 8), M.matte(0x050505, 0.2)); pu.position.x = -0.4; pu.scale.set(0.3, 1, 1); o.eye.add(pu); S.scene.add(o.eye);
      const bm = (col) => mk.beam(V3(), V3(1, 0, 0), col, 0.06); o.b = [bm(0xffb703), bm(0xffb703), bm(0xffb703)];
      o.ray = mk.beam(V3(), V3(1, 0, 0), 0xff5a5a, 0.015);
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c) {
      const o = S.objs, Hh = c.height * 0.03, yB = 1.6, yT = yB + Hh, sig = `${Hh}`;
      if (o.sig !== sig) { o.sig = sig; while (o.tube.children.length) { const m = o.tube.children.pop(); m.geometry.dispose(); }
        const gm = new T.MeshPhysicalMaterial({ color: 0x5c7291, transparent: true, opacity: 0.22, roughness: 0.2, metalness: 0.4, side: T.DoubleSide, depthWrite: false }), g = new T.BoxGeometry(2.6, Hh + 1.6, 1.8), m = new T.Mesh(g, gm); m.position.set(0, (yT + yB) / 2, 0); o.tube.add(m);
        const e = new T.LineSegments(new T.EdgesGeometry(g), new T.LineBasicMaterial({ color: 0xa9c4e6 })); e.position.copy(m.position); o.tube.add(e);
        [[-1.3, yT], [1.3, yB]].forEach(([x, y]) => { const w = new T.Mesh(new T.TorusGeometry(0.0001, 0, 3, 3), gm); w.visible = false; o.tube.add(w); }); }
      o.m1.position.set(0, yT, 0); o.m2.position.set(0, yB, 0); o.wall.scale.y = yT - 0.8; o.wall.position.set(-3.8, (yT - 0.8) / 2, 0); o.pole.scale.y = yT - 0.5; o.pole.position.set(-7, (yT - 0.5) / 2, 0); o.ball.position.set(-7, yT, 0); o.eye.position.set(3.9, yB, 0);
      setBeam(S, o.b[0], V3(-6.5, yT, 0), V3(0, yT, 0), 1); setBeam(S, o.b[1], V3(0, yT, 0), V3(0, yB, 0), 1); setBeam(S, o.b[2], V3(0, yB, 0), V3(3.4, yB, 0), 1);
      setBeam(S, o.ray, V3(3.4, yB, 0), V3(-3.2, yB + (yT - yB) * (6.6 / 10.4), 0), 0.25); o.yT = yT; o.yB = yB;
      S.aim([-1.5, (yT + 0.8) / 2 + 1.8, 0], Math.max(20, (yT + 4.5) / 0.55), 0.0, 0.08);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, Hh = c.height * 0.03; H.pill(ctx, 14, 26, "two PARALLEL plane mirrors at 45° to the tube axis", "#ffd27a", 10.5); H.pill(ctx, 14, 48, "i = r = 45° at each mirror  →  ray turned through 90° twice", "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, `path = a + H + b     H = ${c.height} px → ${f1(Hh, 1)} u     image: virtual, upright, same size`, "#8df0be", 9.5); H.pill(ctx, 14, 92, "direct line of sight blocked by the wall → see over it", "#9fb8d8", 9.5);
      const lab = (x, y, t, col, al) => { const q = S.proj(V3(x, y, 1.0)); H.pill(ctx, q.x, q.y, t, col, 10.5, al || "center"); }; lab(-7, o.yT + 1.1, "object", "#ff9d8a"); lab(1.3, o.yT + 0.9, "mirror 1 (45°)", "#e8f1ff", "left"); lab(-1.5, o.yB - 1.0, "mirror 2 (45°)", "#e8f1ff", "right"); lab(3.9, o.yB - 1.0, "eye", "#cfe0ff"); lab(-3.8, (o.yT - 0.8) / 2, "wall", "#cba08f");
    },
    readouts(s, c) { return [["Mirror angle", "45° each (parallel)"], ["Total deviation", "90° + 90° (path shifted down & across)"], ["Image", "Virtual, upright, same size"], ["Used in", "submarines, viewing over obstacles"]]; },
  };
})();
