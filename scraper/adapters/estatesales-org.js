import { ORIGIN, RADIUS_MI, USER_AGENT, REQUEST_DELAY_MS } from "../config.js";

/**
 * estatesales.org
 *
 * Plain server-rendered HTML — no JS needed. Every listing page embeds the full
 * result set as JSON right in a <script> tag:
 *
 *   window.pageData.listings = [{ id, title, url, descr, company_name, address,
 *     city, state, zip, lat, lon, type_name, date_from_with_utc_offset, ... }, ...]
 *
 * `descr` is the full rich-text sale description (not a truncated blurb), so no
 * detail-page fetches are needed at all. The search URL supports radius + page
 * query params directly, matching our config.
 */
export async function scrape() {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const url = `https://estatesales.org/estate-sales/pa/philadelphia/${ORIGIN.zip}?radius=${RADIUS_MI}&p=${page}`;
    let html;
    try {
      html = await getText(url);
    } catch (err) {
      console.warn(`  org: page ${page} failed — ${err.message}`);
      break;
    }
    const listings = extractPageData(html);
    if (listings.length === 0) break;
    out.push(...listings.map(toLooseListing));
    await sleep(REQUEST_DELAY_MS);
  }
  return out;
}

function toLooseListing(item) {
  const isOnline = /online/i.test(item.type_name) || item.online_via_eso || item.online_external;
  const hasRealAddress = item.address && item.address.toLowerCase() !== "hidden";

  return {
    sourceUrl: item.url_abs || `https://estatesales.org${item.url}`,
    title: item.title,
    company: item.company_name || "",
    addressLine: hasRealAddress ? item.address : "",
    city: item.city || "",
    state: item.state || "",
    zip: item.zip || "",
    // Online listings often carry the auctioneer's own (sometimes distant) address
    // rather than anywhere a buyer actually goes — don't treat that as the sale's
    // location.
    lat: isOnline ? null : num(item.lat),
    lng: isOnline ? null : num(item.lon),
    saleType: mapSaleType(item.type_name),
    startDate: item.date_from_with_utc_offset,
    endDate: item.date_to_with_utc_offset,
    startTime: localTimeOf(item.date_from_with_utc_offset),
    endTime: localTimeOf(item.date_to_with_utc_offset),
    description: htmlToText(item.descr),
    imageCount: item.media_count ?? 0,
    imageUrl: item.preview_photo_large || item.preview_photo || null,
  };
}

function mapSaleType(typeName) {
  const s = typeName || "";
  if (/online/i.test(s)) return "online";
  if (/auction/i.test(s)) return "auction";
  if (/moving/i.test(s)) return "moving";
  if (/(buyout|cleanout|business closing)/i.test(s)) return "tag";
  if (/garage|yard sale/i.test(s)) return "garage";
  return "estate";
}

function localTimeOf(isoWithOffset) {
  const m = (isoWithOffset || "").match(/T(\d{2}:\d{2})/);
  return m ? m[1] : null;
}

function htmlToText(html) {
  if (!html) return "";
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

const num = (v) => (v == null || v === "" ? null : Number(v));

// Extract the `window.pageData.listings = [...]` array embedded in the page —
// a bracket-balanced scan, since it's a JS literal (not strict JSON) with the array
// itself being valid JSON.
function extractPageData(html) {
  const marker = "window.pageData.listings = ";
  const start = html.indexOf(marker);
  if (start === -1) return [];
  const s = start + marker.length;
  let depth = 0;
  let inStr = false;
  let strChar = "";
  let esc = false;
  let i = s;
  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === strChar) inStr = false;
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = true;
      strChar = c;
      continue;
    }
    if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  try {
    return JSON.parse(html.slice(s, i));
  } catch {
    return [];
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getText(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "text/html" } });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.text();
}
