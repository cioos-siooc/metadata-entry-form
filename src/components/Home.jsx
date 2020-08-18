import React from "react";
import { useHistory } from "react-router-dom";
import { Button } from "@material-ui/core";

const Home = () => {
  const history = useHistory();

  return (
    <div>
      <h1>Metadata Site</h1>
      <Button
        onClick={() => {
          history.push("/new");
        }}
      >
        New Metadata record
      </Button>
    </div>
  );
};

export default Home;
