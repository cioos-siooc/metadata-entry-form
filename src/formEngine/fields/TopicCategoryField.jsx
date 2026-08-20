import React, { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Tooltip,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

import CheckBoxList from "../../components/FormComponents/CheckBoxList";
import { I18n } from "../../components/I18n";
import { topicCategories } from "../../utils/themes";
import {
  normalizeResourceType,
  isOnlyOther,
} from "../../utils/normalizeResourceType";
import useField from "./useField";

/**
 * ISO 19115 topic categories, split into a prominent set and everything else.
 *
 * Three things keep this a custom field rather than a `checkboxList` widget:
 *
 *   - `resourceType` may be a bare legacy STRING ("biological") rather than an
 *     array. It is normalized on read and always written back as an array.
 *   - The long tail of categories lives behind an accordion, which auto-opens if
 *     the record already has something selected inside it — otherwise a
 *     selection would be invisible.
 *   - Choosing only "other" implies the EOV list is not applicable, so "other"
 *     is added to `eov` too. That is a SIBLING write, which rjsf's onChange
 *     cannot express; it goes through the page's updateRecord in formContext.
 */
export default function TopicCategoryField(props) {
  const { value, setValue, disabled, language, record, formContext } =
    useField(props);
  const [expanded, setExpanded] = useState(false);

  const all = Object.entries(topicCategories).map(([key, cat]) => ({
    key,
    ...cat,
  }));
  const prominent = all.filter((t) => t.prominent);
  const rest = all.filter((t) => !t.prominent);

  const selected = normalizeResourceType(value || []);
  const hasHiddenSelection = selected.some((v) =>
    rest.some((t) => t.key === v)
  );

  const update = (next) => {
    if (isOnlyOther(next)) {
      const eov = Array.isArray(record.eov) ? record.eov : [];
      if (!eov.includes("other")) {
        formContext.updateRecord?.("eov")([...eov, "other"]);
      }
    }
    setValue(next);
  };

  const listFor = (topics, name) => (
    <CheckBoxList
      name={name}
      value={selected}
      labelSize={6}
      onChange={update}
      disabled={disabled}
      options={topics.map((t) => t.key)}
      optionLabels={topics.map((t) => t.title[language])}
      optionTooltips={topics.map((t) => t.definition[language])}
    />
  );

  return (
    <>
      {listFor(prominent, "resource-type")}

      <Accordion
        expanded={expanded || hasHiddenSelection}
        onChange={(_event, isExpanded) => setExpanded(isExpanded)}
      >
        <AccordionSummary
          expandIcon={
            <Tooltip
              title={
                language === "fr"
                  ? "Afficher/masquer les catégories"
                  : "Show/Hide more options"
              }
            >
              <ExpandMore />
            </Tooltip>
          }
        >
          <I18n
            en="Show/Hide more topic categories"
            fr="Afficher/masquer les catégories thématiques"
          />
        </AccordionSummary>
        <AccordionDetails>
          {listFor(rest, "resource-type-expanded")}
        </AccordionDetails>
      </Accordion>
    </>
  );
}
