import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

import { ApiError, NetworkError } from "@/api/errors";
import { resetPassword } from "@/auth/session";
import { AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { LabelledInput } from "@/components/LabelledInput";
import { useTheme } from "@/theme/ThemeProvider";

const MIN_PASSWORD = 8;

/**
 * Sets a password from an emailed token.
 *
 * Reached by deep link. The emailed links point at the web SPA, which is the
 * right default — but App Links let the same URL open here, and a field user who
 * only has the app installed should not be pushed to a browser.
 */
export default function ResetPasswordScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!token) return setError(t("reset.invalid"));
    if (password.length < MIN_PASSWORD) return setError(t("register.weak"));
    setBusy(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof NetworkError
          ? t("auth.offlineCannotSignIn")
          : err instanceof ApiError && err.status === 400
            ? t("reset.invalid")
            : t("actions.failed"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen title={t("reset.title")} onBack={() => router.replace("/sign-in")}>
      {done ? (
        <>
          <Text style={[theme.type.body, { color: theme.semantic.complete }]}>
            {t("reset.done")}
          </Text>
          <Button label={t("auth.signIn")} onPress={() => router.replace("/sign-in")} />
        </>
      ) : (
        <>
          <LabelledInput
            label={t("reset.newPassword")}
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
            label={t("reset.submit")}
            onPress={submit}
            busy={busy}
            disabled={!password || busy}
          />
        </>
      )}
    </AuthScreen>
  );
}
