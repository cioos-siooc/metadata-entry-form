import React, { useState } from "react";
import { Add, Delete } from "@material-ui/icons";
import {
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
import { metadataScopeCodes } from "../../isoCodeLists";
import RequiredMark from "./RequiredMark";
import AdditionalDocumentation from "./LineageAdditionalDocumentation"
import LineageSource from "./LineageSource";
import SelectInput from "./SelectInput";
import BilingualTextInput from "./BilingualTextInput";
import { QuestionText, SupplementalText } from "../FormComponents/QuestionStyles";

const emptyLineage = {
    statement: "",
    scope: "",
    additionalDocumentation: [],
    source: [],
};

const Lineage = ({
    updateLineage,
    history = [],
    disabled,
    paperClass,
    language,
}) => {

    const [activeLineage, setActiveLineage] = useState(0);

    function addLineage() {
        updateLineage(history.concat(deepCopy(emptyLineage)));
        setActiveLineage(history.length);
    }
    function updateLineageField(key) {
        return (e) => {

            const lineageCopy = [...history];
            lineageCopy[activeLineage][key] = e.target.value;
            updateLineage(lineageCopy);
        };
    }
    function updateLineageSubField(key) {
        return (e) => {
            const lineageCopy = [...history];
            lineageCopy[activeLineage][key] = e;
            updateLineage(lineageCopy);
        };
    }
    function removeLineage() {
        updateLineage(
            history.filter((e, index) => index !== activeLineage)
        );
        if (history.length) setActiveLineage(history.length - 2);
    }

    if (typeof history === "string") {
        const item = deepCopy(emptyLineage)
        if (history !== '') {
            item['statement'] = {
                en: history, fr: history,
            }
        }
        history = [deepCopy(item)];
    }

    // const manufacturerLabel = <I18n en="Manufacturer" fr="Fabricant" />;
    // const versionLabel = <I18n en="Version" fr="Version" />;
    // const typeLabel = <I18n en="Type" fr="Type" />;
    // const descriptionLabel = <I18n en="Description" fr="Description" />;
    const lineageStep = history.length > 0 && history[activeLineage];

    return (


        <Grid container direction="row" spacing={3}>
            <Grid item xs={3}>
                <Grid container direction="column" spacing={2}>
                    <Grid item xs>
                        <QuestionText>
                        <I18n>
                            <En>Lineage:</En>
                            <Fr>Lignée:</Fr>
                        </I18n>
                        </QuestionText>
                        <List>
                            {history.map((lineageItem, i) => {
                                return (
                                    <ListItem
                                        key={i}
                                        button
                                        onClick={() => setActiveLineage(i)}
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography
                                                    style={{
                                                        fontWeight: activeLineage === i ? "bold" : "",
                                                    }}
                                                >
                                                    {i + 1}. {
                                                        (lineageItem.statement[language] ?? '').length <= 50 ?
                                                            (lineageItem.statement[language] ?? '') : lineageItem.statement[language].substring(0, 50) + '...'

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
                            onClick={addLineage}
                            style={{ height: "56px", marginLeft: "10px" }}
                        >
                            <I18n>
                                <En>Add Lineage</En>
                                <Fr>Ajouter une lignée</Fr>
                            </I18n>
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs>
                <Grid container direction="column">
                    {lineageStep && (
                        <Paper style={paperClass}>
                            <Grid container direction="column" spacing={2}>
                                <Grid item xs>
                                    <QuestionText>
                                    <I18n>
                                        <En>Lineage Statement</En>
                                        <Fr>Déclaration de lignée</Fr>
                                    </I18n>
                                    <RequiredMark passes={lineageStep.statement} />
                                        <SupplementalText>
                                            <I18n>
                                                <En>
                                                    General explanation of the level of knowledge or lack thereof about the lineage.
                                                </En>
                                                <Fr>
                                                    Explication générale du niveau de connaissance ou du manque de connaissances sur la lignée.
                                                </Fr>
                                            </I18n>
                                        </SupplementalText>
                                    </QuestionText>
                                    <BilingualTextInput
                                        value={lineageStep.statement}
                                        onChange={updateLineageField("statement")}
                                        fullWidth
                                        disabled={disabled}
                                    />
                                </Grid>
                                <Grid item xs>
                                    <QuestionText>
                                    <I18n>
                                        <En>Scope</En>
                                        <Fr>Portée</Fr>
                                    </I18n>
                                        <SupplementalText>
                                            <I18n>
                                                <En>
                                                    Type of resource and/or extent to which the lineage information applies.
                                                </En>
                                                <Fr>
                                                    Type de ressource et/ou mesure dans laquelle les informations sur la lignée s'appliquent.
                                                </Fr>
                                            </I18n>
                                        </SupplementalText>
                                    </QuestionText>
                                    <SelectInput
                                        value={lineageStep.scope}
                                        onChange={updateLineageField("scope")}
                                        options={Object.keys(metadataScopeCodes)}
                                        optionLabels={Object.values(metadataScopeCodes).map(
                                            ({ title }) => title[language]
                                        )}
                                        disabled={disabled}
                                        fullWidth
                                        label={<I18n en="Scope" fr="???" />}
                                    />
                                </Grid>
                                <Grid item xs>
                                    <AdditionalDocumentation
                                        documentations={lineageStep.additionalDocumentation}
                                        updateDocumentations={updateLineageSubField("additionalDocumentation")}
                                        disabled={disabled}
                                        paperClass={paperClass}
                                        language={language}
                                    />
                                </Grid>
                                <Grid item xs>
                                    <LineageSource
                                        sources={lineageStep.source}
                                        updateSources={updateLineageSubField("source")}
                                        disabled={disabled}
                                        paperClass={paperClass}
                                        language={language}
                                    />
                                </Grid>
                                <Grid item xs>
                                    <Button
                                        startIcon={<Delete />}
                                        disabled={disabled}
                                        onClick={removeLineage}
                                    >
                                        <I18n>
                                            <En>Remove item</En>
                                            <Fr>Supprimer l'instrument</Fr>
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
export default Lineage;
