import React, { useState } from "react";
import {
  Paper,
  TextField,
  Typography,
  Chip,
  Button,
  Stack,
  Alert,
} from "@mui/material";
import { useParams } from "react-router-dom";

import { En, Fr, I18n } from "../I18n";
import { sampleCatalogue } from "../../utils/sampleCollections";
import {
  searchPackages,
  packageIdentifier,
} from "../../utils/collectionSearch";
import { isCollection } from "../../utils/collectionMode";
import { QuestionText, SupplementalText, paperClass } from "./QuestionStyles";

// Dataset mode: find a parent Collection and add it as a related work.
// Collection mode: placeholder for the member-datasets panel (open question).
const CollectionLinkSearch = ({ record, updateRecord, disabled }) => {
  const { language } = useParams();
  const [query, setQuery] = useState("");

  if (isCollection(record)) {
    return (
      <Paper style={paperClass}>
        <QuestionText>
          <I18n>
            <En>Member datasets</En>
            <Fr>Jeux de données membres</Fr>
          </I18n>
        </QuestionText>
        <Alert severity="warning" sx={{ mt: 1 }}>
          <I18n>
            <En>
              Open question: how a Collection lists or manages its member
              datasets is not designed yet. In this prototype, datasets link
              themselves to a Collection.
            </En>
            <Fr>
              Question ouverte : la façon dont une collection liste ou gère ses
              jeux de données membres n&apos;est pas encore définie. Dans ce
              prototype, ce sont les jeux de données qui se lient à une
              collection.
            </Fr>
          </I18n>
        </Alert>
      </Paper>
    );
  }

  const relatedWorks = record.associated_resources || [];
  const isLinked = (p) => {
    const { code } = packageIdentifier(p);
    return relatedWorks.some(
      (w) => (w.code || "").toLowerCase() === code.toLowerCase(),
    );
  };

  const addLink = (p) => {
    const { authority, code } = packageIdentifier(p);
    updateRecord("associated_resources")([
      ...relatedWorks,
      {
        title: { en: p.title_translated.en, fr: p.title_translated.fr },
        authority,
        code,
        association_type: "IsPartOf",
        association_type_iso: "largerWorkCitation",
        initiative_type: "collection",
      },
    ]);
  };

  const results = searchPackages(sampleCatalogue, query, {
    type: "collection",
  });

  return (
    <Paper style={paperClass}>
      <QuestionText>
        <I18n>
          <En>Is this dataset part of a Collection?</En>
          <Fr>Ce jeu de données fait-il partie d&apos;une collection?</Fr>
        </I18n>
        <SupplementalText>
          <I18n>
            <En>
              Search by Collection name, UUID or DOI. Adding a Collection
              creates a related work with the relation &quot;Is Part Of&quot;.
              (Prototype: searches sample data, not the live catalogue.)
            </En>
            <Fr>
              Recherchez par nom de collection, UUID ou DOI. L&apos;ajout
              d&apos;une collection crée un travail connexe avec la relation «
              Fait partie de ». (Prototype : la recherche porte sur des données
              d&apos;exemple, pas sur le catalogue en ligne.)
            </Fr>
          </I18n>
        </SupplementalText>
      </QuestionText>

      <TextField
        label={
          language === "fr"
            ? "Rechercher une collection"
            : "Search for a Collection"
        }
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={disabled}
        fullWidth
        style={{ marginTop: "10px" }}
      />

      {query.trim() && results.length === 0 && (
        <Typography variant="body2" style={{ marginTop: "10px" }}>
          <I18n en="No Collection found." fr="Aucune collection trouvée." />
        </Typography>
      )}

      <Stack spacing={1} style={{ marginTop: "10px" }}>
        {results.map((p) => {
          const linked = isLinked(p);
          return (
            <Paper key={p.id} variant="outlined" style={{ padding: "10px" }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
              >
                <div>
                  <Typography variant="subtitle1">
                    {p.title_translated[language]}{" "}
                    <Chip
                      size="small"
                      color="primary"
                      label={<I18n en="Collection" fr="Collection" />}
                    />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {p.organization.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {p.doi ? `DOI ${p.doi} · ` : ""}UUID {p.id}
                  </Typography>
                </div>
                {linked ? (
                  <Chip
                    color="success"
                    label={<I18n en="Already linked" fr="Déjà liée" />}
                  />
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => addLink(p)}
                    disabled={disabled}
                  >
                    <I18n en="Add" fr="Ajouter" />
                  </Button>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default CollectionLinkSearch;
