// Bounding box format: { north, south, east, west }
// Polygon format: space-separated "lat,lng" pairs; must start and end with the same point.
// Polygon coordinates are simplified approximations for visual identification in the
// metadata form. They are NOT cartographic-grade boundaries.
// Sources:
//   StatCan  - Statistics Canada
//   IHO      - International Hydrographic Organization Sea Areas via marineregions.org
//   GEBCO    - General Bathymetric Chart of the Oceans via marineregions.org
//   LME      - Large Marine Ecosystem via marineregions.org
//   CF       - CF Conventions standardized region list
//              https://cfconventions.org/Data/standardized-region-list/standardized-region-list.current.html
//   DFO      - Fisheries and Oceans Canada Marine Bioregions (MRGID 50171–50183)
//              via marineregions.org (bbox not available in gazetteer)

const geographicLocations = [
  // ── Provinces ────────────────────────────────────────────────────────────
  {
    en: "British Columbia",
    fr: "Colombie-Britannique",
    type: "province",
    bbox: { north: 60.0, south: 48.2245, east: -114.0337, west: -139.0536 },
    polygon:
      "60,-139.05 60,-132 60,-125 60,-120 57,-120 54,-120 52,-119.5 49,-114.05 49,-117 49,-119.5 49,-121.5 49,-123 48.3,-123.5 48.5,-125.5 49.5,-127 51,-128.5 52.5,-129.5 54,-131 55.5,-132 57,-135 59,-137.5 60,-139.05",
    source: "StatCan",
  },
  {
    en: "Alberta",
    fr: "Alberta",
    type: "province",
    bbox: { north: 60.0, south: 48.9999, east: -110.0053, west: -120.0016 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Saskatchewan",
    fr: "Saskatchewan",
    type: "province",
    bbox: { north: 60.0, south: 48.9999, east: -101.3609, west: -110.0053 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Manitoba",
    fr: "Manitoba",
    type: "province",
    bbox: { north: 60.0, south: 48.9999, east: -95.1562, west: -102.0422 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Ontario",
    fr: "Ontario",
    type: "province",
    bbox: { north: 56.8603, south: 41.6762, east: -74.3418, west: -95.1562 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Quebec",
    fr: "Québec",
    type: "province",
    bbox: { north: 62.5942, south: 44.9904, east: -57.1057, west: -79.7633 },
    polygon:
      "62.59,-79.76 62.59,-77 62,-73 61,-69 60,-65 58,-65.5 56,-61 54,-58 52.5,-57.1 50.5,-58 49,-63 48.5,-66 47.5,-65 46,-71 45,-74 45.5,-75 46.5,-79.5 49,-79.76 52,-79.76 56,-79.76 60,-79.76 62.59,-79.76",
    source: "StatCan",
  },
  {
    en: "New Brunswick",
    fr: "Nouveau-Brunswick",
    type: "province",
    bbox: { north: 48.0713, south: 44.5521, east: -63.7697, west: -69.0634 },
    polygon:
      "48.07,-66.4 48,-65 47.5,-64.5 46.5,-64 46,-63.8 45.5,-64.5 45,-65.5 44.6,-66.5 45,-67.2 46,-68 47,-69 47.8,-67.5 48.07,-66.4",
    source: "StatCan",
  },
  {
    en: "Nova Scotia",
    fr: "Nouvelle-Écosse",
    type: "province",
    bbox: { north: 47.0323, south: 43.3763, east: -59.6809, west: -66.3282 },
    polygon:
      "47.03,-60.5 46.5,-59.7 45.8,-60.5 45,-61.3 44.2,-62.5 43.4,-65.5 43.7,-66.2 44.3,-66 44.6,-64.8 45.2,-63.5 45.6,-63 46,-61.5 46.4,-61 47.03,-60.5",
    source: "StatCan",
  },
  {
    en: "Prince Edward Island",
    fr: "Île-du-Prince-Édouard",
    type: "province",
    bbox: { north: 47.0618, south: 45.9488, east: -61.9321, west: -64.4231 },
    polygon:
      "47.06,-63.2 46.9,-62.3 46.5,-62 46.1,-62.3 46,-63 46.1,-63.7 46.4,-64.3 46.8,-64 47.06,-63.2",
    source: "StatCan",
  },
  {
    en: "Newfoundland and Labrador",
    fr: "Terre-Neuve-et-Labrador",
    type: "province",
    bbox: { north: 60.3706, south: 46.619, east: -52.6157, west: -67.8017 },
    polygon:
      "60.37,-64.5 58.5,-63 56,-61 54,-58 52.5,-56 51,-57 49.5,-55 48,-53 47,-52.7 46.7,-54 47,-56.5 47.5,-58 48,-59.5 49,-58.5 50.5,-57.5 52,-56.5 53,-57.5 55,-60 57,-62 59,-64 60.37,-67 60.37,-64.5",
    source: "StatCan",
  },

  // ── Territories ──────────────────────────────────────────────────────────
  {
    en: "Yukon",
    fr: "Yukon",
    type: "territory",
    bbox: { north: 69.6454, south: 59.9999, east: -123.8094, west: -141.0017 },
    polygon:
      "60,-141 69.64,-141 69.5,-138 68.5,-136.5 66,-133 64,-130 62,-128 60,-124 60,-129 60,-135 60,-141",
    source: "StatCan",
  },
  {
    en: "Northwest Territories",
    fr: "Territoires du Nord-Ouest",
    type: "territory",
    bbox: { north: 78.7728, south: 59.9997, east: -101.9999, west: -136.4683 },
    polygon:
      "78.77,-110 76,-105 74,-110 72,-120 70,-132 69.5,-136 68.5,-136.5 66,-133 64,-130 62,-128 60,-124 60,-120 60,-110 60,-102 62,-102 66,-102 70,-102 73,-100 76,-105 78.77,-110",
    source: "StatCan",
  },
  {
    en: "Nunavut",
    fr: "Nunavut",
    type: "territory",
    bbox: { north: 83.1116, south: 51.6357, east: -61.1537, west: -120.6611 },
    polygon:
      "83.11,-72 82,-62 78,-62 74,-64 70,-68 66,-68 63,-72 60,-80 55,-80 52,-80 51.64,-80 55,-72 58,-68 60,-65 63,-64 68,-62 72,-62 75,-68 78,-80 80,-90 82,-100 83,-110 83,-120 81,-115 78,-110 75,-100 73,-95 70,-90 67,-90 64,-95 62,-98 60,-102 62,-102 66,-102 70,-102 74,-100 78,-105 83.11,-105 83.11,-90 83.11,-72",
    source: "StatCan",
  },

  // ── Marine Regions (IHO Sea Areas — marineregions.org) ───────────────────
  {
    en: "Gulf of St. Lawrence",
    fr: "Golfe du Saint-Laurent",
    type: "marineRegion",
    bbox: { north: 52.222, south: 44.958, east: -54.703, west: -74.865 },
    polygon:
      "52,-60 51,-58 50,-57 49,-57.5 48,-59 47,-59.5 46,-60 45.5,-61 45,-62 45.5,-63 46,-64 47,-65 48,-66 49,-67.5 50,-66.5 51,-63 52,-60",
    source: "IHO",
    mrgid: 4290,
  },
  {
    en: "Hudson Bay",
    fr: "Baie d'Hudson",
    type: "marineRegion",
    bbox: { north: 66.026, south: 51.144, east: -75.884, west: -95.346 },
    polygon:
      "66,-86 64,-80 62,-78 59.5,-77 57,-79 55,-80 53,-81 51.5,-80 51.5,-82 52,-84 54,-85 56,-88 58,-92 60,-95 63,-93 66,-91 66,-86",
    source: "IHO",
    mrgid: 4252,
  },
  {
    en: "Hudson Strait",
    fr: "Détroit d'Hudson",
    type: "marineRegion",
    bbox: { north: 64.98, south: 55.845, east: -64.432, west: -80.952 },
    polygon:
      "64.98,-78 63.5,-74 62.5,-70 61.5,-67 60.5,-65 59,-66 58,-68 59,-72 60,-76 62,-80 64.98,-78",
    source: "IHO",
    mrgid: 4251,
  },
  {
    en: "Labrador Sea",
    fr: "Mer du Labrador",
    type: "marineRegion",
    bbox: { north: 60.399, south: 47.386, east: -43.675, west: -64.306 },
    polygon:
      "60.4,-58 58,-54 55,-48 52,-44 49,-44 47.4,-46 48,-51 50,-55 53,-59 56,-62 60.4,-64 60.4,-58",
    source: "IHO",
    mrgid: 4291,
  },
  {
    en: "Bay of Fundy",
    fr: "Baie de Fundy",
    type: "marineRegion",
    bbox: { north: 46.203, south: 44.088, east: -63.305, west: -67.324 },
    polygon:
      "46.2,-65.5 45.5,-64.5 44.7,-64 44.1,-65 44.2,-66.5 44.7,-67.3 45.5,-67 46.2,-66 46.2,-65.5",
    source: "IHO",
    mrgid: 4289,
  },
  {
    en: "Beaufort Sea",
    fr: "Mer de Beaufort",
    type: "marineRegion",
    bbox: { north: 76.363, south: 67.597, east: -122.653, west: -156.665 },
    polygon:
      "76.36,-130 75,-123 72,-126 70,-135 69,-141 68,-150 68,-157 70,-157 73,-150 76,-140 76.36,-130",
    source: "IHO",
    mrgid: 4256,
  },
  {
    en: "Davis Strait",
    fr: "Détroit de Davis",
    type: "marineRegion",
    bbox: { north: 70.072, south: 59.892, east: -44.462, west: -70.143 },
    polygon:
      "70.07,-60 68,-56 65,-52 62,-48 60,-45 60,-52 61,-57 63,-62 66,-66 70.07,-70 70.07,-60",
    source: "IHO",
    mrgid: 4250,
  },
  {
    en: "Baffin Bay",
    fr: "Baie de Baffin",
    type: "marineRegion",
    bbox: { north: 82.45, south: 69.617, east: -50.523, west: -82.204 },
    polygon:
      "82.45,-65 80,-58 77,-54 74,-54 72,-51 70,-55 70,-62 72,-68 75,-74 78,-80 82.45,-80 82.45,-65",
    source: "IHO",
    mrgid: 4253,
  },
  {
    en: "Gulf of Alaska",
    fr: "Golfe d'Alaska",
    type: "marineRegion",
    bbox: { north: 61.549, south: 54.298, east: -136.618, west: -163.358 },
    polygon:
      "61.55,-141 60,-143 58,-148 56,-153 54.3,-160 54.5,-163 56,-158 58,-152 60,-147 61.55,-143 61.55,-141",
    source: "IHO",
    mrgid: 4312,
  },
  {
    en: "Scotian Shelf",
    fr: "Plateforme Néo-Écossaise",
    type: "marineRegion",
    bbox: { north: 48.906, south: 42.259, east: -55.462, west: -66.844 },
    polygon:
      "48.9,-57 47,-56 44.5,-57 42.3,-60 42.3,-64 43.5,-66.8 45,-66 46,-64 47.5,-60 48.9,-57",
    source: "LME",
    mrgid: 8548,
  },
  {
    en: "Grand Banks",
    fr: "Grands Bancs",
    type: "marineRegion",
    bbox: { north: 49.091, south: 42.853, east: -46.878, west: -57.304 },
    polygon:
      "49.09,-50 47.5,-47 45,-47 42.9,-49 43,-53 45,-56 47.5,-57 49.09,-55 49.09,-50",
    source: "GEBCO",
    mrgid: 4554,
  },
  {
    en: "Strait of Georgia",
    fr: "Détroit de Georgie",
    type: "marineRegion",
    bbox: { north: 50.15, south: 48.267, east: -122.75, west: -124.933 },
    polygon:
      "50.15,-124.7 49.8,-124 49.3,-123.4 48.8,-123 48.3,-122.8 48.3,-123.3 48.6,-123.8 49.1,-124.3 49.6,-124.8 50.15,-124.9 50.15,-124.7",
    source: "IHO",
    mrgid: 18821,
  },

  // ── DFO Marine Bioregions (marineregions.org MRGID 50171–50183) ──────────
  // Regions already covered by an IHO marineRegion entry above are omitted
  // to avoid duplicates (Strait of Georgia 50171, Scotian Shelf 50181,
  // Gulf of St. Lawrence 50182). Bboxes are derived from DFO bioregion maps;
  // the Marine Regions gazetteer stores only centroids for these records.
  {
    en: "Southern Shelf",
    fr: "Plateforme Sud",
    type: "dfoBioregion",
    bbox: { north: 50.5, south: 46.0, east: -124.0, west: -133.0 },
    polygon:
      "50.5,-124 49,-125 47,-126 46,-128 46,-133 48,-133 50,-130 50.5,-127 50.5,-124",
    source: "DFO",
    mrgid: 50172,
  },
  {
    en: "Offshore Pacific",
    fr: "Zone extracôtière du Pacifique",
    type: "dfoBioregion",
    bbox: { north: 55.0, south: 47.0, east: -127.0, west: -143.0 },
    polygon:
      "55,-127 53,-130 50,-133 47,-137 47,-143 50,-140 53,-136 55,-132 55,-127",
    source: "DFO",
    mrgid: 50173,
  },
  {
    en: "Northern Shelf",
    fr: "Plateforme Nord",
    type: "dfoBioregion",
    bbox: { north: 56.5, south: 50.0, east: -126.0, west: -134.5 },
    polygon:
      "56.5,-128 55,-127 53.5,-128 52,-130 50.5,-130 50,-133 52,-134.5 54,-134 56,-132 56.5,-130 56.5,-128",
    source: "DFO",
    mrgid: 50174,
  },
  {
    en: "Arctic Basin",
    fr: "Bassin Arctique",
    type: "dfoBioregion",
    bbox: { north: 90.0, south: 78.0, east: 180.0, west: -180.0 },
    polygon: null,
    source: "DFO",
    mrgid: 50175,
  },
  {
    en: "Western Arctic",
    fr: "Arctique de l'Ouest",
    type: "dfoBioregion",
    bbox: { north: 77.0, south: 68.0, east: -110.0, west: -141.0 },
    polygon:
      "77,-115 76,-110 73,-112 70,-120 69,-130 68,-141 70,-141 72,-135 74,-128 77,-120 77,-115",
    source: "DFO",
    mrgid: 50176,
  },
  {
    en: "Arctic Archipelago",
    fr: "Archipel Arctique",
    type: "dfoBioregion",
    bbox: { north: 83.5, south: 68.0, east: -61.0, west: -120.0 },
    polygon:
      "83.5,-90 82,-70 78,-62 74,-62 70,-65 68,-70 68,-85 68,-100 68,-115 70,-120 74,-115 78,-110 82,-105 83.5,-100 83.5,-90",
    source: "DFO",
    mrgid: 50177,
  },
  {
    en: "Eastern Arctic",
    fr: "Arctique de l'Est",
    type: "dfoBioregion",
    bbox: { north: 80.0, south: 60.0, east: -55.0, west: -100.0 },
    polygon:
      "80,-65 78,-55 74,-55 70,-58 66,-60 62,-62 60,-65 60,-80 60,-95 60,-100 65,-100 70,-95 75,-85 80,-75 80,-65",
    source: "DFO",
    mrgid: 50178,
  },
  {
    en: "Hudson Bay Complex",
    fr: "Complexe de la baie d'Hudson",
    type: "dfoBioregion",
    bbox: { north: 70.0, south: 51.0, east: -64.5, west: -95.0 },
    polygon:
      "70,-85 68,-78 64,-70 62,-65 60,-65 57,-70 55,-75 52,-79 51,-82 53,-87 56,-92 59,-95 62,-95 65,-92 68,-88 70,-85",
    source: "DFO",
    mrgid: 50179,
  },
  {
    en: "Newfoundland-Labrador Shelves",
    fr: "Plateformes de Terre-Neuve et du Labrador",
    type: "dfoBioregion",
    bbox: { north: 61.0, south: 42.0, east: -42.0, west: -64.5 },
    polygon:
      "61,-55 58,-50 55,-48 52,-44 49,-42 46,-44 43,-48 42,-55 44,-60 46,-62 48,-64.5 50,-62 53,-58 56,-55 59,-57 61,-60 61,-55",
    source: "DFO",
    mrgid: 50180,
  },
  {
    en: "Great Lakes",
    fr: "Grands Lacs",
    type: "dfoBioregion",
    bbox: { north: 49.0, south: 41.7, east: -76.0, west: -92.5 },
    polygon:
      "49,-84 48.5,-82 48,-80 47,-79 46,-78 44,-76 42,-78 41.7,-82 42,-85 44,-88 46,-90 48,-92 49,-89 49,-84",
    source: "DFO",
    mrgid: 50183,
  },

  // ── Oceans (CF Conventions + IHO bboxes via marineregions.org) ───────────
  {
    en: "North Atlantic Ocean",
    fr: "Océan Atlantique Nord",
    type: "ocean",
    bbox: { north: 68.639, south: -0.936, east: 12.006, west: -98.054 },
    polygon: null,
    source: "CF",
    mrgid: 1912,
  },
  {
    en: "North Pacific Ocean",
    fr: "Océan Pacifique Nord",
    type: "ocean",
    bbox: { north: 66.56, south: 0.0, east: -76.99, west: 117.52 },
    polygon: null,
    source: "CF",
    mrgid: 1908,
  },
  {
    en: "Arctic Ocean",
    fr: "Océan Arctique",
    type: "ocean",
    bbox: { north: 90.0, south: 51.144, east: 180.0, west: -180.0 },
    polygon: null,
    source: "CF",
    mrgid: 1906,
  },

  // ── Canadian Cities ──────────────────────────────────────────────────────
  // Capitals
  {
    en: "Victoria",
    fr: "Victoria",
    type: "city",
    bbox: { north: 48.53, south: 48.33, east: -123.27, west: -123.47 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Edmonton",
    fr: "Edmonton",
    type: "city",
    bbox: { north: 53.65, south: 53.45, east: -113.39, west: -113.59 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Regina",
    fr: "Regina",
    type: "city",
    bbox: { north: 50.55, south: 50.35, east: -104.52, west: -104.72 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Winnipeg",
    fr: "Winnipeg",
    type: "city",
    bbox: { north: 50.0, south: 49.8, east: -97.04, west: -97.24 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Toronto",
    fr: "Toronto",
    type: "city",
    bbox: { north: 43.75, south: 43.55, east: -79.28, west: -79.48 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Quebec City",
    fr: "Québec",
    type: "city",
    bbox: { north: 46.91, south: 46.71, east: -71.11, west: -71.31 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Fredericton",
    fr: "Fredericton",
    type: "city",
    bbox: { north: 46.06, south: 45.86, east: -66.54, west: -66.74 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Halifax",
    fr: "Halifax",
    type: "city",
    bbox: { north: 44.75, south: 44.55, east: -63.48, west: -63.68 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Charlottetown",
    fr: "Charlottetown",
    type: "city",
    bbox: { north: 46.34, south: 46.14, east: -63.03, west: -63.23 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "St. John's",
    fr: "St. John's",
    type: "city",
    bbox: { north: 47.66, south: 47.46, east: -52.61, west: -52.81 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Whitehorse",
    fr: "Whitehorse",
    type: "city",
    bbox: { north: 60.82, south: 60.62, east: -134.96, west: -135.16 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Yellowknife",
    fr: "Yellowknife",
    type: "city",
    bbox: { north: 62.55, south: 62.35, east: -114.27, west: -114.47 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Iqaluit",
    fr: "Iqaluit",
    type: "city",
    bbox: { north: 63.85, south: 63.65, east: -68.42, west: -68.62 },
    polygon: null,
    source: "StatCan",
  },
  // Major population centres
  {
    en: "Vancouver",
    fr: "Vancouver",
    type: "city",
    bbox: { north: 49.38, south: 49.18, east: -123.02, west: -123.22 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Surrey",
    fr: "Surrey",
    type: "city",
    bbox: { north: 49.29, south: 49.09, east: -122.75, west: -122.95 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Kelowna",
    fr: "Kelowna",
    type: "city",
    bbox: { north: 49.99, south: 49.79, east: -119.4, west: -119.6 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Calgary",
    fr: "Calgary",
    type: "city",
    bbox: { north: 51.14, south: 50.94, east: -113.97, west: -114.17 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Saskatoon",
    fr: "Saskatoon",
    type: "city",
    bbox: { north: 52.23, south: 52.03, east: -106.57, west: -106.77 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Ottawa",
    fr: "Ottawa",
    type: "city",
    bbox: { north: 45.52, south: 45.32, east: -75.6, west: -75.8 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Montreal",
    fr: "Montréal",
    type: "city",
    bbox: { north: 45.6, south: 45.4, east: -73.47, west: -73.67 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Hamilton",
    fr: "Hamilton",
    type: "city",
    bbox: { north: 43.36, south: 43.16, east: -79.77, west: -79.97 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "London",
    fr: "London",
    type: "city",
    bbox: { north: 43.08, south: 42.88, east: -81.15, west: -81.35 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Kitchener",
    fr: "Kitchener",
    type: "city",
    bbox: { north: 43.55, south: 43.35, east: -80.39, west: -80.59 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Windsor",
    fr: "Windsor",
    type: "city",
    bbox: { north: 42.41, south: 42.21, east: -82.94, west: -83.14 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Mississauga",
    fr: "Mississauga",
    type: "city",
    bbox: { north: 43.69, south: 43.49, east: -79.54, west: -79.74 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Brampton",
    fr: "Brampton",
    type: "city",
    bbox: { north: 43.83, south: 43.63, east: -79.66, west: -79.86 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Laval",
    fr: "Laval",
    type: "city",
    bbox: { north: 45.71, south: 45.51, east: -73.61, west: -73.81 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Gatineau",
    fr: "Gatineau",
    type: "city",
    bbox: { north: 45.58, south: 45.38, east: -75.6, west: -75.8 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Sherbrooke",
    fr: "Sherbrooke",
    type: "city",
    bbox: { north: 45.5, south: 45.3, east: -71.79, west: -71.99 },
    polygon: null,
    source: "StatCan",
  },
  {
    en: "Saint John",
    fr: "Saint John",
    type: "city",
    bbox: { north: 45.37, south: 45.17, east: -65.96, west: -66.16 },
    polygon: null,
    source: "StatCan",
  },
];

export default geographicLocations;
