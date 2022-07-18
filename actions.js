const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const https = require("follow-redirects").https;
const admZip = require("adm-zip");

const gitURL = "https://github.com/joedthomas2005/programming-project/archive/refs/heads/master.zip";
const gitLastCommitAPI = "https://api.github.com/repos/joedthomas2005/programming-project/commits/master";
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

function getLatestCommit(){
    return new Promise((resolve, reject) => {
        https.get(gitLastCommitAPI, {"headers": {"User-Agent":"node-js/16.13.0"}},response => {
            if(response.statusCode >= 400){
                return reject(response.statusCode);
            }
            let resBody = "";
            response.on("data", chunk => {
                resBody += chunk;
            });
            response.on("end", () => {
                try{
                    let commitInfoJSON = JSON.parse(resBody);
                    let commitSHA = commitInfoJSON.sha;
                    return resolve(commitSHA);
                } catch (err){
                    return reject(err);
                }
            }); 
            response.on("error", err => {
                return reject(err);
            });
        });
    });
}

function checkForUpdate(){
    return new Promise((resolve, reject) => {
        if(!fs.existsSync("version.cur")){
            return reject("Could not get current version");
        }
        let currentVersion = fs.readFileSync("version.cur", {encoding: "utf-8"});
        getLatestCommit().then(latest => {
            console.log(`Latest version: ${latest}`);
            console.log(`Installed version: ${currentVersion}`);
            if(latest.trim() === currentVersion.trim()){
                resolve(false);
            }
            else{
                console.log("New version available");
                resolve(true);
            }
        }, err => {
            reject(err);
        });
    });
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
                if(response.statusCode >= 400){
                    return reject(response.statusCode);
                }
                response.pipe(archive);
                archive.on("finish", () => {
                    archive.close();
                    getLatestCommit().then(value => {
                        fs.writeFileSync("version.cur", value, {encoding: 'utf-8'});
                    }, err => {
                        console.error("COULD NOT GET LATEST COMMIT HASH: " + err);
                    });
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
    launch: launchGame,
    checkForUpdate: checkForUpdate
};
