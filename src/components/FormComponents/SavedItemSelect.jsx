import React, { useState } from "react";
import { Autocomplete, InputAdornment, TextField } from "@mui/material";
import { Search } from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { deepCopy } from "../../utils/misc";

// "Add a saved contact / platform / instrument": type to find one of the
// user's library items and copy it into the record. `itemTitle` may return an
// element for blank entries; those sort first and match no search text.
export default function SavedItemSelect({
  savedItems,
  itemTitle,
  getBlankItem,
  onAdd,
  ariaLabel,
  disabled,
}) {
  const { language } = useParams();
  const fr = language === "fr";
  const [input, setInput] = useState("");

  const titleText = (item) => {
    const title = itemTitle(item);
    return typeof title === "string" ? title : "";
  };
  const list = Object.values(savedItems || {}).sort((a, b) =>
    titleText(a).localeCompare(titleText(b)),
  );

  return (
    <Autocomplete
      options={list}
      value={null}
      inputValue={input}
      onInputChange={(_e, value, reason) =>
        reason !== "reset" && setInput(value)
      }
      onChange={(_e, saved) => {
        if (!saved) return;
        // A saved item never carries a role into a new record.
        const { role, ...item } = saved;
        onAdd(deepCopy({ ...getBlankItem(), ...item }));
        setInput("");
      }}
      getOptionLabel={titleText}
      renderOption={({ key, ...props }, item) => (
        <li key={key} {...props}>
          {itemTitle(item)}
        </li>
      )}
      disabled={disabled || !list.length}
      blurOnSelect
      noOptionsText={fr ? "Aucun résultat" : "No matches"}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={ariaLabel}
          inputProps={{ ...params.inputProps, "aria-label": ariaLabel }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start" sx={{ ml: 0.5 }}>
                <Search fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />
      )}
    />
  );
}
