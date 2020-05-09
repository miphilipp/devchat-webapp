<template>
    <a :href="makeLink" download class="wrapper">
        <img src="@/assets/file.svg" alt="Datei-Icon">
        <div>
            <span>{{ file.name }}</span>
            <span>{{ makeSizeStr(file.meta.size) }}</span>
        </div>
    </a>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { FileMedia } from '../model/message'

@Component
class FileWrapper extends Vue {
    @Prop() public file!: FileMedia

    get makeLink(): string {
        const currentId = this.$store.getters.selectedConversation.id
        return `media/conversation/${currentId}/${this.file.id}-${this.file.name}`
    }

    makeSizeStr(size: number): string {
        let numberStr: string
        if (size > 10e9) {
		    numberStr = (size / 10e8).toFixed(2) + ' GB'
        } else if (size > 10e6) {
            numberStr =  (size / 10e5).toFixed(2) + ' MB'
        } else if (size > 10e3) {
            numberStr = (size / 10e2).toFixed(2) + ' kB'
        } else {
            numberStr = size + ' Byte'
        }
        return numberStr.replace('.', ',')
    }
}

export default FileWrapper
</script>

<style scoped>
    .wrapper {
        color: black;
        text-decoration: none;
        display: inline-block;
    }

    .wrapper img {
        height: 40px;
        margin-right: 10px;
    }

    .wrapper div span {
        display: block;
    }

    .wrapper div {
        float: right;
    }
</style>
