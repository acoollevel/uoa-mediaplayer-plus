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