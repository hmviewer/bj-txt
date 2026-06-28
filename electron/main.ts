import { app, BrowserWindow, dialog, ipcMain, clipboard } from "electron";
import { join, basename } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import iconv from "iconv-lite";

type ReadFileResult = {
  canceled: boolean;
  fileName?: string;
  filePath?: string;
  text?: string;
  encoding?: string;
  error?: string;
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1120,
    minHeight: 720,
    title: "타임라인 정리기",
    backgroundColor: "#15181d",
    webPreferences: {
      preload: join(__dirname, "../preload/preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
};

const decodeText = (buffer: Buffer) => {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return { text: buffer.subarray(3).toString("utf8"), encoding: "UTF-8 BOM" };
  }

  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    return { text: decoder.decode(buffer), encoding: "UTF-8" };
  } catch {
    const cp949 = iconv.decode(buffer, "cp949");
    if (!cp949.includes("\uFFFD")) {
      return { text: cp949, encoding: "CP949" };
    }
    return { text: iconv.decode(buffer, "euc-kr"), encoding: "EUC-KR" };
  }
};

const readTextFile = async (filePath: string): Promise<ReadFileResult> => {
  try {
    const buffer = await readFile(filePath);
    const decoded = decodeText(buffer);
    return {
      canceled: false,
      fileName: basename(filePath),
      filePath,
      text: decoded.text,
      encoding: decoded.encoding
    };
  } catch {
    return {
      canceled: false,
      error: "파일을 읽지 못했습니다. 파일 권한이나 인코딩을 확인해주세요."
    };
  }
};

app.whenReady().then(() => {
  ipcMain.handle("file:openText", async (): Promise<ReadFileResult> => {
    const result = await dialog.showOpenDialog({
      title: "후원 로그 TXT 파일 선택",
      properties: ["openFile"],
      filters: [{ name: "Text files", extensions: ["txt", "log"] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    return readTextFile(result.filePaths[0]);
  });

  ipcMain.handle("file:readDroppedText", async (_event, filePath: string): Promise<ReadFileResult> => {
    if (!filePath || !/\.(txt|log)$/i.test(filePath)) {
      return { canceled: false, error: "TXT 또는 LOG 형식의 파일만 불러올 수 있습니다." };
    }
    return readTextFile(filePath);
  });

  ipcMain.handle("file:saveText", async (_event, defaultFileName: string, content: string) => {
    try {
      const result = await dialog.showSaveDialog({
        title: "TXT로 저장",
        defaultPath: defaultFileName,
        filters: [{ name: "Text file", extensions: ["txt"] }]
      });
      if (result.canceled || !result.filePath) return { canceled: true };
      await writeFile(result.filePath, content, "utf8");
      return { canceled: false, filePath: result.filePath };
    } catch {
      return { canceled: false, error: "TXT 파일 저장에 실패했습니다." };
    }
  });

  ipcMain.handle("file:saveCsv", async (_event, defaultFileName: string, content: string) => {
    try {
      const result = await dialog.showSaveDialog({
        title: "CSV로 내보내기",
        defaultPath: defaultFileName,
        filters: [{ name: "CSV file", extensions: ["csv"] }]
      });
      if (result.canceled || !result.filePath) return { canceled: true };
      await writeFile(result.filePath, content, "utf8");
      return { canceled: false, filePath: result.filePath };
    } catch {
      return { canceled: false, error: "CSV 파일 저장에 실패했습니다." };
    }
  });

  ipcMain.handle("clipboard:writeText", (_event, content: string) => {
    clipboard.writeText(content);
    return true;
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
