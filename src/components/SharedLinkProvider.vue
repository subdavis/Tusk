<!-- 
	SharedLinkProvider:
	Simple http provider that can also handle Dropbox Shared Links
-->
<template>
  <div class="box-bar roomy database-manager">
  	<div class="between">
	  	<div class="title">
	  		<span><svg class="icon" viewBox="0 0 1 1"><use v-bind="{'xlink:href':'#'+providerManager.icon}"/></svg> {{ providerManager.chooseTitle }}</span>
	  		<span v-for="db in databases" class="chip">{{ db.title }}</span>
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
  </div>
</template>

<script>
export default {
	data () {
		return {
			busy: false,
			databases: [],
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
	},
	mounted () {
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
}
</style>