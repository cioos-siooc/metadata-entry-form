import React, {useState} from "react";

import {Container, Draggable} from "react-smooth-dnd";

import arrayMove from "array-move";
import {Delete, DragHandle, FileCopy, Save} from "@material-ui/icons";
import {
  Button,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from "@material-ui/core";
import {deepCopy, deepEquals} from "../../utils/misc";
import {paperClass} from "./QuestionStyles";
import SelectInput from "./SelectInput";
import {En, Fr, I18n} from "../I18n";

import PlatformTitle from "./PlatformTitle";
import {getBlankPlatform} from "../../utils/blankRecord";

const PlatformLeftList = ({
  platforms = [],
  updatePlatforms,
  activePlatform,
  setActivePlatform,
  disabled,
  userPlatforms,
  saveUpdatePlatform,
}) => {
  const [currentPlatforms, setItems] = useState(platforms);

  if (!deepEquals(currentPlatforms, platforms)) {
    setItems(platforms);
  }
  //  removedIndex is dragStart
  //  addedIndex is dragEnd
  function onDrop({ removedIndex, addedIndex }) {
    if (removedIndex === activePlatform) setActivePlatform(addedIndex);
    else if (addedIndex <= activePlatform && removedIndex > activePlatform)
      setActivePlatform(activePlatform + 1);

    const reorderedPlatforms = arrayMove(
      currentPlatforms,
      removedIndex,
      addedIndex
    );

    updatePlatforms(reorderedPlatforms);
  }

  function removeItem(itemIndex) {
    updatePlatforms(platforms.filter((e, index) => index !== itemIndex));
    if (platforms.length) setActivePlatform(platforms.length - 2);
  }
  function duplicatePlatform(platformIndex) {
    const duplicatedPlatform = deepCopy(platforms[platformIndex]);
    if (duplicatedPlatform.id) duplicatedPlatform.id += " (Copy)";

    updatePlatforms(platforms.concat(duplicatedPlatform));
  }

  const platformList = Object.values(userPlatforms || {});

  function handleAddFromSavedPlatforms(e) {
    const index = e.target.value;
    const { role, ...platform } = platformList[index];

    updatePlatforms(
      platforms.concat(deepCopy({ ...getBlankPlatform(), ...platform }))
    );
    setActivePlatform(platforms.length);
  }

  function handleAddNewPlatform() {
    updatePlatforms(platforms.concat(getBlankPlatform()));
    setActivePlatform(platforms.length);
  }

  return (
    <Paper style={paperClass}>
      <Grid container direction="column" justifyContent="flex-start">
        <Grid item xs style={{ margin: "10px" }}>
          <Typography>
            {platforms.length ? (
              <I18n>
                <En>Platforms in this record:</En>
                <Fr>Plateforme dans cet enregistrement:</Fr>
              </I18n>
            ) : (
              <I18n>
                <En>There are no platforms in this record.</En>
                <Fr>Il n'y a aucune plateforme dans cet enregistrement.</Fr>
              </I18n>
            )}
          </Typography>
        </Grid>
        <Grid item xs>
          <List>
            <Container
              dragHandleSelector=".drag-handle"
              lockAxis="y"
              onDrop={onDrop}
            >
              {platforms.map((platformItem, i) => {
                return (
                  <Draggable key={i}>
                    <ListItem
                      key={i}
                      button
                      onClick={() => setActivePlatform(i)}
                    >
                      <ListItemText
                        primary={
                          <Typography
                            style={{
                              fontWeight: activePlatform === i ? "bold" : "",
                              width: "80%",
                            }}
                          >
                            <PlatformTitle platform={platformItem} />
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip
                          title={
                            <I18n
                              en="Duplicate platform"
                              fr="Plateforme en double"
                            />
                          }
                        >
                          <span>
                            <IconButton
                              onClick={() => duplicatePlatform(i)}
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
                              onClick={() => removeItem(i)}
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
                            <I18n
                              en="Add to saved platforms"
                              fr="Ajouter aux platforms enregistrés"
                            />
                          }
                        >
                          <span>
                            <IconButton
                              onClick={() => {
                                const platform = deepCopy(platforms[i]);

                                platform.id = saveUpdatePlatform(platform);

                                setItems(platforms);
                              }}
                              disabled={
                                platforms[i].id?.length === 0
                              }
                              edge="end"
                              aria-label="clone"
                            >
                              <Save />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={
                            <I18n en="Drag to reorder" fr="Duplicate platform" />
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
        <Grid item xs style={{ margin: "10px" }}>
          <Button
            disabled={disabled}
            onClick={handleAddNewPlatform}
            fullWidth
            style={{ height: "56px", justifyContent: "emptyPlatform" }}
          >
            <Typography>
              <I18n>
                <En>Add new platform</En>
                <Fr>Ajouter une plateforme</Fr>
              </I18n>
            </Typography>
          </Button>
        </Grid>
        <Grid item xs style={{ margin: "10px" }}>
          <SelectInput
            value=""
            labelId="add-existing"
            onChange={handleAddFromSavedPlatforms}
            optionLabels={platformList.map((platformItem) => (
              <PlatformTitle platform={platformItem} />
            ))}
            options={platformList.map((v, i) => i)}
            disabled={!platformList.length || disabled}
            label={<I18n en="ADD SAVED PLATFORM" fr="AJOUTER UNE PLATEFORME" />}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};
export default PlatformLeftList;
