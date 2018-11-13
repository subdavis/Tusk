<script>
export default {
	props: {
		providerManager: Object,
		busy: Boolean,
		databases: Array,
		error: String,
		loggedIn: Boolean,
		toggleLogin: Function,
		removeable: Boolean,
		removeFunction: Function
	}
};
</script>

<template lang="pug">
div
	.between
		.title
			span
				svg.icon(viewBox='0 0 1 1')
					use(v-bind="{'xlink:href':'#'+providerManager.icon}")
				|  {{ providerManager.chooseTitle }}
			span.error.pill(v-show='error.length') {{error}}
			span.chip(v-for='(db, index) in databases')
				| {{ db.title }}
				i.fa.fa-times-circle.selectable(v-if='removeable', aria-hidden='true', @click='removeFunction(index)')

		.switch
			label
				input(:disabled='busy', type='checkbox', :checked='loggedIn', @click='toggleLogin')
				span.lever
	.description {{ providerManager.chooseDescription }}
</template>