// The scopes of the Records page a user can switch between, in display order.
// Shared by the page's scope switch and the sidebar's sub-items so both offer
// (and label) the same set.
export default function recordScopes({ hasSharedRecords, canReview }) {
  return [
    { value: "mine", en: "My records", fr: "Mes enregistrements" },
    hasSharedRecords && {
      value: "shared",
      en: "Shared with me",
      fr: "Partagés avec moi",
    },
    canReview
      ? { value: "region", en: "Whole region", fr: "Toute la région" }
      : {
          value: "region",
          en: "Published in region",
          fr: "Publiés dans la région",
        },
  ].filter(Boolean);
}
