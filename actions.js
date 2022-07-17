const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const https = require("follow-redirects").https;
const admZip = require("adm-zip");

const gitURL = "https://github.com/joedthomas2005/programming-project/archive/refs/heads/master.zip";
const archiveName = "programming-project-master";
let launchConf = "launch.conf";

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
                return reject(error.message); //Command has failed to execute
            }
            if(stderr){
                return reject(error.message); //Command has failed during execution
            }
            return resolve("OK");
        });
    });
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
        
        let libFiles = fs.readdirSync(libDirectory);
        libFiles.forEach((file, index) => {
            classpath.push(path.join(libDirectory, file));
        });
        let launchCommand = `java -classpath \"${classpath.join(';')}\" Main ${width} ${height} ${fullscreen} ${swapInterval} ${resourceDirectory}`;
        exec(launchCommand, (error, stdout, stderr) => {
            if(error){
                return reject(error.message);
            }
            if(stderr){
                return reject(stderr.message);
            }
            return resolve("OK");
        });
    });
}

function deleteGame(installLocation){
    return new Promise((resolve, reject) => {
        if(fs.existsSync(installLocation)){
            try{
                let files = fs.readdirSync(installLocation);
                files.forEach((file, _index) => {
                    fs.rmSync(path.join(installLocation, file), {
                        recursive: true,
                        force: true
                    });
                });
                return resolve("OK");  
            } catch(err){
                return reject(err);
            }
        } else {
            return resolve("not installed");
        }
    });
}

function downloadGame(){
    return new Promise((resolve, reject) => {
        try{
            const archive = fs.createWriteStream(path.join(__dirname, "stardew-valley.zip"));
            https.get(gitURL, response => {
                if(![200, 302].includes(response.statusCode)){
                    return reject(response.statusCode);
                }
                response.pipe(archive);
                archive.on("finish", () => {
                    archive.close();
                    return resolve("OK");
                })
                .on("error", (err) => {
                    //Close writeStream and clean up
                    archive.destroy();
                    fs.rm(path.join(__dirname, "stardew-valley.zip"));
                    return reject(err);
                });
            });
        } catch(err){
            return reject(err);
        }
    });
}

function extractGame(installLocation){
    return new Promise((resolve, reject) => {
        if(!fs.existsSync(installLocation)){
            fs.mkdirSync((installLocation), {
                recursive: true
            });
        }
        let archive = new admZip(path.join(__dirname, "stardew-valley.zip"));
        
        try{
            archive.extractAllTo(installLocation, true);
            
            let files = fs.readdirSync(path.join(installLocation, archiveName));
            files.forEach((file, index) => {
                fs.renameSync(
                    path.join(installLocation, archiveName, file), 
                    path.join(installLocation, file)
                    );
                });
            } catch(err) {
                //All errors which could occur during this block are critical as the game will not be installed properly.
                return reject(err);
            }

            fs.rm(path.join(__dirname, "stardew-valley.zip"), err => {
                if(err){
                    console.error(err);  //Errors here are non-critical and so I will not reject the promise
                }
            });

            fs.rm(path.join(installLocation, archiveName), {
                recursive: true,
                force: true
            }, err => {
                if(err){
                    console.error(err); //Non-critical
                }
            });
            return resolve("OK");
    });
}

function installGame(installLocation){
    return new Promise((resolve, reject) => {
        const outFile =  fs.createWriteStream(path.join(__dirname, "stardew-valley.zip"));
        const request = https.get(gitURL, function(response){
            response.pipe(outFile);
            outFile.on("finish", () => {
                outFile.close();
                let archive = new admZip(path.join(__dirname, "stardew-valley.zip"));
                archive.extractAllTo(path.join(installLocation), true);
                fs.rm(path.join(__dirname, "stardew-valley.zip"),  err => {if(err){console.log(err);}});
                
                files = fs.readdirSync(path.join(installLocation, archiveName));
                files.forEach((file, index) => {
                    fs.renameSync(path.join(installLocation, archiveName, file), path.join(installLocation, file), (err) =>{
                        if(err){
                            return reject(err);
                        }
                    });
                });
                fs.rm(path.join(installLocation, archiveName),{
                    recursive: true,
                    force: true
                }, err => {
                    if(err){
                        return reject(err);
                    }
                });
                buildGame(installLocation).then(success => {
                    return resolve(true);
                }, error => {
                    return reject(error);
                });
                    
            }).on("error", err => {
                fs.unlink(outFile);
                return reject(err);
            });
        });
    });
}

function checkInstalled(installLocation){
    return new Promise((resolve, reject) => {
        if(!fs.existsSync(installLocation)){
            return resolve(false);
        }
        if(!fs.existsSync(path.join(installLocation, "build"))){
            return resolve(false);
        }
        if(!fs.existsSync(path.join(installLocation, "lib"))){
            return resolve(false);
        }
        return resolve(true);
    });
}

function getLaunchConfiguration(){
    return new Promise((resolve, reject) => {
        if(fs.existsSync(launchConf)){
            let rawJSON = fs.readFileSync(launchConf);
            try{
                let config = JSON.parse(rawJSON);  
                return resolve(config);
            } catch(err){
                return reject("invalid config");
            }
        } else {
            return reject("no config");
        }
    });
}

function saveLaunchConfiguration(configuration){
    return new Promise((resolve, reject) => {
        try{
            let rawJSON = JSON.stringify(configuration);
            fs.writeFile(launchConf, rawJSON, err => {
                if(err){
                    return reject(`error writing to launch.conf: ${err}`);
                }
                return resolve("OK");
            });
        } catch(err) {
            return reject("cannot convert to JSON");
        }
    });
}

module.exports = {
    getConfiguration: getLaunchConfiguration,
    saveConfiguration: saveLaunchConfiguration, 
    uninstall: deleteGame,
    download: downloadGame,
    extract: extractGame,
    build: buildGame,
    checkInstalled: checkInstalled,
    launch: launchGame
};
