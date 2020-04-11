import { MessageType } from '@/message'

export default interface EditorType {
    title: string
    component: string
    messageType: MessageType
    listTitle: string
    meta?: any
}
