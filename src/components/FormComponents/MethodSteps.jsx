import React from "react";
import {
  Add,
  Delete,
  ArrowUpwardSharp,
  ArrowDownwardSharp,
} from "@material-ui/icons";
import { Button, Grid, Paper } from "@material-ui/core";
// import validator from "validator";
import { En, Fr, I18n } from "../I18n";

import BilingualTextInput from "./BilingualTextInput";
import RequiredMark from "./RequiredMark";
import { deepCopy } from "../../utils/misc";
import { QuestionText, paperClass } from "./QuestionStyles";

// const validateURL = (url) => !url || validator.isURL(url);

const MethodSteps = ({ updateMethods, methods, disabled }) => {
  const emptyMethod = {
    title: { en: "", fr: "" },
    description: { en: "", fr: "" },
  };

  const nameLabel = <I18n en="Title" fr="Titre" />;
  const descriptionLabel = <I18n en="Description" fr="Description" />;

  // Extract Method as array of objects, methods are not seen as an array when 
  // returning from firebase, possibly due to nesting?
  const methodList = Object.entries(methods).map(([key, method]) => ({
    ...method,
  }));
  
  function addMethodStep() {
    updateMethods(methodList.concat(deepCopy(emptyMethod)));
  }

  // removes the method step section from the list at index i
  function removeMethodStep(i) {
    updateMethods(methodList.filter((e, index) => index !== i));
  }

  // move the method step section
  function moveMethodStep(i, newIndex) {
    if (newIndex < 0 || newIndex >= methodList.length) return;
    const element = methodList.splice(i, 1)[0];
    methodList.splice(newIndex, 0, element);
    updateMethods(methodList);
  }

  return (
    <div>
      {methodList.map((method = deepCopy(emptyMethod), i) => {
        function handleMethodStepChange(key) {
          return (e) => {
            const newValue = [...methodList];
            newValue[i][key] = e.target.value;

            updateMethods(newValue);
          };
        }
        return (
          <Paper key={i} style={paperClass}>
            <Grid container direction="column" spacing={3}>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>{i + 1}. Enter a title for this method step</En>
                    <Fr>{i + 1}. Entrez un titre pour cette étape de méthode</Fr>
                  </I18n>
                  <RequiredMark passes={method.title?.en || method.title?.fr} />
                </QuestionText>
                <BilingualTextInput
                  label={nameLabel}
                  value={method.title}
                  onChange={handleMethodStepChange("title")}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>Enter a description of this method step</En>
                    <Fr>Entrez une description de cette étape de méthode</Fr>
                  </I18n>
                </QuestionText>{" "}
                <BilingualTextInput
                  name="description"
                  label={descriptionLabel}
                  value={method.description}
                  onChange={handleMethodStepChange("description")}
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs>
                <Button
                  startIcon={<Delete />}
                  disabled={disabled}
                  onClick={() => removeMethodStep(i)}
                >
                  <I18n>
                    <En>Remove step</En>
                    <Fr>Étape de suppression</Fr>
                  </I18n>
                </Button>
                <Button
                  startIcon={<ArrowUpwardSharp />}
                  disabled={disabled || i - 1 < 0}
                  onClick={() => moveMethodStep(i, i - 1)}
                >
                  <I18n>
                    <En>Move up</En>
                    <Fr>Déplacer vers le haut</Fr>
                  </I18n>
                </Button>
                <Button
                  startIcon={<ArrowDownwardSharp />}
                  disabled={disabled || i + 1 >= methods.length}
                  onClick={() => moveMethodStep(i, i + 1)}
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
        <Button startIcon={<Add />} disabled={disabled} onClick={addMethodStep}>
          <I18n>
            <En>Add Method Step</En>
            <Fr>Étape d'ajout de méthode</Fr>
          </I18n>
        </Button>
      </Paper>
    </div>
  );
};

export default MethodSteps;
