import _Vue from 'vue'

export default function EventBusPlugin(Vue: typeof _Vue, options?: any): void {
    Vue.prototype.$eventBus = new _Vue()
}
