import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { suggestSpecies, taxonLabel, type GbifSuggestion } from "@/api/gbif";
import { ChoiceInput } from "@/components/fields/ChoiceInput";
import { Field } from "@/components/fields/Field";
import { Repeater } from "@/components/fields/Repeater";
import { TextInput } from "@/components/fields/TextInput";
import { useDatabase } from "@/offline/DatabaseProvider";
import { cacheSuggestions, searchCachedSuggestions } from "@/offline/gbifCache";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

import type { SectionProps } from "./types";

type Taxon = GbifSuggestion;

const DEBOUNCE_MS = 500;
const MIN_QUERY = 3;

/**
 * Species.
 *
 * GBIF suggestions are an accelerator over free text, never a gate: the whole
 * suggestion object is stored, exactly as the web app does, but a taxon typed
 * by hand is equally valid. When GBIF is unreachable the search falls back to
 * what this device has already seen, which on a cruise is most of what gets
 * recorded.
 *
 * `noTaxa` is the explicit escape hatch, and the only reason a blank record is
 * not submittable.
 */
export function SpeciesSection({ document, update }: SectionProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const db = useDatabase();

  const noTaxa = Boolean(document.noTaxa);
  const taxa = (document.taxa as Taxon[]) ?? [];

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Taxon[]>([]);
  const [searching, setSearching] = useState(false);
  const [offlineResults, setOfflineResults] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY) {
      setResults([]);
      setOfflineResults(false);
      return;
    }

    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await suggestSpecies(trimmed);
        // A slow earlier request must not overwrite a newer one's results.
        if (id !== requestId.current) return;
        setResults(found);
        setOfflineResults(false);
        if (db) await cacheSuggestions(db, trimmed, found);
      } catch {
        if (id !== requestId.current) return;
        const cached = db ? await searchCachedSuggestions(db, trimmed) : [];
        setResults(cached);
        setOfflineResults(true);
      } finally {
        if (id === requestId.current) setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, db]);

  const add = (taxon: Taxon) => {
    update("taxa", [...taxa, taxon]);
    setQuery("");
    setResults([]);
  };

  return (
    <>
      <Field label={t("sections.species")} help={t("species.help")} required>
        <ChoiceInput
          multiple
          choices={[{ value: "yes", label: t("species.noTaxa") }]}
          selected={noTaxa ? ["yes"] : []}
          onChange={(next) => update("noTaxa", next.length > 0)}
        />
      </Field>

      {!noTaxa ? (
        <>
          <Field label={t("species.search")} help={t("species.searchHelp")}>
            <View style={{ gap: theme.space.sm }}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t("species.scientificName")}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={t("species.search")}
              />

              {searching ? (
                <View style={[styles.row, { gap: theme.space.sm }]}>
                  <ActivityIndicator size="small" color={theme.colors.accent} />
                  <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                    {t("species.searching")}
                  </Text>
                </View>
              ) : null}

              {offlineResults && !searching ? (
                <Text style={[theme.type.caption, { color: theme.semantic.incomplete }]}>
                  {results.length > 0 ? t("species.offlineResults") : t("species.offlineNone")}
                </Text>
              ) : null}

              {results.map((taxon, index) => (
                <Pressable
                  key={`${taxon.key ?? index}`}
                  onPress={() => add(taxon)}
                  accessibilityRole="button"
                  accessibilityLabel={t("species.addTaxon", { name: taxonLabel(taxon) })}
                  style={({ pressed }) => [
                    styles.result,
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
                      {taxonLabel(taxon)}
                    </Text>
                    {taxon.rank || taxon.kingdom ? (
                      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                        {[taxon.rank?.toLowerCase(), taxon.kingdom].filter(Boolean).join(" · ")}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </Field>

          <Field label={t("species.scientificName")}>
            <Repeater<Taxon>
              items={taxa}
              onChange={(next) => update("taxa", next)}
              makeEmpty={() => ({ scientificName: "" })}
              addLabel={t("species.addByHand")}
              renderTitle={(taxon) => taxonLabel(taxon)}
              renderEditor={(taxon, set) => (
                <View style={{ gap: 4 }}>
                  <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                    {t("species.scientificName")}
                  </Text>
                  <TextInput
                    value={taxon.scientificName ?? taxon.canonicalName ?? ""}
                    onChangeText={(next) => set({ ...taxon, scientificName: next })}
                    accessibilityLabel={t("species.scientificName")}
                  />
                  {taxon.rank ? (
                    <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                      {[taxon.rank.toLowerCase(), taxon.kingdom, taxon.phylum, taxon.family]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  ) : null}
                </View>
              )}
            />
          </Field>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  result: {
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: MIN_TOUCH_TARGET,
  },
});
