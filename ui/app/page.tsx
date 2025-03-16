'use client'

import Image from "next/image";
import Events from "./events"
import Elections from "./elections";
import LanguageSelector from "./languageselector";
import { useLanguage } from "./languagecontext";

const translations = {
    en: { events: "Events",
          voting: "Voting",
          likeMovies: "Do you like movies?",
          call: "reach us here",
          too: "You're not alone!",
          bonus: "Bonus: For students of the University of Heidelberg a ticket is only 4€!",
          description: "The Heidelberg Student Film Club is a group for film enthusiasts to watch and discuss the amazing medium and artform that is film. Once a month (on a Tuesday evening), we select a film to present and screen at Karlstorkino in Südstadt. Whether you’re a total film buff or a complete novice - if you’re interested in cinema, please feel free to come along to our meetings and screenings!",
          support: "This discount is made possible through the funding and support of the Heidelberg University Studierendenrat. ",
      },
    de: { events: "Events",
          voting: "Abstimmungen",
          likeMovies: "Magst du Filme?",
          call: "melde dich unter",
          too: "Wir auch!",
          bonus: "Bonus: Für Studierende der Uni Heidelberg ist der Eintritt auf 4€ reduziert!",
          description: "Der Studentische Filmclub Heidelberg ist eine Gruppe Filmbegeisterter. Wir sehen und diskutieren Filmkunst. Einmal im Monat stellen wir einen selbst ausgewählten Film im Karlstorkino vor. Wenn du dich für Filmkunst interessierst und Ahnung davon hast oder haben möchtest, komm zu unseren Treffen und Kinovorstellungen.",
          support: "Dies wird möglich gemacht durch finanzielle Unterstützung durch den Studierendenrat der Universität Heidelberg. ",
     }
  };  

export default function Home() {
  const { language } = useLanguage();
  return (
    <div>
      <div className="content-block">
            <div className="topbar">
                <LanguageSelector/>
                <a className="topbar-item heading" href="#events">
                    {translations[language].events}
                </a>
                <a className="topbar-item heading" href="#abstimmungen">
                {translations[language].voting}
                </a>
            </div>
            <div className="title">
                <img src="/assets/title.png" />
                <div className="subtitle">
                    <div>{translations[language].likeMovies} </div>
                    <div className="subtitle-second-line">
                        <div className="wir">{translations[language].too}</div>
                        <div className="melde">
                            <div className="text">
                                {translations[language].call}
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
            {translations[language].description}
            </div>

            <div>
                {translations[language].bonus}
            </div>

            <div>
                {translations[language].support}
            </div>
            <div className="sturalogo">
                <img src="assets/StuRa_Logo.svg" width="30%" />
            </div>
        </div>
    
        <Events />
        <Elections />

    </div>
  );
}
