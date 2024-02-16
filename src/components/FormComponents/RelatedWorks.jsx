import React, { useState  } from "react";
import {
  Add,
  Delete,
  FileCopy,
  DragHandle,
} from "@material-ui/icons";
import { Container, Draggable } from "react-smooth-dnd";
import {
  Button,
  Grid,
  Paper,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Tooltip,
} from "@material-ui/core";
import validator from "validator";
import arrayMove from "array-move";
import { useParams } from "react-router-dom";
import { En, Fr, I18n } from "../I18n";
import { associationTypeCode, identifierType } from "../../isoCodeLists";

import BilingualTextInput from "./BilingualTextInput";
import RequiredMark from "./RequiredMark";
import SelectInput from "./SelectInput";
import { deepCopy, deepEquals } from "../../utils/misc";
import { QuestionText, paperClass, SupplementalText } from "./QuestionStyles";
import associationTypeToIso from "../../associationTypeMapping"

const validateURL = (url) => !url || validator.isURL(url);

const RelatedWorks = ({ 
  updateResources, 
  resources,
  disabled }) => {

  const emptyResource = { title: { en: "", fr: "" }, authority: "", code: "", association_type: "", association_type_iso: ""};
  const { language } = useParams();
  const [activeResource, setActiveResource] = useState(0);
  const [currentResources, setCurrentResources] = useState(resources);
  const resourceStep = resources.length > 0 && resources[activeResource];
 
  if (!deepEquals(currentResources, resources)) {
    setCurrentResources(resources);
  }

  //  removedIndex is dragStart
  //  addedIndex is dragEnd
  const onDrop = ({ removedIndex, addedIndex }) => {
    if (removedIndex === activeResource) setActiveResource(addedIndex);
    else if (addedIndex <= activeResource && removedIndex > activeResource)
      setActiveResource(activeResource + 1);

    const reorderedContacts = arrayMove(
      currentResources,
      removedIndex,
      addedIndex
    );
    updateResources(reorderedContacts);
  };

  function addResource() {
    updateResources(resources.concat(deepCopy(emptyResource)));
    setActiveResource(resources.length);
  }

  // removes the resource section from the list at index i
  function removeResource(i) {
    updateResources(resources.filter((e, index) => index !== i));
    if (resources.length) setActiveResource(resources.length - 2);
  }

  function duplicateResource(i) {
    const duplicatedResource = deepCopy(resources[i]);
    if (duplicatedResource.title?.en) {
      duplicatedResource.title.en += " (Copy)";
    }
    if (duplicatedResource.title?.fr) {
      duplicatedResource.title.fr += " (Copie)";
    }
    updateResources(resources.concat(duplicatedResource));
  }

  function handleResourceChange(key) {
    return (e) => {
      const newValue = [...resources];
      newValue[activeResource][key] = e.target.value;
      updateResources(newValue);
    };
  }

  function handleAssociationTypeChange() {
    return (e) => {
      const newValue = [...resources];
      newValue[activeResource].association_type_iso = associationTypeToIso[e.target.value];
      newValue[activeResource].association_type = e.target.value;
      updateResources(newValue);
    };
  }

  function urlIsValid(url) {
    return !url || validateURL(url);
  }

  function handleIdentifierChange(key) {
    return (e) => {

      const newValue = [...resources];
      newValue[activeResource][key] = e.target.value;

      const s = newValue[activeResource].code
      switch (true) {
        case urlIsValid(newValue[activeResource].code) && /^http.?:\/\/doi\.org\//i.test(s):
          newValue[activeResource].authority = 'DOI'
          break;
        case urlIsValid(newValue[activeResource].code):
          newValue[activeResource].authority = 'URL'
          break;
        default:
          newValue[activeResource].authority = ''
          break;
      }
      updateResources(newValue);
    };
  }
  return (
    <Paper style={paperClass}>
      <Grid container direction="row" spacing={1}>
        <Grid item xs={4}>
          <Grid container direction="column" spacing={2}>
            <Grid item xs>
              {/* <QuestionText>
                <I18n>
                  <En>Related Works:</En>
                  <Fr>Travaux connexes:</Fr>
                </I18n>
              </QuestionText> */}
              <List>
                <Container
                  dragHandleSelector=".drag-handle"
                  lockAxis="y"
                  onDrop={onDrop}
                >
                  {resources.map((resourceItem, idx) => {
                    return (
                      <Draggable key={idx}>
                        <ListItem
                          key={idx}
                          button
                          onClick={() => setActiveResource(idx)}
                        >
                          <ListItemText
                            primary={
                              <Typography
                                style={{
                                  fontWeight: activeResource === idx ? "bold" : "",
                                  marginRight: "72px",
                                }}
                              >
                                {idx + 1}. {
                                  (resourceItem.title[language] ?? '').length <= 50 ?
                                    (resourceItem.title[language] ?? '') : `${resourceItem.title[language].substring(0, 50)}...`

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
                                  onClick={() => duplicateResource(idx)}
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
                                  onClick={() => removeResource(idx)}
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
                onClick={() => addResource()}
                style={{ height: "56px", marginLeft: "10px" }}
              >
                <I18n>
                  <En>Add resource</En>
                  <Fr>Ajouter une ressource</Fr>
                </I18n>
              </Button>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs>
          {resourceStep && (
          <Paper variant="outlined" style={{ padding: 10 }}>
            <Grid container direction="column" spacing={3}>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>Enter the title of the related resource</En>
                    <Fr>Entrez le titre de l'œuvre concernée</Fr>
                  </I18n>
                  <RequiredMark passes={resourceStep.title?.en || resourceStep.title?.fr} />
                </QuestionText>{" "}
                <BilingualTextInput
                  name="title"
                  label={<I18n en="Title" fr="Titre" />}
                  value={resourceStep.title}
                  onChange={handleResourceChange("title")}
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>Enter the identifier for the related resource</En>
                    <Fr>Saisissez l'identifiant de l'œuvre concernée</Fr>
                  </I18n>

                  <RequiredMark passes={resourceStep.code} />
                  <SupplementalText>
                    <I18n>
                      <En>
                        <p>
                          The identifier may be to a resource, or metadata record on another
                          repository or another record within CIOOS. A DOI or full URL are preferred.
                        </p>
                      </En>
                      <Fr>
                        <p>
                          L'identifiant peut provenir d'une ressource ou d'un enregistrement de métadonnées sur un autre
                          référentiel ou un autre enregistrement dans CIOOS. Un DOI ou une URL complète sont préférés.
                        </p>
                      </Fr>
                    </I18n>
                  </SupplementalText>
                </QuestionText>
                <TextField
                  label={<I18n en="Identifier" fr="identifiant" />}
                  value={resourceStep.code}
                  onChange={handleIdentifierChange("code")}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>Enter the identifier type</En>
                    <Fr>Entrez le type d'identifiant</Fr>
                  </I18n>
                  <RequiredMark passes={resourceStep.authority} />
                </QuestionText>

                <SelectInput
                  value={resourceStep.authority}
                  onChange={handleResourceChange("authority")}
                  options={identifierType}
                  optionLabels={identifierType}
                  disabled={disabled}
                  label={< I18n en="Identifier Type" fr="Type d'identifiant" />}
                  fullWidth={false}
                />
              </Grid>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>What is the relation type?</En>
                    <Fr>
                      Quel est le type de relation?</Fr>
                  </I18n>
                  <RequiredMark passes={resourceStep.association_type} />
                  <SupplementalText>
                    <I18n>
                      <En>
                        <p>
                          Specify the relationship from (A) the primary resource; to (B) the related resource. For example:
                        </p>
                        <ul>
                          <li>Use 'Is New Version Of' to indicate the primary resource described in this metadata record (A) is a new version of (B) the related resource.</li>
                          <li>Use 'Is Part of' to indicate the primary resource (A) is a subset of (B) the related larger resource.</li>
                          <li>Use 'Has Part' to indicate the primary resource (A) is the larger work that includes (B) the related resource.</li>
                          <li>Use 'Cites' to indicate that (A) cites (B).</li>
                          <li>Use 'Is Cited by to indicate that (B) cites (A)</li>
                        </ul>

                      </En>
                      <Fr>
                        <p>
                          Spécifiez la relation à partir de (A) la ressource principale ; à (B) la ressource associée. Par exemple:
                        </p>
                        <ul>
                          <li>Utilisez "Est une nouvelle version de" pour indiquer que la ressource principale décrite dans cet enregistrement de métadonnées (A) est une nouvelle version de (B) la ressource associée.</li>
                          <li>Utilisez "Fait partie de" pour indiquer que la ressource principale (A) est un sous-ensemble de (B) la ressource plus grande associée.</li>
                          <li>Utilisez "A une partie" pour indiquer que la ressource principale (A) est le travail le plus important qui comprend (B) la ressource associée.</li>
                          <li>Utilisez "Cites" pour indiquer que (A) cite (B).</li>
                          <li>Utilisez "Est cité par" pour indiquer que (B) cite (A)</li>
                        </ul>

                      </Fr>
                    </I18n>
                  </SupplementalText>
                </QuestionText>
                <SelectInput
                  value={resourceStep.association_type}
                  onChange={handleAssociationTypeChange()}
                  options={Object.keys(associationTypeCode)}
                  optionLabels={Object.values(associationTypeCode).map(
                    ({ title }) => title[language]
                  )}
                  optionTooltips={Object.values(associationTypeCode).map(
                    ({ text }) => text[language]
                  )}
                  disabled={disabled}
                  label={<I18n en="Relation Type" fr="Type de relation" />}
                  fullWidth={false}
                />
              </Grid>
              
            </Grid>
          </Paper>)}
        </Grid> 
      </Grid>
    </Paper>
  );
};

export default RelatedWorks;
