import { localized } from "@cioos/shared/localized.js";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MetadataRecord, RecordStatus } from "@/api/records";
import type { SyncState } from "@/offline/schema";
import type { Language } from "@/i18n";
import { buildLedger } from "@/records/ledger";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

/**
 * A record in a list.
 *
 * A real card in a real list — not, as in the web app, a card smuggled in as a
 * DataGrid row slot while every cell and header is hidden with CSS.
 *
 * Carries the same completeness signal as the record hub, so the number a user
 * sees here is the number they see when they open it.
 */

const STATUS_KEY: Record<RecordStatus, string> = {
  "": "draft",
  submitted: "submitted",
  published: "published",
};

export function RecordCard({
  record,
  onPress,
  syncState = "synced",
  showAuthor = false,
}: {
  record: MetadataRecord & { owner_name?: string; owner_email?: string };
  onPress: () => void;
  /** Drives the local-vs-server distinction the copy is careful about. */
  syncState?: SyncState;
  showAuthor?: boolean;
}) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;

  // Record content, so no cross-language fallback: showing the English title
  // where a French one was deliberately left blank would be wrong.
  const title =
    localized(record.title ?? {}, language, undefined, { fallback: false }) ||
    localized(record.title ?? {}, language) ||
    t("records.untitled");

  const ledger = buildLedger(record as Record<string, unknown>);
  const percent = Math.round(ledger.percent * 100);

  const statusColor =
    record.status === "published"
      ? theme.semantic.complete
      : record.status === "submitted"
        ? theme.colors.accent
        : theme.colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={`${t(`records.status.${STATUS_KEY[record.status] ?? "draft"}`)}, ${percent}%`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surfaceRaised,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          padding: theme.space.lg,
          gap: theme.space.sm,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={[theme.type.title, { color: theme.colors.text }]}
        numberOfLines={2}
      >
        {title}
      </Text>

      <View style={styles.meta}>
        <View style={styles.statusGroup}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            {t(`records.status.${STATUS_KEY[record.status] ?? "draft"}`)}
          </Text>
          {/* Local-only work is called out here, not just in the sync banner:
              at a glance a user must be able to see which records have left
              the device. */}
          {syncState === "draft" ? (
            <Text style={[theme.type.caption, { color: theme.semantic.incomplete }]}>
              · {t("sync.savedLocally")}
            </Text>
          ) : null}
          {syncState === "pending" ? (
            <Text style={[theme.type.caption, { color: theme.semantic.queued }]}>
              · {t("sync.syncing")}
            </Text>
          ) : null}
          {syncState === "conflict" ? (
            <Text style={[theme.type.caption, { color: theme.semantic.error }]}>
              · {t("sync.failed")}
            </Text>
          ) : null}
        </View>

        {/* Mono, so percentages line up down the list. */}
        <Text style={[theme.type.dataSmall, { color: theme.colors.textMuted }]}>
          {percent}%
        </Text>
      </View>

      <View
        style={[
          styles.track,
          { backgroundColor: theme.colors.border, borderRadius: theme.radius.pill },
        ]}
      >
        <View
          style={{
            width: `${percent}%`,
            height: "100%",
            borderRadius: theme.radius.pill,
            backgroundColor: ledger.submittable ? theme.semantic.complete : theme.colors.accent,
          }}
        />
      </View>

      {showAuthor && (record.owner_name || record.owner_email) ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {t("records.editedBy", { name: record.owner_name || record.owner_email })}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, minHeight: MIN_TOUCH_TARGET + 40 },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  track: { height: 4, overflow: "hidden" },
});
