import React from "react";

import MapSelect from "../../components/FormComponents/MapSelect";
import useField from "./useField";

/**
 * The geographic extent: a Leaflet bounding box or polygon, plus the region and
 * place-name search.
 *
 * `record` is the whole record because MapSelect reads siblings — it calls
 * validateField(record, "map") for its own marker and resourceTypeIncludes(...,
 * "biota") to decide what it requires. FormShell binds every step's form to the
 * whole object, so formContext.formData is exactly that.
 *
 * Marked `ownChrome` in the generator: MapSelect draws its own Paper, question
 * and RequiredMark, so QuestionFieldTemplate must not draw a second set.
 *
 * The bbox values are STRINGS in the database. MapSelect writes them back as
 * strings and nothing here coerces them — see the type-fidelity note in
 * schema/README.md.
 */
export default function MapExtentField(props) {
  const { value, setValue, disabled, record } = useField(props);

  return (
    <MapSelect
      mapData={value || {}}
      updateMap={setValue}
      disabled={disabled}
      record={record}
    />
  );
}
