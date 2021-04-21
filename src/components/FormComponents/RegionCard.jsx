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
    maxWidth: 345,
  },
  media: {
    height: 400,
    "&:hover": {
      filter:
        "brightness( 100% ) contrast( 100% ) saturate( 200% ) blur( 0px ) hue-rotate( 197deg )",
      /* … */
    },
  },
});

export default function MediaCard({ region, regionSummary }) {
  const history = useHistory();
  const { language } = useParams();
  const classes = useStyles();

  const regionInfo = regions[region];
  const imgPath = `/cioos-${region}-${language}.png`;

  return (
    <div>
      <Card
        className={classes.root}
        onClick={() => history.push(`/${language}/${region}`)}
        style={{ minHeight: "500px", minWidth: "400px" }}
      >
        <CardActionArea>
          <CardMedia
            className={classes.media}
            image={`${process.env.PUBLIC_URL}/map-${region}.jpg`}
            title={regionInfo.title[language]}
          />
          <CardContent>
            <div>
              <img
                src={process.env.PUBLIC_URL + imgPath}
                alt={region}
                style={{ margin: "10px", maxWidth: "300px", maxHeight: "80px" }}
              />
            </div>

            <Typography variant="body2" color="textSecondary" component="p">
              {regionSummary}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </div>
  );
}
