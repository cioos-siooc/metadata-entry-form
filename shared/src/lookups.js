/**
 * ROR and ORCID payloads, mapped onto contact fields.
 *
 * Pure and shared: these are accelerators, but what they write ends up in a
 * published record, so the phone and the web app must agree on which name and
 * which email a lookup produces. The network calls stay in each client.
 */

/**
 * The organisation's name in the requested language.
 *
 * ROR returns several names per organisation — the display name, translated
 * labels, aliases and acronyms — and picking the first one that matches the
 * language lands on an alias as often as not. ("Fisheries and Oceans Canada"
 * is the display name; "Department of Fisheries and Oceans" is an alias with
 * the same `lang`.) Preference order: a label in the requested language, then
 * the display name, then anything.
 */
export function rorName(payload, language = "en") {
  const names = Array.isArray(payload?.names) ? payload.names : [];
  const typed = (type, lang) =>
    names.find((n) => n?.types?.includes(type) && (lang ? n.lang === lang : true))?.value;

  return (
    typed("ror_display", language) ||
    typed("label", language) ||
    typed("ror_display") ||
    typed("label") ||
    names[0]?.value ||
    ""
  );
}

/** The contact fields a ROR record fills in. Everything else is left alone. */
export function rorToContact(payload, language = "en") {
  const location = Array.isArray(payload?.locations) ? payload.locations[0] : undefined;
  const website = Array.isArray(payload?.links)
    ? payload.links.find((l) => l?.type === "website")?.value
    : undefined;

  return {
    orgRor: payload?.id ?? "",
    orgName: rorName(payload, language),
    orgURL: website ?? "",
    orgCity: location?.geonames_details?.name ?? "",
    orgCountry: location?.geonames_details?.country_name ?? "",
  };
}

/** A bare 0000-0000-0000-0000 identifier out of whatever the user pasted. */
export function extractOrcid(value) {
  const match = String(value ?? "").match(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/i);
  return match ? match[0].toUpperCase() : null;
}

/**
 * The contact fields an ORCID record fills in.
 *
 * Every part is optional on ORCID's side: a researcher can publish a profile
 * with no email, or no family name, and the web app's unguarded
 * `name["given-names"].value` throws on exactly those. Missing parts are left
 * as empty strings so a partial profile still helps.
 */
export function orcidToContact(payload) {
  const person = payload?.person ?? {};
  const name = person.name ?? {};
  const emails = Array.isArray(person.emails?.email) ? person.emails.email : [];

  return {
    indOrcid: payload?.["orcid-identifier"]?.uri ?? "",
    givenNames: name["given-names"]?.value ?? "",
    lastName: name["family-name"]?.value ?? "",
    indEmail: emails[0]?.email ?? "",
  };
}
