/* p3d-grav.js — gravitation & electrostatics: orbital motion, escape velocity, satellite orbits, Coulomb's law, field lines (three.js). */
(function () {
  "use strict";
  const P = window.P3D; if (!P || !P.ready) return;
  const T = window.THREE, { V3, TAU } = P.util, M = P.mat, H = P.hud, S_ = P.scenes;
  const f1 = (v, d = 1) => (typeof fmt === "function" ? fmt(v, d) : v.toFixed(d));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const G = 6.674e-11, GME = 3.986e14, RE_KM = 6371;
  const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  const sci = (v, d = 2) => { if (!v) return "0"; const e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e); return `${(+m.toFixed(d)).toString()}×10${String(e).replace(/./g, (ch) => SUP[ch])}`; };

  /* ---------- procedural Earth-like planet ---------- */
  let TEX = null;
  function planetTex() {
    if (TEX) return TEX; const W = 512, Ht = 256, cv = document.createElement("canvas"); cv.width = W; cv.height = Ht; const ctx = cv.getContext("2d"), im = ctx.createImageData(W, Ht);
    const hash = (x, y, z) => { let h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
    const vn = (x, y, z) => { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf), l = (a, b, t) => a + (b - a) * t; return l(l(l(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), l(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v), l(l(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), l(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v), w); };
    for (let j = 0; j < Ht; j++) for (let i = 0; i < W; i++) { const lon = (i / W) * TAU, lat = (j / Ht - 0.5) * Math.PI, x = Math.cos(lat) * Math.cos(lon) * 2.2, y = Math.sin(lat) * 2.2, z = Math.cos(lat) * Math.sin(lon) * 2.2; let n = 0, a = 0.5, f = 1; for (let o = 0; o < 5; o++) { n += a * vn(x * f + 7, y * f + 3, z * f + 1); a *= 0.5; f *= 2.1; }
      const k = (j * W + i) * 4; let r, g, b; const polar = Math.abs(lat) / (Math.PI / 2);
      if (n < 0.5) { const d = clamp((0.5 - n) / 0.25, 0, 1); r = 10 + 20 * (1 - d); g = 50 + 60 * (1 - d); b = 110 + 70 * (1 - d); } else { const e = clamp((n - 0.5) / 0.25, 0, 1); r = 70 + 90 * e; g = 120 - 10 * e; b = 55 + 20 * e; if (e > 0.6) { r += 40; g += 40; b += 40; } if (polar > 0.82) { r = g = b = 235; } }
      if (polar > 0.9) { r = g = b = 240; } im.data[k] = r; im.data[k + 1] = g; im.data[k + 2] = b; im.data[k + 3] = 255; }
    ctx.putImageData(im, 0, 0); TEX = new T.CanvasTexture(cv); TEX.colorSpace = T.SRGBColorSpace; TEX.anisotropy = 4; return TEX;
  }
  function planet(S, R) {
    const g = new T.Group(), body = new T.Mesh(new T.SphereGeometry(R, 64, 48), new T.MeshStandardMaterial({ map: planetTex(), roughness: 0.75, metalness: 0 })); body.castShadow = false; g.add(body);
    const atm = new T.Mesh(new T.SphereGeometry(R * 1.05, 48, 32), new T.ShaderMaterial({ transparent: true, side: T.BackSide, depthWrite: false, blending: T.AdditiveBlending, uniforms: { c: { value: new T.Color(0x5aa8ff) } }, vertexShader: "varying vec3 n; varying vec3 v; void main(){ n=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); v=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }", fragmentShader: "uniform vec3 c; varying vec3 n; varying vec3 v; void main(){ float k=pow(0.72-dot(n,v),2.6); gl_FragColor=vec4(c,1.)*k*0.9; }" })); g.add(atm);
    S.scene.add(g); g.body = body; return g;
  }
  const satellite = (S, sc) => { const g = new T.Group(), foil = M.gold(), pan = new T.MeshPhysicalMaterial({ color: 0x1c3f8f, metalness: 0.6, roughness: 0.25, clearcoat: 1 }); const b = new T.Mesh(new T.BoxGeometry(0.5, 0.36, 0.36), foil); g.add(b); [-1, 1].forEach((sg) => { const p = new T.Mesh(new T.BoxGeometry(0.06, 0.02, 0.5), pan); p.position.set(0, 0, 0); const arm = new T.Mesh(new T.BoxGeometry(0.6, 0.02, 0.5), pan); arm.position.set(sg * 0.6, 0, 0); g.add(arm); const strut = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 0.2, 6), M.steel()); strut.rotation.z = Math.PI / 2; strut.position.set(sg * 0.3, 0, 0); g.add(strut); }); const dish = new T.Mesh(new T.SphereGeometry(0.2, 18, 10, 0, TAU, 0, 1.0), M.chrome()); dish.rotation.x = -Math.PI / 2; dish.position.set(0, 0, 0.25); dish.material.side = T.DoubleSide; g.add(dish); g.scale.setScalar(sc); S.scene.add(g); return g; };
  const ring = (S, r, col, op, seg = 160) => { const pts = []; for (let i = 0; i <= seg; i++) { const a = (i / seg) * TAU; pts.push(V3(Math.cos(a) * r, 0, Math.sin(a) * r)); } const l = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: col, transparent: true, opacity: op })); S.scene.add(l); return l; };

  /* ================= ORBITAL MOTION ================= */
  const orbV = (c) => { const Mk = c.mass * 1e24, r = c.radius * 1e5 /* px → m (1 px = 100 km) */, GM = G * Mk, v = Math.sqrt(GM / r), T_ = TAU * Math.sqrt((r * r * r) / GM); return { GM, r, v, T: T_, a: GM / (r * r), Rp: 3000 * Math.cbrt(c.mass / 5) }; };
  S_["Orbital Motion"] = {
    env: "space", envOpts: {}, cam: [[0, 18, 30], [0, 0, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; s.theta = 0; o.pl = planet(S, 3); o.sat = satellite(S, 1); o.ring = ring(S, 14, 0x7fe3da, 0.45); o.rs = -1;
      o.vA = mk.arrow(0x7fe3da, 0.06, 0.2); o.fA = mk.arrow(0xff6b5a, 0.06, 0.2); 
    },
    reset(s, c) { s.theta = 0; },
    step(s, c, dt) { const q = orbV(c); s.theta += (TAU / q.T) * dt * 1500; },
    update(S, s, c) {
      const o = S.objs, q = orbV(c), r = q.r / 1e6, Rp = q.Rp / 1000; o.pl.scale.setScalar(Rp / 3); o.pl.rotation.y += 0.0015; if (Math.abs(o.rs - r) > 1e-6) { o.rs = r; S.scene.remove(o.ring); o.ring.geometry.dispose(); o.ring = ring(S, r, 0x7fe3da, 0.45); }
      const th = s.theta, x = Math.cos(th) * r, z = Math.sin(th) * r, dist = clamp(r * 2.7 + 8, 24, 70), sc = dist / 17; o.sat.position.set(x, 0, z); o.sat.scale.setScalar(sc); o.sat.rotation.y = -th;
      const vv = V3(-Math.sin(th), 0, Math.cos(th)).multiplyScalar((q.v / 1000) * 0.4 * sc), ff = V3(-Math.cos(th), 0, -Math.sin(th)).multiplyScalar(q.a * 0.35 * sc);
      S.setArrow(o.vA, V3(x, 0, z), vv, 1); S.setArrow(o.fA, V3(x, 0, z), ff, 1); S.aim([0, 0, 0], dist, 0.5, 0.62);
    },
    overlay(ctx, s, c, w, h, S) {
      const q = orbV(c), o = S.objs; H.pill(ctx, 14, 26, "v = √(GM/r)        T = 2π√(r³/GM)        F = GMm/r² = mv²/r", "#ffd27a", 10); H.pill(ctx, 14, 48, `M = ${c.mass}×10²⁴ kg    r = ${f1(q.r / 1000, 0)} km  (1 px = 100 km)`, "#cfe0ff", 10);
      H.pill(ctx, 14, 70, `v = ${f1(q.v / 1000, 2)} km/s     T = ${f1(q.T / 3600, 2)} h = ${f1(q.T / 60, 0)} min`, "#8df0be", 10.5); H.pill(ctx, 14, 92, `centripetal a = GM/r² = ${f1(q.a, 2)} m/s²   (T²/r³ = 4π²/GM = const)`, "#9fb8d8", 9.5);
      const p = S.proj(V3(Math.cos(s.theta) * q.r / 1e6, 0, Math.sin(s.theta) * q.r / 1e6)); H.pill(ctx, p.x + 12, p.y - 16, "satellite", "#e8f1ff", 10, "left");
      const rs = [], Ts = []; for (let rr = 60; rr <= 220; rr += 5) { const Tt = TAU * Math.sqrt(Math.pow(rr * 1e5, 3) / (G * c.mass * 1e24)) / 3600; rs.push([rr, Tt]); }
      H.graph(ctx, w - 202, h - 126, 188, 104, { series: [{ pts: rs, color: "#7fe3da", width: 2 }], xmin: 60, xmax: 220, ymin: 0, ymax: rs[rs.length - 1][1] * 1.05, xl: "r (px = 100 km)", yl: "T (h)", dot: [c.radius, q.T / 3600, "#ffb703"], ticksX: 3, ticksY: 3 });
    },
    readouts(s, c) { const q = orbV(c); return [["Orbital speed", `${f1(q.v / 1000, 2)} km/s`], ["Period", `${f1(q.T / 3600, 2)} h`], ["Centripetal accel.", `${f1(q.a, 2)} m/s²`], ["Radius", `${f1(q.r / 1000, 0)} km`]]; },
  };

  /* ================= ESCAPE VELOCITY ================= */
  S_["Escape Velocity"] = {
    env: "space", envOpts: {}, cam: [[8, 12, 34], [0, 10, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; s.init = false; o.pl = planet(S, 6); o.pl.position.y = -6; o.pl.rotation.z = 0.3;
      const rg = new T.Group(), body = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 1.5, 20), M.paint(0xf2f2f2)), nose = new T.Mesh(new T.ConeGeometry(0.28, 0.6, 20), M.paint(0xd23a2a)); nose.position.y = 1.05; body.position.y = 0.2; rg.add(body, nose); for (let i = 0; i < 3; i++) { const fin = new T.Mesh(new T.BoxGeometry(0.04, 0.5, 0.4), M.paint(0xd23a2a)); const a = (i / 3) * TAU; fin.position.set(Math.cos(a) * 0.34, -0.35, Math.sin(a) * 0.34); fin.rotation.y = -a; rg.add(fin); }
      o.flame = mk.cone(0.2, 1.1, M.emissive(0xffa52a, 2.4), 0, -1.1, 0); o.flame.rotation.x = Math.PI; rg.add(o.flame); S.scene.remove(o.flame); rg.add(o.flame); S.scene.add(rg); o.rk = rg; o.glow = mk.soft(0xffb050, 3, 0, 0, 0, 0.0);
      o.trail = []; for (let i = 0; i < 90; i++) { const d = mk.sphere(0.05, M.emissive(0xfff2c0, 1.5), 0, -50, 0); o.trail.push(d); } o.ti = 0; o.tl = 0;
      o.ticks = [1, 2, 5, 10, 50, 100];
    },
    reset(s, c) { s.init = false; },
    step(s, c, dt) {
      const GM = GME * c.planetMass, R = 6.371e6 * c.radius, v0 = c.launchSpeed * 1000, sig = `${GM}|${R}|${v0}`;
      if (!s.init || s.sig !== sig) { s.init = true; s.sig = sig; s.r = R; s.v = v0; s.t = 0; s.hold = 0; s.state = 0; s.apex = R; s.tr = []; s.rmax = R; }
      if (s.state === 1) { s.hold -= dt; if (s.hold <= 0) { s.state = 0; s.r = R; s.v = v0; s.t = 0; s.tr = []; s.rmax = R; } return; }
      /* adaptive time-lapse: 1/3 of the local dynamical time per scene second */
      const tau = Math.sqrt((s.r * s.r * s.r) / GM), W = tau / 3, tp = dt * W, nsub = 24, h = tp / nsub;
      for (let i = 0; i < nsub; i++) { const a1 = -GM / (s.r * s.r), r2 = s.r + s.v * h + 0.5 * a1 * h * h, a2 = -GM / (r2 * r2); s.v += 0.5 * (a1 + a2) * h; s.r = r2; s.t += h; }
      s.rmax = Math.max(s.rmax, s.r); if (s.r <= R && s.v < 0) { s.r = R; s.v = 0; s.state = 1; s.hold = 1.4; s.landed = true; } else if (s.r > 300 * R) { s.state = 1; s.hold = 1.2; s.landed = false; }
    },
    update(S, s, c) {
      const o = S.objs; if (!s.init) { return; } const GM = GME * c.planetMass, R = 6.371e6 * c.radius, rr = s.r / R, y = 6 * Math.log(Math.max(rr, 1)) + 0.9, ve = Math.sqrt((2 * GM) / R);
      o.rk.position.set(0, y, 0); o.rk.scale.setScalar(1.7); o.rk.rotation.z = 0; const going = s.v > 0; o.rk.rotation.x = going ? 0 : Math.PI; o.flame.visible = s.state === 0 && s.r < 1.02 * R * 1.0 + 1e3 * 0 && s.t < 90; o.rk.visible = !(s.state === 1 && s.landed);
      if (s.t < 1) o.trail.forEach((d) => (d.position.y = -50)); o.tl += 1; if (o.tl % 3 === 0 && s.state === 0) { o.trail[o.ti % 90].position.set(0, y - 0.7, 0); o.ti++; } if (s.state === 1 && !s.landed) { } o.pl.rotation.y += 0.002;
      const esc = c.launchSpeed * 1000 >= ve; S.aim([0, clamp(y, 8, 30) * 0.75 + 4, 0], 38, 0.25, 0.1); o.ve = ve; o.y = y;
    },
    overlay(ctx, s, c, w, h, S) {
      if (!s.init) return; const GM = GME * c.planetMass, R = 6.371e6 * c.radius, ve = Math.sqrt((2 * GM) / R), v0 = c.launchSpeed * 1000, E = 0.5 * v0 * v0 - GM / R, o = S.objs, esc = v0 >= ve;
      H.pill(ctx, 14, 26, "v_esc = √(2GM/R)     ½mv² − GMm/r = E  (E ≥ 0 → escapes)", "#ffd27a", 10); H.pill(ctx, 14, 48, `v_esc = ${f1(ve / 1000, 1)} km/s     launch = ${c.launchSpeed} km/s     g = GM/R² = ${f1(GM / (R * R), 1)} m/s²`, "#cfe0ff", 10);
      H.pill(ctx, 14, 70, `E = ${f1(E / 1e6, 1)} MJ/kg  →  ${esc ? "UNBOUND: escapes to infinity" : "BOUND: reaches r_max = " + f1(s.rmax / R, 1) + " R then falls back"}`, esc ? "#8df0be" : "#ff9d8a", 10);
      const rr = s.r / R, vNow = s.v / 1000; H.pill(ctx, 14, 92, `now: r = ${f1(rr, 2)} R    v = ${f1(vNow, 1)} km/s    (distance on log scale)`, "#9fb8d8", 9.5);
      const tk = [1, 2, 5, 10, 50, 100]; tk.forEach((k) => { const q = S.proj(V3(3.2, 6 * Math.log(k) + 0.9, 0)); H.pill(ctx, q.x, q.y, k === 1 ? "surface R" : `${k}R`, "#8aa0bb", 9, "left"); });
      const pts = []; for (let k = 1; k <= 30; k += 0.5) pts.push([k, -GM / (k * R) / 1e6]);
      H.graph(ctx, w - 214, h - 132, 200, 110, { series: [{ pts, color: "#7fe3da", width: 2 }, { pts: [[1, E / 1e6], [30, E / 1e6]], color: esc ? "#8df0be" : "#ff9d8a", width: 1.5 }], xmin: 1, xmax: 30, ymin: -GM / R / 1e6 * 1.1, ymax: Math.max(5, E / 1e6 * 1.3, 2), xl: "r / R", yl: "U, E  (MJ/kg)", dot: [clamp(rr, 1, 30), -GM / (Math.min(rr, 30) * R) / 1e6, "#ffb703"], ticksX: 3, ticksY: 3 });
    },
    readouts(s, c) { const ve = Math.sqrt((2 * GME * c.planetMass) / (6.371e6 * c.radius)) / 1000; return [["Escape velocity", `${f1(ve, 1)} km/s`], ["Launch speed", `${c.launchSpeed} km/s`], ["Outcome", c.launchSpeed >= ve ? "Escapes" : "Falls back"]]; },
  };

  /* ================= SATELLITE ORBITS (LEO vs GEO) ================= */
  const OM_E = 7.2921e-5;
  S_["Satellite Orbits"] = {
    env: "space", envOpts: {}, cam: [[0, 9, 18], [0, 0, 0]], fov: 38,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; s.th = 0; s.lon = 0; o.pl = planet(S, 2); o.sat = [satellite(S, 0.22), satellite(S, 0.7)]; o.ring = [ring(S, 2.13, 0x7fe3da, 0.5), ring(S, 13.25, 0xffb703, 0.5, 240)];
      o.pin = mk.sphere(0.05, M.emissive(0xff4040, 3), 2, 0, 0); o.pg = mk.soft(0xff4040, 0.7, 0, 0, 0, 0.7); S.scene.remove(o.pg); o.pl.add(o.pg); o.cam = 9;
      o.cone = new T.Mesh(new T.ConeGeometry(1, 1, 40, 1, true), new T.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.1, depthWrite: false, side: T.DoubleSide })); S.scene.add(o.cone);
    },
    reset(s, c) { s.th = 0; },
    step(s, c, dt) { const geo = c.orbit === 1, r = (geo ? 42164 : 6771) * 1e3, om = Math.sqrt(GME / (r * r * r)), warp = geo ? 5000 : 180; s.th += om * dt * warp; s.lon += OM_E * dt * warp; },
    update(S, s, c) {
      const o = S.objs, geo = c.orbit === 1, rk = geo ? 42164 : 6771, ru = (rk / RE_KM) * 2; o.pl.rotation.y = -s.lon; o.ring[0].material.opacity = geo ? 0.18 : 0.7; o.ring[1].material.opacity = geo ? 0.7 : 0.14;
      const pos = (r, th) => V3(Math.cos(th) * r, 0, Math.sin(th) * r), pe = pos(ru, s.th); o.sat[geo ? 1 : 0].position.copy(pe); o.sat[geo ? 1 : 0].lookAt(0, 0, 0); const other = o.sat[geo ? 0 : 1], r2 = ((geo ? 6771 : 42164) / RE_KM) * 2, om2 = Math.sqrt(GME / Math.pow((geo ? 6771 : 42164) * 1e3, 3)), th2 = s.th * (om2 / Math.sqrt(GME / Math.pow(rk * 1e3, 3)));
      other.position.copy(pos(r2, th2)); other.lookAt(0, 0, 0); o.sat.forEach((sa, i) => (sa.visible = true));
      o.pin.position.set(2.03 * Math.cos(s.lon), 0, 2.03 * Math.sin(s.lon));
      o.cone.visible = geo; if (geo) { const L = pe.length(), ct = 2 / L, sin = ct, tan = sin / Math.sqrt(1 - sin * sin), len = Math.sqrt(L * L - 4); o.cone.scale.set(len * tan, len, len * tan); const dir = pe.clone().negate().normalize(); o.cone.position.copy(pe).addScaledVector(dir, len / 2); o.cone.quaternion.setFromUnitVectors(V3(0, -1, 0), dir); }
      const dist = geo ? 38 : 8.5; o.cam += (dist - o.cam) * 0.05; S.aim([0, 0, 0], o.cam, 0.4, 0.55);
    },
    overlay(ctx, s, c, w, h, S) {
      const geo = c.orbit === 1, rk = geo ? 42164 : 6771, r = rk * 1e3, v = Math.sqrt(GME / r), Tp = TAU * Math.sqrt((r * r * r) / GME), g = GME / (r * r), Te = 86164;
      H.pill(ctx, 14, 26, "T = 2π√(r³/GM)        v = √(GM/r)        r = R_E + altitude", "#ffd27a", 10); H.pill(ctx, 14, 48, `${geo ? "Geostationary (GEO)" : "Low Earth Orbit (LEO)"}:  r = ${f1(rk, 0)} km   altitude ≈ ${f1(rk - RE_KM, 0)} km`, "#cfe0ff", 10);
      H.pill(ctx, 14, 70, `v = ${f1(v / 1000, 2)} km/s     T = ${geo ? f1(Tp / 3600, 2) + " h (one sidereal day)" : f1(Tp / 60, 1) + " min"}     g = ${f1(g, 2)} m/s²`, "#8df0be", 10); H.pill(ctx, 14, 92, geo ? "T = Earth's rotation period, equatorial, west→east → stays above the same point" : `passes over the same place ${f1(Te / Tp, 1)}× a day → ground track sweeps the Earth`, "#9fb8d8", 9.5);
      const ps = S.proj(S.objs.sat[geo ? 1 : 0].position); H.pill(ctx, ps.x + 12, ps.y - 14, geo ? "GEO satellite" : "LEO satellite", geo ? "#ffd27a" : "#7fe3da", 10.5, "left"); const pp = S.proj(S.objs.pin.position); H.pill(ctx, pp.x + 10, pp.y + 14, "ground station", "#ff9d8a", 9.5, "left");
    },
    readouts(s, c) { const geo = c.orbit === 1, r = (geo ? 42164 : 6771) * 1e3, Tp = TAU * Math.sqrt((r * r * r) / GME); return [["Orbit", geo ? "Geostationary" : "Low Earth Orbit"], ["Period", geo ? `${f1(Tp / 3600, 2)} h (24 h sidereal)` : `${f1(Tp / 60, 1)} min (~90)`], ["Speed", `${f1(Math.sqrt(GME / r) / 1000, 2)} km/s`], ["Use", geo ? "Communications, weather" : "Earth observation, ISS"]]; },
  };

  /* ================= COULOMB'S LAW ================= */
  const KC = 9e9, MPU = 3.2; // 1 m = 3.2 u
  S_["Coulomb's Law"] = {
    env: "lab", envOpts: { dark: true, w: 30, d: 12 }, cam: [[0, 6, 16], [0, 1.6, 0]], fov: 36,
    build(S, s, c) {
      const mk = S.mk, o = S.objs; o.rail = mk.box(14, 0.18, 1.0, M.matte(0x2a2e36, 0.4), 0, 0.14, 0); o.sc = mk.box(14, 0.02, 0.04, M.matte(0xe8e8e8, 0.4), 0, 0.25, 0.55);
      for (let i = -6; i <= 6; i++) { const t = mk.box(0.02, 0.03, i % 2 ? 0.1 : 0.18, M.matte(0x111111, 0.5), i, 0.26, 0.62); } o.tk = [];
      const mkq = (col) => { const g = new T.Group(), st = new T.Mesh(new T.CylinderGeometry(0.1, 0.18, 1.0, 14), M.matte(0xf0efe8, 0.5)); st.position.y = 0.75; g.add(st); const sp = new T.Mesh(new T.SphereGeometry(0.5, 48, 32), new T.MeshPhysicalMaterial({ color: col, metalness: 0.9, roughness: 0.18, clearcoat: 1 })); sp.position.y = 1.7; sp.castShadow = true; g.add(sp); const gl = mk.soft(col, 2.6, 0, 1.7, 0, 0.45); S.scene.remove(gl); g.add(gl); g.sp = sp; g.gl = gl; S.scene.add(g); return g; };
      o.q1 = mkq(0xe8483a); o.q2 = mkq(0x3a8be8); o.f1 = mk.arrow(0xffb703, 0.07, 0.24); o.f2 = mk.arrow(0xffb703, 0.07, 0.24);
    },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c) {
      const o = S.objs, r = c.r, x1 = -(r * MPU) / 2, x2 = (r * MPU) / 2, pos = (q, col) => { q.sp.material.color.setHex(q.dummy || col); };
      o.q1.position.x = x1; o.q2.position.x = x2; const cols = (qv) => (qv > 0 ? 0xe8483a : qv < 0 ? 0x3a8be8 : 0x9aa0a8);
      [[o.q1, c.q1], [o.q2, c.q2]].forEach(([g, q]) => { g.sp.material.color.setHex(cols(q)); g.gl.material.color.setHex(cols(q)); g.gl.material.opacity = Math.min(0.75, 0.12 + 0.07 * Math.abs(q)); const sc = 0.7 + 0.075 * Math.abs(q); g.sp.scale.setScalar(sc); g.sp.position.y = 1.2 + 0.5 * sc; g.gl.scale.setScalar(1); });
      const F = (KC * Math.abs(c.q1 * 1e-6 * c.q2 * 1e-6)) / (r * r), att = c.q1 * c.q2 < 0, L = F > 0 ? clamp(0.5 + 0.95 * Math.log10(F / 1e-3), 0.3, 5) : 0;
      const d1 = att ? 1 : -1, ok = c.q1 !== 0 && c.q2 !== 0, yy = o.q1.sp.position.y, yy2 = o.q2.sp.position.y; o.f1.visible = o.f2.visible = ok; const room = Math.max(0.4, (r * MPU - 1.6) / 2), L2 = att ? Math.min(L, room) : L;
      if (ok) { S.setArrow(o.f1, V3(x1 + (att ? 0.75 : -0.75), yy, 0.0), V3(d1 * L2, 0, 0), 1); S.setArrow(o.f2, V3(x2 + (att ? -0.75 : 0.75), yy2, 0.0), V3(-d1 * L2, 0, 0), 1); o.tip1 = V3(x1 + (att ? 0.75 + L2 : -0.75 - L2), yy + 0.4, 0); o.tip2 = V3(x2 + (att ? -0.75 - L2 : 0.75 + L2), yy2 + 0.4, 0); }
      o.F = F; o.att = att; o.x1 = x1; o.x2 = x2; S.aim([0, 1.6, 0], clamp(r * MPU + 13, 17, 26), 0.0, 0.2);
    },
    overlay(ctx, s, c, w, h, S) {
      const o = S.objs, F = o.F, r = c.r; H.pill(ctx, 14, 26, "F = k Q₁Q₂ / r²      k = 9×10⁹ N·m²/C²", "#ffd27a", 10.5); H.pill(ctx, 14, 48, `F = 9×10⁹ × (${c.q1}µC)(${c.q2}µC) / (${r} m)²`, "#cfe0ff", 10.5);
      H.pill(ctx, 14, 70, `|F| = ${f1(F, F < 0.1 ? 4 : 3)} N     ${c.q1 * c.q2 === 0 ? "no force (a charge is zero)" : o.att ? "unlike charges ATTRACT" : "like charges REPEL"}`, o.att ? "#8df0be" : "#ff9d8a", 10.5); H.pill(ctx, 14, 92, "inverse-square: double r → force ÷ 4;  equal & opposite pair (Newton III)", "#9fb8d8", 9.5);
      const a = S.proj(V3(o.x1, 0.7, 1.2)), b = S.proj(V3(o.x2, 0.7, 1.2)); ctx.save(); ctx.strokeStyle = "#9fb8d8"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore(); H.pill(ctx, (a.x + b.x) / 2, a.y + 16, `r = ${r} m`, "#9fb8d8", 10.5, "center");
      const t1 = S.proj(V3(o.x1, 3.4, 0)), t2 = S.proj(V3(o.x2, 3.4, 0)); H.pill(ctx, t1.x, t1.y - 22, `Q₁ = ${c.q1 > 0 ? "+" : ""}${c.q1} µC`, c.q1 >= 0 ? "#ff8a7a" : "#7fb6ff", 10.5, "center"); H.pill(ctx, t2.x, t2.y - 22, `Q₂ = ${c.q2 > 0 ? "+" : ""}${c.q2} µC`, c.q2 >= 0 ? "#ff8a7a" : "#7fb6ff", 10.5, "center");
      const pts = []; for (let rr = 0.2; rr <= 3.001; rr += 0.05) pts.push([rr, (KC * Math.abs(c.q1 * 1e-6 * c.q2 * 1e-6)) / (rr * rr)]); H.graph(ctx, w - 202, h - 126, 188, 104, { series: [{ pts, color: "#ffb703", width: 2 }], xmin: 0.2, xmax: 3, ymin: 0, ymax: Math.max(pts[0][1], 1e-3) * 1.05, xl: "r (m)", yl: "F (N)", dot: [r, F, "#7fe3da"], ticksX: 3, ticksY: 3 });
    },
    readouts(s, c) { const F = (KC * Math.abs(c.q1 * 1e-6 * c.q2 * 1e-6)) / (c.r * c.r); return [["Force magnitude", `${fmt(F, 2)} N`], ["Nature", c.q1 * c.q2 < 0 ? "Attractive" : c.q1 * c.q2 === 0 ? "None" : "Repulsive"], ["Separation", `${c.r} m`]]; },
  };

  /* ================= FIELD LINES EXPLORER ================= */
  const fibo = (n) => { const out = []; for (let i = 0; i < n; i++) { const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), a = i * 2.399963; out.push(V3(Math.cos(a) * r, y, Math.sin(a) * r)); } return out; };
  function trace(srcs, start, maxSteps, stopFn) { const pts = [start.clone()], p = start.clone(), fld = (q) => { const f = V3(); srcs.forEach((s) => { const d = q.clone().sub(s.p), r2 = Math.max(d.lengthSq(), 0.01); f.addScaledVector(d, s.q / (r2 * Math.sqrt(r2))); }); return f; };
    for (let i = 0; i < maxSteps; i++) { const k1 = fld(p).normalize(), k2 = fld(p.clone().addScaledVector(k1, 0.07)).normalize(); p.addScaledVector(k2, 0.14); pts.push(p.clone()); if (stopFn(p)) break; } return pts; }
  function magTex(txt, col) { const cv = document.createElement("canvas"); cv.width = cv.height = 128; const x = cv.getContext("2d"); x.fillStyle = col; x.fillRect(0, 0, 128, 128); x.fillStyle = "#fff"; x.font = "bold 84px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(txt, 64, 70); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return t; }
  S_["Field Lines Explorer"] = {
    env: "void", envOpts: {}, cam: [[0, 6, 16], [0, 0, 0]], fov: 38,
    build(S, s, c) { O_.clear(S); S.objs.grp = new T.Group(); S.scene.add(S.objs.grp); S.objs.sig = -1; S.objs.tr = []; },
    reset(s, c) { },
    step(s, c, dt) { },
    update(S, s, c) {
      const o = S.objs, f = c.field | 0, mk = S.mk;
      if (o.sig !== f) { o.sig = f; while (o.grp.children.length) { const m = o.grp.children.pop(); if (m.geometry) m.geometry.dispose(); } o.lines = [];
        const col = [0x7fe3da, 0xff6b5a, 0xffd27a][f], lm = new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 }), add = (m) => { o.grp.add(m); return m; };
        const addLine = (pts, k) => { const cur = new T.CatmullRomCurve3(pts); add(new T.Mesh(new T.TubeGeometry(cur, Math.min(pts.length * 2, 300), 0.028, 6, false), lm)); const pos = [0.3, 0.62].map((u) => { const p = cur.getPointAt(u), t = cur.getTangentAt(u); const cone = add(new T.Mesh(new T.ConeGeometry(0.1, 0.3, 10), new T.MeshBasicMaterial({ color: col }))); cone.position.copy(p); cone.quaternion.setFromUnitVectors(V3(0, 1, 0), (f === 0 ? t.clone().multiplyScalar(1) : t).normalize()); return cone; }); o.lines.push(cur); };
        if (f === 0 || f === 1) { const R0 = f === 0 ? 1.9 : 0.55, sgn = f === 0 ? -1 : 1, dirs = fibo(26);
          if (f === 0) { const pl = planet(S, R0); S.scene.remove(pl); add(pl); } else { const sp = add(new T.Mesh(new T.SphereGeometry(R0, 40, 28), new T.MeshPhysicalMaterial({ color: 0xe8483a, metalness: 0.7, roughness: 0.2, clearcoat: 1 }))); const gl = mk.soft(0xff5a4a, 3.4, 0, 0, 0, 0.5); S.scene.remove(gl); o.grp.add(gl); }
          dirs.forEach((d) => { const a = d.clone().multiplyScalar(R0 * 1.02), b = d.clone().multiplyScalar(7.2); const pts = f === 0 ? [b, a] : [a, b]; const mids = []; for (let i = 0; i <= 16; i++) mids.push(a.clone().lerp(b, i / 16)); addLine(f === 0 ? mids.reverse() : mids, 0); });
        } else { const mag = add(new T.Group()), nh = new T.Mesh(new T.BoxGeometry(2.0, 0.9, 0.9), [M.paint(0xd0322a), M.paint(0xd0322a), M.paint(0xd0322a), M.paint(0xd0322a), new T.MeshStandardMaterial({ map: magTex("N", "#d0322a"), roughness: 0.4 }), new T.MeshStandardMaterial({ map: magTex("N", "#d0322a"), roughness: 0.4 })]), sh = new T.Mesh(new T.BoxGeometry(2.0, 0.9, 0.9), [M.paint(0x2a58c8), M.paint(0x2a58c8), M.paint(0x2a58c8), M.paint(0x2a58c8), new T.MeshStandardMaterial({ map: magTex("S", "#2a58c8"), roughness: 0.4 }), new T.MeshStandardMaterial({ map: magTex("S", "#2a58c8"), roughness: 0.4 })]); nh.position.x = 1.0; sh.position.x = -1.0; mag.add(nh, sh);
          const srcs = [{ p: V3(1.9, 0, 0), q: 1 }, { p: V3(-1.9, 0, 0), q: -1 }]; fibo(60).forEach((d) => { if (d.x < -0.15) return; const st = srcs[0].p.clone().addScaledVector(d, 0.28); if (st.x < 2.0 && Math.abs(st.y) < 0.45 && Math.abs(st.z) < 0.45 && st.x < 2.0) { } const pts = trace(srcs, st, 420, (p) => p.distanceTo(srcs[1].p) < 0.32 || p.length() > 7.5); if (pts.length > 6) addLine(pts, 0); }); }
      }
      /* tracer dots flowing along the lines (direction of force) */
      if (!o.tr.length || o.trSig !== f) { o.tr.forEach((m) => S.scene.remove(m)); o.tr = []; o.trSig = f; o.lines.forEach((cur, i) => { for (let k = 0; k < 2; k++) { const m = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff })); S.scene.add(m); m.userData = { cur, u: (k * 0.5 + (i % 7) / 14) % 1 }; o.tr.push(m); } }); }
      o.tr.forEach((m) => { const d = m.userData; d.u = (d.u + 0.004) % 1; m.position.copy(d.cur.getPointAt(d.u)); });
      S.aim([0, 0, 0], f === 2 ? 17 : 17, 0.5 * Math.sin(S.t * 0.15) + 0.35, 0.45);
    },
    overlay(ctx, s, c, w, h, S) {
      const f = c.field | 0, nm = ["GRAVITATIONAL field of a mass", "ELECTRIC field of a + point charge", "MAGNETIC field of a bar magnet"][f];
      H.pill(ctx, 14, 26, nm, ["#7fe3da", "#ff8a7a", "#ffd27a"][f], 11); H.pill(ctx, 14, 48, ["g = GM/r²   lines point toward the mass (always attract)", "E = kQ/r²   lines point away from + (toward −)", "B lines leave N, enter S; closed loops through the magnet"][f], "#cfe0ff", 10);
      H.pill(ctx, 14, 70, ["closer lines = stronger field: g ∝ 1/r²", "line density ∝ field strength; lines never cross", "dense near the poles = strongest; weaker far away"][f], "#8df0be", 10); H.pill(ctx, 14, 92, "white dots show the direction of force on a test mass / + charge / N-pole", "#9fb8d8", 9.5);
    },
    readouts(s, c) { return [["Field type", ["Gravitational", "Electric", "Magnetic"][c.field | 0]], ["Source", ["mass", "point charge", "bar magnet"][c.field | 0]], ["Always attractive?", c.field === 0 ? "Yes" : "No — depends on sign/pole"]]; },
  };
  const O_ = { clear: (S) => { if (P.util.optics && P.util.optics.clearFog) P.util.optics.clearFog(S); } };
})();
