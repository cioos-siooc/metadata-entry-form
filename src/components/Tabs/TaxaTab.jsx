import React, { useState, useRef, useEffect } from "react";
import FormSection from "../FormShell/FormSection";
import ItemCards from "../FormComponents/ItemCards";
import {
  TextField,
  Button,
  TableContainer,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Box,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Stack,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { capitalize } from "@mui/material/utils";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { En, Fr, I18n } from "../I18n";
import FormField from "../FormShell/FormField";
import { validateField } from "../../utils/validate";

// GBIF field names, as shown in the details table.
const taxonFieldLabels = {
  rank: { en: "Rank", fr: "Rang" },
  kingdom: { en: "Kingdom", fr: "Règne" },
  phylum: { en: "Phylum", fr: "Embranchement" },
  Class: { en: "Class", fr: "Classe" },
  order: { en: "Order", fr: "Ordre" },
  family: { en: "Family", fr: "Famille" },
  genus: { en: "Genus", fr: "Genre" },
  species: { en: "Species", fr: "Espèce" },
  scientificName: { en: "Scientific name", fr: "Nom scientifique" },
  canonicalName: { en: "Canonical name", fr: "Nom canonique" },
  parent: { en: "Parent", fr: "Parent" },
};

const TaxaTab = ({ record, updateRecord, disabled }) => {
  const { language } = useParams();
  const { taxa = [] } = record;
  const updateTaxa = updateRecord("taxa");
  // The open taxon, or null when every row is folded.
  const [activeTaxa, setActiveTaxa] = useState(null);

  const [inputValue, setInputValue] = useState("");
  const [SearchValue, setSearchValue] = useState("");

  const [data, setData] = useState([]);
  const mounted = useRef(false);
  const requestInProgress = useRef(false);
  const [searching, setSearching] = useState(false);

  function handleAdd() {
    if (SearchValue) {
      updateTaxa(taxa.concat(SearchValue));
      setSearchValue("");
      setInputValue("");
    }
  }

  function getActiveTaxaDetails() {
    if (taxa[activeTaxa]) {
      const {
        rank,
        kingdom,
        phylum,
        class: Class,
        order,
        family,
        genus,
        species,
        scientificName,
        canonicalName,
        parent,
      } = taxa[activeTaxa];
      const details = {
        rank,
        kingdom,
        phylum,
        Class,
        order,
        family,
        genus,
        species,
        scientificName,
        canonicalName,
        parent,
      };
      return details;
    }
    return {};
  }

  const gbifSearch = useDebouncedCallback((searchStr) => {
    const config = {
      method: "get",
      url: "https://api.gbif.org/v1/species/suggest",
      params: {
        q: searchStr,
      },
    };
    requestInProgress.current = true;
    setSearching(true);
    axios(config)
      .then((response) => {
        if (mounted.current) {
          setData([...response.data]);
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        requestInProgress.current = false;
        if (mounted.current) setSearching(false);
      });
  }, 500);

  useEffect(() => {
    mounted.current = true;

    if (inputValue.length > 2 && !SearchValue && !requestInProgress.current) {
      gbifSearch(inputValue);
    }

    return () => {
      mounted.current = false;
    };
  }, [inputValue, SearchValue, gbifSearch]);

  const noTaxa = record.noTaxa && record.noTaxa !== "false";

  return (
    <Stack spacing={2}>
      <FormSection
        title={<I18n en="Taxonomic coverage" fr="Couverture taxonomique" />}
      >
        <FormField
          id="field-taxa"
          label={<I18n en="Taxa" fr="Taxons" />}
          required
          complete={validateField(record, "taxa")}
          hint={
            <I18n
              en="Search GBIF and add each taxon, or confirm the dataset has none."
              fr="Recherchez dans GBIF et ajoutez chaque taxon, ou confirmez que le jeu de données n'en contient pas."
            />
          }
          guidance={
            <I18n
              en="Please enter the metadata about the taxonomic areas covered by the resource."
              fr="Veuillez saisir les métadonnées sur les domaines taxonomiques couverts par la ressource."
            />
          }
        >
          <FormControlLabel
            disabled={disabled}
            control={
              <Checkbox
                name="noTaxa"
                checked={Boolean(noTaxa)}
                onChange={(e) => {
                  const { checked } = e.target;

                  updateRecord("noTaxa")(checked);
                }}
              />
            }
            label={
              <I18n>
                <En>
                  This dataset does not contain any taxonomic classification
                </En>
                <Fr>
                  Ce jeu de données ne contient aucune classification
                  taxonomique
                </Fr>
              </I18n>
            }
          />

          {!noTaxa && (
            <Stack spacing={2} sx={{ mt: 1.5 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "flex-end" }}
                sx={{ maxWidth: 720 }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Autocomplete
                    inputValue={inputValue}
                    onInputChange={(event, newInputValue) => {
                      setInputValue(newInputValue);
                    }}
                    getOptionLabel={(option) =>
                      (option.scientificName &&
                        `${option.scientificName} (${option.canonicalName})`) ??
                      option
                    }
                    disabled={disabled}
                    // onChange={(e, keyword) =>
                    //     setSelectedKeywordAltLang(translate(keyword, altLanguage))
                    // }
                    loading={searching}
                    loadingText={
                      language === "fr" ? "Recherche…" : "Searching…"
                    }
                    noOptionsText={
                      language === "fr"
                        ? "Aucun taxon trouvé"
                        : "No matching taxa"
                    }
                    onChange={(event, newValue) => {
                      if (typeof newValue === "object") {
                        setSearchValue(newValue);
                      }
                    }}
                    value={SearchValue}
                    freeSolo
                    options={data}
                    fullWidth
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={
                          <I18n>
                            <En>GBIF taxa Search</En>
                            <Fr>Recherche de taxons dans GBIF</Fr>
                          </I18n>
                        }
                      />
                    )}
                  />
                </Box>
                <Button
                  variant="outlined"
                  disabled={disabled || (!SearchValue && !inputValue)}
                  startIcon={<Add />}
                  onClick={() => handleAdd()}
                  sx={{ flexShrink: 0, minHeight: 41 }}
                >
                  <I18n>
                    <En>Add</En>
                    <Fr>Ajouter</Fr>
                  </I18n>
                </Button>
              </Stack>

              <ItemCards
                items={taxa}
                updateItems={updateTaxa}
                openIndex={activeTaxa}
                setOpenIndex={setActiveTaxa}
                disabled={disabled}
                idPrefix="taxa"
                allowDuplicate={false}
                itemNoun={{ en: "taxon", fr: "taxon" }}
                ariaLabel={
                  language === "fr"
                    ? "Taxons dans cet enregistrement"
                    : "Taxa in this record"
                }
                itemTitle={(taxon) => taxon?.scientificName}
                itemMeta={(taxon) =>
                  [
                    taxon?.rank && capitalize(String(taxon.rank).toLowerCase()),
                    taxon?.kingdom,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                }
                emptyText={
                  <I18n
                    en="No taxa yet. Search above and select Add."
                    fr="Aucun taxon pour l'instant. Recherchez ci-dessus puis sélectionnez Ajouter."
                  />
                }
                renderEditor={() => (
                  <Box
                    sx={(theme) => ({
                      border: `1px solid ${theme.vars.palette.divider}`,
                      borderRadius: 1,
                      overflow: "hidden",
                    })}
                  >
                    <TableContainer>
                      <Table
                        size="small"
                        aria-label={
                          language === "fr"
                            ? "Détails du taxon"
                            : "Taxon details"
                        }
                      >
                        <TableBody>
                          {Object.entries(getActiveTaxaDetails()).map(
                            ([key, value]) => (
                              <TableRow
                                key={key}
                                sx={{
                                  "&:last-child td, &:last-child th": {
                                    border: 0,
                                  },
                                }}
                              >
                                <TableCell
                                  component="th"
                                  scope="row"
                                  variant="head"
                                  align="left"
                                  sx={{ width: 146 }}
                                >
                                  {taxonFieldLabels[key]?.[language] ??
                                    capitalize(key)}
                                </TableCell>
                                <TableCell align="left">{value}</TableCell>
                              </TableRow>
                            ),
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              />
            </Stack>
          )}
        </FormField>
      </FormSection>
    </Stack>
  );
};
export default TaxaTab;
