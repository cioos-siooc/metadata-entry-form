import React, { useContext, useEffect, useState, useRef } from "react";
import { Grid, Box, TextField } from "@mui/material";
import validator from "validator";
import debounce from "just-debounce-it";
import { useParams } from "react-router-dom";
import { En, Fr, I18n } from "../I18n";
import BilingualTextInput from "./BilingualTextInput";
import RequiredMark from "./RequiredMark";
import { deepCopy } from "../../utils/misc";
import { validateURL } from "../../utils/validate";
import { QuestionText, SupplementalText } from "./QuestionStyles";
import { UserContext } from "../../providers/UserProvider";
import { resourceIsComplete } from "../../utils/validate";
import ItemCards from "./ItemCards";

const Resources = ({ updateResources, resources, disabled }) => {
  const mounted = useRef(false);
  const { checkURLActive } = useContext(UserContext);
  const { language } = useParams();
  const [urlIsActive, setUrlIsActive] = useState({});
  const emptyResource = { url: "", name: "", description: { en: "", fr: "" } };
  const [activeResource, setActiveResource] = useState(null);

  const debouncePool = useRef({});

  useEffect(() => {
    mounted.current = true;

    resources.forEach((resource, idx) => {
      if (resource.url && validateURL(resource.url)) {
        if (!debouncePool.current[idx]) {
          debouncePool.current[idx] = debounce(async (innerResource) => {
            const response = await checkURLActive(innerResource.url);
            if (mounted.current) {
              setUrlIsActive((prevStatus) => ({
                ...prevStatus,
                [innerResource.url]: response.data,
              }));
            }
          }, 500);
        }
        debouncePool.current[idx](resource);
      }
    });

    return () => {
      mounted.current = false;
    };
  }, [resources, checkURLActive]);

  const nameLabel = <I18n en="Name" fr="Titre" />;
  const descriptionLabel = <I18n en="Description" fr="Description" />;
  const resourceStep = resources.length > 0 && resources[activeResource];
  const urlIsValid =
    resourceStep && (!resourceStep.url || validateURL(resourceStep.url));

  function handleResourceChange(key) {
    return (e) => {
      const newValue = [...resources];
      newValue[activeResource][key] = e.target.value;
      updateResources(newValue);
    };
  }

  return (
    <Box>
      <ItemCards
        items={resources}
        updateItems={updateResources}
        openIndex={activeResource}
        setOpenIndex={setActiveResource}
        disabled={disabled}
        idPrefix="resource"
        numbered
        itemNoun={{ en: "resource", fr: "ressource" }}
        ariaLabel={language === "fr" ? "Ressources" : "Resources"}
        itemTitle={(item) => item.name?.[language]}
        itemMeta={(item) => item.url}
        isComplete={resourceIsComplete}
        getBlankItem={() => deepCopy(emptyResource)}
        duplicateItem={(copy) => {
          if (copy.name?.en) copy.name.en += " (copy)";
          if (copy.name?.fr) copy.name.fr += " (copie)";
          return copy;
        }}
        addLabel=<I18n en="Add resource" fr="Ajouter une ressource" />
        emptyText=<I18n
          en="No resources yet."
          fr="Aucune ressource pour l'instant."
        />
        renderEditor={() => (
          <Box>
            <Grid container direction="column" spacing={3}>
              <Grid>
                <QuestionText>
                  <I18n>
                    <En>Enter a name for the resource</En>
                    <Fr>Entrez un titre pour la ressource</Fr>
                  </I18n>
                  <RequiredMark
                    passes={resourceStep.name?.en || resourceStep.name?.fr}
                  />
                </QuestionText>
                <BilingualTextInput
                  name="name"
                  label={nameLabel}
                  value={resourceStep.name}
                  onChange={handleResourceChange("name")}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid>
                <QuestionText>
                  <I18n>
                    <En>Enter the URL for the resource</En>
                    <Fr>Entrez l'URL de la ressource</Fr>
                  </I18n>

                  <RequiredMark passes={validator.isURL(resourceStep.url)} />
                  <SupplementalText>
                    <I18n>
                      <En>
                        <p>
                          The link may be to a formal data resource on another
                          repository or a link to a personal online drive (e.g.
                          Google Drive).
                        </p>
                      </En>
                      <Fr>
                        <p>
                          Ce lien peut renvoyer vers une ressource de données
                          sur un autre dépôt de données ou un lien vers un
                          espace de stockage personnel en ligne (par exemple,
                          Google Drive).
                        </p>
                      </Fr>
                    </I18n>
                  </SupplementalText>
                </QuestionText>

                <TextField
                  helperText={
                    (!urlIsValid && (
                      <I18n en="Invalid URL" fr="URL non valide" />
                    )) ||
                    (resourceStep.url &&
                      urlIsActive[resourceStep.url] === false && (
                        <I18n
                          en="URL is not active"
                          fr="L'URL n'est pas active"
                        />
                      )) ||
                    (resourceStep.url &&
                      urlIsActive[resourceStep.url] === true && (
                        <I18n en="URL is active" fr="L'URL est active" />
                      ))
                  }
                  error={!urlIsValid}
                  label="URL"
                  value={resourceStep.url}
                  onChange={handleResourceChange("url")}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid>
                <QuestionText>
                  <I18n>
                    <En>Enter a description of the resource</En>
                    <Fr>Entrez une description de la ressource</Fr>
                  </I18n>
                </QuestionText>{" "}
                <BilingualTextInput
                  name="description"
                  label={descriptionLabel}
                  value={resourceStep.description}
                  onChange={handleResourceChange("description")}
                  disabled={disabled}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      />
    </Box>
  );
};

export default Resources;
