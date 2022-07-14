const { contextBridge, ipcRenderer } = require("electron");
const path = require("path");

contextBridge.exposeInMainWorld('installer', {
    install: (location) => ipcRenderer.invoke("install", location),
    launch: (location, launchOptions) => ipcRenderer.invoke("launch", location, launchOptions),
    checkInstalled: (location) => ipcRenderer.invoke("checkInstalled", location)
});