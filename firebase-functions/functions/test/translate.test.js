// Mock firebase-functions
jest.mock("firebase-functions", () => ({
  https: {
    onCall: (fn) => fn,
    HttpsError: class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    },
  },
}));

jest.mock("firebase-functions/params", () => ({
  defineString: () => ({ value: () => "test-key" }),
}));

// Mock Cohere client
const mockChat = jest.fn();
jest.mock("cohere-ai", () => ({
  CohereClientV2: jest.fn(() => ({
    chat: mockChat,
  })),
}));

// Mock fs.readFileSync to return a prompt template with glossary already baked in
jest.mock("fs", () => {
  const actual = jest.requireActual("fs");
  return {
    ...actual,
    readFileSync: jest.fn((filePath) => {
      if (filePath.includes("translation-prompt-template.txt")) {
        return [
          "Translate from {{sourceLang}} to {{targetLang}}.",
          "Use the following glossary:",
          "(en → fr)",
          '- "CIOOS" → "SIOOC"',
          "{{originalText}}",
        ].join("\n");
      }
      return actual.readFileSync(filePath);
    }),
  };
});

// Mock translation-meta.json
jest.mock(
  "../translation-meta.json",
  () => ({
    commonsVersion: "abc1234",
  }),
  { virtual: true },
);

const { translate } = require("../translate");

describe("translate.js", () => {
  const authContext = { auth: { token: "test-token" } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("translate cloud function", () => {
    it("rejects unauthenticated requests", async () => {
      await expect(
        translate({ text: "hello", fromLang: "en" }, { auth: null }),
      ).rejects.toThrow();
    });

    it("translates EN to FR and returns provenance", async () => {
      mockChat.mockResolvedValue({
        message: { content: [{ text: "Bonjour le monde" }] },
      });

      const result = await translate(
        { text: "Hello world", fromLang: "en" },
        authContext,
      );

      expect(result.translatedText).toBe("Bonjour le monde");
      expect(result.translationMessage).toContain("Cohere");
      expect(result.translationMessage).toContain(
        "command-a-translate-08-2025",
      );
      expect(result.translationMessage).toContain("cioos-commons@abc1234");
    });

    it("translates FR to EN", async () => {
      mockChat.mockResolvedValue({
        message: { content: [{ text: "Hello world" }] },
      });

      const result = await translate(
        { text: "Bonjour le monde", fromLang: "fr" },
        authContext,
      );

      expect(result.translatedText).toBe("Hello world");
    });

    it("sends the prompt with correct language substitutions", async () => {
      mockChat.mockResolvedValue({
        message: { content: [{ text: "translated" }] },
      });

      await translate({ text: "test input", fromLang: "en" }, authContext);

      const prompt = mockChat.mock.calls[0][0].messages[0].content;

      expect(prompt).toContain("from Canadian English to Canadian French");
      expect(prompt).toContain("test input");
    });

    it("includes baked-in glossary in the prompt", async () => {
      mockChat.mockResolvedValue({
        message: { content: [{ text: "translated" }] },
      });

      await translate({ text: "test", fromLang: "en" }, authContext);

      const prompt = mockChat.mock.calls[0][0].messages[0].content;
      expect(prompt).toContain("glossary");
      expect(prompt).toContain("CIOOS");
      expect(prompt).toContain("SIOOC");
    });

    it("throws when Cohere returns empty response", async () => {
      mockChat.mockResolvedValue({
        message: { content: [] },
      });

      await expect(
        translate({ text: "hello", fromLang: "en" }, authContext),
      ).rejects.toThrow("No translation received from Cohere API");
    });

    it("throws when Cohere API errors", async () => {
      mockChat.mockRejectedValue(new Error("API rate limit"));

      await expect(
        translate({ text: "hello", fromLang: "en" }, authContext),
      ).rejects.toThrow("API rate limit");
    });
  });
});
