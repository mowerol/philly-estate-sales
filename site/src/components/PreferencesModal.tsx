import { useState, type FormEvent } from "react";
import { Dialog, Portal, CloseButton } from "@chakra-ui/react";
import Icon from "./Icon";
import { ORIGIN } from "../utils";
import type { Interest } from "../types";

interface PreferencesModalProps {
  open: boolean;
  onClose: () => void;
  interests: Interest[];
  toggleInterest: (term: string) => void;
  addInterest: (term: string) => void;
  removeInterest: (term: string) => void;
}

export default function PreferencesModal({ open, onClose, interests, toggleInterest, addInterest, removeInterest }: PreferencesModalProps) {
  const [draft, setDraft] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = draft.trim().toLowerCase();
    if (!term) return;
    addInterest(term);
    setDraft("");
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} placement="center" size="md">
      <Portal>
        <Dialog.Backdrop className="es-dialog-backdrop" />
        <Dialog.Positioner>
          <Dialog.Content className="es-dialog">
            <Dialog.Header className="es-dialog-hdr">
              <Dialog.Title className="es-dialog-title">Preferences</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body className="es-dialog-body">
              <div className="es-panel">
                <p className="es-plabel">Location</p>
                <div className="es-locrow">
                  <Icon name="pin" size={14} />
                  Manayunk, Philadelphia · {ORIGIN}
                </div>
                <p className="es-hint">Hardcoded for now — changing search locations isn't wired up yet.</p>
              </div>

              <div className="es-panel">
                <p className="es-plabel">Tracked interests</p>
                <p className="es-hint">Sales mentioning these get highlighted and can be filtered to matches only.</p>
                <div className="es-chips">
                  {interests.map((i) => (
                    <span key={i.term} className="es-chip es-chip--removable" data-on={i.active}>
                      <button type="button" onClick={() => toggleInterest(i.term)}>{i.term}</button>
                      <button type="button" className="es-chipx" onClick={() => removeInterest(i.term)} aria-label={`Remove ${i.term}`}>
                        <Icon name="close" size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <form className="es-addrow" onSubmit={submit}>
                  <input
                    placeholder="Add a keyword…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <button type="submit" className="es-barbtn">
                    <Icon name="plus" size={14} /> Add
                  </button>
                </form>
              </div>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
