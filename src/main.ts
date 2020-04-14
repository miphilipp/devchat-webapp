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
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import {
  faSave,
} from '@fortawesome/free-regular-svg-icons'

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


import 'prismjs'
import 'prismjs/components/prism-python.js'
import 'prismjs/components/prism-swift.js'
import 'prismjs/components/prism-c.js'
import 'prismjs/components/prism-cpp.js'
import 'prismjs/components/prism-coffeescript.js'
import 'prismjs/components/prism-csharp.js'
import 'prismjs/components/prism-markup-templating.js'
import 'prismjs/components/prism-php.js'
import 'prismjs/components/prism-ruby.js'
import 'prismjs/components/prism-rust.js'
import 'prismjs/components/prism-java.js'
import 'prismjs/components/prism-typescript.js'
import 'prismjs/components/prism-bash.js'
import 'prismjs/components/prism-css.js'
import 'prismjs/components/prism-fsharp.js'
import 'prismjs/components/prism-go.js'
import 'prismjs/components/prism-groovy.js'
import 'prismjs/components/prism-json.js'
import 'prismjs/components/prism-kotlin.js'
import 'prismjs/components/prism-markdown.js'
import 'prismjs/components/prism-matlab.js'
import 'prismjs/components/prism-objectivec.js'
import 'prismjs/components/prism-perl.js'
import 'prismjs/components/prism-yaml.js'
import 'prismjs/components/prism-wasm.js'
import 'prismjs/components/prism-sql.js'
import 'prismjs/components/prism-graphql.js'


import 'vue-prism-editor/dist/VuePrismEditor.css'
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
