<!-- 
	SharedLinkProvider:
	Simple http provider that can also handle Dropbox Shared Links
-->
<template>
  <div class="box-bar roomy database-manager">
  	<div class="between">
	  	<div class="title">
	  		<span><svg class="icon" viewBox="0 0 1 1"><use v-bind="{'xlink:href':'#'+providerManager.icon}"/></svg> {{ providerManager.chooseTitle }}</span>
	  		<span v-for="link in links" class="chip">{{ link.title }}</span>
	  		<span class="error" v-if="messages.error">{{messages.error}}</span>
	  	</div>
	  	<div>
	  		<div class="switch">
			    <label>
			      {{ busy ? 'busy' : (loggedIn ? 'Enabled' : 'Disabled') }}
			      <input :disabled="busy" type="checkbox" v-model="loggedIn" @click="toggleLogin">
			      <span class="lever"></span>
			    </label>
			  </div>
			</div>
		</div>
		<div class="description">{{ providerManager.chooseDescription }}</div>
		<div class="url-form shared-link-box">
		  <input id="shared-link" type="text" v-model="currentUrl" placeholder="Shared Link URL"> 
		  <input id="shared-link-name" type="text" v-model="currentUrlTitle" placeholder="Database Name">
		  <input type='submit' value="Add Shareable Link" @click="addLink">
		</div>
  </div>
</template>

<script>
export default {
	data () {
		return {
			busy: false,
			currentUrl: "",
			currentTitle: "",
			links: [],
			loggedIn: false,
			loggedIn: false,
			messages: {
				error: ""
			}
		}
	},
	props: {
		providerManager: Object 
	},
	methods: {
		toggleLogin () {
			if (this.loggedIn)
				this.providerManager.logout()
			else
				this.providerManager.login()
		},
		addLink () {

			/* 
			 * SharedURL Object:
			 */

			var SharedUrl = function(url, title){
				this.url = url;
				this.direct_link = url;
				this.title = title;
				let a = document.createElement("a"); a.href=url;
				this.origin = a.hostname;
				this.processSpecialSources();
			}
			SharedUrl.prototype.isValid = function() {
				if (this.direct_link && this.title){
					let parsed = parseUrl(this.direct_link);
					if (parsed){
						let lastchar = this.direct_link.charAt(this.direct_link.length-1);
						if (lastchar != "/" && parsed.pathname.length == 1){
							this.messages.error = "URL must include file path. (eg. http://example.com is invalid, but http://example.com/file.ckp is valid.)"
							return false;
						}
						return parsed.pathname.length;
					}
					this.messages.error = "Link URL is not valid."
				}
				this.messages.error = "Link or Title Missing";
				return false;
			}
			// Support Dropbox, and any other cloud host where 
			// direct download links _can_ be made but are not the same as their
			// respective shared urls.
			SharedUrl.prototype.processSpecialSources = function(){
				let googleGenerator = function(url){
					let id = getParameterByName("id", url);
					if (id)
						return "https://docs.google.com/uc?export=download&id=" + id;
					throw "Invalid Google Drive Shared Link";
				};
				let dropboxGenerator = function(url){
					let path = url.split('/s/');
					if (path.length != 2)
						throw "Invalid Dropbox Shared Link";
					return "https://dl.dropboxusercontent.com/s/" + path[1];
				};
				let generatorMap = {
					"drive.google.com": googleGenerator,
					"www.dropbox.com": dropboxGenerator
				};
				for (origin in generatorMap){
					if (this.origin.toLowerCase() == origin){
						this.direct_link = generatorMap[origin](this.url);
						break;
					}
				}
			}

			/* 
			 * MAIN addLink
			 */

			// try to parse the url..
			let lnk = new SharedUrl(this.currentUrl, this.currentUrlTitle);
			if (lnk.isValid()){
				this.messages.error = "";
				// go ahead and request permissions.  There isn't a good way to ask from the popup screen...
				this.busy = true;
				chromePromise.permissions.request({
		  		origins: [lnk.direct_link] //FLAGHERE TODO
		  	}).then(function(){
		  		// on accepted
		  		this.busy = false;
					this.links.push(lnk);
					this.providerManager.setUrls(this.links);
		  	}, function(reason){
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
	  getParameterByName (name, url) {
	    if (!url) url = window.location.href;
	    name = name.replace(/[\[\]]/g, "\\$&");
	    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	        results = regex.exec(url);
	    if (!results) return null;
	    if (!results[2]) return '';
	    return decodeURIComponent(results[2].replace(/\+/g, " "));
	  },
	  parseUrl () {
		  var a = document.createElement('a');
		  return function (url) {
		    a.href = url;
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
		}
	},
	mounted () {
		this.providerManager.isLoggedIn().then(loggedIn => {
			this.loggedIn = loggedIn
		})
	}
}
</script>

<style lang="scss">
@import "../styles/settings.scss";
.database-manager {
	background-color: $light-background-color;

	.error {
		font-size: 12px;
	}

	svg {
    width: 18px;
    vertical-align: middle;
  }
  .chip {
		height: 24px;
		line-height: 24px;
		font-size: 11px;
	}
	.description {
		font-size: 12px;
		font-color: $dark-background-color;
	}
	.switch {
		min-width: 122px;
	}
	.between {
		line-height: 36px;
	}

	.url-form {
	  &.shared-link-box {
	    display: -webkit-flex;
	    display: flex;
	    -webkit-align-items: space-between;
	    align-items: space-between;
	    -webkit-justify-content:space-between;
	    justify-content: space-between;
	    -webkit-align-content: stretch;
	    align-content: stretch;

	    input {
	      width: 25%;
	    }
	    input#shared-link {
	      width: 48%;
	    }
	  }
	}
}
</style>