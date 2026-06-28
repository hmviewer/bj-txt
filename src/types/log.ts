export type ParsedLogLine = {
  id: string;
  lineNumber: number;
  raw: string;
  time: string | null;
  donor: string;
  amount: number | null;
  sig: string;
  message: string;
  parseStatus: "parsed" | "partial" | "failed";
};

export type SearchScope = "message" | "full";
export type SortOrder = "asc" | "desc";

export type SearchTerm = {
  raw: string;
  normalized: string;
  isInitial: boolean;
};

export type MatchLabel = {
  term: string;
  type: "text" | "initial";
};

export type SearchResult = ParsedLogLine & {
  matches: MatchLabel[];
};
