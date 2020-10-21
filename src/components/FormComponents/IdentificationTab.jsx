import React from "react";
import { Paper, TextField, Typography, Grid } from "@material-ui/core";
import { En, Fr } from "../I18n";
import { eovList, progressCodes } from "../../isoCodeLists";

import BilingualTextInput from "./BilingualTextInput";
import CheckBoxList from "./CheckBoxList";
import DateInput from "./DateInput";
import KeywordsInput from "./KeywordsInput";
import SelectInput from "./SelectInput";
import { camelToSentenceCase } from "../../utils/misc";
import categoryList from "../../categoryList";
import RequiredMark from "./RequiredMark";

const IdentificationTab = ({
  disabled,
  record,
  handleInputChange,
  paperClassValidate,
  paperClass,
}) => {
  return (
    <div>
      <Paper style={paperClassValidate("identifier")}>
        <Typography>
          <En>Dataset unique ID</En>
          <Fr>Identifiant unique de ce jeu de données</Fr>
          <RequiredMark />
        </Typography>
        <TextField
          name="identifier"
          value={record.identifier}
          onChange={(e) => handleInputChange(e)}
          disabled
          fullWidth
        />
      </Paper>

      <Paper style={paperClassValidate("title")}>
        <Typography>
          <En>What is the dataset title? Required in both languages</En>
          <Fr>
            Quel est le titre du jeu de données? Requis dans les deux langues
          </Fr>
          <RequiredMark />
        </Typography>
        <BilingualTextInput
          name="title"
          value={record.title}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </Paper>

      <Paper style={paperClassValidate("abstract")}>
        <Typography>
          <En>What is the dataset abstract? Required in both languages</En>
          <Fr>
            Quelle est la description de ce jeu de données? Requis dans les deux
            langues
          </Fr>
          <RequiredMark />
        </Typography>
        <BilingualTextInput
          name="abstract"
          value={record.abstract}
          onChange={handleInputChange}
          disabled={disabled}
          multiline
        />
      </Paper>

      <Paper style={paperClassValidate("eov")}>
        <Typography>
          <En>
            Please select all the essential ocean variables that are contained
            in this dataset
          </En>
          <Fr>
            Veuillez sélectionner toutes les variables océaniques essentielles
            contenues dans cet ensemble de données
          </Fr>
          <RequiredMark />
        </Typography>
        <CheckBoxList
          name="eov"
          value={record.eov || []}
          onChange={handleInputChange}
          options={eovList}
          optionLabels={eovList.map(camelToSentenceCase)}
          disabled={disabled}
        />
      </Paper>
      <Paper style={paperClassValidate("keywords")}>
        <Grid container spacing={3} direction="column">
          <Grid item xs>
            <Typography>
              <En>
                What are the keywords that describe the dataset? (use "," as
                separator)
              </En>
              <Fr>
                Quels sont les mots clefs qui décrivent votre jeu de données?
                (utilisez "," comme séparateur)
              </Fr>
              <RequiredMark />
            </Typography>
          </Grid>
          <Grid item xs>
            <KeywordsInput
              name="keywords"
              value={record.keywords}
              onChange={handleInputChange}
              disabled={disabled}
            />
          </Grid>
        </Grid>
      </Paper>
      <Paper style={paperClassValidate("progress")}>
        <Typography>
          <En>What is the status of this dataset?</En>
          <Fr>Quel est l'état de ce jeu de données?</Fr>
          <RequiredMark />
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
      <Paper style={paperClassValidate("category")}>
        <Typography>
          <En>In which category does this dataset best fit in?</En>
          <Fr>Quelle catégorie convient le mieux à ce dataset?</Fr>
          <RequiredMark />
        </Typography>
        <SelectInput
          name="category"
          value={record.category || ""}
          onChange={(e) => handleInputChange(e)}
          options={categoryList}
          optionLabels={categoryList.map(camelToSentenceCase)}
          disabled={disabled}
        />
      </Paper>

      <Paper style={paperClass}>
        <Typography>
          <En>What is the start date when data was first collected?</En>
          <Fr>
            Quelle est la date de début à laquelle les données ont été
            collectées pour la première fois?
          </Fr>
        </Typography>
        <DateInput
          name="dateStart"
          value={record.dateStart || null}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </Paper>
      <Paper style={paperClassValidate("datePublished")}>
        <Typography>
          <En>What is the start date when data was published?</En>
          <Fr>
            Quelle est la date de début à laquelle les données ont été publiées
            ?
          </Fr>
          <RequiredMark />
        </Typography>
        <DateInput
          name="datePublished"
          value={record.datePublished || null}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </Paper>

      <Paper style={paperClass}>
        <Typography>
          <En>What is the start date when data was revised?</En>
          <Fr>Quelle est la date de début de la révision des données?</Fr>
        </Typography>
        <DateInput
          name="dateRevised"
          value={record.dateRevised || null}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </Paper>
    </div>
  );
};

export default IdentificationTab;
