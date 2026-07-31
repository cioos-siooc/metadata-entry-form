import { useTranslation } from "react-i18next";

import { DateInput } from "@/components/fields/DateInput";
import { Field } from "@/components/fields/Field";
import { TextInput } from "@/components/fields/TextInput";

import type { SectionProps } from "./types";

/**
 * When.
 *
 * Pulled out of the web app's Identification tab deliberately: dates are a
 * coherent, quick, field-relevant task, and no validator covers them — so this
 * section reports fields filled rather than requirements met.
 */
export function WhenSection({ document, update }: SectionProps) {
  const { t } = useTranslation();

  return (
    <>
      <Field label={t("when.start")} help={t("when.collectionHelp")}>
        <DateInput
          label={t("when.start")}
          value={document.dateStart}
          maximum={document.dateEnd}
          onChange={(next) => update("dateStart", next)}
        />
      </Field>

      <Field label={t("when.end")}>
        <DateInput
          label={t("when.end")}
          value={document.dateEnd}
          minimum={document.dateStart}
          onChange={(next) => update("dateEnd", next)}
        />
      </Field>

      <Field label={t("when.published")}>
        <DateInput
          label={t("when.published")}
          value={document.datePublished}
          onChange={(next) => update("datePublished", next)}
        />
      </Field>

      <Field label={t("when.revised")}>
        <DateInput
          label={t("when.revised")}
          value={document.dateRevised}
          onChange={(next) => update("dateRevised", next)}
        />
      </Field>

      <Field label={t("when.edition")} help={t("when.editionHelp")}>
        <TextInput
          mono
          value={(document.edition as string) ?? ""}
          onChangeText={(next) => update("edition", next)}
          accessibilityLabel={t("when.edition")}
        />
      </Field>
    </>
  );
}
