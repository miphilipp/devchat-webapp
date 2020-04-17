import {fetchJson} from '@/rest'

interface Invitation {
    conversationId: number
    conversationTitle?: string
    recipient: number
}

async function denieInvitation(id: number): Promise<any> {
    return await fetchJson(`/invitation`, {
        action: 'denie',
        conversationId: id,
   }, 'PATCH')
}

async function revokeInvitation(i: Invitation): Promise<any> {
    return await fetchJson(`/invitation`, i, 'DELETE')
}

async function postInvitation(i: Invitation): Promise<any> {
    return await fetchJson(`/invitation`, i, 'POST')
}

async function acceptInvitation(id: number): Promise<any> {
    return await fetchJson(`/invitation`, {
        action: 'accept',
        conversationId: id,
   }, 'PATCH')
}

async function getAllInvitations(): Promise<Invitation[]> {
    const invitations: Invitation[] = []
    const res = await fetchJson('/invitation')
    for (const el of res) {
        const i = {
            conversationId: el.conversationId,
            conversationTitle: el.conversationTitle,
            recipient: el.recipient,
        }
        invitations.push(i)
    }
    return invitations
}

export {
    Invitation,
    getAllInvitations,
    revokeInvitation,
    denieInvitation,
    acceptInvitation,
    postInvitation,
}
