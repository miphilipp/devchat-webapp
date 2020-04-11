<template>
	<div id="outerWrapper">
        <div>
            <div class="formWrapper">
                <form key="reset" id="signupForm" @submit="submitResetForm" accept-charset="utf-8">
                    <h1>Passwort neu festlegen</h1>
                    <input type="password" class="passwordInp" @input="removeResetErrors" placeholder="Kennwort" />
                    <input type="password" class="retypeInp" @input="removeResetErrors" placeholder="Kennwort erneut eingeben" />
                    <input type="submit" name="submit" class="bigButton" value="Abschicken" />
                </form>
            </div>
            
            <transition name="slideIn">
            <div :class="error ? 'error' : 'success'" v-if="showReqeustResultMessage" class="requestResultMessage">
                <div>{{ message }}</div>
                <router-link v-if="showLink" to="/login">Zum Login >></router-link>
            </div>
            </transition>
        </div>
	</div>
</template>

<style scoped>
    .slideIn-enter-active, .slideIn-leave-active {
        transition: transform .5s;
    }
    .requestResultMessage.slideIn-enter, .requestResultMessage.slideIn-leave-to {
        transform: translateY(0px);
    }

    .error {
        background-color: FireBrick;
        color: white;
    }

    .success {
        background-color: LimeGreen;
        color: black;
    }

    input::placeholder {
        color: darkgray;
    }

    .requestResultMessage {
        transform: translateY(75px);
        width: 290px;
        padding: 0 20px;
        height: 80px;
        position: absolute;
        display: table;
        bottom: 0;
        left: 0;
        z-index: 100;
        border-bottom-left-radius: 1.5mm;
        border-bottom-right-radius: 1.5mm;
        text-align: center;
    }

    .requestResultMessage > div {
        display: table-cell;
        vertical-align: middle;
    }

    form input.error {
        border: 1px solid red !important;
    }

    #outerWrapper {
        display: flex;
        height: 100%;
        margin: auto auto;
        background-image: url("~@/assets/login_background.jpg");
        background-repeat: no-repeat;
        background-size: cover;
    }

    #outerWrapper .formWrapper {
        padding: 40px;
        width: 250px;
        height: 200px;
        text-align: center;
        color: white;
        background-color: rgb(73, 73, 73);
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
        border-radius: 1.5mm;
        position: relative;    
        z-index: 200;   
    }

    #outerWrapper > div {
        width: 330px;
        height: 280px;
        margin: auto auto;
        position: relative;
        z-index: 200;
    }

    form h1 {
        font-family: Helvetica;
        margin-top: 0;
        margin-bottom: 20px;
        font-weight: 400;
        font-size: 25px;
    }

    form input[type="text"], form input[type="password"] {
        width: calc(100% - 10px);
        height: 20px;
        margin-bottom: 10px;
        border: 1px solid gray;
        padding: 5px;
        font-size: 12px;
        color:  rgb(39, 39, 39) !important;
        background-color: gray;
        transition: opacity .2s ease-in, border 0.2s;
        border-radius: 0.75mm;
    }  


    .bigButton {
        width: 100%;
        margin-top: 5px;
        height: 30px;
        border: none;
        margin-bottom: 20px;
        font-size: 14px;
        border-radius: 0.75mm;
        transition: background-color .25s, color .25s;
    }

    .bigButton:hover {
        background-color: rgb(66, 126, 238);
        color: white;
        cursor: pointer;
    }

    form span{
        font-size: 14px;
        top: 20px;
        font-family: Arial, Helvetica, sans-serif;

    }

    form span:hover{
        cursor: pointer;
    }
</style>

<script lang="ts">

import { Component, Vue } from 'vue-property-decorator'
import {fetchJson} from '../auth'
import Errors from '../errors'

@Component
export default class Recovery extends Vue {

    message = ''
    showReqeustResultMessage = false
    error = false
    showLink = false

    removeResetErrors() {
        const passwordEl = document.querySelector('#signupForm .passwordInp') as HTMLInputElement
        const retypeEl = document.querySelector('#signupForm .retypeInp') as HTMLInputElement
        passwordEl.classList.remove('error')
        retypeEl.classList.remove('error')
    }

    async submitResetForm(event: Event) {
        event.preventDefault()
        const passwordEl = document.querySelector('#signupForm .passwordInp') as HTMLInputElement
        const retypeEl = document.querySelector('#signupForm .retypeInp') as HTMLInputElement
        const password = passwordEl.value
        const retypedPassword = retypeEl.value

        let hasErrors = false

        if (password === '') {
            passwordEl.classList.add('error')
            hasErrors = true
        }

        if (password !== retypedPassword) {
            passwordEl.classList.add('error')
            retypeEl.classList.add('error')
            hasErrors = true
        }

        const token = this.$route.query.token
        if (token === undefined || token === '') {
            this.showMessageBox('Ungültiger Link', true, false)
            hasErrors = true
        }

        if (hasErrors) {
            return
        }

        try {
            const res = await fetchJson('/passwordreset', {
                password,
                recoveryUUID: token,
            }, 'POST', false)
            const message = `Das Passwort des Kontos ${res.username} wurde erfolgreich zurückgesetzt.`
            this.showMessageBox(message, false, true)
        } catch (error) {
            const errorText = Errors.resetPassword(error)
            this.showMessageBox(errorText, true, false, 10000)
        }
    }

    showMessageBox(message: string, error: boolean, showLink: boolean, autoHideTime = 0) {
        this.showReqeustResultMessage = true
        this.error = error
        this.message = message
        this.showLink = true
        if (autoHideTime !== 0) {
            setTimeout(() => {
                this.showReqeustResultMessage = false
            }, autoHideTime)
        }
    }
}

</script>