import React from "react";

import { Typography, Paper, TextField } from "@material-ui/core";

import BilingualTextInput from "./BilingualTextInput";
import CheckBoxList from "./CheckBoxList";
import SelectInput from "./SelectInput";
import DateInput from "./DateInput";

import { En, Fr } from "../I18n";
import { eovList, progressCodes } from "../../isoCodeLists";
import { camelToSentenceCase } from "../../utils/misc";
import { keywordList } from "../../keywordList";
import { categoryList } from "../../categoryList";

const IdentificationTab = ({
  disabled,
  record,
  handleInputChange,
  paperClass,
}) => (
  <div>
    <Paper className={paperClass}>
      <Typography>
        <En>Dataset unique ID</En>
        <Fr>Identifiant unique de ce jeu de données</Fr>
      </Typography>
      <TextField
        name="identifier"
        value={record.identifier}
        onChange={(e) => handleInputChange(e)}
        disabled
        fullWidth
      />
    </Paper>

    <Paper className={paperClass}>
      <Typography>
        <En>What is the dataset title?</En>
        <Fr>Quel est le titre du jeu de données?</Fr>
      </Typography>
      <BilingualTextInput
        name="title"
        value={record.title}
        onChange={handleInputChange}
        required="either"
        disabled={disabled}
      />
    </Paper>

    <Paper className={paperClass}>
      <Typography>
        <En>What is the dataset abstract?</En>
        <Fr>Quelle est la description de ce jeu de données?</Fr>
      </Typography>
      <BilingualTextInput
        name="abstract"
        value={record.abstract}
        onChange={handleInputChange}
        required="either"
        disabled={disabled}
        multiline
      />
    </Paper>

    <Paper className={paperClass}>
      <Typography>
        <En>
          Please select all the essential ocean variables that are contained in
          this dataset
        </En>
        <Fr>
          Veuillez sélectionner toutes les variables océaniques essentielles
          contenues dans cet ensemble de données
        </Fr>
      </Typography>
      <CheckBoxList
        name="eov"
        value={record.eov}
        onChange={handleInputChange}
        options={eovList}
        optionLabels={eovList.map(camelToSentenceCase)}
        disabled={disabled}
      />
    </Paper>
    <Paper className={paperClass}>
      <Typography>
        <En>What are the keywords that describe the dataset?</En>
        <Fr>Quels sont les mots clefs qui décrivent votre jeu de données?</Fr>
      </Typography>
      <CheckBoxList
        name="keywords"
        value={record.keywords}
        onChange={handleInputChange}
        options={keywordList}
        optionLabels={keywordList}
        disabled={disabled}
      />
    </Paper>
    <Paper className={paperClass}>
      <Typography>
        <En>What is the status of this dataset?</En>
        <Fr>Quel est l'état de ce jeu de données ?</Fr>
      </Typography>
      <SelectInput
        name="progress"
        value={record.progress}
        onChange={(e) => handleInputChange(e)}
        options={progressCodes}
        optionLabels={progressCodes.map(camelToSentenceCase)}
        disabled={disabled}
      />
    </Paper>
    <Paper className={paperClass}>
      <Typography>
        <En>In which category does this dataset best fit in?</En>
        <Fr>Quelle catégorie convient le mieux à ce dataset?</Fr>
      </Typography>
      <SelectInput
        name="category"
        value={record.category}
        onChange={(e) => handleInputChange(e)}
        options={categoryList}
        optionLabels={categoryList.map(camelToSentenceCase)}
        disabled={disabled}
      />
    </Paper>

    <Paper className={paperClass}>
      <Typography>
        <En>What is the start date when data was first collected?</En>
        <Fr>
          Quelle est la date de début à laquelle les données ont été collectées
          pour la première fois?
        </Fr>
      </Typography>
      <DateInput
        name="dateStart"
        value={record.dateStart}
        onChange={handleInputChange}
        disabled={disabled}
      />
    </Paper>
    <Paper className={paperClass}>
      <Typography>
        <En>What is the start date when data was published?</En>
        <Fr>
          Quelle est la date de début à laquelle les données ont été publiées ?
        </Fr>
      </Typography>
      <DateInput
        name="datePublished"
        value={record.datePublished}
        onChange={handleInputChange}
        disabled={disabled}
      />
    </Paper>

    <Paper className={paperClass}>
      <Typography>
        <En>What is the start date when data was revised?</En>
        <Fr>Quelle est la date de début de la révision des données?</Fr>
      </Typography>
      <DateInput
        name="dateRevised"
        value={record.dateRevised}
        onChange={handleInputChange}
        disabled={disabled}
      />
    </Paper>
  </div>
);

export default IdentificationTab;
