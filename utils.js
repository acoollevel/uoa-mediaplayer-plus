function downloadURI(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}

function saveSettings() {
    chrome.storage.sync.set({[video_id]: video_data});
    this.console.log(settings);
    chrome.storage.sync.set({"settings": settings});
    saveSettingsTimeout = setTimeout(saveSettings, 10000); // reset countdown
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