/* c3d-hess.js — chemistry 3D, new module: Hess's law, Born–Haber cycle and bond energies as 3D energy-level cycles */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const sgn = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(Math.abs(v) % 1 ? 1 : 0);
  /* each cycle: nodes (state, enthalpy relative to the start, kJ/mol) and the indirect route through them; the direct route joins the first and last node */
  const CYC = {
    co: {
      name: "Formation of CO₂ via CO", direct: "C(s) + O₂(g) → CO₂(g)", dname: "ΔH°c (carbon)",
      nodes: [["C(s) + O₂(g)", 0], ["CO(g) + ½O₂(g)", -110.5], ["CO₂(g)", -393.5]], steps: ["C + ½O₂ → CO", "CO + ½O₂ → CO₂"],
      note: "Carbon burns directly to CO₂ (−393.5 kJ), or in two steps through CO. The two routes must release the same energy, so ΔH(CO → CO₂) = −393.5 − (−110.5) = −283.0 kJ/mol: a value that cannot be measured directly for the first step alone.",
    },
    ch4: {
      name: "Enthalpy of formation of methane from combustion data", direct: "C(s) + 2H₂(g) → CH₄(g)", dname: "ΔH°f (CH₄)",
      nodes: [["C(s) + 2H₂(g) + 2O₂(g)", 0], ["CO₂(g) + 2H₂O(l)", -965.1], ["CH₄(g) + 2O₂(g)", -74.8]], steps: ["burn C and 2H₂: ΔH°c(C) + 2ΔH°c(H₂)", "CO₂ + 2H₂O → CH₄ + 2O₂: −ΔH°c(CH₄)"],
      note: "Methane cannot be made directly from carbon and hydrogen, but the three combustion enthalpies are easy to measure: ΔH°f(CH₄) = ΔH°c(C) + 2ΔH°c(H₂) − ΔH°c(CH₄) = (−393.5) + 2(−285.8) − (−890.3) = −74.8 kJ/mol. The last step runs backwards, so its sign flips.",
      fix: [-393.5 - 2 * 285.8, 890.3],
    },
    bh: {
      name: "Born–Haber cycle for NaCl", direct: "Na(s) + ½Cl₂(g) → NaCl(s)", dname: "ΔH°f (NaCl)",
      nodes: [["Na(s) + ½Cl₂(g)", 0], ["Na(g) + ½Cl₂(g)", 107], ["Na(g) + Cl(g)", 229], ["Na⁺(g) + e⁻ + Cl(g)", 725], ["Na⁺(g) + Cl⁻(g)", 376], ["NaCl(s)", -411]],
      steps: ["atomisation of Na: +107", "atomisation of ½Cl₂: +122", "1st ionisation energy of Na: +496", "electron affinity of Cl: −349", "lattice enthalpy of NaCl: −787"],
      note: "The lattice enthalpy of NaCl cannot be measured directly. Hess's law lets you find it: ΔH°f = ΔH(atomisation Na) + ΔH(atomisation Cl) + IE + EA + lattice enthalpy, so lattice enthalpy = −411 − (107 + 122 + 496 − 349) = −787 kJ/mol. More negative lattice enthalpy = stronger ionic bonding.",
    },
    bond: {
      name: "Enthalpy of combustion of methane from bond energies", direct: "CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(g)", dname: "ΔH (combustion, gaseous water)",
      nodes: [["CH₄(g) + 2O₂(g)", 0], ["C(g) + 4H(g) + 4O(g)", 2648], ["CO₂(g) + 2H₂O(g)", -818]],
      steps: ["break 4 C–H (4 × 413) + 2 O=O (2 × 498) = +2648", "make 2 C=O (2 × 805) + 4 O–H (4 × 464) = −3466"],
      note: "Bond breaking absorbs energy and bond making releases it: ΔH = Σ(bonds broken) − Σ(bonds made) = 2648 − 3466 = −818 kJ/mol. The data-book value is −802 kJ/mol for gaseous water, because bond energies are averages over many compounds.",
    },
  };
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const geo = (cy) => { const N = cy.nodes, E = N.map((n) => n[1]), lo = Math.min(...E), hi = Math.max(...E), span = Math.max(1, hi - lo); const sp = N.length > 4 ? 1.0 : 1.7, x0 = -(N.length - 1) * sp / 2 + 0.2; return { E, lo, hi, X: N.map((n, i) => x0 + i * sp), Y: E.map((e) => 0.7 + ((e - lo) / span) * 4.0), sp }; };

  C3.scenes.hessLaw = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.8, fov: 38, free: true, cam: [[2.2, 3.1, 14.5], [2.5, 2.9, 0]],
    values: { cyc: "bh", quiz: 0, guess: 0 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "cyc", label: "Energy cycle", options: Object.keys(CYC).map((k) => ({ value: k, label: CYC[k].name })) },
        { type: "toggle", key: "quiz", label: "Hide the direct ΔH and work it out" },
        { type: "range", key: "guess", label: "My answer for the direct ΔH (kJ/mol)", min: -1100, max: 1100, step: 1, unit: " kJ/mol" },
      ];
    },
    views: [{ label: "Cycle", cam: [[2.2, 3.1, 14.5], [2.5, 2.9, 0]] }, { label: "Side view", cam: [[9.1, 3.3, 10], [2.5, 2.9, 0]] }],
    note: "Hess's law: the enthalpy change of a reaction depends only on the initial and final states, not on the route. Two routes between the same two levels must therefore have the same total ΔH. Red arrows go up (endothermic, +ΔH); green arrows go down (exothermic, −ΔH). Add the steps of the indirect route and compare with the direct route. Tick “Hide the direct ΔH” to try the calculation yourself first.",
    onChange(S, s, c, key) { s.t = 0; },
    reset(S, s, c) { Object.assign(c, { cyc: "bh", quiz: 0, guess: 0 }); s.t = 0; },
    table(s, c) {
      const cy = CYC[c.cyc], g = geo(cy); const rows = cy.steps.map((st, i) => "<tr><td>" + (i + 1) + '</td><td style="text-align:left">' + st + "</td><td>" + sgn(g.E[i + 1] - g.E[i]) + "</td></tr>").join("");
      return '<table class="c3-table"><tr><th>step</th><th style="text-align:left">change</th><th>ΔH / kJ mol⁻¹</th></tr>' + rows + '<tr class="ok"><td></td><td style="text-align:left">sum of the steps = direct route</td><td>' + sgn(g.E[g.E.length - 1] - g.E[0]) + "</td></tr></table>";
    },
    build(S, s, c) {
      s.G = new T.Group(); S.scene.add(s.G); s.m4 = new T.Matrix4(); S.mk.box(11, 0.1, 3, M.matte(0x2a2e36, 0.7), 0.4, -0.05, 0); s.key = null;
      s.balls = [0, 1].map((i) => { const m = new T.Mesh(new T.SphereGeometry(0.13, 20, 14), new T.MeshBasicMaterial({ color: i ? 0xffd27a : 0x7dd3ff })); S.scene.add(m); return m; });
    },
    rebuild(S, s, c) {
      const key = c.cyc; if (s.key === key) return; s.key = key; while (s.G.children.length) s.G.remove(s.G.children[0]);
      const cy = CYC[key], g = geo(cy), N = cy.nodes.length, add = (m) => { s.G.add(m); return m; };
      const lineBox = (x1, y1, x2, y2, col, th) => { const d = Math.hypot(x2 - x1, y2 - y1), m = new T.Mesh(new T.BoxGeometry(d, th, th), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8 })); m.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0); m.rotation.z = Math.atan2(y2 - y1, x2 - x1); return add(m); };
      const arrow = (x, ya, yb, col, th) => { const up = yb > ya, L = Math.abs(yb - ya), hh = Math.min(0.28, L * 0.4); const b = new T.Mesh(new T.CylinderGeometry(th, th, Math.max(0.02, L - hh), 12), new T.MeshStandardMaterial({ color: col, roughness: 0.4 })); b.position.set(x, (ya + yb) / 2 + (up ? -hh / 2 : hh / 2), 0); add(b); const h = new T.Mesh(new T.ConeGeometry(th * 2.6, hh, 16), new T.MeshStandardMaterial({ color: col, roughness: 0.4 })); h.position.set(x, yb + (up ? -hh / 2 : hh / 2), 0); if (!up) h.rotation.z = Math.PI; add(h); };
      const slabW = N > 4 ? 0.7 : 1.2; cy.nodes.forEach((n, i) => { const slab = new T.Mesh(new T.BoxGeometry(slabW, 0.07, 0.9), new T.MeshStandardMaterial({ color: 0xcfe0ff, roughness: 0.3, metalness: 0.3, emissive: 0x1a2a4a })); slab.position.set(g.X[i], g.Y[i], 0); add(slab); const post = lineBox(g.X[i], 0, g.X[i], g.Y[i], 0x2e4670, 0.012); post.material.opacity = 0.5; });
      for (let i = 0; i < N - 1; i++) { const xm = (g.X[i] + g.X[i + 1]) / 2, d = g.E[i + 1] - g.E[i], col = d > 0 ? 0xff6a5a : 0x5ad98a; lineBox(g.X[i] + slabW / 2, g.Y[i], xm, g.Y[i], 0x6f86ad, 0.012); lineBox(xm, g.Y[i + 1], g.X[i + 1] - slabW / 2, g.Y[i + 1], 0x6f86ad, 0.012); arrow(xm, g.Y[i], g.Y[i + 1], col, 0.035); }
      const xd = g.X[0] - g.sp * 0.95 - 0.5, dd = g.E[N - 1] - g.E[0]; s.xd = xd; lineBox(xd, g.Y[0], g.X[0] - slabW / 2, g.Y[0], 0x8aa0c8, 0.01); lineBox(xd, g.Y[N - 1], g.X[N - 1] - slabW / 2, g.Y[N - 1], 0x8aa0c8, 0.01); arrow(xd, g.Y[0], g.Y[N - 1], dd > 0 ? 0xff6a5a : 0x7dd3ff, 0.06); s.geo = g;
    },
    update(S, s, c, dt) {
      this.rebuild(S, s, c); s.t = (s.t + dt * 0.12) % 1; const cy = CYC[c.cyc], g = s.geo, N = cy.nodes.length;
      /* ball A: direct route; ball B: step by step */
      const a = clamp(s.t * 1.15, 0, 1); s.balls[0].position.set(s.xd, lerp(g.Y[0], g.Y[N - 1], a), 0.1); const q = a * (N - 1), i = Math.min(N - 2, Math.floor(q)), f = q - i, xm = (g.X[i] + g.X[i + 1]) / 2;
      const seg = f < 0.25 ? [lerp(g.X[i] - 0.0, xm, f / 0.25), g.Y[i]] : f < 0.75 ? [xm, lerp(g.Y[i], g.Y[i + 1], (f - 0.25) / 0.5)] : [lerp(xm, g.X[i + 1], (f - 0.75) / 0.25), g.Y[i + 1]]; s.balls[1].position.set(seg[0], seg[1], 0.1);
      s.cum = g.E[i] + (g.E[i + 1] - g.E[i]) * clamp((f - 0.25) / 0.5, 0, 1); s.dir = lerp(g.E[0], g.E[N - 1], a);
    },
    overlay(ctx, s, c, w, h, S) {
      if (!s.geo) return; const cy = CYC[c.cyc], g = s.geo, N = cy.nodes.length, px = w - 250, dd = g.E[N - 1] - g.E[0]; ctx.save();
      H.pill(ctx, 10, 22, cy.name, "#ffe9b8", 11); H.pill(ctx, 10, 44, "ΔH = " + (c.quiz ? "?" : sgn(dd)) + " kJ/mol  (direct route)", dd < 0 ? "#8dffb8" : "#ff9a8a", 10);
      for (let i = 0; i < N; i++) { const q = S.proj(V3(g.X[i], g.Y[i] + (i % 2 ? -0.28 : 0.2), 0)); H.pill(ctx, q.x, q.y, String(i + 1), "#cfe0ff", 9, "center"); }
      for (let i = 0; i < N - 1; i++) { const d = g.E[i + 1] - g.E[i], xm = (g.X[i] + g.X[i + 1]) / 2, q = S.proj(V3(xm + 0.22, (g.Y[i] + g.Y[i + 1]) / 2, 0)); H.pill(ctx, q.x, q.y, sgn(d), d > 0 ? "#ff9a8a" : "#8dffb8", 8.5, "left"); }
      const qd = S.proj(V3(s.xd, (g.Y[0] + g.Y[N - 1]) / 2, 0)); H.pill(ctx, qd.x + 6, qd.y + 28, "direct " + (c.quiz ? "?" : sgn(dd)), "#7dd3ff", 9, "center");
      H.panel(ctx, px, 58, 240, 150); ctx.textAlign = "left"; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Energy levels (kJ mol⁻¹, start = 0)", px + 8, 73); ctx.font = "8.8px 'IBM Plex Mono',monospace"; let y = 87;
      cy.nodes.forEach((n, i) => { ctx.textAlign = "left"; ctx.fillStyle = "#e8f0ff"; ctx.fillText((i + 1) + "", px + 8, y); ctx.fillStyle = "#cfe0ff"; ctx.fillText(n[0], px + 20, y); ctx.textAlign = "right"; ctx.fillStyle = "#ffd27a"; ctx.fillText(sgn(g.E[i]), px + 232, y); ctx.textAlign = "left"; y += N > 4 ? 16 : 22; });
      const sum = g.E[N - 1] - g.E[0]; H.panel(ctx, px, 214, 240, 78); ctx.font = "9px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText("Σ steps = " + sgn(sum) + " kJ/mol", px + 8, 230);
      if (c.quiz) { const ok = Math.abs(c.guess - sum) <= 2; ctx.fillStyle = ok ? "#7dffbd" : "#ffd27a"; ctx.fillText("your answer: " + (c.guess > 0 ? "+" : c.guess < 0 ? "−" : "") + Math.abs(c.guess) + (ok ? "  ✓ correct" : "  (not yet)"), px + 8, 245); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; ctx.fillText(ok ? "The routes agree, as Hess's law says." : "Add ΔH1 + ΔH2 + … with their signs.", px + 8, 260); }
      else { ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; wrapT(ctx, "direct = indirect: both balls end at the same level", px + 8, 246, 224, 10.5); }
      ctx.restore();
    },
    readouts(s, c) { const cy = CYC[c.cyc], g = geo(cy), N = cy.nodes.length, d = g.E[N - 1] - g.E[0], out = [["Cycle", cy.name], ["Direct route", cy.direct + (c.quiz ? "" : ", " + cy.dname + " = " + sgn(d) + " kJ/mol")]]; cy.steps.forEach((st, i) => out.push(["Step " + (i + 1), st + (c.quiz ? "" : "  (ΔH = " + sgn(g.E[i + 1] - g.E[i]) + ")")])); out.push(["Hess's law", "ΔH(direct) = ΔH1 + ΔH2 + …  (route independent)"]); out.push(["Reading the diagram", cy.note]); return out; },
    steps(s, c) { return [["Read the levels: red arrows go up, green arrows go down", "done"], ["Add the indirect steps with their signs", "now"], ["Compare the sum with the direct route", ""], ["Hide the answer and try another cycle", c.quiz ? "done" : ""]]; },
  };
})();
