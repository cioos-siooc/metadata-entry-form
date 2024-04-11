import React, { useState } from "react";

import { useParams } from "react-router-dom";

import { Paper, Grid } from "@material-ui/core";
import DragHandleIcon from "@material-ui/icons/DragHandle";

import EditContact from "../FormComponents/ContactEditor";

import {
  QuestionText,
  SupplementalText,
  paperClass,
} from "../FormComponents/QuestionStyles";

import { En, Fr, I18n } from "../I18n";
import RequiredMark from "../FormComponents/RequiredMark";
import { validateField } from "../../utils/validate";

import { ApaPreview } from "../FormComponents/ApaPreview";

import regions from "../../regions";
import LeftList from "../FormComponents/LeftList";

const ContactTab = ({
  disabled,
  record,
  userContacts,
  updateRecord,
  saveToContacts,
}) => {
  const { language, region } = useParams();
  const { contacts = [] } = record;

  const updateContacts = updateRecord("contacts");

  const [activeContact, setActiveContact] = useState(0);

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
    newContacts[activeContact].orgName = payload.name;
    newContacts[activeContact].orgURL = payload.links.find(() => true) || "";
    newContacts[activeContact].orgCity =
      payload.addresses.find(() => true).city || "";
    newContacts[activeContact].orgCountry = payload.country.country_name;
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

  const showApaBox =
    record.title?.[language] &&
    contacts.length &&
    record.created &&
    record.contacts?.some((c) => c.inCitation);

  const contact = contacts[activeContact];
  return (
    <Grid container spacing={3}>
      <Paper style={paperClass}>
        <Grid item xs>
          <QuestionText>
            <I18n>
              <En>
                Please enter at least one Metadata Custodian <b>and</b> one Data
                Owner for this dataset that can work with{" "}
                {regions[region].title[language]} Staff to finalize this
                Metadata Record. You also must select at least one contact to
                appear in the citation. One contact can occupy multiple roles.
              </En>
              <Fr>
                Veuillez saisir au moins un Dépositaire des métadonnées ET un
                propriétaire des données de ce jeu. Ces personnes pourraient
                être appelées à collaborer avec le personnel
                {regions[region].titleFrPossessive} pour finaliser la saisie des
                informations. Vous devez également sélectionner au moins un
                contact pour apparaître dans la citation. Un contact peut occuper plusieurs rôles.
              </Fr>
            </I18n>
            <RequiredMark passes={validateField(record, "contacts")} />
            <SupplementalText>
              <I18n>
                <En>
                  It is important to include all individuals from the chain of
                  attribution to ensure all involved parties are credited
                  appropriately for their role in creating this dataset. Saved
                  contacts can be selected from the list below.
                </En>
                <Fr>
                  Il est important d'inclure toutes les personnes ayant
                  travaillé sur le jeu de données afin de s'assurer que toutes
                  les parties concernées soient créditées de façon appropriée
                  pour leur rôle dans la création de ce jeu de données. Les
                  contacts sauvegardés peuvent être sélectionnés dans la liste
                  ci-dessous.
                </Fr>
              </I18n>
            </SupplementalText>
          </QuestionText>
        </Grid>
      </Paper>
      {showApaBox && (
        <Paper style={paperClass}>
          <QuestionText>
            <div>
              <I18n>
                <En>
                  This is how your record citation will look in the catalogue.
                  To change the citation order, drag the{" "}
                  <DragHandleIcon style={{ verticalAlign: "middle" }} /> symbol.
                </En>
                <Fr>
                  Voici à quoi ressemblera votre citation dans le catalogue.
                  Seuls les contacts dont la case «Auteur cité» est cochée
                  apparaissent. Seuls les rôles étoilés apparaîtront dans la
                  citation. Changer la commande, faites glisser le{" "}
                  <DragHandleIcon style={{ verticalAlign: "middle" }} />.
                </Fr>
              </I18n>
            </div>
          </QuestionText>
          <SupplementalText>
            <ApaPreview language={language} record={record} />
          </SupplementalText>
        </Paper>
      )}

      <Grid container direction="row" style={{ marginLeft: "5px" }}>
        <Grid item xs={5}>
          <LeftList
            itemType="contact"
            items={contacts}
            updateItems={updateContacts}
            setActiveItem={setActiveContact}
            activeItem={activeContact}
            disabled={disabled}
            savedUserItems={userContacts}
            saveItem={saveToContacts}
          />
        </Grid>
        {contact && (
          <Grid item xs>
            <Grid container direction="column">
              <Paper style={paperClass}>
                <Grid container direction="column" spacing={3}>
                  <Grid item xs>
                    <EditContact
                      showRolePicker
                      value={contact}
                      handleClear={(key) => updateContact(key)("")}
                      updateContactEvent={(key) => updateContactEvent(key)}
                      updateContact={(key) => updateContact(key)}
                      updateContactRor={(payload) => updateOrgFromRor(payload)}
                      updateContactOrcid={(payload) => updateIndFromOrcid(payload)}
                      disabled={disabled}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};

export default ContactTab;
