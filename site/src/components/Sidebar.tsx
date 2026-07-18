import Icon from "./Icon";

interface SidebarProps {
  onOpenPreferences: () => void;
  onOpenSaved: () => void;
  savedCount: number;
}

export default function Sidebar({ onOpenPreferences, onOpenSaved, savedCount }: SidebarProps) {
  return (
    <nav className="es-rail">
      <button className="es-railitem" data-active="true" type="button">
        <Icon name="search" size={19} />
        <span>Search</span>
      </button>
      <button className="es-railitem" onClick={onOpenPreferences} type="button">
        <Icon name="gear" size={19} />
        <span>Prefs</span>
      </button>
      <button className="es-railitem" onClick={onOpenSaved} type="button">
        <Icon name="bookmarkFill" size={19} />
        <span>Saved</span>
        {savedCount > 0 && <span className="es-railbadge">{savedCount}</span>}
      </button>
    </nav>
  );
}
