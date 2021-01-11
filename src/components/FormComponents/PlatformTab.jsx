import React from "react";

import {
  Typography,
  Paper,
  Grid,
  FormControlLabel,
  Checkbox,
} from "@material-ui/core";
import Instruments from "./Instruments";

import { QuestionText, paperClass } from "./QuestionStyles";
import RequiredMark from "./RequiredMark";
import Platform from "./Platform";
import { En, Fr } from "../I18n";
import { validateField } from "../validate";

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
                Une plate-forme est tout ce qui est utilisé dans la collecte de
                données auquel un ou plusieurs instruments sont attachés. Par
                exemple :
                <ul>
                  <li>Planeur</li>
                  <li>Navire</li>
                  <li>Bouée</li>
                  <li>Satellite</li>
                  <li>Rossette</li>
                  <li>ROV</li>
                  <li>Amarrage</li>
                </ul>
                Il est fortement encouragé à renseigner les informations sur la
                plateforme. Si il n'y a pas de plate-forme, vous pouvez entrer
                des instruments au bas de la page.
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
                  <Fr>Ce jeu de données n'a pas de plate-forme</Fr>
                </>
              }
            />
          </Grid>
          {!noPlatform && (
            <Grid item xs style={paperClass}>
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
                  Au moins un instrument est requis s'il y a une plate-forme.
                </Fr>

                <RequiredMark passes={validateField(record, "instruments")} />
              </QuestionText>

              <Instruments
                value={record.instruments || []}
                onChange={handleInputChange}
                name="instruments"
                disabled={disabled}
                paperClass={paperClass}
              />
            </Grid>
          )}
        </Grid>
      </Paper>

      <Grid item xs>
        <Paper style={paperClass}>
          <Typography variant="h5">Instruments</Typography>
          <Typography>
            <En>Add instruments that are not associated with a platform.</En>
            <Fr>
              Ajout d'instruments qui ne sont pas associés à une plate-forme.
            </Fr>
          </Typography>
        </Paper>
        <Instruments
          value={record.instrumentsWithoutPlatform || []}
          onChange={handleInputChange}
          name="instrumentsWithoutPlatform"
          disabled={disabled}
          paperClass={paperClass}
        />
      </Grid>
    </div>
  );
};
export default PlatformTab;
