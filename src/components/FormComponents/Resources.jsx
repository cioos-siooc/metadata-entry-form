import React, { useContext, useEffect, useState, useRef } from "react";
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
import debounce from "just-debounce-it";
import arrayMove from "array-move";
import { useParams } from "react-router-dom";
import { En, Fr, I18n } from "../I18n";
import BilingualTextInput from "./BilingualTextInput";
import RequiredMark from "./RequiredMark";
import { deepCopy, deepEquals } from "../../utils/misc";
import { validateURL } from "../../utils/validate";
import { 
  QuestionText, 
  // paperClass, 
  SupplementalText,
} from "./QuestionStyles";
import { UserContext } from "../../providers/UserProvider";

const Resources = ({ 
  updateResources, 
  resources, 
  disabled,
}) => {
  const mounted = useRef(false);
  const { checkURLActive } = useContext(UserContext);
  const { language } = useParams();
  const [urlIsActive, setUrlIsActive] = useState({});
  const emptyResource = { url: "", name: "", description: { en: "", fr: "" } };
  const [activeResource, setActiveResource] = useState(0);
  const [currentResources, setCurrentResources] = useState(resources);

  const debouncePool = useRef({});

  useEffect( () => {

    mounted.current = true

    resources.forEach( (resource, idx) => {
      
      if (resource.url && validateURL(resource.url)) {
        if (!debouncePool.current[idx]){
          debouncePool.current[idx] = debounce( async (innerResource) => {
            const response = await checkURLActive(innerResource.url)
            if (mounted.current){
              setUrlIsActive((prevStatus) => ({ ...prevStatus, [innerResource.url]: response.data }))
            }
          }, 500);
        }
        debouncePool.current[idx](resource);
      }
    });
    
    return () => {
      mounted.current = false;
    };
  }, [resources, checkURLActive]);

  if (!deepEquals(currentResources, resources)) {
    setCurrentResources(resources);
  }

  const nameLabel = <I18n en="Name" fr="Titre" />;
  const descriptionLabel = <I18n en="Description" fr="Description" />;
  const resourceStep = resources.length > 0 && resources[activeResource];
  const urlIsValid = resourceStep && (!resourceStep.url || validateURL(resourceStep.url));

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
    if (duplicatedResource.name?.en){
      duplicatedResource.name.en += " (Copy)";  
    }
    if (duplicatedResource.name?.fr) {
      duplicatedResource.name.fr += " (Copie)";
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

  return (
    <Paper variant="outlined" style={{ padding: 10 }}>
      <Grid container direction="row" spacing={1}>
        <Grid item xs={3}>
          <Grid container direction="column" spacing={2}>
            {resources && resources.length > 0 && (
            <Grid item xs>
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
                              (resourceItem.name[language] ?? '').length <= 50 ?
                                (resourceItem.name[language] ?? '') : `${resourceItem.name[language].substring(0, 50)}...`

                            }
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip
                          title={
                            <I18n
                              en="Duplicate contact"
                              fr="Contact en double"
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
            )}

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
                      <En>Enter a name for the resource</En>
                      <Fr>Entrez un titre pour la ressource</Fr>
                    </I18n>
                      <RequiredMark passes={resourceStep.name?.en || resourceStep.name?.fr} />
                  </QuestionText>
                  <BilingualTextInput
                    name="name"
                    label={nameLabel}
                    value={resourceStep.name}
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

                      <RequiredMark passes={validator.isURL(resourceStep.url)} />
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
                            Ce lien peut renvoyer vers une ressource de données
                            sur un autre dépôt de données ou un lien vers
                            un espace de stockage personnel en ligne (par exemple, Google
                            Drive).
                          </p>
                        </Fr>
                      </I18n>
                    </SupplementalText>
                  </QuestionText>

                  <TextField
                    helperText={
                      (!urlIsValid && <I18n en="Invalid URL" fr="URL non valide" />)
                        || (resourceStep.url && urlIsActive[resourceStep.url] === false && <I18n en="URL is not active" fr="L'URL n'est pas active" />)
                        || (resourceStep.url && urlIsActive[resourceStep.url] === true && <I18n en="URL is active" fr="L'URL est active" />)
                    }
                    error={!urlIsValid}
                    label="URL"
                      value={resourceStep.url}
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
                      value={resourceStep.description}
                    onChange={handleResourceChange("description")}
                    disabled={disabled}
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

export default Resources;
