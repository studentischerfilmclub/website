import {ReactNode} from "react"

export default function PopUpWindow({visibility, children, hidePopUp}: {
    visibility: boolean,
    children: ReactNode,
    hidePopUp: () => void
}) {
    if (visibility) {
        return (<div className="popup-container">
            <div className="background" onClick={hidePopUp}>
            </div>
            <div className="popup-window">
                {children}
            </div>
        </div>
        )
    } else {
        return (<div></div>)
    }
}