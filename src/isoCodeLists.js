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

export const metadataScopeCodes = {
  dataset: {
    title: {
      en: "dataset",
      fr: "Ensembles de données"
    },
    text: {
      en: "information applies to the dataset",
      fr: "l'information s'applique à l'ensemble de données"
    },
  },
  document: {
    title: {
      en: "document",
      fr: "document"
    },
    text: {
      en: "information applies to a document",
      fr: "l'information s'applique à un document"
    },
  },
  model: {
    title: {
      en: "model",
      fr: "modèle"
    },
    text: {
      en: "information applies to a copy or imitation of an existing or hypothetical object",
      fr: "l'information s'applique à une copie ou à une imitation d'un objet existant ou hypothétique"
    },
  },
  service: {
    title: {
      en: "service",
      fr: "service"
    },
    text: {
      en: "information applies to a capability which a service provider entity makes available to a service user entity through a set of interfaces that define a behaviour, such as a use case",
      fr: "les informations s'appliquent à une capacité qu'une entité fournisseur de services met à la disposition d'une entité utilisatrice de services par l'intermédiaire d'un ensemble d'interfaces qui définissent un comportement, tel qu'un cas d'utilisation"
    },
  },
  software: {
    title: {
      title: {
        en: "software", fr: "logiciel"
      },
      text: {
        en: "information applies to a computer program or routine",
        fr: "l'information s'applique à un programme informatique ou à une routine"
      },
    },
  },
};