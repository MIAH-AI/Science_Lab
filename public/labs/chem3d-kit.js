/* chem3d-kit.js — apparatus + effects kit for the 3D Chemistry lab.  Usage inside a scene:  const K = Chem3D.kit(S);
   Units: 1 scene unit = 6 cm (so vessel volumes in cm³ are exact: every vessel carries a volume↔height table
   integrated from its inner profile).  Molecules use 1 Å = 1.15 units. */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, rnd = U.rnd, TAU = Math.PI * 2, CM = C3.CM;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), UP = V3(0, 1, 0), qt = new T.Quaternion();
  const rad = (d) => (d * Math.PI) / 180;

  /* ---------------- materials ---------------- */
  function glassMat(o) {                       // fresnel glass: clear in the middle, bright reflective edges
    o = o || {};
    const m = new T.MeshPhysicalMaterial({ color: o.color || 0xe4f3ee, metalness: 0, roughness: o.rough == null ? 0.03 : o.rough, transparent: true, opacity: o.opacity == null ? 0.06 : o.opacity,
      clearcoat: 1, clearcoatRoughness: 0.02, ior: 1.5, envMapIntensity: o.env || 2.4, side: T.DoubleSide, depthWrite: false });
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace("#include <opaque_fragment>", "#include <opaque_fragment>\n float fr_ = pow(1.0 - clamp(abs(dot(normalize(vViewPosition), normal)), 0.0, 1.0), 2.0);\n gl_FragColor.a = clamp(gl_FragColor.a + fr_ * 0.8, 0.0, 1.0);");
    };
    return m;
  }
  function liquidMat(color, opacity) {         // coloured liquid: darker + denser with depth below the free surface
    const m = new T.MeshPhysicalMaterial({ color: new T.Color(color), roughness: 0.05, metalness: 0, transparent: true, opacity: opacity == null ? 0.5 : opacity,
      clearcoat: 0.25, ior: 1.33, envMapIntensity: 0.7, side: T.DoubleSide, depthWrite: false });
    m.userData.u = { uSurf: { value: 0 }, uDepth: { value: 1 } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, m.userData.u);
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying float vWY;").replace("#include <begin_vertex>", "#include <begin_vertex>\n vWY = (modelMatrix * vec4(position, 1.0)).y;");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vWY; uniform float uSurf; uniform float uDepth;")
        .replace("#include <color_fragment>", "#include <color_fragment>\n float dd_ = clamp((uSurf - vWY) / uDepth, 0.0, 1.0); diffuseColor.rgb *= mix(1.0, 0.6, dd_); diffuseColor.a = clamp(diffuseColor.a + dd_ * 0.2, 0.0, 1.0);");
    };
    return m;
  }
  const CPK = { H: 0xf4f4f4, C: 0x3b3f46, N: 0x3454e8, O: 0xe8281c, F: 0x8ee04a, Cl: 0x22d03a, B: 0xffa8a0, Be: 0xb4f000, S: 0xf2e030, P: 0xff8a00, Na: 0xab5cf2, Mg: 0x8aff00, Ca: 0x3dff00, Li: 0xcc80ff, K: 0x8f40d4 };
  const COV = { H: 0.31, C: 0.76, N: 0.71, O: 0.66, F: 0.57, Cl: 1.02, B: 0.84, Be: 0.96, S: 1.05, P: 1.07 };
  const VDW = { H: 1.1, C: 1.7, N: 1.55, O: 1.52, F: 1.47, Cl: 1.75, B: 1.92, Be: 1.53, S: 1.8, P: 1.8 };
  const EN = { H: 2.2, Li: 0.98, Be: 1.57, B: 2.04, C: 2.55, N: 3.04, O: 3.44, F: 3.98, Na: 0.93, Mg: 1.31, P: 2.19, S: 2.58, Cl: 3.16 };
  C3.data = { CPK, COV, VDW, EN };

  /* ---------------- vessel volume tables ---------------- */
  function volTable(inner) {                   // inner: [[r,y]] in cm, y non-decreasing
    const y0 = inner[0][1], y1 = inner[inner.length - 1][1], N = 320;
    const rAt = (y) => { for (let i = 1; i < inner.length; i++) { const a = inner[i - 1], b = inner[i]; if (y <= b[1] + 1e-9) { const dy = b[1] - a[1], k = dy < 1e-9 ? 1 : (y - a[1]) / dy; return a[0] + (b[0] - a[0]) * clamp(k, 0, 1); } } return inner[inner.length - 1][0]; };
    const ys = [y0], vs = [0]; let v = 0, py = y0;
    for (let i = 1; i <= N; i++) { const y = y0 + ((y1 - y0) * i) / N, rm = rAt((y + py) / 2); v += Math.PI * rm * rm * (y - py); py = y; ys.push(y); vs.push(v); }
    const volAt = (y) => { if (y <= y0) return 0; if (y >= y1) return vs[N]; const f = ((y - y0) / (y1 - y0)) * N, i = Math.floor(f); return vs[i] + (vs[Math.min(N, i + 1)] - vs[i]) * (f - i); };
    const yAt = (vol) => { if (vol <= 0) return y0; if (vol >= vs[N]) return y1; let lo = 0, hi = N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (vs[m] <= vol) lo = m; else hi = m; } return ys[lo] + ((vol - vs[lo]) / Math.max(1e-9, vs[hi] - vs[lo])) * (ys[hi] - ys[lo]); };
    return { y0, y1, vmax: vs[N], rAt, volAt, yAt };
  }
  const MENISCUS = [[0, 0], [0.3, 0.002], [0.6, 0.047], [0.8, 0.26], [0.9, 0.53], [0.95, 0.74], [1, 1]];
  let capGeo = null;
  function meniscusGeo() { if (!capGeo) capGeo = new T.LatheGeometry(MENISCUS.map(([r, y]) => new T.Vector2(r, y)), 40); return capGeo; }

  function densify(pts, maxLen) {              // split long profile segments so lathe normals interpolate cleanly
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / maxLen)); for (let k = 1; k <= n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]); }
    return out;
  }
  /* ---------------- vessel definitions (cm) ---------------- */
  const DEFS = {
    beaker: { outer: [[0, 0], [3.1, 0], [3.5, 0.15], [3.62, 0.5], [3.62, 9.6]], inner: [[0, 0.3], [3.0, 0.3], [3.34, 0.58], [3.44, 0.9], [3.44, 9.6]] },
    flask: { outer: [[0, 0], [3.9, 0], [4.45, 0.35], [4.6, 0.9], [1.6, 9.0], [1.5, 9.6], [1.5, 12.4], [1.7, 12.6]], inner: [[0, 0.3], [3.6, 0.3], [4.05, 0.65], [4.2, 1.2], [1.25, 9.0], [1.15, 9.6], [1.15, 12.4], [1.3, 12.6]] },
    testtube: { outer: [[0, 0], [0.3, 0.03], [0.55, 0.15], [0.72, 0.4], [0.8, 0.8], [0.8, 15]], inner: [[0, 0.12], [0.28, 0.15], [0.5, 0.3], [0.62, 0.55], [0.68, 0.9], [0.68, 15]] },
    cylinder: { outer: [[0, 0], [3.0, 0], [3.1, 0.4], [1.8, 0.9], [1.4, 2.0], [1.4, 24]], inner: [[0, 0.6], [1.28, 0.6], [1.28, 24]] },
    gasjar: { outer: [[0, 0], [3.0, 0], [3.3, 0.3], [3.4, 0.7], [3.4, 15]], inner: [[0, 0.3], [3.0, 0.3], [3.2, 0.5], [3.25, 0.9], [3.25, 15]] },
    burette: { outer: [[0, 8.0], [0.5, 8.0], [0.66, 8.5], [0.66, 66.5]], inner: [[0, 8.0], [0.5642, 8.45], [0.5642, 66.5]] },
  };

  C3.kit = function (S) {
    if (S.chemKit) return S.chemKit;
    S.renderer.localClippingEnabled = true;
    const sc = S.scene, mk = S.mk, M = P3D.mat, K = (S.chemKit = { glassMat, liquidMat, CM, data: C3.data });
    const addMesh = (parent, m, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; (parent || sc).add(m); return m; };
    const cmP = (a) => a.map(([r, y]) => new T.Vector2(r * CM, y * CM));

    /* ===== liquid inside a vessel (clipped lathe + meniscus cap); level = lowest point of the surface, cm above vessel origin ===== */
    K.liquid = function (ves, o) {
      o = o || {};
      const mat = liquidMat(Array.isArray(o.color) || o.color == null ? 0xcfe8f5 : o.color, o.opacity == null ? 0.22 : o.opacity);
      const geo = new T.LatheGeometry(densify(ves.innerCm.map(([r, y], i) => [Math.max(0, r - 0.012), y + (i < 2 ? 0.02 : 0)]), 0.5).map(([r, y]) => new T.Vector2(r * CM, y * CM)), 56);
      const body = new T.Mesh(geo, mat); body.renderOrder = 2; ves.group.add(body);
      const plane = new T.Plane(new T.Vector3(0, -1, 0), 0); mat.clippingPlanes = [plane];
      const capMat = new T.MeshPhysicalMaterial({ color: mat.color.clone(), roughness: 0.03, transparent: true, opacity: Math.min(0.9, mat.opacity + 0.18), clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6, side: T.DoubleSide, depthWrite: false });
      const cap = new T.Mesh(meniscusGeo(), capMat); cap.renderOrder = 3; ves.group.add(cap);
      const L = { body, cap, mat, capMat, level: ves.tab.y0, agit: 0, vessel: ves, visible: true };
      L.setLevel = (yCm) => {
        L.level = clamp(yCm, ves.tab.y0, ves.tab.y1);
        const r = ves.tab.rAt(L.level), m = clamp(0.25 * r, 0.02, 0.15);
        cap.position.y = L.level * CM; cap.scale.set(r * CM, m * CM, r * CM); L.meniscus = m;
      };
      L.setVolume = (cm3) => { L.vol = cm3; L.setLevel(ves.tab.yAt(cm3)); };
      L.setColor = (rgb, op) => {
        const c = Array.isArray(rgb) ? new T.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255).convertSRGBToLinear() : new T.Color(rgb);
        mat.color.copy(c); capMat.color.copy(c); if (op != null) { mat.opacity = op; capMat.opacity = Math.min(0.9, op + 0.18); }
      };
      L.setVisible = (v) => { L.visible = v; body.visible = v; cap.visible = v; };
      L.update = (t) => {
        ves.group.updateWorldMatrix(true, false); const wy = ves.group.matrixWorld.elements[13], sy = wy + L.level * CM + 0.0006;
        plane.constant = sy; mat.userData.u.uSurf.value = sy; mat.userData.u.uDepth.value = Math.max(0.25, (L.level - ves.tab.y0) * CM);
        const a = L.agit; cap.rotation.x = a * 0.05 * Math.sin(t * 9); cap.rotation.z = a * 0.05 * Math.cos(t * 7.3);
      };
      if (Array.isArray(o.color)) L.setColor(o.color, o.opacity);
      L.setLevel(ves.tab.y0); L.update(0); return L;
    };

    /* ===== generic glass vessel from a profile ===== */
    K.vessel = function (kind, o) {
      o = o || {};
      const d = typeof kind === "string" ? DEFS[kind] : kind, g = new T.Group();
      const prof = densify(d.inner.concat(d.outer.slice().reverse()), 0.5), geo = new T.LatheGeometry(cmP(prof), 64);
      const glass = new T.Mesh(geo, glassMat({ color: o.tint })); glass.renderOrder = 4; g.add(glass);
      const top = d.outer[d.outer.length - 1], ti = d.inner[d.inner.length - 1];
      const bead = new T.Mesh(new T.TorusGeometry(((top[0] + ti[0]) / 2) * CM, Math.max(0.004, ((top[0] - ti[0]) / 2) * CM * 0.9), 10, 48), glassMat({ opacity: 0.2, env: 3 }));
      bead.rotation.x = Math.PI / 2; bead.position.y = top[1] * CM; bead.renderOrder = 4; g.add(bead);
      const ves = { group: g, glass, innerCm: d.inner, outerCm: d.outer, tab: volTable(d.inner), kind: typeof kind === "string" ? kind : "custom", topCm: top[1] };
      if (!o.noAdd) sc.add(g);
      ves.addLiquid = (lo) => (ves.liq = K.liquid(ves, lo));
      return ves;
    };
    /* graduation marks on an arc of an open cylinder (front, facing +z) */
    K.scale = function (o) {
      const H = o.y1 - o.y0, ppc = Math.min(64, 3800 / H), W = 128, cH = Math.max(8, Math.round(H * ppc)), c = U.cv(W, cH), g = c.getContext("2d");
      g.strokeStyle = g.fillStyle = o.color || "#14171c"; g.font = "bold " + Math.round(clamp(ppc * 0.46, 9, 28)) + "px sans-serif"; g.textBaseline = "middle";
      o.ticks.forEach((t) => { const py = (o.y1 - t.y) * ppc; g.lineWidth = t.len >= 1 ? 2.4 : 1.4; g.beginPath(); g.moveTo(W * 0.1, py); g.lineTo(W * (0.1 + 0.5 * t.len), py); g.stroke(); if (t.label != null) g.fillText(String(t.label), W * 0.1 + W * 0.5 + 5, py); });
      const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 16;
      const arc = o.arc || rad(110), m = new T.Mesh(new T.CylinderGeometry(o.r * CM, o.r * CM, H * CM, 28, 1, true, -arc / 2 - rad(8), arc), new T.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false }));
      m.position.y = (o.y0 + H / 2) * CM; m.renderOrder = 6; return m;
    };

    /* ===== standard apparatus ===== */
    K.beaker = (o) => { const v = K.vessel("beaker", o); return v; };
    K.flask = (o) => { const v = K.vessel("flask", o); return v; };
    K.testTube = (o) => K.vessel("testtube", o);
    K.measCylinder = function (o) {
      const v = K.vessel("cylinder", o), ticks = [];
      for (let ml = 0; ml <= 100; ml += 1) { const y = v.tab.yAt(ml) ; if (ml === 0) continue; ticks.push({ y: v.tab.yAt(ml), len: ml % 10 === 0 ? 1 : ml % 5 === 0 ? 0.7 : 0.4, label: ml % 10 === 0 ? ml : null }); }
      v.group.add(K.scale({ r: 1.45, y0: 0.6, y1: v.tab.yAt(102), ticks })); return v;
    };
    K.tile = function (sizeCm) {
      const s = (sizeCm || 16) * CM, m = mk.rbox(s, 0.8 * CM, s, 0.05, M.ceramic(0xf6f7f5)); m.position.y = 0.4 * CM; m.receiveShadow = true; return m;
    };
    K.contact = function (x, y, z, rCm, op) {           // soft contact shadow blob on a surface
      const c = U.cv(128, 128), g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, "rgba(0,0,0," + (op || 0.5) + ")"); gr.addColorStop(0.55, "rgba(0,0,0," + (op || 0.5) * 0.45 + ")"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      const t = new T.CanvasTexture(c), m = new T.Mesh(new T.PlaneGeometry(rCm * 2 * CM, rCm * 2 * CM), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, y + 0.002, z); m.renderOrder = 1; sc.add(m); return m;
    };
    K.bottle = function (o) {                           // reagent bottle (decor): amber glass, cap, label
      o = o || {}; const h = o.h || 14, r = o.r || 3.2, g = new T.Group();
      const pts = [[0, 0], [r * 0.9, 0], [r, 0.4], [r, h * 0.62], [r * 0.55, h * 0.78], [r * 0.32, h * 0.86], [r * 0.32, h], [r * 0.4, h]], inn = pts.map(([a, b]) => [Math.max(0, a - 0.18), Math.max(0.25, b)]).reverse();
      const gl = new T.Mesh(new T.LatheGeometry(cmP(pts.concat(inn)), 40), glassMat({ color: o.color || 0x8a4a14, opacity: 0.55, env: 1.4 })); gl.renderOrder = 4; g.add(gl);
      const cap = new T.Mesh(new T.CylinderGeometry(r * 0.42 * CM, r * 0.42 * CM, 1.6 * CM, 24), M.plastic(0x1c1f24, 0.4)); cap.position.y = (h + 0.6) * CM; addMesh(g, cap);
      const lc = U.cv(256, 128), lg = lc.getContext("2d"); lg.fillStyle = "#f4f1e6"; lg.fillRect(0, 0, 256, 128); lg.strokeStyle = "#c33"; lg.lineWidth = 6; lg.strokeRect(5, 5, 246, 118);
      lg.fillStyle = "#222"; lg.font = "bold 34px sans-serif"; lg.textAlign = "center"; lg.fillText(o.label || "HCl", 128, 62); lg.font = "16px sans-serif"; lg.fillText(o.sub || "0.100 mol/dm³", 128, 98);
      const lt = new T.CanvasTexture(lc); lt.colorSpace = T.SRGBColorSpace;
      const lab = new T.Mesh(new T.CylinderGeometry((r + 0.03) * CM, (r + 0.03) * CM, h * 0.42 * CM, 32, 1, true, -0.9, 1.8), new T.MeshStandardMaterial({ map: lt, roughness: 0.7, side: T.DoubleSide })); lab.position.y = h * 0.34 * CM; g.add(lab);
      sc.add(g); return g;
    };
    /* retort stand + boss/clamp arm to a target (x,z in units) at height yCm */
    K.retort = function (o) {
      const g = new T.Group(), h = o.h || 80, steel = M.steel(), dark = M.matte(0x22262d, 0.45);
      const base = new T.Mesh(new T.BoxGeometry(15 * CM, 1.4 * CM, 9.5 * CM), dark); base.position.y = 0.7 * CM; addMesh(g, base);
      const rod = new T.Mesh(new T.CylinderGeometry(0.55 * CM, 0.55 * CM, h * CM, 20), steel); rod.position.set(-4.2 * CM, (h / 2 + 1.4) * CM, 0); addMesh(g, rod);
      g.position.set(o.x || 0, 0, o.z || 0); sc.add(g); g.rodX = o.x - 4.2 * CM; g.rodZ = o.z || 0; return g;
    };
    K.clampArm = function (stand, yCm, tx, tz, rCm) {
      const g = new T.Group(), rx = stand.position.x - 4.2 * CM, rz = stand.position.z, y = yCm * CM, steel = M.steel(), dark = M.matte(0x22262d, 0.4);
      const boss = new T.Mesh(new T.BoxGeometry(2.2 * CM, 2.2 * CM, 2.2 * CM), dark); boss.position.set(rx, y, rz); addMesh(g, boss);
      const a = V3(rx, y, rz), b = V3(tx, y, tz), arm = new T.Mesh(new T.CylinderGeometry(0.35 * CM, 0.35 * CM, 1, 14), steel); S.setRod(arm, a, b.clone().lerp(a, 0.05)); addMesh(g, arm);
      const dir = b.clone().sub(a).normalize(), jaw = new T.Mesh(new T.TorusGeometry((rCm + 0.1) * CM, 0.22 * CM, 10, 28, Math.PI * 1.55), steel);
      jaw.rotation.x = Math.PI / 2; jaw.rotation.z = Math.atan2(dir.z, dir.x) + Math.PI * 0.2; jaw.position.set(tx, y, tz); addMesh(g, jaw);
      const knob = new T.Mesh(new T.CylinderGeometry(0.5 * CM, 0.5 * CM, 0.8 * CM, 16), dark); knob.rotation.z = Math.PI / 2; knob.position.set(rx - 1.4 * CM, y, rz); addMesh(g, knob);
      sc.add(g); return g;
    };

    /* ===== 50 cm³ burette: graduated tube (reading R in cm³ below the zero mark), PTFE tap, jet tip ===== */
    K.burette = function (o) {
      o = o || {}; const ZERO = 64, g = new T.Group(), ves = K.vessel("burette", { noAdd: true });
      g.add(ves.group); ves.group.position.set(0, 0, 0);
      const ticks = []; for (let i = 0; i <= 500; i++) { const R = i / 10; ticks.push({ y: ZERO - R, len: i % 10 === 0 ? 1 : i % 5 === 0 ? 0.68 : 0.38, label: i % 10 === 0 ? R : null }); }
      ves.group.add(K.scale({ r: 0.7, y0: ZERO - 50.6, y1: ZERO + 0.6, ticks, arc: rad(120) }));
      const blue = new T.Mesh(new T.CylinderGeometry(0.67 * CM, 0.67 * CM, 53 * CM, 8, 1, true, Math.PI - 0.1, 0.2), new T.MeshBasicMaterial({ color: 0x2f6bff, transparent: true, opacity: 0.5, side: T.DoubleSide, depthWrite: false })); blue.position.y = (ZERO - 25) * CM; ves.group.add(blue);   // Schellbach stripe
      const jet = new T.Mesh(new T.LatheGeometry(cmP([[0.12, 0], [0.16, 0.8], [0.34, 3.0], [0.5, 6.0], [0.5, 7.9], [0.4, 7.9], [0.4, 6.0], [0.22, 3.0], [0.08, 0.8], [0.07, 0]]), 24), glassMat({ opacity: 0.1 })); jet.renderOrder = 4; g.add(jet);
      const jetL = new T.Mesh(new T.CylinderGeometry(0.34 * CM, 0.07 * CM, 6.5 * CM, 16), liquidMat(o.color || 0xcfe8f5, 0.3)); jetL.position.y = 3.6 * CM; jetL.renderOrder = 2; g.add(jetL);
      const barrel = new T.Mesh(new T.CylinderGeometry(0.75 * CM, 0.75 * CM, 2.6 * CM, 24), M.plastic(0xf2f2ee, 0.35)); barrel.rotation.z = Math.PI / 2; barrel.position.y = 6.5 * CM; addMesh(g, barrel);
      const knobA = new T.Mesh(new T.CylinderGeometry(0.55 * CM, 0.55 * CM, 0.7 * CM, 20), M.plastic(0xf2f2ee, 0.35)); knobA.rotation.z = Math.PI / 2; knobA.position.set(1.6 * CM, 6.5 * CM, 0); addMesh(g, knobA);
      const handle = new T.Group(); handle.position.set(1.95 * CM, 6.5 * CM, 0);
      const bar = new T.Mesh(new T.BoxGeometry(0.45 * CM, 0.34 * CM, 4.4 * CM), M.plastic(0xff8a1f, 0.35)); addMesh(handle, bar); g.add(handle);
      g.tapAngle = (k) => { handle.rotation.x = (1 - clamp(k, 0, 1)) * (Math.PI / 2); };   // 0 closed (handle across), 1 open (handle along the tube)
      g.tapAngle(0);
      ves.liq = K.liquid(ves, { color: o.color || 0xcfe8f5, opacity: o.opacity == null ? 0.22 : o.opacity }); ves.liq.setLevel(ZERO);
      g.ves = ves; g.ZERO = ZERO; g.jetLiquid = jetL; g.tipY = 0;
      /* white reading card behind the tube + black meniscus band that follows the liquid (standard reading technique) */
      const card = new T.Mesh(new T.BoxGeometry(5 * CM, 58 * CM, 0.25 * CM), M.matte(0xf3f3ee, 0.8)); card.position.set(0, (ZERO - 24) * CM, -1.55 * CM); addMesh(g, card, false, true);
      const band = new T.Mesh(new T.BoxGeometry(4.6 * CM, 2.3 * CM, 0.1 * CM), M.matte(0x0a0a0a, 0.9)); band.position.z = -1.38 * CM; g.add(band);
      g.setReading = (R) => { g.reading = R; ves.liq.setLevel(ZERO - R); band.position.y = (ZERO - R - 1.25) * CM; };
      g.setLiquid = (rgb, op) => { ves.liq.setColor(rgb, op); jetL.material.color.copy(ves.liq.mat.color); };
      g.levelWorldY = () => g.position.y + (ZERO - (g.reading || 0)) * CM; sc.add(g); return g;
    };

    /* ===== drops, stream and ripples ===== */
    K.drops = function (o) {
      o = o || {}; const N = 12, G = 981 * CM, pool = [], rip = [], col = new T.Color(o.color || 0xcfe8f5);
      const dm = new T.MeshPhysicalMaterial({ color: col, transparent: true, opacity: 0.6, roughness: 0.03, clearcoat: 1, envMapIntensity: 2, depthWrite: false });
      for (let i = 0; i < N; i++) { const m = new T.Mesh(new T.SphereGeometry(1, 16, 12), dm); m.visible = false; sc.add(m); pool.push({ m, on: false, y: 0, vy: 0, to: 0, r: 0.03, cb: null }); }
      const hang = new T.Mesh(new T.SphereGeometry(1, 16, 12), dm); hang.visible = false; sc.add(hang);
      const stream = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 10), dm); stream.visible = false; sc.add(stream);
      for (let i = 0; i < 6; i++) { const m = new T.Mesh(new T.RingGeometry(0.86, 1, 40), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide })); m.rotation.x = -Math.PI / 2; m.visible = false; sc.add(m); rip.push({ m, age: 9 }); }
      const D = { color: (c) => dm.color.set(c) };
      D.setColor = (rgbOrHex) => { const c = Array.isArray(rgbOrHex) ? new T.Color(rgbOrHex[0] / 255, rgbOrHex[1] / 255, rgbOrHex[2] / 255).convertSRGBToLinear() : new T.Color(rgbOrHex); dm.color.copy(c); };
      D.setHang = (x, y, z, k, r) => { hang.visible = k > 0.02; const s = (r || 0.04) * Math.min(1, k); hang.scale.set(s, s * (1 + 0.5 * k), s); hang.position.set(x, y - s * (1 + 0.5 * k) * 0.9, z); };
      D.emit = (x, y, z, toY, r, cb) => { const d = pool.find((p) => !p.on); if (!d) return; Object.assign(d, { on: true, y, vy: 0, to: toY, r: r || 0.04, cb, x, z }); d.m.visible = true; d.m.position.set(x, y, z); };
      D.setStream = (x, yTop, z, yBot, on) => { stream.visible = !!on; if (!on) return; const L = Math.max(0.01, yTop - yBot); stream.scale.set(0.014, L, 0.014); stream.position.set(x, yBot + L / 2, z); };
      D.ripple = (x, y, z) => { const r = rip.find((q) => q.age > 1) || rip[0]; r.age = 0; r.m.position.set(x, y + 0.002, z); r.m.visible = true; };
      D.update = (dt) => {
        pool.forEach((d) => { if (!d.on) return; d.vy += G * dt; d.y -= d.vy * dt; const s = d.r; d.m.scale.set(s * 0.85, s * (1 + Math.min(0.5, d.vy * 0.05)), s * 0.85); d.m.position.y = d.y;
          if (d.y <= d.to) { d.on = false; d.m.visible = false; D.ripple(d.x, d.to, d.z); d.cb && d.cb(); } });
        rip.forEach((q) => { if (q.age > 1) return; q.age += dt * 1.25; const k = q.age; q.m.scale.setScalar(0.03 + k * 0.42); q.m.material.opacity = 0.55 * (1 - k); if (k >= 1) q.m.visible = false; });
      };
      return D;
    };

    /* ===== rising gas bubbles inside a vessel ===== */
    K.bubbles = function (ves, liq, o) {
      o = o || {}; const n = o.n || 70, im = new T.InstancedMesh(new T.SphereGeometry(1, 12, 10), glassMat({ opacity: 0.1, env: 3.2 }), n), m4 = new T.Matrix4();
      im.renderOrder = 5; im.frustumCulled = false; ves.group.add(im);
      const st = []; for (let i = 0; i < n; i++) { st.push({ on: false, x: 0, y: 0, z: 0, vy: 0, r: 0.1, ph: rnd(0, 6) }); m4.makeScale(0, 0, 0); im.setMatrixAt(i, m4); }
      const B = { rate: 0, im, acc: 0 }, sx = o.x || 0, sz = o.z || 0, base = o.baseY == null ? ves.tab.y0 + 0.4 : o.baseY, spread = o.spread == null ? 0.4 : o.spread;
      B.update = (dt, t) => {
        B.acc += B.rate * dt; while (B.acc >= 1) { B.acc -= 1; const b = st.find((q) => !q.on); if (!b) break; b.on = true; b.x = sx + rnd(-spread, spread); b.z = sz + rnd(-spread, spread); b.y = base; b.vy = rnd(8, 14); b.r = rnd(0.08, 0.2); }
        st.forEach((b, i) => { if (!b.on) { return; } b.y += b.vy * dt; b.vy += 4 * dt; b.x += Math.sin(t * 7 + b.ph) * 0.4 * dt; if (b.y >= liq.level - 0.05) { b.on = false; m4.makeScale(0, 0, 0); im.setMatrixAt(i, m4); return; }
          const r = b.r * CM * (1 + (b.y - base) * 0.004); m4.makeScale(r, r, r); m4.setPosition(b.x * CM, b.y * CM, b.z * CM); im.setMatrixAt(i, m4); });
        im.instanceMatrix.needsUpdate = true;
      };
      return B;
    };

    /* ===== precipitate: particles form near the surface, sink and build a sediment layer ===== */
    K.precipitate = function (ves, liq, o) {
      o = o || {}; const n = o.n || 1400, pos = new Float32Array(n * 3), geo = new T.BufferGeometry(); geo.setAttribute("position", new T.BufferAttribute(pos, 3));
      const mat = new T.PointsMaterial({ color: o.color || 0xffffff, size: o.size || 0.032, map: U.softDot(64, "rgba(255,255,255,1)"), transparent: true, opacity: 0.9, depthWrite: false });
      const pts = new T.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 3; ves.group.add(pts);
      const st = []; for (let i = 0; i < n; i++) st.push({ y: 0, a: rnd(0, TAU), rr: Math.sqrt(Math.random()), v: rnd(0.6, 2.4), rest: false, h: rnd(0, 0.35) });
      const P = { amount: 0, mat, pts, shown: 0, n };
      P.setColor = (c) => mat.color.set(c);
      P.reset = () => { P.shown = 0; geo.setDrawRange(0, 0); st.forEach((s) => { s.rest = false; s.y = 0; s.born = false; }); };
      P.update = (dt) => {
        const want = Math.floor(n * clamp(P.amount, 0, 1)), top = liq.level - 0.2, base = ves.tab.y0;
        while (P.shown < want) { const s = st[P.shown]; s.y = top - rnd(0, 2.5); s.rest = false; s.born = true; P.shown++; }
        if (P.shown > want) P.shown = want;
        for (let i = 0; i < P.shown; i++) { const s = st[i]; if (!s.rest) { s.y -= s.v * dt; if (s.y <= base + 0.1 + s.h) { s.y = base + 0.12 + s.h * 0.6; s.rest = true; } }
          const rmax = Math.max(0.05, ves.tab.rAt(Math.max(base, s.y)) - 0.15), rr = s.rest ? rmax * s.rr : rmax * s.rr;
          pos[i * 3] = Math.cos(s.a) * rr * CM; pos[i * 3 + 1] = Math.min(s.y, top) * CM; pos[i * 3 + 2] = Math.sin(s.a) * rr * CM; }
        geo.setDrawRange(0, P.shown); geo.attributes.position.needsUpdate = true;
      };
      P.reset(); return P;
    };

    /* ===== Bunsen burner with a temperature-coloured flame (air hole closed = yellow luminous, open = blue non-luminous) ===== */
    K.bunsen = function (o) {
      o = o || {}; const g = new T.Group(), steel = M.steel(), dark = M.matte(0x23262c, 0.4);
      const base = new T.Mesh(new T.CylinderGeometry(3.6 * CM, 4.2 * CM, 1.0 * CM, 40), M.paint(0x2b6fd6)); base.position.y = 0.5 * CM; addMesh(g, base);
      const barrel = new T.Mesh(new T.CylinderGeometry(0.85 * CM, 0.85 * CM, 11 * CM, 28), steel); barrel.position.y = 6.5 * CM; addMesh(g, barrel);
      const collar = new T.Mesh(new T.CylinderGeometry(1.0 * CM, 1.0 * CM, 2.4 * CM, 28), M.brass()); collar.position.y = 2.6 * CM; addMesh(g, collar);
      const hole = new T.Mesh(new T.BoxGeometry(0.9 * CM, 1.2 * CM, 0.1 * CM), M.matte(0x050505, 1)); hole.position.set(0, 2.6 * CM, 1.0 * CM); g.add(hole);
      const inlet = new T.Mesh(new T.CylinderGeometry(0.5 * CM, 0.5 * CM, 4 * CM, 16), M.rubber()); inlet.rotation.z = Math.PI / 2; inlet.position.set(-2.6 * CM, 1.4 * CM, 0); addMesh(g, inlet);
      const fl = K.flame({ h: o.flameH || 7.5, r: 1.15 }); fl.group.position.y = 12.1 * CM; g.add(fl.group); g.flame = fl;
      g.setAir = (a) => { g.air = clamp(a, 0, 1); hole.scale.y = 0.15 + g.air * 0.85; hole.material.opacity = 1; fl.set(g.air, g.gas == null ? 1 : g.gas); };
      g.setGas = (q) => { g.gas = clamp(q, 0, 1.2); fl.set(g.air == null ? 1 : g.air, g.gas); };
      g.air = 1; g.gas = 1; fl.set(1, 1); g.position.set(o.x || 0, o.y || 0, o.z || 0); sc.add(g); return g;
    };
    K.flame = function (o) {
      o = o || {}; const g = new T.Group(), H = (o.h || 7) * CM, R = (o.r || 1.1) * CM, pts = [];
      for (let i = 0; i <= 18; i++) { const t = i / 18; pts.push(new T.Vector2(R * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.55)), 0.9) * (1 - 0.3 * t) + 0.0001, t * H)); }
      const mk2 = (scale, mix0) => new T.ShaderMaterial({
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
        uniforms: { uT: { value: 0 }, uMix: { value: mix0 }, uI: { value: 1 }, uH: { value: H }, uS: { value: scale } },
        vertexShader: "uniform float uT; uniform float uH; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = position.y / uH; vec3 p = position; float w = sin(vY*9.0 - uT*16.0) * 0.045 * vY * vY + sin(vY*5.0 + uT*11.0 + position.x*20.0) * 0.03 * vY; p.x += w * uH * 0.25; p.z += cos(vY*7.0 - uT*13.0) * 0.03 * vY * uH * 0.25; vec4 mv = modelViewMatrix * vec4(p,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
        fragmentShader: "uniform float uMix; uniform float uI; uniform float uS; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vec3 blue = mix(vec3(0.10,0.28,1.0), vec3(0.50,0.72,1.0), vY); vec3 yel = mix(vec3(1.0,0.86,0.36), vec3(1.0,0.42,0.06), vY); vec3 col = mix(blue, yel, uMix); float rim = pow(abs(dot(normalize(vN), normalize(vV))), 1.3); float a = rim * (1.0 - smoothstep(0.55, 1.0, vY)) * (0.35 + 0.65 * (1.0 - vY)) * uI * uS; gl_FragColor = vec4(col * 1.35, a); }",
      });
      const outer = new T.Mesh(new T.LatheGeometry(pts, 28), mk2(0.9, 0)), innerPts = pts.map((p) => new T.Vector2(p.x * 0.5 + 0.0001, p.y * 0.55)), inner = new T.Mesh(new T.LatheGeometry(innerPts, 24), mk2(1.4, 0));
      outer.renderOrder = inner.renderOrder = 8; g.add(outer, inner);
      const glow = mk.soft(0x7fb4ff, 2.2, 0, H * 0.35, 0, 0.35); g.add(glow);
      const light = new T.PointLight(0x9cc0ff, 4, 9, 1.6); light.position.y = H * 0.4; g.add(light);
      const F = { group: g, mix: 0, outer, inner, glow, light };
      F.set = (air, gas) => { F.mix = 1 - clamp(air, 0, 1); F.gas = gas; };
      F.update = (t) => {
        const gas = F.gas == null ? 1 : F.gas; g.visible = gas > 0.03;
        [outer, inner].forEach((m) => { m.material.uniforms.uT.value = t; m.material.uniforms.uMix.value = F.mix; m.material.uniforms.uI.value = clamp(gas, 0, 1.2); });
        const sc2 = 0.35 + 0.65 * Math.min(1.1, gas); g.scale.set(sc2 * (0.85 + 0.15 * (1 - F.mix)), sc2 * (1 + 0.45 * F.mix), sc2 * (0.85 + 0.15 * (1 - F.mix)));
        inner.visible = F.mix < 0.6; inner.material.uniforms.uS.value = 1.4 * (1 - F.mix);
        const fk = 0.85 + 0.15 * Math.sin(t * 31) + 0.08 * Math.sin(t * 17.3); light.intensity = 4 * gas * fk; light.color.setRGB(0.55 + 0.45 * F.mix, 0.75 - 0.2 * F.mix, 1 - 0.8 * F.mix); glow.material.color.copy(light.color); glow.material.opacity = 0.35 * gas;
      };
      return F;
    };

    /* ===== molecules: ball-and-stick ↔ space-filling morph, bonds, lone-pair lobes ===== */
    K.molecule = function (def, o) {
      o = o || {}; const A2U = 1.15, g = new T.Group(), atoms = [], bonds = [], lone = [], rodGeo = new T.CylinderGeometry(0.075, 0.075, 1, 14);
      def.atoms.forEach((a) => {
        const el = a.el, m = new T.Mesh(new T.SphereGeometry(1, 48, 32), new T.MeshPhysicalMaterial({ color: CPK[el] || 0xcccccc, roughness: 0.22, clearcoat: 0.9, clearcoatRoughness: 0.12, metalness: 0 }));
        m.castShadow = true; g.add(m); atoms.push({ el, mesh: m, p: V3(a.p[0] * A2U, a.p[1] * A2U, a.p[2] * A2U), bs: (0.19 * (VDW[el] || 1.6) + 0.04) * A2U, vdw: (VDW[el] || 1.6) * A2U * 0.92 });
      });
      const rodMat = M.matte(0xcfd5df, 0.35); rodMat.metalness = 0.2;
      (def.bonds || []).forEach(([i, j, ord]) => { const rods = []; for (let k = 0; k < (ord || 1); k++) { const r = new T.Mesh(rodGeo, rodMat); r.castShadow = true; g.add(r); rods.push(r); } bonds.push({ i, j, ord: ord || 1, rods }); });
      const lobeMat = new T.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0.42, blending: T.AdditiveBlending, depthWrite: false });
      (def.lone || []).forEach((l) => { const m = new T.Mesh(new T.SphereGeometry(1, 24, 18), lobeMat); m.renderOrder = 5; g.add(m); const dots = [0, 1].map(() => { const d = new T.Mesh(new T.SphereGeometry(0.055, 10, 8), M.emissive(0xfff2c0, 2)); g.add(d); return d; }); lone.push({ atom: l.atom, dir: V3(...l.dir).normalize(), mesh: m, dots }); });
      const MO = { group: g, atoms, bonds, lone, style: 0, A2U };
      MO.refresh = (style) => {
        if (style != null) MO.style = style; const t = MO.style, bf = 1 - clamp((t - 0.35) / 0.4, 0, 1);
        atoms.forEach((a) => { const r = a.bs + (a.vdw - a.bs) * t; a.mesh.scale.setScalar(r); a.mesh.position.copy(a.p); a.r = r; });
        bonds.forEach((b) => {
          const a = atoms[b.i].p, c = atoms[b.j].p, d = c.clone().sub(a), L = d.length(), u = d.clone().multiplyScalar(1 / L);
          let perp = u.clone().cross(UP); if (perp.lengthSq() < 1e-4) perp = u.clone().cross(V3(1, 0, 0)); perp.normalize();
          b.rods.forEach((r, k) => { const off = (k - (b.ord - 1) / 2) * 0.2; r.position.copy(a).addScaledVector(d, 0.5).addScaledVector(perp, off); r.scale.set(Math.max(0.0001, bf) * (b.ord > 1 ? 0.75 : 1), L, Math.max(0.0001, bf) * (b.ord > 1 ? 0.75 : 1)); r.quaternion.copy(qt.setFromUnitVectors(UP, u)); r.visible = bf > 0.02; });
        });
        lone.forEach((l) => { const c = atoms[l.atom], dist = c.r * 0.55 + 0.5 * (1 - t) + 0.3; const pos = c.p.clone().addScaledVector(l.dir, dist + 0.2); l.mesh.position.copy(pos); l.mesh.scale.set(0.34, 0.34, 0.55); l.mesh.quaternion.copy(qt.setFromUnitVectors(V3(0, 0, 1), l.dir)); l.mesh.visible = t < 0.75;
          l.dots.forEach((d, k) => { d.position.copy(pos).addScaledVector(V3(1, 0, 0).applyQuaternion(l.mesh.quaternion), (k ? 1 : -1) * 0.12); d.visible = t < 0.75; }); });
      };
      MO.refresh(0); sc.add(g); return MO;
    };
    K.labelAtoms = function (ctx, mol, size) {
      ctx.save(); ctx.font = "700 " + (size || 12) + "px 'IBM Plex Mono',monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      mol.atoms.forEach((a) => { const w = mol.group.localToWorld(a.p.clone()), q = S.proj(w); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.65)"; ctx.fillStyle = "#fff"; ctx.strokeText(a.el, q.x, q.y); ctx.fillText(a.el, q.x, q.y); });
      ctx.restore();
    };

    /* ===== atomic-orbital probability cloud (|ψ|² point sampling; colour = phase sign) ===== */
    K.orbital = function (kind, o) {
      o = o || {}; const N = o.n || 7000;
      const RAD = { "1s": (r) => Math.exp(-r), "2s": (r) => (2 - r) * Math.exp(-r / 2), "2p": (r) => r * Math.exp(-r / 2), "3s": (r) => (27 - 18 * r + 2 * r * r) * Math.exp(-r / 3), "3p": (r) => r * (6 - r) * Math.exp(-r / 3), "3d": (r) => r * r * Math.exp(-r / 3) };
      const ANG = { s: () => 1, px: (x, y, z) => x, py: (x, y, z) => y, pz: (x, y, z) => z, dz2: (x, y, z) => 3 * z * z - 1, dxy: (x, y, z) => 2 * x * y * 1.0, dx2y2: (x, y, z) => x * x - y * y, dxz: (x, y, z) => 2 * x * z, dyz: (x, y, z) => 2 * y * z };
      const rf = RAD[o.radial || kind.slice(0, 2)] || RAD["1s"], af = ANG[o.angular || (kind.length > 2 ? kind.slice(2) : "s")] || ANG.s;
      const rmax = { "1s": 9, "2s": 22, "2p": 20, "3s": 40, "3p": 38, "3d": 36 }[o.radial || kind.slice(0, 2)] || 12, M2 = 600;
      const cdf = [0]; for (let i = 1; i <= M2; i++) { const r = (rmax * i) / M2; cdf.push(cdf[i - 1] + r * r * rf(r) * rf(r)); } const tot = cdf[M2];
      let amax = 0; for (let i = 0; i < 400; i++) { const z = rnd(-1, 1), a = rnd(0, TAU), s = Math.sqrt(1 - z * z); amax = Math.max(amax, Math.abs(af(s * Math.cos(a), s * Math.sin(a), z))); }
      const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), cp = new T.Color(0x55b8ff).multiplyScalar(1.8), cn = new T.Color(0xff7a52).multiplyScalar(1.8); let n = 0, tries = 0, rr99 = [];
      while (n < N && tries++ < N * 400) {
        const u = Math.random() * tot; let lo = 0, hi = M2; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cdf[m] <= u) lo = m; else hi = m; } const r = (rmax * (lo + Math.random())) / M2;
        const z = rnd(-1, 1), a = rnd(0, TAU), s = Math.sqrt(1 - z * z), x = s * Math.cos(a), y = s * Math.sin(a), av = af(x, y, z);
        if (Math.random() * amax * amax > av * av) continue;
        pos.set([x * r, y * r, z * r], n * 3); const c = av * rf(r) >= 0 ? cp : cn; col.set([c.r, c.g, c.b], n * 3); rr99.push(r); n++;
      }
      rr99.sort((p, q) => p - q); const r99 = rr99[Math.floor(rr99.length * 0.97)] || 5, k = (o.size || 2.8) / r99;
      for (let i = 0; i < n * 3; i++) pos[i] *= k;
      const geo = new T.BufferGeometry(); geo.setAttribute("position", new T.BufferAttribute(pos, 3)); geo.setAttribute("color", new T.BufferAttribute(col, 3)); geo.setDrawRange(0, n);
      const pts = new T.Points(geo, new T.PointsMaterial({ size: o.pt || 0.14, vertexColors: true, map: U.softDot(64, "rgba(255,255,255,1)"), transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending }));
      pts.frustumCulled = false; sc.add(pts); return { pts, scale: k, r99: r99 * k };
    };

    /* ===== crystal / bonding lattices ===== */
    K.lattice = function (kind, o) {
      o = o || {}; const g = new T.Group(), n = o.n || 3, atoms = [], links = [];
      const mkIn = (r, color, list, rough) => { const im = new T.InstancedMesh(new T.SphereGeometry(r, 28, 20), new T.MeshPhysicalMaterial({ color, roughness: rough == null ? 0.25 : rough, clearcoat: 0.8 }), Math.max(1, list.length)); im.castShadow = true; g.add(im); return im; };
      const m4 = new T.Matrix4(), L = { group: g, explode: 0, kind };
      if (kind === "nacl") {
        const d = 1.45; const na = [], cl = []; for (let i = 0; i < n + 1; i++) for (let j = 0; j < n + 1; j++) for (let k = 0; k < n + 1; k++) { const p = V3((i - n / 2) * d, (j - n / 2) * d, (k - n / 2) * d); ((i + j + k) % 2 ? na : cl).push(p); }
        const imN = mkIn(0.34, CPK.Na, na), imC = mkIn(0.58, CPK.Cl, cl);
        const lp = []; const all = na.concat(cl); all.forEach((a, i) => all.forEach((b, j) => { if (j > i && Math.abs(a.distanceTo(b) - d) < 0.01) lp.push(a, b); }));
        const lg = new T.BufferGeometry().setFromPoints(lp), lines = new T.LineSegments(lg, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 })); g.add(lines);
        L.set = (e) => { L.explode = e; const f = 1 + e * 0.9; na.forEach((p, i) => { m4.setPosition(p.x * f, p.y * f, p.z * f); imN.setMatrixAt(i, m4); }); cl.forEach((p, i) => { m4.setPosition(p.x * f, p.y * f, p.z * f); imC.setMatrixAt(i, m4); }); imN.instanceMatrix.needsUpdate = imC.instanceMatrix.needsUpdate = true; lines.scale.setScalar(f); lines.material.opacity = 0.18 * (1 - e); };
        L.count = { Na: na.length, Cl: cl.length };
      } else if (kind === "diamond") {
        const a = 1.55 * 4 / Math.sqrt(3) * 0.62, P = []; const base = [[0, 0, 0], [0, .5, .5], [.5, 0, .5], [.5, .5, 0]];
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) base.forEach((b) => { P.push(V3((i + b[0]) * a, (j + b[1]) * a, (k + b[2]) * a)); P.push(V3((i + b[0] + .25) * a, (j + b[1] + .25) * a, (k + b[2] + .25) * a)); });
        const c0 = P.reduce((s, p) => s.add(p), V3()).multiplyScalar(1 / P.length); P.forEach((p) => p.sub(c0)); const bl = a * Math.sqrt(3) / 4, rod = new T.CylinderGeometry(0.05, 0.05, 1, 10), rm = M.matte(0xaab0ba, 0.3);
        const im = mkIn(0.2, 0x3b3f46, P, 0.15); P.forEach((p, i) => { m4.setPosition(p.x, p.y, p.z); im.setMatrixAt(i, m4); });
        P.forEach((p, i) => P.forEach((q, j) => { if (j > i && Math.abs(p.distanceTo(q) - bl) < 0.02) { const r = new T.Mesh(rod, rm); S.setRod(r, p, q); r.scale.x = r.scale.z = 1; g.add(r); } }));
        L.set = () => { }; L.count = { C: P.length };
      } else if (kind === "graphite") {
        const a = 1.42 * 0.9, layers = [], rodG = new T.CylinderGeometry(0.04, 0.04, 1, 8), rm = M.matte(0x9aa0aa, 0.3), P = [];
        for (let ly = 0; ly < 3; ly++) { const lp = []; for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const cx = a * Math.sqrt(3) * (i + j / 2), cz = a * 1.5 * j; if (Math.hypot(cx, cz) > a * 4.4) continue;
            for (let k = 0; k < 6; k++) { const ang = (k * 60 + 30) * Math.PI / 180; const p = V3(cx + a * Math.cos(ang), 0, cz + a * Math.sin(ang)); if (!lp.some((q) => q.distanceTo(p) < 0.05)) lp.push(p); } }
          const grp = new T.Group(); grp.position.y = (ly - 1) * 1.15; if (ly === 1) grp.userData.shift = a; g.add(grp); layers.push(grp);
          lp.forEach((p) => { const s = new T.Mesh(new T.SphereGeometry(0.16, 16, 12), new T.MeshPhysicalMaterial({ color: 0x3b3f46, roughness: 0.2, clearcoat: 0.7 })); s.position.copy(p); s.castShadow = true; grp.add(s); });
          lp.forEach((p, i) => lp.forEach((q, j) => { if (j > i && Math.abs(p.distanceTo(q) - a) < 0.03) { const r = new T.Mesh(rodG, rm); S.setRod(r, p, q); grp.add(r); } })); }
        const dash = []; layers[0].children.slice(0, 40).forEach((m) => { if (m.geometry.type === "SphereGeometry") { dash.push(V3(m.position.x, layers[0].position.y, m.position.z), V3(m.position.x, layers[1].position.y, m.position.z)); } });
        L.layers = layers; L.set = (e) => { L.explode = e; layers[1].position.x = e * 1.6; layers[0].position.y = -1.15 * (1 + 0.0 * e); }; L.count = { C: "layers" };
      } else if (kind === "metal") {
        const d = 1.25, P = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) { const b = [[0, 0, 0], [0, .5, .5], [.5, 0, .5], [.5, .5, 0]]; b.forEach((q) => P.push(V3((i + q[0] - n / 2) * d * 1.4, (j + q[1] - n / 2) * d * 1.4, (k + q[2] - n / 2) * d * 1.4))); }
        const im = mkIn(0.34, o.color || 0xc8703f, P, 0.18); im.material.metalness = 0.9; P.forEach((p, i) => { m4.setPosition(p.x, p.y, p.z); im.setMatrixAt(i, m4); });
        const ne = o.electrons || 220, ee = new T.InstancedMesh(new T.SphereGeometry(0.06, 8, 6), M.glow(0x7fd0ff, 0.95), ne), ep = [], ev = []; const ext = n * d * 0.7;
        for (let i = 0; i < ne; i++) { ep.push(V3(rnd(-ext, ext), rnd(-ext, ext), rnd(-ext, ext))); ev.push(V3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(0.8, 1.6))); } g.add(ee);
        L.field = 0; L.set = (e) => { L.field = e; }; L.count = { cations: P.length, electrons: ne };
        L.update = (dt) => { for (let i = 0; i < ne; i++) { const p = ep[i], v = ev[i]; p.addScaledVector(v, dt); p.x += L.field * 1.6 * dt; for (const ax of ["x", "y", "z"]) { if (p[ax] > ext) p[ax] -= 2 * ext; if (p[ax] < -ext) p[ax] += 2 * ext; } m4.setPosition(p.x, p.y, p.z); ee.setMatrixAt(i, m4); } ee.instanceMatrix.needsUpdate = true; };
      }
      L.set && L.set(0); sc.add(g); return L;
    };
    return K;
  };
})();
