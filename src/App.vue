<template>
  <div id="app">
    <transition name="modalFadeIn">
    <div v-if="isModalMode" class="modalOverlay" @click.stop="clickModalOverlay">
        <UserSelection 
        :actionTitle="actionTitleText" 
        :exclusionList="userSelectionExclusionList"
        class="userSelection" 
        v-if="isUserSelectionVisible"></UserSelection>

        <Prompt class="prompt" v-if="showsPrompt" :text="promptText"></Prompt>
    </div>
    </transition>

    <transition name="slide-in-right">
          <NotificationBanner 
      class="notifiaction" 
      v-if="showsNotification" 
      :isError="isNotificationError"
      :text="notificationText" 
      :heading="notificationHeading" />
    </transition>
    <router-view/>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import UserSelection from '@/components/userSelection.vue'
import { Invitation } from './model/invitations'
import { Message, makeMessage } from './model/message'
import { Conversation } from './model/conversation'
import { getOtherUsers } from './model/user';
import { RESTCommand, SocketRestMethod } from './socket'
import NotificationBanner from '@/components/NotificationBanner.vue'
import Prompt from '@/components/prompt.vue'
import { supportsNotifications, hasChoiceBeenMade, requestNotificationPermission } from './notifications'

@Component({
  components: {
    UserSelection,
    NotificationBanner,
    Prompt,
  }
})
export default class App extends Vue { 
  isUserSelectionVisible = false
  isModalMode = false

  showsPrompt = false
  promptText = ''

  actionTitleText = ''
  userSelectionExclusionList: number[] = []

  showsNotification = false
  isNotificationError = false
  notificationText = ''
  notificationHeading = ''

  mounted() {
    window.addEventListener('storage', this.syncLogout) 
    this.$eventBus.$on('show-user-selection', this.showUserSelection)
    this.$eventBus.$on('show-error', this.showError)
    this.$eventBus.$on('hide-user-selection', this.hideUserSelection)
    this.$eventBus.$on('show-notification', this.showNotification)
    this.$eventBus.$on('hide-prompt', this.hidePrompt)
    this.$eventBus.$on('show-prompt', this.showPrompt)

    this.$socket.subscribe(new RESTCommand('livesession/code/start', SocketRestMethod.Notify), this.showLiveCodingNotification)
    this.$socket.subscribe(new RESTCommand('invitation', SocketRestMethod.Patch), this.invitationChanged)
    this.$socket.subscribe(new RESTCommand('invitation', SocketRestMethod.Delete), this.removeInvitation)
    this.$socket.subscribe(new RESTCommand('invitation', SocketRestMethod.Post), this.addInvitation)
    this.$socket.subscribe(new RESTCommand('conversation', SocketRestMethod.Patch), this.patchConversation)
    this.$socket.subscribe(new RESTCommand('conversation', SocketRestMethod.Delete), this.conversationHasBeenDeleted)
    this.$socket.subscribe(new RESTCommand('conversation/member', SocketRestMethod.Delete), this.userLeftConversation)
    this.$socket.subscribe(new RESTCommand('conversation/member', SocketRestMethod.Patch), this.setAdminStateOfMember)
    this.$socket.subscribe(new RESTCommand('message', SocketRestMethod.Post), this.appendReceivedMessage)
    this.$socket.subscribe(new RESTCommand('message', SocketRestMethod.Patch), this.messageWasPatched)
    this.$socket.subscribe(new RESTCommand('user', SocketRestMethod.Delete), this.deleteUserToDeleted)
    //this.$socket.subscribe(new RESTCommand('message', SocketRestMethod.Patch), this.appendReceivedMessage)
    
    if (supportsNotifications() && !hasChoiceBeenMade()) {
      requestNotificationPermission()
    }

    if (this.loggedIn) {
      this.setup()
    }
  }

  setAdminStateOfMember(payload: any, source: number) {
    this.$store.commit('setMemberState', {
      conversationId: source, 
      userId: payload.userId,
      isAdmin: payload.state,
    })
  }

