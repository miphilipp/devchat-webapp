import { fetchJson } from '@/rest'
import {SocketConnection, SocketMessage, SocketRestMethod, RESTCommand} from '@/socket'

enum MessageType {
    Text,
    Code,
    Media,
}

interface Lockable {
    lockedBy: number
}

interface Modifiable  {
    hasBeenModified: boolean
}

abstract class Message {
    public author: string
    public sentDate: Date
    public id: number
    public abstract type: MessageType
    public provisionaryId?: number
    public invisible = false
    public failedToSend = false

    constructor(author: string, sentDate?: string, id?: number) {
        this.id = id !== undefined ? id : -1
        this.author = author
        this.sentDate = sentDate !== undefined ? new Date(sentDate) : new Date()
    }

    async send(conn: SocketConnection, conversation: number): Promise<Message> {
        this.provisionaryId = Math.round(Math.random() * 10000000)
        const socketMessage = new SocketMessage(
          new RESTCommand('message', SocketRestMethod.Post),
          conversation,
          this.makeSendable(),
        )
        return makeMessage((await conn.request(socketMessage)).payload)
    }

    public makeSendable(): any {
        const sendable = Object.assign({}, this)
        delete(sendable.invisible)
        delete(sendable.failedToSend)
        return sendable
    }
}

class TextMessage extends Message {
    public text: string
    public type: MessageType

    constructor(
        text: string,
        author: string,
        sentDate?: string,
        id?: number) {

        super(author, sentDate, id)
        this.text = text
        this.type = MessageType.Text
    }
}

interface FileMedia {
    id: number
    name: string
    mimeType: string
    meta?: any
}

class MediaMessage extends Message {
    public text: string
    public type: MessageType
    public files: FileMedia[]
    public canBeLoaded = true

    constructor(
        text: string,
        files: FileMedia[],
        author: string,
        sentDate?: string,
        id?: number) {

        super(author, sentDate, id)
        this.text = text
        this.files = files
        this.type = MessageType.Media
    }

    public makeSendable(): any {
        const sendable = super.makeSendable()
        delete(sendable.canBeLoaded)
        return sendable
    }
}

class CodeMessage extends Message implements Lockable, Modifiable {
    public code: string
    public language: string
    public title: string
    public type: MessageType
    public lockedBy: number
    public hasBeenModified = false

    constructor(
        author: string,
        code: string,
        language: string,
        title: string,
        lockedBy = -1,
        sentDate?: string,
        id?: number) {

        super(author, sentDate, id)
        this.title = title
        this.lockedBy = lockedBy
        this.code  = code
        this.language = language
        this.type = MessageType.Code
    }

    public makeSendable(): any {
        const sendable = super.makeSendable()
        delete(sendable.lockedBy)
        delete(sendable.hasBeenModified)
        return sendable
    }
}

function makeMessage(rawObject: any): Message {
    if (rawObject.type === undefined) {
        throw Error('Format error')
    }

    switch (rawObject.type) {
    case MessageType.Text:
        const tm = new TextMessage(
            rawObject.text,
            rawObject.author,
            rawObject.sentdate as string,
            rawObject.id,
        )
        tm.provisionaryId = rawObject.provisionaryId
        return tm
    case MessageType.Code:
        const cm = new CodeMessage(
            rawObject.author,
            rawObject.code,
            rawObject.language,
            rawObject.title,
            rawObject.lockedBy,
            rawObject.sentdate as string,
            rawObject.id,
        )
        cm.provisionaryId = rawObject.provisionaryId
        return cm
    case MessageType.Media:
        const mm = new MediaMessage(
            rawObject.text,
            rawObject.files,
            rawObject.author,
            rawObject.sentdate as string,
            rawObject.id,
        )
        mm.provisionaryId = rawObject.provisionaryId
        return mm
    default: throw Error('Message type not implemented')
    }
}

async function getMessagesOfType(
    type: MessageType,
    conversationId: number,
    before?: number,
    limit = 100,
    ): Promise<Message[]> {
    let path = `/conversation/${conversationId}/messages?type=${type}&limit=${limit}`
    if (before !== undefined) path += `&before=${before}`

    const res = await fetchJson(path)
    return res.map((m: any) => makeMessage(m))
}

async function getMessages(conversationId: number, limit: number, before?: number): Promise<Message[]> {
    let path = `/conversation/${conversationId}/messages?limit=${limit}`
    if (before !== undefined) path += `&before=${before}`

    const res = await fetchJson(path)
    return res.map((m: any) => makeMessage(m))
}

function reloadMessage(messageId: number, conversationId: number): Promise<Message> {
    return fetchJson(`/conversation/${conversationId}/messages/${messageId}`)
}

export {
    Message,
    FileMedia,
    TextMessage,
    CodeMessage,
    MediaMessage,
    MessageType,
    Modifiable,
    getMessagesOfType,
    makeMessage,
    getMessages,
    reloadMessage,
}

