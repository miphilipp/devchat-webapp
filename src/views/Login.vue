<template>
	<div id="outerWrapper">
        <!-- <img id="logo" src="@/assets/logo.png" alt="Produktlogo"> -->

        <div>
            <div class="formWrapper">
                <transition mode="out-in" name="switchOut" @enter="enterTransition">
                <form key="signIn" v-if="mode === 0" @submit="submitLoginForm" id="loginForm">
                    <h1 id="heading">Anmelden</h1>
                    <input @input="removeLoginErrors" type="text" placeholder="Benutzername" />
                    <input @input="removeLoginErrors" type="password" placeholder="Kennwort" />
                    <input id="submit" type="submit" value="Anmelden" class="bigButton" />
                    <button id="recoveryButton" class="borderless" @click="changeMode(2)">Passwort vergessen?</button>
                    <button id="registerButton" class="borderless" @click="changeMode(1)">Noch nicht registriert?</button>
                </form>

                <form key="recover" v-else-if="mode === 2" id="recoveryForm" @submit="submitPasswordReset" accept-charset="utf-8">
                    <h1>Passwort vergessen</h1>
                    <input type="text" class="emailInp" @input="removeRecoveryErrors" placeholder="E-Mail" />
                    <input type="submit" name="submit" class="bigButton" value="Wiederherstellen" />
                </form>

                <form key="signUp" v-else id="signupForm" @submit="submitRegisterForm" accept-charset="utf-8">
                    <h1>Registrieren</h1>
                    <input type="text" class="usernameInp" @input="removeRegisterErrors" placeholder="Benutzername" />
                    <input type="text" class="emailInp" @input="removeRegisterErrors" placeholder="E-Mail" />
                    <input type="password" class="passwordInp" @input="removeRegisterErrors" placeholder="Kennwort" />
                    <input type="password" class="retypeInp" @input="removeRegisterErrors" placeholder="Kennwort erneut eingeben" />
                    <input type="submit" name="submit" class="bigButton" value="Registrieren" />
                </form>
                </transition>
            </div>

            <transition name="slide-in">
            <div :class="error ? 'error' : 'success'" v-if="showReqeustResultMessage" class="requestResultMessage">
                <div>{{ message }}</div>
            </div>
            </transition>
        </div>
	</div>
</template>

<style scoped>
    .switchOut-enter-active, .switchOut-leave-active {
        transition: opacity .5s;
    }
    .switchOut-enter, .switchOut-leave-to {
        opacity: 0;
    }

    .slide-in-enter-active, .slide-in-leave-active {
        transition: transform .5s;
    }
    .requestResultMessage.slide-in-enter, .requestResultMessage.slide-in-leave-to {
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
        transform: translateY(115px);
        width: 330px;
        height: 70px;
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

    .requestResultMessage button {

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
        height: 250px;
        text-align: center;
        color: white;
        background-color: rgb(73, 73, 73);
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
        border-radius: 1.5mm;
        transition: height 0.3s;
        position: relative;
        z-index: 200;
    }

    input::placeholder {
        color: darkgray;
    }

    .borderless {
        display: block;
        margin: 0 auto;
        -webkit-appearance: none;
        color: lightskyblue;
        background-color: transparent;
        font-size: 15px;
        margin-bottom: 13px;
        padding: 5px 20px;
        border: none;
        border-radius: 5px;
        transition: background-color 0.25s;
        cursor: pointer;
    }

    .borderless:hover {
        background-color: rgb(128, 128, 128);
    }

    #outerWrapper > div {
        width: 330px;
        height: 280px;
        margin: auto auto;
        position: relative;
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

    #logo{
        width: 300px;
        height: 60px;
        position: absolute;
        left: calc(50% - 150px);
        top: 15%;
        padding-bottom: 10px;
        padding-top: 10px;
        border: 1px solid rgb(255, 255, 255);
    }
</style>

<script lang="ts">

import { Component, Vue } from 'vue-property-decorator'
import { fetchJson, login, storageAvailable } from '../auth'
import Errors from '../errors'
import { ClientError, ServerError } from '../errors';

enum FormMode {
    SignIn = 0,
    Register = 1,
    Recover = 2,
}

@Component
export default class Login extends Vue {

    mode = FormMode.SignIn
    message = '' // TODO: Debug
    showReqeustResultMessage = false
    error = false

    enterTransition() {
        const el = document.querySelector('.formWrapper') as HTMLInputElement
        if (this.mode === FormMode.Recover) {
            el.style.height = '130px'
        } else if (this.mode === FormMode.Register) {
            el.style.height = '250px'
        } else {
            el.style.height = '250px'
        }
    }

