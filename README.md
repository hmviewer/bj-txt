# 타임라인 정리기

별풍선/후원 로그 TXT 파일에서 특정 BJ 이름, 별칭, 초성 검색어에 해당하는 메시지만 찾아 시간순으로 정리하는 Electron 기반 Windows 데스크톱 앱입니다. 모든 로그 분석, 복사, TXT/CSV 내보내기는 로컬 PC에서만 수행됩니다.

## 설치 방법

```bash
npm install
```

## 개발 실행

```bash
npm run dev
```

Electron 개발 창이 열리며, React 렌더러는 Vite 개발 서버로 실행됩니다.

## 일반 빌드

```bash
npm run build
```

렌더러와 Electron 메인/프리로드 코드를 빌드합니다.

## Windows exe 빌드

```bash
npm run build:win
```

Windows 실행 파일은 `release/` 폴더에 생성됩니다.

예상 출력:

- `release/타임라인-정리기-1.0.0-x64.exe`

환경과 electron-builder 버전에 따라 파일명 일부는 달라질 수 있습니다.

## 주요 파일 구조

```text
electron/
  main.ts              파일 선택, 파일 읽기, TXT/CSV 저장, 클립보드 IPC
  preload.ts           renderer에 안전한 API만 노출

src/
  App.tsx              데스크톱 앱 UI와 동작 연결
  features/
    logParser/         후원 로그 파싱
    search/            일반 검색, 초성 검색, 정렬
    export/            복사/TXT/CSV 데이터 생성
    recentSearch/      최근 검색 localStorage 관리
    sample/            개발용 샘플 로그
  styles/              Windows 11 생산성 앱 스타일
  types/               공용 타입과 preload 타입
```

## 초성 검색 로직

`src/features/search/choseong.ts`에서 한글 완성형 음절을 초성으로 변환합니다.

- 검색어가 `ㄱ~ㅎ` 자음으로만 구성되면 초성 검색으로 자동 처리합니다.
- `달리`는 `ㄷㄹ`, `어푸`는 `ㅇㅍ`, `다나`는 `ㄷㄴ`으로 변환됩니다.
- 메시지 안의 공백, 이모지, 특수문자는 초성 비교에서 자연스럽게 제외됩니다.
- 쌍자음은 `ㄱ/ㄲ`, `ㄷ/ㄸ`, `ㅂ/ㅃ`, `ㅅ/ㅆ`, `ㅈ/ㅉ`처럼 정확히 구분합니다.
- 일반 텍스트 검색과 초성 검색은 OR 조건으로 동시에 동작합니다.

기본 검색 범위는 반드시 따옴표 안 메시지 영역입니다. 원문 전체 검색 옵션을 켜야 태그, 닉네임, 금액, 시그, 원문 전체까지 검색합니다.

## TXT/CSV 내보내기

TXT 저장과 전체 복사는 검색 결과의 원문 로그 라인만 줄바꿈으로 연결합니다.

CSV 내보내기 컬럼:

```text
시간, 후원자, 금액, 시그, 메시지, 매칭검색어, 원문
```

CSV는 Excel에서 한글이 깨지지 않도록 UTF-8 BOM을 포함합니다.

## 테스트 실행

```bash
npm run test
```

테스트 범위:

- 로그 파싱
- 시간 정렬
- 일반 텍스트 검색
- 초성 검색
- 원문 전체 검색
- 중복 결과 제거
- 복사 데이터 포맷
- CSV UTF-8 BOM

## 샘플 로그 불러오기

앱 왼쪽 패널의 `샘플 로그 불러오기` 버튼을 누르면 개발용 로그가 즉시 로드됩니다. 기본 검색어 `달리, ㄷㄹ`로 `타임라인 정리`를 실행하면 `달리`, `달리누나`, `달리뾱`, `달리💕`, `달리누나 끝자리 맞춰주기`가 검색되고, `[DL]` 태그만 포함된 `어푸` 메시지는 기본 메시지 검색 결과에서 제외됩니다.

## 제품 웹사이트

제품 소개용 정적 웹사이트는 `website/` 폴더에 있습니다.

```text
website/
  index.html
  assets/
    product-preview.png
    og-preview.png
    favicon.svg
  styles/site.css
  scripts/site.js
```

로컬 확인:

```bash
python3 -m http.server 4177 --directory website
```

브라우저에서 `http://127.0.0.1:4177`을 열면 됩니다.

## Vercel 배포와 보안 헤더

`vercel.json`과 `website/vercel.json`에 보안 헤더를 적용했습니다.

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy`
- `Permissions-Policy`
- `Strict-Transport-Security`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`

Vercel에서 GitHub 저장소를 연결할 때 Root Directory를 `website`로 지정하거나, 루트 배포 시 포함된 `vercel.json`을 사용하면 됩니다. 설치 파일은 GitHub Release에 올리고 웹사이트 다운로드 버튼을 Release URL로 연결하는 방식을 권장합니다.
