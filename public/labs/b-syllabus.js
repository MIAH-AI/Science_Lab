/* b-syllabus.js — WAEC Biology examination syllabus as data.
   Section A: all candidates (Papers 1, 2A, 3A). Section B: Ghana only. Section C: Nigeria, Sierra Leone, The Gambia, Liberia.
   Topic codes are unique across sections so simulation keys (code-sub) never collide. */
(function () {
  "use strict";
  const T = (code, glyph, title, desc, subs) => ({ code, glyph, title, desc, subtopics: subs.map(([c, t, content, notes]) => ({ code: c, title: t, content, notes })) });

  const CORE = [
    T("A", "◉", "Concept of Living — cells & life processes", "Living and non-living things, the five kingdoms, levels of organisation, cell structure, the cell and its environment, and the properties of living cells.", [
      ["a", "Classification of living things", ["Living and non-living things; viruses as a link", "Kingdoms Monera, Protoctista, Fungi, Plantae, Animalia", "Differences between plants and animals"], "Major phyla of Protoctista (Rhizopoda, Ciliophora, Euglenophyta, Chlorophyta…), Fungi (Zygomycota, Ascomycota, Basidiomycota), plant divisions (Bryophyta to Angiospermophyta) and animal phyla. External features of cockroach, butterfly, Tilapia, toad, lizard and domestic fowl."],
      ["b", "Organisation of life", ["Levels: cell (Amoeba, Euglena, Paramecium), tissue (Hydra), organ (bulb, rhizome, heart), system", "Complexity of organisation in higher organisms", "Surface area / volume ratio"], "Advantages and disadvantages of complexity; why large organisms need transport and exchange systems."],
      ["c", "Forms in which living cells exist", ["Single and free-living: Amoeba, Paramecium, Euglena, Chlamydomonas", "Colony: Volvox; filament: Spirogyra", "Part of an organism: cheek cells, onion root tip, epidermis of fleshy leaves"], "Distinguish cells forming tissues from those forming colonies or filaments."],
      ["d", "Cell structure and functions", ["Cell wall, membrane, nucleus, cytoplasm", "Organelles: mitochondria, lysosomes, chloroplasts, ER, ribosomes, centrosomes, Golgi bodies, chromosomes", "Similarities and differences between plant and animal cells"], "The function of each organelle should be known."],
      ["e", "The cell and its environment", ["Diffusion", "Osmosis — haemolysis, plasmolysis, turgidity, crenation", "Active transport"], "Significance of these processes as factors that affect cell activities."],
      ["f", "Nutrition in living cells", ["Autotrophic (photosynthesis): Euglena, Chlamydomonas, Spirogyra", "Heterotrophic (holozoic): Amoeba, Paramecium"], "Mention nutrition as a process occurring within living cells."],
      ["g", "Cellular respiration", ["Aerobic and anaerobic respiration", "Simplified glycolysis and Krebs cycle; role of ATP", "Energy release; anaerobic respiration in food processing"], "Glucose + oxygen → carbon dioxide + water + energy (about 38 ATP); anaerobic: about 2 ATP."],
      ["h", "Excretion in single cells", ["Diffusion through the body surface", "Contractile vacuole", "Waste products: carbon dioxide, water, ammonia"], ""],
      ["i", "Growth and tropisms", ["Basis of growth: mitosis, enlargement, differentiation", "Aspects of growth; regions of fastest growth (root and shoot tips)", "Growth hormones and auxins; tropisms"], "Microscopic regions of growth: cell division, elongation, differentiation and maturation. Primary and secondary growth."],
      ["j", "Movement in cells", ["Organelles for movement: cilia and flagella", "Cyclosis (cytoplasmic streaming)"], ""],
      ["k", "Reproduction in cells", ["Asexual: fission, budding, vegetative propagation", "Sexual: conjugation, gametogenesis, fertilisation", "Meiosis"], "Prepared slides of fission in Paramecium, budding in yeast, conjugation in Paramecium and Spirogyra."],
    ]),
    T("S", "♥", "Tissues & Body Systems", "Skeletons and support, transport, respiration, excretion and the regulation of the internal environment in animals and plants.", [
      ["a", "Skeleton and support in animals", ["Biological significance; bone, cartilage, chitin", "Exoskeleton, endoskeleton, hydrostatic skeleton", "Vertebral column, girdles, long bones; joints", "Functions: protection, support, locomotion, respiratory movement"], "Relationship of skeleton and muscles during movement. Detailed skull and bone histology not required."],
      ["b", "Supporting tissues in plants", ["Turgid parenchyma, collenchyma, sclerenchyma, xylem", "Functions: strength, rigidity, flexibility, resilience"], "Cut and draw the T.S. of the stem and root of a herbaceous plant: epidermis, cortex, stele."],
      ["c", "Transport in animals", ["Need for transport: surface area / volume ratio, distance", "Heart, arteries, veins, capillaries", "Composition and functions of blood and lymph", "Materials transported"], "Open circulation in invertebrates; names of vessels carrying excretory products, gases and digested food."],
      ["d", "Transport in plants", ["Uptake and movement of water and mineral salts", "Translocation: pressure flow, cytoplasmic streaming; ringing experiment", "Transpiration: types, factors, rate", "Rise of water: root pressure, cohesion–tension, adhesion"], "Eosin experiment for water uptake; experiments to measure the rate of transpiration."],
      ["e", "Respiratory system", ["Respiratory surfaces: body surface, gills, lungs", "Gaseous exchange in fish, toad, mammals and plants", "Opening and closing of stomata"], "Draw and label the respiratory organs of Tilapia and a small mammal."],
      ["f", "Excretory systems", ["Kidney, stomata and lenticels", "Excretion in plants: water, CO₂, O₂, alkaloids, tannins, gums, resins"], "Draw and label the excretory organs of a small mammal."],
      ["g", "Homeostasis — kidney, liver, skin", ["Kidney: osmoregulation and acid–base balance", "Liver: functions and position", "Skin: structure and temperature regulation"], "Conditions affecting the kidney: water and salt content of the blood, environmental temperature."],
    ]),
    T("R", "✺", "Coordination & Reproduction", "Hormonal and nervous coordination, sense organs, reproduction in mammals, insects and flowering plants.", [
      ["a", "Hormonal coordination", ["Animal hormones: pituitary, thyroid, adrenal, pancreas, gonads", "Effects of over- and under-secretion; thyroxine in toad metamorphosis", "Plant hormones: auxins and their uses"], "Auxins in lateral buds, leaf fall, adventitious roots, crop harvesting and weed control."],
      ["b", "Nervous coordination", ["CNS: cerebrum, cerebellum, medulla, hypothalamus; spinal cord", "Somatic and autonomic systems", "Neurone structure; sensory, motor and relay neurones", "Reflex arc; reflex, voluntary and conditioned actions"], "Experiments on blinking, knee jerk and withdrawal from hot objects."],
      ["c", "Sense organs — eye and ear", ["Structure and function of the eye", "Structure and function of the ear", "Eye defects and their corrections"], "Examine the mammalian eye: shape, colour, optic muscles and optic nerve."],
      ["d", "Reproduction in mammals", ["Male and female reproductive systems", "Gametes; fertilisation, development and birth", "Birth control"], "Draw sperm and ovum from prepared slides."],
      ["e", "Metamorphosis and comparative reproduction", ["Complete metamorphosis: butterfly", "Incomplete metamorphosis: cockroach", "Reproduction in fish, amphibian, reptile, bird and mammal"], "Method of fertilisation, number of eggs and parental care."],
      ["f", "Flowers and pollination", ["Floral parts of insect- and wind-pollinated flowers", "Types and agents of pollination", "Placentation: axile, marginal, parietal"], "Relate the features of the flower to its agent of pollination."],
      ["g", "Fertilisation, fruits and dispersal", ["Development of the zygote; pollen tube", "Classification and structure of fruits", "Agents of dispersal"], "Study sunflower, Combretum, cotton, Crotalaria, Desmodium, Bidens, Tridax and coconut."],
    ]),
    T("B", "❦", "Plant & Animal Nutrition", "Photosynthesis, mineral nutrition, food and diet, food tests, enzymes, modes of nutrition and the alimentary system.", [
      ["a", "Photosynthesis", ["Process and equation; light and dark reactions", "Materials and conditions necessary", "Evidence: starch test"], "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (light, chlorophyll). Fate of the products."],
      ["b", "Mineral requirements of plants", ["Macro-nutrients: C, H, O, N, K, P, Mg, S, Ca, Fe", "Micro-nutrients: Cu, Mn, Zn, B", "Soil and atmosphere as sources"], "Distinguish food produced from mineral elements absorbed."],
      ["c", "Food substances and balanced diet", ["Classes and sources of food", "Balanced diet and its importance", "Malnutrition"], "Relate the balanced diet to your own local diet."],
      ["d", "Food tests", ["Starch, reducing sugar, protein, fats and oils", "Ptyalin changes cooked starch to reducing sugar"], "Iodine, Benedict's/Fehling's, Biuret/Millon's, Sudan III or grease-spot tests."],
      ["e", "Digestive enzymes", ["Classes, characteristics and functions", "Source, site of action, substrate and product", "Effects of pH, temperature and concentration"], "Experiments on enzyme characteristics."],
      ["f", "Modes of nutrition", ["Autotrophic: photosynthesis", "Heterotrophic: holozoic, parasitic, symbiotic, saprophytic"], "Named examples for each mode."],
      ["g", "Alimentary system and dental formula", ["Alimentary tracts of different animals", "Parts of the canal and their functions", "Dental formula; teeth of herbivores, carnivores and humans", "Feeding in protozoa and mammals"], "Dental care in humans."],
    ]),
    T("C", "☘", "Basic Ecological Concepts", "Ecosystems, ecological factors, food webs and energy, decomposition, associations, pollution, succession, populations, microorganisms and public health.", [
      ["a", "Ecosystem and its components", ["Environment, biosphere, habitat, population, community, ecosystem", "Biotic and abiotic components"], "Importance of ecological factors common to all habitats."],
      ["b", "Ecological factors and their measurement", ["Aquatic and terrestrial factors", "Physical: climatic, topographic, gaseous", "Edaphic: soil composition, moisture, texture"], "Measure humidity, temperature, wind speed, rainfall and light intensity."],
      ["c", "Food chains, food webs and trophic levels", ["Producers, consumers, decomposers", "Food chain and food web"], "Use specific aquatic and terrestrial examples."],
      ["d", "Energy flow and ecological pyramids", ["Energy relationships in aquatic and terrestrial environments", "Pyramid of numbers and pyramid of energy"], "Energy transfer is non-cyclic; about 10% passes to the next level."],
      ["e", "Decomposition in nature", ["Micro- and macro-decomposers", "Gaseous products", "Role of decomposers"], "CO₂, H₂S and heat are released during decomposition."],
      ["f", "Biological associations and adaptations", ["Parasitism, symbiosis, commensalism, saprophytism", "Adaptation of organisms to habitats"], "Named examples of each association."],
      ["g", "Pollution", ["Air pollutants: CO, SO₂, oxides of nitrogen, smoke, smog, dust", "Noise", "Water and soil pollutants: detergents, pesticides, fertilisers, sewage, crude oil"], "Health hazards; oil spillage and its effects."],
      ["h", "Ecological succession", ["Changes in species composition and diversity", "Primary and secondary succession; climax community"], "Study succession on abandoned farmland, a lawn or a pond."],
      ["i", "Factors affecting population size", ["Natality, mortality, emigration, immigration", "Food shortage, predation, competition, disease"], ""],
      ["j", "Preservation and storage of food", ["Methods of preserving and storing food", "Ionising radiation", "Local methods: drying, salting, smoking"], "The biological basis of each method."],
      ["k", "Selected insects and pest control", ["Weevils and cotton stainers: features, mode of life, importance", "Physical, chemical and biological control"], "Advantages and disadvantages of each control method."],
      ["l", "Microorganisms, man and health", ["Carriers: housefly, mosquito, tsetse fly", "Beneficial and harmful effects", "Diseases: cholera, measles, malaria, ringworm", "Control: heat, antibiotics, antiseptics, salinity, dehydration"], "Causative organism, mode of transmission and symptoms."],
      ["m", "Public health", ["Refuse and sewage disposal", "Immunisation, vaccination and inoculation"], "Methods of controlling housefly and mosquito."],
    ]),
    T("D", "♻", "Conservation of Natural Resources", "Soil, water, wildlife, forest and minerals; agencies, education, laws and benefits of conservation.", [
      ["a", "Resources and ways of ensuring conservation", ["Resources: soil, water, wildlife, forest, minerals", "Agencies, conservation education and laws", "Benefits and problems: overgrazing, poaching"], "Meaning and need for conservation."],
    ]),
    T("E", "≈", "Variation in Population", "Morphological and physiological variation.", [
      ["a", "Morphological variation", ["Size, height and weight", "Colour of skin, eyes, hair and animal coats", "Fingerprints: arches, loops, whorls, compounds"], "Plot frequency distributions of the heights and weights of pupils of the same age."],
      ["b", "Physiological variation", ["Ability to roll the tongue", "Ability to taste phenylthiocarbamide (PTC)", "ABO blood groups"], "Continuous versus discontinuous variation."],
    ]),
    T("F", "⧉", "Biology of Heredity (Genetics)", "Genetic terms, Mendel's work, chromosomes and DNA, hybrid formation, linkage and sex determination, and applications.", [
      ["a", "Genetic terms and Mendel's work", ["Gene, genotype, phenotype, dominant, recessive, allele, locus, test cross, back cross", "Mendel's experiments: monohybrid and dihybrid", "Mendel's laws"], "Red- and white-flowered peas."],
      ["b", "Chromosomes and DNA", ["Structure of chromosomes", "DNA structure and replication", "Segregation at meiosis and recombination at fertilisation"], "Chromosomes in onion or lily root tips; DNA models."],
      ["c", "Hybrid formation (probability in genetics)", ["Monohybrid and dihybrid crosses", "Expected ratios"], "Computation of probability not required — use Punnett squares."],
      ["d", "Linkage, sex determination and sex-linked characters", ["Linkage", "XX / XY sex determination", "Haemophilia, colour blindness, baldness, hairy ear lobes"], ""],
      ["e", "Applications of heredity", ["Agriculture: cross-breeding, new varieties, in- and out-breeding", "Medicine: marriage counselling — sickle cell anaemia and rhesus factor"], ""],
    ]),
    T("G", "⟁", "Adaptation for Survival & Evolution", "Behaviour in social animals, evidence and theories of evolution.", [
      ["a", "Behavioural adaptations in social animals", ["Termites and bees: castes and division of labour", "Communication; territorial behaviour", "Hibernation and aestivation"], "Identify the castes of social insects."],
      ["b", "Evidence of evolution", ["Fossil records, comparative anatomy, embryology, biochemistry", "Geographical distribution, adaptive radiation", "Role of mutation"], "Trends from simple to complex and aquatic to terrestrial."],
      ["c", "Theories of evolution", ["Lamarck", "Darwin: natural selection"], ""],
    ]),
  ];

  const GHANA = [
    T("GH1", "✎", "Introducing Biology", "Biology as a science, the scientific method, body symmetry and orientation, the microscope and biological drawing.", [
      ["a", "Biology as a science and procedure for biological work", ["Branches of biology; careers", "The scientific method: problem, hypothesis, experiment, record, analyse, conclude", "Writing a report"], "Aim, hypothesis, materials, method, results, discussion, conclusion."],
      ["b", "Body symmetry, sectioning and orientation", ["Bilateral and radial symmetry", "Longitudinal, transverse and vertical sections", "Anterior, posterior, dorsal, ventral, lateral"], ""],
      ["c", "The microscope and biological drawings", ["Parts and care of light microscopes", "Magnification and resolution; measuring with the microscope", "Biological drawings: headings, magnification, labels"], "Magnification = image size ÷ actual size."],
    ]),
    T("GH2", "⧖", "Cell Biology", "Endocytosis and exocytosis, nucleic acids, DNA replication, protein synthesis and the cell cycle.", [
      ["a", "Endocytosis and exocytosis", ["Phagocytosis and pinocytosis", "Exocytosis"], ""],
      ["b", "Nucleic acids, DNA structure and replication", ["DNA and RNA: chemical differences", "Watson–Crick double helix", "DNA replication and transcription"], ""],
      ["c", "Protein synthesis", ["Roles of mRNA, tRNA, rRNA and ribosomes", "Importance; proteins made by humans"], ""],
      ["d", "Cell cycle, mitosis and meiosis", ["Interphase: G₁, S, G₂; M phase", "Mitosis and meiosis and their importance"], "Onion root-tip squash."],
    ]),
    T("GH3", "∿", "Life Processes in Simple Organisms", "Amoeba, Paramecium, Euglena, Spirogyra, Rhizopus, mosses and ferns.", [
      ["a", "Amoeba, Paramecium and Euglena", ["External structure and life processes", "Mounting under the microscope"], ""],
      ["b", "Spirogyra and Rhizopus", ["Structure and life processes", "Reproduction"], ""],
      ["c", "Mosses and ferns", ["Structure", "Alternation of generations"], ""],
    ]),
    T("GH4", "✦", "Diversity & Interactions in Nature", "Characteristics of the major groups and interactions between organisms.", [
      ["a", "Diversity of living things", ["Characteristics of representative groups of plants and animals"], ""],
      ["b", "Interactions in nature", ["Predation, competition, parasitism and mutualism", "Population interactions"], ""],
    ]),
    T("GH5", "☤", "Mammalian Anatomy & Physiology", "The internal organs of a small mammal, the heartbeat, cellular respiration, movement and reproduction.", [
      ["a", "Dissection of a small mammal", ["Positions and functions of the internal organs"], "Rat, mouse or rabbit."],
      ["b", "Transport — the heartbeat", ["Mechanism of the heartbeat: excitation and contraction", "Heart rate and exercise"], ""],
      ["c", "Cellular respiration in mammals", ["Respirometer experiments", "Respiratory quotient"], ""],
      ["d", "Movement — muscles and skeletal tissues", ["Antagonistic muscles", "Muscle contraction"], ""],
      ["e", "Reproduction — secondary sexual characteristics and antenatal care", ["Puberty and secondary sexual characteristics", "Prenatal/antenatal care: nutrition, exercise, check-ups"], ""],
    ]),
    T("GH6", "❀", "Plant Structure & Physiology", "Monocots and dicots, transport and reproduction in flowering plants.", [
      ["a", "Morphology of monocotyledonous and dicotyledonous plants", ["Roots, stems and leaves of monocots and dicots", "Modifications of roots, stems and leaves"], ""],
      ["b", "Transport in flowering plants", ["Xylem and phloem; transpiration stream"], ""],
      ["c", "Reproduction and floral formulae", ["Floral diagrams and formulae of named flowers"], ""],
    ]),
    T("GH7", "☂", "Humans and their Environment", "Integrated water resources management, health and hygiene.", [
      ["a", "Integrated water resources management", ["Sources, uses and conservation of water"], ""],
      ["b", "Health and hygiene — drug abuse, community health, first aid", ["Drug abuse and its effects", "Community hygiene; town planning", "First aid"], ""],
    ]),
    T("GH8", "⚙", "Biology and Industry", "The water, fishing and food industries, agriculture, biotechnology and biofuels.", [
      ["a", "Biology and the water industry", ["Identification of polluted water; BOD", "Waste-water treatment"], "Biochemical oxygen demand measures organic pollution."],
      ["b", "Biology and the fishing industry", ["Fish stock management", "Fish farming"], ""],
      ["c", "Food industry and biotechnology", ["Food additives", "Microorganisms in kenkey, bread and dairy", "Biotechnology"], ""],
      ["d", "Biological fuel generation", ["Biogas from organic waste", "Bioethanol"], ""],
    ]),
  ];

  const WEST = [
    T("WA1", "◎", "Concept of Living (extended)", "Cell theory, irritability, kidney and liver diseases, sense organs, courtship and germination.", [
      ["a", "Cell theory", ["Contributions of Hooke, Dujardin, Schleiden, Schwann and Virchow"], ""],
      ["b", "Irritability — taxis and nastism", ["Types of responses: taxis and nastic movements", "Environmental factors that evoke responses"], ""],
      ["c", "Diseases of the kidney and liver", ["Kidney: nephritis, kidney stones, kidney failure", "Liver: hepatitis, cirrhosis"], ""],
      ["d", "Sense organs — nose, tongue and skin", ["Smell, taste and touch receptors", "Sensitivity of different areas of the skin"], ""],
      ["e", "Courtship and adaptive features in reproduction", ["Pairing and courtship behaviour", "Yolk in eggs of fish, toad and birds; oviparity and viviparity", "Parental care"], ""],
      ["f", "Germination of seeds", ["Essential factors: water, oxygen, suitable temperature", "Epigeal and hypogeal germination"], ""],
    ]),
    T("WA2", "⚘", "Nutrition (extended)", "The nitrogen cycle and feeding habits of animals.", [
      ["a", "Nitrogen cycle", ["Nitrogen fixation, nitrification, denitrification", "Root nodules of leguminous plants"], "Names and roles of the bacteria involved."],
      ["b", "Feeding habits and mechanisms", ["Carnivorous, herbivorous, omnivorous", "Mouthparts: mosquito, housefly, butterfly, cockroach"], ""],
    ]),
    T("WA3", "♒", "Ecology (extended)", "Population sampling, energy, nutrient cycles, habitats, biology in agriculture and microorganisms.", [
      ["a", "Population studies by sampling", ["Population size, dominance, density", "Quadrats and capture–recapture"], ""],
      ["b", "Energy transformation in nature", ["Energy loss in the ecosystem", "Solar radiation intake and loss"], ""],
      ["c", "Carbon and water cycles", ["Processes of the carbon cycle; CO₂–O₂ balance", "Importance of the water cycle"], ""],
      ["d", "Tolerance and habitats", ["Tolerance and limiting factors", "Aquatic and terrestrial habitats; balance in nature"], ""],
      ["e", "Biology in agriculture", ["Classification of plants by life cycle", "Effects of bush burning, fertilisers, pesticides and farming methods"], ""],
      ["f", "Microorganisms around us", ["Microorganisms in air, water, the body and food", "Culturing microorganisms"], ""],
    ]),
    T("WA4", "⚖", "Applications of Variation", "Crime detection, blood transfusion and paternity.", [
      ["a", "Crime detection, blood transfusion and paternity", ["Fingerprints in crime detection", "Blood groups in transfusion", "Blood groups in paternity disputes"], ""],
    ]),
    T("WA5", "⟡", "Evolution — Adaptation", "Competition, structural adaptations and adaptive colouration.", [
      ["a", "Adaptation for survival — competition", ["Intra- and inter-specific competition", "Overcrowding of seedlings"], ""],
      ["b", "Structural adaptation and adaptive colouration", ["Adaptations for food, protection, mates, temperature, water", "Camouflage, warning colouration and mimicry"], ""],
    ]),
  ];

  window.BIO = {
    core: CORE, ghana: GHANA, west: WEST,
    labels: { core: "Section A · All candidates", ghana: "Section B · Ghana", west: "Section C · Nigeria, Sierra Leone, The Gambia, Liberia" },
    blurbs: {
      core: "Nine topics common to every WAEC candidate. Expand any subtopic for its notes and a live, photoreal simulation.",
      ghana: "Topics examined only for candidates in Ghana (Paper 2 Section B and Paper 3 Section B).",
      west: "Topics examined for candidates in Nigeria, Sierra Leone, The Gambia and Liberia (Paper 2 Section C and Paper 3 Section C).",
    },
  };
})();
