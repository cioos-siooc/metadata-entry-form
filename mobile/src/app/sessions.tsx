import { Ionicons } from "@expo/vector-icons";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { listSessions, revokeSession, type DeviceSession } from "@/api/sessions";
import { Button } from "@/components/Button";
import { ConfirmSheet } from "@/components/ConfirmSheet";
import { formatRecordDate } from "@/components/fields/dateValue";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

/**
 * Signed-in devices, and how to sign one out remotely.
 *
 * The case this exists for is the phone that went over the side: the session on
 * it is valid for weeks and the person it belonged to has no other way to end
 * it. Revoking here kills the whole refresh-token family server-side, so the
 * lost device cannot rotate its way back in.
 */
export default function SessionsScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<DeviceSession[] | null>(null);
  const [problem, setProblem] = useState(false);
  const [revoking, setRevoking] = useState<DeviceSession | null>(null);
  const [busy, setBusy] = useState(false);

  const thisDeviceId = Device.osBuildId ?? null;

  const load = useCallback(async () => {
    setProblem(false);
    try {
      setSessions(await listSessions());
    } catch {
      setProblem(true);
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmRevoke = async () => {
    if (!revoking) return;
    setBusy(true);
    try {
      await revokeSession(revoking.sessionId);
      setRevoking(null);
      await load();
    } catch {
      setProblem(true);
    } finally {
      setBusy(false);
    }
  };

  const describe = (session: DeviceSession) =>
    session.deviceName ||
    (session.clientType === "browser" ? t("sessions.browser") : t("sessions.unnamed"));

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

        <Text
          style={[theme.type.display, { color: theme.colors.text, marginBottom: theme.space.lg }]}
        >
          {t("sessions.title")}
        </Text>

        {problem ? (
          <Text
            style={[theme.type.bodySmall, { color: theme.semantic.error, marginBottom: theme.space.md }]}
            accessibilityLiveRegion="polite"
          >
            {t("actions.failed")}
          </Text>
        ) : null}

        {sessions === null ? null : sessions.length === 0 ? (
          <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
            {t("sessions.empty")}
          </Text>
        ) : (
          <View style={{ gap: theme.space.md }}>
            {sessions.map((session) => {
              const isThis = Boolean(thisDeviceId && session.deviceId === thisDeviceId);
              // A session that has never refreshed has no last-used stamp, and
              // "last used not yet used" is nonsense — fall back to when it began.
              const used = session.lastUsedAt
                ? formatRecordDate(session.lastUsedAt, i18n.language)
                : null;
              const started = formatRecordDate(session.createdAt, i18n.language);
              return (
                <View
                  key={session.sessionId}
                  style={[
                    styles.card,
                    {
                      borderColor: isThis ? theme.colors.accent : theme.colors.border,
                      backgroundColor: theme.colors.surfaceRaised,
                      borderRadius: theme.radius.md,
                      padding: theme.space.md,
                      gap: theme.space.xs,
                    },
                  ]}
                >
                  <View style={styles.row}>
                    <Ionicons
                      name={session.clientType === "browser" ? "desktop-outline" : "phone-portrait-outline"}
                      size={18}
                      color={theme.colors.textMuted}
                    />
                    <Text style={[theme.type.body, { color: theme.colors.text, flex: 1 }]}>
                      {describe(session)}
                    </Text>
                    {isThis ? (
                      <Text style={[theme.type.caption, { color: theme.colors.accent }]}>
                        {t("sessions.thisDevice")}
                      </Text>
                    ) : null}
                  </View>

                  <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                    {used
                      ? t("sessions.lastUsed", { when: used })
                      : t("sessions.signedIn", { when: started ?? "—" })}
                  </Text>

                  {isThis ? null : (
                    <View style={{ alignSelf: "flex-end" }}>
                      <Button
                        label={t("sessions.signOutOne")}
                        variant="quiet"
                        onPress={() => setRevoking(session)}
                        disabled={busy}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ConfirmSheet
        visible={revoking !== null}
        title={t("sessions.signOutOne")}
        message={t("sessions.signOutConfirm", {
          device: revoking ? describe(revoking) : "",
        })}
        confirmLabel={t("sessions.signOutOne")}
        destructive
        busy={busy}
        onCancel={() => setRevoking(null)}
        onConfirm={confirmRevoke}
      />
    </>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: MIN_TOUCH_TARGET,
    marginLeft: -6,
  },
  card: { borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
