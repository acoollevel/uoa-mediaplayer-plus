document.addEventListener("DOMContentLoaded", function () {
    const menuElement = document.getElementById('example-menu');
    const menu = new SlideMenu(menuElement,{
        submenuLinkAfter: ' <i class="right fas fa-arrow-right"></i>',
        backLinkBefore: '<i class="fas fa-arrow-left"></i> ',
    });
    menu.open();
});

var settings;
loadGlobalSettings(function(returned){
    settings=returned;

    for (setting in settings) {
        console.log(setting)
        try {
            control = document.getElementById(setting);
            control.checked = settings.setting;
            control.addEventListener('change', function() {
                settings.setting = this.checked;
                saveGlobalSettings(settings);
            });
        } catch {}
    }
});