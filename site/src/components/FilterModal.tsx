import { Dialog, Portal, CloseButton } from "@chakra-ui/react";
import Icon from "./Icon";
import { SOURCES, ORIGIN } from "../utils";
import type { Source } from "../types";

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  sources: Record<Source, boolean>;
  toggleSource: (key: Source) => void;
  radius: number;
  setRadius: (v: number) => void;
  onlyMatches: boolean;
  setOnlyMatches: (updater: (v: boolean) => boolean) => void;
}

export default function FilterModal({
  open,
  onClose,
  sources,
  toggleSource,
  radius,
  setRadius,
  onlyMatches,
  setOnlyMatches,
}: FilterModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} placement="center" size="md">
      <Portal>
        <Dialog.Backdrop className="es-dialog-backdrop" />
        <Dialog.Positioner>
          <Dialog.Content className="es-dialog">
            <Dialog.Header className="es-dialog-hdr">
              <Dialog.Title className="es-dialog-title">Filters</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body className="es-dialog-body">
              <div className="es-panel">
                <p className="es-plabel">Sources</p>
                {(Object.entries(SOURCES) as [Source, (typeof SOURCES)[Source]][]).map(([k, s]) => (
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
                <input
                  className="es-slider"
                  type="range"
                  min="1"
                  max="25"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                />
                <div className="es-radrow"><span>{radius} mi</span><span>max 25 mi</span></div>
              </div>

              <div className="es-panel">
                <div className="es-row" data-on={onlyMatches} onClick={() => setOnlyMatches((v) => !v)}>
                  <span className="es-check"><Icon name="bookmarkFill" /></span>
                  <span className="es-srcname">Only show tracked-interest matches</span>
                </div>
              </div>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
