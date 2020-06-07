<template>
    <div class="wrapper">
        <div class="liveCodingBanner" v-show="canIShowTheBanner">
                Jemand möchte Ihnen etwas zeigen.
                <button class="defaultButton" @click="joinLiveCoding">Zuschauen</button>
        </div>
        <div class="editorConfig">
            <input 
                :disabled="isReadonly" 
                type="text" 
                class="codeTitleInput" 
                @input="titleChanged" 
                v-model="title" 
                placeholder="Titel eingeben" />
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
            <button class="defaultButton liveToggle" v-if="!createNew" @click="toggleLiveCoding">
                {{ liveButtonText }}
            </button>
        </div>  
        <codemirror 
            ref="cmEditor"
            class="codeEditor"
            @inputRead="codeChanged" 
            v-model="text" 
            :options="editorOptions"/>

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
    import { Message, CodeMessage, MessageType, reloadMessage, makeMessage } from '../model/message'
    import { RESTCommand, SocketRestMethod, SocketMessage } from '../socket'
    import { startCodingSession, sendLiveCodingUpdate, stopCodingSession } from '../model/coding'
    import { codemirror } from 'vue-codemirror'
    import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
    import { DiffMatchPatch } from 'diff-match-patch-typescript'
    import { Conversation } from '../model/conversation'
    import TitleInput from './titleInput.vue'
    import Errors from '../errors'

    import 'codemirror/lib/codemirror.css'

    // language
    import 'codemirror/mode/python/python.js'
    import 'codemirror/mode/swift/swift.js'
    import 'codemirror/mode/clike/clike.js'
    import 'codemirror/mode/coffeescript/coffeescript.js'
    import 'codemirror/mode/markdown/markdown.js'
    import 'codemirror/mode/php/php.js'
    import 'codemirror/mode/ruby/ruby.js'
    import 'codemirror/mode/rust/rust.js'
    import 'codemirror/mode/shell/shell.js'
    import 'codemirror/mode/groovy/groovy.js'
    import 'codemirror/mode/css/css.js'
    import 'codemirror/mode/go/go.js'
    import 'codemirror/mode/sql/sql.js'
    import 'codemirror/mode/cmake/cmake.js'
    import 'codemirror/mode/vue/vue.js'
    import 'codemirror/mode/perl/perl.js'
    import 'codemirror/mode/octave/octave.js'
    import 'codemirror/mode/xml/xml.js'
    import 'codemirror/mode/dockerfile/dockerfile.js'
    import 'codemirror/mode/yaml/yaml.js'
    import 'codemirror-graphql/mode'

    import 'codemirror/addon/edit/closetag.js'
    import 'codemirror/addon/edit/matchbrackets.js'
    import 'codemirror/addon/edit/closebrackets.js'

    @Component({
        name: 'codeEditor',
        components: {
            codemirror,
            TitleInput,
        },
    })
    class CodeEditor extends Vue {
        @Prop() public message!: CodeMessage

        selectKey = ''
        languages: readonly ProgrammingLanguage[] = []
        newMessage: CodeMessage | null = null
        createNew = false
        hasChanges = false
        text = ''
        title = ''
        editorOptions = this.makeOptions('JavaScript', false)

        async created () {
            this.$socket.subscribe(new RESTCommand('livesession/code', SocketRestMethod.Post), this.startLiveCodingFromOutside)
            this.$socket.subscribe(new RESTCommand('livesession/code', SocketRestMethod.Delete), this.stopLiveCodingFromOutside)
            this.$socket.subscribe(new RESTCommand('livesession/code', SocketRestMethod.Patch), this.liveCodingUpdateCode)

            try {
                this.languages = await ProgrammingLanguage.fetchAll()
            } catch (error) {
                console.error(error)
            }

            if (this.message !== undefined) {
                const l = this.languages.find(l => l.name === this.message.language)
                if (l !== undefined) {
                    this.setState(this.message.title, this.message.code, l.name)
                }
            } else {
                this.selectKey = this.languages[0] === undefined ? 'JavaScript' : this.languages[0].name
                this.newCodeMessage()
            }
        }

        destroyed() {
            this.$socket.unsubscribe(new RESTCommand('livesession/code', SocketRestMethod.Post), this.startLiveCodingFromOutside)
            this.$socket.unsubscribe(new RESTCommand('livesession/code', SocketRestMethod.Delete), this.stopLiveCodingFromOutside)
            this.$socket.unsubscribe(new RESTCommand('livesession/code', SocketRestMethod.Patch), this.liveCodingUpdateCode)
        }

        afterEnterTransition() {
            const nChildren = (<HTMLElement>document.querySelector('.lower-controls > div')).childElementCount
            const el = document.querySelector('.lower-controls') as HTMLElement
            el.style.width = (40 * nChildren) + 'px'
        }

        @Watch('message')
        async onMessageChanged(value: CodeMessage, oldValue: CodeMessage) {
            if (value === undefined) {
                this.newCodeMessage()
                return
            }

            this.createNew = false
            this.setState(value.title, value.code, value.language)
            await this.$nextTick()
            this.codemirror.clearHistory()
            this.hasChanges = false
        }

        makeOptions(languageName: string, readOnly: boolean) {
            return {
                mode: this.getlanguageKey(languageName),
                autoCloseBrackets: true,
                lineNumbers: true,
                autoCloseTags: true,
                line: true,
                matchBrackets: true,
                lineWrapping: true,
                readOnly: readOnly,
                theme: 'default lucario',
                tabSize: 4,
            }
        }

        async languageSelected() {
            const l = this.languages.find(l => l.name === this.selectKey)
            if (l === undefined) {
                console.error(this.selectKey + ' not availiable!')
                return
            }

            this.editorOptions = this.makeOptions(l.name, this.isReadonly)

            if (this.newMessage !== null && this.createNew) {
                this.newMessage.language = l.name
            } else if (this.codingSession !== undefined && this.message !== undefined) {
                try {
                    const conversationId = this.$store.getters.selectedConversation.id
                    await sendLiveCodingUpdate(this.$socket, conversationId, this.message.id, '', '', this.selectKey)
                    this.mutateMessageInStore(this.message.id, conversationId, this.title, this.selectKey, this.text)
                } catch (error) {
                    const text = Errors.sendMessage(error)
                    this.$eventBus.$emit('show-notification', {error: true, text})
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
            this.editorOptions = this.makeOptions(this.selectKey, this.isReadonly)
        }

        async refreshMessage() {
            if (this.message === undefined) return

            try {
                const cId = this.$store.getters.selectedConversation.id
                const message = await reloadMessage(this.message.id, cId) as CodeMessage
                this.mutateMessageInStore(this.message.id, cId, message.title, message.language, message.code)
                this.$store.commit('setModifiedFlagOfMessage', {conversationId: cId, messageId: message.id, state: false})
                this.setState(message.title, message.code, message.language)
            } catch (error) {
                const text = Errors.refreshMessage(error)
                this.$eventBus.$emit('show-notification', {error: true, text})
            }
        }

        setState(title: string, text: string, selectKey: string) {
            this.text = text
            this.title = title
            this.selectKey = selectKey
            this.editorOptions = this.makeOptions(selectKey, this.isReadonly)
        }

        newCodeMessage() {
            this.createNew = true
            if (this.newMessage !== null) {
                this.setState(this.newMessage.title, this.newMessage.code, this.newMessage.language)
            } else {
                this.text = ''
                this.title = ''
                this.newMessage = new CodeMessage('', this.text, this.selectKey, this.title)
            }
        }

        clickNewCodeMessage() {
            this.$emit('deselect')
        }

        async submitMessage() {
            if (this.newMessage !== null && this.createNew && this.title.length > 0) {
                this.newMessage.sentDate = new Date()
                this.newMessage.author = this.$store.getters.username
                this.message = this.newMessage

                try {
                    const currentCId = this.$store.getters.selectedConversation.id
                    const res = await this.message.send(this.$socket, currentCId)
                    this.$emit('send-message', res, currentCId)
                    this.createNew = false
                    this.newMessage = null
                } catch (error) {
                    const text = Errors.sendMessage(error)
                    this.$eventBus.$emit('show-notification', {error: true, text})
                }
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

        get codemirror(): CodeMirror.Editor {
            return (this.$refs.cmEditor as any).cminstance
        }

        joinLiveCoding() {
            this.$emit('select', this.codingSession.id)
        }

        async toggleLiveCoding() {
            if (this.message === undefined) return
            const conversationId = this.$store.getters.selectedConversation.id
            const messageType = this.message.type

            if (this.codingSession !== undefined){
                try {
                    await stopCodingSession(this.$socket, conversationId, this.codingSession.id, messageType)
                    this.$store.commit('setLockedState', {
                        newOwner: -1,
                        messageId: this.codingSession.id,
                        conversationId: conversationId,
                    })
                } catch (error) {
                    const text = Errors.toggleLiveCodeing(error)
                    this.$eventBus.$emit('show-notification', {error: true, text})
                }
            } else {
                try {
                    const res = await startCodingSession(this.$socket, conversationId, this.message.id, messageType)
                    this.$store.commit('setLockedState', {
                        newOwner: res.payload.newOwner,
                        messageId: this.message.id,
                        conversationId: conversationId,
                    })
                } catch (error) {
                    const text = Errors.toggleLiveCodeing(error)
                    this.$eventBus.$emit('show-notification', {error: true, text})
                }
            }
            this.editorOptions = this.makeOptions(this.selectKey, this.isReadonly)
        }

        async titleChanged(event: Event) {
            if (this.newMessage !== null && this.createNew) {
                this.newMessage.title = this.title
            } else if (this.codingSession !== undefined && this.message !== undefined) {
                try {
                    const conversationId = this.$store.getters.selectedConversation.id
                    await sendLiveCodingUpdate(this.$socket, conversationId, this.message.id, this.title, '', '')
                    this.mutateMessageInStore(
                        this.message.id, 
                        conversationId, 
                        this.title, 
                        this.selectKey, 
                        this.text,
                    )
                } catch (error) {
                    const text = Errors.sendMessage(error)
                    this.$eventBus.$emit('show-notification', {error: true, text})
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
                this.setState(newTitle, result[0], newLanguage)
            }
        }

        mutateMessageInStore(id: number, conversationId: number, title: string, lang: string, code: string) {
             this.$store.commit('mutateMessage', {
                conversationId,
                message: {
                    id, 
                    title, 
                    language: lang, 
                    code,
                }
            })
        }

        async codeChanged(inst: any, changes: any) {
            if (this.newMessage !== null && this.createNew) {
                this.newMessage.code = this.text
            } else if (this.codingSession !== undefined && this.message !== undefined) {
                const api = new DiffMatchPatch()
                const patches = api.patch_make(this.message.code, this.text)
                const patchStr = api.patch_toText(patches)

                try {
                    const conversationId = this.$store.getters.selectedConversation.id
                    await sendLiveCodingUpdate(this.$socket, conversationId, this.message.id, '', patchStr, '')
                    this.mutateMessageInStore(this.message.id, conversationId, this.title, this.selectKey, this.text)
                } catch (error) {
                    const text = Errors.sendMessage(error)
                    this.$eventBus.$emit('show-notification', {error: true, text})
                }
            } else {
                this.hasChanges = true
            }
        }

        getlanguageKey(languageName: string): string {
            switch (languageName) {
                case 'CSS':         return 'text/css'
                case 'C# (.Net Core)': return 'text/x-csharp'
                case 'C++':         return 'text/x-c++src' 
                case 'C':           return 'text/x-csrc'
                case 'JavaScript':  return 'text/javascript'
                case 'Go':          return 'text/x-go'
                case 'Swift':       return 'text/x-swift'
                case 'Rust':        return 'text/x-rust'
                case 'Python':      return 'text/x-python'
                case 'PHP':         return 'text/x-php'
                case 'Ruby':        return 'text/x-ruby'
                case 'Perl':        return 'text/x-perl'
                case 'R':           return 'text/x-r'
                case 'Java':        return 'text/x-java'
                case 'YAML':        return 'text/x-yaml'
                case 'GraphQL':     return 'graphql'
                case 'F#':          return 'text/x-fsharp'
                case 'Objective-C': return 'text/x-objectivec'
                case 'WebAssembly': return 'text/wasm'
                case 'SQL':         return 'text/x-sql'
                case 'MatLab':      return 'text/x-octave'
                case 'Markdown':    return 'text/x-markdown'
                case 'Kotlin':      return 'text/x-kotlin'
                case 'Bash':        return 'text/x-sh'
                case 'XML':         return 'application/xml'
                case 'HTML':        return 'text/html'
                case 'PL/SQL':      return 'text/x-pgsql'
                case 'JSON':        return 'application/json'
                case 'TypeScript':  return 'text/typescript'
                default:            return 'text/javascript'
            }
        }
    }

    export default CodeEditor
</script>

<style>
    .CodeMirror, .cm-s-lucario.CodeMirror {
        background-color: unset !important;
    }

    .CodeMirror-gutters, .cm-s-lucario .CodeMirror-gutters {
        border: none;
        background: unset !important;
    }

    .CodeMirror {
        height: auto;
    }

</style>

<style scoped>

    @import url("./../../node_modules/codemirror/theme/lucario.css") (prefers-color-scheme: dark);

	.switchOutButtons-enter, .switchOutButtons-leave-to {
		opacity: 0;
	}
	.switchOutButtons-leave-active {
		position: absolute;
	}

    .codeEditor {
        flex: 1;
        overflow-y: scroll;
        overflow-x: hidden;
    }

    .codeTitleInput {
        flex: 1;
        height: 30px;
        padding-left: 10px;
        margin-right: 25px;
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
        z-index: 100;
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

    .liveToggle {
        font-weight: 600;
    }

    .wrapper {
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .editorConfig {
        display: flex;
        padding: 15px 0 0 2px;
        margin-bottom: 10px;
    }

    .editorConfig select {
        height: 26px;
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
