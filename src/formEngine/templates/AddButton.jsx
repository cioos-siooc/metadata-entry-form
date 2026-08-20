import React from "react";
import { Button } from "@mui/material";
import { Add } from "@mui/icons-material";

import { I18n } from "../../components/I18n";

/**
 * The "add another" control on a repeatable field.
 *
 * rjsf-mui's default is a bare icon button with no text. On an array that has no
 * rows yet — which is every array on a new record — that renders as an empty
 * card with a small `+` floating in it, and nobody can tell what it adds. A
 * labelled button says what will happen.
 */
export default function AddButton({ onClick, disabled, className, id }) {
  return (
    <Button
      id={id}
      className={className}
      onClick={onClick}
      disabled={disabled}
      startIcon={<Add />}
      size="small"
      variant="outlined"
    >
      <I18n en="Add" fr="Ajouter" />
    </Button>
  );
}
