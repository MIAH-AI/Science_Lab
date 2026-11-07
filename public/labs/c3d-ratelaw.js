/* c3d-ratelaw.js — chemistry 3D, new module: rate law and order of reaction (zero / first / second order, initial-rate challenge) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const NP = 140, BOX = 1.5; /* half-width of the particle box */
  const KUNIT = ["mol dm⁻³ s⁻¹", "s⁻¹", "dm³ mol⁻¹ s⁻¹"];
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const conc = (n, k, A0, t) => n === 0 ? Math.max(0, A0 - k * t) : n === 1 ? A0 * Math.exp(-k * t) : A0 / (1 + k * A0 * t);
  const rate = (n, k, A) => k * Math.pow(A, n);
  const half = (n, k, A0) => n === 0 ? A0 / (2 * k) : n === 1 ? Math.LN2 / k : 1 / (k * A0);
  const tmaxOf = (n, k, A0) => n === 0 ? 1.15 * A0 / k : clamp(4 * half(n, k, A0), 5, 400);
  const rateLawText = (n) => n === 0 ? "rate = k" : n === 1 ? "rate = k[A]" : "rate = k[A]²";

  C3.scenes.rateLaw = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.8, fov: 36, free: true, cam: [[1.4, 2.6, 8.8], [1.6, 1.6, 0]],
    values: { mode: "curve", n: 1, k: 0.1, A0: 1.0, sp: 1, aA0: 0.6, guess: 1 },
    state: () => ({ t: 0, run: true, tab: [], hid: 1, hk: 0.12, ready: false, msg: "" }),
    get controls() {
      return [
        { type: "select", key: "mode", label: "Mode", options: [{ value: "curve", label: "Explore order and curves" }, { value: "chal", label: "Challenge: find the order from initial rates" }] },
        { type: "select", key: "n", label: "Order of reaction in A", options: [{ value: 0, label: "Zero order" }, { value: 1, label: "First order" }, { value: 2, label: "Second order" }] },
        { type: "range", key: "k", label: "Rate constant k", min: 0.02, max: 0.5, step: 0.01 },
        { type: "range", key: "A0", label: "Initial concentration [A]₀ (mol dm⁻³)", min: 0.2, max: 1.0, step: 0.05, unit: " mol/dm³" },
        { type: "range", key: "sp", label: "Simulation speed (× real time)", min: 1, max: 10, step: 1, unit: "×" },
        { type: "button", label: "Run / pause", action: (S, s) => { s.run = !s.run; } },
        { type: "button", label: "Restart", cls: "secondary", action: (S, s) => { s.t = 0; s.run = true; } },
        { type: "select", key: "aA0", label: "Challenge: [A]₀ to test (mol dm⁻³)", options: [0.2, 0.4, 0.6, 0.8, 1.0].map((v) => ({ value: v, label: v.toFixed(1) })) },
        { type: "button", label: "Measure the initial rate", action: (S, s, c) => { const r = s.hk * Math.pow(c.aA0, s.hid) * (1 + 0.02 * (Math.random() - 0.5) * 2); if (!s.tab.some((q) => q[0] === c.aA0)) s.tab.push([c.aA0, r]); s.tab.sort((a, b) => a[0] - b[0]); s.msg = ""; } },
        { type: "select", key: "guess", label: "Challenge: your answer (order)", options: [{ value: 0, label: "0" }, { value: 1, label: "1" }, { value: 2, label: "2" }] },
        { type: "button", label: "Check my answer", action: (S, s, c) => { if (s.tab.length < 3) s.msg = "Take at least 3 measurements first"; else s.msg = c.guess === s.hid ? "Correct: order = " + s.hid : "Not quite: look at what happens to the rate when [A] doubles"; } },
        { type: "button", label: "New mystery reaction", cls: "secondary", action: (S, s) => { s.hid = Math.floor(Math.random() * 3); s.hk = [0.03, 0.08, 0.15][s.hid] * (0.7 + 0.6 * Math.random()); s.tab = []; s.msg = ""; } },
      ];
    },
    views: [{ label: "Front", cam: [[1.4, 2.6, 8.8], [1.6, 1.6, 0]] }, { label: "Close", cam: [[0.6, 2.2, 6.2], [0.8, 1.6, 0]] }],
    note: "The rate law links the rate to concentration: rate = k[A]ⁿ, where n is the order, found by experiment (never from the balanced equation). Zero order: rate is constant, [A] falls in a straight line, t½ = [A]₀/2k. First order: rate ∝ [A], [A] decays exponentially, t½ = ln2/k is constant. Second order: rate ∝ [A]², t½ = 1/(k[A]₀) grows as the reaction slows. In the challenge, double [A]₀ and watch the initial rate: unchanged → order 0; doubles → order 1; quadruples → order 2. The slope of the log–log graph equals the order. Particle counts show the concentration; their motion is only illustrative.",
    onChange(S, s, c, key) { if (key === "n" || key === "k" || key === "A0" || key === "mode") { s.t = 0; s.run = true; } },
    reset(S, s, c) { Object.assign(c, { mode: "curve", n: 1, k: 0.1, A0: 1.0, sp: 1, aA0: 0.6, guess: 1 }); s.t = 0; s.run = true; s.tab = []; s.msg = ""; },
    table(s, c) {
      const n = +c.n; const rows = [0, 0.5, 1, 2, 3].map((q) => { const t = q * half(n, c.k, c.A0), A = conc(n, c.k, c.A0, t); return "<tr><td>" + (q === 0 ? "start" : q + " × t½") + "</td><td>" + t.toFixed(1) + "</td><td>" + A.toFixed(3) + "</td><td>" + rate(n, c.k, A).toFixed(4) + "</td></tr>"; }).join("");
      return '<table class="c3-table"><tr><th style="text-align:left">Point</th><th>t / s</th><th>[A] / mol dm⁻³</th><th>rate / mol dm⁻³ s⁻¹</th></tr>' + rows + "</table>";
    },
    build(S, s, c) {
      S.mk.box(9, 0.1, 4, M.matte(0x1d222b, 0.7), 1.0, -0.05, 0);
      S.mk.rbox(3.6, 0.15, 3.6, 0.04, M.matte(0x2a2e36, 0.6), 0, 0.075, 0);
      const g = new T.BoxGeometry(BOX * 2, BOX * 2, BOX * 2); s.cube = new T.Mesh(g, new T.MeshPhysicalMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.1, roughness: 0.05, depthWrite: false })); s.cube.position.set(0, 0.15 + BOX, 0); S.scene.add(s.cube);
      s.edges = new T.LineSegments(new T.EdgesGeometry(g), new T.LineBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: 0.6 })); s.edges.position.copy(s.cube.position); S.scene.add(s.edges);
      s.mA = new T.InstancedMesh(new T.SphereGeometry(0.1, 14, 10), new T.MeshStandardMaterial({ color: 0x4aa8ff, roughness: 0.3, metalness: 0.1 }), NP); s.mB = new T.InstancedMesh(new T.SphereGeometry(0.085, 14, 10), new T.MeshStandardMaterial({ color: 0xffa040, roughness: 0.3 }), NP); s.mA.frustumCulled = false; s.mB.frustumCulled = false; S.scene.add(s.mA); S.scene.add(s.mB);
      s.p = []; for (let i = 0; i < NP; i++) s.p.push({ x: (Math.random() * 2 - 1) * (BOX - 0.15), y: (Math.random() * 2 - 1) * (BOX - 0.15), z: (Math.random() * 2 - 1) * (BOX - 0.15), vx: Math.random() * 2 - 1, vy: Math.random() * 2 - 1, vz: Math.random() * 2 - 1 });
      s.m4 = new T.Matrix4(); s.hid = 1; s.hk = 0.12;
    },
    update(S, s, c, dt) {
      const n = +c.n, chal = c.mode === "chal"; if (s.run && dt > 0) s.t += dt * c.sp; const A0 = chal ? c.aA0 : c.A0, A = chal ? A0 : conc(n, c.k, A0, s.t), tm = tmaxOf(n, c.k, A0); if (!chal && s.t > tm * 1.05) s.t = tm * 1.05;
      const nA = Math.round(NP * (A / 1.0)), nP = chal ? 0 : Math.min(NP - nA, Math.round(NP * (A0 - A) / 1.0)); s.nA = nA; s.nP = nP; s.A = A; s.tm = tm;
      let a = 0, b = 0; const m4 = s.m4, dts = Math.min(dt, 0.05);
      for (let i = 0; i < NP; i++) { const q = s.p[i]; if (dts > 0) { q.x += q.vx * dts * 1.3; q.y += q.vy * dts * 1.3; q.z += q.vz * dts * 1.3; const L = BOX - 0.12; if (Math.abs(q.x) > L) { q.vx = -q.vx; q.x = Math.sign(q.x) * L; } if (Math.abs(q.y) > L) { q.vy = -q.vy; q.y = Math.sign(q.y) * L; } if (Math.abs(q.z) > L) { q.vz = -q.vz; q.z = Math.sign(q.z) * L; } } m4.makeTranslation(q.x, 0.15 + BOX + q.y, q.z); if (i < nA) s.mA.setMatrixAt(a++, m4); else if (i < nA + nP) s.mB.setMatrixAt(b++, m4); }
      s.mA.count = a; s.mB.count = b; s.mA.instanceMatrix.needsUpdate = true; s.mB.instanceMatrix.needsUpdate = true;
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250, n = +c.n, chal = c.mode === "chal";
      if (!chal) {
        const A0 = c.A0, tm = s.tm || tmaxOf(n, c.k, A0), th = half(n, c.k, A0), N = 60, pts = [], rp = [];
        for (let i = 0; i <= N; i++) { const t = (tm * i) / N; pts.push([t, conc(n, c.k, A0, t)]); }
        for (let i = 0; i <= N; i++) { const a = (A0 * i) / N; rp.push([a, rate(n, c.k, a)]); }
        H.pill(ctx, 10, 22, ["Zero", "First", "Second"][n] + " order: " + rateLawText(n), "#ffe9b8", 11); H.pill(ctx, 10, 44, "t½ = " + (n === 0 ? "[A]₀/2k" : n === 1 ? "ln2/k" : "1/(k[A]₀)") + " = " + th.toFixed(1) + " s   k = " + c.k.toFixed(2) + " " + KUNIT[n], "#9fe3ff", 9.5);
        H.graph(ctx, px, 58, 240, 116, { series: [{ pts, color: "#4aa8ff", width: 2 }], xmin: 0, xmax: tm, ymin: 0, ymax: A0 * 1.05, ticksX: 4, ticksY: 3, xl: "t / s", yl: "[A] / mol dm⁻³", dot: [Math.min(s.t, tm), conc(n, c.k, A0, Math.min(s.t, tm)), "#ffd27a"] });
        const rmax = Math.max(rate(n, c.k, A0), 1e-6); H.graph(ctx, px, 180, 240, 116, { series: [{ pts: rp, color: "#ffa040", width: 2 }], xmin: 0, xmax: A0, ymin: 0, ymax: rmax * 1.1, ticksX: 4, ticksY: 3, xl: "[A] / mol dm⁻³", yl: "rate", dot: [s.A, rate(n, c.k, s.A), "#ffd27a"] });
        const q = S.proj(V3(0, 3.5, 0)); H.pill(ctx, q.x, q.y, "● A: " + (s.nA || 0) + "   ● product: " + (s.nP || 0), "#bcd0ea", 8.5, "center");
      } else {
        H.pill(ctx, 10, 22, "Challenge: find the order of the mystery reaction", "#ffe9b8", 11); H.pill(ctx, 10, 44, s.msg || "measure the initial rate at 3+ concentrations", s.msg.startsWith("Correct") ? "#8dffb8" : "#9fe3ff", 9.5);
        H.panel(ctx, px, 58, 240, 120); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("[A]₀ / mol dm⁻³      initial rate", px + 8, 73); ctx.font = "9px 'IBM Plex Mono',monospace"; s.tab.slice(0, 7).forEach((q, i) => { ctx.fillStyle = "#e8f0ff"; ctx.fillText(q[0].toFixed(1), px + 14, 90 + i * 13); ctx.fillText(q[1].toFixed(4) + " mol dm⁻³ s⁻¹", px + 86, 90 + i * 13); }); if (!s.tab.length) { ctx.fillStyle = "#9fb2d2"; ctx.fillText("no data yet", px + 14, 90); }
        const pts = s.tab.map((q) => [Math.log(q[0]), Math.log(q[1])]); let sl = null; if (pts.length >= 2) { const mx = pts.reduce((a, q) => a + q[0], 0) / pts.length, my = pts.reduce((a, q) => a + q[1], 0) / pts.length; let sxy = 0, sxx = 0; pts.forEach((q) => { sxy += (q[0] - mx) * (q[1] - my); sxx += (q[0] - mx) ** 2; }); sl = sxx > 0 ? sxy / sxx : null; }
        const ys = pts.map((q) => q[1]), y0 = ys.length ? Math.min(...ys) - 0.5 : -4, y1 = ys.length ? Math.max(...ys) + 0.5 : -1;
        H.graph(ctx, px, 184, 240, 116, { series: [{ pts: pts.length > 1 ? pts : [], color: "#ffa040", width: 1.5 }], xmin: Math.log(0.15), xmax: Math.log(1.1), ymin: y0, ymax: y1, ticksX: 3, ticksY: 3, xl: "ln[A]₀", yl: "ln(rate)" });
        const gx = px + 34, gy0 = 184 + 16, PW = 240 - 46, PH = 116 - 40; ctx.fillStyle = "#ffd27a"; pts.forEach((q) => { const x = gx + ((q[0] - Math.log(0.15)) / (Math.log(1.1) - Math.log(0.15))) * PW, y = gy0 + PH - ((q[1] - y0) / (y1 - y0)) * PH; ctx.beginPath(); ctx.arc(x, y, 3, 0, 6.3); ctx.fill(); });
        ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText(sl === null ? "slope = order (needs 2+ points)" : "slope ≈ " + sl.toFixed(2) + "  → order ≈ " + Math.round(sl), px + 8, 312);
      }
      ctx.restore();
    },
    readouts(s, c) {
      const n = +c.n; if (c.mode === "chal") return [["Task", "find n in rate = k[A]ⁿ"], ["Measurements", s.tab.length + " taken"], ["Method", "compare how the rate changes when [A]₀ doubles"], ["Slope of ln(rate) vs ln[A]₀", "equals the order"], ["Result", s.msg || "-"]];
      const th = half(n, c.k, c.A0); return [["Rate law", rateLawText(n)], ["Order", ["zero", "first", "second"][n]], ["k", c.k.toFixed(2) + " " + KUNIT[n]], ["[A] now", (s.A || c.A0).toFixed(3) + " mol dm⁻³"], ["Rate now", rate(n, c.k, s.A || c.A0).toFixed(4) + " mol dm⁻³ s⁻¹"], ["Half-life", th.toFixed(1) + " s" + (n === 1 ? " (constant)" : n === 0 ? " (shrinks as [A] falls)" : " (doubles each time)")], ["Time", (s.t || 0).toFixed(1) + " s"]];
    },
    steps(s, c) { return c.mode === "chal" ? [["Pick a starting concentration", "done"], ["Measure the initial rate", s.tab.length >= 3 ? "done" : "now"], ["Compare rates as [A]₀ doubles", s.tab.length >= 3 ? "now" : ""], ["Answer: zero, first or second order", s.msg.startsWith("Correct") ? "done" : ""]] : [["Choose the order and k", "done"], ["Watch [A] fall and the rate change", "now"], ["Read the half-life from the graph", ""], ["Switch to the challenge mode", ""]]; },
  };
})();
