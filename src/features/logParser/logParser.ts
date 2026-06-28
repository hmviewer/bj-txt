import type { ParsedLogLine } from "@/types/log";

const TIME_PREFIX = /^\[\s*(\d{2}:\d{2}:\d{2})\s*\]\s*(.*)$/;
const MESSAGE_PATTERN = /\|\s*"([^"]*)"\s*$/;
const SIG_PATTERN = /\[시그\]\s*([\d,]+개)/;

export const parseLogText = (text: string): ParsedLogLine[] => {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line, index, lines) => !(index === lines.length - 1 && line.trim() === ""))
    .map((raw, index) => parseLogLine(raw, index + 1));
};

export const parseLogLine = (raw: string, lineNumber: number): ParsedLogLine => {
  const base: ParsedLogLine = {
    id: `${lineNumber}-${raw}`,
    lineNumber,
    raw,
    time: null,
    donor: "",
    amount: null,
    sig: "",
    message: "",
    parseStatus: "failed"
  };

  const timeMatch = raw.match(TIME_PREFIX);
  if (!timeMatch) return base;

  const time = timeMatch[1];
  const rest = timeMatch[2];
  const messageMatch = rest.match(MESSAGE_PATTERN);
  const message = messageMatch?.[1] ?? "";
  const beforeMessage = messageMatch ? rest.slice(0, messageMatch.index).trim() : rest.trim();
  const beforePipe = beforeMessage.endsWith("|") ? beforeMessage.slice(0, -1).trim() : beforeMessage;
  const sig = beforePipe.match(SIG_PATTERN)?.[1] ?? "";
  const withoutSig = beforePipe.replace(SIG_PATTERN, "").trim();
  const amountMatch = withoutSig.match(/^(.*?)(?:\s+)([\d,]+)\s*$/);

  if (!amountMatch) {
    return {
      ...base,
      time,
      message,
      parseStatus: message ? "partial" : "failed"
    };
  }

  return {
    ...base,
    time,
    donor: amountMatch[1].trim(),
    amount: Number(amountMatch[2].replace(/,/g, "")),
    sig,
    message,
    parseStatus: "parsed"
  };
};
