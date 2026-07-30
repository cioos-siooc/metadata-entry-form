import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError, NetworkError } from "@/api/errors";
import {
  allRegionRecords,
  setRecordStatus,
  transferRecord,
  type RecordListItem,
  type RecordStatus,
} from "@/api/records";
import { useSession } from "@/auth/SessionProvider";
import { Button } from "@/components/Button";
import { RecordCard } from "@/components/RecordCard";
import { TextInput } from "@/components/fields/TextInput";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

type Filter = "submitted" | "published" | "drafts" | "all";
const FILTERS: Filter[] = ["submitted", "published", "drafts", "all"];

/**
 * The review queue.
 *
 * Cards with a filter, replacing a 17-column DataGrid with per-user column
 * visibility — a spreadsheet is not a phone screen. Actions are inline on the
 * expanded card rather than in the web app's three nested menus at hand-set
 * z-indices, which leave the screen entirely on a narrow viewport.
 */
export default function ReviewScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { region, roles } = useSession();

  const [filter, setFilter] = useState<Filter>("submitted");
  const [records, setRecords] = useState<RecordListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<"offline" | "error" | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [transferring, setTransferring] = useState<string | null>(null);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferProblem, setTransferProblem] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!region) return;
    setProblem(null);
    try {
      setRecords(await allRegionRecords(region));
    } catch (err) {
      setProblem(err instanceof NetworkError ? "offline" : "error");
    } finally {
      setLoading(false);
    }
  }, [region]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const act = async (recordID: string, status: RecordStatus) => {
    if (!region) return;
    setActing(recordID);
    try {
      await setRecordStatus(region, recordID, status);
      await load();
    } catch {
      setProblem("error");
    } finally {
      setActing(null);
    }
  };

  const doTransfer = async (recordID: string) => {
    if (!region || !transferEmail.trim()) return;
    setTransferProblem(null);
    setActing(recordID);
    try {
      await transferRecord(region, recordID, transferEmail.trim());
      setTransferring(null);
      setTransferEmail("");
      await load();
    } catch (err) {
      // "No user with that email in this region" is the common case and the
      // server already says it well; a generic failure hides the fix.
      setTransferProblem(err instanceof ApiError ? err.message : t("actions.failed"));
    } finally {
      setActing(null);
    }
  };

  const visible = records.filter((record) => {
    if (filter === "all") return true;
    if (filter === "drafts") return record.status === "";
    if (filter === "submitted") return record.status === "submitted";
    return record.status === "published";
  });

  const actionsFor = (record: RecordListItem) => {
    const options: { label: string; status: RecordStatus }[] = [];
    if (record.status === "submitted") {
      options.push({ label: t("reviewQueue.publish"), status: "published" });
      options.push({ label: t("reviewQueue.returnToDraft"), status: "" });
    }
    if (record.status === "published") {
      options.push({ label: t("reviewQueue.unpublish"), status: "submitted" });
    }
    if (record.status === "") {
      options.push({ label: t("reviewQueue.publish"), status: "published" });
    }
    return options;
  };

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.surface }]}>
      <View style={{ paddingTop: insets.top + theme.space.lg, paddingHorizontal: theme.space.lg }}>
        <Text style={[theme.type.display, { color: theme.colors.text }]}>
          {t("reviewQueue.title")}
        </Text>
        <Text style={[theme.type.bodySmall, { color: theme.colors.textMuted, marginTop: 4 }]}>
          {t("reviewQueue.subtitle")}
        </Text>

        <View style={[styles.filters, { gap: theme.space.sm, marginTop: theme.space.md }]}>
          {FILTERS.map((option) => {
            const active = option === filter;
            return (
              <Pressable
                key={option}
                onPress={() => setFilter(option)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.filter,
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
                  {t(`reviewQueue.${option}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.recordID}
        contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.md }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.colors.accent} />
        }
        renderItem={({ item }) => (
          <View style={{ gap: theme.space.sm }}>
            <RecordCard
              record={item}
              showAuthor
              onPress={() => setExpanded(expanded === item.recordID ? null : item.recordID)}
            />

            {expanded === item.recordID ? (
              <View style={{ gap: theme.space.sm, paddingHorizontal: theme.space.sm }}>
                {actionsFor(item).map((action) => (
                  <Pressable
                    key={action.status + action.label}
                    onPress={() => act(item.recordID, action.status)}
                    disabled={acting === item.recordID}
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                    style={({ pressed }) => [
                      styles.action,
                      {
                        borderColor: theme.colors.accent,
                        borderRadius: theme.radius.md,
                        opacity: acting === item.recordID ? 0.5 : pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Text style={[theme.type.body, { color: theme.colors.accent }]}>
                      {action.label}
                    </Text>
                  </Pressable>
                ))}

                {/* Reviewer-only in the web app, and kept that way. */}
                {transferring === item.recordID ? (
                  <View style={{ gap: theme.space.sm }}>
                    <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                      {t("actions.transferHelp")}
                    </Text>
                    <TextInput
                      value={transferEmail}
                      onChangeText={setTransferEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      accessibilityLabel={t("auth.email")}
                    />
                    {transferProblem ? (
                      <Text
                        style={[theme.type.bodySmall, { color: theme.semantic.error }]}
                        accessibilityLiveRegion="polite"
                      >
                        {transferProblem}
                      </Text>
                    ) : null}
                    <Button
                      label={t("actions.confirm")}
                      onPress={() => doTransfer(item.recordID)}
                      busy={acting === item.recordID}
                      disabled={!transferEmail.trim()}
                    />
                    <Button
                      label={t("actions.cancel")}
                      variant="quiet"
                      onPress={() => {
                        setTransferring(null);
                        setTransferEmail("");
                        setTransferProblem(null);
                      }}
                    />
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setTransferring(item.recordID)}
                    accessibilityRole="button"
                    accessibilityLabel={t("actions.transfer")}
                    style={[
                      styles.action,
                      { borderColor: theme.colors.border, borderRadius: theme.radius.md },
                    ]}
                  >
                    <Text style={[theme.type.body, { color: theme.colors.text }]}>
                      {t("actions.transfer")}
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => router.push(`/record/${item.recordID}`)}
                  accessibilityRole="button"
                  style={[
                    styles.action,
                    { borderColor: theme.colors.border, borderRadius: theme.radius.md },
                  ]}
                >
                  <Text style={[theme.type.body, { color: theme.colors.text }]}>
                    {t("editor.back")}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          loading ? null : (
            <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
              {problem === "offline"
                ? t("records.loadFailedOffline")
                : problem === "error"
                  ? t("reviewQueue.actionFailed")
                  : t("reviewQueue.empty")}
            </Text>
          )
        }
      />

      {/* The tab is hidden without the role, but a deep link can still land
          here, so say so rather than showing an empty queue. */}
      {!roles.isReviewer && !roles.isAdmin ? (
        <View style={{ padding: theme.space.lg }}>
          <Text style={[theme.type.bodySmall, { color: theme.semantic.incomplete }]}>
            {t("review.ownerOnly")}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  filters: { flexDirection: "row", flexWrap: "wrap" },
  filter: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  action: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
