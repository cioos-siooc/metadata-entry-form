import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { SimpleTreeView, TreeItem } from "@mui/x-tree-view";

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
    ...Object.values(variable.definition || {}),
    ...variable.path,
  ]
    .join(" ")
    .toLocaleLowerCase();
  return searchableText.includes(searchTerm.toLocaleLowerCase());
};

const copy = {
  en: {
    count: (count) => `${count} selected`,
    clearSearch: "Clear search",
    clearAll: "Clear all",
    detailsEmpty: "Select a variable in the tree to read its full description.",
    detailsTitle: "Variable details",
    browseTitle: "Browse variables",
    empty:
      "No variables match this search. Try another word, such as temperature, plankton, oxygen, or sea ice.",
    guideTitle: "How to choose variables",
    guide:
      "Choose the things your dataset measures, observes, or describes. You can choose more than one.",
    eov: "EOV (Essential Ocean Variable) is the more specific choice for ocean data.",
    ecv: "ECV (Essential Climate Variable) describes a key part of the climate system.",
    noneSelected: "No variables selected yet.",
    otherHelp:
      "Choose Other only when your dataset does not match a variable above.",
    otherTitle: "None of these fit?",
    searchLabel: "Search by what your data measures",
    searchHelp: "For example: temperature, species, salinity, carbon, ice",
    selectedTitle: "Your selected variables",
    standardName: (standard) => `${standard} name`,
    standardLabel: (standard) => standard,
    deprecated: "Deprecated",
    deprecatedTreeNotice: "Replace before submitting",
    deprecatedDetailNotice:
      "This variable is deprecated and must be replaced before submitting.",
    deprecatedSelectionWarning: (count) =>
      `${count} selected ${count === 1 ? "variable is" : "variables are"} deprecated and must be replaced before submitting.`,
    unavailable: "No longer available for new records",
    fallbackDefinition: (category) =>
      `A key ${category.toLocaleLowerCase()} observation used to understand the climate system.`,
  },
  fr: {
    count: (count) => `${count} sélectionnée${count === 1 ? "" : "s"}`,
    clearSearch: "Effacer la recherche",
    clearAll: "Tout effacer",
    detailsEmpty:
      "Sélectionnez une variable dans l’arborescence pour lire sa description complète.",
    detailsTitle: "Détails de la variable",
    browseTitle: "Parcourir les variables",
    empty:
      "Aucune variable ne correspond à cette recherche. Essayez un autre mot, comme température, plancton, oxygène ou glace de mer.",
    guideTitle: "Comment choisir les variables",
    guide:
      "Choisissez ce que votre jeu de données mesure, observe ou décrit. Vous pouvez choisir plusieurs variables.",
    eov: "Une VEO (variable océanique essentielle) est le choix le plus précis pour les données océaniques.",
    ecv: "Une VCE (variable climatique essentielle) décrit une partie importante du système climatique.",
    noneSelected: "Aucune variable sélectionnée pour l’instant.",
    otherHelp:
      "Choisissez « Autre » seulement si votre jeu de données ne correspond à aucune variable ci-dessus.",
    otherTitle: "Aucune variable ne convient?",
    searchLabel: "Rechercher selon ce que vos données mesurent",
    searchHelp: "Par exemple : température, espèces, salinité, carbone, glace",
    selectedTitle: "Vos variables sélectionnées",
    standardName: (standard) =>
      `Nom de la ${standard === "EOV" ? "VEO" : "VCE"}`,
    standardLabel: (standard) => (standard === "EOV" ? "VEO" : "VCE"),
    deprecated: "Désuète",
    deprecatedTreeNotice: "Remplacer avant la soumission",
    deprecatedDetailNotice:
      "Cette variable est désuète et doit être remplacée avant la soumission.",
    deprecatedSelectionWarning: (count) =>
      `${count} ${count === 1 ? "variable sélectionnée est désuète" : "variables sélectionnées sont désuètes"} et doit${count === 1 ? "" : "vent"} être remplacée${count === 1 ? "" : "s"} avant la soumission.`,
    unavailable: "N’est plus offerte pour les nouvelles fiches",
    fallbackDefinition: (category) =>
      `Une observation clé en ${category.toLocaleLowerCase()} servant à comprendre le système climatique.`,
  },
};

