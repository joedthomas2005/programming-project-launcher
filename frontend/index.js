//"installer" global exposed by preload (install, checkInstall ,launch)
const defaultLocation = "./app"

function setLaunchButtonEnabled(enabled){
    let launchButton = document.getElementById("launch");
    launchButton.hidden = !enabled;
    if(enabled){
        launchButton.addEventListener("click", () => installer.launch(defaultLocation,{
           width: 1920,
           height: 1080, 
           fullscreen: false,
           swapInterval: 1 
        }).then((success) => {
            alert("Goodbye!");
        }, (error) => {
            alert(`Oops! Something went wrong...\nError message is ${error}`);
        }))
    }
}

window.onload = () => {

    let installButton = document.getElementById("install");

    installButton.addEventListener("click", () => installer.install(defaultLocation).then((success) => {
        alert("Installed Successfully!");
        setLaunchButtonEnabled(true);   
    }, (error) => {
        alert(`Oops! Something went wrong...\nError message is ${error}`);
    }));


    installer.checkInstalled(defaultLocation).then((installed) => {
        setLaunchButtonEnabled(true);
    })
}


