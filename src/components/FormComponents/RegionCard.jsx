import React from "react";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useParams, useNavigate } from "react-router-dom";
import { alpha } from "@mui/material/styles";
import regions, { getRegionLogo } from "../../regions";
import { FALLBACK_PRIMARY } from "../../theme/tokens";

export default function RegionCard({ region, regionSummary, showMap = true }) {
  const navigate = useNavigate();
  const { language } = useParams();

  const regionInfo = regions[region];
  const logoSrc = getRegionLogo(region, language);
  const primaryColor = regionInfo?.colors?.primary || FALLBACK_PRIMARY;

  // RA cards (showMap) are taller to accommodate a map preview; affiliated
  // cards are compact.
  const fixedHeight = showMap ? 470 : 280;

  return (
    <Card
      variant="outlined"
      onClick={() => navigate(`/${language}/${region}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/${language}/${region}`);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={regionInfo?.title?.[language] || region}
      sx={(theme) => ({
        height: fixedHeight,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        borderColor: alpha(primaryColor, 0.25),
        transition: theme.transitions.create(
          ["transform", "box-shadow", "border-color"],
          { duration: theme.transitions.duration.short }
        ),
        "&:hover, &:focus-visible": {
          transform: "translateY(-3px)",
          boxShadow: theme.shadows[3],
          borderColor: primaryColor,
          "& .regioncard-media": {
            filter: "saturate(115%) brightness(1.03)",
            transform: "scale(1.02)",
          },
          "& .regioncard-accent": {
            transform: "translateY(0)",
          },
        },
        "&:focus-visible": {
          outline: `3px solid ${alpha(primaryColor, 0.35)}`,
          outlineOffset: 2,
        },
      })}
    >
      <Box
        className="regioncard-accent"
        aria-hidden
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          bgcolor: primaryColor,
          zIndex: 2,
          transform: "translateY(-2px)",
          transition: "transform 200ms cubic-bezier(0.2,0,0,1)",
        }}
      />
      <CardActionArea
        component="div"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          height: "100%",
          "&:focus-visible": { outline: "none" },
        }}
      >
        {showMap && (
          <CardMedia
            className="regioncard-media"
            image={`${import.meta.env.BASE_URL}map-${region}.jpg`}
            title={regionInfo?.title?.[language] || region}
            sx={(theme) => ({
              height: 240,
              backgroundPosition: "center",
              transition: theme.transitions.create(["filter", "transform"], {
                duration: theme.transitions.duration.standard,
              }),
            })}
            onError={(e) => {
              e.target.style.display = "none";
            }}
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
            <Box
              component="img"
              src={logoSrc}
              alt={region}
              // Fixed box rather than a max-height: the logos' aspect ratios
              // range too widely for a height cap to give every card the same
              // footprint.
              sx={{
                width: "100%",
                maxWidth: 260,
                height: 72,
                objectFit: "contain",
              }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, textAlign: "center" }}
            >
              {regionInfo?.title?.[language] || region}
            </Typography>
          )}
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              textAlign: "center",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.55,
            }}
          >
            {regionSummary}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
