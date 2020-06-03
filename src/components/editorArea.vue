<template>
    <div class="editorSelection">
        <keep-alive>
            <component 
                v-if="selectedEditor !== null" 
                class="editor" 
                @send-message="relaySendMessage"
                @deselect="deselectMessage"
                @select="selectMesssage"
                :is="selectedEditor.component" 
                v-bind="editorProps"></component>
        </keep-alive>
        <div class="messageSelectionList">
            <h3>{{listTitle}}</h3>
            <div>
                <ul>
                    <li v-for="m in messagesOfType" 
                        :key="m.id" 
                        :class="{'active': selectedMessage === m.id}"
                        @click="selectMesssage(m.id)">
                        {{ m.title }}
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
    import { RESTCommand, SocketRestMethod } from '../socket'
    import { MessageType, Message, getMessagesOfType } from '../model/message'
    import EditorType from '../editor'

    import CodeEditor from './code-editor.vue'
    import { Conversation } from '../model/conversation'

    @Component({
        components: {
            CodeEditor,
        },
    })
    class EditorArea extends Vue {
        @Prop() selectedEditor!: EditorType
        @Prop({default: -1}) selectedMessage!: number

        get editorProps() {
            if (this.selectedEditor === undefined) return {}
            switch (this.selectedEditor.component) {
            case 'codeEditor': return {message: this.messagesOfType.find((m: Message) => m.id === this.selectedMessage)}
            default: return {}
            }
        }

        get currentConversation(): number {
            return this.$store.getters.selectedConversation
        }

        get listTitle(): string {
            return this.selectedEditor === undefined ? '' : this.selectedEditor.listTitle
        }

        get messagesOfType(): Message[] {
            if (this.selectedEditor === undefined) return []
            return this.$store.getters.messagesOfType(this.selectedEditor.messageType)
        }

        relaySendMessage(message: Message, conversationId: number) {
            this.$emit('send-message', message, conversationId)
        }

        deselectMessage() {
            this.$emit('deselect')
        }

        selectMesssage(messageId: number) {
            if (this.selectedEditor === undefined) return
            this.$emit('select-message', messageId, this.selectedEditor.messageType)
        }
    }

    export default EditorArea
</script>

<style scoped>
    .editorSelection {
        height: 100%;
        display: flex;
        flex-direction: row;
    }

    .editor {
        width: calc(100% - 180px);
        margin-right: 20px;
        height: 100%;
    }

    .messageSelectionList {
        display: flex;
        flex-direction: column;
        width: 180px;
        border-radius: 15px;
        border-top: 2px solid white;
        background: linear-gradient(30deg, #e3ffe7 0%, #dde9ff 100%);
        box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.15);
        z-index: 100;
    }

    .messageSelectionList > div {
        flex: 1;
        overflow: scroll;
        overflow-x: hidden;
    }

    .messageSelectionList ul {
        list-style-type: none;
        padding: 0 5px;
        margin: 10px 0 0 0;
    }

    ul li.active {
        background-color: rgba(255, 255, 255, 0.74);
    }

    .messageSelectionList li {
        padding: 5px 15px;
        transition: background-color 0.3s;
        cursor: pointer;
        border-radius: 5px;
        color: #313131;
    }

    .messageSelectionList h3 {
        padding: 0 20px 10px;
        margin: 15px 0 0 0;
        border-bottom: 1px solid white;
        text-shadow: 1px 1px 3px rgba(41, 41, 41, 0.61);
        color: white;
    }

    .messageSelectionList li:hover {
        background-color: rgba(255, 255, 255, 0.74);
    }

    @media (prefers-color-scheme: dark) {
      .messageSelectionList {
        border-top: 2px solid #d6d6d6;
        background: linear-gradient(30deg, #798d7c, #88909e);
      }
    }
</style>