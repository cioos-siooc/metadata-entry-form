import React, { useEffect } from "react";
import { Paper, FormControlLabel, Checkbox } from "@mui/material";

import { En, Fr, I18n } from "../I18n";
import { validateField } from "../../utils/validate";
import BilingualTextInput from "./BilingualTextInput";
import RequiredMark from "./RequiredMark";
import { QuestionText, SupplementalText, paperClass } from "./QuestionStyles";

// Collections profile: resourceConstraints > MD_LegalConstraints.
// One opt-in checkbox sets both MD_RestrictionCode values:
// unticked -> access "unrestricted", use "licence"
// ticked   -> both "otherRestrictions", and Other constraints is required
const CollectionConstraints = ({
  record,
  handleUpdateRecord,
  updateRecord,
  disabled,
}) => {
  // Profile defaults: access unrestricted, use governed by the licence
  useEffect(() => {
    if (disabled) return;
    if (!record.accessConstraint)
      updateRecord("accessConstraint")("unrestricted");
    if (!record.useConstraint) updateRecord("useConstraint")("licence");
    // Only set the defaults once, when the section first appears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasRestrictions = [
    record.accessConstraint,
    record.useConstraint,
  ].includes("otherRestrictions");

  const setRestrictions = (checked) => {
    updateRecord("accessConstraint")(
      checked ? "otherRestrictions" : "unrestricted",
    );
    updateRecord("useConstraint")(checked ? "otherRestrictions" : "licence");
  };

  return (
    <Paper style={paperClass}>
      <QuestionText>
        <I18n>
          <En>Are there restrictions beyond the licence?</En>
          <Fr>Y a-t-il des restrictions qui s&apos;ajoutent à la licence?</Fr>
        </I18n>
        <SupplementalText>
          <I18n>
            <En>
              Most Collections have no restrictions beyond the licence above.
              Tick the box only if access to or use of the Collection is further
              restricted, and describe the restriction. Contacts with the Rights
              Holder role are listed as responsible for it.
            </En>
            <Fr>
              La plupart des collections n&apos;ont aucune restriction en plus
              de la licence ci-dessus. Cochez la case seulement si l&apos;accès
              à la collection ou son utilisation est restreint davantage, et
              décrivez la restriction. Les contacts ayant le rôle d&apos;Ayant
              droit sont indiqués comme responsables.
            </Fr>
          </I18n>
        </SupplementalText>
      </QuestionText>

      <FormControlLabel
        disabled={disabled}
        control={
          <Checkbox
            checked={hasRestrictions}
            onChange={(e) => setRestrictions(e.target.checked)}
          />
        }
        label={
          <I18n>
            <En>Yes, this Collection has other restrictions</En>
            <Fr>Oui, cette collection a d&apos;autres restrictions</Fr>
          </I18n>
        }
      />

      {hasRestrictions && (
        <>
          <QuestionText style={{ paddingTop: "15px" }}>
            <I18n>
              <En>Describe the restrictions</En>
              <Fr>Décrivez les restrictions</Fr>
            </I18n>
            <RequiredMark passes={validateField(record, "otherConstraints")} />
          </QuestionText>
          <BilingualTextInput
            name="otherConstraints"
            value={record.otherConstraints}
            onChange={handleUpdateRecord("otherConstraints")}
            disabled={disabled}
            multiline
          />
        </>
      )}
    </Paper>
  );
};

export default CollectionConstraints;
