export const eovList = [
  "dissolvedOrganicCarbon",
  "inorganicCarbon",
  "nitrate",
  "nutrients",
  "oxygen",
  "phosphate",
  "potentialDensity",
  "potentialTemperature",
  "pressure",
  "seaIce",
  "seaState",
  "seaSurfaceHeight",
  "seaSurfaceSalinity",
  "seaSurfaceTemperature",
  "seawaterDensity",
  "silicate",
  "speedOfSound",
  "subSurfaceCurrents",
  "subSurfaceSalinity",
  "subSurfaceTemperature",
  "surfaceCurrents",
  "other",
];

export const roleCodes = {
  custodian: {
    title: {
      en: "Metadata Custodian",
      fr: "Dépositaire des métadonnées",
    },
    text: {
      en:
        "Party that accepts accountability and responsibility for the resource and ensures appropriate care and maintenance of the resource ",
      fr:
        "Partie qui accepte la reddition de comptes et la responsabilité de la ressource et assure le soin et l'entretien appropriés de la ressource ",
    },
    required: true,
    showProminently: true,
  },
  owner: {
    title: { en: "Data Owner", fr: "Propriétaire des données" },
    text: {
      en: "Party that owns the resource",
      fr: "Partie propriétaire de la ressource",
    },
    required: true,
    showProminently: true,
  },
  distributor: {
    title: { en: "Distributor", fr: "Distributeur" },
    text: {
      en: "Party who distributes the resource",
      fr: "Partie qui distribue la ressource",
    },
    showProminently: true,
  },
  author: {
    title: { en: "Author", fr: "Auteur" },
    text: { en: "Party who authored the resource" },
  },
  coAuthor: {
    title: { en: "Coauthor", fr: "Co-auteur" },
    text: {
      en: "Party who jointly authors the resource",
      fr: "Partie qui est l'auteur conjoint de la ressource",
    },
  },

  collaborator: {
    title: { en: "Collaborator", fr: "Collaborateur" },
    text: {
      en:
        "Party who assists with the generation of the resource other than the principal investigator",
      fr:
        "Partie qui aide à la production de la ressource autre que le chercheur principal",
    },
  },
  contributor: {
    title: { en: "Contributor", fr: "Contributeur" },
    text: {
      en: "Party contributing to the resource",
      fr: "Partie contribuant à la ressource",
    },
  },
  editor: {
    title: { en: "Editor", fr: "Éditeur" },
    text: {
      en: "Party who reviewed or modified the resource to improve the content",
      fr:
        "Partie qui a examiné ou modifié la ressource pour améliorer le contenu",
    },
  },
  funder: {
    title: { en: "Funder", fr: "Financeur" },
    text: {
      en: "Party providing monetary support for the resource",
      fr: "Partie fournissant un soutien monétaire pour la ressource",
    },
  },
  mediator: {
    title: { en: "Mediator", fr: "Médiateur" },
    text: {
      en:
        "A class of entity that mediates access to the resource and for whom the resource is intended or useful ",
      fr:
        "Classe d'entité qui sert de médiateur à l'accès à la ressource et pour laquelle la ressource est destinée ou utile",
    },
  },
  originator: {
    title: { en: "Originator", fr: "Initiateur" },
    text: {
      en: "Party who created the resource",
      fr: "Partie qui a créé la ressource",
    },
  },
  pointOfContact: {
    title: { en: "Point Of Contact", fr: "Point de contact" },
    text: {
      en:
        "Party who can be contacted for acquiring knowledge about or acquisition of the resource",
      fr:
        "Partie qui peut être contactée pour acquérir des connaissances sur la ressource ou l'acquisition de la ressource",
    },
  },

  principalInvestigator: {
    title: { en: "Principal Investigator", fr: "Responsable de recherche" },
    text: {
      en:
        "Key party responsible for gathering information and conducting research",
      fr:
        "Partie clé responsable de la collecte de l'information et de la réalisation de la recherche",
    },
  },
  processor: {
    title: { en: "Processor", fr: "Transformateur" },
    text: {
      en:
        "Party who has processed the data in a manner such that the resource has been modified",
      fr:
        "Partie qui a traité les données d'une manière telle que la ressource a été modifiée",
    },
  },
  publisher: {
    title: { en: "Publisher", fr: "Editeur" },
    text: {
      en: "Party who published the resource",
      fr: "Partie qui a publié la ressource",
    },
  },
  resourceProvider: {
    title: { en: "Resource Provider", fr: "Fournisseur de ressources" },
    text: {
      en: "Party that supplies the resource",
      fr: "Partie qui fournit la ressource ",
    },
  },
  rightsHolder: {
    title: { en: "Rights Holder", fr: "Ayant droit" },
    text: {
      en: "Party owning or managing rights over the resource ",
      fr: "Partie détenant ou gérant des droits sur la ressource",
    },
  },
  sponsor: {
    title: { en: "Sponsor", fr: "Commanditaire" },
    text: {
      en: "Party who speaks for the resource ",
      fr: "Parti qui parle pour la ressource",
    },
  },
  stakeholder: {
    title: { en: "Stakeholder", fr: "Actionnaire" },
    text: {
      en:
        "Party who has an interest in the resource or the use of the resource ",
      fr:
        "Partie qui a un intérêt dans la ressource ou l'utilisation de la ressource",
    },
  },
};

