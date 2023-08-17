import {fetchApi} from "./api.js"
import {datetimeFormat, getFormData} from "./helpers.js"

const default_links = {
    karlstorkino: "https://karlstorkino.de/reihe/studentischer-filmclub-heidelberg",
    luxor: "https://tickets.luxor-kino.de/Luxor-Heidelberg",
}

async function fillEvents(events) {
    const event_rows = events.map((event) => {
        let event_text;
        if (event.type === "Kino")
            event_text = `Wir sehen: <span class="filmtitle">${event.name}</span>`
        else if (event.type === "Filmclub")
            event_text = `Der Filmclub stellt vor: <span class="filmtitle">${event.name}</span>`
        else 
            event_text = event.name
        
        let link = ""

        const location_lower = event.location.toLowerCase()
        if (location_lower in default_links)
            link = default_links[location_lower]
        if ("link" in event && event.link !== "")
            link = event.link

        return `<a class="event" href="${link}" target="_blank">
            <div><span class="date">${datetimeFormat(event.datetime)}</span> @<span class="location">${event.location}</span></div>
            <div>${event_text}</div>
        </a>`
    })
    document.getElementById("events-inject").innerHTML = event_rows.join("")
}

export async function getNextEvents() {
    const events = await fetchApi("GET", "events/next")
    fillEvents(events.slice(0,5))
}

async function getAllEvents() {
    const events = await fetchApi("GET", "events/all")
    fillEvents(events)
}

async function askEvent() {
    document.getElementById("new-event").style.visibility = "visible"
    document.getElementById("new-event-error").innerHTML = ""
    document.getElementById("new-event-form").addEventListener("submit", submitNewEvent)
    document.getElementById("date").valueAsDate = new Date()
}

async function submitNewEvent(e) {
    e.preventDefault();
    try {
        await fetchApi("POST", "events/post", getFormData(e.target))
        document.getElementById("new-event").style.visibility = "hidden"
        document.getElementById("new-event-form").reset()
        getNextEvents()
    } catch(err) {
        document.getElementById("new-event-error").innerHTML = text
    }
}

let choice_number = 3

document.getElementById("get-all-events").onclick = getAllEvents
document.getElementById("ask-event").onclick = askEvent