import React, { useId, useState } from "react";
import { useParams } from "react-router-dom";

import {
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  Stack,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

import CheckBoxList from "./CheckBoxList";
import FormField from "../FormShell/FormField";

import { En, Fr, I18n } from "../I18n";
import { roleCodes } from "../../isoCodeLists";

const RolePicker = ({ value, disabled, updateContact }) => {
  const [expanded, setExpanded] = useState(false);
  const { language } = useParams();
  const moreId = useId();

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

  const moreOpen = expanded || selectOptionIsInExpandedList;
  const fr = language === "fr";

  return (
    <Stack spacing={3}>
      <FormControlLabel
        sx={{ m: 0, alignSelf: "flex-start" }}
        control={
          <Checkbox
            name="inCitation"
            disabled={disabled}
            checked={value.inCitation || false}
            onChange={(e) => {
              const { checked } = e.target;

              updateContact("inCitation")(checked);
            }}
          />
        }
        label={
          <I18n
            en="Include this contact in the citation"
            fr="Inclure ce contact dans la citation"
          />
        }
      />
      <FormField
        label={<I18n en="Roles" fr="Rôles" />}
        required
        complete={Boolean(value.role?.length)}
        hint={
          <I18n
            en="Select every role that applies. The record needs a Metadata custodian and a Data owner."
            fr="Sélectionnez tous les rôles qui s'appliquent. L'enregistrement doit avoir un dépositaire des métadonnées et un propriétaire des données."
          />
        }
        guidance={
          <I18n>
            <En>
              Multiple roles can be selected for each contact. Expand the list
              for additional roles.
            </En>
            <Fr>
              Plusieurs rôles peuvent être sélectionnés par personne. Si vous
              avez besoin de rôles plus spécifiques, vous pouvez étendre la
              liste.
            </Fr>
          </I18n>
        }
      >
        <CheckBoxList
          value={value.role || []}
          onChange={updateContact("role")}
          options={prominentRoles.map((r) => r.key)}
          optionLabels={prominentRoles.map((r) => r.title[language])}
          labelSize={{ xs: 12, sm: 6, lg: 4 }}
          disabled={disabled}
          optionTooltips={prominentRoles.map((r) => r.text[language])}
        />
        <Button
          variant="text"
          size="small"
          onClick={() => setExpanded((o) => !o)}
          disabled={selectOptionIsInExpandedList}
          aria-expanded={moreOpen}
          aria-controls={moreId}
          endIcon={moreOpen ? <ExpandLess /> : <ExpandMore />}
          sx={{ mt: 0.5, ml: -1 }}
        >
          {moreOpen
            ? fr
              ? "Moins de rôles"
              : "Fewer roles"
            : fr
              ? `Plus de rôles (${nonProminentRoles.length})`
              : `More roles (${nonProminentRoles.length})`}
        </Button>
        <Collapse in={moreOpen} id={moreId}>
          <Box sx={{ pt: 1 }}>
            <CheckBoxList
              value={value.role || []}
              onChange={updateContact("role")}
              options={nonProminentRoles.map((r) => r.key)}
              optionLabels={nonProminentRoles.map((r) => r.title[language])}
              labelSize={{ xs: 12, sm: 6, lg: 4 }}
              disabled={disabled}
              optionTooltips={nonProminentRoles.map((r) => r.text[language])}
            />
          </Box>
        </Collapse>
      </FormField>
    </Stack>
  );
};
export default RolePicker;
