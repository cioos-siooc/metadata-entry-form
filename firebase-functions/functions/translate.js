const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineString } = require('firebase-functions/params');
const { TranslateClient, TranslateTextCommand } = require("@aws-sdk/client-translate");

const awsRegion = defineString('AWS_REGION');
const awsAccessKeyId = defineString('AWS_ACCESSKEYID');
const awsSecretAccessKey = defineString('AWS_SECRETACCESSKEY');

// Lazy initialization - client created on first use
let translateClient = null;

function getTranslateClient() {
  if (!translateClient) {
    translateClient = new TranslateClient({
      region: process.env.AWS_REGION || awsRegion.value(),
      credentials: {
        accessKeyId: process.env.AWS_ACCESSKEYID || awsAccessKeyId.value(),
        secretAccessKey: process.env.AWS_SECRETACCESSKEY || awsSecretAccessKey.value(),
      },
    });
  }
  return translateClient;
}

// Translate up to 100,000 characters at a time using amazon translate
const translateText = async (
  originalText,
  sourceLanguageCode,
  targetLanguageCode
) => {
  const command = new TranslateTextCommand({
    Text: originalText,
    SourceLanguageCode: sourceLanguageCode,
    TargetLanguageCode: targetLanguageCode,
  });

  try {
    const data = await getTranslateClient().send(command);
    return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("translateText error: ", err);
    throw err;
  }
};

exports.translate = onCall(async (request) => {
  if (!request.auth || !request.auth.token)
    throw new HttpsError("unauthenticated", "User must be authenticated");

  const { text, fromLang } = request.data;

  const toLang = fromLang === "en" ? "fr" : "en";

  const res = await translateText(text, fromLang, toLang);
  return res.TranslatedText;
});
