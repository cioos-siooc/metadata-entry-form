import React, { useState } from "react";
import {
  Add,
  Delete,
  FileCopy,
  DragHandle,
} from "@material-ui/icons";
import { Container, Draggable } from "react-smooth-dnd";
import {
  Grid,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Tooltip,
} from "@material-ui/core";
import arrayMove from "array-move";
import { En, Fr, I18n } from "../I18n";
import { deepCopy, deepEquals } from "../../utils/misc";
import { metadataScopeCodes } from "../../isoCodeLists";
import RequiredMark from "./RequiredMark";
import AdditionalDocumentation from "./LineageAdditionalDocumentation"
import LineageSource from "./LineageSource";
import ProcessingStep from "./LineageProcessingStep";
import SelectInput from "./SelectInput";
import BilingualTextInput from "./BilingualTextInput";
import { QuestionText, SupplementalText } from "./QuestionStyles";

const emptyLineage = {
  statement: "",
  scope: "",
  additionalDocumentation: [],
  source: [],
  processingStep: [],
};

const Lineage = ({
  updateLineage,
  history,
  disabled,
  paperClass,
  language,
}) => {

  const [activeLineage, setActiveLineage] = useState(0);
  const [currentLineage, setCurrentLineage] = useState(history);

  function addLineage() {
    updateLineage(history.concat(deepCopy(emptyLineage)));
    setActiveLineage(history.length);
  };

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

  function removeLineage(i) {
    updateLineage(
      history.filter((e, index) => index !== i)
    );
    if (history.length) setActiveLineage(history.length - 2);
  };

  if (typeof history === "string") {
    const item = deepCopy(emptyLineage)
    if (history !== '') {
      item.statement = {
        en: history, fr: history,
      }
    }
    updateLineage([deepCopy(item)]);
  }

  function duplicateLineage(i) {
    const newLineage = deepCopy(history[i]);
    if (newLineage.name?.en) {
      newLineage.name.en += " (Copy)";
    }
    if (newLineage.name?.fr) {
      newLineage.name.fr += " (Copie)";
    }
    updateLineage(history.concat(newLineage));
  }

  //  removedIndex is dragStart
  //  addedIndex is dragEnd
  const onDrop = ({ removedIndex, addedIndex }) => {
    if (removedIndex === activeLineage) setActiveLineage(addedIndex);
    else if (addedIndex <= activeLineage && removedIndex > activeLineage)
      setActiveLineage(activeLineage + 1);

    const reorderedContacts = arrayMove(
      currentLineage,
      removedIndex,
      addedIndex
    );
    updateLineage(reorderedContacts);
  };

  if (!deepEquals(currentLineage, history)) {
    setCurrentLineage(history);
  }
  const lineageStep = history.length > 0 && history[activeLineage];

  return (
    <Paper variant="outlined" style={{ padding: 10 }}>
      <Grid container direction="row" spacing={1}>
        <Grid item xs={3}>
          <Grid container direction="column" spacing={2}>
            <Grid item xs>
              <List>
                <Container
                  dragHandleSelector=".drag-handle"
                  lockAxis="y"
                  onDrop={onDrop}
                >
                  {history.map((lineageItem, i) => {
                    return (
                      <Draggable key={i}>
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
                                  marginRight: "72px",
                                }}
                              >
                                {i + 1}. {
                                  (lineageItem.statement[language] ?? '').length <= 50 ?
                                    (lineageItem.statement[language] ?? '') : `${lineageItem.statement[language].substring(0, 50)}...`

                                }
                              </Typography>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Tooltip
                              title={
                                <I18n
                                  en="Duplicate contact"
                                  fr="Duplicate contact"
                                />
                              }
                            >
                              <span>
                                <IconButton
                                  onClick={() => duplicateLineage(i)}
                                  edge="end"
                                  aria-label="clone"
                                  disabled={disabled}
                                >
                                  <FileCopy />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip
                              title={
                                <I18n
                                  en="Remove from this record"
                                  fr="Supprimer de cet enregistrement"
                                />
                              }
                            >
                              <span>
                                <IconButton
                                  onClick={() => removeLineage(i)}
                                  edge="end"
                                  aria-label="clone"
                                  disabled={disabled}
                                >
                                  <Delete />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip
                              title={
                                <I18n en="Drag to reorder" fr="Faites glisser pour réorganiser" />
                              }
                            >
                              <span>
                                <IconButton
                                  className="drag-handle"
                                  edge="end"
                                  aria-label="clone"
                                  disabled={disabled}
                                >
                                  <DragHandle />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </Draggable>
                    );
                  })}
                </Container>
              </List>
            </Grid>

            <Grid item xs>
              <Button
                disabled={disabled}
                startIcon={<Add />}
                onClick={() => addLineage()}
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
          {lineageStep && (
            <Paper variant="outlined" style={{ padding: 10 }}>
              <Grid container direction="column" spacing={3}>
                <Grid item xs>
                  <QuestionText>
                    <I18n>
                      <En>Lineage Description</En>
                      <Fr>Description de la lignée</Fr>
                    </I18n>
                    <RequiredMark passes={lineageStep.statement?.en || lineageStep.statement?.fr} />
                    <SupplementalText>
                      <I18n>
                        <En>
                          General explanation of the lineage step or sampling methods. For detailed
                          processing steps or methods use the processing and method step question
                        </En>
                        <Fr>
                          Explication générale de l'étape de lignage ou des méthodes d'échantillonnage.
                          Pour des étapes ou des méthodes de traitement détaillées, utilisez
                          la question sur les étapes de traitement et de méthode.
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
                  <ProcessingStep
                    sources={lineageStep.processingStep}
                    updateSources={updateLineageSubField("processingStep")}
                    disabled={disabled}
                    paperClass={paperClass}
                    language={language}
                  />
                </Grid>
              </Grid>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};
export default Lineage;
