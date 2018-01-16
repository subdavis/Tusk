<template>
	<div>
		<!-- Busy Spinner -->
		<div v-if="busy" class="spinner">
			<spinner size="medium" :message='"Unlocking " + databaseFileName'></spinner>
		</div>

		<!-- Entry List -->
		<entry-list v-if="!busy && isUnlocked()" :messages="unlockedMessages" :unlocked-state="unlockedState"></entry-list>

		<!-- General Messenger -->
		<messenger :messages="generalMessages" v-show="!busy"></messenger>

		<!-- Unlock input group -->
		<div id="masterPasswordGroup" v-if="!busy && !isUnlocked()">

			<div class="box-bar small selectable" @click="$router.route('/choose')">
				<span><b>{{ databaseFileName }}</b> ( click to change <i class="fa fa-database" aria-hidden="true"></i> )</span>
			</div>

			<div class="unlockLogo stack-item">
				<img src="../assets/logo.png">
				<span>KeePass Tusk</span>
			</div>

			<form v-on:submit="clickUnlock">

				<div class="stack-item">
					<input type="password" id="masterPassword" v-model="masterPassword" placeholder="🔒 master password" ref="masterPassword">
				</div>

				<div class="stack-item">
					<div id="select-keyfile" class="selectable" @click="selectedKeyFile = undefined; keyFilePicker = !keyFilePicker">
						<i class="fa fa-key" aria-hidden="true"></i> {{selectedKeyFileName}}
					</div>
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

				<div class="box-bar small plain remember-period-picker">
					<span>
            <label for="rememberPeriodLength">
              <span>{{rememberPeriodText}} (slide to choose)</span></label>
					<input id="rememberPeriodLength" type="range" min="0" :max="slider_options.length - 1" step="1" v-model="slider_int" v-on:input="setRememberPeriod(undefined)" />
					</span>
				</div>

				<div class="stack-item">
					<button class="action-button selectable" v-on:click="clickUnlock">Unlock Database</button>
				</div>
			</form>

		</div>

		<!-- Footer -->
		<div class="box-bar medium between footer" v-show="!busy">
			<span class="selectable" @click="links.openOptions">
        <i class="fa fa-cog" aria-hidden="true"></i> Settings</span>
			<span class="selectable" v-if="isUnlocked()" @click="forgetPassword()">
        <i class="fa fa-lock" aria-hidden="true" ></i> Lock Database</span>
			<span class="selectable" v-else @click="closeWindow">
        <i class="fa fa-times-circle" aria-hidden="true"></i> Close Window</span>
			<span class="selectable" @click="links.openHomepage">
        <i class="fa fa-info-circle" aria-hidden="true"></i> v{{ appVersion }}</span>
		</div>

	</div>
</template>

