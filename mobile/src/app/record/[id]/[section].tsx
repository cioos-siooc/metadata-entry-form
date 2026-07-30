import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { setRecordStatus } from "@/api/records";
import { useSession } from "@/auth/SessionProvider";
import { ActionBar } from "@/components/ActionBar";
import { Button } from "@/components/Button";
import { useDatabase } from "@/offline/DatabaseProvider";
import { buildLedger, type SectionId } from "@/records/ledger";
import { SECTION_EDITORS } from "@/records/sections";
import { useRecordDraft } from "@/records/useRecordDraft";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

import { useGoBack } from "@/navigation/useGoBack";

/**
 * A section editor — one spoke of the hub.
 *
 * A thin shell: it resolves the section from the registry, supplies the draft
 * and its ledger slice, and owns the save bar. Everything section-specific lives
 * in its own component.
 */
export default function SectionEditorScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { user, region } = useSession();
  const { id, section } = useLocalSearchParams<{ id: string; section: SectionId | "review" }>();
  // The hub, not the history: this screen is reachable straight from a link.
  const goBack = useGoBack(`/record/${id}`);

  const { record, document, status, update, save } = useRecordDraft(db, id, user?.userID);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!document) {
    return (
      <View style={[styles.centred, { backgroundColor: theme.colors.surface }]}>
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          {t("common.loading")}
        </Text>
      </View>
    );
  }

  const Editor = SECTION_EDITORS[section];
  const ledger = buildLedger(document as Record<string, unknown>);
  const currentSection = ledger.sections.find((s) => s.id === section);
  const isReview = section === "review";

  const statusLabel =
    status === "savingLocally"
      ? t("editor.saving")
      : status === "queued"
        ? t("editor.queued")
        : status === "savedLocally"
          ? t("editor.saved")
          : null;

  // Only the record's owner may submit — shared collaborators and reviewers can
  // edit but not submit. Preserved from the web app.
  const ownsRecord = !record?.ownerUserId || record.ownerUserId === user?.userID;

  const submit = async () => {
    setSubmitError(null);
    if (!ownsRecord) return setSubmitError(t("review.ownerOnly"));
    if (!record?.recordID) return setSubmitError(t("review.mustSaveFirst"));
    if (!region) return;

    setSubmitting(true);
    try {
      await setRecordStatus(region, record.recordID, "submitted");
      goBack();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("records.loadFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.surface }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + theme.space.sm,
          paddingHorizontal: theme.space.lg,
          paddingBottom: theme.space.xxl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => goBack()}
          accessibilityRole="button"
          accessibilityLabel={t("editor.back")}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.accent} />
          <Text style={[theme.type.body, { color: theme.colors.accent }]}>{t("editor.back")}</Text>
        </Pressable>

        <Text style={[theme.type.display, { color: theme.colors.text }]}>
          {isReview ? t("review.title") : t(`sections.${section}`)}
        </Text>

        {/* This section's slice of the ledger, so the goal stays visible while
            editing rather than only back at the hub. */}
        {currentSection ? (
          <Text
            style={[
              theme.type.caption,
              { color: theme.colors.textMuted, marginBottom: theme.space.xl },
            ]}
          >
            {currentSection.required > 0
              ? t("ledger.required", {
                  satisfied: currentSection.satisfied,
                  required: currentSection.required,
                })
              : t("ledger.noneRequired")}
          </Text>
        ) : (
          <View style={{ marginBottom: theme.space.xl }} />
        )}

        {Editor ? (
          <Editor document={document} update={update} ledger={currentSection} />
        ) : (
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            {t("records.loadFailed")}
          </Text>
        )}

        {submitError ? (
          <Text
            style={[theme.type.bodySmall, { color: theme.semantic.error }]}
            accessibilityLiveRegion="polite"
          >
            {submitError}
          </Text>
        ) : null}
      </ScrollView>

      <ActionBar>
        {statusLabel ? (
          <Text style={[theme.type.caption, { color: theme.colors.textMuted, flex: 1 }]}>
            {statusLabel}
          </Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {isReview ? (
          <Button
            label={t("review.submit")}
            onPress={submit}
            busy={submitting}
            disabled={!ledger.submittable || submitting}
          />
        ) : (
          <Button label={t("editor.save")} onPress={save} />
        )}
      </ActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centred: { flex: 1, alignItems: "center", justifyContent: "center" },
  back: { flexDirection: "row", alignItems: "center", minHeight: MIN_TOUCH_TARGET, marginLeft: -6 },
});
