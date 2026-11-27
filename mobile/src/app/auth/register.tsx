import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

import { ApiError, NetworkError } from "@/api/errors";
import { register } from "@/auth/session";
import { AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { LabelledInput } from "@/components/LabelledInput";
import { useTheme } from "@/theme/ThemeProvider";

const MIN_PASSWORD = 8;

/**
 * Create an account.
 *
 * The success message is deliberately non-committal — "if that address can be
 * used" — because the server returns the same 201 whether or not the account
 * already exists. Saying "account created!" would leak exactly the enumeration
 * the server is protecting against.
 */
export default function RegisterScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (password.length < MIN_PASSWORD) return setError(t("register.weak"));
    setBusy(true);
    try {
      await register(email.trim(), password, name.trim() || undefined);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof NetworkError
          ? t("auth.offlineCannotSignIn")
          : err instanceof ApiError
            ? err.message
            : t("actions.failed"),
      );
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <AuthScreen title={t("register.check")} onBack={() => router.replace("/sign-in")}>
        <Text style={[theme.type.body, { color: theme.colors.text }]}>{t("register.sent")}</Text>
        <Button
          label={t("forgot.back")}
          variant="secondary"
          onPress={() => router.replace("/sign-in")}
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title={t("register.title")} onBack={() => router.replace("/sign-in")}>
      <LabelledInput
        label={t("register.name")}
        value={name}
        onChangeText={setName}
        autoComplete="name"
      />
      <LabelledInput
        label={t("auth.email")}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <LabelledInput
        label={t("auth.password")}
        hint={t("register.passwordRule")}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />

      {error ? (
        <Text
          style={[theme.type.bodySmall, { color: theme.semantic.error }]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}

      <Button
        label={t("register.submit")}
        onPress={submit}
        busy={busy}
        disabled={!email.trim() || !password || busy}
      />
      <Button
        label={t("register.haveAccount")}
        variant="quiet"
        onPress={() => router.replace("/sign-in")}
      />
    </AuthScreen>
  );
}
