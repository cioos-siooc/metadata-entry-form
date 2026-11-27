import { useTranslation } from "react-i18next";
import { Text, View, type TextInputProps } from "react-native";

import { TextInput } from "@/components/fields/TextInput";
import { useTheme } from "@/theme/ThemeProvider";

/** Label plus input. Used by the account screens, which have no ledger. */
export function LabelledInput({
  label,
  hint,
  ...rest
}: TextInputProps & { label: string; hint?: string }) {
  const theme = useTheme();
  useTranslation();

  return (
    <View style={{ gap: 4 }}>
      <Text style={[theme.type.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <TextInput accessibilityLabel={label} {...rest} />
      {hint ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}
