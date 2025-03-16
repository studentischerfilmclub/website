import { useRef, useState, Ref } from "react"
import PopUpWindow from "./popupwindow"
import {datetimeFormat, getFormData} from "./helpers.js"
import { fetchApi } from "./api";


interface EventData {
    people?: string[];
    date: string,
    time: string,
    name: string,
    type: string,
    location: string,
    link: string,
}

interface Event {
    people?: string[];
    datetime: string,
    name: string,
    type: string,
    location: string,
    link?: string,
    id: string,
}

function EventPopUp({ formRef, submit }: {
    formRef: Ref<HTMLFormElement>;
    submit: (data: FormData) => Promise<void>;
  }){
  return (
    <>
      Neues Event:
      <form id="new-event-form" ref={formRef} action={submit}>
          <label htmlFor="date">Datum </label>
          <input className="new-event-item" type="date" id="date" name="date" />
          <label htmlFor="time">hrzeit</label>
          <input className="new-event-item" type="time" id="time" name="time" defaultValue="19:00" />
          <label htmlFor="name">Name </label>
          <input className="new-event-item" type="text" id="name" name="name" defaultValue="Test" />
          <label htmlFor="name">Person(en)</label>
          <input className="new-event-item" type="text" id="people" name="people" defaultValue="Max, Joseph" />
          <label htmlFor="type">Typ </label>
          <input className="new-event-item" type="text" id="type" name="type" defaultValue="Kino/Filmclub/Treffen/Filmabend" />
          <label htmlFor="location">Ort</label>
          <input className="new-event-item" type="text" id="location" name="location" defaultValue="Data" />
          <label htmlFor="location">Link (optional)</label>
          <input className="new-event-item" type="text" id="link" name="link" />
          <div></div>
          <div className="ok-container">
              <button className="button" type="submit">
                  Ok
              </button>
          </div>
      </form>
      <div id="new-event-error"></div>
    </>
  )
}



function PersonPopUp(){
  return (
    <>
      Du möchtest dabei sein?
      <form id="add-person-form">
          <label htmlFor="date">Name </label>
          <input className="new-event-item" type="text" id="name" name="name" />
          <div></div>
          <div className="ok-container">
              <button className="button" type="submit">
                  Ok
              </button>
          </div>
      </form>
      <div id="add-person-error"></div>
    </>
  )
}

const default_links : {[key: string]: string }= {
    karlstorkino: "https://karlstorkino.de/reihe/studentischer-filmclub-heidelberg",
    luxor: "https://tickets.luxor-kino.de/Luxor-Heidelberg",
    "casa del cafe": "https://www.casa-del-caffe.de/",
    "casa del caffe": "https://www.casa-del-caffe.de/",
    "casa": "https://www.casa-del-caffe.de/",
}

function intersperse(arr: any, sep: any) {
    return arr.flatMap((elem: any) => [sep, elem]).slice(1)
}

/*
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
        document.getElementById("add-person-error").innerHTML = err
    }
}
*/

export default function Events() {
    const [stateNewEvent, setStateNewEvent] = useState(false);
    const [stateNewPerson, setStateNewPerson] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [events, setEvents] = useState([]);
    const [askId, setAskId] = useState("");

    const getNextEvents = async () => {
        const events = await fetchApi("GET", "events/next")
        setEvents(events.slice(0,5))
    }

    const handleNewEventSubmit = async (formData: FormData) => {
        try {
            let rawData = getFormData(formData)
            const data: EventData = {
              people: (rawData.people as string).split(", "),
              date: rawData.date as string,
              time: rawData.time as string,
              name: rawData.name as string,
              type: rawData.type as string,
              location: rawData.location as string,
              link: rawData.link as string,
            }
            console.log(data);
            const resp = await fetchApi("POST", "events/post", data);
            console.log(resp)
            setStateNewEvent(false);
            formRef.current?.reset();
            getNextEvents();
            setErrorMessage('');
        } catch(err: unknown) {
            if(err instanceof Error) setErrorMessage(err.message || "An error occurred");
        }
    }

    const formatPeople = (people_list: string[] | undefined) => {
        if (people_list === undefined || people_list.length === 0)
            return ""
        return " - " + intersperse(people_list, ", ").reduce((elem: string, total: string) => elem + total)
    }

    const formatEvent = (event: Event) => {
        console.log(event)
        let event_text
        if (event.type === "Kino") {
            event_text = (<>
                Wer kommt mit ins Kino in <span className="filmtitle">{event.name}</span>? 
                {formatPeople(event.people)}
                <button
                    className="interact"
                    type="button"
                    onClick={() => {setAskId(event.id!); setStateNewPerson(true)}}
                >
                    <span className="material-symbols-outlined">add_circle</span>
                </button>
            </>)
            
        } else if (event.type === "Filmabend") {
            event_text = (<>
                Wir machen einen Filmabend und schauen: <span className="filmtitle">{event.name}</span>
                Wer kommt? {formatPeople(event.people)}
                <button 
                    className="interact"
                    type="button"
                    onClick={() => {setAskId(event.id!); setStateNewPerson(true)}}
                >
                    <span className="material-symbols-outlined">add_circle</span>
                </button>
            </>)
        } else if (event.type === "Filmclub")
            event_text = (<>
                Der Filmclub stellt vor: <span className="filmtitle">{event.name}</span>
            </>)
        else if (event.type === "Treffen")
            event_text = (<>
                Wir treffen uns zum labern/orgern! <span className="filmtitle">{event.name}</span>
            </>)
        else 
            event_text = event.name
        
        const location_lower = event.location.toLowerCase()
        const link = default_links[location_lower] && event.link

        return (<div>
            <div>
                <span className="date">{datetimeFormat(event.datetime)}</span> <a className="event" href={link} target="_blank">@<span className="location">{event.location}</span></a>
            </div>
            <div>
                {event_text}
            </div>
        </div>)
    }

    return (
        <div className="content-block events" id="events">
            <div className="heading">
                NAEchste Events
            </div>

            <div className="container">
                {events.map(formatEvent)}
            </div>

            <PopUpWindow visibility={stateNewPerson} hidePopUp={() => setStateNewPerson(false)}>
                <PersonPopUp/>
            </PopUpWindow>

            <div className="alle-container">
                <button className="button" id="get-all-events">
                    alle
                </button>
                <button className="button" id="ask-event" onClick={() => setStateNewEvent(true)}>
                    neu
                </button>
                <PopUpWindow visibility={stateNewEvent} hidePopUp={() => setStateNewEvent(false)}>
                    <EventPopUp formRef={formRef} submit={handleNewEventSubmit}/>
                </PopUpWindow>
            </div>

            <div className="heading">
                Komm gerne dazu!
            </div>
        </div>
    )
}