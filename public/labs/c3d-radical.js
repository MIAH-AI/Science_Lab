/* c3d-radical.js — chemistry 3D, new module: free-radical substitution of methane by chlorine (initiation, propagation, termination) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const sm = (x) => x * x * (3 - 2 * x);
  const CPK = { H: 0xf4f4f4, C: 0x3b3f46, Cl: 0x22d03a }, RAD = { H: 0.2, C: 0.34, Cl: 0.42 };
  /* an atom path is a list of keyframes [t, x, y, z]; offsets follow a carbon */
  const kf = (keys, off) => keys.map((k) => [k[0], k[1] + off[0], k[2] + off[1], k[3] + off[2]]);
  const Hs = (ck, side, flat) => [[side * 0.55, 0.85, 0], [side * 0.55, -0.42, 0.74], [side * 0.55, -0.42, -0.74]].map((o) => ({ el: "H", keys: kf(ck, flat ? [o[0] * (flat), o[1], o[2]] : o) }));
  const ch3 = (ck, side) => [{ el: "C", keys: ck }].concat(Hs(ck, side, 1));
  const STEPS = {
    init: {
      label: "Initiation", type: "homolytic fission of Cl–Cl by UV light", eq: "Cl–Cl  →  Cl• + Cl•", note: "UV light supplies the energy (242 kJ/mol) to break the Cl–Cl bond. Each atom takes one electron of the shared pair: two chlorine radicals, each with an unpaired electron (•).",
      atoms: [{ el: "Cl", keys: [[0, -0.95, 0, 0], [0.45, -0.95, 0, 0], [1, -2.9, 0.9, 0]] }, { el: "Cl", keys: [[0, 0.95, 0, 0], [0.45, 0.95, 0, 0], [1, 2.9, -0.9, 0]] }],
      bonds: [[0, 1, 0, 0.45]], rad: [[0, 0.5, 1], [1, 0.5, 1]], photon: 0.45,
    },
    p1: {
      label: "Propagation 1", type: "Cl• abstracts H from methane", eq: "Cl• + CH₄  →  HCl + •CH₃", note: "A chlorine radical removes a hydrogen atom from methane. The product HCl is stable, but a new radical, the methyl radical •CH₃, is formed. The number of radicals does not change.",
      atoms: [{ el: "Cl", keys: [[0, -3.4, 0, 0], [0.5, -1.2, 0, 0], [1, -2.9, 1.0, 0]] }, { el: "C", keys: [[0, 1.0, 0, 0], [0.5, 1.0, 0, 0], [1, 2.8, -0.5, 0]] }, { el: "H", keys: [[0, 0.1, 0, 0], [0.5, -0.05, 0, 0], [1, -1.95, 1.0, 0]] }].concat(Hs([[0, 1.0, 0, 0], [0.5, 1.0, 0, 0], [1, 2.8, -0.5, 0]], 0.6, 1).map((a) => a)),
      bonds: [[0, 2, 0.5, 1], [1, 2, 0, 0.5], [1, 3, 0, 1], [1, 4, 0, 1], [1, 5, 0, 1]], rad: [[0, 0, 0.5], [1, 0.55, 1]],
    },
    p2: {
      label: "Propagation 2", type: "•CH₃ attacks Cl₂", eq: "•CH₃ + Cl–Cl  →  CH₃Cl + Cl•", note: "The methyl radical takes a chlorine atom from a Cl₂ molecule, forming chloromethane and a new chlorine radical. That radical repeats propagation step 1: a chain reaction.",
      atoms: [{ el: "C", keys: [[0, -2.0, 0, 0], [0.5, 0.2, 0, 0], [1, 0.2, -0.6, 0]] }, { el: "Cl", keys: [[0, 1.2, 0, 0], [1, 1.2, -0.6, 0]] }, { el: "Cl", keys: [[0, 2.3, 0, 0], [0.5, 2.3, 0, 0], [1, 3.5, 1.0, 0]] }].concat(Hs([[0, -2.0, 0, 0], [0.5, 0.2, 0, 0], [1, 0.2, -0.6, 0]], -1, 1)),
      bonds: [[0, 1, 0.5, 1], [1, 2, 0, 0.5], [0, 3, 0, 1], [0, 4, 0, 1], [0, 5, 0, 1]], rad: [[0, 0, 0.5], [2, 0.55, 1]],
    },
    t1: {
      label: "Termination (a)", type: "two chlorine radicals combine", eq: "Cl• + Cl•  →  Cl–Cl", note: "Two radicals meet and pair up their unpaired electrons, so a covalent bond forms. Radicals are used up, so the chain stops. This is rare because radicals are at low concentration.",
      atoms: [{ el: "Cl", keys: [[0, -2.6, 0, 0], [0.6, -0.5, 0, 0], [1, -0.5, 0, 0]] }, { el: "Cl", keys: [[0, 2.6, 0, 0], [0.6, 0.5, 0, 0], [1, 0.5, 0, 0]] }],
      bonds: [[0, 1, 0.6, 1]], rad: [[0, 0, 0.6], [1, 0, 0.6]],
    },
    t2: {
      label: "Termination (b)", type: "•CH₃ combines with Cl•", eq: "•CH₃ + Cl•  →  CH₃Cl", note: "A methyl radical and a chlorine radical combine to give the same product as propagation, but now two radicals are removed and no new one is made: the chain ends.",
      atoms: [{ el: "C", keys: [[0, -2.4, 0, 0], [0.6, -0.4, 0, 0], [1, -0.4, 0, 0]] }, { el: "Cl", keys: [[0, 2.6, 0, 0], [0.6, 0.65, 0, 0], [1, 0.65, 0, 0]] }].concat(Hs([[0, -2.4, 0, 0], [0.6, -0.4, 0, 0], [1, -0.4, 0, 0]], -1, 1)),
      bonds: [[0, 1, 0.6, 1], [0, 2, 0, 1], [0, 3, 0, 1], [0, 4, 0, 1]], rad: [[0, 0, 0.6], [1, 0, 0.6]],
    },
    t3: {
      label: "Termination (c)", type: "two methyl radicals combine", eq: "•CH₃ + •CH₃  →  CH₃–CH₃", note: "Two methyl radicals form a C–C bond. A trace of ethane in the product shows that the radical mechanism operates.",
      atoms: [{ el: "C", keys: [[0, -2.6, 0, 0], [0.7, -0.55, 0, 0], [1, -0.55, 0, 0]] }, { el: "C", keys: [[0, 2.6, 0, 0], [0.7, 0.55, 0, 0], [1, 0.55, 0, 0]] }].concat(Hs([[0, -2.6, 0, 0], [0.7, -0.55, 0, 0], [1, -0.55, 0, 0]], -1, 1), Hs([[0, 2.6, 0, 0], [0.7, 0.55, 0, 0], [1, 0.55, 0, 0]], 1, 1)),
      bonds: [[0, 1, 0.7, 1], [0, 2, 0, 1], [0, 3, 0, 1], [0, 4, 0, 1], [1, 5, 0, 1], [1, 6, 0, 1], [1, 7, 0, 1]], rad: [[0, 0, 0.7], [1, 0, 0.7]],
    },
  };
  const SK = Object.keys(STEPS);
  const pos = (keys, t) => { if (t <= keys[0][0]) return keys[0].slice(1); for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (t <= b[0]) { const u = sm(clamp((t - a[0]) / (b[0] - a[0]), 0, 1)); return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3] + (b[3] - a[3]) * u]; } } return keys[keys.length - 1].slice(1); };

  C3.scenes.radicalMech = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.9, fov: 36, free: true, cam: [[2.5, 1.9, 11.0], [2.5, 1.5, 0]],
    values: { step: "init", uv: 1, prog: 0, run: 1 },
    state: () => ({ t: 0 }),
    get controls() {
      return [
        { type: "select", key: "step", label: "Step of the mechanism", options: SK.map((k) => ({ value: k, label: STEPS[k].label + ": " + STEPS[k].eq })) },
        { type: "toggle", key: "uv", label: "UV light on (off = reaction in the dark)" },
        { type: "range", key: "prog", label: "Progress of this step (%)", min: 0, max: 100, step: 1, unit: " %" },
        { type: "toggle", key: "run", label: "Play automatically" },
        { type: "button", label: "Next step", action: (S, s, c, ref) => { c.step = SK[(SK.indexOf(c.step) + 1) % SK.length]; c.prog = 0; ref(); } },
      ];
    },
    views: [{ label: "Front", cam: [[2.5, 1.9, 11.0], [2.5, 1.5, 0]] }, { label: "Close", cam: [[1.6, 1.8, 7.5], [1.6, 1.5, 0]] }],
    note: "Free-radical substitution: methane reacts with chlorine in UV light (or sunlight) to give chloromethane and hydrogen chloride, CH₄ + Cl₂ → CH₃Cl + HCl. It is a chain reaction in three stages. Initiation: UV light breaks Cl–Cl by homolytic fission into two chlorine radicals (Cl•). Propagation: Cl• takes H from CH₄ to give HCl and •CH₃, then •CH₃ takes Cl from Cl₂ to give CH₃Cl and a new Cl•; the cycle repeats thousands of times. Termination: two radicals combine and the chain ends. With excess chlorine the substitution continues to CH₂Cl₂, CHCl₃ and CCl₄. A radical has an unpaired electron (shown as a yellow dot). Distances are schematic.",
    onChange(S, s, c, key) { if (key === "step") c.prog = 0; },
    reset(S, s, c) { Object.assign(c, { step: "init", uv: 1, prog: 0, run: 1 }); },
    table() {
      return '<table class="c3-table"><tr><th style="text-align:left">Stage</th><th style="text-align:left">Equation</th><th style="text-align:left">Radicals</th></tr><tr><td style="text-align:left">Initiation</td><td style="text-align:left">Cl–Cl → 2Cl•</td><td style="text-align:left">formed (0 → 2)</td></tr><tr><td style="text-align:left">Propagation 1</td><td style="text-align:left">Cl• + CH₄ → HCl + •CH₃</td><td style="text-align:left">unchanged (1 → 1)</td></tr><tr><td style="text-align:left">Propagation 2</td><td style="text-align:left">•CH₃ + Cl₂ → CH₃Cl + Cl•</td><td style="text-align:left">unchanged (1 → 1)</td></tr><tr><td style="text-align:left">Termination</td><td style="text-align:left">Cl• + Cl•, •CH₃ + Cl•, •CH₃ + •CH₃</td><td style="text-align:left">used up (2 → 0)</td></tr></table>';
    },
    build(S, s, c) {
      S.mk.box(16, 0.1, 6, M.matte(0x1d222b, 0.7), 2.0, -1.6, 0); s.G = new T.Group(); s.G.position.set(0, 1.0, 0); s.G.scale.set(1.2, 1.2, 1.2); S.scene.add(s.G); s.cur = null;
      s.photon = new T.Sprite(new T.SpriteMaterial({ map: U.softDot(64, "rgba(190,160,255,1)"), color: 0xb38cff, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending })); s.photon.scale.set(0.9, 0.9, 1); s.G.add(s.photon);
      s.rod = new T.CylinderGeometry(0.06, 0.06, 1, 10); s.rodMat = M.matte(0xcfd5df, 0.35); s.dotTex = U.softDot(32, "rgba(255,230,80,1)");
    },
    update(S, s, c, dt) {
      if (s.cur !== c.step) { build(S, s, c); s.cur = c.step; } const st = STEPS[c.step];
      if (c.run && c.uv && c.prog < 100 && dt > 0) c.prog = Math.min(100, c.prog + dt * 11); else if (c.run && !c.uv && c.step === "init") c.prog = Math.min(c.prog, 0);
      let t = c.prog / 100; if (!c.uv) t = Math.min(t, 0.0); s.t = t;
      st.atoms.forEach((a, i) => { const p = pos(a.keys, t); s.am[i].position.set(p[0], p[1], p[2]); });
      s.bm.forEach((b) => { const A = s.am[b.i].position, B = s.am[b.j].position, on = t >= b.on - 1e-6 && t <= b.off + 1e-6 && !(t === b.off && b.off < 1 && b.on === 0 && false); const vis = (t >= b.on && t < b.off) || (b.off >= 1 && t >= b.on) || (b.on <= 0 && t < b.off); b.m.visible = vis; if (vis) { const d = B.clone().sub(A), L = d.length(); b.m.position.copy(A).addScaledVector(d, 0.5); b.m.scale.set(1, Math.max(L, 0.001), 1); b.m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); } });
      s.rm.forEach((r) => { const on = t >= r.a && t <= r.b || (r.b >= 1 && t >= r.a); r.m.visible = on; if (on) { r.m.position.copy(s.am[r.i].position).add(new T.Vector3(0.0, 0.62, 0.5)); r.m.material.opacity = 0.65 + 0.35 * Math.sin(S.t * 6); } });
      s.photon.material.opacity = st.photon && c.uv && t < st.photon ? 0.95 : 0; if (st.photon) { s.photon.position.set(0, 3.2 - (t / st.photon) * 2.6, 0); }
    },
    overlay(ctx, s, c, w, h, S) {
      const st = STEPS[c.step]; ctx.save(); ctx.textAlign = "left"; const px = w - 250;
      H.pill(ctx, 10, 22, st.label + ": " + st.type, "#ffe9b8", 10.5); H.pill(ctx, 10, 44, st.eq, "#9fe3ff", 10.5);
      if (!c.uv) H.pill(ctx, 10, 66, "no UV light: no radicals form, no reaction in the dark", "#ff9a8a", 9);
      else H.pill(ctx, 10, 66, "● unpaired electron = radical (•)     progress " + c.prog.toFixed(0) + " %", "#ffd27a", 9);
      s.am.forEach((m, i) => { const a = st.atoms[i]; const q = S.proj(m.position.clone().multiplyScalar(1.2).add(s.G.position)); H.pill(ctx, q.x, q.y + 20, a.el, "#cfe0f5", 8, "center"); });
      if (st.photon && c.uv && s.t < st.photon) { const q = S.proj(new T.Vector3(0, 3.0 + 1.6, 0)); H.pill(ctx, q.x + 32, q.y, "hν  (UV light)", "#c9a8ff", 9.5); }
      /* steps list and chain diagram */
      H.panel(ctx, px, 58, 240, 150); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Chain reaction", px + 8, 73);
      SK.forEach((k, i) => { const on = k === c.step; ctx.fillStyle = on ? "#ffe9b8" : "#8fa0bc"; ctx.font = (on ? "700 " : "") + "8.4px 'IBM Plex Mono',monospace"; ctx.fillText((on ? "▶ " : "  ") + STEPS[k].label, px + 8, 90 + i * 14); });
      ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#9fb2d2"; wrapT(ctx, "Propagation 1 and 2 repeat in a cycle: Cl• → •CH₃ → Cl• …", px + 8, 186, 224, 10);
      H.panel(ctx, px, 216, 240, 106); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("What happens", px + 8, 231); ctx.font = "8.2px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; wrapT(ctx, st.note, px + 8, 245, 224, 10);
      ctx.restore();
    },
    readouts(s, c) { const st = STEPS[c.step]; return [["Step", st.label + " — " + st.type], ["Equation", st.eq], ["Overall reaction", "CH₄ + Cl₂ → CH₃Cl + HCl  (UV light)"], ["Mechanism type", "free-radical substitution"], ["Bond breaking", "homolytic fission: each atom keeps one electron"], ["Further substitution", "CH₂Cl₂, CHCl₃, CCl₄ with excess Cl₂"]]; },
    steps(s, c) { return [["Initiation: watch UV light split Cl₂ into radicals", c.step === "init" ? "now" : "done"], ["Propagation 1 and 2: follow the radical around the chain", c.step.startsWith("p") ? "now" : ""], ["Termination: radicals combine and the chain stops", c.step.startsWith("t") ? "now" : ""], ["Switch off the UV light and see why nothing happens in the dark", c.uv ? "" : "done"]]; },
  };
  function build(S, s, c) {
    if (s.root) { s.G.remove(s.root); } s.root = new T.Group(); s.G.add(s.root); const st = STEPS[c.step]; s.am = []; s.bm = []; s.rm = [];
    st.atoms.forEach((a) => { const m = new T.Mesh(new T.SphereGeometry(RAD[a.el], 28, 18), new T.MeshPhysicalMaterial({ color: CPK[a.el], roughness: 0.25, clearcoat: 0.8 })); s.root.add(m); s.am.push(m); });
    st.bonds.forEach((b) => { const m = new T.Mesh(s.rod, s.rodMat); s.root.add(m); s.bm.push({ i: b[0], j: b[1], on: b[2], off: b[3], m }); });
    st.rad.forEach((r) => { const m = new T.Sprite(new T.SpriteMaterial({ map: s.dotTex, color: 0xffe650, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); m.scale.set(0.6, 0.6, 1); s.root.add(m); s.rm.push({ i: r[0], a: r[1], b: r[2], m }); });
  }
})();
