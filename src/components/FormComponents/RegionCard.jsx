import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";

import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";

import Typography from "@material-ui/core/Typography";
import { useParams, useHistory } from "react-router-dom";
import regions from "../../regions";

const useStyles = makeStyles({
  root: {
    maxWidth: 380,
    display: "flex",
    flexDirection: "column",
    transition: "filter 0.35s ease, background-color 0.35s ease, box-shadow 0.35s ease",
    cursor: "pointer",
    position: 'relative',
    overflow: 'hidden',
  },
  media: {
    height: 220,
    transition: "filter 0.4s ease, transform 0.4s ease",
  },
  colorOverlay: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    transition: 'opacity 0.35s ease',
    pointerEvents: 'none',
  },
  hovered: {
    '& $media': {
      filter: 'brightness(0.85) saturate(140%)',
      transform: 'scale(1.015)',
    },
    '& $colorOverlay': {
      opacity: 0.25,
    },
    boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
  },
  actionArea: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    alignItems: "stretch",
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
  const imgPath = `/cioos-${region}-${language}.png`;

  // Fixed heights:
  // RA cards (showMap) -> 560px; Affiliated (no map) -> 300px
  const fixedHeight = showMap ? 500 : 300;

  const rootClassNames = [classes.root];

  const [hover, setHover] = React.useState(false);
  if (hover) rootClassNames.push(classes.hovered);

  const primaryColor = regionInfo?.colors?.primary || '#666';

  return (
    <Card
      className={rootClassNames.join(" ")}
      onClick={() => history.push(`/${language}/${region}`)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{ height: fixedHeight, minWidth: 360, borderTop: `6px solid ${primaryColor}` }}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') history.push(`/${language}/${region}`); }}
      aria-label={regionInfo.title[language]}
    >
      <CardActionArea
        className={classes.actionArea}
        style={{ alignItems: "stretch" }}
      >
        {showMap && (
          <div style={{ position: 'relative' }}>
            <CardMedia
              className={classes.media}
              image={`${process.env.PUBLIC_URL}/map-${region}.jpg`}
              title={regionInfo.title[language]}
              onError={(e) => {
                // Hide map image area if not found
                e.target.style.display = 'none';
              }}
            />
            <div
              className={classes.colorOverlay}
              style={{ backgroundColor: primaryColor }}
            />
          </div>
        )}
        <CardContent className={classes.content} style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <img
              src={process.env.PUBLIC_URL + imgPath}
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
      </CardActionArea>
    </Card>
  );
}
