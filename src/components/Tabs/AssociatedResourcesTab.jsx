import React from "react";

import { Paper } from "@material-ui/core";

import AssociatedResources from "../FormComponents/AssociatedResources";
import { En, Fr, I18n } from "../I18n";
import RequiredMark from "../FormComponents/RequiredMark";
import {
  paperClass,
  QuestionText,
  SupplementalText,
} from "../FormComponents/QuestionStyles";
import { validateField } from "../../utils/validate";

const AssociatedResourcesTab = ({ disabled, record, updateRecord }) => {
  const updateResources = updateRecord("associated_resources");
  return (
    <div>
      <Paper style={paperClass}>
        <QuestionText>
          <En>Enter any links to other related metadata records that are associated with this dataset.</En>
          <Fr>
            Entrez les liens vers les informations associées à ce jeu de
            données.
          </Fr>
          <RequiredMark passes={validateField(record, "associated_resources")} />
          <SupplementalText>
            <I18n>
              <En>
                Related metadata records are:
                <ul>
                  <li>Other datasets within CIOOS, hosted on the same catalogue or a different one</li>
                  <li>Metadata records on other catalogues such as OBIS or FRDR</li>
                </ul>

                Some of the ways a record can be related are:
                <ul>
                  <li>Cross Reference - Reference from one dataset to another.	Use to identify related documents or related resources</li>
                  <li>Dependency - Associated through a dependency</li>
                  <li>Is Composed Of/Larger Work Citation - Reference to record that are parts of this resource or which this one is a part of</li>
                  <li>Revision Of - Resource is a revision of associated record</li>
                </ul>
              </En>
              <Fr>
                Les enregistrements de métadonnées associés sont:
                <ul>
                  <li>Autres ensembles de données au sein de CIOOS, hébergés sur le même catalogue ou sur un autre</li>
                  <li>Enregistrements de métadonnées sur d'autres catalogues tels que OBIS ou FRDR</li>
                </ul>

                Voici quelques façons de relier un enregistrement:
                <ul>
                  <li>Référence croisée - référence d'un ensemble de données à un autre. À utiliser pour identifier des documents ou des ressources associés</li>
                  <li>Dépendance - Associé via une dépendance</li>
                  <li>Est composé de/Citation de travail plus grande - Référence à l'enregistrement qui fait partie de cette ressource ou dont celle-ci fait partie</li>
                  <li>Révision de - la ressource est une révision de l'enregistrement associé</li>
                </ul>
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>
      </Paper>
      <AssociatedResources
        paperClass={paperClass}
        resources={record.associated_resources || []}
        updateResources={updateResources}
        disabled={disabled}
      />
    </div>
  );
};

export default AssociatedResourcesTab;
