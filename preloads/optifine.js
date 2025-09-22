console.log("Loading prelaod");

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  updateDownloadMC: (state) => ipcRenderer.on("updateDownloadMC", state),
  updateDownloadOF: (state) => ipcRenderer.on("updateDownloadOF", state),
  runInstaller: (path) => ipcRenderer.sendSync("runOptifineInstaller", path),
  log: (...logs) => ipcRenderer.on("log", ...logs),
});
