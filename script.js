console.log('Lets write JavaScript');
let currentSong = new Audio();
let songs;
let currFolder;
const play = document.getElementById("play"); // ✅ moved to global scope

function getFilename(path) {
    return decodeURIComponent(path.split("/").slice(-1)[0]);
}

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    try {
        currFolder = folder;
        let a = await fetch(`${folder}/`);
        if (!a.ok) throw new Error(`Failed to load ${folder}/`);
        
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let as = div.getElementsByTagName("a");
        songs = [];

        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(getFilename(element.href)); // ✅ safer
            }
        }

        // Update playlist UI
        let songUL = document.querySelector(".songlist ul");
        songUL.innerHTML = songs.map(song => `
            <li>
                <img class="invert" width="34" src="img/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                    <div>song artist</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="img/play.svg" alt="">
                </div>
            </li>`
        ).join("");

        // Attach click events to songs
        Array.from(document.querySelectorAll(".songlist li")).forEach(e => { // ✅ fixed
            e.addEventListener("click", () => {
                playMusic(e.querySelector(".info div").innerText.trim());
            });
        });

        return songs;
    } catch (err) {
        console.error("Error loading songs:", err);
        return [];
    }
}

const playMusic = (track, pause = false) => {
    currentSong.src = `${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    try {
        let res = await fetch(`/songs/`);
        if (!res.ok) throw new Error("Failed to load /songs/");
        let response = await res.text();

        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");

        let array = Array.from(anchors);
        for (let index = 0; index < array.length; index++) {
            const e = array[index];
            if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
                let folder = e.href.split("/").slice(-2)[1];

                try {
                    let infoRes = await fetch(`/songs/${folder}/info.json`);
                    if (!infoRes.ok) throw new Error("info.json missing in " + folder);

                    let info = await infoRes.json();

                    cardContainer.innerHTML += `
                        <div data-folder="${folder}" class="card">
                            <div class="play">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none">
                                    <path d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z" 
                                          stroke="black" fill="#000" stroke-width="0.01" stroke-linejoin="round" />
                                </svg>
                            </div>
                            <img src="songs/${folder}/cover.jpeg" alt="">
                            <h2>${info.title}</h2>
                            <p>${info.description}</p>
                        </div>`;
                } catch (err) {
                    console.error("Error loading metadata for", folder, err);
                }
            }
        }

        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async item => {
                console.log("Fetching Songs from", item.currentTarget.dataset.folder);
                songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
                if (songs.length > 0) {
                    playMusic(songs[0]);
                }
            });
        });
    } catch (err) {
        console.error("Error displaying albums:", err);
    }
}

async function main() {
    await getSongs("songs/english songs");
    playMusic(songs[0], true);

    const prev = document.getElementById("prev");
    const next = document.getElementById("next");

    await displayAlbums();

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = 
            `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    prev.addEventListener("click", () => {
        let currentFile = getFilename(currentSong.src);
        let index = songs.findIndex(song => getFilename(song) === currentFile);
        if (index - 1 >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    next.addEventListener("click", () => {
        currentSong.pause();
        let currentFile = getFilename(currentSong.src);
        let index = songs.findIndex(song => getFilename(song) === currentFile);
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = "img/volume.svg";
        }
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = "img/mute.svg"; // ✅ fixed path
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = "img/volume.svg";
            currentSong.volume = 1.0; // ✅ reset to full volume
            document.querySelector(".range input").value = 100;
        }
    });
}

main();
