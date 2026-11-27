import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { bundledRegionList, fetchRegions, type Region } from "@/api/regions";
import { useSession } from "@/auth/SessionProvider";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import type { Language } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

/**
 * Tenant picker.
 *
 * Falls back to the bundled catalogue when the network is unavailable, because
 * a slightly stale region list is far better than blocking launch — and the
 * bundled table is what the web SPA already ships as its own fallback.
 */
export default function RegionSelectScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { setRegion } = useSession();

  const language = i18n.language as Language;
  const [regions, setRegions] = useState<Region[]>(() => bundledRegionList(language));
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const live = await fetchRegions(language);
        if (!cancelled) {
          setRegions(live);
          setFailed(false);
        }
      } catch {
        // Keep the bundled list on screen; only note that it may be stale.
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language, attempt]);

  const choose = async (region: Region) => {
    await setRegion(region.id);
    router.replace("/");
  };

  return (
    <Screen title={t("regionSelect.title")} subtitle={t("regionSelect.subtitle")}>
      <View style={{ gap: theme.space.md }}>
        {regions.map((region) => {
          return (
            <Pressable
              key={region.id}
              onPress={() => choose(region)}
              accessibilityRole="button"
              accessibilityLabel={region.title}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: theme.colors.surfaceRaised,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.lg,
                  padding: theme.space.lg,
                  gap: theme.space.md,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              {/* The RAW brand colour, deliberately not the tone-mapped
                  accent. Tone-mapping normalises colours toward legibility,
                  which makes Pacific (#006e90) and St-Laurent (#00adef)
                  near-identical — fine for UI chrome, useless for telling two
                  organisations apart. A swatch carries no text, so the raw
                  value is safe here. */}
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: region.brandHex,
                    borderRadius: theme.radius.sm,
                    borderColor: theme.colors.border,
                  },
                ]}
              />
              <Text style={[theme.type.title, { color: theme.colors.text, flex: 1 }]}>
                {region.title}
              </Text>
            </Pressable>
          );
        })}

        {failed ? (
          <View style={{ gap: theme.space.sm, marginTop: theme.space.md }}>
            <Text style={[theme.type.bodySmall, { color: theme.colors.textMuted }]}>
              {t("regionSelect.loadFailed")}
            </Text>
            <Button
              label={t("common.retry")}
              variant="secondary"
              onPress={() => setAttempt((n) => n + 1)}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: MIN_TOUCH_TARGET + 24,
  },
  swatch: { width: 36, height: 36, borderWidth: StyleSheet.hairlineWidth },
});
