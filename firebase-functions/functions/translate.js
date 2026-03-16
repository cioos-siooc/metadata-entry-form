const functions = require("firebase-functions");
const { defineString } = require('firebase-functions/params');
const { CohereClientV2 } = require("cohere-ai");

const cohereApiKey = defineString('COHERE_API_KEY');
const cohereApiKeyCred = process.env.COHERE_API_KEY || cohereApiKey.value();

const client = new CohereClientV2({
  token: cohereApiKeyCred,
});

// Translate up to 5000 characters at a time using Cohere
const translateText = async (
  originalText,
  sourceLanguageCode,
  targetLanguageCode
) => {
  try {
    const response = await client.chat({
      model: "command-translate",
      messages: [
        {
          role: "user",
          content: `Translate the following text from ${sourceLanguageCode === 'en' ? 'English' : 'French'} to ${targetLanguageCode === 'en' ? 'English' : 'French'}. Only provide the translation, nothing else:\n\n${originalText}`,
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
