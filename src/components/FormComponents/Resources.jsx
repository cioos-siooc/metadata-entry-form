import React from "react";
import { Add, Delete } from "@material-ui/icons";
import { Button, Grid, Paper, TextField } from "@material-ui/core";
import { En, Fr, I18n } from "../I18n";

import BilingualTextInput from "./BilingualTextInput";
import RequiredMark from "./RequiredMark";
import { deepCopy } from "../../utils/misc";
import { QuestionText, paperClass } from "./QuestionStyles";

const Resources = ({ updateResources, resources, disabled }) => {
  const emptyResource = { url: "", name: "", description: { en: "", fr: "" } };

  function addResource() {
    updateResources(resources.concat(deepCopy(emptyResource)));
  }

  // removes the resource section from the list at index i
  function removeResource(i) {
    updateResources(resources.filter((e, index) => index !== i));
  }
  const nameLabel = <I18n en="Name" fr="Titre" />;
  const descriptionLabel = <I18n en="Description" fr="Description" />;

  return (
    <div>
      {resources.map((dist = deepCopy(emptyResource), i) => {
        function handleResourceChange(key) {
          return (e) => {
            const newValue = [...resources];
            newValue[i][key] = e.target.value;
            updateResources(newValue);
          };
        }
        return (
          <Paper key={i} style={paperClass}>
            <Grid container direction="column" spacing={3}>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>Enter a name for the resource</En>
                    <Fr>Entrez un titre pour la ressource</Fr>
                  </I18n>
                  <RequiredMark passes={dist.name} />
                </QuestionText>
                <TextField
                  label={nameLabel}
                  value={dist.name}
                  onChange={handleResourceChange("name")}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>Enter the URL for the resource</En>
                    <Fr>Entrez l'URL de la ressource</Fr>
                  </I18n>
                  <RequiredMark passes={dist.url} />
                </QuestionText>

                <TextField
                  label="URL"
                  value={dist.url}
                  onChange={handleResourceChange("url")}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>Enter a description of the resource</En>
                    <Fr>Entrez une description de la ressource</Fr>
                  </I18n>
                </QuestionText>{" "}
                <BilingualTextInput
                  name="description"
                  label={descriptionLabel}
                  value={dist.description}
                  onChange={handleResourceChange("description")}
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs>
                <Button
                  startIcon={<Delete />}
                  disabled={disabled}
                  onClick={() => removeResource(i)}
                >
                  <I18n>
                    <En>Remove item</En>
                    <Fr>Supprimer la ressource</Fr>
                  </I18n>
                </Button>
              </Grid>
            </Grid>
          </Paper>
        );
      })}

      <Paper style={paperClass}>
        <Button startIcon={<Add />} disabled={disabled} onClick={addResource}>
          <I18n>
            <En>Add item</En>
            <Fr>Ajouter une ressource</Fr>
          </I18n>
        </Button>
      </Paper>
    </div>
  );
};

export default Resources;
