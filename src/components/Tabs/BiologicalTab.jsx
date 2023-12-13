import React from "react";
import { Paper } from "@material-ui/core";
import { En, Fr, I18n } from "../I18n";

import BilingualTextInput from "../FormComponents/BilingualTextInput";
import MethodSteps from "../FormComponents/MethodSteps";

import {
  QuestionText,
  SupplementalText,
  paperClass,
} from "../FormComponents/QuestionStyles";


const BiologicalTab = ({ disabled, record, updateRecord }) => {
  const updateBiological = updateRecord("biological");

  function handleBiologicalChange(key) {
    return (e) => {
      const newData = { ...record.biological, [key]: e.target.value };
      updateBiological(newData);
    };
  }

  function updateMethods(methodCollection) {
    const newData = { ...record.biological, methods: methodCollection };

    updateBiological(newData);
  }

  return (
    <div>
      <Paper style={paperClass}>
        <QuestionText>
          <I18n>
            <En>
              What is the geographic description of the area?
            </En>
            <Fr>
              Quelle est la description géographique de la région?
            </Fr>
          </I18n>
          <SupplementalText>
            <I18n>
              <En>
                A free text description of the geographic area
                in which the data was collected.
              </En>
              <Fr>
                Une description textuelle libre de la région
                géographique dans laquelle les données ont été
                recueillies.
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>

        <BilingualTextInput
          value={record.biological.geographicDescription}
          onChange={handleBiologicalChange("geographicDescription")}
          disabled={disabled}
          multiline
        />
      </Paper>

      <Paper style={paperClass}>
        <QuestionText>
          <I18n>
            <En>
              What is the sampling procedure for this dataset?
            </En>
            <Fr>
              Quelle est la procédure d'échantillonnage pour cet
              ensemble de données?
            </Fr>
          </I18n>
          <SupplementalText>
            <I18n>
              <En>
                This field allows for a text-based / human
                readable description of the sampling procedures
                used in the research project. The content of
                this element would be similar to a description
                of sampling procedures found in the methods
                section of a journal article.
              </En>
              <Fr>
                Une description textuelle libre de la région
                géographique dans laquelle les données ont
                été recueillies.
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>

        <BilingualTextInput
          value={record.biological.samplingDescription}
          onChange={handleBiologicalChange("samplingDescription")}
          disabled={disabled}
          multiline
        />
      </Paper>

      <Paper style={paperClass}>
        <QuestionText>
          <I18n>
            <En>
              What is the study extent for this dataset?
            </En>
            <Fr>
              Quelle est l'étendue de l'étude pour cet ensemble de données?
            </Fr>
          </I18n>
          <SupplementalText>
            <I18n>
              <En>
                This field represents both a specific sampling area and the
                sampling frequency (temporal boundaries, frequency of
                occurrence).
              </En>
              <Fr>
                Ce champ représente à la fois une zone d'échantillonnage
                spécifique et la fréquence d'échantillonnage (limites
                temporelles, fréquence d'occurrence).
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>

        <BilingualTextInput
          value={record.biological.studyExtent}
          onChange={handleBiologicalChange("studyExtent")}
          disabled={disabled}
          multiline
          />
        </Paper>

        <Paper style={paperClass}>
          <QuestionText>
            <I18n>
              <En>
                What are the methods and procedures used in this dataset?
              </En>
              <Fr>
                Quelles sont les méthodes et procédures utilisées dans cet 
                ensemble de données?
              </Fr>
            </I18n>
            <SupplementalText>
              <I18n>
                <En>
                  This field allows for repeated sets of elements that document
                  a series of methods and procedures used in the study, and the 
                  processing steps leading to the production of the data files. 
                  These include e.g. text descriptions of the procedures, 
                  relevant literature, software, instrumentation and any quality 
                  control measurements taken.
                </En>
                <Fr>
                  Ce champ permet des ensembles répétés d'éléments qui documentent 
                  une série de méthodes et de procédures utilisées dans l'étude ; 
                  les étapes de traitement menant à la production des fichiers de 
                  données. Ceux-ci comprennent par exemple des descriptions 
                  textuelles des procédures, la documentation, les logiciels, 
                  les instruments et toute qualité pertinents ; mesures de 
                  contrôle prises.
                </Fr>
              </I18n>
            </SupplementalText>
          </QuestionText>

          <MethodSteps
            paperClass={paperClass}
            methods={record.biological.methods || []}
            updateMethods={updateMethods}
            disabled={disabled}
          />
        </Paper>
    </div>
  );
};

export default BiologicalTab;
