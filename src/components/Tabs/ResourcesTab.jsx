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
          <En>Enter any links to information associated with this dataset.</En>
          <Fr>
            Entrez les liens vers les informations associées à ce jeu de
            données.
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
                </ul>
                At least one item is required. A Resource URL can link to a (compressed) data package or folder.
              </En>
              <Fr>
                Voici quelques exemples de ressources :
                <ul>
                  <li>
                    Documentation à l'appui (par exemple, fichiers texte ou pdf)
                  </li>
                  <li>Fichiers CSV</li>
                  <li>Jeux de données ERDDAP</li>
                  <li>Images</li>
                </ul>
                Au moins une ressource est requise. Une URL de ressource peut être liée à un paquet de données (compressé) ou à un dossier.
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
