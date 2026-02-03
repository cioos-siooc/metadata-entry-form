const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");

// Function to check if a given URL is active
exports.checkURLActive = onCall(async (request) => {
    let url = request.data;
    logger.log('Received URL:', url);

    if (!url) {
        throw new HttpsError('invalid-argument', 'The function must be called with one argument "url".');
    }

    // Prepend 'http://' if the URL does not start with 'http://' or 'https://'
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
    }

    try {
        const response = await fetch(url, {method: "HEAD" });
        logger.log(`Fetch response status for ${url}:`, response.status);
        return response.ok; // Return true if response is OK, otherwise false
    } catch (error) {
        logger.error('Error in checkURLActive for URL:', url, error);
        return false; // Return false if an error occurs
    }
});
