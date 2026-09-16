import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

type Variant = "primary" | "secondary" | "quiet";

/**
 * One button. Hit area is never below MIN_TOUCH_TARGET, and there is no
 * hover-only state — the audience is wearing gloves on a moving deck.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  busy = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  busy?: boolean;
  icon?: React.ReactNode;
}) {
  const theme = useTheme();
  const inactive = disabled || busy;

  const palette = {
    primary: {
      background: theme.colors.accentFill,
      text: theme.colors.onAccent,
      border: "transparent",
    },
    secondary: {
      background: "transparent",
      text: theme.colors.accent,
      border: theme.colors.accent,
    },
    quiet: {
      background: "transparent",
      text: theme.colors.textMuted,
      border: "transparent",
    },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.space.lg,
          gap: theme.space.sm,
          opacity: inactive ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={palette.text} size="small" />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text style={[theme.type.heading, { color: palette.text }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
