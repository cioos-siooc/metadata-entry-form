import React, { useState } from "react";
import { TextField, Grid, Typography, Box } from "@mui/material";
import validator from "validator";
import SelectInput from "./SelectInput";
import { En, Fr, I18n } from "../I18n";
import { deepCopy } from "../../utils/misc";
import RequiredMark from "./RequiredMark";
import BilingualTextInput from "./BilingualTextInput";
import { QuestionText, SupplementalText } from "./QuestionStyles";
import { identifierType } from "../../isoCodeLists";
import { lineagePartIsComplete } from "../../utils/validate";
import ItemCards from "./ItemCards";

const validateURL = (url) => !url || validator.isURL(url);

const emptySource = {
  description: "",
  title: "",
  authority: "",
  code: "",
};

const LineageSource = ({ updateSources, sources = [], disabled, language }) => {
  const [activeSource, setActiveSource] = useState(null);

  function updateSourceField(key) {
    return (e) => {
      const sourcesCopy = [...sources];
      sourcesCopy[activeSource][key] = e.target.value;
      updateSources(sourcesCopy);
    };
  }

  function urlIsValid(url) {
    return !url || validateURL(url);
  }

  function handleIdentifierChange(key) {
    return (e) => {
      const newValue = [...sources];
      newValue[activeSource][key] = e.target.value;

      const s = newValue[activeSource].code;
      switch (true) {
        case urlIsValid(newValue[activeSource].code) &&
          /^http.?:\/\/doi\.org\//i.test(s):
          newValue[activeSource].authority = "DOI";
          break;
        case urlIsValid(newValue[activeSource].code):
          newValue[activeSource].authority = "URL";
          break;
        default:
          newValue[activeSource].authority = "";
          break;
      }
      updateSources(newValue);
    };
  }

  const source = sources.length > 0 && sources[activeSource];

  return (
    <Grid container spacing={0}>
      <Grid>
        <QuestionText>
          <I18n en="Source:" fr="Source :" />
          <SupplementalText>
            <I18n>
              <En>
                Information about the input used in creating the resource
                specified by the scope. Provide citations to the input data.
                This is especially valuable for processed satellite data and
                model data. For model data, it is suggested to describe the
                model and its input, especially if their is no publication cited
                above to describe the model.
              </En>
              <Fr>
                Informations sur les données utilisées pour la création de la
                ressource et si possible fournir la référence des données
                sources. Ceci est particulièrement recommandé si vous fournissez
                des données ayant été transformées (ex : données satellitaires,
                données issues de modèles). Pour les données de modèle, il est
                suggéré de décrire le modèle et ses entrées, en particulier s'il
                n'y a pas de publication citée ci-dessus pour décrire le modèle.
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>
      </Grid>
      <ItemCards
        items={sources}
        updateItems={updateSources}
        openIndex={activeSource}
        setOpenIndex={setActiveSource}
        disabled={disabled}
        idPrefix="lineage-source"
        numbered
        itemNoun={{ en: "source", fr: "source" }}
        ariaLabel={language === "fr" ? "Sources" : "Sources"}
        itemTitle={(item) =>
          item.title?.[language] || item.description?.[language]
        }
        itemMeta={(item) => item.code}
        isComplete={lineagePartIsComplete}
        getBlankItem={() => deepCopy(emptySource)}
        duplicateItem={(copy) => {
          if (copy.title?.en) copy.title.en += " (copy)";
          if (copy.title?.fr) copy.title.fr += " (copie)";
          return copy;
        }}
        addLabel=<I18n en="Add source" fr="Ajouter une source" />
        emptyText=<I18n
          en="No sources yet."
          fr="Aucune source pour l'instant."
        />
        renderEditor={() => (
          <Box>
            <Grid container direction="column" spacing={2}>
              <Grid>
                <I18n>
                  <En>Description</En>
                  <Fr>Description</Fr>
                </I18n>
                <RequiredMark
                  passes={source.description?.en || source.description?.fr}
                />
                <BilingualTextInput
                  label={
                    <I18n
                      en="Source description"
                      fr="Description de la source"
                    />
                  }
                  value={source.description}
                  onChange={updateSourceField("description")}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid>
                <Typography variant="body1" component="div" sx={{ mt: 1 }}>
                  <I18n>
                    <En>Or link to reference documentation</En>
                    <Fr>Ou lien vers la documentation de référence</Fr>
                  </I18n>
                </Typography>
              </Grid>
              <Grid>
                <I18n>
                  <En>Title</En>
                  <Fr>Titre</Fr>
                </I18n>
                {source?.code && (
                  <RequiredMark passes={source.title?.en || source.title?.fr} />
                )}
                <BilingualTextInput
                  label={<I18n en="Source title" fr="Titre de la source" />}
                  value={source.title}
                  onChange={updateSourceField("title")}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid>
                <TextField
                  label={
                    <I18n>
                      <En>Identifier or URL</En>
                      <Fr>Identifiant ou URL</Fr>
                    </I18n>
                  }
                  value={source.code}
                  onChange={handleIdentifierChange("code")}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid>
                <QuestionText>
                  <I18n>
                    <En>Enter the identifier type</En>
                    <Fr>Entrez le type d'identifiant</Fr>
                  </I18n>
                  {source?.code && <RequiredMark passes={source.authority} />}
                </QuestionText>

                <SelectInput
                  value={source.authority}
                  onChange={updateSourceField("authority")}
                  options={identifierType}
                  optionLabels={identifierType}
                  disabled={disabled}
                  label={<I18n en="Identifier type" fr="Type d'identifiant" />}
                  fullWidth={false}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      />
    </Grid>
  );
};
export default LineageSource;
