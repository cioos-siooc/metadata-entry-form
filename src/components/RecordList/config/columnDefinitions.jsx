import React from 'react';
import { Chip } from '@material-ui/core';
import regions from '../../../regions';
import licenses from '../../../utils/licenses';
import { percentValid } from '../../../utils/validate';

// Helper to get status color
export const getStatusColor = (status, region) => {
  const regionColor = regions[region]?.colors?.primary || '#006e90';
  switch (status) {
    case 'published':
      return regionColor;
    case 'submitted':
      return '#f57c00';
    default:
      return '#757575';
  }
};

// Helper to get status label
export const getStatusLabel = (status, language) => {
  const labels = {
    published: { en: 'Published', fr: 'Publié' },
    submitted: { en: 'Submitted', fr: 'Soumis' },
    '': { en: 'Draft', fr: 'Brouillon' },
  };
  return labels[status]?.[language] || labels[''][language];
};

// Helper to format date
export const formatDate = (dateStr, language) => {
  if (!dateStr) return '';
  const dateObj = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - dateObj.getTime();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

  if (diffMs > twoDaysMs) {
    const options = { year: 'numeric', month: 'short', day: '2-digit' };
    return dateObj.toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', options);
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 24) {
    return language === 'en'
      ? `${hours} hour${hours !== 1 ? 's' : ''} ago`
      : `il y a ${hours} heure${hours !== 1 ? 's' : ''}`;
  }

  const days = Math.floor(hours / 24);
  return language === 'en'
    ? `${days} day${days !== 1 ? 's' : ''} ago`
    : `il y a ${days} jour${days !== 1 ? 's' : ''}`;
};

