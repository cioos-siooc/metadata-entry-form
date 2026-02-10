# Login Authentication Setup

The CIOOS Metadata Entry Form supports multiple authentication providers: Google, Microsoft, and ORCID. The application uses Firebase Authentication as the primary authentication service, with each provider configured through their respective developer portals.

## Overview

The login system provides:
- **Multi-provider support**: Users can sign in with Google, Microsoft, or ORCID accounts
- **Bilingual interface**: Login UI supports English and French
- **Modern UI**: Card-based design with provider-specific icons
- **Error handling**: User-friendly error messages with dismissible alerts
- **Popup authentication**: Each provider opens in a popup window for seamless user experience

## Project Structure

### Authentication Files
- `src/auth.js` - Core authentication logic and provider configurations
- `src/components/Pages/Login.jsx` - Main login UI component
- `src/components/Icons.jsx` - Custom SVG icons for each provider
- `src/firebase.js` - Firebase configuration for production and development environments

### Key Features
- **Provider Configuration**: Each authentication provider has custom parameters (e.g., `prompt: "select_account"`)
- **Error Management**: Handles popup cancellation and authentication errors gracefully
- **Internationalization**: Full bilingual support for all UI text
- **Responsive Design**: Material-UI components ensure consistent styling across devices

## Provider Configuration

### Firebase Project Setup

The application uses two Firebase projects:
- **Production**: `cioos-metadata-form-8d942.firebaseapp.com`
- **Development**: `cioos-metadata-form-dev-258dc.firebaseapp.com`

All authentication providers must be configured in the Firebase Console for both environments.

### Microsoft OAuth2 Setup

Microsoft authentication uses Azure Active Directory through Firebase's Microsoft provider.

