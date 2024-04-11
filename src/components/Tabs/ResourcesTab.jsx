import React from "react";
import { useParams } from "react-router-dom";
import { 
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from "@material-ui/core";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import Resources from "../FormComponents/Resources";
import RelatedWorks from "../FormComponents/RelatedWorks";
import Lineage from "../FormComponents/Lineage";
import { En, Fr, I18n } from "../I18n";
import RequiredMark from "../FormComponents/RequiredMark";
import {
  paperClass,
  QuestionText,
  HeadingText,
  SupplementalText,
} from "../FormComponents/QuestionStyles";
import { validateField } from "../../utils/validate";




const ResourcesTab = ({ disabled, record, updateRecord }) => {
  // const [value, setValue] = React.useState("resources");
  const { language } = useParams() 

  // const handleChange = (event, newValue) => {
  //   setValue(newValue);
  // };

  const [AccordionDefaultExpanded] = React.useState([
    (record.distribution && record.distribution.length === 0),
    (record.associated_resources && record.associated_resources.length === 0),
    (record.history && record.history.length === 0),
  ]);

  // const handleDrawerOpen = () => {
  //   setOpen(true);
  // };

  // const handleDrawerClose = () => {
  //   setOpen(false);
  // };

  return (
    <div>

      <Accordion defaultExpanded={AccordionDefaultExpanded[0]} style={{ width:'90%', margin:20}}>
        <AccordionSummary
          expandIcon={<ArrowDownwardIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
          style={{ backgroundColor: '#00000015' }}
        >
          <HeadingText>
            <I18n>
              <En>Resource</En>
              <Fr>La ressource</Fr>
            </I18n>
            {record.distribution && record.distribution.length > 0 && (<Chip style={{ marginLeft: 10 }} label={record.distribution.length} variant="outlined" />)}
          </HeadingText>
        </AccordionSummary>
        <AccordionDetails>
          <Grid>
            <QuestionText>
              <En>Enter one or more links to the primary resource described by this
                metadata record. Resources added here should not already have their
                own metadata record or digital object identifier, such resources
                should be added to the "Related Works" section.</En>
              <Fr>
                Entrez un ou plusieurs liens vers la ressource principale décrite par
                cet enregistrement de métadonnées. Les ressources ajoutées ici ne
                doivent pas déjà avoir leur propre enregistrement de métadonnées ou
                identifiant d'objet numérique, ces ressources doivent être ajoutées à
                la section "Travaux associés".
              </Fr>
              <RequiredMark passes={validateField(record, "distribution")} />
              <SupplementalText>
                <I18n>
                  <En>
                    Some examples of resources are:
                    <ul>
                      <li>Protocols or methods documents</li>
                      <li>CSV files</li>
                      <li>ERDDAP datasets</li>
                      <li>Images</li>
                      <li>Online forms to request access to the data</li>
                    </ul>
                    A Resource URL that links to a compressed data package or folder is
                    preferred. Otherwise, list primary resource first followed by
                    supporting resources.
                  </En>
                  <Fr>
                    Voici quelques exemples de ressources :
                    <ul>
                      <li>Documents de protocoles ou de méthodes</li>
                      <li>Fichiers CSV</li>
                      <li>Ensembles de données ERDDAP</li>
                      <li>Images</li>
                      <li>Formulaires en ligne pour demander l'accès aux données</li>
                    </ul>
                    Une URL de ressource qui renvoie à un package ou un dossier de données
                    compressées est préférable. Sinon, répertoriez d'abord la ressource
                    principale, suivie des ressources de support.
                  </Fr>
                </I18n>
              </SupplementalText>
            </QuestionText>
            <Resources
              resources={record.distribution || []}
              updateResources={updateRecord("distribution")}
              language={language}
              disabled={disabled}
            />
          </Grid>
        </AccordionDetails>
      </Accordion>
      <Accordion defaultExpanded={AccordionDefaultExpanded[1]} style={{ width: '90%', margin: 20 }}>
        <AccordionSummary
          expandIcon={<ArrowDownwardIcon />}
          aria-controls="panel2a-content"
          id="panel2a-header"
          style={{ backgroundColor: '#00000015' }}
        >
          <HeadingText>
            <I18n>
              <En>Related Works</En>
              <Fr>Travaux connexes</Fr>
            </I18n>
            {record.associated_resources && record.associated_resources.length > 0 && (<Chip style={{ marginLeft: 10 }} label={record.associated_resources.length} variant="outlined" />)}
          </HeadingText>
        </AccordionSummary>
        <AccordionDetails> 
          <Grid>
            <QuestionText>
              <En>Enter links to other metadata records, publications or works that are
                related to the primary resources this metadata record describes.
              </En>
              <Fr>
                Entrez des liens vers d'autres enregistrements de métadonnées, publications ou ouvrages qui sont
                liés aux ressources principales décrites par cet enregistrement de métadonnées.
              </Fr>
              <RequiredMark passes={validateField(record, "associated_resources")} />
              <SupplementalText>
                <I18n>
                  <En>
                    Related works may be:
                    <ul>
                      <li>Other datasets that are part of the same collection, project, or sampling protocol</li>
                      <li>Metadata records on other catalogues such as OBIS or FRDR that describe the same dataset</li>
                      <li>Any work that adds context to or describes the primary resource for which you are creating this metadata record for</li>
                    </ul>
                  </En>
                  <Fr>
                    Les œuvres connexes peuvent être :
                    <ul>
                      <li>Autres ensembles de données faisant partie de la même collection, du même projet ou du même protocole d'échantillonnage</li>
                      <li>Enregistrements de métadonnées sur d'autres catalogues tels que OBIS ou FRDR qui décrivent le même ensemble de données</li>
                      <li>Tout travail qui ajoute du contexte ou décrit la ressource principale pour laquelle vous créez cet enregistrement de métadonnées</li>
                    </ul>
                  </Fr>
                </I18n>
              </SupplementalText>
            </QuestionText>
            <RelatedWorks
              resources={record.associated_resources || []}
              updateResources={updateRecord("associated_resources")}
              language={language}
              disabled={disabled}
            />
          </Grid>
        </AccordionDetails>
      </Accordion>
      <Accordion defaultExpanded={AccordionDefaultExpanded[2]} style={{ width: '90%', margin: 20 }}>
        <AccordionSummary
          expandIcon={<ArrowDownwardIcon />}
          aria-controls="panel3a-content"
          id="panel3a-header"
          style={{ backgroundColor: '#00000015' }}
        >
          
          <HeadingText>            
            <I18n>
              <En>Lineage</En>
              <Fr>Lignée</Fr>
            </I18n>
            {record.history && record.history.length > 0 && (<Chip style={{ marginLeft: 10 }} label={record.history.length} variant="outlined" />)}            
          </HeadingText>

        </AccordionSummary>
        <AccordionDetails>
          <Grid>
            <QuestionText>
              <En>
                Data processing history (provenance) for the resource.
              </En>
              <Fr>
                Historique du traitement des données (provenance) pour la ressource.
              </Fr>
              <RequiredMark passes={validateField(record, "history")} />
              <SupplementalText>
                <I18n>
                  <En>
                    Enter Information about the events or source data used in constructing the data specified by the scope.
                  </En>
                  <Fr>
                    Entrez des informations sur les événements ou les données sources utilisées dans la construction des données spécifiées par la portée.
                  </Fr>
                </I18n>
              </SupplementalText>
            </QuestionText>
            <Lineage
              history={record.history}
              updateLineage={updateRecord("history")}
              disabled={disabled}
              paperClass={paperClass}
              language={language}
              metadataScope={record.metadataScope}
            />
          </Grid>
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export default ResourcesTab;
