import React from "react";
import { Box, IconButton, Paper, Stack, Tooltip } from "@mui/material";
import {
  ArrowDownward,
  ArrowUpward,
  DeleteOutline,
} from "@mui/icons-material";

/**
 * One entry in a repeatable list: the input, then only the controls that entry
 * can actually use.
 *
 * rjsf's MUI item template gives every entry an elevated Paper and a stack of
 * bold text buttons in a fixed-width column. On a list of names that reads as
 * five nested boxes; on a narrow screen the column squeezes the input to nothing.
 *
 * An entry that is itself an object still gets a card, because there it really is
 * a small form and needs the separation. A scalar gets a plain row.
 */

const LABELS = {
  remove: { en: "Remove", fr: "Retirer" },
  moveUp: { en: "Move up", fr: "Monter" },
  moveDown: { en: "Move down", fr: "Descendre" },
};

export default function ListItemTemplate(props) {
  const {
    children,
    buttonsProps = {},
    hasToolbar,
    index,
    disabled,
    readonly,
    schema = {},
    registry,
  } = props;

  const language = registry?.formContext?.language === "fr" ? "fr" : "en";
  const label = (key) => LABELS[key][language] || LABELS[key].en;
  const locked = disabled || readonly;

  const {
    hasRemove,
    hasMoveUp,
    hasMoveDown,
    onRemoveItem,
    onMoveUpItem,
    onMoveDownItem,
  } = buttonsProps;

  const control = (key, icon, onClick, enabled) =>
    enabled ? (
      <Tooltip title={label(key)}>
        <IconButton
          aria-label={`${label(key)} ${index + 1}`}
          onClick={onClick}
          disabled={locked}
          size="small"
        >
          {icon}
        </IconButton>
      </Tooltip>
    ) : null;

  const isObjectItem = schema.type === "object" || schema.type === "array";

  const row = (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="flex-start"
      sx={{ mb: isObjectItem ? 0 : 1 }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
      {hasToolbar && (
        <Stack
          direction="row"
          spacing={0}
          // Nudged onto the input's centre line; a bare flex row would pin the
          // buttons to its top edge.
          sx={{ mt: 0.75, flexShrink: 0 }}
        >
          {control("moveUp", <ArrowUpward fontSize="small" />, onMoveUpItem, hasMoveUp)}
          {control(
            "moveDown",
            <ArrowDownward fontSize="small" />,
            onMoveDownItem,
            hasMoveDown
          )}
          {control("remove", <DeleteOutline fontSize="small" />, onRemoveItem, hasRemove)}
        </Stack>
      )}
    </Stack>
  );

  if (!isObjectItem) return row;

  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
      {row}
    </Paper>
  );
}
