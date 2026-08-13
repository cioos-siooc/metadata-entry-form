/**
 * How wide a schema-driven input should be, and who owns its label.
 *
 * Both questions used to be answered by accident, and both answers were wrong.
 *
 * WIDTH. rjsf's MUI theme renders a bare `<TextField>` with no `fullWidth`, so
 * MUI sizes it to its content. An empty `<TextField select>` has no content, so
 * every dropdown in the form collapsed to about one character wide — a 24px box
 * showing "W▾" where "Weather" belonged. Meanwhile the date inputs set their own
 * `fullWidth` and spanned the whole card, so the form had no consistent measure
 * at all.
 *
 * Making everything `fullWidth` fixes the dropdowns but overcorrects: a
 * two-digit wind speed in a 900px box is just as hard to read as a one-character
 * dropdown, and it gives no hint about what belongs in the field. So inputs are
 * full width up to a CAP derived from what the field actually holds. Widths are
 * in `ch` so they scale with the font rather than fighting it.
 *
 * LABELS. rjsf hands the widget the same label the FieldTemplate already drew as
 * the question heading, so every field was labelled twice — once as a heading,
 * once as MUI's floating label ("Site latitude" above "Site latitude *" inside).
 * The rule is now explicit: exactly one VISIBLE label per input. The question
 * heading owns it, because that heading is what carries the bilingual title and
 * the markdown help; the widget suppresses its own copy. Inside a `ui:groups` box
 * the heading belongs to the group, so there the input keeps its own label —
 * otherwise the fields in the box would be unidentifiable.
 *
 * Suppressing the visible label must not take the input's ACCESSIBLE NAME with
 * it. A heading rendered in a sibling Paper is not a label as far as assistive
 * technology is concerned, so an input whose MUI label is hidden carries the same
 * text as an `aria-label` instead. Skipping that turns every field in the form
 * into an unnamed text box for a screen reader — and it is invisible in a
 * screenshot, which is exactly why it is written down here.
 *
 * Pure functions, no React, so the rules are unit-testable on their own.
 */

/** Enough room for a value of this many characters, plus the input's chrome. */
const ch = (count) => `${count}ch`;

/** Caps by what the field holds. Anything not listed fills its container. */
const CAPS = {
  // Wide enough for a signed decimal degree — "-123.12345" — plus the number
  // input's spinner, which eats a few characters of the visible width.
  number: 20,
  date: 20,
  dateTime: 28,
  // A select is sized to its longest option: narrower and the choice is
  // truncated, wider and it advertises room the field cannot use.
  enumMin: 20,
  enumMax: 60,
  enumPadding: 8,
  // A string the schema says is short — a sample id, a station code — should
  // look short.
  shortString: 26,
  shortStringMaxLength: 24,
};

const longest = (values) =>
  values.reduce((max, value) => Math.max(max, String(value ?? "").length), 0);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Largest sensible width for an input, as a CSS length, or `undefined` to let
 * it fill the available space.
 *
 * @param {Object} schema         the property's JSON Schema
 * @param {Object} [options]      resolved `ui:options`
 * @param {Array}  [enumOptions]  rjsf's resolved enum options, when it has them
 */
export function inputMaxWidth(schema = {}, options = {}, enumOptions) {
  // An author who genuinely wants the full measure can say so, and a multiline
  // input always wants it.
  if (options.fullWidth || options.multiline || options.rows) return undefined;

  const choices =
    (Array.isArray(enumOptions) && enumOptions.length
      ? enumOptions.map((option) => option.label ?? option.value)
      : null) ||
    schema.enum ||
    schema.items?.enum;

  if (Array.isArray(choices) && choices.length) {
    return ch(
      clamp(
        longest(choices) + CAPS.enumPadding,
        CAPS.enumMin,
        CAPS.enumMax
      )
    );
  }

  if (schema.type === "number" || schema.type === "integer") {
    return ch(CAPS.number);
  }

  if (schema.type === "string") {
    const format = options.format || schema.format;
    if (format === "date") return ch(CAPS.date);
    if (format === "date-time") return ch(CAPS.dateTime);
    if (
      typeof schema.maxLength === "number" &&
      schema.maxLength <= CAPS.shortStringMaxLength
    ) {
      return ch(CAPS.shortString);
    }
  }

  return undefined;
}

/**
 * Whether the input should suppress the label rjsf handed it.
 *
 * True in the normal case: the question heading above already says it.
 *
 * The `inGroup` escape hatch is for a caller that draws one shared heading over
 * several fields — there the heading names the group, not the field, so each
 * input has to keep its own label or the fields inside the box are
 * indistinguishable. Nothing sets it yet; it is the hook a grouped layout uses.
 */
export function inputHidesOwnLabel(uiSchema = {}) {
  return !uiSchema["ui:options"]?.inGroup;
}

/**
 * Presentation every schema-driven input shares.
 *
 * `fullWidth` with a `maxWidth` — rather than a fixed width — means an input
 * shrinks on a phone and stops growing on a monitor.
 *
 * `ariaLabel` is returned rather than applied because each widget takes it by a
 * different route: rjsf's BaseInputTemplate merges a `slotProps.htmlInput`, while
 * its SelectWidget rebuilds `slotProps` from scratch and only reads what arrives
 * through `ui:options.mui`. The callers place it; this decides whether it is
 * needed at all.
 *
 * @param {string} [name] the question's title, used as the accessible name
 */
export function inputPresentation(schema, uiSchema, options = {}, enumOptions, name) {
  const maxWidth = inputMaxWidth(schema, options, enumOptions);
  const hideLabel = inputHidesOwnLabel(uiSchema);

  return {
    fullWidth: true,
    hideLabel,
    sx: maxWidth ? { maxWidth } : undefined,
    ariaLabel: hideLabel && name ? name : undefined,
  };
}
