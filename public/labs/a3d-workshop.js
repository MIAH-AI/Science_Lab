/* a3d-workshop.js — the farm workshop (companion lab for C3-b and C1-c).
   Real scanned and modelled tools and workshop machines (Poly Haven, CC0), each with its use and its maintenance point.
   Every object has a code-built stand-in, so the lab still works when the model files are not available. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, GK = window.GK, AK = window.AK;
  if (!MK || !AK || !GK || !AK.model) return;
  const Y = 0.94;                                             // bench top
  /* [model id, name, use, care, size (m), x, z, on bench?] */
  const SETS = {
    hand: [
      ["adjustable_wrench", "Adjustable spanner", "Jaw opens to fit nuts and bolts of different sizes.", "Wipe clean; oil the worm screw; never use as a hammer.", 0.45, -1.5, 0.05, 1],
      ["combination_wrench", "Combination spanner", "Open end and ring end of one fixed size; the ring end grips all the flats of a nut.", "Use the exact size so the nut is not rounded.", 0.4, -1.07, 0.05, 1],
      ["ratchet_wrench", "Ratchet spanner", "Turns a nut without lifting the tool off, for tight spaces.", "Keep the ratchet free of grit; oil lightly.", 0.42, -0.64, 0.05, 1],
      ["pipe_wrench", "Pipe wrench", "Toothed jaws grip round pipes and fittings in irrigation lines.", "Clean the teeth; oil the adjusting nut.", 0.6, -0.21, 0.05, 1],
      ["pliers", "Pliers", "Gripping, bending and cutting wire; pulling split pins.", "Oil the joint; keep the cutting edges away from hard steel.", 0.32, 0.22, 0.05, 1],
      ["flathead_screwdriver", "Screwdriver", "Tightening and loosening screws; adjusting carburettor and tappet screws.", "Keep the tip square; do not use as a chisel or lever.", 0.36, 0.65, 0.05, 1],
      ["cross_pein_hammer", "Hammer", "Driving pins and wedges; straightening bent parts.", "Check the head is tight on the handle.", 0.48, 1.08, 0.05, 1],
      ["rusted_hacksaw", "Hacksaw", "Cutting metal bars, bolts and pipes.", "Fit the blade with teeth pointing forward; release the tension after use. Rust like this comes from damp storage.", 0.62, 1.51, 0.05, 1],
    ],
    lube: [
      ["oil_tin", "Engine oil", "Lubricates the engine: cuts friction and wear and carries heat away.", "Check the dipstick daily; change oil and filter at the hours given in the manual.", 0.26, -1.2, 0, 1],
      ["small_oil_can_01", "Oil can", "Puts a few drops of oil on hinges, chains and linkages.", "Oil moving joints weekly and before storage.", 0.2, -0.5, 0, 1],
      ["lubricant_spray", "Penetrating spray", "Loosens rusted nuts and drives out moisture.", "Spray, wait, then use the correct spanner.", 0.2, 0.2, 0, 1],
      ["metal_jerrycan", "Fuel jerrycan (20 litres)", "Carries diesel or petrol to machines in the field.", "Keep fuel clean and covered; water and dirt block injectors. Store away from flames.", 0.47, 1.0, 0.1, 1],
      ["plastic_jerrycan", "Plastic jerrycan", "Carries water for the radiator and for mixing sprays.", "Never keep chemicals in a drinking-water container; label it.", 0.4, -1.3, 1.1, 0],
      ["Barrel_01", "Fuel drum (200 litres)", "Bulk store of diesel for the season.", "Store under shade, slightly tilted so rain water cannot enter the bung.", 0.9, 1.5, 1.0, 0],
    ],
    mach: [
      ["portable_generator", "Petrol generator", "A small engine turning an alternator: electricity for lights, welding and pumps.", "Check oil and fuel before starting; run it outdoors; clean the air filter.", 0.62, -1.55, 0.8, 0],
      ["old_military_compressor", "Air compressor", "Stores compressed air to inflate tyres, blow dust from radiators and run air tools.", "Drain water from the tank; check the belt and the safety valve.", 1.15, -0.85, -0.6, 0],
      ["drill_press_01", "Pillar drill", "Drills accurate holes in metal when making and repairing parts.", "Clamp the work; wear goggles; no loose sleeves near the chuck.", 1.7, 0.15, -0.8, 0],
      ["portable_welding_cart", "Welding set", "Joins broken steel parts such as plough beams and trailer frames.", "Wear a welding shield and gloves; keep fuel and dry grass away.", 1.2, 1.05, -0.3, 0],
      ["tool_cart", "Tool trolley", "Keeps tools in order and brings them to the machine.", "Return every tool to its place: a lost tool is a lost hour.", 0.95, 1.75, 0.6, 0],
      ["bench_vice_01", "Bench vice", "Holds work firmly for sawing, filing and drilling.", "Oil the screw; do not hammer on the handle.", 0.35, 0.3, 1.1, 0],
    ],
    wheel: [
      ["old_tyre", "Tyre", "Grips the soil and carries the load. Tread depth and pressure decide traction.", "Check pressure weekly: too soft wastes fuel and damages the walls, too hard compacts the soil and slips.", 0.75, -1.7, 0, 0],
      ["rusted_wheel_rim_01", "Wheel rim", "Carries the tyre and bolts to the hub.", "Tighten wheel nuts in a star pattern; paint to stop rust.", 0.55, -0.8, 0.5, 0],
      ["tire_pump", "Tyre pump", "Raises tyre pressure by hand where there is no compressor.", "Read the pressure with a gauge, not by eye.", 0.6, 0.0, 0.2, 0],
      ["hand_truck", "Hand truck", "A lever on wheels for moving sacks, drums and batteries.", "Oil the axle; keep the tyres pumped.", 1.25, 0.9, -0.4, 0],
      ["metal_toolbox", "Toolbox", "Portable set of spanners and spares carried on the tractor.", "Check the kit before leaving for the field.", 0.5, 1.8, 0.4, 0],
    ],
  };
  const NAMES = [["hand", "Spanners and hand tools"], ["lube", "Fuel and lubrication"], ["mach", "Workshop machines"], ["wheel", "Wheels and tyres"]];
  const tall = { drill_press_01: 1, portable_welding_cart: 1, hand_truck: 1, tire_pump: 1, Barrel_01: 1, metal_jerrycan: 1, plastic_jerrycan: 1, oil_tin: 1, small_oil_can_01: 1, lubricant_spray: 1 };
  const pos = (it) => [it[5], it[7] ? Y : 0, it[6]];
  const def = {
    title: "The farm workshop — tools, machines and their care",
    blurb: "Real workshop tools and machines. Choose a group, then pick each item to see what it does and how it is looked after.",
    label: "Photoreal 3D lab: farm workshop", sky: "outdoor_workshop", envX: { blur: 0.55, bgI: 0.65, shadowExtent: 5 },
    cam: [[0, 2.0, 4.1], [0, 0.8, 0]], fly: [0.25, 0.35, 1.1],
    variants: NAMES, vlabel: "Group",
    build(g, S, s, c) {
      AK.ground(g, { w: 9, d: 6, amp: 0.005, tex: "concrete_floor_worn_001" });
      const L = SETS[c.v] || SETS.hand; if (L.some((it) => it[7])) AK.bench(g, 3.8, 1.2);
      L.forEach((it) => { const p = pos(it), sz = it[4], up = tall[it[0]]; g.add(AK.model(it[0], { fit: sz, lay: it[7] && !up ? "z" : null, flat: !!(it[7] && !up), at: p, fallback: AK.standin(up ? sz * 0.45 : it[7] ? 0.06 : sz * 0.6, up ? sz : it[7] ? 0.03 : sz * 0.6, up ? sz * 0.45 : sz, 0x7a8086, p) })); });
    },
    feats: (c) => (SETS[c.v] || SETS.hand).map((it) => { const p = pos(it), up = tall[it[0]]; return { id: it[0], n: it[1], d: it[2] + " Care: " + it[3], p: [p[0], p[1] + (up || !it[7] ? it[4] * (up ? 1 : 0.6) : 0.05) + 0.12, p[2]] }; }),
    notes: (c) => [["Why maintain tools and machines", "#9fc3ff"], "They last longer, work better, are safer to use and cost less in repairs.", c.v === "lube" ? "Lubrication reduces friction and wear; clean fuel protects the engine." : c.v === "wheel" ? "Correct tyre pressure saves fuel, tyres and soil structure." : c.v === "mach" ? "Workshop safety: goggles, gloves, no loose clothing, a fire extinguisher by the door." : "Use the right tool and the right size for every job."],
    readouts: (s, c) => { const L = SETS[c.v] || SETS.hand, F = L.find((x) => x[0] === c.f) || L[0]; return [["Item", F[1]], ["Use", F[2]], ["Care", F[3]]]; },
    table: () => MK.table(["Group", "Item", "Use", "Care"], NAMES.flatMap(([k, n]) => SETS[k].map((it) => [n, it[1], it[2], it[3]]))),
    tasks: ["Visit all four groups and copy each item with its use into a table.", "Switch Labels to Numbers and name every spanner.", "Give four reasons for maintaining farm tools and machines.", "List the daily checks on a tractor that use items in this workshop (oil, fuel, water, tyre pressure).", "State four safety rules for a farm workshop."],
    note: "Models are real objects scanned or modelled by Poly Haven artists (CC0). Machines are true to life in size and the hand tools are shown one and a half times larger; the rust and wear are real and show why tools are cleaned and oiled before storage.",
    draw: GK.fallback("Farm workshop", NAMES.map((n) => n[1])),
  };
  AK.tour("C3-b#workshop", def);
  if (MK.scenes["C3-b#workshop"]) { MK.scenes["C3-b#workshop"].label = def.label; MK.scenes["C1-c#workshop"] = MK.scenes["C3-b#workshop"]; }
})();
