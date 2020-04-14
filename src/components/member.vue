<template>
    <div class="member-wrapper">
        <img 
            :style='{"--indicatorColor": colorIndexToColor(member.colorIndex)}' 
            class="avatar" 
            :src="avatarLink.replace('##user##', member.id)" 
            alt="avatar">
        {{ member.name }}
        <div class="invitedLabel" v-if="!member.hasJoined && !member.isDeleted">
            <span class="text" :class="{'switchable': $store.getters.amIAdmin}">Eingeladen</span>
            <span 
                class="revokeButton" 
                v-if="$store.getters.amIAdmin" 
                @click="revokeInvitation"
            >x</span>
        </div>
        <font-awesome-icon 
            v-if="!member.isDeleted && member.hasJoined && member.id !== selfID && canDisplayDetails" 
            icon="ellipsis-v"
            class="detailsButton"
            role="button" 
            @click="toggleDetails"></font-awesome-icon>
        <div class="deletedLabel" v-if="member.isDeleted">Gelöscht</div>

        <div v-if="areActionsVisible && canDisplayDetails" class="member-actions">
            <button @click="removeUser">Entfernen</button>
            <button @click="setAdminStatus">{{ adminButtonText }}</button>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { UserInConversation, User, colorIndexToColor } from '../user'
import { deleteMember, setAdminStatus } from '../conversation'
import { Invitation, revokeInvitation } from '../invitations'
import Errors from '../errors'

@Component
class MemberCell extends Vue {
    @Prop() public member!: UserInConversation
    @Prop({default: ''}) public avatarLink!: string
    @Prop({default: true}) public canDisplayDetails!: boolean

    areActionsVisible = false

    toggleDetails() {
        this.areActionsVisible = !this.areActionsVisible
    }

    hideActionsVisiblity() {
        this.areActionsVisible = false
    }

    colorIndexToColor(index: number): string {
        return colorIndexToColor(index)
    }

    async removeUser() {
        const currentID = this.$store.getters.selectedConversation.id
        try {
            await deleteMember(currentID, this.member.id)
            this.hideActionsVisiblity()
        } catch (error) {
            const text = Errors.deleteMember(error)
            this.$eventBus.$emit('show-notification', {error: true, text})
        }
    }

    get adminButtonText(): string {
        return this.member.isAdmin ? "Rechte entziehen" : "Zum Admin ernennen"
    }

    async setAdminStatus() {
        const currentID = this.$store.getters.selectedConversation.id
        try {                
            await setAdminStatus(currentID, this.member.id, !this.member.isAdmin)
            this.hideActionsVisiblity()
        } catch (error) {
            const text = Errors.setAdminStatus(error)
            this.$eventBus.$emit('show-notification', {error: true, text})
        }
    }

    async revokeInvitation() {
         try {
            await revokeInvitation({recipient: this.member.id, conversationId: this.$store.getters.selectedConversation.id})
        } catch (error) {
            const text = Errors.revokeInvitation(error)
            this.$eventBus.$emit('show-notification', {error: true, text})
        }
    }

    get selfID(): number {
        return this.$store.state.chat.self.id
    }
}

export default MemberCell
</script>

<style scoped>

    .member-wrapper {
        --indicatorColor: black;
        position: relative;
    }

    .member-wrapper:hover svg.detailsButton {
        display: inline-block;
    }

    .member-actions {
        position: absolute;
        background-color: #fff;
        padding: 5px;
        box-shadow: 0 0 5px #0000002e;
        border-radius: 5px;
        display: flex;
        flex-direction: column;
        right: -150px;
        width: 135px;
        top: -17px;
    }

    .member-actions button {
        display: block;
        border: none;
        padding: 7px 10px;
        background-color: #fff;
        cursor: pointer;
        transition: background-color 0.2s;
        border-radius: 5px;
    }

    .member-actions button:hover {
        background-color: rgb(221, 221, 221);
    }

    .invitedLabel:hover .switchable.text {
        opacity: 0;
    }

    .invitedLabel:hover .revokeButton {
        opacity: 1;
    }

    .avatar {
        border: 1px solid var(--indicatorColor);
        height: 24px;
        width: 24px;
        border-radius: 13px;
        vertical-align: middle;
        margin-right: 5px;
    }

    svg.detailsButton {
        cursor: pointer;
        float: right;
        display: none;
        height: 28px;
    }

    .invitedLabel {
        font-size: 11px;
        border: 1px solid blue;
        padding: 3px 3px 2px 3px;
        float: right;
        margin-top: 5px;
        border-radius: 4px;
        color: blue;
        line-height: initial;
        position: relative;
    }

    .deletedLabel {
        font-size: 11px;
        border: 1px solid gray;
        padding: 3px 3px 2px 3px;
        float: right;
        margin-top: 5px;
        border-radius: 4px;
        color: gray;
        line-height: initial;
    }

    .revokeButton {
        position: absolute;
        width: 100%;
        left: 0;
        text-align: center;
        opacity: 0;
        transition: opacity 0.2s;
        font-size: 15px;
        top: -1px;
        cursor: pointer;
    }

    .invitedLabel .text {
        transition: opacity 0.2s;
        opacity: 1;
    }
</style>
