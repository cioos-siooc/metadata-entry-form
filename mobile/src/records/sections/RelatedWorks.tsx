import associationTypeToIso from "@cioos/shared/associationTypeMapping.js";
import { associationTypeCode } from "@cioos/shared/isoCodeLists.js";
import { localized } from "@cioos/shared/localized.js";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { BilingualTextInput } from "@/components/fields/BilingualTextInput";
import { ChoiceInput, type Choice } from "@/components/fields/ChoiceInput";
import { Field } from "@/components/fields/Field";
import { IdentifierInput } from "@/components/fields/IdentifierInput";
import { Repeater } from "@/components/fields/Repeater";
import type { Language } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

export interface RelatedWork {
  title?: { en: string; fr: string };
  authority?: string;
  code?: string;
  association_type?: string;
  association_type_iso?: string;
  [key: string]: unknown;
}

/**
 * Related works — papers, datasets and versions this record points at.
 *
 * Optional as a whole, but a half-filled entry blocks submission: the validator
 * demands a title in *both* languages plus an identifier, its authority and a
 * relation type on every entry. So each field is marked, rather than the
 * section being marked required, which would be a lie.
 *
 * `association_type_iso` is written alongside the relation the user picks. It
 * is what the ISO output carries, and nothing else in the app derives it.
 */
export function RelatedWorksField({
  works,
  onChange,
}: {
  works: RelatedWork[];
  onChange: (next: RelatedWork[]) => void;
}) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;

  const associationChoices = useMemo<Choice[]>(
    () =>
      Object.entries(
        associationTypeCode as Record<
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
    <Field label={t("related.title")} help={t("related.help")}>
      <Repeater<RelatedWork>
        items={works}
        onChange={onChange}
        makeEmpty={() => ({
          title: { en: "", fr: "" },
          authority: "",
          code: "",
          association_type: "",
          association_type_iso: "",
        })}
        addLabel={t("related.add")}
        renderTitle={(work) => (work.title && localized(work.title, language)) || work.code || ""}
        renderEditor={(work, set) => (
          <View style={{ gap: theme.space.md }}>
            <View style={{ gap: 4 }}>
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {t("related.workTitle")}
              </Text>
              <BilingualTextInput
                value={work.title}
                onChange={(next) => set({ ...work, title: next })}
              />
            </View>

            <IdentifierInput
              code={work.code ?? ""}
              authority={work.authority ?? ""}
              onChange={(next) => set({ ...work, ...next })}
            />

            <View style={{ gap: 4 }}>
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {t("related.relation")}
              </Text>
              <ChoiceInput
                choices={associationChoices}
                selected={work.association_type ? [work.association_type] : []}
                onChange={(next) => {
                  const type = next[0] ?? "";
                  set({
                    ...work,
                    association_type: type,
                    association_type_iso:
                      (associationTypeToIso as Record<string, string>)[type] ?? "",
                  });
                }}
              />
            </View>
          </View>
        )}
      />
    </Field>
  );
}
