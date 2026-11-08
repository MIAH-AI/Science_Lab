/* geo-kit.js — Geography toolkit on top of maths-kit (MK) and bio-kit (BK).
   - photoreal environments lit by real-sky HDRIs from assets/geo (Poly Haven, CC0)
   - declarative part labels: Names / Numbers (test yourself) / Off
   - "Watch explainer": a narrated, timed walkthrough (captions, camera moves, control tweens) — a video inside the lab
   - terrain, hypsometric tints, contour maps (marching squares), map data loaders (Natural Earth GeoJSON, Earth imagery)
   THREE is loaded on demand, so it is only touched inside functions. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK;
  const T = () => window.THREE;
  const GK = (window.GK = {});
  GK.BASE = MK.base + "assets/geo/";
  GK.tier = (() => { try { const coarse = matchMedia("(pointer: coarse)").matches, mem = navigator.deviceMemory || 4; return (coarse && mem <= 4) || mem <= 2 ? "low" : "med"; } catch (e) { return "med"; } })();
  const HDR_1K = ["noon_grass", "aristea_wreck_puresky", "spruit_sunrise", "rooitou_park", "kiara_1_dawn", "rainforest_trail", "blouberg_sunrise_2", "dikhololo_night"];
  const HDR_LOW = HDR_1K.concat(["forest_slope", "hilly_terrain_01", "immenstadter_horn", "narrow_moonlit_road", "quarry_01", "venice_sunset"]);
  const cache = {};

  /* ---------- loaders ---------- */
  GK.json = (p) => cache["j" + p] || (cache["j" + p] = fetch(GK.BASE + p).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  GK.img = (p) => cache["i" + p] || (cache["i" + p] = new Promise((res) => { const im = new Image(); im.decoding = "async"; im.onload = () => res(im); im.onerror = () => res(null); im.src = GK.BASE + p; }));
  GK.texture = (p, srgb = true, onload) => { const t = new (T().Texture)(); t.colorSpace = srgb ? T().SRGBColorSpace : T().NoColorSpace; t.anisotropy = 8; GK.img(p).then((im) => { if (im) { t.image = im; t.needsUpdate = true; onload && onload(t); } }); return t; };
  GK.hdr = (name) => {
    const useLow = GK.tier === "low" || !HDR_1K.includes(name);
    if (!HDR_LOW.includes(name)) name = "noon_grass";
    const path = useLow ? `hdri-low/${name}_512.hdr` : `hdri/${name}_1k.hdr`;
    /* hosts that cannot serve .hdr files get a tone-mapped PNG of the same sky (lower dynamic range) */
    const ldr = () => GK.img(path.replace(/\.hdr$/, ".png")).then((im) => { if (!im) return null; const t = new (T().Texture)(im); t.mapping = T().EquirectangularReflectionMapping; t.colorSpace = T().SRGBColorSpace; t.needsUpdate = true; t.userData.ldr = true; return t; });
    return cache["h" + path] || (cache["h" + path] = new (T().HDRLoader)().loadAsync(GK.BASE + path).then((t) => { t.mapping = T().EquirectangularReflectionMapping; return t; }).catch(ldr));
  };
  /* pixels of an image, for sampling (elevation, masks) */
  GK.pixels = (p, w) => cache["p" + p + w] || (cache["p" + p + w] = GK.img(p).then((im) => { if (!im) return null; const h = Math.round(w * im.height / im.width), c = BK.cv(w, h), g = c.getContext("2d"); g.drawImage(im, 0, 0, w, h); return { w, h, d: g.getImageData(0, 0, w, h).data }; }));
  GK.sample = (px, u, v) => { if (!px) return 0; const x = Math.max(0, Math.min(px.w - 1, u * (px.w - 1))), y = Math.max(0, Math.min(px.h - 1, v * (px.h - 1))), x0 = x | 0, y0 = y | 0, x1 = Math.min(px.w - 1, x0 + 1), y1 = Math.min(px.h - 1, y0 + 1), fx = x - x0, fy = y - y0, d = px.d, at = (a, b) => d[(b * px.w + a) * 4] / 255; return at(x0, y0) * (1 - fx) * (1 - fy) + at(x1, y0) * fx * (1 - fy) + at(x0, y1) * (1 - fx) * fy + at(x1, y1) * fx * fy; };

  /* ---------- environment: real-sky lighting ---------- */
  MK.envs3d.geo = function (S, o) {
    const T3 = T(), sc = S.scene;
    S.renderer.toneMapping = o.tone === "agx" ? T3.AgXToneMapping : T3.NeutralToneMapping;
    S.renderer.toneMappingExposure = o.exposure || 0.82;
    sc.background = new T3.Color(o.bgColor == null ? 0x9dbad6 : o.bgColor);
    sc.fog = o.fog === false ? null : new T3.Fog(o.fogColor == null ? 0xc3d3e2 : o.fogColor, o.fogNear || 40, o.fogFar || 160);
    const hemi = new T3.HemisphereLight(0xdfeaff, 0x5a4a3a, o.hemi == null ? 0.35 : o.hemi); sc.add(hemi);
    const sun = new T3.DirectionalLight(o.sunColor || 0xfff2df, o.sun == null ? 2.4 : o.sun); const sp = o.sunPos || [8, 12, 6]; sun.position.set(...sp);
    if (o.shadow !== false) { const e = o.shadowExtent || 10; sun.castShadow = true; sun.shadow.mapSize.set(GK.tier === "low" ? 1024 : 2048, GK.tier === "low" ? 1024 : 2048); Object.assign(sun.shadow.camera, { left: -e, right: e, top: e, bottom: -e, near: 0.5, far: 80 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; }
    sc.add(sun); sc.add(sun.target); S.sunLight = sun;
    if (o.sky) {
      const sky = new T3.Sky(); sky.scale.setScalar(450); const u = sky.material.uniforms;
      u.turbidity.value = o.turbidity || 6; u.rayleigh.value = o.rayleigh || 1.6; u.mieCoefficient.value = 0.005; u.mieDirectionalG.value = 0.8;
      u.sunPosition.value.set(...sp).normalize(); sc.add(sky); S.sky = sky;
    }
    sc.environmentIntensity = o.envI == null ? 1 : o.envI;
    GK.hdr(o.hdri || "noon_grass").then((t) => {
      if (!t || window.P3D.S !== S) return;
      sc.environment = S.pm.fromEquirectangular(t).texture; if (t.userData && t.userData.ldr) sc.environmentIntensity *= 1.6;
      if (o.bg === "hdri") { sc.background = t; sc.backgroundBlurriness = o.blur || 0; sc.backgroundIntensity = o.bgI || 1; if (o.fog !== true) sc.fog = null; }
    });
  };
  /* set sun direction for an env built with o.sky (time-of-day scenes) */
  GK.setSun = (S, dir, intensity) => { if (S.sunLight) { S.sunLight.position.copy(dir).multiplyScalar(30); if (intensity != null) S.sunLight.intensity = intensity; } if (S.sky) S.sky.material.uniforms.sunPosition.value.copy(dir).normalize(); };

  /* ---------- labels ---------- */
  const LBL_CTL = { type: "tabs", key: "lbl", label: "Labels", options: [["on", "Names"], ["num", "Numbers — test yourself"], ["off", "Off"]] };
  const NOTE_CTL = { type: "tabs", key: "notes", label: "Notes on screen", options: [["brief", "Key point"], ["full", "Full notes"], ["hide", "Hide"]] };
  function drawLabels(ctx, S, B, list, mode) {
    if (!list || mode === "off") return;
    const placed = [], out = [];
    list.forEach((L, i) => {
      if (!L || L.hide) return;
      const q = MK.proj(S, L.p[0], L.p[1], L.p[2]); if (q.z >= 1 || q.x < -20 || q.x > 660 || q.y < -20 || q.y > 420) return;
      const dx = L.dx == null ? 0 : L.dx, dy = L.dy == null ? -26 : L.dy, txt = mode === "num" ? String(i + 1) : L.t, w = mode === "num" ? 20 : Math.min(240, txt.length * 6.1 + 16);
      let x = Math.max(4 + w / 2, Math.min(636 - w / 2, q.x + dx)), y = Math.max(14, Math.min(392, q.y + dy));
      for (let k = 0; k < 8; k++) { const hit = placed.find((r) => Math.abs(r.x - x) < (r.w + w) / 2 + 2 && Math.abs(r.y - y) < 17); if (!hit) break; y += (dy <= 0 ? -1 : 1) * 17; }
      placed.push({ x, y, w }); out.push({ L, q, x, y, txt, i });
    });
    out.forEach(({ L, q, x, y }) => { const col = L.col || "#ffe7a8"; ctx.save(); ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(x, y); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(x, y); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(q.x, q.y, 2.8, 0, 6.3); ctx.fill(); ctx.restore(); });
    out.forEach(({ L, x, y, txt }) => {
      const col = L.col || "#ffe7a8";
      if (mode === "num") { ctx.save(); ctx.fillStyle = "rgba(10,14,24,.88)"; ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, 10, 0, 6.3); ctx.fill(); ctx.stroke(); ctx.fillStyle = col; ctx.font = "700 11px 'IBM Plex Sans',sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, x, y + 0.5); ctx.restore(); }
      else B.pill(txt, x, y, col, 10.5, "center");
    });
  }

  /* ---------- Watch explainer (timed walkthrough) ---------- */
  const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  function camTo(S, cam, st) {
    const o = S.orbit, tg = new (T().Vector3)(...cam[1]), d = new (T().Vector3)(...cam[0]).sub(tg), r = d.length();
    st.tg0 = o.target.clone(); st.tg1 = tg; o.touched = true;
    let yaw = Math.atan2(d.x, d.z); while (yaw - o.yaw > Math.PI) yaw -= 2 * Math.PI; while (yaw - o.yaw < -Math.PI) yaw += 2 * Math.PI;
    o.ty = yaw; o.tp = Math.asin(d.y / r); o.tr = r;
  }
  GK.storyToggle = (s, c, H, sc) => {
    if (s._story && s._story.on) { s._story.on = false; return; }
    const steps = typeof sc.story === "function" ? sc.story(c, s) : sc.story;
    s._story = { on: true, i: -1, t: 0, steps, H, last: 0 };
  };
  function storyTick(S, s, c, dt) {
    const st = s._story; if (!st || !st.on) return;
    st.t += dt;
    if (st.i < 0 || st.t >= (st.steps[st.i].d || 4)) {
      st.i++; st.t = 0;
      if (st.i >= st.steps.length) { st.on = false; st.done = true; st.H && st.H.refresh && st.H.refresh(); return; }
      const step = st.steps[st.i];
      if (step.set) { Object.assign(c, step.set); st.H && st.H.refresh && st.H.refresh(); st.H && st.H.onCh && st.H.onCh("_story"); }
      if (step.cam) camTo(S, step.cam, st); else { st.tg0 = st.tg1 = null; }
      if (step.run) step.run(s, c, S);
    }
    const step = st.steps[st.i], u = Math.min(1, st.t / (step.d || 4));
    if (st.tg1) S.orbit.target.lerpVectors(st.tg0, st.tg1, ease(Math.min(1, u * 1.6)));
    if (step.tween) { Object.entries(step.tween).forEach(([k, [a, b]]) => { c[k] = a + (b - a) * ease(u); }); if (st.t - st.last > 0.15 || u >= 1) { st.last = st.t; st.H && st.H.refresh && st.H.refresh(); } }
  }
  function drawStory(ctx, s, B, labelsList, S) {
    const st = s._story; if (!st || !st.on || st.i < 0) return;
    const step = st.steps[st.i], u = Math.min(1, st.t / (step.d || 4));
    if (step.hl && labelsList) { const L = labelsList.find((x) => x && x.id === step.hl); if (L) { const q = MK.proj(S, L.p[0], L.p[1], L.p[2]); if (q.z < 1) { const r = 14 + 6 * Math.sin(st.t * 6); ctx.save(); ctx.strokeStyle = "#ffd27a"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 6.3); ctx.stroke(); ctx.restore(); } } }
    const x = 14, w = 612, h = 58, y = 400 - h - 10;
    ctx.save(); ctx.fillStyle = "rgba(8,12,22,.82)"; ctx.strokeStyle = "rgba(255,210,122,.55)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 10) : ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffd27a"; ctx.font = "700 10px 'IBM Plex Sans',sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText(`▶ EXPLAINER  ${st.i + 1} / ${st.steps.length}${step.title ? "  ·  " + step.title.toUpperCase() : ""}`, x + 12, y + 15);
    ctx.fillStyle = "#eef4ff"; ctx.font = "500 12.5px 'IBM Plex Sans',sans-serif";
    const words = String(step.cap || "").split(" "); let line = "", ly = y + 32;
    words.forEach((wd) => { const tryL = line ? line + " " + wd : wd; if (ctx.measureText(tryL).width > w - 24) { ctx.fillText(line, x + 12, ly); ly += 16; line = wd; } else line = tryL; }); if (line) ctx.fillText(line, x + 12, ly);
    const tot = st.steps.reduce((a, b) => a + (b.d || 4), 0), done = st.steps.slice(0, st.i).reduce((a, b) => a + (b.d || 4), 0) + u * (step.d || 4);
    ctx.fillStyle = "rgba(255,255,255,.15)"; ctx.fillRect(x + 10, y + h - 6, w - 20, 2.5); ctx.fillStyle = "#ffd27a"; ctx.fillRect(x + 10, y + h - 6, (w - 20) * done / tot, 2.5);
    ctx.restore();
  }

  /* ---------- scene definition wrapper ---------- */
  GK.def3d = (key, sc0) => {
    const sc = Object.assign({ kind: "3d", fov: 40, env: "geo", label: "Photoreal 3D lab" }, sc0);
    sc.values = Object.assign({}, sc.values || {});
    if (sc.labels && sc.values.lbl == null) sc.values.lbl = "on";
    const extra = [].concat(sc.labels ? [LBL_CTL] : [], sc.hud ? [NOTE_CTL] : []);
    if (sc.hud && sc.values.notes == null) sc.values.notes = "brief";
    if (extra.length) { const ctl = sc.controls; sc.controls = typeof ctl === "function" ? (c) => ctl(c).concat(extra) : (ctl || []).concat(extra); }
    if (sc.story) { const own = sc.actions || []; sc.actions = [{ label: "▶ Watch explainer", run: (s, c, H) => GK.storyToggle(s, c, H, sc) }].concat(own); }
    const up = sc.update, ov = sc.overlay, hud = sc.hud;
    sc.update = (S, s, c, dt) => { storyTick(S, s, c, dt); if (s._fly) { const F = s._fly; F.t = Math.min(1, F.t + dt / 1.2); S.orbit.target.lerpVectors(F.tg0, F.tg1, ease(F.t)); if (F.t >= 1) s._fly = null; } up && up(S, s, c, dt); };
    sc.overlay = (ctx, s, c, S, B) => {
      GK.storyOn = !!(s._story && s._story.on);
      ov && ov(ctx, s, c, S, B);
      let L = null; if (sc.labels) { try { L = sc.labels(s, c, S); } catch (e) { L = null; } drawLabels(ctx, S, B, L, c.lbl); }
      drawStory(ctx, s, B, L, S);
    };
    if (hud) sc.hud = (s, c) => {
      if (s._story && s._story.on) return [];
      if (c.notes === "hide") return [];
      let cards = hud(s, c) || [];
      if (c.notes === "brief" && cards.length) { const k0 = cards[0], bold = k0.lines.filter((l) => Array.isArray(l) && l[2] === true), cut = k0.lines.indexOf("—"), ln = bold.length ? bold : k0.lines.slice(0, cut < 0 ? 2 : Math.min(cut, 2)); cards = [{ title: k0.title, lines: ln.concat([["▸ More in ‘Notes on screen’", "#8fa3c0"]]) }]; }
      if (sc.labels && c.lbl === "num") cards.push({ title: "Test yourself", lines: ["Name each numbered part, then switch Labels to Names to check."] });
      return cards;
    };
    MK.def(key, sc);
  };
  /* smooth camera move outside the explainer (e.g. when a feature is picked) */
  GK.flyTo = (S, s, cam) => { if (!S || !cam) return; const st = {}; camTo(S, cam, st); s._fly = { tg0: st.tg0, tg1: st.tg1, t: 0 }; };
  /* Feature tour: a diorama with a list of named features; picking one flies the camera to it.
     o: {title, blurb, envOpts, cam, variants:[[id,label]], values, controls (extra), build(g,S,s,c), tick(S,s,c,dt),
         feats(c,s) | feats:[{id,n,p,d,cam?}], notes:[lines] | notes(c), fly:[dx,dy,dz], intro:[story steps], overlay, hud(extra cards) } */
  GK.tour = (key, o) => {
    const feats = (c, s) => (typeof o.feats === "function" ? o.feats(c, s || {}) : o.feats) || [];
    const camFor = (F) => F.cam || [[F.p[0] + (o.fly || [1.4, 1.6, 2.6])[0], F.p[1] + (o.fly || [1.4, 1.6, 2.6])[1], F.p[2] + (o.fly || [1.4, 1.6, 2.6])[2]], F.p];
    const vctl = o.variants ? [{ type: "tabs", key: "v", label: o.vlabel || "Type", options: o.variants }] : [];
    const values = Object.assign({ v: o.variants ? o.variants[0][0] : "" }, o.values || {});
    values.f = values.f || (feats(values)[0] || {}).id;
    GK.def3d(key, {
      title: o.title, blurb: o.blurb, envOpts: o.envOpts, cam: o.cam, fov: o.fov, values,
      controls: (c) => vctl.concat((o.variants || [[null]]).map(([v]) => ({ type: "select", key: "f", label: o.flabel || "Feature", options: feats(v == null ? c : Object.assign({}, c, { v })).map((F) => [F.id, F.n]), show: v == null ? undefined : (cc) => cc.v === v })), typeof o.controls === "function" ? o.controls(c) : o.controls || []),
      onChange(s, c, k, H) {
        if (k === "v") { const L = feats(c, s); if (!L.some((F) => F.id === c.f)) c.f = (L[0] || {}).id; H && H.refresh && H.refresh(); }
        if ((k === "f" || k === "v") && H && H.S && !(s._story && s._story.on)) { const F = feats(c, s).find((x) => x.id === c.f); if (F) GK.flyTo(H.S, s, camFor(F)); }
        o.onChange && o.onChange(s, c, k, H);
      },
      build(S, s) { s.key = null; },
      update(S, s, c, dt) { const k = c.v + "|" + (o.rebuildOn ? o.rebuildOn(c) : ""); if (s.key !== k) { s.key = k; const g = BK.group(S, s); o.build(g, S, s, c); } o.tick && o.tick(S, s, c, dt); },
      overlay: o.overlay,
      labels: (s, c) => feats(c, s).map((F) => ({ id: F.id, p: F.lp || F.p, t: F.n, col: F.id === c.f ? "#ffd27a" : F.col || "#e8f1ff", dx: F.dx, dy: F.dy })),
      hud: (s, c) => { const F = feats(c, s).find((x) => x.id === c.f) || {}; const notes = typeof o.notes === "function" ? o.notes(c, s) : o.notes || []; return [{ title: F.n || o.title, lines: [[F.d || "", "#ffd27a", true]].concat(notes.length ? ["—"].concat(notes) : []) }].concat(o.hud ? o.hud(s, c) : []); },
      story: (c, s) => { const steps = [].concat(o.intro || []); (o.variants || [["", ""]]).forEach(([v]) => feats(Object.assign({}, c, { v }), s).forEach((F) => steps.push({ d: F.dur || 5.5, title: F.n, cap: F.n + ": " + F.d, set: o.variants ? { v, f: F.id } : { f: F.id }, cam: camFor(F), hl: F.id }))); return steps.slice(0, o.maxSteps || 10); },
      draw: GK.fallback(o.title, (o.variants || [["", ""]]).flatMap(([v]) => feats(Object.assign({}, values, { v })).map((F) => F.n + ": " + F.d)).slice(0, 8)),
    });
  };

  /* ---------- block diagram: terrain on top, rock strata on the four sides ----------
     o: {w, d, y0 (base), h(x,z) top surface, strata(x,y,z) -> [r,g,b], tint, nx, ny, map} */
  GK.block = (o) => {
    const T3 = T(), g = new T3.Group(), w = o.w || 6, d = o.d || 4, y0 = o.y0 == null ? -1.5 : o.y0, nx = o.nx || 160, ny = o.ny || 60;
    const top = GK.terrain({ w, d, nx, h: o.h, tint: o.tint, map: o.map, detail: o.detail }); g.add(top);
    const wall = (ax, bx, az, bz, n) => { const pos = [], col = [], idx = []; for (let i = 0; i <= n; i++) { const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t, yt = o.h(x, z); for (let j = 0; j <= ny; j++) { const y = y0 + (yt - y0) * j / ny; pos.push(x, y, z); const c = o.strata ? o.strata(x, y, z, yt) : [0.5, 0.4, 0.3]; col.push(c[0], c[1], c[2]); } } for (let i = 0; i < n; i++) for (let j = 0; j < ny; j++) { const a = i * (ny + 1) + j, b = a + ny + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); } const geo = new T3.BufferGeometry(); geo.setAttribute("position", new T3.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new T3.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals(); const m = new T3.Mesh(geo, new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: T3.DoubleSide })); m.receiveShadow = true; return m; };
    const W = w / 2, D = d / 2, nz = Math.round(nx * d / w);
    g.add(wall(-W, W, D, D, nx), wall(W, -W, -D, -D, nx), wall(W, W, D, -D, nz), wall(-W, -W, -D, D, nz));
    const base = new T3.Mesh(new T3.PlaneGeometry(w, d), new T3.MeshStandardMaterial({ color: 0x3a2e26 })); base.rotation.x = Math.PI / 2; base.position.y = y0; g.add(base);
    g.top = top; return g;
  };
  /* banded strata helper: bands = [[topY, hex], ...] from the top down; noise wobble */
  GK.bands = (bands, wob = 0.04) => (x, y, z) => { const n = (BK.noise3(x * 1.7, y * 3, z * 1.7) - 0.5) * wob * 2; for (const [yy, col] of bands) if (y + n > yy) return GK.hex3(col).map((v) => v * (0.92 + 0.16 * BK.noise3(x * 9, y * 14, z * 9))); return GK.hex3(bands[bands.length - 1][1]); };

  /* ---------- hand-specimen rock samples (procedural textures) ---------- */
  const ROCK = {
    granite: { base: 0xc9a9a0, dots: [[0xf2ece4, 0.35, 3], [0x2a2a2a, 0.18, 2.4], [0xd98c7a, 0.25, 3.5]] },
    basalt: { base: 0x34363a, dots: [[0x55585e, 0.25, 0.9], [0x1c1d20, 0.3, 0.8]], holes: true },
    sandstone: { base: 0xd2a66e, dots: [[0xe8c590, 0.4, 0.8], [0xa9783f, 0.25, 0.7]], layers: 0x9e7040 },
    shale: { base: 0x6a6a68, dots: [[0x5a5a58, 0.3, 0.6]], layers: 0x4a4a48, fine: true },
    limestone: { base: 0xd8d2c0, dots: [[0xc4bca6, 0.3, 1.2]], fossils: true },
    coal: { base: 0x1a1a1c, dots: [[0x333338, 0.2, 1]], gloss: true, layers: 0x0c0c0e },
    gneiss: { base: 0xb8b0a8, dots: [[0x222222, 0.2, 2], [0xeeeeee, 0.2, 2]], bands: [0x2a2a2a, 0xe8e4dc] },
    slate: { base: 0x4a5058, dots: [[0x40464e, 0.3, 0.5]], layers: 0x3a4048, fine: true },
    marble: { base: 0xf1efe9, dots: [[0xe2ded6, 0.25, 1.5]], veins: 0x9a9a9a },
    quartzite: { base: 0xe9dcd0, dots: [[0xf8f2ea, 0.4, 1.4], [0xd4c2b2, 0.3, 1.2]] },
    laterite: { base: 0xa4502a, dots: [[0x7a3418, 0.35, 2.5], [0xc8743e, 0.25, 2]], holes: true },
  };
  GK.rockTex = (type, size = 512) => {
    const R = ROCK[type] || ROCK.granite, c = BK.cv(size, size), g = c.getContext("2d"), rr = BK.rng(type.length * 31), hx = (h) => "#" + h.toString(16).padStart(6, "0");
    g.fillStyle = hx(R.base); g.fillRect(0, 0, size, size);
    if (R.bands) for (let y = 0; y < size; y += 6) { g.fillStyle = hx(R.bands[(Math.floor(y / 18 + Math.sin(y * 0.05) * 2) % 2 + 2) % 2]); g.globalAlpha = 0.55; g.fillRect(0, y + Math.sin(y * 0.1) * 3, size, 6); } g.globalAlpha = 1;
    if (R.layers) for (let y = 0; y < size; y += R.fine ? 5 : 14) { g.strokeStyle = hx(R.layers); g.globalAlpha = 0.5; g.lineWidth = R.fine ? 1 : 2; g.beginPath(); for (let x = 0; x <= size; x += 16) g.lineTo(x, y + Math.sin(x * 0.02 + y) * 2); g.stroke(); } g.globalAlpha = 1;
    R.dots.forEach(([col, dens, r]) => { g.fillStyle = hx(col); const n = Math.round(size * size * dens / (r * r * 12)); for (let i = 0; i < n; i++) { const x = rr() * size, y = rr() * size, s = r * (0.5 + rr()); g.beginPath(); if (r > 2) { g.moveTo(x, y); for (let k = 0; k < 5; k++) g.lineTo(x + Math.cos(k * 1.26 + rr()) * s, y + Math.sin(k * 1.26 + rr()) * s); } else g.arc(x, y, s, 0, 6.3); g.fill(); } });
    if (R.holes) { g.fillStyle = "rgba(0,0,0,.55)"; for (let i = 0; i < 60; i++) { g.beginPath(); g.arc(rr() * size, rr() * size, 1 + rr() * 4, 0, 6.3); g.fill(); } }
    if (R.veins) { g.strokeStyle = hx(R.veins); g.globalAlpha = 0.6; for (let k = 0; k < 7; k++) { g.lineWidth = 0.6 + rr() * 2; g.beginPath(); let x = rr() * size, y = 0; g.moveTo(x, y); while (y < size) { x += (rr() - 0.5) * 40; y += 20 + rr() * 20; g.lineTo(x, y); } g.stroke(); } g.globalAlpha = 1; }
    if (R.fossils) { g.strokeStyle = "rgba(120,110,90,.8)"; g.lineWidth = 1.5; for (let i = 0; i < 14; i++) { const x = rr() * size, y = rr() * size, r = 6 + rr() * 10; g.beginPath(); for (let a = 0; a < 12; a += 0.3) g.lineTo(x + Math.cos(a) * r * a / 12, y + Math.sin(a) * r * a / 12); g.stroke(); } }
    const t = new (T().CanvasTexture)(c); t.colorSpace = T().SRGBColorSpace; t.wrapS = t.wrapT = T().RepeatWrapping; return t;
  };
  GK.rockSample = (type, r = 0.5) => { const T3 = T(), geo = new T3.IcosahedronGeometry(r, 5), p = geo.attributes.position, seed = type.length; for (let i = 0; i < p.count; i++) { const v = new T3.Vector3().fromBufferAttribute(p, i), n = BK.fbm(v.x * 2.2 + seed, v.y * 2.2, v.z * 2.2) - 0.5; v.multiplyScalar(1 + n * 0.35); v.y *= 0.72; p.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals(); const tex = GK.rockTex(type); const R = ROCK[type] || {}; const m = new T3.Mesh(geo, new T3.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 2, roughness: R.gloss ? 0.35 : 0.85, metalness: R.gloss ? 0.15 : 0 })); m.castShadow = true; return m; };
  GK.ROCKS = ROCK;

  /* ---------- simple particle cloud: n points with per-frame updater ---------- */
  GK.particles = (n, color = 0xffffff, size = 0.04, opacity = 0.9) => { const T3 = T(), geo = new T3.BufferGeometry(), pos = new Float32Array(n * 3); geo.setAttribute("position", new T3.BufferAttribute(pos, 3)); if (!GK._dot) { const c = BK.cv(64, 64), x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.5, "rgba(255,255,255,.7)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); GK._dot = new T3.CanvasTexture(c); }
    const pts = new T3.Points(geo, new T3.PointsMaterial({ color, size: size * 1.6, map: GK._dot, transparent: true, opacity, depthWrite: false, alphaTest: 0.02 })); pts.frustumCulled = false; pts.pos = pos; pts.n = n; pts.flush = () => { geo.attributes.position.needsUpdate = true; }; return pts; };
  /* arrow mesh from a to b */
  GK.arrow = (a, b, color = 0xffd27a, r = 0.025) => { const T3 = T(), g = new T3.Group(), A = new T3.Vector3(...a), B = new T3.Vector3(...b), d = B.clone().sub(A), L = d.length(), m = new T3.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35 }); const sh = new T3.Mesh(new T3.CylinderGeometry(r, r, Math.max(0.01, L - r * 5), 10), m); sh.position.y = (L - r * 5) / 2; g.add(sh); const hd = new T3.Mesh(new T3.ConeGeometry(r * 2.6, r * 6, 14), m); hd.position.y = L - r * 3; g.add(hd); g.position.copy(A); g.quaternion.setFromUnitVectors(new T3.Vector3(0, 1, 0), d.normalize()); return g; };

  GK.alias = (key, from, over) => { const b = MK.scenes[from]; if (b) MK.def(key, Object.assign({}, b, over)); };

  /* ---------- terrain ---------- */
  /* height-field mesh: h(x,z) in world units; colour from tint(hNorm, slope, x, z) → [r,g,b] 0..1 */
  GK.terrain = (o) => {
    const T3 = T(), sx = o.w || 10, sz = o.d || 8, nx = o.nx || 180, nz = o.nz || Math.round(nx * sz / sx);
    const g = new T3.PlaneGeometry(sx, sz, nx, nz); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, col = new Float32Array(p.count * 3);
    let hmin = 1e9, hmax = -1e9; const hs = new Float32Array(p.count);
    for (let i = 0; i < p.count; i++) { const y = o.h(p.getX(i), p.getZ(i)); hs[i] = y; hmin = Math.min(hmin, y); hmax = Math.max(hmax, y); p.setY(i, y); }
    g.computeVertexNormals(); const n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) { const hn = (hs[i] - hmin) / ((hmax - hmin) || 1), slope = 1 - n.getY(i); const c = (o.tint || GK.tintSavanna)(hn, slope, p.getX(i), p.getZ(i), hs[i]); col.set(c, i * 3); }
    g.setAttribute("color", new T3.BufferAttribute(col, 3));
    const mat = new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0, map: o.map || null });
    if (o.detail !== false) { const d = GK.detailTex(); mat.roughnessMap = d; mat.bumpMap = d; mat.bumpScale = o.bump == null ? 1.2 : o.bump; }
    const m = new T3.Mesh(g, mat); m.receiveShadow = true; m.castShadow = true; m.userData = { hmin, hmax }; return m;
  };
  /* tileable grain for ground (roughness + bump) */
  GK.detailTex = () => { const c = BK.cv(256, 256), g = c.getContext("2d"), id = g.createImageData(256, 256); for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const v = 0.55 + 0.45 * BK.fbm(x / 21, y / 21, 3.3) - 0.2 * Math.random(); const k = (y * 256 + x) * 4; id.data[k] = id.data[k + 1] = id.data[k + 2] = Math.max(0, Math.min(255, v * 255)); id.data[k + 3] = 255; } g.putImageData(id, 0, 0); const t = new (T().CanvasTexture)(c); t.wrapS = t.wrapT = T().RepeatWrapping; t.repeat.set(24, 24); return t; };
  const mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const hex3 = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
  GK.mix3 = mix3; GK.hex3 = hex3;
  /* West African savanna look: green lowland, olive grass, laterite and rock on steep ground */
  GK.tintSavanna = (hn, slope, x, z) => { const n = BK.fbm(x * 0.9 + 5, z * 0.9, 1.7); let c = mix3(hex3(0x5c7d34), hex3(0x8a8a46), Math.min(1, hn * 1.3 + (n - 0.5) * 0.5)); c = mix3(c, hex3(0x9a5a34), Math.max(0, Math.min(1, (slope - 0.18) * 3 + (n - 0.55)))); return mix3(c, hex3(0x7d746a), Math.max(0, Math.min(1, (slope - 0.38) * 3))); };
  GK.tintForest = (hn, slope, x, z) => { const n = BK.fbm(x * 1.3, z * 1.3, 4.2); let c = mix3(hex3(0x2c5a23), hex3(0x3f7a2c), n); return mix3(c, hex3(0x8a5a3a), Math.max(0, Math.min(1, (slope - 0.3) * 3))); };
  GK.tintDesert = (hn, slope, x, z) => { const n = BK.fbm(x * 0.7, z * 0.7, 9.1); let c = mix3(hex3(0xd9b47a), hex3(0xc79560), n); return mix3(c, hex3(0x8c6a4e), Math.max(0, Math.min(1, (slope - 0.25) * 3))); };
  /* atlas layer tints by height in metres */
  GK.hypsoRamp = [[0, 0x6aa84f], [100, 0x93c47d], [200, 0xd9ead3], [300, 0xffe599], [450, 0xf6b26b], [600, 0xe69138], [900, 0xb45f06], [1500, 0x783f04]];
  GK.hypso = (m) => { const R = GK.hypsoRamp; for (let i = 1; i < R.length; i++) if (m <= R[i][0]) { const k = (m - R[i - 1][0]) / (R[i][0] - R[i - 1][0]); return mix3(hex3(R[i - 1][1]), hex3(R[i][1]), k); } return hex3(R[R.length - 1][1]); };

  /* ---------- contours (marching squares) ---------- */
  /* returns array of segments [x1,z1,x2,z2,level] over a grid of heights hm(x,z) in metres */
  GK.contourSegs = (hm, x0, z0, x1, z1, n, ci) => {
    const m = Math.round(n * (z1 - z0) / (x1 - x0)), dx = (x1 - x0) / n, dz = (z1 - z0) / m, H = [];
    for (let j = 0; j <= m; j++) { H.push([]); for (let i = 0; i <= n; i++) H[j].push(hm(x0 + i * dx, z0 + j * dz)); }
    let lo = 1e9, hi = -1e9; H.forEach((r) => r.forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); }));
    const segs = [];
    for (let L = Math.ceil(lo / ci) * ci; L <= hi; L += ci) {
      for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) {
        const a = H[j][i], b = H[j][i + 1], c = H[j + 1][i + 1], d = H[j + 1][i];
        const idx = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0); if (idx === 0 || idx === 15) continue;
        const X = x0 + i * dx, Z = z0 + j * dz, t = (p, q) => (L - p) / (q - p);
        const top = [X + dx * t(a, b), Z], right = [X + dx, Z + dz * t(b, c)], bot = [X + dx * t(d, c), Z + dz], left = [X, Z + dz * t(a, d)];
        const add = (P, Q) => segs.push([P[0], P[1], Q[0], Q[1], L]);
        switch (idx) { case 1: case 14: add(left, bot); break; case 2: case 13: add(bot, right); break; case 3: case 12: add(left, right); break; case 4: case 11: add(top, right); break; case 5: add(left, top); add(bot, right); break; case 6: case 9: add(top, bot); break; case 7: case 8: add(left, top); break; case 10: add(top, right); add(left, bot); break; }
      }
    }
    return segs;
  };
  /* draw a topographical map sheet onto a 2D context. o: {x0,z0,x1,z1, hm, ci, px, py, pw, ph, tint, features(g, X, Z), grid km} */
  GK.drawTopo = (g, o) => {
    const { x0, z0, x1, z1, px, py, pw, ph } = o, X = (x) => px + (x - x0) / (x1 - x0) * pw, Z = (z) => py + (z - z0) / (z1 - z0) * ph;
    g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip();
    if (o.layer !== false) { const cs = 6; for (let yy = 0; yy < ph; yy += cs) for (let xx = 0; xx < pw; xx += cs) { const wx = x0 + (xx + cs / 2) / pw * (x1 - x0), wz = z0 + (yy + cs / 2) / ph * (z1 - z0), m = o.hm(wx, wz), c = o.sea != null && m < o.sea ? hex3(0x9fc5e8) : GK.hypso(m); g.fillStyle = `rgb(${c[0] * 255 | 0},${c[1] * 255 | 0},${c[2] * 255 | 0})`; g.fillRect(px + xx, py + yy, cs + 0.5, cs + 0.5); } }
    else { g.fillStyle = "#fbf7ec"; g.fillRect(px, py, pw, ph); }
    const segs = GK.contourSegs(o.hm, x0, z0, x1, z1, o.res || 90, o.ci);
    segs.forEach((s) => { const idx = Math.round(s[4] / o.ci) % 5 === 0; g.strokeStyle = idx ? "rgba(120,60,20,.95)" : "rgba(150,85,40,.7)"; g.lineWidth = idx ? 1.4 : 0.7; g.beginPath(); g.moveTo(X(s[0]), Z(s[1])); g.lineTo(X(s[2]), Z(s[3])); g.stroke(); });
    if (o.labels !== false) { const done = {}; segs.forEach((s, i) => { if (i % 37 || Math.round(s[4] / o.ci) % 5) return; const key = s[4] + "_" + Math.round(X(s[0]) / 70); if (done[key]) return; done[key] = 1; g.fillStyle = "rgba(120,60,20,1)"; g.font = "600 8.5px 'IBM Plex Sans',sans-serif"; g.fillText(String(s[4]), X(s[0]) + 2, Z(s[1]) - 2); }); }
    if (o.grid) { g.strokeStyle = "rgba(40,70,140,.45)"; g.lineWidth = 0.7; for (let x = Math.ceil(x0 / o.grid) * o.grid; x <= x1; x += o.grid) { g.beginPath(); g.moveTo(X(x), py); g.lineTo(X(x), py + ph); g.stroke(); } for (let z = Math.ceil(z0 / o.grid) * o.grid; z <= z1; z += o.grid) { g.beginPath(); g.moveTo(px, Z(z)); g.lineTo(px + pw, Z(z)); g.stroke(); } }
    o.features && o.features(g, X, Z);
    g.restore(); g.strokeStyle = "#1a1a1a"; g.lineWidth = 1.5; g.strokeRect(px, py, pw, ph);
    return { X, Z };
  };
  /* topographic sheet as a texture for draping on 3D terrain */
  GK.topoTexture = (o, size = 1024) => { const c = BK.cv(size, Math.round(size * (o.z1 - o.z0) / (o.x1 - o.x0))), g = c.getContext("2d"); GK.drawTopo(g, Object.assign({}, o, { px: 0, py: 0, pw: c.width, ph: c.height })); const t = new (T().CanvasTexture)(c); t.colorSpace = T().SRGBColorSpace; t.anisotropy = 8; return t; };

  /* ---------- small 3D builders ---------- */
  GK.line = (pts, color = 0xffffff, width = 0.02, y = 0) => { const T3 = T(); if (pts.length < 2) return new T3.Group(); const curve = new T3.CatmullRomCurve3(pts.map((p) => new T3.Vector3(p[0], (p[1] || 0) + y, p[2])), false, "catmullrom", 0.1); return new T3.Mesh(new T3.TubeGeometry(curve, Math.max(8, pts.length * 4), width, 6), new T3.MeshStandardMaterial({ color, roughness: 0.6 })); };
  GK.polyline = (pts, color = 0xffffff, opacity = 1) => { const T3 = T(), g = new T3.BufferGeometry().setFromPoints(pts.map((p) => new T3.Vector3(p[0], p[1], p[2]))); return new T3.Line(g, new T3.LineBasicMaterial({ color, transparent: opacity < 1, opacity })); };
  GK.water = (w, d, color = 0x2d6a8a, opacity = 0.85) => { const T3 = T(), m = new T3.Mesh(new T3.PlaneGeometry(w, d), new T3.MeshPhysicalMaterial({ color, roughness: 0.08, metalness: 0, clearcoat: 1, transparent: opacity < 1, opacity, normalMap: GK.waterNormal(), normalScale: new T3.Vector2(0.35, 0.35) })); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m; };
  GK.waterNormal = () => { const t = GK.texture("textures/water_normal_512.png", false); t.wrapS = t.wrapT = T().RepeatWrapping; t.repeat.set(6, 6); return t; };
  GK.house = (w = 0.12, roof = 0x8a3a2a, wall = 0xe8dcc8) => { const T3 = T(), g = new T3.Group(); const b = new T3.Mesh(new T3.BoxGeometry(w, w * 0.7, w * 0.8), new T3.MeshStandardMaterial({ color: wall, roughness: 0.85 })); b.position.y = w * 0.35; g.add(b); const r = new T3.Mesh(new T3.ConeGeometry(w * 0.75, w * 0.45, 4), new T3.MeshStandardMaterial({ color: roof, roughness: 0.7 })); r.rotation.y = Math.PI / 4; r.position.y = w * 0.92; g.add(r); return BK.shadow(g); };
  GK.hut = (r = 0.06) => { const T3 = T(), g = new T3.Group(); const b = new T3.Mesh(new T3.CylinderGeometry(r, r, r * 1.1, 14), new T3.MeshStandardMaterial({ color: 0xa8643a, roughness: 0.95 })); b.position.y = r * 0.55; g.add(b); const t = new T3.Mesh(new T3.ConeGeometry(r * 1.35, r * 1.2, 14), new T3.MeshStandardMaterial({ color: 0xc9a85a, roughness: 1 })); t.position.y = r * 1.6; g.add(t); return BK.shadow(g); };
  GK.pin = (color = 0xff5a3a, h = 0.35) => { const T3 = T(), g = new T3.Group(); const s = new T3.Mesh(new T3.CylinderGeometry(0.008, 0.008, h, 6), new T3.MeshStandardMaterial({ color: 0x333333 })); s.position.y = h / 2; g.add(s); const b = new T3.Mesh(new T3.SphereGeometry(0.04, 16, 12), new T3.MeshStandardMaterial({ color, roughness: 0.3, emissive: color, emissiveIntensity: 0.25 })); b.position.y = h; g.add(b); return g; };
  GK.tree = (h = 0.25, seed = 1, col = 0x3a6a2a) => { const t = BK.tree(1, seed, col); t.scale.setScalar(h); return t; };

  /* ---------- lon/lat helpers for map scenes ---------- */
  GK.proj = (bbox, size) => { const [lo0, la0, lo1, la1] = bbox, k = size / Math.max(lo1 - lo0, la1 - la0), cx = (lo0 + lo1) / 2, cz = (la0 + la1) / 2; return { k, x: (lo) => (lo - cx) * k, z: (la) => -(la - cz) * k, lon: (x) => x / k + cx, lat: (z) => -z / k + cz, w: (lo1 - lo0) * k, d: (la1 - la0) * k }; };
  GK.rings = (geom) => (!geom ? [] : geom.type === "Polygon" ? geom.coordinates : geom.type === "MultiPolygon" ? geom.coordinates.flat() : geom.type === "LineString" ? [geom.coordinates] : geom.type === "MultiLineString" ? geom.coordinates : []);

  /* ---------- flat relief map of a lon/lat box: Natural Earth II relief image + GeoJSON outlines ----------
     o: {bbox:[lo0,la0,lo1,la1], size, img, imgBbox, geo:[{path, col, w, filter(props)}], y} → group with .P (projection) */
  GK.mapPlane = (o) => {
    const T3 = T(), P = GK.proj(o.bbox, o.size || 8), g = new T3.Group(), [lo0, la0, lo1, la1] = o.bbox, ib = o.imgBbox || [-26, -36, 60, 38];
    const tex = GK.texture(o.img || "maps/africa_ne2_relief.jpg", true); tex.repeat.set((lo1 - lo0) / (ib[2] - ib[0]), (la1 - la0) / (ib[3] - ib[1])); tex.offset.set((lo0 - ib[0]) / (ib[2] - ib[0]), (la0 - ib[1]) / (ib[3] - ib[1]));
    const plane = new T3.Mesh(new T3.PlaneGeometry(P.w, P.d), new T3.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 1.5, roughness: 0.95 })); plane.rotation.x = -Math.PI / 2; plane.receiveShadow = true; g.add(plane);
    const edge = new T3.Mesh(new T3.BoxGeometry(P.w + 0.08, 0.12, P.d + 0.08), new T3.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.6 })); edge.position.y = -0.065; g.add(edge);
    (o.geo || []).forEach((L) => GK.json(L.path).then((d) => { if (!d || !g.parent) return; d.features.forEach((ft) => { if (L.filter && !L.filter(ft.properties)) return; GK.rings(ft.geometry).forEach((ring) => { const pts = ring.filter(([lo, la]) => lo >= lo0 - 1 && lo <= lo1 + 1 && la >= la0 - 1 && la <= la1 + 1).map(([lo, la]) => [Math.max(-P.w / 2, Math.min(P.w / 2, P.x(lo))), (o.y || 0.006), Math.max(-P.d / 2, Math.min(P.d / 2, P.z(la)))]); if (pts.length > 1) g.add(GK.polyline(pts, L.col || 0x222222, L.op || 0.9)); }); }); }));
    g.P = P; return g;
  };

  /* ---------- instanced vegetation ----------
     pts: [[x, y, z, scale]]; kind: broad | emergent | umbrella | baobab | palm | shrub | grass | conifer | mangrove */
  GK.flora = (g, pts, kind = "broad", col = 0x3a6a2a, h = 0.3) => {
    const T3 = T(), n = pts.length; if (!n) return;
    const spec = { broad: [0.08, 0.55, [0.55, 0.45, 0.55], 0.62], emergent: [0.05, 1.0, [0.5, 0.16, 0.5], 1.0], umbrella: [0.04, 0.55, [0.6, 0.13, 0.6], 0.6], baobab: [0.22, 0.5, [0.38, 0.2, 0.38], 0.58], palm: [0.035, 0.9, [0.35, 0.12, 0.35], 0.92], shrub: [0.04, 0.12, [0.28, 0.22, 0.28], 0.22], grass: [0, 0, [0.06, 0.35, 0.06], 0.17], conifer: [0.04, 0.3, [0.25, 0.6, 0.25], 0.62], mangrove: [0.05, 0.35, [0.45, 0.3, 0.45], 0.5] }[kind] || [0.08, 0.55, [0.5, 0.45, 0.5], 0.62];
    const [tr, th, cs, cy] = spec, m4 = new T3.Matrix4(), q = new T3.Quaternion(), c = new T3.Color();
    const crownGeo = kind === "grass" || kind === "conifer" ? new T3.ConeGeometry(1, 1, 7) : new T3.IcosahedronGeometry(1, 1);
    const crown = new T3.InstancedMesh(crownGeo, new T3.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: kind !== "grass" }), n);
    pts.forEach(([x, y, z, sc = 1], i) => { const k = h * sc; q.setFromAxisAngle(new T3.Vector3(0, 1, 0), (x * 7.3 + z * 3.1) % 6.28); m4.compose(new T3.Vector3(x, y + cy * k, z), q, new T3.Vector3(cs[0] * k, cs[1] * k, cs[2] * k)); crown.setMatrixAt(i, m4); c.setHex(col).offsetHSL(0, 0, (BK.noise3(x * 5, z * 5, 3) - 0.5) * 0.14); crown.setColorAt(i, c); });
    crown.castShadow = true; crown.receiveShadow = true; g.add(crown);
    if (tr > 0) { const trunk = new T3.InstancedMesh(new T3.CylinderGeometry(0.7, 1, 1, 7), new T3.MeshStandardMaterial({ color: kind === "baobab" ? 0x8a7a6a : 0x5a4030, roughness: 0.95 }), n); pts.forEach(([x, y, z, sc = 1], i) => { const k = h * sc; m4.compose(new T3.Vector3(x, y + th * k / 2, z), q.identity(), new T3.Vector3(tr * k, th * k, tr * k)); trunk.setMatrixAt(i, m4); }); trunk.castShadow = true; g.add(trunk); }
    if (kind === "mangrove") { const roots = new T3.InstancedMesh(new T3.ConeGeometry(1, 1, 8, 1, true), new T3.MeshStandardMaterial({ color: 0x4a3828, roughness: 1, side: T3.DoubleSide, wireframe: true }), n); pts.forEach(([x, y, z, sc = 1], i) => { const k = h * sc; m4.compose(new T3.Vector3(x, y + 0.1 * k, z), q.identity(), new T3.Vector3(0.25 * k, 0.22 * k, 0.25 * k)); roots.setMatrixAt(i, m4); }); g.add(roots); }
  };
  /* scatter helper: n points in a rectangle with an acceptance test, heights from h(x,z) */
  GK.scatter = (n, x0, x1, z0, z1, h, ok, seed = 1, s0 = 0.7, s1 = 1.3) => { const r = BK.rng(seed), out = []; let tries = 0; while (out.length < n && tries++ < n * 20) { const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0); if (ok && !ok(x, z)) continue; out.push([x, h ? h(x, z) : 0, z, s0 + r() * (s1 - s0)]); } return out; };

  /* ---------- fallbacks for no-WebGL ---------- */
  GK.fallback = (title, facts) => BK.fallback(title, facts);
})();