  userLeftConversation(payload: any, source: number) {
    this.$store.commit('setMemberState', {
      conversationId: source, 
      userId: payload.userId,
      hasLeft: true,
      hasJoined: false,
    })
  }

  messageWasPatched(payload: any, source: number) {
    this.$store.commit('setModifiedFlagOfMessage', {conversationId: source, messageId: payload.messageId, state: true})
  }

  deleteUserToDeleted(payload: any, source: number) {

  }

  conversationHasBeenDeleted(payload: any, source: number) {
    this.$store.dispatch('deleteConversation', source)
  }

  appendReceivedMessage(payload: any, source: number) {
    const message = makeMessage(payload)
    const conversation: Conversation = this.$store.state.chat.conversations.find((c: Conversation) => c.id === source)
    const i = conversation.messages.findIndex((m: Message) => m.id === message.id)
    if (i !== -1) { 
      this.$store.commit('mutateMessage', {conversationId: conversation.id, message})
      return
    }

    this.$store.commit('appendMessage', {message, conversationId: source})
    if (source !== this.$store.getters.selectedConversation.id) {
      this.$eventBus.$emit('show-notification', {
        heading: 'Neue Nachricht', 
        text: 'In ' + conversation.title,
        showNative: true,
      })
      this.$store.commit('incrementUnread', source)
    }
  }

  showLiveCodingNotification(payload: any, source: number) {
    if (source !== this.$store.getters.selectedConversation.id) {
      const conversation: Conversation = this.$store.state.chat.conversations.find((c: Conversation) => c.id === source)
      this.$eventBus.$emit('show-notification', {
        heading: 'Live-Coding', 
        text: 'In ' + conversation.title,
        showNative: true,
      })
    }
  }

  patchConversation(payload: any, source: number) {
    this.$store.commit('setConversationMeta', {conversationId: source, patch: payload})
  }

  invitationChanged(payload: any, source: number) {
    if (payload.recipient === this.$store.state.chat.self.id) {
      this.$store.dispatch('acceptInvitation', {recipient: payload.recipient, conversationId: payload.conversationId})
    } else {
      this.$store.commit('setMemberState', {
        userId: payload.recipient, 
        conversationId: payload.conversationId,
        hasJoined: true,
        hasLeft: false,
        colorIndex: payload.colorIndex,
      })
    }
  }
  
  addInvitation(payload: any) {
    if (payload.recipient === this.$store.state.chat.self.id) {
      this.$store.commit('addInvitation', payload)
      this.$eventBus.$emit('show-notification', {
        heading: 'Neue Einladung', 
        text: payload.conversationTitle,
        showNative: true,
      })
    } else {
      this.$store.commit('addUnconfirmedMemberToConversation', {
        userId: payload.recipient,
        conversationId: payload.conversationId,
        username: payload.recipientName,
      })
    }
  }

  removeInvitation(payload: Invitation, source: number) {
    if (payload.recipient === this.$store.state.chat.self.id) {
      this.$store.commit('removeInvitation', payload.conversationId)
    } else {
      this.$store.commit('removeMember', {recipient: payload.recipient, conversationId: payload.conversationId})
    }
  }

  clickModalOverlay(e: Event) {
    if (e.target === document.querySelector('.modalOverlay')) {
      this.hideUserSelection()
    }
  }

  showPrompt(text: string) {
    this.showsPrompt = true
    this.isModalMode = true
    this.promptText = text
  }

  hidePrompt() {
    this.showsPrompt = false
    this.isModalMode = false
  }

  hideUserSelection() {
    this.isModalMode = false
    this.isUserSelectionVisible = false
  }

  showNotification(data: any) {
    const text = data.text === undefined ? '' : data.text
    const heading = data.error === true ? 'Fehler' : data.heading
    this.isNotificationError = data.error !== undefined ? data.error : false

    if (supportsNotifications() && Notification.permission === 'granted' && data.showNative) {
      const n = new Notification(heading, {body: text})
      return
    }

    this.showsNotification = true
    this.notificationText = text
    this.notificationHeading = heading

    setTimeout(() => {
        this.showsNotification = false
    }, 5000);
  }

