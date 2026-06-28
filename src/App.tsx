import { useMemo, useState } from "react";
import type { InitialMatchMode, ParsedLogLine, SearchResult, SearchScope, SearchTerm, SortOrder } from "@/types/log";
import { parseLogText } from "@/features/logParser/logParser";
import { parseSearchTerms, searchLogs } from "@/features/search/searchEngine";
import { SAMPLE_LOG } from "@/features/sample/sampleLog";
import { buildCopyText, buildCsvContent, buildDateStamp, buildFileSafeKeyword, buildTimelineLine, buildTxtContent } from "@/features/export/exporters";
import { getRecentSearches, saveRecentSearch } from "@/features/recentSearch/recentSearch";
import "./styles/app.css";

type LoadedFile = {
  name: string;
  encoding: string;
  lines: ParsedLogLine[];
};

const TimelineIcon = () => (
  <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
    <rect x="5" y="6" width="24" height="22" rx="6" fill="#1f8ea3" />
    <path d="M11 11v12M11 15h12M11 21h8" stroke="#f8f2df" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="23" cy="15" r="2.4" fill="#f8f2df" />
    <circle cx="19" cy="21" r="2.4" fill="#f8f2df" />
  </svg>
);

export const App = () => {
  const [loadedFile, setLoadedFile] = useState<LoadedFile | null>(null);
  const [query, setQuery] = useState("달리, ㄷㄹ");
  const [scope, setScope] = useState<SearchScope>("message");
  const [initialMatchMode, setInitialMatchMode] = useState<InitialMatchMode>("guarded");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [lastTerms, setLastTerms] = useState<SearchTerm[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [recent, setRecent] = useState<string[]>(() => getRecentSearches());
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const terms = useMemo(() => parseSearchTerms(query), [query]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  const loadText = (name: string, encoding: string, text: string) => {
    const lines = parseLogText(text);
    setLoadedFile({ name, encoding, lines });
    setResults([]);
    setSelected(null);
    setError("");
    showToast(`${lines.length.toLocaleString()}줄을 불러왔습니다.`);
  };

  const openFile = async () => {
    const result = await window.timelineApi.openTextFile();
    if (result.canceled) return;
    if (result.error || !result.text) {
      setError(result.error ?? "파일을 불러오지 못했습니다.");
      return;
    }
    loadText(result.fileName ?? "선택한 로그", result.encoding ?? "UTF-8", result.text);
  };

  const loadSample = () => {
    loadText("sample-log.txt", "샘플", SAMPLE_LOG);
  };

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    const file = event.dataTransfer.files[0];
    if (!file) {
      setError("드롭한 파일을 읽지 못했습니다.");
      return;
    }
    const result = await window.timelineApi.readDroppedFile(file);
    if (result.error || !result.text) {
      setError(result.error ?? "파일을 불러오지 못했습니다.");
      return;
    }
    loadText(result.fileName ?? file.name, result.encoding ?? "UTF-8", result.text);
  };

  const runSearch = () => {
    if (!loadedFile) {
      setError("먼저 후원 로그 TXT 파일을 불러오세요.");
      return;
    }
    if (terms.length === 0) {
      setError("검색할 BJ 이름이나 별칭을 입력하세요.");
      return;
    }
    const onlyInitialTerms = terms.every((term) => term.isInitial);
    if (initialMatchMode === "guarded" && onlyInitialTerms) {
      setError("정밀 초성 모드에서는 실제 별칭도 함께 입력하세요. 예: 달리, ㄷㄹ");
      return;
    }
    const found = searchLogs(loadedFile.lines, terms, scope, sortOrder, { initialMatchMode });
    setResults(found);
    setSelected(found[0] ?? null);
    setLastTerms(terms);
    setRecent(saveRecentSearch(query));
    setError("");
  };

  const resetAll = () => {
    setLoadedFile(null);
    setQuery("");
    setResults([]);
    setSelected(null);
    setLastTerms([]);
    setError("");
  };

  const copyAll = async () => {
    await window.timelineApi.copyText(buildCopyText(results));
    showToast("검색 결과 원문을 복사했습니다.");
  };

  const copyOne = async (result: SearchResult) => {
    await window.timelineApi.copyText(buildTimelineLine(result));
    setSelected(result);
    showToast("한 줄을 복사했습니다.");
  };

  const saveTxt = async () => {
    const keywords = buildFileSafeKeyword(lastTerms.map((term) => term.raw));
    const saved = await window.timelineApi.saveTextFile(`timeline_${keywords}_${buildDateStamp()}.txt`, buildTxtContent(results));
    if (saved.error) setError(saved.error);
    else if (!saved.canceled) showToast("TXT 파일로 저장했습니다.");
  };

  const saveCsv = async () => {
    const keywords = buildFileSafeKeyword(lastTerms.map((term) => term.raw));
    const saved = await window.timelineApi.saveCsvFile(`timeline_${keywords}_${buildDateStamp()}.csv`, buildCsvContent(results));
    if (saved.error) setError(saved.error);
    else if (!saved.canceled) showToast("CSV 파일로 내보냈습니다.");
  };

  const resultDisabled = results.length === 0;

  return (
    <div className="appShell">
      <header className="topHeader">
        <div className="brand">
          <TimelineIcon />
          <div>
            <h1>타임라인 정리기</h1>
            <p>후원 로그에서 필요한 언급만 빠르게 정리하세요.</p>
          </div>
        </div>
        <div className="fileMeta">
          <span>{loadedFile?.name ?? "파일 없음"}</span>
          <strong>{loadedFile ? `${loadedFile.lines.length.toLocaleString()}줄` : "0줄"}</strong>
          <button className="iconButton" title="로컬 PC에서만 분석합니다." aria-label="도움말">?</button>
        </div>
      </header>

      <main className="workspace">
        <aside className="controlPanel">
          <button className="primaryWide" onClick={openFile}>TXT 파일 불러오기</button>
          <button className="secondaryWide" onClick={loadSample}>샘플 로그 불러오기</button>

          <div
            className={isDraggingFile ? "dropZone dragging" : "dropZone"}
            onDragEnter={() => setIsDraggingFile(true)}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={onDrop}
          >
            <TimelineIcon />
            <strong>로그 파일을 여기로 끌어다 놓으세요</strong>
            <span>TXT 형식 지원</span>
          </div>

          <section className="fieldGroup">
            <div className="fieldTitle">
              <label htmlFor="searchTerms">찾아야 할 BJ / 별칭</label>
              <span>쉼표 또는 줄바꿈으로 여러 별칭을 입력하세요.</span>
            </div>
            <textarea
              id="searchTerms"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 달리, ㄷㄹ"
              rows={5}
            />
            <div className="chips">
              {terms.map((term) => (
                <span className={term.isInitial ? "chip initial" : "chip"} key={`${term.raw}-${term.isInitial}`}>
                  {term.raw}
                </span>
              ))}
            </div>
          </section>

          <section className="segmented">
            <span>검색 범위</span>
            <div>
              <button className={scope === "message" ? "active" : ""} onClick={() => setScope("message")}>메시지 내용만 검색</button>
              <button className={scope === "full" ? "active" : ""} onClick={() => setScope("full")}>원문 전체 검색</button>
            </div>
            <p className="optionHint">
              기본값은 따옴표 안 메시지만 검색합니다. 원문 전체 검색은 후원자/태그까지 포함되어 오탐이 생길 수 있습니다.
            </p>
          </section>

          <section className="segmented">
            <span>초성 처리</span>
            <div>
              <button className={initialMatchMode === "guarded" ? "active" : ""} onClick={() => setInitialMatchMode("guarded")}>정밀 초성</button>
              <button className={initialMatchMode === "candidate" ? "active" : ""} onClick={() => setInitialMatchMode("candidate")}>초성 후보</button>
            </div>
            <p className="optionHint">
              정밀 초성은 `달리, ㄷㄹ`처럼 실제 별칭과 초성을 함께 입력할 때 초성만 맞는 관련 없는 메시지를 제외합니다.
            </p>
          </section>

          <section className="segmented">
            <span>정렬</span>
            <div>
              <button className={sortOrder === "asc" ? "active" : ""} onClick={() => setSortOrder("asc")}>시간 오름차순</button>
              <button className={sortOrder === "desc" ? "active" : ""} onClick={() => setSortOrder("desc")}>시간 내림차순</button>
            </div>
          </section>

          <button className="primaryWide organize" onClick={runSearch}>타임라인 정리</button>
          <button className="ghostWide" onClick={resetAll}>초기화</button>

          <section className="recentBox">
            <h2>최근 검색</h2>
            {recent.length === 0 ? <p>최근 검색 기록이 없습니다.</p> : null}
            {recent.map((item) => (
              <button key={item} onClick={() => setQuery(item)}>{item}</button>
            ))}
          </section>
        </aside>

        <section className="resultPanel">
          <div className="summaryBar">
            <div>
              <h2>검색 결과 {results.length.toLocaleString()}건</h2>
              <p>
                검색 별칭: {lastTerms.length ? lastTerms.map((term) => term.raw).join(", ") : "없음"} · 검색 범위: {scope === "message" ? "메시지 내용" : "원문 전체"} · 초성: {initialMatchMode === "guarded" ? "정밀" : "후보"} · 정렬: {sortOrder === "asc" ? "시간 오름차순" : "시간 내림차순"}
              </p>
            </div>
            <div className="actionButtons">
              <button onClick={copyAll} disabled={resultDisabled}>전체 복사</button>
              <button onClick={saveTxt} disabled={resultDisabled}>TXT로 저장</button>
              <button onClick={saveCsv} disabled={resultDisabled}>CSV로 내보내기</button>
            </div>
          </div>

          {error ? <div className="errorBanner">{error}</div> : null}

          {!loadedFile ? (
            <EmptyState title="후원 로그 TXT 파일을 불러오세요" body="파일을 끌어다 놓거나 버튼을 눌러 선택할 수 있습니다." />
          ) : results.length === 0 ? (
            <EmptyState title="일치하는 BJ 언급을 찾지 못했습니다." body="별칭 철자, 초성 또는 검색 범위를 확인해보세요." />
          ) : (
            <div className="resultLayout">
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>시간</th>
                      <th>후원자</th>
                      <th>금액</th>
                      <th>메시지</th>
                      <th>매칭 검색어</th>
                      <th>원문</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr
                        key={result.id}
                        className={selected?.id === result.id ? "selected" : ""}
                        onClick={() => setSelected(result)}
                      >
                        <td className="mono timeCell">{result.time ?? "-"}</td>
                        <td>{result.donor || "-"}</td>
                        <td className="mono">{result.amount?.toLocaleString() ?? "-"}</td>
                        <td className="messageCell">{renderMessage(result)}</td>
                        <td>
                          <span className="matchPill">{formatMatches(result)}</span>
                        </td>
                        <td>
                          <button className="copyButton" onClick={(event) => {
                            event.stopPropagation();
                            copyOne(result);
                          }}>복사</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="detailPanel">
                <span>원문 상세</span>
                <pre>{selected?.raw ?? ""}</pre>
                {selected ? (
                  <dl>
                    <dt>라인</dt>
                    <dd>{selected.lineNumber}</dd>
                    <dt>시그</dt>
                    <dd>{selected.sig || "-"}</dd>
                    <dt>파싱</dt>
                    <dd>{selected.parseStatus}</dd>
                  </dl>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </main>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
};

const EmptyState = ({ title, body }: { title: string; body: string }) => (
  <div className="emptyState">
    <TimelineIcon />
    <h2>{title}</h2>
    <p>{body}</p>
  </div>
);

const formatMatches = (result: SearchResult) => {
  return result.matches
    .map((match) => `${match.term}${match.type === "initial" ? " 초성" : ""} 일치`)
    .join(", ");
};

const renderMessage = (result: SearchResult) => {
  const message = result.message || result.raw;
  const textTerms = result.matches.filter((match) => match.type === "text").map((match) => match.term);
  const initialOnly = result.matches.some((match) => match.type === "initial") && textTerms.length === 0;

  if (initialOnly) return <mark className="softMark">{message}</mark>;

  const firstTerm = textTerms.find((term) => message.toLocaleLowerCase("ko-KR").includes(term.toLocaleLowerCase("ko-KR")));
  if (!firstTerm) return message;

  const lower = message.toLocaleLowerCase("ko-KR");
  const lowerTerm = firstTerm.toLocaleLowerCase("ko-KR");
  const start = lower.indexOf(lowerTerm);
  const end = start + firstTerm.length;
  return (
    <>
      {message.slice(0, start)}
      <mark>{message.slice(start, end)}</mark>
      {message.slice(end)}
    </>
  );
};
