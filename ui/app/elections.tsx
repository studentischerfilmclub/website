import PopUpWindow from "./popupwindow"
import { useState, useRef, Ref, useEffect } from "react"
import {datetimeFormat, getFormData} from "./helpers.js"
import {fetchApi} from "./api"

//TODO: current problem: election is live by default and elections can't be closed this makes it impossible to post new elections

interface ElectionData {
    candidates: string[],
    votes: any, //todo
    title: string
}

function ElectionPopUp({ formRef, submit }: {
    formRef: Ref<HTMLFormElement>;
    submit: (data: FormData) => Promise<void>;
  }){
  const [stateChoiceNumber, setstateChoiceNumber] = useState(3); 
  
  async function addChoice() {
    setstateChoiceNumber(stateChoiceNumber+1)
  }

  async function removeChoice() {
    setstateChoiceNumber(stateChoiceNumber-1)
  }

  const filmInputs = Array.from({ length: stateChoiceNumber }, (_, index) => index + 1);

  return (
    <>
      Neue Abstimmung:
      <form id="new-election-form" ref={formRef} action={submit} >
          Titel:
          <div className="new-election-votes">
              <input className="new-event-item" type="text" name="title" defaultValue="Für ..." />
          </div>
          Filme:
          <div id="new-election-inputs">
            {filmInputs.map(filmNumber => (
                <input 
                key={`film-${filmNumber}`}
                className="new-event-item" 
                type="text" 
                name={`film ${filmNumber}`} 
                defaultValue={`Film ${filmNumber}`} 
                />
            ))}
          </div>
          Stimmen:
          <div className="new-election-votes">
              <input className="new-event-item" type="text" name="votes" defaultValue="1" />
          </div>
          <div className="button-container-vote">
              <button className="interact" onClick={addChoice}>
                  <span className="material-symbols-outlined">add_circle</span>
              </button>
              <button className="interact" onClick={removeChoice}>
                  <span className="material-symbols-outlined">delete</span>
              </button>
              <button className="button" type="submit" >
                  Ok
              </button>
          </div>
          <div id="new-election-error"></div>
      </form>
    </>
  )
}


export default function Elections() {
    const [stateNewElection, setStateNewElection] = useState(false); 
    const formRef = useRef<HTMLFormElement>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [liveElection, setLiveElection] = useState<ElectionData | null>(null);
    const [pastElections, setPastElections] = useState<ElectionData[]>([]);
    const [voteStatus, setVoteStatus] = useState<Record<string, number>>({});

    const getLiveElection = async () => {
        const election = await fetchApi("GET", "elections/live")
        setLiveElection(election)
        setVoteStatus(election.candidates)
    }

    const getPastElections = async () => {
        const elections = await fetchApi("GET", "elections/past")
        setPastElections(elections)
    }

    const formatLiveCandiates = (election: ElectionData | null) => {
        if (election === null) {
            return ""
        }

        const handleCandidateClick = (candidate: string) => {
            setVoteStatus((prev) => ({...prev, [candidate]: prev[candidate] === 1 ? 0 : 1}))
        }

        return (
            <>
                {Object.keys(election.candidates).map((candidate) => {
                    const isSelected = voteStatus[candidate];
                    return (
                        <div className={`candidate button filmtitle ${isSelected ? "dark-background" : ""}`} id={candidate} onClick={()=>handleCandidateClick(candidate)}>
                            {candidate}
                        </div>
                    )
                }
                )}
            </>
        )
    }

    const formatPastElection = (election: ElectionData | null) => {
        if (election === null) {
            return ""
        }
        return (
            <div className="election">
                <div className="election-title">{election.title}</div>
                <div className="election-candidates">{
                    Object.keys(election.candidates).map((candidate) =>
                        <div className="election-candidate">{candidate}</div>
                    )
                }</div>
            </div>
        )
    }

    useEffect(() => {
        getLiveElection()
        getPastElections()
    }, [])

    const handleNewElectionSubmit = async (formData: FormData) => {
        
        //todo do something here?
        try {
            let rawData = getFormData(formData)
            const candidates = Object.entries(rawData)
                .filter(([key]) => key.startsWith("film"))
                .map(([_, value]) => value as string);
            const data: ElectionData = {
                candidates: candidates,
                votes: rawData.votes, 
                title: rawData.title as string
              }
            await fetchApi("POST", "elections/post",
                data //{candidates: candidates, votes: new_election_form_data.votes, title: title}
            )
            setStateNewElection(false) //change visibility
            formRef.current?.reset();
            setErrorMessage('');
        } catch(err: unknown) {
            if(err instanceof Error) setErrorMessage(err.message || "An error occurred");
        }
    }

    return (
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
                        <div className="filmtitle" id="live-election-title">{liveElection?.title}</div>
                        <div id="voting-status"></div>
                    </div>
                    <div id="live-election-candidates"></div>
                        {formatLiveCandiates(liveElection)}
                    <div className="alle-container">
                        <button id="vote-button" className="button">vote</button>
                        <button id="close-election" className="button" >schließen</button>
                    </div>
                </div>
                <div id="past-elections">
                    {pastElections.map(formatPastElection)}
                </div>
            </div>
            <div className="alle-container">
                <button className="button" id="get-past-elections">
                    alle
                </button>
                <button className="button" id="ask-new-election" onClick={() => setStateNewElection(true)}>
                    neu
                </button>
                <PopUpWindow visibility={stateNewElection} hidePopUp={() => setStateNewElection(false)}>
                    <ElectionPopUp formRef={formRef} submit={handleNewElectionSubmit}/>
                </PopUpWindow>
            </div>
        </div>
    )
}