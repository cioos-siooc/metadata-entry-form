import * as dataciteFunctions from '../utils/firebaseEnableDoiCreation';

// Mocking the 'set' method. This method saves data to a specified location in the Firebase database.
// It returns a Promise that resolves to 'true', indicating a successful write operation in a test environment.
const mockSet = jest.fn().mockResolvedValue(true);

// Mocking the 'child' method, which navigates to a specific path within the database, allowing for nested data access.
// This mock facilitates method chaining by returning 'this', simulating the Firebase reference chaining.
const mockChild = jest.fn().mockReturnThis();

// Initialize a variable to dynamically set the return value of mockOnce
let mockValues = {};

// Mocks 'once' to simulate reading from Firebase, returning a snapshot that
// indicates no data (null), useful for testing deletion or absence of data.
const mockOnce = jest.fn(() => Promise.resolve({
    val: jest.fn(() => mockValues),
}));

// Mocking the 'remove' method. This method deletes data from a specified location in the Firebase database.
// It returns a Promise that resolves, indicating a successful deletion operation in a test environment.
const mockRemove = jest.fn().mockResolvedValue();

// Mocking the 'ref' method, which obtains a reference to a location in the database.
// The mock supports chaining by returning an object that includes the 'child' method
const mockRef = jest.fn(() => ({
    child: mockChild,
    set: mockSet,
    once: mockOnce,
    remove: mockRemove,
}));


// Mock the Firebase SDK to prevent actual Firebase operations during tests.
jest.mock('firebase/app', () => ({
    // Mock the initializeApp function to avoid actual initialization.
    initializeApp: jest.fn(),

    // Mock the database function to simulate database operations.
    database: jest.fn(() => ({
        ref: mockRef,
    })),
}));

// Import the mocked Firebase module.
import 'firebase/app';




describe('Datacite Credentials Management', () => {
  beforeEach(() => {
    // Reset the database before each test
    jest.clearAllMocks();
    mockValues = {}; 
  });

  it('should create new Datacite account credentials', async () => {

    const region = 'hakai';
    const prefix = '10.1234';
    const dataciteHash = 'abcd1234hash';


    await dataciteFunctions.newDataciteAccount(region, prefix, dataciteHash);

    // Assert: Verify that the Firebase database was interacted with as expected.
    expect(mockRef).toHaveBeenCalledWith("admin");
    // Verify the correct chain of 'child' method calls leading to the 'set' operation.
    expect(mockChild).toHaveBeenCalledTimes(2); // Assuming two 'child' calls.
    expect(mockChild).toHaveBeenNthCalledWith(1, region);
    expect(mockChild).toHaveBeenNthCalledWith(2, "dataciteCredentials");
    expect(mockSet).toHaveBeenCalledWith({ prefix, dataciteHash });
  });

  it('should delete all Datacite credentials for a region', async () => {
    const region = 'hakai';
    const prefix = '10.1234';
    const authHash = 'abcd1234hash';
    
    // Simulate setting data before deletion attempt
    await dataciteFunctions.newDataciteAccount(region, prefix, authHash);

    // Call the function under test to delete credentials
    const response = await dataciteFunctions.deleteAllDataciteCredentials(region);
    // Assert that the function returned a success response
  expect(response).toEqual({ success: true, message: "All Datacite credentials deleted successfully." });

  // Verify that mockRemove was called, indicating the delete operation was attempted
  expect(mockRemove).toHaveBeenCalled();
  });

  it('should fetch the Datacite prefix for a region', async () => {
    const region = 'hakai';
    const prefix = '10.1234';
    const authHash = 'abcd1234hash';
    
    mockValues = '10.1234'; 

    // Simulate setting data before fetch attempt
    await dataciteFunctions.newDataciteAccount(region, prefix, authHash);

    const fetchedPrefix = await dataciteFunctions.getDatacitePrefix(region);
    expect(fetchedPrefix).toEqual(mockValues);

    // Verify that mockOnce was called, indicating the read operation was simulated
    expect(mockOnce).toHaveBeenCalled();
  });

  it('should check if credentials are stored for a region', async () => {
    const region = 'hakai';
    const prefix = '10.1234';
    const dataciteHash = 'abcd1234hash';

    mockValues = {
      dataciteHash: dataciteHash,
      prefix: prefix
  };

    // Simulate setting data before fetch attempt
    await dataciteFunctions.newDataciteAccount(region, prefix, dataciteHash);

    const credentialsStored = await dataciteFunctions.getCredentialsStored(region);
    expect(credentialsStored).toBe(true);
  });
});
