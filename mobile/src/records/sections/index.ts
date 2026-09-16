import type { ComponentType } from "react";

import type { SectionId } from "@/records/ledger";

import { AboutSection } from "./AboutSection";
import { IdentificationSection } from "./IdentificationSection";
import { PlatformSection } from "./PlatformSection";
import { ResourcesSection } from "./ResourcesSection";
import { ReviewSection } from "./ReviewSection";
import { SpeciesSection } from "./SpeciesSection";
import { WhenSection } from "./WhenSection";
import { WhereSection } from "./WhereSection";
import { WhoSection } from "./WhoSection";
import type { SectionProps } from "./types";

/**
 * Section registry.
 *
 * One entry per SectionId, so a missing editor is a type error rather than a
 * blank screen — the ledger already guarantees every validator belongs to a
 * section, and this guarantees every section can be opened.
 */
export const SECTION_EDITORS: Record<SectionId | "review", ComponentType<SectionProps>> = {
  identification: IdentificationSection,
  about: AboutSection,
  when: WhenSection,
  where: WhereSection,
  who: WhoSection,
  platform: PlatformSection,
  species: SpeciesSection,
  resources: ResourcesSection,
  review: ReviewSection,
};

export type { SectionProps };
