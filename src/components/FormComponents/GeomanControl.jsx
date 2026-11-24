import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { useParams } from "react-router-dom";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

const GeomanControl = ({ onCreated, onRemove }) => {
  const map = useMap();
  const { language } = useParams();
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
    map.pm.setLang(language === "fr" ? "fr" : "en");

    // Geoman's tool buttons are <a href="#"> with the name only in the
    // wrapper's title, so screen readers hear "link". Name them as buttons.
    map
      .getContainer()
      .querySelectorAll(".leaflet-pm-toolbar .button-container")
      .forEach((container) => {
        const link = container.querySelector(".leaflet-buttons-control-button");
        if (!link) return;
        link.setAttribute("role", "button");
        link.setAttribute("aria-label", container.getAttribute("title") || "");
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
  }, [map, onCreated, onRemove, language]);

  return null;
};

export default GeomanControl;
