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
    title: { en: "Editor", fr: "Réviseur" },
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
    title: { en: "Publisher", fr: "Éditeur" },
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
        "Les données sont continuellement mises à jour, C'est le cas par exemple pour un jeu de données satellitaires qui continue d'être alimenté.",
    },
  },

  historicalArchive: {
    title: { en: "Historical Archive", fr: "Archives historiques" },
    text: {
      en:
        "Data has been stored in an offline storage facility. use to indicate data are archived",
      fr:
        "Les données ont été stockées dans une installation de stockage hors connexion. Utilisez cette option pour indiquer que les données sont archivées",
    },
  },

  completed: {
    title: { en: "Completed", fr: "Terminé" },
    text: {
      en:
        "Production of the data has been completed 	e.g. raw data that is not ongoing, completed model",
      fr:
        "La production des données a été terminée. C'est le cas par exemple pour des données brutes qui ne sont plus alimentées, ou encore pour un modèle terminé",
    },
  },
};

export const depthDirections = {
  heightPositive: { en: "Depth Positive", fr: "Profondeur positive" },
  depthPositive: { en: "Height Positive", fr: "Hauteur positive" },
};

export const metadataScopeCodes = {
  // Audiovisual: {
  //   title: { en: "Audiovisual", fr: "Audio - visuel" },
  //   text: {
  //     en: "A series of visual representations imparting an impression of motion when shown in succession.May or may not include sound.",
  //     fr: "Une série de représentations visuelles donnant une impression de mouvement lorsqu'elles sont présentées successivement. Peut inclure ou non du son.",
  //   },
  //   isoValue: "dataset",
  // },
  Book: {
    title: {
      en: "Book",
      fr: "Livre",
    },
    text: {
      en: "A medium for recording information in the form of writing or images, typically composed of many pages bound together and protected by a cover.",
      fr: "Support d'enregistrement d'informations sous forme d'écrits ou d'images, généralement composé de plusieurs pages reliées ensemble et protégées par une couverture.",
    },
    isoValue: "document",
  },
  // BookChapter: {
  //   title: {
  //     en: "Book Chapter",
  //     fr: "Chapitre du livre",
  //   },
  //   text: {
  //     en: "One of the main divisions of a book.",
  //     fr: "L'une des principales divisions d'un livre.",
  //   },
  //   isoValue: "document",
  // },
  // Collection: {
  //   title: {
  //     en: "Collection",
  //     fr: "Collection",
  //   },
  //   text: {
  //     en: "An aggregation of resources, which may encompass collections of one resourceType as well as those of mixed types.A collection is described as a group; its parts may also be separately described.",
  //     fr: "Agrégation de ressources, qui peut englober des collections d'un seul type de ressource ainsi que celles de types mixtes. Une collection est décrite comme un groupe ; ses parties peuvent également être décrites séparément.",
  //   },
  //   isoValue: "collection",
  // },
  // ComputationalNotebook: {
  //   title: {
  //     en: "Computational Notebook",
  //     fr: "Cahier informatique",
  //   },
  //   text: {
  //     en: "A virtual notebook environment used for literate programming.",
  //     fr: "Un environnement de bloc - notes virtuel utilisé pour la programmation compétente.",
  //   },
  //   isoValue: "document",
  // },
  // ConferencePaper: {
  //   title: {
  //     en: "Conference Paper",
  //     fr: "Papier de conférence",
  //   },
  //   text: {
  //     en: "Article that is written with the goal of being accepted to a conference.",
  //     fr: "Article rédigé dans le but d’être accepté à une conférence.",
  //   },
  //   isoValue: "document",
  // },
  // ConferenceProceeding: {
  //   title: {
  //     en: "Conference Proceeding",
  //     fr: "Procédure de conférence",
  //   },
  //   text: {
  //     en: "Collection of academic papers published in the context of an academic conference.",
  //     fr: "Recueil d'articles académiques publiés dans le cadre d'une conférence académique.",
  //   },
  //   isoValue: "document",
  // },
  DataCollectionSampling: {
    title: {
      en: "Data Collection (sampling)",
      fr: "Collecte de données (échantillonnage)",
    },
    text: {
      en: "sampling methods or protocols",
      fr: "méthodes ou protocoles d’échantillonnage",
    },
    isoValue: "collectionSession",
  },
  // DataPaper: {
  //   title: {
  //     en: "Data Paper",
  //     fr: "Document de données",
  //   },
  //   text: {
  //     en: "A factual and objective publication with a focused intent to identify and describe specific data, sets of data, or data collections to facilitate discoverability.",
  //     fr: "Une publication factuelle et objective dont l'intention ciblée est d'identifier et de décrire des données spécifiques, des ensembles de données ou des collections de données pour faciliter la découverte.",
  //   },
  //   isoValue: "document",
  // },
  Dataset: {
    title: {
      en: "Dataset",
      fr: "Base de données",
    },
    text: {
      en: "Data encoded in a defined structure.",
      fr: "Données codées dans une structure définie.",
    },
    isoValue: "dataset",
  },
  // Dissertation: {
  //   title: {
  //     en: "Dissertation",
  //     fr: "Thèse",
  //   },
  //   text: {
  //     en: "A written essay, treatise, or thesis, especially one written by a candidate for the degree of Doctor of Philosophy.",
  //     fr: "Un essai écrit, un traité ou une thèse, en particulier rédigé par un candidat au diplôme de docteur en philosophie.",
  //   },
  //   isoValue: "document",
  // },
  // Event: {
  //   title: {
  //     en: "Event",
  //     fr: "Événement",
  //   },
  //   text: {
  //     en: "A non - persistent, time - based occurrence.",
  //     fr: "Occurrence non persistante et temporelle.",
  //   },
  //   isoValue: "collectionSession",
  // },
  // Image: {
  //   title: {
  //     en: "Image",
  //     fr: "Image",
  //   },
  //   text: {
  //     en: "A visual representation other than text.",
  //     fr: "Une représentation visuelle autre que du texte.",
  //   },
  //   isoValue: "dataset",
  // },
  // Instrument: {
  //   title: {
  //     en: "Instrument",
  //     fr: "Instrument",
  //   },
  //   text: {
  //     en: "A device, tool or apparatus used to obtain, measure and / or analyze data.",
  //     fr: "Un dispositif, un outil ou un appareil utilisé pour obtenir, mesurer et / ou analyser des données.",
  //   },
  //   isoValue: "collectionHardware",
  // },
  // InteractiveResource: {
  //   title: {
  //     en: "Interactive Resource",
  //     fr: "Ressource interactive",
  //   },
  //   text: {
  //     en: "A resource requiring interaction from the user to be understood, executed, or experienced.",
  //     fr: "Une ressource nécessitant une interaction de la part de l'utilisateur pour être comprise, exécutée ou expérimentée.",
  //   },
  //   isoValue: "application",
  // },
  // Journal: {
  //   title: {
  //     en: "Journal",
  //     fr: "Journal",
  //   },
  //   text: {
  //     en: "A scholarly publication consisting of articles that is published regularly throughout the year.",
  //     fr: "Publication scientifique composée d'articles publiés régulièrement tout au long de l'année.",
  //   },
  //   isoValue: "document",
  // },
  // JournalArticle: {
  //   title: {
  //     en: "Journal Article",
  //     fr: "Article de revue",
  //   },
  //   text: {
  //     en: "A written composition on a topic of interest, which forms a separate part of a journal.",
  //     fr: "Une composition écrite sur un sujet d’intérêt, qui constitue une partie distincte d’un journal.",
  //   },
  //   isoValue: "document",
  // },
  Model: {
    title: {
      en: "Model",
      fr: "Modèle",
    },
    text: {
      en: "An abstract, conceptual, graphical, mathematical or visualization model that represents empirical objects, phenomena, or physical processes.",
      fr: "Modèle abstrait, conceptuel, graphique, mathématique ou de visualisation qui représente des objets empiriques, des phénomènes ou des processus physiques.",
    },
    isoValue: "model",
  },
  // OutputManagementPlan: {
  //   title: {
  //     en: "Output Management Plan",
  //     fr: "Plan de gestion des résultats",
  //   },
  //   text: {
  //     en: "A formal document that outlines how research outputs are to be handled both during a research project and after the project is completed.",
  //     fr: "Un document formel qui décrit la manière dont les résultats de la recherche doivent être traités à la fois pendant un projet de recherche et une fois le projet terminé.",
  //   },
  //   isoValue: "document",
  // },
  // PeerReview: {
  //   title: {
  //     en: "Peer Review",
  //     fr: "Examen par les pairs",
  //   },
  //   text: {
  //     en: "Evaluation of scientific, academic, or professional work by others working in the same field.",
  //     fr: "Évaluation des travaux scientifiques, académiques ou professionnels par d'autres personnes travaillant dans le même domaine.",
  //   },
  //   isoValue: "document",
  // },
  // PhysicalObject: {
  //   title: {
  //     en: "Physical Object",
  //     fr: "Objet physique",
  //   },
  //   text: {
  //     en: "A physical object or substance.",
  //     fr: "Un objet ou une substance physique.",
  //   },
  //   isoValue: "sample",
  // },
  Preprint: {
    title: {
      en: "Preprint",
      fr: "Préimpression",
    },
    text: {
      en: "A version of a scholarly or scientific paper that precedes formal peer review and publication in a peer - reviewed scholarly or scientific journal.",
      fr: "Version d'un article scientifique ou scientifique qui précède l'examen formel par les pairs et la publication dans une revue universitaire ou scientifique à comité de lecture.",
    },
    isoValue: "document",
  },
  Report: {
    title: {
      en: "Report",
      fr: "Rapport",
    },
    text: {
      en: "A document that presents information in an organized format for a specific audience and purpose.",
      fr: "Un document qui présente des informations dans un format organisé pour un public et un objectif spécifiques.",
    },
    isoValue: "document",
  },
  // Service: {
  //   title: {
  //     en: "Service",
  //     fr: "Service",
  //   },
  //   text: {
  //     en: "An organized system of apparatus, appliances, staff, etc., for supplying some function (s) required by end users.",
  //     fr: "Un système organisé d'appareils, d'appareils, de personnel, etc., pour fournir certaines fonctions requises par les utilisateurs finaux.",
  //   },
  //   isoValue: "service",
  // },
  Software: {
    title: {
      en: "Software",
      fr: "Logiciel",
    },
    text: {
      en: "A computer program other than a computational notebook, in either source code(text) or compiled form.Use this type for general software components supporting scholarly research.Use the “ComputationalNotebook” value for virtual notebooks.",
      fr: "Un programme informatique autre qu'un cahier de calcul, sous forme de code source (texte) ou sous forme compilée. Utilisez ce type pour les composants logiciels généraux prenant en charge la recherche scientifique. Utilisez la valeur « ComputationalNotebook » pour les blocs-notes virtuels.",
    },
    isoValue: "software",
  },
  // Sound: {
  //   title: {
  //     en: "Sound",
  //     fr: "Son",
  //   },
  //   text: {
  //     en: "A resource primarily intended to be heard.",
  //     fr: "Une ressource avant tout destinée à être entendue.",
  //   },
  //   isoValue: "dataset",
  // },
  // Standard: {
  //   title: {
  //     en: "Standard",
  //     fr: "Standard",
  //   },
  //   text: {
  //     en: "Something established by authority, custom, or general consent as a model, example, or point of reference.",
  //     fr: "Quelque chose établi par l'autorité, la coutume ou le consentement général comme modèle, exemple ou point de référence.",
  //   },
  //   isoValue: "document",
  // },
  // StudyRegistration: {
  //   title: {
  //     en: "Study Registration",
  //     fr: "Inscription aux études",
  //   },
  //   text: {
  //     en: "A detailed, time - stamped description of a research plan, often openly shared in a registry or published in a journal before the study is conducted to lend accountability and transparency in the hypothesis generating and testing process.",
  //     fr: "Description détaillée et horodatée d'un plan de recherche, souvent ouvertement partagée dans un registre ou publiée dans une revue avant que l'étude ne soit menée pour garantir la responsabilité et la transparence dans le processus de génération et de test des hypothèses.",
  //   },
  //   isoValue: "document",
  // },
  Text: {
    title: {
      en: "Text",
      fr: "Texte",
    },
    text: {
      en: "A resource consisting primarily of words for reading that is not covered by any other textual resource type in this list.",
      fr: "Une ressource composée principalement de mots à lire qui n'est couverte par aucun autre type de ressource textuelle de cette liste.",
    },
    isoValue: "document",
  },
  // Workflow: {
  //   title: {
  //     en: "Workflow",
  //     fr: "Flux de travail",
  //   },
  //   text: {
  //     en: "A structured series of steps which can be executed to produce a final outcome, allowing users a means to specify and enact their work in a more reproducible manner.",
  //     fr: "Une série structurée d'étapes qui peuvent être exécutées pour produire un résultat final, permettant aux utilisateurs de spécifier et de mettre en œuvre leur travail de manière plus reproductible.",
  //   },
  //   isoValue: "document",
  // },
  Other: {
    title: {
      en: "Other",
      fr: "Autre",
    },
    text: {
      en: "other",
      fr: "autre",
    },
    isoValue: "dataset",
  },
};

