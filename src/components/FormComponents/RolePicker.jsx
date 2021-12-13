import React, { useState } from "react";
import { useParams } from "react-router-dom";

import {
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";

import CheckBoxList from "./CheckBoxList";
import RequiredMark from "./RequiredMark";

import { En, Fr, I18n } from "../I18n";
import { roleCodes } from "../../isoCodeLists";

import { QuestionText, SupplementalText } from "./QuestionStyles";

const RolePicker = ({ value, disabled, updateContact }) => {
  const [expanded, setExpanded] = useState(false);
  const { language } = useParams();
  const roleCodeKeys = Object.keys(roleCodes);
  const roleLabels = Object.values(roleCodes).map(
    ({ title, includeInCitation }) =>
      `${title[language]}${includeInCitation ? "*" : ""}`
  );
  const citationRoleText = {
    en: "This role is included in the citation.",
    fr: "Ce rôle est inclus dans la citation.",
  };
  const tooltips = Object.values(roleCodes).map(
    ({ text, includeInCitation }) =>
      `${text[language]}${
        includeInCitation ? `.  ${citationRoleText[language]}` : ""
      }`
  );

  // the first 3 roles are show more prominently
  const numSpecialRoles = 3;

  const selectOptionIsInExpandedList =
    (value.role || []).filter(
      (role) => roleCodeKeys.indexOf(role) > numSpecialRoles - 1
    ).length > 0;

  return (
    <Grid item xs>
      <QuestionText>
        <I18n>
          <En>
            What is the role of this contact? {selectOptionIsInExpandedList}
          </En>
          <Fr>Quel est son rôle?</Fr>
        </I18n>
        <RequiredMark passes={value.role?.length} />
        <SupplementalText>
          {" "}
          <I18n>
            <En>
              At least one Metadata Custodian and one Data Owner are required.
              Multiple roles can be selected for each contact. Expand the list
              below for additional role. Only starred roles (*) will appear in
              the citation.
            </En>
            <Fr>
              Au moins un dépositaire de métadonnées et un propriétaire de
              données sont requis. Plusieurs rôles peuvent être sélectionnés par
              personne. Si vous avez besoin de rôles plus spécifiques, vous
              pouvez étendre la liste. Développez la liste ci-dessous pour un
              rôle supplémentaire. Seuls les rôles marqués d'un astérisque (*)
              apparaîtront dans la citation.
            </Fr>
          </I18n>
        </SupplementalText>
      </QuestionText>

      <CheckBoxList
        value={value.role || []}
        onChange={updateContact("role")}
        options={roleCodeKeys.slice(0, numSpecialRoles)}
        optionLabels={roleLabels.slice(0, numSpecialRoles)}
        disabled={disabled}
        optionTooltips={tooltips.slice(0, numSpecialRoles)}
      />

      <Accordion
        onChange={() => setExpanded(!expanded)}
        expanded={expanded || selectOptionIsInExpandedList}
      >
        <AccordionSummary
          expandIcon={
            <Tooltip title="Show/Hide more options">
              <ExpandMore />
            </Tooltip>
          }
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <I18n>
            <En>Show/Hide more role options</En>
            <Fr>Afficher/masquer les rôles</Fr>
          </I18n>
        </AccordionSummary>
        <AccordionDetails>
          <CheckBoxList
            value={value.role || []}
            onChange={updateContact("role")}
            options={roleCodeKeys.slice(numSpecialRoles)}
            optionLabels={roleLabels.slice(numSpecialRoles)}
            disabled={disabled}
            optionTooltips={tooltips.slice(numSpecialRoles)}
          />
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
};
export default RolePicker;
