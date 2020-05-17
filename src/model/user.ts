import {fetchJson} from '@/rest'

interface User {
    id: number
    name: string
    email?: string
}

interface UserInConversation extends User {
    isAdmin: boolean
    colorIndex: number
    hasJoined: boolean
    hasLeft: boolean
    isDeleted: boolean
    isOnline: boolean
}

async function getUser(): Promise<User> {
    const res = await fetchJson('/user')
    return {id: res.id, name: res.name, email: res.email}
}

function makeInitialUser(user: User, hasJoined: boolean, isAdmin: boolean): UserInConversation {
    return {
        id: user.id,
        name: user.name,
        hasJoined,
        colorIndex: 0,
        isAdmin,
        hasLeft: false,
        isDeleted: false,
        isOnline: false,
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
                colorIndex: u.colorIndex,
                hasJoined: u.hasJoined,
                hasLeft: u.hasLeft,
                isDeleted: u.isDeleted,
                isOnline: false,
            }
        })
        return users as UserInConversation[]
    } else {
        throw Error('Invalid format')
    }
}

function changePassword(oldPassword: string, newPassword: string): Promise<any> {
    return fetchJson('/user/password', {
        oldPassword,
        newPassword,
    }, 'PUT')
}

function deleteAccount(): Promise<any> {
    return fetchJson('/user', undefined, 'DELETE')
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
        '#03588C',
        '#118C76',
        '#59380E',
        '#F2CB05',
        '#8C1F33',
    ]

    const i = index % colors.length
    return colors[i]
}

export {
    User,
    UserInConversation,
    colorIndexToColor,
    getOtherUsers,
    getUsersOfConversation,
    getUser,
    makeInitialUser,
    changePassword,
    deleteAccount,
}
