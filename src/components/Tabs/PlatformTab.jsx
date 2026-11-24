import React, { useEffect } from "react";
import FormSection from "../FormShell/FormSection";

import {
  Box,
  FormControlLabel,
  Checkbox,
  Stack,
} from "@mui/material";
import Instruments from "../FormComponents/Instruments";
import FormField from "../FormShell/FormField";
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
    if (record.platformID) {
      updateRecord("platforms")([
        {
          id: record.platformID,
          description: record.platformDescription,
          type: record.platform,
        },
        ...record.platforms,
      ]);
      updateRecord("platformID")(null);
      updateRecord("platformDescription")(null);
      updateRecord("platform")(null);
    }
  }, [record.platformID, record.platform, record.platformDescription]);

  return (
    <Stack spacing={2}>
      <FormSection title={<I18n en="Platforms" fr="Plateformes" />}>
        <FormField
          id="field-platforms"
          label={
            <I18n
              en="Platforms used to collect the data"
              fr="Plateformes utilisées pour la collecte"
            />
          }
          hint={
            <I18n
              en="Anything with instruments attached: a ship, buoy, glider, mooring, satellite or ROV. Strongly encouraged."
              fr="Tout objet portant des instruments : navire, bouée, glider, amarrage, satellite ou ROV. Fortement recommandé."
            />
          }
          guidance={
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
                there is no platform, you can still enter instruments below.
              </En>
              <Fr>
                Une plateforme désigne tout « objet » sur lequel un ou plusieurs
                instruments sont attachés et utilisés dans la collecte des
                données. Par exemple :
                <ul>
                  <li>
                    <i>Glider</i>
                  </li>
                  <li>Navire</li>
                  <li>Bouée</li>
                  <li>Satellite</li>
                  <li>Véhicule téléopéré (ROV)</li>
                  <li>Amarrage</li>
                </ul>
                Vous devez décrire le plus précisément possible la plateforme
                utilisée dans le cadre de la collecte de données et les
                instruments.
              </Fr>
            </I18n>
          }
        >
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
          {!noPlatform && (
            <Box sx={{ mt: 1.5 }}>
              <Platform
                platforms={record.platforms}
                userPlatforms={userPlatforms}
                saveUpdatePlatform={saveUpdatePlatform}
                record={record}
                updatePlatforms={updateRecord("platforms")}
                disabled={disabled}
              />
            </Box>
          )}
        </FormField>
      </FormSection>

      <FormSection
        title={<I18n en="Instruments" fr="Instruments" />}
        description={
          noPlatform ? (
            <I18n
              en="You can still enter instruments without a platform."
              fr="Veuillez renseigner les informations sur les instruments utilisés."
            />
          ) : (
            <I18n
              en="Instruments that recorded the data, and the platform each one was on."
              fr="Les instruments qui ont enregistré les données, et la plateforme de chacun."
            />
          )
        }
      >
        <Instruments
          instruments={record.instruments}
          updateInstruments={updateRecord("instruments")}
          saveUpdateInstrument={saveUpdateInstrument}
          userInstruments={userInstruments}
          disabled={disabled}
          noPlatform={noPlatform}
          platformList={record.platforms}
        />
      </FormSection>
    </Stack>
  );
};
export default PlatformTab;
