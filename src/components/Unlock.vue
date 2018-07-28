<template>
	<div>
		<!-- Busy Spinner -->
		<div v-if="busy" class="spinner">
			<spinner size="medium" :message='"Unlocking " + databaseFileName'></spinner>
		</div>

		<!-- Entry List -->
		<entry-list v-if="!busy && isUnlocked()" 
			:messages="unlockedMessages" 
			:unlocked-state="unlockedState"
			:settings="settings"></entry-list>

		<!-- General Messenger -->
		<messenger :messages="generalMessages" v-show="!busy"></messenger>

		<!-- Unlock input group -->
		<div id="masterPasswordGroup" v-if="!busy && !isUnlocked()">

			<div class="box-bar small selectable" @click="$router.route('/choose')">
				<span><b>{{ databaseFileName }}</b></span> <span class="right-align">change...</span>
			</div>

			<div class="unlockLogo stack-item">
				<img src="assets/icons/logo.png">
				<span>KeePass Tusk</span>
			</div>

			<form class="unlock-form" v-on:submit="clickUnlock">

				<div class="stack">
					<div class="stack-item masterPasswordInput">
						<input :type="isMasterPasswordInputVisible ? 'text' : 'password'" id="masterPassword" v-model="masterPassword" placeholder="Master password" ref="masterPassword" autocomplete="off">
						<i @click="isMasterPasswordInputVisible = !isMasterPasswordInputVisible" :class="['fa', isMasterPasswordInputVisible ? 'fa-eye-slash' : 'fa-eye', 'fa-fw']" aria-hidden="true"></i>
					</div>
					<div class="stack-item keyFile" v-if="(keyFiles.length)">
						<div id="select-keyfile" class="selectable" @click="selectedKeyFile = undefined; keyFilePicker = !keyFilePicker">
							<i class="fa fa-key" aria-hidden="true"></i> {{selectedKeyFileName}}
						</div>
						<div class="stack-item keyfile-picker" v-if="keyFilePicker">
							<transition name="keyfile-picker">
								<div>
									<span class="selectable" v-for="(kf, kf_index) in keyFiles" :keyfile-index="kf_index" @click="chooseKeyFile(kf_index)">
										<i class="fa fa-file fa-fw" aria-hidden="true"></i>
										{{ kf.name }}
									</span>
									<span @click="links.openOptionsKeyfiles" class="selectable"><i class="fa fa-wrench fa-fw" aria-hidden="true"></i> Manage Keyfiles</span>
								</div>
							</transition>
						</div>
					</div>
				</div>

				<div class="form-item keyfile-add-button">
					<span @click="links.openOptionsKeyfiles" class="muted-color right" v-if="(!keyFiles.length)">
						Add a keyfile...
					</span>
				</div>



				<div class="form-item box-bar small plain remember-period-picker center">
					<div class="col">
						<label for="rememberPeriodLength">
							<span>{{rememberPeriodText}}</span>
						</label>
					</div>
					<div class="col">
						<input id="rememberPeriodLength" type="range" min="0" :max="slider_options.length - 1" step="1" v-model="slider_int" v-on:input="setRememberPeriod(undefined)" />

					</div>
				</div>

				<div class="form-item stack-item center">
					<button class="action-button selectable" v-on:click="clickUnlock">Unlock</button>
				</div>
			</form>

		</div>

		<!-- Footer -->
		<div class="box-bar medium between footer" v-show="!busy">
			<span class="selectable" @click="links.openOptions">
        		<i class="fa fa-cog" aria-hidden="true"></i>
				Settings
			</span>
			<span class="selectable" v-if="isUnlocked()" @click="forgetPassword()">
        		<i class="fa fa-lock" aria-hidden="true"></i>
				Lock Database
			</span>
			<span class="selectable" v-else @click="closeWindow">
        		<i class="fa fa-times-circle" aria-hidden="true"></i>
				Close
			</span>
			<span class="selectable" @click="links.openHomepage">
				v{{ appVersion }}
			</span>
		</div>

	</div>
