import { describe, expect, it } from "vitest";
import { parseLogText } from "@/features/logParser/logParser";
import { SAMPLE_LOG } from "@/features/sample/sampleLog";
import { parseSearchTerms, searchLogs, timeToSeconds } from "./searchEngine";
import { toChoseongText } from "./choseong";

describe("searchEngine", () => {
  it("parses comma and newline terms with de-duplication", () => {
    const terms = parseSearchTerms("달리, ㄷㄹ\n달리\n");

    expect(terms.map((term) => term.raw)).toEqual(["달리", "ㄷㄹ"]);
    expect(terms[1].isInitial).toBe(true);
  });

  it("converts Hangul syllables into exact choseong text", () => {
    expect(toChoseongText("달리")).toBe("ㄷㄹ");
    expect(toChoseongText("어푸")).toBe("ㅇㅍ");
    expect(toChoseongText("다나")).toBe("ㄷㄴ");
    expect(toChoseongText("달리💕")).toBe("ㄷㄹ");
  });

  it("matches required text and initial terms in message scope", () => {
    const results = searchLogs(parseLogText(SAMPLE_LOG), parseSearchTerms("달리, ㄷㄹ"), "message", "asc");
    const messages = results.map((result) => result.message);

    expect(messages).toContain("달리");
    expect(messages).toContain("달리누나");
    expect(messages).toContain("달리뾱");
    expect(messages).toContain("달리💕");
    expect(messages).toContain("달리누나 끝자리 맞춰주기");
    expect(messages).not.toContain("어푸");
  });

  it("does not match [DL] tag in default message scope", () => {
    const results = searchLogs(parseLogText(SAMPLE_LOG), parseSearchTerms("DL"), "message", "asc");

    expect(results.map((result) => result.message)).not.toContain("어푸");
    expect(results).toHaveLength(0);
  });

  it("matches [DL] tag in full raw scope", () => {
    const results = searchLogs(parseLogText(SAMPLE_LOG), parseSearchTerms("DL"), "full", "asc");

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((result) => result.message === "어푸")).toBe(true);
  });

  it("supports required initial search examples", () => {
    const text = [
      '[ 00:00:01 ] a 1 | "달리"',
      '[ 00:00:02 ] a 1 | "다리"',
      '[ 00:00:03 ] a 1 | "드래곤"',
      '[ 00:00:04 ] a 1 | "달리누나"',
      '[ 00:00:05 ] a 1 | "어푸"',
      '[ 00:00:06 ] a 1 | "다나"',
      '[ 00:00:07 ] a 1 | "여리"',
      '[ 00:00:08 ] a 1 | "지오"'
    ].join("\n");

    const messages = searchLogs(parseLogText(text), parseSearchTerms("ㄷㄹ"), "message", "asc").map((result) => result.message);

    expect(messages).toEqual(["달리", "다리", "드래곤", "달리누나"]);
  });

  it("keeps one row when multiple terms match", () => {
    const results = searchLogs(parseLogText(SAMPLE_LOG), parseSearchTerms("달리, ㄷㄹ"), "message", "asc");
    const uniqueIds = new Set(results.map((result) => result.id));

    expect(uniqueIds.size).toBe(results.length);
    expect(results.find((result) => result.message === "달리")?.matches.map((match) => match.term)).toEqual(["달리", "ㄷㄹ"]);
  });

  it("sorts by time ascending and descending", () => {
    const lines = parseLogText(SAMPLE_LOG);
    const asc = searchLogs(lines, parseSearchTerms("달리"), "message", "asc");
    const desc = searchLogs(lines, parseSearchTerms("달리"), "message", "desc");

    expect(timeToSeconds(asc[0].time)).toBeLessThan(timeToSeconds(asc.at(-1)!.time));
    expect(timeToSeconds(desc[0].time)).toBeGreaterThan(timeToSeconds(desc.at(-1)!.time));
  });
});
