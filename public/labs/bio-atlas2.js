/* bio-atlas2.js — second half of the anatomy kit (loads after bio-atlas.js).
   Stage switching for mixed scenes, extra organs (mouth, glands), the sectioned four-chamber heart,
   the blood-vessel network, bronchial tree and rib cage, and the surface muscles of the body. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, BA = window.BA, sd = BA.sd, lin = BA.lin, mix3 = BA.mix3, TIS = BA.tis;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ---------- switch a scene that was built for another environment onto the clinical stage and back ---------- */
  BA.stage = (S, s, on, o) => {
    const T3 = T(), sc = S.scene; o = o || {};
    if (on && !S._clin) {
      const dark = o.dark == null ? BA.isDark() : o.dark;
      S._clin = { bg: sc.background, fog: sc.fog, tm: S.renderer.toneMapping, ex: S.renderer.toneMappingExposure, hidden: [], lights: [] };
      sc.children.forEach((ch) => { if (ch === (o.group || s.g) || ch.isCamera) return; if (ch.visible) { ch.visible = false; S._clin.hidden.push(ch); } });
      sc.background = new T3.Color(dark ? 0x0c1018 : 0xf1f2f4); sc.fog = null; S.clinicDark = dark;
      S.renderer.toneMapping = T3.NeutralToneMapping || T3.LinearToneMapping; S.renderer.toneMappingExposure = 1;
      const hemi = new T3.HemisphereLight(0xffffff, dark ? 0x26304a : 0xc9ccd6, dark ? 0.75 : 1.0), key = new T3.DirectionalLight(0xffffff, 2.3), fill = new T3.DirectionalLight(0xdfe8ff, 0.7);
      sc.add(hemi, key, fill, key.target, fill.target); S._clin.lights = [hemi, key, fill, key.target, fill.target];
      S.clinicLights = () => {
        const cam = S.camera, r = V(1, 0, 0).applyQuaternion(cam.quaternion), u = V(0, 1, 0).applyQuaternion(cam.quaternion), f = V(0, 0, 1).applyQuaternion(cam.quaternion);
        key.position.copy(S.orbit.target).addScaledVector(f, 6).addScaledVector(u, 5).addScaledVector(r, 3); key.target.position.copy(S.orbit.target);
        fill.position.copy(S.orbit.target).addScaledVector(f, 4).addScaledVector(u, -1).addScaledVector(r, -6); fill.target.position.copy(S.orbit.target);
      };
      S._clin.free = S.orbit.free; S.orbit.free = true;
    } else if (!on && S._clin) {
      const q = S._clin; q.hidden.forEach((ch) => { ch.visible = true; }); q.lights.forEach((l) => sc.remove(l));
      sc.background = q.bg; sc.fog = q.fog; S.renderer.toneMapping = q.tm; S.renderer.toneMappingExposure = q.ex; S.orbit.free = q.free; S.clinicLights = null; S._clin = null;
    }
  };
  /* move the camera for a new view inside one scene (keeps it as the double-click home) */
  BA.view = (S, pos, target) => { const o = S.orbit, tg = V(target[0], target[1], target[2]), d = V(pos[0], pos[1], pos[2]).sub(tg), r = d.length(); o.target.copy(tg); o.tr = r; o.ty = Math.atan2(d.x, d.z); o.tp = Math.asin(d.y / r); o.home = { yaw: o.ty, pitch: o.tp, r, target: tg.clone() }; o.touched = false; };

  /* Give an existing multi-view scene a new view (or replace one). def = { label, cam, dark, controls[], make(S,s,c,g), update, overlay, hud, readouts, onChange, first } */
  BA.addMode = (key, mode, def) => {
    const sc = MK.scenes[key]; if (!sc) return;
    let tabs = sc.controls.find((q) => q.type === "tabs" && q.key === "mode");
    if (!tabs) { tabs = { type: "tabs", key: "mode", label: "View", options: [def.base] }; sc.controls.unshift(tabs); sc.values.mode = def.base[0]; }
    const ex = tabs.options.find((q) => q[0] === mode), keep = !!def.keep;
    if (ex) ex[1] = def.label || ex[1]; else if (def.first) tabs.options.unshift([mode, def.label]); else tabs.options.push([mode, def.label]);
    if (def.first) sc.values.mode = mode;
    (def.controls || []).forEach((cc) => { const sh = cc.show; cc.show = (c) => c.mode === mode && (!sh || sh(c)); sc.controls.push(cc); });
    Object.assign(sc.values, def.values || {});
    const o = { build: sc.build, update: sc.update, overlay: sc.overlay, hud: sc.hud, readouts: sc.readouts, onChange: sc.onChange };
    sc.label = "Realistic 3D lab"; if (def.blurb) sc.blurb = def.blurb;
    sc.build = function (S, s, c) { o.build && o.build.call(sc, S, s, c); s._am = null; if (S._focusFor !== s) { S._focusFor = s; BA.focus.init(S, s); } };
    sc.update = function (S, s, c, dt) {
      if (c.mode === mode) {
        if (s._am !== mode) { s._am = mode; let g; if (keep) { g = BK.group(S, s, "ag"); } else { s.key = "__" + mode; g = BK.group(S, s); if (s.dyn) { BK.dispose(S, s.dyn); s.dyn = null; s.dk = ""; } } s._ag = g; BA.stage(S, s, false); BA.stage(S, s, true, { dark: def.dark, group: g }); s.aparts = null; s.focus.sel = null; s.focus.hov = null; def.make(S, s, c, g); if (def.cam) { BA.view(S, def.cam[0], def.cam[1]); if (!S.t) { const ob = S.orbit; ob.yaw = ob.ty; ob.pitch = ob.tp; ob.r = ob.tr; } } BA.focus.setQuiz(s, 0); if (c.quiz) BA.focus.setQuiz(s, 1); }
        def.update && def.update(S, s, c, dt); BA.focus.update(S, s, dt);
      } else {
        if (s._am === mode) { s._am = null; s._ag = null; s.aparts = null; s.focus.sel = null; s.focus.hov = null; BA.focus.setQuiz(s, 0); BA.stage(S, s, false); if (keep && s.ag) { BK.dispose(S, s.ag); s.ag = null; } if (sc.cam) BA.view(S, sc.cam[0], sc.cam[1]); }
        o.update && o.update.call(sc, S, s, c, dt);
      }
    };
    sc.overlay = function (ctx, s, c, S, B) { if (c.mode === mode) { if (s._am === mode) def.overlay && def.overlay(ctx, s, c, S, B); } else o.overlay && o.overlay.call(sc, ctx, s, c, S, B); };
    sc.hud = function (s, c) { return c.mode === mode ? (s._am === mode && def.hud ? def.hud(s, c) : []) : o.hud ? o.hud.call(sc, s, c) : []; };
    sc.readouts = function (s, c) { return c.mode === mode ? (def.readouts ? def.readouts(s, c) : []) : o.readouts ? o.readouts.call(sc, s, c) : []; };
    sc.onChange = function (s, c, k, H) { o.onChange && o.onChange.call(sc, s, c, k, H); if (c.mode === mode && s.focus) { if (k === "quiz") BA.focus.setQuiz(s, c.quiz); def.onChange && def.onChange(s, c, k, H); } };
    sc.syncAll = true;
  };

  /* ---------- merge simple geometries (position + normal [+ color]) into one draw call ---------- */
  BA.merge = (geos) => {
    let nv = 0, ni = 0; geos.forEach((g) => { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; });
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = new Uint32Array(ni); let vo = 0, io = 0;
    geos.forEach((g) => { pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3); const n = g.attributes.position.count; if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) idx[io + i] = a[i] + vo; io += a.length; } else { for (let i = 0; i < n; i++) idx[io + i] = vo + i; io += n; } vo += n; g.dispose(); });
    const out = new (T().BufferGeometry)(); out.setAttribute("position", new (T().BufferAttribute)(pos, 3)); out.setAttribute("normal", new (T().BufferAttribute)(nor, 3)); out.setIndex(new (T().BufferAttribute)(idx, 1)); return out;
  };

  /* ---------- extra organs added to a BA.organs() result ---------- */
  Object.assign(BA.INFO, {
    mouth: ["Mouth and tongue", "digestive", "Teeth cut and grind food; the tongue rolls it into a bolus and mixes it with saliva."],
    saliva: ["Salivary glands", "digestive", "Three pairs of glands make saliva. Salivary amylase (ptyalin) begins the digestion of cooked starch to maltose."],
    pituitary: ["Pituitary gland", "endocrine", "The 'master gland' under the brain: growth hormone, ADH, FSH, LH and TSH."],
    thyroid: ["Thyroid gland", "endocrine", "Makes thyroxine, which controls the rate of metabolism and growth. Needs iodine."],
    adrenal: ["Adrenal glands", "endocrine", "Sit on top of the kidneys and make adrenaline, the 'fight or flight' hormone."],
    islets: ["Pancreas (islets of Langerhans)", "endocrine", "Insulin lowers blood glucose; glucagon raises it."],
    ovary: ["Ovaries", "endocrine", "Make oestrogen and progesterone and release the eggs (ova)."],
    testis: ["Testes", "endocrine", "Make testosterone and the sperm cells."],
    ribs: ["Rib cage", "respiratory", "Twelve pairs of ribs protect the heart and lungs. Intercostal muscles lift them up and out when you breathe in."],
  });
  BA.extra = (O, ids) => {
    const T3 = T(), add = (id, meshes, anchor) => { meshes = [].concat(meshes); meshes.forEach((m) => { O.group.add(m); m.userData.part = id; }); O.parts[id] = { id, name: BA.INFO[id][0], sys: BA.INFO[id][1], info: BA.INFO[id][2], meshes, anchor: V(anchor[0], anchor[1], anchor[2]) }; };
    const gl = () => BA.mat.tissue(TIS.gland, { roughness: 0.45, clearcoat: 0.35 });
    const blob = (r, sx, sy, sz, x, y, z, mat, seed) => { const m = new T3.Mesh(BK.blob(r, seed || 3, 0.1, 18, sx, sy, sz), mat); m.position.set(x, y, z); return m; };
    ids.forEach((id) => {
      if (id === "mouth") {
        const tongue = new T3.Mesh(new T3.SphereGeometry(0.07, 20, 14), BA.mat.tissue(TIS.mouth, { roughness: 0.5 })); tongue.scale.set(0.75, 0.32, 1.25); tongue.position.set(0, 2.975, 0.1);
        const cav = BA.tube(BA.curve([[0, 2.99, 0.2], [0, 3.0, 0.1], [0, 2.99, 0.03]]), 0.052, BA.mat.tissue(0xcf6a70, { transparent: true, opacity: 0.55, depthWrite: false, side: T3.DoubleSide }), { seg: 12, rs: 14, r: (t) => 0.75 + 0.3 * Math.sin(t * Math.PI) }); cav.scale.set(1.25, 0.72, 1); cav.position.y = 3.0 * 0.28; cav.userData.baseOp = 0.55; cav.userData.soft = true;
        const teeth = []; const tm = new T3.MeshPhysicalMaterial({ color: 0xf6f2e6, roughness: 0.25, clearcoat: 1 });
        for (let i = 0; i < 12; i++) { const a = (i / 11 - 0.5) * 2.6; for (const up of [1, -1]) { const th = new T3.Mesh(new T3.BoxGeometry(0.014, 0.022, 0.012), tm); th.position.set(Math.sin(a) * 0.058, 2.995 + up * 0.016, 0.115 + Math.cos(a) * 0.085); th.rotation.y = a; teeth.push(th); } }
        add("mouth", [tongue, cav].concat(teeth), [0, 2.99, 0.2]);
      }
      if (id === "saliva") { const ms = []; for (const s of [-1, 1]) { ms.push(blob(0.035, 0.6, 1.2, 0.9, s * 0.135, 3.03, 0.02, gl(), 5), blob(0.022, 1, 0.7, 1.2, s * 0.085, 2.9, 0.06, gl(), 7), blob(0.016, 1, 0.6, 1.4, s * 0.03, 2.925, 0.13, gl(), 9)); ms.push(BA.tube(BA.curve([[s * 0.13, 3.02, 0.04], [s * 0.1, 3.0, 0.1], [s * 0.06, 2.995, 0.13]]), 0.004, gl(), { seg: 8, rs: 5 })); } add("saliva", ms, [0.14, 3.03, 0.05]); }
      if (id === "pituitary") { const m = new T3.Mesh(new T3.SphereGeometry(0.022, 14, 10), gl()); m.position.set(0, 3.12, 0.05); const st = BA.tube(BA.curve([[0, 3.16, 0.04], [0, 3.14, 0.045], [0, 3.125, 0.05]]), 0.006, gl(), { seg: 5, rs: 5 }); add("pituitary", [m, st], [0, 3.12, 0.07]); }
      if (id === "thyroid") { const ms = [-1, 1].map((s) => blob(0.034, 0.7, 1.35, 0.6, s * 0.04, 2.84, 0.06, gl(), 4 + s)); const isth = new T3.Mesh(new T3.SphereGeometry(0.02, 10, 8), gl()); isth.scale.set(1.6, 0.6, 0.5); isth.position.set(0, 2.825, 0.075); add("thyroid", ms.concat(isth), [0.04, 2.84, 0.09]); }
      if (id === "adrenal") { const ms = [-1, 1].map((s) => { const m = new T3.Mesh(new T3.ConeGeometry(0.03, 0.035, 12), gl()); m.scale.set(1.2, 1, 0.7); m.position.set(s * 0.15, s < 0 ? 1.885 : 1.915, -0.1); return m; }); add("adrenal", ms, [0.15, 1.92, -0.08]); }
      if (id === "islets") { const src = O.parts.pancreas; const m = src ? src.meshes[0].clone() : blob(0.03, 3, 1, 1, 0.05, 1.84, 0, gl()); m.material = BA.mat.tissue(TIS.pancreas, { roughness: 0.55, clearcoat: 0.25 }); if (src) { src.meshes.forEach((q) => O.group.remove(q)); delete O.parts.pancreas; } const dots = []; const rr = BK.rng(5); for (let i = 0; i < 16; i++) { const t = rr(); const d = new T3.Mesh(new T3.SphereGeometry(0.006, 8, 6), gl()); d.position.set(-0.07 + t * 0.3, 1.82 + t * 0.075 + (rr() - 0.5) * 0.03, 0.03 - t * 0.03 + rr() * 0.012); dots.push(d); } add("islets", [m].concat(dots), [0.05, 1.84, 0.04]); }
      if (id === "ovary") { const ms = []; for (const s of [-1, 1]) { const m = new T3.Mesh(new T3.SphereGeometry(0.026, 14, 10), BA.mat.matte(TIS.ovary)); m.scale.set(1.3, 0.85, 0.8); m.position.set(s * 0.14, 1.44, 0.03); ms.push(m, BA.tube(BA.curve([[s * 0.12, 1.45, 0.03], [s * 0.08, 1.47, 0.035], [s * 0.035, 1.43, 0.03]]), 0.008, BA.mat.tissue(TIS.uterus), { seg: 10, rs: 6 })); } const ut = new T3.Mesh(new T3.SphereGeometry(0.04, 16, 12), BA.mat.tissue(TIS.uterus)); ut.scale.set(1, 1.3, 0.75); ut.position.set(0, 1.41, 0.03); ms.push(ut); add("ovary", ms, [0.14, 1.44, 0.06]); }
      if (id === "testis") { const ms = [-1, 1].map((s) => { const m = new T3.Mesh(new T3.SphereGeometry(0.03, 14, 10), BA.mat.matte(TIS.ovary)); m.scale.set(0.8, 1.2, 0.85); m.position.set(s * 0.045, 1.2, 0.09); return m; }); add("testis", ms, [0.05, 1.2, 0.12]); }
      if (id === "ribs") {
        const geos = [], bone = BA.mat.matte(TIS.bone, { roughness: 0.7 });
        /* each rib follows the inside of the chest wall, found from the body shape */
        const wall = (y, z) => { let lo = 0.05, hi = 0.6; for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (BA.bodySDF(m, y, z) < -0.03) lo = m; else hi = m; } return lo; };
        const front = (x, y) => { let lo = 0, hi = 0.4; for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (BA.bodySDF(x, y, m) < -0.028) lo = m; else hi = m; } return lo; };
        for (let i = 0; i < 10; i++) {
          const y = 2.66 - i * 0.058, drop = 0.06 + i * 0.011, ys = y - drop * 0.45, w = Math.min(wall(ys, -0.02), 0.2 + i * 0.045);
          for (const s of [-1, 1]) { const pts = [[s * 0.03, y + 0.02, -0.17], [s * w * 0.7, y + 0.015, -0.15 - (i < 2 ? 0 : 0.01)], [s * w, ys, -0.02], [s * w * 0.78, y - drop * 0.85, front(w * 0.78, y - drop * 0.85) - 0.005]];
            if (i < 7) pts.push([s * 0.03, y - drop, front(0.03, y - drop)]); else pts.push([s * (0.1 + (i - 7) * 0.05), y - drop + 0.025, front(0.1 + (i - 7) * 0.05, y - drop + 0.025)]);
            geos.push(new T3.TubeGeometry(BA.curve(pts), 28, 0.0085, 6)); }
        }
        const st = new T3.CapsuleGeometry(0.02, 0.3, 4, 10); st.scale(1, 1, 0.4); st.translate(0, 2.42, front(0, 2.42) + 0.002); geos.push(st);
        for (let i = 0; i < 12; i++) { const vb = new T3.CylinderGeometry(0.026, 0.026, 0.034, 10); vb.translate(0, 2.7 - i * 0.055, -0.175); geos.push(vb); }
        const m = new T3.Mesh(BA.merge(geos), bone); add("ribs", m, [0.3, 2.45, 0.1]);
      }
    });
    return O;
  };

  /* ---------- bronchial tree grown inside one lung ---------- */
  BA.bronchi = (side, seed) => {
    const T3 = T(), rr = BK.rng(seed || 31), geos = [];
    const inside = (p) => sd.ell(p.x, p.y, p.z, side * 0.19, 2.39, -0.01, 0.125, 0.27, 0.14) < 0 && sd.ell(p.x, p.y, p.z, 0.055, 2.28, 0.075, 0.16, 0.18, 0.15) > 0 && p.y > 2.1 + 0.2 * (1 - Math.abs(p.x) / 0.36);
    const grow = (p, d, len, r, depth) => {
      const e = p.clone().addScaledVector(d, len); if (!inside(e) && depth < 5) { if (depth > 3) return; }
      const g = new T3.CylinderGeometry(r * 0.8, r, len, 6, 1, true); g.translate(0, len / 2, 0); const q = new T3.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize()); g.applyQuaternion(q); g.translate(p.x, p.y, p.z); geos.push(g);
      if (depth <= 0 || r < 0.0022) return;
      for (let k = 0; k < 2; k++) { const nd = d.clone().add(V((rr() - 0.5) * 1.5, (rr() - 0.62) * 1.3, (rr() - 0.5) * 1.5)).normalize(); let ne = e.clone().addScaledVector(nd, len * 0.78); if (!inside(ne)) { nd.lerp(V(side * 0.19, 2.36, 0).sub(e).normalize(), 0.8).normalize(); } grow(e, nd, len * 0.78, r * 0.72, depth - 1); }
    };
    grow(V(side * 0.14, 2.39, -0.01), V(side * 0.8, -0.3, 0).normalize(), 0.055, 0.012, 6);
    return new T3.Mesh(BA.merge(geos), BA.mat.matte(0xf3e9e6, { roughness: 0.5 }));
  };

  /* ---------- the four-chamber section of the heart (unit space, cut along the front) ---------- */
  const CH = {
    ra: (x, y, z) => sd.ell(x, y, z, -0.45, 0.62, -0.05, 0.25, 0.2, 0.24), la: (x, y, z) => sd.ell(x, y, z, 0.36, 0.64, -0.05, 0.25, 0.185, 0.22),
    rv: (x, y, z) => sd.smin(sd.cone(x, y, z, -0.3, 0.14, -0.05, 0.02, -0.56, -0.05, 0.215, 0.075), sd.cone(x, y, z, -0.4, 0.42, -0.05, -0.33, 0.2, -0.05, 0.085, 0.12), 0.05),
    lv: (x, y, z) => sd.smin(sd.cone(x, y, z, 0.3, 0.12, -0.05, 0.26, -0.6, -0.05, 0.165, 0.06), sd.cone(x, y, z, 0.33, 0.45, -0.05, 0.3, 0.2, -0.05, 0.08, 0.11), 0.05),
  };
  function secOuter(x, y, z) {
    let d = sd.smax(sd.cone(x, y, z, 0.0, 0.2, -0.05, 0.22, -0.8, -0.05, 0.63, 0.15), y - 0.44, 0.14);
    d = sd.smin(d, sd.ell(x, y, z, -0.45, 0.6, -0.05, 0.36, 0.32, 0.34), 0.12);
    return sd.smin(d, sd.ell(x, y, z, 0.37, 0.62, -0.05, 0.36, 0.3, 0.32), 0.12);
  }
  function secSDF(x, y, z) {
    const cav = Math.min(CH.ra(x, y, z), CH.la(x, y, z), CH.rv(x, y, z), CH.lv(x, y, z));
    return sd.smax(sd.smax(secOuter(x, y, z), -cav, 0.02), z + 0.05, 0.012);
  }
  BA.heartSection = () => {
    const T3 = T(), g = new T3.Group();
    const wall = lin(0xc4564e), wallIn = lin(0xdb8a7c), outer = lin(TIS.heart), blue = lin(0x7f8fe6), red = lin(0xe0605a), fat = lin(0xeccf8a);
    const geo = BA.cached("heartSec", () => BA.mesh(secSDF, [-0.95, -1.05, -0.5, 0.95, 1.0, 0.0], 0.026, { color: (x, y, z, nx, ny, nz) => {
      const r = Math.min(CH.ra(x, y, z), CH.rv(x, y, z)), l = Math.min(CH.la(x, y, z), CH.lv(x, y, z));
      if (r < 0.02) return mix3(blue, lin(0x5566cc), sstep(0.3, 0.7, BK.fbm(x * 9, y * 9, z * 9)));
      if (l < 0.02) return mix3(red, lin(0xb8403c), sstep(0.3, 0.7, BK.fbm(x * 9, y * 9, z * 9)));
      if (nz > 0.6) return mix3(wall, wallIn, sstep(0.0, 0.06, Math.min(r, l)) * 0.5 + 0.25 * BK.noise3(x * 30, y * 30, 0));
      return mix3(outer, fat, sstep(0.2, 0.4, y) * (1 - sstep(0.46, 0.6, y)) * 0.6);
    } }));
    const mesh = new T3.Mesh(geo, BA.mat.vtissue({ roughness: 0.42, clearcoat: 0.4 })); g.add(mesh); g.wall = mesh;
    const R = BA.mat.vessel(TIS.arteryBright), Bm = BA.mat.vessel(0x4a5fd8), z0 = -0.3;
    const vs = {
      svc: BA.tube(BA.curve([[-0.5, 1.75, z0], [-0.5, 1.2, z0 + 0.05], [-0.48, 0.82, -0.2]]), 0.13, Bm, { seg: 14, rs: 14 }),
      ivc: BA.tube(BA.curve([[-0.5, 0.45, -0.3], [-0.54, -0.2, -0.42], [-0.52, -1.0, -0.42]]), 0.13, Bm, { seg: 14, rs: 14 }),
      pa: BA.tube(BA.curve([[-0.36, 0.42, -0.12], [-0.22, 0.85, -0.16], [-0.02, 1.18, -0.2], [0.3, 1.26, -0.24], [0.95, 1.2, -0.24]]), 0.125, Bm, { seg: 30, rs: 14 }),
      pa2: BA.tube(BA.curve([[-0.02, 1.18, -0.2], [-0.4, 1.3, -0.36], [-1.0, 1.25, -0.36]]), 0.1, Bm, { seg: 16, rs: 12 }),
      ao: BA.tube(BA.curve([[0.2, 0.44, -0.2], [0.08, 0.95, -0.26], [0.1, 1.45, -0.3], [0.4, 1.66, -0.34], [0.72, 1.4, -0.38], [0.74, 0.4, -0.44], [0.7, -0.9, -0.44]]), 0.135, R, { seg: 50, rs: 14, r: (t) => 1 - 0.25 * t }),
      pv1: BA.tube(BA.curve([[0.55, 0.72, -0.14], [0.85, 0.8, -0.16], [1.05, 0.86, -0.16]]), 0.065, R, { seg: 8, rs: 8 }), pv2: BA.tube(BA.curve([[0.55, 0.56, -0.14], [0.85, 0.56, -0.16], [1.05, 0.56, -0.16]]), 0.065, R, { seg: 8, rs: 8 }),
    };
    Object.values(vs).forEach((m) => g.add(m));
    /* valves: two pale flaps each, hinged at the wall */
    const flapM = new T3.MeshPhysicalMaterial({ color: 0xf6e8d8, roughness: 0.5, side: T3.DoubleSide });
    const valve = (x, y, w) => { const out = []; for (const s of [-1, 1]) { const piv = new T3.Group(); piv.position.set(x + s * w, y, -0.06); const f = new T3.Mesh(new T3.BoxGeometry(w * 0.98, 0.02, 0.14), flapM); f.position.x = -s * w * 0.49; piv.add(f); piv.userData.s = s; g.add(piv); out.push(piv); } return out; };
    g.tri = valve(-0.345, 0.33, 0.105); g.bi = valve(0.31, 0.34, 0.095);
    const semi = (x, y, rot) => { const m = new T3.Mesh(new T3.TorusGeometry(0.075, 0.018, 8, 18), flapM); m.position.set(x, y, -0.13); m.rotation.x = Math.PI / 2; m.rotation.z = rot; g.add(m); return m; };
    g.semi = [semi(-0.33, 0.47, 0.3), semi(0.2, 0.5, -0.2)];
    /* blood paths: right side (blue) and left side (red) */
    g.pathR = BA.curve([[-0.5, 1.7, -0.3], [-0.5, 1.1, -0.26], [-0.46, 0.66, -0.07], [-0.37, 0.4, -0.07], [-0.26, 0.05, -0.07], [-0.08, -0.38, -0.07], [-0.18, -0.02, -0.08], [-0.33, 0.42, -0.1], [-0.22, 0.85, -0.16], [-0.02, 1.18, -0.2], [0.3, 1.26, -0.24], [0.95, 1.2, -0.24]]);
    g.pathL = BA.curve([[1.05, 0.8, -0.16], [0.7, 0.74, -0.14], [0.4, 0.66, -0.07], [0.32, 0.4, -0.07], [0.29, 0.0, -0.07], [0.27, -0.45, -0.07], [0.24, 0.0, -0.09], [0.2, 0.44, -0.16], [0.08, 0.95, -0.26], [0.1, 1.45, -0.3], [0.4, 1.66, -0.34], [0.72, 1.4, -0.38], [0.74, 0.5, -0.44]]);
    g.anch = { ra: [-0.47, 0.62, -0.04], la: [0.38, 0.64, -0.04], rv: [-0.22, -0.05, -0.04], lv: [0.28, -0.2, -0.04], septum: [0.07, -0.25, -0.03], tri: [-0.345, 0.33, -0.02], bi: [0.31, 0.34, -0.02], ao: [0.4, 1.66, -0.2], pa: [-0.15, 1.02, -0.06], svc: [-0.5, 1.5, -0.18], ivc: [-0.53, -0.7, -0.3], pv: [0.98, 0.7, -0.1], wallL: [0.52, -0.25, -0.03] };
    return g;
  };

  /* ---------- blood-vessel network of the whole body ---------- */
  const mir = (pts, s) => pts.map((p) => [p[0] * s, p[1], p[2]]);
  BA.VESSELS = (() => {
    const leg = [[0.02, 1.56, -0.08], [0.12, 1.45, -0.02], [0.19, 1.2, 0.03], [0.2, 0.8, 0.02], [0.2, 0.42, -0.04], [0.21, 0.1, 0.0], [0.22, 0.05, 0.14]];
    const arm = [[0.04, 2.52, -0.02], [0.2, 2.6, -0.01], [0.45, 2.56, 0.0], [0.6, 1.98, -0.01], [0.68, 1.5, 0.04], [0.71, 1.28, 0.07]];
    const head = [[0.04, 2.52, -0.02], [0.065, 2.76, 0.02], [0.085, 2.98, 0.03], [0.11, 3.2, 0.02]];
    const trunk = [[0.05, 2.36, 0.05], [0.04, 2.5, 0.01], [0.035, 2.44, -0.09], [0.03, 2.0, -0.11], [0.02, 1.56, -0.08]];
    return { trunk, limbs: [leg, mir(leg, -1), arm, mir(arm, -1), head, mir(head, -1)] };
  })();
  /* returns { group, flows: [{curve, col, n}] } — arteries red, veins blue, plus fine side branches */
  BA.vessels = (o) => {
    o = o || {};
    const T3 = T(), g = new T3.Group(), flows = [], rr = BK.rng(77), aG = [], vG = [];
    const VS = BA.VESSELS, off = (pts, dx, dz) => pts.map((p) => [p[0] + (p[0] >= 0 ? dx : -dx) * (Math.abs(p[0]) > 0.03 ? 1 : 0.6), p[1], p[2] + dz]);
    const twigs = (curve, out, r0) => { for (let i = 0; i < 9; i++) { const t = 0.12 + rr() * 0.86, p = curve.getPointAt(t), d = V(rr() - 0.5, (rr() - 0.5) * 0.7, rr() - 0.5).normalize(), pts = [p.clone()]; let q = p.clone(); for (let k = 0; k < 4; k++) { q = q.clone().addScaledVector(d, 0.03 + rr() * 0.02); d.add(V((rr() - 0.5) * 0.7, (rr() - 0.5) * 0.7, (rr() - 0.5) * 0.7)).normalize(); if (BA.bodyF(q.x, q.y, q.z) > -0.018) break; pts.push(q); } if (pts.length > 2) out.push(new T3.TubeGeometry(BA.curve(pts), 8, r0, 4)); } };
    const tr = BA.curve(VS.trunk), trv = BA.curve(off(VS.trunk, -0.07, 0.012));
    aG.push(new T3.TubeGeometry(tr, 40, 0.02, 8)); vG.push(new T3.TubeGeometry(trv, 40, 0.022, 8));
    flows.push({ curve: tr, col: 0xe02a2a, n: 14 }, { curve: trv, col: 0x3a55ee, n: 14, rev: true });
    VS.limbs.forEach((L) => {
      const ca = BA.curve(L), cv = BA.curve(off(L, 0.022, -0.02));
      aG.push(new T3.TubeGeometry(ca, 60, 0.011, 6)); vG.push(new T3.TubeGeometry(cv, 60, 0.0125, 6));
      twigs(ca, aG, 0.0035); twigs(cv, vG, 0.004);
      flows.push({ curve: ca, col: 0xe02a2a, n: 16 }, { curve: cv, col: 0x3a55ee, n: 16, rev: true });
    });
    /* pulmonary loop: blue out to the lungs, red back */
    for (const s of [-1, 1]) {
      const out = BA.curve([[0.03, 2.36, 0.09], [s * 0.1, 2.43, 0.05], [s * 0.2, 2.44, 0.02], [s * 0.26, 2.36, 0.0]]), back = BA.curve([[s * 0.26, 2.3, -0.02], [s * 0.2, 2.34, -0.03], [s * 0.1, 2.33, 0.0], [0.07, 2.31, 0.03]]);
      vG.push(new T3.TubeGeometry(out, 20, 0.013, 6)); aG.push(new T3.TubeGeometry(back, 20, 0.012, 6));
      flows.push({ curve: out, col: 0x3a55ee, n: 7, pul: true }, { curve: back, col: 0xe02a2a, n: 7, pul: true });
    }
    const am = new T3.Mesh(BA.merge(aG), BA.mat.vessel(TIS.arteryBright)), vm = new T3.Mesh(BA.merge(vG), BA.mat.vessel(TIS.vein));
    g.add(am, vm); g.arteries = am; g.veins = vm;
    const N = flows.reduce((a, f) => a + f.n, 0);
    const im = new T3.InstancedMesh(new T3.SphereGeometry(0.0105, 8, 6), new T3.MeshBasicMaterial({ color: 0xffffff }), N); im.instanceColor = new T3.InstancedBufferAttribute(new Float32Array(N * 3), 3); im.frustumCulled = false; g.add(im); g.cells = im;
    let k = 0; flows.forEach((f) => { f.u = Array.from({ length: f.n }, (_, i) => (i + rr() * 0.5) / f.n); f.i0 = k; k += f.n; });
    const m4 = new T3.Matrix4(), col = new T3.Color(), p = V();
    g.step = (dt, speed) => { flows.forEach((f) => { for (let i = 0; i < f.n; i++) { f.u[i] = (f.u[i] + dt * speed * (f.pul ? 0.5 : 0.22) / Math.max(0.3, f.curve.getLength())) % 1; f.curve.getPointAt(f.rev ? 1 - f.u[i] : f.u[i], p); m4.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(f.i0 + i, m4); col.setHex(f.col); im.setColorAt(f.i0 + i, col); } }); im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; };
    return { group: g, flows };
  };

  /* ---------- surface muscles: each one is a patch of the body surface, raised into a belly ---------- */
  /* [id, name, action, a, b, half-width, side: 0 = midline pair (mirrored), group] */
  BA.MUSCLES = [
    ["sterno", "Sternocleidomastoid", "Turns and bends the head.", [0.125, 2.98, -0.03], [0.03, 2.68, 0.09], 0.04],
    ["trapezius", "Trapezius", "Lifts and pulls back the shoulders; holds up the head.", [0.02, 2.9, -0.1], [0.38, 2.62, -0.08], 0.16],
    ["deltoid", "Deltoid", "Lifts the arm away from the body at the shoulder.", [0.41, 2.7, 0.0], [0.575, 2.3, 0.0], 0.14],
    ["pectoral", "Pectoralis major (chest)", "Pulls the arm forwards and across the chest.", [0.03, 2.47, 0.2], [0.43, 2.52, 0.1], 0.185],
    ["biceps", "Biceps", "Flexor: bends the arm at the elbow. Works against the triceps.", [0.5, 2.44, 0.07], [0.6, 2.03, 0.05], 0.08],
    ["triceps", "Triceps", "Extensor: straightens the arm at the elbow. Works against the biceps.", [0.5, 2.5, -0.09], [0.62, 2.02, -0.09], 0.085],
    ["flexors", "Forearm flexors", "Bend the wrist and close the fingers.", [0.6, 1.98, 0.05], [0.685, 1.5, 0.09], 0.064],
    ["extensors", "Forearm extensors", "Straighten the wrist and open the fingers.", [0.63, 1.98, -0.08], [0.7, 1.5, 0.0], 0.06],
    ["abs", "Rectus abdominis", "Bends the trunk forwards and holds in the abdomen.", [0.085, 2.22, 0.21], [0.075, 1.46, 0.2], 0.088],
    ["oblique", "External oblique", "Twists and bends the trunk sideways.", [0.3, 2.2, 0.1], [0.25, 1.6, 0.13], 0.135],
    ["lats", "Latissimus dorsi", "Pulls the arm down and back (as in rowing or climbing).", [0.36, 2.42, -0.14], [0.09, 1.76, -0.2], 0.2],
    ["gluteus", "Gluteus maximus", "Straightens the hip: standing up, climbing, running.", [0.06, 1.66, -0.19], [0.3, 1.36, -0.14], 0.185],
    ["quads", "Quadriceps", "Extensor: straightens the leg at the knee. Works against the hamstrings.", [0.2, 1.45, 0.13], [0.205, 0.84, 0.11], 0.15],
    ["adductor", "Adductors", "Pull the legs together.", [0.07, 1.4, 0.0], [0.13, 0.98, 0.02], 0.075],
    ["hamstrings", "Hamstrings", "Flexor: bends the leg at the knee. Works against the quadriceps.", [0.19, 1.36, -0.14], [0.2, 0.86, -0.09], 0.14],
    ["calf", "Gastrocnemius (calf)", "Raises the heel: walking, running and jumping. Joined to the heel by the Achilles tendon.", [0.2, 0.8, -0.1], [0.2, 0.36, -0.1], 0.105],
    ["tibialis", "Tibialis anterior", "Lifts the front of the foot.", [0.235, 0.76, 0.08], [0.21, 0.2, 0.04], 0.05],
  ];
  BA.muscleGeo = (M) => BA.cached("mus_" + M[0], () => {
    const a = V(M[3][0], M[3][1], M[3][2]), b = V(M[4][0], M[4][1], M[4][2]), mid = a.clone().add(b).multiplyScalar(0.5), e1 = b.clone().sub(a), L = e1.length() / 2; e1.normalize();
    const h = 0.01, gr = V(BA.bodyF(mid.x + h, mid.y, mid.z) - BA.bodyF(mid.x - h, mid.y, mid.z), BA.bodyF(mid.x, mid.y + h, mid.z) - BA.bodyF(mid.x, mid.y - h, mid.z), BA.bodyF(mid.x, mid.y, mid.z + h) - BA.bodyF(mid.x, mid.y, mid.z - h)).normalize();
    const e2 = e1.clone().cross(gr).normalize(), e3 = e2.clone().cross(e1).normalize(), w = M[5], dep = 0.16;
    const loc = (x, y, z) => { const px = x - mid.x, py = y - mid.y, pz = z - mid.z; return [(px * e1.x + py * e1.y + pz * e1.z) / (L * 1.08), (px * e2.x + py * e2.y + pz * e2.z) / w, (px * e3.x + py * e3.y + pz * e3.z) / dep]; };
    const fn = (x, y, z) => {
      const q = loc(x, y, z), k = Math.pow(Math.pow(Math.abs(q[0]), 2.8) + Math.pow(Math.abs(q[1]), 2.8), 1 / 2.8), reg = (Math.max(k, Math.abs(q[2])) - 1) * Math.min(w, L);
      const body = BA.bodyF(x, y, z), bulge = 0.004 + 0.016 * Math.max(0, 1 - k * k) * Math.min(1, w / 0.07);
      return sd.smax(sd.smax(body - bulge, -(body + 0.035), 0.008), reg, 0.02);
    };
    const pad = 0.05, lo = a.clone().min(b).subScalar(w + pad), hi = a.clone().max(b).addScalar(w + pad);
    const red = lin(TIS.muscle), hiC = lin(TIS.muscleHi), deep = lin(TIS.muscleDeep), ten = lin(TIS.tendon), abs = M[0] === "abs";
    return BA.mesh(fn, [lo.x, lo.y, lo.z, hi.x, hi.y, hi.z], Math.max(0.0105, Math.min(0.014, w * 0.16)), {
      color: (x, y, z) => { const q = loc(x, y, z), k = Math.hypot(q[0], q[1]); let c = mix3(hiC, red, sstep(0.0, 0.7, k)); c = mix3(c, deep, sstep(0.75, 1.0, Math.abs(q[1])) * 0.7); c = mix3(c, ten, sstep(0.68, 0.96, Math.abs(q[0])));
        if (abs) { const band = Math.min(Math.abs(q[0] + 0.5), Math.abs(q[0] + 0.12), Math.abs(q[0] - 0.24)); c = mix3(c, ten, (1 - sstep(0.012, 0.04, band)) * 0.9); c = mix3(c, ten, 1 - sstep(0.0, 0.016, Math.abs(x) - 0.004)); }
        return c; },
      uv: (x, y, z) => { const q = loc(x, y, z); return [q[1] * w * 30, q[0]]; },
    });
  });
  /* returns { group, parts } with one pickable part per muscle (left and right together) */
  BA.muscles = () => {
    const T3 = T(), group = new T3.Group(), parts = {};
    BA.MUSCLES.forEach((M) => {
      const geo = BA.muscleGeo(M), mk = () => new T3.Mesh(geo, BA.mat.muscle(1));
      const r = mk(), l = mk(); l.scale.x = -1; [r, l].forEach((m) => { m.userData.part = M[0]; group.add(m); });
      parts[M[0]] = { id: M[0], name: M[1], info: M[2], meshes: [r, l], anchor: V((M[3][0] + M[4][0]) / 2, (M[3][1] + M[4][1]) / 2, (M[3][2] + M[4][2]) / 2 + (M[3][2] + M[4][2] > 0 ? 0.06 : -0.06)) };
    });
    /* Achilles tendon */
    const ach = [-1, 1].map((s) => BA.tube(BA.curve([[s * 0.2, 0.4, -0.115], [s * 0.2, 0.2, -0.085], [s * 0.2, 0.07, -0.075]]), 0.016, BA.mat.matte(TIS.tendon, { roughness: 0.5 }), { seg: 10, rs: 8 }));
    ach.forEach((m) => { m.userData.part = "calf"; group.add(m); parts.calf.meshes.push(m); });
    return { group, parts };
  };
  /* pale under-layer (fascia and bone) shown beneath the muscles */
  BA.fasciaGeo = () => BA.cached("fascia", () => BA.mesh((x, y, z) => BA.bodyF(x, y, z) + 0.006, [-0.86, -0.03, -0.34, 0.86, 3.46, 0.36], 0.026));
})();
