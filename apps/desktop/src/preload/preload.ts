import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('restaurantos', {
  printers: {
    list: () => ipcRenderer.invoke('restaurantos:printers:list'),
    printEscPos: (input: {
      devicePath?: string;
      host?: string;
      openDrawer?: boolean;
      port?: number;
      text: string;
    }) => ipcRenderer.invoke('restaurantos:printers:print-escpos', input),
    printReceipt: (input: { html: string; printerName?: string; silent?: boolean }) =>
      ipcRenderer.invoke('restaurantos:printers:print-receipt', input),
  },
  cashDrawer: {
    kick: (input: { devicePath?: string; host?: string; port?: number }) =>
      ipcRenderer.invoke('restaurantos:cash-drawer:kick', input),
  },
  terminal: () => ipcRenderer.invoke('restaurantos:terminal'),
  window: {
    minimize: () => ipcRenderer.send('restaurantos:window:minimize'),
    maximize: () => ipcRenderer.send('restaurantos:window:maximize'),
    close: () => ipcRenderer.send('restaurantos:window:close'),
  },
});
