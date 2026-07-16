import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { ENABLED, ORIGIN, REQUEST_DELAY_MS } from "./config.js";
import { shapeListing, dedupe } from "./normalize.js";
import { sampleListings } from "./sample.js";

import { scrape as scrapeNet } from "./adapters/estatesales-net.js";
import { scrape as scrapeOrg } from "./adapters/estatesales-org.js";
import { scrape as scrapeCom } from "./adapters/estatesale-com.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.env.OUT || path.resolve(__dirname, "../site/public/listings.json");

const ADAPTERS = [
  { key: "net", run: scrapeNet },
  { key: "org", run: scrapeOrg },
  { key: "com", run: scrapeCom },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const useSample = process.env.SAMPLE === "1";

  let shaped = [];
  if (useSample) {
    console.log("SAMPLE mode: writing bundled sample data.");
    shaped = sampleListings().map((r) => shapeListing(r, r.sourceUrl.includes(".org") ? "org" : r.sourceUrl.includes(".com") ? "com" : "net"));
  } else {
    for (const { key, run } of ADAPTERS) {
      if (!ENABLED[key]) continue;
      try {
        const raw = await run();
        const mapped = raw.map((r) => shapeListing(r, key));
        console.log(`  ${key}: ${mapped.length} listings`);
        shaped.push(...mapped);
      } catch (err) {
        // One bad source must never sink the whole run.
        console.warn(`  ${key}: FAILED — ${err.message}`);
      }
      await sleep(REQUEST_DELAY_MS);
    }
  }

  const listings = dedupe(shaped).sort((a, b) => (a.startDate < b.startDate ? -1 : 1));

  // Safety net: if a real run scraped nothing (adapters not wired up yet, or every
  // source blocked us), keep whatever is already on disk instead of blanking the site.
  if (!useSample && listings.length === 0) {
    console.warn("No listings scraped. Preserving existing listings.json.");
    return;
  }

  const payload = {
    origin: ORIGIN.zip,
    generatedAt: new Date().toISOString(),
    count: listings.length,
    listings,
  };

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${listings.length} listings to ${OUT}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
