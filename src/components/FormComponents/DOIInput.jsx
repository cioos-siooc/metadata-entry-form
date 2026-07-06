
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Select,
    MenuItem,
    InputLabel,
    Link,
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
import { DOI_STATE_LABELS } from "../Dialogs/DataciteStatusDialog";
import performUpdateDraftDoi from "../../utils/doiUpdate";
import regions from "../../regions";


const DOIInput = ({ record, name, handleUpdateDatasetIdentifier, handleUpdateDoiCreationStatus, disabled }) => {
    const {
        createDraftDoi,
        deleteDraftDoi,
        getDoiStatus,
        datacitePrefix,
        dataciteApiDomain,
        doiSuffixModes,
        doiStatusManagement,
        publishDoi,
        registerDoi,
        hideDoi,
        isReviewer,
        isAdmin,
    } = useContext(UserContext);
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
    const recordLanguage = record.language || language;
    const catalogueBaseUrl = regions[region]?.catalogueURL?.[recordLanguage];
    const doiLandingUrl = catalogueBaseUrl && record.identifier
        ? `${catalogueBaseUrl}dataset/ca-cioos_${record.identifier}`
        : "";
    const doiIsValid = validateDOI(record.datasetIdentifier);
    const dataciteDoi = doiIsValid && record.datasetIdentifier
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
    // Confirmation prompt shown before status changes / deletion so the user
    // sees the consequences before acting. Holds the dialog copy + the action.
    const [confirmAction, setConfirmAction] = useState(null);

    const canManageDoi = Boolean(isReviewer || isAdmin);

    const generateDoiDisabled =
        doiGenerated
        || loadingDoi
        || !canManageDoi
        || record.doiCreationStatus !== ""
        || record.recordID === ""
        || (selectedSuffixMode === "manual" && !manualSuffix.trim())
        || (selectedSuffixMode === "identifier" && !(record.identifier || "").trim());
    const showGenerateDoi = Boolean(datacitePrefix);
    const showUpdateDoi = doiIsValid && datacitePrefix && record.doiCreationStatus !== "" && record.datasetIdentifier.includes(datacitePrefix);
    const showDeleteDoi = doiIsValid && datacitePrefix && record.doiCreationStatus !== "" && !doiErrorFlag && record.datasetIdentifier.includes(datacitePrefix);
    const showDataciteRecordButton = Boolean(dataciteRecordUrl);

    // Lifecycle stage: "manage" once a valid DOI from our DataCite prefix exists,
    // otherwise "generate". Splitting the UI this way means only the actions
    // relevant to the current stage are shown, instead of one always-visible blob.
    // (validateDOI() treats an empty value as valid, so we can't switch on it alone.)
    const isOurManagedDoi = doiIsValid && !!record.datasetIdentifier && record.datasetIdentifier.includes(datacitePrefix);
    const inGenerateStage = showGenerateDoi && !isOurManagedDoi;
    const inManageStage = showGenerateDoi && isOurManagedDoi;

    // Status is shown as a single dropdown. It is editable only when the region
    // manages DOI status from the form; otherwise it just reflects the active
    // value reported by DataCite. The selectable options follow the valid DataCite
    // transitions from the current state (a DOI can never return to "draft").
    const DOI_STATE_TRANSITIONS = {
        draft: ["draft", "registered", "findable"],
        registered: ["registered", "findable"],
        findable: ["findable", "registered"],
    };
    // A draft dataset (record.status === "") can't have its DOI status changed
    // unless the DOI was already advanced to registered/findable in the past —
    // you shouldn't be able to register/publish a DOI for a not-yet-submitted dataset.
    const datasetIsDraft = !["submitted", "published"].includes(record.status);
    const statusEditable =
        canManageDoi
        && doiStatusManagement === "form"
        && (!datasetIsDraft || ["registered", "findable"].includes(record.doiCreationStatus));
    const showStatusSelect =
        isOurManagedDoi
        && ["draft", "registered", "findable"].includes(record.doiCreationStatus);
    const statusOptions = DOI_STATE_TRANSITIONS[record.doiCreationStatus] || [record.doiCreationStatus];

    // Supplemental details (publisher + landing page) shown via a compact info
    // icon + popover instead of stacked alert banners.
    const showPublisherInfo = showGenerateDoi && Boolean(publisherName);
    const showLandingInfo =
        showGenerateDoi
        && Boolean(doiLandingUrl)
        && (!record.datasetIdentifier || record.datasetIdentifier.includes(datacitePrefix));
    const showDoiInfo = showPublisherInfo || showLandingInfo;
    const mounted = useRef(false);

    async function handleGenerateDOI() {
        if (!canManageDoi) {
            setDoiErrorFlag(true);
            setDoiErrorMessage("Only reviewers and admins can generate a DOI.");
            return;
        }
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
        if (!canManageDoi) {
            setDoiStateError("Only reviewers and admins can change DOI status.");
            return;
        }
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



    // Build the consequence copy for a DOI status change, keyed on the move being made.
    function getStatusConsequence(current, target) {
        if (target === "registered" && current === "findable") {
            return {
                titleEn: "Demote this DOI to Registered?",
                titleFr: "Rétrograder ce DOI à Enregistré ?",
                bodyEn: "The DOI will be hidden from public discovery — it will be removed from DataCite search and metadata indexes. The DOI itself stays permanent and the landing page link keeps working; it just won't be publicly findable.",
                bodyFr: "Le DOI sera masqué de la découverte publique — il sera retiré de la recherche et des index de métadonnées de DataCite. Le DOI reste permanent et le lien de la page de destination continue de fonctionner ; il ne sera simplement plus repérable publiquement.",
            };
        }
        if (target === "registered") {
            return {
                titleEn: "Register this DOI?",
                titleFr: "Enregistrer ce DOI ?",
                bodyEn: "Registering makes the DOI permanent — it can no longer be deleted. It will not be publicly discoverable until you publish it (Findable).",
                bodyFr: "L'enregistrement rend le DOI permanent — il ne pourra plus être supprimé. Il ne sera pas repérable publiquement tant que vous ne l'aurez pas publié (Trouvable).",
            };
        }
        return {
            titleEn: "Publish this DOI (Findable)?",
            titleFr: "Publier ce DOI (Trouvable) ?",
            bodyEn: "The DOI and its metadata become publicly discoverable and indexed by DataCite. This is permanent — the DOI can no longer be deleted, only demoted back to Registered (hidden) later.",
            bodyFr: "Le DOI et ses métadonnées deviennent repérables publiquement et indexés par DataCite. Cette action est permanente — le DOI ne peut plus être supprimé, seulement rétrogradé à Enregistré (masqué) ultérieurement.",
        };
    }

    function requestStatusChange(targetState) {
        if (!canManageDoi) {
            setDoiStateError("Only reviewers and admins can change DOI status.");
            return;
        }
        const c = getStatusConsequence(record.doiCreationStatus, targetState);
        setConfirmAction({
            ...c,
            onConfirm: () => handleDoiStateTransition(targetState),
        });
    }

    function requestDelete() {
        setConfirmAction({
            titleEn: "Delete this draft DOI?",
            titleFr: "Supprimer ce brouillon de DOI ?",
            bodyEn: "This permanently deletes the draft DOI from DataCite and clears the DOI field. Only draft DOIs can be deleted — once a DOI is registered or findable it becomes permanent and cannot be removed.",
            bodyFr: "Cela supprime définitivement le brouillon de DOI de DataCite et vide le champ DOI. Seuls les brouillons de DOI peuvent être supprimés — une fois enregistré ou trouvable, un DOI devient permanent et ne peut plus être retiré.",
            onConfirm: () => handleDeleteDOI(),
        });
    }

    const renderButtonLabel = (loading, label) =>
        loading ? (
            <div style={{ display: "flex", alignItems: "center" }}>
                <CircularProgress size={20} style={{ marginRight: "8px" }} />
                <I18n en="Loading..." fr="Chargement..." />
            </div>
        ) : (
            label
        );

    return (
        <Paper style={paperClass}>
            <QuestionText>
                <I18n>
                    <En>What is the DOI for this dataset? Eg,</En>
                    <Fr>Quel est le DOI de ce jeu de données ? Par exemple,</Fr>
                </I18n>{" "}
                https://doi.org/10.0000/0000
            </QuestionText>

            {/* The DOI value comes first, with its status dropdown inline beside it. */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <TextField
                    style={{ flexGrow: 1 }}
                    name={name || "datasetIdentifier"}
                    label={<I18n en="DOI" fr="DOI" />}
                    helperText={
                        record.datasetIdentifier && !doiIsValid
                            ? <I18n en="Invalid DOI" fr="DOI non valide" />
                            : ""
                    }
                    error={Boolean(record.datasetIdentifier) && !doiIsValid}
                    value={record.datasetIdentifier}
                    onChange={(e) => handleUpdateDatasetIdentifier(e)}
                    disabled={disabled}
                    fullWidth
                />
                {showStatusSelect && (
                    <Tooltip
                        title={
                            !canManageDoi
                                ? <I18n
                                    en="Only reviewers and admins can change DOI status."
                                    fr="Seuls les réviseurs et les administrateurs peuvent modifier le statut du DOI."
                                />
                                : doiStatusManagement === "form" && !statusEditable && !doiStateLoading
                                    ? <I18n
                                        en="The dataset must be submitted or published before its DOI status can be changed."
                                        fr="Le jeu de données doit être soumis ou publié avant de pouvoir modifier le statut de son DOI."
                                    />
                                    : ""
                        }
                        arrow
                        placement="top"
                    >
                        <FormControl
                            sx={{ minWidth: 200, flexShrink: 0 }}
                            disabled={!statusEditable || doiStateLoading}
                        >
                            <InputLabel id="doi-status-label">
                                <I18n en="DOI Status" fr="Statut du DOI" />
                            </InputLabel>
                            <Select
                                labelId="doi-status-label"
                                label={<I18n en="DOI Status" fr="Statut du DOI" />}
                                value={record.doiCreationStatus}
                                onChange={(e) => {
                                    const target = e.target.value;
                                    if (target !== record.doiCreationStatus) {
                                        requestStatusChange(target);
                                    }
                                }}
                                renderValue={(value) => (
                                    <I18n
                                        en={DOI_STATE_LABELS[value]?.en || value}
                                        fr={DOI_STATE_LABELS[value]?.fr || value}
                                    />
                                )}
                                endAdornment={doiStateLoading ? <CircularProgress size={18} sx={{ mr: 3 }} /> : null}
                            >
                                {statusOptions.map((s) => (
                                    <MenuItem key={s} value={s}>
                                        <I18n en={DOI_STATE_LABELS[s].en} fr={DOI_STATE_LABELS[s].fr} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Tooltip>
                )}
            </div>

            {/* Stage 1 — no DOI yet: reserve a draft DOI with DataCite. */}
            {inGenerateStage && (
                <div style={{ marginTop: "16px" }}>
                    <SupplementalText>
                        <I18n>
                            <En>Don&apos;t have a DOI yet? Reserve a draft DOI with DataCite. Please save the form first.</En>
                            <Fr>Vous n&apos;avez pas encore de DOI ? Réservez un brouillon de DOI auprès de DataCite. Veuillez d&apos;abord enregistrer le formulaire.</Fr>
                        </I18n>
                    </SupplementalText>

                    {availableSuffixModes.length > 1 && (
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

                    {selectedSuffixMode === "manual" && (
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

                    <Tooltip
                        title={
                            !canManageDoi
                                ? <I18n
                                    en="Only reviewers and admins can generate a DOI."
                                    fr="Seuls les réviseurs et les administrateurs peuvent générer un DOI."
                                />
                                : <I18n
                                    en="Reserves a draft DOI with DataCite (no metadata is sent yet). Once the record is submitted or published, the full metadata is included automatically."
                                    fr="Réserve un brouillon de DOI auprès de DataCite (aucune métadonnée n'est envoyée). Une fois le formulaire soumis ou publié, les métadonnées complètes sont incluses automatiquement."
                                />
                        }
                        arrow
                        placement="top"
                    >
                        <span>
                            <Button
                                onClick={() => handleGenerateDOI()}
                                disabled={generateDoiDisabled}
                            >
                                {renderButtonLabel(loadingDoi, <I18n en="Generate DOI" fr="Générer un DOI" />)}
                            </Button>
                        </span>
                    </Tooltip>
                </div>
            )}

            {/* Stage 2 — a DOI exists: manage its metadata. (Status lives inline above.) */}
            {inManageStage && (
                <div style={{ marginTop: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                        {showUpdateDoi && (
                            <Tooltip
                                title={
                                    <I18n
                                        en="Push the latest metadata to DataCite. Enabled only when the record is submitted or published."
                                        fr="Envoie les métadonnées les plus récentes à DataCite. Activé uniquement lorsque le formulaire est soumis ou publié."
                                    />
                                }
                                arrow
                                placement="top"
                            >
                                <span>
                                    <Button
                                        onClick={() => handleUpdateDraftDOI()}
                                        disabled={['not found', 'unknown'].includes(record.doiCreationStatus) || !["submitted", "published"].includes(record.status) || loadingDoi || loadingDoiUpdate}
                                    >
                                        {renderButtonLabel(loadingDoiUpdate, <I18n en="Update DOI" fr="Mettre à jour le DOI" />)}
                                    </Button>
                                </span>
                            </Tooltip>
                        )}
                        {showDataciteRecordButton && (
                            <Button
                                href={dataciteRecordUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <I18n en="View DataCite record" fr="Voir l'enregistrement DataCite" />
                            </Button>
                        )}
                        {showDeleteDoi && (
                            <Tooltip
                                title={
                                    <I18n
                                        en="Removes this draft DOI from DataCite. Available only while the DOI is in draft status."
                                        fr="Supprime ce brouillon de DOI de DataCite. Disponible uniquement tant que le DOI est au statut brouillon."
                                    />
                                }
                                arrow
                                placement="top"
                            >
                                <span>
                                    <Button
                                        onClick={() => requestDelete()}
                                        disabled={record.doiCreationStatus !== 'draft' || loadingDoiDelete || loadingDoi}
                                    >
                                        {renderButtonLabel(loadingDoiDelete, <I18n en="Delete DOI" fr="Supprimer le DOI" />)}
                                    </Button>
                                </span>
                            </Tooltip>
                        )}
                    </div>

                    {doiStateError && (
                        <Alert severity="error" sx={{ mt: 1 }}>{doiStateError}</Alert>
                    )}
                </div>
            )}

            {showDoiInfo && (
                <ul style={{ margin: "8px 0 0", paddingLeft: "1.4em", fontSize: "0.8rem", color: "rgba(0,0,0,0.6)" }}>
                    {showPublisherInfo && (
                        <li>
                            <I18n
                                en={`DOI Publisher: ${publisherName}${!publisherContact ? " (region default)" : ""}`}
                                fr={`Éditeur DOI : ${publisherName}${!publisherContact ? " (par défaut de la région)" : ""}`}
                            />
                        </li>
                    )}
                    {showLandingInfo && (
                        <li style={{ wordBreak: "break-all" }}>
                            <I18n
                                en={<>DOI landing page: <Link href={doiLandingUrl} target="_blank" rel="noopener noreferrer">{doiLandingUrl}</Link></>}
                                fr={<>Page de destination du DOI : <Link href={doiLandingUrl} target="_blank" rel="noopener noreferrer">{doiLandingUrl}</Link></>}
                            />
                        </li>
                    )}
                </ul>
            )}

            {doiErrorFlag && (
                <Alert severity="error" sx={{ mt: "10px" }}>
                    <AlertTitle>
                        <I18n
                            en="Error occurred with DOI API"
                            fr="Une erreur s'est produite avec l'API DOI"
                        />
                    </AlertTitle>
                    {doiErrorMessage}
                </Alert>
            )}
            {doiUpdateFlag && (
                <Alert severity="success" sx={{ mt: "10px" }}>
                    <I18n en="DOI has been updated" fr="Le DOI a été mis à jour" />
                </Alert>
            )}

            <Dialog
                open={Boolean(confirmAction)}
                onClose={() => setConfirmAction(null)}
                maxWidth="sm"
                fullWidth
                aria-labelledby="doi-confirm-title"
            >
                {confirmAction && (
                    <>
                        <DialogTitle id="doi-confirm-title">
                            <I18n en={confirmAction.titleEn} fr={confirmAction.titleFr} />
                        </DialogTitle>
                        <DialogContent>
                            <DialogContentText component="div">
                                <I18n en={confirmAction.bodyEn} fr={confirmAction.bodyFr} />
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setConfirmAction(null)}>
                                <I18n en="Cancel" fr="Annuler" />
                            </Button>
                            <Button
                                onClick={() => {
                                    const { onConfirm } = confirmAction;
                                    setConfirmAction(null);
                                    onConfirm();
                                }}
                                autoFocus
                            >
                                <I18n en="Confirm" fr="Confirmer" />
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Paper>

    );
};

export default DOIInput;