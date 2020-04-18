import {fetchJson} from '@/rest'

interface Invitation {
    conversationId: number
    conversationTitle?: string
    recipient: number
}

function denieInvitation(id: number): Promise<any> {
    return fetchJson(`/invitation`, {
        action: 'denie',
        conversationId: id,
   }, 'PATCH')
}

function revokeInvitation(i: Invitation): Promise<any> {
    return fetchJson(`/invitation`, i, 'DELETE')
}

function postInvitation(i: Invitation): Promise<any> {
    return fetchJson(`/invitation`, i, 'POST')
}

function acceptInvitation(id: number): Promise<any> {
    return fetchJson(`/invitation`, {
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
