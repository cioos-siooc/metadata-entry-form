import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

import { formatRecordDate, fromRecordDate, toRecordDate } from "./dateValue";

/**
 * A single date.
 *
 * There is no date-range component: the web app cross-wires two separate
 * pickers via minDate/maxDate, and this keeps that shape so the two clients
 * behave identically.
 */
export function DateInput({
  value,
  onChange,
  minimum,
  maximum,
  label,
}: {
  value: unknown;
  onChange: (next: string | null) => void;
  minimum?: unknown;
  maximum?: unknown;
  label: string;
}) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = fromRecordDate(value);
  const shown = formatRecordDate(value, i18n.language);

  return (
    <View style={{ gap: theme.space.sm }}>
      <View style={styles.row}>
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityValue={{ text: shown ?? t("common.loading") }}
          style={({ pressed }) => [
            styles.control,
            {
              backgroundColor: theme.colors.surfaceRaised,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              paddingHorizontal: theme.space.md,
              gap: theme.space.sm,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="calendar-outline" size={18} color={theme.colors.textMuted} />
          {/* Mono so a column of dates aligns. */}
          <Text
            style={[
              theme.type.data,
              { color: shown ? theme.colors.text : theme.colors.textMuted, flex: 1 },
            ]}
          >
            {shown ?? "—"}
          </Text>
        </Pressable>

        {shown ? (
          <Pressable
            onPress={() => onChange(null)}
            accessibilityRole="button"
            accessibilityLabel={t("common.cancel")}
            style={styles.clear}
          >
            <Ionicons name="close-circle" size={22} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {open ? (
        <DateTimePicker
          value={current ?? new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          minimumDate={fromRecordDate(minimum) ?? undefined}
          maximumDate={fromRecordDate(maximum) ?? undefined}
          onChange={(event, picked) => {
            // Android fires once and dismisses itself; iOS inline stays open.
            if (Platform.OS !== "ios") setOpen(false);
            if (event.type === "dismissed" || !picked) return;
            onChange(toRecordDate(picked));
          }}
        />
      ) : null}

      {open && Platform.OS === "ios" ? (
        <Pressable
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: "center" }}
        >
          <Text style={[theme.type.body, { color: theme.colors.accent }]}>
            {t("common.close")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  control: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  clear: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
});
