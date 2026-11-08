/* g-exam.js — WAEC Geography exam bank for ExamKit.
   Paper 1: objective questions; Paper 2: short structured answers (a term, a place or a number).
   Map-work and Earth calculations are generated with fresh numbers each time. */
(function () {
  "use strict";
  const { ri, pick, sig, bank } = window.ExamKit.H;
  const N = (v, n = 3) => sig(v, n);
  const pad3 = (b) => String(Math.round(b)).padStart(3, "0");

  const MW = [
    (r) => { const rf = pick([25000, 50000, 100000, 250000], r), cm = ri(3, 18, r) / 2, km = cm * rf / 100000; return { q: `On a map of scale 1 : ${rf.toLocaleString("en-GB")}, two towns are ${cm} cm apart. What is the distance on the ground in km?`, a: N(km), unit: "km", d: [N(km * 10), N(km / 10), N(cm * rf / 1000)], steps: ["Ground distance = map distance × scale denominator", cm + " cm × " + rf.toLocaleString("en-GB") + " = " + (cm * rf).toLocaleString("en-GB") + " cm = " + N(km) + " km"] }; },
    (r) => { const km = ri(2, 12, r), cm = ri(4, 24, r); const rf = km * 100000 / cm; return { q: `A road ${km} km long measures ${cm} cm on a map. What is the representative fraction? Give the denominator.`, a: N(rf, 4), unit: "", d: [N(rf * 10, 4), N(rf / 10, 4), N(cm * 100000 / km, 4)], steps: ["RF = map distance ÷ ground distance (same units)", km + " km = " + (km * 100000).toLocaleString("en-GB") + " cm → RF = 1 : " + N(rf, 4).toLocaleString("en-GB")] }; },
    (r) => { const b = ri(10, 350, r), back = (b + 180) % 360; return { q: `The bearing of P from Q is ${pad3(b)}°. What is the bearing of Q from P?`, a: back, unit: "°", d: [(b + 90) % 360, (360 - b) % 360, (b + 270) % 360], steps: ["Back bearing = bearing ± 180°", pad3(b) + "° " + (b < 180 ? "+" : "−") + " 180° = " + pad3(back) + "°"] }; },
    (r) => { const h1 = ri(4, 18, r) * 20, h2 = ri(1, 3, r) * 20, km = ri(2, 8, r) / 2, n = km * 1000 / (h1 - h2); return { q: `Point A is ${h1} m above sea level and B is ${h2} m. They are ${km} km apart on the map. Calculate the average gradient as 1 in n (give n).`, a: N(n), unit: "", d: [N(n * 10), N(n / 10), N((h1 - h2) / km)], steps: ["Vertical interval = " + h1 + " − " + h2 + " = " + (h1 - h2) + " m", "Horizontal equivalent = " + km * 1000 + " m", "Gradient = VI ÷ HE = 1 in " + N(n)] }; },
    (r) => { const k = pick([2, 3, 4], r), red = pick([true, false], r); return { q: `A map is ${red ? "reduced" : "enlarged"} so that lengths become ${red ? "1/" + k : k + "×"} of the original. By what factor does the area change?`, a: red ? "1/" + k * k : String(k * k), d: red ? ["1/" + k, "1/" + (k * k + k), String(k)] : [String(k), String(k * k + k), "1/" + k], steps: ["Area changes by the square of the linear factor: " + (red ? "(1/" + k + ")² = 1/" + k * k : k + "² = " + k * k)], mc: true }; },
    ...bank([
      { q: "Contours that are very close together show", a: "a steep slope", d: ["a gentle slope", "a plateau top", "a flat valley floor"], steps: ["Close contours = steep; widely spaced = gentle."] },
      { q: "V-shaped contours pointing towards higher ground represent a", a: "valley", acc: ["valley", "rivervalley"], d: ["spur", "ridge", "col"], steps: ["Spur contours point downhill; valley contours point uphill."] },
      { q: "A dip between two areas of high ground is a", a: "col", acc: ["col", "saddle"], d: ["spur", "knoll", "escarpment"], steps: ["Cols are often used by roads and railways."] },
      { q: "Tree-like drainage that develops on rocks of uniform resistance is", a: "dendritic", acc: ["dendritic"], d: ["trellis", "radial", "centripetal"], steps: ["Tributaries join at acute angles."] },
      { q: "Rivers flowing outwards in all directions from a central dome form a", a: "radial pattern", acc: ["radial", "radialpattern"], d: ["centripetal pattern", "trellis pattern", "parallel pattern"], steps: ["Typical of volcanoes and domes."] },
      { q: "In a six-figure grid reference, the first three figures give the", a: "easting", acc: ["easting", "eastings"], d: ["northing", "bearing", "height"], steps: ["Eastings first ('along the corridor'), then northings."] },
      { q: "A settlement whose houses are strung out along a road is", a: "linear", acc: ["linear", "ribbon"], d: ["nucleated", "dispersed", "isolated"], steps: ["Also called ribbon settlement."] },
      { q: "If the line of sight between two points cuts the land profile, the points are", a: "not inter-visible", d: ["inter-visible", "on the same contour", "at the same height"], steps: ["Higher ground blocks the view."] },
    ]),
  ];
  const SD = [
    (r) => { const v = [ri(10, 60, r), ri(10, 60, r), ri(10, 60, r)], tot = v[0] + v[1] + v[2], k = ri(0, 2, r); return { q: `In a pie chart of three values ${v.join(", ")}, what angle (to the nearest degree) represents ${v[k]}?`, a: Math.round(v[k] / tot * 360), unit: "°", d: [v[k], Math.round(v[k] / tot * 100), Math.round(v[k] / tot * 180)], steps: ["Angle = value ÷ total × 360°", v[k] + " ÷ " + tot + " × 360 = " + Math.round(v[k] / tot * 360) + "°"] }; },
    (r) => { const p = ri(2, 30, r) * 100000, a = ri(2, 20, r) * 1000; return { q: `A state has ${p.toLocaleString("en-GB")} people and an area of ${a.toLocaleString("en-GB")} km². What is its population density (people per km²)?`, a: N(p / a), unit: "per km²", d: [N(a / p * 1000), N(p / a * 10), N(p / a / 10)], steps: ["Density = population ÷ area = " + p.toLocaleString("en-GB") + " ÷ " + a.toLocaleString("en-GB") + " = " + N(p / a)] }; },
    ...bank([
      { q: "Lines on a map joining places of equal rainfall are", a: "isohyets", acc: ["isohyets", "isohyet"], d: ["isotherms", "isobars", "contours"], steps: ["Isotherms = temperature; isobars = pressure."] },
      { q: "In proportional circles, the radius is proportional to the", a: "square root of the value", d: ["value", "cube of the value", "square of the value"], steps: ["So that circle area is proportional to the value."] },
      { q: "A map shading areas by density classes is a", a: "choropleth map", acc: ["choropleth", "choroplethmap", "densitymap"], d: ["dot map", "isopleth map", "flow map"], steps: ["Darker shades = higher densities."] },
      { q: "A map using bands whose width shows the volume of movement is a", a: "flow map", acc: ["flowmap", "flowchart", "flow"], d: ["dot map", "choropleth map", "pictogram"], steps: ["Used for traffic, trade and migration."] },
    ]),
  ];
  const EP = [
    (r) => { const lo = ri(5, 170, r), e = pick([1, -1], r), h = ri(6, 18, r), loc = h + e * lo / 15; const m = ((loc % 24) + 24) % 24, H = Math.floor(m), M = Math.round((m - H) * 60); return { q: `When it is ${String(h).padStart(2, "0")}:00 GMT at Greenwich, what is the local time at a place ${lo}°${e > 0 ? "E" : "W"}?`, a: String(H).padStart(2, "0") + ":" + String(M).padStart(2, "0"), d: [(() => { const x = (((h - e * lo / 15) % 24) + 24) % 24; return String(Math.floor(x)).padStart(2, "0") + ":" + String(Math.round((x - Math.floor(x)) * 60)).padStart(2, "0"); })(), String((h + 1) % 24).padStart(2, "0") + ":00", String(h).padStart(2, "0") + ":" + String(lo % 60).padStart(2, "0")], steps: ["15° = 1 hour, 1° = 4 minutes", lo + "° × 4 = " + lo * 4 + " min = " + Math.floor(lo * 4 / 60) + " h " + (lo * 4) % 60 + " min", (e > 0 ? "East → add" : "West → subtract") + " (GEL W)"], mc: true }; },
    (r) => { const a = ri(1, 30, r), b = ri(1, 30, r), same = pick([true, false], r), d = same ? Math.abs(a - b) || 5 : a + b; const A = a, B = same ? (a === b ? a + 5 : b) : b; return { q: `Place X is ${A}°N and place Y is ${B}°${same ? "N" : "S"} on the same meridian. Calculate the distance between them (1° = 111 km).`, a: Math.abs(same ? A - B : A + B) * 111, unit: "km", d: [Math.abs(same ? A + B : A - B) * 111, Math.abs(same ? A - B : A + B) * 60, Math.abs(same ? A - B : A + B) * 11], steps: [(same ? "Same hemisphere: subtract " : "Opposite hemispheres: add ") + "→ " + Math.abs(same ? A - B : A + B) + "°", "× 111 km = " + Math.abs(same ? A - B : A + B) * 111 + " km"] }; },
    (r) => { const lat = ri(0, 20, r), dec = pick([23.5, 0, -23.5], r), alt = 90 - Math.abs(lat - dec); return { q: `Calculate the altitude of the noon sun at ${lat}°N when the overhead sun is at ${dec === 0 ? "the equator" : Math.abs(dec) + "°" + (dec > 0 ? "N" : "S")}.`, a: N(alt), unit: "°", d: [N(90 - lat), N(lat + Math.abs(dec)), N(90 - Math.abs(dec))], steps: ["Noon altitude = 90° − (difference between latitude and overhead sun)", "90 − |" + lat + " − (" + dec + ")| = " + N(alt) + "°"] }; },
    ...bank([
      { q: "The earth rotates through 15° of longitude in", a: "1 hour", d: ["4 minutes", "24 hours", "15 minutes"], steps: ["360° ÷ 24 h = 15° per hour."] },
      { q: "The overhead noon sun is at the Tropic of Cancer on", a: "21 June", d: ["21 March", "23 September", "22 December"], steps: ["Summer solstice in the northern hemisphere."] },
      { q: "Winds are deflected to the right in the northern hemisphere because of", a: "the rotation of the earth", acc: ["rotation", "coriolis", "coriolisforce", "rotationoftheearth"], d: ["the revolution of the earth", "the tilt of the axis", "gravity"], steps: ["Ferrel's law / Coriolis effect."] },
      { q: "The boundary between the earth's crust and the mantle is the", a: "Mohorovičić discontinuity", acc: ["moho", "mohorovicic", "mohorovicicdiscontinuity", "mohorovičićdiscontinuity"], d: ["Gutenberg discontinuity", "asthenosphere", "lithosphere"], steps: ["Named after Andrija Mohorovičić."] },
      { q: "The layer of the earth made of liquid iron and nickel is the", a: "outer core", acc: ["outercore"], d: ["inner core", "mantle", "crust"], steps: ["S-waves cannot pass through it."] },
      { q: "The International Date Line roughly follows longitude", a: "180°", acc: ["180", "180°"], d: ["0°", "90°E", "23½°N"], steps: ["Crossing westward you gain a day."] },
      { q: "Which is evidence that the earth is spherical?", a: "A ship's hull disappears before its mast", d: ["The sun rises in the west", "Rivers flow to the sea", "Stars twinkle"], steps: ["Also the circular shadow on the moon in an eclipse."] },
    ]),
  ];
  const RK = bank([
    { q: "Granite is an example of", a: "an intrusive igneous rock", d: ["a sedimentary rock", "a metamorphic rock", "an extrusive igneous rock"], steps: ["It cooled slowly underground, forming large crystals."] },
    { q: "Limestone changes to which rock under heat and pressure?", a: "marble", acc: ["marble"], d: ["slate", "quartzite", "gneiss"], steps: ["Shale → slate; sandstone → quartzite; granite → gneiss."] },
    { q: "Coal is an example of an organically formed", a: "sedimentary rock", acc: ["sedimentary", "sedimentaryrock"], d: ["igneous rock", "metamorphic rock", "volcanic rock"], steps: ["Formed from compressed plant remains."] },
    { q: "Rocks that contain fossils and occur in layers are", a: "sedimentary rocks", d: ["igneous rocks", "metamorphic rocks", "volcanic rocks"], steps: ["Layers = strata."] },
    { q: "Basalt is fine-grained because it", a: "cooled quickly at the surface", d: ["cooled slowly underground", "was compressed", "was weathered"], steps: ["Extrusive igneous rock."] },
    { q: "A vertical sheet of igneous rock cutting across rock layers is a", a: "dyke", acc: ["dyke", "dike"], d: ["sill", "laccolith", "batholith"], steps: ["A sill lies parallel to the bedding."] },
  ]);
  const TC = bank([
    { q: "The point on the earth's surface directly above the focus of an earthquake is the", a: "epicentre", acc: ["epicentre", "epicenter"], d: ["hypocentre", "fault", "crater"], steps: ["The focus is underground."] },
    { q: "A rift valley is formed by", a: "faulting", acc: ["faulting", "tension", "faulting/tension"], d: ["folding", "glaciation", "deposition"], steps: ["A block sinks between parallel faults."] },
    { q: "An upfold of rock layers is called", a: "an anticline", acc: ["anticline"], d: ["a syncline", "a limb", "a nappe"], steps: ["A downfold is a syncline."] },
    { q: "Mount Cameroon is an example of a", a: "volcanic mountain", d: ["fold mountain", "block mountain", "residual mountain"], steps: ["Built by eruptions of lava and ash."] },
    { q: "Stalactites and stalagmites are found in", a: "limestone caves", d: ["sand dunes", "granite domes", "coral reefs"], steps: ["Formed by deposition of calcite."] },
    { q: "A pillar of rock left standing in the sea after an arch collapses is a", a: "stack", acc: ["stack", "seastack"], d: ["stump", "spit", "bar"], steps: ["Headland → cave → arch → stack → stump."] },
    { q: "A ridge of sand joined to the land at one end and projecting into the sea is a", a: "spit", acc: ["spit"], d: ["bar", "tombolo", "stack"], steps: ["Formed by longshore drift."] },
    { q: "Each whole number increase on the Richter scale represents ground movement", a: "10 times greater", d: ["2 times greater", "100 times greater", "the same"], steps: ["It is a logarithmic scale."] },
  ]);
  const DN = bank([
    { q: "The peeling of rock layers due to heating and cooling is", a: "exfoliation", acc: ["exfoliation", "onionweathering"], d: ["carbonation", "hydrolysis", "oxidation"], steps: ["Common on granite in dry savanna."] },
    { q: "The process that dissolves limestone in rain water is", a: "carbonation", acc: ["carbonation", "solution"], d: ["oxidation", "hydration", "exfoliation"], steps: ["CaCO₃ + H₂O + CO₂ → Ca(HCO₃)₂."] },
    { q: "Tilted fence posts and bent tree trunks on a slope show", a: "soil creep", acc: ["soilcreep", "creep"], d: ["landslide", "rockfall", "mudflow"], steps: ["Very slow mass movement."] },
    { q: "A lake formed when a meander is cut off is", a: "an ox-bow lake", acc: ["oxbow", "oxbowlake", "ox-bowlake"], d: ["a crater lake", "a lagoon", "a rift lake"], steps: ["Found in the lower course."] },
    { q: "The crescent-shaped sand dune with horns pointing downwind is a", a: "barchan", acc: ["barchan"], d: ["seif", "zeugen", "yardang"], steps: ["Seif dunes are long ridges parallel to the wind."] },
    { q: "Waves with a strong backwash that erode the coast are", a: "destructive waves", acc: ["destructive", "destructivewaves"], d: ["constructive waves", "tidal waves", "swell"], steps: ["Constructive waves have a strong swash."] },
    { q: "Water rising to the surface on its own in a well due to pressure is", a: "an artesian well", acc: ["artesian", "artesianwell"], d: ["a spring", "a geyser", "an oasis"], steps: ["Occurs in a basin of permeable rock between impermeable layers."] },
    { q: "Rivers carry fine particles floating in the water by", a: "suspension", acc: ["suspension"], d: ["traction", "saltation", "solution"], steps: ["Traction = rolling, saltation = bouncing."] },
  ]);
  const WX = [
    (r) => { const mx = ri(29, 36, r), mn = ri(18, 25, r); return { q: `A maximum thermometer reads ${mx} °C and the minimum ${mn} °C. What is the mean daily temperature?`, a: N((mx + mn) / 2), unit: "°C", d: [mx - mn, mx + mn, N((mx - mn) / 2)], steps: ["Mean = (max + min) ÷ 2 = (" + mx + " + " + mn + ") ÷ 2 = " + N((mx + mn) / 2) + " °C"] }; },
    ...bank([
      { q: "Relative humidity is measured with the", a: "hygrometer (wet- and dry-bulb thermometers)", d: ["anemometer", "barometer", "rain gauge"], steps: ["The difference between the two readings gives RH from tables."] },
      { q: "The Stevenson screen is painted white in order to", a: "reflect the sun's rays", d: ["absorb heat", "attract rain", "be seen easily by aircraft"], steps: ["So thermometers measure shade air temperature."] },
      { q: "Wind speed is measured with the", a: "anemometer", acc: ["anemometer", "cupanemometer"], d: ["wind vane", "barometer", "hygrometer"], steps: ["Wind direction is shown by the wind vane."] },
      { q: "Atmospheric pressure is measured in", a: "millibars", acc: ["millibars", "millibar", "mb", "hectopascals", "hpa"], d: ["millimetres", "degrees", "knots"], steps: ["Using a barometer."] },
      { q: "Hours of sunshine are recorded by the", a: "Campbell–Stokes sunshine recorder", acc: ["campbellstokes", "sunshinerecorder", "campbell-stokessunshinerecorder"], d: ["thermometer", "evaporimeter", "anemometer"], steps: ["A glass sphere burns a trace on a card."] },
    ]),
  ];
  const CL = [
    (r) => { const T = [ri(20, 25, r), ri(27, 33, r)]; return { q: `A station's hottest month averages ${T[1]} °C and its coolest month ${T[0]} °C. What is the annual range of temperature?`, a: T[1] - T[0], unit: "°C", d: [T[1] + T[0], N((T[1] + T[0]) / 2), T[1]], steps: ["Annual range = hottest − coolest = " + T[1] + " − " + T[0] + " = " + (T[1] - T[0]) + " °C"] }; },
    (r) => { const h = ri(5, 30, r) * 100, t0 = ri(26, 30, r), t = t0 - 6.5 * h / 1000; return { q: `The temperature at sea level is ${t0} °C. Using a lapse rate of 6.5 °C per 1 000 m, what is the temperature at ${h} m?`, a: N(t), unit: "°C", d: [N(t0 + 6.5 * h / 1000), N(t0 - 6.5 * h / 100), N(t0 - h / 1000)], steps: ["Fall = 6.5 × " + h + " ÷ 1 000 = " + N(6.5 * h / 1000) + " °C", t0 + " − " + N(6.5 * h / 1000) + " = " + N(t) + " °C"] }; },
    ...bank([
      { q: "The dry, dusty north-east trade wind that blows over West Africa from the Sahara is the", a: "harmattan", acc: ["harmattan"], d: ["south-west monsoon", "westerlies", "sirocco"], steps: ["Tropical continental (cT) air, November to March."] },
      { q: "Rainfall caused by moist air rising over mountains is", a: "relief (orographic) rainfall", acc: ["relief", "orographic", "reliefrainfall", "orographicrainfall"], d: ["convectional rainfall", "frontal rainfall", "cyclonic rainfall"], steps: ["The leeward side is a rain shadow."] },
      { q: "The equatorial climate is characterised by", a: "rain all year and a small temperature range", d: ["hot dry summers and wet winters", "a long dry season", "very cold winters"], steps: ["Range 2–3 °C, over 2 000 mm."] },
      { q: "In Köppen's classification, the letter B stands for", a: "dry climates", d: ["tropical humid climates", "polar climates", "cold continental climates"], steps: ["BW = desert, BS = steppe."] },
      { q: "Mediterranean climate has", a: "hot dry summers and mild wet winters", d: ["rain all year", "a summer monsoon", "very cold winters"], steps: ["Rain from westerlies in winter."] },
      { q: "The zone between the tropics in the Greek classification is the", a: "torrid zone", acc: ["torrid", "torridzone"], d: ["temperate zone", "frigid zone", "polar zone"], steps: ["0–23½° N and S."] },
    ]),
  ];
  const EN = bank([
    { q: "The spread of desert conditions into the Sahel is called", a: "desertification", acc: ["desertification"], d: ["deforestation", "salinisation", "urbanisation"], steps: ["Caused by drought, overgrazing and over-cultivation."] },
    { q: "Planting trees on land that never had forest is", a: "afforestation", acc: ["afforestation"], d: ["reafforestation", "deforestation", "agroforestry"], steps: ["Reafforestation replants cleared forest."] },
    { q: "Gas flaring in the Niger Delta mainly causes", a: "air pollution and acid rain", d: ["soil erosion", "desertification", "earthquakes"], steps: ["Also contributes to climate change."] },
    { q: "A non-renewable resource is", a: "petroleum", d: ["forest", "solar energy", "water"], steps: ["Fossil fuels cannot be replaced."] },
  ]);
  const PO = [
    (r) => { const b = ri(30, 45, r), d = ri(8, 15, r); return { q: `A country has a birth rate of ${b} per 1 000 and a death rate of ${d} per 1 000. What is the natural increase in % per year?`, a: N((b - d) / 10), unit: "%", d: [b - d, N((b + d) / 10), N((b - d) / 100)], steps: ["Natural increase = (birth rate − death rate) ÷ 10 = (" + b + " − " + d + ") ÷ 10 = " + N((b - d) / 10) + "%"] }; },
    ...bank([
      { q: "A population pyramid with a wide base indicates", a: "a high birth rate", d: ["an ageing population", "a low birth rate", "high life expectancy"], steps: ["Many young dependants."] },
      { q: "The movement of people from villages to towns is", a: "rural–urban migration", acc: ["rural-urbanmigration", "ruralurbanmigration", "urbanmigration", "rural–urbanmigration"], d: ["urban–rural migration", "emigration", "transhumance"], steps: ["Push and pull factors."] },
      { q: "An area of very sparse population in Nigeria is the", a: "Middle Belt", d: ["Kano close-settled zone", "Igboland", "Lagos area"], steps: ["Past slave raids, tsetse and poor soils."] },
      { q: "The seasonal movement of herders and their animals is", a: "transhumance", acc: ["transhumance", "nomadism", "seasonalmigration"], d: ["urbanisation", "emigration", "commuting"], steps: ["e.g. Fulani herders."] },
    ]),
  ];
  const SE = bank([
    { q: "The part of a city with the tallest buildings and highest land values is the", a: "CBD", acc: ["cbd", "centralbusinessdistrict"], d: ["suburb", "industrial estate", "rural-urban fringe"], steps: ["Central Business District."] },
    { q: "A settlement where houses are clustered around a centre is", a: "nucleated", acc: ["nucleated", "clustered"], d: ["linear", "dispersed", "isolated"], steps: ["Often around a water point or market."] },
    { q: "Towns that grow where a road crosses a river are called", a: "bridging-point towns", d: ["gap towns", "ports", "mining towns"], steps: ["e.g. many river crossing towns."] },
    { q: "A continuous built-up area formed when towns merge is a", a: "conurbation", acc: ["conurbation", "megalopolis"], d: ["hamlet", "village", "suburb"], steps: ["e.g. Lagos metropolitan area."] },
  ]);
  const TR = bank([
    { q: "The cheapest means of moving bulky goods over long distances is", a: "water transport", d: ["air transport", "road transport", "pipeline"], steps: ["Ships carry huge loads cheaply but slowly."] },
    { q: "The most flexible mode of transport, giving door-to-door service, is", a: "road transport", acc: ["road", "roadtransport"], d: ["rail transport", "air transport", "water transport"], steps: ["It carries most goods and passengers in West Africa."] },
    { q: "Transport best suited for perishable, valuable goods over long distances is", a: "air transport", d: ["rail transport", "water transport", "pipeline"], steps: ["Fast but expensive."] },
  ]);
  const IN = bank([
    { q: "Mining and fishing are examples of", a: "primary industries", acc: ["primary", "primaryindustry", "extractive"], d: ["secondary industries", "tertiary industries", "quaternary industries"], steps: ["They extract raw materials."] },
    { q: "Cement factories are located near limestone deposits because the raw material is", a: "bulky and loses weight in processing", d: ["light and valuable", "perishable", "imported"], steps: ["e.g. Ewekoro, Obajana, Nkalagu."] },
    { q: "Banking and teaching are examples of", a: "tertiary industries", acc: ["tertiary", "tertiaryindustry", "services"], d: ["primary industries", "secondary industries", "extractive industries"], steps: ["Services."] },
    { q: "The VALCO aluminium smelter at Tema is located mainly because of", a: "cheap hydro-electric power", d: ["local bauxite", "a large local market", "cheap land"], steps: ["Power from Akosombo."] },
  ]);
  const TD = [
    (r) => { const ex = ri(20, 60, r), im = ri(20, 60, r); return { q: `A country exports goods worth $${ex} billion and imports $${im} billion. What is its balance of trade (in $ billion)?`, a: ex - im, unit: "$bn", d: [im - ex, ex + im, N(ex / im)], steps: ["Balance of trade = exports − imports = " + ex + " − " + im + " = " + (ex - im) + (ex >= im ? " (surplus)" : " (deficit)")] }; },
    ...bank([
      { q: "Trade between two countries only is", a: "bilateral trade", acc: ["bilateral", "bilateraltrade"], d: ["multilateral trade", "entrepôt trade", "internal trade"], steps: ["Multilateral involves many countries."] },
      { q: "Nigeria's leading export is", a: "crude oil", acc: ["crudeoil", "oil", "petroleum"], d: ["cocoa", "groundnuts", "tin"], steps: ["Most of export earnings."] },
    ]),
  ];
  const TO = bank([
    { q: "Yankari Game Reserve is in", a: "Nigeria", acc: ["nigeria"], d: ["Ghana", "Sierra Leone", "The Gambia"], steps: ["Bauchi State, with the Wikki warm spring."] },
    { q: "The Kakum canopy walkway is in", a: "Ghana", acc: ["ghana"], d: ["Nigeria", "Liberia", "Senegal"], steps: ["Kakum National Park near Cape Coast."] },
    { q: "Tourism earns a country", a: "foreign exchange", acc: ["foreignexchange"], d: ["more imports", "more pollution only", "fewer jobs"], steps: ["Also jobs and infrastructure."] },
  ]);
  const FW = bank([
    { q: "The first stage of a field study is to", a: "choose a topic and state the aim", d: ["write the report", "draw graphs", "analyse the results"], steps: ["Then plan, collect, present, analyse, conclude."] },
    { q: "Vehicle counts at a junction are recorded on a", a: "tally sheet", acc: ["tallysheet", "tally"], d: ["questionnaire", "field book map", "rain gauge"], steps: ["Tallies by type and direction."] },
    { q: "A desire-line map shows", a: "journeys from origins to destinations", d: ["land use", "rainfall", "soil types"], steps: ["Thicker lines = more people."] },
  ]);
  const GIS = bank([
    { q: "In a GIS, data stored as a grid of cells is", a: "raster data", acc: ["raster", "rasterdata"], d: ["vector data", "attribute data", "metadata"], steps: ["Vector uses points, lines and polygons."] },
    { q: "Which is NOT a component of GIS?", a: "climate", d: ["hardware", "software", "people"], steps: ["Components: hardware, software, data, people, methods."] },
    { q: "Satellites that give a receiver its exact position belong to the", a: "GPS", acc: ["gps", "globalpositioningsystem", "gnss"], d: ["radar", "GSM", "LIDAR"], steps: ["Global Positioning System."] },
    { q: "Overlaying a 1 km zone around a river in GIS is called", a: "buffering", acc: ["buffering", "buffer"], d: ["digitising", "geocoding", "scanning"], steps: ["A buffer analysis."] },
  ]);
  const CC = bank([
    { q: "The main greenhouse gas released by burning fossil fuels is", a: "carbon dioxide", acc: ["carbondioxide", "co2"], d: ["oxygen", "nitrogen", "argon"], steps: ["Also methane from farming and waste."] },
    { q: "Which is an effect of global warming on coastal West Africa?", a: "rising sea level and coastal erosion", d: ["more harmattan", "colder nights", "new volcanoes"], steps: ["e.g. Lagos, Keta, Saint-Louis."] },
    { q: "The international agreement of 2015 to limit warming is the", a: "Paris Agreement", acc: ["parisagreement", "paris"], d: ["Kyoto Protocol", "Montreal Protocol", "Treaty of Lagos"], steps: ["Aims to keep warming well below 2 °C."] },
  ]);
  const NG = bank([
    { q: "The highest point in Nigeria is", a: "Chappal Waddi", acc: ["chappalwaddi", "chappalwadi"], d: ["Jos Plateau", "Obudu", "Zuma Rock"], steps: ["About 2 419 m."] },
    { q: "The Niger and Benue rivers meet at", a: "Lokoja", acc: ["lokoja"], d: ["Jebba", "Onitsha", "Makurdi"], steps: ["The confluence in Kogi State."] },
    { q: "Nigeria's coal is mined mainly at", a: "Enugu", acc: ["enugu"], d: ["Jos", "Ewekoro", "Warri"], steps: ["Since 1915."] },
    { q: "Tin and columbite are mined on the", a: "Jos Plateau", acc: ["josplateau", "jos"], d: ["Udi Plateau", "Mambilla Plateau", "Niger Delta"], steps: ["Alluvial deposits."] },
    { q: "ECOWAS was established in", a: "1975", acc: ["1975"], d: ["1960", "1963", "1990"], steps: ["Treaty of Lagos, 28 May 1975; HQ Abuja."] },
    { q: "Eko Atlantic City is built on land reclaimed from the", a: "Atlantic Ocean", acc: ["atlantic", "atlanticocean"], d: ["Lagos Lagoon only", "Niger Delta", "Lake Chad"], steps: ["Protected by a sea wall."] },
    { q: "The Ajaokuta steel complex obtains iron ore from", a: "Itakpe", acc: ["itakpe"], d: ["Enugu", "Jos", "Ewekoro"], steps: ["Kogi State."] },
  ]);
  const SV = bank([
    { q: "In chain survey, measurements at right angles from the chain line to features are", a: "offsets", acc: ["offsets", "offset"], d: ["bearings", "stations", "ranging"], steps: ["Measured with an offset rod or tape."] },
    { q: "In a field book, entries are read from", a: "the bottom upwards", d: ["the top downwards", "left to right only", "the middle outwards"], steps: ["Following the direction of chaining."] },
    { q: "Forward and back bearings of a line differ by", a: "180°", acc: ["180", "180°"], d: ["90°", "360°", "45°"], steps: ["Used to check compass readings."] },
    { q: "Iron objects disturbing a compass cause", a: "local attraction", acc: ["localattraction"], d: ["closing error only", "parallax", "sag"], steps: ["A source of error in compass traverse."] },
  ]);
  const HY = bank([
    { q: "The average salinity of ocean water is about", a: "35 parts per thousand", d: ["3.5 parts per thousand", "350 parts per thousand", "0.35 parts per thousand"], steps: ["Higher in the Red Sea, lower in the Baltic."] },
    { q: "The warm current flowing east along the West African coast is the", a: "Guinea current", acc: ["guinea", "guineacurrent"], d: ["Canary current", "Benguela current", "Gulf Stream"], steps: ["Canary and Benguela are cold."] },
    { q: "The deepest parts of the ocean are", a: "ocean trenches", acc: ["trenches", "oceantrenches", "deeps"], d: ["continental shelves", "abyssal plains", "mid-ocean ridges"], steps: ["e.g. the Mariana Trench."] },
    { q: "Lake Bosumtwi in Ghana was formed by", a: "a meteorite impact", d: ["faulting", "a dam", "a river meander"], steps: ["An impact crater lake."] },
  ]);
  const VG = bank([
    { q: "Trees with stilt roots growing in salty coastal swamps are", a: "mangroves", acc: ["mangrove", "mangroves"], d: ["baobabs", "acacias", "obeche"], steps: ["e.g. the Niger Delta."] },
    { q: "Tall grass with scattered trees, just north of the forest, is", a: "Guinea savanna", acc: ["guineasavanna"], d: ["Sudan savanna", "Sahel savanna", "rainforest"], steps: ["Trees thin out northwards."] },
    { q: "Mahogany, iroko and obeche are trees of the", a: "tropical rainforest", acc: ["rainforest", "tropicalrainforest"], d: ["Sahel", "montane grassland", "mangrove"], steps: ["Hardwoods."] },
  ]);
  const SO = bank([
    { q: "The topsoil rich in humus is the", a: "A horizon", acc: ["a", "ahorizon"], d: ["B horizon", "C horizon", "R horizon"], steps: ["O, A, B, C, R from top to bottom."] },
    { q: "Washing down of minerals from the topsoil is", a: "leaching", acc: ["leaching", "eluviation"], d: ["illuviation", "weathering", "erosion"], steps: ["Common in high-rainfall areas."] },
    { q: "Cutting steps into steep slopes to stop soil erosion is", a: "terracing", acc: ["terracing", "terraces"], d: ["contour ploughing", "mulching", "crop rotation"], steps: ["Used on the Jos Plateau."] },
    { q: "Deep channels cut into soil by running water are", a: "gullies", acc: ["gullies", "gully"], d: ["rills", "sheet wash", "terraces"], steps: ["Gully erosion is severe in south-east Nigeria."] },
  ]);
  const AF = bank([
    { q: "The highest mountain in Africa is", a: "Kilimanjaro", acc: ["kilimanjaro", "mountkilimanjaro"], d: ["Mount Kenya", "Mount Cameroon", "Ruwenzori"], steps: ["5 895 m, Tanzania."] },
    { q: "The Gezira irrigation scheme is in", a: "Sudan", acc: ["sudan"], d: ["Egypt", "Mali", "Nigeria"], steps: ["Between the Blue and White Niles."] },
    { q: "The Witwatersrand is famous for mining", a: "gold", acc: ["gold"], d: ["copper", "diamonds", "coal"], steps: ["Around Johannesburg."] },
    { q: "Zambia's copper is exported to Dar es Salaam by the", a: "TAZARA railway", acc: ["tazara", "tazararailway"], d: ["Benguela railway", "Trans-Sahara Highway", "Nile"], steps: ["Built in the 1970s."] },
    { q: "Libya's main oil-producing area is the", a: "Sirte Basin", acc: ["sirte", "sirtebasin"], d: ["Niger Delta", "Jubilee field", "Gulf of Guinea"], steps: ["Largest proven reserves in Africa."] },
  ]);
  const GH = bank([
    { q: "The Akosombo Dam is on the", a: "Volta river", acc: ["volta", "voltariver"], d: ["Pra river", "Ankobra river", "Tano river"], steps: ["It created Lake Volta (1965)."] },
    { q: "Ghana's richest gold mine is at", a: "Obuasi", acc: ["obuasi"], d: ["Akwatia", "Nsuta", "Awaso"], steps: ["Akwatia = diamonds, Nsuta = manganese, Awaso = bauxite."] },
    { q: "Illegal small-scale gold mining in Ghana is called", a: "galamsey", acc: ["galamsey"], d: ["saiko", "dumsor", "kente"], steps: ["It pollutes rivers and destroys farms."] },
    { q: "The highest point in Ghana is", a: "Mount Afadjato", acc: ["afadjato", "mountafadjato"], d: ["Kwahu plateau", "Mount Nimba", "Atewa hills"], steps: ["In the Akwapim–Togo ranges."] },
  ]);
  const SLE = bank([
    { q: "Sierra Leone's main diamond area is", a: "Kono", acc: ["kono", "koidu"], d: ["Marampa", "Bumbuna", "Sherbro"], steps: ["Around Koidu."] },
    { q: "The Bumbuna dam produces", a: "hydro-electric power", acc: ["hep", "hydroelectricpower", "hydro-electricpower", "electricity"], d: ["iron ore", "rice", "rutile"], steps: ["On the Seli (Rokel) river."] },
    { q: "Rutile is mined in Sierra Leone mainly for", a: "titanium", acc: ["titanium"], d: ["iron", "aluminium", "copper"], steps: ["Sierra Rutile, Mobimbi."] },
    { q: "Freetown's international airport is at", a: "Lungi", acc: ["lungi"], d: ["Bo", "Kenema", "Makeni"], steps: ["Across the estuary from Freetown."] },
  ]);
  const LBR = bank([
    { q: "The Firestone rubber plantation in Liberia is at", a: "Harbel", acc: ["harbel"], d: ["Buchanan", "Harper", "Gbarnga"], steps: ["One of the world's largest."] },
    { q: "Iron ore from Yekepa (Nimba) is exported through", a: "Buchanan", acc: ["buchanan"], d: ["Monrovia", "Greenville", "Harper"], steps: ["By the Buchanan–Yekepa railway."] },
    { q: "Liberia became independent in", a: "1847", acc: ["1847"], d: ["1957", "1960", "1822"], steps: ["Africa's oldest republic."] },
  ]);
  const SNG = bank([
    { q: "The main cash crop of Senegal and The Gambia is", a: "groundnuts", acc: ["groundnuts", "groundnut", "peanuts"], d: ["cocoa", "rubber", "coffee"], steps: ["Grown in the groundnut basin."] },
    { q: "Senegal's main mineral, used for fertiliser, is", a: "phosphate", acc: ["phosphate", "phosphates"], d: ["bauxite", "tin", "coal"], steps: ["Mined at Taïba."] },
    { q: "The rich fishing grounds off Senegal are due to the cold", a: "Canary current", acc: ["canary", "canarycurrent"], d: ["Guinea current", "Benguela current", "Gulf Stream"], steps: ["Upwelling of nutrients."] },
    { q: "Gorée Island, a UNESCO site, is near", a: "Dakar", acc: ["dakar"], d: ["Banjul", "Saint-Louis", "Ziguinchor"], steps: ["Linked to the Atlantic slave trade."] },
  ]);

  /* make every question's distractors distinct from each other and from the answer */
  const fix = (g) => (r) => { const q = g(r), seen = new Set([String(q.a)]), d = []; (q.d || []).forEach((x) => { if (!seen.has(String(x))) { seen.add(String(x)); d.push(x); } }); let k = 1; while (d.length < 3 && k < 12) { const v = typeof q.a === "number" ? N(q.a * [1.5, 0.5, 2, 1.25, 0.75, 3][k % 6] + (k > 6 ? k : 0)) : null; if (v != null && !seen.has(String(v))) { seen.add(String(v)); d.push(v); } k++; } q.d = d.slice(0, 3); return q; };
  const gens0 = { MW, SD, EP, RK, TC, DN, WX, CL, EN, PO, SE, TR, IN, TD, TO, FW, GIS, CC, NG, SV, HY, VG, SO, AF, GH, SLE, LBR, SNG };
  const gens = {}; Object.entries(gens0).forEach(([k, arr]) => (gens[k] = arr.map(fix)));
  const names = { MW: "Map work", SD: "Statistical maps & diagrams", EP: "The earth as a planet", RK: "Rocks", TC: "Tectonic processes", DN: "Denudation", WX: "Weather", CL: "Climate", EN: "Environment", PO: "Population", SE: "Settlement", TR: "Transport", IN: "Industry", TD: "Trade", TO: "Tourism", FW: "Field work", GIS: "GIS", CC: "Climate change", NG: "Regional — Nigeria", SV: "Surveying", HY: "Hydrosphere", VG: "Vegetation", SO: "Soil", AF: "Regional — Africa", GH: "Regional — Ghana", SLE: "Regional — Sierra Leone", LBR: "Regional — Liberia", SNG: "Regional — Senegambia" };
  const CORE = ["MW", "SD", "EP", "RK", "TC", "DN", "WX", "CL", "EN", "PO", "SE", "TR", "IN", "TD", "TO", "FW"], ANG = ["SV", "HY", "VG", "SO", "AF"];
  const EXTRA = { core: [], nigeria: ["GIS", "CC", "NG"], anglo: ANG, ghana: ANG.concat(["GH"]), sle: ANG.concat(["SLE"]), lbr: ANG.concat(["LBR"]), sng: ANG.concat(["SNG"]) };
  const LABEL = { core: "core", nigeria: "core + Nigeria", anglo: "core + Ghana/SL/Liberia/Gambia topics", ghana: "core + Ghana", sle: "core + Sierra Leone", lbr: "core + Liberia", sng: "core + Senegambia" };
  window.GeographyExam = {
    gens, topics: names,
    cfg(course) {
      const keys = CORE.concat(EXTRA[course] || []), topics = {}; keys.forEach((k) => (topics[k] = names[k]));
      return { subject: "Geography", title: "WAEC Geography — practice (" + (LABEL[course] || "core") + ")", gens, topics, perQ: { p1: 60, p2: 120 }, lengths: [5, 10, 20, 50],
        p1Label: "Paper 1 — objective (50 in 50 min)", p2Label: "Paper 2 — short structured (type the answer)",
        note: "Timed at WAEC pace: 60 s per objective question and 2 minutes per structured answer. Typed answers accept the key term or place name (spelling must be correct); numerical answers within 1% are accepted. Map-work and earth calculations use fresh numbers every time." };
    },
  };
})();
