const functions = require("firebase-functions");
const fetch = require('node-fetch');

// Function to check if a given URL is active
exports.isURLActive = functions.https.onCall(async (data) => {
    const url = data.url;

    if (!url) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with one argument "url".');
    }

    try {
        const response = await fetch(url, {method: "HEAD" });
        return response.ok; // Return true if response is OK, otherwise false
    } catch (error) {
        console.error('Error in isURLActive:', error); // Log the error for debugging
        return false; // Return false if an error occurs 
    }
})