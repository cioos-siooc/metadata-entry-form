const functions = require("firebase-functions");
const AWS = require("aws-sdk");
const { awsAuth } = require("./hooks-auth");

AWS.config = new AWS.Config(awsAuth);

const translate = new AWS.Translate();

const translateText = async (
  originalText,
  sourceLanguageCode,
  targetLanguageCode
) => {
  return new Promise((resolve, reject) => {
    let params = {
      Text: originalText,
      SourceLanguageCode: sourceLanguageCode,
      TargetLanguageCode: targetLanguageCode,
    };

    try {
      translate.translateText(params, (err, data) => {
        if (err) {
          console.log("translateText error: ", err);
          reject(err);
        }

        console.log("translateText data: ", data);
        if (data) resolve(data);
      });
    } catch (err) {
      console.error(err);
    }
  });
};

exports.translate = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token)
    throw new functions.https.HttpsError("unauthenticated");

  const { text, fromLang } = data;

  const toLang = fromLang === "en" ? "fr" : "en";

  const res = await translateText(text, fromLang, toLang);
  return res.TranslatedText;
});
