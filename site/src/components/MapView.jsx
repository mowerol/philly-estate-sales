import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, Popup, NavigationControl, useMap } from "react-map-gl/maplibre";
import { PIN_PATH_D } from "./Icon.jsx";
import { ORIGIN_LAT, ORIGIN_LNG } from "../utils.jsx";

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

function Pin({ selected, hovered }) {
  const active = selected || hovered;
  const fill = selected ? "#1f6e5b" : "#c8462e";
  const size = active ? 34 : 26;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="#fbfaf6" strokeWidth="1.2" style={{ filter: "drop-shadow(0 2px 3px rgba(28,37,48,0.35))" }}>
      <path d={PIN_PATH_D} />
      <circle cx="12" cy="10" r="2.6" fill="#fbfaf6" stroke="none" />
    </svg>
  );
}

function FitToPoints({ points }) {
  const { current: map } = useMap();
  const fitted = useRef(null);
  useEffect(() => {
    if (!map) return;
    const key = points.map((p) => p.id).join(",");
    if (key === fitted.current) return;
    fitted.current = key;
    if (points.length === 0) {
      map.easeTo({ center: [ORIGIN_LNG, ORIGIN_LAT], zoom: 11 });
      return;
    }
    if (points.length === 1) {
      map.easeTo({ center: [points[0].lng, points[0].lat], zoom: 14 });
      return;
    }
    const lngs = points.map((p) => p.lng);
    const lats = points.map((p) => p.lat);
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 48, maxZoom: 15, duration: 400 }
    );
  }, [points, map]);
  return null;
}

export default function MapView({ listings, selectedId, hoveredId, onSelect, onHoverStart, onHoverEnd }) {
  const [popupId, setPopupId] = useState(null);
  const points = useMemo(
    () => listings.filter((r) => r.lat != null && r.lng != null),
    [listings]
  );
  const popupPoint = points.find((p) => p.id === popupId);

  if (!MAPTILER_KEY) {
    return (
      <div className="es-map es-map--error">
        Missing VITE_MAPTILER_KEY — set it in site/.env to show the map.
      </div>
    );
  }

  return (
    <Map
      initialViewState={{ longitude: ORIGIN_LNG, latitude: ORIGIN_LAT, zoom: 11 }}
      mapStyle={MAP_STYLE}
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="top-left" showCompass={false} />
      <FitToPoints points={points} />
      {points.map((r) => (
        <Marker
          key={r.id}
          longitude={r.lng}
          latitude={r.lat}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setPopupId(r.id);
            onSelect(r.id);
          }}
        >
          <div
            onMouseEnter={() => onHoverStart(r.id)}
            onMouseLeave={onHoverEnd}
          >
            <Pin selected={r.id === selectedId} hovered={r.id === hoveredId} />
          </div>
        </Marker>
      ))}

      {popupPoint && (
        <Popup
          longitude={popupPoint.lng}
          latitude={popupPoint.lat}
          anchor="bottom"
          offset={30}
          closeButton={false}
          onClose={() => setPopupId(null)}
        >
          <div className="es-popup">
            <b>{popupPoint.title}</b>
            {popupPoint.distanceMi != null && <div>{popupPoint.distanceMi.toFixed(1)} mi away</div>}
            {popupPoint.sourceUrl && (
              <a href={popupPoint.sourceUrl} target="_blank" rel="noreferrer">View listing →</a>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
}
