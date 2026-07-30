import { localized } from "@cioos/shared/localized.js";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NetworkError } from "@/api/errors";
import {
  cloneRecord,
  deleteRecord,
  getRecord as fetchRecord,
  type MetadataRecord,
} from "@/api/records";
import { useSession } from "@/auth/SessionProvider";
import { useDatabase } from "@/offline/DatabaseProvider";
import { getRecord as readCachedRecord, upsertRecord } from "@/offline/db";
import { ConfirmSheet } from "@/components/ConfirmSheet";
import { ShareSheet } from "@/components/ShareSheet";
import { Button } from "@/components/Button";
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
  const db = useDatabase();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [record, setRecord] = useState<MetadataRecord | null>(null);
  const [conflicted, setConflicted] = useState(false);
  const [serverId, setServerId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<null | "delete">(null);
  const [sharing, setSharing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [problem, setProblem] = useState<"offline" | "missing" | "error" | null>(null);

  const load = useCallback(async () => {
    if (!region || !id || !db) return;
    setProblem(null);

    // Cache first, always. A record authored offline exists only here, and one
    // already cached should paint immediately rather than after a round trip.
    const cached = await readCachedRecord(db, id);
    if (cached) {
      setRecord(cached.document);
      setConflicted(cached.syncState === "conflict");
      setServerId(cached.recordID);
    }

    // A local-only record has nothing to fetch, and asking would 404.
    if (cached && !cached.recordID) return;

    try {
      const fresh = await fetchRecord(region, cached?.recordID ?? id);
      setRecord(fresh);
      if (cached && cached.syncState === "synced") {
        await upsertRecord(db, {
          ...cached,
          document: fresh,
          serverUpdatedAt: fresh.updatedAt ?? null,
          serverSnapshot: fresh,
        });
      }
    } catch (err) {
      // Only a problem if we have nothing to show. The web app's loadData catch
      // sets `record: null` for any failure, so offline every record reads as
      // deleted; with a cache, offline is simply not an error.
      if (cached) return;
      if (err instanceof NetworkError) setProblem("offline");
      else if ((err as { status?: number }).status === 404) setProblem("missing");
      else setProblem("error");
    }
  }, [region, id, db]);

  useEffect(() => {
    load();
  }, [load]);

  const onClone = useCallback(async () => {
    if (!region || !serverId) return;
    setActionError(null);
    setActionBusy(true);
    try {
      const copy = await cloneRecord(region, serverId);
      router.replace(`/record/${copy.recordID}`);
    } catch {
      setActionError(t("actions.failed"));
    } finally {
      setActionBusy(false);
    }
  }, [region, serverId, router, t]);

  const onDelete = useCallback(async () => {
    if (!region || !serverId || !db) return;
    setActionError(null);
    setActionBusy(true);
    try {
      await deleteRecord(region, serverId);
      // Drop the local copy too, or the list keeps showing a record the server
      // no longer has — there are no tombstones to tell us otherwise.
      await db.runAsync("DELETE FROM records WHERE local_id = ? OR record_id = ?", [
        id,
        serverId,
      ]);
      setConfirming(null);
      router.replace("/");
    } catch {
      setActionError(t("actions.failed"));
      setConfirming(null);
    } finally {
      setActionBusy(false);
    }
  }, [region, serverId, db, id, router, t]);

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
    <>
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

      {/* A conflict blocks this record's queue, so it needs a visible route
          out — not just a colour on a card. */}
      {conflicted ? (
        <Pressable
          onPress={() => router.push(`/record/${id}/conflict`)}
          accessibilityRole="button"
          accessibilityLabel={t("conflict.banner")}
          style={({ pressed }) => [
            styles.conflict,
            {
              borderColor: theme.semantic.error,
              borderRadius: theme.radius.md,
              padding: theme.space.md,
              gap: theme.space.sm,
              marginBottom: theme.space.lg,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="git-compare-outline" size={20} color={theme.semantic.error} />
          <Text style={[theme.type.body, { color: theme.semantic.error, flex: 1 }]}>
            {t("conflict.banner")}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={theme.semantic.error} />
        </Pressable>
      ) : null}

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

      {/* Review is a destination rather than a ledger row: it has no fields of
          its own, and it is where submitting happens. */}
      <Pressable
        onPress={() => router.push(`/record/${id}/review`)}
        accessibilityRole="button"
        accessibilityLabel={t("review.title")}
        style={({ pressed }) => [
          styles.review,
          {
            borderColor: theme.colors.accent,
            borderRadius: theme.radius.md,
            marginTop: theme.space.lg,
            gap: theme.space.sm,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons
          name={ledger.submittable ? "checkmark-circle-outline" : "list-outline"}
          size={20}
          color={theme.colors.accent}
        />
        <Text style={[theme.type.heading, { color: theme.colors.accent }]}>
          {t("review.title")}
        </Text>
      </Pressable>

      <Text
        style={[
          theme.type.label,
          { color: theme.colors.textMuted, marginTop: theme.space.xxl, marginBottom: theme.space.sm },
        ]}
      >
        {t("actions.title")}
      </Text>

      <View style={{ gap: theme.space.sm }}>
        <Button
          label={t("actions.share")}
          variant="secondary"
          onPress={() => setSharing(true)}
          disabled={!serverId || actionBusy}
        />
        <Button
          label={t("actions.clone")}
          variant="secondary"
          onPress={onClone}
          // Both act on the server copy, so a record that has never synced has
          // nothing to clone or delete remotely.
          disabled={!serverId || actionBusy}
        />
        <Button
          label={t("actions.delete")}
          variant="quiet"
          onPress={() => setConfirming("delete")}
          disabled={!serverId || actionBusy}
        />
        {!serverId ? (
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            {t("actions.offlineOnly")}
          </Text>
        ) : null}
        {actionError ? (
          <Text
            style={[theme.type.bodySmall, { color: theme.semantic.error }]}
            accessibilityLiveRegion="polite"
          >
            {actionError}
          </Text>
        ) : null}
      </View>
    </ScrollView>

    {serverId && region ? (
      <ShareSheet
        visible={sharing}
        region={region}
        recordID={serverId}
        current={(record?.sharedWith as Record<string, boolean>) ?? {}}
        excludeUserID={typeof record?.userID === "string" ? record.userID : undefined}
        onClose={() => setSharing(false)}
        onSaved={(next) => setRecord((current) => (current ? { ...current, sharedWith: next } : current))}
      />
    ) : null}

    <ConfirmSheet
      visible={confirming === "delete"}
      title={t("actions.delete")}
      message={t("actions.deleteConfirm")}
      confirmLabel={t("actions.delete")}
      destructive
      busy={actionBusy}
      onCancel={() => setConfirming(null)}
      onConfirm={onDelete}
    />
    </>
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
  conflict: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: MIN_TOUCH_TARGET,
  },
  review: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
