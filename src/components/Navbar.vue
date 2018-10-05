<!-- 
  Navbar:
  requires a lib/VirtualRouter, and the routes object used to initialize the virtualrouter.
  Active tab changes automatically based on visible route.
-->
<script>
export default {
	props: {
		routes: Array,
		initialTab: String
	}
}
</script>

<template>
	<nav class="nav-extended">
		<div class="nav-content">
			<ul class="tabs tabs-transparent">
				<!-- set class like /advanced-active-listener so the router can set -->
				<li v-for="route in routes" v-if="!route.hidden_from_navbar" class="tab" :class="{ active: (route.var.visible) }">
					<a @click="$router.route(route.route)">{{ route.name }}</a>
				</li>
			</ul>
		</div>
	</nav>
</template>

<style lang="scss">
@import "../styles/settings.scss";
nav {
  position: fixed;
  top: 0px;
  z-index: 100;
  .nav-content {
    width: $options-width;
    margin: 0px auto;
    li.active {
      border-bottom: 3px solid $background-color;
    }
  }
}
</style>