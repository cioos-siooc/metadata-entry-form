import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";

import { verifyEmail } from "@/auth/session";
import { AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";

/** Consumes an email-confirmation token, arriving by deep link. */
export default function VerifyEmailScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [state, setState] = useState<"working" | "done" | "invalid">("working");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setState("invalid");
        return;
      }
      try {
        await verifyEmail(token);
        if (!cancelled) setState("done");
      } catch {
        // The token is single-use, so a second tap on the same link lands here.
        // Nothing is wrong with the account; the message says to just sign in.
        if (!cancelled) setState("invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthScreen title={t("verify.title")} onBack={() => router.replace("/sign-in")}>
      <Text
        style={[
          theme.type.body,
          {
            color:
              state === "done"
                ? theme.semantic.complete
                : state === "invalid"
                  ? theme.semantic.incomplete
                  : theme.colors.textMuted,
          },
        ]}
      >
        {t(`verify.${state}`)}
      </Text>

      {state !== "working" ? (
        <Button label={t("auth.signIn")} onPress={() => router.replace("/sign-in")} />
      ) : null}
    </AuthScreen>
  );
}
