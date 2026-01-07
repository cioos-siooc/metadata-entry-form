# User Guide: Metadata Entry

This guide explains how to use the CIOOS Metadata Entry Form to create, edit, and publish metadata records.

## Getting Started
1.  **Login**: Access the application and log in using your credentials.
2.  **Dashboard**: You will see a list of your existing submissions.
3.  **New Record**: Click the **"New Record"** button to start a fresh form.

## The Metadata Form
The form is divided into several tabs. You must complete the required fields in each tab to submit the record.

### 1. Start (General Info)
*   **Title**: Required in **both** English and French.
*   **Resource Type**: Select the scientific discipline (e.g., Physical Oceanography).
*   **Metadata Scope**: Defines if this is a dataset, model, etc.

### 2. Identification (`dataID`)
*   **Abstract**: A summary of the dataset (English & French required).
*   **Keywords**: Add tags to help users find your data. At least one is required.
*   **EOV (Essential Ocean Variables)**: Select variables relevant to your data.
*   **Language**: The language of the data itself.
*   **License**: Choose a usage license (e.g., CC-BY).
*   **Progress**: The status of the dataset (e.g., Complete, On-going).

### 3. Spatial
*   **Map**: You must define the geographic area.
    *   **Draw**: Use the map tools to draw a bounding box or polygon.
    *   **Manual**: Enter North/South/East/West coordinates.
    *   **Biological Data**: Requires a geographic description.
*   **Vertical Extent**: Min/Max depth or altitude (if applicable).

### 4. Contacts
You must add people or organizations responsible for the data.
*   **Roles**:
    *   Every contact must have a role (e.g., Principal Investigator).
    *   **Mandatory**: You must have at least one **"Data Owner"** and one **"Metadata Custodian"**.
*   **Citation**: At least one contact must be selected to appear in the citation.
*   **Details**: Email addresses and URLs are validated.

### 5. Resources
*   **Distribution**: Links to where the data can be downloaded or accessed.
    *   **URL**: Must be a valid link.
    *   **Name**: Label for the link.

### 6. Platforms & Instruments
*   **Platforms**: Ships, buoys, or stations used to collect data.
*   **Instruments**: Sensors or devices attached to the platform.
*   **Validation**: Required unless "No Platform" is selected.

### 7. Lineage (History)
*   **Statement**: Explain how the data was collected and processed.
*   **Processing Steps**: Detail specific algorithms or quality control steps.

### 8. Related Works
*   Link to papers, reports, or other datasets associated with this record.
*   **Required Fields**: Title, Identifier (e.g., DOI), and Association Type.

## Validation & Submission
*   **Progress Bar**: Shows the percentage of completion.
*   **Errors**: If a tab has a red indicator, it contains invalid or missing fields. Check the error messages at the top or near specific fields.
*   **Submit**: Once the record is 100% valid, the "Submit" button will become active.

## Publishing (Reviewers/Admins)
Once submitted, a Reviewer or Admin can:
1.  **Review** the content.
2.  **Publish to GitHub**:
    *   Click the **Cloud Upload** icon.
    *   Select the target (Production or Dev).
    *   This generates XML/YAML files in the CIOOS GitHub repository.
3.  **Mint DOI**: If configured, a DOI can be assigned via DataCite.
