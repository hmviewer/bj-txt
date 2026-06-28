import type { InitialMatchMode, MatchLabel, ParsedLogLine, SearchResult, SearchScope, SearchTerm, SortOrder } from "@/types/log";
import { isInitialSearchTerm, toChoseongText } from "./choseong";

type SearchOptions = {
  initialMatchMode?: InitialMatchMode;
};

export const parseSearchTerms = (input: string): SearchTerm[] => {
  const seen = new Set<string>();

  return input
    .split(/[,\n]/)
    .map((term) => term.trim())
    .filter(Boolean)
    .map((raw) => ({
      raw,
      normalized: raw.toLocaleLowerCase("ko-KR"),
      isInitial: isInitialSearchTerm(raw)
    }))
    .filter((term) => {
      const key = `${term.normalized}:${term.isInitial}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export const searchLogs = (
  lines: ParsedLogLine[],
  terms: SearchTerm[],
  scope: SearchScope,
  sortOrder: SortOrder,
  options: SearchOptions = {}
): SearchResult[] => {
  if (terms.length === 0) return [];

  const initialMatchMode = options.initialMatchMode ?? "candidate";
  const hasTextTerm = terms.some((term) => !term.isInitial);

  const results = lines.flatMap((line) => {
    const target = scope === "message" ? line.message : line.raw;
    if (scope === "message" && !line.message) return [];

    const normalizedTarget = target.toLocaleLowerCase("ko-KR");
    const targetInitials = toChoseongText(target);
    const allMatches = terms.flatMap<MatchLabel>((term) => {
      const matchedByText = normalizedTarget.includes(term.normalized);
      const matchedByInitial = term.isInitial && targetInitials.includes(term.raw);

      if (matchedByText && matchedByInitial) {
        return [{ term: term.raw, type: "text" as const }];
      }
      if (matchedByText) return [{ term: term.raw, type: "text" as const }];
      if (matchedByInitial) return [{ term: term.raw, type: "initial" as const }];
      return [];
    });
    const hasTextMatch = allMatches.some((match) => match.type === "text");
    const hasOnlyGuardedInitialMatch = initialMatchMode === "guarded" && hasTextTerm && !hasTextMatch;
    const matches = hasOnlyGuardedInitialMatch ? [] : allMatches;

    if (matches.length === 0) return [];
    return [{ ...line, matches }];
  });

  return results.sort((a, b) => {
    const timeA = timeToSeconds(a.time);
    const timeB = timeToSeconds(b.time);
    const diff = timeA - timeB || a.lineNumber - b.lineNumber;
    return sortOrder === "asc" ? diff : -diff;
  });
};

export const timeToSeconds = (time: string | null) => {
  if (!time) return Number.MAX_SAFE_INTEGER;
  const [hours, minutes, seconds] = time.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};
