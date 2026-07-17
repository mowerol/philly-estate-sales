import crypto from "node:crypto";
import { ORIGIN } from "./config.js";

// Great-circle distance in miles between two lat/lng points.
export function distanceMi(lat, lng) {
  if (lat == null || lng == null) return null;
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat - ORIGIN.lat);
  const dLng = toRad(lng - ORIGIN.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(ORIGIN.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// Stable id so the same sale keeps the same id across runs (used for de-dupe + saved state).
export function makeId(source, seed) {
  return source + "_" + crypto.createHash("sha1").update(String(seed)).digest("hex").slice(0, 10);
}

const SALE_TYPES = ["estate", "moving", "tag", "auction", "online", "garage"];

// Take a loosely-shaped object from an adapter and force it into the canonical schema.
// This is the CONTRACT the frontend depends on. Keep every field present.
export function shapeListing(raw, source) {
  const lat = num(raw.lat);
  const lng = num(raw.lng);
  const startDate = isoDate(raw.startDate) || isoDate(raw.date);
  const endDate = isoDate(raw.endDate) || startDate;
  return {
    id: raw.id || makeId(source, [raw.sourceUrl, raw.addressLine, startDate, raw.title].join("|")),
    source, // 'net' | 'org'
    sourceUrl: raw.sourceUrl || "",
    title: clean(raw.title) || "Untitled sale",
    company: clean(raw.company) || "",
    addressLine: clean(raw.addressLine) || "",
    city: clean(raw.city) || "",
    state: clean(raw.state) || "",
    zip: clean(raw.zip) || "",
    lat,
    lng,
    distanceMi: raw.distanceMi != null ? num(raw.distanceMi) : distanceMi(lat, lng),
    saleType: SALE_TYPES.includes(raw.saleType) ? raw.saleType : "estate",
    startDate,
    endDate,
    startTime: time(raw.startTime),
    endTime: time(raw.endTime),
    description: clean(raw.description) || "",
    imageCount: Number.isFinite(+raw.imageCount) ? +raw.imageCount : 0,
    imageUrl: raw.imageUrl || null,
  };
}

// Drop duplicates that show up on more than one source (same place + same start day).
export function dedupe(listings) {
  const seen = new Map();
  for (const l of listings) {
    const key = (l.addressLine + "|" + l.startDate).toLowerCase().replace(/\s+/g, " ").trim();
    // Prefer the entry with the richer description / more images.
    const prev = seen.get(key);
    if (!prev || score(l) > score(prev)) seen.set(key, l);
  }
  return [...seen.values()];
}

const score = (l) => l.description.length + l.imageCount;
const num = (v) => (v == null || v === "" || isNaN(+v) ? null : +v);
const clean = (v) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : v);
const time = (v) => (/^\d{1,2}:\d{2}$/.test(v || "") ? v : null);
function isoDate(v) {
  if (!v) return null;
  // estatesales.org omits the leading zero on single-digit hours (e.g. "T9:00-04:00"),
  // which native Date parsing rejects as invalid ISO 8601.
  const padded = typeof v === "string" ? v.replace(/T(\d):/, "T0$1:") : v;
  const d = new Date(padded);
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}
