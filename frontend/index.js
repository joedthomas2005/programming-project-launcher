//actions global exposed by preload (install, launch)

window.onload = () => {
    let installButton = document.getElementById("install")
    installButton.addEventListener("click", () => actions.install())
    let launchButton = document.getElementById("launch")
    launchButton.addEventListener("click", () => actions.launch())
}

