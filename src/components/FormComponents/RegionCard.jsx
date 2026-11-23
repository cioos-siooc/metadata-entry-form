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
import LogoPlate from "../Layout/LogoPlate";

// One region on the picker. The whole card is a single link into the
// region; the region colour is decoration only (border and top accent), so
// the focus ring uses the system's contrast-safe brand text colour.
export default function RegionCard({ region, regionSummary, showMap = true }) {
  const { language } = useParams();
  const summaryId = useId();

  const regionInfo = regions[region];
  const title = regionInfo?.title?.[language] || region;
  const logoSrc = getRegionLogo(region, language);
  const primaryColor = regionInfo?.colors?.primary || FALLBACK_PRIMARY;

  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        // Fill the grid row so cards line up; the content sets the height,
        // so a longer French summary grows the card instead of being cut.
        height: "100%",
        minHeight: showMap ? 470 : 280,
        position: "relative",
        overflow: "hidden",
        borderColor: alpha(primaryColor, 0.25),
        transition: theme.transitions.create(
          ["transform", "box-shadow", "border-color"],
          { duration: theme.transitions.duration.short },
        ),
        "&:hover, &:has(:focus-visible)": {
          boxShadow: theme.shadows[3],
          borderColor: primaryColor,
          "& .regioncard-media": {
            filter: "saturate(115%) brightness(1.03)",
          },
          "@media (prefers-reduced-motion: no-preference)": {
            transform: "translateY(-3px)",
            "& .regioncard-media": { transform: "scale(1.02)" },
            "& .regioncard-accent": { transform: "translateY(0)" },
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
          height: 4,
          bgcolor: primaryColor,
          zIndex: 2,
          transform: "translateY(-2px)",
          transition: theme.transitions.create("transform", {
            duration: theme.transitions.duration.short,
          }),
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
              height: 240,
              flexShrink: 0,
              backgroundPosition: "center",
              transition: theme.transitions.create(["filter", "transform"], {
                duration: theme.transitions.duration.standard,
              }),
            })}
          />
        )}
        <CardContent
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            px: 3,
            py: 2.5,
          }}
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
                  height: 72,
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
