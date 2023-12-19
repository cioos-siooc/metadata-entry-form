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
          <En>Enter one or more links to the primary resource described by this
            metadata record. Resources added here should not already have their
            own metadata record or digital object identifier, such resources
            should be added to the "Related Works" section. </En>
          <Fr>
            Entrez un ou plusieurs liens vers la ressource principale décrite par
            cet enregistrement de métadonnées. Les ressources ajoutées ici ne
            doivent pas déjà avoir leur propre enregistrement de métadonnées ou
            identifiant d'objet numérique, ces ressources doivent être ajoutées à
            la section "Travaux associés".
          </Fr>
          <RequiredMark passes={validateField(record, "distribution")} />
          <SupplementalText>
            <I18n>
              <En>
                Some examples of resources are:
                <ul>
                  <li>Protocols or methods documents</li>
                  <li>CSV files</li>
                  <li>ERDDAP datasets</li>
                  <li>Images</li>
                  <li>Online forms to request access to the data</li>
                </ul>
                A Resource URL that links to a compressed data package or folder is
                preferred. Otherwise, list primary resource first followed by
                supporting resources.
              </En>
              <Fr>
                Voici quelques exemples de ressources :
                <ul>
                  <li>Documents de protocoles ou de méthodes</li>
                  <li>Fichiers CSV</li>
                  <li>Ensembles de données ERDDAP</li>
                  <li>Images</li>
                  <li>Formulaires en ligne pour demander l'accès aux données</li>
                </ul>
                Une URL de ressource qui renvoie à un package ou un dossier de données
                compressées est préférable. Sinon, répertoriez d'abord la ressource
                principale, suivie des ressources de support.
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
