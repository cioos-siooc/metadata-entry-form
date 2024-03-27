import React, {useState} from "react";
import {Delete} from "@material-ui/icons";
import {Button, Grid, Paper, TextField, Typography,} from "@material-ui/core";
import {En, Fr, I18n} from "../I18n";
import BilingualTextInput from "./BilingualTextInput";

import RequiredMark from "./RequiredMark";
import InstrumentLeftList from "./InstrumentLeftList";
import {SupplementalText} from "./QuestionStyles";
import PlatformTitle from "./PlatformTitle";
import SelectInput from "./SelectInput";

const Instruments = ({
  updateInstruments,
  instruments = [],
  disabled,
  paperClass,
  saveUpdateInstrument,
  userInstruments,
  platformList,
}) => {
  const [activeInstrument, setActiveInstrument] = useState(0);

  function updateInstrumentField(key) {
    return (e) => {
      const instrumentsCopy = [...instruments];
      instrumentsCopy[activeInstrument][key] = e.target.value;
      updateInstruments(instrumentsCopy);
    };
  }
  function removeInstrument() {
    updateInstruments(
      instruments.filter((e, index) => index !== activeInstrument)
    );
    if (instruments.length) setActiveInstrument(instruments.length - 2);
  }

  const manufacturerLabel = <I18n en="Manufacturer" fr="Fabricant" />;
  const versionLabel = <I18n en="Version" fr="Version" />;
  const typeLabel = <I18n en="Type" fr="Type" />;
  const descriptionLabel = <I18n en="Description" fr="Description" />;
  const platformLabel = <I18n en="Platform" fr="Plateforme" />;

  const instrument = instruments.length > 0 && instruments[activeInstrument];

  return (
    <Grid container direction="row" style={{ marginLeft: "5px" }}>
    <Grid item xs={5}>

    <InstrumentLeftList
              instruments={instruments}
              updateInstruments={updateInstruments}
              activeInstrument={activeInstrument}
              setActiveInstrument={setActiveInstrument}
              disabled={disabled}
              userInstruments={userInstruments}
              saveUpdateInstrument={saveUpdateInstrument}
              />
    </Grid>
      <Grid item xs>
        <Grid container direction="column">
          {instrument && (
            <Paper style={paperClass}>
              <Grid container direction="column" spacing={2}>
                <Grid item xs>
                  <I18n>
                    <En>Instrument ID</En>
                    <Fr>L'ID de l'instrument</Fr>
                  </I18n>
                  <RequiredMark passes={instrument.id} />
                  <TextField
                    label="ID"
                    value={instrument.id}
                    onChange={updateInstrumentField("id")}
                    fullWidth
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs>
                  <TextField
                    label={manufacturerLabel}
                    name="manufacturer"
                    value={instrument.manufacturer}
                    onChange={updateInstrumentField("manufacturer")}
                    fullWidth
                    disabled={disabled}
                  />{" "}
                </Grid>
                <Grid item xs>
                  <TextField
                    label={versionLabel}
                    value={instrument.version}
                    onChange={updateInstrumentField("version")}
                    fullWidth
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs>
                  <Typography>
                    <I18n>
                      <En>Instrument Type</En>
                      <Fr>Type d'instrument</Fr>
                    </I18n>
                  </Typography>
                  <BilingualTextInput
                    name="type"
                    label={typeLabel}
                    value={instrument.type}
                    onChange={updateInstrumentField("type")}
                    disabled={disabled}
                  />
                </Grid>{" "}
                <Grid item xs>
                  <Typography>Description</Typography>
                  <BilingualTextInput
                    name="description"
                    label={descriptionLabel}
                    value={instrument.description}
                    onChange={updateInstrumentField("description")}
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs>
                  <Button
                    startIcon={<Delete />}
                    disabled={disabled}
                    onClick={removeInstrument}
                  >
                    <I18n>
                      <En>Remove item</En>
                      <Fr>Supprimer l'instrument</Fr>
                    </I18n>
                  </Button>
                </Grid>
                  {platformList.length >= 2 && (
                      <Grid item xs>
                          <SupplementalText>
                              <I18n>
                                  <En>
                                      When mutiple platforms are used, you must specify which platform the instrument is
                                      attached to. <RequiredMark passes={instrument.platform} />
                                  </En>
                                  <Fr>
                                      Lorsque plusieurs plates-formes sont utilisées, vous devez spécifier à quelle
                                      plate-forme l'instrument est connecté.
                                  </Fr>
                              </I18n>
                          </SupplementalText>
                          <SelectInput
                              label={platformLabel}
                              name="platform"
                              value={instrument.platform}
                              optionLabels={platformList.map((platform) => (<PlatformTitle platform={platform} />))}
                              options={platformList.map((platform) => platform.id)}
                              onChange={updateInstrumentField("platform")}
                              fullWidth
                              disabled={disabled}
                          />
                      </Grid>
                  )}
              </Grid>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};
export default Instruments;
