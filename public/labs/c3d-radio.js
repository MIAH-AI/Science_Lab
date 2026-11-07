/* c3d-radio.js — chemistry 3D, batch D (part 1): radioactivity & half-life (stochastic decay, Geiger counter) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ISO = {
    I131: { name: "Iodine-131", hl: 8.02, u: "days", mode: "β⁻", daughter: "xenon-131", eq: "¹³¹₅₃I → ¹³¹₅₄Xe + ⁰₋₁e", use: "thyroid treatment and imaging" },
    C14: { name: "Carbon-14", hl: 5730, u: "years", mode: "β⁻", daughter: "nitrogen-14", eq: "¹⁴₆C → ¹⁴₇N + ⁰₋₁e", use: "radiocarbon dating of once-living material" },
    Ra226: { name: "Radium-226", hl: 1600, u: "years", mode: "α", daughter: "radon-222", eq: "²²⁶₈₈Ra → ²²²₈₆Rn + ⁴₂He", use: "old luminous paint; a source of radon" },
    Co60: { name: "Cobalt-60", hl: 5.27, u: "years", mode: "β⁻ + γ", daughter: "nickel-60", eq: "⁶⁰₂₇Co → ⁶⁰₂₈Ni + ⁰₋₁e + γ", use: "radiotherapy and sterilising food and equipment" },
    Tc99m: { name: "Technetium-99m", hl: 6.01, u: "hours", mode: "γ", daughter: "technetium-99", eq: "⁹⁹ᵐ₄₃Tc → ⁹⁹₄₃Tc + γ", use: "medical imaging (short half-life limits the dose)" },
    U238: { name: "Uranium-238", hl: 4.468e9, u: "years", mode: "α", daughter: "thorium-234", eq: "²³⁸₉₂U → ²³⁴₉₀Th + ⁴₂He", use: "dating rocks; start of a long decay series" },
  };
  const GRIDS = { 3: 27, 5: 125, 6: 216, 8: 512 }, SP = 0.5, CX = -2.4, CY = 1.55, GX = 2.6, GY = 0.55;
  const fmtN = (v) => (v >= 1e6 ? v.toExponential(2) : v >= 100 ? v.toFixed(0) : v.toFixed(1));

  C3.scenes.radioactivity = {
    env: "studio", envOpts: { top: "#0a1020", bottom: "#02040a" }, envI: 0.55, fov: 36, free: true, cam: [[0.2, 3.4, 11.2], [0.2, 2.0, 0]],
    values: { iso: "I131", g: 6, rate: 0.25, th: 1 },
    state: () => ({ t: 0, hist: [], counts: 0, cps: [], alive: null }),
    controls: [
      { type: "select", key: "iso", label: "Radioactive isotope", options: Object.keys(ISO).map((k) => ({ value: k, label: ISO[k].name + "  (t½ = " + ISO[k].hl + " " + ISO[k].u + ")" })) },
      { type: "select", key: "g", label: "Number of nuclei in the sample", options: Object.keys(GRIDS).map((k) => ({ value: k, label: GRIDS[k] + " nuclei" })) },
      { type: "range", key: "rate", label: "Time-lapse (half-lives per second)", min: 0.05, max: 1, step: 0.05 },
      { type: "toggle", key: "th", label: "Show the theoretical curve N = N₀(½)^(t/t½)" },
      { type: "button", label: "Fresh sample (restart)", action: (S, s, c) => init(s, c) },
    ],
    views: [{ label: "Sample + counter", cam: [[0.2, 3.4, 11.2], [0.2, 2.0, 0]] }, { label: "Close to the nuclei", cam: [[-2.4, 2.4, 5.6], [-2.4, 1.5, 0]] }, { label: "Counter", cam: [[2.8, 1.6, 5.4], [2.8, 0.6, 0]] }],
    note: "Each nucleus decays at random, but a large sample decays predictably: after every half-life the number of undecayed nuclei halves, whatever the starting amount — N = N₀(½)^(t/t½). With few nuclei the curve is ragged; with many it follows the smooth theory curve. Alpha particles are helium nuclei; beta particles are fast electrons; gamma rays are electromagnetic waves.",
    onChange(S, s, c, key) { if (key === "iso" || key === "g") init(s, c); },
    reset(S, s, c) { Object.assign(c, { iso: "I131", g: 6, rate: 0.25, th: 1 }); init(s, c); },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K;
      S.mk.cyl(2.6, 2.7, 0.16, M.matte(0x1a2030, 0.4), CX, 0.02, 0);
      S.mk.cyl(0.14, 0.14, 0.7, M.steel(), CX, 0.45, 0); S.mk.cyl(1.9, 1.95, 0.05, M.matte(0x252d42, 0.35), CX, 0.12, 0);
      /* geiger counter: tube along z at x = GX + a counter box */
      const tube = new T.Mesh(new T.CylinderGeometry(0.32, 0.32, 2.4, 28), M.steel()); tube.rotation.x = Math.PI / 2; tube.position.set(GX + 0.35, GY, 0); tube.castShadow = true; S.scene.add(tube);
      const win = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.04, 28), M.matte(0xd9b36a, 0.5)); win.rotation.z = Math.PI / 2; win.position.set(GX, GY, 0); S.scene.add(win);
      S.mk.rbox(1.3, 0.9, 1.2, 0.1, M.paint(0x3a4a66), GX + 1.5, 0.45, 0); S.mk.rbox(0.9, 0.34, 0.04, 0.02, M.matte(0x0b1a10, 0.35), GX + 1.5, 0.6, 0.62); S.mk.rod(V3(GX + 0.7, GY, 0), V3(GX + 1.0, 0.5, 0), 0.04, M.paint(0x222222));
      s.inst = new T.InstancedMesh(new T.SphereGeometry(0.2, 18, 14), new T.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 0.6, emissive: 0xff6a1a, emissiveIntensity: 0.3 }), 512); s.inst.frustumCulled = false; S.scene.add(s.inst);
      s.pIm = new T.InstancedMesh(new T.SphereGeometry(1, 12, 8), new T.MeshBasicMaterial({ color: 0xffffff }), 48); s.pIm.frustumCulled = false; S.scene.add(s.pIm); s.pr = []; for (let i = 0; i < 48; i++) s.pr.push({ on: false });
      s.flash = S.mk.soft(0xffe08a, 1.2, GX + 0.4, GY, 0, 0); s.m4 = new T.Matrix4(); s.col = new T.Color(); init(s, c);
    },
    update(S, s, c, dt) {
      const iso = ISO[c.iso], N0 = s.n;
      if (dt > 0 && s.t < 7) { const d = dt * c.rate, pDec = 1 - Math.pow(0.5, d); s.t += d; for (let i = 0; i < N0; i++) if (s.alive[i] && Math.random() < pDec) { s.alive[i] = 0; emit(s, i, iso); } if (s.t - s.last >= 0.05 || !s.hist.length) { s.last = s.t; s.hist.push([s.t, s.alive.reduce((a, b) => a + b, 0) / N0]); } }
      s.left = s.alive.reduce((a, b) => a + b, 0);
      const colP = new T.Color(0xff8a3a), colD = new T.Color(0x56627a);
      for (let i = 0; i < 512; i++) {
        if (i >= N0) { s.m4.makeScale(0, 0, 0); s.inst.setMatrixAt(i, s.m4); continue; }
        const p = s.pos[i], rr = (s.alive[i] ? 1 : 0.62) * s.sf; s.m4.makeScale(rr, rr, rr); s.m4.setPosition(p.x, p.y, p.z); s.inst.setMatrixAt(i, s.m4); s.col.copy(s.alive[i] ? colP : colD); s.inst.setColorAt(i, s.col);
      }
      s.inst.instanceMatrix.needsUpdate = true; s.inst.instanceColor && (s.inst.instanceColor.needsUpdate = true);
      /* radiation flying out; counter clicks when a particle crosses the tube window */
      s.cps = s.cps.filter((t) => S.t - t < 2); let click = 0;
      s.pr.forEach((q, i) => {
        if (!q.on) { s.m4.makeScale(0, 0, 0); s.pIm.setMatrixAt(i, s.m4); return; }
        if (dt > 0) { const px = q.p.x; q.p.addScaledVector(q.v, dt * 1.0); q.age += dt; if (px < GX && q.p.x >= GX && Math.abs(q.p.y - GY) < 0.32 && Math.abs(q.p.z) < 1.1) { s.counts++; s.cps.push(S.t); click = 1; } if (q.p.x > 6.2 || q.age > 3 || Math.abs(q.p.y) > 6 || Math.abs(q.p.z) > 6) q.on = false; }
        const r = q.r; s.m4.makeScale(r, r, r); s.m4.setPosition(q.p.x, q.p.y, q.p.z); s.pIm.setMatrixAt(i, s.m4); s.col.set(q.col); s.pIm.setColorAt(i, s.col);
      });
      s.pIm.instanceMatrix.needsUpdate = true; s.pIm.instanceColor && (s.pIm.instanceColor.needsUpdate = true);
      s.fl = click ? 1 : (s.fl || 0) * Math.exp(-dt * 10); s.flash.material.opacity = s.fl * 0.9;
    },
    overlay(ctx, s, c, w, h, S) {
      const iso = ISO[c.iso]; if (!s.hist) return;
      H.pill(ctx, 10, 22, iso.eq, "#ffe9b8", 11.5); H.pill(ctx, 10, 44, "N = N₀ (½)^(t / t½)     activity A = λN     λ = ln 2 ÷ t½", "#bcd0ea", 10);
      const ql = S.proj(V3(CX, 3.0, 0)); H.pill(ctx, ql.x, clamp(ql.y, 64, 120), "● undecayed   ● daughter nucleus", "#dbe7ff", 9.5, "center");
      const qc = S.proj(V3(GX + 1.5, 0.6, 0.65)); H.pill(ctx, qc.x, qc.y + 4, s.counts + " counts", "#7dff9d", 10.5, "center");
      const qg = S.proj(V3(GX + 0.4, GY + 0.7, 0)); H.pill(ctx, qg.x - 20, qg.y + 52, "Geiger–Müller tube", "#cfe0ff", 9.5, "center");
      /* decay graph */
      const gx = 396, gy = 56, gw = 240, gh = 156, xm = 6, X0 = gx + 34, Y0 = gy + 16, PW = gw - 46, PH = gh - 40, th = [];
      for (let t = 0; t <= xm + 1e-9; t += 0.1) th.push([t, Math.pow(0.5, t)]);
      const series = []; if (c.th) series.push({ pts: th, color: "rgba(150,190,255,.7)", width: 1.6 }); series.push({ pts: s.hist, color: "#ffb347", width: 2.4 });
      H.graph(ctx, gx, gy, gw, gh, { series, xmin: 0, xmax: xm, ymin: 0, ymax: 1, ticksX: 6, ticksY: 4, xl: "time / half-lives", yl: "N ÷ N₀", dot: [Math.min(s.t, xm), s.left / s.n, "#ffd27a"] });
      ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = "rgba(255,255,255,.28)"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#bcd0ea"; ctx.textAlign = "left"; [1, 2, 3].forEach((k) => { const y = Y0 + PH - Math.pow(0.5, k) * PH, x = X0 + (k / xm) * PW; ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(x, y); ctx.lineTo(x, Y0 + PH); ctx.stroke(); ctx.fillText(k === 1 ? "½" : k === 2 ? "¼" : "⅛", X0 + 3, y - 2); }); ctx.restore();
      H.pill(ctx, gx + gw, gy + gh + 17, s.n + " nuclei: " + (s.n < 60 ? "ragged (few nuclei)" : s.n < 300 ? "some scatter" : "close to theory"), "#bcd0ea", 9.5, "right");
      const real = s.t * iso.hl; H.pill(ctx, 10, 366, "t = " + s.t.toFixed(2) + " half-lives = " + fmtN(real) + " " + iso.u, "#ffd27a", 10.5); H.pill(ctx, 10, 386, "remaining " + s.left + " of " + s.n + "  (" + (100 * s.left / s.n).toFixed(1) + " %)   theory " + (100 * Math.pow(0.5, s.t)).toFixed(1) + " %", "#7dffbd", 10);
    },
    readouts(s, c) {
      const iso = ISO[c.iso]; if (!s.hist) return []; const frac = s.left / s.n, lam = Math.LN2 / iso.hl;
      const o = [["Isotope", iso.name + " · " + iso.mode + " decay → " + iso.daughter], ["Half-life t½", iso.hl + " " + iso.u], ["Time elapsed", s.t.toFixed(2) + " half-lives = " + fmtN(s.t * iso.hl) + " " + iso.u], ["Undecayed (measured)", s.left + " of " + s.n + " = " + (frac * 100).toFixed(1) + " %"], ["Undecayed (theory) ½^(t/t½)", (100 * Math.pow(0.5, s.t)).toFixed(1) + " %"], ["Decay constant λ = ln 2 ÷ t½", lam.toExponential(2) + " per " + iso.u.replace(/s$/, "")], ["Counter reading", s.counts + " counts · " + (s.cps.length / 2).toFixed(1) + " per s"], ["Uses", iso.use]];
      if (c.iso === "C14") o.push(["Radiocarbon age if the sample shows this much C-14", frac > 0 ? (Math.log(1 / frac) / Math.LN2 * iso.hl).toFixed(0) + " years" : "—"]);
      return o;
    },
    steps(s, c) { return [["Pick an isotope and a sample size; each orange sphere is a radioactive nucleus", "done"], ["Run the time-lapse: nuclei decay at random and emit α, β or γ radiation", s.t > 0.05 ? "done" : "now"], ["Read the time for the amount to fall to ½, then ¼: both equal one half-life apart", s.t > 1.05 ? "done" : s.t > 0.05 ? "now" : ""], ["Compare few nuclei with many: random scatter vs the smooth law", ""]]; },
  };
  function init(s, c) {
    const g = +c.g || 6, n = g * g * g; s.n = n; s.alive = new Uint8Array(n).fill(1); s.pos = []; s.t = 0; s.last = -1; s.hist = []; s.counts = 0; s.cps = []; s.left = n;
    const sp = 2.6 / g; s.sf = 2.1 * sp;
    for (let i = 0; i < g; i++) for (let j = 0; j < g; j++) for (let k = 0; k < g; k++) s.pos.push(V3(CX + (i - (g - 1) / 2) * sp, CY + (j - (g - 1) / 2) * sp, (k - (g - 1) / 2) * sp));
    s.pr && s.pr.forEach((q) => (q.on = false));
  }
  function emit(s, i, iso) {
    const q = s.pr.find((x) => !x.on); if (!q) return; const p = s.pos[i], towards = Math.random() < 0.35, d = towards ? V3(GX - p.x, GY - p.y + U.rnd(-0.2, 0.2), U.rnd(-0.3, 0.3)).normalize() : V3(U.rnd(-1, 1), U.rnd(-1, 1), U.rnd(-1, 1)).normalize();
    const a = iso.mode.indexOf("α") >= 0, b = iso.mode.indexOf("β") >= 0, gm = iso.mode.indexOf("γ") >= 0;
    const kind = a ? "a" : b && !(gm && Math.random() < 0.4) ? "b" : "g";
    Object.assign(q, { on: true, age: 0, p: p.clone(), v: d.multiplyScalar(kind === "a" ? 2.6 : kind === "b" ? 4.2 : 5.5), r: kind === "a" ? 0.1 : kind === "b" ? 0.055 : 0.04, col: kind === "a" ? 0xffd24a : kind === "b" ? 0x66d9ff : 0xffffff });
  }
})();
