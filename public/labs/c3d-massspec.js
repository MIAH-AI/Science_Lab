/* c3d-massspec.js — chemistry 3D, new module: mass spectrometer (relative atomic mass from isotope abundances) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  /* isotopes: [mass number, % abundance] */
  const EL = {
    Cl: { n: "Chlorine", iso: [[35, 75.8], [37, 24.2]], Ar: 35.5 },
    Br: { n: "Bromine", iso: [[79, 50.7], [81, 49.3]], Ar: 79.9 },
    Mg: { n: "Magnesium", iso: [[24, 79.0], [25, 10.0], [26, 11.0]], Ar: 24.3 },
    Ne: { n: "Neon", iso: [[20, 90.5], [21, 0.3], [22, 9.2]], Ar: 20.2 },
    Cu: { n: "Copper", iso: [[63, 69.2], [65, 30.8]], Ar: 63.5 },
    Li: { n: "Lithium", iso: [[6, 7.5], [7, 92.5]], Ar: 6.9 },
    Ar: { n: "Argon", iso: [[36, 0.3], [38, 0.1], [40, 99.6]], Ar: 39.9 },
  };
  const COL = ["#ffd27a", "#7dd3ff", "#ff8fb1"], COLH = [0xffd27a, 0x7dd3ff, 0xff8fb1];
  const AMU = 1.66054e-27, QE = 1.60218e-19;
  const radiusM = (m, V, B) => Math.sqrt(2 * m * AMU * V / QE) / B; /* r = (1/B)·sqrt(2mV/q) */
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const X0 = -3.0, NPT = 48;

  function geom(s, c) {
    const e = EL[c.el], rs = e.iso.map((q) => radiusM(q[0], c.V, c.B) * 100); const rm = rs.reduce((a, b) => a + b, 0) / rs.length; /* cm */
    const rd = rs.map((r) => clamp((rm + 4 * (r - rm)) / 6, 0.12, 2.1)); /* display units: 6 cm per unit, separation x4 */
    return { rs, rd };
  }

  C3.scenes.massSpec = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.8, fov: 36, free: true, cam: [[0.4, 0.9, 9.8], [1.0, 0.6, 0]],
    values: { el: "Cl", V: 2000, B: 0.5 },
    state: () => ({ t: 0, hits: [0, 0, 0], ph: [0, 0.33, 0.66], lastSig: "" }),
    get controls() {
      return [
        { type: "select", key: "el", label: "Element sample", options: Object.keys(EL).map((k) => ({ value: k, label: EL[k].n + " (" + k + ")" })) },
        { type: "range", key: "V", label: "Accelerating voltage V (V)", min: 500, max: 5000, step: 100, unit: " V" },
        { type: "range", key: "B", label: "Magnetic flux density B (T)", min: 0.2, max: 1.0, step: 0.05, unit: " T" },
        { type: "button", label: "Clear detector", cls: "secondary", action: (S, s) => { s.hits = [0, 0, 0]; } },
      ];
    },
    views: [{ label: "Front", cam: [[0.4, 0.9, 9.8], [1.0, 0.6, 0]] }, { label: "Top-down", cam: [[1.0, 8.5, 3.5], [1.0, 0.2, 0.0]] }],
    note: "A mass spectrometer measures relative atomic mass. The sample is vaporised and ionised to X⁺ (electron bombardment), accelerated through a voltage V, then deflected by a magnetic field B. Lighter ions bend more; the radius is r = (1/B)·√(2mV/q). The detector records each isotope's mass number (position) and its relative abundance (height of the peak). Relative atomic mass Ar = Σ (mass number × % abundance) ÷ 100. Visual note: the arc separations are magnified about 4× so the isotopes can be told apart on screen; radii in the readouts are the real values for the chosen V and B.",
    onChange(S, s, c, key) { s.hits = [0, 0, 0]; },
    reset(S, s, c) { Object.assign(c, { el: "Cl", V: 2000, B: 0.5 }); s.hits = [0, 0, 0]; },
    table(s, c) {
      const e = EL[c.el], g = geom(s, c), Ar = e.iso.reduce((a, q) => a + q[0] * q[1], 0) / e.iso.reduce((a, q) => a + q[1], 0);
      return '<table class="c3-table"><tr><th style="text-align:left">Isotope</th><th>mass number</th><th>abundance %</th><th>m × %</th><th>radius r / cm</th></tr>' + e.iso.map((q, i) => '<tr><td style="text-align:left">' + q[0] + c.el + "⁺</td><td>" + q[0] + "</td><td>" + q[1] + "</td><td>" + (q[0] * q[1]).toFixed(1) + "</td><td>" + g.rs[i].toFixed(2) + "</td></tr>").join("") + '<tr><td colspan="3" style="text-align:left"><b>Relative atomic mass</b></td><td colspan="2"><b>' + Ar.toFixed(2) + "</b> (accepted " + e.Ar + ")</td></tr></table>";
    },
    build(S, s, c) {
      s.K = C3.kit(S);
      S.mk.box(9.5, 0.12, 4, M.matte(0x1d222b, 0.7), 1.0, -2.5, 0);
      s.bfield = new T.Mesh(new T.PlaneGeometry(5.6, 3.1), new T.MeshBasicMaterial({ color: 0x3a6cff, transparent: true, opacity: 0.1, depthWrite: false, side: T.DoubleSide })); s.bfield.position.set(X0 + 2.5, 1.15, -0.2); S.scene.add(s.bfield);
      /* source + accelerating plates + detector plate */
      S.mk.box(0.5, 0.35, 0.5, M.matte(0x8a6a3a, 0.5), X0, -2.2, 0); s.src = S.mk.sphere(0.12, M.glow ? M.glow(0xffe08a) : M.matte(0xffe08a, 0.4), X0, -1.9, 0);
      S.mk.box(0.7, 0.05, 0.45, M.steel(), X0, -1.4, 0); S.mk.box(0.7, 0.05, 0.45, M.steel(), X0, -0.8, 0); S.mk.box(0.7, 0.06, 0.6, M.steel(), X0, 0.0, 0).visible = false;
      S.mk.box(5.6, 0.06, 0.5, M.matte(0x55606e, 0.4), X0 + 2.5, -0.03, 0); s.bars = [0, 1, 2].map((i) => S.mk.box(0.12, 1, 0.3, M.matte(COLH[i], 0.35), 0, -0.5, 0.0));
      s.lines = [0, 1, 2].map((i) => { const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(new Float32Array(NPT * 3), 3)); const l = new T.Line(g, new T.LineBasicMaterial({ color: COLH[i], transparent: true, opacity: 0.55 })); l.frustumCulled = false; S.scene.add(l); return l; });
      s.ions = []; for (let i = 0; i < 3; i++) { for (let k = 0; k < 5; k++) { const m = S.mk.sphere(0.075, M.matte(COLH[i], 0.3), 0, 0, 0); s.ions.push({ m, i, k }); } }
    },
    update(S, s, c, dt) {
      const e = EL[c.el], g = geom(s, c), n = e.iso.length, sig = c.el + c.V + c.B; s.g = g; const L0 = 1.9;
      for (let i = 0; i < 3; i++) {
        const on = i < n; s.lines[i].visible = on; s.bars[i].visible = on;
        if (!on) continue; const r = g.rd[i], pos = s.lines[i].geometry.attributes.position, tot = L0 + Math.PI * r;
        for (let j = 0; j < NPT; j++) { const u = (j / (NPT - 1)) * tot; let x, y; if (u < L0) { x = X0; y = -1.9 + u; } else { const a = (u - L0) / r; x = X0 + r - r * Math.cos(a); y = r * Math.sin(a); } pos.setXYZ(j, x, y, 0); } pos.needsUpdate = true;
        const hh = 0.02 + 1.4 * (s.hits[i] / 40) * (e.iso[i][1] / 100); s.bars[i].scale.set(1, hh, 1); s.bars[i].position.set(X0 + 2 * r, -0.03 - hh / 2, 0);
      }
      if (dt > 0) s.t += dt;
      s.ions.forEach((q) => {
        if (q.i >= n) { q.m.visible = false; return; } q.m.visible = true; const r = g.rd[q.i], tot = L0 + Math.PI * r, sp = 2.0 * (0.8 + 0.4 * Math.sqrt(c.V / 2000));
        const prev = q.u === undefined ? q.k * 0.2 * 4 : q.u; let u = prev + (dt > 0 ? sp * dt : 0); if (u >= tot) { u -= tot; s.hits[q.i] = Math.min(40, s.hits[q.i] + 1); } q.u = u;
        let x, y; if (u < L0) { x = X0; y = -1.9 + u; } else { const a = (u - L0) / r; x = X0 + r - r * Math.cos(a); y = r * Math.sin(a); } q.m.position.set(x, y, 0); const sc = e.iso[q.i][1] < 1 ? 0.5 : 1; q.m.scale.setScalar(sc);
      });
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250, e = EL[c.el], g = s.g || geom(s, c), tot = e.iso.reduce((a, q) => a + q[1], 0), Ar = e.iso.reduce((a, q) => a + q[0] * q[1], 0) / tot;
      H.pill(ctx, 10, 22, "Mass spectrometer: " + e.n, "#ffe9b8", 11); H.pill(ctx, 10, 44, "r = (1/B)·√(2mV/q)   lighter ions bend more", "#9fe3ff", 9.5);
      const lab = (x, y, t, col) => { const q = S.proj(V3(x, y, 0)); H.pill(ctx, q.x, q.y, t, col || "#bcd0ea", 8, "center"); };
      lab(X0, -2.55, "ion source", "#ffe9b8"); lab(X0 - 0.2, -1.1, "accelerating V", "#bcd0ea"); lab(X0 + 1.4, 2.5, "B into the page ⊗", "#9fb8ff"); lab(X0 + 2.8, -0.55, "detector", "#bcd0ea");
      e.iso.forEach((q, i) => { const p = S.proj(V3(X0 + 2 * g.rd[i], 0.0, 0)); H.pill(ctx, p.x, p.y + 12 + (i % 2) * 11, q[0] + "", COL[i], 8.5, "center"); });
      /* spectrum */
      const gx = px, gy = 58, gw = 240, gh = 130; H.panel(ctx, gx, gy, gw, gh); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Mass spectrum of " + c.el, gx + 8, gy + 14); const mn = e.iso[0][0] - 2, mx = e.iso[e.iso.length - 1][0] + 2, X0p = gx + 24, PW = gw - 36, Y0 = gy + gh - 22, PH = gh - 50;
      ctx.strokeStyle = "rgba(143,180,255,0.4)"; ctx.beginPath(); ctx.moveTo(X0p, Y0); ctx.lineTo(X0p + PW, Y0); ctx.moveTo(X0p, Y0); ctx.lineTo(X0p, Y0 - PH); ctx.stroke();
      e.iso.forEach((q, i) => { const x = X0p + ((q[0] - mn) / (mx - mn)) * PW, hh = PH * (q[1] / 100); ctx.fillStyle = COL[i]; ctx.fillRect(x - 3, Y0 - Math.max(hh, 1.5), 6, Math.max(hh, 1.5)); ctx.fillStyle = "#e8f0ff"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.textAlign = "center"; ctx.fillText(q[0], x, Y0 + 11); ctx.fillText(q[1] + "%", x, Y0 - Math.max(hh, 1.5) - 3); ctx.textAlign = "left"; });
      ctx.fillStyle = "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText("abundance %", gx + 8, gy + 26); ctx.textAlign = "right"; ctx.fillText("m/z", gx + gw - 6, gy + gh - 4); ctx.textAlign = "left";
      /* Ar calc */
      H.panel(ctx, px, 194, 240, 112); ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText("Ar = Σ(m × %) ÷ 100", px + 8, 210); ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#9fb2d2"; const terms = e.iso.map((q) => "(" + q[0] + "×" + q[1] + ")").join(" + "); wrapT(ctx, terms + " ÷ " + tot.toFixed(0), px + 8, 224, 224, 10.5); ctx.font = "600 11px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#ffd27a"; ctx.fillText("Ar = " + Ar.toFixed(2) + "  ≈ " + Ar.toFixed(1), px + 8, 262); ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#9fb2d2"; ctx.fillText("accepted value: " + e.Ar, px + 8, 278); ctx.restore();
    },
    readouts(s, c) {
      const e = EL[c.el], g = s.g || geom(s, c), tot = e.iso.reduce((a, q) => a + q[1], 0), Ar = e.iso.reduce((a, q) => a + q[0] * q[1], 0) / tot;
      return [["Element", e.n + " — " + e.iso.length + " isotopes"], ["V / B", c.V + " V,  " + c.B.toFixed(2) + " T"], ...e.iso.map((q, i) => ["r for " + q[0] + c.el + "⁺", g.rs[i].toFixed(2) + " cm  (detector at 2r = " + (2 * g.rs[i]).toFixed(1) + " cm)"]), ["Relative atomic mass", Ar.toFixed(2)], ["Rule", "r ∝ √(m V) ÷ B, so heavier ions bend less"]];
    },
    steps(s, c) { return [["Ionise and accelerate the sample", "done"], ["Deflect the ions in the magnetic field", "done"], ["Read the peaks: position = mass number, height = abundance", "now"], ["Calculate Ar = Σ(m × %) ÷ 100", ""]]; },
  };
})();
