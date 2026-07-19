const { app, BrowserWindow, shell, ipcMain, Menu, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs");

const APP_URL = "https://green-root-erp.lovable.app";
const LOAD_TIMEOUT_MS = 45000;
const SHOW_FALLBACK_MS = 3000;

// File logger — writes to userData so we can debug user machines.
let logFilePath = null;
function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")}\n`;
  try {
    if (!logFilePath) logFilePath = path.join(app.getPath("userData"), "haytam-agri.log");
    fs.appendFileSync(logFilePath, line);
  } catch {}
  try { console.log(...args); } catch {}
}

process.on("uncaughtException", (err) => log("uncaughtException:", err && err.stack || String(err)));
process.on("unhandledRejection", (r) => log("unhandledRejection:", r && r.stack || String(r)));

// Ensure only one instance runs
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  return;
}

let mainWindow = null;
let showingSplash = false;
let loadTimer = null;
let shownOnce = false;

function resolveIcon() {
  const candidates = [
    path.join(__dirname, "..", "build", "icon.ico"),
    path.join(__dirname, "icon.png"),
    path.join(process.resourcesPath || "", "build", "icon.ico"),
  ];
  for (const p of candidates) {
    try {
      if (fs.statSync(p).isFile()) {
        log("Icon found:", p);
        return p;
      }
    } catch {}
  }
  log("No icon file found");
  return undefined;
}

function ensureShown() {
  if (shownOnce) return;
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.show();
      shownOnce = true;
      log("Window shown");
    } catch (e) {
      log("show() failed:", e && e.message);
    }
  }
}

function showSplash(win) {
  showingSplash = true;
  const splashPath = path.join(__dirname, "splash.html");
  log("Loading splash:", splashPath);
  win.loadFile(splashPath).catch((e) => log("splash load fail:", e && e.message));
}

function sendSplashStatus(msg, isError = false) {
  if (mainWindow && showingSplash && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send("splash-status", msg, isError);
    } catch (e) {
      log("sendSplashStatus fail:", e && e.message);
    }
  }
}

function loadApp() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  showingSplash = true;
  showSplash(mainWindow);

  setTimeout(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    log("Loading app URL:", APP_URL);
    clearTimeout(loadTimer);
    loadTimer = setTimeout(() => {
      log("Load timeout reached");
      sendSplashStatus("انتهت مهلة الاتصال. تحقق من اتصال الإنترنت وأعد المحاولة.", true);
    }, LOAD_TIMEOUT_MS);

    mainWindow.loadURL(APP_URL, {
      userAgent: `HaytamAGRI/${app.getVersion()} Electron/${process.versions.electron} Chrome/${process.versions.chrome}`,
    }).catch((err) => {
      log("loadURL error:", err && err.message);
      sendSplashStatus(`تعذر الاتصال بالخادم: ${err && err.message || "خطأ غير معروف"}`, true);
    });
  }, 500);
}

function createWindow() {
  const iconPath = resolveIcon();
  let iconImage;
  if (iconPath) {
    try {
      iconImage = nativeImage.createFromPath(iconPath);
      if (iconImage.isEmpty()) iconImage = undefined;
    } catch (e) {
      log("nativeImage.createFromPath fail:", e && e.message);
    }
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    title: "Haytam AGRI",
    icon: iconImage || iconPath,
    autoHideMenuBar: true,
    backgroundColor: "#0f5132",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, "preload.cjs"),
      spellcheck: false,
      backgroundThrottling: false,
    },
  });

  // Force-show fallback so the window never stays invisible.
  setTimeout(ensureShown, SHOW_FALLBACK_MS);

  mainWindow.once("ready-to-show", () => {
    log("ready-to-show fired");
    ensureShown();
  });

  mainWindow.webContents.on("did-finish-load", () => {
    const url = mainWindow.webContents.getURL();
    log("did-finish-load:", url);
    ensureShown();
    if (url.startsWith("http")) {
      clearTimeout(loadTimer);
      showingSplash = false;
    }
  });

  mainWindow.webContents.on("did-fail-load", (_e, errorCode, errorDesc, validatedURL, isMainFrame) => {
    if (!isMainFrame) return;
    if (errorCode === -3) return; // ABORTED — normal during redirects
    log("did-fail-load:", errorCode, errorDesc, validatedURL);
    ensureShown();
    if (validatedURL && validatedURL.startsWith("http")) {
      showSplash(mainWindow);
      setTimeout(() => sendSplashStatus(`تعذر التحميل (${errorCode}): ${errorDesc}`, true), 400);
    }
  });

  mainWindow.webContents.on("render-process-gone", (_e, details) => {
    log("render-process-gone:", details && details.reason);
    ensureShown();
    showSplash(mainWindow);
    setTimeout(() => sendSplashStatus(`توقفت العملية: ${details && details.reason}`, true), 400);
  });

  mainWindow.webContents.on("unresponsive", () => log("webContents unresponsive"));
  mainWindow.webContents.on("responsive", () => log("webContents responsive"));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_URL)) return { action: "allow" };
    shell.openExternal(url).catch(() => {});
    return { action: "deny" };
  });

  // Troubleshooting shortcuts: Ctrl+Shift+I toggles DevTools, F5 reloads.
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.control && input.shift && input.key && input.key.toLowerCase() === "i") {
      mainWindow.webContents.toggleDevTools();
    }
    if (input.key === "F5") loadApp();
  });

  loadApp();
}

ipcMain.on("splash-retry", () => {
  log("User pressed retry");
  loadApp();
});

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  log("App ready. version:", app.getVersion(), "electron:", process.versions.electron);
  if (process.platform === "win32") {
    app.setAppUserModelId("com.haytam.agri");
  }
  Menu.setApplicationMenu(null);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
