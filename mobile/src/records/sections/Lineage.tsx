import { metadataScopeCodes } from "@cioos/shared/isoCodeLists.js";
import { localized } from "@cioos/shared/localized.js";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { BilingualTextInput, type BilingualValue } from "@/components/fields/BilingualTextInput";
import { ChoiceInput, type Choice } from "@/components/fields/ChoiceInput";
import { Field } from "@/components/fields/Field";
import { IdentifierInput } from "@/components/fields/IdentifierInput";
import { Repeater } from "@/components/fields/Repeater";
import type { Language } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

/** A source, a processing step or a supporting document — the same four fields. */
export interface LineageEntry {
  title?: BilingualValue;
  description?: BilingualValue;
  authority?: string;
  code?: string;
  [key: string]: unknown;
}

export interface LineageStep {
  statement?: BilingualValue;
  scope?: string;
  scopeIso?: string;
  source?: LineageEntry[];
  processingStep?: LineageEntry[];
  additionalDocumentation?: LineageEntry[];
  [key: string]: unknown;
}

const emptyEntry = (): LineageEntry => ({
  title: { en: "", fr: "" },
  description: { en: "", fr: "" },
  authority: "",
  code: "",
});

/**
 * One of the three lists inside a lineage step.
 *
 * Indented and rule-marked rather than nested in another card: this is the only
 * place in the app three levels deep, and stacking three card borders makes the
 * innermost field about forty per cent of the screen width.
 */
function EntryList({
  label,
  help,
  addLabel,
  entries,
  onChange,
  withDescription = true,
}: {
  label: string;
  help?: string;
  addLabel: string;
  entries: LineageEntry[];
  onChange: (next: LineageEntry[]) => void;
  /** Supporting documents carry a title and an identifier, but no description. */
  withDescription?: boolean;
}) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;

  return (
    <View style={[styles.nested, { borderLeftColor: theme.colors.border, gap: theme.space.sm }]}>
      <Text style={[theme.type.label, { color: theme.colors.textMuted }]}>{label}</Text>
      {help ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{help}</Text>
      ) : null}

      <Repeater<LineageEntry>
        items={entries}
        onChange={onChange}
        makeEmpty={emptyEntry}
        addLabel={addLabel}
        renderTitle={(entry) =>
          (entry.title && localized(entry.title, language)) || entry.code || ""
        }
        renderEditor={(entry, set) => (
          <View style={{ gap: theme.space.md }}>
            <View style={{ gap: 4 }}>
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {t("lineage.entryTitle")}
              </Text>
              <BilingualTextInput
                value={entry.title}
                onChange={(next) => set({ ...entry, title: next })}
              />
            </View>

            {withDescription ? (
              <View style={{ gap: 4 }}>
                <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                  {t("lineage.entryDescription")}
                </Text>
                <BilingualTextInput
                  multiline
                  value={entry.description}
                  onChange={(next) => set({ ...entry, description: next })}
                />
              </View>
            ) : null}

            <IdentifierInput
              code={entry.code ?? ""}
              authority={entry.authority ?? ""}
              onChange={(next) => set({ ...entry, ...next })}
            />
          </View>
        )}
      />
    </View>
  );
}

/**
 * Lineage — how the data came to be.
 *
 * Optional, but each step's sources and processing steps must carry a title
 * *and* a description once they exist, or the record cannot be submitted. That
 * is the trap in this section: adding an empty processing step silently blocks
 * submission from a screen the user has already left.
 *
 * Scope is limited the way the web app limits it — the record's own scope, plus
 * data collection sampling — and `scopeIso` travels with it because that is what
 * the ISO output carries.
 */
export function LineageField({
  history,
  metadataScope,
  onChange,
}: {
  history: LineageStep[];
  metadataScope: string;
  onChange: (next: LineageStep[]) => void;
}) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;

  const scopeChoices = useMemo<Choice[]>(() => {
    const codes = metadataScopeCodes as Record<
      string,
      { title?: Record<string, string>; text?: Record<string, string>; isoValue?: string }
    >;
    return Object.entries(codes)
      .filter(([key]) => key === "DataCollectionSampling" || key === metadataScope)
      .map(([value, entry]) => ({
        value,
        label: localized(entry.title ?? {}, language) ?? value,
        description: localized(entry.text ?? {}, language),
      }));
  }, [metadataScope, language]);

  const scopeIsoFor = (scope: string) =>
    (metadataScopeCodes as Record<string, { isoValue?: string }>)[scope]?.isoValue ?? "";

  return (
    <Field label={t("lineage.title")} help={t("lineage.help")}>
      <Repeater<LineageStep>
        items={history}
        onChange={onChange}
        makeEmpty={() => ({
          statement: { en: "", fr: "" },
          // The record's own scope is the sensible default, and it is what the
          // web app backfills when a step is missing one.
          scope: metadataScope,
          scopeIso: scopeIsoFor(metadataScope),
          source: [],
          processingStep: [],
          additionalDocumentation: [],
        })}
        addLabel={t("lineage.add")}
        renderTitle={(step) =>
          (step.statement && localized(step.statement, language)) || t("lineage.untitledStep")
        }
        renderEditor={(step, set) => (
          <View style={{ gap: theme.space.md }}>
            <View style={{ gap: 4 }}>
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {t("lineage.statement")}
              </Text>
              <BilingualTextInput
                multiline
                value={step.statement}
                onChange={(next) => set({ ...step, statement: next })}
              />
            </View>

            <View style={{ gap: 4 }}>
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {t("lineage.scope")}
              </Text>
              <ChoiceInput
                choices={scopeChoices}
                selected={step.scope ? [step.scope] : []}
                onChange={(next) => {
                  const scope = next[0] ?? "";
                  set({ ...step, scope, scopeIso: scopeIsoFor(scope) });
                }}
              />
            </View>

            <EntryList
              label={t("lineage.sources")}
              help={t("lineage.sourcesHelp")}
              addLabel={t("lineage.addSource")}
              entries={step.source ?? []}
              onChange={(next) => set({ ...step, source: next })}
            />

            <EntryList
              label={t("lineage.steps")}
              help={t("lineage.stepsHelp")}
              addLabel={t("lineage.addStep")}
              entries={step.processingStep ?? []}
              onChange={(next) => set({ ...step, processingStep: next })}
            />

            <EntryList
              label={t("lineage.documents")}
              help={t("lineage.documentsHelp")}
              addLabel={t("lineage.addDocument")}
              entries={step.additionalDocumentation ?? []}
              onChange={(next) => set({ ...step, additionalDocumentation: next })}
              withDescription={false}
            />
          </View>
        )}
      />
    </Field>
  );
}

const styles = StyleSheet.create({
  nested: { borderLeftWidth: 2, paddingLeft: 12 },
});
