import {
  getErrorsByTab,
  percentValid,
  validateField,
  validators,
} from "@cioos/shared/validate.js";

/**
 * The completeness ledger.
 *
 * This is the organising device of the whole app: a record has 48 fields, 21 of
 * them required, spread across eight sections, filled in by someone who is
 * interrupted constantly. So validation state is surfaced everywhere rather
 * than hidden behind a submit button.
 *
 * It carries TWO independent signals, and it needs both:
 *
 *   satisfied/required — from `validators`, the actual submit gate.
 *   filled/total       — how much of the section holds anything at all.
 *
 * Neither alone tells the truth. Six validators pass *vacuously* on an empty
 * record (map, platforms, instruments, history, associated_resources,
 * eovDeprecated), so a validator-only ledger would show Where and Platform as
 * done while they are untouched. And the When section has no validators
 * whatsoever — dates are not validated — so it has no gate to report at all.
 */

export type SectionId =
  | "identification"
  | "about"
  | "when"
  | "where"
  | "who"
  | "platform"
  | "species"
  | "resources";

export type SectionState =
  /** Nothing entered, and nothing outstanding. */
  | "empty"
  /** Something required is missing. Takes precedence over everything. */
  | "attention"
  /** Every required field satisfied. */
  | "complete"
  /** Has content, and nothing here is required. */
  | "filled";

interface SectionDefinition {
  id: SectionId;
  /** Keys in `validators[].tab` that belong to this section. */
  validatorTabs: string[];
  /** Record fields counted for the filled/total signal. */
  fields: string[];
}

/**
 * Section grouping. Follows the existing `validators[].tab` keys so the ledger
 * and the error report can never disagree — with one deliberate regrouping:
 * dates are pulled out of `dataID` into their own When section. They are a
 * coherent, quick, field-relevant task, and burying them among fifty controls
 * is why the web app's Identification tab is its worst screen on a phone.
 */
const SECTIONS: SectionDefinition[] = [
  {
    id: "identification",
    validatorTabs: ["start"],
    fields: ["title", "resourceType", "metadataScope", "datasetIdentifier"],
  },
  {
    id: "about",
    validatorTabs: ["dataID"],
    fields: [
      "abstract",
      "keywords",
      "eov",
      "progress",
      "language",
      "license",
      "limitations",
      "projects",
    ],
  },
  {
    id: "when",
    validatorTabs: [],
    fields: ["dateStart", "dateEnd", "datePublished", "dateRevised", "edition"],
  },
  {
    id: "where",
    validatorTabs: ["spatial"],
    fields: [
      "map",
      "verticalExtentMin",
      "verticalExtentMax",
      "verticalExtentDirection",
      "verticalExtentEPSG",
      // "there is no vertical extent" is an answer, not an absence.
      "noVerticalExtent",
    ],
  },
  { id: "who", validatorTabs: ["contacts"], fields: ["contacts"] },
  {
    id: "platform",
    validatorTabs: ["platform", "platformInstruments"],
    fields: ["platforms", "instruments", "noPlatform"],
  },
  { id: "species", validatorTabs: ["taxa"], fields: ["taxa", "noTaxa"] },
  {
    id: "resources",
    validatorTabs: ["resources", "relatedworks", "lineage"],
    fields: ["distribution", "associated_resources", "history"],
  },
];

export interface BilingualValue {
  en?: string | string[];
  fr?: string | string[];
}

type RecordLike = Record<string, unknown>;

/** True when a field holds something a person actually entered. */
export function fieldIsFilled(record: RecordLike, field: string): boolean {
  const value = record[field];

  if (value === null || value === undefined || value === "") return false;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.length > 0;

  if (typeof value === "object") {
    const entries = Object.values(value as Record<string, unknown>);
    // Covers both `{en, fr}` text and `{en: [], fr: []}` keywords, and the
    // nested `map` object, without special-casing any of them.
    return entries.some((inner) => {
      if (inner === null || inner === undefined || inner === "") return false;
      if (Array.isArray(inner)) return inner.length > 0;
      if (typeof inner === "object") {
        return Object.values(inner as Record<string, unknown>).some(
          (leaf) => leaf !== null && leaf !== undefined && leaf !== "",
        );
      }
      return true;
    });
  }

  return true;
}

export interface LedgerSection {
  id: SectionId;
  /** Required validators in this section. */
  required: number;
  /** How many of them currently pass. */
  satisfied: number;
  /** Fields holding content. */
  filled: number;
  /** Fields the section covers. */
  total: number;
  state: SectionState;
  /** Has the user entered anything here? Lets the UI keep an untouched but
   *  required section quieter than one left half-finished. */
  touched: boolean;
  /** Bilingual error objects for whatever is outstanding. */
  errors: { en: string; fr: string }[];
}

export interface Ledger {
  sections: LedgerSection[];
  /** The submit gate, 0..1 — `percentValid` verbatim. */
  percent: number;
  requiredTotal: number;
  requiredSatisfied: number;
  /** True when every required validator passes. */
  submittable: boolean;
}

function sectionState(
  required: number,
  satisfied: number,
  filled: number,
): SectionState {
  // Outstanding requirements come first. Picking a theme makes the spatial
  // section required even while it is still empty, and calling that "empty" —
  // though accurate — hides the fact that it now blocks submission. Use
  // `touched` to render an untouched-but-required section more quietly than one
  // the user started and left incomplete.
  if (satisfied < required) return "attention";

  // Emptiness beats a vacuous pass: six validators pass on an empty record, and
  // a section holding nothing must never claim to be done.
  if (filled === 0) return "empty";

  return required === 0 ? "filled" : "complete";
}

export function buildLedger(record: RecordLike): Ledger {
  const errorsByTab = getErrorsByTab(record) as Record<
    string,
    { en: string; fr: string }[]
  >;

  const sections = SECTIONS.map<LedgerSection>((definition) => {
    const fields = Object.entries(validators as Record<string, { tab: string; optional?: boolean }>)
      .filter(([, v]) => definition.validatorTabs.includes(v.tab) && !v.optional)
      .map(([field]) => field);

    const satisfied = fields.filter((field) => validateField(record, field)).length;
    const filled = definition.fields.filter((field) => fieldIsFilled(record, field)).length;

    return {
      id: definition.id,
      required: fields.length,
      satisfied,
      filled,
      total: definition.fields.length,
      state: sectionState(fields.length, satisfied, filled),
      touched: filled > 0,
      errors: definition.validatorTabs.flatMap((tab) => errorsByTab[tab] ?? []),
    };
  });

  const requiredTotal = sections.reduce((sum, s) => sum + s.required, 0);
  const requiredSatisfied = sections.reduce((sum, s) => sum + s.satisfied, 0);

  return {
    sections,
    percent: percentValid(record),
    requiredTotal,
    requiredSatisfied,
    submittable: requiredSatisfied === requiredTotal,
  };
}

/** Sections in display order. */
export const SECTION_ORDER: SectionId[] = SECTIONS.map((s) => s.id);
