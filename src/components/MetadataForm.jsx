import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import { eovList, progressCodes, roleCodes } from "../isoCodeLists";
import { TextField, Grid, Typography, Button, Paper } from "@material-ui/core";

import BilingualTextInput from "./BilingualTextInput";
import CheckBoxList from "./CheckBoxList";
import SelectInput from "./SelectInput";
import DateInput from "./DateInput";
import firebase from "../firebase";

const styles = {
  root: {
    flexGrow: 1,
    overflow: "hidden",
    padding: "10px",
  },
  paper: {
    padding: "10px",
    margin: "20px",
  },
};
function camelToSentenceCase(text) {
  var result = text.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

class MetadataForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      title: { en: "", fr: "" },
      abstract: { en: "", fr: "" },
      id: "",
      eov: [],
      role: "",
      progress: "",
      dateStart: new Date(),
      records: {},
    };
  }

  async handleSubmitClick() {
    await firebase.database().ref("test").push(this.state);
    this.props.history.push("/success");
  }
  handleInputChange(event, parentName = false) {
    const { name, value } = event.target;

    if (parentName) {
      this.setState((state) => ({
        ...state,
        [parentName]: { ...state[parentName], [name]: value },
      }));
    } else this.setState((state) => ({ ...state, [name]: value }));
  }

  render() {
    return (
      <Grid
        container
        direction="column"
        justify="space-between"
        alignItems="stretch"
      >
        <Paper className={this.props.classes.paper}>
          <h1>CIOOS Metadata Profile Intake Form</h1>
          <Typography>
            Welcome to the CIOOS metadata profile generation form! Please fill
            out each field with as much detail as you can. Using this
            information we will create your metadata profile for the given
            dataset.
          </Typography>
        </Paper>
        <Paper className={this.props.classes.paper}>
          <Typography>What is the title of the dataset?</Typography>
          <BilingualTextInput
            label="Enter a title"
            name="title"
            value={this.state.title}
            onChange={(e) => this.handleInputChange(e)}
          />
        </Paper>

        <Paper className={this.props.classes.paper}>
          <Typography>What is the ID for your dataset?</Typography>
          <TextField
            type="text"
            label="Your Answer"
            name="id"
            value={this.state.id}
            onChange={(e) => this.handleInputChange(e)}
            fullWidth
            required
          />
        </Paper>

        <Paper className={this.props.classes.paper}>
          <Typography>Select a role for your datase</Typography>
          <SelectInput
            label="Select a role"
            name="role"
            value={this.state.role}
            onChange={(e) => this.handleInputChange(e)}
            options={roleCodes}
            optionLabels={roleCodes.map(camelToSentenceCase)}
          />
        </Paper>
        <Paper className={this.props.classes.paper}>
          <Typography>Select EOVs that apply to your dataset</Typography>
          <CheckBoxList
            name="eov"
            value={this.state.eov}
            onChange={(e) => this.handleInputChange(e)}
            options={eovList}
            optionLabels={eovList.map(camelToSentenceCase)}
          />
        </Paper>
        <Paper className={this.props.classes.paper}>
          <Typography>What is the progress?</Typography>
          <SelectInput
            label="Select a role"
            name="progress"
            value={this.state.progress}
            onChange={(e) => this.handleInputChange(e)}
            options={progressCodes}
            optionLabels={progressCodes.map(camelToSentenceCase)}
          />
        </Paper>

        <Paper className={this.props.classes.paper}>
          <Typography>What is the abstract for the dataset?</Typography>
          <BilingualTextInput
            label="Enter an abstract"
            name="abstract"
            value={this.state.abstract}
            onChange={(e) => this.handleInputChange(e)}
            multiline
          />
        </Paper>

        <Paper className={this.props.classes.paper}>
          <Typography>
            What is the start date that data was collected?
          </Typography>
          <DateInput
            name="dateStart"
            onChange={(e) => this.handleInputChange(e)}
          />
        </Paper>

        <Button
          variant="contained"
          color="primary"
          onClick={(e) => this.handleSubmitClick(e)}
        >
          Submit
        </Button>
        {/* </Box> */}
      </Grid>
    );
  }
}

export default withStyles(styles)(MetadataForm);
