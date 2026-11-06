import React from "react";
import { TextField } from "@mui/material";
import { useParams } from "react-router-dom";

import { En, Fr, I18n } from "../I18n";
import { validateField } from "../../utils/validate";
import { collectionLineagePrompts } from "../../utils/collectionMode";
import BilingualTextInput from "./BilingualTextInput";
import RequiredMark from "./RequiredMark";
import { QuestionText, SupplementalText } from "./QuestionStyles";

// Collections profile: resourceLineage > LI_Lineage (statement + scope "collection")
const CollectionLineage = ({ record, updateRecord, disabled }) => {
  const { language } = useParams();
  const lineage = record.collectionLineage || {};

  const handlePromptChange = (e) => {
    const { name, value } = e.target;
    updateRecord("collectionLineage")({ ...lineage, [name]: value });
  };

  return (
    <div>
      <QuestionText>
        <I18n>
          <En>How was this Collection put together?</En>
          <Fr>Comment cette collection a-t-elle été constituée?</Fr>
        </I18n>
        <RequiredMark passes={validateField(record, "collectionLineage")} />
        <SupplementalText>
          <I18n>
            <En>
              Answer all three questions in both languages. The answers are
              combined into a single lineage statement for the Collection.
            </En>
            <Fr>
              Répondez aux trois questions dans les deux langues. Les réponses
              sont combinées en un seul énoncé de généalogie pour la collection.
            </Fr>
          </I18n>
        </SupplementalText>
      </QuestionText>

      <TextField
        label={language === "fr" ? "Portée" : "Scope"}
        value="collection"
        disabled
        style={{ marginTop: "15px", width: "200px" }}
      />

      {collectionLineagePrompts.map(({ key, question, hint }) => (
        <div key={key} style={{ marginTop: "25px" }}>
          <QuestionText>
            {question[language]}
            <SupplementalText>{hint[language]}</SupplementalText>
          </QuestionText>
          <BilingualTextInput
            name={key}
            value={lineage[key]}
            onChange={handlePromptChange}
            disabled={disabled}
            multiline
          />
        </div>
      ))}
    </div>
  );
};

export default CollectionLineage;
