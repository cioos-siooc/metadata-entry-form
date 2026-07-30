import { localized } from "@cioos/shared/localized.js";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getRecord } from "@/api/records";
import type { MetadataRecord } from "@/api/records";
import { useSession } from "@/auth/SessionProvider";
import { ActionBar } from "@/components/ActionBar";
import { Button } from "@/components/Button";
import type { Language } from "@/i18n";
import { useDatabase } from "@/offline/DatabaseProvider";
import { analyseConflict, contestedByTab, type ConflictAnalysis, type FieldConflict } from "@/offline/conflict";
import { getRecordByLocalId, type CachedRecord } from "@/offline/db";
import { resolveConflict, type Resolution } from "@/offline/resolve";
import { useTheme } from "@/theme/ThemeProvider";

import { useGoBack } from "@/navigation/useGoBack";

/**
 * Conflict resolution.
 *
 * The record moved on the server while our edit was queued. The framing matters:
 * nothing has been lost, and the user is choosing what to keep — not being told
 * their work failed. Most conflicts turn out not to overlap at all, in which case
 * "keep both" is offered and no field-by-field decision is needed.
 */
export default function ConflictScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { region, user } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goBack = useGoBack(`/record/${id}`);
  const language = i18n.language as Language;

  const [record, setRecord] = useState<CachedRecord | null>(null);
  const [theirs, setTheirs] = useState<MetadataRecord | null>(null);
  const [analysis, setAnalysis] = useState<ConflictAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!db || !id || !region) return;
      const cached = await getRecordByLocalId(db, id);
      if (!cached?.recordID || cancelled) return;
      setRecord(cached);
      try {
        const server = await getRecord(region, cached.recordID);
        if (cancelled) return;
        setTheirs(server);
        // The base is the document the server last gave us. Without it every
        // difference has to be treated as contested.
        setAnalysis(analyseConflict(cached.serverSnapshot, cached.document, server));
      } catch {
        if (!cancelled) setError(t("records.loadFailed"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, id, region, t]);

  const apply = useCallback(
    async (resolution: Resolution) => {
      if (!db || !id || !analysis || !theirs || !user) return;
      setBusy(true);
      try {
        await resolveConflict(
          db,
          id,
          resolution,
          analysis,
          theirs,
          theirs.updatedAt ?? null,
          user.userID,
          Crypto.randomUUID(),
        );
        goBack();
      } catch {
        setError(t("reviewQueue.actionFailed"));
      } finally {
        setBusy(false);
      }
    },
    [db, id, analysis, theirs, user, goBack, t],
  );

  const show = (value: unknown): string => {
    if (value === null || value === undefined || value === "") return t("conflict.empty");
    if (typeof value === "object") {
      const pair = value as Record<string, unknown>;
      if (typeof pair.en === "string" || typeof pair.fr === "string") {
        return (localized(pair, language) as string) || t("conflict.empty");
      }
      return Array.isArray(value) ? `${value.length}` : JSON.stringify(value).slice(0, 80);
    }
    return String(value);
  };

  const side = (label: string, value: unknown, colour: string) => (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[theme.type.bodySmall, { color: colour }]} numberOfLines={3}>
        {show(value)}
      </Text>
    </View>
  );

  const fieldRow = (field: FieldConflict) => (
    <View
      key={field.field}
      style={[
        styles.field,
        {
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.space.md,
          gap: theme.space.sm,
        },
      ]}
    >
      <Text style={[theme.type.dataSmall, { color: theme.colors.textMuted }]}>{field.field}</Text>
      <View style={styles.sides}>
        {side(t("conflict.yours"), field.mine, theme.colors.text)}
        {side(t("conflict.theirs"), field.theirs, theme.colors.text)}
      </View>
    </View>
  );

  if (error) {
    return (
      <View style={[styles.centred, { backgroundColor: theme.colors.surface, padding: 24 }]}>
        <Text style={[theme.type.body, { color: theme.semantic.error, textAlign: "center" }]}>
          {error}
        </Text>
      </View>
    );
  }

  if (!analysis || !record) {
    return (
      <View style={[styles.centred, { backgroundColor: theme.colors.surface }]}>
        <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
          {t("common.loading")}
        </Text>
      </View>
    );
  }

  const grouped = contestedByTab(analysis);

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.surface }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + theme.space.lg,
          paddingHorizontal: theme.space.lg,
          paddingBottom: theme.space.xxl,
        }}
      >
        <View style={styles.bannerRow}>
          <Ionicons name="git-compare-outline" size={22} color={theme.semantic.incomplete} />
          <Text style={[theme.type.title, { color: theme.colors.text, flex: 1 }]}>
            {t("conflict.banner")}
          </Text>
        </View>

        <Text
          style={[
            theme.type.body,
            { color: theme.colors.textMuted, marginTop: theme.space.sm, marginBottom: theme.space.lg },
          ]}
        >
          {t("conflict.explain")}
        </Text>

        {analysis.autoMergeable ? (
          <Text
            style={[
              theme.type.bodySmall,
              { color: theme.semantic.complete, marginBottom: theme.space.lg },
            ]}
          >
            {t("conflict.autoMergeable")}
          </Text>
        ) : (
          <Text
            style={[
              theme.type.bodySmall,
              { color: theme.semantic.incomplete, marginBottom: theme.space.lg },
            ]}
          >
            {t("conflict.contested", { count: analysis.contested.length })}
          </Text>
        )}

        {Object.entries(grouped).map(([tab, fields]) => (
          <View key={tab} style={{ gap: theme.space.sm, marginBottom: theme.space.lg }}>
            <Text style={[theme.type.label, { color: theme.colors.textMuted }]}>
              {tab === "other" ? t("conflict.other") : tab}
            </Text>
            {fields.map(fieldRow)}
          </View>
        ))}

        {analysis.localOnly.length > 0 ? (
          <View style={{ gap: theme.space.sm, marginBottom: theme.space.lg }}>
            <Text style={[theme.type.label, { color: theme.colors.textMuted }]}>
              {t("conflict.localOnly")}
            </Text>
            {analysis.localOnly.map(fieldRow)}
          </View>
        ) : null}

        {analysis.remoteOnly.length > 0 ? (
          <View style={{ gap: theme.space.sm }}>
            <Text style={[theme.type.label, { color: theme.colors.textMuted }]}>
              {t("conflict.remoteOnly")}
            </Text>
            {analysis.remoteOnly.map(fieldRow)}
          </View>
        ) : null}
      </ScrollView>

      <ActionBar>
        <View style={{ flex: 1, gap: 8 }}>
          {analysis.autoMergeable ? (
            <Button label={t("conflict.merge")} onPress={() => apply("merge")} busy={busy} />
          ) : (
            <Button label={t("conflict.keepMine")} onPress={() => apply("mine")} busy={busy} />
          )}
          <Button
            label={t("conflict.keepTheirs")}
            variant="secondary"
            onPress={() => apply("theirs")}
            disabled={busy}
          />
        </View>
      </ActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centred: { flex: 1, alignItems: "center", justifyContent: "center" },
  bannerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  field: { borderWidth: 1 },
  sides: { flexDirection: "row", gap: 16 },
});
