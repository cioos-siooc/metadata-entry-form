import licenses from "./licenses";
import regions from "../regions";


function recordToDataCite(metadata, language, region, datacitePrefix) {

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

    // Filter all contacts with the role of 'funder'
    const funders = metadata.contacts.filter((contact) => 
      contact.role.includes("funder")
    );
  
    // Get the publication year from the datePublished field, if dateRevised contains value use dateRevised as publication year
    let publicationYear;
    if (metadata.dateRevised) {
      const revisedYear = parseInt(metadata.dateRevised.slice(0, 4), 10);
      publicationYear = Number.isNaN(revisedYear) ? undefined : revisedYear;
    } else if (metadata.datePublished) {
      const publishedYear = parseInt(metadata.datePublished.slice(0, 4), 10)
      publicationYear = Number.isNaN(publishedYear) ? undefined : publishedYear;
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
          prefix: datacitePrefix,
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

    // Add funders list if it exists
    if (funders && funders.length > 0) {
      mappedDataCiteObject.data.attributes.fundingReferences = funders.map(funder => {
        const fundingReference = {
          funderName: funder.orgName,
        };

        // Add ROR information if available
        if (funder.orgRor) {
          fundingReference.funderIdentifier = funder.orgRor;
          fundingReference.funderIdentifierType = "ROR";
        }

        return fundingReference;
      });
    }    

    // Add publication year if it exists
    if (metadata.datePublished) {
      mappedDataCiteObject.data.attributes.publicationYear = publicationYear;
    }

    // Add subjects if they exist
    if (metadata.keywords) {
      mappedDataCiteObject.data.attributes.subjects = subjects;
    }

    // add Version if it exists
    if (metadata.edition) {
      mappedDataCiteObject.data.attributes.version = metadata.edition;
    }
  

    // Add dates if they exist
    if (dates.length > 0) {
      mappedDataCiteObject.data.attributes.dates = dates;
    }

    // Add rightsList
    mappedDataCiteObject.data.attributes.rightsList = rightsList;

    // Add descriptions from the abstract field
    delete metadata.abstract.translations
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
      resourceTypeGeneral: "Dataset",
    };

    // Generate URL element
    mappedDataCiteObject.data.attributes.url = `${regions[region].catalogueURL[language]}dataset/ca-cioos_${metadata.identifier}`;

    return mappedDataCiteObject;
  }

  export default recordToDataCite;