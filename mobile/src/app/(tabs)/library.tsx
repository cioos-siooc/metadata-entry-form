import { getBlankContact, getBlankInstrument, getBlankPlatform } from "@cioos/shared/blankRecord.js";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NetworkError } from "@/api/errors";
import {
  createEntity,
  deleteEntity,
  listEntities,
  updateEntity,
  type EntityKind,
  type SavedEntity,
} from "@/api/entities";
import { useSession } from "@/auth/SessionProvider";
import { ActionBar } from "@/components/ActionBar";
import { Button } from "@/components/Button";
import { BilingualTextInput } from "@/components/fields/BilingualTextInput";
import { TextInput } from "@/components/fields/TextInput";
import { contentColumn } from "@/theme/layout";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

const KINDS: EntityKind[] = ["contacts", "platforms", "instruments"];

/** Which fields each kind shows, and how a row is titled. */
const SHAPE: Record<
  EntityKind,
  { fields: [string, string][]; bilingual: string[]; blank: () => Record<string, unknown>; title: (d: Record<string, unknown>) => string }
> = {
  contacts: {
    fields: [
      ["orgName", "who.orgName"],
      ["orgEmail", "who.orgEmail"],
      ["givenNames", "who.givenNames"],
      ["lastName", "who.lastName"],
      ["indEmail", "who.indEmail"],
    ],
    bilingual: [],
    blank: () => getBlankContact() as Record<string, unknown>,
    title: (d) =>
      [d.givenNames, d.lastName].filter(Boolean).join(" ") || (d.orgName as string) || "",
  },
  platforms: {
    fields: [
      ["id", "platformSection.id"],
      ["type", "platformSection.type"],
    ],
    bilingual: ["description"],
    blank: () => getBlankPlatform() as Record<string, unknown>,
    title: (d) => (d.id as string) || (d.type as string) || "",
  },
  instruments: {
    fields: [
      ["id", "platformSection.id"],
      ["manufacturer", "platformSection.manufacturer"],
      ["version", "platformSection.version"],
    ],
    bilingual: ["description"],
    blank: () => getBlankInstrument() as Record<string, unknown>,
    title: (d) => (d.id as string) || (d.manufacturer as string) || "",
  },
};

/**
 * The reusable library.
 *
 * List-then-expand rather than the web app's two-pane master/detail, which on a
 * phone stacks and pushes the editor below the fold with no way back to the list.
 */
