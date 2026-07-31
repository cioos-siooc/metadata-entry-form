import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { byteLength, MAX_TRANSLATE_BYTES, translateText } from "@/api/translate";
import { useSession } from "@/auth/SessionProvider";
import type { Language } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

import { TextInput } from "./TextInput";

/** Provenance for a machine translation, carried in the record. */
export interface TranslationMark {
  verified?: boolean;
  message?: string;
}

export interface BilingualValue {
  en: string;
  fr: string;
  translations?: Partial<Record<Language, TranslationMark>>;
  [extra: string]: unknown;
}

const PROVENANCE = "text translated using Cohere / texte traduit à l'aide de Cohere";

/**
 * Paired English and French inputs.
 *
 * Both are always shown, with the active UI language first. The alternative —
 * a language toggle — hides the fact that the other language is empty, and
 * several validators require *both*, so a user could believe a field is done
 * when it will block submission.
 *
 * The per-language filled marks exist for the same reason: bilingual is not
 * optional for this audience, and the cost of discovering that at submit time
 * is a trip back through eight sections.
 *
 * Translation is an assist, not an answer. A machine translation is recorded as
 * unverified until a person says otherwise, and that mark travels with the
 * record — which is the whole point of the provenance sidecar the web app
 * introduced.
 */
export function BilingualTextInput({
  value,
  onChange,
  multiline = false,
  placeholder,
}: {
  value: BilingualValue | undefined;
  onChange: (next: BilingualValue) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { isOffline } = useSession();

  const [busy, setBusy] = useState<Language | null>(null);
  const [failed, setFailed] = useState(false);

  const current: BilingualValue = { ...value, en: value?.en ?? "", fr: value?.fr ?? "" };
  const order: Language[] = i18n.language === "fr" ? ["fr", "en"] : ["en", "fr"];
  const labels: Record<Language, string> = { en: "English", fr: "Français" };

  const setText = (lang: Language, text: string) => onChange({ ...current, [lang]: text });

  const markTranslation = (
    base: BilingualValue,
    lang: Language,
    mark: TranslationMark,
  ): BilingualValue => ({
    ...base,
    translations: { ...base.translations, [lang]: mark },
  });

  const runTranslate = async (from: Language) => {
    const into: Language = from === "en" ? "fr" : "en";
    setBusy(from);
    setFailed(false);
    try {
      const result = await translateText(current[from], from);
      onChange(
        markTranslation({ ...current, [into]: result.translatedText }, into, {
          verified: false,
          message: result.translationMessage || PROVENANCE,
        }),
      );
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ gap: theme.space.sm }}>
      {order.map((lang) => {
        const filled = current[lang].trim().length > 0;
        const into: Language = lang === "en" ? "fr" : "en";
        const tooLong = byteLength(current[lang]) >= MAX_TRANSLATE_BYTES;
        const mark = current.translations?.[lang];

        return (
          <View key={lang} style={{ gap: 4 }}>
            <View style={styles.langRow}>
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {labels[lang]}
              </Text>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: filled ? theme.semantic.complete : theme.colors.border,
                  },
                ]}
                accessibilityLabel={filled ? `${labels[lang]} filled` : `${labels[lang]} empty`}
              />
            </View>

            <TextInput
              value={current[lang]}
              onChangeText={(text) => setText(lang, text)}
              multiline={multiline}
              placeholder={placeholder}
              accessibilityLabel={labels[lang]}
            />

            {/* Translating *from* this language fills the other one. */}
            {filled ? (
              <Pressable
                onPress={() => runTranslate(lang)}
                disabled={isOffline || tooLong || busy !== null}
                accessibilityRole="button"
                accessibilityLabel={t("translate.action", { language: labels[into] })}
                style={[
                  styles.translate,
                  { opacity: isOffline || tooLong || busy !== null ? 0.5 : 1 },
                ]}
              >
                {busy === lang ? (
                  <ActivityIndicator size="small" color={theme.colors.accent} />
                ) : (
                  <Ionicons name="language-outline" size={16} color={theme.colors.accent} />
                )}
                <Text style={[theme.type.caption, { color: theme.colors.accent }]}>
                  {tooLong
                    ? t("translate.tooLong")
                    : isOffline
                      ? t("translate.offline")
                      : t("translate.action", { language: labels[into] })}
                </Text>
              </Pressable>
            ) : null}

            {/* The verification mark belongs to the language that was produced. */}
            {filled && mark ? (
              <Pressable
                onPress={() =>
                  onChange(
                    markTranslation(current, lang, {
                      verified: !mark.verified,
                      ...(mark.verified ? { message: mark.message || PROVENANCE } : {}),
                    }),
                  )
                }
                accessibilityRole="checkbox"
                accessibilityState={{ checked: Boolean(mark.verified) }}
                accessibilityLabel={t("translate.verified")}
                style={styles.verify}
              >
                <Ionicons
                  name={mark.verified ? "checkbox" : "square-outline"}
                  size={18}
                  color={mark.verified ? theme.semantic.complete : theme.colors.textMuted}
                />
                <Text style={[theme.type.caption, { color: theme.colors.textMuted, flex: 1 }]}>
                  {mark.verified ? t("translate.verified") : t("translate.unverified")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}

      {failed ? (
        <Text
          style={[theme.type.caption, { color: theme.semantic.error }]}
          accessibilityLiveRegion="polite"
        >
          {t("translate.failed")}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  langRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  translate: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36 },
  verify: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36 },
});
