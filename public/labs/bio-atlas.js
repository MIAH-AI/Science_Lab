/* bio-atlas.js — realistic anatomy kit for the WAEC Biology 3D labs (loads after bio-kit.js).
   • BA.mesh       signed-distance shapes meshed with surface nets (smooth organic solids, no model files)
   • clinic env    flat clinical stage (light by day, navy at night), neutral tone mapping
   • BA.body       smooth human figure, drawn as a see-through "ghost" shell with denser edges
   • BA.tis        one fixed tissue colour code used by every build (red muscle, pale tendon, blue vein …)
   • BA.organs     heart, lungs, airway, liver, stomach, intestines, kidneys … placed inside the body
   • BA.focus      tap a part to isolate it, hover to name it, and a "find the organ" game
   Everything is generated in code. This is a simplified teaching model, not a medical reference. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK;
  const BA = (window.BA = {});
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const mix = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ---------- signed-distance primitives (negative inside) ---------- */
  const sd = (BA.sd = {});
  sd.smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  sd.smax = (a, b, k) => -sd.smin(-a, -b, k);
  sd.sph = (x, y, z, cx, cy, cz, r) => Math.hypot(x - cx, y - cy, z - cz) - r;
  sd.ell = (x, y, z, cx, cy, cz, rx, ry, rz) => {
    const px = x - cx, py = y - cy, pz = z - cz;
    const k0 = Math.hypot(px / rx, py / ry, pz / rz), k1 = Math.hypot(px / (rx * rx), py / (ry * ry), pz / (rz * rz));
    return k1 < 1e-9 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
  };
  /* rounded cone / tapered capsule from a (radius r1) to b (radius r2) */
  sd.cone = (x, y, z, ax, ay, az, bx, by, bz, r1, r2) => {
    const dx = bx - ax, dy = by - ay, dz = bz - az, l2 = dx * dx + dy * dy + dz * dz;
    const t = l2 ? clamp(((x - ax) * dx + (y - ay) * dy + (z - az) * dz) / l2, 0, 1) : 0;
    return Math.hypot(x - ax - dx * t, y - ay - dy * t, z - az - dz * t) - (r1 + (r2 - r1) * t);
  };
  /* chain of rounded cones through points [[x,y,z,r], …] joined smoothly */
  sd.chain = (pts, k) => (x, y, z) => {
    let d = 1e9;
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; d = sd.smin(d, sd.cone(x, y, z, a[0], a[1], a[2], b[0], b[1], b[2], a[3], b[3]), k || 0.02); }
    return d;
  };

  /* ---------- surface nets mesher ---------- */
  const lin = (BA.lin = (hex) => { const c = new (T().Color)(hex); return [c.r, c.g, c.b]; });
  const mix3 = (BA.mix3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]);
  const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  /* fn(x,y,z) → distance; b = [x0,y0,z0,x1,y1,z1]; cell = grid size; opt.color(x,y,z,nx,ny,nz) → linear [r,g,b] */
  BA.mesh = function (fn, b, cell, opt) {
    opt = opt || {};
    const x0 = b[0], y0 = b[1], z0 = b[2];
    const nx = Math.ceil((b[3] - x0) / cell) + 1, ny = Math.ceil((b[4] - y0) / cell) + 1, nz = Math.ceil((b[5] - z0) / cell) + 1;
    const val = new Float32Array(nx * ny * nz);
    let n = 0;
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) val[n++] = fn(x0 + i * cell, y0 + j * cell, z0 + k * cell);
    const cx = nx - 1, cy = ny - 1, cz = nz - 1, cidx = new Int32Array(cx * cy * cz).fill(-1);
    const off = [0, 1, nx, nx + 1, nx * ny, nx * ny + 1, nx * ny + nx, nx * ny + nx + 1];
    const pos = [], v8 = new Float32Array(8);
    for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
      const base = i + nx * (j + ny * k); let mask = 0;
      for (let q = 0; q < 8; q++) { v8[q] = val[base + off[q]]; if (v8[q] < 0) mask |= 1 << q; }
      if (mask === 0 || mask === 255) continue;
      let sx = 0, sy = 0, sz = 0, cnt = 0;
      for (let e = 0; e < 12; e++) {
        const a = EDGES[e][0], c = EDGES[e][1], va = v8[a], vc = v8[c];
        if ((va < 0) === (vc < 0)) continue;
        const t = va / (va - vc);
        sx += mix(a & 1, c & 1, t); sy += mix((a >> 1) & 1, (c >> 1) & 1, t); sz += mix((a >> 2) & 1, (c >> 2) & 1, t); cnt++;
      }
      cidx[i + cx * (j + cy * k)] = pos.length / 3;
      pos.push(x0 + (i + sx / cnt) * cell, y0 + (j + sy / cnt) * cell, z0 + (k + sz / cnt) * cell);
    }
    const nv = pos.length / 3, nor = new Float32Array(nv * 3), h = cell * 0.5;
    for (let i = 0; i < nv; i++) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      let gx = fn(x + h, y, z) - fn(x - h, y, z), gy = fn(x, y + h, z) - fn(x, y - h, z), gz = fn(x, y, z + h) - fn(x, y, z - h);
      const l = Math.hypot(gx, gy, gz) || 1; nor[i * 3] = gx / l; nor[i * 3 + 1] = gy / l; nor[i * 3 + 2] = gz / l;
    }
    const idx = [];
    const quad = (a, c, d, e) => {
      if (a < 0 || c < 0 || d < 0 || e < 0) return;
      const ux = pos[c * 3] - pos[a * 3], uy = pos[c * 3 + 1] - pos[a * 3 + 1], uz = pos[c * 3 + 2] - pos[a * 3 + 2];
      const wx = pos[e * 3] - pos[a * 3], wy = pos[e * 3 + 1] - pos[a * 3 + 1], wz = pos[e * 3 + 2] - pos[a * 3 + 2];
      const fx = uy * wz - uz * wy, fy = uz * wx - ux * wz, fz = ux * wy - uy * wx;
      if (fx * nor[a * 3] + fy * nor[a * 3 + 1] + fz * nor[a * 3 + 2] >= 0) idx.push(a, c, d, a, d, e); else idx.push(a, d, c, a, e, d);
    };
    const C = (i, j, k) => (i < 0 || j < 0 || k < 0 || i >= cx || j >= cy || k >= cz ? -1 : cidx[i + cx * (j + cy * k)]);
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const p = i + nx * (j + ny * k), s0 = val[p] < 0;
      if (i < nx - 1 && s0 !== (val[p + 1] < 0)) quad(C(i, j - 1, k - 1), C(i, j, k - 1), C(i, j, k), C(i, j - 1, k));
      if (j < ny - 1 && s0 !== (val[p + nx] < 0)) quad(C(i - 1, j, k - 1), C(i, j, k - 1), C(i, j, k), C(i - 1, j, k));
      if (k < nz - 1 && s0 !== (val[p + nx * ny] < 0)) quad(C(i - 1, j - 1, k), C(i, j - 1, k), C(i, j, k), C(i - 1, j, k));
    }
    const g = new (T().BufferGeometry)();
    g.setAttribute("position", new (T().Float32BufferAttribute)(pos, 3));
    g.setAttribute("normal", new (T().BufferAttribute)(nor, 3));
    if (opt.color) {
      const col = new Float32Array(nv * 3);
      for (let i = 0; i < nv; i++) { const c = opt.color(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]); col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; }
      g.setAttribute("color", new (T().BufferAttribute)(col, 3));
    }
    if (opt.uv) {
      const uv = new Float32Array(nv * 2);
      for (let i = 0; i < nv; i++) { const q = opt.uv(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); uv[i * 2] = q[0]; uv[i * 2 + 1] = q[1]; }
      g.setAttribute("uv", new (T().BufferAttribute)(uv, 2));
    }
    g.setIndex(idx); g.computeBoundingSphere();
    if (opt.keep) g.userData.field = { val, nx, ny, nz, x0, y0, z0, cell };
    return g;
  };
  /* move a point onto the surface of fn (used to lay vessels on an organ) */
  BA.project = (fn, p, lift) => {
    for (let it = 0; it < 6; it++) {
      const d = fn(p.x, p.y, p.z), h = 0.01;
      const gx = fn(p.x + h, p.y, p.z) - fn(p.x - h, p.y, p.z), gy = fn(p.x, p.y + h, p.z) - fn(p.x, p.y - h, p.z), gz = fn(p.x, p.y, p.z + h) - fn(p.x, p.y, p.z - h);
      const l = Math.hypot(gx, gy, gz) || 1; p.x -= (gx / l) * (d - (lift || 0)); p.y -= (gy / l) * (d - (lift || 0)); p.z -= (gz / l) * (d - (lift || 0));
    }
    return p;
  };
  const geoCache = {};
  BA.cached = (key, make) => geoCache[key] || (geoCache[key] = make());

  /* ---------- clinical stage ---------- */
  BA.isDark = () => !!(MK.isNight && MK.isNight());
  MK.envs3d.clinic = function (S, o) {
    const T3 = T(), sc = S.scene, dark = o.dark == null ? BA.isDark() : o.dark;
    S.clinicDark = dark;
    sc.background = new T3.Color(dark ? 0x0c1018 : 0xf1f2f4); sc.fog = null;
    S.renderer.toneMapping = T3.NeutralToneMapping || T3.LinearToneMapping; S.renderer.toneMappingExposure = o.exposure || 1;
    sc.environmentIntensity = o.envI == null ? 0.5 : o.envI;
    sc.add(new T3.HemisphereLight(0xffffff, dark ? 0x26304a : 0xc9ccd6, dark ? 0.75 : 1.0));
    const key = new T3.DirectionalLight(0xffffff, 2.3), fill = new T3.DirectionalLight(0xdfe8ff, 0.7);
    sc.add(key, fill);
    /* lights travel with the camera so every side of the model is lit the same way */
    S.anims.push(() => { });
    const place = () => {
      const cam = S.camera, r = V(1, 0, 0).applyQuaternion(cam.quaternion), u = V(0, 1, 0).applyQuaternion(cam.quaternion), f = V(0, 0, 1).applyQuaternion(cam.quaternion);
      key.position.copy(S.orbit.target).addScaledVector(f, 6).addScaledVector(u, 5).addScaledVector(r, 3); key.target.position.copy(S.orbit.target);
      fill.position.copy(S.orbit.target).addScaledVector(f, 4).addScaledVector(u, -1).addScaledVector(r, -6); fill.target.position.copy(S.orbit.target);
    };
    sc.add(key.target, fill.target); S.clinicLights = place; place();
    if (o.floor) {
      const fl = new T3.Mesh(new T3.CircleGeometry(o.floor, 64), new T3.MeshBasicMaterial({ color: dark ? 0x121826 : 0xe6e8ec }));
      fl.rotation.x = -Math.PI / 2; fl.position.y = -0.002; sc.add(fl);
    }
  };

  /* ---------- tissue colour code (the same in every build) ---------- */
  const TIS = (BA.tis = {
    muscle: 0xb5443a, muscleHi: 0xdd8072, muscleDeep: 0x8a2e2a, tendon: 0xf3dcd7, fascia: 0xe4d8e6,
    vein: 0x2c3fd1, artery: 0x8e2b24, arteryBright: 0xc8352e, nerve: 0xe6c64a,
    heart: 0xe08a7c, heartDeep: 0xb5534c, fat: 0xe2a944, bone: 0xede6d3, cartilage: 0xc9ced8,
    gland: 0xe8b830, mouth: 0xb8474f, gullet: 0xeba39b, stomach: 0xeda9a0, liver: 0x6e2a2e, gall: 0x5fae6a,
    pancreas: 0xd9a04a, smallInt: 0xf0a8a0, largeInt: 0xd9756a, largeBand: 0xf3d5cc, lung: 0xe58f8a, lungMottle: 0xd97a78,
    lungHi: 0xf4b8b0, lungBase: 0xa8494c, airway: 0xb84a4e, kidney: 0x8a3b34, spleen: 0x6a2a44, bladder: 0xe8c890,
    uterus: 0xeba6a0, ovary: 0xdad7cc, brain: 0xf2d8c6, brainGroove: 0xc2305a, select: 0x19b5b0, skin: 0x8d5a3b,
  });
  let fibreTex = null;
  BA.fibreTex = () => {
    if (fibreTex) return fibreTex;
    const c = BK.cv(128, 256), g = c.getContext("2d"), rr = BK.rng(11);
    g.fillStyle = "#d8d8d8"; g.fillRect(0, 0, 128, 256);
    for (let x = 0; x < 128; x += 2) { const v = 150 + rr() * 100; g.strokeStyle = `rgba(${v},${v},${v},.55)`; g.lineWidth = 0.8 + rr() * 1.6; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + rr() * 3 - 1.5, 90, x + rr() * 3 - 1.5, 170, x + rr() * 2 - 1, 256); g.stroke(); }
    fibreTex = BK.tex(c); fibreTex.colorSpace = T().NoColorSpace; return fibreTex;
  };
  const phys = (o) => new (T().MeshPhysicalMaterial)(o);
  BA.mat = {
    /* glossy soft tissue; vc = use vertex colours */
    tissue: (col, o) => phys(Object.assign({ color: col, roughness: 0.4, clearcoat: 0.4, clearcoatRoughness: 0.4 }, o || {})),
    vtissue: (o) => phys(Object.assign({ color: 0xffffff, vertexColors: true, roughness: 0.4, clearcoat: 0.4, clearcoatRoughness: 0.4 }, o || {})),
    liver: () => phys({ color: 0xffffff, vertexColors: true, roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
    matte: (col, o) => new (T().MeshStandardMaterial)(Object.assign({ color: col, roughness: 0.85 }, o || {})),
    muscle: (rep) => { const t = BA.fibreTex().clone(); t.needsUpdate = true; t.repeat.set(rep || 3, 1); return phys({ color: 0xffffff, vertexColors: true, map: t, bumpMap: t, bumpScale: 0.6, roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.4 }); },
    vessel: (col) => phys({ color: col, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
  };

  /* ---------- ghost shell material: see-through in the middle, denser at glancing edges ---------- */
  BA.ghostMat = (o) => {
    o = o || {};
    const dark = o.dark == null ? BA.isDark() : o.dark;
    return new (T().ShaderMaterial)({
      transparent: true, depthWrite: false, side: T().FrontSide,
      uniforms: { col: { value: new (T().Color)(o.color || (dark ? 0xcfe0ff : 0x7d8590)) }, base: { value: o.base == null ? (dark ? 0.05 : 0.07) : o.base }, rim: { value: o.rim == null ? (dark ? 0.55 : 0.62) : o.rim }, pw: { value: o.pw || 2.2 } },
      vertexShader: "varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}",
      fragmentShader: "uniform vec3 col;uniform float base;uniform float rim;uniform float pw;varying vec3 vN;varying vec3 vV;void main(){float f=1.-abs(dot(normalize(vN),normalize(vV)));gl_FragColor=vec4(col,base+rim*pow(f,pw));\n#include <colorspace_fragment>\n}",
    });
  };

  /* ---------- human figure (standing on y = 0, about 3.42 tall, facing +z) ---------- */
  function bodySDF(x, y, z) {
    const ax = Math.abs(x), S = sd.smin;
    let d = sd.ell(ax, y, z, 0, 3.14, 0.01, 0.215, 0.275, 0.25);                     // skull
    d = S(d, sd.ell(ax, y, z, 0, 2.99, 0.07, 0.15, 0.17, 0.17), 0.08);                // jaw
    d = S(d, sd.cone(ax, y, z, 0, 2.95, -0.01, 0, 2.66, -0.01, 0.1, 0.115), 0.05);    // neck
    let t = sd.ell(ax, y, z, 0, 2.4, 0, 0.36, 0.33, 0.215);                           // chest
    t = S(t, sd.cone(ax, y, z, 0.1, 2.68, -0.02, 0.45, 2.6, -0.01, 0.1, 0.12), 0.1);  // shoulders
    t = S(t, sd.ell(ax, y, z, 0, 1.98, 0.01, 0.3, 0.36, 0.19), 0.12);                 // waist
    t = S(t, sd.ell(ax, y, z, 0, 1.55, -0.01, 0.345, 0.28, 0.21), 0.14);              // hips
    d = S(d, t, 0.07);
    let a = sd.cone(ax, y, z, 0.47, 2.58, -0.01, 0.6, 1.98, -0.02, 0.118, 0.084);     // upper arm
    a = S(a, sd.cone(ax, y, z, 0.6, 1.98, -0.02, 0.69, 1.44, 0.05, 0.084, 0.052), 0.03);
    a = S(a, sd.ell(ax, y, z, 0.715, 1.27, 0.07, 0.04, 0.13, 0.07), 0.05);            // hand
    d = S(d, a, 0.06);
    let l = sd.cone(ax, y, z, 0.185, 1.45, 0, 0.2, 0.8, 0.01, 0.168, 0.105);          // thigh
    l = S(l, sd.cone(ax, y, z, 0.2, 0.8, 0.01, 0.2, 0.13, -0.02, 0.1, 0.058), 0.03);
    l = S(l, sd.ell(ax, y, z, 0.2, 0.55, -0.05, 0.085, 0.2, 0.09), 0.06);             // calf
    l = S(l, sd.cone(ax, y, z, 0.2, 0.06, -0.03, 0.22, 0.045, 0.2, 0.062, 0.048), 0.05); // foot
    d = S(d, l, 0.06);
    return d;
  }
  BA.bodySDF = bodySDF;
  BA.bodyGeo = () => BA.cached("body", () => BA.mesh(bodySDF, [-0.9, -0.08, -0.4, 0.9, 3.5, 0.42], 0.029, { keep: true }));
  /* fast body distance: trilinear lookup in the grid kept from meshing the body (about 20× faster than bodySDF) */
  BA.bodyF = (x, y, z) => {
    const F = BA.bodyGeo().userData.field, fx = (x - F.x0) / F.cell, fy = (y - F.y0) / F.cell, fz = (z - F.z0) / F.cell;
    const i = Math.floor(fx), j = Math.floor(fy), k = Math.floor(fz);
    if (i < 0 || j < 0 || k < 0 || i >= F.nx - 1 || j >= F.ny - 1 || k >= F.nz - 1) return 0.2;
    const u = fx - i, v = fy - j, w = fz - k, b = i + F.nx * (j + F.ny * k), sx = 1, sy = F.nx, sz = F.nx * F.ny, V0 = F.val;
    const c00 = V0[b] + (V0[b + sx] - V0[b]) * u, c10 = V0[b + sy] + (V0[b + sy + sx] - V0[b + sy]) * u, c01 = V0[b + sz] + (V0[b + sz + sx] - V0[b + sz]) * u, c11 = V0[b + sz + sy] + (V0[b + sz + sy + sx] - V0[b + sz + sy]) * u;
    const c0 = c00 + (c10 - c00) * v, c1 = c01 + (c11 - c01) * v; return c0 + (c1 - c0) * w;
  };
  /* o.solid → opaque skin; otherwise the ghost shell. */
  BA.body = (o) => {
    o = o || {};
    const m = new (T().Mesh)(BA.bodyGeo(), o.solid ? BK.mat.skin(o.color || TIS.skin) : BA.ghostMat(o));
    m.renderOrder = o.solid ? 0 : 20; m.userData.ghost = !o.solid; if (o.solid) m.castShadow = true;
    const g = new (T().Group)(); g.add(m); g.shell = m; return g;
  };
  /* every older scene that asked for the capsule mannequin now gets the smooth figure */
  BK.human = (mat) => {
    const op = mat && mat.transparent;
    return BA.body(op || !mat ? { dark: true } : { solid: true, color: mat.color ? mat.color.getHex() : TIS.skin });
  };

  /* ---------- tubes ---------- */
  BA.curve = (pts) => new (T().CatmullRomCurve3)(pts.map((p) => (p.isVector3 ? p : V(p[0], p[1], p[2]))));
  /* tube with a radius that can vary along its length; opt.r(t) and opt.color(t, a) with a = angle index 0..1 */
  BA.tube = (curve, r, mat, opt) => {
    opt = opt || {};
    const seg = opt.seg || 80, rs = opt.rs || 12, g = new (T().TubeGeometry)(curve, seg, r, rs, false), p = g.attributes.position;
    let col = null; if (opt.color) col = new Float32Array(p.count * 3);
    if (opt.r || opt.color) {
      const c = V();
      for (let i = 0; i <= seg; i++) {
        const t = i / seg; curve.getPointAt(t, c); const k = opt.r ? opt.r(t) : 1;
        for (let j = 0; j <= rs; j++) {
          const q = i * (rs + 1) + j;
          if (opt.r) p.setXYZ(q, c.x + (p.getX(q) - c.x) * k, c.y + (p.getY(q) - c.y) * k, c.z + (p.getZ(q) - c.z) * k);
          if (col) { const cc = opt.color(t, j / rs); col[q * 3] = cc[0]; col[q * 3 + 1] = cc[1]; col[q * 3 + 2] = cc[2]; }
        }
      }
      if (opt.r) g.computeVertexNormals();
      if (col) g.setAttribute("color", new (T().BufferAttribute)(col, 3));
    }
    return new (T().Mesh)(g, mat);
  };
  /* round caps for an open tube */
  BA.cap = (curve, t, r, mat) => { const m = new (T().Mesh)(new (T().SphereGeometry)(r, 14, 10), mat); m.position.copy(curve.getPointAt(t)); return m; };

  /* ================================================================
     Organs of the trunk, in body coordinates. Viewer's left is the
     person's right (liver side), as in every textbook front view.
     ================================================================ */
  const DOME = (x, y, z, grow) => sd.ell(x, y, z, 0, 1.76, 0, 0.36 + grow, 0.35 + grow, 0.2 + grow);   // diaphragm dome
  const HEART_C = [0.055, 2.28, 0.075];
  function lungSDF(side) {            // side −1 = right lung (viewer's left), +1 = left lung
    return (x, y, z) => {
      let d = sd.ell(x, y, z, side * 0.19, 2.39, -0.01, 0.145, 0.3, 0.165);
      d = sd.smax(d, -DOME(x, y, z, 0.012), 0.03);                                           // concave base on the diaphragm
      d = sd.smax(d, side < 0 ? x + 0.035 : 0.045 - x, 0.04);                                // flat inner face
      d = sd.smax(d, -sd.ell(x, y, z, HEART_C[0], HEART_C[1], HEART_C[2], 0.15, 0.17, 0.14), 0.04);  // room for the heart
      return d;
    };
  }
  function lungColor(side) {
    const base = lin(TIS.lung), mot = lin(TIS.lungMottle), hi = lin(TIS.lungHi), under = lin(TIS.lungBase), fis = lin(0x8f3f45);
    return (x, y, z, nx, ny) => {
      const n = BK.fbm(x * 14 + side * 3, y * 14, z * 14), n2 = BK.noise3(x * 46, y * 46, z * 46);
      let c = mix3(base, mot, sstep(0.42, 0.62, n)); c = mix3(c, hi, sstep(0.55, 0.8, n2) * 0.35);
      c = mix3(c, under, sstep(-0.35, -0.85, ny) * 0.8);
      const ob = Math.abs((y - 2.33) - (z + 0.01) * 0.95 - Math.abs(x - side * 0.19) * 0.15);  // oblique fissure
      let f = 1 - sstep(0.004, 0.011, ob);
      if (side < 0) f = Math.max(f, (1 - sstep(0.004, 0.011, Math.abs(y - 2.42 - z * 0.12))) * (z > -0.02 ? 1 : 0));  // horizontal fissure (right lung only)
      return mix3(c, fis, f * 0.75);
    };
  }
  /* heart in its own unit space (about 2 units tall); scaled to fit the chest */
  function heartSDF(x, y, z) {
    let d = sd.cone(x, y, z, -0.06, 0.2, 0, 0.34, -0.86, 0.12, 0.56, 0.1);             // ventricles down to the apex
    d = sd.smin(d, sd.ell(x, y, z, -0.3, -0.02, 0.26, 0.38, 0.5, 0.3), 0.25);         // right ventricle wraps the front
    d = sd.smax(d, y - 0.44 - x * 0.12, 0.26);                                        // rounded base
    return d;
  }
  function atriaSDF(x, y, z) {
    let d = sd.ell(x, y, z, -0.5, 0.55, 0.02, 0.33, 0.33, 0.36);                      // right atrium
    d = sd.smin(d, sd.ell(x, y, z, -0.62, 0.42, 0.34, 0.2, 0.17, 0.14), 0.1);         // right auricle
    d = sd.smin(d, sd.ell(x, y, z, 0.28, 0.6, -0.26, 0.36, 0.3, 0.3), 0.12);          // left atrium (at the back)
    d = sd.smin(d, sd.ell(x, y, z, 0.6, 0.5, 0.2, 0.19, 0.15, 0.14), 0.1);            // left auricle
    return d;
  }
  /* build the heart at unit size around the origin; returns a group with .vent .atria .parts */
  BA.heart = (o) => {
    o = o || {};
    const T3 = T(), g = new T3.Group();
    const hc = lin(TIS.heart), deep = lin(TIS.heartDeep), fat = lin(0xeccf8a);
    const ventGeo = BA.cached("heartV", () => BA.mesh(heartSDF, [-1, -1.05, -0.75, 1, 0.6, 0.85], 0.04, { color: (x, y, z) => {
      const n = BK.fbm(x * 3, y * 3, z * 3);
      let c = mix3(hc, deep, sstep(0.45, 0.75, n) * 0.5);
      c = mix3(c, fat, sstep(0.2, 0.34, y + (n - 0.5) * 0.16) * 0.7);                          // fat in the groove under the atria
      const sept = Math.abs(x - 0.02 - (y + 0.3) * -0.32);                                     // groove between the ventricles
      return mix3(c, fat, (1 - sstep(0.02, 0.06, sept)) * (z > 0 ? 0.45 : 0));
    } }));
    const atGeo = BA.cached("heartA", () => BA.mesh(atriaSDF, [-1.05, 0, -0.75, 0.95, 1.05, 0.65], 0.04, { color: (x, y, z) => mix3(lin(0xc86d6a), lin(0x9c4750), sstep(0.4, 0.7, BK.fbm(x * 4, y * 4, z * 4))) }));
    const vent = new T3.Mesh(ventGeo, BA.mat.vtissue({ roughness: 0.32, clearcoat: 0.6 })), atria = new T3.Mesh(atGeo, BA.mat.vtissue({ roughness: 0.34, clearcoat: 0.6 }));
    g.add(vent, atria); g.vent = vent; g.atria = atria;
    const red = BA.mat.vessel(TIS.arteryBright), blue = BA.mat.vessel(TIS.vein), dred = BA.mat.vessel(0xb23a36), pblue = BA.mat.vessel(0x4a5fd8);
    const aC = BA.curve([[0.08, 0.3, 0.02], [0.02, 0.85, 0.02], [0.1, 1.28, -0.06], [0.42, 1.42, -0.24], [0.62, 1.12, -0.42], [0.6, 0.3, -0.5], [0.55, -0.7, -0.5]]);
    const aorta = BA.tube(aC, 0.2, red, { seg: 70, rs: 16, r: (t) => 1 - 0.3 * t });
    const br = [[[0.06, 1.3, -0.05], [0.0, 1.62, -0.03], [-0.08, 1.9, 0]], [[0.24, 1.4, -0.14], [0.26, 1.7, -0.12], [0.3, 1.9, -0.1]], [[0.42, 1.42, -0.24], [0.5, 1.68, -0.24], [0.6, 1.86, -0.22]]].map((p) => BA.tube(BA.curve(p), 0.075, red, { seg: 16, rs: 10 }));
    const pC = BA.curve([[-0.22, 0.32, 0.3], [-0.12, 0.8, 0.3], [0.05, 1.05, 0.14], [0.2, 1.1, -0.1]]);
    const pulm = BA.tube(pC, 0.19, pblue, { seg: 30, rs: 16 });
    const pl = BA.tube(BA.curve([[0.2, 1.1, -0.1], [0.55, 1.08, -0.16], [0.95, 1.0, -0.14]]), 0.12, pblue, { seg: 16, rs: 12 });
    const pr = BA.tube(BA.curve([[0.2, 1.1, -0.1], [-0.3, 1.02, -0.3], [-0.95, 0.98, -0.22]]), 0.12, pblue, { seg: 20, rs: 12 });
    const svc = BA.tube(BA.curve([[-0.52, 1.9, -0.02], [-0.52, 1.3, -0.02], [-0.5, 0.75, 0]]), 0.16, blue, { seg: 16, rs: 14 });
    const ivc = BA.tube(BA.curve([[-0.5, 0.4, -0.12], [-0.5, -0.2, -0.3], [-0.46, -0.95, -0.36]]), 0.17, blue, { seg: 16, rs: 14 });
    const pv = [[[0.5, 0.68, -0.4], [0.85, 0.72, -0.34], [1.02, 0.78, -0.3]], [[0.5, 0.52, -0.42], [0.85, 0.5, -0.38], [1.02, 0.48, -0.34]], [[0.05, 0.66, -0.5], [-0.5, 0.74, -0.5], [-0.98, 0.78, -0.4]], [[0.05, 0.5, -0.5], [-0.5, 0.52, -0.52], [-0.98, 0.5, -0.44]]].map((p) => BA.tube(BA.curve(p), 0.07, dred, { seg: 12, rs: 8 }));
    g.add(aorta, pulm, pl, pr, svc, ivc); br.forEach((m) => g.add(m)); pv.forEach((m) => g.add(m));
    /* coronary vessels laid on the surface */
    const cor = [];
    const lay = (pts, r, mat) => { const m = BA.tube(BA.curve(pts.map((p) => BA.project(heartSDF, V(p[0], p[1], p[2]), r * 0.5))), r, mat, { seg: 40, rs: 6 }); g.add(m); cor.push(m); };
    if (!o.simple) {
      lay([[0.05, 0.4, 0.5], [0.08, 0.1, 0.6], [0.14, -0.25, 0.55], [0.22, -0.55, 0.4], [0.3, -0.8, 0.2]], 0.03, red);
      lay([[0.08, 0.1, 0.6], [0.3, -0.05, 0.5], [0.45, -0.25, 0.35]], 0.02, red);
      lay([[0.14, -0.25, 0.55], [-0.05, -0.4, 0.55], [-0.15, -0.6, 0.45]], 0.018, red);
      lay([[-0.1, 0.4, 0.5], [-0.05, 0.1, 0.62], [0.06, -0.25, 0.6], [0.15, -0.55, 0.45]], 0.024, blue);
      lay([[-0.5, 0.34, 0.4], [-0.62, 0.1, 0.45], [-0.6, -0.25, 0.42], [-0.4, -0.5, 0.42]], 0.026, red);
      lay([[0.5, 0.34, 0.3], [0.62, 0.05, 0.2], [0.55, -0.3, 0.15]], 0.024, blue);
    }
    g.parts = { vent, atria, aorta: [aorta].concat(br), pulm: [pulm, pl, pr], cava: [svc, ivc], pveins: pv, coronary: cor };
    g.rotation.z = -0.12;
    return g;
  };

  /* organ list: id → display name, system, what it does (WAEC level) */
  BA.INFO = {
    brain: ["Brain", "nervous", "Controls the body: thinking, memory, the senses, balance and the vital reflexes."],
    trachea: ["Trachea (windpipe)", "respiratory", "Carries air to the lungs. C-shaped rings of cartilage keep it open; cilia and mucus trap dust."],
    lungR: ["Right lung", "respiratory", "Three lobes. Gas exchange in millions of alveoli: oxygen in, carbon dioxide out."],
    lungL: ["Left lung", "respiratory", "Two lobes and a notch for the heart. Gas exchange in the alveoli."],
    heart: ["Heart", "circulatory", "A muscular double pump: right side to the lungs, left side to the body."],
    diaphragm: ["Diaphragm", "respiratory", "A sheet of muscle. It flattens to draw air in and domes up to push air out. It separates thorax from abdomen."],
    gullet: ["Oesophagus (gullet)", "digestive", "Pushes each bolus of food to the stomach by peristalsis."],
    liver: ["Liver", "digestive", "Makes bile, stores glycogen, breaks down excess amino acids into urea and removes poisons."],
    gall: ["Gall bladder", "digestive", "Stores bile and releases it into the duodenum to emulsify fats."],
    stomach: ["Stomach", "digestive", "Churns food with gastric juice: pepsin starts protein digestion and hydrochloric acid kills germs."],
    spleen: ["Spleen", "circulatory", "Filters blood, destroys worn-out red blood cells and stores white blood cells."],
    pancreas: ["Pancreas", "digestive", "Makes pancreatic juice (amylase, trypsin, lipase) and the hormones insulin and glucagon."],
    smallInt: ["Small intestine", "digestive", "Duodenum and ileum: digestion is completed and food is absorbed through the villi."],
    largeInt: ["Large intestine", "digestive", "Caecum, colon and rectum: absorbs water and stores faeces before egestion."],
    kidneyR: ["Right kidney", "excretory", "Filters the blood, removes urea and controls the water and salt balance of the body."],
    kidneyL: ["Left kidney", "excretory", "Filters the blood, removes urea and controls the water and salt balance of the body."],
    ureter: ["Ureters", "excretory", "Two narrow tubes that carry urine from the kidneys to the bladder."],
    bladder: ["Urinary bladder", "excretory", "Stores urine until it is passed out through the urethra."],
    aorta: ["Aorta", "circulatory", "The largest artery: carries oxygenated blood from the left ventricle to the body."],
    cava: ["Venae cavae", "circulatory", "The largest veins: return deoxygenated blood from the body to the right atrium."],
  };
  BA.TRUNK = ["trachea", "lungR", "lungL", "heart", "diaphragm", "gullet", "liver", "gall", "stomach", "spleen", "pancreas", "smallInt", "largeInt", "kidneyR", "kidneyL", "ureter", "bladder", "aorta", "cava"];
  BA.SYS = { digestive: ["gullet", "stomach", "liver", "gall", "pancreas", "smallInt", "largeInt"], respiratory: ["trachea", "lungR", "lungL", "diaphragm"], circulatory: ["heart", "aorta", "cava", "spleen"], excretory: ["kidneyR", "kidneyL", "ureter", "bladder"], nervous: ["brain"] };

  function intestinePath() {
    /* duodenum C-loop, then rows of tight coils that fill the middle of the abdomen */
    const pts = [[0.03, 1.875, 0.06], [-0.06, 1.87, 0.06], [-0.1, 1.82, 0.04], [-0.07, 1.765, 0.03], [0.02, 1.755, 0.03], [0.1, 1.77, 0.05]], rr = BK.rng(23);
    const rows = 6;
    for (let r = 0; r < rows; r++) {
      const y = 1.735 - r * 0.046, dir = r % 2 ? -1 : 1, w = 0.165 - Math.abs(r - 2.2) * 0.012, n = 7;
      for (let i = 0; i <= n; i++) { const t = i / n, x = dir * (w - 2 * w * t); pts.push([x + (rr() - 0.5) * 0.012, y + Math.sin(t * Math.PI * n) * 0.022 + (rr() - 0.5) * 0.008, 0.075 + Math.cos(t * Math.PI * n + r) * 0.035 + (rr() - 0.5) * 0.012]); }
    }
    pts.push([-0.2, 1.48, 0.05], [-0.24, 1.5, 0.03]);
    return pts;
  }
  const COLON = [[-0.25, 1.47, 0.03], [-0.262, 1.55, 0.04], [-0.262, 1.68, 0.05], [-0.25, 1.8, 0.06], [-0.19, 1.845, 0.09], [-0.05, 1.815, 0.115], [0.1, 1.83, 0.11], [0.22, 1.87, 0.08], [0.268, 1.82, 0.05], [0.268, 1.68, 0.04], [0.26, 1.55, 0.03], [0.2, 1.46, 0.02], [0.1, 1.43, 0.0], [0.02, 1.4, -0.03], [0, 1.33, -0.05], [0, 1.26, -0.04]];
  const GULLET = [[0, 2.98, 0.03], [0, 2.86, -0.035], [0, 2.6, -0.06], [0.01, 2.3, -0.08], [0.05, 2.12, -0.04], [0.085, 2.05, 0.02]];
  const STOMACH = [[0.085, 2.05, 0.02, 0.028], [0.17, 2.045, 0.04, 0.078], [0.215, 1.985, 0.05, 0.088], [0.2, 1.915, 0.06, 0.074], [0.13, 1.87, 0.065, 0.052], [0.05, 1.872, 0.06, 0.03]];
  BA.paths = { gullet: GULLET, stomach: STOMACH, small: intestinePath(), colon: COLON };

  /* Build the organs. opt.only = list of ids (default all trunk organs); opt.brain adds the brain.
     Returns { group, parts: { id: { id, name, info, sys, meshes[], anchor: Vector3 } } } */
  BA.organs = (opt) => {
    opt = opt || {};
    const T3 = T(), group = new T3.Group(), parts = {};
    const want = (id) => (opt.only ? opt.only.includes(id) : BA.TRUNK.includes(id));
    const add = (id, meshes, anchor) => {
      meshes = [].concat(meshes); meshes.forEach((m) => { group.add(m); m.userData.part = id; });
      parts[id] = { id, name: BA.INFO[id][0], sys: BA.INFO[id][1], info: BA.INFO[id][2], meshes, anchor: V(anchor[0], anchor[1], anchor[2]) };
    };
    /* airway: cartilage rings with red lining between them */
    if (want("trachea")) {
      const ring = lin(TIS.cartilage), gap = lin(TIS.airway), rings = 14;
      const tc = BA.curve([[0, 2.93, 0.035], [0, 2.75, 0.02], [0, 2.56, 0.0], [0, 2.5, -0.01]]);
      const tr = BA.tube(tc, 0.036, BA.mat.vtissue({ roughness: 0.6, clearcoat: 0.15 }), { seg: rings * 6, rs: 14, r: (t) => 1 + 0.1 * Math.max(0, Math.sin(t * rings * 2 * Math.PI)), color: (t) => (Math.sin(t * rings * 2 * Math.PI) > -0.1 ? ring : gap) });
      const lar = new T3.Mesh(new T3.SphereGeometry(0.05, 16, 12), BA.mat.matte(TIS.cartilage, { roughness: 0.6 })); lar.scale.set(1, 1.3, 1); lar.position.set(0, 2.94, 0.035);
      const brs = [-1, 1].map((sdv) => BA.tube(BA.curve([[0, 2.5, -0.01], [sdv * 0.07, 2.44, -0.01], [sdv * 0.14, 2.39, -0.01]]), 0.026, BA.mat.vtissue({ roughness: 0.6, clearcoat: 0.15 }), { seg: 24, rs: 10, color: (t) => (Math.sin(t * 8 * Math.PI) > 0 ? ring : gap) }));
      add("trachea", [tr, lar].concat(brs), [0, 2.76, 0.05]);
    }
    for (const [id, side] of [["lungR", -1], ["lungL", 1]]) if (want(id)) {
      const geo = BA.cached("lung" + side, () => BA.mesh(lungSDF(side), side < 0 ? [-0.38, 2.04, -0.2, 0.0, 2.72, 0.18] : [0.0, 2.04, -0.2, 0.38, 2.72, 0.18], 0.0105, { color: lungColor(side) }));
      add(id, new T3.Mesh(geo, BA.mat.vtissue({ roughness: 0.48, clearcoat: 0.3, clearcoatRoughness: 0.5 })), [side * 0.22, 2.42, 0.14]);
    }
    if (want("heart")) {
      const h = BA.heart({ simple: !!opt.fast }); h.scale.setScalar(0.125); h.position.set(HEART_C[0], HEART_C[1], HEART_C[2]); h.rotation.y = -0.25;
      const ms = []; h.traverse((m) => { if (m.isMesh) ms.push(m); });
      group.add(h); ms.forEach((m) => { m.userData.part = "heart"; });
      parts.heart = { id: "heart", name: BA.INFO.heart[0], sys: BA.INFO.heart[1], info: BA.INFO.heart[2], meshes: ms, anchor: V(HEART_C[0], HEART_C[1], HEART_C[2] + 0.1), obj: h };
    }
    if (want("diaphragm")) {
      /* thin dome of muscle with a pale central tendon */
      const geo = BA.cached("diaph", () => { const g = new T3.SphereGeometry(1, 56, 14, 0, Math.PI * 2, 0, 1.08), p = g.attributes.position, col = new Float32Array(p.count * 3), te = lin(TIS.tendon), mu = lin(TIS.muscle);
        for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getZ(i)), c = mix3(te, mu, sstep(0.22, 0.6, r)); col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; }
        g.setAttribute("color", new T3.BufferAttribute(col, 3)); g.scale(0.36, 0.35, 0.2); g.translate(0, 1.76, 0); return g; });
      const mt = BA.mat.muscle(18); mt.side = T3.DoubleSide; mt.transparent = true; mt.opacity = 0.62; mt.depthWrite = false;
      const m = new T3.Mesh(geo, mt); m.userData.baseOp = 0.62; m.userData.soft = true;
      add("diaphragm", m, [0.24, 2.0, 0.13]);
    }
    if (want("gullet")) add("gullet", BA.tube(BA.curve(GULLET), 0.024, BA.mat.tissue(TIS.gullet), { seg: 60, rs: 10 }), [0, 2.7, -0.04]);
    if (want("liver")) {
      const fn = (x, y, z) => {
        let d = sd.ell(x, y, z, -0.14, 1.99, 0.03, 0.2, 0.125, 0.15);
        d = sd.smin(d, sd.ell(x, y, z, 0.07, 2.02, 0.07, 0.15, 0.07, 0.1), 0.06);
        d = sd.smax(d, DOME(x, y, z, -0.012), 0.03);                                              // top fits under the diaphragm
        return sd.smax(d, (1.955 - y) - (x + 0.2) * 0.42 + (0.09 - z) * 0.1, 0.04);               // slanted under-surface
      };
      const geo = BA.cached("liver", () => BA.mesh(fn, [-0.37, 1.84, -0.14, 0.24, 2.12, 0.2], 0.0105, { color: (x, y, z) => { const n = BK.fbm(x * 9, y * 9, z * 9); let c = mix3(lin(TIS.liver), lin(0x8a3a3a), sstep(0.4, 0.7, n) * 0.5); return mix3(c, lin(0xd9c8c0), (1 - sstep(0.004, 0.012, Math.abs(x - 0.0 - (y - 1.98) * 0.25))) * (z > 0.04 ? 0.6 : 0)); } }));
      add("liver", new T3.Mesh(geo, BA.mat.liver()), [-0.17, 1.99, 0.17]);
    }
    if (want("gall")) { const m = new T3.Mesh(new T3.SphereGeometry(0.03, 16, 12), BA.mat.tissue(TIS.gall, { roughness: 0.3, clearcoat: 0.7 })); m.scale.set(0.8, 1.5, 0.8); m.rotation.z = 0.5; m.position.set(-0.1, 1.885, 0.135); add("gall", m, [-0.1, 1.885, 0.16]); }
    if (want("stomach")) {
      const fn = sd.chain(STOMACH, 0.03);
      const geo = BA.cached("stomach", () => BA.mesh(fn, [-0.02, 1.8, -0.06, 0.33, 2.11, 0.16], 0.0095, { color: (x, y, z) => mix3(lin(TIS.stomach), lin(0xd98c84), sstep(0.45, 0.7, BK.fbm(x * 16, y * 16, z * 16)) * 0.6) }));
      add("stomach", new T3.Mesh(geo, BA.mat.vtissue({ roughness: 0.36, clearcoat: 0.5 })), [0.2, 1.97, 0.13]);
    }
    if (want("spleen")) { const m = new T3.Mesh(BK.blob(0.055, 9, 0.06, 20, 0.75, 1.5, 0.7), BA.mat.tissue(TIS.spleen, { roughness: 0.3, clearcoat: 0.6 })); m.rotation.z = -0.35; m.position.set(0.305, 1.97, -0.06); add("spleen", m, [0.32, 1.97, -0.02]); }
    if (want("pancreas")) {
      const fn = sd.chain([[-0.07, 1.82, 0.01, 0.034], [0.02, 1.835, 0.005, 0.027], [0.14, 1.865, -0.01, 0.022], [0.24, 1.9, -0.03, 0.014]], 0.02);
      const geo = BA.cached("pancreas", () => BA.mesh((x, y, z) => fn(x, y, z) + (BK.noise3(x * 70, y * 70, z * 70) - 0.5) * 0.008, [-0.13, 1.77, -0.07, 0.28, 1.93, 0.06], 0.008));
      add("pancreas", new T3.Mesh(geo, BA.mat.tissue(TIS.pancreas, { roughness: 0.55, clearcoat: 0.25 })), [0.05, 1.84, 0.04]);
    }
    if (want("smallInt")) add("smallInt", BA.tube(BA.curve(BA.paths.small), 0.0235, BA.mat.tissue(TIS.smallInt, { roughness: 0.33, clearcoat: 0.55 }), { seg: 620, rs: 10 }), [0, 1.62, 0.13]);
    if (want("largeInt")) {
      const cc = BA.curve(COLON), a = lin(TIS.largeInt), band = lin(TIS.largeBand);
      const m = BA.tube(cc, 0.04, BA.mat.vtissue({ roughness: 0.4, clearcoat: 0.45 }), { seg: 260, rs: 14, r: (t) => (t > 0.86 ? 0.8 : 1 + 0.2 * Math.pow(Math.abs(Math.sin(t * 34 * Math.PI)), 0.6) - 0.1), color: (t, q) => (Math.abs(q - 0.25) < 0.05 && t < 0.86 ? band : a) });
      const cae = new T3.Mesh(new T3.SphereGeometry(0.046, 16, 12), BA.mat.tissue(TIS.largeInt)); cae.position.set(-0.25, 1.465, 0.03);
      const app = BA.tube(BA.curve([[-0.24, 1.44, 0.03], [-0.215, 1.4, 0.035], [-0.2, 1.37, 0.03]]), 0.009, BA.mat.tissue(TIS.largeInt), { seg: 10, rs: 6 });
      add("largeInt", [m, cae, app], [0.27, 1.7, 0.08]);
    }
    for (const [id, side] of [["kidneyR", -1], ["kidneyL", 1]]) if (want(id)) {
      const geo = BA.cached("kidney", () => BA.mesh((x, y, z) => sd.smax(sd.ell(x, y, z, 0, 0, 0, 0.05, 0.085, 0.04), -sd.sph(x, y, z, 0.07, 0, 0, 0.045), 0.03), [-0.07, -0.1, -0.06, 0.07, 0.1, 0.06], 0.007));
      const m = new T3.Mesh(geo, BA.mat.tissue(TIS.kidney, { roughness: 0.3, clearcoat: 0.6 })); m.position.set(side * 0.165, side < 0 ? 1.79 : 1.82, -0.1); if (side > 0) m.scale.x = -1; m.rotation.z = side * -0.15;
      add(id, m, [side * 0.165, 1.8, -0.06]);
    }
    if (want("ureter")) add("ureter", [-1, 1].map((s) => BA.tube(BA.curve([[s * 0.13, 1.79, -0.1], [s * 0.1, 1.65, -0.09], [s * 0.08, 1.5, -0.05], [s * 0.035, 1.38, 0.03]]), 0.008, BA.mat.tissue(0xe8d9a8), { seg: 30, rs: 6 })), [0.09, 1.56, -0.06]);
    if (want("bladder")) { const m = new T3.Mesh(BK.blob(0.055, 4, 0.04, 20, 1, 0.9, 0.9), BA.mat.tissue(TIS.bladder, { roughness: 0.4, clearcoat: 0.4 })); m.position.set(0, 1.35, 0.06); add("bladder", m, [0, 1.35, 0.11]); }
    if (want("aorta")) {
      const m = BA.tube(BA.curve([[0.03, 2.2, -0.1], [0.025, 1.95, -0.11], [0.02, 1.7, -0.1], [0.015, 1.56, -0.08]]), 0.02, BA.mat.vessel(TIS.arteryBright), { seg: 30, rs: 8 });
      const il = [-1, 1].map((s) => BA.tube(BA.curve([[0.015, 1.56, -0.08], [s * 0.09, 1.46, -0.04], [s * 0.17, 1.36, 0.0]]), 0.013, BA.mat.vessel(TIS.arteryBright), { seg: 12, rs: 8 }));
      const rn = [-1, 1].map((s) => BA.tube(BA.curve([[0.02, 1.8, -0.1], [s * 0.07, 1.8, -0.1], [s * 0.125, 1.8, -0.1]]), 0.008, BA.mat.vessel(TIS.arteryBright), { seg: 8, rs: 6 }));
      add("aorta", [m].concat(il, rn), [0.03, 1.7, -0.08]);
    }
    if (want("cava")) {
      const m = BA.tube(BA.curve([[-0.035, 2.2, -0.09], [-0.035, 1.95, -0.1], [-0.03, 1.7, -0.1], [-0.02, 1.56, -0.08]]), 0.022, BA.mat.vessel(TIS.vein), { seg: 30, rs: 8 });
      const il = [-1, 1].map((s) => BA.tube(BA.curve([[-0.02, 1.56, -0.08], [s * 0.08, 1.45, -0.05], [s * 0.16, 1.35, -0.01]]), 0.014, BA.mat.vessel(TIS.vein), { seg: 12, rs: 8 }));
      const rn = [-1, 1].map((s) => BA.tube(BA.curve([[-0.03, 1.78, -0.1], [s * 0.07, 1.785, -0.1], [s * 0.125, 1.79, -0.1]]), 0.009, BA.mat.vessel(TIS.vein), { seg: 8, rs: 6 }));
      add("cava", [m].concat(il, rn), [-0.04, 1.7, -0.08]);
    }
    if (opt.only && want("brain")) { const b = BA.brain({ natural: true, cell: 0.03 }); b.scale.setScalar(0.19); b.position.set(0, 3.2, -0.01); const ms = []; b.traverse((m) => { if (m.isMesh) { ms.push(m); m.userData.part = "brain"; } }); group.add(b); parts.brain = { id: "brain", name: BA.INFO.brain[0], sys: "nervous", info: BA.INFO.brain[2], meshes: ms, anchor: V(0, 3.25, 0.2) }; }
    return { group, parts };
  };

  /* ---------- brain (unit size: about 2 long, front = +z) ---------- */
  const BR = { cerebrum: [0xf2d8c6, "Cerebrum", "The largest part. Thinking, memory, speech, voluntary movement, and the senses of sight, hearing, touch, taste and smell."], cerebellum: [0xa9ddd2, "Cerebellum", "Balance, posture and smooth, accurate muscle movement."], medulla: [0xe3c6a4, "Medulla oblongata", "Automatic actions: heartbeat, breathing rate, swallowing, coughing and blood pressure."], hypo: [0xe77fc8, "Hypothalamus and pituitary", "Controls body temperature, water balance, hunger and thirst, and the pituitary 'master gland'."], cord: [0xaee6f2, "Spinal cord", "Carries impulses between the brain and the body and is the centre for spinal reflexes."] };
  BA.BRAIN = BR;
  const LOBES = { frontal: [0x8fa6e8, "Frontal lobe", "Reasoning, planning, speech and voluntary movement (motor area)."], parietal: [0xefd98a, "Parietal lobe", "Touch, pain, temperature and pressure from the skin (sensory area)."], temporal: [0xe8775a, "Temporal lobe", "Hearing, smell and memory."], occipital: [0x9bcb8a, "Occipital lobe", "Sight — the visual area at the back of the cerebrum."] };
  BA.LOBES = LOBES;
  /* winding grooves: the zero-sets of two noise fields, 1 in the groove and 0 on the fold tops */
  function grooveAt(x, y, z) { const n1 = BK.noise3(x * 5.2 + 7, y * 5.2, z * 5.2), n2 = BK.noise3(x * 5.6 - 3, y * 5.6 + 9, z * 5.6 + 2); const q = 1 - sstep(0.0, 0.15, Math.min(Math.abs(n1 - 0.5), Math.abs(n2 - 0.5))); return q * q; }
  function cerebrumSDF(x, y, z) {
    const ax = Math.abs(x);
    let d = sd.ell(ax, y, z, 0.3, 0.12, 0.0, 0.47, 0.6, 0.98);
    d = sd.smin(d, sd.ell(ax, y, z, 0.5, -0.22, 0.2, 0.3, 0.3, 0.55), 0.18);               // temporal lobe
    d = sd.smax(d, 0.022 - ax, 0.05);                                                     // gap between the halves
    d = sd.smax(d, -(y + 0.42) - Math.max(0, -z - 0.15) * 0.5, 0.08);                     // flat underside, lifted at the back for the cerebellum
    return d + 0.085 * grooveAt(x, y, z);                                           // winding grooves (sulci)
  }
  BA.lobeAt = (x, y, z) => {
    const w = (BK.noise3(x * 2 + 5, y * 2, z * 2) - 0.5) * 0.16;
    if (z < -0.6 + w + (y < 0 ? 0.08 : 0)) return "occipital";
    if (y < -0.03 + w && z < 0.42 + w && Math.abs(x) > 0.16) return "temporal";
    if (z > 0.2 + w - (y - 0.3) * 0.38) return "frontal";
    return "parietal";
  };
  /* o.natural → one cream colour with crimson grooves; otherwise pastel lobes. Returns group with .parts */
  BA.brain = (o) => {
    o = o || {};
    const T3 = T(), g = new T3.Group(), cell = o.cell || 0.022, parts = {};
    const mk = (id, meshes, name, info, anchor) => { meshes = [].concat(meshes); meshes.forEach((m) => { m.userData.part = id; g.add(m); }); parts[id] = { id, name, info, meshes, anchor: V(anchor[0], anchor[1], anchor[2]) }; };
    const base = lin(TIS.brain), groove = lin(TIS.brainGroove);
    const depth = (x, y, z) => Math.pow(grooveAt(x, y, z), 0.8);
    if (o.natural) {
      const geo = BA.cached("cerebN" + cell, () => BA.mesh(cerebrumSDF, [-0.86, -0.62, -1.06, 0.86, 0.8, 1.06], cell, { color: (x, y, z) => mix3(base, groove, depth(x, y, z) * 0.85) }));
      mk("cerebrum", new T3.Mesh(geo, BA.mat.vtissue({ roughness: 0.6, clearcoat: 0.12 })), BR.cerebrum[1], BR.cerebrum[2], [0.3, 0.7, 0.2]);
    } else {
      /* mesh the cerebrum once, then split its triangles by lobe so each lobe can be isolated */
      const split = BA.cached("lobes" + cell, () => {
        const full = BA.mesh(cerebrumSDF, [-0.86, -0.62, -1.06, 0.86, 0.8, 1.06], cell), P = full.attributes.position.array, N = full.attributes.normal.array, I = full.index.array, out = {};
        Object.keys(LOBES).forEach((lb) => { out[lb] = { pos: [], nor: [], col: [], c: lin(LOBES[lb][0]) }; });
        for (let i = 0; i < I.length; i += 3) {
          const a = I[i] * 3, b2 = I[i + 1] * 3, c2 = I[i + 2] * 3;
          const lb = BA.lobeAt((P[a] + P[b2] + P[c2]) / 3, (P[a + 1] + P[b2 + 1] + P[c2 + 1]) / 3, (P[a + 2] + P[b2 + 2] + P[c2 + 2]) / 3), o2 = out[lb];
          for (const q of [a, b2, c2]) { o2.pos.push(P[q], P[q + 1], P[q + 2]); o2.nor.push(N[q], N[q + 1], N[q + 2]); const k = depth(P[q], P[q + 1], P[q + 2]); o2.col.push(o2.c[0] * (1 - 0.34 * k), o2.c[1] * (1 - 0.38 * k), o2.c[2] * (1 - 0.3 * k)); }
        }
        full.dispose(); const res = {};
        Object.keys(out).forEach((lb) => { const g2 = new T3.BufferGeometry(); g2.setAttribute("position", new T3.Float32BufferAttribute(out[lb].pos, 3)); g2.setAttribute("normal", new T3.Float32BufferAttribute(out[lb].nor, 3)); g2.setAttribute("color", new T3.Float32BufferAttribute(out[lb].col, 3)); res[lb] = g2; });
        return res;
      });
      Object.keys(LOBES).forEach((lb) => {
        const an = { frontal: [0.3, 0.55, 0.75], parietal: [0.3, 0.72, -0.2], temporal: [0.78, -0.2, 0.25], occipital: [0.25, 0.3, -0.98] }[lb];
        mk(lb, new T3.Mesh(split[lb], new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 })), LOBES[lb][1], LOBES[lb][2], an);
      });
    }
    const matte = (c) => (o.natural ? BA.mat.tissue(c, { roughness: 0.6, clearcoat: 0.12 }) : new T3.MeshStandardMaterial({ color: c, roughness: 0.9 }));
    const cbFn = (x, y, z) => { const ax = Math.abs(x); let d = sd.ell(ax, y, z, 0.24, -0.52, -0.62, 0.36, 0.27, 0.34); d = sd.smin(d, sd.ell(x, y, z, 0, -0.5, -0.6, 0.14, 0.24, 0.3), 0.06); return d + 0.014 * Math.sin((y * 1.0 + z * 0.35) * 62 + Math.sin(ax * 9) * 1.2); };
    const cbCol = o.natural ? lin(0xf0c2bc) : lin(BR.cerebellum[0]);
    const cbGeo = BA.cached("cereb" + (o.natural ? "n" : "p") + cell, () => BA.mesh(cbFn, [-0.66, -0.84, -1.0, 0.66, -0.2, -0.24], cell * 0.8, { color: (x, y, z) => { const k = 0.5 + 0.5 * Math.sin((y + z * 0.35) * 62 + Math.sin(Math.abs(x) * 9) * 1.2); return [cbCol[0] * (0.78 + 0.22 * k), cbCol[1] * (0.74 + 0.26 * k), cbCol[2] * (0.76 + 0.24 * k)]; } }));
    mk("cerebellum", new T3.Mesh(cbGeo, o.natural ? BA.mat.vtissue({ roughness: 0.6, clearcoat: 0.12 }) : new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })), BR.cerebellum[1], BR.cerebellum[2], [0.4, -0.6, -0.9]);
    const stem = BA.tube(BA.curve([[0, -0.2, -0.12], [0, -0.5, -0.2], [0, -0.78, -0.3], [0, -1.0, -0.36]]), 0.13, matte(o.natural ? 0xf0c8b8 : BR.medulla[0]), { seg: 30, rs: 14, r: (t) => 1.25 - 0.45 * t + 0.18 * Math.exp(-Math.pow((t - 0.28) / 0.14, 2)) });
    mk("medulla", stem, BR.medulla[1], BR.medulla[2], [0.1, -0.8, -0.2]);
    if (!o.natural) {
      const cord = BA.tube(BA.curve([[0, -1.0, -0.36], [0, -1.35, -0.42], [0, -1.75, -0.44]]), 0.075, matte(BR.cord[0]), { seg: 16, rs: 12 });
      mk("cord", cord, BR.cord[1], BR.cord[2], [0.06, -1.5, -0.4]);
      const hy = new T3.Mesh(new T3.SphereGeometry(0.1, 16, 12), matte(BR.hypo[0])); hy.position.set(0, -0.36, 0.14); const pit = new T3.Mesh(new T3.SphereGeometry(0.07, 14, 10), matte(BR.hypo[0])); pit.position.set(0, -0.54, 0.22);
      const stalk = BA.tube(BA.curve([[0, -0.38, 0.14], [0, -0.46, 0.18], [0, -0.52, 0.22]]), 0.025, matte(BR.hypo[0]), { seg: 6, rs: 6 });
      mk("hypo", [hy, pit, stalk], BR.hypo[1], BR.hypo[2], [0, -0.54, 0.28]);
    }
    g.parts = parts; return g;
  };

  /* ================================================================
     Focus: tap a part to isolate it, hover to name it, "find it" game
     ================================================================ */
  BA.focus = {
    /* attach once per scene in build(); s.aparts may be swapped later by the scene */
    init(S, s, o) {
      o = o || {};
      const T3 = T(), ray = new T3.Raycaster(), ndc = new T3.Vector2();
      const F = (s.focus = { sel: null, hov: null, msg: "", flash: 0, good: 0, score: 0, tries: 0, target: null, quiz: false, done: [], opt: o, mx: 0, my: 0 });
      const hit = (e) => {
        const r = S.c3.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        F.mx = ((e.clientX - r.left) / r.width) * 640; F.my = ((e.clientY - r.top) / r.height) * 400;
        ray.setFromCamera(ndc, S.camera);
        const ms = []; Object.values(s.aparts || {}).forEach((p) => { if (p.hidden) return; p.meshes.forEach((m) => { if (m.visible) ms.push(m); }); });
        const hs = ray.intersectObjects(ms, false);
        if (!hs.length) return null;
        /* prefer a solid part over a faded one */
        const op = (h) => (h.object.material.opacity == null ? 1 : h.object.material.opacity);
        const solid = hs.find((h) => !h.object.userData.soft && op(h) > 0.5) || hs.find((h) => op(h) > 0.3);
        return (solid || hs[0]).object.userData.part;
      };
      let down = null;
      const onDown = (e) => { down = [e.clientX, e.clientY]; };
      const onUp = (e) => {
        if (!down) return; const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]); down = null; if (moved > 6) return;
        const id = hit(e);
        if (F.quiz) { if (id) BA.focus.answer(s, id); return; }
        F.sel = id && id !== F.sel ? id : null; if (o.onSelect) o.onSelect(F.sel);
      };
      const onMove = (e) => { if (e.pointerType === "touch" || down) { F.hov = null; return; } F.hov = hit(e); S.wrap.style.cursor = F.hov ? "pointer" : ""; };
      const onLeave = () => { F.hov = null; };
      const onKey = (e) => { if (e.key === "Escape" && F.sel) { F.sel = null; if (o.onSelect) o.onSelect(null); } };
      S.wrap.addEventListener("pointerdown", onDown); S.wrap.addEventListener("pointerup", onUp); S.wrap.addEventListener("pointermove", onMove); S.wrap.addEventListener("pointerleave", onLeave); window.addEventListener("keydown", onKey);
      const prev = S.cleanup;
      S.cleanup = () => { prev && prev(); S.wrap.removeEventListener("pointerdown", onDown); S.wrap.removeEventListener("pointerup", onUp); S.wrap.removeEventListener("pointermove", onMove); S.wrap.removeEventListener("pointerleave", onLeave); window.removeEventListener("keydown", onKey); S.wrap.style.cursor = ""; };
      return F;
    },
    select(s, id) { if (s.focus) s.focus.sel = id; },
    /* quiz */
    setQuiz(s, on) { const F = s.focus; if (!F || F.quiz === !!on) return; F.quiz = !!on; F.sel = null; F.score = 0; F.tries = 0; F.done = []; F.msg = ""; if (on) BA.focus.next(s); else F.target = null; },
    next(s) { const F = s.focus, ids = Object.keys(s.aparts || {}).filter((k) => !s.aparts[k].hidden && !s.aparts[k].noQuiz); let pool = ids.filter((k) => !F.done.includes(k) && k !== F.target); if (!pool.length) { F.done = []; pool = ids.filter((k) => k !== F.target); } F.target = pool[Math.floor(Math.random() * pool.length)] || null; },
    answer(s, id) {
      const F = s.focus, P = s.aparts; if (F.flash > 0 && F.good) return; F.tries++;
      if (id === F.target) { F.score++; F.done.push(id); F.good = 1; F.flash = 1.4; F.msg = "Correct — " + P[id].name; F.reveal = id; }
      else { F.good = 0; F.flash = 1.4; F.msg = "That is the " + P[id].name.toLowerCase() + ". Try again."; F.reveal = null; }
    },
    /* call every frame: eases each part's opacity and tint */
    update(S, s, dt) {
      if (S.clinicLights) S.clinicLights();
      const F = s.focus, P = s.aparts; if (!F || !P) return;
      if (F.flash > 0) { F.flash -= dt; if (F.flash <= 0 && F.quiz && F.good) { F.reveal = null; BA.focus.next(s); } }
      const k = 1 - Math.pow(0.002, dt || 0.016), sel = F.quiz ? F.reveal : F.sel, fadeTo = F.opt.fade == null ? 0.1 : F.opt.fade;
      Object.values(P).forEach((p) => {
        const want = p.hidden ? 0 : sel && p.id !== sel ? (F.also && F.also.includes(p.id) ? 0.75 : fadeTo) : 1;
        p.op = p.op == null ? 1 : p.op + (want - p.op) * k;
        const glow = sel === p.id ? 0.1 + 0.06 * Math.sin(S.t * 5) : F.hov === p.id && !F.quiz ? 0.1 : F.auto === p.id && !F.quiz ? 0.1 + 0.08 * Math.sin(S.t * 5) : 0;
        p.meshes.forEach((m) => {
          if (m.userData.pick) return;
          const mt = m.material, b = m.userData.baseOp == null ? 1 : m.userData.baseOp, op = p.op * b;
          const tr = op < 0.985; if (mt.transparent !== tr) { mt.transparent = tr; mt.needsUpdate = true; }
          mt.opacity = op; mt.depthWrite = op > 0.6 && !m.userData.soft; m.visible = op > 0.02; m.renderOrder = op > 0.6 ? 0 : 6;
          if (mt.emissive) { mt.emissive.setHex(0xffffff); mt.emissiveIntensity = glow; }
        });
      });
    },
    /* HUD: hover tooltip, selected label with leader, quiz banner */
    overlay(S, s, B, o) {
      const F = s.focus, P = s.aparts; if (!F || !P) return; o = o || {};
      const proj = (p) => { const w = p.anchor.clone(); (o.world || s._ag || s.g).localToWorld(w); return MK.proj(S, w.x, w.y, w.z); };
      if (F.quiz) {
        const tgt = P[F.target];
        B.panel(12, 42, 236, 46);
        B.text("FIND IT", 24, 58, { size: 9, w: 700, color: "#9fc3ff", halo: false });
        B.text(tgt ? "Tap the " + tgt.name.toLowerCase() : "", 24, 77, { size: tgt && tgt.name.length > 22 ? 10.5 : 12.5, w: 700, color: "#ffd27a", halo: false });
        B.pill("Score " + F.score + " / " + F.tries, 12, 108, "#5bd68c", 11);
        if (F.flash > 0) B.pill(F.msg, 12, 132, F.good ? "#5bd68c" : "#ff7b72", 11.5);
        if (F.reveal && P[F.reveal]) { const q = proj(P[F.reveal]); if (q.z < 1) B.dot(q.x, q.y, "#5bd68c", 5); }
        return;
      }
      if (F.sel && P[F.sel]) {
        const p = P[F.sel], q = proj(p);
        if (q.z < 1) { const left = q.x > 210, tx = left ? q.x - 70 : q.x + 70, ty = q.y - 34; B.line(q.x, q.y, tx, ty, "#ffd27a", 1.4); B.dot(q.x, q.y, "#ffd27a", 3.5); B.pill(p.name, tx + (left ? -4 : 4), ty + 4, "#ffd27a", 12, left ? "right" : "left"); }
      } else if (o.labels) {
        /* leader-line labels stacked in a column on each side of the model */
        const its = []; o.labels.forEach((id) => { const p = P[id]; if (!p || p.hidden) return; const q = proj(p); if (q.z < 1) its.push({ p, q }); });
        if (its.length) {
          const cx = o.cx != null ? o.cx : its.reduce((a, it) => a + it.q.x, 0) / its.length, maxX = o.maxX || 386, gap = o.gap || 23;
          const L = its.filter((it) => (o.side ? o.side(it.p.id, it.q, cx) : it.q.x < cx)), R = its.filter((it) => !L.includes(it));
          [L, R].forEach((arr, si) => {
            if (!arr.length) return; arr.sort((a, b) => a.q.y - b.q.y);
            const col = si ? Math.max(...arr.map((it) => it.q.x)) + (o.reach || 34) : Math.min(...arr.map((it) => it.q.x)) - (o.reach || 34);
            let last = 34;
            arr.forEach((it) => { const name = it.p.short || it.p.name, w = name.length * 6.1 + 14; const ty = Math.max(it.q.y, last + gap); last = ty; const tx = si ? Math.min(col, maxX - w) : Math.max(col, w + 4);
              B.line(it.q.x, it.q.y, tx, ty, "rgba(120,135,165,.95)", 1); B.dot(it.q.x, it.q.y, "#5b7fd6", 2.4); B.pill(name, tx + (si ? 3 : -3), ty + 4, "#e8f1ff", 10, si ? "left" : "right"); });
          });
        }
      }
      if (F.hov && F.hov !== F.sel && P[F.hov]) B.pill(P[F.hov].name, clamp(F.mx + 12, 8, 500), clamp(F.my - 10, 40, 388), "#e8f1ff", 11);
      if (!F.sel && o.hint !== false) B.pill(o.hint || "Tap a part to isolate it", 12, 388, "#a9b6d3", 10);
    },
    /* HUD card lines for the selected part */
    card(s, fallback) {
      const F = s.focus, P = s.aparts || {};
      if (F && F.quiz) return [{ title: "Find the organ", lines: [["Score " + F.score + " out of " + F.tries + " taps", "#5bd68c", true], "Tap the part named at the top of the screen.", "Rotate the model: some parts hide behind others.", "Switch the game off to study the labels again."] }];
      if (F && F.sel && P[F.sel]) { const p = P[F.sel]; return [{ title: p.name, lines: [[p.info, "#e8f1ff"]].concat(p.extra || [], [["Tap it again, or press Esc, to show everything.", "#a9b6d3"]]) }]; }
      return fallback;
    },
  };
})();