export const progressCodes = {
  onGoing: {
    title: { en: "Ongoing", fr: "En cours" },
    text: {
      en:
        "Data is continually being updated. e.g satellite dataset that continues to be augmented",
      fr:
        "Les données sont continuellement mises à jour, par exemple un ensemble de données satellite qui continue d'être augmenté",
    },
  },

  historicalArchive: {
    title: { en: "Historical Archive", fr: "Archives historiques" },
    text: {
      en:
        "Data has been stored in an offline storage facility. use to indicate data are archived",
      fr:
        "Les données ont été stockées dans une installation de stockage hors connexion. Utilisez pour indiquer que les données sont archivées",
    },
  },

  completed: {
    title: { en: "Completed", fr: "Terminé" },
    text: {
      en:
        "Production of the data has been completed 	e.g. raw data that is not ongoing, completed model",
      fr:
        "La production des données a été terminée, p. ex. données brutes qui ne sont pas en cours, modèle terminé",
    },
  },
};

export const depthDirections = {
  heightPositive: { en: "Depth Positive", fr: "Profondeur positive" },
  depthPositive: { en: "Height Positive", fr: "Hauteur positive" },
};

export const associationTypeCode = {
  IsCitedBy: {
    title: { en: "Is Cited By", fr: "Est cité par" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  Cites: {
    title: { en: "Cites", fr: "Cites" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  IsSupplementTo: {
    title: { en: "Is Supplement To", fr: "Est un supplément à" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  IsSupplementedBy: {
    title: { en: "Is Supplemented By", fr: "Est complété par" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  IsContinuedBy: {
    title: { en: "Is Continued By", fr: "Est continué par" },
    text: {
      en: "mapped to ISO value 'series'", fr: "mappé à la valeur ISO 'series'",
    },
    isoValue: "series"
  },
  Continues: {
    title: { en: "Continues", fr: "Continue" },
    text: {
      en: "mapped to ISO value 'series'", fr: "mappé à la valeur ISO 'series'",
    },
    isoValue: "series"
  },
  IsDescribedBy: {
    title: { en: "Is Described By", fr: "Est décrit par" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  Describes: {
    title: { en: "Describes", fr: "Décrit" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  HasMetadata: {
    title: { en: "Has Metadata", fr: "Possède des métadonnées" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  IsMetadataFor: {
    title: { en: "Is Metadata For", fr: "Les métadonnées sont-elles destinées" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  HasVersion: {
    title: { en: "Has Version", fr: "A une version" },
    text: {
      en: "mapped to ISO value 'revisionOf'", fr: "mappé à la valeur ISO 'revisionOf'",
    },
    isoValue: "revisionOf"
  },
  IsVersionOf: {
    title: { en: "Is Version Of", fr: "Est la version de" },
    text: {
      en: "mapped to ISO value 'revisionOf'", fr: "mappé à la valeur ISO 'revisionOf'",
    },
    isoValue: "revisionOf"
  },
  IsNewVersionOf: {
    title: { en: "Is New Version Of", fr: "Est-ce une nouvelle version de" },
    text: {
      en: "mapped to ISO value 'revisionOf'", fr: "mappé à la valeur ISO 'revisionOf'",
    },
    isoValue: "revisionOf"
  },
  PreviousVersionOf: {
    title: { en: "Previous Version Of", fr: "Version précédente de" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  IsPartOf: {
    title: { en: "Is Part Of", fr: "Fait partie de" },
    text: {
      en: "mapped to ISO value 'largerWorkCitation'", fr: "mappé à la valeur ISO 'largerWorkCitation'",
    },
    isoValue: "largerWorkCitation"
  },
  HasPart: {
    title: { en: "Has Part", fr: "A une partie" },
    text: {
      en: "mapped to ISO value 'isComposedOf'", fr: "mappé à la valeur ISO 'isComposedOf'",
    },
    isoValue: "isComposedOf"
  },
  IsPublishedIn: {
    title: { en: "Is Published In", fr: "Est publié dans" },
    text: {
      en: "mapped to ISO value 'largerWorkCitation'", fr: "mappé à la valeur ISO 'largerWorkCitation'",
    },
    isoValue: "largerWorkCitation"
  },
  IsReferencedBy: {
    title: { en: "Is Referenced By", fr: "Est référencé par" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  References: {
    title: { en: "References", fr: "Les références" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  IsDocumentedBy: {
    title: { en: "Is Documented By", fr: "Est documenté par" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  Documents: {
    title: { en: "Documents", fr: "Documents" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  IsCompiledBy: {
    title: { en: "Is Compiled By", fr: "Est compilé par" },
    text: {
      en: "mapped to ISO value 'dependency'", fr: "mappé à la valeur ISO 'dependency'",
    },
    isoValue: "dependency"
  },
  Compiles: {
    title: { en: "Compiles", fr: "Compile" },
    text: {
      en: "mapped to ISO value 'dependency'", fr: "mappé à la valeur ISO 'dependency'",
    },
    isoValue: "dependency"
  },
  IsVariantFormOf: {
    title: { en: "Is Variant Form Of", fr: "Est une forme variante de" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  IsOriginalFormOf: {
    title: { en: "Is Original Form Of", fr: "Est la forme originale de" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  IsIdenticalTo: {
    title: { en: "Is Identical To", fr: "Est identique à" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  IsReviewedBy: {
    title: { en: "Is Reviewed By", fr: "Est révisé par" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  Reviews: {
    title: { en: "Reviews", fr: "Commentaires" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  IsDerivedFrom: {
    title: { en: "Is Derived From", fr: "Dérive de" },
    text: {
      en: "mapped to ISO value 'dependency'", fr: "mappé à la valeur ISO 'dependency'",
    },
    isoValue: "dependency"
  },
  IsSourceOf: {
    title: { en: "Is Source Of", fr: "est la source de" },
    text: {
      en: "mapped to ISO value 'dependency'", fr: "mappé à la valeur ISO 'dependency'",
    },
    isoValue: "dependency"
  },
  Requires: {
    title: { en: "Requires", fr: "A besoin" },
    text: {
      en: "mapped to ISO value 'dependency'", fr: "mappé à la valeur ISO 'dependency'",
    },
    isoValue: "dependency"
  },
  IsRequiredBy: {
    title: { en: "Is Required By", fr: "Est requis par" },
    text: {
      en: "mapped to ISO value 'dependency'", fr: "mappé à la valeur ISO 'dependency'",
    },
    isoValue: "dependency"
  },
  IsObsoletedBy: {
    title: { en: "Is Obsoleted By", fr: "Est obsolète par" },
    text: {
      en: "mapped to ISO value 'crossReference'", fr: "mappé à la valeur ISO 'crossReference'",
    },
    isoValue: "crossReference"
  },
  Obsoletes: {
    title: { en: "Obsoletes", fr: "Obsolètes" },
    text: {
      en: "mapped to ISO value 'revisionOf'", fr: "mappé à la valeur ISO 'revisionOf'",
    },
    isoValue: "revisionOf"
  },
};



export const initiativeTypeCode = {
  campaign: {
    title: { en: "campaign", fr: "" },
    text: {
      en: "series of organized planned actions", fr: "",
    },
  },
  collection: {
    title: { en: "collection", fr: "" },
    text: {
      en: "accumulation of datasets assembled for a specific purpose", fr: "",
    },
  },
  exercise: {
    title: { en: "exercise", fr: "" },
    text: {
      en: "specific performance of a function or group of functions", fr: "",
    },
  },
  experiment: {
    title: { en: "experiment", fr: "" },
    text: {
      en: "process designed to find if something is effective or valid", fr: "",
    },
  },
  investigation: {
    title: { en: "investigation", fr: "" },
    text: {
      en: "search or systematic inquiry", fr: "",
    },
  },
  mission: {
    title: { en: "mission", fr: "" },
    text: {
      en: "specific operation of a data collection system", fr: "",
    },
  },
  operation: {
    title: { en: "operation", fr: "" },
    text: {
      en: "action that is part of a series of actions", fr: "",
    },
  },
  platform: {
    title: { en: "platform", fr: "" },
    text: {
      en: "vehicle or other support base that holds a sensor", fr: "",
    },
  },
  process: {
    title: { en: "process", fr: "" },
    text: {
      en: "method of doing something involving a number of steps", fr: "",
    },
  },
  program: {
    title: { en: "program", fr: "" },
    text: {
      en: "specific planned activity", fr: "",
    },
  },
  project: {
    title: { en: "project", fr: "" },
    text: {
      en: "organized undertaking, research, or development", fr: "",
    },
  },
  sensor: {
    title: { en: "sensor", fr: "" },
    text: {
      en: "device or piece of equipment which detects or records", fr: "",
    },
  },
  study: {
    title: { en: "study", fr: "" },
    text: {
      en: "examination or investigation", fr: "",
    },
  },
  task: {
    title: { en: "task", fr: "" },
    text: {
      en: "piece of work", fr: "",
    },
  },
  trial: {
    title: { en: "trial", fr: "" },
    text: {
      en: "process of testing to discover or demonstrate somethin", fr: "",
    },
  },

};

export const identifierType = [
  "ARK",
  "arXiv",
  "bibcode",
  "ca.cioos",
  "DOI",
  "EAN13",
  "EISSN",
  "Handle",
  "IGSN",
  "ISBN",
  "ISSN",
  "ISTC",
  "LISSN",
  "LSID",
  "PMID",
  "PURL",
  "UPC",
  "URL",
  "URN",
  "w3id",
]

