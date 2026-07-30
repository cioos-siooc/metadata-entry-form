import { useTranslation } from "react-i18next";

import { Screen } from "@/components/Screen";

export default function ReviewScreen() {
  const { t } = useTranslation();
  return <Screen title={t("review.title")} subtitle={t("review.subtitle")} />;
}
