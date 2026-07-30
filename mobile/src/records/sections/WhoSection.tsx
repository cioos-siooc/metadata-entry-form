import { getBlankContact } from "@cioos/shared/blankRecord.js";
import { roleCodes } from "@cioos/shared/isoCodeLists.js";
import { localized } from "@cioos/shared/localized.js";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { LibraryPicker } from "@/components/LibraryPicker";
import { OrcidLookup, RorLookup } from "@/components/fields/ContactLookups";
import { LibraryAddButton, SaveToLibrary } from "@/components/SaveToLibrary";
import { ChoiceInput, type Choice } from "@/components/fields/ChoiceInput";
import { Field } from "@/components/fields/Field";
import { Repeater } from "@/components/fields/Repeater";
import { TextInput } from "@/components/fields/TextInput";
import type { Language } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";

import type { SectionProps } from "./types";

interface Contact {
  role?: string[];
  orgName?: string;
  orgEmail?: string;
  orgURL?: string;
  givenNames?: string;
  lastName?: string;
  indPosition?: string;
  indEmail?: string;
  indOrcid?: string;
  inCitation?: boolean;
  [key: string]: unknown;
}

/**
 * Who — the contacts repeater.
 *
 * ROR and ORCID are accelerators, not prerequisites: `contactIsFilled` needs
 * only a role plus an organisation or a name, so a contact typed by hand with
 * no signal is exactly as valid as one looked up. Both collapse to nothing
 * offline and everything below them stays typeable.
 *
 * The saved library is the other accelerator — the same handful of people
 * appear on every record a station produces, and re-typing an address on a wet
 * phone is where the errors come from.
 */
export function WhoSection({ document, update, ledger }: SectionProps) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;

  const contacts = (document.contacts as Contact[]) ?? [];
  const [picking, setPicking] = useState(false);

  const roleChoices = useMemo<Choice[]>(
    () =>
      Object.entries(
        roleCodes as Record<string, { title?: Record<string, string>; text?: Record<string, string> }>,
      ).map(([value, entry]) => ({
        value,
        label: localized(entry.title ?? {}, language) ?? value,
        description: localized(entry.text ?? {}, language),
      })),
    [language],
  );

  const title = (contact: Contact) =>
    [contact.givenNames, contact.lastName].filter(Boolean).join(" ") || contact.orgName || "";

  const contactLabel = (data: Record<string, unknown>) =>
    [data.givenNames, data.lastName].filter(Boolean).join(" ") ||
    ((data.orgName as string) ?? "");

  return (
    <Field
      label={t("sections.who")}
      help={t("who.help")}
      required
      error={ledger?.errors.length ? localized(ledger.errors[0], language) : null}
    >
      <Repeater<Contact>
        items={contacts}
        onChange={(next) => update("contacts", next)}
        makeEmpty={() => getBlankContact() as Contact}
        addLabel={t("repeater.addContact")}
        renderTitle={title}
        secondaryAdd={
          <LibraryAddButton label={t("library.addFrom.contacts")} onPress={() => setPicking(true)} />
        }
        renderItemActions={(contact) => (
          <SaveToLibrary kind="contacts" data={contact as Record<string, unknown>} />
        )}
        renderEditor={(contact, set) => (
          <View style={{ gap: theme.space.md }}>
            <RorLookup onPick={(fields) => set({ ...contact, ...fields })} />
            <OrcidLookup onFound={(fields) => set({ ...contact, ...fields })} />

            {(
              [
                ["orgName", "who.orgName"],
                ["orgEmail", "who.orgEmail"],
                ["orgURL", "who.orgUrl"],
                ["orgRor", "who.orgRor"],
                ["orgCity", "who.orgCity"],
                ["orgCountry", "who.orgCountry"],
                ["givenNames", "who.givenNames"],
                ["lastName", "who.lastName"],
                ["indPosition", "who.position"],
                ["indEmail", "who.indEmail"],
                ["indOrcid", "who.orcid"],
              ] as const
            ).map(([field, labelKey]) => (
              <View key={field} style={{ gap: 4 }}>
                <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                  {t(labelKey)}
                </Text>
                <TextInput
                  value={(contact[field] as string) ?? ""}
                  onChangeText={(next) => set({ ...contact, [field]: next })}
                  autoCapitalize={field.toLowerCase().includes("email") ? "none" : "sentences"}
                  keyboardType={field.toLowerCase().includes("email") ? "email-address" : "default"}
                  mono={field === "indOrcid"}
                  accessibilityLabel={t(labelKey)}
                />
              </View>
            ))}

            <View style={{ gap: 4 }}>
              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {t("who.roles")}
              </Text>
              <ChoiceInput
                multiple
                choices={roleChoices}
                selected={contact.role ?? []}
                onChange={(next) => set({ ...contact, role: next })}
              />
            </View>

            <ChoiceInput
              multiple
              choices={[{ value: "yes", label: t("who.inCitation") }]}
              selected={contact.inCitation ? ["yes"] : []}
              onChange={(next) => set({ ...contact, inCitation: next.length > 0 })}
            />
          </View>
        )}
      />

      <LibraryPicker
        visible={picking}
        kind="contacts"
        titleFor={contactLabel}
        subtitleFor={(data) => ((data.indEmail as string) || (data.orgEmail as string)) ?? ""}
        onPick={(data) => update("contacts", [...contacts, data as Contact])}
        onClose={() => setPicking(false)}
      />
    </Field>
  );
}
