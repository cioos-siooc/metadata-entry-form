import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { BilingualTextInput } from "@/components/fields/BilingualTextInput";
import { Field } from "@/components/fields/Field";
import { Repeater } from "@/components/fields/Repeater";
import { TextInput } from "@/components/fields/TextInput";
import { localized } from "@cioos/shared/localized.js";
import type { Language } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

import type { SectionProps } from "./types";

interface Resource {
  url?: string;
  name?: { en: string; fr: string };
  description?: { en: string; fr: string };
  [key: string]: unknown;
}

/**
 * Resources — where the data can actually be downloaded.
 *
 * At least one entry with a name and a valid URL is required. The web app also
 * live-checks each URL against /api/url-check; that is deliberately omitted here
 * because it is a network call per keystroke and cannot work offline. It belongs
 * with the non-blocking warnings, not in the editor.
 */
export function ResourcesSection({ document, update, ledger }: SectionProps) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;

  const distribution = (document.distribution as Resource[]) ?? [];

  return (
    <Field
      label={t("resourcesSection.distribution")}
      help={t("resourcesSection.help")}
      required
      error={ledger?.errors.length ? localized(ledger.errors[0], language) : null}
    >
      <Repeater<Resource>
        items={distribution}
        onChange={(next) => update("distribution", next)}
        makeEmpty={() => ({ url: "", name: { en: "", fr: "" }, description: { en: "", fr: "" } })}
        addLabel={t("repeater.addResource")}
        renderTitle={(resource) =>
          (resource.name && localized(resource.name, language)) || resource.url || ""
        }
        renderEditor={(resource, set) => (
          <View style={{ gap: theme.space.md }}>
            <View style={{ gap: 4 }}>
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {t("resourcesSection.url")}
              </Text>
              <TextInput
                mono
                autoCapitalize="none"
                keyboardType="url"
                value={resource.url ?? ""}
                onChangeText={(next) => set({ ...resource, url: next })}
                accessibilityLabel={t("resourcesSection.url")}
              />
            </View>

            <View style={{ gap: 4 }}>
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {t("resourcesSection.name")}
              </Text>
              <BilingualTextInput
                value={resource.name}
                onChange={(next) => set({ ...resource, name: next })}
              />
            </View>

            <View style={{ gap: 4 }}>
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {t("resourcesSection.description")}
              </Text>
              <BilingualTextInput
                multiline
                value={resource.description}
                onChange={(next) => set({ ...resource, description: next })}
              />
            </View>
          </View>
        )}
      />
    </Field>
  );
}
