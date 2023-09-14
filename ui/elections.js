import {fetchApi} from "./api.js"
import {datetimeFormat, getFormData} from "./helpers.js"

let live = false;
let vote_status = {}
let voters = 0;

export function handleElectionsWebsocketMessage(event) {
    const data = JSON.parse(event.data)
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
            console.error("Unexpected key in websocket message:", data)
        }
    }
}

export async function getElections() {
    getPastElections()
}

function setLive(live) {
    document.getElementById("voting-status").innerHTML = ""
    document.getElementById("election-live").style.display = (live ? "block" : "none")
}

async function getLiveElection() {
    vote_status = {}
    const election = await fetchApi("GET", "elections/live")
    const candidate_rows = Object.keys(election.candidates).map((candidate) => `<button class="candidate button filmtitle" id="${candidate}">${candidate}</button>`)
    document.getElementById("live-election-candidates").innerHTML = candidate_rows.join("")
    for (let elem of document.getElementsByClassName("candidate")) {
        elem.onclick = () => {
            vote_status[elem.id] = vote_status[elem.id] === 1 ? 0 : 1
            elem.classList.toggle("dark-background")
        }
    }
}


async function getPastElections() {
    try {
        const elections = await fetchApi("GET", "elections/past")
        document.getElementById("past-elections").innerHTML = createElectionsHtml(elections)
    } catch(err) {
        console.error(err)
    }
}

function createSingleElectionHtml(election) {
    const candidates_and_votes = Object
        .entries(election.candidates)
    const candidate_rows = candidates_and_votes
        .sort((a, b) => b[1] - a[1])
        .map(([candidate, vote], index) => {
            if (index < election.votes) {
                return `<div class="vote-number">${vote}</div><div class="filmtitle"><span class="dark-background">${candidate}</span></div>`
            }
            return `<div class="vote-number">${vote}</div><div class="filmtitle">${candidate}</div>`
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
    const new_election_form_data = getFormData(e.target)
    const candidates = Object.entries(new_election_form_data)
                             .filter(([key, value]) => key.startsWith("film"))
                             .map(([key, value]) => value)
    try {
        await fetchApi("POST", "elections/post",
            {candidates: candidates, votes: new_election_form_data.votes}
        )
        document.getElementById("new-election").style.visibility = "hidden"
        document.getElementById("new-election-form").reset()
    } catch(err) {
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
    choice_number++
    let new_choice = document.createElement("input")
    new_choice.type = "text"
    new_choice.name = "film " + choice_number
    new_choice.classList.add("new-event-item")
    let form = document.getElementById("new-election-inputs")
    form.appendChild(new_choice)
}

async function removeChoice() {
    let form = document.getElementById("new-election-inputs")
    form.removeChild(form.lastChild)
    choice_number--
}

async function closeElection() {
    fetchApi("GET", "elections/close")
    getElections()
    setLive(false)
}

async function submitVote() {
    const candidates = Object.keys(vote_status)
    const vote = candidates.filter((candidate) => vote_status[candidate] === 1)
    try {
        const websocket_id = localStorage.getItem("websocket_id")
        await fetchApi("POST", `elections/vote/${websocket_id}`, vote)
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
        voting_status.innerHTML = err.msg
        voting_status.animate(
            [{opacity: 0}, {opacity: 1}],
            {duration: 100, iterations: 1}
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
