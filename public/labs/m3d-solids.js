/* m3d-solids.js — WebGL (three.js via physics3d.js) labs for Mensuration:
   C-a#globe  latitude & longitude on a 3D Earth (distances along parallels and meridians, time difference)
   C-b#nets   surface area: nets that fold/unfold (cube, cuboid, prism, pyramid, cylinder, cone ↔ sector)
   C-c        volumes: glass solids filled with water; cone/sphere vs cylinder; similar solids (k³)
   Scenes only touch THREE/P3D inside build/update, so this file can load before the 3D engine. */
(function () {
  "use strict";
  const MK = window.MK, f = MK.fmt, W = MK.when;
  const R = (d) => d * Math.PI / 180;

  /* ---------- maths studio environment: dark gradient room, wooden table, graph-paper cutting mat ---------- */
  MK.envs3d.mathdesk = function (S, o) {
    const T = window.THREE, P3D = window.P3D, U = P3D.util, sc = S.scene;
    const c = U.cv(4, 256), g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "#1a2742"); gr.addColorStop(1, "#070b14"); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const bg = new T.CanvasTexture(c); bg.colorSpace = T.SRGBColorSpace; sc.background = bg;
    const table = new T.Mesh(new T.BoxGeometry(o.w || 22, 0.4, o.d || 14), P3D.mat.wood()); table.position.y = -0.2; table.receiveShadow = true; sc.add(table);
    const mc = U.cv(512, 512), mg = mc.getContext("2d"); mg.fillStyle = "#1f5e4b"; mg.fillRect(0, 0, 512, 512);
    for (let i = 0; i <= 512; i += 16) { mg.strokeStyle = i % 80 === 0 ? "rgba(255,255,255,.38)" : "rgba(255,255,255,.12)"; mg.lineWidth = i % 80 === 0 ? 1.6 : 1; mg.beginPath(); mg.moveTo(i, 0); mg.lineTo(i, 512); mg.moveTo(0, i); mg.lineTo(512, i); mg.stroke(); }
    const mat = new T.Mesh(new T.PlaneGeometry(o.mw || 14, o.md || 9), new T.MeshStandardMaterial({ map: U.tex(mc, [2, 1.3]), roughness: 0.9 })); mat.rotation.x = -Math.PI / 2; mat.position.y = 0.005; mat.receiveShadow = true; sc.add(mat);
    sc.add(new T.HemisphereLight(0xcfe0ff, 0x2a2018, 0.55));
    const key = new T.DirectionalLight(0xfff2e0, 2.6); key.position.set(-6, 12, 8); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 0.5, far: 50 }); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; sc.add(key);
    const rim = new T.DirectionalLight(0x8fb4ff, 1.0); rim.position.set(7, 5, -6); sc.add(rim);
    const fill = new T.PointLight(0xffe8cc, 6, 40, 1.6); fill.position.set(3, 7, 9); sc.add(fill);
    sc.environmentIntensity = o.envI == null ? 0.65 : o.envI;
  };

  /* ================= C-a#globe : latitude & longitude ================= */
  function globeTex(T, U) {
    const c = U.cv(2048, 1024), g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 1024);
    gr.addColorStop(0, "#cfe6f5"); gr.addColorStop(0.08, "#2c6ea8"); gr.addColorStop(0.5, "#1b5a96"); gr.addColorStop(0.92, "#2c6ea8"); gr.addColorStop(1, "#d8ecf8"); g.fillStyle = gr; g.fillRect(0, 0, 2048, 1024);
    const im = g.getImageData(0, 0, 2048, 1024), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 10; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(im, 0, 0);
    for (let lat = -75; lat <= 75; lat += 15) { const y = (90 - lat) / 180 * 1024; g.strokeStyle = lat === 0 ? "rgba(255,90,80,.95)" : "rgba(255,255,255,.35)"; g.lineWidth = lat === 0 ? 6 : 2; g.beginPath(); g.moveTo(0, y); g.lineTo(2048, y); g.stroke(); g.fillStyle = "rgba(255,255,255,.6)"; g.font = "bold 22px sans-serif"; if (lat) g.fillText(Math.abs(lat) + "°" + (lat > 0 ? "N" : "S"), 1032, y - 6); }
    for (let lon = -180; lon < 180; lon += 15) { const x = (lon + 180) / 360 * 2048; g.strokeStyle = lon === 0 ? "rgba(255,210,90,.95)" : "rgba(255,255,255,.3)"; g.lineWidth = lon === 0 ? 6 : 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke(); if (lon % 30 === 0) { g.fillStyle = "rgba(255,255,255,.55)"; g.fillText(Math.abs(lon) + "°" + (lon > 0 ? "E" : lon < 0 ? "W" : ""), x + 6, 530); } }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 16; return t;
  }
  const RE = 3;                                                         // scene radius of the Earth
  const ll = (T, lat, lon, r = RE) => new T.Vector3(r * Math.cos(R(lat)) * Math.sin(R(lon)), r * Math.sin(R(lat)), r * Math.cos(R(lat)) * Math.cos(R(lon)));
  MK.def("C-a#globe", {
    kind: "3d", label: "3D lab — latitude & longitude on the globe", title: "Latitude & longitude",
    blurb: "A 3D Earth with parallels and meridians. Measure distances along a parallel (small circle) or a meridian (great circle) and see the radius R cos α.",
    env: "space", cam: [[8.2, 4.4, 10.6], [2.0, 0.3, 0]], fov: 36, exposure: 1.05, envI: 0.35,
    values: { mode: "parallel", lat: 40, lonA: -20, lonB: 70, latA: -30, latB: 50, lon: 25, Rk: 6400, pi: "3.142" },
    controls: [{ type: "tabs", key: "mode", label: "Path", options: [["parallel", "Along a parallel of latitude"], ["meridian", "Along a meridian (same longitude)"]] },
      { key: "lat", label: "Latitude α", min: -80, max: 80, unit: "°", show: W("mode", "parallel") }, { key: "lonA", label: "Longitude of P", min: -180, max: 180, unit: "°", show: W("mode", "parallel") }, { key: "lonB", label: "Longitude of Q", min: -180, max: 180, unit: "°", show: W("mode", "parallel") },
      { key: "lon", label: "Longitude", min: -180, max: 180, unit: "°", show: W("mode", "meridian") }, { key: "latA", label: "Latitude of P", min: -90, max: 90, unit: "°", show: W("mode", "meridian") }, { key: "latB", label: "Latitude of Q", min: -90, max: 90, unit: "°", show: W("mode", "meridian") },
      { type: "select", key: "pi", label: "Value of π", options: [["3.142", "3.142"], ["22/7", "22/7"]] }, { type: "select", key: "Rk", label: "Radius of the Earth", options: [[6400, "6400 km"], [6370, "6370 km"]] }],
    views: [{ label: "Front", cam: [[2, 1.2, 12.5], [2, 0, 0]] }, { label: "From above (N pole)", cam: [[2, 12.5, 0.6], [2, 0, 0]] }, { label: "Oblique", cam: [[8.2, 4.4, 10.6], [2.0, 0.3, 0]] }],
    calc(c) { const PI = c.pi === "22/7" ? 22 / 7 : 3.142; if (c.mode === "parallel") { let dl = Math.abs(c.lonB - c.lonA); if (dl > 180) dl = 360 - dl; const r = c.Rk * Math.cos(R(c.lat)); return { th: dl, r, d: dl / 360 * 2 * PI * r, time: dl / 15, PI }; } const dt = Math.abs(c.latB - c.latA); return { th: dt, r: c.Rk, d: dt / 360 * 2 * PI * c.Rk, PI }; },
    build(S, s, c) {
      const T = window.THREE, P3D = window.P3D, U = P3D.util, mk = S.mk, sc = S.scene;
      const earth = new T.Mesh(new T.SphereGeometry(RE, 96, 64), new T.MeshPhysicalMaterial({ map: globeTex(T, U), roughness: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.3 })); earth.rotation.y = -Math.PI / 2; sc.add(earth); s.earth = earth;
      const atm = new T.Mesh(new T.SphereGeometry(RE * 1.035, 64, 48), new T.MeshBasicMaterial({ color: 0x7fb6ff, transparent: true, opacity: 0.12, side: T.BackSide, blending: T.AdditiveBlending, depthWrite: false })); sc.add(atm);
      mk.rod(new T.Vector3(0, -RE * 1.35, 0), new T.Vector3(0, RE * 1.35, 0), 0.025, P3D.mat.chrome());
      s.ring = new T.Mesh(new T.TorusGeometry(1, 0.018, 8, 160), P3D.mat.glow(0x9ad0ff, 0.45)); s.ring.rotation.x = Math.PI / 2; sc.add(s.ring);
      s.disc = new T.Mesh(new T.CircleGeometry(1, 96), new T.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.16, side: T.DoubleSide, depthWrite: false })); s.disc.rotation.x = -Math.PI / 2; sc.add(s.disc);
      s.rad = mk.rod(new T.Vector3(), new T.Vector3(1, 0, 0), 0.03, P3D.mat.emissive(0xffd27a, 1.4));
      s.r0 = mk.rod(new T.Vector3(), new T.Vector3(1, 0, 0), 0.025, P3D.mat.emissive(0x9ad0ff, 1.2)); s.r1 = mk.rod(new T.Vector3(), new T.Vector3(1, 0, 0), 0.025, P3D.mat.emissive(0x9ad0ff, 1.2));
      s.P = mk.sphere(0.09, P3D.mat.emissive(0xff5a50, 2.2)); s.Q = mk.sphere(0.09, P3D.mat.emissive(0x5bd68c, 2.2));
      s.pathMat = new T.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xffb347, emissiveIntensity: 1.6, roughness: 0.4 }); s.path = null; s.key = "";
      const sun = new T.DirectionalLight(0xffffff, 2.2); sun.position.set(8, 5, 9); sc.add(sun); sc.add(new T.AmbientLight(0x334466, 0.6));
    },
    update(S, s, c) {
      const T = window.THREE, key = JSON.stringify(c); if (key === s.key) return; s.key = key;
      let pts = [], Pp, Qp;
      if (c.mode === "parallel") { const y = RE * Math.sin(R(c.lat)), r = RE * Math.cos(R(c.lat)); s.ring.visible = s.disc.visible = s.rad.visible = true; s.ring.scale.set(r, r, r); s.ring.position.y = y; s.disc.scale.set(r, r, 1); s.disc.position.y = y;
        let a0 = c.lonA, a1 = c.lonB; let dl = a1 - a0; if (dl > 180) dl -= 360; if (dl < -180) dl += 360; for (let i = 0; i <= 120; i++) pts.push(ll(T, c.lat, a0 + dl * i / 120, RE * 1.006)); Pp = ll(T, c.lat, c.lonA, RE * 1.01); Qp = ll(T, c.lat, c.lonB, RE * 1.01);
        S.setRod(s.rad, new T.Vector3(0, y, 0), ll(T, c.lat, c.lonA)); S.setRod(s.r0, new T.Vector3(), ll(T, 0, c.lonA)); S.setRod(s.r1, new T.Vector3(), ll(T, c.lat, c.lonA)); }
      else { s.ring.visible = s.disc.visible = false; s.rad.visible = false; for (let i = 0; i <= 120; i++) pts.push(ll(T, c.latA + (c.latB - c.latA) * i / 120, c.lon, RE * 1.006)); Pp = ll(T, c.latA, c.lon, RE * 1.01); Qp = ll(T, c.latB, c.lon, RE * 1.01); S.setRod(s.r0, new T.Vector3(), ll(T, c.latA, c.lon)); S.setRod(s.r1, new T.Vector3(), ll(T, c.latB, c.lon)); }
      s.P.position.copy(Pp); s.Q.position.copy(Qp);
      if (s.path) { s.path.geometry.dispose(); S.scene.remove(s.path); } if (pts.length > 1 && pts[0].distanceTo(pts[pts.length - 1]) > 1e-4) { s.path = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 160, 0.035, 10, false), s.pathMat); S.scene.add(s.path); } else s.path = null;
      s.Pp = Pp; s.Qp = Qp;
    },
    overlay(ctx, s, c, S, B) {
      if (!s.Pp) return; const T = window.THREE, at = (v, t, col, dx, dy) => { const q = MK.proj(S, v.x, v.y, v.z); if (q.z < 1) B.pill(t, q.x + (dx || 10), q.y + (dy || -10), col, 11); };
      at(s.Pp, "P", "#ff7b72"); at(s.Qp, "Q", "#5bd68c"); at(new T.Vector3(0, RE * 1.38, 0), "N", "#e8f1ff", -6, -4); at(new T.Vector3(0, -RE * 1.38, 0), "S", "#e8f1ff", -6, 16);
      if (c.mode === "parallel") { const y = RE * Math.sin(R(c.lat)), m = ll(T, c.lat, c.lonA).multiplyScalar(0.5).add(new T.Vector3(0, y * 0.5, 0)); at(m, "r = R cos α", "#ffd27a", 6, -6); }
    },
    hud(s, c) { const r = this.calc(c); if (c.mode === "parallel") return [{ title: "Along a parallel", lines: ["r = R cos α", `= ${c.Rk} × cos ${c.lat}° = ${f(r.r, 1)} km`, "distance = (θ/360) × 2πr", `θ = |${c.lonB}° − (${c.lonA}°)| = ${r.th}°`, [`= ${f(r.d, 1)} km`, null, true], `time difference = θ/15 = ${f(r.time, 2)} h`] }];
      return [{ title: "Along a meridian", lines: ["great circle, radius R", `θ = |${c.latB}° − (${c.latA}°)| = ${r.th}°`, "distance = (θ/360) × 2πR", [`= ${f(r.d, 1)} km`, null, true]] }]; },
    readouts(s, c) { const r = this.calc(c); return c.mode === "parallel" ? [["Angle θ", r.th + "°"], ["Radius of parallel", f(r.r, 1) + " km"], ["Distance PQ", f(r.d, 1) + " km"], ["Time difference", f(r.time, 2) + " h"]] : [["Angle θ", r.th + "°"], ["Distance PQ", f(r.d, 1) + " km"]]; },
    steps(s, c) { const r = this.calc(c); if (c.mode === "parallel") return [`Both points are on latitude ${Math.abs(c.lat)}°${c.lat >= 0 ? "N" : "S"}: travel along that small circle.`, `Radius of the parallel r = R cos α = ${c.Rk} cos ${c.lat}° = ${f(r.r, 2)} km`, `Difference in longitude θ = ${r.th}° (same side: subtract; opposite sides of Greenwich: add)`, `Distance = ${r.th}/360 × 2 × ${c.pi} × ${f(r.r, 2)} = ${f(r.d, 1)} km`];
      return [`Same longitude: travel along the meridian (a great circle of radius R = ${c.Rk} km).`, `Angle at the centre θ = ${r.th}° (same hemisphere: subtract latitudes; opposite: add)`, `Distance = ${r.th}/360 × 2 × ${c.pi} × ${c.Rk} = ${f(r.d, 1)} km`]; },
    note: "Distances along latitudes and longitudes and their corresponding angles. Take R = 6400 km unless told otherwise; the radius of a parallel of latitude α is R cos α. 15° of longitude = 1 hour of time.",
    mistake: "Using R instead of R cos α for a journey along a parallel of latitude.",
    draw(g, s, c, B) { const P = B.P, a = B.area, cx = a.x + a.w / 2, cy = a.y + a.h / 2 + 10, Rr = Math.min(a.w, a.h) * 0.36, lat = c.mode === "parallel" ? c.lat : c.latB, y = cy - Rr * Math.sin(R(lat)), x2 = Rr * Math.cos(R(lat));
      B.circle(cx, cy, Rr, P.blue, P.fillB, 2.4); B.line(cx - Rr - 10, cy, cx + Rr + 10, cy, P.red, 1.8); B.text("equator", cx + Rr + 6, cy - 4, { size: 10.5, color: P.red }); B.line(cx, cy - Rr - 14, cx, cy + Rr + 14, P.soft, 1.2, [5, 4]); B.text("N", cx - 4, cy - Rr - 18, { w: 800 });
      B.line(cx - x2, y, cx + x2, y, P.amber, 2.4); B.line(cx, cy, cx + x2, y, P.ink, 1.8); B.line(cx, y, cx + x2, y, P.green, 3); B.angle(cx, cy, 0, -R(lat), 30, P.purple, Math.abs(lat) + "°"); B.text("r = R cos α", cx + x2 / 2, y - 8, { align: "center", color: P.green, w: 700, size: 11 }); B.text("R", cx + x2 / 2 + 8, (cy + y) / 2 + 12, { w: 800 }); },
  });

  /* ================= C-b#nets : nets of solids ================= */
  const SOLIDS = [["cube", "Cube"], ["cuboid", "Cuboid"], ["prism", "Triangular prism"], ["pyramid", "Square pyramid"], ["cyl", "Cylinder"], ["cone", "Cone (sector ↔ cone)"]];
  function cardMat(T, col) { return new T.MeshStandardMaterial({ color: col, roughness: 0.78, metalness: 0, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }); }
  function edged(T, mesh, col = 0x16324f) { const e = new T.LineSegments(new T.EdgesGeometry(mesh.geometry, 20), new T.LineBasicMaterial({ color: col, transparent: true, opacity: 0.85 })); mesh.add(e); return mesh; }
  MK.def("C-b#nets", {
    kind: "3d", label: "3D lab — nets & surface area", title: "Nets & surface area",
    blurb: "Fold and unfold real card nets. Watch a cylinder unroll into a rectangle and a cone unroll into a sector (θ = 360r/l).",
    env: "mathdesk", cam: [[2.4, 9.6, 11.2], [2.4, 0.4, 1.0]], fov: 38, exposure: 1.05,
    values: { solid: "cube", a: 2, b: 3, h: 2.5, r: 1.2, H: 3, unfold: 0, auto: 1 },
    controls: [{ type: "select", key: "solid", label: "Solid", options: SOLIDS }, { key: "unfold", label: "Fold ↔ unfold", min: 0, max: 1, step: 0.01 }, { type: "toggle", key: "auto", label: "Animate folding" },
      { key: "a", label: "Length / side a", min: 1, max: 3.5, step: 0.1, unit: "cm", show: (c) => ["cube", "cuboid", "prism", "pyramid"].includes(c.solid) }, { key: "b", label: "Width b", min: 1, max: 4, step: 0.1, unit: "cm", show: (c) => ["cuboid", "prism"].includes(c.solid) }, { key: "h", label: "Height h", min: 1, max: 4, step: 0.1, unit: "cm", show: (c) => ["cuboid", "pyramid", "cyl"].includes(c.solid) },
      { key: "r", label: "Radius r", min: 0.5, max: 2, step: 0.05, unit: "cm", show: W("solid", "cyl", "cone") }, { key: "H", label: "Height H (cone)", min: 1, max: 4, step: 0.1, unit: "cm", show: W("solid", "cone") }],
    views: [{ label: "Top", cam: [[2.4, 14, 1.6], [2.4, 0, 1.2]] }, { label: "Oblique", cam: [[2.4, 9.6, 11.2], [2.4, 0.4, 1.0]] }, { label: "Side", cam: [[12, 3.5, 3], [0, 1, 1]] }],
    state: () => ({ t: 0, dir: 1 }),
    area(c) { const a = c.a, b = c.b, h = c.h, r = c.r; switch (c.solid) { case "cube": return { A: 6 * a * a, F: "6a²", sub: `6 × ${a}²` }; case "cuboid": return { A: 2 * (a * b + b * h + a * h), F: "2(lb + bh + lh)", sub: `2(${a}×${b} + ${b}×${h} + ${a}×${h})` };
      case "prism": { const tri = Math.sqrt(3) / 4 * a * a; return { A: 2 * tri + 3 * a * b, F: "2 × (√3/4)a² + 3 × a × L", sub: `2 × ${f(tri, 3)} + 3 × ${a} × ${b}` }; }
      case "pyramid": { const sl = Math.hypot(h, a / 2); return { A: a * a + 2 * a * sl, F: "a² + 4 × ½ × a × slant", sub: `${a}² + 2 × ${a} × ${f(sl, 3)}`, sl }; }
      case "cyl": return { A: 2 * Math.PI * r * r + 2 * Math.PI * r * h, F: "2πr² + 2πrh", sub: `2π(${r})² + 2π(${r})(${h})` };
      default: { const l = Math.hypot(r, c.H); return { A: Math.PI * r * r + Math.PI * r * l, F: "πr² + πrl", sub: `π(${r})² + π(${r})(${f(l, 3)})`, l, th: 360 * r / l }; } } },
    build(S, s, c) { s.grp = null; s.key = ""; this.rebuild(S, s, c); },
    rebuild(S, s, c) {
      const T = window.THREE, sc = S.scene; if (s.grp) { sc.remove(s.grp); s.grp.traverse((o) => { o.geometry && o.geometry.dispose(); }); }
      const G = new T.Group(); sc.add(G); s.grp = G; s.parts = {}; const th = 0.03, cols = [0xf4d58d, 0x9ad0ff, 0xb9f0c8, 0xf7b2c4, 0xd9c2ff, 0xffd0a6];
      const face = (w, h, col) => edged(T, new T.Mesh(new T.BoxGeometry(w, h, th), cardMat(T, col)));
      const piv = (parent, x, y, z) => { const p = new T.Group(); p.position.set(x, y, z); parent.add(p); return p; };
      const shadow = (m) => { m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); };
      if (c.solid === "cube" || c.solid === "cuboid") {
        const w = c.a, d = c.solid === "cube" ? c.a : c.b, h = c.solid === "cube" ? c.a : c.h;
        const base = edged(T, new T.Mesh(new T.BoxGeometry(w, th, d), cardMat(T, cols[0]))); base.position.y = th / 2; G.add(base);
        const fr = piv(G, 0, 0, d / 2), bk = piv(G, 0, 0, -d / 2), rt = piv(G, w / 2, 0, 0), lf = piv(G, -w / 2, 0, 0);
        const mF = face(w, h, cols[1]); mF.position.y = h / 2; fr.add(mF); const mB = face(w, h, cols[1]); mB.position.y = h / 2; bk.add(mB);
        const mR = face(d, h, cols[2]); mR.rotation.y = Math.PI / 2; mR.position.y = h / 2; rt.add(mR); const mL = face(d, h, cols[2]); mL.rotation.y = Math.PI / 2; mL.position.y = h / 2; lf.add(mL);
        const tp = piv(bk, 0, h, 0), mT = edged(T, new T.Mesh(new T.BoxGeometry(w, th, d), cardMat(T, cols[3]))); mT.position.z = d / 2; tp.add(mT);
        s.parts = { fr, bk, rt, lf, tp };
      } else if (c.solid === "pyramid") {
        const a = c.a, h = c.h, sl = Math.hypot(h, a / 2), beta = Math.atan2(h, a / 2);
        const base = edged(T, new T.Mesh(new T.BoxGeometry(a, th, a), cardMat(T, cols[0]))); base.position.y = th / 2; G.add(base);
        const tri = (col) => { const g2 = new T.BufferGeometry(); g2.setAttribute("position", new T.Float32BufferAttribute([-a / 2, 0, 0, a / 2, 0, 0, 0, sl, 0], 3)); g2.computeVertexNormals(); return edged(T, new T.Mesh(g2, cardMat(T, col))); };
        const fr = piv(G, 0, 0, a / 2), bk = piv(G, 0, 0, -a / 2), rt = piv(G, a / 2, 0, 0), lf = piv(G, -a / 2, 0, 0);
        fr.add(tri(cols[1])); bk.add(tri(cols[1])); const tR = tri(cols[2]); tR.rotation.y = Math.PI / 2; rt.add(tR); const tL = tri(cols[2]); tL.rotation.y = Math.PI / 2; lf.add(tL);
        s.parts = { fr, bk, rt, lf, beta };
      } else if (c.solid === "prism") {
        const a = c.a, L = c.b, base = edged(T, new T.Mesh(new T.BoxGeometry(a, th, L), cardMat(T, cols[0]))); base.position.y = th / 2; G.add(base);
        const rt = piv(G, a / 2, 0, 0), lf = piv(G, -a / 2, 0, 0), m1 = face(L, a, cols[1]); m1.rotation.y = Math.PI / 2; m1.position.y = a / 2; rt.add(m1); const m2 = face(L, a, cols[1]); m2.rotation.y = Math.PI / 2; m2.position.y = a / 2; lf.add(m2);
        const tri = (col) => { const g2 = new T.BufferGeometry(); g2.setAttribute("position", new T.Float32BufferAttribute([-a / 2, 0, 0, a / 2, 0, 0, 0, a * Math.sqrt(3) / 2, 0], 3)); g2.computeVertexNormals(); return edged(T, new T.Mesh(g2, cardMat(T, col))); };
        const fr = piv(G, 0, 0, L / 2), bk = piv(G, 0, 0, -L / 2); fr.add(tri(cols[2])); bk.add(tri(cols[2]));
        s.parts = { rt, lf, fr, bk };
      } else if (c.solid === "cyl") {
        const r = c.r, h = c.h, n = 64, m = 8, g2 = new T.BufferGeometry(), pos = new Float32Array((n + 1) * (m + 1) * 3), idx = [];
        for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const A = i * (m + 1) + j, Bq = A + m + 1; idx.push(A, Bq, A + 1, Bq, Bq + 1, A + 1); }
        g2.setAttribute("position", new T.BufferAttribute(pos, 3)); g2.setIndex(idx);
        const lat = new T.Group(); lat.position.set(0, 0, r); G.add(lat); const sheet = new T.Mesh(g2, cardMat(T, cols[1])); lat.add(sheet);
        const bot = edged(T, new T.Mesh(new T.CylinderGeometry(r, r, th, 64), cardMat(T, cols[0]))); bot.position.y = th / 2; G.add(bot);
        const tp = piv(lat, 0, h, 0), top = edged(T, new T.Mesh(new T.CylinderGeometry(r, r, th, 64), cardMat(T, cols[3]))); top.position.z = -r; tp.add(top);
        s.parts = { sheet, g2, lat, tp, n, m };
      } else {
        const r = c.r, l = Math.hypot(r, c.H), n = 64, m = 10, g2 = new T.BufferGeometry(), pos = new Float32Array((n + 1) * (m + 1) * 3), idx = [];
        for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const A = i * (m + 1) + j, Bq = A + m + 1; idx.push(A, Bq, A + 1, Bq, Bq + 1, A + 1); }
        g2.setAttribute("position", new T.BufferAttribute(pos, 3)); g2.setIndex(idx); const sheet = new T.Mesh(g2, cardMat(T, cols[1])); G.add(sheet);
        const disc = edged(T, new T.Mesh(new T.CylinderGeometry(r, r, th, 64), cardMat(T, cols[0]))); disc.position.y = th / 2; G.add(disc);
        s.parts = { sheet, g2, disc, n, m, l };
      }
      shadow(G); G.position.z = c.solid === "cone" ? -0.6 : 0; G.position.y = 0.035;
    },
    update(S, s, c, dt) {
      const k = c.solid + c.a + c.b + c.h + c.r + c.H; if (k !== s.key) { s.key = k; this.rebuild(S, s, c); }
      if (c.auto) { s.t += dt * 0.28 * s.dir; if (s.t > 1.25) s.dir = -1; if (s.t < -0.25) s.dir = 1; c.unfold = MK.clamp(s.t, 0, 1); } else s.t = c.unfold;
      const u = c.unfold, e = (x) => x * x * (3 - 2 * x), P = s.parts, H = Math.PI / 2;
      if (c.solid === "cube" || c.solid === "cuboid") { const v = e(u); P.fr.rotation.x = v * H; P.bk.rotation.x = -v * H; P.rt.rotation.z = -v * H; P.lf.rotation.z = v * H; P.tp.rotation.x = -v * H; }
      else if (c.solid === "pyramid") { const v = e(u), fold = H - P.beta; const ang = -fold + v * (fold + H); P.fr.rotation.x = ang; P.bk.rotation.x = -ang; P.rt.rotation.z = -ang; P.lf.rotation.z = ang; }
      else if (c.solid === "prism") { const v = e(u), fold = Math.PI / 6; const ang = -fold + v * (fold + H); P.rt.rotation.z = -ang; P.lf.rotation.z = ang; P.fr.rotation.x = v * H; P.bk.rotation.x = -v * H; }
      else if (c.solid === "cyl") { const r = c.r, h = c.h, u1 = e(MK.clamp(u / 0.6, 0, 1)), u2 = e(MK.clamp((u - 0.6) / 0.4, 0, 1)), rho = r / Math.max(1e-3, 1 - u1 * 0.999), arr = P.g2.attributes.position.array;
        for (let i = 0; i <= P.n; i++) { const sArc = (i / P.n - 0.5) * 2 * Math.PI * r; for (let j = 0; j <= P.m; j++) { const y = j / P.m * h, o = (i * (P.m + 1) + j) * 3; arr[o] = rho * Math.sin(sArc / rho); arr[o + 1] = y; arr[o + 2] = rho * Math.cos(sArc / rho) - rho; } }
        P.g2.attributes.position.needsUpdate = true; P.g2.computeVertexNormals(); P.g2.computeBoundingSphere(); P.lat.rotation.x = u2 * H; P.tp.rotation.x = u2 * H; }
      else { const r = c.r, l = P.l, v = e(u), rt = r + (l - r) * v, al = Math.asin(MK.clamp(rt / l, 0, 1)), Th = 2 * Math.PI * r / l, arr = P.g2.attributes.position.array, Ht = l * Math.cos(al), dz = r - rt;
        for (let i = 0; i <= P.n; i++) { const ph = (i / P.n - 0.5) * Th, psi = ph * l / rt; for (let j = 0; j <= P.m; j++) { const rho = j / P.m * l, o = (i * (P.m + 1) + j) * 3; arr[o] = rho * Math.sin(al) * Math.sin(psi); arr[o + 1] = Ht - rho * Math.cos(al) + 0.012; arr[o + 2] = rho * Math.sin(al) * Math.cos(psi) + dz; } }
        P.g2.attributes.position.needsUpdate = true; P.g2.computeVertexNormals(); P.g2.computeBoundingSphere(); P.disc.position.z = 2 * r * v; }
    },
    overlay(ctx, s, c, S, B) { const A = this.area(c); B.pill(c.unfold > 0.95 ? "Net (flat)" : c.unfold < 0.05 ? "Folded solid" : "Unfolding…", 12, 386, "#ffd27a", 11); if (c.solid === "cone") B.pill(`sector angle θ = 360 × r/l = ${f(A.th, 1)}°`, 12, 360, "#9ad0ff", 11); },
    hud(s, c) { const A = this.area(c), L = [A.F, `= ${A.sub}`, [`= ${f(A.A, 3)} cm²`, null, true]]; if (c.solid === "cone") L.push("—", `slant l = √(r² + H²) = ${f(A.l, 3)}`, `sector: θ = 360r/l = ${f(A.th, 1)}°`, `curved area πrl = (θ/360)πl²`); if (c.solid === "cyl") L.push("—", `rectangle 2πr × h = ${f(2 * Math.PI * c.r, 3)} × ${c.h}`); return [{ title: "Total surface area", lines: L }]; },
    readouts(s, c) { const A = this.area(c); return [["Total surface area", f(A.A, 3) + " cm²"], ["Faces", { cube: 6, cuboid: 6, prism: 5, pyramid: 5, cyl: "2 circles + 1 rectangle", cone: "1 circle + 1 sector" }[c.solid]], ["State", c.unfold > 0.95 ? "net" : "solid"]]; },
    steps(s, c) { const A = this.area(c); if (c.solid === "cone") return [`Slant height l = √(${c.r}² + ${c.H}²) = ${f(A.l, 3)}`, `The curved surface unrolls into a sector of radius l and angle θ = 360 × ${c.r}/${f(A.l, 3)} = ${f(A.th, 1)}°`, `Curved area = πrl = ${f(Math.PI * c.r * A.l, 3)}; base = πr² = ${f(Math.PI * c.r * c.r, 3)}`, `Total = ${f(A.A, 3)} cm²`];
      if (c.solid === "cyl") return [`The curved surface unrolls into a rectangle ${f(2 * Math.PI * c.r, 3)} × ${c.h} (length = circumference 2πr)`, `Curved area = 2πrh = ${f(2 * Math.PI * c.r * c.h, 3)}`, `Two circles = 2πr² = ${f(2 * Math.PI * c.r * c.r, 3)}`, `Total = ${f(A.A, 3)} cm²`];
      return ["Unfold the solid into its net.", "Find the area of each face.", `Add them: ${A.sub} = ${f(A.A, 3)} cm²`]; },
    note: "Surface areas of cubes, cuboids, cylinders, pyramids, right triangular prisms, cones and spheres (4πr²). Relationship between the sector of a circle and the surface area of a cone.",
    mistake: "Using the vertical height instead of the slant height in πrl.",
    draw(g, s, c, B) { const P = B.P, a = B.area, rect = (x, y, w, h, col) => B.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], P.ink, col, 1.6);
      if (c.solid === "cyl") { const k = Math.min((a.w - 20) / (2 * Math.PI * c.r), (a.h - 40) / (c.h + 4 * c.r)), W2 = 2 * Math.PI * c.r * k, H2 = c.h * k, x0 = a.x + (a.w - W2) / 2, y0 = a.y + 20 + 2 * c.r * k; rect(x0, y0, W2, H2, P.fillB); B.circle(x0 + W2 / 2, y0 - c.r * k, c.r * k, P.ink, P.fillA, 1.6); B.circle(x0 + W2 / 2, y0 + H2 + c.r * k, c.r * k, P.ink, P.fillA, 1.6); B.text("2πr", x0 + W2 / 2, y0 + H2 / 2, { align: "center", w: 700 }); return; }
      if (c.solid === "cone") { const l = Math.hypot(c.r, c.H), th = 2 * Math.PI * c.r / l, k = Math.min(a.w, a.h) / (2.6 * l), cx = a.x + a.w / 2, cy = a.y + a.h * 0.25; g.save(); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, l * k, Math.PI / 2 - th / 2, Math.PI / 2 + th / 2); g.closePath(); g.fillStyle = P.fillB; g.fill(); g.strokeStyle = P.ink; g.lineWidth = 1.6; g.stroke(); g.restore(); B.circle(cx, cy + l * k + c.r * k, c.r * k, P.ink, P.fillA, 1.6); B.text(`θ = ${f(360 * c.r / l, 1)}°`, cx, cy + 30, { align: "center", w: 700 }); return; }
      const s0 = Math.min(a.w / 4.4, a.h / 3.4), x0 = a.x + (a.w - 4 * s0) / 2, y0 = a.y + (a.h - 3 * s0) / 2; [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]].forEach(([i, j], k) => rect(x0 + i * s0, y0 + j * s0, s0, s0, [P.fillB, P.fillG, P.fillA, P.fillG, P.fillB, P.fillR][k])); B.text("net of a " + c.solid, a.x + 10, a.y + a.h - 8, { size: 11, color: P.soft }); },
  });

  /* ================= C-c : volumes (glass solids with water) ================= */
  const VSOL = [["cube", "Cube a³"], ["cuboid", "Cuboid lbh"], ["cyl", "Cylinder πr²h"], ["cone", "Cone ⅓πr²h"], ["pyr", "Pyramid ⅓ × base × h"], ["sph", "Sphere 4/3πr³"], ["hemi", "Hemisphere ⅔πr³"], ["comp", "Compound: cylinder + cone"]];
  function vol(c) { const r = c.r, h = c.h, a = c.a, b = c.b;
    switch (c.shape) { case "cube": return a * a * a; case "cuboid": return a * b * h; case "cyl": return Math.PI * r * r * h; case "cone": return Math.PI * r * r * h / 3; case "pyr": return a * a * h / 3; case "sph": return 4 / 3 * Math.PI * r * r * r; case "hemi": return 2 / 3 * Math.PI * r * r * r; default: return Math.PI * r * r * h + Math.PI * r * r * (h * 0.6) / 3; } }
  function volBelow(c, y) { const r = c.r, h = c.h, a = c.a, b = c.b; const sh = c.shape; y = Math.max(0, y);
    if (sh === "cube") return a * a * Math.min(y, a); if (sh === "cuboid") return a * b * Math.min(y, h); if (sh === "cyl") return Math.PI * r * r * Math.min(y, h);
    if (sh === "cone") { const t = Math.min(y, h) / h; return Math.PI * r * r * h / 3 * (1 - Math.pow(1 - t, 3)); } if (sh === "pyr") { const t = Math.min(y, h) / h; return a * a * h / 3 * (1 - Math.pow(1 - t, 3)); }
    if (sh === "sph") { const z = Math.min(y, 2 * r); return Math.PI * z * z * (3 * r - z) / 3; } if (sh === "hemi") { const z = Math.min(y, r); return Math.PI * (r * r * z - z * z * z / 3); }
    const hc = h * 0.6; if (y <= h) return Math.PI * r * r * y; const t = Math.min(y - h, hc) / hc; return Math.PI * r * r * h + Math.PI * r * r * hc / 3 * (1 - Math.pow(1 - t, 3)); }
  function height(c) { return { cube: c.a, cuboid: c.h, cyl: c.h, cone: c.h, pyr: c.h, sph: 2 * c.r, hemi: c.r, comp: c.h * 1.6 }[c.shape]; }
  function crossR(c, y) { const r = c.r, h = c.h; switch (c.shape) { case "cone": return r * (1 - y / h); case "sph": return Math.sqrt(Math.max(0, r * r - (y - r) * (y - r))); case "hemi": return Math.sqrt(Math.max(0, r * r - y * y)); case "comp": return y <= h ? r : r * (1 - (y - h) / (h * 0.6)); default: return r; } }
  MK.def("C-c", {
    kind: "3d", title: "Volumes of solids", label: "3D lab — volumes",
    blurb: "Glass solids on a lab table. Fill them with water, pour a cone into a cylinder (⅓), and scale similar solids (volume × k³).",
    env: "mathdesk", cam: [[2.2, 4.8, 11], [2.2, 1.5, 0]], fov: 36, exposure: 1.0,
    values: { mode: "solid", shape: "cone", a: 2.4, b: 3, h: 3.2, r: 1.4, fill: 0.6, k: 1.5, auto: 1 },
    controls: [{ type: "tabs", key: "mode", label: "Experiment", options: [["solid", "Fill a solid"], ["pour", "Cone → cylinder (⅓)"], ["sphere", "Sphere → cylinder (⅔)"], ["similar", "Similar solids (k³)"]] },
      { type: "select", key: "shape", label: "Solid", options: VSOL, show: W("mode", "solid") }, { key: "fill", label: "Water depth (fraction of height)", min: 0, max: 1, step: 0.01, show: W("mode", "solid") },
      { key: "a", label: "Side a / length l", min: 1, max: 3.5, step: 0.1, unit: "cm", show: (c) => c.mode === "solid" && ["cube", "cuboid", "pyr"].includes(c.shape) }, { key: "b", label: "Width b", min: 1, max: 3.5, step: 0.1, unit: "cm", show: (c) => c.mode === "solid" && c.shape === "cuboid" },
      { key: "r", label: "Radius r", min: 0.6, max: 1.8, step: 0.05, unit: "cm", show: (c) => c.mode !== "solid" || ["cyl", "cone", "sph", "hemi", "comp"].includes(c.shape) }, { key: "h", label: "Height h", min: 1, max: 4, step: 0.1, unit: "cm", show: (c) => (c.mode === "solid" && !["cube", "sph", "hemi"].includes(c.shape)) || c.mode === "pour" || c.mode === "similar" },
      { key: "k", label: "Scale factor k", min: 0.5, max: 2.5, step: 0.1, show: W("mode", "similar") }, { type: "toggle", key: "auto", label: "Animate pouring", show: W("mode", "pour", "sphere") }],
    views: [{ label: "Front", cam: [[2.2, 2.4, 11.5], [2.2, 1.5, 0]] }, { label: "Oblique", cam: [[2.2, 4.8, 11], [2.2, 1.5, 0]] }, { label: "Top", cam: [[2.2, 12, 1], [2.2, 0, 0]] }],
    state: () => ({ t: 0, key: "" }),
    build(S, s, c) { const T = window.THREE; S.renderer.localClippingEnabled = true; s.grp = null; s.key = ""; s.clip = new T.Plane(new T.Vector3(0, -1, 0), 1); s.clip2 = new T.Plane(new T.Vector3(0, -1, 0), 1); this.rebuild(S, s, c); },
    glassMat() { const T = window.THREE; return new T.MeshPhysicalMaterial({ color: 0xeaf6ff, metalness: 0, roughness: 0.03, transmission: 0, transparent: true, opacity: 0.2, clearcoat: 1, side: T.DoubleSide, depthWrite: false, envMapIntensity: 1.5 }); },
    waterMat(clip) { const T = window.THREE; return new T.MeshPhysicalMaterial({ color: 0x2f8fd6, roughness: 0.08, transparent: true, opacity: 0.62, clearcoat: 1, clippingPlanes: [clip], side: T.DoubleSide, depthWrite: false }); },
    geom(T, shape, c, sc = 1) { const r = c.r * sc, h = c.h * sc, a = c.a * sc, b = c.b * sc;
      switch (shape) { case "cube": return [new T.BoxGeometry(a, a, a), a / 2]; case "cuboid": return [new T.BoxGeometry(a, h, b), h / 2]; case "cyl": return [new T.CylinderGeometry(r, r, h, 64, 1, true), h / 2]; case "cone": return [new T.ConeGeometry(r, h, 64, 1, true), h / 2]; case "pyr": { const g = new T.ConeGeometry(a / Math.SQRT2, h, 4, 1, true); g.rotateY(Math.PI / 4); return [g, h / 2]; }
        case "sph": return [new T.SphereGeometry(r, 64, 48), r]; case "hemi": { const g = new T.SphereGeometry(r, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2); return [g, 0]; }
        default: { const pts = [new T.Vector2(0.0001, 0), new T.Vector2(r, 0), new T.Vector2(r, h), new T.Vector2(0.0001, h + h * 0.6)]; return [new T.LatheGeometry(pts, 64), 0]; } } },
    solid(S, G, shape, c, x, sc, clip) { const T = window.THREE, [g, y0] = this.geom(T, shape, c, sc); const glass = new T.Mesh(g, this.glassMat()); glass.position.set(x, y0, 0); glass.renderOrder = 3; G.add(glass);
      const e = new T.LineSegments(new T.EdgesGeometry(g, 25), new T.LineBasicMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.5 })); e.position.copy(glass.position); G.add(e);
      const wg = this.geom(T, shape, c, sc * 0.985)[0]; const water = new T.Mesh(wg, this.waterMat(clip)); water.position.set(x, y0 * 0.985, 0); water.renderOrder = 2; G.add(water);
      const surf = new T.Mesh(shape === "cube" || shape === "cuboid" || shape === "pyr" ? new T.PlaneGeometry(1, 1) : new T.CircleGeometry(1, 64), new T.MeshPhysicalMaterial({ color: 0x5fb2ee, roughness: 0.05, transparent: true, opacity: 0.7, clearcoat: 1, side: T.DoubleSide, depthWrite: false })); surf.rotation.x = -Math.PI / 2; surf.position.x = x; surf.renderOrder = 2; G.add(surf);
      return { glass, water, surf }; },
    rebuild(S, s, c) {
      const T = window.THREE; if (s.grp) { S.scene.remove(s.grp); s.grp.traverse((o) => { o.geometry && o.geometry.dispose(); }); } const G = new T.Group(); S.scene.add(G); s.grp = G; s.items = [];
      if (c.mode === "solid") s.items.push(Object.assign(this.solid(S, G, c.shape, c, 0, 1, s.clip), { shape: c.shape, sc: 1, x: 0 }));
      else if (c.mode === "pour") { s.items.push(Object.assign(this.solid(S, G, "cone", c, -2.1, 1, s.clip), { shape: "cone", sc: 1, x: -2.1 })); s.items.push(Object.assign(this.solid(S, G, "cyl", c, 2.1, 1, s.clip2), { shape: "cyl", sc: 1, x: 2.1 })); }
      else if (c.mode === "sphere") { const cc = Object.assign({}, c, { h: 2 * c.r }); s.items.push(Object.assign(this.solid(S, G, "sph", cc, -2.1, 1, s.clip), { shape: "sph", sc: 1, x: -2.1 })); s.items.push(Object.assign(this.solid(S, G, "cyl", cc, 2.1, 1, s.clip2), { shape: "cyl", sc: 1, x: 2.1, cc })); }
      else { s.items.push(Object.assign(this.solid(S, G, "cyl", c, -2.2, 1, s.clip), { shape: "cyl", sc: 1, x: -2.2 })); s.items.push(Object.assign(this.solid(S, G, "cyl", c, 1.6, c.k, s.clip2), { shape: "cyl", sc: c.k, x: 1.6 })); }
    },
    level(it, c, frac, plane) { const cc = Object.assign({}, it.cc || c, { shape: it.shape }); const hh = height(cc) * it.sc, y = frac * hh * 0.985; plane.constant = y + 0.001; const rr = crossR(Object.assign({}, cc, { r: cc.r * it.sc, h: cc.h * it.sc }), y);
      if (it.shape === "cube" || it.shape === "cuboid") { const w = (it.shape === "cube" ? cc.a : cc.a) * it.sc * 0.985, d = (it.shape === "cube" ? cc.a : cc.b) * it.sc * 0.985; it.surf.scale.set(w, d, 1); }
      else if (it.shape === "pyr") { const w = cc.a * it.sc * (1 - y / (cc.h * it.sc)) * 0.985; it.surf.scale.set(w, w, 1); }
      else it.surf.scale.set(Math.max(0.001, rr * 0.985), Math.max(0.001, rr * 0.985), 1);
      it.surf.position.y = y; it.surf.visible = frac > 0.003 && frac < 0.997 && rr > 0.01 || (it.shape === "cube" || it.shape === "cuboid") && frac > 0.003; },
    update(S, s, c, dt) {
      const k = c.mode + c.shape + c.a + c.b + c.h + c.r + c.k; if (k !== s.key) { s.key = k; this.rebuild(S, s, c); s.t = 0; }
      if (c.mode === "solid") { this.level(s.items[0], c, c.fill, s.clip); return; }
      if (c.mode === "similar") { this.level(s.items[0], c, 0.7, s.clip); this.level(s.items[1], c, 0.7, s.clip2); return; }
      if (c.auto) s.t += dt * 0.22; const n = c.mode === "pour" ? 3 : 1, cyc = s.t % (n + 1.2), done = Math.min(n, Math.floor(cyc)), part = Math.min(1, cyc - Math.floor(cyc)), pouring = cyc < n;
      const src = pouring ? 1 - part : 1, frac = c.mode === "pour" ? (done + (pouring ? part : 0)) / 3 : (pouring ? part : 1) * (2 / 3);
      s.count = pouring ? done + 1 : n; s.frac = frac;
      const it0 = s.items[0], it1 = s.items[1]; const V0 = volBelow(Object.assign({}, c, { shape: it0.shape, h: it0.shape === "sph" ? 2 * c.r : c.h }), 1e9);
      let lo = 0, hi = height(Object.assign({}, c, { shape: it0.shape })); for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (volBelow(Object.assign({}, c, { shape: it0.shape }), m) < src * V0) lo = m; else hi = m; }
      this.level(it0, c, (lo + hi) / 2 / height(Object.assign({}, c, { shape: it0.shape })), s.clip); this.level(it1, c, frac, s.clip2);
    },
    overlay(ctx, s, c, S, B) { if (c.mode === "pour") B.pill(`cones poured: ${s.count || 0} of 3  ·  cylinder ${f((s.frac || 0) * 100, 0)}% full`, 12, 386, "#ffd27a", 11); if (c.mode === "sphere") B.pill(`sphere fills ${f((s.frac || 0) * 100, 0)}% of the cylinder (target ⅔)`, 12, 386, "#ffd27a", 11); if (c.mode === "similar") B.pill(`k = ${c.k}: lengths ×${c.k}, areas ×${f(c.k * c.k, 3)}, volumes ×${f(c.k ** 3, 3)}`, 12, 386, "#ffd27a", 11); },
    hud(s, c) {
      if (c.mode === "solid") { const V = vol(c), Vw = volBelow(c, c.fill * height(c)); const F = { cube: "V = a³", cuboid: "V = l × b × h", cyl: "V = πr²h", cone: "V = ⅓πr²h", pyr: "V = ⅓ × base area × h", sph: "V = 4/3 πr³", hemi: "V = ⅔ πr³", comp: "V = πr²h + ⅓πr²h₂" }[c.shape];
        return [{ title: "Volume", lines: [F, [`= ${f(V, 3)} cm³`, null, true], "—", `water depth ${f(c.fill * height(c), 2)} cm`, `water volume ${f(Vw, 3)} cm³`, `capacity ${f(V, 2)} cm³ = ${f(V / 1000, 4)} litres`] }]; }
      if (c.mode === "pour") return [{ title: "Cone vs cylinder", lines: ["same base radius and height", `cone ⅓πr²h = ${f(Math.PI * c.r * c.r * c.h / 3, 3)}`, `cylinder πr²h = ${f(Math.PI * c.r * c.r * c.h, 3)}`, ["3 cones fill 1 cylinder", null, true]] }];
      if (c.mode === "sphere") return [{ title: "Sphere vs cylinder", lines: ["cylinder just encloses the sphere (h = 2r)", `sphere 4/3πr³ = ${f(4 / 3 * Math.PI * c.r ** 3, 3)}`, `cylinder 2πr³ = ${f(2 * Math.PI * c.r ** 3, 3)}`, ["sphere = ⅔ of the cylinder", null, true]] }];
      const V1 = Math.PI * c.r * c.r * c.h; return [{ title: "Similar solids", lines: ["length ratio k, area ratio k², volume ratio k³", `small V = ${f(V1, 3)} cm³`, [`large V = ${f(V1, 3)} × ${c.k}³ = ${f(V1 * c.k ** 3, 3)} cm³`, null, false]] }]; },
    readouts(s, c) { if (c.mode === "solid") return [["Volume", f(vol(c), 3) + " cm³"], ["Water", f(volBelow(c, c.fill * height(c)), 3) + " cm³"], ["Capacity", f(vol(c) / 1000, 4) + " l"]]; if (c.mode === "similar") return [["Volume ratio", "1 : " + f(c.k ** 3, 3)], ["Area ratio", "1 : " + f(c.k * c.k, 3)]]; return [["Cylinder filled", f((s.frac || 0) * 100, 0) + " %"]]; },
    steps(s, c) { if (c.mode === "solid") { const V = vol(c); return [`Identify the solid and its formula.`, `Substitute: r = ${c.r}, h = ${c.h}, a = ${c.a}`, `V = ${f(V, 3)} cm³ (1000 cm³ = 1 litre)`]; } if (c.mode === "similar") return [`Linear scale factor k = ${c.k}`, `Volume scale factor = k³ = ${f(c.k ** 3, 3)}`, `Multiply the small volume by k³.`]; return ["Fill the smaller solid and pour it into the cylinder.", c.mode === "pour" ? "It takes exactly three cone-fulls: V(cone) = ⅓ V(cylinder)." : "The sphere's water reaches ⅔ of the cylinder: V(sphere) = ⅔ × 2πr³ = 4/3 πr³."]; },
    note: "Volumes of cubes, cuboids, cylinders, cones, right pyramids and spheres; volumes of similar solids (k³) and compound shapes. 1000 cm³ = 1 litre.",
    mistake: "Forgetting the ⅓ for cones and pyramids, or cubing the area ratio instead of the length ratio.",
    draw(g, s, c, B) { const P = B.P, a = B.area; B.text("3D unavailable — volume of the selected solid:", a.x + 10, a.y + 60, { size: 12 }); B.text(f(vol(c), 3) + " cm³", a.x + 10, a.y + 90, { size: 20, w: 800, color: P.blue }); },
  });
})();
