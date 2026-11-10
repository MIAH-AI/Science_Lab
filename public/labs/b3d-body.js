/* b3d-body.js — realistic body-system views for the Biology lab (loads after the other b3d files).
   Uses the anatomy kit (bio-atlas.js, bio-atlas2.js): ghost body, fixed tissue colours, tap-to-isolate and a find-it game.
   S-c heart (outside, inside, double circulation) · S-e human lungs · B-g alimentary canal ·
   R-a endocrine glands · R-b brain · S-a arm and the muscular system */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, BA = window.BA, W = MK.when, f = MK.fmt;
  if (!BA || !BA.addMode) return;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);
  const QUIZ = () => ({ type: "toggle", key: "quiz", label: "Game: find the part" });
  const part = (id, name, info, meshes, anchor, extra) => ({ id, name, info, meshes: [].concat(meshes || []), anchor: V(anchor[0], anchor[1], anchor[2]), extra });
  /* instanced dots that travel along curves */
  function dots(n, r, basic) { const T3 = T(), im = new T3.InstancedMesh(new T3.SphereGeometry(r, 10, 8), basic ? new T3.MeshBasicMaterial({ color: 0xffffff }) : new T3.MeshPhysicalMaterial({ roughness: 0.3, clearcoat: 0.6 }), n); im.instanceColor = new T3.InstancedBufferAttribute(new Float32Array(n * 3), 3); im.frustumCulled = false; im.userData.m4 = new T3.Matrix4(); im.userData.col = new T3.Color(); return im; }
  function putDot(im, i, p, hex, sc) { const m4 = im.userData.m4; if (sc != null) m4.makeScale(sc, sc, sc); else m4.identity(); m4.setPosition(p.x, p.y, p.z); im.setMatrixAt(i, m4); im.setColorAt(i, im.userData.col.setHex(hex)); }
  function flush(im) { im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; }

  /* =====================================================================
     S-c  Heart and double circulation
     ===================================================================== */
  const old = MK.scenes["S-c"] || {};
  const HP = {
    vent: ["Ventricles", "The two lower chambers. They pump blood out of the heart: the right to the lungs, the left to the whole body, so the left wall is much thicker."],
    atria: ["Atria (auricles)", "The two upper chambers. They receive blood from the veins and pass it down to the ventricles."],
    aorta: ["Aorta", "The main artery. Carries oxygenated blood from the left ventricle to the body at high pressure."],
    pulm: ["Pulmonary artery", "Carries deoxygenated blood from the right ventricle to the lungs. It is the only artery with deoxygenated blood."],
    cava: ["Venae cavae", "The two main veins. Bring deoxygenated blood from the body back to the right atrium."],
    pveins: ["Pulmonary veins", "Bring oxygenated blood from the lungs to the left atrium. They are the only veins with oxygenated blood."],
    coronary: ["Coronary vessels", "Supply the heart muscle itself with food and oxygen. A blocked coronary artery causes a heart attack."],
  };
  const HANCH = { vent: [0.1, -0.35, 0.5], atria: [-0.6, 0.5, 0.36], aorta: [0.3, 1.42, -0.1], pulm: [-0.1, 0.85, 0.36], cava: [-0.52, 1.6, 0.1], pveins: [0.98, 0.62, -0.3], coronary: [0.2, -0.5, 0.45] };
  const SEC = {
    ra: ["Right atrium", "Receives deoxygenated blood from the body through the venae cavae."], rv: ["Right ventricle", "Pumps deoxygenated blood to the lungs through the pulmonary artery. Thin wall: the lungs are close."],
    la: ["Left atrium", "Receives oxygenated blood from the lungs through the pulmonary veins."], lv: ["Left ventricle", "Pumps oxygenated blood to the whole body through the aorta."],
    wallL: ["Thick left ventricle wall", "About three times thicker than the right: it must push blood all round the body."], septum: ["Septum", "The wall of muscle that keeps oxygenated and deoxygenated blood apart."],
    tri: ["Tricuspid valve", "Three flaps between the right atrium and ventricle. Stops blood flowing back when the ventricle contracts."], bi: ["Bicuspid (mitral) valve", "Two flaps between the left atrium and ventricle. Stops backflow."],
    ao: ["Aorta", "To the body. A semilunar valve at its base stops blood falling back into the ventricle."], pa: ["Pulmonary artery", "To the lungs, with its own semilunar valve."],
    svc: ["Vena cava", "From the body."], pv: ["Pulmonary veins", "From the lungs."],
  };
  const beat = (s, c, dt) => { s.ph = ((s.ph || 0) + dt * c.hr / 60) % 1; const p = s.ph; s.at = p < 0.15 ? Math.sin(p / 0.15 * Math.PI) : 0; s.ve = p > 0.15 && p < 0.5 ? Math.sin((p - 0.15) / 0.35 * Math.PI) : 0; s.state = p < 0.15 ? "Atrial systole" : p < 0.5 ? "Ventricular systole" : "Diastole"; };
  const CAMS = { heart: [[2.1, 2.0, 8.6], [1.15, 1.72, 0]], inside: [[1.75, 1.75, 8.4], [1.25, 1.6, 0]], circ: [[1.15, 1.85, 6.3], [0.8, 1.72, 0]] };
  BK.def3d("S-c", Object.assign({}, old, {
    label: "Realistic 3D lab", title: "Heart and double circulation",
    blurb: "A beating heart you can turn and take apart: tap a vessel or chamber to isolate it, open the heart to watch the valves and the two streams of blood, then follow blood round the whole body.",
    env: "clinic", cam: CAMS.heart, fov: 34, free: true,
    values: { mode: "heart", hr: 72, sv: 70, ex: 0, quiz: 0 },
    controls: [{ type: "tabs", key: "mode", label: "View", options: [["heart", "The heart"], ["inside", "Inside the heart"], ["circ", "Double circulation"]] },
      { key: "hr", label: "Heart rate", min: 40, max: 190, unit: "beats/min" }, { key: "sv", label: "Stroke volume", min: 40, max: 120, unit: "cm³" },
      { type: "toggle", key: "ex", label: "Exercising muscles", show: W("mode", "circ") }, Object.assign(QUIZ(), { show: W("mode", "heart", "inside") })],
    syncAll: true,
    onChange(s, c, k) { if (k === "quiz" && s.focus) BA.focus.setQuiz(s, c.quiz); if (k === "ex") { c.hr = c.ex ? 150 : 72; c.sv = c.ex ? 110 : 70; } },
    build(S, s, c) { s.key = ""; s.ph = 0; BA.focus.init(S, s); },
    update(S, s, c, dt) {
      const T3 = T();
      if (s.key !== c.mode) {
        const first = s.key === ""; s.key = c.mode; const g = BK.group(S, s); s.aparts = null; s.focus.sel = null; s.heart = s.sec = s.net = null;
        if (c.mode === "heart") {
          const h = BA.heart(); h.scale.setScalar(1.12); h.position.set(0, 1.5, 0); g.add(h); s.heart = h; s.aparts = {};
          Object.keys(HP).forEach((id) => { const ms = [].concat(h.parts[id]); ms.forEach((m) => { m.userData.part = id; }); const a = HANCH[id]; s.aparts[id] = part(id, HP[id][0], HP[id][1], ms, [a[0] * 1.12, 1.5 + a[1] * 1.12, a[2] * 1.12]); });
        } else if (c.mode === "inside") {
          const h = BA.heartSection(); h.scale.setScalar(1.25); h.position.set(0, 1.35, 0.3); g.add(h); s.sec = h; s.aparts = {};
          Object.keys(SEC).forEach((id) => { const a = h.anch[id]; s.aparts[id] = part(id, SEC[id][0], SEC[id][1], [], [a[0] * 1.25, 1.35 + a[1] * 1.25, 0.3 + a[2] * 1.25]); });
          /* invisible pick targets so the chambers can be tapped */
          Object.keys(SEC).forEach((id) => { const p = s.aparts[id], m = new T3.Mesh(new T3.SphereGeometry(["ra", "la", "rv", "lv"].includes(id) ? 0.24 : 0.12, 10, 8), new T3.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); m.position.copy(p.anchor); m.userData.part = id; m.userData.pick = true; g.add(m); p.meshes.push(m); });
          s.cellR = dots(46, 0.035); s.cellL = dots(46, 0.035); h.add(s.cellR, s.cellL); s.u = Array.from({ length: 46 }, (_, i) => i / 46);
        } else {
          s.body = BA.body({ dark: S.clinicDark }); g.add(s.body);
          const O = BA.organs({ only: ["heart", "lungR", "lungL", "kidneyR", "kidneyL", "liver"], fast: true }); g.add(O.group); s.org = O.parts;
          ["lungR", "lungL", "liver", "kidneyR", "kidneyL"].forEach((id) => O.parts[id].meshes.forEach((m) => { m.material.transparent = true; m.material.opacity = 0.42; m.material.depthWrite = false; }));
          s.net = BA.vessels(); g.add(s.net.group);
          s.aparts = { lungs: part("lungs", "Lungs: blood takes up oxygen", "", [], [-0.3, 2.45, 0.1]), heartL: part("heartL", "Heart", "", [], [0.08, 2.28, 0.15]), art: part("art", "Artery (away from the heart)", "", [], [0.2, 0.95, 0.03]), vein: part("vein", "Vein (back to the heart)", "", [], [-0.62, 1.95, -0.03]), muscle: part("muscle", "Body tissues", "", [], [-0.2, 1.1, 0.03]) };
          s.legs = [-1, 1].map((sd) => { const m = new T3.Mesh(new T3.SphereGeometry(0.1, 16, 12), BK.mat.glow(0xff5a3a, 0)); m.scale.set(1, 2.6, 1); m.position.set(sd * 0.2, 1.1, 0.02); g.add(m); return m; });
        }
        BA.view(S, CAMS[c.mode][0], CAMS[c.mode][1]); if (first) { const o = S.orbit; o.yaw = o.ty; o.pitch = o.tp; o.r = o.tr; }
        BA.focus.setQuiz(s, 0); if (c.quiz && c.mode !== "circ") BA.focus.setQuiz(s, 1);
      }
      beat(s, c, dt); const flow = (c.hr * c.sv) / (72 * 70);
      if (s.heart) { s.heart.vent.scale.setScalar(1 - 0.06 * s.ve); s.heart.atria.scale.setScalar(1 - 0.09 * s.at); }
      if (s.sec) {
        const h = s.sec; h.scale.setScalar(1.25 * (1 - 0.025 * s.ve));
        const avOpen = s.ve > 0.05 ? 0 : 1, slOpen = s.ve > 0.05 ? 1 : 0; s.av = (s.av == null ? avOpen : s.av + (avOpen - s.av) * Math.min(1, dt * 14));
        [h.tri, h.bi].forEach((v) => v.forEach((piv) => { piv.rotation.z = piv.userData.s * -1.15 * s.av; }));
        h.semi.forEach((m) => { m.scale.setScalar(0.7 + 0.5 * slOpen); });
        /* blood moves in two steps: atria → ventricles in diastole, ventricles → arteries in systole */
        const sp = dt * 0.16 * flow;
        for (let i = 0; i < 46; i++) { const u0 = s.u[i]; let v = sp * (0.35 + (u0 < 0.5 ? (1 - s.ve) * 1.5 + s.at : s.ve * 3.2)); s.u[i] = (u0 + v) % 1;
          putDot(s.cellR, i, h.pathR.getPointAt(s.u[i]), 0x4a63ff); putDot(s.cellL, i, h.pathL.getPointAt(s.u[i]), 0xff3b30); }
        flush(s.cellR); flush(s.cellL);
      }
      if (s.net) { const hh = s.org.heart.obj; hh.vent.scale.setScalar(1 - 0.08 * s.ve); hh.atria.scale.setScalar(1 - 0.1 * s.at); s.net.group.step(dt, flow * (0.55 + 1.6 * s.ve)); s.legs.forEach((m) => { m.material.opacity += ((c.ex ? 0.3 + 0.1 * Math.sin(S.t * 6) : 0) - m.material.opacity) * Math.min(1, dt * 4); }); }
      BA.focus.update(S, s, dt);
    },
    overlay(ctx, s, c, S, B) {
      if (c.mode === "heart") BA.focus.overlay(S, s, B, { labels: ["aorta", "pulm", "cava", "atria", "vent", "coronary", "pveins"] });
      else if (c.mode === "inside") { BA.focus.overlay(S, s, B, { labels: ["svc", "ra", "tri", "rv", "septum", "pa", "ao", "pv", "la", "bi", "lv", "wallL"], reach: 40 }); B.pill("Blue = deoxygenated   Red = oxygenated", 12, 388, "#a9b6d3", 10); }
      else { s.aparts.muscle.name = c.ex ? "Working muscles: more blood" : "Body tissues: oxygen delivered"; BA.focus.overlay(S, s, B, { labels: ["lungs", "heartL", "art", "vein", "muscle"], hint: false, side: (id) => id === "lungs" || id === "vein" || id === "muscle" }); B.pill("Arteries red · veins blue", 12, 388, "#a9b6d3", 10); }
    },
    hud: (s, c) => { const co = c.hr * c.sv / 1000; const base = [{ title: "Cardiac cycle", lines: [[s.state || "", "#ffd27a", true], ["Cardiac output = heart rate × stroke volume", "#e8f1ff"], ["= " + c.hr + " × " + c.sv + " cm³ = " + f(co, 2) + " dm³/min", "#5bd68c"]].concat(c.mode === "inside" ? [(s.ve || 0) > 0.05 ? "Ventricles contract: tricuspid and bicuspid valves shut ('lub'), semilunar valves open." : "Ventricles relax: semilunar valves shut ('dub'), blood fills the ventricles.", "Right side → lungs. Left side → body."] : c.mode === "circ" ? ["Pulmonary circulation: heart → lungs → heart.", "Systemic circulation: heart → body → heart.", "Blood passes through the heart twice in one circuit, so pressure stays high."] : ["Right side pumps to the lungs, left side to the body.", "Valves keep the blood flowing one way."]) }]; return c.mode === "circ" ? base : BA.focus.card(s, base); },
    readouts: (s, c) => [["Heart rate", c.hr + " /min"], ["Cardiac output", f(c.hr * c.sv / 1000, 2) + " dm³/min"], ["Phase", s.state || ""]],
  }));

  /* =====================================================================
     S-e  Human lungs (new first view)
     ===================================================================== */
  BA.INFO.bronchi = ["Bronchi and bronchioles", "respiratory", "Each bronchus divides again and again into narrower bronchioles that end in the air sacs (alveoli)."];
  (function () {
    const sc = MK.scenes["S-e"]; if (!sc) return;
    const rate = sc.controls.find((q) => q.key === "rate"), sh = rate.show; rate.show = (c) => c.mode === "lungs" || sh(c);
    BA.addMode("S-e", "lungs", {
      label: "Human lungs", first: true, cam: [[0.95, 2.42, 2.55], [0.48, 2.36, 0]],
      blurb: "Real lungs in a see-through chest: watch the ribs lift and the diaphragm flatten as air is drawn down the windpipe, look inside the left lung at the bronchial tree, then try the bell-jar model, alveoli, gills and stomata.",
      values: { ribs: 1, quiz: 0 },
      controls: [{ type: "toggle", key: "ribs", label: "Rib cage" }, QUIZ()],
      make(S, s, c, g) {
        const T3 = T(); g.add(BA.body({ dark: S.clinicDark }));
        const O = BA.extra(BA.organs({ only: ["trachea", "lungR", "lungL", "diaphragm", "heart"], fast: true }), ["ribs"]); g.add(O.group); s.aparts = O.parts;
        const lm = O.parts.lungL.meshes[0]; lm.userData.baseOp = 0.34; lm.userData.soft = true;
        const br = BA.bronchi(1, 31); br.userData.part = "bronchi"; O.group.add(br); s.aparts.bronchi = part("bronchi", BA.INFO.bronchi[0], BA.INFO.bronchi[2], [br], [0.2, 2.3, 0.06]);
        s.air = dots(40, 0.011, true); g.add(s.air); s.airP = [BA.curve([[0, 3.0, 0.1], [0, 2.93, 0.035], [0, 2.56, 0.0], [0, 2.5, -0.01], [-0.07, 2.44, -0.01], [-0.16, 2.38, -0.01], [-0.2, 2.3, 0.0]]), BA.curve([[0, 3.0, 0.1], [0, 2.93, 0.035], [0, 2.56, 0.0], [0, 2.5, -0.01], [0.07, 2.44, -0.01], [0.16, 2.38, -0.01], [0.21, 2.28, 0.0]])];
        s.airU = Array.from({ length: 40 }, (_, i) => i / 40); s.ph = 0; s.hb = 0;
      },
      update(S, s, c, dt) {
        const P = s.aparts; s.ph = (s.ph + dt * c.rate / 60) % 1; const b = 0.5 - 0.5 * Math.cos(s.ph * Math.PI * 2), inn = s.ph < 0.5; s.br = b; s.inn = inn;
        for (const id of ["lungR", "lungL"]) { const m = P[id].meshes[0], cx = id === "lungR" ? -0.19 : 0.19; m.scale.set(1 + 0.06 * b, 1 + 0.045 * b, 1 + 0.1 * b); m.position.set(-cx * 0.06 * b, -2.39 * 0.045 * b + 0.028 * b, 0); }
        const d = P.diaphragm.meshes[0]; d.scale.y = 1 - 0.09 * b; d.position.y = 1.76 * 0.09 * b - 0.03 * b;
        P.ribs.hidden = !c.ribs; const r = P.ribs.meshes[0]; r.scale.set(1 + 0.045 * b, 1, 1 + 0.07 * b); r.position.set(0, 0.022 * b, 0.012 * b);
        s.hb = (s.hb + dt * 1.2) % 1; const hh = P.heart.obj; hh.vent.scale.setScalar(1 - 0.07 * (s.hb > 0.15 && s.hb < 0.5 ? Math.sin((s.hb - 0.15) / 0.35 * Math.PI) : 0));
        const sp = dt * c.rate / 60 * 2.0 * Math.sin(s.ph * Math.PI * 2);
        for (let i = 0; i < 40; i++) { s.airU[i] = ((s.airU[i] + sp) % 1 + 1) % 1; putDot(s.air, i, s.airP[i % 2].getPointAt(s.airU[i]), inn ? 0x4aa8ff : 0x9aa7bd); } flush(s.air);
      },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["trachea", "lungR", "bronchi", "heart", "diaphragm"].concat(c.ribs ? ["ribs"] : []) }); },
      hud: (s, c) => BA.focus.card(s, [{ title: s.inn ? "Inspiration (breathing in)" : "Expiration (breathing out)", lines: [s.inn ? "Diaphragm contracts and flattens; ribs move up and out." : "Diaphragm relaxes and domes up; ribs move down and in.", s.inn ? "Volume of the thorax increases → pressure falls → air is drawn in." : "Volume of the thorax decreases → pressure rises → air is pushed out.", ["Lung volume ≈ " + f(2.5 + 0.5 * (s.br || 0), 2) + " dm³ (tidal volume 0.5 dm³)", "#7cb3ff"], ["Ventilation = " + c.rate + " × 0.5 = " + f(c.rate * 0.5, 1) + " dm³/min", "#5bd68c"], ["The left lung is drawn see-through to show the bronchial tree.", "#a9b6d3"]] }]),
      readouts: (s, c) => [["Breaths", c.rate + " /min"], ["Ventilation", f(c.rate * 0.5, 1) + " dm³/min"], ["Phase", s.inn ? "Inspiration" : "Expiration"]],
    });
  })();

  /* =====================================================================
     B-g  Alimentary canal (replaces the old tube-in-a-mannequin view)
     ===================================================================== */
  (function () {
    if (!MK.scenes["B-g"]) return;
    const ST = [["mouth", "Mouth", "Teeth chew; salivary amylase starts starch → maltose. pH about 7.", 0xd9a441, "20–30 s"], ["gullet", "Oesophagus", "Peristalsis pushes the bolus down. No digestion here.", 0xd9a441, "about 8 s"], ["stomach", "Stomach", "Gastric juice: pepsin starts protein → peptides; hydrochloric acid (pH 2) kills germs; rennin clots milk.", 0xc98a3a, "3–4 hours"],
      ["smallInt", "Small intestine", "Duodenum: bile emulsifies fats; pancreatic juice adds amylase, trypsin and lipase. Ileum: digestion is completed and food is absorbed through the villi.", 0xb89a50, "4–6 hours"], ["largeInt", "Large intestine", "Water and mineral salts are absorbed. Faeces are stored in the rectum and egested through the anus.", 0x7a5230, "12–24 hours"]];
    BA.addMode("B-g", "canal", {
      label: "Alimentary canal", cam: [[0.95, 2.26, 3.45], [0.55, 2.16, 0]],
      blurb: "Follow a mouthful of food through a realistic digestive system, from the teeth to the rectum. Tap any organ to isolate it and read what it does, then compare the teeth of a human, a goat and a dog.",
      values: { jsp: 1, quiz: 0 },
      controls: [{ key: "jsp", label: "Journey speed", min: 0, max: 4, step: 0.5, unit: "×" }, QUIZ()],
      make(S, s, c, g) {
        g.add(BA.body({ dark: S.clinicDark }));
        const O = BA.extra(BA.organs({ only: ["gullet", "stomach", "liver", "gall", "pancreas", "smallInt", "largeInt"] }), ["mouth", "saliva"]); g.add(O.group); s.aparts = O.parts;
        const P = BA.paths, seg = [[[0, 2.995, 0.2], [0, 2.995, 0.1], [0, 2.99, 0.04]], P.gullet, P.stomach.map((p) => [p[0], p[1], p[2]]), P.small, P.colon];
        const len = seg.map((q) => BA.curve(q).getLength()), tot = len.reduce((a, b) => a + b, 0); let acc = 0; s.th = len.map((l) => (acc += l) / tot);
        s.curve = BA.curve([].concat(...seg)); s.u = 0; s.reg = 0;
        s.bolus = new (T().Mesh)(new (T().SphereGeometry)(0.024, 16, 12), new (T().MeshPhysicalMaterial)({ color: 0xd9a441, roughness: 0.5, emissive: 0xffc24a, emissiveIntensity: 0.5 })); s.bolus.renderOrder = 8; s.bolus.material.depthTest = false; g.add(s.bolus);
      },
      update(S, s, c, dt) {
        const sp = [0.5, 0.9, 0.35, 0.55, 0.45][s.reg] || 0.5; s.u = (s.u + dt * 0.04 * c.jsp * sp) % 1;
        s.reg = s.th.findIndex((t) => s.u < t); if (s.reg < 0) s.reg = 4;
        s.bolus.position.copy(s.curve.getPointAt(s.u)); s.bolus.material.color.setHex(ST[s.reg][3]); s.bolus.scale.setScalar(1 + 0.18 * Math.sin(S.t * 9)); s.bolus.visible = !s.focus.quiz;
        s.focus.auto = s.focus.sel ? null : ST[s.reg][0];
      },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["mouth", "saliva", "gullet", "liver", "gall", "stomach", "pancreas", "largeInt", "smallInt"] }); if (!s.focus.quiz && !s.focus.sel && s.bolus) { const p = s.bolus.position, q = MK.proj(S, p.x, p.y, p.z); B.dot(q.x, q.y, "#ffd27a", 4); } },
      hud: (s, c) => BA.focus.card(s, [{ title: "Journey of food", lines: [["Now in the " + ST[s.reg || 0][1].toLowerCase() + " (" + ST[s.reg || 0][4] + ")", "#ffd27a", true], ST[s.reg || 0][2], "—", "Ingestion → digestion → absorption → assimilation → egestion.", ["Peristalsis: waves of muscle contraction push food along.", "#7cb3ff"]] }]),
      readouts: (s, c) => [["Region", ST[s.reg || 0][1]], ["Time spent there", ST[s.reg || 0][4]]],
    });
  })();

  /* =====================================================================
     R-a  Endocrine glands
     ===================================================================== */
  (function () {
    const sc = MK.scenes["R-a"]; if (!sc) return;
    const GL = { pituitary: ["pit", "Growth hormone, ADH, FSH, LH, TSH", "Too much growth hormone: gigantism.", "Too little: dwarfism. Too little ADH: diabetes insipidus.", ["thyroid", "adrenal", "ovary", "kidneyL", "kidneyR"]],
      thyroid: ["thy", "Thyroxine: controls metabolic rate and growth", "Overactive: fast metabolism, weight loss, bulging eyes.", "Underactive: goitre (lack of iodine), cretinism in children.", ["heart", "liver", "legs"]],
      adrenal: ["adr", "Adrenaline: 'fight or flight'", "Excess: high blood pressure.", "Shortage: weakness, low blood pressure.", ["heart", "liver", "legs"]],
      islets: ["pan", "Insulin lowers blood glucose; glucagon raises it", "Too much insulin: hypoglycaemia (fainting).", "Too little insulin: diabetes mellitus (glucose in the urine).", ["liver", "legs"]],
      ovary: ["gon", "Oestrogen and progesterone (testosterone in the testes)", "Early puberty.", "Delayed puberty, infertility.", ["uterus", "chest"]] };
    const TG = { heart: [0.055, 2.28, 0.075], liver: [-0.14, 1.99, 0.05], legs: [0.2, 1.05, 0.03], uterus: [0, 1.41, 0.03], chest: [0.2, 2.42, 0.16] };
    const byOld = {}; Object.keys(GL).forEach((k) => { byOld[GL[k][0]] = k; });
    BA.addMode("R-a", "gland", {
      label: "Endocrine glands", cam: [[0.95, 2.3, 3.7], [0.55, 2.22, 0]],
      blurb: "The endocrine glands in their real places inside a see-through body. Tap a gland to isolate it, release its hormone and watch it travel in the blood to its target organs.",
      values: { quiz: 0 }, controls: [QUIZ()],
      onChange(s, c, k) { if (k === "gl") BA.focus.select(s, byOld[c.gl]); },
      make(S, s, c, g) {
        g.add(BA.body({ dark: S.clinicDark }));
        const O = BA.extra(BA.organs({ only: ["kidneyR", "kidneyL", "pancreas", "brain", "heart", "liver"], fast: true }), ["pituitary", "thyroid", "adrenal", "islets", "ovary"]); g.add(O.group); s.aparts = O.parts;
        ["kidneyR", "kidneyL", "brain", "heart", "liver"].forEach((id) => { const p = O.parts[id]; p.noQuiz = true; p.context = true; p.meshes.forEach((m) => { m.userData.baseOp = 0.3; m.userData.soft = true; }); });
        s.horm = dots(60, 0.012, true); g.add(s.horm); s.hu = Array.from({ length: 60 }, (_, i) => i / 60); s.hp = null; s.hsel = "";
      },
      update(S, s, c, dt) {
        const P = s.aparts, F = s.focus, sel = F.sel && GL[F.sel] ? F.sel : null; F.also = sel ? GL[sel][4] : null;
        if (s.hsel !== (sel || "")) { s.hsel = sel || ""; s.hp = sel ? GL[sel][4].map((t) => { const a = P[sel].anchor, b = P[t] ? P[t].anchor : V(...TG[t]); const m = a.clone().lerp(b, 0.5); m.x += 0.1; m.z -= 0.05; return BA.curve([a, m, b]); }) : null; }
        for (let i = 0; i < 60; i++) { if (!s.hp) { putDot(s.horm, i, V(0, -5, 0), 0xffd24a, 0.001); continue; } s.hu[i] = (s.hu[i] + dt * 0.28) % 1; const cv = s.hp[i % s.hp.length], u = s.hu[i]; putDot(s.horm, i, cv.getPointAt(u), 0xffc21a, Math.sin(u * Math.PI) * 1.2 + 0.2); } flush(s.horm);
        /* context organs stay visible (faint) when a gland is isolated, if they are its targets */
        Object.values(P).forEach((p) => { if (p.context) p.hidden = false; });
      },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["pituitary", "thyroid", "adrenal", "islets", "ovary"], hint: "Tap a gland to release its hormone" }); },
      hud: (s, c) => { const F = s.focus, id = F && F.sel && GL[F.sel] ? F.sel : null; if (F && F.quiz) return BA.focus.card(s); return id ? [{ title: s.aparts[id].name, lines: [["Hormone: " + GL[id][1], "#ffd27a"], s.aparts[id].info, "—", ["Too much: " + GL[id][2], "#ff7b72"], ["Too little: " + GL[id][3], "#7cb3ff"], ["Yellow dots: the hormone carried in the blood to its target organs.", "#a9b6d3"]] }] : BA.focus.card(s, [{ title: "Endocrine system", lines: ["Ductless glands release hormones straight into the blood.", "Each hormone affects only its target organs.", ["Hormones act more slowly than nerves, but their effects last longer and spread wider.", "#7cb3ff"], ["The pancreas is both a digestive gland and an endocrine gland.", "#a9b6d3"]] }]); },
      readouts: (s, c) => { const F = s.focus, P = s.aparts || {}; return [["Gland", F && F.sel && P[F.sel] ? P[F.sel].name : "tap one"]]; },
    });
    const oldSel = sc.controls.find((q) => q.key === "gl"); if (oldSel) oldSel.label = "Go to gland";
  })();

  /* =====================================================================
     R-b  Brain
     ===================================================================== */
  (function () {
    const sc = MK.scenes["R-b"]; if (!sc) return;
    const oldSel = sc.controls.find((q) => q.key === "part"); if (oldSel) oldSel.show = () => false;
    BA.addMode("R-b", "brain", {
      label: "Brain", dark: true, cam: [[5.2, 2.5, 4.6], [0.85, 1.75, -0.7]],
      blurb: "Touch a hot object and follow the impulse round the reflex arc, see how myelin speeds up a neurone, then explore a 3D brain: tap a lobe or region to isolate it and learn what it controls.",
      values: { quiz: 0 }, controls: [QUIZ()],
      make(S, s, c, g) {
        const b = BA.brain({ cell: 0.027 }); b.scale.setScalar(1.45); b.position.set(0, 2.0, 0); b.rotation.y = 0; g.add(b); s.brain = b; s.aparts = {};
        Object.values(b.parts).forEach((p) => { s.aparts[p.id] = part(p.id, p.name, p.info, p.meshes, [p.anchor.x * 1.45, 2.0 + p.anchor.y * 1.45, p.anchor.z * 1.45]); });
        ["frontal", "parietal", "temporal", "occipital"].forEach((id) => { s.aparts[id].extra = [["Part of the cerebrum, the largest part of the brain.", "#7cb3ff"]]; });
      },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["frontal", "parietal", "occipital", "temporal", "cerebellum", "hypo", "medulla", "cord"], hint: "Tap a region to isolate it" }); },
      hud: (s, c) => BA.focus.card(s, [{ title: "The brain", lines: ["Cerebrum (four lobes): thought, memory, senses and voluntary movement.", "Cerebellum: balance and coordination.", "Medulla oblongata: heartbeat and breathing.", ["Hypothalamus: temperature, water balance; controls the pituitary.", "#e8f1ff"], ["CNS = brain + spinal cord. Colours here are a teaching code, not real tissue colours.", "#a9b6d3"]] }]),
      readouts: (s, c) => { const F = s.focus, P = s.aparts || {}; return F && F.quiz ? [["Score", F.score + " / " + F.tries]] : [["Region", F && F.sel && P[F.sel] ? P[F.sel].name : "tap one"]]; },
    });
  })();

  /* =====================================================================
     S-a  Muscular system (new first view) and a realistic arm
     ===================================================================== */
  (function () {
    const sc = MK.scenes["S-a"]; if (!sc) return;
    const sd = BA.sd, lin = BA.lin, mix3 = BA.mix3, TIS = BA.tis;
    const sst = (a, b, x) => { const q = Math.max(0, Math.min(1, (x - a) / (b - a))); return q * q * (3 - 2 * q); };
    /* spindle-shaped muscle belly with pale tendons at both ends: unit length along +y */
    const fusiGeo = () => BA.cached("fusi", () => { const T3 = T(), g = new T3.CylinderGeometry(1, 1, 1, 28, 40, false); g.translate(0, 0.5, 0); const p = g.attributes.position, col = new Float32Array(p.count * 3), red = lin(TIS.muscle), hi = lin(TIS.muscleHi), ten = lin(TIS.tendon);
      for (let i = 0; i < p.count; i++) { const u = p.getY(i), r = 0.11 + 0.89 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 1.5); p.setX(i, p.getX(i) * r); p.setZ(i, p.getZ(i) * r); const c = mix3(mix3(hi, red, sst(0.2, 0.9, Math.abs(u - 0.5) * 2)), ten, sst(0.66, 0.84, Math.abs(u - 0.5) * 2)); col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; }
      g.setAttribute("color", new T3.BufferAttribute(col, 3)); g.computeVertexNormals(); return g; });
    const span = (m, a, b, thick) => { const d = b.clone().sub(a), L = d.length(); m.position.copy(a); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); m.scale.set(thick, L, thick * 0.85); };
    const boneMat = () => BA.mat.matte(TIS.bone, { roughness: 0.62 });
    const humerus = () => BA.cached("humerus", () => BA.mesh((x, y, z) => { let d = sd.cone(x, y, z, 0, 0.12, 0, 0, 2.12, 0, 0.085, 0.09); d = sd.smin(d, sd.sph(x, y, z, -0.09, 2.2, 0, 0.17), 0.1); d = sd.smin(d, sd.ell(x, y, z, 0.1, 2.12, 0, 0.09, 0.1, 0.1), 0.06); return sd.smin(d, sd.ell(x, y, z, 0, 0.03, 0, 0.13, 0.11, 0.19), 0.1); }, [-0.3, -0.12, -0.24, 0.24, 2.42, 0.24], 0.026));
    const forearm = () => BA.cached("forearm", () => BA.mesh((x, y, z) => { let u = sd.cone(x, y, z, -0.06, 0.02, 0, -0.05, 2.0, -0.03, 0.08, 0.045); u = sd.smin(u, sd.ell(x, y, z, -0.1, -0.1, 0, 0.09, 0.14, 0.1), 0.06); let r = sd.cone(x, y, z, 0.07, 0.14, 0, 0.06, 2.0, 0.03, 0.05, 0.08); r = sd.smin(r, sd.ell(x, y, z, 0.07, 0.12, 0, 0.075, 0.04, 0.075), 0.03); return Math.min(u, r); }, [-0.24, -0.28, -0.14, 0.18, 2.1, 0.14], 0.022));
    const hand = () => BA.cached("hand", () => BA.mesh((x, y, z) => { let d = sd.ell(x, y, z, 0, 2.26, 0, 0.13, 0.19, 0.055); for (let i = 0; i < 4; i++) { const fx = -0.09 + i * 0.06; d = sd.smin(d, sd.cone(x, y, z, fx, 2.4, 0, fx * 1.2 + 0.1, 2.62 + (i === 1 || i === 2 ? 0.04 : 0), 0.1, 0.028, 0.022), 0.02); } return sd.smin(d, sd.cone(x, y, z, 0.1, 2.2, 0, 0.2, 2.36, 0.08, 0.03, 0.024), 0.02); }, [-0.2, 2.02, -0.1, 0.3, 2.74, 0.18], 0.02));
    BA.addMode("S-a", "arm", {
      label: "Arm: antagonistic muscles", cam: [[1.9, 2.2, 8.4], [1.45, 1.7, 0]],
      make(S, s, c, g) {
        const T3 = T(), el = V(-0.4, 1.0, 0); s.el = el;
        const hu = new T3.Mesh(humerus(), boneMat()); hu.position.copy(el); g.add(hu);
        const scap = new T3.Mesh(new T3.SphereGeometry(1, 24, 16), boneMat()); scap.scale.set(0.34, 0.5, 0.07); scap.position.set(-0.72, 3.0, -0.16); scap.rotation.z = 0.25; g.add(scap);
        s.fore = new T3.Group(); s.fore.position.copy(el); const fb = new T3.Mesh(forearm(), boneMat()), hd = new T3.Mesh(hand(), boneMat()); fb.scale.set(1.35, 1, 1.35); hd.scale.set(1.5, 1.25, 1.5); hd.position.y = -2.02 * 0.25; s.fore.add(fb, hd); g.add(s.fore);
        s.bi = new T3.Mesh(fusiGeo(), BA.mat.muscle(4)); s.tri = new T3.Mesh(fusiGeo(), BA.mat.muscle(4)); g.add(s.bi, s.tri);
        const db = new T3.Group(), bar = new T3.Mesh(new T3.CylinderGeometry(0.04, 0.04, 0.7, 12), window.P3D.mat.chrome()); bar.rotation.x = Math.PI / 2; db.add(bar); s.plates = [-0.3, 0.3].map((z) => { const p = new T3.Mesh(new T3.CylinderGeometry(1, 1, 0.1, 24), new T3.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.4, roughness: 0.45 })); p.rotation.x = Math.PI / 2; p.position.z = z; db.add(p); return p; }); db.position.set(0.06, 2.42, 0.06); s.fore.add(db); s.db = db;
        s.aparts = { biceps: part("biceps", "Biceps (flexor)", "Contracts to bend the arm at the elbow. Its tendon is attached to the radius, close to the elbow.", [s.bi], [-0.12, 2.2, 0.2]), triceps: part("triceps", "Triceps (extensor)", "Contracts to straighten the arm. Its tendon is attached to the tip of the ulna behind the elbow.", [s.tri], [-0.62, 2.2, 0.2]),
          humerus: part("humerus", "Humerus", "The bone of the upper arm. Its round head fits the socket of the scapula (ball-and-socket joint).", [hu], [-0.4, 2.7, 0.12]), scapula: part("scapula", "Scapula (shoulder blade)", "Both muscles have their fixed end (origin) here.", [scap], [-0.85, 3.3, -0.1]),
          forearm: part("forearm", "Radius and ulna", "The two bones of the forearm: together they form the lever that the muscles move.", s.fore.children.slice(0, 2), [0.6, 1.0, 0.1]), elbow: part("elbow", "Elbow: the fulcrum", "A hinge joint: it allows movement in one plane only.", [], [-0.4, 1.0, 0.2]) };
        Object.values(s.aparts).forEach((p) => p.meshes.forEach((m) => { m.userData.part = p.id; })); s.a = c.ang;
      },
      update(S, s, c, dt) {
        s.a += (c.ang - s.a) * Math.min(1, dt * 6); const a = s.a * Math.PI / 180, el = s.el, dir = V(Math.sin(a), Math.cos(a), 0), nrm = V(Math.cos(a), -Math.sin(a), 0);
        s.fore.rotation.z = -a;
        const flex = (170 - s.a) / 130;
        span(s.bi, V(-0.2, 3.12, 0.05), el.clone().addScaledVector(dir, 0.36).addScaledVector(nrm, 0.08), 0.16 + flex * 0.09 + c.load * 0.003);
        span(s.tri, V(-0.64, 3.05, 0.0), el.clone().addScaledVector(dir, -0.2).addScaledVector(nrm, -0.1), 0.19 - flex * 0.05);
        s.bi.position.z = 0.04; s.db.visible = c.load > 0; const pr = 0.1 + c.load * 0.008; s.plates.forEach((p) => p.scale.set(pr, 1, pr));
        const P = s.aparts; P.biceps.name = "Biceps: " + (c.ang < 105 ? "contracted" : "relaxed"); P.triceps.name = "Triceps: " + (c.ang < 105 ? "relaxed" : "contracted");
        P.forearm.anchor.copy(el).addScaledVector(dir, 1.3).add(V(0, 0, 0.1));
        const W8 = c.load * 9.81 + 15; s.F = W8 * 0.35 / 0.04; s.W = W8;
      },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["scapula", "triceps", "humerus", "biceps", "elbow", "forearm"], side: (id) => id === "scapula" || id === "triceps" || id === "elbow" }); },
      hud: (s, c) => BA.focus.card(s, [{ title: "Third-class lever", lines: ["Biceps tendon joins the radius 4 cm from the elbow; the load is 35 cm away.", ["Load (hand + forearm + weight) ≈ " + f(s.W || 0, 0) + " N", "#e8f1ff"], ["Biceps force = load × 35 ÷ 4 ≈ " + f(s.F || 0, 0) + " N", "#ff7b72", true], "Antagonistic pair: the biceps bends (flexes) the arm, the triceps straightens (extends) it.", ["Muscles can only pull, never push.", "#7cb3ff"]] }]),
      readouts: (s, c) => [["Elbow angle", c.ang + "°"], ["Biceps force", f(s.F || 0, 0) + " N"]],
    });
    BA.addMode("S-a", "muscles", {
      label: "Muscular system", first: true, cam: [[1.25, 1.85, 5.6], [0.82, 1.74, 0]],
      blurb: "The main muscles of the body, front and back, in real anatomical colours: red muscle fading into pale tendon. Tap a muscle to isolate it and read what it moves, then bend a realistic arm to see how the biceps and triceps work against each other.",
      values: { quiz: 0, spin: 0 }, controls: [{ type: "toggle", key: "spin", label: "Turn slowly" }, QUIZ()],
      make(S, s, c, g) {
        const T3 = T(); s.fig = new T3.Group(); g.add(s.fig);
        const under = new T3.Mesh(BA.fasciaGeo(), BA.mat.matte(0xe9cdc6, { roughness: 0.7 })); s.fig.add(under);
        const M = BA.muscles(); s.fig.add(M.group); s.aparts = M.parts; s.rot = 0;
        Object.values(M.parts).forEach((p) => { p.facing = p.anchor.z < 0 ? -1 : 1; });
      },
      update(S, s, c, dt) { if (c.spin) s.rot += dt * 0.35; s.fig.rotation.y = s.rot; },
      overlay(ctx, s, c, S, B) { const back = Math.cos(S.orbit.yaw - (s.rot || 0)) < 0; BA.focus.overlay(S, s, B, { labels: Object.keys(s.aparts).filter((k) => (s.aparts[k].facing < 0) === back), hint: "Tap a muscle to isolate it · turn the model to see the back", world: s.fig }); },
      hud: (s, c) => BA.focus.card(s, [{ title: "Skeletal muscles", lines: ["Muscles are joined to bones by tendons and work in antagonistic pairs.", ["Flexors bend a joint: biceps, hamstrings.", "#ff9f95"], ["Extensors straighten it: triceps, quadriceps.", "#7cb3ff"], "When one muscle of a pair contracts, the other relaxes.", ["Turn the model to see the muscles of the back.", "#a9b6d3"]] }]),
      readouts: (s, c) => { const F = s.focus, P = s.aparts || {}; return F && F.quiz ? [["Score", F.score + " / " + F.tries]] : [["Muscle", F && F.sel && P[F.sel] ? P[F.sel].name : "tap one"]]; },
    });
  })();

  /* =====================================================================
     S-f  Urinary system and a sectioned kidney (new first view)
     ===================================================================== */
  (function () {
    if (!MK.scenes["S-f"]) return;
    const sd = BA.sd, lin = BA.lin, mix3 = BA.mix3;
    const sst = (a, b, x) => { const q = Math.max(0, Math.min(1, (x - a) / (b - a))); return q * q * (3 - 2 * q); };
    const bean = (x, y, z) => sd.smax(sd.ell(x, y, z, 0, 0, 0, 0.62, 1.0, 0.46), -sd.sph(x, y, z, 0.95, 0, 0, 0.52), 0.25);
    const kidneySec = () => BA.cached("kidneySec", () => { const out = lin(0x8a3b34), cortex = lin(0xb8695a), med = lin(0x7c2f33), medHi = lin(0xa8494c), pel = lin(0xf0dfb8);
      return BA.mesh((x, y, z) => sd.smax(bean(x, y, z), z - 0.0, 0.012), [-0.72, -1.1, -0.52, 0.72, 1.1, 0.04], 0.026, { color: (x, y, z, nx, ny, nz) => {
        if (nz < 0.6) return mix3(out, lin(0x6e2a2e), sst(0.4, 0.7, BK.fbm(x * 4, y * 4, z * 4)) * 0.5);
        const depth = -bean(x, y, 0), pelv = sd.ell(x, y, 0, 0.3, 0, 0, 0.2, 0.52, 1);
        if (pelv < 0) return pel; if (depth < 0.15) return mix3(cortex, lin(0xc98070), BK.noise3(x * 40, y * 40, 0));
        const th = Math.atan2(y, x - 0.42), pyr = Math.cos(th * 5.2 + 0.4);
        if (pyr < -0.55 || pelv < 0.05) return pelv < 0.05 ? pel : cortex;                                      // renal columns between the pyramids
        return mix3(med, medHi, 0.5 + 0.5 * Math.sin(th * 90)); } }); });
    const KP = { cortex: ["Cortex", "The outer layer. It holds the Bowman's capsules and glomeruli, where blood is filtered under pressure.", [-0.42, 0.5, 0.02]], medulla: ["Medulla (pyramids)", "The striped inner zone: loops of Henle and collecting ducts, where water is reabsorbed.", [-0.12, -0.42, 0.02]], pelvis: ["Pelvis", "The funnel that collects urine from the pyramids and passes it into the ureter.", [0.26, 0.05, 0.02]],
      ureterK: ["Ureter", "Carries urine to the bladder by peristalsis.", [0.5, -0.95, -0.2]], rart: ["Renal artery", "Brings blood with urea, straight from the aorta, at high pressure.", [0.95, 0.24, -0.2]], rvein: ["Renal vein", "Takes filtered blood, with much less urea, back to the vena cava.", [0.95, -0.1, -0.2]] };
    BA.addMode("S-f", "urinary", {
      label: "Urinary system", first: true, keep: true, base: ["nephron", "The nephron"], cam: [[0.55, 2.0, 4.7], [0.2, 1.84, 0]],
      blurb: "The kidneys, ureters and bladder in their real places, with one kidney cut open to show the cortex, medulla and pelvis. Tap a part to isolate it, then follow filtration and reabsorption along a single nephron.",
      values: { quiz: 0 }, controls: [QUIZ()],
      make(S, s, c, g) {
        const T3 = T(); g.add(BA.body({ dark: S.clinicDark }));
        const O = BA.organs({ only: ["kidneyR", "kidneyL", "ureter", "bladder", "aorta", "cava"] }); g.add(O.group); s.aparts = O.parts;
        const kg = new T3.Group(), K = 0.36; kg.position.set(-1.25, 2.0, 0.25); kg.scale.setScalar(K); g.add(kg); s.kg = kg;
        kg.add(new T3.Mesh(kidneySec(), BA.mat.vtissue({ roughness: 0.4, clearcoat: 0.4 })));
        const tubes = { ureterK: BA.tube(BA.curve([[0.34, -0.1, -0.2], [0.5, -0.5, -0.22], [0.5, -1.4, -0.2]]), 0.075, BA.mat.tissue(0xe8d9a8), { seg: 20, rs: 10 }), rart: BA.tube(BA.curve([[0.3, 0.22, -0.2], [0.7, 0.26, -0.2], [1.2, 0.24, -0.2]]), 0.07, BA.mat.vessel(BA.tis.arteryBright), { seg: 12, rs: 10 }), rvein: BA.tube(BA.curve([[0.3, -0.02, -0.24], [0.7, -0.08, -0.24], [1.2, -0.1, -0.24]]), 0.085, BA.mat.vessel(BA.tis.vein), { seg: 12, rs: 10 }) };
        Object.keys(KP).forEach((id) => { const a = KP[id][2], ms = []; if (tubes[id]) { kg.add(tubes[id]); tubes[id].userData.part = id; ms.push(tubes[id]); } else { const m = new T3.Mesh(new T3.SphereGeometry(0.2, 10, 8), new T3.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); m.position.set(a[0], a[1], a[2]); m.userData.part = id; m.userData.pick = true; kg.add(m); ms.push(m); }
          s.aparts[id] = part(id, KP[id][0], KP[id][1], ms, [-1.25 + a[0] * K, 2.0 + a[1] * K, 0.25 + a[2] * K]); });
        s.drops = dots(18, 0.008, true); g.add(s.drops); s.du = Array.from({ length: 18 }, (_, i) => i / 18);
        s.dp = [-1, 1].map((sdv) => BA.curve([[sdv * 0.13, 1.79, -0.1], [sdv * 0.1, 1.65, -0.09], [sdv * 0.08, 1.5, -0.05], [sdv * 0.035, 1.38, 0.03], [0, 1.35, 0.06]]));
      },
      update(S, s, c, dt) { const rate = 0.12 + 0.1 * c.water; for (let i = 0; i < 18; i++) { s.du[i] = (s.du[i] + dt * rate * 0.5) % 1; putDot(s.drops, i, s.dp[i % 2].getPointAt(s.du[i]), 0xf2d24a); } flush(s.drops); const b = s.aparts.bladder.meshes[0]; b.scale.setScalar(0.85 + 0.25 * (0.5 + 0.5 * Math.sin(S.t * 0.4))); },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels: ["cava", "aorta", "kidneyR", "ureter", "bladder", "cortex", "medulla", "pelvis", "rart", "rvein", "ureterK"], side: (id) => !!KP[id], maxX: 392, reach: 26 }); },
      hud: (s, c) => BA.focus.card(s, [{ title: "Urinary system", lines: ["Renal arteries bring blood to the kidneys; renal veins take it away.", "Each kidney has about a million nephrons that filter the blood.", ["Urine: kidney → ureter → bladder → urethra.", "#ffd27a"], ["Drinking " + f(c.water, 2) + " dm³ of water a day: " + (c.water > 2.6 ? "large volume of dilute urine." : c.water < 1.2 ? "small volume of concentrated urine." : "normal urine, about 1.5 dm³ a day."), "#5bd68c"], ["The cut kidney on the left is enlarged.", "#a9b6d3"]] }]),
      readouts: (s, c) => { const F = s.focus, P = s.aparts || {}; return [["Selected", F && F.sel && P[F.sel] ? P[F.sel].name : "none"]]; },
    });
  })();

  /* =====================================================================
     R-d  Reproductive systems (syllabus level, shown like any other organ system)
     ===================================================================== */
  (function () {
    if (!MK.scenes["R-d"]) return;
    const TI = BA.tis, tis = (c, o) => BA.mat.tissue(c, o);
    const build = (sex) => {
      const T3 = T(), group = new T3.Group(), parts = {};
      const add = (id, name, info, meshes, anchor) => { meshes = [].concat(meshes); meshes.forEach((m) => { m.userData.part = id; group.add(m); }); parts[id] = part(id, name, info, meshes, anchor); };
      const bl = new T3.Mesh(BK.blob(0.05, 4, 0.04, 18, 1, 0.9, 0.9), tis(TI.bladder, { roughness: 0.4, transparent: true, opacity: 0.55 })); bl.userData.baseOp = 0.55; bl.userData.soft = true;
      if (sex === "female") {
        bl.position.set(0, 1.335, 0.085); add("bladderF", "Urinary bladder", "Not part of the reproductive system: it lies in front of the uterus.", bl, [0, 1.32, 0.13]);
        const ut = new T3.Mesh(BA.cached("uterus", () => BA.mesh(BA.sd.chain([[0, 1.468, 0.03, 0.048], [0, 1.425, 0.03, 0.04], [0, 1.375, 0.027, 0.024], [0, 1.352, 0.025, 0.02]], 0.02), [-0.07, 1.32, -0.03, 0.07, 1.53, 0.09], 0.006)), tis(TI.uterus, { roughness: 0.35, clearcoat: 0.5 }));
        add("uterus", "Uterus (womb)", "A muscular organ where the embryo implants and the foetus develops. Its lining thickens each month and is shed at menstruation.", ut, [0, 1.45, 0.08]);
        const cx = new T3.Mesh(new T3.SphereGeometry(0.021, 14, 10), tis(0xd98c84)); cx.position.set(0, 1.35, 0.025); add("cervix", "Cervix", "The narrow neck of the uterus. It widens at birth.", cx, [0.01, 1.35, 0.05]);
        add("vagina", "Vagina", "Receives sperm during mating and is the birth canal.", BA.tube(BA.curve([[0, 1.345, 0.022], [0, 1.29, 0.01], [0, 1.235, 0.0]]), 0.017, tis(TI.mouth, { roughness: 0.45 }), { seg: 14, rs: 10 }), [0, 1.27, 0.03]);
        const ducts = [], ov = [], fim = [];
        for (const s of [-1, 1]) { ducts.push(BA.tube(BA.curve([[s * 0.035, 1.47, 0.03], [s * 0.085, 1.497, 0.035], [s * 0.135, 1.492, 0.035], [s * 0.158, 1.462, 0.032]]), 0.0075, tis(TI.uterus), { seg: 20, rs: 8, r: (t) => 0.8 + 0.9 * t * t }));
          const f2 = new T3.Mesh(new T3.ConeGeometry(0.018, 0.03, 10, 1, true), tis(TI.uterus, { side: T3.DoubleSide })); f2.position.set(s * 0.16, 1.449, 0.032); fim.push(f2);
          const o = new T3.Mesh(new T3.SphereGeometry(0.02, 14, 10), BA.mat.matte(TI.ovary)); o.scale.set(1.25, 0.85, 0.85); o.position.set(s * 0.14, 1.432, 0.03); ov.push(o); }
        add("oviduct", "Oviducts (Fallopian tubes)", "Carry the ovum from the ovary to the uterus. Fertilisation takes place here.", ducts.concat(fim), [0.1, 1.5, 0.045]);
        add("ovaryF", "Ovaries", "Produce the ova (eggs) and the hormones oestrogen and progesterone. One ovum is released about every 28 days.", ov, [0.14, 1.43, 0.055]);
        group.userData.path = BA.curve([[0.14, 1.432, 0.03], [0.16, 1.45, 0.032], [0.158, 1.462, 0.032], [0.135, 1.492, 0.035], [0.085, 1.497, 0.035], [0.035, 1.47, 0.03], [0, 1.45, 0.03]]);
      } else {
        bl.position.set(0, 1.395, 0.045); add("bladderM", "Urinary bladder", "Stores urine. In the male, urine and semen leave through the same tube, the urethra, but never at the same time.", bl, [0, 1.41, 0.09]);
        const sac = new T3.Mesh(new T3.SphereGeometry(1, 20, 14), BK.mat.skin(0x8d5a3b, 0.32)); sac.scale.set(0.075, 0.062, 0.052); sac.position.set(0, 1.165, 0.1); sac.userData.baseOp = 0.32; sac.userData.soft = true;
        add("scrotum", "Scrotum", "A sac of skin that holds the testes outside the body cavity, about 2–3 °C cooler than body temperature, which sperm production needs.", sac, [0, 1.12, 0.14]);
        const te = [], ep = [], vd = [], sv = [];
        for (const s of [-1, 1]) { const t1 = new T3.Mesh(new T3.SphereGeometry(0.026, 16, 12), BA.mat.matte(TI.ovary)); t1.scale.set(0.9, 1.25, 0.9); t1.position.set(s * 0.036, 1.168, 0.1); te.push(t1);
          ep.push(BA.tube(BA.curve([[s * 0.04, 1.2, 0.085], [s * 0.056, 1.17, 0.08], [s * 0.046, 1.14, 0.085]]), 0.008, tis(TI.gland), { seg: 10, rs: 6 }));
          vd.push(BA.tube(BA.curve([[s * 0.046, 1.14, 0.085], [s * 0.066, 1.2, 0.075], [s * 0.085, 1.3, 0.085], [s * 0.095, 1.4, 0.07], [s * 0.06, 1.45, 0.02], [s * 0.025, 1.4, -0.01], [s * 0.012, 1.345, 0.0]]), 0.005, tis(0xe8d9a8), { seg: 40, rs: 6 }));
          const v = new T3.Mesh(BK.blob(0.016, 6 + s, 0.2, 12, 0.8, 1.5, 0.8), tis(TI.gland)); v.position.set(s * 0.032, 1.37, -0.022); v.rotation.z = s * -0.5; sv.push(v); }
        add("testis", "Testes", "Produce sperm in the seminiferous tubules and the hormone testosterone.", te, [0.04, 1.17, 0.13]);
        add("epididymis", "Epididymis", "A coiled tube on each testis where sperm mature and are stored.", ep, [0.058, 1.17, 0.09]);
        add("spermduct", "Sperm ducts (vas deferens)", "Carry sperm from the epididymis up and over the bladder to the urethra.", vd, [0.095, 1.4, 0.08]);
        add("vesicle", "Seminal vesicles", "Add a fluid rich in sugar that gives the sperm energy.", sv, [0.035, 1.375, -0.01]);
        const pr = new T3.Mesh(new T3.SphereGeometry(0.024, 16, 12), tis(TI.gland, { roughness: 0.5 })); pr.scale.set(1.15, 0.9, 1); pr.position.set(0, 1.335, 0.012); add("prostate", "Prostate gland", "Adds an alkaline fluid. Sperm plus the fluids from the glands make semen.", pr, [0, 1.335, 0.04]);
        const uc = BA.curve([[0, 1.345, 0.03], [0, 1.31, 0.02], [0, 1.275, 0.05], [0, 1.25, 0.1], [0, 1.2, 0.145], [0, 1.15, 0.165]]);
        add("urethra", "Urethra", "The tube through the penis that carries semen out of the body (and urine, at other times).", BA.tube(uc, 0.006, tis(TI.mouth), { seg: 30, rs: 6 }), [0, 1.29, 0.04]);
        const pn = BA.tube(BA.curve([[0, 1.27, 0.07], [0, 1.25, 0.1], [0, 1.2, 0.145], [0, 1.15, 0.165]]), 0.02, BK.mat.skin(0x8d5a3b, 0.4), { seg: 16, rs: 12 }); pn.userData.baseOp = 0.4; pn.userData.soft = true;
        add("penis", "Penis", "Passes sperm into the vagina of the female during mating.", pn, [0, 1.2, 0.17]);
        group.userData.path = BA.curve([[0.036, 1.168, 0.1], [0.046, 1.14, 0.085], [0.066, 1.2, 0.075], [0.085, 1.3, 0.085], [0.095, 1.4, 0.07], [0.06, 1.45, 0.02], [0.025, 1.4, -0.01], [0.012, 1.345, 0.0], [0, 1.31, 0.02], [0, 1.275, 0.05], [0, 1.25, 0.1], [0, 1.2, 0.145], [0, 1.15, 0.165]]);
      }
      return { group, parts };
    };
    const mode = (sex, label, labels, first) => BA.addMode("R-d", sex, {
      label, keep: true, base: ["fert", "Fertilisation and the embryo"], cam: sex === "female" ? [[0.28, 1.47, 1.2], [0.16, 1.41, 0.03]] : [[0.3, 1.36, 1.35], [0.17, 1.3, 0.04]],
      blurb: "The male and female reproductive systems in their real places, then fertilisation: sperm swim to the ovum, the zygote divides and the blastocyst implants. The hormone graph follows the menstrual cycle.",
      values: { quiz: 0 }, controls: [QUIZ()],
      make(S, s, c, g) { g.add(BA.body({ dark: S.clinicDark })); const O = build(sex); g.add(O.group); s.aparts = O.parts; s.rp = O.group.userData.path; s.cell = dots(sex === "female" ? 1 : 14, sex === "female" ? 0.006 : 0.0028, true); g.add(s.cell); s.ru = Array.from({ length: 14 }, (_, i) => i / 14); },
      update(S, s, c, dt) { const n = sex === "female" ? 1 : 14; for (let i = 0; i < n; i++) { s.ru[i] = (s.ru[i] + dt * (sex === "female" ? 0.07 : 0.1)) % 1; putDot(s.cell, i, s.rp.getPointAt(s.ru[i]), sex === "female" ? 0xffd24a : 0xffffff); } flush(s.cell); },
      overlay(ctx, s, c, S, B) { BA.focus.overlay(S, s, B, { labels, maxX: 392 }); },
      hud: (s, c) => BA.focus.card(s, [{ title: sex === "female" ? "Female reproductive system" : "Male reproductive system", lines: sex === "female" ? ["Ovary → oviduct → uterus → cervix → vagina.", ["Yellow dot: an ovum released at ovulation (about day 14) moves down the oviduct.", "#ffd27a"], "If it meets a sperm in the oviduct it is fertilised and the zygote implants in the uterus.", ["If not, the lining of the uterus is shed: menstruation.", "#7cb3ff"]] : ["Testis → epididymis → sperm duct → urethra.", ["White dots: sperm on their way out of the body.", "#e8f1ff"], "Seminal vesicles and the prostate gland add fluids to make semen.", ["The testes hang outside the body because sperm form best below body temperature.", "#7cb3ff"]] }]),
      readouts: (s, c) => { const F = s.focus, P = s.aparts || {}; return [["Selected", F && F.sel && P[F.sel] ? P[F.sel].name : "none"]]; },
    });
    mode("female", "Female system", ["oviduct", "ovaryF", "uterus", "cervix", "vagina", "bladderF"]);
    mode("male", "Male system", ["spermduct", "vesicle", "bladderM", "prostate", "urethra", "epididymis", "testis", "scrotum", "penis"]);
  })();

  /* =====================================================================
     WA3-e  Biology in agriculture: a farm settlement
     ===================================================================== */
  (function () {
    const old = MK.scenes["WA3-e"]; if (!old || !BA.farm) return;
    const FK = BA.farm, RX = 8.4, RZ = 4.8, ROWS = 6, PER = 11;
    BK.def3d("WA3-e", Object.assign({}, old, {
      label: "Realistic 3D lab", title: "Biology in agriculture",
      blurb: "A West African farm settlement: maize on ridges, cattle in the kraal, a granary, a well and the river below. Burn the bush, add fertiliser or pesticide, or switch to mixed and organic farming, and watch the crops, the soil life, the bees and the river respond.",
      env: "outdoor", cam: [[3.6, 6.6, 14.0], [3.0, 0.5, -1.0]], fov: 38,
      build(S, s, c) {
        const T3 = T(), g = BK.group(S, s), rr = BK.rng(9), m4 = new T3.Matrix4(), q4 = new T3.Quaternion(), e3 = new T3.Euler();
        s.field = FK.ridges(RX, RZ, ROWS, BK.mat.soil([6, 4])); s.field.position.y = 0.012; g.add(s.field);
        /* crops: maize on every row; cassava takes the alternate rows in mixed cropping */
        s.maize = new T3.InstancedMesh(FK.maizeGeo(), new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: T3.DoubleSide }), ROWS * PER); s.maize.castShadow = true; g.add(s.maize);
        s.cass = new T3.InstancedMesh(FK.cassavaGeo(), new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: T3.DoubleSide }), (ROWS / 2) * PER); s.cass.castShadow = true; g.add(s.cass);
        s.slots = []; for (let r = 0; r < ROWS; r++) for (let i = 0; i < PER; i++) s.slots.push({ x: -RX / 2 + 0.45 + i * (RX - 0.9) / (PER - 1) + (rr() - 0.5) * 0.12, z: -RZ / 2 + (r + 0.5) * RZ / ROWS, r, rot: rr() * 6.3, k: 0.85 + rr() * 0.3 });
        s.set = (im, i, x, y, z, rot, k) => { e3.set(0, rot, 0); q4.setFromEuler(e3); m4.compose(V(x, y, z), q4, V(k, k, k)); im.setMatrixAt(i, m4); };
        /* mulch and compost for organic farming */
        s.mulch = new T3.InstancedMesh(new T3.SphereGeometry(0.2, 7, 5), new T3.MeshStandardMaterial({ color: 0xa8894a, roughness: 1 }), 70); for (let i = 0; i < 70; i++) { m4.compose(V((rr() - 0.5) * (RX - 0.6), 0.03, -RZ / 2 + Math.floor(rr() * (ROWS + 1)) * RZ / ROWS + (rr() - 0.5) * 0.15), q4.setFromEuler(e3.set(0, rr() * 6, 0)), V(1 + rr(), 0.18, 0.6 + rr() * 0.5)); s.mulch.setMatrixAt(i, m4); } s.mulch.receiveShadow = true; g.add(s.mulch);
        s.compost = new T3.Mesh(BK.blob(0.6, 8, 0.25, 16, 1.3, 0.55, 1), new T3.MeshStandardMaterial({ color: 0x4a3a28, roughness: 1 })); s.compost.position.set(5.0, 0.2, -1.2); g.add(s.compost);
        /* fertiliser sacks */
        s.sacks = [0, 1, 2].map((i) => { const m = new T3.Mesh(new T3.BoxGeometry(0.5, 0.2, 0.32), new T3.MeshStandardMaterial({ color: 0xf2f0e6, roughness: 0.8 })); m.position.set(4.7 + (i % 2) * 0.3, 0.1 + Math.floor(i / 2) * 0.2 + (i === 2 ? 0.0 : 0), 0.9 + (i % 2) * 0.1); m.rotation.y = 0.3 * i; g.add(m); return m; });
        /* worms and bees */
        s.worms = new T3.InstancedMesh(new T3.CapsuleGeometry(0.022, 0.14, 4, 6), new T3.MeshStandardMaterial({ color: 0xc87a7a, roughness: 0.5 }), 60); for (let i = 0; i < 60; i++) { m4.compose(V((rr() - 0.5) * (RX - 0.4), 0.06, (rr() - 0.5) * (RZ - 0.3)), q4.setFromEuler(e3.set(0, rr() * 6, Math.PI / 2)), V(1, 1, 1)); s.worms.setMatrixAt(i, m4); } g.add(s.worms);
        s.bees = dots(26, 0.03, true); g.add(s.bees); s.beeP = Array.from({ length: 26 }, () => [rr() * 6.3, 0.6 + rr() * 2.2, (rr() - 0.5) * (RX - 1), (rr() - 0.5) * (RZ - 0.6), 0.8 + rr()]);
        /* river with reeds and algae */
        s.river = FK.river([[-9, 4.2], [-4, 3.5], [0, 3.9], [4, 3.4], [9, 4.1]], 1.25, new T3.MeshPhysicalMaterial({ color: 0x2f6a8a, roughness: 0.06, clearcoat: 1 })); s.river.position.y = 0.025; g.add(s.river);
        const bank = FK.river([[-9, 4.2], [-4, 3.5], [0, 3.9], [4, 3.4], [9, 4.1]], 1.7, new T3.MeshStandardMaterial({ color: 0x8a7248, roughness: 1 })); bank.position.y = 0.015; bank.receiveShadow = true; g.add(bank);
        s.algae = new T3.InstancedMesh(new T3.CircleGeometry(0.16, 9), new T3.MeshStandardMaterial({ color: 0x5f9a2a, roughness: 0.9, transparent: true, opacity: 0.85 }), 60); const cv = s.river.userData.curve; for (let i = 0; i < 60; i++) { const p = cv.getPointAt(rr()); m4.compose(V(p.x + (rr() - 0.5) * 0.3, 0.035, p.z + (rr() - 0.5) * 0.9), q4.setFromEuler(e3.set(-Math.PI / 2, 0, rr() * 6)), V(0.6 + rr(), 0.6 + rr(), 1)); s.algae.setMatrixAt(i, m4); } g.add(s.algae);
        const reedM = BK.mat.leaf("#5f8a3a", "#9cc47a"); for (let i = 0; i < 14; i++) { const p = cv.getPointAt(rr()), t = BK.grassTuft(reedM, 7, 0.7, i + 2); t.position.set(p.x, 0, p.z + (rr() > 0.5 ? 0.75 : -0.75)); g.add(t); }
        /* fallow bush strip on the left: this is what burns */
        s.bush = new T3.InstancedMesh(FK.bushGeo(), new T3.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), 16); for (let i = 0; i < 16; i++) { m4.compose(V(-RX / 2 - 0.9 - rr() * 1.3, 0, -RZ / 2 + rr() * RZ), q4.setFromEuler(e3.set(0, rr() * 6, 0)), V(0.8 + rr() * 0.6, 0.8 + rr() * 0.5, 0.8 + rr() * 0.6)); s.bush.setMatrixAt(i, m4); } s.bush.castShadow = true; g.add(s.bush);
        s.ash = new T3.Mesh(new T3.PlaneGeometry(2.6, RZ + 0.6), new T3.MeshStandardMaterial({ color: 0x1c1a18, roughness: 1, transparent: true, opacity: 0 })); s.ash.rotation.x = -Math.PI / 2; s.ash.position.set(-RX / 2 - 1.5, 0.02, 0); g.add(s.ash);
        s.fire = [0, 1, 2, 3, 4].map((i) => { const fl = window.P3D.S.mk.soft(0xff7a20, 1.3, -RX / 2 - 0.9 - (i % 2) * 0.9, 0.5, -RZ / 2 + 0.5 + i * (RZ - 1) / 4, 0.9); g.add(fl); return fl; });
        /* the settlement behind the field */
        const house = FK.house(3.2, 2.4, 1.9); house.position.set(-2.6, 0, -5.4); house.rotation.y = 0.18; g.add(house);
        const g1 = FK.granary(0.7, 1.3); g1.position.set(0.6, 0, -5.6); g.add(g1); const g2 = FK.granary(0.55, 1.05); g2.position.set(1.9, 0, -4.9); g.add(g2);
        const well = FK.well(); well.position.set(3.5, 0, -4.4); g.add(well);
        const K = [[-5.0, -7.6], [-9.4, -7.6], [-9.4, -4.2], [-5.0, -4.2], [-5.0, -5.2]]; g.add(FK.fence(K)); g.add(FK.fence([[-5.0, -6.3], [-5.0, -7.6]]));
        s.herd = [[BK.quad(1.3, 0xe8e2d4, { kind: "cow" }), -7.9, -6.4, -0.5], [BK.quad(1.3, 0x7a5236, { kind: "cow" }), -6.4, -5.3, -2.4], [BK.quad(0.75, 0xd8c8a8, { kind: "goat" }), -8.5, -4.9, -1.0], [BK.quad(0.7, 0x4a3a30, { kind: "goat" }), -6.0, -6.9, 0.4]].map(([a, x, z, ry]) => { a.position.set(x, 0, z); a.rotation.y = ry; g.add(a); return a; });
        const dung = new T3.Mesh(BK.blob(0.3, 5, 0.3, 10, 1.2, 0.4, 1), new T3.MeshStandardMaterial({ color: 0x3c2c1c, roughness: 1 })); dung.position.set(-5.6, 0.08, -4.7); g.add(dung);
        [[-3.9, -8.2, 4.6, 3], [6.2, -6.0, 4.2, 5], [-8.4, -1.6, 3.4, 8]].forEach(([x, z, h, sd2]) => { const p = FK.palm(h, sd2); p.position.set(x, 0, z); g.add(p); });
        const mango = BK.tree(3.4, 6, 0x2f6b2e); mango.position.set(-0.6, 0, -7.6); g.add(mango);
        const path = new T3.Mesh(new T3.PlaneGeometry(1.0, 3.2), new T3.MeshStandardMaterial({ color: 0xc8a878, roughness: 1 })); path.rotation.x = -Math.PI / 2; path.rotation.z = 0.12; path.position.set(-2.2, 0.012, -3.3); path.receiveShadow = true; g.add(path);
        BK.shadow(g, true, true); [s.river, s.algae, s.ash, s.bees, s.mulch, s.worms].forEach((m) => { m.castShadow = false; }); s.fire.forEach((fl) => { fl.castShadow = false; }); s.applied = "";
      },
      update(S, s, c, dt) {
        const org = c.method === "organic", mixd = c.method === "mixed";
        const soilLife = Math.max(0.05, 1 - c.pest / 120 - (c.burn ? 0.5 : 0) + (org ? 0.3 : 0));
        const fertility = Math.max(0.2, 0.5 + c.fert / 200 + (org ? 0.35 : 0) + (mixd ? 0.2 : 0) - (c.burn ? 0.15 : 0) - (c.method === "mono" ? 0.1 : 0));
        const yieldI = Math.min(1.4, fertility * (1 - (c.pest < 10 && !mixd ? 0.25 : 0))); s.life = soilLife; s.yi = yieldI; s.eut = (org ? 0.2 : 1) * c.fert / 100;
        s.gy = s.gy == null ? yieldI : s.gy + (yieldI - s.gy) * Math.min(1, dt * 2.5);
        let ci = 0; s.slots.forEach((q, i) => { const alt = mixd && q.r % 2 === 1, k = (0.42 + 0.48 * s.gy) * q.k; s.set(s.maize, i, q.x, 0.08, q.z, q.rot, alt ? 0.0001 : k); if (q.r % 2 === 1) { s.set(s.cass, ci++, q.x, 0.08, q.z, q.rot, alt ? k * 0.95 : 0.0001); } });
        s.maize.instanceMatrix.needsUpdate = true; s.cass.instanceMatrix.needsUpdate = true;
        /* stressed crops yellow, well-fed crops deep green */
        s.maize.material.color.setRGB(1, 1, 1).lerp(new (T().Color)(0xe6d36a), Math.max(0, Math.min(1, (0.75 - s.gy) * 1.6)));
        s.mulch.visible = org; s.compost.visible = org; s.sacks.forEach((m, i) => { m.visible = !org && c.fert > 15 + i * 30; });
        s.worms.count = Math.round(60 * Math.min(1, soilLife));
        const bees = Math.round(26 * Math.max(0, 1 - c.pest / 85) * (c.burn ? 0.5 : 1)); s.nb = bees;
        for (let i = 0; i < 26; i++) { const b = s.beeP[i]; b[0] += dt * b[4] * 1.6; putDot(s.bees, i, V(b[2] + Math.cos(b[0]) * 0.5, i < bees ? b[1] + Math.sin(b[0] * 2.3) * 0.15 : -5, b[3] + Math.sin(b[0] * 1.3) * 0.5), i % 3 ? 0xffc21a : 0x2a2210); } flush(s.bees);
        s.field.material.color.setHex(0xffffff).lerp(new (T().Color)(org ? 0x8a6a4a : 0xffffff), org ? 0.5 : 0);
        s.river.material.color.setHex(0x2f6a8a).lerp(new (T().Color)(0x4a8a2a), Math.min(1, s.eut)); s.algae.count = Math.round(60 * Math.max(0, Math.min(1, (s.eut - 0.35) / 0.65)));
        s.bk = s.bk == null ? (c.burn ? 1 : 0) : s.bk + ((c.burn ? 1 : 0) - s.bk) * Math.min(1, dt * 1.2);
        s.ash.material.opacity = 0.85 * s.bk; s.bush.material.color.setRGB(1, 1, 1).lerp(new (T().Color)(0x241c14), s.bk);
        s.fire.forEach((fl, i) => { fl.visible = !!c.burn; const k = 1.1 + 0.5 * Math.sin(S.t * 9 + i * 2); fl.scale.set(k * 1.2, k * 1.7, 1); });
        if (c.burn && Math.random() < dt * 7) S.puff(-RX / 2 - 0.8 - Math.random() * 1.2, 0.5, (Math.random() - 0.5) * RZ, { color: 0x4a4a4a, n: 2, size: 1.1, speed: 0.4, up: 1.4, life: 3, op: 0.5 });
        if (!org && c.pest > 50 && Math.random() < dt * 5) S.puff((Math.random() - 0.5) * RX, 1.2, (Math.random() - 0.5) * RZ, { color: 0xdfe8c8, n: 1, size: 0.7, speed: 0.2, up: 0.1, life: 1.6, op: 0.35 });
        s.herd.forEach((a, i) => { a.rotation.z = Math.sin(S.t * 0.6 + i * 2) * 0.012; });
      },
      overlay(ctx, s, c, S, B) { const L = (x, y, z, t, col, dx) => BK.lab(S, B, x, y, z, t, col, dx, 0, 10); L(0, 2.3, 0, c.method === "mixed" ? "Maize + cassava (mixed cropping)" : "Maize on ridges", "#bfe6a0", 0); L(-7.2, 1.7, -5.9, "Kraal: cattle and goats", "#ffd27a", 0); L(1.2, 2.4, -5.3, "Granaries", "#e8f1ff", 0); L(0, 0.3, 3.9, s.eut > 0.5 ? "River: algal bloom" : "River", s.eut > 0.5 ? "#9fdc6a" : "#8fb4ff", 0); if (c.burn) L(-5.6, 1.4, 0, "Bush burning", "#ff8f66", 0); },
      hud: (s, c) => [{ title: "Effects of farming practices", lines: [["Maize yield ≈ " + f(2.0 * (s.yi || 0), 1) + " t/ha (index " + f((s.yi || 0) * 100, 0) + ")", "#ffd27a", true], ["Soil organisms " + f((s.life || 0) * 100, 0) + "% · bees " + (s.nb || 0) + " of 26", "#5bd68c"], c.burn ? "Bush burning kills soil organisms, destroys humus, exposes soil to erosion and pollutes the air." : "No burning: organic matter returns to the soil.", c.fert > 60 && c.method !== "organic" ? "Excess fertiliser washes into the river → algal bloom (eutrophication)." : c.method === "organic" ? "Manure, compost and mulch feed the soil slowly and hold water." : "Fertiliser replaces the nutrients removed by crops.", c.pest > 50 ? "Heavy pesticide use kills useful insects (bees, predators) and builds up in food chains." : "Pesticides control pests but must be used with care.", c.method === "mixed" ? "Mixed cropping and rotation: fewer pests, better use of soil nutrients." : "Life cycles: annuals (maize), biennials (carrot), perennials (cocoa, oil palm)."] }],
      readouts: (s, c) => [["Maize yield", f(2.0 * (s.yi || 0), 1) + " t/ha"], ["Soil life", f((s.life || 0) * 100, 0) + "%"], ["Bees", String(s.nb || 0)]],
      note: (old.note ? old.note + " " : "") + "The yield figure assumes 2.0 t/ha of maize at index 100, a typical smallholder value; it is a teaching model, not a forecast.",
    }));
  })();

  /* Regional topics that reuse these scenes were copied before the redesign: point them at the new versions,
     keeping their own titles, notes and starting values. */
  [["GH5-b", "S-c", { mode: "heart" }], ["GH5-d", "S-a", { mode: "arm" }], ["WA1-c", "S-f", { mode: "nephron" }]].forEach(([key, from, vals]) => {
    const al = MK.scenes[key], base = MK.scenes[from]; if (!al || !base) return;
    MK.def(key, Object.assign({}, base, { title: al.title, note: al.note || base.note, values: Object.assign({}, base.values, al.values, vals) }));
  });
})();
