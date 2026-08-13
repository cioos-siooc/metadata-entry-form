/**
 * Checks a uiSchema against the JSON Schema it decorates.
 *
 * The renderer is deliberately forgiving: `resolveSteps` drops step fields it
 * doesn't recognise (steps.js:88-90), `evaluate` returns true for rules it can't
 * parse (predicate.js:57-60), and rjsf falls back to the default widget for an
 * unknown `ui:widget`. That forgiveness is right at render time — a form must
 * never break for a respondent — but it means an author gets no signal at all
 * that a typo silently did nothing. This module is that signal.
 *
 * Pure, never throws, and returns problems rather than a boolean, so callers can
 * decide what blocks and what merely warns. Nothing here rejects a uiSchema: a
 * form type that already shipped with a warning must keep saving.
 *
 * Severities:
 *   error   — provably not doing what the author wrote (typo'd field, bad widget)
 *   warning — legal but near-certainly a mistake (duplicate step id, dead config)
 *   info    — a completeness nudge (a field with no bilingual title)
 */

import {
  UI_WIDGETS_BY_NAME,
  PREDICATE_OPERATOR_NAMES,
  PREDICATE_COMBINATORS,
  PREDICATE_CONTEXT_FLAGS,
  RESERVED_STRING_KEYS,
  isScalarProperty,
  widgetsForProperty,
} from "./uiVocabulary";

const ERROR = "error";
const WARNING = "warning";
const INFO = "info";

export { ERROR, WARNING, INFO };

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const list = (names) => names.map((name) => `"${name}"`).join(", ");

/**
 * Walks a `visibleIf` rule.
 *
 * Not built on `referencedFields` from predicate.js: that collects field names
 * into a flat Set, which is enough to know what to watch but loses the position
 * of each reference — and a message that says which branch of an `anyOf` is
 * wrong is worth far more to an author than one that just names the field.
 */
function checkRule(rule, path, properties, push) {
  if (rule === undefined || rule === null || typeof rule === "boolean") return;

  if (!isPlainObject(rule)) {
    push(ERROR, path, "Rule must be an object.", "La règle doit être un objet.");
    return;
  }

  let matched = false;

  ["allOf", "anyOf"].forEach((key) => {
    if (rule[key] === undefined) return;
    matched = true;
    if (!Array.isArray(rule[key])) {
      push(
        ERROR,
        `${path}.${key}`,
        `"${key}" must be an array of rules.`,
        `« ${key} » doit être un tableau de règles.`
      );
      return;
    }
    rule[key].forEach((sub, index) =>
      checkRule(sub, `${path}.${key}[${index}]`, properties, push)
    );
  });

  if (rule.not !== undefined) {
    matched = true;
    checkRule(rule.not, `${path}.not`, properties, push);
  }

  if (rule.context !== undefined) {
    matched = true;
    if (!PREDICATE_CONTEXT_FLAGS.includes(rule.context)) {
      push(
        WARNING,
        `${path}.context`,
        `Unknown context flag "${rule.context}". Known flags: ${list(
          PREDICATE_CONTEXT_FLAGS
        )}.`,
        `Indicateur de contexte inconnu « ${rule.context} ». Connus : ${list(
          PREDICATE_CONTEXT_FLAGS
        )}.`
      );
    }
  }

  if (rule.field !== undefined) {
    matched = true;

    // `field` is a dot path, but only the first segment can be checked against
    // the schema's top-level properties without resolving $refs.
    const root = String(rule.field).split(".")[0];
    if (!(root in properties)) {
      push(
        ERROR,
        `${path}.field`,
        `Refers to "${rule.field}", which is not a property of the JSON Schema. The rule is ignored, so the field is always shown.`,
        `Référence « ${rule.field} », qui n'est pas une propriété du schéma JSON. La règle est ignorée, le champ est donc toujours affiché.`
      );
    }

    const operators = PREDICATE_OPERATOR_NAMES.filter(
      (name) => rule[name] !== undefined
    );
    if (operators.length === 0) {
      push(
        ERROR,
        path,
        `No comparison given. Add one of ${list(
          PREDICATE_OPERATOR_NAMES
        )}, otherwise the rule always passes.`,
        `Aucune comparaison fournie. Ajoutez ${list(
          PREDICATE_OPERATOR_NAMES
        )}, sinon la règle est toujours vraie.`
      );
    } else if (operators.length > 1) {
      // `evaluate` checks operators in a fixed order and returns on the first
      // hit, so the others are dead weight an author would expect to combine.
      push(
        WARNING,
        path,
        `More than one comparison (${list(
          operators
        )}). Only the first is evaluated — use "allOf" to combine them.`,
        `Plusieurs comparaisons (${list(
          operators
        )}). Seule la première est évaluée — utilisez « allOf » pour les combiner.`
      );
    }

    ["in", "notIn"].forEach((key) => {
      if (rule[key] !== undefined && !Array.isArray(rule[key])) {
        push(
          WARNING,
          `${path}.${key}`,
          `"${key}" expects an array of values.`,
          `« ${key} » attend un tableau de valeurs.`
        );
      }
    });
  }

  const known = new Set([
    ...PREDICATE_COMBINATORS,
    ...PREDICATE_OPERATOR_NAMES,
    "field",
    "context",
  ]);
  Object.keys(rule)
    .filter((key) => !known.has(key))
    .forEach((key) => {
      push(
        WARNING,
        `${path}.${key}`,
        `Unknown rule key "${key}" — it has no effect.`,
        `Clé de règle inconnue « ${key} » — sans effet.`
      );
    });

  if (!matched && Object.keys(rule).length === 0) {
    push(
      WARNING,
      path,
      "Empty rule — the field is always shown.",
      "Règle vide — le champ est toujours affiché."
    );
  }
}

