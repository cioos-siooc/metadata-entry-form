const functions = require("firebase-functions");
const { defineString } = require('firebase-functions/params');
const { CohereClientV2 } = require("cohere-ai");
const glossary = require("./translation-glossary.json");

const cohereApiKey = defineString('COHERE_API_KEY');
const cohereApiKeyCred = process.env.COHERE_API_KEY || cohereApiKey.value();

const client = new CohereClientV2({
  token: cohereApiKeyCred,
});

function buildGlossaryPrompt(sourceLanguageCode, targetLanguageCode) {
  if (!glossary || glossary.length === 0) return "";

  const entries = glossary
    .map((term) => `- "${term[sourceLanguageCode]}" → "${term[targetLanguageCode]}"`)
    .join("\n");

  return `\nUse the following glossary for domain-specific terms:\n${entries}\n`;
}

// Translate up to 5000 characters at a time using Cohere
const translateText = async (
  originalText,
  sourceLanguageCode,
  targetLanguageCode
) => {
  const sourceLang = sourceLanguageCode === 'en' ? 'English' : 'French';
  const targetLang = targetLanguageCode === 'en' ? 'English' : 'French';
  const glossaryPrompt = buildGlossaryPrompt(sourceLanguageCode, targetLanguageCode);

  try {
    const response = await client.chat({
      model: "command-a-translate-08-2025",
      messages: [
        {
          role: "user",
          content: `Translate the following text from ${sourceLang} to ${targetLang}. Only provide the translation, nothing else.${glossaryPrompt}\n${originalText}`,
        },
      ],
    });

    // Extract the translation from the response
    if (
      response.message &&
      response.message.content &&
      response.message.content.length > 0
    ) {
      const translatedText = response.message.content[0].text;
      return { TranslatedText: translatedText };
    } else {
      throw new Error("No translation received from Cohere API");
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("translateText error: ", err);
    throw err;
  }
};

exports.translate = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token)
    throw new functions.https.HttpsError("unauthenticated");

  const { text, fromLang } = data;

  const toLang = fromLang === "en" ? "fr" : "en";

  const res = await translateText(text, fromLang, toLang);
  return res.TranslatedText;
});
