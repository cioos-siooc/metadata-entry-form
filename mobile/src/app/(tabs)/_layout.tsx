import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { useSession } from "@/auth/SessionProvider";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  // Per-region, and refetched whenever the region changes — there is no global
  // role. Offline this comes from the cached receipt.
  const { roles } = useSession();
  const canReview = roles.isReviewer || roles.isAdmin;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceRaised,
          borderTopColor: theme.colors.border,
          minHeight: MIN_TOUCH_TARGET + theme.space.md,
        },
        tabBarLabelStyle: theme.type.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.records"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t("tabs.library"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: t("tabs.review"),
          // `href: null` keeps the route reachable by deep link but hides the
          // tab, which is what we want for a role the user may gain later.
          href: canReview ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t("tabs.more"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
