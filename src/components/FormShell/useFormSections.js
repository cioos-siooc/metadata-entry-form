import { useMemo } from "react";
import {
  FlagOutlined,
  FingerprintOutlined,
  PublicOutlined,
  PeopleAltOutlined,
  FolderOpenOutlined,
  DirectionsBoatOutlined,
  SendOutlined,
  PetsOutlined,
} from "@mui/icons-material";
import { getErrorsByTab } from "../../utils/validate";
import tabs from "../../utils/tabs";

// Maps a section id (the value used in <Tabs>) to the validator tab keys that
// feed into its error count. Some sections aggregate multiple validator tabs.
const SECTION_TO_VALIDATOR_TABS = {
  start: ["start"],
  identification: ["dataID"],
  taxa: ["taxa"],
  spatial: ["spatial"],
  contact: ["contacts"],
  distribution: ["resources", "relatedworks", "lineage"],
  platform: ["platform", "platformInstruments"],
  submit: [],
};

function label(key, language, fallback) {
  const entry = tabs[key];
  if (entry && entry[language]) return entry[language];
  return fallback;
}

export default function useFormSections({
  record,
  language,
  loggedInUserCanEditRecord,
}) {
  const errorsByTab = useMemo(() => getErrorsByTab(record || {}), [record]);

  return useMemo(() => {
    if (!record) return [];

    const touched = Boolean(
      record.title?.en || record.title?.fr || record.recordID
    );

    const baseSections = [
      {
        id: "start",
        label: label("start", language, "Start"),
        icon: FlagOutlined,
      },
      {
        id: "identification",
        label: label("dataID", language, "Identification"),
        icon: FingerprintOutlined,
      },
      {
        id: "taxa",
        label: label("taxa", language, "Taxa"),
        icon: PetsOutlined,
      },
      {
        id: "spatial",
        label: label("spatial", language, "Spatial"),
        icon: PublicOutlined,
      },
      {
        id: "contact",
        label: language === "fr" ? "Contacts" : "Contacts",
        icon: PeopleAltOutlined,
      },
      {
        id: "distribution",
        label: label("resources", language, "Resources"),
        icon: FolderOpenOutlined,
      },
    ];

    if (!["model"].includes(record.metadataScopeIso)) {
      baseSections.push({
        id: "platform",
        label: label("platform", language, "Platform"),
        icon: DirectionsBoatOutlined,
      });
    }

    if (loggedInUserCanEditRecord) {
      baseSections.push({
        id: "submit",
        label: language === "fr" ? "Soumettre" : "Submit",
        icon: SendOutlined,
        disabled:
          record.status === "submitted" || record.status === "published",
      });
    }

    return baseSections.map((section) => {
      const validatorKeys = SECTION_TO_VALIDATOR_TABS[section.id] || [];
      const errorCount = validatorKeys.reduce(
        (sum, key) => sum + (errorsByTab[key]?.length || 0),
        0
      );

      let state = "empty";
      if (section.id === "submit") {
        state = "empty";
      } else if (errorCount > 0) {
        state = "error";
      } else if (touched) {
        state = "complete";
      }

      return { ...section, errorCount, state };
    });
  }, [record, language, errorsByTab, loggedInUserCanEditRecord]);
}
