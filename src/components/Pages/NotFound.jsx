import React from "react";
import { Button } from "@mui/material";
import { SearchOffOutlined } from "@mui/icons-material";
import { Link as RouterLink, useParams } from "react-router-dom";
import { I18n } from "../I18n";
import { Page, EmptyState } from "../Layout/Page";

// Also shown for pages a user's role doesn't include, so it doesn't say the
// page doesn't exist -- only that there's nothing for them here.
const NotFound = () => {
  const { language = "en", region } = useParams();
  return (
    <Page maxWidth={720}>
      <EmptyState
        icon={SearchOffOutlined}
        headingComponent="h1"
        title={<I18n en="There's nothing here" fr="Il n'y a rien ici" />}
        action={
          region && (
            <Button
              variant="contained"
              component={RouterLink}
              to={`/${language}/${region}`}
            >
              <I18n en="Go to my records" fr="Aller à mes enregistrements" />
            </Button>
          )
        }
      >
        <I18n
          en="This page doesn't exist, or your account doesn't have access to it."
          fr="Cette page n'existe pas, ou votre compte n'y a pas accès."
        />
      </EmptyState>
    </Page>
  );
};

export default NotFound;
