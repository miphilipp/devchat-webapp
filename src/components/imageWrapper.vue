<template>
    <div class="wrapper" :style="wrapperStyle">
        <button 
            class="hideButton" 
            @click="hideContent" 
            :class="{permanentlyVisible: contentIsHidden, gap: hasText}">
            {{ hideButtonText }}
        </button>
        <a :href="makeRessourceLink(false)" target="_blank">
            <img 
                ref="imgEl"
                class="contentImage" 
                @load="imageLoaded" 
                v-show="!contentIsHidden" 
                :src="makeRessourceLink(true)" 
                alt="Bild">
        </a>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { FileMedia } from '../model/message'

@Component
class ImageWrapper extends Vue {
    @Prop() public file!: FileMedia

    contentIsHidden = false
    wrapperStyle: any = {}

    mounted() {
        const el = this.$refs.imgEl as HTMLImageElement
        if (el.complete) {
            this.imageLoaded()
        } else {
            let h = this.file.meta !== null ? this.file.meta.height : 200
            let w = this.file.meta !== null ? this.file.meta.width : 200
            const aspectRatio = w / h

            const maxHeight = 250
            const maxWidth = 400
            if (h > maxHeight) {
                h = maxHeight
                w = h * aspectRatio
            } else if (w > maxWidth) {
                w = maxWidth
                h = w * aspectRatio
            }
            
            this.wrapperStyle = {
                width: w + 'px', 
                height: h + 'px'
            }
        }
    }

    imageLoaded() {
        this.wrapperStyle = {
            width: 'auto', 
            height: 'auto',
            backgroundColor: 'transparent'
        }
    }

    makeRessourceLink(thumbnail: boolean): string {
        const currentId = this.$store.getters.selectedConversation.id
        if (thumbnail === true) {
            return `media/conversation/${currentId}/${this.file.id}-thumbnail-${this.file.name}`
        } else {
            return `media/conversation/${currentId}/${this.file.id}-${this.file.name}`
        } 
    }

    hideContent() {
        this.contentIsHidden = !this.contentIsHidden
    }

    get hideButtonText(): string {
        return this.contentIsHidden ? 'Zeigen' : 'Verbergen'
    }
}

export default ImageWrapper
</script>

<style scoped>
    .wrapper {
        background-color: lightgray;
    }

    .hideButton {
        position: absolute;
        right: 0;
        -webkit-appearance: none;
        border-radius: 10px;
        background-color: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        border: none;
        padding: 4px 10px;
        cursor: pointer;
        border: 1px solid #949494;
        opacity: 0;
        transition: opacity 0.3s;
        outline: none;
    }

    .contentImage {
        max-height: 250px;
        max-width: 400px;
        border-radius: 8px;
    }

    .wrapper:hover .hideButton {
        opacity: 1;
    }

    .wrapper a {
        display: inline-block;
    }

    .permanentlyVisible {
        position: static;
        opacity: 1;
        float: right;
    }
</style>
