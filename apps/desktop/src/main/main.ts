import { app, BrowserWindow, ipcMain } from 'electron';
import { writeFile } from 'node:fs/promises';
import { Socket } from 'node:net';
import { join } from 'node:path';
import { brandTheme } from '@restaurantos/shared';

if (process.platform === 'linux' && process.env.RESTAURANTOS_ENABLE_GPU !== '1') {
  app.disableHardwareAcceleration();
}

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;

interface PrintReceiptInput {
  html: string;
  printerName?: string;
  silent?: boolean;
}

interface EscPosTargetInput {
  devicePath?: string;
  host?: string;
  port?: number;
}

interface PrintEscPosInput extends EscPosTargetInput {
  openDrawer?: boolean;
  text: string;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1180,
    minHeight: 760,
    title: brandTheme.appName,
    backgroundColor: brandTheme.colors.canvas,
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

async function printReceipt({ html, printerName, silent = true }: PrintReceiptInput) {
  const printWindow = new BrowserWindow({
    width: 360,
    height: 640,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    await new Promise<void>((resolve, reject) => {
      printWindow.webContents.print(
        {
          deviceName: printerName,
          margins: { marginType: 'none' },
          printBackground: true,
          silent,
        },
        (success, failureReason) => {
          if (success) {
            resolve();
            return;
          }
          reject(new Error(failureReason || 'Receipt print failed'));
        },
      );
    });
    return { success: true };
  } finally {
    printWindow.close();
  }
}

async function printEscPos({ text, openDrawer = false, ...target }: PrintEscPosInput) {
  await writeRawPrinterBytes(target, buildEscPosReceipt(text, openDrawer));
  return { success: true };
}

async function kickCashDrawer(target: EscPosTargetInput) {
  await writeRawPrinterBytes(target, cashDrawerPulse());
  return { success: true };
}

async function writeRawPrinterBytes(target: EscPosTargetInput, payload: Buffer) {
  if (target.host) {
    await writeNetworkPrinter(target.host, target.port ?? 9100, payload);
    return;
  }

  if (target.devicePath) {
    await writeFile(target.devicePath, payload);
    return;
  }

  throw new Error('Printer host or device path is required');
}

async function writeNetworkPrinter(host: string, port: number, payload: Buffer) {
  await new Promise<void>((resolve, reject) => {
    const socket = new Socket();
    socket.setTimeout(5000);
    socket.once('error', reject);
    socket.once('timeout', () => {
      socket.destroy();
      reject(new Error('Printer connection timed out'));
    });
    socket.connect(port, host, () => {
      socket.write(payload, (error) => {
        if (error) {
          reject(error);
          return;
        }
        socket.end();
      });
    });
    socket.once('close', (hadError) => {
      if (!hadError) resolve();
    });
  });
}

function buildEscPosReceipt(text: string, openDrawer: boolean) {
  const commands = [
    Buffer.from([0x1b, 0x40]), // Initialize printer
    Buffer.from([0x1b, 0x61, 0x01]), // Center
    Buffer.from('RestaurantOS\n', 'utf8'),
    Buffer.from([0x1b, 0x61, 0x00]), // Left
    Buffer.from(`${text}\n\n\n`, 'utf8'),
    openDrawer ? cashDrawerPulse() : Buffer.alloc(0),
    Buffer.from([0x1d, 0x56, 0x42, 0x00]), // Partial cut
  ];

  return Buffer.concat(commands);
}

function cashDrawerPulse() {
  return Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]);
}

app.whenReady().then(() => {
  ipcMain.handle('restaurantos:terminal', () => ({
    platform: process.platform,
    version: app.getVersion(),
  }));
  ipcMain.handle('restaurantos:printers:list', async () => mainWindow?.webContents.getPrintersAsync() ?? []);
  ipcMain.handle('restaurantos:printers:print-receipt', async (_event, input: PrintReceiptInput) => printReceipt(input));
  ipcMain.handle('restaurantos:printers:print-escpos', async (_event, input: PrintEscPosInput) => printEscPos(input));
  ipcMain.handle('restaurantos:cash-drawer:kick', async (_event, input: EscPosTargetInput) => kickCashDrawer(input));
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
