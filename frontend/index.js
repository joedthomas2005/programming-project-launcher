//"installer" global exposed by preload (install, checkInstall ,launch)
const defaultLocation = "./app";
let mainButton;

window.onload = () => {
    mainButton = document.getElementById("mainBtn");
    document.getElementById("saveConfigBtn").onclick = () => {
        saveConfig().then(() => {
            alert("Configuration Saved!");
        }, err => {
            alert(`Could not save configuration.\nError is ${err}`);
        });
    };
    loadStoredConfig();
    installer.checkInstalled(defaultLocation).then((installed) => {
        if(installed){
            installer.checkForUpdate().then(updateAvailable => {
                setMainButtonEvent(updateAvailable ? "update" : "launch");
            }, err => {
                alert(`Error, could not check for updates...\nError is ${err}`);
            });
        }
        else{
            setMainButtonEvent("install");
        }
    }, (error) => {
        alert(`Error, could not check install status\nError is ${error}`);
    });
};

function loadStoredConfig(){
    installer.getConfiguration().then(config => {
        document.getElementById("resolution").value = `${config.width}x${config.height}`;
        document.getElementById("fullscreen").checked = config.fullscreen;
    });
    installer.getDevMode().then((dev) => {
        document.getElementById("devMode").checked = dev;
    }, err => {
        alert(err);
    });
}

function setMenuOpen(open){
    document.getElementById("configMenu").style.display = open ? "flex" : "none";
}

function getMenuOpen(){
    return document.getElementById("configMenu").style.display != "none";
}

function toggleMenu(){
    setMenuOpen(!getMenuOpen());
}

function saveConfig(){
    let dev = document.getElementById("devMode").checked;
    installer.setDevMode(dev);
    installer.getDevMode().then(enabled => {
        if(dev !== enabled) alert("Reload the launcher to enable/disable dev mode");
    });
    let fullscreen = document.getElementById("fullscreen").checked;
    let resolution = document.getElementById("resolution").value;
    let [width,height] = resolution.split("x");
    return installer.saveConfiguration({        //Promise
            width: width,
            height: height,
            fullscreen: fullscreen
    });
}

function launchButtonClickHandler(){
    installer.launch(defaultLocation, {
    width: 1920,
    height: 1080,
    fullscreen: false,
    swapInterval: 1})
    .then((success) => {
        setMainButtonEvent("launch");
    }, (error) => {
        alert(`Oops! Something went wrong...\nError message is ${error}`);
    });
    mainButton.disabled = true;
    mainButton.value = "Running";
}

function uninstall(){
    let secondaryButton = document.getElementById("secondaryBtn");
    secondaryButton.disabled = true;
    secondaryButton.value = "Uninstalling...";
    mainButton.disabled = true;
    installer.uninstall(defaultLocation).then(() => {
        alert("Uninstalled successfully!");
        setMainButtonEvent("install");
    });
}
function install(){
    return new Promise((resolve, reject) => {
        document.getElementById("progressIndicator").hidden = false;
        let progressBar = document.getElementById("progressBar");
        let progressLabel = document.getElementById("progressLabel");
        progressLabel.textContent = "Preparing Install...";
        progressBar.value = 0;
        installer.uninstall(defaultLocation)
        .then(() => {
            progressLabel.textContent = "Downloading...";
            progressBar.value += 25;
            return installer.download();
        })
        .then(() => {
            progressLabel.textContent = "Extracting...";
            progressBar.value += 25;
            return installer.extract(defaultLocation);
        })
        .then(() => {
            progressLabel.textContent = "Compiling...";
            progressBar.value += 25;
            return installer.build(defaultLocation);
        })
        .then(() => {
            progressLabel.textContent = "Done.";
            progressBar.value += 25;
            resolve("OK");
        })
        .catch(err => {
            reject(err);
        });
    });
}

function updateButtonClickHandler(){
    install().then(() => {
        setTimeout(() => setMainButtonEvent("launch"), 500);
    }, err => {
        alert(`Could not install update. Message is ${err}`);
        setMainButtonEvent("updated");
    });
    mainButton.disabled = true;
    mainButton.value = "Updating...";
}


function installButtonClickHandler(){
    install().then(() => {
        setTimeout(() => setMainButtonEvent("launch"), 500);
    }, err => {
        alert(`Could not install game. Message is ${err}`);
        setMainButtonEvent("install");
    });

    mainButton.disabled = true;
    mainButton.value = "Installing...";

}
function setMainButtonEvent(event){
    let secondaryButton = document.getElementById("secondaryBtn");
    secondaryButton.hidden = false;
    secondaryButton.disabled = false;
    secondaryButton.value = "Uninstall";
    mainButton.disabled = false;
    mainButton.removeEventListener("click", launchButtonClickHandler);
    mainButton.removeEventListener("click", installButtonClickHandler);
    mainButton.removeEventListener("click", updateButtonClickHandler);

    switch(event) {
        case "install":
            secondaryButton.hidden = true;
            mainButton.addEventListener("click", installButtonClickHandler);
            mainButton.value = "Install";
            break;
        case "launch":
            document.getElementById("progressIndicator").hidden = true;
            mainButton.addEventListener("click", launchButtonClickHandler);
            mainButton.value = "Launch";
            break;
        case "update":
            mainButton.addEventListener("click", updateButtonClickHandler);
            mainButton.value = "Update";
            break;
        default:
            alert(`Unrecognised main event ${event}`);
    }
}




