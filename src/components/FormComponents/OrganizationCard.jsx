import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Box,
} from "@material-ui/core";
import { Edit, Language, OpenInNew } from "@material-ui/icons";
import { I18n } from "../I18n";

const OrganizationCard = ({ organization, language, canEdit, onEdit }) => {
  const title = organization.title_translated?.[language] || organization.title || "Untitled";
  const description = organization.description_translated?.[language] || organization.description || "";
  // Prefer translated image URL for current language; fallback to english then legacy single field
  const imageUrl = organization.image_url_translated?.[language]
    || organization.image_url_translated?.en
    || organization.image_url
    || "";
  const externalUrl = organization.external_home_url || "";
  const aliases = organization.aliases || [];
  // CKAN instance removed; any legacy value is intentionally ignored.

  // Truncate description for card view
  const truncateText = (text, maxLength = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  // NOTE: Card previously used grid "cells" for layout; reverted to simple stacked layout per request.

  return (
    <Card style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {imageUrl && (
        <CardMedia
          component="img"
          height="140"
          image={imageUrl}
          alt={title}
          style={{ objectFit: "contain", padding: "10px", backgroundColor: "#f5f5f5" }}
          onError={(e) => {
            // Hide image if it fails to load
            e.target.style.display = "none";
          }}
        />
      )}
      <CardContent style={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography
          variant="caption"
          gutterBottom
          style={{ color: '#1976d2', fontWeight: 600, letterSpacing: 0.5 }}
        >
          {organization.name}
        </Typography>
        {(organization.address || organization.city || organization.country) && (
          <Typography variant="caption" color="textSecondary" style={{ display: 'block' }}>
            {[organization.address, organization.city, organization.country].filter(Boolean).join(', ')}
          </Typography>
        )}
        {organization.email && (
          <Typography variant="caption" style={{ display: 'block' }}>
            <a href={`mailto:${organization.email}`} style={{ color: '#1976d2', textDecoration: 'none' }}>
              {organization.email}
            </a>
          </Typography>
        )}
        <Typography variant="body2" color="textSecondary" paragraph>
          {truncateText(description)}
        </Typography>
        {aliases && aliases.length > 0 && (
          <Box marginTop={1}>
            <Typography variant="caption" color="textSecondary">
              <I18n en="Aliases:" fr="Alias :" />
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5} marginTop={0.5}>
              {aliases.map((alias, index) => (
                <Chip key={index} label={alias} size="small" style={{ margin: "2px" }} />
              ))}
            </Box>
          </Box>
        )}
        {/* CKAN instance display removed */}
      </CardContent>
      <CardActions>
        {externalUrl && (
          <Tooltip title={<I18n en="Visit website" fr="Visiter le site web" />}>
            <IconButton
              size="small"
              onClick={() => {
                window.open(externalUrl, "_blank");
              }}
            >
              <Language />
            </IconButton>
          </Tooltip>
        )}
        {/* Show ROR link only if a valid ROR code exists; placed to the left of Edit */}
        {(() => {
          const rorCode = organization["organization-uri"]?.[0]?.code || "";
          const isRor = rorCode.toLowerCase().includes("ror.org/");
          if (!isRor) return null;
          return (
            <Tooltip title={<I18n en="View ROR" fr="Voir ROR" />}>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(rorCode, "_blank");
                }}
              >
                <OpenInNew />
              </IconButton>
            </Tooltip>
          );
        })()}
        {canEdit && (
          <Tooltip title={<I18n en="Edit organization" fr="Modifier l'organisation" />}>
            <IconButton size="small" color="primary" onClick={onEdit}>
              <Edit />
            </IconButton>
          </Tooltip>
        )}
        <Box flexGrow={1} />
      </CardActions>
    </Card>
  );
};

export default OrganizationCard;
