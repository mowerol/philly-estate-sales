/**
 * estatesale.com
 *
 * Every path on this domain (including /robots.txt's neighbors) is served behind an
 * Imperva/Incapsula bot challenge — a plain HTTP fetch gets a JS-challenge stub, not
 * real content. That's active anti-bot fingerprinting rather than a "needs a headless
 * browser" problem, so this adapter deliberately does not try to defeat it.
 *
 * Returns no listings; index.js already isolates per-adapter failures/empty results
 * and keeps the previous listings.json, so the site still works fine off net + org.
 * Revisit if this source ever exposes a public API or an unprotected endpoint.
 */
export async function scrape() {
  console.warn("  com: skipped — estatesale.com sits behind an Incapsula bot challenge");
  return [];
}
