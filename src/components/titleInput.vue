<template>
    <input 
      type="text" 
      class="input" 
      :disabled="editable"
      :value="value" 
      :placeholder="placeholder"
      @input="updateSelf($event.target.value)" />
</template>

<script lang="ts">
import { Component, Prop, Vue, Model } from 'vue-property-decorator'

@Component
class TitleInput extends Vue {

    @Prop({default: true}) editable!: boolean
    @Prop() placeholder!: string
    @Model('input', {type: String}) readonly value!: string


    updateSelf(value: string) {
      this.$emit('input', value)
    }
}

export default TitleInput
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