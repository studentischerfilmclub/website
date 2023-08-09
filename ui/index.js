const DEBUG = true
const API_URL = "http://localhost:5000/"
const WS_URL = "ws://localhost:5000/"

class FetchError extends Error {
    constructor(message, status) {
      super(message)
      this.name = "FetchError"
      this.status = status
      this.msg = message
    }
  }

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
    return await fetch(request_url, options)
}

function websocketApi(path) {
    return new WebSocket(WS_URL + path)
}

// let placeLinks = {"Karlstorkino": "https://www.karlstorkino.de/reihe/studentischer-filmclub-heidelberg"}
window.addEventListener("load", onLoad)

let socket;

async function onLoad() {
    getNextEvents()
    getLastElections()

    // connect to websocket
    fetchApi("GET", "getVoteWebSocketId")
    .then((resp) => resp.json())
    .then((id) => {
        socket = websocketApi("voteWebSocket/" + id)
        socket.onmessage = handleSocketMessage
    })
}

async function getLastElections() {
    fetchApi("GET", "getLastElections")
    .then((resp) => resp.json())
    .then((elections) => {
        document.getElementById("last-votes").innerHTML = createElectionsHtml(elections)
    })
}

function createElectionsHtml(elections) {
    // console.log(elections)
    const election_rows = elections.map((election) => {
        console.log(election)
        const candidate_rows = Object.entries(election.candidates).map((candidate_and_vote) => {
            return `<div>${candidate_and_vote[0]}</div><div>${candidate_and_vote[1]}</div>`
        })
        return `<div class="election">
            <div>${datetimeFormat(election.published)}</div>
            <div class="candidates">
                ${candidate_rows.join("")}
            <div>
        </div>`
    })
    return election_rows.join("")
}

let is_live = false;
let vote_status = {}
let voters = 0;

function handleSocketMessage(event) {
    const data = JSON.parse(event.data)
    console.log("WS message:", data)
    if ("is_live" in data) {
        is_live = data["is_live"]
        setLiveIcon(is_live)
    } 
    if ("vote_status" in data) {
        vote_status = data["vote_status"]
    }
    if ("new_voter" in data) {
        voters += data["new_voter"]
    }
    for (let key in data) {
        if (!key in Object({"is_live": null, "vote_status": null, "new_voter": null})) {
            console.log("Unexpected key in websocket message:", data)
        }
    }
}

function setLiveIcon(live) {
    document.getElementById("vote-live").style.visibility = (live ? "visible" : "hidden")
}

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
    fetchApi("GET", "getNextEvents")
    .then((resp) => resp.json())
    .then((events) => fillEvents(events.slice(0,5)))
}

async function getAllEvents() {
    fetchApi("GET", "getAllEvents")
    .then((resp) => resp.json())
    .then((events) => fillEvents(events))
}

async function askEvent() {
    document.getElementById("new-event").style.visibility = "visible"
    document.getElementById("new-event-form").addEventListener("submit", submitNewEvent)
    document.getElementById("date").valueAsDate = new Date()
}

function getFormData(form) {
    return Object.fromEntries((new FormData(form)).entries())
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
    let containers = document.getElementsByClassName("popup-container")
    for (let container of containers) {
        container.style.visibility = "hidden"
    }
}

async function askVote() {
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

async function submitNewVote(e) {
    e.preventDefault()
    const candidates = Object.values(getFormData(e.target))
    fetchApi("POST", "postElection", candidates)
    .then((resp) => {
        if (resp.ok) {
            document.getElementById("new-vote").style.visibility = "hidden"
            document.getElementById("new-vote-form").reset()
        }
        else {
            resp.text().then((msg) => {
                console.error(resp.status, resp.statusText, msg)
                document.getElementById("new-vote-error").innerHTML = msg
            })
        }
    })
}