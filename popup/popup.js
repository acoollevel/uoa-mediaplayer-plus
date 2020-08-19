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

function updateOnlineEnabled() {
    if (settings.online) {
        document.getElementById("online-on").style.display = "block";
        document.getElementById("online-off").style.display = "none";
    } else {
        document.getElementById("online-off").style.display = "block";
        document.getElementById("online-on").style.display = "none";
    }
}

var settings;
loadGlobalSettings(function(returned){
    settings=returned;

    for (setting in settings) {
        console.log(setting)
        try {
            control = document.getElementById(setting);
            if (control.type == "checkbox") {
                control.checked = settings[setting];
                control.addEventListener('change', function() {
                    settings[this.id] = this.checked;
                    saveGlobalSettings(settings);
                });
            } else if (control.type == "url") {
                control.value = settings[setting];
                control.addEventListener('input', function() {
                    settings[this.id] = this.value;
                    console.log(settings)
                    saveGlobalSettings(settings);
                });
            } else if (control.type == "radioHolder"){
                defaultValue = settings[setting];
                radios = document.getElementById(setting).querySelectorAll(".radioHolderEntry");
               for(const radio of radios){
                   if(radio.value == defaultValue){
                       radio.checked = true;
                   }
                   radio.addEventListener("click", function () {
                    console.log(this.value);
                    settings[this.name] = this.value;
                    console.log(settings);
                    saveGlobalSettings(settings);
                   });
               }
            } 
        } catch {}
    }

    // update UI based on whether online mode is enabled
    document.getElementById("online").addEventListener('change', updateOnlineEnabled);
    updateOnlineEnabled();

    document.getElementById("server-link").href = "http://" + settings.server;
});
