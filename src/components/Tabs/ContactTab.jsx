import React, { useContext, useState } from "react";
import FormSection from "../FormShell/FormSection";

import { useParams } from "react-router-dom";

import { Box, Stack } from "@mui/material";
import BookmarkAddOutlined from "@mui/icons-material/BookmarkAddOutlined";
import DragIndicator from "@mui/icons-material/DragIndicator";

import EditContact from "../FormComponents/ContactEditor";

import FormField from "../FormShell/FormField";

import { En, Fr, I18n } from "../I18n";
import { validateField, contactIsComplete } from "../../utils/validate";
import { roleCodes } from "../../isoCodeLists";
import { deepCopy } from "../../utils/misc";

import Alert from "@mui/material/Alert";
import { ApaPreview } from "../FormComponents/ApaPreview";

import regions from "../../regions";
import ItemCards from "../FormComponents/ItemCards";
import SavedItemSelect from "../FormComponents/SavedItemSelect";
import { UserContext } from "../../providers/UserProvider";
import ContactTitle from "../FormComponents/ContactTitle";
import { getBlankContact } from "../../utils/blankRecord";

// The row's second line: the contact's roles, and whether it's cited.
function contactSummary(contact, language) {
  const roles =
    (contact.role || [])
      .map((r) => roleCodes[r]?.title?.[language] || r)
      .join(", ") ||
    (language === "fr" ? "Aucun rôle choisi" : "No role chosen yet");
  const cited = contact.inCitation
    ? language === "fr"
      ? "Dans la citation"
      : "In the citation"
    : "";
  return [roles, cited].filter(Boolean).join(" · ");
}

