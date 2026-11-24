import React, { useCallback, useState } from "react";
import BookmarkAddOutlined from "@mui/icons-material/BookmarkAddOutlined";
import { useParams } from "react-router-dom";
import { TextField, Grid, Typography, Box } from "@mui/material";
import { En, Fr, I18n } from "../I18n";
import BilingualTextInput from "./BilingualTextInput";

import RequiredMark from "./RequiredMark";
import { SupplementalText } from "./QuestionStyles";
import PlatformTitle, { getPlatformTitleFromNames } from "./PlatformTitle";
import SelectInput from "./SelectInput";
import ItemCards from "./ItemCards";
import SavedItemSelect from "./SavedItemSelect";
import { instrumentIsComplete } from "../../utils/validate";
import { deepCopy } from "../../utils/misc";
import InstrumentTitle from "./InstrumentTitle";
import { getBlankInstrument } from "../../utils/blankRecord";

const Instruments = ({
  updateInstruments,
  instruments = [],
  disabled,
  saveUpdateInstrument,
  userInstruments,
  platformList,
}) => {
  const { language = "en" } = useParams();
  // The open instrument, or null when every row is folded.
  const [activeInstrument, setActiveInstrument] = useState(null);
  const platformName = (id) => {
    const match = id && (platformList || []).find((p) => p.id === id);
    return match ? getPlatformTitleFromNames(match) : "";
  };

  const updateInstrumentField = useCallback(
    (key) => {
      return (e) => {
        const instrumentsCopy = [...instruments];
        instrumentsCopy[activeInstrument][key] = e.target.value;
        updateInstruments(instrumentsCopy);
      };
    },
    // activeInstrument too: without it, edits after opening another
    // instrument went to the one that was open before.
    [instruments, activeInstrument, updateInstruments],
  );

  const manufacturerLabel = <I18n en="Manufacturer" fr="Fabricant" />;
  const versionLabel = <I18n en="Version" fr="Version" />;
  const typeLabel = <I18n en="Type" fr="Type" />;
  const descriptionLabel = <I18n en="Description" fr="Description" />;
  const platformLabel = <I18n en="Platform" fr="Plateforme" />;

  const instrument = instruments[activeInstrument];

  return (
    <ItemCards
      items={instruments}
      updateItems={updateInstruments}
      openIndex={activeInstrument}
      setOpenIndex={setActiveInstrument}
      disabled={disabled}
      idPrefix="instrument"
      itemNoun={{ en: "instrument", fr: "instrument" }}
      ariaLabel={
        language === "fr"
          ? "Instruments dans cet enregistrement"
          : "Instruments in this record"
      }
      itemTitle={(item) => InstrumentTitle({ instrument: item })}
      itemMeta={(item) =>
        [item.type?.[language], platformName(item.platform)]
          .filter(Boolean)
          .join(" · ")
      }
      isComplete={(item) => instrumentIsComplete(item, platformList)}
      getBlankItem={getBlankInstrument}
      duplicateItem={(copy) => {
        if (copy.id) copy.id += language === "fr" ? " (copie)" : " (copy)";
        return copy;
      }}
      menuItems={(item) => [
        {
          key: "save",
          label:
            language === "fr"
              ? "Enregistrer dans mes instruments"
              : "Save to my instruments",
          icon: BookmarkAddOutlined,
          disabled: !item.id,
          onClick: () => saveUpdateInstrument(deepCopy(item)),
        },
      ]}
      addLabel={<I18n en="Add instrument" fr="Ajouter un instrument" />}
      emptyText={
        <I18n en="No instruments yet." fr="Aucun instrument pour l'instant." />
      }
      footer={(addItem) => (
        <SavedItemSelect
          savedItems={userInstruments}
          itemTitle={(item) => InstrumentTitle({ instrument: item })}
          getBlankItem={getBlankInstrument}
          onAdd={addItem}
          disabled={disabled}
          ariaLabel={
            language === "fr"
              ? "Rechercher un instrument enregistré"
              : "Search saved instruments"
          }
        />
      )}
      renderEditor={() => (
        <Box>
          <Grid container direction="column" spacing={2}>
            <Grid>
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
            <Grid>
              <TextField
                label={manufacturerLabel}
                name="manufacturer"
                value={instrument.manufacturer}
                onChange={updateInstrumentField("manufacturer")}
                fullWidth
                disabled={disabled}
              />{" "}
            </Grid>
            <Grid>
              <TextField
                label={versionLabel}
                value={instrument.version}
                onChange={updateInstrumentField("version")}
                fullWidth
                disabled={disabled}
              />
            </Grid>
            <Grid>
              <Typography>
                <I18n>
                  <En>Instrument type</En>
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
            <Grid>
              <Typography>Description</Typography>
              <BilingualTextInput
                name="description"
                label={descriptionLabel}
                value={instrument.description}
                onChange={updateInstrumentField("description")}
                disabled={disabled}
              />
            </Grid>
            {platformList.length >= 2 && (
              <Grid>
                <SupplementalText>
                  <I18n>
                    <En>
                      When multiple platforms are used, you must specify which
                      platform the instrument is attached to.{" "}
                      <RequiredMark passes={instrument.platform} />
                    </En>
                    <Fr>
                      Lorsque plusieurs plates-formes sont utilisées, vous devez
                      spécifier à quelle plate-forme l'instrument est connecté.
                    </Fr>
                  </I18n>
                </SupplementalText>
                <SelectInput
                  label={platformLabel}
                  name="platform"
                  value={instrument.platform}
                  optionLabels={platformList.map((platform) => (
                    <PlatformTitle key={platform.id} platform={platform} />
                  ))}
                  options={platformList.map((platform) => platform.id)}
                  onChange={updateInstrumentField("platform")}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    />
  );
};
export default Instruments;
