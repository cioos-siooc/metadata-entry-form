import React, { useState } from "react";
import { Add, Delete } from "@material-ui/icons";
import {
  TextField,
  Grid,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@material-ui/core";
import validator from "validator";
import SelectInput from "./SelectInput";
import { En, Fr, I18n } from "../I18n";
import { deepCopy } from "../../utils/misc";
import RequiredMark from "./RequiredMark";
import BilingualTextInput from "./BilingualTextInput";
import { QuestionText, SupplementalText } from "./QuestionStyles";
import { identifierType } from "../../isoCodeLists";

const validateURL = (url) => !url || validator.isURL(url);

const emptyDocumentation = {
  title: "",
  authority: "",
  code: "",
};

const LineageAdditionalDocumentation = ({
  updateDocumentations,
  documentations = [],
  disabled,
  paperClass,
  language,
}) => {
  const [activeDocumentation, setActiveDocumentation] = useState(0);

  function addDocumentation() {
    updateDocumentations(documentations.concat(deepCopy(emptyDocumentation)));
    setActiveDocumentation(documentations.length);
  };

  function updateDocumentationField(key) {
    return (e) => {
      const documentationsCopy = [...documentations];
      documentationsCopy[activeDocumentation][key] = e.target.value;
      updateDocumentations(documentationsCopy);
    };
  }
  function removeDocumentation() {
    updateDocumentations(
      documentations.filter((e, index) => index !== activeDocumentation)
    );
    if (documentations.length) setActiveDocumentation(documentations.length - 2);
  };

  function urlIsValid(url) {
    return !url || validateURL(url);
  }

  function handleIdentifierChange(key) {
    return (e) => {

      const newValue = [...documentations];
      newValue[activeDocumentation][key] = e.target.value;

      const s = newValue[activeDocumentation].code
      switch (true) {
        case urlIsValid(newValue[activeDocumentation].code) && /^http.?:\/\/doi\.org\//i.test(s):
          newValue[activeDocumentation].authority = 'DOI'
          break;
        case urlIsValid(newValue[activeDocumentation].code):
          newValue[activeDocumentation].authority = 'URL'
          break;
        default:
          newValue[activeDocumentation].authority = ''
          break;
      }
      updateDocumentations(newValue);
    };
  }

  const documentation = documentations.length > 0 && documentations[activeDocumentation];

  return (
    <Grid container spacing={0}>
      <Grid item>
        <QuestionText>
          <I18n>
            <En>Additional Documentation:</En>
            <Fr>Documentation Supplémentaire:</Fr>
          </I18n>
          <SupplementalText>
            <I18n>
              <En>
                A citation to additional lineage documentation. This could be a publication that describes the whole process, dataset, or model.
              </En>
              <Fr>
                Une citation à une documentation supplémentaire sur la lignée. Il peut s'agir d'une publication décrivant l'ensemble du processus, de l'ensemble de données ou du modèle.
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>
      </Grid>


      <Grid container item direction="row" spacing={1}>
        <Grid item xs={4}>
          <Grid container direction="column" spacing={1}>
            <Grid item xs>
              <List>
              {documentations.map((documentationItem, i) => {
                return (
                  <ListItem
                    key={i}
                    button
                    onClick={() => setActiveDocumentation(i)}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          style={{
                            fontWeight: activeDocumentation === i ? "bold" : "",
                          }}
                        >
                          {i + 1}. {
                            (documentationItem.title[language] ?? '').length <= 50 ?
                              (documentationItem.title[language] ?? '') : `${documentationItem.title[language].substring(0, 50)}...`
                          }
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Grid>

          <Grid item xs>
            <Button
              disabled={disabled}
              startIcon={<Add />}
              onClick={() => addDocumentation()}
              style={{ height: "56px", marginLeft: "10px" }}
            >
              <I18n>
                <En>Add documentation</En>
                <Fr>Ajouter un documentation</Fr>
              </I18n>
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs>
        <Grid container direction="column">
          {documentation && (
            <Paper style={paperClass}>
              <Grid container direction="column" spacing={2}>
                <Grid item xs>
                  <I18n>
                    <En>Title</En>
                    <Fr>Titre</Fr>
                  </I18n>
                  <RequiredMark passes={documentation.title?.en || documentation.title?.fr} />
                  <BilingualTextInput
                    value={documentation.title}
                    onChange={updateDocumentationField("title")}
                    fullWidth
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs>
                  <TextField
                    label="Identifier or URL"
                    value={documentation.code}
                    onChange={handleIdentifierChange("code")}
                    fullWidth
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs>
                  <QuestionText>
                    <I18n>
                      <En>Enter the identifier type</En>
                      <Fr>Entrez le type d'identifiant</Fr>
                    </I18n>
                    {documentation?.code && (
                      <RequiredMark passes={documentation.authority} />
                    )}
                  </QuestionText>

                  <SelectInput
                    value={documentation.authority}
                    onChange={updateDocumentationField("authority")}
                    options={identifierType}
                    optionLabels={identifierType}
                    disabled={disabled}
                    label={< I18n en="Identifier Type" fr="Type d'identifiant" />}
                    fullWidth={false}
                  />
                </Grid>
                <Grid item xs>
                  <Button
                    startIcon={<Delete />}
                    disabled={disabled}
                    onClick={() => removeDocumentation()}
                  >
                    <I18n>
                      <En>Remove documentation</En>
                      <Fr>Supprimer l'documentation</Fr>
                    </I18n>
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Grid>
    </Grid>
  );
};
export default LineageAdditionalDocumentation;
