import _Vue from 'vue'
import { logout } from '../auth'


export default function EventBusPlugin(Vue: typeof _Vue, options?: any): void {
    Vue.prototype.$logout = async function(oneSided = false): Promise<void> {
        await logout(oneSided)
        this.$socket.disconnect()
        this.$store.commit('clear')
        this.$router.push('/login')
    }
}
