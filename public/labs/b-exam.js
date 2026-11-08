/* b-exam.js — WAEC Biology exam bank for ExamKit.
   Paper 1: 50 objective questions in 50 minutes. Paper 2: short structured answers (one word, a term or a number).
   Topics follow the syllabus sections: core (all candidates) + Section B (Ghana) or Section C (Nigeria, Sierra Leone,
   The Gambia, Liberia). Calculations are generated with fresh numbers each time. */
(function () {
  "use strict";
  const { ri, pick, sig, bank } = window.ExamKit.H;
  const N = (v, n = 3) => sig(v, n);

  /* ---------------- A  Concept of living ---------------- */
  const A = [
    (r) => { const L = ri(30, 120, r), act = pick([20, 25, 40, 50, 60, 80, 100, 150, 200], r), m = L * 1000 / act; return { q: `A drawing of an onion cell is ${L} mm long. The actual cell is ${act} μm long. What is the magnification of the drawing?`, a: N(m), unit: "×", d: [N(L / act), N(act / L * 1000), N(m / 10)], steps: ["Change mm to μm: " + L + " mm = " + L * 1000 + " μm", "Magnification = drawing size ÷ actual size = " + L * 1000 + " ÷ " + act + " = ×" + N(m)] }; },
    (r) => { const e = pick([10, 15], r), o = pick([4, 10, 40, 100], r); return { q: `A microscope has a ×${e} eyepiece and a ×${o} objective. What is the total magnification?`, a: e * o, unit: "×", d: [e + o, e * o * 10, o], steps: ["Total magnification = eyepiece × objective = " + e + " × " + o + " = ×" + e * o] }; },
    (r) => { const s = ri(1, 6, r); return { q: `What is the surface area to volume ratio of a cube-shaped cell with sides of ${s} μm?`, a: N(6 / s), unit: ": 1", d: [N(s / 6), N(6 * s), N(1 / s)], steps: ["SA = 6s² = " + 6 * s * s + " μm²; V = s³ = " + s ** 3 + " μm³", "SA : V = " + 6 * s * s + " ÷ " + s ** 3 + " = " + N(6 / s) + " : 1 — smaller cells have a larger ratio"] }; },
    ...bank([
      { q: "The basic unit of classification is the", a: "species", acc: ["species"], d: ["genus", "family", "kingdom"], steps: ["A species is a group of organisms that can interbreed to produce fertile offspring."] },
      { q: "In the binomial system, the first name of an organism is its", a: "genus", acc: ["genus", "genericname"], d: ["species", "family", "order"], steps: ["e.g. Homo sapiens: Homo = genus, sapiens = species."] },
      { q: "Which organelle is the site of aerobic respiration?", a: "Mitochondrion", acc: ["mitochondrion", "mitochondria"], d: ["Ribosome", "Golgi body", "Chloroplast"], steps: ["Mitochondria release energy (ATP) from food by aerobic respiration."] },
      { q: "Which structure is found in plant cells but NOT in animal cells?", a: "Cell wall", d: ["Cell membrane", "Mitochondrion", "Nucleus"], steps: ["Plant cells have a cellulose cell wall, chloroplasts and a large permanent vacuole."] },
      { q: "Protein synthesis takes place on the", a: "ribosomes", acc: ["ribosome", "ribosomes"], d: ["lysosomes", "centrioles", "vacuoles"], steps: ["Ribosomes (free or on rough endoplasmic reticulum) assemble amino acids into proteins."] },
      { q: "The movement of water molecules from a dilute solution to a concentrated solution through a selectively permeable membrane is", a: "osmosis", acc: ["osmosis"], d: ["diffusion", "active transport", "plasmolysis"], steps: ["Osmosis is a special case of diffusion of water across a partially permeable membrane."] },
      { q: "When a plant cell is placed in a concentrated salt solution, the cytoplasm shrinks away from the cell wall. This is called", a: "plasmolysis", acc: ["plasmolysis"], d: ["turgidity", "haemolysis", "crenation"], steps: ["Water leaves the vacuole by osmosis; the membrane pulls away from the wall."] },
      { q: "Red blood cells placed in distilled water swell and burst. This is", a: "haemolysis", acc: ["haemolysis", "hemolysis"], d: ["crenation", "plasmolysis", "osmoregulation"], steps: ["Water enters by osmosis; animal cells have no wall to resist bursting."] },
      { q: "Active transport differs from diffusion because it", a: "requires energy from respiration", d: ["needs a concentration gradient", "only moves water", "is faster in dead cells"], steps: ["Active transport moves substances AGAINST a concentration gradient using ATP and carrier proteins."] },
      { q: "Which structure removes excess water from Amoeba?", a: "Contractile vacuole", acc: ["contractilevacuole"], d: ["Food vacuole", "Pseudopodium", "Nucleus"], steps: ["Fresh water enters by osmosis; the contractile vacuole expels it."] },
      { q: "Paramecium moves by means of", a: "cilia", acc: ["cilia"], d: ["flagella", "pseudopodia", "setae"], steps: ["Thousands of beating cilia cover the cell surface."] },
      { q: "The products of anaerobic respiration in yeast are", a: "ethanol and carbon dioxide", d: ["lactic acid only", "water and carbon dioxide", "oxygen and glucose"], steps: ["Glucose → 2 ethanol + 2 CO₂ + small amount of energy (fermentation)."] },
      { q: "Lactic acid accumulates in human muscles during vigorous exercise because of", a: "anaerobic respiration", d: ["aerobic respiration", "photosynthesis", "deamination"], steps: ["Oxygen debt: lactic acid is later oxidised when oxygen is available."] },
      { q: "The growth movement of a plant part in response to the direction of light is", a: "phototropism", acc: ["phototropism"], d: ["geotropism", "hydrotropism", "phototaxis"], steps: ["Shoots are positively phototropic: auxin collects on the shaded side and causes more growth there."] },
      { q: "The hormone responsible for tropic responses in shoots is", a: "auxin", acc: ["auxin", "iaa"], d: ["gibberellin", "ethylene", "abscisic acid"], steps: ["Auxin (indole acetic acid) stimulates cell elongation in shoots."] },
      { q: "The division of a cell nucleus that produces four haploid daughter cells is", a: "meiosis", acc: ["meiosis"], d: ["mitosis", "binary fission", "budding"], steps: ["Meiosis halves the chromosome number to form gametes."] },
      { q: "In which stage of mitosis do chromosomes line up on the equator of the spindle?", a: "Metaphase", acc: ["metaphase"], d: ["Prophase", "Anaphase", "Telophase"], steps: ["Prophase → Metaphase (equator) → Anaphase (chromatids separate) → Telophase."] },
      { q: "Yeast reproduces asexually by", a: "budding", acc: ["budding"], d: ["binary fission", "spore formation only", "conjugation"], steps: ["A bud grows out of the parent cell and separates."] },
      { q: "Which of the following is a colonial organism?", a: "Volvox", d: ["Amoeba", "Hydra", "Spirogyra"], steps: ["Volvox is a hollow ball of many similar cells living together."] },
      { q: "A group of similar cells performing the same function is a", a: "tissue", acc: ["tissue"], d: ["organ", "system", "organism"], steps: ["Cell → tissue → organ → system → organism."] },
      { q: "Which kingdom contains organisms with no true nucleus?", a: "Monera", acc: ["monera", "prokaryotae", "bacteria"], d: ["Protista", "Fungi", "Plantae"], steps: ["Bacteria (Monera) are prokaryotes."] },
      { q: "Fungi differ from plants in that fungi", a: "lack chlorophyll", d: ["have cell walls", "reproduce by spores", "are multicellular"], steps: ["Fungi are heterotrophic: saprophytic or parasitic."] },
    ]),
  ];

  /* ---------------- S  Tissues and body systems ---------------- */
  const S = [
    (r) => { const hr = ri(60, 90, r), sv = ri(60, 90, r); return { q: `A person's heart beats ${hr} times per minute and pumps ${sv} cm³ of blood per beat. Calculate the cardiac output in dm³ per minute.`, a: N(hr * sv / 1000), unit: "dm³/min", d: [N(hr * sv / 100), N(hr * sv / 10000), N((hr + sv) / 10)], steps: ["Cardiac output = heart rate × stroke volume", hr + " × " + sv + " = " + hr * sv + " cm³ = " + N(hr * sv / 1000) + " dm³ per minute"] }; },
    (r) => { const d = ri(20, 90, r), t = ri(2, 10, r); return { q: `In a potometer, the air bubble moves ${d} mm in ${t} minutes. What is the rate of water uptake in mm per minute?`, a: N(d / t), unit: "mm/min", d: [N(d * t), N(t / d), N(d / t / 60)], steps: ["Rate = distance ÷ time = " + d + " ÷ " + t + " = " + N(d / t) + " mm/min"] }; },
    (r) => { const tv = pick([400, 450, 500, 550], r), f = ri(12, 18, r); return { q: `A person takes ${f} breaths per minute with a tidal volume of ${tv} cm³. What volume of air is breathed in per minute (in dm³)?`, a: N(f * tv / 1000), unit: "dm³", d: [N(f * tv / 100), N(tv / f), N(f + tv / 1000)], steps: ["Ventilation rate = breaths/min × tidal volume = " + f + " × " + tv + " = " + f * tv + " cm³ = " + N(f * tv / 1000) + " dm³"] }; },
    ...bank([
      { q: "The joint at the shoulder is a", a: "ball and socket joint", d: ["hinge joint", "gliding joint", "pivot joint"], steps: ["Allows movement in all planes."] },
      { q: "Which tissue joins muscle to bone?", a: "Tendon", acc: ["tendon", "tendons"], d: ["Ligament", "Cartilage", "Synovial membrane"], steps: ["Tendons (inelastic) join muscle to bone; ligaments join bone to bone."] },
      { q: "The exoskeleton of insects is made of", a: "chitin", acc: ["chitin"], d: ["cellulose", "keratin", "calcium phosphate"], steps: ["Insects must moult (ecdysis) to grow."] },
      { q: "Which plant tissue provides mechanical support by having walls thickened with lignin?", a: "Sclerenchyma", acc: ["sclerenchyma"], d: ["Parenchyma", "Collenchyma", "Phloem"], steps: ["Sclerenchyma fibres and xylem vessels are lignified."] },
      { q: "The blood vessel that carries oxygenated blood from the lungs to the heart is the", a: "pulmonary vein", acc: ["pulmonaryvein"], d: ["pulmonary artery", "aorta", "vena cava"], steps: ["The pulmonary vein is the only vein carrying oxygenated blood."] },
      { q: "Which chamber of the heart has the thickest muscular wall?", a: "Left ventricle", acc: ["leftventricle"], d: ["Right ventricle", "Left atrium", "Right atrium"], steps: ["It pumps blood round the whole body through the aorta."] },
      { q: "Blood clotting is helped by", a: "platelets", acc: ["platelets", "thrombocytes"], d: ["erythrocytes", "lymphocytes", "plasma proteins only"], steps: ["Platelets release thrombokinase → fibrinogen becomes fibrin threads."] },
      { q: "Water moves up the xylem mainly due to", a: "transpiration pull", d: ["root pressure only", "active transport", "translocation"], steps: ["Evaporation from leaves pulls a continuous water column (cohesion–tension)."] },
      { q: "Transport of manufactured food in plants is called", a: "translocation", acc: ["translocation"], d: ["transpiration", "guttation", "osmosis"], steps: ["Sugars move in the phloem sieve tubes."] },
      { q: "Which condition INCREASES the rate of transpiration?", a: "Wind", d: ["High humidity", "Low temperature", "Darkness"], steps: ["Wind removes humid air around the stomata, steepening the diffusion gradient."] },
      { q: "Gaseous exchange in insects takes place through", a: "tracheoles", acc: ["tracheae", "tracheoles", "trachealsystem"], d: ["gills", "lungs", "skin only"], steps: ["Air enters spiracles → tracheae → tracheoles that reach the tissues."] },
      { q: "During inspiration in humans, the diaphragm", a: "contracts and flattens", d: ["relaxes and domes upwards", "stays still", "pushes the ribs down"], steps: ["Thoracic volume increases, pressure falls, air rushes in."] },
      { q: "The functional unit of the kidney is the", a: "nephron", acc: ["nephron"], d: ["ureter", "glomerulus only", "renal artery"], steps: ["About one million nephrons per kidney filter blood."] },
      { q: "Ultrafiltration in the kidney takes place in the", a: "glomerulus", acc: ["glomerulus", "bowmanscapsule"], d: ["loop of Henle", "collecting duct", "ureter"], steps: ["High pressure forces small molecules out of the glomerulus into Bowman's capsule."] },
      { q: "Which hormone increases the reabsorption of water in the kidney?", a: "ADH", acc: ["adh", "antidiuretichormone", "vasopressin"], d: ["Insulin", "Adrenaline", "Thyroxine"], steps: ["ADH from the pituitary makes collecting ducts more permeable to water."] },
      { q: "Urea is formed in the", a: "liver", acc: ["liver"], d: ["kidney", "bladder", "pancreas"], steps: ["Deamination of excess amino acids in the liver forms urea."] },
      { q: "When the body is too hot, skin arterioles", a: "dilate (vasodilation)", d: ["constrict", "close completely", "produce sweat"], steps: ["More blood flows near the surface, losing heat by radiation."] },
      { q: "The excretory organ of the earthworm is the", a: "nephridium", acc: ["nephridium", "nephridia"], d: ["flame cell", "Malpighian tubule", "kidney"], steps: ["Flame cells: flatworms; Malpighian tubules: insects."] },
    ]),
  ];

  /* ---------------- R  Coordination and reproduction ---------------- */
  const R = bank([
    { q: "Which gland is called the 'master gland'?", a: "Pituitary", acc: ["pituitary", "pituitarygland"], d: ["Thyroid", "Adrenal", "Pancreas"], steps: ["It controls many other endocrine glands."] },
    { q: "Lack of iodine in the diet causes", a: "goitre", acc: ["goitre", "goiter"], d: ["diabetes", "rickets", "scurvy"], steps: ["Iodine is needed to make thyroxine; the thyroid swells."] },
    { q: "Insulin is produced by the", a: "islets of Langerhans in the pancreas", d: ["adrenal cortex", "thyroid gland", "liver"], steps: ["Insulin lowers blood glucose."] },
    { q: "The 'fight or flight' hormone is", a: "adrenaline", acc: ["adrenaline", "epinephrine"], d: ["insulin", "oestrogen", "thyroxine"], steps: ["Raises heart rate, breathing and blood glucose."] },
    { q: "The part of the brain that controls balance and coordination of movement is the", a: "cerebellum", acc: ["cerebellum"], d: ["cerebrum", "medulla oblongata", "hypothalamus"], steps: ["Medulla: breathing and heartbeat; cerebrum: thought and voluntary actions."] },
    { q: "In a reflex arc, the neurone that carries impulses from the receptor to the spinal cord is the", a: "sensory neurone", acc: ["sensoryneurone", "sensoryneuron", "afferentneurone"], d: ["motor neurone", "relay neurone", "effector"], steps: ["Receptor → sensory neurone → relay neurone → motor neurone → effector."] },
    { q: "The junction between two neurones is a", a: "synapse", acc: ["synapse"], d: ["dendrite", "node of Ranvier", "axon"], steps: ["Neurotransmitter chemicals cross the synaptic gap."] },
    { q: "Light-sensitive cells that detect colour are the", a: "cones", acc: ["cones", "conecells"], d: ["rods", "ganglion cells", "iris muscles"], steps: ["Rods work in dim light; cones need bright light and detect colour."] },
    { q: "Short-sightedness (myopia) is corrected with a", a: "concave (diverging) lens", d: ["convex lens", "cylindrical lens", "bifocal plane lens"], steps: ["The eyeball is too long, so images form in front of the retina."] },
    { q: "Which part of the ear converts vibrations into nerve impulses?", a: "Cochlea", acc: ["cochlea"], d: ["Eardrum", "Ossicles", "Semicircular canals"], steps: ["Semicircular canals detect balance."] },
    { q: "Fertilisation in humans normally takes place in the", a: "oviduct (fallopian tube)", acc: ["oviduct", "fallopiantube"], d: ["uterus", "vagina", "ovary"], steps: ["The zygote then moves to the uterus and implants."] },
    { q: "Which hormone causes ovulation?", a: "LH", acc: ["lh", "luteinisinghormone", "luteinizinghormone"], d: ["FSH", "Progesterone", "Oxytocin"], steps: ["A surge of LH around day 14 releases the egg."] },
    { q: "The structure through which substances are exchanged between mother and foetus is the", a: "placenta", acc: ["placenta"], d: ["amnion", "umbilical vein only", "chorion"], steps: ["Maternal and foetal blood do not mix."] },
    { q: "A grasshopper develops by", a: "incomplete metamorphosis", d: ["complete metamorphosis", "no metamorphosis", "budding"], steps: ["Egg → nymph → adult (no pupa)."] },
    { q: "The correct sequence in the life cycle of a housefly is", a: "egg → larva → pupa → adult", d: ["egg → nymph → adult", "larva → egg → pupa → adult", "egg → pupa → larva → adult"], steps: ["Complete metamorphosis."] },
    { q: "The male part of a flower is the", a: "stamen", acc: ["stamen", "androecium"], d: ["pistil", "sepal", "ovule"], steps: ["Stamen = anther + filament."] },
    { q: "Flowers pollinated by wind usually have", a: "feathery stigmas hanging outside the flower", d: ["bright coloured petals", "scent and nectar", "sticky pollen"], steps: ["Large amounts of light, smooth pollen are produced."] },
    { q: "After fertilisation, the ovary develops into the", a: "fruit", acc: ["fruit"], d: ["seed", "testa", "endosperm"], steps: ["The ovule becomes the seed."] },
    { q: "Which fruit is dispersed by explosive mechanism?", a: "Balsam", d: ["Coconut", "Tridax", "Mango"], steps: ["Pods dry and split violently; coconut — water; Tridax — wind; mango — animals."] },
    { q: "A fruit formed from the ovary only is a", a: "true fruit", acc: ["truefruit"], d: ["false fruit", "multiple fruit", "aggregate fruit"], steps: ["False fruits (e.g. cashew apple) include other floral parts."] },
  ]);

  /* ---------------- B  Nutrition ---------------- */
  const B = [
    (r) => { const c = ri(20, 80, r), p = ri(5, 30, r), f = ri(2, 20, r), E = c * 17 + p * 17 + f * 39; return { q: `A meal contains ${c} g carbohydrate, ${p} g protein and ${f} g fat. Using 17 kJ/g for carbohydrate and protein and 39 kJ/g for fat, calculate the energy value.`, a: E, unit: "kJ", d: [(c + p + f) * 17, c * 17 + p * 17 + f * 17, (c + p) * 39 + f * 17], steps: ["(" + c + " + " + p + ") × 17 + " + f + " × 39", "= " + (c + p) * 17 + " + " + f * 39 + " = " + E + " kJ"] }; },
    (r) => { const sp = pick([["human (adult)", [2, 1, 2, 3]], ["dog", [3, 1, 4, 2.5]], ["pig", [3, 1, 4, 3]]], r); if (sp[0] === "dog") return { q: "The dental formula of a dog is i 3/3, c 1/1, pm 4/4, m 2/3. How many teeth does it have?", a: 42, d: [44, 40, 36], steps: ["Upper: 3+1+4+2 = 10; lower: 3+1+4+3 = 11", "Total = 2 × (10 + 11) = 42"] }; const [i, cc, pm, m] = sp[1], tot = 2 * 2 * (i + cc + pm + m); return { q: `The dental formula of a ${sp[0]} is i ${i}/${i}, c ${cc}/${cc}, pm ${pm}/${pm}, m ${m}/${m}. What is the total number of teeth?`, a: tot, d: [tot / 2, tot - 4, tot + 4], steps: ["Teeth on one side of one jaw = " + (i + cc + pm + m), "Total = " + (i + cc + pm + m) + " × 4 = " + tot] }; },
    ...bank([
      { q: "The raw materials for photosynthesis are", a: "carbon dioxide and water", d: ["oxygen and glucose", "carbon dioxide and oxygen", "water and starch"], steps: ["6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ in light with chlorophyll."] },
      { q: "The gas given off during photosynthesis comes from", a: "water", acc: ["water"], d: ["carbon dioxide", "glucose", "chlorophyll"], steps: ["Photolysis of water in the light stage releases oxygen."] },
      { q: "Before testing a leaf for starch, it is boiled in alcohol to", a: "remove chlorophyll", d: ["kill the leaf", "soften the cuticle", "add starch"], steps: ["Boiling in water kills cells; warm alcohol decolourises the leaf."] },
      { q: "Iodine solution turns blue-black with", a: "starch", acc: ["starch"], d: ["glucose", "protein", "fat"], steps: ["Iodine test for starch."] },
      { q: "Benedict's solution gives a brick-red precipitate with", a: "reducing sugars", acc: ["reducingsugar", "reducingsugars", "glucose"], d: ["starch", "proteins", "fats"], steps: ["The sample is heated with Benedict's solution."] },
      { q: "The Biuret test turns purple in the presence of", a: "protein", acc: ["protein", "proteins"], d: ["starch", "fat", "glucose"], steps: ["Add NaOH then dilute copper(II) sulfate."] },
      { q: "A translucent spot on paper indicates the presence of", a: "fats and oils", d: ["protein", "starch", "vitamin C"], steps: ["The grease-spot test; Sudan III also stains fat red."] },
      { q: "Deficiency of vitamin C causes", a: "scurvy", acc: ["scurvy"], d: ["rickets", "beriberi", "night blindness"], steps: ["Bleeding gums; found in citrus fruits."] },
      { q: "Rickets is caused by lack of", a: "vitamin D (and calcium)", d: ["vitamin A", "vitamin B₁", "iron"], steps: ["Bones become soft and bend."] },
      { q: "Kwashiorkor is caused by a diet lacking", a: "protein", acc: ["protein", "proteins"], d: ["carbohydrate", "vitamins", "water"], steps: ["Swollen belly (oedema), discoloured hair."] },
      { q: "The enzyme in saliva digests", a: "starch to maltose", d: ["protein to peptides", "fat to fatty acids", "maltose to glucose"], steps: ["Salivary amylase (ptyalin) works best at about pH 7."] },
      { q: "Pepsin works best in", a: "acidic conditions", d: ["alkaline conditions", "neutral conditions", "the mouth"], steps: ["HCl in the stomach gives about pH 2."] },
      { q: "Bile helps digestion by", a: "emulsifying fats", d: ["digesting proteins", "digesting starch", "killing bacteria only"], steps: ["Bile salts break fat into small droplets for lipase; bile contains no enzymes."] },
      { q: "Most digested food is absorbed in the", a: "ileum", acc: ["ileum", "smallintestine"], d: ["stomach", "colon", "oesophagus"], steps: ["Villi give a huge surface area."] },
      { q: "Enzymes are denatured by", a: "high temperature", d: ["low temperature", "their substrate", "water"], steps: ["Heat changes the shape of the active site permanently."] },
      { q: "Plants need magnesium to make", a: "chlorophyll", acc: ["chlorophyll"], d: ["proteins", "cellulose", "starch"], steps: ["Lack of Mg causes chlorosis (yellow leaves)."] },
      { q: "An organism that feeds on dead organic matter is a", a: "saprophyte", acc: ["saprophyte", "saprotroph", "decomposer"], d: ["parasite", "symbiont", "autotroph"], steps: ["e.g. mushrooms, Rhizopus, many bacteria."] },
      { q: "Insectivorous plants trap insects to obtain", a: "nitrogen", acc: ["nitrogen", "nitrates"], d: ["carbon", "water", "oxygen"], steps: ["They grow in nitrogen-poor soils (e.g. sundew, pitcher plant)."] },
      { q: "The gap between incisors and premolars in a goat is the", a: "diastema", acc: ["diastema"], d: ["carnassial", "crown", "pulp cavity"], steps: ["It allows the tongue to move grass about."] },
    ]),
  ];

  /* ---------------- C  Ecology ---------------- */
  const C = [
    (r) => { const M = ri(20, 80, r), Cc = ri(20, 80, r), R2 = ri(4, Math.min(M, Cc) - 2, r), Np = Math.round(M * Cc / R2); return { q: `In a capture–recapture study, ${M} grasshoppers were marked and released. Later ${Cc} were caught, of which ${R2} were marked. Estimate the population.`, a: Np, d: [M + Cc, Math.round(M * R2 / Cc), M * Cc], steps: ["Lincoln index: N = M × C ÷ R", "= " + M + " × " + Cc + " ÷ " + R2 + " ≈ " + Np] }; },
    (r) => { const E = pick([10000, 20000, 50000, 100000], r), lv = ri(2, 4, r), e = E * Math.pow(0.1, lv); return { q: `Producers in a food chain fix ${E.toLocaleString("en-GB")} kJ. If 10% passes to each trophic level, how much energy reaches trophic level ${lv + 1}?`, a: e, unit: "kJ", d: [E * Math.pow(0.1, lv - 1), E * Math.pow(0.1, lv + 1), E / (lv + 1)], steps: ["Each step keeps 10%: " + E + " × 0.1^" + lv + " = " + e + " kJ"] }; },
    (r) => { const n = ri(5, 15, r), tot = ri(n * 3, n * 12, r), area = n; return { q: `${n} quadrats of 1 m² were thrown at random. A total of ${tot} plants of a species were counted. What is the density of the species?`, a: N(tot / area), unit: "per m²", d: [tot, N(area / tot), tot * area], steps: ["Density = total number ÷ total area = " + tot + " ÷ " + area + " = " + N(tot / area) + " per m²"] }; },
    ...bank([
      { q: "The non-living components of an ecosystem are described as", a: "abiotic factors", acc: ["abiotic", "abioticfactors"], d: ["biotic factors", "producers", "consumers"], steps: ["e.g. temperature, light, rainfall, soil, pH."] },
      { q: "Relative humidity is measured with a", a: "hygrometer", acc: ["hygrometer", "wetanddrybulbthermometer"], d: ["anemometer", "barometer", "rain gauge"], steps: ["Wet-and-dry bulb thermometer (psychrometer)."] },
      { q: "Wind speed is measured with an", a: "anemometer", acc: ["anemometer"], d: ["hygrometer", "wind vane", "secchi disc"], steps: ["A wind vane shows direction only."] },
      { q: "The turbidity (clarity) of water is measured with a", a: "Secchi disc", acc: ["secchidisc", "secchidisk"], d: ["pH meter", "hydrometer", "quadrat"], steps: ["The depth at which the disc disappears is recorded."] },
      { q: "In the food chain grass → grasshopper → lizard → hawk, the secondary consumer is the", a: "lizard", acc: ["lizard"], d: ["grasshopper", "hawk", "grass"], steps: ["Primary consumer = grasshopper; tertiary = hawk."] },
      { q: "A pyramid of numbers may be inverted when", a: "one large tree supports many insects", d: ["grass is eaten by cattle", "energy flows to decomposers", "carnivores eat herbivores"], steps: ["Pyramids of ENERGY are never inverted."] },
      { q: "The relationship between Rhizobium and leguminous plants is", a: "mutualism", acc: ["mutualism", "symbiosis"], d: ["parasitism", "commensalism", "predation"], steps: ["Both benefit: the plant gets nitrogen compounds, bacteria get food and shelter."] },
      { q: "The association between the remora fish and the shark is", a: "commensalism", acc: ["commensalism"], d: ["parasitism", "mutualism", "competition"], steps: ["One benefits, the other is unharmed."] },
      { q: "Water hyacinth spreading over a lake is an example of", a: "an invasive plant blocking light and oxygen", d: ["primary succession on rock", "biological control", "a climax community"], steps: ["It reduces light and dissolved oxygen, killing fish."] },
      { q: "Eutrophication of a lake is mainly caused by", a: "fertiliser and sewage run-off", d: ["acid rain", "oil spills", "noise"], steps: ["Nitrates and phosphates → algal bloom → decay → low oxygen → fish die."] },
      { q: "The first organisms to colonise bare rock are usually", a: "lichens", acc: ["lichens", "lichen"], d: ["grasses", "trees", "ferns"], steps: ["Pioneer species begin primary succession."] },
      { q: "The stable final community in an ecological succession is the", a: "climax community", acc: ["climax", "climaxcommunity"], d: ["pioneer community", "seral stage", "niche"], steps: ["e.g. tropical rain forest."] },
      { q: "Which factor is density-dependent?", a: "Disease", d: ["Flood", "Volcanic eruption", "Frost"], steps: ["Disease spreads faster in crowded populations."] },
      { q: "Food is preserved by salting because salt", a: "draws water out of microorganisms by osmosis", d: ["kills all viruses directly", "adds nutrients", "raises the temperature"], steps: ["Microbes are dehydrated and cannot grow."] },
      { q: "Malaria is caused by", a: "Plasmodium", acc: ["plasmodium"], d: ["a virus", "Trypanosoma", "a bacterium"], steps: ["Transmitted by female Anopheles mosquitoes."] },
      { q: "Cholera is transmitted mainly through", a: "contaminated water and food", d: ["mosquito bites", "droplets in air", "sexual contact"], steps: ["Caused by the bacterium Vibrio cholerae."] },
      { q: "Antibiotics are effective against", a: "bacteria", acc: ["bacteria"], d: ["viruses", "all fungi and worms", "allergies"], steps: ["e.g. penicillin from the fungus Penicillium."] },
      { q: "Immunity gained after vaccination is", a: "artificial active immunity", d: ["natural passive immunity", "artificial passive immunity", "natural active immunity"], steps: ["The body makes its own antibodies after the vaccine."] },
    ]),
  ];

  /* ---------------- D  Conservation ---------------- */
  const D = bank([
    { q: "Which is a renewable natural resource?", a: "Forests", d: ["Petroleum", "Coal", "Iron ore"], steps: ["Renewable resources can be replaced naturally if managed well."] },
    { q: "Planting trees on land that has never had forest is", a: "afforestation", acc: ["afforestation"], d: ["reforestation", "deforestation", "shifting cultivation"], steps: ["Reforestation replants where forest was removed."] },
    { q: "A major effect of deforestation is", a: "soil erosion", d: ["more rainfall", "more wildlife", "less carbon dioxide"], steps: ["Roots no longer bind soil; run-off increases."] },
    { q: "Areas set aside to protect wildlife and their habitats are", a: "game reserves and national parks", d: ["timber plantations", "grazing lands", "mining sites"], steps: ["e.g. Yankari (Nigeria), Mole (Ghana), Gola (Sierra Leone)."] },
    { q: "Contour ploughing helps to", a: "reduce soil erosion on slopes", d: ["increase run-off", "kill weeds", "add nitrogen"], steps: ["Ridges across the slope slow water flow."] },
    { q: "Which agency protects endangered species internationally?", a: "IUCN", acc: ["iucn"], d: ["WHO", "OPEC", "ECOWAS"], steps: ["International Union for Conservation of Nature (with CITES controlling trade)."] },
    { q: "The killing of animals in excess of the natural replacement rate is", a: "over-exploitation (overhunting)", d: ["conservation", "domestication", "migration"], steps: ["It leads to extinction."] },
  ]);

  /* ---------------- E  Variation ---------------- */
  const E = [
    (r) => { const v = Array.from({ length: 6 }, () => ri(140, 180, r)), m = v.reduce((a, b) => a + b, 0) / 6; return { q: `The heights (cm) of six students are ${v.join(", ")}. What is the mean height?`, a: N(m, 4), unit: "cm", d: [N(Math.max(...v) - Math.min(...v), 4), N(m + 5, 4), N((Math.max(...v) + Math.min(...v)) / 2 + 3, 4)], steps: ["Mean = sum ÷ number = " + v.reduce((a, b) => a + b, 0) + " ÷ 6 = " + N(m, 4) + " cm"] }; },
    ...bank([
      { q: "Height in humans shows", a: "continuous variation", acc: ["continuous", "continuousvariation"], d: ["discontinuous variation", "no variation", "only environmental variation"], steps: ["A range of values with intermediates; plotted as a histogram/normal curve."] },
      { q: "Which is an example of discontinuous variation?", a: "ABO blood group", d: ["Height", "Body mass", "Skin colour"], steps: ["Distinct classes with no intermediates."] },
      { q: "The ability to roll the tongue is an example of", a: "discontinuous variation", acc: ["discontinuous", "discontinuousvariation"], d: ["continuous variation", "acquired character", "mutation"], steps: ["People either can or cannot."] },
      { q: "A person with blood group O can donate blood to", a: "people of all ABO groups", d: ["group O only", "group AB only", "groups A and B only"], steps: ["Group O has no A or B antigens — universal donor."] },
      { q: "A person with blood group AB is called a universal", a: "recipient", acc: ["recipient"], d: ["donor", "carrier", "agglutinin"], steps: ["AB plasma has no anti-A or anti-B antibodies."] },
      { q: "Fingerprints are useful in crime detection because they", a: "are unique to each individual", d: ["change with age", "are inherited identically by siblings", "show blood group"], steps: ["Patterns: arches, loops, whorls."] },
      { q: "Variation caused only by the environment is described as", a: "acquired", acc: ["acquired", "environmental"], d: ["inherited", "genetic", "discontinuous"], steps: ["e.g. scars, muscles developed by exercise."] },
    ]),
  ];

  /* ---------------- F  Genetics ---------------- */
  const F = [
    (r) => { const n = pick([40, 80, 100, 120, 200, 400], r); return { q: `Two heterozygous tall pea plants (Tt × Tt) produced ${n} seedlings. How many are expected to be dwarf?`, a: n / 4, d: [n / 2, (3 * n) / 4, n / 8], steps: ["Tt × Tt → TT : Tt : tt = 1 : 2 : 1", "Dwarf (tt) = ¼ × " + n + " = " + n / 4] }; },
    (r) => { const n = pick([16, 32, 64, 160, 320], r); return { q: `In a dihybrid cross RrYy × RrYy, ${n} offspring were produced. How many are expected to be wrinkled and green (rryy)?`, a: n / 16, d: [(9 * n) / 16, (3 * n) / 16, n / 4], steps: ["Ratio 9 : 3 : 3 : 1", "rryy = 1/16 × " + n + " = " + n / 16] }; },
    (r) => { const sc = pick([["Aa × aa", 50], ["Aa × Aa", 25], ["AA × aa", 0], ["aa × aa", 100]], r); return { q: `Albinism is recessive (a). What percentage of the children of parents ${sc[0]} are expected to be albino?`, a: sc[1], unit: "%", d: [25, 50, 75, 0, 100].filter((x) => x !== sc[1]).slice(0, 3), steps: ["Draw the Punnett square and count aa squares.", "Result: " + sc[1] + "%"] }; },
    ...bank([
      { q: "Alternative forms of a gene are called", a: "alleles", acc: ["alleles", "allele", "allelomorphs"], d: ["chromosomes", "loci", "genotypes"], steps: ["e.g. T (tall) and t (dwarf)."] },
      { q: "An organism with two identical alleles for a trait is", a: "homozygous", acc: ["homozygous"], d: ["heterozygous", "hybrid", "recessive"], steps: ["TT or tt."] },
      { q: "The physical appearance of an organism is its", a: "phenotype", acc: ["phenotype"], d: ["genotype", "karyotype", "allele"], steps: ["Genotype = the genes present."] },
      { q: "The monohybrid F₂ phenotypic ratio obtained by Mendel was", a: "3 : 1", acc: ["3:1", "31"], d: ["1 : 2 : 1", "9 : 3 : 3 : 1", "1 : 1"], steps: ["From Tt × Tt."] },
      { q: "Crossing an organism of unknown genotype with a homozygous recessive is a", a: "test cross", acc: ["testcross", "backcross"], d: ["monohybrid cross", "dihybrid cross", "self-pollination"], steps: ["All dominant offspring → homozygous; 1 : 1 → heterozygous."] },
      { q: "The base that pairs with adenine in DNA is", a: "thymine", acc: ["thymine", "t"], d: ["guanine", "cytosine", "uracil"], steps: ["A–T and G–C; in RNA, uracil replaces thymine."] },
      { q: "The number of chromosomes in a normal human body cell is", a: "46", acc: ["46"], d: ["23", "44", "48"], steps: ["23 pairs; gametes have 23."] },
      { q: "In humans the sex of a child is determined by the", a: "father's sperm", d: ["mother's egg", "temperature", "the mother's age"], steps: ["Sperm carry X or Y; eggs always carry X."] },
      { q: "A woman who carries the haemophilia allele but is normal is", a: "a carrier", acc: ["carrier", "acarrier"], d: ["homozygous recessive", "affected", "a mutant male"], steps: ["XᴴXʰ."] },
      { q: "A colour-blind man marries a normal (non-carrier) woman. Their sons will be", a: "all normal", d: ["all colour-blind", "half colour-blind", "all carriers"], steps: ["Sons get the mother's X (normal) and father's Y."] },
      { q: "Genes on the same chromosome that tend to be inherited together are", a: "linked", acc: ["linked", "linkage"], d: ["dominant", "codominant", "mutated"], steps: ["Crossing over can separate them."] },
      { q: "Sickle-cell anaemia in a person with genotype HbS HbS is an example of", a: "an inherited disorder", d: ["an infectious disease", "a nutritional deficiency", "an acquired character"], steps: ["HbA HbS carriers have sickle-cell trait and some protection from malaria."] },
      { q: "The production of identical copies of an organism is", a: "cloning", acc: ["cloning"], d: ["hybridisation", "mutation", "crossing over"], steps: ["e.g. tissue culture of plants, Dolly the sheep."] },
    ]),
  ];

  /* ---------------- G  Evolution and adaptation ---------------- */
  const G = bank([
    { q: "In a termite colony, the caste that reproduces is the", a: "king and queen", d: ["workers", "soldiers", "nymphs only"], steps: ["Workers build and feed; soldiers defend."] },
    { q: "Worker honeybees are", a: "sterile females", d: ["fertile males", "fertile females", "sterile males"], steps: ["Drones are males; the queen is the fertile female."] },
    { q: "The theory of 'use and disuse' and inheritance of acquired characters was proposed by", a: "Lamarck", acc: ["lamarck"], d: ["Darwin", "Mendel", "Wallace"], steps: ["Darwin proposed natural selection."] },
    { q: "Darwin's theory of evolution is based on", a: "natural selection", acc: ["naturalselection"], d: ["use and disuse", "spontaneous generation", "special creation"], steps: ["Variation, overproduction, struggle for existence, survival of the fittest."] },
    { q: "Fossils provide evidence of evolution because they", a: "show organisms changing through rock layers", d: ["are always complete", "are found only in sea water", "show identical forms in all layers"], steps: ["Older, simpler forms appear in lower strata."] },
    { q: "The forelimbs of a bat, whale and human are", a: "homologous structures", acc: ["homologous", "homologousstructures"], d: ["analogous structures", "vestigial structures", "acquired characters"], steps: ["Same basic bone plan (pentadactyl limb), different functions."] },
    { q: "The wings of a bird and a butterfly are", a: "analogous structures", acc: ["analogous", "analogousstructures"], d: ["homologous structures", "vestigial organs", "fossils"], steps: ["Same function, different origin."] },
    { q: "The increase of dark peppered moths in polluted industrial areas illustrates", a: "natural selection", acc: ["naturalselection", "industrialmelanism"], d: ["use and disuse", "mutation pressure only", "artificial selection"], steps: ["Dark moths were better camouflaged on sooty trees."] },
    { q: "The human appendix is an example of a", a: "vestigial organ", acc: ["vestigial", "vestigialorgan"], d: ["homologous organ", "analogous organ", "fossil"], steps: ["A reduced structure with little or no function."] },
  ]);

  /* ---------------- Section B (Ghana) ---------------- */
  const GH1 = bank([
    { q: "A tentative explanation that can be tested by experiment is a", a: "hypothesis", acc: ["hypothesis"], d: ["theory", "law", "conclusion"], steps: ["Observation → problem → hypothesis → experiment → results → conclusion."] },
    { q: "In an experiment, the set-up that is identical except for the factor being tested is the", a: "control", acc: ["control", "controlexperiment"], d: ["variable", "hypothesis", "replicate"], steps: ["It allows a fair comparison."] },
    { q: "The variable that the investigator deliberately changes is the", a: "independent variable", acc: ["independent", "independentvariable"], d: ["dependent variable", "controlled variable", "constant"], steps: ["The dependent variable is what is measured."] },
    { q: "An animal that can be cut into two mirror halves along only one plane shows", a: "bilateral symmetry", acc: ["bilateral", "bilateralsymmetry"], d: ["radial symmetry", "asymmetry", "spherical symmetry"], steps: ["e.g. insects, fish, mammals."] },
    { q: "A section cut across the long axis of an organ is a", a: "transverse section", acc: ["transversesection", "ts"], d: ["longitudinal section", "vertical section", "median section"], steps: ["T.S. across; L.S. along the length."] },
    { q: "The part of a microscope used for final sharp focusing at high power is the", a: "fine adjustment knob", acc: ["fineadjustment", "fineadjustmentknob"], d: ["coarse adjustment knob", "diaphragm", "mirror"], steps: ["Using the coarse knob at high power can break the slide."] },
    { q: "The branch of biology that studies insects is", a: "entomology", acc: ["entomology"], d: ["ornithology", "mycology", "ichthyology"], steps: ["Ornithology — birds; mycology — fungi; ichthyology — fish."] },
  ]);
  const GH2 = bank([
    { q: "Engulfing of solid particles by a cell is", a: "phagocytosis", acc: ["phagocytosis"], d: ["pinocytosis", "exocytosis", "osmosis"], steps: ["e.g. white blood cells engulfing bacteria."] },
    { q: "The release of enzymes from a cell in vesicles is", a: "exocytosis", acc: ["exocytosis"], d: ["endocytosis", "pinocytosis", "diffusion"], steps: ["Vesicles from the Golgi body fuse with the membrane."] },
    { q: "The sugar in DNA is", a: "deoxyribose", acc: ["deoxyribose"], d: ["ribose", "glucose", "sucrose"], steps: ["RNA contains ribose."] },
    { q: "DNA replication is described as semi-conservative because", a: "each new molecule has one old and one new strand", d: ["both strands are new", "only half the genes copy", "it happens in half the cells"], steps: ["The double helix unzips and each strand is a template."] },
    { q: "The process of copying a DNA base sequence into mRNA is", a: "transcription", acc: ["transcription"], d: ["translation", "replication", "mutation"], steps: ["Occurs in the nucleus."] },
    { q: "A sequence of three bases on mRNA that codes for one amino acid is a", a: "codon", acc: ["codon", "triplet"], d: ["anticodon", "gene", "nucleotide"], steps: ["tRNA carries the matching anticodon."] },
    { q: "The longest phase of the cell cycle is", a: "interphase", acc: ["interphase"], d: ["prophase", "metaphase", "anaphase"], steps: ["DNA replicates during interphase (S phase)."] },
  ]);
  const GH3 = bank([
    { q: "Euglena is regarded as both plant-like and animal-like because it", a: "has chloroplasts and can also feed heterotrophically", d: ["has a cell wall", "moves by pseudopodia", "has no nucleus"], steps: ["It photosynthesises but has no cellulose wall and moves by a flagellum."] },
    { q: "Paramecium reproduces sexually by", a: "conjugation", acc: ["conjugation"], d: ["budding", "binary fission", "sporulation"], steps: ["Two cells exchange micronuclei."] },
    { q: "In Spirogyra, the chloroplasts are", a: "spiral bands", d: ["cup-shaped", "star-shaped", "absent"], steps: ["Hence the name Spirogyra."] },
    { q: "The black dots on mouldy bread are the", a: "sporangia of Rhizopus", d: ["zygospores", "rhizoids", "stolons"], steps: ["Each sporangium releases many spores."] },
    { q: "The dominant generation in a fern is the", a: "sporophyte", acc: ["sporophyte"], d: ["gametophyte", "prothallus", "protonema"], steps: ["In mosses the gametophyte is dominant."] },
    { q: "The brown patches under fern leaflets are", a: "sori", acc: ["sori", "sorus"], d: ["stomata", "rhizoids", "gemmae"], steps: ["Sori contain sporangia."] },
  ]);
  const GH4 = bank([
    { q: "Which of these is a vertebrate?", a: "Toad", d: ["Earthworm", "Snail", "Spider"], steps: ["Vertebrates have a backbone."] },
    { q: "Animals with jointed legs and an exoskeleton belong to the phylum", a: "Arthropoda", acc: ["arthropoda", "arthropods"], d: ["Annelida", "Mollusca", "Chordata"], steps: ["Insects, spiders, crustaceans, millipedes."] },
    { q: "A predator–prey graph shows predator numbers peaking", a: "shortly after the prey numbers peak", d: ["before the prey", "at the same time always", "never"], steps: ["More prey → more food → predators increase, then prey fall."] },
    { q: "The organism that lives on or in another and harms it is a", a: "parasite", acc: ["parasite"], d: ["host", "commensal", "saprophyte"], steps: ["e.g. tapeworm, dodder, ticks."] },
  ]);
  const GH5 = [
    (r) => { const b = ri(15, 25, r), t = pick([15, 20, 30], r), hr = b * 60 / t; return { q: `A student counts ${b} pulse beats at the wrist in ${t} seconds. What is the heart rate in beats per minute?`, a: hr, unit: "beats/min", d: [b * t / 10, hr / 2, b * 60], steps: ["Heart rate = beats ÷ time × 60 = " + b + " ÷ " + t + " × 60 = " + hr + " beats/min"] }; },
    ...bank([
      { q: "The natural pacemaker of the heart is the", a: "sino-atrial node", acc: ["sinoatrialnode", "sanode", "san"], d: ["atrio-ventricular node", "bundle of His", "tricuspid valve"], steps: ["Located in the wall of the right atrium."] },
      { q: "The respiratory quotient (RQ) for carbohydrate is", a: "1.0", acc: ["1", "1.0"], d: ["0.7", "0.9", "1.5"], steps: ["RQ = CO₂ produced ÷ O₂ used; fat 0.7, protein 0.9."] },
      { q: "In a respirometer, soda lime is used to", a: "absorb carbon dioxide", d: ["absorb oxygen", "supply oxygen", "kill the organism"], steps: ["Then the movement of the drop shows oxygen uptake."] },
      { q: "Muscle contraction involves the sliding of", a: "actin and myosin filaments", d: ["collagen fibres", "keratin threads", "elastin fibres"], steps: ["Sliding filament theory; needs ATP and calcium ions."] },
      { q: "Breaking of the voice in boys at puberty is caused by", a: "testosterone", acc: ["testosterone"], d: ["oestrogen", "progesterone", "prolactin"], steps: ["The larynx enlarges."] },
      { q: "Pregnant women are given folic acid mainly to", a: "prevent birth defects of the spine", d: ["prevent malaria", "increase milk", "reduce weight"], steps: ["Folic acid prevents neural tube defects."] },
    ]),
  ];
  const GH6 = bank([
    { q: "A plant with parallel leaf veins and fibrous roots is a", a: "monocotyledon", acc: ["monocot", "monocotyledon"], d: ["dicotyledon", "gymnosperm", "fern"], steps: ["e.g. maize, rice, grasses."] },
    { q: "In a dicot stem, the vascular bundles are", a: "arranged in a ring", d: ["scattered", "absent", "only in the pith"], steps: ["Monocot stems have scattered bundles."] },
    { q: "In a floral formula, the symbol G represents the", a: "gynoecium", acc: ["gynoecium", "pistil", "carpels"], d: ["calyx", "corolla", "androecium"], steps: ["K calyx, C corolla, A androecium, G gynoecium."] },
    { q: "Brackets around a number in a floral formula, e.g. A(10), indicate", a: "fused parts", d: ["absent parts", "many parts", "an inferior ovary"], steps: ["∞ means numerous parts."] },
    { q: "The storage organ of yam is a", a: "stem tuber", acc: ["stemtuber", "tuber"], d: ["root tuber", "bulb", "corm"], steps: ["Cassava and sweet potato store food in root tubers."] },
  ]);
  const GH7 = bank([
    { q: "Integrated water resources management aims to", a: "share and protect water for all users sustainably", d: ["use only groundwater", "build as many dams as possible", "stop all irrigation"], steps: ["Considers homes, farming, industry and ecosystems together."] },
    { q: "Which drug is a depressant?", a: "Alcohol", d: ["Cocaine", "Caffeine", "Amphetamine"], steps: ["Depressants slow the nervous system."] },
    { q: "The first thing to do for a minor burn is to", a: "cool it under running water", d: ["apply oil", "burst the blisters", "cover with cotton wool"], steps: ["Cool for about 20 minutes."] },
    { q: "For CPR in adults, chest compressions should be given at a rate of about", a: "100–120 per minute", d: ["20 per minute", "60 per minute", "200 per minute"], steps: ["30 compressions : 2 breaths."] },
    { q: "Blocked gutters in a town increase the spread of", a: "malaria", acc: ["malaria"], d: ["tuberculosis", "goitre", "scurvy"], steps: ["Stagnant water breeds mosquitoes."] },
  ]);
  const GH8 = bank([
    { q: "A high BOD value in a river indicates", a: "heavy organic pollution", d: ["clean water", "high dissolved oxygen", "low bacterial activity"], steps: ["Microbes use much oxygen breaking down organic matter."] },
    { q: "In water treatment, alum is added to", a: "make suspended particles clump and settle", d: ["kill bacteria", "add fluoride", "soften water"], steps: ["Coagulation and flocculation; chlorine kills germs."] },
    { q: "Fish are kept in good condition for longer by", a: "smoking, salting, drying or freezing", d: ["exposing to sunlight in water", "keeping them warm", "washing in river water"], steps: ["These slow microbial growth."] },
    { q: "Using a net with a small mesh size can lead to", a: "overfishing of young fish", d: ["larger fish in future", "cleaner water", "more breeding"], steps: ["Minimum mesh sizes protect immature fish."] },
    { q: "The organism used to make bread rise is", a: "yeast", acc: ["yeast", "saccharomyces"], d: ["Lactobacillus", "Penicillium", "Rhizopus"], steps: ["CO₂ from respiration makes the dough rise."] },
    { q: "Biogas is mainly", a: "methane", acc: ["methane", "ch4"], d: ["hydrogen", "carbon monoxide", "oxygen"], steps: ["About 60% methane, 40% CO₂, from anaerobic digestion."] },
    { q: "Human insulin is now produced commercially by", a: "genetically modified bacteria", d: ["boiling pig pancreas only", "yeast fermentation of sugar", "photosynthesis"], steps: ["The human insulin gene is inserted into bacterial plasmids."] },
  ]);

  /* ---------------- Section C (Nigeria, Sierra Leone, The Gambia, Liberia) ---------------- */
  const WA1 = bank([
    { q: "The statement that 'all cells arise from pre-existing cells' was made by", a: "Virchow", acc: ["virchow", "rudolfvirchow"], d: ["Hooke", "Schleiden", "Schwann"], steps: ["Hooke named cells (1665); Schleiden and Schwann: all organisms are made of cells."] },
    { q: "The movement of a whole organism in response to a directional stimulus is", a: "taxis", acc: ["taxis", "tacticmovement"], d: ["tropism", "nastism", "reflex"], steps: ["e.g. phototaxis of Euglena."] },
    { q: "The folding of Mimosa leaves when touched is", a: "thigmonasty", acc: ["thigmonasty", "seismonasty", "nasticmovement"], d: ["phototropism", "chemotaxis", "geotropism"], steps: ["A nastic movement — not related to the direction of the stimulus."] },
    { q: "Yellowing of the skin and eyes in hepatitis is", a: "jaundice", acc: ["jaundice"], d: ["anaemia", "oedema", "goitre"], steps: ["Bile pigments build up in the blood."] },
    { q: "Kidney failure can be treated by", a: "dialysis", acc: ["dialysis", "haemodialysis", "kidneytransplant"], d: ["vaccination", "antibiotics only", "insulin"], steps: ["An artificial kidney machine removes urea."] },
    { q: "Which part of the body has the smallest two-point threshold?", a: "Fingertip", d: ["Back", "Calf", "Forearm"], steps: ["Touch receptors are densest at the fingertips and lips."] },
    { q: "Substances can only be tasted when they", a: "dissolve in saliva", d: ["are hot", "are solid", "are coloured"], steps: ["Taste buds detect dissolved chemicals."] },
    { q: "Seeds stored in an airtight jar of dry air fail to germinate mainly because they lack", a: "water", acc: ["water", "moisture"], d: ["light", "carbon dioxide", "soil"], steps: ["Germination needs water, oxygen and a suitable temperature."] },
    { q: "Germination in which the cotyledons are carried above the ground is", a: "epigeal", acc: ["epigeal"], d: ["hypogeal", "vivipary", "dormancy"], steps: ["e.g. bean; maize is hypogeal."] },
    { q: "Toads lay many eggs because", a: "fertilisation is external and many eggs are eaten", d: ["they care for the young", "fertilisation is internal", "eggs have shells"], steps: ["Little parental care → many eggs."] },
  ]);
  const WA2 = bank([
    { q: "The conversion of ammonium compounds to nitrites is carried out by", a: "Nitrosomonas", acc: ["nitrosomonas"], d: ["Nitrobacter", "Rhizobium", "Pseudomonas"], steps: ["Nitrobacter then converts nitrite to nitrate."] },
    { q: "Denitrifying bacteria convert", a: "nitrates to nitrogen gas", d: ["nitrogen gas to nitrates", "ammonia to nitrites", "proteins to ammonia"], steps: ["Favoured by waterlogged, anaerobic soils."] },
    { q: "The nitrogen-fixing bacteria in root nodules of legumes are", a: "Rhizobium", acc: ["rhizobium"], d: ["Azotobacter", "Nitrobacter", "Clostridium"], steps: ["Azotobacter and Clostridium are free-living fixers."] },
    { q: "The mouthparts of a housefly are adapted for", a: "sponging", acc: ["sponging", "lapping"], d: ["piercing and sucking", "biting and chewing", "siphoning"], steps: ["The labellum soaks up liquid food."] },
    { q: "The female mosquito has mouthparts for", a: "piercing and sucking", d: ["biting and chewing", "sponging", "siphoning"], steps: ["Stylets pierce skin to suck blood."] },
    { q: "The butterfly feeds on nectar using its", a: "proboscis", acc: ["proboscis"], d: ["mandibles", "labellum", "stylets"], steps: ["A long coiled tube that uncoils."] },
    { q: "Cockroaches have mouthparts adapted for", a: "biting and chewing", d: ["piercing and sucking", "sponging", "siphoning"], steps: ["Strong toothed mandibles."] },
  ]);
  const WA3 = [
    (r) => { const M = ri(30, 90, r), Cc = ri(30, 90, r), R2 = ri(5, 20, r); return { q: `${M} fish were caught, tagged and returned to a pond. A second catch of ${Cc} fish contained ${R2} tagged ones. Estimate the fish population.`, a: Math.round(M * Cc / R2), d: [M + Cc, Math.round(M * R2 / Cc), Math.round(Cc * R2 / M)], steps: ["N = M × C ÷ R = " + M + " × " + Cc + " ÷ " + R2 + " ≈ " + Math.round(M * Cc / R2)] }; },
    ...bank([
      { q: "The percentage of quadrats in which a species occurs is its", a: "frequency", acc: ["frequency"], d: ["density", "cover", "abundance"], steps: ["Density = number per unit area."] },
      { q: "Of the solar energy reaching green plants, the fraction used in photosynthesis is about", a: "1–2%", d: ["50%", "25%", "90%"], steps: ["Most is reflected, transmitted or lost as heat."] },
      { q: "Energy is lost between trophic levels mainly as", a: "heat from respiration", d: ["light", "sound", "chemical energy in oxygen"], steps: ["Also in faeces and uneaten parts."] },
      { q: "Carbon dioxide is returned to the atmosphere by", a: "respiration and combustion", d: ["photosynthesis", "transpiration", "condensation"], steps: ["Also by decomposition."] },
      { q: "Water lost as vapour from leaves is", a: "transpiration", acc: ["transpiration"], d: ["evaporation from the sea", "condensation", "precipitation"], steps: ["Part of the water cycle."] },
      { q: "The range of an environmental factor within which an organism can survive is its", a: "range of tolerance", acc: ["tolerance", "rangeoftolerance", "tolerancerange"], d: ["niche", "habitat", "population"], steps: ["Outside this range the organism dies."] },
      { q: "Bush burning is harmful because it", a: "destroys soil organisms and humus", d: ["adds nitrogen", "increases soil water", "prevents erosion"], steps: ["It also exposes soil to erosion."] },
      { q: "Microorganisms used in yoghurt production are", a: "Lactobacillus bacteria", d: ["yeasts", "viruses", "Plasmodium"], steps: ["They convert lactose to lactic acid."] },
    ]),
  ];
  const WA4 = [
    (r) => { const sc = pick([["Iᴬi × Iᴮi", "O", 25], ["Iᴬi × Iᴮi", "AB", 25], ["Iᴬi × ii", "O", 50], ["IᴬIᴬ × ii", "O", 0], ["Iᴬi × Iᴬi", "A", 75]], r); return { q: `Parents of genotypes ${sc[0]} have a child. What is the percentage chance that the child is blood group ${sc[1]}?`, a: sc[2], unit: "%", d: [0, 25, 50, 75, 100].filter((x) => x !== sc[2]).slice(0, 3), steps: ["Iᴬ and Iᴮ are codominant; i is recessive. Draw the Punnett square.", "Chance = " + sc[2] + "%"] }; },
    ...bank([
    { q: "The blood group called the universal donor is", a: "O", acc: ["o", "groupo", "bloodgroupo"], d: ["A", "B", "AB"], steps: ["Group O red cells carry no A or B antigens."] },
    { q: "A child has blood group O. Which pair could NOT be its parents?", a: "AB and O", d: ["A and B", "A and O", "O and O"], steps: ["An AB parent always passes A or B; the child would be A or B."] },
    { q: "A mother is group A and her child is group B. The father could be", a: "B or AB", d: ["A only", "O only", "A or O"], steps: ["The B allele must come from the father."] },
    { q: "In blood transfusion, agglutination occurs when", a: "donor antigens meet matching recipient antibodies", d: ["plasma is mixed with water", "blood groups are identical", "platelets are added"], steps: ["e.g. group A blood given to a group B person."] },
    { q: "DNA fingerprinting is used in", a: "crime detection and paternity tests", d: ["measuring height", "testing for starch", "counting chromosomes only"], steps: ["DNA band patterns are unique except in identical twins."] },
   ]),
  ];
  const WA5 = bank([
    { q: "Competition between members of the same species is", a: "intraspecific competition", acc: ["intraspecific", "intraspecificcompetition"], d: ["interspecific competition", "predation", "mutualism"], steps: ["It is intense because their needs are identical."] },
    { q: "Seedlings grown very close together tend to be", a: "tall and thin", d: ["short and bushy", "dark green and sturdy", "unaffected"], steps: ["They compete for light, water and nutrients."] },
    { q: "The ability of the chameleon to change colour to match its background is", a: "camouflage", acc: ["camouflage", "cryptic", "crypticcolouration"], d: ["warning colouration", "mimicry", "courtship"], steps: ["It hides from predators and prey."] },
    { q: "Bright colours of poisonous animals that warn predators are", a: "warning (aposematic) colouration", d: ["camouflage", "countershading", "melanism"], steps: ["e.g. some frogs and caterpillars."] },
    { q: "A harmless species resembling a harmful one shows", a: "mimicry", acc: ["mimicry", "batesianmimicry"], d: ["camouflage", "parasitism", "hibernation"], steps: ["Predators avoid both."] },
    { q: "Desert plants such as cactus reduce water loss by having", a: "leaves reduced to spines", d: ["broad thin leaves", "many stomata", "no roots"], steps: ["Also thick cuticle and water storage tissue."] },
  ]);

  const gens = { A, S, R, B, C, D, E, F, G, GH1, GH2, GH3, GH4, GH5, GH6, GH7, GH8, WA1, WA2, WA3, WA4, WA5 };
  const names = { A: "Concept of living", S: "Tissues & body systems", R: "Coordination & reproduction", B: "Nutrition", C: "Ecology", D: "Conservation", E: "Variation", F: "Genetics", G: "Evolution & adaptation", GH1: "B1 Introducing biology", GH2: "B2 Cell biology", GH3: "B3 Simple organisms", GH4: "B4 Diversity & interactions", GH5: "B5 Mammalian physiology", GH6: "B6 Plant structure", GH7: "B7 Humans & environment", GH8: "B8 Biology & industry", WA1: "C1 Concept of living (ext.)", WA2: "C2 Nutrition (ext.)", WA3: "C3 Ecology (ext.)", WA4: "C4 Applications of variation", WA5: "C5 Adaptation" };
  const CORE = ["A", "S", "R", "B", "C", "D", "E", "F", "G"];
  window.BiologyExam = {
    gens, topics: names,
    cfg(course) {
      const keys = CORE.concat(course === "ghana" ? Object.keys(gens).filter((k) => k.startsWith("GH")) : course === "west" ? Object.keys(gens).filter((k) => k.startsWith("WA")) : []);
      const topics = {}; keys.forEach((k) => (topics[k] = names[k]));
      return { subject: "Biology", title: "WAEC Biology — practice" + (course === "ghana" ? " (core + Section B, Ghana)" : course === "west" ? " (core + Section C)" : " (core)"), gens, topics, perQ: { p1: 60, p2: 120 }, lengths: [5, 10, 20, 50],
        p1Label: "Paper 1 — objective (50 in 50 min)", p2Label: "Paper 2 — short structured (type the answer)",
        note: "Timed at WAEC pace: 60 s per objective question (50 questions in 50 minutes) and 2 minutes per structured answer. Typed answers accept the key term (spelling must be correct, e.g. 'osmosis', 'Rhizobium'); numerical answers within 1% are accepted." };
    },
  };
})();
