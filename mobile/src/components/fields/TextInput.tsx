import { StyleSheet, TextInput as RNTextInput, type TextInputProps } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

/**
 * The shared text input.
 *
 * `mono` switches to tabular figures for coordinates, depths, EPSG codes and
 * identifiers — values that are compared rather than read.
 */
export function TextInput({
  value,
  onChangeText,
  multiline = false,
  mono = false,
  ...rest
}: TextInputProps & { mono?: boolean }) {
  const theme = useTheme();

  return (
    <RNTextInput
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      placeholderTextColor={theme.colors.textMuted}
      style={[
        mono ? theme.type.data : theme.type.body,
        styles.input,
        {
          color: theme.colors.text,
          backgroundColor: theme.colors.surfaceRaised,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.space.md,
          paddingTop: multiline ? theme.space.md : undefined,
          minHeight: multiline ? MIN_TOUCH_TARGET * 2.5 : MIN_TOUCH_TARGET,
          textAlignVertical: multiline ? "top" : "center",
        },
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1 },
});
