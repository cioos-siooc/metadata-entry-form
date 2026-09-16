import { metadataScopeCodes } from "@cioos/shared/isoCodeLists.js";
import { localized } from "@cioos/shared/localized.js";
import { normalizeResourceType } from "@cioos/shared/normalizeResourceType.js";
import { topicCategories } from "@cioos/shared/themes.js";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { DoiPanel } from "@/components/DoiPanel";
import { BilingualTextInput } from "@/components/fields/BilingualTextInput";
import { ChoiceInput, type Choice } from "@/components/fields/ChoiceInput";
import { Field } from "@/components/fields/Field";
import type { Language } from "@/i18n";

import type { SectionProps } from "./types";

/**
 * Title, theme and scope — the three things that must exist first, plus the
 * record's DOI, which lives here because it identifies the dataset rather than
 * describing it.
 */
/** The ISO code for a scope name, e.g. "Dataset" → "dataset". */
function scopeIsoFor(scope: string): string {
  const entry = (metadataScopeCodes as Record<string, { isoValue?: string }>)[scope];
  return entry?.isoValue ?? "";
}

export function IdentificationSection({ document, update }: SectionProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;

  // ISO 19115 topic categories, prominent ones first. Legacy values
  // ("oceanographic", "biological") are mapped on read so they still show selected.
  const themeChoices = useMemo<Choice[]>(() => {
    const entries = Object.entries(
      topicCategories as Record<string, { title: Record<string, string>; prominent: boolean }>,
    );
    return [...entries.filter(([, c]) => c.prominent), ...entries.filter(([, c]) => !c.prominent)].map(
      ([value, c]) => ({ value, label: c.title[language] ?? c.title.en }),
    );
  }, [language]);

  const scopeChoices = useMemo<Choice[]>(
    () =>
      Object.entries(
        metadataScopeCodes as Record<
          string,
          { title?: Record<string, string>; text?: Record<string, string> }
        >,
      ).map(([value, entry]) => ({
        value,
        label: localized(entry.title ?? {}, language) ?? value,
        description: localized(entry.text ?? {}, language),
      })),
    [language],
  );

  return (
    <>
      <Field label={t("identification.titleLabel")} help={t("identification.titleHelp")} required>
        <BilingualTextInput
          value={document.title as { en: string; fr: string }}
          onChange={(next) => update("title", next)}
        />
      </Field>

      <Field label={t("identification.themeLabel")} help={t("identification.themeHelp")} required>
        <ChoiceInput
          multiple
          choices={themeChoices}
          selected={normalizeResourceType(document.resourceType)}
          onChange={(next) => update("resourceType", next)}
        />
      </Field>

      <Field label={t("identification.scopeLabel")} help={t("identification.scopeHelp")} required>
        <ChoiceInput
          choices={scopeChoices}
          selected={document.metadataScope ? [document.metadataScope as string] : []}
          onChange={(next) => {
            const scope = next[0] ?? "";
            update("metadataScope", scope);
            // The ISO value travels with it: the converter reads
            // metadataScopeIso, and the platform section keys off it, so a
            // scope without one produces a record that converts wrongly.
            update("metadataScopeIso", scopeIsoFor(scope));
          }}
        />
      </Field>

      <DoiPanel document={document} update={update} />
    </>
  );
}
