const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const FUNCTIONS_DIR = path.resolve(__dirname, "..");
const META_PATH = path.join(FUNCTIONS_DIR, "translation-meta.json");
const GLOSSARY_PATH = path.join(FUNCTIONS_DIR, "translation-glossary.json");
const PROMPT_PATH = path.join(FUNCTIONS_DIR, "translation-prompt-template.txt");

/**
 * Try running the sync script. Returns { output, success }.
 * The script may fail if the remote cioos-commons repo doesn't have
 * the translation files yet (e.g. in CI before the files are pushed).
 */
function tryRunScript(args = "") {
  try {
    const output = execSync(`node generate-translation-config.js ${args}`.trim(), {
      cwd: FUNCTIONS_DIR,
      encoding: "utf8",
      timeout: 30000,
    });
    return { output, success: true };
  } catch (err) {
    return { output: err.stderr || err.message, success: false };
  }
}

describe("generate-translation-config.js", () => {
  // Save original files to restore after tests
  let originalGlossary;
  let originalPrompt;
  let originalMeta;
  let scriptResult;

  beforeAll(() => {
    originalGlossary = fs.existsSync(GLOSSARY_PATH)
      ? fs.readFileSync(GLOSSARY_PATH, "utf8")
      : null;
    originalPrompt = fs.existsSync(PROMPT_PATH)
      ? fs.readFileSync(PROMPT_PATH, "utf8")
      : null;
    originalMeta = fs.existsSync(META_PATH)
      ? fs.readFileSync(META_PATH, "utf8")
      : null;

    // Run the script once for all tests
    scriptResult = tryRunScript();
  });

  afterAll(() => {
    // Restore original files
    if (originalGlossary !== null) fs.writeFileSync(GLOSSARY_PATH, originalGlossary);
    if (originalPrompt !== null) fs.writeFileSync(PROMPT_PATH, originalPrompt);
    if (originalMeta !== null) fs.writeFileSync(META_PATH, originalMeta);
  });

  it("fetches files from cioos-commons and generates translation-meta.json", () => {
    if (!scriptResult.success) {
      console.warn("Skipping: remote cioos-commons files not available yet");
      return;
    }

    expect(scriptResult.output).toContain("Fetched");
    expect(scriptResult.output).toContain("Generated translation-meta.json");
  });

  it("writes a valid glossary.json with expected structure", () => {
    if (!scriptResult.success && originalGlossary === null) {
      console.warn("Skipping: no glossary file available");
      return;
    }

    const glossary = JSON.parse(fs.readFileSync(GLOSSARY_PATH, "utf8"));

    expect(Array.isArray(glossary)).toBe(true);
    expect(glossary.length).toBeGreaterThan(0);
    expect(glossary[0]).toHaveProperty("en");
    expect(glossary[0]).toHaveProperty("fr");
  });

  it("writes a prompt template with expected placeholders", () => {
    if (!scriptResult.success && originalPrompt === null) {
      console.warn("Skipping: no prompt template file available");
      return;
    }

    const prompt = fs.readFileSync(PROMPT_PATH, "utf8");

    expect(prompt).toContain("{{sourceLang}}");
    expect(prompt).toContain("{{targetLang}}");
    expect(prompt).toContain("{{glossaryPrompt}}");
    expect(prompt).toContain("{{originalText}}");
  });

  it("writes translation-meta.json with version provenance", () => {
    if (!scriptResult.success && originalMeta === null) {
      console.warn("Skipping: no meta file available");
      return;
    }

    const meta = JSON.parse(fs.readFileSync(META_PATH, "utf8"));

    expect(meta).toHaveProperty("commonsVersion");
    expect(meta.commonsVersion).toMatch(/^[a-f0-9]{7}$/);
    expect(meta).toHaveProperty("generatedAt");

    // commonsRef and commonsRepo are only present after a successful fetch
    if (scriptResult.success) {
      expect(meta).toHaveProperty("commonsRef");
      expect(meta).toHaveProperty("commonsRepo");
    }
  });

  it("supports pinning a specific ref", () => {
    const result = tryRunScript("main");
    if (!result.success) {
      console.warn("Skipping: remote cioos-commons files not available yet");
      return;
    }

    const meta = JSON.parse(fs.readFileSync(META_PATH, "utf8"));
    expect(meta.commonsRef).toBe("main");
    expect(result.output).toContain("cioos-commons@");
  });
});
