<template>
    <div class="sidebar">
        <font-awesome-icon class="closeIcon" icon="times" @click="closeSidebar"></font-awesome-icon>
        <h3>Unterhaltungen</h3>
        <ul id="conversationList">
            <li v-for="c in conversations" 
                :class="{active: $store.getters.selectedConversation && ($store.getters.selectedConversation.id === c.id)}" 
                :key="c.id" 
                @click="select(c.id, true)">
                {{ c.title }}
                <div class="unreadIndicator" v-if="c.numberOfUnreadMessages > 0"></div>
            </li>
            <li class="newArea">
                <span @click="toggleCreationForm">+ Neue Unterhaltung</span>
                <div v-if="isCreationFormVisible">
                    <input 
                        autocomplete="off" 
                        id="newConversationTitle" 
                        @input="removeValidationErrors" 
                        type="text" 
                        placeholder="Titel">
                    <input autocomplete="off" id="newConversationRepo" type="text" placeholder="Repo-URL">
                    <div class="includedContacts">
                        <div v-for="u in includedContacts" :key="u.id" >
                            <span class="usernameLabel">{{u.name}}</span>
                            <span @click="removeOneInitialContact(u)">x</span>
                        </div>
                    </div>
                    <button class="defaultButton" @click="showUserSelection">Teilnehmer auswählen</button>
                    <button class="defaultButton" @click.prevent="createConversation">Erstellen</button>
                </div>
            </li>
        </ul>

        <h3>Einladungen</h3>
        <ul>
            <li class="emptyCell" v-if="invitations.length === 0">Keine Einladungen</li>
            <li v-for="i in invitations" :key="i.conversationId">
                <invitation-cell :invitation="i" @denie="denieInvitation" @accept="acceptInvitation"></invitation-cell>
            </li>
        </ul>
    </div>
</template>

<script lang="ts">
    import InvitationCell from './invitation-cell.vue'
    import { postConversation } from '../conversation'
    import { User, getOtherUsers } from '../user'
    import { RESTCommand, SocketRestMethod } from '../socket'
    import { denieInvitation, acceptInvitation } from '../invitations'

    import { Component, Prop, Vue } from 'vue-property-decorator'

    @Component({
        components: {
            InvitationCell,
        }
    })
    class Sidebar extends Vue { 
        isCreationFormVisible = false
        includedContacts: User[] = []
        showsUserSelection = false
        showValidationError = false

        created() {
            this.$eventBus.$on('hide-user-selection', this.hideUserSelection)
        }

        toggleCreationForm() {
            this.isCreationFormVisible = !this.isCreationFormVisible
        }

        showUserSelection() {
            this.showsUserSelection = true
            this.$eventBus.$emit('show-user-selection', {
                buttonLabel: 'Hinzufügen',
                exclusionList: this.includedContacts.map((u: User) => u.id) 
            })
        }

        hideUserSelection(contacts: User[]) {
            if (this.showsUserSelection !== true) {
                return
            }
            this.showsUserSelection = false

            if (contacts !== undefined) {
                this.includedContacts = contacts
            }
        }

        removeOneInitialContact(user: User) {
            this.includedContacts = this.includedContacts.filter((u: User) => u.id !== user.id)
        }

        async acceptInvitation(id: number) {
            try {
                await acceptInvitation(id)
                this.$store.dispatch('acceptInvitation', id)
            } catch (error) {
                this.$eventBus.$emit('show-notification', {error: true, text: error})
                console.log(error)
            }
        }

        async denieInvitation(id: number) {
            try {
                await denieInvitation(id)
                this.$store.commit('removeInvitation', id)
            } catch (error) {
                this.$eventBus.$emit('show-notification', {error: true, text: error})
                console.log(error)
            }
        }

        async createConversation() {
            const titleEl = document.getElementById('newConversationTitle') as HTMLInputElement
            const repoUrl = (<HTMLInputElement>document.getElementById('newConversationRepo')).value
            const title = titleEl.value

            if (title === '') {
                this.showValidationError = true
                titleEl.classList.add('error')
                return
            }

            try {
                const newConversation = await postConversation(
                    title,
                    repoUrl,
                    this.includedContacts,
                    this.$store.state.chat.self,
                )
                this.$store.commit('addConversation', newConversation)
                this.toggleCreationForm()
                this.select(newConversation.id, false)
            } catch (error) {
                this.$eventBus.$emit('show-notification', {error: true, text: error})
                console.log(error)
            }
        }

        removeValidationErrors() {
            const el = document.getElementById('newConversationTitle') as HTMLInputElement
            if (el !== null) {
                el.classList.remove('error')
            }
        }
        
        select(conversationId: number, shellHide: boolean) {
            this.$emit('select', {conversation: conversationId, shellHide: shellHide})
        }

        closeSidebar() {
            this.removeValidationErrors()
            this.$emit('shellClose')
        }

        get invitations() {
            return this.$store.state.chat.invitations
        }

        get conversations() {
            return this.$store.state.chat.conversations
        }
    }

    export default Sidebar
