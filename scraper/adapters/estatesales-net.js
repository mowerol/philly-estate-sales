import { ORIGIN, RADIUS_MI, USER_AGENT, REQUEST_DELAY_MS } from "../config.js";
import { distanceMi } from "../normalize.js";
import { ZIP_CENTROIDS } from "../zips.js";

/**
 * estatesales.net
 *
 * Angular Universal SSR — no headless browser needed. Each listing page embeds:
 *  - one <script type="application/ld+json"> SaleEvent block per card (title, url,
 *    dates, organizer, address) — but its `description` is always a generic
 *    "Estate Sale" placeholder, not useful for keyword matching.
 *  - a <script id="estatesales-net-state"> NGRX state blob with per-sale lat/lng,
 *    typeName and picture counts for the sales shown on that page.
 * The listing page only ever server-renders the first ~20 sales (the rest load via
 * infinite scroll against an authenticated internal API with no public equivalent),
 * so to get broader coverage we query several nearby zips and dedupe by sale id.
 * For real descriptions we fetch each candidate sale's detail page, which embeds a
 * much richer state blob (htmlDescription, precise lat/lng, local start/end times).
 */
export async function scrape() {
  const anchorZips = pickAnchorZips();

  const bySaleId = new Map();
  for (const zip of anchorZips) {
    let html;
    try {
      html = await getText(`https://www.estatesales.net/${ZIP_CENTROIDS[zip].state}/x/${zip}`);
    } catch (err) {
      console.warn(`  net: zip ${zip} failed — ${err.message}`);
      continue;
    }
    for (const sale of parseListingPage(html)) {
      if (!bySaleId.has(sale.id)) bySaleId.set(sale.id, sale);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  const candidates = [...bySaleId.values()].filter(
    (s) => s.lat == null || s.lng == null || distanceMi(s.lat, s.lng) <= RADIUS_MI
  );

  const detailed = await mapWithConcurrency(candidates, 2, async (sale) => {
    try {
      const html = await getText(`https://www.estatesales.net${sale.path}`);
      return mergeDetail(sale, html);
    } catch (err) {
      console.warn(`  net: detail fetch failed for ${sale.path} — ${err.message}`);
      return sale; // fall back to the coarse listing-page data rather than dropping it
    }
  });

  return detailed.map(toLooseListing);
}

// Zips within RADIUS_MI of ORIGIN, closest first, origin zip always included.
function pickAnchorZips() {
  const withinRadius = Object.keys(ZIP_CENTROIDS)
    .map((zip) => ({ zip, d: distanceMi(ZIP_CENTROIDS[zip].lat, ZIP_CENTROIDS[zip].lng) }))
    .filter(({ d }) => d <= RADIUS_MI)
    .sort((a, b) => a.d - b.d)
    .map(({ zip }) => zip);
  if (!withinRadius.includes(ORIGIN.zip)) withinRadius.unshift(ORIGIN.zip);
  return withinRadius.slice(0, 12); // stay polite — 12 requests max for the listing pass
}

function parseListingPage(html) {
  const ldBlocks = extractLdJson(html);
  const state = extractStateBlob(html);
  const cityRows = state?.NGRX_STATE?.["feature.cityViewState"]?.filteredSales || [];
  const saleRows = state?.NGRX_STATE?.ui?.sales?.saleRows || {};

  const out = [];
  for (const ld of ldBlocks) {
    const m = ld.url?.match(/\/([A-Za-z-]+)\/([A-Za-z0-9-]+)\/(\d+)\/(\d+)$/);
    if (!m) continue;
    const id = m[4];
    const extra = cityRows.find((r) => String(r.id) === id);
    const row = saleRows[id];

    out.push({
      id,
      path: new URL(ld.url).pathname,
      sourceUrl: ld.url,
      title: ld.name,
      company: ld.organizer?.name || row?.orgName || "",
      addressLine: ld.location?.address?.streetAddress || row?.address || "",
      city: ld.location?.address?.addressLocality || row?.cityName || "",
      state: ld.location?.address?.addressRegion || "",
      zip: ld.location?.address?.postalCode || "",
      lat: extra?.latitude ?? row?.latitude ?? null,
      lng: extra?.longitude ?? row?.longitude ?? null,
      typeName: extra?.typeName || row?.typeName || "",
      startDate: ld.startDate,
      endDate: ld.endDate,
      description: ld.description,
      imageCount: row?.pictureCount ?? (ld.image ? ld.image.length : 0),
      imageUrl: ld.image?.[0] || row?.mainPicture?.thumbnailUrl || null,
    });
  }
  return out;
}

function mergeDetail(sale, html) {
  const state = extractStateBlob(html);
  const entities = state?.NGRX_STATE?.["feature.traditionalSaleViewState"]?.entitiesById;
  if (!entities) return sale;
  const detail = entities[sale.id];
  if (!detail) return sale;

  return {
    ...sale,
    title: detail.name || sale.title,
    company: detail.seller?.name || sale.company,
    addressLine: detail.locationInfo?.address?.addressLine1 || sale.addressLine,
    city: detail.locationInfo?.address?.postalCode?.cityName || sale.city,
    state: detail.locationInfo?.address?.postalCode?.stateCode || sale.state,
    zip: detail.locationInfo?.address?.postalCode?.postalCodeNumber || sale.zip,
    lat: detail.latitude ?? sale.lat,
    lng: detail.longitude ?? sale.lng,
    typeName: detail.typeName || sale.typeName,
    startDateUtc: detail.firstUtcStartDate?._value,
    endDateUtc: detail.lastUtcEndDate?._value,
    startTimeLocal: localTimeOf(detail.firstLocalStartDate?._value),
    endTimeLocal: localTimeOf(detail.lastLocalEndDate?._value),
    description: htmlToText(detail.htmlDescription) || sale.description,
    imageCount: detail.pictureCount ?? sale.imageCount,
    imageUrl: detail.mainPicture?.thumbnailUrl || detail.mainPicture?.url || sale.imageUrl,
  };
}

function toLooseListing(sale) {
  return {
    sourceUrl: sale.sourceUrl,
    title: sale.title,
    company: sale.company,
    addressLine: sale.addressLine,
    city: sale.city,
    state: sale.state,
    zip: sale.zip,
    lat: sale.lat,
    lng: sale.lng,
    saleType: mapSaleType(sale.typeName, sale.title),
    startDate: sale.startDateUtc || sale.startDate,
    endDate: sale.endDateUtc || sale.endDate,
    startTime: sale.startTimeLocal || null,
    endTime: sale.endTimeLocal || null,
    description: sale.description,
    imageCount: sale.imageCount,
    imageUrl: sale.imageUrl,
  };
}

function mapSaleType(typeName, title) {
  const s = `${typeName} ${title}`;
  if (/auction/i.test(s)) return "auction";
  if (/online/i.test(s)) return "online";
  if (/moving/i.test(s)) return "moving";
  if (/(buyout|cleanout|business closing)/i.test(s)) return "tag";
  if (/garage|yard sale/i.test(s)) return "garage";
  return "estate";
}

// The NGRX state's "local" DateTime fields carry local wall-clock time but are
// serialized with a misleading trailing "Z" — pull the HH:MM out directly instead
// of parsing through Date(), which would treat "Z" as UTC and shift it.
function localTimeOf(isoLike) {
  const m = (isoLike || "").match(/T(\d{2}:\d{2})/);
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

function extractLdJson(html) {
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    try {
      out.push(JSON.parse(m[1]));
    } catch {
      // skip malformed blocks
    }
  }
  return out;
}

function extractStateBlob(html) {
  const m = html.match(/<script id="estatesales-net-state" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

async function mapWithConcurrency(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
      await sleep(REQUEST_DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getText(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "text/html" } });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.text();
}
