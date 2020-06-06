<template>
	<div id="outerWrapper">
        <div class="headings" ref="headings">
            <h1>DevChat</h1>
            <div class="headingSeparator"></div>

            <transition mode="out-in" name="fade" @enter="enterFadeAnimation">
            <h1 :key="formTitle">{{ formTitle }}</h1>
             </transition>
        </div>
        
        <div class="contentArea">
            <div class="formWrapper yellowBox">
                <transition mode="out-in" name="switchOut" @enter="enterTransition">
                <form 
                    key="signIn" 
                    v-if="mode === 0" 
                    @submit.prevent="submitLoginForm" 
                    id="loginForm" 
                    class="clearfix">

                    <label for="signin_name">Benutzername</label>
                    <input @input="removeLoginErrors" type="text" id="signin_name" />
                    <label for="signin_password">Kennwort</label>
                    <input @input="removeLoginErrors" type="password" id="signin_password" />
                    <input id="submit" type="submit" value="Anmelden" class="bigButton" />
                </form>

                <form key="recover" v-else-if="mode === 2" id="recoveryForm" @submit.prevent="submitPasswordReset" accept-charset="utf-8">
                    <label for="recover_mail">E-Mail</label>
                    <input type="text" class="emailInp" @input="removeRecoveryErrors" id="recover_mail" autocomplete="off" />
                    <input type="submit" name="submit" class="bigButton" value="Wiederherstellen" />
                </form>

                <form key="signUp" v-else id="signupForm" @submit.prevent="submitRegisterForm" accept-charset="utf-8">
                    <label for="signup_name">Benutzername</label>
                    <input type="text" class="usernameInp" @input="removeRegisterErrors" id="signup_name" autocomplete="off" />
                    <label for="recover_mail">E-Mail</label>
                    <input type="text" class="emailInp" @input="removeRegisterErrors" id="signup_mail" autocomplete="off" />
                    <label for="signup_password">Kennwort</label>
                    <input type="password" class="passwordInp" @input="removeRegisterErrors" id="signup_password" />
                    <label for="signup_password_check">Kennwort erneut eingeben</label>
                    <input type="password" class="retypeInp" @input="removeRegisterErrors" id="signup_password_check" />
                    <input type="submit" name="submit" class="bigButton" value="Registrieren" />
                </form>
                </transition>
            </div>

            <div class="additionalButtons clearfix">
                <button v-show="mode !== 0" id="signinButton" class="borderless" @click="changeMode(0)">
                    Anmelden
                </button>
                <button v-show="mode !== 2" id="recoveryButton" class="borderless" @click="changeMode(2)">
                    Passwort vergessen?
                </button>
                <button v-show="mode !== 1" id="registerButton" class="borderless" @click="changeMode(1)">
                    Noch nicht registriert?
                </button>
            </div>

            <transition name="slide-in">
            <div :class="error ? 'error' : 'success'" v-if="showReqeustResultMessage" class="requestResultMessage">
                <div><span>{{ message }}</span></div>
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

    .fade-enter-active, .fade-leave-active {
		transition: opacity .4s;
	}
	
	.fade-enter, .fade-leave-to {
		opacity: 0;
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
        transform: translateY(-70px);
        width: 300px;
        height: 100px;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 100;
        border-top-left-radius: 30px;
        border-top-right-radius: 30px;
        text-align: center;
    }

    .requestResultMessage > div {
        height: 70px;
        display: flex;
        flex-direction: column;
    }

    .requestResultMessage > div > span {
        margin: auto;
    }

    .requestResultMessage button {

    }

    form input.error {
        border: 1px solid red !important;
    }

    #outerWrapper {
        display: flex;
        flex-direction: row;
        height: 100%;
        margin: auto 0;
        background-color: #EBEBEB;
        background-image: url("~@/assets/login_background.jpg");
        background-repeat: no-repeat;
        background-size: cover;
        justify-content: center;
    }

    #outerWrapper .formWrapper {
        transition: height 0.3s;
        height: 183px;
        position: relative;
        margin-bottom: 10px;
        z-index: 200;
    }

    input::placeholder {
        color: darkgray;
    }

    .borderless {
        display: block;
        margin-bottom: 10px;
        -webkit-appearance: none;
        color: #009bf1;
        text-shadow: 0 0 3px white;
        background-color: transparent;
        font-size: 15px;
        padding: 5px 10px;
        border: none;
        outline: none;
        border-radius: 6px;
        transition: background-color 0.25s;
        cursor: pointer;
    }

    .borderless:hover {
        background-color: white;
    }

    .contentArea {
        height: 280px;
        margin: auto 0;
        flex: 0;
        position: relative;
    }

    h1 {
        font-family: "Contrail One", sans-serif;
        font-weight: 500;
        font-size: 47px;
        margin: 0;
    }

    div.headings {
        width: 250px;
        transition: width 0.3s;
        margin: auto 80px auto 0;
    }

    #signupForm input[type="text"], #signupForm input[type="password"] {
        margin-bottom: 15px;
    }

    form input[type="text"], form input[type="password"] {
        width: 220px;
        display: block;
        margin-bottom: 22px;
        transition: opacity .2s ease-in, border 0.2s, box-shadow .25s;
    }

    .headingSeparator {
        height: 2px;
        background-color: black;
        border-radius: 2px;
        width: 250px;
        margin: 15px 0;
    }

    .bigButton {
        width: 130px;
        margin-top: 5px;
        height: 30px;
        border: none;
        background-color: #00A4FF;
        float: left;
        box-shadow: 0 0 16px #00000029;
        color: white;
        font-size: 14px;
        outline: none;
        border-radius: 6px;
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

    @media (max-width: 750px) {
        #outerWrapper {
            flex-direction: column;
            align-items: center;
        }

        .contentArea {
            margin: unset;
            height: auto;
        }

        .headingSeparator {
            margin-left: auto;
            margin-right: auto;
        }

        .borderless {
            width: 100%;
        }

        div.headings {
            margin: 0 auto;
            text-align: center;
            margin-bottom: 50px;
        }
    }
