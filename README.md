# metadata-entry-form

[![Run Build and Tests](https://github.com/cioos-siooc/metadata-entry-form/actions/workflows/run-build-tests.yaml/badge.svg)](https://github.com/cioos-siooc/metadata-entry-form/actions/workflows/run-build-tests.yaml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

CIOOS Metadata entry form

## Installation

1. Install [Node](https://nodejs.org/en/download/)

2. In this directory, run `npm install`

## Running development mode

`npm start`

This will start a hot-reloading dev server. Click on the link that it outputs to open in your browser.

### Running the Firebase emulator

Install firebase CLI [as described here](https://firebase.google.com/docs/emulator-suite/install_and_configure).

Run `firebase emulators:start` from the `firebase-functions/functions` directory.
Redirect function calls to this emulator by uncommenting the call to `useFunctionsEmulator` in [firebase.js](firebase.js).

## Deploy to testing site at GitHub pages

Pushes to master automatically deploy to <https://cioos-siooc.github.io/metadata-entry-form/>

Or manually deploy any branch with

`npm run deploy`

## Deployment and Configuration of Firebase Functions

Our Firebase Functions infrastructure utilizes both GitHub Actions for automated and manual deployments and parameterized configuration for management of environment variables and credentials.

### Automated and Manual Deployment with GitHub Actions

We use a GitHub Actions workflow named `firebase-deploy` for deploying Firebase Functions. This workflow is triggered automatically on push to the main branch but can also be executed manually for feature branches.

#### Workflow Features

- **Automated Deployments on Push to Main**: Ensures that any changes merged into the main branch are automatically deployed to Firebase.
- **Manual Deployment Option**: Allows for manual deployments of specific branches, useful for testing changes in feature branches. 
- **Environment Variables and Secrets**: Uses GitHub Secrets to populate a virtual `.env` file with necessary configurations for the deployment process.

#### Manual Deployment Steps

1. Go to the "Actions" tab in the GitHub repository.
2. Select the `firebase-deploy` workflow.
3. Click "Run workflow", select the branch to deploy, and initiate the workflow.

#### GitHub Secrets and .env File Creation

The workflow utilizes the following secrets to create the virtual `.env` file for the deployment process:

- `GMAIL_USER` notifications
- `GMAIL_PASS` notifications
- `AWS_REGION` used for amazon translate service access
- `AWS_ACCESSKEYID` used for amazon translate service access
- `AWS_SECRETACCESSKEY` used for amazon translate service access
- `GITHUB_AUTH` used to push to github pages branch and other github action type stuff
- `REACT_APP_DEV_DEPLOYMENT` used to switch between development and production databases. Default False, set to True to use Dev database
- `REACT_APP_GOOGLE_CLOUD_API_KEY` found at https://console.cloud.google.com/apis/credentials?project=cioos-metadata-form
- `REACT_APP_GOOGLE_CLOUD_API_KEY_DEV` found at https://console.cloud.google.com/apis/credentials?project=cioos-metadata-form-dev

### Using Parameterized Configuration in Firebase Functions

Our Firebase Functions leverage parameterized configuration for managing sensitive information. This helps prevent functions from being deployed with missing configurations/credentials.

For details on defining and accessing these parameters, refer to the [official Firebase documentation](https://firebase.google.com/docs/functions/config-env?gen=1st).

#### Deployment Considerations with Parameters

- **Local Development**: Use a `.env` file within the `functions` directory for local development, mirroring the setup of parameters used in production environments.
- **Firebase CLI Prompt**: The CLI may prompt for parameter values during deployment if they are not preset, ensuring functions are correctly configured.
- **Firebase Console Management**: Parameters can also be managed within the Firebase Console.

### Security Considerations

The use of GitHub Secrets and the creation of a virtual `.env` file during the workflow run ensures that sensitive information is handled securely, without persisting in the repository or exposing it beyond the lifecycle of the workflow execution. 

- **Exclude `.env` Files from Version Control**: Ensure `.env` files are not included in version control to prevent exposure of sensitive data.
- **Temporary `.env` Files**: The `.env` file created during the GitHub Actions workflow is virtual and transient. It exists only for the duration of the workflow run and is not committed to the repository.

## Deploying Firebase Realtime Database Security Rules

### Overview

Deploying Firebase Realtime Database security rules via the Firebase CLI is recommended to facilitate version control and consistency across development workflows.

### Setting Up Rules

- **Edit Rules**: Modify the Realtime Database security rules directly in the `database.rules.json` file.
- **Version Control**: Ensure the rules file is tracked in git to maintain a history of changes.

### Define targets

This project has two databases: `cioos-metadata-form` (this is the default/main db for production) and `cioos-metadata-form-dev` (dev). 
Use Firebase CLI targets to manage rules deployment:

```bash
firebase target:apply database prod cioos-metadata-form
firebase target:apply database dev cioos-metadata-form-dev
```

### Configure firebase.json

Update your `firebase.json` to map `.rules` files to your targets.
```json
{
  "database": [
    {
      "target": "prod",
      "rules": "database.rules.json"
    },
    {
      "target": "dev",
      "rules": "database.rules.json"
    }
  ]
}
```

### Deployment

Deploy your database rules using the Firebase CLI:

```bash
# Deploy to a specific environment
firebase deploy --only database:dev  # For development
firebase deploy --only database:prod # For production
```

#### Important Considerations

- **Deployment Overrides**: Deploying via the Firebase CLI overwrites any existing rules in the Firebase console. Ensure the `.rules` file reflects the latest ruleset. Keep the rules file in sync with any console edits to avoid unintended overwrites.
- **Version Control**: Use version control to track changes and collaborate on rule development.
- **Testing**: Thoroughly test your rules in a development or staging environment before deploying to production.

Review the [Firebase CLI documentation](https://firebase.google.com/docs/cli) for more details on managing project resources.