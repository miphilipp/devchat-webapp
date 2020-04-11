<template>
  <div id="outerWrapper" :class="{'sidebarVisible': showSidebar}">
    <sidebar
      id="sidebar"
      @shellClose="hideSidebar"
      @select="selectconversation"
    />

    <div class="mainWrapper" :class="{'tilted': showSidebar}" @click="hideSidebar">
      <navBar 
        v-on:clickMenu="toggleSidebar" 
        id="navbar" 
        @editorSelected="changeSelectedEditor" 
        :editors="editors" 
        :selectedEditorIndex="selectedEditorIndex"  />
      <div id="workspace">
        <div class="workspaceElement chat">

        <div class="messageArea" @scroll="chatScrolled">
          <span
            id="emptyMessage"
            v-if="$store.state.chat.selectedConversationIndex === -1"
          >Keine Konversation ausgewählt</span>
          <span
            id="emptyMessage"
            v-else-if="currentConversation.messages.length === 0"
          >Keine Nachrichten vorhanden</span>
          <ul>
            <li v-for="m in messages" :key="m.id">
              <component
                v-bind="{msg: m, color: getColorForAuthor(m.author), showAuthor: canIShowAuthors()}"
                :is="getMessageComponent(m.type)"
                @click.native="selectMessage(m.id, m.type)"
              />
            </li>
          </ul>
          
        </div>
        <chat-input
          :is-enabled="$store.state.chat.selectedConversationIndex !== -1"
          @send-message="appendMessage"
          id="chatInput"
          />
        </div>
        <editor 
          @send-message="appendMessage" 
          @deselect="deselect"
          @select-message="selectMessage"
          id="editor" 
          :selectedMessage="selectedMessage" 
          :selectedEditor="currentEditor"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import NavBar from '@/components/navBar.vue'
import ChatInput from '@/components/chat-input.vue'
import Sidebar from '@/components/sidebar.vue'
import Editor from '@/components/editorArea.vue'
import CodeMessageBox from '@/components/code-message.vue'
import TextMessageBox from '@/components/MessageBox.vue'
import EditorType from '../editor'
import { Message, MessageType, makeMessage, CodeMessage } from '../message'
import { RESTCommand, SocketMessage, SocketRestMethod } from '../socket'
import { User, UserInConversation } from '../user'
import { getMessages } from '../message'
import { Invitation } from '../invitations'
import { Conversation } from '../conversation'
import Errors from '../errors'

@Component({
  components: {
    NavBar,
    CodeMessageBox,
    TextMessageBox,
    ChatInput,
    Sidebar,
    Editor,
  }
})
export default class Home extends Vue {
  showSidebar = false
  scrollOverride = false
  isLoading = false
  selectedMessage = -1
  selectedEditorIndex = 0
  allMessagesLoaded = false
  editors: EditorType[] = [
    {
      title: 'Code', 
      component: 'codeEditor', 
      messageType: MessageType.Code, 
      listTitle: 'Code - Nachrichten',
      meta: { live: this.hasCodingSession },
    },
  ]

  async created() {    
    this.$socket.subscribe(new RESTCommand('message', SocketRestMethod.Post), this.appendReceivedMessage)
  }

  toggleSidebar() {
    this.showSidebar = !this.showSidebar
  }

  hideSidebar() {
    this.showSidebar = false
  }

  selectconversation(event: any) {
    this.$store.commit('setSelectedConversation', event.conversation)
    if (event.shellHide === true) {
      this.hideSidebar()
    }
  }

  getColorForAuthor(author: string): string {
    const user = this.currentConversation.members.find(
      (m: UserInConversation) => m.name === author
    )
    if (user === undefined) return '#000'
    return user.color
  }

  changeSelectedEditor(data: number) {
    this.selectedEditorIndex = data
  }

  get hasCodingSession(): boolean {
      return this.$store.getters.messagesOfType(MessageType.Code).find((m: CodeMessage) => {
          return m.lockedBy > 0
      }) !== undefined
  }

  @Watch('hasCodingSession')
  onHasCodingSession(newValue: boolean, oldValue: boolean) {
    const editor = this.editors.find((e: EditorType) => e.messageType === MessageType.Code )
    if (editor !== undefined) {
      editor.meta.live = newValue
    }
  }

  getMessageComponent(type: number) {
    switch (type) {
      case 0: return 'TextMessageBox'
      case 1: return 'CodeMessageBox'
      case 2: return 'MediaMessageBox'
      default: throw Error('Invalid message type')
    }
  }

  async appendMessage(message: Message) {
    message.provisionaryId = Math.round(Math.random() * 10000000)
    const conversationId = this.currentConversation.id
    console.log(message)
    this.$store.commit('appendMessage', {message, conversationId})
    const socketMessage = new SocketMessage(
      new RESTCommand('message', SocketRestMethod.Post),
      conversationId,
      message.makeSendable())
    try {
      const res = await this.$socket.request(socketMessage)
      this.$store.commit('setMessageReceptionConfirmed', {newId: res.payload.id, provisionaryId: res.payload.provisionaryId})
      this.scrollToBottom()
    } catch (error) {
      const text = Errors.sendMessage(error)
      this.$eventBus.$emit('show-notification', {error: true, text})
    }
  }

  async scrollToBottom() {
    this.setMessagesToRead()
    await this.$nextTick()
    const container = document.querySelector('.messageArea')!
    try {
      container.scrollTo(0, container.scrollHeight)
    } catch (error) {
      container.scrollTop = container.scrollHeight
    }
  }

