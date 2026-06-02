
import React, { useContext, useState, useEffect, useRef } from "react";
import {
    Paper,
    TextField,
    Button,
    Tooltip,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { useDebounce } from "use-debounce";
import { useParams } from "react-router-dom";
import { getDatabase, ref, child, update } from "firebase/database";

import { En, Fr, I18n } from "../I18n";

import firebase from "../../firebase";
import { validateDOI } from "../../utils/validate";

import {
    QuestionText,
    SupplementalText,
    paperClass,
} from "./QuestionStyles";

import { UserContext } from "../../providers/UserProvider";
import performUpdateDraftDoi from "../../utils/doiUpdate";
import regions from "../../regions";


const DOIInput = ({ record, name, handleUpdateDatasetIdentifier, handleUpdateDoiCreationStatus, disabled }) => {
    const { createDraftDoi, deleteDraftDoi, getDoiStatus, datacitePrefix, dataciteApiDomain, doiSuffixModes, doiStatusManagement, publishDoi, registerDoi, hideDoi } = useContext(UserContext);
    const { language, region, userID } = useParams();
    const availableSuffixModes =
        Array.isArray(doiSuffixModes) && doiSuffixModes.length > 0
            ? doiSuffixModes
            : ["default"];
    const [selectedSuffixMode, setSelectedSuffixMode] = useState(
        availableSuffixModes.includes("default") ? "default" : availableSuffixModes[0]
    );
    const [manualSuffix, setManualSuffix] = useState("");

    useEffect(() => {
        if (!availableSuffixModes.includes(selectedSuffixMode)) {
            setSelectedSuffixMode(availableSuffixModes[0]);
        }
    }, [availableSuffixModes, selectedSuffixMode]);

    const publisherContact = (record.contacts || []).find((c) => c.role?.includes("publisher"));
    const publisherName = publisherContact?.orgName || regions[region]?.title?.[language] || "";
    const doiIsValid = validateDOI(record.datasetIdentifier);
    const dataciteDoi = doiIsValid
        ? record.datasetIdentifier.replace(/^https?:\/\/(?:dx\.)?doi\.org\//, "")
        : "";
    const dataciteRecordBaseUrl = dataciteApiDomain === "test"
        ? "https://doi.test.datacite.org"
        : "https://doi.datacite.org";
    const dataciteRecordUrl = dataciteDoi
        ? `${dataciteRecordBaseUrl}/dois/${encodeURIComponent(dataciteDoi)}`
        : "";
    const [doiGenerated, setDoiGenerated] = useState(false);
    const [doiErrorFlag, setDoiErrorFlag] = useState(false);
    const [doiErrorMessage, setDoiErrorMessage] = useState("");
    const [debouncedDoiIdValue] = useDebounce(record.datasetIdentifier, 1000);
    const [loadingDoi, setLoadingDoi] = useState(false);
    const [loadingDoiUpdate, setLoadingDoiUpdate] = useState(false);
    const [loadingDoiDelete, setLoadingDoiDelete] = useState(false);
    const [doiUpdateFlag, setDoiUpdateFlag] = useState(false);
    const [doiStateLoading, setDoiStateLoading] = useState(false);
    const [doiStateError, setDoiStateError] = useState("");

    const generateDoiDisabled =
        doiGenerated
        || loadingDoi
        || record.doiCreationStatus !== ""
        || record.recordID === ""
        || (selectedSuffixMode === "manual" && !manualSuffix.trim())
        || (selectedSuffixMode === "identifier" && !(record.identifier || "").trim());
    const showGenerateDoi = Boolean(datacitePrefix);
    const showDoiStatus = doiIsValid && datacitePrefix && record.doiCreationStatus && record.doiCreationStatus !== "";
    const showUpdateDoi = doiIsValid && datacitePrefix && record.doiCreationStatus !== "" && record.datasetIdentifier.includes(datacitePrefix);
    const showDeleteDoi = doiIsValid && datacitePrefix && record.doiCreationStatus !== "" && !doiErrorFlag && record.datasetIdentifier.includes(datacitePrefix);
    const showDataciteRecordButton = Boolean(dataciteRecordUrl);
    const mounted = useRef(false);

    async function handleGenerateDOI() {
        setLoadingDoi(true);
        setDoiErrorFlag(false);
        setDoiErrorMessage("");
        const database = getDatabase(firebase);

        console.log("[DOIInput] handleGenerateDOI", { region, datacitePrefix, language, identifier: record.identifier, recordID: record.recordID });

        try {
            let doiSuffix = "";
            if (selectedSuffixMode === "identifier") {
                doiSuffix = (record.identifier || "").trim();
                if (!doiSuffix) {
                    throw new Error("Record identifier is empty; cannot use it as the DOI suffix.");
                }
            } else if (selectedSuffixMode === "manual") {
                doiSuffix = manualSuffix.trim();
                if (!doiSuffix) {
                    throw new Error("Please enter a DOI suffix value.");
                }
            }

            const payloadAttributes = {
                prefix: datacitePrefix,
            };
            if (doiSuffix) {
                payloadAttributes.doi = `${datacitePrefix}/${doiSuffix}`;
            }
            const minimalPayload = {
                data: {
                    type: "dois",
                    attributes: payloadAttributes,
                },
            };

            console.log("[DOIInput] createDraftDoi payload", { region, minimalPayload });

            await createDraftDoi({
                record: minimalPayload,
                region,
            })
                .then((response) => {
                    return response.data.data.attributes;
                })
                .then(async (attributes) => {
                    // Update the record object (local state) with datasetIdentifier and doiCreationStatus
                    handleUpdateDatasetIdentifier({ target: { value: `https://doi.org/${attributes.doi}` } });
                    handleUpdateDoiCreationStatus({ target: { value: "draft" } });

                    // Save doi values to database now without waiting for the user to press save
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

                    // If the record is already submitted or published, push full metadata immediately
                    if (["submitted", "published"].includes(record.status)) {
                        try {
                            await performUpdateDraftDoi(updatedRecord, region, language, datacitePrefix);
                        } catch (updateErr) {
                            console.error("[DOIInput] auto-update after generate failed", updateErr);
                            setDoiErrorFlag(true);
                            setDoiErrorMessage(updateErr.message || "DOI created but failed to push metadata. Try clicking Update DOI.");
                        }
                    }
                })
                .finally(() => {
                    setLoadingDoi(false);
                });

        } catch (err) {
            setDoiErrorFlag(true);
            const errorMessage = err.message || "Failed to generate DOI. Please try again.";
            setDoiErrorMessage(errorMessage);
            setLoadingDoi(false);
            console.error("[DOIInput] handleGenerateDOI failed", { code: err.code, message: err.message, details: err.details });
        }
    }

    async function handleUpdateDraftDOI() {
        setLoadingDoiUpdate(true);
        setDoiErrorFlag(false);
        setDoiErrorMessage("");
        try {
            const statusCode = await performUpdateDraftDoi(record, region, language, datacitePrefix)

            if (statusCode === 200) {
                setDoiUpdateFlag(true);
                setDoiErrorFlag(false);
            } else {
                setDoiErrorFlag(true);
                setDoiUpdateFlag(false);
            }
        } catch (err) {
            setDoiErrorFlag(true);
            // Extract error message from Firebase function error
            const errorMessage = err.message || "Failed to update DOI. Please try again.";
            setDoiErrorMessage(errorMessage);
            // eslint-disable-next-line no-console
            console.error("Error in handleUpdateDraftDOI:", err);
        } finally {
            setLoadingDoiUpdate(false);
            setTimeout(() => {
                setDoiUpdateFlag(false);
            }, 3000);
        }
    }

    async function handleDeleteDOI() {
        setLoadingDoiDelete(true);
        setDoiErrorFlag(false);
        setDoiErrorMessage("");
        const database = getDatabase(firebase);

        try {
            // Extract DOI from the full URL (supports http/https and dx.doi.org)
            const doi = record.datasetIdentifier.replace(/^https?:\/\/(?:dx\.)?doi\.org\//, '');

            deleteDraftDoi({ doi, region })
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
            console.error("Error in handleDeleteDOI:", err);
            setDoiErrorFlag(true);
            const errorMessage = err.message || "Failed to delete DOI. Please try again.";
            setDoiErrorMessage(errorMessage);
            setLoadingDoiDelete(false);
        }
    }

    async function handleDoiStateTransition(targetState) {
        setDoiStateLoading(true);
        setDoiStateError("");
        const doi = record.datasetIdentifier.replace(/^https?:\/\/(?:dx\.)?doi\.org\//, "");
        const database = getDatabase(firebase);
        try {
            let result;
            if (targetState === "findable") {
                result = await publishDoi({ doi, region });
            } else if (targetState === "registered" && record.doiCreationStatus === "draft") {
                result = await registerDoi({ doi, region });
            } else if (targetState === "registered" && record.doiCreationStatus === "findable") {
                result = await hideDoi({ doi, region });
            }
            const newState = result?.data?.state || targetState;
            handleUpdateDoiCreationStatus({ target: { name, value: newState } });
            if (record.recordID) {
                const recordsRef = ref(database, `${region}/users/${userID}/records`);
                await update(child(recordsRef, record.recordID), { doiCreationStatus: newState });
            }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("DOI state transition failed:", err);
            setDoiStateError(err.message || "Failed to update DOI status. Please try again.");
        } finally {
            setDoiStateLoading(false);
        }
    }

    useEffect(() => {
        mounted.current = true;
        if (debouncedDoiIdValue === '') {
            handleUpdateDoiCreationStatus({ target: { name, value: "" } });
        }
        else if (debouncedDoiIdValue && datacitePrefix && doiIsValid) {
            let id = debouncedDoiIdValue
            if (debouncedDoiIdValue.includes('doi.org/')) {
                id = debouncedDoiIdValue.split('doi.org/').pop();
            }
            getDoiStatus({ doi: id, region })
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
    }, [debouncedDoiIdValue, getDoiStatus, doiIsValid])



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
            {showGenerateDoi && availableSuffixModes.length > 1 && (
                <FormControl component="fieldset" sx={{ mt: 1, mb: 1, display: "block" }}>
                    <FormLabel component="legend">
                        <I18n en="DOI Suffix" fr="Suffixe DOI" />
                    </FormLabel>
                    <RadioGroup
                        row
                        value={selectedSuffixMode}
                        onChange={(e) => setSelectedSuffixMode(e.target.value)}
                    >
                        {availableSuffixModes.includes("default") && (
                            <FormControlLabel
                                value="default"
                                control={<Radio />}
                                label={<I18n en="Auto-generated" fr="Généré automatiquement" />}
                            />
                        )}
                        {availableSuffixModes.includes("identifier") && (
                            <FormControlLabel
                                value="identifier"
                                control={<Radio />}
                                label={<I18n en="Form identifier" fr="Identifiant du formulaire" />}
                            />
                        )}
                        {availableSuffixModes.includes("manual") && (
                            <FormControlLabel
                                value="manual"
                                control={<Radio />}
                                label={<I18n en="Manual" fr="Manuel" />}
                            />
                        )}
                    </RadioGroup>
                </FormControl>
            )}
            {showGenerateDoi && selectedSuffixMode === "manual" && (
                <TextField
                    label={<I18n en="DOI Suffix" fr="Suffixe DOI" />}
                    value={manualSuffix}
                    onChange={(e) => setManualSuffix(e.target.value)}
                    fullWidth
                    sx={{ mb: 1 }}
                    helperText={
                        <I18n
                            en={`Will produce: ${datacitePrefix}/${manualSuffix || "<suffix>"}`}
                            fr={`Donnera : ${datacitePrefix}/${manualSuffix || "<suffixe>"}`}
                        />
                    }
                />
            )}
            {
                showGenerateDoi && (
                    <Tooltip
                        title={
                            <I18n>
                                <En>
                                    <ol style={{ margin: 0, paddingLeft: "1.2em", fontSize: "0.85rem" }}>
                                        <li><strong>Generate DOI</strong> reserves a draft DOI with DataCite (no metadata is sent yet).</li>
                                        <li>Once the record status is <strong>submitted</strong> or <strong>published</strong>, generating a DOI will automatically include the full metadata.</li>
                                        <li><strong>Update DOI</strong> pushes the latest metadata to DataCite. This button is only enabled when the record is submitted or published.</li>
                                        <li><strong>Delete DOI</strong> removes a draft DOI from DataCite (only available while the DOI is in draft status).</li>
                                    </ol>
                                </En>
                                <Fr>
                                    <ol style={{ margin: 0, paddingLeft: "1.2em", fontSize: "0.85rem" }}>
                                        <li><strong>Générer un DOI</strong> réserve un DOI brouillon auprès de DataCite (aucune métadonnée n&apos;est envoyée).</li>
                                        <li>Lorsque le statut est <strong>soumis</strong> ou <strong>publié</strong>, la génération inclura automatiquement les métadonnées complètes.</li>
                                        <li><strong>Mettre à jour le DOI</strong> envoie les métadonnées les plus récentes à DataCite. Activé uniquement lorsque soumis ou publié.</li>
                                        <li><strong>Supprimer le DOI</strong> supprime un DOI brouillon de DataCite (disponible uniquement en statut brouillon).</li>
                                    </ol>
                                </Fr>
                            </I18n>
                        }
                        arrow
                        placement="top"
                    >
                        <div style={{ display: "inline" }}>
                            <Button
                                onClick={() => handleGenerateDOI()}
                                disabled={generateDoiDisabled}
                                style={{ display: "inline", marginRight: "15px" }}
                            >
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    {loadingDoi ? (
                                        <>
                                            <CircularProgress size={24} style={{ marginRight: "8px" }} />
                                            <I18n en="Loading..." fr="Chargement..." />
                                        </>
                                    ) : (
                                        <I18n en="Generate DOI" fr="Générer un DOI" />
                                    )}
                                </div>
                            </Button>
                            {showUpdateDoi && (
                                <Button
                                    onClick={() => handleUpdateDraftDOI()}
                                    disabled={['not found', 'unknown'].includes(record.doiCreationStatus) || !["submitted", "published"].includes(record.status) || loadingDoi || loadingDoiUpdate}
                                    style={{ display: 'inline', marginRight: "15px" }}
                                >
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        {loadingDoiUpdate ? (
                                            <>
                                                <CircularProgress size={24} style={{ marginRight: "8px" }} />
                                                <I18n en="Loading..." fr="Chargement..." />
                                            </>
                                        ) : (
                                            <I18n en="Update DOI" fr="Mettre à jour le DOI" />
                                        )}
                                    </div>
                                </Button>
                            )}
                            {showDeleteDoi && (
                                <Button
                                    onClick={() => handleDeleteDOI()}
                                    disabled={record.doiCreationStatus !== 'draft' || loadingDoiDelete || loadingDoi}
                                    style={{ display: "inline", marginRight: "15px" }}
                                >
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        {loadingDoiDelete ? (
                                            <>
                                                <CircularProgress size={24} style={{ marginRight: "8px" }} />
                                                <I18n en="Loading..." fr="Chargement..." />
                                            </>
                                        ) : (
                                            <I18n en="Delete DOI" fr="Supprimer le DOI" />
                                        )}
                                    </div>
                                </Button>
                            )}
                            {showDataciteRecordButton && (
                                <Button
                                    href={dataciteRecordUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: "inline", marginRight: "15px" }}
                                >
                                    <I18n en="View DataCite record" fr="Voir l'enregistrement DataCite" />
                                </Button>
                            )}
                        </div>
                    </Tooltip>
                )
            }

            {
                doiErrorFlag && (
                    <Alert severity="error" sx={{ mt: "10px" }}>
                        <AlertTitle>
                            <I18n
                                en="Error occurred with DOI API"
                                fr="Une erreur s'est produite avec l'API DOI"
                            />
                        </AlertTitle>
                        {doiErrorMessage}
                    </Alert>
                )
            }
            {
                doiUpdateFlag && (
                    <span>
                        <I18n en="DOI has been updated" fr="Le DOI a été mis à jour" />
                    </span>
                )
            }

            {doiStatusManagement === "form" && doiIsValid && datacitePrefix && !["", "not found", "unknown"].includes(record.doiCreationStatus) && (
                <div style={{ marginTop: "12px" }}>
                    <span style={{ marginRight: "8px", fontSize: "0.875rem", color: "rgba(0,0,0,0.6)" }}>
                        <I18n en="DOI Status:" fr="Statut DOI :" />
                    </span>
                    {record.doiCreationStatus === "draft" && (
                        <>
                            <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                onClick={() => handleDoiStateTransition("registered")}
                                disabled={doiStateLoading}
                                style={{ marginRight: "8px" }}
                            >
                                {doiStateLoading ? <CircularProgress size={16} /> : <I18n en="Register" fr="Enregistrer" />}
                            </Button>
                            <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleDoiStateTransition("findable")}
                                disabled={doiStateLoading}
                            >
                                {doiStateLoading ? <CircularProgress size={16} /> : <I18n en="Publish (Findable)" fr="Publier (Trouvable)" />}
                            </Button>
                        </>
                    )}
                    {record.doiCreationStatus === "registered" && (
                        <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleDoiStateTransition("findable")}
                            disabled={doiStateLoading}
                        >
                            {doiStateLoading ? <CircularProgress size={16} /> : <I18n en="Publish (Findable)" fr="Publier (Trouvable)" />}
                        </Button>
                    )}
                    {record.doiCreationStatus === "findable" && (
                        <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            onClick={() => handleDoiStateTransition("registered")}
                            disabled={doiStateLoading}
                        >
                            {doiStateLoading ? <CircularProgress size={16} /> : <I18n en="Demote to Registered" fr="Rétrograder à enregistré" />}
                        </Button>
                    )}
                    {doiStateError && (
                        <Alert severity="error" sx={{ mt: 1 }}>{doiStateError}</Alert>
                    )}
                </div>
            )}

            {showGenerateDoi && publisherName && (
                <Alert severity="info" sx={{ mt: "10px" }}>
                    <I18n
                        en={`DOI Publisher: ${publisherName}${!publisherContact ? " (region default)" : ""}`}
                        fr={`Éditeur DOI : ${publisherName}${!publisherContact ? " (par défaut de la région)" : ""}`}
                    />
                </Alert>
            )}

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