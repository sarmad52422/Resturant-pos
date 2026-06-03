"use strict";
const electron = require("electron");
const node_path = require("node:path");
const shared = require("@restaurantos/shared");
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
    title: shared.brandTheme.appName,
    backgroundColor: shared.brandTheme.colors.canvas,
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
  mainWindow.webContents.on("before-input-event", (event, input) => {
    const key = input.key.toLowerCase();
    const commandOrControl = input.control || input.meta;
    const shift = input.shift;
    if (commandOrControl && shift && key === "m") {
      mainWindow?.minimize();
      event.preventDefault();
      return;
    }
    if (commandOrControl && shift && key === "f") {
      toggleMaximize();
      event.preventDefault();
      return;
    }
    if (commandOrControl && shift && key === "q") {
      mainWindow?.close();
      event.preventDefault();
    }
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
function toggleMaximize() {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return;
  }
  mainWindow.maximize();
}
async function printReceipt({ html, printerName, silent = true }) {
  const printWindow = new electron.BrowserWindow({
    width: 360,
    height: 640,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    await new Promise((resolve, reject) => {
      printWindow.webContents.print(
        {
          deviceName: printerName,
          margins: { marginType: "none" },
          printBackground: true,
          silent
        },
        (success, failureReason) => {
          if (success) {
            resolve();
            return;
          }
          reject(new Error(failureReason || "Receipt print failed"));
        }
      );
    });
    return { success: true };
  } finally {
    printWindow.close();
  }
}
electron.app.whenReady().then(() => {
  electron.ipcMain.handle("restaurantos:terminal", () => ({
    platform: process.platform,
    version: electron.app.getVersion()
  }));
  electron.ipcMain.handle("restaurantos:printers:list", async () => mainWindow?.webContents.getPrintersAsync() ?? []);
  electron.ipcMain.handle("restaurantos:printers:print-receipt", async (_event, input) => printReceipt(input));
  electron.ipcMain.on("restaurantos:window:minimize", () => mainWindow?.minimize());
  electron.ipcMain.on("restaurantos:window:maximize", () => toggleMaximize());
  electron.ipcMain.on("restaurantos:window:close", () => mainWindow?.close());
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
