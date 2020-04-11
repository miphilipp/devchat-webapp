<template>
    <div class="banner">
        <div v-if="isError" class="errorIndicator"></div>
        <h3>{{heading}}</h3>
        <p>{{text}}</p>
    </div> 
</template>


<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
class NotificationBanner extends Vue {
    @Prop() public text!: string
    @Prop() public heading!: string
    @Prop({default: false}) public isError!: boolean
}

export default NotificationBanner
</script>


<style scoped>
    .banner {
        padding: 15px;
        background-color: rgba(255, 255, 255, 0.96);
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        min-width: 180px;
        border: 1px solid #ccc;
        overflow: hidden;
    }

    .errorIndicator {
        background-color: red;
        width: 5px;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
    }

    .banner h3 {
        margin: 0;
    }

    .banner p {
        margin-bottom: 0;
    }
</style>  