<template>
	<nav class="nav-extended">
    <div class="nav-content">
      <ul class="tabs tabs-transparent">
        <li v-for="route in routes" class="tab" v-bind:class="{ active: (activeTab == route.route) }">
        	<a href="#" @click="setRoute(route.route)">{{ route.name }}</a>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script>
export default {
	props: {
		routes: Array,
    initialTab: String
	},
  data () {
    return {
      activeTab: this.initialTab
    }
  },
  methods: {
    setRoute (path) {
      this.activeTab = path
      this.$router.route(path)
    }
  }
}
</script>

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