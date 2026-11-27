import { localized } from "@cioos/shared/localized.js";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { LedgerSummary, SectionRow } from "@/components/CompletenessLedger";
import type { Language } from "@/i18n";
import { buildLedger } from "@/records/ledger";
import { useTheme } from "@/theme/ThemeProvider";

import type { SectionProps } from "./types";

/**
 * Review and submit.
 *
 * Read-only: the full ledger plus every outstanding error, grouped by section,
 * so the reason a record cannot be submitted is stated rather than implied by a
 * disabled button.
 */
export function ReviewSection({ document }: SectionProps) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;

  const ledger = buildLedger(document as Record<string, unknown>);
  const outstanding = ledger.sections.filter((section) => section.errors.length > 0);

  return (
    <View style={{ gap: theme.space.lg }}>
      <LedgerSummary ledger={ledger} />

      <Text
        style={[
          theme.type.body,
          { color: ledger.submittable ? theme.semantic.complete : theme.colors.textMuted },
        ]}
      >
        {ledger.submittable ? t("review.ready") : t("review.notReady")}
      </Text>

      {outstanding.map((section) => (
        <View key={section.id} style={{ gap: theme.space.sm }}>
          <SectionRow section={section} />
          {section.errors.map((error, index) => (
            <Text
              key={index}
              style={[
                theme.type.bodySmall,
                { color: theme.semantic.incomplete, paddingLeft: theme.space.md },
              ]}
            >
              · {localized(error, language)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}
