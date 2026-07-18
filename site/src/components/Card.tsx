import Icon from "./Icon";
import { SOURCES, fmtTime, fmtRange, highlight } from "../utils";
import type { ProcessedListing } from "../types";

interface CardProps {
  r: ProcessedListing;
  terms: string[];
  saved: boolean;
  onSave: () => void;
  showDate?: boolean;
  selected: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onSelect: () => void;
}

export default function Card({ r, terms, saved, onSave, showDate, selected, onHoverStart, onHoverEnd, onSelect }: CardProps) {
  const src = SOURCES[r.source] || SOURCES.net;
  const times = fmtTime(r.startTime) && fmtTime(r.endTime) ? `${fmtTime(r.startTime)}–${fmtTime(r.endTime)}` : null;

  return (
    <article
      id={`card-${r.id}`}
      className="es-card"
      data-selected={selected ? "true" : undefined}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={onSelect}
    >
      <div className="es-thumb">
        {r.imageUrl ? <img className="es-thumb-img" src={r.imageUrl} alt="" loading="lazy" /> : <Icon name="img" size={18} />}
        <span className="es-thumb-count"><Icon name="img" size={11} />{r.imageCount}</span>
      </div>

      <div>
        <h3 className="es-ctitle">{r.title}</h3>
        <div className="es-meta">
          {r.company && <span className="es-company">{r.company}</span>}
          {r.addressLine && <span className="es-mi"><Icon name="pin" size={13} />{r.addressLine}{r.city ? `, ${r.city}` : ""}</span>}
          {r.distanceMi != null && <span className="es-dist">{r.distanceMi.toFixed(1)} mi</span>}
          {times && <span className="es-mi"><Icon name="clock" size={13} />{times}</span>}
          <span className="es-type">{r.saleType}</span>
          {showDate && r.start && <span className="es-dist">{fmtRange(r.start, r.end)}</span>}
          {showDate && !r.start && (
            <span className="es-dist" title="Raw scraper date fields">
              unparsed date: {r.startDate ?? "null"} → {r.endDate ?? "null"}
            </span>
          )}
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
          <button className="es-btn" data-saved={saved} onClick={(e) => { e.stopPropagation(); onSave(); }}>
            <Icon name={saved ? "bookmarkFill" : "bookmark"} size={14} />{saved ? "Saved" : "Save"}
          </button>
          {r.sourceUrl && (
            <a className="es-btn es-link" href={r.sourceUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              <Icon name="ext" size={14} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
