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
  },
  media: {
    height: 300,
    "&:hover": {
      filter:
        "brightness( 100% ) contrast( 100% ) saturate( 200% ) blur( 0px ) hue-rotate( 197deg )",
    },
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
  const fixedHeight = showMap ? 560 : 300;

  return (
    <Card
      className={classes.root}
      onClick={() => history.push(`/${language}/${region}`)}
      style={{ height: fixedHeight, minWidth: 360 }}
    >
      <CardActionArea
        className={classes.actionArea}
        style={{ alignItems: "stretch" }}
      >
        {showMap && (
          <CardMedia
            className={classes.media}
            image={`${process.env.PUBLIC_URL}/map-${region}.jpg`}
            title={regionInfo.title[language]}
            onError={(e) => {
              // Hide map image area if not found
              e.target.style.display = "none";
            }}
          />
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
