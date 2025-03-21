const currentsong = new Audio();
let songs;
let currFolder;
function formatTime(seconds) {
    let roundedSeconds = Math.floor(seconds);
    let minutes = Math.floor(roundedSeconds / 60);
    let remainingSeconds = roundedSeconds % 60;

    let formattedMinutes = String(minutes).padStart(2, '0');
    let formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getsongs(folder) {
    currFolder = folder;

    // Fetch song list (HTML)
    let songResponse = await fetch(`https://.github.io/spotify/${currFolder}/`);
    let songText = await songResponse.text();
    let div = document.createElement('div');
    div.innerHTML = songText;
    let as = div.getElementsByTagName('a');

    songs = [];
    for (let i = 0; i < as.length; i++) {
        const element = as[i];
        if (element.href.endsWith('.mp3')) {
            songs.push(element.href.split(`/${currFolder}/`)[1]);
        }
    }

    // Fetch album metadata (JSON)
    let metadata = {};
    try {
        let metaResponse = await fetch(`https://varshtih.github.io/spotify/${currFolder}/info.json`);
        metadata = await metaResponse.json();
    } catch (error) {
        console.warn("No metadata found for", folder);
    }

    // Render song list
    let songsul = document.querySelector('.songlist ul');
    songsul.innerHTML = '';

    for (const song of songs) {
        let cleanSong = song.replaceAll("%20", " ");
        songsul.innerHTML += `
            <li>
                <img width="7%" src="images/music-solid.svg" alt="" class="filter">
                <div class="info">
                    <div class="song-name">${cleanSong}</div>
                    <div class="song-artist">${metadata.md || "Unknown Artist"}</div>
                </div>
                <img width="8%" src="images/playbutton.svg" class="filter">
            </li>`;
    }

    // Add event listeners to songs
    document.querySelectorAll(".songlist li").forEach(e => {
        e.addEventListener("click", () => {
            playmusic(e.querySelector(".info .song-name").textContent);
        });
    });

    return songs;
}

function playmusic(track, pause = false) {
    currentsong.src = `https://varshtih.github.io/spotify/${currFolder}/` + track;

    if (!pause) {
        currentsong.play();
        play.src = 'images/pause.svg'; // Update main play button
    }

    document.querySelector('.song-info').innerHTML = decodeURI(track);
    document.querySelector('.songtime').innerHTML = '00:00/00:00';

    // Update album play button
    document.querySelectorAll('.pb').forEach(button => {
        if (button.closest('.play-container').dataset.set === currFolder) {
            button.src = 'images/pause.svg';
        } else {
            button.src = 'images/playbutton.svg';
        }
    });

    currentsong.onpause = () => {
        play.src = 'images/playbutton.svg';
        document.querySelectorAll('.pb').forEach(button => {
            if (button.closest('.play-container').dataset.set === currFolder) {
                button.src = 'images/playbutton.svg';
            }
        });
    };
}

async function displayalbums() {
    let response = await fetch(`https://varshtih.github.io/spotify/songs/`);
    let text = await response.text();
    let div = document.createElement('div');
    div.innerHTML = text;
    let anchors = div.getElementsByTagName('a');
    let array = Array.from(anchors);

    let playcontainer = document.querySelector('.playlist-container');
    playcontainer.innerHTML = ''; // Clear existing content

    for (const e of array) {
        if (e.href.includes("/songs/")) {
            let folder = e.href.split('/').slice(-2)[0];
            let metaResponse = await fetch(`https://varshtih.github.io/spotify/songs/${folder}/info.json`);
            let metadata = await metaResponse.json();

            playcontainer.innerHTML += `
                <div data-set="${folder}" class="play-container">
                    <img class="hover" width="100%" src="songs/${folder}/cover.jpg" alt="${metadata.title}">
                    <h3 style="color: white;">${metadata.title}</h3>
                    <h4 style="color: white;">${metadata.md}</h4>
                    <div class="playbutt">
                        <img class="hover pb" style="width: 20px;" src="images/playbutton.svg" alt="">
                    </div>
                </div>`;
        }
    }

    // Add event listeners to album play buttons
    document.querySelectorAll('.play-container .pb').forEach(button => {
        button.addEventListener("click", async (e) => {
            e.stopPropagation();
            
            let albumDiv = e.currentTarget.closest('.play-container');
            let folder = albumDiv.dataset.set;

            if (currFolder === `songs/${folder}` && !currentsong.paused) {
                currentsong.pause();
                e.currentTarget.src = 'images/playbutton.svg';
                play.src = 'images/playbutton.svg';
            } else {
                songs = await getsongs(`songs/${folder}`);
                playmusic(songs[0]);

                document.querySelectorAll('.pb').forEach(btn => btn.src = 'images/playbutton.svg');
                e.currentTarget.src = 'images/pause.svg';
                play.src = 'images/pause.svg';
            }
        });
    });
}

async function main() {
    await getsongs("songs/ab");
    displayalbums();
    playmusic(songs[0], true);

    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = 'images/pause.svg';

            document.querySelectorAll('.pb').forEach(button => {
                if (button.closest('.play-container').dataset.set === currFolder.split('/')[1]) {
                    button.src = 'images/pause.svg';
                }
            });
        } else {
            currentsong.pause();
            play.src = 'images/playbutton.svg';

            document.querySelectorAll('.pb').forEach(button => {
                if (button.closest('.play-container').dataset.set === currFolder.split('/')[1]) {
                    button.src = 'images/playbutton.svg';
                }
            });
        }
    });

    prev.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            const ns = songs[index - 1];
            playmusic(ns);
        }
    });

    next.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            const ns = songs[index + 1];
            playmusic(ns);
        }
    });

    currentsong.addEventListener("timeupdate", () => {
        document.querySelector('.songtime').innerHTML = `${formatTime(currentsong.currentTime)}/${formatTime(currentsong.duration)}`;
        document.querySelector('.circle').style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    document.querySelector('.seek-bar').addEventListener("click", (e) => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector('.circle').style.left = percent + "%";
        currentsong.currentTime = ((currentsong.duration) * percent) / 100;
    });

    let hamburger = true;
    document.querySelector('.hamburger').addEventListener("click", () => {
        const b = document.querySelector('.left');
        const b1 = document.querySelector('.right');
        const b2 = document.querySelector('.play');
        if (hamburger) {
            b.style.left = "0%";
            b.style.transition = "all 1.3s ease";
            b1.style.marginLeft = "21vw";
            b1.style.transition = "all 1.3s ease";
            b2.style.width = "75%";
            hamburger = false;
        }
        else {
            b.style.left = "-100%";
            b.style.transition = "all 1.3s ease";
            b1.style.marginLeft = "2vw";
            b1.style.transition = "all 1.3s ease";
            b2.style.width = "95%";
            hamburger = true;
        }
    });

    document.querySelector('.vol-bar').getElementsByTagName('input')[0].addEventListener("change", (e) => {
        currentsong.volume = parseInt(e.target.value) / 100;
    });

    document.querySelector('.volumeimg').addEventListener("click", e => {
        if (e.target.src.includes("images/volume.svg")) {
            e.target.src = e.target.src.replace("/images/volume.svg", "images/mute.svg");
            document.querySelector('.vol-bar').getElementsByTagName('input')[0].value = 0;
            currentsong.volume = 0;
        }
        else {
            e.target.src = e.target.src.replace("images/mute.svg", "images/volume.svg");
            document.querySelector('.vol-bar').getElementsByTagName('input')[0].value = 10;
            currentsong.volume = .10;
        }
    });
}
main();