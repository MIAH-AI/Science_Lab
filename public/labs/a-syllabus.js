/* a-syllabus.js — WAEC Agricultural Science (SSCE) syllabus as data.
   Sections (rail tabs) follow the syllabus themes A–I plus the Paper 3 practical list.
   Simulation keys are "<topic code>-<subtopic code>", e.g. "B7-c", "PA-4b". */
(function () {
  "use strict";
  const T = (code, num, glyph, title, desc, subs) => ({ code, num, glyph, title, desc, subtopics: subs.map(([c, t, content, notes]) => ({ code: c, title: t, content, notes })) });

  const A = [
    T("A1", "A1", "🌾", "Meaning and importance of agriculture", "What agricultural science covers and why agriculture matters to people, communities and nations.", [
      ["a", "Definition and branches of agricultural science", ["Agriculture: the cultivation of crops and rearing of animals for man's use, including processing and marketing", "Branches: crop science, animal science, soil science, agricultural engineering, agricultural economics and extension, forestry, fisheries, agricultural biochemistry"], "Name a branch and give one area of study or job in it."],
      ["b", "Importance of agriculture to the individual, community and nation", ["Food, income, employment, shelter and clothing materials", "Raw materials for industry, foreign exchange from exports, market for industrial goods", "Provision of capital, rural development, national food security"], "Questions often ask for four contributions of agriculture to national economic development."],
    ]),
    T("A2", "A2", "⚠", "Problems of agricultural development and solutions", "The ten problem areas named in the syllabus, how each holds back production, and how they can be solved.", [
      ["a", "Problems of agricultural development", ["Land tenure, basic amenities, finance, transportation, storage and processing facilities", "Agricultural education and extension, tools and machinery, farm inputs, marketing system, environmental degradation", "Also: pests and diseases, vagaries of weather, labour shortage, unstable government policy"], "Assessment includes incidence of pests and diseases, weather, labour and government policy."],
      ["b", "Possible solutions to identified problems", ["Land reform, rural roads and electricity, credit schemes and subsidies", "Storage and processing facilities, extension services, mechanisation, timely supply of inputs", "Organised marketing, conservation of land, stable policies"], "Match each solution to the problem it solves."],
    ]),
    T("A3", "A3", "⚖", "Subsistence and commercial agriculture", "Meaning, characteristics, advantages, disadvantages and problems of the two systems.", [
      ["a", "Meaning of subsistence and commercial agriculture", ["Subsistence: the farmer produces mainly to feed the family, little surplus for sale", "Commercial: production mainly for sale and profit, often on a large scale"], "Define each system in one sentence."],
      ["b", "Differences based on characteristics", ["Scale (small vs large), capital, labour (family vs hired), tools (simple vs machines), inputs, records, market orientation, specialisation"], "Tabulate at least four differences."],
      ["c", "Advantages and disadvantages", ["Subsistence: cheap to run, family food security, but low output and income", "Commercial: high output, income and employment, but high capital, risk and pollution"], "Give two advantages and two disadvantages of each."],
      ["d", "Problems of subsistence and commercial agriculture", ["Subsistence: small fragmented land, little capital, low technology", "Commercial: high cost of inputs and machinery, price fluctuations, labour, finance"], "Problems differ: lack of capital (subsistence) vs high operating cost (commercial)."],
    ]),
    T("A4", "A4", "🏛", "Roles of government in agricultural development", "Finance (credit, subsidy), education, extension services, and policies and programmes.", [
      ["a", "Agricultural finance: credit and subsidy", ["Credit through agricultural banks and schemes; guarantee schemes", "Subsidy on fertilizers, seeds, machinery and agrochemicals reduces farmers' costs"], "Explain how a subsidy raises output."],
      ["b", "Agricultural education", ["Schools, colleges of agriculture, universities, research institutes", "Trained manpower and new technologies"], "Link education to adoption of improved practices."],
      ["c", "Agricultural extension services", ["Extension agents take research results to farmers and farmers' problems back to research"], "Extension is a two-way link."],
      ["d", "Agricultural policies and programmes", ["Past and present programmes: Operation Feed the Nation (OFN), Agricultural Development Projects (ADP), Farm Settlement Schemes, Agricultural Sector Rehabilitation Project, River Basin Development Authorities"], "Assessment covers past and present programmes and what each aimed to do."],
    ]),
    T("A5", "A5", "🤝", "Non-governmental organisations (NGOs)", "Meaning of NGOs and their roles in agricultural development.", [
      ["a", "Meaning of NGOs", ["Organisations not owned or run by government, usually not-for-profit, funded by donors"], "Contrast with government agencies and private companies."],
      ["b", "Roles of NGOs in agricultural development", ["Research and improved varieties (IITA, WARDA/AfricaRice, ILCA/ILRI, ICRISAT)", "Training, credit, inputs, extension, relief and rural projects"], "Name an NGO and state its work."],
    ]),
    T("A7", "A6", "📜", "Agricultural laws and reforms", "Land tenure systems, government laws on land use, and the Land Use Act and reforms in West Africa.", [
      ["a", "Land tenure systems in West Africa", ["Communal, inheritance, freehold, leasehold, tenancy, gift, pledging, purchase, government (state) ownership"], "Know the advantages and disadvantages of each system."],
      ["b", "Government laws on land use", ["Land Use Act (Decree) 1978 in Nigeria: land vested in the state governor; certificates of occupancy; customary rights", "Similar land reforms in other West African countries"], "State the main provisions of the Land Use Act."],
      ["c", "Advantages and disadvantages of the Land Use Act and reforms", ["Advantages: easier access to land for government projects and large farms, less litigation, security for loans", "Disadvantages: bureaucracy, compensation problems, land still fragmented"], "Give two advantages and two disadvantages."],
    ]),
  ];

  const B = [
    T("B1", "B1", "🌍", "Agricultural ecology", "Meaning of agricultural ecology and ecosystem, its biotic and abiotic components and how they interact.", [
      ["a", "Meaning of agricultural ecology and ecosystem", ["Agricultural ecology: the study of farm crops and animals in relation to their environment", "Ecosystem: a community of organisms interacting with their non-living environment"], "Define both terms."],
      ["b", "Components of a farm ecosystem", ["Biotic: crops, livestock, weeds, pests, micro-organisms, man", "Abiotic: climate, soil, water, topography"], "Classify given components as biotic or abiotic."],
      ["c", "Interactions in terrestrial and aquatic agro-ecosystems", ["Sole cropping, mixed cropping, mixed farming, fish ponds, forests", "Food chains, nutrient cycling, competition and feeding relationships"], "Assessed: interaction of farm crops and animals with other components in different farm settings."],
    ]),
    T("B2", "B2", "🗺", "Land and its uses", "Meaning and characteristics of land, and its agricultural and non-agricultural uses.", [
      ["a", "Meaning of land", ["Land: the solid part of the earth's surface, including soil, minerals, water and natural vegetation, used for production"], "Land is a factor of production."],
      ["b", "Characteristics of land", ["Free gift of nature, immobile, limited (fixed) in supply, varies in fertility, subject to diminishing returns"], "List four characteristics."],
      ["c", "Uses of land", ["Agricultural: crops, livestock, wildlife conservation, aquaculture, forestry, apiculture", "Non-agricultural: industry, housing, transport, schools, markets, health centres, mining, recreation, worship"], "Assessment includes land use for aquaculture, forestry and apiculture."],
    ]),
    T("B3", "B3", "⛰", "Factors affecting land availability for agriculture", "Physical, economic and socio-cultural factors.", [
      ["a", "Physical factors", ["Soil type, topography, land degradation (erosion, desertification), soil pollution"], "Explain how each makes land unavailable."],
      ["b", "Economic factors", ["Population pressure, expansion of industries, mining and mineral exploitation, recreation and tourism"], "Population pressure reduces farm size per person."],
      ["c", "Socio-cultural factors", ["Land tenure system, religious purposes (churches, mosques, shrines, sacred groves), taboos"], "Give examples from your locality."],
    ]),
    T("B4", "B4", "🏭", "Agro-allied industries", "Agro-based industries and their raw materials; the relationship between agriculture and industry.", [
      ["a", "Agro-based industries and raw materials", ["Paper – pulpwood; beverages – cocoa, tea, coffee; textiles – cotton; soap – palm oil, seeds", "Leather – hides and skins; canning – meat, fish, fruits; flour mills – wheat, maize; sugar – cane"], "Match each industry with its raw material."],
      ["b", "Relationship between agriculture and industry", ["Agriculture supplies raw materials and food for workers; industry supplies machinery, fertilizers and agrochemicals", "Agriculture is a market for industrial products; industry processes and adds value to farm produce"], "Explain the two-way relationship."],
    ]),
    T("B5", "B5", "☀", "Environmental factors affecting crops and animals", "Climatic, biotic and edaphic factors and how they affect distribution and production.", [
      ["a", "Climatic factors", ["Rainfall (amount, distribution), temperature, light (intensity, duration), wind, relative humidity"], "Relate each factor to crop or animal distribution in West Africa."],
      ["b", "Biotic factors", ["Predators, parasites, soil micro-organisms, pests, pathogens, weeds", "Interrelationships: competition, parasitism, mutualism (symbiosis)"], "Give an agricultural example of each relationship."],
      ["c", "Edaphic factors", ["Soil pH, soil texture, soil structure, soil type, soil fertility, soil water and air"], "Edaphic factors are soil factors."],
    ]),
    T("B6", "B6", "🪨", "Rock formation", "Types of rock and the processes by which they form.", [
      ["a", "Types of rock", ["Igneous (granite, basalt), sedimentary (sandstone, limestone, shale), metamorphic (marble, gneiss, slate, quartzite)"], "Assessment covers identification, description and examples."],
      ["b", "Processes of rock formation", ["Igneous: cooling and solidification of magma or lava", "Sedimentary: weathering, transport, deposition, compaction and cementation", "Metamorphic: alteration of existing rocks by heat and pressure"], "Know how each rock type forms."],
    ]),
    T("B7", "B7", "⛏", "Soil formation and profile development", "Factors and processes of soil formation and the development of a soil profile.", [
      ["a", "Factors of soil formation", ["Parent rock, climate, organisms (living things), topography, time"], "The role of each factor is assessed."],
      ["b", "Processes of soil formation", ["Physical weathering: temperature changes, water, wind, plant roots, animals", "Chemical weathering: solution, hydrolysis, oxidation, carbonation, hydration"], "Distinguish physical from chemical weathering."],
      ["c", "Soil profile development", ["Horizons O (litter), A (topsoil), B (subsoil), C (weathered parent material), R (bedrock)"], "Meaning, importance, identification and description of each horizon."],
    ]),
    T("B8", "B8", "🟫", "Types, composition and properties of soil", "Soil types, composition, pH and physical properties.", [
      ["a", "Types of soil", ["Sandy, clay and loamy soils; separation into sand, silt and clay fractions"], "Compare drainage, water holding and fertility."],
      ["b", "Chemical and biological composition", ["Macro and micro nutrients, soil water, soil macro-organisms (earthworms, termites), soil microbes, soil air", "Typical volume: mineral matter 45%, water 25%, air 25%, organic matter 5%"], "List the components of soil."],
      ["c", "Soil pH", ["Determination of soil pH; causes of acidity (leaching, acid fertilizers) and alkalinity", "Correction: liming acid soils; gypsum or sulphur for alkaline soils"], "Determination, causes and correction of soil acidity/alkalinity are assessed."],
      ["d", "Physical properties of soil", ["Texture, structure, water holding capacity, porosity, capillarity, consistency"], "Explain how texture affects water holding and aeration."],
    ]),
    T("B9", "B9", "🧪", "Plant nutrients and nutrient cycles", "Nutrients, their functions and deficiency symptoms, availability, replenishment, cycles, and organic agriculture.", [
      ["a", "Macro and micro nutrients", ["Macro: N, P, K, Ca, Mg, S; Micro: Zn, Fe, Mo, Co, B, Cu, Mn", "Functions and deficiency symptoms in crops"], "Know the function and one deficiency symptom of each major nutrient."],
      ["b", "Factors affecting availability of nutrients", ["Soil pH, excess of other nutrients, leaching, crop removal, oxidation, burning, erosion"], "Explain how pH locks up nutrients."],
      ["c", "Methods of replenishing lost nutrients", ["Crop rotation, organic manuring, fertilizer application, fallowing, liming, cover cropping", "Types of fertilizers and methods of application"], "Types of fertilizers and methods of fertilizer application are assessed."],
      ["d", "Nitrogen, carbon, water and phosphorus cycles", ["Description and importance of each cycle to agriculture"], "Draw and describe the nitrogen cycle."],
      ["e", "Organic agriculture", ["Farming without synthetic chemicals: manures, compost, biological pest control, crop rotation", "Importance: soil health, safe food, environment, premium prices"], "Meaning and importance."],
    ]),
    T("B10", "B10", "💧", "Irrigation", "Meaning, types, advantages, importance and problems of irrigation.", [
      ["a", "Meaning of irrigation", ["Artificial application of water to soil to supply the moisture needs of crops"], "Define irrigation."],
      ["b", "Types of irrigation systems", ["Overhead (sprinkler), surface (flooding, furrow/channel, basin, border), underground (perforated pipes, drip)"], "Describe how each system delivers water."],
      ["c", "Advantages and disadvantages", ["Sprinkler: even but costly; furrow: cheap but wasteful; drip: efficient but expensive and clogs"], "Compare systems on cost, water use and labour."],
      ["d", "Importance of irrigation", ["Dry-season farming, more than one crop a year, higher yields, crop insurance against drought, fertigation"], "Give four reasons for irrigation."],
      ["e", "Problems associated with irrigation", ["Waterlogging, salinisation, high cost, water-borne diseases, weeds, erosion"], "Explain salinisation."],
    ]),
    T("B11", "B11", "🚰", "Drainage", "Meaning, importance, types, advantages and disadvantages of drainage.", [
      ["a", "Meaning of drainage", ["Removal of excess water from the soil"], "Define drainage."],
      ["b", "Importance of drainage", ["Aeration of roots, warmer soil, deeper rooting, easier cultivation, fewer diseases, prevents waterlogging"], "Give four reasons for draining land."],
      ["c", "Types of drainage systems", ["Surface: open channels, furrows; subsurface/underground: tile drains, perforated pipes, mole drains"], "Describe each type."],
      ["d", "Advantages and disadvantages of drainage systems", ["Surface: cheap but uses land and erodes; subsurface: saves land but costly"], "Compare surface and subsurface drainage."],
    ]),
    T("B12", "B12", "☣", "Agricultural pollution", "Meaning, causes, effects and ways of minimising pollution of farmland and ponds.", [
      ["a", "Meaning of agricultural pollution", ["Contamination of farmland, water or air by harmful substances that reduce productivity"], "Define pollution."],
      ["b", "Causes and sources of pollution", ["Excessive agrochemicals, marine and oil spillage, livestock waste and dung, industrial effluent, burning"], "List sources of pollution of farmland and fish ponds."],
      ["c", "Effects of pollution and ways of minimising it", ["Loss of soil fertility, death of fish and soil organisms, poisoning, low yields, health hazards", "Minimise: correct dosage, waste treatment, buffer strips, laws against spillage"], "Ways of minimising land and pond pollution are assessed."],
    ]),
  ];

  const C = [
    T("C1", "C1", "🔨", "Simple farm tools", "Meaning, types and maintenance of simple farm tools.", [
      ["a", "Meaning of simple farm tools", ["Hand tools operated by human energy for farm operations"], "Define simple farm tools."],
      ["b", "Types of simple farm tools", ["Cutlass, hoe, spade, shovel, rake, sickle, pickaxe, axe, garden fork, trowel, watering can, wheelbarrow, secateurs, shears"], "Identification, description and uses of each tool are assessed."],
      ["c", "General maintenance of simple farm tools", ["Clean after use, oil metal parts, sharpen blades, replace broken handles, store in a dry place"], "Give four maintenance practices."],
    ]),
    T("C2", "C2", "🚜", "Farm machinery and implements", "Farm machinery and tractor-coupled implements: parts and uses.", [
      ["a", "Farm machinery", ["Tractor, bulldozer, shellers, dryers, incubators, milking machines, combine harvester"], "Meaning, uses and identification of parts are assessed; engineering details are not required."],
      ["b", "Tractor-coupled implements", ["Ploughs (disc, mouldboard), harrows, ridgers, planters, harvesters, sprayers, cultivators"], "State the use of each implement."],
    ]),
    T("C3", "C3", "🔧", "Maintenance and precautions", "Reasons for maintaining machines; maintenance practices and safety precautions.", [
      ["a", "Reasons for maintaining farm machines", ["Longer life, efficiency, fewer breakdowns, safety, lower running costs, higher resale value"], "Give four reasons."],
      ["b", "Maintenance practices and precautionary measures", ["Check water and oil levels, routine servicing, greasing, tyre pressure, cleaning, proper storage", "Precautions: trained operators, no passengers, safety guards, protective clothing"], "Precautionary measures in the use of farm machinery are assessed."],
    ]),
    T("C4", "C4", "⚙", "Agricultural mechanisation", "Meaning, operations, advantages, disadvantages and limitations.", [
      ["a", "Meaning of mechanisation", ["Use of machines in farm operations to replace human and animal labour"], "Define mechanisation."],
      ["b", "Mechanised agricultural operations", ["Ploughing, harrowing, ridging, planting, spraying, harvesting, processing, milking"], "Mechanised operations are assessed."],
      ["c", "Advantages and disadvantages", ["Advantages: speed, large scale, timeliness, less drudgery", "Disadvantages: cost, unemployment, soil compaction, pollution"], "Give two of each."],
      ["d", "Limitations of mechanisation", ["Small fragmented holdings, high cost, lack of spare parts and skilled operators, tree stumps, topography, land tenure"], "Explain why mechanisation is limited in West Africa."],
    ]),
    T("C5", "C5", "📈", "Prospects of agricultural mechanisation", "Ways of improving mechanisation.", [
      ["a", "Prospects and ways of improving mechanisation", ["Developing less expensive machines locally, agricultural engineering schools, tractor hiring services, credit, land consolidation"], "Possible ways of improving mechanisation are assessed."],
    ]),
    T("C6", "C6", "⚡", "Farm power", "Sources of farm power and their advantages and disadvantages.", [
      ["a", "Sources of farm power", ["Human, animal, mechanical (engines), electrical, solar, wind, water (hydro), biogas"], "List sources of farm power."],
      ["b", "Advantages and disadvantages of each source", ["Human: cheap but slow; animal: cheaper than tractor but tsetse; mechanical: fast but costly; solar/wind: free energy but intermittent"], "Compare sources."],
    ]),
    T("C7", "C7", "📐", "Farm surveying", "Meaning, equipment, uses, maintenance and importance of farm surveying.", [
      ["a", "Meaning of farm surveying", ["Measuring and mapping farmland: boundaries, area, features"], "Define farm surveying."],
      ["b", "Common survey equipment", ["Measuring tape, Gunter's chain, ranging poles, arrows (pins), plumb bob, offset staff, compass, pegs, theodolite"], "Identify each item."],
      ["c", "Uses of farm survey equipment", ["Ranging lines, measuring distances and offsets, taking bearings, levelling, marking boundaries"], "State the use of each item."],
      ["d", "Maintenance of survey equipment", ["Clean and dry after use, oil the chain, store in cases, check calibration"], "Give three maintenance practices."],
      ["e", "Importance of farm surveying", ["Accurate area and boundaries, farm planning, siting structures, drainage and irrigation layout, land valuation, settling disputes"], "Give four reasons."],
    ]),
    T("C8", "C8", "🗒", "Farm planning", "Meaning, factors and importance of farm planning.", [
      ["a", "Meaning of farm planning", ["Deciding in advance what to produce, how, where and when on a farm"], "Define farm planning."],
      ["b", "Factors in farm planning", ["Size of land, soil type, climate, capital, labour, market, transport, security, government policy"], "List factors."],
      ["c", "Importance of farm planning", ["Efficient use of resources, profit, avoids waste, easy management and supervision"], "Give three reasons."],
    ]),
    T("C9", "C9", "🏠", "Principles of farmstead planning", "Meaning, importance, design factors and layout of a farmstead.", [
      ["a", "Meaning of farmstead", ["The area of a farm where buildings and structures are located: house, stores, pens, office, workshop"], "Define farmstead."],
      ["b", "Importance of farmstead planning", ["Saves time and labour, security, hygiene, reduces disease spread, room for expansion"], "Give reasons."],
      ["c", "Factors in the design of a farmstead", ["Topography, drainage, water supply, wind direction, accessibility (road), security, size of enterprise"], "Site selection and location of structures are assessed."],
      ["d", "Farmstead layout", ["Sketching a farm layout: dwelling upwind of animal houses, stores near road, pond downslope"], "Sketch a farm layout."],
    ]),
  ];

  const D = [
    T("D1", "D1", "🌽", "Classification of crops", "Classification by use, life cycle and morphology.", [
      ["a", "Classification based on uses", ["Cereals, pulses (grain legumes), roots and tubers, vegetables, fruits, beverages, spices, oils, fibres, latex, sugar, forage, drugs"], "Give two examples of each class."],
      ["b", "Classification based on life cycle", ["Ephemeral (a few weeks), annual (one season), biennial (two seasons), perennial (many years)"], "Classify given crops."],
      ["c", "Classification based on morphology", ["Monocotyledons (one seed leaf, parallel veins, fibrous roots): maize, rice, yam", "Dicotyledons (two seed leaves, net veins, tap root): cowpea, cassava, cocoa"], "Distinguish monocots from dicots."],
    ]),
    T("D2", "D2", "🌱", "Husbandry of selected crops", "Botanical and common names, varieties, climate and soil, land preparation, propagation, planting date, seed rate, spacing, sowing depth, nursery, cultural practices, pests and diseases, harvesting, processing and storage of one crop from each group.", [
      ["a", "Cereals (maize, rice, guinea corn, millet)", ["Maize (Zea mays): 75 × 25 cm, 1 seed per hole (or 75 × 50 cm, 2 seeds); 20–25 kg/ha; 2.5–5 cm deep; matures 90–120 days", "Rice (Oryza sativa): upland or swamp; nursery and transplanting at 3–4 weeks"], "A general knowledge of husbandry of all crops listed is presumed."],
      ["b", "Pulses (cowpea, soya bean, pigeon pea)", ["Cowpea (Vigna unguiculata): 60 × 30 cm; 20–30 kg/ha; root nodules fix nitrogen", "Pest control is critical at flowering and podding"], "Pulses add nitrogen to the soil."],
      ["c", "Roots and tubers (cassava, yam, potatoes)", ["Cassava (Manihot esculenta): stem cuttings 20–25 cm, 1 × 1 m (10 000/ha), harvest 9–18 months", "Yam (Dioscorea spp.): setts or minisetts on mounds or ridges, staking, harvest 7–10 months"], "Know propagation materials and spacing."],
      ["d", "Vegetables (tomato, onion, amaranthus, okro, cauliflower, spinach)", ["Tomato (Solanum lycopersicum): nursery, transplant at 3–4 weeks, 60 × 45 cm, staking, harvest at breaker stage", "Okro, amaranthus: direct sowing"], "Nursery practices are assessed."],
      ["e", "Fruits (citrus, banana, pineapple)", ["Citrus: budded seedlings, 6 × 6 m; banana: suckers, 3 × 3 m; pineapple: suckers, slips or crowns"], "Vegetative propagation of fruits."],
      ["f", "Beverages (cocoa, tea, coffee)", ["Cocoa (Theobroma cacao): nursery 4–6 months, 3 × 3 m under shade; harvest, fermentation (5–7 days), drying"], "Processing of cocoa beans is often asked."],
      ["g", "Spices (pepper, ginger)", ["Pepper (Capsicum spp.): nursery then transplant; ginger (Zingiber officinale): rhizome setts, mulching"], "Propagation of each spice."],
      ["h", "Oils (groundnut, sheabutter, sunflower, oil palm)", ["Groundnut (Arachis hypogaea): pegging, harvest by lifting; oil palm (Elaeis guineensis): pre-nursery, nursery, 9 × 9 m triangular"], "Know the oil-producing part of each crop."],
      ["i", "Fibres (cotton, jute, sisal hemp)", ["Cotton (Gossypium spp.): 75 × 30 cm, bollworm control, picking, ginning (lint and seed)"], "Fibre comes from the seed (cotton), stem (jute) or leaf (sisal)."],
      ["j", "Latex (rubber)", ["Rubber (Hevea brasiliensis): budded stumps, tapping (half-spiral cut) from 5–7 years, latex coagulation with acid"], "Tapping is done early in the morning."],
      ["k", "Others: sugar cane", ["Sugar cane (Saccharum officinarum): setts with 2–3 nodes, ratoon crops, harvest at 12–18 months"], "Ratooning: regrowth from stubble."],
    ]),
    T("D3", "D3", "🐄", "Pasture and forage crops", "Meaning, uses, types, common grasses and legumes, factors, establishment and management of pasture.", [
      ["a", "Meaning of pasture and forage crops", ["Pasture: land under grasses and legumes grazed by livestock; forage: plants cut and fed to animals"], "Define both."],
      ["b", "Uses of forage crops", ["Grazing, hay, silage, soilage (cut-and-carry), cover crops, soil improvement"], "List uses."],
      ["c", "Types of pasture", ["Natural (rangeland) and artificial (sown, improved) pastures; temporary and permanent"], "Compare natural and artificial pastures."],
      ["d", "Common grasses and legumes for grazing", ["Grasses: Panicum maximum (guinea grass), Pennisetum purpureum (elephant grass), Cynodon spp., Andropogon gayanus", "Legumes: Stylosanthes, Centrosema pubescens, Pueraria phaseoloides, Calopogonium"], "Botanical names and characteristics are assessed."],
      ["e", "Factors affecting distribution and productivity of pasture", ["Rainfall, temperature, soil fertility, grazing intensity, burning, pests and diseases, management"], "Explain each factor."],
      ["f", "Establishment of pasture", ["Land clearing, ploughing, harrowing, seeding or planting splits at the right rate, fertilizing"], "Steps in establishing a pasture."],
      ["g", "Management practices of pasture", ["Controlled and rotational grazing, fertilizing, weeding, reseeding, irrigation, controlled burning"], "Give four practices."],
    ]),
    T("D4", "D4", "🧬", "Crop improvement", "Aims, methods, Mendel's laws and advantages of crop improvement.", [
      ["a", "Aims of crop improvement", ["Higher yield, better quality, resistance to pests and diseases, early maturity, drought tolerance, adaptation"], "Meaning of crop improvement is assessed."],
      ["b", "Methods of crop improvement", ["Introduction, selection (mass, pure-line), breeding (hybridisation), mutation, genetic engineering"], "Describe each method."],
      ["c", "Mendel's laws of inheritance", ["Genetic terms: character, trait, chromosome, gene, allele, dominant, recessive, genotype, phenotype", "First law (segregation): 3 : 1 in the F2; second law (independent assortment): 9 : 3 : 3 : 1"], "Definition of genetic terms and Mendel's first and second laws are assessed."],
      ["d", "Advantages and disadvantages of crop improvement", ["Advantages: higher yields and resistance; disadvantages: loss of genetic diversity, cost, dependence on seed companies"], "Give two of each."],
    ]),
  ];

  const EF = [
    T("E1", "E1", "🌳", "Forest management", "Meaning, importance, regulations, management practices and implications of deforestation.", [
      ["a", "Meaning of forest and forestry", ["Forest: a large area of land covered by trees; forestry: the science and management of forests"], "Define both."],
      ["b", "Importance of forestry", ["Timber, fuelwood, food, medicine, wildlife habitat, soil and water conservation, climate regulation, tourism, employment"], "Give four."],
      ["c", "Forest regulations", ["Forest reserves, felling permits and licences, girth limits, ban on bush burning, protection of species"], "List regulations."],
      ["d", "Forest management practices", ["Selective exploitation, regeneration (natural and artificial), afforestation, reforestation, thinning, fire control, taungya"], "Describe practices."],
      ["e", "Implications of deforestation", ["Erosion, desertification, loss of biodiversity and wildlife, climate change, flooding, loss of timber and income"], "Explain effects."],
    ]),
    T("E2", "E2", "🌲", "Agro-forestry practices in West Africa", "Meaning of agro-forestry and the practices taungya, alley cropping and ley farming.", [
      ["a", "Meaning of agro-forestry", ["Growing trees together with crops and/or animals on the same land"], "Define agro-forestry."],
      ["b", "Agro-forestry practices", ["Taungya: food crops between young forest trees", "Alley cropping: crops in alleys between hedgerows of leguminous trees (Leucaena, Gliricidia)", "Ley farming: crops alternating with pasture"], "Common tree species suitable for agro-forestry are assessed."],
    ]),
    T("F1", "F1", "🌺", "Meaning and importance of ornamental plants", "What ornamental plants are and why they are grown.", [
      ["a", "Meaning of ornamental plants", ["Plants grown for beauty and decoration of homes, offices, roads and parks"], "Define ornamental plants."],
      ["b", "Importance of ornamental plants", ["Beauty, shade, windbreak, erosion control, privacy and fencing, income, air purification, recreation"], "Give four."],
    ]),
    T("F2", "F2", "🌸", "Common types of ornamental plants", "Types by use and examples with common and botanical names.", [
      ["a", "Types according to use", ["Bedding plants (mostly flowering), hedging plants, lawn grasses, climbers, potted plants, shade trees"], "Identification of types is assessed."],
      ["b", "Examples of ornamental plants", ["Ixora (Ixora coccinea), Bougainvillea, Hibiscus (Hibiscus rosa-sinensis), Duranta, Croton (Codiaeum variegatum), Allamanda, periwinkle (Catharanthus roseus), carpet grass (Axonopus compressus)"], "Common and botanical names are assessed."],
    ]),
    T("F3", "F3", "📍", "Settings and location of ornamental plants", "Where to plant ornamentals.", [
      ["a", "Settings and location for planting ornamental plants", ["Homes, school compounds, roundabouts, road medians, offices, parks, hotels, gardens"], "Match plant type to setting."],
    ]),
    T("F4", "F4", "✂", "Methods of cultivating ornamental plants", "By seed and by vegetative propagation.", [
      ["a", "Cultivation by seed", ["Nursery or seed trays, pricking out, transplanting"], "Importance of each method and examples are assessed."],
      ["b", "Vegetative propagation", ["Cuttings, layering, marcotting (air layering), budding, grafting, suckers, division"], "Give examples propagated by each method."],
    ]),
    T("F5", "F5", "💦", "Maintenance of ornamental plants", "Watering, mulching, pruning and other maintenance operations.", [
      ["a", "Maintenance of ornamental plants", ["Watering, mulching, pruning, trimming, weeding, manuring, mowing, pest and disease control"], "Reasons for maintenance operations are assessed."],
    ]),
  ];

  const G = [
    T("G1", "G1", "🍂", "Diseases of crops", "Meaning and effects of disease; causal organisms, transmission, symptoms and control of diseases of crop groups.", [
      ["a", "Meaning of disease", ["Any condition that disturbs the normal functioning of a plant; caused by fungi, bacteria, viruses, nematodes"], "Define disease."],
      ["b", "General effects of diseases on crop production", ["Reduced yield and quality, death of plants, high cost of control, reduced income and market value"], "Give effects."],
      ["c", "Diseases of crop groups", ["Cereals: smut, rice blast, leaf rust; legumes: Cercospora leaf spot, rosette; beverages: cocoa black pod, swollen shoot, coffee leaf rust", "Tubers: cassava mosaic, bacterial leaf blight; fruits: citrus gummosis, dieback; fibre: black arm of cotton", "Vegetables: root knot (nematode), damping off, onion twister; stored produce: moulds"], "At least two fungal, two viral, two bacterial and one nematode disease are assessed."],
    ]),
    T("G2", "G2", "🐛", "Pests of crops", "Classification of pests, mouthparts, major insect pests, non-insect pests, side effects of control and economic importance.", [
      ["a", "Meaning of pests", ["Any organism that damages crops, stored produce or animals and causes economic loss"], "Define a pest."],
      ["b", "Classification of pests", ["Insect pests and non-insect pests"], "Give examples of each."],
      ["c", "Classification of insect pests by mouthparts", ["Biting and chewing (grasshopper, beetles, caterpillars), piercing and sucking (aphids, bugs, mealybugs), boring (stem borers, weevils)"], "Relate mouthparts to type of damage."],
      ["d", "Important insect pests of major crops", ["Cereals: stem borer, armyworm, ear worm; legumes: pod borer, aphids, sucking bugs, leaf beetle; cocoa: mirids (capsids)", "Tubers: yam beetle, cassava mealybug, green spider mite, variegated grasshopper; fibre: cotton stainer, bollworms", "Fruits and vegetables: thrips, grasshopper, leaf roller, scale insects; stored produce: grain weevils, bean beetle"], "Life cycle, damage and control of each are assessed."],
      ["e", "Non-insect pests", ["Birds, rodents, monkeys, snails, nematodes, mites, man"], "Damage, importance and control are assessed."],
      ["f", "Side effects of preventive and control methods", ["Chemical: pollution, poisoning, resistance; biological: disruption of the ecosystem; cultural: harmful effects of burning"], "Give side effects."],
      ["g", "General effects and economic importance of pests", ["Reduced yield and quality, transmission of diseases, cost of control, loss of income"], "Economic importance of pests."],
    ]),
    T("G3", "G3", "🌿", "Weeds", "Meaning, types, effects, features and control of weeds.", [
      ["a", "Meaning of weeds", ["A plant growing where it is not wanted"], "Define weeds."],
      ["b", "Types of weeds", ["Annual, biennial, perennial; grasses, sedges, broadleaves", "Examples: spear grass (Imperata cylindrica), Siam weed (Chromolaena odorata), goat weed (Ageratum conyzoides), Tridax procumbens, nut grass (Cyperus rotundus)"], "Common and botanical names are assessed."],
      ["c", "Effects of weeds on crops and economy", ["Competition for light, water and nutrients; hosts for pests; reduce yield and quality; increase cost of production", "Some weeds are useful as fodder, medicine or mulch"], "Give harmful and useful effects."],
      ["d", "Characteristic features of weeds", ["Produce many seeds, long seed dormancy, rapid growth, efficient dispersal, deep rhizomes, tolerant of poor conditions"], "Give four features."],
      ["e", "Methods of controlling weeds", ["Cultural (mulching, cover crops, rotation), biological, chemical (herbicides), physical (hand pulling, slashing), mechanical (hoeing, harrowing)"], "Describe each method."],
    ]),
  ];

  const H = [
    T("H1", "H1", "🐐", "Types and classification of farm animals", "Types of farm animals and classification by habitat and use.", [
      ["a", "Types of farm animals", ["Cattle, sheep, goats, poultry, pigs, rabbits, fish, snails, bees, grasscutter"], "Name farm animals in your locality."],
      ["b", "Classification of farm animals", ["By habitat: terrestrial and aquatic; by use: food, work, protection, pets; by stomach: ruminant and non-ruminant"], "Classify given animals."],
    ]),
    T("H2", "H2", "🫀", "Anatomy and physiology of farm animals", "External parts, organs and body systems.", [
      ["a", "Parts of farm animals", ["External parts of cattle, goat, sheep, pig and fowl: poll, muzzle, dewlap, brisket, hock, udder, tail, comb, wattle, shank"], "Drawing and labelling of parts are assessed."],
      ["b", "Organs of farm animals", ["Heart, liver, lungs, kidneys, stomach, intestines, spleen, reproductive organs: functions"], "Identification of important organs and functions are assessed."],
      ["c", "Systems of farm animals", ["Digestive (monogastric, ruminant, poultry), circulatory, respiratory, excretory, reproductive", "Ruminant stomach: rumen, reticulum, omasum, abomasum"], "Digestive system of poultry and differences between monogastric and ruminant systems are assessed."],
    ]),
    T("H3", "H3", "🥚", "Animal reproduction", "Hormones, reproductive systems, processes and egg formation in poultry.", [
      ["a", "Meaning of reproduction", ["Production of young ones to continue the species"], "Define reproduction."],
      ["b", "Roles of hormones in reproduction", ["FSH, LH, oestrogen, progesterone, testosterone, oxytocin, prolactin"], "State the role of each hormone."],
      ["c", "Reproductive systems of farm animals", ["Male: testes, epididymis, vas deferens, accessory glands, penis; female: ovaries, oviduct, uterus, cervix, vagina"], "Label reproductive systems."],
      ["d", "Processes of reproduction", ["Oestrus cycle, heat period, signs of heat, ovulation, mating, gestation, parturition, lactation, colostrum, mammary glands"], "Oestrus cycle, gestation periods and signs of heat are assessed."],
      ["e", "Egg formation in poultry", ["Ovary → infundibulum (fertilisation) → magnum (albumen) → isthmus (shell membranes) → uterus/shell gland (shell) → vagina → cloaca; about 24–26 hours"], "Parts of the oviduct and their functions."],
    ]),
    T("H4", "H4", "🌡", "Environmental physiology", "Effects of climate on growth, reproduction, milk and egg production.", [
      ["a", "Meaning of environmental physiology", ["Study of how animals respond to changes in their environment"], "Define environmental physiology."],
      ["b", "Effects of temperature, humidity and light", ["Heat stress lowers feed intake, growth, milk and egg yield, fertility", "Light (day length) controls laying in poultry and breeding seasons"], "Explain effects of each climatic factor."],
    ]),
    T("H5", "H5", "🏚", "Livestock management", "Requirements, systems and importance of livestock management.", [
      ["a", "Meaning of livestock management", ["Care of farm animals from birth to market: housing, feeding, health, records"], "Define livestock management."],
      ["b", "Requirements: housing, feeding, hygiene and finishing", ["Management of at least one ruminant and one non-ruminant from birth to market weight", "Extensive, semi-intensive and intensive systems; record keeping"], "Assessment includes the three systems and record keeping."],
      ["c", "Importance of management practices", ["Healthy animals, fast growth, high productivity, low mortality, profit"], "Give reasons."],
    ]),
    T("H6", "H6", "🌾", "Animal nutrition", "Feeds, nutrients, rations and malnutrition.", [
      ["a", "Meaning of animal nutrition", ["The process by which animals obtain and use food"], "Define animal nutrition."],
      ["b", "Classification of feeds", ["Roughages (hay, silage, grasses), concentrates (energy and protein), supplements (minerals, vitamins), additives"], "Classify feedstuffs."],
      ["c", "Sources and functions of feed nutrients", ["Carbohydrates and fats (energy), proteins (growth), vitamins, minerals, water"], "Biochemical details are not required."],
      ["d", "Types of ration", ["Balanced ration, maintenance ration, production ration (growth, milk, eggs, work)", "Supplementary feeding"], "Types of diet for classes of animals are assessed."],
      ["e", "Malnutrition and its correction", ["Causes and symptoms: ketosis, rickets, milk fever, anaemia, kwashiorkor-like conditions", "Correction by balanced feeding and supplements"], "Malnutrition-related conditions such as ketosis and rickets are assessed."],
    ]),
    T("H7", "H7", "🌄", "Rangeland and pasture management", "Rangeland, its grasses and legumes, herbage production and improvement.", [
      ["a", "Meaning, importance and characteristics of rangeland", ["Large natural grassland grazed by livestock; cheap feed; mostly in savanna"], "Define rangeland."],
      ["b", "Common grasses and legumes in rangeland", ["Andropogon, Hyparrhenia, Panicum, Pennisetum; Stylosanthes, Centrosema"], "Name examples."],
      ["c", "Factors affecting herbage production", ["Rainfall, grass/legume composition, grazing intensity, soil fertility, burning"], "Explain each factor."],
      ["d", "Methods of rangeland improvement", ["Controlled stocking, rotational grazing, fertilizers, introduction of legumes, reseeding, weed control, controlled burning, pest control"], "Describe methods."],
    ]),
    T("H8", "H8", "🐂", "Animal improvement", "Aims and methods of animal improvement and artificial insemination.", [
      ["a", "Meaning of animal improvement", ["Raising the genetic quality of animals for better performance"], "Define."],
      ["b", "Aims of animal improvement", ["Higher meat, milk and egg yields, faster growth, disease resistance, adaptation"], "Give aims."],
      ["c", "Methods: introduction, selection, breeding", ["Inbreeding, line breeding, outbreeding, crossbreeding, upgrading", "Local, exotic and cross/hybrid breeds"], "Differences between local, exotic and crossbred animals are assessed."],
      ["d", "Artificial insemination", ["Meaning, methods of collecting semen (artificial vagina, electro-ejaculation, massage), advantages and disadvantages"], "Give advantages and disadvantages of AI."],
    ]),
    T("H9", "H9", "💉", "Animal health management", "Disease, causal organisms, predisposing factors, selected diseases, parasites and control.", [
      ["a", "Meaning of disease", ["Any departure from normal health of an animal"], "Define disease."],
      ["b", "Causal organisms", ["Viruses, bacteria, fungi and protozoa"], "Give examples."],
      ["c", "Factors predisposing animals to disease", ["Health status, nutrition, management, stress, overcrowding, climate"], "List factors."],
      ["d", "Reaction of animals to diseases", ["Susceptibility and resistance; immunity (natural and acquired)"], "Explain resistance."],
      ["e", "Selected livestock diseases", ["Viral: foot and mouth, rinderpest, Newcastle; bacterial: anthrax, brucellosis, tuberculosis", "Fungal: aspergillosis, ringworm; scabies (mange); protozoan: trypanosomiasis, coccidiosis"], "Economic importance of the diseases is assessed."],
      ["f", "Parasites", ["Endoparasites: tapeworm, liver fluke, roundworm; ectoparasites: ticks, lice", "Mode of transmission, life cycle, economic importance and control"], "Life cycles are assessed."],
      ["g", "General methods of prevention and control", ["Quarantine, vaccination, hygiene, breeding for resistance, drenching, dipping, culling"], "Give methods."],
    ]),
    T("H10", "H10", "🐟", "Aquaculture", "Fish, shrimp and crab farming; siting, establishing and maintaining a fish pond; regulations and fishing methods.", [
      ["a", "Meaning of aquaculture", ["Farming of aquatic organisms (fish, shrimps, crabs, oysters) under controlled conditions"], "Define aquaculture."],
      ["b", "Types of aquaculture", ["Fish farming, shrimp farming, crab farming"], "Name types."],
      ["c", "Meaning and importance of fish farming", ["Protein, income, employment, foreign exchange, use of swampy land"], "Give importance."],
      ["d", "Conditions for siting a fish pond", ["Clay soil that holds water, gentle slope, reliable water supply, free from flooding and pollution, accessible, secure"], "List conditions."],
      ["e", "Establishment and maintenance of a fish pond", ["Clearing, digging, liming, fertilizing, filling, stocking (e.g. tilapia, catfish), feeding, aeration", "Harvesting, processing and preservation"], "Aeration, stocking, feeding, harvesting, processing and preservation are assessed."],
      ["f", "Fishery regulations", ["Mesh size, closed seasons, licences, ban on poisons and explosives"], "Meaning and regulations."],
      ["g", "Fishing methods and tools", ["Hook and line, cast net, drag net, gill net, traps, baskets"], "Identify tools."],
    ]),
    T("H11", "H11", "🐝", "Apiculture (bee keeping)", "Types of bees, importance, methods, equipment and precautions.", [
      ["a", "Meaning of apiculture", ["Keeping bees for honey, wax and pollination"], "Define apiculture."],
      ["b", "Types of bees", ["Indigenous (African honey bee) and exotic (European) bees; queen, workers, drones"], "Compare types."],
      ["c", "Importance of bee keeping", ["Honey, beeswax, propolis, royal jelly, pollination, income"], "Give importance."],
      ["d", "Methods of bee keeping", ["Traditional (log, pot hives) and modern (Kenya top-bar, Langstroth hives)"], "Compare methods."],
      ["e", "Bee keeping equipment", ["Hives, hive tools, bee suits, veil, smokers, jungle boots, gloves, brushes"], "Identify equipment."],
      ["f", "Precautions in bee keeping", ["Locate apiaries away from homes, warning signs, protective clothing, work calmly"], "Give precautions."],
    ]),
  ];

  const I = [
    T("I1", "I1", "🪙", "Basic economic principles", "Scarcity, choice, scale of preference and the law of diminishing returns.", [
      ["a", "Scarcity", ["Resources are limited relative to human wants"], "Define scarcity."],
      ["b", "Choice", ["Choosing between alternatives; opportunity cost is the next best alternative forgone"], "Define opportunity cost."],
      ["c", "Scale of preference", ["A list of wants arranged in order of importance"], "Use a scale of preference."],
      ["d", "Law of diminishing returns", ["As more units of a variable input are added to a fixed input, output first rises and then additional output (marginal product) falls"], "Read TPP, APP and MPP curves."],
    ]),
    T("I2", "I2", "🏗", "Factors of production", "Land, capital, labour and management.", [
      ["a", "Land", ["Reward: rent; fixed in supply"], "State the reward of each factor."],
      ["b", "Capital", ["Man-made goods used in production: fixed and working capital; reward: interest"], "Distinguish fixed from working capital."],
      ["c", "Labour", ["Characteristics and classification (skilled, semi-skilled, unskilled; family, hired); reward: wages", "Rural–urban migration reduces farm labour"], "Rural–urban migration and labour availability are assessed."],
      ["d", "Management (entrepreneur)", ["Organises the other factors and bears risk; reward: profit"], "Functions of the entrepreneur."],
    ]),
    T("I3", "I3", "📉", "Principles of demand", "Definition, law, factors, movements along and shifts of the demand curve.", [
      ["a", "Definition of demand", ["Quantity of a commodity consumers are willing and able to buy at a given price and time"], "Define demand."],
      ["b", "Law of demand", ["The higher the price, the lower the quantity demanded, other things being equal"], "State the law."],
      ["c", "Factors affecting demand for agricultural produce", ["Price, income, population, tastes, prices of substitutes and complements, season, advertisement"], "List factors."],
      ["d", "Movements along the demand curve", ["Caused only by a change in the price of the commodity"], "Extension and contraction of demand."],
      ["e", "Shifts in the demand curve", ["Caused by changes in other factors (income, population, taste)"], "Increase and decrease in demand."],
    ]),
    T("I4", "I4", "📈", "Principles of supply", "Definition, law, movements, shifts and factors affecting supply.", [
      ["a", "Definition of supply", ["Quantity producers are willing and able to offer for sale at a given price and time"], "Define supply."],
      ["b", "Law of supply", ["The higher the price, the higher the quantity supplied, other things being equal"], "State the law."],
      ["c", "Movements along the supply curve", ["Caused only by a change in price"], "Extension and contraction of supply."],
      ["d", "Shifts in the supply curve", ["Caused by changes in other factors (weather, input costs, technology)"], "Increase and decrease in supply."],
      ["e", "Factors affecting supply of agricultural produce", ["Price, weather, cost of inputs, technology, pests and diseases, government policy, season, number of producers"], "List factors."],
    ]),
    T("I5", "I5", "🏷", "Implications of demand and supply", "Price support, price control and subsidy.", [
      ["a", "Price support", ["Government fixes a minimum price above equilibrium; buys surpluses"], "Effect: surplus."],
      ["b", "Price control", ["Government fixes a maximum price below equilibrium"], "Effect: shortage and black market."],
      ["c", "Subsidy programme and its effects", ["Reduces production cost; supply shifts right; more output, lower price"], "Effects of subsidy on production."],
    ]),
    T("I6", "I6", "👨‍🌾", "Functions of a farm manager", "Meaning and functions of a farm manager.", [
      ["a", "Meaning of a farm manager", ["The person who plans, organises and controls farm resources to achieve the farm's goals"], "Meaning of farm management is assessed."],
      ["b", "Functions of a farm manager", ["Planning, organising, directing, coordinating, controlling, record keeping, marketing, decision making"], "List functions."],
    ]),
    T("I7", "I7", "🧩", "Problems faced by farm managers", "Problems in managing a farm.", [
      ["a", "Problems faced by farm managers", ["Inadequate capital, labour problems, price fluctuations, weather, pests and diseases, poor records, marketing, theft, government policy"], "List problems and solutions."],
    ]),
    T("I8", "I8", "🏦", "Agricultural finance", "Meaning, importance, sources, classes of credit, problems and the capital market.", [
      ["a", "Meaning of agricultural finance", ["Provision and use of money for agricultural production"], "Define."],
      ["b", "Importance of agricultural finance", ["Buy inputs and machinery, expand, adopt technology, pay labour"], "Give importance."],
      ["c", "Sources of farm finance", ["Personal savings, family and friends, cooperatives, money lenders, commercial banks, agricultural banks, government, NGOs"], "Name sources."],
      ["d", "Classes of farm credit", ["By time: short (under 1 year), medium (1–5 years), long (over 5 years); by source: institutional and non-institutional; by liquidity: cash and kind"], "Classify loans."],
      ["e", "Problems farmers face in getting credit", ["High interest rates, lack of collateral, illiteracy, bureaucracy, small farm size"], "List problems."],
      ["f", "Problems institutions face in granting loans", ["Lack of records and accounts, loan diversion, default, high cost of administration, risk"], "List problems."],
      ["g", "Capital market", ["Market for medium and long-term funds: stock exchange, bonds, shares, insurance companies, merchant banks", "Roles: mobilises long-term funds, reduces over-reliance on the money market"], "Meaning of agri-business is assessed."],
    ]),
    T("I9", "I9", "📒", "Farm records and accounts", "Importance and types of records, designing records, and farm accounts.", [
      ["a", "Importance of farm records", ["Measure performance, plan, obtain loans, assess tax, settle disputes"], "Give importance."],
      ["b", "Types of farm records", ["Inventory, production, income and expenditure, supplementary (feeding, health, labour, breeding)"], "Name types."],
      ["c", "Designing farm records", ["Columns: date, item, quantity, unit cost, total, remarks"], "Design a record."],
      ["d", "Farm accounts", ["Purchases/expenditure, sales/income, profit and loss account, balance sheet", "Terms: salvage value, appreciation, depreciation, farm budget, inventory"], "Depreciation and profit or loss calculations are assessed."],
    ]),
    T("I10", "I10", "🛒", "Marketing of agricultural produce", "Meaning, agents, functions, export crops and problems of marketing.", [
      ["a", "Meaning and importance of marketing", ["All activities that move produce from farm to consumer"], "Define marketing."],
      ["b", "Marketing agents and their functions", ["Producers, middlemen (wholesalers, retailers), cooperatives, commodity boards, agents"], "Advantages and disadvantages of marketing agents are assessed."],
      ["c", "Marketing functions", ["Assembling, grading, standardisation, processing, packaging, storage, transportation, financing, advertising, risk bearing"], "List functions."],
      ["d", "Marketing of export crops", ["Grading, licensed buying agents, shipping, quality control"], "Describe how export crops are marketed."],
      ["e", "Export crops in West Africa", ["Cocoa, oil palm, rubber, cotton, groundnut, coffee, cashew, sesame, ginger, shea nuts"], "Name export crops by country."],
      ["f", "Guidelines for exporting crops", ["Registration, quality standards, phytosanitary certificates, export documents, licences"], "List guidelines."],
      ["g", "Bodies engaged in exporting", ["Corporate bodies, cooperative societies (e.g. ANCE), individuals"], "Give examples."],
      ["h", "Importance of exporting produce", ["Foreign exchange, income, employment, market for surplus"], "Give importance."],
      ["i", "Problems of marketing agricultural produce", ["Poor roads and storage, perishability, price fluctuation, middlemen exploitation, poor grading"], "List problems."],
    ]),
    T("I11", "I11", "🛡", "Agricultural insurance", "Meaning, importance, policies, premium and problems.", [
      ["a", "Meaning of agricultural insurance", ["A contract in which the insurer agrees to compensate the farmer for losses in return for a premium"], "Define."],
      ["b", "Importance of agricultural insurance", ["Protection against loss, security for loans, encourages investment, stability of income"], "Give importance."],
      ["c", "Types of insurance policies", ["Crop, livestock, farm vehicle, fire/buildings and machines, life assurance"], "Name policies."],
      ["d", "Insurance premium", ["The amount paid by the insured to the insurer: premium = rate × sum insured"], "Calculate a premium."],
      ["e", "Problems of agricultural insurance", ["Weather uncertainty, natural disasters, fraud, high premiums, illiteracy, delay in claims"], "List problems."],
    ]),
    T("I12", "I12", "📣", "Agricultural extension", "Meaning, methods, programmes and problems of extension.", [
      ["a", "Meaning and importance of agricultural extension", ["Educating farmers on improved practices; links research and farmers"], "Qualities of a good extension worker are assessed."],
      ["b", "Agricultural extension methods", ["Individual contact (farm visits), group contact (demonstrations, field days), mass media (radio, TV, posters)"], "Compare methods."],
      ["c", "Extension programmes in West Africa", ["ADP, NDE, agro-service centres, state ministries of agriculture"], "Name programmes."],
      ["d", "Problems of agricultural extension", ["Illiteracy of farmers, inadequate transport, few extension workers, poor funding, language barriers"], "List problems."],
    ]),
  ];

  const P = [
    T("PA", "P-A", "🔬", "Practical: agricultural ecology", "Paper 3 — soil samples, soil profile, rocks, laboratory work on physical and chemical properties of soil, irrigation and drainage equipment.", [
      ["1", "Soil samples (texture by feel, fertile vs infertile)", ["Examine wet and dry soil for texture by manual feeling", "Compare fertile and infertile soils: colour, texture, structure, organic matter, living things"], "Soil samples are examined for texture by manual feeling."],
      ["2", "Soil profile", ["Simple description and identification of soil profile"], "Identify horizons."],
      ["3", "Rocks", ["Identification of common igneous, sedimentary and metamorphic rocks"], "Identify rock specimens."],
      ["4a", "Mechanical analysis: sedimentation, hydrometer, sieves", ["Separate soil into sand, silt and clay fractions"], "Describe the sedimentation test."],
      ["4b", "Bulk density and total pore space", ["Bulk density = mass of dry soil ÷ total volume; porosity = (1 − bulk density ÷ particle density) × 100"], "Calculate porosity."],
      ["4c", "Moisture content of a moist soil", ["% moisture = (wet mass − dry mass) ÷ dry mass × 100"], "Calculate moisture content."],
      ["4d", "Maximum water holding capacity", ["Water held after free drainage ÷ dry soil mass × 100"], "Describe the experiment."],
      ["4e", "Wilting point", ["Soil moisture at which plants wilt and do not recover overnight"], "Describe the experiment."],
      ["4f", "Capillary action", ["Rise of water in tubes of sand, loam and clay"], "Compare capillarity."],
      ["5a", "Soil acidity (pH)", ["Using a pH meter, indicator or test paper"], "Read and interpret pH."],
      ["5b", "Chemical fertilizers", ["Identification, methods and rates of application of N, P, K and compound fertilizers"], "Calculate fertilizer quantities."],
      ["5d", "Organic manure (green, farmyard, compost)", ["Identification, method of preparation and application of compost"], "Describe compost making."],
      ["6", "Irrigation and drainage equipment", ["Watering can, sprinkler, pump, pipes, hose, drip lines"], "Identification and uses."],
    ]),
    T("PB", "P-B", "🛠", "Practical: engineering and mechanisation", "Paper 3 — farm tools, tractor and animal-drawn implements, harvesting and processing equipment, tractor, horticultural tools, livestock and fishing equipment, survey equipment.", [
      ["1", "Farm tools and equipment", ["Hoe, cutlass, trowel, hand fork, shovel, spade, rake, sickle, secateurs, shears, long-handle hoe, pruner, budding knife, emasculator"], "Identification, description, uses and maintenance."],
      ["2", "Tractor and animal-drawn implements", ["Ploughs, harrows, ridgers, planters, cultivators and their major parts"], "Identify implements and parts."],
      ["3", "Harvesting, processing and storage equipment", ["Dehuskers, shellers, winnowers, dryers, processors, graters, refrigerators, scythe, groundnut lifters"], "Identification and uses."],
      ["4", "Farm tractor", ["Major components, servicing and maintenance"], "Identify components."],
      ["5", "Horticultural tools", ["Shears, dibber, pruning knife, secateurs, budding knife, measuring tape, hand fork, hand trowel, hoe, fork"], "Uses and maintenance."],
      ["6", "Livestock and fishing equipment", ["Waterers, feeders, milking machines, nets, hook and line, branding machine, egg candler"], "Identification, uses and care."],
      ["7", "Farm surveying equipment", ["Measuring tape, pins/arrows, ranging poles, plumb bob, offset staff, compass, Gunter's chain, pegs, theodolite"], "Identification, uses and care."],
    ]),
    T("PC", "P-C", "🌻", "Practical: crop production", "Paper 3 — seeds and storage organs, pests and diseases, seed rates and tests, cultural practices, forest products, propagation and weeds.", [
      ["1", "Seeds, seedlings, fruits and storage organs", ["Identification of seeds, seedlings, fruits, storage organs and parts of crop plants, pasture grasses and legumes"], "Identify specimens."],
      ["2", "Main pests and diseases of crops", ["Field and storage pests (cotton stainer, yam beetle, weevils) and the damage they cause; diseases, causal agents, symptoms and control"], "Identify pests and disease symptoms."],
      ["3", "Planting dates, seed rates, plant population and seed quality tests", ["Calculating plant population and seed rate; viability and purity tests"], "Calculate plant population."],
      ["4", "Seedbeds, fertilizer, mulching, pesticides, watering, propagation, germination tests", ["Germination % = germinated ÷ sown × 100"], "Carry out a germination test."],
      ["5", "Forest products and by-products", ["Timber, poles, fuelwood, charcoal, chewing sticks, gum, resin, rattan, honey, bush meat"], "Identify products."],
      ["6", "Methods of propagation of horticultural plants", ["Direct sowing, transplanting, layering, grafting, budding"], "Describe each method."],
      ["7", "Common weeds", ["External features, mode of dispersal and methods of control"], "Identify weeds."],
    ]),
    T("PD", "P-D", "🐓", "Practical: animal production", "Paper 3 — breeds, internal organs, by-products, feeds, pests and parasites, diseases, routine management practices, fish harvesting and preservation.", [
      ["1", "Common breeds and handling of animals", ["Identification of breeds; methods of restraint, handling and grooming"], "Identify breeds."],
      ["2", "Major internal organs", ["Organs of the digestive, reproductive and excretory systems"], "Identify organs and functions."],
      ["3", "Animal by-products", ["Hides and skin, fur, feathers, horn, hooves, bones, blood, dung"], "Identify by-products."],
      ["4", "Animal feeds and feedstuffs", ["Fish meal, groundnut cake, rice bran, maize, bone meal, blood meal; types of ration"], "Identify feeds and uses."],
      ["5", "Pests and parasites of farm animals", ["Ectoparasites (ticks, lice) and endoparasites (tapeworm, liver fluke, roundworm): damage, control and life cycles"], "Identify parasites."],
      ["6", "Diseases of farm animals", ["Prevention and control: drugging, drenching, dipping, spraying, farm sanitation"], "Describe control methods."],
      ["7", "Routine management practices", ["Selection, culling, ear-notching, tattooing, branding, debeaking, dehorning, castration"], "Identify tools for routine practices."],
      ["8", "Fish harvesting and preservation", ["Methods of harvesting, processing and preservation: smoking, salting, sun drying, freezing, canning"], "Describe preservation methods."],
    ]),
  ];

  window.AGRIC = {
    order: ["A", "B", "C", "D", "EF", "G", "H", "I", "P"],
    A, B, C, D, EF, G, H, I, P,
    tabs: { A: "Basics", B: "Ecology", C: "Engineering", D: "Crops", EF: "Forest·Ornam.", G: "Protection", H: "Animals", I: "Economics", P: "Practical" },
    labels: { A: "A. Basic concepts", B: "B. Agricultural ecology", C: "C. Agricultural engineering and mechanisation", D: "D. Crop production", EF: "E. Forestry and F. Ornamental plants", G: "G. Crop protection", H: "H. Animal production", I: "I. Agricultural economics and extension", P: "Practical agricultural science (Paper 3)" },
    blurbs: {
      A: "Meaning and importance of agriculture, problems and solutions, farming systems, government, NGOs and land laws.",
      B: "Farm ecosystems, land, environmental factors, rocks, soil formation and properties, nutrients, irrigation, drainage and pollution.",
      C: "Tools, machinery, maintenance, mechanisation, farm power, surveying, farm and farmstead planning.",
      D: "Crop classification, husbandry of the eleven crop groups, pasture and forage, crop improvement and Mendel's laws.",
      EF: "Forest management and agro-forestry; ornamental plants, their uses, propagation and care.",
      G: "Crop diseases, insect and non-insect pests, side effects of control, and weeds.",
      H: "Farm animals, anatomy, reproduction, environment, management, nutrition, rangeland, improvement, health, fish and bees.",
      I: "Economic principles, factors of production, demand and supply, management, finance, records, marketing, insurance and extension.",
      P: "Virtual laboratory and farm stations for every Paper 3 practical item: take readings, calculate, identify specimens.",
    },
  };
})();
