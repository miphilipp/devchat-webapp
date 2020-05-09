<template>
    <nav>	
		<div class="leftArea">
			
			<span class="burgerMenu" @click.stop="clickOnBurgerMenu">
				<font-awesome-icon icon="bars"></font-awesome-icon>
				<transition name="appear">
					<span class="unreadIndicator" v-show="numberOfUnreadMessages > 0">{{ numberOfUnreadMessages }}</span>
				</transition>
			</span>

			<div class="titleWrapper" v-click-outside="hideConversationDetails" >
				<h1 @click="toggleConversationDetails">{{ title }}</h1>
				<transition name="popupTransition">
				<AdminPopup class="detailsPopup" v-if="isConversationDetailsVisible && title !== ''" />
				</transition>
			</div>

			<span v-if="isAdmin" class="adminIndicator">admin</span>
		</div>

		<div class="rightArea">
			<ul class="editorList">
				<li v-for="(e, i) in editors" :class="{'active': selectedEditorIndex === i}" :key="e" @click="selectEditor(i)">
					<font-awesome-icon :icon="getEditorIcon(e.component)"></font-awesome-icon>
					{{ e.title }}
					<div v-if="e.component === 'codeEditor'" v-show="e.meta.live" class="liveCodingIndicator">
						LIVE
					</div>
				</li>
			</ul>
			
			<transition name="menuFade">
				<div v-show="!isMenuVisible" @click="toggleMenu(true)" id="userDetails">
					<span id="username">{{ user.name }}</span>
					<img v-show="!showDefaultAvatar" @load="showDefaultAvatar = false" :src="avatarLink" alt="avatar">
					<font-awesome-icon v-show="showDefaultAvatar" icon="user"></font-awesome-icon>
				</div>
			</transition>
			<transition name="menuFade">
				<ul v-show="isMenuVisible" id="menu">
					<li>
						<router-link to="/preferences">Einstellungen</router-link>
					</li>
					<li @click="clickLogout">Abmelden</li>
					<li>
						<font-awesome-icon icon="times" @click="toggleMenu(false)"></font-awesome-icon>
					</li>
				</ul>
			</transition>
		</div>
	</nav>
</template>

<script lang="ts">
	import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
	import { RESTCommand, SocketRestMethod } from '../socket'
	import { Conversation } from '../model/conversation'
	import { logout } from '../auth'
	import EditorType from '../editor'
	import { User } from '../model/user'
	import { MessageType } from '../model/message'
	import AdminPopup from './adminPopup.vue'

	@Component({
		components: {
			AdminPopup
		}
	})
	class NavBar extends Vue {
		@Prop() editors!: EditorType[]
		@Prop({default: 0}) selectedEditorIndex!: number
		
		isMenuVisible = false
		isConversationDetailsVisible = false
		avatarLink = ''
		showDefaultAvatar = true

		clickLogout() {
			this.$logout(false)
		}

		mounted() {
			if (this.user.id !== -1) {
				this.getAvatarLink(this.user.id)
			}
		}

		toggleConversationDetails(event: Event) {
			this.isConversationDetailsVisible = !this.isConversationDetailsVisible
		}

		hideConversationDetails(event: Event) {
			this.isConversationDetailsVisible = false
		}

		getEditorIcon(component: string) {
			switch (component) {
				case 'codeEditor': return 'code'
				default: return ''
			}
		}

		getAvatarLink(userid: number) {
			this.avatarLink = `/media/user/${userid}/avatar?nodefault=true`
		}

		@Watch('user')
		onUserChange(newVal: User, oldVal: User) {
			this.getAvatarLink(newVal.id)
		}

		get user(): User {
			return this.$store.state.chat.self
		}

		get numberOfUnreadMessages(): number {
            return this.$store.state.chat.conversations.reduce((pv: number, cv: Conversation) => pv + cv.numberOfUnreadMessages, 0)
		}

		get isAdmin(): boolean {
			return this.$store.getters.amIAdmin
		}

		get title(): string {
        	return this.$store.getters.selectedConversationTitle
		}

		selectEditor(editor: number) {
			this.$emit('editorSelected', editor)
		}
		
		clickOnBurgerMenu() {
			this.$emit('clickMenu')
		}

		toggleMenu(state: boolean) {
			this.isMenuVisible = state
		}
	}

    export default NavBar
</script>

