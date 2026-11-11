/* a-exam.js — WAEC Agricultural Science exam bank for ExamKit.
   Paper 1: objective questions; Paper 2: short structured answers (a term or a number).
   Calculations (plant population, fertilizer, soil, rations, records, finance, genetics) use fresh numbers each time. */
(function () {
  "use strict";
  const { ri, pick, sig, bank } = window.ExamKit.H;
  const N = (v, n = 3) => sig(v, n);
  const fmt = (v) => Math.round(v).toLocaleString("en-GB");

  /* ---------- A. Basic concepts ---------- */
  const BAS = bank([
    { q: "The branch of agriculture that deals with the rearing of animals is", a: "animal husbandry", d: ["agronomy", "horticulture", "silviculture"], acc: ["animal husbandry", "animal science", "animal production"], steps: ["Animal husbandry / animal science covers the rearing of farm animals."] },
    { q: "The cultivation of fruits, vegetables and ornamental plants is called", a: "horticulture", d: ["agronomy", "pomology only", "apiculture"], acc: ["horticulture"], steps: ["Horticulture: fruits (pomology), vegetables (olericulture) and flowers (floriculture)."] },
    { q: "Which of these is a characteristic of subsistence agriculture?", a: "Small farm size and family labour", d: ["Large capital investment", "Specialisation in one crop for export", "Use of heavy machinery"], steps: ["Subsistence farming produces mainly for the family, on small plots with simple tools and family labour."] },
    { q: "A major problem of agricultural development in West Africa is", a: "inadequate credit facilities", d: ["excess storage facilities", "too many extension workers", "overuse of improved seeds"], steps: ["Problems: poor credit, land tenure, poor infrastructure, pests, low technology, poor marketing."] },
    { q: "The land tenure system in which land is passed from parents to children is", a: "inheritance", d: ["leasehold", "freehold by purchase", "government ownership"], acc: ["inheritance"], steps: ["Inheritance: land passes from one generation to the next; leads to fragmentation."] },
    { q: "A disadvantage of the inheritance system of land tenure is", a: "fragmentation of land", d: ["security of tenure", "low cost of land", "easy access for family members"], steps: ["Repeated division among heirs leaves small scattered plots."] },
    { q: "The Land Use Act in Nigeria vested land in the", a: "state governors", d: ["traditional rulers", "family heads", "local farmers' cooperatives"], steps: ["Land Use Act 1978: all land in a state is vested in the Governor."] },
    { q: "Non-governmental organisations help agriculture mainly by", a: "providing training, inputs and credit to farmers", d: ["collecting farm taxes", "fixing producer prices by law", "owning all farmland"], steps: ["NGOs (e.g. Sasakawa Global 2000, Heifer) train farmers and supply inputs."] },
    { q: "Agriculture contributes to national development by providing all the following EXCEPT", a: "crude oil", d: ["food", "raw materials for industry", "foreign exchange"], steps: ["Crude oil is a mineral, not an agricultural product."] },
    { q: "An agricultural programme introduced in Nigeria in 1976 to boost food production was", a: "Operation Feed the Nation", d: ["Green Revolution 1990", "Planting for Food and Jobs", "Structural Adjustment Programme"], steps: ["Operation Feed the Nation (OFN) — 1976; Green Revolution — 1980."] },
  ]);
  /* ---------- B. Ecology, land, environment ---------- */
  const ECO = bank([
    { q: "The study of the relationship between farm organisms and their environment is", a: "agricultural ecology", d: ["agronomy", "pedology", "taxonomy"], acc: ["agricultural ecology", "agro-ecology", "agroecology"], steps: ["Agricultural ecology studies interactions in agro-ecosystems."] },
    { q: "Which of these is an abiotic component of a farm ecosystem?", a: "Rainfall", d: ["Earthworm", "Weeds", "Bacteria"], steps: ["Abiotic = non-living: rainfall, temperature, soil, light."] },
    { q: "Edaphic factors affecting crop production relate to the", a: "soil", d: ["climate", "living organisms", "relief only"], acc: ["soil"], steps: ["Edaphic factors: soil texture, structure, pH, fertility, temperature."] },
    { q: "The most important climatic factor determining crop distribution in West Africa is", a: "rainfall", d: ["wind", "relative humidity", "day length"], steps: ["Rainfall amount and distribution decide what grows where."] },
    { q: "Land as a factor of production is", a: "fixed in supply", d: ["mobile", "man-made", "unlimited"], steps: ["Land is a free gift of nature, fixed in supply and immobile."] },
    { q: "A textile mill using cotton is an example of", a: "an agro-allied industry", d: ["a primary industry", "a mining industry", "a service industry"], steps: ["Agro-allied industries use farm produce as raw materials."] },
    { q: "Eutrophication of water bodies is caused mainly by", a: "excess fertilizer run-off", d: ["planting cover crops", "mulching", "contour ploughing"], steps: ["Nitrates and phosphates feed algal blooms; oxygen falls and fish die."] },
    { q: "Which agricultural practice reduces air pollution?", a: "Avoiding bush burning", d: ["Burning crop residues", "Excessive pesticide spraying", "Overgrazing"], steps: ["Burning releases smoke and greenhouse gases."] },
    { q: "Predation, parasitism and competition are examples of", a: "biotic factors", d: ["edaphic factors", "climatic factors", "topographic factors"], steps: ["Biotic factors involve living organisms."] },
  ]);
  /* ---------- B. Soil ---------- */
  const SOIL = [
    (r) => { const m = ri(120, 180, r), v = pick([90, 100, 110, 120], r), bd = m / v; return { q: `An undisturbed soil core of volume ${v} cm³ has an oven-dry mass of ${m} g. Calculate its bulk density in g/cm³.`, a: N(bd), unit: "g/cm³", d: [N(v / m), N(bd * 2.65), N(m / 2.65 / v)], steps: ["Bulk density = dry mass ÷ volume", m + " ÷ " + v + " = " + N(bd) + " g/cm³"] }; },
    (r) => { const bd = ri(110, 160, r) / 100, pd = 2.65, p = (1 - bd / pd) * 100; return { q: `A soil has a bulk density of ${bd} g/cm³ and particle density 2.65 g/cm³. Calculate the total pore space (%).`, a: N(p), unit: "%", d: [N(bd / pd * 100), N(100 - bd * 10), N((pd - bd) * 10)], steps: ["Porosity = (1 − BD ÷ PD) × 100", "(1 − " + bd + " ÷ 2.65) × 100 = " + N(p) + " %"] }; },
    (r) => { const w1 = ri(15, 30, r), w2 = w1 + ri(50, 90, r), dry = ri(Math.round((w2 - w1) * 0.65), Math.round((w2 - w1) * 0.88), r), w3 = w1 + dry, mc = (w2 - w3) / (w3 - w1) * 100; return { q: `Empty can = ${w1} g; can + moist soil = ${w2} g; can + oven-dry soil = ${w3} g. Calculate the moisture content (%) on a dry-weight basis.`, a: N(mc), unit: "%", d: [N((w2 - w3) / (w2 - w1) * 100), N((w2 - w3) / w2 * 100), N((w3 - w1) / (w2 - w1) * 100)], steps: ["Water = " + w2 + " − " + w3 + " = " + (w2 - w3) + " g", "Dry soil = " + w3 + " − " + w1 + " = " + (w3 - w1) + " g", "MC = " + (w2 - w3) + " ÷ " + (w3 - w1) + " × 100 = " + N(mc) + " %"] }; },
    (r) => { const add = pick([100, 120, 150], r), dr = ri(30, add - 30, r), held = add - dr; return { q: `${add} cm³ of water is poured on 100 g of dry soil in a funnel and ${dr} cm³ drains out. What is the water holding capacity (%)?`, a: held, unit: "%", d: [dr, add, N(dr / add * 100)], steps: ["Water held = " + add + " − " + dr + " = " + held + " cm³ ≈ " + held + " g", "WHC = " + held + " ÷ 100 × 100 = " + held + " %"] }; },
    ...bank([
      { q: "The soil horizon richest in humus and most suitable for crop growth is", a: "the A horizon (topsoil)", d: ["the B horizon", "the C horizon", "the bedrock"], steps: ["Topsoil (A) has humus, roots and organisms."] },
      { q: "Granite is an example of", a: "an igneous rock", d: ["a sedimentary rock", "a metamorphic rock", "an organic rock"], acc: ["igneous", "igneous rock", "an igneous rock"], steps: ["Granite forms from cooled magma: igneous."] },
      { q: "Marble is formed by the metamorphism of", a: "limestone", d: ["sandstone", "shale", "granite"], acc: ["limestone"], steps: ["Limestone → marble; sandstone → quartzite; shale → slate."] },
      { q: "Which soil has the highest capillarity?", a: "Clay", d: ["Sand", "Gravel", "Sandy loam"], acc: ["clay", "clay soil"], steps: ["Fine pores of clay give the greatest capillary rise."] },
      { q: "A soil with pH 4.5 should be corrected by applying", a: "lime", d: ["sulphur", "ammonium sulphate", "urea"], acc: ["lime", "liming"], steps: ["Lime (CaCO₃) raises pH of acid soils."] },
      { q: "Which of the following is a micronutrient?", a: "Zinc", d: ["Nitrogen", "Potassium", "Calcium"], steps: ["Micronutrients: Fe, Mn, Zn, Cu, B, Mo, Cl."] },
      { q: "Nitrogen fixation in legume root nodules is carried out by", a: "Rhizobium", d: ["Nitrosomonas", "Azotobacter only", "Penicillium"], acc: ["rhizobium"], steps: ["Rhizobium bacteria in nodules fix atmospheric N₂."] },
      { q: "Conversion of ammonium to nitrite in the soil is done by", a: "Nitrosomonas", d: ["Nitrobacter", "Rhizobium", "Clostridium"], acc: ["nitrosomonas"], steps: ["NH₄⁺ → NO₂⁻ (Nitrosomonas) → NO₃⁻ (Nitrobacter): nitrification."] },
      { q: "Yellowing of older leaves (chlorosis) is a deficiency symptom of", a: "nitrogen", d: ["phosphorus", "calcium", "boron"], acc: ["nitrogen", "n"], steps: ["N is mobile: old leaves turn yellow first."] },
      { q: "The process by which soluble nutrients are washed down the soil profile is", a: "leaching", d: ["eluviation of humus only", "weathering", "capillarity"], acc: ["leaching"], steps: ["Leaching removes nutrients below the root zone."] },
    ]),
  ];
  /* ---------- B. Irrigation and drainage ---------- */
  const IRR = [
    (r) => { const ha = ri(1, 8, r) / 2, mm = pick([25, 40, 50, 75], r), m3 = ha * 10000 * mm / 1000; return { q: `How many cubic metres of water are needed to apply ${mm} mm of irrigation to ${ha} ha?`, a: N(m3, 4), unit: "m³", d: [N(m3 / 10, 4), N(m3 * 10, 4), N(ha * mm, 4)], steps: ["Volume = area × depth", ha + " ha = " + fmt(ha * 10000) + " m²; " + mm + " mm = " + mm / 1000 + " m", fmt(ha * 10000) + " × " + mm / 1000 + " = " + fmt(m3) + " m³"] }; },
    ...bank([
      { q: "The irrigation system that delivers water slowly to the roots through emitters is", a: "drip irrigation", d: ["surface irrigation", "sprinkler irrigation", "flood irrigation"], acc: ["drip", "drip irrigation", "trickle irrigation"], steps: ["Drip (trickle) irrigation saves water."] },
      { q: "A problem associated with irrigation in dry areas is", a: "salinization of the soil", d: ["leaching of salts to the sea", "increase in soil oxygen", "reduction of weed growth"], steps: ["Evaporation leaves salts on the surface."] },
      { q: "Drainage of waterlogged soils improves", a: "soil aeration", d: ["soil salinity", "erosion", "soil acidity"], steps: ["Removing excess water lets air into pores."] },
      { q: "Tile drains are an example of", a: "subsurface drainage", d: ["surface drainage", "overhead irrigation", "basin irrigation"], acc: ["subsurface", "subsurface drainage"], steps: ["Tiles or perforated pipes are laid underground."] },
    ]),
  ];
  /* ---------- C. Engineering and mechanisation ---------- */
  const ENG = [
    (r) => { const w = pick([1.2, 1.5, 1.8, 2.4], r), sp = ri(4, 8, r), h = ri(5, 8, r), e = pick([0.7, 0.75, 0.8], r), ha = w * sp * 1000 * h * e / 10000; return { q: `A tractor-drawn harrow ${w} m wide works at ${sp} km/h for ${h} hours with ${e * 100} % field efficiency. What area (ha) does it cover?`, a: N(ha), unit: "ha", d: [N(ha / e), N(ha * 10), N(w * sp * h)], steps: ["Area per hour = width × speed × efficiency = " + w + " m × " + sp * 1000 + " m × " + e + " = " + fmt(w * sp * 1000 * e) + " m²", "× " + h + " h = " + fmt(w * sp * 1000 * h * e) + " m² = " + N(ha) + " ha"] }; },
    (r) => { const l = ri(4, 12, r) * 10, b = ri(3, 10, r) * 10, ha = l * b / 10000; return { q: `A rectangular farm measures ${l} m by ${b} m. What is its area in hectares?`, a: N(ha), unit: "ha", d: [N(ha * 10), N(ha / 10), N((l + b) * 2 / 100)], steps: ["Area = " + l + " × " + b + " = " + fmt(l * b) + " m²", "1 ha = 10,000 m² → " + N(ha) + " ha"] }; },
    (r) => { const ch = ri(3, 9, r), lk = ri(10, 90, r), m = ch * 20 + lk * 0.2; return { q: `A distance measured with a 20 m Gunter's chain is ${ch} chains and ${lk} links (1 link = 0.2 m). What is the distance in metres?`, a: N(m, 4), unit: "m", d: [N(ch * 20 + lk, 4), N(ch * 22 + lk * 0.2, 4), N(ch * 20 + lk * 2, 4)], steps: [ch + " × 20 m = " + ch * 20 + " m", lk + " × 0.2 m = " + N(lk * 0.2) + " m", "Total = " + N(m, 4) + " m"] }; },
    ...bank([
      { q: "Which implement is used for primary tillage?", a: "Disc plough", d: ["Harrow", "Ridger", "Planter"], steps: ["Primary tillage breaks and turns the soil: ploughs."] },
      { q: "The part of a tractor that drives rotary implements such as slashers is the", a: "power take-off (PTO)", d: ["three-point linkage", "radiator", "differential lock"], acc: ["pto", "power take-off", "power take off"], steps: ["The PTO shaft transmits engine power to implements."] },
      { q: "The surveying instrument used to measure angles is the", a: "theodolite", d: ["ranging pole", "Gunter's chain", "arrow"], acc: ["theodolite"], steps: ["Theodolite: horizontal and vertical angles."] },
      { q: "A limitation of mechanisation in West Africa is", a: "small and fragmented farm holdings", d: ["abundant spare parts", "cheap fuel everywhere", "large flat farms"], steps: ["Small scattered plots make machines uneconomic."] },
      { q: "The cheapest and most widely available source of farm power in West Africa is", a: "human power", d: ["electrical power", "wind power", "solar power"], steps: ["Most smallholders use human labour."] },
      { q: "Daily maintenance of a tractor includes", a: "checking engine oil and radiator water", d: ["overhauling the engine", "replacing tyres", "repainting"], steps: ["Daily checks: oil, water, fuel, tyres, battery."] },
      { q: "In farmstead planning, the poultry house should be sited", a: "away from the living house, downwind", d: ["inside the farm store", "upwind of the house", "next to the kitchen"], steps: ["Downwind siting keeps smells and dust from the home."] },
      { q: "A tool used for transplanting seedlings in the nursery is the", a: "hand trowel", d: ["pickaxe", "mattock", "axe"], acc: ["trowel", "hand trowel"], steps: ["The trowel lifts seedlings with soil."] },
    ]),
  ];
  /* ---------- D. Crops ---------- */
  const CROP = [
    (r) => { const a = pick([60, 75, 90, 100], r), b = pick([20, 25, 30, 50], r), s = pick([1, 2, 3], r), p = 10000 / (a / 100 * b / 100) * s; return { q: `Maize is planted at ${a} cm × ${b} cm with ${s} seed${s > 1 ? "s" : ""} per hole. Calculate the plant population per hectare.`, a: Math.round(p), unit: "plants/ha", d: [Math.round(p / s), Math.round(p * 10), Math.round(10000 / (a * b) * s)], steps: ["Area per stand = " + a / 100 + " × " + b / 100 + " = " + N(a * b / 10000, 4) + " m²", "Stands = 10,000 ÷ " + N(a * b / 10000, 4) + " = " + fmt(10000 / (a * b / 10000)), "Plants = stands × " + s + " = " + fmt(p)] }; },
    (r) => { const pop = pick([40000, 53333, 66667, 100000], r), tsw = pick([250, 300, 350], r), g = pick([80, 85, 90], r), kg = pop * tsw / 1e6 * 100 / g; return { q: `A farmer wants ${fmt(pop)} plants/ha. The 1000-seed weight is ${tsw} g and germination is ${g} %. Calculate the seed rate (kg/ha).`, a: N(kg), unit: "kg/ha", d: [N(pop * tsw / 1e6), N(kg * 10), N(pop * tsw / 1e6 * g / 100)], steps: ["Seed weight = " + fmt(pop) + " × " + tsw + " g ÷ 1000 = " + fmt(pop * tsw / 1000) + " g = " + N(pop * tsw / 1e6) + " kg", "Adjust for germination: × 100 ÷ " + g + " = " + N(kg) + " kg/ha"] }; },
    (r) => { const n = pick([50, 100, 200], r), gg = ri(Math.round(n * 0.5), n, r), p = gg / n * 100; return { q: `In a germination test, ${gg} out of ${n} seeds germinated. What is the germination percentage?`, a: N(p), unit: "%", d: [N(100 - p), N(gg / 10), N(n / gg * 100)], steps: ["Germination % = " + gg + " ÷ " + n + " × 100 = " + N(p) + " %"] }; },
    (r) => { const rate = pick([40, 60, 80, 90, 120], r), [nm, pc] = pick([["urea (46 % N)", 46], ["sulphate of ammonia (21 % N)", 21], ["NPK 15:15:15", 15], ["CAN (26 % N)", 26]], r), ha = pick([1, 2, 2.5, 4], r), kg = rate * 100 / pc * ha; return { q: `How many kilograms of ${nm} are needed to supply ${rate} kg N/ha on ${ha} ha?`, a: N(kg), unit: "kg", d: [N(rate * pc / 100 * ha), N(kg / ha), N(kg * 2)], steps: ["Fertilizer per ha = " + rate + " × 100 ÷ " + pc + " = " + N(rate * 100 / pc) + " kg", "× " + ha + " ha = " + N(kg) + " kg"] }; },
    ...bank([
      { q: "Which of these crops is a pulse?", a: "Cowpea", d: ["Maize", "Cassava", "Okra"], steps: ["Pulses = grain legumes: cowpea, soya bean, pigeon pea."] },
      { q: "Cassava is propagated mainly by", a: "stem cuttings", d: ["seeds", "suckers", "setts of tubers"], acc: ["stem cuttings", "cuttings"], steps: ["Cassava stems 20–25 cm long with nodes."] },
      { q: "Yam is propagated by", a: "setts", d: ["stem cuttings", "seeds only", "suckers"], acc: ["setts", "yam setts", "minisetts"], steps: ["Yam setts (or minisetts) from tubers."] },
      { q: "A crop that completes its life cycle in two growing seasons is", a: "a biennial", d: ["an annual", "a perennial", "an ephemeral"], acc: ["biennial", "a biennial"], steps: ["Biennials take two seasons (e.g. onion grown for seed)."] },
      { q: "Cocoa is best grown in the", a: "rain forest zone", d: ["Sahel savanna", "Sudan savanna", "montane grassland"], steps: ["Cocoa needs high rainfall, humidity and shade."] },
      { q: "Pineapple is propagated by", a: "suckers, slips and crowns", d: ["seeds", "stem cuttings", "budding"], steps: ["Vegetative parts: suckers, slips, crowns."] },
      { q: "Stylosanthes and Centrosema are important as", a: "pasture legumes", d: ["pasture grasses", "weeds of rice", "cereal crops"], steps: ["Forage legumes add protein and fix nitrogen."] },
      { q: "Rotational grazing helps pasture by", a: "allowing grasses to regrow", d: ["increasing soil erosion", "encouraging weeds", "reducing stocking rate to zero"], steps: ["Rest periods allow regrowth."] },
    ]),
  ];
  /* ---------- D4/H8. Improvement and genetics ---------- */
  const IMP = [
    (r) => { const n = pick([400, 800, 1200, 1600, 2000], r); return { q: `Tall (TT) peas are crossed with dwarf (tt). The F1 are selfed and ${fmt(n)} F2 plants are obtained. How many would you expect to be dwarf?`, a: n / 4, unit: "plants", d: [n / 2, 3 * n / 4, n / 3], steps: ["F1 all Tt (tall); F1 × F1 gives 1 TT : 2 Tt : 1 tt", "Dwarf = 1/4 × " + fmt(n) + " = " + fmt(n / 4)] }; },
    (r) => { const n = pick([160, 320, 480, 640], r); return { q: `In a dihybrid cross (RrYy × RrYy), ${n} offspring are produced. How many are expected to show both recessive traits?`, a: n / 16, unit: "", d: [n * 3 / 16, n * 9 / 16, n / 4], steps: ["Ratio 9 : 3 : 3 : 1; double recessive = 1/16", n + " ÷ 16 = " + n / 16] }; },
    (r) => { const g = ri(2, 5, r), p = 100 * (1 - Math.pow(0.5, g)); return { q: `Local cows are upgraded by mating with pure exotic bulls in every generation. What percentage of exotic blood is in generation ${g}?`, a: N(p, 4), unit: "%", d: [N(50 * g, 4), N(100 * Math.pow(0.5, g), 4), N(100 - 25 * g, 4)], steps: ["Each generation: (previous % + 100) ÷ 2", "Generation " + g + ": 100 × (1 − 0.5^" + g + ") = " + N(p, 4) + " %"] }; },
    (r) => { const ml = pick([4, 5, 6, 8], r), d = pick([20, 25, 40, 50], r); return { q: `A bull produces ${ml} mL of semen. After dilution, each mL gives ${d} doses. If 2 inseminations are needed per conception, how many cows can be served?`, a: ml * d / 2, unit: "cows", d: [ml * d, ml * d / 4, ml + d], steps: ["Doses = " + ml + " × " + d + " = " + ml * d, "Cows = " + ml * d + " ÷ 2 = " + ml * d / 2] }; },
    ...bank([
      { q: "Mating of closely related animals is called", a: "inbreeding", d: ["outbreeding", "crossbreeding", "upgrading"], acc: ["inbreeding"], steps: ["Inbreeding = mating close relatives."] },
      { q: "The superiority of crossbred offspring over the average of their parents is", a: "hybrid vigour (heterosis)", d: ["inbreeding depression", "mutation", "linkage"], acc: ["hybrid vigour", "heterosis"], steps: ["Heterosis appears in F1 crosses."] },
      { q: "An advantage of artificial insemination is that", a: "one bull can serve many cows", d: ["it needs no skilled staff", "heat detection is unnecessary", "it always prevents inbreeding"], steps: ["Semen from one bull is split into thousands of doses."] },
      { q: "Mendel's first law is the law of", a: "segregation", d: ["independent assortment", "dominance only", "linkage"], acc: ["segregation"], steps: ["Alleles separate into gametes: segregation."] },
      { q: "The physical appearance of an organism is its", a: "phenotype", d: ["genotype", "allele", "karyotype"], acc: ["phenotype"], steps: ["Phenotype = observable traits."] },
      { q: "An aim of crop improvement is to", a: "produce disease-resistant varieties", d: ["reduce yield", "increase susceptibility to pests", "lengthen time to maturity"], steps: ["Aims: higher yield, resistance, quality, early maturity, adaptation."] },
    ]),
  ];
  /* ---------- E/F. Forestry and ornamentals ---------- */
  const FOR = bank([
    { q: "The growing of trees together with crops and/or animals on the same land is", a: "agro-forestry", d: ["afforestation only", "taungya ban", "monoculture"], acc: ["agroforestry", "agro-forestry"], steps: ["Agro-forestry combines trees with crops or livestock."] },
    { q: "The taungya system involves", a: "growing food crops between young forest trees", d: ["burning forests yearly", "grazing cattle in reserves", "fish farming in forests"], steps: ["Farmers grow crops while young trees are small."] },
    { q: "Planting trees on land that had no forest before is", a: "afforestation", d: ["reforestation", "deforestation", "selective felling"], acc: ["afforestation"], steps: ["Afforestation = new forest; reforestation = replanting."] },
    { q: "Which of these is a consequence of deforestation?", a: "Soil erosion", d: ["Increased rainfall everywhere", "More wildlife habitats", "Improved soil fertility"], steps: ["Bare soil erodes; habitats lost; climate affected."] },
    { q: "An ornamental plant used as a hedge is", a: "Duranta", d: ["Maize", "Cassava", "Cowpea"], steps: ["Hedges: Duranta, Ixora, Hibiscus, Acalypha."] },
    { q: "Bougainvillea is commonly propagated by", a: "stem cuttings", d: ["seeds only", "bulbs", "tubers"], acc: ["cuttings", "stem cuttings"], steps: ["Many ornamentals root easily from cuttings."] },
    { q: "Trimming ornamental plants into shapes is called", a: "topiary", d: ["budding", "staking", "earthing up"], acc: ["topiary"], steps: ["Topiary = clipping plants into shapes."] },
  ]);
  /* ---------- G. Crop protection ---------- */
  const PROT = [
    (r) => { const n = ri(4, 12, r) * 50, i = ri(5, Math.round(n * 0.6), r), p = i / n * 100; return { q: `In a field, ${i} out of ${n} plants show disease symptoms. What is the disease incidence (%)?`, a: N(p), unit: "%", d: [N(100 - p), N(n / i), N(i / 10)], steps: ["Incidence = diseased ÷ total × 100 = " + i + " ÷ " + n + " × 100 = " + N(p) + " %"] }; },
    (r) => { const ha = pick([0.5, 1, 2, 3], r), rate = pick([2, 2.5, 3, 4], r), tank = pick([15, 16, 20], r), vol = pick([200, 250, 300], r), ml = rate * 1000 * ha, tanks = vol * ha / tank; return { q: `A herbicide is applied at ${rate} L/ha in ${vol} L of water per ha using a ${tank} L knapsack sprayer. How many full tanks are needed for ${ha} ha?`, a: N(tanks), unit: "tanks", d: [N(tanks * 2), N(tanks / 2), N(rate * ha)], steps: ["Spray volume = " + vol + " × " + ha + " = " + vol * ha + " L", "Tanks = " + vol * ha + " ÷ " + tank + " = " + N(tanks)] }; },
    ...bank([
      { q: "Maize streak disease is caused by a", a: "virus", d: ["fungus", "bacterium", "nematode"], acc: ["virus"], steps: ["Maize streak virus is spread by leafhoppers (Cicadulina)."] },
      { q: "Black pod disease of cocoa is caused by", a: "a fungus (Phytophthora)", d: ["a virus", "a bacterium", "an insect"], steps: ["Phytophthora palmivora/megakarya: fungal."] },
      { q: "Cassava mosaic disease is transmitted by", a: "whiteflies", d: ["aphids only", "termites", "weevils"], acc: ["whitefly", "whiteflies"], steps: ["Bemisia tabaci (whitefly) spreads cassava mosaic virus."] },
      { q: "Insects such as aphids that feed on plant sap have", a: "piercing and sucking mouthparts", d: ["biting and chewing mouthparts", "siphoning mouthparts", "no mouthparts"], steps: ["Sap feeders pierce and suck."] },
      { q: "The variegated grasshopper is an example of a", a: "biting and chewing insect", d: ["piercing and sucking insect", "boring insect only", "non-insect pest"], steps: ["Grasshoppers chew leaves."] },
      { q: "Using ladybird beetles to control aphids is", a: "biological control", d: ["chemical control", "cultural control", "legislative control"], acc: ["biological control", "biological"], steps: ["Natural enemies = biological control."] },
      { q: "Imperata cylindrica (spear grass) is difficult to control because of its", a: "underground rhizomes", d: ["large seeds", "short life cycle", "lack of leaves"], steps: ["Rhizomes regrow after slashing."] },
      { q: "Which of these is a non-insect pest of crops?", a: "Rodents", d: ["Stem borers", "Weevils", "Aphids"], steps: ["Non-insect pests: rodents, birds, nematodes, mites, monkeys."] },
      { q: "A side effect of excessive pesticide use is", a: "killing of beneficial organisms", d: ["increased soil fertility", "fewer resistant pests", "cheaper production"], steps: ["Pesticides kill pollinators and natural enemies; residues remain."] },
    ]),
  ];
  /* ---------- H1–H6. Animal production ---------- */
  const ANI = [
    (r) => { const sp = pick([["cow", 283], ["ewe", 150], ["doe (goat)", 150], ["sow", 114], ["rabbit doe", 31]], r), d = ri(10, 200, r), due = d + sp[1]; return { q: `A ${sp[0]} is served on day ${d} of the year. If gestation is ${sp[1]} days, on which day of the year is birth expected?`, a: due, unit: "", d: [due + 7, due - 14, d + 365 - sp[1]], steps: ["Due day = mating day + gestation = " + d + " + " + sp[1] + " = " + due] }; },
    (r) => { const feed = ri(30, 50, r) / 10, gain = ri(15, 25, r) / 10, fcr = feed / gain; return { q: `A broiler eats ${feed} kg of feed and gains ${gain} kg in weight. Calculate the feed conversion ratio.`, a: N(fcr), unit: "", d: [N(gain / feed), N(feed - gain), N(feed * gain)], steps: ["FCR = feed eaten ÷ weight gain = " + feed + " ÷ " + gain + " = " + N(fcr)] }; },
    (r) => { const a = pick([[9, "maize"], [12, "rice bran"]], r), b = pick([[45, "groundnut cake"], [60, "fish meal"], [44, "soya bean meal"]], r), t = pick([16, 18, 20, 22], r), pa = Math.abs(b[0] - t), pb = Math.abs(t - a[0]), pc = pa / (pa + pb) * 100; return { q: `Using the Pearson square, what percentage of ${a[1]} (${a[0]} % CP) should be mixed with ${b[1]} (${b[0]} % CP) to make a ${t} % CP ration?`, a: N(pc), unit: "%", d: [N(100 - pc), N(pb / (pa + pb) * 100 + 5), N(t / b[0] * 100)], steps: [b[0] + " − " + t + " = " + pa + " parts of " + a[1], t + " − " + a[0] + " = " + pb + " parts of " + b[1], a[1] + " = " + pa + " ÷ " + (pa + pb) + " × 100 = " + N(pc) + " %"] }; },
    (r) => { const hens = ri(4, 20, r) * 50, eggs = ri(Math.round(hens * 0.5), Math.round(hens * 0.9), r), p = eggs / hens * 100; return { q: `A flock of ${hens} layers produces an average of ${eggs} eggs per day. Calculate the hen-day egg production (%).`, a: N(p), unit: "%", d: [N(hens / eggs * 100), N(100 - p), N(eggs / 30)], steps: ["Hen-day % = eggs per day ÷ hens × 100 = " + eggs + " ÷ " + hens + " × 100 = " + N(p) + " %"] }; },
    ...bank([
      { q: "The compartment of the ruminant stomach known as the true stomach is the", a: "abomasum", d: ["rumen", "reticulum", "omasum"], acc: ["abomasum"], steps: ["The abomasum secretes enzymes and acid."] },
      { q: "In poultry, food is ground by the", a: "gizzard", d: ["crop", "proventriculus", "caeca"], acc: ["gizzard"], steps: ["The muscular gizzard grinds food with grit."] },
      { q: "The hormone responsible for milk let-down is", a: "oxytocin", d: ["progesterone", "FSH", "testosterone"], acc: ["oxytocin"], steps: ["Oxytocin causes milk let-down and uterine contraction."] },
      { q: "The hormone that maintains pregnancy is", a: "progesterone", d: ["oestrogen", "oxytocin", "prolactin"], acc: ["progesterone"], steps: ["Progesterone from the corpus luteum maintains pregnancy."] },
      { q: "Fertilisation in the cow takes place in the", a: "oviduct (fallopian tube)", d: ["uterus", "vagina", "cervix"], acc: ["oviduct", "fallopian tube"], steps: ["The egg is fertilised in the oviduct."] },
      { q: "The egg shell is formed in the hen's", a: "shell gland (uterus)", d: ["magnum", "isthmus", "infundibulum"], acc: ["shell gland", "uterus"], steps: ["About 20 hours in the shell gland."] },
      { q: "The first milk produced after parturition is called", a: "colostrum", d: ["skim milk", "whey", "butter milk"], acc: ["colostrum"], steps: ["Colostrum is rich in antibodies."] },
      { q: "Piglets are given iron injections to prevent", a: "anaemia", d: ["rickets", "milk fever", "ketosis"], acc: ["anaemia", "anemia", "piglet anaemia"], steps: ["Sow's milk is low in iron."] },
      { q: "Which feedstuff is a protein concentrate?", a: "Groundnut cake", d: ["Maize", "Cassava peel", "Hay"], steps: ["Groundnut cake ≈ 45 % crude protein."] },
      { q: "A breed of cattle tolerant to trypanosomiasis is", a: "N'Dama", d: ["White Fulani", "Holstein-Friesian", "Sokoto Gudali"], acc: ["ndama", "n'dama", "muturu"], steps: ["N'Dama and Muturu are trypanotolerant."] },
      { q: "Heat stress in livestock causes", a: "reduced feed intake and production", d: ["increased egg production", "higher fertility", "faster growth"], steps: ["Animals eat less and produce less when hot."] },
    ]),
  ];
  /* ---------- H7, H9. Pasture and animal health ---------- */
  const AHL = [
    (r) => { const n = ri(5, 50, r) * 10, m = ri(2, 30, r), v = pick([5000, 8000, 150000, 250000], r), loss = n * m / 100 * v; return { q: `An outbreak kills ${m} % of a herd of ${n} animals worth ₦${fmt(v)} each. What is the loss (₦) from deaths?`, a: loss, unit: "₦", d: [loss * 2, loss / 2, n * v], steps: ["Deaths = " + n + " × " + m + " % = " + N(n * m / 100, 4), "Loss = " + N(n * m / 100, 4) + " × ₦" + fmt(v) + " = ₦" + fmt(loss)] }; },
    (r) => { const y = ri(4, 16, r), cc = y / 2.5; return { q: `A pasture produces ${y} t of dry matter per hectare per year. If one tropical livestock unit needs 2.5 t DM per year, what is the carrying capacity (TLU/ha)?`, a: N(cc), unit: "TLU/ha", d: [N(y * 2.5), N(cc * 2), N(y - 2.5)], steps: ["Carrying capacity = herbage ÷ need per TLU = " + y + " ÷ 2.5 = " + N(cc)] }; },
    ...bank([
      { q: "Newcastle disease of poultry is caused by a", a: "virus", d: ["bacterium", "protozoan", "fungus"], acc: ["virus"], steps: ["Paramyxovirus; prevented by vaccination."] },
      { q: "Anthrax is caused by", a: "a bacterium", d: ["a virus", "a protozoan", "a fungus"], acc: ["bacterium", "bacteria", "a bacterium"], steps: ["Bacillus anthracis; carcasses must not be opened."] },
      { q: "Coccidiosis in poultry is caused by", a: "a protozoan (Eimeria)", d: ["a virus", "a bacterium", "a tapeworm"], acc: ["protozoan", "eimeria", "protozoa"], steps: ["Eimeria spp.; bloody droppings."] },
      { q: "The intermediate host of the liver fluke is the", a: "water snail", d: ["tsetse fly", "pig", "mosquito"], acc: ["snail", "water snail"], steps: ["Miracidia develop in a freshwater snail."] },
      { q: "Trypanosomiasis is transmitted by", a: "tsetse flies", d: ["ticks", "mosquitoes", "lice"], acc: ["tsetse", "tsetse fly", "tsetse flies"], steps: ["Glossina (tsetse) is the vector."] },
      { q: "Dipping cattle mainly controls", a: "ticks", d: ["tapeworms", "liver flukes", "coccidiosis"], acc: ["ticks"], steps: ["Acaricide dips kill ticks and other ectoparasites."] },
      { q: "Immunity obtained from colostrum is", a: "passive immunity", d: ["active immunity", "innate resistance", "vaccine immunity"], acc: ["passive", "passive immunity"], steps: ["Antibodies passed from mother: passive, short-lived."] },
      { q: "Keeping newly bought animals apart for some weeks before mixing is", a: "quarantine", d: ["culling", "isolation of the sick", "dipping"], acc: ["quarantine"], steps: ["Quarantine prevents introducing disease."] },
      { q: "Overstocking a pasture leads to", a: "overgrazing and soil erosion", d: ["higher herbage yield", "more legumes", "better animal growth"], steps: ["Too many animals strip the cover."] },
    ]),
  ];
  /* ---------- H10–H11. Aquaculture and apiculture ---------- */
  const AQU = [
    (r) => { const a = pick([200, 400, 500, 1000], r), d = pick([2, 3, 4, 5], r), s = pick([0.8, 0.85, 0.9], r), w = pick([0.4, 0.5, 0.8, 1], r), kg = a * d * s * w; return { q: `A ${a} m² pond is stocked at ${d} fingerlings per m². If ${s * 100} % survive to an average weight of ${w} kg, what is the harvest (kg)?`, a: N(kg, 4), unit: "kg", d: [N(a * d * w, 4), N(kg / w, 4), N(a * s * w, 4)], steps: ["Stocked = " + a + " × " + d + " = " + a * d, "Survivors = " + a * d + " × " + s + " = " + N(a * d * s, 4), "Harvest = " + N(a * d * s, 4) + " × " + w + " kg = " + N(kg, 4) + " kg"] }; },
    (r) => { const h = ri(5, 40, r), k = ri(8, 25, r), p = pick([2500, 3000, 3500, 4000], r); return { q: `An apiary of ${h} hives yields ${k} kg of honey per hive. At ₦${fmt(p)} per kg, what is the income from honey (₦)?`, a: h * k * p, unit: "₦", d: [h * k, h * p, k * p], steps: ["Honey = " + h + " × " + k + " = " + h * k + " kg", "Income = " + h * k + " × ₦" + fmt(p) + " = ₦" + fmt(h * k * p)] }; },
    ...bank([
      { q: "The rearing of aquatic organisms under controlled conditions is", a: "aquaculture", d: ["apiculture", "sericulture", "silviculture"], acc: ["aquaculture"], steps: ["Aquaculture includes fish, shrimps, oysters and seaweed."] },
      { q: "The most suitable soil for constructing a fish pond is", a: "clay or clay loam", d: ["sand", "gravel", "humus-rich loam"], steps: ["Clay holds water."] },
      { q: "Liming a new fish pond", a: "corrects acidity and kills pests", d: ["adds protein to fish", "makes water muddy", "lowers pH"], steps: ["Lime neutralises acid and disinfects."] },
      { q: "A fishing gear in which fish are caught by their gills is the", a: "gill net", d: ["cast net", "hook and line", "trap"], acc: ["gill net"], steps: ["Mesh size determines fish size caught."] },
      { q: "A fishery regulation that protects young fish is", a: "minimum mesh size of nets", d: ["use of explosives", "fishing all year round", "use of poisons"], steps: ["Larger mesh lets juveniles escape."] },
      { q: "Smoking of fish preserves it by", a: "drying and adding antibacterial smoke compounds", d: ["adding water", "raising its moisture content", "cooling it below 0 °C"], steps: ["Heat dries; smoke chemicals inhibit microbes."] },
      { q: "The only fertile female in a honey bee colony is the", a: "queen", d: ["worker", "drone", "nurse bee"], acc: ["queen"], steps: ["One queen lays all the eggs."] },
      { q: "Male honey bees are called", a: "drones", d: ["workers", "queens", "nurses"], acc: ["drones", "drone"], steps: ["Drones mate with the queen."] },
      { q: "The bee keeper uses a smoker to", a: "calm the bees", d: ["kill the bees", "extract honey", "feed the bees"], steps: ["Smoke masks alarm signals."] },
      { q: "A modern hive with movable frames is the", a: "Langstroth hive", d: ["log hive", "pot hive", "gourd hive"], acc: ["langstroth", "langstroth hive"], steps: ["Frames allow harvesting without destroying comb."] },
    ]),
  ];
  /* ---------- I1–I5. Economics, demand and supply ---------- */
  const ECN = [
    (r) => { const a = ri(80, 120, r), b = ri(2, 5, r), c = ri(5, 20, r), d = ri(2, 6, r), P = (a - c) / (b + d); return { q: `Demand: Qd = ${a} − ${b}P. Supply: Qs = ${c} + ${d}P. Find the equilibrium price.`, a: N(P), unit: "", d: [N((a + c) / (b + d)), N((a - c) / (b - d || 1)), N(a / b)], steps: ["At equilibrium Qd = Qs: " + a + " − " + b + "P = " + c + " + " + d + "P", (a - c) + " = " + (b + d) + "P → P = " + N(P)] }; },
    (r) => { const a = ri(80, 120, r), b = ri(2, 4, r), c = ri(5, 15, r), d = ri(2, 5, r), Pe = (a - c) / (b + d), Pf = Math.ceil(Pe) + ri(2, 6, r), s = (c + d * Pf) - (a - b * Pf); return { q: `Qd = ${a} − ${b}P and Qs = ${c} + ${d}P. Government fixes a minimum price of ${Pf}. Calculate the surplus.`, a: N(s), unit: "units", d: [N(a - b * Pf), N(c + d * Pf), N(s * 2)], steps: ["Qs = " + c + " + " + d + " × " + Pf + " = " + (c + d * Pf), "Qd = " + a + " − " + b + " × " + Pf + " = " + (a - b * Pf), "Surplus = Qs − Qd = " + N(s)] }; },
    (r) => { const x = [ri(10, 20, r)]; for (let i = 1; i < 5; i++) x.push(x[i - 1] + ri(Math.max(1, 14 - i * 4), 20 - i * 3, r)); const k = ri(1, 4, r), mpp = x[k] - x[k - 1]; return { q: `Total physical product from 1–5 units of labour is ${x.join(", ")}. What is the marginal physical product of unit ${k + 1}?`, a: mpp, unit: "", d: [N(x[k] / (k + 1)), x[k], x[k] + x[k - 1]], steps: ["MPP = TPP(" + (k + 1) + ") − TPP(" + k + ") = " + x[k] + " − " + x[k - 1] + " = " + mpp] }; },
    (r) => { const tpp = ri(100, 400, r), u = ri(3, 8, r); return { q: `${u} units of fertilizer give a total product of ${tpp} kg. What is the average physical product (kg per unit)?`, a: N(tpp / u), unit: "kg", d: [N(tpp * u), N(tpp - u), N(u / tpp)], steps: ["APP = TPP ÷ units = " + tpp + " ÷ " + u + " = " + N(tpp / u)] }; },
    ...bank([
      { q: "The next best alternative forgone when a choice is made is", a: "opportunity cost", d: ["scale of preference", "real cost of living", "marginal cost"], acc: ["opportunity cost"], steps: ["Opportunity cost = alternative forgone."] },
      { q: "The reward for land as a factor of production is", a: "rent", d: ["wages", "interest", "profit"], acc: ["rent"], steps: ["Land → rent; labour → wages; capital → interest; entrepreneur → profit."] },
      { q: "Which of these is working capital?", a: "Fertilizer", d: ["Tractor", "Farm building", "Fence"], steps: ["Working capital is used up in one production cycle."] },
      { q: "A fall in the price of a commodity leads to", a: "an extension of demand", d: ["a contraction of demand", "a shift of demand to the left", "a decrease in supply"], steps: ["Own-price change → movement along the curve."] },
      { q: "An increase in consumers' income will cause the demand curve for a normal good to", a: "shift to the right", d: ["shift to the left", "remain unchanged", "become vertical"], steps: ["Higher income → increase in demand."] },
      { q: "A maximum price fixed below equilibrium leads to", a: "shortage and black market", d: ["surplus", "fall in demand", "increase in supply"], steps: ["Qd > Qs at the controlled price."] },
      { q: "The law of diminishing returns operates when a variable input is added to a", a: "fixed input", d: ["variable input", "falling price", "rising demand"], steps: ["e.g. more fertilizer on a fixed area of land."] },
      { q: "A subsidy on farm inputs will", a: "shift the supply curve to the right", d: ["shift the demand curve to the left", "raise the price of produce", "reduce output"], steps: ["Lower costs → more supplied at every price."] },
      { q: "Rural–urban migration affects agriculture by causing", a: "shortage of farm labour", d: ["surplus of farm labour", "lower farm wages", "more young farmers"], steps: ["Young people leave farming."] },
    ]),
  ];
  /* ---------- I6–I12. Management, finance, records, marketing, insurance, extension ---------- */
  const MGT = [
    (r) => { const c = ri(5, 60, r) * 10000, s = ri(0, 4, r) * 5000, l = ri(3, 10, r), d = (c - s) / l; return { q: `A sprayer costs ₦${fmt(c)}, has a scrap value of ₦${fmt(s)} and a useful life of ${l} years. Calculate the annual depreciation by the straight-line method (₦).`, a: N(d, 5), unit: "₦", d: [N(c / l, 5), N((c + s) / l, 5), N((c - s) / (l + 1), 5)], steps: ["Depreciation = (cost − scrap) ÷ life", "(" + fmt(c) + " − " + fmt(s) + ") ÷ " + l + " = ₦" + fmt(d)] }; },
    (r) => { const c = ri(10, 50, r) * 100000, rt = pick([10, 20, 25], r), d2 = c * (1 - rt / 100) * rt / 100; return { q: `A machine costing ₦${fmt(c)} is depreciated at ${rt} % per year on the reducing-balance method. What is the depreciation in year 2 (₦)?`, a: N(d2, 5), unit: "₦", d: [N(c * rt / 100, 5), N(c * rt / 100 * 2, 5), N(c * (1 - rt / 100), 5)], steps: ["Year 1: " + rt + " % × " + fmt(c) + " = " + fmt(c * rt / 100) + "; book value " + fmt(c * (1 - rt / 100)), "Year 2: " + rt + " % × " + fmt(c * (1 - rt / 100)) + " = ₦" + fmt(d2)] }; },
    (r) => { const P = ri(5, 50, r) * 10000, R = pick([5, 8, 10, 12, 15], r), T = ri(2, 5, r), I = P * R * T / 100; return { q: `Calculate the simple interest on a farm loan of ₦${fmt(P)} at ${R} % per annum for ${T} years (₦).`, a: I, unit: "₦", d: [P + I, P * R / 100, I * 2], steps: ["I = P × R × T ÷ 100 = " + fmt(P) + " × " + R + " × " + T + " ÷ 100 = ₦" + fmt(I)] }; },
    (r) => { const rev = ri(20, 80, r) * 50000, cost = ri(Math.round(rev / 50000 * 0.5), Math.round(rev / 50000 * 1.1), r) * 50000, dep = ri(1, 8, r) * 25000, p = rev - cost - dep; return { q: `A farm's sales are ₦${fmt(rev)}, operating costs ₦${fmt(cost)} and depreciation ₦${fmt(dep)}. Calculate the net profit (₦). (A loss is negative.)`, a: p, unit: "₦", d: [rev - cost, rev - dep, p - dep], steps: ["Net profit = sales − (costs + depreciation)", fmt(rev) + " − (" + fmt(cost) + " + " + fmt(dep) + ") = ₦" + fmt(p)] }; },
    (r) => { const sum = ri(5, 100, r) * 100000, rt = pick([1.5, 2, 2.5, 3, 4], r), pr = sum * rt / 100; return { q: `A poultry farm is insured for ₦${fmt(sum)} at a premium rate of ${rt} %. Calculate the annual premium (₦).`, a: pr, unit: "₦", d: [pr * 10, pr / 10, sum - pr], steps: ["Premium = sum insured × rate ÷ 100 = " + fmt(sum) + " × " + rt + " ÷ 100 = ₦" + fmt(pr)] }; },
    (r) => { const f0 = ri(4, 12, r) * 1000, m = [1 + ri(8, 15, r) / 100, 1 + ri(12, 25, r) / 100, 1 + ri(15, 30, r) / 100], cons = f0 * m[0] * m[1] * m[2], sh = f0 / cons * 100; return { q: `A farmer sells a bag of yam for ₦${fmt(f0)}. The assembler, wholesaler and retailer add ${Math.round((m[0] - 1) * 100)} %, ${Math.round((m[1] - 1) * 100)} % and ${Math.round((m[2] - 1) * 100)} % in turn. What percentage of the consumer price does the farmer receive?`, a: N(sh), unit: "%", d: [N(100 - sh), N(f0 / (f0 * (m[0] + m[1] + m[2] - 2)) * 100), N(sh * 1.2)], steps: ["Consumer price = " + fmt(f0) + " × " + m.map((x) => x.toFixed(2)).join(" × ") + " = ₦" + fmt(cons), "Farmer's share = " + fmt(f0) + " ÷ " + fmt(cons) + " × 100 = " + N(sh) + " %"] }; },
    ...bank([
      { q: "A short-term loan is used mainly to buy", a: "seeds and fertilizer", d: ["land", "a tractor", "farm buildings"], steps: ["Short-term (≤ 1 year) loans finance seasonal inputs."] },
      { q: "A problem farmers face in obtaining loans from banks is", a: "lack of collateral", d: ["too many banks in villages", "low interest rates", "excess farm records"], steps: ["Banks demand security that small farmers lack."] },
      { q: "A record showing all the assets of a farm at a particular time is the", a: "inventory record", d: ["sales record", "labour record", "feeding record"], acc: ["inventory", "inventory record"], steps: ["Inventory lists items, quantities and values."] },
      { q: "Sorting produce into classes of similar quality is", a: "grading", d: ["assembling", "processing", "advertising"], acc: ["grading", "grading and standardisation"], steps: ["Grading sets standards and fair prices."] },
      { q: "In Ghana, cocoa is marketed for export by", a: "COCOBOD", d: ["NEPC", "Gambia Groundnut Corporation", "Sierra Leone Produce Marketing Company"], acc: ["cocobod", "ghana cocoa board"], steps: ["Ghana Cocoa Board fixes producer prices and exports cocoa."] },
      { q: "An extension method that reaches the largest number of farmers is", a: "radio programmes", d: ["farm visits", "result demonstrations", "office calls"], steps: ["Mass media reach many but give little feedback."] },
      { q: "A quality of a good extension worker is", a: "good communication skills", d: ["impatience with farmers", "ignorance of local language", "dislike of field work"], steps: ["Extension workers must communicate well and be patient."] },
      { q: "The payment made periodically by the insured to the insurer is the", a: "premium", d: ["claim", "policy", "indemnity"], acc: ["premium"], steps: ["Premium = price of insurance."] },
      { q: "A function of a farm manager is", a: "planning farm operations", d: ["fixing government prices", "making land laws", "printing money"], steps: ["Planning, organising, directing, controlling, record keeping."] },
    ]),
  ];
  /* ---------- P. Practical (identification) ---------- */
  const PRAC = bank([
    { q: "A farm tool with a broad flat blade used for digging and turning soil is the", a: "spade", d: ["rake", "sickle", "dibber"], acc: ["spade"], steps: ["Spade: digging; shovel: moving loose material."] },
    { q: "The Burdizzo is used for", a: "bloodless castration", d: ["debeaking", "ear tagging", "milking"], acc: ["castration", "bloodless castration"], steps: ["It crushes the spermatic cords."] },
    { q: "An egg candler is used to", a: "check eggs for fertility and cracks", d: ["hatch eggs", "grade eggs by weight", "wash eggs"], steps: ["Light shows embryo, air cell and cracks."] },
    { q: "Which instrument marks points and lines during chain surveying?", a: "Ranging pole", d: ["Theodolite", "Plumb bob", "Prismatic compass"], acc: ["ranging pole"], steps: ["Ranging poles mark stations."] },
    { q: "The secateurs are used for", a: "pruning small branches", d: ["digging holes", "harvesting yams", "castrating animals"], steps: ["Secateurs: pruning and taking cuttings."] },
    { q: "Soil that feels gritty and does not form a ribbon is", a: "sandy soil", d: ["clay soil", "silty soil", "loamy clay"], acc: ["sand", "sandy", "sandy soil"], steps: ["Sand grains feel gritty and do not stick."] },
    { q: "A soil specimen that fizzes when dilute hydrochloric acid is added contains", a: "calcium carbonate (limestone)", d: ["quartz", "humus only", "iron oxide only"], steps: ["CaCO₃ + acid → CO₂ bubbles."] },
    { q: "In a sedimentation test, the layer that settles last is", a: "clay", d: ["gravel", "coarse sand", "fine sand"], acc: ["clay"], steps: ["Finest particles settle slowest."] },
    { q: "The implement used to make ridges for yam is the", a: "ridger", d: ["harrow", "planter", "slasher"], acc: ["ridger"], steps: ["Ridgers throw soil into ridges."] },
  ]);

  const fix = (g) => (r) => { const q = g(r), seen = new Set([String(q.a)]), d = []; (q.d || []).forEach((x) => { if (!seen.has(String(x))) { seen.add(String(x)); d.push(x); } }); let k = 1; while (d.length < 3 && k < 12) { const v = typeof q.a === "number" ? N(q.a * [1.5, 0.5, 2, 1.25, 0.75, 3][k % 6] + (k > 6 ? k : 0)) : null; if (v != null && !seen.has(String(v))) { seen.add(String(v)); d.push(v); } k++; } q.d = d.slice(0, 3); return q; };
  const gens0 = { BAS, ECO, SOIL, IRR, ENG, CROP, IMP, FOR, PROT, ANI, AHL, AQU, ECN, MGT, PRAC };
  const gens = {}; Object.entries(gens0).forEach(([k, arr]) => (gens[k] = arr.map(fix)));
  const names = { BAS: "Basic concepts", ECO: "Ecology, land and environment", SOIL: "Rocks, soil and nutrients", IRR: "Irrigation and drainage", ENG: "Engineering, mechanisation and surveying", CROP: "Crop production", IMP: "Crop and animal improvement", FOR: "Forestry and ornamentals", PROT: "Crop protection", ANI: "Animal production", AHL: "Pasture and animal health", AQU: "Aquaculture and apiculture", ECN: "Economic principles", MGT: "Farm management, finance and marketing", PRAC: "Practical identification" };
  window.AgricExam = {
    gens, topics: names,
    cfg() {
      return { subject: "Agricultural Science", title: "WAEC Agricultural Science — practice", gens, topics: names, perQ: { p1: 60, p2: 120 }, lengths: [5, 10, 20, 50],
        p1Label: "Paper 1 — objective (50 in 50 min)", p2Label: "Paper 2 — short structured (type the answer)",
        note: "Timed at WAEC pace: 60 s per objective question and 2 minutes per structured answer. Typed answers accept the key term (spelling must be correct); numerical answers within 1 % are accepted. Calculations use fresh numbers every time." };
    },
  };
})();

