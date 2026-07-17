import { useEffect, useMemo, useState } from "react";
import Card from "./components/Card.jsx";
import MapView from "./components/MapView.jsx";
import FilterBar from "./components/FilterBar.jsx";
import FilterModal from "./components/FilterModal.jsx";
import Sidebar from "./components/Sidebar.jsx";
import PreferencesModal from "./components/PreferencesModal.jsx";
import SavedModal from "./components/SavedModal.jsx";
import Icon from "./components/Icon.jsx";
import {
  ORIGIN, DEFAULT_INTERESTS, WEEKDAYS, MONTHS, DATA_URL,
  load, save, parseDate, relTime, startOfToday, eachDay,
} from "./utils.jsx";

const DEFAULT_RADIUS = 10;

export default function App() {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [data, setData] = useState({ listings: [], generatedAt: null });

  const [sources, setSources] = useState({ net: true, org: true, com: true });
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [dateWindow, setDateWindow] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("date");
  const [onlyMatches, setOnlyMatches] = useState(false);
  const [inPersonOnly, setInPersonOnly] = useState(false);
  const [interests, setInterests] = useState(() =>
    load("wr:interests", DEFAULT_INTERESTS.map((t) => ({ term: t, active: true })))
  );
  const [saved, setSaved] = useState(() => new Set(load("wr:saved", [])));

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [mobileView, setMobileView] = useState("list"); // list | map

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

  const activeTerms = interests.filter((i) => i.active).map((i) => i.term.toLowerCase());

  const toggleSource = (k) => setSources((s) => ({ ...s, [k]: !s[k] }));
  const toggleInterest = (term) =>
    setInterests((list) => list.map((i) => (i.term === term ? { ...i, active: !i.active } : i)));
  const addInterest = (term) =>
    setInterests((list) => (list.some((i) => i.term === term) ? list : [...list, { term, active: true }]));
  const removeInterest = (term) =>
    setInterests((list) => list.filter((i) => i.term !== term));
  const toggleSaved = (id) =>
    setSaved((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const processed = useMemo(() => {
    return (data.listings || []).map((r) => {
      const start = parseDate(r.startDate);
      const end = parseDate(r.endDate) || start;
      const hay = (r.title + " " + r.description).toLowerCase();
      const matches = activeTerms.filter((t) => hay.includes(t));
      return { ...r, start, end, matches, relevance: matches.length };
    }).filter((r) => r.start);
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
      if (r.end < today) return false; // hide finished sales
      if (dateWindow !== "all") {
        const days = Math.round((r.start - today) / 86400000);
        if (dateWindow === "7d" && days > 7) return false;
        if (dateWindow === "weekend") {
          if (days > 9) return false;
          const runsWeekend = eachDay(r.start, r.end).some((d) => [5, 6, 0].includes(d.getDay()));
          if (!runsWeekend) return false;
        }
      }
      return true;
    });
  }, [processed, sources, radius, onlyMatches, inPersonOnly, query, dateWindow]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const far = Number.POSITIVE_INFINITY;
    if (sort === "distance") arr.sort((a, b) => (a.distanceMi ?? far) - (b.distanceMi ?? far));
    else if (sort === "relevance") arr.sort((a, b) => b.relevance - a.relevance || a.start - b.start);
    else arr.sort((a, b) => a.start - b.start || (a.distanceMi ?? far) - (b.distanceMi ?? far));
    return arr;
  }, [filtered, sort]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const r of sorted) {
      const key = r.start.toDateString();
      if (!map.has(key)) map.set(key, { date: r.start, items: [] });
      map.get(key).items.push(r);
    }
    return [...map.values()];
  }, [sorted]);

  const flat = sort !== "date";
  const activeSources = Object.values(sources).filter(Boolean).length;

  const filterCount =
    (3 - activeSources) +
    (radius !== DEFAULT_RADIUS ? 1 : 0) +
    (onlyMatches ? 1 : 0);

  const savedListings = useMemo(
    () => processed.filter((r) => saved.has(r.id)).sort((a, b) => a.start - b.start),
    [processed, saved]
  );

  const cardProps = (r, opts = {}) => ({
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

  return (
    <div>
      <header className="es-top">
        <div className="es-top-in">
          <div className="es-brand">
            <span className="es-brandmark" />
            <h1 className="es-title es-disp">Estate Sales Watch</h1>
          </div>
          <div className="es-locwrap">
            <button className="es-locpill" type="button">
              <Icon name="pin" size={13} />
              Manayunk, Philadelphia · {ORIGIN}
              <Icon name="chevronDown" size={12} />
            </button>
            <span className="es-sync es-mono">
              {status === "ready" && data.generatedAt ? <>Synced <b>{relTime(data.generatedAt)}</b> · </> : null}
              {activeSources}/3 sources
            </span>
          </div>
        </div>
      </header>

      <Sidebar
        onOpenPreferences={() => setPrefsOpen(true)}
        onOpenSaved={() => setSavedOpen(true)}
        savedCount={saved.size}
      />
      <div className="es-page">
      {status === "ready" && (
        <FilterBar
          query={query}
          setQuery={setQuery}
          sort={sort}
          setSort={setSort}
          dateWindow={dateWindow}
          setDateWindow={setDateWindow}
          inPersonOnly={inPersonOnly}
          setInPersonOnly={setInPersonOnly}
          onOpenFilters={() => setFiltersOpen(true)}
          filterCount={filterCount}
          resultCount={sorted.length}
        />
      )}

      <div className="es-mapshell">
        {status === "loading" && <div className="es-empty"><p>Loading sales…</p></div>}
        {status === "error" && (
          <div className="es-empty">
            <h3>Couldn't load listings</h3>
            <p>The data file didn't load. If you just deployed, give the first scrape run a minute, then refresh.</p>
          </div>
        )}

        {status === "ready" && (
          <div className="es-splitgrid" data-mobileview={mobileView}>
            <div className="es-mapcol">
              <MapView
                listings={sorted}
                selectedId={selectedId}
                hoveredId={hoveredId}
                onSelect={setSelectedId}
                onHoverStart={setHoveredId}
                onHoverEnd={() => setHoveredId(null)}
              />
            </div>

            <div className="es-listcol">
              {sorted.length === 0 && (
                <div className="es-empty">
                  <h3>No sales match this filter</h3>
                  <p>Widen the radius, clear the search, or turn a source back on to see more.</p>
                </div>
              )}

              {flat
                ? sorted.map((r) => <Card key={r.id} {...cardProps(r, { showDate: true })} />)
                : groups.map((g) => {
                    const soon = [5, 6, 0].includes(g.date.getDay());
                    return (
                      <section key={g.date.toDateString()}>
                        <div className="es-daybar">
                          <span className="es-daydate"><span className={soon ? "es-wd" : ""}>{WEEKDAYS[g.date.getDay()]}</span> · {MONTHS[g.date.getMonth()]} {g.date.getDate()}</span>
                          <span className="es-dayrule" />
                          <span className="es-daycount">{g.items.length} sale{g.items.length === 1 ? "" : "s"}</span>
                        </div>
                        {g.items.map((r) => <Card key={r.id} {...cardProps(r)} />)}
                      </section>
                    );
                  })}
            </div>

            <button
              className="es-mobiletoggle"
              onClick={() => setMobileView((v) => (v === "map" ? "list" : "map"))}
            >
              <Icon name={mobileView === "map" ? "list" : "map"} size={15} />
              {mobileView === "map" ? "List" : "Map"}
            </button>
          </div>
        )}
      </div>

      <FilterModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        sources={sources}
        toggleSource={toggleSource}
        radius={radius}
        setRadius={setRadius}
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
    </div>
  );
}
