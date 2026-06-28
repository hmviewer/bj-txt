import { contextBridge, ipcRenderer } from "electron";

const api = {
  openTextFile: () => ipcRenderer.invoke("file:openText"),
  readDroppedTextFile: (filePath: string) => ipcRenderer.invoke("file:readDroppedText", filePath),
  saveTextFile: (defaultFileName: string, content: string) =>
    ipcRenderer.invoke("file:saveText", defaultFileName, content),
  saveCsvFile: (defaultFileName: string, content: string) =>
    ipcRenderer.invoke("file:saveCsv", defaultFileName, content),
  copyText: (content: string) => ipcRenderer.invoke("clipboard:writeText", content)
};

contextBridge.exposeInMainWorld("timelineApi", api);
