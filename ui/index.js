import {fetchApi, websocketApi} from "./api.js"
import {getElections, handleElectionsWebsocketMessage} from "./elections.js"
import {getNextEvents} from "./events.js"

window.addEventListener("load", onLoad)
let socket;

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

async function onLoad() {
    getNextEvents()
    getElections()

    let websocket_id = localStorage.getItem("websocket_id")
    if (websocket_id === null) {
        websocket_id = makeid(16)
        localStorage.setItem("websocket_id", websocket_id)
    } 
    // connect to websocket
    socket = websocketApi("elections/websocket", websocket_id)
    socket.onmessage = handleElectionsWebsocketMessage

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