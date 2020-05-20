import { getLoggedInUser } from '@/storage'
import { faTextHeight } from '@fortawesome/free-solid-svg-icons'

enum SocketRestMethod {
    Get = 1,
    Delete = 2,
    Post = 3,
    Patch = 4,
    Notify = 5,
    Error = 6,
    Heartbeat = 7,
}

type SocketEventHandler = (n: any, m: number) => void

class RESTCommand {
    public ressource: string
    public method: SocketRestMethod

    constructor(ressource: string, method: SocketRestMethod) {
        this.ressource = ressource
        this.method = method
    }

    public toKey(): string {
        return `${this.ressource},${this.method}`
    }
}

class SocketMessage {
    public command: RESTCommand
    public source: number
    public id: number
    public payload: any

    constructor(command: RESTCommand, source: number, data: any, id?: number) {
        this.command = command
        this.payload = data
        this.source = source
        if (id === undefined) {
            this.id = Math.floor(Math.random() * 100000)
        } else {
            this.id = id
        }
    }
}

const reconnectTimeoutStartVal = 3000

class SocketConnection {
    public connectHandler?: () => void
    public connectionLostHandler?: () => void

    private reconnectTimeout = reconnectTimeoutStartVal
    private socket?: WebSocket
    private reconnectTimer = -1
    private heartbeatTimer = -1
    private handlers: Map<string, SocketEventHandler[]> = new Map()
    private openRequests: Map<number, any> = new Map()

    public connect() {
        if (this.socket !== undefined) {
            return
        }

        const token = getLoggedInUser()
        if (token === null) {
            throw Error('logged out')
        }

        try {
            const schema = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
            const uri = `${schema}//${window.location.host}/api/v1/websocket`
            this.socket = new WebSocket(uri)
        } catch (error) {
            return
        }

        if (this.socket === undefined) {
            return
        }

        this.socket.onopen = (event: Event) => {
            this.reconnectTimeout = reconnectTimeoutStartVal
            if (this.connectHandler !== undefined) {
                this.connectHandler()
            }

            this.heartbeatTimer = setInterval(() => {
                this.sendHeartbeat()
            }, 2000)
        }

        this.socket.onclose = (event: CloseEvent) => {
            clearInterval(this.heartbeatTimer)
            console.log('Connection closed', event.code, event.reason)
            this.socket = undefined

            if (this.connectionLostHandler !== undefined && this.reconnectTimeout === reconnectTimeoutStartVal) {
                this.connectionLostHandler()
            }

            if (event.code === 1006) {
                this.reconnectTimer = setTimeout(() => {
                    this.connect()
                }, this.reconnectTimeout)
                const timeout = this.reconnectTimeout
                this.reconnectTimeout = timeout < 60000 ? Math.floor((timeout * 1.3)) : timeout
            }
        }

        this.socket.onerror = (event: Event) => {
            console.log('Websocket error')
        }

        this.socket.onmessage = (event: MessageEvent) => {
            const message = JSON.parse(event.data)
            const command = new RESTCommand(message.command.ressource, message.command.method)
            const request = this.openRequests.get(message.id)
            if (request !== undefined) {
                if (request.discard === false) {
                    if (command.method !== SocketRestMethod.Error) {
                        request.resolver({payload: message.payload, source: message.source})
                    } else {
                        request.rejector(message.payload)
                    }
                    clearTimeout(request.timer)
                }
                this.openRequests.delete(message.id)
                return
            }

            const handlers = this.handlers.get(command.toKey())
            if (handlers === undefined) {
                return
            }

            for (const handler of handlers) {
                handler(message.payload, message.source)
            }
        }
    }

    public clearHandlers() {
        this.handlers.clear()
    }

    public disconnect() {
        if (this.socket !== undefined) {
            this.socket.onclose = null
            this.socket.close(1000)
            this.socket = undefined
        }
    }

    public subscribe(event: RESTCommand, handler: SocketEventHandler, id: number = -1) {
        const handlers = this.handlers.get(event.toKey())
        if (handlers === undefined) {
            this.handlers.set(event.toKey(), [])
        }

        const newHandlers = this.handlers.get(event.toKey())
        if (newHandlers !== undefined) {
            newHandlers.push(handler)
            this.handlers.set(event.toKey(), newHandlers)
        }
    }

    public unsubscribe(event: RESTCommand, handler: SocketEventHandler) {
        const handlers = this.handlers.get(event.toKey())
        if (handlers === undefined) return
        this.handlers.set(event.toKey(), handlers.filter((h: SocketEventHandler) => h !== handler))
    }

    public request(message: SocketMessage): Promise<any> {
        const promise = new Promise<any>((resolve, reject) => {
            if (this.socket === undefined) {
                reject({info: {code: 2003, message: 'Not connected'}})
                return
            }

            try {
                this.socket.send(JSON.stringify(message))
                const timer = setTimeout(() => {
                    this.openRequests.delete(message.id)
                    reject({info: {code: 2002, message: 'timeout'}})
                }, 5000)
                this.openRequests.set(message.id, {
                    rejector: reject,
                    resolver: resolve,
                    timer,
                    discard: false,
                })
            } catch (error) {
                reject(error)
            }
        })
        return promise
    }

    public emit(message: SocketMessage) {
        if (this.socket === undefined) return
        try {
            this.openRequests.set(message.id, {discard: true})
            this.socket.send(JSON.stringify(message))
        } catch (error) {
            this.openRequests.delete(message.id)
            console.error(error)
        }
    }

    private sendHeartbeat() {
        if (this.socket === undefined || this.socket.readyState !== WebSocket.OPEN) {
            return
        }

        const heartbeat = new SocketMessage(
            new RESTCommand('', SocketRestMethod.Heartbeat)
            , -1, null,
        )

        try {
            this.socket.send(JSON.stringify(heartbeat))
        } catch (error) {
            console.error(error)
        }
    }

    get state(): number {
        if (this.socket === undefined) {
            return WebSocket.CLOSED
        }
        return this.socket.readyState
    }
}

export { RESTCommand, SocketRestMethod, SocketConnection, SocketMessage }