const ContactTab = ({
  disabled,
  record,
  userContacts,
  updateRecord,
  saveToContacts,
}) => {
  const { language, region } = useParams();
  const { contacts = [] } = record;
  const { user } = useContext(UserContext);

  const updateContacts = updateRecord("contacts");

  // The open contact, or null when every row is folded.
  const [activeContact, setActiveContact] = useState(null);

  // Instead of updating record.<item> we are
  // updating record.contacts[activeContact].<item>
  function updateContactEvent(key) {
    return (e) => {
      const newContacts = [...contacts];
      newContacts[activeContact][key] = e.target.value;
      updateContacts(newContacts);
    };
  }

  function updateContact(key) {
    return (value) => {
      const newContacts = [...contacts];
      newContacts[activeContact][key] = value;
      updateContacts(newContacts);
    };
  }

  function updateOrgFromRor(payload) {
    const newContacts = [...contacts];
    newContacts[activeContact].orgRor = payload.id;
    newContacts[activeContact].orgName =
      payload.names.find((n) => n.lang === language)?.value || "";
    newContacts[activeContact].orgURL =
      payload.links.find((l) => l.type === "website")?.value || "";
    newContacts[activeContact].orgCity =
      payload.locations.find(() => true)?.geonames_details?.name || "";
    newContacts[activeContact].orgCountry =
      payload.locations.find(() => true)?.geonames_details?.country_name || "";
    updateContacts(newContacts);
  }

  function updateIndFromOrcid(payload) {
    const { name, emails } = payload.person;
    const indEmail = emails.email.length > 0 ? emails.email[0].email : "";
    const lastName = name["family-name"] ? name["family-name"].value : "";

    const newContacts = [...contacts];
    newContacts[activeContact].indOrcid = payload["orcid-identifier"].uri;
    newContacts[activeContact].givenNames = name["given-names"].value;
    newContacts[activeContact].indEmail = indEmail;
    newContacts[activeContact].lastName = lastName;
    updateContacts(newContacts);
  }

  function updateIndFromAccount() {
    // ponytail: splits the account display name at the last space; users fix
    // multi-word surnames by hand. Accounts don't carry an ORCID iD.
    const name = user?.displayName?.includes("@") ? "" : user?.displayName;
    const cut = name?.lastIndexOf(" ") ?? -1;
    const newContacts = [...contacts];
    newContacts[activeContact].givenNames = cut > 0 ? name.slice(0, cut) : "";
    newContacts[activeContact].lastName = cut > 0 ? name.slice(cut + 1) : "";
    newContacts[activeContact].indEmail = user?.email || "";
    updateContacts(newContacts);
  }

  const showApaBox =
    record.title?.[language] &&
    contacts.length > 0 &&
    record.created &&
    record.contacts?.some((c) => c.inCitation);

  const contact = contacts[activeContact];
  return (
    <Stack spacing={2}>
      {/* What the contacts add up to comes first: the citation. */}
      {showApaBox && (
        <FormSection
          title={<I18n en="Citation preview" fr="Aperçu de la citation" />}
          description={
            <I18n>
              <En>
                This is how your record citation will look in the catalogue.
                Only contacts marked as part of the citation appear. To change
                the order, drag the{" "}
                <DragIndicator
                  fontSize="inherit"
                  sx={{ verticalAlign: "middle" }}
                />{" "}
                handle in the contact list.
              </En>
              <Fr>
                Voici à quoi ressemblera votre citation dans le catalogue. Seuls
                les contacts identifiés comme faisant partie de la citation y
                figurent. Pour changer l'ordre, faites glisser la poignée{" "}
                <DragIndicator
                  fontSize="inherit"
                  sx={{ verticalAlign: "middle" }}
                />{" "}
                dans la liste des contacts.
              </Fr>
            </I18n>
          }
        >
          <ApaPreview language={language} record={record} />
        </FormSection>
      )}
      <FormSection title={<I18n en="Contacts" fr="Contacts" />}>
        <FormField
          id="field-contacts"
          label={
            <I18n
              en="People and organizations"
              fr="Personnes et organisations"
            />
          }
          required
          complete={validateField(record, "contacts")}
          hint={
            <I18n>
              <En>
                At least one Metadata custodian <b>and</b> one Data owner, and
                at least one contact in the citation. One contact can hold
                several roles.
              </En>
              <Fr>
                Au moins un dépositaire des métadonnées <b>et</b> un
                propriétaire des données, et au moins un contact dans la
                citation. Un contact peut occuper plusieurs rôles.
              </Fr>
            </I18n>
          }
          guidance={
            <I18n>
              <En>
                <p>
                  Please enter at least one Metadata Custodian <b>and</b> one
                  Data Owner for this dataset that can work with{" "}
                  {regions[region].title[language]} Staff to finalize this
                  Metadata Record. You also must select at least one contact to
                  appear in the citation.
                </p>
                <p>
                  It is important to include all individuals from the chain of
                  attribution to ensure all involved parties are credited
                  appropriately for their role in creating this dataset. To
                  reuse a contact you saved before, search for it under the
                  list.
                </p>
              </En>
              <Fr>
                <p>
                  Veuillez saisir au moins un dépositaire des métadonnées{" "}
                  <b>et</b> un propriétaire des données. Ces personnes
                  pourraient être appelées à collaborer avec le personnel{" "}
                  {regions[region].titleFrPossessive} pour finaliser la saisie
                  des informations. Vous devez également sélectionner au moins
                  un contact qui apparaîtra dans la citation.
                </p>
                <p>
                  Il est important d'inclure toutes les personnes ayant
                  travaillé sur le jeu de données afin de s'assurer que toutes
                  les parties concernées soient créditées de façon appropriée
                  pour leur rôle dans la création de ce jeu de données. Pour
                  réutiliser un contact enregistré, recherchez-le sous la liste.
                </p>
              </Fr>
            </I18n>
          }
        >
          {!contacts.some((c) => c.role?.includes("publisher")) && (
            <Alert severity="info" sx={{ mt: 0.5 }}>
              <I18n>
                <En>
                  No contact has the <strong>publisher</strong> role. The region
                  default (<strong>{regions[region]?.title?.[language]}</strong>
                  ) will be used as publisher for DOI records.
                </En>
                <Fr>
                  Aucun contact n'a le rôle d'<strong>éditeur</strong>. La
                  valeur par défaut de la région (
                  <strong>{regions[region]?.title?.[language]}</strong>) sera
                  utilisée comme éditeur pour les enregistrements DOI.
                </Fr>
              </I18n>
            </Alert>
          )}
          <Box sx={{ mt: 2 }}>
            <ItemCards
              items={contacts}
              updateItems={updateContacts}
              openIndex={activeContact}
              setOpenIndex={setActiveContact}
              disabled={disabled}
              idPrefix="contact"
              itemNoun={{ en: "contact", fr: "contact" }}
              ariaLabel={
                language === "fr"
                  ? "Contacts dans cet enregistrement"
                  : "Contacts in this record"
              }
              itemTitle={ContactTitle}
              itemMeta={(c) => contactSummary(c, language)}
              isComplete={contactIsComplete}
              getBlankItem={getBlankContact}
              duplicateItem={(copy) => {
                const field = ["lastName", "orgName"].find((f) => copy[f]);
                if (field)
                  copy[field] += language === "fr" ? " (copie)" : " (copy)";
                return copy;
              }}
              menuItems={(c) => [
                {
                  key: "save",
                  label:
                    language === "fr"
                      ? "Enregistrer dans mes contacts"
                      : "Save to my contacts",
                  icon: BookmarkAddOutlined,
                  disabled: !(c.orgName || c.givenNames || c.lastName),
                  onClick: () => {
                    // The role belongs to this record, not the saved contact.
                    const { role, ...toSave } = deepCopy(c);
                    saveToContacts(toSave);
                  },
                },
              ]}
              addLabel={<I18n en="Add contact" fr="Ajouter un contact" />}
              emptyText={
                <I18n
                  en="No contacts yet. Add one, or pick from the contacts you've saved."
                  fr="Aucun contact pour l'instant. Ajoutez-en un ou choisissez parmi vos contacts enregistrés."
                />
              }
              footer={(addItem) => (
                <SavedItemSelect
                  savedItems={userContacts}
                  itemTitle={ContactTitle}
                  getBlankItem={getBlankContact}
                  onAdd={addItem}
                  disabled={disabled}
                  ariaLabel={
                    language === "fr"
                      ? "Rechercher un contact enregistré"
                      : "Search saved contacts"
                  }
                />
              )}
              renderEditor={() => (
                <EditContact
                  showRolePicker
                  showTitle={false}
                  value={contact}
                  handleClear={(key) => updateContact(key)("")}
                  updateContactEvent={(key) => updateContactEvent(key)}
                  updateContact={(key) => updateContact(key)}
                  updateContactRor={(payload) =>
                    updateOrgFromRor(payload, language)
                  }
                  updateContactOrcid={(payload) => updateIndFromOrcid(payload)}
                  updateContactFromAccount={user && updateIndFromAccount}
                  disabled={disabled}
                  language={language}
                />
              )}
            />
          </Box>
        </FormField>
      </FormSection>
    </Stack>
  );
};

export default ContactTab;
