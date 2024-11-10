import {fetchApi} from "./api.js" //do I need it

async function fillNextMovie(movie) {
    document.getElementById("next-movie-inject").innerHTML = "Als nächstes Zeigen wir: "//+movie
}

export async function getNextMovie() {
    const movie = "Nightcrawler" //await fetchApi("GET", "movie/next")
    fillNextMovie(movie)
}

async function askMovie() {
    document.getElementById("new-movie").style.visibility = "visible"
    document.getElementById("new-movie-error").innerHTML = ""
    document.getElementById("new-movie-form").addEventListener("submit", submitNewMovie)
    document.getElementById("movie-date").valueAsDate = new Date()
}

async function submitNewMovie(e) { //todo
    e.preventDefault()
    try {
        let data = getFormData(e.target)
        data.people = data.people.split(", ")
        console.log(data)
        await fetchApi("POST", "events/post", data)
        document.getElementById("new-event").style.visibility = "hidden"
        document.getElementById("new-event-form").reset()
        getNextEvents()
    } catch(err) {
        document.getElementById("new-event-error").innerHTML = err
    }
}

const movieBtn = document.getElementById("ask_movie");
if (movieBtn) {
    movieBtn.onclick = askMovie;
}