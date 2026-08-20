import React from "react";

import TaxaBody from "./TaxaBody";
import useField from "./useField";

/**
 * Taxonomic coverage: GBIF-backed search-to-add, a reorderable list, the details
 * table, and the "no taxa" opt-out.
 *
 * The body of this is ~380 lines of debounced GBIF lookup and SortableList
 * wiring that is the field, not decoration around it — so it is reused as-is
 * rather than reimplemented. It owns `noTaxa` as well as `taxa` (the generator
 * therefore drops noTaxa from the rendered schema) and draws its own Paper and
 * RequiredMark, so the generator marks it `ownChrome`.
 *
 * `updateRecord` comes from formContext rather than rjsf's onChange because this
 * writes two properties, and rjsf can only write the one it is bound to.
 *
 * Requiredness arrives through formContext rather than a direct validateField
 * import: src/utils/validate.js pulls in firebase, and the form engine does not
 * depend on it.
 */
export default function TaxaField(props) {
  const { disabled, record, formContext } = useField(props);
  const updateRecord = formContext.updateRecord || (() => () => {});

  return (
    <TaxaBody
      record={record}
      updateRecord={updateRecord}
      disabled={disabled}
      isFieldValid={formContext.isFieldValid}
    />
  );
}
