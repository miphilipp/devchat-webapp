import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Prefs from './views/Prefs.vue'
import Login from './views/Login.vue'
import Recovery from './views/Recovery.vue'
import Confirm from './views/confirmAccount.vue'
import store from './store'

Vue.use(Router)

const publicPages = ['/login', '/forgot', '/confirm']
const restrictedPages = ['/preferences']

const router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
      meta: {
        title: 'DevChat',
      },
    },
    {
      path: '/preferences',
      name: 'Einstellungen',
      component: Prefs,
      meta: {
        title: 'DevChat - Einstellungen',
      },
    },
    {
      path: '/login',
      name: 'Anmelden',
      component: Login,
      meta: {
        title: 'DevChat - Anmelden',
      },
    },
    {
      path: '/forgot',
      name: 'Passwortwiederherstellung',
      component: Recovery,
      meta: {
        title: 'DevChat - Passwort',
      },
    },
    {
      path: '/confirm',
      name: 'Kontobestätigung',
      component: Confirm,
      meta: {
        title: 'DevChat - Konto bestätigen',
      },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authRequired = !publicPages.includes(to.path)
  const loggedIn = localStorage.getItem('user')

  document.title = to.meta.title || 'DevChat'

  if (authRequired && !loggedIn) {
    return next('/login')
  }

  if (to.path === '/login' && loggedIn) {
    return next('/')
  }

  next()
})

router.afterEach((to, from) => {
  const loggedIn = localStorage.getItem('user')
  if (loggedIn && !restrictedPages.includes(from.path)) {
    store.commit('setLoggedIn', true)
  }
})

export default router
