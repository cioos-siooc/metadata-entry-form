const licenses = require("./licenses");
const { HAKAI_DOI_PREFIX } = process.env;

function recordToDataCite(metadata) {
    const creators = metadata.contacts.reduce((creatorList, contact) => {
      let creator;
  
      if (contact.inCitation) {
        const {
          indName,
          orgName,
          lastName,
          givenNames,
          indOrcid,
          orgRor,
        } = contact;
  
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
  
    const publisher = metadata.contacts.find((contact) =>
      contact.role.includes("publisher")
    );
  
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
        dateType: "Collected",
        dateInformation: "Start date when data was first collected",
      });
    }
  
    if (metadata.dateEnd) {
      dates.push({
        date: metadata.dateEnd,
        dateType: "Collected",
        dateInformation: "End date when data was last collected",
      });
    }
  
    if (metadata.dateRevised) {
      dates.push({
        date: metadata.dateRevised,
        dateType: "Updated",
        dateInformation: "Date when the data was last revised",
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
      data: {
        type: "dois",
        attributes: {
          prefix: `${HAKAI_DOI_PREFIX}`,
          creators: creators,
          titles: [
            ...(metadata.title.en
              ? [{ lang: "en", title: metadata.title.en }]
              : []),
            ...(metadata.title.fr
              ? [{ lang: "fr", title: metadata.title.fr }]
              : []),
          ],
          ...(publisher
            ? { publisher: publisher.orgName } || publisher.indName
            : {}),
          ...(metadata.datePublished ? { publicationYear: publicationYear } : {}),
          ...(metadata.keywords ? { subjects: subjects } : {}),
          ...(dates.length > 0 ? { dates: dates } : {}),
          rightsList: rightsList,
          descriptions: Object.entries(metadata.abstract).map(
            ([lang, description]) => ({
              lang,
              description,
              descriptionType: "Abstract",
            })
          ),
          ...(metadata.map ? { geoLocations: geoLocations } : {}),
        },
      },
    };
  
    return mappedDataCiteObject;
  }

  module.exports = recordToDataCite;