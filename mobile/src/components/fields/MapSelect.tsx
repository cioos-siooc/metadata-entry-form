import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Polygon, Polyline, Marker, type MapPressEvent } from "react-native-maps";

import { useTheme } from "@/theme/ThemeProvider";
import { MIN_TOUCH_TARGET } from "@/theme/tokens";

import {
  boundsFromCorners,
  boundsFromMap,
  boundsToCorners,
  openRing,
  parsePolygon,
  polygonPatch,
  rectanglePatch,
  regionForBounds,
  type LatLng,
  type MapValue,
} from "./mapValue";

type Mode = "view" | "box" | "polygon";

/**
 * Drawing a spatial extent.
 *
 * Tap-to-place rather than drag-to-draw. Dragging fights the map's own pan
 * gesture, and on a moving deck with cold hands a precise drag is not something
 * to rely on — two taps for a box, and tap-then-Done for a shape, are both
 * recoverable one-handed.
 *
 * All coordinate handling lives in mapValue.ts, where it is tested against the
 * shared validator. This component only decides what the user meant.
 */
export function MapSelect({
  value,
  onChange,
}: {
  value: MapValue | undefined;
  onChange: (next: MapValue) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const mapRef = useRef<MapView | null>(null);

  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState<LatLng[]>([]);

  const map = value ?? {};
  const storedPolygon = useMemo(() => openRing(parsePolygon(map.polygon)), [map.polygon]);
  const storedBounds = useMemo(() => boundsFromMap(map), [map]);

  // What is on screen: the in-progress draft while drawing, otherwise whatever
  // the record holds.
  const shape: LatLng[] =
    mode !== "view" && draft.length > 0
      ? draft
      : storedPolygon.length > 0
        ? storedPolygon
        : storedBounds
          ? boundsToCorners(storedBounds)
          : [];

  const initialRegion = useMemo(() => {
    if (storedBounds) return regionForBounds(storedBounds);
    // No extent yet: a wide view of Canadian waters is a more useful starting
    // point than the middle of the ocean.
    return { latitude: 54, longitude: -125, latitudeDelta: 20, longitudeDelta: 20 };
  }, [storedBounds]);

  const handlePress = (event: MapPressEvent) => {
    if (mode === "view") return;
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const tapped = { latitude, longitude };

    if (mode === "box") {
      const next = [...draft, tapped].slice(-2);
      setDraft(next);
      if (next.length === 2) {
        onChange(rectanglePatch(map, boundsFromCorners(next[0], next[1])));
        setDraft([]);
        setMode("view");
      }
      return;
    }

    setDraft([...draft, tapped]);
  };

  const finishPolygon = () => {
    if (draft.length < 3) return;
    onChange(polygonPatch(map, draft));
    setDraft([]);
    setMode("view");
  };

  const clear = () => {
    setDraft([]);
    setMode("view");
    onChange({ ...map, north: "", south: "", east: "", west: "", polygon: "" });
  };

  const recentre = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") return;
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    mapRef.current?.animateToRegion({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    });
  };

  const hint =
    mode === "box"
      ? t("map.boxHint")
      : mode === "polygon"
        ? draft.length < 3
          ? t("map.needsThree")
          : t("map.polygonHint")
        : shape.length === 0
          ? t("map.noShape")
          : null;

  const control = (
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
    onPress: () => void,
    active = false,
    disabled = false,
  ) => (
    <Pressable
      key={label}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
      style={({ pressed }) => [
        styles.control,
        {
          borderColor: active ? theme.colors.accent : theme.colors.border,
          backgroundColor: active ? theme.colors.accentFill : theme.colors.surfaceRaised,
          borderRadius: theme.radius.md,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={active ? theme.colors.onAccent : theme.colors.accent}
      />
      <Text
        style={[
          theme.type.caption,
          { color: active ? theme.colors.onAccent : theme.colors.accent },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={{ gap: theme.space.sm }}>
      <View
        style={[
          styles.mapFrame,
          { borderColor: theme.colors.border, borderRadius: theme.radius.md },
        ]}
      >
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          onPress={handlePress}
          // Panning while drawing is still useful; only the tap is captured.
          scrollEnabled
          zoomEnabled
        >
          {/* A closed shape once there are three points; a line while it is
              still being drawn, so early taps are visible. */}
          {shape.length >= 3 ? (
            <Polygon
              coordinates={shape}
              strokeColor={theme.colors.accent}
              fillColor={`${theme.colors.accent}33`}
              strokeWidth={2}
            />
          ) : shape.length === 2 ? (
            <Polyline coordinates={shape} strokeColor={theme.colors.accent} strokeWidth={2} />
          ) : null}

          {mode !== "view"
            ? draft.map((point, index) => (
                <Marker
                  key={`${point.latitude},${point.longitude},${index}`}
                  coordinate={point}
                  pinColor={theme.colors.accent}
                />
              ))
            : null}
        </MapView>
      </View>

      <View style={[styles.controls, { gap: theme.space.sm }]}>
        {control(
          t("map.boxMode"),
          "square-outline",
          () => {
            setDraft([]);
            setMode(mode === "box" ? "view" : "box");
          },
          mode === "box",
        )}
        {control(
          t("map.polygonMode"),
          "analytics-outline",
          () => {
            setDraft([]);
            setMode(mode === "polygon" ? "view" : "polygon");
          },
          mode === "polygon",
        )}
        {mode === "polygon"
          ? control(t("map.done"), "checkmark", finishPolygon, false, draft.length < 3)
          : null}
        {mode === "polygon" && draft.length > 0
          ? control(t("map.undo"), "arrow-undo-outline", () => setDraft(draft.slice(0, -1)))
          : null}
        {control(t("map.recentre"), "locate-outline", recentre)}
        {shape.length > 0 ? control(t("map.clear"), "trash-outline", clear) : null}
      </View>

      {mode === "polygon" && draft.length > 0 ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>
          {t("map.points", { count: draft.length })}
        </Text>
      ) : null}

      {hint ? (
        <Text style={[theme.type.caption, { color: theme.colors.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mapFrame: { borderWidth: 1, overflow: "hidden" },
  // Tall enough to be usable but not so tall the numeric fields below are
  // pushed off screen — the map is one way in, not the only one.
  map: { height: 320 },
  controls: { flexDirection: "row", flexWrap: "wrap" },
  control: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
});
