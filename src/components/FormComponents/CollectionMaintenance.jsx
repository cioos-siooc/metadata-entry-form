import React, { useEffect } from "react";
import { Paper } from "@mui/material";
import { useParams } from "react-router-dom";

import { En, Fr, I18n } from "../I18n";
import { maintenanceFrequencyCodes } from "../../isoCodeLists";
import { validateField } from "../../utils/validate";
import BilingualTextInput from "./BilingualTextInput";
import DateInput from "./DateInput";
import RequiredMark from "./RequiredMark";
import SelectInput from "./SelectInput";
import { QuestionText, SupplementalText, paperClass } from "./QuestionStyles";

// Collections profile: MD_DataIdentification > resourceMaintenance
const CollectionMaintenance = ({
  record,
  handleUpdateRecord,
  updateRecord,
  disabled,
}) => {
  const { language } = useParams();

  // The profile's default frequency for Collections is "asNeeded"
  useEffect(() => {
    if (!disabled && !record.maintenanceFrequency) {
      updateRecord("maintenanceFrequency")("asNeeded");
    }
    // Only set the default once, when the section first appears
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Paper style={paperClass}>
      <QuestionText>
        <I18n>
          <En>Collection maintenance</En>
          <Fr>Maintenance de la collection</Fr>
        </I18n>
        <SupplementalText>
          <I18n>
            <En>
              Describe how the list of datasets in this Collection is kept up to
              date. Contacts with the custodian or point of contact role are
              used as the maintenance contacts.
            </En>
            <Fr>
              Décrivez comment la liste des jeux de données de cette collection
              est tenue à jour. Les contacts ayant le rôle de gardien ou de
              personne-ressource servent de contacts de maintenance.
            </Fr>
          </I18n>
        </SupplementalText>
      </QuestionText>

      <QuestionText style={{ paddingTop: "15px" }}>
        <I18n>
          <En>How often is the Collection's membership updated?</En>
          <Fr>
            À quelle fréquence la composition de la collection est-elle mise à
            jour?
          </Fr>
        </I18n>
        <RequiredMark passes={validateField(record, "maintenanceFrequency")} />
      </QuestionText>
      <SelectInput
        value={record.maintenanceFrequency || ""}
        onChange={handleUpdateRecord("maintenanceFrequency")}
        options={Object.keys(maintenanceFrequencyCodes)}
        optionLabels={Object.values(maintenanceFrequencyCodes).map(
          ({ title }) => title[language],
        )}
        disabled={disabled}
        fullWidth={false}
        style={{ width: "250px" }}
      />

      <QuestionText style={{ paddingTop: "25px" }}>
        <I18n>
          <En>What is the membership-update policy?</En>
          <Fr>Quelle est la politique de mise à jour de la composition?</Fr>
        </I18n>
        <SupplementalText>
          <I18n>
            <En>
              Optional. For example: &quot;New Bedford Basin datasets are added
              when they are published in the CIOOS catalogue.&quot;
            </En>
            <Fr>
              Facultatif. Par exemple : « Les nouveaux jeux de données du bassin
              de Bedford sont ajoutés lorsqu&apos;ils sont publiés dans le
              catalogue de l&apos;SIOOC. »
            </Fr>
          </I18n>
        </SupplementalText>
      </QuestionText>
      <BilingualTextInput
        name="maintenanceText"
        value={record.maintenanceText}
        onChange={handleUpdateRecord("maintenanceText")}
        disabled={disabled}
        multiline
      />

      <QuestionText style={{ paddingTop: "25px" }}>
        <I18n>
          <En>When was the Collection's membership last changed?</En>
          <Fr>
            Quand la composition de la collection a-t-elle été modifiée pour la
            dernière fois?
          </Fr>
        </I18n>
        <SupplementalText>
          <I18n>
            <En>Optional.</En>
            <Fr>Facultatif.</Fr>
          </I18n>
        </SupplementalText>
      </QuestionText>
      <DateInput
        name="maintenanceDate"
        value={record.maintenanceDate}
        onChange={handleUpdateRecord("maintenanceDate")}
        disabled={disabled}
      />
    </Paper>
  );
};

export default CollectionMaintenance;
