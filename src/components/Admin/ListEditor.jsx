import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, Close } from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { validateEmail } from "../../utils/validate";

// An editable list of short values (reviewer emails, project names). Each add
// or remove is handed to `onChange` straight away and saved by the caller, so
// there is no separate Save step to forget. Pasting a comma- or line-separated
// list adds every entry at once.
export default function ListEditor({
  items,
  onChange,
  label,
  placeholder,
  email = false,
  protectedItem,
  protectedNote,
  emptyText,
}) {
  const { language } = useParams();
  const fr = language === "fr";
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  // Stored as typed (some permission checks are case-sensitive); compared
  // case-insensitively so the same address is never listed twice.
  const norm = (v) => v.trim().toLowerCase();

  const add = () => {
    const entries = draft
      .split(/[\n,;]+/)
      .map((v) => v.trim())
      .filter(Boolean);
    if (!entries.length) return;
    const invalid = email ? entries.filter((e) => !validateEmail(e)) : [];
    if (invalid.length) {
      setError(
        fr
          ? `Adresse courriel invalide : ${invalid.join(", ")}`
          : `Not a valid email address: ${invalid.join(", ")}`,
      );
      return;
    }
    const seen = new Set(items.map(norm));
    const fresh = entries.filter((e) => {
      if (seen.has(norm(e))) return false;
      seen.add(norm(e));
      return true;
    });
    if (!fresh.length) {
      setError(fr ? "Déjà dans la liste." : "Already in the list.");
      return;
    }
    onChange([...items, ...fresh]);
    setDraft("");
    setError("");
  };

  const remove = (value) => onChange(items.filter((i) => i !== value));

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", sm: "flex-start" }}
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <TextField
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError("");
          }}
          placeholder={placeholder}
          size="small"
          fullWidth
          error={Boolean(error)}
          helperText={error || undefined}
          slotProps={{ htmlInput: { "aria-label": label } }}
          sx={{ maxWidth: { sm: 440 } }}
        />
        <Button
          type="submit"
          variant="outlined"
          startIcon={<Add />}
          disabled={!draft.trim()}
          sx={{ flexShrink: 0, height: 40 }}
        >
          {fr ? "Ajouter" : "Add"}
        </Button>
      </Stack>

      {items.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 2 }}>
          {emptyText}
        </Typography>
      ) : (
        <List
          dense
          disablePadding
          aria-label={label}
          sx={(theme) => ({
            mt: 2,
            border: `1px solid ${theme.vars.palette.divider}`,
            borderRadius: 1.5,
            overflow: "hidden",
          })}
        >
          {items.map((item, i) => {
            const isProtected =
              protectedItem && norm(item) === norm(protectedItem);
            return (
              <ListItem
                key={item}
                divider={i < items.length - 1}
                secondaryAction={
                  isProtected ? undefined : (
                    <Tooltip title={fr ? "Retirer" : "Remove"}>
                      <IconButton
                        edge="end"
                        size="small"
                        aria-label={`${fr ? "Retirer" : "Remove"} ${item}`}
                        onClick={() => remove(item)}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )
                }
                sx={{ py: 0.75, pl: 2 }}
              >
                <ListItemText
                  primary={
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                        wordBreak: "break-all",
                      }}
                    >
                      {item}
                      {isProtected && (
                        <Tooltip title={protectedNote || ""}>
                          <Chip size="small" label={fr ? "vous" : "you"} />
                        </Tooltip>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
}
