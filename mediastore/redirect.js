function offerRedirect(urlToSet){
    console.log("Offering redirect");
    console.log(`Redirect to: ${urlToSet}`);
    redirect_modal = `<p id="mpp-redirect"><strong>UoA MediaplayerPlus</strong> has detected this video may work with the new player. <a href="${urlToSet}">Switch to the new player!</a><p>`;
    document.getElementsByTagName('body')[0].insertAdjacentHTML('beforeend', redirect_modal);
    console.log("Should have injected html");
    console.log(document.getElementsByClassName('container')[0].children);
}

function check_redirect(event){
    console.log("load event called");
    console.log(this);
    console.log(event);
    if(this.status != 200){
        console.log("Response of background check was: " + this.status);
    } else {
        console.log("Background checked returned 200");
        urlToSet = window.location.href.replace("mediastore", "mediaplayer");
        offerRedirect(urlToSet);
    }
}

// get unique video id
var video_id_reg = /(?:ac\.nz)(.+?(?=\.preview))/;
var video_id = video_id_reg.exec(window.location.href)[1];
console.log("Video id value is: " + video_id);

console.log("Running background check");
url = "https://mediaplayer.auckland.ac.nz" + video_id + ".preview";
console.log(url);
check_req = new XMLHttpRequest();
check_req.addEventListener("load", check_redirect);
check_req.open('GET', url, true);
check_req.send();
