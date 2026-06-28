const RECENT_KEY = "timeline-organizer:recent-searches";
const MAX_RECENT = 5;

export const getRecentSearches = () => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
};

export const saveRecentSearch = (input: string) => {
  const cleaned = input.trim();
  if (!cleaned) return getRecentSearches();
  const next = [cleaned, ...getRecentSearches().filter((item) => item !== cleaned)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
};
