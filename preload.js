const { contextBridge, ipcRenderer } = require("electron")
const path = require("path")
const defaultLocation = path.join(__dirname, "app")


contextBridge.exposeInMainWorld('actions', {
    install: (location=defaultLocation) => ipcRenderer.send("install", location),
    launch: (location=defaultLocation) => ipcRenderer.send("launch", location)
})