const EssentialVariablesInput = ({
  disabled,
  language,
  record,
  updateRecord,
}) => {
  const text = copy[language] || copy.en;
  const selectedIds = getRecordEssentialVariables(record);
  const [activeVariable, setActiveVariable] = useState(null);
  const [expandedItems, setExpandedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const checklistRef = useRef(null);
  const variablesByDomain = useMemo(
    () =>
      groupVariables(
        essentialVariables.filter(
          (variable) =>
            variable.id !== "other" &&
            (!variable.deprecated || selectedIds.includes(variable.id)) &&
            matchesSearch(variable, searchTerm),
        ),
      ),
    [searchTerm, selectedIds],
  );
  const otherVariable = essentialVariables.find(
    (variable) => variable.id === "other",
  );
  const showOther = !searchTerm || matchesSearch(otherVariable, searchTerm);
  const selectedVariables = essentialVariables.filter((variable) =>
    selectedIds.includes(variable.id),
  );
  const deprecatedSelectedVariables = selectedVariables.filter(
    (variable) => variable.deprecated,
  );
  const searchExpandedItems = Object.entries(variablesByDomain).flatMap(
    ([domain, categories]) => [
      `domain:${domain}`,
      ...Object.keys(categories).map(
        (category) => `category:${domain}:${category}`,
      ),
    ],
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

  const clearVariables = () => {
    updateRecord("essentialVariables")([]);
    updateRecord("eov")([]);
  };

  const selectedCount = (variables) =>
    variables.filter((variable) => selectedIds.includes(variable.id)).length;

  const getDefinition = (variable) =>
    variable.definition[language] ||
    variable.definition.en ||
    text.fallbackDefinition(variable.path[1]);

  const getIconPath = (variable, standard) => {
    if (standard === "ECV") return variable.standardIconUrls?.ECV || null;
    if (!variable.icon) return null;
    const icon =
      variable.icon === "ocean-color.svg" ? "ocean-colour.svg" : variable.icon;
    return `${import.meta.env.BASE_URL}eov-icons/${icon}`;
  };

  const renderVariable = (variable) => {
    const label = variable.label[language] || variable.label.en;
    const isSelected = selectedIds.includes(variable.id);
    const isDeprecated = variable.deprecated && !isSelected;

    return (
      <TreeItem
        key={variable.id}
        itemId={variable.id}
        label={
          <Stack alignItems="center" direction="row" flexWrap="wrap" gap={0.5}>
            <Checkbox
              checked={isSelected}
              disabled={disabled || isDeprecated}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => {
                event.stopPropagation();
                setActiveVariable(variable);
                toggleVariable(variable.id);
              }}
              inputProps={{ "aria-label": label }}
              size="small"
              sx={{ p: 0.25 }}
            />
            <Typography component="span" variant="body2">
              {label}
            </Typography>
            {variable.standards.map((standard) => (
              <Chip
                key={standard}
                label={text.standardLabel(standard)}
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
            {variable.deprecated && (
              <>
                <Chip
                  label={text.deprecated}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{
                    fontSize: "0.65rem",
                    height: 18,
                    "& .MuiChip-label": { px: 0.6 },
                  }}
                />
                <Typography
                  color="warning.main"
                  component="span"
                  variant="caption"
                >
                  {text.deprecatedTreeNotice}
                </Typography>
              </>
            )}
          </Stack>
        }
        sx={{
          opacity: isDeprecated ? 0.6 : 1,
          "& .MuiTreeItem-content": { minHeight: 32 },
          "& .MuiTreeItem-label": { minWidth: 0 },
        }}
      />
    );
  };

  return (
    <Box ref={checklistRef}>
      <Paper
        variant="outlined"
        sx={{ bgcolor: "action.hover", mb: 2, p: { xs: 1.5, sm: 2 } }}
      >
        <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700 }}>
          {text.guideTitle}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {text.guide}
        </Typography>
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          <Typography variant="body2">• {text.eov}</Typography>
          <Typography variant="body2">• {text.ecv}</Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Box aria-live="polite" sx={{ mb: 2 }}>
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
          >
            <Typography
              component="h3"
              variant="subtitle1"
              sx={{ fontWeight: 700 }}
            >
              {text.selectedTitle} ({text.count(selectedVariables.length)})
            </Typography>
            {selectedVariables.length > 0 && (
              <Button disabled={disabled} onClick={clearVariables} size="small">
                {text.clearAll}
              </Button>
            )}
          </Stack>
          {selectedVariables.length ? (
            <>
              {deprecatedSelectedVariables.length > 0 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  {text.deprecatedSelectionWarning(
                    deprecatedSelectedVariables.length,
                  )}
                </Alert>
              )}
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                {selectedVariables.map((variable) => {
                  const isDeprecated = variable.deprecated;

                  return (
                    <Stack
                      alignItems="center"
                      direction="row"
                      gap={0.5}
                      key={variable.id}
                    >
                      <Chip
                        label={variable.label[language] || variable.label.en}
                        onDelete={
                          disabled
                            ? undefined
                            : () => toggleVariable(variable.id)
                        }
                        color={isDeprecated ? "warning" : "primary"}
                        size="small"
                        variant="outlined"
                      />
                      {isDeprecated && (
                        <Chip
                          label={text.deprecated}
                          color="warning"
                          size="small"
                        />
                      )}
                    </Stack>
                  );
                })}
              </Stack>
            </>
          ) : (
            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
              {text.noneSelected}
            </Typography>
          )}
        </Box>

        <TextField
          fullWidth
          label={text.searchLabel}
          helperText={text.searchHelp}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              focusFirstMatch();
            }
          }}
          sx={{ mb: 2 }}
        />
        {searchTerm && (
          <Link
            component="button"
            type="button"
            onClick={() => setSearchTerm("")}
            sx={{ display: "block", mb: 2 }}
          >
            {text.clearSearch}
          </Link>
        )}

        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            display: "grid",
            gap: 2,
            gridTemplateColumns: { md: "minmax(0, 3fr) minmax(260px, 2fr)" },
            p: { xs: 1.5, sm: 2 },
          }}
        >
          <Box>
            <Typography
              component="h3"
              variant="subtitle1"
              sx={{ fontWeight: 700, mb: 1 }}
            >
              {text.browseTitle}
            </Typography>
            {Object.keys(variablesByDomain).length || showOther ? (
              <SimpleTreeView
                aria-label={text.browseTitle}
                expansionTrigger="content"
                expandedItems={searchTerm ? searchExpandedItems : expandedItems}
                onExpandedItemsChange={(_, itemIds) =>
                  setExpandedItems(itemIds)
                }
                selectedItems={activeVariable?.id || null}
                onSelectedItemsChange={(_, itemId) => {
                  const variable = essentialVariables.find(
                    (item) => item.id === itemId,
                  );
                  if (variable) setActiveVariable(variable);
                }}
                sx={{
                  py: 0.5,
                  "& .MuiTreeItem-groupTransition": {
                    borderColor: "divider",
                    borderLeft: 1,
                    ml: 1.5,
                    pl: 1,
                  },
                }}
              >
                {Object.entries(variablesByDomain).map(
                  ([domain, categories]) => {
                    const domainVariables = Object.values(categories).flat();
                    const domainSelectionCount = selectedCount(domainVariables);

                    return (
                      <TreeItem
                        key={domain}
                        itemId={`domain:${domain}`}
                        label={
                          <Stack
                            alignItems="center"
                            direction="row"
                            spacing={0.75}
                          >
                            <Typography
                              component="span"
                              variant="body2"
                              sx={{ fontWeight: 700 }}
                            >
                              {domain}
                            </Typography>
                            {domainSelectionCount > 0 && (
                              <Chip label={domainSelectionCount} size="small" />
                            )}
                          </Stack>
                        }
                      >
                        {Object.entries(categories).map(
                          ([category, variables]) => {
                            const categorySelectionCount =
                              selectedCount(variables);

                            return (
                              <TreeItem
                                key={category}
                                itemId={`category:${domain}:${category}`}
                                label={
                                  <Stack
                                    alignItems="center"
                                    direction="row"
                                    spacing={0.75}
                                  >
                                    <Typography
                                      component="span"
                                      variant="body2"
                                      sx={{ fontWeight: 700 }}
                                    >
                                      {category}
                                    </Typography>
                                    {categorySelectionCount > 0 && (
                                      <Chip
                                        label={categorySelectionCount}
                                        size="small"
                                      />
                                    )}
                                  </Stack>
                                }
                              >
                                {variables
                                  .slice()
                                  .sort((a, b) =>
                                    (
                                      a.label[language] || a.label.en
                                    ).localeCompare(
                                      b.label[language] || b.label.en,
                                      language,
                                    ),
                                  )
                                  .map(renderVariable)}
                              </TreeItem>
                            );
                          },
                        )}
                      </TreeItem>
                    );
                  },
                )}
                {showOther && renderVariable(otherVariable)}
              </SimpleTreeView>
            ) : (
              <Typography color="text.secondary" variant="body2">
                {text.empty}
              </Typography>
            )}
            {showOther && (
              <Typography
                color="text.secondary"
                variant="caption"
                sx={{ display: "block", mt: 1 }}
              >
                {text.otherTitle} {text.otherHelp}
              </Typography>
            )}
          </Box>

          <Box
            component="aside"
            sx={{
              alignSelf: "stretch",
              borderColor: "divider",
              borderLeft: { md: 1 },
              minHeight: 180,
              pl: { md: 2 },
              pt: { xs: 2, md: 0 },
            }}
          >
            <Typography
              component="h3"
              variant="subtitle1"
              sx={{ fontWeight: 700 }}
            >
              {text.detailsTitle}
            </Typography>
            {activeVariable ? (
              <>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="h6">
                    {activeVariable.label[language] || activeVariable.label.en}
                  </Typography>
                  <Stack alignItems="flex-start" direction="row" spacing={1}>
                    {getIconPath(activeVariable, "EOV") && (
                      <Stack alignItems="center" spacing={0.25}>
                        <Box
                          alt={`${activeVariable.label.en} CIOOS EOV icon`}
                          component="img"
                          src={getIconPath(activeVariable, "EOV")}
                          sx={{
                            flexShrink: 0,
                            height: 48,
                            objectFit: "contain",
                            width: 48,
                          }}
                        />
                        <Chip
                          label="CIOOS"
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: "0.6rem",
                            height: 16,
                            "& .MuiChip-label": { px: 0.5 },
                          }}
                        />
                      </Stack>
                    )}
                    {activeVariable.goosIcon && (
                      <Stack alignItems="center" spacing={0.25}>
                        <Box
                          alt={`${activeVariable.label.en} GOOS EOV icon`}
                          component="img"
                          src={`${import.meta.env.BASE_URL}goos-eov-icons/${activeVariable.goosIcon}`}
                          sx={{
                            flexShrink: 0,
                            height: 48,
                            objectFit: "contain",
                            width: 48,
                          }}
                        />
                        <Chip
                          label="GOOS"
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: "0.6rem",
                            height: 16,
                            "& .MuiChip-label": { px: 0.5 },
                          }}
                        />
                      </Stack>
                    )}
                    {getIconPath(activeVariable, "ECV") && (
                      <Stack alignItems="center" spacing={0.25}>
                        <Box
                          alt={`${activeVariable.standardNames.ECV.en} WMO ECV icon`}
                          component="img"
                          src={getIconPath(activeVariable, "ECV")}
                          sx={{
                            flexShrink: 0,
                            height: 48,
                            objectFit: "contain",
                            width: 48,
                          }}
                        />
                        <Chip
                          label="WMO"
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: "0.6rem",
                            height: 16,
                            "& .MuiChip-label": { px: 0.5 },
                          }}
                        />
                      </Stack>
                    )}
                  </Stack>
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    {activeVariable.standards.map((standard) => {
                      const standardName =
                        activeVariable.standardNames?.[standard];
                      const name = standardName?.[language] || standardName?.en;

                      return name ? (
                        <Typography key={standard} variant="body2">
                          <Box component="span" sx={{ fontWeight: 700 }}>
                            {text.standardName(standard)}:
                          </Box>{" "}
                          {name}
                        </Typography>
                      ) : null;
                    })}
                  </Stack>
                </Box>
                <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                  {activeVariable.standards.map((standard) => (
                    <Chip
                      key={standard}
                      label={text.standardLabel(standard)}
                      size="small"
                      color={standard === "EOV" ? "info" : "success"}
                      variant="outlined"
                    />
                  ))}
                </Stack>
                {activeVariable.deprecated && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    {text.deprecatedDetailNotice}
                  </Alert>
                )}
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ mt: 1.5 }}
                >
                  {getDefinition(activeVariable)}
                </Typography>
              </>
            ) : (
              <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                {text.detailsEmpty}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default EssentialVariablesInput;
