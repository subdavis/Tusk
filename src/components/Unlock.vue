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
import { parseUrl, getValidTokens } from '$lib/utils.js'
import InfoCluster from '@/components/InfoCluster'
import EntryList from '@/components/EntryList'
import Spinner from 'vue-simple-spinner'
import Messenger from '@/components/Messenger'

export default {
	props: {
		/* Service dependeicies */
		// unlockedState: Object,
		// secureCache: Object,
		settings: Object,
		keepassService: Object,
		links: Object
	},
	components: {
		InfoCluster,
		EntryList,
		Spinner,
		Messenger,
	},
	data() {
		return {
			keyFilePicker: false,
			appVersion: chrome.runtime.getManifest().version,
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
			isUnlocked: (state) => !state.database.locked,
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
			lock: LOCK,
			unlock: UNLOCK,
		}),
		...mapMutations({
			setKeyFileName: ACTIVE_KEY_FILE_NAME_SET,
			setDatabaseFileName: DATABASE_FILE_NAME_SET,
			setRememberPeriod: REMEMBER_PERIOD_SET,
			setMasterPassword: MASTER_PASSWORD_SET,
		}),
		closeWindow(event) {
			window.close()
		},
		chooseKeyFile(index) {
			if (index >= 0)
				this.setKeyFileName({ keyFileName: this.settings.keyFiles[index].name });
			else
				this.setKeyFileName({ keyFileName: null});
			this.keyFilePicker = false
		},
		// showResults(entries) {
		// 	let getMatchesForThreshold = (threshold, entries, requireEmptyURL = false) => {
		// 		return entries.filter(e => (e.matchRank >= threshold) && (requireEmptyURL ? !e.URL : true));
		// 	}
		// 	this.settings.getSetStrictModeEnabled().then(strictMode => {
		// 		let siteUrl = parseUrl(this.unlockedState.url)
		// 		let title = this.unlockedState.title
		// 		let siteTokens = getValidTokens(siteUrl.hostname + '.' + this.unlockedState.title)
		// 		this.keepassService.rankEntries(entries, siteUrl, title, siteTokens) // in-place

		// 		let allEntries = entries
		// 		let priorityEntries = getMatchesForThreshold(100, entries)

		// 		if (priorityEntries.length == 0) {
		// 			priorityEntries = getMatchesForThreshold(10, entries)

		// 			// in strict mode, good matches are considered partial matches.
		// 			if (strictMode && priorityEntries.length) {
		// 				this.unlockedMessages['warn'] = "No perfect origin matches, showing " + priorityEntries.length + " partial matches.";
		// 			}
		// 		}
		// 		if (!strictMode && priorityEntries.length == 0) {
		// 			priorityEntries = getMatchesForThreshold(0.8, entries, true)
		// 		}
		// 		if (!strictMode && priorityEntries.length == 0) {
		// 			priorityEntries = getMatchesForThreshold(0.4, entries)

		// 			if (priorityEntries.length) {
		// 				this.unlockedMessages.warn = "No close matches, showing " + priorityEntries.length + " partial matches.";
		// 			}
		// 		}
		// 		if (priorityEntries.length == 0) {
		// 			this.unlockedMessages.warn = "No matches found for this site."
		// 		}

		// 		// Cache in memory
		// 		this.unlockedState.cacheSet('allEntries', allEntries)
		// 		this.unlockedState.cacheSet('priorityEntries', priorityEntries)
		// 		this.$forceUpdate()
		// 		//save longer term (in encrypted storage)
		// 		this.secureCache.save('secureCache.entries', entries);
		// 		this.busy = false
		// 	})
		// },
		clickUnlock(event) {
			event.preventDefault() // should be handled with vue directive
			this.unlock()
		},
	},
	async mounted() {
		// modify unlockedState internal state
		// await this.unlockedState.getTabDetails();

		// if (!this.isUnlocked()) {

			// let try_autounlock = () => {
			// 	this.busy = true
			// 	this.settings.getKeyFiles().then(keyFiles => {
			// 		this.keyFiles = keyFiles
			// 		return this.settings.getSetDefaultRememberPeriod()
			// 	}).then(rememberPeriod => {
			// 		this.setRememberPeriod(rememberPeriod)
			// 		return this.settings.getCurrentDatabaseUsage()
			// 	}).then(usage => {
			// 		// tweak UI based on what we know about the db file
			// 		this.hidePassword = (usage.requiresPassword === false)
			// 		this.hideKeyFile = (usage.requiresKeyfile === false)
			// 		this.rememberedPassword = (usage.passwordKey !== undefined)
			// 		this.setRememberPeriod(usage.rememberPeriod)

			// 		if (usage.passwordKey !== undefined && usage.requiresKeyfile === false) {
			// 			this.unlock(usage.passwordKey) // Autologin if no keyfile
			// 		} else if (usage.keyFileName !== undefined) {
			// 			let matches = this.keyFiles.filter(kf => {
			// 				return kf.name === usage.keyFileName
			// 			})
			// 			if (matches.length > 0) {
			// 				this.selectedKeyFile = matches[0]
			// 				if (this.hidePassword === true || usage.passwordKey !== undefined)
			// 					this.unlock(usage.passwordKey)
			// 			}
			// 		}
			// 	})
			// }

			// try {
			// 	let entries = await this.secureCache.get('secureCache.entries');
			// 	if (entries !== undefined && entries.length > 0) {
			// 		this.showResults(entries)
			// 	} else {
			// 		try_autounlock()
			// 	}
			// } catch (err) {
			// 	console.error(err);
			// 	//this is fine - it just means the cache expired.  Clear the cache to be sure.
			// 	this.secureCache.clear('secureCache.entries')
			// 	try_autounlock()

			// }
			// this.busy = false
		// }

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
div
	//- <!-- Busy Spinner -->
	.spinner(v-if="busy")
		spinner(size="medium", :message='"Unlocking " + databaseFileName')
	//- <!-- Entry List -->
	//- <!-- <entry-list v-if="!busy && isUnlocked()"
	//- :messages="unlockedMessages"
	//- :unlocked-state="unlockedState"
	//- :settings="settings"></entry-list> -->

	//- <!-- General Messenger -->
	messenger(v-show="!busy", :messages="ui.messages.general" )

	//- <!-- Unlock input group -->
	#masterPasswordGroup(v-if="!busy && !isUnlocked")
		
		.stack-item.unlockLogo
			img(src="assets/icons/exported/128x128.svg")
			span KeePass Tusk

		form(@submit="clickUnlock")
			.small.selectable.databaseChoose(@click="$router.route('/choose')")
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
					|  {{ active.keyFileName || 'No Key File Selected (choose)' }}

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
						span {{rememberPeriodText}} (slide to choose)
				input#rememberPeriodLength(
						type="range",
						min="0",
						:max="rememberPeriodOptions.length - 1",
						step="1" v-model="slider_int",
						@input="setRememberPeriod(undefined)")

			.stack-item
				button.action-button.selectable(@click="clickUnlock") Unlock Database

	//- <!-- Footer -->
	.box-bar.medium.between.footer(v-show="!busy")
		span.selectable(@click="links.openOptions")
			i.fa.fa-cog(aria-hidden="true")
			|  Settings
		span.selectable(v-if="isUnlocked", @click="forgetPassword()")
			i.fa.fa-lock(aria-hidden="true")
			|  Lock Database
		span.selectable(v-else, @click="closeWindow")
			i.fa.fa-times-circle(aria-hidden="true")
			|  Close Window
		span.selectable(@click="links.openHomepage")
			i.fa.fa-info-circle(aria-hidden="true")
			|  v{{ appVersion }}

</template>

<style lang="scss">
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

.footer span {
  padding: 2px 4px;
  border-radius: 3px;
  &:hover {
    background-color: $dark-background-color;
  }
}

.databaseChoose {
  padding-left: 5px;
}
</style>