<style scoped>
	nav {
		position: relative;
		padding: 0 30px;
		box-sizing: border-box;

		display: grid;
        grid-gap: 20px;
        grid-template-columns: 0.7fr 1.3fr;
        grid-template-rows: 1fr;
        grid-template-areas: "left right";
	}

	.popupTransition-enter-active, .popupTransition-leave-active {
		transition: opacity .3s, transform 0.3s;
	}
	.popupTransition-enter, .popupTransition-leave-to {
		opacity: 0;
		transform: translateY(-20px);
	}

	.detailsPopup {
		position: absolute;
		z-index: 100;
		box-shadow: 0 0 5px lightgray;
		top: 60px;
		left: 80px;
		width: 250px;
	}

	.detailsPopup ul {
		font-size: 15px;
	}

	.leftArea {
		grid-area: "left";
		height: 100%;
		display: flex;
		align-items: flex-start;
	}

	.rightArea {
		grid-area: "right";
		position: relative;
	}

	.titleWrapper {
		display: inline-block;
	}

	h1 {
		line-height: 70px;
		margin: 0;
		margin-right: 20px;
		cursor: pointer;
	}

	.adminIndicator {
		--indicatorColor: red;
		border: 2px solid var(--indicatorColor);
		color: var(--indicatorColor);
		display: inline-block;
		padding: 5px;
		border-radius: 6px;
		margin: auto 0;
	}

	.unreadIndicator {
		--size: 20px;
		background-color: red;
		color: white;
		position: absolute;
		bottom: -5px;
		border-radius: calc(var(--size) / 2);
		display: block;
		height: var(--size);
		width: var(--size);
		text-align: center;
		right: -5px;
		line-height: var(--size);
	}

	#userDetails svg {
		height: 30px;
		width: 30px;
		margin-left: 10px;
		vertical-align: middle;
	}

	#userDetails img {
		height: 44px;
		width: 44px;
		margin-left: 10px;
		vertical-align: middle;
		border-radius: 22px;
	}

	.burgerMenu {
		cursor: pointer;
		margin: auto 20px auto 0;
	}

	.burgerMenu svg {
		height: 35px;
		width: 35px;
	}

	.appear-enter-active, .appear-leave-active {
		transition: opacity .3s;
	}
	.appear-enter, .appear-leave-to {
		opacity: 0;
	}

	#username {
		line-height: 70px;
		font-size: 17px;
	}

	#userDetails {
		float: right;
		cursor: pointer;
	}

	#menu {
		transition: opacity 0.25s;
		list-style-type: none;
		padding: 0;
		margin: 0;
		position: absolute;
		right: 15px;
  		top: 50%;
  		transform: translateY(-50%);
	}

	.menuFade-enter-active, .menuFade-leave-active {
		transition: opacity .25s, transform .25s;
	}
	
	.menuFade-enter, .menuFade-leave-to {
		opacity: 0;
		transform: translateX(20px);
	}

	#menu li {
		display: inline-block;
		margin: 0 15px;
		font-size: 17px;
		cursor: pointer;
	}

	#menu li a {
		color: black;
		text-decoration: none;
	}

	.logoutButton {
		line-height: 70px;
		text-decoration: none;
		color: black;
	}

	.editorList {
		display: inline-block;
		margin: 0;
		list-style-type: none;
		padding: 0;
		position: absolute;
  		top: 50%;
  		transform: translateY(-50%);
	}

	.editorList > li {
		border-top: 2px solid white;
		background: linear-gradient(0deg, #f0f0f0da 0%, white 100%);
		border-radius: 6px;
		padding: 9px;
		box-shadow: 0 2px 2px rgba(0,0,0,0.3);
		cursor: pointer;
	}

	.liveCodingIndicator {
		display: inline;
		color: red;
		font-family: "arial narrow";
		font-weight: 600;
		margin-left: 3px;
	}

	.editorList > li.active {
		box-shadow: 0 2px 3px rgba(0,0,0,0.5);
	}

	@media (prefers-color-scheme: dark) {
		nav {
			color: white
		}

		.editorList > li {
			border-color: #a7a7a7;
			background: linear-gradient(to top, hsla(0, 0%, 18.97%, 0.85), #8d8d8d);
		}

		.adminIndicator {
			--indicatorColor: rgb(208, 55, 55);
		}

		.detailsPopup {
			box-shadow: 0 0 5px #181818;
		}

		#menu li a {
			color: white;
		}
	}
</style>