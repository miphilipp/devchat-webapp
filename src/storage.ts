function getToken(): string | undefined {
    const userData = localStorage.getItem('user')
    if (userData !== null) {
        return JSON.parse(userData).token
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
    getToken,
    storageAvailable,
}
