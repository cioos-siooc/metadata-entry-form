
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

import { ApiError, NetworkError } from "@/api/errors";
import { setPassword } from "@/auth/session";
import { AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { LabelledInput } from "@/components/LabelledInput";
import { useTheme } from "@/theme/ThemeProvider";
import { useGoBack } from "@/navigation/useGoBack";

const MIN_PASSWORD = 8;

/**
 * Set or change a password while signed in.
 *
 * The route an OAuth-only user actually wants: no emailed token to deep-link
 * back into the app, which is fiddly and a known App Store review snag. The
 * server only requires a current password when one already exists.
 */
export default function SetPasswordScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const goBack = useGoBack("/(tabs)/more");

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (next.length < MIN_PASSWORD) return setError(t("register.weak"));
    setBusy(true);
    try {
      await setPassword(next, current || undefined);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof NetworkError
          ? t("auth.offlineCannotSignIn")
          : err instanceof ApiError && err.status === 403
            ? t("setPassword.wrongCurrent")
            : t("actions.failed"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen
      title={t("setPassword.title")}
      subtitle={t("setPassword.addHelp")}
      onBack={() => goBack()}
    >
      {done ? (
        <>
          <Text style={[theme.type.body, { color: theme.semantic.complete }]}>
            {t("setPassword.saved")}
          </Text>
          <Button label={t("editor.back")} onPress={() => goBack()} />
        </>
      ) : (
        <>
          {/* Optional: an account with no password has nothing to prove. */}
          <LabelledInput
            label={t("setPassword.current")}
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
            autoComplete="current-password"
          />
          <LabelledInput
            label={t("setPassword.new")}
            hint={t("register.passwordRule")}
            value={next}
            onChangeText={setNext}
            secureTextEntry
            autoComplete="new-password"
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
            label={t("setPassword.submit")}
            onPress={submit}
            busy={busy}
            disabled={!next || busy}
          />
        </>
      )}
    </AuthScreen>
  );
}
