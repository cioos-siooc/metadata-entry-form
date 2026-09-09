import React, { useMemo } from "react";
import {
  Box,
  Card,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  EditNoteOutlined,
  HourglassTopOutlined,
  CheckCircleOutlineOutlined,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { I18n } from "../I18n";

function StatCard({ label, value, Icon, tone, loading }) {
  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        flex: 1,
        p: 2.5,
        borderRadius: 2,
        transition: theme.transitions.create(["transform", "box-shadow"], {
          duration: theme.transitions.duration.short,
        }),
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: theme.shadows[2],
        },
      })}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={(theme) => ({
            width: 42,
            height: 42,
            borderRadius: 2,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette[tone].main, 0.12),
            color: theme.palette[tone].main,
          })}
        >
          <Icon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="overline"
            sx={{
              color: "text.secondary",
              lineHeight: 1.2,
              letterSpacing: "0.06em",
              fontWeight: 600,
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontSize: "1.75rem",
              fontWeight: 700,
              lineHeight: 1.1,
              mt: 0.25,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {loading ? <Skeleton width={48} /> : value}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

export default function StatCards({ records, loading }) {
  const counts = useMemo(() => {
    const list = records || [];
    const byStatus = {
      draft: 0,
      submitted: 0,
      published: 0,
    };
    for (const r of list) {
      const status = r.status || "draft";
      if (status === "" || status === "draft") byStatus.draft += 1;
      else if (status === "submitted") byStatus.submitted += 1;
      else if (status === "published") byStatus.published += 1;
    }
    return byStatus;
  }, [records]);

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <StatCard
        label={<I18n en="Drafts" fr="Brouillons" />}
        value={counts.draft}
        Icon={EditNoteOutlined}
        tone="warning"
        loading={loading}
      />
      <StatCard
        label={<I18n en="In review" fr="En révision" />}
        value={counts.submitted}
        Icon={HourglassTopOutlined}
        tone="info"
        loading={loading}
      />
      <StatCard
        label={<I18n en="Published" fr="Publiés" />}
        value={counts.published}
        Icon={CheckCircleOutlineOutlined}
        tone="success"
        loading={loading}
      />
    </Stack>
  );
}
