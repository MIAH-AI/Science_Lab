/* g-syllabus.js — WAEC Geography examination syllabus as data.
   core   : topics for all member countries (Papers 1, 2 Section A, 3)
   nigeria: ** topics for Nigeria only + Regional Geography of Nigeria (Paper 2 Section B)
   anglo  : * topics for Ghana, Sierra Leone, Liberia, The Gambia + Regional Geography of Africa (Paper 2 Section C)
   ghana / sle / lbr / sng : Regional Geography of each home country (Paper 2 Section B)
   Topic codes are unique, so simulation keys "<code>-<sub>" never collide. */
(function () {
  "use strict";
  const T = (code, num, glyph, title, desc, subs) => ({ code, num, glyph, title, desc, subtopics: subs.map(([c, t, content, notes]) => ({ code: c, title: t, content, notes })) });

  const CORE = [
    T("MW", "1", "⌖", "Map Work — reading topographical maps", "Paper 3 Question 1 (25 marks, compulsory): contoured survey maps of parts of West Africa — scale, distance, direction and bearing, reduction and enlargement, relief and cultural features, gradients, cross profiles, inter-visibility, drainage, communication, settlement and land use.", [
      ["a", "Maps: meaning, types and uses", ["A map is a representation of part or the whole of the earth's surface on a flat surface, drawn to scale", "Types: topographical, atlas, cadastral, thematic (climate, vegetation, population), sketch maps, plans", "Uses: navigation, planning, defence, teaching, tourism, resource surveys"], "Marginal information on a topographical sheet: title, scale, key/legend, north arrow, grid lines and numbers, contour interval, date and edition."],
      ["b", "Scale and measurement of distance", ["Statement scale (1 cm represents 0.5 km), representative fraction (1 : 50 000) and linear scale", "Converting between scales", "Measuring straight and curved distances (string or paper edge) and areas (grid squares)"], "RF = map distance ÷ ground distance (same units). On 1 : 50 000, 1 cm = 500 m; 1 grid square of 2 cm = 1 km² ."],
      ["c", "Direction, bearing and grid references", ["Cardinal and intermediate points of the compass (16 points)", "Whole-circle bearings measured clockwise from north (000°–360°); back bearing = bearing ± 180°", "Four- and six-figure grid references: eastings first, then northings"], "True north, grid north and magnetic north; magnetic declination changes slowly each year."],
      ["d", "Reduction and enlargement of maps", ["Square (grid) method", "Linear and area relationships: halving the scale reduces area to one quarter", "Using the new representative fraction"], "If the linear scale is multiplied by k, the area is multiplied by k²."],
      ["e", "Relief: contours and landforms", ["Contours, contour interval, spot heights, trigonometrical stations, form lines", "Identifying hills, ridges, spurs, valleys, plateaus, escarpments, saddles, cols, gorges, knolls, inselbergs", "Even, concave and convex slopes"], "Closely spaced contours = steep slope; widely spaced = gentle slope. V-shaped contours pointing uphill = valley; pointing downhill = spur."],
      ["f", "Gradient and cross profiles", ["Gradient = vertical interval ÷ horizontal equivalent (same units), expressed as 1 in n or as a percentage", "Drawing a cross section (profile) between two points; vertical exaggeration", "Average gradient of a river or road"], "Vertical exaggeration = horizontal scale ÷ vertical scale (as fractions)."],
      ["g", "Inter-visibility", ["Determining whether one point can be seen from another", "Using a drawn profile and a line of sight", "Dead ground behind convex slopes and ridges"], "A ruled line from observer to target that cuts the profile means the target is not visible."],
      ["h", "Drainage characteristics and patterns", ["Rivers, tributaries, confluences, watersheds, interfluves, rapids, falls, swamps", "Patterns: dendritic, trellis, radial, centripetal, parallel, annular, rectangular, deranged", "Relationship between drainage, rock and relief"], "Describe direction of flow (from contours), density of streams, and nature of channels."],
      ["i", "Communication, settlement and land use", ["Roads, tracks, railways, footpaths, bridges, airstrips — relation to relief", "Settlement patterns: nucleated, dispersed, linear; sites (gap, bridging point, hilltop, route centre)", "Land use: farmland, forest reserves, plantations, mining, quarries"], "Explain why routes follow valleys or ridges and avoid swamps and steep slopes."],
    ]),
    T("SD", "2", "▤", "Statistical Maps and Diagrams", "Graphical representation of statistical data: bar graphs, line graphs, flow charts, dot maps, proportional circles, density (choropleth) maps and isopleth maps.", [
      ["a", "Bar graphs and line graphs", ["Simple, compound (divided) and multiple bar graphs", "Line graphs for continuous data (rainfall, temperature, population over time)", "Choosing scales, labelling axes, titles and keys"], "Bars for discrete data; lines for continuous change over time."],
      ["b", "Flow charts and flow maps", ["Flow lines whose width is proportional to the quantity moved", "Traffic flow, migration, trade and commodity movement"], "Width of band = quantity × chosen scale (e.g. 1 mm = 1000 vehicles)."],
      ["c", "Dot maps", ["Each dot represents a fixed quantity (e.g. 1 dot = 10 000 people)", "Choosing dot value and size; placing dots realistically"], "Shows distribution and clustering, not exact values."],
      ["d", "Proportional circles (and spheres)", ["Area of circle proportional to value: radius ∝ √value", "Pie charts (divided circles): angle = (part ÷ total) × 360°"], "To compare two values, compare √ of the values, not the values themselves."],
      ["e", "Density (choropleth) maps", ["Shading administrative units by density classes (e.g. persons per km²)", "Choosing class intervals; darker shades for higher values"], "Density = number ÷ area. The whole unit is shaded uniformly, hiding variation inside it."],
      ["f", "Isopleth maps", ["Lines joining places of equal value: isohyets (rainfall), isotherms (temperature), isobars (pressure)", "Interpolating between known values"], "Isopleths assume the value changes gradually over space."],
    ]),
    T("EP", "3", "◐", "The Earth as a Planet", "The earth in relation to the sun, latitude and distance, longitude and time, rotation and revolution and their effects, and the structure of the earth.", [
      ["a", "The solar system and the earth's shape", ["The sun and the eight planets; the earth's position and size", "Evidence of the spherical shape: ship's hull and mast, circumnavigation, lunar eclipse, photographs from space, circular horizon"], "Earth's mean radius ≈ 6 371 km; equatorial circumference ≈ 40 075 km."],
      ["b", "Latitude and distance", ["Parallels of latitude: equator 0°, tropics 23½°N and S, Arctic and Antarctic circles 66½°", "Distance along a meridian: 1° of latitude ≈ 111 km", "Calculating distances between places on the same meridian"], "Distance = difference in latitude × 111 km (same side: subtract; opposite sides: add)."],
      ["c", "Longitude and time", ["Meridians; Greenwich (prime) meridian 0°; International Date Line 180°", "The earth turns 360° in 24 hours: 15° = 1 hour, 1° = 4 minutes", "Local time and standard time; time zones; places east are ahead, west are behind"], "Nigeria uses West Africa Time (GMT + 1); Ghana, Sierra Leone, Liberia and The Gambia use GMT."],
      ["d", "Rotation of the earth and its effects", ["The earth spins from west to east once in about 24 hours", "Effects: day and night, apparent movement of the sun, deflection of winds and currents (Coriolis), difference in time, tides with the moon"], "Winds are deflected to the right in the northern hemisphere and to the left in the southern hemisphere (Ferrel's law)."],
      ["e", "Revolution, seasons and the noon sun", ["The earth orbits the sun in about 365¼ days; axis tilted 23½° and parallel in space", "Equinoxes (21 March, 23 September), solstices (21 June, 22 December)", "Changing length of day and night; seasons; midday sun overhead between the tropics; leap year"], "Altitude of the noon sun = 90° − (latitude ± declination)."],
      ["f", "Structure of the earth", ["Crust (sial and sima), mantle, outer core (liquid), inner core (solid)", "Discontinuities: Mohorovičić (crust–mantle) and Gutenberg (mantle–core)", "External structure: lithosphere, hydrosphere, atmosphere, biosphere"], "Continental crust ≈ 35 km thick (granitic, sial); oceanic crust ≈ 7 km (basaltic, sima)."],
    ]),
    T("RK", "4", "◆", "Rocks", "Types, characteristics, formation and uses of rocks.", [
      ["a", "Igneous rocks", ["Formed by cooling and solidifying of magma or lava", "Intrusive (plutonic: granite, gabbro — large crystals) and extrusive (volcanic: basalt — small crystals)", "Characteristics: crystalline, hard, no fossils, no layers"], "Granite forms inselbergs such as Olumo, Zuma and Idanre hills; basalt underlies the Jos and Biu plateaus."],
      ["b", "Sedimentary rocks", ["Formed from deposited and compacted sediments", "Mechanically formed (sandstone, shale, clay), organically formed (limestone, coal), chemically formed (rock salt, ironstone)", "Characteristics: layered (strata), may contain fossils, often porous"], "Coal at Enugu, limestone at Ewekoro, Nkalagu and Sokoto; petroleum is found in sedimentary basins."],
      ["c", "Metamorphic rocks and uses of rocks", ["Formed when existing rocks are changed by great heat and/or pressure", "Granite → gneiss, shale → slate, limestone → marble, sandstone → quartzite", "Uses: building, road making, cement, ornaments, minerals, soil formation, tourism"], "The rock cycle links all three types."],
    ]),
    T("TC", "5", "▲", "Tectonic Processes and Landforms", "Vulcanicity, earthquakes and landforms: mountains, plains, karst and coastal landforms — formation, characteristics and importance.", [
      ["a", "Vulcanicity", ["Intrusive features: batholith, laccolith, sill, dyke", "Extrusive features: volcanic cones (ash, cinder, composite), shield volcanoes, lava plateaus, craters, calderas, geysers, hot springs", "Active, dormant and extinct volcanoes"], "Mount Cameroon is an active volcano; the Jos Plateau has extinct volcanic cones."],
      ["b", "Earthquakes", ["Focus and epicentre; seismic waves (P, S and L)", "Measurement: seismograph, Richter scale", "Causes, effects and distribution (plate boundaries)"], "Each whole number on the Richter scale is about 10× more ground movement and about 32× more energy."],
      ["c", "Mountains", ["Fold mountains (Atlas), block mountains and rift valleys (East African Rift), volcanic mountains (Cameroon, Kilimanjaro), residual mountains", "Formation by compression and tension", "Importance: minerals, tourism, rainfall, HEP, grazing"], "Horst = block raised between faults; graben/rift valley = block sunk between faults."],
      ["d", "Plains and plateaus", ["Structural, depositional (alluvial, deltaic, coastal), erosional (peneplain) plains", "Plateaus: tectonic, volcanic (lava), dissected", "Importance of plains for farming, settlement and transport"], "The Niger–Benue trough and the Sokoto plains; the Jos, Mambilla and Obudu plateaus."],
      ["e", "Karst landforms", ["Limestone dissolved by rainwater containing carbonic acid", "Surface: clints, grikes, swallow holes, dolines, uvalas, poljes; underground: caves, stalactites, stalagmites, pillars", "Importance: tourism, water supply, cement"], "CaCO₃ + H₂O + CO₂ → Ca(HCO₃)₂ (soluble)."],
      ["f", "Coastal landforms", ["Erosion: cliffs, wave-cut platforms, caves, arches, stacks, stumps, headlands and bays", "Deposition: beaches, spits, bars, tombolos, lagoons, deltas", "Importance: ports, tourism, fishing, settlement"], "The West African coast has many lagoons and sand bars (Lagos, Keta)."],
    ]),
    T("DN", "6", "≈", "Denudational Processes", "Agencies modifying landforms: weathering, mass movement, running water, underground water, wind and waves.", [
      ["a", "Weathering", ["Mechanical: temperature changes (exfoliation, granular disintegration), frost action, crystal growth, plant roots", "Chemical: solution, carbonation, oxidation, hydration, hydrolysis", "Biological weathering; factors: climate, rock type, relief, vegetation"], "Chemical weathering dominates in hot, humid rainforest areas; mechanical weathering in hot deserts."],
      ["b", "Mass movement", ["Slow: soil creep, solifluction", "Rapid: landslides, slumps, rock falls, mudflows, earthflows", "Causes and effects; prevention"], "Evidence of soil creep: bent tree trunks, tilted posts and walls, terracettes."],
      ["c", "Running water: rivers", ["Erosion (hydraulic action, abrasion, attrition, solution), transportation (traction, saltation, suspension, solution), deposition", "Upper course: V-shaped valley, interlocking spurs, waterfalls, rapids, gorges, potholes", "Middle and lower course: meanders, ox-bow lakes, flood plains, levées, deltas, braided channels"], "River long profile: steep in the youthful stage, gentle and graded towards the mouth."],
      ["d", "Underground water", ["Porous and permeable rocks; aquifers; water table", "Springs, wells, artesian basins, boreholes", "Work of underground water in limestone (karst)"], "An artesian well flows without pumping because the aquifer is confined between impermeable layers and recharged at a higher level."],
      ["e", "Wind action", ["Erosion (deflation, abrasion, attrition) and deposition", "Landforms: rock pedestals, zeugens, yardangs, mesas, buttes, inselbergs, deflation hollows, oases", "Dunes: barchans and seifs; loess"], "Barchans are crescent-shaped with horns pointing downwind."],
      ["f", "Wave action", ["Constructive and destructive waves; swash and backwash", "Longshore drift", "Erosion and deposition landforms along coasts"], "Groynes and sea walls are used to control coastal erosion."],
    ]),
    T("WX", "7", "☂", "Weather — local observation", "Simple weather study based on local observation, the Stevenson screen and basic weather instruments.", [
      ["a", "The Stevenson screen and weather instruments", ["Stevenson screen: white louvred wooden box on legs about 1.2 m high, door facing away from the sun", "Instruments: maximum and minimum (Six's) thermometers, wet and dry bulb (hygrometer), rain gauge, barometer, wind vane, anemometer, sunshine recorder", "Siting of a weather station"], "Readings are taken at fixed times (e.g. 09:00) every day."],
      ["b", "Recording and using weather observations", ["Daily mean temperature and range, monthly rainfall totals", "Relative humidity from wet and dry bulb readings", "Weather symbols and simple weather reports"], "Mean daily temperature = (max + min) ÷ 2; diurnal range = max − min."],
    ]),
    T("CL", "8", "☀", "Climate", "Climatic elements, factors that influence them, climatic charts and data, major climate types, and classification of climate.", [
      ["a", "Elements of climate", ["Rainfall (convectional, relief/orographic, frontal/cyclonic), sunshine, air pressure, winds, humidity, temperature and cloud", "Pressure belts and planetary winds; the ITCZ, the south-west monsoon and the north-east trades (harmattan) over West Africa"], "Rainfall in West Africa follows the northward and southward movement of the ITD/ITCZ."],
      ["b", "Factors affecting climatic elements", ["Latitude, altitude (≈ 6.5 °C fall per 1 000 m), distance from the sea (continentality), ocean currents, winds, aspect, relief, land and sea breezes, vegetation"], "Jos is cooler than Lagos mainly because of altitude."],
      ["c", "Interpretation of climatic charts and data", ["Reading temperature and rainfall graphs (climographs)", "Annual mean, range, total rainfall, wet and dry months", "Identifying the climate type and hemisphere from data"], "Hottest month in June/July = northern hemisphere; in December/January = southern hemisphere."],
      ["d", "Major types of climate", ["Hot climates: equatorial, tropical continental (Sudan), tropical monsoon, hot desert", "Temperate: warm temperate (Mediterranean, warm temperate eastern margin) and cool temperate (western margin, continental)", "Location, characteristics, vegetation and human activities"], "Equatorial: about 27 °C all year, small range, rain in all months (2 000 mm+)."],
      ["e", "Classification of climate: Greek and Köppen", ["Greek: torrid, temperate and frigid zones based on latitude/temperature", "Köppen: A (tropical humid), B (dry), C (warm temperate), D (cold), E (polar), with letters for rainfall and temperature", "Merits and limitations"], "Köppen uses monthly temperature and rainfall values and links them to natural vegetation."],
    ]),
    T("EN", "9", "♻", "The Environment", "Environmental resources, environmental problems/hazards, and environmental conservation.", [
      ["a", "Environmental resources", ["Meaning; renewable (vegetation, water, soil, solar, wind) and non-renewable (minerals, fossil fuels)", "Types: vegetation, water, mineral, atmospheric, land, human resources", "Importance of each"], "A resource is anything in the environment that satisfies human needs."],
      ["b", "Environmental problems and hazards", ["Soil erosion (sheet, rill, gully), drought, desert encroachment, flooding and pollution (air, water, land, noise)", "Causes, effects and prevention of each"], "Gully erosion is severe in south-eastern Nigeria; desert encroachment affects the northern states."],
      ["c", "Environmental conservation", ["Meaning and importance", "Methods: afforestation, reforestation, game reserves and national parks, legislation, education, recycling, controlled grazing, terracing", "Problems and solutions"], "Conservation is the wise use and protection of resources for present and future generations."],
    ]),
    T("PO", "10", "☺", "World Population", "Factors and patterns of growth, distribution and movement; growth-rate problems.", [
      ["a", "Population growth and distribution", ["Birth rate, death rate, natural increase, growth rate, doubling time", "Population pyramids and age–sex structure; demographic transition", "Factors of distribution: physical (relief, climate, soils, water, vegetation) and human (economic, historical, political)"], "Doubling time ≈ 70 ÷ growth rate (%)."],
      ["b", "Population movement and growth problems", ["Migration: internal (rural–urban) and international; push and pull factors", "Problems of rapid growth: unemployment, housing, food, pressure on services; problems of low population", "Population policies"], "Over-population, under-population and optimum population relate people to resources."],
    ]),
    T("SE", "11", "⌂", "Settlement", "Rural and urban settlements: patterns, location factors, growth and size, functions and interaction; migration.", [
      ["a", "Types and patterns of settlement", ["Rural and urban settlements", "Patterns: nucleated, dispersed, linear, ring", "Site and situation"], "Linear settlements grow along roads, rivers or ridges."],
      ["b", "Location, growth and functions", ["Factors: water supply, defence, relief, fertile soils, route centres, minerals, administration", "Growth and size; hierarchy (hamlet, village, town, city, conurbation, megacity)", "Functions: administrative, commercial, industrial, mining, educational, religious, port"], "Higher-order settlements are fewer, larger, and provide more specialised services (central place idea)."],
      ["c", "Interaction and migration", ["Urban–rural, rural–urban, urban–urban and rural–rural interactions", "Movement of people, goods, money and ideas", "Problems of urbanisation and solutions"], "Problems include slums, traffic congestion, unemployment, pollution and pressure on services."],
    ]),
    T("TR", "12", "⇄", "Transportation", "Modes of transport and their role in economic development; problems and solutions.", [
      ["a", "Modes of transport", ["Roads, railways, water (inland and ocean), air, pipelines, cables and ropeways", "Advantages and disadvantages of each mode; costs over distance"], "Water is cheapest for bulky goods over long distances; air is fastest and dearest."],
      ["b", "Transport and economic development", ["Movement of people and goods, national and international trade, diffusion of ideas and technology, national integration", "Problems: poor maintenance, congestion, accidents, funding; solutions"], "A good transport network opens up markets and lowers costs."],
    ]),
    T("IN", "13", "⚙", "Industry", "Classification and types of industry, factors of industrial location, contribution to development, problems and solutions.", [
      ["a", "Classification and types of industry", ["Primary (extractive), secondary (manufacturing) and tertiary (services); quaternary", "Heavy and light industries", "Contributions to development"], "Examples: fishing (primary), cement making (secondary), banking (tertiary)."],
      ["b", "Factors of industrial location and problems", ["Raw materials, power, market, labour, capital, transport, water, government policy, land", "Weight-losing and weight-gaining industries", "Problems and solutions"], "Weight-losing industries (cement, sugar) locate near raw materials; weight-gaining (bottling) near markets."],
    ]),
    T("TD", "14", "⇆", "Trade", "Meaning, types, reasons for and importance of trade.", [
      ["a", "Trade: types, reasons and importance", ["Home (internal) and international (external) trade; bilateral and multilateral", "Reasons: unequal distribution of resources, specialisation, surplus production", "Balance of trade and balance of payments; importance and problems"], "West African exports are mainly primary products; imports mainly manufactured goods."],
    ]),
    T("TO", "15", "✈", "Tourism", "Meaning, centres, reasons, importance, problems and solutions.", [
      ["a", "Tourism: centres, reasons, importance and problems", ["Tourism is travel for leisure, recreation, education, religion, business or health", "Attractions: beaches, wildlife parks, waterfalls, highlands, historic sites, festivals", "Importance (foreign exchange, jobs, infrastructure) and problems (insecurity, poor roads, pollution)"], "Examples: Yankari, Obudu, Mole, Kakum, Cape Coast Castle, Tiwai Island, Sapo, Abuko."],
    ]),
    T("FW", "16", "✎", "Field Work", "Fieldwork on local geography — part of continuous assessment (25% of the CA mark).", [
      ["a", "Land use survey", ["Rural land use: crop farming (rice, cocoa), mining, fishing", "Urban land use: commercial, ports, factories, recreation", "Mapping land use on a base map"], "Use a key of colours or symbols; calculate the percentage of each land use."],
      ["b", "Market survey", ["Types of goods, sellers and buyers, sources of goods, market days", "Recording in tables and presenting with bar graphs and pie charts"], "Range and threshold of goods: how far people travel to buy them."],
      ["c", "Traffic flow survey", ["Counting vehicles by type and direction at fixed intervals", "Peak hours and flow maps"], "Present results with a flow line map and a line graph of counts per hour."],
      ["d", "Patterns of journey to work", ["Questionnaire on origin, distance, mode and time of journey", "Desire-line maps"], "Desire lines are straight lines from home to workplace."],
      ["e", "Rate of erosion in the locality", ["Using erosion pins or stakes over a period", "Measuring gully depth and width; relating erosion to slope, cover and rainfall"], "Rate = change in depth ÷ time."],
    ]),
  ];

  const NIGERIA = [
    T("GIS", "N1", "⧉", "Geographic Information System (GIS)", "Nigeria only (**). Basic concepts, components, sources of data, uses and problems of GIS.", [
      ["a", "GIS: concepts and components", ["GIS: a computer system for capturing, storing, analysing and displaying geographically referenced data", "Components: hardware, software, data, procedures (methods) and people (experts)", "Vector (points, lines, polygons) and raster (grid) data; layers"], "Overlaying layers (roads, rivers, soils, population) reveals relationships."],
      ["b", "Sources of data, uses and problems", ["Sources: land surveying, remote sensing (satellites, aerial photographs), GPS, map digitising and scanning, field investigation, tabular data", "Uses: defence, agriculture, urban development, mapping, transportation, census, disaster management", "Problems: power supply, trained personnel, capital, data availability"], ""],
    ]),
    T("CC", "N2", "♨", "Climate Change", "Nigeria only (**). Meaning, causes, effects and remedies.", [
      ["a", "Climate change: causes, effects and remedies", ["Long-term change in average weather patterns; global warming", "Causes: greenhouse gases from burning fossil fuels, gas flaring, deforestation, agriculture; natural causes", "Effects: rising temperature, sea-level rise, floods, drought, desertification, crop failure; remedies: mitigation and adaptation"], "Gas flaring in the Niger Delta and deforestation add to Nigeria's emissions."],
    ]),
    T("NG", "N3", "★", "Regional Geography of Nigeria", "Paper 2 Section B for candidates in Nigeria: location, physical setting, population, resources, agriculture, transport, communication, industry, trade, tourism, development and environment, ECOWAS and geo-political issues.", [
      ["a", "Nigeria on broad outline", ["Location: about latitudes 4°N–14°N and longitudes 3°E–15°E", "Size: about 923 768 km²; neighbours Benin, Niger, Chad, Cameroon", "Political divisions: 36 states and the Federal Capital Territory (Abuja); six geo-political zones"], ""],
      ["b", "Physical setting", ["Relief: coastal lowlands, Niger–Benue troughs, Jos Plateau, eastern highlands (Mambilla, Obudu, Chappal Waddi), Sokoto and Chad basins", "Drainage: Niger, Benue, Lake Chad basin, coastal rivers", "Climate and vegetation belts: mangrove and rainforest in the south to Sudan and Sahel savanna in the north"], ""],
      ["c", "Population", ["Size, distribution and density; dense in the south-west, south-east and Kano–Katsina; sparse in the Middle Belt", "Structure, quality and movement", "Sources of data (census, registration, surveys), problems and solutions"], ""],
      ["d", "Resources", ["Minerals: petroleum and gas (Niger Delta), coal (Enugu), tin and columbite (Jos), iron ore (Itakpe), limestone (Ewekoro, Nkalagu, Sokoto)", "Power: petroleum, gas, coal, HEP (Kainji, Jebba, Shiroro), solar", "Water and vegetation resources"], ""],
      ["e", "Agriculture", ["Types: subsistence, plantation, mixed farming, pastoral (Fulani), irrigation", "Food crops and cash crops (cocoa, oil palm, rubber, groundnut, cotton)", "Importance, problems and solutions"], ""],
      ["f", "Transportation", ["Roads, railways, inland waterways, sea ports (Apapa, Tin Can, Port Harcourt, Onne, Warri, Calabar), airports, pipelines", "Advantages, disadvantages, problems and solutions"], ""],
      ["g", "Communication", ["Postal, telephone, mobile networks, internet, radio, television, newspapers, satellites", "Importance, problems and solutions"], ""],
      ["h", "Industry", ["Types; major industrial zones (Lagos–Ota–Ikeja, Kano–Kaduna, Port Harcourt–Aba–Onitsha, Ibadan)", "Factors of location, importance, problems and solutions"], ""],
      ["i", "Trade", ["Internal and international trade; major exports (crude oil, gas, cocoa) and imports", "Stock exchange, capital market, forex; major commercial areas"], ""],
      ["j", "Tourism", ["Centres: Yankari, Obudu, Olumo Rock, Argungu festival, Osun-Osogbo grove, beaches", "Importance, problems and solutions"], ""],
      ["k", "Issues on development and environmental concerns", ["Rural and regional development; resource management and conservation", "Pollution (oil spills, gas flaring), waste disposal, erosion, desertification"], ""],
      ["l", "ECOWAS", ["Meaning, member countries, purposes and mandate", "Advantages, disadvantages, problems and solutions"], "Mali, Burkina Faso and Niger left ECOWAS in January 2025, leaving 12 member states."],
      ["m", "Geo-political issues: land reclamation", ["Reclaiming land from the sea, lagoons and swamps (e.g. Eko Atlantic, Lekki)", "Benefits and problems"], ""],
    ]),
  ];

  const ANGLO = [
    T("SV", "X1", "⌐", "Principles of Elementary Surveying", "Ghana, Sierra Leone, Liberia, The Gambia (*). Definitions, instruments, chain and prismatic compass surveys, plotting a traverse, avoiding obstacles.", [
      ["a", "Chain survey", ["Instruments: chain, tape, ranging poles, arrows, offset staff, field book", "Survey lines, base line, check lines, offsets", "Avoiding obstacles (ponds, buildings)"], "Offsets are short measurements at right angles from the chain line to features."],
      ["b", "Prismatic compass traverse", ["Taking forward and back bearings; open and closed traverses", "Plotting a traverse to scale; closing error and its adjustment"], "Back bearing = forward bearing ± 180°."],
    ]),
    T("HY", "X2", "≋", "The Hydrosphere", "Ghana, Sierra Leone, Liberia, The Gambia (*). Ocean basins, salinity, ocean currents, lakes, rivers, lagoons, water as a resource.", [
      ["a", "Ocean basins and salinity", ["Continental shelf, slope, abyssal plain, ocean deeps (trenches), mid-ocean ridges", "Salinity: average 35‰; causes of variation (evaporation, fresh water inflow, enclosure)"], "The Dead Sea and Red Sea are very saline; the Baltic is much less saline."],
      ["b", "Ocean currents", ["Causes: planetary winds, differences in density and temperature, earth's rotation, shape of coastlines", "Warm and cold currents; the Guinea (warm), Canary and Benguela (cold) currents", "Effects on adjacent coastlands: temperature, rainfall, fog, fishing"], "Cold currents cool coasts and cause fog and aridity (Namib desert, Benguela current)."],
      ["c", "Lakes, rivers and lagoons; water as a resource", ["Types and origin of lakes (tectonic, volcanic, glacial, man-made — Volta, Kainji)", "Lagoons behind sand bars", "Uses of water: domestic, irrigation, HEP, fishing, transport, recreation"], ""],
    ]),
    T("VG", "X3", "♣", "Vegetation", "Ghana, Sierra Leone, Liberia, The Gambia (*). Major types, characteristics, distribution, plant communities, vegetation as a resource and its conservation.", [
      ["a", "Major vegetation types", ["Tropical rainforest, tropical grassland (savanna), cool and warm temperate woodland", "Characteristics, distribution and factors (climate, soil, relief, human activities)", "Plant communities and layers"], "Rainforest has three tree layers, buttress roots, lianas and evergreen broad leaves."],
      ["b", "Vegetation as a resource and its conservation", ["Uses: timber, fuelwood, food, medicine, grazing, tourism", "Threats: deforestation, bush burning, overgrazing", "Conservation methods"], ""],
    ]),
    T("SO", "X4", "▦", "Soil", "Ghana, Sierra Leone, Liberia, The Gambia (*). Definition, local types, formation, profile, importance, effects of human activity, erosion and conservation.", [
      ["a", "Soil formation and the soil profile", ["Soil: the loose top layer of the earth's crust containing minerals, organic matter, air, water and organisms", "Factors: parent rock, climate, relief, organisms, time; processes: weathering, leaching, laterisation, podzolisation, humification", "Soil profile: O, A, B, C horizons and bedrock; local soils (laterite, alluvial, sandy)"], ""],
      ["b", "Soil erosion and conservation", ["Types: sheet, rill, gully erosion; causes and effects", "Conservation: cover crops, terracing, contour ploughing, mulching, afforestation, crop rotation, controlled grazing"], ""],
    ]),
    T("AF", "X5", "◈", "Regional Geography of Africa", "Paper 2 Section C (Ghana, Sierra Leone, Liberia, The Gambia): Africa on broad outline and selected topics.", [
      ["a", "Africa on broad outline", ["Location, size, position, political divisions and associated islands", "Physical features and their economic importance: relief, drainage, climate and vegetation", "Distribution of minerals"], "Africa is about 30.3 million km², second largest continent, crossed by the equator and both tropics."],
      ["b", "Irrigation agriculture: Nile and Niger basins", ["Gezira scheme (Sudan), Aswan High Dam (Egypt), Office du Niger (Mali), Kano River Project (Nigeria)", "Methods, crops, benefits and problems"], ""],
      ["c", "Plantation agriculture in West and East Africa", ["Rubber (Liberia), oil palm and cocoa (Côte d'Ivoire, Ghana), tea and coffee (Kenya)", "Characteristics, problems and solutions"], ""],
      ["d", "Oil production: Nigeria, Ghana, Libya", ["Niger Delta (onshore and offshore), Jubilee field (Ghana), Sirte basin (Libya)", "Exploration, production, transport, refining; importance and problems"], ""],
      ["e", "Lumbering in equatorial Africa", ["Côte d'Ivoire and DR Congo (Zaire): species, methods, transport", "Problems and conservation"], ""],
      ["f", "Gold mining in South Africa", ["The Witwatersrand reef (Johannesburg); deep shaft mining", "Importance and problems"], ""],
      ["g", "Copper mining in Zambia and DR Congo", ["The Copperbelt (Kitwe, Ndola) and Katanga (Lubumbashi)", "Methods, transport routes, importance and problems"], ""],
      ["h", "Population distribution in West Africa", ["Dense areas (coastal cities, cocoa belt, Kano close-settled zone) and sparse areas (Middle Belt, Sahel)", "Factors and problems"], ""],
      ["i", "ECOWAS", ["Meaning, member countries, purposes/mandate", "Advantages, disadvantages, problems and solutions"], "Mali, Burkina Faso and Niger left ECOWAS in January 2025, leaving 12 member states."],
    ]),
  ];

  const GHANA = [
    T("GH", "B", "★", "Regional Geography of Ghana", "Paper 2 Section B for candidates in Ghana.", [
      ["a", "Ghana on broad outline", ["Location: about latitudes 4.5°N–11°N and longitudes 3.25°W–1.2°E", "Size: about 238 500 km²; neighbours Côte d'Ivoire, Burkina Faso, Togo", "Political divisions: 16 regions"], ""],
      ["b", "Physical setting", ["Geology, relief (Akwapim–Togo ranges, Kwahu plateau, Volta basin, coastal plains), drainage (Volta, Pra, Ankobra, Tano)", "Climate, vegetation (rainforest, coastal savanna, Guinea and Sudan savanna) and soils"], ""],
      ["c", "Population", ["Size, growth, distribution and density, age/sex structure", "Fertility, morbidity, mortality and migration"], ""],
      ["d", "Settlement", ["Origin, rural and urban types, hierarchy, land use", "Urbanisation processes, problems and solutions"], ""],
      ["e", "Agriculture", ["Subsistence (intensive and extensive), commercial (vegetables, livestock, dairying, grain), plantation (cocoa, oil palm, rubber)", "Problems and solutions"], ""],
      ["f", "Fishing", ["Inland (Volta Lake) and ocean (in-shore and off-shore); methods and types of fish", "Storage, marketing, importance, problems and solutions"], ""],
      ["g", "Lumbering", ["Sources of timber, methods of exploitation, species for local use and export", "Problems, solutions and conservation"], ""],
      ["h", "Mining", ["Gold (Obuasi, Tarkwa), diamonds (Akwatia), bauxite (Awaso), manganese (Nsuta), oil and gas", "Methods of extraction, importance, problems and solutions"], ""],
      ["i", "Manufacturing", ["Types, distribution (Accra–Tema, Kumasi, Takoradi), factors of location", "Problems of industrialisation"], ""],
      ["j", "Trade and commerce", ["Services, transport and communication, administration", "Internal and external trade"], ""],
      ["k", "Tourism", ["Centres: Cape Coast and Elmina castles, Kakum, Mole, Wli falls, beaches", "Importance, problems and solutions"], ""],
      ["l", "Energy and power", ["Akosombo and Kpong HEP (benefits and side effects), fuelwood and charcoal, petroleum and natural gas (Saltpond)", "Solar, wave and wind (Donkokrom, Kokrobite), biogas"], ""],
      ["m", "Issues on development and environmental concerns", ["Rural and regional development, resource management and conservation", "Pollution (illegal mining — galamsey), waste disposal"], ""],
    ]),
  ];

  const SLE = [
    T("SLE", "B", "★", "Regional Geography of Sierra Leone", "Paper 2 Section B for candidates in Sierra Leone.", [
      ["a", "Sierra Leone on broad outline", ["Size (about 71 740 km²) and location (about 7°N–10°N, 10.3°W–13.3°W)", "Physical environment: coastal swamps and Freetown peninsula, interior plains, plateaus and mountains (Loma, Bintumani)", "People and settlements"], ""],
      ["b", "Agriculture", ["Subsistence (upland and swamp rice), commercial and plantation crops (cocoa, coffee, oil palm)", "Problems and solutions"], ""],
      ["c", "Fishing", ["Inland and ocean fishing, methods, types of fish, storage and marketing", "Importance, problems and solutions"], ""],
      ["d", "Lumbering", ["Sources of timber, methods, species", "Problems, solutions and conservation (Gola forest)"], ""],
      ["e", "Mining", ["Diamonds (Kono), iron ore (Marampa, Tonkolili), bauxite (Mokanji), rutile (Sierra Rutile)", "Methods, problems and solutions"], ""],
      ["f", "Manufacturing, energy and power", ["Location and types of industry, problems", "Energy: water, fuelwood and charcoal, biogas; HEP projects: Dodo, Guma, Bumbuna"], ""],
      ["g", "Transport and communication", ["Road, rail, water, air; roles in development", "Problems and solutions"], ""],
      ["h", "Trade", ["Major commodities (minerals, agricultural, manufactured goods); internal and external patterns", "Problems of trade"], ""],
      ["i", "Population", ["Size, growth, distribution and migration"], ""],
      ["j", "Tourism", ["Development, main areas (beaches, Tiwai Island, Outamba-Kilimi, Bunce Island)", "Problems, solutions, socio-economic effects"], ""],
    ]),
  ];

  const LBR = [
    T("LBR", "B", "★", "Regional Geography of Liberia", "Paper 2 Section B for candidates in Liberia.", [
      ["a", "Liberia on broad outline", ["Location (about 4.3°N–8.5°N, 7.4°W–11.5°W), position, size (about 111 370 km²), distances", "Political divisions: 15 counties"], ""],
      ["b", "Physical setting", ["Relief (coastal plain, rolling hills, plateaus, Nimba and Wologizi ranges), drainage (St Paul, St John, Cavalla, Mano)", "Climate, vegetation and soil"], ""],
      ["c", "Population", ["Size, distribution, structure, quality, movement", "Population data: sources, problems and solutions"], ""],
      ["d", "Resources", ["Minerals (iron ore, gold, diamonds), power, water and vegetation resources", "Importance to development"], ""],
      ["e", "Agriculture", ["Types of practice, food and cash crops (rubber, cocoa, coffee, oil palm)", "Importance, problems and solutions"], ""],
      ["f", "Transportation", ["Modes, advantages and disadvantages, influence on human activities", "Problems and solutions"], ""],
      ["g", "Communication", ["Networks, advantages and disadvantages, importance", "Problems and solutions"], ""],
      ["h", "Industry", ["Types, major industrial zones, factors of location", "Importance, problems and solutions"], ""],
      ["i", "Trade", ["National and international trade, forex, major commercial areas", "Importance of commercial activities"], ""],
      ["j", "Tourism", ["Centres (beaches, Sapo National Park, Providence Island), reasons, importance", "Problems and solutions"], ""],
      ["k", "Fishing", ["Inland and ocean fishing, methods, types of fish", "Storage, marketing, importance, problems and solutions"], ""],
      ["l", "Mining", ["Types and distribution of minerals (Bong, Nimba, Bomi Hills, Mano River), methods", "Problems and solutions"], ""],
    ]),
  ];

  const SNG = [
    T("SNG", "B", "★", "Regional Geography of Senegambia", "Paper 2 Section B for candidates in The Gambia: The Gambia and Senegal.", [
      ["a", "Senegambia on broad outline", ["Location, position, size (The Gambia about 11 300 km², Senegal about 196 700 km²), distances", "Political divisions"], ""],
      ["b", "Physical setting", ["Relief (low plains, Fouta Djallon edge), drainage (Gambia, Senegal, Casamance, Saloum rivers)", "Climate, vegetation and soil"], ""],
      ["c", "Population", ["Size, distribution, structure, quality, movement", "Population data: sources, problems and solutions"], ""],
      ["d", "Resources", ["Mineral (phosphates, heavy-mineral sands), power, water and vegetation resources", "Importance to development"], ""],
      ["e", "Agriculture", ["Types; food and cash crops (groundnuts, rice, millet, cotton, horticulture)", "Importance, problems and solutions"], ""],
      ["f", "Transportation", ["Modes, river transport on the Gambia, the Senegambia bridge, influence on human activities", "Problems and solutions"], ""],
      ["g", "Communication", ["Networks, advantages and disadvantages, importance", "Problems and solutions"], ""],
      ["h", "Industry", ["Types, major industrial zones, factors of location", "Importance, problems and solutions"], ""],
      ["i", "Mining", ["Types, distribution, methods of extraction", "Problems and solutions"], ""],
      ["j", "Fishing", ["Inland and ocean fishing, methods, types of fish, storage and marketing", "Problems and solutions"], ""],
      ["k", "Issues on development and environmental concerns", ["Rural and regional development, resource management", "Pollution, waste disposal, coastal erosion, salt intrusion"], ""],
      ["l", "Trade", ["National and international trade, re-export trade, forex, commercial areas", "Problems and solutions"], ""],
      ["m", "Tourism", ["Centres (beaches, Abuko, Kunta Kinteh Island, River Gambia), reasons, importance", "Problems and solutions"], ""],
    ]),
  ];

  window.GEO = {
    core: CORE, nigeria: NIGERIA, anglo: ANGLO, ghana: GHANA, sle: SLE, lbr: LBR, sng: SNG,
    order: ["core", "nigeria", "anglo", "ghana", "sle", "lbr", "sng"],
    tabs: { core: "All", nigeria: "Nigeria", anglo: "Gh·SL·Lib·Gam", ghana: "Ghana", sle: "S. Leone", lbr: "Liberia", sng: "Gambia" },
    labels: { core: "All candidates — practical, physical and human geography", nigeria: "Nigeria — GIS, climate change and regional geography", anglo: "Ghana, Sierra Leone, Liberia, The Gambia — extra physical topics and Africa", ghana: "Regional geography of Ghana", sle: "Regional geography of Sierra Leone", lbr: "Regional geography of Liberia", sng: "Regional geography of Senegambia" },
    blurbs: {
      core: "Sixteen topics every WAEC candidate studies: map work, statistical diagrams, the earth, rocks, landforms, weather and climate, environment, and human geography.",
      nigeria: "Topics marked ** for Nigerian candidates, plus the regional geography of Nigeria for Paper 2 Section B.",
      anglo: "Topics marked * for Ghana, Sierra Leone, Liberia and The Gambia, plus the Regional Geography of Africa (Paper 2 Section C).",
      ghana: "Paper 2 Section B for Ghanaian candidates.",
      sle: "Paper 2 Section B for candidates in Sierra Leone.",
      lbr: "Paper 2 Section B for Liberian candidates.",
      sng: "Paper 2 Section B for candidates in The Gambia.",
    },
  };
})();
