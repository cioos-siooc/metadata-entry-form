import { createContext, useContext } from 'react';

export const RecordListContext = createContext({
  config: null,
  actionHandlers: {},
  language: 'en',
  region: '',
  githubPublishEnabled: false,
});

export const RecordListProvider = RecordListContext.Provider;

export const useRecordListContext = () => {
  const context = useContext(RecordListContext);
  if (!context) {
    throw new Error('useRecordListContext must be used within a RecordListProvider');
  }
  return context;
};
