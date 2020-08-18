import React from "react";
import { useHistory } from "react-router-dom";

import { Typography, Button } from "@material-ui/core";

const Submissions = () => {
  const history = useHistory();
  return (
    <div>
      <h1>Submission received!</h1>
      <Typography>Thank you for your submission!</Typography>
      <Button onClick={() => history.push("/new")}>Make another!</Button>
    </div>
  );
};

export default Submissions;
