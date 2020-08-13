var vid;
var controls;
var loaded = false;
var intended_speed = 1;

var settings;
loadGlobalSettings(function(returned){settings=returned;});

// get unique video id
var video_id_reg = /(?:ac\.nz)(.+?(?=\.preview))/;
var video_id = video_id_reg.exec(window.location.href)[1];
console.log("Video id value is: " + video_id);

var video_data;
loadVideoSettings(video_id, function(returned){video_data=returned;});

var popup_timeout;
var popup;
function show_popup(icon, string) {
    popup.innerHTML = "<span class='material-icons'>" + icon + "</span><p>" + string + "</p>";
    popup.classList.add("show-action-popup");
    try {
        clearTimeout(popup_timeout);
    } catch {}
    timeout = setTimeout(function(){ popup.classList.remove("show-action-popup"); }, 500);
}
document.addEventListener("visibilitychange", function() {
    // make sure popup is hidden
    popup.classList.remove("show-action-popup");
});

extensionCalled = false;
document.arrive(".shaka-volume-bar-container", function() {
    if (!loaded) {
        loaded = true;
        console.log("Loaded!");

        vid = document.getElementById("video");
        vid.addEventListener('play', function() {
            vid.playbackRate = intended_speed; // make sure playback speed is still correct
            document.getElementById("mpp-play").innerHTML = "pause" // update play icon
            if(!extensionCalled){
                vid.pause()
            }
        });
        vid.addEventListener('pause', function() {
            document.getElementById("mpp-play").innerHTML = "play_arrow" // update play icon
        });
        vid.addEventListener("timeupdate", function() {
            video_data.position = vid.currentTime;
            saveVideoSettings(video_data);
        });
        vid.addEventListener("volumechange", function() {
            settings.volume = vid.volume;
            if (vid.muted) {
                settings.volume = 0;
            }
            saveGlobalSettings(settings)
        });
        controls = document.getElementsByClassName("shaka-controls-container")[0]
        vol_slider = document.getElementsByClassName("shaka-volume-bar-container")[0]

        // apply settings
        vid.currentTime = video_data.position;
        console.log(vid.currentTime)
        console.log(video_data)
        vid.volume = settings.volume;

        // action info popup
        action_popup = "<div id='mpp-action-popup'></div>";
        document.getElementsByClassName("shaka-video-container")[0].insertAdjacentHTML("afterbegin", action_popup);
        popup = document.getElementById("mpp-action-popup");

        // download button
        download_button = "<button class='material-icons' id='mpp-download' aria-label='Download' title='Download'>get_app</button>"
        vol_slider.insertAdjacentHTML("afterend", download_button);

        // TODO: Add in ability for user to click up arrow to download the desired resolution?
        // Does the list of resolutions on offer to download need to check what is actually available for download in the mpd file?
        // Otherwise default to their preferred resolution in their settings?

        var downloadResReplacements = {"HD": "-slides.m4v", "SD": ".m4v", "LOW": "mp4", "AUDIO": ".m4a"}

        // TODO: Add in the ability to change the download link to the required url "terminator" for the desired quality
        document.getElementById("mpp-download").addEventListener('click', function() {
            url_string = window.location.href;
            url_string = url_string.replace('.preview', downloadResReplacements["HD"]);
            window.open(url_string,'_blank');
        });

        // snapshot button
        screenshot_button = "<button class='material-icons' id='mpp-screenshot' aria-label='Screenshot' title='Take Screenshot'>wallpaper</button>"
        vol_slider.insertAdjacentHTML("afterend", screenshot_button);
        document.getElementById("mpp-screenshot").addEventListener('click', function() {
            var canvas = document.createElement('canvas');
            canvas.width = vid.videoWidth;
            canvas.height = vid.videoHeight;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
            var dataURI = canvas.toDataURL('image/jpeg'); // can also use 'image/png'
            downloadURI(dataURI, "My Screenshot");
        });

        // keep intended speed
        speed_changer = document.getElementsByClassName("shaka-playback-rates")[0]
        speed_changer.addEventListener('click', function() {
            intended_speed = vid.playbackRate;
        })

        // play/pause button
        play_button = "<button class='material-icons' id='mpp-play' aria-label='Play/Pause' title='Play/Pause'>play_arrow</button>";
        document.getElementsByClassName("shaka-current-time")[0].insertAdjacentHTML("beforebegin", play_button);
        document.getElementById("mpp-play").addEventListener('click', function() {
            if (vid.paused) {
                extensionCalled = true;
                vid.play();
            } else {
                vid.pause();
            }
        });

        // volume button
        volume_button = "<button class='material-icons' id='mpp-volume' aria-label='Toggle Sound' title='Toggle Sound'>volume_up</button>"
        document.getElementsByClassName("shaka-volume-bar-container")[0].insertAdjacentHTML("beforebegin", volume_button);
        volume_button = document.getElementById("mpp-volume");
        document.getElementById("mpp-volume").addEventListener('click', function() {
            if (vid.muted) {
                vid.muted = false;
            } else {
                vid.muted = true;
            }
        });
        vid.addEventListener("volumechange", function() {
            if (vid.muted) {
                volume_button.innerHTML = "volume_off"
            } else if (vid.volume < 0.5) {
                volume_button.innerHTML = "volume_down"
            } else {
                volume_button.innerHTML = "volume_up"
            }
        });
    }
});

