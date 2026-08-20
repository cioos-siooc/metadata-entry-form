import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import { OpenInNew, Update, Warning } from "@mui/icons-material";

import CheckBoxList from "../../components/FormComponents/CheckBoxList";
import { En, Fr, I18n } from "../../components/I18n";
import { eovs, eovCategories } from "../../eovs";
import { isOnlyOther } from "../../utils/normalizeResourceType";
import useField from "./useField";

/**
 * Essential Ocean Variables, grouped by category.
 *
 * A plain `checkboxList` widget cannot express any of what makes this field
 * usable: per-option definition tooltips, a link out to the GOOS definition, the
 * "emerging" badge, and — the load-bearing one — deprecated EOVs, which are
 * hidden unless the record already has them, struck through when shown, and
 * carry a tooltip naming their replacements. A record holding a deprecated EOV
 * cannot be submitted, so the user has to be able to see which one and what to
 * use instead.
 *
 * It also hides itself when the topic category is only "other", which
 * `visibleIf` cannot express — the predicate DSL has no "array contains only X".
 */
export default function EovField(props) {
  const { value, setValue, disabled, language, record } = useField(props);

  // Moved from IdentificationTab, which wrapped the whole block in this check.
  if (record.resourceType && isOnlyOther(record.resourceType)) return null;

  const selected = value || [];
  const upper = language.toUpperCase();

  return (
    <>
      {Object.entries(eovCategories).map(([categoryKey, categoryText]) => {
        const inCategory = eovs
          .filter((e) => e.category === categoryKey)
          // A deprecated EOV is only offered if this record already has it —
          // otherwise nobody can newly select one.
          .filter((e) => !e.deprecated || selected.includes(e.value))
          .sort((a, b) =>
            a[`label ${upper}`].localeCompare(b[`label ${upper}`], language)
          );

        if (!inCategory.length) return null;

        return (
          <div key={categoryKey}>
            <h4>{categoryText[language]}</h4>
            <CheckBoxList
              value={selected}
              labelSize={6}
              onChange={setValue}
              disabled={disabled}
              options={inCategory.map((e) => e.value)}
              optionLabels={inCategory.map((e) => (
                <EovLabel key={e.value} eov={e} upper={upper} />
              ))}
            />
          </div>
        );
      })}
    </>
  );
}

function EovLabel({ eov, upper }) {
  return (
    <>
      <Tooltip title={eov[`definition ${upper}`]}>
        <span
          style={
            eov.deprecated
              ? { textDecoration: "line-through", color: "rgba(0,0,0,0.4)" }
              : undefined
          }
        >
          {eov[`label ${upper}`]}
        </span>
      </Tooltip>

      {eov.url && (
        <IconButton
          onClick={() => window.open(eov.url, "_blank", "noopener,noreferrer")}
        >
          <Tooltip
            title={
              <I18n
                en="Open GOOS definition in new window"
                fr="Ouvrir la définition GOOS dans une nouvelle fenêtre"
              />
            }
          >
            <OpenInNew />
          </Tooltip>
        </IconButton>
      )}

      {eov.emerging && (
        <Tooltip title={<I18n en="GOOS emerging EOV" fr="EOV émergent GOOS" />}>
          <Update />
        </Tooltip>
      )}

      {eov.deprecated && <DeprecatedWarning eov={eov} />}
    </>
  );
}

function DeprecatedWarning({ eov }) {
  const replacements = (eov.replacedBy || [])
    .map((v) => eovs.find((x) => x.value === v))
    .filter(Boolean);
  const en = replacements.map((r) => r["label EN"]).join(", ");
  const fr = replacements.map((r) => r["label FR"]).join(", ");

  return (
    <Tooltip
      title={
        <I18n>
          <En>
            {`This EOV is deprecated and cannot be submitted. Please unselect it${
              en ? ` and use ${en} instead` : ""
            }.`}
          </En>
          <Fr>
            {`Cet EOV est déprécié et ne peut pas être soumis. Veuillez le désélectionner${
              fr ? ` et utiliser ${fr} à la place` : ""
            }.`}
          </Fr>
        </I18n>
      }
    >
      <Warning color="warning" />
    </Tooltip>
  );
}
