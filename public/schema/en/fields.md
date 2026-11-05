# CIOOS Metadata Record

- [1. Property `CIOOS Metadata Record > title`](#title)
  - [1.1. Property `CIOOS Metadata Record > title > en`](#title_en)
  - [1.2. Property `CIOOS Metadata Record > title > fr`](#title_fr)
  - [1.3. Property `CIOOS Metadata Record > title > translations`](#title_translations)
    - [1.3.1. Property `CIOOS Metadata Record > title > translations > en`](#title_translations_en)
      - [1.3.1.1. Property `CIOOS Metadata Record > title > translations > en > verified`](#title_translations_en_verified)
      - [1.3.1.2. Property `CIOOS Metadata Record > title > translations > en > message`](#title_translations_en_message)
    - [1.3.2. Property `CIOOS Metadata Record > title > translations > fr`](#title_translations_fr)
- [2. Property `CIOOS Metadata Record > resourceType`](#resourceType)
  - [2.1. CIOOS Metadata Record > resourceType > resourceType items](#resourceType_items)
- [3. Property `CIOOS Metadata Record > metadataScope`](#metadataScope)
- [4. Property `CIOOS Metadata Record > metadataScopeIso`](#metadataScopeIso)
- [5. Property `CIOOS Metadata Record > datasetIdentifier`](#datasetIdentifier)
  - [5.1. Property `CIOOS Metadata Record > datasetIdentifier > anyOf > item 0`](#datasetIdentifier_anyOf_i0)
  - [5.2. Property `CIOOS Metadata Record > datasetIdentifier > anyOf > item 1`](#datasetIdentifier_anyOf_i1)
- [6. Property `CIOOS Metadata Record > doiCreationStatus`](#doiCreationStatus)
- [7. Property `CIOOS Metadata Record > sharedWith`](#sharedWith)
  - [7.1. Property `CIOOS Metadata Record > sharedWith > additionalProperties`](#sharedWith_additionalProperties)
- [8. Property `CIOOS Metadata Record > abstract`](#abstract)
  - [8.1. Property `CIOOS Metadata Record > title > en`](#title_en)
  - [8.2. Property `CIOOS Metadata Record > title > fr`](#title_fr)
  - [8.3. Property `CIOOS Metadata Record > title > translations`](#title_translations)
    - [8.3.1. Property `CIOOS Metadata Record > title > translations > en`](#title_translations_en)
      - [8.3.1.1. Property `CIOOS Metadata Record > title > translations > en > verified`](#title_translations_en_verified)
      - [8.3.1.2. Property `CIOOS Metadata Record > title > translations > en > message`](#title_translations_en_message)
    - [8.3.2. Property `CIOOS Metadata Record > title > translations > fr`](#title_translations_fr)
- [9. Property `CIOOS Metadata Record > keywords`](#keywords)
  - [9.1. Property `CIOOS Metadata Record > keywords > en`](#keywords_en)
    - [9.1.1. CIOOS Metadata Record > keywords > en > en items](#keywords_en_items)
  - [9.2. Property `CIOOS Metadata Record > keywords > fr`](#keywords_fr)
    - [9.2.1. CIOOS Metadata Record > keywords > fr > fr items](#keywords_fr_items)
- [10. Property `CIOOS Metadata Record > eov`](#eov)
  - [10.1. CIOOS Metadata Record > eov > eov items](#eov_items)
- [11. Property `CIOOS Metadata Record > progress`](#progress)
- [12. Property `CIOOS Metadata Record > language`](#language)
- [13. Property `CIOOS Metadata Record > license`](#license)
- [14. Property `CIOOS Metadata Record > projects`](#projects)
  - [14.1. CIOOS Metadata Record > projects > projects items](#projects_items)
- [15. Property `CIOOS Metadata Record > dateStart`](#dateStart)
- [16. Property `CIOOS Metadata Record > dateEnd`](#dateEnd)
- [17. Property `CIOOS Metadata Record > datePublished`](#datePublished)
- [18. Property `CIOOS Metadata Record > dateRevised`](#dateRevised)
- [19. Property `CIOOS Metadata Record > edition`](#edition)
- [20. Property `CIOOS Metadata Record > limitations`](#limitations)
- [21. Property `CIOOS Metadata Record > map`](#map)
  - [21.1. Property `CIOOS Metadata Record > map > north`](#map_north)
  - [21.2. Property `CIOOS Metadata Record > map > south`](#map_south)
  - [21.3. Property `CIOOS Metadata Record > map > east`](#map_east)
  - [21.4. Property `CIOOS Metadata Record > map > west`](#map_west)
  - [21.5. Property `CIOOS Metadata Record > map > polygon`](#map_polygon)
  - [21.6. Property `CIOOS Metadata Record > map > description`](#map_description)
- [22. Property `CIOOS Metadata Record > verticalExtentMin`](#verticalExtentMin)
- [23. Property `CIOOS Metadata Record > verticalExtentMax`](#verticalExtentMax)
- [24. Property `CIOOS Metadata Record > verticalExtentDirection`](#verticalExtentDirection)
- [25. Property `CIOOS Metadata Record > verticalExtentEPSG`](#verticalExtentEPSG)
- [26. Property `CIOOS Metadata Record > noVerticalExtent`](#noVerticalExtent)
- [27. Property `CIOOS Metadata Record > contacts`](#contacts)
  - [27.1. CIOOS Metadata Record > contacts > contact](#contacts_items)
    - [27.1.1. Property `CIOOS Metadata Record > contacts > contacts items > role`](#contacts_items_role)
      - [27.1.1.1. CIOOS Metadata Record > contacts > contacts items > role > role items](#contacts_items_role_items)
    - [27.1.2. Property `CIOOS Metadata Record > contacts > contacts items > orgName`](#contacts_items_orgName)
    - [27.1.3. Property `CIOOS Metadata Record > contacts > contacts items > orgEmail`](#contacts_items_orgEmail)
      - [27.1.3.1. Property `CIOOS Metadata Record > contacts > contacts items > orgEmail > anyOf > item 0`](#contacts_items_orgEmail_anyOf_i0)
      - [27.1.3.2. Property `CIOOS Metadata Record > contacts > contacts items > orgEmail > anyOf > item 1`](#contacts_items_orgEmail_anyOf_i1)
    - [27.1.4. Property `CIOOS Metadata Record > contacts > contacts items > orgURL`](#contacts_items_orgURL)
      - [27.1.4.1. Property `CIOOS Metadata Record > contacts > contacts items > orgURL > anyOf > item 0`](#contacts_items_orgURL_anyOf_i0)
      - [27.1.4.2. Property `CIOOS Metadata Record > contacts > contacts items > orgURL > anyOf > item 1`](#contacts_items_orgURL_anyOf_i1)
    - [27.1.5. Property `CIOOS Metadata Record > contacts > contacts items > orgAdress`](#contacts_items_orgAdress)
    - [27.1.6. Property `CIOOS Metadata Record > contacts > contacts items > orgCity`](#contacts_items_orgCity)
    - [27.1.7. Property `CIOOS Metadata Record > contacts > contacts items > orgCountry`](#contacts_items_orgCountry)
    - [27.1.8. Property `CIOOS Metadata Record > contacts > contacts items > orgRor`](#contacts_items_orgRor)
    - [27.1.9. Property `CIOOS Metadata Record > contacts > contacts items > indPosition`](#contacts_items_indPosition)
    - [27.1.10. Property `CIOOS Metadata Record > contacts > contacts items > indEmail`](#contacts_items_indEmail)
    - [27.1.11. Property `CIOOS Metadata Record > contacts > contacts items > indOrcid`](#contacts_items_indOrcid)
    - [27.1.12. Property `CIOOS Metadata Record > contacts > contacts items > givenNames`](#contacts_items_givenNames)
    - [27.1.13. Property `CIOOS Metadata Record > contacts > contacts items > lastName`](#contacts_items_lastName)
    - [27.1.14. Property `CIOOS Metadata Record > contacts > contacts items > inCitation`](#contacts_items_inCitation)
    - [27.1.15. Property `CIOOS Metadata Record > contacts > contacts items > contactID`](#contacts_items_contactID)
- [28. Property `CIOOS Metadata Record > distribution`](#distribution)
  - [28.1. CIOOS Metadata Record > distribution > distributionResource](#distribution_items)
    - [28.1.1. Property `CIOOS Metadata Record > distribution > distribution items > url`](#distribution_items_url)
    - [28.1.2. Property `CIOOS Metadata Record > distribution > distribution items > name`](#distribution_items_name)
    - [28.1.3. Property `CIOOS Metadata Record > distribution > distribution items > description`](#distribution_items_description)
- [29. Property `CIOOS Metadata Record > associated_resources`](#associated_resources)
  - [29.1. CIOOS Metadata Record > associated_resources > relatedWork](#associated_resources_items)
    - [29.1.1. Property `CIOOS Metadata Record > associated_resources > associated_resources items > title`](#associated_resources_items_title)
    - [29.1.2. Property `CIOOS Metadata Record > associated_resources > associated_resources items > authority`](#associated_resources_items_authority)
    - [29.1.3. Property `CIOOS Metadata Record > associated_resources > associated_resources items > code`](#associated_resources_items_code)
    - [29.1.4. Property `CIOOS Metadata Record > associated_resources > associated_resources items > association_type`](#associated_resources_items_association_type)
    - [29.1.5. Property `CIOOS Metadata Record > associated_resources > associated_resources items > association_type_iso`](#associated_resources_items_association_type_iso)
- [30. Property `CIOOS Metadata Record > history`](#history)
  - [30.1. CIOOS Metadata Record > history > lineageStep](#history_items)
    - [30.1.1. Property `CIOOS Metadata Record > history > history items > statement`](#history_items_statement)
    - [30.1.2. Property `CIOOS Metadata Record > history > history items > scope`](#history_items_scope)
    - [30.1.3. Property `CIOOS Metadata Record > history > history items > scopeIso`](#history_items_scopeIso)
    - [30.1.4. Property `CIOOS Metadata Record > history > history items > additionalDocumentation`](#history_items_additionalDocumentation)
      - [30.1.4.1. CIOOS Metadata Record > history > history items > additionalDocumentation > lineageDocumentation](#history_items_additionalDocumentation_items)
        - [30.1.4.1.1. Property `CIOOS Metadata Record > history > history items > additionalDocumentation > additionalDocumentation items > title`](#history_items_additionalDocumentation_items_title)
        - [30.1.4.1.2. Property `CIOOS Metadata Record > history > history items > additionalDocumentation > additionalDocumentation items > authority`](#history_items_additionalDocumentation_items_authority)
        - [30.1.4.1.3. Property `CIOOS Metadata Record > history > history items > additionalDocumentation > additionalDocumentation items > code`](#history_items_additionalDocumentation_items_code)
    - [30.1.5. Property `CIOOS Metadata Record > history > history items > source`](#history_items_source)
      - [30.1.5.1. CIOOS Metadata Record > history > history items > source > lineageCitation](#history_items_source_items)
        - [30.1.5.1.1. Property `CIOOS Metadata Record > history > history items > source > source items > title`](#history_items_source_items_title)
        - [30.1.5.1.2. Property `CIOOS Metadata Record > history > history items > source > source items > description`](#history_items_source_items_description)
        - [30.1.5.1.3. Property `CIOOS Metadata Record > history > history items > source > source items > authority`](#history_items_source_items_authority)
        - [30.1.5.1.4. Property `CIOOS Metadata Record > history > history items > source > source items > code`](#history_items_source_items_code)
    - [30.1.6. Property `CIOOS Metadata Record > history > history items > processingStep`](#history_items_processingStep)
      - [30.1.6.1. CIOOS Metadata Record > history > history items > processingStep > lineageCitation](#history_items_processingStep_items)
- [31. Property `CIOOS Metadata Record > platforms`](#platforms)
  - [31.1. CIOOS Metadata Record > platforms > platform](#platforms_items)
    - [31.1.1. Property `CIOOS Metadata Record > platforms > platforms items > type`](#platforms_items_type)
    - [31.1.2. Property `CIOOS Metadata Record > platforms > platforms items > id`](#platforms_items_id)
    - [31.1.3. Property `CIOOS Metadata Record > platforms > platforms items > description`](#platforms_items_description)
    - [31.1.4. Property `CIOOS Metadata Record > platforms > platforms items > platformID`](#platforms_items_platformID)
- [32. Property `CIOOS Metadata Record > instruments`](#instruments)
  - [32.1. CIOOS Metadata Record > instruments > instrument](#instruments_items)
    - [32.1.1. Property `CIOOS Metadata Record > instruments > instruments items > id`](#instruments_items_id)
    - [32.1.2. Property `CIOOS Metadata Record > instruments > instruments items > manufacturer`](#instruments_items_manufacturer)
    - [32.1.3. Property `CIOOS Metadata Record > instruments > instruments items > version`](#instruments_items_version)
    - [32.1.4. Property `CIOOS Metadata Record > instruments > instruments items > type`](#instruments_items_type)
    - [32.1.5. Property `CIOOS Metadata Record > instruments > instruments items > description`](#instruments_items_description)
    - [32.1.6. Property `CIOOS Metadata Record > instruments > instruments items > platform`](#instruments_items_platform)
    - [32.1.7. Property `CIOOS Metadata Record > instruments > instruments items > instrumentID`](#instruments_items_instrumentID)
- [33. Property `CIOOS Metadata Record > noPlatform`](#noPlatform)
- [34. Property `CIOOS Metadata Record > taxa`](#taxa)
  - [34.1. CIOOS Metadata Record > taxa > taxon](#taxa_items)
    - [34.1.1. Property `CIOOS Metadata Record > taxa > taxa items > scientificName`](#taxa_items_scientificName)
    - [34.1.2. Property `CIOOS Metadata Record > taxa > taxa items > canonicalName`](#taxa_items_canonicalName)
    - [34.1.3. Property `CIOOS Metadata Record > taxa > taxa items > rank`](#taxa_items_rank)
    - [34.1.4. Property `CIOOS Metadata Record > taxa > taxa items > kingdom`](#taxa_items_kingdom)
    - [34.1.5. Property `CIOOS Metadata Record > taxa > taxa items > phylum`](#taxa_items_phylum)
    - [34.1.6. Property `CIOOS Metadata Record > taxa > taxa items > class`](#taxa_items_class)
    - [34.1.7. Property `CIOOS Metadata Record > taxa > taxa items > order`](#taxa_items_order)
    - [34.1.8. Property `CIOOS Metadata Record > taxa > taxa items > family`](#taxa_items_family)
    - [34.1.9. Property `CIOOS Metadata Record > taxa > taxa items > genus`](#taxa_items_genus)
    - [34.1.10. Property `CIOOS Metadata Record > taxa > taxa items > species`](#taxa_items_species)
    - [34.1.11. Property `CIOOS Metadata Record > taxa > taxa items > parent`](#taxa_items_parent)
- [35. Property `CIOOS Metadata Record > noTaxa`](#noTaxa)
- [36. Property `CIOOS Metadata Record > identifier`](#identifier)
- [37. Property `CIOOS Metadata Record > recordID`](#recordID)
- [38. Property `CIOOS Metadata Record > userID`](#userID)
- [39. Property `CIOOS Metadata Record > region`](#region)
- [40. Property `CIOOS Metadata Record > status`](#status)
- [41. Property `CIOOS Metadata Record > created`](#created)
- [42. Property `CIOOS Metadata Record > timeFirstPublished`](#timeFirstPublished)
- [43. Property `CIOOS Metadata Record > lastEditedBy`](#lastEditedBy)
  - [43.1. Property `CIOOS Metadata Record > lastEditedBy > displayName`](#lastEditedBy_displayName)
  - [43.2. Property `CIOOS Metadata Record > lastEditedBy > email`](#lastEditedBy_email)
  - [43.3. Property `CIOOS Metadata Record > lastEditedBy > uid`](#lastEditedBy_uid)
- [44. Property `CIOOS Metadata Record > userinfo`](#userinfo)
  - [44.1. Property `CIOOS Metadata Record > userinfo > displayName`](#userinfo_displayName)
  - [44.2. Property `CIOOS Metadata Record > userinfo > email`](#userinfo_email)
- [45. Property `CIOOS Metadata Record > filename`](#filename)
- [46. Property `CIOOS Metadata Record > organization`](#organization)
- [47. Property `CIOOS Metadata Record > comment`](#comment)
- [48. Property `CIOOS Metadata Record > category`](#category)
- [49. Property `CIOOS Metadata Record > schemaVersion`](#schemaVersion)

**Title:** CIOOS Metadata Record

|                           |                  |
| ------------------------- | ---------------- |
| **Type**                  | `object`         |
| **Required**              | No               |
| **Additional properties** | Any type allowed |

**Description:** Structural description of a CIOOS metadata record: types, shapes, and controlled vocabularies. Describes the normalized JavaScript object, not raw Realtime Database JSON — see schema/README.md §1.

| Property                                               | Pattern | Type                                | Deprecated | Definition                         | Title/Description         |
| ------------------------------------------------------ | ------- | ----------------------------------- | ---------- | ---------------------------------- | ------------------------- |
| - [title](#title )                                     | No      | object                              | No         | In #/definitions/bilingualText     | Title                     |
| - [resourceType](#resourceType )                       | No      | array of enum (of string) or string | No         | -                                  | Topic category            |
| - [metadataScope](#metadataScope )                     | No      | enum (of string)                    | No         | -                                  | Resource type             |
| - [metadataScopeIso](#metadataScopeIso )               | No      | enum (of string)                    | No         | -                                  | Resource type (ISO)       |
| - [datasetIdentifier](#datasetIdentifier )             | No      | Combination                         | No         | -                                  | DOI                       |
| - [doiCreationStatus](#doiCreationStatus )             | No      | enum (of string)                    | No         | -                                  | DOI state                 |
| - [sharedWith](#sharedWith )                           | No      | object                              | No         | -                                  | Shared with               |
| - [abstract](#abstract )                               | No      | object                              | No         | In #/definitions/bilingualText     | Abstract                  |
| - [keywords](#keywords )                               | No      | object                              | No         | In #/definitions/bilingualKeywords | Keywords                  |
| - [eov](#eov )                                         | No      | array of enum (of string)           | No         | -                                  | Essential Ocean Variables |
| - [progress](#progress )                               | No      | enum (of string)                    | No         | -                                  | Dataset status            |
| - [language](#language )                               | No      | enum (of string)                    | No         | -                                  | Primary language          |
| - [license](#license )                                 | No      | enum (of string)                    | No         | -                                  | Licence                   |
| - [projects](#projects )                               | No      | array of string                     | No         | -                                  | Projects                  |
| - [dateStart](#dateStart )                             | No      | string or null                      | No         | In #/definitions/isoDateTime       | Start date                |
| - [dateEnd](#dateEnd )                                 | No      | string or null                      | No         | In #/definitions/isoDateTime       | End date                  |
| - [datePublished](#datePublished )                     | No      | string or null                      | No         | In #/definitions/isoDateTime       | Date published            |
| - [dateRevised](#dateRevised )                         | No      | string or null                      | No         | In #/definitions/isoDateTime       | Date revised              |
| - [edition](#edition )                                 | No      | string                              | No         | -                                  | Edition                   |
| - [limitations](#limitations )                         | No      | string                              | No         | -                                  | Limitations               |
| - [map](#map )                                         | No      | object                              | No         | In #/definitions/mapExtent         | Geographic extent         |
| - [verticalExtentMin](#verticalExtentMin )             | No      | string or number                    | No         | -                                  | Vertical extent minimum   |
| - [verticalExtentMax](#verticalExtentMax )             | No      | string or number                    | No         | -                                  | Vertical extent maximum   |
| - [verticalExtentDirection](#verticalExtentDirection ) | No      | enum (of string)                    | No         | -                                  | Vertical extent direction |
| - [verticalExtentEPSG](#verticalExtentEPSG )           | No      | string or number                    | No         | -                                  | Vertical CRS              |
| - [noVerticalExtent](#noVerticalExtent )               | No      | boolean                             | No         | -                                  | No vertical extent        |
| - [contacts](#contacts )                               | No      | array                               | No         | -                                  | Contacts                  |
| - [distribution](#distribution )                       | No      | array                               | No         | -                                  | Resources                 |
| - [associated_resources](#associated_resources )       | No      | array                               | No         | -                                  | Related works             |
| - [history](#history )                                 | No      | array                               | No         | -                                  | Lineage                   |
| - [platforms](#platforms )                             | No      | array                               | No         | -                                  | Platforms                 |
| - [instruments](#instruments )                         | No      | array                               | No         | -                                  | Instruments               |
| - [noPlatform](#noPlatform )                           | No      | boolean                             | No         | -                                  | No platform               |
| - [taxa](#taxa )                                       | No      | array                               | No         | -                                  | Taxonomic coverage        |
| - [noTaxa](#noTaxa )                                   | No      | boolean                             | No         | -                                  | No taxonomic coverage     |
| - [identifier](#identifier )                           | No      | string                              | No         | -                                  | Identifier                |
| - [recordID](#recordID )                               | No      | string                              | No         | -                                  | Record ID                 |
| - [userID](#userID )                                   | No      | string                              | No         | -                                  | User ID                   |
| - [region](#region )                                   | No      | enum (of string)                    | No         | -                                  | Region                    |
| - [status](#status )                                   | No      | enum (of string)                    | No         | -                                  | Status                    |
| - [created](#created )                                 | No      | string                              | No         | -                                  | Created                   |
| - [timeFirstPublished](#timeFirstPublished )           | No      | string                              | No         | -                                  | First published           |
| - [lastEditedBy](#lastEditedBy )                       | No      | object                              | No         | In #/definitions/lastEditedBy      | Last edited by            |
| - [userinfo](#userinfo )                               | No      | object                              | No         | In #/definitions/userinfo          | User info                 |
| - [filename](#filename )                               | No      | string                              | No         | -                                  | Filename                  |
| - [organization](#organization )                       | No      | string                              | No         | -                                  | Organization              |
| - [comment](#comment )                                 | No      | string                              | No         | -                                  | Comment                   |
| - [category](#category )                               | No      | string                              | No         | -                                  | Category (deprecated)     |
| - [schemaVersion](#schemaVersion )                     | No      | string                              | No         | -                                  | Schema version            |
| - [](#additionalProperties )                           | No      | object                              | No         | -                                  | -                         |

## <a name="title"></a>1. Property `CIOOS Metadata Record > title`

**Title:** Title

|                           |                             |
| ------------------------- | --------------------------- |
| **Type**                  | `object`                    |
| **Required**              | No                          |
| **Additional properties** | Any type allowed            |
| **Defined in**            | #/definitions/bilingualText |

**Description:** Dataset title, in both languages.

| Property                               | Pattern | Type   | Deprecated | Definition                    | Title/Description |
| -------------------------------------- | ------- | ------ | ---------- | ----------------------------- | ----------------- |
| - [en](#title_en )                     | No      | string | No         | -                             | -                 |
| - [fr](#title_fr )                     | No      | string | No         | -                             | -                 |
| - [translations](#title_translations ) | No      | object | No         | In #/definitions/translations | -                 |

### <a name="title_en"></a>1.1. Property `CIOOS Metadata Record > title > en`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

### <a name="title_fr"></a>1.2. Property `CIOOS Metadata Record > title > fr`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

### <a name="title_translations"></a>1.3. Property `CIOOS Metadata Record > title > translations`

|                           |                            |
| ------------------------- | -------------------------- |
| **Type**                  | `object`                   |
| **Required**              | No                         |
| **Additional properties** | Not allowed                |
| **Defined in**            | #/definitions/translations |

| Property                        | Pattern | Type   | Deprecated | Definition                             | Title/Description |
| ------------------------------- | ------- | ------ | ---------- | -------------------------------------- | ----------------- |
| - [en](#title_translations_en ) | No      | object | No         | In #/definitions/translationProvenance | -                 |
| - [fr](#title_translations_fr ) | No      | object | No         | Same as [en](#title_translations_en )  | -                 |

#### <a name="title_translations_en"></a>1.3.1. Property `CIOOS Metadata Record > title > translations > en`

|                           |                                     |
| ------------------------- | ----------------------------------- |
| **Type**                  | `object`                            |
| **Required**              | No                                  |
| **Additional properties** | Any type allowed                    |
| **Defined in**            | #/definitions/translationProvenance |

| Property                                       | Pattern | Type    | Deprecated | Definition | Title/Description |
| ---------------------------------------------- | ------- | ------- | ---------- | ---------- | ----------------- |
| + [verified](#title_translations_en_verified ) | No      | boolean | No         | -          | -                 |
| - [message](#title_translations_en_message )   | No      | string  | No         | -          | -                 |

##### <a name="title_translations_en_verified"></a>1.3.1.1. Property `CIOOS Metadata Record > title > translations > en > verified`

|              |           |
| ------------ | --------- |
| **Type**     | `boolean` |
| **Required** | Yes       |

##### <a name="title_translations_en_message"></a>1.3.1.2. Property `CIOOS Metadata Record > title > translations > en > message`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="title_translations_fr"></a>1.3.2. Property `CIOOS Metadata Record > title > translations > fr`

|                           |                              |
| ------------------------- | ---------------------------- |
| **Type**                  | `object`                     |
| **Required**              | No                           |
| **Additional properties** | Any type allowed             |
| **Same definition as**    | [en](#title_translations_en) |

## <a name="resourceType"></a>2. Property `CIOOS Metadata Record > resourceType`

**Title:** Topic category

|              |                                       |
| ------------ | ------------------------------------- |
| **Type**     | `array of enum (of string) or string` |
| **Required** | No                                    |

**Description:** ISO 19115 MD_TopicCategoryCode values. Legacy records may store the pre-ISO names 'oceanographic' and 'biological', or a bare string instead of an array.

|                      | Array restrictions |
| -------------------- | ------------------ |
| **Min items**        | N/A                |
| **Max items**        | N/A                |
| **Items unicity**    | False              |
| **Additional items** | False              |
| **Tuple validation** | See below          |

| Each item of this array must be           | Description |
| ----------------------------------------- | ----------- |
| [resourceType items](#resourceType_items) | -           |

### <a name="resourceType_items"></a>2.1. CIOOS Metadata Record > resourceType > resourceType items

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

Must be one of:
* "oceans"
* "biota"
* "climatologyMeteorologyAtmosphere"
* "environment"
* "society"
* "farming"
* "boundaries"
* "economy"
* "elevation"
* "geoscientificInformation"
* "health"
* "imageryBaseMapsEarthCover"
* "intelligenceMilitary"
* "inlandWaters"
* "location"
* "planningCadastre"
* "structure"
* "transportation"
* "utilitiesCommunication"
* "extraTerrestrial"
* "disaster"
* "other"
* "oceanographic"
* "biological"

## <a name="metadataScope"></a>3. Property `CIOOS Metadata Record > metadataScope`

**Title:** Resource type

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

**Description:** The kind of resource being described, e.g. Dataset or Book.

Must be one of:
* ""
* "Book"
* "Collection"
* "DataCollectionSampling"
* "Dataset"
* "Model"
* "Preprint"
* "Report"
* "Software"
* "Text"
* "Other"

## <a name="metadataScopeIso"></a>4. Property `CIOOS Metadata Record > metadataScopeIso`

**Title:** Resource type (ISO)

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

**Description:** The ISO scope code corresponding to metadataScope.

Must be one of:
* ""
* "document"
* "collection"
* "collectionSession"
* "dataset"
* "model"
* "software"

## <a name="datasetIdentifier"></a>5. Property `CIOOS Metadata Record > datasetIdentifier`

**Title:** DOI

|              |             |
| ------------ | ----------- |
| **Type**     | `combining` |
| **Required** | No          |

**Description:** Digital Object Identifier as a full https://doi.org/ URL. Bare DOIs are rejected — see schema README §11.

| Any of(Option)                        |
| ------------------------------------- |
| [item 0](#datasetIdentifier_anyOf_i0) |
| [item 1](#datasetIdentifier_anyOf_i1) |

### <a name="datasetIdentifier_anyOf_i0"></a>5.1. Property `CIOOS Metadata Record > datasetIdentifier > anyOf > item 0`

|              |         |
| ------------ | ------- |
| **Type**     | `const` |
| **Required** | No      |

Specific value: `""`

### <a name="datasetIdentifier_anyOf_i1"></a>5.2. Property `CIOOS Metadata Record > datasetIdentifier > anyOf > item 1`

|                           |                  |
| ------------------------- | ---------------- |
| **Type**                  | `object`         |
| **Required**              | No               |
| **Additional properties** | Any type allowed |

| Restrictions                      |                                                                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Must match regular expression** | ```^https://doi\.org/10\.\d{4,9}/[-._;()/:A-Za-z0-9]+$``` [Test](https://regex101.com/?regex=%5Ehttps%3A%2F%2Fdoi%5C.org%2F10%5C.%5Cd%7B4%2C9%7D%2F%5B-._%3B%28%29%2F%3AA-Za-z0-9%5D%2B%24) |

## <a name="doiCreationStatus"></a>6. Property `CIOOS Metadata Record > doiCreationStatus`

**Title:** DOI state

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

**Description:** DataCite lifecycle state. Empty when no DOI has been minted.

Must be one of:
* ""
* "draft"
* "registered"
* "findable"

## <a name="sharedWith"></a>7. Property `CIOOS Metadata Record > sharedWith`

**Title:** Shared with

|                           |                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------- |
| **Type**                  | `object`                                                                                |
| **Required**              | No                                                                                      |
| **Additional properties** | [Each additional property must conform to the schema](#sharedWith_additionalProperties) |

**Description:** Map of user IDs this record has been shared with.

| Property                                | Pattern | Type    | Deprecated | Definition | Title/Description |
| --------------------------------------- | ------- | ------- | ---------- | ---------- | ----------------- |
| - [](#sharedWith_additionalProperties ) | No      | boolean | No         | -          | -                 |

### <a name="sharedWith_additionalProperties"></a>7.1. Property `CIOOS Metadata Record > sharedWith > additionalProperties`

|              |           |
| ------------ | --------- |
| **Type**     | `boolean` |
| **Required** | No        |

## <a name="abstract"></a>8. Property `CIOOS Metadata Record > abstract`

**Title:** Abstract

|                           |                             |
| ------------------------- | --------------------------- |
| **Type**                  | `object`                    |
| **Required**              | No                          |
| **Additional properties** | Any type allowed            |
| **Defined in**            | #/definitions/bilingualText |

**Description:** Dataset abstract, in both languages.

| Property                               | Pattern | Type   | Deprecated | Definition                    | Title/Description |
| -------------------------------------- | ------- | ------ | ---------- | ----------------------------- | ----------------- |
| - [en](#title_en )                     | No      | string | No         | -                             | -                 |
| - [fr](#title_fr )                     | No      | string | No         | -                             | -                 |
| - [translations](#title_translations ) | No      | object | No         | In #/definitions/translations | -                 |

### <a name="title_en"></a>8.1. Property `CIOOS Metadata Record > title > en`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

### <a name="title_fr"></a>8.2. Property `CIOOS Metadata Record > title > fr`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

### <a name="title_translations"></a>8.3. Property `CIOOS Metadata Record > title > translations`

|                           |                            |
| ------------------------- | -------------------------- |
| **Type**                  | `object`                   |
| **Required**              | No                         |
| **Additional properties** | Not allowed                |
| **Defined in**            | #/definitions/translations |

| Property                        | Pattern | Type   | Deprecated | Definition                             | Title/Description |
| ------------------------------- | ------- | ------ | ---------- | -------------------------------------- | ----------------- |
| - [en](#title_translations_en ) | No      | object | No         | In #/definitions/translationProvenance | -                 |
| - [fr](#title_translations_fr ) | No      | object | No         | Same as [en](#title_translations_en )  | -                 |

#### <a name="title_translations_en"></a>8.3.1. Property `CIOOS Metadata Record > title > translations > en`

|                           |                                     |
| ------------------------- | ----------------------------------- |
| **Type**                  | `object`                            |
| **Required**              | No                                  |
| **Additional properties** | Any type allowed                    |
| **Defined in**            | #/definitions/translationProvenance |

| Property                                       | Pattern | Type    | Deprecated | Definition | Title/Description |
| ---------------------------------------------- | ------- | ------- | ---------- | ---------- | ----------------- |
| + [verified](#title_translations_en_verified ) | No      | boolean | No         | -          | -                 |
| - [message](#title_translations_en_message )   | No      | string  | No         | -          | -                 |

##### <a name="title_translations_en_verified"></a>8.3.1.1. Property `CIOOS Metadata Record > title > translations > en > verified`

|              |           |
| ------------ | --------- |
| **Type**     | `boolean` |
| **Required** | Yes       |

##### <a name="title_translations_en_message"></a>8.3.1.2. Property `CIOOS Metadata Record > title > translations > en > message`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="title_translations_fr"></a>8.3.2. Property `CIOOS Metadata Record > title > translations > fr`

|                           |                              |
| ------------------------- | ---------------------------- |
| **Type**                  | `object`                     |
| **Required**              | No                           |
| **Additional properties** | Any type allowed             |
| **Same definition as**    | [en](#title_translations_en) |

## <a name="keywords"></a>9. Property `CIOOS Metadata Record > keywords`

**Title:** Keywords

|                           |                                 |
| ------------------------- | ------------------------------- |
| **Type**                  | `object`                        |
| **Required**              | No                              |
| **Additional properties** | Any type allowed                |
| **Defined in**            | #/definitions/bilingualKeywords |

**Description:** Free-text keywords, per language.

| Property              | Pattern | Type            | Deprecated | Definition | Title/Description |
| --------------------- | ------- | --------------- | ---------- | ---------- | ----------------- |
| - [en](#keywords_en ) | No      | array of string | No         | -          | -                 |
| - [fr](#keywords_fr ) | No      | array of string | No         | -          | -                 |

### <a name="keywords_en"></a>9.1. Property `CIOOS Metadata Record > keywords > en`

|              |                   |
| ------------ | ----------------- |
| **Type**     | `array of string` |
| **Required** | No                |

|                      | Array restrictions |
| -------------------- | ------------------ |
| **Min items**        | N/A                |
| **Max items**        | N/A                |
| **Items unicity**    | False              |
| **Additional items** | False              |
| **Tuple validation** | See below          |

| Each item of this array must be | Description |
| ------------------------------- | ----------- |
| [en items](#keywords_en_items)  | -           |

#### <a name="keywords_en_items"></a>9.1.1. CIOOS Metadata Record > keywords > en > en items

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

### <a name="keywords_fr"></a>9.2. Property `CIOOS Metadata Record > keywords > fr`

|              |                   |
| ------------ | ----------------- |
| **Type**     | `array of string` |
| **Required** | No                |

|                      | Array restrictions |
| -------------------- | ------------------ |
| **Min items**        | N/A                |
| **Max items**        | N/A                |
| **Items unicity**    | False              |
| **Additional items** | False              |
| **Tuple validation** | See below          |

| Each item of this array must be | Description |
| ------------------------------- | ----------- |
| [fr items](#keywords_fr_items)  | -           |

#### <a name="keywords_fr_items"></a>9.2.1. CIOOS Metadata Record > keywords > fr > fr items

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

## <a name="eov"></a>10. Property `CIOOS Metadata Record > eov`

**Title:** Essential Ocean Variables

|              |                             |
| ------------ | --------------------------- |
| **Type**     | `array of enum (of string)` |
| **Required** | No                          |

**Description:** GOOS Essential Ocean Variables present in the dataset. Deprecated values remain valid structurally but block submission.

|                      | Array restrictions |
| -------------------- | ------------------ |
| **Min items**        | N/A                |
| **Max items**        | N/A                |
| **Items unicity**    | False              |
| **Additional items** | False              |
| **Tuple validation** | See below          |

| Each item of this array must be | Description |
| ------------------------------- | ----------- |
| [eov items](#eov_items)         | -           |

### <a name="eov_items"></a>10.1. CIOOS Metadata Record > eov > eov items

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

Must be one of:
* "oxygen"
* "nutrients"
* "inorganicCarbon"
* "dissolvedOrganicCarbon"
* "seaSurfaceHeight"
* "seaIce"
* "seaState"
* "seaSurfaceSalinity"
* "seaSurfaceTemperature"
* "subSurfaceSalinity"
* "subSurfaceTemperature"
* "surfaceCurrents"
* "subSurfaceCurrents"
* "other"
* "transientTracers"
* "particulateMatter"
* "nitrousOxide"
* "stableCarbonIsotopes"
* "phytoplanktonBiomassAndDiversity"
* "zooplanktonBiomassAndDiversity"
* "fishAbundanceAndDistribution"
* "marineTurtlesBirdsMammalsAbundanceAndDistribution"
* "seaTurtlesAbundanceAndDistribution"
* "seabirdsAbundanceAndDistribution"
* "marineMammalsAbundanceAndDistribution"
* "hardCoralCoverAndComposition"
* "seagrassCoverAndComposition"
* "macroalgalCanopyCoverAndComposition"
* "invertebrateAbundanceAndDistribution"
* "microbeBiomassAndDiversity"
* "oceanColour"
* "oceanSound"
* "marineDebris"
* "oceanSurfaceHeatFlux"
* "oceanSurfaceStress"
* "oceanBottomPressure"

## <a name="progress"></a>11. Property `CIOOS Metadata Record > progress`

**Title:** Dataset status

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

**Description:** ISO 19115 MD_ProgressCode.

Must be one of:
* ""
* "onGoing"
* "historicalArchive"
* "completed"

## <a name="language"></a>12. Property `CIOOS Metadata Record > language`

**Title:** Primary language

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

**Description:** The dataset's primary language.

Must be one of:
* ""
* "en"
* "fr"

## <a name="license"></a>13. Property `CIOOS Metadata Record > license`

**Title:** Licence

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

**Description:** Licence under which the dataset is released.

Must be one of:
* ""
* "CC-BY-4.0"
* "CC-BY-SA-4.0"
* "CC-BY-ND-4.0"
* "CC-BY-NC-4.0"
* "CC-BY-NC-SA-4.0"
* "CC-BY-NC-ND-4.0"
* "CC0"
* "government-open-license-canada"
* "government-open-license-nova-scotia"
* "OGL-NB"
* "OGL-BC"
* "government-open-license-newfoundland"
* "Apache-2.0"
* "No License"
* "ca-eccc-odl"

## <a name="projects"></a>14. Property `CIOOS Metadata Record > projects`

**Title:** Projects

|              |                   |
| ------------ | ----------------- |
| **Type**     | `array of string` |
| **Required** | No                |

**Description:** Project names, from the region's admin-managed list.

|                      | Array restrictions |
| -------------------- | ------------------ |
| **Min items**        | N/A                |
| **Max items**        | N/A                |
| **Items unicity**    | False              |
| **Additional items** | False              |
| **Tuple validation** | See below          |

| Each item of this array must be   | Description |
| --------------------------------- | ----------- |
| [projects items](#projects_items) | -           |

### <a name="projects_items"></a>14.1. CIOOS Metadata Record > projects > projects items

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

## <a name="dateStart"></a>15. Property `CIOOS Metadata Record > dateStart`

**Title:** Start date

|                |                           |
| -------------- | ------------------------- |
| **Type**       | `string or null`          |
| **Required**   | No                        |
| **Defined in** | #/definitions/isoDateTime |

**Description:** Start of the dataset's temporal extent.

## <a name="dateEnd"></a>16. Property `CIOOS Metadata Record > dateEnd`

**Title:** End date

|                |                           |
| -------------- | ------------------------- |
| **Type**       | `string or null`          |
| **Required**   | No                        |
| **Defined in** | #/definitions/isoDateTime |

**Description:** End of the dataset's temporal extent.

## <a name="datePublished"></a>17. Property `CIOOS Metadata Record > datePublished`

**Title:** Date published

|                |                           |
| -------------- | ------------------------- |
| **Type**       | `string or null`          |
| **Required**   | No                        |
| **Defined in** | #/definitions/isoDateTime |

**Description:** Publication date.

## <a name="dateRevised"></a>18. Property `CIOOS Metadata Record > dateRevised`

**Title:** Date revised

|                |                           |
| -------------- | ------------------------- |
| **Type**       | `string or null`          |
| **Required**   | No                        |
| **Defined in** | #/definitions/isoDateTime |

**Description:** Most recent revision date.

## <a name="edition"></a>19. Property `CIOOS Metadata Record > edition`

**Title:** Edition

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

**Description:** Dataset edition or version label.

## <a name="limitations"></a>20. Property `CIOOS Metadata Record > limitations`

**Title:** Limitations

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

**Description:** Limitations on use, beyond the licence.

## <a name="map"></a>21. Property `CIOOS Metadata Record > map`

**Title:** Geographic extent

|                           |                         |
| ------------------------- | ----------------------- |
| **Type**                  | `object`                |
| **Required**              | No                      |
| **Additional properties** | Any type allowed        |
| **Defined in**            | #/definitions/mapExtent |

**Description:** A bounding box, a polygon, or a text description. Which of those is sufficient depends on the topic category — see the conditional requirements page.

| Property                           | Pattern | Type             | Deprecated | Definition                     | Title/Description                                                                                           |
| ---------------------------------- | ------- | ---------------- | ---------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| - [north](#map_north )             | No      | string or number | No         | In #/definitions/numericString | A number stored as a string, or "" when unset. Bbox and vertical extent values are strings in the database. |
| - [south](#map_south )             | No      | string or number | No         | Same as [north](#map_north )   | A number stored as a string, or "" when unset. Bbox and vertical extent values are strings in the database. |
| - [east](#map_east )               | No      | string or number | No         | Same as [north](#map_north )   | A number stored as a string, or "" when unset. Bbox and vertical extent values are strings in the database. |
| - [west](#map_west )               | No      | string or number | No         | Same as [north](#map_north )   | A number stored as a string, or "" when unset. Bbox and vertical extent values are strings in the database. |
| - [polygon](#map_polygon )         | No      | string           | No         | -                              | Space-separated "lat,lon" pairs; at least two points, and the first pair must equal the last.               |
| - [description](#map_description ) | No      | object           | No         | Same as [title](#title )       | Free text in English and French, with translation provenance.                                               |

### <a name="map_north"></a>21.1. Property `CIOOS Metadata Record > map > north`

|                |                             |
| -------------- | --------------------------- |
| **Type**       | `string or number`          |
| **Required**   | No                          |
| **Defined in** | #/definitions/numericString |

**Description:** A number stored as a string, or "" when unset. Bbox and vertical extent values are strings in the database.

| Restrictions                      |                                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Must match regular expression** | ```^(-?\d+(\.\d+)?)?$``` [Test](https://regex101.com/?regex=%5E%28-%3F%5Cd%2B%28%5C.%5Cd%2B%29%3F%29%3F%24) |

### <a name="map_south"></a>21.2. Property `CIOOS Metadata Record > map > south`

|                        |                     |
| ---------------------- | ------------------- |
| **Type**               | `string or number`  |
| **Required**           | No                  |
| **Same definition as** | [north](#map_north) |

**Description:** A number stored as a string, or "" when unset. Bbox and vertical extent values are strings in the database.

### <a name="map_east"></a>21.3. Property `CIOOS Metadata Record > map > east`

|                        |                     |
| ---------------------- | ------------------- |
| **Type**               | `string or number`  |
| **Required**           | No                  |
| **Same definition as** | [north](#map_north) |

**Description:** A number stored as a string, or "" when unset. Bbox and vertical extent values are strings in the database.

### <a name="map_west"></a>21.4. Property `CIOOS Metadata Record > map > west`

|                        |                     |
| ---------------------- | ------------------- |
| **Type**               | `string or number`  |
| **Required**           | No                  |
| **Same definition as** | [north](#map_north) |

**Description:** A number stored as a string, or "" when unset. Bbox and vertical extent values are strings in the database.

### <a name="map_polygon"></a>21.5. Property `CIOOS Metadata Record > map > polygon`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

**Description:** Space-separated "lat,lon" pairs; at least two points, and the first pair must equal the last.

### <a name="map_description"></a>21.6. Property `CIOOS Metadata Record > map > description`

|                           |                  |
| ------------------------- | ---------------- |
| **Type**                  | `object`         |
| **Required**              | No               |
| **Additional properties** | Any type allowed |
| **Same definition as**    | [title](#title)  |

**Description:** Free text in English and French, with translation provenance.

## <a name="verticalExtentMin"></a>22. Property `CIOOS Metadata Record > verticalExtentMin`

**Title:** Vertical extent minimum

|              |                    |
| ------------ | ------------------ |
| **Type**     | `string or number` |
| **Required** | No                 |

**Description:** Shallowest depth or lowest height.

## <a name="verticalExtentMax"></a>23. Property `CIOOS Metadata Record > verticalExtentMax`

**Title:** Vertical extent maximum

|              |                    |
| ------------ | ------------------ |
| **Type**     | `string or number` |
| **Required** | No                 |

**Description:** Deepest depth or greatest height.

## <a name="verticalExtentDirection"></a>24. Property `CIOOS Metadata Record > verticalExtentDirection`

**Title:** Vertical extent direction

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

**Description:** Whether the values are positive downward (depth) or upward (height).

Must be one of:
* ""
* "heightPositive"
* "depthPositive"

## <a name="verticalExtentEPSG"></a>25. Property `CIOOS Metadata Record > verticalExtentEPSG`

**Title:** Vertical CRS

|              |                    |
| ------------ | ------------------ |
| **Type**     | `string or number` |
| **Required** | No                 |

**Description:** EPSG code for the vertical coordinate reference system.

## <a name="noVerticalExtent"></a>26. Property `CIOOS Metadata Record > noVerticalExtent`

**Title:** No vertical extent

|              |           |
| ------------ | --------- |
| **Type**     | `boolean` |
| **Required** | No        |

**Description:** Set when the dataset has no meaningful vertical extent; waives the three fields above.

## <a name="contacts"></a>27. Property `CIOOS Metadata Record > contacts`

**Title:** Contacts

|              |         |
| ------------ | ------- |
| **Type**     | `array` |
| **Required** | No      |

**Description:** People and organizations associated with the dataset. Every contact needs a role and a name; at least one must be a Metadata Custodian, at least one a Data Owner, and at least one must appear in the citation.

|                      | Array restrictions |
| -------------------- | ------------------ |
| **Min items**        | N/A                |
| **Max items**        | N/A                |
| **Items unicity**    | False              |
| **Additional items** | False              |
| **Tuple validation** | See below          |

| Each item of this array must be | Description |
| ------------------------------- | ----------- |
| [contact](#contacts_items)      | -           |

### <a name="contacts_items"></a>27.1. CIOOS Metadata Record > contacts > contact

|                           |                       |
| ------------------------- | --------------------- |
| **Type**                  | `object`              |
| **Required**              | No                    |
| **Additional properties** | Any type allowed      |
| **Defined in**            | #/definitions/contact |

| Property                                      | Pattern | Type                      | Deprecated | Definition                                    | Title/Description             |
| --------------------------------------------- | ------- | ------------------------- | ---------- | --------------------------------------------- | ----------------------------- |
| - [role](#contacts_items_role )               | No      | array of enum (of string) | No         | -                                             | ISO 19115 CI_RoleCode values. |
| - [orgName](#contacts_items_orgName )         | No      | string                    | No         | -                                             | -                             |
| - [orgEmail](#contacts_items_orgEmail )       | No      | string                    | No         | In #/definitions/emailOrEmpty                 | -                             |
| - [orgURL](#contacts_items_orgURL )           | No      | string                    | No         | In #/definitions/uriOrEmpty                   | -                             |
| - [orgAdress](#contacts_items_orgAdress )     | No      | string                    | No         | -                                             | -                             |
| - [orgCity](#contacts_items_orgCity )         | No      | string                    | No         | -                                             | -                             |
| - [orgCountry](#contacts_items_orgCountry )   | No      | string                    | No         | -                                             | -                             |
| - [orgRor](#contacts_items_orgRor )           | No      | string                    | No         | -                                             | -                             |
| - [indPosition](#contacts_items_indPosition ) | No      | string                    | No         | -                                             | -                             |
| - [indEmail](#contacts_items_indEmail )       | No      | string                    | No         | Same as [orgEmail](#contacts_items_orgEmail ) | -                             |
| - [indOrcid](#contacts_items_indOrcid )       | No      | string                    | No         | -                                             | -                             |
| - [givenNames](#contacts_items_givenNames )   | No      | string                    | No         | -                                             | -                             |
| - [lastName](#contacts_items_lastName )       | No      | string                    | No         | -                                             | -                             |
| - [inCitation](#contacts_items_inCitation )   | No      | boolean                   | No         | -                                             | -                             |
| - [contactID](#contacts_items_contactID )     | No      | string                    | No         | -                                             | -                             |

#### <a name="contacts_items_role"></a>27.1.1. Property `CIOOS Metadata Record > contacts > contacts items > role`

|              |                             |
| ------------ | --------------------------- |
| **Type**     | `array of enum (of string)` |
| **Required** | No                          |

**Description:** ISO 19115 CI_RoleCode values.

|                      | Array restrictions |
| -------------------- | ------------------ |
| **Min items**        | N/A                |
| **Max items**        | N/A                |
| **Items unicity**    | False              |
| **Additional items** | False              |
| **Tuple validation** | See below          |

| Each item of this array must be          | Description |
| ---------------------------------------- | ----------- |
| [role items](#contacts_items_role_items) | -           |

##### <a name="contacts_items_role_items"></a>27.1.1.1. CIOOS Metadata Record > contacts > contacts items > role > role items

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

Must be one of:
* "custodian"
* "owner"
* "distributor"
* "author"
* "coAuthor"
* "collaborator"
* "contributor"
* "editor"
* "funder"
* "mediator"
* "originator"
* "pointOfContact"
* "principalInvestigator"
* "processor"
* "publisher"
* "resourceProvider"
* "rightsHolder"
* "sponsor"
* "stakeholder"

#### <a name="contacts_items_orgName"></a>27.1.2. Property `CIOOS Metadata Record > contacts > contacts items > orgName`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="contacts_items_orgEmail"></a>27.1.3. Property `CIOOS Metadata Record > contacts > contacts items > orgEmail`

|                |                            |
| -------------- | -------------------------- |
| **Type**       | `combining`                |
| **Required**   | No                         |
| **Defined in** | #/definitions/emailOrEmpty |

| Any of(Option)                              |
| ------------------------------------------- |
| [item 0](#contacts_items_orgEmail_anyOf_i0) |
| [item 1](#contacts_items_orgEmail_anyOf_i1) |

##### <a name="contacts_items_orgEmail_anyOf_i0"></a>27.1.3.1. Property `CIOOS Metadata Record > contacts > contacts items > orgEmail > anyOf > item 0`

|              |         |
| ------------ | ------- |
| **Type**     | `const` |
| **Required** | No      |

Specific value: `""`

##### <a name="contacts_items_orgEmail_anyOf_i1"></a>27.1.3.2. Property `CIOOS Metadata Record > contacts > contacts items > orgEmail > anyOf > item 1`

|                           |                  |
| ------------------------- | ---------------- |
| **Type**                  | `object`         |
| **Required**              | No               |
| **Format**                | `email`          |
| **Additional properties** | Any type allowed |

#### <a name="contacts_items_orgURL"></a>27.1.4. Property `CIOOS Metadata Record > contacts > contacts items > orgURL`

|                |                          |
| -------------- | ------------------------ |
| **Type**       | `combining`              |
| **Required**   | No                       |
| **Defined in** | #/definitions/uriOrEmpty |

| Any of(Option)                            |
| ----------------------------------------- |
| [item 0](#contacts_items_orgURL_anyOf_i0) |
| [item 1](#contacts_items_orgURL_anyOf_i1) |

##### <a name="contacts_items_orgURL_anyOf_i0"></a>27.1.4.1. Property `CIOOS Metadata Record > contacts > contacts items > orgURL > anyOf > item 0`

|              |         |
| ------------ | ------- |
| **Type**     | `const` |
| **Required** | No      |

Specific value: `""`

##### <a name="contacts_items_orgURL_anyOf_i1"></a>27.1.4.2. Property `CIOOS Metadata Record > contacts > contacts items > orgURL > anyOf > item 1`

|                           |                  |
| ------------------------- | ---------------- |
| **Type**                  | `object`         |
| **Required**              | No               |
| **Format**                | `uri`            |
| **Additional properties** | Any type allowed |

#### <a name="contacts_items_orgAdress"></a>27.1.5. Property `CIOOS Metadata Record > contacts > contacts items > orgAdress`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="contacts_items_orgCity"></a>27.1.6. Property `CIOOS Metadata Record > contacts > contacts items > orgCity`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="contacts_items_orgCountry"></a>27.1.7. Property `CIOOS Metadata Record > contacts > contacts items > orgCountry`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="contacts_items_orgRor"></a>27.1.8. Property `CIOOS Metadata Record > contacts > contacts items > orgRor`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="contacts_items_indPosition"></a>27.1.9. Property `CIOOS Metadata Record > contacts > contacts items > indPosition`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="contacts_items_indEmail"></a>27.1.10. Property `CIOOS Metadata Record > contacts > contacts items > indEmail`

|                        |                                      |
| ---------------------- | ------------------------------------ |
| **Type**               | `combining`                          |
| **Required**           | No                                   |
| **Same definition as** | [orgEmail](#contacts_items_orgEmail) |

#### <a name="contacts_items_indOrcid"></a>27.1.11. Property `CIOOS Metadata Record > contacts > contacts items > indOrcid`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="contacts_items_givenNames"></a>27.1.12. Property `CIOOS Metadata Record > contacts > contacts items > givenNames`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="contacts_items_lastName"></a>27.1.13. Property `CIOOS Metadata Record > contacts > contacts items > lastName`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="contacts_items_inCitation"></a>27.1.14. Property `CIOOS Metadata Record > contacts > contacts items > inCitation`

|              |           |
| ------------ | --------- |
| **Type**     | `boolean` |
| **Required** | No        |

#### <a name="contacts_items_contactID"></a>27.1.15. Property `CIOOS Metadata Record > contacts > contacts items > contactID`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

## <a name="distribution"></a>28. Property `CIOOS Metadata Record > distribution`

**Title:** Resources

|              |         |
| ------------ | ------- |
| **Type**     | `array` |
| **Required** | No      |

**Description:** Links to the data itself and to supporting material. At least one resource with a name and a valid URL is required to submit.

|                      | Array restrictions |
| -------------------- | ------------------ |
| **Min items**        | N/A                |
| **Max items**        | N/A                |
| **Items unicity**    | False              |
| **Additional items** | False              |
| **Tuple validation** | See below          |

| Each item of this array must be             | Description |
| ------------------------------------------- | ----------- |
| [distributionResource](#distribution_items) | -           |

### <a name="distribution_items"></a>28.1. CIOOS Metadata Record > distribution > distributionResource

|                           |                                    |
| ------------------------- | ---------------------------------- |
| **Type**                  | `object`                           |
| **Required**              | No                                 |
| **Additional properties** | Any type allowed                   |
| **Defined in**            | #/definitions/distributionResource |

| Property                                          | Pattern | Type   | Deprecated | Definition                                | Title/Description                                             |
| ------------------------------------------------- | ------- | ------ | ---------- | ----------------------------------------- | ------------------------------------------------------------- |
| - [url](#distribution_items_url )                 | No      | string | No         | Same as [orgURL](#contacts_items_orgURL ) | -                                                             |
| - [name](#distribution_items_name )               | No      | string | No         | -                                         | -                                                             |
| - [description](#distribution_items_description ) | No      | object | No         | Same as [title](#title )                  | Free text in English and French, with translation provenance. |

#### <a name="distribution_items_url"></a>28.1.1. Property `CIOOS Metadata Record > distribution > distribution items > url`

|                        |                                  |
| ---------------------- | -------------------------------- |
| **Type**               | `combining`                      |
| **Required**           | No                               |
| **Same definition as** | [orgURL](#contacts_items_orgURL) |

#### <a name="distribution_items_name"></a>28.1.2. Property `CIOOS Metadata Record > distribution > distribution items > name`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="distribution_items_description"></a>28.1.3. Property `CIOOS Metadata Record > distribution > distribution items > description`

|                           |                  |
| ------------------------- | ---------------- |
| **Type**                  | `object`         |
| **Required**              | No               |
| **Additional properties** | Any type allowed |
| **Same definition as**    | [title](#title)  |

**Description:** Free text in English and French, with translation provenance.

## <a name="associated_resources"></a>29. Property `CIOOS Metadata Record > associated_resources`

**Title:** Related works

|              |         |
| ------------ | ------- |
| **Type**     | `array` |
| **Required** | No      |

**Description:** Other works related to this dataset. Each needs a bilingual title, an identifier, an identifier type, and a relation type.

|                      | Array restrictions |
| -------------------- | ------------------ |
| **Min items**        | N/A                |
| **Max items**        | N/A                |
| **Items unicity**    | False              |
| **Additional items** | False              |
| **Tuple validation** | See below          |

| Each item of this array must be            | Description |
| ------------------------------------------ | ----------- |
| [relatedWork](#associated_resources_items) | -           |

### <a name="associated_resources_items"></a>29.1. CIOOS Metadata Record > associated_resources > relatedWork

|                           |                           |
| ------------------------- | ------------------------- |
| **Type**                  | `object`                  |
| **Required**              | No                        |
| **Additional properties** | Any type allowed          |
| **Defined in**            | #/definitions/relatedWork |

| Property                                                                    | Pattern | Type             | Deprecated | Definition               | Title/Description                                             |
| --------------------------------------------------------------------------- | ------- | ---------------- | ---------- | ------------------------ | ------------------------------------------------------------- |
| - [title](#associated_resources_items_title )                               | No      | object           | No         | Same as [title](#title ) | Free text in English and French, with translation provenance. |
| - [authority](#associated_resources_items_authority )                       | No      | enum (of string) | No         | -                        | -                                                             |
| - [code](#associated_resources_items_code )                                 | No      | string           | No         | -                        | -                                                             |
| - [association_type](#associated_resources_items_association_type )         | No      | enum (of string) | No         | -                        | -                                                             |
| - [association_type_iso](#associated_resources_items_association_type_iso ) | No      | string           | No         | -                        | -                                                             |

#### <a name="associated_resources_items_title"></a>29.1.1. Property `CIOOS Metadata Record > associated_resources > associated_resources items > title`

|                           |                  |
| ------------------------- | ---------------- |
| **Type**                  | `object`         |
| **Required**              | No               |
| **Additional properties** | Any type allowed |
| **Same definition as**    | [title](#title)  |

**Description:** Free text in English and French, with translation provenance.

#### <a name="associated_resources_items_authority"></a>29.1.2. Property `CIOOS Metadata Record > associated_resources > associated_resources items > authority`

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

Must be one of:
* "ARK"
* "arXiv"
* "bibcode"
* "ca.cioos"
* "DOI"
* "EAN13"
* "EISSN"
* "Handle"
* "IGSN"
* "ISBN"
* "ISSN"
* "ISTC"
* "LISSN"
* "LSID"
* "PMID"
* "PURL"
* "UPC"
* "URL"
* "URN"
* "w3id"

#### <a name="associated_resources_items_code"></a>29.1.3. Property `CIOOS Metadata Record > associated_resources > associated_resources items > code`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="associated_resources_items_association_type"></a>29.1.4. Property `CIOOS Metadata Record > associated_resources > associated_resources items > association_type`

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

Must be one of:
* "IsCitedBy"
* "Cites"
* "IsSupplementTo"
* "IsSupplementedBy"
* "IsContinuedBy"
* "Continues"
* "IsDescribedBy"
* "Describes"
* "HasMetadata"
* "IsMetadataFor"
* "HasVersion"
* "IsVersionOf"
* "IsNewVersionOf"
* "PreviousVersionOf"
* "IsPartOf"
* "HasPart"
* "IsPublishedIn"
* "IsReferencedBy"
* "References"
* "IsDocumentedBy"
* "Documents"
* "IsCompiledBy"
* "Compiles"
* "IsVariantFormOf"
* "IsOriginalFormOf"
* "IsIdenticalTo"
* "IsReviewedBy"
* "Reviews"
* "IsDerivedFrom"
* "IsSourceOf"
* "Requires"
* "IsRequiredBy"
* "IsObsoletedBy"
* "Obsoletes"

#### <a name="associated_resources_items_association_type_iso"></a>29.1.5. Property `CIOOS Metadata Record > associated_resources > associated_resources items > association_type_iso`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

## <a name="history"></a>30. Property `CIOOS Metadata Record > history`

**Title:** Lineage

|              |         |
| ------------ | ------- |
| **Type**     | `array` |
| **Required** | No      |

**Description:** How the data came to be. Each processing step and source needs a title and description; a step scoped to data collection also needs a bilingual statement.

|                      | Array restrictions |
| -------------------- | ------------------ |
| **Min items**        | N/A                |
| **Max items**        | N/A                |
| **Items unicity**    | False              |
| **Additional items** | False              |
| **Tuple validation** | See below          |

| Each item of this array must be | Description |
| ------------------------------- | ----------- |
| [lineageStep](#history_items)   | -           |

### <a name="history_items"></a>30.1. CIOOS Metadata Record > history > lineageStep

|                           |                           |
| ------------------------- | ------------------------- |
| **Type**                  | `object`                  |
| **Required**              | No                        |
| **Additional properties** | Any type allowed          |
| **Defined in**            | #/definitions/lineageStep |

| Property                                                             | Pattern | Type             | Deprecated | Definition               | Title/Description                                                         |
| -------------------------------------------------------------------- | ------- | ---------------- | ---------- | ------------------------ | ------------------------------------------------------------------------- |
| - [statement](#history_items_statement )                             | No      | object           | No         | Same as [title](#title ) | Free text in English and French, with translation provenance.             |
| - [scope](#history_items_scope )                                     | No      | enum (of string) | No         | -                        | A metadataScopeCodes KEY (e.g. DataCollectionSampling), not an ISO value. |
| - [scopeIso](#history_items_scopeIso )                               | No      | enum (of string) | No         | -                        | The ISO value corresponding to \`scope\`.                                 |
| - [additionalDocumentation](#history_items_additionalDocumentation ) | No      | array            | No         | -                        | -                                                                         |
| - [source](#history_items_source )                                   | No      | array            | No         | -                        | -                                                                         |
| - [processingStep](#history_items_processingStep )                   | No      | array            | No         | -                        | -                                                                         |

#### <a name="history_items_statement"></a>30.1.1. Property `CIOOS Metadata Record > history > history items > statement`

|                           |                  |
| ------------------------- | ---------------- |
| **Type**                  | `object`         |
| **Required**              | No               |
| **Additional properties** | Any type allowed |
| **Same definition as**    | [title](#title)  |

**Description:** Free text in English and French, with translation provenance.

#### <a name="history_items_scope"></a>30.1.2. Property `CIOOS Metadata Record > history > history items > scope`

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

**Description:** A metadataScopeCodes KEY (e.g. DataCollectionSampling), not an ISO value.

Must be one of:
* ""
* "Book"
* "Collection"
* "DataCollectionSampling"
* "Dataset"
* "Model"
* "Preprint"
* "Report"
* "Software"
* "Text"
* "Other"

#### <a name="history_items_scopeIso"></a>30.1.3. Property `CIOOS Metadata Record > history > history items > scopeIso`

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

**Description:** The ISO value corresponding to `scope`.

Must be one of:
* ""
* "document"
* "collection"
* "collectionSession"
* "dataset"
* "model"
* "software"

#### <a name="history_items_additionalDocumentation"></a>30.1.4. Property `CIOOS Metadata Record > history > history items > additionalDocumentation`

|              |         |
| ------------ | ------- |
| **Type**     | `array` |
| **Required** | No      |

|                      | Array restrictions |
| -------------------- | ------------------ |
| **Min items**        | N/A                |
| **Max items**        | N/A                |
| **Items unicity**    | False              |
| **Additional items** | False              |
| **Tuple validation** | See below          |

| Each item of this array must be                                      | Description |
| -------------------------------------------------------------------- | ----------- |
| [lineageDocumentation](#history_items_additionalDocumentation_items) | -           |

##### <a name="history_items_additionalDocumentation_items"></a>30.1.4.1. CIOOS Metadata Record > history > history items > additionalDocumentation > lineageDocumentation

|                           |                                    |
| ------------------------- | ---------------------------------- |
| **Type**                  | `object`                           |
| **Required**              | No                                 |
| **Additional properties** | Any type allowed                   |
| **Defined in**            | #/definitions/lineageDocumentation |

| Property                                                               | Pattern | Type   | Deprecated | Definition | Title/Description |
| ---------------------------------------------------------------------- | ------- | ------ | ---------- | ---------- | ----------------- |
| - [title](#history_items_additionalDocumentation_items_title )         | No      | string | No         | -          | -                 |
| - [authority](#history_items_additionalDocumentation_items_authority ) | No      | string | No         | -          | -                 |
| - [code](#history_items_additionalDocumentation_items_code )           | No      | string | No         | -          | -                 |

###### <a name="history_items_additionalDocumentation_items_title"></a>30.1.4.1.1. Property `CIOOS Metadata Record > history > history items > additionalDocumentation > additionalDocumentation items > title`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

###### <a name="history_items_additionalDocumentation_items_authority"></a>30.1.4.1.2. Property `CIOOS Metadata Record > history > history items > additionalDocumentation > additionalDocumentation items > authority`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

###### <a name="history_items_additionalDocumentation_items_code"></a>30.1.4.1.3. Property `CIOOS Metadata Record > history > history items > additionalDocumentation > additionalDocumentation items > code`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="history_items_source"></a>30.1.5. Property `CIOOS Metadata Record > history > history items > source`

|              |         |
| ------------ | ------- |
| **Type**     | `array` |
| **Required** | No      |

|                      | Array restrictions |
| -------------------- | ------------------ |
| **Min items**        | N/A                |
| **Max items**        | N/A                |
| **Items unicity**    | False              |
| **Additional items** | False              |
| **Tuple validation** | See below          |

| Each item of this array must be                | Description |
| ---------------------------------------------- | ----------- |
| [lineageCitation](#history_items_source_items) | -           |

##### <a name="history_items_source_items"></a>30.1.5.1. CIOOS Metadata Record > history > history items > source > lineageCitation

|                           |                               |
| ------------------------- | ----------------------------- |
| **Type**                  | `object`                      |
| **Required**              | No                            |
| **Additional properties** | Any type allowed              |
| **Defined in**            | #/definitions/lineageCitation |

| Property                                                  | Pattern | Type   | Deprecated | Definition | Title/Description |
| --------------------------------------------------------- | ------- | ------ | ---------- | ---------- | ----------------- |
| - [title](#history_items_source_items_title )             | No      | string | No         | -          | -                 |
| - [description](#history_items_source_items_description ) | No      | string | No         | -          | -                 |
| - [authority](#history_items_source_items_authority )     | No      | string | No         | -          | -                 |
| - [code](#history_items_source_items_code )               | No      | string | No         | -          | -                 |

###### <a name="history_items_source_items_title"></a>30.1.5.1.1. Property `CIOOS Metadata Record > history > history items > source > source items > title`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

###### <a name="history_items_source_items_description"></a>30.1.5.1.2. Property `CIOOS Metadata Record > history > history items > source > source items > description`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

###### <a name="history_items_source_items_authority"></a>30.1.5.1.3. Property `CIOOS Metadata Record > history > history items > source > source items > authority`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

###### <a name="history_items_source_items_code"></a>30.1.5.1.4. Property `CIOOS Metadata Record > history > history items > source > source items > code`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="history_items_processingStep"></a>30.1.6. Property `CIOOS Metadata Record > history > history items > processingStep`

|              |         |
| ------------ | ------- |
| **Type**     | `array` |
| **Required** | No      |

|                      | Array restrictions |
| -------------------- | ------------------ |
| **Min items**        | N/A                |
| **Max items**        | N/A                |
| **Items unicity**    | False              |
| **Additional items** | False              |
| **Tuple validation** | See below          |

| Each item of this array must be                        | Description |
| ------------------------------------------------------ | ----------- |
| [lineageCitation](#history_items_processingStep_items) | -           |

##### <a name="history_items_processingStep_items"></a>30.1.6.1. CIOOS Metadata Record > history > history items > processingStep > lineageCitation

|                           |                                                           |
| ------------------------- | --------------------------------------------------------- |
| **Type**                  | `object`                                                  |
| **Required**              | No                                                        |
| **Additional properties** | Any type allowed                                          |
| **Same definition as**    | [history_items_source_items](#history_items_source_items) |

## <a name="platforms"></a>31. Property `CIOOS Metadata Record > platforms`

**Title:** Platforms

|              |         |
| ------------ | ------- |
| **Type**     | `array` |
| **Required** | No      |

**Description:** Platforms the data was collected from. Each needs a type and an ID, unless the dataset has no platform or is a model.

|                      | Array restrictions |
| -------------------- | ------------------ |
| **Min items**        | N/A                |
| **Max items**        | N/A                |
| **Items unicity**    | False              |
| **Additional items** | False              |
| **Tuple validation** | See below          |

| Each item of this array must be | Description |
| ------------------------------- | ----------- |
| [platform](#platforms_items)    | -           |

### <a name="platforms_items"></a>31.1. CIOOS Metadata Record > platforms > platform

|                           |                        |
| ------------------------- | ---------------------- |
| **Type**                  | `object`               |
| **Required**              | No                     |
| **Additional properties** | Any type allowed       |
| **Defined in**            | #/definitions/platform |

| Property                                       | Pattern | Type             | Deprecated | Definition               | Title/Description                                                 |
| ---------------------------------------------- | ------- | ---------------- | ---------- | ------------------------ | ----------------------------------------------------------------- |
| - [type](#platforms_items_type )               | No      | enum (of string) | No         | -                        | SeaVoX Platform Category (NERC L06). Stored as the English label. |
| - [id](#platforms_items_id )                   | No      | string           | No         | -                        | -                                                                 |
| - [description](#platforms_items_description ) | No      | object           | No         | Same as [title](#title ) | Free text in English and French, with translation provenance.     |
| - [platformID](#platforms_items_platformID )   | No      | string           | No         | -                        | -                                                                 |

#### <a name="platforms_items_type"></a>31.1.1. Property `CIOOS Metadata Record > platforms > platforms items > type`

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

**Description:** SeaVoX Platform Category (NERC L06). Stored as the English label.

Must be one of:
* ""
* "ice island"
* "parachute"
* "glider"
* "DUKW"
* "man-powered boat"
* "land/onshore vehicle"
* "beach/intertidal zone structure"
* "mesocosm bag"
* "vessel at fixed position"
* "coastal structure"
* "fishing vessel"
* "ship"
* "fish"
* "tethered balloon"
* "unknown"
* "seabird and duck"
* "vessel of opportunity"
* "diver"
* "amphibious vehicle"
* "fixed benthic node"
* "organism"
* "pack ice"
* "free-rising balloon"
* "drillship"
* "autonomous surface water vehicle"
* "surface ice buoy"
* "surface vessel"
* "drifting manned submersible"
* "fixed subsurface vertical profiler"
* "satellite"
* "lowered unmanned submersible"
* "float"
* "submersible"
* "manned spacecraft"
* "moored surface buoy"
* "geostationary orbiting satellite"
* "propelled unmanned submersible"
* "subsurface mooring"
* "aeroplane"
* "non-buoyant aircraft"
* "cryosphere"
* "Ice-tethered subsurface profiling float"
* "unmanned aerial vehicle"
* "kite"
* "naval vessel"
* "land/onshore structure"
* "sea bed vehicle"
* "spacecraft"
* "river station"
* "vessel of opportunity on fixed route"
* "offshore structure"
* "self-propelled boat"
* "free-floating balloon"
* "research vessel"
* "land-sea mammals"
* "amphibious crawler"
* "airship"
* "cetacean"
* "self-propelled small boat"
* "drift ice"
* "land or seafloor"
* "flightless bird"
* "ice shelf"
* "buoyant aircraft"
* "human"
* "man-powered small boat"
* "surface gliders"
* "hovercraft"
* "sub-surface gliders"
* "drifting subsurface profiling float"
* "towed unmanned submersible"
* "autogyro"
* "mooring"
* "helicopter"
* "autonomous underwater vehicle"
* "drifting surface float"
* "orbiting satellite"
* "drifting subsurface float"
* "rocket"
* "propelled manned submersible"
* "research aeroplane"

#### <a name="platforms_items_id"></a>31.1.2. Property `CIOOS Metadata Record > platforms > platforms items > id`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="platforms_items_description"></a>31.1.3. Property `CIOOS Metadata Record > platforms > platforms items > description`

|                           |                  |
| ------------------------- | ---------------- |
| **Type**                  | `object`         |
| **Required**              | No               |
| **Additional properties** | Any type allowed |
| **Same definition as**    | [title](#title)  |

**Description:** Free text in English and French, with translation provenance.

#### <a name="platforms_items_platformID"></a>31.1.4. Property `CIOOS Metadata Record > platforms > platforms items > platformID`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

## <a name="instruments"></a>32. Property `CIOOS Metadata Record > instruments`

**Title:** Instruments

|              |         |
| ------------ | ------- |
| **Type**     | `array` |
| **Required** | No      |

**Description:** Instruments used to collect the data. Each needs an ID; when two or more platforms are defined, each instrument must also name its platform.

|                      | Array restrictions |
| -------------------- | ------------------ |
| **Min items**        | N/A                |
| **Max items**        | N/A                |
| **Items unicity**    | False              |
| **Additional items** | False              |
| **Tuple validation** | See below          |

| Each item of this array must be  | Description |
| -------------------------------- | ----------- |
| [instrument](#instruments_items) | -           |

### <a name="instruments_items"></a>32.1. CIOOS Metadata Record > instruments > instrument

|                           |                          |
| ------------------------- | ------------------------ |
| **Type**                  | `object`                 |
| **Required**              | No                       |
| **Additional properties** | Any type allowed         |
| **Defined in**            | #/definitions/instrument |

| Property                                           | Pattern | Type   | Deprecated | Definition               | Title/Description                                             |
| -------------------------------------------------- | ------- | ------ | ---------- | ------------------------ | ------------------------------------------------------------- |
| - [id](#instruments_items_id )                     | No      | string | No         | -                        | -                                                             |
| - [manufacturer](#instruments_items_manufacturer ) | No      | string | No         | -                        | -                                                             |
| - [version](#instruments_items_version )           | No      | string | No         | -                        | -                                                             |
| - [type](#instruments_items_type )                 | No      | object | No         | Same as [title](#title ) | Free text in English and French, with translation provenance. |
| - [description](#instruments_items_description )   | No      | object | No         | Same as [title](#title ) | Free text in English and French, with translation provenance. |
| - [platform](#instruments_items_platform )         | No      | string | No         | -                        | -                                                             |
| - [instrumentID](#instruments_items_instrumentID ) | No      | string | No         | -                        | -                                                             |

#### <a name="instruments_items_id"></a>32.1.1. Property `CIOOS Metadata Record > instruments > instruments items > id`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="instruments_items_manufacturer"></a>32.1.2. Property `CIOOS Metadata Record > instruments > instruments items > manufacturer`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="instruments_items_version"></a>32.1.3. Property `CIOOS Metadata Record > instruments > instruments items > version`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="instruments_items_type"></a>32.1.4. Property `CIOOS Metadata Record > instruments > instruments items > type`

|                           |                  |
| ------------------------- | ---------------- |
| **Type**                  | `object`         |
| **Required**              | No               |
| **Additional properties** | Any type allowed |
| **Same definition as**    | [title](#title)  |

**Description:** Free text in English and French, with translation provenance.

#### <a name="instruments_items_description"></a>32.1.5. Property `CIOOS Metadata Record > instruments > instruments items > description`

|                           |                  |
| ------------------------- | ---------------- |
| **Type**                  | `object`         |
| **Required**              | No               |
| **Additional properties** | Any type allowed |
| **Same definition as**    | [title](#title)  |

**Description:** Free text in English and French, with translation provenance.

#### <a name="instruments_items_platform"></a>32.1.6. Property `CIOOS Metadata Record > instruments > instruments items > platform`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="instruments_items_instrumentID"></a>32.1.7. Property `CIOOS Metadata Record > instruments > instruments items > instrumentID`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

## <a name="noPlatform"></a>33. Property `CIOOS Metadata Record > noPlatform`

**Title:** No platform

|              |           |
| ------------ | --------- |
| **Type**     | `boolean` |
| **Required** | No        |

**Description:** Set when the dataset was not collected from a platform.

## <a name="taxa"></a>34. Property `CIOOS Metadata Record > taxa`

**Title:** Taxonomic coverage

|              |         |
| ------------ | ------- |
| **Type**     | `array` |
| **Required** | No      |

**Description:** Taxa present in the dataset, resolved against WoRMS. Required unless noTaxa is set.

|                      | Array restrictions |
| -------------------- | ------------------ |
| **Min items**        | N/A                |
| **Max items**        | N/A                |
| **Items unicity**    | False              |
| **Additional items** | False              |
| **Tuple validation** | See below          |

| Each item of this array must be | Description |
| ------------------------------- | ----------- |
| [taxon](#taxa_items)            | -           |

### <a name="taxa_items"></a>34.1. CIOOS Metadata Record > taxa > taxon

|                           |                     |
| ------------------------- | ------------------- |
| **Type**                  | `object`            |
| **Required**              | No                  |
| **Additional properties** | Any type allowed    |
| **Defined in**            | #/definitions/taxon |

| Property                                        | Pattern | Type   | Deprecated | Definition | Title/Description |
| ----------------------------------------------- | ------- | ------ | ---------- | ---------- | ----------------- |
| - [scientificName](#taxa_items_scientificName ) | No      | string | No         | -          | -                 |
| - [canonicalName](#taxa_items_canonicalName )   | No      | string | No         | -          | -                 |
| - [rank](#taxa_items_rank )                     | No      | string | No         | -          | -                 |
| - [kingdom](#taxa_items_kingdom )               | No      | string | No         | -          | -                 |
| - [phylum](#taxa_items_phylum )                 | No      | string | No         | -          | -                 |
| - [class](#taxa_items_class )                   | No      | string | No         | -          | -                 |
| - [order](#taxa_items_order )                   | No      | string | No         | -          | -                 |
| - [family](#taxa_items_family )                 | No      | string | No         | -          | -                 |
| - [genus](#taxa_items_genus )                   | No      | string | No         | -          | -                 |
| - [species](#taxa_items_species )               | No      | string | No         | -          | -                 |
| - [parent](#taxa_items_parent )                 | No      | string | No         | -          | -                 |

#### <a name="taxa_items_scientificName"></a>34.1.1. Property `CIOOS Metadata Record > taxa > taxa items > scientificName`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="taxa_items_canonicalName"></a>34.1.2. Property `CIOOS Metadata Record > taxa > taxa items > canonicalName`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="taxa_items_rank"></a>34.1.3. Property `CIOOS Metadata Record > taxa > taxa items > rank`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="taxa_items_kingdom"></a>34.1.4. Property `CIOOS Metadata Record > taxa > taxa items > kingdom`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="taxa_items_phylum"></a>34.1.5. Property `CIOOS Metadata Record > taxa > taxa items > phylum`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="taxa_items_class"></a>34.1.6. Property `CIOOS Metadata Record > taxa > taxa items > class`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="taxa_items_order"></a>34.1.7. Property `CIOOS Metadata Record > taxa > taxa items > order`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="taxa_items_family"></a>34.1.8. Property `CIOOS Metadata Record > taxa > taxa items > family`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="taxa_items_genus"></a>34.1.9. Property `CIOOS Metadata Record > taxa > taxa items > genus`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="taxa_items_species"></a>34.1.10. Property `CIOOS Metadata Record > taxa > taxa items > species`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

#### <a name="taxa_items_parent"></a>34.1.11. Property `CIOOS Metadata Record > taxa > taxa items > parent`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

## <a name="noTaxa"></a>35. Property `CIOOS Metadata Record > noTaxa`

**Title:** No taxonomic coverage

|              |           |
| ------------ | --------- |
| **Type**     | `boolean` |
| **Required** | No        |

**Description:** Set when the dataset has no taxonomic coverage; waives the field above.

## <a name="identifier"></a>36. Property `CIOOS Metadata Record > identifier`

**Title:** Identifier

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

**Description:** UUID v4 assigned when the record is created.

## <a name="recordID"></a>37. Property `CIOOS Metadata Record > recordID`

**Title:** Record ID

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

**Description:** Realtime Database key for this record.

## <a name="userID"></a>38. Property `CIOOS Metadata Record > userID`

**Title:** User ID

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

**Description:** Owning user's Firebase auth UID.

## <a name="region"></a>39. Property `CIOOS Metadata Record > region`

**Title:** Region

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

**Description:** CIOOS region the record belongs to.

Must be one of:
* ""
* "pacific"
* "stlaurent"
* "atlantic"
* "amundsen"
* "canwin"
* "test"

## <a name="status"></a>40. Property `CIOOS Metadata Record > status`

**Title:** Status

|              |                    |
| ------------ | ------------------ |
| **Type**     | `enum (of string)` |
| **Required** | No                 |

**Description:** Record lifecycle. An empty string means draft.

Must be one of:
* ""
* "submitted"
* "published"

## <a name="created"></a>41. Property `CIOOS Metadata Record > created`

**Title:** Created

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

**Description:** ISO-8601 timestamp of record creation.

## <a name="timeFirstPublished"></a>42. Property `CIOOS Metadata Record > timeFirstPublished`

**Title:** First published

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

**Description:** ISO-8601 timestamp of first publication.

## <a name="lastEditedBy"></a>43. Property `CIOOS Metadata Record > lastEditedBy`

**Title:** Last edited by

|                           |                            |
| ------------------------- | -------------------------- |
| **Type**                  | `object`                   |
| **Required**              | No                         |
| **Additional properties** | Any type allowed           |
| **Defined in**            | #/definitions/lastEditedBy |

**Description:** The user who last saved the record.

| Property                                    | Pattern | Type   | Deprecated | Definition                                    | Title/Description |
| ------------------------------------------- | ------- | ------ | ---------- | --------------------------------------------- | ----------------- |
| - [displayName](#lastEditedBy_displayName ) | No      | string | No         | -                                             | -                 |
| - [email](#lastEditedBy_email )             | No      | string | No         | Same as [orgEmail](#contacts_items_orgEmail ) | -                 |
| - [uid](#lastEditedBy_uid )                 | No      | string | No         | -                                             | -                 |

### <a name="lastEditedBy_displayName"></a>43.1. Property `CIOOS Metadata Record > lastEditedBy > displayName`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

### <a name="lastEditedBy_email"></a>43.2. Property `CIOOS Metadata Record > lastEditedBy > email`

|                        |                                      |
| ---------------------- | ------------------------------------ |
| **Type**               | `combining`                          |
| **Required**           | No                                   |
| **Same definition as** | [orgEmail](#contacts_items_orgEmail) |

### <a name="lastEditedBy_uid"></a>43.3. Property `CIOOS Metadata Record > lastEditedBy > uid`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

## <a name="userinfo"></a>44. Property `CIOOS Metadata Record > userinfo`

**Title:** User info

|                           |                        |
| ------------------------- | ---------------------- |
| **Type**                  | `object`               |
| **Required**              | No                     |
| **Additional properties** | Any type allowed       |
| **Defined in**            | #/definitions/userinfo |

**Description:** Denormalized owner display name and email.

| Property                                | Pattern | Type   | Deprecated | Definition                                    | Title/Description |
| --------------------------------------- | ------- | ------ | ---------- | --------------------------------------------- | ----------------- |
| - [displayName](#userinfo_displayName ) | No      | string | No         | -                                             | -                 |
| - [email](#userinfo_email )             | No      | string | No         | Same as [orgEmail](#contacts_items_orgEmail ) | -                 |

### <a name="userinfo_displayName"></a>44.1. Property `CIOOS Metadata Record > userinfo > displayName`

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

### <a name="userinfo_email"></a>44.2. Property `CIOOS Metadata Record > userinfo > email`

|                        |                                      |
| ---------------------- | ------------------------------------ |
| **Type**               | `combining`                          |
| **Required**           | No                                   |
| **Same definition as** | [orgEmail](#contacts_items_orgEmail) |

## <a name="filename"></a>45. Property `CIOOS Metadata Record > filename`

**Title:** Filename

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

**Description:** Generated filename used when publishing.

## <a name="organization"></a>46. Property `CIOOS Metadata Record > organization`

**Title:** Organization

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

**Description:** Publishing organization.

## <a name="comment"></a>47. Property `CIOOS Metadata Record > comment`

**Title:** Comment

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

**Description:** Reviewer comment attached to the record.

## <a name="category"></a>48. Property `CIOOS Metadata Record > category`

**Title:** Category (deprecated)

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

**Description:** Superseded by resourceType. Still read as a fallback by the Python converter.

## <a name="schemaVersion"></a>49. Property `CIOOS Metadata Record > schemaVersion`

**Title:** Schema version

|              |          |
| ------------ | -------- |
| **Type**     | `string` |
| **Required** | No       |

**Description:** Version of this schema the record was written against. Absent on records predating the schema.

| Restrictions                      |                                                                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| **Must match regular expression** | ```^\d+\.\d+\.\d+$``` [Test](https://regex101.com/?regex=%5E%5Cd%2B%5C.%5Cd%2B%5C.%5Cd%2B%24) |

----------------------------------------------------------------------------------------------------------------------------
Generated using [json-schema-for-humans](https://github.com/coveooss/json-schema-for-humans)
