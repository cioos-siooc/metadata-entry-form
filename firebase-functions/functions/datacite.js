const baseUrl = 'https://api.datacite.org/dois/'
const functions = require("firebase-functions");
const axios = require("axios");

const dataciteHash = functions.config().hakai.datacite_hash;
const datacitePrefix = functions.config().hakai.datacite_prefix;

exports.createDraftDoi = functions.https.onCall(
    async (record) => {
        console.log(`title: ${record.title.en}`)
        const url = `${baseUrl}`
        
        const body = {
            "data": {
                "type": "dois",
                "attributes": {
                    "prefix": `${datacitePrefix}`,
                    "titles": [
                        {
                            "lang": "en",
                            "title": record.title.en
                        },
                        {
                            "lang": "fr",
                            "title": record.title.fr
                        }
                    ],
                },
            },
        }

        const response = await axios.post(url, body, {
            headers: {
                authorization: `Basic ${dataciteHash}`,
                content_type: "application/json",
            }
        })
        functions.logger.debug(`response: ${JSON.stringify(response.data)}`)
        return response.data
    }
)

exports.deleteDraftDoi = functions.https.onCall(
    async (draftDoi) => {
        const url = `${baseUrl}${draftDoi}/`
        const response = await axios.delete(
            url,
            {headers : {authorization: `Basic ${dataciteHash}`,}}
        )
        return response.status
    }
)
