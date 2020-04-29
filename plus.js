var vid;
var controls;
var loaded = false;
var intended_speed = 1;

document.arrive(".shaka-volume-bar-container", function() {
    if (!loaded) {
        loaded = true;
        console.log("Loaded!");

        vid = document.getElementById("video");
        vid.addEventListener('play', function() {
            console.log(vid.playbackRate)
            vid.playbackRate = intended_speed;
            console.log(vid.playbackRate)
        })
        controls = document.getElementsByClassName("shaka-controls-container")[0]
        vol_slider = document.getElementsByClassName("shaka-volume-bar-container")[0]

        download_button = "<button class='material-icons' id='mpp-download' aria-label='Download' title='Download'>get_app</button>"
        vol_slider.insertAdjacentHTML("afterend", download_button)
        document.getElementById("mpp-download").addEventListener('click', function() {
            url_string = window.location.href;
            url_string = url_string.replace('.preview', '.mp4');
            window.open(url_string,'_blank');
        });

        speed_changer = document.getElementsByClassName("shaka-playback-rates")[0]
        speed_changer.addEventListener('click', function() {
            intended_speed = vid.playbackRate;
        })
    }
});

// Keybindings
document.addEventListener('keydown', function(event) {

    try {
        clearTimeout(timeout);
    } catch {}
    controls.setAttribute("shown", "true");
    timeout = setTimeout(function(){ controls.removeAttribute("shown"); }, 1000);

    // Pause with spacebar, 'k'
    if(event.keyCode == 32 || event.keyCode == 75) {
        event.preventDefault();
        if (vid.paused) {
            vid.play();
        } else {
            vid.pause();
        }
    }

    // Go fullscreen with 'f'
    if(event.keyCode == 70) {
        document.getElementsByClassName("shaka-fullscreen-button")[0].click();
    }

    // Seek forwards with '➡', 'l'
    if(event.keyCode == 39 || event.keyCode == 76) {
        event.preventDefault();
        vid.currentTime = vid.currentTime + 5;
    }

    // Seek backwards with '⬅', 'j'
    if(event.keyCode == 37 || event.keyCode == 74) {
        event.preventDefault();
        vid.currentTime = vid.currentTime - 5;
    }

    // Volume up with '⬆'
    if(event.keyCode == 38) {
        event.preventDefault();
        vid.volume = vid.volume + 0.05;
        if (vid.volume > 0.95) {
            vid.volume = 1;
        }
    }

    // Volume up with '⬇'
    if(event.keyCode == 40) {
        event.preventDefault();
        vid.volume = vid.volume - 0.05;
        if (vid.volume < 0.05) {
            vid.volume = 0;
        }
    }
});