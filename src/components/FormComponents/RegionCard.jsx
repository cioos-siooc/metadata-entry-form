import React, { useId } from "react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Link as RouterLink, useParams } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import regions, { getRegionLogo } from "../../regions";
import { FALLBACK_PRIMARY } from "../../theme/tokens";
import { forDarkSurface } from "../../theme/createAppTheme";
import LogoPlate from "../Layout/LogoPlate";

// Where each map's region sits in the image (vertical background-position).
// The maps are near-square but the band is wide, so cover-cropping keeps only
// a horizontal slice; this keeps that slice on the region's own water.
const MAP_FOCUS_Y = {
  atlantic: "45%",
  pacific: "65%",
  stlaurent: "75%",
};

// One region on the picker. The whole card is a single link into the
// region. Each card carries its region's colour (a top band, a tinted body
// and border) so regions read apart at a glance; the colour is identity only,
// never text, and the title and logo still name the region. The focus ring
// uses the system's contrast-safe brand text colour.
export default function RegionCard({ region, regionSummary, showMap = true }) {
  const { language } = useParams();
  const summaryId = useId();

  const regionInfo = regions[region];
  const title = regionInfo?.title?.[language] || region;
  const logoSrc = getRegionLogo(region, language);
  const primaryColor = regionInfo?.colors?.primary || FALLBACK_PRIMARY;
  // The region's colour as the app uses it in dark mode: near-black regions
  // are lifted so the band still shows on the dark card.
  const darkColor = forDarkSurface(primaryColor);

  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        // Fill the grid row so cards line up; the content sets the height,
        // so a longer French summary grows the card instead of being cut.
        height: "100%",
        position: "relative",
        overflow: "hidden",
        borderColor: alpha(primaryColor, 0.35),
        ...theme.applyStyles("dark", {
          borderColor: alpha(darkColor, 0.45),
        }),
        transition: theme.transitions.create(
          ["transform", "box-shadow", "border-color"],
          { duration: theme.transitions.duration.short },
        ),
        "&:hover, &:has(:focus-visible)": {
          boxShadow: theme.shadows[3],
          borderColor: primaryColor,
          ...theme.applyStyles("dark", { borderColor: darkColor }),
          "& .regioncard-media": {
            filter: "saturate(115%) brightness(1.03)",
          },
          "& .regioncard-body": {
            bgcolor: alpha(primaryColor, 0.1),
            ...theme.applyStyles("dark", { bgcolor: alpha(darkColor, 0.2) }),
          },
          "@media (prefers-reduced-motion: no-preference)": {
            transform: "translateY(-3px)",
            "& .regioncard-media": { transform: "scale(1.02)" },
          },
        },
        "&:has(:focus-visible)": {
          outline: `2px solid ${theme.vars.palette.primaryText}`,
          outlineOffset: 2,
        },
      })}
    >
      <Box
        className="regioncard-accent"
        aria-hidden
        sx={(theme) => ({
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          bgcolor: primaryColor,
          zIndex: 2,
          ...theme.applyStyles("dark", { bgcolor: darkColor }),
        })}
      />
      <CardActionArea
        component={RouterLink}
        to={`/${language}/${region}`}
        aria-label={title}
        aria-describedby={regionSummary ? summaryId : undefined}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
          height: "100%",
          color: "text.primary",
          textDecoration: "none",
          // The card draws the ring (see :has above).
          "&.Mui-focusVisible": { outline: "none" },
        }}
      >
        {showMap && (
          <CardMedia
            className="regioncard-media"
            image={`${import.meta.env.BASE_URL}map-${region}.jpg`}
            aria-hidden
            sx={(theme) => ({
              // Phones skip the map: the logo and summary carry the card.
              display: { xs: "none", sm: "block" },
              height: 240,
              flexShrink: 0,
              backgroundPosition: `center ${MAP_FOCUS_Y[region] ?? "50%"}`,
              position: "relative",
              // Every map shares one teal sea. A colour-blend wash recolours
              // only that sea in the region's hue; grey land and white stay.
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                bgcolor: primaryColor,
                mixBlendMode: "color",
                opacity: 0.85,
                ...theme.applyStyles("dark", { bgcolor: darkColor }),
              },
              transition: theme.transitions.create(["filter", "transform"], {
                duration: theme.transitions.duration.standard,
              }),
            })}
          />
        )}
        <CardContent
          className="regioncard-body"
          sx={(theme) => ({
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: { xs: 1, sm: 1.5 },
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 2.5 },
            // A faint wash of the region colour; summary text stays
            // text.secondary, which clears 4.5:1 on these tints.
            bgcolor: alpha(primaryColor, 0.05),
            ...theme.applyStyles("dark", { bgcolor: alpha(darkColor, 0.1) }),
            transition: theme.transitions.create("background-color", {
              duration: theme.transitions.duration.short,
            }),
          })}
        >
          {logoSrc ? (
            <LogoPlate sx={{ width: "100%", maxWidth: 276, px: 1 }}>
              <Box
                component="img"
                src={logoSrc}
                alt=""
                // Fixed box rather than a max-height: the logos' aspect
                // ratios range too widely for a height cap to give every
                // card the same footprint.
                sx={{
                  width: "100%",
                  height: { xs: 52, sm: 72 },
                  objectFit: "contain",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </LogoPlate>
          ) : (
            <Typography
              component="span"
              variant="h6"
              sx={{ fontWeight: 700, textAlign: "center" }}
            >
              {title}
            </Typography>
          )}
          {regionSummary && (
            <Typography
              id={summaryId}
              variant="body2"
              sx={{
                color: "text.secondary",
                textAlign: "center",
                lineHeight: 1.55,
              }}
            >
              {regionSummary}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
