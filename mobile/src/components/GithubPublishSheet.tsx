import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { environmentList, getGithubConfig, type GithubConfig } from "@/api/publish";
import type { MetadataRecord } from "@/api/records";
import { Button } from "@/components/Button";
import { ChoiceInput } from "@/components/fields/ChoiceInput";
import { TextInput } from "@/components/fields/TextInput";
import { publishRecordToGithub } from "@/records/githubPublish";
import { contentColumn } from "@/theme/layout";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Publish a record's files to the region's repository.
 *
 * Gated on the region actually having a token: an unconfigured region gets a
 * plain explanation and a way out, not a button that fails. This is the one
 * reviewer action with real consequences outside CIOOS, so it names the
 * repository it is about to write to.
 */
export function GithubPublishSheet({
  visible,
  region,
  record,
  onClose,
  onPublished,
}: {
  visible: boolean;
  region: string;
  record: MetadataRecord;
  onClose: () => void;
  onPublished: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [config, setConfig] = useState<GithubConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [environments, setEnvironments] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const title =
    (record.title as { en?: string; fr?: string })?.en ||
    (record.title as { en?: string; fr?: string })?.fr ||
    "";

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    setProblem(null);
    setMessage(`Publish metadata record: ${title}`);

    getGithubConfig(region)
      .then((loaded) => {
        if (cancelled) return;
        setConfig(loaded);
        const list = environmentList(loaded);
        // One environment needs no choosing.
        setEnvironments(list.length === 1 ? list : []);
      })
      .catch(() => {
        if (!cancelled) setConfig(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible, region, title]);

  const publish = async () => {
    setBusy(true);
    setProblem(null);
    try {
      await publishRecordToGithub({
        region,
        record,
        environments,
        commitMessage: message,
        onProgress: (which) => setStep(t(`github.step.${which}`)),
      });
      onPublished();
      onClose();
    } catch (err) {
      setProblem(err instanceof Error ? err.message : t("actions.failed"));
    } finally {
      setBusy(false);
      setStep(null);
    }
  };

  const choices = environmentList(config).map((env) => ({ value: env, label: env }));
  const configured = Boolean(config?.hasToken);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.sheet,
            contentColumn,
            {
              backgroundColor: theme.colors.surfaceRaised,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
              padding: theme.space.lg,
              paddingBottom: insets.bottom + theme.space.lg,
              gap: theme.space.md,
            },
          ]}
        >
          <Text style={[theme.type.title, { color: theme.colors.text }]}>
            {t("github.title")}
          </Text>

          {loading ? (
            <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
              {t("common.loading")}
            </Text>
          ) : !configured ? (
            <>
              <Text style={[theme.type.body, { color: theme.colors.textMuted }]}>
                {t("github.notConfigured")}
              </Text>
              <Button label={t("common.close")} variant="secondary" onPress={onClose} />
            </>
          ) : (
            <>
              <Text style={[theme.type.dataSmall, { color: theme.colors.textMuted }]}>
                {config?.owner}/{config?.repo} · {config?.branch}
              </Text>

              {choices.length > 1 ? (
                <View style={{ gap: 4 }}>
                  <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                    {t("github.environments")}
                  </Text>
                  <ChoiceInput
                    multiple
                    choices={choices}
                    selected={environments}
                    onChange={setEnvironments}
                  />
                </View>
              ) : null}

              <View style={{ gap: 4 }}>
                <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                  {t("github.commitMessage")}
                </Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  accessibilityLabel={t("github.commitMessage")}
                />
              </View>

              {step ? (
                <Text
                  style={[theme.type.caption, { color: theme.colors.textMuted }]}
                  accessibilityLiveRegion="polite"
                >
                  {step}
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

              <Button
                label={t("github.publish")}
                onPress={publish}
                busy={busy}
                disabled={busy || environments.length === 0 || !message.trim()}
              />
              <Button
                label={t("actions.cancel")}
                variant="quiet"
                onPress={onClose}
                disabled={busy}
              />
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { width: "100%" },
});
