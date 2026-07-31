import { inferIdentifierAuthority } from "@cioos/shared/identifiers.js";
import { identifierType } from "@cioos/shared/isoCodeLists.js";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { ChoiceInput } from "@/components/fields/ChoiceInput";
import { TextInput } from "@/components/fields/TextInput";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * An identifier and the authority that issued it.
 *
 * The pair appears in related works, lineage sources, processing steps and
 * supporting documents — four places with the same problem: people paste a DOI
 * or a URL and have no idea what "authority" means. Pasting one fills the other,
 * and the choice stays editable because the inference only covers two of the
 * twenty types.
 */
export function IdentifierInput({
  code,
  authority,
  onChange,
}: {
  code: string;
  authority: string;
  onChange: (next: { code: string; authority: string }) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  const setCode = (next: string) => {
    const inferred = inferIdentifierAuthority(next);
    // Only ever fills a blank or a previously inferred value: a hand-picked
    // authority must survive an edit to the code.
    const keep = authority && authority !== "DOI" && authority !== "URL";
    onChange({ code: next, authority: keep ? authority : inferred });
  };

  return (
    <View style={{ gap: theme.space.md }}>
      <View style={{ gap: 4 }}>
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          {t("related.code")}
        </Text>
        <TextInput
          mono
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://doi.org/10.0000/example"
          accessibilityLabel={t("related.code")}
        />
      </View>

      <View style={{ gap: 4 }}>
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          {t("related.authority")}
        </Text>
        <ChoiceInput
          choices={(identifierType as string[]).map((value) => ({ value, label: value }))}
          selected={authority ? [authority] : []}
          onChange={(next) => onChange({ code, authority: next[0] ?? "" })}
        />
      </View>
    </View>
  );
}
