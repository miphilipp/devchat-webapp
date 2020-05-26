import {UserInConversation, User, getUsersOfConversation, makeInitialUser} from '@/model/user'
import {Message, getMessages, getMessagesOfType, MessageType} from '@/model/message'
import {fetchJson} from '@/rest'

interface IConversation {
    title: string
    id: number
    repoURL: string
    numberOfUnreadMessages: number
}

class Conversation implements IConversation {
    public title: string
    public id: number
    public repoURL: string
    public numberOfUnreadMessages: number
    public members: UserInConversation[] = []
    public messages: Message[] = []
    public scrollPosition = 0

    constructor(id: number, title: string, repo: string, nUnreadMessages = 0) {
        this.id = id
        this.title = title
        this.repoURL = repo
        this.numberOfUnreadMessages = nUnreadMessages
    }
}

function patchConversation(conversationId: number, data: any): Promise<any> {
    return fetchJson(`/conversation/${conversationId}`, data , 'PATCH')
}

async function postConversation(
    title: string,
    repo: string,
    initialMembers: User[],
    self: User): Promise<Conversation> {

    const res = await fetchJson(`/conversation`, {
        title,
        repoUrl: repo,
        initialMembers: initialMembers.map((u: User) => u.id),
    }, 'POST')

    const members = initialMembers.map((u: User) => makeInitialUser(u, false, false))
    members.push(makeInitialUser(self, true, true))
    const conversation = new Conversation(res.id, title, '')
    conversation.members = members
    return conversation
}

function setAdminStatus(conversationId: number, memberId: number, state: boolean): Promise<any> {
    return fetchJson(`/conversation/${conversationId}/users/${memberId}`, {
        state,
    }, 'PATCH')
}

function deleteMember(conversationId: number, memberId: number): Promise<any> {
    return fetchJson(`/conversation/${conversationId}/users/${memberId}`, undefined, 'DELETE')
}

function makeEmptyConversation(): Conversation {
    return new Conversation(-1, '', '')
}

function leaveConversation(conversationId: number, ownId: number, adminSuccessorId = 0): Promise<any> {
    let path = `/conversation/${conversationId}/users/${ownId}`
    if (adminSuccessorId !== 0) {
        path = `/conversation/${conversationId}/users/${ownId}?newadmin=${adminSuccessorId}`
    }
    return fetchJson(path, undefined, 'DELETE')
}

function deleteConversation(id: number): Promise<any> {
    return fetchJson(`/conversation/${id}`, undefined, 'DELETE')
}

async function getCompleteConversation(id: number, title: string, nUnreadMessages: number): Promise<Conversation> {
    const members = await getUsersOfConversation(id)
    const messages = await getMessages(id, 10)
    const conversation = new Conversation(id, title, '', nUnreadMessages)
    conversation.members = members

    if (messages.length > 0) {
        const hiddenCodeMessages = await getMessagesOfType(MessageType.Code, id, messages[0].id, 25)
        hiddenCodeMessages.forEach((m: Message) => m.invisible = true)
        messages.unshift(...hiddenCodeMessages)
    }

    conversation.messages = messages
    conversation.messages.sort((a: Message, b: Message) => a.id - b.id )
    return conversation
}

async function getInitialConverstaions(): Promise<Conversation[]> {
    const conversations: Conversation[] = []
    const res = await fetchJson('/conversation')
    for (const c of res) {
        const conversation = await getCompleteConversation(c.id, c.title, c.nUnreadMessages)
        conversations.push(conversation)
    }
    return conversations
}

export {
    IConversation,
    Conversation,
    getInitialConverstaions,
    deleteConversation,
    postConversation,
    makeEmptyConversation,
    deleteMember,
    patchConversation,
    leaveConversation,
    getCompleteConversation,
    setAdminStatus,
}
