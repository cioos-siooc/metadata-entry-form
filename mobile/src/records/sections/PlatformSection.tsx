import { getBlankInstrument, getBlankPlatform } from "@cioos/shared/blankRecord.js";
import { localized } from "@cioos/shared/localized.js";
import platformTypes from "@cioos/shared/platforms.json";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { LibraryPicker } from "@/components/LibraryPicker";
import { LibraryAddButton, SaveToLibrary } from "@/components/SaveToLibrary";
import { BilingualTextInput } from "@/components/fields/BilingualTextInput";
import { ChoiceInput, type Choice } from "@/components/fields/ChoiceInput";
import { Field } from "@/components/fields/Field";
import { Repeater } from "@/components/fields/Repeater";
import { TextInput } from "@/components/fields/TextInput";
import type { Language } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

import type { SectionProps } from "./types";

interface Platform {
  type?: string;
  id?: string;
  description?: { en: string; fr: string };
  [key: string]: unknown;
}
interface Instrument {
  id?: string;
  manufacturer?: string;
  version?: string;
  type?: { en: string; fr: string };
  description?: { en: string; fr: string };
  [key: string]: unknown;
}

/**
 * Platform and instruments — the gear, read off the hardware in front of you.
 *
 * 81 platform types, each with a definition. Searchable rather than a dropdown,
 * for the same reason as the EOVs: the definitions are the point, and the web
 * app hides them in tooltips.
 */
export function PlatformSection({ document, update }: SectionProps) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const [typeFilter, setTypeFilter] = useState("");
  const [picking, setPicking] = useState<null | "platforms" | "instruments">(null);

  const noPlatform = Boolean(document.noPlatform);
  const platforms = (document.platforms as Platform[]) ?? [];
  const instruments = (document.instruments as Instrument[]) ?? [];

  const typeChoices = useMemo<Choice[]>(() => {
    const query = typeFilter.trim().toLowerCase();
    return (platformTypes as Record<string, unknown>[])
      .map((entry) => ({
        value: (localized(entry, "en", "label") ?? "") as string,
        label: (localized(entry, language, "label") ?? "") as string,
        description: localized(entry, language, "definition"),
      }))
      .filter((choice) => choice.value && (!query || choice.label.toLowerCase().includes(query)));
  }, [typeFilter, language]);

  return (
    <>
      <Field label={t("sections.platform")} help={t("platformSection.help")} required>
        <ChoiceInput
          multiple
          choices={[{ value: "yes", label: t("platformSection.noPlatform") }]}
          selected={noPlatform ? ["yes"] : []}
          onChange={(next) => update("noPlatform", next.length > 0)}
        />
      </Field>

      {!noPlatform ? (
        <>
          <Field label={t("sections.platform")}>
            <Repeater<Platform>
              items={platforms}
              onChange={(next) => update("platforms", next)}
              makeEmpty={() => getBlankPlatform() as Platform}
              addLabel={t("repeater.addPlatform")}
              renderTitle={(platform) => platform.id || platform.type || ""}
              secondaryAdd={
                <LibraryAddButton
                  label={t("library.addFrom.platforms")}
                  onPress={() => setPicking("platforms")}
                />
              }
              renderItemActions={(platform) => (
                <SaveToLibrary kind="platforms" data={platform as Record<string, unknown>} />
              )}
              renderEditor={(platform, set) => (
                <View style={{ gap: theme.space.md }}>
                  <View style={{ gap: 4 }}>
                    <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                      {t("platformSection.id")}
                    </Text>
                    <TextInput
                      mono
                      value={platform.id ?? ""}
                      onChangeText={(next) => set({ ...platform, id: next })}
                      accessibilityLabel={t("platformSection.id")}
                    />
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                      {t("platformSection.type")}
                    </Text>
                    <TextInput
                      value={typeFilter}
                      onChangeText={setTypeFilter}
                      placeholder={t("platformSection.type")}
                      accessibilityLabel={t("platformSection.type")}
                    />
                    <ChoiceInput
                      choices={typeChoices}
                      selected={platform.type ? [platform.type] : []}
                      onChange={(next) => set({ ...platform, type: next[0] ?? "" })}
                    />
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                      {t("platformSection.description")}
                    </Text>
                    <BilingualTextInput
                      multiline
                      value={platform.description}
                      onChange={(next) => set({ ...platform, description: next })}
                    />
                  </View>
                </View>
              )}
            />
          </Field>

          <Field label={t("platformSection.instruments")}>
            <Repeater<Instrument>
              items={instruments}
              onChange={(next) => update("instruments", next)}
              makeEmpty={() => getBlankInstrument() as Instrument}
              addLabel={t("repeater.addInstrument")}
              renderTitle={(instrument) => instrument.id || instrument.manufacturer || ""}
              secondaryAdd={
                <LibraryAddButton
                  label={t("library.addFrom.instruments")}
                  onPress={() => setPicking("instruments")}
                />
              }
              renderItemActions={(instrument) => (
                <SaveToLibrary kind="instruments" data={instrument as Record<string, unknown>} />
              )}
              renderEditor={(instrument, set) => (
                <View style={{ gap: theme.space.md }}>
                  {(
                    [
                      ["id", "platformSection.id"],
                      ["manufacturer", "platformSection.manufacturer"],
                      ["version", "platformSection.version"],
                    ] as const
                  ).map(([field, labelKey]) => (
                    <View key={field} style={{ gap: 4 }}>
                      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                        {t(labelKey)}
                      </Text>
                      <TextInput
                        mono={field !== "manufacturer"}
                        value={(instrument[field] as string) ?? ""}
                        onChangeText={(next) => set({ ...instrument, [field]: next })}
                        accessibilityLabel={t(labelKey)}
                      />
                    </View>
                  ))}

                  <View style={{ gap: 4 }}>
                    <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                      {t("platformSection.description")}
                    </Text>
                    <BilingualTextInput
                      multiline
                      value={instrument.description}
                      onChange={(next) => set({ ...instrument, description: next })}
                    />
                  </View>
                </View>
              )}
            />
          </Field>
        </>
      ) : null}

      <LibraryPicker
        visible={picking === "platforms"}
        kind="platforms"
        titleFor={(data) => ((data.id as string) || (data.type as string)) ?? ""}
        subtitleFor={(data) => (data.type as string) ?? ""}
        onPick={(data) => update("platforms", [...platforms, data as Platform])}
        onClose={() => setPicking(null)}
      />

      <LibraryPicker
        visible={picking === "instruments"}
        kind="instruments"
        titleFor={(data) => ((data.id as string) || (data.manufacturer as string)) ?? ""}
        subtitleFor={(data) => (data.manufacturer as string) ?? ""}
        onPick={(data) => update("instruments", [...instruments, data as Instrument])}
        onClose={() => setPicking(null)}
      />
    </>
  );
}
