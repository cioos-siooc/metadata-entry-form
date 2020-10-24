import React from "react";
import { Paper, Typography } from "@material-ui/core";
import { En, Fr } from "../I18n";

import BilingualTextInput from "./BilingualTextInput";
import SelectInput from "./SelectInput";
import RequiredMark from "./RequiredMark";

const MetadataTab = ({
  disabled,
  record,
  handleInputChange,
  paperClassValidate,
  paperClass,
}) => (
  <div>
    <Paper style={paperClassValidate("language")}>
      <Typography>
        <En>What is primary language of the dataset?</En>
        <Fr>Quelle est la langue principale du jeu de données?</Fr>
        <RequiredMark />
      </Typography>
      <SelectInput
        name="language"
        value={record.language}
        onChange={(e) => handleInputChange(e)}
        options={["en", "fr"]}
        optionLabels={["English", "Français"]}
        disabled={disabled}
      />
    </Paper>

    <Paper style={paperClassValidate("maintenance")}>
      <Typography>
        <En>
          Describe any information about the maintenance of the resource or
          metadata.
        </En>
        <Fr>
          Décrire toute information sur la maintenance de la ressource ou des
          métadonnées
        </Fr>
        <RequiredMark />
      </Typography>
      <BilingualTextInput
        name="maintenance"
        value={record.maintenance}
        onChange={handleInputChange}
        multiline
        disabled={disabled}
      />
    </Paper>
    <Paper style={paperClass}>
      <Typography>
        <En>
          What are the limitations affecting the fitness for use of the resource
          or metadata?
        </En>
        <Fr>
          Quelles sont les limites qui influent sur l'aptitude à l'utilisation
          de la ressource ou des métadonnées?
        </Fr>
      </Typography>
      <BilingualTextInput
        name="limitations"
        value={record.limitations}
        onChange={handleInputChange}
        multiline
        disabled={disabled}
      />
    </Paper>
    <Paper style={paperClassValidate("license")}>
      <Typography>
        <En>How is the resource licensed?</En>
        <Fr>Comment la ressource est-elle sous licence?</Fr>
        <RequiredMark />
      </Typography>
      <SelectInput
        name="license"
        value={record.license}
        onChange={(e) => handleInputChange(e)}
        optionLabels={[
          "Creative Commons Attribution 4.0",
          "Creative Commons 0",
          "Government Open License - Canada",
          "Apache License, Version 2.0",
        ]}
        options={[
          "CC-BY-4.0",
          "CC0",
          "government-open-license-canada",
          "Apache-2.0",
        ]}
        disabled={disabled}
      />
    </Paper>

    <Paper style={paperClass}>
      <Typography>
        <En>Are there any additional comments about this dataset?</En>
        <Fr>
          Y a-t-il des commentaires supplémentaires à propos de cet ensemble de
          données?
        </Fr>
      </Typography>
      <BilingualTextInput
        name="comment"
        value={record.comment}
        onChange={handleInputChange}
        multiline
        disabled={disabled}
      />
    </Paper>

    <Paper style={paperClass}>
      <Typography>
        <En>Describe the history of this dataset.</En>
        <Fr>Décrivez l'historique de ce jeu de données.</Fr>
      </Typography>
      <BilingualTextInput
        name="history"
        value={record.history}
        onChange={handleInputChange}
        multiline
        disabled={disabled}
      />
    </Paper>
  </div>
);

export default MetadataTab;
