import React from "react";
import {
  Box,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Search, Close } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import { I18n } from "../I18n";

export default function RegionSearch({
  value,
  onChange,
  resultCount,
  language,
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <TextField
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          language === "fr"
            ? "Rechercher une région ou organisation…"
            : "Search regions or organizations…"
        }
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" sx={{ color: "text.secondary" }} />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => onChange("")}
                aria-label="Clear search"
              >
                <Close fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
        sx={{
          maxWidth: 520,
          "& .MuiOutlinedInput-root": {
            bgcolor: "background.paper",
          },
        }}
      />
      {value && (
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mt: 1, ml: 0.5 }}
        >
          {resultCount === 1 ? (
            <I18n en="1 match" fr="1 résultat" />
          ) : (
            <>
              {resultCount}{" "}
              <I18n en="matches" fr="résultats" />
            </>
          )}
        </Typography>
      )}
    </Box>
  );
}
