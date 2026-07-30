import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import type { Language } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

import { TextInput } from "./TextInput";

export interface BilingualValue {
  en: string;
  fr: string;
}

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
  const { i18n } = useTranslation();

  const current: BilingualValue = { en: value?.en ?? "", fr: value?.fr ?? "" };
  const order: Language[] = i18n.language === "fr" ? ["fr", "en"] : ["en", "fr"];
  const labels: Record<Language, string> = { en: "English", fr: "Français" };

  return (
    <View style={{ gap: theme.space.sm }}>
      {order.map((lang) => {
        const filled = current[lang].trim().length > 0;
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
              onChangeText={(text) => onChange({ ...current, [lang]: text })}
              multiline={multiline}
              placeholder={placeholder}
              accessibilityLabel={labels[lang]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  langRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
