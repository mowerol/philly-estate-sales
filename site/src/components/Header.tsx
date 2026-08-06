import Icon from "./Icon";
import type { Interest } from "../types";

// Small house mark, standalone (not the old dark-header wordmark lockup, which
// bakes white text + a mint gradient meant for a dark background — unusable on
// the new light header). Matches the prototype's inline brand icon.
function BrandMark() {
  return (
    <svg width="26" height="30" viewBox="0 0 26 30" fill="none">
      <path
        d="M13 1.5 24.5 9v14.5A5 5 0 0 1 19.5 28h-13a5 5 0 0 1-5-4.5V9L13 1.5Z"
        fill="var(--match)"
      />
      <rect x="9" y="12" width="3.2" height="3.2" rx=".8" fill="var(--paper)" />
      <rect x="13.8" y="12" width="3.2" height="3.2" rx=".8" fill="var(--paper)" />
      <rect x="9" y="16.8" width="3.2" height="3.2" rx=".8" fill="var(--paper)" />
      <rect x="13.8" y="16.8" width="3.2" height="3.2" rx=".8" fill="var(--paper)" />
      <circle cx="13" cy="7.4" r="1.5" fill="var(--paper)" />
    </svg>
  );
}

interface HeaderProps {
  savedCount: number;
  onOpenSaved: () => void;
  onOpenPreferences: () => void;
  onOpenFilters: () => void;
  filterCount: number;
  mapOn: boolean;
  onToggleMap: () => void;
  interests: Interest[];
  activeCategory: string;
  onCategoryChange: (label: string) => void;
}

export default function Header({
  savedCount, onOpenSaved, onOpenPreferences, onOpenFilters, filterCount,
  mapOn, onToggleMap, interests, activeCategory, onCategoryChange,
}: HeaderProps) {
  // Categories = tracked interests for now (not yet wired to actual
  // filtering — selecting one just moves the underline). Revisit once
  // there's a real category taxonomy to filter against.
  const categories = ["All", ...interests.map((i) => i.term)];

  return (
    <header className="es-header">
      <div className="es-header-row1">
        <div className="es-brand2">
          <BrandMark />
          <span className="es-wordmark">AllEstateSales</span>
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div className="es-searchpill">
            {/* Where / When are hardcoded for now — no location or date-range
                picker wired up yet (mirrors the same hardcoded note in
                Preferences for location). */}
            <button className="es-pillseg" type="button">
              <div className="es-pillseg-label">Where</div>
              <div className="es-pillseg-value">Manayunk, Philadelphia</div>
            </button>
            <div className="es-pilldiv" />
            <button className="es-pillseg" type="button">
              <div className="es-pillseg-label">When</div>
              <div className="es-pillseg-value">Next 7 days</div>
            </button>
            <button className="es-pillsubmit" type="button" aria-label="Search">
              <Icon name="search" size={17} />
            </button>
          </div>
        </div>

        <div className="es-headerright">
          <button className="es-iconbtn" onClick={onOpenPreferences} type="button" aria-label="Preferences" title="Preferences">
            <Icon name="gear" size={17} />
          </button>
          <button className="es-savedbtn" onClick={onOpenSaved} type="button">
            <Icon name="bookmark" size={15} />
            Saved
            <span className="es-savedcount">{savedCount}</span>
          </button>
        </div>
      </div>

      <div className="es-header-row2-wrap">
        <div className="es-header-row2">
          <div className="es-cattabs">
            {categories.map((c) => (
              <button
                key={c}
                className="es-cattab"
                data-on={c === activeCategory || undefined}
                onClick={() => onCategoryChange(c)}
                type="button"
              >
                {c}
              </button>
            ))}
          </div>
          <div className="es-headerctl">
            <button className="es-barbtn" onClick={onToggleMap} type="button">
              <Icon name="map" size={14} />
              {mapOn ? "Hide map" : "Show map"}
            </button>
            <button className="es-barbtn es-barbtn--filters" data-active={filterCount > 0 || undefined} onClick={onOpenFilters} type="button">
              <Icon name="filter" size={14} /> Filters
              {filterCount > 0 && <span className="es-filterbadge">{filterCount}</span>}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
