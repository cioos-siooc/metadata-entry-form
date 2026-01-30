export const reviewerConfig = {
  pageId: 'reviewer',
  storageKey: 'reviewer-records',

  views: {
    allowToggle: true,
    persistViewPreference: true,
  },

  // Which columns to show in table view
  columns: [
    'status',
    'progress',
    'created',
    'title',
    'author',
    'abstract',
    'license',
    'verticalExtentMin',
    'verticalExtentMax',
    'contacts',
    'formLanguage',
  ],

  // Default column visibility
  defaultColumnVisibility: {
    title: true,
    status: true,
    author: true,
    progress: true,
    created: true,
    abstract: false,
    license: false,
    verticalExtentMin: false,
    verticalExtentMax: false,
    contacts: false,
    formLanguage: false,
    actions: true,
  },

  // Card view field visibility
  cardFields: {
    showStatus: true,
    showProgress: true,
    showAuthor: true,
    showLastEdited: true,
    showUUID: true,
  },

  // Actions available on this page
  actions: {
    showViewAction: false,
    showEditAction: true,
    showDeleteAction: true,
    showCloneAction: true,
    showSubmitAction: false,
    showPublishAction: true,
    showUnPublishAction: true,
    showUnSubmitAction: true,
    showTransferButton: true,
    showDownloadButton: false,
    showGithubPublishAction: true,
  },

  // Table settings
  table: {
    pageSize: 20,
    rowsPerPageOptions: [10, 20, 50, 100],
    columnVisibilityStorageKey: 'reviewer-column-visibility',
  },
};

export default reviewerConfig;
