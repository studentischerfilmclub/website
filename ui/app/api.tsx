const DEBUG = true
const API_URL = "http://localhost:5050/"
const API_WS_URL = "ws://localhost:5050/"


class FetchError extends Error {
    status: number;
    msg: string;
    constructor(message: string, status: number) {
      super(message)
      this.name = "FetchError"
      this.status = status
      this.msg = message
    }
  }

export async function fetchApi(method: string, path: string, data?: any) {
    let options : RequestInit = {
        method: method, 
        headers: {
            'Content-Type': 'application/json'
        },
        body: undefined,
        mode: undefined,
        credentials: undefined,
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

    const resp = await fetch(request_url, options)
    const resp_data = await resp.json()
    if (resp.ok) {
        return resp_data
    } else {
        console.error(resp.status, resp.statusText, resp_data.detail)
        throw new FetchError(resp_data.detail, 500)
    }
}