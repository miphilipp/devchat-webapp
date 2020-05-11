<template>
    <div class="chatInputOuterWrapper">
        <div id="toolbar">
            <font-awesome-icon class="styleButton" icon="paperclip" @click="clickAttachFiles"></font-awesome-icon>
            <div v-if="file !== null" class="defaultToken" >
                <span class="fileNameLabel">{{ file.name }}</span>
                <span @click="removeFile">x</span>
            </div>
            <input 
                :disabled="file !== null"
                ref="fileInput"
                @change="addFile" 
                type="file" 
                name="name" 
                style="display: none;" />
        </div>
        <div>
            <textarea 
                :disabled="!isEnabled" 
                name="massageText" 
                id="textInput" 
                v-model="text"
                placeholder="Hier tippen zum Schreiben"
                @input="typing"
                @keydown.exact.prevent.enter="sendMessage" 
                @keydown.prevent.shift.enter="appendNewLine"
                cols="30" 
                rows="5"></textarea>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue } from 'vue-property-decorator'
    import {
        TextMessage,
        MediaMessage,
        MessageType,
        FileMedia,
        Message,
        makeMessage,
    } from '../model/message'
    import { patchData } from '../rest'
    import Errors from '../errors'
    import { SocketMessage, RESTCommand, SocketRestMethod } from '../socket'
    import { Throttle, Bind } from 'lodash-decorators'

    @Component
    class ChatInput extends Vue {
        @Prop() private isEnabled!: Boolean

        text = ''
        file: FileMedia | null = null

        async sendMessage(event: any) {
            if (!event.shiftKey) {
                const currentId = this.$store.getters.selectedConversation.id
                try {
                    const author = this.$store.getters.username
                    if (this.text !== '' && this.file === null) {
                        const newMessage = new TextMessage(this.text, author)
                        const res = await newMessage.send(this.$socket, currentId)
                        this.$emit('send-message', makeMessage(res.payload), currentId)
                    } else if (this.file !== null) {
                        const newMessage = new MediaMessage(this.text, [this.file], author)
                        const res = await newMessage.send(this.$socket, currentId)
                        const returnedMessage = makeMessage(res.payload) as MediaMessage
                        returnedMessage.canBeLoaded = false
                        this.$emit('send-message', returnedMessage, currentId)
                        await this.uploadFile(res.payload.id)
                    }
                } catch (error) {
                    if (error.info.messageId !== undefined) {
                        this.$store.commit('mutateMessage', {
                            conversationId: currentId,
                            message: {
                                id: error.info.messageId,
                                failedToSend: true,
                            }
                        })
                    } else {
                        const text = Errors.sendMessage(error)
                        this.$eventBus.$emit('show-notification', {error: true, text})
                    }
                } finally {
                     this.reset()
                }
            }
        }

        reset() {
            const fileInput = this.$refs.fileInput as HTMLInputElement
            fileInput.value = ''
            this.text = ''
            this.removeFile()
        }

        removeFile() {
            this.file = null
        }

        @Throttle(1500, {leading: true})
        @Bind()
        typing(e: Event) {
            const socketMessage = new SocketMessage(
                new RESTCommand('typing', SocketRestMethod.Notify),
                this.$store.getters.selectedConversation.id, undefined
            )
            this.$socket.emit(socketMessage)
        }

        appendNewLine() {
            const input = document.getElementById('textInput') as HTMLTextAreaElement
            const currentInput = input.value
            const pos = input.selectionStart
            input.value = currentInput.substring(0, pos) + '\n' + currentInput.substring(pos);
            input.selectionEnd = pos + 1
        }

        addFile() {
            const file = (this.$refs.fileInput as HTMLInputElement).files!.item(0)
            if (file === null) return
            
            if (file.size > 50*1024*1024) {
                this.$eventBus.$emit('show-notification', {
                    error: true, 
                    text: 'Die Datei ist größer als 50MB.',
                })
                return
            }

            this.file = { mimeType: file.type, name: file.name, id: -1 }
        }

        async uploadFile(messageId: number): Promise<any> {
            const file = (this.$refs.fileInput as HTMLInputElement).files!.item(0)
            if (file === null) return

            const fd = new FormData()
            fd.append('files', file)

            const currentId = this.$store.getters.selectedConversation.id
            try {
                return await patchData(`/conversation/${currentId}/message/${messageId}/upload`, fd)
            } catch (error) {
                error.info.messageId = messageId
                throw error
            }
        }

        clickAttachFiles() {
            if (this.isEnabled) {
                (this.$refs.fileInput as HTMLElement).click()
            }
        }
    }

    export default ChatInput
</script>

<style scoped>
    .chatInputOuterWrapper {
        background-color: rgba(255, 255, 255, 0.75);
    }

    .defaultToken {
        font-size: 13px;
        margin: auto 0;
    }

    .defaultToken .fileNameLabel {
        margin-right: 7px;
        cursor: pointer;
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
        margin-right: 15px;
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