import React from "react";

import { Paper, Grid, FormControlLabel, Checkbox } from "@material-ui/core";
import Instruments from "../FormComponents/Instruments";

import { QuestionText, paperClass } from "../FormComponents/QuestionStyles";
import RequiredMark from "../FormComponents/RequiredMark";
import Platform from "../FormComponents/Platform";
import { En, Fr, I18n } from "../I18n";
import { validateField } from "../../utils/validate";

const PlatformTab = ({
  disabled,
  record,
  handleUpdateRecord,
  updateRecord,
}) => {
  const noPlatform = record.noPlatform && record.noPlatform !== "false";

  return (
    <div>
      <Paper style={paperClass}>
        <Grid container direction="column" spacing={0}>
          <Grid item xs style={paperClass}>
            <QuestionText>
              <I18n>
                <En>
                  A platform is anything used in data collection that has
                  instrument(s) attached to it. Eg:
                  <ul>
                    <li>Glider</li>
                    <li>Ship</li>
                    <li>Buoy</li>
                    <li>Satellite</li>
                    <li>Rossette</li>
                    <li>ROV</li>
                    <li>Mooring</li>
                  </ul>
                  It is strongly encouraged to fill out platform information. If
                  there is no platform, you can enter instruments at the bottom
                  of the page.
                </En>
                <Fr>
                  Une plateforme est tout ce qui est utilisé dans la collecte de
                  données auquel un ou plusieurs instruments sont attachés. Par
                  exemple :
                  <ul>
                    <li>
                      <i>Glider</i>
                    </li>
                    <li>Navire</li>
                    <li>Bouée</li>
                    <li>Satellite</li>
                    <li>Rosette</li>
                    <li>ROV</li>
                    <li>Amarrage</li>
                  </ul>
                  Il est fortement encouragé d'ajouter des informations sur une
                  plateforme. S'il n'y a pas de plateformes, vous pouvez entrer
                  des informations sur les instruments au bas de la page.
                </Fr>
              </I18n>
            </QuestionText>

            <FormControlLabel
              disabled={disabled}
              control={
                <Checkbox
                  name="noPlatform"
                  checked={noPlatform}
                  onChange={(e) => {
                    const { checked } = e.target;

                    updateRecord("noPlatform")(checked);
                  }}
                />
              }
              label={
                <I18n>
                  <En>This dataset doesn't have a platform</En>
                  <Fr>Ce jeu de données n'a pas de plateforme</Fr>
                </I18n>
              }
            />
          </Grid>

          <Grid item xs style={paperClass}>
            {!noPlatform ? (
              <>
                <Platform
                  record={record}
                  handleUpdateRecord={handleUpdateRecord}
                  disabled={disabled}
                />

                <QuestionText>
                  <I18n>
                    <En>
                      At least one instrument is required if there is a
                      platform.
                    </En>
                    <Fr>
                      Au moins un instrument est requis s'il y a une plateforme.
                    </Fr>
                  </I18n>

                  <RequiredMark passes={validateField(record, "instruments")} />
                </QuestionText>
              </>
            ) : (
              <QuestionText>
                <I18n>
                  <En>You can still enter an instrument without a platform</En>
                  <Fr>
                    Vous pouvez toujours entrer dans un instrument sans
                    plateforme
                  </Fr>
                </I18n>
              </QuestionText>
            )}

            <Instruments
              instruments={record.instruments}
              updateInstruments={updateRecord("instruments")}
              disabled={disabled}
              paperClass={paperClass}
              noPlatform={noPlatform}
            />
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};
export default PlatformTab;