function checkSteps(steps, properties, push) {
  if (!Array.isArray(steps)) {
    push(
      ERROR,
      "ui:steps",
      '"ui:steps" must be an array. The form will render as a single page.',
      '« ui:steps » doit être un tableau. Le formulaire s\'affichera sur une seule page.'
    );
    return;
  }

  const seenIds = new Set();
  const claimedBy = new Map();

  steps.forEach((step, index) => {
    const path = `ui:steps[${index}]`;

    if (!isPlainObject(step)) {
      push(ERROR, path, "Step must be an object.", "L'étape doit être un objet.");
      return;
    }

    if (!step.id) {
      // resolveSteps falls back to `step-N`, which then shifts if steps are
      // reordered — and error counts on tabs are keyed by id.
      push(
        WARNING,
        path,
        'Step has no "id". A positional id is generated, which changes if steps are reordered.',
        "L'étape n'a pas d'« id ». Un identifiant positionnel est généré, qui change si les étapes sont réordonnées."
      );
    } else if (seenIds.has(step.id)) {
      push(
        WARNING,
        `${path}.id`,
        `Duplicate step id "${step.id}".`,
        `Identifiant d'étape en double « ${step.id} ».`
      );
    } else {
      seenIds.add(step.id);
    }

    if (step.fields !== undefined && !Array.isArray(step.fields)) {
      push(
        ERROR,
        `${path}.fields`,
        '"fields" must be an array of property names.',
        "« fields » doit être un tableau de noms de propriétés."
      );
    } else {
      (step.fields || []).forEach((name, fieldIndex) => {
        const fieldPath = `${path}.fields[${fieldIndex}]`;
        if (!(name in properties)) {
          push(
            ERROR,
            fieldPath,
            `"${name}" is not a property of the JSON Schema. It is dropped from this step.`,
            `« ${name} » n'est pas une propriété du schéma JSON. Il est retiré de cette étape.`
          );
          return;
        }
        if (claimedBy.has(name)) {
          push(
            WARNING,
            fieldPath,
            `"${name}" is already in step "${claimedBy.get(
              name
            )}". It renders in the first step only.`,
            `« ${name} » est déjà dans l'étape « ${claimedBy.get(
              name
            )} ». Il ne s'affiche que dans la première.`
          );
          return;
        }
        claimedBy.set(name, step.id || `step-${index}`);
      });
    }

    if (!step.title) {
      push(
        INFO,
        `${path}.title`,
        'Step has no bilingual title; the tab falls back to its id.',
        "L'étape n'a pas de titre bilingue ; l'onglet affiche son identifiant."
      );
    }

    if (step.visibleIf !== undefined) {
      checkRule(step.visibleIf, `${path}.visibleIf`, properties, push);
    }
  });
}


function checkSummaryFields(summaryFields, properties, push) {
  if (!Array.isArray(summaryFields)) {
    push(
      ERROR,
      "ui:summaryFields",
      '"ui:summaryFields" must be an array of property names.',
      "« ui:summaryFields » doit être un tableau de noms de propriétés."
    );
    return;
  }

  summaryFields.forEach((name, index) => {
    const path = `ui:summaryFields[${index}]`;
    if (!(name in properties)) {
      push(
        ERROR,
        path,
        `"${name}" is not a property of the JSON Schema. It is dropped from the submissions table.`,
        `« ${name} » n'est pas une propriété du schéma JSON. Il est retiré du tableau des soumissions.`
      );
      return;
    }
    if (!isScalarProperty(properties[name])) {
      push(
        WARNING,
        path,
        `"${name}" is an object or array; it renders as raw JSON in a table cell.`,
        `« ${name} » est un objet ou un tableau ; il s'affiche en JSON brut dans une cellule.`
      );
    }
  });
}


