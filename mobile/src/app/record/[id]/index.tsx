import { localized } from "@cioos/shared/localized.js";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NetworkError } from "@/api/errors";
import { getRecord, type MetadataRecord } from "@/api/records";
import { useSession } from "@/auth/SessionProvider";
import { LedgerSummary, SectionRow } from "@/components/CompletenessLedger";
import type { Language } from "@/i18n";
import { buildLedger } from "@/records/ledger";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

/**
 * The record hub — the centre of the hub-and-spoke design.
 *
 * The web app puts 48 fields behind eight horizontally-scrolling tabs whose own
 * source comments admit they "don't fit below ~1000px". Here the record opens on
 * a ledger showing every section's state, and each section is a separate focused
 * screen. Any order, always resumable, always clear what remains — which is what
 * interrupted field work needs.
 */
export default function RecordHubScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { region } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [record, setRecord] = useState<MetadataRecord | null>(null);
  const [problem, setProblem] = useState<"offline" | "missing" | "error" | null>(null);

  const load = useCallback(async () => {
    if (!region || !id) return;
    setProblem(null);
    try {
      setRecord(await getRecord(region, id));
    } catch (err) {
      // The web app's loadData catch sets `record: null` for *any* failure, so
      // offline every record reads as deleted. Distinguish them.
      if (err instanceof NetworkError) setProblem("offline");
      else if ((err as { status?: number }).status === 404) setProblem("missing");
      else setProblem("error");
    }
  }, [region, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (problem) {
    return (
      <View
        style={[
          styles.centred,
          { backgroundColor: theme.colors.surface, padding: theme.space.xl },
        ]}
      >
        <Text style={[theme.type.body, { color: theme.colors.textMuted, textAlign: "center" }]}>
          {problem === "offline"
            ? t("records.loadFailedOffline")
            : problem === "missing"
              ? t("records.loadFailed")
              : t("records.loadFailed")}
        </Text>
      </View>
    );
  }

  if (!record) {
    return (
      <View style={[styles.centred, { backgroundColor: theme.colors.surface }]}>
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          {t("common.loading")}
        </Text>
      </View>
    );
  }

  const language = i18n.language as Language;
  const title =
    localized(record.title ?? {}, language, undefined, { fallback: false }) ||
    localized(record.title ?? {}, language) ||
    t("records.untitled");

  const ledger = buildLedger(record as Record<string, unknown>);

  return (
    <ScrollView
      style={[styles.fill, { backgroundColor: theme.colors.surface }]}
      contentContainerStyle={{
        paddingTop: insets.top + theme.space.sm,
        paddingHorizontal: theme.space.lg,
        paddingBottom: theme.space.xxxl,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t("common.close")}
        style={styles.back}
      >
        <Ionicons name="chevron-back" size={22} color={theme.colors.accent} />
        <Text style={[theme.type.body, { color: theme.colors.accent }]}>
          {t("records.title")}
        </Text>
      </Pressable>

      <Text style={[theme.type.display, { color: theme.colors.text, marginBottom: theme.space.xs }]}>
        {title}
      </Text>
      {/* Mono: identifiers are for comparing, not reading. */}
      <Text style={[theme.type.dataSmall, { color: theme.colors.textMuted, marginBottom: theme.space.lg }]}>
        {record.recordID}
      </Text>

      <LedgerSummary ledger={ledger} />

      <View style={{ gap: theme.space.sm }}>
        {ledger.sections.map((section) => (
          <SectionRow
            key={section.id}
            section={section}
            onPress={() => router.push(`/record/${id}/${section.id}`)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centred: { flex: 1, alignItems: "center", justifyContent: "center" },
  back: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: MIN_TOUCH_TARGET,
    marginLeft: -6,
  },
});
