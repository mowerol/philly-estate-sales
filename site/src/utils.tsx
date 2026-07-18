import React from "react";
import type { Source } from "./types";

export const ORIGIN = "19127";
export const ORIGIN_LAT = 40.0257;
export const ORIGIN_LNG = -75.226;

export const SOURCES: Record<Source, { code: string; label: string; dot: string }> = {
  net: { code: "ES.NET", label: "estatesales.net", dot: "#2D6CDF" },
  org: { code: "ES.ORG", label: "estatesales.org", dot: "#7A4FBF" },
};

export const DEFAULT_INTERESTS = [
  "mid-century", "teak", "danish", "camera", "film",
  "guitar", "vinyl", "records", "cast iron", "lighting", "tools",
];

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const DATA_URL = `${import.meta.env.BASE_URL}listings.json`;

// --- small localStorage helpers (safe if storage is unavailable) ---
export function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
export function save(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export function parseDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}
export function fmtTime(t: string | null): string | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}
export function fmtDay(d: Date): string { return `${WEEKDAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`; }
export function fmtRange(a: Date | null, b: Date | null): string {
  if (!a) return "";
  if (!b || a.getTime() === b.getTime()) return fmtDay(a);
  const sameMonth = a.getMonth() === b.getMonth();
  return `${WEEKDAYS[a.getDay()]}–${WEEKDAYS[b.getDay()]}, ${MONTHS[a.getMonth()]} ${a.getDate()}${sameMonth ? "" : " " + MONTHS[b.getMonth()]}–${b.getDate()}`;
}
export function relTime(iso: string): string {
  const then = new Date(iso);
  if (isNaN(then.getTime())) return "unknown";
  const mins = Math.round((Date.now() - then.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

export const startOfToday = (): Date => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export function eachDay(a: Date, b: Date): Date[] {
  const out: Date[] = [];
  const d = new Date(a);
  while (d <= b && out.length < 14) { out.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return out.length ? out : [a];
}

export function highlight(text: string, terms: string[]): React.ReactNode {
  if (!terms.length) return text;
  const esc = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${esc.join("|")})`, "gi");
  return text.split(re).map((p, i) =>
    terms.some((t) => t.toLowerCase() === p.toLowerCase())
      ? <mark key={i}>{p}</mark>
      : <React.Fragment key={i}>{p}</React.Fragment>
  );
}
