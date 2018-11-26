<script>
import { mapState, mapMutations, mapActions } from 'vuex'
import { 
	REMEMBER_PERIOD_SET,
	MASTER_PASSWORD_SET,
	ACTIVE_KEY_FILE_NAME_SET,
	DATABASE_FILE_NAME_SET,
	LOCK,
	UNLOCK,
	rememberPeriodOptions,
} from '@/store/modules/database'
import { MESSAGES_GENERAL_SET } from '@/store/modules/ui'
import { parseUrl, getValidTokens } from '$lib/utils.js'
import InfoCluster from '@/components/InfoCluster'
import EntryList from '@/components/EntryList'
import Spinner from 'vue-simple-spinner'
import Messenger from '@/components/Messenger'
import TuskFooter from '@/components/Footer'
export default {
	props: {
		links: {
			type: Object,
			required: true,
		},
	},
	components: {
		InfoCluster,
		EntryList,
		Spinner,
		Messenger,
		TuskFooter,
	},
	data() {
		return {
			keyFilePicker: false,
			slider_int: 0,
			isMasterPasswordInputVisible: false,
			rememberPeriodOptions,
		}
	},
	computed: {
		...mapState({
			settings: 'settings',
			database: 'database',
			ui: 'ui',
			busy: (state) => state.database.busy,
			active: (state) => state.database.active,
			keyFiles: (state) => state.settings.keyFiles,
		}),
		masterPassword: {
			get () {
				return this.database.masterPassword;
			},
			set (val) {
				this.setMasterPassword({ masterPassword: val })
			},
		},
		rememberPassword: function () {
			return this.database.rememberPeriod.time;
		},
		selectedKeyFileName: function () {
			const keyFile = this.database.active.keyFile;
			if (keyFile){
				return keyFile.name;
			}
			return "No keyfile selected.  (click to change)";
		},
	},
	watch: {
		// TODO: Set slider_int based on hydrated value of rememberPeriod
		slider_int(newVal) {
			const rememberPeriod = rememberPeriodOptions[newVal];
			this.setRememberPeriod(rememberPeriod);
		}
	},
	methods: {
		...mapActions({
			unlock: UNLOCK,
		}),
		...mapMutations({
			setKeyFileName: ACTIVE_KEY_FILE_NAME_SET,
			setDatabaseFileName: DATABASE_FILE_NAME_SET,
			setRememberPeriod: REMEMBER_PERIOD_SET,
			setMasterPassword: MASTER_PASSWORD_SET,
			setGeneralMessages: MESSAGES_GENERAL_SET,
		}),
		chooseKeyFile(index) {
			if (index >= 0)
				this.setKeyFileName({ keyFileName: this.settings.keyFiles[index].name });
			else
				this.setKeyFileName({ keyFileName: null});
			this.keyFilePicker = false
		},
		async clickUnlock(event) {
			try {
				await this.unlock()
				this.$router.push({ path: '/entry-list' })
			} catch (err) {
				this.setGeneralMessages({ error: err.message })
				throw err;
			}
		},
	},
	async mounted() {

		let focus = () => {
			this.$nextTick(() => {
				let mp = this.$refs.masterPassword;
				if (mp !== undefined)
					mp.focus()
			});
		}
		focus();

		// if (this.unlockedState.sitePermission) {
		// 	this.generalMessages.success = "You have previously granted Tusk permission to fill passwords on " + this.unlockedState.origin
		// } else {
		// 	this.generalMessages.warn = "This may be a new site to Tusk. Before filling in a password, double check that this is the correct site."
		// }
		//set knowlege from the URL
		// this.databaseFileName = decodeURIComponent(this.$router.getRoute().title)
		// this.setDatabaseFileName({ databaseFileName: this.$router.getRoute().title })
	}
}
</script>

