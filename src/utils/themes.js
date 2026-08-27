/**
 * ISO 19115 MD_TopicCategoryCode values with bilingual titles and definitions.
 *
 * Prominent categories are shown at the top of the theme selector;
 * the rest appear in an expandable accordion.
 */
export const topicCategories = {
  oceans: {
    title: { en: "Oceans", fr: "Océans" },
    definition: {
      en: "Features and characteristics of salt water bodies (excluding inland waters). Examples: tides, tidal waves, coastal information, reefs.",
      fr: "Caractéristiques des masses d'eau salée (à l'exclusion des eaux intérieures). Exemples : marées, raz-de-marée, information côtière, récifs.",
    },
    prominent: true,
  },
  biota: {
    title: { en: "Biota", fr: "Biote" },
    definition: {
      en: "Flora and/or fauna in natural environment. Examples: wildlife, vegetation, biological sciences, ecology, wilderness, sea life, wetlands, habitat.",
      fr: "Flore et/ou faune dans un environnement naturel. Exemples : faune, végétation, sciences biologiques, écologie, vie marine, zones humides, habitat.",
    },
    prominent: true,
  },
  climatologyMeteorologyAtmosphere: {
    title: {
      en: "Climatology / Meteorology / Atmosphere",
      fr: "Climatologie / Météorologie / Atmosphère",
    },
    definition: {
      en: "Processes and phenomena of the atmosphere. Examples: cloud cover, weather, climate, atmospheric conditions, climate change, precipitation.",
      fr: "Processus et phénomènes atmosphériques. Exemples : couverture nuageuse, météo, climat, conditions atmosphériques, changements climatiques, précipitations.",
    },
    prominent: true,
  },
  environment: {
    title: { en: "Environment", fr: "Environnement" },
    definition: {
      en: "Environmental resources, protection and conservation. Examples: environmental pollution, waste storage and treatment, environmental impact assessment, environmental monitoring, nature reserves, landscape.",
      fr: "Ressources environnementales, protection et conservation. Exemples : pollution de l'environnement, stockage et traitement des déchets, évaluation d'impact environnemental, surveillance environnementale, réserves naturelles, paysage.",
    },
    prominent: true,
  },
  society: {
    title: { en: "Society", fr: "Société" },
    definition: {
      en: "Characteristics of society and cultures. Examples: settlements, anthropology, archaeology, education, traditional beliefs, manners and customs, demographic data, recreational areas and activities, social impact assessments, crime and justice.",
      fr: "Caractéristiques de la société et des cultures. Exemples : établissements, anthropologie, archéologie, éducation, croyances traditionnelles, us et coutumes, données démographiques, zones et activités récréatives, évaluations d'impact social, criminalité et justice.",
    },
    prominent: true,
  },
  farming: {
    title: { en: "Farming", fr: "Agriculture" },
    definition: {
      en: "Rearing of animals and/or cultivation of plants. Examples: agriculture, irrigation, aquaculture, plantations, herding, pests and diseases affecting crops and livestock.",
      fr: "Élevage d'animaux et/ou culture de plantes. Exemples : agriculture, irrigation, aquaculture, plantations, élevage, ravageurs et maladies affectant les cultures et le bétail.",
    },
    prominent: false,
  },
  boundaries: {
    title: { en: "Boundaries", fr: "Frontières" },
    definition: {
      en: "Legal land descriptions. Examples: political and administrative boundaries.",
      fr: "Descriptions légales des terres. Exemples : limites politiques et administratives.",
    },
    prominent: false,
  },
  economy: {
    title: { en: "Economy", fr: "Économie" },
    definition: {
      en: "Economic activities, conditions and employment. Examples: production, labour, revenue, commerce, industry, tourism and ecotourism, forestry, fisheries, commercial or subsistence hunting, exploration and exploitation of resources such as minerals, oil and gas.",
      fr: "Activités économiques, conditions et emploi. Exemples : production, travail, revenus, commerce, industrie, tourisme et écotourisme, foresterie, pêches, chasse commerciale ou de subsistance, exploration et exploitation des ressources comme les minéraux, le pétrole et le gaz.",
    },
    prominent: false,
  },
  elevation: {
    title: { en: "Elevation", fr: "Élévation" },
    definition: {
      en: "Height above or below sea level. Examples: altitude, bathymetry, digital elevation models, slope, derived products.",
      fr: "Hauteur au-dessus ou au-dessous du niveau de la mer. Exemples : altitude, bathymétrie, modèles numériques de terrain, pente, produits dérivés.",
    },
    prominent: false,
  },
  geoscientificInformation: {
    title: { en: "Geoscientific Information", fr: "Information géoscientifique" },
    definition: {
      en: "Information pertaining to earth sciences. Examples: geophysical features and processes, geology, minerals, sciences dealing with the composition, structure and origin of the earth's rocks, risks of earthquakes, volcanic activity, landslides, gravity information, soils, permafrost, hydrogeology, erosion.",
      fr: "Information relative aux sciences de la Terre. Exemples : caractéristiques et processus géophysiques, géologie, minéraux, sciences traitant de la composition, structure et origine des roches, risques de tremblements de terre, activité volcanique, glissements de terrain, information gravitationnelle, sols, pergélisol, hydrogéologie, érosion.",
    },
    prominent: false,
  },
  health: {
    title: { en: "Health", fr: "Santé" },
    definition: {
      en: "Health, health services, human ecology, and safety. Examples: disease and illness, factors affecting health, hygiene, substance abuse, mental and physical health, health services.",
      fr: "Santé, services de santé, écologie humaine et sécurité. Exemples : maladies, facteurs affectant la santé, hygiène, toxicomanie, santé mentale et physique, services de santé.",
    },
    prominent: false,
  },
  imageryBaseMapsEarthCover: {
    title: { en: "Imagery / Base Maps / Earth Cover", fr: "Imagerie / Cartes de base / Couverture terrestre" },
    definition: {
      en: "Base maps. Examples: land cover, topographic maps, imagery, unclassified images, annotations.",
      fr: "Cartes de base. Exemples : couverture du sol, cartes topographiques, imagerie, images non classifiées, annotations.",
    },
    prominent: false,
  },
  intelligenceMilitary: {
    title: { en: "Intelligence / Military", fr: "Renseignement / Militaire" },
    definition: {
      en: "Military bases, structures, activities. Examples: barracks, training grounds, military transportation, information collection.",
      fr: "Bases militaires, structures, activités. Exemples : casernes, terrains d'entraînement, transport militaire, collecte de renseignements.",
    },
    prominent: false,
  },
  inlandWaters: {
    title: { en: "Inland Waters", fr: "Eaux intérieures" },
    definition: {
      en: "Inland water features, drainage systems and their characteristics. Examples: rivers and glaciers, salt lakes, water utilization plans, dams, currents, floods, water quality, hydrographic charts.",
      fr: "Caractéristiques des eaux intérieures, systèmes de drainage et leurs caractéristiques. Exemples : rivières et glaciers, lacs salés, plans d'utilisation de l'eau, barrages, courants, inondations, qualité de l'eau, cartes hydrographiques.",
    },
    prominent: false,
  },
  location: {
    title: { en: "Location", fr: "Localisation" },
    definition: {
      en: "Positional information and services. Examples: addresses, geodetic networks, control points, postal zones and services, place names.",
      fr: "Information et services de positionnement. Exemples : adresses, réseaux géodésiques, points de contrôle, zones et services postaux, noms de lieux.",
    },
    prominent: false,
  },
  planningCadastre: {
    title: { en: "Planning / Cadastre", fr: "Planification / Cadastre" },
    definition: {
      en: "Information used for appropriate actions for future use of the land. Examples: land use maps, zoning maps, cadastral surveys, land ownership.",
      fr: "Information utilisée pour les actions appropriées pour l'utilisation future des terres. Exemples : cartes d'utilisation du sol, cartes de zonage, levés cadastraux, propriété foncière.",
    },
    prominent: false,
  },
  structure: {
    title: { en: "Structure", fr: "Structure" },
    definition: {
      en: "Man-made construction. Examples: buildings, museums, churches, factories, housing, monuments, shops, towers.",
      fr: "Constructions humaines. Exemples : bâtiments, musées, églises, usines, logements, monuments, magasins, tours.",
    },
    prominent: false,
  },
  transportation: {
    title: { en: "Transportation", fr: "Transport" },
    definition: {
      en: "Means and aids for conveying persons and/or goods. Examples: roads, airports/airstrips, shipping routes, tunnels, nautical charts, vehicle or vessel location, aeronautical charts, railways.",
      fr: "Moyens et aides pour le transport de personnes et/ou de marchandises. Exemples : routes, aéroports/pistes d'atterrissage, voies maritimes, tunnels, cartes nautiques, localisation de véhicules ou navires, cartes aéronautiques, chemins de fer.",
    },
    prominent: false,
  },
  utilitiesCommunication: {
    title: { en: "Utilities / Communication", fr: "Services publics / Communication" },
    definition: {
      en: "Energy, water and waste systems and communications infrastructure and services. Examples: hydroelectricity, geothermal, solar and nuclear sources of energy, water purification and distribution, sewage collection and disposal, electricity and gas distribution, data communication, telecommunication, radio, communication networks.",
      fr: "Systèmes d'énergie, d'eau et de déchets et infrastructure et services de communication. Exemples : hydroélectricité, sources d'énergie géothermique, solaire et nucléaire, purification et distribution de l'eau, collecte et élimination des eaux usées, distribution d'électricité et de gaz, communication de données, télécommunication, radio, réseaux de communication.",
    },
    prominent: false,
  },
  extraTerrestrial: {
    title: { en: "Extra Terrestrial", fr: "Extraterrestre" },
    definition: {
      en: "Region more than 100 km above the surface of the Earth.",
      fr: "Région située à plus de 100 km au-dessus de la surface de la Terre.",
    },
    prominent: false,
  },
  disaster: {
    title: { en: "Disaster", fr: "Catastrophe" },
    definition: {
      en: "Information related to disasters. Examples: site of the disaster, evacuation zone, disaster-Loss assessment, disaster-Loss prevention.",
      fr: "Information relative aux catastrophes. Exemples : site de la catastrophe, zone d'évacuation, évaluation des pertes liées aux catastrophes, prévention des pertes liées aux catastrophes.",
    },
    prominent: false,
  },
  other: {
    title: { en: "Other", fr: "Autre" },
    definition: {
      en: "Not covered by any other topic category.",
      fr: "Non couvert par une autre catégorie thématique.",
    },
    prominent: false,
  },
};

/**
 * Maps legacy resourceType values (pre-ISO) to their ISO equivalents.
 * Used by the normalizer to ensure backward compatibility with existing records.
 */
export const legacyThemeMapping = {
  oceanographic: "oceans",
  biological: "biota",
};
