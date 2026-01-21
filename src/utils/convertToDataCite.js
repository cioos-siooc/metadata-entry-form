import { getFunctions, httpsCallable } from "firebase/functions";
import regions from "../regions";

/**
 * Retrieve DataCite JSON schema for a record via the backend convert_metadata function.
 * Ensures required DataCite fields are present and injects the prefix when provided.
 *
 * @param {object} record - Firebase record object
 * @param {string} datacitePrefix - DataCite prefix to include when creating a draft DOI
 * @returns {Promise<object>} DataCite payload object suitable for DataCite API
 */
/**
 * Generate a random DOI suffix in the form XXXX-XXXX using
 * the allowed character set: a-z (excluding i, l, o) and digits 0-9.
 * Output is lowercase.
 */
export function generateRandomDoiSuffix() {
    const allowed = "abcdefghjkmnpqrstuvwxyz0123456789"; // exclude i, l, o
    const pick = () => allowed[Math.floor(Math.random() * allowed.length)];
    let s = "";
    for (let i = 0; i < 8; i += 1) s += pick();
    return `${s.slice(0, 4)}-${s.slice(4, 8)}`;
}

export default async function convertToDataCite(record, options = {}) {
    const { datacitePrefix, region, language, doi, generateIfMissing = true } = options;
    const functions = getFunctions();
    const convertMetadata = httpsCallable(functions, "convert_metadata");

    const resp = await convertMetadata({ record_data: record, output_format: "datacite_json" });
    const converted = resp?.data;

    // The python function returns either text or object depending on format.
    // For datacite_json we expect an object structure. If it's a string, try JSON parse.
    let payload = converted;
    if (typeof payload === "string") {
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            throw new Error(`Failed to parse DataCite JSON from convert_metadata: ${e}`);
        }
    }

    // Normalize to expected DataCite API shape and inject prefix if missing.
    // Expected shape: { data: { type: "dois", attributes: { ... } } }
    if (!payload || typeof payload !== "object") {
        throw new Error("convert_metadata returned empty or invalid DataCite payload");
    }

    if (!payload.data) payload.data = {};
    if (!payload.data.attributes) payload.data.attributes = {};
    if (!payload.data.type) payload.data.type = "dois";

    if (datacitePrefix) payload.data.attributes.prefix = datacitePrefix;

    // Compute and inject the public landing page URL for this record
    try {
        if (region && language && regions?.[region]?.catalogueURL?.[language]) {
            payload.data.attributes.url = `${regions[region].catalogueURL[language]}dataset/ca-cioos_${record.identifier}`;
        }
    } catch (e) {
        // Swallow URL computation issues; DataCite can still accept draft without URL (though recommended)
    }

    // If a full DOI is provided, set it explicitly (DataCite allows specifying DOI for drafts)
    if (doi) {
        payload.data.attributes.doi = doi;
    } else if (generateIfMissing && datacitePrefix) {
        // Generate a random DOI suffix: XXXX-XXXX using allowed characters
        const suffix = generateRandomDoiSuffix();
        payload.data.attributes.doi = `${datacitePrefix}/${suffix}`;
    }

    return payload;
}
