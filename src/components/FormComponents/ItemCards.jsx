import React, { useId, useRef, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  CheckCircle,
  ContentCopy,
  DeleteOutline,
  DragIndicator,
  ExpandMore,
  MoreVert,
  ErrorOutline,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import {
  SortableList,
  SortableItem,
  DragHandle,
  arrayMove,
  useStableItemIds,
} from "./SortableList";
import { deepCopy } from "../../utils/misc";

// The repeatable items of a record (contacts, resources, related works,
// lineage, platforms, instruments) as one list you can scan: each row says
// what the item is and whether it's complete. Opening a row expands its
// editor in place, full width, one at a time; "Done" folds it back. Adding an
// item opens it straight away. Removing one can be undone.
//
// Open state is controlled (`openIndex` / `setOpenIndex`) because the editors
// update "the open item" by index.
export default function ItemCards({
  items,
  updateItems,
  openIndex,
  setOpenIndex,
  itemTitle,
  itemMeta,
  isComplete,
  renderEditor,
  getBlankItem,
  duplicateItem = deepCopy,
  // Off for items added elsewhere (taxa come from a search), or that make
  // no sense twice.
  allowDuplicate = true,
  menuItems,
  sortable = true,
  numbered = false,
  disabled,
  addLabel,
  footer,
  emptyText,
  itemNoun,
  ariaLabel,
  idPrefix = "item",
}) {
  const { language } = useParams();
  const fr = language === "fr";
  const t = (en, frText) => (fr ? frText : en);
  const baseId = useId();
  const getItemId = useStableItemIds(idPrefix);
  const headerRefs = useRef({});
  const [menu, setMenu] = useState(null); // { anchor, index }
  const [removed, setRemoved] = useState(null); // { item, index }

  const noun = itemNoun || { en: "item", fr: "élément" };
  // Titles can be elements (an <I18n> placeholder); messages need text.
  const titleText = (item) => {
    const title = itemTitle(item);
    return typeof title === "string" && title
      ? title
      : t("Untitled", "Sans titre");
  };
  const canReorder = sortable && !disabled && items.length > 1;

  const focusHeader = (id) =>
    requestAnimationFrame(() => {
      const el = headerRefs.current[id];
      if (!el) return;
      el.focus({ preventScroll: true });
      el.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    });

  const toggle = (i) => {
    const next = openIndex === i ? null : i;
    setOpenIndex(next);
    if (next !== null) focusHeader(getItemId(items[i], i));
  };

  const close = (i) => {
    setOpenIndex(null);
    focusHeader(getItemId(items[i], i));
  };

  // Appends an item and opens it. Also handed to `footer` (e.g. a picker of
  // saved items) as its way to add one.
  const addItem = (item) => {
    updateItems(items.concat(item));
    setOpenIndex(items.length);
    focusHeader(getItemId(item, items.length));
  };

  const duplicate = (i) => {
    const copy = duplicateItem(deepCopy(items[i]));
    updateItems(items.concat(copy));
    setOpenIndex(items.length);
    focusHeader(getItemId(copy, items.length));
  };

  const remove = (i) => {
    setRemoved({ item: items[i], index: i });
    updateItems(items.filter((_, index) => index !== i));
    if (openIndex === i) setOpenIndex(null);
    else if (openIndex !== null && openIndex > i) setOpenIndex(openIndex - 1);
  };

  const undoRemove = () => {
    if (!removed) return;
    const next = [...items];
    next.splice(removed.index, 0, removed.item);
    updateItems(next);
    if (openIndex !== null && openIndex >= removed.index)
      setOpenIndex(openIndex + 1);
    setRemoved(null);
  };

  const onDrop = ({ removedIndex: from, addedIndex: to }) => {
    if (openIndex !== null) {
      if (from === openIndex) setOpenIndex(to);
      else if (from < openIndex && to >= openIndex) setOpenIndex(openIndex - 1);
      else if (from > openIndex && to <= openIndex) setOpenIndex(openIndex + 1);
    }
    updateItems(arrayMove(items, from, to));
  };

  const rows = items.map((item, i) => {
    const id = getItemId(item, i);
    const open = openIndex === i;
    const position = i + 1;
    const title = itemTitle(item) || t("Untitled", "Sans titre");
    const meta = itemMeta?.(item);
    const complete = isComplete ? isComplete(item) : null;
    const headerId = `${baseId}-${id}-header`;
    const panelId = `${baseId}-${id}-panel`;

    return (
      <SortableItem
        key={id}
        id={id}
        sx={(theme) => ({
          "& + &": { borderTop: `1px solid ${theme.vars.palette.divider}` },
        })}
      >
        <Box
          sx={(theme) => ({
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            pl: canReorder ? 0.5 : 1,
            pr: 1,
            bgcolor: open ? theme.vars.palette.primarySurface : "transparent",
          })}
        >
          {canReorder && (
            <Tooltip
              title={t("Drag to reorder", "Faites glisser pour réorganiser")}
            >
              <DragHandle>
                <IconButton
                  size="small"
                  aria-label={t(
                    `Reorder ${noun.en} ${position}`,
                    `Réorganiser : ${noun.fr} ${position}`,
                  )}
                  sx={{ color: "text.secondary" }}
                >
                  <DragIndicator fontSize="small" />
                </IconButton>
              </DragHandle>
            </Tooltip>
          )}

          <Box
            component="button"
            type="button"
            id={headerId}
            ref={(el) => {
              headerRefs.current[id] = el;
            }}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => toggle(i)}
            sx={(theme) => ({
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              minHeight: 56,
              py: 1,
              px: 1,
              border: 0,
              borderRadius: 1,
              bgcolor: "transparent",
              color: "text.primary",
              font: "inherit",
              textAlign: "left",
              cursor: "pointer",
              "&:hover .itemcards-title": { color: "primaryText" },
              "&:focus-visible": {
                outline: `2px solid ${theme.vars.palette.primaryText}`,
                outlineOffset: -2,
              },
            })}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                component="span"
                className="itemcards-title"
                sx={{
                  display: "block",
                  fontWeight: 600,
                  overflowWrap: "break-word",
                }}
              >
                {numbered && `${position}. `}
                {title}
              </Typography>
              {meta && (
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    display: "block",
                    color: "text.secondary",
                    overflowWrap: "break-word",
                  }}
                >
                  {meta}
                </Typography>
              )}
              {/* Phones: the status goes under the summary so the title
                  keeps the width. Only one copy is ever displayed. */}
              {complete !== null && (
                <ItemStatus
                  complete={complete}
                  fr={fr}
                  sx={{ display: { xs: "flex", sm: "none" }, mt: 0.5 }}
                />
              )}
            </Box>
            {complete !== null && (
              <ItemStatus
                complete={complete}
                fr={fr}
                sx={{ display: { xs: "none", sm: "flex" } }}
              />
            )}
            <ExpandMore
              aria-hidden
              sx={(theme) => ({
                color: "text.secondary",
                transition: theme.transitions.create("transform", {
                  duration: theme.transitions.duration.shortest,
                }),
                transform: open ? "rotate(180deg)" : "none",
              })}
            />
          </Box>

          <IconButton
            size="small"
            aria-label={t(
              `More actions for ${noun.en} ${position}`,
              `Autres actions : ${noun.fr} ${position}`,
            )}
            aria-haspopup="menu"
            onClick={(e) => setMenu({ anchor: e.currentTarget, index: i })}
            disabled={disabled}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>

        {open && (
          <Box
            id={panelId}
            role="region"
            aria-labelledby={headerId}
            sx={{
              px: { xs: 2, sm: 3 },
              pt: 2,
              pb: 2.5,
            }}
          >
            {renderEditor(item, i)}
            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={() => close(i)}>
                {t("Done", "Terminé")}
              </Button>
            </Stack>
          </Box>
        )}
      </SortableItem>
    );
  });

  const menuIndex = menu?.index;
  const menuItem = menuIndex !== undefined ? items[menuIndex] : null;

  const actions = (getBlankItem || footer) && (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      alignItems={{ xs: "stretch", sm: "center" }}
      sx={{ mt: 1.5 }}
    >
      {getBlankItem && (
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => addItem(getBlankItem())}
          disabled={disabled}
          sx={{ flexShrink: 0 }}
        >
          {addLabel}
        </Button>
      )}
      {footer && (
        <Box sx={{ flex: 1, minWidth: 0, maxWidth: 360 }}>
          {typeof footer === "function" ? footer(addItem) : footer}
        </Box>
      )}
    </Stack>
  );

  return (
    // Full width even as a flex child (the lineage sub-editors sit in one).
    <Box sx={{ width: "100%", minWidth: 0 }}>
      {items.length > 0 ? (
        <Box
          sx={(theme) => ({
            border: `1px solid ${theme.vars.palette.divider}`,
            borderRadius: 1.5,
            bgcolor: "background.paper",
            overflow: "hidden",
          })}
        >
          <SortableList items={items} onDrop={onDrop} getItemId={getItemId}>
            <Box
              component="ul"
              aria-label={ariaLabel}
              sx={{ listStyle: "none", m: 0, p: 0 }}
            >
              {rows}
            </Box>
          </SortableList>
        </Box>
      ) : (
        emptyText && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {emptyText}
          </Typography>
        )
      )}

      {actions}

      <Menu
        anchorEl={menu?.anchor}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {allowDuplicate && (
          <MenuItem
            onClick={() => {
              setMenu(null);
              duplicate(menuIndex);
            }}
          >
            <ListItemIcon>
              <ContentCopy fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t("Duplicate", "Dupliquer")}</ListItemText>
          </MenuItem>
        )}
        {menuItem &&
          menuItems?.(menuItem, menuIndex).map(
            ({ key, label, icon: Icon, onClick, disabled: off }) => (
              <MenuItem
                key={key}
                disabled={off}
                onClick={() => {
                  setMenu(null);
                  onClick();
                }}
              >
                <ListItemIcon>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{label}</ListItemText>
              </MenuItem>
            ),
          )}
        <MenuItem
          onClick={() => {
            setMenu(null);
            remove(menuIndex);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "error.main" }}>
            <DeleteOutline fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {t("Remove from this record", "Retirer de cet enregistrement")}
          </ListItemText>
        </MenuItem>
      </Menu>

      <Snackbar
        open={Boolean(removed)}
        autoHideDuration={8000}
        onClose={(_e, reason) => reason !== "clickaway" && setRemoved(null)}
        message={
          removed &&
          t(
            `Removed “${titleText(removed.item)}”`,
            `« ${titleText(removed.item)} » retiré`,
          )
        }
        action={
          <Button
            color="inherit"
            size="small"
            onClick={undoRemove}
            sx={{ color: "inherit" }}
          >
            {t("Undo", "Annuler")}
          </Button>
        }
      />
    </Box>
  );
}

// Text plus icon, never colour alone.
function ItemStatus({ complete, fr, sx }) {
  return complete ? (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      sx={{ color: "success.main", flexShrink: 0, ...sx }}
    >
      <CheckCircle sx={{ fontSize: 18 }} aria-hidden />
      <Typography component="span" variant="body2" sx={{ fontWeight: 500 }}>
        {fr ? "Complet" : "Complete"}
      </Typography>
    </Stack>
  ) : (
    <Stack
      direction="row"
      spacing={0.5}
      alignItems="center"
      sx={{ color: "warning.main", flexShrink: 0, ...sx }}
    >
      <ErrorOutline sx={{ fontSize: 18 }} aria-hidden />
      <Typography component="span" variant="body2" sx={{ fontWeight: 500 }}>
        {fr ? "À compléter" : "Incomplete"}
      </Typography>
    </Stack>
  );
}
