import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { ChoiceInput } from "@/components/fields/ChoiceInput";
import { Field } from "@/components/fields/Field";
import { Repeater } from "@/components/fields/Repeater";
import { TextInput } from "@/components/fields/TextInput";
import { useTheme } from "@/theme/ThemeProvider";

import type { SectionProps } from "./types";

interface Taxon {
  scientificName?: string;
  [key: string]: unknown;
}

/**
 * Species.
 *
 * GBIF lookup is a later addition; free-text entry is the offline-safe path and
 * the record stores whatever object it is given. `noTaxa` is the explicit
 * escape hatch, and the only reason a blank record is not submittable.
 */
export function SpeciesSection({ document, update }: SectionProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const noTaxa = Boolean(document.noTaxa);
  const taxa = (document.taxa as Taxon[]) ?? [];

  return (
    <>
      <Field label={t("sections.species")} help={t("species.help")} required>
        <ChoiceInput
          multiple
          choices={[{ value: "yes", label: t("species.noTaxa") }]}
          selected={noTaxa ? ["yes"] : []}
          onChange={(next) => update("noTaxa", next.length > 0)}
        />
      </Field>

      {!noTaxa ? (
        <Field label={t("species.scientificName")}>
          <Repeater<Taxon>
            items={taxa}
            onChange={(next) => update("taxa", next)}
            makeEmpty={() => ({ scientificName: "" })}
            addLabel={t("species.scientificName")}
            renderTitle={(taxon) => taxon.scientificName ?? ""}
            renderEditor={(taxon, set) => (
              <View style={{ gap: 4 }}>
                <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                  {t("species.scientificName")}
                </Text>
                <TextInput
                  value={taxon.scientificName ?? ""}
                  onChangeText={(next) => set({ ...taxon, scientificName: next })}
                  accessibilityLabel={t("species.scientificName")}
                />
              </View>
            )}
          />
        </Field>
      ) : null}
    </>
  );
}
