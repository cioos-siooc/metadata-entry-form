import { getDatabase, ref, onValue, set, update, push, remove } from "firebase/database";
import firebase from "../firebase";

/**
 * Listen to all approved organizations
 */
export function listenToOrganizations(callback) {
  const database = getDatabase(firebase);
  const orgsRef = ref(database, "organizations");
  return onValue(orgsRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
}

/**
 * Create a new organization
 */
export function createOrganization(orgSlug, orgData) {
  const database = getDatabase(firebase);
  return set(ref(database, `organizations/${orgSlug}`), orgData);
}

/**
 * Update an existing organization
 */
export function updateOrganization(orgSlug, orgData) {
  const database = getDatabase(firebase);
  return update(ref(database, `organizations/${orgSlug}`), orgData);
}

/**
 * Delete an organization
 */
export function deleteOrganization(orgSlug) {
  const database = getDatabase(firebase);
  return remove(ref(database, `organizations/${orgSlug}`));
}

/**
 * Submit a request for a new organization
 */
export function submitOrganizationRequest(requestData) {
  const database = getDatabase(firebase);
  const requestsRef = ref(database, "organizationRequests");
  return push(requestsRef, {
    ...requestData,
    requestedAt: new Date().toISOString(),
    status: "pending",
  });
}

/**
 * Listen to all organization requests (for admin)
 */
export function listenToOrganizationRequests(callback) {
  const database = getDatabase(firebase);
  const requestsRef = ref(database, "organizationRequests");
  return onValue(requestsRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
}

/**
 * Approve an organization request
 */
export async function approveOrganizationRequest(requestId, requestData, orgSlug, adminEmail) {
  const database = getDatabase(firebase);
  
  const orgData = {
    orgNameEn: requestData.orgNameEn,
    orgNameFr: requestData.orgNameFr,
    orgSlug,
    orgLogoEn: requestData.orgLogoEn || "",
    orgLogoFr: requestData.orgLogoFr || "",
    orgAcceptedNames: requestData.orgAcceptedNames || [],
    orgEmail: requestData.orgEmail || "",
    orgURL: requestData.orgURL || "",
    orgAddress: requestData.orgAddress || "",
    orgCity: requestData.orgCity || "",
    orgCountry: requestData.orgCountry || "",
    orgRor: requestData.orgRor || "",
    status: "approved",
    approvedBy: adminEmail,
    approvedAt: new Date().toISOString(),
  };

  const updates = {};
  updates[`organizations/${orgSlug}`] = orgData;
  updates[`organizationRequests/${requestId}/status`] = "approved";
  updates[`organizationRequests/${requestId}/approvedAt`] = orgData.approvedAt;

  return update(ref(database), updates);
}

/**
 * Reject an organization request
 */
export function rejectOrganizationRequest(requestId, reviewNote) {
  const database = getDatabase(firebase);
  return update(ref(database, `organizationRequests/${requestId}`), {
    status: "rejected",
    reviewNote,
  });
}