  showUserSelection(data: any) {
    this.isModalMode = true
    this.isUserSelectionVisible = true
    this.actionTitleText = data.buttonLabel
    this.userSelectionExclusionList = data.exclusionList
  }

  get loggedIn(): boolean {
    return this.$store.state.chat.loggedIn
  }

  initStore() {
    this.$store.commit('setConnected', true)
    this.$eventBus.$emit('show-notification', {heading: 'Verbindung hergestellt'})
    this.$store.dispatch('init')
  }

  setup() {
    try {
        this.$socket.connect()
        this.$socket.connectHandler = this.initStore
        this.$socket.connectionLostHandler = this.socketConnectionLost
      } catch (error) {
        console.error(error)
        this.$eventBus.$emit('show-notification', {error: true, text: 'Verbindung konnte nicht hergestellt werden.'})
      }
  }

  @Watch('loggedIn')
  onLoggedInChanged(value: boolean, oldValue: boolean) {
    if (value === true) {
      this.setup()
    }
  }

  socketConnectionLost() {
    this.$store.commit('setConnected', false)
    this.$eventBus.$emit('show-notification', {error: true, text: 'Verbindung zu Server verloren.'})
  }

  showError() {
    this.isModalMode = true
  }

  syncLogout (event: StorageEvent) {
    if (event.key === 'user' && event.oldValue !== null) {
      this.$logout(true)
    }
  }
}
</script>

<style>
  html {
    min-height: 100vh;
    height: 100%;
    --mainBackgroundColor: #fffef3;
  }

  .defaultToken {
    padding: 4px 8px;
    border-radius: 0.75mm;
    background: linear-gradient(80deg, #38b4fd, #23e1ff);
    box-shadow: 0 0 5px rgba(0,0,0,0.2);
    color: white;
  }

  .defaultButton {
    border: 1px solid lightgray;
    background-color: white;
    border-radius: 0.75mm;
    -webkit-appearance: unset;
    padding: 4px 12px;
    cursor: pointer;
    box-shadow: 1px 1px 5px rgba(0,0,0,0.1);
    transition: background-color 0.2s;
  }

  .defaultButton:active {
    background-color: rgb(240, 240, 240);
    color: black;
  }

  .prompt {
    width: 250px;
  }

  .slide-in-right-enter-active, .slide-in-right-leave-active {
		transition: transform 0.8s;
	}
	.slide-in-right-enter, .slide-in-right-leave-to {
		transform: translateX(400px);
	}

  .notifiaction {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 2000;
  }

  input[type="text"]:focus, input[type="password"]:focus {
    outline: 2px solid lightblue;
  }

  .modalFadeIn-enter-active, .modalFadeIn-leave-active {
		transition: opacity .25s;
	}
	
	.modalFadeIn-enter, .modalFadeIn-leave-to {
		opacity: 0;
	}

  .modalOverlay{
    position: absolute;
    top: 0;
    right: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.2);
    z-index: 1000000;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .userSelection {
    width: 250px;
  }

  body {
    min-height: 100%;
    background-color: #555;
    margin: 0;

    font-family: source-sans-pro, sans-serif;
    font-weight: 400;
    font-style: normal;
  }

  h1, h2, h3 {
    font-family: source-sans-pro, sans-serif;
    font-weight: 700;
    font-style: normal;
  }

  body > div {
    height: 100vh;
    width: 100%;
  }

  #app {
    overflow: hidden;
  }

  .clearfix:after { 
    content: ""; 
    visibility: hidden; 
    display: block; 
    height: 0; 
    width: 0;
    clear: both;
  }

  @media (prefers-color-scheme: dark) {
    html {
      --mainBackgroundColor: #27334d;
    }

    .modalOverlay {
      background-color: rgba(0, 0, 0, 0.7);
    }

    .defaultButton {
      background-color: #414141;
      color: white;
      border-color: #5b5b5b;
    }
  }
</style>
