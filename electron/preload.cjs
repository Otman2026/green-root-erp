const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onStatus: (cb) => ipcRenderer.on("splash-status", (_e, msg, isError) => cb(msg, isError)),
  retry: () => ipcRenderer.send("splash-retry"),
});
