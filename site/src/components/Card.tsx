import { useState } from "react";
import {
  Badge, Box, Button, Card as ChakraCard, HStack, IconButton, Image, Tag, Text, VStack, Wrap,
} from "@chakra-ui/react";
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

const DESC_TRUNCATE_AT = 180;

export default function Card({ r, terms, saved, onSave, showDate, selected, onHoverStart, onHoverEnd, onSelect }: CardProps) {
  const src = SOURCES[r.source] || SOURCES.net;
  const times = fmtTime(r.startTime) && fmtTime(r.endTime) ? `${fmtTime(r.startTime)}–${fmtTime(r.endTime)}` : null;
  const [expanded, setExpanded] = useState(false);
  const isLong = r.description.length > DESC_TRUNCATE_AT;

  return (
    <ChakraCard.Root
      unstyled
      as="article"
      id={`card-${r.id}`}
      data-selected={selected ? "true" : undefined}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={onSelect}
      display="flex"
      flexDirection={{ base: "column", sm: "row" }}
      alignItems="stretch"
      gap="16px"
      bg="card"
      border="1px solid"
      borderColor="line"
      borderRadius="l3"
      boxShadow="var(--shadow)"
      p="16px"
      mb="12px"
      cursor="pointer"
      transition="transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease"
      css={{
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 2px 0 rgba(28, 37, 48, 0.05), 0 16px 30px -20px rgba(28, 37, 48, 0.5)",
        },
        "&[data-selected='true']": { borderColor: "match", boxShadow: "0 0 0 2px {colors.matchSoft}" },
      }}
    >
      <Box
        position="relative"
        w={{ base: "100%", sm: "170px" }}
        h={{ base: "200px", sm: "126px" }}
        borderRadius="l2"
        bg="paper2"
        border="1px solid"
        borderColor="line"
        display="flex"
        alignItems="center"
        justifyContent="center"
        color="inkSoft"
        overflow="hidden"
        flex="none"
      >
        {r.imageUrl ? (
          <Image w="100%" h="100%" objectFit="cover" src={r.imageUrl} alt="" loading="lazy" />
        ) : (
          <Icon name="img" size={18} />
        )}
        <Badge
          unstyled
          position="absolute"
          right="5px"
          bottom="5px"
          display="inline-flex"
          alignItems="center"
          gap="3px"
          bg="rgba(28, 37, 48, 0.7)"
          color="white"
          fontFamily="mono"
          fontSize="10px"
          px="6px"
          py="2px"
          borderRadius="20px"
        >
          <Icon name="img" size={11} />{r.imageCount}
        </Badge>
      </Box>

      <Box flex="1" minW={0}>
        <ChakraCard.Title
          as="h3"
          fontFamily="heading"
          fontWeight="600"
          fontSize="16px"
          lineHeight="1.25"
          m="0 0 4px"
          color="ink"
        >
          {r.title}
        </ChakraCard.Title>
        <Wrap gap="5px 12px" align="center" fontSize="12.5px" color="inkSoft" mb="8px">
          {r.company && <Text as="span" color="inkSoft">{r.company}</Text>}
          {r.addressLine && (
            <HStack as="span" gap="4px">
              <Icon name="pin" size={13} />{r.addressLine}{r.city ? `, ${r.city}` : ""}
            </HStack>
          )}
          {r.distanceMi != null && <Text as="span" fontFamily="mono" color="ink">{r.distanceMi.toFixed(1)} mi</Text>}
          {times && (
            <HStack as="span" gap="4px">
              <Icon name="clock" size={13} />{times}
            </HStack>
          )}
          <Badge
            unstyled
            fontFamily="mono"
            fontSize="10px"
            textTransform="uppercase"
            letterSpacing="0.06em"
            px="6px"
            py="2px"
            borderRadius="5px"
            bg="paper2"
            color="inkSoft"
          >
            {r.saleType}
          </Badge>
          {showDate && r.start && <Text as="span" fontFamily="mono" color="ink">{fmtRange(r.start, r.end)}</Text>}
          {showDate && !r.start && (
            <Text as="span" fontFamily="mono" color="ink" title="Raw scraper date fields">
              unparsed date: {r.startDate ?? "null"} → {r.endDate ?? "null"}
            </Text>
          )}
        </Wrap>
        {r.description && (
          <>
            <Text
              fontSize="13px"
              lineHeight="1.5"
              color="#3a444f"
              m={isLong ? "0 0 4px" : "0 0 10px"}
              lineClamp={expanded ? undefined : 3}
              css={{ "& mark": { background: "matchSoft", color: "match", fontWeight: "600", padding: "0 2px", borderRadius: "3px" } }}
            >
              {highlight(r.description, terms)}
            </Text>
            {isLong && (
              <Button
                unstyled
                type="button"
                display="inline-block"
                fontSize="12px"
                fontWeight="600"
                color="match"
                bg="none"
                border="none"
                p="0"
                mb="10px"
                cursor="pointer"
                css={{ "&:hover": { textDecoration: "underline" } }}
                onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              >
                {expanded ? "Show less" : "Read more"}
              </Button>
            )}
          </>
        )}
        {r.matches.length > 0 && (
          <Wrap gap="5px" align="center">
            <HStack as="span" gap="5px" fontFamily="mono" fontSize="10px" letterSpacing="0.06em" textTransform="uppercase" color="match">
              <Box as="span" w="6px" h="6px" borderRadius="50%" bg="match" />
              {r.matches.length} match{r.matches.length === 1 ? "" : "es"}
            </HStack>
            {r.matches.slice(0, 5).map((m) => (
              <Tag.Root key={m} unstyled bg="matchSoft" color="match" fontWeight="500" fontSize="11px" borderRadius="5px" px="7px" py="2px">
                <Tag.Label>{m}</Tag.Label>
              </Tag.Root>
            ))}
          </Wrap>
        )}
      </Box>

      <VStack
        direction={{ base: "row", sm: "column" }}
        align={{ base: "center", sm: "flex-end" }}
        justify="space-between"
        gap="10px"
        flex="none"
        w={{ base: "100%", sm: "auto" }}
      >
        <Badge
          unstyled
          display="inline-flex"
          alignItems="center"
          gap="6px"
          fontFamily="mono"
          fontSize="10px"
          letterSpacing="0.06em"
          color="inkSoft"
          border="1px solid"
          borderColor="line"
          px="8px"
          py="3px"
          borderRadius="20px"
          whiteSpace="nowrap"
        >
          <Box as="span" w="8px" h="8px" borderRadius="50%" bg={src.dot} />
          {src.code}
        </Badge>
        <HStack gap="8px">
          <Button
            unstyled
            display="inline-flex"
            alignItems="center"
            gap="6px"
            fontSize="12px"
            fontFamily="inherit"
            border="1px solid"
            borderColor={saved ? "ink" : "line"}
            bg={saved ? "ink" : "paper"}
            color={saved ? "paper" : "ink"}
            px="10px"
            py="6px"
            borderRadius="8px"
            cursor="pointer"
            transition="all 0.12s"
            whiteSpace="nowrap"
            css={{ "&:hover": { borderColor: "ink" } }}
            onClick={(e) => { e.stopPropagation(); onSave(); }}
          >
            <Icon name={saved ? "bookmarkFill" : "bookmark"} size={14} />{saved ? "Saved" : "Save"}
          </Button>
          {r.sourceUrl && (
            <IconButton
              asChild
              unstyled
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              fontSize="12px"
              border="1px solid"
              borderColor="line"
              bg="paper"
              color="inkSoft"
              px="10px"
              py="6px"
              borderRadius="8px"
              cursor="pointer"
              transition="all 0.12s"
              css={{ "&:hover": { borderColor: "ink" } }}
            >
              <a href={r.sourceUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                <Icon name="ext" size={14} />
              </a>
            </IconButton>
          )}
        </HStack>
      </VStack>
    </ChakraCard.Root>
  );
}
