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
