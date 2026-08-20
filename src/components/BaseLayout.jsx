import React, { useContext } from "react";
import { Route, Routes, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Box, CircularProgress } from "@mui/material";
import { createTheme, ThemeProvider, StyledEngineProvider } from "@mui/material/styles";
import Submissions from "./Pages/Submissions";
import Published from "./Pages/Published";
import Contacts from "./Pages/ContactsSaved";
import Instruments from "./Pages/InstrumentsSaved";
import Shared from "./Pages/Shared"
import Login from "./Pages/Login";
import NavDrawer from "./NavDrawer";
import ErrorBoundary from "./Pages/ErrorBoundary";
import EditContact from "./FormComponents/EditSavedContact";
import EditInstrument from "./FormComponents/EditSavedInstrument";
import Reviewer from "./Pages/Reviewer";
import Admin from "./Pages/Admin";
import NotFound from "./Pages/NotFound";
import SentryTest from "./Pages/SentryTest";
import UserProvider, { UserContext } from "../providers/UserProvider";
import regions, { getRegionLogo } from "../regions";
import Platforms from "./Pages/PlatformsSaved";
import EditPlatform from "./FormComponents/EditSavedPlatform";
import FormTypeList from "./Pages/Forms/FormTypeList";
import FormFill from "./Pages/Forms/FormFill";
import { METADATA_RECORD_SLUG } from "../formEngine/metadataRecordForm";
import MyFormSubmissions from "./Pages/Forms/MyFormSubmissions";
import FormSubmissionsReview from "./Pages/Forms/FormSubmissionsReview";
import FormSubmissionDetail from "./Pages/Forms/FormSubmissionDetail";
import RegionFormTypes from "./Pages/Forms/RegionFormTypes";
import FormCatalog from "./Pages/Forms/FormCatalog";
import FormTypeEditor from "./Pages/Forms/FormTypeEditor";