export default function LibraryScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { region, user } = useSession();

  const [kind, setKind] = useState<EntityKind>("contacts");
  const [items, setItems] = useState<SavedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<"offline" | "error" | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, unknown>>>({});

  const shape = SHAPE[kind];

  const load = useCallback(async () => {
    if (!region || !user) return;
    setProblem(null);
    try {
      setItems(await listEntities(region, user.userID, kind));
    } catch (err) {
      setProblem(err instanceof NetworkError ? "offline" : "error");
    } finally {
      setLoading(false);
    }
  }, [region, user, kind]);

  useEffect(() => {
    setLoading(true);
    setOpen(null);
    void load();
  }, [load]);

  const draftFor = (item: SavedEntity) => drafts[item.id] ?? item.data;

  const setDraft = (id: string, data: Record<string, unknown>) =>
    setDrafts((current) => ({ ...current, [id]: data }));

  const save = async (item: SavedEntity) => {
    if (!region || !user) return;
    await updateEntity(region, user.userID, kind, item.id, draftFor(item));
    setDrafts((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    setOpen(null);
    await load();
  };

  const remove = async (item: SavedEntity) => {
    if (!region || !user) return;
    await deleteEntity(region, user.userID, kind, item.id);
    setOpen(null);
    await load();
  };

  const add = async () => {
    if (!region || !user) return;
    const created = await createEntity(region, user.userID, kind, shape.blank());
    await load();
    setOpen(created?.id ?? null);
  };

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.surface }]}>
      <View style={{ paddingTop: insets.top + theme.space.lg, paddingHorizontal: theme.space.lg }}>
        <Text style={[theme.type.display, { color: theme.colors.text }]}>
          {t("library.title")}
        </Text>
        <Text
          style={[theme.type.bodySmall, { color: theme.colors.textMuted, marginTop: 4 }]}
        >
          {t(`library.${kind}Help`)}
        </Text>

        <View style={[styles.tabs, { gap: theme.space.sm, marginTop: theme.space.md }]}>
          {KINDS.map((option) => {
            const active = option === kind;
            return (
              <Pressable
                key={option}
                onPress={() => setKind(option)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.tab,
                  {
                    borderColor: active ? theme.colors.accent : theme.colors.border,
                    backgroundColor: active ? theme.colors.accentFill : "transparent",
                    borderRadius: theme.radius.pill,
                    paddingHorizontal: theme.space.md,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    theme.type.bodySmall,
                    { color: active ? theme.colors.onAccent : theme.colors.text },
                  ]}
                >
                  {t(`library.${option}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[contentColumn, { padding: theme.space.lg, gap: theme.space.sm }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.colors.accent} />
        }
        renderItem={({ item }) => {
          const expanded = open === item.id;
          const data = draftFor(item);
          return (
            <View
              style={[
                styles.card,
                {
                  borderColor: expanded ? theme.colors.accent : theme.colors.border,
                  backgroundColor: theme.colors.surfaceRaised,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <Pressable
                onPress={() => setOpen(expanded ? null : item.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                style={[styles.header, { padding: theme.space.md, gap: theme.space.sm }]}
              >
                <Text
                  style={[theme.type.body, { color: theme.colors.text, flex: 1 }]}
                  numberOfLines={1}
                >
                  {shape.title(data) || t("records.untitled")}
                </Text>
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={theme.colors.textMuted}
                />
              </Pressable>

              {expanded ? (
                <View
                  style={{
                    paddingHorizontal: theme.space.md,
                    paddingBottom: theme.space.md,
                    gap: theme.space.md,
                  }}
                >
                  {shape.fields.map(([field, labelKey]) => (
                    <View key={field} style={{ gap: 4 }}>
                      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                        {t(labelKey)}
                      </Text>
                      <TextInput
                        value={(data[field] as string) ?? ""}
                        onChangeText={(next) => setDraft(item.id, { ...data, [field]: next })}
                        autoCapitalize={field.toLowerCase().includes("email") ? "none" : "sentences"}
                        keyboardType={
                          field.toLowerCase().includes("email") ? "email-address" : "default"
                        }
                        accessibilityLabel={t(labelKey)}
                      />
                    </View>
                  ))}

                  {shape.bilingual.map((field) => (
                    <View key={field} style={{ gap: 4 }}>
                      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                        {t("platformSection.description")}
                      </Text>
                      <BilingualTextInput
                        multiline
                        value={data[field] as { en: string; fr: string }}
                        onChange={(next) => setDraft(item.id, { ...data, [field]: next })}
                      />
                    </View>
                  ))}

                  <View style={[styles.actions, { gap: theme.space.sm }]}>
                    <View style={{ flex: 1 }}>
                      <Button label={t("library.save")} onPress={() => save(item)} />
                    </View>
                    <Pressable
                      onPress={() => remove(item)}
                      accessibilityRole="button"
                      accessibilityLabel={t("repeater.remove")}
                      style={styles.delete}
                    >
                      <Ionicons name="trash-outline" size={20} color={theme.semantic.error} />
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? null : (
            <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
              {problem === "offline"
                ? t("records.loadFailedOffline")
                : problem === "error"
                  ? t("library.loadFailed")
                  : t("library.empty")}
            </Text>
          )
        }
      />

      <ActionBar>
        <View style={{ flex: 1 }}>
          <Button label={t(`library.addOne.${kind}`)} onPress={add} />
        </View>
      </ActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  tabs: { flexDirection: "row" },
  tab: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: { borderWidth: 1, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", minHeight: MIN_TOUCH_TARGET },
  actions: { flexDirection: "row", alignItems: "center" },
  delete: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
});
