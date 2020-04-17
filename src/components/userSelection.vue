<template>
    <div class="wrapper">
        <font-awesome-icon class="closeIcon" icon="times" @click="cancel"></font-awesome-icon>
        <h3>Benutzer auswählen</h3>
        <v-select 
            v-model="selectedUser" 
            :options="options" 
            @search="onSearch" 
            @input="selectionMade"
            placeholder="Benutzername"
            label="name">
            <template slot="no-options">
            Tippen Sie den Benutzernamen ein...
            </template>
        </v-select>
        <ul class="savedUserList">
            <li v-for="u in savedUsers" :key="u.id">
                {{ u.name }}
            </li>
        </ul>
        <button class="defaultButton" @click="confirm">{{actionTitle}}</button>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { fetchJson } from '../rest'
import { User, getOtherUsers } from '../model/user'
import vSelect from 'vue-select'
Vue.component('v-select', vSelect)

@Component
class UserSelection extends Vue {

    @Prop({default: 'Bestätigen'}) actionTitle!: string
    @Prop({default: []}) exclusionList!: number[]

    selectedUser?: User
    savedUsers: User[] = []
    options: User[] = []
    fetchTimeout = -1

    selectionMade(user: User) {
        this.savedUsers.push(user)
        this.selectedUser = undefined
    }

    onSearch(search: string, loading: any) {
        if (this.fetchTimeout !== -1) {
            window.clearTimeout(this.fetchTimeout)
        }

        if (search.length < 2) return
        this.fetchTimeout = window.setTimeout(this.fetchUserResults.bind(this, search, loading), 750)
    }

    cancel() {
        this.$eventBus.$emit('hide-user-selection')
    }

    confirm() {
        this.$eventBus.$emit('hide-user-selection', this.savedUsers)
    }

    async fetchUserResults(search: string, loading: any) {
        try {
            const promise = getOtherUsers(search)
            loading(true)
            const users = await promise
            this.options = users.filter((u: User) => {
                return u.id !== this.$store.state.chat.self.id && !this.exclusionList.includes(u.id)
            })
        } catch (error) {
            console.error(error)
        } finally {
            loading(false)
        }
    }
}

export default UserSelection
</script>

<style lang="css" scoped>
    h3 {
        margin-top: 15px;
        margin-bottom: 15px;
    }

    .closeIcon {
        position: absolute;
        top: 15px;
        right: 15px;
        cursor: pointer;
    }

    .savedUserList {
        list-style-type: none;
        padding: 0;
    }

    .savedUserList li {
        border-bottom: 1px solid lightgray;
        line-height: 35px;
    }

    .savedUserList li:last-of-type {
        border-bottom: none;
    }

    .wrapper {
        background-color: white;
        border-radius: 10px;
        padding: 15px;
        color: black;
        position: relative;
        line-height: initial;
		font-weight: initial;
    }

    @media (prefers-color-scheme: dark) {
        .wrapper {
            background-color: #999;
        }
    }
</style>