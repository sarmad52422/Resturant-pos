"use strict";
const electron = require("electron");
const node_path = require("node:path");
if (process.platform === "linux" && process.env.RESTAURANTOS_ENABLE_GPU !== "1") {
  electron.app.disableHardwareAcceleration();
}
const isDev = !electron.app.isPackaged;
let mainWindow = null;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1180,
    minHeight: 760,
    title: "RestaurantOS POS",
    backgroundColor: "#fffaf3",
    frame: false,
    webPreferences: {
      preload: node_path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.webContents.once("did-finish-load", () => {
    mainWindow?.focus();
  });
  mainWindow.on("closed", () => {
    console.info("[RestaurantOS] main window closed");
    mainWindow = null;
  });
  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl) => {
    console.error("[RestaurantOS] renderer failed to load", {
      errorCode,
      errorDescription,
      validatedUrl
    });
  });
  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("[RestaurantOS] renderer process gone", details);
  });
  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    console.info("[RestaurantOS] loading dev renderer", process.env.ELECTRON_RENDERER_URL);
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    if (process.env.ELECTRON_OPEN_DEVTOOLS === "1") {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    }
  } else {
    console.info("[RestaurantOS] loading packaged renderer");
    void mainWindow.loadFile(node_path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  electron.ipcMain.handle("restaurantos:terminal", () => ({
    platform: process.platform,
    version: electron.app.getVersion()
  }));
  electron.ipcMain.on("restaurantos:window:minimize", () => mainWindow?.minimize());
  electron.ipcMain.on("restaurantos:window:maximize", () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return;
    }
    mainWindow.maximize();
  });
  electron.ipcMain.on("restaurantos:window:close", () => mainWindow?.close());
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
