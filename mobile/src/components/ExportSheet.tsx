import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { MetadataRecord } from "@/api/records";
import { Button } from "@/components/Button";
import { exportRecord, EXPORT_FORMATS, type ExportFormat } from "@/records/exports";
import { contentColumn } from "@/theme/layout";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

/**
 * The seven download formats.
 *
 * "Download" ends in the system share sheet rather than a folder, which is what
 * a file on a phone can usefully be. Every format but JSON needs the converter,
 * so the whole sheet is unavailable offline and says so — a failed export that
 * looks like a bug is worse than a disabled button that explains itself.
 */
export function ExportSheet({
  visible,
  region,
  record,
  offline,
  onClose,
}: {
  visible: boolean;
  region: string;
  record: MetadataRecord;
  offline: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const run = async (format: ExportFormat) => {
    setBusy(format);
    setProblem(null);
    try {
      await exportRecord(region, record, format);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : t("actions.failed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.sheet,
            contentColumn,
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
            {t("export.title")}
          </Text>

          {offline ? (
            <Text style={[theme.type.bodySmall, { color: theme.semantic.incomplete }]}>
              {t("export.offline")}
            </Text>
          ) : null}

          {problem ? (
            <Text
              style={[theme.type.bodySmall, { color: theme.semantic.error }]}
              accessibilityLiveRegion="polite"
            >
              {problem}
            </Text>
          ) : null}

          <ScrollView style={{ maxHeight: 340 }}>
            <View style={{ gap: theme.space.sm }}>
              {EXPORT_FORMATS.map((format) => {
                // JSON is the record itself, so it works with no connection.
                const needsNetwork = format !== "json";
                const disabled = (offline && needsNetwork) || busy !== null;
                return (
                  <Pressable
                    key={format}
                    onPress={() => run(format)}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityLabel={t(`export.format.${format}`)}
                    style={({ pressed }) => [
                      styles.entry,
                      {
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.md,
                        padding: theme.space.md,
                        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Text style={[theme.type.body, { color: theme.colors.text, flex: 1 }]}>
                      {t(`export.format.${format}`)}
                    </Text>
                    {busy === format ? (
                      <ActivityIndicator size="small" color={theme.colors.accent} />
                    ) : (
                      <Ionicons
                        name="share-outline"
                        size={18}
                        color={theme.colors.accent}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

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
