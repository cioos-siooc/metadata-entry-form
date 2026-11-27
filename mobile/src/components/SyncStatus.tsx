import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text } from "react-native";

import type { QueueStats } from "@/offline/queue";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Queue state, in one line.
 *
 * Replaces the web app's OfflineBanner, whose copy — "the form cannot save or
 * load records until you reconnect" — was accurate there and is now wrong.
 *
 * The distinction it exists to make: "saved on this device" and "saved to
 * CIOOS" are different states, and a field user needs to know which one their
 * week of work is in.
 */
export function SyncStatus({
  stats,
  syncing,
  offline,
}: {
  stats: QueueStats;
  syncing: boolean;
  offline: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const needsAttention = stats.conflicts + stats.poison;

  let icon: keyof typeof Ionicons.glyphMap = "cloud-done-outline";
  let colour = theme.colors.textMuted;
  let message: string | null = null;

  if (needsAttention > 0) {
    icon = "alert-circle-outline";
    colour = theme.semantic.error;
    message = t("sync.failed");
  } else if (syncing) {
    icon = "sync-outline";
    colour = theme.colors.accent;
    message = t("sync.syncing");
  } else if (stats.pending > 0) {
    icon = offline ? "cloud-offline-outline" : "cloud-upload-outline";
    colour = theme.semantic.queued;
    message = t("sync.pending", { count: stats.pending });
  } else if (offline) {
    icon = "cloud-offline-outline";
    colour = theme.semantic.incomplete;
    message = t("sync.offline");
  }

  // Nothing queued and online: say nothing rather than adding a permanent
  // "all good" badge to every screen.
  if (!message) return null;

  // Tappable whenever there is queued work, so "needs attention" leads
  // somewhere the user can act rather than being a dead end.
  const actionable = stats.pending > 0 || needsAttention > 0;

  return (
    <Pressable
      onPress={actionable ? () => router.push("/queue") : undefined}
      disabled={!actionable}
      accessibilityRole={actionable ? "button" : undefined}
      accessibilityLabel={actionable ? t("queue.title") : undefined}
      style={styles.row}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={icon} size={16} color={colour} />
      <Text style={[theme.type.caption, { color: colour, flex: 1 }]}>{message}</Text>
      {actionable ? <Ionicons name="chevron-forward" size={14} color={colour} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
});
