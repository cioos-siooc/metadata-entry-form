import { getBlankRecord } from "@cioos/shared/blankRecord.js";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { MetadataRecord } from "@/api/records";
import { useSession } from "@/auth/SessionProvider";
import { ActionBar } from "@/components/ActionBar";
import { Button } from "@/components/Button";
import { RecordCard } from "@/components/RecordCard";
import { SyncStatus } from "@/components/SyncStatus";
import { useDatabase } from "@/offline/DatabaseProvider";
import type { RecordScope } from "@/offline/schema";
import { useSync } from "@/offline/useSync";
import { createLocalRecord } from "@/records/draft";
import { useRecords } from "@/records/useRecords";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

const SCOPES: RecordScope[] = ["mine", "shared", "published"];

export default function RecordsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useDatabase();
  const { region, user, isOffline } = useSession();

  const [scope, setScope] = useState<RecordScope>("mine");
  const { records, state, refresh } = useRecords(db, region, user?.userID, scope);
  const { stats, syncing } = useSync(db, !isOffline);

  const create = useCallback(async () => {
    if (!db || !region || !user) return;
    // Immediately editable, with no server round trip — the point of the whole
    // offline layer. It becomes a server record when the queue flushes.
    const record = await createLocalRecord(
      db,
      region,
      user.userID,
      getBlankRecord() as MetadataRecord,
    );
    router.push(`/record/${record.localId}`);
  }, [db, region, user, router]);

  const emptyMessage =
    scope === "shared"
      ? t("records.emptyShared")
      : scope === "published"
        ? t("records.emptyPublished")
        : t("records.empty.body");

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.surface }]}>
      <View
        style={{ paddingTop: insets.top + theme.space.lg, paddingHorizontal: theme.space.lg }}
      >
        <Text style={[theme.type.display, { color: theme.colors.text }]}>
          {t("records.title")}
        </Text>

        <SyncStatus stats={stats} syncing={syncing} offline={isOffline || state === "stale"} />

        <View style={[styles.scopes, { gap: theme.space.sm, marginTop: theme.space.md }]}>
          {SCOPES.map((option) => {
            const active = option === scope;
            return (
              <Pressable
                key={option}
                onPress={() => setScope(option)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.scope,
                  {
                    borderColor: active ? theme.colors.accent : theme.colors.border,
                    backgroundColor: active ? theme.colors.accentFill : "transparent",
                    borderRadius: theme.radius.pill,
                    paddingHorizontal: theme.space.md,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    theme.type.bodySmall,
                    { color: active ? theme.colors.onAccent : theme.colors.text },
                  ]}
                >
                  {t(`records.${option}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.localId}
        contentContainerStyle={{
          padding: theme.space.lg,
          gap: theme.space.md,
          paddingBottom: theme.space.xxxl,
        }}
        refreshControl={
          <RefreshControl
            refreshing={state === "loading"}
            onRefresh={refresh}
            tintColor={theme.colors.accent}
          />
        }
        renderItem={({ item }) => (
          <RecordCard
            record={item.document}
            syncState={item.syncState}
            showAuthor={scope !== "mine"}
            onPress={() => router.push(`/record/${item.localId}`)}
          />
        )}
        ListEmptyComponent={
          state === "loading" ? null : (
            <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
              {state === "error" ? t("records.loadFailed") : emptyMessage}
            </Text>
          )
        }
      />

      {scope === "mine" ? (
        <ActionBar>
          <View style={{ flex: 1 }}>
            <Button label={t("records.newRecord")} onPress={create} />
          </View>
        </ActionBar>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scopes: { flexDirection: "row" },
  scope: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
