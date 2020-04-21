import Vue from 'vue'
import Vuex from 'vuex'
import { fetchJson } from '@/rest'
import { Message, MessageType, TextMessage, CodeMessage, MediaMessage } from '@/model/message'
import {
  Conversation,
  getInitialConverstaions,
  makeEmptyConversation,
  getCompleteConversation,
} from '@/model/conversation'
import { User, getUser, UserInConversation } from '@/model/user'
import { Invitation, getAllInvitations } from '@/model/invitations'

import { Module, VuexModule, Mutation, Action } from 'vuex-module-decorators'

Vue.config.devtools = true
Vue.use(Vuex)

@Module
class ChatModule extends VuexModule {
  public conversations: Conversation[] = []
  public selectedConversationIndex = -1
  public invitations: Invitation[] = []
  public self: User = {id: -1, name: ''}
  public loggedIn = false
  public isConnected = false

  @Mutation
  private setConnected(state: boolean) {
    this.isConnected = state
  }

  @Mutation
  private clear() {
    this.conversations = []
    this.selectedConversationIndex = -1
    this.invitations = []
    this.self = {id: -1, name: ''}
    this.loggedIn = false
  }

  @Mutation
  private setLoggedIn(state: boolean) {
    this.loggedIn = state
  }

  @Mutation
  private setSelf(user: User) {
    this.self = user
  }

  @Mutation
  private prependMessages(data: any) {
    const conversation = this.conversations.find((c: Conversation) => c.id === data.conversationId)
    if (conversation === undefined) return
    const filtered = data.messages.filter((m1: Message) => {
      const found = conversation.messages.find((m2: Message) => m1.id === m2.id)
      if (found !== undefined) {
        found.invisible = false
        return false
      }
      return true
    })
    conversation.messages.unshift(...filtered)
  }

  @Mutation
  private appendMessage(data: any) {
    const conversation = this.conversations.find((c: Conversation) => c.id === data.conversationId)
    if (conversation === undefined) return
    conversation.messages.push(data.message)
  }

  @Mutation
  private setLockedState(data: any) {
    const conversation = this.conversations.find((c: Conversation) => c.id === data.conversationId)
    if (conversation === undefined) return
    const message = conversation.messages.find((m: Message) => m.id === data.messageId && m.type === MessageType.Code)
    if (message === undefined) return
    const codeMessage = message as CodeMessage
    codeMessage.lockedBy = data.newOwner
  }

  @Mutation
  private addInvitation(invitation: Invitation) {
    this.invitations.push(invitation)
  }

  @Mutation
  private setInvitations(invitations: Invitation[]) {
    this.invitations = invitations
  }

  @Mutation
  private setConversationMeta(patchData: any) {
    const conversation = this.conversations.find((c: Conversation) => c.id === patchData.conversationId)
    if (conversation === undefined) return

    conversation.title = patchData.patch.title
    conversation.repoURL = patchData.patch.repoUrl
  }

  @Mutation
  private mutateMessage(data: any) {
    const conversation = this.conversations.find((c: Conversation) => c.id === data.conversationId)
    if (conversation === undefined) return
    const message = conversation.messages.find((c: Message) => c.id === data.messageId)
    if (message === undefined) return
    switch (message.type) {
    case MessageType.Text:
      const textMessage = message as TextMessage
      textMessage.text = data.text
      break
    case MessageType.Code:
      const codeMessage = message as CodeMessage
      codeMessage.title = data.title
      codeMessage.language = data.language
      codeMessage.code = data.code
    default:
      break
    }
  }

  @Mutation
  private removeConversationFromState(id: number) {
    this.conversations = this.conversations.filter((c: Conversation) => c.id !== id)
  }

  @Mutation
  private clearUnreadMarker() {
    if (this.selectedConversationIndex !== -1) {
      const selectedConversationId = this.conversations[this.selectedConversationIndex].id
      const c = this.conversations.find((c: Conversation) => c.id === selectedConversationId)
      if (c) {
        c.numberOfUnreadMessages = 0
      }
    }
  }

  @Mutation
  private incrementUnread(conversationId: number) {
    const conversation = this.conversations.find((c: Conversation) => c.id === conversationId)
    if (conversation !== undefined) {
      conversation.numberOfUnreadMessages += 1
    }
  }

  @Mutation
  private setConversations(conversations: Conversation[]) {
    this.conversations = conversations
  }

  @Mutation
  private addConversation(conversation: Conversation) {
    this.conversations.push(conversation)
  }

  @Mutation
  private setMessageReceptionConfirmed(data: any) {
    const conversation = this.conversations[this.selectedConversationIndex]
    const message = conversation.messages.find((m: Message) => {
      return m.provisionaryId === data.provisionaryId
    })
    if (message === undefined) return
    message.id = data.newId
    delete message.provisionaryId
  }

  @Mutation
  private setSelectedConversation(conversationId: number) {
    try {
        window.localStorage.setItem('lastSelectedConversationId', String(conversationId))
    } catch (error) {
        console.error(error)
    }

    const index = this.conversations.findIndex((c: Conversation) => c.id === conversationId)
    this.selectedConversationIndex = index
  }

  @Mutation
  private addUnconfirmedMemberToConversation(data: any) {
    const conversation = this.conversations.find((c: Conversation) => c.id === data.conversationId)
    if (conversation === undefined) {
      return
    }

    const member = conversation.members.find((c: UserInConversation) => c.id === data.userId)
    if (member !== undefined) {
      member.hasLeft = false
      member.hasJoined = false
    } else {
      conversation.members.push({
        id: data.userId,
        name: data.username,
        isAdmin: false,
        hasJoined: false,
        colorIndex: 0,
        hasLeft: false,
        isDeleted: false,
      })
    }
  }

