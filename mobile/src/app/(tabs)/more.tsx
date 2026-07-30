import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useSession } from "@/auth/SessionProvider";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { SUPPORTED_LANGUAGES, type Language } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET, type ThemeName } from "@/theme/tokens";

const THEME_CHOICES: (ThemeName | null)[] = [null, "light", "dark", "night"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space.sm, marginBottom: theme.space.xl }}>
      <Text style={[theme.type.label, { color: theme.colors.textMuted }]}>{title}</Text>
      {children}
    </View>
  );
}

/** Segmented control. Every option stays visible — no hidden picker sheet. */
function Choices<T>({
  options,
  selected,
  labelFor,
  onSelect,
}: {
  options: T[];
  selected: T;
  labelFor: (value: T) => string;
  onSelect: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm }}>
      {options.map((option, index) => {
        const active = option === selected;
        return (
          <Pressable
            key={index}
            onPress={() => onSelect(option)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={labelFor(option)}
            style={({ pressed }) => [
              styles.choice,
              {
                borderColor: active ? theme.colors.accent : theme.colors.border,
                backgroundColor: active ? theme.colors.accentFill : "transparent",
                borderRadius: theme.radius.pill,
                paddingHorizontal: theme.space.lg,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[
                theme.type.bodySmall,
                { color: active ? theme.colors.onAccent : theme.colors.text },
              ]}
            >
              {labelFor(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function MoreScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const {
    user,
    isOffline,
    region,
    setRegion,
    language,
    setLanguage,
    themeOverride,
    setThemeOverride,
    signOut,
  } = useSession();

  return (
    <Screen title={t("more.title")}>
      {user ? (
        <View style={{ marginBottom: theme.space.xl, gap: theme.space.xs }}>
          <Text style={[theme.type.heading, { color: theme.colors.text }]}>
            {user.displayName}
          </Text>
          <Text style={[theme.type.dataSmall, { color: theme.colors.textMuted }]}>
            {user.email}
          </Text>
          {isOffline ? (
            <Text style={[theme.type.caption, { color: theme.semantic.incomplete }]}>
              {t("sync.offline")}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Section title={t("more.region")}>
        <Text style={[theme.type.body, { color: theme.colors.text }]}>{region ?? "—"}</Text>
        <Button
          label={t("regionSelect.title")}
          variant="secondary"
          onPress={() => setRegion(null)}
        />
      </Section>

      <Section title={t("more.language")}>
        <Choices<Language>
          options={[...SUPPORTED_LANGUAGES]}
          selected={language}
          labelFor={(value) => (value === "en" ? "English" : "Français")}
          onSelect={setLanguage}
        />
      </Section>

      <Section title={t("more.appearance")}>
        <Choices<ThemeName | null>
          options={THEME_CHOICES}
          selected={themeOverride}
          labelFor={(value) => (value === null ? "Auto" : t(`appearance.${value}`))}
          onSelect={setThemeOverride}
        />
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          {t("appearance.nightHint")}
        </Text>
      </Section>

      <Section title={t("more.designPreview")}>
        <Link href="/design-preview" asChild>
          <Pressable
            accessibilityRole="link"
            style={{
              minHeight: MIN_TOUCH_TARGET,
              flexDirection: "row",
              alignItems: "center",
              gap: theme.space.sm,
            }}
          >
            <Ionicons name="color-palette-outline" size={20} color={theme.colors.accent} />
            <Text style={[theme.type.body, { color: theme.colors.accent }]}>
              {t("more.designPreview")}
            </Text>
          </Pressable>
        </Link>
      </Section>

      <Button label={t("more.signOut")} variant="quiet" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  choice: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
