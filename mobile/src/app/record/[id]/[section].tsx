import { localized } from "@cioos/shared/localized.js";
import { metadataScopeCodes } from "@cioos/shared/isoCodeLists.js";
import themesList from "@cioos/shared/themes.js";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSession } from "@/auth/SessionProvider";
import { Button } from "@/components/Button";
import { BilingualTextInput } from "@/components/fields/BilingualTextInput";
import { ChoiceInput, type Choice } from "@/components/fields/ChoiceInput";
import { DateInput } from "@/components/fields/DateInput";
import { Field } from "@/components/fields/Field";
import { TextInput } from "@/components/fields/TextInput";
import type { Language } from "@/i18n";
import { useDatabase } from "@/offline/DatabaseProvider";
import { buildLedger, type SectionId } from "@/records/ledger";
import { useRecordDraft } from "@/records/useRecordDraft";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

/**
 * A section editor — one spoke of the hub.
 *
 * One section at a time, with its own outstanding requirements shown at the
 * top. Replaces eight horizontally-scrolling tabs whose own source comments
 * admit they "don't fit below ~1000px".
 *
 * Only Identification and When are implemented so far; the rest fall through to
 * an honest placeholder rather than a blank screen.
 */

const IMPLEMENTED: SectionId[] = ["identification", "when"];

export default function SectionEditorScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { user } = useSession();
  const { id, section } = useLocalSearchParams<{ id: string; section: SectionId }>();

  const { document, status, update, save } = useRecordDraft(db, id, user?.userID);
  const language = i18n.language as Language;

  if (!document) {
    return (
      <View style={[styles.centred, { backgroundColor: theme.colors.surface }]}>
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          {t("common.loading")}
        </Text>
      </View>
    );
  }

  const ledger = buildLedger(document as Record<string, unknown>);
  const current = ledger.sections.find((s) => s.id === section);

  const themeChoices: Choice[] = (themesList[0]?.en ?? []).map((label: string, index: number) => ({
    // The record stores lowercase keys; the vocabulary is a parallel en/fr array.
    value: label.toLowerCase(),
    label: (themesList[0] as Record<string, string[]>)[language]?.[index] ?? label,
  }));

  const scopeChoices: Choice[] = Object.entries(
    metadataScopeCodes as Record<string, { title?: Record<string, string>; text?: Record<string, string> }>,
  ).map(([value, entry]) => ({
    value,
    label: localized(entry.title ?? {}, language) ?? value,
    description: localized(entry.text ?? {}, language),
  }));

  const statusLabel =
    status === "savingLocally"
      ? t("editor.saving")
      : status === "queued"
        ? t("editor.queued")
        : status === "savedLocally"
          ? t("editor.saved")
          : null;

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.surface }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + theme.space.sm,
          paddingHorizontal: theme.space.lg,
          paddingBottom: theme.space.xxxl * 2,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t("editor.back")}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.accent} />
          <Text style={[theme.type.body, { color: theme.colors.accent }]}>
            {t("editor.back")}
          </Text>
        </Pressable>

        <Text style={[theme.type.display, { color: theme.colors.text }]}>
          {t(`sections.${section}`)}
        </Text>

        {/* The section's own slice of the ledger, so the goal is visible while
            editing rather than only back at the hub. */}
        {current ? (
          <Text
            style={[
              theme.type.caption,
              { color: theme.colors.textMuted, marginBottom: theme.space.xl },
            ]}
          >
            {current.required > 0
              ? t("ledger.required", {
                  satisfied: current.satisfied,
                  required: current.required,
                })
              : t("ledger.noneRequired")}
          </Text>
        ) : null}

        {section === "identification" ? (
          <>
            <Field
              label={t("sections.identification")}
              help={t("identification.titleHelp")}
              required
            >
              <BilingualTextInput
                value={document.title as { en: string; fr: string }}
                onChange={(next) => update("title", next)}
              />
            </Field>

            <Field label={t("records.mine")} help={t("identification.themeHelp")} required>
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
        ) : null}

        {section === "when" ? (
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
        ) : null}

        {!IMPLEMENTED.includes(section) ? (
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            {t("ledger.notReady", { count: current?.required ?? 0 })}
          </Text>
        ) : null}
      </ScrollView>

      {/* Anchored above the home indicator rather than floating over content —
          the web app's fixed FAB collides with the keyboard and sits under the
          indicator on iOS. */}
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.colors.surfaceRaised,
            borderTopColor: theme.colors.border,
            paddingBottom: insets.bottom + theme.space.md,
            paddingTop: theme.space.md,
            paddingHorizontal: theme.space.lg,
            gap: theme.space.md,
          },
        ]}
      >
        {statusLabel ? (
          <Text style={[theme.type.caption, { color: theme.colors.textMuted, flex: 1 }]}>
            {statusLabel}
          </Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <Button label={t("editor.save")} onPress={save} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centred: { flex: 1, alignItems: "center", justifyContent: "center" },
  back: { flexDirection: "row", alignItems: "center", minHeight: MIN_TOUCH_TARGET, marginLeft: -6 },
  bar: { borderTopWidth: 1, flexDirection: "row", alignItems: "center" },
});
