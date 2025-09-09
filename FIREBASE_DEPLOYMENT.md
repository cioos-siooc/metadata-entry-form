# Firebase Deployment Guide

This guide explains how to deploy the CIOOS Metadata Entry Form to a new Firebase instance.

## Quick Setup for New Firebase Instance

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Follow the setup wizard

### 2. Configure Firebase Services
1. **Authentication**: Enable Email/Password authentication
2. **Realtime Database**: Create a database in locked mode
3. **Hosting**: Set up Firebase Hosting
4. **Functions**: Enable Cloud Functions
5. **Storage**: Enable Cloud Storage

### 3. Configure Environment Variables
1. Copy `.env.example` to `.env`
2. Get your Firebase configuration from Firebase Console → Project Settings → General → Your apps
3. Fill in the Firebase configuration variables:

```bash
# Your Firebase project details
REACT_APP_FIREBASE_API_KEY=your-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=G-MEASUREMENT-ID
```

### 4. Deploy
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize project: `firebase init`
4. Build the project: `npm run build`
5. Deploy: `firebase deploy`

## Configuration Details

### Environment Variables Explained

**New Firebase Configuration (Recommended)**
- `REACT_APP_FIREBASE_*`: These variables configure Firebase SDK for your specific instance
- When these are set, the app will use your custom Firebase project
- This overrides the hardcoded legacy configurations

**Legacy Configuration (Backward Compatibility)**
- `REACT_APP_GOOGLE_CLOUD_API_KEY*`: Legacy API key variables
- These are still used when new configuration is not provided
- Kept for backward compatibility with existing deployments

### Firebase Functions Environment

Firebase Functions also need configuration. Set these in Firebase Functions config:

```bash
# Navigate to firebase-functions directory
cd firebase-functions

# Set environment variables for functions
firebase functions:config:set gmail.user="your-email@domain.com"
firebase functions:config:set gmail.pass="your-app-password"
firebase functions:config:set aws.region="your-region"
firebase functions:config:set aws.accesskeyid="your-access-key"
firebase functions:config:set aws.secretaccesskey="your-secret-key"
firebase functions:config:set github.auth="your-github-token"
```

### Database Rules

Make sure to configure appropriate database rules in `firebase-functions/database.rules.json`.

### Security Considerations

1. **API Keys**: Firebase web API keys are safe to expose in client code
2. **Service Accounts**: Keep service account keys secure and never commit them
3. **Environment Variables**: Use GitHub Secrets for CI/CD deployments
4. **Database Rules**: Configure appropriate read/write permissions

## Migration from Legacy Setup

If you're migrating from the hardcoded configuration:

1. The app will automatically detect new environment variables
2. Legacy configurations remain as fallback
3. No changes needed to existing deployments
4. New deployments should use the new environment variable approach

## Troubleshooting

**App not connecting to Firebase:**
- Verify all `REACT_APP_FIREBASE_*` variables are set correctly
- Check Firebase project settings match your configuration
- Ensure Firebase services are enabled

**Functions not working:**
- Check Firebase Functions configuration with `firebase functions:config:get`
- Verify service account permissions
- Check function logs with `firebase functions:log`

**Build/Deploy issues:**
- Ensure you're using the correct Firebase project: `firebase use your-project-id`
- Check that all required dependencies are installed
- Verify Firebase CLI is logged in to correct account