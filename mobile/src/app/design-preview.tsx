import { contrastRatio } from "@cioos/shared/theme/color.js";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { bundledRegionList } from "@/api/regions";
import { Screen } from "@/components/Screen";
import type { Language } from "@/i18n";
import { buildTheme, useTheme } from "@/theme/ThemeProvider";
import { surfaces, type ThemeName } from "@/theme/tokens";

/**
 * Design system preview.
 *
 * Exists because the accent tone-mapping is otherwise only provable through
 * unit tests. Three of the six regional brand colours fail WCAG AA used raw —
 * St-Laurent at 2.42:1, Test at 1.63:1, Amundsen at 4.47:1 — so being able to
 * see all of them, in all three themes, with their measured contrast, is worth
 * a screen.
 */

const THEMES: ThemeName[] = ["light", "dark", "night"];

function Swatch({
  hex,
  on,
  label,
  ratio,
}: {
  hex: string;
  on: string;
  label: string;
  ratio: number;
}) {
  const theme = useTheme();
  const passes = ratio >= 4.5;
  return (
    <View style={{ gap: 2 }}>
      <View
        style={[
          styles.swatch,
          { backgroundColor: hex, borderRadius: theme.radius.sm, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[theme.type.dataSmall, { color: on }]}>{label}</Text>
      </View>
      <Text
        style={[
          theme.type.dataSmall,
          { color: passes ? theme.semantic.complete : theme.semantic.error },
        ]}
      >
        {ratio.toFixed(2)}:1 {passes ? "AA" : "FAIL"}
      </Text>
    </View>
  );
}

export default function DesignPreviewScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const regions = bundledRegionList(i18n.language as Language);

  return (
    <Screen title={t("designPreview.title")} subtitle={t("designPreview.subtitle")}>
      {/* Type scale */}
      <Text style={[theme.type.label, { color: theme.colors.textMuted, marginBottom: 8 }]}>
        {t("designPreview.typeScale")}
      </Text>
      <View style={{ gap: theme.space.sm, marginBottom: theme.space.xxl }}>
        <Text style={[theme.type.display, { color: theme.colors.text }]}>Display 28</Text>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>Title 20</Text>
        <Text style={[theme.type.heading, { color: theme.colors.text }]}>Heading 16</Text>
        <Text style={[theme.type.body, { color: theme.colors.text }]}>
          Body 16 — Hakai nearshore CTD casts, Gitga&apos;at Territory
        </Text>
        <Text style={[theme.type.bodySmall, { color: theme.colors.textMuted }]}>
          Body small 14 — étendue verticale, plateforme, échantillonnage
        </Text>
        {/* The mono role is load-bearing: these must align in a column. */}
        <Text style={[theme.type.data, { color: theme.colors.text }]}>
          49.23500 N {"\n"}
          -123.11167 E{"\n"}
          0 – 250 m
        </Text>
        <Text style={[theme.type.dataSmall, { color: theme.colors.textMuted }]}>
          10.21966/1.774457 · 4326
        </Text>
      </View>

      {/* Semantic colours */}
      <Text style={[theme.type.label, { color: theme.colors.textMuted, marginBottom: 8 }]}>
        {t("designPreview.semantic")}
      </Text>
      <View style={styles.row}>
        {(["complete", "incomplete", "error", "queued"] as const).map((key) => (
          <Swatch
            key={key}
            hex={theme.semantic[key]}
            on={theme.colors.onAccent}
            label={key.slice(0, 4)}
            ratio={contrastRatio(theme.semantic[key], theme.colors.surface)}
          />
        ))}
      </View>

      {/* Every region, every theme */}
      <Text
        style={[
          theme.type.label,
          { color: theme.colors.textMuted, marginTop: theme.space.xxl, marginBottom: 8 },
        ]}
      >
        {t("designPreview.accents")}
      </Text>

      {regions.map((region) => (
        <View key={region.id} style={{ marginBottom: theme.space.xl, gap: theme.space.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: theme.space.sm }}>
            <View
              style={[styles.brandDot, { backgroundColor: region.brandHex }]}
              accessibilityLabel={`brand ${region.brandHex}`}
            />
            <Text style={[theme.type.heading, { color: theme.colors.text }]}>{region.title}</Text>
            <Text style={[theme.type.dataSmall, { color: theme.colors.textMuted }]}>
              {region.brandHex}
            </Text>
          </View>

          {/* What the raw brand colour would have scored, for contrast. */}
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            raw on light: {contrastRatio(region.brandHex, surfaces.light.surface).toFixed(2)}:1
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: theme.space.md }}>
              {THEMES.map((name) => {
                const preview = buildTheme(name, region.brandHex);
                return (
                  <View key={name} style={{ gap: 4 }}>
                    <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                      {t(`appearance.${name}`)}
                    </Text>
                    <Swatch
                      hex={preview.colors.accentFill}
                      on={preview.colors.onAccent}
                      label="fill"
                      ratio={contrastRatio(preview.colors.accentFill, preview.colors.onAccent)}
                    />
                    <Swatch
                      hex={preview.colors.surface}
                      on={preview.colors.accent}
                      label="text"
                      ratio={contrastRatio(preview.colors.accent, preview.colors.surface)}
                    />
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  swatch: {
    width: 72,
    height: 48,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  brandDot: { width: 16, height: 16, borderRadius: 8 },
});
