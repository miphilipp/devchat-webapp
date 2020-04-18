import {getToken} from '@/storage'

function authorizedRequest(
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
    return fetch(path, {
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

async function fetchJson(location: string, data?: any, method = 'GET', useApi = true): Promise<any> {
    const response = await authorizedRequest(location, method, useApi, JSON.stringify(data), 'application/json')
    return await handleResponse(response)
}

export {
    fetchJson,
    postData,
}