const RegionLogo = ({ children }) => {
  const { language, region } = useParams();
  const logoSrc = getRegionLogo(region, language);
  const titleText = regions[region]?.title?.[language] || region;
  return (
    // A flex column with `gap`, not <Grid container spacing>. MUI implements
    // Grid gutters as negative margins on the container plus padding on the
    // children, so a Grid container is always WIDER than its parent and cannot
    // be constrained by it. This wrapper sits around every page, so that made
    // the whole app scroll sideways whenever a page held something naturally
    // wide — the record form's eleven-tab strip, a wide table, a map.
    //
    // minWidth: 0 on the children matters for the same reason it does inside
    // the form: a flex child defaults to `min-width: auto` and refuses to
    // shrink below its content's intrinsic width.
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minWidth: 0,
        maxWidth: "100%",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {logoSrc ? (
          <img src={logoSrc} alt={region} style={{ maxWidth: "100%" }} />
        ) : (
          <div style={{
            fontSize: '1.8rem',
            fontWeight: 600,
            padding: '10px 0',
          }}>{titleText}</div>
        )}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
};

const Pages = () => {
  const {
    loggedIn,
    authIsLoading,
    isReviewer: userIsReviewer,
    isAdmin: userIsAdmin,
  } = useContext(UserContext);
  return (
    <>
      {authIsLoading ? (
        <CircularProgress />
      ) : (
        <RegionLogo>
          {loggedIn ? (
            <ErrorBoundary>
              <Routes>
                <Route index element={<Submissions />} />
                <Route
                  path="new"
                  element={<FormFill formTypeSlug={METADATA_RECORD_SLUG} />}
                />
                <Route path="contacts/:contactID" element={<EditContact />} />
                <Route path="contacts/new" element={<EditContact />} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="instruments/:instrumentID" element={<EditInstrument />} />
                <Route path="instruments" element={<Instruments />} />
                <Route path="platforms/:platformID" element={<EditPlatform />} />
                <Route path="platforms" element={<Platforms />} />
                <Route path="shared" element={<Shared />} />

                {/* Schema-driven forms. Members fill in whichever form types
                    their region has enabled; definitions are managed globally. */}
                <Route path="forms" element={<FormTypeList />} />
                <Route path="forms/mine" element={<MyFormSubmissions />} />
                <Route
                  path="forms/review"
                  element={
                    userIsAdmin || userIsReviewer ? (
                      <FormSubmissionsReview />
                    ) : (
                      <NotFound />
                    )
                  }
                />
                {/* Read-only view of one submission, for reviewers. Declared
                    before the :formTypeSlug route so "review" is not mistaken
                    for a form slug. */}
                <Route
                  path="forms/review/:submissionID"
                  element={
                    userIsAdmin || userIsReviewer ? (
                      <FormSubmissionDetail />
                    ) : (
                      <NotFound />
                    )
                  }
                />
                <Route
                  path="forms/:formTypeSlug/:submissionID"
                  element={<FormFill />}
                />

                {/* Per-region activation is a write, so admins only — unlike
                    the /admin landing page, which reviewers may also read. */}
                <Route
                  path="admin/forms"
                  element={userIsAdmin ? <RegionFormTypes /> : <NotFound />}
                />

                {/* The catalog is shared across regions, so any region
                    administrator may manage it. Cross-region impact is limited
                    by the guardrails in the publish flow, not by a role. */}
                <Route
                  path="admin/form-catalog"
                  element={userIsAdmin ? <FormCatalog /> : <NotFound />}
                />
                <Route
                  path="admin/form-catalog/:formTypeId"
                  element={userIsAdmin ? <FormTypeEditor /> : <NotFound />}
                />

                {/* The record's historic URL, kept rather than redirected:
                    every existing bookmark and emailed link still works, and it
                    is what lets a reviewer — or somebody a record was shared
                    with — open a record they do not own. Declared last so it
                    cannot swallow "forms", "admin" and the rest. */}
                <Route
                  path=":userID/:recordID"
                  element={<FormFill formTypeSlug={METADATA_RECORD_SLUG} />}
                />
                <Route path="submissions" element={<Submissions />} />
                <Route path="published" element={<Published />} />
                <Route
                  path="reviewer"
                  element={userIsAdmin || userIsReviewer ? <Reviewer /> : <NotFound />}
                />
                <Route
                  path="admin"
                  element={userIsAdmin || userIsReviewer ? <Admin /> : <NotFound />}
                />
                <Route path="sentry-test" element={<SentryTest />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          ) : (
            <Login />
          )}
        </RegionLogo>
      )}
    </>
  );
};

const BaseLayout = () => {
  const { region, language } = useParams();

  const theme = createTheme({
    components: {
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: "1em",
          },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: {
          root: {
            '&.Mui-disabled': {
              '& .MuiCheckbox-root': {
                color: '#ababab',
              },
              '& .MuiTypography-root': {
                color: '#ababab',
              },
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          input: {
            '&.Mui-disabled': {
              color: '#ababab',
              WebkitTextFillColor: '#ababab',
            },
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: {
            flexDirection: 'column',
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            whiteSpace: 'pre-wrap',
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
        },
      },
      MuiSelect: {
        defaultProps: {
          variant: "outlined",
        },
      },
      MuiButton: {
        defaultProps: {
          variant: "outlined",
        },
      },
    },
    palette: {
      primary: {
        main: regions[region].colors.primary,
      },
      secondary: {
        main: regions[region].colors.secondary,
      },
    },
  });
  const title = {
    en: `${regions[region].title[language]} Metadata Intake Form`,
    fr: `Formulaire de réception des métadonnées ${regions[region].title[language]}`,
  };

  return (
    <>
      <Helmet>
        <title>{title[language]}</title>
        <link
          rel="icon"
          type="image/png"
          href={`/favicons/${region}.ico`}
          sizes="16x16"
        />
      </Helmet>

      <UserProvider>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <NavDrawer>
              <Pages />
            </NavDrawer>
          </ThemeProvider>
        </StyledEngineProvider>
      </UserProvider>
    </>
  );
};

export default BaseLayout;
