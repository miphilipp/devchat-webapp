<template>
	<div id="outerWrapper">
        <h1>Kennwort neu festlegen</h1>
        <div>
            <form key="reset" class="yellowBox" id="recoverForm" @submit="submitResetForm" accept-charset="utf-8">
                <label for="recovery_password">Kennwort</label>
                <input type="password" id="recovery_password" @input="removeResetErrors" />
                <label for="recovery_retype_password">Kennwort erneut eingeben</label>
                <input type="password" id="recovery_retype_password" @input="removeResetErrors" />
                <input type="submit" name="submit" class="bigButton" value="Abschicken" />
            </form>
            
            <transition name="slideIn">
            <div :class="error ? 'error' : 'success'" v-if="showReqeustResultMessage" class="requestResultMessage">
                <div>
                    <div>{{ message }}</div>
                    <router-link v-if="showLink" to="/login">Zum Login >></router-link>
                </div>
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

    .requestResultMessage {
        transform: translateY(75px);
        width: 270px;
        padding: 0 20px;
        height: 110px;
        position: absolute;
        bottom: 0;
        left: 0;
        z-index: 100;
        border-bottom-left-radius: 30px;
        border-bottom-right-radius: 30px;
    }

    .requestResultMessage > div {
        height: 75px;
        display: flex;
        position: absolute;
        bottom: 0;
        flex-direction: column;
        justify-content: center;
        text-align: center;
        width: 270px;
    }

    form input.error {
        border: 1px solid red !important;
    }

    #outerWrapper {
        display: flex;
        justify-content: center;
        flex-direction: column;
        height: 100%;
        background-color: #EBEBEB;
        background-image: url("~@/assets/login_background.jpg");
        background-repeat: no-repeat;
        background-size: cover;
    }

    #recoverForm {
        width: 230px;
        position: relative;    
        z-index: 200;   
    }

    #outerWrapper > div {
        height: 280px;
        margin: 0 auto;
        position: relative;
        z-index: 200;
    }

    h1 {
        font-family: "Contrail One", sans-serif;
        margin: 0 auto;
        margin-bottom: 50px;
        font-size: 35px;
    }

    form input[type="text"], form input[type="password"] {
        width: 100%;
        margin-bottom: 20px;
        transition: opacity .2s ease-in, border 0.2s;
    }

    .bigButton {
        margin-top: 5px;
        border: none;
        background-color: #00A4FF;
        box-shadow: 0 0 16px #00000029;
        color: white;
        font-size: 14px;
        border-radius: 6px;
        padding: 7px 15px;
        transition: background-color .25s, color .25s;
    }

    .bigButton:hover {
        background-color: rgb(66, 126, 238);
        color: white;
        cursor: pointer;
    }
</style>

<script lang="ts">

import { Component, Vue } from 'vue-property-decorator'
import { fetchJson } from '../rest'
import Errors from '../errors'

@Component
export default class Recovery extends Vue {

    message = ''
    showReqeustResultMessage = false
    error = false
    showLink = false

    removeResetErrors() {
        document.querySelector('#recovery_password')!.classList.remove('error')
        document.querySelector('#recovery_retype_password')!.classList.remove('error')
    }

    async submitResetForm(event: Event) {
        event.preventDefault()
        const passwordEl = document.querySelector('#recovery_password') as HTMLInputElement
        const retypeEl = document.querySelector('#recovery_retype_password') as HTMLInputElement
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
        this.showLink = showLink
        if (autoHideTime !== 0) {
            window.setTimeout(() => {
                this.showReqeustResultMessage = false
            }, autoHideTime)
        }
    }
}

</script>