// Column definitions factory - creates columns with current language
export const createColumns = (language, region) => ({
  status: {
    field: 'status',
    headerName: language === 'en' ? 'Status' : 'Statut',
    flex: 1,
    minWidth: 130,
    maxWidth: 130,
    headerAlign: 'center',
    align: 'center',
    type: 'singleSelect',
    valueOptions: [
      { value: '', label: language === 'en' ? 'Draft' : 'Brouillon' },
      { value: 'submitted', label: language === 'en' ? 'Submitted' : 'Soumis' },
      { value: 'published', label: language === 'en' ? 'Published' : 'Publié' },
    ],
    renderCell: (params) => {
      const bgColor = getStatusColor(params.value, params.row.region || region);
      const label = getStatusLabel(params.value, language);
      return (
        <Chip
          label={label}
          size="small"
          style={{
            backgroundColor: bgColor,
            color: '#ffffff',
            fontWeight: 500,
          }}
        />
      );
    },
    filterOperators: [
      {
        label: language === 'en' ? 'is any of' : "est l'un de",
        value: 'isAnyOf',
        getApplyFilterFn: (filterItem) => {
          if (!filterItem.value || filterItem.value.length === 0) {
            return null;
          }
          return (params) => filterItem.value.includes(params.value);
        },
        InputComponent: ({ item, applyValue }) => {
          const handleFilterChange = (value) => {
            applyValue({ ...item, value });
          };

          return (
            <div style={{ padding: '8px' }}>
              {[
                { value: '', label: language === 'en' ? 'Draft' : 'Brouillon' },
                { value: 'submitted', label: language === 'en' ? 'Submitted' : 'Soumis' },
                { value: 'published', label: language === 'en' ? 'Published' : 'Publié' },
              ].map((option) => {
                const checkboxId = `status-filter-${option.value}`;
                return (
                  <div key={option.value} style={{ marginBottom: '4px' }}>
                    <label
                      htmlFor={checkboxId}
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <input
                        id={checkboxId}
                        type="checkbox"
                        checked={(item.value || []).includes(option.value)}
                        onChange={(e) => {
                          const currentValues = item.value || [];
                          const newValues = e.target.checked
                            ? [...currentValues, option.value]
                            : currentValues.filter((v) => v !== option.value);
                          handleFilterChange(newValues);
                        }}
                        style={{ marginRight: '8px' }}
                      />
                      {option.label}
                    </label>
                  </div>
                );
              })}
            </div>
          );
        },
      },
    ],
  },

  progress: {
    field: 'progress',
    headerName: language === 'en' ? 'Progress' : 'Progrès',
    flex: 0.8,
    maxWidth: 90,
    type: 'number',
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => `${params.value}%`,
  },

  created: {
    field: 'created',
    headerName: language === 'en' ? 'Last Edited' : 'Dernière modification',
    flex: 1.2,
    maxWidth: 130,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => {
      if (!params.value) return null;
      return <span>{formatDate(params.value, language)}</span>;
    },
    sortComparator: (v1, v2) => {
      const date1 = v1 ? new Date(v1).getTime() : 0;
      const date2 = v2 ? new Date(v2).getTime() : 0;
      return date1 - date2;
    },
  },

  title: {
    field: 'title',
    headerName: language === 'en' ? 'Title' : 'Titre',
    flex: 2,
    minWidth: 200,
  },

  author: {
    field: 'author',
    headerName: language === 'en' ? 'Author' : 'Auteur',
    flex: 1.5,
    minWidth: 180,
  },

  abstract: {
    field: 'abstract',
    headerName: language === 'en' ? 'Abstract' : 'Résumé',
    flex: 2,
    minWidth: 200,
    renderCell: (params) => (
      <div
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={params.value}
      >
        {params.value}
      </div>
    ),
  },

  license: {
    field: 'license',
    headerName: language === 'en' ? 'License' : 'Licence',
    flex: 1,
    minWidth: 150,
    renderCell: (params) => {
      const licenseData = licenses[params.value];
      if (!licenseData) return params.value || '';
      return licenseData.title?.[language] || licenseData.title?.en || params.value;
    },
  },

  verticalExtentMin: {
    field: 'verticalExtentMin',
    headerName: language === 'en' ? 'Vertical Min' : 'Étendue verticale min',
    flex: 0.8,
    minWidth: 100,
    type: 'number',
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => {
      if (params.value === undefined || params.value === null) return '';
      return params.value;
    },
  },

  verticalExtentMax: {
    field: 'verticalExtentMax',
    headerName: language === 'en' ? 'Vertical Max' : 'Étendue verticale max',
    flex: 0.8,
    minWidth: 100,
    type: 'number',
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => {
      if (params.value === undefined || params.value === null) return '';
      return params.value;
    },
  },

  contacts: {
    field: 'contacts',
    headerName: language === 'en' ? 'Contacts' : 'Contacts',
    flex: 1.5,
    minWidth: 200,
    sortable: false,
    renderCell: (params) => {
      const contactsList = params.value || [];
      if (contactsList.length === 0) return '';
      const contactNames = contactsList
        .map((c) => {
          if (c.givenNames || c.lastName) {
            return `${c.givenNames || ''} ${c.lastName || ''}`.trim();
          }
          return c.orgName || '';
        })
        .filter(Boolean);
      const displayText = contactNames.join(', ');
      return (
        <div
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={displayText}
        >
          {displayText}
        </div>
      );
    },
  },

  formLanguage: {
    field: 'formLanguage',
    headerName: language === 'en' ? 'Form Language' : 'Langue du formulaire',
    flex: 0.8,
    minWidth: 100,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => {
      if (!params.value) return '';
      if (params.value === 'en') return 'English';
      if (params.value === 'fr') return 'Français';
      return params.value;
    },
  },
});

// Transform record to row data for DataGrid
export const recordToRow = (record, language, index) => ({
  id: record.recordID || index,
  recordID: record.recordID,
  userID: record.userinfo?.userID,
  title: record.title?.[language] || '',
  status: record.status || '',
  author: record.userinfo?.email || '',
  progress: Math.round(percentValid(record) * 100),
  created: record.created,
  region: record.region,
  abstract: record.abstract?.[language] || '',
  license: record.license || '',
  verticalExtentMin: record.verticalExtentMin,
  verticalExtentMax: record.verticalExtentMax,
  verticalExtentDirection: record.verticalExtentDirection,
  contacts: record.contacts || [],
  formLanguage: record.language || '',
  fullRecord: record,
});