export const associationTypeCode = {
  IsCitedBy: {
    title: { en: "Is Cited By", fr: "Est cité par" },
    text: {
      en: "A is cited by B", fr: "A est cité par B",
    },
    isoValue: "crossReference",
  },
  Cites: {
    title: { en: "Cites", fr: "Cites" },
    text: {
      en: "A cites B", fr: "A cite B",
    },
    isoValue: "crossReference",
  },
  IsSupplementTo: {
    title: { en: "Is Supplement To", fr: "Est un supplément à" },
    text: {
      en: "A is supplement to B", fr: "A est un complément à B",
    },
    isoValue: "crossReference",
  },
  IsSupplementedBy: {
    title: { en: "Is Supplemented By", fr: "Est complété par" },
    text: {
      en: "A is supplemented by B", fr: "A est complété par B",
    },
    isoValue: "crossReference",
  },
  IsContinuedBy: {
    title: { en: "Is Continued By", fr: "Est continué par" },
    text: {
      en: "A is continued by B", fr: "A est continué par B",
    },
    isoValue: "series",
  },
  Continues: {
    title: { en: "Continues", fr: "Continue" },
    text: {
      en: "A continues B", fr: "A continue B",
    },
    isoValue: "series",
  },
  IsDescribedBy: {
    title: { en: "Is Described By", fr: "Est décrit par" },
    text: {
      en: "A is described by B", fr: "A est décrit par B",
    },
    isoValue: "crossReference",
  },
  Describes: {
    title: { en: "Describes", fr: "Décrit" },
    text: {
      en: "A describes B", fr: "A décrit B",
    },
    isoValue: "crossReference",
  },
  HasMetadata: {
    title: { en: "Has Metadata", fr: "Possède des métadonnées" },
    text: {
      en: "A has metadata B", fr: "A a des métadonnées B",
    },
    isoValue: "crossReference",
  },
  IsMetadataFor: {
    title: { en: "Is Metadata For", fr: "Les métadonnées sont-elles destinées" },
    text: {
      en: "A is metadata for B", fr: "A est une métadonnée pour B",
    },
    isoValue: "crossReference",
  },
  HasVersion: {
    title: { en: "Has Version", fr: "A une version" },
    text: {
      en: "A has version B", fr: "A a la version B",
    },
    isoValue: "revisionOf",
  },
  IsVersionOf: {
    title: { en: "Is Version Of", fr: "Est la version de" },
    text: {
      en: "A is version of B", fr: "A est la version de B",
    },
    isoValue: "revisionOf",
  },
  IsNewVersionOf: {
    title: { en: "Is New Version Of", fr: "Est-ce une nouvelle version de" },
    text: {
      en: "A is new version of B", fr: "A est une nouvelle version de B",
    },
    isoValue: "revisionOf",
  },
  PreviousVersionOf: {
    title: { en: "Previous Version Of", fr: "Version précédente de" },
    text: {
      en: "A is previous version of B", fr: "A est la version précédente de B",
    },
    isoValue: "crossReference",
  },
  IsPartOf: {
    title: { en: "Is Part Of", fr: "Fait partie de" },
    text: {
      en: "A is part of B", fr: "A fait partie de B",
    },
    isoValue: "largerWorkCitation",
  },
  HasPart: {
    title: { en: "Has Part", fr: "A une partie" },
    text: {
      en: "A has part B", fr: "A a la partie B",
    },
    isoValue: "isComposedOf",
  },
  IsPublishedIn: {
    title: { en: "Is Published In", fr: "Est publié dans" },
    text: {
      en: "A is published in B", fr: "A est publié dans B",
    },
    isoValue: "largerWorkCitation",
  },
  IsReferencedBy: {
    title: { en: "Is Referenced By", fr: "Est référencé par" },
    text: {
      en: "A is referenced by B", fr: "A est référencé par B",
    },
    isoValue: "crossReference",
  },
  References: {
    title: { en: "References", fr: "Les références" },
    text: {
      en: "A references B", fr: "A références B",
    },
    isoValue: "crossReference",
  },
  IsDocumentedBy: {
    title: { en: "Is Documented By", fr: "Est documenté par" },
    text: {
      en: "A is documented by B", fr: "A est documenté par B",
    },
    isoValue: "crossReference",
  },
  Documents: {
    title: { en: "Documents", fr: "Documents" },
    text: {
      en: "A documents B", fr: "Un document B",
    },
    isoValue: "crossReference",
  },
  IsCompiledBy: {
    title: { en: "Is Compiled By", fr: "Est compilé par" },
    text: {
      en: "A is compiled by B", fr: "A est compilé par B",
    },
    isoValue: "dependency",
  },
  Compiles: {
    title: { en: "Compiles", fr: "Compile" },
    text: {
      en: "A compiles B", fr: "A compile B",
    },
    isoValue: "dependency",
  },
  IsVariantFormOf: {
    title: { en: "Is Variant Form Of", fr: "Est une forme variante de" },
    text: {
      en: "A is variant form of B", fr: "A est une variante de B",
    },
    isoValue: "crossReference",
  },
  IsOriginalFormOf: {
    title: { en: "Is Original Form Of", fr: "Est la forme originale de" },
    text: {
      en: "A is original form of B", fr: "A est la forme originale de B",
    },
    isoValue: "crossReference",
  },
  IsIdenticalTo: {
    title: { en: "Is Identical To", fr: "Est identique à" },
    text: {
      en: "A is identical to B", fr: "A est identique à B",
    },
    isoValue: "crossReference",
  },
  IsReviewedBy: {
    title: { en: "Is Reviewed By", fr: "Est révisé par" },
    text: {
      en: "A is reviewed by B", fr: "A est examiné par B",
    },
    isoValue: "crossReference",
  },
  Reviews: {
    title: { en: "Reviews", fr: "Commentaires" },
    text: {
      en: "A reviews B", fr: "A avis B",
    },
    isoValue: "crossReference",
  },
  IsDerivedFrom: {
    title: { en: "Is Derived From", fr: "Dérive de" },
    text: {
      en: "A is derived from B", fr: "A est dérivé de B",
    },
    isoValue: "dependency",
  },
  IsSourceOf: {
    title: { en: "Is Source Of", fr: "Est la source de" },
    text: {
      en: "A is source of B", fr: "A est la source de B",
    },
    isoValue: "dependency",
  },
  Requires: {
    title: { en: "Requires", fr: "A besoin" },
    text: {
      en: "A requires B", fr: "A nécessite B",
    },
    isoValue: "dependency",
  },
  IsRequiredBy: {
    title: { en: "Is Required By", fr: "Est requis par" },
    text: {
      en: "A is required by B", fr: "A est requis par B",
    },
    isoValue: "dependency",
  },
  IsObsoletedBy: {
    title: { en: "Is Obsoleted By", fr: "Est obsolète par" },
    text: {
      en: "A is obsoleted by B", fr: "A est obsolète par B",
    },
    isoValue: "crossReference",
  },
  Obsoletes: {
    title: { en: "Obsoletes", fr: "Obsolètes" },
    text: {
      en: "A obsoletes B", fr: "A rend obsolète B",
    },
    isoValue: "revisionOf",
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

