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
import { En, Fr, I18n } from "../I18n";
import { deepCopy } from "../../utils/misc";
import RequiredMark from "./RequiredMark";
import BilingualTextInput from "./BilingualTextInput";
import { QuestionText, SupplementalText } from "../FormComponents/QuestionStyles";

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
  }
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
              <List spacing={1}>
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
                              (documentationItem.title[language] ?? '') : documentationItem.title[language].substring(0, 50) + '...'
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
              onClick={addDocumentation}
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
                    label={<I18n en="Authority" fr="Autorité" />}
                    name="authority"
                    value={documentation.authority}
                    onChange={updateDocumentationField("authority")}
                    fullWidth
                    disabled={disabled}
                  />{" "}
                </Grid>
                <Grid item xs>
                  <TextField
                    label="Code"
                    value={documentation.code}
                    onChange={updateDocumentationField("code")}
                    fullWidth
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs>
                  <Button
                    startIcon={<Delete />}
                    disabled={disabled}
                    onClick={removeDocumentation}
                  >
                    <I18n>
                      <En>Remove item</En>
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
