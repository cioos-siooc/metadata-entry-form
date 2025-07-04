import * as db from "firebase/database";
import * as dataciteFunctions from '../utils/firebaseEnableDoiCreation';

// ****************************************************************************************************************************
// Attach to the existing firebase methods using .spyOn. This allows us to check if the method was called and to alter its 
// action or returned values with .mockImplementation, .mockImplementationOnce, .mockReturnValue, etc.
// https://jestjs.io/docs/mock-function-api#mockfnmockimplementationfn
// ****************************************************************************************************************************

// Mocking the 'set' method. This method saves data to a specified location in the Firebase database.
// It returns a Promise that resolves to 'true', indicating a successful write operation in a test environment.
const mockSet = jest.spyOn(db, 'set').mockResolvedValue(true);

// Mocking the 'child' method, which navigates to a specific path within the database, allowing for nested data access.
// This mock facilitates method chaining by returning 'this', simulating the Firebase reference chaining.
const mockChild = jest.fn().mockReturnThis();

// Mocks 'get' to simulate reading from Firebase, returning a snapshot that
// indicates no data (null)
const mockGet = jest.spyOn(db, 'get').mockResolvedValue({
  val: jest.fn(() => {}),
});

// Mocking the 'remove' method. This method deletes data from a specified location in the Firebase database.
// It returns a Promise that resolves, indicating a successful deletion operation in a test environment.
const mockRemove = jest.spyOn(db, 'remove').mockResolvedValue();

// Mocking the 'ref' method, which obtains a reference to a location in the database.
const mockRef = jest.spyOn(db, 'ref').mockReturnThis();

const mockGetDatabase = jest.spyOn(db, 'getDatabase').mockReturnThis();

jest.mock('firebase/database', () => ({
  ref: jest.fn(() => mockRef),
  set: jest.fn(() => mockSet),
  get: jest.fn(() => mockGet),
  child: jest.fn(() => mockChild),
  remove: jest.fn(() => mockRemove),
  getDatabase: jest.fn(() => mockGetDatabase),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));


describe('Datacite Credentials Management', () => {
  beforeEach(() => {
    // Reset the database before each test
    jest.clearAllMocks();
  });

  it('should create new Datacite account credentials', async () => {

    const region = 'hakai';
    const prefix = '10.1234';
    const dataciteHash = 'abcd1234hash';

    await dataciteFunctions.newDataciteAccount(region, prefix, dataciteHash);
    // Assert: Verify that the Firebase database was interacted with as expected.
    expect(mockRef).toHaveBeenCalledWith(undefined, "admin/hakai/dataciteCredentials");
    expect(mockSet).toHaveBeenCalledWith(undefined, { prefix, dataciteHash });

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
});
