import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSession } from "@/auth/SessionProvider";
import { Button } from "@/components/Button";
import { ConfirmSheet } from "@/components/ConfirmSheet";
import { useDatabase } from "@/offline/DatabaseProvider";
import { getRecordByLocalId, type Mutation } from "@/offline/db";
import { listMutations } from "@/offline/queue";
import { useSync } from "@/offline/useSync";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

const KIND_KEY: Record<string, string> = {
  "record.create": "queue.kindCreate",
  "record.update": "queue.kindUpdate",
  "record.status": "queue.kindStatus",
  "record.delete": "queue.kindDelete",
};

/**
 * What is waiting to sync, and how to unstick it.
 *
 * Without this a poisoned op is a dead end: the indicator says "needs attention"
 * and there is nothing the user can do about it. Discarding is offered because
 * the alternative — a queue permanently blocked by one bad change — is worse,
 * but it is confirmed and it names what is lost.
 */
export default function QueueScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { isOffline } = useSession();
  const { syncing, flushNow, refreshStats } = useSync(db, !isOffline);

  const [items, setItems] = useState<(Mutation & { title?: string })[]>([]);
  const [discarding, setDiscarding] = useState<Mutation | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!db) return;
    const ops = await listMutations(db);
    // Label each op with its record's title, so the list is about the user's
    // work rather than about opaque queue entries.
    const withTitles = await Promise.all(
      ops.map(async (op) => {
        const record = await getRecordByLocalId(db, op.targetLocalId);
        const title = record?.document?.title as { en?: string; fr?: string } | undefined;
        return { ...op, title: title?.en || title?.fr || undefined };
      }),
    );
    setItems(withTitles);
  }, [db]);

  useEffect(() => {
    void load();
  }, [load]);

  const retry = async (mutation: Mutation) => {
    if (!db) return;
    setBusy(true);
    try {
      // Back to pending with the backoff cleared, then flush immediately: the
      // user asking for a retry is a stronger signal than the timer.
      await db.runAsync(
        "UPDATE mutations SET status = 'pending', attempts = 0, next_attempt_at = NULL, last_error = NULL WHERE seq = ?",
        [mutation.seq],
      );
      await flushNow();
      await load();
      await refreshStats();
    } finally {
      setBusy(false);
    }
  };

  const discard = async () => {
    if (!db || !discarding) return;
    setBusy(true);
    try {
      await db.runAsync("DELETE FROM mutations WHERE seq = ?", [discarding.seq]);
      // The record keeps its local edits; only the attempt to send them is
      // dropped. Mark it a draft so it stops claiming to be mid-sync.
      await db.runAsync("UPDATE records SET sync_state = 'draft' WHERE local_id = ?", [
        discarding.targetLocalId,
      ]);
      setDiscarding(null);
      await load();
      await refreshStats();
    } finally {
      setBusy(false);
    }
  };

  const colourFor = (status: Mutation["status"]) =>
    status === "conflict" || status === "poison"
      ? theme.semantic.error
      : status === "inflight"
        ? theme.colors.accent
        : theme.semantic.queued;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.surface }}
        contentContainerStyle={{
          paddingTop: insets.top + theme.space.sm,
          paddingHorizontal: theme.space.lg,
          paddingBottom: insets.bottom + theme.space.xxl,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.accent} />
          <Text style={[theme.type.body, { color: theme.colors.accent }]}>{t("common.back")}</Text>
        </Pressable>

        <Text style={[theme.type.display, { color: theme.colors.text, marginBottom: theme.space.lg }]}>
          {t("queue.title")}
        </Text>

        {items.length === 0 ? (
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            {t("queue.empty")}
          </Text>
        ) : (
          <View style={{ gap: theme.space.md }}>
            {items.map((op) => (
              <View
                key={op.seq}
                style={[
                  styles.card,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceRaised,
                    borderRadius: theme.radius.md,
                    padding: theme.space.md,
                    gap: theme.space.sm,
                  },
                ]}
              >
                <View style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: colourFor(op.status) }]} />
                  <Text style={[theme.type.body, { color: theme.colors.text, flex: 1 }]} numberOfLines={1}>
                    {op.title || t("records.untitled")}
                  </Text>
                  <Text style={[theme.type.dataSmall, { color: theme.colors.textMuted }]}>
                    {t(KIND_KEY[op.kind] ?? "queue.kindUpdate")}
                  </Text>
                </View>

                {op.status === "conflict" ? (
                  <Pressable
                    onPress={() => router.push(`/record/${op.targetLocalId}/conflict`)}
                    accessibilityRole="button"
                    style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: "center" }}
                  >
                    <Text style={[theme.type.bodySmall, { color: theme.semantic.error }]}>
                      {t("queue.conflictOne")} →
                    </Text>
                  </Pressable>
                ) : (
                  <>
                    {op.lastError ? (
                      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                        {op.lastError}
                      </Text>
                    ) : null}
                    {op.attempts > 0 ? (
                      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                        {t("queue.attempts", { count: op.attempts })}
                      </Text>
                    ) : null}

                    {op.status === "poison" ? (
                      <View style={[styles.row, { gap: theme.space.sm }]}>
                        <View style={{ flex: 1 }}>
                          <Button label={t("queue.retry")} variant="secondary" onPress={() => retry(op)} disabled={busy} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Button label={t("queue.discard")} variant="quiet" onPress={() => setDiscarding(op)} disabled={busy} />
                        </View>
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            ))}

            <Button
              label={t("queue.syncNow")}
              onPress={async () => {
                await flushNow();
                await load();
              }}
              busy={syncing}
              disabled={isOffline}
            />
          </View>
        )}
      </ScrollView>

      <ConfirmSheet
        visible={discarding !== null}
        title={t("queue.discard")}
        message={t("queue.discardConfirm")}
        confirmLabel={t("queue.discard")}
        destructive
        busy={busy}
        onCancel={() => setDiscarding(null)}
        onConfirm={discard}
      />
    </>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", minHeight: MIN_TOUCH_TARGET, marginLeft: -6 },
  card: { borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
