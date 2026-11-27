import { bareDoi, draftDoiPayload } from "@cioos/shared/datacite.js";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { ApiError } from "@/api/errors";
import {
  createDraftDoi,
  deleteDraftDoi,
  getDoiConfig,
  getDoiStatus,
  type DoiConfig,
} from "@/api/doi";
import type { MetadataRecord } from "@/api/records";
import { useSession } from "@/auth/SessionProvider";
import { Button } from "@/components/Button";
import { ConfirmSheet } from "@/components/ConfirmSheet";
import { pushDoiMetadata } from "@/records/doi";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * The record's DOI.
 *
 * The one part of this app that reaches a public registry, so it behaves
 * unlike everything else: nothing here is ever queued. A replayed create would
 * mint a second permanent identifier that nothing points at, so offline the
 * panel disables itself and says why rather than deferring the work.
 *
 * It disappears entirely for a region with no DataCite account — a dead
 * "Generate DOI" button that always fails is worse than no button.
 */
export function DoiPanel({
  document,
  update,
}: {
  document: MetadataRecord;
  update: (field: string, value: unknown) => void;
}) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { region, isOffline } = useSession();

  const [config, setConfig] = useState<DoiConfig | null>(null);
  const [busy, setBusy] = useState<null | "create" | "update" | "delete">(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const identifier = (document.datasetIdentifier as string) ?? "";
  const creationStatus = (document.doiCreationStatus as string) ?? "";
  const hasDoi = Boolean(identifier && creationStatus);
  const savedToServer = Boolean(document.recordID);

  useEffect(() => {
    if (!region || isOffline) return;
    let cancelled = false;
    getDoiConfig(region)
      .then((loaded) => {
        if (!cancelled) setConfig(loaded);
      })
      .catch(() => {
        // A region whose config cannot be read is treated as unconfigured: the
        // alternative is offering an action that is certain to fail.
        if (!cancelled) setConfig(null);
      });
    return () => {
      cancelled = true;
    };
  }, [region, isOffline]);

  const refreshStatus = useCallback(async () => {
    if (!region || !identifier || isOffline) return;
    try {
      const result = await getDoiStatus(region, bareDoi(identifier));
      setLiveStatus(result.status);
    } catch {
      setLiveStatus(null);
    }
  }, [region, identifier, isOffline]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const describe = (err: unknown) =>
    err instanceof ApiError && err.message ? err.message : t("doi.failed");

  const generate = async () => {
    if (!region || !config?.prefix) return;
    setBusy("create");
    setProblem(null);
    setNote(null);
    try {
      const response = await createDraftDoi(region, draftDoiPayload(config.prefix));
      const doi = response?.data?.attributes?.doi;
      if (!doi) throw new Error("No DOI returned");
      // Registered at DataCite the moment this returns, so it goes into the
      // draft immediately — autosave persists it locally before anything else
      // can fail.
      update("datasetIdentifier", `https://doi.org/${doi}`);
      update("doiCreationStatus", "draft");
      setNote(t("doi.created"));
    } catch (err) {
      setProblem(describe(err));
    } finally {
      setBusy(null);
    }
  };

  const pushMetadata = async () => {
    if (!region) return;
    setBusy("update");
    setProblem(null);
    setNote(null);
    try {
      await pushDoiMetadata(document, region, i18n.language);
      setNote(t("doi.updated"));
      await refreshStatus();
    } catch (err) {
      setProblem(describe(err));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!region) return;
    setBusy("delete");
    setProblem(null);
    setNote(null);
    try {
      await deleteDraftDoi(region, bareDoi(identifier));
      update("datasetIdentifier", "");
      update("doiCreationStatus", "");
      setConfirmingDelete(false);
      setLiveStatus(null);
      setNote(t("doi.deleted"));
    } catch (err) {
      setProblem(describe(err));
    } finally {
      setBusy(null);
    }
  };

  // No DataCite account for this region, and no DOI already on the record:
  // there is nothing here worth a heading.
  if (!config?.prefix && !hasDoi) return null;

  const state = liveStatus ?? creationStatus;
  const isDraft = state === "draft";

  return (
    <View
      style={[
        styles.panel,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceRaised,
          borderRadius: theme.radius.md,
          padding: theme.space.md,
          gap: theme.space.sm,
        },
      ]}
    >
      <View style={styles.row}>
        <Ionicons name="pricetag-outline" size={18} color={theme.colors.textMuted} />
        <Text style={[theme.type.label, { color: theme.colors.textMuted, flex: 1 }]}>
          {t("doi.title")}
        </Text>
        {state ? (
          <Text
            style={[
              theme.type.caption,
              { color: isDraft ? theme.semantic.queued : theme.semantic.complete },
            ]}
          >
            {t(`doi.state.${state}`, { defaultValue: state })}
          </Text>
        ) : null}
      </View>

      {hasDoi ? (
        <Text style={[theme.type.data, { color: theme.colors.text }]} selectable>
          {identifier}
        </Text>
      ) : (
        <Text style={[theme.type.bodySmall, { color: theme.colors.textMuted }]}>
          {t("doi.help")}
        </Text>
      )}

      {isOffline ? (
        <Text style={[theme.type.caption, { color: theme.semantic.incomplete }]}>
          {t("doi.offline")}
        </Text>
      ) : !savedToServer ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          {t("doi.saveFirst")}
        </Text>
      ) : null}

      {problem ? (
        <Text
          style={[theme.type.bodySmall, { color: theme.semantic.error }]}
          accessibilityLiveRegion="polite"
        >
          {problem}
        </Text>
      ) : null}

      {note ? (
        <Text
          style={[theme.type.caption, { color: theme.semantic.complete }]}
          accessibilityLiveRegion="polite"
        >
          {note}
        </Text>
      ) : null}

      {!hasDoi ? (
        <Button
          label={t("doi.generate")}
          variant="secondary"
          onPress={generate}
          busy={busy === "create"}
          disabled={isOffline || !savedToServer || busy !== null || !config?.hasCredentials}
        />
      ) : (
        <>
          <Button
            label={t("doi.update")}
            variant="secondary"
            onPress={pushMetadata}
            busy={busy === "update"}
            disabled={isOffline || busy !== null}
          />
          {isDraft ? (
            <Button
              label={t("doi.delete")}
              variant="quiet"
              onPress={() => setConfirmingDelete(true)}
              disabled={isOffline || busy !== null}
            />
          ) : null}
        </>
      )}

      <ConfirmSheet
        visible={confirmingDelete}
        title={t("doi.delete")}
        message={t("doi.deleteConfirm")}
        confirmLabel={t("doi.delete")}
        destructive
        busy={busy === "delete"}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={remove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
