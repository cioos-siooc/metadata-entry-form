# Project Summary: CIOOS Metadata Entry Form

This document provides a comprehensive overview of the **CIOOS Metadata Entry Form** project, based on an analysis of the codebase and configuration files.

## 1. Project Goal
The primary goal of this project is to provide a user-friendly web interface for creating, editing, and managing metadata records for the Canadian Integrated Ocean Observing System (CIOOS). It facilitates the collection of high-quality metadata that complies with standards (ISO 19115), supports bilingual content (English/French), and integrates with external systems like GitHub and DataCite (for DOIs).

## 2. System Architecture

The application follows a serverless architecture leveraging Google Firebase, with additional Python-based services for specialized data processing.

### High-Level Components
*   **Frontend**: A Single Page Application (SPA) built with React.
*   **Backend**: Firebase Functions (Node.js and Python) handling business logic, triggers, and API endpoints.
*   **Database**: Firebase Realtime Database and/or Firestore for storing metadata records and user data.
*   **Authentication**: Firebase Authentication.
*   **External Integrations**: GitHub (for publishing records), DataCite (for DOI minting).

## 3. Component Breakdown

### A. Frontend (`src/`)
*   **Framework**: React (v16.x) using `create-react-app`.
*   **UI Library**: Material-UI (v4) for a responsive and consistent design.
*   **Maps**: Leaflet and React-Leaflet for geospatial inputs (bounding boxes, polygons).
*   **State/Data**: Uses Firebase SDK directly to interact with the database.
*   **Key Features**:
    *   Dynamic forms based on metadata schemas.
    *   Bilingual support (i18n).
    *   Validation logic.
    *   User and Admin dashboards.

### B. Backend: Firebase Functions (`firebase-functions/`)
The project utilizes a multi-codebase setup for Firebase Functions:

**1. JavaScript Functions (`functions/`)**
*   **Triggers**:
    *   `updatesRecordCreate/Update/Delete`: Likely maintains search indices or audit logs when records change.
    *   `notifyReviewer/User`: Sends email notifications upon status changes.
*   **Services**:
    *   `translate`: Uses AWS Translate (or Google Cloud Translate) to auto-translate content.
    *   `githubPublishRecord`: Pushes valid metadata records to specific GitHub repositories as XML/YAML.
    *   `datacite`: Manages DOI creation and updates.

**2. Python Functions (`python-functions/`)**
*   **Runtime**: Python 3.11.
*   **Key Function**: `convert_metadata`.
*   **Purpose**: Handles complex metadata conversions (e.g., JSON -> ISO 19115 XML) by interfacing with the `cioos-metadata-conversion` library or API.

### C. Data Processing & Utilities
**1. `cioos-records-update/`**
*   A standalone Python/Flask application.
*   **Purpose**: Synchronizes CIOOS catalogues with the metadata form. It can generate XML from the form data and acts as a WAF (Web Application Firewall) or proxy for serving these records.
*   **Deployment**: Dockerized.

**2. `firebase_to_xml/`**
*   A Python library.
*   **Purpose**: Contains the core logic for mapping the Firebase JSON data model to standard XML/YAML formats.
*   **Usage**: Used by the `cioos-records-update` service and likely the Python Cloud Functions.

## 4. Key Workflows

### Metadata Submission
1.  **User** logs in via Firebase Auth.
2.  **User** creates/edits a record in the React UI. Data is saved to Firebase Realtime Database.
3.  **Validation** runs client-side (and potentially server-side).
4.  **Submission**: User submits the record for review.

### Review & Publishing
1.  **Notifications**: Cloud Functions trigger emails to reviewers.
2.  **Review**: Admin/Reviewer approves the record.
3.  **Publishing**:
    *   **To GitHub**: `githubPublishRecord` function generates XML/YAML and commits it to a target GitHub repo.
    *   **DOI**: If enabled, interactions with DataCite mint a DOI.

### Data Synchronization
*   The `cioos-records-update` service appears to run independently (possibly as a cron job or triggered service) to pull data from Firebase and update downstream catalogues or file systems.

## 5. Development Setup

The project supports a Dev Container workflow for consistent environments.

*   **Prerequisites**: Docker, VS Code.
*   **Local Emulator**:
    *   `firebase emulators:start` (or `emulate-functions.sh`) runs local versions of Functions, Firestore, and Hosting.
*   **Frontend**: `npm start` runs the React dev server.
*   **Python Tools**: Standard `pip install` or `uv` workflows are used for the Python components.

## 6. Directory Map
*   `src/`: React source code.
*   `firebase-functions/`: Backend serverless code.
*   `cioos-records-update/`: External synchronization service.
*   `firebase_to_xml/`: Data conversion library.
*   `docs/`: Documentation (including this file).
*   `public/`: Static assets for the frontend.
