import React from "react";
import { useParams } from "react-router-dom";

import { Typography, Paper, TextField, Grid } from "@material-ui/core";
import Instruments from "./Instruments";

import BilingualTextInput from "./BilingualTextInput";
import SelectInput from "./SelectInput";
import { roleCodes } from "../../isoCodeLists";

import { En, Fr, I18n } from "../I18n";
import { camelToSentenceCase } from "../../utils/misc";
import translate from "../../utils/i18n";

const PlatformTab = ({
  disabled,
  record,
  handleInputChange,
  paperClass,
  paperClassValidate,
}) => {
  const { language } = useParams();

  return (
    <div>
      <Paper style={paperClass}>
        <Grid container direction="column" spacing={3}>
          <Grid item xs style={paperClassValidate("platformName")}>
            <Typography>
              <En>
                What is the name of the platform? Eg this may be a glider, ship,
                buoy, or satellites used in data collection.
              </En>
              <Fr>
                Quel est le nom de la plate-forme? Par exemple, il peut s'agir
                d'un planeur, d'un navire, d'une bouée ou de satellites utilisés
                pour la collecte de données.
              </Fr>
            </Typography>
            <TextField
              label={<I18n en="Name" fr="Nom" />}
              name="platformName"
              value={record.platformName}
              onChange={handleInputChange}
              fullWidth
              disabled={disabled}
            />
          </Grid>
          <Grid item xs style={paperClassValidate("platformID")}>
            <Typography>
              <En>
                What is platform ID? This is a unique identifcation of the
                platform. If the platform is registered with ICES, use that
                identifier
              </En>
              <Fr>
                Qu'est-ce que l'ID de plate-forme ? Il s'agit d'une
                identification unique de la plateforme. Si la plateforme est
                enregistrée auprès du CIEM, utilisez cet identificateur
              </Fr>
            </Typography>
            <TextField
              label={<I18n en="Platform ID" fr="ID de plateforme" />}
              name="platformID"
              value={record.platformID}
              onChange={handleInputChange}
              fullWidth
              disabled={disabled}
            />
          </Grid>

          <Grid item xs style={paperClassValidate("platformRole")}>
            <Typography>
              <En>What is the role of the platform?</En>
              <Fr>Quel est le rôle de la plateforme?</Fr>
            </Typography>
            <SelectInput
              name="platformRole"
              value={record.platformRole}
              onChange={(e) => handleInputChange(e)}
              options={roleCodes}
              optionLabels={roleCodes.map((e) => {
                return camelToSentenceCase(translate(e, language));
              })}
              disabled={disabled}
            />
          </Grid>
          <Grid item xs style={paperClassValidate("platformDescription")}>
            <Typography>
              <En>Describe the platform</En>
              <Fr>Décrire la plateforme</Fr>
            </Typography>
            <BilingualTextInput
              name="platformDescription"
              value={record.platformDescription}
              onChange={handleInputChange}
              multiline
              disabled={disabled}
            />
          </Grid>
          <Grid item xs style={paperClassValidate("platformAuthority")}>
            <Typography>
              <En>What is the naming authority of the platform?</En>
              <Fr>Quelle est l'autorité de dénomination de la plateforme ?</Fr>
            </Typography>
            <TextField
              value={record.platformAuthority}
              name="platformAuthority"
              onChange={(e) => handleInputChange(e)}
              fullWidth
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
