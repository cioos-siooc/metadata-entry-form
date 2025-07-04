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
    // eslint-disable-next-line no-param-reassign
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
        resourceTypeGeneral: metadata.metadataScope || "Dataset", // TODO: change this to reflect resource type in form
    };

    // link data download resources to this record via relatedIdentifiers datacite field
    // This section has been removed until datacite schema 4.5 is finialized as there is a better
    // description of the 'distributions' field which would allow listing direct download urls under 'contentURL'
    // if (metadata.distribution) {
    //     mappedDataCiteObject.data.attributes.distribution =
    //         metadata.distribution.map(({ url }) => ({
    //             relatedIdentifier: url,
    //             relatedIdentifierType: 'URL',
    //             relationType: 'IsMetadataFor',
    //         }))
    // }

    // Link related works to this record via relatedIdentifiers datacite field
    if (metadata.associated_resources) {
        mappedDataCiteObject.data.attributes.relatedIdentifiers =
            [
                // ...mappedDataCiteObject.data.attributes.relatedIdentifiers,
                ...metadata.associated_resources.map(({ authority, code, association_type: associationType }) => ({
                    relatedIdentifier: code,
                    relatedIdentifierType: authority,
                    relationType: associationType,
                })
                )];
    }

    // link lineage source, processing step documents, and additional documentation to this record
    // via relatedIdentifiers datacite field
    if (metadata.history) {
      mappedDataCiteObject.data.attributes.relatedIdentifiers = 
        [ ...mappedDataCiteObject.data.attributes.relatedIdentifiers, 
          ...metadata.history.flatMap( ({ source, processingStep, additionalDocumentation }) => (
            [ ...(source?.map( ({authority, code}) => (
                {
                  relatedIdentifier: code,
                  relatedIdentifierType: authority,
                  relationType: 'isDerivedFrom',
                })) || []),
              ...(processingStep?.map(({authority, code}) => (
                {
                  relatedIdentifier: code,
                  relatedIdentifierType: authority,
                  relationType: 'IsDocumentedBy',
                })) || []),
              ...(additionalDocumentation?.map(({authority, code}) => (
                {
                  relatedIdentifier: code,
                  relatedIdentifierType: authority,
                  relationType: 'IsDocumentedBy',
                })) || []) ]
          ))]
    }
    // filter out any entries that do not have code and authority set
    // this can happen if only the description is populated for a processing step, for example
    if (mappedDataCiteObject.data.attributes.relatedIdentifiers) {
        mappedDataCiteObject.data.attributes.relatedIdentifiers =
            mappedDataCiteObject.data.attributes.relatedIdentifiers.filter((ident) => (ident.relatedIdentifier && ident.relatedIdentifierType))
    }

    // Generate URL element
    mappedDataCiteObject.data.attributes.url = `${regions[region].catalogueURL[language]}dataset/ca-cioos_${metadata.identifier}`;

    return mappedDataCiteObject;
}

export default recordToDataCite;