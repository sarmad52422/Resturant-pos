import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('restaurantos', {
  printers: {
    list: () => ipcRenderer.invoke('restaurantos:printers:list'),
    printReceipt: (input: { html: string; printerName?: string; silent?: boolean }) =>
      ipcRenderer.invoke('restaurantos:printers:print-receipt', input),
  },
  terminal: () => ipcRenderer.invoke('restaurantos:terminal'),
  window: {
    minimize: () => ipcRenderer.send('restaurantos:window:minimize'),
    maximize: () => ipcRenderer.send('restaurantos:window:maximize'),
    close: () => ipcRenderer.send('restaurantos:window:close'),
  },
});
