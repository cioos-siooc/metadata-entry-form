import React, { useEffect, useState } from "react";
import { Add, Delete } from "@material-ui/icons";
import {
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  ListItemSecondaryAction,
} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";

import { paperClass } from "./QuestionStyles";
import { En, Fr, I18n } from "../I18n";
import {
    loadRegionUsers,
    updateSharedRecord,
  } from "../../utils/firebaseRecordFunctions";


const SharedUsersList = ({ record, updateRecord, region }) => {
  const [users, setUsers] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [sharedWithUsers, setSharedWithUsers] = useState({});

  // fetching users based on region
  useEffect(() => {
    let isMounted = true;

    const fetchRegionUsers = async () => {
      try {
        const regionUsers = await loadRegionUsers(region);

        if (isMounted) {
          setUsers(regionUsers);
        }
      } catch (error) {
        console.error("Error loading region users:", error);
      }
    };

    fetchRegionUsers();

    return () => {
      isMounted = false;
    };
  }, [region]);

  // Updates state with user emails for each userID in record.sharedWith, to track which users a record is shared with.
  useEffect(() => {
    const sharedWithDetails = {};
    Object.keys(record.sharedWith || {}).forEach((userID) => {
      const email = users[userID]?.userinfo?.email;
      if (email) {
        sharedWithDetails[userID] = { email }; // Or just true if you only need to flag presence
      }
    });

    setSharedWithUsers(sharedWithDetails); // Update state to hold { userID, email }
  }, [record.sharedWith, users]);

  // Function to add an email to the sharedWith list
  const addUserToSharedWith = (userID) => {
    const updatedSharedWith = {
      ...record.sharedWith,
      [userID]: true,
    };

    console.log(`adding ${userID} to list`);

    setSharedWithUsers(updatedSharedWith);

    updateRecord("sharedWith")(updatedSharedWith);

    const shareRecordAsync = async () => {
      try {
        await updateSharedRecord(userID, record.recordID, region, true);
      } catch (error) {
        console.error("Failed to update shared record:", error);
      }
    };

    shareRecordAsync();
  };

  // Function to remove an email from the sharedWith list
  const removeUserFromSharedWith = (userID) => {
    if (record.sharedWith && record.sharedWith[userID]) {
      const updatedSharedWith = { ...record.sharedWith };
      delete updatedSharedWith[userID];
      updateRecord("sharedWith")(updatedSharedWith);

      const unshareRecordAsync = async () => {
        try {
          await updateSharedRecord(userID, record.recordID, region, false);
        } catch (error) {
          console.error("Failed to unshare the record:", error);
        }
      };

      unshareRecordAsync();
    }
  };

  const shareWithOptions = Object.entries(users)
    .map(([userID, userInfo]) => ({
      label: userInfo.userinfo?.email, // Use optional chaining in case userinfo is not defined
      userID,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Grid item xs>
      <Paper style={paperClass}>
        <Grid item xs style={{ margin: "10px" }}>
          <Typography>
            <I18n>
              <En>
                To share editing access with another user, start typing their
                email address and select from the suggestions.
              </En>
              <Fr>
                Pour partager l'accès en modification avec un autre utilisateur,
                commencez à saisir son adresse e-mail et sélectionnez parmi les
                suggestions.
              </Fr>
            </I18n>
          </Typography>
          <Autocomplete
            id="share-with-emails"
            options={shareWithOptions}
            getOptionLabel={(option) => option.label}
            getOptionSelected={(option, value) =>
              option.userID === value.userID
            }
            value={currentUser}
            onChange={(event, newValue) => setCurrentUser(newValue)}
            fullWidth
            filterSelectedOptions
            renderInput={(params) => (
              <TextField
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...params}
                label="Share with"
                variant="outlined"
                style={{ marginTop: "16px" }}
              />
            )}
          />
        </Grid>
        <Grid item xs style={{ margin: "10px" }}>
          <Button
            startIcon={<Add />}
            onClick={() => {
              if (currentUser) {
                addUserToSharedWith(currentUser.userID);
                setCurrentUser(null);
              }
            }}
            style={{ height: "56px", justifyContent: "center" }}
          >
            <Typography>
              <I18n>
                <En>Share Record</En>
                <Fr>Partager l'enregistrement</Fr>
              </I18n>
            </Typography>
          </Button>
        </Grid>
        <Grid container direction="column" justifyContent="flex-start">
          <Grid item xs style={{ margin: "10px" }}>
            <Typography>
              {Object.keys(sharedWithUsers).length > 0 && (
                <I18n>
                  <En>Users this record is shared with:</En>
                  <Fr>
                    Utilisateurs avec lesquels cet enregistrement est partagé :
                  </Fr>
                </I18n>
              )}
            </Typography>
          </Grid>
          <Grid item xs>
            <List>
              {Object.entries(sharedWithUsers).map(
                ([userID, userDetails], index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={<Typography>{userDetails.email}</Typography>}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        aria-label="delete"
                        onClick={() => removeUserFromSharedWith(userID)} // Use userID for removal
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                )
              )}
            </List>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
};

export default SharedUsersList;
