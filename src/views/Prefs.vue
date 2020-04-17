<template>
  <div class="wrapper">
    <nav>
      <font-awesome-icon class="closeIcon" icon="times" @click="closeSettings"></font-awesome-icon>
      <h1>{{$route.name}}</h1>
    </nav>
    <div>
      <div class="personalInfo">
        <div class="avatarWrapper clearfix">
          <img :src="avatarLink" alt="avatar" class="avatar">
          <button class="defaultButton" @click="changeAvatar">Profilbild ändern</button>
          <button class="defaultButton" @click="deleteAvatar">Löschen</button>
          <Circle2 class="spinner" v-if="avatarLoading"></Circle2>
          <input 
              id="avatar-input" 
              @change="chooseImage" 
              type="file" 
              accept="image/png" 
              name="avatar" 
              style="display: none;" />
        </div>
        <table>
          <tr>
            <td><span class="prefix">Benutzername - </span></td>
            <td><h3>{{ username }}</h3></td>
          </tr>
          <tr>
            <td><span class="prefix">E-Mail - </span></td>
            <td><h3>{{ emailAddress }}</h3></td>
          </tr>
        </table>
      </div>
      
      <form class="password-settings">
        <span>Kennwort</span>
        <input type="password" @input="removePasswordChangeErrors" placeholder="Bisheriges Kennwort" class="old">
        <input type="password" @input="removePasswordChangeErrors" placeholder="Neues Kennwort" class="new">
        <input class="defaultButton" type="submit" @click.prevent="changePassword" value="Ändern">
      </form>

      <button class="deleteButton defaultButton" @click="clickDeleteAccount">Konto löschen</button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { postData, fetchJson } from '../rest'
import { login, logout, getMediaToken } from '../auth'
import { changePassword, deleteAccount } from '../model/user'
import Errors from '../errors'
import Circle2 from 'vue-loading-spinner/src/components/Circle2.vue'

@Component({
  components: {
    Circle2,
  },
})
export default class Preferences extends Vue {

  wantsConfirmation = false
  avatarLink = ''
  avatarLoading = false

  async created() {
    this.$eventBus.$on('hide-prompt', this.confirmDelete)
		this.avatarLink = await this.generateAvatarLink()
  }

  closeSettings() {
    this.$router.push('/')
  }

  async changePassword() {
    const oldPasswordEl = document.querySelector('.password-settings .old') as HTMLInputElement
    const newPasswordEl = document.querySelector('.password-settings .new') as HTMLInputElement
    const oldPassword = oldPasswordEl.value
    const newPassword = newPasswordEl.value

    let hasErrors = false
    if (oldPassword === '') {
      oldPasswordEl.classList.add('error')
      hasErrors = true
    }

    if (newPassword === '') {
      newPasswordEl.classList.add('error')
      hasErrors = true
    }

    if (hasErrors) return

    try {
      await changePassword(oldPassword, newPassword)
      this.$logout(true)
    } catch (error) {
      oldPasswordEl.value = ''
      newPasswordEl.value = ''
      const text = Errors.changePassword(error)
      this.$eventBus.$emit('show-notification', {error: true, text})
    }
  }

  async generateAvatarLink(): Promise<string> {
    const token = await getMediaToken()
    return `/media/user/${this.$store.state.chat.self.id}/avatar?token=${token}`
  }

  async chooseImage() {
    const file = (document.getElementById('avatar-input') as HTMLInputElement).files!.item(0)
    if (file === null) return

    const fd = new FormData();
    fd.append('avatar', file);

    try {
      this.avatarLoading = true
      await postData('/user/avatar', fd)
      this.avatarLink = await this.generateAvatarLink()
    } catch (error) {
      const text = Errors.changeAvatar(error)
      this.$eventBus.$emit('show-notification', {error: true, text})
    } finally {
      this.avatarLoading = false
    }
  }

  async deleteAvatar() {
    try {
      await fetchJson('/user/avatar', undefined, 'DELETE')
      this.avatarLink = await this.generateAvatarLink()
    } catch (error) {
      const text = Errors.deleteAvatar(error)
      this.$eventBus.$emit('show-notification', {error: true, text})
    }
  }

  changeAvatar() {
    document.getElementById('avatar-input')!.click()
  }

  clickDeleteAccount() {
    this.wantsConfirmation = true
    this.$eventBus.$emit('show-prompt', 'Möchten Sie Ihr Konto wirklich entgültig löschen?')
  }

  removePasswordChangeErrors() {
    const oldPasswordEl = document.querySelector('.password-settings .old') as HTMLInputElement
    const newPasswordEl = document.querySelector('.password-settings .new') as HTMLInputElement
    oldPasswordEl.classList.remove('error')
    newPasswordEl.classList.remove('error')
  }

  async confirmDelete(res: boolean) {
    if (!this.wantsConfirmation) return
    if (res === false) return
    try {
      await deleteAccount()
      this.$logout(true)
    } catch (error) {
      const text = Errors.deleteAccount(error)
      this.$eventBus.$emit('show-notification', {error: true, text})
    }
  }

  get username(): string {
    return this.$store.state.chat.self.name
  }

  get emailAddress(): string {
    return this.$store.state.chat.self.email
  }
}
</script>

<style scoped>
  nav {
    height: 70px;
    width: 100%;
    text-align: center;
    background-color: white;
    position: relative;
  }

  .avatar {
    --size: 80px;
    height: var(--size);
    width: var(--size);
    border-radius: calc(var(--size) / 2);
    margin-right: 20px;
    float: left;
  }

  .avatarWrapper {
    margin-bottom: 20px;
    position: relative;
  }

  .avatarWrapper div.spinner {
    position: absolute;
    height: 80px !important;
    width: 80px !important;
    top: 0;
  }

  .avatarWrapper button {
    margin-top: 30px;
    margin-right: 10px;
  }

  .closeIcon {
    position: absolute;
    left: 25px;
    top: 20px;
    height: 25px;
    width: 25px;
    cursor: pointer;
  }

  .wrapper {
    height: 100vh;
    --backgroundColor: rgb(247, 247, 247);
  }

  .prefix {
    display: inline;
    font-size: 20px;
    color: gray;
  }

  .personalInfo h2, h3 {
    margin: 0;
  }

  .wrapper > div form:first-of-type {
    margin-top: 50px;
  }

  .deleteButton {
    color: red;
  }

  .wrapper > div {
    width: 450px;
    margin: 0 auto;
    margin-top: 60px;
  }

  .password-settings {
    border: 1px solid darkgray;
    border-radius: 15px;
    padding: 20px 30px 10px;
    position: relative;
    margin-bottom: 25px;
  }

  .password-settings input[type="password"] {
    width: 150px;
    height: 20px;
    padding: 1px 5px;
    border: 1px solid lightgray;
    transition: border-color .3s;
  }

  .password-settings span {
    background-color: var(--backgroundColor);
    position: absolute;
    top: -10px;
    padding: 0 5px;
  }

  .password-settings > input {
    display: block;
    margin-bottom: 10px;
  }

  nav h1 {
    margin: 0;
    line-height: 70px;
  }

  form input.error {
    border: 1px solid red !important;
  }

  .wrapper {
    background-color: var(--backgroundColor);
  }

  @media (prefers-color-scheme: dark) {

    .wrapper {
      background-color: var(--mainBackgroundColor);
      color: white;
    }

    nav {
      background-color: #1c222f;
    }

    .prefix {
      color: rgb(184, 184, 184);
    }

    .password-settings span {
      background-color: var(--mainBackgroundColor);
    }
  }
</style>