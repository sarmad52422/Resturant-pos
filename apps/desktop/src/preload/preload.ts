import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('restaurantos', {
  terminal: () => ipcRenderer.invoke('restaurantos:terminal'),
  window: {
    minimize: () => ipcRenderer.send('restaurantos:window:minimize'),
    maximize: () => ipcRenderer.send('restaurantos:window:maximize'),
    close: () => ipcRenderer.send('restaurantos:window:close'),
  },
});
