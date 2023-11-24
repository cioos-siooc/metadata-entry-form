import React from "react";
import {
    Add,
    Delete,
    ArrowUpwardSharp,
    ArrowDownwardSharp,
} from "@material-ui/icons";
import { Button, Grid, Paper, TextField } from "@material-ui/core";
import validator from "validator";
import { En, Fr, I18n } from "../I18n";

import BilingualTextInput from "./BilingualTextInput";
import RequiredMark from "./RequiredMark";
import { deepCopy } from "../../utils/misc";
import { QuestionText, paperClass, SupplementalText } from "./QuestionStyles";

// const validateURL = (url) => !url || validator.isURL(url);

const MethodSteps = ({ updateMethods, methods, disabled }) => {
    const emptyMethod = {
        title: { en: "", fr: "" },
        description: { en: "", fr: "" },
    };

    const nameLabel = <I18n en="Title" fr="Titre" />;
    const descriptionLabel = <I18n en="Description" fr="Description" />;

    function addMethodStep() {
        updateMethods(methods.concat(deepCopy(emptyMethod)));
    }

    // removes the resource section from the list at index i
    function removeMethodStep(i) {
        updateMethods(methods.filter((e, index) => index !== i));
    }
    
    // move the resource section
    function moveMethodStep(i, newIndex) {
        if (newIndex < 0 || newIndex >= methods.length) return;
        const element = methods.splice(i, 1)[0];
        methods.splice(newIndex, 0, element);
        updateMethods(methods);
    }

    return (
        <div>
            {methods.map((method = deepCopy(emptyMethod), i) => {
                function handleMethodStepChange(key) {
                    return (e) => {
                        const newValue = [...methods];
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
                                        <En>Enter a title for this method step</En>
                                        <Fr>Entrez un titre pour cette étape de méthode</Fr>
                                    </I18n>
                                    <RequiredMark passes={method.title?.en || method.title?.fr} />
                                </QuestionText>
                                <BilingualTextInput
                                    label={nameLabel}
                                    value={method.name}
                                    onChange={handleMethodStepChange("title")}
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
                                        <En>Remove item</En>
                                        <Fr>Supprimer la ressource</Fr>
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
                        <En>Add item</En>
                        <Fr>Ajouter une ressource</Fr>
                    </I18n>
                </Button>
            </Paper>
        </div>
    );
};

export default MethodSteps;
