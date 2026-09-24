import { describe, it, expect } from "vitest";

import { generateCitation } from "../ApaPreview";
import mockMetadataRecord from "../../../__testData__/mockMetadataRecord";

const recordWithScope = (metadataScope, metadataScopeIso) => ({
  ...mockMetadataRecord,
  metadataScope,
  metadataScopeIso,
});

describe("generateCitation", () => {
  it("keeps APA's [Data set] descriptor for datasets", () => {
    const citation = generateCitation(
      recordWithScope("Dataset", "dataset"),
      "en",
      "text"
    );

    expect(citation).toContain("[Data set]");
  });

  it("shows the selected resource type for non-dataset scopes", () => {
    const citation = generateCitation(
      recordWithScope("Report", "document"),
      "en",
      "text"
    );

    expect(citation).toContain("[Report]");
  });

  it("localizes the resource type", () => {
    const citation = generateCitation(
      recordWithScope("Report", "document"),
      "fr",
      "text"
    );

    expect(citation).toContain("[Rapport]");
  });

  it("omits the version when there is no edition", () => {
    const citation = generateCitation(
      { ...recordWithScope("Report", "document"), edition: "" },
      "en",
      "text"
    );

    expect(citation).not.toContain("Version");
  });

  it("omits the descriptor for an unknown scope instead of throwing", () => {
    const citation = generateCitation(
      recordWithScope("NotAScopeCode", "document"),
      "en",
      "text"
    );

    expect(citation).not.toContain("[");
  });
});
