import { useContext, useMemo } from "react";
import { useParams } from "react-router-dom";

import { UserContext } from "../providers/UserProvider";
import firebaseFormStore from "./store/firebaseFormStore";

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
    const store = firebaseFormStore;

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
      saveSubmission: (id, data, status) =>
        store.saveSubmission({
          region,
          id,
          userID,
          data,
          status,
          user: identity,
        }),
      deleteSubmission: (id) => store.deleteSubmission({ region, id, userID }),
      upgradeSubmission: (id, toVersion, options = {}) =>
        store.upgradeSubmission({ region, id, userID, toVersion, ...options }),
    };
  }, [region, language, userID, identity]);
}
