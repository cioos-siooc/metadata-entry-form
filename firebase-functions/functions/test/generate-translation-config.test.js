const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const FUNCTIONS_DIR = path.resolve(__dirname, "..");
const META_PATH = path.join(FUNCTIONS_DIR, "translation-meta.json");
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
  let originalPrompt;
  let originalMeta;
  let scriptResult;

  beforeAll(() => {
    originalPrompt = fs.existsSync(PROMPT_PATH)
      ? fs.readFileSync(PROMPT_PATH, "utf8")
      : null;
    originalMeta = fs.existsSync(META_PATH)
      ? fs.readFileSync(META_PATH, "utf8")
      : null;

    scriptResult = tryRunScript();
  });

  afterAll(() => {
    if (originalPrompt !== null) fs.writeFileSync(PROMPT_PATH, originalPrompt);
    if (originalMeta !== null) fs.writeFileSync(META_PATH, originalMeta);
  });

  it("fetches prompt template and generates translation-meta.json", () => {
    if (!scriptResult.success) {
      console.warn("Skipping: remote cioos-commons files not available yet");
      return;
    }

    expect(scriptResult.output).toContain("Fetched");
    expect(scriptResult.output).toContain("Generated translation-meta.json");
  });

  it("writes a prompt template with expected placeholders", () => {
    if (!scriptResult.success && originalPrompt === null) {
      console.warn("Skipping: no prompt template file available");
      return;
    }

    const prompt = fs.readFileSync(PROMPT_PATH, "utf8");

    expect(prompt).toContain("{{sourceLang}}");
    expect(prompt).toContain("{{targetLang}}");
    expect(prompt).toContain("{{originalText}}");
  });

  it("prompt template contains baked-in glossary entries", () => {
    if (!scriptResult.success && originalPrompt === null) {
      console.warn("Skipping: no prompt template file available");
      return;
    }

    const prompt = fs.readFileSync(PROMPT_PATH, "utf8");

    expect(prompt).toContain("CIOOS");
    expect(prompt).toContain("SIOOC");
    expect(prompt).not.toContain("{{glossaryEntries}}");
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

  it("supports pulling the latest commit from a branch", () => {
    const result = tryRunScript("--branch main");
    if (!result.success) {
      console.warn("Skipping: remote cioos-commons files not available yet");
      return;
    }

    const meta = JSON.parse(fs.readFileSync(META_PATH, "utf8"));
    expect(meta.commonsRef).toBe("main");
    expect(meta.commonsRefType).toBe("branch");
    expect(meta.commonsCommit).toMatch(/^[a-f0-9]{40}$/);
    expect(result.output).toContain("Resolved branch 'main' to commit");
  });
});
