import type { SearchResult } from "@/types/log";

export const buildCopyText = (results: SearchResult[]) => results.map((result) => result.raw).join("\n");

export const buildTxtContent = buildCopyText;

export const buildCsvContent = (results: SearchResult[]) => {
  const header = ["시간", "후원자", "금액", "시그", "메시지", "매칭검색어", "원문"];
  const rows = results.map((result) => [
    result.time ?? "",
    result.donor,
    result.amount == null ? "" : String(result.amount),
    result.sig,
    result.message,
    result.matches.map((match) => match.term).join(", "),
    result.raw
  ]);

  return `\uFEFF${[header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}`;
};

export const escapeCsvCell = (value: string) => {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const buildFileSafeKeyword = (terms: string[]) => {
  const joined = terms.join("_").trim() || "timeline";
  return joined.replace(/[\\/:*?"<>|]/g, "_").slice(0, 36);
};

export const buildDateStamp = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};
