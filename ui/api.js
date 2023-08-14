const DEBUG = true
const API_HOST = "localhost"
const API_URL = `http://${API_HOST}/`
const API_WS_URL = `ws://${API_HOST}/`

class FetchError extends Error {
    constructor(message, status) {
      super(message)
      this.name = "FetchError"
      this.status = status
      this.msg = message
    }
  }

export async function fetchApi(method, path, data) {
    let options = {
        method: method, 
        headers: {
            'Content-Type': 'application/json'
        },
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
        throw new FetchError(resp_data.detail)
    }
}

export function websocketApi(path, id) {
    return new WebSocket(API_WS_URL + path + "/" + id)
}