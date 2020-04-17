<template>
    <div class="wrapper">
        <div class="liveCodingBanner" v-show="canIShowTheBanner">
                Jemand möchte Ihnen etwas zeigen.
                <button class="defaultButton" @click="joinLiveCoding">Zuschauen</button>
        </div>
        <div class="editorConfig">
            <!-- <TitleInput  class="codeTitleInput" :editable="isReadonly" placeholder="Titel eingeben" v-model="title" ></TitleInput> -->
            <input 
                :disabled="isReadonly" 
                type="text" 
                class="codeTitleInput" 
                @input="titleChanged" 
                v-model="title" 
                placeholder="Titel eingeben" />
            <button class="defaultButton" v-if="!createNew" @click="toggleLiveCoding">{{liveButtonText}}</button>
            <select 
                v-if="languages.length > 0" 
                @change="languageSelected"
                :disabled="isReadonly" 
                name="Sprache" 
                class="languageSelection" 
                v-model="selectKey">
                <option disabled value="Blank">Auswählen...</option>
                <option :value="l.name" v-for="(l, i) in languages" :key="i"> {{ l.name }}</option>
            </select>
        </div>  
        <prism-editor 
            @change="codeChanged" 
            v-model="text" 
            class="mainEditor"
            :readonly="isReadonly"
            :language="languageKey" 
            lineNumbers />

        <div class="lower-controls">
            <transition-group 
                name="switchOutButtons" 
                tag="div" 
                @after-leave="afterEnterTransition" 
                @after-enter="afterEnterTransition">
            <button 
                v-if="createNew && title.length > 0" 
                key="sendButton"
                class="removeStylesButton sendCode" 
                @click="submitMessage">
                <font-awesome-icon icon="paper-plane"></font-awesome-icon>
            </button>
            <button 
                v-if="!createNew" 
                key="newButton"
                class="removeStylesButton sendCode" 
                @click="clickNewCodeMessage">
                <font-awesome-icon icon="plus"></font-awesome-icon>
            </button>
            <button 
                v-if="!createNew && hasChanges" 
                class="removeStylesButton" 
                key="saveButton"
                @click="saveMessage">
                <font-awesome-icon :icon="['far', 'save']"></font-awesome-icon>
            </button>
            <button 
                v-if="!createNew && hasBeenExternallyModified" 
                class="removeStylesButton" 
                key="refreshButton"
                @click="refreshMessage">
                <font-awesome-icon icon="sync"></font-awesome-icon>
            </button>
            </transition-group>
        </div>
    </div>
</template>

