import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { ApiError, NetworkError } from "@/api/errors";
import { useSession } from "@/auth/SessionProvider";
import type { OAuthProvider } from "@/auth/oauth";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

const PROVIDERS: { id: OAuthProvider; labelKey: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "google", labelKey: "auth.google", icon: "logo-google" },
  { id: "microsoft", labelKey: "auth.microsoft", icon: "logo-microsoft" },
  // ORCID is deliberately absent: it releases no email unless the user made it
  // public, and the API requires one, so first-time ORCID sign-in fails. Server
  // needs an email-completion step before this can be offered.
];

export default function SignInScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { signIn, signInWith } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "password" | OAuthProvider>(null);
  const [error, setError] = useState<string | null>(null);

  const describe = (err: unknown): string => {
    if (err instanceof NetworkError) return t("auth.offlineCannotSignIn");
    if (err instanceof ApiError) {
      if (err.status === 401) return t("auth.invalidCredentials");
      if (err.status === 403) return t("auth.unverified");
      return err.message;
    }
    return t("auth.invalidCredentials");
  };

  const submitPassword = async () => {
    setError(null);
    setBusy("password");
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(describe(err));
    } finally {
      setBusy(null);
    }
  };

  const submitProvider = async (provider: OAuthProvider) => {
    setError(null);
    setBusy(provider);
    const result = await signInWith(provider);
    if (result.status === "cancelled") setError(null);
    else if (result.status === "error") setError(result.message);
    setBusy(null);
  };

  const inputStyle = [
    theme.type.body,
    styles.input,
    {
      color: theme.colors.text,
      backgroundColor: theme.colors.surfaceRaised,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.space.md,
    },
  ];

  return (
    <Screen title={t("auth.signIn")}>
      <View style={{ gap: theme.space.md }}>
        <View style={{ gap: theme.space.xs }}>
          <Text style={[theme.type.label, { color: theme.colors.textMuted }]}>
            {t("auth.email")}
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={inputStyle}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            accessibilityLabel={t("auth.email")}
          />
        </View>

        <View style={{ gap: theme.space.xs }}>
          <Text style={[theme.type.label, { color: theme.colors.textMuted }]}>
            {t("auth.password")}
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            style={inputStyle}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={submitPassword}
            accessibilityLabel={t("auth.password")}
          />
        </View>

        {error ? (
          <Text
            style={[theme.type.bodySmall, { color: theme.semantic.error }]}
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
        ) : null}

        <Button
          label={busy === "password" ? t("auth.signingIn") : t("auth.signIn")}
          onPress={submitPassword}
          busy={busy === "password"}
          disabled={!email.trim() || !password || busy !== null}
        />

        <Button
          label={t("forgot.link")}
          variant="quiet"
          onPress={() => router.push("/auth/forgot-password")}
          disabled={busy !== null}
        />

        <Button
          label={t("register.title")}
          variant="secondary"
          onPress={() => router.push("/auth/register")}
          disabled={busy !== null}
        />

        <Text
          style={[
            theme.type.caption,
            { color: theme.colors.textMuted, textAlign: "center", marginTop: theme.space.sm },
          ]}
        >
          {t("auth.continueWith")}
        </Text>

        {PROVIDERS.map((provider) => (
          <Button
            key={provider.id}
            label={t(provider.labelKey)}
            variant="secondary"
            onPress={() => submitProvider(provider.id)}
            busy={busy === provider.id}
            disabled={busy !== null}
            icon={<Ionicons name={provider.icon} size={18} color={theme.colors.accent} />}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
  },
});
