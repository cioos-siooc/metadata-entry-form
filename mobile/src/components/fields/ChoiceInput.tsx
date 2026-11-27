import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

export interface Choice {
  value: string;
  label: string;
  /** Shown inline rather than in a tooltip. */
  description?: string;
  /** Renders a warning; used for deprecated EOVs, which have their own validator. */
  deprecated?: boolean;
}

/**
 * Single or multiple choice, rendered as a visible list.
 *
 * Not a dropdown. Options carry definitions that matter — 36 EOVs, 81 platform
 * types, 19 contact roles — and burying those behind a picker sheet, or a
 * hover tooltip as the web app does, makes them unreadable on a phone.
 */
export function ChoiceInput({
  choices,
  selected,
  onChange,
  multiple = false,
}: {
  choices: Choice[];
  selected: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
}) {
  const theme = useTheme();

  const toggle = (value: string) => {
    if (!multiple) {
      // Re-tapping the current choice clears it: several of these fields are
      // optional and there is otherwise no way back to "unset".
      onChange(selected.includes(value) ? [] : [value]);
      return;
    }
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  return (
    <View style={{ gap: theme.space.sm }}>
      {choices.map((choice) => {
        const active = selected.includes(choice.value);
        return (
          <Pressable
            key={choice.value}
            onPress={() => toggle(choice.value)}
            accessibilityRole={multiple ? "checkbox" : "radio"}
            accessibilityState={{ checked: active }}
            accessibilityLabel={choice.label}
            accessibilityHint={choice.description}
            style={({ pressed }) => [
              styles.option,
              {
                borderColor: active ? theme.colors.accent : theme.colors.border,
                backgroundColor: theme.colors.surfaceRaised,
                borderRadius: theme.radius.md,
                padding: theme.space.md,
                gap: theme.space.md,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons
              name={
                active
                  ? multiple
                    ? "checkbox"
                    : "radio-button-on"
                  : multiple
                    ? "square-outline"
                    : "radio-button-off"
              }
              size={22}
              color={active ? theme.colors.accent : theme.colors.textMuted}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.labelRow}>
                <Text style={[theme.type.body, { color: theme.colors.text, flex: 1 }]}>
                  {choice.label}
                </Text>
                {choice.deprecated ? (
                  <Ionicons
                    name="warning-outline"
                    size={16}
                    color={theme.semantic.incomplete}
                  />
                ) : null}
              </View>
              {choice.description ? (
                <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                  {choice.description}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: MIN_TOUCH_TARGET,
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
});
