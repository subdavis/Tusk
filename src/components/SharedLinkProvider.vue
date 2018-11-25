<!-- 
	SharedLinkProvider:
	Simple http provider that can also handle Dropbox Shared Links
-->
<script>
import {
	ChromePromiseApi
} from '$lib/chrome-api-promise.js'
import GenericProviderUi from '@/components/GenericProviderUi'
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
				this.providerManager.logout().then(() => {
					this.loggedIn = false
				})
			} else {
				this.providerManager.login().then(() => {
					this.loggedIn = true
				})
			}
		},
		removeLink(index) {
			if (index !== undefined)
				if (index >= 0)
					this.links.splice(index, 1)
			this.providerManager.setUrls(this.links)
		},
		addLink() {

			/* 
			 * SharedURL Object:
			 * This code is pretty low quality and LoC could probably be reduced.
			 * However, it works for now.
			 * TODO: Make this better...
			 */
			var that = this;
			var SharedUrl = function (url, title) {
				this.url = url;
				this.direct_link = url;
				this.title = title;
				let a = document.createElement("a");
				a.href = url;
				this.origin = a.hostname;
				this.processSpecialSources();
			}
			SharedUrl.prototype.isValid = function () {
				if (this.direct_link && this.title) {
					let parsed = this.parseUrl(this.direct_link);
					if (parsed) {
						let lastchar = this.direct_link.charAt(this.direct_link.length - 1);
						if (lastchar != "/" && parsed.pathname.length == 1) {
							that.messages.error = "URL must include file path. (eg. http://example.com is invalid, but http://example.com/file.ckp is valid.)"
							return false;
						}
						return parsed.pathname.length;
					}
					that.messages.error = "Link URL is not valid."
				}
				that.messages.error = "Link or Title Missing";
				return false;
			}
			// Support Dropbox, and any other cloud host where 
			// direct download links _can_ be made but are not the same as their
			// respective shared urls.
			SharedUrl.prototype.processSpecialSources = function () {
				let googleGenerator = function (url) {
					let id = getParameterByName("id", url);
					if (id)
						return "https://docs.google.com/uc?export=download&id=" + id;
					throw "Invalid Google Drive Shared Link";
				};
				let dropboxGenerator = function (url) {
					let path = url.split('/s/');
					if (path.length != 2)
						throw "Invalid Dropbox Shared Link";
					return "https://dl.dropboxusercontent.com/s/" + path[1];
				};
				let ownNextCloudGenerator = function (url) {
					let exclude = /\/[A-Za-z0-9]{15}\/download/
					let matches = url.match(exclude) || []
					if (matches.length === 1)
						return url;
					else
						return url + "/download"
				};
				let generatorMap = {
					"drive.google.com": googleGenerator,
					"www.dropbox.com": dropboxGenerator,
					"\/[A-Za-z0-9]{15}\/?": ownNextCloudGenerator
				};
				for (var regx in generatorMap) {
					let matches = this.url.match(regx) || []
					if (matches.length) {
						this.direct_link = generatorMap[regx](this.url);
						break;
					}
				}
			}
			SharedUrl.prototype.parseUrl = function () {
				var a = document.createElement('a');
				a.href = this.direct_link;
				if (a.host && a.host != window.location.host)
					return {
						host: a.host,
						hostname: a.hostname,
						pathname: a.pathname,
						port: a.port,
						protocol: a.protocol,
						search: a.search,
						hash: a.hash
					};
				return false;
			}
			// END TODO

			/* 
			 * MAIN addLink
			 */

			// try to parse the url..
			let lnk = new SharedUrl(this.currentUrl, this.currentUrlTitle);
			if (lnk.isValid()) {
				this.messages.error = "";
				// go ahead and request permissions.  There isn't a good way to ask from the popup screen...
				this.busy = true;
				chromePromise.permissions.request({
					origins: [lnk.direct_link] //FLAGHERE TODO
				}).then(nil => {
					// on accepted
					this.busy = false;
					this.links.push(lnk);
					this.providerManager.setUrls(this.links);
				}, reason => {
					// on rejected
					this.busy = false;
					this.messages.error = reason.message;
				});
			}
		},

		/*
		 * Helper Methods...
		 */

		// https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
		getParameterByName(name, url) {
			if (!url) url = window.location.href;
			name = name.replace(/[\[\]]/g, "\\$&");
			var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
				results = regex.exec(url);
			if (!results) return null;
			if (!results[2]) return '';
			return decodeURIComponent(results[2].replace(/\+/g, " "));
		}
	},
	mounted() {
		this.providerManager.isLoggedIn().then(loggedIn => {
			this.loggedIn = loggedIn
		})
		this.providerManager.getUrls().then(links => {
			if (links !== false)
				this.links = links
		})
	}
}
</script>

<template>
	<div class="box-bar roomy database-manager">
		<generic-provider-ui :busy="busy" :databases="links" :loggedIn="loggedIn" :error="messages.error" :provider-manager="providerManager" :toggle-login="toggleLogin" :removeable="true" :remove-function="removeLink"></generic-provider-ui>
		<div class="url-form shared-link-box" v-if="loggedIn">
			<input id="shared-link" type="text" v-model="currentUrl" placeholder="Shared Link URL">
			<input id="shared-link-name" type="text" v-model="currentUrlTitle" placeholder="Database Name">
			<a class="waves-effect waves-light btn" @click="addLink">Add URL Source</a>
		</div>
	</div>
</template>

<style lang="scss" scoped>
@import "../styles/settings.scss";
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
    .btn {
      margin-top: 6px;
    }
  }
}
</style>