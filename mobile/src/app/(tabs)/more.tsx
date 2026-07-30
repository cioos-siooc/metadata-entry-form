import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";

export default function MoreScreen() {
  const { t } = useTranslation();
  return <Screen title={t("more.title")} />;
}
