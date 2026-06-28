export type DesktopFileResult = {
  canceled: boolean;
  fileName?: string;
  filePath?: string;
  text?: string;
  encoding?: string;
  error?: string;
};

export type SaveResult = {
  canceled: boolean;
  filePath?: string;
  error?: string;
};

declare global {
  interface Window {
    timelineApi: {
      openTextFile: () => Promise<DesktopFileResult>;
      readDroppedTextFile: (filePath: string) => Promise<DesktopFileResult>;
      saveTextFile: (defaultFileName: string, content: string) => Promise<SaveResult>;
      saveCsvFile: (defaultFileName: string, content: string) => Promise<SaveResult>;
      copyText: (content: string) => Promise<boolean>;
    };
  }
}

export {};
