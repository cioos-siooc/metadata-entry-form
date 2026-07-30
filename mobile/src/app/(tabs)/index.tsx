import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NetworkError } from "@/api/errors";
import {
  myRecords,
  publishedRecords,
  sharedWithMe,
  type RecordListItem,
} from "@/api/records";
import { useSession } from "@/auth/SessionProvider";
import { RecordCard } from "@/components/RecordCard";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

/**
 * The field user's home.
 *
 * One list with three scopes, rather than the web app's three separate screens.
 * A segmented filter is cheap on a phone; separate nav destinations are not.
 * And it is a real FlatList — not a card smuggled in as a DataGrid row slot
 * with every header and cell hidden by CSS, which is how the web app does it.
 */

type Scope = "mine" | "shared" | "published";
const SCOPES: Scope[] = ["mine", "shared", "published"];

export default function RecordsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { region, user, isOffline } = useSession();

  const [scope, setScope] = useState<Scope>("mine");
  const [records, setRecords] = useState<RecordListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<"offline" | "error" | null>(null);

  const load = useCallback(async () => {
    if (!region || !user) return;
    setProblem(null);
    try {
      const rows =
        scope === "mine"
          ? await myRecords(region, user.userID)
          : scope === "shared"
            ? await sharedWithMe(region)
            : await publishedRecords(region);
      setRecords(rows);
    } catch (err) {
      // Offline deserves a different message from a real failure: there is
      // nothing for the user to fix, and once Phase 4 lands there will be
      // cached rows to show here instead of an empty list.
      setProblem(err instanceof NetworkError ? "offline" : "error");
    } finally {
      setLoading(false);
    }
  }, [region, user, scope]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

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

        {isOffline ? (
          <Text style={[theme.type.caption, { color: theme.semantic.incomplete, marginTop: 4 }]}>
            {t("sync.offline")}
          </Text>
        ) : null}

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
        keyExtractor={(item) => item.recordID}
        contentContainerStyle={{
          padding: theme.space.lg,
          gap: theme.space.md,
          paddingBottom: theme.space.xxxl,
        }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={theme.colors.accent}
          />
        }
        renderItem={({ item }) => (
          <RecordCard
            record={item}
            showAuthor={scope !== "mine"}
            onPress={() => router.push(`/record/${item.recordID}`)}
          />
        )}
        ListEmptyComponent={
          loading ? null : (
            <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
              {problem === "offline"
                ? t("records.loadFailedOffline")
                : problem === "error"
                  ? t("records.loadFailed")
                  : emptyMessage}
            </Text>
          )
        }
      />
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
