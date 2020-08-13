document.addEventListener("DOMContentLoaded", function () {
    const menuElement = document.getElementById('example-menu');
    const menu = new SlideMenu(menuElement,{
        submenuLinkAfter: ' <i class="right fas fa-arrow-right"></i>',
        backLinkBefore: '<i class="fas fa-arrow-left"></i> ',
    });
    menu.open();
    var instance = OverlayScrollbars(menuElement); 
});

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
            }
        } catch {}
    }
    document.getElementById("server-link").href = "http://" + settings.server;
});