    async submitPasswordReset(e: Event) {
        e.preventDefault()
        const emailEl = document.querySelector('#signupForm .emailInp') as HTMLInputElement
        const email = emailEl.value

        if (/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email) === false) {
            emailEl.classList.add('error')
            return
        }

        try {
            const res = await fetchJson('/sendpasswordreset', { email }, 'POST', false)
            this.showMessageBox('Überprüfen Sie ihr Mail-Postfach.', false)
        } catch (error) {
            const errorText = Errors.login(error)
            this.showMessageBox(errorText, true, 10000)
        }
    }

    async submitLoginForm(event: Event) {
        event.preventDefault()
        let hasErrors = false

        const passwordEl = document.querySelector('#loginForm input[type="password"]') as HTMLInputElement
        const usernameEl = document.querySelector('#loginForm input[type="text"]') as HTMLInputElement
        const password = passwordEl.value
        const username = usernameEl.value

        if (password === '') {
            passwordEl.classList.add('error')
            hasErrors = true
        }

        if (username === '') {
            (<HTMLInputElement>document.querySelector('#loginForm input[type="text"]')).classList.add('error')
            hasErrors = true
        }

        if (hasErrors) {
            return
        }

        try {
            if (!storageAvailable) {
                throw {info: {code: 2001}}
            }

            const loginRes = await login(username, password)
            if (loginRes === true) {
                this.$router.push('/')
            } else {
                this.showMessageBox('Falsche Anmeldedaten', true, 5000)
            }
        } catch (error) {
            const errorText = Errors.login(error)
            this.showMessageBox(errorText, true, 10000)
        }
    }

    removeRegisterErrors() {
        const passwordEl = document.querySelector('#signupForm .passwordInp') as HTMLInputElement
        const retypeEl = document.querySelector('#signupForm .retypeInp') as HTMLInputElement
        const usernameEl = document.querySelector('#signupForm .usernameInp') as HTMLInputElement
        const emailEl = document.querySelector('#signupForm .emailInp') as HTMLInputElement
        passwordEl.classList.remove('error')
        retypeEl.classList.remove('error')
        usernameEl.classList.remove('error')
        emailEl.classList.remove('error')
    }

    removeRecoveryErrors() {
        const emailEl = document.querySelector('#signupForm .emailInp') as HTMLInputElement
        emailEl.classList.remove('error')
    }

    removeLoginErrors() {
        const passwordEl = document.querySelector('#loginForm input[type="password"]') as HTMLInputElement
        const usernameEl = document.querySelector('#loginForm input[type="text"]') as HTMLInputElement
        passwordEl.classList.remove('error')
        usernameEl.classList.remove('error')
    }

    async submitRegisterForm(event: Event) {
        event.preventDefault()
        const passwordEl = document.querySelector('#signupForm .passwordInp') as HTMLInputElement
        const retypeEl = document.querySelector('#signupForm .retypeInp') as HTMLInputElement
        const usernameEl = document.querySelector('#signupForm .usernameInp') as HTMLInputElement
        const emailEl = document.querySelector('#signupForm .emailInp') as HTMLInputElement
        const password = passwordEl.value
        const retypedPassword = retypeEl.value
        const username = usernameEl.value
        const email = emailEl.value

        let hasErrors = false

        if (password === '') {
            passwordEl.classList.add('error')
            hasErrors = true
        }

        if (email === '') {
            emailEl.classList.add('error')
            hasErrors = true
        } else if (/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email) === false) {
            hasErrors = true
            emailEl.classList.add('error')
        }

        if (username === '') {
            usernameEl.classList.add('error')
            hasErrors = true
        }

        if (password !== retypedPassword) {
            passwordEl.classList.add('error')
            retypeEl.classList.add('error')
            hasErrors = true
        }

        if (hasErrors) {
            return
        }

        try {
            const res = await fetchJson('/user', {
                username,
                password,
                email,
            }, 'POST', false)
            this.mode = FormMode.SignIn
            this.showMessageBox('Registrierung erfolgreich', true)
        } catch (error) {
            const errorText = Errors.login(error)
            this.showMessageBox(errorText, true, 10000)
        }
    }

    showMessageBox(message: string, error: boolean, autoHide = 0) {
        this.showReqeustResultMessage = true
        this.message = message
        this.error = error
        if (autoHide !== 0) {
            setTimeout(() => {
                this.showReqeustResultMessage = false
            }, autoHide)
        }
    }

    changeMode(mode: FormMode) {
        this.showReqeustResultMessage = false
        this.mode = mode
    }
}

</script>