import * as cheerio from "cheerio";
import { ORIGIN, USER_AGENT } from "../config.js";

/**
 * estatesale.com
 *
 * Confirm the search URL (often a ZIP or city query string) and card selectors in
 * your browser before relying on this. Same JSON-first advice applies if it's a SPA.
 */
export async function scrape() {
  const url = `https://www.estatesale.com/search?zip=${ORIGIN.zip}`;
  const html = await getText(url);
  const $ = cheerio.load(html);

  const out = [];
  // TODO: verify against live markup.
  $(".result, .sale-card, article").each((_, el) => {
    const card = $(el);
    const title = card.find("h2, h3, .name").first().text();
    const href = card.find("a").first().attr("href") || "";
    if (!title) return;

    out.push({
      sourceUrl: href.startsWith("http") ? href : "https://www.estatesale.com" + href,
      title,
      company: card.find(".company").first().text(),
      addressLine: card.find(".address").first().text(),
      city: "",
      state: "PA",
      zip: "",
      saleType: "estate",
      startDate: card.find("time, .date").first().text(),
      description: card.find(".description, p").first().text(),
      imageCount: card.find("img").length,
    });
  });
  return out;
}

async function getText(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "text/html" } });
  if (!res.ok) throw new Error(`estatesale.com ${res.status}`);
  return res.text();
}
