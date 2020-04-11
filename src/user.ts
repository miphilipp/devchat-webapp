import {fetchJson} from '@/auth'

interface User {
    id: number
    name: string
    email?: string
}

interface UserInConversation extends User {
    isAdmin: boolean
    color: string
    hasJoined: boolean
    hasLeft: boolean
    isDeleted: boolean
}

async function getUser(): Promise<User> {
    const res = await fetchJson(`/user`)
    return {id: res.id, name: res.name, email: res.email}
}

function makeInitialUser(user: User, hasJoined: boolean, isAdmin: boolean): UserInConversation {
    return {
        id: user.id,
        name: user.name,
        hasJoined,
        color: '#000',
        isAdmin,
        hasLeft: false,
        isDeleted: false,
    }
}

async function getUsersOfConversation(conversationId: number): Promise<UserInConversation[]> {
    const res = await fetchJson(`/conversation/${conversationId}/users`)
    if (res instanceof Array) {
        const users = (res as any[]).map((u: any): UserInConversation => {
            return {
                id: u.id,
                name: u.name,
                isAdmin: u.isAdmin,
                color: colorIndexToColor(u.colorIndex),
                hasJoined: u.hasJoined,
                hasLeft: u.hasLeft,
                isDeleted: u.isDeleted,
            }
        })
        return users as UserInConversation[]
    } else {
        throw Error('Invalid format')
    }
}

async function changePassword(oldPassword: string, newPassword: string) {
    await fetchJson(`/user/password`, {
        oldPassword,
        newPassword,
    }, 'PATCH')
}

async function deleteAccount() {
    await fetchJson(`/user`, undefined, 'DELETE')
}

async function getOtherUsers(prefix: string): Promise<User[]> {
    const res = await fetchJson(`/users?prefix=${prefix}&limit=15`)
    if (res instanceof Array) {
        return (res as any[]).map((u: any) => {
            return {id: u.id, name: u.name}
        })
    } else {
        throw Error('Invalid format')
    }
}

function colorIndexToColor(index: number): string  {

    const colors = [
        '#314A59',
        '#3ECA8F',
        '#FFED6F',
        '#FD7A4A',
        '#EC3651',
    ]

    const i = index % colors.length
    return colors[i]
}

export {
    User,
    UserInConversation,
    getOtherUsers,
    getUsersOfConversation,
    getUser,
    makeInitialUser,
    changePassword,
    deleteAccount,
}
