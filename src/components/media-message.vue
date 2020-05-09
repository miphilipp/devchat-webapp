<template>
    <div class="Nachricht">
        <div :class="[isOwn ? 'right OuterBox' : 'left OuterBox']">
            <span class="meta timestamp">{{ timestamp }}</span>
            <span v-if="showAuthor" class="meta">{{ msg.author }}</span>
            <div :style='{"--indicatorColor": color}' class="clearfix MessageContainer">
                <div class="errorWrapper" v-if="msg.failedToSend">
                    <font-awesome-icon icon="exclamation"></font-awesome-icon>
                    <span>Die Datei konnte nicht hochgeladen werden.</span>
                </div>
                <Circle2 class="spinner" v-else-if="msg.canBeLoaded === false"></Circle2>
                <div v-else v-for="f in msg.files" :key="f.id">
                    <ImageWrapper :file="f" v-if="isImage(f.mimeType)" :class="{gap: hasText}" />
                    <VideoWrapper :file="f" :class="{gap: hasText}"
                        v-else-if="isVideo(f.mimeType)" width="300px" />
                    <audio preload="metadata" controls v-else-if="isAudio(f.mimeType)">
                        <source :src="makeRessourceLink(f)" :type="f.mimeType">
                    </audio>
                    <FileWrapper v-else :file="f"></FileWrapper>
                </div>
                <p>{{ msg.text }}</p>
            </div>
        </div>
    </div> 
</template>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { MediaMessage, FileMedia } from '../model/message'
import VideoWrapper from './video-wrapper.vue'
import ImageWrapper from './imageWrapper.vue'
import FileWrapper from './file-wrapper.vue'
import Circle2 from 'vue-loading-spinner/src/components/Circle2.vue'

@Component({
  components: {
    Circle2,
    VideoWrapper,
    ImageWrapper,
    FileWrapper,
  },
})
class MediaMessageBox extends Vue {
    @Prop() public msg!: MediaMessage
    @Prop() public color!: string
    @Prop() public showAuthor!: boolean

    get hasText(): boolean {
        return this.msg.text !== ''
    }

    isImage(mimeType: string): boolean {
        return mimeType.startsWith('image/')
    }

    isAudio(mimeType: string): boolean {
        return mimeType.startsWith('audio/')
    }

    isVideo(mimeType: string): boolean {
        return mimeType.startsWith('video/')
    }

    makeRessourceLink(file: FileMedia): string {
        const currentId = this.$store.getters.selectedConversation.id
        return `media/conversation/${currentId}/${file.id}-${file.name}`
    }

    get timestamp() {
        return this.msg.sentDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
    }
    get isOwn() {
        return this.$store.getters.username === this.msg.author
    }
}

export default MediaMessageBox
</script>


<style scoped>
    p {
        margin: 0;
    }

    .errorWrapper {
        color: red;
        display: table;
    }

    .errorWrapper span {
        display: table-cell;
        vertical-align: middle;
    }

    .errorWrapper svg {
        font-size: 20px;
        width: 20px;
        border: 3px solid red;
        border-radius: 20px;
        padding: 5px;
        margin-right: 10px;
    }

    .meta {
        color: gray;
        font-weight: bold;
        font-size: 13px;
        margin-top: 5px;
        line-height: 25px;
    }

    .MessageContainer > div {
        position: relative;
    }

    .left .meta {
        float: left;
        margin-left: 15px;
    }

    .right .meta {
        float: right;
        margin-right: 15px;
    }

    .gap {
        margin-bottom: 10px;
    }

    .contentEl {
        outline: none;
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
        background-color: rgba(255, 255, 255, 0.6);
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
</style>  