function checkFieldEntry(name, entry, properties, push) {
  if (!isPlainObject(entry)) return;

  const property = properties[name];

  Object.entries(RESERVED_STRING_KEYS).forEach(([key, replacement]) => {
    const value = entry[key];
    if (value !== undefined && typeof value !== "string") {
      push(
        ERROR,
        `${name}.${key}`,
        `"${key}" is a reserved rjsf key that expects a string. Use "${replacement}" for bilingual text — an object here breaks rendering.`,
        `« ${key} » est une clé rjsf réservée qui attend une chaîne. Utilisez « ${replacement} » pour le texte bilingue — un objet ici casse l'affichage.`
      );
    }
  });

  [
    ["ui:widget", "widget"],
    ["ui:field", "field"],
  ].forEach(([key, kind]) => {
    const requested = entry[key];
    if (typeof requested !== "string") return;

    const known = UI_WIDGETS_BY_NAME[requested];
    if (!known || known.kind !== kind) {
      const available = Object.values(UI_WIDGETS_BY_NAME)
        .filter((widget) => widget.kind === kind)
        .map((widget) => widget.name);
      // rjsf ships its own widgets too, so an unrecognised name is not
      // necessarily wrong — hence a warning rather than an error.
      push(
        WARNING,
        `${name}.${key}`,
        `"${requested}" is not one of this app's custom ${kind}s (${list(
          available
        )}). If it is not a built-in rjsf ${kind} either, the default is used.`,
        `« ${requested} » ne fait pas partie des ${kind}s personnalisés (${list(
          available
        )}). Si ce n'est pas non plus un ${kind} rjsf intégré, la valeur par défaut est utilisée.`
      );
      return;
    }

    if (property && !widgetsForProperty(property).some((w) => w.name === requested)) {
      push(
        ERROR,
        `${name}.${key}`,
        `"${requested}" cannot render a property of type "${
          property.type || "unknown"
        }".`,
        `« ${requested} » ne peut pas afficher une propriété de type « ${
          property.type || "inconnu"
        } ».`
      );
    }
  });

  const options = entry["ui:options"];
  if (options !== undefined && !isPlainObject(options)) {
    push(
      ERROR,
      `${name}.ui:options`,
      '"ui:options" must be an object.',
      "« ui:options » doit être un objet.",
    );
    return;
  }

  if (options?.visibleIf !== undefined) {
    checkRule(options.visibleIf, `${name}.ui:options.visibleIf`, properties, push);
  }

  if (options?.i18n !== undefined && !isPlainObject(options.i18n)) {
    push(
      ERROR,
      `${name}.ui:options.i18n`,
      '"i18n" must be an object with "title" and/or "help".',
      "« i18n » doit être un objet avec « title » et/ou « help ».",
    );
    return;
  }

  if (!options?.i18n?.title) {
    push(
      INFO,
      `${name}.ui:options.i18n.title`,
      "No bilingual title; the label falls back to the schema title or the property name.",
      "Aucun titre bilingue ; l'étiquette utilise le titre du schéma ou le nom de la propriété."
    );
  }
}

/**
 * @param {Object} jsonSchema
 * @param {Object} uiSchema
 * @returns {Array<{severity: string, path: string, message: {en: string, fr: string}}>}
 */
export function validateUiSchema(jsonSchema, uiSchema) {
  const problems = [];
  const push = (severity, path, en, fr) =>
    problems.push({ severity, path, message: { en, fr } });

  if (uiSchema === undefined || uiSchema === null) return problems;
  if (!isPlainObject(uiSchema)) {
    push(
      ERROR,
      "",
      "The UI Schema must be a JSON object.",
      "Le schéma d'interface doit être un objet JSON."
    );
    return problems;
  }

  const properties = jsonSchema?.properties || {};

  if (uiSchema["ui:steps"] !== undefined) {
    checkSteps(uiSchema["ui:steps"], properties, push);
  }
  if (uiSchema["ui:summaryFields"] !== undefined) {
    checkSummaryFields(uiSchema["ui:summaryFields"], properties, push);
  }

  Object.entries(uiSchema).forEach(([key, entry]) => {
    if (key.startsWith("ui:")) return;
    if (!(key in properties)) {
      push(
        WARNING,
        key,
        `Configuration for "${key}", which is not a property of the JSON Schema. It has no effect.`,
        `Configuration pour « ${key} », qui n'est pas une propriété du schéma JSON. Sans effet.`
      );
      return;
    }
    checkFieldEntry(key, entry, properties, push);
  });

  // A property with no uiSchema entry at all still deserves the "no bilingual
  // title" nudge, otherwise the completeness check only covers half the form.
  Object.keys(properties)
    .filter((name) => !isPlainObject(uiSchema[name]))
    .forEach((name) => {
      push(
        INFO,
        `${name}.ui:options.i18n.title`,
        "No bilingual title; the label falls back to the schema title or the property name.",
        "Aucun titre bilingue ; l'étiquette utilise le titre du schéma ou le nom de la propriété."
      );
    });

  return problems;
}

/** Convenience for callers that only gate on hard errors. */
export function countBySeverity(problems) {
  return problems.reduce(
    (acc, problem) => ({ ...acc, [problem.severity]: (acc[problem.severity] || 0) + 1 }),
    {}
  );
}
