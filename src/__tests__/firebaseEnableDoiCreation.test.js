import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock Firebase dependencies entirely to avoid import side-effects (ReadableStream error)
const mockSet = vi.fn().mockResolvedValue(true);
const mockChild = vi.fn().mockReturnThis();
const mockGet = vi.fn().mockResolvedValue({
  val: vi.fn(() => {}),
});
const mockRemove = vi.fn().mockResolvedValue();
// mockRef must be an object or function that can be returned.
// The implementation code likely calls db.ref(dbInstance, path).
const mockRef = vi.fn().mockReturnThis();
const mockGetDatabase = vi.fn().mockReturnThis();

vi.mock("firebase/database", () => ({
  ref: (...args) => mockRef(...args),
  set: (...args) => mockSet(...args),
  get: (...args) => mockGet(...args),
  child: (...args) => mockChild(...args),
  remove: (...args) => mockRemove(...args),
  getDatabase: (...args) => mockGetDatabase(...args),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('../firebase', () => ({ default: {} }));

import * as dataciteFunctions from '../utils/firebaseEnableDoiCreation';

describe('Datacite Credentials Management', () => {
  beforeEach(() => {
    // Reset the database before each test
    vi.clearAllMocks();
  });

  it('should create new Datacite account credentials', async () => {

    const region = 'hakai';
    const prefix = '10.1234';
    const dataciteHash = 'abcd1234hash';

    await dataciteFunctions.newDataciteAccount(region, prefix, dataciteHash);
    // Assert: Verify that the Firebase database was interacted with as expected.
    // Note: The first argument to ref/set in modular SDK is the db instance or ref, which is mocked as undefined/mock object here.
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
