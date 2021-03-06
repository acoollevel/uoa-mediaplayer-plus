var preview_load = false;
// used to limit the amount of times the preview is being updated
// acts as a step size for showing the next preview
const preview_timestep = 10; // in seconds
var current_preview_time = 0; // so we can apply thresholding

const preview_width = 200;
const preview_height = preview_width * 9/16;

// Manages automatically generating and storing preview
// frames as well as providing an interface to get those frames.
// the class is static so that only one iframe instance is generated.
class PreviewFrameManager {
    static iframe; // holds the video tha we capture for previews
    static vid_length; // the length of the video
    static frames; // database of previews we have already generated
    static generatorQueue; // queue of frames to be generated
    static currentFrame; // current frame we are generating
    static generatorStarted = false; // if we have started generating previews yet
    static urgentFrame = null; // holds th current urgent frame if any
    static frameStorageLocation; //holds the location in chrome.storage.local

    constructor() {
        throw new Error("Static class.")
    }

    static init() {
        // create iframe if not exist
        if(!PreviewFrameManager.iframe) {
            PreviewFrameManager.iframe = document.createElement("iframe")
            //PreviewFrameManager.iframe.classList.add("display-none")
            PreviewFrameManager.iframe.src = window.location.href
            PreviewFrameManager.iframe.setAttribute("loading", "eager")
            PreviewFrameManager.iframe.width = preview_width
            PreviewFrameManager.iframe.height = preview_height;
            document.body.appendChild(PreviewFrameManager.iframe)
            
            PreviewFrameManager.generatorQueue = [] // holds all the frames we want to generate in order
            PreviewFrameManager.frames = {} // holds finished frames
            PreviewFrameManager.frameStorageLocation = video_id + "PREVIEW_FRAMES"
            chrome.storage.local.get([PreviewFrameManager.frameStorageLocation], function(result) {
                PreviewFrameManager.frames = result[PreviewFrameManager.frameStorageLocation].preview_frames || {}; // remember frames for video
            });
        }  
    }
    
    static get video() {
        return PreviewFrameManager.iframe.contentWindow.document.getElementById("video")
    }

    // gets a preview frame
    // once frame is retrieved cb is called the the data uri
    // If a frame is already being pulled urgently
    // and another call to 'getUrgent' happens during generation
    // the old frame generation will be completely
    // forgotten about.
    static getUrgent(time, cb) {
        // round time to nearest preview_timestep
        let key = Math.ceil(time / preview_timestep) * preview_timestep;
        if(!(key in PreviewFrameManager.frames)) {
            console.log(`Preview frame doesn't exist at ${key} generating it.`)

            // we generate the frame using the urgentFrame to interrupt any
            // previous generation
            PreviewFrameManager.urgentFrame = {key: key, callback: cb};
        } else {
            cb(PreviewFrameManager.frames[key])
        }
    }


    static unshiftFrameIntoQueue(frame) {
        // make sure it's not complete already
        if(!(frame in PreviewFrameManager.generatorQueue) && !(frame.key in PreviewFrameManager.frames)) {
            PreviewFrameManager.generatorQueue.unshift(frame)
        }
    }


