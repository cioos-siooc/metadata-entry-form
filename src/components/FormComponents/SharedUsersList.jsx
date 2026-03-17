import React, { useEffect, useState } from "react";
import { Add, Delete } from "@mui/icons-material";
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
  Box,
  Autocomplete,
} from "@mui/material";

import { paperClass, SupplementalText } from "./QuestionStyles";
import { En, Fr, I18n } from "../I18n";
import {
  loadRegionUsers,
  updateSharedRecord,
} from "../../utils/firebaseRecordFunctions";

const SharedUsersList = ({ record, updateRecord, region }) => {
  const [users, setUsers] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [sharedWithUsers, setSharedWithUsers] = useState({});
  const [shareRecordDisabled, setShareRecordDisabled] = useState(true);
  const authorID = record.userID

  // fetching users based on region
  useEffect(() => {
    let isMounted = true;

    if (record.recordID) {
      setShareRecordDisabled(false)
    }

    const fetchRegionUsers = async () => {
      try {
        const regionUsers = await loadRegionUsers(region);

        if (isMounted) {
          setUsers(regionUsers);
        }
      } catch (error) {
        throw new Error(`Error loading region users: ${error}`);
      }
    };

    fetchRegionUsers();

    return () => {
      isMounted = false;
    };
  }, [region, record.recordID]);

  // Updates state with user emails for each userID in record.sharedWith, to track which users a record is shared with.
  useEffect(() => {
    const sharedWithDetails = {};
    Object.keys(record.sharedWith || {}).forEach((userID) => {
      const name = users[userID]?.userinfo?.displayName;
      if (name) {
        const domain = users[userID]?.userinfo?.email?.split("@").pop();
        sharedWithDetails[userID] = {
          name: domain ? `${name} (${domain})` : name,
        };
      }
    });

    setSharedWithUsers(sharedWithDetails);
  }, [record.sharedWith, users]);

  // Function to add an email to the sharedWith list
  const addUserToSharedWith = (userID) => {
    const updatedSharedWith = {
      ...record.sharedWith,
      [userID]: true,
    };

    setSharedWithUsers(updatedSharedWith);

    updateRecord("sharedWith")(updatedSharedWith);

    const shareRecordAsync = async () => {
      try {
        await updateSharedRecord(userID, record.recordID, authorID, region, true);
      } catch (error) {
        throw new Error(`Failed to update shared record: ${error}`);
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
          await updateSharedRecord(userID, record.recordID, authorID, region, false);
        } catch (error) {
          throw new Error(`Failed to unshare the record: ${error}`);
        }
      };

      unshareRecordAsync();
    }
  };

  const shareWithOptions = Object.entries(users)
    .map(([userID, userInfo]) => {
      const displayName = userInfo.userinfo?.displayName;
      const domain = userInfo.userinfo?.email?.split("@").pop();
      const label = displayName
        ? domain
          ? `${displayName} (${domain})`
          : displayName
        : "";
      return {
        label,
        userID,
      };
    })
    .filter((x) => x.label)
    .reduce((acc, current) => {
      // Avoid duplicates by checking if label already exists
      if (!acc.find((item) => item.label === current.label)) {
        acc.push(current);
      }
      return acc;
    }, [])
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Grid >
      <Paper style={paperClass}>
        <Grid  style={{ margin: "10px" }}>
          <Typography>
            <I18n>
              <En>
                To share editing access with another user, start typing their
                name and select from the suggestions.
              </En>
              <Fr>
                Pour partager l'accès en modification avec un autre utilisateur,
                commencez à saisir son nom avant de le sélectionner parmi les
                suggestions.
              </Fr>
            </I18n>
          </Typography>
          <SupplementalText>
              <I18n>
                <En>
                  <p>Please save the form before sharing access.</p>
                </En>
                <Fr>
                  <p>
                  Veuillez enregistrer le formulaire avant de partager l'accès.
                  </p>
                </Fr>
              </I18n>
            </SupplementalText>
        </Grid>
        <Grid  style={{ margin: "10px" }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Autocomplete
                id="share-with-emails"
                options={shareWithOptions}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) =>
                  option.userID === value.userID
                }
                value={currentUser}
                inputValue={inputValue}
                onInputChange={(_, newValue) => setInputValue(newValue)}
                onChange={(event, newValue) => setCurrentUser(newValue)}
                fullWidth
                filterSelectedOptions
                renderInput={(params) => (
                  <TextField
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...params}
                    label={<I18n en="Share with..." fr="Partager avec..." />}
                    variant="outlined"
                    style={{ marginTop: "16px" }}
                    error={inputValue && !currentUser}
                    helperText={
                      inputValue && !currentUser && (
                        <I18n
                          en="User not found. Please select from the list."
                          fr="Utilisateur non trouvé. Veuillez sélectionner dans la liste."
                        />
                      )
                    }
                  />
                )}
              />
              <Button
                disabled={shareRecordDisabled || !currentUser}
                startIcon={<Add />}
                onClick={() => {
                  if (currentUser) {
                    addUserToSharedWith(currentUser.userID);
                    setCurrentUser(null);
                  }
                }}
                style={{
                  height: "46px",
                  justifyContent: "center",
                  marginTop: "15px",
                }}
              >
                <Typography>
                  <I18n>
                    <En>Share Record</En>
                    <Fr>Partager l'enregistrement</Fr>
                  </I18n>
                </Typography>
              </Button>
            </Grid>
            <Grid size={6} style={{ paddingLeft: "35px" }}>
              <Box style={{ margin: "10px" }}>
                <Typography style={{ fontWeight: "bold" }}>
                  {Object.keys(sharedWithUsers).length > 0 && (
                    <I18n>
                      <En>Users this record is shared with:</En>
                      <Fr>
                        Utilisateurs avec lesquels cet enregistrement est
                        partagé :
                      </Fr>
                    </I18n>
                  )}
                </Typography>
                <List>
                  {Object.entries(sharedWithUsers).map(
                    ([userID, userDetails], index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={<Typography>{userDetails.name}</Typography>}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            aria-label="delete"
                            style={{ marginRight: "60px" }}
                            onClick={() => removeUserFromSharedWith(userID)}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    )
                  )}
                </List>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
};

export default SharedUsersList;
