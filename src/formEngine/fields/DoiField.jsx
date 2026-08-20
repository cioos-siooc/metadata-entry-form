import React from "react";

import DOIInput from "../../components/FormComponents/DOIInput";
import useField from "./useField";

/**
 * The dataset DOI, and the whole DataCite draft → register → publish lifecycle
 * that hangs off it.
 *
 * Two things make this field unlike the others:
 *
 *   It writes a SIBLING. `doiCreationStatus` lives next to `datasetIdentifier`,
 *   and DOIInput updates both as the DataCite state machine advances. rjsf's
 *   onChange can only write the field it is bound to, so both updates go through
 *   the page's handleUpdateRecord in formContext — which happens to be exactly
 *   the prop shape DOIInput already takes, so nothing is adapted.
 *
 *   Its schema is an anyOf. `{type: "string", anyOf: [{const: ""}, {pattern:
 *   …}]}` says "empty or a well-formed DOI URL". rjsf treats any non-enum
 *   anyOf as a variant to be chosen and replaces the field with an option
 *   picker — unless the uiSchema sets `ui:fieldReplacesAnyOrOneOf: true`, which
 *   the generator does. Without it this component never mounts.
 */
export default function DoiField(props) {
  const { disabled, record, formContext, name } = useField(props);
  // DOIInput calls both handlers directly, so they must be callable even in a
  // context that supplies neither (a preview, a read-only render, a test).
  const update = formContext.handleUpdateRecord || (() => () => {});

  return (
    <DOIInput
      name={name}
      record={record}
      handleUpdateDatasetIdentifier={update("datasetIdentifier")}
      handleUpdateDoiCreationStatus={update("doiCreationStatus")}
      disabled={disabled}
    />
  );
}
