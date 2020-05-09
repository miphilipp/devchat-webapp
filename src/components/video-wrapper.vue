<template>
    <video 
        class="player"
        preload="metadata"
        controls
        :width="width">
        <source :src="link" :type="file.mimeType">
    </video>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { FileMedia } from '../model/message'

@Component
class VideoWrapper extends Vue {
    @Prop() public file!: FileMedia
    @Prop() public width!: string

    forcedStopped = false
    stoppedTime = 0.0

    // async onError() {
    //     const el = this.$refs.player as HTMLMediaElement
    //     if (el.error === null) return
    //     if (el.error.code === 2) {
    //         this.forcedStopped = true
    //         this.stoppedTime = el.currentTime
    //         this.token = (await getMediaToken()).token
    //     }
    // }

    get link(): string {
        const currentId = this.$store.getters.selectedConversation.id
        return `media/conversation/${currentId}/${this.file.id}-${this.file.name}` 
    }

    // @Watch('token')
    // onTokenChange(newVal: string, oldVal: string) {
    //     if (this.forcedStopped) {
    //         const el = this.$refs.player as HTMLMediaElement
    //         el.load()
    //         el.currentTime = this.stoppedTime
    //         el.play()
    //         this.forcedStopped = false
    //     }
    // }
}

export default VideoWrapper
</script>

<style scoped>
    .player {
        border-radius: 8px;
    }
</style>
