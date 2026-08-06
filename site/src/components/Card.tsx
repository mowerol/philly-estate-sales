import { Badge, Box, Button, Card as ChakraCard, HStack, Image, Tag, Text, Wrap } from "@chakra-ui/react";
import Icon from "./Icon";
import { fmtTime, fmtRange, highlight } from "../utils";
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

const SALE_TYPE_LABEL: Record<string, string> = {
  estate: "ESTATE", moving: "MOVING", tag: "TAG", auction: "AUCTION", online: "ONLINE", garage: "GARAGE",
};

// Hover already links a card to its map marker (see MapView's active pill
// state) — a click's job is to take you to the actual listing, not to
// re-highlight what hovering already highlighted. `onSelect` stays part of
// the props contract (still used the other direction: clicking a map marker
// selects + scrolls to its card) even though the card itself no longer calls it.
export default function Card({ r, terms, saved, onSave, showDate, selected, onHoverStart, onHoverEnd }: CardProps) {
  const times = fmtTime(r.startTime) && fmtTime(r.endTime) ? `${fmtTime(r.startTime)}–${fmtTime(r.endTime)}` : null;
  const openListing = () => { if (r.sourceUrl) window.open(r.sourceUrl, "_blank", "noopener,noreferrer"); };

  return (
    <ChakraCard.Root
      unstyled
      as="article"
      id={`card-${r.id}`}
      data-selected={selected ? "true" : undefined}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={openListing}
      cursor="pointer"
      transition="opacity 0.14s ease"
      css={{
        "&:hover": { opacity: 0.94 },
        "&[data-selected='true'] .es-card-frame": { boxShadow: "0 0 0 2px {colors.match}" },
      }}
    >
      <Box className="es-card-frame" position="relative" borderRadius="l4" overflow="hidden" bg="paper2" aspectRatio="4 / 3" transition="box-shadow 0.14s ease">
        {r.imageUrl ? (
          <Image w="100%" h="100%" objectFit="cover" src={r.imageUrl} alt="" loading="lazy" />
        ) : (
          <Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center" color="inkMuted">
            <Icon name="img" size={22} />
          </Box>
        )}

        <Button
          unstyled
          type="button"
          aria-label={saved ? "Remove from saved" : "Save sale"}
          position="absolute"
          top="10px"
          right="10px"
          w="32px"
          h="32px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="none"
          borderRadius="999px"
          bg="rgba(255,255,255,.92)"
          backdropFilter="blur(4px)"
          boxShadow="0 2px 8px rgba(22,33,28,.18)"
          cursor="pointer"
          transition="background 0.12s"
          css={{ "&:hover": { background: "#fff" } }}
          onClick={(e) => { e.stopPropagation(); onSave(); }}
        >
          <Icon name={saved ? "bookmarkFill" : "bookmark"} size={15} />
        </Button>

        <HStack position="absolute" left="10px" bottom="10px" gap="6px">
          <Badge unstyled fontFamily="mono" fontSize="10.5px" fontWeight="700" letterSpacing="0.06em" color="ink" bg="rgba(255,255,255,.94)" borderRadius="6px" px="8px" py="5px">
            {SALE_TYPE_LABEL[r.saleType] || r.saleType.toUpperCase()}
          </Badge>
          <Badge unstyled display="inline-flex" alignItems="center" gap="4px" fontFamily="mono" fontSize="10.5px" color="ink" bg="rgba(255,255,255,.94)" borderRadius="6px" px="8px" py="5px">
            <Icon name="img" size={10} />{r.imageCount}
          </Badge>
        </HStack>
      </Box>

      <Box pt="12px" px="2px">
        <HStack align="baseline" justify="space-between" gap="12px">
          <ChakraCard.Title
            as="h3"
            fontFamily="body"
            fontWeight="600"
            fontSize="15px"
            lineHeight="1.32"
            letterSpacing="-0.008em"
            m="0"
            color="ink"
            lineClamp={2}
            css={{ "& mark": { background: "matchSoft", color: "matchDeep", fontWeight: "700", padding: "0 2px", borderRadius: "3px" } }}
          >
            {highlight(r.title, terms)}
          </ChakraCard.Title>
          {r.distanceMi != null && (
            <Text as="span" fontFamily="mono" fontSize="11.5px" color="inkSoft" whiteSpace="nowrap" flex="none">
              {r.distanceMi.toFixed(1)} mi
            </Text>
          )}
        </HStack>

        {r.company && (
          <Text mt="6px" fontSize="13px" color="inkSoft" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
            {r.company}
          </Text>
        )}

        <Wrap mt="8px" gap="5px 8px" align="center" fontSize="13px">
          {times && <Text as="span" fontWeight="600" color="ink">{times}</Text>}
          {times && (r.addressLine || r.city) && <Text as="span" color="lineStrong">·</Text>}
          {(r.addressLine || r.city) && (
            <Text as="span" color="inkSoft" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
              {r.addressLine}{r.addressLine && r.city ? ", " : ""}{r.city}
            </Text>
          )}
          {showDate && r.displayStart && (
            <Text as="span" fontFamily="mono" fontSize="11.5px" color="inkMuted">· {fmtRange(r.displayStart, r.end)}</Text>
          )}
          {showDate && !r.displayStart && (
            <Text as="span" fontFamily="mono" fontSize="11.5px" color="signal" title="Raw scraper date fields">
              · unparsed date: {r.startDate ?? "null"} → {r.endDate ?? "null"}
            </Text>
          )}
        </Wrap>

        {r.matches.length > 0 && (
          <Wrap mt="9px" gap="5px" align="center">
            <HStack gap="5px" fontFamily="mono" fontSize="10px" letterSpacing="0.06em" textTransform="uppercase" color="match">
              <Box w="6px" h="6px" borderRadius="50%" bg="match" />
              {r.matches.length} match{r.matches.length === 1 ? "" : "es"}
            </HStack>
            {r.matches.slice(0, 4).map((m) => (
              <Tag.Root key={m} unstyled bg="matchSoft" color="matchDeep" fontWeight="500" fontSize="11px" borderRadius="5px" px="7px" py="2px">
                <Tag.Label>{m}</Tag.Label>
              </Tag.Root>
            ))}
          </Wrap>
        )}

        {r.sourceUrl && (
          <Box mt="9px">
            <a
              href={r.sourceUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, color: "var(--match)" }}
            >
              View listing <Icon name="ext" size={11} />
            </a>
          </Box>
        )}
      </Box>
    </ChakraCard.Root>
  );
}
