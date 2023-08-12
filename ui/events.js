import {fetchApi} from "./api.js"
import {datetimeFormat} from "./datetimeFormat.js"

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

export async function getAllEvents() {
    const events = await fetchApi("GET", "getAllEvents")
    fillEvents(events)
}

export async function askEvent() {
    document.getElementById("new-event").style.visibility = "visible"
    document.getElementById("new-event-error").innerHTML = ""
    document.getElementById("new-event-form").addEventListener("submit", submitNewEvent)
    document.getElementById("date").valueAsDate = new Date()
}

async function submitNewEvent(e) {
    e.preventDefault();
    const data = Object.fromEntries((new FormData(e.target)).entries())
    try {
        await fetchApi("POST", "postEvent", data)
        document.getElementById("new-event").style.visibility = "hidden"
        document.getElementById("new-event-form").reset()
        getNextEvents()
    } catch(err) {
        document.getElementById("new-event-error").innerHTML = text
    }
}

export async function askVote() {
    document.getElementById("new-vote").style.visibility = "visible"
    document.getElementById("new-vote-form").addEventListener("submit", submitNewVote)
}

let choice_number = 3

async function addChoice() {
    let new_choice = document.createElement("input")
    new_choice.type = "text"
    choice_number++
    new_choice.name = String(choice_number)
    new_choice.classList.add("new-event-item")
    let form = document.getElementById("new-vote-inputs")
    form.appendChild(new_choice)
    console.log("added")
}

async function removeChoice() {
    let form = document.getElementById("new-vote-inputs")
    form.removeChild(form.lastChild)
    choice_number--
}