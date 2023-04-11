const baseUrl = 'https://api.datacite.org/dois/'
const {DATACITE_AUTH_HASH, HAKAI_DOI_PREFIX} = process.env;
const functions = require("firebase-functions");
const axios = require("axios");

const licenses = {
    "CC-BY-4.0": {
      title: { en: "Creative Commons Attribution 4.0 Attribution" },
      url: "https://creativecommons.org/licenses/by/4.0",
      code: "CC-BY-4.0",
    },
    "CC-BY-SA-4.0": {
      title: { en: "Creative Commons Attribution 4.0 Attribution-ShareAlike" },
      url: "https://creativecommons.org/licenses/by-sa/4.0/",
      code: "CC-BY-SA-4.0",
    },
    "CC-BY-ND-4.0": {
      title: { en: "Creative Commons Attribution 4.0 Attribution-NoDerivs " },
      url: "https://creativecommons.org/licenses/by-nd/4.0/",
      code: "CC-BY-ND-4.0",
    },
    "CC-BY-NC-4.0": {
      title: {
        en: "Creative Commons Attribution 4.0 Attribution-NonCommercial  ",
      },
      url: "https://creativecommons.org/licenses/by-nc/4.0/",
      code: "CC-BY-NC-4.0",
    },
    "CC-BY-NC-SA-4.0": {
      title: {
        en:
          "Creative Commons Attribution 4.0 Attribution-NonCommercial-ShareAlike ",
      },
      url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      code: "CC-BY-NC-SA-4.0",
    },
    "CC-BY-NC-ND-4.0": {
      title: {
        en: "Creative Commons Attribution 4.0 Attribution-NonCommercial-NoDerivs",
      },
      url: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
      code: "CC-BY-NC-ND-4.0",
    },
    CC0: {
      title: { en: "Creative Commons 0" },
      url: "https://creativecommons.org/share-your-work/public-domain/cc0",
      code: "CC0",
    },
    "government-open-license-canada": {
      title: {
        en: "Open Government Licence - Canada",
        fr: "Licence du gouvernement ouvert – Canada ",
      },
      url: "https://open.canada.ca/en/open-government-licence-canada",
      code: "government-open-license-canada",
    },
    "government-open-license-nova-scotia": {
      title: { en: "Open Government Licence - Nova Scotia" },
      url: "https://novascotia.ca/opendata/licence.asp",
      code: "government-open-license-nova-scotia",
    },
    "OGL-NB": {
      title: { en: "Open Government Licence – New Brunswick" },
      url: "http://www.snb.ca/e/2000/data-E.html",
      code: "OGL-NB",
    },
    "OGL-BC": {
      title: { en: "Open Government Licence - British Columbia" },
      url:
        "https://www2.gov.bc.ca/gov/content/data/open-data/open-government-licence-bc",
      code: "OGL-BC",
    },
  
    "government-open-license-newfoundland": {
      title: { en: "Open Government Licence - Newfoundland and Labrador" },
      url: "https://opendata.gov.nl.ca/public/opendata/page/?page-id=licence",
      code: "government-open-license-newfoundland",
    },
    "Apache-2.0": {
      title: { en: "Apache License, Version 2.0" },
      url: "https://www.apache.org/licenses/LICENSE-2.0",
      code: "Apache-2.0",
    },
  };

function mapRecordToDataCite(metadata) {

    const creators = metadata.contacts.reduce(( creatorList, contact) => {
            let creator;
            
            if (contact.inCitation) {
                const { indName, orgName, lastName, givenNames, indOrcid, orgRor } = contact;
          
                if (indName) {
                  creator = {
                    name: `${lastName}, ${givenNames}`,
                    nameType: "Personal",
                    givenName: givenNames,
                    familyName: lastName,
                    ...(indOrcid && {
                      nameIdentifiers: [
                        {
                          schemeUri: "https://orcid.org",
                          nameIdentifier: indOrcid,
                          nameIdentifierScheme: "ORCID",
                        },
                      ],
                    }),
                  };
                }
          
                if (orgName) {
                  creator = {
                    name: orgName,
                    nameType: "Organizational",
                    ...(orgRor && {
                      nameIdentifiers: [
                        {
                          schemeUri: "https://ror.org",
                          nameIdentifier: orgRor,
                          nameIdentifierScheme: "ROR",
                        },
                      ],
                    }),
                  };
                }
              }
          
              if (creator) {
                creatorList.push(creator);
              }
          
              return creatorList;
            }, []);

    const publisher = metadata.contacts.find(contact => contact.role.includes("publisher"));

    const publicationYear = metadata.datePublished
        ? parseInt(metadata.datePublished.slice(0, 4), 10)
        : undefined;

    const subjects = metadata.keywords
        ? Object.entries(metadata.keywords).flatMap(([lang, keywords]) =>
            keywords.map((keyword) => ({
                lang,
                subject: keyword,
            }))
            )
        : undefined;

    let dates = [];

    if (metadata.dateStart) {
        dates.push({
            date: metadata.dateStart,
            dateType: 'Collected',
            dateInformation: 'Start date when data was first collected'
        });
    }

    if (metadata.dateEnd) {
        dates.push({
            date: metadata.dateEnd,
            dateType: 'Collected',
            dateInformation: 'End date when data was last collected'
        });
    }

    if (metadata.dateRevised) {
        dates.push({
            date: metadata.dateRevised,
            dateType: 'Updated',
            dateInformation: 'Date when the data was last revised'
        });
    }

    // Look up the license information
  const licenseInfo = licenses[metadata.license];

  // Create the DataCite rightsList object
  const rightsList = [
    {
      rights: licenseInfo.title.en,
      rightsUri: licenseInfo.url,
      schemeUri: "https://spdx.org/licenses/",
      rightsIdentifier: licenseInfo.code,
      rightsIdentifierScheme: "SPDX",
    },
  ];

  // Extract the values from the map field
  const { east, north, south, west } = metadata.map;

  // Create the DataCite geoLocations object
  const geoLocations = [
    {
      geoLocationBox: {
        eastBoundLongitude: parseFloat(east),
        northBoundLatitude: parseFloat(north),
        southBoundLatitude: parseFloat(south),
        westBoundLongitude: parseFloat(west),
      },
    },
  ];

    const mappedDataCiteObject = {
        "data": {
            "type": "dois",
            "attributes": {
                "prefix": `${HAKAI_DOI_PREFIX}`,
                "creators": creators,
                "titles": [
                    ...(metadata.title.en ? [{ lang: "en", title: metadata.title.en }] : []),
                    ...(metadata.title.fr ? [{ lang: "fr", title: metadata.title.fr }] : []),
                ],
                ...(publisher ? {publisher: publisher.orgName} || publisher.indName : {}),
                ...(metadata.datePublished ? {publicationYear: publicationYear} : {}),
                ...(metadata.keywords ? {subjects: subjects} : {}),
                ...(dates.length > 0 ? {dates: dates} : {}),
                "rightsList": rightsList,
                "descriptions": Object.entries(metadata.abstract).map(([lang, description]) => ({
                    lang,
                    description,
                    descriptionType: 'Abstract'
                })),
                ...(metadata.map ? {geoLocations: geoLocations} : {}),
            }
        }
    }

    return mappedDataCiteObject;
}

exports.createDraftDoi = functions.https.onCall(
    async (record) => {
        
        const url = `${baseUrl}`
        
        const body = mapRecordToDataCite(record);

        const response = await axios.post(url, body, {
            headers: {
                authorization: `Basic ${DATACITE_AUTH_HASH}`,
                content_type: "application/json",
            }
        })

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
