const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const https = require("follow-redirects").https;
const admZip = require("adm-zip");

const gitURL = "https://github.com/joedthomas2005/programming-project/archive/refs/heads/master.zip";
const archiveName = "programming-project-master";

//This is a breadth-first tree traversal
function getDirectoryRecursive(dir){
    let contents = fs.readdirSync(dir);
    let directories = [];
    let files = [];
    contents.forEach((file, index) => {
        const absPath = path.join(dir, file);
        if(fs.statSync(absPath).isDirectory()){
            directories.push(absPath);
        }
        else{
            files.push(absPath);
        }
    });
    directories.forEach((directory, index) => {
        let subDirFiles = getDirectoryRecursive(directory);
        files = files.concat(subDirFiles);
    });
    return files;
}

function buildGame(installLocation){
    return new Promise((resolve, reject) => {
        let outDirectory = path.join(installLocation, "build");
        if(fs.existsSync(outDirectory)){
            fs.rmSync(outDirectory, {
                recursive: true,
                force: true
            });
        }
    
        let srcRoot = path.join(installLocation, "src");
        let libDirectory = path.join(installLocation, "lib");
        let classpath = [path.join(installLocation, "build")];
        let srcFiles = getDirectoryRecursive(srcRoot);
        let libFiles = fs.readdirSync(libDirectory);
        libFiles.forEach((file, index) => {
            classpath.push(path.join(libDirectory, file));
        });
    
        let buildCommand = `javac -d ${path.join(installLocation, "build")} -target 17 -cp \"${classpath.join(';')}\" ${srcFiles.join(" ")}`;
        exec(buildCommand, (error, stdout, stderr) => {
            if(error){
                reject(error.message);
            }
            if(stderr){
                reject(error.message);
            }
            resolve(true);
        })
    })

}

function launchGame(installLocation, launchOptions){
    return new Promise((resolve, reject) => {
        let width = launchOptions?.width | 1920;
        let height = launchOptions?.height | 1080;
        let fullscreen = launchOptions?.fullscreen | true;
        let swapInterval = launchOptions?.swapInterval | 1;
        let resourceDirectory = path.join(installLocation, "res");
        let classpath = [path.join(installLocation, "build")];
        let libDirectory = path.join(installLocation, "lib");
        
        console.log(`Resource directory: ${resourceDirectory}`);
        let libFiles = fs.readdirSync(libDirectory);
        libFiles.forEach((file, index) => {
            classpath.push(path.join(libDirectory, file));
        });
        let launchCommand = `java -classpath \"${classpath.join(';')}\" Main ${width} ${height} ${fullscreen} ${swapInterval} ${resourceDirectory}`;
        exec(launchCommand, (error, stdout, stderr) => {
            if(error){
                reject(error.message);
                return;
            }
            if(stderr){
                reject(stderr.message);
            }
            resolve(true);
        });
    })

}

function installGame(installLocation){
    return new Promise((resolve, reject) => {
        if(!fs.existsSync(installLocation)){
            fs.mkdirSync(installLocation, {
                recursive: true
            });
        }
    
        if(fs.existsSync(path.join(__dirname, "stardew-valley.zip"))){
            fs.rmSync(path.join(__dirname, "stardew-valley.zip"));
        }
    
        fs.readdir(installLocation, (err, files) => {
            files.forEach((file, index) => {
                fs.rmSync(path.join(installLocation, file), {
                    recursive: true,
                    force: true
                });
            });
        });
        const outFile =  fs.createWriteStream(path.join(__dirname, "stardew-valley.zip"));
        const request = https.get(gitURL, function(response){
            response.pipe(outFile);
            outFile.on("finish", () => {
                outFile.close();
                console.log("Download completed");
                let archive = new admZip(path.join(__dirname, "stardew-valley.zip"));
                archive.extractAllTo(path.join(installLocation), true);
                fs.rm(path.join(__dirname, "stardew-valley.zip"),  err => {if(err !== null){console.log(err);}});
                
                files = fs.readdirSync(path.join(installLocation, archiveName));
                files.forEach((file, index) => {
                    fs.renameSync(path.join(installLocation, archiveName, file), path.join(installLocation, file), (err) =>{
                        if(err !== null){
                            reject(err);
                        }
                    });
                });
                fs.rm(path.join(installLocation, archiveName),{
                    recursive: true,
                    force: true
                }, (err) => {
                    if(err !== null){
                        reject(err);
                    }
                })
                buildGame(installLocation).then((success) => {
                    resolve(true);
                }, (error) => {
                    reject(error);
                });
                    
            }).on("error", (err) => {
                fs.unlink(outFile);
                reject(err);
            });
        });
    })

}

function checkInstalled(installLocation){
    if(!fs.existsSync(installLocation)){
        return false
    }
    if(!fs.existsSync(path.join(installLocation, "build"))){
        return false
    }
    if(!fs.existsSync(path.join(installLocation, "lib"))){
        return false
    }
    return true
}

module.exports = {
    install: installGame,
    checkInstalled: checkInstalled,
    launch: launchGame
};
