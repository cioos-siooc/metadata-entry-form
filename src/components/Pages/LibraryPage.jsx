import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Tooltip,
} from "@mui/material";
import {
  Add,
  ContentCopyOutlined,
  DeleteOutline,
  PeopleAltOutlined,
  Search,
  SensorsOutlined,
  DirectionsBoatOutlined,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { getDatabase, onValue, ref } from "firebase/database";
import firebase from "../../firebase";
import { auth, getAuth, onAuthStateChanged } from "../../auth";
import {
  newContact,
  cloneContact,
  deleteContact,
} from "../../utils/firebaseContactFunctions";
import {
  newInstrument,
  cloneInstrument,
  deleteInstrument,
} from "../../utils/firebaseInstrumentFunctions";
import {
  newPlatform,
  clonePlatform,
  deletePlatform,
} from "../../utils/firebasePlatformFunctions";
import { getContactTitleFromNames } from "../FormComponents/ContactTitle";
import { getInstrumentTitleFromNames } from "../FormComponents/InstrumentTitle";
import { getPlatformTitleFromNames } from "../FormComponents/PlatformTitle";
import SimpleModal from "../FormComponents/SimpleModal";
import { Page, PageHeader, EmptyState } from "../Layout/Page";

// The saved contacts, instruments and platforms a user reuses across records.
// One page, three kinds: they differ only in their data and their words.
const KINDS = {
  contacts: {
    icon: PeopleAltOutlined,
    title: { en: "Contacts", fr: "Contacts" },
    description: {
      en: "People and organizations you can add to any record without retyping them.",
      fr: "Les personnes et organisations que vous pouvez ajouter à n'importe quel enregistrement sans les ressaisir.",
    },
    add: { en: "New contact", fr: "Nouveau contact" },
    untitled: { en: "Unnamed contact", fr: "Contact sans nom" },
    empty: {
      en: "Contacts you save here, or from a record's Contacts section, are ready to reuse in your next record.",
      fr: "Les contacts enregistrés ici, ou depuis la section Contacts d'un enregistrement, sont prêts à être réutilisés.",
    },
    getTitle: getContactTitleFromNames,
    getSubtitle: (c) => c.indEmail || c.orgEmail || "",
    create: newContact,
    clone: cloneContact,
    remove: deleteContact,
  },
  instruments: {
    icon: SensorsOutlined,
    title: { en: "Instruments", fr: "Instruments" },
    description: {
      en: "Instruments you describe once and reuse across records.",
      fr: "Les instruments que vous décrivez une fois et réutilisez dans vos enregistrements.",
    },
    add: { en: "New instrument", fr: "Nouvel instrument" },
    untitled: { en: "Unnamed instrument", fr: "Instrument sans nom" },
    empty: {
      en: "Save the instruments you deploy often so they are one click away in the Platform section.",
      fr: "Enregistrez les instruments que vous déployez souvent pour les retrouver en un clic dans la section Plateforme.",
    },
    getTitle: getInstrumentTitleFromNames,
    getSubtitle: (i) => i.version || "",
    create: newInstrument,
    clone: cloneInstrument,
    remove: deleteInstrument,
  },
  platforms: {
    icon: DirectionsBoatOutlined,
    title: { en: "Platforms", fr: "Plateformes" },
    description: {
      en: "Vessels, moorings and other platforms you describe once and reuse across records.",
      fr: "Les navires, mouillages et autres plateformes que vous décrivez une fois et réutilisez.",
    },
    add: { en: "New platform", fr: "Nouvelle plateforme" },
    untitled: { en: "Unnamed platform", fr: "Plateforme sans nom" },
    empty: {
      en: "Save the platforms you use often so they are one click away in the Platform section.",
      fr: "Enregistrez les plateformes que vous utilisez souvent pour les retrouver en un clic dans la section Plateforme.",
    },
    getTitle: getPlatformTitleFromNames,
    getSubtitle: (p) => p.description?.en || p.description?.fr || "",
    create: newPlatform,
    clone: clonePlatform,
    remove: deletePlatform,
  },
};

const SEARCH_THRESHOLD = 8;

const normalize = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export default function LibraryPage({ kind }) {
  const config = KINDS[kind];
  const { language, region } = useParams();
  const navigate = useNavigate();
  const fr = language === "fr";
  const t = (pair) => pair[fr ? "fr" : "en"];

  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    setLoading(true);
    let offValue = null;
    const offAuth = onAuthStateChanged(getAuth(firebase), (user) => {
      offValue?.();
      offValue = null;
      if (!user) return;
      offValue = onValue(
        ref(getDatabase(firebase), `${region}/users/${user.uid}/${kind}`),
        (snapshot) => {
          setItems(snapshot.toJSON() || {});
          setLoading(false);
        },
      );
    });
    return () => {
      offAuth();
      offValue?.();
    };
  }, [region, kind]);

  const sorted = useMemo(
    () =>
      Object.entries(items)
        .map(([key, value]) => ({
          key,
          title: config.getTitle(value),
          subtitle: config.getSubtitle(value),
        }))
        .sort((a, b) =>
          a.title.localeCompare(b.title, fr ? "fr" : "en", {
            sensitivity: "base",
          }),
        ),
    [items, config, fr],
  );

  const visible = query
    ? sorted.filter((item) =>
        normalize(`${item.title} ${item.subtitle}`).includes(normalize(query)),
      )
    : sorted;

  const open = (key) => navigate(`/${language}/${region}/${kind}/${key}`);

  const create = () => {
    if (!auth.currentUser) return;
    config.create(region, auth.currentUser.uid).then(open);
  };

  const addButton = (
    <Button variant="contained" startIcon={<Add />} onClick={create}>
      {t(config.add)}
    </Button>
  );

  let body;
  if (loading) {
    body = (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  } else if (sorted.length === 0) {
    body = (
      <EmptyState
        icon={config.icon}
        title={
          fr
            ? `Aucun élément pour l'instant`
            : `No ${t(config.title).toLowerCase()} yet`
        }
        action={addButton}
      >
        {t(config.empty)}
      </EmptyState>
    );
  } else {
    body = (
      <>
        {sorted.length > SEARCH_THRESHOLD && (
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={fr ? "Rechercher" : "Search"}
            size="small"
            fullWidth
            slotProps={{
              htmlInput: { "aria-label": fr ? "Rechercher" : "Search" },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2, maxWidth: 420 }}
          />
        )}
        <List
          disablePadding
          sx={(theme) => ({
            border: `1px solid ${theme.vars.palette.divider}`,
            borderRadius: 1.5,
            overflow: "hidden",
            bgcolor: "background.paper",
          })}
        >
          {visible.map(({ key, title, subtitle }, i) => (
            <ListItem
              key={key}
              disablePadding
              divider={i < visible.length - 1}
              secondaryAction={
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Tooltip title={fr ? "Dupliquer" : "Duplicate"}>
                    <IconButton
                      aria-label={`${fr ? "Dupliquer" : "Duplicate"} ${title}`}
                      onClick={() =>
                        auth.currentUser &&
                        config.clone(region, auth.currentUser.uid, key)
                      }
                    >
                      <ContentCopyOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={fr ? "Supprimer" : "Delete"}>
                    <IconButton
                      aria-label={`${fr ? "Supprimer" : "Delete"} ${title}`}
                      onClick={() => setPendingDelete({ key, title })}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              sx={{ "& .MuiListItemSecondaryAction-root": { right: 12 } }}
            >
              <ListItemButton
                onClick={() => open(key)}
                sx={{ borderRadius: 0, py: 1.25, pl: 2.5, pr: 13 }}
              >
                <ListItemText
                  primary={
                    title || (
                      <Box component="span" sx={{ color: "text.secondary" }}>
                        {t(config.untitled)}
                      </Box>
                    )
                  }
                  secondary={subtitle || undefined}
                  slotProps={{
                    primary: { sx: { fontWeight: 500 } },
                    secondary: {
                      sx: {
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          {visible.length === 0 && (
            <ListItem
              sx={{ py: 3, justifyContent: "center", color: "text.secondary" }}
            >
              {fr ? "Aucun résultat." : "No matches."}
            </ListItem>
          )}
        </List>
      </>
    );
  }

  return (
    <Page maxWidth={960}>
      <SimpleModal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onAccept={() =>
          auth.currentUser &&
          config.remove(region, auth.currentUser.uid, pendingDelete.key)
        }
        modalQuestion={
          fr
            ? `Supprimer « ${pendingDelete?.title || t(config.untitled)} » ?`
            : `Delete “${pendingDelete?.title || t(config.untitled)}”?`
        }
        detail={
          fr
            ? "Les enregistrements qui l'utilisent déjà en gardent leur copie."
            : "Records that already use it keep their own copy."
        }
        confirmLabel={fr ? "Supprimer" : "Delete"}
        destructive
      />
      <PageHeader
        title={t(config.title)}
        description={t(config.description)}
        actions={sorted.length > 0 ? addButton : undefined}
      />
      {body}
    </Page>
  );
}
