import { Dialog, Portal, CloseButton } from "@chakra-ui/react";
import Card from "./Card";
import type { ProcessedListing } from "../types";

const noop = () => {};

interface SavedModalProps {
  open: boolean;
  onClose: () => void;
  listings: ProcessedListing[];
  terms: string[];
  onSave: (id: string) => void;
}

export default function SavedModal({ open, onClose, listings, terms, onSave }: SavedModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} placement="center" size="lg">
      <Portal>
        <Dialog.Backdrop className="es-dialog-backdrop" />
        <Dialog.Positioner>
          <Dialog.Content className="es-dialog es-dialog--wide">
            <Dialog.Header className="es-dialog-hdr">
              <Dialog.Title className="es-dialog-title">Saved sales</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body className="es-dialog-body">
              {listings.length === 0 && (
                <div className="es-empty">
                  <h3>Nothing saved yet</h3>
                  <p>Tap "Save" on any sale to keep it here.</p>
                </div>
              )}
              {listings.map((r) => (
                <Card
                  key={r.id}
                  r={r}
                  terms={terms}
                  saved
                  onSave={() => onSave(r.id)}
                  showDate
                  selected={false}
                  onHoverStart={noop}
                  onHoverEnd={noop}
                  onSelect={noop}
                />
              ))}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
