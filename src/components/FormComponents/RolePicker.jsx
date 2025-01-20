import React, { useState } from "react";
import { useParams } from "react-router-dom";

import {
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Checkbox,
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

  const roles = Object.entries(roleCodes).map(([key, role]) => ({
    key,
    ...role,
  }));
  const prominentRoles = roles.filter((role) => role.showProminently);
  const nonProminentRoles = roles.filter((role) => !role.showProminently);
  const nonProminentRoleKeys = nonProminentRoles.map((r) => r.key);
  const selectOptionIsInExpandedList =
    (value.role || []).filter((role) => nonProminentRoleKeys.includes(role))
      .length > 0;

  return (
    <Grid item xs>
      <QuestionText>
        <I18n>
          <En>Appear in citation?</En>
          <Fr>Ce contact doit apparaître dans la citation?</Fr>
        </I18n>

        <Checkbox
          name="inCitation"
          checked={value.inCitation || false}
          onChange={(e) => {
            const { checked } = e.target;

            updateContact("inCitation")(checked);
          }}
        />
      </QuestionText>
      <QuestionText>
        <I18n>
          <En>What is the role of this contact?</En>
          <Fr>Quel est son rôle?</Fr>
        </I18n>
        <RequiredMark passes={value.role?.length} />
        <SupplementalText>
          {" "}
          <I18n>
            <En>
              Multiple roles can be selected for each contact. Expand the list
              below for additional role.
            </En>
            <Fr>
              Plusieurs rôles peuvent être sélectionnés par personne. Si vous
              avez besoin de rôles plus spécifiques, vous pouvez étendre la
              liste ci-dessous.
            </Fr>
          </I18n>
        </SupplementalText>
      </QuestionText>

      <CheckBoxList
        value={value.role || []}
        onChange={updateContact("role")}
        options={prominentRoles.map((r) => r.key)}
        optionLabels={prominentRoles.map(
          (r) => r.title[language] + (r.required ? "*" : "")
        )}
        disabled={disabled}
        optionTooltips={prominentRoles.map((r) => r.text[language])}
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
            options={nonProminentRoles.map((r) => r.key)}
            optionLabels={nonProminentRoles.map((r) => r.title[language])}
            disabled={disabled}
            optionTooltips={nonProminentRoles.map((r) => r.text[language])}
          />
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
};
export default RolePicker;
