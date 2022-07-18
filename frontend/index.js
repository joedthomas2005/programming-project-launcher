//"installer" global exposed by preload (install, checkInstall ,launch)
const defaultLocation = "./app";

window.onload = () => {
    document.getElementById("progressIndicator").hidden = true;
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
    let mainButton = document.getElementById("mainButton");
    mainButton.disabled = true;
    mainButton.value = "Running";
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
    let mainButton = document.getElementById("mainButton");
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

    let mainButton = document.getElementById("mainButton");
    mainButton.disabled = true;
    mainButton.value = "Installing...";

}
function setMainButtonEvent(event){
    let mainButton = document.getElementById("mainButton");
    mainButton.disabled = false;
    mainButton.removeEventListener("click", launchButtonClickHandler);
    mainButton.removeEventListener("click", installButtonClickHandler);
    mainButton.removeEventListener("click", updateButtonClickHandler);

    switch(event) {
        case "install":
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




