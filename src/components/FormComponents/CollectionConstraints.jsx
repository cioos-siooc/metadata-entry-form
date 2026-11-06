import React, { useEffect } from "react";
import { Paper } from "@mui/material";
import { useParams } from "react-router-dom";

import { En, Fr, I18n } from "../I18n";
import { validateField } from "../../utils/validate";
import BilingualTextInput from "./BilingualTextInput";
import RequiredMark from "./RequiredMark";
import SelectInput from "./SelectInput";
import { QuestionText, SupplementalText, paperClass } from "./QuestionStyles";

// MD_RestrictionCode values offered by the Collections profile
const accessConstraintOptions = {
  unrestricted: { en: "Unrestricted", fr: "Sans restriction" },
  otherRestrictions: { en: "Other restrictions", fr: "Autres restrictions" },
};
const useConstraintOptions = {
  license: { en: "Licence", fr: "Licence" },
  otherRestrictions: { en: "Other restrictions", fr: "Autres restrictions" },
};

// Collections profile: resourceConstraints > MD_LegalConstraints
const CollectionConstraints = ({
  record,
  handleUpdateRecord,
  updateRecord,
  disabled,
}) => {
  const { language } = useParams();

  // Profile defaults: access unrestricted, use governed by the licence
  useEffect(() => {
    if (disabled) return;
    if (!record.accessConstraint)
      updateRecord("accessConstraint")("unrestricted");
    if (!record.useConstraint) updateRecord("useConstraint")("license");
    // Only set the defaults once, when the section first appears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const otherConstraintsRequired = [
    record.accessConstraint,
    record.useConstraint,
  ].includes("otherRestrictions");

  return (
    <Paper style={paperClass}>
      <QuestionText>
        <I18n>
          <En>Are there access or use constraints on this Collection?</En>
          <Fr>
            Y a-t-il des contraintes d&apos;accès ou d&apos;utilisation pour
            cette collection?
          </Fr>
        </I18n>
        <SupplementalText>
          <I18n>
            <En>
              Most Collections are unrestricted and governed by the licence
              above. Choose &quot;Other restrictions&quot; only if something
              beyond the licence applies, and describe it below. Contacts with
              the rights holder role are listed as responsible for these
              constraints.
            </En>
            <Fr>
              La plupart des collections sont sans restriction et régies par la
              licence ci-dessus. Choisissez « Autres restrictions » seulement si
              une contrainte s&apos;ajoute à la licence, et décrivez-la
              ci-dessous. Les contacts ayant le rôle de détenteur des droits
              sont indiqués comme responsables de ces contraintes.
            </Fr>
          </I18n>
        </SupplementalText>
      </QuestionText>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <SelectInput
          label={language === "fr" ? "Contrainte d'accès" : "Access constraint"}
          value={record.accessConstraint || ""}
          onChange={handleUpdateRecord("accessConstraint")}
          options={Object.keys(accessConstraintOptions)}
          optionLabels={Object.values(accessConstraintOptions).map(
            (o) => o[language],
          )}
          disabled={disabled}
          fullWidth={false}
          style={{ width: "250px" }}
        />
        <SelectInput
          label={
            language === "fr" ? "Contrainte d'utilisation" : "Use constraint"
          }
          value={record.useConstraint || ""}
          onChange={handleUpdateRecord("useConstraint")}
          options={Object.keys(useConstraintOptions)}
          optionLabels={Object.values(useConstraintOptions).map(
            (o) => o[language],
          )}
          disabled={disabled}
          fullWidth={false}
          style={{ width: "250px" }}
        />
      </div>

      <QuestionText style={{ paddingTop: "25px" }}>
        <I18n>
          <En>Other constraints</En>
          <Fr>Autres contraintes</Fr>
        </I18n>
        {otherConstraintsRequired ? (
          <RequiredMark passes={validateField(record, "otherConstraints")} />
        ) : (
          <SupplementalText>
            <I18n>
              <En>Required when either constraint is Other restrictions.</En>
              <Fr>
                Obligatoire lorsque l&apos;une des contraintes est « Autres
                restrictions ».
              </Fr>
            </I18n>
          </SupplementalText>
        )}
      </QuestionText>
      <BilingualTextInput
        name="otherConstraints"
        value={record.otherConstraints}
        onChange={handleUpdateRecord("otherConstraints")}
        disabled={disabled}
        multiline
      />
    </Paper>
  );
};

export default CollectionConstraints;