1. **Azure Portal**: Navigate to [Azure App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. **Create App Registration**:
   - **Name**: `CIOOS Metadata Entry Form` (append "Dev" for development environment)
   - **Supported account types**: "Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant)"
   - **Redirect URI**: Select "Web" and enter: `https://<your-project-id>.firebaseapp.com/__/auth/handler`
3. **Configure Authentication**:
   - Go to "Certificates & secrets" → "New client secret"
   - Copy the **Value** (not the Secret ID) - this will be your Client Secret
   - From the "Overview" page, copy the **Application (client) ID**
4. **Firebase Console Configuration**:
   - Navigate to Authentication → Sign-in method → Add new provider → Microsoft
   - Enter the **Application (client) ID** and **Client Secret**
   - Verify the redirect URI matches your Azure configuration

**Code Implementation**:
```javascript
const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({
  prompt: "select_account", // Forces account selection dialog
});
```

### ORCID OAuth2 Setup

ORCID authentication is implemented as an OpenID Connect (OIDC) provider through Firebase.

1. **ORCID Developer Tools**:
   - Sign in to your ORCID account
   - Navigate to "Developer Tools" section
   - Register for the Public API (or Member API if your organization has membership)
2. **Application Registration**:
   - **Application Name**: `CIOOS Metadata Entry Form`
   - **Website URL**: Your application's main URL
   - **Description**: Brief description of your application's purpose
   - **Redirect URIs**: Add `https://<your-project-id>.firebaseapp.com/__/auth/handler`
3. **Credentials**:
   - Copy the generated **Client ID** and **Client Secret**
4. **Firebase Console Configuration**:
   - Go to Authentication → Sign-in method → Add new provider → OpenID Connect
   - **Provider ID**: `oidc.orcid` (must match the code configuration)
   - **Client ID**: Your ORCID Client ID
   - **Issuer URL**: 
     - Production: `https://orcid.org`
     - Sandbox: `https://sandbox.orcid.org`
   - **Client Secret**: Your ORCID Client Secret

**Code Implementation**:
```javascript
const orcidProvider = new OAuthProvider('oidc.orcid');
orcidProvider.setCustomParameters({
  prompt: "login", // Forces login dialog
});
```

### Google OAuth2 Setup

Google authentication is Firebase's native provider and requires minimal additional configuration.

1. **Google Cloud Console**:
   - Ensure your Firebase project is linked to a Google Cloud project
   - OAuth consent screen should be configured for your domain
2. **Firebase Console**:
   - Go to Authentication → Sign-in method → Google
   - Enable the provider
   - Configure authorized domains if needed

**Code Implementation**:
```javascript
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ 
  prompt: "select_account" // Forces account selection
});
```

## Environment Configuration

### Environment Variables

The application requires the following environment variables:

```bash
# Firebase API Keys
REACT_APP_GOOGLE_CLOUD_API_KEY=your_production_api_key
REACT_APP_GOOGLE_CLOUD_API_KEY_DEV=your_development_api_key

# Development flags
REACT_APP_DEV_DEPLOYMENT=true/false
REACT_APP_FIREBASE_LOCAL_FUNCTIONS=true/false
REACT_APP_FIREBASE_LOCAL_DATABASE=true/false
```

### Local Development

For local development with Firebase emulators:
1. Set `REACT_APP_FIREBASE_LOCAL_FUNCTIONS=true` to use local Functions emulator
2. Set `REACT_APP_FIREBASE_LOCAL_DATABASE=true` to use local Database emulator
3. Emulators run on:
   - Functions: `127.0.0.1:5001` and `127.0.0.1:5002`
   - Database: `127.0.0.1:9001`

## User Interface

### Login Page Features

The login page (`src/components/Pages/Login.jsx`) provides:

- **Welcoming Design**: Clean card-based layout with centered content
- **Provider Buttons**: Full-width buttons with custom icons for each provider
- **Bilingual Support**: All text available in English and French
- **Error Handling**: Snackbar notifications for authentication errors
- **Accessibility**: Proper ARIA labels and keyboard navigation

### Button Configuration

Each provider button includes:
- **Custom Icons**: SVG icons loaded from `src/components/Icons.jsx`
- **Consistent Styling**: Material-UI outlined buttons with uniform spacing
- **Click Handlers**: Async functions that handle authentication flow
- **Error Boundaries**: Try-catch blocks for graceful error handling

### Internationalization

Text elements support both English and French:
```jsx
<I18n>
  <En>Sign in with Google</En>
  <Fr>Se connecter avec Google</Fr>
</I18n>
```

## Security Considerations

### Firebase Security Rules
- Authentication providers are configured at the project level
- User sessions are managed by Firebase Auth
- API keys are restricted to specific domains in Google Cloud Console

### Best Practices
1. **Environment Separation**: Different Firebase projects for production and development
2. **Secret Management**: Client secrets stored securely in Firebase Console
3. **Domain Restrictions**: OAuth redirect URIs restricted to authorized domains
4. **Error Handling**: No sensitive information exposed in error messages

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**:
   - Ensure all provider redirect URIs match exactly: `https://<project-id>.firebaseapp.com/__/auth/handler`
   - Check both Firebase Console and provider portal configurations

2. **Provider ID Mismatch**:
   - ORCID provider ID must be `oidc.orcid` in both Firebase Console and code
   - Microsoft provider ID should be `microsoft.com`

3. **Environment Configuration**:
   - Verify correct API keys for production vs. development
   - Ensure environment variables are properly set in deployment

4. **Popup Blocked**:
   - Authentication uses popup windows; ensure browsers allow popups for your domain
   - Users may need to manually allow popups in browser settings

### Testing Authentication

1. **Development Environment**:
   - Use sandbox/development endpoints where available (ORCID sandbox)
   - Test with different user accounts for each provider
   - Verify error handling by canceling authentication flows

2. **Production Deployment**:
   - Test all three providers after deployment
   - Verify redirect URIs work with production domain
   - Monitor Firebase Auth logs for any issues