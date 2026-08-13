import React, { useId } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Close } from "@mui/icons-material";

import { PREDICATE_OPERATORS } from "@shared/formEngine";
import { pick } from "./language";

/**
 * Builds a `visibleIf` rule from dropdowns.
 *
 * Deliberately covers a subset: one condition, or several combined with
 * all/any. That is every rule shape the shipped catalog uses and, judging by the
 * predicate DSL's own design notes, every shape it was meant to express.
 *
 * Anything outside that subset — `not`, nesting, a hand-written combination —
 * is shown read-only with a pointer to the JSON view. Re-rendering an
 * unrepresentable rule through these controls would quietly rewrite it, and
 * silently changing what a form shows is the failure this whole feature exists
 * to prevent.
 */

const OPERATORS_BY_NAME = Object.fromEntries(
  PREDICATE_OPERATORS.map((operator) => [operator.name, operator])
);

/** The single condition this editor understands: one field, one comparison. */
function readCondition(rule) {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) return null;

  const keys = Object.keys(rule);
  if (!keys.includes("field")) return null;

  const operators = keys.filter((key) => key in OPERATORS_BY_NAME);
  const extra = keys.filter(
    (key) => key !== "field" && !(key in OPERATORS_BY_NAME)
  );
  if (operators.length !== 1 || extra.length) return null;

  return { field: rule.field, operator: operators[0], value: rule[operators[0]] };
}

/**
 * @returns {{mode: "none"|"single"|"allOf"|"anyOf", conditions: Array}|null}
 *          null when the rule is real but outside the subset above.
 */
export function readRule(rule) {
  if (rule === undefined || rule === null) {
    return { mode: "none", conditions: [] };
  }

  const single = readCondition(rule);
  if (single) return { mode: "single", conditions: [single] };

  const combinator = ["allOf", "anyOf"].find((key) => Array.isArray(rule?.[key]));
  if (combinator && Object.keys(rule).length === 1) {
    const conditions = rule[combinator].map(readCondition);
    if (conditions.every(Boolean)) {
      return { mode: combinator, conditions };
    }
  }

  return null;
}

function writeCondition({ field, operator, value }) {
  return { field, [operator]: value };
}

function writeRule(mode, conditions) {
  if (mode === "none" || conditions.length === 0) return null;
  if (mode === "single" || conditions.length === 1) {
    return writeCondition(conditions[0]);
  }
  return { [mode]: conditions.map(writeCondition) };
}

/** Sensible starting value for an operator, given what it is comparing against. */
function defaultValue(operator, property) {
  const arity = OPERATORS_BY_NAME[operator]?.arity;
  if (arity === "flag") return true;
  if (arity === "list") return [];
  if (property?.enum?.length) return property.enum[0];
  if (property?.type === "boolean") return true;
  if (property?.type === "number" || property?.type === "integer") return 0;
  return "";
}

/** Text typed into a value box, coerced to the compared property's type. */
function coerce(text, property) {
  if (property?.type === "number" || property?.type === "integer") {
    const parsed = Number(text);
    return text === "" || Number.isNaN(parsed) ? text : parsed;
  }
  return text;
}

/** Values a field can be compared against, when the schema enumerates them. */
function choicesFor(property) {
  return property?.enum || property?.items?.enum || null;
}

