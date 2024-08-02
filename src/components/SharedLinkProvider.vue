<!-- 
	SharedLinkProvider:
	Simple http provider that can also handle Dropbox Shared Links
-->
<script>
import { ChromePromiseApi } from '@/lib/chrome-api-promise.js'
import { parseUrl } from '@/lib/utils.js'
import GenericProviderUi from '@/components/GenericProviderUi.vue'
const chromePromise = ChromePromiseApi()

export default {
	data() {
		return {
			busy: false,
			currentUrl: "",
			currentUrlTitle: "",
			links: [],
			loggedIn: false,
			messages: {
				error: ""
			}
		}
	},
	components: {
		GenericProviderUi
	},
	props: {
		providerManager: Object,
		settings: Object
	},
	methods: {
		toggleLogin() {
			if (this.loggedIn) {
				this.settings.disableDatabaseProvider(this.providerManager)
				this.providerManager.logout().then(() => {
					this.loggedIn = false
				})
			} else {
				this.providerManager.login().then(() => {
					this.loggedIn = true
				})
			}
		},
		updateLinks() {
			return this.providerManager.getUrls().then(links => {
				this.links = links
			})
		},
		removeLink(index) {
			if (index !== undefined && index >= 0) {
				this.providerManager.removeUrl(this.links[index])
					.then(() => this.updateLinks())
			}
		},
		addLink() {
			if (!this.currentUrl || !this.currentUrlTitle) {
				this.messages.error = "Link or Title Missing";
				return;
			}

			let parsed = parseUrl(this.currentUrl);
			if (!parsed.host || parsed.host === window.location.host) {
				this.messages.error = "Link URL is not valid."
				return;
			}
			if (parsed.pathname.charAt(parsed.pathname.length - 1) === "/") {
				this.messages.error = "URL must include file path. (eg. http://example.com is invalid, but http://example.com/file.ckp is valid.)"
				return;
			}

			let direct_link;
			if (parsed.host === "drive.google.com") {
				// Expected URL Structure is https://drive.google.com/file/d/FILE_ID/view?usp=sharing
				let id = parsed.pathname.split("/")[3];
				if (!id || !parsed.pathname.startsWith("/file/d/")) {
					this.messages.error = "Invalid Google Drive Shared Link. Expected format: https://drive.google.com/file/d/FILE_ID";
					return;
				}
				// direct_link = "https://drive.google.com/uc?export=download&id=" + id;
				this.messages.error = "Google Drive Shared Links are no longer supported. Please use the Google Drive provider."
				return;
			} else if (parsed.host.endsWith(".dropbox.com")) {
				direct_link = parsed.href.replace("dl=0", "dl=1");
			}	else {
				direct_link = parsed.href;
			}

			// go ahead and request permissions.  There isn't a good way to ask from the popup screen...
			this.messages.error = "";
			this.busy = true;
			chromePromise.permissions
				.request({
					origins: [direct_link] //FLAGHERE TODO
				})
				.then(() => this.providerManager.addUrl({
					direct_link: direct_link,
					title: this.currentUrlTitle
				}))
				.then(() => this.updateLinks())
				.then(() => {
					// on accepted
					this.busy = false;
				})
				.catch(reason => {
					// on rejected
					this.busy = false;
					this.messages.error = reason.message;
				});
		},
	},
	mounted() {
		this.providerManager.isLoggedIn().then(loggedIn => {
			this.loggedIn = loggedIn
		})
		this.updateLinks();
	}
}
</script>

<template>
	<div class="box-bar roomy database-manager">
		<generic-provider-ui :busy="busy" :databases="links" :loggedIn="loggedIn" :error="messages.error" :provider-manager="providerManager" :toggle-login="toggleLogin" :removeable="true" :remove-function="removeLink"></generic-provider-ui>
		<ul class="examples">
			<li><b>Dropbox URL Example</b> https://www.dropbox.com/scl/fi/FILE_ID/filename.kdbx?rlkey=&st=&dl=1</li>
			<li><b>Google Drive and OneDrive</b> shared links no longer work</li>
			<li>Other clould provider shared links will likely not work, but direct HTTP file links will.</li>
		</ul>
		<div class="url-form shared-link-box" v-if="loggedIn">
			<input id="shared-link" type="text" v-model="currentUrl" placeholder="Shared Link URL">
			<input id="shared-link-name" type="text" v-model="currentUrlTitle" placeholder="Database Name">
			<a class="waves-effect waves-light btn" @click="addLink">Add URL Source</a>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@import "../styles/settings.scss";
.examples {
	font-size: 13px;
}
.url-form {
  margin-top: 15px;
  &.shared-link-box {
		display: flex;
		justify-content: space-between;
		align-content: stretch;
		input {
			width: 25%;
			margin-right: 8px;
			margin-bottom: 5px;
		}
		input#shared-link {
			width: 48%;
		}
  }
}
</style>
