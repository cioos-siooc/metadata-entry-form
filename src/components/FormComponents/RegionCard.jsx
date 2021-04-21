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
  },
});

export default function MediaCard({ region, regionSummary }) {
  const history = useHistory();
  const { language } = useParams();
  const classes = useStyles();

  const regionInfo = regions[region];

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
            <Typography gutterBottom variant="h5" component="h2">
              {regionInfo.title[language]}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              {regionSummary}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </div>
  );
}
