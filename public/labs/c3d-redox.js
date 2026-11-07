/* c3d-redox.js — chemistry 3D, batch C (part 1): redox & electrochemical (galvanic) cells */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, TAU = Math.PI * 2, sub = C3.chem.sub;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
  const EP = () => (typeof E_POT !== "undefined" ? E_POT : { Zn: -0.76, Cu: 0.34 });                 // standard electrode potentials from the lab page (V)
  const Z = { Li: 1, Na: 1, Mg: 2, Al: 3, Zn: 2, Fe: 2, Ni: 2, Sn: 2, Pb: 2, H: 1, Cu: 2, Ag: 1, Au: 3 };
  const COL = { Li: 0xc0c4c8, Na: 0xc7c9cc, Mg: 0xc9ced4, Al: 0xbcc3ca, Zn: 0x9aa3ad, Fe: 0x6b7078, Ni: 0xa5adb5, Sn: 0xb7bcc2, Pb: 0x6f747b, H: 0x2a2d33, Cu: 0xc8733a, Ag: 0xd9dde2, Au: 0xe0b030 };
  const ION = { Cu: [86, 150, 232, 0.4], Ni: [110, 200, 120, 0.3], Fe: [200, 225, 150, 0.25], Au: [240, 210, 90, 0.3] };
  const NEUT = [200, 228, 244, 0.14];
  const ionRgb = (m) => ION[m] || NEUT;
  const ionLab = (m) => (m === "H" ? "H⁺" : m + ({ 1: "⁺", 2: "²⁺", 3: "³⁺" }[Z[m]] || "⁺"));
  const eLab = (m) => (m === "H" ? "H₂ (Pt)" : m);
  const gcd = (a, b) => (b ? gcd(b, a % b) : a), lcm = (a, b) => (a * b) / gcd(a, b);
  const XA = -2.7, XC = 0.9, XM = (XA + XC) / 2, YT = 3.35, NE = 22, NP = 60;
  const BRIDGE = [V3(XA + 0.35, 1.0, 0.45), V3(XA + 0.35, 2.15, 0.45), V3(XC - 0.35, 2.15, 0.45), V3(XC - 0.35, 1.0, 0.45)];

  function cell(c) {
    const E = EP(), e1 = E[c.m1], e2 = E[c.m2], anode = e1 <= e2 ? c.m1 : c.m2, cathode = e1 <= e2 ? c.m2 : c.m1, ea = E[anode], ec = E[cathode];
    const za = Z[anode], zc = Z[cathode], L = lcm(za, zc), va = L / za, vc = L / zc;
    return { anode, cathode, ea, ec, emf: ec - ea, same: c.m1 === c.m2, za, zc, L, va, vc };
  }
  function eqText(k) {
    if (k.same) return "same metal in both half-cells — no potential difference";
    const a = k.va > 1 ? k.va : "", c = k.vc > 1 ? k.vc : "", isH = (m) => m === "H";
    return a + eLab(k.anode).replace(" (Pt)", "") + " + " + c + ionLab(k.cathode) + " → " + a + ionLab(k.anode) + " + " + c + eLab(k.cathode).replace(" (Pt)", "");
  }
  const half = (m, ox) => (ox ? eLab(m).replace(" (Pt)", "") + " → " + ionLab(m) + " + " + (Z[m] > 1 ? Z[m] : "") + "e⁻" : ionLab(m) + " + " + (Z[m] > 1 ? Z[m] : "") + "e⁻ → " + eLab(m).replace(" (Pt)", ""));

  C3.scenes.redoxCell = {
    env: "chemlab", envOpts: { w: 26, d: 10, wallH: 26, shadowArea: 11 }, envI: 0.7, fov: 36, free: true, cam: [[-0.9, 3.2, 10.2], [-0.9, 1.7, 0]],
    get controls() {
      const E = EP(), opts = Object.keys(E).map((k) => ({ value: k, label: k + "  (E° = " + (E[k] > 0 ? "+" : "") + E[k] + " V)" }));
      return [
        { type: "select", key: "m1", label: "Half-cell 1 (electrode)", options: opts },
        { type: "select", key: "m2", label: "Half-cell 2 (electrode)", options: opts },
        { type: "toggle", key: "sw", label: "Switch closed (circuit connected)" },
        { type: "toggle", key: "bridge", label: "Salt bridge in place" },
        { type: "button", label: "Fresh electrodes & solutions", action: (S, s) => { s.prog = 0; } , cls: "secondary" },
      ];
    },
    values: { m1: "Zn", m2: "Cu", sw: 1, bridge: 1 },
    state: () => ({ t: 0, prog: 0 }),
    views: [{ label: "Whole cell", cam: [[-0.9, 3.2, 10.2], [-0.9, 1.7, 0]] }, { label: "Zoom anode", cam: [[-2.7, 2.0, 5.2], [-2.7, 1.3, 0]] }, { label: "Zoom cathode", cam: [[0.9, 2.0, 5.2], [0.9, 1.3, 0]] }, { label: "Top", cam: [[-0.9, 9.5, 3.4], [-0.9, 1.0, 0]] }],
    note: "Oxidation (loss of electrons) happens at the anode — the metal with the more negative E°; reduction (gain of electrons) at the cathode. Electrons travel through the wire from anode to cathode; ions carry charge through the salt bridge (anions toward the anode, cations toward the cathode). E°cell = E°cathode − E°anode; a positive value means the reaction is spontaneous. Without the salt bridge the circuit is incomplete and no current flows.",
    reset(S, s, c) { Object.assign(c, { m1: "Zn", m2: "Cu", sw: 1, bridge: 1 }); s.prog = 0; },
    onChange(S, s, c, key) { if (key === "m1" || key === "m2") { s.prog = 0; s.sig = ""; } },
    build(S, s, c) {
      const K = C3.kit(S); s.K = K; K.contact(XA, 0, 0, 5, 0.5); K.contact(XC, 0, 0, 5, 0.5);
      s.bk = [XA, XC].map((x) => { const b = K.beaker(); b.group.position.set(x, 0, 0); const l = b.addLiquid({ color: 0xcfe8f5, opacity: 0.2 }); l.setVolume(250); return { b, l }; });
      /* electrodes (box + deposit/shrink thickness) */
      s.el = [XA, XC].map((x) => { const m = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshPhysicalMaterial({ color: 0x9aa3ad, metalness: 0.9, roughness: 0.32, clearcoat: 0.3 })); m.position.set(x, 1.45, 0); m.castShadow = true; S.scene.add(m); return m; });
      /* clamp bars + wires + meter */
      const dark = M.matte(0x252a31, 0.5), wire = M.paint(0xc8352b); S.mk.rbox(1.2, 0.08, 0.1, 0.02, dark, XA, 2.72, 0); S.mk.rbox(1.2, 0.08, 0.1, 0.02, dark, XC, 2.72, 0);
      const P = [V3(XA, 2.72, 0), V3(XA, YT, 0), V3(XM - 0.7, YT, 0)], Q = [V3(XM + 0.7, YT, 0), V3(XC, YT, 0), V3(XC, 2.72, 0)];
      [P, Q].forEach((pp) => { for (let i = 0; i < pp.length - 1; i++) S.mk.rod(pp[i], pp[i + 1], 0.035, i === 0 && pp === P ? M.paint(0x222222) : wire); });
      s.path = [V3(XA, 2.72, 0), V3(XA, YT, 0), V3(XC, YT, 0), V3(XC, 2.72, 0)]; s.plen = [0]; for (let i = 1; i < s.path.length; i++) s.plen.push(s.plen[i - 1] + s.path[i].distanceTo(s.path[i - 1]));
      S.mk.rbox(1.3, 0.8, 0.5, 0.08, M.paint(0xe2e5ea), XM, YT, 0); S.mk.rbox(1.0, 0.36, 0.04, 0.02, M.matte(0x0b1a10, 0.35), XM, YT + 0.04, 0.27);
      /* salt bridge */
      const bm = K.glassMat({ opacity: 0.16 }); s.bridge = new T.Group(); S.scene.add(s.bridge);
      s.bridge.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(BRIDGE, false, "catmullrom", 0.08), 60, 0.11, 14), bm)); const fill = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(BRIDGE, false, "catmullrom", 0.08), 60, 0.085, 14), new T.MeshStandardMaterial({ color: 0xf1ece0, roughness: 0.8 })); s.bridge.add(fill);
      [BRIDGE[0], BRIDGE[3]].forEach((p) => { const pl = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.14, 12), M.matte(0xf4f0e6, 0.9)); pl.position.set(p.x, p.y - 0.05, p.z); s.bridge.add(pl); });
      s.bcurve = new T.CatmullRomCurve3(BRIDGE, false, "catmullrom", 0.08);
      /* electrons + ions */
      s.eIm = new T.InstancedMesh(new T.SphereGeometry(0.07, 14, 10), new T.MeshStandardMaterial({ color: 0xffd24a, emissive: 0xffa010, emissiveIntensity: 1.6, roughness: 0.3 }), NE); s.eIm.frustumCulled = false; S.scene.add(s.eIm);
      s.iIm = new T.InstancedMesh(new T.SphereGeometry(1, 14, 10), new T.MeshPhysicalMaterial({ roughness: 0.25, clearcoat: 0.7 }), NP); s.iIm.frustumCulled = false; S.scene.add(s.iIm);
      s.ions = []; for (let i = 0; i < NP; i++) s.ions.push({ on: false }); s.m4 = new T.Matrix4(); s.col = new T.Color(); s.sig = ""; s.acc = 0; s.eph = 0; s.act = 0;
    },
    update(S, s, c, dt) {
      s.t += dt; const k = (s.k = cell(c)), live = c.sw && c.bridge && !k.same && k.emf > 0.001; s.live = live; s.emf = c.bridge ? k.emf : 0;
      const sig = c.m1 + c.m2; if (sig !== s.sig) { s.sig = sig; s.ions.forEach((q) => (q.on = false)); [[0, k.anode], [1, k.cathode]].forEach(([i, m]) => { s.el[i].material.color.set(COL[m]); s.el[i].material.metalness = m === "H" ? 0.2 : 0.9; }); s.coat && (s.coat.material.color.set(COL[k.cathode])); }
      if (!s.coat) { s.coat = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshPhysicalMaterial({ color: COL[k.cathode], metalness: 0.9, roughness: 0.4 })); S.scene.add(s.coat); s.coat.material.color.set(COL[k.cathode]); }
      s.act += ((live ? 1 : 0) - s.act) * Math.min(1, dt * 4 + (dt ? 0 : 1)); if (live && dt > 0) s.prog = Math.min(1, s.prog + dt * 0.012 * Math.min(2, k.emf / 1.1 + 0.2));
      /* electrodes: anode thins, cathode is plated */
      const th0 = 0.14, thA = th0 * (1 - 0.55 * s.prog), thC = th0 + 0.12 * s.prog;
      s.el[0].scale.set(thA, 2.4, 0.5); s.el[1].scale.set(th0, 2.4, 0.5); s.coat.scale.set(thC, 2.0 + 0.0 * s.prog, 0.52); s.coat.position.set(XC, 1.25, 0); s.coat.visible = !k.same && s.prog > 0.01;
      s.el[1].material.color.set(COL[k.cathode]);
      /* solutions */
      const ai = ionRgb(k.anode), ci = ionRgb(k.cathode), fadeC = 1 - 0.65 * s.prog;
      s.bk[0].l.setColor(ai.slice(0, 3), ai[3] * (k.anode === "H" ? 1 : 0.6 + 0.4 * s.prog)); s.bk[1].l.setColor(ci.slice(0, 3), 0.14 + (ci[3] - 0.14) * fadeC); s.bk.forEach((q) => q.l.update(S.t));
      s.bridge.visible = !!c.bridge;
      /* electron flow along the wire (anode → cathode) */
      const total = s.plen[s.plen.length - 1]; s.eph = (s.eph + dt * 1.2 * Math.min(1.6, 0.4 + k.emf / 1.1) * s.act) % 1;
      for (let i = 0; i < NE; i++) {
        if (s.act < 0.02 && !live) { s.m4.makeScale(0, 0, 0); s.eIm.setMatrixAt(i, s.m4); continue; }
        const d = ((i / NE + s.eph) % 1) * total; let j = 1; while (j < s.plen.length - 1 && d > s.plen[j]) j++; const f = (d - s.plen[j - 1]) / (s.plen[j] - s.plen[j - 1]), p = s.path[j - 1].clone().lerp(s.path[j], f);
        const sc = 0.4 + 0.6 * s.act; s.m4.makeScale(sc, sc, sc); s.m4.setPosition(p.x, p.y + 0.0, p.z + 0.06); s.eIm.setMatrixAt(i, s.m4);
      }
      s.eIm.instanceMatrix.needsUpdate = true;
      /* ions: anode releases cations, cathode beaker loses them, the bridge carries K⁺ / NO₃⁻ */
      if (live && dt > 0) { s.acc += dt * 6; while (s.acc >= 1) { s.acc -= 1; spawn(s, k); } }
      const acol = ionRgb(k.anode), ccol = ionRgb(k.cathode);
      for (let i = 0; i < NP; i++) {
        const q = s.ions[i]; if (!q.on) { s.m4.makeScale(0, 0, 0); s.iIm.setMatrixAt(i, s.m4); continue; }
        if (dt > 0) q.u += dt / q.dur; if (q.u >= 1) { q.on = false; s.m4.makeScale(0, 0, 0); s.iIm.setMatrixAt(i, s.m4); continue; }
        let p, r = q.r;
        if (q.kind === "a") { p = q.p0.clone().addScaledVector(q.dir, q.u * 0.6); r *= 1 - q.u * 0.6; }
        else if (q.kind === "c") { p = q.p0.clone().lerp(q.p1, q.u); r *= 1 - Math.max(0, q.u - 0.75) * 4; }
        else { const t = q.kind === "k" ? q.u : 1 - q.u; p = s.bcurve.getPoint(t); r *= 1; }
        s.m4.makeScale(r, r, r); s.m4.setPosition(p.x, p.y, p.z); s.iIm.setMatrixAt(i, s.m4); s.col.set(q.col); s.iIm.setColorAt(i, s.col);
      }
      s.iIm.instanceMatrix.needsUpdate = true; s.iIm.instanceColor && (s.iIm.instanceColor.needsUpdate = true);
    },
    overlay(ctx, s, c, w, h, S) {
      const k = s.k; if (!k) return;
      H.pill(ctx, 10, 22, eqText(k), "#ffe9b8", 11.5); H.pill(ctx, 10, 44, "E°cell = E°cathode − E°anode   ·   oxidation at the anode (loses e⁻)   ·   reduction at the cathode (gains e⁻)", "#bcd0ea", 9);
      const m = S.proj(V3(XM, YT, 0.3)); H.pill(ctx, m.x, m.y + 4, (s.emf).toFixed(2) + " V", "#7dff9d", 12.5, "center");
      const qa = S.proj(V3(XA - 0.2, 2.0, 0)), qc = S.proj(V3(XC + 0.2, 2.0, 0));
      H.pill(ctx, qa.x - 6, qa.y - 8, "ANODE (−)", "#ff9d8a", 10, "right"); H.pill(ctx, qa.x - 6, qa.y + 10, eLab(k.anode) + " · oxidation", "#ff9d8a", 9.5, "right");
      H.pill(ctx, qc.x + 6, qc.y - 8, "CATHODE (+)", "#9fd2ff", 10); H.pill(ctx, qc.x + 6, qc.y + 10, eLab(k.cathode) + " · reduction", "#9fd2ff", 9.5);
      const ba = S.proj(V3(XA, 0.0, 0.7)), bc = S.proj(V3(XC, 0.0, 0.7));
      H.pill(ctx, ba.x, ba.y + 18, half(k.anode, true), "#ffb199", 10, "center"); H.pill(ctx, bc.x, bc.y + 18, half(k.cathode, false), "#a9d4ff", 10, "center");
      H.pill(ctx, 10, 366, k.same ? "same electrode both sides: E°cell = 0 V" : "E°cell = " + (k.ec > 0 ? "+" : "") + k.ec.toFixed(2) + " − (" + (k.ea > 0 ? "+" : "") + k.ea.toFixed(2) + ") = +" + k.emf.toFixed(2) + " V  → spontaneous", "#7dffbd", 10.5);
      if (!c.bridge) H.pill(ctx, 10, 386, "no salt bridge: circuit incomplete, no current flows", "#ff9d8a", 10.5); else if (!c.sw) H.pill(ctx, 10, 386, "switch open: the voltmeter reads the EMF but no current flows", "#ffd27a", 10.5); else if (!k.same) H.pill(ctx, 10, 386, "e⁻ flow: " + k.anode + " (anode) → " + k.cathode + " (cathode)", "#ffd27a", 10);
      /* E° ladder */
      const E = EP(), keys = Object.keys(E).sort((a, b) => E[a] - E[b]), x0 = 560, y0 = 62, dy = 21; H.panel(ctx, x0 - 6, y0 - 6, 82, keys.length * dy + 22);
      ctx.save(); ctx.font = "600 8.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.textAlign = "left"; ctx.fillText("E° / V", x0, y0 + 5);
      keys.forEach((m2, i) => { const y = y0 + 20 + i * dy, sel = m2 === k.anode || m2 === k.cathode; ctx.fillStyle = m2 === k.anode ? "#ff9d8a" : m2 === k.cathode ? "#9fd2ff" : "rgba(220,230,245,.7)"; ctx.font = (sel ? "700 " : "500 ") + "10px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; ctx.fillText(m2, x0, y); ctx.textAlign = "right"; ctx.fillText((E[m2] > 0 ? "+" : "") + E[m2].toFixed(2), x0 + 68, y); if (sel) { ctx.fillStyle = m2 === k.anode ? "rgba(255,120,100,.2)" : "rgba(110,170,255,.2)"; ctx.fillRect(x0 - 3, y - 11, 74, 15); } });
      ctx.restore();
    },
    readouts(s, c) {
      const k = s.k; if (!k) return [];
      return [["Anode (oxidation)", k.anode + "  E° = " + k.ea + " V"], ["Cathode (reduction)", k.cathode + "  E° = " + k.ec + " V"], ["E°cell = E°cathode − E°anode", k.emf.toFixed(2) + " V"], ["Electrons transferred", k.L + " e⁻ per cell reaction"], ["Spontaneous?", k.same ? "no cell" : "yes (E°cell > 0)"], ["Salt bridge", c.bridge ? "in place" : "missing → open circuit"], ["Overall equation", eqText(k)]];
    },
    steps(s, c) { const k = s.k || cell(c); return [["Choose two different metals — the one with the more negative E° is the anode", "done"], ["Connect the wire and the salt bridge to complete the circuit", c.sw && c.bridge ? "done" : "now"], ["Anode: " + half(k.anode, true) + "   Cathode: " + half(k.cathode, false), c.sw && c.bridge ? "now" : ""], ["E°cell = E°cathode − E°anode = " + k.emf.toFixed(2) + " V (positive → spontaneous)", ""]]; },
  };
  function spawn(s, k) {
    const q = s.ions.find((x) => !x.on); if (!q) return; const r = Math.random(), ai = ionRgb(k.anode), ci = ionRgb(k.cathode);
    const hex = (a) => (a[0] << 16) | (a[1] << 8) | a[2];
    if (r < 0.34) Object.assign(q, { on: true, kind: "a", u: 0, dur: 1.6, r: 0.07, col: k.anode === "H" ? 0xff4a3a : (ion(ai) ? hex(ai) : 0xbfc9d4), p0: V3(XA + 0.1, U.rnd(0.5, 1.0), U.rnd(-0.2, 0.2)), dir: V3(U.rnd(-1, 1), U.rnd(-0.2, 0.2), U.rnd(-0.6, 0.6)).normalize() });
    else if (r < 0.68) Object.assign(q, { on: true, kind: "c", u: 0, dur: 1.8, r: 0.07, col: ion(ci) ? hex(ci) : 0xbfc9d4, p0: V3(XC + U.rnd(-0.45, 0.45), U.rnd(0.5, 1.05), U.rnd(-0.4, 0.4)), p1: V3(XC + 0.1, U.rnd(0.5, 1.0), U.rnd(-0.2, 0.2)) });
    else if (r < 0.84) Object.assign(q, { on: true, kind: "k", u: 0, dur: 3.2, r: 0.06, col: 0xa98bff });
    else Object.assign(q, { on: true, kind: "n", u: 0, dur: 3.2, r: 0.065, col: 0x4fd6c6 });
  }
  function ion(a) { return a !== NEUT && a[3] > 0.2; }
})();
