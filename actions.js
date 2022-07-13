const fs = require("fs")
const path = require("path")
const https = require("follow-redirects").https
const admZip = require("adm-zip")
const { exec } = require("child_process")

const gitURL = "https://github.com/joedthomas2005/programming-project/archive/refs/heads/master.zip"
const archiveName = "programming-project-master"

const launchCommand = "java -classpath \"build;lib\lwjgl.jar;lib\lwjgl-glfw.jar;lib\lwjgl-glfw-natives-windows.jar;lib\lwjgl-natives-windows.jar;lib\lwjgl-openal.jar;lib\lwjgl-openal-natives-windows.jar;lib\lwjgl-opencl.jar;lib\lwjgl-opengl.jar;lib\lwjgl-opengl-natives-windows.jar;lib\lwjgl-stb.jar;lib\lwjgl-stb-natives-windows.jar\""

function buildGame(installLocation){
    let outDirectory = path.join(installLocation, "build")
    if(fs.existsSync(outDirectory)){
        fs.rmSync(outDirectory, {
            recursive: true,
            force: true
        })
    }

    let srcFiles = []
    let srcRoot = path.join(installLocation, "src")
    let libDirectory = path.join(installLocation, "lib")
    let classpath = [path.join(installLocation, "build")]
    let files = fs.readdirSync(libDirectory);
    files.forEach((file, index) => {
        classpath.push(path.join(libDirectory, file))
    })

    getAllSourceFiles = (dir) => {
        let files = fs.readdirSync(dir);
        let directories = []
        files.forEach((file, index) => {
            if(fs.statSync(path.join(dir, file)).isDirectory()){
                directories.push(path.join(dir, file))
            }
            else{
                srcFiles.push(path.join(dir, file))
            }
        })
        directories.forEach((dir, index) => {
            getAllSourceFiles(dir) //Recursion !!
        })
        return 0
    }
    getAllSourceFiles(srcRoot)

    let buildCommand = `javac -d ${path.join(installLocation, "build")} -target 17 -cp \"${classpath.join(';')}\" ${srcFiles.join(" ")}`
    exec(buildCommand, (error, stdout, stderr) => {
        if(error){
            console.log(`error: ${error.message}`)
            return
        }
        if(stderr){
            console.log(`stderr: ${stderr.message}`)
            return
        }
        console.log("Built successfully")
    })
}


function installGame(installLocation){
    if(!fs.existsSync(installLocation)){
        fs.mkdirSync(installLocation, {
            recursive: true
        })
    }

    if(fs.existsSync(path.join(__dirname, "stardew-valley.zip"))){
        fs.rmSync(path.join(__dirname, "stardew-valley.zip"))
    }

    fs.readdir(installLocation, (err, files) => {
        files.forEach((file, index) => {
            fs.rmSync(path.join(installLocation, file), {
                recursive: true,
                force: true
            })
        })
    })
    const outFile =  fs.createWriteStream(path.join(__dirname, "stardew-valley.zip"))
    const request = https.get(gitURL, function(response){
        response.pipe(outFile)
        outFile.on("finish", () => {

            outFile.close();
            console.log("Download completed")
            let archive = new admZip(path.join(__dirname, "stardew-valley.zip"))
            archive.extractAllTo(path.join(installLocation), true)
            fs.rm(path.join(__dirname, "stardew-valley.zip"),  err => {if(err !== null){console.log(err)}})
            
            files = fs.readdirSync(path.join(installLocation, archiveName));
            files.forEach((file, index) => {
                fs.renameSync(path.join(installLocation, archiveName, file), path.join(installLocation, file), (err) =>{
                    if(err !== null){
                        console.log(err)
                    }
                })
            })
            fs.rm(path.join(installLocation, archiveName),{
                recursive: true,
                force: true
            }, (err) => {
                if(err !== null){
                    console.log(err)
                }
            })
            buildGame(installLocation)

        }).on("error", (err) => {
            fs.unlink(outFile)
            console.log(err)
        })
    })
}
module.exports = {
    install: installGame,

    launch: () => {
        console.log("Launch event")
    }
}
