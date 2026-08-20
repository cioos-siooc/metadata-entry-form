import React from "react";

import SharedUsersList from "../../components/FormComponents/SharedUsersList";
import useField from "./useField";

/**
 * Who else may edit this record.
 *
 * SharedUsersList writes to `/{region}/shares` as well as to `record.sharedWith`
 * (it calls updateSharedRecord itself), so it takes the whole record and the
 * page's updateRecord rather than a single value.
 *
 * Only the owner may share, and a record being created has no owner yet — that
 * gate was `userID === record.userID || isNewRecord` in StartTab. The page puts
 * the answer in formContext as `canShare`.
 */
export default function SharedUsersField(props) {
  const { record, formContext } = useField(props);

  // Default-deny: sharing is a permission, and SharedUsersList writes to
  // /{region}/shares as soon as it mounts a change. A context that forgot to
  // say should show nothing, not everything.
  if (!formContext.canShare) return null;

  return (
    <SharedUsersList
      region={formContext.region}
      record={record}
      updateRecord={formContext.updateRecord}
    />
  );
}
