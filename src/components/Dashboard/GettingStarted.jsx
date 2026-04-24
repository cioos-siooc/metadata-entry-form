import React from "react";
import { Box, Card, Stack, Typography, Button } from "@mui/material";
import {
  ArrowForward,
  AssignmentOutlined,
  PeopleAltOutlined,
  RocketLaunchOutlined,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { I18n } from "../I18n";

function Step({ Icon, title, description, cta, onClick }) {
  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        flex: 1,
        p: 2.5,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        transition: theme.transitions.create(["transform", "box-shadow"], {
          duration: theme.transitions.duration.short,
        }),
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: theme.shadows[2],
        },
      })}
    >
      <Box
        sx={(theme) => ({
          width: 44,
          height: 44,
          borderRadius: 2,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: theme.palette.primarySurface,
          color: "primary.main",
        })}
      >
        <Icon />
      </Box>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.55 }}>
          {description}
        </Typography>
      </Box>
      <Button
        size="small"
        variant="text"
        endIcon={<ArrowForward />}
        onClick={onClick}
        sx={{ alignSelf: "flex-start", mt: "auto", pl: 0 }}
      >
        {cta}
      </Button>
    </Card>
  );
}

export default function GettingStarted() {
  const { language, region } = useParams();
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
        <I18n en="Getting started" fr="Commencer" />
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        <I18n
          en="Three quick steps to publish your first metadata record."
          fr="Trois étapes rapides pour publier votre premier enregistrement."
        />
      </Typography>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems="stretch"
      >
        <Step
          Icon={PeopleAltOutlined}
          title={<I18n en="Add your first contact" fr="Ajouter votre premier contact" />}
          description={
            <I18n
              en="Save researchers and data stewards once — then reuse them across records."
              fr="Enregistrez des chercheurs et gestionnaires une fois, puis réutilisez-les."
            />
          }
          cta={<I18n en="Add contact" fr="Ajouter un contact" />}
          onClick={() => navigate(`/${language}/${region}/contacts/new`)}
        />
        <Step
          Icon={AssignmentOutlined}
          title={<I18n en="Create a record" fr="Créer un enregistrement" />}
          description={
            <I18n
              en="Describe your dataset's identity, spatial extent, and provenance."
              fr="Décrivez l'identité, l'étendue spatiale et la provenance de votre jeu de données."
            />
          }
          cta={<I18n en="Start a record" fr="Commencer un enregistrement" />}
          onClick={() => navigate(`/${language}/${region}/new`)}
        />
        <Step
          Icon={RocketLaunchOutlined}
          title={<I18n en="Submit for review" fr="Soumettre pour révision" />}
          description={
            <I18n
              en="Our data team reviews your record before it's published to the catalogue."
              fr="Notre équipe révise votre enregistrement avant publication au catalogue."
            />
          }
          cta={<I18n en="See submission help" fr="Aide à la soumission" />}
          onClick={() => navigate(`/${language}/${region}`)}
        />
      </Stack>
    </Box>
  );
}
