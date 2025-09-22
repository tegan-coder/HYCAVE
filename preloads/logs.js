console.log("Loading prelaod");

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  updateDownloadMC: (state) => ipcRenderer.on("updateDownloadMC", state),
  log: (...logs) => ipcRenderer.on("log", ...logs),
  logMC: (...logs) => ipcRenderer.on("logMC", ...logs),
});
