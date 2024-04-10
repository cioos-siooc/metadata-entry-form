
import React, { useContext, useState, useEffect, useRef } from "react";
import {
    Paper,
    TextField,
    Button,
} from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import { useDebounce } from "use-debounce";
import { useParams } from "react-router-dom";
import { getDatabase, ref, child, update } from "firebase/database";

import { En, Fr, I18n } from "../I18n";

import firebase from "../../firebase";
import recordToDataCite from "../../utils/recordToDataCite";
import { validateDOI } from "../../utils/validate";

import {
    QuestionText,
    SupplementalText,
    paperClass,
} from "./QuestionStyles";

import { UserContext } from "../../providers/UserProvider";
import performUpdateDraftDoi from "../../utils/doiUpdate";


const DOIInput = ({ record, name, handleUpdateDatasetIdentifier, handleUpdateDoiCreationStatus, disabled }) => {
    const { createDraftDoi, deleteDraftDoi, getDoiStatus, datacitePrefix, dataciteAuthHash } = useContext(UserContext);
    const { language, region, userID } = useParams();
    const doiIsValid = validateDOI(record.datasetIdentifier)
    const [doiGenerated, setDoiGenerated] = useState(false);
    const [doiErrorFlag, setDoiErrorFlag] = useState(false);
    const [debouncedDoiIdValue] = useDebounce(record.datasetIdentifier, 1000);
    const [loadingDoi, setLoadingDoi] = useState(false);
    const [loadingDoiUpdate, setLoadingDoiUpdate] = useState(false);
    const [loadingDoiDelete, setLoadingDoiDelete] = useState(false);
    const [doiUpdateFlag, setDoiUpdateFlag] = useState(false);

    const generateDoiDisabled = doiGenerated || loadingDoi || (record.doiCreationStatus !== "" || record.recordID === "");
    const showGenerateDoi = Boolean(datacitePrefix);
    const showDoiStatus = doiIsValid && datacitePrefix && record.doiCreationStatus && record.doiCreationStatus !== ""
    const showUpdateDoi = doiIsValid && datacitePrefix && record.doiCreationStatus !== "" && record.datasetIdentifier.includes(datacitePrefix);
    const showDeleteDoi = doiIsValid && datacitePrefix && record.doiCreationStatus !== "" && !doiErrorFlag && record.datasetIdentifier.includes(datacitePrefix);
    const mounted = useRef(false);

    async function handleGenerateDOI() {
        setLoadingDoi(true);
        const database = getDatabase(firebase);

        try {
            const mappedDataCiteObject = recordToDataCite(record, language, region, datacitePrefix);
            if (dataciteAuthHash) {

                await createDraftDoi({
                    record: mappedDataCiteObject,
                    authHash: dataciteAuthHash,
                })
                    .then((response) => {
                        return response.data.data.attributes;
                    })
                    .then(async (attributes) => {
                        // Update the record object with datasetIdentifier and doiCreationStatus
                        handleUpdateDatasetIdentifier({ target: { name, value: `https://doi.org/${attributes.doi}` }});
                        handleUpdateDoiCreationStatus({ target: { name, value: "draft" }});

                        // Create a new object with updated properties
                        const updatedRecord = {
                            ...record,
                            datasetIdentifier: `https://doi.org/${attributes.doi}`,
                            doiCreationStatus: "draft",
                        };

                        // Save the updated record to the Firebase database
                        const recordsRef = ref(database, `${region}/users/${userID}/records`);

                        if (record.recordID) {
                            await update(child(recordsRef, record.recordID), { datasetIdentifier: updatedRecord.datasetIdentifier, doiCreationStatus: updatedRecord.doiCreationStatus });
                        }

                        setDoiGenerated(true);
                    })
                    .finally(() => {
                        setLoadingDoi(false);
                    });
            }
        } catch (err) {
            setDoiErrorFlag(true);
            throw new Error(`Error in handleGenerateDOI: ${err}`);
        }
    }

    async function handleUpdateDraftDOI() {
        setLoadingDoiUpdate(true);

        try {
            const statusCode = await performUpdateDraftDoi(record, region, language, datacitePrefix, dataciteAuthHash)

            if (statusCode === 200) {
                setDoiUpdateFlag(true);
                setDoiErrorFlag(false);
            } else {
                setDoiErrorFlag(true);
                setDoiUpdateFlag(false);
            }
        } catch (err) {
            setDoiErrorFlag(true);
            throw err;
        } finally {
            setLoadingDoiUpdate(false);
            setTimeout(() => {
                setDoiUpdateFlag(false);
            }, 3000);
        }
    }

    async function handleDeleteDOI() {
        setLoadingDoiDelete(true);
        const database = getDatabase(firebase);

        try {
            // Extract DOI from the full URL
            const doi = record.datasetIdentifier.replace('https://doi.org/', '');

            deleteDraftDoi({ doi, dataciteAuthHash })
                .then((response) => response.data)
                .then(async (statusCode) => {
                    if (statusCode === 204) {
                        // Update the record object with datasetIdentifier and doiCreationStatus
                        handleUpdateDatasetIdentifier({ target: { name, value: "" } });
                        handleUpdateDoiCreationStatus({ target: { name, value: "" } });

                        // Create a new object with updated properties
                        const updatedRecord = {
                            ...record,
                            datasetIdentifier: "",
                            doiCreationStatus: "",
                        };

                        // Save the updated record to the Firebase database
                        const recordsRef = ref(database, `${region}/users/${userID}/records`);

                        if (record.recordID) {
                            await update(child(recordsRef, record.recordID), { datasetIdentifier: updatedRecord.datasetIdentifier, doiCreationStatus: updatedRecord.doiCreationStatus });
                        }

                        setDoiGenerated(false);
                    } else {
                        setDoiErrorFlag(true);
                    }
                })
                .finally(() => {
                    setLoadingDoiDelete(false);
                });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(err);
            setDoiErrorFlag(true);
            throw err;
        }
    }
   
    useEffect(() => {
        mounted.current = true;
        if (debouncedDoiIdValue === '') {
            handleUpdateDoiCreationStatus({ target: { name, value: "" } });
        }
        else if (debouncedDoiIdValue && datacitePrefix && doiIsValid && dataciteAuthHash) {
            let id = debouncedDoiIdValue
            if (debouncedDoiIdValue.includes('doi.org/')) {
                id = debouncedDoiIdValue.split('doi.org/').pop();
            }
            getDoiStatus({ doi: id, prefix: datacitePrefix, authHash: dataciteAuthHash })
                .then(response => {
                    if (mounted.current)
                        handleUpdateDoiCreationStatus({ target: { name, value: response.data } });
                })
                .catch(err => {
                    /* eslint-disable no-console */
                    console.error(err)
                });
        }

        return () => {
            mounted.current = false;
        };
    }, [debouncedDoiIdValue, getDoiStatus, doiIsValid, datacitePrefix, dataciteAuthHash])



    return (
        <Paper style={paperClass}>
            <QuestionText>
                <I18n>
                    <En>What is the DOI for this dataset? Eg,</En>
                    <Fr>Quel est le DOI de ce jeu de données ? Par exemple,</Fr>
                </I18n>{" "}
                https://doi.org/10.0000/0000
                {showGenerateDoi && (
                    <SupplementalText>
                        <I18n>
                            <En>
                                <p>Please save the form before generating a draft DOI.</p>
                            </En>
                            <Fr>
                                <p>
                                    Veuillez enregistrer le formulaire avant de générer un
                                    brouillon de DOI.
                                </p>
                            </Fr>
                        </I18n>
                    </SupplementalText>
                )}
            </QuestionText>
            {
                showGenerateDoi && (
                    <Button
                        onClick={() => handleGenerateDOI()}
                        disabled={generateDoiDisabled}
                        style={{ display: "inline" }}
                    >
                        <div style={{ display: "flex", alignItems: "center" }}>
                            {loadingDoi ? (
                                <>
                                    <CircularProgress size={24} style={{ marginRight: "8px" }} />
                                    Loading...
                                </>
                            ) : (
                                "Generate DOI"
                            )}
                        </div>
                    </Button>
                )
            }
            {
                showUpdateDoi && (
                    <Button
                        onClick={() => handleUpdateDraftDOI()}
                        disabled={['not found', 'unknown'].includes(record.doiCreationStatus)}
                        style={{ display: 'inline' }}
                    >
                        <div style={{ display: "flex", alignItems: "center" }}>
                            {loadingDoiUpdate ? (
                                <>
                                    <CircularProgress size={24} style={{ marginRight: "8px" }} />
                                    Loading...
                                </>
                            ) : (
                                "Update DOI"
                            )}
                        </div>
                    </Button>
                )
            }
            {
                showDeleteDoi && (
                    <Button
                        onClick={() => handleDeleteDOI()}
                        disabled={record.doiCreationStatus !== 'draft'}
                        style={{ display: "inline" }}
                    >
                        <div style={{ display: "flex", alignItems: "center" }}>
                            {loadingDoiDelete ? (
                                <>
                                    <CircularProgress size={24} style={{ marginRight: "8px" }} />
                                    Loading...
                                </>
                            ) : (
                                "Delete DOI"
                            )}
                        </div>
                    </Button>
                )
            }

            {
                doiErrorFlag && (
                    <span>
                        <I18n
                            en="Error occurred with DOI API"
                            fr="Une erreur s'est produite avec l'API DOI"
                        />
                    </span>
                )
            }
            {
                doiUpdateFlag && (
                    <span>
                        <I18n en="DOI has been updated" fr="Le DOI a été mis à jour" />
                    </span>
                )
            }

            <TextField
                style={{ marginTop: "10px" }}
                name={name || "datasetIdentifier"}
                helperText={
                    (doiIsValid ? "" : <I18n en="Invalid DOI" fr="DOI non valide" />)
                    || (showDoiStatus && <I18n en={`DOI Status: ${record.doiCreationStatus}`} fr={`Statut DOI: ${record.doiCreationStatus}`} />)
                }
                error={!doiIsValid}
                value={record.datasetIdentifier}
                onChange={(e) => handleUpdateDatasetIdentifier(e)}
                disabled={disabled}
                fullWidth
            />
        </Paper>

    );
};

export default DOIInput;