</template>

<script>
	import { parseUrl, getValidTokens } from '$lib/utils.js'

	import InfoCluster from '@/components/InfoCluster'
	import EntryList from '@/components/EntryList'
	import Spinner from 'vue-simple-spinner'
	import Messenger from '@/components/Messenger'

	export default {
		props: {
			/* Service dependeicies */
			unlockedState: Object,
			secureCache: Object,
			settings: Object,
			keepassService: Object,
			links: Object
		},
		components: {
			InfoCluster,
			EntryList,
			Spinner,
			Messenger
		},
		data() {
			return {
				/* UI state data */
				unlockedMessages: {
					warn: "",
					error: ""
				},
				generalMessages: {
					warn: "",
					error: "",
					success: ""
				},
				busy: false,
				masterPassword: "",
				isMasterPasswordInputVisible: false,
				keyFiles: [], // list of all available
				selectedKeyFile: undefined, // chosen keyfile object
				rememberPeriod: 0, // in minutes. default: do not remember
				rememberPeriodText: "",
				databaseFileName: "",
				keyFilePicker: false,
				appVersion: chrome.runtime.getManifest().version,
				slider_options: [{
						time: 0,
						text: "Do not remember"
					},
					{
						time: 30,
						text: "Remember for 30 min."
					},
					{
						time: 120,
						text: "Remember for 2 hours."
					},
					{
						time: 240,
						text: "Remember for 4 hours."
					},
					{
						time: 480,
						text: "Remember for 8 hours."
					},
					{
						time: 1440,
						text: "Remember for 24 hours."
					},
					{
						time: -1,
						text: "Until browser exits."
					}
				],
				slider_int: 0
			}
		},
		computed: {
			rememberPassword: function() {
				return this.rememberPeriod !== 0
			},
			selectedKeyFileName: function() {
				if (this.selectedKeyFile !== undefined)
					return this.selectedKeyFile.name
				return "Choose a keyfile..."
			}
		},
		watch: {
			unlockedMessages: {
				handler(newval) {
					this.unlockedState.cacheSet('unlockedMessages', newval)
				},
				deep: true
			}
		},
		methods: {
			setRememberPeriod(time_int) {
				/* Args: optional time_int
				 * if time_int is given, derive slider_int
				 * else assume slider_int is alread set.
				 */
				let slider_option_index;
				if (time_int !== undefined) {
					this.slider_int = (t => {
						for (let i = 0; i < this.slider_options.length; i++) {
							if (this.slider_options[i].time === t)
								return i;
						}
						return 0;
					})(time_int);
					slider_option_index = this.slider_int;
				} else {
					slider_option_index = parseInt(this.slider_int);
				}
				if (slider_option_index < this.slider_options.length) {
					this.rememberPeriod = this.slider_options[slider_option_index].time;
					this.rememberPeriodText = this.slider_options[slider_option_index].text;
				}
			},
			closeWindow(event) {
				window.close()
			},
			chooseKeyFile(index) {
				if (index !== undefined)
					if (index >= 0)
						this.selectedKeyFile = this.keyFiles[index]
				else
					this.selectedKeyFile = undefined
				this.keyFilePicker = false
			},
			chooseAnotherFile() {
				this.unlockedState.clearBackgroundState()
				this.secureCache.clear('secureCache.entries')
				this.$router.route('/choose')
			},
			isUnlocked: function() {
				return this.unlockedState.cache.allEntries !== undefined
			},
			forgetPassword() {
				this.settings.getCurrentMasterPasswordCacheKey().then(key => {
					if (key !== null)
						this.secureCache.clear(key)
				})
				this.secureCache.clear('secureCache.entries')
				this.unlockedState.clearClipboardState()
				this.unlockedState.clearCache() // new
			},
			showResults(entries) {
				let getMatchesForThreshold = (threshold, entries, requireEmptyURL=false) => {
					return entries.filter(e => (e.matchRank >= threshold) && (requireEmptyURL ? !e.URL : true));
				}
				this.settings.getSetStrictModeEnabled().then(strictMode => {
					let siteUrl = parseUrl(this.unlockedState.url)
					let title = this.unlockedState.title
					let siteTokens = getValidTokens(siteUrl.hostname + '.' + this.unlockedState.title)
					this.keepassService.rankEntries(entries, siteUrl, title, siteTokens) // in-place

					let allEntries = entries
					let priorityEntries = getMatchesForThreshold(100, entries)
					
					if (priorityEntries.length == 0) {
						priorityEntries = getMatchesForThreshold(10, entries)

						// in strict mode, good matches are considered partial matches.
						if (strictMode && priorityEntries.length) {
							this.unlockedMessages['warn'] = "No perfect origin matches, showing " + priorityEntries.length + " partial matches.";
						}
					}
					if (!strictMode && priorityEntries.length == 0) {
						priorityEntries = getMatchesForThreshold(0.8, entries, true)
					}
					if (!strictMode && priorityEntries.length == 0) {
						priorityEntries = getMatchesForThreshold(0.4, entries)

						if (priorityEntries.length) {
							this.unlockedMessages['warn'] = "No close matches, showing " + priorityEntries.length + " partial matches.";
						}
					}
					if (priorityEntries.length == 0) {
						this.unlockedMessages['error'] = "No matches found for this site."
					}

					// Cache in memory
					this.unlockedState.cacheSet('allEntries', allEntries)
					this.unlockedState.cacheSet('priorityEntries', priorityEntries)
					this.$forceUpdate()
					//save longer term (in encrypted storage)
					this.secureCache.save('secureCache.entries', entries);
					this.busy = false
				})
			},
			clickUnlock(event) {
				event.preventDefault()
				this.unlock()
			},
			unlock(passwordKey) {
				this.busy = true
				this.generalMessages.error = ""
				let passwordKeyPromise;
				let bufferPromise = this.keepassService.getChosenDatabaseFile()
				if (passwordKey === undefined)
					passwordKeyPromise = this.keepassService.getMasterKey(bufferPromise, this.masterPassword, this.selectedKeyFile)
				else
					passwordKeyPromise = Promise.resolve(passwordKey)

				let keyFileName = (this.selectedKeyFile !== undefined) ?
					this.selectedKeyFile.name :
					undefined
				passwordKeyPromise.then(passwordKey => {
					this.keepassService.getDecryptedData(bufferPromise, passwordKey).then(decryptedData => {
						let entries = decryptedData.entries
						let version = decryptedData.version
						let dbUsage = {
							requiresPassword: passwordKey.passwordHash === null ? false : true,
							requiresKeyfile: passwordKey.keyFileHash === null ? false : true,
							passwordKey: undefined,
							version: version,
							keyFileName: keyFileName,
							rememberPeriod: this.rememberPeriod
						}
						if (this.rememberPeriod !== 0) {
							let check_time = 60000 * this.rememberPeriod // milliseconds / min
							// Save the password in memory independently.
							this.settings.cacheMasterPassword(passwordKey, {
								forgetTime: check_time > 0 ? Date.now() + check_time : check_time
							})
						} else {
							this.settings.getCurrentMasterPasswordCacheKey()
								.then(this.secureCache.clear)
						}
						this.settings.saveCurrentDatabaseUsage(dbUsage)
						this.settings.getSetDefaultRememberPeriod(this.rememberPeriod)
						this.showResults(entries)
						this.busy = false
						this.masterPassword = ""
					}).catch(err => {
						let errmsg = err.message || "Incorrect password or keyfile"
						console.error(errmsg)
						this.generalMessages['error'] = errmsg
						this.busy = false
					})
				}).catch(err => {
					this.settings.handleProviderError(err)
					let errmsg = err.message || "Incorrect password or keyfile"
					console.error(errmsg)
					this.generalMessages['error'] = errmsg
					this.busy = false
				})
			}
		},
		mounted() {
			if (!this.isUnlocked()) {

				let try_autounlock = () => {
					this.busy = true
					this.settings.getKeyFiles().then(keyFiles => {
						this.keyFiles = keyFiles
						return this.settings.getSetDefaultRememberPeriod()
					}).then(rememberPeriod => {
						this.setRememberPeriod(rememberPeriod)
						return this.settings.getCurrentDatabaseUsage()
					}).then(usage => {
						// tweak UI based on what we know about the db file
						this.hidePassword = (usage.requiresPassword === false)
						this.hideKeyFile = (usage.requiresKeyfile === false)
						this.rememberedPassword = (usage.passwordKey !== undefined)
						this.setRememberPeriod(usage.rememberPeriod)

						if (usage.passwordKey !== undefined && usage.requiresKeyfile === false) {
							this.unlock(usage.passwordKey) // Autologin if no keyfile
						} else if (usage.keyFileName !== undefined) {
							let matches = this.keyFiles.filter(kf => {
								return kf.name === usage.keyFileName
							})
							if (matches.length > 0) {
								this.selectedKeyFile = matches[0]
								if (this.hidePassword === true || usage.passwordKey !== undefined)
									this.unlock(usage.passwordKey)
							}
						}
					})
				}

				let focus = () => {
					this.$nextTick(nil => {
						let mp = this.$refs.masterPassword;
						if (mp !== undefined)
							mp.focus()
					})
				}

				this.busy = true
				this.secureCache.get('secureCache.entries').then(entries => {
					if (entries !== undefined && entries.length > 0) {
						this.showResults(entries)
					} else {
						try_autounlock()
					}
				}).catch(err => {
					//this is fine - it just means the cache expired.  Clear the cache to be sure.
					this.secureCache.clear('secureCache.entries')
					try_autounlock()
				}).then(nil => {
					// state settled
					this.busy = false
					focus()
				})
			}

			// modify unlockedState internal state
			this.unlockedState.getTabDetails().then(nil => {
				if (this.unlockedState.sitePermission){
					this.generalMessages.success = "You have previously granted Tusk permission to fill passwords on " + this.unlockedState.origin
				}
				else
					this.generalMessages.warn = "This site is not yet known to Tusk."
			})
			//set knowlege from the URL
			this.databaseFileName = decodeURIComponent(this.$router.getRoute().title)
		}
	}
