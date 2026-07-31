import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

import { NetworkError } from "@/api/errors";
import { requestPasswordReset } from "@/auth/session";
import { AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { LabelledInput } from "@/components/LabelledInput";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Ask for a password link.
 *
 * Also how an OAuth-only user gets their first password: the server no longer
 * requires an existing one and sends "set a password" copy instead. The note
 * says so, because otherwise someone who signs in with Google has no reason to
 * think a "forgot password" screen applies to them.
 */
export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof NetworkError ? t("auth.offlineCannotSignIn") : t("actions.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen
      title={t("forgot.title")}
      subtitle={sent ? undefined : t("forgot.explain")}
      onBack={() => router.replace("/sign-in")}
    >
      {sent ? (
        <>
          {/* Same wording whether or not the address exists — the server
              answers identically to avoid enumeration. */}
          <Text style={[theme.type.body, { color: theme.colors.text }]}>{t("forgot.sent")}</Text>
          <Button
            label={t("forgot.back")}
            variant="secondary"
            onPress={() => router.replace("/sign-in")}
          />
        </>
      ) : (
        <>
          <LabelledInput
            label={t("auth.email")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            {t("forgot.oauthNote")}
          </Text>

          {error ? (
            <Text
              style={[theme.type.bodySmall, { color: theme.semantic.error }]}
              accessibilityLiveRegion="polite"
            >
              {error}
            </Text>
          ) : null}

          <Button
            label={t("forgot.submit")}
            onPress={submit}
            busy={busy}
            disabled={!email.trim() || busy}
          />
        </>
      )}
    </AuthScreen>
  );
}
