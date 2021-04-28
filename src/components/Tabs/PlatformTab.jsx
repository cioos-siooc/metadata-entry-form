import React from "react";

import { Paper, Grid, FormControlLabel, Checkbox } from "@material-ui/core";
import Instruments from "../FormComponents/Instruments";

import { QuestionText, paperClass } from "../FormComponents/QuestionStyles";
import RequiredMark from "../FormComponents/RequiredMark";
import Platform from "../FormComponents/Platform";
import { En, Fr } from "../I18n";
import { validateField } from "../../utils/validate";

const PlatformTab = ({ disabled, record, handleInputChange }) => {
  const { noPlatform = false } = record;
  return (
    <div>
      <Paper style={paperClass}>
        <Grid container direction="column" spacing={0}>
          <Grid item xs style={paperClass}>
            <QuestionText>
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
                there is no platform, you can enter instruments at the bottom of
                the page.
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
                des informations sur des instruments au bas de la page.
              </Fr>
            </QuestionText>

            <FormControlLabel
              disabled={disabled}
              control={
                <Checkbox
                  name="noPlatform"
                  checked={noPlatform}
                  onChange={(e) => {
                    const { checked } = e.target;

                    handleInputChange({
                      target: { name: "noPlatform", value: checked },
                    });
                  }}
                />
              }
              label={
                <>
                  <En>This dataset doesn't have a platform</En>
                  <Fr>Ce jeu de données n'a pas de plateforme</Fr>
                </>
              }
            />
          </Grid>

          <Grid item xs style={paperClass}>
            {!noPlatform ? (
              <>
                <Platform
                  record={record}
                  handleInputChange={handleInputChange}
                  disabled={disabled}
                />

                <QuestionText>
                  <En>
                    At least one instrument is required if there is a platform.
                  </En>
                  <Fr>
                    Au moins un instrument est requis s'il y a une plateforme.
                  </Fr>

                  <RequiredMark passes={validateField(record, "instruments")} />
                </QuestionText>
              </>
            ) : (
              <QuestionText>
                <En>You can still enter an instrument without a platform</En>
                <Fr>
                  Vous pouvez toujours entrer dans un instrument sans plateforme
                </Fr>
              </QuestionText>
            )}

            <Instruments
              value={record.instruments}
              onChange={handleInputChange}
              name="instruments"
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
