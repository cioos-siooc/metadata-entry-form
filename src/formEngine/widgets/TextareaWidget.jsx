import React from "react";
import { Widgets } from "@rjsf/mui";

const { TextareaWidget: MuiTextareaWidget } = Widgets;

/**
 * Long-form text.
 *
 * Almost everything this needs is already handled: rjsf's TextareaWidget renders
 * through the registry's BaseInputTemplate, which is InputTemplate, so the width,
 * the single label, and the accessible name all arrive from there.
 *
 * What is left is the row floor. Three rows is what makes a textarea visibly a
 * place for more than a sentence — and setting `options.rows` doubles as the
 * signal InputTemplate reads to let prose have the full measure of its card
 * rather than a capped width.
 */
export default function TextareaWidget(props) {
  const { options = {} } = props;

  return (
    <MuiTextareaWidget
      {...props}
      options={{ ...options, rows: options.rows || 3 }}
    />
  );
}
