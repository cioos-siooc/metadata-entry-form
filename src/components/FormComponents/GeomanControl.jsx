import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

const GeomanControl = ({ onCreated, onRemove }) => {
  const map = useMap();
  const initialized = useRef(false);

  useEffect(() => {
    if (!map || initialized.current) return;

    map.pm.setGlobalOptions({
      finishOn: "dblclick",
    });

    map.pm.addControls({
      position: "topleft",
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: true,
      drawPolygon: true,
      drawCircle: false,
      drawText: false,
      editMode: false,
      dragMode: false,
      rotateMode: false,
      cutPolygon: false,
      removalMode: true,
    });

    map.on("pm:create", onCreated);
    map.on("pm:remove", onRemove);

    initialized.current = true;

    return () => {
      map.off("pm:create", onCreated);
      map.off("pm:remove", onRemove);
      map.pm.removeControls();
      initialized.current = false;
    };
  }, [map, onCreated, onRemove]);

  return null;
};

export default GeomanControl;
