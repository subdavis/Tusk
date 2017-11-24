<template>
	<nav class="nav-extended">
    <div class="nav-content">
      <ul class="tabs tabs-transparent">
        <li v-for="route in routes" class="tab">
        	<a href="#" @click="$router.route(route.route)">{{ route.name }}</a>
        </li>
      </ul>
    </div>
  </nav>
<!--   <div class="box-bar medium between" id="navbar">
  	<span class="selectable menu-option" v-for="route in routes">{{ route.name }}</span>
  </div> -->
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

#navbar {
}
</style>