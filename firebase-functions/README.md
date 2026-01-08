# Firebase Functions - JavaScript & Python

This project now supports both JavaScript and Python Firebase Functions, allowing you to leverage the strengths of both languages within the same Firebase project.

## Directory Structure

```
firebase-functions/
├── functions/               # JavaScript functions
│   ├── index.js            # Main JS functions export
│   ├── package.json        # JS dependencies
│   └── ...                 # Other JS function files
├── python-functions/        # Python functions
│   ├── main.py             # Main Python functions
│   └── requirements.txt    # Python dependencies
├── firebase.json           # Firebase configuration (multi-codebase)
├── deploy-functions.sh     # Deploy both JS & Python functions
├── emulate-functions.sh    # Run emulators for both languages
└── README.md              # This file
```

## Configuration

The project is configured with multiple codebases in `firebase.json`:

- **js-functions**: JavaScript functions in `/functions` directory
- **py-functions**: Python functions in `/python-functions` directory (Python 3.11 runtime)

## Available Python Functions

### 1. `hello_python` (HTTP Function)
- **URL**: `https://your-project.cloudfunctions.net/hello_python`
- **Method**: GET/POST
- **Description**: Example function to test Python deployment
- **Response**: JSON with greeting message and metadata

### 2. `convert_metadata` (HTTP Function)
- **URL**: `https://your-project.cloudfunctions.net/convert_metadata`
- **Method**: POST
- **Description**: Converts Firebase records to different metadata formats using cioos-metadata-conversion API
- **Payload**:
  ```json
  {
    "record_data": { /* Firebase record data */ },
    "output_format": "iso19115-3",
    "api_url": "http://localhost:8000"
  }
  ```

### 3. `get_conversion_formats` (Callable Function)
- **Type**: Firebase Callable Function
- **Description**: Retrieves available conversion formats from the API
- **Usage**:
  ```javascript
  const functions = getFunctions();
  const getFormats = httpsCallable(functions, 'get_conversion_formats');
  const result = await getFormats({ api_url: 'http://localhost:8000' });
  ```

## Development

### Prerequisites

1. **Node.js** (for JavaScript functions)
2. **Python 3.11** (for Python functions)
3. **Firebase CLI** with Python functions support

### Setup

1. **Install JavaScript dependencies**:
   ```bash
   cd functions
   npm install
   ```

2. **Install Python dependencies**:
   ```bash
   cd python-functions
   pip install -r requirements.txt
   ```

### Local Development

**Start Emulators** (both JS and Python):
```bash
./emulate-functions.sh
# Or: firebase emulators:start
```

**Keep Local Data Between Restarts**:
- The script persists emulator state to `.emulator-data` by default.
- To use a custom path, set `EMULATOR_DATA_DIR`:
   ```bash
   EMULATOR_DATA_DIR=.cache/firebase-emulators ./emulate-functions.sh
   ```
   Data is imported on start and exported on exit.

**Select Emulator Project Namespace**:
- Frontend dev config uses project `cioos-metadata-form-dev-258dc`.
- The emulator now defaults to that project to match the frontend.
- Override if needed (e.g., to view prod-namespace data in your local emulator):
   ```bash
   EMULATOR_PROJECT=cioos-metadata-form-8d942 ./emulate-functions.sh
   ```

**Access Points**:
- Functions Emulator: http://localhost:5002
- Firebase UI: http://localhost:4000

**Emulator Management**:
- If ports are occupied (e.g., Firestore 8081), use the helper to clear blockers:
   ```bash
   cd firebase-functions
   ./kill-emulators.sh
   ```
   This script kills common emulator processes and frees ports (UI, Functions, Firestore, RTDB, Auth).

**Frontend Integration (Realtime Database Emulator)**:
- The frontend connects to the RTDB emulator via SDK (`connectDatabaseEmulator`).
- Ensure in the root `.env`:
   ```bash
   REACT_APP_FIREBASE_LOCAL_DATABASE=true
   ```
- Optional: local permissions overrides when using the RTDB emulator:
   ```bash
   REACT_APP_LOCAL_ADMINS=admin1@example.com,admin2@example.com
   REACT_APP_LOCAL_REVIEWERS=reviewer1@example.com
   ```

### Testing Python Functions

1. **Test hello_python**:
   ```bash
   curl http://localhost:5002/your-project/us-central1/hello_python
   ```

2. **Test convert_metadata**:
   ```bash
   curl -X POST http://localhost:5002/your-project/us-central1/convert_metadata \
   -H "Content-Type: application/json" \
   -d '{
     "record_data": {"title": "Test Record"},
     "output_format": "iso19115-3",
     "api_url": "http://localhost:8000"
   }'
   ```

## Deployment

### Deploy All Functions
```bash
./deploy-functions.sh
```

### Deploy Specific Codebase
```bash
# Deploy only JavaScript functions
firebase deploy --only functions:js-functions

# Deploy only Python functions  
firebase deploy --only functions:py-functions
```

### Deploy Individual Functions
```bash
# Deploy specific Python function
firebase deploy --only functions:py-functions:hello_python

# Deploy specific JavaScript function
firebase deploy --only functions:js-functions:translate
```

## Adding New Functions

### JavaScript Functions
Add new functions to `/functions/` directory and export them in `index.js`:
```javascript
exports.myNewFunction = myNewFunction;
```

### Python Functions
Add new functions to `/python-functions/main.py`:

```python
@https_fn.on_request()
def my_new_function(req: https_fn.Request) -> https_fn.Response:
    return https_fn.Response("Hello from new Python function!")
```

## Environment Variables

Set environment variables for both codebases:

```bash
# For JavaScript functions
firebase functions:config:set somekey.somevalue="value" --project your-project

# For Python functions (same command, they share config)
firebase functions:config:set api.conversion_url="https://api.example.com"
```

## Best Practices

1. **Use appropriate language for the task**:
   - JavaScript: Quick API integrations, Firebase-native operations
   - Python: Data processing, machine learning, scientific computing

2. **Shared dependencies**: Keep Firebase Admin SDK initialized in both environments

3. **Error handling**: Implement proper error handling and logging in both languages

4. **Testing**: Test functions locally using emulators before deployment

5. **Performance**: Consider cold start times - Python functions may have longer cold starts

## Troubleshooting

### Common Issues

1. **Python functions not deploying**:
   - Ensure Python 3.11 is installed
   - Check `requirements.txt` has correct package versions
   - Verify Firebase CLI supports Python functions

2. **Import errors**:
   - Make sure all dependencies are listed in `requirements.txt`
   - Check Python version compatibility

3. **CORS issues**:
   - Python HTTP functions include CORS configuration
   - Adjust cors_origins as needed for your frontend

### Logs

View logs for specific codebases:
```bash
# JavaScript function logs
firebase functions:log --only functions:js-functions

# Python function logs  
firebase functions:log --only functions:py-functions
```

## Migration Notes

Existing JavaScript functions continue to work unchanged. Python functions are additive and don't affect existing functionality.

## Resources

- [Firebase Functions Python Documentation](https://firebase.google.com/docs/functions/python)
- [Firebase Functions JavaScript Documentation](https://firebase.google.com/docs/functions/write-firebase-functions)
- [Multi-codebase Setup Guide](https://firebase.google.com/docs/functions/organize-functions)