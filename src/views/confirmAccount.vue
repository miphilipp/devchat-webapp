<template>
	<div id="outerWrapper">
        <div class="message">
            <h3>{{ text }}</h3>
            <div v-if="!error" class="checkmark">
                <font-awesome-icon icon="check"></font-awesome-icon>
            </div>
            <router-link v-if="!error" class="borderless" to="/login">Zum Login ></router-link>
        </div>
	</div>
</template>

<style scoped>
    #outerWrapper {
        display: flex;
        height: 100%;
        margin: auto auto;
        background-image: url("~@/assets/login_background.jpg");
        background-repeat: no-repeat;
        background-size: cover;
    }

    .checkmark {
        border: 3px solid lightgreen;
        height: 60px;
        width: 60px;
        border-radius: 30px;
        margin: 0 auto;
        display: flex;
    }

    .borderless {
        display: block;
        margin: 0 auto;
        -webkit-appearance: none;
        color: lightskyblue;
        background-color: transparent;
        font-size: 15px;
        padding: 5px 20px;
        border: none;
        border-radius: 5px;
        transition: background-color 0.25s;
        cursor: pointer;
    }

    .borderless:hover {
        background-color: rgb(128, 128, 128);
    }

    h3 {
        margin-top: 0;
    }

    .message a {
        margin-top: 20px;
        text-decoration: none;
    }

    .checkmark svg {
        margin: auto;
        height: 30px;
        width: 30px;
        color: lightgreen;
    }

    .message {
        padding: 40px;
        width: 250px;
        text-align: center;
        margin: auto auto;
        color: white;
        background-color: rgb(73, 73, 73);
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
        border-radius: 1.5mm;
        position: relative;    
        z-index: 200;  
    }
</style>

<script lang="ts">

import { Component, Vue } from 'vue-property-decorator'
import { fetchJson } from '../rest'

@Component
export default class ConfirmAccount extends Vue {

    error = false
    text = ''

    async created() {
        const token = this.$route.query.token
        if (token === undefined || token === '') {
            this.error = true
            this.text = 'Dieser Link ist ungültig.'
            return
        }

        try {
            const res = await fetchJson('/user/confirm', {token}, 'PATCH', false)
            this.text = `${res.username}, Ihr Konto konnte erfolgreich bestätigt werden.`
        } catch (error) {
            console.log(error)
            this.text = 'Das hat leider nicht funktioniert.'
            this.error = true
        }
    }
}

</script>