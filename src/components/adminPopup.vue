<template>
    <div class="wrapper">
        <h3 v-if="$store.getters.amIAdmin && !wantsToLeave" class="titleHeading">Titel</h3>
        <input v-if="$store.getters.amIAdmin && !wantsToLeave" v-model="conversationTitle" v-on:keyup.enter="renameConversation" type="text" />
        <h3 class="middleHeading">Teilnehmer</h3>
        <ul>
            <li class="addMemberButton" v-if="$store.getters.amIAdmin && !wantsToLeave" @click="showUserSelection">
                <img src="@/assets/addUser.svg" alt="plus"/>
                Teilnehmer hinzufügen
            </li>
            <li v-for="m in conversationMembers" :key="m.id" @click="chooseMember(m.id)">
                <MemberCell :member="m" :canDisplayDetails="!wantsToLeave && $store.getters.amIAdmin" :avatarLink="avatarLink"></MemberCell>
            </li>
        </ul>
        <button class="leaveButton defaultButton" v-if="!wantsToLeave" @click.stop="clickLeaveConversation">
            Unterhaltung verlassen
        </button>
        <button class="defaultButton abortButton" v-if="wantsToLeave" @click="abortLeaving">Abbrechen</button>
        <p class="leavingHint" v-if="wantsToLeave">
            Sie sind der einzige Administrator. Wählen Sie bitte einen Nachfolger um die Unterhaltung zu verlassen.
        </p>
        <button class="deleteButton defaultButton" v-if="$store.getters.amIAdmin && !wantsToLeave" @click="clickDeleteConversation">
            Unterhaltung löschen
        </button>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { deleteConversation, deleteMember, patchConversation, leaveConversation } from '../model/conversation'
import { Invitation, revokeInvitation, postInvitation } from '../model/invitations'
import { User, UserInConversation } from '../model/user'
import { RESTCommand, SocketRestMethod } from '../socket'
import Errors from '../errors'
import MemberCell from './member.vue';

@Component({
    components: {
        MemberCell,
    },
})
class AdminPopup extends Vue {
    conversationTitle = ''
    repoURL = ''
    showsUserSelection = false
    avatarLink = ''

    wantsToLeave = false
    chosenMember = 0
    waitsOnConfirmation = false
    wantsToDelete = false

    async created() {
        this.conversationTitle = this.$store.getters.selectedConversation.title
        this.repoURL = this.$store.getters.selectedConversation.repoURL
        this.$eventBus.$on('hide-user-selection', this.hideUserSelection)
        this.$eventBus.$on('hide-prompt', this.confirm)
        this.avatarLink = `/media/user/##user##/avatar`
    }

    async hideUserSelection(users: User[]) {
        if (this.showsUserSelection !== true) {
            return
        }
        this.showsUserSelection = false
        if (users === undefined) return

        try {
            for (const user of users) {
                const currentID = this.$store.getters.selectedConversation.id
                const cTitle = this.$store.getters.selectedConversation.title
                await postInvitation({
                    recipient: user.id,
                    conversationTitle: cTitle,
                    conversationId: currentID,
                })
                this.$store.commit('addUnconfirmedMemberToConversation', {
                    conversationId: currentID,
                    userId: user.id,
                    username: user.name,
                })
            }
        } catch (error) {
            const text = Errors.sendInvitation(error)
            this.$eventBus.$emit('show-notification', {error: true, text})
        }
    }

    async renameConversation() {
        const currentID = this.$store.getters.selectedConversation.id
        try {
            const patchData = {
                title: this.conversationTitle,
                repoUrl: this.repoURL,
            }
            const res = await patchConversation(currentID, patchData)
        } catch (error) {
            const text = Errors.patchConversation(error)
            this.$eventBus.$emit('show-notification', {error: true, text})
        }
    }

