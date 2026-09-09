import React, { useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

import {
  essentialVariables,
  getLegacyEovs,
  getRecordEssentialVariables,
} from "../../essentialVariables";

const groupVariables = (variables) =>
  variables.reduce((groups, variable) => {
    const [domain, category] = variable.path;
    if (!groups[domain]) groups[domain] = {};
    if (!groups[domain][category]) groups[domain][category] = [];
    groups[domain][category].push(variable);
    return groups;
  }, {});

const matchesSearch = (variable, searchTerm) => {
  if (!searchTerm) return true;
  const searchableText = [
    variable.label.en,
    variable.label.fr,
    ...(variable.aliases || []),
    ...variable.path,
  ]
    .join(" ")
    .toLocaleLowerCase();
  return searchableText.includes(searchTerm.toLocaleLowerCase());
};

const qualifierPrefixes = [
  "Ocean surface",
  "Sea surface",
  "Ocean bottom",
  "Upper-air",
  "Above-ground",
  "Subsurface",
  "Dissolved",
  "Surface",
  "Marine",
  "Sea",
];

const frenchQualifierSuffixes = [
  [" sous la surface", "Sous la surface"],
  [" de surface", "Surface"],
];

const splitVariableLabel = (label) => {
  const frenchSuffix = frenchQualifierSuffixes.find(([suffix]) =>
    label.toLocaleLowerCase().endsWith(suffix),
  );
  if (frenchSuffix) {
    return {
      qualifier: frenchSuffix[1],
      name: label.slice(0, -frenchSuffix[0].length).trim(),
    };
  }

  const qualifier = qualifierPrefixes.find((candidate) =>
    label.toLocaleLowerCase().startsWith(`${candidate.toLocaleLowerCase()} `),
  );

  return qualifier
    ? { qualifier, name: label.slice(qualifier.length).trim() }
    : { qualifier: null, name: label };
};

const EssentialVariablesInput = ({
  disabled,
  language,
  record,
  updateRecord,
}) => {
  const selectedIds = getRecordEssentialVariables(record);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDomains, setExpandedDomains] = useState(["Ocean"]);
  const checklistRef = useRef(null);
  const variablesByDomain = groupVariables(
    essentialVariables.filter((variable) =>
      matchesSearch(variable, searchTerm),
    ),
  );

  const focusFirstMatch = () => {
    checklistRef.current
      ?.querySelector('input[type="checkbox"]:not(:disabled)')
      ?.focus();
  };

  const toggleVariable = (variableId) => {
    const ids = selectedIds.includes(variableId)
      ? selectedIds.filter((id) => id !== variableId)
      : [...selectedIds, variableId];
    updateRecord("essentialVariables")(ids);
    // Retain the legacy field until all metadata consumers migrate.
    updateRecord("eov")(getLegacyEovs(ids));
  };

  return (
    <Box ref={checklistRef}>
      <TextField
        fullWidth
        label={
          language === "fr"
            ? "Filtrer les variables essentielles"
            : "Filter essential variables"
        }
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            focusFirstMatch();
          }
        }}
        slotProps={{
          htmlInput: {
            "aria-describedby": "essential-variables-keyboard-help",
          },
        }}
        sx={{ mb: 1 }}
      />
      <Typography
        id="essential-variables-keyboard-help"
        variant="caption"
        component="p"
      >
        {language === "fr"
          ? "Clavier : saisissez un terme pour filtrer; appuyez sur Entrée pour accéder au premier résultat, puis utilisez Tab et la barre d’espace pour sélectionner des variables."
          : "Keyboard: type to filter; press Enter to move to the first result, then use Tab and Space to select variables."}
      </Typography>
      {Object.entries(variablesByDomain).map(([domain, categories]) => (
        <Accordion
          key={domain}
          expanded={Boolean(searchTerm) || expandedDomains.includes(domain)}
          onChange={(_, isExpanded) => {
            setExpandedDomains((current) =>
              isExpanded
                ? [...new Set([...current, domain])]
                : current.filter((item) => item !== domain),
            );
          }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">{domain}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {Object.entries(categories).map(([category, variables]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {category}
                </Typography>
                <Grid container>
                  {variables
                    .sort((a, b) =>
                      (a.label[language] || a.label.en).localeCompare(
                        b.label[language] || b.label.en,
                        language,
                      ),
                    )
                    .map((variable) => {
                      const isSelected = selectedIds.includes(variable.id);
                      const isDeprecated = variable.deprecated && !isSelected;
                      const fullLabel =
                        variable.label[language] || variable.label.en;
                      const { qualifier, name } = splitVariableLabel(fullLabel);
                      const label = (
                        <Box
                          component="span"
                          sx={{
                            alignItems: "center",
                            display: "inline-flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                          }}
                        >
                          {qualifier && (
                            <Box
                              component="span"
                              sx={{
                                color: "text.secondary",
                              }}
                            >
                              {qualifier}
                            </Box>
                          )}
                          <Box component="span" sx={{ fontWeight: 700 }}>
                            {name}
                          </Box>
                          {variable.standards.map((standard) => (
                            <Chip
                              key={standard}
                              label={standard}
                              size="small"
                              color={standard === "EOV" ? "info" : "success"}
                              variant="outlined"
                              sx={{
                                fontSize: "0.65rem",
                                height: 18,
                                "& .MuiChip-label": { px: 0.6 },
                              }}
                            />
                          ))}
                        </Box>
                      );

                      return (
                        <Grid key={variable.id} size={{ xs: 12, md: 6 }}>
                          <Tooltip
                            title={
                              variable.definition[language] ||
                              variable.definition.en ||
                              ""
                            }
                            placement="right"
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isSelected}
                                  disabled={disabled || isDeprecated}
                                  onChange={() => toggleVariable(variable.id)}
                                />
                              }
                              label={label}
                              sx={
                                variable.deprecated
                                  ? {
                                      color: "text.disabled",
                                      textDecoration: "line-through",
                                    }
                                  : undefined
                              }
                            />
                          </Tooltip>
                        </Grid>
                      );
                    })}
                </Grid>
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default EssentialVariablesInput;
