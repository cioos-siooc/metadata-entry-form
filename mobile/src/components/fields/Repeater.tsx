import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

/**
 * A list of repeated sub-records: contacts, platforms, instruments, resources.
 *
 * List-then-detail via expand-in-place, rather than the web app's two-pane
 * master/detail — which stacks on a phone and pushes the editor entirely below
 * the fold with no way back to the list.
 *
 * Reordering offers explicit Move up / Move down as well as any drag. Drag is
 * the *only* mechanism in the web app, in a row that already holds three other
 * icon buttons, which is unusable with gloves on.
 */
export function Repeater<T>({
  items,
  onChange,
  renderTitle,
  renderEditor,
  makeEmpty,
  addLabel,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  renderTitle: (item: T, index: number) => string;
  renderEditor: (item: T, update: (next: T) => void) => React.ReactNode;
  makeEmpty: () => T;
  addLabel: string;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState<number | null>(items.length === 0 ? null : 0);

  const replace = (index: number, next: T) =>
    onChange(items.map((item, i) => (i === index ? next : item)));

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    setOpen(null);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    setOpen(target);
  };

  return (
    <View style={{ gap: theme.space.sm }}>
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <View
            key={index}
            style={[
              styles.item,
              {
                borderColor: expanded ? theme.colors.accent : theme.colors.border,
                backgroundColor: theme.colors.surfaceRaised,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <Pressable
              onPress={() => setOpen(expanded ? null : index)}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={renderTitle(item, index) || `${index + 1}`}
              style={[styles.header, { padding: theme.space.md, gap: theme.space.sm }]}
            >
              <Text style={[theme.type.data, { color: theme.colors.textMuted }]}>
                {index + 1}
              </Text>
              <Text style={[theme.type.body, { color: theme.colors.text, flex: 1 }]} numberOfLines={1}>
                {renderTitle(item, index) || t("records.untitled")}
              </Text>
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={theme.colors.textMuted}
              />
            </Pressable>

            {expanded ? (
              <View style={{ paddingHorizontal: theme.space.md, paddingBottom: theme.space.md }}>
                {renderEditor(item, (next) => replace(index, next))}

                <View style={[styles.controls, { gap: theme.space.sm }]}>
                  <Pressable
                    onPress={() => move(index, -1)}
                    disabled={index === 0}
                    accessibilityRole="button"
                    accessibilityLabel={t("repeater.moveUp")}
                    style={[styles.control, { opacity: index === 0 ? 0.3 : 1 }]}
                  >
                    <Ionicons name="arrow-up" size={20} color={theme.colors.accent} />
                  </Pressable>
                  <Pressable
                    onPress={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    accessibilityRole="button"
                    accessibilityLabel={t("repeater.moveDown")}
                    style={[styles.control, { opacity: index === items.length - 1 ? 0.3 : 1 }]}
                  >
                    <Ionicons name="arrow-down" size={20} color={theme.colors.accent} />
                  </Pressable>
                  <View style={{ flex: 1 }} />
                  <Pressable
                    onPress={() => remove(index)}
                    accessibilityRole="button"
                    accessibilityLabel={t("repeater.remove")}
                    style={styles.control}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.semantic.error} />
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}

      <Pressable
        onPress={() => {
          onChange([...items, makeEmpty()]);
          setOpen(items.length);
        }}
        accessibilityRole="button"
        accessibilityLabel={addLabel}
        style={({ pressed }) => [
          styles.add,
          {
            borderColor: theme.colors.accent,
            borderRadius: theme.radius.md,
            gap: theme.space.sm,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons name="add" size={20} color={theme.colors.accent} />
        <Text style={[theme.type.body, { color: theme.colors.accent }]}>{addLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { borderWidth: 1, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", minHeight: MIN_TOUCH_TARGET },
  controls: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  control: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
  add: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
