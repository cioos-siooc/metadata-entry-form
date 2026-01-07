# Developer Guide

This guide is intended for developers contributing to the CIOOS Metadata Entry Form. It covers environment setup, code structure, testing, and deployment.

## 1. Environment Setup

### Prerequisites
*   **Node.js**: v16+ (Project uses v20 in CI/CD).
*   **Python**: v3.11 (for Python functions).
*   **Docker**: For running the local `cioos-records-update` service or Dev Container.
*   **Firebase CLI**: `npm install -g firebase-tools`.
*   **Java**: Required for Firebase Emulators (Firestore/Realtime Database).

### Local Development (Manual)
1.  **Clone the repository**.
2.  **Install Frontend Dependencies**:
    ```bash
    npm install
    ```
3.  **Install Function Dependencies**:
    ```bash
    cd firebase-functions/functions && npm install
    cd ../python-functions && pip install -r requirements.txt
    ```
4.  **Set up Environment Variables**:
    *   Copy `.env.sample` to `.env`.
    *   Populate `REACT_APP_FIREBASE_Config` (JSON string) and API keys.
5.  **Run Emulators**:
    ```bash
    cd firebase-functions
    bash emulate-functions.sh
    ```
6.  **Start Frontend**:
    ```bash
    npm start
    ```

### VS Code Dev Container
The project includes a `.devcontainer` configuration. Opening the folder in VS Code with the Remote - Containers extension will automatically set up the environment with all prerequisites.

## 2. Project Architecture & Structure

### Frontend (`src/`)
The frontend is a React 16 application using Functional Components and Hooks.

*   **`src/components/Pages/`**: Top-level route components.
    *   `MetadataForm.jsx`: The core editor component. Manages the record state.
    *   `Submissions.jsx`: The user dashboard listing their records.
    *   `Admin.jsx` / `Reviewer.jsx`: Dashboards for specialized roles.
*   **`src/components/FormComponents/`**: Reusable UI inputs (e.g., `BilingualTextInput`, `MapSelect`, `ContactEditor`).
*   **`src/utils/`**: Core logic independent of UI.
    *   `blankRecord.js`: Defines the JSON schema of a new metadata record.
    *   `validate.js`: Validation rules mapping fields to error messages and tabs.
    *   `firebase.js`: Firebase SDK initialization.

### Backend (`firebase-functions/`)
Serverless backend using Firebase Cloud Functions (Gen 2).

*   **JavaScript (`functions/`)**: Handles triggers (DB updates), notifications, and translations.
*   **Python (`python-functions/`)**: Handles heavy data processing (XML conversion).
*   **`firebase.json`**: Configures the multi-codebase setup (`functions` vs `python-functions`).

### External Services
*   **`cioos-records-update/`**: A Flask app that synchronizes Firebase data to a "WAF" (Web Accessible Folder) or external catalogue. It runs independently.

## 3. Key Concepts

### Data Model
Metadata records are stored in Firebase Realtime Database (or Firestore). The schema is defined implicitly by `src/utils/blankRecord.js`. A record contains bilingual fields (objects with `en`/`fr` keys).

### Validation
Validation is defined in `src/utils/validate.js`.
*   **`validators` object**: Keys correspond to record fields.
*   **`tab` property**: Assigns the error to a specific UI tab (e.g., "spatial", "contacts").
*   **`validation` function**: Returns `true` if valid.

### Internationalization (i18n)
The app is bilingual.
*   **Content**: Fields like `title` are stored as `{ en: "...", fr: "..." }`.
*   **UI**: Strings are typically managed via helper components or constants (though explicit translation files like `en.json` are not central; check `src/components/I18n.jsx` or similar patterns).

## 4. Testing

*   **Runner**: Jest (`react-scripts test`).
*   **Command**: `npm test` or `npm run test:coverage`.
*   **Structure**: Tests are co-located in `__tests__` folders.
    *   `src/__tests__`: Unit tests for utilities.
    *   `src/components/__tests__`: Component tests (likely using React Testing Library or Enzyme).

## 5. Deployment

### GitHub Actions
*   **`firebase-deploy.yaml`**: Deploys Cloud Functions.
*   **`github-pages-deploy.yaml`**: Deploys the React frontend to GitHub Pages.

### Manual Deployment
```bash
# Frontend
npm run deploy

# Functions
cd firebase-functions
firebase deploy --only functions
```

### Database Rules
Security rules are in `firebase-functions/database.rules.json`. Deploy with:
```bash
firebase deploy --only database
```
