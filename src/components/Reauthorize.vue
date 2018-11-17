<script>
export default {
	props: {
		settings: Object,
		providers: Array
	},
	data() {
		return {
			provider: {},
			done: false,
			fail: false
		}
	},
	methods: {
		launchAuth() {
			this.provider.login().then(nil => {
				this.done = true
			}).catch(err => {
				this.fail = true
			})
		}
	},
	mounted() {
		let provider_key = this.$router.getRoute().provider;
		this.providers.forEach(p => {
			if (p.key === provider_key)
				this.provider = p
		})
	}
}
</script>

<template lang="pug">
div
	.box-bar.roomy
		h4 Reauthorize {{ provider.title }}
		p 
			| The authorization token for {{ provider.title }} has expired and Tusk was unable to refresh it. 
			| Please reauthorize below to continue to use Tusk with your database from {{ provider.title }}.
	.box-bar.roomy.lighter
		a.waves-effect.waves-light.btn(@click='launchAuth') Authorize {{ provider.title }}
	.box-bar.roomy.plain(v-if='done')
		h4
			i.fa.fa-check(aria-hidden='true')
			|	Success
		p
			| You can
			b close this page
			| and continue to use Tusk by clicking on the popup icon.
	.box-bar.roomy.plain(v-if='fail && !done')
		h4
			i.fa.fa-times(aria-hidden='true')
			| Error
		p It looks like something went wrong during the re-authorization process. Please try again.
</template>

<style lang="scss">
@import "../styles/settings.scss";
.json {
	font-size: 12px;
}

h4 {
	font-size: 24px;
}
</style>