// Keybindings
document.addEventListener('keydown', function(event) {

    // prevent unexpected browser behaviour
    event.preventDefault();
    document.activeElement.blur();

    try {
        clearTimeout(timeout);
    } catch {}
    controls.setAttribute("shown", "true");
    timeout = setTimeout(function(){ controls.removeAttribute("shown"); }, 1000);

    // Pause with spacebar, 'k'
    if(event.keyCode == 32 || event.keyCode == 75) {
        if (vid.paused) {
            vid.play();
            show_popup("play_arrow", "Play");
        } else {
            vid.pause();
            show_popup("pause", "Pause");
        }
    }

    // Go fullscreen with 'f'
    if(event.keyCode == 70) {
        document.getElementsByClassName("shaka-fullscreen-button")[0].click();
    }

    // Seek forwards with '➡', 'l'
    if(event.keyCode == 39 || event.keyCode == 76) {
        vid.currentTime = vid.currentTime + 5;
        show_popup("skip_next", "Seek");
    }

    // Seek backwards with '⬅', 'j'
    if(event.keyCode == 37 || event.keyCode == 74) {
        vid.currentTime = vid.currentTime - 5;
        show_popup("skip_previous", "Seek");
    }

    // Volume up with '⬆'
    if(event.keyCode == 38) {
        vid.volume = vid.volume + 0.05;
        if (vid.volume > 0.95) {
            vid.volume = 1;
        }
        show_popup("volume_up", Math.round(vid.volume*100));
    }

    // Volume up with '⬇'
    if(event.keyCode == 40) {
        vid.volume = vid.volume - 0.05;
        if (vid.volume < 0.05) {
            vid.volume = 0;
        }
        show_popup("volume_down", Math.round(vid.volume*100));
    }

    // Increase speed with '.'
    if(event.keyCode == 190) {
        vid.playbackRate = vid.playbackRate + 0.25;
        if (vid.playbackRate > 3) {
            vid.playbackRate = 3;
        }
        intended_speed = vid.playbackRate;
        show_popup("fast_forward", vid.playbackRate + "x");
    }

    // Decrease speed with ','
    if(event.keyCode == 188) {
        vid.playbackRate = vid.playbackRate - 0.25;
        if (vid.playbackRate < 0.25) {
            vid.playbackRate = 0.25;
        }
        intended_speed = vid.playbackRate;
        show_popup("fast_rewind", vid.playbackRate + "x");
    }

    // Reset speed with '/'
    if(event.keyCode == 191) {
        vid.playbackRate = 1;
        intended_speed = vid.playbackRate;
        show_popup("speed", "1x");
    }

    // Mute/unmute with 'm'
    if(event.keyCode == 77) {
        if (vid.muted) {
            vid.muted = false;
            show_popup("volume_up", "Unmuted");
        } else {
            vid.muted = true;
            show_popup("volume_off", "Muted");
        }
    }
});