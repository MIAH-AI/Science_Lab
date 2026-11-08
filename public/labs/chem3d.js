/* chem3d.js — shared 3D chemistry layer for the Chemistry lab, built on physics3d.js (P3D).
   Provides: chemistry helpers (pH solver, indicators), lab + studio environments, and the 3D host
   (stage, HUD canvas, transport bar, controls, readouts, procedure list).  The apparatus/effects kit is in chem3d-kit.js.
   If WebGL is unavailable C3.ready stays false and the lab keeps using its original 2D drawings. */
(function () {
  "use strict";
  const P3D = window.P3D, T = window.THREE;
  const C3 = (window.Chem3D = { ready: false, scenes: {}, CM: 1 / 6 });   // scene units: 1 unit = 6 cm
  if (!P3D || !P3D.ready || !T) return;
  C3.ready = true;
  const U = P3D.util, V3 = U.V3, rnd = U.rnd, clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ================= chemistry helpers ================= */
  const KW = 1e-14;
  const chem = (C3.chem = { Kw: KW });
  /* Indicator transition ranges (textbook values). Colour is a ramp over [lo,hi]; op = visual density of the dye. */
  chem.indicators = {
    methylOrange: { name: "Methyl orange", lo: 3.1, hi: 4.4, acidName: "red", baseName: "yellow",
      ramp: [[0, [226, 38, 30], 0.62], [0.5, [240, 112, 32], 0.6], [1, [246, 190, 28], 0.55]] },
    phenolphthalein: { name: "Phenolphthalein", lo: 8.2, hi: 10.0, acidName: "colourless", baseName: "pink",
      ramp: [[0, [200, 228, 244], 0.16], [0.45, [244, 150, 196], 0.38], [1, [226, 32, 128], 0.62]] },
    bromothymolBlue: { name: "Bromothymol blue", lo: 6.0, hi: 7.6, acidName: "yellow", baseName: "blue",
      ramp: [[0, [243, 214, 24], 0.5], [0.5, [64, 170, 90], 0.55], [1, [42, 92, 214], 0.6]] },
  };
  chem.indicatorAt = function (ind, pH) {                 // → {rgb:[r,g,b], op, t, label}
    const t0 = clamp((pH - ind.lo) / (ind.hi - ind.lo), 0, 1), t = t0 * t0 * (3 - 2 * t0), r = ind.ramp;
    let i = 0; while (i < r.length - 2 && t > r[i + 1][0]) i++;
    const a = r[i], b = r[i + 1], k = clamp((t - a[0]) / (b[0] - a[0]), 0, 1);
    const rgb = a[1].map((v, j) => v + (b[1][j] - v) * k), op = a[2] + (b[2] - a[2]) * k;
    const label = pH <= ind.lo ? ind.acidName : pH >= ind.hi ? ind.baseName : t < 0.5 ? "changing (" + ind.acidName + "→)" : "changing (→" + ind.baseName + ")";
    return { rgb, op, t, label };
  };
  /* Titration pH from the charge balance  [H+] + cations = [OH-] + anions  (solved by bisection on pH).
     analyte an = {type:'SA'|'SB'|'WA'|'WB', c (mol/dm3), K (Ka of WA, Kb of WB)};  titrant tit = {type:'SA'|'SB', c}. Volumes in cm3. */
  chem.ph = function (an, tit, Va, Vt) {
    const V = (Va + Vt) / 1000, cA = (an.c * Va / 1000) / V, cT = (tit.c * Vt / 1000) / V;
    const f = (pH) => {
      const h = Math.pow(10, -pH); let pos = h, neg = KW / h;
      if (an.type === "SA") neg += cA; else if (an.type === "SB") pos += cA;
      else if (an.type === "WA") neg += cA * an.K / (an.K + h);
      else { const Ka = KW / an.K; pos += cA * h / (h + Ka); }
      if (tit.type === "SA") neg += cT; else pos += cT;
      return pos - neg;
    };
    let lo = -2, hi = 16;
    for (let i = 0; i < 70; i++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };
  chem.curve = function (an, tit, Va, Vmax, step) { const p = []; for (let v = 0; v <= Vmax + 1e-9; v += step) p.push([v, chem.ph(an, tit, Va, v)]); return p; };
  chem.rgbCss = (rgb, a) => "rgba(" + (rgb[0] | 0) + "," + (rgb[1] | 0) + "," + (rgb[2] | 0) + "," + (a == null ? 1 : a) + ")";
  chem.sub = (s) => String(s).replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[d]);

  /* ================= environments ================= */
  function tileCanvas(tint) {
    const c = U.cv(512, 512), g = c.getContext("2d"), tw = 128, th = 64;
    g.fillStyle = "#8a9aa0"; g.fillRect(0, 0, 512, 512);
    for (let r = 0; r < 8; r++) {
      const off = (r % 2) * tw / 2;
      for (let col = -1; col < 5; col++) {
        const x = col * tw + off, y = r * th, tn = rnd(-5, 5);
        g.fillStyle = `rgb(${tint[0] + tn},${tint[1] + tn},${tint[2] + tn})`; g.fillRect(x + 2, y + 2, tw - 4, th - 4);
        const gr = g.createLinearGradient(x, y, x, y + th); gr.addColorStop(0, "rgba(255,255,255,.35)"); gr.addColorStop(0.5, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(0,0,0,.08)");
        g.fillStyle = gr; g.fillRect(x + 2, y + 2, tw - 4, th - 4);
      }
    }
    return c;
  }
  function epoxyCanvas() {
    const c = U.cv(256, 256), g = c.getContext("2d"); g.fillStyle = "#2c3036"; g.fillRect(0, 0, 256, 256);
    const im = g.getImageData(0, 0, 256, 256), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 12; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(im, 0, 0); return c;
  }
  P3D.envs.chemlab = function (S, o) {
    const sc = S.scene, bw = o.w || 26, bd = o.d || 10, wallH = o.wallH || 24;
    sc.background = new T.Color(0x2a323b);
    const benchTex = U.tex(epoxyCanvas(), [bw / 6, bd / 6]);
    const top = new T.Mesh(new T.BoxGeometry(bw, 0.3, bd), new T.MeshPhysicalMaterial({ map: benchTex, roughness: 0.42, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.4 }));
    top.position.y = -0.15; top.receiveShadow = true; sc.add(top); S.objs.bench = top;
    const edge = new T.Mesh(new T.BoxGeometry(bw + 0.05, 0.12, bd + 0.05), new T.MeshStandardMaterial({ color: 0x14171b, roughness: 0.6 })); edge.position.y = -0.36; sc.add(edge);
    const tt = U.tex(tileCanvas(o.tile || [66, 88, 100]), [bw / 4, wallH / 4]);
    const wall = new T.Mesh(new T.PlaneGeometry(bw * 1.7, wallH), new T.MeshPhysicalMaterial({ map: tt, bumpMap: tt, bumpScale: 0.6, roughness: 0.34, clearcoat: 0.25 }));
    wall.position.set(0, wallH / 2 - 0.3, -bd / 2 - 0.15); wall.receiveShadow = true; sc.add(wall);
    const back = new T.Mesh(new T.BoxGeometry(bw, 0.5, 0.5), new T.MeshStandardMaterial({ color: 0x20252b, roughness: 0.5 })); back.position.set(0, 0.0, -bd / 2 - 0.05); sc.add(back);
    sc.add(new T.HemisphereLight(0xdbe8ff, 0x3a3128, o.hemi == null ? 0.45 : o.hemi));
    const key = new T.DirectionalLight(0xfff3e2, o.key == null ? 2.6 : o.key); key.position.set(-6, 14, 9); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); const a = o.shadowArea || 10;
    Object.assign(key.shadow.camera, { left: -a, right: a, top: a + 6, bottom: -a, near: 0.5, far: 60 }); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 3;
    sc.add(key, key.target); S.sunLight = key;
    const rim = new T.DirectionalLight(0x9cc4ff, 1.1); rim.position.set(7, 6, -5); sc.add(rim);
    const fill = new T.PointLight(0xfff0dc, 7, 40, 1.6); fill.position.set(2, 7, 9); sc.add(fill);
  };
  /* dark studio for molecules / orbitals / lattices */
  P3D.envs.studio = function (S, o) {
    const sc = S.scene, c = U.cv(4, 256), g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, o.top || "#0c1426"); gr.addColorStop(1, o.bottom || "#03060d"); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
    const bg = new T.CanvasTexture(c); bg.colorSpace = T.SRGBColorSpace; sc.background = bg;
    sc.add(new T.HemisphereLight(0xb0c8ff, 0x1a1c30, 0.5));
    const k = new T.DirectionalLight(0xffffff, 2.4); k.position.set(4, 8, 7); sc.add(k);
    const f = new T.DirectionalLight(0x6c9bff, 0.9); f.position.set(-7, 2, 3); sc.add(f);
    const r = new T.DirectionalLight(0xffa874, 1.1); r.position.set(-2, 4, -8); sc.add(r);
    sc.environmentIntensity = o.envI == null ? 0.7 : o.envI;
  };

  /* ================= host: mounts a registered scene into the lab page ================= */
  const css = `
.c3-stage{position:relative;width:100%;aspect-ratio:16/10;border-radius:14px;overflow:hidden;background:#0b1220;cursor:grab;touch-action:pan-y pinch-zoom;user-select:none;box-shadow:0 8px 28px rgba(0,0,0,.35)}
.c3-stage.grabbing{cursor:grabbing}
.c3-hud{width:100%;height:100%;display:block}
.c3-stage .orbit-hint{position:absolute;right:12px;bottom:10px;z-index:3;font:600 9.5px 'IBM Plex Mono',monospace;letter-spacing:.06em;color:#dbe7ff;background:rgba(6,12,24,.55);padding:4px 8px;border-radius:7px;pointer-events:none;transition:opacity .6s;opacity:.85}
.c3-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px}
.c3-bar button,.c3-bar select{font:600 11px 'IBM Plex Mono',monospace!important;color:#e8f1ff!important;background:rgba(18,28,48,.92)!important;border:1px solid rgba(255,255,255,.18)!important;border-radius:8px!important;padding:6px 10px!important;cursor:pointer;width:auto!important;box-shadow:none!important;margin:0!important;height:auto!important}
.c3-bar button:hover{background:rgba(40,60,100,.95)!important}.c3-bar .sp{flex:1}
.c3-bar .lbl{font:600 10px 'IBM Plex Mono',monospace;color:#8fa4c8;letter-spacing:.08em;text-transform:uppercase}
.c3-steps{margin:10px 0;padding:10px 12px;border-radius:10px;background:rgba(20,30,50,.6);border:1px solid rgba(255,255,255,.12);font:12px/1.45 'IBM Plex Sans',sans-serif;color:#dbe6f7}
.c3-steps h4{margin:0 0 6px;font:700 10.5px 'IBM Plex Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:#8fb4ff}
.c3-steps ol{margin:0;padding-left:0;list-style:none}.c3-steps li{padding:3px 0 3px 22px;position:relative;opacity:.55}
.c3-steps li::before{content:"○";position:absolute;left:2px;color:#8fa4c8}
.c3-steps li.done{opacity:.8}.c3-steps li.done::before{content:"✓";color:#5bd68c}
.c3-steps li.now{opacity:1;color:#fff;font-weight:600}.c3-steps li.now::before{content:"▶";color:#ffd27a}
.c3-table{width:100%;border-collapse:collapse;margin:8px 0;font:11.5px 'IBM Plex Mono',monospace;color:#dbe6f7}
.c3-table th,.c3-table td{border:1px solid rgba(255,255,255,.14);padding:4px 6px;text-align:right}.c3-table th{color:#8fb4ff;background:rgba(40,60,100,.35)}
.c3-table tr.ok td{color:#5bd68c}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  let active = null;
  C3.unmount = function () {
    if (!active) return; const a = active; active = null;
    cancelAnimationFrame(a.raf); try { P3D.end(); } catch (e) { }
    a.stage.remove(); a.bar.remove(); a.extra.forEach((n) => n.remove());
  };

  /* H = helpers from the page: {$, sliderControl, selectControl, buttonControl, readout, noteBox} */
  C3.mount = function (wrapEl, controlsEl, name, H) {
    const sc = C3.scenes[name]; if (!sc) return null;
    C3.unmount();
    const stage = H.$("div", { class: "c3-stage" }), hud = H.$("canvas", { class: "c3-hud", width: 640, height: 400 });
    stage.appendChild(hud); wrapEl.appendChild(stage);
    const variant = { state: sc.state ? sc.state() : {}, values: Object.assign({}, sc.values), modeName: "chem:" + name, label: H.label || sc.title };
    let ok = false; try { ok = P3D.begin(variant, sc, hud); } catch (e) { console.error("chem3d begin failed", e); ok = false; }
    if (!ok) { stage.remove(); try { P3D.end(); } catch (e) { } return null; }
    const S = P3D.S, s = variant.state, c = variant.values, ctx = hud.getContext("2d"), extra = [];
    const run = { playing: !P3D.reducedMotion(), speed: 1 }; // reduced motion: start paused, Play is one click away
    /* transport bar */
    const bar = H.$("div", { class: "c3-bar" });
    const bPlay = H.$("button", { title: "Pause / play" }, run.playing ? "❚❚ Pause" : "▶ Play");
    bPlay.addEventListener("click", () => { run.playing = !run.playing; bPlay.textContent = run.playing ? "❚❚ Pause" : "▶ Play"; });
    const sel = H.$("select", { title: "Playback speed" });
    [["0.25×", 0.25], ["0.5×", 0.5], ["1×", 1], ["2×", 2]].forEach(([l, v]) => { const o = H.$("option", { value: v }, l); if (v === 1) o.setAttribute("selected", "selected"); sel.appendChild(o); });
    sel.addEventListener("change", () => { run.speed = parseFloat(sel.value); });
    const bReset = H.$("button", { title: "Reset the experiment" }, "⟲ Reset");
    bReset.addEventListener("click", () => { sc.reset && sc.reset(S, s, c); refreshControls(); });
    bar.appendChild(bPlay); bar.appendChild(H.$("span", { class: "lbl" }, "speed")); bar.appendChild(sel); bar.appendChild(bReset);
    if (sc.views && sc.views.length) {
      bar.appendChild(H.$("span", { class: "sp" })); bar.appendChild(H.$("span", { class: "lbl" }, "view"));
      sc.views.forEach((v) => { const b = H.$("button", {}, v.label); b.addEventListener("click", () => C3.setView(S, { cam: typeof v.cam === "function" ? v.cam(S, s, c) : v.cam })); bar.appendChild(b); });
    }
    wrapEl.appendChild(bar);
    /* controls */
    const syncers = [];
    function refreshControls() { syncers.forEach((f) => f()); }
    (sc.controls || []).forEach((cc) => {
      if (cc.type === "select") {
        const el = H.selectControl({ label: cc.label, options: cc.options, value: c[cc.key], onChange: (v) => { c[cc.key] = isNaN(+v) ? v : +v; sc.onChange && sc.onChange(S, s, c, cc.key, refreshControls); } });
        controlsEl.appendChild(el); const sl = el.querySelector("select"); syncers.push(() => { sl.value = String(c[cc.key]); });
      } else if (cc.type === "button") {
        controlsEl.appendChild(H.buttonControl(cc.label, () => cc.action(S, s, c, refreshControls), cc.cls || ""));
      } else if (cc.type === "toggle") {
        const b = H.buttonControl("", () => { c[cc.key] = c[cc.key] ? 0 : 1; paint(); sc.onChange && sc.onChange(S, s, c, cc.key, refreshControls); }, "secondary");
        const paint = () => { b.textContent = (c[cc.key] ? "☑ " : "☐ ") + cc.label; }; paint(); syncers.push(paint); controlsEl.appendChild(b);
      } else {
        const el = H.sliderControl({ label: cc.label, min: cc.min, max: cc.max, step: cc.step, value: c[cc.key], unit: cc.unit || "", onInput: (v) => { c[cc.key] = v; sc.onChange && sc.onChange(S, s, c, cc.key, refreshControls); } });
        controlsEl.appendChild(el); const inp = el.querySelector("input"), val = el.querySelector(".ctl-val");
        syncers.push(() => { inp.value = c[cc.key]; val.textContent = c[cc.key] + (cc.unit || ""); });
      }
    });
    const ro = H.readout([]); controlsEl.appendChild(ro);
    let steps = null;
    if (sc.steps) { steps = H.$("div", { class: "c3-steps" }); wrapEl.appendChild(steps); extra.push(steps); }
    let tbl = null; if (sc.table) { tbl = H.$("div", {}); wrapEl.appendChild(tbl); extra.push(tbl); }
    if (sc.note) controlsEl.appendChild(H.noteBox(sc.note));
    extra.push(ro);
    /* single animation loop */
    let last = null, acc = 0, roKey = "";
    const handle = { S, s, c, run, hud, stage, bar, extra, raf: 0, scene: sc };
    active = handle;
    function loop(t) {
      if (active !== handle) return;
      if (last === null) last = t; const dt = Math.min((t - last) / 1000, 0.05); last = t;
      ctx.clearRect(0, 0, 640, 400);
      P3D.frame(dt, run.playing, run.speed);
      sc.overlay && sc.overlay(ctx, s, c, 640, 400, P3D.S);
      acc += dt;
      if (acc > 0.12) {
        acc = 0;
        const items = sc.readouts ? sc.readouts(s, c) : [], key = JSON.stringify(items);
        if (key !== roKey) { roKey = key; ro.innerHTML = ""; items.forEach(([l, v]) => ro.appendChild(H.$("div", { class: "readout-item" }, H.$("div", { class: "ro-label" }, l), H.$("div", { class: "ro-val" }, String(v))))); }
        if (steps && sc.steps) {
          const st2 = sc.steps(s, c), k2 = JSON.stringify(st2);
          if (steps._k !== k2) { steps._k = k2; steps.innerHTML = "<h4>Procedure</h4><ol>" + st2.map(([txt, state]) => `<li class="${state}">${txt}</li>`).join("") + "</ol>"; }
        }
        if (tbl && sc.table) { const h = sc.table(s, c); if (tbl._k !== h) { tbl._k = h; tbl.innerHTML = h; } }
      }
      handle.raf = requestAnimationFrame(loop);
    }
    handle.raf = requestAnimationFrame(loop);
    return () => { if (active === handle) C3.unmount(); };
  };

  /* smooth camera move to a named view {cam:[[pos],[target]]} */
  C3.setView = function (S, v) {
    const o = S.orbit, tg = V3(...v.cam[1]), d = V3(...v.cam[0]).sub(tg), r = d.length();
    o.touched = true; o.home.target.copy(tg); o.target.copy(tg); o.tr = r; o.home.r = r;
    o.ty = o.home.yaw = Math.atan2(d.x, d.z); o.tp = o.home.pitch = Math.asin(d.y / r);
  };
})();