</style>

<script lang="ts">

import { Component, Vue } from 'vue-property-decorator'
import { fetchJson } from '../rest'
import { storageAvailable } from '../storage'
import { login } from '../auth'
import Errors from '../errors'
import { ClientError, ServerError } from '../errors'

enum FormMode {
    SignIn = 0,
    Register = 1,
    Recover = 2,
}

@Component
export default class Login extends Vue {

    mode = FormMode.SignIn
    message = ''
    showReqeustResultMessage = false
    error = false

    enterTransition() {
        const el = document.querySelector('.formWrapper') as HTMLInputElement
        if (this.mode === FormMode.Recover) {
            el.style.height = '110px'
        } else if (this.mode === FormMode.Register) {
            el.style.height = '300px'
        } else {
            el.style.height = '183px'
        }
    }

    enterFadeAnimation() {
        const headings = this.$refs.headings as HTMLElement
        if (this.mode === FormMode.Recover) {
            headings.style.width = '353px'
        } else if (this.mode === FormMode.Register) {
            headings.style.width = '250px'
        } else {
            headings.style.width = '250px'
        }
    }

    async submitPasswordReset(e: Event) {
        const emailEl = document.querySelector('#signupForm .emailInp') as HTMLInputElement
        const email = emailEl.value

        if (/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email) === false) {
            emailEl.classList.add('error')
            return
        }

        try {
            await fetchJson('/sendpasswordreset', { email }, 'POST', false)
            this.showMessageBox('Überprüfen Sie ihr Mail-Postfach.', false)
        } catch (error) {
            this.showMessageBox(Errors.login(error), true, 6000)
        }
    }

    async submitLoginForm(event: Event) {
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
            usernameEl.classList.add('error')
            hasErrors = true
        }

        if (hasErrors) {
            return
        }

        try {
            if (!storageAvailable) {
                throw {info: {code: 2001}}
            }

            await login(username, password)
            this.$router.push('/')
        } catch (error) {
            this.showMessageBox(Errors.login(error), true, 6000)
        }
    }

    removeRegisterErrors() {
        document.querySelector('#signupForm .passwordInp')!.classList.remove('error')
        document.querySelector('#signupForm .retypeInp')!.classList.remove('error')
        document.querySelector('#signupForm .usernameInp')!.classList.remove('error')
        document.querySelector('#signupForm .emailInp')!.classList.remove('error')
    }

    removeRecoveryErrors() {
        document.querySelector('#signupForm .emailInp')!.classList.remove('error')
    }

    removeLoginErrors() {
        document.querySelector('#loginForm input[type="password"]')!.classList.remove('error')
        document.querySelector('#loginForm input[type="text"]')!.classList.remove('error')
    }

    async submitRegisterForm(event: Event) {
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
            await fetchJson('/user', {
                username,
                password,
                email,
            }, 'POST', false)
            this.mode = FormMode.SignIn
            this.showMessageBox('Registrierung erfolgreich', false, 3000)
        } catch (error) {
            this.showMessageBox(Errors.login(error), true, 6000)
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

    get formTitle(): string {
        switch (this.mode) {
            case FormMode.SignIn:   return 'Anmelden'
            case FormMode.Register: return 'Registrieren'
            case FormMode.Recover:  return 'Wiederherstellung'
            default:                return ''
        }
    }

    changeMode(mode: FormMode) {
        this.showReqeustResultMessage = false
        this.mode = mode
    }
}

</script>