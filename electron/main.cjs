const { app, BrowserWindow, shell, ipcMain, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

const APP_URL = "https://green-root-erp.lovable.app";
const LOAD_TIMEOUT_MS = 30000;

// Simple file logger — writes to userData so we can debug user machines.
const logFile = path.join(app.getPath("userData"), "haytam-agri.log");
function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.map(String).join(" ")}\n`;
  try { fs.appendFileSync(logFile, line); } catch {}
  console.log(...args);
}

process.on("uncaughtException", (err) => log("uncaughtException:", err && err.stack || err));
process.on("unhandledRejection", (r) => log("unhandledRejection:", r && r.stack || r));

let mainWindow = null;
let showingSplash = false;
let loadTimer = null;

function resolveIcon() {
  const candidates = [
    path.join(__dirname, "..", "build", "icon.ico"),
    path.join(process.resourcesPath || "", "build", "icon.ico"),
    path.join(__dirname, "..", "public", "icon-512.png"),
  ];
  for (const p of candidates) {
    try { if (fs.statSync(p).isFile()) return p; } catch {}
  }
  return undefined;
}

function showSplash(win) {
  showingSplash = true;
  win.loadFile(path.join(__dirname, "splash.html")).catch((e) => log("splash load fail:", e));
}

function sendSplashStatus(msg, isError = false) {
  if (mainWindow && showingSplash && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("splash-status", msg, isError);
  }
}

function loadApp() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  showingSplash = true;
  showSplash(mainWindow);

  // Attempt app load after splash paints.
  setTimeout(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    log("Loading app URL:", APP_URL);
    clearTimeout(loadTimer);
    loadTimer = setTimeout(() => {
      log("Load timeout reached");
      sendSplashStatus("انتهت مهلة الاتصال. تحقق من الإنترنت.", true);
    }, LOAD_TIMEOUT_MS);

    mainWindow.loadURL(APP_URL).catch((err) => {
      log("loadURL error:", err && err.message);
      sendSplashStatus("تعذر الاتصال بالخادم. تحقق من الإنترنت.", true);
    });
  }, 400);
}

function createWindow() {
  const iconPath = resolveIcon();
  log("Using icon:", iconPath || "(none)");

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    title: "Haytam AGRI",
    icon: iconPath,
    autoHideMenuBar: true,
    backgroundColor: "#0f5132",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  // Success: switch off splash mode once the real app content loaded.
  mainWindow.webContents.on("did-finish-load", () => {
    const url = mainWindow.webContents.getURL();
    if (url.startsWith("http")) {
      clearTimeout(loadTimer);
      showingSplash = false;
      log("App loaded:", url);
    }
  });

  mainWindow.webContents.on("did-fail-load", (_e, errorCode, errorDesc, validatedURL, isMainFrame) => {
    if (!isMainFrame) return;
    // -3 = ABORTED (normal during redirects), ignore.
    if (errorCode === -3) return;
    log("did-fail-load:", errorCode, errorDesc, validatedURL);
    if (validatedURL && validatedURL.startsWith("http")) {
      // Real network failure — show splash with error.
      showSplash(mainWindow);
      setTimeout(() => sendSplashStatus(`تعذر التحميل: ${errorDesc}`, true), 300);
    }
  });

  mainWindow.webContents.on("render-process-gone", (_e, details) => {
    log("render-process-gone:", details.reason);
    showSplash(mainWindow);
    setTimeout(() => sendSplashStatus(`توقفت العملية: ${details.reason}`, true), 300);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_URL)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Dev tools shortcut for troubleshooting on user machines: Ctrl+Shift+I
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === "i") {
      mainWindow.webContents.toggleDevTools();
    }
    if (input.key === "F5") {
      loadApp();
    }
  });

  loadApp();
}

ipcMain.on("splash-retry", () => {
  log("User pressed retry");
  loadApp();
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
