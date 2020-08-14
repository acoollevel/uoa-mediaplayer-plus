function downloadURI(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}

// TODO - add user configurable way to select the default resolution
var defaultResolution = "720p";
function setDefaultResolution(){
    console.log("Called set resolution");
    resolutionButtons = document.getElementsByClassName("explicit-resolution");
    console.log("Should have the buttons?");
    console.log(resolutionButtons)
    for(const resButton of resolutionButtons){
        if(resButton.firstChild.innerText == defaultResolution){
            resButton.click();
            console.log("Should have set default resolution to: " + defaultResolution);
            break;
        }
    }
}

function loadGlobalSettings(callback) {
    // declare default values for settings
    var settings = {
        volume: 1,
        online: false,
        server: "tct.pythonanywhere.com"
    }

    // load settings data from local storage
    chrome.storage.sync.get(["settings"], function(result) {
        settings = {...settings, ...result["settings"]};
        callback(settings);
    });
}

function saveGlobalSettings(settings) {
    chrome.storage.sync.set({"settings": settings});
}

function loadVideoSettings(video_id, callback) {
    // declare default values for video data
    var video_data = {
        position: 42, // default start position, skips copyright message
    }

    // load video data from local storage
    return chrome.storage.sync.get([video_id], function(result) {
        video_data = {...video_data, ...result[video_id]};
        callback(video_data);
    });
}

function saveVideoSettings(video_data) {
    chrome.storage.sync.set({[video_id]: video_data});
}
