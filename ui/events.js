import {fetchApi} from "./api.js"
import {datetimeFormat, getFormData} from "./helpers.js"

async function fillEvents(events) {
    const event_rows = events.map((event) => {
        return `<div class="tablerow">
        <div class="tableitem monospaced">${datetimeFormat(event.datetime)}</div>
        <div class="tableitem">${event.name} @${event.location}</div>
        </div>`
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