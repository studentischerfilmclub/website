import {fetchApi} from "./api.js"
import {datetimeFormat, getFormData} from "./helpers.js"

let live = false;
let vote_status = {}
let voters = 0;

export function handleElectionsWebsocketMessage(event) {
    const data = JSON.parse(event.data)
    console.log("WS message:", data)
    if ("live" in data) {
        live = data["live"]
        setLive(live)
        if (live)
            getLiveElection()
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

export async function getElections() {
    getPastElections()
}

function setLive(live) {
    let elem = document.getElementById("election-live")
    elem.style.visibility = (live ? "visible" : "hidden")
    elem.style.height = (live ? "fit-content" : 0)
}

async function getLiveElection() {
    const candidates = await fetchApi("GET", "elections/live")
    const candidate_rows = candidates.map((candidate) => `<button class="candidate" id="${candidate}">${candidate}</button>`)
    document.getElementById("live-election-candidates").innerHTML = candidate_rows.join("")
    for (let elem of document.getElementsByClassName("candidate")) {
        elem.onclick = () => {
            vote_status[elem.id] = vote_status[elem.id] === 1 ? 0 : 1
            elem.classList.toggle("candidate-selected")
        }
    }
}


async function getPastElections() {
    try {
        const elections = await fetchApi("GET", "elections/past")
        document.getElementById("last-elections").innerHTML = createElectionsHtml(elections)
    } catch(err) {
        console.error(err)
    }
}

function createSingleElectionHtml(election) {
    const candidate_rows = Object.entries(election.candidates).map((candidate_and_vote) => {
        return `<div>${candidate_and_vote[0]}</div><div>${candidate_and_vote[1]}</div>`
    })
    return `<div class="election">
        <div>${datetimeFormat(election.published)}</div>
        <div class="candidates">
            ${candidate_rows.join("")}
        </div>
    </div>`
}

function createElectionsHtml(elections) {
    const election_rows = elections.map((election) => createSingleElectionHtml(election))
    return election_rows.join("")
}

async function submitNewElection(e) {
    e.preventDefault()
    const candidates = Object.values(getFormData(e.target))
    try {
        await fetchApi("POST", "elections/post", candidates)
        document.getElementById("new-election").style.visibility = "hidden"
        document.getElementById("new-election-form").reset()
    } catch(err) {
        console.error(resp.status, resp.statusText, err.msg)
        document.getElementById("new-election-error").innerHTML = err.msg
    }
}

async function askElection() {
    document.getElementById("new-election").style.visibility = "visible"
    document.getElementById("new-election-error").innerHTML = ""
    document.getElementById("new-election-form").addEventListener("submit", submitNewElection)
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

async function closeElection() {
    fetchApi("GET", "elections/close")
    getElections()
}

async function submitVote() {
    console.log(vote_status)
    const candidates = Object.keys(vote_status)
    const vote = candidates.filter((candidate) => vote_status[candidate] === 1)
    try {
        await fetchApi("POST", "elections/vote", vote)
        let voting_status = document.getElementById("voting-status")
        voting_status.innerHTML = "ok!"
        voting_status.animate(
            [{opacity: 0}, {opacity: 1}],
            {duration: 100, iterations: 1}
        )
        voting_status.classList.add("vote-ok")
        voting_status.classList.remove("vote-error")
    } catch(err) {
        let voting_status = document.getElementById("voting-status")
        vote_status.innerHTML = err.msg
        voting_status.animate(
            [{opacity: 1}, {opacity: 0}, {opacity: 1}],
            {duration: 500, iterations: 1}
        )
        voting_status.classList.remove("vote-ok")
        voting_status.classList.add("vote-error")
    }
}

document.getElementById("get-past-elections").onclick = getPastElections
document.getElementById("ask-new-election").onclick = askElection
document.getElementById("close-election").onclick = closeElection
document.getElementById("election-add-choice").onclick = addChoice
document.getElementById("election-remove-choice").onclick = removeChoice
document.getElementById("vote-button").onclick = submitVote
