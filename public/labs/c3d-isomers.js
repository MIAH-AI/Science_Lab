/* c3d-isomers.js — chemistry 3D, new module: structural isomerism (chain, position, functional group, cis–trans) */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrapT = (ctx, text, x, y, mw, lh) => { const w = String(text).split(" "); let l = "", yy = y; w.forEach((t) => { const k = l ? l + " " + t : t; if (ctx.measureText(k).width > mw && l) { ctx.fillText(l, x, yy); l = t; yy += lh; } else l = k; }); if (l) ctx.fillText(l, x, yy); return yy; };
  const rad = (d) => (d * Math.PI) / 180;
  const LEN = { CC: 1.54, CH: 1.09, CO: 1.43, OH: 0.96, CdC: 1.34 }, VAL = { C: 4, O: 2 };
  const bl = (a, b, ord) => (a === "C" && b === "C" ? (ord === 2 ? LEN.CdC : LEN.CC) : (a === "H" || b === "H") ? (a === "O" || b === "O" ? LEN.OH : LEN.CH) : LEN.CO);

  /* build 3-D coordinates from a skeleton tree: staggered sp3 centres, planar sp2 centres */
  function build(tree) {
    const atoms = [], bonds = [];
    const add = (el, p) => { atoms.push({ el, p: [p.x, p.y, p.z] }); return atoms.length - 1; };
    const TET = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((v) => V3(...v).normalize()), PL = [V3(1, 0, 0), V3(-0.5, 0.866, 0), V3(-0.5, -0.866, 0)];
    function node(n, pos, u, pord, ref, e1in) {
      const me = add(n.el, pos), ch = n.ch || [], dbl = ch.findIndex((c) => c.ord === 2), sp2 = n.el === "C" && (pord === 2 || dbl >= 0);
      const used = (u ? pord : 0) + ch.reduce((s, c) => s + (c.ord || 1), 0), nH = Math.max(0, VAL[n.el] - used);
      let dirs = [];
      const nsl = ch.length + nH;
      if (!u) { dirs = sp2 ? PL.slice() : TET.slice(); if (dbl > 0) { const t = ch[0]; ch[0] = ch[dbl]; ch[dbl] = t; } }
      else if (n.el === "O") { const e1 = perp(u, ref), e2 = u.clone().cross(e1); dirs = [0, 1].map((k) => V3(0, 0, 0).addScaledVector(u, -0.33).addScaledVector(e1, 0.94 * Math.cos(rad(180 + 180 * k))).addScaledVector(e2, 0.94 * Math.sin(rad(180 + 180 * k))).normalize()); }
      else if (sp2) {
        const e1 = pord === 2 && e1in ? e1in : perp(u, ref); dirs = [u.clone().multiplyScalar(-0.5).addScaledVector(e1, 0.866), u.clone().multiplyScalar(-0.5).addScaledVector(e1, -0.866)];
      } else { const e1 = perp(u, ref), e2 = u.clone().cross(e1); dirs = [0, 1, 2].map((k) => u.clone().multiplyScalar(-1 / 3).addScaledVector(e1, 0.9428 * Math.cos(rad(180 + 120 * k))).addScaledVector(e2, 0.9428 * Math.sin(rad(180 + 120 * k)))); }
      /* substituent order: children (with their slot), then hydrogens */
      const kids = n.ch || []; let subs = kids.map((c) => ({ c })).concat(Array.from({ length: nH }, () => ({ c: { el: "H", ord: 1 } })));
      if (sp2 && pord === 2 && u) { const arr = [null, null]; kids.forEach((c) => { const k = arr[c.slot || 0] === null ? (c.slot || 0) : (arr[0] === null ? 0 : 1); arr[k] = { c }; }); for (let k = 0; k < 2; k++) if (arr[k] === null) arr[k] = { c: { el: "H", ord: 1 } }; subs = arr; }
      const firstDir = dirs[0] || null; let side = null;
      subs.forEach((sb, i) => { const d = (dirs[i] || dirs[dirs.length - 1]).clone().normalize(), ord = sb.c.ord || 1, p2 = pos.clone().addScaledVector(d, bl(n.el, sb.c.el, ord));
        if (sb.c.el === "H") { const h = add("H", p2); bonds.push([me, h, 1]); return; }
        let e1c = null; if (ord === 2) { const axis = d.clone(); const sideRef = u ? u.clone() : dirs[1 - (i % 2)] ? dirs[(i + 1) % dirs.length].clone() : V3(0, 1, 0); const off = sideRef.clone().addScaledVector(axis, -sideRef.dot(axis)); e1c = off.lengthSq() > 1e-6 ? off.normalize() : perp(axis, V3(0, 1, 0)); }
        const idx = node(sb.c, p2, d.clone().multiplyScalar(-1), ord, u ? u.clone() : (dirs[(i + 1) % dirs.length] || V3(0, 1, 0)), e1c); bonds.push([me, idx, ord]); });
      return me;
    }
    function perp(u, ref) { let r = ref ? ref.clone() : V3(0, 1, 0); r.addScaledVector(u, -r.dot(u)); if (r.lengthSq() < 1e-5) { r = u.clone().cross(V3(0, 0, 1)); if (r.lengthSq() < 1e-5) r = u.clone().cross(V3(1, 0, 0)); } return r.normalize(); }
    node(tree, V3(0, 0, 0), null, 1, null, null);
    const c = atoms.reduce((s, a) => [s[0] + a.p[0], s[1] + a.p[1], s[2] + a.p[2]], [0, 0, 0]).map((v) => v / atoms.length); atoms.forEach((a) => { a.p = [a.p[0] - c[0], a.p[1] - c[1], a.p[2] - c[2]]; });
    let bi = 0, bj = 0, bd = -1; for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) { const d = Math.hypot(atoms[i].p[0] - atoms[j].p[0], atoms[i].p[1] - atoms[j].p[1], atoms[i].p[2] - atoms[j].p[2]); if (d > bd) { bd = d; bi = i; bj = j; } }
    const ax = V3(atoms[bj].p[0] - atoms[bi].p[0], atoms[bj].p[1] - atoms[bi].p[1], atoms[bj].p[2] - atoms[bi].p[2]).normalize(), q = new T.Quaternion().setFromUnitVectors(ax, V3(1, 0, 0));
    atoms.forEach((a) => { const v = V3(a.p[0], a.p[1], a.p[2]).applyQuaternion(q); a.p = [v.x, v.y, v.z]; });
    return { atoms, bonds };
  }
  const C = (...ch) => ({ el: "C", ch }), Cd = (...ch) => ({ el: "C", ord: 2, ch }), O = (...ch) => ({ el: "O", ch }), sl = (n, s) => Object.assign(n, { slot: s });
  const Me = () => ({ el: "C", ch: [] });
  /* each isomer: tree, name, structural formula, boiling point, note */
  const SETS = {
    c4h10: { f: "C₄H₁₀", note: "chain (skeletal) isomers: same molecular formula, different carbon skeleton", iso: [
      { n: "butane", s: "CH₃CH₂CH₂CH₃", bp: -0.5, t: C(C(C(Me()))), why: "straight chain: more surface contact, stronger London forces" },
      { n: "2-methylpropane", s: "CH₃CH(CH₃)CH₃", bp: -11.7, t: C(Me(), Me(), Me()), why: "branched: more compact, less surface contact, weaker London forces, lower b.p." },
    ] },
    c5h12: { f: "C₅H₁₂", note: "three chain isomers: more branching → lower boiling point", iso: [
      { n: "pentane", s: "CH₃(CH₂)₃CH₃", bp: 36.1, t: C(C(C(C(Me())))), why: "unbranched" },
      { n: "2-methylbutane", s: "(CH₃)₂CHCH₂CH₃", bp: 27.7, t: C(Me(), Me(), C(Me())), why: "one branch" },
      { n: "2,2-dimethylpropane", s: "C(CH₃)₄", bp: 9.5, t: C(Me(), Me(), Me(), Me()), why: "nearly spherical: least surface contact, lowest b.p." },
    ] },
    c4h8: { f: "C₄H₈", note: "alkenes: chain, position and cis–trans (geometric) isomers; C=C cannot rotate", iso: [
      { n: "but-1-ene", s: "CH₂=CHCH₂CH₃", bp: -6.3, t: C(Cd(C(Me()))), why: "double bond at the end of the chain (position isomer)" },
      { n: "cis-but-2-ene", s: "CH₃CH=CHCH₃ (cis)", bp: 3.7, t: C(C(Cd(sl(Me(), 0)))), why: "both CH₃ groups on the same side of C=C: polar, higher b.p." },
      { n: "trans-but-2-ene", s: "CH₃CH=CHCH₃ (trans)", bp: 0.9, t: C(C(Cd(sl(Me(), 1)))), why: "CH₃ groups on opposite sides: dipoles cancel" },
      { n: "2-methylpropene", s: "CH₂=C(CH₃)₂", bp: -6.9, t: C(Cd(Me(), Me())), why: "branched chain isomer" },
    ] },
    c2h6o: { f: "C₂H₆O", note: "functional group isomers: an alcohol and an ether with the same formula but different properties", iso: [
      { n: "ethanol", s: "CH₃CH₂OH", bp: 78.4, t: C(C(O())), why: "–OH forms hydrogen bonds: much higher b.p., miscible with water" },
      { n: "methoxymethane", s: "CH₃OCH₃", bp: -24.8, t: C(O(Me())), why: "ether: no –OH, no hydrogen bonding, a gas at room temperature" },
    ] },
    c3h8o: { f: "C₃H₈O", note: "position isomers (propan-1-ol, propan-2-ol) and a functional group isomer (methoxyethane)", iso: [
      { n: "propan-1-ol", s: "CH₃CH₂CH₂OH", bp: 97.2, t: C(C(C(O()))), why: "–OH on the end carbon: hydrogen bonding" },
      { n: "propan-2-ol", s: "CH₃CH(OH)CH₃", bp: 82.6, t: C(Me(), Me(), O()), why: "–OH on the middle carbon: more compact, slightly lower b.p." },
      { n: "methoxyethane", s: "CH₃OCH₂CH₃", bp: 7.4, t: C(C(O(Me()))), why: "ether: no hydrogen bonding" },
    ] },
  };
  const FORMS = Object.keys(SETS);
  const POS = { 2: [[-1.5, 1.7], [1.5, 1.7]], 3: [[-1.5, 2.7], [1.5, 2.7], [0, 0.6]], 4: [[-1.5, 2.7], [1.5, 2.7], [-1.5, 0.6], [1.5, 0.6]] };

  C3.scenes.isomerism = {
    env: "studio", envOpts: { top: "#17243a", bottom: "#05080f" }, envI: 0.9, fov: 36, free: true, cam: [[1.4, 1.9, 9.4], [2.0, 1.6, 0]],
    values: { set: "c4h10", sel: 0, style: 0, spin: 1 },
    state: () => ({ mols: null, setKey: "", t: 0 }),
    get controls() {
      return [
        { type: "select", key: "set", label: "Molecular formula", options: FORMS.map((k) => ({ value: k, label: SETS[k].f + " (" + SETS[k].iso.length + " isomers)" })) },
        { type: "select", key: "sel", label: "Highlight isomer", options: [0, 1, 2, 3].map((i) => ({ value: i, label: "isomer " + (i + 1) })) },
        { type: "range", key: "style", label: "Ball-and-stick → space-filling", min: 0, max: 1, step: 0.01 },
        { type: "toggle", key: "spin", label: "Rotate the molecules" },
      ];
    },
    views: [{ label: "All isomers", cam: [[1.4, 1.9, 9.4], [2.0, 1.6, 0]] }, { label: "Close", cam: [[0.9, 2.4, 6.4], [1.2, 1.9, 0]] }],
    note: "Isomers have the same molecular formula but different structures, so they have different properties. Chain isomers differ in the carbon skeleton: more branching makes the molecule more compact, so there is less surface contact and weaker London forces, giving a lower boiling point. Position isomers differ in where a group or C=C sits. Functional group isomers (ethanol and methoxymethane) belong to different families. Cis–trans isomers arise because C=C cannot rotate. Geometry is built from bond lengths and angles (sp³ 109.5°, sp² 120°); boiling points are textbook values.",
    onChange(S, s, c, key) { if (key === "set") { c.sel = 0; } },
    reset(S, s, c) { Object.assign(c, { set: "c4h10", sel: 0, style: 0, spin: 1 }); },
    table(s, c) { const st = SETS[c.set]; return '<table class="c3-table"><tr><th style="text-align:left">Isomer</th><th style="text-align:left">Structural formula</th><th>b.p. / °C</th><th style="text-align:left">Reason</th></tr>' + st.iso.map((q) => '<tr><td style="text-align:left">' + q.n + '</td><td style="text-align:left">' + q.s + "</td><td>" + q.bp + '</td><td style="text-align:left">' + q.why + "</td></tr>").join("") + "</table>"; },
    build(S, s, c) { s.K = C3.kit(S); S.mk.box(11, 0.1, 5, M.matte(0x1d222b, 0.7), 1.0, -0.3, 0); s.mols = []; s.setKey = ""; },
    update(S, s, c, dt) {
      if (s.setKey !== c.set) {
        s.mols.forEach((m) => { m.group.parent && m.group.parent.remove(m.group); }); s.mols = []; const st = SETS[c.set], pos = POS[st.iso.length];
        st.iso.forEach((q, i) => { const mol = s.K.molecule(build(q.t)); mol.group.scale.setScalar(st.iso.length > 2 ? 0.255 : 0.33); mol.group.position.set(pos[i][0], pos[i][1], 0); mol.base = pos[i]; s.mols.push(mol); }); s.setKey = c.set;
      }
      s.mols.forEach((m, i) => { if (c.spin && dt > 0) m.group.rotation.y += dt * 0.5; m.refresh(c.style); const hl = i === (c.sel | 0); const k = hl ? 1.1 : 1; m.group.position.y += ((m.base[1] + (hl ? 0.06 : 0)) - m.group.position.y) * 0.2; });
    },
    overlay(ctx, s, c, w, h, S) {
      ctx.save(); ctx.textAlign = "left"; const px = w - 250, st = SETS[c.set], sel = Math.min(c.sel | 0, st.iso.length - 1);
      H.pill(ctx, 10, 22, "Isomers of " + st.f, "#ffe9b8", 11); H.pill(ctx, 10, 44, "same molecular formula, different structure", "#9fe3ff", 10);
      st.iso.forEach((q, i) => { const p = S.proj(V3(POS[st.iso.length][i][0], POS[st.iso.length][i][1] - 0.95, 0)); H.pill(ctx, p.x, p.y, (i + 1) + ". " + q.n, i === sel ? "#ffd27a" : "#bcd0ea", 9, "center"); });
      const bp = st.iso.map((q) => q.bp), lo = Math.min(...bp), hi = Math.max(...bp), rng = Math.max(1, hi - lo);
      H.panel(ctx, px, 58, 240, 14 + st.iso.length * 22 + 14); ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#8fb4ff"; ctx.fillText("Boiling points / °C", px + 8, 73);
      st.iso.forEach((q, i) => { const y = 82 + i * 22; ctx.fillStyle = i === sel ? "#ffd27a" : "#9fb2d2"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText((i + 1) + "", px + 8, y + 10); ctx.fillStyle = "rgba(143,180,255,0.15)"; ctx.fillRect(px + 20, y, 150, 12); ctx.fillStyle = i === sel ? "#ffd27a" : "#7dd3ff"; ctx.fillRect(px + 20, y, 20 + 130 * (q.bp - lo) / rng, 12); ctx.fillStyle = "#e8f0ff"; ctx.fillText(q.bp + "", px + 176, y + 10); });
      const y2 = 58 + 14 + st.iso.length * 22 + 14 + 8; H.panel(ctx, px, y2, 240, 100); const q = st.iso[sel]; ctx.font = "600 9.5px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#ffd27a"; ctx.fillText(q.n, px + 8, y2 + 15); ctx.font = "8.8px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#e8f0ff"; ctx.fillText(q.s, px + 8, y2 + 29); ctx.fillStyle = "#9fb2d2"; ctx.font = "8.5px 'IBM Plex Mono',monospace"; wrapT(ctx, q.why, px + 8, y2 + 44, 224, 10.5); ctx.fillStyle = "#8fb4ff"; wrapT(ctx, st.note, px + 8, y2 + 72, 224, 10);
      ctx.restore();
    },
    readouts(s, c) { const st = SETS[c.set], q = st.iso[Math.min(c.sel | 0, st.iso.length - 1)]; return [["Molecular formula", st.f], ["Isomer", q.n], ["Structural formula", q.s], ["Boiling point", q.bp + " °C"], ["Why", q.why], ["Number of isomers shown", String(st.iso.length)]]; },
    steps(s, c) { return [["Pick a molecular formula", "done"], ["Compare the shapes of the isomers", "now"], ["Highlight each isomer and read its boiling point", c.sel > 0 ? "done" : ""], ["Explain the trend using branching or hydrogen bonding", ""]]; },
  };
})();
