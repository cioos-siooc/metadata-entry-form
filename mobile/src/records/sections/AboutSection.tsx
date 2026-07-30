import { eovs } from "@cioos/shared/eovs.js";
import { progressCodes } from "@cioos/shared/isoCodeLists.js";
import keywords from "@cioos/shared/keywords.js";
import licenses from "@cioos/shared/licenses.js";
import { localized } from "@cioos/shared/localized.js";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getRegionProjects } from "@/api/records";
import { useSession } from "@/auth/SessionProvider";
import { BilingualTextInput } from "@/components/fields/BilingualTextInput";
import { ChoiceInput, type Choice } from "@/components/fields/ChoiceInput";
import { Field } from "@/components/fields/Field";
import { TextInput } from "@/components/fields/TextInput";
import type { Language } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

import type { SectionProps } from "./types";

/**
 * About the data — the heaviest section, and the one the web app handles worst.
 *
 * Its Identification tab is 702 lines with ~50 controls, of which the 36-EOV
 * block is ~110 lines of checkboxes each carrying a hover tooltip. Here the EOVs
 * are a searchable list with their definitions inline, since a definition behind
 * a tooltip does not exist on touch.
 */
export function AboutSection({ document, update }: SectionProps) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const { region } = useSession();

  // The region's project list, when it has one. Failure is silent: projects are
  // optional, and a section that refuses to render because a side list did not
  // load would be worse than one without it.
  const [projects, setProjects] = useState<string[]>([]);
  useEffect(() => {
    if (!region) return;
    let cancelled = false;
    getRegionProjects(region)
      .then((list) => {
        if (!cancelled) setProjects(list ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [region]);
  const [eovFilter, setEovFilter] = useState("");
  const [keywordDraft, setKeywordDraft] = useState("");

  const eovChoices = useMemo<Choice[]>(() => {
    const query = eovFilter.trim().toLowerCase();
    return (eovs as Record<string, unknown>[])
      .map((entry) => ({
        value: entry.value as string,
        label: localized(entry, language, "label") ?? (entry.value as string),
        description: localized(entry, language, "definition"),
        deprecated: Boolean(entry.deprecated),
      }))
      .filter((choice) => !query || choice.label.toLowerCase().includes(query));
  }, [eovFilter, language]);

  const progressChoices = useMemo<Choice[]>(
    () =>
      Object.entries(
        progressCodes as Record<string, { title?: Record<string, string>; text?: Record<string, string> }>,
      ).map(([value, entry]) => ({
        value,
        label: localized(entry.title ?? {}, language) ?? value,
        description: localized(entry.text ?? {}, language),
      })),
    [language],
  );

  const licenseChoices = useMemo<Choice[]>(
    () =>
      Object.entries(licenses as Record<string, { title?: Record<string, string>; code: string }>).map(
        ([value, entry]) => ({
          value,
          // Most licences carry English only; localized() falls back, which is
          // exactly the case that made the fallback non-optional.
          label: localized(entry.title ?? {}, language) ?? value,
        }),
      ),
    [language],
  );

  const selectedEovs = (document.eov as string[]) ?? [];
  const deprecatedSelected = eovChoices.filter(
    (choice) => choice.deprecated && selectedEovs.includes(choice.value),
  );

  const recordKeywords = (document.keywords as { en?: string[]; fr?: string[] }) ?? {};
  const currentList = recordKeywords[language] ?? [];

  const addKeyword = () => {
    const value = keywordDraft.trim();
    if (!value) return;
    // Also fills the other language from the curated table when it knows a
    // translation — the web app does this locally with no API, and it is the
    // cheapest bilingual win in the whole form.
    const pair = (keywords as { en: string; fr: string }[]).find(
      (k) => k.en.toLowerCase() === value.toLowerCase() || k.fr.toLowerCase() === value.toLowerCase(),
    );
    const other: Language = language === "en" ? "fr" : "en";
    const otherList = recordKeywords[other] ?? [];
    const translation = pair?.[other];

    update("keywords", {
      ...recordKeywords,
      [language]: currentList.includes(value) ? currentList : [...currentList, value],
      [other]:
        translation && !otherList.includes(translation) ? [...otherList, translation] : otherList,
    });
    setKeywordDraft("");
  };

  const removeKeyword = (value: string) =>
    update("keywords", {
      ...recordKeywords,
      [language]: currentList.filter((k) => k !== value),
    });

  return (
    <>
      <Field label={t("about.abstract")} help={t("about.abstractHelp")} required>
        <BilingualTextInput
          multiline
          value={document.abstract as { en: string; fr: string }}
          onChange={(next) => update("abstract", next)}
        />
      </Field>

      <Field label={t("about.keywords")} help={t("about.keywordsHelp")} required>
        <View style={{ gap: theme.space.sm }}>
          <View style={styles.addRow}>
            <View style={{ flex: 1 }}>
              <TextInput
                value={keywordDraft}
                onChangeText={setKeywordDraft}
                onSubmitEditing={addKeyword}
                accessibilityLabel={t("about.keywords")}
              />
            </View>
            <Pressable
              onPress={addKeyword}
              accessibilityRole="button"
              accessibilityLabel={t("about.addKeyword")}
              style={[styles.addButton, { borderColor: theme.colors.accent, borderRadius: theme.radius.md }]}
            >
              <Ionicons name="add" size={20} color={theme.colors.accent} />
            </Pressable>
          </View>

          <View style={styles.chips}>
            {currentList.map((keyword) => (
              <Pressable
                key={keyword}
                onPress={() => removeKeyword(keyword)}
                accessibilityRole="button"
                accessibilityLabel={`${t("repeater.remove")} ${keyword}`}
                style={[
                  styles.chip,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceRaised,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <Text style={[theme.type.bodySmall, { color: theme.colors.text }]}>{keyword}</Text>
                <Ionicons name="close" size={14} color={theme.colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>
      </Field>

      <Field
        label={t("about.eov")}
        help={t("about.eovHelp")}
        required
        error={deprecatedSelected.length ? t("about.eovDeprecated") : null}
      >
        <View style={{ gap: theme.space.sm }}>
          <TextInput
            value={eovFilter}
            onChangeText={setEovFilter}
            placeholder={t("about.eov")}
            accessibilityLabel={t("about.eov")}
          />
          <ChoiceInput
            multiple
            choices={eovChoices}
            selected={selectedEovs}
            onChange={(next) => update("eov", next)}
          />
        </View>
      </Field>

      <Field label={t("about.datasetLanguage")} help={t("about.datasetLanguageHelp")} required>
        <ChoiceInput
          choices={[
            { value: "en", label: "English" },
            { value: "fr", label: "Français" },
          ]}
          selected={document.language ? [document.language as string] : []}
          onChange={(next) => update("language", next[0] ?? "")}
        />
      </Field>

      <Field label={t("about.progress")} required>
        <ChoiceInput
          choices={progressChoices}
          selected={document.progress ? [document.progress as string] : []}
          onChange={(next) => update("progress", next[0] ?? "")}
        />
      </Field>

      <Field label={t("about.license")} help={t("about.licenseHelp")} required>
        <ChoiceInput
          choices={licenseChoices}
          selected={document.license ? [document.license as string] : []}
          onChange={(next) => update("license", next[0] ?? "")}
        />
      </Field>

      {projects.length > 0 ? (
        <Field label={t("about.projects")} help={t("about.projectsHelp")}>
          <ChoiceInput
            multiple
            choices={projects.map((name) => ({ value: name, label: name }))}
            selected={(document.projects as string[]) ?? []}
            onChange={(next) => update("projects", next)}
          />
        </Field>
      ) : null}

      <Field label={t("about.limitations")}>
        <BilingualTextInput
          multiline
          // Declared as "" in older records; coerce rather than crash.
          value={
            typeof document.limitations === "object"
              ? (document.limitations as { en: string; fr: string })
              : { en: (document.limitations as string) ?? "", fr: "" }
          }
          onChange={(next) => update("limitations", next)}
        />
      </Field>
    </>
  );
}

const styles = StyleSheet.create({
  addRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 36,
  },
});
