import type { MetadataRecord } from "@/api/records";
import type { LedgerSection } from "@/records/ledger";

/** What every section editor receives. */
export interface SectionProps {
  document: MetadataRecord;
  update: (field: string, value: unknown) => void;
  /** This section's slice of the ledger, for inline validation messages. */
  ledger?: LedgerSection;
}
