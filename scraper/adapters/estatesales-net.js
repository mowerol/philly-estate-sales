import * as cheerio from "cheerio";
import { ORIGIN, RADIUS_MI, USER_AGENT } from "../config.js";

/**
 * estatesales.net
 *
 * BEST PATH: this site's map/search is powered by an internal JSON API (it's what
 * their mobile app calls). Open the site in your browser, filter to your ZIP, open
 * DevTools > Network > Fetch/XHR, and watch for a request that returns JSON of sales.
 * Copy that URL + query params here. JSON is far more stable than parsing HTML.
 *
 * FALLBACK (below): parse the server-rendered listing cards. Selectors WILL need
 * checking against the live DOM, because I can't see their current markup from here.
 *
 * Return an array of loosely-shaped objects; normalize.js forces them into schema.
 */
export async function scrape() {
  // --- Attempt 1: internal JSON API (fill in once you've found it in DevTools) ---
  // const apiUrl = `https://www.estatesales.net/api/.../search?zip=${ORIGIN.zip}&radius=${RADIUS_MI}`;
  // const json = await getJson(apiUrl);
  // return json.sales.map(mapApiSale);

  // --- Fallback: HTML search page ---
  const url = `https://www.estatesales.net/PA/${citySlugFor(ORIGIN.zip)}/${ORIGIN.zip}`;
  const html = await getText(url);
  const $ = cheerio.load(html);

  const out = [];
  // TODO: verify this selector against the live page (DevTools > inspect a sale card).
  $("[data-sale-id], .sale-item, article.sale").each((_, el) => {
    const card = $(el);
    const title = card.find("h2, .sale-title, [itemprop='name']").first().text();
    const href = card.find("a").first().attr("href") || "";
    const address = card.find(".address, [itemprop='streetAddress']").first().text();
    const dateText = card.find(".dates, time").first().text();
    const desc = card.find(".description, .sale-description").first().text();
    if (!title) return;

    out.push({
      sourceUrl: href.startsWith("http") ? href : "https://www.estatesales.net" + href,
      title,
      company: card.find(".company, .company-name").first().text(),
      addressLine: address,
      city: "",
      state: "PA",
      zip: "",
      lat: card.attr("data-lat"),
      lng: card.attr("data-lng"),
      saleType: /moving/i.test(title) ? "moving" : /auction/i.test(title) ? "auction" : "estate",
      startDate: parseFirstDate(dateText),
      endDate: parseLastDate(dateText),
      startTime: null,
      endTime: null,
      description: desc,
      imageCount: card.find("img").length,
    });
  });
  return out;
}

function citySlugFor(zip) {
  // estatesales.net URLs are /STATE/city/zip. Map your ZIP once.
  const map = { "19127": "philadelphia" };
  return map[zip] || "philadelphia";
}

// --- shared fetch helpers ---
async function getText(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "text/html" } });
  if (!res.ok) throw new Error(`estatesales.net ${res.status}`);
  return res.text();
}
// eslint-disable-next-line no-unused-vars
async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (!res.ok) throw new Error(`estatesales.net json ${res.status}`);
  return res.json();
}

// Very rough date extraction from free text like "Fri Jul 18 - Sun Jul 20".
function parseFirstDate(t) {
  const m = (t || "").match(/[A-Z][a-z]{2,8}\s+\d{1,2}(,?\s*\d{4})?/g);
  return m ? m[0] : null;
}
function parseLastDate(t) {
  const m = (t || "").match(/[A-Z][a-z]{2,8}\s+\d{1,2}(,?\s*\d{4})?/g);
  return m ? m[m.length - 1] : null;
}
