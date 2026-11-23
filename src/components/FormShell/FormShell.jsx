import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, Fade, useMediaQuery } from "@mui/material";
import FormHeader from "./FormHeader";
import SectionRail from "./SectionRail";
import SectionStepper from "./SectionStepper";
import { HEADER_HEIGHT } from "../NavDrawer/styles";
import { FORM_HEADER_HEIGHT_MD } from "./FormHeader";
import { GuidanceContext, useGuidancePreference } from "./GuidanceContext";

// Top-level layout for the metadata form. Owns rail collapse state, the
// guidance preference and scroll-reset-on-section-change. All save/submit logic is passed in via
// props so the class-component MetadataForm stays the source of truth.
// `aside` is an optional right-hand column (e.g. the automated review panel),
// sticky like the rail; md+ only, so callers handle small screens themselves.
export default function FormShell({
  sections,
  activeSection,
  onSectionChange,
  headerProps,
  dirty,
  neverSaved,
  aside,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const contentRef = useRef(null);
  const { showGuidance, setShowGuidance } = useGuidancePreference();
  const guidance = useMemo(
    () => ({ showGuidance, setShowGuidance }),
    [showGuidance, setShowGuidance],
  );
  const firstRender = useRef(true);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  // The page (not the content column) scrolls, so a new section starts at the
  // top of the window. Skipped on mount so deep links keep their position.
  // Layout effect so it runs before the reviewer's scroll-to-field callback.
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
  }, [activeSection]);

  return (
    <GuidanceContext.Provider value={guidance}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
          mt: -1,
          mx: -1,
        }}
      >
        <FormHeader
          sections={sections}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          {...headerProps}
          dirty={dirty}
          neverSaved={neverSaved}
        />
        <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
          <SectionRail
            sections={sections}
            activeSection={activeSection}
            onSectionChange={onSectionChange}
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((c) => !c)}
          />
          <Box
            ref={contentRef}
            // The app layout already provides <main>; landmarks don't nest.
            component="div"
            sx={{
              flexGrow: 1,
              minWidth: 0,
              px: { xs: 1.5, sm: 2, md: 4 },
              py: { xs: 1.5, md: 3 },
              pb: { xs: 4, md: 6 },
              // Headroom so the form actually widens when the NavDrawer is
              // collapsed; at 1080 the reclaimed space just became right margin.
              maxWidth: 1280,
              // Sits against the rail rather than centring in the leftover space,
              // which opened a wide gap between the two on large screens.
              ml: 0,
              mr: "auto",
              width: "100%",
            }}
          >
            <Fade in key={activeSection} timeout={reduceMotion ? 0 : 220}>
              <Box>{children}</Box>
            </Fade>
          </Box>
          {aside && (
            <Box
              component="aside"
              sx={(theme) => ({
                position: "sticky",
                top: HEADER_HEIGHT + FORM_HEADER_HEIGHT_MD,
                alignSelf: "flex-start",
                width: 400,
                flexShrink: 0,
                borderLeft: `1px solid ${theme.vars.palette.divider}`,
                bgcolor: "background.paper",
                display: { xs: "none", md: "block" },
                maxHeight: `calc(100vh - ${HEADER_HEIGHT + FORM_HEADER_HEIGHT_MD}px)`,
                overflowY: "auto",
              })}
            >
              {aside}
            </Box>
          )}
        </Box>
        <SectionStepper
          sections={sections}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          dirty={dirty}
          neverSaved={neverSaved}
          status={headerProps?.status ?? ""}
        />
      </Box>
    </GuidanceContext.Provider>
  );
}
