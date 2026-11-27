import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

/**
 * The frame every field shares: label, optional help, the control, and an
 * error or hint beneath.
 *
 * Help text is always visible rather than hidden behind a tooltip. The web app
 * puts eleven tooltips on one tab and uses them as the *only* labels on its
 * collapsed drawer — an interaction that does not exist on touch.
 */
export function Field({
  label,
  help,
  required = false,
  error,
  children,
}: {
  label: string;
  help?: string;
  required?: boolean;
  error?: string | null;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.space.xs, marginBottom: theme.space.lg }}>
      <View style={styles.labelRow}>
        <Text style={[theme.type.label, { color: theme.colors.text }]}>{label}</Text>
        {required ? (
          <Text
            style={[theme.type.caption, { color: theme.colors.textMuted }]}
            // Announced as words; a bare asterisk is meaningless to a screen
            // reader and easy to miss visually.
            accessibilityLabel="required"
          >
            ·  required
          </Text>
        ) : null}
      </View>

      {help ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{help}</Text>
      ) : null}

      {children}

      {error ? (
        <Text
          style={[theme.type.caption, { color: theme.semantic.incomplete }]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
});