  appendReceivedMessage(payload: any, source: number) {
    if (source === this.currentConversation.id) {
      // If the user didn't scroll through the messages manually, scroll all the way to the bottom.
      if (this.scrollOverride) {
        this.$store.commit('incrementUnread', source)
      } else {
        this.scrollToBottom()
      }
    }
  }

  canIShowAuthors(): boolean {
    return this.currentConversation.members.filter((u: UserInConversation) => u.hasJoined).length > 2
  }

  get messages(): Message[] {
    return this.currentConversation.messages.filter((m: Message) => !m.invisible)
  }

  get currentConversation(): Conversation {
    return this.$store.getters.selectedConversation
  }

  @Watch('currentConversation')
  async onConversationChange(newValue: Conversation, oldValue: Conversation) {
    try {
      await this.$nextTick()
      const container = document.querySelector('.messageArea')!
      const ul = document.querySelector('.messageArea > ul')!
      if (ul.scrollHeight < container.clientHeight) {
        this.setMessagesToRead()
      } else {
        this.scrollToBottom()
      }
    } catch (error) {
      console.error(error)
    }
    this.allMessagesLoaded = false
  }

  get currentEditor() {
    return this.editors[this.selectedEditorIndex]
  }

  selectMessage(id: number, type: MessageType) {
    if (type !== MessageType.Text) {
      this.selectedMessage = id
    }
  }

  deselect() {
    this.selectedMessage = -1
  }

  async loadMoreMessage() {
    try {
      this.isLoading = true
      const container = document.querySelector('.messageArea')!
      const ul = document.querySelector('.messageArea > ul')!
      const previousHeight = ul.clientHeight
      const conversationId = this.currentConversation.id
      const smallestId = this.$store.getters.idOfOldestVisibleMessage
      const messages = await getMessages(conversationId, 10, smallestId)
      if (messages.length !== 0) {
        this.$store.commit('prependMessages', {messages, conversationId})
        await this.$nextTick()
        try {
          container.scrollTo(0, ul.clientHeight - previousHeight)
        } catch (error) {
          container.scrollTop = ul.clientHeight - previousHeight
        }
        
      } else {
        this.allMessagesLoaded = true
      }
    } catch (error) {
      console.error(error)
    } finally {
      this.isLoading = false
    }
  }

  setMessagesToRead() {
    const currentID = this.currentConversation.id
    const socketMessage = new SocketMessage(
      new RESTCommand('message/read', SocketRestMethod.Notify),
      currentID,
      {conversationID: currentID})

    this.$socket.emit(socketMessage)
    this.$store.commit('clearUnreadMarker')
  }

  chatScrolled() {
    const container = document.querySelector('.messageArea')!
    const ul = document.querySelector('.messageArea > ul')!
    if (container.scrollTop >= Math.abs(container.clientHeight - ul.scrollHeight)) {
      this.scrollOverride = false
      this.setMessagesToRead()
    } else {
      if (
        container.scrollTop <= 0 &&
        this.isLoading === false &&
        this.allMessagesLoaded === false) {
        this.loadMoreMessage()
      }
      this.scrollOverride = true
    }
  }
}
</script>

<style scoped>
    #sidebar {
        width: var(--sidebarWidth);
        height: 100vh;
        box-sizing: border-box;
        float: left;
    }

    #outerWrapper {
        overflow: hidden;
        width: calc(100% + var(--sidebarWidth));
        transform: translateX(calc(var(--sidebarWidth) * -1));
        transition: transform 0.3s;
        --sidebarWidth: 270px;
    }

    #emptyMessage {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
    }

    .mainWrapper::after {
        position: absolute;
        pointer-events: none;
        top: 0;
        right: 0;
        width: calc(100% - var(--sidebarWidth));
        height: 100%;
        background: rgba(0,0,0,0.2);
        content: '';
        z-index: 1000;
        opacity: 0;
        -webkit-transition: opacity 0.5s, width 0.1s 0.5s, height 0.1s 0.5s;
        transition: opacity 0.5s, width 0.1s 0.5s, height 0.1s 0.5s;
    }

    #outerWrapper.sidebarVisible {
        transform: translateX(0);
    }

    .tilted::after {
        opacity: 1;
    }

    .mainWrapper {
        transition: transform 0.3s;
        width: calc(100% - var(--sidebarWidth));
        background: var(--mainBackgroundColor);
        float: left;
    }

    .chat ul {
        list-style-type: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
    }

    .messageArea {
      flex-grow: 1;
      overflow-y: scroll;
    }

    #navbar {
        width: 100%;
        height: 70px;
    }

    .workspaceElement {
        box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.15);
        border-radius: 15px;
    }

    #workspace {
        --paddingValue: 30px;
        padding: var(--paddingValue);
        display: grid;
        grid-gap: 20px;
        grid-template-columns: 0.7fr 1.3fr;
        grid-template-rows: minmax(0, 1fr);
        grid-template-areas: "chat editor";
        width: calc(100% - 2 * var(--paddingValue));
        height: calc(100vh - 70px - 2 * var(--paddingValue));
    }

    #chatTitle { grid-area: chatTitle; }
    .chat { 
        border-top: 2px solid white;
        grid-area: chat;
        display: flex;
        flex-direction: column;
        background: linear-gradient(227deg, rgb(196, 254, 255) 0%, rgb(253, 221, 153) 100%);
        position: relative;
    }

    #editor { 
      grid-area: editor;
      min-width: 0;
    }

    #chatInput { 
      border-top-right-radius: 10px;
      border-top-left-radius: 10px;
      border-bottom-right-radius: 15px;
      border-bottom-left-radius: 15px;
      border-top: 2px solid white;
    }
</style>
