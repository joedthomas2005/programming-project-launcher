//"installer" global exposed by preload (install, checkInstall ,launch)
const defaultLocation = "./app";

window.onload = () => {
    document.getElementById("progressIndicator").hidden = true;
    installer.checkInstalled(defaultLocation).then((installed) => {
        setMainButtonEvent(installed ? "launch" : "install");
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

function installButtonClickHandler(){
    document.getElementById("progressIndicator").hidden = false;
    let progressBar = document.getElementById("progressBar");
    let progressLabel = document.getElementById("progressLabel");
    progressLabel.textContent = "Preparing Install...";
    progressBar.value = 0;
    installer.uninstall(defaultLocation)
    .then(() => {
        progressLabel.textContent = "Downloading...";
        progressBar.value += 25;
        return installer.download(defaultLocation);
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
        setTimeout(() => setMainButtonEvent("launch"), 500);
    })
    .catch((error) => {
        alert(`Oops! Something went wrong...\nError message is ${error}`);
        setMainButtonEvent("install");
    });

    let mainButton = document.getElementById("mainButton");
    mainButton.disabled = true;
    mainButton.value = "Installing...";

}
function setMainButtonEvent(event){
    let mainButton = document.getElementById("mainButton");
    switch(event) {
        case "install":
            mainButton.disabled = false;
            mainButton.removeEventListener("click", launchButtonClickHandler);
            mainButton.addEventListener("click", installButtonClickHandler);
            mainButton.value = "Install";
            break;
        case "launch":
            document.getElementById("progressIndicator").hidden = true;
            mainButton.disabled = false;
            mainButton.removeEventListener("click", installButtonClickHandler);
            mainButton.addEventListener("click", launchButtonClickHandler);
            mainButton.value = "Launch";
            break;
        default:
            alert(`Unrecognised main event ${event}`);
    }
}