function ValueInput({ operator, property, value, onChange, language }) {
  const arity = OPERATORS_BY_NAME[operator]?.arity;
  const choices = choicesFor(property);

  if (arity === "flag") {
    return (
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select
          value={value === false ? "false" : "true"}
          onChange={(event) => onChange(event.target.value === "true")}
          inputProps={{ "aria-label": pick(language, "Value", "Valeur") }}
        >
          <MenuItem value="true">{pick(language, "yes", "oui")}</MenuItem>
          <MenuItem value="false">{pick(language, "no", "non")}</MenuItem>
        </Select>
      </FormControl>
    );
  }

  if (arity === "list") {
    const selected = Array.isArray(value) ? value : [];

    if (choices) {
      return (
        <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
          <Select
            multiple
            value={selected}
            onChange={(event) => onChange(event.target.value)}
            renderValue={(picked) => (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {picked.map((item) => (
                  <Chip key={item} size="small" label={String(item)} />
                ))}
              </Stack>
            )}
            inputProps={{ "aria-label": pick(language, "Values", "Valeurs") }}
          >
            {choices.map((choice) => (
              <MenuItem key={String(choice)} value={choice}>
                {String(choice)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    return (
      <TextField
        size="small"
        sx={{ flex: 1, minWidth: 180 }}
        label={pick(language, "Values (comma separated)", "Valeurs (séparées par des virgules)")}
        value={selected.join(", ")}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(",")
              .map((part) => coerce(part.trim(), property))
              .filter((part) => part !== "")
          )
        }
      />
    );
  }

  if (choices) {
    return (
      <FormControl size="small" sx={{ minWidth: 180, flex: 1 }}>
        <Select
          value={choices.includes(value) ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          inputProps={{ "aria-label": pick(language, "Value", "Valeur") }}
        >
          {choices.map((choice) => (
            <MenuItem key={String(choice)} value={choice}>
              {String(choice)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <TextField
      size="small"
      sx={{ flex: 1, minWidth: 160 }}
      label={pick(language, "Value", "Valeur")}
      value={value === undefined || value === null ? "" : String(value)}
      onChange={(event) => onChange(coerce(event.target.value, property))}
    />
  );
}

export default function VisibleIfEditor({
  jsonSchema,
  value,
  onChange,
  language,
  excludeField,
  label,
}) {
  // Several of these editors can be on screen at once (one per step, one for
  // the selected field), so label/control ids have to be unique per instance.
  const baseId = useId();
  const properties = jsonSchema?.properties || {};
  // A field cannot be conditioned on itself: hiding it would remove the very
  // input that controls it.
  const fieldNames = Object.keys(properties).filter(
    (name) => name !== excludeField
  );

  const parsed = readRule(value);
  // A step and a field can each carry a rule, and their controls are identical.
  // Naming the group is what tells them apart — for a screen reader as much as
  // for a test.
  const heading = label || pick(language, "Visible when", "Visible lorsque");

  if (!parsed) {
    return (
      <Box role="group" aria-label={heading}>
        <Typography variant="subtitle2" gutterBottom>
          {heading}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          {pick(
            language,
            "This rule is more complex than the builder can edit. It is left exactly as written — switch to the JSON view to change it.",
            "Cette règle dépasse ce que le générateur peut modifier. Elle est laissée telle quelle — passez à la vue JSON pour la changer."
          )}
        </Typography>
        <Box
          component="pre"
          sx={{
            fontFamily: "monospace",
            fontSize: 12,
            bgcolor: "action.hover",
            p: 1,
            mt: 1,
            borderRadius: 1,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(value, null, 2)}
        </Box>
      </Box>
    );
  }

  const { mode, conditions } = parsed;

  const emit = (nextMode, nextConditions) =>
    onChange(writeRule(nextMode, nextConditions));

  const addCondition = () => {
    const field = fieldNames[0];
    if (!field) return;
    const condition = {
      field,
      operator: "equals",
      value: defaultValue("equals", properties[field]),
    };
    const next = [...conditions, condition];
    emit(next.length > 1 && mode === "single" ? "allOf" : mode === "none" ? "single" : mode, next);
  };

  const updateCondition = (index, patch) => {
    const next = conditions.map((condition, i) =>
      i === index ? { ...condition, ...patch } : condition
    );
    emit(mode, next);
  };

  const removeCondition = (index) => {
    const next = conditions.filter((_condition, i) => i !== index);
    emit(next.length ? mode : "none", next);
  };

  return (
    <Box role="group" aria-label={heading}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle2">{heading}</Typography>
        {conditions.length > 1 && (
          <FormControl size="small">
            <Select
              value={mode}
              onChange={(event) => emit(event.target.value, conditions)}
              inputProps={{ "aria-label": pick(language, "Combine", "Combiner") }}
            >
              <MenuItem value="allOf">{pick(language, "all match", "toutes")}</MenuItem>
              <MenuItem value="anyOf">{pick(language, "any match", "au moins une")}</MenuItem>
            </Select>
          </FormControl>
        )}
      </Stack>

      {conditions.length === 0 && (
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
          {pick(language, "Always visible.", "Toujours visible.")}
        </Typography>
      )}

      <Stack spacing={1}>
        {conditions.map((condition, index) => {
          const property = properties[condition.field];
          return (
            <Stack
              // Conditions have no stable identity of their own; position is the
              // only handle, and the list is short and rebuilt on every edit.
              key={index}
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id={`${baseId}-field-${index}`}>
                  {pick(language, "Field", "Champ")}
                </InputLabel>
                <Select
                  labelId={`${baseId}-field-${index}`}
                  label={pick(language, "Field", "Champ")}
                  value={fieldNames.includes(condition.field) ? condition.field : ""}
                  onChange={(event) => {
                    const field = event.target.value;
                    updateCondition(index, {
                      field,
                      value: defaultValue(condition.operator, properties[field]),
                    });
                  }}
                >
                  {fieldNames.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel id={`${baseId}-operator-${index}`}>
                  {pick(language, "Comparison", "Comparaison")}
                </InputLabel>
                <Select
                  labelId={`${baseId}-operator-${index}`}
                  label={pick(language, "Comparison", "Comparaison")}
                  value={condition.operator}
                  onChange={(event) => {
                    const operator = event.target.value;
                    updateCondition(index, {
                      operator,
                      value: defaultValue(operator, property),
                    });
                  }}
                >
                  {PREDICATE_OPERATORS.map((operator) => (
                    <MenuItem key={operator.name} value={operator.name}>
                      {operator.label[language] || operator.label.en}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <ValueInput
                operator={condition.operator}
                property={property}
                value={condition.value}
                language={language}
                onChange={(next) => updateCondition(index, { value: next })}
              />

              <IconButton
                size="small"
                aria-label={pick(language, "Remove condition", "Retirer la condition")}
                onClick={() => removeCondition(index)}
              >
                <Close fontSize="small" />
              </IconButton>
            </Stack>
          );
        })}
      </Stack>

      <Button
        size="small"
        startIcon={<Add />}
        disabled={fieldNames.length === 0}
        onClick={addCondition}
        sx={{ mt: 1 }}
      >
        {conditions.length
          ? pick(language, "Add condition", "Ajouter une condition")
          : pick(language, "Only show conditionally", "Afficher sous condition")}
      </Button>
    </Box>
  );
}
