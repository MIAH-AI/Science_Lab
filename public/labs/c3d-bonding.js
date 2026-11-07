/* c3d-bonding.js — chemistry 3D: chemical bonding (ionic · covalent · metallic) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const PM = 0.0125;                                                   // scene units per picometre (ionic scene)
  const MOLS = {
    H2: { a: "H", b: "H", ord: 1, len: 74, E: 436, la: 0, lb: 0, name: "hydrogen, H₂", cfg: "1 valence e⁻ each → one shared pair" },
    Cl2: { a: "Cl", b: "Cl", ord: 1, len: 199, E: 242, la: 3, lb: 3, name: "chlorine, Cl₂", cfg: "7 valence e⁻ each → one shared pair + 3 lone pairs each" },
    O2: { a: "O", b: "O", ord: 2, len: 121, E: 498, la: 2, lb: 2, name: "oxygen, O₂", cfg: "6 valence e⁻ each → two shared pairs + 2 lone pairs each" },
    N2: { a: "N", b: "N", ord: 3, len: 110, E: 945, la: 1, lb: 1, name: "nitrogen, N₂", cfg: "5 valence e⁻ each → three shared pairs + 1 lone pair each" },
    HCl: { a: "H", b: "Cl", ord: 1, len: 127, E: 431, la: 0, lb: 3, name: "hydrogen chloride, HCl", cfg: "H: 1 e⁻, Cl: 7 e⁻ → one shared pair (pulled towards Cl) + 3 lone pairs on Cl" },
  };
  const METALS = {
    Na: { z: 11, val: 1, ion: "Na⁺", mp: 98, sig: 2.1, color: 0xcfd3da, name: "sodium" },
    Mg: { z: 12, val: 2, ion: "Mg²⁺", mp: 650, sig: 2.3, color: 0xaeb6bf, name: "magnesium" },
    Al: { z: 13, val: 3, ion: "Al³⁺", mp: 660, sig: 3.8, color: 0xc4cad1, name: "aluminium" },
  };
  const ENV = { H: 2.20, Cl: 3.16, O: 3.44, N: 3.04 }, ELE = { H: "hydrogen", Cl: "chlorine", O: "oxygen", N: "nitrogen" };
  const morse = (r, re, D) => { const a = 0.02; return D * Math.pow(1 - Math.exp(-a * (r - re)), 2) - D; };

  function mkAtom(S, color, parent) {
    const g = new T.Group(); parent.add(g);
    const core = new T.Mesh(new T.SphereGeometry(0.2, 28, 20), new T.MeshPhysicalMaterial({ color, roughness: 0.25, clearcoat: 0.8, emissive: color, emissiveIntensity: 0.25 })); core.castShadow = true; g.add(core);
    const cloud = new T.Mesh(new T.SphereGeometry(1, 36, 24), new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.13, blending: T.AdditiveBlending, depthWrite: false })); cloud.renderOrder = 3; g.add(cloud);
    const edge = new T.Mesh(new T.SphereGeometry(1, 36, 24), new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.07, wireframe: true, depthWrite: false })); g.add(edge);
    const rings = [0, 1, 2].map(() => { const m = new T.Mesh(new T.TorusGeometry(1, 0.007, 8, 120), new T.MeshBasicMaterial({ color: 0xbcd6ff, transparent: true, opacity: 0.55 })); g.add(m); return m; });
    return { g, core, cloud, edge, rings };
  }
  C3.scenes.bonding = {
    env: "studio", envOpts: {}, fov: 36, free: true, cam: [[0, 2.0, 12.6], [0, 0, 0]],
    values: { type: "ionic", mol: "O2", metal: "Na", prog: 0, auto: 1, latt: 0, field: 0 },
    state: () => ({ t: 0, hold: 0 }),
    controls: [
      { type: "select", key: "type", label: "Type of bond", options: [{ value: "ionic", label: "Ionic — sodium chloride, NaCl" }, { value: "covalent", label: "Covalent — shared electron pairs" }, { value: "metallic", label: "Metallic — cations in an electron sea" }] },
      { type: "select", key: "mol", label: "Covalent molecule", options: Object.keys(MOLS).map((k) => ({ value: k, label: MOLS[k].name })) },
      { type: "select", key: "metal", label: "Metal", options: Object.keys(METALS).map((k) => ({ value: k, label: METALS[k].name + " (" + METALS[k].ion + ")" })) },
      { type: "range", key: "prog", label: "Bond formation (0 = separate atoms → 1 = bonded)", min: 0, max: 1, step: 0.005 },
      { type: "toggle", key: "auto", label: "Play the bonding process" },
      { type: "button", label: "⟲ Replay from separate atoms", action: (S, s, c, ref) => { c.prog = 0; c.auto = 1; s.hold = 0; ref(); }, cls: "secondary" },
      { type: "toggle", key: "latt", label: "Ionic: show the NaCl crystal lattice" },
      { type: "toggle", key: "field", label: "Metallic: apply an electric field" },
    ],
    views: [{ label: "Front", cam: [[0, 2.0, 12.6], [0, 0, 0]] }, { label: "Close-up", cam: [[0, 1.2, 8.6], [0, 0, 0]] }, { label: "Side", cam: [[14.8, 2.0, 0.5], [0, 0, 0]] }],
    note: "Ionic: a metal atom transfers electrons to a non-metal; the oppositely charged ions attract in a giant lattice. Covalent: two non-metal atoms share electron pairs; the bond length is where attraction and repulsion balance (the minimum of the energy curve). Metallic: metal atoms release their outer electrons into a sea shared by the whole lattice of positive ions. Dots (•) and crosses (×) mark which atom each electron came from.",
    onChange(S, s, c, key, ref) { if (key === "prog") { c.auto = 0; ref && ref(); } if (key === "metal") buildMetal(S, s, c); if (key === "type") { c.prog = c.type === "metallic" ? c.prog : 0; c.auto = 1; s.hold = 0; ref && ref(); } if (key === "mol") { c.prog = 0; c.auto = 1; ref && ref(); } },
    reset(S, s, c) { Object.assign(c, { type: "ionic", mol: "O2", metal: "Na", prog: 0, auto: 1, latt: 0, field: 0 }); buildMetal(S, s, c); },

    build(S, s, c) {
      const K = C3.kit(S); s.K = K;
      const gi = (s.gi = new T.Group()), gc = (s.gc = new T.Group()); S.scene.add(gi); S.scene.add(gc);
      s.na = mkAtom(S, 0xab5cf2, gi); s.cl = mkAtom(S, 0x22d03a, gi); s.A = mkAtom(S, 0xe8281c, gc); s.B = mkAtom(S, 0xe8281c, gc);
      s.glow = S.mk.soft(0xffe08a, 1.4, 0, 0, 0, 0); s.glow.visible = false; s.dens = new T.Mesh(new T.SphereGeometry(1, 28, 20), new T.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false })); S.scene.add(s.dens); s.dens.visible = false;
      const eg = new T.SphereGeometry(0.075, 14, 10), mats = { dot: M.emissive(0x2f9bff, 1.7), cross: M.emissive(0xff9a2e, 1.7), gold: M.emissive(0xffe08a, 2.6) };
      const sp = new T.SpriteMaterial({ map: U.softDot(64, "rgba(255,255,255,1)"), color: 0x9fd4ff, transparent: true, opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false });
      s.mats = mats; s.el = []; for (let i = 0; i < 48; i++) { const m = new T.Mesh(eg, mats.dot); const q = new T.Sprite(sp.clone()); q.scale.set(0.5, 0.5, 1); m.add(q); m.userData.sp = q; S.scene.add(m); s.el.push(m); }
      s.latt3 = K.lattice("nacl", { n: 3 }); s.latt3.group.visible = false;
      s.metalG = null; buildMetal(S, s, c);
    },

    update(S, s, c, dt) {
      s.t += dt; const t = s.t, type = c.type;
      if (type !== "metallic" && c.auto && dt > 0) { if (c.prog < 1) c.prog = Math.min(1, c.prog + dt * 0.075); else { s.hold += dt; if (s.hold > 3.2) { s.hold = 0; c.prog = 0; } } }
      s.gi.visible = type === "ionic" && !c.latt; s.gc.visible = type === "covalent"; s.latt3.group.visible = type === "ionic" && !!c.latt; if (s.metalG) s.metalG.group.visible = type === "metallic";
      s.glow.visible = false; s.dens.visible = false; s.el.forEach((m) => (m.visible = false));
      const p = c.prog; let ei = 0;
      const place = (pos, mat, op) => { const m = s.el[ei++]; if (!m) return null; m.visible = true; m.position.copy(pos); m.material = mat; m.userData.sp.material.color.set(mat === s.mats.cross ? 0xffc27a : mat === s.mats.gold ? 0xffe9a0 : 0x7fc4ff); m.userData.sp.material.opacity = op == null ? 0.7 : op; return m; };
      if (s.latt3.group.visible) { s.latt3.group.rotation.y += dt * 0.25; s.latt3.group.rotation.x = 0.35; }
      /* ---------------------------------------------------------------- IONIC */
      if (type === "ionic" && !c.latt) {
        const tp = sstep(0.28, 0.58, p), dist = lerp(7.8, 3.5, sstep(0.62, 1.0, p)), xN = -dist / 2, xC = dist / 2;
        const rN = lerp(190, 102, sstep(0.56, 0.66, p)) * PM, rC = lerp(79, 181, sstep(0.58, 0.68, p)) * PM, gone = tp > 0.001, arrived = tp >= 1;
        s.na.g.position.set(xN, 0, 0); s.cl.g.position.set(xC, 0, 0);
        s.na.cloud.scale.setScalar(rN); s.na.edge.scale.setScalar(rN); s.cl.cloud.scale.setScalar(rC); s.cl.edge.scale.setScalar(rC);
        const rNg = [0.34, 102 * PM, 190 * PM], rCg = [0.28, 0.62, rC];
        s.na.rings.forEach((r, i) => { r.scale.setScalar(rNg[i]); r.material.opacity = i === 2 ? 0.55 * (1 - tp) : 0.55; r.visible = i < 3 && !(i === 2 && tp >= 1); });
        s.cl.rings.forEach((r, i) => { r.scale.setScalar(rCg[i]); r.material.opacity = 0.55; });
        const shN = [2, 8, gone ? 0 : 1], shC = [2, 8, 7 + (arrived ? 1 : 0)];
        const ring = (cx, R, n, i, w, mat, off) => { for (let j = 0; j < n; j++) { const a = t * w + (j * TAU) / n + off; place(V3(cx + R * Math.cos(a), R * Math.sin(a), 0.0), mat); } };
        shN.forEach((n, i) => ring(xN, rNg[i], n, i, 1.9 / (i + 1), s.mats.dot, i * 0.6));
        shC.forEach((n, i) => { if (i < 2) ring(xC, rCg[i], n, i, 1.9 / (i + 1), s.mats.cross, i * 0.6); else for (let j = 0; j < n; j++) { const a = t * 0.8 + (j * TAU) / n + Math.PI; place(V3(xC + rC * Math.cos(a), rC * Math.sin(a), 0), j === 7 ? s.mats.dot : s.mats.cross, j === 7 ? 1 : 0.7); } });
        if (gone && !arrived) { const a0 = V3(xN + 190 * PM, 0, 0), a1 = V3(xC - rC, 0, 0), k = tp, e = V3().lerpVectors(a0, a1, k); e.y += Math.sin(k * Math.PI) * 1.5; place(e, s.mats.gold, 1); s.glow.visible = true; s.glow.position.copy(e); s.glow.material.opacity = 0.7; s.glow.scale.setScalar(0.9); }
        s.na.core.scale.setScalar(1.0); s.cl.core.scale.setScalar(1.0); s.ionic = { tp, dist, arrived, rN: rN / PM, rC: rC / PM };
      }
      /* ---------------------------------------------------------------- COVALENT */
      if (type === "covalent") {
        const m = MOLS[c.mol], Lu = 2.2, cA = C3.data.COV[m.a], cB = C3.data.COV[m.b], D0 = 4.3 * Lu, e1 = sstep(0.08, 0.88, p), sep = lerp(D0, Lu, 1 - Math.pow(1 - e1, 2)) + 0.045 * Lu * Math.sin(t * 7) * sstep(0.9, 1, p);
        const rA = (Lu * cA / (cA + cB)) * 1.12, rB = (Lu * cB / (cA + cB)) * 1.12, xA = -sep / 2, xB = sep / 2;
        const colA = C3.data.CPK[m.a] || 0xcccccc, colB = C3.data.CPK[m.b] || 0xcccccc;
        [[s.A, colA, xA, rA], [s.B, colB, xB, rB]].forEach(([at, col, x, r]) => { at.g.position.set(x, 0, 0); at.cloud.scale.setScalar(r); at.edge.scale.setScalar(r); at.cloud.material.color.set(col); at.edge.material.color.set(col); at.core.material.color.set(col); at.core.material.emissive.set(col); at.rings.forEach((q) => (q.visible = false)); at.core.scale.setScalar(m.a === "H" || at === s.B && m.b === "H" ? 0.8 : 1.1); });
        s.A.core.scale.setScalar(m.a === "H" ? 0.8 : 1.15); s.B.core.scale.setScalar(m.b === "H" ? 0.8 : 1.15);
        const blend = sstep(0.42, 0.82, p), polar = (ENV[m.b] - ENV[m.a]) / 1.0, shift = 0.16 * sep * clamp(polar, 0, 1) * sstep(0.6, 1, p), mid = (xA + xB) / 2 + shift, ox = ENV[m.a] === ENV[m.b] ? 0 : 0;
        const pairOff = m.ord === 1 ? [[0, 0]] : m.ord === 2 ? [[0.2, 0], [-0.2, 0]] : [[0.3, 0], [-0.15, 0.26], [-0.15, -0.26]];
        for (let k = 0; k < m.ord; k++) for (let q = 0; q < 2; q++) {
          const home = V3(q ? xB : xA, 0, 0), ph = t * 2.4 + q * Math.PI + k * 1.6, ownR = (q ? rB : rA) * 0.7;
          const own = home.clone().add(V3(ownR * Math.cos(ph * 0.8 + (q ? 2.1 : 0.4)), ownR * Math.sin(ph * 0.8 + (q ? 2.1 : 0.4)), 0.12 * k));
          const ax = (sep / 2 + 0.5 * Math.min(rA, rB)) * 0.95, shared = V3(mid + ax * Math.cos(ph), pairOff[k][0] + (0.45 + 0.3 * k * 0) * Math.sin(ph) * 0.9, pairOff[k][1] + 0.1 * Math.sin(ph * 1.7));
          place(own.lerp(shared, blend), q ? s.mats.cross : s.mats.dot, 0.9);
        }
        const lpa = [[Math.PI], [Math.PI + 1.2, Math.PI - 1.2], [Math.PI, Math.PI + 1.9, Math.PI - 1.9]];
        [[m.la, xA, rA, false, s.mats.dot], [m.lb, xB, rB, true, s.mats.cross]].forEach(([n, x, r, mir, mat]) => { for (let k = 0; k < n; k++) for (let q = 0; q < 2; q++) { let th = lpa[n - 1][k] + (q ? 0.16 : -0.16) + 0.05 * Math.sin(t * 3 + q); if (mir) th = Math.PI - th; const R = r * 0.78; place(V3(x + R * Math.cos(th), R * Math.sin(th), 0.05 * (q ? 1 : -1)), mat, 0.8); } });
        const bonded = sstep(0.9, 1, p); s.dens.visible = blend > 0.2; s.dens.position.set(mid, 0, 0); s.dens.scale.set(sep / 2 + 0.25 * Math.min(rA, rB), 0.5 + 0.2 * m.ord, 0.5 + 0.2 * m.ord); s.dens.material.opacity = 0.18 * blend; s.glow.visible = bonded > 0.02; s.glow.position.set(mid, 0, 0.1); s.glow.material.opacity = 0.35 * bonded * (0.7 + 0.3 * Math.sin(t * 5)); s.glow.scale.setScalar(1.6 + 0.6 * bonded);
        s.cov = { sep, re: m.len, sepPm: (sep / Lu) * m.len, bonded, m, dEN: Math.abs(ENV[m.b] - ENV[m.a]) };
      }
      /* ---------------------------------------------------------------- METALLIC */
      if (type === "metallic" && s.metalG) { s.metalG.set(c.field ? 1 : 0); s.metalG.update && s.metalG.update(dt); s.metalG.group.rotation.y += dt * 0.12; s.metalG.group.rotation.x = 0.28; }
    },

    overlay(ctx, s, c, w, h, S) {
      const type = c.type, p = c.prog;
      if (type === "ionic" && !c.latt && s.ionic) {
        const I = s.ionic, na = I.tp > 0.001 && I.tp >= 1, ar = I.arrived;
        H.pill(ctx, 10, 22, ar ? "Na⁺  (2, 8)     Cl⁻  (2, 8, 8)" : "Na  (2, 8, 1)     Cl  (2, 8, 7)", ar ? "#ffe9b8" : "#bcd0ea", 12);
        H.pill(ctx, 10, 44, ar ? "both ions now have a full outer shell (noble-gas arrangement)" : I.tp > 0 ? "Na gives its 3rd-shell electron to Cl  (• dot from Na, × crosses from Cl)" : "Na (metal) and Cl (non-metal): Na can lose 1 e⁻, Cl can gain 1 e⁻", "#9fe3ff", 10.5);
        if (ar) {
          const q1 = S.proj(V3(-I.dist / 2, I.rN * PM + 0.35, 0)), q2 = S.proj(V3(I.dist / 2, I.rC * PM + 0.35, 0));
          H.pill(ctx, q1.x, q1.y, "Na⁺  r = " + Math.round(I.rN) + " pm", "#c9a8ff", 11, "center"); H.pill(ctx, q2.x, q2.y, "Cl⁻  r = " + Math.round(I.rC) + " pm", "#7dffbd", 11, "center");
          const a = S.proj(V3(-I.dist / 2 + I.rN * PM * 0.2, 0, 0.3)), b = S.proj(V3(I.dist / 2 - I.rC * PM * 0.2, 0, 0.3));
          const rr = Math.round(I.rN + I.rC), F = (8.99e9 * Math.pow(1.602e-19, 2)) / Math.pow(rr * 1e-12, 2) * 1e9; H.pill(ctx, 10, 386, "attraction  F = k·q₁q₂ / r² ≈ " + F.toFixed(1) + " nN  (r = " + rr + " pm)", "#ffd27a", 10.5, "center");
        } else {
          const q1 = S.proj(V3(-I.dist / 2, 2.55, 0)), q2 = S.proj(V3(I.dist / 2, 1.2, 0)); H.pill(ctx, q1.x, q1.y, "Na  r = 190 pm", "#c9a8ff", 10.5, "center"); H.pill(ctx, q2.x, q2.y, "Cl  r = " + Math.round(I.rC) + " pm", "#7dffbd", 10.5, "center");
        }
      }
      if (type === "ionic" && c.latt) {
        H.pill(ctx, 10, 22, "NaCl crystal lattice — giant ionic structure", "#ffe9b8", 12); H.pill(ctx, 10, 44, "each Na⁺ is surrounded by 6 Cl⁻ and each Cl⁻ by 6 Na⁺  (6 : 6 coordination)", "#9fe3ff", 10.5);
        H.pill(ctx, 10, 66, "violet = Na⁺ (small) · green = Cl⁻ (large)   ratio Na : Cl = 1 : 1  →  NaCl", "#bcd0ea", 10);
      }
      if (type === "covalent" && s.cov) {
        const C = s.cov, m = C.m, bn = ["", "single", "double", "triple"][m.ord];
        H.pill(ctx, 10, 22, m.name + "   —   " + bn + " bond" + (C.dEN > 0.4 ? "  (polar)" : ""), "#ffe9b8", 12); H.pill(ctx, 10, 44, m.cfg, "#bcd0ea", 10.5);
        ctx.save(); ctx.font = "700 12px 'IBM Plex Mono',monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; [[m.a, -C.sep / 2], [m.b, C.sep / 2]].forEach(([e, x]) => { const q = S.proj(V3(x, 0, 0.25)); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(0,0,0,.7)"; ctx.fillStyle = "#fff"; ctx.strokeText(e, q.x, q.y); ctx.fillText(e, q.x, q.y); }); ctx.restore();
        if (C.dEN > 0.4) { const q1 = S.proj(V3(-C.sep / 2, 2.0, 0)), q2 = S.proj(V3(C.sep / 2, 2.4, 0)); H.pill(ctx, q1.x, q1.y, "δ+", "#ff9be6", 12, "center"); H.pill(ctx, q2.x, q2.y, "δ−", "#7dffbd", 12, "center"); H.pill(ctx, 10, 66, "ΔEN = " + C.dEN.toFixed(2) + "  →  the shared pair is pulled towards Cl (polar covalent)", "#ff9be6", 10.5); }
        /* energy curve (Morse) */
        const gx = 418, gy = 56, gw = 214, gh = 140, D = m.E, re = m.len, pts = []; for (let r = 0.55 * re; r <= 4.4 * re; r += re * 0.03) pts.push([r, clamp(morse(r, re, D), -D * 1.2, D * 0.5)]);
        H.graph(ctx, gx, gy, gw, gh, { series: [{ pts, color: "#ffd27a", width: 2.2 }], xmin: 0.4 * re, xmax: 4.4 * re, ymin: -D * 1.15, ymax: D * 0.55, ticksX: 4, ticksY: 4, xl: "separation / pm", yl: "E / kJ mol⁻¹", dot: [clamp(C.sepPm, 0.4 * re, 4.4 * re), morse(clamp(C.sepPm, 0.55 * re, 4.4 * re), re, D), "#fff"] });
        if (C.bonded > 0.5) H.pill(ctx, 10, 386, "bond formed: " + D + " kJ/mol released   ·   bond length " + re + " pm", "#9dffd0", 11);
        else H.pill(ctx, 10, 386, "atoms approach: attraction between nucleus and the other atom's electrons", "#8fa3c4", 10);
      }
      if (type === "metallic") {
        const mt = METALS[c.metal];
        H.pill(ctx, 10, 22, "Metallic bonding: " + mt.name + " — " + mt.ion + " cations in a sea of delocalised electrons", "#ffe9b8", 11.5);
        H.pill(ctx, 10, 44, c.field ? "electric field applied: the electron sea drifts towards the + terminal → current flows" : "electrons move freely through the whole lattice (none belongs to one atom)", c.field ? "#9dffd0" : "#9fe3ff", 10.5);
        if (c.field) { ctx.save(); ctx.fillStyle = "#ff8a8a"; ctx.font = "700 20px 'IBM Plex Mono'"; ctx.textAlign = "center"; ctx.fillText("−", 40, 220); ctx.fillStyle = "#8aa8ff"; ctx.fillText("+", 600, 220); ctx.restore(); H.pill(ctx, 320, 380, "e⁻  →", "#7fc4ff", 11, "center"); }
        H.pill(ctx, 10, 386, "blue dots = delocalised electrons   ·   silver spheres = " + mt.ion, "#8fa3c4", 10);
      }
    },

    steps(s, c) {
      const p = c.prog, st = (a, b) => (p >= b ? "done" : p >= a ? "now" : "");
      if (c.type === "ionic") return [["Na (2, 8, 1) and Cl (2, 8, 7) approach — Na is a metal, Cl a non-metal", st(0, 0.28)], ["Na loses its outer electron: Na → Na⁺ + e⁻   (ionisation energy +496 kJ/mol)", st(0.28, 0.6)], ["Cl gains that electron: Cl + e⁻ → Cl⁻   (electron affinity −349 kJ/mol)", st(0.4, 0.62)], ["Na⁺ shrinks (190 → 102 pm), Cl⁻ swells (79 → 181 pm)", st(0.56, 0.7)], ["Oppositely charged ions attract (Coulomb's law) and pack into a lattice: lattice enthalpy −787 kJ/mol, ΔH_f(NaCl) = −411 kJ/mol", st(0.62, 1)]];
      if (c.type === "covalent") { const m = MOLS[c.mol]; return [["Two " + (m.a === m.b ? ELE[m.a] : ELE[m.a] + " and " + ELE[m.b]) + " atoms approach", st(0, 0.3)], ["Outer orbitals overlap — each nucleus attracts the other atom's electron(s)", st(0.3, 0.7)], ["Electron pair" + (m.ord > 1 ? "s" : "") + " shared: " + ["", "single", "double", "triple"][m.ord] + " bond; the atoms settle at the bond length " + m.len + " pm", st(0.7, 1)], ["Energy curve minimum = bond energy " + m.E + " kJ/mol (released on forming, absorbed on breaking)", st(0.9, 1)]]; }
      return [["Each metal atom gives its outer electron(s) to a shared sea", "done"], ["The cations stay in fixed lattice positions; electrons move freely", "done"], [c.field ? "Electric field applied — the sea drifts: metals conduct" : "Apply an electric field to see conduction", c.field ? "now" : ""]];
    },
    readouts(s, c) {
      if (c.type === "ionic") { const I = s.ionic || {}; return c.latt ? [["Structure", "giant ionic lattice"], ["Coordination", "6 : 6"], ["Lattice enthalpy", "−787 kJ/mol"], ["Melting point", "801 °C"], ["Conducts?", "when molten or dissolved (ions free)"], ["Formula", "NaCl (1 : 1)"]] : [["Bond type", "ionic (electron transfer)"], ["Na → Na⁺", "2,8,1 → 2,8  (+496 kJ/mol)"], ["Cl → Cl⁻", "2,8,7 → 2,8,8  (−349 kJ/mol)"], ["Lattice enthalpy", "−787 kJ/mol"], ["ΔH_f (NaCl)", "−411 kJ/mol"], ["Ionic radii", "Na⁺ 102 pm · Cl⁻ 181 pm"], ["Progress", Math.round(c.prog * 100) + " %"]]; }
      if (c.type === "covalent") { const m = MOLS[c.mol], C = s.cov || {}; return [["Molecule", m.name], ["Bond order", m.ord + "  (" + ["", "single", "double", "triple"][m.ord] + ")"], ["Bond length", m.len + " pm"], ["Bond energy", m.E + " kJ/mol"], ["Shared pairs", m.ord], ["Lone pairs", (m.la + m.lb) + " (" + m.la + " + " + m.lb + ")"], ["ΔEN", (C.dEN || 0).toFixed(2) + (C.dEN > 0.4 ? " → polar" : " → non-polar")], ["Separation now", Math.round(C.sepPm || 0) + " pm"]]; }
      const mt = METALS[c.metal]; return [["Metal", mt.name], ["Outer electrons / atom", mt.val], ["Ion in the lattice", mt.ion], ["Melting point", mt.mp + " °C"], ["Electrical conductivity", mt.sig + " × 10⁷ S/m"], ["Why mp rises Na → Mg → Al", "more electrons + higher ion charge → stronger bond"]];
    },
  };
  function buildMetal(S, s, c) {
    if (s.metalG) { const g = s.metalG.group; g.traverse((o) => { o.geometry && o.geometry.dispose(); o.material && (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }); S.scene.remove(g); }
    const mt = METALS[c.metal]; s.metalG = S.chemKit.lattice("metal", { n: 3, electrons: 108 * mt.val, color: mt.color }); s.metalG.group.visible = c.type === "metallic";
  }
})();
