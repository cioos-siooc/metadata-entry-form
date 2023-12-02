import React from "react";

import { Paper } from "@material-ui/core";

import Resources from "../FormComponents/Resources";
import { En, Fr, I18n } from "../I18n";
import RequiredMark from "../FormComponents/RequiredMark";
import {
  paperClass,
  QuestionText,
  SupplementalText,
} from "../FormComponents/QuestionStyles";
import { validateField } from "../../utils/validate";

const ResourcesTab = ({ disabled, record, updateRecord }) => {
  const updateResources = updateRecord("distribution");
  return (
    <div>
      <Paper style={paperClass}>
        <QuestionText>
          <En>Enter any links to data or datasets described by this metadata record.
            Resources should not already have their own identifiers, such resources
            are better added to the 'Related Works' section. </En>
          <Fr>
            Saisissez tous les liens vers des données ou des ensembles de données
            décrits par cet enregistrement de métadonnées. Les ressources ne doivent
            pas déjà avoir leurs propres identifiants, il est préférable que ces
            ressources soient ajoutées à la section "Travaux associés".
          </Fr>
          <RequiredMark passes={validateField(record, "distribution")} />
          <SupplementalText>
            <I18n>
              <En>
                Some examples of resources are:
                <ul>
                  <li>supporting documentation (eg text or pdf files)</li>
                  <li>CSV files</li>
                  <li>ERDDAP datasets</li>
                  <li>images</li>
                  <li>Online forms to request access to the data</li>
                </ul>
                At least one item is required. A Resource URL can link to a
                (compressed) data package or folder.
              </En>
              <Fr>
                Voici quelques exemples de ressources :
                <ul>
                  <li>documentation à l'appui (par exemple, fichiers texte ou PDF)</li>
                  <li>Fichiers CSV</li>
                  <li>Ensembles de données ERDDAP</li>
                  <li>images</li>
                  <li>Formulaires en ligne pour demander l'accès aux données</li>
                </ul>
                Au moins un élément est requis. Une URL de ressource peut créer un lien vers un
                paquet ou dossier de données (compressé).
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>
      </Paper>
      <Resources
        paperClass={paperClass}
        resources={record.distribution || []}
        updateResources={updateResources}
        disabled={disabled}
      />
    </div>
  );
};

export default ResourcesTab;
