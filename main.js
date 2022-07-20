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
    actions.loadDevModeSetting();
    ipcMain.handle("uninstall", (_event, location) => actions.uninstall(location));
    ipcMain.handle("download", _event => actions.download());
    ipcMain.handle("build", (_event, location) => actions.build(location));
    ipcMain.handle("extract", (_event, location) => actions.extract(location));
    ipcMain.handle("launch", (_event, location, options) => actions.launch(location, options));
    ipcMain.handle("checkInstalled", (_event, location) => actions.checkInstalled(location));
    ipcMain.handle("getConfiguration", _event => actions.getConfiguration());
    ipcMain.handle("saveConfiguration", (_event, configuration) => actions.saveConfiguration(configuration));
    ipcMain.handle("checkForUpdate", _event => actions.checkForUpdate());
    ipcMain.handle("setDevMode", (_event, enabled) => actions.setDevMode(enabled));
    ipcMain.handle("getDevMode", _event => actions.getDevMode());
    win.loadFile(path.join(__dirname, "frontend/index.html"));
    // win.removeMenu();
};

app.whenReady().then(() => {
    createWindow();
});