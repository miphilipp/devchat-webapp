<template>
    <div class="Nachricht">
        <div :class="[isOwn ? 'right OuterBox' : 'left OuterBox']">
            <span class="meta timestamp">{{ timestamp }}</span>
            <span v-if="showAuthor" class="meta">{{ msg.author }}</span>
            <div :style='{"--indicatorColor": color}' class="clearfix MessageContainer">
                <h4>{{ msg.title }}</h4>
                <div class="languageIndicator">
                    {{ getlanguageExt(msg.language) }}
                </div>
                <!-- <p id="messageText">{{ msg.text }}</p> -->
            </div>
        </div>
    </div> 
</template>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { CodeMessage } from "../message"
import ProgrammingLanguage from '../programmingLanguage'

@Component
class CodeMessageBox extends Vue {
    @Prop() public msg!: CodeMessage
    @Prop() public color!: string
    @Prop() public showAuthor!: boolean

    get timestamp() {
        return this.msg.sentDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }
    get isOwn() {
        return this.$store.getters.username === this.msg.author
    }

    getlanguageExt(languageName: string): string {
        switch (languageName) {
            case "CSS":         return ".css"
            case "C++":         return ".cpp" 
            case "C":           return ".c"
            case "JavaScript":  return ".js"
            case "Coffee Script": return ".coffee"
            case "Go":          return ".go"
            case "Swift":       return ".swift"
            case "Rust":        return ".rs"
            case "Python":      return ".py"
            case "PHP":         return ".php"
            case "JSON":        return ".json"
            case "Ruby":        return ".rb"
            case "Groovy":      return ".gvy"
            case "Perl":        return ".pl"
            case "Java":        return ".java"
            case "YAML":        return ".yaml"
            case "GraphQL":     return ".ql"
            case "F#":          return ".fs"
            case "C#":          return ".cs"
            case "Objective-C": return ".m/h"
            case "SQL":         return ".sql"
            case "MatLab":      return ".m"
            case "Markdown":    return ".md"
            case "Kotlin":      return ".kt"
            case "Bash":        return ".sh"
            case "XML":        return ".xml"
            case "HTML":        return ".html"
            default: return ".txt"
        }
    }
}

export default CodeMessageBox
</script>


<style scoped>
    p {
        margin: 0;
    }

    .languageIndicator {
        border-radius: 8px;
        font-size: 20px;
        font-weight: 500;
        padding: 8px;
        background: linear-gradient(45deg,#38b4fd,#23e1ff);
        display: inline-block;
        color: white;
    }

    .MessageContainer h4 {
        margin: 0 0 7px 0;
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
        background-color: rgba(255, 255, 255, 0.6);
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