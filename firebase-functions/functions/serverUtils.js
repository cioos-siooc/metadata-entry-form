const functions = require("firebase-functions");
const { defineString } = require('firebase-functions/params');
const fetch = require('node-fetch');

// Helper function to decide between GitHub Actions secret and Firebase parameter config
export const getConfigVar = (paramName) => {

    // Define the Firebase parameter using defineString
    const firebaseParam = defineString(paramName);

    // Check if the environment variable is set
    if (process.env[paramName]) {
        return process.env[paramName];
    }

    // Otherwise fallback to the Firebase parameter
    return firebaseParam.value();
  }

// Function to check if a given URL is active
exports.checkURLActive = functions.https.onCall(async (data) => {
    let url = data;
    functions.logger.log('Received URL:', url);

    if (!url) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with one argument "url".');
    }

    // Prepend 'http://' if the URL does not start with 'http://' or 'https://'
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
    }

    try {
        const response = await fetch(url, {method: "HEAD" });
        functions.logger.log(`Fetch response status for ${url}:`, response.status);
        return response.ok; // Return true if response is OK, otherwise false
    } catch (error) {
        functions.logger.error('Error in checkURLActive for URL:', url, error);
        return false; // Return false if an error occurs 
    }
})