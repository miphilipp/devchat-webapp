import { fetchJson } from '@/rest'
import { storageAvailable } from '@/storage'

class MediaToken {
    public expiration: number
    public token: string

    constructor(token: string, expirationDateUnix: number) {
        this.token = token
        this.expiration = expirationDateUnix
    }
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

function getUserName(): string | undefined {
    const userData = localStorage.getItem('user')
    if (userData !== null) {
        return JSON.parse(userData).user
    }
    return undefined
}

export {
    login,
    logout,
    getUserName,
    getMediaToken,
}
