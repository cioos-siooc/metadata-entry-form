import { describe, expect, it } from "vitest";
import {
  DEFAULT_WAF_FORMATS,
  generateWafToken,
  getWafSettings,
  harvestURL,
  hashWafToken,
} from "../utils/waf";

describe("WAF tokens", () => {
  it("generates distinct url-safe tokens with the waf_ prefix", () => {
    const token = generateWafToken();
    expect(token).toMatch(/^waf_[A-Za-z0-9_-]{43}$/);
    expect(generateWafToken()).not.toEqual(token);
  });

  it("hashes like cioos-records-update waf_auth.hash_token", async () => {
    // hashlib.sha256(b"waf_secret-token").hexdigest()
    expect(await hashWafToken("waf_secret-token")).toEqual(
      "f24dff75a22a73ac62becfae31d19128de922a874347698d113cfa9b766a3212",
    );
  });

  it("builds a Basic auth harvest URL", () => {
    expect(harvestURL("https://waf.example/metadata", "pacific", "waf_abc")).toEqual(
      "https://harvester:waf_abc@waf.example/metadata/pacific/",
    );
  });
});

describe("getWafSettings", () => {
  it("defaults to the legacy xml and yaml output", () => {
    const settings = getWafSettings(null);
    expect(settings.formats).toEqual(DEFAULT_WAF_FORMATS);
    expect(settings.splitByOwner).toBe(false);
    expect(settings.url).toEqual("https://forms.cioos.ca/api/");
  });

  it("reads the region settings", () => {
    const settings = getWafSettings({
      waf: { formats: ["erddap"], splitByOwner: true, url: "http://localhost:5000/api" },
    });
    expect(settings).toMatchObject({
      formats: ["erddap"],
      splitByOwner: true,
      url: "http://localhost:5000/api/",
    });
  });
});
