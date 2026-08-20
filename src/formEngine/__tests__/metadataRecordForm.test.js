import { describe, expect, it } from "vitest";

import { buildMetadataRecordForm } from "../metadataRecordForm";
import { buildSubmissionSchema } from "../../schema";
import { resolveSteps } from "@shared/formEngine";
import tabs from "../../utils/tabs";

const build = (options) => buildMetadataRecordForm(options);

describe("buildMetadataRecordForm", () => {
  it("puts every tabbed property on exactly one step, in tabs.js order", () => {
    const { jsonSchema, uiSchema } = build();
    const steps = uiSchema["ui:steps"];

    expect(steps.map((s) => s.id)).toEqual(
      Object.keys(tabs).filter((tab) => steps.some((s) => s.id === tab))
    );

    const claimed = steps.flatMap((s) => s.fields);
    expect(new Set(claimed).size).toBe(claimed.length);
    expect(claimed.sort()).toEqual(Object.keys(jsonSchema.properties).sort());
  });

  it("produces no __other step", () => {
    // resolveSteps appends a catch-all for properties no step claims. Its
    // presence means a field would render on an "Other" tab with no label —
    // which is exactly the silent failure this generator exists to prevent.
    const { jsonSchema, uiSchema } = build();
    const ids = resolveSteps(jsonSchema, uiSchema).map((s) => s.id);
    expect(ids).not.toContain("__other");
  });

  it("renders no untabbed system property", () => {
    const { jsonSchema } = build();
    const full = buildSubmissionSchema();

    const untabbed = Object.entries(full.properties)
      .filter(([, node]) => !node["x-cioos-tab"])
      .map(([name]) => name);

    expect(untabbed.length).toBeGreaterThan(0);
    untabbed.forEach((name) => {
      expect(jsonSchema.properties).not.toHaveProperty(name);
    });
  });

  it("renders no derived property", () => {
    const { jsonSchema } = build();
    expect(jsonSchema.properties).not.toHaveProperty("metadataScopeIso");
    expect(jsonSchema.properties).not.toHaveProperty("doiCreationStatus");
  });

  it("drops the root title so the form is not wrapped in a titled Paper", () => {
    const { jsonSchema } = build();
    expect(jsonSchema.title).toBeUndefined();
    expect(jsonSchema.description).toBeUndefined();
  });

  it("keeps definitions so $refs still resolve", () => {
    const { jsonSchema } = build();
    expect(jsonSchema.definitions.bilingualText).toBeDefined();
    expect(jsonSchema.definitions.contact).toBeDefined();
  });

  it("gives every rendered property a label", () => {
    const { jsonSchema, uiSchema } = build();
    Object.keys(jsonSchema.properties).forEach((name) => {
      expect(uiSchema[name]?.["ui:title"], `${name} has no label`).toBeTruthy();
    });
  });

  it("marks required fields, and leaves the optional one unmarked", () => {
    const { uiSchema } = build();
    expect(uiSchema.title["ui:options"].requiredField).toBe("title");
    expect(uiSchema.contacts["ui:options"].requiredField).toBe("contacts");
    // Mirrors `optional: true` in src/utils/validate.js.
    expect(uiSchema.datasetIdentifier["ui:options"].requiredField).toBeUndefined();
    // No x-cioos-error at all.
    expect(uiSchema.edition["ui:options"]?.requiredField).toBeUndefined();
  });

  it("claims the anyOf on datasetIdentifier so the DOI field survives", () => {
    // Without this rjsf replaces the field with an "Option 1 / Option 2" picker.
    const { uiSchema } = build();
    expect(uiSchema.datasetIdentifier["ui:field"]).toBe("doi");
    expect(uiSchema.datasetIdentifier["ui:fieldReplacesAnyOrOneOf"]).toBe(true);
  });

  it("derives bilingual editors from $ref, at any depth", () => {
    const { uiSchema } = build();
    expect(uiSchema.title["ui:field"]).toBe("bilingualText");
    // Nested inside an array item — nobody hand-listed these.
    expect(uiSchema.instruments.items.description["ui:field"]).toBe("bilingualText");
    expect(uiSchema.platforms.items.description["ui:field"]).toBe("bilingualText");
    expect(uiSchema.history.items.statement["ui:field"]).toBe("bilingualText");
    expect(uiSchema.distribution.items.description["ui:field"]).toBe("bilingualText");
    expect(uiSchema.associated_resources.items.title["ui:field"]).toBe("bilingualText");
  });

  it("derives ISO datetime widgets from $ref", () => {
    const { uiSchema } = build();
    ["dateStart", "dateEnd", "datePublished", "dateRevised"].forEach((name) => {
      expect(uiSchema[name]["ui:widget"]).toBe("isoDateTime");
    });
  });

  it("renders enum arrays as checkbox lists", () => {
    const { uiSchema } = build();
    expect(uiSchema.contacts.items.role["ui:widget"]).toBe("checkboxList");
  });

  it("does not leave a derived widget on a field the override owns", () => {
    const { uiSchema } = build();
    ["resourceType", "eov"].forEach((name) => {
      expect(uiSchema[name]["ui:field"]).toBeTruthy();
      expect(uiSchema[name]["ui:widget"]).toBeUndefined();
    });
  });

  it("only claims ownChrome for fields that really draw their own", () => {
    const { uiSchema, jsonSchema } = build();
    const ownChrome = Object.keys(jsonSchema.properties).filter(
      (name) => uiSchema[name]?.["ui:options"]?.ownChrome
    );
    // Native arrays must NOT be here — they need the template's Paper,
    // question and required marker.
    // Every entry here draws its own Paper + RequiredMark (MapSelect, DOIInput,
    // SharedUsersList, TaxaBody); a second wrapper nests the boxes.
    expect(ownChrome.sort()).toEqual([
      "datasetIdentifier",
      "map",
      "sharedWith",
      "taxa",
    ]);
  });

  it("hides internal identifiers inside array items", () => {
    const { uiSchema } = build();
    expect(uiSchema.contacts.items.contactID["ui:widget"]).toBe("hidden");
    expect(uiSchema.instruments.items.instrumentID["ui:widget"]).toBe("hidden");
    expect(uiSchema.history.items.scopeIso["ui:widget"]).toBe("hidden");
    expect(uiSchema.associated_resources.items.association_type_iso["ui:widget"]).toBe(
      "hidden"
    );
  });

  it("injects the region's project list, and copes with no projects", () => {
    const withProjects = build({ projects: ["Argo", "BGC"] });
    expect(withProjects.jsonSchema.properties.projects.items.enum).toEqual([
      "Argo",
      "BGC",
    ]);
    expect(withProjects.uiSchema.projects["ui:widget"]).toBe("checkboxList");

    const none = build();
    expect(none.jsonSchema.properties.projects.items.enum).toBeUndefined();
  });

  it("does not mutate the shared schema when injecting projects", () => {
    build({ projects: ["Argo"] });
    expect(buildSubmissionSchema().properties.projects.items.enum).toBeUndefined();
  });

  it("hides the platform steps for a model", () => {
    const { uiSchema } = build();
    const platform = uiSchema["ui:steps"].find((s) => s.id === "platform");
    expect(platform.visibleIf).toEqual({
      field: "metadataScopeIso",
      notIn: ["model"],
    });
  });

  it("labels in French when asked", () => {
    const { uiSchema } = build({ language: "fr" });
    expect(uiSchema.title["ui:title"]).toBe("Titre");
    expect(uiSchema["ui:steps"].find((s) => s.id === "start").title.fr).toBe(
      "Accueil"
    );
  });

  it("interpolates region placeholders into help text", () => {
    const withPlaceholder = interpolateProbe();
    expect(withPlaceholder).not.toContain("{regionTitle}");
  });
});

/**
 * The schema's help text may use {regionTitle}/{catalogueUrl}. Prove the
 * substitution runs over whatever help is present rather than asserting on one
 * property's wording, which would break every time the copy is edited.
 */
function interpolateProbe() {
  const { uiSchema } = buildMetadataRecordForm({
    regionInfo: { title: { en: "CIOOS Pacific" }, catalogueURL: { en: "https://x" } },
  });
  return Object.values(uiSchema)
    .map((ui) => ui?.["ui:options"]?.help)
    .filter(Boolean)
    .join(" ");
}
