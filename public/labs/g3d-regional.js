/* g3d-regional.js — Regional geography of Nigeria, Africa, Ghana, Sierra Leone, Liberia and Senegambia.
   One map engine: a 3D relief model built from NASA elevation (heights exaggerated), draped with NASA Blue Marble
   imagery or Natural Earth II atlas colours, with Natural Earth borders, regions, rivers and lakes. Each subtopic adds
   its own labelled places, zones and routes. */
(function () {
  "use strict";
  const MK = window.MK, BK = window.BK, GK = window.GK;
  const T = () => window.THREE;
  const V = (x, y, z) => new (T().Vector3)(x, y, z);

  const SCOPES = {
    NG: { bbox: [2.3, 3.9, 15.1, 14.2], name: "Nigeria", adm: "NGA", K: 1.6 },
    GH: { bbox: [-3.6, 4.5, 1.6, 11.4], name: "Ghana", adm: "GHA", K: 1.6 },
    SL: { bbox: [-13.5, 6.7, -10.1, 10.1], name: "Sierra Leone", adm: "SLE", K: 1.4 },
    LR: { bbox: [-11.8, 4.2, -7.2, 8.7], name: "Liberia", adm: "LBR", K: 1.4 },
    SN: { bbox: [-17.7, 12.1, -11.2, 16.8], names: ["Senegal", "Gambia"], adm: ["SEN", "GMB"], K: 1.6 },
    WA: { bbox: [-18.5, 3.5, 16, 17], name: null, K: 0.9 },
    AF: { bbox: [-20, -36, 52, 38], name: null, K: 0.7, africa: true },
  };

  /* ---------- relief map ---------- */
  GK.reliefMap = function (sc, o = {}) {
    const T3 = T(), S0 = SCOPES[sc], [lo0, la0, lo1, la1] = S0.bbox, size = o.size || 9, P = GK.proj(S0.bbox, size), g = new T3.Group();
    const nx = GK.tier === "low" ? 140 : 220, nz = Math.max(20, Math.round(nx * P.d / P.w)), geo = new T3.PlaneGeometry(P.w, P.d, nx, nz); geo.rotateX(-Math.PI / 2);
    const img = o.atlas ? "maps/africa_ne2_relief.jpg" : "earth/nasa_2_no_clouds_4k.jpg", ib = o.atlas ? [-26, -36, 60, 38] : [-180, -90, 180, 90];
    const tex = GK.texture(img, true); tex.repeat.set((lo1 - lo0) / (ib[2] - ib[0]), (la1 - la0) / (ib[3] - ib[1])); tex.offset.set((lo0 - ib[0]) / (ib[2] - ib[0]), (la0 - ib[1]) / (ib[3] - ib[1]));
    const mesh = new T3.Mesh(geo, new T3.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0 })); mesh.receiveShadow = true; mesh.castShadow = true; g.add(mesh);
    const base = new T3.Mesh(new T3.BoxGeometry(P.w + 0.06, 0.16, P.d + 0.06), new T3.MeshStandardMaterial({ color: 0x232833, roughness: 0.6 })); base.position.y = -0.085; g.add(base);
    let px = null; const K = (o.K || S0.K) * size / 9;
    const elev = (lo, la) => (px ? Math.max(0, GK.sample(px, (lo + 180) / 360, (90 - la) / 180) - 22 / 255) * K : 0);
    g.Y = (lo, la) => elev(lo, la); g.P = P;
    g.ready = GK.pixels("earth/nasa_elev_bump_4k.jpg", GK.tier === "low" ? 2048 : 4096).then((p) => { px = p; if (!p || !g.parent && !o.force) { /* still apply */ } const pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i); pos.setY(i, elev(P.lon(x), P.lat(z))); } pos.needsUpdate = true; geo.computeVertexNormals(); return g; });
    const lift = (pts, dy = 0.012) => pts.map(([lo, la]) => [Math.max(-P.w / 2, Math.min(P.w / 2, P.x(lo))), elev(lo, la) + dy, Math.max(-P.d / 2, Math.min(P.d / 2, P.z(la)))]);
    const inBox = ([lo, la]) => lo >= lo0 - 0.5 && lo <= lo1 + 0.5 && la >= la0 - 0.5 && la <= la1 + 0.5;
    const addLines = (path, col, op, filter, dy, tube) => GK.json(path).then((d) => g.ready.then(() => { if (!d) return; d.features.forEach((ft) => { if (filter && !filter(ft.properties)) return; GK.rings(ft.geometry).forEach((ring) => { const pts = ring.filter(inBox); if (pts.length < 2) return; const L = lift(pts, dy); g.add(tube ? GK.line(L, col, tube) : GK.polyline(L, col, op)); }); }); }));
    const names = S0.names || (S0.name ? [S0.name] : null), adms = [].concat(S0.adm || []);
    addLines(S0.africa ? "maps/africa_countries_50m.geojson" : "maps/westafrica_countries_10m.geojson", 0xffffff, 0.55, null, 0.014);
    if (names) addLines("maps/westafrica_countries_10m.geojson", 0xffd23a, 1, (p) => names.includes(p.NAME), 0.02, size / 900);
    if (adms.length && o.admin !== false) addLines("maps/focus_admin1_10m.geojson", 0xffffff, 0.9, (p) => adms.includes(p.adm0_a3), 0.016);
    addLines("maps/africa_rivers_10m.geojson", 0x4aa8ff, 0.95, null, 0.01, S0.africa ? null : size / 1300);
    addLines("maps/africa_lakes_10m.geojson", 0x6ac0ff, 1, null, 0.012);
    g.lift = lift; return g;
  };

  /* ---------- regional subtopic scene ---------- */
  const ZCOL = { gold: 0xffd23a, green: 0x37d67a, blue: 0x4aa8ff, red: 0xff5a3a, brown: 0xb07a3a, purple: 0xb07ae0, orange: 0xff9a3a, grey: 0xc0c0c0, teal: 0x2ad0c0 };
  GK.region = function (key, R) {
    const S0 = SCOPES[R.scope], P = GK.proj(S0.bbox, 9);
    const feats = (c, s) => { const Y = s && s.map ? s.map.Y : () => 0; const out = []; (R.pins || []).forEach(([n, la, lo, d]) => out.push({ id: "p_" + n, n, d, p: [P.x(lo), Y(lo, la) + 0.06, P.z(la)], lp: [P.x(lo), Y(lo, la) + 0.32, P.z(la)] })); (R.zones || []).forEach(([n, la, lo, rla, rlo, col, d]) => out.push({ id: "z_" + n, n, d, p: [P.x(lo), Y(lo, la) + 0.1, P.z(la)], col: "#" + (ZCOL[col] || 0xffffff).toString(16).padStart(6, "0") })); (R.lines || []).forEach(([n, col, pts, d]) => { const m = pts[Math.floor(pts.length / 2)]; out.push({ id: "l_" + n, n, d, p: [P.x(m[1]), Y(m[1], m[0]) + 0.08, P.z(m[0])], col: "#" + (ZCOL[col] || 0xffffff).toString(16).padStart(6, "0") }); }); return out; };
    GK.tour(key, {
      title: R.title, blurb: R.blurb, envOpts: { hdri: "noon_grass", sky: true, fog: false, sunPos: [-6, 10, 6], shadowExtent: 8 }, cam: R.cam || [[0.2, 8.4, 6.6], [0.3, 0, 0.3]],
      fly: R.scope === "AF" ? [0.8, 2.2, 2.6] : [0.9, 2.4, 2.8], flabel: "Place / feature", values: { atlas: 0 },
      controls: [{ type: "toggle", key: "atlas", label: "Atlas colours (instead of satellite)" }], rebuildOn: (c) => c.atlas,
      build(g, S, s, c) {
        const T3 = T(); s.map = GK.reliefMap(R.scope, { atlas: !!c.atlas, admin: R.admin !== false }); g.add(s.map); const map = s.map;
        map.ready.then(() => {
          (R.pins || []).forEach(([n, la, lo]) => { const p = GK.pin(0xff5a3a, 0.22); p.position.set(P.x(lo), map.Y(lo, la), P.z(la)); map.add(p); });
          (R.zones || []).forEach(([n, la, lo, rla, rlo, col]) => { const m = new T3.Mesh(new T3.CircleGeometry(1, 48), new T3.MeshBasicMaterial({ color: ZCOL[col] || 0xffffff, transparent: true, opacity: 0.33, depthWrite: false, side: T3.DoubleSide })); m.rotation.x = -Math.PI / 2; m.scale.set(rlo * P.k, rla * P.k, 1); m.position.set(P.x(lo), map.Y(lo, la) + 0.09, P.z(la)); map.add(m); });
          (R.lines || []).forEach(([n, col, pts]) => { const L = []; for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < 6; k++) { const t = k / 6, la = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, lo = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t; L.push([P.x(lo), map.Y(lo, la) + 0.05, P.z(la)]); } const e = pts[pts.length - 1]; L.push([P.x(e[1]), map.Y(e[1], e[0]) + 0.05, P.z(e[0])]); map.add(GK.line(L, ZCOL[col] || 0xffffff, R.scope === "AF" ? 0.025 : 0.02)); });
        });
      },
      feats,
      notes: R.notes || [],
      intro: R.intro ? [{ d: 6, cap: R.intro, cam: R.cam || [[0.2, 8.4, 6.6], [0.3, 0, 0.3]] }] : [],
      maxSteps: 9,
    });
  };

  /* =================================================================== NIGERIA =================================================================== */
  const NG = (sub, title, o) => GK.region("NG-" + sub, Object.assign({ scope: "NG", title }, o));
  NG("a", "Nigeria on broad outline", {
    blurb: "Location, size, boundaries and political divisions of Nigeria: 36 states and the Federal Capital Territory, shown on a 3D relief model.",
    intro: "Nigeria lies between latitudes 4°N and 14°N and longitudes 3°E and 15°E, on the Gulf of Guinea.",
    pins: [["Abuja (FCT)", 9.06, 7.49, "Federal capital since 1991, in the centre of the country."], ["Lagos", 6.45, 3.39, "Largest city and commercial centre; former capital."], ["Kano", 12.0, 8.52, "Largest city in the north; ancient trading city."], ["Port Harcourt", 4.82, 7.03, "Oil city of the Niger Delta."], ["Maiduguri", 11.85, 13.16, "Main city of the north-east, near Lake Chad."], ["Sokoto", 13.06, 5.24, "Seat of the Sokoto Caliphate in the north-west."]],
    lines: [["Benin border (west)", "gold", [[6.4, 2.7], [9.0, 2.7], [12.0, 3.6]], "Nigeria's western neighbour is the Republic of Benin."], ["Cameroon border (east)", "gold", [[4.6, 8.6], [7.0, 11.5], [10.5, 13.5], [12.5, 14.2]], "Cameroon lies to the east; the boundary follows highlands in the south-east."]],
    notes: ["Area: 923 768 km². Neighbours: Benin (W), Niger (N), Chad (NE), Cameroon (E); Atlantic Ocean / Gulf of Guinea (S).", "Political divisions: 36 states + FCT, 774 local government areas, six geopolitical zones (North-West, North-East, North-Central, South-West, South-East, South-South)."],
  });
  NG("b", "Physical setting of Nigeria", {
    blurb: "Relief, drainage, climate and vegetation. The model's heights come from NASA elevation data (vertically exaggerated).",
    intro: "Nigeria's relief: high plateaus in the centre and east, lowlands along the Niger–Benue trough, the Sokoto plains, the Chad basin and the coastal plain.",
    pins: [["Chappal Waddi", 7.03, 11.7, "Highest point in Nigeria, 2 419 m, on the Mambilla/Gotel mountains near the Cameroon border."], ["Jos Plateau", 9.6, 8.9, "High plateau over 1 200 m: cool climate, source of many rivers, tin mining."], ["Lokoja — Niger–Benue confluence", 7.8, 6.74, "The Niger and Benue join here and flow south to the Atlantic."], ["Niger Delta", 5.0, 6.2, "Huge delta of creeks, mangrove swamps and distributaries."], ["Lake Chad", 13.0, 14.0, "Shallow inland lake in the north-east; it has shrunk greatly since the 1960s."], ["Kainji Lake", 10.0, 4.6, "Man-made lake on the Niger behind the Kainji Dam."]],
    zones: [["Mambilla Plateau", 6.9, 11.3, 0.5, 0.5, "green", "High plateau (about 1 500 m) in the east with temperate grassland and tea estates."], ["Sokoto plains", 12.8, 5.0, 1.0, 1.4, "orange", "Low plains of the north-west drained by the Sokoto–Rima river system."], ["Chad basin", 12.3, 12.8, 1.0, 1.3, "orange", "Flat inland basin draining to Lake Chad."]],
    notes: ["Climate: tropical — hot all year; rainy season (April–October) and dry season with harmattan (November–March); rainfall falls from over 2 500 mm on the coast to under 600 mm in the far north.", "Vegetation belts: mangrove and fresh-water swamp → rainforest → Guinea savanna → Sudan savanna → Sahel savanna; montane vegetation on high plateaus.", "Drainage: Niger, Benue, Kaduna, Sokoto, Cross, Ogun, Imo, Komadugu-Yobe (to Lake Chad)."],
  });
  NG("c", "Population of Nigeria", {
    blurb: "Nigeria is Africa's most populous country. See where people are densely and sparsely settled and why.",
    pins: [["Lagos", 6.45, 3.39, "Megacity — over 15 million people in the metropolitan area."], ["Ibadan", 7.38, 3.9, "One of Africa's largest traditional cities."], ["Kano", 12.0, 8.52, "Centre of the Kano close-settled zone."], ["Onitsha", 6.15, 6.78, "Commercial city in densely settled Igboland."], ["Aba", 5.1, 7.37, "Industrial and trading city in the south-east."]],
    zones: [["Dense: South-West (Yorubaland)", 7.2, 3.9, 0.9, 1.0, "red", "Dense population — fertile soils, cocoa farming, towns and industry around Lagos and Ibadan."], ["Dense: South-East (Igboland)", 5.9, 7.2, 0.8, 0.7, "red", "Very high rural densities on limited land — leads to soil exhaustion and migration."], ["Dense: Kano–Zaria close-settled zone", 11.8, 8.3, 0.8, 0.9, "red", "Fertile soils, permanent farming, ancient cities and trade."], ["Sparse: Middle Belt", 9.0, 9.0, 1.0, 2.2, "blue", "Sparse — past slave raids, tsetse fly, poor soils and steep land in places."]],
    notes: ["Population: 140 million at the 2006 census; over 220 million today (estimates). Growth rate about 2.5% a year; more than 40% under 15.", "Major ethnic groups: Hausa–Fulani, Yoruba, Igbo, plus Ijaw, Kanuri, Tiv, Ibibio, Edo and over 250 others.", "Problems: unemployment, pressure on land and services, urban congestion; benefits: large labour force and market."],
  });
  NG("d", "Resources of Nigeria", {
    blurb: "Minerals, energy, forests and water. Pick a resource to locate it.",
    pins: [["Crude oil — Bonny", 4.43, 7.15, "Niger Delta oil fields and the Bonny export terminal; also natural gas (Bonny LNG)."], ["Warri", 5.52, 5.75, "Oil city with a refinery and port."], ["Coal — Enugu", 6.44, 7.5, "Sub-bituminous coal mined since 1915."], ["Tin and columbite — Jos", 9.9, 8.9, "Alluvial tin and columbite on the Jos Plateau."], ["Limestone — Ewekoro", 6.93, 3.2, "Limestone for Nigeria's first cement works (1960)."], ["Limestone — Obajana", 7.9, 6.4, "One of Africa's largest cement plants."], ["Iron ore — Itakpe", 7.62, 6.3, "Iron ore for the Ajaokuta steel complex."], ["Gold — Zamfara", 12.1, 6.2, "Artisanal and small-scale gold mining."], ["Bitumen — Ondo", 6.6, 4.6, "Large bitumen (tar sand) belt in Ondo, Ogun and Edo states."]],
    zones: [["Niger Delta oil and gas", 5.0, 6.4, 0.7, 1.2, "purple", "Most oil and gas comes from onshore and offshore fields in the Niger Delta."]],
    notes: ["Other resources: forests (timber), rich farmland, fish, water for HEP (Kainji, Jebba, Shiroro), solar energy in the north.", "Oil provides most export earnings and government revenue."],
  });
  NG("e", "Agriculture in Nigeria", {
    blurb: "Cash crops, food crops, livestock and irrigation schemes in their main areas.",
    zones: [["Cocoa belt", 7.3, 4.6, 0.6, 1.0, "brown", "Ondo, Osun, Ogun, Oyo, Ekiti, Cross River — Nigeria is a leading cocoa producer."], ["Oil palm belt", 5.6, 7.3, 0.7, 1.2, "green", "South-east and south-south: palm oil and kernels."], ["Rubber", 6.3, 5.8, 0.5, 0.6, "teal", "Edo and Delta states."], ["Groundnuts and cotton", 11.8, 8.0, 0.8, 1.6, "gold", "Kano, Katsina, Zaria areas — once famous for groundnut pyramids."], ["Cattle (Fulani pastoralism)", 11.5, 11.0, 1.0, 2.0, "orange", "Tsetse-free northern savanna; cattle move south in the dry season."]],
    pins: [["Bakolori (Sokoto–Rima scheme)", 12.48, 6.1, "Irrigation dam for rice, wheat and onions."], ["Kano River project (Kadawa)", 11.65, 8.43, "Irrigated wheat, rice and tomatoes."], ["Argungu (Kebbi rice)", 12.74, 4.52, "Kebbi State's flood-plain rice."]],
    notes: ["Food crops: yam, cassava, maize, rice (south and middle belt); millet, sorghum, cowpea (north).", "Problems: small farms, old tools, poor storage and roads, pests, erratic rainfall, land disputes, rural–urban drift. Solutions: credit, extension services, mechanisation, irrigation, improved seeds."],
  });
  NG("f", "Transportation in Nigeria", {
    blurb: "Roads, railways, ports, airports and waterways.",
    lines: [["Lagos–Kano railway", "teal", [[6.45, 3.39], [7.38, 3.9], [8.13, 4.24], [9.08, 4.55], [10.5, 7.42], [11.1, 7.7], [12.0, 8.52]], "Western line built 1898–1912; the standard-gauge Lagos–Ibadan line opened in 2021."], ["Port Harcourt–Maiduguri railway", "blue", [[4.82, 7.03], [6.44, 7.5], [7.73, 8.54], [9.6, 8.3], [10.3, 11.2], [11.85, 13.16]], "Eastern line through Enugu, Makurdi and Kafanchan."], ["Abuja–Kaduna railway", "purple", [[9.06, 7.49], [10.5, 7.42]], "Standard-gauge line opened in 2016."]],
    pins: [["Apapa / Tin Can ports, Lagos", 6.44, 3.37, "Nigeria's busiest seaports."], ["Lekki Deep Sea Port", 6.42, 4.0, "New deep-water port east of Lagos."], ["Onne port", 4.72, 7.15, "Oil and gas service port near Port Harcourt."], ["Calabar port", 4.95, 8.32, "Port on the Calabar River."], ["Murtala Muhammed Airport, Lagos", 6.58, 3.32, "Busiest international airport."], ["Nnamdi Azikiwe Airport, Abuja", 9.0, 7.26, "International airport of the capital."]],
    notes: ["Roads carry most passengers and goods; trunk roads link state capitals.", "Inland waterways: the Niger and Benue (seasonal); coastal lagoons and creeks.", "Pipelines carry crude oil and products (e.g. Escravos–Lagos gas pipeline).", "Problems: poor maintenance, congestion at Lagos ports, accidents, insecurity."],
  });
  NG("g", "Communication in Nigeria", {
    blurb: "Telecommunications, postal services, broadcasting and the internet.",
    pins: [["Lagos — submarine cable landings", 6.43, 3.42, "International undersea cables (SAT-3, MainOne, Glo-1, 2Africa and others) land on the Lagos coast."], ["Abuja", 9.06, 7.49, "Home of the Nigerian Communications Commission and NIGCOMSAT."]],
    notes: ["Mobile telephony grew rapidly after GSM licensing in 2001 (MTN, Glo, Airtel, 9mobile).", "Postal services: NIPOST; courier companies.", "Broadcasting: NTA, FRCN and many private radio and TV stations; satellite communication (NIGCOMSAT).", "Importance: business, banking, education, security, national unity. Problems: poor power supply, vandalism of cables, high costs, rural gaps."],
  });
  NG("h", "Industry in Nigeria", {
    blurb: "Main industrial centres and their products.",
    pins: [["Lagos (Ikeja, Apapa, Agbara)", 6.6, 3.35, "Largest industrial area: food, drinks, textiles, chemicals, vehicle assembly."], ["Dangote refinery, Lekki", 6.43, 4.0, "Very large private oil refinery and fertiliser plant."], ["Kano", 12.0, 8.52, "Textiles, leather, food processing, plastics."], ["Kaduna", 10.52, 7.44, "Textiles and an oil refinery."], ["Port Harcourt", 4.82, 7.03, "Refineries, petrochemicals, fertiliser."], ["Ajaokuta Steel", 7.56, 6.65, "Integrated iron and steel complex."], ["Aladja (Delta Steel)", 5.55, 5.8, "Steel plant near Warri."], ["Aba", 5.1, 7.37, "Small and medium industries: shoes, garments, soap."]],
    notes: ["Factors: raw materials, market, labour, power, transport, capital, government policy.", "Problems: unreliable electricity, poor infrastructure, imports competing with local goods, high interest rates, insecurity."],
  });
  NG("i", "Trade in Nigeria", {
    blurb: "Internal trade in markets and external trade through the ports.",
    pins: [["Bonny NLNG", 4.43, 7.17, "Liquefied natural gas export terminal."], ["Apapa port", 6.44, 3.37, "Most imports enter through Lagos."], ["Onitsha Main Market", 6.15, 6.78, "One of West Africa's largest markets."], ["Kurmi Market, Kano", 12.0, 8.5, "Ancient market of trans-Saharan trade."]],
    notes: ["Exports: crude oil (most of export earnings), natural gas, cocoa, sesame, cashew, rubber, urea.", "Imports: machinery, vehicles, refined petroleum, wheat, chemicals, electronics. Partners: India, Netherlands, Spain, China, USA.", "Internal trade between north (grains, cattle, onions) and south (kola, palm oil, manufactured goods).", "Problems: dependence on oil, smuggling, poor roads, unstable prices."],
  });
  NG("j", "Tourism in Nigeria", {
    blurb: "Natural and cultural attractions.",
    pins: [["Yankari Game Reserve", 9.75, 10.5, "Wildlife and the warm Wikki spring."], ["Obudu Mountain Resort", 6.36, 9.37, "Cool highland resort and cable car."], ["Olumo Rock, Abeokuta", 7.15, 3.35, "Historic granite inselberg."], ["Osun-Osogbo Sacred Grove", 7.76, 4.55, "UNESCO World Heritage site."], ["Sukur Cultural Landscape", 10.74, 13.57, "UNESCO World Heritage site in the Mandara Mountains."], ["Zuma Rock", 9.13, 7.24, "Giant monolith near Abuja."], ["Erin-Ijesha waterfalls", 7.59, 4.88, "Seven-step waterfall in Osun State."], ["Argungu Fishing Festival", 12.74, 4.52, "Famous annual fishing festival."]],
    notes: ["Other attractions: beaches (Lekki, Badagry), Calabar Carnival, Durbar festivals, Kainji Lake National Park, museums and slave-trade relics at Badagry.", "Problems: insecurity, poor facilities and publicity; benefits: jobs, foreign exchange, cultural preservation."],
  });
  NG("k", "Development issues and environmental concerns in Nigeria", {
    blurb: "Hazards and problems that hold back development, and where they occur.",
    pins: [["Gully erosion — Agulu–Nanka", 6.1, 7.05, "Huge gullies in the soft sands of Anambra State."], ["Oil pollution — Ogoniland", 4.7, 7.3, "Oil spills and gas flaring damage land, water and health."], ["Flooding — Lokoja", 7.8, 6.74, "Severe floods along the Niger and Benue (2012, 2022)."], ["Coastal erosion — Lagos", 6.42, 3.42, "The Atlantic is eroding beaches such as Bar Beach."]],
    zones: [["Desertification frontline", 12.9, 9.0, 0.8, 4.5, "orange", "Sokoto to Yobe and Borno: drought, overgrazing and fuelwood cutting spread desert conditions."], ["Deforestation", 6.8, 5.5, 0.6, 1.4, "red", "Rainforest cleared for farming, logging and fuelwood."]],
    notes: ["Other issues: rapid urbanisation and slums, insecurity, poor power supply, unemployment, corruption.", "Remedies: afforestation (Great Green Wall), erosion control, enforcement of environmental laws, clean-up of Ogoniland (HYPREP), flood early warning, coastal protection."],
  });
  GK.region("NG-l", { scope: "WA", title: "ECOWAS", blurb: "The Economic Community of West African States, founded in Lagos in 1975 with its headquarters in Abuja.",
    pins: [["Abuja — ECOWAS Commission", 9.06, 7.49, "Headquarters of the ECOWAS Commission."], ["Lagos — Treaty of Lagos (1975)", 6.45, 3.39, "ECOWAS was founded on 28 May 1975."], ["Accra", 5.56, -0.2, "Member state capital (Ghana)."], ["Dakar", 14.69, -17.45, "Member state capital (Senegal)."]],
    lines: [["West African Gas Pipeline", "purple", [[6.45, 3.3], [6.35, 2.4], [6.13, 1.22], [5.6, -0.1], [4.9, -1.75]], "Carries Nigerian gas to Benin, Togo and Ghana."]],
    notes: ["Members: 12 after Mali, Burkina Faso and Niger withdrew in January 2025 — Benin, Cabo Verde, Côte d'Ivoire, The Gambia, Ghana, Guinea, Guinea-Bissau, Liberia, Nigeria, Senegal, Sierra Leone, Togo.", "Aims: economic integration, free movement of people and goods, common market, peace and security (ECOMOG).", "Achievements: free movement protocol, ECOWAS passport, peacekeeping in Liberia and Sierra Leone, regional power and gas projects. Problems: political instability, poor transport links, language differences, debts."] });
  NG("m", "Geo-political issues: land reclamation", {
    blurb: "Land reclaimed from the sea and lagoons around Lagos, and Nigeria's border issues.",
    cam: [[0.0, 6.4, 5.0], [-1.2, 0, 0.8]],
    pins: [["Eko Atlantic City", 6.41, 3.41, "New city built on land reclaimed from the Atlantic, protected by the 'Great Wall of Lagos' sea wall."], ["Banana Island", 6.45, 3.45, "Residential island reclaimed from the Lagos Lagoon."], ["Lekki peninsula", 6.44, 3.6, "Sand-filling of swamps for housing and the free trade zone."], ["Bakassi Peninsula", 4.6, 8.6, "Ceded to Cameroon by the International Court of Justice (2002); handed over in 2008."]],
    notes: ["Reasons for land reclamation: shortage of land in Lagos, high land values, protection against coastal erosion, housing and business districts.", "Methods: sand-filling (dredging), sea walls, drainage of swamps.", "Problems: high cost, destruction of mangroves and fisheries, flooding elsewhere, displacement of communities."],
  });

  /* =================================================================== AFRICA =================================================================== */
  const AFR = (sub, title, o) => GK.region("AF-" + sub, Object.assign({ scope: "AF", title, cam: [[0.6, 9.4, 7.0], [0.4, 0, 0.4]] }, o));
  AFR("a", "Africa on broad outline", {
    blurb: "Africa's position, size, relief and drainage on a 3D relief model of the continent.",
    pins: [["Kilimanjaro", -3.07, 37.35, "Africa's highest mountain, 5 895 m (Tanzania)."], ["Lake Victoria", -1.0, 33.0, "Africa's largest lake; source of the White Nile."], ["Nile Delta", 31.0, 31.0, "The Nile, the world's longest river, enters the Mediterranean."], ["Congo mouth", -6.0, 12.3, "The Congo carries the second-largest volume of water of any river."], ["Atlas Mountains", 31.5, -6.0, "Fold mountains of north-west Africa."], ["Drakensberg", -29.5, 29.3, "Escarpment mountains of southern Africa."]],
    zones: [["Sahara", 23.0, 10.0, 6.0, 16.0, "gold", "The world's largest hot desert."], ["Great Rift Valley", 0.0, 36.0, 10.0, 2.0, "red", "Rift valleys and lakes from Ethiopia to Mozambique."], ["Congo basin", -1.0, 22.0, 4.0, 6.0, "green", "Equatorial rainforest basin."]],
    notes: ["Area about 30.3 million km²; 54 countries; the equator and both tropics cross it.", "Mostly a plateau, higher in the east and south; narrow coastal plains; few natural harbours.", "Rivers: Nile, Congo, Niger, Zambezi, Orange, Senegal, Limpopo."],
  });
  AFR("b", "Irrigation agriculture: the Nile and Niger basins", {
    blurb: "Irrigation turns dry lands into farmland along the Nile and the Niger.",
    pins: [["Aswan High Dam", 23.97, 32.88, "Completed 1970; stores water in Lake Nasser for year-round irrigation and HEP."], ["Gezira scheme", 14.4, 33.3, "Between the Blue and White Niles in Sudan: cotton, wheat, groundnuts by gravity irrigation."], ["Nile Delta farmland", 30.8, 31.0, "Perennial irrigation: cotton, rice, wheat, sugar cane."], ["Office du Niger (Markala dam)", 13.67, -6.07, "Mali's scheme in the inland Niger delta: rice and sugar cane."], ["Bakolori (Sokoto–Rima)", 12.48, 6.1, "Nigerian irrigation scheme in the Niger basin."]],
    notes: ["Methods: basin, perennial (canals from dams), sprinkler, shadoof and pumps.", "Benefits: two or three crops a year, food security, cash crops, jobs, HEP. Problems: salinisation, waterlogging, bilharzia, silting, high costs, loss of fertile flood silt below dams."],
  });
  AFR("c", "Plantation agriculture in West and East Africa", {
    blurb: "Large estates growing one cash crop for export.",
    pins: [["Firestone, Harbel (rubber)", 6.27, -10.35, "One of the world's largest rubber plantations (Liberia)."], ["Kericho (tea)", -0.37, 35.28, "Kenya's tea estates in the cool highlands."], ["Tanga (sisal)", -5.07, 39.1, "Sisal plantations in Tanzania."], ["Côte d'Ivoire (cocoa and oil palm)", 6.0, -5.5, "World's leading cocoa producer; oil palm estates in the south."], ["Ghana (cocoa)", 6.7, -1.6, "Second largest cocoa producer."]],
    notes: ["Features: large estates, one crop, much capital, many paid workers, factories on the estate, scientific methods, export-oriented.", "Problems: price fluctuations, diseases (swollen shoot of cocoa), labour shortages, land disputes."],
  });
  AFR("d", "Oil production: Nigeria, Ghana and Libya", {
    blurb: "Africa's oil comes from sedimentary basins on land and offshore.",
    pins: [["Niger Delta (Nigeria)", 4.9, 6.3, "Africa's largest producer for decades; onshore and offshore fields."], ["Jubilee field (Ghana)", 4.6, -2.9, "Offshore field discovered 2007; production since 2010."], ["Sirte Basin (Libya)", 29.5, 19.0, "Libya's main oil province; Africa's largest proven reserves."], ["Es Sider terminal (Libya)", 30.63, 18.35, "Export terminal on the Gulf of Sirte."]],
    notes: ["Importance: export earnings, government revenue, jobs, raw material for petrochemicals.", "Problems: pollution and gas flaring, conflict, price swings, neglect of agriculture (Dutch disease), corruption."],
  });
  AFR("e", "Lumbering in equatorial Africa", {
    blurb: "The tropical rainforests of the Congo basin and the Guinea coast supply hardwoods.",
    zones: [["Congo basin forests", 0.0, 20.0, 4.0, 7.0, "green", "Gabon, Cameroon, Republic of Congo, DR Congo, CAR — huge reserves of hardwood."]],
    pins: [["Port-Gentil (Gabon)", -0.72, 8.78, "Timber export port; okoumé logs."], ["Douala (Cameroon)", 4.05, 9.7, "Main timber export port of Cameroon."], ["Abidjan (Côte d'Ivoire)", 5.3, -4.0, "Timber processing and export."]],
    notes: ["Trees: mahogany, sapele, iroko, obeche, okoumé, ebony.", "Problems: trees of one kind are scattered (heterogeneous forest), heavy logs, poor transport, heavy rain, pests and diseases, deforestation. Conservation: selective logging, reafforestation, reserves."],
  });
  AFR("f", "Gold mining in South Africa", {
    blurb: "The Witwatersrand goldfield around Johannesburg — once the world's richest.",
    pins: [["Witwatersrand (Johannesburg)", -26.2, 28.04, "Gold discovered 1886; deep shaft mines over 3 km deep."], ["Welkom (Free State goldfield)", -27.98, 26.73, "Southern extension of the gold-bearing reef."], ["Durban port", -29.87, 31.03, "Export and import port for the industrial region."]],
    notes: ["Factors: rich reefs, capital, cheap labour, power from coal, transport, technology.", "Problems: great depth and heat, flooding, accidents, falling grades, labour disputes. Effects: growth of Johannesburg, industry, railways."],
  });
  AFR("g", "Copper mining in Zambia and DR Congo", {
    blurb: "The Central African Copperbelt and its export routes to the coast.",
    pins: [["Kitwe", -12.8, 28.2, "Centre of Zambia's Copperbelt."], ["Ndola", -12.97, 28.63, "Copper refining and industry."], ["Chingola", -12.53, 27.85, "Large open-pit copper mine (Nchanga)."], ["Lubumbashi", -11.66, 27.48, "Mining capital of DR Congo's Katanga."], ["Kolwezi", -10.72, 25.47, "Copper and cobalt mines."]],
    lines: [["TAZARA railway", "orange", [[-12.97, 28.63], [-11.2, 31.0], [-9.0, 33.5], [-7.8, 36.7], [-6.8, 39.28]], "Zambia to Dar es Salaam (Tanzania), built in the 1970s."], ["Benguela railway", "teal", [[-10.72, 25.47], [-11.0, 21.0], [-12.4, 16.9], [-12.35, 13.55]], "Katanga to the Atlantic port of Lobito (Angola)."]],
    notes: ["Factors: rich ores, HEP from Kariba and Inga, capital, labour. Problems: landlocked — long expensive routes to the sea, price fluctuations, pollution."],
  });
  GK.region("AF-h", { scope: "WA", title: "Population distribution in West Africa", blurb: "Dense and sparse areas of West Africa and the reasons.",
    zones: [["South-West Nigeria", 7.2, 3.9, 0.9, 1.0, "red", "Dense — cocoa farming, towns and industry."], ["South-East Nigeria", 5.9, 7.2, 0.8, 0.7, "red", "Very dense rural population."], ["Kano close-settled zone", 11.8, 8.3, 0.8, 0.9, "red", "Dense — fertile soils and trade."], ["Ashanti and the Ghana coast", 6.2, -1.0, 0.8, 1.2, "red", "Dense — gold, cocoa, Accra and Kumasi."], ["Mossi plateau", 12.4, -1.5, 0.8, 1.0, "red", "Dense farming population around Ouagadougou."], ["Middle Belt", 9.0, 7.0, 1.0, 4.0, "blue", "Sparse — past slave raids, tsetse fly, poor soils."], ["Sahel and Sahara margins", 15.5, 2.0, 1.2, 9.0, "blue", "Sparse — low, unreliable rainfall."]],
    notes: ["Factors: rainfall and water supply, soils, relief, minerals, disease, history, transport and towns, government policy."] });
  GK.region("AF-i", { scope: "WA", title: "ECOWAS", blurb: "The Economic Community of West African States: members, aims, achievements and problems.",
    pins: [["Abuja — ECOWAS Commission", 9.06, 7.49, "Headquarters."], ["Lagos — Treaty of Lagos 1975", 6.45, 3.39, "Founding treaty, 28 May 1975."]],
    lines: [["Trans-West African Coastal Highway", "gold", [[14.7, -17.4], [8.5, -13.2], [6.3, -10.8], [5.35, -4.0], [5.6, -0.2], [6.45, 3.4]], "Corridor linking the coastal member states."]],
    notes: ["12 members after Mali, Burkina Faso and Niger left in January 2025 (they formed the Alliance of Sahel States).", "Aims: free movement, customs union and common market, economic cooperation, peace and security.", "Problems: political instability and coups, poor transport and communication, different currencies and languages, dependence on outside markets."] });

  /* =================================================================== GHANA =================================================================== */
  const GHR = (sub, title, o) => GK.region("GH-" + sub, Object.assign({ scope: "GH", title }, o));
  GHR("a", "Ghana on broad outline", { blurb: "Location, size, neighbours and administrative regions of Ghana.",
    pins: [["Accra", 5.56, -0.2, "Capital city on the coast."], ["Kumasi", 6.69, -1.62, "Second city; capital of the Ashanti Region."], ["Tamale", 9.4, -0.85, "Main city of the north."], ["Sekondi-Takoradi", 4.9, -1.76, "Port city in the west."], ["Cape Coast", 5.1, -1.25, "Historic coastal city."]],
    notes: ["Area 238 537 km²; between about 4.5°N and 11°N, 3.25°W and 1.2°E. Neighbours: Côte d'Ivoire (W), Burkina Faso (N), Togo (E); Gulf of Guinea (S).", "16 administrative regions (since 2018)."] });
  GHR("b", "Physical setting of Ghana", { blurb: "Relief, drainage, climate and vegetation of Ghana.",
    pins: [["Mount Afadjato", 7.0, 0.57, "Highest point (about 885 m) in the Akwapim–Togo ranges."], ["Lake Volta", 7.6, -0.3, "One of the world's largest man-made lakes, behind Akosombo Dam."], ["Lake Bosumtwi", 6.5, -1.41, "Meteorite impact crater lake."], ["Kwahu plateau", 6.6, -0.7, "Plateau with a steep escarpment, forming a watershed."]],
    zones: [["Accra plains", 5.85, -0.1, 0.35, 0.6, "orange", "Dry coastal savanna (the Dahomey gap)."], ["Forest dissected plateau", 6.5, -2.0, 0.8, 1.0, "green", "Ashanti uplands with tropical forest."], ["Volta basin", 8.0, -0.8, 1.0, 1.3, "gold", "Low sandstone basin, Guinea savanna."]],
    notes: ["Rivers: Volta (Black, White, Oti), Pra, Ankobra, Tano.", "Climate: hot; double rainfall maximum in the south, single in the north; harmattan in the dry season.", "Vegetation: rainforest in the south-west, coastal savanna, Guinea and Sudan savanna northwards."] });
  GHR("c", "Population of Ghana", { blurb: "Distribution and density of population in Ghana.",
    zones: [["Dense: Greater Accra and the coast", 5.7, -0.3, 0.4, 0.8, "red", "Accra–Tema conurbation; ports, industry, services."], ["Dense: Ashanti", 6.7, -1.6, 0.5, 0.6, "red", "Kumasi, cocoa, gold."], ["Dense: Upper East", 10.8, -0.85, 0.3, 0.6, "red", "Dense rural population around Bolgatanga."], ["Sparse: Volta basin", 8.2, -0.9, 0.8, 1.0, "blue", "Poor soils, tsetse fly, past slave raids."]],
    notes: ["Population about 30.8 million at the 2021 census.", "Ethnic groups: Akan, Mole-Dagbani, Ewe, Ga-Dangme, Gurma and others.", "Rapid urbanisation and rural–urban migration to Accra and Kumasi."] });
  GHR("d", "Settlement in Ghana", { blurb: "Rural and urban settlements and their patterns.",
    pins: [["Accra–Tema conurbation", 5.62, -0.1, "Largest urban area: capital, port, industry."], ["Kumasi", 6.69, -1.62, "Route centre and market city."], ["Sekondi-Takoradi", 4.9, -1.76, "Port and oil city."], ["Tamale", 9.4, -0.85, "Northern regional centre."], ["Bolgatanga", 10.79, -0.85, "Northern town with dispersed compounds around it."]],
    notes: ["Rural: nucleated villages in the forest and coastal zones; dispersed compounds in the north.", "Urban functions: administration, trade, industry, ports, education.", "Problems of towns: housing shortage, slums, traffic, waste; solutions: planning, low-cost housing, decentralisation."] });
  GHR("e", "Agriculture in Ghana", { blurb: "Cash crops, food crops, livestock and irrigation.",
    zones: [["Cocoa belt", 6.5, -2.0, 0.8, 1.1, "brown", "Western, Ashanti, Eastern and Bono regions — Ghana is the world's second cocoa producer."], ["Northern cereals and livestock", 10.0, -1.0, 0.9, 1.3, "gold", "Millet, sorghum, yam, groundnuts, shea, cattle."]],
    pins: [["Cocoa Research Institute, Tafo", 6.22, -0.37, "Research on cocoa diseases such as swollen shoot."], ["Tono irrigation dam", 10.87, -1.13, "Irrigated rice and vegetables in the Upper East."]],
    notes: ["Other cash crops: oil palm, rubber, coffee, cashew, pineapple, citrus.", "Problems: old cocoa trees, swollen shoot disease, galamsey destroying farms, poor roads and storage."] });
  GHR("f", "Fishing in Ghana", { blurb: "Marine, lagoon and inland fishing.",
    pins: [["Tema fishing harbour", 5.63, 0.0, "Main base for industrial trawlers."], ["Elmina", 5.08, -1.35, "Busy canoe-fishing town."], ["Yeji (Lake Volta)", 8.22, -0.65, "Centre of Lake Volta fishing."], ["Keta Lagoon", 5.92, 0.99, "Lagoon fishing and salt."]],
    notes: ["Canoe (artisanal) fishing employs many people; fish is a major source of protein.", "Problems: overfishing, illegal fishing ('saiko'), lack of cold storage, pollution. Measures: closed seasons, regulations, fish farming (aquaculture on Lake Volta)."] });
  GHR("g", "Lumbering in Ghana", { blurb: "Timber from Ghana's high forest zone.",
    zones: [["High forest zone", 6.0, -2.3, 0.7, 0.9, "green", "Western and Ashanti regions: wawa, odum, mahogany, sapele, utile."]],
    pins: [["Samreboi", 5.58, -2.58, "Timber and plywood mill."], ["Takoradi port", 4.9, -1.76, "Timber export port."], ["Kumasi", 6.69, -1.62, "Sawmilling and furniture."]],
    notes: ["Problems: scattered trees of each species, deforestation, illegal chainsaw logging, poor roads in the rainy season.", "Conservation: forest reserves, selective felling, reafforestation, export controls on raw logs."] });
  GHR("h", "Mining in Ghana", { blurb: "Gold, diamonds, manganese, bauxite and oil.",
    pins: [["Obuasi (gold)", 6.2, -1.67, "One of the world's richest gold mines."], ["Tarkwa (gold)", 5.3, -1.99, "Large open-pit gold mining."], ["Akwatia (diamonds)", 6.05, -0.81, "Alluvial diamonds."], ["Nsuta (manganese)", 5.27, -1.95, "Manganese mining."], ["Awaso (bauxite)", 6.23, -2.27, "Bauxite exported through Takoradi."], ["Jubilee oil field (offshore)", 4.6, -2.9, "Oil and gas since 2010."]],
    notes: ["Ghana is Africa's leading gold producer.", "Problems: galamsey (illegal small-scale mining) polluting rivers and destroying farmland, land degradation, mercury poisoning."] });
  GHR("i", "Manufacturing in Ghana", { blurb: "Industrial centres and products.",
    pins: [["Tema (VALCO aluminium smelter)", 5.63, 0.02, "Aluminium smelter powered by Akosombo HEP."], ["Tema oil refinery", 5.64, 0.0, "Refines crude oil for the domestic market."], ["Accra", 5.56, -0.2, "Food, drinks, textiles, pharmaceuticals."], ["Kumasi", 6.69, -1.62, "Timber, breweries, soap."], ["Takoradi", 4.9, -1.76, "Cocoa processing, timber, cement."]],
    notes: ["Factors: raw materials (cocoa, timber, bauxite), HEP, ports, market, labour.", "Problems: power shortages, competition from imports, high costs, limited capital."] });
  GHR("j", "Trade and commerce in Ghana", { blurb: "Exports, imports, ports and markets.",
    pins: [["Tema port", 5.63, 0.0, "Main port for imports and container traffic."], ["Takoradi port", 4.9, -1.76, "Exports of cocoa, timber, manganese and bauxite."], ["Makola Market, Accra", 5.55, -0.21, "Major retail market."], ["Kejetia Market, Kumasi", 6.69, -1.62, "One of West Africa's largest markets."]],
    notes: ["Exports: gold, cocoa, crude oil, timber, manganese, bauxite, cashew.", "Imports: machinery, vehicles, fuel, rice, chemicals. Partners: China, Switzerland, India, USA, EU, ECOWAS neighbours."] });
  GHR("k", "Tourism in Ghana", { blurb: "Ghana's tourist attractions.",
    pins: [["Cape Coast Castle", 5.1, -1.24, "UNESCO slave fort."], ["Elmina Castle", 5.08, -1.35, "Oldest European building in sub-Saharan Africa (1482)."], ["Kakum National Park", 5.35, -1.38, "Canopy walkway in the rainforest."], ["Mole National Park", 9.7, -1.85, "Elephants and savanna wildlife."], ["Wli waterfalls", 7.13, 0.6, "Ghana's highest waterfall."], ["Kintampo falls", 8.05, -1.73, "Waterfalls on the Pumpum river."], ["Paga crocodile pond", 10.98, -1.11, "Sacred crocodiles in the Upper East."], ["Larabanga Mosque", 9.22, -1.86, "Ancient Sudanese-style mud mosque."]],
    notes: ["Other attractions: Aburi gardens, Lake Bosumtwi, Kwame Nkrumah Memorial Park, festivals (Homowo, Aboakyer, Damba), beaches.", "Benefits and problems as for tourism generally."] });
  GHR("l", "Energy and power in Ghana", { blurb: "Hydro-electric, thermal and solar power.",
    pins: [["Akosombo Dam", 6.3, 0.06, "Hydro-electric dam on the Volta (1965), about 1 020 MW."], ["Kpong Dam", 6.14, 0.13, "Smaller HEP dam downstream of Akosombo."], ["Bui Dam", 8.28, -2.24, "HEP dam on the Black Volta (2013)."], ["Aboadze thermal plant", 4.97, -1.65, "Gas and oil-fired power near Takoradi."]],
    lines: [["West African Gas Pipeline (from Nigeria)", "purple", [[5.6, -0.1], [4.97, -1.65]], "Brings Nigerian gas to Tema and Takoradi."]],
    notes: ["Other sources: fuelwood and charcoal (most household energy), solar farms, offshore gas.", "Problems: low water levels in Lake Volta reduce HEP; power cuts ('dumsor'); high cost of fuel."] });
  GHR("m", "Development issues and environmental concerns in Ghana", { blurb: "Environmental problems and their locations.",
    pins: [["Galamsey — Pra river", 5.8, -1.6, "Illegal mining muddies and poisons rivers."], ["Keta coastal erosion", 5.92, 1.0, "The sea destroyed much of Keta; the Keta Sea Defence was built."], ["Agbogbloshie (e-waste)", 5.55, -0.23, "Burning of electronic waste pollutes air and soil."], ["Accra floods", 5.56, -0.2, "Blocked drains and building on waterways cause floods."]],
    zones: [["Desertification and bushfires", 10.5, -1.2, 0.6, 1.2, "orange", "Northern savanna: overgrazing, bush burning, fuelwood cutting."]],
    notes: ["Other issues: deforestation, urban slums, poor sanitation.", "Remedies: enforcement against galamsey, reafforestation, sea defences, waste management, environmental education (EPA)."] });

  /* =================================================================== SIERRA LEONE =================================================================== */
  const SLR = (sub, title, o) => GK.region("SLE-" + sub, Object.assign({ scope: "SL", title }, o));
  SLR("a", "Sierra Leone on broad outline", { blurb: "Location, size, physical regions and divisions of Sierra Leone.",
    pins: [["Freetown", 8.48, -13.23, "Capital and port on a mountainous peninsula."], ["Bo", 7.96, -11.74, "Second city, in the south."], ["Kenema", 7.88, -11.19, "Eastern city near diamond and forest areas."], ["Makeni", 8.88, -12.04, "Largest city of the north."], ["Bintumani (Loma Mountains)", 9.18, -11.12, "Highest point, about 1 945 m."]],
    zones: [["Coastal swamps and plains", 8.0, -12.8, 0.6, 0.4, "teal", "Mangrove swamps, estuaries and low plains."], ["Interior plateau and mountains", 8.8, -11.0, 0.8, 0.6, "green", "Plateau and mountains of the east and north-east."]],
    notes: ["Area 71 740 km²; about 7°–10°N, 10°–13°W. Neighbours: Guinea (N and E), Liberia (SE); Atlantic Ocean (W).", "Rivers: Great and Little Scarcies, Rokel (Seli), Jong, Sewa, Moa, Mano.", "Climate: very wet south-west monsoon (Freetown over 3 000 mm); dry season with harmattan."] });
  SLR("b", "Agriculture in Sierra Leone", { blurb: "Food crops, cash crops and livestock.",
    zones: [["Swamp rice (Scarcies and Bolilands)", 9.0, -12.6, 0.4, 0.4, "teal", "Mangrove and inland-valley swamp rice — rice is the staple food."], ["Cocoa and coffee", 8.1, -10.8, 0.5, 0.5, "brown", "Kenema and Kailahun districts in the east."], ["Cattle", 9.6, -11.5, 0.4, 0.5, "orange", "Koinadugu district in the north."]],
    notes: ["Other crops: cassava, oil palm, groundnuts, sweet potatoes, ginger, kola.", "Problems: shifting cultivation, poor roads, limited credit, labour drawn to diamond mining."] });
  SLR("c", "Fishing in Sierra Leone", { blurb: "Artisanal and industrial fishing along a rich coast.",
    pins: [["Tombo", 8.24, -13.2, "Major artisanal fishing port."], ["Goderich", 8.43, -13.29, "Fishing community near Freetown."], ["Sherbro Island", 7.55, -12.6, "Fishing centre with rich mangrove waters."], ["Yawri Bay", 8.0, -12.95, "Shallow, rich fishing grounds."]],
    notes: ["Problems: illegal foreign trawlers, poor storage and processing (smoking), overfishing. Measures: patrols, licensing, cold storage."] });
  SLR("d", "Lumbering in Sierra Leone", { blurb: "Forests and timber production.",
    zones: [["Gola Rainforest National Park", 7.5, -10.8, 0.25, 0.3, "green", "Largest remaining area of lowland rainforest."]],
    pins: [["Kambui Hills forest reserve", 7.85, -11.15, "Forest reserve near Kenema."]],
    notes: ["Problems: much forest cleared for farms and fuelwood; illegal logging. Conservation: reserves, national parks, community forestry."] });
  SLR("e", "Mining in Sierra Leone", { blurb: "Diamonds, iron ore, rutile, bauxite and gold.",
    pins: [["Kono — Koidu (diamonds)", 8.64, -10.97, "Kimberlite and alluvial diamonds."], ["Tongo fields (diamonds)", 8.1, -11.0, "Diamond mining area."], ["Marampa (iron ore)", 8.68, -12.48, "Iron ore exported through Pepel."], ["Tonkolili (iron ore)", 9.1, -11.6, "Large iron ore deposit."], ["Sierra Rutile (Mobimbi)", 7.6, -12.2, "One of the world's largest rutile (titanium) deposits."], ["Mokanji (bauxite)", 7.92, -12.05, "Bauxite mining."]],
    notes: ["Problems: illegal mining, land degradation, conflict ('blood diamonds' during the civil war), smuggling. Benefits: export earnings, jobs."] });
  SLR("f", "Manufacturing, energy and power in Sierra Leone", { blurb: "Industries and power supply.",
    pins: [["Wellington industrial estate, Freetown", 8.45, -13.15, "Breweries, soap, plastics, food."], ["Bumbuna hydro-electric dam", 9.05, -11.73, "50 MW HEP on the Seli (Rokel) river."], ["Kingtom power station, Freetown", 8.49, -13.25, "Thermal power for Freetown."]],
    notes: ["Industries: food and drinks, cement, soap, furniture, mineral processing.", "Problems: power shortages, limited capital and skills, small market."] });
  SLR("g", "Transport and communication in Sierra Leone", { blurb: "Roads, ports, airport and communications.",
    pins: [["Lungi International Airport", 8.62, -13.2, "Across the Sierra Leone River estuary from Freetown — reached by ferry or water taxi."], ["Queen Elizabeth II Quay, Freetown", 8.49, -13.22, "Main seaport, a deep natural harbour."], ["Pepel port", 8.58, -13.05, "Iron ore export port linked by rail to the mines."]],
    lines: [["Freetown–Bo–Kenema highway", "gold", [[8.45, -13.15], [8.6, -12.6], [8.4, -12.1], [7.96, -11.74], [7.88, -11.19]], "Main trunk road."], ["Marampa–Pepel mineral railway", "teal", [[8.68, -12.48], [8.58, -13.05]], "Carries iron ore to the coast."]],
    notes: ["The old passenger railway closed in 1974.", "Communication: mobile networks, radio (SLBC), internet via the ACE submarine cable."] });
  SLR("h", "Trade in Sierra Leone", { blurb: "Exports, imports and trading partners.",
    pins: [["Freetown port", 8.49, -13.22, "Most trade passes through Freetown."]],
    notes: ["Exports: iron ore, diamonds, rutile, bauxite, cocoa, coffee, fish.", "Imports: rice, fuel, machinery, vehicles, manufactured goods.", "Member of ECOWAS and the Mano River Union."] });
  SLR("i", "Population of Sierra Leone", { blurb: "Distribution of population.",
    zones: [["Western Area (Freetown)", 8.4, -13.15, 0.2, 0.25, "red", "Densest area — capital, port, jobs."], ["Diamond areas (Kono)", 8.6, -11.0, 0.3, 0.3, "red", "Migrants attracted by mining."]],
    notes: ["Population about 7 million (2015 census); estimates now higher.", "Ethnic groups: Temne, Mende, Limba, Kono, Krio and others.", "Rural–urban drift to Freetown; problems of congestion and slums."] });
  SLR("j", "Tourism in Sierra Leone", { blurb: "Beaches, islands, wildlife and history.",
    pins: [["Lumley Beach", 8.47, -13.27, "Freetown's popular beach."], ["River No. 2 beach", 8.29, -13.21, "Famous peninsula beach."], ["Banana Islands", 8.1, -13.2, "Island resort off the peninsula."], ["Bunce Island", 8.57, -13.04, "Ruins of a slave-trading fort."], ["Tiwai Island", 7.55, -11.35, "Wildlife sanctuary with primates."], ["Tacugama Chimpanzee Sanctuary", 8.43, -13.2, "Rescue centre for chimpanzees."], ["Outamba-Kilimi National Park", 9.75, -12.3, "Savanna and forest wildlife."]],
    notes: ["Problems: poor roads and facilities, image after the civil war and Ebola; potential is large."] });

  /* =================================================================== LIBERIA =================================================================== */
  const LRR = (sub, title, o) => GK.region("LBR-" + sub, Object.assign({ scope: "LR", title }, o));
  LRR("a", "Liberia on broad outline", { blurb: "Location, size, neighbours and counties of Liberia.",
    pins: [["Monrovia", 6.3, -10.8, "Capital and chief port."], ["Buchanan", 5.88, -10.05, "Iron ore port."], ["Gbarnga", 7.0, -9.47, "Bong County capital in the centre."], ["Harper", 4.37, -7.72, "Port in the far south-east."], ["Voinjama", 8.42, -9.75, "Lofa County capital in the north."]],
    notes: ["Area 111 369 km²; about 4.3°–8.5°N, 7.4°–11.5°W. Neighbours: Sierra Leone (NW), Guinea (N), Côte d'Ivoire (E); Atlantic Ocean (SW).", "15 counties. Founded by freed slaves from the USA; independent since 1847 — Africa's oldest republic."] });
  LRR("b", "Physical setting of Liberia", { blurb: "Relief, rivers, climate and vegetation.",
    pins: [["Mount Wuteve (Wologizi range)", 8.1, -9.95, "Highest point, about 1 440 m."], ["Nimba range", 7.55, -8.5, "Iron-rich mountains on the Guinea border."], ["Lake Piso", 6.75, -11.2, "Coastal lagoon lake."]],
    zones: [["Coastal plain", 6.0, -10.2, 0.4, 1.6, "teal", "Low plain with lagoons, mangroves and sandbars."], ["Interior plateau and hills", 7.0, -9.2, 0.7, 1.2, "green", "Rolling, forested plateau rising to northern highlands."]],
    notes: ["Rivers flow south-west to the sea: Mano, Lofa, St Paul, St John, Cestos, Cavalla.", "Climate: equatorial/monsoon — very wet (Monrovia about 4 500 mm a year), short dry season.", "Vegetation: tropical rainforest, the largest remaining part of the Upper Guinean forest."] });
  LRR("c", "Population of Liberia", { blurb: "Distribution of population.",
    zones: [["Montserrado (Monrovia)", 6.4, -10.7, 0.25, 0.3, "red", "About a third of the population lives in and around Monrovia."], ["Nimba and Bong", 7.2, -9.0, 0.4, 0.5, "red", "Fairly dense farming and mining areas."], ["South-east forests", 5.3, -8.3, 0.6, 0.6, "blue", "Sparse — thick forest and poor roads."]],
    notes: ["Population about 5.2 million (2022 census).", "Ethnic groups: Kpelle, Bassa, Gio, Mano, Kru, Grebo, Vai, Americo-Liberians and others."] });
  LRR("d", "Resources of Liberia", { blurb: "Minerals, forests, rubber and water.",
    pins: [["Iron ore — Yekepa (Nimba)", 7.58, -8.53, "Rich iron ore mined and railed to Buchanan."], ["Iron ore — Bong Mines", 6.82, -10.29, "Iron ore with a railway to Monrovia."], ["Iron ore — Bomi Hills", 6.85, -10.83, "Liberia's first iron ore mine (1951)."], ["Rubber — Harbel", 6.27, -10.35, "Firestone plantation."]],
    zones: [["Rainforest (timber)", 5.6, -8.6, 0.8, 0.8, "green", "Large hardwood reserves."]],
    notes: ["Other resources: gold, diamonds, fish, abundant rainfall and rivers for HEP (Mount Coffee on the St Paul river)."] });
  LRR("e", "Agriculture in Liberia", { blurb: "Rubber, food crops and tree crops.",
    pins: [["Firestone, Harbel", 6.27, -10.35, "One of the world's largest rubber plantations (since 1926)."]],
    zones: [["Upland rice and cassava", 7.6, -9.6, 0.6, 0.8, "gold", "Staple food crops grown by shifting cultivation."], ["Cocoa and coffee", 7.8, -9.3, 0.4, 0.6, "brown", "Lofa and Nimba counties."], ["Oil palm estates", 5.4, -9.0, 0.5, 0.8, "green", "Large estates in the south-east."]],
    notes: ["Problems: shifting cultivation, poor roads, damage from the civil wars, dependence on imported rice."] });
  LRR("f", "Transportation in Liberia", { blurb: "Roads, mineral railways, ports and airports.",
    lines: [["Buchanan–Yekepa railway", "teal", [[5.88, -10.05], [6.6, -9.4], [7.2, -8.9], [7.58, -8.53]], "Carries iron ore from Nimba to Buchanan."], ["Monrovia–Bong railway", "blue", [[6.35, -10.8], [6.82, -10.29]], "Former iron ore line."]],
    pins: [["Freeport of Monrovia", 6.35, -10.8, "Main seaport."], ["Roberts International Airport", 6.24, -10.36, "Main international airport."], ["Greenville port", 5.01, -9.04, "Timber port."]],
    notes: ["Liberia has one of the world's largest ship registries (flag of convenience).", "Problems: unpaved roads impassable in the rainy season, war damage."] });
  LRR("g", "Communication in Liberia", { blurb: "Telecommunications and broadcasting.",
    pins: [["Monrovia — ACE cable landing", 6.3, -10.8, "The ACE submarine cable (2011) brought fast internet."]],
    notes: ["Mobile networks (Lonestar Cell MTN, Orange), radio (LBS and community radio), newspapers.", "Problems: poor coverage in rural areas, power shortages."] });
  LRR("h", "Industry in Liberia", { blurb: "Processing and manufacturing industries.",
    pins: [["Harbel (rubber processing)", 6.27, -10.35, "Latex processed into rubber."], ["Monrovia", 6.3, -10.8, "Cement, beverages, soap, paint."], ["Buchanan", 5.88, -10.05, "Iron ore handling and processing."]],
    notes: ["Industries are mostly primary processing; problems: power shortage, small market, war damage, lack of capital."] });
  LRR("i", "Trade in Liberia", { blurb: "Exports, imports and partners.",
    pins: [["Freeport of Monrovia", 6.35, -10.8, "Main trading port."], ["Buchanan", 5.88, -10.05, "Iron ore exports."]],
    notes: ["Exports: iron ore, gold, rubber, palm oil, timber, cocoa.", "Imports: rice, fuel, machinery, vehicles, manufactured goods.", "Member of ECOWAS and the Mano River Union."] });
  LRR("j", "Tourism in Liberia", { blurb: "Forests, beaches and history.",
    pins: [["Sapo National Park", 5.4, -8.6, "Rainforest with pygmy hippos and chimpanzees."], ["East Nimba Nature Reserve", 7.5, -8.55, "Mountain forest reserve."], ["Robertsport", 6.75, -11.37, "Surfing beaches and Lake Piso."], ["Providence Island", 6.33, -10.8, "Landing place of the first settlers (1822)."], ["Blue Lake, Tubmanburg", 6.87, -10.82, "Lake in a former mine pit."]],
    notes: ["Problems: poor infrastructure and facilities, limited publicity."] });
  LRR("k", "Fishing in Liberia", { blurb: "Artisanal and industrial fishing.",
    pins: [["West Point, Monrovia", 6.33, -10.81, "Large canoe-fishing community."], ["Robertsport", 6.75, -11.37, "Fishing town."], ["Harper", 4.37, -7.72, "Kru fishing communities."], ["Lake Piso", 6.75, -11.2, "Lagoon fishing."]],
    notes: ["Kru and Fanti fishermen are well known along the coast.", "Problems: illegal foreign trawlers, poor storage and landing facilities, overfishing."] });
  LRR("l", "Mining in Liberia", { blurb: "Iron ore, gold and diamonds.",
    pins: [["Yekepa (Nimba) iron ore", 7.58, -8.53, "Mined by ArcelorMittal, exported via Buchanan."], ["Bong Mines", 6.82, -10.29, "Iron ore."], ["New Liberty gold mine", 7.0, -11.05, "Gold mine in Grand Cape Mount County."]],
    zones: [["Diamonds (Lofa and Gbarpolu)", 7.7, -10.1, 0.4, 0.5, "purple", "Alluvial diamond digging."]],
    notes: ["Problems: illegal mining, smuggling, environmental damage, falling ore prices."] });

  /* =================================================================== SENEGAMBIA =================================================================== */
  const SNR = (sub, title, o) => GK.region("SNG-" + sub, Object.assign({ scope: "SN", title }, o));
  SNR("a", "Senegambia on broad outline", { blurb: "Senegal and The Gambia: location, size and divisions. The Gambia is a narrow strip along the Gambia River, almost surrounded by Senegal.",
    pins: [["Dakar", 14.69, -17.45, "Capital of Senegal on the Cap-Vert peninsula."], ["Banjul", 13.45, -16.58, "Capital of The Gambia at the river mouth."], ["Saint-Louis", 16.03, -16.49, "Historic city at the mouth of the Senegal River."], ["Kaolack", 14.15, -16.07, "Centre of the groundnut basin."], ["Ziguinchor", 12.58, -16.27, "Main town of the Casamance."], ["Serekunda", 13.44, -16.68, "Largest urban area in The Gambia."]],
    notes: ["Senegal 196 722 km²; The Gambia 10 689 km² — the smallest country on mainland Africa.", "The Senegambia Confederation linked the two countries from 1982 to 1989.", "Senegal has 14 regions; The Gambia has 5 regions plus Banjul and Kanifing."] });
  SNR("b", "Physical setting of Senegambia", { blurb: "Relief, rivers, climate and vegetation.",
    pins: [["Pointe des Almadies (Cap-Vert)", 14.74, -17.53, "Westernmost point of mainland Africa."], ["Gambia River", 13.4, -15.0, "Navigable far inland; the backbone of The Gambia."], ["Saloum delta", 13.8, -16.6, "Mangrove delta and UNESCO site."]],
    zones: [["Ferlo plateau", 15.3, -14.5, 0.6, 1.0, "gold", "Dry, sandy plateau used for grazing."], ["Casamance", 12.7, -15.8, 0.35, 1.2, "green", "Wetter south with forest and rice swamps."], ["South-east hills", 12.7, -12.2, 0.4, 0.6, "brown", "Low hills (under about 600 m), foothills of the Fouta Djallon."]],
    notes: ["Mostly low plains under 200 m.", "Climate: Sahelian in the north (under 400 mm) to tropical wet-and-dry in the south (over 1 200 mm in Casamance); cool Canary current along the coast.", "Rivers: Senegal, Gambia, Casamance, Saloum."] });
  SNR("c", "Population of Senegambia", { blurb: "Distribution of population.",
    zones: [["Dakar region", 14.75, -17.3, 0.15, 0.25, "red", "Densest area — capital, port, industry."], ["Banjul–Kombo (Greater Banjul)", 13.4, -16.7, 0.12, 0.15, "red", "Most Gambians live in this urban area."], ["Groundnut basin", 14.4, -16.0, 0.5, 0.6, "red", "Dense farming population."], ["Ferlo and the east", 15.0, -13.8, 0.8, 1.0, "blue", "Sparse — dry, pastoral."]],
    notes: ["Senegal about 18 million (2023 census); The Gambia about 2.4 million (estimate).", "Ethnic groups: Wolof, Fula, Serer, Mandinka, Jola, Soninke and others."] });
  SNR("d", "Resources of Senegambia", { blurb: "Minerals, energy, fish and land.",
    pins: [["Taïba (phosphates)", 15.05, -16.85, "Phosphate rock for fertiliser and phosphoric acid."], ["Sabodala (gold)", 13.18, -12.12, "Gold mining in the Kédougou region."], ["Grande Côte (zircon)", 15.3, -16.75, "Mineral sands along the Niayes coast."], ["Sangomar oil field (offshore)", 13.6, -17.8, "Offshore oil, first produced in 2024."], ["Lac Rose (salt)", 14.84, -17.23, "Pink salt lake near Dakar."]],
    notes: ["Other resources: rich fishing grounds (Canary current upwelling), fertile river valleys, groundnut land, offshore gas (Grande Tortue Ahmeyim, shared with Mauritania)."] });
  SNR("e", "Agriculture in Senegambia", { blurb: "Groundnuts, cereals, rice and livestock.",
    zones: [["Groundnut basin", 14.4, -16.0, 0.6, 0.8, "gold", "Senegal's and The Gambia's main cash crop."], ["Senegal valley irrigation (rice)", 16.3, -15.0, 0.25, 1.4, "teal", "Irrigated rice and tomatoes along the Senegal River."], ["Casamance rice and fruit", 12.7, -16.0, 0.3, 0.8, "green", "Swamp rice, mangoes, cashew."], ["Ferlo pastoralism", 15.3, -14.5, 0.6, 0.9, "orange", "Cattle, sheep and goats."]],
    notes: ["Food crops: millet, sorghum, maize, rice, cassava; horticulture in the Niayes.", "Problems: drought, soil exhaustion, salinisation of rice fields, low groundnut prices."] });
  SNR("f", "Transportation in Senegambia", { blurb: "Roads, ports, river and air transport.",
    pins: [["Port of Dakar", 14.68, -17.43, "One of West Africa's main ports."], ["Port of Banjul", 13.45, -16.58, "The Gambia's port; re-export trade."], ["Senegambia Bridge (Farafenni)", 13.56, -15.6, "Bridge over the Gambia River (2019) on the Trans-Gambia Highway."], ["Blaise Diagne Airport", 14.67, -17.07, "Dakar's international airport."], ["Banjul International Airport", 13.34, -16.65, "At Yundum."]],
    lines: [["Dakar–Bamako railway", "teal", [[14.69, -17.45], [14.79, -16.93], [14.65, -16.23], [14.15, -16.07], [13.77, -13.67], [13.4, -12.2]], "Historic line towards Mali (largely out of use)."]],
    notes: ["The Gambia River is navigable by ocean ships for about 200 km.", "Dakar's new regional express train (TER) opened in 2021."] });
  SNR("g", "Communication in Senegambia", { blurb: "Telecommunications and broadcasting.",
    pins: [["Dakar", 14.69, -17.45, "Hub for submarine cables and telecom (Sonatel)."], ["Banjul", 13.45, -16.58, "ACE submarine cable landing for The Gambia."]],
    notes: ["Mobile operators: Orange (Sonatel), Free, Expresso; Gamtel, Africell, QCell.", "Broadcasting: RTS (Senegal), GRTS (The Gambia), many radio stations."] });
  SNR("h", "Industry in Senegambia", { blurb: "Processing and manufacturing industries.",
    pins: [["Rufisque–Bargny (cement)", 14.71, -17.27, "Cement works near Dakar."], ["Mbao (fertiliser, refinery)", 14.73, -17.32, "Phosphoric acid and oil refining."], ["Kaolack (groundnut oil)", 14.15, -16.07, "Groundnut crushing mills and salt."], ["Kanifing (The Gambia)", 13.45, -16.67, "Breweries, food processing."]],
    notes: ["Other industries: fish canning, textiles, tourism-related crafts.", "Problems: power costs, small markets, competition from imports."] });
  SNR("i", "Mining in Senegambia", { blurb: "Phosphates, gold, mineral sands and salt.",
    pins: [["Taïba phosphates", 15.05, -16.85, "Senegal's main mineral export base."], ["Sabodala gold", 13.18, -12.12, "Gold in the far south-east."], ["Grande Côte zircon", 15.3, -16.75, "Heavy mineral sands."], ["Kaolack salt pans", 14.15, -16.1, "Salt production."], ["Sanyang (The Gambia) mineral sands", 13.27, -16.79, "Coastal heavy mineral sands."]],
    notes: ["Problems: environmental damage to coasts and farmland, dust, displacement of farmers."] });
  SNR("j", "Fishing in Senegambia", { blurb: "One of West Africa's richest fisheries.",
    pins: [["Kayar", 14.92, -17.12, "Large pirogue fishing centre."], ["Joal-Fadiouth", 14.17, -16.83, "Busy fishing port."], ["Mbour", 14.42, -16.97, "Fish landing and processing."], ["Saint-Louis (Guet Ndar)", 16.03, -16.51, "Famous fishing quarter."], ["Tanji (The Gambia)", 13.35, -16.8, "Fishing village and smoking centre."]],
    notes: ["The cold Canary current causes upwelling of nutrients — rich in sardinella, tuna and other fish.", "Problems: overfishing by foreign trawlers, fishmeal factories, declining catches, migration of young fishermen."] });
  SNR("k", "Development issues and environmental concerns in Senegambia", { blurb: "Environmental problems and where they occur.",
    pins: [["Saint-Louis coastal erosion", 16.0, -16.5, "The sea is eroding the Langue de Barbarie and parts of the city."], ["Banjul coastal erosion", 13.45, -16.6, "Erosion threatens the capital and beaches."], ["Dakar floods", 14.75, -17.35, "Flooding in low-lying suburbs."]],
    zones: [["Drought and desertification", 15.6, -14.5, 0.7, 1.3, "orange", "Sahelian north: low rainfall, overgrazing."], ["Salinisation of rice fields", 13.2, -15.8, 0.3, 1.2, "teal", "Salt water spreads up the rivers in dry years."], ["Deforestation (Casamance)", 12.8, -15.6, 0.3, 0.7, "red", "Illegal logging of rosewood and clearing of forest."]],
    notes: ["Remedies: Great Green Wall planting, sea walls and mangrove restoration, anti-salt dams, fisheries regulation."] });
  SNR("l", "Trade in Senegambia", { blurb: "Exports, imports and the re-export trade.",
    pins: [["Port of Dakar", 14.68, -17.43, "Main export and import port."], ["Port of Banjul", 13.45, -16.58, "Re-export (entrepôt) trade to Senegal, Guinea and Mali."]],
    notes: ["Senegal exports: fish, gold, phosphoric acid and fertiliser, groundnuts, cement, oil (from 2024).", "The Gambia exports: groundnuts, fish, cashew; re-exports imported goods.", "Imports: rice, fuel, machinery, vehicles, food."] });
  SNR("m", "Tourism in Senegambia", { blurb: "Beaches, wildlife, history and culture.",
    pins: [["Gorée Island", 14.67, -17.4, "UNESCO site of the Atlantic slave trade."], ["Saint-Louis island", 16.03, -16.5, "UNESCO colonial city."], ["Djoudj bird sanctuary", 16.37, -16.27, "Huge flocks of migratory birds."], ["Niokolo-Koba National Park", 13.07, -12.72, "Savanna wildlife (UNESCO)."], ["Cap Skirring", 12.39, -16.75, "Beach resort in Casamance."], ["Kunta Kinteh Island", 13.32, -16.36, "UNESCO site in the Gambia River."], ["Wassu stone circles", 13.69, -14.88, "UNESCO megalithic site."], ["Abuko Nature Reserve", 13.41, -16.65, "The Gambia's oldest reserve."], ["Kachikally crocodile pool", 13.48, -16.68, "Sacred crocodiles at Bakau."]],
    notes: ["The Gambia's 'Smiling Coast' beach tourism (Kololi) is a major earner.", "Problems: seasonality, coastal erosion, limited facilities, cultural impacts."] });
})();
