import React, { useEffect, useMemo, useState } from "react";

const ORIGIN = "19127";

const SOURCES = {
  net: { code: "ES.NET", label: "estatesales.net", dot: "#2D6CDF" },
  org: { code: "ES.ORG", label: "estatesales.org", dot: "#7A4FBF" },
  com: { code: "ES.COM", label: "estatesale.com", dot: "#C77D18" },
};

const DEFAULT_INTERESTS = [
  "mid-century", "teak", "danish", "camera", "film",
  "guitar", "vinyl", "records", "cast iron", "lighting", "tools",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DATA_URL = `${import.meta.env.BASE_URL}listings.json`;

// --- small localStorage helpers (safe if storage is unavailable) ---
function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function parseDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return isNaN(d) ? null : d;
}
function fmtTime(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}
function fmtDay(d) { return `${WEEKDAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`; }
function fmtRange(a, b) {
  if (!a) return "";
  if (!b || a.getTime() === b.getTime()) return fmtDay(a);
  const sameMonth = a.getMonth() === b.getMonth();
  return `${WEEKDAYS[a.getDay()]}–${WEEKDAYS[b.getDay()]}, ${MONTHS[a.getMonth()]} ${a.getDate()}${sameMonth ? "" : " " + MONTHS[b.getMonth()]}–${b.getDate()}`;
}
function relTime(iso) {
  const then = new Date(iso);
  if (isNaN(then)) return "unknown";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

function Icon({ name, size = 16 }) {
  const c = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "pin") return <svg {...c}><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  if (name === "clock") return <svg {...c}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  if (name === "search") return <svg {...c}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
  if (name === "ext") return <svg {...c}><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;
  if (name === "bookmark") return <svg {...c}><path d="M6 4h12v16l-6-4-6 4z" /></svg>;
  if (name === "bookmarkFill") return <svg {...c} fill="currentColor"><path d="M6 4h12v16l-6-4-6 4z" /></svg>;
  if (name === "img") return <svg {...c}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="m21 16-5-5L5 21" /></svg>;
  return null;
}

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

