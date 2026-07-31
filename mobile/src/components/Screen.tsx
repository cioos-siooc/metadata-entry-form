import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { contentColumn } from "@/theme/layout";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Standard screen frame: themed surface, safe-area aware, optional title.
 *
 * The web app positions its save control with `position: fixed` and a
 * hand-set z-index, which lands under the iOS home indicator and collides with
 * the keyboard. Insets are handled here instead so no screen has to think
 * about it.
 */
export function Screen({
  title,
  subtitle,
  scroll = true,
  children,
}: {
  title?: string;
  subtitle?: string;
  scroll?: boolean;
  children?: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const header = title ? (
    <View style={styles.header}>
      <Text style={[theme.type.display, { color: theme.colors.text }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[
            theme.type.bodySmall,
            { color: theme.colors.textMuted, marginTop: theme.space.xs },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  ) : null;

  const padding = {
    paddingTop: insets.top + theme.space.lg,
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space.xl,
  };

  if (!scroll) {
    return (
      <View
        style={[
          styles.fill,
          { backgroundColor: theme.colors.surface },
          padding,
          contentColumn,
        ]}
      >
        {header}
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.fill, { backgroundColor: theme.colors.surface }]}
      contentContainerStyle={[padding, contentColumn]}
      keyboardShouldPersistTaps="handled"
    >
      {header}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { marginBottom: 20 },
});
