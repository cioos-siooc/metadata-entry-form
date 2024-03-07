
const expectedDataCiteStructure = {
    "data": {
        "type": "dois",
        "attributes": {
            "prefix": "10.21966",
            "creators": [
                {
                    "name": "Sorochak, Austen",
                    "nameType": "Personal",
                    "givenName": "Austen",
                    "familyName": "Sorochak",
                    "affiliation": [
                        {
                            "name": "Royal Roads University",
                            "schemeUri": "https://ror.org",
                            "affiliationIdentifier": "https://ror.org/05w4ste42",
                            "affiliationIdentifierScheme": "ROR",
                        },
                    ],
                },
                {
                    "name": "PumpkinKing, Jack",
                    "nameType": "Personal",
                    "givenName": "Jack",
                    "familyName": "PumpkinKing",
                    "affiliation": [],
                },
            ],
            "titles": [
                {
                    "lang": "en",
                    "title": "This is a mock record",
                },
                {
                    "lang": "fr",
                    "title": "Il s'agit d'un faux record",
                },
            ],
            "publisher": "Royal Roads University",
            "relatedIdentifiers": [],
            "fundingReferences": [
                {
                  "funderName": "Royal Roads University",
                },
              ],
            "publicationYear": 2023,
            "subjects": [
                {
                    "lang": "en",
                    "subject": "abundance and biomass",
                },
                {
                    "lang": "fr",
                    "subject": "abondance et biomasse",
                },
            ],
            "version": "1.1",
            "dates": [
                {
                    "date": "2023-10-01T19:00:00.000Z",
                    "dateType": "Collected",
                    "dateInformation": "Start date when data was first collected",
                },
                {
                    "date": "2023-10-04T19:00:00.000Z",
                    "dateType": "Collected",
                    "dateInformation": "End date when data was last collected",
                },
            ],
            "rightsList": [
                {
                    "rights": "Creative Commons Attribution 4.0 Attribution",
                    "rightsUri": "https://creativecommons.org/licenses/by/4.0",
                    "schemeUri": "https://spdx.org/licenses/",
                    "rightsIdentifier": "CC-BY-4.0",
                    "rightsIdentifierScheme": "SPDX",
                },
            ],
            "descriptions": [
                {
                    "lang": "en",
                    "description": "This is a mock record to be used in unit tests, to ensure the continued functionality of the mapping function.",
                    "descriptionType": "Abstract",
                },
                {
                    "lang": "fr",
                    "description": "Il s'agit d'un enregistrement fictif à utiliser dans les tests unitaires, afin de garantir la fonctionnalité continue de la fonction de mappage.",
                    "descriptionType": "Abstract",
                },
            ],
            "geoLocations": [
                {
                    "geoLocationBox": {
                        "eastBoundLongitude": -160,
                        "northBoundLatitude": 60,
                        "southBoundLatitude": 45,
                        "westBoundLongitude": -120,
                    },
                },
            ],
            "types": {
                "resourceTypeGeneral": "Dataset",
            },
            "url": "https://catalogue.hakai.org/dataset/ca-cioos_b6f44266-5815-48bb-bd0c-dd050c6fe465",
        },
    },
}

export default expectedDataCiteStructure;