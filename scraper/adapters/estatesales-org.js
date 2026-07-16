import * as cheerio from "cheerio";
import { ORIGIN, USER_AGENT } from "../config.js";

/**
 * estatesales.org
 *
 * Search is typically /estate-sales/<state>/<city> or a ZIP query. Confirm the real
 * URL pattern in your browser, then verify the card selectors below against the DOM.
 * If it turns out to be a JS-rendered SPA with an internal JSON endpoint, prefer that
 * (DevTools > Network > Fetch/XHR) exactly like the .net adapter notes.
 */
export async function scrape() {
  const url = `https://www.estatesales.org/estate-sales/PA/philadelphia/${ORIGIN.zip}`;
  const html = await getText(url);
  const $ = cheerio.load(html);

  const out = [];
  // TODO: verify against live markup.
  $(".sale-listing, .listing, article").each((_, el) => {
    const card = $(el);
    const title = card.find("h2, h3, .title").first().text();
    const href = card.find("a").first().attr("href") || "";
    if (!title) return;

    out.push({
      sourceUrl: href.startsWith("http") ? href : "https://www.estatesales.org" + href,
      title,
      company: card.find(".company, .company-name").first().text(),
      addressLine: card.find(".address, .location").first().text(),
      city: "",
      state: "PA",
      zip: "",
      saleType: /online|auction/i.test(title) ? "online" : "estate",
      startDate: card.find("time, .date").first().attr("datetime") || card.find("time, .date").first().text(),
      description: card.find(".description, p").first().text(),
      imageCount: card.find("img").length,
    });
  });
  return out;
}

async function getText(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "text/html" } });
  if (!res.ok) throw new Error(`estatesales.org ${res.status}`);
  return res.text();
}