<script>
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
						text: "Until Chrome exits."
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
				return "No keyfile selected.  (click to change)"
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
				this.settings.getCurrentDatabaseChoice().then(info => {
					var passwordCacheKey = info.passwordFile.title + "__" + info.providerKey + ".password";
					this.secureCache.clear(passwordCacheKey)
				}).catch(err => {
					// Error, wipe everything.
					this.secureCache.clear()
				})
				this.secureCache.clear('secureCache.entries')
				this.unlockedState.clearClipboardState()
				this.unlockedState.clearCache() // new
			},
			showResults(entries) {

				let getValidTokens = tokenString => {
					if (!tokenString)
						return []
					else
						return tokenString.toLowerCase().split(/\.|\s|\//).filter(t => {
							return (t && t !== "com" && t !== "www" && t.length > 1)
						})
				} // end getValidTokens

				let parseUrl = url => {
					if (url && !url.indexOf('http') == 0)
						url = 'http://' + url
					//from https://gist.github.com/jlong/2428561
					var parser = document.createElement('a')
					parser.href = url
					return parser
				} // end parseUrl

				let rankEntries = (entries, siteUrl, title, siteTokens) => {
					entries.forEach(function(entry) {
						//apply a ranking algorithm to find the best matches
						var entryHostName = parseUrl(entry.url).hostname || ""

						if (entryHostName && entryHostName == siteUrl.hostname)
							entry.matchRank = 100 //exact url match
						else
							entry.matchRank = 0

						entry.matchRank += (entry.title && title && entry.title.toLowerCase() == title.toLowerCase()) ? 1 : 0
						entry.matchRank += (entry.title && entry.title.toLowerCase() === siteUrl.hostname.toLowerCase()) ? 1 : 0
						entry.matchRank += (entry.url && siteUrl.hostname.indexOf(entry.url.toLowerCase()) > -1) ? 0.9 : 0
						entry.matchRank += (entry.title && siteUrl.hostname.indexOf(entry.title.toLowerCase()) > -1) ? 0.9 : 0

						var entryTokens = getValidTokens(entryHostName + "." + entry.title);
						for (var i = 0; i < entryTokens.length; i++) {
							var token1 = entryTokens[i]
							for (var j = 0; j < siteTokens.length; j++) {
								var token2 = siteTokens[j]

								entry.matchRank += (token1 === token2) ? 0.2 : 0;
							}
						}
					})
				} // end rankEntries

				let siteUrl = parseUrl(this.unlockedState.url)
				let title = this.unlockedState.title
				let siteTokens = getValidTokens(siteUrl.hostname + '.' + this.unlockedState.title)
				rankEntries(entries, siteUrl, title, siteTokens) // in-place

				let allEntries = entries
				let priorityEntries = entries

				//save short term (in-memory) filtered results
				priorityEntries = entries.filter(function(entry) {
					return (entry.matchRank >= 100)
				});
				if (priorityEntries.length == 0) {
					priorityEntries = entries.filter(function(entry) {
						return (entry.matchRank > 0.8 && !entry.URL); //a good match for an entry without a url
					});
				}
				if (priorityEntries.length == 0) {
					priorityEntries = entries.filter(function(entry) {
						return (entry.matchRank >= 0.4);
					});

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
			},
			clickUnlock(event) {
				event.preventDefault()
				this.unlock()
			},
			unlock(passwordKey) {
				this.busy = true
				this.generalMessages.error = ""
				let passwordKeyPromise;
				if (passwordKey === undefined)
					passwordKeyPromise = this.keepassService.getMasterKey(this.masterPassword, this.selectedKeyFile)
				else
					passwordKeyPromise = Promise.resolve(passwordKey)

				let keyFileName = (this.selectedKeyFile !== undefined) ?
					this.selectedKeyFile.name :
					undefined
				passwordKeyPromise.then(passwordKey => {
					this.keepassService.getDecryptedData(passwordKey).then(decryptedData => {
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
								forgetTime: Date.now() + check_time 
							})
						} else {
							// this.settings.clearForgetTimes(['forgetPassword'])
						}
						this.settings.saveCurrentDatabaseUsage(dbUsage)
						this.settings.saveDefaultRememberOptions(this.rememberPeriod)
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
						return this.settings.getDefaultRememberOptions()
					}).then(rememberOptions => {
						this.setRememberPeriod(rememberOptions.rememberPeriod)
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
					this.generalMessages.warn = "This may be a new site to Tusk. Before filling in a password, double check that this is the correct site."
			})
			//set knowlege from the URL
			this.databaseFileName = decodeURIComponent(this.$router.getRoute().title)
		}
	}
</script>

<style lang="scss">
	@import "../styles/settings.scss";
	#masterPasswordGroup {
		.keyfile-picker {
			background-color: $light-background-color;
			box-sizing: border-box;
			transition: all .2s linear;
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
				opacity: .7;
			}
		}
		#rememberPeriodLength {
			width: 80px;
			float: left;
		}
		input[type=password] {
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
			input[type=range] {
				-webkit-appearance: none;
				margin: 6px;
				margin-left: 0px;
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