import { useEffect, useMemo, useState } from "react";
import { Menu, Portal } from "@chakra-ui/react";
import Card from "./components/Card";
import MapView from "./components/MapView";
import Header from "./components/Header";
import FilterModal from "./components/FilterModal";
import PreferencesModal from "./components/PreferencesModal";
import SavedModal from "./components/SavedModal";
import Icon from "./components/Icon";
import {
  MONTHS, DATA_URL,
  load, save, parseDate, relTime, startOfToday, eachDay, dayLabel,
} from "./utils";
import type { Interest, ListingsData, ProcessedListing, Source } from "./types";

const DEFAULT_RADIUS = 25;
const PAGE_SIZE = 24;
const SORTS: [string, string][] = [["date", "Soonest"], ["distance", "Nearest"], ["relevance", "Best match"]];
const LOCATION_LABEL = "Manayunk";

type Status = "loading" | "ready" | "error";

export default function App() {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<ListingsData>({ origin: "", listings: [], generatedAt: null, count: 0 });

  const [sources, setSources] = useState<Record<Source, boolean>>({ net: true, org: true });
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [dateWindow, setDateWindow] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("date");
  const [onlyMatches, setOnlyMatches] = useState(false);
  const [inPersonOnly, setInPersonOnly] = useState(false);
  const [interests, setInterests] = useState<Interest[]>(() => load("wr:interests", []));
  const [saved, setSaved] = useState<Set<string>>(() => new Set(load<string[]>("wr:saved", [])));

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [mapOpen, setMapOpen] = useState(true);
  // Category tabs = tracked interests, for now purely cosmetic — not yet
  // wired to actual filtering. Revisit once there's a real taxonomy to
  // filter sales against.
  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    fetch(DATA_URL, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((d) => { setData(d); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => save("wr:interests", interests), [interests]);
  useEffect(() => save("wr:saved", [...saved]), [saved]);

  useEffect(() => {
    if (!selectedId) return;
    document.getElementById(`card-${selectedId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  // Reveal-more pagination resets whenever the active filter/sort set changes,
  // so switching filters never leaves you stranded three pages deep.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, dateWindow, radius, sources, onlyMatches, inPersonOnly, sort]);

  const activeTerms = interests.filter((i) => i.active).map((i) => i.term.toLowerCase());

  const toggleSource = (k: Source) => setSources((s) => ({ ...s, [k]: !s[k] }));
  const toggleInterest = (term: string) =>
    setInterests((list) => list.map((i) => (i.term === term ? { ...i, active: !i.active } : i)));
  const addInterest = (term: string) =>
    setInterests((list) => (list.some((i) => i.term === term) ? list : [...list, { term, active: true }]));
  const removeInterest = (term: string) =>
    setInterests((list) => list.filter((i) => i.term !== term));
  const toggleSaved = (id: string) =>
    setSaved((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const processed = useMemo<ProcessedListing[]>(() => {
    // Keep listings whose date couldn't be parsed instead of silently dropping
    // them — they surface as a "needs review" group at the end so bad scraper
    // data is visible rather than invisible.
    const today = startOfToday();
    return (data.listings || []).map((r) => {
      const start = parseDate(r.startDate);
      const end = parseDate(r.endDate) || start;
      // Sales that started before today but are still running (e.g. multi-week
      // online auctions) should read as happening "as of today", not as if they
      // started however long ago.
      const displayStart = start && start < today ? today : start;
      const hay = (r.title + " " + r.description).toLowerCase();
      const matches = activeTerms.filter((t) => hay.includes(t));
      return { ...r, start, end, displayStart, matches, relevance: matches.length };
    });
  }, [data, activeTerms.join(",")]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const today = startOfToday();
    return processed.filter((r) => {
      if (!sources[r.source]) return false;
      if (r.distanceMi != null && r.distanceMi > radius) return false;
      if (onlyMatches && r.relevance === 0) return false;
      if (inPersonOnly && r.saleType === "online") return false;
      if (q && !(r.title + " " + r.description + " " + r.company).toLowerCase().includes(q)) return false;
      if (!r.start) return true; // can't date-filter what we couldn't parse — always surface it
      if (r.end && r.end < today) return false; // hide finished sales
      if (dateWindow !== "all") {
        const days = Math.round((r.start.getTime() - today.getTime()) / 86400000);
        if (dateWindow === "7d" && days > 7) return false;
        if (dateWindow === "weekend") {
          if (days > 9) return false;
          const runsWeekend = eachDay(r.start, r.end ?? r.start).some((d) => [5, 6, 0].includes(d.getDay()));
          if (!runsWeekend) return false;
        }
      }
      return true;
    });
  }, [processed, sources, radius, onlyMatches, inPersonOnly, query, dateWindow]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const far = Number.POSITIVE_INFINITY;
    const time = (d: Date | null) => (d ? d.getTime() : far);
    const byValidity = (a: ProcessedListing, b: ProcessedListing) => (a.start ? 0 : 1) - (b.start ? 0 : 1); // undated always last
    if (sort === "distance") arr.sort((a, b) => byValidity(a, b) || (a.distanceMi ?? far) - (b.distanceMi ?? far));
    else if (sort === "relevance") arr.sort((a, b) => byValidity(a, b) || b.relevance - a.relevance || time(a.displayStart) - time(b.displayStart));
    else arr.sort((a, b) => byValidity(a, b) || time(a.displayStart) - time(b.displayStart) || (a.distanceMi ?? far) - (b.distanceMi ?? far));
    return arr;
  }, [filtered, sort]);

  const visibleSorted = sorted.slice(0, visibleCount);

  const groups = useMemo(() => {
    const map = new Map<string, { date: Date; items: ProcessedListing[] }>();
    const needsReview: ProcessedListing[] = [];
    for (const r of visibleSorted) {
      if (!r.displayStart) { needsReview.push(r); continue; }
      const key = r.displayStart.toDateString();
      if (!map.has(key)) map.set(key, { date: r.displayStart, items: [] });
      map.get(key)!.items.push(r);
    }
    const out: { date: Date | null; items: ProcessedListing[] }[] = [...map.values()];
    if (needsReview.length) out.push({ date: null, items: needsReview });
    return out;
  }, [visibleSorted]);

  const flat = sort !== "date";
  const sourceKeys = Object.keys(sources);
  const activeSources = Object.values(sources).filter(Boolean).length;

  const filterCount =
    (sourceKeys.length - activeSources) +
    (radius !== DEFAULT_RADIUS ? 1 : 0) +
    (onlyMatches ? 1 : 0) +
    (inPersonOnly ? 1 : 0) +
    (dateWindow !== "all" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const savedListings = useMemo(
    () => processed.filter((r) => saved.has(r.id)).sort((a, b) => (a.displayStart?.getTime() ?? 0) - (b.displayStart?.getTime() ?? 0)),
    [processed, saved]
  );

  const cardProps = (r: ProcessedListing, opts: Partial<{ showDate: boolean }> = {}) => ({
    r,
    terms: activeTerms,
    saved: saved.has(r.id),
    onSave: () => toggleSaved(r.id),
    selected: r.id === selectedId,
    onHoverStart: () => setHoveredId(r.id),
    onHoverEnd: () => setHoveredId(null),
    onSelect: () => setSelectedId(r.id),
    ...opts,
  });

  const titleCopy =
    dateWindow === "weekend" ? `This weekend near ${LOCATION_LABEL}`
    : dateWindow === "7d" ? `This week near ${LOCATION_LABEL}`
    : `Upcoming sales near ${LOCATION_LABEL}`;
  const daysNote = dateWindow === "weekend" ? "this weekend" : dateWindow === "7d" ? "in the next 7 days" : null;
  const subline =
    `${sorted.length} sale${sorted.length === 1 ? "" : "s"}${daysNote ? ` ${daysNote}` : ""} · within ${radius} mi` +
    (status === "ready" && data.generatedAt ? ` · updated ${relTime(data.generatedAt)}` : "");
  const sortLabel = SORTS.find(([v]) => v === sort)?.[1];

  const resultsHeader = (
    <div className="es-resultshdr">
      <div>
        <h1 className="es-resulttitle">{titleCopy}</h1>
        <p className="es-resultsub">{subline}</p>
      </div>
      <Menu.Root positioning={{ placement: "bottom-end" }}>
        <Menu.Trigger asChild>
          <button className="es-sortbtn" type="button">
            Sort: {sortLabel}
            <Icon name="chevronDown" size={12} />
          </button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content className="es-menu">
              {SORTS.map(([v, l]) => (
                <Menu.Item key={v} value={v} data-on={v === sort ? "true" : undefined} onSelect={() => setSort(v)}>
                  {l}
                </Menu.Item>
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </div>
  );

  const listContent = (
    <>
      {resultsHeader}

      {sorted.length === 0 && (
        <div className="es-empty">
          <h3>No sales match this filter</h3>
          <p>Widen the radius, clear the search, or turn a source back on to see more.</p>
        </div>
      )}

      {flat
        ? <div className="es-grid">{visibleSorted.map((r) => <Card key={r.id} {...cardProps(r, { showDate: true })} />)}</div>
        : groups.map((g) => {
            if (!g.date) {
              return (
                <section key="needs-review">
                  <div className="es-daybar">
                    <span className="es-daylabel">Needs review</span>
                    <span className="es-daydate">date didn't parse</span>
                    <span className="es-dayrule" />
                    <span className="es-daycount">{g.items.length} sale{g.items.length === 1 ? "" : "s"}</span>
                  </div>
                  <div className="es-grid">{g.items.map((r) => <Card key={r.id} {...cardProps(r, { showDate: true })} />)}</div>
                </section>
              );
            }
            const today = startOfToday();
            const soon = [5, 6, 0].includes(g.date.getDay());
            return (
              <section key={g.date.toDateString()}>
                <div className="es-daybar">
                  <span className={`es-daylabel${soon ? " es-wd" : ""}`}>{dayLabel(g.date, today)}</span>
                  <span className="es-daydate">{MONTHS[g.date.getMonth()]} {g.date.getDate()}</span>
                  <span className="es-dayrule" />
                  <span className="es-daycount">{g.items.length} sale{g.items.length === 1 ? "" : "s"}</span>
                </div>
                <div className="es-grid">{g.items.map((r) => <Card key={r.id} {...cardProps(r)} />)}</div>
              </section>
            );
          })}

      {sorted.length > 0 && (
        <div className="es-resultsfooter">
          <p>Showing {visibleSorted.length} of {sorted.length} sale{sorted.length === 1 ? "" : "s"} within {radius} mi</p>
          {visibleCount < sorted.length && (
            <button className="es-showmore" type="button" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>
              Show more sales
            </button>
          )}
        </div>
      )}
    </>
  );

  return (
    <div>
      <Header
        savedCount={saved.size}
        onOpenSaved={() => setSavedOpen(true)}
        onOpenPreferences={() => setPrefsOpen(true)}
        onOpenFilters={() => setFiltersOpen(true)}
        filterCount={filterCount}
        mapOn={mapOpen}
        onToggleMap={() => setMapOpen((v) => !v)}
        interests={interests}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <div className="es-mapshell">
        {status === "loading" && <div className="es-empty"><p>Loading sales…</p></div>}
        {status === "error" && (
          <div className="es-empty">
            <h3>Couldn't load listings</h3>
            <p>The data file didn't load. If you just deployed, give the first scrape run a minute, then refresh.</p>
          </div>
        )}

        {status === "ready" && (
          mapOpen ? (
            <div className="es-splitgrid" data-mobileview={mobileView}>
              <div className="es-listcol">{listContent}</div>
              <div className="es-mapcol">
                <MapView
                  listings={visibleSorted}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  onSelect={setSelectedId}
                  onHoverStart={setHoveredId}
                  onHoverEnd={() => setHoveredId(null)}
                />
              </div>
              <button
                className="es-mobiletoggle"
                onClick={() => setMobileView((v) => (v === "map" ? "list" : "map"))}
              >
                <Icon name={mobileView === "map" ? "list" : "map"} size={15} />
                {mobileView === "map" ? "List" : "Map"}
              </button>
            </div>
          ) : (
            <div className="es-listcol">{listContent}</div>
          )
        )}
      </div>

      <FilterModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        query={query}
        setQuery={setQuery}
        dateWindow={dateWindow}
        setDateWindow={setDateWindow}
        sources={sources}
        toggleSource={toggleSource}
        radius={radius}
        setRadius={setRadius}
        inPersonOnly={inPersonOnly}
        setInPersonOnly={setInPersonOnly}
        onlyMatches={onlyMatches}
        setOnlyMatches={setOnlyMatches}
      />

      <PreferencesModal
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        interests={interests}
        toggleInterest={toggleInterest}
        addInterest={addInterest}
        removeInterest={removeInterest}
      />

      <SavedModal
        open={savedOpen}
        onClose={() => setSavedOpen(false)}
        listings={savedListings}
        terms={activeTerms}
        onSave={toggleSaved}
      />
    </div>
  );
}