export default function App() {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [data, setData] = useState({ listings: [], generatedAt: null });

  const [sources, setSources] = useState({ net: true, org: true, com: true });
  const [radius, setRadius] = useState(10);
  const [dateWindow, setDateWindow] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("date");
  const [onlyMatches, setOnlyMatches] = useState(false);
  const [interests, setInterests] = useState(() =>
    load("wr:interests", DEFAULT_INTERESTS.map((t) => ({ term: t, active: true })))
  );
  const [saved, setSaved] = useState(() => new Set(load("wr:saved", [])));

  useEffect(() => {
    fetch(DATA_URL, { cache: "no-store" })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((d) => { setData(d); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => save("wr:interests", interests), [interests]);
  useEffect(() => save("wr:saved", [...saved]), [saved]);

  const activeTerms = interests.filter((i) => i.active).map((i) => i.term.toLowerCase());

  const toggleSource = (k) => setSources((s) => ({ ...s, [k]: !s[k] }));
  const toggleInterest = (term) =>
    setInterests((list) => list.map((i) => (i.term === term ? { ...i, active: !i.active } : i)));
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
  }, [processed, sources, radius, onlyMatches, query, dateWindow]);

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

  return (
    <div>
      <header className="es-top">
        <div className="es-top-in">
          <div>
            <p className="es-eyebrow">Philadelphia · {ORIGIN}</p>
            <h1 className="es-title es-disp">Weekend Rounds</h1>
            <p className="es-sub">Estate sales near {ORIGIN}, three sources, one list.</p>
          </div>
          <div className="es-sync">
            {status === "ready" && data.generatedAt ? <>Synced <b>{relTime(data.generatedAt)}</b><br /></> : null}
            {activeSources} of 3 sources active
          </div>
        </div>
      </header>

      <div className="es-shell">
        <div className="es-search">
          <span className="es-si"><Icon name="search" /></span>
          <input
            placeholder="Search titles, companies, descriptions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="es-grid">
          <aside className="es-aside">
            <div className="es-panel">
              <p className="es-plabel">Sources</p>
              {Object.entries(SOURCES).map(([k, s]) => (
                <div key={k} className="es-row" data-on={sources[k]} onClick={() => toggleSource(k)}>
                  <span className="es-check"><Icon name="bookmarkFill" /></span>
                  <span className="es-dot" style={{ background: s.dot }} />
                  <span className="es-srcname">{s.label}</span>
                  <span className="es-srccode">{s.code}</span>
                </div>
              ))}
            </div>

            <div className="es-panel">
              <p className="es-plabel">Radius from {ORIGIN}</p>
              <input className="es-slider" type="range" min="1" max="25" value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
              <div className="es-radrow"><span>{radius} mi</span><span>max 25 mi</span></div>
            </div>

            <div className="es-panel">
              <p className="es-plabel">When</p>
              <div className="es-seg">
                {[["weekend", "WEEKEND"], ["7d", "7 DAYS"], ["all", "ALL"]].map(([v, l]) => (
                  <button key={v} data-on={dateWindow === v} onClick={() => setDateWindow(v)}>{l}</button>
                ))}
              </div>
            </div>

            <div className="es-panel">
              <p className="es-plabel">Sort</p>
              <div className="es-seg">
                {[["date", "SOONEST"], ["distance", "NEAREST"], ["relevance", "BEST MATCH"]].map(([v, l]) => (
                  <button key={v} data-on={sort === v} onClick={() => setSort(v)}>{l}</button>
                ))}
              </div>
            </div>

            <div className="es-panel">
              <p className="es-plabel">Tracked interests<span className="es-count es-mono" style={{ fontSize: 11 }}>{activeTerms.length}</span></p>
              <div className="es-chips">
                {interests.map((i) => (
                  <button key={i.term} className="es-chip" data-on={i.active} onClick={() => toggleInterest(i.term)}>{i.term}</button>
                ))}
              </div>
              <div className="es-row" data-on={onlyMatches} onClick={() => setOnlyMatches((v) => !v)} style={{ marginTop: 12 }}>
                <span className="es-check"><Icon name="bookmarkFill" /></span>
                <span className="es-srcname">Only show matches</span>
              </div>
            </div>
          </aside>

          <main>
            {status === "loading" && <div className="es-empty"><p>Loading sales…</p></div>}
            {status === "error" && (
              <div className="es-empty">
                <h3>Couldn't load listings</h3>
                <p>The data file didn't load. If you just deployed, give the first scrape run a minute, then refresh.</p>
              </div>
            )}

            {status === "ready" && (
              <>
                <div className="es-resulthdr">
                  <div />
                  <div className="es-rescount"><b>{sorted.length}</b> sale{sorted.length === 1 ? "" : "s"} · sorted by {sort === "date" ? "date" : sort === "distance" ? "distance" : "relevance"}</div>
                </div>

                {sorted.length === 0 && (
                  <div className="es-empty">
                    <h3>No sales match this filter</h3>
                    <p>Widen the radius, clear the search, or turn a source back on to see more.</p>
                  </div>
                )}

                {flat
                  ? sorted.map((r) => <Card key={r.id} r={r} terms={activeTerms} saved={saved.has(r.id)} onSave={() => toggleSaved(r.id)} showDate />)
                  : groups.map((g) => {
                      const soon = [5, 6, 0].includes(g.date.getDay());
                      return (
                        <section key={g.date.toDateString()}>
                          <div className="es-daybar">
                            <span className="es-daydate"><span className={soon ? "es-wd" : ""}>{WEEKDAYS[g.date.getDay()]}</span> · {MONTHS[g.date.getMonth()]} {g.date.getDate()}</span>
                            <span className="es-dayrule" />
                            <span className="es-daycount">{g.items.length} sale{g.items.length === 1 ? "" : "s"}</span>
                          </div>
                          {g.items.map((r) => <Card key={r.id} r={r} terms={activeTerms} saved={saved.has(r.id)} onSave={() => toggleSaved(r.id)} />)}
                        </section>
                      );
                    })}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function eachDay(a, b) {
  const out = [];
  const d = new Date(a);
  while (d <= b && out.length < 14) { out.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return out.length ? out : [a];
}

function highlight(text, terms) {
  if (!terms.length) return text;
  const esc = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${esc.join("|")})`, "gi");
  return text.split(re).map((p, i) =>
    terms.some((t) => t.toLowerCase() === p.toLowerCase())
      ? <mark key={i}>{p}</mark>
      : <React.Fragment key={i}>{p}</React.Fragment>
  );
}

function Card({ r, terms, saved, onSave, showDate }) {
  const src = SOURCES[r.source] || SOURCES.net;
  const times = fmtTime(r.startTime) && fmtTime(r.endTime) ? `${fmtTime(r.startTime)}–${fmtTime(r.endTime)}` : null;
  return (
    <article className="es-card">
      <div className="es-thumb"><Icon name="img" size={18} /><span>{r.imageCount}</span></div>

      <div>
        <h3 className="es-ctitle">{r.title}</h3>
        <div className="es-meta">
          {r.company && <span className="es-company">{r.company}</span>}
          {r.addressLine && <span className="es-mi"><Icon name="pin" size={13} />{r.addressLine}{r.city ? `, ${r.city}` : ""}</span>}
          {r.distanceMi != null && <span className="es-dist">{r.distanceMi.toFixed(1)} mi</span>}
          {times && <span className="es-mi"><Icon name="clock" size={13} />{times}</span>}
          <span className="es-type">{r.saleType}</span>
          {showDate && <span className="es-dist">{fmtRange(r.start, r.end)}</span>}
        </div>
        {r.description && <p className="es-desc">{highlight(r.description, terms)}</p>}
        {r.matches.length > 0 && (
          <div className="es-tags">
            <span className="es-scent"><span className="es-sdot" />{r.matches.length} match{r.matches.length === 1 ? "" : "es"}</span>
            {r.matches.slice(0, 5).map((m) => <span key={m} className="es-mtag">{m}</span>)}
          </div>
        )}
      </div>

      <div className="es-right">
        <span className="es-srcbadge"><span className="es-dot" style={{ background: src.dot }} />{src.code}</span>
        <div className="es-actions">
          <button className="es-btn" data-saved={saved} onClick={onSave}>
            <Icon name={saved ? "bookmarkFill" : "bookmark"} size={14} />{saved ? "Saved" : "Save"}
          </button>
          {r.sourceUrl && <a className="es-btn es-link" href={r.sourceUrl} target="_blank" rel="noreferrer"><Icon name="ext" size={14} /></a>}
        </div>
      </div>
    </article>
  );
}
