import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { EntityKind } from "@/api/entities";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/fields/TextInput";
import { useLibrary } from "@/records/useLibrary";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

/**
 * Pick a saved contact, platform or instrument into the record.
 *
 * The entry is copied, not referenced: the record must stay a self-contained
 * document, and editing a saved contact months later must not silently rewrite
 * every record that used it.
 */
export function LibraryPicker({
  visible,
  kind,
  titleFor,
  subtitleFor,
  onPick,
  onClose,
}: {
  visible: boolean;
  kind: EntityKind;
  titleFor: (data: Record<string, unknown>) => string;
  subtitleFor?: (data: Record<string, unknown>) => string;
  onPick: (data: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { entries, loading, fromCache, error } = useLibrary(kind);
  const [filter, setFilter] = useState("");

  const query = filter.trim().toLowerCase();
  const visibleEntries = entries.filter((entry) => {
    if (!query) return true;
    const haystack = `${titleFor(entry.data)} ${subtitleFor?.(entry.data) ?? ""}`.toLowerCase();
    return haystack.includes(query);
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surfaceRaised,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
              padding: theme.space.lg,
              paddingBottom: insets.bottom + theme.space.lg,
              gap: theme.space.md,
            },
          ]}
        >
          <Text style={[theme.type.title, { color: theme.colors.text }]}>
            {t(`library.addFrom.${kind}`)}
          </Text>

          {fromCache ? (
            <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
              {t("library.cached")}
            </Text>
          ) : null}

          <TextInput
            value={filter}
            onChangeText={setFilter}
            placeholder={t("library.search")}
            autoCapitalize="none"
            accessibilityLabel={t("library.search")}
          />

          <ScrollView style={{ maxHeight: 320 }}>
            <View style={{ gap: theme.space.sm }}>
              {visibleEntries.map((entry) => (
                <Pressable
                  key={entry.id}
                  onPress={() => {
                    onPick(entry.data);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={titleFor(entry.data) || t("records.untitled")}
                  style={({ pressed }) => [
                    styles.entry,
                    {
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.md,
                      padding: theme.space.md,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[theme.type.body, { color: theme.colors.text }]}>
                      {titleFor(entry.data) || t("records.untitled")}
                    </Text>
                    {subtitleFor?.(entry.data) ? (
                      <Text style={[theme.type.dataSmall, { color: theme.colors.textMuted }]}>
                        {subtitleFor(entry.data)}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="add" size={20} color={theme.colors.accent} />
                </Pressable>
              ))}

              {!loading && visibleEntries.length === 0 ? (
                <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
                  {entries.length === 0 ? t("library.emptyForRecord") : t("library.noMatches")}
                </Text>
              ) : null}
            </View>
          </ScrollView>

          {error ? (
            <Text style={[theme.type.bodySmall, { color: theme.semantic.error }]}>
              {t("library.unavailable")}
            </Text>
          ) : null}

          <Button label={t("actions.cancel")} variant="quiet" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { width: "100%" },
  entry: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: MIN_TOUCH_TARGET,
  },
});
