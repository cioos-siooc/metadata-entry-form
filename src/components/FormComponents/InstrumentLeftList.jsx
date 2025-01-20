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

import InstrumentTitle from "./InstrumentTitle";
import {getBlankInstrument} from "../../utils/blankRecord";

const InstrumentLeftList = ({
  instruments,
  updateInstruments,
  activeInstrument,
  setActiveInstrument,
  disabled,
  userInstruments,
  saveUpdateInstrument,
}) => {
  const [currentInstruments, setItems] = useState(instruments);

  if (!deepEquals(currentInstruments, instruments)) {
    setItems(instruments);
  }
  //  removedIndex is dragStart
  //  addedIndex is dragEnd
  function onDrop({ removedIndex, addedIndex }) {
    if (removedIndex === activeInstrument) setActiveInstrument(addedIndex);
    else if (addedIndex <= activeInstrument && removedIndex > activeInstrument)
      setActiveInstrument(activeInstrument + 1);

    const reorderedInstruments = arrayMove(
      currentInstruments,
      removedIndex,
      addedIndex
    );

    updateInstruments(reorderedInstruments);
  }

  function removeItem(itemIndex) {
    updateInstruments(instruments.filter((e, index) => index !== itemIndex));
    if (instruments.length) setActiveInstrument(instruments.length - 2);
  }
  function duplicateInstrument(instrumentIndex) {
    const duplicatedInstrument = deepCopy(instruments[instrumentIndex]);
    if (duplicatedInstrument.id) duplicatedInstrument.id += " (Copy)";

    updateInstruments(instruments.concat(duplicatedInstrument));
  }

  const instrumentList = Object.values(userInstruments || {});

  function handleAddFromSavedInstruments(e) {
    const index = e.target.value;
    const { role, ...instrument } = instrumentList[index];

    updateInstruments(
      instruments.concat(deepCopy({ ...getBlankInstrument(), ...instrument }))
    );
    setActiveInstrument(instruments.length);
  }

  function handleAddNewInstrument() {
    updateInstruments(instruments.concat(getBlankInstrument()));
    setActiveInstrument(instruments.length);
  }

  return (
    <Paper style={paperClass}>
      <Grid container direction="column" justifyContent="flex-start">
        <Grid item xs style={{ margin: "10px" }}>
          <Typography>
            {instruments.length ? (
              <I18n>
                <En>Instruments in this record:</En>
                <Fr>Instruments dans cet enregistrement :</Fr>
              </I18n>
            ) : (
              <I18n>
                <En>There are no instruments in this record.</En>
                <Fr>Il n'y a aucun instrument dans cet enregistrement.</Fr>
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
              {instruments.map((instrumentItem, i) => {
                return (
                  <Draggable key={i}>
                    <ListItem
                      key={i}
                      button
                      onClick={() => setActiveInstrument(i)}
                    >
                      <ListItemText
                        primary={
                          <Typography
                            style={{
                              fontWeight: activeInstrument === i ? "bold" : "",
                              width: "80%",
                            }}
                          >
                            <InstrumentTitle instrument={instrumentItem} />
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip
                          title={
                            <I18n
                              en="Duplicate instrument"
                              fr="Instrument en double"
                            />
                          }
                        >
                          <span>
                            <IconButton
                              onClick={() => duplicateInstrument(i)}
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
                              en="Add to saved instruments"
                              fr="Ajouter aux instruments enregistrés"
                            />
                          }
                        >
                          <span>
                            <IconButton
                              onClick={() => {
                                const instrument = deepCopy(instruments[i]);

                                instrument.instrumentID = saveUpdateInstrument(instrument);

                                setItems(instruments);
                              }}
                              disabled={
                                instruments[i].id?.length === 0
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
                            <I18n en="Drag to reorder" fr="Duplicate instrument" />
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
            onClick={handleAddNewInstrument}
            fullWidth
            style={{ height: "56px", justifyContent: "emptyInstrument" }}
          >
            <Typography>
              <I18n>
                <En>Add new instrument</En>
                <Fr>Ajouter un instrument</Fr>
              </I18n>
            </Typography>
          </Button>
        </Grid>
        <Grid item xs style={{ margin: "10px" }}>
          <SelectInput
            value=""
            labelId="add-existing"
            onChange={handleAddFromSavedInstruments}
            optionLabels={instrumentList.map((instrumentItem) => (
              <InstrumentTitle instrument={instrumentItem} />
            ))}
            options={instrumentList.map((v, i) => i)}
            disabled={!instrumentList.length || disabled}
            label={<I18n en="ADD SAVED INSTRUMENT" fr="AJOUTER UN INSTRUMENT" />}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};
export default InstrumentLeftList;
