const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")
const actions = require("./actions")

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    
    ipcMain.on("install", (event, location) => {
        console.log("Install at " + location)
        actions.install(location)
    })
    ipcMain.on("launch", (event, location) => {
        actions.launch(location)
    })
    win.loadFile(path.join(__dirname, "frontend/index.html"))
}

app.whenReady().then(() => {
    createWindow()
})