<script lang="ts">
    import ProgrammingLanguage from '../model/programmingLanguage'
    import { Message, CodeMessage, MessageType, reloadMessage } from '../model/message'
    import { RESTCommand, SocketRestMethod, SocketMessage } from '../socket'
    import { startCodingSession, sendLiveCodingUpdate, stopCodingSession } from '../model/coding'
    import PrismEditor from 'vue-prism-editor'
    import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
    //import * as workerPath from "file-loader?name=[name].js!../diffWorker"
    import { DiffMatchPatch } from 'diff-match-patch-typescript'
    import { Conversation } from '../model/conversation'
    import TitleInput from './titleInput.vue'
    import Errors from '../errors'

    @Component({
        name: 'codeEditor',
        components: {
            PrismEditor,
            TitleInput,
        },
    })
    class CodeEditor extends Vue {
        @Prop() public message!: CodeMessage

        selectKey = ''
        languages: ProgrammingLanguage[] = []
        newMessage: CodeMessage | null = null
        createNew = false
        hasChanges = false
        text = ''
        title = ''
        languageKey = 'js'

        async created () {
            this.$socket.subscribe(new RESTCommand('livesession/code/start', SocketRestMethod.Notify), this.startLiveCodingFromOutside)
            this.$socket.subscribe(new RESTCommand('livesession/code/stop', SocketRestMethod.Notify), this.stopLiveCodingFromOutside)
            this.$socket.subscribe(new RESTCommand('livecoding', SocketRestMethod.Patch), this.liveCodingUpdateCode)

            try {
                this.languages = await ProgrammingLanguage.fetchAll()
            } catch (error) {
                console.error(error)
                return
            }

            if (this.message !== undefined) {
                const key = this.message.language
                const l = this.languages.find(l => l.name === key)
                if (l !== undefined) {
                    this.selectKey = l.name
                    this.text = this.message.code
                    this.title = this.message.title
                }
            } else {
                this.selectKey = this.languages[0] === undefined ? 'Blank' : this.languages[0].name
                this.newCodeMessage()
            }
        }

        afterEnterTransition() {
            const nChildren = (<HTMLElement>document.querySelector('.lower-controls > div')).childElementCount
            const el = document.querySelector('.lower-controls') as HTMLElement
            el.style.width = (40 * nChildren) + 'px'
        }

        @Watch('message')
        onMessageChanged(value: CodeMessage, oldValue: CodeMessage) {
            if (value === undefined) {
                this.newCodeMessage()
                return
            }

            this.hasChanges = false
            this.createNew = false
            this.text = value.code
            this.selectKey = value.language
            this.languageKey = this.getlanguageKey(value.language)
            this.title = value.title
        }

        async languageSelected() {
            const key = this.selectKey
            const l = this.languages.find(l => l.name === key)
            if (l === undefined) {
                console.error(key + ' not availiable!')
                return
            }

            this.languageKey = this.getlanguageKey(l.name)

            if (this.newMessage !== null && this.createNew) {
                this.newMessage.language = l.name
            } else if (this.codingSession !== undefined && this.message !== undefined) {
                try {
                    const currentConversationId = this.$store.getters.selectedConversation.id
                    await sendLiveCodingUpdate(this.$socket, currentConversationId,
                        this.message.id, '', '', this.selectKey)
                    this.mutateMessageInStore(this.message.id, currentConversationId, this.title, this.selectKey, this.text)
                } catch (error) {
                    this.$eventBus.$emit('show-notification', {error: true, text: error})
                }
            } else {
                this.hasChanges = true
            }
        }

        startLiveCodingFromOutside(payload: any, source: number) {
            this.toggleLiveSessionFromOutside(payload.messageId, source, payload.newOwner)
        }

        stopLiveCodingFromOutside(payload: any, source: number) {
            this.toggleLiveSessionFromOutside(payload.messageId, source, -1)
        }

        toggleLiveSessionFromOutside(messageId: number, source: number, newOwner: number) {
            this.$store.commit('setLockedState', {newOwner, messageId, conversationId: source})
        }

        async refreshMessage() {
            if (this.message === undefined) return

            try {
                const cId = this.$store.getters.selectedConversation.id
                const message = await reloadMessage(this.message.id, cId) as CodeMessage
                this.mutateMessageInStore(this.message.id, cId, message.title, message.language, message.code)
                this.$store.commit('setModifiedFlagOfMessage', {conversationId: cId, messageId: message.id, state: false})
                this.text = message.code
                this.title = message.title
                this.selectKey = message.language
                this.languageKey = this.getlanguageKey(message.language)
            } catch (error) {
                const text = Errors.refreshMessage(error)
                this.$eventBus.$emit('show-notification', {error: true, text})
            }
        }

        newCodeMessage() {
            this.createNew = true
            if (this.newMessage !== null) {
                this.text = this.newMessage.code
                this.title = this.newMessage.title
                this.selectKey = this.newMessage.language
            } else {
                this.text = ''
                this.title = ''
                this.newMessage = new CodeMessage('', this.text, this.selectKey, this.title)
            }
        }

        clickNewCodeMessage() {
            this.$emit('deselect')
        }

        submitMessage() {
            if (this.newMessage !== null && this.createNew && this.title.length > 0) {
                this.newMessage.sentDate = new Date()
                this.newMessage.author = this.$store.getters.username
                this.message = this.newMessage
                this.$emit('send-message', this.message)
                this.createNew = false
                this.newMessage = null
            }
        }

        async saveMessage() {
            if (this.message !== undefined) {
                const api = new DiffMatchPatch()
                const patches = api.patch_make(this.message.code, this.text)
                const patchStr = api.patch_toText(patches)
                const currentCId = this.$store.getters.selectedConversation.id
                const request = new SocketMessage(
                    new RESTCommand('message', SocketRestMethod.Patch), 
                    currentCId,
                    {
                        patch: patchStr,
                        messageId: this.message.id,
                        title: this.title,
                        language: this.selectKey,
                    }
                ) 

                try {
                    const res = await this.$socket.request(request)
                    this.mutateMessageInStore(this.message.id, currentCId, this.title, this.selectKey, this.text)
                    this.hasChanges = false
                } catch (error) {
                    const text = Errors.saveMessage(error)
                    this.$eventBus.$emit('show-notification', {error: true, text})
                }
            }
        }

        get codingSession(): CodeMessage {
            return this.$store.getters.messagesOfType(MessageType.Code).find((m: CodeMessage) => m.lockedBy > 0 )
        }

        get isReadonly(): boolean {
            if (this.codingSession === undefined) return false
            if (this.createNew) return false
            return (this.message !== undefined && this.codingSession.id === this.message.id) && 
                this.codingSession.lockedBy !== this.$store.state.chat.self.id
        }

        get hasBeenExternallyModified(): boolean {
            if (this.message === undefined) return false
            if (this.codingSession !== undefined && this.codingSession.id === this.message.id) return false
            return this.message.hasBeenModified
        }

        get liveButtonText(): string {
            return this.codingSession !== undefined ? 'Live beenden' : 'Live'
        }

        get canIShowTheBanner(): boolean {
            if (this.codingSession === undefined) return false
            if (this.codingSession.lockedBy === this.$store.state.chat.self.id) return false
            return this.message === undefined || this.codingSession.id !== this.message.id
        }

        joinLiveCoding() {
            this.$emit('select', this.codingSession.id)
        }

        async toggleLiveCoding() {
            if (this.message === undefined) return
            const currentConversationId = this.$store.getters.selectedConversation.id

            if (this.codingSession !== undefined){
                try {
                    await stopCodingSession(
                        this.$socket, 
                        currentConversationId,
                        this.codingSession.id,
                        this.message.type,
                    )
                    this.$store.commit('setLockedState', {
                        newOwner: -1,
                        messageId: this.codingSession.id,
                        conversationId: currentConversationId,
                    })
                } catch (error) {
                    this.$eventBus.$emit('show-notification', {error: true, text: error})
                }
                return
            } else {
                try {
                    const res = await startCodingSession(
                        this.$socket, 
                        currentConversationId,
                        this.message.id,
                        this.message.type,
                    )
                    this.$store.commit('setLockedState', {
                        newOwner: res.payload.newOwner,
                        messageId: this.message.id,
                        conversationId: currentConversationId,
                    })
                } catch (error) {
                    this.$eventBus.$emit('show-notification', {error: true, text: error})
                }
            }
        }

        async titleChanged(event: Event) {
            if (this.newMessage !== null && this.createNew) {
                this.newMessage.title = this.title
            } else if (this.codingSession !== undefined && this.message !== undefined) {
                try {
                    const currentConversationId = this.$store.getters.selectedConversation.id
                    await sendLiveCodingUpdate(this.$socket, currentConversationId,
                        this.message.id, this.title, '', '')
                    this.mutateMessageInStore(
                        this.message.id, 
                        currentConversationId, 
                        this.title, 
                        this.selectKey, 
                        this.text,
                    )
                } catch (error) {
                    this.$eventBus.$emit('show-notification', {error: true, text: error})
                }
            } else {
                this.hasChanges = true
            }
        }

        liveCodingUpdateCode(data: any, source: number) {
            const api = new DiffMatchPatch()
            const patches = api.patch_fromText(data.patch)
            const result = api.patch_apply(patches, this.message.code)
            const newTitle =  data.title === '' ? this.title : data.title
            const newLanguage = data.language === '' ? this.selectKey : data.language
            this.mutateMessageInStore(data.messageId, source, newTitle, newLanguage, result[0])
            if (this.message.id === this.codingSession.id && this.createNew === false) {
                this.text = result[0]
                this.title = newTitle
                this.selectKey = newLanguage
                this.languageKey = this.getlanguageKey(newLanguage)
            }
        }

        mutateMessageInStore(id: number, conversationId: number, title: string, lang: string, code: string) {
             this.$store.commit('mutateMessage', {
                conversationId,
                messageId: id, 
                title: title, 
                language: lang, 
                code,
            })
        }

        async codeChanged() {
            if (this.newMessage !== null && this.createNew) {
                this.newMessage.code = this.text
            } else if (this.codingSession !== undefined && this.message !== undefined) {
                const api = new DiffMatchPatch()
                const patches = api.patch_make(this.message.code, this.text)
                const patchStr = api.patch_toText(patches)

                try {
                    const currentConversationId = this.$store.getters.selectedConversation.id
                    await sendLiveCodingUpdate(this.$socket, currentConversationId,
                        this.message.id, '', patchStr, '')
                    this.mutateMessageInStore(this.message.id, currentConversationId, this.title, this.selectKey, this.text)
                } catch (error) {
                    this.$eventBus.$emit('show-notification', {error: true, text: error})
                }
            } else {
                this.hasChanges = true
            }
        }

        getlanguageKey(languageName: string): string {
            switch (languageName) {
                case 'CSS':         return 'css'
                case 'C# (.Net Core)': return 'csharp'
                case 'C++':         return 'cpp' 
                case 'C':           return 'c'
                case 'JavaScript':  return 'js'
                case 'Go':          return 'go'
                case 'Swift':       return 'swift'
                case 'Rust':        return 'rust'
                case 'Python':      return 'python'
                case 'PHP':         return 'php'
                case 'Ruby':        return 'ruby'
                case 'Perl':        return 'perl'
                case 'R':           return 'r'
                case 'Java':        return 'css'
                case 'YAML':        return 'yaml'
                case 'GraphQL':     return 'graphql'
                case 'F#':          return 'fsharp'
                case 'Objective-C': return 'objectivec'
                case 'WebAssembly': return 'wasm'
                case 'SQL':         return 'sql'
                case 'MatLab':      return 'matlab'
                case 'Markdown':    return 'markdown'
                case 'Kotlin':      return 'kotlin'
                case 'Bash':        return 'bash'
                case 'XML':         return 'html'
                case 'HTML':        return 'html'
                default: return 'js'
            }
        }
    }

    export default CodeEditor
