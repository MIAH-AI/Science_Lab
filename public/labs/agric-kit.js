/* agric-kit.js — Agricultural Science toolkit on top of maths-kit (MK), bio-kit (BK) and geo-kit (GK).
   Part 1: assets, environment, scene wrappers (explainer with voice, experiment readouts), geometry merging,
   ground and the procedural crop / plant library (27 crops + pasture, weeds, ornamentals, trees).
   Skies and photographic textures: Poly Haven and ambientCG (CC0), in assets/agric (shared ones in assets/geo).
   THREE loads on demand, so it is only touched inside functions. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, GK = window.GK;
  const T = () => window.THREE;
  const AK = (window.AK = {});
  AK.BASE = MK.base + "assets/agric/";
  /* agric-only texture sets and skies (the rest are shared with the Geography bundle) */
  ["Bark001", "Bark004", "Bark012", "Clay005", "Fabric030", "Fabric084", "Grass001", "Ground054", "Ground103", "Ground109", "Leaf001", "Leaf003", "Metal049A", "Net001A", "Net002A", "Net003A", "ThatchedRoof001A", "Wicker004", "brown_mud", "brown_mud_02", "brown_mud_dry", "clay_block_wall", "concrete_floor_worn_001", "corrugated_iron_02", "farm_furrows", "farm_soil", "forest_ground_04", "leafy_grass", "raked_dirt", "rusty_corrugated_iron", "rusty_metal", "sparse_grass", "withered_grass", "wood_planks_dirt", "wood_table_worn"].forEach((id) => (GK.TEXBASE[id] = AK.BASE));
  ["aloe_farm_shade_house", "approaching_storm", "belfast_farmhouse", "citrus_orchard", "dam_road", "dry_field", "farm_field", "farmland_overcast", "harvest", "hay_bales", "mealie_road", "mpumalanga_veld", "nature_reserve_forest", "near_the_river_01", "outdoor_workshop", "overcast_soil", "parched_canal", "residential_garden", "river_walk_1", "rolling_hills", "rural_crossroads", "straw_rolls_field_01", "sunflowers", "symmetrical_garden", "waterkloof_farm", "wildflower_field"].forEach((n) => (GK.HDRX[n] = AK.BASE));
  fetch(AK.BASE + "textures/index.json").then((r) => (r.ok ? r.json() : {})).then((d) => GK.texReady.then(() => Object.assign(GK.TEX, d))).catch(() => {});

  const V3 = (x, y, z) => new (T().Vector3)(x, y, z);
  AK.V3 = V3;
  const hexs = (h) => "#" + (h >>> 0).toString(16).padStart(6, "0");
  AK.rng = BK.rng;
  const cache = {};
  const once = (k, f) => cache[k] || (cache[k] = f());

  /* ---------- materials ---------- */
  AK.pbr = (id, o = {}) => once("pbr" + id + JSON.stringify(o), () => GK.pbr(id, o));
  AK.std = (col, o = {}) => once("std" + col + JSON.stringify(o), () => new (T().MeshStandardMaterial)(Object.assign({ color: col, roughness: 0.75 }, o)));
  AK.phys = (col, o = {}) => once("phy" + col + JSON.stringify(o), () => new (T().MeshPhysicalMaterial)(Object.assign({ color: col, roughness: 0.5 }, o)));
  AK.leafMat = (col = "#4a8a34", vein = "#a8d47e", o = {}) => once("leaf" + col + vein + JSON.stringify(o), () => new (T().MeshStandardMaterial)(Object.assign({ map: BK.leafTex(col, vein), roughness: 0.62, side: T().DoubleSide }, o)));
  AK.wood = () => AK.pbr("wood_table_worn", { repeat: 0.5 });
  AK.metal = (col = 0x9aa0a6) => once("metal" + col, () => GK.pbr("rusty_metal", { color: col, repeat: 0.6, metal: true, roughness: 0.6 }));
  AK.paint = (col, rough = 0.42) => AK.phys(col, { roughness: rough, clearcoat: 0.6, clearcoatRoughness: 0.35 });
  AK.rubber = () => AK.std(0x1c1c1e, { roughness: 0.9 });
  AK.glass = () => AK.phys(0xcfe6ff, { roughness: 0.05, transmission: 0.9, transparent: true, opacity: 0.35, depthWrite: false });
  AK.glow = (col, op = 0.75) => BK.mat.glow(col, op);

  /* ---------- environment presets (real-sky HDRI lighting through GK) ---------- */
  AK.env = (hdri = "farm_field", o = {}) => Object.assign({ hdri, bg: "hdri", blur: 0, exposure: 0.8, fog: false, shadowExtent: 9, sunPos: [9, 14, 6], hemi: 0.3 }, o);
  AK.STUDIO = AK.env("outdoor_workshop", { blur: 0.55, bgI: 0.7, exposure: 0.9, shadowExtent: 4 });
  AK.LAB = AK.env("outdoor_workshop", { blur: 0.75, bgI: 0.5, exposure: 0.95, shadowExtent: 4 });

  /* ---------- speech for explainers (device voice; can be muted) ---------- */
  AK.voice = true;
  AK.say = (txt) => { try { if (!AK.voice || !window.speechSynthesis || !txt) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(txt).replace(/[₦]/g, "naira ").replace(/\s+/g, " ")); u.rate = 1.02; u.lang = "en-GB"; speechSynthesis.speak(u); } catch (e) { /* no speech on this device */ } };
  AK.hush = () => { try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) { } };
  const VOICE_ACT = { label: "🔊 Voice on/off", run: () => { AK.voice = !AK.voice; if (!AK.voice) AK.hush(); } };
  function addVoice(key) {
    const sc = MK.scenes[key]; if (!sc) return;
    const up = sc.update; sc.update = (S, s, c, dt) => { up && up(S, s, c, dt); const st = s._story; if (st && st.on && st.i >= 0 && st.i !== s._said) { s._said = st.i; AK.say(st.steps[st.i].cap); } if (st && !st.on && s._said != null) { s._said = null; AK.hush(); } };
    sc.actions = (sc.actions || []).concat([VOICE_ACT]);
  }
  /* attach experiment extras (readouts, worked steps, tasks, table) that GK.tour does not pass through */
  function extras(key, o) {
    const sc = MK.scenes[key]; if (!sc) return;
    ["readouts", "steps", "table", "tasks", "note", "mistake"].forEach((k) => { if (o[k]) sc[k] = o[k]; });
    addVoice(key);
  }

  /* ---------- scene wrappers ----------
     AK.tour(key, o): GK.tour diorama + farm sky + voice + experiment readouts.
       o: GK.tour options plus {sky:'farm_field', vars:[slider controls], readouts(s,c), steps(s,c), tasks:[..], rebuildOn(c)} */
  AK.tour = (key, o) => {
    const vars = (o.vars || []).map((v) => Object.assign({ type: "range" }, v));
    const values = Object.assign({}, o.values || {}); vars.forEach((v) => { if (values[v.key] == null) values[v.key] = v.value != null ? v.value : v.min; });
    const ctl = o.controls;
    GK.tour(key, Object.assign({}, o, { envOpts: o.envOpts || AK.env(o.sky || "farm_field", o.envX || {}), cam: o.cam || [[0, 5.2, 9.5], [0, 0.4, 0]], values, controls: (c) => vars.concat(typeof ctl === "function" ? ctl(c) : ctl || []) }));
    extras(key, o);
  };
  /* AK.def3d(key, sc): free-form 3D scene (labels, hud, story as in GK.def3d) with farm defaults */
  AK.def3d = (key, sc) => {
    const vars = (sc.vars || []).map((v) => Object.assign({ type: "range" }, v));
    const values = Object.assign({}, sc.values || {}); vars.forEach((v) => { if (values[v.key] == null) values[v.key] = v.value != null ? v.value : v.min; });
    const ctl = sc.controls;
    GK.def3d(key, Object.assign({ envOpts: AK.env(sc.sky || "farm_field", sc.envX || {}), cam: [[0, 5, 9], [0, 0.4, 0]] }, sc, { values, controls: vars.length || ctl ? (c) => vars.concat(typeof ctl === "function" ? ctl(c) : ctl || []) : undefined }));
    extras(key, sc);
  };

  /* AK.def2d(key, o): interactive 2D board (graphs, calculators, lab benches) with a narrated explainer.
     o: {title, blurb, values, vars, controls, draw(g,s,c,B,H), tick, readouts, steps, table, tasks, story:[{cap, set, tween, d}] | story(c)} */
  AK.def2d = (key, o) => {
    const vars = (o.vars || []).map((v) => Object.assign({ type: "range" }, v));
    const values = Object.assign({}, o.values || {}); vars.forEach((v) => { if (values[v.key] == null) values[v.key] = v.value != null ? v.value : v.min; });
    const ctl = o.controls;
    const sc = Object.assign({ kind: "2d", label: o.label || "Interactive simulation" }, o, { values, controls: (c) => vars.concat(typeof ctl === "function" ? ctl(c) : ctl || []) });
    if (o.label) sc.title = o.label; // short pill on the board; the panel header already shows the full title
    const draw = o.draw, tick = o.tick;
    /* side cards: AK.side(B, title, lines) puts explanation cards in the HUD (drawn on the right when wide, as text under the board on phones) */
    sc.draw = (g, s, c, B, H) => { B._side = []; draw && draw(g, s, c, B, H); s._side = B._side; story2dDraw(g, s, B); };
    if (!o.hud) sc.hud = (s, c) => s._side || [];
    if (o.story) {
      sc.actions = [{ label: "▶ Watch explainer", run: (s, c, H) => { if (s._st && s._st.on) { s._st.on = false; AK.hush(); return; } const steps = typeof o.story === "function" ? o.story(c, s) : o.story; s._st = { on: true, i: -1, t: 0, steps, H }; H.playing = true; H.paintPlay && H.paintPlay(); } }].concat(o.actions || [], [VOICE_ACT]);
    }
    sc.tick = (dt, s, c, H) => { let more = tick ? tick(dt, s, c, H) : false; if (s._st && s._st.on) { story2dTick(s, c, dt, H); more = true; } return more; };
    if (!tick && !o.story) delete sc.tick;
    MK.def(key, sc);
  };
  AK.side = (B, title, lines) => { (B._side || (B._side = [])).push({ title, lines }); return 0; };
  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  function story2dTick(s, c, dt, H) {
    const st = s._st; st.t += dt;
    if (st.i < 0 || st.t >= (st.steps[st.i].d || 5)) {
      st.i++; st.t = 0;
      if (st.i >= st.steps.length) { st.on = false; AK.hush(); H.refresh && H.refresh(); return; }
      const step = st.steps[st.i]; if (step.set) { Object.assign(c, step.set); H.refresh && H.refresh(); }
      AK.say(step.cap);
    }
    const step = st.steps[st.i], u = Math.min(1, st.t / (step.d || 5));
    if (step.tween) { Object.entries(step.tween).forEach(([k, [a, b]]) => { c[k] = a + (b - a) * ease(u); }); H.refresh && H.refresh(); H.side && H.side(); }
  }
  function story2dDraw(g, s, B) {
    const st = s._st; if (!st || !st.on || st.i < 0) return;
    const step = st.steps[st.i], W = B.W, h = 54, y = B.H - h - 8, x = 10, w = W - 20;
    g.save(); g.fillStyle = "rgba(8,12,22,.86)"; g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, 10) : g.rect(x, y, w, h); g.fill();
    g.fillStyle = "#ffd27a"; g.font = "700 10px 'IBM Plex Sans',sans-serif"; g.fillText(`▶ EXPLAINER  ${st.i + 1} / ${st.steps.length}${step.title ? "  ·  " + step.title.toUpperCase() : ""}`, x + 12, y + 15);
    g.fillStyle = "#eef4ff"; g.font = "500 12px 'IBM Plex Sans',sans-serif";
    const words = String(step.cap || "").split(" "); let line = "", ly = y + 31;
    words.forEach((wd) => { const tl = line ? line + " " + wd : wd; if (g.measureText(tl).width > w - 24) { g.fillText(line, x + 12, ly); ly += 15; line = wd; } else line = tl; }); if (line) g.fillText(line, x + 12, ly);
    const tot = st.steps.reduce((a, b) => a + (b.d || 5), 0), done = st.steps.slice(0, st.i).reduce((a, b) => a + (b.d || 5), 0) + Math.min(1, st.t / (step.d || 5)) * (step.d || 5);
    g.fillStyle = "rgba(255,255,255,.15)"; g.fillRect(x + 10, y + h - 6, w - 20, 2.5); g.fillStyle = "#ffd27a"; g.fillRect(x + 10, y + h - 6, (w - 20) * done / tot, 2.5); g.restore();
  }

  /* ---------- geometry merging (one draw call per material) ---------- */
  AK.merge = (grp) => {
    const T3 = T(); grp.updateMatrixWorld(true); const inv = grp.matrixWorld.clone().invert(), by = new Map();
    grp.traverse((m) => {
      if (!m.isMesh || m.isInstancedMesh) return;
      const g0 = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g0.applyMatrix4(new T3.Matrix4().multiplyMatrices(inv, m.matrixWorld));
      const k = m.material.uuid; if (!by.has(k)) by.set(k, { mat: m.material, gs: [] }); by.get(k).gs.push(g0);
    });
    return [...by.values()].map(({ mat, gs }) => {
      const n = gs.reduce((a, g) => a + g.attributes.position.count, 0), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
      gs.forEach((g) => { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); o += c; g.dispose(); });
      const geo = new T3.BufferGeometry(); geo.setAttribute("position", new T3.BufferAttribute(pos, 3)); geo.setAttribute("normal", new T3.BufferAttribute(nor, 3)); geo.setAttribute("uv", new T3.BufferAttribute(uv, 2));
      return { geo, mat };
    });
  };
  AK.mergedMesh = (grp) => { const T3 = T(), out = new T3.Group(); AK.merge(grp).forEach(({ geo, mat }) => { const m = new T3.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; out.add(m); }); return out; };
  /* many copies of one object as instanced meshes. pts: [[x,y,z,scale,rotY]] */
  AK.instances = (g, proto, pts) => {
    const T3 = T(); if (!pts.length) return; const parts = AK.merge(proto), m4 = new T3.Matrix4(), q = new T3.Quaternion(), up = V3(0, 1, 0);
    parts.forEach(({ geo, mat }) => { const im = new T3.InstancedMesh(geo, mat, pts.length); pts.forEach(([x, y, z, s = 1, r], i) => { q.setFromAxisAngle(up, r == null ? (x * 12.9898 + z * 78.233) % 6.283 : r); m4.compose(V3(x, y, z), q, V3(s, s, s)); im.setMatrixAt(i, m4); }); im.castShadow = true; im.receiveShadow = true; g.add(im); });
  };

  /* ---------- ground ---------- */
  /* farm ground: gentle relief, soil / grass colours, photographic ground detail. Returns h(x,z). */
  AK.SOILCOL = { loam: 0x6b4a32, laterite: 0x8a4a2e, sand: 0xc8a272, clay: 0x7a5a44, dark: 0x3e2c20, grass: 0x5c7d34, dry: 0x9a8a56 };
  AK.ground = (g, o = {}) => {
    const w = o.w || 12, d = o.d || 9, amp = o.amp == null ? 0.12 : o.amp, seed = o.seed || 3;
    const h = o.h || ((x, z) => amp * (BK.fbm(x * 0.25 + seed, z * 0.25, seed) - 0.5) * 2 + (o.slope || 0) * z);
    const soil = GK.hex3(typeof o.soil === "number" ? o.soil : AK.SOILCOL[o.soil || "loam"] || AK.SOILCOL.loam), grass = GK.hex3(o.grassCol || AK.SOILCOL.grass);
    const tint = o.tint || ((hn, sl, x, z) => { const n = BK.fbm(x * 0.6 + 2, z * 0.6, 4.4); const k = o.fieldFn ? o.fieldFn(x, z) : 0; return GK.mix3(GK.mix3(grass, GK.hex3(0x7a8a40), n * 0.6), soil, Math.max(0, Math.min(1, k + (n - 0.5) * 0.25))); });
    const t = GK.terrain({ w, d, nx: o.nx || 150, h, tint, ground: o.tex || "farm_soil", groundRepeat: o.rep || Math.round(w * 0.8) });
    g.add(t);
    if (o.apron !== false) { const T3 = T(), ap = new T3.Mesh(new T3.RingGeometry(Math.max(0.5, Math.min(w, d) / 2 - 0.1), 70, 64, 1), /* ring: never covers hollows (ponds, pits) in the terrain */ GK.groundDetail(new T3.MeshStandardMaterial({ color: o.apronCol || 0x8a9058, roughness: 0.97 }), o.apronTex || "leafy_grass", 90, 1.0)); ap.rotation.x = -Math.PI / 2; ap.position.y = (o.apronY == null ? -0.06 : o.apronY); ap.receiveShadow = true; g.add(ap); }
    return h;
  };
  /* tilled field strip mask helper: rows along x with ridge profile, returns 0..1 soil fraction */
  AK.rowsMask = (x0, x1, z0, z1) => (x, z) => (x > x0 && x < x1 && z > z0 && z < z1 ? 1 : 0);
  AK.ridges = (base, x0, x1, z0, z1, pitch = 0.75, hgt = 0.12, along = "x") => (x, z) => { const inside = x > x0 && x < x1 && z > z0 && z < z1; const v = along === "x" ? z : x; return base(x, z) + (inside ? hgt * (0.5 + 0.5 * Math.cos((v / pitch) * 2 * Math.PI)) : 0); };

  /* ---------- plant library ----------
     form: grass | herb | shrub | tree | palm | banana | rosette | vine | creeper
     stage 0..1: seedling → vegetative → flowering (0.55) → fruiting (0.75) → mature */
  const PL = {
    maize: { f: "grass", h: 2.1, n: 12, ll: 0.85, lw: 0.085, lc: "#4f8a2e", r: 0.022, head: "tassel", cob: 1 },
    sorghum: { f: "grass", h: 2.3, n: 10, ll: 0.75, lw: 0.075, lc: "#5a8a34", r: 0.02, head: "panicle", hc: 0x8e3e22 },
    millet: { f: "grass", h: 2.1, n: 9, ll: 0.65, lw: 0.05, lc: "#6a9a3a", r: 0.016, head: "spike", hc: 0x9a8f62 },
    rice: { f: "grass", till: 9, h: 0.95, n: 4, ll: 0.55, lw: 0.02, lc: "#6aa83a", r: 0.006, head: "droop", hc: 0xd8c070 },
    sugarcane: { f: "grass", till: 4, h: 3.0, n: 10, ll: 1.05, lw: 0.06, lc: "#5a9a3a", r: 0.03, sc: 0x9a8a4a, joints: 1 },
    grass: { f: "grass", till: 12, h: 0.65, n: 3, ll: 0.45, lw: 0.014, lc: "#6a9a3a", r: 0.004, head: "spike", hc: 0xb0a070 },
    guinea: { f: "grass", till: 10, h: 1.7, n: 4, ll: 0.8, lw: 0.03, lc: "#5e9436", r: 0.008, head: "panicle", hc: 0xa08a5a },
    elephant: { f: "grass", till: 7, h: 2.6, n: 7, ll: 1.0, lw: 0.05, lc: "#4f8a30", r: 0.016, head: "spike", hc: 0x9a7a4a },
    speargrass: { f: "grass", till: 14, h: 0.8, n: 2, ll: 0.7, lw: 0.012, lc: "#8aa04a", r: 0.003, head: "plume", hc: 0xf2efe6 },
    nutgrass: { f: "grass", till: 6, h: 0.35, n: 4, ll: 0.3, lw: 0.01, lc: "#5a9a3a", r: 0.003, head: "umbel", hc: 0x7a4a2a },
    onion: { f: "grass", till: 1, h: 0.45, n: 7, ll: 0.42, lw: 0.022, lc: "#5c8f55", r: 0.01, bulb: 0xc8a050, tube: 1 },
    ginger: { f: "grass", till: 4, h: 0.85, n: 9, ll: 0.2, lw: 0.035, lc: "#4f9a3a", r: 0.008, rhizome: 1, leafy: 1 },
    cowpea: { f: "herb", h: 0.55, n: 12, leaf: "tri", ls: 0.12, lc: "#4a8a34", fruit: "pod", fc: 0x9aaa58, fl: 0xd8c8f0, spread: 0.45 },
    soya: { f: "herb", h: 0.75, n: 14, leaf: "tri", ls: 0.09, lc: "#4f8a30", fruit: "podS", fc: 0x8a8a4a, fl: 0xb08ad0, spread: 0.25 },
    pigeonpea: { f: "shrub", h: 1.8, stems: 3, n: 26, leaf: "tri", ls: 0.08, lc: "#4a7a34", fruit: "podS", fc: 0x6a5a3a, fl: 0xf0c020 },
    groundnut: { f: "herb", h: 0.32, n: 16, leaf: "quad", ls: 0.06, lc: "#3f8a34", fl: 0xf2c21a, spread: 0.4, nuts: 1 },
    tomato: { f: "herb", h: 0.9, n: 12, leaf: "pinnate", ls: 0.1, lc: "#3f7a30", fruit: "berry", fc: 0xd8321e, fl: 0xf2d21a, spread: 0.35 },
    okra: { f: "herb", h: 1.5, n: 10, leaf: "palm5", ls: 0.16, lc: "#4f8a34", fruit: "okra", fc: 0x7aa040, fl: 0xf2e080 },
    amaranth: { f: "herb", h: 1.0, n: 16, leaf: "ovate", ls: 0.11, lc: "#4a8a30", fruit: "plume", fc: 0x9a2a4a },
    pepper: { f: "herb", h: 0.7, n: 18, leaf: "ovate", ls: 0.07, lc: "#2f6a2a", fruit: "pepper", fc: 0xc81e14, fl: 0xf4f4f0 },
    cotton: { f: "herb", h: 1.3, n: 14, leaf: "palm5", ls: 0.12, lc: "#3f7a34", fruit: "boll", fc: 0xf6f4ee, fl: 0xf2e6a0 },
    sunflower: { f: "herb", h: 1.9, n: 12, leaf: "heart", ls: 0.18, lc: "#4a8a30", fruit: "sunhead", fc: 0xf2b21a },
    jute: { f: "herb", h: 2.2, n: 14, leaf: "ovate", ls: 0.09, lc: "#4a8a34", fl: 0xf2d21a },
    weed: { f: "herb", h: 0.5, n: 10, leaf: "ovate", ls: 0.06, lc: "#5a9a3a", fl: 0xb090e0, spread: 0.2 },
    siam: { f: "shrub", h: 1.6, stems: 4, n: 30, leaf: "ovate", ls: 0.08, lc: "#4a8a34", fl: 0xd8c8f0 },
    tridax: { f: "herb", h: 0.3, n: 8, leaf: "ovate", ls: 0.05, lc: "#5a8a34", fl: 0xf2e6a0, spread: 0.3 },
    periwinkle: { f: "herb", h: 0.4, n: 18, leaf: "ovate", ls: 0.06, lc: "#2f6a2a", fl: 0xf06aa8, gloss: 1, spread: 0.2 },
    stylo: { f: "herb", h: 0.7, n: 18, leaf: "tri", ls: 0.04, lc: "#4a7a30", fl: 0xf2c21a, spread: 0.3 },
    centro: { f: "creeper", h: 0.25, n: 24, leaf: "tri", ls: 0.06, lc: "#3f7a34", fl: 0xc8a8f0 },
    sweetpotato: { f: "creeper", h: 0.25, n: 26, leaf: "heart", ls: 0.08, lc: "#3f7a34", tuber: "sweet" },
    cassava: { f: "shrub", h: 1.9, stems: 3, n: 14, leaf: "palm7", ls: 0.17, lc: "#3f7a34", pet: 0xa0303a, tuber: "cassava" },
    coffee: { f: "shrub", h: 2.0, stems: 2, n: 30, leaf: "ovate", ls: 0.1, lc: "#1f5a2a", gloss: 1, fruit: "cherry", fc: 0xb81e1e },
    tea: { f: "shrub", h: 1.0, stems: 5, n: 40, leaf: "ovate", ls: 0.06, lc: "#2f6a2a", gloss: 1, flat: 1 },
    hibiscus: { f: "shrub", h: 1.6, stems: 3, n: 30, leaf: "ovate", ls: 0.08, lc: "#2f6a2a", gloss: 1, fl: 0xd81e2a, flBig: 1 },
    ixora: { f: "shrub", h: 1.1, stems: 4, n: 34, leaf: "ovate", ls: 0.07, lc: "#2f5a2a", gloss: 1, fl: 0xe8401e, flCluster: 1 },
    croton: { f: "shrub", h: 1.2, stems: 3, n: 26, leaf: "ovate", ls: 0.11, lc: "#c8a020", vein: "#b02a1e", gloss: 1 },
    bougainvillea: { f: "shrub", h: 1.8, stems: 4, n: 34, leaf: "ovate", ls: 0.06, lc: "#3f7a30", fl: 0xc0208a, flCluster: 1 },
    duranta: { f: "shrub", h: 1.2, stems: 6, n: 50, leaf: "ovate", ls: 0.04, lc: "#8ab830", flat: 1 },
    citrus: { f: "tree", h: 3.2, crown: 1.3, leaf: "ovate", ls: 0.08, lc: "#2a6a2a", gloss: 1, fruit: "orange", fc: 0xf28a12, dense: 1 },
    cocoa: { f: "tree", h: 4.0, crown: 1.6, leaf: "ovate", ls: 0.22, lc: "#3f6a2a", fruit: "cocoapod", fc: 0xd89a1a, trunkFruit: 1 },
    rubber: { f: "tree", h: 7.5, crown: 2.0, leaf: "tri", ls: 0.12, lc: "#3a6a2a", tap: 1 },
    shea: { f: "tree", h: 6.0, crown: 2.2, leaf: "ovate", ls: 0.14, lc: "#3f6a2a", fruit: "drupe", fc: 0x7a8a3a },
    mango: { f: "tree", h: 6.0, crown: 2.6, leaf: "ovate", ls: 0.16, lc: "#2a5a24", fruit: "drupe", fc: 0xd8a020, dense: 1 },
    teak: { f: "tree", h: 9.0, crown: 2.2, leaf: "ovate", ls: 0.32, lc: "#5a7a30", tall: 1 },
    gmelina: { f: "tree", h: 8.0, crown: 2.4, leaf: "heart", ls: 0.18, lc: "#3f7a2a", tall: 1 },
    leucaena: { f: "tree", h: 4.0, crown: 1.4, leaf: "feather", ls: 0.12, lc: "#4a7a2a", fl: 0xf4f0e6 },
    gliricidia: { f: "tree", h: 4.5, crown: 1.5, leaf: "feather", ls: 0.12, lc: "#3f7a2a", fl: 0xf0a0c0 },
    iroko: { f: "tree", h: 10, crown: 3.0, leaf: "ovate", ls: 0.12, lc: "#2a5a24", tall: 1 },
    oilpalm: { f: "palm", h: 6.5, fronds: 22, fl: 4.2, lc: "#3f6a2a", bunch: 0xc0301a },
    coconut: { f: "palm", h: 8, fronds: 18, fl: 4.0, lc: "#4a7a2a", bunch: 0x6a7a2a, lean: 0.12 },
    banana: { f: "banana", h: 3.0, n: 9, lc: "#4a8a34", bunch: 0x8ab030 },
    pineapple: { f: "rosette", h: 0.9, n: 36, ll: 0.7, lw: 0.035, lc: "#6a8a6a", fruit: "pine", spiky: 1 },
    sisal: { f: "rosette", h: 1.3, n: 26, ll: 1.1, lw: 0.08, lc: "#5a8a7a", spiky: 1 },
    yam: { f: "vine", h: 2.2, n: 40, leaf: "heart", ls: 0.08, lc: "#3f7a34", tuber: "yam" },
  };
  AK.PLANTS = PL;
  const tiltTo = (obj, from, to) => { const d = to.clone().sub(from); obj.position.copy(from); obj.quaternion.setFromUnitVectors(V3(0, 1, 0), d.clone().normalize()); return d.length(); };
  /* light leaf geometry (2 × 5 segments) — fields hold thousands of leaves, so keep each one cheap */
  AK.leafGeo = (len = 1, wid = 0.4, droop = 0.25, seg = 5) => { const g = new (T().PlaneGeometry)(wid, len, 2, seg), p = g.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i) + len / 2; const t = y / len, w = Math.sin(Math.PI * Math.min(1, t * 1.05)) * (1 - t * 0.25); x *= w; const z = -droop * t * t * len + Math.abs(x) * 0.25; p.setXYZ(i, x, y, z); } g.computeVertexNormals(); return g; };
  const leafOf = (spec, L, W, droop) => { const T3 = T(), m = new T3.Mesh(AK.leafGeo(L, W, droop), AK.leafMat(spec.lc, spec.vein || "#a8d47e", spec.gloss ? { roughness: 0.35 } : {})); return m; };
  /* a leaf of the given type at the end of a petiole, pointing outward along +z of its pivot */
  function leafUnit(spec, size, rnd) {
    const T3 = T(), g = new T3.Group(), t = spec.leaf || "ovate";
    const one = (L, W, ry, rx) => { const p = new T3.Group(), m = leafOf(spec, L, W, 0.22); m.rotation.x = -Math.PI / 2 + (rx || 0.35); p.rotation.y = ry; p.add(m); g.add(p); };
    if (t === "tri") { one(size, size * 0.6, 0); one(size * 0.85, size * 0.55, 1.0); one(size * 0.85, size * 0.55, -1.0); }
    else if (t === "quad") { [0.5, -0.5, 2.0, -2.0].forEach((a) => one(size, size * 0.6, a)); }
    else if (t === "palm5" || t === "palm7") { const k = t === "palm5" ? 5 : 7, sp = t === "palm5" ? 0.5 : 0.42; for (let i = 0; i < k; i++) { const a = (i - (k - 1) / 2) * sp; one(size * (1 - Math.abs(a) * 0.35), size * (t === "palm7" ? 0.22 : 0.4), a); } }
    else if (t === "pinnate" || t === "feather") { const k = t === "feather" ? 9 : 5; for (let i = 0; i < k; i++) { const z = (i / k) * size * 1.6; [-1, 1].forEach((sd) => { const p = new T3.Group(), m = leafOf(spec, size * (t === "feather" ? 0.35 : 0.55), size * (t === "feather" ? 0.12 : 0.32), 0.15); m.rotation.x = -Math.PI / 2; m.rotation.z = sd * 1.2; p.position.z = z; p.add(m); g.add(p); }); } one(size * 0.6, size * 0.35, 0, 0.2); g.children[g.children.length - 1].position.z = size * 1.6; }
    else if (t === "heart") { one(size, size * 0.95, 0); }
    else one(size, size * (spec.flat ? 0.5 : 0.45), 0);
    if (spec.pet && size > 0.08) { const pt = new T3.Mesh(new T3.CylinderGeometry(0.004, 0.006, size * 1.2, 5), AK.std(spec.pet)); pt.rotation.x = Math.PI / 2; pt.position.z = -size * 0.6; g.add(pt); g.children.forEach((c) => { if (c !== pt) c.position.z += 0; }); }
    return g;
  }
  function fruitOf(spec, s) {
    const T3 = T(), k = spec.fruit, c = spec.fc;
    if (k === "pod" || k === "podS") { const m = new T3.Mesh(new T3.CapsuleGeometry(0.008 * s, (k === "pod" ? 0.16 : 0.05) * s, 4, 6), AK.phys(c, { roughness: 0.5 })); m.rotation.z = 0.5; return m; }
    if (k === "berry" || k === "orange" || k === "cherry" || k === "drupe") { const r = { berry: 0.035, orange: 0.06, cherry: 0.012, drupe: 0.05 }[k] * s; const m = new T3.Mesh(new T3.SphereGeometry(r, 16, 12), AK.phys(c, { roughness: k === "orange" ? 0.55 : 0.25, clearcoat: 0.6 })); if (k === "drupe") m.scale.set(1, 1.25, 0.9); return m; }
    if (k === "okra") { const m = new T3.Mesh(new T3.ConeGeometry(0.018 * s, 0.14 * s, 5), AK.phys(c, { roughness: 0.45 })); m.rotation.x = Math.PI; return m; }
    if (k === "pepper") { const m = new T3.Mesh(new T3.ConeGeometry(0.016 * s, 0.07 * s, 10), AK.phys(c, { roughness: 0.2, clearcoat: 1 })); m.rotation.x = Math.PI; return m; }
    if (k === "boll") { const g = new T3.Group(); for (let i = 0; i < 4; i++) { const b = new T3.Mesh(new T3.SphereGeometry(0.03 * s, 10, 8), AK.phys(0xf8f6f0, { roughness: 1, sheen: 1 })); b.position.set(Math.cos(i * 1.57) * 0.02 * s, 0.01, Math.sin(i * 1.57) * 0.02 * s); g.add(b); } const cap = new T3.Mesh(new T3.ConeGeometry(0.035 * s, 0.03 * s, 6), AK.std(0x5a4a2a)); cap.position.y = -0.02 * s; g.add(cap); return g; }
    if (k === "sunhead") { const g = new T3.Group(), d = new T3.Mesh(new T3.CylinderGeometry(0.12 * s, 0.1 * s, 0.03, 24), AK.std(0x4a2a12)); g.add(d); for (let i = 0; i < 24; i++) { const p = new T3.Mesh(BK.leafGeo(0.08 * s, 0.03 * s, 0, 4), AK.leafMat("#f2b21a", "#f8d050")); p.rotation.x = -Math.PI / 2; const pv = new T3.Group(); pv.rotation.y = (i / 24) * 6.283; p.position.z = 0.11 * s; pv.add(p); g.add(pv); } g.rotation.x = -1.1; return g; }
    if (k === "plume") { const m = new T3.Mesh(new T3.ConeGeometry(0.04 * s, 0.32 * s, 8), AK.phys(c, { roughness: 0.8 })); return m; }
    if (k === "cocoapod") { const m = new T3.Mesh(new T3.SphereGeometry(0.06 * s, 14, 10), AK.phys(c, { roughness: 0.45 })); m.scale.set(1, 2.1, 1); return m; }
    return new T3.Group();
  }
  const flowerOf = (spec, s) => { const T3 = T(), g = new T3.Group(), n = spec.flBig ? 5 : 5, r = (spec.flBig ? 0.06 : spec.flCluster ? 0.02 : 0.02) * s; for (let i = 0; i < n; i++) { const p = new T3.Mesh(new T3.CircleGeometry(r, 8), AK.phys(spec.fl, { roughness: 0.5, side: T3.DoubleSide })); p.scale.set(0.6, 1, 1); const pv = new T3.Group(); pv.rotation.y = (i / n) * 6.283; p.rotation.x = -1.0; p.position.z = r * 0.8; pv.add(p); g.add(pv); } if (spec.flCluster) { const g2 = new T3.Group(); for (let k = 0; k < 6; k++) { const c = g.clone(); c.position.set((k % 3 - 1) * r * 1.8, Math.floor(k / 3) * r, ((k * 7) % 3 - 1) * r * 1.5); g2.add(c); } return g2; } return g; };
  /* underground organs (shown when the ground is cut away) */
  function tuberOf(spec, s, rnd) {
    const T3 = T(), g = new T3.Group(), k = spec.tuber || (spec.rhizome ? "rhizome" : spec.nuts ? "nuts" : spec.bulb ? "bulb" : null);
    if (k === "cassava") for (let i = 0; i < 6; i++) { const m = new T3.Mesh(new T3.CapsuleGeometry(0.035 * s, 0.45 * s, 4, 8), AK.phys(0x7a4a2a, { roughness: 0.9 })); const a = (i / 6) * 6.283; m.position.set(Math.cos(a) * 0.15 * s, -0.22 * s, Math.sin(a) * 0.15 * s); m.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); g.add(m); }
    if (k === "yam") { const m = new T3.Mesh(new T3.CapsuleGeometry(0.09 * s, 0.4 * s, 6, 12), AK.phys(0x6a4a30, { roughness: 1 })); m.position.y = -0.34 * s; m.scale.set(1.15, 1, 0.9); g.add(m); }
    if (k === "sweet") for (let i = 0; i < 4; i++) { const m = new T3.Mesh(new T3.SphereGeometry(0.05 * s, 12, 10), AK.phys(0xb0503a, { roughness: 0.7 })); m.scale.set(1, 1.8, 1); m.position.set((rnd() - 0.5) * 0.18 * s, -0.12 * s, (rnd() - 0.5) * 0.18 * s); m.rotation.z = rnd() - 0.5; g.add(m); }
    if (k === "rhizome") for (let i = 0; i < 5; i++) { const m = new T3.Mesh(new T3.CapsuleGeometry(0.02 * s, 0.07 * s, 4, 6), AK.phys(0xc8a060, { roughness: 0.8 })); m.position.set(i * 0.05 * s - 0.1 * s, -0.04 * s, (i % 2) * 0.03 * s); m.rotation.z = 1.2 + i * 0.3; g.add(m); }
    if (k === "nuts") for (let i = 0; i < 12; i++) { const m = new T3.Mesh(new T3.CapsuleGeometry(0.012 * s, 0.025 * s, 4, 6), AK.phys(0xc8a878, { roughness: 0.95 })); m.position.set((rnd() - 0.5) * 0.3 * s, -0.05 * s - rnd() * 0.04 * s, (rnd() - 0.5) * 0.3 * s); m.rotation.z = rnd() * 3; g.add(m); }
    if (k === "bulb") { const m = new T3.Mesh(new T3.SphereGeometry(0.045 * s, 16, 12), AK.phys(spec.bulb, { roughness: 0.4, clearcoat: 0.5 })); m.scale.y = 0.8; m.position.y = 0.0; g.add(m); }
    const rootM = AK.std(0xc8b08a, { roughness: 1 });
    for (let i = 0; i < 7; i++) { const a = rnd() * 6.283, L = (0.12 + rnd() * 0.2) * s; const r = new T3.Mesh(new T3.CylinderGeometry(0.002, 0.004, L, 4), rootM); tiltTo(r, V3(0, 0, 0), V3(Math.cos(a) * L * 0.6, -L, Math.sin(a) * L * 0.6)); r.position.multiplyScalar(0); r.translateY(L / 2); g.add(r); }
    return g;
  }

  /* AK.plant(kind, stage, o) → THREE.Group; o: {seed, roots (show underground organs), scale} */
  /* cached merged geometry per plant variant: many scenes rebuild fields often, so build each variant once */
  const PCACHE = {};
  AK.plantParts = (kind, stage = 1, seed = 1, roots = false) => { const k = kind + "|" + Math.round(Math.max(0.05, Math.min(1, stage)) * 20) + "|" + seed + "|" + (roots ? 1 : 0); if (!PCACHE[k]) { const g = AK.plant(kind, Math.round(Math.max(0.05, Math.min(1, stage)) * 20) / 20, { seed, roots, raw: true }); PCACHE[k] = AK.merge(g); PCACHE[k].forEach((p) => (p.geo.userData.keep = true)); g.traverse((m) => { if (m.isMesh) m.geometry.dispose(); }); } return PCACHE[k]; };
  AK.instancesParts = (g, parts, pts) => { const T3 = T(); if (!pts.length) return; const m4 = new T3.Matrix4(), q = new T3.Quaternion(), up = V3(0, 1, 0); parts.forEach(({ geo, mat }) => { const im = new T3.InstancedMesh(geo, mat, pts.length); pts.forEach(([x, y, z, s = 1, r], i) => { q.setFromAxisAngle(up, r == null ? (x * 12.9898 + z * 78.233) % 6.283 : r); m4.compose(V3(x, y, z), q, V3(s, s, s)); im.setMatrixAt(i, m4); }); im.castShadow = true; im.receiveShadow = true; g.add(im); }); };
  AK.plant = (kind, stage = 1, o = {}) => {
    if (!o.raw) { const T3 = T(), st = Math.round(Math.max(0.05, Math.min(1, stage)) * 20) / 20, spec0 = PL[kind] || PL.weed, hasR = o.roots !== false && (spec0.tuber || spec0.rhizome || spec0.nuts || spec0.bulb || o.roots); const out = new T3.Group(); const all = AK.plantParts(kind, st, o.seed || 1, hasR); all.forEach(({ geo, mat }) => { const m = new T3.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; out.add(m); }); if (o.scale) out.scale.setScalar(o.scale); out.userData.kind = kind; return out; }
    const T3 = T(), spec = PL[kind] || PL.weed, g = new T3.Group(), rnd = BK.rng((o.seed || 1) * 97 + kind.length * 13), st = Math.max(0.05, Math.min(1, stage));
    const grow = Math.min(1, 0.15 + st * 1.1), H = spec.h * grow, stemMat = AK.phys(spec.sc || 0x6a9a3c, { roughness: 0.55, sheen: 0.3 });
    const showFr = st >= 0.72, showFl = st >= 0.5 && st < 0.9;
    if (spec.f === "grass") {
      const till = spec.till || 1;
      for (let t = 0; t < till; t++) {
        const a = (t / till) * 6.283 + rnd(), lean = till > 1 ? 0.12 + rnd() * 0.18 : 0.02, h = H * (0.8 + rnd() * 0.3), top = V3(Math.cos(a) * lean * h, h, Math.sin(a) * lean * h);
        const r = spec.r * (0.6 + 0.4 * grow), stem = new T3.Mesh(new T3.CylinderGeometry(r * 0.6, r, 1, 6), stemMat); const L = tiltTo(stem, V3(0, 0, 0), top); stem.scale.y = L; stem.translateY(L / 2); if (!spec.leafy && !spec.tube) g.add(stem);
        const n = Math.max(2, Math.round(spec.n * Math.min(1, 0.3 + st))), ll = spec.ll * (0.5 + 0.5 * grow);
        for (let i = 0; i < n; i++) {
          const f = spec.leafy ? 0.15 + 0.8 * (i / n) : 0.08 + 0.75 * (i / n), p = top.clone().multiplyScalar(f), pv = new T3.Group(); pv.position.copy(p); pv.rotation.y = i * 2.62 + a; const L2 = ll * (spec.tube ? 1 : 1.05 - (i / n) * 0.4);
          const lf = spec.tube ? new T3.Mesh(new T3.CylinderGeometry(spec.lw * 0.3, spec.lw * 0.5, L2, 6), AK.phys(0x5c8f55, { roughness: 0.4 })) : leafOf(spec, L2, spec.lw * (0.6 + 0.4 * grow), spec.leafy ? 0.15 : 0.35);
          if (spec.tube) { lf.position.y = L2 / 2; lf.rotation.z = (rnd() - 0.5) * 0.4; } else lf.rotation.x = -(spec.leafy ? 1.2 : 0.55 + rnd() * 0.35);
          pv.add(lf); g.add(pv);
        }
        if (st > 0.55 && spec.head) {
          const hd = new T3.Group(); hd.position.copy(top); g.add(hd); const hc = spec.hc || 0xc8b070;
          if (spec.head === "tassel") for (let i = 0; i < 7; i++) { const b = new T3.Mesh(new T3.CylinderGeometry(0.003, 0.004, 0.28, 4), AK.std(0xc8b878)); b.rotation.z = (i - 3) * 0.25; b.rotation.x = (i % 2 - 0.5) * 0.4; b.position.y = 0.12; hd.add(b); }
          else if (spec.head === "panicle" || spec.head === "plume") { const m = new T3.Mesh(new T3.SphereGeometry(spec.head === "plume" ? 0.05 : 0.07, 10, 8), AK.phys(hc, { roughness: 0.9 })); m.scale.set(1, 2.6, 1); m.position.y = 0.14; hd.add(m); }
          else if (spec.head === "spike") { const m = new T3.Mesh(new T3.CylinderGeometry(0.018, 0.022, 0.3, 8), AK.phys(hc, { roughness: 0.9 })); m.position.y = 0.16; hd.add(m); }
          else if (spec.head === "droop") { for (let i = 0; i < 5; i++) { const m = new T3.Mesh(new T3.CapsuleGeometry(0.008, 0.16, 3, 5), AK.phys(hc, { roughness: 0.8 })); m.position.set(0.05, -0.03 - i * 0.02, (i - 2) * 0.012); m.rotation.z = 1.9; hd.add(m); } }
          else if (spec.head === "umbel") { for (let i = 0; i < 5; i++) { const m = new T3.Mesh(new T3.SphereGeometry(0.012, 6, 5), AK.std(hc)); m.position.set(Math.cos(i) * 0.03, 0.02, Math.sin(i) * 0.03); hd.add(m); } }
        }
        if (spec.cob && st > 0.7) { const cob = new T3.Group(), hs = new T3.Mesh(new T3.CapsuleGeometry(0.035, 0.16, 6, 10), AK.phys(0x9ab060, { roughness: 0.6 })); cob.add(hs); const silk = new T3.Mesh(new T3.ConeGeometry(0.02, 0.07, 6), AK.std(0x9a5a2a)); silk.position.y = 0.13; cob.add(silk); cob.position.copy(top.clone().multiplyScalar(0.52)); cob.position.x += 0.04; cob.rotation.z = -0.35; g.add(cob); }
        if (spec.joints) for (let j = 1; j < 8; j++) { const ring = new T3.Mesh(new T3.TorusGeometry(spec.r * 1.02, 0.004, 4, 10), AK.std(0x6a5a2a)); ring.position.copy(top.clone().multiplyScalar(j / 8)); ring.rotation.x = Math.PI / 2; g.add(ring); }
      }
    } else if (spec.f === "herb" || spec.f === "shrub" || spec.f === "creeper") {
      const stems = spec.stems || 1, n = Math.max(3, Math.round(spec.n * Math.min(1, 0.25 + st)));
      for (let k = 0; k < stems; k++) {
        const a = (k / stems) * 6.283 + rnd() * 0.5, lean = spec.f === "creeper" ? 1.4 : stems > 1 ? 0.18 : 0.04, sp = spec.spread || 0;
        const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; const y = spec.f === "creeper" ? 0.03 + Math.sin(t * 3.14) * 0.05 : t * H; pts.push(V3(Math.cos(a) * (lean * t * (spec.f === "creeper" ? H * 3 : H) + sp * t * t), y, Math.sin(a) * (lean * t * (spec.f === "creeper" ? H * 3 : H) + sp * t * t))); }
        const curve = new T3.CatmullRomCurve3(pts), stem = new T3.Mesh(new T3.TubeGeometry(curve, 16, (spec.f === "shrub" ? 0.016 : 0.008) * (0.5 + grow), 6), spec.f === "shrub" ? AK.std(0x6a5040, { roughness: 0.9 }) : stemMat); g.add(stem);
        const per = Math.ceil(n / stems);
        for (let i = 0; i < per; i++) {
          const t = 0.18 + 0.8 * (i / per), p = curve.getPoint(t), pv = new T3.Group(); pv.position.copy(p); pv.rotation.y = i * 2.4 + a;
          const lu = leafUnit(spec, spec.ls * (0.55 + 0.45 * grow) * (1.1 - t * 0.3), rnd); lu.rotation.x = spec.f === "creeper" ? -0.1 : -0.25 - rnd() * 0.4; pv.add(lu); g.add(pv);
          if (spec.fruit && showFr && i % 3 === 1) { const f = fruitOf(spec, 1); f.position.copy(p).add(V3(Math.cos(i * 2.4 + a) * 0.04, -0.03, Math.sin(i * 2.4 + a) * 0.04)); g.add(f); }
          if (spec.fl && showFl && i % 4 === 2) { const f = flowerOf(spec, 1); f.position.copy(p).add(V3(Math.cos(i * 2.4 + a) * 0.05, 0.02, Math.sin(i * 2.4 + a) * 0.05)); g.add(f); }
        }
        if (spec.fruit && showFr && (spec.fruit === "sunhead" || spec.fruit === "plume")) { const f = fruitOf(spec, 1); f.position.copy(curve.getPoint(1)); g.add(f); }
      }
    } else if (spec.f === "tree") {
      const tr = new T3.Mesh(new T3.CylinderGeometry(H * 0.03, H * 0.05, H * (spec.tall ? 0.75 : 0.55), 10), AK.pbr(spec.tap ? "Bark012" : "Bark004", { repeat: [1, 2] })); tr.position.y = H * (spec.tall ? 0.375 : 0.275); g.add(tr);
      const cy = H * (spec.tall ? 0.78 : 0.62), cr = spec.crown * grow, nl = (spec.dense ? 90 : 64) * Math.min(1, 0.4 + st);
      const lm = AK.leafMat(spec.lc, "#9ccc7a", spec.gloss ? { roughness: 0.35 } : {});
      const blob = new T3.Mesh(new T3.IcosahedronGeometry(cr * 0.86, 2), AK.std(new T3.Color(spec.lc).multiplyScalar(0.55).getHex(), { roughness: 0.9 })); blob.position.y = cy; blob.scale.y = spec.tall ? 0.7 : 0.8; g.add(blob);
      for (let i = 0; i < nl; i++) { const u = rnd() * 6.283, v = Math.acos(2 * rnd() - 1), rr = cr * (0.85 + rnd() * 0.25); const p = V3(Math.sin(v) * Math.cos(u) * rr, Math.cos(v) * rr * (spec.tall ? 0.7 : 0.8) + cy, Math.sin(v) * Math.sin(u) * rr); const lu = leafUnit(spec, spec.ls * (0.8 + rnd() * 0.4), rnd); lu.position.copy(p); lu.lookAt(p.clone().multiplyScalar(2).sub(V3(0, cy, 0))); g.add(lu); }
      for (let b = 0; b < 4; b++) { const a = b * 1.57 + rnd(), br = new T3.Mesh(new T3.CylinderGeometry(H * 0.012, H * 0.02, 1, 6), tr.material); const L = tiltTo(br, V3(0, cy * 0.7, 0), V3(Math.cos(a) * cr * 0.7, cy + cr * 0.2, Math.sin(a) * cr * 0.7)); br.scale.y = L; br.translateY(L / 2); g.add(br); }
      if (spec.fruit && showFr) for (let i = 0; i < (spec.trunkFruit ? 9 : 22); i++) { const f = fruitOf(spec, spec.trunkFruit ? 1.6 : 1.1); if (spec.trunkFruit) { const a = rnd() * 6.283, y = H * (0.2 + rnd() * 0.35); f.position.set(Math.cos(a) * H * 0.05, y, Math.sin(a) * H * 0.05); } else { const u = rnd() * 6.283, v = Math.acos(2 * rnd() - 1); f.position.set(Math.sin(v) * Math.cos(u) * cr * 0.95, Math.cos(v) * cr * 0.7 + cy, Math.sin(v) * Math.sin(u) * cr * 0.95); } g.add(f); }
      if (spec.fl && showFl) for (let i = 0; i < 18; i++) { const f = flowerOf(spec, 2); const u = rnd() * 6.283; f.position.set(Math.cos(u) * cr, cy + (rnd() - 0.3) * cr * 0.6, Math.sin(u) * cr); g.add(f); }
      if (spec.tap) { const cut = new T3.Mesh(new T3.TorusGeometry(H * 0.052, 0.006, 4, 24, Math.PI), AK.std(0xf4f0e0)); cut.position.y = H * 0.18; cut.rotation.x = Math.PI / 2 + 0.35; g.add(cut); const cup = new T3.Mesh(new T3.CylinderGeometry(0.05, 0.035, 0.06, 12, 1, true), AK.std(0x8a6a4a, { side: T3.DoubleSide })); cup.position.set(H * 0.07, H * 0.1, 0); g.add(cup); }
    } else if (spec.f === "palm") {
      const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(V3((spec.lean || 0) * t * t * H, t * H, 0)); }
      const tr = new T3.Mesh(new T3.TubeGeometry(new T3.CatmullRomCurve3(pts), 12, 0.2 * grow + 0.05, 10), AK.pbr("Bark001", { repeat: [1, 3] })); g.add(tr); const top = pts[8];
      const nf = Math.round(spec.fronds * Math.min(1, 0.4 + st)), lm = AK.leafMat(spec.lc, "#b8d890");
      for (let i = 0; i < nf; i++) { const pv = new T3.Group(); pv.position.copy(top); pv.rotation.y = i * 2.4; const tilt = 0.2 + (i / nf) * 1.4; const fr = new T3.Group(); fr.rotation.x = -tilt; pv.add(fr); const L = spec.fl * grow; const rach = new T3.Mesh(new T3.CylinderGeometry(0.01, 0.025, L, 5), AK.std(0x6a7a3a)); rach.position.y = L / 2; fr.add(rach); for (let k = 2; k < 18; k += 1.5) [-1, 1].forEach((sd) => { const lf = new T3.Mesh(AK.leafGeo(L * 0.22 * (1 - k / 22), 0.05, 0.1, 3), lm); lf.position.y = (k / 18) * L; lf.rotation.z = sd * (1.1 + k * 0.01); lf.rotation.y = Math.PI / 2; fr.add(lf); }); g.add(pv); }
      if (st > 0.7) for (let b = 0; b < 3; b++) { const bu = new T3.Mesh(new T3.IcosahedronGeometry(0.22, 2), AK.phys(spec.bunch, { roughness: 0.5 })); const a = b * 2.1; bu.position.set(top.x + Math.cos(a) * 0.3, top.y - 0.25, top.z + Math.sin(a) * 0.3); g.add(bu); }
    } else if (spec.f === "banana") {
      const ps = new T3.Mesh(new T3.CylinderGeometry(0.11, 0.16, H * 0.6, 12), AK.phys(0x7a9a4a, { roughness: 0.6 })); ps.position.y = H * 0.3; g.add(ps);
      const lm = AK.leafMat(spec.lc, "#c8e0a0"); const nl = Math.round(spec.n * Math.min(1, 0.3 + st));
      for (let i = 0; i < nl; i++) { const pv = new T3.Group(); pv.position.y = H * 0.58; pv.rotation.y = i * 2.4; const lf = new T3.Mesh(AK.leafGeo(H * 0.62, 0.42, 0.55, 8), lm); lf.rotation.x = -0.55 - (i / nl) * 0.6; pv.add(lf); g.add(pv); }
      if (st > 0.72) { const st2 = new T3.Mesh(new T3.CylinderGeometry(0.02, 0.02, 0.6, 6), AK.std(0x6a7a3a)); st2.position.set(0.18, H * 0.48, 0); st2.rotation.z = 0.6; g.add(st2); for (let h = 0; h < 5; h++) for (let k = 0; k < 7; k++) { const f = new T3.Mesh(new T3.CapsuleGeometry(0.022, 0.13, 3, 6), AK.phys(spec.bunch, { roughness: 0.4 })); const a = (k / 7) * 6.283; f.position.set(0.32 + Math.cos(a) * 0.07, H * 0.36 - h * 0.07, Math.sin(a) * 0.07); f.rotation.z = -0.4; g.add(f); } const bud = new T3.Mesh(new T3.ConeGeometry(0.05, 0.16, 10), AK.phys(0x6a1a3a, { roughness: 0.4 })); bud.position.set(0.36, H * 0.36 - 0.42, 0); bud.rotation.x = Math.PI; g.add(bud); }
    } else if (spec.f === "rosette") {
      const lm = AK.phys(new T3.Color(spec.lc).getHex(), { roughness: 0.5, side: T3.DoubleSide });
      const nl = Math.round(spec.n * Math.min(1, 0.4 + st));
      for (let i = 0; i < nl; i++) { const pv = new T3.Group(); pv.rotation.y = i * 2.4; const lf = new T3.Mesh(AK.leafGeo(spec.ll * grow * (0.6 + rnd() * 0.5), spec.lw, 0.25, 4), lm); lf.rotation.x = -0.25 - (i / nl) * 1.0; pv.add(lf); g.add(pv); }
      if (spec.fruit === "pine" && st > 0.7) { const f = new T3.Mesh(new T3.SphereGeometry(0.09, 14, 12), AK.phys(0xc89a2a, { roughness: 0.6, bumpScale: 1 })); f.scale.y = 1.5; f.position.y = 0.42; g.add(f); const cr = new T3.Mesh(new T3.ConeGeometry(0.06, 0.16, 8), AK.std(0x5a7a5a)); cr.position.y = 0.62; g.add(cr); }
    } else if (spec.f === "vine") {
      const stake = new T3.Mesh(new T3.CylinderGeometry(0.02, 0.025, H, 6), AK.wood()); stake.position.y = H / 2 - 0.1; g.add(stake);
      const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(V3(Math.cos(t * 30) * 0.05, t * H * grow, Math.sin(t * 30) * 0.05)); }
      const curve = new T3.CatmullRomCurve3(pts); g.add(new T3.Mesh(new T3.TubeGeometry(curve, 80, 0.005, 4), stemMat));
      for (let i = 0; i < spec.n * grow; i++) { const p = curve.getPoint(0.1 + 0.88 * i / (spec.n * grow)), pv = new T3.Group(); pv.position.copy(p); pv.rotation.y = i * 2.4; const lu = leafUnit(spec, spec.ls, rnd); lu.rotation.x = 0.2; pv.add(lu); g.add(pv); }
      const mound = new T3.Mesh(new T3.SphereGeometry(0.4, 16, 10, 0, 6.283, 0, Math.PI / 2), AK.pbr("farm_soil", { repeat: 0.6 })); mound.scale.y = 0.55; mound.position.y = -0.04; g.add(mound);
    }
    let tb = null;
    if (o.roots !== false && (spec.tuber || spec.rhizome || spec.nuts || spec.bulb || o.roots)) tb = tuberOf(spec, Math.max(0.4, grow) * (spec.f === "tree" ? 2 : 1), rnd);
    if (o.raw) { if (tb) { g.add(tb); g.roots = tb; } BK.shadow(g); return g; }
    const out = AK.mergedMesh(g); g.traverse((m) => { if (m.isMesh) m.geometry.dispose(); });
    if (tb) { const rm = AK.mergedMesh(tb); out.add(rm); out.roots = rm; }
    if (o.scale) out.scale.setScalar(o.scale);
    out.userData.kind = kind; return out;
  };
  /* field of one crop on a grid; o: {x0,x1,z0,z1, dx, dz, stage, h, s (scale), jitter, roots:false, skip(x,z)} */
  AK.field = (g, kind, o = {}) => {
    const pts = [], dx = o.dx || 0.6, dz = o.dz || 0.6, r = BK.rng(o.seed || kind.length), h = o.h || (() => 0);
    for (let x = (o.x0 == null ? -2 : o.x0); x <= (o.x1 == null ? 2 : o.x1) + 1e-6; x += dx) for (let z = (o.z0 == null ? -2 : o.z0); z <= (o.z1 == null ? 2 : o.z1) + 1e-6; z += dz) { const jx = (r() - 0.5) * (o.jitter || 0.08), jz = (r() - 0.5) * (o.jitter || 0.08); if (o.skip && o.skip(x, z)) continue; pts.push([x + jx, h(x + jx, z + jz), z + jz, (o.s || 0.3) * (0.85 + r() * 0.3)]); }
    [0, 1, 2].forEach((k) => AK.instancesParts(g, AK.plantParts(kind, o.stage == null ? 1 : o.stage, k + 1, !!o.roots), pts.filter((_, i) => i % 3 === k)));
    return pts;
  };
  /* border trees: mixed real-looking tree species as instanced, merged plants. pts [[x,y,z,s]] */
  AK.trees = (g, pts, s = 0.4, kinds = ["mango", "iroko", "shea", "oilpalm", "gmelina"]) => { kinds.forEach((k, j) => { const sub = pts.filter((_, i) => i % kinds.length === j).map(([x, y, z, sc]) => [x, y, z, s * (sc || 1) * (k === "iroko" || k === "gmelina" ? 0.7 : 1)]); if (sub.length) AK.instancesParts(g, AK.plantParts(k, 0.9, j + 7, false), sub); }); };
  /* small helper: put one plant at x,z on ground h */
  AK.addm = (g, m) => { g.add(m); return m; }; // add and return the child (Object3D.add returns the parent)
  AK.put = (g, obj, x, z, h, ry = 0, s = 1) => { obj.position.set(x, h ? h(x, z) : 0, z); obj.rotation.y = ry; if (s !== 1) obj.scale.multiplyScalar(s); g.add(obj); return obj; };
})();
