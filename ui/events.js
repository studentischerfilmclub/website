import {fetchApi} from "./api.js"
import {datetimeFormat, getFormData} from "./helpers.js"

const default_links = {
    karlstorkino: "https://karlstorkino.de/reihe/studentischer-filmclub-heidelberg",
    luxor: "https://tickets.luxor-kino.de/Luxor-Heidelberg",
    "casa del cafe": "https://www.casa-del-caffe.de/",
    "casa del caffe": "https://www.casa-del-caffe.de/",
    "casa": "https://www.casa-del-caffe.de/",
}

function intersperse(arr, sep) {
    return arr.flatMap(elem => [sep, elem]).slice(1)
}

let current_ask_person_event_id = ""
export function askNewPerson(event_id) {
    current_ask_person_event_id = event_id
    document.getElementById("add-person").style.visibility = "visible"
    document.getElementById("add-person-error").innerHTML = ""
    document.getElementById("add-person-form").addEventListener("submit", submitNewPerson)
}

async function submitNewPerson(e) {
    e.preventDefault()
    try {
        let data = getFormData(e.target)
        data.event_id = current_ask_person_event_id
        await fetchApi("POST", "events/add_person", data)
        document.getElementById("add-person").style.visibility = "hidden"
        document.getElementById("add-person-form").reset()
        getNextEvents()
    } catch(err) {
        document.getElementById("add-person-error").innerHTML = text
    }
}

async function fillEvents(events) {
    const event_rows = events.map((event) => {
        console.log(event)
        let event_text
        if (event.type === "Kino") {
            let people = intersperse(event.people, ", ").reduce((elem, total) => elem + total)
            let add_person_button = `<button class="interact" type="button" onclick="askNewPerson('${event["_id"]}')">
                <span class="material-symbols-outlined">add_circle</span>
            </button>`
            event_text = `Wer kommt mit ins Kino in <span class="filmtitle">${event.name}</span>? - ${people} ${add_person_button}`
            
        } else if (event.type === "Filmclub")
            event_text = `Der Filmclub stellt vor: <span class="filmtitle">${event.name}</span>`
        else if (event.type === "Treffen")
            event_text = `Wir treffen uns zum labern/orgern! <span class="filmtitle">${event.name}</span>`
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
        document.getElementById("new-event-error").innerHTML = text
    }
}

let choice_number = 3

document.getElementById("get-all-events").onclick = getAllEvents
document.getElementById("ask-event").onclick = askEvent