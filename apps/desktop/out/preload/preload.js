"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("restaurantos", {
  printers: {
    list: () => electron.ipcRenderer.invoke("restaurantos:printers:list"),
    printEscPos: (input) => electron.ipcRenderer.invoke("restaurantos:printers:print-escpos", input),
    printReceipt: (input) => electron.ipcRenderer.invoke("restaurantos:printers:print-receipt", input)
  },
  cashDrawer: {
    kick: (input) => electron.ipcRenderer.invoke("restaurantos:cash-drawer:kick", input)
  },
  terminal: () => electron.ipcRenderer.invoke("restaurantos:terminal"),
  window: {
    minimize: () => electron.ipcRenderer.send("restaurantos:window:minimize"),
    maximize: () => electron.ipcRenderer.send("restaurantos:window:maximize"),
    close: () => electron.ipcRenderer.send("restaurantos:window:close")
  }
});
