// Port of firebase-functions/functions/test/translate.test.js.
// Cohere is mocked; the real prompt template (with the baked-in glossary)
// and translation-meta.json ship with the service.

const { buildTestApp, signToken, authHeader } = require("./helpers");

const mockChat = jest.fn();
jest.mock("cohere-ai", () => ({
  CohereClientV2: jest.fn(() => ({ chat: mockChat })),
}));

const { pool } = require("../src/db");
const { translateText, MODEL } = require("../src/services/translate");

describe("translate", () => {
  let app;
  let token;

  beforeAll(async () => {
    app = await buildTestApp();
    token = await signToken({ email: "translator@translate.test" });
  });

  afterAll(async () => {
    const { query } = require("../src/db");
    await query("DELETE FROM users WHERE email LIKE '%@translate.test'");
    await app.close();
    await pool.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("translateText", () => {
    it("translates EN to FR and returns provenance", async () => {
      mockChat.mockResolvedValue({
        message: { content: [{ text: "Bonjour le monde" }] },
      });

      const result = await translateText("Hello world", "en");

      expect(result.translatedText).toBe("Bonjour le monde");
      expect(result.translationMessage).toContain("Cohere");
      expect(result.translationMessage).toContain(MODEL);
      expect(result.translationMessage).toMatch(/cioos-commons@\w+/);
    });

    it("translates FR to EN", async () => {
      mockChat.mockResolvedValue({
        message: { content: [{ text: "Hello world" }] },
      });

      const result = await translateText("Bonjour le monde", "fr");

      expect(result.translatedText).toBe("Hello world");
      const prompt = mockChat.mock.calls[0][0].messages[0].content;
      expect(prompt).toContain("from Canadian French to Canadian English");
    });

    it("sends the prompt with correct language substitutions", async () => {
      mockChat.mockResolvedValue({
        message: { content: [{ text: "translated" }] },
      });

      await translateText("test input", "en");

      expect(mockChat.mock.calls[0][0].model).toBe(MODEL);
      const prompt = mockChat.mock.calls[0][0].messages[0].content;
      expect(prompt).toContain("from Canadian English to Canadian French");
      expect(prompt).toContain("test input");
    });

    it("includes the baked-in glossary in the prompt", async () => {
      mockChat.mockResolvedValue({
        message: { content: [{ text: "translated" }] },
      });

      await translateText("test", "en");

      const prompt = mockChat.mock.calls[0][0].messages[0].content;
      expect(prompt).toContain("glossary");
      expect(prompt).toContain("CIOOS");
      expect(prompt).toContain("SIOOC");
    });

    it("strips <text_to_translate> wrapper tags echoed by the model", async () => {
      mockChat.mockResolvedValue({
        message: {
          content: [{ text: "<text_to_translate>\nBonjour\n</text_to_translate>" }],
        },
      });

      const result = await translateText("Hello", "en");
      expect(result.translatedText).toBe("Bonjour");
    });

    it("throws when Cohere returns an empty response", async () => {
      mockChat.mockResolvedValue({ message: { content: [] } });

      await expect(translateText("hello", "en")).rejects.toThrow(
        "No translation received from Cohere API",
      );
    });

    it("throws when the Cohere API errors", async () => {
      mockChat.mockRejectedValue(new Error("API rate limit"));

      await expect(translateText("hello", "en")).rejects.toThrow("API rate limit");
    });
  });

  describe("POST /api/v1/translate", () => {
    it("rejects unauthenticated requests", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/translate",
        payload: { text: "hello", fromLang: "en" },
      });
      expect(res.statusCode).toBe(401);
      expect(mockChat).not.toHaveBeenCalled();
    });

    it("requires text and fromLang", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/translate",
        headers: authHeader(token),
        payload: { text: "hello" },
      });
      expect(res.statusCode).toBe(422);
    });

    it("returns the callable-shaped {data} response", async () => {
      mockChat.mockResolvedValue({
        message: { content: [{ text: "Bonjour le monde" }] },
      });

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/translate",
        headers: authHeader(token),
        payload: { text: "Hello world", fromLang: "en" },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.translatedText).toBe("Bonjour le monde");
      expect(body.data.translationMessage).toContain(`Cohere ${MODEL}`);
    });

    it("returns 500 when translation fails", async () => {
      mockChat.mockRejectedValue(new Error("API rate limit"));

      const res = await app.inject({
        method: "POST",
        url: "/api/v1/translate",
        headers: authHeader(token),
        payload: { text: "hello", fromLang: "en" },
      });

      expect(res.statusCode).toBe(500);
      expect(res.json().error).toBe("API rate limit");
    });
  });
});
