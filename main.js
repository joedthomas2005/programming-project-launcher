const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const actions = require("./actions");

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    
    ipcMain.handle("install", (event, location) => actions.install(location));
    
    ipcMain.handle("launch", (event, location, options) => actions.launch(location, options));

    ipcMain.handle("checkInstalled", (event, location) => actions.checkInstalled(location))
    win.loadFile(path.join(__dirname, "frontend/index.html"));
};

app.whenReady().then(() => {
    createWindow();
});