import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, Popup, NavigationControl, useMap } from "react-map-gl/maplibre";
import { ORIGIN_LAT, ORIGIN_LNG } from "../utils";
import type { ProcessedListing } from "../types";

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const MAP_STYLE = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

// Labelled pills instead of pins — shows the sale's start date (displayStart,
// so an in-progress sale reads as starting today rather than however long ago).
function MarkerLabel({ point, active }: { point: ProcessedListing; active: boolean }) {
  const d = point.displayStart;
  const label = d ? `${d.getMonth() + 1}/${d.getDate()}` : "TBD";
  return <div className="es-mapmark" data-on={active || undefined}>{label}</div>;
}

type MapPoint = ProcessedListing & { lat: number; lng: number };

// When a card is selected from the list, make the link to its marker obvious:
// ease the map to it if it's outside the current view (a no-op if it's
// already visible, so browsing cards doesn't constantly yank the map around).
function PanToSelected({ point }: { point: MapPoint | undefined }) {
  const { current: map } = useMap();
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (!map || !point) return;
    if (last.current === point.id) return;
    last.current = point.id;
    if (!map.getBounds().contains([point.lng, point.lat])) {
      map.easeTo({ center: [point.lng, point.lat], duration: 500 });
    }
  }, [point, map]);
  return null;
}

function FitToPoints({ points }: { points: MapPoint[] }) {
  const { current: map } = useMap();
  const fitted = useRef<string | null>(null);
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

interface MapViewProps {
  listings: ProcessedListing[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onHoverStart: (id: string | null) => void;
  onHoverEnd: () => void;
}

export default function MapView({ listings, selectedId, hoveredId, onSelect, onHoverStart, onHoverEnd }: MapViewProps) {
  const [popupId, setPopupId] = useState<string | null>(null);
  const points = useMemo(
    () => listings.filter((r): r is MapPoint => r.lat != null && r.lng != null),
    [listings]
  );
  const popupPoint = points.find((p) => p.id === popupId);
  const selectedPoint = points.find((p) => p.id === selectedId);

  // Clicking a card (selectedId set from the list) should surface the same
  // popup a marker click gives — the highlighted pill alone is too easy to
  // miss in a dense cluster.
  useEffect(() => {
    if (selectedId && points.some((p) => p.id === selectedId)) setPopupId(selectedId);
  }, [selectedId, points]);

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
      scrollZoom={false}
    >
      <NavigationControl position="top-left" showCompass={false} />
      <FitToPoints points={points} />
      <PanToSelected point={selectedPoint} />
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
            <MarkerLabel point={r} active={r.id === selectedId || r.id === hoveredId} />
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
