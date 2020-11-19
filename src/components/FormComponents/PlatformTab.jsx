import React from "react";

import { Typography, Paper, TextField, Grid } from "@material-ui/core";
import Instruments from "./Instruments";

import BilingualTextInput from "./BilingualTextInput";
import { QuestionText, SupplementalText, paperClass } from "./QuestionStyles";
import RequiredMark from "./RequiredMark";
import { En, Fr, I18n } from "../I18n";
import { validateField } from "../validate";

const PlatformTab = ({ disabled, record, handleInputChange }) => {
  return (
    <div>
      <Paper style={paperClass}>
        <Grid container direction="column" spacing={3}>
          <Grid item xs style={paperClass}>
            <QuestionText>
              <En>What is the name of the platform?</En>
              <Fr>Quel est le nom de la plate-forme?</Fr>{" "}
              <RequiredMark passes={validateField(record, "platformName")} />
              <SupplementalText>
                <En>
                  Eg this may be a the name of a glider, ship, buoy, or
                  satellite used in data collection.
                </En>
                <Fr>
                  Par exemple, il peut s'agir d'un planeur, d'un navire, d'une
                  bouée ou de satellites utilisés pour la collecte de données.
                </Fr>
              </SupplementalText>
            </QuestionText>
            <TextField
              label={<I18n en="Name" fr="Nom" />}
              name="platformName"
              value={record.platformName}
              onChange={handleInputChange}
              fullWidth
              disabled={disabled}
            />
          </Grid>
          <Grid item xs style={paperClass}>
            <QuestionText>
              <En>What is platform ID?</En>
              <Fr>Qu'est-ce que l'ID de plate-forme ?</Fr>
              <SupplementalText>
                <En>
                  This is a unique identification of the platform. If the
                  platform is registered with ICES, use that identifier
                </En>
                <Fr>
                  Il s'agit d'une identification unique de la plateforme. Si la
                  plateforme est enregistrée auprès du CIEM, utilisez cet
                  identificateur
                </Fr>
                <RequiredMark passes={validateField(record, "platformID")} />
              </SupplementalText>
            </QuestionText>

            <TextField
              label={<I18n en="Platform ID" fr="ID de plateforme" />}
              name="platformID"
              value={record.platformID}
              onChange={handleInputChange}
              fullWidth
              disabled={disabled}
            />
          </Grid>

          <Grid item xs style={paperClass}>
            <QuestionText>
              <En>
                What is the name of the organization or company that issued the
                platform ID?
              </En>
              <Fr>
                Quel est le nom de l'organisation ou de la société qui a émis
                l'ID de plate-forme ?
              </Fr>
              <RequiredMark
                passes={validateField(record, "platformAuthority")}
              />
              <SupplementalText>
                <En>
                  Eg if your organization issued the ID, then this would be your
                  organization’s name. If it’s an ICES code this would be ICES.
                </En>
                <Fr>
                  Par exemple, si votre organisation a émis l'ID, il s'agirait
                  du nom de votre organisation. S'il s'agit d'un code ICES, il
                  s'agirait du ICES.
                </Fr>
              </SupplementalText>
            </QuestionText>
            <TextField
              value={record.platformAuthority}
              name="platformAuthority"
              onChange={(e) => handleInputChange(e)}
              fullWidth
              disabled={disabled}
            />
          </Grid>

          <Grid item xs style={paperClass}>
            <QuestionText>
              <En>Describe the platform</En>
              <Fr>Décrire la plateforme</Fr>
            </QuestionText>
            <BilingualTextInput
              name="platformDescription"
              value={record.platformDescription}
              onChange={handleInputChange}
              multiline
              disabled={disabled}
            />
          </Grid>
        </Grid>
      </Paper>

      <Grid item xs>
        <Paper style={paperClass}>
          <Typography variant="h5">Instruments</Typography>
          <Typography>
            <En>Add instruments associated with this platform.</En>
            <Fr>Ajoutez des instruments associés à cette plateforme.</Fr>
          </Typography>
        </Paper>
        <Instruments
          value={record.instruments || []}
          onChange={handleInputChange}
          name="instruments"
          disabled={disabled}
          paperClass={paperClass}
        />
      </Grid>
    </div>
  );
};
export default PlatformTab;
