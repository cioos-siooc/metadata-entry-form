import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";

export default function LibraryScreen() {
  const { t } = useTranslation();
  return <Screen title={t("library.title")} subtitle={t("library.subtitle")} />;
}
