import { buildPublishPayload } from "@cioos/shared/publishPayload.js";

import { convertRecord } from "@/api/doi";
import { getGithubConfig, publishToGithub } from "@/api/publish";
import type { MetadataRecord } from "@/api/records";

/**
 * Publishes a record's files to the region's GitHub repository.
 *
 * The path layout comes from `@cioos/shared` because the WAF harvests those
 * paths — a phone that named files differently would publish records nothing
 * ever picks up.
 */
export async function publishRecordToGithub({
  region,
  record,
  environments,
  commitMessage,
  onProgress,
}: {
  region: string;
  record: MetadataRecord;
  environments: string[];
  commitMessage?: string;
  onProgress?: (step: "config" | "converting" | "publishing") => void;
}): Promise<void> {
  onProgress?.("config");
  const config = await getGithubConfig(region);
  if (!config.hasToken) throw new Error("GitHub is not configured for this region");

  onProgress?.("converting");
  const [xml, yaml] = await Promise.all([
    convertRecord(region, record, "iso19115-3_xml"),
    convertRecord(region, record, "yaml"),
  ]);

  const asText = (value: unknown) =>
    typeof value === "string" ? value : JSON.stringify(value, null, 2);

  const payload = buildPublishPayload({
    record,
    environments,
    commitMessage,
    config,
    region,
    xmlContent: asText(xml?.data),
    yamlContent: asText(yaml?.data),
  });

  onProgress?.("publishing");
  await publishToGithub(region, payload.files, payload.commitMessage);
}
