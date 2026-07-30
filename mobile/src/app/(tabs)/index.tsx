import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";

export default function RecordsScreen() {
  const { t } = useTranslation();
  return <Screen title={t("records.title")} />;
}
