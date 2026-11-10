/* c3d-ptable.js — chemistry 3D: interactive periodic-table dashboard (all 118 elements).
   Tiles rise to show a property, colour by category / block / metal character / state / heat map,
   focus on groups, periods and blocks, click a tile for an element card, a Bohr model and links to related simulations. */
(function () {
  "use strict";
  const C3 = window.Chem3D; if (!C3 || !C3.ready || !C3.gx || !window.PT_DATA) return;
  const P3D = window.P3D, T = window.THREE, U = P3D.util, V3 = U.V3, H = P3D.hud, M = P3D.mat, G = C3.gx, TAU = Math.PI * 2;
  const { clamp, lerp } = G;

  /* ---------- data ---------- */
  const EL = window.PT_DATA.map((r) => ({ Z: r[0], s: r[1], n: r[2], A: r[3], cat: r[4], x: r[5], y: r[6], p: r[7], g: r[8], b: r[9], ph: r[10], mp: r[11], bp: r[12], d: r[13], en: r[14], ie: r[15], ea: r[16], r: r[17], sh: r[18], cfg: String(r[19] || "").replace(/^\*/, ""), app: r[20] }));
  EL.forEach((e) => { if ([9, 17, 35, 53].includes(e.Z)) e.cat = "ha"; });
  const CATS = { am: ["alkali metal", "#ef476f"], ae: ["alkaline-earth metal", "#f78c6b"], tm: ["transition metal", "#ffd166"], pt: ["post-transition metal", "#8ecae6"], md: ["metalloid", "#2ec4b6"], nm: ["other non-metal", "#7bd88f"], ha: ["halogen", "#00e0c6"], ng: ["noble gas", "#b388ff"], la: ["lanthanide", "#ff99c8"], ac: ["actinide", "#e0aaff"], un: ["unknown", "#9aa5b8"] };
  const BLK = { s: ["s-block", "#ef476f"], p: ["p-block", "#ffd166"], d: ["d-block", "#4cc9f0"], f: ["f-block", "#c77dff"] };
  const MNM = { metal: ["metal", "#8ecae6"], metalloid: ["metalloid", "#2ec4b6"], nonmetal: ["non-metal", "#7bd88f"] };
  const charOf = (e) => (e.cat === "md" || e.cat === "un" ? "metalloid" : ["nm", "ha", "ng"].includes(e.cat) ? "nonmetal" : "metal");
  const PROPS = {
    none: { n: "No property (flat table)", f: () => 0, u: "" },
    r: { n: "Atomic radius", u: "pm", f: (e) => e.r, lo: 25, hi: 300, across: "decreases →", down: "increases ↓", why: "more protons pull the same shell in across a period; a new shell is added down a group" },
    ie: { n: "1st ionisation energy", u: "kJ/mol", f: (e) => e.ie, lo: 350, hi: 2400, across: "increases →", down: "decreases ↓", why: "outer electron held more tightly across (higher nuclear charge); further away and shielded down a group" },
    en: { n: "Electronegativity (Pauling)", u: "", f: (e) => e.en, lo: 0.7, hi: 4.0, across: "increases →", down: "decreases ↓", why: "atoms become smaller with a stronger pull on shared electrons across; larger down a group — fluorine is the most electronegative" },
    ea: { n: "Electron affinity", u: "kJ/mol released", f: (e) => e.ea, lo: 0, hi: 350, across: "generally increases →", down: "generally decreases ↓", why: "halogens release the most energy when they gain an electron (Cl is highest)" },
    mp: { n: "Melting point", u: "K", f: (e) => e.mp, lo: 0, hi: 3800, across: "rises to group 14, then falls →", down: "metals: falls ↓ in group 1, non-metals rise ↓", why: "giant structures (C, Si, W) melt high; simple molecules and noble gases melt low" },
    d: { n: "Density", u: "g/cm³", f: (e) => e.d, lo: -4.1, hi: 1.36, log: true, across: "rises to the middle of the d-block →", down: "increases ↓", why: "heavier atoms packed closely: osmium and iridium are the densest; gases are very light" },
    A: { n: "Relative atomic mass", u: "", f: (e) => e.A, lo: 0, hi: 300, across: "increases →", down: "increases ↓", why: "the modern table is ordered by atomic number, but mass mostly rises with it (exceptions: Ar/K, Co/Ni, Te/I)" },
  };
  const COLS = { cat: "Category", block: "Block (s, p, d, f)", mnm: "Metal / metalloid / non-metal", state: "State at the chosen temperature", heat: "Heat map of the height property" };
  const FOCUS = {
    all: ["Whole table", () => true], s: ["s-block", (e) => e.b === "s"], p: ["p-block", (e) => e.b === "p"], d: ["d-block", (e) => e.b === "d"], f: ["f-block (lanthanides & actinides)", (e) => e.b === "f"],
    g1: ["Group 1: alkali metals", (e) => e.g === 1 && e.Z > 1], g2: ["Group 2: alkaline-earth metals", (e) => e.g === 2], g17: ["Group 17: halogens", (e) => e.g === 17], g18: ["Group 18: noble gases", (e) => e.g === 18],
    p2: ["Period 2 (Li → Ne)", (e) => e.p === 2], p3: ["Period 3 (Na → Ar)", (e) => e.p === 3], fts: ["First transition series (Sc → Zn)", (e) => e.Z >= 21 && e.Z <= 30],
    met: ["Metals", (e) => charOf(e) === "metal"], mtd: ["Metalloids", (e) => charOf(e) === "metalloid"], non: ["Non-metals", (e) => charOf(e) === "nonmetal"],
  };
  const NOTES = {
    am: "Soft, very reactive metals with 1 outer electron; form M⁺ ions. React with water: 2M + 2H₂O → 2MOH + H₂. Reactivity increases down the group. Stored under oil.",
    ae: "Reactive metals with 2 outer electrons; form M²⁺ ions. Oxides and hydroxides are basic. Reactivity increases down the group; Mg burns with a white flame.",
    tm: "Hard, dense metals with high melting points; variable oxidation states, coloured ions, catalysts (Fe in the Haber process, V₂O₅ in the Contact process) and complex ions.",
    pt: "Softer metals near the metal/non-metal line (Al, Sn, Pb); several form amphoteric oxides (Al₂O₃, ZnO, PbO).",
    md: "Elements with properties between metals and non-metals (B, Si, Ge, As); silicon and germanium are semiconductors.",
    nm: "Non-metals: poor conductors (except graphite), form acidic or neutral oxides and gain or share electrons.",
    ha: "Coloured, diatomic, oxidising non-metals with 7 outer electrons; form X⁻ ions. Reactivity decreases down the group, so a halogen displaces those below it from their halides.",
    ng: "Unreactive monatomic gases with full outer shells (duplet/octet). Uses: He in balloons, Ne in signs, Ar in light bulbs and welding.",
    la: "Lanthanides: soft, silvery, reactive metals filling the 4f sub-shell; used in magnets, lasers and catalysts.",
    ac: "Actinides: radioactive metals filling the 5f sub-shell; uranium and plutonium are nuclear fuels.",
    un: "Super-heavy synthetic element made only a few atoms at a time; properties predicted.",
  };
  const USES = { H: "fuel, Haber process (NH₃), margarine", He: "balloons, cooling MRI magnets", Li: "rechargeable batteries", C: "fuels, steel, diamond tools, graphite electrodes", N: "fertilisers (NH₃), food packaging", O: "respiration, welding, steel making", F: "toothpaste (fluoride), PTFE", Ne: "advertising signs", Na: "street lamps, NaCl, NaOH", Mg: "flares, light alloys", Al: "aircraft, cans, cables (light, does not corrode)", Si: "computer chips, glass, solar cells", P: "fertilisers, matches", S: "H₂SO₄, vulcanising rubber, fungicide", Cl: "water treatment, PVC, bleach", Ar: "light bulbs, welding shield gas", K: "fertilisers (potash)", Ca: "limestone, cement, bones", Ti: "aircraft, hip joints", Cr: "stainless steel, chrome plating", Mn: "steel, dry cells (MnO₂)", Fe: "steel for buildings and tools", Co: "magnets, blue glass", Ni: "coins, stainless steel, catalyst for margarine", Cu: "electrical wiring, plumbing, brass", Zn: "galvanising iron, dry cells, brass", Br: "flame retardants", Ag: "jewellery, mirrors, photography", Sn: "tin plating cans, solder, bronze", I: "antiseptic, iodised salt", Pt: "catalytic converters, jewellery", Au: "jewellery, electronics", Hg: "thermometers (old), amalgams", Pb: "car batteries, radiation shielding", U: "nuclear fuel", Ra: "early cancer treatment" };
  const LINK = (e) => {
    const L = [["A", "2.0", "b", "Build this atom (protons, neutrons, shells)"], ["A", "2.0", "d", "Electron configuration & orbitals"]];
    if (e.g === 17) L.push(["A", "4.0", "e", "Group 7 — the halogens"]); if (e.Z >= 21 && e.Z <= 30) L.push(["A", "4.0", "f", "First transition series"], ["B", "2.0", "f", "Complex ions & their shapes"]);
    if (e.p === 3 && e.g >= 1) L.push(["B", "2.0", "c", "Period 3 oxides and their pH"]); if ([3, 11, 12, 19, 20].includes(e.Z)) L.push(["B", "2.0", "c2", "Thermal stability of carbonates & nitrates"]);
    if (["K", "Na", "Ca", "Mg", "Al", "Zn", "Fe", "Pb", "Cu", "Ag"].includes(e.s)) L.push(["C", "2.0", "e", "Reactivity series & displacement"]); if (["Li", "Na", "K", "Ca", "Sr", "Ba", "Cu"].includes(e.s)) L.push(["P", "16.0", "e", "Flame tests"]);
    if (e.g === 18) L.push(["C", "1.0", "i", "Noble gases"]); const sp = { C: ["C", "1.0", "a", "Carbon & its allotropes"], S: ["C", "1.0", "h2", "Allotropes of sulphur"], N: ["C", "1.0", "g", "Nitrogen & its compounds"], O: ["C", "1.0", "b", "Preparation of oxygen"], H: ["C", "1.0", "c", "Preparation of hydrogen"], Si: ["B", "2.0", "d", "Silicon: SiO₂ vs CO₂"], Al: ["C", "2.0", "a2", "Extraction of aluminium"], Cu: ["C", "2.0", "f", "Copper & its compounds"], Na: ["C", "2.0", "c", "Sodium & its compounds"], Ca: ["C", "2.0", "d", "Calcium & its compounds"], Fe: ["A", "12.0", "f", "Corrosion of iron"], U: ["B", "1.0", "b", "Radioactivity"], Au: ["B", "10.0", "a", "Gold mining in Ghana"], Mn: ["B", "10.0", "a", "Manganese mining in Ghana"] }[e.s]; if (sp) L.push(sp);
    return L;
  };
  const HEAT = [[27, 31, 75], [58, 63, 184], [32, 164, 200], [94, 224, 138], [247, 225, 75], [255, 123, 46]];
  const heat = (t) => { t = clamp(t, 0, 1) * (HEAT.length - 1); const i = Math.min(HEAT.length - 2, Math.floor(t)); return G.mix(HEAT[i], HEAT[i + 1], t - i); };
  const hexRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const pos = (e) => ({ x: (e.x - 1) * 1.02 - 8.7, z: (e.y - 1) * 1.02 - 4.6 + (e.y >= 9 ? 0.35 : 0) });
  const norm = (P, e) => { let v = P.f(e); if (v == null) return null; if (P.log) v = Math.log10(Math.max(1e-6, v)); return clamp((v - P.lo) / (P.hi - P.lo), 0, 1); };
  const stateAt = (e, Tc) => { const K = Tc + 273.15; if (e.mp == null && e.bp == null) return "?"; if (e.bp != null && K >= e.bp) return "gas"; if (e.mp != null && K >= e.mp) return "liquid"; if (e.mp == null && e.bp != null) return K >= e.bp ? "gas" : "solid"; return "solid"; };
  const fmt = (v, d) => (v == null ? "—" : typeof v === "number" ? (Math.abs(v) >= 100 ? Math.round(v) : +v.toFixed(d == null ? 2 : d)) : v);
  const supCfg = (c) => c.replace(/([spdf])(\d+)/g, (m, l, n) => l + n.replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]));
  const OPT = EL.map((e) => ({ value: e.Z, label: e.Z + "  " + e.s + "  —  " + e.n }));

  function atlas(dark) {
    const c = U.cv(2048, 1024), g = c.getContext("2d"); g.clearRect(0, 0, 2048, 1024);
    EL.forEach((e, i) => { const cx = (i % 16) * 128, cy = Math.floor(i / 16) * 128; g.save(); g.translate(cx, cy); g.fillStyle = dark ? "rgba(12,16,34,0.95)" : "rgba(255,255,255,0.97)"; g.shadowColor = dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.55)"; g.shadowBlur = dark ? 3 : 6;
      g.font = "700 24px 'IBM Plex Mono',monospace"; g.textAlign = "left"; g.fillText(String(e.Z), 10, 28); g.textAlign = "center"; g.font = "800 " + (e.s.length > 2 ? 46 : 56) + "px 'IBM Plex Sans',Arial,sans-serif"; g.fillText(e.s, 64, 82);
      g.shadowBlur = 3; g.font = "600 " + (e.n.length > 10 ? 13 : 16) + "px 'IBM Plex Sans',Arial,sans-serif"; g.fillText(e.n, 64, 106); g.font = "500 14px 'IBM Plex Mono',monospace"; g.fillStyle = dark ? "rgba(12,16,34,0.75)" : "rgba(255,255,255,0.8)"; g.fillText(fmt(e.A, 2), 64, 122); g.restore(); });
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  function bgTex() { const c = U.cv(16, 512), g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "#1a1440"); gr.addColorStop(0.45, "#0d1630"); gr.addColorStop(1, "#05070f"); g.fillStyle = gr; g.fillRect(0, 0, 16, 512); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; }
  function floorTex() { const c = U.cv(512, 512), g = c.getContext("2d"); g.fillStyle = "#0b1122"; g.fillRect(0, 0, 512, 512); g.strokeStyle = "rgba(120,160,255,0.10)"; g.lineWidth = 2; for (let i = 0; i <= 512; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); } const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(12, 12); t.colorSpace = T.SRGBColorSpace; return t; }

  const BASE = {
    env: "void", envOpts: { bg: 0x070a12 }, envI: 0.9, exposure: 1.05, fov: 34, free: true, cam: [[2.2, 24, 26], [3.0, 0, 2.2]],
    values: { prop: "none", col: "cat", focus: "all", Z: 11, Tc: 25, labels: 1, atom: 1 },
    state: () => ({ sel: 11, hov: 0 }),
    get controls() {
      return [
        { type: "select", key: "prop", label: "Height of each tile shows", options: Object.keys(PROPS).map((k) => ({ value: k, label: PROPS[k].n + (PROPS[k].u ? " (" + PROPS[k].u + ")" : "") })) },
        { type: "select", key: "col", label: "Colour tiles by", options: Object.keys(COLS).map((k) => ({ value: k, label: COLS[k] })) },
        { type: "select", key: "focus", label: "Focus on", options: Object.keys(FOCUS).map((k) => ({ value: k, label: FOCUS[k][0] })) },
        { type: "select", key: "Z", label: "Element (or click a tile)", options: OPT },
        { type: "button", label: "◀ Previous element", cls: "secondary", action: (S, s, c, ref) => { c.Z = Math.max(1, c.Z - 1); ref(); } },
        { type: "button", label: "Next element ▶", cls: "secondary", action: (S, s, c, ref) => { c.Z = Math.min(118, c.Z + 1); ref(); } },
        { type: "range", key: "Tc", label: "Temperature for 'State' colouring (°C)", min: -270, max: 3500, step: 5, unit: " °C" },
        { type: "toggle", key: "labels", label: "Show group and period numbers" },
        { type: "toggle", key: "atom", label: "Show the Bohr model of the selected element" },
      ];
    },
    views: [{ label: "Whole table", cam: [[2.2, 24, 26], [3.0, 0, 2.2]] }, { label: "Bird's-eye", cam: [[4.2, 30, 4.0], [4.1, 0, 1.0]] }, { label: "Side-on (heights)", cam: [[5.4, 6.5, 24.0], [4.0, 1.4, 0]] }, { label: "Selected element", cam: (S, s, c) => { const e = EL[c.Z - 1], p = pos(e); return [[p.x + 2.4, 6.2, p.z + 7.6], [p.x + 0.8, 0.8, p.z]]; } }],
    note: "The modern periodic table arranges the elements in order of increasing atomic number (periodic law: properties repeat periodically with atomic number). Vertical columns are groups (same number of outer electrons, similar chemistry); horizontal rows are periods (same number of occupied shells). Metals are on the left, non-metals on the right, with metalloids along the staircase line. Across a period atomic radius decreases while ionisation energy and electronegativity increase; down a group atomic radius increases while ionisation energy and electronegativity decrease. Drag to orbit, scroll to zoom and click any tile.",
    onChange(S, s, c, key, ref) { if (key === "Z") { s.sel = c.Z | 0; buildAtom(S, s, c); } if (key === "focus") { flyFocus(S, s, c); } },
    reset(S, s, c) { Object.assign(c, this.values); s.sel = c.Z; buildAtom(S, s, c); C3.setView(S, { cam: this.cam }); },
    build(S, s, c) {
      const sc = S.scene; sc.background = bgTex(); s.K = C3.kit(S);
      const fl = new T.Mesh(new T.PlaneGeometry(80, 80), new T.MeshPhysicalMaterial({ color: 0xffffff, map: floorTex(), roughness: 0.35, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.25 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
      const base = new T.Mesh(new T.BoxGeometry(20.2, 0.12, 12.4), new T.MeshPhysicalMaterial({ color: 0x141c33, roughness: 0.25, metalness: 0.4, clearcoat: 1 })); base.position.set(0.2, 0.06, 0.95); base.receiveShadow = true; sc.add(base);
      const edge = new T.Mesh(new T.BoxGeometry(20.3, 0.03, 12.5), new T.MeshBasicMaterial({ color: 0x5b7cff, transparent: true, opacity: 0.35 })); edge.position.set(0.2, 0.125, 0.95); sc.add(edge);
      [[-16, 9, -4, 0x4cc9f0, 22], [18, 9, -6, 0xff6bd6, 18], [2, 14, -12, 0xffffff, 16]].forEach(([x, y, z, col, I]) => { const L = new T.PointLight(col, I, 40, 1.2); L.position.set(x, y, z); sc.add(L); });
      const key = new T.DirectionalLight(0xfff4e6, 1.6); key.position.set(6, 16, 12); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); const sh = key.shadow.camera; sh.left = -13; sh.right = 13; sh.top = 10; sh.bottom = -10; sh.near = 1; sh.far = 50; sc.add(key);
      const box = S.mk.rbox(0.9, 1, 0.9, 0.06, M.matte(0xffffff)); sc.remove(box); const geo = box.geometry; geo.translate(0, 0.5, 0); s.geo = geo;
      s.labelMat = new T.MeshBasicMaterial({ map: atlas(false), transparent: true, depthWrite: false, toneMapped: false }); s.labelMatD = new T.MeshBasicMaterial({ map: atlas(true), transparent: true, depthWrite: false, toneMapped: false });
      s.tiles = EL.map((e, i) => {
        const p = pos(e), mat = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.12, emissive: 0x000000 });
        const m = new T.Mesh(geo, mat); m.position.set(p.x, 0.12, p.z); m.castShadow = m.receiveShadow = true; m.userData.Z = e.Z; sc.add(m);
        const lg = new T.PlaneGeometry(0.86, 0.86), uv = lg.attributes.uv, cx = (i % 16) / 16, cy = 1 - Math.floor(i / 16) / 8; for (let k = 0; k < uv.count; k++) uv.setXY(k, cx + uv.getX(k) / 16, cy - 1 / 8 + uv.getY(k) / 8);
        const lab = new T.Mesh(lg, s.labelMat); lab.rotation.x = -Math.PI / 2; lab.position.set(p.x, 0.5, p.z); lab.renderOrder = 6; sc.add(lab);
        return { e, m, lab, h: 0.25, ht: 0.25, col: new T.Color(1, 1, 1), x: p.x, z: p.z };
      });
      /* placeholders for the f-block in group 3 */
      [[6, "57–71"], [7, "89–103"]].forEach(([per, t]) => { const p = pos({ x: 3, y: per }); const m = new T.Mesh(new T.BoxGeometry(0.9, 0.05, 0.9), new T.MeshBasicMaterial({ color: per === 6 ? 0xff99c8 : 0xe0aaff, transparent: true, opacity: 0.35 })); m.position.set(p.x, 0.15, p.z); sc.add(m); });
      /* selection frame + beacon */
      s.frame = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(0.98, 1, 0.98)), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })); s.frame.geometry.translate(0, 0.5, 0); sc.add(s.frame);
      s.hframe = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(0.95, 1, 0.95)), new T.LineBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.7 })); s.hframe.geometry.translate(0, 0.5, 0); sc.add(s.hframe);
      s.beam = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 1, 32, 1, true), new T.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.12, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); sc.add(s.beam);
      s.selLight = new T.PointLight(0xffffff, 6, 5, 1.6); sc.add(s.selLight);
      /* metal / non-metal staircase */
      const st = [[13, 2], [13, 3], [14, 3], [14, 4], [15, 4], [15, 5], [16, 5], [16, 6], [17, 6], [17, 7]], pts = []; st.forEach(([gx, py], i) => { const a = pos({ x: gx, y: py }); pts.push(V3(a.x - 0.51 + (i % 2 ? 0 : 0), 0.14, a.z - 0.51 + (i % 2 ? 1.02 : 0))); }); pts.unshift(V3(pos({ x: 13, y: 2 }).x - 0.51, 0.14, pos({ x: 13, y: 2 }).z - 0.51));
      const sp = []; let cur = V3(pos({ x: 13, y: 2 }).x - 0.51, 0.14, pos({ x: 13, y: 2 }).z - 0.51); sp.push(cur.clone()); for (let k = 0; k < 6; k++) { cur = cur.clone().add(V3(0, 0, 1.02)); sp.push(cur.clone()); cur = cur.clone().add(V3(1.02, 0, 0)); sp.push(cur.clone()); } cur = cur.clone().add(V3(0, 0, 1.02 * 0)); s.stair = S.mk.tube(sp, 0.035, M.emissive(0xff4d6d, 2.2), 80, false); s.stair.visible = false;
      /* Bohr model showcase (in the gap between groups 2 and 13) */
      s.atomG = new T.Group(); s.atomG.position.set(pos({ x: 7.5, y: 2 }).x, 3.4, pos({ x: 7.5, y: 2 }).z - 0.3); sc.add(s.atomG); s.atomG.rotation.x = -0.5; s.atomG.scale.setScalar(2.3);
      s.ped = new T.Mesh(new T.CylinderGeometry(0.75, 0.9, 0.1, 64), new T.MeshPhysicalMaterial({ color: 0x1a2348, roughness: 0.15, metalness: 0.6, clearcoat: 1 })); s.ped.position.set(s.atomG.position.x, 0.18, s.atomG.position.z); sc.add(s.ped);
      s.pedRing = new T.Mesh(new T.TorusGeometry(0.82, 0.02, 8, 96), new T.MeshBasicMaterial({ color: 0x5b7cff })); s.pedRing.rotation.x = Math.PI / 2; s.pedRing.position.set(s.atomG.position.x, 0.25, s.atomG.position.z); sc.add(s.pedRing);
      /* picking */
      const ray = new T.Raycaster(), ndc = new T.Vector2(), tileMeshes = s.tiles.map((t) => t.m); let down = null;
      const pick = (ev) => { const r = S.c3.getBoundingClientRect(); ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, S.camera); const hit = ray.intersectObjects(tileMeshes, false)[0]; return hit ? hit.object.userData.Z : 0; };
      const onDown = (ev) => { down = [ev.clientX, ev.clientY]; }, onUp = (ev) => { if (down && Math.hypot(ev.clientX - down[0], ev.clientY - down[1]) < 6) { const z = pick(ev); if (z) { c.Z = z; s.sel = z; buildAtom(S, s, c); s.syncCtl = 1; } } down = null; };
      let lastMove = 0; const onMove = (ev) => { const now = performance.now(); if (now - lastMove < 60) return; lastMove = now; s.hov = pick(ev); S.wrap.style.cursor = s.hov ? "pointer" : ""; };
      S.wrap.addEventListener("pointerdown", onDown); S.wrap.addEventListener("pointerup", onUp); S.wrap.addEventListener("pointermove", onMove); S.wrap.addEventListener("pointerleave", () => { s.hov = 0; });
      S.cleanup = () => { S.wrap.removeEventListener("pointerdown", onDown); S.wrap.removeEventListener("pointerup", onUp); S.wrap.removeEventListener("pointermove", onMove); S.wrap.style.cursor = ""; };
      s.sel = c.Z | 0; buildAtom(S, s, c); if (c.focus !== "all") flyFocus(S, s, c);
    },
    update(S, s, c, dt) {
      const P = PROPS[c.prop] || PROPS.none, F = (FOCUS[c.focus] || FOCUS.all)[1], t = S.t, k = 1 - Math.pow(0.002, Math.max(dt, 0.016));
      if (s.syncCtl) { s.syncCtl = 0; const sel = document.querySelectorAll(".sim-controls select")[3]; if (sel) sel.value = String(c.Z); }
      s.tiles.forEach((T2) => {
        const e = T2.e, inF = F(e), nv = norm(P, e), sel = e.Z === s.sel; let rgb;
        if (c.col === "cat") rgb = hexRgb(CATS[e.cat][1]); else if (c.col === "block") rgb = hexRgb(BLK[e.b][1]); else if (c.col === "mnm") rgb = hexRgb(MNM[charOf(e)][1]);
        else if (c.col === "state") { const st = stateAt(e, c.Tc); rgb = st === "gas" ? [255, 209, 102] : st === "liquid" ? [76, 201, 240] : st === "solid" ? [176, 186, 204] : [90, 96, 110]; }
        else rgb = nv == null ? [70, 74, 86] : heat(nv);
        if (!inF) rgb = G.mix(rgb, [36, 42, 60], 0.82); if (c.prop !== "none" && nv == null && inF) rgb = G.mix(rgb, [60, 64, 76], 0.6);
        T2.col.lerp(G.col(rgb), k); T2.m.material.color.copy(T2.col); const lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]; T2.lab.material = lum > 150 ? s.labelMatD : s.labelMat;
        T2.ht = (c.prop === "none" ? 0.32 : nv == null ? 0.12 : 0.22 + 3.4 * nv) * (inF ? 1 : 0.35) + (sel ? 0.25 : 0);
        T2.h += (T2.ht - T2.h) * k; T2.m.scale.y = Math.max(0.05, T2.h); T2.lab.position.y = 0.12 + T2.h + 0.004; T2.lab.material.opacity = 1;
        const glow = sel ? 0.35 + 0.15 * Math.sin(t * 3) : e.Z === s.hov ? 0.18 : 0; T2.m.material.emissive.copy(T2.col).multiplyScalar(glow);
        T2.m.material.transmission = 0; T2.m.material.opacity = 1;
      });
      const ts = s.tiles[s.sel - 1]; s.frame.position.set(ts.x, 0.12, ts.z); s.frame.scale.y = ts.h + 0.02; s.beam.position.set(ts.x, 0.12 + ts.h + 1.5, ts.z); s.beam.scale.y = 3; s.beam.material.opacity = 0.08 + 0.05 * Math.sin(t * 4); s.selLight.position.set(ts.x, ts.h + 1.4, ts.z + 0.4);
      const th = s.tiles[(s.hov || 1) - 1]; s.hframe.visible = !!s.hov && s.hov !== s.sel; s.hframe.position.set(th.x, 0.12, th.z); s.hframe.scale.y = th.h + 0.01;
      s.stair.visible = c.col === "mnm";
      const showAtom = !!c.atom; s.atomG.visible = showAtom; s.ped.visible = showAtom; s.pedRing.visible = showAtom;
      if (showAtom && s.shells) { s.atomG.rotation.y = Math.sin(t * 0.25) * 0.3; s.shells.forEach((sh, i) => { sh.rot += dt * (1.2 / (i + 1)); sh.el.forEach((m, j) => { const a = sh.rot + (j / sh.el.length) * TAU; m.position.set(Math.cos(a) * sh.R, 0, Math.sin(a) * sh.R); }); }); s.nuc.rotation.y += dt * 0.6; s.pedRing.material.color.setHSL((t * 0.05) % 1, 0.6, 0.65); }
    },
    overlay(ctx, s, c, w, h, S) {
      const e = EL[s.sel - 1], P = PROPS[c.prop] || PROPS.none, px = w - 206; ctx.save();
      G.titles(ctx, "Interactive periodic table — 118 elements", "height: " + (c.prop === "none" ? "flat" : P.n + (P.u ? " (" + P.u + ")" : "")) + "   ·   colour: " + COLS[c.col] + (c.focus !== "all" ? "   ·   focus: " + FOCUS[c.focus][0] : ""));
      if (c.labels) { ctx.save(); ctx.font = "700 8px 'IBM Plex Mono',monospace"; ctx.textAlign = "center"; ctx.shadowColor = "rgba(0,0,0,.9)"; ctx.shadowBlur = 3; const lab = (p3, t2, col) => { const q = S.proj(p3); if (q.z > 1) return; ctx.fillStyle = col; ctx.fillText(t2, q.x, q.y); };
        for (let gq = 1; gq <= 18; gq++) { const row = gq === 1 || gq === 18 ? 1 : gq <= 2 || gq >= 13 ? 2 : 4, a = pos({ x: gq, y: row }), tt = s.tiles.find((q) => q.e.x === gq && q.e.y === row); lab(V3(a.x, 0.12 + (tt ? tt.h : 0.3) + 0.06, a.z - 0.62), String(gq), "#b9c9ff"); }
        for (let pq = 1; pq <= 7; pq++) { const a = pos({ x: 1, y: pq }); lab(V3(a.x - 0.72, 0.16, a.z + 0.12), String(pq), "#b9c9ff"); } ctx.restore(); }
      if (s.hov && s.hov !== s.sel) { const th = s.tiles[s.hov - 1]; G.tag(ctx, S, V3(th.x, th.h + 0.9, th.z), th.e.n + (c.prop !== "none" ? ": " + fmt(P.f(th.e)) + " " + P.u : ""), "#ffffff", 9); }
      if (c.atom && s.shells) 
      /* trend arrows */
      if (c.prop !== "none" && P.across) { const a1 = S.proj(V3(-8.7, 0.3, 6.1)), a2 = S.proj(V3(8.6, 0.3, 6.1)), d1 = S.proj(V3(-9.75, 0.3, -4.6)), d2 = S.proj(V3(-9.75, 0.3, 1.6));
        ctx.globalAlpha = 0.95; G.curly && 0; const arrow = (p, q, col, lab) => { ctx.strokeStyle = ctx.fillStyle = col; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); const an = Math.atan2(q.y - p.y, q.x - p.x); ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - 10 * Math.cos(an - 0.4), q.y - 10 * Math.sin(an - 0.4)); ctx.lineTo(q.x - 10 * Math.cos(an + 0.4), q.y - 10 * Math.sin(an + 0.4)); ctx.fill(); H.pill(ctx, (p.x + q.x) / 2, (p.y + q.y) / 2 + 16, lab, col, 8.5, "center"); };
        arrow(a1, a2, "#7fe0ff", "across a period: " + P.across); arrow(d1, d2, "#ffb38a", "down a group: " + P.down); ctx.globalAlpha = 1; }
      /* legend */
      const leg = c.col === "cat" ? Object.values(CATS).slice(0, 10) : c.col === "block" ? Object.values(BLK) : c.col === "mnm" ? Object.values(MNM) : c.col === "state" ? [["solid", "#b0bacc"], ["liquid", "#4cc9f0"], ["gas", "#ffd166"]] : null;
      ctx.font = "600 9px 'IBM Plex Mono',monospace"; let lx = 10, ly = h - 14;
      if (leg) { const maxW = w - 220, wsum = leg.reduce((a, [n]) => a + ctx.measureText(n).width + 26, 0); let rowsN = 1, xx = 10; leg.forEach(([n]) => { const tw = ctx.measureText(n).width; if (xx + tw + 26 > maxW) { rowsN++; xx = 10; } xx += tw + 26; }); ly = h - 14 - (rowsN - 1) * 16; H.panel(ctx, 6, ly - 15, Math.min(maxW, wsum + 8), 22 + (rowsN - 1) * 16); leg.forEach(([n, col]) => { const tw = ctx.measureText(n).width; if (lx + tw + 26 > maxW) { lx = 10; ly += 16; } ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(lx + 4, ly - 9, 12, 12, 3) : ctx.rect(lx + 4, ly - 9, 12, 12); ctx.fill(); ctx.fillStyle = "#dfe8ff"; ctx.textAlign = "left"; ctx.fillText(n, lx + 20, ly + 1); lx += tw + 26; }); if (c.col === "state") { ctx.fillStyle = "#ffe9b8"; ctx.fillText("at " + c.Tc + " °C", lx + 6, ly + 1); } }
      else { H.panel(ctx, 6, ly - 15, 236, 22); for (let i = 0; i < 160; i++) { ctx.fillStyle = G.css(heat(i / 159)); ctx.fillRect(14 + i, ly - 8, 1.2, 10); } ctx.fillStyle = "#dfe8ff"; ctx.textAlign = "left"; ctx.fillText("low", 178, ly + 1); ctx.fillText("high", 204, ly + 1); }
      /* element card */
      const cat = CATS[e.cat], cc = cat[1]; H.panel(ctx, px, 58, 200, 168); ctx.fillStyle = cc; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(px + 8, 68, 62, 74, 8) : ctx.rect(px + 8, 68, 62, 74); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = "#0b1022"; ctx.textAlign = "left"; ctx.font = "700 10px 'IBM Plex Mono',monospace"; ctx.fillText(String(e.Z), px + 13, 81); ctx.textAlign = "center"; ctx.font = "800 28px 'IBM Plex Sans',Arial,sans-serif"; ctx.fillText(e.s, px + 39, 114); ctx.font = "600 9px 'IBM Plex Mono',monospace"; ctx.fillText(fmt(e.A, 3), px + 39, 135);
      ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.font = "700 13px 'IBM Plex Sans',Arial,sans-serif"; ctx.fillText(e.n, px + 78, 80); ctx.font = "600 8.6px 'IBM Plex Mono',monospace"; ctx.fillStyle = cc; ctx.fillText(cat[0], px + 78, 94);
      ctx.fillStyle = "#cfdcff"; ctx.font = "8px 'IBM Plex Mono',monospace"; ctx.fillText("period " + e.p + " · group " + (e.g || "—"), px + 78, 108); ctx.fillText(e.b + "-block · " + stateAt(e, 25) + " at 25 °C", px + 78, 120); ctx.font = (e.sh.length > 5 ? "7.2px" : "8px") + " 'IBM Plex Mono',monospace"; ctx.fillText("shells " + e.sh.join(","), px + 78, 132);
      ctx.fillStyle = "#ffe9b8"; ctx.font = "9px 'IBM Plex Mono',monospace"; G.wrapLines(ctx, supCfg(e.cfg), 184).slice(0, 2).forEach((l, i) => ctx.fillText(l, px + 10, 160 + i * 11));
      const rows = [["radius", fmt(e.r, 0) + " pm"], ["IE₁", fmt(e.ie, 0) + " kJ/mol"], ["EN", fmt(e.en)], ["m.p.", e.mp == null ? "—" : Math.round(e.mp - 273.15) + " °C"], ["density", e.d == null ? "—" : (e.d < 0.01 ? e.d.toExponential(1) : fmt(e.d)) + " g/cm³"], ["EA", fmt(e.ea, 0) + " kJ/mol"]];
      ctx.font = "8px 'IBM Plex Mono',monospace"; rows.forEach(([a, b], i) => { const cx = px + 8 + (i % 2) * 96, cy = 190 + Math.floor(i / 2) * 11.5; ctx.fillStyle = "#8fa6d6"; ctx.fillText(a, cx, cy); ctx.fillStyle = "#e8f0ff"; ctx.fillText(b, cx + 36, cy); });
      /* periodicity graph */
      if (c.prop !== "none" && c.prop !== "A") { const pts = EL.filter((q) => q.Z <= 96 && P.f(q) != null).map((q) => [q.Z, P.log ? Math.log10(P.f(q)) : P.f(q)]); const ys = pts.map((q) => q[1]); const v = P.f(e);
        H.graph(ctx, px, 232, 200, 104, { series: [{ pts, color: "#7fe0ff", width: 1.6 }], xmin: 0, xmax: 96, ymin: Math.min(...ys), ymax: Math.max(...ys), xl: "atomic number", yl: (P.log ? "log " : "") + P.n.split(" (")[0], dot: v != null && e.Z <= 96 ? [e.Z, P.log ? Math.log10(v) : v, "#ffd166"] : null, ticksX: 4, ticksY: 3 }); }
      else G.panel(ctx, px, 232, 200, "About this group", [NOTES[e.cat]], { fs: 8 });
      ctx.restore();
    },
    readouts(s, c) { const e = EL[s.sel - 1], P = PROPS[c.prop]; const r = [["Element", e.n + " (" + e.s + "), Z = " + e.Z], ["Relative atomic mass", fmt(e.A, 3)], ["Electron configuration", supCfg(e.cfg)], ["Valence (outer) electrons", e.b === "s" || e.b === "p" ? String(e.sh[e.sh.length - 1]) : "d/f-block: variable"], ["Metal character", charOf(e)], ["Appearance", e.app || "—"]]; if (c.prop !== "none" && c.prop !== "A") r.splice(2, 0, [P.n, fmt(P.f(e)) + " " + P.u]); return r; },
    table(s, c) {
      const e = EL[s.sel - 1], P = PROPS[c.prop];
      let html = '<div class="pt-card"><div class="pt-card-h"><b>' + e.n + "</b> — " + CATS[e.cat][0] + "</div><p>" + NOTES[e.cat] + "</p>" + (USES[e.s] ? "<p><b>Uses:</b> " + USES[e.s] + "</p>" : "") + (c.prop !== "none" && P.why ? "<p><b>Trend — " + P.n + ":</b> " + P.why + ".</p>" : "") + '<div class="pt-links"><span>Explore in a simulation:</span>';
      LINK(e).forEach(([a, b, l, t]) => { html += '<button class="pt-link" onclick="window.ChemNav&&ChemNav.go(\'' + a + "','" + b + "','" + l + "')\">" + t + " →</button>"; });
      return html + "</div></div>";
    },
    steps(s, c) { return [["Click any tile (or choose from the list) to open its element card", "done"], ["Raise the tiles to show a property and read the trend arrows", c.prop !== "none" ? "done" : "now"], ["Colour by category, block or state; focus on a group or period", c.col !== "cat" || c.focus !== "all" ? "done" : c.prop !== "none" ? "now" : ""], ["Open a related simulation from the element card", ""]]; },
  };
  function flyFocus(S, s, c) { const F = (FOCUS[c.focus] || FOCUS.all)[1], L = s.tiles.filter((t) => F(t.e)); if (!L.length || c.focus === "all") { C3.setView(S, { cam: BASE.cam }); return; } let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; L.forEach((t) => { x0 = Math.min(x0, t.x); x1 = Math.max(x1, t.x); z0 = Math.min(z0, t.z); z1 = Math.max(z1, t.z); }); const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, span = Math.max(x1 - x0 + 2, (z1 - z0 + 2) * 1.3, 5), dist = Math.max(13, span * (span > 12 ? 1.75 : 1.4)), tx = cx + dist * (span > 12 ? 0.1 : 0.2); C3.setView(S, { cam: [[tx, dist * 0.68 + 1, cz + dist * 0.74], [tx, 0.6, cz + 0.4]] }); }
  function buildAtom(S, s, c) {
    G.disposeGroup(s.atomCore); s.atomCore = new T.Group(); s.atomG.add(s.atomCore); const e = EL[(s.sel || 1) - 1]; s.shells = [];
    const nuc = new T.Group(), nN = Math.min(40, Math.round(e.A || e.Z * 2)), rN = 0.12 + 0.05 * Math.cbrt(nN); for (let i = 0; i < nN; i++) { const m = new T.Mesh(new T.SphereGeometry(0.07, 14, 10), new T.MeshPhysicalMaterial({ color: i < Math.min(e.Z, nN / 2) ? 0xff5a5a : 0xc8d0dc, roughness: 0.3, clearcoat: 1, emissive: i < nN / 2 ? 0x400808 : 0 })); const d = V3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(Math.cbrt(Math.random()) * rN); m.position.copy(d); nuc.add(m); } s.atomCore.add(nuc); s.nuc = nuc;
    const glow = S.mk.soft(0xff9a6a, 0.9, 0, 0, 0, 0.45); S.scene.remove(glow); s.atomCore.add(glow);
    const n = e.sh.length, Rmax = 1.55; e.sh.forEach((cnt, i) => { const R = 0.32 + (Rmax - 0.32) * (n > 1 ? i / (n - 1) : 0.5); const ring = new T.Mesh(new T.TorusGeometry(R, 0.008, 6, 96), new T.MeshBasicMaterial({ color: 0x8fb4ff, transparent: true, opacity: 0.55 })); ring.rotation.x = Math.PI / 2; s.atomCore.add(ring);
      const el = []; const show = Math.min(cnt, 32); for (let j = 0; j < show; j++) { const m = new T.Mesh(new T.SphereGeometry(i === n - 1 ? 0.045 : 0.035, 12, 10), M.emissive(i === n - 1 ? 0xffd166 : 0x6fd0ff, 2.4)); s.atomCore.add(m); el.push(m); } s.shells.push({ R, el, rot: Math.random() * TAU }); });
  }
  C3.scenes.periodicDashboard = BASE;
  C3.scenes.periodicCategories = Object.assign({}, BASE, { values: Object.assign({}, BASE.values, { col: "mnm", Z: 14 }), reset(S, s, c) { Object.assign(c, this.values); s.sel = c.Z; buildAtom(S, s, c); C3.setView(S, { cam: BASE.cam }); } });
  C3.ptable = { EL, pos, CATS };
})();
/* ---------- "where in the periodic table" locator added to the other Periodic Chemistry scenes ---------- */
(function () {
  const C3 = window.Chem3D; if (!C3 || !C3.ptable) return; const { EL, CATS } = C3.ptable, H = window.P3D.hud;
  function locator(ctx, w, h, hl, label, cur) {
    const cs = 6.4, x0 = w - 136, y0 = h - 96, pw = 18 * cs + 12, ph = 7 * cs + 26; ctx.save(); H.panel(ctx, x0 - 6, y0 - 16, pw, ph);
    ctx.font = "600 7.6px 'IBM Plex Mono',monospace"; ctx.fillStyle = "#9fb8ff"; ctx.textAlign = "left"; ctx.fillText(label.toUpperCase(), x0, y0 - 6);
    EL.forEach((e) => { if (e.y > 7) return; const on = hl(e), x = x0 + (e.x - 1) * cs, y = y0 + (e.y - 1) * cs; ctx.fillStyle = on ? CATS[e.cat][1] : "rgba(255,255,255,0.10)"; ctx.fillRect(x, y, cs - 1, cs - 1); if (cur && cur.includes(e.s)) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.4; ctx.strokeRect(x - 1, y - 1, cs + 1, cs + 1); } });
    ctx.restore();
  }
  const MAP = {
    halogens: [(e) => e.g === 17 && e.Z <= 53, "group 17 (halogens)", (c) => [c.reag, c.salt].filter(Boolean)],
    transitionMetals: [(e) => e.Z >= 21 && e.Z <= 30, "first transition series"],
    periodicOxides: [(e) => e.p === 3, "period 3 (Na → Ar)"],
    thermalStability: [(e) => ["Li", "Na", "K", "Mg", "Ca", "Cu"].includes(e.s), "groups 1 & 2 (+ Cu)"],
    silicaCO2: [(e) => e.g === 14 && e.Z <= 14, "group 14: C and Si"],
    complexShapes: [(e) => ["Cr", "Fe", "Co", "Ni", "Cu", "Zn", "Ag", "Pt"].includes(e.s), "d-block central ions"],
    acidReactions: [(e) => ["Mg", "Zn", "Fe", "Cu", "Ca", "Na"].includes(e.s), "metals above/below H"],
    periodicTrends: [(e) => e.Z <= 36, "periods 1–4"],
  };
  /* chemistry-simulations.html loads scene files on demand, so this runs again after each one arrives */
  C3.addLocators = function () {
  Object.keys(MAP).forEach((k) => { const sc = C3.scenes[k]; if (!sc || sc._loc) return; const [hl, label, cur] = MAP[k], orig = sc.overlay; sc._loc = true;
    sc.overlay = function (ctx, s, c, w, h, S) { if (orig) orig.call(this, ctx, s, c, w, h, S); locator(ctx, w, h, hl, label, cur ? cur(c) : null); }; });
  if (C3.scenes.halogens && !C3.scenes.halogens._cam) { const hz = C3.scenes.halogens; hz._cam = true; hz.cam = [[2.0, 2.1, 6.8], [2.3, 1.2, 0]]; hz.views = [{ label: "Bench", cam: [[2.0, 2.1, 6.8], [2.3, 1.2, 0]] }].concat((hz.views || []).slice(1)); }
  };
  C3.addLocators();
})();
