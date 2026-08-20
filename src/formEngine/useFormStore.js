import { useContext, useMemo } from "react";
import { useParams } from "react-router-dom";

import { UserContext } from "../providers/UserProvider";
import routedFormStore from "./store/routedFormStore";

/**
 * Resolves the active FormStore adapter and binds the ambient region, user, and
 * language onto it.
 *
 * Every page talks to the store through this hook rather than importing an
 * adapter directly, so swapping Firebase for the Fastify API later is a change
 * in one place. The `VITE_FORM_BACKEND` switch is where that second adapter
 * plugs in.
 */
export default function useFormStore() {
  const { region, language } = useParams();
  const { user } = useContext(UserContext);

  const userID = user?.uid;
  const identity = useMemo(
    () =>
      user
        ? { displayName: user.displayName || "", email: user.email || "" }
        : null,
    [user]
  );

  return useMemo(() => {
    // Routes each call to the adapter that owns that kind of row: metadata
    // records live in their own RTDB tree, generic submissions under
    // formSubmissions. See store/routedFormStore.js.
    const store = routedFormStore;

    return {
      region,
      language: language === "fr" ? "fr" : "en",
      userID,

      // --- region-facing reads ---
      listFormTypes: (options = {}) =>
        store.listFormTypes({ region, ...options }),
      getFormType: (slugOrId, options = {}) =>
        store.getFormType({ region, slugOrId, ...options }),

      // --- global catalog (any region administrator) ---
      listCatalog: store.listCatalog,
      getCatalogFormType: store.getCatalogFormType,
      saveCatalogFormType: (formType) =>
        store.saveCatalogFormType({ createdBy: userID, ...formType }),
      publishCatalogFormType: (id, options = {}) =>
        store.publishCatalogFormType(id, {
          publishedBy: identity?.email || userID || null,
          ...options,
        }),
      listVersions: store.listVersions,
      getVersion: store.getVersion,
      getUsage: store.getUsage,
      deprecateCatalogFormType: store.deprecateCatalogFormType,
      deleteCatalogFormType: store.deleteCatalogFormType,
      canManageCatalog: () => store.canManageCatalog(identity?.email),

      // --- per-region activation (region admin) ---
      getRegionActivations: () => store.getRegionActivations(region),
      setRegionActivation: (formTypeId, patch) =>
        store.setRegionActivation(region, formTypeId, {
          updatedBy: identity?.email || null,
          ...patch,
        }),

      // --- submissions ---
      listSubmissions: (options = {}) =>
        store.listSubmissions({ region, ...options }),
      listMySubmissions: (options = {}) =>
        store.listSubmissions({ region, ownerId: userID, ...options }),
      // ownerId defaults to the signed-in user but may be overridden: a
      // reviewer, or somebody a record was shared with, opens it from the
      // owner's tree. The database rules are what actually enforce access —
      // this only decides which path to read.
      getSubmission: (id, options = {}) =>
        store.getSubmission({ region, id, ownerId: userID, ...options }),
      createSubmission: (formTypeId, data) =>
        store.createSubmission({
          region,
          formTypeId,
          userID,
          data,
          user: identity,
        }),
      saveSubmission: (id, data, status, options = {}) =>
        store.saveSubmission({
          region,
          id,
          userID,
          data,
          status,
          user: identity,
          // Writing a record a reviewer does not own has to target the owner's
          // subtree, not the reviewer's.
          ...options,
        }),
      deleteSubmission: (id, options = {}) =>
        store.deleteSubmission({ region, id, userID, ...options }),
      upgradeSubmission: (id, toVersion, options = {}) =>
        store.upgradeSubmission({ region, id, userID, toVersion, ...options }),
    };
  }, [region, language, userID, identity]);
}
