import { useContext, useEffect, useState } from "react";
import { getDatabase, ref, child, onValue, push, update } from "firebase/database";

import firebase from "../firebase";
import { UserContext } from "../providers/UserProvider";

/**
 * The user's saved contacts, instruments and platforms, plus the calls to save
 * one back.
 *
 * These libraries live at `/{region}/users/{uid}/{contacts|instruments|platforms}`
 * and are maintained by the ContactsSaved / InstrumentsSaved / PlatformsSaved
 * pages. Without them reaching the form, those pages become write-only: you
 * could add a contact to your library and never use it.
 *
 * The id of each row is folded into the row itself, because that is the shape
 * the editors expect and how they know whether to create or update.
 */
const KINDS = [
  { key: "contacts", stateKey: "userContacts", idKey: "contactID" },
  { key: "instruments", stateKey: "userInstruments", idKey: "instrumentID" },
  { key: "platforms", stateKey: "userPlatforms", idKey: "platformID" },
];

export default function useRecordLibraries({ region, enabled = true }) {
  const { user } = useContext(UserContext);
  const userID = user?.uid;

  const [libraries, setLibraries] = useState({
    userContacts: {},
    userInstruments: {},
    userPlatforms: {},
  });

  useEffect(() => {
    if (!enabled || !region || !userID) return undefined;

    const database = getDatabase(firebase);
    const userRef = ref(database, `${region}/users/${userID}`);

    const unsubscribes = KINDS.map(({ key, stateKey, idKey }) =>
      onValue(child(userRef, key), (snapshot) => {
        const rows = snapshot.toJSON() || {};
        Object.entries(rows).forEach(([id, row]) => {
          if (row) row[idKey] = id;
        });
        setLibraries((current) => ({ ...current, [stateKey]: rows }));
      })
    );

    return () => unsubscribes.forEach((off) => off());
  }, [enabled, region, userID]);

  /**
   * Writes one item back to the library — updating when it already carries an
   * id, creating otherwise — and returns the id either way.
   */
  const saveToLibrary = (kind) => (item) => {
    if (!region || !userID) return null;
    const meta = KINDS.find((k) => k.key === kind);
    const database = getDatabase(firebase);
    const listRef = ref(database, `${region}/users/${userID}/${kind}`);

    const { [meta.idKey]: id, ...body } = item || {};
    if (id) {
      update(child(listRef, id), body);
      return id;
    }
    return push(listRef, body).key;
  };

  return {
    ...libraries,
    saveToContacts: saveToLibrary("contacts"),
    saveToInstruments: saveToLibrary("instruments"),
    saveToPlatforms: saveToLibrary("platforms"),
  };
}
