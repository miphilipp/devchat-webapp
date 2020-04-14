class MediaToken {
    public expiration: number
    public token: string

    constructor(token: string, expirationDateUnix: number) {
        this.token = token
        this.expiration = expirationDateUnix
    }
}

async function authorizedRequest(
    location: string,
    method: string,
    useApi: boolean,
    data?: any,
    contentType?: string): Promise<Response> {
    const headers = new Headers()
    const token = getToken()
    if (token !== undefined) {
        headers.append('Authorization', 'Bearer ' + token)
    }
    if (contentType !== undefined) {
        headers.append('Content-Type', contentType)
    }

    const path = useApi ? '/api/v1' + location : location
    return await fetch(path, {
        method,
        headers,
        body: data,
    })
}

async function handleResponse(response: Response): Promise<any> {
    if (response.ok) {
        const contentTypeField = response.headers.get('Content-Type')
        if (contentTypeField !== 'application/json') {
            return {code: response.status, statusText: response.statusText}
        }

        return response.json()
    } else {
        const contentTypeField = response.headers.get('Content-Type')
        if (contentTypeField === 'application/json') {
            throw {code: response.status, statusText: response.statusText, info: await response.json()}
        }

        throw {code: response.status, statusText: response.statusText}
    }
}

async function postData(location: string, data: any): Promise<any> {
    const response = await authorizedRequest(location, 'POST', true, data)
    return await handleResponse(response)
}

async function fetchJson(location: string, data?: any, method: string = 'GET', useApi = true): Promise<any> {
    const response = await authorizedRequest(location, method, useApi, JSON.stringify(data), 'application/json')
    return await handleResponse(response)
}
async function login(username: string, password: string): Promise<boolean> {
    const response = await fetch(`/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username,
            password,
        }),
    })

    if (!response.ok) {
        const contentTypeField = response.headers.get('Content-Type')
        if (contentTypeField === 'application/json') {
            throw {code: response.status, statusText: response.statusText, info: await response.json()}
        }
        throw {code: response.status, statusText: response.statusText}
    }

    const authHeader = response.headers.get('Authorization')
    if (authHeader === null) {
        return false
    }

    const token = authHeader.replace('Bearer ', '')
    localStorage.setItem('user', JSON.stringify({user: username, token}))

    const body = await response.json()
    if (body.success === true) {
        return true
    } else {
        return false
    }
}

async function logout(oneSided: boolean) {
    try {
        if (!oneSided) {
            await fetchJson(`/logout`, undefined, 'GET', false)
        }
    } catch (error) {
        console.error(error)
    } finally {
        window.localStorage.removeItem('user')
        window.localStorage.removeItem('media')
    }
}

async function getMediaToken(): Promise<string> {
    if (!storageAvailable()) {
        throw Error('Storage not supported')
    }

    let mediaToken
    const storageKey = 'media'
    const tokenData = localStorage.getItem(storageKey)
    if (tokenData === null) {
        mediaToken = await fetchMediaToken()
        localStorage.setItem(storageKey, JSON.stringify(mediaToken))
    } else {
        const mediaTokenJSON = JSON.parse(tokenData)
        mediaToken = new MediaToken(mediaTokenJSON.token, mediaTokenJSON.expiration)
    }

    const now = new Date()
    if (new Date(mediaToken.expiration) <= now) {
        mediaToken = await fetchMediaToken()
        localStorage.setItem(storageKey, JSON.stringify(mediaToken))
    }
    return mediaToken.token
}

async function fetchMediaToken(): Promise<MediaToken> {
    const res = await fetchJson('/mediatoken')
    return new MediaToken(res.token, res.expiration)
}

function getToken(): string | undefined {
    const userData = localStorage.getItem('user')
    if (userData !== null) {
        return JSON.parse(userData).token
    }
    return undefined
}

function getUserName(): string | undefined {
    const userData = localStorage.getItem('user')
    if (userData !== null) {
        return JSON.parse(userData).user
    }
    return undefined
}

function storageAvailable(): boolean {
    let storage
    try {
        storage = window.localStorage
        const x = '__storage_test__'
        storage.setItem(x, x)
        storage.removeItem(x)
        return true
    } catch (e) {
        const res =  e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            (storage && storage.length !== 0)
        return res === undefined ? false : res
    }
}

export {
    fetchJson,
    login,
    logout,
    getToken,
    getUserName,
    getMediaToken,
    storageAvailable,
    postData,
}
