import { field } from "../annotations";

/** Fields on the Contacts tab. */
export const contactsProperties = {
  contacts: field({
    en: {
      title: "Contacts",
      description:
        "People and organizations associated with the dataset. Every contact needs a role and a name; at least one must be a Metadata Custodian, at least one a Data Owner, and at least one must appear in the citation.",
    },
    fr: {
      title: "Contacts",
      description:
        "Personnes et organismes associés au jeu de données. Chaque contact doit avoir un rôle et un nom.",
    },
    tab: "contacts",
    error: {
      en:
        "Every contact must have at least one role checked, and 'Data Owner' or 'Metadata Custodian' must be added to at least one contact. One contact can occupy multiple roles. Email addresses must be in the form of user@example.com and URLs must be valid.  At least one contact must be selected to appear in the citation.",
      fr:
        "Chaque contact doit avoir au moins un rôle coché, et « Propriétaire des données » ou « Dépositaire des métadonnées » doit être ajouté à au moins un contact. Un contact peut occuper plusieurs rôles. Les adresses e-mail doivent être au format user@example.com et les URL doivent être valides. Au moins un contact doit être sélectionné pour apparaître dans la citation.",
    },
    schema: {
      type: "array",
      items: { $ref: "#/definitions/contact" },
    },
  }),
};

export default contactsProperties;
