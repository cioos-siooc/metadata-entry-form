import React, { useEffect, useRef, useState } from "react";
import { Box, Fade } from "@mui/material";
import FormHeader from "./FormHeader";
import SectionRail from "./SectionRail";
import ActionBar from "./ActionBar";

// Top-level layout for the metadata form. Owns rail collapse state and
// scroll-reset-on-section-change. All save/submit logic is passed in via
// props so the class-component MetadataForm stays the source of truth.
export default function FormShell({
  sections,
  activeSection,
  onSectionChange,
  headerProps,
  actionBarProps,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeSection]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 64px)",
        mt: -1,
        mx: -1,
      }}
    >
      <FormHeader
        sections={sections}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        {...headerProps}
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
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            px: { xs: 2, md: 4 },
            py: { xs: 2, md: 3 },
            pb: 12,
            maxWidth: 1080,
            mx: "auto",
            width: "100%",
          }}
        >
          <Fade in key={activeSection} timeout={220}>
            <Box>{children}</Box>
          </Fade>
        </Box>
      </Box>
      <ActionBar {...actionBarProps} />
    </Box>
  );
}
