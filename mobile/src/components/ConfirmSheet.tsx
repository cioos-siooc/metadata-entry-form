import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { contentColumn } from "@/theme/layout";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * A single confirmation sheet.
 *
 * One modal, never stacked. Reviewer.jsx in the web app mounts six SimpleModals
 * simultaneously with menus opening on top of them at hand-set z-indices; on a
 * phone that is unrecoverable. Destructive confirmations name the consequence
 * rather than asking "are you sure?", which tells the user nothing.
 */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel={t("actions.cancel")}>
        <Pressable
          // Swallow taps on the sheet itself so it does not dismiss.
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
          <Text style={[theme.type.title, { color: theme.colors.text }]}>{title}</Text>
          {message ? (
            <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>{message}</Text>
          ) : null}

          <Button
            label={confirmLabel}
            onPress={onConfirm}
            busy={busy}
            variant={destructive ? "secondary" : "primary"}
          />
          <Button label={t("actions.cancel")} variant="quiet" onPress={onCancel} disabled={busy} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { width: "100%" },
});