    chooseMember(id: number) {
        if (this.wantsToLeave) {
            this.chosenMember = id
            this.waitsOnConfirmation = true
            this.$eventBus.$emit('show-prompt', 'Möchten Sie die Unterhaltung wirklich verlassen?')
        }
    }

    abortLeaving() {
        this.wantsToLeave = false
        this.chosenMember = 0
    }

    clickLeaveConversation() {
        const currentID = this.$store.getters.selectedConversation.id
        const ownId = this.$store.state.chat.self.id
        if (this.$store.getters.amIAdmin && this.$store.getters.isThereOnylOneAdmin) {
             this.wantsToLeave = true
        } else {
            this.waitsOnConfirmation = true
            this.$eventBus.$emit('show-prompt', 'Möchten Sie die Unterhaltung wirklich verlassen?')
        }
    }

    async confirm(choice: boolean) {
        if (this.waitsOnConfirmation === false) return

        if (choice === true) {
            const currentID = this.$store.getters.selectedConversation.id
            const ownId = this.$store.state.chat.self.id
            try {
                if (this.wantsToDelete) {
                    await deleteConversation(currentID)
                } else {
                    await leaveConversation(currentID, ownId, this.chosenMember)
                    this.$store.dispatch('deleteConversation', currentID)
                }
            } catch (error) {
                this.$eventBus.$emit('show-notification', {error: true, text: error.info})
            }
        } else {
            this.waitsOnConfirmation = false
            this.wantsToDelete = false
            this.wantsToLeave = false
            this.chosenMember = 0
        }
    }

    clickDeleteConversation() {
        this.$eventBus.$emit('show-prompt', 'Möchten Sie die Unterhaltung wirklich entgültig löschen?')
        this.waitsOnConfirmation = true
        this.wantsToDelete = true
    }

    showUserSelection(event: Event) {
        this.showsUserSelection = true
        this.$eventBus.$emit('show-user-selection', {
            buttonLabel: 'Einladen',
            exclusionList: this.conversationMembers.map((m: User) => m.id),
        })
    }

    get conversationMembers(): UserInConversation[] {
        if (this.wantsToLeave) {
            const ownId = this.$store.state.chat.self.id
            return this.$store.getters.selectedConversation.members.filter((m: UserInConversation) => {
                return m.hasJoined === true && m.hasLeft === false && m.id !== ownId && m.isDeleted === false
            })
        } else {
            return this.$store.getters.selectedConversation.members.filter((m: UserInConversation) => {
                return m.hasLeft === false
            })
        }
    }
}

export default AdminPopup
</script>

<style lang="css" scoped>
    h1, h2, h3, h4 {
        font-size: initial;
        margin: initial;
    }

    .leavingHint {
        font-size: 15px;
    }

    .abortButton {
         margin-top: 20px;
    }

    .wrapper > input[type="text"] {
        padding: 3px;
        width: 150px;
        margin-bottom: 20px;
    }

    .addMemberButton {
        cursor: pointer;
    }

    .addMemberButton img {
        height: 24px;
        vertical-align: middle;
        margin-right: 5px;
    }

    .titleHeading {
        margin-bottom: 5px;
    }

    .leaveButton {
        margin-top: 20px;
    }

    .deleteButton {
        margin-top: 20px;
        color: red;
    }

    .wrapper {
        background-color: white;
        border-radius: 10px;
        padding: 15px;
        color: black;
        line-height: initial;
		font-weight: initial;
    }

    .wrapper li {
        border-bottom: 1px solid lightgray;
        font-size: 15px;
        line-height: 1.9;
        padding: 5px 0;
    }

    .wrapper ul {
        list-style-type: none;
        padding: 0;
        margin: 5px 0;
    }

    @media (prefers-color-scheme: dark) {
      .wrapper { 
        color: white;
        background-color: #242d41;
      }

      .wrapper li {
          border-color: #616161;
      }

      input {
        background-color: rgb(230, 230, 230);
      }
    }
</style>