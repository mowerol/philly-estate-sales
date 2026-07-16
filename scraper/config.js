// Central config for the scrape run. Change ORIGIN to hunt from a different place.

export const ORIGIN = {
  zip: "19127",          // Manayunk, Philadelphia
  lat: 40.0257,
  lng: -75.2260,
};

// How far out to look. Sources that support a zip+radius search should use this.
export const RADIUS_MI = 25;

// Be a polite guest: identify yourself and don't hammer the sites.
export const USER_AGENT =
  "WeekendRoundsBot/1.0 (personal estate-sale collator; contact: you@example.com)";
export const REQUEST_DELAY_MS = 1500; // pause between requests to one source

// Which sources to run. Flip to false to skip one.
export const ENABLED = {
  net: true, // estatesales.net
  org: true, // estatesales.org
  com: true, // estatesale.com
};
