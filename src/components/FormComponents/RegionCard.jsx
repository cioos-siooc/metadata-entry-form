import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";

import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";

import Typography from "@material-ui/core/Typography";
import { useParams, useHistory } from "react-router-dom";
import regions, { getRegionLogo } from "../../regions";

const useStyles = makeStyles({
  root: {
    maxWidth: 380,
    display: "flex",
    flexDirection: "column",
    transition:
      "filter 0.35s ease, background-color 0.35s ease, box-shadow 0.35s ease",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
  },
  media: {
    height: 260, // increased height for better map/logo visibility
    transition: "filter 0.4s ease, transform 0.4s ease",
    backgroundPosition: "bottom center", // align image content to bottom
  },
  colorOverlay: {
    content: '""',
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    transition: "opacity 0.35s ease",
    pointerEvents: "none",
    zIndex: 1,
  },
  hovered: {
    "& $media": {
      filter: "brightness(0.85) saturate(140%)",
      transform: "scale(1.015)",
    },
    "& $colorOverlay": {
      opacity: 0.18,
    },
    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
  },
  actionArea: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    alignItems: "stretch",
    position: "relative",
    zIndex: 2,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
  },
  summaryClamp: {
    display: "-webkit-box",
    WebkitLineClamp: 5,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textAlign: "center",
  },
});

export default function MediaCard({ region, regionSummary, showMap = true }) {
  const history = useHistory();
  const { language } = useParams();
  const classes = useStyles();

  const regionInfo = regions[region];
  const logoSrc = getRegionLogo(region, language);

  // Fixed heights:
  // RA cards (showMap) -> 470px; Affiliated (no map) -> 240px
  const fixedHeight = showMap ? 470 : 240;

  const rootClassNames = [classes.root];

  const [hover, setHover] = React.useState(false);
  if (hover) rootClassNames.push(classes.hovered);

  const primaryColor = regionInfo?.colors?.primary || "#666";

  return (
    <Card
      className={rootClassNames.join(" ")}
      onClick={() => history.push(`/${language}/${region}`)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        height: fixedHeight,
        minWidth: 360,
        borderTop: `6px solid ${primaryColor}`,
      }}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === "Enter" || e.key === " ")
          history.push(`/${language}/${region}`);
      }}
      aria-label={regionInfo.title[language]}
    >
      <CardActionArea
        className={classes.actionArea}
        style={{ alignItems: "stretch" }}
      >
        {showMap && (
          <div style={{ position: "relative" }}>
            <CardMedia
              className={classes.media}
              image={`${process.env.PUBLIC_URL}/map-${region}.jpg`}
              title={regionInfo.title[language]}
              style={{ width: "100%" }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        )}
        <CardContent className={classes.content} style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <img
              src={logoSrc}
              alt={region}
              style={{
                margin: "10px auto",
                maxWidth: 300,
                maxHeight: 80,
                display: "block",
              }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
          <Typography
            variant="body2"
            color="textSecondary"
            component="p"
            className={classes.summaryClamp}
            style={{ marginTop: 8 }}
          >
            {regionSummary}
          </Typography>
        </CardContent>
        {/* Full-card overlay for consistent hover tint */}
        <div
          className={classes.colorOverlay}
          style={{ backgroundColor: primaryColor }}
          aria-hidden="true"
        />
      </CardActionArea>
    </Card>
  );
}
