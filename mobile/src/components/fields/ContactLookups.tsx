import { extractOrcid, orcidToContact, rorName, rorToContact } from "@cioos/shared/lookups.js";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { fetchOrcid, searchRor, type RorOrganization } from "@/api/lookups";
import { useSession } from "@/auth/SessionProvider";
import { TextInput } from "@/components/fields/TextInput";
import type { Language } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

/**
 * ROR and ORCID lookups for a contact.
 *
 * Accelerators, never gates: both collapse to nothing offline and the fields
 * below them stay typeable. What they write is ordinary contact data, so a
 * looked-up organisation can be corrected by hand afterwards.
 */

const DEBOUNCE_MS = 500;
const MIN_QUERY = 3;

export function RorLookup({
  onPick,
}: {
  onPick: (fields: ReturnType<typeof rorToContact>) => void;
}) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { isOffline } = useSession();
  const language = i18n.language as Language;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RorOrganization[]>([]);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    // A pasted ROR URL is an answer, not a search: fetching "https://ror.org/…"
    // as a query string returns nothing useful.
    if (trimmed.length < MIN_QUERY || /^https?:\/\//i.test(trimmed)) {
      setResults([]);
      return;
    }

    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      setFailed(false);
      try {
        const found = await searchRor(trimmed);
        if (id !== requestId.current) return;
        setResults(found.slice(0, 8));
      } catch {
        if (id !== requestId.current) return;
        setResults([]);
        setFailed(true);
      } finally {
        if (id === requestId.current) setSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const choose = (organization: RorOrganization) => {
    onPick(rorToContact(organization, language));
    setQuery("");
    setResults([]);
  };

  return (
    <View style={{ gap: theme.space.sm }}>
      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
        {t("who.rorSearch")}
      </Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t("who.rorPlaceholder")}
        autoCapitalize="words"
        autoCorrect={false}
        editable={!isOffline}
        accessibilityLabel={t("who.rorSearch")}
      />

      {isOffline ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          {t("who.lookupOffline")}
        </Text>
      ) : null}

      {searching ? (
        <View style={[styles.row, { gap: theme.space.sm }]}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
          <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
            {t("who.searching")}
          </Text>
        </View>
      ) : null}

      {failed ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          {t("who.lookupFailed")}
        </Text>
      ) : null}

      {results.map((organization) => (
        <Pressable
          key={organization.id}
          onPress={() => choose(organization)}
          accessibilityRole="button"
          accessibilityLabel={rorName(organization, language)}
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
              {rorName(organization, language)}
            </Text>
            <Text style={[theme.type.dataSmall, { color: theme.colors.textMuted }]}>
              {organization.id}
            </Text>
          </View>
          <Ionicons name="add" size={18} color={theme.colors.accent} />
        </Pressable>
      ))}
    </View>
  );
}

export function OrcidLookup({
  onFound,
}: {
  onFound: (fields: ReturnType<typeof orcidToContact>) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isOffline } = useSession();

  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // Fires as soon as a complete identifier appears, which is what pasting one
  // produces — no button to find, no second step.
  const onChange = async (next: string) => {
    setValue(next);
    setProblem(null);

    const orcid = extractOrcid(next);
    if (!orcid || busy || isOffline) return;

    setBusy(true);
    try {
      const fields = orcidToContact(await fetchOrcid(orcid));
      onFound(fields);
      setValue("");
      if (!fields.givenNames && !fields.lastName) setProblem(t("who.orcidPrivate"));
    } catch {
      setProblem(t("who.lookupFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: theme.space.sm }}>
      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
        {t("who.orcidLookup")}
      </Text>
      <View style={[styles.row, { gap: theme.space.sm }]}>
        <View style={{ flex: 1 }}>
          <TextInput
            mono
            value={value}
            onChangeText={onChange}
            placeholder="0000-0002-1825-0097"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isOffline}
            accessibilityLabel={t("who.orcidLookup")}
          />
        </View>
        {busy ? <ActivityIndicator size="small" color={theme.colors.accent} /> : null}
      </View>

      {isOffline ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          {t("who.lookupOffline")}
        </Text>
      ) : null}

      {problem ? (
        <Text
          style={[theme.type.caption, { color: theme.semantic.incomplete }]}
          accessibilityLiveRegion="polite"
        >
          {problem}
        </Text>
      ) : null}
    </View>
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
