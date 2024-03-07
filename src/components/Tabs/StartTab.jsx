import React, { useEffect, useState } from "react";

import { Save, Add, Delete } from "@material-ui/icons";
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

import { useParams } from "react-router-dom";

import regions from "../../regions";

import { En, Fr, I18n } from "../I18n";
import RequiredMark from "../FormComponents/RequiredMark";
import { paperClass, QuestionText } from "../FormComponents/QuestionStyles";
import {
  loadRegionUsers,
  updateSharedRecord,
} from "../../utils/firebaseRecordFunctions";

const StartTab = ({ disabled, updateRecord, record }) => {
  const { region } = useParams();
  const regionInfo = regions[region];
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

  useEffect(() => {

    const sharedWithDetails = {};
    Object.keys(record.sharedWith || {}).forEach(userID => {
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

  // console.log(record.sharedWith);
  // console.log(currentEmail);
  // console.log(sharedWithEmails);
  // console.log(users)
  return (
    <Grid item xs>
      <Paper style={paperClass}>
        {disabled && (
          <QuestionText style={{ paddingBottom: "15px" }}>
            <I18n>
              <En>
                <b>
                  This form is locked because it has already been published, or
                  you do not have access to edit it.
                </b>
              </En>
              <Fr>
                <b>
                  Ce formulaire est verrouillé car il a déjà été publié ou vous
                  n'avez pas accès pour le modifier.
                </b>
              </Fr>
            </I18n>
          </QuestionText>
        )}
        <Typography variant="body1">
          <I18n>
            <En>
              Welcome to the {regionInfo.title.en} Metadata Entry Tool, the
              first step in making your data discoverable and accessible through
              CIOOS. This information will be used to create a metadata record
              for your dataset that will allow it to be searchable through the{" "}
              {regionInfo.catalogueTitle.en}. Please fill out each field with as
              much detail as possible. The metadata record will help describe
              this dataset for others to determine if it is relevant for their
              work and ensure it is interoperable with other databases and
              systems.
              <br />
              <br /> Questions regarding the form can be directed to{" "}
            </En>
            <Fr>
              Bienvenue dans l’outil de saisie de métadonnées{" "}
              {regionInfo.titleFrPossessive} qui constitue la première étape du
              processus de partage de vos données. Ces renseignements serviront
              à créer le profil de métadonnées de votre jeu de données. Ces
              métadonnées facilitent l’accessibilité et la découvrabilité de vos
              données via le Catalogue de données {regionInfo.catalogueTitle.fr}
              . Elles rendent également vos jeux de données interopérables avec
              d’autres systèmes de diffusion. Aussi, nous vous incitons
              fortement à remplir les champs requis de la façon la plus
              exhaustive possible.
              <br />
              <br /> Les questions concernant le formulaire peuvent être
              adressées à{" "}
            </Fr>
          </I18n>
          <a href={`mailto:${regionInfo.email}`}>{regionInfo.email}</a>.
        </Typography>

        <ul>
          <li>
            <I18n>
              <En>You can save the form once you have filled out a title.</En>
              <Fr>
                Dès que vous avez saisi un titre, vous pouvez enregistrer le
                formulaire.
              </Fr>
            </I18n>
          </li>
          <li>
            <En>
              All fields marked with a <RequiredMark /> are mandatory.
            </En>
            <Fr>
              Tous les champs marqués d'une étoile <RequiredMark /> sont
              obligatoires.
            </Fr>
          </li>
          <li>
            <I18n>
              <En>
                The form can be saved and completed over time by clicking the{" "}
                <Save /> icon in the bottom right corner. This icon will be
                greyed out until you have filled in the dataset title in the
                "Identification" section.
              </En>
              <Fr>
                Le formulaire peut être sauvegardé et complété ultérieurement en
                cliquant sur le bouton <Save /> dans le coin inférieur droit.
                Cet icône sera activé par l’ajout du titre du jeu de données
                dans la section « Identification des données ».
              </Fr>
            </I18n>
          </li>
          <li>
            <I18n>
              <En>
                Some fields can have text in both French and English, though
                this is only required for the title and the abstract. There is a
                'Translate' button that will automatically generate text in the
                other language. This translation is more accurate when there is
                more text to translate.
              </En>
              <Fr>
                Certains champs peuvent avoir du texte à la fois en français et
                en anglais, toutefois seules les traductions du titre et du
                résumé sont réellement requises. Le bouton « Traduire» génère
                automatiquement du texte dans l'autre langue. Veuillez noter que
                plus il y a de texte à traduire et plus la traduction sera
                précise.
              </Fr>
            </I18n>
          </li>
        </ul>
      </Paper>
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
            getOptionSelected={(option, value) => option.userID === value.userID}
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
            disabled={disabled}
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
              {Object.entries(sharedWithUsers).map(([userID, userDetails], index) => (
                <ListItem key={index}>
                  <ListItemText primary={<Typography>{userDetails.email}</Typography>} />
                  <ListItemSecondaryAction>
                    <IconButton
                      aria-label="delete"
                      onClick={() => removeUserFromSharedWith(userID)} // Use userID for removal
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
};

export default StartTab;
