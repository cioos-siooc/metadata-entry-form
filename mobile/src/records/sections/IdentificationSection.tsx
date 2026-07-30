import { metadataScopeCodes } from "@cioos/shared/isoCodeLists.js";
import { localized } from "@cioos/shared/localized.js";
import themesList from "@cioos/shared/themes.js";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { BilingualTextInput } from "@/components/fields/BilingualTextInput";
import { ChoiceInput, type Choice } from "@/components/fields/ChoiceInput";
import { Field } from "@/components/fields/Field";
import type { Language } from "@/i18n";

import type { SectionProps } from "./types";

/** Title, theme and scope — the three things that must exist first. */
export function IdentificationSection({ document, update }: SectionProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;

  // `themesList` is a parallel en/fr array rather than a keyed vocabulary, so
  // the record's stored value is the lowercased English label.
  const themeChoices = useMemo<Choice[]>(() => {
    const english = (themesList[0]?.en ?? []) as string[];
    const localizedLabels = ((themesList[0] as Record<string, string[]>)[language] ??
      english) as string[];
    return english.map((label, index) => ({
      value: label.toLowerCase(),
      label: localizedLabels[index] ?? label,
    }));
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
      <Field label={t("records.title")} help={t("identification.titleHelp")} required>
        <BilingualTextInput
          value={document.title as { en: string; fr: string }}
          onChange={(next) => update("title", next)}
        />
      </Field>

      <Field label={t("about.eov")} help={t("identification.themeHelp")} required>
        <ChoiceInput
          multiple
          choices={themeChoices}
          selected={(document.resourceType as string[]) ?? []}
          onChange={(next) => update("resourceType", next)}
        />
      </Field>

      <Field label={t("sections.about")} help={t("identification.scopeHelp")} required>
        <ChoiceInput
          choices={scopeChoices}
          selected={document.metadataScope ? [document.metadataScope as string] : []}
          onChange={(next) => update("metadataScope", next[0] ?? "")}
        />
      </Field>
    </>
  );
}
