export const CHOSEONGS = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ"
] as const;

const INITIAL_ONLY = /^[ㄱ-ㅎ]+$/;

export const isInitialSearchTerm = (term: string) => INITIAL_ONLY.test(term);

export const toChoseongChar = (char: string) => {
  const code = char.charCodeAt(0);

  if (code >= 0xac00 && code <= 0xd7a3) {
    const initialIndex = Math.floor((code - 0xac00) / 588);
    return CHOSEONGS[initialIndex];
  }

  if (INITIAL_ONLY.test(char)) return char;
  return "";
};

export const toChoseongText = (text: string) => {
  return Array.from(text)
    .map(toChoseongChar)
    .join("");
};
