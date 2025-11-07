import { getDatabase, ref, onValue, set } from "firebase/database";
import firebase from "../firebase";

/**
 * Load all organizations from Firebase
 * Organizations are stored globally at /admin/organizations
 */
export function loadOrganizations(callback) {
  const database = getDatabase(firebase);
  const organizationsRef = ref(database, "admin/organizations");

  return onValue(organizationsRef, (snapshot) => {
    const organizationsData = snapshot.val();

    // Convert Firebase object to array
    if (organizationsData && typeof organizationsData === 'object') {
      // If stored as an array, return as-is
      if (Array.isArray(organizationsData)) {
        callback(organizationsData);
      } else {
        // If stored as object with keys, convert to array
        const organizationsArray = Object.entries(organizationsData).map(([key, value]) => ({
          ...value,
          firebaseKey: key,
        }));
        callback(organizationsArray);
      }
    } else {
      callback([]);
    }
  });
}

/**
 * Save organizations array to Firebase
 * Stores at /admin/organizations
 */
export async function saveOrganizations(organizations) {
  const database = getDatabase(firebase);
  const organizationsRef = ref(database, "admin/organizations");

  // Store as array in Firebase
  await set(organizationsRef, organizations);
}

/**
 * Add a new organization to Firebase
 */
export async function addOrganization(organization) {
  const database = getDatabase(firebase);
  const organizationsRef = ref(database, "admin/organizations");

  // Get current organizations
  const snapshot = await new Promise((resolve) => {
    onValue(organizationsRef, resolve, { onlyOnce: true });
  });

  const currentOrganizations = snapshot.val() || [];
  const organizationsArray = Array.isArray(currentOrganizations)
    ? currentOrganizations
    : Object.values(currentOrganizations);

  // Add new organization
  organizationsArray.push(organization);

  // Save back to Firebase
  await set(organizationsRef, organizationsArray);
}

/**
 * Update an existing organization in Firebase
 */
export async function updateOrganization(organizationName, updatedOrganization) {
  const database = getDatabase(firebase);
  const organizationsRef = ref(database, "admin/organizations");

  // Get current organizations
  const snapshot = await new Promise((resolve) => {
    onValue(organizationsRef, resolve, { onlyOnce: true });
  });

  const currentOrganizations = snapshot.val() || [];
  const organizationsArray = Array.isArray(currentOrganizations)
    ? currentOrganizations
    : Object.values(currentOrganizations);

  // Find and update the organization
  const updatedArray = organizationsArray.map((org) =>
    org.name === organizationName ? updatedOrganization : org
  );

  // Save back to Firebase
  await set(organizationsRef, updatedArray);
}

/**
 * Delete an organization from Firebase
 */
export async function deleteOrganization(organizationName) {
  const database = getDatabase(firebase);
  const organizationsRef = ref(database, "admin/organizations");

  // Get current organizations
  const snapshot = await new Promise((resolve) => {
    onValue(organizationsRef, resolve, { onlyOnce: true });
  });

  const currentOrganizations = snapshot.val() || [];
  const organizationsArray = Array.isArray(currentOrganizations)
    ? currentOrganizations
    : Object.values(currentOrganizations);

  // Filter out the organization to delete
  const updatedArray = organizationsArray.filter(
    (org) => org.name !== organizationName
  );

  // Save back to Firebase
  await set(organizationsRef, updatedArray);
}

/**
 * Initialize organizations in Firebase from JSON file
 * This is a one-time migration function
 */
export async function initializeOrganizationsFromJSON(organizationsData) {
  const database = getDatabase(firebase);
  const organizationsRef = ref(database, "admin/organizations");

  // Check if organizations already exist
  const snapshot = await new Promise((resolve) => {
    onValue(organizationsRef, resolve, { onlyOnce: true });
  });

  const existingOrganizations = snapshot.val();

  // Only initialize if no data exists
  if (!existingOrganizations || (Array.isArray(existingOrganizations) && existingOrganizations.length === 0)) {
    await set(organizationsRef, organizationsData);
    return true;
  }

  return false;
}
