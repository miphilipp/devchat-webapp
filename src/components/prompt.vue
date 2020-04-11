<template>
    <div class="wrapper">
        <h4>{{ text }}</h4>
        <button class="defaultButton" @click="yes">Ja</button>
        <button class="defaultButton" @click="no">Abbrechen</button>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
class Prompt extends Vue {

    @Prop() text!: string

    no() {
        this.$eventBus.$emit('hide-prompt', false)
    }

    yes() {
        this.$eventBus.$emit('hide-prompt', true)
    }
}

export default Prompt
</script>

<style lang="css" scoped>
    h4 {
        margin-top: 5px;
    }

    button {
        margin-right: 10px;
    }

    .wrapper {
        background-color: white;
        border-radius: 10px;
        padding: 20px;
        color: black;
        position: relative;
        line-height: initial;
		font-weight: initial;
    }
</style>