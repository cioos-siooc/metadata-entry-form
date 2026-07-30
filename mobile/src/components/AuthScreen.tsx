import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

/** Shared frame for the account screens: back link, title, body. */
export function AuthScreen({
  title,
  subtitle,
  children,
  onBack,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.surface }}
      contentContainerStyle={{
        paddingTop: insets.top + theme.space.sm,
        paddingHorizontal: theme.space.lg,
        paddingBottom: insets.bottom + theme.space.xxl,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        onPress={onBack ?? (() => router.back())}
        accessibilityRole="button"
        accessibilityLabel={t("forgot.back")}
        style={styles.back}
      >
        <Ionicons name="chevron-back" size={22} color={theme.colors.accent} />
        <Text style={[theme.type.body, { color: theme.colors.accent }]}>
          {t("forgot.back")}
        </Text>
      </Pressable>

      <Text style={[theme.type.display, { color: theme.colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text
          style={[
            theme.type.body,
            { color: theme.colors.textMuted, marginTop: theme.space.sm, marginBottom: theme.space.lg },
          ]}
        >
          {subtitle}
        </Text>
      ) : (
        <View style={{ marginBottom: theme.space.lg }} />
      )}

      <View style={{ gap: theme.space.md }}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: "row", alignItems: "center", minHeight: MIN_TOUCH_TARGET, marginLeft: -6 },
});
