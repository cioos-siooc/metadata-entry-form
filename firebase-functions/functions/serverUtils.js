const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions/v2");
const fetch = require('node-fetch');

// Hosts that must never be probed. Without this the function is a request-forgery
// primitive: the caller picks the host and port, and the boolean return value reports
// whether something answered there, from inside Google's network.
const blockedHostPatterns = [
    /^localhost$/i,
    /\.internal$/i,
    /\.local$/i,
    /^127\./,
    /^10\./,
    /^169\.254\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^0\./,
    /^\[?::1\]?$/,
    /^\[?f[cd][0-9a-f]{2}:/i,
];

function assertHostIsAllowed(hostname) {
    const host = hostname.replace(/^\[|\]$/g, "");
    if (!host || blockedHostPatterns.some((pattern) => pattern.test(host))) {
        throw new HttpsError('invalid-argument', 'That URL cannot be checked.');
    }
}

// Function to check if a given URL is active
exports.checkURLActive = onCall(async (request) => {
    // onCall does not reject callers that send no token at all, so without this the
    // function is reachable anonymously from anywhere.
    if (!request.auth || !request.auth.uid) {
        throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    if (!request.data.url) {
        throw new HttpsError('invalid-argument', 'The function must be called with one argument "url".');
    }
    let url = request.data.url;
    logger.log('Received URL:', url);

    // Prepend 'http://' if the URL does not start with 'http://' or 'https://'
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`;
    }

    let parsed;
    try {
        parsed = new URL(url);
    } catch (error) {
        throw new HttpsError('invalid-argument', 'That URL could not be parsed.');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new HttpsError('invalid-argument', 'Only http and https URLs can be checked.');
    }
    assertHostIsAllowed(parsed.hostname);

    try {
        // redirect: manual so a public URL cannot bounce the request to a blocked host.
        // A 3xx still means something is served there, so it counts as active.
        const response = await fetch(parsed.toString(), { method: "HEAD", redirect: "manual" });
        logger.log(`Fetch response status for ${url}:`, response.status);
        return response.ok || (response.status >= 300 && response.status < 400);
    } catch (error) {
        logger.error('Error in checkURLActive for URL:', url, error);
        return false; // Return false if an error occurs
    }
})
