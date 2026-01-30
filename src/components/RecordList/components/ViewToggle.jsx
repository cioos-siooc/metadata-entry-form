import React from 'react';
import { Box, IconButton, Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ViewModule, TableChart } from '@material-ui/icons';
import { useParams } from 'react-router-dom';
import { I18n } from '../../I18n';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: theme.spacing(1),
    gap: theme.spacing(0.5),
  },
  button: {
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    '&.active': {
      backgroundColor: theme.palette.action.selected,
    },
  },
}));

const ViewToggle = ({ viewMode, onToggle }) => {
  const classes = useStyles();
  const { language } = useParams();

  const tableLabel = language === 'fr' ? 'Tableau' : 'Table';
  const cardsLabel = language === 'fr' ? 'Cartes' : 'Cards';

  return (
    <Box className={classes.container}>
      <Tooltip title={<I18n en="Card view" fr="Vue en cartes" />}>
        <IconButton
          className={`${classes.button} ${viewMode === 'card' ? 'active' : ''}`}
          onClick={() => viewMode !== 'card' && onToggle()}
          aria-label={cardsLabel}
          size="small"
        >
          <ViewModule />
        </IconButton>
      </Tooltip>
      <Tooltip title={<I18n en="Table view" fr="Vue en tableau" />}>
        <IconButton
          className={`${classes.button} ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => viewMode !== 'table' && onToggle()}
          aria-label={tableLabel}
          size="small"
        >
          <TableChart />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ViewToggle;
