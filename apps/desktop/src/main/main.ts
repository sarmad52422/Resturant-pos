import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';

if (process.platform === 'linux' && process.env.RESTAURANTOS_ENABLE_GPU !== '1') {
  app.disableHardwareAcceleration();
}

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1180,
    minHeight: 760,
    title: 'RestaurantOS POS',
    backgroundColor: '#ffffff',
    frame: false,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow?.focus();
  });

  mainWindow.on('closed', () => {
    console.info('[RestaurantOS] main window closed');
    mainWindow = null;
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl) => {
    console.error('[RestaurantOS] renderer failed to load', {
      errorCode,
      errorDescription,
      validatedUrl,
    });
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[RestaurantOS] renderer process gone', details);
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    const key = input.key.toLowerCase();
    const commandOrControl = input.control || input.meta;
    const shift = input.shift;

    if (commandOrControl && shift && key === 'm') {
      mainWindow?.minimize();
      event.preventDefault();
      return;
    }

    if (commandOrControl && shift && key === 'f') {
      toggleMaximize();
      event.preventDefault();
      return;
    }

    if (commandOrControl && shift && key === 'q') {
      mainWindow?.close();
      event.preventDefault();
    }
  });

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    console.info('[RestaurantOS] loading dev renderer', process.env.ELECTRON_RENDERER_URL);
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    if (process.env.ELECTRON_OPEN_DEVTOOLS === '1') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    console.info('[RestaurantOS] loading packaged renderer');
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
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

app.whenReady().then(() => {
  ipcMain.handle('restaurantos:terminal', () => ({
    platform: process.platform,
    version: app.getVersion(),
  }));
  ipcMain.on('restaurantos:window:minimize', () => mainWindow?.minimize());
  ipcMain.on('restaurantos:window:maximize', () => toggleMaximize());
  ipcMain.on('restaurantos:window:close', () => mainWindow?.close());

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
