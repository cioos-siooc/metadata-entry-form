# GitHub Publishing Feature Technical Documentation

This document outlines the technical implementation of the GitHub Publishing feature, which allows administrators and reviewers to publish metadata records directly from the CIOOS Metadata Entry Form to a specified GitHub repository.

## 1. Overview

The feature bridges the Metadata Entry Form (React frontend) and a target GitHub repository via Firebase Cloud Functions. It enables:
*   **Admins** to configure repository credentials and target environments.
*   **Reviewers** to select specific environments (e.g., `prod`, `dev`) and publish record metadata (XML and YAML) with a custom commit message.

## 2. Architecture

The data flow is as follows:
1.  **Frontend**: User clicks "Publish to GitHub" -> Selects environments -> Confirm.
2.  **UserProvider**: Calls the `githubPublishRecord` Firebase Cloud Function.
3.  **Cloud Function**:
    *   Verifies user permissions (Admin/Reviewer).
    *   Fetches the record data and GitHub configuration from Firebase Realtime Database.
    *   Calls the existing Python-based conversion service (via `recordGeneratorURL`) to generate ISO 19115-3 XML and YAML.
    *   Uses the GitHub Git Database API (Trees/Commits) to create a single atomic commit containing the files for all selected environments.

## 3. Frontend Implementation

### 3.1 Admin Configuration (`src/components/Pages/Admin.jsx`)
*   **Purpose**: Allows region administrators to configure the target GitHub repository.
*   **Changes**:
    *   Added state variables for `githubOwner`, `githubRepo`, `githubToken`, `githubBranch`, `githubFileTemplate`, and `githubEnvironments`.
    *   Added a new "GitHub Publishing Configuration" section to the render method.
    *   Implemented `saveGithubCredentials()` to store settings at `admin/{region}/githubCredentials`.
    *   Added logic to load these credentials on component mount.

### 3.2 Reviewer Workflow (`src/components/Pages/Reviewer.jsx`)
*   **Purpose**: Provides the interface for reviewers to initiate the publish action.
*   **Changes**:
    *   Imported and integrated `GitHubPublishDialog`.
    *   Added `githubPublishModalOpen` and loading states.
    *   Implemented `handleGithubPublish` which calls the `publishRecordToGitHub` function from `UserContext`.
    *   Updated `SubmittedRecordItem` and `PublishedRecordItem` logic to show the publishing action button.

### 3.3 Publish Button (`src/components/FormComponents/MetadataRecordListItem.jsx`)
*   **Purpose**: The visual trigger for the publishing action.
*   **Changes**:
    *   Added the `CloudUpload` icon from Material UI.
    *   Added `showGithubPublishAction` and `onGithubPublishClick` props.
    *   Rendered the button conditionally based on the passed props.

### 3.4 Publishing Dialog (`src/components/Dialogs/GitHubPublishDialog.jsx`)
*   **New Component**: A modal dialog that allows the user to:
    *   View available environments (fetched from Admin config).
    *   Select one or more environments for deployment.
    *   Enter an optional custom commit message.
    *   Visual feedback with a loading spinner during the publish process.

### 3.5 Context Provider (`src/providers/UserProvider.jsx`)
*   **Purpose**: Exposes the backend Cloud Function to the React component tree.
*   **Changes**:
    *   Initialized the `githubPublishRecord` httpsCallable function.
    *   Exposed `publishRecordToGitHub` via the `UserContext` value.

## 4. Backend Implementation

### 4.1 Cloud Function (`firebase-functions/functions/githubPublish.js`)
*   **New File**: Contains the core business logic.
*   **Key Logic**:
    *   **Permission Check**: Manually verifies if the caller is in the `admins` or `reviewers` list for the region.
    *   **Data Fetching**: Retrieves the full record and the GitHub Personal Access Token (PAT).
    *   **Conversion**: Makes HTTP POST requests to the `recordToXML` and `recordToYAML` endpoints (leveraging existing Python infrastructure).
    *   **GitHub API**: Uses `@octokit/rest` to interact with the GitHub API. It performs a low-level Git operation (get ref -> get commit -> create tree -> create commit -> update ref) to ensure all files across all selected environments are added in a single commit.

### 4.2 Security Rules (`firebase-functions/database.rules.json`)
*   **Purpose**: Protects the GitHub credentials stored in the database.
*   **Changes**:
    *   Added a rule for `githubCredentials` under the `admin` node.
    *   Restricted `.write` access strictly to admins of that region.
    *   Inherited `.read` access for reviewers/admins (necessary for the Cloud Function execution context in some scenarios, though the Admin SDK bypasses this).

### 4.3 Function Export (`firebase-functions/functions/index.js`)
*   **Changes**: Exported the new `githubPublishRecord` function to make it deployable by Firebase.

## 5. Data Structure

### Firebase Path: `admin/{region}/githubCredentials`
```json
{
  "owner": "cioos-siooc",
  "repo": "cioos-siooc-forms",
  "branch": "main",
  "token": "ghp_...",
  "fileTemplate": "{uuid}",
  "environments": ["prod", "dev", "test"]
}
```

### GitHub Output Structure
Files are committed to the repository with the following structure:
```
forms/
  ├── prod/
  │   ├── {uuid}.xml
  │   └── {uuid}.yaml
  └── dev/
      ├── {uuid}.xml
      └── {uuid}.yaml
```
