export const submissionsConfig = {
  pageId: 'submissions',
  storageKey: 'submissions-records',

  views: {
    allowToggle: true,
    persistViewPreference: true,
  },

  // Which columns to show in table view
  columns: ['status', 'progress', 'created', 'title'],

  // Default column visibility
  defaultColumnVisibility: {
    title: true,
    status: true,
    progress: true,
    created: true,
    actions: true,
  },

  // Card view field visibility
  cardFields: {
    showStatus: true,
    showProgress: true,
    showAuthor: false,
    showLastEdited: true,
    showUUID: true,
  },

  // Actions available on this page
  actions: {
    showViewAction: false,
    showEditAction: true,
    showDeleteAction: true,
    showCloneAction: true,
    showSubmitAction: true,
    showPublishAction: false,
    showUnPublishAction: false,
    showUnSubmitAction: false,
    showTransferButton: false,
    showDownloadButton: true,
    showGithubPublishAction: false,
  },

  // Table settings
  table: {
    pageSize: 20,
    rowsPerPageOptions: [10, 20, 50, 100],
    columnVisibilityStorageKey: 'submissions-column-visibility',
  },
};

export default submissionsConfig;
