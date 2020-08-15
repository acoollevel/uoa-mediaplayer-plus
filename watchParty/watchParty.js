console.log("Loaded watch party");
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log(sender.tab ?
                  "from a content script:" + sender.tab.url :
                  "from the extension");
      if (request.state == true){

        extensionCalled = true;
        vid.play();
        sendResponse({response: "playing"});
      } else if (request.state == false){
        vid.pause();
        sendResponse({response: "stopping"});
      }
}); 