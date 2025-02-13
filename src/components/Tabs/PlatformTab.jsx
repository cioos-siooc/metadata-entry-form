import React, { useEffect } from "react";

import { Paper, Grid, FormControlLabel, Checkbox } from "@material-ui/core";
import Instruments from "../FormComponents/Instruments";

import { QuestionText, paperClass } from "../FormComponents/QuestionStyles";
import Platform from "../FormComponents/Platform";
import { En, Fr, I18n } from "../I18n";

const PlatformTab = ({
  disabled,
  record,
  userPlatforms,
  saveUpdatePlatform,
  userInstruments,
  saveUpdateInstrument,
  updateRecord,
}) => {
  const noPlatform = record.noPlatform && record.noPlatform !== "false";


  useEffect(() => {
    if (record.platformID){
      updateRecord("platforms")([
        {
          id: record.platformID,
          description: record.platformDescription,
          type: record.platform,

        },
        ...record.platforms,
      ])
      updateRecord("platformID")(null)
      updateRecord("platformDescription")(null)
      updateRecord("platform")(null)
    }
  }, [record.platformID, record.platform, record.platformDescription]);

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
                    <li>ROV</li>
                    <li>Mooring</li>
                  </ul>
                  It is strongly encouraged to fill out platform information. If
                  there is no platform, you can enter instruments at the bottom
                  of the page.
                </En>
                <Fr>
                  Une plateforme désigne tout “objet” sur lequel un ou plusieurs
                  instruments sont attachés et utilisés dans la collecte des
                  données. Par exemple :
                  <ul>
                    <li>
                      <i>Glider</i>
                    </li>
                    <li>Navire</li>
                    <li>Bouée</li>
                    <li>Satellite</li>
                    <li>ROV</li>
                    <li>Amarrage</li>
                  </ul>
                  S'il n'y a pas de plateforme, vous pouvez entrer des
                  informations sur les instruments au bas de la page. Sinon,
                  vous devez décrire le plus précisément possible la plateforme
                  utilisée dans la collecte de données.
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
                  platforms={record.platforms}
                  userPlatforms={userPlatforms}
                  saveUpdatePlatform={saveUpdatePlatform}
                  record={record}
                  updatePlatforms={updateRecord("platforms")}
                  disabled={disabled}
                  paperClass={paperClass}
                />
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
              saveUpdateInstrument={saveUpdateInstrument}
              userInstruments={userInstruments}
              disabled={disabled}
              paperClass={paperClass}
              noPlatform={noPlatform}
              platformList={record.platforms}
            />
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};
export default PlatformTab;
