export const publishedConfig = {
  pageId: 'published',
  storageKey: 'published-records',

  views: {
    allowToggle: true,
    persistViewPreference: true,
  },

  // Which columns to show in table view
  columns: ['status', 'created', 'title', 'author'],

  // Default column visibility
  defaultColumnVisibility: {
    title: true,
    status: true,
    author: true,
    created: true,
    actions: true,
  },

  // Card view field visibility
  cardFields: {
    showStatus: true,
    showProgress: false,
    showAuthor: true,
    showLastEdited: true,
    showUUID: true,
  },

  // Actions available on this page
  actions: {
    showViewAction: true,
    showEditAction: false,
    showDeleteAction: false,
    showCloneAction: true,
    showSubmitAction: false,
    showPublishAction: false,
    showUnPublishAction: false,
    showUnSubmitAction: false,
    showTransferButton: false,
    showDownloadButton: false,
    showGithubPublishAction: false,
  },

  // Table settings
  table: {
    pageSize: 20,
    rowsPerPageOptions: [10, 20, 50, 100],
    columnVisibilityStorageKey: 'published-column-visibility',
  },
};

export default publishedConfig;
