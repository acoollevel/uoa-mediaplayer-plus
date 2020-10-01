var vid;
var controls;
var loaded = false;
var intended_speed = 1;

var settings;
loadGlobalSettings(function(returned){settings=returned;});

// initialize tooltip library
tippy.setDefaultProps({
    theme: 'material',
    animation: 'scale',
    duration: [100, 80],
    arrow: false,
    allowHTML: true,
    interactive: true,
});

// get unique video id
var video_id_reg = /(?:ac\.nz)(.+?(?=\.preview))/;
var video_id = video_id_reg.exec(window.location.href)[1];
console.log("Video id value is: " + video_id);

var video_data;
loadVideoSettings(video_id, function(returned){video_data=returned;});

// entrypoint - functions are called from here
document.arrive(".explicit-resolution", function() {
    if (!loaded) {
        loaded = true;
        console.log("Loaded!");

        // if video is loaded in seek preview mode
        if ( window.location !== window.parent.location ) {
            enter_seek_mode();
        } else {
            // if there are no parameters load the video as normal
            inject_extra_features();
        }
        
    }
});

window.onhashchange = function() {
    console.log(window.location.hash.replace("#",""));
    vid.currentTime = window.location.hash.replace("#","");
};

function show_popup(icon, string) {
    popup = "<div id='mpp-action-popup'><span class='material-icons'>" + icon + "</span><p>" + string + "</p></div>";
    container = document.getElementsByClassName("shaka-video-container")[0]
    try {container.removeChild(document.getElementById("mpp-action-popup"));} catch {};
    container.insertAdjacentHTML("afterbegin", popup);
}

// enter a 'headless' player mode, without UI
function enter_seek_mode() {
    document.getElementsByClassName("shaka-controls-container")[0].style.display = "none";
    document.getElementsByClassName("shaka-spinner-container")[0].style.display = "none";
    vid = document.getElementById("video");
    vid.volume = 0;
    vid.pause();
    setResolution("360p");
    vid.ontimeupdate = function() {
        var canvas = document.createElement('canvas');
        canvas.width = vid.videoWidth;
        canvas.height = vid.videoHeight;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        var dataURI = canvas.toDataURL('image/jpeg'); // can also use 'image/png'
        window.parent.updateSeekPreview(dataURI);
    }; 
}

function seekTo(pos) { vid.currentTime = pos }

function updateSeekPreview(preview) {
    try {
        document.getElementById("mpp-seek-preview").src = preview;
    } catch {
        console.log("Couldn't display seek preview; tooltip already destroyed.")
    }
}

function inject_extra_features() {
    // add tooltip to seek bar
    const seek_tooltip = tippy('.shaka-seek-bar', {
        followCursor: 'horizontal',
        arrow: true,
    });

    function hoverEvent(e) {
        var seconds = e.target.max;
        var rect = e.target.getBoundingClientRect();
        var length = rect.right - rect.left - 12;
        var x = e.clientX - rect.left - 6; //x position within the element.
        var pos = ((x)/length) * (seconds);
        console.log(formatSeconds(pos));
        console.log(seek_tooltip)
        var frame = window.frames['mpp-seek-video'];
        frame.seekTo(pos);
        seek_tooltip[0].setContent("<img id='mpp-seek-preview' />" + formatSeconds(pos));
    }

    //attach to slider and fire on mousemove
    document.getElementsByClassName('shaka-seek-bar')[0].addEventListener('mousemove', hoverEvent);

    vid = document.getElementById("video");
    vid.addEventListener('play', function() {
        vid.playbackRate = intended_speed; // make sure playback speed is still correct
        document.getElementById("mpp-play").innerHTML = "pause" // update play icon
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

    // download button
    download_button = "<button class='material-icons' id='mpp-download' aria-label='Download' data-tippy-content='Download'>get_app</button>"
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
    screenshot_button = "<button class='material-icons' id='mpp-screenshot' aria-label='Screenshot' data-tippy-content='Screenshot'>wallpaper</button>"
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
    play_button = "<button class='material-icons' id='mpp-play' aria-label='Play/Pause' data-tippy-content='Play/Pause [K]'>play_arrow</button>";
    document.getElementsByClassName("shaka-current-time")[0].insertAdjacentHTML("beforebegin", play_button);
    document.getElementById("mpp-play").addEventListener('click', function() {
        if (vid.paused) {
            vid.play();
        } else {
            vid.pause();
        }
    });

    // volume button
    volume_button = "<button class='material-icons' id='mpp-volume' aria-label='Toggle Sound' data-tippy-content='Mute [M]'>volume_up</button>"
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
    tippy('.shaka-fullscreen-button', {content: 'Fullscreen [F]',});
    tippy('.shaka-overflow-menu-button', {content: 'More',});
    tippy('[data-tippy-content]');

    setResolution(settings.defaultPlaybackResolution);

    document.addEventListener('keydown', keybinds);

    // add iframe to load video seek preview images
    frame = "<iframe name='mpp-seek-video' src='" + window.location + "'>";
    container = document.getElementsByClassName("shaka-video-container")[0]
    container.insertAdjacentHTML("afterbegin", frame);
}

// Keybindings
function keybinds(event) {

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
};