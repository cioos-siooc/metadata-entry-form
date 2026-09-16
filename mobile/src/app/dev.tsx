import { Ionicons } from "@expo/vector-icons";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { get } from "@/api/client";
import { useSession } from "@/auth/SessionProvider";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/fields/TextInput";
import {
  apiBaseOverride,
  apiBaseUrl,
  DEFAULT_API_BASE_URL,
  normalizeBaseUrl,
} from "@/state/apiBase";
import { setApiBaseOverride } from "@/state/devSettings";
import { contentColumn } from "@/theme/layout";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

import { useGoBack } from "@/navigation/useGoBack";

/**
 * Developer settings.
 *
 * Two things that are otherwise fixed at build time and block day-to-day work:
 * which server the app talks to, and which region it is in. The region picker
 * only lists tenants the server returns, so a freshly created one — "test" —
 * cannot be reached through it at all.
 *
 * Changing the server signs you out on purpose. Tokens are issued per server;
 * carrying one across would produce 401s that look like a broken session
 * rather than a deliberate switch.
 */
export default function DevScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const goBack = useGoBack("/(tabs)/more");
  const insets = useSafeAreaInsets();
  const { region, setRegion, signOut } = useSession();

  const [url, setUrl] = useState(apiBaseOverride() ?? "");
  const [regionInput, setRegionInput] = useState(region ?? "");
  const [saved, setSaved] = useState<string | null>(null);
  const [probe, setProbe] = useState<null | "checking" | "ok" | "failed">(null);
  const [busy, setBusy] = useState(false);

  const applyUrl = async (next: string | null) => {
    setBusy(true);
    setProbe(null);
    try {
      await setApiBaseOverride(next);
      setUrl(apiBaseOverride() ?? "");
      setSaved(t("dev.serverSaved", { url: apiBaseUrl() }));
      // The old access token belongs to the old server.
      await signOut();
    } finally {
      setBusy(false);
    }
  };

  const testConnection = async () => {
    setProbe("checking");
    try {
      await get("/regions");
      setProbe("ok");
    } catch {
      setProbe("failed");
    }
  };

  const applyRegion = async () => {
    const next = regionInput.trim().toLowerCase();
    if (!next) return;
    await setRegion(next);
    setSaved(t("dev.regionSaved", { region: next }));
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.surface }}
      contentContainerStyle={[contentColumn, {
        paddingTop: insets.top + theme.space.sm,
        paddingHorizontal: theme.space.lg,
        paddingBottom: insets.bottom + theme.space.xxl,
        gap: theme.space.lg,
      }]}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        onPress={() => goBack()}
        accessibilityRole="button"
        accessibilityLabel={t("common.back")}
        style={styles.back}
      >
        <Ionicons name="chevron-back" size={22} color={theme.colors.accent} />
        <Text style={[theme.type.body, { color: theme.colors.accent }]}>{t("common.back")}</Text>
      </Pressable>

      <View style={{ gap: theme.space.xs }}>
        <Text style={[theme.type.display, { color: theme.colors.text }]}>{t("dev.title")}</Text>
        <Text style={[theme.type.bodySmall, { color: theme.colors.textMuted }]}>
          {t("dev.subtitle")}
        </Text>
      </View>

      {saved ? (
        <Text
          style={[theme.type.bodySmall, { color: theme.semantic.complete }]}
          accessibilityLiveRegion="polite"
        >
          {saved}
        </Text>
      ) : null}

      <View style={{ gap: theme.space.sm }}>
        <Text style={[theme.type.label, { color: theme.colors.textMuted }]}>
          {t("dev.server")}
        </Text>
        <Text style={[theme.type.dataSmall, { color: theme.colors.text }]} selectable>
          {apiBaseUrl()}
        </Text>
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          {apiBaseOverride()
            ? t("dev.serverOverridden", { url: DEFAULT_API_BASE_URL })
            : t("dev.serverDefault")}
        </Text>

        <TextInput
          mono
          value={url}
          onChangeText={setUrl}
          placeholder="192.168.1.20:3001/api"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          accessibilityLabel={t("dev.server")}
        />
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          {t("dev.serverHelp")}
        </Text>

        <Button
          label={t("dev.serverApply")}
          onPress={() => applyUrl(url)}
          busy={busy}
          disabled={busy || normalizeBaseUrl(url) === null}
        />
        <Button
          label={t("dev.serverReset")}
          variant="secondary"
          onPress={() => applyUrl(null)}
          disabled={busy || !apiBaseOverride()}
        />
        <Button
          label={t("dev.testConnection")}
          variant="quiet"
          onPress={testConnection}
          busy={probe === "checking"}
          disabled={probe === "checking"}
        />
        {probe === "ok" || probe === "failed" ? (
          <Text
            style={[
              theme.type.bodySmall,
              { color: probe === "ok" ? theme.semantic.complete : theme.semantic.error },
            ]}
            accessibilityLiveRegion="polite"
          >
            {probe === "ok" ? t("dev.reachable") : t("dev.unreachable")}
          </Text>
        ) : null}
      </View>

      <View style={{ gap: theme.space.sm }}>
        <Text style={[theme.type.label, { color: theme.colors.textMuted }]}>
          {t("dev.region")}
        </Text>
        <Text style={[theme.type.dataSmall, { color: theme.colors.text }]}>{region ?? "—"}</Text>

        <TextInput
          mono
          value={regionInput}
          onChangeText={setRegionInput}
          placeholder="test"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={t("dev.region")}
        />
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          {t("dev.regionHelp")}
        </Text>

        <Button
          label={t("dev.regionApply")}
          onPress={applyRegion}
          disabled={!regionInput.trim() || regionInput.trim().toLowerCase() === region}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: MIN_TOUCH_TARGET,
    marginLeft: -6,
  },
});
