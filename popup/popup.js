document.addEventListener("DOMContentLoaded", function () {

    document.getElementById("testButton").addEventListener("click", function(){
        sendMessagePlayer(true);
     });

     document.getElementById("testButtonTwo").addEventListener("click", function(){
        sendMessagePlayer(false);
     });

    const menuElement = document.getElementById('example-menu');
    const menu = new SlideMenu(menuElement,{
        submenuLinkAfter: ' <i class="right fas fa-arrow-right"></i>',
        backLinkBefore: '<i class="fas fa-arrow-left"></i> ',
    });
    menu.open();
});

function sendMessagePlayer(stateSend) {
    console.log("Trying to send message");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {state: stateSend}, function(response) {
          console.log(response.response);
        });
    });
}

