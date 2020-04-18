import {
    SocketConnection,
    SocketMessage,
    RESTCommand,
    SocketRestMethod,
} from '../socket'
import { MessageType } from './message'

function startCodingSession(socket: SocketConnection, source: number, messageId: number, type: MessageType): Promise<any> {
    return socket.request(new SocketMessage(
        new RESTCommand('livesession/code/start', SocketRestMethod.Notify), source, {
            id: messageId,
            type,
        },
    ))
}

function stopCodingSession(socket: SocketConnection, source: number, messageId: number, type: MessageType): Promise<any> {
    return socket.request(new SocketMessage(
        new RESTCommand('livesession/code/stop', SocketRestMethod.Notify), source, {
            id: messageId,
            type,
        },
    ))
}


function sendLiveCodingUpdate(
    socket: SocketConnection,
    source: number,
    messageId: number,
    title: string,
    patch: string,
    language: string): Promise<any> {
    const request = new SocketMessage(
        new RESTCommand('livecoding', SocketRestMethod.Patch), source, {
            messageId,
            patch,
            language,
            title,
        },
    )
    return socket.request(request)
}

export {
    startCodingSession,
    sendLiveCodingUpdate,
    stopCodingSession,
}
