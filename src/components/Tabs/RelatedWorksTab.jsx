import React from "react";
import { Paper } from "@material-ui/core";
import RelatedWorks from "../FormComponents/RelatedWorks";
import { En, Fr, I18n } from "../I18n";
import RequiredMark from "../FormComponents/RequiredMark";
import {
  paperClass,
  QuestionText,
  SupplementalText,
} from "../FormComponents/QuestionStyles";
import { validateField } from "../../utils/validate";

const RelatedWorksTab = ({ disabled, record, updateRecord }) => {
  const updateResources = updateRecord("associated_resources");
  return (
    <div>
      <Paper style={paperClass}>
        <QuestionText>
          <En>Enter links to other metadata records, publications or works that are
            related to the primary resources this metadata record describes.
          </En>
          <Fr>
            Entrez des liens vers d'autres enregistrements de métadonnées, publications ou ouvrages qui sont
            liés aux ressources principales décrites par cet enregistrement de métadonnées.
          </Fr>
          <RequiredMark passes={validateField(record, "associated_resources")} />
          <SupplementalText>
            <I18n>
              <En>
                Related works may be:
                <ul>
                  <li>Other datasets that are part of the same collection, project, or sampling protocol</li>
                  <li>Metadata records on other catalogues such as OBIS or FRDR that describe the same dataset</li>
                  <li>Any work that adds context to or describes the primary resource for which you are creating this metadata record for</li>
                </ul>

                Some of the ways a work can be related are:
                <ul>
                  <li>Cross Reference - Reference from one record to another.	Use to identify related documents or related records that may be part of the same collection or project</li>
                  <li>Dependency - Associated through a dependency</li>
                  <li>Is Composed Of/Larger Work Citation - Reference to record(s) that are parts of this resource or which this one is a part of</li>
                  <li>Revision Of - Resource is a revision of associated record</li>
                </ul>
              </En>
              <Fr>
                Les œuvres connexes peuvent être :
                <ul>
                  <li>Autres ensembles de données faisant partie de la même collection, du même projet ou du même protocole d'échantillonnage</li>
                  <li>Enregistrements de métadonnées sur d'autres catalogues tels que OBIS ou FRDR qui décrivent le même ensemble de données</li>
                  <li>Tout travail qui ajoute du contexte ou décrit la ressource principale pour laquelle vous créez cet enregistrement de métadonnées</li>
                </ul>

                Certaines des façons dont une œuvre peut être liée sont :
                <ul>
                  <li>Référence croisée - référence d'un enregistrement à un autre. À utiliser pour identifier des documents ou des enregistrements associés pouvant faire partie de la même collection ou du même projet.</li>
                  <li>Dépendance - Associé via une dépendance</li>
                  <li>Est composé de/Citation de travail plus grande - Référence à un ou plusieurs enregistrements qui font partie de cette ressource ou dont celle-ci fait partie</li>
                  <li>Révision de - la ressource est une révision de l'enregistrement associé</li>
                </ul>
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>
      </Paper>
      <RelatedWorks
        paperClass={paperClass}
        resources={record.associated_resources || []}
        updateResources={updateResources}
        disabled={disabled}
      />
    </div>
  );
};

export default RelatedWorksTab;
