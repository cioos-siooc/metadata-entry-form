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

  function addSource() {
    updateSources(sources.concat(deepCopy(emptySource)));
    setActiveSource(sources.length);
  }
  function updateSourceField(key) {
    return (e) => {
      const sourcesCopy = [...sources];
      sourcesCopy[activeSource][key] = e.target.value;
      updateSources(sourcesCopy);
    };
  }
  function removeSource() {
    updateSources(
      sources.filter((e, index) => index !== activeSource)
    );
    if (sources.length) setActiveSource(sources.length - 2);
  }



  const source = sources.length > 0 && sources[activeSource];

  return (
    <Grid container direction="row" spacing={3}>
      <Grid item xs={4}>
        <Grid container direction="column" spacing={2}>
          <Grid item xs>
            Source:
            <List>
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
                              (sourceItem.description[language] ?? '') : sourceItem.description[language].substring(0, 50) + '...'
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
  );
};
export default LineageSource;
