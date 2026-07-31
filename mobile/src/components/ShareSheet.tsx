import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { loadRegionUsers, updateRecordShares, type RegionUser } from "@/api/records";
import { Button } from "@/components/Button";
import { TextInput } from "@/components/fields/TextInput";
import { contentColumn } from "@/theme/layout";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

/**
 * Choose who may edit a record.
 *
 * Replace-semantics on the server, so the whole set is sent every time and a
 * replay is harmless. Shared collaborators can edit but not submit — the copy
 * says so, because that restriction is invisible otherwise and surfaces only as
 * a disabled submit button on someone else's screen.
 */
export function ShareSheet({
  visible,
  region,
  recordID,
  current,
  excludeUserID,
  onClose,
  onSaved,
}: {
  visible: boolean;
  region: string;
  recordID: string;
  current: Record<string, boolean>;
  /** The owner — sharing a record with yourself is meaningless. */
  excludeUserID?: string;
  onClose: () => void;
  onSaved: (next: Record<string, boolean>) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [users, setUsers] = useState<RegionUser[]>([]);
  const [selected, setSelected] = useState<string[]>(Object.keys(current ?? {}));
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keyed on the *contents* of `current`, not its identity: callers pass an
  // inline `?? {}`, so depending on the object itself re-runs every render.
  const currentKey = Object.keys(current ?? {}).sort().join(",");

  useEffect(() => {
    if (!visible) return;
    setSelected(currentKey ? currentKey.split(",") : []);
    let cancelled = false;
    (async () => {
      try {
        const list = await loadRegionUsers(region);
        if (!cancelled) setUsers(list);
      } catch {
        if (!cancelled) setError(t("actions.failed"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, region, currentKey, t]);

  const save = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await updateRecordShares(region, recordID, selected);
      onSaved(result?.sharedWith ?? Object.fromEntries(selected.map((id) => [id, true])));
      onClose();
    } catch {
      setError(t("actions.failed"));
    } finally {
      setBusy(false);
    }
  };

  const query = filter.trim().toLowerCase();
  const visibleUsers = users.filter(
    (user) =>
      user.userID !== excludeUserID &&
      (!query ||
      user.email.toLowerCase().includes(query) ||
        (user.displayName ?? "").toLowerCase().includes(query)),
  );

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
            {t("actions.share")}
          </Text>
          <Text style={[theme.type.bodySmall, { color: theme.colors.textMuted }]}>
            {t("actions.shareHelp")}
          </Text>

          <TextInput
            value={filter}
            onChangeText={setFilter}
            placeholder={t("actions.searchPeople")}
            autoCapitalize="none"
            accessibilityLabel={t("actions.searchPeople")}
          />

          <ScrollView style={{ maxHeight: 280 }}>
            <View style={{ gap: theme.space.sm }}>
              {visibleUsers.map((user) => {
                const active = selected.includes(user.userID);
                return (
                  <Pressable
                    key={user.userID}
                    onPress={() =>
                      setSelected(
                        active
                          ? selected.filter((id) => id !== user.userID)
                          : [...selected, user.userID],
                      )
                    }
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={user.email}
                    style={[styles.user, { gap: theme.space.sm }]}
                  >
                    <Ionicons
                      name={active ? "checkbox" : "square-outline"}
                      size={22}
                      color={active ? theme.colors.accent : theme.colors.textMuted}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[theme.type.body, { color: theme.colors.text }]}>
                        {user.displayName || user.email}
                      </Text>
                      {user.displayName ? (
                        <Text style={[theme.type.dataSmall, { color: theme.colors.textMuted }]}>
                          {user.email}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {error ? (
            <Text style={[theme.type.bodySmall, { color: theme.semantic.error }]}>{error}</Text>
          ) : null}

          <Button label={t("library.save")} onPress={save} busy={busy} />
          <Button label={t("actions.cancel")} variant="quiet" onPress={onClose} disabled={busy} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { width: "100%" },
  user: { flexDirection: "row", alignItems: "center", minHeight: MIN_TOUCH_TARGET },
});
