import _Vue from 'vue'
import { SocketConnection } from '../socket'

export default function SocketPlugin(Vue: typeof _Vue, options?: any): void {
    Vue.prototype.$socket = new SocketConnection()
}
