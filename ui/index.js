import {fetchApi, websocketApi} from "./api.js"
import {getElections, handleElectionsWebsocketMessage} from "./elections.js"
import {getNextEvents} from "./events.js"

window.addEventListener("load", onLoad)
let socket;

async function onLoad() {
    getNextEvents()
    getElections()

    // connect to websocket
    fetchApi("GET", "elections/websocket_id")
    .then((id) => {
        socket = websocketApi("elections/websocket", id)
        socket.onmessage = handleElectionsWebsocketMessage
    })
}

async function hidePopupContainers() {
    let containers = document.getElementsByClassName("popup-container")
    for (let container of containers) {
        container.style.visibility = "hidden"
    }
}
const backgrounds = document.getElementsByClassName("background")
const arr = [...backgrounds]
arr.map((element) => {element.onclick = hidePopupContainers})