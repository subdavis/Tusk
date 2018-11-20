<script>
import { options_routes } from '@/routes'
export default {
	computed: {
		routes: () => options_routes,
	},
}
</script>

<template lang="pug">
nav
	.nav-content
		ul.left
			li(v-for="link in routes", :key="link.path", v-if="!link.hidden")
				router-link(:to="link.path") {{ link.name }}
</template>

<style lang="scss" scoped>
@import "../styles/settings.scss";
nav {
  position: fixed;
  top: 0px;
  z-index: 1;
	
  .nav-content {
    width: $options-width;
    margin: 0px auto;
    li.active {
      border-bottom: 3px solid $background-color;
    }
  }
}
</style>