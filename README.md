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

#### Local Install Alternative

Install firebase CLI [as described here](https://firebase.google.com/docs/emulator-suite/install_and_configure).

Run `firebase emulators:start` from the `firebase-functions/functions` directory.
Redirect function calls to this emulator by uncommenting the call to `useFunctionsEmulator` in [firebase.js](firebase.js).

#### Docker Alternative
Using the firebase emulator in docker will preload some data into a local realtime database and emulate cloud functions and the realtime database

docker-compose up -d --build
Redirect function calls to this emulator by uncommenting the call to `useFunctionsEmulator` in [firebase.js](firebase.js).

## Deploy to testing site at GitHub pages

Pushes to master automatically deploy to <https://cioos-siooc.github.io/metadata-entry-form/>

Or manually deploy any branch with

`npm run deploy`
