<script>
export default {
	props: {
		message: String
	}
}
</script>

<template lang="pug">
.box-bar.selectable(@click="$router.go(-1)")
	span
		i.fa.fa-long-arrow-left(aria-hidden="true")
		=" "
		| {{ message }}
</template>

<style lang="scss">
@import "../styles/settings.scss";
</style>