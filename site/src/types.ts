export type Source = "net" | "org";

export interface Listing {
  id: string;
  source: Source;
  sourceUrl: string;
  title: string;
  company: string;
  addressLine: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  distanceMi: number | null;
  saleType: string;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  description: string;
  imageCount: number;
  imageUrl: string | null;
}

export interface ProcessedListing extends Listing {
  start: Date | null;
  end: Date | null;
  matches: string[];
  relevance: number;
}

export interface ListingsData {
  origin: string;
  generatedAt: string | null;
  count: number;
  listings: Listing[];
}

export interface Interest {
  term: string;
  active: boolean;
}
