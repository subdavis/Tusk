<script>
import { parseUrl } from '$lib/utils.js'
export default {
	props: {
		entry: {
			type: Object,
			required: true,
		},
	},
	computed: {
		header: function () {
			if (this.entry.title.length > 0)
				return this.entry.title
			return this.entry.url
		}
	},
	watch: {
		// When the element becomes active, scroll it into view.
		'entry.view_is_active': function (val) {
			if (val)
				this.$el.scrollIntoView({
					block: "end",
					inline: "nearest",
					behavior: "smooth"})
		}
	},
	methods: {
		details(e) {
			this.$router.route("/entry-details/" + this.entry.id)
		},
		autofill(e) {
			e.stopPropagation()
			console.log("autofill")
			this.$emit('autofill')
		},
		copy(e) {
			e.stopPropagation()
			console.log("copy")
			this.$emit('copy')
		}
	}
}
</script>

<template lang="pug">
.entry-list-item.selectable.between.flair(
		:class='{ active: entry.view_is_active }',
		v-on:click='details')
  .text-info(:class='{ strike: entry.is_expired }')
    span.header {{ header }}
    br
    span.user {{ entry.userName || 'empty' }}
  .buttons
    span.fa-stack.copy(v-on:click='copy')
      i.fa.fa-circle.fa-stack-2x
      i.fa.fa-clipboard.fa-stack-1x.fa-inverse
    span.fa-stack.autofill(v-on:click='autofill')
      i.fa.fa-circle.fa-stack-2x
      i.fa.fa-magic.fa-stack-1x.fa-inverse
</template>

<style lang="scss">
@import "../styles/settings.scss";
.entry-list-item {
  transition: all 0.3s ease;
  width: 100%;
  padding: 10px $wall-padding;
  box-sizing: border-box;
  border-bottom: 1px solid $light-gray;
  background-color: #fff;
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
    opacity: 0.2;
  }
  .copy:hover,
  .autofill:hover {
    opacity: 0.8;
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