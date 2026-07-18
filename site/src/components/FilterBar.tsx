import { Menu, Portal } from "@chakra-ui/react";
import Icon from "./Icon";

const SORTS: [string, string][] = [["date", "Soonest"], ["distance", "Nearest"], ["relevance", "Best match"]];
const WINDOWS: [string, string][] = [["weekend", "This weekend"], ["7d", "Next 7 days"], ["all", "All upcoming"]];

interface DropdownProps {
  label?: string;
  options: [string, string][];
  value: string;
  onChange: (value: string) => void;
}

function Dropdown({ label, options, value, onChange }: DropdownProps) {
  const current = options.find(([v]) => v === value)?.[1];
  return (
    <Menu.Root positioning={{ placement: "bottom-start" }}>
      <Menu.Trigger asChild>
        <button className="es-barbtn">
          {label ? `${label}: ${current}` : current}
          <Icon name="chevronDown" size={14} />
        </button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content className="es-menu">
            {options.map(([v, l]) => (
              <Menu.Item key={v} value={v} data-on={v === value ? "true" : undefined} onSelect={() => onChange(v)}>
                {l}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

interface FilterBarProps {
  query: string;
  setQuery: (v: string) => void;
  sort: string;
  setSort: (v: string) => void;
  dateWindow: string;
  setDateWindow: (v: string) => void;
  inPersonOnly: boolean;
  setInPersonOnly: (v: boolean) => void;
  onOpenFilters: () => void;
  filterCount: number;
  resultCount: number;
}

export default function FilterBar({
  query, setQuery, sort, setSort, dateWindow, setDateWindow,
  inPersonOnly, setInPersonOnly, onOpenFilters, filterCount, resultCount,
}: FilterBarProps) {
  return (
    <div className="es-filterbar">
      <div className="es-search es-search--bar">
        <span className="es-si"><Icon name="search" /></span>
        <input
          placeholder="Search titles, companies, descriptions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="es-barctl">
        <Dropdown options={WINDOWS} value={dateWindow} onChange={setDateWindow} />
        <Dropdown label="Sort" options={SORTS} value={sort} onChange={setSort} />
        <label className="es-barcheck" data-on={inPersonOnly || undefined}>
          <input type="checkbox" checked={inPersonOnly} onChange={(e) => setInPersonOnly(e.target.checked)} />
          <span className="es-barcheck-box"><Icon name="bookmarkFill" size={10} /></span>
          In-person only
        </label>
        <button className="es-barbtn es-barbtn--filters" data-active={filterCount > 0 || undefined} onClick={onOpenFilters}>
          <Icon name="filter" size={14} /> Filters
          {filterCount > 0 && <span className="es-filterbadge">{filterCount}</span>}
        </button>
      </div>

      <span className="es-rescount es-mono">{resultCount} sale{resultCount === 1 ? "" : "s"}</span>
    </div>
  );
}
