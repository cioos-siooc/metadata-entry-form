import React from "react";
import { Add, Delete, ArrowUpwardSharp, ArrowDownwardSharp } from "@material-ui/icons";
import { Button, Grid, Paper, TextField } from "@material-ui/core";
import validator from "validator";
import { En, Fr, I18n } from "../I18n";

import BilingualTextInput from "./BilingualTextInput";
import RequiredMark from "./RequiredMark";
import { deepCopy } from "../../utils/misc";
import { QuestionText, paperClass, SupplementalText } from "./QuestionStyles";

const validateURL = (url) => !url || validator.isURL(url);

const Resources = ({ updateResources, resources, disabled }) => {
  const emptyResource = { url: "", name: "", description: { en: "", fr: "" } };

  function addResource() {
    updateResources(resources.concat(deepCopy(emptyResource)));
  }

  // removes the resource section from the list at index i
  function removeResource(i) {
    updateResources(resources.filter((e, index) => index !== i));
  }

  // move the resource section 
  function moveResource(i, newIndex) {
    if (newIndex < 0 || newIndex >= resources.length)
      return;
    const element = resources.splice(i, 1)[0]
    resources.splice(newIndex, 0, element)
    updateResources(resources);
  }
  const nameLabel = <I18n en="Name" fr="Titre" />;
  const descriptionLabel = <I18n en="Description" fr="Description" />;

  return (
    <div>
      {resources.map((dist = deepCopy(emptyResource), i) => {
        const urlIsValid = !dist.url || validateURL(dist.url);
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
                  <RequiredMark passes={dist.name?.en || dist.name?.fr} />
                </QuestionText>
                <BilingualTextInput
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
                    <Fr>
                      Le lien peut être vers une ressource de données formelle
                      sur un autre un référentiel ou un lien vers un lecteur en
                      ligne personnel (par exemple Google Entraînement).
                    </Fr>
                  </I18n>

                  <RequiredMark passes={validator.isURL(dist.url)} />
                  <SupplementalText>
                    <I18n>
                      <En>
                        <p>
                          The link may be to a formal data resource on another
                          repository or a link to a personal online drive (e.g.
                          Google Drive).
                        </p>
                      </En>
                      <Fr>
                        <p>
                          Le lien peut être vers une ressource de données
                          formelle sur un autre un référentiel ou un lien vers
                          un lecteur en ligne personnel (par exemple Google
                          Entraînement).
                        </p>
                      </Fr>
                    </I18n>
                  </SupplementalText>
                </QuestionText>

                <TextField
                  helperText={
                    !urlIsValid && <I18n en="Invalid URL" fr="URL non valide" />
                  }
                  error={!urlIsValid}
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
                <Button
                  startIcon={<ArrowUpwardSharp />}
                  disabled={disabled || i - 1 < 0}
                  onClick={() => moveResource(i, i - 1)}
                >
                  <I18n>
                    <En>Move up</En>
                    <Fr>Déplacer vers le haut</Fr>
                  </I18n>
                </Button>
                <Button
                  startIcon={<ArrowDownwardSharp />}
                  disabled={disabled || i + 1 >= resources.length}
                  onClick={() => moveResource(i, i + 1)}
                >
                  <I18n>
                    <En>Move down</En>
                    <Fr>Déplacer vers le bas</Fr>
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
