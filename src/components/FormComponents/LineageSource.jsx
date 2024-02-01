import React, { useCallback, useState } from "react";
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
import { QuestionText, SupplementalText } from "./QuestionStyles";

const emptySource = {
  description: "",
  title: "",
  authority: "",
  code: "",
};

const LineageSource = ({
  updateSources,
  sources = [],
  disabled,
  paperClass,
  language,
}) => {
  const [activeSource, setActiveSource] = useState(0);

  const addSource = useCallback( () => {
    updateSources(sources.concat(deepCopy(emptySource)));
    setActiveSource(sources.length);
  },[]);

  function updateSourceField(key) {
    return (e) => {
      const sourcesCopy = [...sources];
      sourcesCopy[activeSource][key] = e.target.value;
      updateSources(sourcesCopy);
    };
  }

  const removeSource = useCallback(() =>{
    updateSources(
      sources.filter((e, index) => index !== activeSource)
    );
    if (sources.length) setActiveSource(sources.length - 2);
  },[]);



  const source = sources.length > 0 && sources[activeSource];

  return (
    <Grid container spacing={0}>
      <Grid item>
        <QuestionText>
          Source:
          <SupplementalText>
            <I18n>
              <En>
                Information about the input used in creating the resource specified by the scope. Provide
                citations to the input data. This is especially valuable for processed satellite data and
                model data. For model data, it is suggested to describe the model and its input, especially
                if their is no publication cited above to describe the model.
              </En>
              <Fr>
                Informations sur l'entrée utilisée lors de la création de la ressource spécifiée par la portée. Fournir
                citations aux données d’entrée. Ceci est particulièrement utile pour les données satellitaires traitées et
                données du modèle. Pour les données de modèle, il est suggéré de décrire le modèle et ses entrées, en particulier
                s'il n'y a pas de publication citée ci-dessus pour décrire le modèle.
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
              {sources.map((sourceItem, i) => {
                return (
                  <ListItem
                    key={i}
                    button
                    onClick={() => setActiveSource(i)}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          style={{
                            fontWeight: activeSource === i ? "bold" : "",
                          }}
                        >
                          {i + 1}. {
                            (sourceItem.description[language] ?? '').length <= 50 ?
                              (sourceItem.description[language] ?? '') : `${sourceItem.description[language].substring(0, 50)}...`
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
              onClick={addSource}
              style={{ height: "56px", marginLeft: "10px" }}
            >
              <I18n>
                <En>Add source</En>
                <Fr>Ajouter un source</Fr>
              </I18n>
            </Button>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs>
        <Grid container direction="column">
          {source && (
            <Paper style={paperClass}>
              <Grid container direction="column" spacing={2}>
                <Grid item xs>
                  <I18n>
                    <En>Description</En>
                    <Fr>Description</Fr>
                  </I18n>
                  <RequiredMark passes={source.description?.en || source.description?.fr} />
                  <BilingualTextInput
                    value={source.description}
                    onChange={updateSourceField("description")}
                    fullWidth
                    disabled={disabled}
                  />
                </Grid>

                <Grid item xs>
                  <I18n>
                    <En>Title</En>
                    <Fr>Titre</Fr>
                  </I18n>
                  <BilingualTextInput
                    value={source.title}
                    onChange={updateSourceField("title")}
                    fullWidth
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs>
                  <TextField
                    label={<I18n en="Authority" fr="Autorité" />}
                    name="authority"
                    value={source.authority}
                    onChange={updateSourceField("authority")}
                    fullWidth
                    disabled={disabled}
                  />{" "}
                </Grid>
                <Grid item xs>
                  <TextField
                    label="Code"
                    value={source.code}
                    onChange={updateSourceField("code")}
                    fullWidth
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs>
                  <Button
                    startIcon={<Delete />}
                    disabled={disabled}
                    onClick={removeSource}
                  >
                    <I18n>
                      <En>Remove item</En>
                      <Fr>Supprimer l'source</Fr>
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
export default LineageSource;