</script>

<style lang="scss">
	@import "../styles/settings.scss";
	#masterPasswordGroup {
		.unlock-form {
			padding: 0 40px;
			& > .form-item {
				margin-bottom: 10px
			}
		}
		.stack {
			border: 1px solid $light-gray;
			font-size: 18px;
		}
		.action-button {
			padding: 4px 30px;
			width: initial
		}
		.keyfile-add-button {
			height: 10px;
			> span {
				cursor: pointer
			}
		}
		.keyFile {
			font-size: 14px
		}
		.keyfile-picker {
			transition: all .1s linear;
			max-height: 200px;
			overflow-y: auto;
			opacity: 1;
			padding: 5px $wall-padding;
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
			i {
				font-size: 14px;
			}
			&:hover {
				opacity: .7;
			}
		}
		#rememberPeriodLength {
			width: 80px;
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
		input[type=text], input[type=password] {
			width: 100%;
			box-sizing: border-box;
			border-width: 0px 0px;
			padding: 5px $wall-padding;
			&:focus {
				outline: none;
			}
		}
		.remember-period-picker {
			&:after {
				display:table;
				content:" ";
				clear:both
			}
			.col {
				display: inline-block;
				padding: 0 5px;
				width: 50%;
				float: left
			}
			input[type=range] {
				-webkit-appearance: none;
			}
		}
		input[type=range]:focus {
			outline: none;
		}
		input[type=range]::-webkit-slider-runnable-track {
			height: 6px;
			cursor: pointer;
			animate: 0.2s;
			background: $blue;
			border-radius: 1.3px;
			border: 0.2px solid #010101;
			margin-top: -2px;
		}
		input[type=range]::-webkit-slider-thumb {
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
</style>