    static startGenerator() {
        // like no cap theres a weird ass 
        // bug where the preview iframe gets stuck seeking
        // and the thing that took me 4 HOURS to figure
        // out was you literally set the currentTime to itself
        // like literally if currentTime = 360
        // you just do it again and boom


        if (!this.generatorStarted) {
            this.generatorStarted = true;
        } else {
            return;
        }

        // this is called in the preparePreviewInIFrame function 
        // to make sure the video has element has loaded

        /*---------- START SETUP ----------*/

        // set vid length
        let seek_bar = document.querySelector(".shaka-seek-bar")
        PreviewFrameManager.vid_length = seek_bar.max;
        console.debug("Video length: ", PreviewFrameManager.vid_length)

        // once frames are shifted off the queue
        // they are stored in PreviewFrameManager.frames
        for(let i = 0; i < PreviewFrameManager.vid_length; i += preview_timestep) {
            PreviewFrameManager.generatorQueue.push({key: i, callback: (uri)=>{}})
        }

        /*---------- END SETUP ---------*/

        // we use the parameter gotoNextFrame
        // because if the video is not ready to be 
        // captured at the current point we call 
        // nextFrame again after a certain period of time
        let nextFrameFunc = function() {

            // urgent frame has priority over all other frames.
            if(PreviewFrameManager.urgentFrame) {

                // put the currently generating
                // frame back into the queue for now
                PreviewFrameManager.unshiftFrameIntoQueue(PreviewFrameManager.currentFrame)
                
                console.debug("Generating urgent frame: ", PreviewFrameManager.urgentFrame.key)
                PreviewFrameManager.currentFrame = PreviewFrameManager.urgentFrame
                PreviewFrameManager.video.currentTime = PreviewFrameManager.currentFrame.key
                PreviewFrameManager.urgentFrame = null; // so this if block only runs once per urgent frame
            } // if we have finished a frame or are just starting out generating frames
            else if(PreviewFrameManager.currentFrame === undefined || PreviewFrameManager.currentFrame.key in PreviewFrameManager.frames) {
                
                // skip over already generated frames i.e. from local storage
                do {
                    PreviewFrameManager.currentFrame = PreviewFrameManager.generatorQueue.shift();
                   
                    // we have reached end of queue and are finished
                    if(PreviewFrameManager.currentFrame === undefined) {
                        console.log("Finished generating previews.")
                        return;
                    }
                } while(PreviewFrameManager.currentFrame.key in PreviewFrameManager.frames)

                console.debug("Loading preview frame at time point: ", PreviewFrameManager.currentFrame.key)

                //update time
                PreviewFrameManager.video.currentTime = PreviewFrameManager.currentFrame.key
            }
            
            
            // we wait video to be loaded
            if(PreviewFrameManager.video.readyState < 2) {
                // so this is the stupid code where we constantly reassign the 
                // speed to fix the stinky bug :)
                PreviewFrameManager.video.currentTime = PreviewFrameManager.currentFrame.key
                setTimeout(nextFrameFunc, 200); 
                return; 
            }

            // video is ready to be captured
            console.log(`Successfully loaded preview frame at time point: ${PreviewFrameManager.currentFrame.key}`)
            
            let canvas = document.createElement('canvas');
            canvas.width = vid.videoWidth;
            canvas.height = vid.videoHeight;
            
            let ctx = canvas.getContext('2d');
            ctx.drawImage(PreviewFrameManager.video, 0, 0, canvas.width, canvas.height);
            
            // generate image url
            let uri = canvas.toDataURL("image/jpeg")
            console.log(uri)

            // callbacks
            PreviewFrameManager.frames[PreviewFrameManager.currentFrame.key] = uri
            PreviewFrameManager.currentFrame.callback(uri);
            
            // save frames in storage
            // we do async as to not block
            setTimeout(() => {
                chrome.storage.local.set({[PreviewFrameManager.frameStorageLocation]: {preview_frames: PreviewFrameManager.frames}});
            }, 0);

            // now we load the next frame in the queue
            setTimeout(nextFrameFunc, 10); 
        } 

        // start the loop
        nextFrameFunc();
    }
}

function setResolution(res) {
    resolutionButtons = document.getElementsByClassName("explicit-resolution");
    for(const resButton of resolutionButtons){
        if(resButton.firstChild.innerText == res){
            resButton.click();
            console.log("Should have set default resolution to: " + settings.defaultPlaybackResolution);
            break;
        }
    }
}

// main entry point for the iframe that is loaded in the 
// previewframemanager
function preparePreviewInIFrame() {

    // now content has been loaded we can start generating preview frames
    // we do this by sending the parent window a message to do so
    
    // get video
    let vid = document.getElementById("video")
    
    setResolution("540p")
    // hide unecessary features
    document.querySelector(".shaka-controls-container").remove()
    document.querySelector(".shaka-spinner-container").remove()
    
    vid.volume = 0;
    vid.pause();
    
    window.parent.postMessage("preview_video_loaded", "https://mediaplayer.auckland.ac.nz")
}

