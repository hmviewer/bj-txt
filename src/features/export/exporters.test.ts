import { describe, expect, it } from "vitest";
import { parseLogText } from "@/features/logParser/logParser";
import { SAMPLE_LOG } from "@/features/sample/sampleLog";
import { parseSearchTerms, searchLogs } from "@/features/search/searchEngine";
import { buildCopyText, buildCsvContent, buildTimelineLine } from "./exporters";

describe("exporters", () => {
  const results = searchLogs(parseLogText(SAMPLE_LOG), parseSearchTerms("달리, ㄷㄹ"), "message", "asc");

  it("builds copy text without trailing message content", () => {
    const copied = buildCopyText(results);

    expect(copied).toContain("[ 00:15:28 ] [DL]윤파이. 1040");
    expect(copied).not.toContain('| "달리"');
    expect(copied).not.toContain("시간,후원자");
    expect(copied).not.toContain("<mark>");
  });

  it("keeps sig metadata while removing only the message segment", () => {
    const [result] = searchLogs(
      parseLogText('[ 03:28:47 ] 무빙프랙 5555 [시그]5555개 | "서냥"'),
      parseSearchTerms("서냥"),
      "message",
      "asc"
    );

    expect(buildTimelineLine(result)).toBe("[ 03:28:47 ] 무빙프랙 5555 [시그]5555개");
  });

  it("builds CSV with UTF-8 BOM and expected columns", () => {
    const csv = buildCsvContent(results);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("시간,후원자,금액,시그,메시지,매칭검색어,원문");
    expect(csv).toContain('"달리, ㄷㄹ"');
  });
});
