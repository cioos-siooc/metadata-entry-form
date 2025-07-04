const functions = require("firebase-functions");
const { defineString } = require('firebase-functions/params');
const AWS = require("aws-sdk");

const awsRegion = defineString('AWS_REGION');
const awsAccessKeyId = defineString('AWS_ACCESSKEYID');
const awsSecretAccessKey = defineString('AWS_SECRETACCESSKEY');

const awsRegionCred = process.env.AWS_REGION || awsRegion.value()
const awsAccessKeyIdCred = process.env.AWS_ACCESSKEYID || awsAccessKeyId.value()
const awsSecretAccessKeyCred = process.env.AWS_SECRETACCESSKEY || awsSecretAccessKey.value()

const awsAuth = {
  region: awsRegionCred,
  accessKeyId: awsAccessKeyIdCred,
  secretAccessKey: awsSecretAccessKeyCred,
};

AWS.config = new AWS.Config(awsAuth);

const translate = new AWS.Translate();

// Translate up to 100,000 characters at a time using amazon translate
const translateText = async (
  originalText,
  sourceLanguageCode,
  targetLanguageCode
) => {
  return new Promise((resolve, reject) => {
    const params = {
      Text: originalText,
      SourceLanguageCode: sourceLanguageCode,
      TargetLanguageCode: targetLanguageCode,
    };

    try {
      translate.translateText(params, (err, data) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.log("translateText error: ", err);
          reject(err);
        }

        if (data) resolve(data);
      });
    } catch (err) {
      // eslint-disable-next-line no-console
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
