function request(
    location: string,
    method: string,
    useApi: boolean,
    data?: any,
    contentType?: string): Promise<Response> {
    const headers = new Headers()
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
    const contentTypeField = response.headers.get('Content-Type')
    if (response.ok) {
        if (contentTypeField !== 'application/json') {
            return {statusCode: response.status, statusText: response.statusText}
        }

        return response.json()
    } else {
        if (contentTypeField === 'application/json') {
            throw {statusCode: response.status, statusText: response.statusText, info: await response.json()}
        }

        throw {statusCode: response.status, statusText: response.statusText}
    }
}

async function postData(location: string, data: any): Promise<any> {
    const response = await request(location, 'POST', true, data)
    return handleResponse(response)
}

async function patchData(location: string, data: any): Promise<any> {
    const response = await request(location, 'PATCH', true, data)
    return handleResponse(response)
}

async function fetchJson(location: string, data?: any, method = 'GET', useApi = true): Promise<any> {
    const response = await request(location, method, useApi, JSON.stringify(data), 'application/json')
    return handleResponse(response)
}

export {
    fetchJson,
    postData,
    patchData,
}
