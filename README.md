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

- `GMAIL_USER`
- `GMAIL_PASS`
- `DATACITE_AUTH_HASH`
- `AWS_REGION`
- `AWS_ACCESSKEYID`
- `AWS_SECRETACCESSKEY`
- `GITHUB_AUTH`

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