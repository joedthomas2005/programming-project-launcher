//"installer" global exposed by preload (install, checkInstall ,launch)
const defaultLocation = "./app";

window.onload = () => {
    installer.checkInstalled(defaultLocation).then((installed) => {
        setMainButtonEvent(installed ? "launch" : "install");
    }, (error) => {
        alert(`Error, could not check install status\nError is ${error}`);
    });
};

function launchButtonClickHandler(){
    installer.launch(defaultLocation, {
    width:1920,
    height: 1080,
    fullscreen: false,
    swapInterval: 1})
    .then((success) => {
        alert("Goodbye!");
    }, (error) => {
        alert(`Oops! Something went wrong...\nError message is ${error}`);
    });
}

function installButtonClickHandler(){
    installer.install(defaultLocation).then((success) => {
        alert("Installed Successfully!");
        setMainButtonEvent("launch");
    }, (error) => {
        alert(`Oops! Something went wrong...\nError message is ${error}`);
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
            mainButton.disabled = false;
            mainButton.removeEventListener("click", installButtonClickHandler);
            mainButton.addEventListener("click", launchButtonClickHandler);
            mainButton.value = "Launch";
            break;
        default:
            alert(`Unrecognised main event ${event}`);
    }
}




