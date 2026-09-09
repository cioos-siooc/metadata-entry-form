import React, { useMemo, useState } from "react";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Tooltip,
  Box,
} from "@mui/material";
import {
  HelpOutlineOutlined,
  FeedbackOutlined,
  NewReleasesOutlined,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import { I18n } from "../I18n";
import copyToClipboard from "../../utils/copyToClipboard";
import styles from "./styles";

// Help & Support group in the drawer footer. The click-to-copy email lives
// here rather than in NavDrawer so its state travels with the markup that
// uses it.
export default function HelpSubmenu({
  open,
  user,
  language,
  regionEmail,
  regionTitle,
  translations,
  feedbackButtonRef,
  onOpenWhatsNew,
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const contactLabel =
    language === "fr" ? "Contacter la région" : "Contact Region";

  const copyTooltip = useMemo(() => {
    if (copied) return language === "fr" ? "Copié !" : "Copied!";
    return language === "fr" ? "Cliquer pour copier" : "Click to copy";
  }, [copied, language]);

  const handleCopyEmail = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!regionEmail) return;
    copyToClipboard(regionEmail)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // no-op: copying failed
      });
  };

  const handleContactClick = (e) => {
    // A click on the email itself copies rather than opening a mail client.
    if (e?.target?.closest("[data-copy-email]")) {
      e.preventDefault();
      return;
    }
    const subject = encodeURIComponent(
      language === "fr"
        ? `Formulaire ${regionTitle} – Question`
        : `${regionTitle} Form – Question`
    );
    window.location.href = `mailto:${regionEmail}?subject=${subject}`;
  };

  const itemSx = [styles.navItem, { pl: open ? 2 : 1.5 }];

  return (
    <>
      <Tooltip
        placement="right-start"
        title={open ? "" : translations.helpSupport}
      >
        <ListItemButton
          sx={styles.navItem}
          onClick={() => setExpanded((v) => !v)}
        >
          <ListItemIcon>
            <HelpOutlineOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={translations.helpSupport} />
          {open && (expanded ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
      </Tooltip>

      <Collapse in={expanded} timeout="auto">
        <List
          component="div"
          disablePadding
          sx={{
            ml: open ? 2 : 0,
            pl: open ? 1 : 0,
            borderLeft: open ? 1 : 0,
            borderColor: "divider",
          }}
        >
          <Tooltip
            placement="right-start"
            title={
              open ? (
                ""
              ) : (
                <span>
                  {contactLabel}
                  {regionEmail ? ` — ${regionEmail}` : ""}
                </span>
              )
            }
          >
            <ListItemButton sx={itemSx} onClick={handleContactClick}>
              <ListItemIcon>
                <HelpOutlineOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={contactLabel}
                primaryTypographyProps={{ fontSize: "0.8125rem" }}
                secondary={
                  regionEmail ? (
                    <Tooltip title={copyTooltip} placement="right-start">
                      <Box
                        component="span"
                        data-copy-email="true"
                        onClick={handleCopyEmail}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleCopyEmail(e);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={
                          language === "fr"
                            ? "Copier l'adresse courriel"
                            : "Copy email address"
                        }
                        sx={{
                          textDecoration: "underline",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                        }}
                      >
                        {regionEmail}
                      </Box>
                    </Tooltip>
                  ) : null
                }
              />
            </ListItemButton>
          </Tooltip>

          <Tooltip
            placement="right-start"
            title={open ? "" : <I18n en="Feedback" fr="Commentaires" />}
          >
            <ListItemButton
              id="sentry-feedback-button"
              ref={feedbackButtonRef}
              sx={itemSx}
            >
              <ListItemIcon>
                <FeedbackOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={<I18n en="Feedback" fr="Commentaires" />}
                primaryTypographyProps={{ fontSize: "0.8125rem" }}
              />
            </ListItemButton>
          </Tooltip>

          {user && (
            <Tooltip
              placement="right-start"
              title={open ? "" : translations.whatsNew}
            >
              <ListItemButton sx={itemSx} onClick={onOpenWhatsNew}>
                <ListItemIcon>
                  <NewReleasesOutlined fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={translations.whatsNew}
                  primaryTypographyProps={{ fontSize: "0.8125rem" }}
                />
              </ListItemButton>
            </Tooltip>
          )}
        </List>
      </Collapse>
    </>
  );
}
