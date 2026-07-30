import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Ledger, LedgerSection, SectionState } from "@/records/ledger";
import { useTheme, type Theme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

/**
 * The completeness ledger — the app's signature element.
 *
 * It is the answer to the hardest problem here: 48 fields, 21 required, eight
 * sections, and a user who is interrupted constantly. Rather than hiding
 * validation behind a submit button, it is the primary way the record is
 * navigated and understood.
 *
 * Two numbers per section, because neither is sufficient alone. `required`
 * is the actual submit gate; `filled` is whether anything is there at all.
 * Six validators pass vacuously on an empty record, so without the second
 * number this component would confidently report untouched sections as done.
 */

function stateColor(state: SectionState, theme: Theme, touched: boolean): string {
  switch (state) {
    case "complete":
      return theme.semantic.complete;
    case "filled":
      return theme.colors.accent;
    case "attention":
      // Untouched-but-required is quieter than started-and-abandoned. A brand
      // new record has several outstanding sections and should not read as a
      // wall of warnings.
      return touched ? theme.semantic.incomplete : theme.colors.textMuted;
    default:
      return theme.colors.textMuted;
  }
}

function stateIcon(state: SectionState): keyof typeof Ionicons.glyphMap {
  switch (state) {
    case "complete":
      return "checkmark-circle";
    case "filled":
      return "ellipse";
    case "attention":
      return "alert-circle-outline";
    default:
      return "ellipse-outline";
  }
}

/**
 * A section's fill as a bar. Deliberately shows the *field* fill rather than the
 * validator fill: it answers "how much of this have I written", which is what a
 * bar reads as. The required count is stated separately, in words.
 */
function FillBar({ section }: { section: LedgerSection }) {
  const theme = useTheme();
  const ratio = section.total === 0 ? 0 : section.filled / section.total;
  return (
    <View
      style={[
        styles.track,
        { backgroundColor: theme.colors.border, borderRadius: theme.radius.pill },
      ]}
    >
      <View
        style={{
          width: `${Math.round(ratio * 100)}%`,
          height: "100%",
          borderRadius: theme.radius.pill,
          backgroundColor: stateColor(section.state, theme, section.touched),
        }}
      />
    </View>
  );
}

export function SectionRow({
  section,
  onPress,
}: {
  section: LedgerSection;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  const title = t(`sections.${section.id}`);
  const color = stateColor(section.state, theme, section.touched);

  const detail =
    section.required > 0
      ? t("ledger.required", { satisfied: section.satisfied, required: section.required })
      : t("ledger.fields", { filled: section.filled, total: section.total });

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={t("ledger.openSection", { section: title })}
      accessibilityHint={`${t(`ledger.state.${section.state}`)}. ${detail}`}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceRaised,
          padding: theme.space.md,
          gap: theme.space.md,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons name={stateIcon(section.state)} size={22} color={color} />

      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.titleLine}>
          <Text style={[theme.type.heading, { color: theme.colors.text, flex: 1 }]}>
            {title}
          </Text>
          {/* Tabular figures so these align down the column. */}
          <Text style={[theme.type.dataSmall, { color: theme.colors.textMuted }]}>
            {section.required > 0
              ? `${section.satisfied}/${section.required}`
              : `${section.filled}/${section.total}`}
          </Text>
        </View>

        <FillBar section={section} />

        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          {section.required === 0 ? t("ledger.noneRequired") : detail}
        </Text>
      </View>

      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

/** The record-level summary that sits above the sections. */
export function LedgerSummary({ ledger }: { ledger: Ledger }) {
  const theme = useTheme();
  const { t } = useTranslation();

  const outstanding = ledger.requiredTotal - ledger.requiredSatisfied;
  const ratio = ledger.requiredTotal === 0 ? 1 : ledger.requiredSatisfied / ledger.requiredTotal;
  const color = ledger.submittable ? theme.semantic.complete : theme.colors.accent;

  return (
    <View style={{ gap: theme.space.sm, marginBottom: theme.space.lg }}>
      <View style={styles.titleLine}>
        <Text style={[theme.type.label, { color: theme.colors.textMuted, flex: 1 }]}>
          {t("completeness.label")}
        </Text>
        <Text style={[theme.type.data, { color }]}>{Math.round(ledger.percent * 100)}%</Text>
      </View>

      <View
        style={[
          styles.trackTall,
          { backgroundColor: theme.colors.border, borderRadius: theme.radius.pill },
        ]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(ledger.percent * 100) }}
      >
        <View
          style={{
            width: `${Math.round(ratio * 100)}%`,
            height: "100%",
            borderRadius: theme.radius.pill,
            backgroundColor: color,
          }}
        />
      </View>

      <Text style={[theme.type.bodySmall, { color: theme.colors.textMuted }]}>
        {ledger.submittable
          ? t("ledger.readyToSubmit")
          : t("ledger.notReady", { count: outstanding })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: MIN_TOUCH_TARGET + 24,
  },
  titleLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  track: { height: 4, overflow: "hidden" },
  trackTall: { height: 8, overflow: "hidden" },
});
