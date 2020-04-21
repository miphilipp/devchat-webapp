<template>
    <div class="Nachricht">
        <div :class="[isOwn ? 'right OuterBox' : 'left OuterBox']">
            <span class="meta timestamp">{{ timestamp }}</span>
            <span v-if="showAuthor" class="meta">{{ msg.author }}</span>
            <div :style='{"--indicatorColor": color}' class="clearfix MessageContainer">
                <img v-if="msg.canBeLoaded" :src="ressourceLink" alt="image">
            </div>
        </div>
    </div> 
</template>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { MediaMessage } from '../model/message'
import { getMediaToken } from '../auth'

@Component
class RessourceMessageBox extends Vue {
    @Prop() public msg!: MediaMessage
    @Prop() public color!: string
    @Prop() public showAuthor!: boolean

    created() {
        
    }

    get ressourceLink(): string {
        return this.msg.file.preview !== undefined ? this.msg.file.preview : this.msg.file.name
    }

    get timestamp() {
        return this.msg.sentDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
    }
    get isOwn() {
        return this.$store.getters.username === this.msg.author
    }
}

export default RessourceMessageBox
</script>


<style scoped>
    p {
        margin: 0;
    }

    .meta {
        color: gray;
        font-weight: bold;
        font-size: 13px;
        margin-top: 5px;
        line-height: 25px;
    }

    .left .meta {
        float: left;
        margin-left: 15px;
    }

    .right .meta {
        float: right;
        margin-right: 15px;
    }

    .left::after {
        left: 0;
    }

    .right::after {
        right: 0;
    }

    .MessageContainer {
        font-weight: normal;
        font-family: source-sans-pro, sans-serif;
        font-size: 14px;
        border-width: 2px;
        border-style: solid;
        border-color: var(--indicatorColor);
        border-radius: 8px;
        margin: 10px;
        padding: 10px;
        min-width: 150px;
        clear: both;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
    }

    .MessageContainer p {
        text-align: left;
        white-space: pre-wrap;
        display: block;
        clear: both;
    }

    .OuterBox {
        /*min-height: 160px;*/
        text-align: left;
        position: relative;
    }

    .left {
        float: left;
    }

    .right {
        float: right;
    }

    .right .MessageContainer {
        margin-left: 50px;
        border-color: blue;
    }

    .left .MessageContainer {
        margin-right: 50px;
    }
   
    .OuterBox::after {
        content: '';
        position: absolute;
        top: 0;
        height: 100%;
        width: 5px;
        display: block;
        background-color: var(--indicatorColor);
    }
</style>  