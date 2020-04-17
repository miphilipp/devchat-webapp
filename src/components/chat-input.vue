<template>
    <div class="chatInputOuterWrapper">
        <div id="toolbar">
            <!-- <font-awesome-icon class="styleButton" icon="bold" @click="applyStyle('bold')"></font-awesome-icon>
            <font-awesome-icon class="styleButton" icon="italic" @click="applyStyle('italic')"></font-awesome-icon>
            <font-awesome-icon class="styleButton" icon="underline" @click="applyStyle('underline')"></font-awesome-icon> -->
            <font-awesome-icon class="styleButton" icon="paperclip" @click="clickAttachFiles"></font-awesome-icon>
            <span v-if="file !== null">{{file.name}}</span>
            <input 
                id="file-input" 
                @change="addFile" 
                type="file" 
                accept="image/jpg,image/png" 
                name="name" 
                style="display: none;" />
        </div>
        <div>
            <textarea 
                :disabled="!isEnabled" 
                name="massageText" 
                id="textInput" 
                placeholder="Hier tippen zum Schreiben"
                @keydown.exact.prevent.enter="sendMessage" 
                @keydown.prevent.shift.enter="appendNewLine"
                cols="30" 
                rows="5"></textarea>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue } from 'vue-property-decorator'
    import { TextMessage, MediaMessage, MessageType, FileMedia } from '../model/message';
    import { postData } from '../rest'
    import Errors from "../errors";
    let enterIsLocked = false

    @Component
    class ChatInput extends Vue {
        @Prop() private isEnabled!: Boolean

        file: FileMedia | null = null

        sendMessage(event: any) {
            if (!event.shiftKey) {
                const inputEl = document.getElementById('textInput') as HTMLTextAreaElement
                const files = (document.getElementById('file-input') as HTMLInputElement)!.files
                const text = inputEl!.value
                const author = this.$store.getters.username
                if (text !== '' && this.file === null) {
                    inputEl.value = ''
                    const newMessage = new TextMessage(text, author)
                    this.$emit('send-message', newMessage)
                } else if (this.file !== null) {
                    const newMessage = new MediaMessage(text, this.file, author)
                    newMessage.canBeLoaded = false
                    this.$emit('send-message', newMessage)
                    this.uploadFile()
                }
            }
        }

        appendNewLine() {
            const input = document.getElementById('textInput') as HTMLTextAreaElement
            const currentInput = input.value
            const pos = input.selectionStart
            input.value = currentInput.substring(0, pos) + '\n' + currentInput.substring(pos);
            input.selectionEnd = pos + 1
        }

        addFile() {
            const file = (document.getElementById('file-input') as HTMLInputElement).files!.item(0)
            if (file === null) return
            
            if(file.size > 2*1024*1024) {
                this.$eventBus.$emit('show-notification', {error: true, text: 'Die Datei ist größer als 2MB.'})
                return
            }

            this.file = { type: file.type, name: file.name }
        }

        async uploadFile() {
            const file = (document.getElementById('file-input') as HTMLInputElement).files!.item(0)
            if (file === null) return

            const fd = new FormData();
            fd.append('file', file);

            try {
                await postData('/media', fd)
            } catch (error) {
                const text = Errors.uploadMediaFile(error)
                this.$eventBus.$emit('show-notification', {error: true, text})
            }
        }

        clickAttachFiles() {
            if (this.isEnabled) {
                document.getElementById('file-input')!.click()
            }
        }
    }

    export default ChatInput
</script>

<style scoped>
    .chatInputOuterWrapper {
        background-color: rgba(255, 255, 255, 0.75);
    }
    
    #textInput {
        resize: none;
        margin: 0 auto 10px auto;
        display: block;
        box-sizing: border-box;
        width: 97%;
        border: none;
        background-color: transparent;
        padding: 5px;
        font-size: 12px;
    }

    #textInput:focus {
        outline: 2px solid lightblue;
    }

    .styleButton {
        cursor: pointer;
    }

    #toolbar {
        display: flex;
        width: 100%;
        height: 30px;
        padding: 0 10px;
        justify-content: flex-start;
        box-sizing: border-box;
    }

    #toolbar svg {
        margin-right: 25px;
        height: 30px;
    }

    @media (prefers-color-scheme: dark) {
        .chatInputOuterWrapper {
            background-color: rgba(189, 189, 189, 0.75);
        }

        textarea::-webkit-placeholder {
            color: black;
        }

        textarea::placeholder {
            color: black;
        }
    }
</style>