/* learn-kit.js — shared learning layer for the WAEC labs (piloted in Agricultural Science).
   Topic checks with scoring and mastery, progress tracking, daily five with streaks, badges and levels,
   mistake notebook, flashcards, four lab games, teacher tools (presentation mode, test builder, lesson
   plan and worksheet), a printable certificate and offline install.
   Everything about the learner is saved on this device only (localStorage). Nothing is sent anywhere.
   A subject plugs in with LK.init(cfg) — see a-learn.js. */
(function () {
  "use strict";
  const LK = (window.LK = {});
  let CFG = null, ST = null, mem = null;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pad = (n) => (n < 10 ? "0" : "") + n;
  const day = (d) => { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  const addDays = (iso, n) => { const p = iso.split("-").map(Number), d = new Date(p[0], p[1] - 1, p[2] + n); return day(d); };
  const nice = (iso) => { if (!iso) return "—"; const p = iso.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const reduced = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= store (device only) ================= */
  const blank = () => ({ v: 1, name: "", topics: {}, seen: {}, mistakes: [], cards: {}, xp: 0, badges: {}, games: {}, daily: { last: "", streak: 0, best: 0, total: 0, days: [] }, stats: { answered: 0, correct: 0, secs: 0, fixed: 0, cards: 0 }, chal: {} });
  const key = () => "lwn.learn." + CFG.id;
  function load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(key()) || "null"); } catch (e) { d = mem; }
    const b = blank(); ST = d && d.v === 1 ? Object.assign(b, d, { daily: Object.assign(b.daily, d.daily), stats: Object.assign(b.stats, d.stats) }) : b;
  }
  let saveT = 0;
  function save() { mem = ST; clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(key(), JSON.stringify(ST)); } catch (e) { /* private window or full storage: progress lasts for this visit only */ } }, 120); }

  /* ================= syllabus helpers ================= */
  const sections = () => CFG.sections();
  const allTopics = () => [].concat(...sections().map((s) => s.topics.map((t) => Object.assign({ section: s.key, sectionLabel: s.label }, t))));
  const topic = (code) => allTopics().find((t) => t.code === code);
  const subCount = () => allTopics().reduce((n, t) => n + t.subtopics.length, 0);
  const rec = (code) => ST.topics[code] || null;
  const best = (code) => (rec(code) ? rec(code).best : -1);
  const LEVELS = [["new", "Not started"], ["learning", "Learning"], ["secure", "Secure"], ["mastered", "Mastered"]];
  const level = (code) => { const b = best(code); return b < 0 ? 0 : b >= 80 ? 3 : b >= 50 ? 2 : 1; };
  const XPL = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
  const rank = () => { let i = 0; while (i + 1 < XPL.length && ST.xp >= XPL[i + 1]) i++; const names = CFG.ranks || ["Starter", "Explorer", "Learner", "Scholar", "Expert", "Master", "Professor"]; return { n: i + 1, name: names[Math.min(i, names.length - 1)], lo: XPL[i], hi: XPL[i + 1] || XPL[i] + 1000 }; };

  /* ================= questions ================= */
  function bankQs(code) {
    return (CFG.bank[code] || []).map((row, i) => { const p = row.split("|").map((x) => x.trim()); return { id: code + ":" + i, topic: code, q: p[0], ans: p[1], opts: shuffle(p.slice(1, 5)), steps: p[5] ? [p[5]] : [] }; });
  }
  function themeQs(code, n) {
    const th = (CFG.themeOf && CFG.themeOf[code]) || [], EK = window.ExamKit; if (!n || !th.length || !EK || !CFG.gens) return [];
    let out = []; try { out = EK.make(CFG.gens, th, n, (Date.now() & 0xffffff) + 11, "p1"); } catch (e) { out = []; }
    return out.map((q) => ({ id: "T:" + hash(q.q), topic: code, q: q.q, ans: q.ans, opts: q.opts.slice(), steps: (q.steps || []).slice(), unit: q.unit }));
  }
  function topicQs(code, n = 8) { const own = shuffle(bankQs(code)).slice(0, Math.max(5, n - 3)), extra = themeQs(code, n - own.length), seen = new Set(own.map((q) => q.q)); return own.concat(extra.filter((q) => !seen.has(q.q))); }
  function mixedQs(codes, n) { const out = [], used = new Set(); let guard = 0; while (out.length < n && guard++ < n * 30) { const c = codes[Math.floor(Math.random() * codes.length)], pool = bankQs(c); if (!pool.length) continue; const q = pool[Math.floor(Math.random() * pool.length)]; if (used.has(q.id)) continue; used.add(q.id); out.push(q); } return out; }
  function dailyQs() {
    const bag = []; allTopics().forEach((t) => { if (!(CFG.bank[t.code] || []).length) return; const b = best(t.code), seen = t.subtopics.some((s) => ST.seen[t.code + "-" + s.code]); const w = b >= 0 && b < 80 ? 4 : seen && b < 0 ? 3 : b < 0 ? 1 : 1; for (let i = 0; i < w; i++) bag.push(t.code); });
    const picks = []; let guard = 0; while (picks.length < 5 && guard++ < 400 && bag.length) { const c = bag[Math.floor(Math.random() * bag.length)]; if (!picks.includes(c)) picks.push(c); }
    return picks.map((c) => { const p = bankQs(c); return p[Math.floor(Math.random() * p.length)]; });
  }

  /* ================= scoring, mastery, badges ================= */
  const BADGES = [
    ["first", "🌱", "First steps", "Finish your first topic check", () => Object.keys(ST.topics).length >= 1],
    ["perfect", "💯", "Full marks", "Score 100 % in a topic check", () => Object.values(ST.topics).some((t) => t.best === 100)],
    ["five", "🖐", "High five", "Reach Secure in 5 topics", () => allTopics().filter((t) => level(t.code) >= 2).length >= 5],
    ["ten", "🏅", "Ten down", "Master 10 topics", () => allTopics().filter((t) => level(t.code) === 3).length >= 10],
    ["section", "🏆", "Section champion", "Reach Secure in every topic of one section", () => sections().some((s) => s.topics.length && s.topics.every((t) => level(t.code) >= 2))],
    ["q100", "🎯", "Century", "Answer 100 questions", () => ST.stats.answered >= 100],
    ["streak3", "🔥", "On a roll", "Daily five 3 days in a row", () => ST.daily.best >= 3],
    ["streak7", "⚡", "Unstoppable", "Daily five 7 days in a row", () => ST.daily.best >= 7],
    ["fixer", "🔧", "Mistake fixer", "Clear 10 mistakes from your notebook", () => ST.stats.fixed >= 10],
    ["cards", "🃏", "Card shark", "Review 50 flashcards", () => ST.stats.cards >= 50],
    ["explorer", "🧭", "Explorer", "Open 40 subtopics", () => Object.keys(ST.seen).length >= 40],
    ["clock", "⏱", "Quick thinker", "Score 200 in Beat the clock", () => ((ST.games.clock || {}).best || 0) >= 200],
    ["sorter", "🗂", "Well sorted", "Finish Sort it with no wrong moves", () => !!(ST.games.sort || {}).perfect],
    ["finder", "🦅", "Eagle eye", "Find every part without a miss", () => !!(ST.games.parts || {}).perfect],
    ["labpro", "🧪", "Lab pro", "Solve 5 lab challenges", () => Object.keys(ST.chal).length >= 5],
  ];
  function award() { const got = []; BADGES.forEach(([id, ic, name, , test]) => { let ok = false; try { ok = test(); } catch (e) { ok = false; } if (ok && !ST.badges[id]) { ST.badges[id] = day(); got.push(ic + " " + name); } }); if (got.length) toast("Badge earned: " + got.join(", ")); return got; }
  function addXp(n) { const before = rank().n; ST.xp += Math.max(0, Math.round(n)); const after = rank(); if (after.n > before) toast("Level up — you are now a " + after.name + " (level " + after.n + ")"); }
  function noteAnswer(q, picked, ok) {
    ST.stats.answered++; if (ok) ST.stats.correct++;
    const i = ST.mistakes.findIndex((m) => m.id === q.id);
    if (!ok) { const m = { id: q.id, t: q.topic, q: q.q, a: q.ans, y: picked, o: q.opts, s: q.steps || [], d: day() }; if (i >= 0) ST.mistakes[i] = m; else ST.mistakes.unshift(m); if (ST.mistakes.length > 150) ST.mistakes.length = 150; }
    else if (i >= 0) { ST.mistakes.splice(i, 1); ST.stats.fixed++; }
  }
  function noteAttempt(code, score, n) {
    const p = pct(score, n), r = ST.topics[code] || (ST.topics[code] = { att: 0, best: 0, last: 0, when: "", hist: [] }), before = level(code);
    r.att++; r.last = p; r.best = Math.max(r.best, p); r.when = day(); r.hist.push([day(), p]); if (r.hist.length > 12) r.hist.shift();
    return { p, up: level(code) > before, lvl: level(code) };
  }

  /* ================= small UI pieces ================= */
  const COL = ["var(--lk-idle)", "var(--lk-warn)", "var(--lk-info)", "var(--lk-good)"];
  function ring(p, lvl, size = 40, label) {
    const r = size / 2 - 4, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, p < 0 ? 0 : p));
    return `<svg class="lk-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(label || (p < 0 ? "Not started" : "Best score " + p + " per cent"))}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--lk-track)" stroke-width="4"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${COL[lvl]}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(c * v) / 100} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="${size * 0.28}" font-weight="700" fill="currentColor">${p < 0 ? "–" : p}</text></svg>`;
  }
  LK.ring = (code, size) => ring(best(code), level(code), size || 34, (topic(code) || {}).title + ": " + LEVELS[level(code)][1]);
  let toastT = 0;
  function toast(msg) { let t = $("#lk-toast"); if (!t) { t = document.createElement("div"); t.id = "lk-toast"; t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite"); document.body.appendChild(t); } t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 4200); }
  function confetti(host) { if (reduced() || !host) return; const box = document.createElement("div"); box.className = "lk-confetti"; box.setAttribute("aria-hidden", "true"); for (let i = 0; i < 26; i++) { const s = document.createElement("i"); s.style.left = Math.random() * 100 + "%"; s.style.background = ["#ffd27a", "#5bd68c", "#7fb6ff", "#ff8fa3", "#c3a9ed"][i % 5]; s.style.animationDelay = Math.random() * 0.5 + "s"; s.style.animationDuration = 1.4 + Math.random() * 1.2 + "s"; box.appendChild(s); } host.appendChild(box); setTimeout(() => box.remove(), 3200); }

  /* sheet: a full-screen dialog used by checks, games and printouts */
  let sheet = null, lastFocus = null, onClose = null;
  function openSheet(title, bodyHtml, o = {}) {
    closeSheet(true); lastFocus = document.activeElement;
    sheet = document.createElement("div"); sheet.className = "lk-sheet" + (o.wide ? " wide" : ""); sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); sheet.setAttribute("aria-label", title);
    sheet.innerHTML = `<div class="lk-sheet-in lk"><div class="lk-sheet-top"><span class="lk-badge">${esc(o.tag || CFG.subject)}</span><h2>${esc(title)}</h2><span class="lk-sp"></span>${o.print ? '<button type="button" class="lk-btn" data-lk="print">🖨 Print</button>' : ""}<button type="button" class="lk-btn ghost" data-lk="close" aria-label="Close">✕ Close</button></div><div class="lk-sheet-body">${bodyHtml}</div></div>`;
    document.body.appendChild(sheet); document.body.classList.add("lk-lock"); onClose = o.onClose || null;
    const f = $("[data-auto]", sheet) || $("button:not([data-lk=close])", sheet) || $("[data-lk=close]", sheet); if (f) f.focus();
    return $(".lk-sheet-body", sheet);
  }
  function closeSheet(silent) { if (!sheet) return; const cb = onClose; onClose = null; try { cb && cb(); } catch (e) { /* ignore */ } sheet.remove(); sheet = null; document.body.classList.remove("lk-lock"); if (!silent) { if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus(); CFG.rerender && CFG.rerender(); } }
  LK.close = closeSheet;

  /* ================= quiz runner (topic check, daily five, retry mistakes) ================= */
  function runQuiz(o) {
    const qs = o.qs; if (!qs.length) { toast("No questions are available for this yet."); return; }
    const body = openSheet(o.title, "", { tag: o.tag });
    let i = 0, score = 0, locked = false; const wrong = [];
    const show = () => {
      const q = qs[i]; locked = false;
      body.innerHTML = `<div class="lk-qz"><div class="lk-prog" aria-hidden="true"><span style="width:${(i / qs.length) * 100}%"></span></div>
        <div class="lk-qmeta"><span>Question ${i + 1} of ${qs.length}</span><span>${esc((topic(q.topic) || {}).title || "")}</span><span class="lk-sp"></span><span>Score ${score}</span></div>
        <p class="lk-q" id="lk-q">${esc(q.q)}</p>
        <div class="lk-opts" role="group" aria-labelledby="lk-q">${q.opts.map((t, k) => `<button type="button" class="lk-opt" data-k="${k}"${k === 0 ? " data-auto" : ""}><b>${"ABCD"[k]}</b><span>${esc(t)}${q.unit && /^[-\d.,\s×⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+$/.test(t) ? " " + esc(q.unit) : ""}</span></button>`).join("")}</div>
        <div class="lk-fb" aria-live="polite"></div></div>`;
      const first = $(".lk-opt", body); if (first) first.focus();
    };
    const pick = (k) => {
      if (locked) return; locked = true; const q = qs[i], picked = q.opts[k], ok = picked === q.ans; if (ok) score++; else wrong.push(q);
      noteAnswer(q, picked, ok);
      $$(".lk-opt", body).forEach((b, j) => { b.disabled = true; if (q.opts[j] === q.ans) b.classList.add("ok"); else if (j === k) b.classList.add("bad"); });
      const lastQ = i === qs.length - 1;
      $(".lk-fb", body).innerHTML = `<div class="lk-verdict ${ok ? "ok" : "bad"}">${ok ? "✓ Correct" : "✗ Not quite — the answer is " + esc(q.ans)}</div>${(q.steps || []).length ? `<ul class="lk-steps">${q.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}<button type="button" class="lk-btn primary" data-next>${lastQ ? "See my result" : "Next question →"}</button>`;
      $("[data-next]", body).focus(); save();
    };
    const finish = () => {
      const n = qs.length; let extra = "", xp = score * 10;
      if (o.kind === "topic") { const r = noteAttempt(o.topic, score, n); if (r.p === 100) xp += 20; extra = `<p class="lk-note">${r.up ? "Mastery level up: <b>" + LEVELS[r.lvl][1] + "</b>. " : ""}Best for this topic: <b>${best(o.topic)} %</b> · attempts: ${rec(o.topic).att}. ${r.p >= 80 ? "Mastered — move to the next topic or try a lab game." : r.p >= 50 ? "Secure. Score 80 % or more to master it." : "Go through the notes and the simulation again, then retry."}</p>`; }
      if (o.kind === "daily") { const t = day(), d = ST.daily; if (d.last !== t) { d.streak = d.last === addDays(t, -1) ? d.streak + 1 : 1; d.best = Math.max(d.best, d.streak); d.last = t; d.total++; d.days.push(t); if (d.days.length > 60) d.days.shift(); xp += 15; } extra = `<p class="lk-note">Daily five done. Streak: <b>${d.streak} day${d.streak === 1 ? "" : "s"}</b> 🔥 — come back tomorrow to keep it going.</p>`; }
      if (o.kind === "mistakes") extra = `<p class="lk-note">${score} mistake${score === 1 ? "" : "s"} cleared from your notebook. ${ST.mistakes.length} left.</p>`;
      addXp(xp); award(); save();
      const p = pct(score, n);
      body.innerHTML = `<div class="lk-result"><div class="lk-big">${ring(p, p >= 80 ? 3 : p >= 50 ? 2 : 1, 120)}</div><h3>${score} out of ${n} correct</h3><p class="lk-xp">+${xp} XP · ${rank().name}, level ${rank().n}</p>${extra}
        ${wrong.length ? `<details class="lk-rev" open><summary>Review ${wrong.length} missed question${wrong.length > 1 ? "s" : ""} (saved to your mistake notebook)</summary>${wrong.map((q) => `<div class="lk-miss"><p>${esc(q.q)}</p><div><b>Answer:</b> ${esc(q.ans)}</div>${(q.steps || []).map((s) => `<div class="lk-dim">${esc(s)}</div>`).join("")}</div>`).join("")}</details>` : `<p class="lk-note">No mistakes. Well done.</p>`}
        <div class="lk-row">${o.again ? '<button type="button" class="lk-btn primary" data-again>Try again with new questions</button>' : ""}<button type="button" class="lk-btn" data-lk="close">Done</button></div></div>`;
      if (p >= 80) confetti($(".lk-sheet-in", sheet));
      const a = $("[data-again]", body); if (a) { a.addEventListener("click", () => runQuiz(Object.assign({}, o, { qs: o.again() }))); a.focus(); }
    };
    body.addEventListener("click", (e) => { const b = e.target.closest(".lk-opt"); if (b) return pick(+b.dataset.k); if (e.target.closest("[data-next]")) { i++; if (i >= qs.length) finish(); else show(); } });
    body.addEventListener("keydown", (e) => { const k = "abcd".indexOf(e.key.toLowerCase()); const n = k >= 0 ? k : "1234".indexOf(e.key); if (n >= 0 && !locked && n < qs[i].opts.length) { e.preventDefault(); pick(n); } });
    show();
  }
  LK.check = (code) => { const t = topic(code); if (!t) return; runQuiz({ title: "Check yourself — " + t.title, tag: "Topic " + (t.num || t.code), kind: "topic", topic: code, qs: topicQs(code), again: () => topicQs(code) }); };
  LK.daily = () => runQuiz({ title: "Daily five", tag: "Practice", kind: "daily", qs: dailyQs() });
  LK.retry = () => runQuiz({ title: "Retry my mistakes", tag: "Practice", kind: "mistakes", qs: shuffle(ST.mistakes.slice(0, 40)).slice(0, 10).map((m) => ({ id: m.id, topic: m.t, q: m.q, ans: m.a, opts: shuffle((m.o || [m.a]).slice()), steps: m.s || [] })) });

  /* ================= flashcards (five boxes, spaced out) ================= */
  let CARDS = null;
  function cards() {
    if (CARDS) return CARDS; CARDS = [];
    allTopics().forEach((t) => t.subtopics.forEach((st) => (st.content || []).forEach((line, i) => { const k = line.indexOf(": "); if (k < 3 || k > 64 || line.length - k < 14) return; CARDS.push({ id: t.code + "-" + st.code + "-" + i, t: t.code, ctx: st.title, front: line.slice(0, k), back: line.slice(k + 2) }); })));
    return CARDS;
  }
  const GAP = [0, 1, 2, 4, 8, 16];
  const due = (c) => { const s = ST.cards[c.id]; return !s || s.due <= day(); };
  function runCards(code) {
    const pool = cards().filter((c) => (!code || c.t === code)), deck = shuffle(pool.filter(due)).slice(0, 12);
    const t = code && topic(code); const title = "Flashcards" + (t ? " — " + t.title : "");
    if (!pool.length) { toast("No flashcards for this topic yet."); return; }
    if (!deck.length) { openSheet(title, `<div class="lk-result"><h3>Nothing due today</h3><p class="lk-note">You have reviewed every card in this set. They come back at wider gaps (1, 2, 4, 8 and 16 days) so you remember them for the exam.</p><div class="lk-row"><button type="button" class="lk-btn" data-lk="close">Done</button></div></div>`, { tag: "Practice" }); return; }
    const body = openSheet(title, "", { tag: "Practice" }); let i = 0, good = 0, flipped = false;
    const show = () => { const c = deck[i]; flipped = false; body.innerHTML = `<div class="lk-qz"><div class="lk-prog" aria-hidden="true"><span style="width:${(i / deck.length) * 100}%"></span></div><div class="lk-qmeta"><span>Card ${i + 1} of ${deck.length}</span><span>${esc(c.ctx)}</span><span class="lk-sp"></span><span>Box ${(ST.cards[c.id] || { b: 1 }).b} of 5</span></div>
      <button type="button" class="lk-card" data-flip data-auto aria-live="polite"><span class="lk-card-k">Say what you know about</span><span class="lk-card-f">${esc(c.front)}</span><span class="lk-card-hint">Tap to turn the card</span></button><div class="lk-row" data-rate hidden><button type="button" class="lk-btn" data-rate-v="0">↺ Again</button><button type="button" class="lk-btn primary" data-rate-v="1">✓ I knew it</button></div></div>`; $("[data-flip]", body).focus(); };
    body.addEventListener("click", (e) => {
      const c = deck[i];
      if (e.target.closest("[data-flip]") && !flipped) { flipped = true; const b = $("[data-flip]", body); b.classList.add("back"); b.innerHTML = `<span class="lk-card-k">${esc(c.front)}</span><span class="lk-card-b">${esc(c.back)}</span>`; $("[data-rate]", body).hidden = false; $("[data-rate-v='1']", body).focus(); return; }
      const r = e.target.closest("[data-rate-v]"); if (!r) return; const ok = r.dataset.rateV === "1", s = ST.cards[c.id] || { b: 1, due: day() };
      s.b = ok ? Math.min(5, s.b + 1) : 1; s.due = addDays(day(), ok ? GAP[s.b] : 0); ST.cards[c.id] = s; ST.stats.cards++; if (ok) good++; i++; save();
      if (i < deck.length) return show();
      addXp(good * 3); award(); save();
      body.innerHTML = `<div class="lk-result"><h3>${good} of ${deck.length} known</h3><p class="lk-xp">+${good * 3} XP</p><p class="lk-note">Cards you knew move up a box and return later. Cards marked Again come back today.</p><div class="lk-row"><button type="button" class="lk-btn primary" data-more>More cards</button><button type="button" class="lk-btn" data-lk="close">Done</button></div></div>`;
      $("[data-more]", body).addEventListener("click", () => runCards(code));
    });
    show();
  }
  LK.cards = runCards;

  /* ================= games ================= */
  const gameRec = (id) => ST.games[id] || (ST.games[id] = { plays: 0, best: 0 });
  function endGame(id, body, score, lines, o = {}) {
    const g = gameRec(id), was = g.best; g.plays++; g.best = Math.max(g.best, score); if (o.perfect) g.perfect = true; const xp = Math.round(Math.max(5, o.xp != null ? o.xp : score / 5)); addXp(xp); award(); save();
    body.innerHTML = `<div class="lk-result"><div class="lk-score">${score}</div><h3>${score > was && g.plays > 1 ? "New best score!" : o.head || "Round over"}</h3><p class="lk-xp">+${xp} XP · best ${g.best}</p>${lines.map((l) => `<p class="lk-note">${l}</p>`).join("")}<div class="lk-row"><button type="button" class="lk-btn primary" data-replay data-auto>Play again</button><button type="button" class="lk-btn" data-lk="close">Done</button></div></div>`;
    if (score > was) confetti($(".lk-sheet-in", sheet)); $("[data-replay]", body).addEventListener("click", () => GAMES[id].run()); $("[data-replay]", body).focus();
  }
  /* --- Beat the clock: two minutes, streak multiplier --- */
  function gameClock() {
    const codes = allTopics().map((t) => t.code).filter((c) => (CFG.bank[c] || []).length); let pool = shuffle(mixedQs(codes, 60));
    const body = openSheet("Beat the clock", "", { tag: "Lab game", onClose: () => clearInterval(tm) });
    let left = 120, score = 0, streak = 0, bestStreak = 0, n = 0, right = 0, i = 0, locked = false, tm = 0;
    const mult = () => Math.min(5, 1 + Math.floor(streak / 3));
    const hud = () => { const h = $(".lk-clock", body); if (h) h.innerHTML = `<span class="lk-time${left <= 15 ? " low" : ""}">⏱ ${Math.floor(left / 60)}:${pad(left % 60)}</span><span>Score <b>${score}</b></span><span>Streak <b>${streak}</b> · ×${mult()}</span>`; };
    const show = () => { if (i >= pool.length) { pool = shuffle(mixedQs(codes, 60)); i = 0; } const q = pool[i]; locked = false; $(".lk-stage", body).innerHTML = `<p class="lk-q">${esc(q.q)}</p><div class="lk-opts two">${q.opts.map((t, k) => `<button type="button" class="lk-opt" data-k="${k}"><b>${"ABCD"[k]}</b><span>${esc(t)}</span></button>`).join("")}</div>`; const f = $(".lk-opt", body); if (f) f.focus(); };
    const stop = () => { clearInterval(tm); endGame("clock", body, score, [`${right} of ${n} correct · longest streak ${bestStreak}.`, "Three correct in a row raises the multiplier, up to ×5. A wrong answer resets it."]); };
    body.innerHTML = `<div class="lk-qz"><div class="lk-clock"></div><div class="lk-stage"><p class="lk-note">Two minutes. Answer as many as you can. Every 3 correct in a row raises your multiplier.</p><div class="lk-row"><button type="button" class="lk-btn primary" data-go data-auto>Start</button></div></div></div>`;
    hud(); $("[data-go]", body).focus();
    body.addEventListener("click", (e) => {
      if (e.target.closest("[data-go]")) { tm = setInterval(() => { left--; hud(); if (left <= 0) stop(); }, 1000); show(); return; }
      const b = e.target.closest(".lk-opt"); if (!b || locked) return; locked = true; const q = pool[i], picked = q.opts[+b.dataset.k], ok = picked === q.ans; n++;
      noteAnswer(q, picked, ok); if (ok) { right++; score += 10 * mult(); streak++; bestStreak = Math.max(bestStreak, streak); } else streak = 0;
      $$(".lk-opt", body).forEach((x, j) => { x.disabled = true; if (q.opts[j] === q.ans) x.classList.add("ok"); else if (x === b) x.classList.add("bad"); }); hud(); i++; setTimeout(() => { if (left > 0 && sheet) show(); }, ok ? 420 : 1300);
    });
    body.addEventListener("keydown", (e) => { const k = "abcd".indexOf(e.key.toLowerCase()), b = $$(".lk-opt", body)[k >= 0 ? k : "1234".indexOf(e.key)]; if (b && !locked) { e.preventDefault(); b.click(); } });
  }
  /* --- Sort it, then odd one out --- */
  function gameSort() {
    const sets = CFG.sorts || []; if (!sets.length) return toast("No sorting sets yet.");
    const set = sets[Math.floor(Math.random() * sets.length)], bins = Object.keys(set.bins);
    let items = shuffle([].concat(...bins.map((b) => shuffle(set.bins[b].slice()).slice(0, 4).map((t) => ({ t, b }))))), sel = null, wrongN = 0, done = 0, t0 = Date.now();
    const body = openSheet("Sort it", "", { tag: "Lab game", wide: true });
    const draw = () => { body.innerHTML = `<div class="lk-qz"><div class="lk-qmeta"><span>${esc(set.title)}</span><span class="lk-sp"></span><span>${done} of ${items.length} placed · ${wrongN} wrong</span></div><p class="lk-note">Tap an item, then tap the group it belongs to. You can also drag it.</p>
      <div class="lk-chips" role="group" aria-label="Items to sort">${items.map((it, k) => (it.done ? "" : `<button type="button" class="lk-chip${sel === k ? " sel" : ""}" draggable="true" data-it="${k}" aria-pressed="${sel === k}">${esc(it.t)}</button>`)).join("")}</div>
      <div class="lk-bins" style="--n:${bins.length}">${bins.map((b) => `<button type="button" class="lk-bin" data-bin="${esc(b)}"><b>${esc(b)}</b><span>${items.filter((it) => it.done && it.b === b).map((it) => `<i>${esc(it.t)}</i>`).join("")}</span></button>`).join("")}</div></div>`; };
    const place = (k, b, el) => { const it = items[k]; if (!it || it.done) return; if (it.b === b) { it.done = true; done++; sel = null; if (done === items.length) return odd(); draw(); } else { wrongN++; sel = null; draw(); const bn = $$(".lk-bin", body).find((x) => x.dataset.bin === b); if (bn) { bn.classList.add("no"); setTimeout(() => bn.classList.remove("no"), 500); } toast(it.t + " does not belong in " + b + "."); } };
    body.addEventListener("click", (e) => { const c = e.target.closest("[data-it]"); if (c) { sel = sel === +c.dataset.it ? null : +c.dataset.it; draw(); return; } const b = e.target.closest("[data-bin]"); if (b && sel != null) place(sel, b.dataset.bin); else if (b) toast("Pick an item first."); });
    body.addEventListener("dragstart", (e) => { const c = e.target.closest("[data-it]"); if (c) e.dataTransfer.setData("text/plain", c.dataset.it); });
    body.addEventListener("dragover", (e) => { if (e.target.closest("[data-bin]")) e.preventDefault(); });
    body.addEventListener("drop", (e) => { const b = e.target.closest("[data-bin]"); if (!b) return; e.preventDefault(); place(+e.dataTransfer.getData("text/plain"), b.dataset.bin); });
    /* bonus round: five odd-one-outs made from every set */
    function odd() {
      const secs = Math.round((Date.now() - t0) / 1000), base = Math.max(10, items.length * 10 - wrongN * 5); let r = 0, got = 0; const rounds = [];
      for (let k = 0; k < 5; k++) { const s2 = sets[Math.floor(Math.random() * sets.length)], bs = shuffle(Object.keys(s2.bins)); if (bs.length < 2 || s2.bins[bs[0]].length < 3) continue; const three = shuffle(s2.bins[bs[0]].slice()).slice(0, 3), one = s2.bins[bs[1]][Math.floor(Math.random() * s2.bins[bs[1]].length)]; rounds.push({ opts: shuffle(three.concat([one])), one, why: `${one} is ${bs[1].toLowerCase()}; the others are ${bs[0].toLowerCase()}.` }); }
      const showOdd = () => { const R = rounds[r]; body.innerHTML = `<div class="lk-qz"><div class="lk-qmeta"><span>Bonus: odd one out · ${r + 1} of ${rounds.length}</span><span class="lk-sp"></span><span>${got} correct</span></div><p class="lk-q">Which one does not belong with the others?</p><div class="lk-opts two">${R.opts.map((t, k) => `<button type="button" class="lk-opt" data-odd="${k}"><b>${"ABCD"[k]}</b><span>${esc(t)}</span></button>`).join("")}</div><div class="lk-fb" aria-live="polite"></div></div>`; $(".lk-opt", body).focus(); };
      const fin = () => endGame("sort", body, base + got * 10, [`Sorted ${items.length} items in ${secs} s with ${wrongN} wrong move${wrongN === 1 ? "" : "s"}.`, `Odd one out: ${got} of ${rounds.length}.`], { perfect: wrongN === 0 });
      if (!rounds.length) return fin();
      body.onclick = (e) => { const b = e.target.closest("[data-odd]"); if (b && !b.disabled) { const R = rounds[r], ok = R.opts[+b.dataset.odd] === R.one; if (ok) got++; $$(".lk-opt", body).forEach((x, j) => { x.disabled = true; if (R.opts[j] === R.one) x.classList.add("ok"); else if (x === b) x.classList.add("bad"); }); $(".lk-fb", body).innerHTML = `<div class="lk-verdict ${ok ? "ok" : "bad"}">${ok ? "✓ " : "✗ "}${esc(R.why)}</div><button type="button" class="lk-btn primary" data-onext>${r === rounds.length - 1 ? "Finish" : "Next →"}</button>`; $("[data-onext]", body).focus(); } else if (e.target.closest("[data-onext]")) { r++; if (r >= rounds.length) { body.onclick = null; fin(); } else showOdd(); } };
      showOdd();
    }
    draw();
  }
  /* --- Lab challenge: reach a target in a real simulation --- */
  const num = (v) => parseFloat(String(v).replace(/[^\d.\-]/g, ""));
  function listChallenges() {
    const L = (CFG.challenges || []).filter((c) => window.MK && MK.has(c.key));
    const body = openSheet("Lab challenge", `<p class="lk-note">Each challenge opens a real simulation. Change the controls until you hit the target. Fewer moves and less time earn more stars.</p><div class="lk-grid">${L.map((c, i) => `<button type="button" class="lk-tile" data-ch="${i}"><span class="lk-stars" aria-label="${(ST.chal[c.id] || 0)} of 3 stars">${"★".repeat(ST.chal[c.id] || 0)}${"☆".repeat(3 - (ST.chal[c.id] || 0))}</span><b>${esc(c.title)}</b><span>${esc(c.goal)}</span></button>`).join("")}</div>`, { tag: "Lab game", wide: true });
    body.addEventListener("click", (e) => { const b = e.target.closest("[data-ch]"); if (b) runChallenge(L[+b.dataset.ch]); });
  }
  function runChallenge(ch) {
    let iv = 0, H = null, moves = 0, snap = "", t0 = Date.now(), won = false;
    const stop = () => { clearInterval(iv); try { if (H && H.S && window.MK && MK.unmount3d) MK.unmount3d(); } catch (e) { /* ignore */ } };
    const body = openSheet(ch.title, `<div class="lk-goal"><b>Target</b><span>${esc(ch.goal)}</span><span class="lk-sp"></span><span class="lk-live">0 moves · 0 s</span></div>${ch.hint ? `<details class="lk-hint"><summary>Need a hint?</summary>${esc(ch.hint)}</details>` : ""}<div class="sim-panel lk-sim"></div><div class="lk-row"><button type="button" class="lk-btn" data-back>← All challenges</button></div>`, { tag: "Lab challenge", wide: true, onClose: stop });
    const panel = $(".lk-sim", body); try { MK.mount(panel, ch.key); } catch (e) { panel.innerHTML = '<div class="sim-error">This simulation could not load.</div>'; return; }
    H = panel._mk; if (ch.start) { Object.assign(H.c, ch.start); H.refresh && H.refresh(); H.onCh && H.onCh("_reset"); } snap = JSON.stringify(H.c);
    $("[data-back]", body).addEventListener("click", () => { stop(); listChallenges(); });
    iv = setInterval(() => {
      if (!sheet || won) return; const now = JSON.stringify(H.c); if (now !== snap) { snap = now; moves++; }
      const secs = Math.round((Date.now() - t0) / 1000); $(".lk-live", body).textContent = `${moves} move${moves === 1 ? "" : "s"} · ${secs} s`;
      let ok = false; try { const R = {}; (H.sc.readouts(H.s, H.c) || []).forEach(([l, v]) => (R[l] = v)); ok = !!ch.ok(R, H.c, num); } catch (e) { ok = false; }
      if (ok && moves > 0) { won = true; clearInterval(iv); const stars = secs <= (ch.par || 60) && moves <= (ch.moves || 8) ? 3 : secs <= (ch.par || 60) * 2.5 ? 2 : 1; const first = !ST.chal[ch.id]; ST.chal[ch.id] = Math.max(ST.chal[ch.id] || 0, stars); addXp(first ? 20 + stars * 10 : stars * 3); award(); save();
        const g = $(".lk-goal", body); g.classList.add("won"); g.innerHTML = `<b>Solved!</b><span>${"★".repeat(stars)}${"☆".repeat(3 - stars)} · ${moves} move${moves === 1 ? "" : "s"} in ${secs} s${ch.why ? " — " + esc(ch.why) : ""}</span>`; confetti($(".lk-sheet-in", sheet)); toast("Challenge solved: " + ch.title); }
    }, 350);
  }
  /* --- Find the part: numbered markers on a 3D model --- */
  function gameParts() {
    const P = CFG.parts; if (!P || !window.MK || !MK.has(P.key)) return toast("This game needs the 3D lab.");
    let raf = 0, H = null, round = null, model = P.models[0][0];
    const stop = () => { cancelAnimationFrame(raf); try { window.MK && MK.unmount3d && MK.unmount3d(); } catch (e) { /* ignore */ } };
    const body = openSheet("Find the part", `<div class="lk-goal"><b>Model</b><span class="lk-seg">${P.models.map(([id, name], k) => `<button type="button" class="lk-chip${k === 0 ? " sel" : ""}" data-model="${id}" aria-pressed="${k === 0}">${esc(name)}</button>`).join("")}</span></div><div class="lk-ask" aria-live="polite">Loading the 3D model…</div><div class="lk-partwrap"><div class="sim-panel lk-sim"></div><div class="lk-marks"></div></div><p class="lk-note">Drag to turn the model: some parts hide behind others. Tap the numbered marker for the part named above.</p>`, { tag: "Lab game", wide: true, onClose: stop });
    const panel = $(".lk-sim", body), marks = $(".lk-marks", body), ask = $(".lk-ask", body);
    const start = () => {
      stop(); round = null; marks.innerHTML = ""; ask.textContent = "Loading the 3D model…"; try { MK.mount(panel, P.key); } catch (e) { ask.textContent = "The 3D model could not load."; return; }
      H = panel._mk; H.c.m = model; const pb = $(".mk-poster button", panel); if (pb) pb.click(); else { ask.textContent = "This game needs WebGL, which this browser has switched off."; return; }
      const loop = () => {
        raf = requestAnimationFrame(loop); const S = H.S, pts = H.s.pts; if (!S || !S.proj || !pts || H.s.key !== model) return;
        if (!round) { const pick = shuffle(pts.slice()).slice(0, Math.min(8, pts.length)); round = { pick, order: shuffle(pick.slice()), i: 0, miss: 0, t0: Date.now() }; marks.innerHTML = pick.map((p, k) => `<button type="button" class="lk-mark" data-m="${k}" aria-label="Marker ${k + 1}">${k + 1}</button>`).join(""); ask.innerHTML = `Find: <b>${esc(round.order[0].name)}</b> <span class="lk-dim">1 of ${pick.length}</span>`; }
        const st = $(".mk-stage", panel); if (marks.parentNode !== st) st.appendChild(marks); const w = st.clientWidth, h = st.clientHeight; $$(".lk-mark", marks).forEach((b, k) => { let q = null; try { q = S.proj(round.pick[k].pos()); } catch (e) { q = null; } if (!q || q.behind || !isFinite(q.x)) { b.style.display = "none"; return; } b.style.display = ""; b.style.left = (q.x / 640) * w + "px"; b.style.top = (q.y / 400) * h + "px"; });
      };
      loop();
    };
    marks.addEventListener("click", (e) => {
      const b = e.target.closest("[data-m]"); if (!b || !round || b.classList.contains("ok")) return; const p = round.pick[+b.dataset.m], want = round.order[round.i];
      if (p === want) { b.classList.add("ok"); b.textContent = "✓"; b.title = p.name; round.i++; if (round.i >= round.order.length) { const secs = Math.round((Date.now() - round.t0) / 1000), n = round.order.length, score = Math.max(10, n * 20 - round.miss * 5 - Math.floor(secs / 3)); cancelAnimationFrame(raf); const names = round.pick.map((x) => x.name).join(", "), miss = round.miss; stop(); endGame("parts", body, score, [`All ${n} parts found in ${secs} s with ${miss} miss${miss === 1 ? "" : "es"}.`, "Parts in this round: " + esc(names) + "."], { perfect: miss === 0 }); } else ask.innerHTML = `✓ Correct. Find: <b>${esc(round.order[round.i].name)}</b> <span class="lk-dim">${round.i + 1} of ${round.order.length}</span>`; }
      else { round.miss++; b.classList.add("no"); setTimeout(() => b.classList.remove("no"), 500); ask.innerHTML = `✗ That is the ${esc(p.name)}. Find: <b>${esc(want.name)}</b> <span class="lk-dim">${round.i + 1} of ${round.order.length}</span>`; }
    });
    body.addEventListener("click", (e) => { const m = e.target.closest("[data-model]"); if (!m) return; model = m.dataset.model; $$("[data-model]", body).forEach((x) => { const on = x === m; x.classList.toggle("sel", on); x.setAttribute("aria-pressed", String(on)); }); start(); });
    start();
  }
  const GAMES = {
    parts: { ic: "🔎", name: "Find the part", text: "Tap the right numbered marker on a 3D machine or animal before time runs away.", run: gameParts },
    clock: { ic: "⏱", name: "Beat the clock", text: "Two minutes of quick questions. Streaks multiply your score up to ×5.", run: gameClock },
    chal: { ic: "🧪", name: "Lab challenge", text: "Hit a target in a real simulation in the fewest moves to earn three stars.", run: listChallenges },
    sort: { ic: "🗂", name: "Sort it", text: "Put every item in the right group, then spot the odd one out.", run: gameSort },
  };

  /* ================= pages inside the lab ================= */
  const RAIL = [["PROGRESS", "◔", "MY LAB", "My progress", () => `${allTopics().filter((t) => level(t.code) === 3).length} of ${allTopics().length} topics mastered`], ["PRACTICE", "✦", "PRACTICE", "Daily five & revision", () => (ST.daily.last === day() ? "Done today · " : "") + `streak ${ST.daily.last === day() || ST.daily.last === addDays(day(), -1) ? ST.daily.streak : 0}`], ["GAMES", "▶", "PLAY", "Lab games", () => "4 games"], ["TEACH", "▤", "TEACHERS", "Teacher tools", () => "Present · test · worksheet"]];
  LK.owns = (code) => RAIL.some((r) => r[0] === code);
  LK.rail = (active) => RAIL.map(([id, g, k, name, sub]) => `<div class="tick lk-tick ${active === id ? "active" : ""}"><button class="tick-btn" data-topic="${id}" aria-current="${active === id}"><span class="tick-glyph">${g}</span><span class="tick-text"><span class="tick-code">${k}</span><span class="tick-name">${name}</span><span class="tick-count">${esc(sub())}</span></span></button></div>`).join("");
  const streakNow = () => (ST.daily.last === day() || ST.daily.last === addDays(day(), -1) ? ST.daily.streak : 0);
  const head = (tag, title, text) => `<div class="lk-head"><span class="lk-badge">${esc(tag)}</span><h1>${esc(title)}</h1><p>${text}</p></div>`;
  const tiles = (arr) => `<div class="lk-tiles">${arr.map(([n, l]) => `<div class="lk-stat"><div class="n">${n}</div><div class="l">${esc(l)}</div></div>`).join("")}</div>`;
  const hm = (s) => (s >= 3600 ? Math.floor(s / 3600) + " h " + Math.round((s % 3600) / 60) + " min" : Math.round(s / 60) + " min");
  function suggest() {
    const T = allTopics().filter((t) => (CFG.bank[t.code] || []).length), weak = T.filter((t) => level(t.code) === 1 || level(t.code) === 2).sort((a, b) => best(a.code) - best(b.code)).slice(0, 3);
    const seenNot = T.find((t) => level(t.code) === 0 && t.subtopics.some((s) => ST.seen[t.code + "-" + s.code])), next = seenNot || T.find((t) => level(t.code) === 0);
    return { weak, next };
  }
  /* strip on the lab dashboard */
  LK.strip = () => { const r = rank(), s = suggest(), done = ST.daily.last === day(); return `<div class="lk lk-strip"><div class="lk-card0"><div class="lk-lvl"><b>Level ${r.n} · ${esc(r.name)}</b><span>${ST.xp} XP</span></div><div class="lk-bar"><span style="width:${pct(ST.xp - r.lo, r.hi - r.lo)}%"></span></div><div class="lk-row"><span class="lk-pill">🔥 ${streakNow()} day streak</span><span class="lk-pill">${allTopics().filter((t) => level(t.code) === 3).length} mastered</span><span class="lk-pill">${ST.mistakes.length} to fix</span></div></div>
    <div class="lk-card0"><b>${done ? "Daily five done ✓" : "Today's daily five"}</b><span class="lk-dim">${done ? "Come back tomorrow to keep your streak." : "Five quick questions that favour your weaker topics."}</span><div class="lk-row"><button type="button" class="lk-btn primary" data-lk="daily">${done ? "Practise again" : "Start daily five"}</button>${s.next ? `<button type="button" class="lk-btn" data-lk="go" data-code="${s.next.code}">Next topic: ${esc(s.next.num || s.next.code)}</button>` : ""}</div></div></div>`; };
  /* bar on a topic page */
  LK.topicBar = (t) => { const n = (CFG.bank[t.code] || []).length, r = rec(t.code), nc = cards().filter((c) => c.t === t.code).length; return `<div class="lk lk-topicbar">${LK.ring(t.code, 54)}<div class="lk-tb-text"><b>${LEVELS[level(t.code)][1]}</b><span class="lk-dim">${r ? `Best ${r.best} % · last ${r.last} % · ${r.att} attempt${r.att === 1 ? "" : "s"}` : "No attempt yet. Score 80 % to master this topic."}</span></div><span class="lk-sp"></span>${n ? `<button type="button" class="lk-btn primary" data-lk="check" data-code="${t.code}">✓ Check yourself</button>` : ""}${nc ? `<button type="button" class="lk-btn" data-lk="cards" data-code="${t.code}">🃏 Flashcards (${nc})</button>` : ""}<button type="button" class="lk-btn" data-lk="sheet" data-code="${t.code}">▤ Worksheet</button></div>`; };

  function pageProgress() {
    const T = allTopics(), r = rank(), m = T.filter((t) => level(t.code) === 3).length, sec = T.filter((t) => level(t.code) === 2).length, seen = Object.keys(ST.seen).length, s = suggest();
    return `<div class="lk">${head("My lab", "My progress", `Saved on this device only. ${ST.name ? "Learner: <b>" + esc(ST.name) + "</b>. " : ""}<button type="button" class="lk-link" data-lk="name">${ST.name ? "Change name" : "Add your name"}</button>`)}
      <div class="lk-card0"><div class="lk-lvl"><b>Level ${r.n} · ${esc(r.name)}</b><span>${ST.xp} XP · ${r.hi - ST.xp} to the next level</span></div><div class="lk-bar"><span style="width:${pct(ST.xp - r.lo, r.hi - r.lo)}%"></span></div></div>
      ${tiles([[m + "/" + T.length, "Topics mastered"], [sec, "Topics secure"], [pct(seen, subCount()) + "%", "Syllabus opened"], [ST.stats.answered, "Questions answered"], [pct(ST.stats.correct, ST.stats.answered) + "%", "Accuracy"], ["🔥 " + streakNow(), "Day streak"], [hm(ST.stats.secs), "Time in the lab"]])}
      <div class="lk-two"><div class="lk-card0"><h3>What to do next</h3>${s.next ? `<p>Start <b>${esc(s.next.title)}</b>.</p><div class="lk-row"><button type="button" class="lk-btn primary" data-lk="go" data-code="${s.next.code}">Open topic ${esc(s.next.num || s.next.code)}</button></div>` : "<p>You have attempted every topic.</p>"}${s.weak.length ? `<p class="lk-dim" style="margin-top:12px">Weakest so far:</p>${s.weak.map((t) => `<div class="lk-line">${LK.ring(t.code, 30)}<span>${esc(t.title)}</span><span class="lk-sp"></span><button type="button" class="lk-btn sm" data-lk="check" data-code="${t.code}">Retry</button></div>`).join("")}` : ""}</div>
      <div class="lk-card0"><h3>Badges <span class="lk-dim">${Object.keys(ST.badges).length} of ${BADGES.length}</span></h3><div class="lk-badges">${BADGES.map(([id, ic, name, how]) => `<div class="lk-bdg${ST.badges[id] ? " on" : ""}" title="${esc(how)}"><span aria-hidden="true">${ic}</span><b>${esc(name)}</b><small>${ST.badges[id] ? nice(ST.badges[id]) : esc(how)}</small></div>`).join("")}</div></div></div>
      ${sections().map((S) => { const c = [0, 0, 0, 0]; S.topics.forEach((t) => c[level(t.code)]++); const n = S.topics.length || 1, cert = S.topics.length && S.topics.every((t) => level(t.code) >= 2);
        return `<details class="lk-card0 lk-sec"${S.topics.some((t) => level(t.code) > 0) ? " open" : ""}><summary><b>${esc(S.label)}</b><span class="lk-stack" aria-label="${c[3]} mastered, ${c[2]} secure, ${c[1]} learning, ${c[0]} not started"><i style="width:${(c[3] / n) * 100}%;background:var(--lk-good)"></i><i style="width:${(c[2] / n) * 100}%;background:var(--lk-info)"></i><i style="width:${(c[1] / n) * 100}%;background:var(--lk-warn)"></i></span><span class="lk-dim">${c[3]} mastered · ${c[2]} secure · ${c[1]} learning · ${c[0]} to start</span></summary>
          ${cert ? `<div class="lk-row"><button type="button" class="lk-btn primary" data-lk="cert" data-sec="${esc(S.key)}">🎓 Get the certificate for this section</button></div>` : `<p class="lk-dim">Reach Secure (50 % or more) in every topic here to unlock the certificate.</p>`}
          <table class="lk-table"><tr><th></th><th>Topic</th><th>Level</th><th>Best</th><th>Attempts</th><th>Last tried</th><th></th></tr>${S.topics.map((t) => { const q = rec(t.code); return `<tr><td>${LK.ring(t.code, 30)}</td><td><button type="button" class="lk-link" data-lk="go" data-code="${t.code}">${esc(t.num || t.code)} · ${esc(t.title)}</button></td><td>${LEVELS[level(t.code)][1]}</td><td>${q ? q.best + " %" : "—"}</td><td>${q ? q.att : 0}</td><td>${q ? nice(q.when) : "—"}</td><td>${(CFG.bank[t.code] || []).length ? `<button type="button" class="lk-btn sm" data-lk="check" data-code="${t.code}">Check</button>` : ""}</td></tr>`; }).join("")}</table></details>`; }).join("")}
      <div class="lk-card0"><h3>Keep or move your progress</h3><p class="lk-dim">Progress lives in this browser on this device. Use a backup file to move it to another device or to hand a report to your teacher.</p><div class="lk-row"><button type="button" class="lk-btn" data-lk="report">🖨 Print progress report</button><button type="button" class="lk-btn" data-lk="backup">⇩ Save backup file</button><button type="button" class="lk-btn" data-lk="restore">⇧ Load backup file</button><button type="button" class="lk-btn danger" data-lk="reset">Reset my progress</button></div></div></div>`;
  }
  function pagePractice() {
    const done = ST.daily.last === day(), d = ST.daily, dueN = cards().filter((c) => ST.cards[c.id] && due(c)).length, newN = cards().filter((c) => !ST.cards[c.id]).length;
    const week = []; for (let i = 6; i >= 0; i--) { const k = addDays(day(), -i); week.push([k, d.days.includes(k)]); }
    return `<div class="lk">${head("Practice", "Daily five and revision", "A few minutes a day beats one long session. Daily five picks questions from topics you have opened or found hard.")}
      <div class="lk-two"><div class="lk-card0"><h3>Daily five ${done ? "✓" : ""}</h3><div class="lk-week" aria-label="Last seven days">${week.map(([k, on]) => `<span class="${on ? "on" : ""}" title="${nice(k)}">${"SMTWTFS"[new Date(k.split("-")[0], k.split("-")[1] - 1, k.split("-")[2]).getDay()]}</span>`).join("")}</div><p>🔥 Streak <b>${streakNow()}</b> day${streakNow() === 1 ? "" : "s"} · best ${d.best} · ${d.total} completed</p><div class="lk-row"><button type="button" class="lk-btn primary" data-lk="daily">${done ? "Practise again (streak already counted)" : "Start today's five"}</button></div></div>
      <div class="lk-card0"><h3>Flashcards</h3><p>${dueN} due for review · ${newN} new · ${cards().length} in total, made from the syllabus definitions.</p><div class="lk-row"><button type="button" class="lk-btn primary" data-lk="cards">Review cards</button></div><p class="lk-dim">Cards you know come back after 1, 2, 4, 8 and 16 days.</p></div></div>
      <div class="lk-card0"><h3>Mistake notebook <span class="lk-dim">${ST.mistakes.length} open · ${ST.stats.fixed} cleared</span></h3>${ST.mistakes.length ? `<div class="lk-row"><button type="button" class="lk-btn primary" data-lk="retry">Retry my mistakes</button></div>${ST.mistakes.slice(0, 30).map((m) => `<details class="lk-miss"><summary>${esc(m.q)}</summary><div><b>Answer:</b> ${esc(m.a)}</div><div class="lk-dim">You chose: ${esc(m.y)} · ${esc((topic(m.t) || {}).title || "")} · ${nice(m.d)}</div>${(m.s || []).map((s) => `<div class="lk-dim">${esc(s)}</div>`).join("")}</details>`).join("")}${ST.mistakes.length > 30 ? `<p class="lk-dim">Showing 30 of ${ST.mistakes.length}.</p>` : ""}` : `<p class="lk-dim">Every question you miss is kept here with its answer. Get it right later and it clears itself.</p>`}</div></div>`;
  }
  function pageGames() {
    return `<div class="lk">${head("Play", "Lab games", "Short games built from the same questions, simulations and 3D models as the lessons. They earn XP and badges.")}<div class="lk-grid">${Object.entries(GAMES).map(([id, g]) => { const r = ST.games[id] || {}; const extra = id === "chal" ? `${Object.keys(ST.chal).length} of ${(CFG.challenges || []).length} solved` : r.plays ? `Best ${r.best} · played ${r.plays}×` : "Not played yet"; return `<button type="button" class="lk-tile big" data-lk="game" data-game="${id}"><span class="lk-ic" aria-hidden="true">${g.ic}</span><b>${g.name}</b><span>${g.text}</span><small>${extra}</small></button>`; }).join("")}</div></div>`;
  }
  function pageTeach() {
    const T = allTopics(), can = !!CFG.sw && "serviceWorker" in navigator && /^https?:$/.test(location.protocol);
    return `<div class="lk">${head("Teachers", "Teacher tools", "No sign-in is needed and nothing is collected. Every tool works from this page and prints on A4.")}
      <div class="lk-two"><div class="lk-card0"><h3>Presentation mode</h3><p>Hides the menus, enlarges the simulation and text, and turns the pointer into a laser dot for a projector. Press <kbd>Esc</kbd> to leave.</p><div class="lk-row"><button type="button" class="lk-btn primary" data-lk="present">Start presenting</button></div></div>
      <div class="lk-card0"><h3>Use without internet</h3><p>${can ? "Save this lab on the device so it opens without data. Simulations you have already opened are kept too." : "Offline saving is not available in this view. Open the lab on the main site to use it."}</p><div class="lk-row">${can ? '<button type="button" class="lk-btn" data-lk="offline">Save lab for offline use</button>' : ""}<span class="lk-dim" id="lk-off"></span></div></div></div>
      <div class="lk-card0"><h3>Test builder</h3><p>Choose topics and a length. You get a printable objective paper with fresh question order and a separate marking scheme.</p>
        <div class="lk-row"><label class="lk-k" for="lk-tn">Questions</label><select id="lk-tn"><option>10</option><option selected>20</option><option>30</option><option>40</option><option>50</option></select><label class="lk-k" for="lk-tt">Title</label><input id="lk-tt" type="text" value="${esc(CFG.subject)} class test" maxlength="60"><button type="button" class="lk-btn sm" data-lk="tall">All / none</button></div>
        ${sections().map((S) => `<div class="lk-pick"><b>${esc(S.label)}</b><div class="lk-chips">${S.topics.filter((t) => (CFG.bank[t.code] || []).length).map((t) => `<button type="button" class="lk-chip" data-pick="${t.code}" aria-pressed="false" title="${esc(t.title)}">${esc(t.num || t.code)} ${esc(t.title.length > 34 ? t.title.slice(0, 32) + "…" : t.title)}</button>`).join("")}</div></div>`).join("")}
        <div class="lk-row"><button type="button" class="lk-btn primary" data-lk="test">Build the test</button></div></div>
      <div class="lk-card0"><h3>Lesson plan and worksheet</h3><p>Pick a topic for a one-page lesson plan (objectives, key points, simulation activities) and a student worksheet with an answer key.</p><div class="lk-row"><label class="lk-k" for="lk-lt">Topic</label><select id="lk-lt">${T.map((t) => `<option value="${t.code}">${esc(t.num || t.code)} · ${esc(t.title)}</option>`).join("")}</select><button type="button" class="lk-btn primary" data-lk="plan">Lesson plan</button><button type="button" class="lk-btn" data-lk="sheet">Worksheet</button></div></div></div>`;
  }
  LK.render = (root, code) => { root.innerHTML = code === "PROGRESS" ? pageProgress() : code === "PRACTICE" ? pagePractice() : code === "GAMES" ? pageGames() : pageTeach(); };

  /* ================= printouts ================= */
  const stamp = () => `<div class="lk-pr-foot">${esc(CFG.brand || "learnwithnehy.")} · ${esc(CFG.subject)} · ${nice(day())}</div>`;
  function printable(title, html) { openSheet(title, `<div class="lk-paper">${html}${stamp()}</div>`, { tag: "Printout", wide: true, print: true }); }
  function buildTest(codes, n, title) {
    const qs = mixedQs(codes, n); if (!qs.length) return toast("Choose at least one topic.");
    printable(title, `<h1>${esc(title)}</h1><p class="lk-pr-meta">Name: ____________________________ &nbsp; Class: __________ &nbsp; Date: __________ &nbsp; Score: ______ / ${qs.length}</p><p class="lk-pr-meta">Answer all questions. Each question has four options lettered A to D. Time allowed: ${qs.length} minutes.</p><ol class="lk-pr-q">${qs.map((q) => `<li><p>${esc(q.q)}</p><div class="lk-pr-o">${q.opts.map((o, k) => `<span><b>${"ABCD"[k]}.</b> ${esc(o)}</span>`).join("")}</div></li>`).join("")}</ol>
      <div class="lk-pr-break"></div><h1>Marking scheme — ${esc(title)}</h1><table class="lk-pr-t"><tr><th>No.</th><th>Answer</th><th>Topic</th></tr>${qs.map((q, i) => `<tr><td>${i + 1}</td><td><b>${"ABCD"[q.opts.indexOf(q.ans)]}</b> — ${esc(q.ans)}</td><td>${esc((topic(q.topic) || {}).title || "")}</td></tr>`).join("")}</table>`);
  }
  const sims = (t) => { const out = []; if (!window.MK) return out; t.subtopics.forEach((st) => { const k = t.code + "-" + st.code; [k].concat(MK.extras ? MK.extras(k) : []).forEach((kk) => { const sc = MK.scenes[kk]; if (sc) out.push({ title: sc.title || st.title, tasks: sc.tasks || [] }); }); }); return out; };
  function lessonPlan(code) {
    const t = topic(code); if (!t) return; const S = sims(t);
    printable("Lesson plan — " + t.title, `<h1>Lesson plan: ${esc(t.title)}</h1><p class="lk-pr-meta">${esc(CFG.subject)} · ${esc(t.sectionLabel)} · Topic ${esc(t.num || t.code)} · Class: ________ · Duration: ${Math.max(1, Math.ceil(t.subtopics.length / 2))} × 40 minutes</p>
      <h2>Objectives</h2><p>By the end of the lesson, students should be able to:</p><ol>${t.subtopics.map((s) => `<li>explain ${esc(s.title.charAt(0).toLowerCase() + s.title.slice(1))}</li>`).join("")}</ol>
      <h2>Key points</h2>${t.subtopics.map((s) => `<h3>${esc(s.title)}</h3><ul>${(s.content || []).map((c) => `<li>${esc(c)}</li>`).join("")}</ul>${s.notes ? `<p class="lk-pr-note"><b>Examiner's note:</b> ${esc(s.notes)}</p>` : ""}`).join("")}
      <h2>Lesson steps</h2><table class="lk-pr-t"><tr><th>Step</th><th>Teacher</th><th>Students</th></tr><tr><td>Starter (5 min)</td><td>Ask what students already know about ${esc(t.title.toLowerCase())}; note answers on the board.</td><td>Share ideas; attempt two warm-up questions.</td></tr><tr><td>Teach (15 min)</td><td>Project the lab in presentation mode; go through each subtopic and its simulation.</td><td>Take notes; predict what each control will change.</td></tr><tr><td>Practise (12 min)</td><td>Set the simulation activities below; move round the class.</td><td>Work in pairs; record readings on the experiment card.</td></tr><tr><td>Check (8 min)</td><td>Run “Check yourself” on the projector or hand out the worksheet.</td><td>Answer; correct mistakes with the worked solutions.</td></tr></table>
      <h2>Simulation activities</h2>${S.length ? `<ul>${S.slice(0, 8).map((x) => `<li><b>${esc(x.title)}</b>${x.tasks.length ? ": " + x.tasks.map(esc).join(" ") : ""}</li>`).join("")}</ul>` : "<p>Use the notes and specimen photos for this topic.</p>"}
      <h2>Assessment</h2><p>Topic check in the lab (8 questions) or the printed worksheet. Mastery is 80 % or more.</p><h2>Homework</h2><p>Daily five in the lab, and review the flashcards for this topic.</p>`);
  }
  function worksheet(code) {
    const t = topic(code); if (!t) return; const qs = shuffle(bankQs(code)).slice(0, 8), terms = cards().filter((c) => c.t === code).slice(0, 5), S = sims(t)[0];
    printable("Worksheet — " + t.title, `<h1>Worksheet: ${esc(t.title)}</h1><p class="lk-pr-meta">Name: ____________________________ &nbsp; Class: __________ &nbsp; Date: __________</p>
      ${terms.length ? `<h2>A. Explain these terms</h2><ol>${terms.map((c) => `<li>${esc(c.front)} <span class="lk-pr-line"></span></li>`).join("")}</ol>` : ""}
      <h2>${terms.length ? "B" : "A"}. Choose the correct option</h2><ol class="lk-pr-q">${qs.map((q) => `<li><p>${esc(q.q)}</p><div class="lk-pr-o">${q.opts.map((o, k) => `<span><b>${"ABCD"[k]}.</b> ${esc(o)}</span>`).join("")}</div></li>`).join("")}</ol>
      ${S && S.tasks.length ? `<h2>${terms.length ? "C" : "B"}. In the lab: ${esc(S.title)}</h2><ol>${S.tasks.map((x) => `<li>${esc(x)} <span class="lk-pr-line"></span></li>`).join("")}</ol>` : ""}
      <div class="lk-pr-break"></div><h1>Answer key — ${esc(t.title)}</h1>${terms.length ? `<h2>A</h2><ol>${terms.map((c) => `<li><b>${esc(c.front)}:</b> ${esc(c.back)}</li>`).join("")}</ol>` : ""}<h2>${terms.length ? "B" : "A"}</h2><ol>${qs.map((q) => `<li><b>${"ABCD"[q.opts.indexOf(q.ans)]}</b> — ${esc(q.ans)}</li>`).join("")}</ol>`);
  }
  function report() {
    const T = allTopics(), r = rank();
    printable("Progress report", `<h1>Progress report — ${esc(CFG.subject)}</h1><p class="lk-pr-meta">Learner: ${ST.name ? esc(ST.name) : "____________________________"} &nbsp; Date: ${nice(day())}</p><p class="lk-pr-meta">Level ${r.n} (${esc(r.name)}) · ${ST.xp} XP · ${T.filter((t) => level(t.code) === 3).length} of ${T.length} topics mastered · ${ST.stats.answered} questions answered · accuracy ${pct(ST.stats.correct, ST.stats.answered)} % · daily-five streak ${streakNow()} · time in the lab ${hm(ST.stats.secs)}</p>
      ${sections().map((S) => `<h2>${esc(S.label)}</h2><table class="lk-pr-t"><tr><th>Topic</th><th>Level</th><th>Best</th><th>Last</th><th>Attempts</th><th>Last tried</th></tr>${S.topics.map((t) => { const q = rec(t.code); return `<tr><td>${esc(t.num || t.code)} · ${esc(t.title)}</td><td>${LEVELS[level(t.code)][1]}</td><td>${q ? q.best + " %" : "—"}</td><td>${q ? q.last + " %" : "—"}</td><td>${q ? q.att : 0}</td><td>${q ? nice(q.when) : "—"}</td></tr>`; }).join("")}</table>`).join("")}<p class="lk-pr-note">This report is produced on the learner's own device from saved practice results. It is not an examination record.</p>`);
  }
  function certificate(secKey) {
    const S = sections().find((s) => s.key === secKey); if (!S) return; const avg = Math.round(S.topics.reduce((n, t) => n + Math.max(0, best(t.code)), 0) / (S.topics.length || 1));
    const body = openSheet("Certificate", `<canvas class="lk-cert" width="1600" height="1130" role="img" aria-label="Certificate for ${esc(S.label)}"></canvas><div class="lk-row"><button type="button" class="lk-btn primary" data-dl data-auto>⇩ Download as an image</button><button type="button" class="lk-btn" data-lk="name">Change the name</button></div><p class="lk-note">This is a practice award from the lab, not an examination certificate.</p>`, { tag: "Award", wide: true });
    sheet.dataset.sec = secKey;
    const cv = $("canvas", body), x = cv.getContext("2d"), W = 1600, Hh = 1130;
    const g = x.createLinearGradient(0, 0, W, Hh); g.addColorStop(0, "#fbf8ef"); g.addColorStop(1, "#f1ead6"); x.fillStyle = g; x.fillRect(0, 0, W, Hh);
    x.strokeStyle = "#12203b"; x.lineWidth = 10; x.strokeRect(40, 40, W - 80, Hh - 80); x.strokeStyle = "#d9a441"; x.lineWidth = 3; x.strokeRect(62, 62, W - 124, Hh - 124);
    x.fillStyle = "#12203b"; x.textAlign = "center"; x.font = "600 30px 'JetBrains Mono', monospace"; x.fillText((CFG.brand || "learnwithnehy.").toUpperCase() + "  ·  WAEC " + CFG.subject.toUpperCase(), W / 2, 170);
    x.font = "600 86px 'Source Serif 4', Georgia, serif"; x.fillText("Certificate of Achievement", W / 2, 300);
    x.font = "400 34px 'IBM Plex Sans', sans-serif"; x.fillStyle = "#5b6478"; x.fillText("This is awarded to", W / 2, 400);
    x.fillStyle = "#b5322f"; x.font = "600 76px 'Source Serif 4', Georgia, serif"; x.fillText(ST.name || "________________________", W / 2, 505);
    x.fillStyle = "#12203b"; x.font = "400 34px 'IBM Plex Sans', sans-serif"; x.fillText("for reaching Secure or better in every topic of", W / 2, 600);
    x.font = "600 46px 'Source Serif 4', Georgia, serif"; const lab = S.label; x.fillText(lab.length > 56 ? lab.slice(0, 54) + "…" : lab, W / 2, 670);
    x.font = "500 30px 'JetBrains Mono', monospace"; x.fillStyle = "#1d7a63"; x.fillText(`${S.topics.length} topics  ·  average best score ${avg} %  ·  ${S.topics.filter((t) => level(t.code) === 3).length} mastered`, W / 2, 760);
    x.fillStyle = "#5b6478"; x.font = "400 28px 'IBM Plex Sans', sans-serif"; x.fillText(nice(day()), W / 2, 880); x.fillText("Practice award from the interactive science lab. Not an examination certificate.", W / 2, 990);
    x.beginPath(); x.arc(W / 2, 835, 0, 0, 0); x.strokeStyle = "#12203b"; x.lineWidth = 2; x.moveTo(W / 2 - 180, 900); x.lineTo(W / 2 + 180, 900); x.stroke();
    $("[data-dl]", body).addEventListener("click", () => { const a = document.createElement("a"); a.download = CFG.id + "-certificate-" + S.key + ".png"; a.href = cv.toDataURL("image/png"); a.click(); });
  }

  /* ================= presentation mode ================= */
  let laser = null;
  function present(on) {
    document.body.classList.toggle("lk-present", on);
    if (on) { if (!laser) { laser = document.createElement("div"); laser.id = "lk-laser"; laser.setAttribute("aria-hidden", "true"); document.body.appendChild(laser); document.addEventListener("pointermove", (e) => { if (document.body.classList.contains("lk-present")) laser.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; }); const b = document.createElement("button"); b.type = "button"; b.id = "lk-exit"; b.textContent = "✕ Exit presentation (Esc)"; b.setAttribute("data-lk", "unpresent"); document.body.appendChild(b); } toast("Presentation mode on. Open a topic and launch its simulation. Press Esc to leave."); }
    window.dispatchEvent(new Event("resize"));
  }

  /* ================= events ================= */
  function act(a, el) {
    const code = el.dataset.code;
    if (a === "close") return closeSheet();
    if (a === "print") return window.print();
    if (a === "check") return LK.check(code);
    if (a === "cards") return runCards(code);
    if (a === "daily") return LK.daily();
    if (a === "retry") return LK.retry();
    if (a === "game") return GAMES[el.dataset.game].run();
    if (a === "go") { closeSheet(true); return CFG.go && CFG.go(code); }
    if (a === "cert") return certificate(el.dataset.sec);
    if (a === "report") return report();
    if (a === "present") return present(true);
    if (a === "unpresent") return present(false);
    if (a === "plan") return lessonPlan(code || ($("#lk-lt") || {}).value);
    if (a === "sheet") return worksheet(code || ($("#lk-lt") || {}).value);
    if (a === "tall") { const all = $$("[data-pick]"), on = all.some((b) => b.getAttribute("aria-pressed") !== "true"); all.forEach((b) => { b.setAttribute("aria-pressed", String(on)); b.classList.toggle("sel", on); }); return; }
    if (a === "test") { const codes = $$("[data-pick][aria-pressed=true]").map((b) => b.dataset.pick); if (!codes.length) return toast("Choose at least one topic for the test."); return buildTest(codes, +$("#lk-tn").value, ($("#lk-tt").value || "Class test").trim()); }
    if (a === "name") { const n = window.prompt("Name to show on reports and certificates:", ST.name || ""); if (n != null) { ST.name = n.trim().slice(0, 40); save(); const sec = sheet && $(".lk-cert", sheet) ? sheet.dataset.sec : null; if (sec) { closeSheet(true); certificate(sec); } else CFG.rerender && CFG.rerender(); } return; }
    if (a === "backup") { const blob = new Blob([JSON.stringify({ app: "lwn-learn", id: CFG.id, saved: new Date().toISOString(), data: ST })], { type: "application/json" }), l = document.createElement("a"); l.href = URL.createObjectURL(blob); l.download = CFG.id + "-progress-" + day() + ".json"; l.click(); setTimeout(() => URL.revokeObjectURL(l.href), 2000); return; }
    if (a === "restore") { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json,.json"; inp.addEventListener("change", () => { const f = inp.files[0]; if (!f) return; const fr = new FileReader(); fr.onload = () => { try { const j = JSON.parse(fr.result); if (j.app !== "lwn-learn" || j.id !== CFG.id || !j.data || j.data.v !== 1) throw new Error("wrong file"); ST = Object.assign(blank(), j.data); save(); toast("Progress loaded from the backup file."); CFG.rerender && CFG.rerender(); } catch (e) { toast("That file is not a progress backup for this lab."); } }; fr.readAsText(f); }); inp.click(); return; }
    if (a === "reset") { if (window.confirm("Delete all saved progress for " + CFG.subject + " on this device? This cannot be undone.")) { ST = blank(); save(); CFG.rerender && CFG.rerender(); toast("Progress reset."); } return; }
    if (a === "offline") return goOffline();
  }
  function goOffline() {
    const out = $("#lk-off"), say = (t) => { if (out) out.textContent = t; };
    if (!("serviceWorker" in navigator)) return say("This browser cannot save the lab for offline use.");
    say("Saving…");
    navigator.serviceWorker.register(CFG.sw || "/sw.js").then(() => navigator.serviceWorker.ready).then((reg) => {
      const urls = [location.pathname].concat($$("script[src]").map((s) => s.getAttribute("src")), $$("link[rel=stylesheet][href]").map((s) => s.getAttribute("href"))).filter((u) => u && !/^https?:\/\//.test(u) || (u && u.indexOf(location.origin) === 0));
      const ch = new MessageChannel(); ch.port1.onmessage = (e) => say(e.data && e.data.ok ? `Saved ${e.data.n} files. The lab now opens without internet; 3D skies and textures are kept as you use them.` : "Some files could not be saved. Try again on a steady connection.");
      (reg.active || reg.waiting || reg.installing).postMessage({ type: "precache", urls }, [ch.port2]);
    }).catch(() => say("Offline saving is not available here."));
  }
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-lk]"); if (el && CFG) { e.preventDefault(); act(el.dataset.lk, el); return; }
    const pk = e.target.closest("[data-pick]"); if (pk) { const on = pk.getAttribute("aria-pressed") !== "true"; pk.setAttribute("aria-pressed", String(on)); pk.classList.toggle("sel", on); return; }
    const hd = e.target.closest(".item-head[data-key]"); if (hd && CFG && !ST.seen[hd.dataset.key]) { ST.seen[hd.dataset.key] = 1; award(); save(); }
  });
  document.addEventListener("keydown", (e) => { if (e.key !== "Escape") return; if (sheet) closeSheet(); else if (document.body.classList.contains("lk-present")) present(false); });
  setInterval(() => { if (CFG && ST && document.visibilityState === "visible") { ST.stats.secs += 20; save(); } }, 20000);

  /* ================= styles ================= */
  const css = `
.lk{--lk-good:#2f9e6e;--lk-info:#3b82c4;--lk-warn:#d9912b;--lk-bad:#d0463f;--lk-idle:var(--g-muted,#8c96b3);--lk-track:var(--g-well,rgba(120,120,150,.22));color:var(--g-ink,#1b2a4a);font-family:'IBM Plex Sans',system-ui,sans-serif;display:flex;flex-direction:column;gap:14px;max-width:1040px;margin:0 auto}
.lk *{box-sizing:border-box}.lk h1{font:600 clamp(24px,3.6vw,32px)/1.2 'Source Serif 4',Georgia,serif;margin:6px 0}.lk h2{font:600 20px/1.25 'Source Serif 4',Georgia,serif;margin:0}.lk h3{font:600 17px/1.3 'Source Serif 4',Georgia,serif;margin:0 0 8px}
.lk p{margin:0 0 8px;font-size:14.5px;line-height:1.55}.lk-head p{color:var(--g-muted,#5b6478);max-width:70ch}.lk-dim{color:var(--g-muted,#5b6478);font-size:12.5px}.lk-sp{flex:1}
.lk-badge{display:inline-block;font:700 10.5px 'JetBrains Mono',monospace;letter-spacing:.1em;text-transform:uppercase;padding:4px 9px;border-radius:999px;background:var(--g-active,rgba(255,210,122,.25));color:var(--g-accent,#7962b1)}
.lk-card0{padding:16px 18px;border-radius:18px;background:var(--g-surface,rgba(255,255,255,.7));border:1px solid var(--g-edge,rgba(0,0,0,.1));box-shadow:inset 1px 2px 2px var(--g-highlight,rgba(255,255,255,.4)),4px 8px 16px var(--g-shadow,rgba(0,0,0,.08));display:flex;flex-direction:column;gap:6px;min-width:0}
.lk-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:6px}.lk-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}
.lk-btn{font:600 13px 'IBM Plex Sans',sans-serif;padding:9px 14px;border-radius:12px;border:1px solid var(--g-edge,rgba(0,0,0,.18));background:var(--g-well,rgba(0,0,0,.05));color:inherit;cursor:pointer;min-height:40px}
.lk-btn:hover{filter:brightness(1.08)}.lk-btn:focus-visible,.lk-opt:focus-visible,.lk-chip:focus-visible,.lk-tile:focus-visible,.lk-card:focus-visible,.lk-bin:focus-visible,.lk-mark:focus-visible,.lk-link:focus-visible{outline:3px solid var(--g-accent,#7962b1);outline-offset:2px}
.lk-btn.primary{background:linear-gradient(135deg,#ffd27a,#ffb347);color:#3a2a10;border-color:transparent;font-weight:700}.lk-btn.sm{padding:5px 10px;min-height:32px;font-size:12px}.lk-btn.ghost{background:transparent}.lk-btn.danger{color:var(--lk-bad)}
.lk-link{background:none;border:0;padding:0;color:inherit;font:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer;text-align:left}
.lk-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:10px}.lk-stat{padding:14px;border-radius:16px;background:var(--g-surface,rgba(255,255,255,.7));border:1px solid var(--g-edge,rgba(0,0,0,.1))}.lk-stat .n{font:700 22px 'JetBrains Mono',monospace}.lk-stat .l{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--g-muted,#5b6478);margin-top:6px}
.lk-lvl{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:14px}.lk-lvl span{font:600 12px 'JetBrains Mono',monospace;color:var(--g-muted,#5b6478)}
.lk-bar,.lk-prog{height:8px;border-radius:99px;background:var(--lk-track);overflow:hidden}.lk-bar span,.lk-prog span{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#ffb347,#ffd27a);transition:width .4s ease}
.lk-pill{font:600 12px 'JetBrains Mono',monospace;padding:5px 10px;border-radius:99px;background:var(--g-well,rgba(0,0,0,.06))}
.lk-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;max-width:none;margin:0 0 18px}
.lk-topicbar{flex-direction:row;flex-wrap:wrap;align-items:center;gap:10px 12px;max-width:none;margin:14px 0 4px;padding:12px 14px;border-radius:16px;background:var(--g-surface,rgba(255,255,255,.7));border:1px solid var(--g-edge,rgba(0,0,0,.1))}.lk-tb-text{display:flex;flex-direction:column;min-width:160px}
.lk-ring{flex:none;vertical-align:middle}.oc-ring{float:right;margin:-2px -4px 0 8px}
.lk-line{display:flex;align-items:center;gap:10px;padding:5px 0;font-size:14px}
.lk-badges{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:8px}.lk-bdg{display:flex;flex-direction:column;gap:2px;padding:10px;border-radius:14px;background:var(--g-well,rgba(0,0,0,.05));opacity:.5;filter:grayscale(1)}.lk-bdg.on{opacity:1;filter:none;background:var(--g-active,rgba(255,210,122,.3))}.lk-bdg span{font-size:22px}.lk-bdg b{font-size:13px}.lk-bdg small{font-size:11px;color:var(--g-muted,#5b6478);line-height:1.35}
.lk-sec summary{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;cursor:pointer;font-size:15px}.lk-stack{flex:1 1 160px;display:flex;height:10px;border-radius:99px;overflow:hidden;background:var(--lk-track);gap:2px}.lk-stack i{display:block;height:100%}
.lk-table{width:100%;border-collapse:collapse;font-size:13px;margin-top:8px}.lk-table th{font:600 10.5px 'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.06em;color:var(--g-muted,#5b6478);text-align:left;padding:6px 8px}.lk-table td{padding:6px 8px;border-top:1px solid var(--g-edge,rgba(0,0,0,.1));vertical-align:middle}
.lk-week{display:flex;gap:6px}.lk-week span{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font:700 11px 'JetBrains Mono',monospace;background:var(--lk-track)}.lk-week span.on{background:linear-gradient(135deg,#ffd27a,#ffb347);color:#3a2a10}
.lk-miss{padding:9px 12px;border-radius:12px;background:var(--g-well,rgba(0,0,0,.05));font-size:13.5px;margin-top:6px}.lk-miss summary{cursor:pointer}.lk-miss p{margin:0 0 4px;font-weight:600}
.lk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.lk-tile{display:flex;flex-direction:column;gap:6px;text-align:left;padding:16px;border-radius:18px;background:var(--g-surface,rgba(255,255,255,.7));border:1px solid var(--g-edge,rgba(0,0,0,.1));color:inherit;cursor:pointer;font:13.5px/1.45 'IBM Plex Sans',sans-serif;transition:transform .12s ease}.lk-tile:hover{transform:translateY(-2px)}.lk-tile b{font:600 17px 'Source Serif 4',Georgia,serif}.lk-tile small{font:600 11.5px 'JetBrains Mono',monospace;color:var(--g-muted,#5b6478)}.lk-tile.big{min-height:170px}.lk-ic{font-size:30px}.lk-stars{color:#e0a22b;font-size:18px;letter-spacing:2px}
.lk-k{font:600 11px 'JetBrains Mono',monospace;color:var(--g-muted,#5b6478)}.lk select,.lk input[type=text]{font:600 13px 'IBM Plex Sans',sans-serif;padding:8px 10px;border-radius:10px;border:1px solid var(--g-edge,rgba(0,0,0,.2));background:var(--g-well,rgba(255,255,255,.5));color:inherit;max-width:100%;min-height:40px}.lk kbd{font:600 11px 'JetBrains Mono',monospace;padding:2px 6px;border-radius:6px;border:1px solid var(--g-edge,rgba(0,0,0,.2))}
.lk-pick{margin-top:8px}.lk-pick b{font-size:12.5px}.lk-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:6px}.lk-chip{font:600 12.5px 'IBM Plex Sans',sans-serif;padding:8px 12px;border-radius:99px;border:1px solid var(--g-edge,rgba(0,0,0,.2));background:var(--g-well,rgba(0,0,0,.05));color:inherit;cursor:pointer;min-height:38px}.lk-chip.sel{background:linear-gradient(135deg,#ffd27a,#ffb347);color:#3a2a10;border-color:transparent}.lk-seg{display:flex;flex-wrap:wrap;gap:6px}
.lk-sheet{position:fixed;inset:0;z-index:9000;background:rgba(10,12,24,.62);display:flex;justify-content:center;align-items:flex-start;overflow:auto;padding:max(12px,env(safe-area-inset-top)) 12px 24px;backdrop-filter:blur(6px)}
.lk-sheet-in{width:min(760px,100%);max-width:none;margin:0;background:var(--g-bg,#f3f1fa);border:1px solid var(--g-edge,rgba(0,0,0,.15));border-radius:22px;padding:16px 18px 20px;position:relative;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.35)}.lk-sheet.wide .lk-sheet-in{width:min(1040px,100%)}
.lk-sheet-top{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}.lk-sheet-body{display:flex;flex-direction:column;gap:12px;min-width:0}body.lk-lock{overflow:hidden}
.lk-qz{display:flex;flex-direction:column;gap:12px}.lk-qmeta{display:flex;flex-wrap:wrap;gap:6px 14px;font:600 11.5px 'JetBrains Mono',monospace;color:var(--g-muted,#5b6478)}.lk-q{font:500 18px/1.5 'IBM Plex Sans',sans-serif!important;margin:4px 0!important}
.lk-opts{display:grid;gap:9px}.lk-opts.two{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}.lk-opt{display:flex;gap:12px;align-items:center;text-align:left;padding:12px 14px;border-radius:14px;border:1px solid var(--g-edge,rgba(0,0,0,.18));background:var(--g-surface,rgba(255,255,255,.7));color:inherit;cursor:pointer;font:500 15px/1.4 'IBM Plex Sans',sans-serif;min-height:48px}.lk-opt b{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font:700 12px 'JetBrains Mono',monospace;background:var(--g-well,rgba(0,0,0,.08))}.lk-opt:hover:not(:disabled){filter:brightness(1.06)}.lk-opt:disabled{cursor:default;opacity:.75}.lk-opt.ok{border-color:var(--lk-good);background:rgba(47,158,110,.2);opacity:1}.lk-opt.bad{border-color:var(--lk-bad);background:rgba(208,70,63,.18);opacity:1}
.lk-fb{display:flex;flex-direction:column;gap:8px;align-items:flex-start}.lk-verdict{font-weight:700;font-size:15px}.lk-verdict.ok{color:var(--lk-good)}.lk-verdict.bad{color:var(--lk-bad)}.lk-steps{margin:0;padding-left:18px;font:13px/1.6 'JetBrains Mono',monospace;border-left:3px solid #ffb347}
.lk-result{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:10px 0}.lk-result .lk-row{justify-content:center}.lk-xp{font:700 13px 'JetBrains Mono',monospace!important;color:var(--g-accent,#7962b1)}.lk-note{color:var(--g-muted,#5b6478);font-size:13.5px!important;max-width:64ch}.lk-rev{width:100%;text-align:left}.lk-rev summary{cursor:pointer;font-weight:600;font-size:14px;margin:8px 0}.lk-score{font:700 64px/1 'JetBrains Mono',monospace;color:var(--g-accent,#7962b1)}
.lk-card{display:flex;flex-direction:column;gap:10px;align-items:center;justify-content:center;min-height:220px;padding:22px;border-radius:20px;border:1px solid var(--g-edge,rgba(0,0,0,.18));background:var(--g-surface,rgba(255,255,255,.7));color:inherit;cursor:pointer;text-align:center;width:100%}.lk-card-k{font:600 11.5px 'JetBrains Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--g-muted,#5b6478)}.lk-card-f{font:600 26px/1.25 'Source Serif 4',Georgia,serif}.lk-card-b{font:500 17px/1.55 'IBM Plex Sans',sans-serif}.lk-card-hint{font-size:12px;color:var(--g-muted,#5b6478)}.lk-card.back{background:var(--g-active,rgba(255,210,122,.3));cursor:default}
.lk-clock{display:flex;flex-wrap:wrap;gap:8px 18px;font:600 14px 'JetBrains Mono',monospace;align-items:center}.lk-time{font-size:22px;font-weight:700}.lk-time.low{color:var(--lk-bad)}
.lk-bins{display:grid;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));gap:10px}.lk-bin{min-height:150px;padding:12px;border-radius:16px;border:2px dashed var(--g-edge,rgba(0,0,0,.3));background:var(--g-well,rgba(0,0,0,.04));color:inherit;cursor:pointer;display:flex;flex-direction:column;gap:8px;text-align:left;font:inherit}.lk-bin b{font:600 14px 'Source Serif 4',Georgia,serif}.lk-bin span{display:flex;flex-wrap:wrap;gap:5px}.lk-bin i{font:normal 600 12px 'IBM Plex Sans',sans-serif;padding:4px 8px;border-radius:99px;background:rgba(47,158,110,.22)}.lk-bin.no,.lk-mark.no{animation:lk-shake .4s}
.lk-goal{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;padding:12px 14px;border-radius:14px;background:var(--g-active,rgba(255,210,122,.3));font-size:14.5px}.lk-goal.won{background:rgba(47,158,110,.25)}.lk-live{font:600 12px 'JetBrains Mono',monospace}.lk-hint{font-size:13.5px}.lk-hint summary{cursor:pointer;font-weight:600}
.lk-sim{min-width:0}.lk-partwrap{position:relative}.lk-ask{font-size:17px;padding:10px 14px;border-radius:14px;background:var(--g-surface,rgba(255,255,255,.7));border:1px solid var(--g-edge,rgba(0,0,0,.12))}
.lk-marks{position:absolute;inset:0;pointer-events:none;z-index:6}.lk-mark{position:absolute;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;border:2px solid #fff;background:#12203b;color:#fff;font:700 14px 'JetBrains Mono',monospace;cursor:pointer;pointer-events:auto;box-shadow:0 2px 8px rgba(0,0,0,.45);padding:0}.lk-mark.ok{background:var(--lk-good,#2f9e6e)}.lk-mark.no{background:#d0463f}
.lk-cert{width:100%;height:auto;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.25)}
.lk-paper{background:#fff;color:#111;padding:28px 32px;border-radius:8px;font:13.5px/1.55 'IBM Plex Sans',Arial,sans-serif}.lk-paper h1{font:700 22px/1.25 Georgia,serif;margin:0 0 6px;color:#111}.lk-paper h2{font:700 15px Georgia,serif;margin:16px 0 6px;color:#111}.lk-paper h3{font:700 13.5px Georgia,serif;margin:10px 0 4px;color:#111}.lk-paper p{font-size:13.5px;color:#111}.lk-pr-meta{color:#333!important}.lk-pr-q li{margin-bottom:10px;break-inside:avoid}.lk-pr-q p{margin:0 0 4px}.lk-pr-o{display:grid;grid-template-columns:1fr 1fr;gap:2px 18px}.lk-pr-t{width:100%;border-collapse:collapse;font-size:12.5px}.lk-pr-t td,.lk-pr-t th{border:1px solid #999;padding:4px 7px;text-align:left;vertical-align:top}.lk-pr-line{display:block;border-bottom:1px solid #999;height:22px}.lk-pr-note{font-size:12px!important;color:#444!important}.lk-pr-foot{margin-top:18px;font-size:11px;color:#666;border-top:1px solid #ccc;padding-top:6px}.lk-pr-break{break-before:page;height:18px}
#lk-toast{position:fixed;left:50%;bottom:22px;transform:translate(-50%,30px);z-index:9500;max-width:min(92vw,520px);padding:12px 18px;border-radius:14px;background:#12203b;color:#fff;font:600 14px 'IBM Plex Sans',sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:all .25s ease}#lk-toast.on{opacity:1;transform:translate(-50%,0)}
.lk-confetti{position:absolute;inset:0;pointer-events:none;overflow:hidden}.lk-confetti i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;animation:lk-fall linear forwards}
@keyframes lk-fall{to{transform:translateY(110vh) rotate(540deg);opacity:.2}}@keyframes lk-shake{25%{transform:translate(calc(-50% - 5px),-50%)}75%{transform:translate(calc(-50% + 5px),-50%)}}.lk-bin.no{animation-name:lk-shake2}@keyframes lk-shake2{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.lk-tick .tick-glyph{font-size:15px}.lk-tick .tick-count{display:block}#lk-tt{flex:1 1 220px;min-width:0}
body.lk-present .rail,body.lk-present .topbar,body.lk-present #glass-navigation,body.lk-present .glass-shell-nav,body.lk-present .back-link,body.lk-present .lk-topicbar,body.lk-present .lk-strip{display:none!important}body.lk-present .app{grid-template-columns:1fr!important}body.lk-present .content{max-width:none!important;padding:18px 3vw!important;font-size:118%}body.lk-present .topic-head h1{font-size:clamp(34px,5vw,56px)}body.lk-present .content-list,body.lk-present .note-box,body.lk-present .item-title{font-size:120%}body.lk-present,body.lk-present *{cursor:none!important}
#lk-laser{position:fixed;left:-9px;top:-9px;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle,#fff 0 18%,#ff2d2d 30% 55%,rgba(255,45,45,0) 72%);box-shadow:0 0 18px 6px rgba(255,45,45,.55);z-index:9800;pointer-events:none;display:none}body.lk-present #lk-laser{display:block}#lk-exit{position:fixed;right:14px;top:14px;z-index:9700;display:none;font:600 12px 'IBM Plex Sans',sans-serif;padding:8px 12px;border-radius:10px;border:0;background:rgba(18,32,59,.85);color:#fff;cursor:pointer!important;opacity:.35}#lk-exit:hover,#lk-exit:focus{opacity:1}body.lk-present #lk-exit{display:block}
@media (max-width:640px){.lk-sheet{padding:0}.lk-sheet-in{border-radius:0;min-height:100%;padding:14px}.lk-q{font-size:16.5px!important}.lk-bins{grid-template-columns:1fr 1fr}.lk-table th:nth-child(5),.lk-table td:nth-child(5),.lk-table th:nth-child(6),.lk-table td:nth-child(6){display:none}.lk-pr-o{grid-template-columns:1fr}.lk-paper{padding:16px}.lk-mark{width:30px;height:30px;font-size:12px}}
@media (prefers-reduced-motion:reduce){.lk *,#lk-toast{transition:none!important;animation:none!important}}
@media print{body.lk-lock>*:not(.lk-sheet){display:none!important}.lk-sheet{position:static;background:none;padding:0;overflow:visible;backdrop-filter:none}.lk-sheet-in{border:0;box-shadow:none;width:100%!important;padding:0;background:#fff}.lk-sheet-top,#lk-toast{display:none!important}.lk-paper{padding:0;border-radius:0}body.lk-lock{overflow:visible;background:#fff!important}}`;

  /* ================= start ================= */
  LK.init = (cfg) => {
    CFG = cfg; load();
    if (!$("#lk-css")) { const st = document.createElement("style"); st.id = "lk-css"; st.textContent = css; document.head.appendChild(st); }
    if (cfg.manifest && !$("link[rel=manifest]")) { const l = document.createElement("link"); l.rel = "manifest"; l.href = cfg.manifest; document.head.appendChild(l); }
    if (cfg.sw && "serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.getRegistration().then((r) => { if (r) navigator.serviceWorker.register(cfg.sw || "/sw.js").catch(() => {}); }).catch(() => {});
    return LK;
  };
  LK.state = () => ST; LK.cfg = () => CFG; LK.level = level; LK.best = best; LK._ = { topicQs, dailyQs, cards, bankQs };
})();

/* a-learn.js — Agricultural Science content for the learning layer (learn-kit.js):
   a five-question check for every syllabus topic, the link from each topic to the exam-bank themes,
   sorting sets, lab challenges tied to real simulations, and the models for Find the part.
   Each bank row is "question | answer | wrong | wrong | wrong | optional note". */
(function () {
  "use strict";
  const LK = window.LK, SECT = window.AGRIC; if (!LK || !SECT) return;

  const BANK = {
    A1: ["Agriculture is best defined as the|cultivation of crops and rearing of animals for man's use|growing of food crops only|rearing of cattle, sheep and goats only|buying and selling of farm produce",
      "The branch of agriculture that studies soil formation, fertility and management is|soil science|crop science|agricultural extension|agricultural economics",
      "Which of these is a raw material that agriculture supplies to the textile industry?|Cotton lint|Cocoa beans|Palm kernel|Rubber latex",
      "Foreign exchange is earned from agriculture mainly through|export of cash crops|import of farm machinery|subsistence farming|local sale of vegetables",
      "The branch of agriculture that takes new findings from research stations to farmers is|agricultural extension|animal science|forestry|agricultural engineering"],
    A2: ["Which of these is a problem of agricultural development in West Africa?|Inadequate storage and processing facilities|Too many extension agents|Excess farm credit|Surplus of improved seeds",
      "Land fragmentation is mainly caused by the|inheritance system of land tenure|use of tractors|leasehold system|planting of tree crops",
      "Poor feeder roads affect farmers mostly by|making it hard to move produce to markets|increasing rainfall|lowering soil fertility|reducing pest attack",
      "One solution to the problem of inadequate finance for farmers is|provision of loans at low interest rates|raising taxes on farm tools|closing rural banks|banning cooperative societies",
      "High post-harvest losses can best be reduced by|providing good storage and processing facilities|planting later in the season|using more land|removing extension services"],
    A3: ["A farmer who produces mainly to feed the family practises|subsistence agriculture|commercial agriculture|plantation agriculture|ranching",
      "Which of these is a feature of commercial agriculture?|Large capital investment and use of machines|Use of family labour only|Small, scattered plots|Little or no surplus for sale",
      "Subsistence farmers mostly depend on|simple tools such as hoes and cutlasses|combine harvesters|hired specialists|irrigation by centre pivot",
      "Specialisation and keeping of farm records are most common in|commercial agriculture|subsistence agriculture|shifting cultivation|nomadic herding",
      "A problem common to subsistence agriculture is|low yield and low income|over-use of machinery|too much capital|difficulty of selling large surpluses overseas"],
    A4: ["A subsidy on fertilizer means that government|pays part of the cost so farmers buy it cheaper|bans the import of fertilizer|sells fertilizer above the market price|taxes farmers who use fertilizer",
      "Government helps farmers obtain improved seeds and seedlings mainly through|research institutes and seed multiplication units|customs offices|commercial courts|the police service",
      "Which of these is a role of government in agricultural development?|Provision of extension services|Selling farmers' land to industries|Fixing family size for farmers|Stopping the export of all crops",
      "Quarantine services are provided by government to|prevent the entry and spread of pests and diseases|increase the price of imported crops|train tractor drivers|measure farmland",
      "River basin development authorities were set up mainly to|provide irrigation and develop water resources for farming|fix the prices of export crops|run agricultural universities|distribute farm tools free of charge"],
    A5: ["An NGO is best described as|a non-profit organisation that is independent of government|a government ministry|a commercial bank|a farmers' trade union owned by the state",
      "Which of these is an international organisation that supports agriculture?|Food and Agriculture Organization (FAO)|World Trade Court|Central Bank|National Assembly",
      "NGOs help farmers mainly by providing|training, inputs and small loans|land title certificates|import licences|court judgments",
      "The research institute known for work on cassava, yam and maize in the tropics is|IITA|WHO|UNESCO|OPEC",
      "One way NGOs complement government effort in agriculture is by|reaching rural farmers with extension and technical help|collecting farm taxes|making agricultural laws|controlling the national budget"],
    A7: ["Land tenure refers to|the system of land ownership and use|the fertility level of land|the slope of the land|the method of ploughing land",
      "Under the communal land tenure system, land belongs to|the whole community|one individual|the bank|foreign companies",
      "The Land Use Decree (Act) of 1978 in Nigeria vested all land in each state in the|governor of the state|traditional ruler|local farmer|federal minister of agriculture",
      "A disadvantage of land tenure by inheritance is that it|leads to fragmentation of land|encourages large-scale mechanisation|prevents family quarrels|makes land free for everyone",
      "In the leasehold system, a farmer|pays rent to use land for a fixed period|owns the land forever|is given land as a gift|pledges land for a loan"],
    B1: ["Ecology is the study of|living organisms in relation to their environment|rocks and minerals|farm accounts|weather forecasting only",
      "A farm pond with its fish, plants and micro-organisms is an example of|an ecosystem|a biome only|a population|a habitat without organisms",
      "Which of these is a biotic component of a farm ecosystem?|Earthworms|Rainfall|Temperature|Soil pH",
      "Green plants in an ecosystem are called|producers|primary consumers|decomposers|secondary consumers",
      "In a mixed crop farm, the relationship between maize and weeds is best described as|competition|mutualism|parasitism|commensalism"],
    B2: ["Which of these is an agricultural use of land?|Livestock production|Road construction|Mining|Housing estates",
      "Land used for forestry provides mainly|timber and fuel wood|grain crops|fish|eggs",
      "The planned use of land so that each piece is put to its best use is called|land use planning|land tenure|land reclamation|land fragmentation",
      "Which of these is a non-agricultural use of land?|Building of factories|Fish farming|Growing of pasture|Wildlife ranching",
      "Land set aside to protect wild animals and plants is a|game reserve|fish pond|grazing paddock|plantation"],
    B3: ["Which of these reduces the land available for farming?|Increase in population and settlement|Use of fertilizers|Crop rotation|Planting of cover crops",
      "A physical factor that limits the use of land for agriculture is|steep, rocky topography|the price of crops|the land tenure system|religious belief",
      "Soil erosion affects land availability by|removing the fertile topsoil|adding plant nutrients|raising the water table|increasing soil organisms",
      "Which of these is a socio-economic factor affecting land availability?|Land tenure system|Rainfall|Soil type|Slope",
      "Land lost to oil spillage can be brought back into use by|land reclamation|bush burning|over-grazing|continuous cropping"],
    B4: ["Agro-allied (agro-based) industries are industries that|use agricultural produce as raw materials|make farm laws|produce crude oil|train extension workers",
      "The raw material for the tyre industry is|rubber latex|cotton lint|cocoa beans|palm kernel",
      "Which industry depends on hides and skins?|Leather industry|Textile industry|Paper industry|Sugar industry",
      "Agriculture benefits from industry through the supply of|fertilizers, machinery and agro-chemicals|rainfall and sunshine|land and labour|seeds from the wild",
      "The raw material used by breweries is|barley, sorghum or maize grains|cocoa beans|oil palm fruits|cotton seeds"],
    B5: ["Which of these is a climatic factor affecting agricultural production?|Rainfall|Soil texture|Pests|Soil pH",
      "Edaphic factors are those concerned with the|soil|weather|living organisms|market",
      "The most important factor that determines the distribution of crops in West Africa is|rainfall|wind|soil colour|altitude only",
      "Photoperiodism is the response of plants to|length of day|soil moisture|wind direction|soil acidity",
      "Which of these is a biotic factor affecting crop production?|Pests and diseases|Relative humidity|Temperature|Soil structure"],
    B6: ["Rocks formed from the cooling and solidification of molten magma are|igneous rocks|sedimentary rocks|metamorphic rocks|organic rocks",
      "Which of these is a sedimentary rock?|Limestone|Granite|Marble|Basalt",
      "Marble is a metamorphic rock formed from|limestone|granite|sandstone|shale",
      "Rocks that have been changed by heat and pressure are called|metamorphic rocks|igneous rocks|sedimentary rocks|volcanic rocks",
      "Which of these is an igneous rock?|Granite|Slate|Shale|Sandstone"],
    B7: ["The breaking down of rocks into smaller particles to form soil is called|weathering|leaching|erosion|sedimentation",
      "Which of these is an agent of physical weathering?|Temperature changes|Carbonation|Oxidation|Hydrolysis",
      "The layer of a soil profile that is richest in humus is the|A horizon (topsoil)|B horizon (subsoil)|C horizon|bedrock",
      "The five factors of soil formation are climate, parent material, topography, time and|living organisms|fertilizer|irrigation|bush burning",
      "A vertical section through the soil showing its layers is a|soil profile|soil catena|soil texture|soil structure"],
    B8: ["The soil with the highest water-holding capacity is|clay|sand|loam|gravel",
      "The best soil for most crops is|loam|sand|clay|laterite",
      "Soil texture refers to the|relative proportions of sand, silt and clay|arrangement of soil particles into aggregates|colour of the soil|amount of water in the soil",
      "A soil with a pH of 5 is|acidic|neutral|alkaline|saline",
      "The material commonly used to correct soil acidity is|lime|urea|ammonium sulphate|common salt"],
    B9: ["Which of these is a macro-nutrient?|Nitrogen|Zinc|Boron|Copper",
      "Yellowing of leaves (chlorosis) and stunted growth are deficiency symptoms of|nitrogen|potassium|calcium|molybdenum",
      "The conversion of ammonia to nitrates by soil bacteria is called|nitrification|denitrification|ammonification|nitrogen fixation",
      "Bacteria that fix nitrogen in the root nodules of legumes are|Rhizobium|Nitrobacter|Azotobacter|Nitrosomonas",
      "The nutrient needed most for root development and ripening of fruits is|phosphorus|nitrogen|iron|manganese"],
    B10: ["Irrigation is the|artificial application of water to land for crop growth|removal of excess water from land|natural fall of rain on crops|spraying of chemicals on crops",
      "The irrigation method that delivers water directly to the root zone and wastes the least water is|drip irrigation|flood irrigation|furrow irrigation|basin irrigation",
      "Which of these is a problem associated with irrigation?|Build-up of salts in the soil|Shortage of sunshine|Low soil temperature|Excess wind",
      "Sprinkler irrigation is an example of|overhead irrigation|surface irrigation|sub-surface irrigation|drainage",
      "Irrigation allows farmers to|grow crops in the dry season|stop weeding|avoid the use of fertilizer|prevent all crop diseases"],
    B11: ["Drainage is the|removal of excess water from the soil|addition of water to the soil|addition of lime to the soil|removal of stones from the soil",
      "A waterlogged soil is poor for most crops because it lacks|air for root respiration|mineral particles|water|clay",
      "Which of these is a surface drainage system?|Open channels (ditches)|Tile drains|Mole drains|Perforated pipes",
      "One benefit of draining a waterlogged soil is that it|improves soil aeration|increases leaching of salts into crops|lowers soil temperature|encourages denitrification",
      "A disadvantage of open-ditch drainage is that the ditches|take up land and hinder machines|cannot remove water|are buried and hard to find|make the soil alkaline"],
    B12: ["Agricultural pollution is the|release of harmful farm substances into the environment|loss of soil by erosion|planting of one crop every year|removal of forest for farming",
      "Excess nitrate fertilizer washed into streams causes|rapid growth of algae and death of fish|an increase in dissolved oxygen|clearer water|more fish food for ever",
      "Which of these is a source of agricultural pollution?|Careless use of pesticides|Crop rotation|Mulching|Contour ploughing",
      "Pollution from farms can be reduced by|applying agro-chemicals at the recommended rate|burning all crop residues|washing sprayers in streams|dumping dung into rivers",
      "Oil spillage affects farmland mainly by|killing soil organisms and crops|adding plant nutrients|improving soil structure|raising soil pH to neutral"],
    C1: ["The simple farm tool used for making holes for transplanting seedlings is the|hand trowel|rake|sickle|axe",
      "A cutlass is used mainly for|clearing bush and harvesting|making ridges|spraying chemicals|carrying loads",
      "The tool used for harvesting rice and other cereals is the|sickle|spade|garden fork|mattock",
      "Which tool is used for levelling seedbeds and gathering rubbish?|Rake|Hoe|Shovel|Pickaxe",
      "A watering can is fitted with a rose so that it|breaks the water into fine drops|holds more water|is easier to carry|measures the water"],
    C2: ["The farm machine that cuts, threshes and cleans grain in one operation is the|combine harvester|planter|ridger|sheller",
      "Which of these is a tractor-coupled implement for primary tillage?|Disc plough|Harrow|Planter|Sprayer",
      "The part of a tractor that drives implements such as the sprayer pump is the|power take-off (PTO) shaft|drawbar|radiator|steering wheel",
      "A harrow is used to|break soil clods and level ploughed land|turn over the soil for the first time|plant seeds|harvest tubers",
      "The machine used for hatching eggs artificially is the|incubator|milking machine|sheller|dryer"],
    C3: ["A daily maintenance check on a tractor is to|check the oil, water and fuel levels|overhaul the engine|replace all the tyres|repaint the body",
      "Farm tools with metal parts should be stored after cleaning and|oiling or greasing|soaking in water|covering with soil|painting with lime",
      "Wooden handles of tools are protected from termites by|keeping them off the ground in a dry store|burying them|leaving them in the field|washing them with salt water",
      "Which of these is a precaution when using farm machinery?|Do not wear loose clothing near moving parts|Refuel while the engine is running|Remove safety guards for speed|Allow children to ride on the drawbar",
      "Slack bolts and nuts on implements should be|tightened before use|removed|greased and left loose|welded together"],
    C4: ["Agricultural mechanisation is the|use of machines to carry out farm operations|use of fertilizers on crops|rearing of improved animals|sale of crops by cooperatives",
      "An advantage of mechanisation is that it|saves time and reduces drudgery|creates more manual jobs|needs no capital|works well on small scattered plots",
      "A disadvantage of farm mechanisation is|displacement of farm labour|increase in drudgery|lower output per worker|slower farm operations",
      "Which factor limits mechanisation in West Africa?|Small and fragmented farm holdings|Too many spare parts|Excess technical know-how|Flat, stone-free land everywhere",
      "Heavy machines used continuously on wet soil may cause|soil compaction|higher soil porosity|better drainage|more soil organisms"],
    C5: ["The prospects of mechanisation can be improved by|setting up tractor hiring units|increasing land fragmentation|closing engineering schools|banning cooperative farming",
      "Farmers can afford machines more easily through|cooperative societies and credit|working alone on small plots|subsistence production|selling their land",
      "Local manufacture of simple machines helps mechanisation because it|makes machines and spare parts cheaper and available|increases import duties|reduces the need for training|uses more foreign exchange",
      "Land consolidation helps mechanisation by|joining small plots into larger fields|dividing land among heirs|reducing land area|increasing the number of boundaries",
      "Training of operators and mechanics improves mechanisation because it|reduces breakdowns and misuse of machines|raises the price of machines|replaces the need for fuel|shortens the life of machines"],
    C6: ["Which source of farm power is used most by peasant farmers in West Africa?|Human power|Mechanical power|Electrical power|Solar power",
      "Animals commonly used for draught in West Africa are|bulls (oxen) and donkeys|goats and sheep|pigs and rabbits|turkeys and ducks",
      "A disadvantage of human power is that it|is slow and gives low output|needs fuel|causes air pollution|needs spare parts",
      "Biogas as a source of farm power is produced from|animal dung and plant wastes|crude oil|running water|wind",
      "An advantage of mechanical power over animal power is that it|does more work in less time|needs no maintenance|is cheaper to buy|needs no skill"],
    C7: ["Farm surveying is the|measurement and mapping of farmland|planting of crops in rows|counting of farm animals|testing of soil fertility",
      "The instrument used to measure horizontal angles in surveying is the|theodolite|ranging pole|gunter's chain|arrow",
      "Ranging poles are used in surveying to|mark stations and keep survey lines straight|measure angles|measure slope|record distances on paper",
      "One hectare is equal to|10 000 m²|1 000 m²|100 m²|100 000 m²",
      "A gunter's chain or measuring tape is used to measure|distances|bearings|heights|angles"],
    C8: ["Farm planning involves deciding|what to produce, how and where on the farm|only the price of produce|the weather for the year|the number of extension agents",
      "A good farm plan helps the farmer to|use land, labour and capital efficiently|avoid keeping records|stop rotating crops|increase waste",
      "Before planning a farm, the farmer should first carry out a|survey of the land and soil|sale of the produce|harvest of the crops|vaccination of animals",
      "In laying out a farm, crops are best sited on|fertile, well-drained land|rocky hill tops|waterlogged areas|land next to the refuse dump",
      "A farm budget is a statement of the|expected income and expenditure of the farm|soil types on the farm|animals that died|rainfall for the year"],
    C9: ["A farmstead is the|area holding the farmhouse, stores and animal buildings|land under crops|land left to fallow|boundary of the farm",
      "Animal houses should be sited so that the prevailing wind blows|away from the living house|towards the living house|into the feed store|across the well",
      "The farm store should be located|close to the farmhouse and an access road|at the far end of the farm|inside the piggery|in a swamp",
      "A site for a farmstead should be|well drained and close to water supply|low-lying and waterlogged|far from any road|on very steep land",
      "Buildings in a farmstead are arranged to|reduce walking distance and save labour|use as much land as possible|hide them from visitors|keep stores far from the fields"],
    D1: ["Crops that complete their life cycle in one growing season are|annual crops|biennial crops|perennial crops|permanent crops",
      "Which of these is a cereal crop?|Millet|Cowpea|Cassava|Cotton",
      "Cocoa, coffee and tea are classified as|beverage crops|fibre crops|oil crops|spice crops",
      "Which of these is a perennial crop?|Oil palm|Maize|Tomato|Cowpea",
      "Cowpea and soya bean are classified as|pulses (grain legumes)|cereals|roots and tubers|fibre crops"],
    D2: ["Maize is propagated by|seeds|stem cuttings|suckers|setts",
      "Cassava is planted using|stem cuttings|seeds|bulbs|rhizomes",
      "Yam is propagated mainly by|setts or seed yams|stem cuttings|suckers|grains",
      "The recommended spacing for maize is about|75 cm × 25 cm|10 cm × 10 cm|3 m × 3 m|9 m × 9 m",
      "Fermentation and drying are processing steps for|cocoa beans|maize grains|yam tubers|cotton lint"],
    D3: ["A pasture is|an area of land carrying forage plants for grazing animals|a store for animal feed|a pen for fattening animals|a pond for watering animals",
      "Which of these is a pasture grass?|Guinea grass (Panicum maximum)|Centro (Centrosema pubescens)|Stylo (Stylosanthes)|Calopo (Calopogonium)",
      "Forage legumes are valued in pasture mainly because they|add nitrogen and supply protein|resist all pests|need no rainfall|grow taller than trees",
      "Grass cut and dried for feeding animals later is called|hay|silage|soilage|straw",
      "Forage preserved in a succulent state by fermentation in a pit is|silage|hay|concentrate|mash"],
    D4: ["The bringing of improved crop varieties from another place is called|introduction|selection|hybridisation|mutation",
      "Crossing two genetically different plants to combine their good qualities is|hybridisation|mass selection|introduction|vegetative propagation",
      "Hybrid vigour (heterosis) means that the offspring|perform better than both parents|are weaker than both parents|are identical to one parent|cannot produce seeds",
      "Which of these is an aim of crop improvement?|Higher yield and resistance to disease|Longer time to maturity|Lower nutritive value|Greater lodging",
      "Picking the best plants in a field to provide seed for the next season is|selection|introduction|hybridisation|quarantine"],
    E1: ["Forestry is the|management of forests and their resources|rearing of fish|growing of vegetables|keeping of bees",
      "The planting of trees on land that has never carried forest is|afforestation|deforestation|regeneration|selective felling",
      "Which of these is a forest product?|Timber|Cotton lint|Hides|Latex paint",
      "The continuous cutting of trees without replacing them is|deforestation|afforestation|taungya|pruning",
      "Forest regulations forbid|felling trees without a permit|planting seedlings|making fire traces|selective logging with a licence"],
    E2: ["Agro-forestry is the growing of|trees together with crops and/or animals on the same land|trees only|pasture only|ornamental plants only",
      "The system in which farmers grow food crops among young forest trees is|taungya|ranching|monoculture|ley farming",
      "Planting crops in the lanes between rows of fast-growing leguminous trees is|alley cropping|strip grazing|shifting cultivation|bush fallowing",
      "A benefit of agro-forestry is that it|improves soil fertility and reduces erosion|lowers the total output of land|removes all shade|stops rainfall",
      "A tree commonly used in alley cropping is|Leucaena leucocephala|Elaeis guineensis|Hevea brasiliensis|Theobroma cacao"],
    F1: ["Ornamental plants are grown mainly for|beauty and decoration|grain|fibre|timber",
      "The branch of horticulture that deals with flowers and ornamental plants is|floriculture|pomology|olericulture|silviculture",
      "Ornamental plants are important because they|beautify the surroundings and provide shade|supply staple food|fix carbon in rocks|increase soil erosion",
      "Planting ornamental plants to improve the look of a compound is called|landscaping|afforestation|mulching|staking",
      "Which of these is a commercial benefit of ornamental plants?|Income from the sale of cut flowers|Supply of animal feed|Production of bush meat|Supply of fertilizer"],
    F2: ["Which of these is an ornamental flowering shrub?|Hibiscus|Maize|Okro|Cowpea",
      "A plant commonly used as a hedge is|Ixora|Yam|Cocoa|Rice",
      "Which of these is used as a lawn grass?|Carpet grass|Elephant grass|Guinea corn|Sugar cane",
      "Royal palm and whistling pine are examples of|ornamental trees|lawn grasses|hedge plants|bedding plants",
      "Plants grown in pots for indoor decoration are called|potted plants|cover crops|forage crops|plantation crops"],
    F3: ["Hedge plants are located|along boundaries and edges|in the middle of lawns|inside ponds|on rooftops only",
      "Lawns are best established on|open, level ground in front of buildings|steep rocky slopes|waterlogged hollows|heavily shaded forest floor",
      "Avenue trees are planted|along both sides of a road or drive|inside the house|in flower pots|in fish ponds",
      "Bedding plants are usually grown|in flower beds|as boundary trees|on walls only|in water",
      "Shade trees in a compound are sited to|provide shade for sitting and parking areas|block all doorways|cover the well|shade the lawn completely"],
    F4: ["Ornamental plants are commonly propagated by seeds and by|stem cuttings|tissue from leaves only|root hairs|pollen",
      "Hibiscus is easily propagated by|stem cuttings|seeds only|bulbs|tubers",
      "Raising seedlings in a nursery before planting out is necessary because it|gives young plants care and protection|slows down growth|increases pest attack|wastes seeds",
      "Budding and grafting are methods of|vegetative propagation|sexual propagation|irrigation|weed control",
      "Lawn grasses are commonly established by|planting runners or sods|grafting|budding|layering only"],
    F5: ["Cutting back the branches of ornamental plants to keep a desired shape is|pruning|mulching|staking|thinning",
      "Lawns are maintained by regular|mowing|ploughing|ridging|harrowing",
      "Watering of ornamental plants is best done|early in the morning or in the evening|at noon|only once a month|only during rain",
      "Hedges are kept neat by|trimming with shears|burning|flooding|grazing cattle on them",
      "Mulching around ornamental plants helps to|conserve soil moisture and suppress weeds|increase evaporation|encourage erosion|attract termites to roots"],
    G1: ["A plant disease is|a departure from the normal healthy state of a plant|an insect that eats leaves|a plant growing where it is not wanted|a shortage of rainfall",
      "Cassava mosaic disease is caused by a|virus|fungus|bacterium|nematode",
      "Black pod disease of cocoa is caused by a|fungus|virus|bacterium|protozoon",
      "Groundnut rosette disease is transmitted by|aphids|wind|rain splash|grasshoppers",
      "Which of these is a cultural method of controlling crop diseases?|Crop rotation|Spraying fungicide|Using predators|Seed dressing with chemicals"],
    G2: ["A crop pest is|an organism that causes damage to crops|a fungus that causes disease|any plant growing on a farm|a soil nutrient",
      "Which insect pest has piercing and sucking mouthparts?|Aphid|Grasshopper|Yam beetle|Termite",
      "Stem borers damage maize by|boring into and feeding inside the stem|sucking sap from leaves|eating the roots only|spreading viruses only",
      "The use of natural enemies to control pests is|biological control|chemical control|cultural control|physical control",
      "Which of these is a storage pest of maize?|Weevil (Sitophilus)|Cotton stainer|Variegated grasshopper|Mealybug"],
    G3: ["A weed is|a plant growing where it is not wanted|any grass|a poisonous plant only|a crop planted late",
      "Weeds reduce crop yield mainly by|competing for nutrients, water, light and space|adding nitrogen to the soil|increasing soil moisture|shading out pests",
      "Which of these is a parasitic weed of cereals?|Striga (witchweed)|Tridax|Sida|Imperata",
      "A herbicide that kills only certain plants and leaves the crop unharmed is|selective|non-selective|contact only|systemic only",
      "Spear grass (Imperata cylindrica) is hard to control because it spreads by|underground rhizomes|wind-borne spores|bulbs|tubers"],
    H1: ["Which of these is a ruminant?|Goat|Pig|Rabbit|Chicken",
      "Animals kept mainly for carrying loads and pulling implements are|work (draught) animals|dairy animals|poultry|pets",
      "Which of these is a non-ruminant (monogastric) animal?|Pig|Cattle|Sheep|Goat",
      "Which breed of cattle is resistant to trypanosomiasis?|N'Dama|White Fulani|Sokoto Gudali|Red Bororo",
      "Poultry includes|chickens, turkeys, ducks and guinea fowl|rabbits and guinea pigs|goats and sheep|pigs and cattle"],
    H2: ["The true stomach of a ruminant, where gastric juice is secreted, is the|abomasum|rumen|reticulum|omasum",
      "The largest compartment of the ruminant stomach, where microbes ferment fibre, is the|rumen|omasum|abomasum|reticulum",
      "In poultry, the organ that grinds feed with the help of grit is the|gizzard|crop|proventriculus|caecum",
      "Absorption of digested food in farm animals takes place mainly in the|small intestine|rumen|mouth|large intestine",
      "The organ that pumps blood round the body of a farm animal is the|heart|lung|liver|kidney"],
    H3: ["The gestation period of a cow is about|283 days|114 days|150 days|31 days",
      "The gestation period of a sow is about|114 days|283 days|150 days|21 days",
      "The period during which a female animal is receptive to the male is called|oestrus (heat)|gestation|parturition|lactation",
      "The act of giving birth in pigs is called|farrowing|kidding|lambing|calving",
      "The incubation period of a chicken egg is|21 days|28 days|35 days|14 days"],
    H4: ["High environmental temperature causes farm animals to|eat less feed and drink more water|eat more feed|grow faster|lay more eggs",
      "Heat stress in poultry can be reduced by|good ventilation and cool drinking water|overcrowding the pen|closing all windows|feeding more at noon",
      "Day length (light) affects poultry mainly by influencing|egg production|feather colour|beak size|shell colour",
      "High relative humidity in animal houses encourages|the spread of diseases and parasites|faster growth|higher feed intake|better hatchability",
      "Animals lose body heat in hot weather mainly by|sweating and panting|shivering|eating more|huddling together"],
    H5: ["The system in which animals are kept indoors all the time and all their needs are provided is|intensive|extensive|semi-intensive|nomadic",
      "In the extensive system of management, animals|roam and fend for themselves|are kept in battery cages|are confined in pens|are fed only concentrates",
      "The first milk produced by a mother after giving birth is called|colostrum|whey|skimmed milk|butterfat",
      "Colostrum is important to the newborn because it|contains antibodies that give immunity|fills the stomach only|tastes sweet|contains no nutrients",
      "The removal of horn buds from young animals is|dehorning (disbudding)|castration|docking|culling"],
    H6: ["The class of food that supplies most of the energy in animal feeds is|carbohydrates|vitamins|minerals|water",
      "Which of these is a protein concentrate?|Groundnut cake|Maize grain|Cassava peel|Hay",
      "A ration given to an animal to keep its weight constant, with no production, is a|maintenance ration|production ration|balanced ration|starter ration",
      "Which of these is a roughage?|Hay|Fish meal|Soya bean meal|Bone meal",
      "Deficiency of calcium and phosphorus in young animals causes|rickets|anaemia|night blindness|goitre"],
    H7: ["A rangeland is|an extensive area of natural vegetation used for grazing|a fenced paddock of planted grass|a feed store|a cattle market",
      "Grazing animals on one paddock after another in turn is|rotational grazing|continuous grazing|zero grazing|strip cropping",
      "Overgrazing of a pasture leads to|soil erosion and loss of good grasses|better regrowth|higher soil fertility|more legumes",
      "Cutting forage and taking it to animals kept in pens is|zero grazing (soilage)|rotational grazing|paddocking|deferred grazing",
      "Rangeland can be improved by|reseeding with good grasses and legumes|annual uncontrolled burning|overstocking|removing all water points"],
    H8: ["The mating of closely related animals is|inbreeding|crossbreeding|outbreeding|upgrading",
      "Mating animals of two different breeds is|crossbreeding|inbreeding|line breeding|selection",
      "Artificial insemination is the|introduction of semen into the female by means other than natural mating|use of hormones to fatten animals|hatching of eggs in an incubator|selection of animals by weight",
      "An advantage of artificial insemination is that|one good sire can serve very many females|no skill is needed|it needs no equipment|heat detection is unnecessary",
      "An aim of animal improvement is to|increase growth rate and yield of products|increase the age at maturity|reduce disease resistance|lower feed efficiency"],
    H9: ["Newcastle disease of poultry is caused by a|virus|bacterium|protozoon|fungus",
      "Trypanosomiasis in cattle is transmitted by the|tsetse fly|tick|mosquito|housefly",
      "Coccidiosis in poultry is caused by a|protozoon|virus|bacterium|worm",
      "Which of these is an ectoparasite of farm animals?|Tick|Tapeworm|Liver fluke|Roundworm",
      "The best way to prevent viral diseases in livestock is by|vaccination|use of antibiotics|deworming|dipping only"],
    H10: ["Aquaculture is the|rearing of fish and other aquatic organisms in a controlled environment|catching of fish from the sea|keeping of bees|processing of fish only",
      "Which fish is commonly cultured in ponds in West Africa?|Tilapia|Shark|Tuna|Mackerel",
      "Young fish used for stocking ponds are called|fingerlings|brood stock|table fish|spawners",
      "Lime is applied to a new fish pond to|reduce acidity and kill pests|feed the fish directly|colour the water|block the inlet",
      "A method of preserving fish is|smoking|stocking|liming|seining"],
    H11: ["Apiculture is the|keeping of bees for honey and other products|rearing of snails|rearing of fish|rearing of silkworms",
      "The only fertile female in a bee colony is the|queen|worker|drone|nurse bee",
      "The male bees in a colony are called|drones|workers|queens|larvae",
      "Which of these is a product of bee keeping?|Beeswax|Lanolin|Rennet|Tallow",
      "The equipment used to calm bees during honey harvesting is the|smoker|hive tool|extractor|bee veil"],
    I1: ["The basic economic problem that makes choice necessary is|scarcity|inflation|taxation|surplus",
      "Opportunity cost is the|next best alternative forgone|money spent on a project|total cost of production|profit from a sale",
      "A scale of preference is a list of wants arranged in order of|importance|price|size|alphabet",
      "The law of diminishing returns states that, as more of a variable input is added to a fixed input, the extra output will eventually|decrease|increase without limit|stay the same for ever|become equal to the input",
      "Choice arises in economics because resources are|limited while wants are unlimited|unlimited|free|always increasing"],
    I2: ["Which factor of production is fixed in supply?|Land|Labour|Capital|Management",
      "The reward for capital is|interest|rent|wages|profit",
      "The reward for land is|rent|interest|wages|profit",
      "The factor of production that organises and controls the others is|management (the entrepreneur)|land|labour|capital",
      "Which of these is an example of capital on a farm?|Tractor|Farm manager|Hired worker|Rainfall"],
    I3: ["The law of demand states that, other things being equal, the higher the price, the|lower the quantity demanded|higher the quantity demanded|higher the supply only|lower the cost of production",
      "A change in quantity demanded caused by a change in the price of the commodity is shown by|a movement along the demand curve|a shift of the demand curve to the right|a shift of the supply curve|no change on the graph",
      "Which of these causes an increase in demand for rice (a shift of the curve)?|A rise in consumers' income|A fall in the price of rice|A rise in the price of rice|A fall in population",
      "A normal demand curve slopes|downwards from left to right|upwards from left to right|horizontally|vertically",
      "Goods that are used together, such as bread and butter, are said to be in|complementary (joint) demand|competitive demand|derived demand|composite demand"],
    I4: ["The law of supply states that, other things being equal, the higher the price, the|higher the quantity supplied|lower the quantity supplied|lower the demand only|higher the cost",
      "Which of these increases the supply of maize?|Favourable weather|A rise in the cost of fertilizer|An outbreak of pests|A higher tax on maize",
      "A normal supply curve slopes|upwards from left to right|downwards from left to right|horizontally|vertically downwards",
      "The supply of agricultural produce is slow to respond to price because of the|time needed for crops and animals to mature|ease of storage|absence of pests|stable weather",
      "A fall in supply while demand stays the same will cause the price to|rise|fall|stay the same|become zero"],
    I5: ["The price at which quantity demanded equals quantity supplied is the|equilibrium price|floor price|ceiling price|cost price",
      "A minimum (floor) price fixed above the equilibrium price leads to|a surplus|a shortage|equilibrium|a black market",
      "A maximum (ceiling) price fixed below the equilibrium price leads to|a shortage|a surplus|higher supply|lower demand",
      "Price control by government often results in|hoarding and black-market sales|unlimited supply|lower demand|higher quality of goods",
      "When demand increases and supply stays the same, the equilibrium price|rises|falls|stays the same|falls to zero"],
    I6: ["Which of these is a function of a farm manager?|Planning and organising farm activities|Fixing the national price of crops|Making land laws|Forecasting national elections",
      "Deciding what to produce and how much to produce is the manager's function of|planning|marketing|recording|supervision",
      "Making sure that workers carry out their duties properly is|supervision|budgeting|planning|evaluation",
      "A farm manager evaluates the farm business in order to|measure success and correct mistakes|increase losses|avoid paying workers|hide records",
      "Arranging the resources of the farm so that work goes smoothly is|organisation|marketing|insurance|auditing"],
    I7: ["Which of these is a problem faced by farm managers?|Uncertainty of weather and prices|Too many skilled workers|Excess credit|Stable input costs",
      "Price fluctuation is a problem to the manager because it makes|income hard to predict|yields higher|labour cheaper|planning unnecessary",
      "Risk from pests and diseases can be reduced by|preventive control and insurance|ignoring them|planting one crop only|selling the farm",
      "Shortage of skilled farm labour is made worse by|rural–urban migration|good rural roads|higher farm wages|rural electricity",
      "Perishability of produce is a problem because it|leads to losses if produce is not sold or stored quickly|increases shelf life|raises prices for ever|reduces the need for storage"],
    I8: ["Agricultural finance is concerned with the|acquisition and use of capital in farming|measurement of land|breeding of animals|control of weeds",
      "A loan to be repaid within one year is a|short-term loan|medium-term loan|long-term loan|grant",
      "Which of these is an institutional source of farm credit?|Agricultural and cooperative banks|Money lenders|Friends and relatives|Personal savings",
      "Collateral is|a security pledged for a loan|the interest on a loan|a gift from government|a farm record",
      "A problem farmers face in obtaining loans from banks is|lack of acceptable collateral|too little interest charged|too many rural branches|excess savings"],
    I9: ["The farm record that lists all the assets of the farm and their values is the|farm inventory|farm diary|payroll|sales record",
      "A farm diary is a record of|daily activities on the farm|money owed to the farmer|wages paid|assets only",
      "The gradual loss in value of a machine through use and age is|depreciation|appreciation|salvage|interest",
      "A profit and loss account shows|income and expenditure over a period|assets and liabilities on a date|daily farm work|number of workers",
      "A machine costs ₦500 000, has a salvage value of ₦100 000 and a useful life of 4 years. Its annual straight-line depreciation is|₦100 000|₦125 000|₦150 000|₦400 000|(500 000 − 100 000) ÷ 4 = 100 000"],
    I10: ["Marketing of agricultural produce covers all activities involved in|moving produce from the farm to the final consumer|planting crops|breeding animals|testing soil",
      "A middleman who buys in bulk from producers and sells to retailers is a|wholesaler|retailer|consumer|producer",
      "Sorting produce into classes according to quality is|grading|packaging|processing|advertising",
      "Marketing boards were set up mainly to|stabilise the prices of export crops|import machinery|run farm schools|survey land",
      "Which of these is a problem of agricultural marketing in West Africa?|Poor roads and inadequate storage|Too few middlemen|Very stable prices|Excess processing factories"],
    I11: ["Agricultural insurance protects the farmer against|loss from risks such as fire, pests and drought|low soil fertility|high wages|all business decisions",
      "The amount paid regularly by the insured to the insurance company is the|premium|indemnity|policy|claim",
      "Payment made by the insurer to cover a loss suffered is the|indemnity|premium|interest|rent",
      "Which of these is a type of agricultural insurance?|Crop insurance|Marine cargo insurance only|Third-party motor insurance only|Burglary insurance for shops",
      "A farm is insured for ₦2 000 000 at a premium rate of 5 %. The annual premium is|₦100 000|₦10 000|₦40 000|₦400 000|5 % × 2 000 000 = 100 000"],
    I12: ["Agricultural extension is the|teaching of improved farming practices to farmers|sale of fertilizers|lending of money to farmers|export of produce",
      "Which of these is a mass method of extension teaching?|Radio and television programmes|Farm and home visits|Office calls|Personal letters",
      "A result demonstration is used to show farmers|the benefit of a new practice compared with the old|how to obtain a loan|the farmer's own records|a list of banned chemicals",
      "A farm visit by the extension agent is an example of the|individual method|group method|mass method|indirect method",
      "A problem of agricultural extension in West Africa is|too few extension agents for the number of farmers|too many vehicles|excess funding|high literacy of all farmers"],
    PA: ["A soil sample that feels gritty and does not form a ball when moist is|sandy|clayey|loamy|silty",
      "Which rock specimen fizzes when dilute hydrochloric acid is dropped on it?|Limestone|Granite|Quartzite|Basalt",
      "In a sedimentation test, the particles that settle first at the bottom are|gravel and coarse sand|silt|clay|humus",
      "The instrument used to measure rainfall is the|rain gauge|wind vane|hygrometer|barometer",
      "A soil that turns blue litmus paper red is|acidic|alkaline|neutral|saline"],
    PB: ["The tool with a curved blade used for harvesting cereals is the|sickle|cutlass|hoe|axe",
      "The implement with concave discs used for first ploughing is the|disc plough|ridger|harrow|planter",
      "A spirit level is used in the farm workshop or in surveying to|check that a surface is horizontal|measure length|cut metal|drive nails",
      "The part of a knapsack sprayer that breaks the liquid into fine droplets is the|nozzle|tank|strap|lance handle",
      "Which tool is used to tighten and loosen nuts and bolts?|Spanner|Hammer|Chisel|Saw"],
    PC: ["A seed with two cotyledons is described as|dicotyledonous|monocotyledonous|polycotyledonous|acotyledonous",
      "Which of these crops is a monocotyledon?|Maize|Cowpea|Groundnut|Tomato",
      "A fertilizer bag labelled 15–15–15 contains nitrogen, phosphorus and|potassium|calcium|magnesium|sulphur",
      "In a germination test, 80 out of 100 seeds germinate. The germination percentage is|80 %|20 %|8 %|100 %",
      "The storage organ of cassava that is eaten is a|root tuber|stem tuber|corm|bulb"],
    PD: ["The instrument used for bloodless castration of bulls is the|burdizzo|elastrator ring only|hoof trimmer|drenching gun",
      "A tapeworm specimen is classed as|an endoparasite|an ectoparasite|a vector|a predator",
      "Which of these feed ingredients supplies mainly minerals?|Bone meal|Maize|Groundnut cake|Fish oil",
      "The instrument used to give liquid medicine to animals through the mouth is the|drenching gun|hypodermic syringe|ear notcher|tattooing forceps",
      "Candling of eggs is done to|check fertility and internal quality|clean the shell|weigh the egg|colour the yolk"],
  };

  const TH = { A: ["BAS"], E: ["FOR"], F: ["FOR"], G: ["PROT"], P: ["PRAC"], C: ["ENG"] };
  const ONE = { B1: "ECO", B2: "ECO", B3: "ECO", B4: "ECO", B5: "ECO", B12: "ECO", B6: "SOIL", B7: "SOIL", B8: "SOIL", B9: "SOIL", B10: "IRR", B11: "IRR", D1: "CROP", D2: "CROP", D3: "CROP", D4: "IMP", H1: "ANI", H2: "ANI", H3: "ANI", H4: "ANI", H5: "ANI", H6: "ANI", H7: "AHL", H9: "AHL", H8: "IMP", H10: "AQU", H11: "AQU", I1: "ECN", I2: "ECN", I3: "ECN", I4: "ECN", I5: "ECN", I6: "MGT", I7: "MGT", I8: "MGT", I9: "MGT", I10: "MGT", I11: "MGT", I12: "MGT" };
  const themeOf = {}; Object.keys(BANK).forEach((c) => { themeOf[c] = ONE[c] ? [ONE[c]] : TH[c.charAt(0)] || []; });

  const SORTS = [
    { title: "Classify the crops by their use", bins: { Cereals: ["Maize", "Rice", "Millet", "Guinea corn", "Wheat"], "Roots and tubers": ["Cassava", "Yam", "Sweet potato", "Cocoyam"], "Beverage crops": ["Cocoa", "Coffee", "Tea", "Kola"], "Fibre crops": ["Cotton", "Jute", "Sisal", "Kenaf"] } },
    { title: "Classify the farm animals", bins: { Ruminants: ["Cattle", "Sheep", "Goat", "Deer"], "Non-ruminant mammals": ["Pig", "Rabbit", "Horse", "Donkey"], Poultry: ["Chicken", "Turkey", "Duck", "Guinea fowl"] } },
    { title: "Tool, implement or machine?", bins: { "Simple farm tools": ["Cutlass", "Hoe", "Spade", "Rake", "Sickle", "Hand trowel"], "Tractor-coupled implements": ["Disc plough", "Harrow", "Ridger", "Planter", "Mouldboard plough"], "Farm machines": ["Tractor", "Bulldozer", "Combine harvester", "Sheller", "Incubator", "Milking machine"] } },
    { title: "Macro-nutrient or micro-nutrient?", bins: { "Macro-nutrients": ["Nitrogen", "Phosphorus", "Potassium", "Calcium", "Magnesium", "Sulphur"], "Micro-nutrients (trace elements)": ["Iron", "Zinc", "Copper", "Boron", "Manganese", "Molybdenum"] } },
    { title: "Sort the rocks by how they formed", bins: { "Igneous rocks": ["Granite", "Basalt", "Gabbro", "Diorite"], "Sedimentary rocks": ["Sandstone", "Limestone", "Shale", "Conglomerate"], "Metamorphic rocks": ["Marble", "Slate", "Gneiss", "Quartzite", "Schist"] } },
    { title: "Sort the insect pests by mouthparts", bins: { "Biting and chewing pests": ["Grasshopper", "Yam beetle", "Armyworm", "Termite", "Locust"], "Piercing and sucking pests": ["Aphid", "Cotton stainer", "Mealybug", "Whitefly", "Capsid bug"], "Boring pests": ["Maize stem borer", "Maize weevil", "Bean beetle", "Rice weevil"] } },
    { title: "Sort the crop diseases by cause", bins: { "Fungal diseases": ["Maize smut", "Rice blast", "Black pod of cocoa", "Coffee leaf rust", "Cercospora leaf spot"], "Viral diseases": ["Cassava mosaic", "Groundnut rosette", "Cocoa swollen shoot", "Maize streak"], "Bacterial diseases": ["Cassava bacterial blight", "Bacterial wilt of tomato", "Black arm of cotton"] } },
    { title: "Sort the animal diseases by cause", bins: { "Viral diseases": ["Foot-and-mouth disease", "Rinderpest", "Newcastle disease", "African swine fever", "Fowl pox"], "Bacterial diseases": ["Anthrax", "Brucellosis", "Tuberculosis", "Fowl cholera", "Mastitis"], "Protozoan diseases": ["Trypanosomiasis", "Coccidiosis", "Red water fever"] } },
    { title: "Which environmental factor is it?", bins: { "Climatic factors": ["Rainfall", "Temperature", "Wind", "Relative humidity", "Sunlight"], "Edaphic (soil) factors": ["Soil pH", "Soil texture", "Soil structure", "Soil fertility"], "Biotic factors": ["Pests", "Parasites", "Predators", "Soil organisms"] } },
    { title: "Organic manure or inorganic fertilizer?", bins: { "Organic manures": ["Compost", "Farmyard manure", "Green manure", "Poultry droppings"], "Inorganic fertilizers": ["Urea", "NPK 15-15-15", "Single superphosphate", "Muriate of potash", "Ammonium sulphate"] } },
    { title: "Sort the feedstuffs", bins: { "Energy concentrates": ["Maize", "Guinea corn", "Cassava chips", "Millet"], "Protein concentrates": ["Groundnut cake", "Soya bean meal", "Fish meal", "Blood meal", "Palm kernel cake"], Roughages: ["Hay", "Silage", "Straw", "Fresh grass"], "Mineral supplements": ["Bone meal", "Oyster shell", "Salt lick", "Limestone"] } },
  ];

  const CHALLENGES = [
    { id: "pop", key: "D2-a", title: "Plant population", goal: "Set the maize spacing so the plant population is 40 000 plants per hectare.", hint: "Population per hectare = 10 000 m² ÷ (row spacing × in-row spacing in metres). Which pair of spacings multiplies to 0.25 m²?", par: 60, moves: 6, why: "100 cm × 25 cm (or 50 cm × 50 cm) gives 0.25 m² per plant.", ok: (R, c, n) => c.crop === "maize" && Math.abs(n(R["Plant population"]) - 40000) <= 400 },
    { id: "chain", key: "C7-c", title: "Chain survey", goal: "Adjust the baseline and offsets until the surveyed area is exactly 3 600 m².", hint: "The plot is a trapezium: area = baseline × (offset 1 + offset 2) ÷ 2.", par: 75, moves: 10, why: "area = baseline × sum of offsets ÷ 2.", ok: (R, c, n) => Math.abs(n(R["Area"]) - 3600) < 1 },
    { id: "ph", key: "B8-c", title: "Fix the acid soil", goal: "Raise ammonium sulphate to 300 kg/ha or more, then bring the soil pH back to between 6.4 and 6.6.", hint: "Ammonium sulphate makes soil more acid. Lime and wood ash raise the pH.", par: 75, moves: 10, why: "liming corrects the acidity caused by ammonium fertilizers.", ok: (R, c, n) => c.amm >= 300 && n(R["Soil pH"]) >= 6.4 && n(R["Soil pH"]) <= 6.6 },
    { id: "floor", key: "I5-a", title: "Find the equilibrium", goal: "Find the highest floor price that leaves no surplus.", hint: "A floor price above equilibrium makes supply exceed demand. Lower it until the surplus just disappears.", par: 45, moves: 8, why: "that price is the equilibrium price, where quantity demanded equals quantity supplied.", ok: (R, c, n) => c.pf === 2700 && n(R["Surplus"]) === 0 },
    { id: "stream", key: "B12-c", title: "Save the stream", goal: "Keep agro-chemical use at 50 % or more and still get at least 70 % of the fish to survive.", hint: "You cannot stop farming. What stops chemicals and dung reaching the water?", par: 60, moves: 6, why: "a grass buffer strip and composting the dung keep pollutants out of the water.", ok: (R, c, n) => c.chem >= 50 && n(R["Fish surviving"]) >= 70 },
    { id: "pond", key: "H10-e", title: "Fish pond manager", goal: "Harvest at least 800 kg of fish with survival of 85 % or more.", hint: "More fish need more oxygen. Over-feeding fouls the water. Give the fish enough weeks to grow.", par: 120, moves: 14, why: "higher stocking only pays when aeration is on and feeding is not excessive.", ok: (R, c, n) => n(R["Harvest"]) >= 800 && n(R["Survival"]) >= 85 },
    { id: "texture", key: "B8-d", title: "Texture triangle", goal: "Mix sand and clay so the soil classes as a sandy clay loam.", hint: "A sandy clay loam has a lot of sand, a moderate amount of clay and little silt.", par: 60, moves: 8, why: "about 50 % sand and 25 % clay falls in the sandy clay loam part of the triangle.", ok: (R) => R["Class"] === "Sandy clay loam" },
    { id: "sow", key: "H3-d", title: "Breeding calendar", goal: "Choose the sow and set the mating day so she farrows on day 200 of the year.", hint: "Gestation in the sow is 114 days (3 months, 3 weeks, 3 days).", par: 60, moves: 6, why: "200 − 114 = day 86.", ok: (R, c, n) => c.sp === "sow" && n(R["Birth day"]) === 200 },
    { id: "loan", key: "I8-d", title: "Loan limit", goal: "Borrow ₦800 000 at simple interest for 3 years. Find the highest interest rate that keeps total repayment at ₦1 000 000 or less.", hint: "Simple interest = principal × rate × time ÷ 100. The interest must not exceed ₦200 000.", par: 90, moves: 10, why: "800 000 × 8 × 3 ÷ 100 = ₦192 000 interest; 9 % would give ₦216 000.", ok: (R, c) => c.P === 800000 && c.n === 3 && c.m === "simple" && c.r === 8 },
    { id: "ration", key: "H6-d", title: "Pearson square", goal: "Formulate a 16 % crude protein ration from cassava and fish meal.", hint: "Choose the energy feed and the protein feed first, then set the target.", par: 45, moves: 5, why: "the square gives the parts of each feed from the difference between its protein and the target.", ok: (R, c) => c.t === 16 && c.a === "cassava" && c.b === "fish" },
    { id: "weeds", key: "G3-c", title: "Weed in time", goal: "With weed density at 80 per m² or more, keep the yield loss below 5 %.", hint: "The critical period of weed competition is early. When should the first weeding be?", par: 45, moves: 5, why: "early weeding removes competition during the critical first weeks.", ok: (R, c, n) => c.d >= 80 && n(R["Yield loss"]) < 5 },
    { id: "plan", key: "C8-a", title: "Ten-hectare plan", goal: "Use no more than 10 ha and plan the farm to earn a profit of at least ₦2 500 000.", hint: "Compare profit per hectare for each enterprise, then give land to the most profitable ones.", par: 120, moves: 16, why: "intensive enterprises such as poultry earn the most per hectare, but need more labour.", ok: (R, c, n) => n(R["Land used"]) <= 10 && n(R["Profit"]) >= 2500000 },
  ];

  /* Find the part: one 3D stage, several models. Each point has a name and a function that returns its world position. */
  const AK = window.AK, BK = window.BK, GK = window.GK, T = () => window.THREE;
  const MODELS = [["tractor", "Tractor"], ["combine", "Combine harvester"], ["bulldozer", "Bulldozer"], ["cow", "Cow — body organs"], ["hen", "Hen — body organs"]];
  const worldPos = (o) => { const T3 = T(); if (o.isMesh && o.geometry) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); return o.geometry.boundingSphere.center.clone().applyMatrix4(o.matrixWorld); } return o.getWorldPosition(new T3.Vector3()); };
  function makeModel(id) {
    let m, pts = [];
    if (id === "cow" || id === "hen") { m = id === "cow" ? AK.animal("whitefulani", { view: "xray" }) : AK.bird("hen", { view: "xray" }); const P = Array.isArray(m.parts) ? m.parts : Object.values(m.parts || {}); P.forEach((p) => { const o = (p.meshes || [])[0]; if (o && !p.hidden && p.name) pts.push({ name: p.name, pos: () => worldPos(o) }); }); }
    else { m = id === "combine" ? AK.combine() : id === "bulldozer" ? AK.bulldozer() : AK.tractor(); (m.parts || []).forEach((p) => { if (!/^(Rear wheel|Front wheel|Track)$/.test(p.name)) pts.push({ name: p.name.replace(/ \(drive\)| \(steering\)/, ""), pos: () => worldPos(p) }); }); }
    const T3 = T(), box = new T3.Box3().setFromObject(m), size = box.getSize(new T3.Vector3()), k = 1 / Math.max(size.x / 3.8, size.y / 2.3, size.z / 3.2, 0.001);
    m.scale.multiplyScalar(k); const b2 = new T3.Box3().setFromObject(m), c = b2.getCenter(new T3.Vector3()); m.position.x -= c.x; m.position.z -= c.z; m.position.y -= b2.min.y;
    return { m, pts };
  }
  if (AK && AK.def3d && BK && GK) AK.def3d("GAME-parts", {
    title: "Find the part", blurb: "Numbered markers sit on the parts of the model. Tap the marker for the part you are asked to find.",
    cam: [[3.4, 2.2, 4.8], [0, 0.95, 0]], sky: "farm_field", envX: {}, values: { m: "tractor" }, controls: [],
    build(S, s) { s.key = null; s.pts = null; },
    update(S, s, c) { if (s.key !== c.m) { const g = BK.group(S, s); AK.ground(g, { w: 10, d: 8, amp: 0.01, tex: "concrete_floor_worn_001", apronTex: "sparse_grass" }); const M = makeModel(c.m); g.add(M.m); g.updateMatrixWorld(true); s.m = M.m; s.pts = M.pts; s.key = c.m; } },
    hud: () => [], draw: GK.fallback("Find the part", ["This game needs the 3D lab (WebGL)."]),
  });

  const ONSITE = /\/labs\/$/.test(window.MK ? MK.base : "");   // offline install only on the main site, not in embedded copies
  const sections = () => SECT.order.map((k) => ({ key: k, label: SECT.labels[k], topics: SECT[k] }));
  window.AgricLearn = {
    start(hooks) {
      return LK.init(Object.assign({ id: "agric", subject: "Agricultural Science", brand: "learnwithnehy.", ranks: ["Seedling", "Sprout", "Grower", "Farmer", "Agronomist", "Master farmer", "Professor of the soil"], sections, bank: BANK, themeOf, gens: (window.AgricExam || {}).gens, sorts: SORTS, challenges: CHALLENGES, parts: { key: "GAME-parts", models: MODELS }, manifest: ONSITE ? "/labs/agric.webmanifest" : null, sw: ONSITE ? "/sw.js" : null }, hooks));
    },
    BANK, SORTS, CHALLENGES,
  };
})();