</script>

<style>
    .newArea input{
        margin-bottom: 8px;
        height: 22px;
        border: none;
        border-radius: 0.75mm;
        font-size: 13px;
        padding-left: 5px;
    }
</style>


<style scoped>
    .sidebar {
        background-color: #F5F5F5;
    }

    .includedContacts {
        display: flex;
        flex-direction: row;
        line-height: initial;
        flex-wrap: wrap;
    }

    .includedContacts > div {
        padding: 4px 8px;
        border-radius: 0.75mm;
        background: linear-gradient(80deg, #38b4fd, #23e1ff);
        box-shadow: 0 0 5px rgba(0,0,0,0.2);
        color: white;
        margin-right: 5px;
        margin-bottom: 5px;
    }

    .usernameLabel {
        margin-right: 7px;
    }

    .includedContacts > div span {
        font-size: 14px;
    }

    .closeIcon {
        margin: 20px 0 0 15px;
        height: 25px;
        width: 25px;
        cursor: pointer;
    }

    h3 {
        padding-left: 15px;
        margin-bottom: 0;
    }

    input.error {
        border: 1px solid red !important;
    }

    .newArea button {
        display: block;
        margin: 5px 0 10px 0;
    }

    .newArea > div {
        padding: 10px 25px;
    }

    .newArea {
        transition: height 0.3s;
    }

    .newArea input {
        display: block;
        width: 100%;
        border-radius: 0.75mm;
        border: 1px solid white;
        transition: border-color 0.25s;
    }

    .unreadIndicator {
        --size: 12px;
        height: var(--size);
        width: var(--size);
        position: absolute;
        top: 50%;
        right: 20px;
        border-radius: calc(var(--size) / 2);
        background-color: red;
        margin-top: calc(var(--size) / 2 * -1);
    }

    ul li {
        background-color: rgb(236, 236, 236);
        color: #323232;
        line-height: 45px;
        margin-top: 10px;
        position: relative;
    }

    ul li.active {
        background-color: rgb(221, 221, 221);
        color: rgb(170,170,170);
    }

    ul li:not(.emptyCell):not(.newArea)::before {
        content: '';
        display: block;
        height: 45px;
        width: 5px;
        margin-right: 25px;
        background-color: #FF0000;
        float: left;
        cursor: default;
    }

    .newArea > span {
        padding: 0 25px;
        color: #797979;
        display: block;
        height: 45px;
        transition: background-color 0.25s;
        cursor: pointer;
    }

    #conversationList li {
        transition: background-color 0.25s;
        cursor: pointer;
    }

    .newArea > span:hover, #conversationList li:not(.active):hover  {
        background-color: rgb(226, 226, 226);
    }

    .emptyCell {
        padding: 0 25px;
        color: #797979;
    }

    ul li.selected {
        background-color: #D8D8D8;
        color: black;
    }

    ul {
        list-style-type: none;
        color: white;
        padding: 0;
        margin-bottom: 40px;
        margin-top: 10px;
    }
</style>