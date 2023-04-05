const baseUrl = 'https://api.datacite.org/dois/'
const {DATACITE_AUTH_HASH, HAKAI_DOI_PREFIX} = process.env;
const functions = require("firebase-functions");
const axios = require("axios");

// function mapRecordToDataCite(record) {

// }

exports.createDraftDoi = functions.https.onCall(
    async (record) => {
        console.log(`title: ${record.title.en}`)
        const url = `${baseUrl}`
        
        const body = {
            "data": {
                "type": "dois",
                "attributes": {
                    "prefix": `${HAKAI_DOI_PREFIX}`,
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
                authorization: `Basic ${DATACITE_AUTH_HASH}`,
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
            {headers : {authorization: `Basic ${DATACITE_AUTH_HASH}`,}}
        )
        return response.status
    }
)