</script>

<style>
    div.prism-editor__line-numbers {
        background-color: var(--mainBackgroundColor) !important;
        min-height: unset !important;
        overflow: unset;
    }

    pre.prism-editor__code {
        background-color: var(--mainBackgroundColor) !important;
        box-shadow: none !important;
        border: none !important;
    }
</style>

<style scoped>

    @import url("./../../node_modules/prismjs/themes/prism.css") (prefers-color-scheme: light), (prefers-color-scheme: no-preference);
    @import url("./../../node_modules/prismjs/themes/prism-dark.css") (prefers-color-scheme: dark);

	.switchOutButtons-enter, .switchOutButtons-leave-to {
		opacity: 0;
	}
	.switchOutButtons-leave-active {
		position: absolute;
	}

    .mainEditor {
        font-size: 13px;
        height: 80%;
    }

    .codeTitleInput {
        width: 350px;
        height: 30px;
        padding-left: 10px;
        background: var(--mainBackgroundColor);
        border: solid 1px white;
        -webkit-appearance: none;
        font-size: 22px;
    }

    .removeStylesButton {
        -webkit-appearance: none;
        background: none;
        border: none;
        float: none;
        width: 40px;
        height: 40px;
        margin: 0;
    }

    .lower-controls svg {
        height: 20px;
        width: 20px;
    }

    .lower-controls button {
        transition: all 0.25s;
        display: inline-block;
        cursor: pointer;
    }

    .lower-controls {
        position: absolute;
        bottom: 10px;
        right: 20px;
        width: 40px;
        height: 40px;
        box-shadow: 0 2px 3px rgba(0,0,0,0.2), inset 0px 0px 0px 1px lightgrey;
        background-color: white;
        border-radius: 20px;
        transition: width 0.5s;
        overflow: hidden;
    }

    .liveCodingBanner {
        width: 100%;
        background-color: #FAFAFA;
        border-bottom: 1px solid rgb(231, 231, 231);
        height: 50px;
        padding: 15px 25px;
        box-sizing: border-box;
        border-radius: 25px;
    }

    .liveCodingBanner button {
        float: right;
    }

    .languageSelection {
        float: right;
        margin: 8px 9px 0 0;
    }

    .wrapper {
        position: relative;
        overflow: hidden;
    }

    .editorConfig {
        padding: 15px 15px 0 15px;
    }

    .editorConfig select {
        height: 23px;
    }

    .editorConfig button {
        float: right;
        margin-top: 8px;
    }

    @media (prefers-color-scheme: dark) {
      .codeTitleInput { 
        color: white;
        border-color: #2b3a4f;
      }
    }
</style>
