import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { ButtonBase, Typography, Grid } from "@material-ui/core";

import { useParams, useHistory } from "react-router-dom";
import regions from "../regions";

const images = [
  {
    url: "/metadata-entry-form/pacific.jpg",
    title: "pacific",
    width: "30%",
  },
  {
    url: "/metadata-entry-form/stlaurent.jpg",
    title: "stlaurent",
    width: "30%",
  },
  {
    url: "/metadata-entry-form/atlantic.jpg",
    title: "atlantic",
    width: "30%",
  },
];

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    minWidth: 300,
    width: "100%",
  },
  image: {
    position: "relative",
    height: 200,
    [theme.breakpoints.down("xs")]: {
      width: "100% !important", // Overrides inline-style
      height: 100,
    },
    "&:hover, &$focusVisible": {
      zIndex: 1,
      "& $imageBackdrop": {
        opacity: 0.15,
      },
      "& $imageMarked": {
        opacity: 0,
      },
      "& $imageTitle": {
        border: "4px solid currentColor",
      },
    },
  },
  focusVisible: {},
  imageButton: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.palette.common.white,
  },
  imageSrc: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundSize: "cover",
    backgroundPosition: "center 40%",
  },
  imageBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.palette.common.black,
    opacity: 0.4,
    transition: theme.transitions.create("opacity"),
  },
  imageTitle: {
    position: "relative",
    padding: `${theme.spacing(2)}px ${theme.spacing(4)}px ${
      theme.spacing(1) + 6
    }px`,
  },
  imageMarked: {
    height: 3,
    width: 18,
    backgroundColor: theme.palette.common.white,
    position: "absolute",
    bottom: -2,
    left: "calc(50% - 9px)",
    transition: theme.transitions.create("opacity"),
  },
}));

export default function ButtonBases() {
  const classes = useStyles();
  const { language } = useParams();

  const history = useHistory();

  function handleRegionClick(region) {
    history.push(`/${language}/${region}`);
  }

  return (
    <Grid container spacing={2}>
      {images.map((image) => (
        <Grid item xs key={image.title}>
          <ButtonBase
            focusRipple
            className={classes.image}
            onClick={() => handleRegionClick(image.title)}
            focusVisibleClassName={classes.focusVisible}
            style={{
              width: "100%",
            }}
          >
            <span
              className={classes.imageSrc}
              style={{
                backgroundImage: `url(${image.url})`,
              }}
            />
            <span className={classes.imageBackdrop} />
            <span className={classes.imageButton}>
              <Typography
                component="span"
                variant="subtitle1"
                color="inherit"
                className={classes.imageTitle}
              >
                {regions[image.title][language]}
                <span className={classes.imageMarked} />
              </Typography>
            </span>
          </ButtonBase>
        </Grid>
      ))}
    </Grid>
  );
}
