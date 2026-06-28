import { describe, expect, it } from "vitest";
import { parseLogLine, parseLogText } from "./logParser";
import { SAMPLE_LOG } from "@/features/sample/sampleLog";

describe("logParser", () => {
  it("parses a basic donation log line", () => {
    const line = parseLogLine('[ 05:16:37 ] [DL]크렉에오 37 | "달리누나 끝자리 맞춰주기"', 1);

    expect(line.time).toBe("05:16:37");
    expect(line.donor).toBe("[DL]크렉에오");
    expect(line.amount).toBe(37);
    expect(line.message).toBe("달리누나 끝자리 맞춰주기");
    expect(line.raw).toBe('[ 05:16:37 ] [DL]크렉에오 37 | "달리누나 끝자리 맞춰주기"');
    expect(line.parseStatus).toBe("parsed");
  });

  it("parses sig metadata", () => {
    const line = parseLogLine('[ 03:28:47 ] 무빙프랙 5555 [시그]5555개 | "서냥"', 1);

    expect(line.time).toBe("03:28:47");
    expect(line.donor).toBe("무빙프랙");
    expect(line.amount).toBe(5555);
    expect(line.sig).toBe("5555개");
    expect(line.message).toBe("서냥");
  });

  it("keeps failed lines for full-text search", () => {
    const line = parseLogLine("파싱되지 않는 달리 라인", 7);

    expect(line.raw).toBe("파싱되지 않는 달리 라인");
    expect(line.lineNumber).toBe(7);
    expect(line.parseStatus).toBe("failed");
  });

  it("parses sample log line count", () => {
    expect(parseLogText(SAMPLE_LOG)).toHaveLength(9);
  });
});
