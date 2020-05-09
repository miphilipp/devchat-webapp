import { fetchJson } from '@/rest'

async function login(username: string, password: string) {
    await fetchJson('/login', { username, password }, 'POST', false)
    localStorage.setItem('user', username)
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
    }
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
}
