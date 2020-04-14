<template>
    <div class="cell-wrapper" @click="hideDetailsVisiblity">
        {{ invitation.conversationTitle }}
        <div class="actionArea" :class="{'expanded': areActionsVisible}" @click.stop="clickExpansionArea">
            <transition name="actionFade">
                <font-awesome-icon key="closeIcon" icon="times" v-if="areActionsVisible"></font-awesome-icon>
                <font-awesome-icon key="openIcon" icon="ellipsis-v" v-else></font-awesome-icon>
            </transition>
        </div>
        <div class="acceptButton" @click="clickAccept">
            <font-awesome-icon icon="check"></font-awesome-icon>
        </div>
    </div>
</template>

<script lang="ts">
import {Invitation} from '../invitations'
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
class InviatationCell extends Vue {
    @Prop() public invitation!: Invitation

    areActionsVisible = false

    hideDetailsVisiblity() {
        this.areActionsVisible = false
    }

    clickExpansionArea() {
        if (this.areActionsVisible === false) {
            this.areActionsVisible = true
        } else {
            this.$emit("denie", this.invitation.conversationId)
        }
    }

    clickAccept() {
        this.$emit("accept", this.invitation.conversationId)
    }
}

export default InviatationCell
</script>

<style scoped>
    .cell-wrapper {
        position: relative;
    }

    .acceptButton {
        background-color: #DFDFDF;
        height: 45px;
        width: 45px;
        float: right;
        cursor: pointer;
        position: relative;
        right: 15px;
        z-index: 30;
        text-align: center;
    }

    .acceptButton svg {
        height: 20px;
        width: 20px;
        vertical-align: middle;
    }

    .actionFade-enter-active, .actionFade-leave-active {
        transition: opacity .2s;
    }
    .actionFade-enter, .actionFade-leave-to {
        opacity: 0;
    }

    .actionArea {
        width: 15px;
        height: 45px;
        transition: width 0.25s ease-in;
        float: right;
        position: absolute;
        right: 0;
        top: 0;
        z-index: 50;
        background-color: #CFCFCF;
        text-align: center;
        cursor: pointer;
    }

    .actionArea.expanded {
        width: 60px;
    }

    @media (prefers-color-scheme: dark) {
		svg {
            color: white;
        }

        .cell-wrapper {
            color: gray;
        }

        .actionArea {
            background-color: #4a4a4a;
        }

        .acceptButton {
            background-color: #5a5a5a;
        }
	}
</style>
