import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import type { EntityKind } from "@/api/entities";
import { useLibrary } from "@/records/useLibrary";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

/**
 * Keeps a contact, platform or instrument for next time.
 *
 * Online only, and it says so rather than failing silently: writing to the
 * library offline would need its own queued mutation and conflict story for a
 * convenience the user can defer without losing anything — the entry is already
 * safe inside the record.
 */
export function SaveToLibrary({
  kind,
  data,
}: {
  kind: EntityKind;
  data: Record<string, unknown>;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { save, offline } = useLibrary(kind);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  const onPress = async () => {
    setState("saving");
    try {
      await save(data);
      setState("saved");
    } catch {
      setState("failed");
    }
  };

  const label =
    state === "saved"
      ? t("library.saved")
      : state === "failed"
        ? t("actions.failed")
        : offline
          ? t("library.saveOffline")
          : t("library.saveTo");

  return (
    <Pressable
      onPress={onPress}
      disabled={offline || state === "saving" || state === "saved"}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.button, { opacity: offline || state === "saved" ? 0.5 : 1 }]}
    >
      <View style={[styles.row, { gap: 6 }]}>
        {state === "saving" ? (
          <ActivityIndicator size="small" color={theme.colors.accent} />
        ) : (
          <Ionicons
            name={state === "saved" ? "bookmark" : "bookmark-outline"}
            size={18}
            color={state === "failed" ? theme.semantic.error : theme.colors.accent}
          />
        )}
        <Text
          style={[
            theme.type.caption,
            { color: state === "failed" ? theme.semantic.error : theme.colors.accent },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

/** The "add from library" affordance that sits beside a repeater's add button. */
export function LibraryAddButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.add,
        {
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          gap: 6,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons name="bookmark-outline" size={18} color={theme.colors.accent} />
      <Text style={[theme.type.bodySmall, { color: theme.colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: MIN_TOUCH_TARGET, justifyContent: "center", paddingHorizontal: 4 },
  row: { flexDirection: "row", alignItems: "center" },
  add: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
});
