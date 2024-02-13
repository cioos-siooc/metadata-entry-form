import licenses from "./licenses";
import regions from "../regions";


function recordToDataCite(metadata, language, region) {

    // Reduce contacts to a list of creators
    const creators = metadata.contacts ? metadata.contacts.reduce((creatorList, contact) => {
      let creator;
  
      if (contact.inCitation && !contact.role.includes("publisher")) {
        const {
          givenNames,
          lastName,
          orgName,
          indOrcid,
          orgRor,
        } = contact;
        
        // Create an individual creator object with names
        if (givenNames) {
          creator = {
            name: `${lastName}, ${givenNames}`,
            nameType: "Personal",
            givenName: givenNames,
            familyName: lastName,
            // Add affiliation for individual if organization details are provided
            affiliation: orgName ? [{
              name: orgName,
              schemeUri: "https://ror.org",
              affiliationIdentifier: orgRor,
              affiliationIdentifierScheme: "ROR",
            }] : [],
          };

          // Add nameIdentifiers for individual with an ORCID
          if (indOrcid) {
            creator.nameIdentifiers = [
                {
                  schemeUri: "https://orcid.org",
                  nameIdentifier: indOrcid,
                  nameIdentifierScheme: "ORCID",
                },
              ];
            }
          }
        }
      
      // Add the creator to the list if it exists
      if (creator) {
        creatorList.push(creator);
      }
  
      return creatorList;
    }, []) : [];
  
    // Find the publisher contact
    const publisher = metadata.contacts.find((contact) =>
      contact.role.includes("publisher")
    );
  
    // Get the publication year from the datePublished field
    let publicationYear;
    if (metadata.datePublished) {
      const year = parseInt(metadata.datePublished.slice(0, 4), 10)
      publicationYear = Number.isNaN(year) ? undefined : year;
    } else {
      publicationYear = undefined;
    }
  
    // Create the DataCite subjects from the keywords field
    const subjects = metadata.keywords
      ? Object.entries(metadata.keywords).flatMap(([lang, keywords]) =>
          keywords.map((keyword) => ({
            lang,
            subject: keyword,
          }))
        )
      : undefined;
  
    // Create the DataCite dates from the date fields
    const dates = [];
  
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
    const rightsList = licenseInfo && licenseInfo.title ? [
      {
        rights: licenseInfo.title.en,
        rightsUri: licenseInfo.url,
        schemeUri: "https://spdx.org/licenses/",
        rightsIdentifier: licenseInfo.code,
        rightsIdentifierScheme: "SPDX",
      },
    ] : [];
  
    // Extract the values from the map field
    let { east, north, south, west } = metadata.map ? metadata.map : {};

    east = Number.isNaN(east) ? undefined : east;
    north = Number.isNaN(north) ? undefined : north;
    south = Number.isNaN(south) ? undefined : south;
    west = Number.isNaN(west) ? undefined : west;   
  
    // Create the DataCite geoLocations object
    const geoLocations = metadata.map && east && north && south && west ? [
      {
        geoLocationBox: {
          eastBoundLongitude: parseFloat(east),
          northBoundLatitude: parseFloat(north),
          southBoundLatitude: parseFloat(south),
          westBoundLongitude: parseFloat(west),
        },
      },
    ] : [];
  
    // Create the mapped DataCite object with the extracted information
    const mappedDataCiteObject = {
      data: {
        type: "dois",
        attributes: {
          prefix: regions[region].datacitePrefix,
          creators,
          // Initialize an empty array for titles
          titles: [],
        },
      },
    };

    // Add English title if it exists
    if (metadata.title.en) {
      mappedDataCiteObject.data.attributes.titles.push({
        lang: "en",
        title: metadata.title.en,
      });
    }

    // Add French title if it exists
    if (metadata.title.fr) {
      mappedDataCiteObject.data.attributes.titles.push({
        lang: "fr",
        title: metadata.title.fr,
      });
    }

    // Add publisher if it exists
    if (publisher) {
      mappedDataCiteObject.data.attributes.publisher = 
        publisher.orgName || publisher.indName;
    }

    // Add publication year if it exists
    if (metadata.datePublished) {
      mappedDataCiteObject.data.attributes.publicationYear = publicationYear;
    }

    // Add subjects if they exist
    if (metadata.keywords) {
      mappedDataCiteObject.data.attributes.subjects = subjects;
    }

    // Add dates if they exist
    if (dates.length > 0) {
      mappedDataCiteObject.data.attributes.dates = dates;
    }

    // Add rightsList
    mappedDataCiteObject.data.attributes.rightsList = rightsList;

    // Add descriptions from the abstract field
    mappedDataCiteObject.data.attributes.descriptions = Object.entries(
      metadata.abstract
    ).map(([lang, description]) => ({
      lang,
      description,
      descriptionType: "Abstract",
    }));

    // Add geolocations if they exist
    if (metadata.map) {
      mappedDataCiteObject.data.attributes.geoLocations = geoLocations;
    }

    // Auto-populate Datacite Resource type general  as 'dataset'
    mappedDataCiteObject.data.attributes.types = {
      resourceTypeGeneral: "Dataset", // TODO: change this to reflect resource type in form
    };

    // Link related works to this record via relatedIdentifiers datacire field
    if (metadata.associated_resources) {
      // eslint-disable-next-line camelcase
      mappedDataCiteObject.data.attributes.relatedIdentifiers = metadata.associated_resources.map(({authority, code, association_type}) => ({
        relatedIdentifier: code,
        relatedIdentifierType: authority,
        // eslint-disable-next-line camelcase
        relationType: association_type,
      }));
    }

    // Generate URL element
    mappedDataCiteObject.data.attributes.url = `${regions[region].catalogueURL[language]}dataset/ca-cioos_${metadata.identifier}`;

    return mappedDataCiteObject;
  }

  export default recordToDataCite;