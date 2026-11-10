/* agric-views.js — loads last in the Agricultural Science lab.
   1. Farm animal explorer: one animal at a time with four body views, body-system filter, tap-to-isolate and a find-the-organ game.
   2. "Animal body" control added to every 3D scene that shows farm animals, so any herd, pen or pond can be switched between
      coat, transparent, see-through and opened-flank views.
   Needs agric-atlas.js. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, BA = window.BA, AK = window.AK;
  if (!MK || !AK || !BA || !AK.atlas) return;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);

  /* ================= 1. farm animal explorer ================= */
  const SP = {
    whitefulani: { n: "White Fulani cattle", cls: "Ruminant · cattle", make: (v) => AK.animal("whitefulani", v), len: 1.7, facts: ["Zebu breed with a hump and lyre-shaped horns; kept for milk, beef and draught.", "Four-chambered stomach: rumen, reticulum, omasum, abomasum.", "Gestation about 283 days; one calf."] },
    bull: { n: "Bull (male cattle)", cls: "Ruminant · cattle, male", make: (v) => AK.animal("bull", v), len: 1.85, facts: ["Kept for breeding, beef and draught work.", "One bull can serve 25 to 30 cows by natural mating; many more by artificial insemination.", "Castrated males (steers, bullocks) are quieter and fatten well."] },
    ndama: { n: "N'Dama cattle", cls: "Ruminant · cattle", make: (v) => AK.animal("ndama", v), len: 1.45, facts: ["Small, humpless West African breed that tolerates trypanosomiasis.", "Kept for beef in the humid tsetse zone."] },
    wad: { n: "West African Dwarf goat", cls: "Ruminant · goat", make: (v) => AK.animal("wad", v), len: 0.75, facts: ["Short-legged, hardy and prolific: twins and triplets are common.", "Browser: prefers leaves and shrubs to grass.", "Gestation about 150 days."] },
    yankasa: { n: "Yankasa sheep", cls: "Ruminant · sheep", make: (v) => AK.animal("yankasa", v), len: 1.0, facts: ["White hair sheep with black patches round the eyes, ears and muzzle.", "Grazer; kept for meat. Gestation about 150 days."] },
    pig: { n: "Pig (Large White)", cls: "Non-ruminant · omnivore", make: (v) => AK.animal("pig", v), len: 1.25, facts: ["Simple stomach; eats grains, roots and kitchen waste.", "Very prolific: 8 to 12 piglets a litter, two litters a year.", "Gestation 114 days (3 months, 3 weeks, 3 days)."] },
    rabbit: { n: "Rabbit", cls: "Non-ruminant · hind-gut fermenter", make: (v) => AK.animal("rabbit", v), len: 0.36, facts: ["Simple stomach but a very large caecum where fibre is fermented.", "Eats its soft night pellets again (coprophagy).", "Gestation 31 days; 6 to 8 kits a litter."] },
    cock: { n: "Domestic fowl (cock)", cls: "Poultry · bird, male", make: (v) => AK.bird("cock", v), len: 0.55, facts: ["One cock is kept for 8 to 10 hens for fertile eggs.", "The testes are inside the body; there is no penis: mating is by pressing the vents together."] },
    hen: { n: "Domestic fowl (layer hen)", cls: "Poultry · bird", make: (v) => AK.bird("layer", v), len: 0.5, facts: ["No teeth: crop stores food, proventriculus adds juices, gizzard grinds.", "An egg takes about 25 hours to form in the oviduct.", "Incubation 21 days."] },
    tilapia: { n: "Tilapia", cls: "Fish · scaly, mainly plant-eating", make: (v) => AK.fish("tilapia", 1, v), len: 1.6, lift: 0.75, facts: ["Breathes with gills; a swim bladder controls buoyancy.", "Mouth brooder: the female carries eggs and fry in her mouth.", "Reaches table size in about 6 months."] },
    catfish: { n: "African catfish (Clarias)", cls: "Fish · scaleless, flesh-eating", make: (v) => AK.fish("catfish", 1, v), len: 1.7, lift: 0.75, facts: ["Barbels (whiskers) find food in muddy water.", "Can gulp air, so it survives crowded ponds with little oxygen.", "Does not breed readily in ponds: hatcheries use hormone injection and stripping."] },
  };
  const SYS = [["all", "All organs"], ["dig", "Digestive"], ["chest", "Heart and breathing"], ["excr", "Excretory"], ["repro", "Reproductive"]];
  const inSys = (p, sys) => sys === "all" || p.sys === sys || (sys === "chest" && (p.sys === "resp" || p.sys === "circ" || p.sys === "other"));
  const view = (S, pos, tg) => { const o = S.orbit, t = V(tg[0], tg[1], tg[2]), d = V(pos[0], pos[1], pos[2]).sub(t), r = d.length(); o.target.copy(t); o.tr = r; o.ty = Math.atan2(d.x, d.z); o.tp = Math.asin(d.y / r); o.home = { yaw: o.ty, pitch: o.tp, r, target: t.clone() }; o.touched = false; if (!S.t) { o.yaw = o.ty; o.pitch = o.tp; o.r = o.tr; } };
  const CAM = [[-0.5, 1.05, -3.7], [-0.5, 0.66, 0]];
  function explorer(key, values, title) {
    AK.def3d(key, {
      label: "Realistic 3D lab: farm animal explorer", title: title || "Farm animal explorer: look inside",
      blurb: "Choose a farm animal and how to see it: with its coat, with a transparent coat, as a see-through outline or with the left flank opened. Show one body system at a time, tap any organ to learn its job, then play Find the Organ.",
      env: "clinic", envOpts: { floor: 0 }, cam: CAM, fov: 34, free: true, syncAll: true,
      values: Object.assign({ sp: "whitefulani", body: "open", sys: "all", quiz: 0 }, values || {}),
      controls: [{ type: "select", key: "sp", label: "Animal", options: Object.keys(SP).map((k) => [k, SP[k].n]) }, { type: "tabs", key: "body", label: "Body view", options: AK.VIEWS },
        { type: "tabs", key: "sys", label: "Body system", options: SYS }, { type: "toggle", key: "quiz", label: "Game: find the organ" }],
      onChange(s, c, k) { if (!s.aF) return; if (k === "quiz") { if (c.quiz && c.body === "coat") c.body = "xray"; BA.focus.setQuiz(s, c.quiz); } if (k === "sys") { s.aF.sel = null; s.sysKey = null; } },
      build(S, s, c) { s.key = null; BA.focus.init(S, s); },
      update(S, s, c, dt) {
        const k = c.sp + "|" + c.body;
        if (s.key !== k) {
          const T3 = T(), g = BK.group(S, s), P = SP[c.sp] || SP.whitefulani, prev = s.spKey; s.key = k; s.spKey = c.sp; s.sysKey = null;
          const an = P.make({ view: c.body, dark: S.clinicDark }); g.add(an); s.an = an; g.updateMatrixWorld(true); const b0 = new T3.Box3().setFromObject(an), sc = Math.min(2.05 / (b0.max.x - b0.min.x), 1.3 / (b0.max.y - b0.min.y)); an.scale.multiplyScalar(sc); an.position.y = P.lift || 0;
          /* centre the animal on x */
          g.updateMatrixWorld(true); const box = new T3.Box3().setFromObject(an); an.position.x -= (box.min.x + box.max.x) / 2; an.position.y -= P.lift ? 0 : box.min.y; g.updateMatrixWorld(true);
          const sh = new T3.Mesh(new T3.CircleGeometry(1, 40), new T3.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: S.clinicDark ? 0.35 : 0.1, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.scale.set(0.85, 0.3, 1); sh.position.y = 0.002; g.add(sh);
          s.aparts = {};
          Object.values(an.parts || {}).forEach((p) => { const holder = p.inHead ? an.head : an.organs; p.anchor = g.worldToLocal(holder.localToWorld(p.anchor.clone())); s.aparts[p.id] = p; });
          s.aF.sel = null; s.aF.hov = null; if (prev !== c.sp) view(S, CAM[0], CAM[1]);
          BA.focus.setQuiz(s, 0); if (c.quiz && c.body !== "coat") BA.focus.setQuiz(s, 1);
        }
        if (s.sysKey !== c.sys) { s.sysKey = c.sys; Object.values(s.aparts).forEach((p) => { p.hidden = !inSys(p, c.sys); }); if (s.aF.quiz) BA.focus.next(s); }
        if (s.an && s.an.tail && s.an.kind !== "fish" && s.an.kind !== "bird") s.an.tail.rotation.x = 0.2 * Math.sin(S.t * 2.2);
        if (s.an && s.an.kind === "fish" && s.an.tail) s.an.tail.rotation.y = 0.25 * Math.sin(S.t * 3);
        BA.focus.update(S, s, dt);
      },
      overlay(ctx, s, c, S, B) {
        if (c.body === "coat") { B.pill("Choose Transparent, See-through or Opened flank to look inside", 12, 388, "#a9b6d3", 10); return; }
        const ids = Object.keys(s.aparts || {}).filter((id) => !s.aparts[id].hidden);
        BA.focus.overlay(S, s, B, { labels: ids, gap: 20, maxX: 400 });
      },
      hud(s, c) {
        const P = SP[c.sp] || SP.whitefulani, n = Object.values(s.aparts || {}).filter((p) => !p.hidden).length;
        return BA.focus.card(s, [{ title: P.n, lines: [[P.cls, "#ffd27a", true]].concat(P.facts, ["—", [c.body === "coat" ? "This is the animal as you see it on the farm." : n ? n + " organs shown. Tap one to isolate it." : "This system is not modelled for this animal. Choose another system.", "#a9b6d3"], ["Rotate the model: organs on the right side hide behind those on the left.", "#7cb3ff"]]) }]);
      },
      readouts(s, c) { const F = s.aF, P = s.aparts || {}; if (F && F.quiz) return [["Score", F.score + " / " + F.tries]]; return [["Animal", (SP[c.sp] || SP.whitefulani).n], ["Body view", (AK.VIEWS.find((v) => v[0] === c.body) || [0, ""])[1]], ["Selected", F && F.sel && P[F.sel] ? P[F.sel].name : "none"]]; },
      table: (s) => { const P = Object.values((s && s.aparts) || {}); return P.length ? MK.table(["Organ", "System", "What it does"], P.map((p) => [p.name, { dig: "Digestive", resp: "Respiratory", circ: "Circulatory", excr: "Excretory", repro: "Reproductive", other: "Buoyancy" }[p.sys] || "", p.info])) : ""; },
      tasks: ["Open the flank of the cow, then the pig. State two differences between their stomachs.", "Find the caecum in the rabbit and in the pig. Why is the rabbit's so large?", "In the hen, list the organs food passes through from beak to vent.", "Compare the hearts of the tilapia and the goat: how many chambers has each?", "Play Find the Organ until you score 8 out of 10."],
      note: "Teaching models: organs are in their correct relative positions, but shapes and sizes are simplified and scaled by eye.",
      draw: BK.fallback("Farm animal explorer", ["Ruminants (cattle, sheep, goats): four-chambered stomach", "Pig: simple stomach, spiral colon", "Rabbit: simple stomach, very large caecum", "Fowl: crop, proventriculus, gizzard, paired caeca, cloaca", "Fish: gills, two-chambered heart, swim bladder"]),
    });
  }
  explorer("H2-b", { sp: "whitefulani", body: "xray", sys: "all" }, "Organs of farm animals");
  explorer("H2-a#atlas", { sp: "wad", body: "clear", sys: "all" });
  /* the main "systems compared" scene becomes the explorer, opened on the digestive system */
  explorer("H2-c", { sp: "whitefulani", body: "open", sys: "dig" }, "Systems of farm animals: ruminant, pig, rabbit, fowl and fish");
  explorer("H3-c", { sp: "whitefulani", body: "open", sys: "repro" }, "Reproductive systems of farm animals: cow, bull, hen and cock");
  explorer("H3-e#atlas", { sp: "hen", body: "open", sys: "repro" }, "Inside the laying hen: ovary and oviduct");
  explorer("H10-c#atlas", { sp: "tilapia", body: "open", sys: "all" }, "Inside a fish: Tilapia and catfish");
  explorer("H1-b#atlas", { sp: "pig", body: "clear", sys: "dig" }, "Ruminant or non-ruminant? Compare the stomachs");

  /* ================= 2. "Animal body" control for every scene with farm animals ================= */
  /* scenes found (by a test run of the whole lab) to create animals when first opened */
  const KEYS = /*ANIMAL_KEYS*/["A1-a", "A1-b", "A2-a", "A2-b", "A3-a", "A3-b", "A3-c", "A3-d", "A4-d", "B1-a", "B1-b", "B2-b", "B2-c", "B3-c", "B12-a", "B12-b", "B12-c", "C7-e", "C9-a", "C9-b", "C9-c", "D3-a", "D3-b", "D3-e", "D3-g", "E1-b", "G2-e", "G2-f", "H1-a", "H1-b", "H2-a", "H3-a", "H4-a", "H4-b", "H5-a", "H5-b", "H5-c", "H6-a", "H6-e", "H7-a", "H7-c", "H7-d", "H8-a", "H8-c", "H8-d", "H9-a", "H9-c", "H9-e", "H9-f", "H9-g", "H10-a", "H10-b", "H10-e", "H10-g", "H11-f", "PD-1", "PD-6", "PD-8", "C4-b#farm", "C9-d#farm"]/*END*/;
  const SKIP = /#atlas$|#gut$/;
  const usesAnimals = (k, sc) => KEYS.includes(k) || /AK\.(animal|bird|fish)\(|animalYard\(|farmstead\(/.test(String(sc.build) + String(sc.update) + String(sc.make || ""));
  Object.keys(MK.scenes).forEach((k) => {
    const sc = MK.scenes[k]; if (!sc || sc.kind !== "3d" || sc._bodyDone) return; sc._bodyDone = true;
    const on = !SKIP.test(k) && usesAnimals(k, sc), b0 = sc.build, u0 = sc.update, oc = sc.onChange;
    /* every 3D scene sets the lab-wide view when it builds, so one scene's choice never leaks into the next */
    sc.build = function (S, s, c) { AK.bodyView = on ? c.body || "coat" : "coat"; return b0 && b0.call(sc, S, s, c); };
    sc.update = function (S, s, c, dt) { AK.bodyView = on ? c.body || "coat" : "coat"; return u0 && u0.call(sc, S, s, c, dt); };
    if (!on) return;
    sc.values = Object.assign({ body: "coat" }, sc.values || {});
    const ctl = { type: "tabs", key: "body", label: "Animal body", options: AK.VIEWS }, c0 = sc.controls;
    sc.controls = typeof c0 === "function" ? (c) => c0(c).concat([ctl]) : (c0 || []).concat([ctl]);
    sc.onChange = function (s, c, key, H) {
      if (key === "body") { AK.bodyView = c.body; let hit = false; ["key", "k", "dk", "sig", "built"].forEach((n) => { if (n in s) { s[n] = null; hit = true; } }); if (!hit && H && H.S && b0) { try { b0.call(sc, H.S, s, c); } catch (e) { /* scene cannot rebuild in place */ } } }
      return oc && oc.call(sc, s, c, key, H);
    };
  });
})();
