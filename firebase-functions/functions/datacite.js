const baseUrl = 'https://api.datacite.org/dois/'
const {DATACITE_USER, DATACITE_PASS, HAKAI_DOI_PREFIX} = process.env;
const functions = require("firebase-functions");
const axios = require("axios");

exports.createDraftDoi = functions.https.onCall(
    async () => {
        const url = `${baseUrl}`
        const body = {
            "data": {
                "type": "dois",
                "attributes": {
                    "prefix": `${HAKAI_DOI_PREFIX}`,
                },
            },
        }
        const response = await axios.post(url, body, {
            headers: {
                user: `${DATACITE_USER}:${DATACITE_PASS}`,
                content_type: "application/json",
            }
        })
        return response.json()
    }
)

exports.deleteDraftDoi = functions.https.onCall(
    async (draftDoi) => {
        const url = `${baseUrl}${draftDoi}/`
        const response = await axios.delete(
            url,
            {
                headers :
                    {user: `${DATACITE_USER}:${DATACITE_PASS}`,}
            })
        return response
    }
)
