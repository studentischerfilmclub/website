const DEBUG = true
const API_URL = "http://localhost:5000/"

async function fetchApi(method, path, data) {
    let options = {
        method: method, 
        headers: {
            'Content-Type': 'application/json'
        },
    }

    let data_string = ""
    const have_data = (typeof data !== "undefined")
    if (have_data) {
        data_string = JSON.stringify(data)
        options["body"] = data_string
    }

    if (DEBUG) {
        options["mode"] = "cors"
        options["credentials"] = "include"
    }

    const request_url = API_URL + path
    const response = await fetch(request_url, options);
    if (response.ok) {
        try {
            return response.json();
        } catch(err) {
            return response.text();
        }
    } else {
        console.log("ERROR:")
        console.log(response)
        throw "FetchError"
    }
}

// let placeLinks = {"Karlstorkino": "https://www.karlstorkino.de/reihe/studentischer-filmclub-heidelberg"}
window.addEventListener("load", getNextEvents)

function datetimeFormat(datetime) {
    // datetime in: YYYY-mm-ddThh:mm
    const sep_index = datetime.indexOf("T")
    const date = datetime.slice(0, sep_index).split("-")
    const time = datetime.slice(sep_index+1).split(":")
    return `${date[2]}.${date[1]}.${date[0]} ${time.slice(0,2).join(":")}`
}

async function fillEvents(events) {
    const event_rows = events.map((event) => {
        return `<div class="tablerow">
        <div class="tableitem monospaced">${datetimeFormat(event.datetime)}</div>
        <div class="tableitem">${event.name} @${event.location}</div>
        </div>`
    })
    document.getElementById("events-inject").innerHTML = event_rows.join("")
}

async function getNextEvents() {
    const events = await fetchApi("GET", "getNextEvents")
    fillEvents(events.slice(0,5))
}

async function getAllEvents() {
    const events = await fetchApi("GET", "getAllEvents")
    console.log(events)
    fillEvents(events)
}

async function askEvent() {
    document.getElementById("new-event-popup-container").style.visibility = "visible"
    document.getElementById("new-event-form").addEventListener("submit", submitNewEvent)
    document.getElementById("date").valueAsDate = new Date()
}

async function submitNewEvent(e) {
    e.preventDefault();
    const data = Object.fromEntries((new FormData(e.target)).entries())
    document.getElementById("new-event-popup-container").style.visibility = "hidden"
    const resp = await fetchApi("POST", "postEvent", data)
    console.log(resp)
    document.getElementById("new-event-form").reset()
}

async function hideNewEvent() {
    document.getElementById("new-event-popup-container").style.visibility = "hidden"
}