import React from "react";
import { Paper } from "@material-ui/core";
// import CircularProgress from "@material-ui/core/CircularProgress";
// import { useParams } from "react-router-dom";
// import { OpenInNew, Update } from "@material-ui/icons";
import { En, Fr, I18n } from "../I18n";
// import { progressCodes } from "../../isoCodeLists";

// import firebase from "../../firebase";
import BilingualTextInput from "../FormComponents/BilingualTextInput";
import MethodSteps from "../FormComponents/MethodSteps";
// import CheckBoxList from "../FormComponents/CheckBoxList";
// import DateInput from "../FormComponents/DateInput";
// import RequiredMark from "../FormComponents/RequiredMark";
// import SelectInput from "../FormComponents/SelectInput";
// import { validateField } from "../../utils/validate";

import {
  QuestionText,
  SupplementalText,
  paperClass,
} from "../FormComponents/QuestionStyles";

// import regions from "../../regions";
// import { UserContext } from "../../providers/UserProvider";



const BiologicalTab = ({ disabled, record, updateRecord }) => {
  const updateBiological = updateRecord("biological");
  
  function handleBiologicalChange(key){
    return (e) => {
      const newData = {...record.biological, [key]: e.target.value };
      updateBiological(newData);
    };
  }

  function updateMethods(methodCollection){
    // Extract Method as array of objects, methods are not seen as an array when 
    // returning from firebase, possibly due to nesting?
    const methodList = Object.entries(methodCollection).map(([key, method]) => ({
      ...method,
    }));

    const newData = {...record.biological, methods: methodList};

    updateBiological(newData);
  }


  return (

    // Additional fields that need to be added to the form as they are required in the IPT:

    // eml:

    //     dataset>coverage>geographicCoverage>geographicDescription
    //     dataset>methods>methodStep
    //     dataset>methods>sampling>studyExtent
    //     dataset>methods>sampling>samplingDescription

    // Suggested guidance text in the form (as taken from the IPT):
    // 
    // geograhicDescription - A free text description of the geographic area in which the data 
    // was collected.

    // methodStep - This field allows for repeated sets of elements that document a series of 
    // methods and procedures used in the study, and the processing steps leading to the production 
    // of the data files. These include text descriptions of the procedures, relevant literature, 
    // software, instrumentation, source data and any quality control measures taken. Each method 
    // should be described in enough detail to allow other researchers to interpret and repeat, if 
    // required, the study.

    // studyExtent - This field represents both a specific sampling area and the sampling 
    // frequency (temporal boundaries, frequency of occurrence).

    // samplingDescription - This field allows for a text-based / human readable description 
    // of the sampling procedures used in the research project. The content of this element would 
    // be similar to a description of sampling procedures found in the methods section of a journal 
    // article.


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
          {/* <RequiredMark passes={validateField(record, "geographicDescription")} /> */}
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
          {/* <RequiredMark passes={validateField(record, "geographicDescription")} /> */}
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

      <MethodSteps
        paperClass={paperClass}
        methods={record.biological.methods || []}
        updateMethods={updateMethods}
        disabled={disabled}
      />
    </div>
  );
};

export default BiologicalTab;
