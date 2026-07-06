import React, { createContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import * as Sentry from "@sentry/react";

import { initAuth, currentUser } from "../auth/keycloak";
import { get } from "../api/client";
import * as actions from "../api/actions";

export const UserContext = createContext({ user: null, authIsLoading: false });

const UserProvider = ({ children }) => {
  const { region } = useParams();
  const [state, setState] = useState({
    user: null,
    authIsLoading: true,
    loggedIn: false,
    isAdmin: false,
    isReviewer: false,
    isSuperadmin: false,
    admins: [],
    reviewers: [],
    hasSharedRecords: false,
    datacitePrefix: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((prev) => ({ ...prev, authIsLoading: true }));
      const authenticated = await initAuth().catch(() => false);
      const user = authenticated ? currentUser() : null;

      if (!user) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            user: null,
            loggedIn: false,
            authIsLoading: false,
          }));
        }
        return;
      }

      Sentry.setUser({ email: user.email, username: user.email });

      // Session bootstrap: server derives roles and provisions the user row
      // (replaces the userinfo write + permissions listener).
      let me = {};
      let permissions = { admins: [], reviewers: [] };
      if (region) {
        [me, permissions] = await Promise.all([
          get(`/regions/${region}/me`).catch(() => ({})),
          get(`/regions/${region}/admin/permissions`).catch(() => ({
            admins: [],
            reviewers: [],
          })),
        ]);
      } else {
        // Region-less pages (region select, region admin) still need the
        // global profile for isSuperadmin and the server-side user id.
        me = await get("/me").catch(() => ({}));
      }

      if (!cancelled) {
        setState({
          // uid is the server-side user id so record ownership checks line up
          user: { ...user, uid: me.userID ?? user.uid },
          loggedIn: true,
          authIsLoading: false,
          isAdmin: Boolean(me.isAdmin),
          isReviewer: Boolean(me.isReviewer),
          isSuperadmin: Boolean(me.isSuperadmin),
          admins: permissions.admins ?? [],
          reviewers: permissions.reviewers ?? [],
          hasSharedRecords: Boolean(me.hasSharedRecords),
          datacitePrefix: me.datacitePrefix ?? null,
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [region]);

  const contextValue = useMemo(
    () => ({
      ...state,
      translate: actions.translate,
      regenerateXMLforRecord: actions.regenerateXMLforRecord,
      downloadRecord: actions.downloadRecord,
      createDraftDoi: actions.createDraftDoi,
      updateDraftDoi: actions.updateDraftDoi,
      deleteDraftDoi: actions.deleteDraftDoi,
      getDoiStatus: actions.getDoiStatus,
      checkURLActive: actions.checkURLActive,
      getCredentialsStored: actions.getCredentialsStored,
      getDatacitePrefix: actions.getDatacitePrefix,
      testDataciteCredentials: actions.testDataciteCredentials,
      publishRecordToGitHub: actions.githubPublishRecord,
    }),
    [state],
  );

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export default UserProvider;
