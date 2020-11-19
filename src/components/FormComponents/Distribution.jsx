import React from "react";
import { Add, Delete } from "@material-ui/icons";
import { Button, Grid, Paper, TextField } from "@material-ui/core";
import { En, Fr, I18n } from "../I18n";

import BilingualTextInput from "./BilingualTextInput";
import RequiredMark from "./RequiredMark";
import { deepCopy } from "../../utils/misc";
import { QuestionText, paperClass } from "./QuestionStyles";

const Distribution = ({ onChange, value, name, disabled }) => {
  const initial = { url: "", name: "", description: { en: "", fr: "" } };

  function addDistribution() {
    onChange({
      target: {
        name,
        value: value.concat(deepCopy(initial)),
      },
    });
  }
  function handleChange(e, i) {
    const newValue = [...value];
    const propName = e.target.name;
    newValue[i][propName] = e.target.value;
    const parentEvent = { target: { name, value: newValue } };
    onChange(parentEvent);
  }
  // removes the distribution section from the list at index i
  function removeDistribution(i) {
    onChange({
      target: { name, value: value.filter((e, index) => index !== i) },
    });
  }
  const nameLabel = <I18n en="Name" fr="Nom" />;
  const descriptionLabel = <I18n en="Description" fr="Description" />;

  return (
    <div>
      {value.map((dist = deepCopy(initial), i) => {
        const handler = (e) => handleChange(e, i);
        return (
          <Paper key={i} style={paperClass}>
            <Grid container direction="column" spacing={3}>
              <Grid item xs>
                <QuestionText>
                  <En>Enter a name for the resource</En>
                  <Fr>Entrez un nom pour la ressource</Fr>
                  <RequiredMark passes={dist.name} />
                </QuestionText>
                <TextField
                  label={nameLabel}
                  name="name"
                  value={dist.name}
                  onChange={handler}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs>
                <QuestionText>
                  <En>Enter the URL for the resource</En>
                  <Fr>Entrez l'URL de la ressource</Fr>
                  <RequiredMark passes={dist.url} />
                </QuestionText>

                <TextField
                  label="URL"
                  name="url"
                  value={dist.url}
                  onChange={handler}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs>
                <QuestionText>
                  <En>Enter a description of the resource</En>
                  <Fr>Entrez une description de la ressource</Fr>
                </QuestionText>{" "}
                <BilingualTextInput
                  name="description"
                  label={descriptionLabel}
                  value={dist.description}
                  onChange={handler}
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs>
                <Button
                  startIcon={<Delete />}
                  disabled={disabled}
                  onClick={() => removeDistribution(i)}
                >
                  <En>Remove item</En>
                  <Fr>Supprimer l'article</Fr>
                </Button>
              </Grid>
            </Grid>
          </Paper>
        );
      })}

      <Paper style={paperClass}>
        <Button
          startIcon={<Add />}
          disabled={disabled}
          onClick={addDistribution}
        >
          <En>Add item</En>
          <Fr>Ajouter un article</Fr>
        </Button>
      </Paper>
    </div>
  );
};

export default Distribution;
