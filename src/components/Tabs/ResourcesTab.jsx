import React from "react";
import { useParams } from "react-router-dom";
import { Box, Stack } from "@mui/material";
import Resources from "../FormComponents/Resources";
import RelatedWorks from "../FormComponents/RelatedWorks";
import Lineage from "../FormComponents/Lineage";
import FormSection from "../FormShell/FormSection";
import FormField from "../FormShell/FormField";
import { En, Fr, I18n } from "../I18n";
import { validateField } from "../../utils/validate";

// Section title with the number of entries, so a collapsed card still says
// what's inside it.
const CountedTitle = ({ children, count }) => (
  <>
    {children}
    {count > 0 && (
      <Box
        component="span"
        sx={{
          ml: 1,
          px: 0.75,
          borderRadius: 999,
          fontSize: "0.75rem",
          fontWeight: 600,
          verticalAlign: "2px",
          color: "text.secondary",
          border: 1,
          borderColor: "divider",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
      </Box>
    )}
  </>
);

const ResourcesTab = ({ disabled, record, updateRecord }) => {
  const { language } = useParams();

  // Empty lists open by default; filled ones start collapsed to their count.
  const [defaultExpanded] = React.useState([
    !record.distribution?.length,
    !record.associated_resources?.length,
    !record.history?.length,
  ]);

  return (
    <Stack spacing={2}>
      <FormSection
        collapsible
        defaultExpanded={defaultExpanded[0]}
        title={
          <CountedTitle count={record.distribution?.length || 0}>
            <I18n en="Resources" fr="Ressources" />
          </CountedTitle>
        }
      >
        <FormField
          id="field-distribution"
          label={
            <I18n
              en="Links to the data and its documentation"
              fr="Liens vers les données et leur documentation"
            />
          }
          required
          complete={validateField(record, "distribution")}
          hint={
            <I18n
              en="List the main resource first. A link to a compressed data package or folder is preferred."
              fr="Indiquez d'abord la ressource principale. Un lien vers un paquet ou dossier de données compressé est préférable."
            />
          }
          guidance={
            <I18n>
              <En>
                <p>
                  Enter one or more links to the primary resource described by
                  this metadata record. Resources added here should not already
                  have their own metadata record or digital object identifier;
                  such resources should be added to "Related works".
                </p>
                Some examples of resources are:
                <ul>
                  <li>Protocols or methods documents</li>
                  <li>CSV files</li>
                  <li>ERDDAP datasets</li>
                  <li>Images</li>
                  <li>Online forms to request access to the data</li>
                </ul>
              </En>
              <Fr>
                <p>
                  Entrez un ou plusieurs liens vers la ressource principale
                  décrite par cet enregistrement de métadonnées. Les ressources
                  ajoutées ici ne doivent pas déjà avoir leur propre
                  enregistrement de métadonnées ou identifiant d'objet
                  numérique. Ces ressources doivent être ajoutées à la section «
                  Travaux connexes ».
                </p>
                Voici quelques exemples de ressources :
                <ul>
                  <li>Documents de protocoles ou de méthodes</li>
                  <li>Fichiers CSV</li>
                  <li>Ensembles de données ERDDAP</li>
                  <li>Images</li>
                  <li>
                    Formulaires en ligne pour demander l'accès aux données
                  </li>
                </ul>
              </Fr>
            </I18n>
          }
        >
          <Resources
            resources={record.distribution || []}
            updateResources={updateRecord("distribution")}
            language={language}
            disabled={disabled}
          />
        </FormField>
      </FormSection>

      <FormSection
        collapsible
        defaultExpanded={defaultExpanded[1]}
        title={
          <CountedTitle count={record.associated_resources?.length || 0}>
            <I18n en="Related works" fr="Travaux connexes" />
          </CountedTitle>
        }
      >
        <FormField
          id="field-associated_resources"
          label={
            <I18n
              en="Related records and publications"
              fr="Enregistrements et publications connexes"
            />
          }
          complete={validateField(record, "associated_resources")}
          hint={
            <I18n
              en="Other metadata records, publications or works related to this data."
              fr="Autres enregistrements de métadonnées, publications ou ouvrages liés à ces données."
            />
          }
          guidance={
            <I18n>
              <En>
                Related works may be:
                <ul>
                  <li>
                    Other datasets that are part of the same collection,
                    project, or sampling protocol
                  </li>
                  <li>
                    Metadata records on other catalogues such as OBIS or FRDR
                    that describe the same dataset
                  </li>
                  <li>
                    Any work that adds context to or describes the primary
                    resource for which you are creating this metadata record
                  </li>
                </ul>
              </En>
              <Fr>
                Les œuvres connexes peuvent être :
                <ul>
                  <li>
                    Autres ensembles de données faisant partie de la même
                    collection, du même projet ou du même protocole
                    d'échantillonnage
                  </li>
                  <li>
                    Enregistrements de métadonnées sur d'autres catalogues tels
                    que OBIS ou FRDR qui décrivent le même ensemble de données
                  </li>
                  <li>
                    Tout travail qui ajoute du contexte ou décrit la ressource
                    principale pour laquelle vous créez cet enregistrement de
                    métadonnées
                  </li>
                </ul>
              </Fr>
            </I18n>
          }
        >
          <RelatedWorks
            resources={record.associated_resources || []}
            updateResources={updateRecord("associated_resources")}
            language={language}
            disabled={disabled}
          />
        </FormField>
      </FormSection>

      <FormSection
        collapsible
        defaultExpanded={defaultExpanded[2]}
        title={
          <CountedTitle count={record.history?.length || 0}>
            <I18n en="Lineage" fr="Généalogie des données" />
          </CountedTitle>
        }
      >
        <FormField
          id="field-history"
          label={
            <I18n
              en="Processing history (provenance)"
              fr="Provenance et traitement des données"
            />
          }
          complete={validateField(record, "history")}
          hint={
            <I18n
              en="Events and source data used to produce this data."
              fr="Les étapes de traitement et les données sources utilisées."
            />
          }
          guidance={
            <I18n
              en="Enter information about the events or source data used in constructing the data specified by the scope."
              fr="Pour chaque ressource, fournissez des informations supplémentaires sur le traitement des données, et/ou spécifiez la source des données utilisées."
            />
          }
        >
          <Lineage
            history={record.history}
            updateLineage={updateRecord("history")}
            disabled={disabled}
            language={language}
            metadataScope={record.metadataScope}
          />
        </FormField>
      </FormSection>
    </Stack>
  );
};

export default ResourcesTab;