// this is to tell us when the preview video is loaded.
window.addEventListener("message", (event) => {
    // run only in top level window
    if(window.parent == window) {
        if(event.origin == "https://mediaplayer.auckland.ac.nz") {
            if(event.data == "preview_video_loaded") {
                PreviewFrameManager.startGenerator();
            }
        }
    }
})

// prepare seek preview
document.arrive(".shaka-seek-bar-container", () => {
    if(!preview_load) {
        preview_load = true;
        // check if we are in iframe or not
        if(window.parent == window) { // we are in root window so we create iframe
            
            // setup preview frame and text
            let seek_container = document.querySelector(".shaka-seek-bar-container")
            let preview_frame = document.createElement("img")
            preview_frame.id = "mpp-preview-frame"
            preview_frame.width = preview_width;
            preview_frame.height = preview_height;
            preview_frame.classList.add("display-none")
            seek_container.appendChild(preview_frame)

            let preview_time_display = document.createElement("span")
            preview_time_display.id = "mpp-preview-time-display"
            preview_time_display.classList.add("display-none")
            seek_container.appendChild(preview_time_display)

            // setup preview frame manager
            PreviewFrameManager.init();

            // setup preview frame appearing and dissapearing
            let seek_bar = document.querySelector(".shaka-seek-bar")
            seek_bar.addEventListener("mouseover", (event) => {
                document.getElementById("mpp-preview-frame").classList.remove("display-none")
                document.getElementById("mpp-preview-frame").classList.add("display-block")
                document.getElementById("mpp-preview-time-display").classList.remove("display-none")
                document.getElementById("mpp-preview-time-display").classList.add("display-block")
            });
            seek_bar.addEventListener("mouseout", (event) => {
                document.getElementById("mpp-preview-frame").classList.remove("display-block")
                document.getElementById("mpp-preview-frame").classList.add("display-none")
                document.getElementById("mpp-preview-time-display").classList.remove("display-block")
                document.getElementById("mpp-preview-time-display").classList.add("display-none")
            });
            seek_bar.addEventListener("mousemove", (event) => {
                let total_secs = event.target.max
                let seek_bounding_rect = event.target.getBoundingClientRect();
                let percent = (event.clientX - seek_bounding_rect.left) / seek_bounding_rect.width;
                
                let vid_pos = percent * total_secs;

                // update time display and get new bounding boxes
                document.getElementById("mpp-preview-time-display").innerHTML = formatTime(vid_pos)
                let ptd_b_rect = document.getElementById("mpp-preview-time-display").getBoundingClientRect()

                // update preview position
                let frame_left = clamp(event.clientX - 2*preview_width/3, 0, seek_bounding_rect.right-preview_width-40) // 40 is just a magic number that clamps it to the end of the bar
                document.getElementById("mpp-preview-frame").style.left = `${parseFloat(frame_left).toFixed(0)}px`;
                //update time position
                document.getElementById("mpp-preview-time-display").style.left = `${frame_left + preview_width/2 - ptd_b_rect.width/2}px`

                // if we are at the next previewing timestep
                if(Math.abs(current_preview_time - vid_pos) >= preview_timestep) {
                    //console.log(`Preview time: ${vid_pos}`)
                    current_preview_time = vid_pos
                    
                    // data uri for transparent image so the image link broken icon doesn't appear
                    document.getElementById("mpp-preview-frame").src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                    PreviewFrameManager.getUrgent(vid_pos, (uri) => {
                        document.getElementById("mpp-preview-frame").src = uri
                    })
                }
            });

        } else {
            // we are in iframe so run iframe specific code
            console.log("Running iFrame code")
            preparePreviewInIFrame();
        }
    } 
})