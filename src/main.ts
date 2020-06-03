import Vue from 'vue'
Vue.config.productionTip = false

import App from './App.vue'
import router from './router'
import store from './store'
import SocketPlugin from './plugins/socket-plugin'
import EventBus from './plugins/eventBus-plugin'
import Logout from './plugins/logout-plugin'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faTimes,
  faBars,
  faEllipsisV,
  faCheck,
  faUser,
  faPaperclip,
  faBold,
  faUnderline,
  faItalic,
  faExpand,
  faPaperPlane,
  faPlus,
  faCode,
  faSync,
  faExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import {
  faSave,
} from '@fortawesome/free-regular-svg-icons'

library.add(faExclamation)
library.add(faSync)
library.add(faTimes)
library.add(faBars)
library.add(faEllipsisV)
library.add(faCheck)
library.add(faUser)
library.add(faExpand)
library.add(faPaperclip)
library.add(faBold)
library.add(faUnderline)
library.add(faItalic)
library.add(faPaperPlane)
library.add(faPlus)
library.add(faCode)
library.add(faSave)
Vue.component('font-awesome-icon', FontAwesomeIcon)

import 'vue-select/dist/vue-select.css'

Vue.use(SocketPlugin)
Vue.use(EventBus)
Vue.use(Logout)

Vue.directive('click-outside', {
  bind(el, binding, vnode) {
    (el as any).outside_event = (event: Event) => {
      const a = (el === event.target || el.contains(event.target as Element))
      if (!a && vnode.context !== undefined) {
        (vnode.context as {[a: string]: any})[binding.expression as string](event)
      }
    }
    document.body.addEventListener('click', (el as any).outside_event)
  },
  unbind(el) {
    document.body.removeEventListener('click', (el as any).outside_event)
  },
})

const vm = new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app')