  @Mutation
  private removeMember(data: Invitation) {
    const conversation = this.conversations.find((c: Conversation) => c.id === data.conversationId)
    if (conversation === undefined) {
      return
    }

    const memberToRemoveIndex = conversation.members.findIndex((u: UserInConversation) => u.id === data.recipient)
    conversation.members.splice(memberToRemoveIndex, 1)
  }

  @Mutation
  private setMemberState(data: any) {
    const conversation = this.conversations.find((c: Conversation) => c.id === data.conversationId)
    if (conversation === undefined) return

    const member = conversation.members.find((m: UserInConversation) => m.id === data.userId)
    if (member !== undefined) {
      member.hasLeft = data.hasLeft !== undefined ? data.hasLeft : member.hasLeft
      member.hasJoined = data.hasJoined !== undefined ? data.hasJoined : member.hasJoined
      member.isAdmin = data.isAdmin !== undefined ? data.isAdmin : member.isAdmin
      member.colorIndex = data.colorIndex !== undefined ? data.colorIndex : member.colorIndex
    }
  }

  @Mutation
  private setModifiedFlagOfMessage(data: any) {
    const conversation = this.conversations.find((c: Conversation) => c.id === data.conversationId)
    if (conversation === undefined) return
    const message = conversation.messages.find((c: Message) => c.id === data.messageId) as any
    if (message !== undefined && message.hasOwnProperty('hasBeenModified')) {
      message.hasBeenModified = data.state
    }
  }

  @Mutation
  private removeInvitation(id: number) {
    const invitation = this.invitations.find((i: Invitation) => i.conversationId === id )
    if (invitation === undefined) {
      return
    }

    for (let i = 0; i < this.invitations.length; i++) {
      if ( this.invitations[i].conversationId === invitation.conversationId) {
        this.invitations.splice(i, 1)
      }
    }
  }

  @Action
  private async init() {
    try {
      const self = await getUser()
      this.context.commit('setSelf', self)

      const invitations = await getAllInvitations()
      this.context.commit('setInvitations', invitations)

      const conversations = await getInitialConverstaions()
      this.context.commit('setConversations', conversations)

      if (conversations.length > 0) {

        const selectedConversationIdStr = window.localStorage.getItem('lastSelectedConversationId')
        const selectedConversationId = Number.parseInt(selectedConversationIdStr || '0', 10)
        let selectedConversationIndex = conversations.findIndex((c: Conversation) => c.id === selectedConversationId)
        if (selectedConversationIndex === -1) {
          selectedConversationIndex = 0
        }

        this.context.commit('setSelectedConversation', conversations[selectedConversationIndex].id)

        return true
      }
      return false
    } catch (error) {
      console.error(error)
    }
  }

  @Action
  private async acceptInvitation(id: number) {
    const invitation = this.invitations.find((i: Invitation) =>  i.conversationId === id )
    if (invitation === undefined) {
      return
    }
    const invitationIndex = this.invitations.findIndex((i: Invitation) =>  i.conversationId === id )
    this.invitations.splice(invitationIndex, 1)

    try {
      if (invitation.conversationTitle === undefined) {
        throw Error('Format error')
      }
      const conversation = await getCompleteConversation(invitation.conversationId, invitation.conversationTitle, 0)
      this.context.commit('addConversation', conversation)
      this.context.commit('setSelectedConversation', conversation.id)
    } catch (error) {
      console.log(error)
    }
  }

  @Action
  private deleteConversation(id: number) {
    this.context.commit('removeConversationFromState', id)
    if (this.conversations.length === 0) {
      this.context.commit('setSelectedConversation', 0)
    } else {
      const firstConversationID = this.conversations[0].id
      this.context.commit('setSelectedConversation', firstConversationID)
    }
  }

  get selectedConversationTitle(): string {
    return this.selectedConversationIndex === -1 ? '' : this.conversations[this.selectedConversationIndex].title
  }

  get idOfOldestVisibleMessage(): number | undefined {
    if (this.selectedConversationIndex === -1) return undefined
    let smallest = Number.MAX_SAFE_INTEGER
    for (const m of this.conversations[this.selectedConversationIndex].messages) {
      if (m.id < smallest && !m.invisible) {
        smallest = m.id
      }
    }
    return smallest
  }

  get username(): string {
    return this.self !== null ? this.self.name : ''
  }

  get selectedConversation(): Conversation {
    return this.selectedConversationIndex !== -1
      ? this.conversations[this.selectedConversationIndex] : makeEmptyConversation()
  }

  get amIAdmin(): boolean {
    if (this.selectedConversationIndex === -1) return false
    if (this.conversations[this.selectedConversationIndex].members.length === 0) return false

    const user = this.conversations[this.selectedConversationIndex].members.find((u: UserInConversation) => {
      return u.id === this.self.id
    })
    if (user === undefined) {
      return false
    }

    return user.isAdmin
  }

  get isThereOnylOneAdmin(): boolean {
    if (this.selectedConversationIndex === -1) return false
    if (this.conversations[this.selectedConversationIndex].members.length === 0) return true
    return this.conversations[this.selectedConversationIndex].members.filter((m: UserInConversation) => {
      return m.isAdmin
    }).length === 1
  }

  get messagesOfType(): (type: MessageType) => Message[] {
    const currentIndex = this.selectedConversationIndex
    const conversation = this.conversations[this.selectedConversationIndex]
    return function(type: MessageType): Message[] {
      if (currentIndex === -1) return []
      return conversation.messages.filter((m: Message) => m.type === type)
    }
  }
}

export default new Vuex.Store({
  state: {

  },
  modules: {
    chat: ChatModule,
  },
})
