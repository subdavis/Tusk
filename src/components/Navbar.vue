<template>
  <div class="box-bars between">
  	<span class="selectable menu-option" v-for="route in routes">{{ route.name }}</span>
  </div>
</template>

<script>
export default {
	props: {
		routes: Array
	}
}
</script>

<style lang="scss">
@import "../styles/settings.scss";
</style>