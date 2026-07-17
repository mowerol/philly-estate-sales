# Weekend Rounds

A free, self-hosting estate-sale collator. A scheduled GitHub Action scrapes
estatesales.net and estatesales.org, normalizes everything into one schema, and
GitHub Pages serves a React frontend that reads the result. No server, no paid
services.

(estatesale.com was evaluated and dropped — it sits entirely behind an Imperva/
Incapsula bot challenge with no legitimate opening, so it isn't wired up.)

## How it works

```
 GitHub Action (cron)          GitHub Pages (static)
 ┌─────────────────┐           ┌──────────────────┐
 │ scraper/ (Node) │  writes   │ site/ (React)    │
 │  two adapters   │──────────▶│  fetches         │
 │  → normalize    │ listings  │  listings.json   │
 │  → listings.json│  .json    │  at runtime      │
 └─────────────────┘           └──────────────────┘
```

The same workflow run scrapes, commits the refreshed `listings.json`, rebuilds the
site, and deploys it. Because the frontend fetches its own bundled `listings.json`,
there is no cross-origin request and no CORS problem.

## One-time setup

1. Create a new GitHub repo and push this project to the `main` branch.
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push (or open the **Actions** tab and run **Scrape and deploy** manually).
4. When the run goes green, your site is live at the URL printed in the deploy step
   (usually `https://<you>.github.io/<repo>/`).

The site ships seeded with sample Philadelphia sales, so it looks populated on the
very first deploy, before the scrapers are wired to real data.

> If the data-commit step fails with a permissions error, set
> **Settings → Actions → General → Workflow permissions** to **Read and write**.

## How the adapters work

Both adapters in `scraper/adapters/` are wired to real data — no headless browser
needed, since both sites are server-rendered:

- **estatesales.net** — parses per-card `ld+json` blocks plus an embedded NGRX state
  blob for lat/lng and picture counts. The listing page only server-renders ~20
  sales, so the adapter queries several nearby zips (`scraper/zips.js`) and dedupes
  by sale id. Real descriptions require a detail-page fetch per sale (concurrency
  limited, rate-limited).
- **estatesales.org** — the entire result set, including full rich descriptions, is
  embedded as `window.pageData.listings` JSON right on the search page, which
  natively supports `?radius=&p=` pagination. No detail-page fetches needed.

Each adapter returns loosely-shaped objects; `scraper/normalize.js` forces them into
the canonical schema, so if you add another source you only need to touch a new
adapter file.

The scraper is defensive: if a source throws or returns nothing, it's skipped, and
if the whole run yields zero listings it keeps the previous `listings.json` rather
than blanking the site.

## Customizing

- **Location / radius:** `scraper/config.js` (`ORIGIN`, `RADIUS_MI`). The frontend
  radius slider and origin label are in `site/src/App.jsx`.
- **Schedule:** the `cron` line in `.github/workflows/build.yml` (UTC).
- **Tracked interests:** `DEFAULT_INTERESTS` in `site/src/App.jsx`. These drive the
  highlight-and-match behavior. Saved sales and interest toggles persist in the
  browser via localStorage.

## Local development

```bash
# frontend, with hot reload
cd site && npm install && npm run dev

# regenerate the sample data file
cd scraper && npm install && npm run scrape:sample

# run the real scrapers locally (once adapters are wired)
cd scraper && npm run scrape
```

## The data schema (adapter → frontend contract)

```jsonc
{
  "id": "net_ab12cd34ef",
  "source": "net",           // 'net' | 'org'
  "sourceUrl": "https://…",
  "title": "…",
  "company": "…",
  "addressLine": "…", "city": "…", "state": "PA", "zip": "…",
  "lat": 40.02, "lng": -75.22, "distanceMi": 0.4,  // distance computed from ORIGIN
  "saleType": "estate",      // estate | moving | tag | auction | online | garage
  "startDate": "2026-07-18", "endDate": "2026-07-20",
  "startTime": "09:00", "endTime": "15:00",
  "description": "…",
  "imageCount": 42, "imageUrl": "https://… | null"
}
```

## If a source starts blocking the GitHub runners

GitHub's runner IPs are datacenter ranges that some sites block via anti-bot. If a
source starts returning blocks, move just the scraping to a free
[Cloudflare Worker](https://developers.cloudflare.com/workers/) with a Cron Trigger
(better IP reputation, free tier, KV storage) and have it write the same
`listings.json`. The frontend doesn't change.

## A note on politeness

The scraper sends a descriptive User-Agent and rate-limits between requests. Keep the
schedule modest (a couple of times a day is plenty for estate sales) and respect each
site's terms of service.
