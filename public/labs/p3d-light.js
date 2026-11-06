/* p3d-light.js — geometrical optics on a 3-D optical bench: mirrors, refraction, lenses (three.js). */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready) return;
  const T = window.THREE, { TAU, V3 } = P.util, M = P.mat, H = P.hud, S_ = P.scenes;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rad = (d) => (d * Math.PI) / 180, deg = (r) => (r * 180) / Math.PI;
  const CM = 0.25;          // 1 cm = 0.25 scene units on the optical bench

  /* a lit candle (height 1.5 u, base at y = 0). ghost → translucent additive “image” version */
  function candle(S, ghost, tint) {
    const g = new T.Group(), mat = ghost ? new T.MeshBasicMaterial({ color: tint || 0xffe2a8, toneMapped: false, transparent: true, opacity: 0.75, blending: T.AdditiveBlending, depthWrite: false }) : M.matte(0xf3ead4, 0.55);
    const body = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 1.1, 24), mat); body.position.y = 0.55; body.castShadow = !ghost; g.add(body);
    const wick = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.1, 6), ghost ? mat : M.matte(0x111111, 0.9)); wick.position.y = 1.15; g.add(wick);
    const fl = new T.Mesh(new T.SphereGeometry(0.11, 14, 10), new T.MeshBasicMaterial({ color: ghost ? 0xffd070 : 0xffb347, transparent: true, opacity: ghost ? 0.7 : 0.95, blending: T.AdditiveBlending, depthWrite: false })); fl.scale.set(0.8, 2.0, 0.8); fl.position.y = 1.32; g.add(fl);
    const halo = S.mk.soft(0xffa24a, ghost ? 0.7 : 1.0, 0, 1.32, 0, ghost ? 0.4 : 0.55); S.scene.remove(halo); g.add(halo);
    if (!ghost) { const l = new T.PointLight(0xffa24a, 6, 8, 1.6); l.position.y = 1.4; g.add(l); }
    S.scene.add(g); g.top = 1.5; return g;
  }
  const beamI = (g, k) => { g.userData.core.material.opacity = 0.95 * k; g.userData.halo.material.opacity = 0.28 * k; };
  const setBeam = (S, g, a, b, k) => { if (!a || !b || a.distanceTo(b) < 1e-4) { g.visible = false; return; } S.setBeam(g, a, b); if (k != null) beamI(g, k); };
  const rail = (S, x0, x1, y) => { const m = S.mk.box(x1 - x0, 0.2, 0.7, M.matte(0x2a2e36, 0.4), (x0 + x1) / 2, y, 0); for (let x = Math.ceil(x0); x <= x1; x += 1) { const t = new T.Mesh(new T.BoxGeometry(0.02, 0.012, 0.3), M.matte(0xcfcfcf, 0.4)); t.position.set(x, y + 0.106, 0.2); S.scene.add(t); } return m; };
  const holder = (S, x, y0, y1) => S.mk.rod(V3(x, y0, 0), V3(x, y1, 0), 0.05, M.steel(), 10);

  /* ================= PLANE & CURVED MIRRORS ================= */
  const AX = 4.6, RY = 0.35;
  /* smooth camera framing: centre/zoom follow the span of objects on the bench */
  function frame(S, o, lo, hi, minD) { const span = hi - lo + 6, d = clamp(span / 1.0, minD, 40), cx = (lo + hi) / 2; if (o.cd == null) { o.cd = d; o.cx = cx; } o.cd += (d - o.cd) * 0.12; o.cx += (cx - o.cx) * 0.12; S.aim([o.cx, AX + 0.3, 0], o.cd, 0.0, 0.12); }
  S_["Plane & Curved Mirrors"] = {
    env: "dark", envOpts: { w: 30, d: 9 }, cam: [[-5, 7, 20], [-5, 4.9, 0]], fov: 36,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; rail(S, -17, 4, RY); S.mk.box(40, 0.3, 7, M.wood(), -5, RY - 0.25, 0); o.ax = mk.rod(V3(-17, AX, -0.3), V3(5, AX, -0.3), 0.012, M.glow(0x9fb8d8, 0.55), 6); o.mir = new T.Group(); S.scene.add(o.mir); o.sig = "";
      o.obj = candle(S, false); o.hold = holder(S, 0, RY, AX); o.img = candle(S, true, 0x9fe8ff); o.ih = holder(S, 0, RY, AX); o.ih.visible = false;
      o.bm = [0xff6b6b, 0x59f08a, 0x6bb6ff].map((col) => ({ inc: S.mk.beam(V3(), V3(1, 0, 0), col, 0.03), out: S.mk.beam(V3(), V3(1, 0, 0), col, 0.03), ext: S.mk.beam(V3(), V3(1, 0, 0), col, 0.012) }));
      o.mk = ["F", "C", "P"].map(() => mk.sphere(0.07, M.emissive(0xffd27a, 1.2), 0, AX, 0));
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c) {
      const o = S.objs, type = c.type, fcm = type === 2 ? -c.f : c.f, u = c.u, uu = u * CM, h = 1.5, yP = AX + h;
      const R = type === 0 ? 1e9 : 2 * Math.abs(fcm) * CM, hm = Math.min(3.6, 0.95 * R), sig = `${type}|${c.f}`;
      const xs = (y) => (type === 0 ? 0 : type === 1 ? -R + Math.sqrt(R * R - (y - AX) * (y - AX)) : R - Math.sqrt(R * R - (y - AX) * (y - AX)));
      if (o.sig !== sig) { o.sig = sig; while (o.mir.children.length) { const m = o.mir.children.pop(); m.geometry.dispose(); }
        let mesh; if (type === 0) { mesh = new T.Mesh(new T.BoxGeometry(0.22, 4.8, 1.8), M.chrome()); mesh.position.set(0.11, AX, 0); mesh.material = new T.MeshPhysicalMaterial({ color: 0xf2f4f7, metalness: 1, roughness: 0.02, clearcoat: 1 }); }
        else { const sh = new T.Shape(), n = 28, ph = Math.asin(hm / R), sg = type === 1 ? 1 : -1, tk = 0.22; const pts = [];
          for (let i = 0; i <= n; i++) { const a = -ph + (2 * ph * i) / n; pts.push([sg === 1 ? -R + R * Math.cos(a) : R - R * Math.cos(a), AX + R * Math.sin(a)]); }
          sh.moveTo(pts[0][0], pts[0][1]); pts.forEach((p) => sh.lineTo(p[0], p[1])); for (let i = n; i >= 0; i--) sh.lineTo(pts[i][0] + tk, pts[i][1]);
          const g = new T.ExtrudeGeometry(sh, { depth: 1.8, bevelEnabled: false, curveSegments: 4 }); g.translate(0, 0, -0.9); mesh = new T.Mesh(g, new T.MeshPhysicalMaterial({ color: 0xf2f4f7, metalness: 1, roughness: 0.03, clearcoat: 1 })); }
        mesh.castShadow = true; o.mir.add(mesh); }
      o.obj.position.set(-uu, AX, 0); o.hold.visible = true; S.setRod(o.hold, V3(-uu, RY + 0.1, 0), V3(-uu, AX - 0.02, 0));
      const Fx = type === 1 ? -c.f * CM : type === 2 ? c.f * CM : 0; // focus x (concave in front, convex behind)
      const A0 = V3(-uu, AX + h, 0), rays = [], hy = (y) => V3(Math.abs(y - AX) <= hm ? xs(y) : 0, y, 0);
      if (type === 0) { [0, h * 1.7].forEach((dy) => { const hit = V3(0, AX + dy, 0), din = hit.clone().sub(A0); rays.push({ hit, dout: V3(-din.x, din.y, 0).normalize() }); }); }
      else { const hit1 = hy(yP), F = V3(Fx, AX, 0); rays.push({ hit: hit1, dout: type === 1 ? F.clone().sub(hit1).normalize() : hit1.clone().sub(F).normalize() });
        const vx = V3(0, AX, 0), din = vx.clone().sub(A0); rays.push({ hit: vx, dout: V3(-din.x, din.y, 0).normalize() });
        const yF = AX + (yP - AX) * (0 - Fx) / (-uu - Fx); rays.push({ hit: hy(yF), dout: V3(-1, 0, 0) }); }
      let v = null, m = null; if (type === 0) { v = -u; m = 1; } else { const inv = 1 / fcm - 1 / u; if (Math.abs(inv) > 1e-4) { v = 1 / inv; m = -v / u; } }
      o.v = v; o.m = m; const real = v !== null && v > 0 && type !== 0, haveI = v !== null && Math.abs(v) < 90;
      const I = haveI ? V3(-v * CM, AX + m * h, 0) : null, pcol = type === 0 ? [0xff6b6b, 0x59f08a] : [0xff6b6b, 0x59f08a, 0x6bb6ff];
      o.bm.forEach((b, i) => { const r = rays[i]; if (!r) { b.inc.visible = b.out.visible = b.ext.visible = false; return; }
        const col = new T.Color(pcol[i]); [b.inc, b.out, b.ext].forEach((g) => { g.userData.core.material.color.copy(col.clone().lerp(new T.Color(0xffffff), 0.5)); g.userData.halo.material.color.copy(col); });
        setBeam(S, b.inc, A0, r.hit, 1);
        const len = real && I ? r.hit.distanceTo(I) + 2.5 : 9; setBeam(S, b.out, r.hit, r.hit.clone().addScaledVector(r.dout, len), 1);
        if (!real && I) setBeam(S, b.ext, r.hit, I, 0.4); else b.ext.visible = false; });
      if (haveI) { const mm = Math.abs(m); o.img.visible = true; o.img.position.set(I.x, AX, 0); o.img.scale.set(mm, (m < 0 ? -1 : 1) * mm, mm); } else o.img.visible = false;
      const Cx = type === 1 ? -R : R; o.mk[0].position.set(Fx, AX, 0); o.mk[1].position.set(Cx, AX, 0); o.mk[2].position.set(0, AX, 0); o.mk[0].visible = o.mk[1].visible = type !== 0; o.Fx = Fx; o.Cx = Cx; o.R = R;
      const lo = Math.min(-uu, I ? I.x : -uu, Fx, 0), hi = Math.max(-uu, I ? I.x : -uu, Fx, 0, type === 0 ? uu : 0); frame(S, o, lo, hi, 19);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, type = c.type, fcm = type === 2 ? -c.f : c.f, u = c.u; const names = ["PLANE", "CONCAVE", "CONVEX"];
      H.pill(ctx, 14, 26, type === 0 ? "plane mirror: image as far behind as object in front" : `${names[type]} mirror   1/f = 1/u + 1/v   (real-is-positive)`, "#ffd27a", 10);
      if (type === 0) { H.pill(ctx, 14, 48, "v = −u  (virtual)   m = +1   upright, same size", "#8df0be", 10.5); H.pill(ctx, 14, 70, "angle of incidence i = angle of reflection r", "#cfe0ff", 10.5); }
      else { const v = o.v; H.pill(ctx, 14, 48, `f = ${fcm > 0 ? "+" : "−"}${c.f} cm      u = ${u} cm      R = 2f = ${2 * c.f} cm`, "#cfe0ff", 10.5);
        if (v === null) { H.pill(ctx, 14, 70, "u = f → reflected rays parallel: image at infinity", "#ffb870", 10.5); } else { const real = v > 0; H.pill(ctx, 14, 70, `v = ${f1(v, 1)} cm   m = −v/u = ${f1(o.m, 2)}   → ${real ? "REAL, inverted" : "VIRTUAL, upright"}${Math.abs(o.m) > 1.02 ? ", magnified" : Math.abs(o.m) < 0.98 ? ", diminished" : ", same size"}`, real ? "#8df0be" : "#9fd8ff", 10); } }
      const lab = (x, t, col) => { const q = S.proj(V3(x, AX - 0.5, 0.6)); H.pill(ctx, q.x, q.y, t, col, 10, "center"); };
      if (type !== 0) { lab(o.Fx, "F", "#ffd27a"); lab(type === 1 ? -o.R : o.R, "C", "#ffd27a"); } lab(0, "P", "#e8f1ff");
      const k = S.proj(V3(-4.2, 0.05, 1.6)); H.pill(ctx, 14, 92, "● ray ∥ axis   ● ray via pole   ● ray via F      (1 cm = 0.25 u)".replace(/\(1 cm.*\)/, ""), "#cfe0ff", 9.5);
    },
    readouts(s, c) { if (c.type === 0) return [["Image type", "Virtual, upright"], ["Image distance", "= object distance (behind mirror)"], ["Magnification", "1"]]; const f = c.type === 1 ? c.f : -c.f, u = c.u, inv = 1 / f - 1 / u; if (Math.abs(inv) < 1e-4) return [["Image", "at infinity (u = f)"]]; const v = 1 / inv, m = -v / u; return [["Image distance v", `${f1(Math.abs(v), 1)} cm`], ["Magnification", `${f1(Math.abs(m), 2)}`], ["Image", v > 0 ? "Real, inverted" : "Virtual, upright"], ["Focal length", `${f > 0 ? "+" : "−"}${c.f} cm (R = ${2 * c.f} cm)`]]; },
  };

  /* ================= REFRACTION — SNELL'S LAW ================= */
  const fres = (n1, n2, ti) => { const si = Math.sin(ti) * n1 / n2; if (si >= 1) return 1; const tt = Math.asin(si), ci = Math.cos(ti), ct = Math.cos(tt); const rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct), rp = (n2 * ci - n1 * ct) / (n2 * ci + n1 * ct); return 0.5 * (rs * rs + rp * rp); };
  const BY = 0.5;
  S_["Refraction — Snell's Law"] = {
    env: "dark", envOpts: { w: 22, d: 16 }, cam: [[0, 15, 6], [0, 0, 1.5]], fov: 36,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.blk = new T.Group(); S.scene.add(o.blk); o.sig = "";
      const mkb = (col) => S.mk.beam(V3(), V3(1, 0, 0), col, 0.05); o.bi = mkb(0xffb703); o.br = mkb(0x7fe3da); o.bx = mkb(0xff7a6b); o.bo = mkb(0xffb703); o.bt = mkb(0x7fe3da);
      o.nl = mk.rod(V3(0, 0.12, -6), V3(0, 0.12, 6), 0.012, M.glow(0xffffff, 0.5), 6); o.nl2 = mk.rod(V3(0, 0.12, 3), V3(0, 0.12, 6), 0.012, M.glow(0xffffff, 0.5), 6);
      o.lamp = mk.box(1.4, 0.7, 0.9, M.paint(0x24272e), 0, 0.35, 0); mk.cyl(0.14, 0.14, 0.5, M.matte(0x111111, 0.6), 0, 0.5, 0).visible = false;
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c) {
      const o = S.objs, n = c.n2, dir = c.dir || 0, sig = `${dir}|${n}`;
      if (o.sig !== sig) { o.sig = sig; while (o.blk.children.length) { const m = o.blk.children.pop(); m.geometry.dispose(); }
        const gm = new T.MeshPhysicalMaterial({ color: new T.Color(0xcfeeff).lerp(new T.Color(0x7fc4ff), clamp((n - 1) / 1.5, 0, 1)), transparent: true, opacity: 0.38, roughness: 0.04, clearcoat: 1, ior: n, side: T.DoubleSide, depthWrite: false, envMapIntensity: 1.4 });
        let m; if (dir === 0) m = new T.Mesh(new T.BoxGeometry(18, 0.9, 4), gm), m.position.set(0, 0.5, 2); else { const sh = new T.Shape(); sh.moveTo(-6, 0); sh.absarc(0, 0, 6, Math.PI, 0, true); sh.lineTo(-6, 0); const g = new T.ExtrudeGeometry(sh, { depth: 0.9, bevelEnabled: false, curveSegments: 48 }); g.rotateX(Math.PI / 2); g.translate(0, 0.95, 0); m = new T.Mesh(g, gm); }
        m.renderOrder = 2; o.blk.add(m); const e = new T.LineSegments(new T.EdgesGeometry(m.geometry, 20), new T.LineBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.6 })); e.position.copy(m.position); o.blk.add(e); }
      const th = rad(c.angle), Y = BY, O = V3(0, Y, 0), Lb = 8; o.bx.visible = false;
      if (dir === 0) { const s2 = Math.sin(th) / n, t2 = Math.asin(s2), Rf = fres(1, n, th); const src = V3(-Lb * Math.sin(th), Y, -Lb * Math.cos(th)); setBeam(S, o.bi, src, O, 1); const th2 = t2, tk = 4, E = V3(tk * Math.tan(th2), Y, tk); setBeam(S, o.br, O, E, 1 - Rf);
        setBeam(S, o.bo, E, E.clone().add(V3(5.5 * Math.sin(th), 0, 5.5 * Math.cos(th))), 1 - Rf); o.br.userData.core.material.color.set(0x7fe3da); setBeam(S, o.bt, O, V3(Lb * Math.sin(th), Y, -Lb * Math.cos(th)), Math.max(0.05, Rf * 3)); o.bt.visible = Rf > 0.004; o.bx.visible = false; o.E = E; o.th2 = th2; o.Rf = Rf; o.tir = false; o.lamp.position.set(src.x - Math.sin(th) * 0.6, 0.35, src.z - Math.cos(th) * 0.6); o.lamp.rotation.y = th; }
      else { const s2 = n * Math.sin(th), src = V3(-6 * Math.sin(th), Y, 6 * Math.cos(th)); setBeam(S, o.bi, src, O, 1); o.tir = s2 >= 0.9999; if (!o.tir) { const t2 = Math.asin(s2), Rf = fres(n, 1, th); setBeam(S, o.br, O, V3(Lb * Math.sin(t2), Y, -Lb * Math.cos(t2)), 1 - Rf); setBeam(S, o.bt, O, V3(6 * Math.sin(th), Y, 6 * Math.cos(th)), Math.max(0.06, Rf * 3)); o.bt.visible = Rf > 0.004; o.th2 = t2; o.Rf = Rf; }
        else { setBeam(S, o.bt, O, V3(6 * Math.sin(th), Y, 6 * Math.cos(th)), 1); o.br.visible = false; o.th2 = null; o.Rf = 1; } o.bo.visible = false; o.lamp.position.set(src.x - Math.sin(th) * 0.6, 0.35, src.z + Math.cos(th) * 0.6); o.lamp.rotation.y = -th; }
      S.aim([0, 0, dir === 0 ? 1.4 : 0.8], dir === 0 ? 23 : 19, 0.0, 1.25);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, n = c.n2, dir = c.dir || 0, th = rad(c.angle), crit = deg(Math.asin(clamp(1 / n, 0, 1)));
      const p = (x, z, t, col, al) => { const q = S.proj(V3(x, 0.5, z)); H.pill(ctx, q.x, q.y, t, col, 10.5, al || "left"); };
      if (dir === 0) { H.pill(ctx, 14, 26, "n₁ sinθ₁ = n₂ sinθ₂   (Snell's law)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `1.00 × sin ${c.angle}° = ${f1(n, 2)} × sin ${f1(deg(o.th2), 1)}°`, "#8df0be", 10.5); H.pill(ctx, 14, 70, `speed in glass v = c/n = ${f1(3 / n, 2)}×10⁸ m/s  → bends toward the normal`, "#cfe0ff", 9.5);
        H.pill(ctx, 14, 92, `reflected: ${f1(o.Rf * 100, 1)} %   transmitted: ${f1((1 - o.Rf) * 100, 1)} %  (Fresnel)`, "#9fb8d8", 9.5); p(-Math.sin(th) * 2.3 - 0.3, -Math.cos(th) * 2.3, `θ₁ = ${c.angle}°`, "#ffb703", "right"); p(Math.sin(o.th2) * 2.0 + 0.3, Math.cos(o.th2) * 2.0, `θ₂ = ${f1(deg(o.th2), 1)}°`, "#7fe3da"); p(0.3, -3.2, "air n₁ = 1.00", "#e8f1ff"); p(-8.5, 3.4, `glass n₂ = ${f1(n, 2)}`, "#9fd8ff"); }
      else { H.pill(ctx, 14, 26, "glass → air:  n sinθ_g = sinθ_a   critical angle sinθ_c = 1/n", "#ffd27a", 10); H.pill(ctx, 14, 48, `θ_c = sin⁻¹(1/${f1(n, 2)}) = ${f1(crit, 1)}°`, "#8df0be", 10.5);
        H.pill(ctx, 14, 70, o.tir ? `θ_g = ${c.angle}° ≥ θ_c → TOTAL INTERNAL REFLECTION` : `θ_g = ${c.angle}° < θ_c → refracts away from normal: ${f1(deg(o.th2), 1)}°`, o.tir ? "#ff9d8a" : "#cfe0ff", 10); H.pill(ctx, 14, 92, o.tir ? "100 % reflected — used in prisms & optical fibres" : `reflected ${f1(o.Rf * 100, 1)} %  transmitted ${f1((1 - o.Rf) * 100, 1)} %`, "#9fb8d8", 9.5); p(-Math.sin(th) * 3.5, Math.cos(th) * 3.5, `θ_g = ${c.angle}°`, "#ffb703", "right"); if (!o.tir) p(Math.sin(o.th2) * 3, -Math.cos(o.th2) * 3, `θ_a = ${f1(deg(o.th2), 1)}°`, "#7fe3da"); p(0.3, -3.2, "air", "#e8f1ff"); p(-5.5, 5.4, `glass n = ${f1(n, 2)}`, "#9fd8ff"); }
    },
    readouts(s, c) { const n = c.n2, th = rad(c.angle), dir = c.dir || 0, crit = deg(Math.asin(clamp(1 / n, 0, 1))); if (dir === 0) { const t2 = Math.asin(Math.sin(th) / n); return [["Critical angle (glass→air)", `${f1(crit, 1)}°`], ["Refraction angle θ₂", `${f1(deg(t2), 1)}°`], ["n (glass)", `${n}`], ["Speed in glass", `${f1(3 / n, 2)}×10⁸ m/s`]]; } const s2 = n * Math.sin(th); return [["Critical angle", `${f1(crit, 1)}°`], ["Emergent angle", s2 < 1 ? `${f1(deg(Math.asin(s2)), 1)}°` : "TIR — none"], ["n (glass)", `${n}`]]; },
  };

  /* ================= CONVEX LENS RAY DIAGRAM ================= */
  S_["Convex Lens — Ray Diagram"] = {
    env: "dark", envOpts: { w: 36, d: 9 }, cam: [[2, 7, 22], [2, 4.9, 0]], fov: 36,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; rail(S, -17, 17, RY); S.mk.box(44, 0.3, 7, M.wood(), 0, RY - 0.25, 0); o.ax = mk.rod(V3(-17, AX, -0.3), V3(17, AX, -0.3), 0.012, M.glow(0x9fb8d8, 0.55), 6); o.lens = new T.Group(); S.scene.add(o.lens); o.sig = "";
      o.obj = candle(S, false); o.hold = holder(S, 0, RY, AX); o.img = candle(S, true, 0x9fe8ff); o.lh = holder(S, 0, RY, AX - 2.6); o.fr = new T.Mesh(new T.TorusGeometry(2.55, 0.07, 10, 48), M.matte(0x2a2e36, 0.4)); o.fr.rotation.y = Math.PI / 2; S.scene.add(o.fr);
      o.bm = [0xff6b6b, 0x59f08a, 0x6bb6ff].map((col) => ({ inc: S.mk.beam(V3(), V3(1, 0, 0), col, 0.03), out: S.mk.beam(V3(), V3(1, 0, 0), col, 0.03), ext: S.mk.beam(V3(), V3(1, 0, 0), col, 0.012) })); o.mk = [0, 1].map(() => mk.sphere(0.07, M.emissive(0xffd27a, 1.2), 0, AX, 0));
      o.scr = new T.Mesh(new T.PlaneGeometry(4.4, 4.0), new T.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.9, transparent: true, opacity: 0.0, side: T.DoubleSide })); o.scr.rotation.y = Math.PI / 2; S.scene.add(o.scr);
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c) {
      const o = S.objs, u = c.u, f = c.f, uu = u * CM, fu = f * CM, h = 1.5, yP = AX + h, Rr = fu, hl = Math.min(2.3, 0.92 * Rr), sig = `${c.f}`;
      if (o.sig !== sig) { o.sig = sig; while (o.lens.children.length) { const m = o.lens.children.pop(); m.geometry.dispose(); } const sag = Rr - Math.sqrt(Rr * Rr - hl * hl), pts = [], n = 22;
        for (let i = 0; i <= n; i++) { const r = (hl * i) / n; pts.push(new T.Vector2(r, Rr - Math.sqrt(Rr * Rr - r * r) - sag)); } for (let i = n; i >= 0; i--) { const r = (hl * i) / n; pts.push(new T.Vector2(r, -(Rr - Math.sqrt(Rr * Rr - r * r) - sag))); }
        const g = new T.LatheGeometry(pts, 64); g.rotateZ(-Math.PI / 2); const m = new T.Mesh(g, new T.MeshPhysicalMaterial({ color: 0xcfeaff, transparent: true, opacity: 0.4, roughness: 0.02, clearcoat: 1, ior: 1.5, side: T.DoubleSide, depthWrite: false, envMapIntensity: 1.6 })); m.renderOrder = 3; m.position.set(0, AX, 0); o.lens.add(m); o.fr.scale.setScalar(hl / 2.55); o.fr.position.set(0, AX, 0); o.fr.geometry.dispose(); o.fr.geometry = new T.TorusGeometry(hl + 0.04, 0.08, 10, 48); o.fr.scale.setScalar(1); S.mk; o.hl = hl; }
      o.obj.position.set(-uu, AX, 0); S.setRod(o.hold, V3(-uu, RY + 0.1, 0), V3(-uu, AX - 0.02, 0)); S.setRod(o.lh, V3(0, RY + 0.1, 0), V3(0, AX - o.hl - 0.05, 0));
      const A0 = V3(-uu, yP, 0), hit1 = V3(0, yP, 0), cen = V3(0, AX, 0), yF = AX + (yP - AX) * fu / (fu - uu), hit3 = V3(0, yF, 0), Fp = V3(fu, AX, 0);
      const d1 = Fp.clone().sub(hit1).normalize(), d2 = cen.clone().sub(A0).normalize(), d3 = V3(1, 0, 0), hit = [hit1, cen, hit3], dout = [d1, d2, d3], cols = [0xff6b6b, 0x59f08a, 0x6bb6ff];
      const inv = 1 / f - 1 / u, v = Math.abs(inv) < 1e-4 ? null : 1 / inv, m = v === null ? null : v / u; o.v = v; o.m = m;
      o.bm.forEach((b, i) => { const col = new T.Color(cols[i]); [b.inc, b.out, b.ext].forEach((g) => { g.userData.core.material.color.copy(col.clone().lerp(new T.Color(0xffffff), 0.5)); g.userData.halo.material.color.copy(col); }); const a = i === 1 ? A0 : A0; setBeam(S, b.inc, a, hit[i], 1);
        let end; if (v !== null && v > 0) { const I = V3(v * CM, AX - m * h, 0); end = I.clone().addScaledVector(I.clone().sub(hit[i]).normalize(), 2.2); b.ext.visible = false; } else { end = hit[i].clone().addScaledVector(dout[i], 14); if (v !== null) { const I = V3(v * CM, AX - m * h, 0); setBeam(S, b.ext, hit[i], I, 0.35); } else b.ext.visible = false; } setBeam(S, b.out, hit[i], end, 1); });
      if (v !== null && Math.abs(v) < 90) { const ix = v * CM, mm = Math.abs(m); o.img.visible = true; o.img.position.set(ix, AX, 0); o.img.scale.set(mm, (v > 0 ? -1 : 1) * mm, mm); o.scr.visible = v > 0; o.scr.position.set(ix + 0.05, AX - m * h / 2 * 0 + 0, 0); o.scr.material.opacity = v > 0 ? 0.28 : 0; } else { o.img.visible = false; o.scr.visible = false; }
      o.mk[0].position.set(-fu, AX, 0); o.mk[1].position.set(fu, AX, 0); { const ix = v !== null && Math.abs(v) < 90 ? v * CM : fu; frame(S, o, Math.min(-uu, -2 * fu, ix), Math.max(2 * fu, ix, 0), 22); }
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, u = c.u, f = c.f, v = o.v; H.pill(ctx, 14, 26, "thin lens:  1/f = 1/u + 1/v   (real-is-positive)", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `f = +${f} cm    u = ${u} cm    2f = ${2 * f} cm`, "#cfe0ff", 10.5);
      if (v === null) H.pill(ctx, 14, 70, "u = f → emergent rays parallel: image at infinity", "#ffb870", 10.5); else { const mm = o.m, real = v > 0; const sz = Math.abs(mm) > 1.02 ? "magnified" : Math.abs(mm) < 0.98 ? "diminished" : "same size"; H.pill(ctx, 14, 70, `v = ${f1(v, 1)} cm    m = v/u = ${f1(Math.abs(mm), 2)}  → ${real ? "REAL, inverted" : "VIRTUAL, upright"}, ${sz}`, real ? "#8df0be" : "#9fd8ff", 10); }
      H.pill(ctx, 14, 92, "● ray ∥ axis → F′   ● ray via centre   ● ray via F → ∥ axis", "#cfe0ff", 9.5);
      const lab = (x, t) => { const q = S.proj(V3(x, AX - 0.55, 0.5)); H.pill(ctx, q.x, q.y, t, "#ffd27a", 10, "center"); }; lab(-f * CM, "F"); lab(f * CM, "F′"); lab(-2 * f * CM, "2F"); lab(2 * f * CM, "2F′");
      if (u < f) H.pill(ctx, w - 14, 120, "u < f: magnifying glass (virtual image)", "#9fd8ff", 9.5, "right");
    },
    readouts(s, c) { const inv = 1 / c.f - 1 / c.u; if (Math.abs(inv) < 1e-4) return [["Image", "at infinity (u = f)"]]; const v = 1 / inv, m = v / c.u; return [["Image distance v", `${f1(Math.abs(v), 1)} cm`], ["Magnification", `${f1(Math.abs(m), 2)}`], ["Image", v > 0 ? "Real, inverted" : "Virtual, upright"], ["Power P = 1/f", `${f1(100 / c.f, 1)} D`]]; },
  };
})();
