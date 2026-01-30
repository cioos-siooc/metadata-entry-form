import React, { createContext, useContext } from 'react';

const RecordListContext = createContext({
  config: null,
  actionHandlers: {},
  language: 'en',
  region: '',
});

export const RecordListProvider = ({ children, value }) => {
  return (
    <RecordListContext.Provider value={value}>
      {children}
    </RecordListContext.Provider>
  );
};

export const useRecordListContext = () => {
  const context = useContext(RecordListContext);
  if (!context) {
    throw new Error('useRecordListContext must be used within a RecordListProvider');
  }
  return context;
};

export default RecordListContext;
