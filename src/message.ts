import { fetchJson } from '@/auth'

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

    constructor(author: string, sentDate?: string, id?: number) {
        if (id !== undefined) {
            this.id = id
        } else {
            this.id = -1
        }

        this.author = author
        if (sentDate !== undefined) {
            this.sentDate = new Date(sentDate)
        } else {
            this.sentDate = new Date()
        }
    }

    public makeSendable(): any {
        const sendable = Object.assign({}, this)
        delete(sendable.invisible)
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
    name: string
    preview?: string
    type: string
}

class MediaMessage extends Message {
    public text: string
    public type: MessageType
    public file: FileMedia
    public canBeLoaded = true

    constructor(
        text: string,
        files: FileMedia,
        author: string,
        sentDate?: string,
        id?: number) {

        super(author, sentDate, id)
        this.text = text
        this.file = files
        this.type = MessageType.Media
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
        const sendable = Object.assign({}, this)
        delete(sendable.invisible)
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
        return new TextMessage(
            rawObject.text,
            rawObject.author,
            rawObject.sentdate as string,
            rawObject.id,
        )
    case MessageType.Code:
        return new CodeMessage(
            rawObject.author,
            rawObject.code,
            rawObject.language,
            rawObject.title,
            rawObject.lockedBy,
            rawObject.sentdate as string,
            rawObject.id,
        )
    case MessageType.Media:
        return new MediaMessage(
            rawObject.text,
            rawObject.files,
            rawObject.author,
            rawObject.sentdate as string,
            rawObject.id,
        )
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

async function reloadMessage(messageId: number, conversationId: number): Promise<Message> {
    return await fetchJson(`/conversation/${conversationId}/messages/${messageId}`)
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

