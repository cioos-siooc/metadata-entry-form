import { depthDirections } from "@cioos/shared/isoCodeLists.js";
import { localized } from "@cioos/shared/localized.js";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChoiceInput, type Choice } from "@/components/fields/ChoiceInput";
import { Field } from "@/components/fields/Field";
import { MapSelect } from "@/components/fields/MapSelect";
import type { MapValue } from "@/components/fields/mapValue";
import { TextInput } from "@/components/fields/TextInput";
import type { Language } from "@/i18n";
import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

import type { SectionProps } from "./types";

/**
 * Where — a map, coordinates and vertical extent.
 *
 * Three ways in, all writing the same `map` object, because they suit different
 * moments: sketching an area on the map, typing coordinates read off a GPS, or
 * one-tap capture of the current position. "Use my location" produces a ±0.1°
 * box, matching the web app — a single point is not a valid extent.
 */
export function WhereSection({ document, update }: SectionProps) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const language = i18n.language as Language;
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const map = (document.map as MapValue) ?? {};
  const setMap = (patch: Partial<MapValue>) => update("map", { ...map, ...patch });

  const directionChoices: Choice[] = Object.entries(
    depthDirections as Record<string, { title?: Record<string, string> }>,
  ).map(([value, entry]) => ({
    value,
    label: localized(entry.title ?? {}, language) ?? value,
  }));

  const useMyLocation = async () => {
    setLocationError(null);
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocationError(t("where.locationFailed"));
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      // A ±0.1° box, matching the web app's UseMyLocationButton. A single point
      // is not a valid extent, and guessing a tighter box would be wrong.
      setMap({
        north: (latitude + 0.1).toFixed(5),
        south: (latitude - 0.1).toFixed(5),
        east: (longitude + 0.1).toFixed(5),
        west: (longitude - 0.1).toFixed(5),
        polygon: "",
      });
    } catch {
      setLocationError(t("where.locationFailed"));
    } finally {
      setLocating(false);
    }
  };

  const coordinate = (key: "north" | "south" | "east" | "west") => (
    <View key={key} style={{ flex: 1, gap: 4 }}>
      <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
        {t(`where.${key}`)}
      </Text>
      <TextInput
        mono
        // Numbers when the map wrote them, strings when typed.
        value={map[key] === undefined || map[key] === null ? "" : String(map[key])}
        onChangeText={(next) => setMap({ [key]: next, polygon: "" })}
        keyboardType="numbers-and-punctuation"
        accessibilityLabel={t(`where.${key}`)}
      />
    </View>
  );

  const noVertical = Boolean(document.noVerticalExtent);

  return (
    <>
      {/* The map first, then the numbers. Both write the same `map` object, and
          either is a complete answer — a technician reading a GPS may never open
          the map, and someone sketching an area may never type a coordinate. */}
      <Field label={t("map.title")} required error={locationError}>
        <MapSelect value={map} onChange={(next) => update("map", next)} />
      </Field>

      <Field label={t("where.bbox")} help={t("where.bboxHelp")}>
        <View style={{ gap: theme.space.sm }}>
          <View style={styles.row}>{[coordinate("north"), coordinate("south")]}</View>
          <View style={styles.row}>{[coordinate("east"), coordinate("west")]}</View>

          <Pressable
            onPress={useMyLocation}
            disabled={locating}
            accessibilityRole="button"
            accessibilityLabel={t("where.useMyLocation")}
            style={({ pressed }) => [
              styles.locate,
              {
                borderColor: theme.colors.accent,
                borderRadius: theme.radius.md,
                gap: theme.space.sm,
                opacity: locating ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="locate-outline" size={18} color={theme.colors.accent} />
            <Text style={[theme.type.body, { color: theme.colors.accent }]}>
              {t("where.useMyLocation")}
            </Text>
          </Pressable>
        </View>
      </Field>

      <Field label={t("where.polygon")} help={t("where.polygonHelp")}>
        <TextInput
          mono
          multiline
          value={map.polygon ?? ""}
          onChangeText={(next) => setMap({ polygon: next })}
          accessibilityLabel={t("where.polygon")}
        />
      </Field>

      <Field label={t("where.vertical")} help={t("where.verticalHelp")} required>
        <View style={{ gap: theme.space.sm }}>
          <ChoiceInput
            multiple
            choices={[{ value: "yes", label: t("where.noVertical") }]}
            selected={noVertical ? ["yes"] : []}
            onChange={(next) => update("noVerticalExtent", next.length > 0)}
          />

          {!noVertical ? (
            <>
              <View style={styles.row}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                    {t("where.min")}
                  </Text>
                  <TextInput
                    mono
                    value={(document.verticalExtentMin as string) ?? ""}
                    onChangeText={(next) => update("verticalExtentMin", next)}
                    keyboardType="numbers-and-punctuation"
                    accessibilityLabel={t("where.min")}
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                    {t("where.max")}
                  </Text>
                  <TextInput
                    mono
                    value={(document.verticalExtentMax as string) ?? ""}
                    onChangeText={(next) => update("verticalExtentMax", next)}
                    keyboardType="numbers-and-punctuation"
                    accessibilityLabel={t("where.max")}
                  />
                </View>
              </View>

              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {t("where.direction")}
              </Text>
              <ChoiceInput
                choices={directionChoices}
                selected={
                  document.verticalExtentDirection
                    ? [document.verticalExtentDirection as string]
                    : []
                }
                onChange={(next) => update("verticalExtentDirection", next[0] ?? "")}
              />

              <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
                {t("where.epsg")}
              </Text>
              <TextInput
                mono
                value={(document.verticalExtentEPSG as string) ?? ""}
                onChangeText={(next) => update("verticalExtentEPSG", next)}
                keyboardType="number-pad"
                accessibilityLabel={t("where.epsg")}
              />
            </>
          ) : null}
        </View>
      </Field>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12 },
  locate: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
