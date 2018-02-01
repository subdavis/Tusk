<template>
	<div>
		<p>Page info</p>
		<p>Page safety info</p>
		<p>whatever</p>
	</div>
</template>

<script>
	export default {
		props: {
			messages: Object,
			isUnlocked: Boolean
		}
	}
</script>

<style lang="scss">
	@import "../styles/settings.scss";
	p {
		width: 100%;
		margin: 10px 0px 0px 0px;
	}
</style>