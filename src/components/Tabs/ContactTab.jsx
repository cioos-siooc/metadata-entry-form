import React, { useState } from "react";

import { useParams } from "react-router-dom";

import { Paper, Grid } from "@material-ui/core";
import DragHandleIcon from "@material-ui/icons/DragHandle";

import EditContact from "../FormComponents/ContactEditor";
import ContactLeftList from "../FormComponents/ContactLeftList";

import {
  QuestionText,
  SupplementalText,
  paperClass,
} from "../FormComponents/QuestionStyles";

import { En, Fr, I18n } from "../I18n";
import RequiredMark from "../FormComponents/RequiredMark";
import { validateField } from "../../utils/validate";

import ApaPreview from "../FormComponents/ApaPreview";

import regions from "../../regions";

const ContactTab = ({ disabled, record, userContacts, updateRecord }) => {
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

  const showApaBox =
    record.title?.[language] && contacts.length && record.created;

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
                Metadata Record.
              </En>
              <Fr>
                Veuillez saisir au moins un Dépositaire des métadonnées ET un
                propriétaire des données de ce jeu. Ces personnes pourraient
                être appelées à collaborer avec le personnel de la{" "}
                {regions[region].title[language]} pour finaliser la saisie des
                informations.
              </Fr>
            </I18n>
            <RequiredMark passes={validateField(record, "contacts")} />
            <SupplementalText>
              <I18n>
                <En>
                  It is important to include all individuals from the chain of
                  attribution to ensure all involved parties are credited
                  appropriately for their role in creating this dataset Saved
                  contacts can be selected from the list below If you have any
                  saved contacts you can select them from the list.
                </En>
                <Fr>
                  Il est important d'inclure toutes les personnes ayant
                  travaillé sur le jeu de données afin de s'assurer que toutes
                  les parties concernées soient créditées de façon appropriée
                  pour leur rôle dans la création de ce jeu de données. Les
                  contacts sauvegardés peuvent être sélectionnés dans la liste
                  ci-dessous. Si vous avez déjà des contacts enregistrés, vous
                  pouvez les sélectionner dans la liste.
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
                  Only with starred roles will appear in the citation. To change
                  the order, drag the{" "}
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
          <ContactLeftList
            contacts={contacts}
            updateContacts={updateContacts}
            setActiveContact={setActiveContact}
            activeContact={activeContact}
            disabled={disabled}
            userContacts={userContacts}
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
                      updateContactEvent={updateContactEvent}
                      updateContact={updateContact}
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