<template lang="pug">
#unlock-view
	
	.spinner(v-if="busy")
		spinner(size="medium", :message='"Unlocking " + databaseFileName')

	messenger(v-show="!busy", :messages="ui.messages.general")

	#masterPasswordGroup(v-if="!busy")

		.stack-item.unlockLogo
			img(src="assets/icons/exported/128x128.svg")
			span KeePass Tusk

		form
			.small.selectable.databaseChoose(@click="$router.push({ path: '/choose' })")
				i.fa.fa-database(aria-hidden="true")
				|  
				b {{ active.databaseFileName }}
				|  
				span.muted-color change...

			.stack-item.masterPasswordInput
				input#masterPassword(
						:type="isMasterPasswordInputVisible ? 'text' : 'password'",
						v-model="masterPassword",
						placeholder="🔒 master password",
						ref="masterPassword",
						autocomplete="off")
				i(@click="isMasterPasswordInputVisible = !isMasterPasswordInputVisible",
						:class="['fa', isMasterPasswordInputVisible ? 'fa-eye-slash' : 'fa-eye', 'fa-fw']",
						aria-hidden="true")

			.stack-item
				#select-keyfile.selectable(@click="setKeyFileName({ keyFileName: null }); keyFilePicker = !keyFilePicker")
					i.fa.fa-key(aria-hidden="true")
					|  {{ active.keyFileName || (keyFilePicker ? 'Do Not Use Key File' : 'No Key File Selected (click to choose)') }}

			.stack-item.keyfile-picker(v-if="keyFilePicker")
				transition(name="keyfile-picker")
					div
						span.selectable(
								v-for="(keyFile, kf_index) in keyFiles",
								:keyfile-index="kf_index",
								:key="`${kf_index}-select`",
								@click="chooseKeyFile(keyFile)")
							i.fa.fa-file.fa-fw(aria-hidden="true") 
							|  {{ keyFile.name }}

						span.selectable(@click="links.openOptionsKeyfiles")
							i.fa.fa-wrench.fa-fw(aria-hidden="true")
							| Manage Keyfiles

			.box-bar.small.plain.remember-period-picker
				span
					label(for="rememberPeriodLength")
						span {{ database.rememberPeriod.text }} (slide)
				input#rememberPeriodLength(
						type="range",
						min="0",
						:max="rememberPeriodOptions.length - 1",
						step="1" v-model="slider_int")

			.stack-item
				button.action-button.selectable(@click.prevent="clickUnlock") Unlock Database	
	tusk-footer
</template>

<style lang="scss" scoped>
@import "../styles/settings.scss";
#masterPasswordGroup {
  .keyfile-picker {
    background-color: $light-background-color;
    box-sizing: border-box;
    transition: all 0.2s linear;
    max-height: 200px;
    overflow-y: auto;
    opacity: 1;
    border-top: 1px solid $light-gray;
    border-bottom: 1px solid $light-gray;
    padding: 5px $wall-padding;
    margin: 5px 0px;
    &.keyfile-picker-enter,
    &.keyfile-picker-leave-to {
      max-height: 0px;
      opacity: 0;
    }
    span {
      display: block;
      padding: 2px 0px;
      &:hover {
        padding-left: 3px;
      }
    }
  }
  #select-keyfile {
    padding: 8px $wall-padding;
    background-color: $light-background-color;
    border-bottom: 1px solid $light-gray;
    i {
      font-size: 14px;
    }
    &:hover {
      opacity: 0.7;
    }
  }
  #rememberPeriodLength {
    width: 80px;
    float: left;
  }
  .masterPasswordInput {
    position: relative;
    i {
      position: absolute;
      font-size: 14px;
      top: calc(50% - 0.5em);
      right: 10px;
      cursor: pointer;
    }
  }
  input[type="text"],
  input[type="password"] {
    width: 100%;
    box-sizing: border-box;
    font-size: 18px;
    border-width: 0px 0px;
    padding: 5px $wall-padding;
    border-top: 1px solid $light-gray;
    &:focus {
      outline: none;
    }
  }
  .remember-period-picker {
    margin: 6px 0px;
    input[type="range"] {
      -webkit-appearance: none;
      margin: 6px;
      margin-left: 0px;
    }
  }
  input[type="range"]:focus {
    outline: none;
  }
  input[type="range"]::-webkit-slider-runnable-track {
    height: 6px;
    cursor: pointer;
    animate: 0.2s;
    background: $blue;
    border-radius: 1.3px;
    border: 0.2px solid #010101;
    margin-top: -2px;
  }
  input[type="range"]::-webkit-slider-thumb {
    border: 1px solid black;
    height: 18px;
    width: 10px;
    border-radius: 2px;
    background: white;
    cursor: pointer;
    -webkit-appearance: none;
    margin-top: -7px;
  }
}

.spinner {
  padding: $wall-padding;
}

.databaseChoose {
  padding-left: 5px;
}
</style>