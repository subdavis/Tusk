<template>
	<div class="entry-list-item selectable between flair" v-bind:class="{ active: entry.view_is_active }" v-on:click="details">
		<div class="text-info" v-bind:class="{ strike: entry.is_expired }">
			<span class="header">{{ header }}</span>
			<br>
			<span class="user">
        {{ entry.userName || '&#60;empty&#62;' }}
      </span>
		</div>
		<div class="buttons">
			<span class="fa-stack copy" v-on:click="copy">
        <i class="fa fa-circle fa-stack-2x"></i>
        <i class="fa fa-clipboard fa-stack-1x fa-inverse"></i>
      </span>
			<span class="fa-stack autofill" v-on:click="autofill">
        <i class="fa fa-circle fa-stack-2x"></i>
        <i class="fa fa-magic fa-stack-1x fa-inverse"></i>
      </span>
		</div>
	</div>
</template>
`
<script>
	export default {
		props: {
			entry: Object,
			unlockedState: Object
		},
		computed: {
			header: function() {
				if (this.entry.title.length > 0)
					return this.entry.title
				return this.entry.url
			}
		},
		watch: {
			// When the element becomes active, scroll it into view.
			entry: function(val) {
				if (val.view_is_active){
					this.$el.scrollIntoView({
						block: "end", 
						inline: "nearest", 
						behavior: "smooth"});
				}
			}
		},
		methods: {
			details(e) {
				this.$router.route("/entry-details/" + this.entry.id)
			},
			autofill(e) {
				e.stopPropagation()
				console.log("autofill")
				this.unlockedState.autofill(this.entry);
			},
			copy(e) {
				e.stopPropagation()
				console.log("copy")
				this.unlockedState.copyPassword(this.entry);
			},
			parseUrl(url) {
				url = url.indexOf('http') < 0 ? 'http://' + url : url
				let a = document.createElement('a')
				a.href = url
				return a
			}
		}
	}
</script>

<style lang="scss">
	@import "../styles/settings.scss";
	.entry-list-item {
		transition: all .3s ease;
		width: 100%;
		padding: 10px $wall-padding;
		box-sizing: border-box;
		border-bottom: 1px solid $light-gray;
		background-color: #FFF;
		display: flex;
		.header {
			font-size: 16px;
		}
		.user {
			font-size: 12px;
		}
		.buttons {
			font-size: 18px;
			display: flex;
			justify-content: space-between;
			box-sizing: border-box;
			min-width: 80px;
		}
		.copy,
		.autofill {
			opacity: .2;
		}
		.copy:hover,
		.autofill:hover {
			opacity: .8;
		}
		&.active {
			background-color: $highlighted;
			padding-left: 20px;
		}
	}

	.strike {
		text-decoration: line-through;
	}
</style>