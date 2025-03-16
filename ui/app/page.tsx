'use client'

import Image from "next/image";
import { useState, ReactNode } from "react";
import {datetimeFormat, getFormData} from "./helpers.js"

function EventPopUp(){
  return (
    <>
      Neues Event:
      <form id="new-event-form">
          <label htmlFor="date">Datum </label>
          <input className="new-event-item" type="date" id="date" name="date" />
          <label htmlFor="time">Uhrzeit</label>
          <input className="new-event-item" type="time" id="time" name="time" value="19:00" />
          <label htmlFor="name">Name </label>
          <input className="new-event-item" type="text" id="name" name="name" value="Test" />
          <label htmlFor="name">Person(en)</label>
          <input className="new-event-item" type="text" id="people" name="people" value="Max, Joseph" />
          <label htmlFor="type">Typ </label>
          <input className="new-event-item" type="text" id="type" name="type" value="Kino/Filmclub/Treffen/Filmabend" />
          <label htmlFor="location">Ort</label>
          <input className="new-event-item" type="text" id="location" name="location" value="Data" />
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

function ElectionPopUp(){
  return (
    <>
      Neue Abstimmung:
      <form id="new-election-form">
          Titel:
          <div className="new-election-votes">
              <input className="new-event-item" type="text" name="title" value="Für ..." />
          </div>
          Filme:
          <div id="new-election-inputs">
              <input className="new-event-item" type="text" name="film 1" value="Film 1" />
              <input className="new-event-item" type="text" name="film 2" value="Film 2" />
              <input className="new-event-item" type="text" name="film 3" value="Film 3" />
          </div>
          Stimmen:
          <div className="new-election-votes">
              <input className="new-event-item" type="text" name="votes" value="1" />
          </div>
          <div className="button-container-vote">
              <button className="interact" id="election-add-choice" type="button">
                  <span className="material-symbols-outlined">add_circle</span>
              </button>
              <button className="interact" id="election-remove-choice" type="button">
                  <span className="material-symbols-outlined">delete</span>
              </button>
              <button className="button" type="submit">
                  Ok
              </button>
          </div>
          <div id="new-election-error"></div>
      </form>
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

function PopUpWindow({
  visibility, 
  children,
  hidePopUp
}: Readonly<{
  visibility: boolean,
  children: ReactNode,
  hidePopUp: () => void,
}>) {
  if (visibility) {
    console.log("visible!")
    return (
      <div className="popup-container"> 
        <div className="background" onClick={hidePopUp}></div>
        <div className="popup-window">
          {children}
        </div>
      </div>
    )
  }
  return (
    <div></div>
  );
}

export default function Home() {
  const [stateNewElection, setStateNewElection] = useState(false); 
  const [stateNewEvent, setStateNewEvent] = useState(false);
  const [stateNewPerson, setStateNewPerson] = useState(false);

  

  return (
    <div>
      <div className="content-block">
            <div className="topbar">
                <a className="topbar-item heading" href="#events">
                    Events
                </a>
                <a className="topbar-item heading" href="#abstimmungen">
                    Abstimmungen
                </a>
            </div>
            <div className="title">
                <img src="/assets/title.png" />
                <div className="subtitle">
                    <div>Magst du Filme? </div>
                    <div className="subtitle-second-line">
                        <div className="wir">Wir auch!</div>
                        <div className="melde">
                            <div className="text">
                                melde dich unter
                            </div>
                            <div className="socials">
                                <a href="https://www.instagram.com/filmclub_heidelberg/">
                                    <img src="/assets/instagram.svg" />
                                </a>
                                <a href="https://chat.whatsapp.com/D86oPArrxYC2yHW03AdBDW">
                                    <img src="/assets/whatsapp.svg" />
                                </a>
                                <a href="mailto:filmclub@karlstorkino.de">
                                    <img src="/assets/mail.svg" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="content-block text">
            <div>
                Der Studentische Filmclub Heidelberg ist eine Gruppe Filmbegeisterter.
                Wir sehen und diskutieren Filmkunst.
                Einmal im Monat stellen wir einen selbst ausgewählten Film im Karlstorkino vor.
                Wenn du dich für Filmkunst interessierst und Ahnung davon hast oder haben möchtest, 
                komm zu unseren Treffen und Kinovorstellungen.
            </div>

            <div>
                Bonus: F&uuml;r Studierende der Uni Heidelberg ist der Eintritt auf 4&euro; reduziert!
            </div>

            <div>
                Dies wird möglich gemacht durch finanzielle Unterstützung durch den Studierendenrat der Universität Heidelberg. 
            </div>
            <div className="sturalogo">
                <img src="assets/StuRa_Logo.svg" width="30%" />
            </div>
        </div>

        <div className="content-block events" id="events">
            <div className="heading">
                NAEchste Events
            </div>

            <div id="events-inject" className="container"></div>

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
                    <EventPopUp/>
                </PopUpWindow>
            </div>
        <div className="heading">
            Komm gerne dazu!
        </div>
    </div>

    <div className="content-block" id="abstimmungen">
        <div className="heading"> Abstimmungen </div>
        <div className="text container">
            Jeden Monat stimmen wir beim regelmäßigen Treffen am Donnerstag 
            in der Woche unserer Vorstellung über Filme ab.
            Einer der Filme wird in der Regel ein bis zwei Monate später im Karlstorkino 
            von uns vorgestellt und dort gezeigt.
        </div>
        <div id="elections" className="container">
            <div className="election" id="election-live">
                <div className="live-election-topbar">
                    <div>
                        <div className="live-dot-wrapper">
                            <span className="live-dot pulse"></span> 
                        </div>
                    </div>
                    <div className="filmtitle" id="live-election-title"></div>
                    <div id="voting-status"></div>
                </div>
                <div id="live-election-candidates"></div>
                <div className="alle-container">
                    <button id="vote-button" className="button">vote</button>
                    <button id="close-election" className="button" >schließen</button>
                </div>
            </div>
            <div id="past-elections"></div>
        </div>
        <div className="alle-container">
            <button className="button" id="get-past-elections">
                alle
            </button>
            <button className="button" id="ask-new-election" onClick={() => setStateNewElection(true)}>
                neu
            </button>
            <PopUpWindow visibility={stateNewElection} hidePopUp={() => setStateNewElection(false)}>
                <ElectionPopUp />
            </PopUpWindow>
        </div>
    </div>
    <script type="module" src="index.js"> </script>
    <script type="module" src="events.js"></script>
    <script type="module" src="elections.js"></script>
    </div>
  );
}
