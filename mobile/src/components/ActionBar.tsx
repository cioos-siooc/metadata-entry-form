import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme/ThemeProvider";

/**
 * Bottom-anchored primary actions.
 *
 * Everything the user is meant to do sits in the thumb zone, above the home
 * indicator. The web app puts its save control top-right-ish as a fixed FAB with
 * a hand-set z-index, where it collides with the keyboard and the indicator; a
 * primary action at the top of a phone screen is also simply out of reach
 * one-handed on a moving deck.
 */
export function ActionBar({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.surfaceRaised,
          borderTopColor: theme.colors.border,
          paddingBottom: insets.bottom + theme.space.md,
          paddingTop: theme.space.md,
          paddingHorizontal: theme.space.lg,
          gap: theme.space.md,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: 1, flexDirection: "row", alignItems: "center" },
});
