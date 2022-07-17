const { contextBridge, ipcRenderer } = require("electron");
const path = require("path");

contextBridge.exposeInMainWorld('installer', {
    uninstall: location => ipcRenderer.invoke("uninstall", location),
    download: () => ipcRenderer.invoke("download"),
    build: location => ipcRenderer.invoke("build", location),
    extract: location => ipcRenderer.invoke("extract", location),
    launch: (location, launchOptions) => ipcRenderer.invoke("launch", location, launchOptions),
    checkInstalled: location => ipcRenderer.invoke("checkInstalled", location),
    getConfiguration: () => ipcRenderer.invoke("getConfiguration"),
    saveConfiguration: (configuration) => ipcRenderer.invoke("saveConfiguration", configuration)
});